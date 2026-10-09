/**
 * 통합 인텔리전스 피드 — 전 소스의 최근 변경·소멸·신규를 하나의 Atom 스트림으로.
 *
 * 소스마다 feed.xml이 따로 있지만, "크로니클이 최근 무엇을 잡았나"를 보려면 N개
 * 피드를 폴링해야 한다. 이 통합 피드는 흩어진 원장을 하나의 구독 가능한 스트림으로
 * 묶는다 — AI 에이전트·기자·투자자가 한 곳을 구독하면 전 소스의 신호를 받는다.
 *
 * 결정성: 이벤트 시각 외에 휘발 값(생성 시각 등)을 넣지 않는다 — data/만으로 바이트가
 * 결정되므로 site.ts의 "변경 시에만 커밋" 성질을 그대로 유지한다.
 */
import { canonicalJson } from "./integrity.js";
import { entryTitle, escapeXml } from "./publish.js";
import type { ChangeEvent } from "./types.js";

export interface AggregateEntry {
  sourceId: string;
  title: string;
  event: ChangeEvent;
}

export const AGG_FEED_LIMIT = 120;

/** 소스 태그가 붙은 전 소스 통합 Atom 피드 (최신순, 최대 AGG_FEED_LIMIT건). */
export function buildAggregateFeed(repo: string, entries: AggregateEntry[]): string {
  const sorted = [...entries]
    .sort((a, b) => (a.event.observed_at < b.event.observed_at ? 1 : a.event.observed_at > b.event.observed_at ? -1 : 0))
    .slice(0, AGG_FEED_LIMIT);
  const updated = sorted[0]?.event.observed_at ?? "1970-01-01T00:00:00.000Z";
  const [owner, name] = repo.split("/");
  const selfHref = `https://${escapeXml(owner ?? "")}.github.io/${escapeXml(name ?? "")}/feed.xml`;

  const xmlEntries = sorted
    .map(({ sourceId, title, event }) =>
      [
        "  <entry>",
        `    <id>urn:chronicle:agg:${escapeXml(sourceId)}:${escapeXml(event.chain_hash)}</id>`,
        `    <title>${escapeXml(`[${title}] ${entryTitle(event)}`)}</title>`,
        `    <updated>${escapeXml(event.observed_at)}</updated>`,
        `    <category term="${escapeXml(sourceId)}"/>`,
        `    <link href="${escapeXml(event.source_url)}"/>`,
        `    <content type="text">${escapeXml(canonicalJson(event))}</content>`,
        "  </entry>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>urn:chronicle:aggregate:${escapeXml(repo)}</id>`,
    "  <title>Chronicle — 통합 인텔리전스 피드</title>",
    "  <subtitle>전 소스 최근 변경·소멸·신규 통합 스트림</subtitle>",
    `  <updated>${escapeXml(updated)}</updated>`,
    "  <author><name>chronicle</name></author>",
    `  <link rel="self" href="${selfHref}"/>`,
    xmlEntries,
    "</feed>",
    "",
  ].join("\n");
}
