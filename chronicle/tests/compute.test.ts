/**
 * #15 compute-price-index — Spot Advisor 관측 검증.
 * GPU 필터·리전 스코프·엔티티 계약·절감률 변동 diff·리전 축소 시 삭제 오탐 방지·적합성 킷.
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/compute-price-index/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import type { CollectContext, HttpClient, SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "compute-price-index",
  family: "api-records",
  title: "컴퓨트 가격 지수",
  endpoint: "https://spot-bid-advisor.s3.amazonaws.com/spot-advisor-data.json",
  regions: ["us-east-1", "ap-northeast-2"],
  os: "Linux",
  gpu_prefixes: ["p4", "p5", "g5", "trn"],
};

function advisorFixture(overrides?: { p5s?: number; dropP4?: boolean }) {
  return {
    ranges: [
      { index: 0, label: "<5%", dots: 0, max: 5 },
      { index: 2, label: "10-15%", dots: 2, max: 15 },
      { index: 4, label: ">20%", dots: 4, max: 100 },
    ],
    instance_types: { "p5.48xlarge": { cores: 192 }, "m5.large": { cores: 2 } },
    spot_advisor: {
      "us-east-1": {
        Linux: {
          "p5.48xlarge": { s: overrides?.p5s ?? 71, r: 4 },
          ...(overrides?.dropP4 ? {} : { "p4d.24xlarge": { s: 68, r: 2 } }),
          "m5.large": { s: 60, r: 0 }, // GPU 아님 — 걸러져야 함
        },
        Windows: { "p5.48xlarge": { s: 40, r: 4 } }, // OS 불일치 — 걸러져야 함
      },
      "ap-northeast-2": { Linux: { "g5.xlarge": { s: 55, r: 0 } } },
      "eu-west-1": { Linux: { "p5.48xlarge": { s: 70, r: 3 } } }, // 설정 밖 리전 — 걸러져야 함
    },
  };
}

function fakeHttp(data: () => unknown): HttpClient {
  return {
    json: async () => data(),
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-10T00:00:00Z") });

test("GPU 계열 × 설정 리전 × OS만 관측하고, 중단위험 범례를 풀어쓴다", async () => {
  const result = await adapter.collect(ctx(fakeHttp(() => advisorFixture())));
  const ids = result.records.map((r) => r.entityId).sort();
  assert.deepEqual(ids, [
    "spot:ap-northeast-2:Linux:g5.xlarge",
    "spot:us-east-1:Linux:p4d.24xlarge",
    "spot:us-east-1:Linux:p5.48xlarge",
  ]);
  const p5 = result.records.find((r) => r.entityId.endsWith("p5.48xlarge"))!;
  assert.equal(p5.fields.s, 71);
  assert.equal(p5.fields.r_label, ">20%");
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(() => advisorFixture())));
});

test("응답 형식 이상은 즉시 중단한다", async () => {
  await assert.rejects(() => adapter.collect(ctx(fakeHttp(() => ({ hello: 1 })))), /형식이 아닙니다/);
});

test("파이프라인 통합: 절감률 변동은 필드 이벤트, 타입 소멸은 삭제, 설정 밖 리전은 불가침", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-compute-"));
  let fixture = advisorFixture();
  const http = fakeHttp(() => fixture);
  const run = (isoNow: string, cfg: SourceConfig = config) =>
    runOnce({ sourceId: "compute-price-index", root, dataDir, adapter, config: cfg, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-10T00:00:00.000Z");
  assert.equal(first.added, 3);

  // 스팟 압력 변동(71→77) + p4d 제공 종료
  fixture = advisorFixture({ p5s: 77, dropP4: true });
  const second = await run("2026-07-11T00:00:00.000Z");
  assert.equal(second.changed, 1);
  assert.equal(second.removed, 1);
  const sEvent = second.events.find((e) => e.field === "s")!;
  assert.equal(sEvent.before, 71);
  assert.equal(sEvent.after, 77);

  // 리전을 설정에서 빼도 그 리전의 과거 관측은 삭제로 오염되지 않는다
  const shrunk: SourceConfig = { ...config, regions: ["us-east-1"] };
  const third = await run("2026-07-12T00:00:00.000Z", shrunk);
  assert.equal(third.removed, 0, "ap-northeast-2 관측이 삭제로 잡히면 안 된다");
});
