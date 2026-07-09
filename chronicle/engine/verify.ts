/**
 * CLI: npm run verify -- <source-id> [--data-dir <path>] [--root <path>]
 *
 * changes.jsonl 전체를 제네시스부터 재계산해 integrity.json과 대조한다.
 * 체인이 온전하면 0, 훼손이 발견되면 1로 종료한다.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { genesisHash, verifyChainLines } from "./integrity.js";
import { loadIntegrity, readChangeLines, sourcePaths } from "./store.js";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "data-dir": { type: "string" }, root: { type: "string" } },
  });
  const sourceId = positionals[0];
  if (!sourceId) {
    console.error("사용법: npm run verify -- <source-id> [--data-dir <path>] [--root <path>]");
    process.exit(2);
  }

  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  const paths = sourcePaths(dataDir, sourceId);
  const integrity = loadIntegrity(paths);
  const lines = readChangeLines(paths);

  if (!integrity) {
    if (lines.length > 0) {
      console.error(`✗ ${sourceId}: changes.jsonl은 ${lines.length}줄인데 integrity.json이 없습니다.`);
      process.exit(1);
    }
    console.log(`○ ${sourceId}: 아직 체인이 없습니다 (첫 수집 전).`);
    return;
  }

  if (integrity.genesis !== genesisHash(sourceId)) {
    console.error(`✗ ${sourceId}: genesis 불일치 — integrity.json이 다른 소스의 것이거나 변조되었습니다.`);
    process.exit(1);
  }

  const result = verifyChainLines(lines, integrity);
  if (!result.ok) {
    console.error(`✗ ${sourceId}: 해시체인 검증 실패 (${result.errors.length}건)`);
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`✓ ${sourceId}: 이벤트 ${result.length}건, 체인 온전 (head ${result.chain_hash.slice(0, 16)}…)`);
}

main();
