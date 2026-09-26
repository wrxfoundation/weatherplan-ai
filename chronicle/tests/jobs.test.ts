/**
 * #18 ai-jobs-ledger — 공개 잡보드(Greenhouse·Ashby·Lever) 검증.
 * 3 provider 파싱·엔티티·랩별 실패 허용(삭제 오탐 방지)·전랩 실패 중단·
 * 적합성 킷 + 파이프라인(신규 공고=생성, 마감=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/ai-jobs-ledger/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "ai-jobs-ledger",
  family: "api-records",
  title: "AI 랩 채용 원장",
  user_agent: "chronicle-test/0.1",
  labs: [
    { lab: "anthropic", provider: "greenhouse", board: "anthropic" },
    { lab: "openai", provider: "ashby", board: "openai" },
    { lab: "somelab", provider: "lever", board: "somelab" },
  ],
};

function routes(): Record<string, unknown> {
  return {
    "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs": {
      jobs: [
        { id: 101, title: "ML Engineer", departments: [{ name: "Research" }], location: { name: "SF" } },
        { id: 102, title: "Policy Lead", departments: [{ name: "Policy" }], location: { name: "London" } },
      ],
      meta: { total: 2 },
    },
    "https://api.ashbyhq.com/posting-api/job-board/openai": {
      jobs: [
        { id: "a1", title: "Research Scientist", teamName: "Alignment", locationName: "SF", employmentType: "FullTime", isListed: true },
        { id: "a2", title: "숨김공고", isListed: false }, // 미게시 → 제외
      ],
    },
    "https://api.lever.co/v0/postings/somelab?mode=json": [
      { id: "l1", text: "Infra Engineer", categories: { team: "Platform", location: "Remote", commitment: "Full-time" } },
    ],
  };
}

function fakeHttp(data: () => Record<string, unknown>, downLabs: () => Set<string> = () => new Set()): HttpClient {
  return {
    json: async (url) => {
      // downLabs에 해당하는 URL은 네트워크 오류
      for (const lab of downLabs()) if (url.includes(lab)) throw new Error(`ECONNREFUSED ${url}`);
      const body = data()[url];
      if (body === undefined) throw new Error(`404 ${url}`);
      return body;
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

test("3 provider 파싱 + 엔티티 + 미게시 제외", async () => {
  const result = await adapter.collect(ctx(fakeHttp(routes)));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), [
    "job:anthropic:101",
    "job:anthropic:102",
    "job:openai:a1",
    "job:somelab:l1",
  ]);
  const ml = result.records.find((r) => r.entityId === "job:anthropic:101")!;
  assert.equal(ml.fields.title, "ML Engineer");
  assert.equal(ml.fields.team, "Research");
  assert.equal(ml.fields.location, "SF");
  const rs = result.records.find((r) => r.entityId === "job:openai:a1")!;
  assert.equal(rs.fields.team, "Alignment");
  assert.equal(rs.fields.employment_type, "FullTime");
  const lever = result.records.find((r) => r.entityId === "job:somelab:l1")!;
  assert.equal(lever.fields.title, "Infra Engineer");
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(fakeHttp(routes)));
});

test("랩별 실패는 건너뛰되 그 랩 공고는 삭제 대상 아님, 전랩 실패는 중단", async () => {
  const result = await adapter.collect(ctx(fakeHttp(routes, () => new Set(["openai"]))));
  assert.ok(!result.records.some((r) => r.entityId.startsWith("job:openai:")), "실패 랩 공고 없음");
  assert.ok(result.records.some((r) => r.entityId.startsWith("job:anthropic:")), "성공 랩은 정상");
  const scope = result.removalScope!;
  assert.equal(scope({ entityId: "job:openai:a1", sourceUrl: "u", fields: {} }), false, "실패 랩은 삭제 감지 제외");
  assert.equal(scope({ entityId: "job:anthropic:101", sourceUrl: "u", fields: {} }), true);

  await assert.rejects(
    () => adapter.collect(ctx(fakeHttp(routes, () => new Set(["anthropic", "openai", "somelab"])))),
    /전 랩.*장애/,
  );
});

test("파이프라인: 신규 공고=생성, 마감(소멸)=삭제", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-jobs-"));
  let data = routes();
  const run = (isoNow: string) =>
    runOnce({ sourceId: "ai-jobs-ledger", root, dataDir, adapter, config, http: fakeHttp(() => data), now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-13T05:00:00.000Z");
  assert.equal(first.added, 4);

  // anthropic이 새 공고 추가 + Policy Lead 마감, openai 공고 마감
  data = {
    ...routes(),
    "https://boards-api.greenhouse.io/v1/boards/anthropic/jobs": {
      jobs: [
        { id: 101, title: "ML Engineer", departments: [{ name: "Research" }], location: { name: "SF" } },
        { id: 103, title: "Frontier Safety Researcher", departments: [{ name: "Research" }], location: { name: "SF" } },
      ],
    },
    "https://api.ashbyhq.com/posting-api/job-board/openai": { jobs: [] },
  };
  const second = await run("2026-07-14T05:00:00.000Z");
  assert.equal(second.added, 1, "신규 공고 103");
  assert.equal(second.removed, 2, "Policy Lead(102) + openai(a1) 마감");
  const creation = second.events.find((e) => e.field === RECORD_FIELD && e.before === null)!;
  assert.equal(creation.entity_id, "job:anthropic:103");
});
