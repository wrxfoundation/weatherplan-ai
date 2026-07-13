/**
 * #7 sangwon-chronicle — 상권 생멸 검증.
 * JSON 봉투 파싱·다중 상권·휴면(무키)·오류응답 중단·부분수집 삭제보류·적합성 킷
 * + 파이프라인(신규 상가=생성, 폐업=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/sangwon-chronicle/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "sangwon-chronicle",
  family: "api-records",
  title: "상권 생멸",
  endpoint: "http://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius",
  key_env: "TEST_SANGWON_KEY",
  key_param: "serviceKey",
  user_agent: "chronicle-test/0.1",
  page_size: 100,
  max_pages: 5,
  max_removal_ratio: 1,
  query: { type: "json", radius: 500 },
  targets: [
    { id: "gangnam", cx: 127.0276, cy: 37.4979 },
    { id: "hongdae", cx: 126.924, cy: 37.5563 },
  ],
};

type Json = Record<string, unknown>;
const store = (id: string, name: string, cat: string): Json => ({
  bizesId: id,
  bizesNm: name,
  indsLclsNm: cat,
  indsMclsNm: "커피전문점",
  indsSclsNm: "카페",
  indsSclsCd: "I56201",
  adongNm: "역삼동",
  rdnmAdr: "서울 강남구 테헤란로",
  lon: "127.02",
  lat: "37.49",
});

const S1 = store("S1", "강남카페", "음식");
const S2 = store("S2", "사라질분식", "음식");
const S3 = store("S3", "홍대책방", "소매");

function targetId(cx: string | null): string {
  return cx === "127.0276" ? "gangnam" : "hongdae";
}

function fakeHttp(byTarget: () => Record<string, Json[]>, opts: { errorTargets?: Set<string> } = {}): HttpClient {
  return {
    json: async (url) => {
      const u = new URL(url);
      const tid = targetId(u.searchParams.get("cx"));
      if (opts.errorTargets?.has(tid)) return { header: { resultCode: "30", resultMsg: "SERVICE KEY IS NOT REGISTERED" }, body: {} };
      const page = Number(u.searchParams.get("pageNo") ?? "1");
      const items = page === 1 ? byTarget()[tid] ?? [] : [];
      return { header: { resultCode: "00", resultMsg: "NORMAL SERVICE" }, body: { items, totalCount: items.length, pageNo: page } };
    },
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const routes = (): Record<string, Json[]> => ({ gangnam: [S1, S2], hongdae: [S3] });
const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

function withKey(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved = process.env.TEST_SANGWON_KEY;
    process.env.TEST_SANGWON_KEY = "sk-sangwon";
    try {
      await fn();
    } finally {
      if (saved === undefined) delete process.env.TEST_SANGWON_KEY;
      else process.env.TEST_SANGWON_KEY = saved;
    }
  };
}

test(
  "JSON 봉투 파싱 + 다중 상권 + 필드/district 매핑",
  withKey(async () => {
    const result = await adapter.collect(ctx(fakeHttp(routes)));
    assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["store:S1", "store:S2", "store:S3"]);
    const s1 = result.records.find((r) => r.entityId === "store:S1")!;
    assert.equal(s1.fields.name, "강남카페");
    assert.equal(s1.fields.category_medium, "커피전문점");
    assert.equal(s1.fields.industry_code, "I56201");
    assert.equal(s1.fields.district, "gangnam");
    const s3 = result.records.find((r) => r.entityId === "store:S3")!;
    assert.equal(s3.fields.district, "hongdae");
  }),
);

test("무키 = 휴면(0건, removalScope 전부 제외)", async () => {
  const result = await adapter.collect(ctx(fakeHttp(routes)));
  assert.equal(result.records.length, 0);
  assert.equal(result.removalScope!({ entityId: "store:S1", sourceUrl: "u", fields: {} }), false);
});

test(
  "전 상권 오류=중단(자가진단), 일부 상권 실패=삭제판정 보류",
  withKey(async () => {
    await assert.rejects(
      () => adapter.collect(ctx(fakeHttp(routes, { errorTargets: new Set(["gangnam", "hongdae"]) }))),
      /전 상권 실패/,
    );
    const partial = await adapter.collect(ctx(fakeHttp(routes, { errorTargets: new Set(["hongdae"]) })));
    assert.ok(partial.records.some((r) => r.entityId === "store:S1"), "성공 상권은 정상");
    assert.ok(!partial.records.some((r) => r.entityId === "store:S3"), "실패 상권 없음");
    assert.equal(partial.removalScope!({ entityId: "store:S1", sourceUrl: "u", fields: {} }), false, "부분수집 = 삭제 보류");
  }),
);

test("적합성 킷을 통과한다", withKey(async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(routes)));
}));

test(
  "파이프라인: 신규 상가=생성, 폐업(소멸)=삭제",
  withKey(async () => {
    const dataDir = mkdtempSync(join(tmpdir(), "chronicle-sangwon-"));
    let data = routes();
    const run = (iso: string) =>
      runOnce({ sourceId: "sangwon-chronicle", root, dataDir, adapter, config, http: fakeHttp(() => data), now: () => new Date(iso), log: () => {} });

    const first = await run("2026-07-13T05:00:00.000Z");
    assert.equal(first.added, 3);

    // S2 폐업(소멸) + 강남에 신규 S4
    const S4 = store("S4", "새로핀꽃집", "소매");
    data = { gangnam: [S1, S4], hongdae: [S3] };
    const second = await run("2026-07-14T05:00:00.000Z");
    assert.equal(second.added, 1, "S4 신규");
    assert.equal(second.removed, 1, "S2 폐업");
    const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
    assert.equal(removal.entity_id, "store:S2");
  }),
);

/** pageNo 인지 단일 페이크. */
function pageHttp(bodyFor: (page: number) => Json): HttpClient {
  return {
    json: async (url) => bodyFor(Number(new URL(url).searchParams.get("pageNo") ?? "1")),
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

test(
  "findItems: 단일 결과가 배열이 아니라 객체로 와도 수집한다(data.go.kr 1건 케이스)",
  withKey(async () => {
    const http = pageHttp((p) => (p === 1 ? { header: { resultCode: "00" }, body: { items: { item: S1 } } } : { header: { resultCode: "00" }, body: { items: [] } }));
    const result = await adapter.collect(ctx(http));
    assert.ok(result.records.some((r) => r.entityId === "store:S1"), "단일 객체 파싱");
  }),
);

test(
  "NODATA 코드(03)는 오류가 아니라 빈 결과 — throw 없음",
  withKey(async () => {
    const http = pageHttp(() => ({ header: { resultCode: "03", resultMsg: "NODATA_ERROR" }, body: {} }));
    const result = await adapter.collect(ctx(http)); // rejects 아님
    assert.equal(result.records.length, 0);
  }),
);

test(
  "max_pages 소진(항상 꽉 찬 페이지)=부분수집 → 삭제판정 보류",
  withKey(async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ ...S1, bizesId: `F${i}` })); // = page_size
    const http = pageHttp(() => ({ header: { resultCode: "00" }, body: { items: full } }));
    const result = await adapter.collect(ctx(http));
    assert.equal(result.removalScope!({ entityId: "store:F0", sourceUrl: "u", fields: {} }), false, "부분수집이면 삭제 보류");
  }),
);
