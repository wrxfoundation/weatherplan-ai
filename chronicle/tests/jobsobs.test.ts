/**
 * #13 jobs-observatory — 워크넷 채용 관측소 검증.
 * XML·JSON 양쪽 파싱·엔티티·휴면(무키)·1페이지 오류 중단·부분수집 삭제보류·
 * 적합성 킷 + 파이프라인(신규 공고=생성, 마감=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/jobs-observatory/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "jobs-observatory",
  family: "api-records",
  title: "워크넷 채용 관측소",
  endpoint: "http://openapi.work.go.kr/opi/opi/opia/wantedApi.do",
  key_env: "TEST_WORKNET_KEY",
  key_param: "authKey",
  user_agent: "chronicle-test/0.1",
  page_size: 100,
  max_pages: 5,
  max_removal_ratio: 1,
  activated: true,
  query: { callTp: "L", returnType: "XML", keyword: "인공지능" },
};

function wantedXml(items: Array<Record<string, string>>): string {
  const blocks = items
    .map((it) => `<wanted>${Object.entries(it).map(([k, v]) => `<${k}>${v}</${k}>`).join("")}</wanted>`)
    .join("");
  return `<?xml version="1.0"?><wantedRoot><total>${items.length}</total>${blocks}</wantedRoot>`;
}

const K1 = { wantedAuthNo: "K1", company: "AI랩", title: "ML 엔지니어", region: "서울", sal: "협의", salTpNm: "연봉", empTpNm: "정규직", career: "경력", minEdubg: "대졸", closeDt: "2026-08-01", jobsCd: "133", wantedInfoUrl: "http://work.go.kr/K1" };
const K2 = { wantedAuthNo: "K2", company: "데이터코", title: "데이터 분석가", region: "판교", closeDt: "2026-07-20", jobsCd: "134" };
const K3 = { wantedAuthNo: "K3", company: "비전랩", title: "CV 연구원", region: "대전", closeDt: "2026-09-01" };

/** startPage 1 = items, 그 외 = 빈 목록. failPage/errText로 오류 주입. */
function fakeHttp(items: () => Array<Record<string, string>>, opts: { failPage?: number; page1Error?: string; json?: boolean } = {}): HttpClient {
  return {
    text: async (url) => {
      const page = Number(new URL(url).searchParams.get("startPage") ?? "1");
      if (opts.failPage === page) throw new Error(`ECONNREFUSED page ${page}`);
      if (page === 1 && opts.page1Error) return opts.page1Error;
      const rows = page === 1 ? items() : [];
      if (opts.json) return JSON.stringify({ wantedRoot: { total: rows.length, wanted: rows } });
      return wantedXml(rows);
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

function withKey(fn: () => Promise<void>): () => Promise<void> {
  return async () => {
    const saved = process.env.TEST_WORKNET_KEY;
    process.env.TEST_WORKNET_KEY = "sk-worknet";
    try {
      await fn();
    } finally {
      if (saved === undefined) delete process.env.TEST_WORKNET_KEY;
      else process.env.TEST_WORKNET_KEY = saved;
    }
  };
}

test(
  "XML 파싱 + 엔티티(구인인증번호) + 필드 매핑",
  withKey(async () => {
    const result = await adapter.collect(ctx(fakeHttp(() => [K1, K2])));
    assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["wanted:K1", "wanted:K2"]);
    const k1 = result.records.find((r) => r.entityId === "wanted:K1")!;
    assert.equal(k1.fields.title, "ML 엔지니어");
    assert.equal(k1.fields.company, "AI랩");
    assert.equal(k1.fields.region, "서울");
    assert.equal(k1.fields.salary_type, "연봉");
    assert.equal(k1.fields.employment_type, "정규직");
    assert.equal(k1.fields.close_date, "2026-08-01");
    assert.equal(k1.sourceUrl, "http://work.go.kr/K1");
  }),
);

test(
  "JSON 응답도 관용 파싱",
  withKey(async () => {
    const result = await adapter.collect(ctx(fakeHttp(() => [K1], { json: true })));
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].entityId, "wanted:K1");
    assert.equal(result.records[0].fields.title, "ML 엔지니어");
  }),
);

test("무키 = 휴면(0건, removalScope 전부 제외)", async () => {
  const result = await adapter.collect(ctx(fakeHttp(() => [K1, K2])));
  assert.equal(result.records.length, 0);
  assert.equal(result.removalScope!({ entityId: "wanted:K1", sourceUrl: "u", fields: {} }), false);
});

test(
  "1페이지 실패·오류응답은 중단(자가진단), 중간페이지 실패는 삭제판정 보류",
  withKey(async () => {
    await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => [K1], { failPage: 1 }))), /1페이지 요청 실패/);
    await assert.rejects(
      () => adapter.collect(ctx(fakeHttp(() => [K1], { page1Error: "<cmmMsgHeader><errMsg>SERVICE ERROR</errMsg></cmmMsgHeader>" }))),
      /오류 응답/,
    );
    // 페이지가 꽉 차서 2페이지로 넘어간 뒤 2페이지 실패 → 부분수집, removalScope 보류
    const many = Array.from({ length: 100 }, (_, i) => ({ ...K1, wantedAuthNo: `M${i}` }));
    const result = await adapter.collect(ctx(fakeHttp(() => many, { failPage: 2 })));
    assert.equal(result.records.length, 100);
    assert.equal(result.removalScope!({ entityId: "wanted:M0", sourceUrl: "u", fields: {} }), false, "부분수집 = 삭제 보류");
  }),
);

test("적합성 킷을 통과한다", withKey(async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(() => [K1, K2])));
}));

test(
  "파이프라인: 신규 공고=생성, 마감(소멸)=삭제",
  withKey(async () => {
    const dataDir = mkdtempSync(join(tmpdir(), "chronicle-jobsobs-"));
    let items: Array<Record<string, string>> = [K1, K2];
    const run = (iso: string) =>
      runOnce({ sourceId: "jobs-observatory", root, dataDir, adapter, config, http: fakeHttp(() => items), now: () => new Date(iso), log: () => {} });

    const first = await run("2026-07-13T05:00:00.000Z");
    assert.equal(first.added, 2);

    // K2 마감(소멸) + K3 신규
    items = [K1, K3];
    const second = await run("2026-07-14T05:00:00.000Z");
    assert.equal(second.added, 1, "K3 신규");
    assert.equal(second.removed, 1, "K2 마감");
    const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
    assert.equal(removal.entity_id, "wanted:K2");
  }),
);

test(
  "max_pages 소진(항상 꽉 찬 페이지)=부분수집 → 삭제판정 보류(거짓 마감 방지)",
  withKey(async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ ...K1, wantedAuthNo: `F${i}` })); // = page_size 100
    const http: HttpClient = {
      text: async () => wantedXml(full), // 모든 페이지가 꽉 참 → 빈 페이지 없음
      json: async () => {
        throw new Error("n/a");
      },
      raw: async () => {
        throw new Error("n/a");
      },
    };
    const result = await adapter.collect(ctx(http));
    assert.equal(result.records.length, 100);
    assert.equal(result.removalScope!({ entityId: "wanted:F0", sourceUrl: "u", fields: {} }), false, "부분수집 = 삭제 보류");
  }),
);
