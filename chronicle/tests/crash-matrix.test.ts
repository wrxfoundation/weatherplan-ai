/**
 * 크래시 매트릭스 — 파이프라인의 5개 쓰기 지점(스냅샷 → 원장 append →
 * integrity → latest → feed) 사이 모든 중간 상태에서 죽었다 치고 재실행해,
 * 최종 상태가 수렴하고 체인이 온전한지 확인한다.
 *
 * (원장 append 이후 상태 2·3은 recovery.test.ts의 창 1·2와 동일 — 여기서는
 *  나머지 창을 덮는다.)
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { verifyChainLines, type IntegrityState } from "../engine/integrity.js";
import { runOnce } from "../engine/pipeline.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;
const day2 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day2.json"), "utf8")) as OdcloudDatasets;

async function setup() {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-crashmx-"));
  const sourceDir = join(dataDir, "bunyang-capsule");
  let datasets = day1;
  const http = odcloudEmulator(() => datasets);
  const run = (isoNow: string) =>
    runOnce({ sourceId: "bunyang-capsule", root, dataDir, adapter, http, now: () => new Date(isoNow), log: () => {} });

  await run("2026-07-09T05:00:00.000Z");
  const day1Files = {
    changes: readFileSync(join(sourceDir, "changes.jsonl"), "utf8"),
    integrity: readFileSync(join(sourceDir, "integrity.json"), "utf8"),
    latest: readFileSync(join(sourceDir, "latest.json"), "utf8"),
  };
  datasets = day2;
  await run("2026-07-20T05:00:00.000Z");
  return { sourceDir, run, day1Files };
}

function assertConverged(sourceDir: string, expectedLines: number) {
  const lines = readFileSync(join(sourceDir, "changes.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "");
  const integrity = JSON.parse(readFileSync(join(sourceDir, "integrity.json"), "utf8")) as IntegrityState;
  assert.equal(lines.length, expectedLines);
  const verified = verifyChainLines(lines, integrity);
  assert.equal(verified.ok, true, verified.errors.join("; "));
  const latest = JSON.parse(readFileSync(join(sourceDir, "latest.json"), "utf8"));
  assert.equal(latest.record_count, 7);
  assert.equal(latest.updated_at, integrity.updated_at);
  assert.ok(existsSync(join(sourceDir, "feed.xml")));
}

test("창 0 (스냅샷만 기록 후 사망): 재실행이 이벤트를 새로 봉인하고 고아 스냅샷은 남는다", async () => {
  const { sourceDir, run, day1Files } = await setup();
  // day2 실행에서 스냅샷만 남고 나머지 4개 쓰기가 유실된 상황
  writeFileSync(join(sourceDir, "changes.jsonl"), day1Files.changes);
  writeFileSync(join(sourceDir, "integrity.json"), day1Files.integrity);
  writeFileSync(join(sourceDir, "latest.json"), day1Files.latest);

  const rerun = await run("2026-07-21T05:00:00.000Z"); // 소스는 day2 그대로
  assert.equal(rerun.wrote, true, "유실된 day2 변경분을 다시 봉인해야 한다");
  assert.equal(rerun.added + rerun.changed + rerun.removed, 5);
  assertConverged(sourceDir, 12);
});

test("창 4 (feed.xml 기록 전 사망): 다음 실행이 조용히 재생성한다", async () => {
  const { sourceDir, run } = await setup();
  rmSync(join(sourceDir, "feed.xml"));

  const rerun = await run("2026-07-21T05:00:00.000Z");
  assert.equal(rerun.wrote, false, "feed 유실은 변경이 아니다");
  assertConverged(sourceDir, 12);
  const feed = readFileSync(join(sourceDir, "feed.xml"), "utf8");
  assert.ok(feed.includes("<entry>"));
});

test("연쇄 크래시: 창 1 복구 직후 다시 창 2가 나도 수렴한다", async () => {
  const { sourceDir, run, day1Files } = await setup();
  // 창 1: integrity/latest 유실
  writeFileSync(join(sourceDir, "integrity.json"), day1Files.integrity);
  writeFileSync(join(sourceDir, "latest.json"), day1Files.latest);
  await run("2026-07-21T05:00:00.000Z");
  // 창 2: latest만 다시 유실
  writeFileSync(join(sourceDir, "latest.json"), day1Files.latest);
  const rerun = await run("2026-07-22T05:00:00.000Z");
  assert.equal(rerun.wrote, false);
  assertConverged(sourceDir, 12);
});
