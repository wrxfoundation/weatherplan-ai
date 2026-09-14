/**
 * SHA-256 해시체인 — "먼저·진짜로 기록했다"의 증명 (PLAN.md 원리).
 *
 * content_hash = SHA256(canonicalJson({observed_at, entity_id, field, before, after, source_url}))
 * chain_hash   = SHA256(prev_chain_hash + content_hash)
 * genesis      = SHA256("chronicle:<source_id>:genesis")
 *
 * 체인 상태는 data/<id>/integrity.json 에 봉인되고, verifyChainLines()가
 * changes.jsonl 전체를 제네시스부터 재계산해 대조한다.
 */
import { createHash } from "node:crypto";
import type { ChangeEvent, UnsealedEvent } from "./types.js";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/** 객체 키를 재귀 정렬한 결정적 JSON — 같은 값이면 언제나 같은 바이트. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    // JSON.stringify와 동일하게 toJSON(Date 등)을 먼저 적용한다.
    const withToJson = value as { toJSON?: () => unknown };
    if (typeof withToJson.toJSON === "function") return sortKeysDeep(withToJson.toJSON());
    if (Array.isArray(value)) return value.map(sortKeysDeep);
    // null-프로토타입 누산자 — "__proto__" 키가 세터를 타고 소실되는 것을 막는다.
    const sorted: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/** data/<id>/integrity.json 의 내용. */
export interface IntegrityState {
  source_id: string;
  genesis: string;
  chain_hash: string;
  length: number;
  updated_at: string;
}

export function genesisHash(sourceId: string): string {
  return sha256Hex(`chronicle:${sourceId}:genesis`);
}

export function initialIntegrity(sourceId: string, at: string): IntegrityState {
  const genesis = genesisHash(sourceId);
  return { source_id: sourceId, genesis, chain_hash: genesis, length: 0, updated_at: at };
}

export function contentHashOf(event: UnsealedEvent): string {
  return sha256Hex(
    canonicalJson({
      observed_at: event.observed_at,
      entity_id: event.entity_id,
      field: event.field,
      before: event.before,
      after: event.after,
      source_url: event.source_url,
    }),
  );
}

export function nextChainHash(prevChainHash: string, contentHash: string): string {
  return sha256Hex(prevChainHash + contentHash);
}

/** 이벤트 목록을 순서대로 체인에 봉인하고, 봉인된 이벤트와 새 체인 상태를 돌려준다. */
export function sealEvents(
  state: IntegrityState,
  events: UnsealedEvent[],
): { events: ChangeEvent[]; state: IntegrityState } {
  let prev = state.chain_hash;
  let length = state.length;
  let updatedAt = state.updated_at;
  const sealed: ChangeEvent[] = [];
  for (const event of events) {
    const content_hash = contentHashOf(event);
    const chain_hash = nextChainHash(prev, content_hash);
    sealed.push({ ...event, content_hash, chain_hash });
    prev = chain_hash;
    length += 1;
    updatedAt = event.observed_at;
  }
  return {
    events: sealed,
    state: { ...state, chain_hash: prev, length, updated_at: updatedAt },
  };
}

export interface ChainVerification {
  ok: boolean;
  length: number;
  chain_hash: string;
  errors: string[];
}

const MAX_REPORTED_ERRORS = 20;

/**
 * changes.jsonl 전체를 제네시스부터 재계산해 integrity.json과 대조한다.
 * - 각 줄: 본문 재해시 == content_hash, SHA256(prev + content_hash) == chain_hash
 * - 마지막: 체인 머리와 길이가 integrity.json과 일치
 */
export function verifyChainLines(lines: string[], state: IntegrityState): ChainVerification {
  const errors: string[] = [];
  const report = (msg: string) => {
    if (errors.length < MAX_REPORTED_ERRORS) errors.push(msg);
  };
  let prev = state.genesis;
  let count = 0;
  for (const [index, line] of lines.entries()) {
    const lineNo = index + 1;
    let event: ChangeEvent;
    try {
      event = JSON.parse(line) as ChangeEvent;
    } catch {
      report(`line ${lineNo}: JSON 파싱 실패`);
      continue;
    }
    const recomputed = contentHashOf(event);
    if (recomputed !== event.content_hash) {
      report(`line ${lineNo}: content_hash 불일치 (본문 변조 의심) — 기록 ${event.content_hash}, 재계산 ${recomputed}`);
    }
    const link = nextChainHash(prev, event.content_hash);
    if (link !== event.chain_hash) {
      report(`line ${lineNo}: chain_hash 불일치 (체인 단절) — 기록 ${event.chain_hash}, 재계산 ${link}`);
    }
    // 기록된 chain_hash를 따라간다 — 한 줄의 손상이 이후 전 줄 오류로 번지지 않게.
    prev = event.chain_hash;
    count += 1;
  }
  if (count !== state.length) {
    report(`길이 불일치: integrity.json=${state.length}, changes.jsonl=${count}`);
  }
  if (prev !== state.chain_hash) {
    report(`체인 머리 불일치: integrity.json=${state.chain_hash}, changes.jsonl 재계산=${prev}`);
  }
  return { ok: errors.length === 0, length: count, chain_hash: prev, errors };
}
