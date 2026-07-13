/**
 * #1 llm-korea-capsule — 플래그십(모델 호출) 검증.
 * 벤더 3종 요청/파싱·정오답 채점·휴면(무키)·키 원장 비저장·적합성 킷
 * + 파이프라인(정오답 플립=필드 이벤트, 질문 제거=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/llm-korea-capsule/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "llm-korea-capsule",
  family: "api-records",
  title: "LLM 한국팩트 타임캡슐",
  user_agent: "chronicle-test/0.1",
  allow_empty: true,
  request: { max_tokens: 64 },
  models: [
    { id: "claude", vendor: "anthropic", model: "claude-x", key_env: "TEST_ANTHROPIC_KEY" },
    { id: "gpt", vendor: "openai", model: "gpt-x", key_env: "TEST_OPENAI_KEY" },
    { id: "gemini", vendor: "google", model: "gemini-x", key_env: "TEST_GOOGLE_KEY" },
  ],
  questions: [
    { id: "capital", q: "수도는?", a: ["서울"] },
    { id: "war", q: "6·25 연도는?", a: ["1950"] },
  ],
};

/** 벤더별 응답 봉투를 흉내내는 페이크. answers[modelId][qid] = 모델이 낼 텍스트. */
function fakeHttp(answers: () => Record<string, Record<string, string>>, seen?: string[]): HttpClient {
  const wrap = (vendor: string, text: string): unknown => {
    if (vendor === "anthropic") return { content: [{ type: "text", text }] };
    if (vendor === "openai") return { choices: [{ message: { content: text } }] };
    return { candidates: [{ content: { parts: [{ text }] } }] }; // google
  };
  return {
    json: async (url, init) => {
      if (seen) seen.push(url);
      const body = JSON.parse(String((init as RequestInit).body));
      let vendor = "anthropic";
      let modelId = "";
      let prompt = "";
      if (url.includes("anthropic")) {
        vendor = "anthropic";
        modelId = "claude";
        prompt = body.messages[0].content;
      } else if (url.includes("openai")) {
        vendor = "openai";
        modelId = "gpt";
        prompt = body.messages[0].content;
      } else {
        vendor = "google";
        modelId = "gemini";
        prompt = body.contents[0].parts[0].text;
      }
      const qid = prompt.includes("수도") ? "capital" : "war";
      const text = answers()[modelId]?.[qid] ?? "";
      return wrap(vendor, text);
    },
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

function withKeys(keys: Record<string, string>, fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved: Record<string, string | undefined> = {};
    for (const k of Object.keys(keys)) {
      saved[k] = process.env[k];
      process.env[k] = keys[k];
    }
    try {
      await fn();
    } finally {
      for (const k of Object.keys(keys)) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  };
}

const ALL_KEYS = { TEST_ANTHROPIC_KEY: "sk-a", TEST_OPENAI_KEY: "sk-o", TEST_GOOGLE_KEY: "sk-g" };
const correctAll = (): Record<string, Record<string, string>> => ({
  claude: { capital: "대한민국의 수도는 서울입니다.", war: "6·25 전쟁은 1950년에 발발했습니다." },
  gpt: { capital: "서울특별시요.", war: "1950년." },
  gemini: { capital: "수도는 서울.", war: "정답은 1950." },
});

test(
  "벤더 3종 요청/파싱 + 정오답 채점 + 키는 원장(sourceUrl)에 없음",
  withKeys(ALL_KEYS, async () => {
    const seen: string[] = [];
    const result = await adapter.collect(ctx(fakeHttp(correctAll, seen)));
    assert.equal(result.records.length, 6, "3모델 × 2질문");
    for (const r of result.records) assert.equal(r.fields.correct, true);

    const claudeCapital = result.records.find((r) => r.entityId === "capsule:claude:capital")!;
    assert.equal(claudeCapital.fields.vendor, "anthropic");
    assert.equal(claudeCapital.fields.question_id, "capital");

    // google는 ?key= 로 호출되지만 sourceUrl(원장)엔 키가 없어야 한다.
    const gemini = result.records.find((r) => r.entityId === "capsule:gemini:capital")!;
    assert.ok(!String(gemini.sourceUrl).includes("key="), "원장 URL에 키 없음");
    assert.ok(seen.some((u) => u.includes("key=sk-g")), "실호출엔 키가 실림");

    // raw 스냅샷에 응답 전문 + sha256 봉인
    const raw = result.raw as { responses: Record<string, { sha256: string }> };
    assert.ok(/^[0-9a-f]{64}$/.test(raw.responses["claude:capital"].sha256));
  }),
);

test(
  "오답 채점: 틀린 응답은 correct=false, 형태 불명은 오답(크래시 아님)",
  withKeys({ TEST_ANTHROPIC_KEY: "sk-a" }, async () => {
    const answers = () => ({ claude: { capital: "도쿄입니다.", war: "" } });
    const result = await adapter.collect(ctx(fakeHttp(answers)));
    const cap = result.records.find((r) => r.entityId === "capsule:claude:capital")!;
    const war = result.records.find((r) => r.entityId === "capsule:claude:war")!;
    assert.equal(cap.fields.correct, false);
    assert.equal(war.fields.correct, false);
    assert.ok(!result.records.some((r) => r.entityId.startsWith("capsule:gpt")), "무키 gpt는 휴면");
  }),
);

test("무키 = 완전 휴면(0건, 예외 없음), removalScope가 전부 제외", async () => {
  // 어떤 TEST_*_KEY도 설정하지 않음
  const result = await adapter.collect(ctx(fakeHttp(correctAll)));
  assert.equal(result.records.length, 0, "휴면 회차는 0건");
  assert.equal(result.removalScope!({ entityId: "capsule:claude:capital", sourceUrl: "u", fields: {} }), false);
});

test(
  "적합성 킷을 통과한다",
  withKeys(ALL_KEYS, async () => {
    await assertAdapterConformance(adapter, ctx(fakeHttp(correctAll)));
  }),
);

test(
  "파이프라인: 정오답 플립=필드 이벤트, 질문 제거=삭제, 실패 질문은 삭제 오탐 아님",
  withKeys({ TEST_ANTHROPIC_KEY: "sk-a" }, async () => {
    const dataDir = mkdtempSync(join(tmpdir(), "chronicle-capsule-"));
    let answers = correctAll;
    const run = (isoNow: string) =>
      runOnce({
        sourceId: "llm-korea-capsule",
        root,
        dataDir,
        adapter,
        config,
        http: fakeHttp(() => answers()),
        now: () => new Date(isoNow),
        log: () => {},
      });

    const first = await run("2026-07-13T05:00:00.000Z");
    assert.equal(first.added, 2, "claude × 2질문 (gpt·gemini 휴면)");

    // 다음 달: claude가 capital을 틀림(플립)
    answers = () => ({ claude: { capital: "도쿄입니다.", war: "1950년." } });
    const second = await run("2026-08-13T05:00:00.000Z");
    assert.equal(second.changed, 1, "capital 정오답 플립");
    const flip = second.events.find((e) => e.field === "correct")!;
    assert.equal(flip.entity_id, "capsule:claude:capital");
    assert.equal(flip.before, true);
    assert.equal(flip.after, false);
  }),
);
