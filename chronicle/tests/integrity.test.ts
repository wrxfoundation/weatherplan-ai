import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalJson,
  contentHashOf,
  genesisHash,
  initialIntegrity,
  nextChainHash,
  sealEvents,
  verifyChainLines,
} from "../engine/integrity.js";
import type { UnsealedEvent } from "../engine/types.js";

const at = "2026-07-09T00:00:00.000Z";

function sampleEvents(): UnsealedEvent[] {
  return [
    {
      observed_at: at,
      entity_id: "apt:1:1",
      field: "__record__",
      before: null,
      after: { HOUSE_NM: "테스트", PRICE: 1 },
      source_url: "https://example.com/1",
    },
    {
      observed_at: at,
      entity_id: "apt:1:1",
      field: "PRICE",
      before: 1,
      after: 2,
      source_url: "https://example.com/1",
    },
  ];
}

test("canonicalJson은 키 순서와 무관하게 같은 바이트를 낸다", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: 3 } }), canonicalJson({ a: { c: 3, d: [2, { y: 2, z: 1 }] }, b: 1 }));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1])); // 배열 순서는 의미 보존
});

test("canonicalJson: __proto__ 키를 보존하고 Date는 toJSON을 적용한다", () => {
  const parsed = JSON.parse('{"__proto__": {"polluted": 1}, "a": 2}');
  assert.equal(canonicalJson(parsed), '{"__proto__":{"polluted":1},"a":2}');
  assert.equal(canonicalJson(new Date("2026-01-01T00:00:00.000Z")), '"2026-01-01T00:00:00.000Z"');
  assert.equal(canonicalJson({ d: new Date("2026-01-01T00:00:00.000Z") }), '{"d":"2026-01-01T00:00:00.000Z"}');
});

test("sealEvents는 제네시스부터 체인을 잇는다", () => {
  const state0 = initialIntegrity("test-src", at);
  assert.equal(state0.genesis, genesisHash("test-src"));
  assert.equal(state0.chain_hash, state0.genesis);

  const { events, state } = sealEvents(state0, sampleEvents());
  assert.equal(state.length, 2);
  assert.equal(events[0].chain_hash, nextChainHash(state0.genesis, events[0].content_hash));
  assert.equal(events[1].chain_hash, nextChainHash(events[0].chain_hash, events[1].content_hash));
  assert.equal(state.chain_hash, events[1].chain_hash);
  assert.equal(events[0].content_hash, contentHashOf(events[0]));
});

test("verifyChainLines: 온전한 체인은 통과한다", () => {
  const { events, state } = sealEvents(initialIntegrity("test-src", at), sampleEvents());
  const lines = events.map((event) => canonicalJson(event));
  const result = verifyChainLines(lines, state);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.length, 2);
  assert.equal(result.chain_hash, state.chain_hash);
});

test("verifyChainLines: 본문 변조는 content_hash 불일치로 잡힌다", () => {
  const { events, state } = sealEvents(initialIntegrity("test-src", at), sampleEvents());
  const tampered = { ...events[1], after: 999 }; // after를 몰래 수정
  const lines = [canonicalJson(events[0]), canonicalJson(tampered)];
  const result = verifyChainLines(lines, state);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("content_hash 불일치")));
});

test("verifyChainLines: 줄 삭제는 길이·머리 불일치로 잡힌다", () => {
  const { events, state } = sealEvents(initialIntegrity("test-src", at), sampleEvents());
  const result = verifyChainLines([canonicalJson(events[0])], state);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("길이 불일치")));
  assert.ok(result.errors.some((error) => error.includes("체인 머리 불일치")));
});

test("verifyChainLines: 체인 재작성(해시 재계산 포함)도 머리 불일치로 잡힌다", () => {
  const state0 = initialIntegrity("test-src", at);
  const { state } = sealEvents(state0, sampleEvents());
  // 공격자가 다른 내용으로 체인을 처음부터 다시 만든 경우 —
  // integrity.json에 봉인된 머리와 달라 검증이 실패한다.
  const forged = sealEvents(state0, [{ ...sampleEvents()[0], after: { HOUSE_NM: "위조" } }]);
  const lines = forged.events.map((event) => canonicalJson(event));
  const result = verifyChainLines(lines, state);
  assert.equal(result.ok, false);
});
