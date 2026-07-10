import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import type { CollectContext, SourceConfig } from "../engine/types.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;

const config: SourceConfig = {
  id: "bunyang-capsule",
  family: "api-records",
  endpoints: {
    apt_detail: "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail",
    apt_model: "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl",
  },
  window_days: 180,
  page_size: 100,
};

function ctxWith(overrides: Partial<CollectContext> = {}): CollectContext {
  return {
    config,
    http: odcloudEmulator(() => day1),
    log: () => {},
    now: () => new Date("2026-07-09T00:00:00Z"),
    ...overrides,
  };
}

test("공고·주택형 레코드를 엔티티 계약대로 정규화한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const result = await adapter.collect(ctxWith());
  const ids = result.records.map((record) => record.entityId).sort();
  assert.deepEqual(ids, [
    "apt-mdl:2026000001:2026000001:01",
    "apt-mdl:2026000001:2026000001:02",
    "apt-mdl:2026000002:2026000002:01",
    "apt-mdl:2026000004:2026000004:01",
    "apt:2026000001:2026000001",
    "apt:2026000002:2026000002",
    "apt:2026000004:2026000004",
  ]);

  const house = result.records.find((record) => record.entityId === "apt:2026000001:2026000001")!;
  assert.equal(house.fields.HOUSE_NM, "서울숲 리버뷰 자이");
  assert.equal(house.fields._chronicle_window_date, "2026-06-15");
  assert.ok(house.sourceUrl.includes("applyhome.co.kr"));

  // 주택형 레코드에는 부모 공고의 모집공고일이 윈도 판정용으로 복제된다.
  const model = result.records.find((record) => record.entityId === "apt-mdl:2026000001:2026000001:02")!;
  assert.equal(model.fields.LTTOT_TOP_AMOUNT, 129900);
  assert.equal(model.fields._chronicle_window_date, "2026-06-15");
  // 주택형 레코드의 출처는 부모 공고 URL (apt_detail 엔드포인트가 아니라)
  assert.equal(
    model.sourceUrl,
    "https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?houseManageNo=2026000001&pblancNo=2026000001",
  );
});

test("윈도(모집공고일 GTE) 밖 공고는 수집되지 않는다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  // 2026-08-20 기준 180일 윈도 시작은 2026-02-21 — 검단(2026-01-15)이 빠진다.
  const result = await adapter.collect(ctxWith({ now: () => new Date("2026-08-20T00:00:00Z") }));
  const ids = result.records.map((record) => record.entityId);
  assert.ok(!ids.includes("apt:2026000004:2026000004"));
  assert.ok(ids.includes("apt:2026000001:2026000001"));

  // removalScope: 윈도 밖 저장 레코드는 삭제 감지 대상이 아니다.
  const scope = result.removalScope!;
  assert.equal(scope({ entityId: "apt:x", sourceUrl: "u", fields: { _chronicle_window_date: "2026-01-15" } }), false);
  assert.equal(scope({ entityId: "apt:y", sourceUrl: "u", fields: { _chronicle_window_date: "2026-06-15" } }), true);
});

test("페이지네이션: perPage보다 많은 행도 전부 수집한다 (matchCount 기준 종료)", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const result = await adapter.collect(ctxWith({ config: { ...config, page_size: 2 } }));
  assert.equal(result.records.length, 7);
});

test("페이지네이션 요청 수: 짧은 페이지·matchCount 충족 시 즉시 종료한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  let requests = 0;
  const base = odcloudEmulator(() => day1);
  const counting = { ...base, json: (url: string, init?: RequestInit) => (requests += 1, base.json(url, init)) };
  const result = await adapter.collect(ctxWith({ http: counting }));
  assert.equal(result.records.length, 7);
  // totalCount(전체 데이터셋)를 종료 기준으로 쓰면 단지마다 빈 페이지를 한 번 더 부른다.
  assert.equal(requests, 4); // 공고 상세 1 + 단지별 주택형 3
});

test("어댑터 적합성 킷을 통과한다 (모든 어댑터 공통 계약)", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  await assertAdapterConformance(adapter, ctxWith());
});

test("DATA_GO_KR_KEY가 없으면 명확한 오류로 실패한다", async () => {
  const saved = process.env.DATA_GO_KR_KEY;
  delete process.env.DATA_GO_KR_KEY;
  try {
    await assert.rejects(() => adapter.collect(ctxWith()), /DATA_GO_KR_KEY/);
  } finally {
    if (saved !== undefined) process.env.DATA_GO_KR_KEY = saved;
  }
});
