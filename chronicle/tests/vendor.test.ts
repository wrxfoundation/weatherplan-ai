/**
 * #14 ai-vendor-ledger — OpenRouter 모델 원장 검증.
 * 엔티티·안정 필드·UA 헤더·형식 가드·적합성 킷 + 파이프라인(가격변경=필드이벤트,
 * 모델소멸=삭제, 신규=생성).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/ai-vendor-ledger/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "ai-vendor-ledger",
  family: "api-records",
  title: "AI 벤더 원장",
  endpoint: "https://openrouter.ai/api/v1/models",
  user_agent: "chronicle-test-agent/1.0",
};

interface Model {
  id: string;
  name: string;
  context_length: number;
  prompt: string;
  completion: string;
}

function response(models: Model[]) {
  return {
    data: models.map((m) => ({
      id: m.id,
      name: m.name,
      created: 1_700_000_000,
      description: "마케팅 문구 — 자주 바뀌지만 tracked 아님",
      context_length: m.context_length,
      architecture: { modality: "text->text", tokenizer: "GPT" },
      pricing: { prompt: m.prompt, completion: m.completion, request: "0", image: "0" },
      supported_parameters: ["temperature"],
    })),
  };
}

function fakeHttp(data: () => unknown): HttpClient & { seen: RequestInit[] } {
  const seen: RequestInit[] = [];
  return {
    seen,
    json: async (_url, init) => {
      seen.push(init ?? {});
      return data();
    },
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-10T00:00:00Z") });

const claude = { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", context_length: 200000, prompt: "0.000003", completion: "0.000015" };
const gpt = { id: "openai/gpt-4o", name: "GPT-4o", context_length: 128000, prompt: "0.0000025", completion: "0.00001" };

test("모델을 엔티티로, 안정 필드만 tracked (UA 헤더 전송)", async () => {
  const http = fakeHttp(() => response([claude, gpt]));
  const result = await adapter.collect(ctx(http));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["model:anthropic/claude-3.5-sonnet", "model:openai/gpt-4o"]);
  const c = result.records.find((r) => r.entityId.includes("claude"))!;
  assert.equal(c.fields.context_length, 200000);
  assert.equal(c.fields.price_prompt, "0.000003");
  assert.equal(c.fields.modality, "text->text");
  assert.equal(c.fields.description, undefined, "마케팅 문구는 tracked 아님");
  assert.equal(new Headers(http.seen[0]?.headers).get("user-agent"), "chronicle-test-agent/1.0");
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(() => response([claude, gpt]))));
});

test("무인증 JSON이 아니면 즉시 중단한다", async () => {
  await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => "<html>Just a moment... (Cloudflare)</html>"))), /응답 형식이 아닙니다/);
  await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => ({ error: "x" })))), /응답 형식이 아닙니다/);
});

test("파이프라인: 가격 변경=필드 이벤트, 모델 폐기=삭제, 신규=생성", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-vendor-"));
  let models: Model[] = [claude, gpt];
  const http = fakeHttp(() => response(models));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "ai-vendor-ledger", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-12T20:07:00.000Z");
  assert.equal(first.added, 2);

  // 앤트로픽 가격 인하 + 신규 모델 등장 + GPT-4o 폐기(목록 소멸)
  models = [
    { ...claude, prompt: "0.0000025" },
    { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", context_length: 1000000, prompt: "0.0000001", completion: "0.0000004" },
  ];
  const second = await run("2026-07-19T20:07:00.000Z");
  assert.equal(second.added, 1, "Gemini 신규");
  assert.equal(second.removed, 1, "GPT-4o 폐기");
  assert.equal(second.changed, 1, "Claude 가격 인하 (price_prompt)");

  const priceEvent = second.events.find((e) => e.field === "price_prompt")!;
  assert.equal(priceEvent.before, "0.000003");
  assert.equal(priceEvent.after, "0.0000025");
  const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
  assert.equal(removal.entity_id, "model:openai/gpt-4o");
});
