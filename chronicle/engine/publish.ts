/**
 * 퍼블리시 산출물 생성 (PLAN.md §0 publish.ts).
 * latest.json / changes.jsonl 은 store.ts가 쓰고, 여기서는 feed.xml(Atom)을 만든다.
 */
import { canonicalJson } from "./integrity.js";
import { RECORD_FIELD, type ChangeEvent } from "./types.js";

export const FEED_ENTRY_LIMIT = 50;

function escapeXml(text: string): string {
  return (
    text
      // XML 1.0에서 불법인 제어문자·비문자·홀로 선 서로게이트를 U+FFFD로 치환
      // (u 플래그: 유효한 서로게이트 쌍은 하나의 코드포인트라 범위에 안 걸린다)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g, "\uFFFD")
      .replace(/[\uD800-\uDFFF]/gu, "\uFFFD")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;")
  );
}

function entryTitle(event: ChangeEvent): string {
  if (event.field === RECORD_FIELD) {
    return event.after === null ? `[삭제] ${event.entity_id}` : `[신규] ${event.entity_id}`;
  }
  return `[변경] ${event.entity_id} · ${event.field}`;
}

/** 최근 변경 이벤트를 Atom 1.0 피드로 직렬화한다 (최신순, 최대 FEED_ENTRY_LIMIT건). */
export function buildFeed(sourceId: string, title: string, events: ChangeEvent[]): string {
  const recent = events.slice(-FEED_ENTRY_LIMIT).reverse();
  const updated = recent[0]?.observed_at ?? "1970-01-01T00:00:00.000Z";
  const entries = recent
    .map((event) => {
      return [
        "  <entry>",
        `    <id>urn:chronicle:${escapeXml(sourceId)}:${escapeXml(event.chain_hash)}</id>`,
        `    <title>${escapeXml(entryTitle(event))}</title>`,
        `    <updated>${escapeXml(event.observed_at)}</updated>`,
        `    <link href="${escapeXml(event.source_url)}"/>`,
        `    <content type="text">${escapeXml(canonicalJson(event))}</content>`,
        "  </entry>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>urn:chronicle:${escapeXml(sourceId)}</id>`,
    `  <title>${escapeXml(title)}</title>`,
    `  <updated>${escapeXml(updated)}</updated>`,
    `  <author><name>chronicle</name></author>`,
    entries,
    "</feed>",
    "",
  ].join("\n");
}
