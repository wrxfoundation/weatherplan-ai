/**
 * 외부 앵커(RFC 3161) 검증 — 실제 TSA 없이 검사 가능한 것들:
 * TSQ 구조(openssl 대조), 멱등성, 실패 무해성(best-effort 계약).
 * 성공 경로의 실제 TSR 저장은 운영 첫 실행에서 확인한다.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/bunyang-capsule/adapter.js";
import { anchorSource, buildTimestampQuery } from "../engine/anchor.js";
import { runOnce } from "../engine/pipeline.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;

async function setupChain(): Promise<string> {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-anchor-"));
  await runOnce({
    sourceId: "bunyang-capsule",
    root,
    dataDir,
    adapter,
    http: odcloudEmulator(() => day1),
    now: () => new Date("2026-07-09T05:00:00.000Z"),
    log: () => {},
  });
  return dataDir;
}

test("TSQ는 유효한 RFC 3161 TimeStampReq다 (openssl 파싱 + 다이제스트 포함)", () => {
  const digest = "a".repeat(64);
  const tsq = buildTimestampQuery(digest);
  const parsed = execFileSync("openssl", ["asn1parse", "-inform", "DER"], { input: tsq, encoding: "utf8" });
  assert.ok(parsed.includes("sha256"), "해시 알고리즘이 sha256이어야 한다");
  assert.ok(parsed.toUpperCase().includes("A".repeat(64)), "체인 머리 다이제스트가 요청에 들어가야 한다");
  assert.throws(() => buildTimestampQuery("not-a-hash"), /SHA-256 hex/);
});

test("멱등성: 같은 체인 머리는 두 번 앵커하지 않는다 (+전 TSA 실패 시 폴백 순회 후 예외)", async () => {
  const dataDir = await setupChain();
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    return new Response("garbage", { status: 200 });
  }) as typeof fetch;

  // 첫 시도: 모든 TSA 응답이 쓰레기 → 폴백 3곳 전부 순회 후 예외 → 앵커 없음
  await assert.rejects(() => anchorSource({ sourceId: "bunyang-capsule", dataDir, fetchImpl: fakeFetch, log: () => {} }), /모든 TSA/);
  assert.equal(calls, 3, "기본 TSA 3곳을 전부 시도해야 한다");
  assert.ok(!existsSync(join(dataDir, "bunyang-capsule", "anchors.jsonl")), "유효하지 않은 응답은 기록하면 안 된다");

  // 앵커 성공을 가장하기 위해 anchors.jsonl에 현재 머리를 직접 기록 후 재시도 → 네트워크 호출 없음
  const integrity = JSON.parse(readFileSync(join(dataDir, "bunyang-capsule", "integrity.json"), "utf8"));
  const { appendFileSync } = await import("node:fs");
  appendFileSync(
    join(dataDir, "bunyang-capsule", "anchors.jsonl"),
    `${JSON.stringify({ anchored_at: "2026-07-09T06:00:00.000Z", chain_hash: integrity.chain_hash })}\n`,
  );
  const result = await anchorSource({ sourceId: "bunyang-capsule", dataDir, fetchImpl: fakeFetch, log: () => {} });
  assert.equal(result, "already-anchored");
  assert.equal(calls, 3, "이미 앵커된 머리에는 추가 네트워크 호출이 없어야 한다");
});

test("폴백: 첫 TSA가 죽어도 둘째가 살아있으면... (성공 경로는 실서명 필요라 실패 순회만 검증)", async () => {
  const dataDir = await setupChain();
  const attempts: string[] = [];
  const fakeFetch = (async (url: string | URL) => {
    attempts.push(String(url));
    throw new Error("ECONNREFUSED");
  }) as unknown as typeof fetch;
  await assert.rejects(
    () => anchorSource({ sourceId: "bunyang-capsule", dataDir, tsaUrls: ["http://tsa-a.test", "http://tsa-b.test"], fetchImpl: fakeFetch, log: () => {} }),
    /모든 TSA\(2곳\) 실패/,
  );
  assert.deepEqual(attempts, ["http://tsa-a.test", "http://tsa-b.test"], "선언 순서대로 폴백해야 한다");
});

test("체인이 없으면 조용히 생략한다", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-anchor-empty-"));
  const result = await anchorSource({
    sourceId: "bunyang-capsule",
    dataDir,
    fetchImpl: (async () => {
      throw new Error("호출되면 안 됨");
    }) as typeof fetch,
    log: () => {},
  });
  assert.equal(result, "no-chain");
});

test("anchor CLI는 TSA 장애에도 종료코드 0이다 (수집을 막지 않는다)", async () => {
  const dataDir = await setupChain();
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const { stderr } = await execFileAsync(
    process.execPath,
    ["--import", "tsx", "engine/anchor.ts", "bunyang-capsule", "--data-dir", dataDir],
    {
      cwd: root,
      timeout: 60_000,
      // 존재하지 않는 TSA — 네트워크 실패 강제
      env: { ...process.env, CHRONICLE_TSA_URL: "https://127.0.0.1:1/tsr" },
    },
  );
  assert.ok(stderr.includes("앵커 실패(생략"), "실패 사유를 로그로 남겨야 한다");
});
