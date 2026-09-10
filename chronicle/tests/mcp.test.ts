/**
 * chronicle-mcp 질의 표면 검증 — 실제 봉인 원장(bunyang 2일치) 위에서
 * 도구·RPC 디스패치를 굴린다. get_history의 시간해자 질의가 정본이다.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { runOnce } from "../engine/pipeline.js";
import { localLedger, remoteLedger } from "../mcp/ledger.js";
import { getChanges, getHistory, getRecord, listSources, verifySource } from "../mcp/tools.js";
import { handleRpc } from "../mcp/server.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;
const day2 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day2.json"), "utf8")) as OdcloudDatasets;

const MODEL = "apt-mdl:2026000001:2026000001:02"; // day2에서 분양가 129900→127500 정정되는 엔티티

async function seed(): Promise<string> {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-mcp-"));
  let datasets = day1;
  const http = odcloudEmulator(() => datasets);
  await runOnce({ sourceId: "bunyang-capsule", root, dataDir, adapter, http, now: () => new Date("2026-07-09T05:00:00.000Z"), log: () => {} });
  datasets = day2;
  await runOnce({ sourceId: "bunyang-capsule", root, dataDir, adapter, http, now: () => new Date("2026-07-20T05:00:00.000Z"), log: () => {} });
  return dataDir;
}

test("list_sources: 현황 집계", async () => {
  const ledger = localLedger(await seed());
  const result = (await listSources(ledger)) as { count: number; sources: { source: string; records: number; events: number }[] };
  assert.equal(result.count, 1);
  assert.equal(result.sources[0].source, "bunyang-capsule");
  assert.equal(result.sources[0].records, 7);
  assert.equal(result.sources[0].events, 12);
});

test("get_record: 현재 상태 조회 (있음/없음)", async () => {
  const ledger = localLedger(await seed());
  const found = (await getRecord(ledger, "bunyang-capsule", "apt:2026000001:2026000001")) as { found: boolean; fields: Record<string, unknown> };
  assert.equal(found.found, true);
  assert.equal(found.fields.HOUSE_NM, "서울숲 리버뷰 자이");
  const missing = (await getRecord(ledger, "bunyang-capsule", "apt:9:9")) as { found: boolean };
  assert.equal(missing.found, false);
});

test("get_history: 시간해자 질의 — 생성 + 분양가 정정이 시간순으로 보인다", async () => {
  const ledger = localLedger(await seed());
  const history = (await getHistory(ledger, "bunyang-capsule", MODEL)) as {
    event_count: number;
    timeline: { field: string; before: unknown; after: unknown }[];
  };
  assert.equal(history.event_count, 2);
  assert.equal(history.timeline[0].field, "(레코드 신규)");
  const priceEvent = history.timeline.find((event) => event.field === "LTTOT_TOP_AMOUNT")!;
  assert.equal(priceEvent.before, 129900);
  assert.equal(priceEvent.after, 127500);
});

test("get_changes: since 필터로 특정일 이후 이벤트만", async () => {
  const ledger = localLedger(await seed());
  const recent = (await getChanges(ledger, "bunyang-capsule", { since: "2026-07-15T00:00:00.000Z" })) as {
    total_matched: number;
    events: { observed_at: string }[];
  };
  // day2(07-20) 이벤트만 — day1(07-09)은 걸러진다
  assert.ok(recent.total_matched > 0);
  assert.ok(recent.events.every((event) => event.observed_at >= "2026-07-15"));
});

test("verify_source: 체인을 호출로 검증한다", async () => {
  const ledger = localLedger(await seed());
  const verdict = (await verifySource(ledger, "bunyang-capsule")) as { ok: boolean; length: number };
  assert.equal(verdict.ok, true);
  assert.equal(verdict.length, 12);
});

test("handleRpc: initialize / tools/list / tools/call / 알림 / 미지 메서드", async () => {
  const ledger = localLedger(await seed());

  const init = (await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }, ledger)) as {
    result: { protocolVersion: string; serverInfo: { name: string } };
  };
  assert.equal(init.result.protocolVersion, "2025-06-18"); // 클라이언트 버전 에코
  assert.equal(init.result.serverInfo.name, "chronicle-mcp");

  assert.equal(await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, ledger), null);

  const list = (await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, ledger)) as { result: { tools: { name: string }[] } };
  assert.deepEqual(
    list.result.tools.map((tool) => tool.name).sort(),
    ["get_changes", "get_history", "get_record", "list_sources", "verify_source"],
  );

  const call = (await handleRpc(
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_history", arguments: { source: "bunyang-capsule", entity_id: MODEL } } },
    ledger,
  )) as { result: { content: { text: string }[] } };
  const payload = JSON.parse(call.result.content[0].text) as { event_count: number };
  assert.equal(payload.event_count, 2);

  const badArgs = (await handleRpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_record", arguments: {} } }, ledger)) as {
    result: { isError: boolean };
  };
  assert.equal(badArgs.result.isError, true);

  const unknown = (await handleRpc({ jsonrpc: "2.0", id: 5, method: "frobnicate" }, ledger)) as { error: { code: number } };
  assert.equal(unknown.error.code, -32601);
});

test("remoteLedger: raw URL·status 매니페스트를 fetch로 읽는다", async () => {
  const dataDir = await seed();
  const local = localLedger(dataDir);
  const changes = (await local.changeLines("bunyang-capsule")).join("\n");
  const latest = JSON.stringify(await local.latest("bunyang-capsule"));
  const integrity = JSON.stringify(await local.integrity("bunyang-capsule"));

  const fakeFetch = (async (url: string | URL) => {
    const path = String(url);
    const body = path.endsWith("docs/status.json")
      ? JSON.stringify([{ source_id: "bunyang-capsule" }])
      : path.endsWith("changes.jsonl")
        ? changes
        : path.endsWith("latest.json")
          ? latest
          : path.endsWith("integrity.json")
            ? integrity
            : null;
    return new Response(body, { status: body === null ? 404 : 200 });
  }) as unknown as typeof fetch;

  const remote = remoteLedger("kwangdol-star/aiagentlabs", fakeFetch);
  assert.deepEqual(await remote.sources(), ["bunyang-capsule"]);
  const verdict = (await verifySource(remote, "bunyang-capsule")) as { ok: boolean };
  assert.equal(verdict.ok, true, "원격 원장도 로컬과 동일하게 검증 통과");
});
