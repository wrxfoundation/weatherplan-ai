/**
 * CLI: npm run verify -- <source-id> [--data-dir <path>] [--root <path>]
 *      npm run verify -- --all       (data/ 아래 모든 소스 일괄 검증)
 *
 * changes.jsonl 전체를 제네시스부터 재계산해 integrity.json과 대조한다.
 * 체인이 온전하면 0, 훼손이 발견되면 1로 종료한다.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { genesisHash, verifyChainLines } from "./integrity.js";
import { loadIntegrity, readChangeLines, sourcePaths } from "./store.js";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** 한 소스 검증 — 성공 true / 실패 false (사유는 콘솔에). */
function verifySource(dataDir: string, sourceId: string): boolean {
  const paths = sourcePaths(dataDir, sourceId);
  const integrity = loadIntegrity(paths);
  const lines = readChangeLines(paths);

  if (!integrity) {
    if (lines.length > 0) {
      console.error(`✗ ${sourceId}: changes.jsonl은 ${lines.length}줄인데 integrity.json이 없습니다.`);
      return false;
    }
    console.log(`○ ${sourceId}: 아직 체인이 없습니다 (첫 수집 전).`);
    return true;
  }

  if (integrity.genesis !== genesisHash(sourceId)) {
    console.error(`✗ ${sourceId}: genesis 불일치 — integrity.json이 다른 소스의 것이거나 변조되었습니다.`);
    return false;
  }

  const result = verifyChainLines(lines, integrity);
  if (!result.ok) {
    console.error(`✗ ${sourceId}: 해시체인 검증 실패 (${result.errors.length}건)`);
    for (const error of result.errors) console.error(`  - ${error}`);
    return false;
  }
  console.log(`✓ ${sourceId}: 이벤트 ${result.length}건, 체인 온전 (head ${result.chain_hash.slice(0, 16)}…)`);
  return true;
}

/** data/ 아래에서 소스 디렉터리(원장 또는 체인 상태 보유)를 찾는다. */
export function listSourceDirs(dataDir: string): string[] {
  if (!existsSync(dataDir)) return [];
  return readdirSync(dataDir)
    .filter((name) => statSync(join(dataDir, name)).isDirectory())
    .filter((name) => existsSync(join(dataDir, name, "integrity.json")) || existsSync(join(dataDir, name, "changes.jsonl")))
    .sort();
}

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "data-dir": { type: "string" }, root: { type: "string" }, all: { type: "boolean", default: false } },
  });
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");

  if (values.all) {
    const sources = listSourceDirs(dataDir);
    if (sources.length === 0) {
      console.log("○ 검증할 소스가 없습니다 (첫 수집 전).");
      return;
    }
    const failed = sources.filter((sourceId) => !verifySource(dataDir, sourceId));
    if (failed.length > 0) {
      console.error(`✗ ${failed.length}/${sources.length} 소스 검증 실패: ${failed.join(", ")}`);
      process.exit(1);
    }
    console.log(`✓ 전체 ${sources.length}개 소스 체인 온전`);
    return;
  }

  const sourceId = positionals[0];
  if (!sourceId) {
    console.error("사용법: npm run verify -- <source-id> [--data-dir <path>] [--root <path>] | --all");
    process.exit(2);
  }
  if (!verifySource(dataDir, sourceId)) process.exit(1);
}

// status.ts 등이 listSourceDirs를 임포트할 때 CLI가 실행되지 않도록 진입 가드
const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCliEntry) main();
