/**
 * MCP 도구 구현 (순수 함수 — 전송 계층과 분리, 테스트 대상).
 *
 * 시간해자를 질의 가능하게 만든다:
 *   get_history(entity)  — "언제 무엇이 바뀌었나"의 정본 (플래그십)
 *   get_changes(since)   — 최근 이벤트 스트림
 *   get_record(entity)   — 현재 상태
 *   list_sources         — 무엇을 추적 중인가
 *   verify_source        — 신뢰를 호출로 (제네시스부터 체인 재계산)
 */
import { genesisHash, verifyChainLines } from "../engine/integrity.js";
import { RECORD_FIELD, type ChangeEvent } from "../engine/types.js";
import type { Ledger } from "./ledger.js";

function humanField(event: ChangeEvent): string {
  if (event.field !== RECORD_FIELD) return event.field;
  return event.after === null ? "(레코드 삭제)" : "(레코드 신규)";
}

export async function listSources(ledger: Ledger): Promise<unknown> {
  const ids = await ledger.sources();
  const sources = [];
  for (const source of ids) {
    const integrity = await ledger.integrity(source);
    const latest = await ledger.latest(source);
    sources.push({
      source,
      records: latest?.record_count ?? 0,
      events: integrity?.length ?? 0,
      chain_head: integrity?.chain_hash ?? null,
      updated_at: integrity?.updated_at ?? null,
    });
  }
  return { count: sources.length, sources };
}

export async function getRecord(ledger: Ledger, source: string, entityId: string): Promise<unknown> {
  const latest = await ledger.latest(source);
  const record = latest?.records[entityId];
  if (!latest || !record) return { source, entity_id: entityId, found: false };
  return {
    source,
    entity_id: entityId,
    found: true,
    source_url: record.source_url,
    fields: record.fields,
    observed_at: latest.updated_at,
  };
}

export async function getHistory(ledger: Ledger, source: string, entityId: string): Promise<unknown> {
  const lines = await ledger.changeLines(source);
  const timeline = lines
    .map((line) => JSON.parse(line) as ChangeEvent)
    .filter((event) => event.entity_id === entityId)
    .map((event) => ({
      observed_at: event.observed_at,
      field: humanField(event),
      before: event.before,
      after: event.after,
      chain_hash: event.chain_hash,
    }));
  return { source, entity_id: entityId, event_count: timeline.length, timeline };
}

export interface ChangesOptions {
  since?: string;
  until?: string;
  field?: string;
  limit?: number;
}

export async function getChanges(ledger: Ledger, source: string, opts: ChangesOptions = {}): Promise<unknown> {
  const limit = Math.max(1, Math.min(500, opts.limit ?? 50));
  const lines = await ledger.changeLines(source);
  let events = lines.map((line) => JSON.parse(line) as ChangeEvent);
  if (opts.since) events = events.filter((event) => event.observed_at >= opts.since!);
  if (opts.until) events = events.filter((event) => event.observed_at <= opts.until!);
  if (opts.field) events = events.filter((event) => event.field === opts.field);
  const totalMatched = events.length;
  const page = events.slice(-limit);
  return {
    source,
    since: opts.since ?? null,
    total_matched: totalMatched,
    returned: page.length,
    events: page.map((event) => ({
      observed_at: event.observed_at,
      entity_id: event.entity_id,
      field: humanField(event),
      before: event.before,
      after: event.after,
    })),
  };
}

export async function verifySource(ledger: Ledger, source: string): Promise<unknown> {
  const lines = await ledger.changeLines(source);
  const integrity = await ledger.integrity(source);
  if (!integrity) {
    return { source, ok: lines.length === 0, reason: lines.length > 0 ? "integrity.json 없음" : "아직 체인 없음" };
  }
  const genesisOk = integrity.genesis === genesisHash(source);
  const result = verifyChainLines(lines, integrity);
  return {
    source,
    ok: genesisOk && result.ok,
    length: result.length,
    chain_head: result.chain_hash,
    genesis_ok: genesisOk,
    errors: genesisOk ? result.errors : ["genesis 불일치 — 다른 소스의 integrity이거나 변조"],
    note: "제네시스부터 전 줄 재계산 — 신뢰 없이 검증됨",
  };
}

/** 도구 이름 → 실행 (server가 dispatch에 사용). */
export function requireArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value === "") throw new Error(`인자 '${key}'(문자열)가 필요합니다`);
  return value;
}

export async function dispatch(name: string, args: Record<string, unknown>, ledger: Ledger): Promise<unknown> {
  switch (name) {
    case "list_sources":
      return listSources(ledger);
    case "get_record":
      return getRecord(ledger, requireArg(args, "source"), requireArg(args, "entity_id"));
    case "get_history":
      return getHistory(ledger, requireArg(args, "source"), requireArg(args, "entity_id"));
    case "get_changes":
      return getChanges(ledger, requireArg(args, "source"), {
        since: typeof args.since === "string" ? args.since : undefined,
        until: typeof args.until === "string" ? args.until : undefined,
        field: typeof args.field === "string" ? args.field : undefined,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
    case "verify_source":
      return verifySource(ledger, requireArg(args, "source"));
    default:
      throw new Error(`알 수 없는 도구: ${name}`);
  }
}
