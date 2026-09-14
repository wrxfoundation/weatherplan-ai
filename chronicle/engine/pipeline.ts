/**
 * 파이프라인 1회 실행: fetch → normalize → diff → hash-chain → publish.
 *
 * 변경이 없으면 아무것도 쓰지 않는다 — 크론 워크플로우가 "변경 시에만 커밋"을
 * git diff로 판정할 수 있도록 파일시스템을 건드리지 않는 것이 계약이다.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";
import { diffRecords, toRecordMap } from "./diff.js";
import { createHttpClient } from "./fetch.js";
import { initialIntegrity, sealEvents } from "./integrity.js";
import { buildFeed, FEED_ENTRY_LIMIT } from "./publish.js";
import { recoverState } from "./recover.js";
import {
  appendChanges,
  readChangeLines,
  sourcePaths,
  writeFeed,
  writeIntegrity,
  writeLatest,
  writeSnapshot,
} from "./store.js";
import {
  RECORD_FIELD,
  type ChangeEvent,
  type CollectContext,
  type HttpClient,
  type NormalizedRecord,
  type SourceAdapter,
  type SourceConfig,
  type UnsealedEvent,
} from "./types.js";

export interface RunOptions {
  sourceId: string;
  /** chronicle/ 루트 (sources/, data/ 의 부모). */
  root: string;
  dataDir?: string;
  /** 계산만 하고 아무것도 쓰지 않는다. */
  dryRun?: boolean;
  /** 테스트 주입 지점 — 생략 시 sources/<id>/adapter.ts 를 동적 로드. */
  adapter?: SourceAdapter;
  /** 테스트 주입 지점 — 생략 시 sources/<id>/config.yml 을 로드. */
  config?: SourceConfig;
  http?: HttpClient;
  now?: () => Date;
  log?: (message: string) => void;
}

export interface RunSummary {
  sourceId: string;
  observedAt: string;
  added: number;
  changed: number;
  removed: number;
  events: ChangeEvent[];
  chainLength: number;
  chainHash: string;
  wrote: boolean;
}

export function loadConfig(root: string, sourceId: string): SourceConfig {
  const configPath = join(root, "sources", sourceId, "config.yml");
  const config = YAML.parse(readFileSync(configPath, "utf8")) as SourceConfig;
  if (config.id !== sourceId) {
    throw new Error(`config.yml의 id(${config.id})가 디렉터리명(${sourceId})과 다릅니다.`);
  }
  return config;
}

async function loadAdapter(root: string, sourceId: string): Promise<SourceAdapter> {
  const adapterPath = join(root, "sources", sourceId, "adapter.ts");
  const module = (await import(pathToFileURL(adapterPath).href)) as { default?: SourceAdapter };
  if (!module.default) {
    throw new Error(`sources/${sourceId}/adapter.ts 는 SourceAdapter를 default export 해야 합니다.`);
  }
  return module.default;
}

