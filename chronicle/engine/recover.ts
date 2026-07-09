/**
 * 크래시 복구 — changes.jsonl(원장)이 유일한 진실이다.
 *
 * 파이프라인은 스냅샷 → 원장 append → integrity → latest → feed 순으로 쓰는데,
 * 중간에 죽으면 파생 파일(integrity.json, latest.json)이 원장보다 뒤처진다.
 * 그대로 다시 실행하면 낡은 체인 머리에 이어 붙여 체인이 영구 단절되거나(창 1),
 * 낡은 latest 기준으로 같은 이벤트를 중복 봉인한다(창 2).
 *
 * 그래서 매 실행 시작 시 원장을 제네시스부터 재검증하고, 파생 파일이 뒤처져
 * 있으면 원장에서 재구성한다 — 기존 원장 줄은 절대 건드리지 않으므로
 * append-only 규율은 유지된다. 원장 자체가 손상(부분 기록·변조)된 경우에는
 * 자동 복구하지 않고 마지막 정상 커밋에서의 수동 복구를 요구한다.
 */
import { existsSync } from "node:fs";
import { contentHashOf, genesisHash, nextChainHash, type IntegrityState } from "./integrity.js";
import { buildFeed, FEED_ENTRY_LIMIT } from "./publish.js";
import {
  loadLatest,
  loadLatestUpdatedAt,
  loadIntegrity,
  readChangeLines,
  writeFeed,
  writeIntegrity,
  writeLatest,
  type SourcePaths,
} from "./store.js";
import { RECORD_FIELD, type ChangeEvent, type NormalizedRecord } from "./types.js";

/** 원장 이벤트를 처음부터 재생해 현재 상태를 재구성한다. */
export function replayRecords(events: ChangeEvent[]): Map<string, NormalizedRecord> {
  const map = new Map<string, NormalizedRecord>();
  for (const event of events) {
    if (event.field === RECORD_FIELD) {
      if (event.after === null) {
        map.delete(event.entity_id);
      } else {
        map.set(event.entity_id, {
          entityId: event.entity_id,
          sourceUrl: event.source_url,
          fields: { ...(event.after as Record<string, unknown>) },
        });
      }
      continue;
    }
    const record = map.get(event.entity_id);
    if (!record) continue; // 유효한 원장에서는 도달 불가 (필드 이벤트는 생성 이후에만)
    // 스프레드+계산된 키 = CreateDataProperty — 필드명이 "__proto__"여도 소실되지 않는다
    record.fields = { ...record.fields, [event.field]: event.after };
    record.sourceUrl = event.source_url;
  }
  return map;
}

export interface RecoveredState {
  stored: Map<string, NormalizedRecord>;
  integrity: IntegrityState | null;
  healed: boolean;
}

/**
 * 원장을 재검증하고, 파생 파일이 뒤처져 있으면 재구성한다.
 * @param heal false(dry-run)면 재구성 결과를 메모리로만 돌려주고 쓰지 않는다.
 */
export function recoverState(
  paths: SourcePaths,
  sourceId: string,
  opts: { title: string; heal: boolean; log: (message: string) => void },
): RecoveredState {
  const restoreHint = `마지막 정상 커밋에서 data/${sourceId}/ 를 복구하세요.`;
  const lines = readChangeLines(paths);
  const integrity = loadIntegrity(paths);

  if (lines.length === 0) {
    if (integrity && integrity.length > 0) {
      throw new Error(`integrity.json은 체인 길이 ${integrity.length}인데 changes.jsonl이 비어 있습니다 — ${restoreHint}`);
    }
    if (existsSync(paths.latestPath)) {
      throw new Error(`원장(changes.jsonl) 없이 latest.json만 존재합니다 — ${restoreHint}`);
    }
    return { stored: new Map(), integrity: integrity ?? null, healed: false };
  }

  // 원장 자체 무결성: 제네시스부터 전 줄 재계산
  const genesis = genesisHash(sourceId);
  const events: ChangeEvent[] = [];
  let head = genesis;
  for (const [index, line] of lines.entries()) {
    let event: ChangeEvent;
    try {
      event = JSON.parse(line) as ChangeEvent;
    } catch {
      throw new Error(
        `changes.jsonl ${index + 1}행 JSON 파싱 실패 — 이전 실행이 기록 도중 중단된 것으로 보입니다. ${restoreHint}`,
      );
    }
    if (contentHashOf(event) !== event.content_hash || nextChainHash(head, event.content_hash) !== event.chain_hash) {
      throw new Error(`changes.jsonl ${index + 1}행 해시 불일치 — 원장 손상 또는 변조. ${restoreHint}`);
    }
    head = event.chain_hash;
    events.push(event);
  }
  const lastObservedAt = events[events.length - 1].observed_at;

  const integrityOk =
    integrity !== null &&
    integrity.genesis === genesis &&
    integrity.chain_hash === head &&
    integrity.length === events.length;
  const latestOk = loadLatestUpdatedAt(paths) === lastObservedAt;
  if (integrityOk && latestOk) {
    // feed.xml만 유실된 마지막 크래시 창 — 파생물이라 조용히 재생성한다.
    if (opts.heal && !existsSync(paths.feedPath)) {
      writeFeed(paths, buildFeed(sourceId, opts.title, events.slice(-FEED_ENTRY_LIMIT)));
      opts.log(`[${sourceId}] feed.xml 유실 감지 — 원장에서 재생성`);
    }
    return { stored: loadLatest(paths), integrity, healed: false };
  }

  // 파생 파일이 원장보다 뒤처짐 — 원장 기준으로 재구성 (원장 줄은 불변)
  const healedIntegrity: IntegrityState = {
    source_id: sourceId,
    genesis,
    chain_hash: head,
    length: events.length,
    updated_at: lastObservedAt,
  };
  const stored = replayRecords(events);
  opts.log(
    `[${sourceId}] 이전 실행 중단 흔적 감지 — 원장 기준으로 파생 파일 재구성` +
      `${opts.heal ? "" : " (dry-run: 쓰기 생략)"}: 체인 ${integrity?.length ?? "없음"} → ${events.length}`,
  );
  if (opts.heal) {
    writeIntegrity(paths, healedIntegrity);
    writeLatest(paths, sourceId, stored, lastObservedAt);
    writeFeed(paths, buildFeed(sourceId, opts.title, events.slice(-FEED_ENTRY_LIMIT)));
  }
  return { stored, integrity: healedIntegrity, healed: true };
}
