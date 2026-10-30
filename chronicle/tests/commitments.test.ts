/**
 * #17 commitments-watch — 기업 약속 페이지 diff 검증 (probe 기반 철거 감지).
 * 200 파싱·UA 전송·404/410 철거=소멸·403/5xx/네트워크=삭제보류·전원실패 중단·
 * 중복 id 가드·적합성 킷 + 파이프라인(문구 변경=이벤트, 문서 철거=삭제).
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
const OPENAI = "https://openai.com/policies/usage-policies/";
const GOOGLE = "https://ai.google/responsibility/principles/";

const config: SourceConfig = {
  id: "commitments-watch",
  family: "page-text",
  title: "기업 약속 diff",
  user_agent: "chronicle-test-UA/9.9",
  targets: [
    { id: "commitment:openai:usage-policies", url: OPENAI },
    { id: "commitment:google:ai-principles", url: GOOGLE },
  ],
};

function page(body: string): string {
  return `<html><head><style>.x{}</style></head><body><nav>메뉴</nav><main>${body}</main></body></html>`;
}

/** url → {status, body} 또는 "throw"(네트워크 오류). probe로 상태코드를 노출. */
type Route = { status: number; body?: string } | "throw";
function fakeHttp(routes: () => Record<string, Route>, seenUA?: string[]): HttpClient {
  return {
    probe: async (url, init) => {
      if (seenUA) seenUA.push((init?.headers as Record<string, string> | undefined)?.["User-Agent"] ?? "");
      const r = routes()[url];
      if (r === undefined || r === "throw") throw new Error(`ECONNREFUSED ${url}`);
      return new Response(r.body ?? "", { status: r.status });
    },
    text: async () => {
      throw new Error("commitments는 probe를 써야 한다");
    },
    json: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ok = (body: string): Route => ({ status: 200, body: page(body) });
const routes = (): Record<string, Route> => ({
  [OPENAI]: ok("금지: 무기 개발, 군사 용도, 감시."),
  [GOOGLE]: ok("우리는 AI를 책임감 있게 개발합니다."),
});
const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

test("200 파싱 + 전문 텍스트/해시 + 실브라우저 UA 전송(probe)", async () => {
  const seenUA: string[] = [];
  const result = await adapter.collect(ctx(fakeHttp(routes, seenUA)));
  assert.equal(result.records.length, 2);
  const openai = result.records.find((r) => r.entityId === "commitment:openai:usage-policies")!;
  assert.match(String(openai.fields.text), /무기 개발.*군사 용도/);
  assert.ok(!String(openai.fields.text).includes("<"), "태그 제거됨");
  assert.ok(/^[0-9a-f]{64}$/.test(String(openai.fields.text_sha256)));
  assert.ok(seenUA.length > 0 && seenUA.every((ua) => ua === "chronicle-test-UA/9.9"), "config UA 전송");
});

test("403/5xx/네트워크 오류는 삭제 보류(removalScope 제외), 200은 정상", async () => {
  const mixed = (): Record<string, Route> => ({ [OPENAI]: ok("정책"), [GOOGLE]: { status: 503 } });
  const result = await adapter.collect(ctx(fakeHttp(mixed)));
  assert.ok(result.records.some((r) => r.entityId.includes("openai")), "openai 정상");
  assert.ok(!result.records.some((r) => r.entityId.includes("google")), "503 google 레코드 없음");
  assert.equal(result.removalScope!({ entityId: "commitment:google:ai-principles", sourceUrl: "u", fields: {} }), false, "일시 실패는 삭제 보류");
  assert.equal(result.removalScope!({ entityId: "commitment:openai:usage-policies", sourceUrl: "u", fields: {} }), true);
});

test("404/410 철거는 삭제로 확정(removalScope 포함)", async () => {
  const gone = (): Record<string, Route> => ({ [OPENAI]: ok("정책"), [GOOGLE]: { status: 404 } });
  const result = await adapter.collect(ctx(fakeHttp(gone)));
  assert.ok(!result.records.some((r) => r.entityId.includes("google")), "철거된 google 레코드 없음");
  assert.equal(result.removalScope!({ entityId: "commitment:google:ai-principles", sourceUrl: "u", fields: {} }), true, "철거는 삭제 대상");
});

test("전원 일시실패는 중단, 단 하나라도 철거(404) 확인이면 중단하지 않는다", async () => {
  await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => ({ [OPENAI]: "throw", [GOOGLE]: { status: 503 } })))), /전부 페치 실패/);
  // openai 철거(404) + google 네트워크 실패 → 철거를 관측했으므로 중단하지 않음
  const result = await adapter.collect(ctx(fakeHttp(() => ({ [OPENAI]: { status: 404 }, [GOOGLE]: "throw" }))));
  assert.equal(result.records.length, 0);
  assert.equal(result.removalScope!({ entityId: "commitment:openai:usage-policies", sourceUrl: "u", fields: {} }), true, "철거 확정");
  assert.equal(result.removalScope!({ entityId: "commitment:google:ai-principles", sourceUrl: "u", fields: {} }), false, "네트워크 실패는 보류");
});

test("중복 target id는 거부한다(entityId 충돌 방지)", async () => {
  const dupCfg: SourceConfig = { ...config, targets: [{ id: "dup", url: OPENAI }, { id: "dup", url: GOOGLE }] };
  await assert.rejects(() => adapter.collect({ config: dupCfg, http: fakeHttp(routes), log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") }), /중복 target id/);
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(routes)));
});

test("파이프라인: 문구 변경=이벤트, 문서 철거(404)=삭제, 일시실패는 삭제 아님", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-commitments-"));
  let current: Record<string, Route> = routes();
  const run = (isoNow: string) =>
    runOnce({ sourceId: "commitments-watch", root, dataDir, adapter, config, http: fakeHttp(() => current), now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-13T05:00:00.000Z");
  assert.equal(first.added, 2);

  // openai가 '군사 용도' 조항 삭제(변경) + google 페이지 철거(404 → 소멸)
  current = { [OPENAI]: ok("금지: 무기 개발, 감시."), [GOOGLE]: { status: 404 } };
  const second = await run("2026-07-20T05:00:00.000Z");
  assert.equal(second.changed, 2, "openai text + text_sha256");
  assert.equal(second.removed, 1, "google 철거(404)=소멸");
  const edit = second.events.find((e) => e.field === "text")!;
  assert.ok(!String(edit.after).includes("군사 용도"), "삭제된 조항이 after에서 사라짐");
  const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
  assert.equal(removal.entity_id, "commitment:google:ai-principles");

  // openai가 이번엔 503(일시) → 삭제되면 안 됨(마지막 상태 보존). google은 성공(전원실패 아님).
  current = { [OPENAI]: { status: 503 }, [GOOGLE]: ok("책임 AI 재등장") };
  const third = await run("2026-07-27T05:00:00.000Z");
  assert.equal(third.removed, 0, "openai 일시 실패는 삭제 오탐 아님(마지막 상태 보존)");
});
