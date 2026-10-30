/**
 * 원장 접근 추상 — MCP 질의 표면이 읽는 데이터 소스.
 *
 * 두 구현:
 *   remoteLedger(repo)  — 공개 raw 원장을 fetch (제품: 누구나 공개 원장을 질의)
 *   localLedger(dataDir) — 로컬 data/ (리포 옆에서 실행·테스트용)
 *
 * 무상태 계약: 원장은 append-only 공개물이라 서버는 상태를 갖지 않는다 —
 * 매 질의는 공개 원장을 그대로 읽고, 신뢰가 필요하면 verify_source로 재계산한다.
 */
import { existsSync, readFileSync } from "node:fs";
import type { IntegrityState } from "../engine/integrity.js";
import { loadIntegrity, readChangeLines, sourcePaths } from "../engine/store.js";
import { listSourceDirs } from "../engine/verify.js";

export interface LatestRecord {
  source_url: string;
  fields: Record<string, unknown>;
}

export interface LatestFile {
  source_id: string;
  updated_at: string;
  record_count: number;
  records: Record<string, LatestRecord>;
}

export interface Ledger {
  sources(): Promise<string[]>;
  changeLines(source: string): Promise<string[]>;
  latest(source: string): Promise<LatestFile | null>;
  integrity(source: string): Promise<IntegrityState | null>;
}

export function localLedger(dataDir: string): Ledger {
  return {
    async sources() {
      return listSourceDirs(dataDir);
    },
    async changeLines(source) {
      return readChangeLines(sourcePaths(dataDir, source));
    },
    async latest(source) {
      const path = sourcePaths(dataDir, source).latestPath;
      return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as LatestFile) : null;
    },
    async integrity(source) {
      return loadIntegrity(sourcePaths(dataDir, source));
    },
  };
}

/**
 * 공개 원장을 raw.githubusercontent.com에서 읽는다. 세션 내 단순 캐시로
 * 같은 파일 반복 fetch를 피한다 (원장은 append-only라 세션 캐시가 안전).
 */
export function remoteLedger(repo: string, fetchImpl: typeof fetch = fetch): Ledger {
  const base = `https://raw.githubusercontent.com/${repo}/main`;
  const cache = new Map<string, Promise<string | null>>();
  const getText = (path: string): Promise<string | null> => {
    if (!cache.has(path)) {
      cache.set(
        path,
        fetchImpl(`${base}/${path}`, { signal: AbortSignal.timeout(30_000) })
          .then((response) => (response.ok ? response.text() : null))
          .catch(() => null),
      );
    }
    return cache.get(path)!;
  };
  return {
    async sources() {
      const text = await getText("docs/status.json");
      if (!text) return [];
      return (JSON.parse(text) as { source_id: string }[]).map((entry) => entry.source_id);
    },
    async changeLines(source) {
      const text = await getText(`data/${source}/changes.jsonl`);
      return text ? text.split("\n").filter((line) => line.trim() !== "") : [];
    },
    async latest(source) {
      const text = await getText(`data/${source}/latest.json`);
      return text ? (JSON.parse(text) as LatestFile) : null;
    },
    async integrity(source) {
      const text = await getText(`data/${source}/integrity.json`);
      return text ? (JSON.parse(text) as IntegrityState) : null;
    },
  };
}
