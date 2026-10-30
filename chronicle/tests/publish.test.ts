import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFeed } from "../engine/publish.js";
import type { ChangeEvent } from "../engine/types.js";

test("feed.xml: 적대적 문자열(태그·CDATA·제어문자·홀로 선 서로게이트)을 무해화한다", () => {
  const hostile: ChangeEvent = {
    observed_at: "2026-07-09T00:00:00.000Z",
    entity_id: 'apt:"]]><script>alert(1)</script>\u0001',
    field: "HOUSE_NM",
    before: "이전",
    after: "이후",
    source_url: "https://example.com/?a=<&b='\uD800", // 홀로 선 상위 서로게이트
    content_hash: "c".repeat(64),
    chain_hash: "d".repeat(64),
  };
  const xml = buildFeed("bunyang-capsule", 'tit<le & "quotes"', [hostile]);

  assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(xml), "XML 1.0 불법 제어문자가 남으면 안 된다");
  assert.ok(!/[\uD800-\uDFFF]/u.test(xml), "홀로 선 서로게이트가 남으면 안 된다");
  assert.ok(!xml.includes("<script>"), "태그가 원문으로 새면 안 된다");
  assert.ok(!xml.includes("]]>"), "CDATA 종결자가 원문으로 새면 안 된다");
  assert.ok(xml.includes("&lt;script&gt;"), "이스케이프된 형태로는 보존된다");
  assert.ok(xml.includes("tit&lt;le &amp; &quot;quotes&quot;"));
});

test("feed.xml: 유효한 서로게이트 쌍(이모지 등)은 보존한다", () => {
  const event: ChangeEvent = {
    observed_at: "2026-07-09T00:00:00.000Z",
    entity_id: "apt:1:1",
    field: "HOUSE_NM",
    before: null,
    after: "단지\u{1F3E0}", // 🏠
    source_url: "https://example.com/",
    content_hash: "c".repeat(64),
    chain_hash: "d".repeat(64),
  };
  const xml = buildFeed("bunyang-capsule", "제목", [event]);
  assert.ok(xml.includes("\u{1F3E0}"));
});
