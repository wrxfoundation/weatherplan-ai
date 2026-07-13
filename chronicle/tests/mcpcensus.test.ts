/**
 * #10 mcp-census — MCP 레지스트리 관측 검증.
 * 방어적 봉투 파싱·중첩 필드 추출·커서 페이지네이션·형태 오류 중단·적합성 킷
 * + 파이프라인(신규 서버=생성, 버전=필드 이벤트, 소멸=삭제).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/mcp-census/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "mcp-census",
  family: "api-records",
  title: "MCP 생태계 센서스",
  endpoint: "https://registry.modelcontextprotocol.io/v0/servers",
  user_agent: "chronicle-test/0.1",
  page_size: 2,
};

interface Server {
  name: string;
  version: string;
  repo: string;
}

function server(s: Server) {
  return {
    name: s.name,
    description: `${s.name} 설명`,
    repository: { url: s.repo, source: "github" },
    version_detail: { version: s.version, release_date: "2026-01-01", is_latest: true },
  };
}

/** 커서 페이지네이션 레지스트리 에뮬레이터 (servers[] + metadata.next_cursor). */
function registry(all: () => Server[]): HttpClient {
  return {
    json: async (url) => {
      const parsed = new URL(url);
      const limit = Number(parsed.searchParams.get("limit") ?? 100);
      const cursor = Number(parsed.searchParams.get("cursor") ?? 0);
      const servers = all();
      const page = servers.slice(cursor, cursor + limit);
      const nextIndex = cursor + limit;
      return {
        servers: page.map(server),
        metadata: nextIndex < servers.length ? { next_cursor: String(nextIndex), count: page.length } : { count: page.length },
      };
    },
    text: async () => {
      throw new Error("n/a");
    },
    raw: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

const fs = { name: "io.github.mod/filesystem", version: "1.2.0", repo: "https://github.com/mod/filesystem" };
const git = { name: "io.github.mod/git", version: "0.4.0", repo: "https://github.com/mod/git" };
const slack = { name: "io.github.acme/slack", version: "2.0.0", repo: "https://github.com/acme/slack" };

test("커서 페이지네이션으로 전 서버 수집 + 중첩 필드 추출", async () => {
  const result = await adapter.collect(ctx(registry(() => [fs, git, slack])));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), [
    "server:io.github.acme/slack",
    "server:io.github.mod/filesystem",
    "server:io.github.mod/git",
  ]);
  const filesystem = result.records.find((r) => r.entityId.endsWith("filesystem"))!;
  assert.equal(filesystem.fields.version, "1.2.0");
  assert.equal(filesystem.fields.repository_url, "https://github.com/mod/filesystem");
  assert.ok(typeof filesystem.fields.description_sha256 === "string");
});

test("방어적 파싱: data[] 봉투도 수용, 알 수 없는 형태는 중단", async () => {
  const dataEnvelope: HttpClient = {
    json: async () => ({ data: [server(fs)] }),
    text: async () => "",
    raw: async () => new Response(),
  };
  const result = await adapter.collect(ctx(dataEnvelope));
  assert.equal(result.records.length, 1);

  const bad: HttpClient = { json: async () => ({ oops: true }), text: async () => "", raw: async () => new Response() };
  await assert.rejects(() => adapter.collect(ctx(bad)), /형태를 알 수 없음/);
});

test("적합성 킷을 통과한다", async () => {
  await assertAdapterConformance(adapter, ctx(registry(() => [fs, git])));
});

test("파이프라인: 신규 서버=생성, 버전=필드 이벤트, 소멸=삭제", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-mcpcensus-"));
  let servers: Server[] = [fs, git];
  const run = (isoNow: string) =>
    runOnce({ sourceId: "mcp-census", root, dataDir, adapter, config, http: registry(() => servers), now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-13T05:00:00.000Z");
  assert.equal(first.added, 2);

  // git 버전업 + slack 신규 + filesystem 소멸
  servers = [{ ...git, version: "0.5.0" }, slack];
  const second = await run("2026-07-20T05:00:00.000Z");
  assert.equal(second.added, 1, "slack 신규");
  assert.equal(second.removed, 1, "filesystem 소멸");
  assert.equal(second.changed, 1, "git 버전");

  const versionEvent = second.events.find((e) => e.field === "version")!;
  assert.equal(versionEvent.before, "0.4.0");
  assert.equal(versionEvent.after, "0.5.0");
  const removal = second.events.find((e) => e.field === RECORD_FIELD && e.after === null)!;
  assert.equal(removal.entity_id, "server:io.github.mod/filesystem");
});
