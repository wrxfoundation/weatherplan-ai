/**
 * 공개 검증 페이지 — 브라우저 재검증 알고리즘이 engine/integrity.ts와 바이트 단위로
 * 동일함을 증명한다(불일치 시 방문자에게 거짓 변조가 뜬다). 브라우저 순수 함수를
 * Node에서 eval해(crypto.subtle·TextEncoder는 Node22 전역) 엔진과 대조.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalJson, contentHashOf, nextChainHash, sha256Hex } from "../engine/integrity.js";
import { CLIENT_HASH_FNS, renderVerifyPage } from "../engine/verify-page.js";

const client = new Function(`${CLIENT_HASH_FNS}\nreturn { sha256Hex, canonicalJson, contentInput };`)() as {
  sha256Hex: (s: string) => Promise<string>;
  canonicalJson: (v: unknown) => string;
  contentInput: (e: unknown) => string;
};

test("canonicalJson: 브라우저 == 엔진 (중첩·배열·유니코드·__proto__·키순서 무관)", () => {
  const cases: unknown[] = [
    null,
    0,
    "",
    "가나다",
    true,
    { b: 1, a: 2 },
    { a: 2, b: 1 },
    { z: { y: [3, 2, 1], x: "값" }, a: null },
    [{ c: 1, a: 2 }, "x"],
    JSON.parse('{"__proto__":5,"a":1}'), // 실제 own "__proto__" 프로퍼티
    { observed_at: "2026-07-13T00:00:00.000Z", entity_id: "x:1", field: "f", before: null, after: { p: "q" }, source_url: "https://e/1" },
  ];
  for (const v of cases) assert.equal(client.canonicalJson(v), canonicalJson(v), `불일치: ${JSON.stringify(v)}`);
});

test("sha256Hex: 브라우저 == 엔진", async () => {
  for (const s of ["", "hello", "가나다 unicode 🔗", "chronicle:bunyang-capsule:genesis"]) {
    assert.equal(await client.sha256Hex(s), sha256Hex(s));
  }
});

test("content_hash·chain_hash 재계산: 브라우저 == 엔진 (봉인 이벤트 대조)", async () => {
  const event = { observed_at: "2026-07-13T05:00:00.000Z", entity_id: "apt:1:2", field: "__record__", before: null, after: { price: 100, name: "가" }, source_url: "https://x/1" };
  const engineContent = contentHashOf(event);
  assert.equal(
    client.contentInput(event),
    canonicalJson({ observed_at: event.observed_at, entity_id: event.entity_id, field: event.field, before: event.before, after: event.after, source_url: event.source_url }),
    "content 입력 문자열 일치",
  );
  assert.equal(await client.sha256Hex(client.contentInput(event)), engineContent, "content_hash 일치");
  const prev = sha256Hex("chronicle:s:genesis");
  assert.equal(await client.sha256Hex(prev + engineContent), nextChainHash(prev, engineContent), "chain_hash 일치");
});

test("renderVerifyPage: 무설치 페이지 + repo 슬러그 정제(주입 방지) + 디자인 헤리티지", () => {
  const html = renderVerifyPage("kwangdol-star/aiagentlabs");
  assert.ok(html.includes("당신이 직접 검증"));
  assert.ok(html.includes('const REPO = "kwangdol-star/aiagentlabs"'));
  assert.ok(html.includes("cdn.jsdelivr.net/gh/") && html.includes("crypto.subtle.digest"));
  assert.ok(!renderVerifyPage('x";alert(1)//').includes("alert(1)"), "repo 특수문자 제거로 스크립트 주입 차단");
  assert.ok(html.includes("--accent:#3bcfe4") && html.includes("-webkit-backdrop-filter:var(--blur)"));
  assert.ok(!/@keyframes/.test(html), "정적 글로우");
});
