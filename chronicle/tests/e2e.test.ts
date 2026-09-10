/**
 * 파이프라인 전체(수집 → diff → 체인 봉인 → 퍼블리시)를 실제 config.yml과
 * 실제 어댑터로, 네트워크만 에뮬레이터로 바꿔 3일치 굴려보는 end-to-end 테스트.
 *
 * day1: 최초 수집 — 전 레코드 생성 이벤트
 * day2: 분양가 정정 + 공고 소멸 + 신규 공고 + 윈도 이탈(삭제 아님)
 * day3: 변경 없음 — 아무 파일도 쓰지 않아야 한다
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { verifyChainLines, type IntegrityState } from "../engine/integrity.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type ChangeEvent } from "../engine/types.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;
const day2 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day2.json"), "utf8")) as OdcloudDatasets;

test("3일치 파이프라인: 생성→정정·소멸·윈도이탈→무변경, 체인 온전", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-e2e-"));
  let datasets = day1;
  const http = odcloudEmulator(() => datasets);
  const run = (isoNow: string) =>
    runOnce({
      sourceId: "bunyang-capsule",
      root,
      dataDir,
      adapter,
      http,
      now: () => new Date(isoNow),
      log: () => {},
    });

  // ── day1: 최초 수집 ──────────────────────────────────────────────
  const first = await run("2026-07-09T05:00:00.000Z");
  assert.equal(first.wrote, true);
  assert.equal(first.added, 7); // 공고 3 + 주택형 4
  assert.equal(first.changed, 0);
  assert.equal(first.removed, 0);
  assert.equal(first.chainLength, 7);

  const sourceDir = join(dataDir, "bunyang-capsule");
  assert.ok(existsSync(join(sourceDir, "latest.json")));
  assert.ok(existsSync(join(sourceDir, "changes.jsonl")));
  assert.ok(existsSync(join(sourceDir, "integrity.json")));
  assert.ok(existsSync(join(sourceDir, "feed.xml")));
  assert.equal(readdirSync(join(sourceDir, "snapshots")).length, 1);

  // 스냅샷에는 원본 응답이 무가공 보존된다.
  const snapshotFile = readdirSync(join(sourceDir, "snapshots"))[0];
  const snapshot = JSON.parse(readFileSync(join(sourceDir, "snapshots", snapshotFile), "utf8"));
  assert.equal(snapshot.raw.apt_detail.length, 3);
  assert.equal(snapshot.raw.apt_model.length, 4);

  // ── day2: 분양가 정정 + 공고 소멸 + 신규 + 윈도 이탈 ────────────
  datasets = day2;
  const second = await run("2026-07-20T05:00:00.000Z");
  assert.equal(second.wrote, true);
  assert.equal(second.added, 2); // 대전 도안: 공고 1 + 주택형 1
  assert.equal(second.changed, 1); // 서울숲 84타입 LTTOT_TOP_AMOUNT
  assert.equal(second.removed, 2); // 부산 센텀: 공고 1 + 주택형 1 (윈도 안 소멸)
  assert.equal(second.chainLength, 12);

  const priceEvent = second.events.find((event) => event.field === "LTTOT_TOP_AMOUNT")!;
  assert.equal(priceEvent.before, 129900);
  assert.equal(priceEvent.after, 127500);
  assert.equal(priceEvent.entity_id, "apt-mdl:2026000001:2026000001:02");

  // 윈도 밖으로 밀려난 검단(01-15 공고)은 페치에 없어도 삭제 이벤트가 아니다.
  const removedIds = second.events
    .filter((event) => event.field === RECORD_FIELD && event.after === null)
    .map((event) => event.entity_id);
  assert.deepEqual(removedIds.sort(), ["apt-mdl:2026000002:2026000002:01", "apt:2026000002:2026000002"]);

  // latest.json: 검단은 마지막 관측 상태로 박제되어 남는다. 부산 센텀은 빠진다.
  const latest = JSON.parse(readFileSync(join(sourceDir, "latest.json"), "utf8"));
  assert.equal(latest.record_count, 7); // 서울숲 3 + 대전 2 + 검단 2
  assert.ok(latest.records["apt:2026000004:2026000004"]);
  assert.ok(!latest.records["apt:2026000002:2026000002"]);
  assert.equal(readdirSync(join(sourceDir, "snapshots")).length, 2);

  // ── day3: 변경 없음 — 아무것도 쓰지 않는다 ──────────────────────
  const changesBefore = readFileSync(join(sourceDir, "changes.jsonl"), "utf8");
  const third = await run("2026-07-21T05:00:00.000Z");
  assert.equal(third.wrote, false);
  assert.equal(third.added + third.changed + third.removed, 0);
  assert.equal(readFileSync(join(sourceDir, "changes.jsonl"), "utf8"), changesBefore);
  assert.equal(readdirSync(join(sourceDir, "snapshots")).length, 2);

  // ── 해시체인 전수 검증 + 변조 감지 ───────────────────────────────
  const integrity = JSON.parse(readFileSync(join(sourceDir, "integrity.json"), "utf8")) as IntegrityState;
  const lines = changesBefore.split("\n").filter((line) => line.trim() !== "");
  assert.equal(lines.length, 12);
  const verified = verifyChainLines(lines, integrity);
  assert.equal(verified.ok, true, verified.errors.join("; "));

  const tampered = [...lines];
  const event = JSON.parse(tampered[3]) as ChangeEvent;
  event.after = { ...(event.after as Record<string, unknown>), LTTOT_TOP_AMOUNT: 1 };
  tampered[3] = JSON.stringify(event);
  assert.equal(verifyChainLines(tampered, integrity).ok, false);

  // ── feed.xml: 최근 이벤트가 Atom 엔트리로 실린다 ─────────────────
  const feed = readFileSync(join(sourceDir, "feed.xml"), "utf8");
  assert.ok(feed.startsWith('<?xml version="1.0" encoding="utf-8"?>'));
  assert.ok(feed.includes("<entry>"));
  assert.ok(feed.includes("urn:chronicle:bunyang-capsule"));
  assert.ok(feed.includes("[변경] apt-mdl:2026000001:2026000001:02"));
});

test("빈 수집 안전판: 저장 상태가 있는데 0건이 오면 중단한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-guard-"));
  let datasets = day1;
  const http = odcloudEmulator(() => datasets);
  const run = (isoNow: string) =>
    runOnce({ sourceId: "bunyang-capsule", root, dataDir, adapter, http, now: () => new Date(isoNow), log: () => {} });

  await run("2026-07-09T05:00:00.000Z");
  datasets = { getAPTLttotPblancDetail: [], getAPTLttotPblancMdl: [] };
  await assert.rejects(() => run("2026-07-10T05:00:00.000Z"), /수집 결과 0건/);

  // 중단된 실행은 아무것도 쓰지 않았어야 한다.
  const lines = readFileSync(join(dataDir, "bunyang-capsule", "changes.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "");
  assert.equal(lines.length, 7);
});
