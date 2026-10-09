import assert from "node:assert/strict";
import { appendFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { runOnce } from "../engine/pipeline.js";
import { collectStatus } from "../engine/status.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;

test("status: 체인·레코드·앵커 현황을 집계한다", async () => {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-status-"));
  assert.deepEqual(collectStatus(dataDir), []);

  await runOnce({
    sourceId: "bunyang-capsule",
    root,
    dataDir,
    adapter,
    http: odcloudEmulator(() => day1),
    now: () => new Date("2026-07-09T05:00:00.000Z"),
    log: () => {},
  });

  let [status] = collectStatus(dataDir);
  assert.equal(status.source_id, "bunyang-capsule");
  assert.equal(status.records, 7);
  assert.equal(status.chain_length, 7);
  assert.equal(status.updated_at, "2026-07-09T05:00:00.000Z");
  assert.equal(status.head_anchored, false);

  // 현재 머리 앵커를 기록하면 head_anchored=true
  appendFileSync(
    join(dataDir, "bunyang-capsule", "anchors.jsonl"),
    `${JSON.stringify({ anchored_at: "2026-07-09T06:00:00.000Z", chain_hash: status.chain_head })}\n`,
  );
  [status] = collectStatus(dataDir);
  assert.equal(status.anchors, 1);
  assert.equal(status.head_anchored, true);
});
