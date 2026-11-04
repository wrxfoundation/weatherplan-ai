/**
 * 이전 스냅샷(latest.json) 대비 record-level 변경 감지 (PLAN.md §0).
 *
 * 출력 순서는 결정적이다: 수집분(entity_id 정렬, 레코드 안에서는 필드명 정렬)
 * → 삭제분(entity_id 정렬). 같은 입력이면 언제나 같은 체인이 나온다.
 */
import { canonicalJson } from "./integrity.js";
import { RECORD_FIELD, type NormalizedRecord } from "./types.js";

export interface FieldChange {
  entity_id: string;
  field: string;
  before: unknown;
  after: unknown;
  source_url: string;
}

export function toRecordMap(records: NormalizedRecord[]): Map<string, NormalizedRecord> {
  const map = new Map<string, NormalizedRecord>();
  for (const record of records) {
    if (map.has(record.entityId)) {
      throw new Error(`entity_id 중복: ${record.entityId} — 어댑터의 entityId 설계를 확인하세요.`);
    }
    // JSON 왕복으로 정규화: undefined 필드 제거, Date 등 toJSON 적용.
    // 저장(JSON)과 메모리 표현이 어긋나면 같은 이벤트가 매 실행 다시 봉인된다.
    const fields = JSON.parse(JSON.stringify(record.fields)) as Record<string, unknown>;
    if (Object.hasOwn(fields, RECORD_FIELD)) {
      throw new Error(
        `예약 필드명 충돌: ${record.entityId} 의 필드에 ${RECORD_FIELD} 가 있습니다 — 어댑터에서 이름을 바꿔 주세요.`,
      );
    }
    map.set(record.entityId, { entityId: record.entityId, sourceUrl: record.sourceUrl, fields });
  }
  return map;
}

export function diffRecords(
  stored: Map<string, NormalizedRecord>,
  fetched: Map<string, NormalizedRecord>,
  removalScope?: (stored: NormalizedRecord) => boolean,
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const entityId of [...fetched.keys()].sort()) {
    const next = fetched.get(entityId)!;
    const prev = stored.get(entityId);
    if (!prev) {
      changes.push({
        entity_id: entityId,
        field: RECORD_FIELD,
        before: null,
        after: next.fields,
        source_url: next.sourceUrl,
      });
      continue;
    }
    const fieldNames = [...new Set([...Object.keys(prev.fields), ...Object.keys(next.fields)])].sort();
    for (const field of fieldNames) {
      // Object.hasOwn — `in`은 프로토타입 체인까지 봐서 "constructor"/"toString" 같은
      // 필드명에서 상속 값을 읽어 유령 이벤트를 만든다
      const before = Object.hasOwn(prev.fields, field) ? prev.fields[field] : null;
      const after = Object.hasOwn(next.fields, field) ? next.fields[field] : null;
      if (canonicalJson(before) !== canonicalJson(after)) {
        changes.push({ entity_id: entityId, field, before, after, source_url: next.sourceUrl });
      }
    }
  }

  for (const entityId of [...stored.keys()].sort()) {
    if (fetched.has(entityId)) continue;
    const record = stored.get(entityId)!;
    if (removalScope && !removalScope(record)) continue; // 윈도 밖 / 페치 실패 대상 — 삭제 아님
    changes.push({
      entity_id: entityId,
      field: RECORD_FIELD,
      before: record.fields,
      after: null,
      source_url: record.sourceUrl,
    });
  }

  return changes;
}
