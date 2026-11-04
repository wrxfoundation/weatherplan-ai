import assert from "node:assert/strict";
import { test } from "node:test";
import { diffRecords, toRecordMap } from "../engine/diff.js";
import { RECORD_FIELD, type NormalizedRecord } from "../engine/types.js";

function record(entityId: string, fields: Record<string, unknown>): NormalizedRecord {
  return { entityId, sourceUrl: `https://example.com/${entityId}`, fields };
}

test("신규 레코드는 __record__ 생성 이벤트가 된다", () => {
  const changes = diffRecords(new Map(), toRecordMap([record("a", { x: 1 })]));
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], {
    entity_id: "a",
    field: RECORD_FIELD,
    before: null,
    after: { x: 1 },
    source_url: "https://example.com/a",
  });
});

test("필드 변경·추가·소실은 필드 단위 이벤트가 된다", () => {
  const stored = toRecordMap([record("a", { price: 100, addr: "서울", gone: "y" })]);
  const fetched = toRecordMap([record("a", { price: 120, addr: "서울", added: "n" })]);
  const changes = diffRecords(stored, fetched);
  assert.deepEqual(
    changes.map((c) => [c.field, c.before, c.after]),
    [
      ["added", null, "n"],
      ["gone", "y", null],
      ["price", 100, 120],
    ],
  );
});

test("사라진 레코드는 삭제 이벤트가 된다 (삭제도 이벤트)", () => {
  const changes = diffRecords(toRecordMap([record("a", { x: 1 })]), new Map());
  assert.equal(changes.length, 1);
  assert.equal(changes[0].field, RECORD_FIELD);
  assert.deepEqual(changes[0].before, { x: 1 });
  assert.equal(changes[0].after, null);
});

test("removalScope 밖의 레코드는 사라져도 삭제 이벤트가 아니다 (윈도 오탐 방지)", () => {
  const stored = toRecordMap([record("in-window", { d: "2026-06-01" }), record("out-window", { d: "2025-01-01" })]);
  const changes = diffRecords(stored, new Map(), (r) => String(r.fields.d) >= "2026-01-01");
  assert.deepEqual(changes.map((c) => c.entity_id), ["in-window"]);
});

test("깊은 값은 정준 비교한다 — 키 순서만 다르면 변경이 아니다", () => {
  const stored = toRecordMap([record("a", { obj: { x: 1, y: 2 } })]);
  const fetched = toRecordMap([record("a", { obj: { y: 2, x: 1 } })]);
  assert.equal(diffRecords(stored, fetched).length, 0);
});

test("출력 순서는 결정적이다: 수집분(entity_id·field 정렬) → 삭제분", () => {
  const stored = toRecordMap([record("b", { p: 1 }), record("z-removed", { p: 9 }), record("a-removed", { p: 8 })]);
  const fetched = toRecordMap([record("c", { p: 3 }), record("b", { p: 2 }), record("a", { p: 1 })]);
  const changes = diffRecords(stored, fetched);
  assert.deepEqual(
    changes.map((c) => c.entity_id),
    ["a", "b", "c", "a-removed", "z-removed"],
  );
});

test("entity_id 중복은 즉시 오류다", () => {
  assert.throws(() => toRecordMap([record("a", { x: 1 }), record("a", { x: 2 })]), /entity_id 중복/);
});

test("undefined 필드는 JSON 왕복 정규화로 제거된다 — 유령 이벤트 방지", () => {
  const fetched = toRecordMap([record("a", { x: 1, maybe: undefined })]);
  assert.ok(!("maybe" in fetched.get("a")!.fields));
  // 저장(JSON)된 {x:1}과 다음 수집의 {x:1, maybe:undefined}가 같아야 매 실행 재봉인이 없다.
  const stored = toRecordMap([record("a", { x: 1 })]);
  assert.equal(diffRecords(stored, fetched).length, 0);
  // Date도 JSON 직렬화와 동일하게 문자열로 수렴한다.
  const withDate = toRecordMap([record("d", { at: new Date("2026-01-01T00:00:00.000Z") })]);
  assert.equal(withDate.get("d")!.fields.at, "2026-01-01T00:00:00.000Z");
});

test("예약 필드명(__record__)이 소스 필드로 들어오면 즉시 오류다", () => {
  assert.throws(() => toRecordMap([record("a", { [RECORD_FIELD]: 1 })]), /예약 필드명/);
});
