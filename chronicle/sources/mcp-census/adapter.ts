/**
 * #10 MCP 생태계 센서스 (mcp-census) — API 레코드형 어댑터.
 *
 * 공개 MCP 레지스트리의 등록 서버를 관측한다. 응답 봉투가 아직 유동적이라
 * 여러 형태(servers[] / data[] / 배열)를 방어적으로 수용하고, 서버·버전 필드도
 * 중첩 위치를 폭넓게 탐색한다. 알 수 없는 형태면 응답 앞부분과 함께 즉시 중단
 * (첫 실행이 형태를 자백). 전체 목록을 완전히 받거나 중단하므로 삭제 감지가 안전.
 *
 * 엔티티: server:<name> — fields {version, repository_url, description_sha256}
 */
import { createHash } from "node:crypto";
import { ApiRecordsAdapter } from "../../engine/adapters/api-records.js";
import type { CollectContext, NormalizedRecord } from "../../engine/types.js";

type Json = Record<string, unknown>;

function asArray(body: unknown): Json[] | null {
  if (Array.isArray(body)) return body as Json[];
  if (body && typeof body === "object") {
    for (const key of ["servers", "data", "results", "items"]) {
      const value = (body as Json)[key];
      if (Array.isArray(value)) return value as Json[];
    }
  }
  return null;
}

function pick(obj: Json | undefined, ...paths: string[][]): unknown {
  if (!obj) return undefined;
  for (const path of paths) {
    let cur: unknown = obj;
    for (const key of path) {
      if (cur && typeof cur === "object") cur = (cur as Json)[key];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

function nextCursor(body: unknown): string | null {
  const cursor = pick(body as Json, ["metadata", "next_cursor"], ["metadata", "nextCursor"], ["next_cursor"], ["nextCursor"]);
  return typeof cursor === "string" && cursor !== "" ? cursor : null;
}

const MAX_PAGES = 200;

export class McpCensusAdapter extends ApiRecordsAdapter {
  readonly id = "mcp-census";

  protected async fetchRaw(ctx: CollectContext): Promise<unknown> {
    const endpoint = String(ctx.config.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const userAgent = ctx.config.user_agent;
    const init: RequestInit | undefined =
      typeof userAgent === "string" && userAgent ? { headers: { "User-Agent": userAgent, Accept: "application/json" } } : undefined;
    const pageSize = Number(ctx.config.page_size ?? 100);

    const servers: Json[] = [];
    let cursor: string | null = null;
    for (let page = 1; ; page++) {
      if (page > MAX_PAGES) throw new Error(`페이지네이션 폭주(>${MAX_PAGES}p): ${endpoint}`);
      const url = new URL(endpoint);
      url.searchParams.set("limit", String(pageSize));
      if (cursor) url.searchParams.set("cursor", cursor);
      const body = (await ctx.http.json(url.toString(), init)) as unknown;
      const list = asArray(body);
      if (!list) {
        throw new Error(`MCP 레지스트리 응답 형태를 알 수 없음 — ${JSON.stringify(body).slice(0, 300)}`);
      }
      servers.push(...list);
      const next = nextCursor(body);
      if (!next || next === cursor || list.length === 0) break;
      cursor = next;
    }
    ctx.log(`[${this.id}] 등록 서버 ${servers.length}건 수신`);
    return { servers };
  }

  protected normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[] {
    const { servers } = raw as { servers: Json[] };
    const endpoint = String(ctx.config.endpoint ?? "");
    const records: NormalizedRecord[] = [];
    const seen = new Set<string>();
    for (const entry of servers) {
      const name = pick(entry, ["name"], ["server", "name"]);
      if (typeof name !== "string" || !name || seen.has(name)) continue;
      seen.add(name);
      const version = pick(entry, ["version_detail", "version"], ["server", "version_detail", "version"], ["version"]);
      const repo = pick(entry, ["repository", "url"], ["server", "repository", "url"]);
      const description = pick(entry, ["description"], ["server", "description"]);
      records.push({
        entityId: `server:${name}`,
        sourceUrl: endpoint,
        fields: {
          version: typeof version === "string" ? version : null,
          repository_url: typeof repo === "string" ? repo : null,
          // 설명은 마케팅 문구라 원문 대신 해시만 tracked (변경은 감지, churn·용량은 억제)
          description_sha256: typeof description === "string" ? createHash("sha256").update(description).digest("hex") : null,
        },
      });
    }
    return records;
  }
}

export default new McpCensusAdapter();
