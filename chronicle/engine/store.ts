/**
 * data/<id>/ 디렉터리 I/O.
 *
 * 레이아웃 (PLAN.md §0):
 *   data/<id>/snapshots/<ts>.json   원본 응답 무가공 보존 (변경이 있던 날만)
 *   data/<id>/changes.jsonl         append-only 변경 원장 — 과거 줄 수정 금지
 *   data/<id>/latest.json           마지막으로 관측된 현재 상태
 *   data/<id>/integrity.json        해시체인 봉인 상태
 *   data/<id>/feed.xml              최근 변경 Atom 피드
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson, type IntegrityState } from "./integrity.js";
import type { ChangeEvent, NormalizedRecord } from "./types.js";

export interface SourcePaths {
  dir: string;
  snapshotsDir: string;
  changesPath: string;
  latestPath: string;
  integrityPath: string;
  feedPath: string;
}

export function sourcePaths(dataDir: string, sourceId: string): SourcePaths {
  const dir = join(dataDir, sourceId);
  return {
    dir,
    snapshotsDir: join(dir, "snapshots"),
    changesPath: join(dir, "changes.jsonl"),
    latestPath: join(dir, "latest.json"),
    integrityPath: join(dir, "integrity.json"),
    feedPath: join(dir, "feed.xml"),
  };
}

interface LatestFile {
  source_id: string;
  updated_at: string;
  record_count: number;
  records: Record<string, { source_url: string; fields: Record<string, unknown> }>;
}

export function loadLatest(paths: SourcePaths): Map<string, NormalizedRecord> {
  if (!existsSync(paths.latestPath)) return new Map();
  const parsed = JSON.parse(readFileSync(paths.latestPath, "utf8")) as LatestFile;
  const map = new Map<string, NormalizedRecord>();
  for (const [entityId, record] of Object.entries(parsed.records)) {
    map.set(entityId, { entityId, sourceUrl: record.source_url, fields: record.fields });
  }
  return map;
}

/** 키 정렬 + 2칸 들여쓰기 — git diff가 읽히는 결정적 직렬화. */
function stablePrettyJson(value: unknown): string {
  return `${JSON.stringify(JSON.parse(canonicalJson(value)), null, 2)}\n`;
}

export function writeLatest(
  paths: SourcePaths,
  sourceId: string,
  records: Map<string, NormalizedRecord>,
  updatedAt: string,
): void {
  mkdirSync(paths.dir, { recursive: true });
  const out: LatestFile = { source_id: sourceId, updated_at: updatedAt, record_count: records.size, records: {} };
  for (const entityId of [...records.keys()].sort()) {
    const record = records.get(entityId)!;
    out.records[entityId] = { source_url: record.sourceUrl, fields: record.fields };
  }
  writeFileSync(paths.latestPath, stablePrettyJson(out));
}

/** latest.json의 updated_at — 파생 파일 신선도 판정용 (없으면 null). */
export function loadLatestUpdatedAt(paths: SourcePaths): string | null {
  if (!existsSync(paths.latestPath)) return null;
  return (JSON.parse(readFileSync(paths.latestPath, "utf8")) as LatestFile).updated_at ?? null;
}

export function loadIntegrity(paths: SourcePaths): IntegrityState | null {
  if (!existsSync(paths.integrityPath)) return null;
  return JSON.parse(readFileSync(paths.integrityPath, "utf8")) as IntegrityState;
}

export function writeIntegrity(paths: SourcePaths, state: IntegrityState): void {
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.integrityPath, stablePrettyJson(state));
}

/** changes.jsonl에 봉인된 이벤트를 덧붙인다 — append-only, 기존 줄은 절대 다시 쓰지 않는다. */
export function appendChanges(paths: SourcePaths, events: ChangeEvent[]): void {
  mkdirSync(paths.dir, { recursive: true });
  const lines = events.map((event) => `${canonicalJson(event)}\n`).join("");
  appendFileSync(paths.changesPath, lines);
}

export function readChangeLines(paths: SourcePaths): string[] {
  if (!existsSync(paths.changesPath)) return [];
  return readFileSync(paths.changesPath, "utf8").split("\n").filter((line) => line.trim() !== "");
}

export function writeSnapshot(paths: SourcePaths, sourceId: string, observedAt: string, raw: unknown): string {
  mkdirSync(paths.snapshotsDir, { recursive: true });
  const compact = observedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const file = join(paths.snapshotsDir, `${compact}.json`);
  writeFileSync(file, stablePrettyJson({ source_id: sourceId, observed_at: observedAt, raw }));
  return file;
}

export function writeFeed(paths: SourcePaths, xml: string): void {
  mkdirSync(paths.dir, { recursive: true });
  writeFileSync(paths.feedPath, xml);
}
