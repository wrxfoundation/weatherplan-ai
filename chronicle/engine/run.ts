/**
 * CLI: npm run collect -- <source-id> [--dry-run] [--data-dir <path>] [--root <path>]
 *
 * 종료 코드 0 = 성공(변경 유무 무관). 변경이 없으면 파일을 전혀 쓰지 않으므로
 * 워크플로우의 "git diff 비면 커밋 생략"과 맞물린다.
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { runOnce } from "./pipeline.js";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "dry-run": { type: "boolean", default: false },
      "data-dir": { type: "string" },
      root: { type: "string" }, // sources/·data/의 부모 (테스트·도구용)
    },
  });
  const sourceId = positionals[0];
  if (!sourceId) {
    console.error("사용법: npm run collect -- <source-id> [--dry-run] [--data-dir <path>] [--root <path>]");
    process.exit(2);
  }

  const root = values.root ? resolve(values.root) : defaultRoot;
  const summary = await runOnce({
    sourceId,
    root,
    dataDir: values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data"),
    dryRun: values["dry-run"],
  });

  console.log(
    JSON.stringify(
      {
        source_id: summary.sourceId,
        observed_at: summary.observedAt,
        added: summary.added,
        changed: summary.changed,
        removed: summary.removed,
        chain_length: summary.chainLength,
        chain_hash: summary.chainHash,
        wrote: summary.wrote,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
