/**
 * 크래시 복구 검증 — 파이프라인이 5개 파일을 쓰는 도중 죽은 상황을 시뮬레이션한다.
 *
 * 창 1: changes.jsonl append 후, integrity.json/latest.json 기록 전에 사망
 *       → 그대로 재실행하면 낡은 체인 머리에 이어 붙어 체인 영구 단절
 * 창 2: integrity.json 기록 후, latest.json 기록 전에 사망
 *       → 낡은 latest 기준 재diff로 같은 이벤트가 중복 봉인
 * 복구 원칙: 원장(changes.jsonl)이 진실 — 파생 파일은 원장에서 재구성한다.
 * 원장 자체가 손상된 경우는 자동 복구하지 않는다.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

interface Setup {
  dataDir: string;
  sourceDir: string;
  run: (isoNow: string) => ReturnType<typeof runOnce>;
  day1Files: { integrity: string; latest: string };
}

/** day1 → day2 수집을 실행하고, day1 시점 파생 파일 사본을 챙겨둔다. */
async function setupTwoDays(): Promise<Setup> {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-recovery-"));
  const sourceDir = join(dataDir, "bunyang-capsule");
  let datasets = day1;
  const http = odcloudEmulator(() => datasets);
  const run = (isoNow: string) =>
    runOnce({ sourceId: "bunyang-capsule", root, dataDir, adapter, http, now: () => new Date(isoNow), log: () => {} });

  await run("2026-07-09T05:00:00.000Z");
  const day1Files = {
    integrity: readFileSync(join(sourceDir, "integrity.json"), "utf8"),
    latest: readFileSync(join(sourceDir, "latest.json"), "utf8"),
  };
  datasets = day2;
  const second = await run("2026-07-20T05:00:00.000Z");
  assert.equal(second.chainLength, 12);
  return { dataDir, sourceDir, run, day1Files };
}

function chainState(sourceDir: string): { integrity: IntegrityState; lines: string[] } {
  const integrity = JSON.parse(readFileSync(join(sourceDir, "integrity.json"), "utf8")) as IntegrityState;
  const lines = readFileSync(join(sourceDir, "changes.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "");
  return { integrity, lines };
}

test("창 1(원장만 앞서감): 파생 파일을 원장 기준으로 재구성하고 중복 봉인이 없다", async () => {
  const { sourceDir, run, day1Files } = await setupTwoDays();
  // 크래시 시뮬레이션: day2의 integrity/latest 기록이 유실된 것처럼 day1 상태로 롤백
  writeFileSync(join(sourceDir, "integrity.json"), day1Files.integrity);
  writeFileSync(join(sourceDir, "latest.json"), day1Files.latest);

  const third = await run("2026-07-21T05:00:00.000Z"); // 소스는 day2 그대로
  assert.equal(third.wrote, false, "복구 후 diff는 0건이어야 한다 (중복 봉인 금지)");

  const { integrity, lines } = chainState(sourceDir);
  assert.equal(integrity.length, 12, "integrity가 원장 길이로 복구되어야 한다");
  assert.equal(lines.length, 12, "원장에 새 줄이 붙으면 안 된다");
  const verified = verifyChainLines(lines, integrity);
  assert.equal(verified.ok, true, verified.errors.join("; "));

  const latest = JSON.parse(readFileSync(join(sourceDir, "latest.json"), "utf8"));
  assert.equal(latest.record_count, 7, "latest가 원장 재생으로 day2 상태가 되어야 한다");
  assert.ok(!latest.records["apt:2026000002:2026000002"], "삭제된 공고는 복구본에도 없어야 한다");
});

test("창 2(latest만 뒤처짐): latest를 재구성하고 같은 이벤트를 다시 봉인하지 않는다", async () => {
  const { sourceDir, run, day1Files } = await setupTwoDays();
  writeFileSync(join(sourceDir, "latest.json"), day1Files.latest); // integrity는 정상(12)

  const third = await run("2026-07-21T05:00:00.000Z");
  assert.equal(third.wrote, false);

  const { integrity, lines } = chainState(sourceDir);
  assert.equal(lines.length, 12, "낡은 latest 재diff로 인한 중복 봉인이 없어야 한다");
  assert.equal(verifyChainLines(lines, integrity).ok, true);

  const latest = JSON.parse(readFileSync(join(sourceDir, "latest.json"), "utf8"));
  assert.equal(latest.record_count, 7);
  assert.equal(latest.updated_at, integrity.updated_at, "파생 파일 신선도가 복구되어야 한다");
});

test("원장 손상(부분 기록·변조)은 자동 복구하지 않고 중단한다", async () => {
  const { sourceDir, run } = await setupTwoDays();
  const changesPath = join(sourceDir, "changes.jsonl");
  const intact = readFileSync(changesPath, "utf8");

  // 부분 기록: 마지막 줄이 도중에 끊긴 경우
  writeFileSync(changesPath, `${intact}{"observed_at":"2026-07-2`);
  await assert.rejects(() => run("2026-07-22T05:00:00.000Z"), /파싱 실패/);

  // 변조: 과거 줄의 값 바꿔치기
  writeFileSync(changesPath, intact.replace("129900", "1"));
  await assert.rejects(() => run("2026-07-22T05:00:00.000Z"), /해시 불일치/);
});
