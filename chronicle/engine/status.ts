/**
 * CLI: npm run status [-- --data-dir <path>] [--root <path>] [--json]
 *
 * 전 소스 운영 현황 한눈에: 레코드 수 · 체인 길이/머리 · 마지막 관측 ·
 * 외부 앵커 상태(현재 머리가 앵커됐는지).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { loadIntegrity, loadLatest, readChangeLines, sourcePaths } from "./store.js";
import { listSourceDirs } from "./verify.js";

interface SourceStatus {
  source_id: string;
  records: number;
  chain_length: number;
  chain_head: string;
  updated_at: string;
  anchors: number;
  head_anchored: boolean;
}

export function collectStatus(dataDir: string): SourceStatus[] {
  return listSourceDirs(dataDir).map((sourceId) => {
    const paths = sourcePaths(dataDir, sourceId);
    const integrity = loadIntegrity(paths);
    const anchorsPath = join(paths.dir, "anchors.jsonl");
    const anchorLines = existsSync(anchorsPath)
      ? readFileSync(anchorsPath, "utf8").split("\n").filter((line) => line.trim() !== "")
      : [];
    return {
      source_id: sourceId,
      records: loadLatest(paths).size,
      chain_length: integrity?.length ?? 0,
      chain_head: integrity?.chain_hash ?? "-",
      updated_at: integrity?.updated_at ?? "-",
      anchors: anchorLines.length,
      head_anchored: integrity ? anchorLines.some((line) => line.includes(`"chain_hash":"${integrity.chain_hash}"`)) : false,
    };
  });
}

const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { values } = parseArgs({
    allowPositionals: true,
    options: { "data-dir": { type: "string" }, root: { type: "string" }, json: { type: "boolean", default: false } },
  });
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  const statuses = collectStatus(dataDir);

  if (values.json) {
    console.log(JSON.stringify(statuses, null, 2));
  } else if (statuses.length === 0) {
    console.log("○ 소스 없음 (첫 수집 전).");
  } else {
    for (const s of statuses) {
      const anchor = s.head_anchored ? `앵커 ✓(${s.anchors})` : s.anchors > 0 ? `앵커 뒤처짐(${s.anchors})` : "앵커 없음";
      console.log(
        `${s.source_id}  레코드 ${s.records} · 체인 ${s.chain_length} (${s.chain_head.slice(0, 12)}…) · 최신 ${s.updated_at} · ${anchor}`,
      );
    }
  }
}
