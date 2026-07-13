/**
 * #17 commitments-watch — 기업 약속 페이지 diff 검증.
 * 다중 페이지 파싱·개별 실패 관용(삭제 오탐 방지)·전멸 중단·UA 전송·적합성 킷
 * + 파이프라인(문서 변경=필드 이벤트, 문서 소멸=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/commitments-watch/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "commitments-watch",
  family: "page-text",
  title: "기업 약속 diff",
  user_agent: "chronicle-test-UA/9.9",
  targets: [
    { id: "commitment:openai:usage-policies", url: "https://openai.com/policies/usage-policies/" },
    { id: "commitment:google:ai-principles", url: "https://ai.google/responsibility/principles/" },
  ],
};

function page(body: string): string {
  return `<html><head><style>.x{}</style></head><body><nav>메뉴</nav><main>${body}</main></body></html>`;
}

function fakeHttp(pages: () => Record<string, string>, down: () => Set<string> = () => new Set(), seenUA?: string[]): HttpClient {
  return {
    text: async (url, init) => {
      if (seenUA) seenUA.push((init?.headers as Record<string, string> | undefined)?.["User-Agent"] ?? "");
      for (const d of down()) if (url.includes(d)) throw new Error(`403 ${url}`);
      const body = pages()[url];
      if (body === undefined) throw new Error(`404 ${url}`);
      return body;
    },
    json: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

const routes = (): Record<string, string> => ({
  "https://openai.com/policies/usage-policies/": page("금지: 무기 개발, 군사 용도, 감시."),
  "https://ai.google/responsibility/principles/": page("우리는 AI를 책임감 있게 개발합니다."),
});

test("다중 페이지 파싱 + 전문 텍스트/해시 + 실브라우저 UA 전송", async () => {
  const seenUA: string[] = [];
  const result = await adapter.collect(ctx(fakeHttp(routes, () => new Set(), seenUA)));
  assert.equal(result.records.length, 2);
  const openai = result.records.find((r) => r.entityId === "commitment:openai:usage-policies")!;
  assert.match(String(openai.fields.text), /무기 개발.*군사 용도/);
  assert.ok(!String(openai.fields.text).includes("<"), "태그 제거됨");
  assert.ok(/^[0-9a-f]{64}$/.test(String(openai.fields.text_sha256)));
  assert.ok(seenUA.length > 0 && seenUA.every((ua) => ua === "chronicle-test-UA/9.9"), "config UA 전송");
});

test("개별 페이지 실패는 건너뛰고 removalScope에서 제외, 나머지는 정상", async () => {
  const result = await adapter.collect(ctx(fakeHttp(routes, () => new Set(["ai.google"]))));
  assert.ok(result.records.some((r) => r.entityId.includes("openai")), "openai는 정상");
  assert.ok(!result.records.some((r) => r.entityId.includes("google")), "google은 실패로 제외");
  assert.equal(result.removalScope!({ entityId: "commitment:google:ai-principles", sourceUrl: "u", fields: {} }), false);
  assert.equal(result.removalScope!({ entityId: "commitment:openai:usage-policies", sourceUrl: "u", fields: {} }), true);
});

test("전원 실패는 소스 장애로 중단", async () => {
  await assert.rejects(() => adapter.collect(ctx(fakeHttp(routes, () => new Set(["openai", "ai.google"])))), /전부 페치 실패/);
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(routes)));
});

test("파이프라인: 문구 변경=필드 이벤트, 페치실패=삭제 아님(관용), config 제외=삭제", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-commitments-"));
  let pages = routes();
  let cfg: SourceConfig = config;
  const run = (isoNow: string) =>
    runOnce({ sourceId: "commitments-watch", root, dataDir, adapter, config: cfg, http: fakeHttp(() => pages), now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-13T05:00:00.000Z");
  assert.equal(first.added, 2);

  // openai가 '군사 용도' 조항을 조용히 삭제(둘 다 건강) — 편집 이벤트
  pages = {
    "https://openai.com/policies/usage-policies/": page("금지: 무기 개발, 감시."), // '군사 용도' 삭제
    "https://ai.google/responsibility/principles/": routes()["https://ai.google/responsibility/principles/"],
  };
  const second = await run("2026-07-20T05:00:00.000Z");
  assert.equal(second.changed, 2, "openai 문구 변경 — text + text_sha256 두 필드");
  assert.equal(second.removed, 0);
  const edit = second.events.find((e) => e.field === "text")!;
  assert.equal(edit.entity_id, "commitment:openai:usage-policies");
  assert.ok(!String(edit.after).includes("군사 용도"), "삭제된 조항이 after에서 사라짐");

  // google 페치 실패(404) — 삭제 오탐 아님, 마지막 상태는 보존
  pages = { "https://openai.com/policies/usage-policies/": page("금지: 무기 개발, 감시.") };
  const third = await run("2026-07-27T05:00:00.000Z");
  assert.equal(third.removed, 0, "페치 실패는 삭제로 오탐하지 않는다(일시 장애 관용)");

  // google을 config 대상에서 제외 → 진짜 삭제(추적 중단 = 소멸 확정)
  cfg = { ...config, targets: [(config.targets as unknown[])[0]] };
  pages = routes();
  const fourth = await run("2026-08-03T05:00:00.000Z");
  assert.equal(fourth.removed, 1, "config 제외 = 진짜 삭제");
  const removal = fourth.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
  assert.equal(removal.entity_id, "commitment:google:ai-principles");
});