export async function runOnce(options: RunOptions): Promise<RunSummary> {
  const log = options.log ?? ((message: string) => console.error(message));
  const now = options.now ?? (() => new Date());
  const config = options.config ?? loadConfig(options.root, options.sourceId);
  const adapter = options.adapter ?? (await loadAdapter(options.root, options.sourceId));
  if (adapter.id !== config.id) {
    throw new Error(`어댑터 id(${adapter.id})가 config id(${config.id})와 다릅니다.`);
  }
  if (adapter.family !== config.family) {
    throw new Error(`어댑터 계열(${adapter.family})이 config 계열(${config.family})과 다릅니다.`);
  }

  const paths = sourcePaths(options.dataDir ?? join(options.root, "data"), config.id);
  const ctx: CollectContext = {
    config,
    http:
      options.http ??
      createHttpClient({ minIntervalMs: Number(config.rate_limit_ms ?? 0) || 0 }),
    log,
    now,
  };

  // 크래시 복구: 원장을 재검증하고 파생 파일(integrity/latest)이 뒤처졌으면 재구성.
  const recovered = recoverState(paths, config.id, {
    title: config.title ?? config.id,
    heal: !options.dryRun,
    log,
  });
  const stored = recovered.stored;

  const result = await adapter.collect(ctx);
  const fetched = toRecordMap(result.records);

  // 안전판 1: 저장된 상태가 있는데 수집이 통째로 비면 소스 장애로 간주하고 중단한다.
  // (빈 응답을 그대로 diff하면 전체가 "삭제" 이벤트로 오염된다.)
  if (fetched.size === 0 && stored.size > 0 && !config.allow_empty) {
    throw new Error(
      `수집 결과 0건 (저장 레코드 ${stored.size}건) — 소스 장애 의심. ` +
        `의도된 상황이면 config.yml에 allow_empty: true 를 명시하세요.`,
    );
  }

  const changes = diffRecords(stored, fetched, result.removalScope);

  // 안전판 2: 삭제 이벤트가 감지 대상의 일정 비율을 넘으면 부분 응답/소스 장애로
  // 간주하고 중단한다 — 오탐 삭제가 영구 원장에 대량 봉인되는 것을 막는다.
  const removalCount = changes.filter((c) => c.field === RECORD_FIELD && c.after === null).length;
  if (removalCount > 0) {
    const scoped = [...stored.values()].filter(
      (record) => !result.removalScope || result.removalScope(record),
    ).length;
    const maxRatio = Number(config.max_removal_ratio ?? 0.3);
    if (scoped >= 10 && removalCount / scoped > maxRatio) {
      throw new Error(
        `삭제 이벤트 ${removalCount}건이 삭제 감지 대상 ${scoped}건의 ${Math.round((removalCount / scoped) * 100)}%` +
          ` — 부분 응답/소스 장애 의심으로 중단. 실제 대량 삭제면 config.yml의 max_removal_ratio를 상향하세요.`,
      );
    }
  }

  const observedAt = now().toISOString();

  const summaryBase = {
    sourceId: config.id,
    observedAt,
    added: changes.filter((c) => c.field === RECORD_FIELD && c.before === null).length,
    removed: changes.filter((c) => c.field === RECORD_FIELD && c.after === null).length,
  };
  const changed = changes.length - summaryBase.added - summaryBase.removed;

  const integrity = recovered.integrity ?? initialIntegrity(config.id, observedAt);

  if (changes.length === 0) {
    log(`[${config.id}] 변경 없음 — 아무것도 쓰지 않음 (체인 길이 ${integrity.length})`);
    return {
      ...summaryBase,
      changed,
      events: [],
      chainLength: integrity.length,
      chainHash: integrity.chain_hash,
      wrote: false,
    };
  }

  const unsealed: UnsealedEvent[] = changes.map((change) => ({ observed_at: observedAt, ...change }));
  const { events, state } = sealEvents(integrity, unsealed);

  log(
    `[${config.id}] 신규 ${summaryBase.added} · 변경 ${changed} · 삭제 ${summaryBase.removed}` +
      ` — 체인 ${integrity.length} → ${state.length}`,
  );

  if (options.dryRun) {
    return { ...summaryBase, changed, events, chainLength: state.length, chainHash: state.chain_hash, wrote: false };
  }

  // 1) 원본 스냅샷 보존 → 2) 원장 append → 3) 체인 봉인 → 4) 현재 상태 → 5) 피드
  writeSnapshot(paths, config.id, observedAt, result.raw);
  appendChanges(paths, events);
  writeIntegrity(paths, state);

  const nextState = new Map<string, NormalizedRecord>(stored);
  for (const [entityId, record] of fetched) nextState.set(entityId, record);
  for (const event of events) {
    if (event.field === RECORD_FIELD && event.after === null) nextState.delete(event.entity_id);
  }
  writeLatest(paths, config.id, nextState, observedAt);

  const allLines = readChangeLines(paths);
  const recentEvents = allLines.slice(-FEED_ENTRY_LIMIT).map((line) => JSON.parse(line) as ChangeEvent);
  writeFeed(paths, buildFeed(config.id, config.title ?? config.id, recentEvents));

  return { ...summaryBase, changed, events, chainLength: state.length, chainHash: state.chain_hash, wrote: true };
}
