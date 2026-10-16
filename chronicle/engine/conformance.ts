/**
 * 어댑터 적합성 킷 — 새 어댑터가 엔진 계약을 지키는지 한 번에 검사한다.
 *
 * 남은 18개 어댑터(#1~#19)의 테스트는 소스 고유 검증 + 이 킷 호출이면 된다:
 *
 *   import { assertAdapterConformance } from "../engine/conformance.js";
 *   test("적합성", () => assertAdapterConformance(adapter, ctx));
 *
 * ctx.http는 결정적이어야 한다(픽스처/에뮬레이터) — 결정성 검사가 두 번
 * 수집해 같은 결과를 요구하기 때문.
 */
import assert from "node:assert/strict";
import { toRecordMap } from "./diff.js";
import { canonicalJson } from "./integrity.js";
import type { AdapterFamily, CollectContext, SourceAdapter } from "./types.js";

const FAMILIES: AdapterFamily[] = ["api-records", "page-text", "file-probe"];

export async function assertAdapterConformance(adapter: SourceAdapter, ctx: CollectContext): Promise<void> {
  // 1) 신원: id·계열이 계약을 지키는가
  assert.ok(adapter.id && /^[a-z0-9-]+$/.test(adapter.id), `어댑터 id는 kebab-case여야 합니다: ${adapter.id}`);
  assert.ok(FAMILIES.includes(adapter.family), `알 수 없는 계열: ${adapter.family}`);
  assert.equal(adapter.id, ctx.config.id, "어댑터 id와 config id가 일치해야 합니다");
  assert.equal(adapter.family, ctx.config.family, "어댑터 계열과 config 계열이 일치해야 합니다");

  // 2) 수집: 레코드 계약 (엔진의 toRecordMap이 유일성·JSON 안전성·예약 필드를 검사)
  const first = await adapter.collect(ctx);
  const map = toRecordMap(first.records);
  for (const record of first.records) {
    assert.ok(record.entityId.length > 0, "entityId는 비어 있으면 안 됩니다");
    assert.match(record.sourceUrl, /^https?:\/\//, `sourceUrl은 http(s) URL이어야 합니다: ${record.entityId}`);
  }

  // 3) 원본 보존: raw가 JSON 직렬화 가능해야 스냅샷에 봉인된다
  assert.doesNotThrow(() => JSON.stringify(first.raw), "raw는 JSON 직렬화 가능해야 합니다");

  // 4) 결정성: 같은 입력이면 같은 정규화 결과 (같은 입력 → 같은 체인의 전제)
  const second = await adapter.collect(ctx);
  assert.equal(
    canonicalJson([...toRecordMap(second.records).entries()]),
    canonicalJson([...map.entries()]),
    "같은 입력에 대해 normalize 결과가 결정적이어야 합니다",
  );

  // 5) 삭제 감지 범위: 있다면 순수 함수여야 한다 (같은 레코드 → 같은 판정, 예외 없음)
  if (first.removalScope) {
    for (const record of map.values()) {
      const verdict = first.removalScope(record);
      assert.equal(typeof verdict, "boolean");
      assert.equal(first.removalScope(record), verdict, "removalScope는 같은 입력에 같은 판정을 내려야 합니다");
    }
    // 미지의 레코드에도 던지지 않고 판정해야 한다 (과거 스키마의 저장 레코드 대비)
    assert.doesNotThrow(() =>
      first.removalScope!({ entityId: "conformance:unknown", sourceUrl: "https://example.com/", fields: {} }),
    );
  }
}
