/**
 * 엔진 안전판 단위 테스트 — 합성 어댑터로 대량 삭제 차단기를 검증한다.
 * (빈 수집 안전판은 e2e.test.ts에서 실제 어댑터로 검증)
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { runOnce } from "../engine/pipeline.js";
import type { NormalizedRecord, SourceAdapter, SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function records(count: number): NormalizedRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    entityId: `r${String(i + 1).padStart(2, "0")}`,
    sourceUrl: "https://example.com/",
    fields: { v: 1 },
  }));
}

function makeAdapter(current: () => NormalizedRecord[]): SourceAdapter {
  return {
    id: "synthetic",
    family: "api-records",
    collect: async () => ({ raw: { count: current().length }, records: current() }),
  };
}

const config: SourceConfig = { id: "synthetic", family: "api-records", title: "합성 테스트" };

function runner(dataDir: string, current: () => NormalizedRecord[], cfg: SourceConfig = config) {
  return (isoNow: string) =>
    runOnce({
      sourceId: "synthetic",
      root,
      dataDir,
      adapter: makeAdapter(current),
      config: cfg,
      now: () => new Date(isoNow),
      log: () => {},
    });
}

test("대량 삭제 차단기: 삭제 비율이 상한을 넘으면 봉인 전에 중단한다", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-breaker-"));
  let current = records(12);
  const run = runner(dataDir, () => current);

  const first = await run("2026-07-09T00:00:00.000Z");
  assert.equal(first.added, 12);

  current = records(2); // 10/12 = 83% 삭제 — 부분 응답 의심
  await assert.rejects(() => run("2026-07-10T00:00:00.000Z"), /삭제 이벤트 10건/);

  // 중단된 실행은 아무것도 봉인하지 않았다 — 같은 상태에서 상한을 올리면 통과한다.
  const relaxed = runner(dataDir, () => current, { ...config, max_removal_ratio: 0.95 });
  const second = await relaxed("2026-07-11T00:00:00.000Z");
  assert.equal(second.removed, 10);
  assert.equal(second.chainLength, 22);
});

test("대량 삭제 차단기: 감지 대상이 10건 미만이면 개입하지 않는다", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-breaker-small-"));
  let current = records(5);
  const run = runner(dataDir, () => current);

  await run("2026-07-09T00:00:00.000Z");
  current = records(1); // 4/5 = 80% 지만 대상이 작아 정상 처리
  const second = await run("2026-07-10T00:00:00.000Z");
  assert.equal(second.removed, 4);
});
