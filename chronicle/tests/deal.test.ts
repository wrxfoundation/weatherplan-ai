/**
 * #5 deal-audit-ledger — 실거래 취소·정정 시맨틱 검증.
 * XML 파싱·엔티티 계약·취소(cdealType 필드 이벤트)·정정(삭제+생성 쌍)·
 * 페이지네이션·완전중복 접기·윈도 삭제감지·적합성 킷·파이프라인 통합.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter, { parseXmlItems } from "../sources/deal-audit-ledger/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

type Row = Record<string, string>;

const config: SourceConfig = {
  id: "deal-audit-ledger",
  family: "api-records",
  title: "실거래 취소·정정 원장",
  endpoint: "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev",
  window_months: 2,
  num_of_rows: 1000,
  lawd_codes: ["11680"],
};

function deal(overrides: Partial<Row>): Row {
  return {
    aptNm: "래미안테스트",
    buildYear: "2015",
    cdealDay: " ",
    cdealType: " ",
    dealAmount: "182,000",
    dealDay: "15",
    dealMonth: "6",
    dealYear: "2026",
    excluUseAr: "84.98",
    floor: "12",
    jibun: "123-4",
    umdNm: "대치동",
    ...overrides,
  };
}

function toXml(rows: Row[], totalCount = rows.length): string {
  const items = rows
    .map((row) => `<item>${Object.entries(row).map(([k, v]) => `<${k}>${v}</${k}>`).join("")}</item>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><response><header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header><body><items>${items}</items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>${totalCount}</totalCount></body></response>`;
}

/** RTMS 에뮬레이터 — (lawd, ymd)별 행을 서빙하고 pageNo/numOfRows 페이지네이션을 흉내낸다. */
function rtmsEmulator(data: () => Record<string, Row[]>): HttpClient & { requests: string[] } {
  const requests: string[] = [];
  return {
    requests,
    async text(url) {
      requests.push(url);
      const u = new URL(url);
      assert.ok(u.searchParams.get("serviceKey"), "serviceKey가 쿼리로 전달되어야 한다");
      const key = `${u.searchParams.get("LAWD_CD")}:${u.searchParams.get("DEAL_YMD")}`;
      const rows = data()[key] ?? [];
      const pageNo = Number(u.searchParams.get("pageNo") ?? 1);
      const numOfRows = Number(u.searchParams.get("numOfRows") ?? 1000);
      return toXml(rows.slice((pageNo - 1) * numOfRows, pageNo * numOfRows), rows.length);
    },
    json: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

function ctxWith(http: HttpClient, cfg: SourceConfig = config): CollectContext {
  return { config: cfg, http, log: () => {}, now: () => new Date("2026-07-10T03:00:00Z") };
}

test("parseXmlItems: 평면 XML 행·헤더·CDATA를 파싱한다", () => {
  const xml = toXml([deal({ aptNm: "<![CDATA[한:쌍 아파트]]>" })]);
  const parsed = parseXmlItems(xml);
  assert.equal(parsed.resultCode, "000");
  assert.equal(parsed.totalCount, 1);
  assert.equal(parsed.rows[0].aptNm, "한:쌍 아파트");
  assert.equal(parsed.rows[0].dealAmount, "182,000");
});

test("정규화: 엔티티 계약 + 윈도 날짜 + 완전중복 접기", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const http = rtmsEmulator(() => ({
    "11680:202607": [deal({}), deal({})], // 완전 중복 2건 → 1건
    "11680:202606": [deal({ dealMonth: "6", dealDay: "3", dealAmount: "95,500", floor: "7" })],
  }));
  const result = await adapter.collect(ctxWith(http));
  const ids = result.records.map((r) => r.entityId).sort();
  assert.deepEqual(ids, [
    "deal:11680:20260603:대치동:123-4:래미안테스트:84.98:7:95500",
    "deal:11680:20260615:대치동:123-4:래미안테스트:84.98:12:182000",
  ]);
  const record = result.records.find((r) => r.entityId.endsWith(":182000"))!;
  assert.equal(record.fields._chronicle_window_date, "2026-06-15");
  assert.equal(record.fields.LAWD_CD, "11680");
});

test("적합성 킷을 통과한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const http = rtmsEmulator(() => ({ "11680:202607": [deal({})], "11680:202606": [] }));
  await assertAdapterConformance(adapter, ctxWith(http));
});

test("페이지네이션: totalCount만큼 전부 수집한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const many = Array.from({ length: 5 }, (_, i) => deal({ floor: String(i + 1) }));
  const http = rtmsEmulator(() => ({ "11680:202607": many, "11680:202606": [] }));
  const result = await adapter.collect(ctxWith(http, { ...config, num_of_rows: 2 }));
  assert.equal(result.records.length, 5);
});

test("RTMS 오류 응답(resultCode≠00)은 즉시 중단한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const http: HttpClient = {
    text: async () =>
      `<response><header><resultCode>30</resultCode><resultMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</resultMsg></header></response>`,
    json: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
  await assert.rejects(() => adapter.collect(ctxWith(http)), /RTMS 오류 30/);
});

test("파이프라인 통합: 취소는 필드 이벤트, 정정은 삭제+생성 쌍", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-deal-"));
  let june: Row[] = [
    deal({ dealDay: "3", dealAmount: "95,500", floor: "7" }), // 취소될 거래
    deal({ dealDay: "20", dealAmount: "150,000" }), // 정정될 거래
  ];
  const http = rtmsEmulator(() => ({ "11680:202607": [deal({ dealDay: "1", dealMonth: "7" })], "11680:202606": june }));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "deal-audit-ledger", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-10T03:00:00.000Z");
  assert.equal(first.added, 3);

  // 취소: 같은 행에 cdealType='O' — 필드 단위 변경 이벤트 2건(cdealType·cdealDay)
  // 정정: 금액 150,000 → 149,000 — 옛 레코드 삭제 + 새 레코드 생성
  june = [
    deal({ dealDay: "3", dealAmount: "95,500", floor: "7", cdealType: "O", cdealDay: "26.07.09" }),
    deal({ dealDay: "20", dealAmount: "149,000" }),
  ];
  const second = await run("2026-07-11T03:00:00.000Z");
  assert.equal(second.added, 1, "정정 후 금액의 새 레코드");
  assert.equal(second.removed, 1, "정정 전 금액의 옛 레코드");
  assert.equal(second.changed, 2, "취소 표시 필드 2건");

  const cancel = second.events.find((e) => e.field === "cdealType")!;
  assert.equal(String(cancel.before).trim(), "");
  assert.equal(cancel.after, "O");

  const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
  assert.ok(removal.entity_id.endsWith(":150000"), "정정 전 금액 레코드가 삭제 이벤트로 남는다");
  const addition = second.events.find((e) => e.field === RECORD_FIELD && e.before === null)!;
  assert.ok(addition.entity_id.endsWith(":149000"), "정정 후 금액 레코드가 생성 이벤트로 남는다");
});
