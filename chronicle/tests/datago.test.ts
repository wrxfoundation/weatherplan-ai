/**
 * #12 datago-watch(감시탑) — 페이지 텍스트형 재사용 검증.
 * 계열 시맨틱(실패 허용·노이즈 면역)은 forecast.test가 덮으므로 여기선
 * 대상 계약·카운터 노이즈 필터·적합성 킷만 확인한다.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import adapter from "../sources/datago-watch/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import type { CollectContext, HttpClient, SourceConfig } from "../engine/types.js";

const config: SourceConfig = {
  id: "datago-watch",
  family: "page-text",
  title: "공공데이터포털 감시탑",
  user_agent: "chronicle-test-agent/1.0",
  targets: [
    { id: "bunyang-capsule-api", url: "https://datago.example/15098547" },
    { id: "apt-trade-api", url: "https://datago.example/15126468" },
  ],
};

function fakeHttp(pages: Record<string, string>): HttpClient {
  return {
    text: async (url) => {
      const body = pages[url];
      if (!body) throw new Error(`404 ${url}`);
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

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-10T00:00:00Z") });

test("의존 데이터셋 페이지를 엔티티로 박제하고 포털 카운터 노이즈를 걷어낸다", async () => {
  const http = fakeHttp({
    "https://datago.example/15098547": "<html><body><h1>청약홈 분양정보</h1><p>조회수 12,345 다운로드 678 활용신청 90</p><p>수정일 2026-07-01</p></body></html>",
    "https://datago.example/15126468": "<html><body><h1>아파트 매매 실거래 상세</h1></body></html>",
  });
  const result = await adapter.collect(ctx(http));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["page:apt-trade-api", "page:bunyang-capsule-api"]);
  const bunyang = result.records.find((r) => r.entityId === "page:bunyang-capsule-api")!;
  assert.ok(String(bunyang.fields.text).includes("수정일 2026-07-01"), "실제 신호는 보존");
  assert.ok(!String(bunyang.fields.text).includes("12,345"), "조회수 카운터는 제거");
  assert.ok(!String(bunyang.fields.text).includes("678"), "다운로드 카운터는 제거");
});

test("적합성 킷을 통과한다", async () => {
  const http = fakeHttp({
    "https://datago.example/15098547": "<html><body>A</body></html>",
    "https://datago.example/15126468": "<html><body>B</body></html>",
  });
  await assertAdapterConformance(adapter, ctx(http));
});
