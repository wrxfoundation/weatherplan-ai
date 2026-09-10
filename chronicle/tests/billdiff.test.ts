/**
 * #9 bill-diff — 국회 입법 diff 검증.
 * 열린국회정보 봉투 파싱·키워드 후필터·휴면(무키)·오류코드 자가진단(ERROR중단/INFO-200정상)
 * ·의안 무삭제 + 적합성 킷 + 파이프라인(신규 발의=생성, 처리상태 전환=필드 이벤트).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bill-diff/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "bill-diff",
  family: "api-records",
  title: "국회 입법 diff",
  endpoint: "https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn",
  key_env: "TEST_ASSEMBLY_KEY",
  key_param: "KEY",
  user_agent: "chronicle-test/0.1",
  page_size: 100,
  max_pages: 5,
  allow_empty: true,
  query: { Type: "json", AGE: "22" },
  keywords: ["인공지능", "개인정보"],
};

type Json = Record<string, unknown>;
const bill = (id: string, name: string, result: string): Json => ({
  BILL_ID: id,
  BILL_NO: `21000${id}`,
  BILL_NAME: name,
  RST_PROPOSER: "홍길동",
  COMMITTEE: "과학기술정보방송통신위원회",
  PROPOSE_DT: "2026-03-01",
  PROC_RESULT: result,
  AGE: "22",
});

const B1 = bill("B1", "인공지능 발전 기본법안", "계류");
const B2 = bill("B2", "도로교통법 일부개정법률안", "계류"); // 키워드 불일치 → 제외
const B3 = bill("B3", "개인정보 보호법 일부개정법률안", "계류");

function envelope(rows: Json[]): Json {
  return { nzmimeepazxkubdpn: [{ head: [{ list_total_count: rows.length }, { RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다." } }] }, { row: rows }] };
}
function errorEnvelope(code: string): Json {
  return { RESULT: { CODE: code, MESSAGE: "메시지" } };
}

function fakeHttp(rowsFor: () => Json[], opts: { page1?: Json } = {}): HttpClient {
  return {
    json: async (url) => {
      const page = Number(new URL(url).searchParams.get("pIndex") ?? "1");
      if (page === 1 && opts.page1) return opts.page1;
      return envelope(page === 1 ? rowsFor() : []);
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

function withKey(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved = process.env.TEST_ASSEMBLY_KEY;
    process.env.TEST_ASSEMBLY_KEY = "sk-assembly";
    try {
      await fn();
    } finally {
      if (saved === undefined) delete process.env.TEST_ASSEMBLY_KEY;
      else process.env.TEST_ASSEMBLY_KEY = saved;
    }
  };
}

test(
  "봉투 파싱 + 키워드 후필터 + 처리상태 필드",
  withKey(async () => {
    const result = await adapter.collect(ctx(fakeHttp(() => [B1, B2, B3])));
    assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["bill:B1", "bill:B3"], "B2(키워드 불일치) 제외");
    const b1 = result.records.find((r) => r.entityId === "bill:B1")!;
    assert.equal(b1.fields.name, "인공지능 발전 기본법안");
    assert.equal(b1.fields.result, "계류");
    assert.equal(b1.fields.committee, "과학기술정보방송통신위원회");
    // 의안은 삭제 판정하지 않는다
    assert.equal(result.removalScope!({ entityId: "bill:B1", sourceUrl: "u", fields: {} }), false);
  }),
);

test("무키 = 휴면(0건)", async () => {
  const result = await adapter.collect(ctx(fakeHttp(() => [B1])));
  assert.equal(result.records.length, 0);
});

test(
  "오류코드 자가진단: ERROR-*는 중단, INFO-200(데이터없음)은 정상 빈결과",
  withKey(async () => {
    await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => [B1], { page1: errorEnvelope("ERROR-300") }))), /API 오류/);
    const empty = await adapter.collect(ctx(fakeHttp(() => [B1], { page1: errorEnvelope("INFO-200") })));
    assert.equal(empty.records.length, 0, "INFO-200은 오류 아님");
  }),
);

test("적합성 킷을 통과한다", withKey(async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(() => [B1, B3])));
}));

test(
  "파이프라인: 신규 발의=생성, 처리상태 전환=필드 이벤트, 의안 무삭제",
  withKey(async () => {
    const dataDir = mkdtempSync(join(tmpdir(), "chronicle-billdiff-"));
    let rows: Json[] = [B1, B3];
    const run = (iso: string) =>
      runOnce({ sourceId: "bill-diff", root, dataDir, adapter, config, http: fakeHttp(() => rows), now: () => new Date(iso), log: () => {} });

    const first = await run("2026-07-13T05:00:00.000Z");
    assert.equal(first.added, 2);

    // B1 계류→가결 (처리상태 전환) + B3 목록에서 빠짐(삭제 판정 안 함)
    rows = [bill("B1", "인공지능 발전 기본법안", "원안가결")];
    const second = await run("2026-07-20T05:00:00.000Z");
    assert.equal(second.changed, 1, "B1 처리상태 전환");
    assert.equal(second.removed, 0, "의안 무삭제(목록 이탈≠소멸)");
    const evt = second.events.find((e) => e.field === "result")!;
    assert.equal(evt.entity_id, "bill:B1");
    assert.equal(evt.before, "계류");
    assert.equal(evt.after, "원안가결");
  }),
);
