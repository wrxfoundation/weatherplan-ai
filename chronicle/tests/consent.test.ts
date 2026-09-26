/**
 * #16 consent-census — 파일/프로브형 계열 첫 라이브 검증.
 * robots 파서(차단/허용/부재/일부) + tolerant probe(404=부재 관측) +
 * 봇 상태 필드 이벤트 + llms.txt 채택 이벤트 + 적합성 킷.
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/consent-census/adapter.js";
import { parseAiCrawlerStance, parseRobotsGroups } from "../sources/consent-census/robots.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import { RECORD_FIELD, type CollectContext, type HttpClient, type SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BOTS = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"];
const config: SourceConfig = {
  id: "consent-census",
  family: "file-probe",
  title: "동의 센서스",
  scheme: "https",
  user_agent: "chronicle-test/0.1",
  bots: BOTS,
  domains: ["example.com", "open.example"],
};

/** probe 지원 fake http — URL별 {status, body} 반환. */
function fakeHttp(routes: () => Record<string, { status: number; body?: string }>): HttpClient & { seen: string[] } {
  const seen: string[] = [];
  const respond = (url: string): Response => {
    const r = routes()[url];
    if (!r) throw new Error(`ECONNREFUSED ${url}`); // 네트워크 오류 시뮬
    return new Response(r.status === 200 ? (r.body ?? "") : "not found", {
      status: r.status,
      headers: { "content-type": "text/plain" },
    });
  };
  return {
    seen,
    async probe(url) {
      seen.push(url);
      return respond(url);
    },
    async raw(url) {
      return respond(url);
    },
    json: async () => {
      throw new Error("n/a");
    },
    text: async () => {
      throw new Error("n/a");
    },
  };
}

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-10T00:00:00Z") });

const ROBOTS_BLOCK_AI = `# example.com
User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: *
Disallow: /private
Allow: /
`;

test("robots 파서: 차단/일부/부재 판정 + 연속 User-agent 그룹", () => {
  const groups = parseRobotsGroups(ROBOTS_BLOCK_AI);
  assert.equal(groups.length, 3);
  const stance = parseAiCrawlerStance(ROBOTS_BLOCK_AI, BOTS);
  assert.equal(stance.GPTBot, "blocked");
  assert.equal(stance.CCBot, "blocked");
  assert.equal(stance.ClaudeBot, "absent", "명시 안 된 봇은 absent (‘*’로 접지 않음)");
  assert.equal(stance["Google-Extended"], "absent");

  // 연속 User-agent가 규칙을 공유하는 그룹
  const shared = parseAiCrawlerStance("User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n", BOTS);
  assert.equal(shared.GPTBot, "blocked");
  assert.equal(shared.ClaudeBot, "blocked");

  // 일부 경로만 Disallow → partial
  assert.equal(parseAiCrawlerStance("User-agent: GPTBot\nDisallow: /admin\n", BOTS).GPTBot, "partial");
});

test("엔티티 계약 + robots 봇 필드 + llms.txt 404는 status만", async () => {
  const http = fakeHttp(() => ({
    "https://example.com/robots.txt": { status: 200, body: ROBOTS_BLOCK_AI },
    "https://example.com/llms.txt": { status: 404 },
    "https://open.example/robots.txt": { status: 200, body: "User-agent: *\nDisallow:\n" },
    "https://open.example/llms.txt": { status: 200, body: "# open.example\n> AI 친화 사이트" },
  }));
  const result = await adapter.collect(ctx(http));
  const ids = result.records.map((r) => r.entityId).sort();
  assert.deepEqual(ids, [
    "probe:example.com:llms-txt",
    "probe:example.com:robots-txt",
    "probe:open.example:llms-txt",
    "probe:open.example:robots-txt",
  ]);
  const robots = result.records.find((r) => r.entityId === "probe:example.com:robots-txt")!;
  assert.equal(robots.fields["bot:GPTBot"], "blocked");
  assert.equal(robots.fields["bot:ClaudeBot"], "absent");
  assert.ok(typeof robots.fields.body_sha256 === "string");

  const llmsMissing = result.records.find((r) => r.entityId === "probe:example.com:llms-txt")!;
  assert.equal(llmsMissing.fields.status, 404);
  assert.equal(llmsMissing.fields.body, undefined, "부재는 status만 (churn 방지)");

  assert.ok(new Headers().get("x") === null); // (no-op)
});

test("적합성 킷을 통과한다", async () => {
  const http = fakeHttp(() => ({
    "https://example.com/robots.txt": { status: 200, body: ROBOTS_BLOCK_AI },
    "https://example.com/llms.txt": { status: 404 },
    "https://open.example/robots.txt": { status: 200, body: "User-agent: *\nDisallow:\n" },
    "https://open.example/llms.txt": { status: 404 },
  }));
  await assertAdapterConformance(adapter, ctx(http));
});

test("파이프라인: 봇 차단 전환은 필드 이벤트, llms.txt 등장은 채택 이벤트", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-consent-"));
  let exampleRobots = "User-agent: *\nDisallow:\n"; // 처음엔 AI 봇 미지목
  let llmsAppears = false;
  const http = fakeHttp(() => ({
    "https://example.com/robots.txt": { status: 200, body: exampleRobots },
    "https://example.com/llms.txt": llmsAppears ? { status: 200, body: "# llms\n> 채택" } : { status: 404 },
    "https://open.example/robots.txt": { status: 200, body: "User-agent: GPTBot\nAllow: /\n" },
    "https://open.example/llms.txt": { status: 404 },
  }));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "consent-census", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-10T05:00:00.000Z");
  assert.equal(first.added, 4);

  // example.com이 GPTBot·ClaudeBot을 전면 차단으로 전환 + llms.txt 채택
  exampleRobots = "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n";
  llmsAppears = true;
  const second = await run("2026-07-11T05:00:00.000Z");

  const gptEvent = second.events.find((e) => e.entity_id === "probe:example.com:robots-txt" && e.field === "bot:GPTBot")!;
  assert.equal(gptEvent.before, "absent");
  assert.equal(gptEvent.after, "blocked");

  // llms.txt: status 404→200 (채택) + body 등장
  const llmsStatus = second.events.find((e) => e.entity_id === "probe:example.com:llms-txt" && e.field === "status")!;
  assert.equal(llmsStatus.before, 404);
  assert.equal(llmsStatus.after, 200);
  assert.ok(second.events.some((e) => e.entity_id === "probe:example.com:llms-txt" && e.field === RECORD_FIELD) === false, "llms는 이미 존재하던 레코드의 필드 변경");
});

test("네트워크 오류 도메인은 건너뛰되 삭제가 아니다", async () => {
  const http = fakeHttp(() => ({
    "https://example.com/robots.txt": { status: 200, body: ROBOTS_BLOCK_AI },
    "https://example.com/llms.txt": { status: 404 },
    // open.example은 라우트 없음 → ECONNREFUSED
  }));
  const result = await adapter.collect(ctx(http));
  const scope = result.removalScope!;
  assert.equal(scope({ entityId: "probe:open.example:robots-txt", sourceUrl: "u", fields: {} }), false, "실패 도메인은 삭제 감지 제외");
  assert.equal(scope({ entityId: "probe:example.com:robots-txt", sourceUrl: "u", fields: {} }), true);
});
