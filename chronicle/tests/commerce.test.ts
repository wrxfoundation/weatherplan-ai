/**
 * #19 agent-commerce-census — file-probe 피기백 검증.
 * 도메인×경로 프로브·매니페스트 200=채택·404=베이스라인·SPA 200=non_manifest·
 * 채택 이벤트·적합성 킷.
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/agent-commerce-census/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import type { CollectContext, HttpClient, SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "agent-commerce-census",
  family: "file-probe",
  title: "에이전트 커머스 센서스",
  scheme: "https",
  user_agent: "chronicle-test/0.1",
  paths: ["/.well-known/x402.json", "/.well-known/agentic-commerce.json"],
  domains: ["coinbase.example", "spa.example"],
};

function fakeHttp(routes: () => Record<string, { status: number; body?: string; contentType?: string }>): HttpClient {
  const respond = (url: string): Response => {
    const r = routes()[url];
    if (!r) throw new Error(`ECONNREFUSED ${url}`);
    return new Response(r.status === 200 ? (r.body ?? "") : "nope", {
      status: r.status,
      headers: { "content-type": r.contentType ?? "application/json" },
    });
  };
  return {
    async probe(url) {
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

const ctx = (http: HttpClient): CollectContext => ({ config, http, log: () => {}, now: () => new Date("2026-07-13T00:00:00Z") });

test("도메인×경로 프로브: 매니페스트 200=해시 수록, 404=status만, SPA HTML 200=non_manifest", async () => {
  const http = fakeHttp(() => ({
    "https://coinbase.example/.well-known/x402.json": { status: 200, body: '{"x402":{"version":1}}' },
    "https://coinbase.example/.well-known/agentic-commerce.json": { status: 404 },
    "https://spa.example/.well-known/x402.json": { status: 200, body: "<!doctype html><html>SPA</html>", contentType: "text/html" },
    "https://spa.example/.well-known/agentic-commerce.json": { status: 404 },
  }));
  const result = await adapter.collect(ctx(http));
  assert.equal(result.records.length, 4);

  const x402 = result.records.find((r) => r.entityId === "manifest:coinbase.example:well-known-x402-json")!;
  assert.equal(x402.fields.status, 200);
  assert.ok(typeof x402.fields.body_sha256 === "string", "실 매니페스트는 해시 수록");

  const missing = result.records.find((r) => r.entityId === "manifest:coinbase.example:well-known-agentic-commerce-json")!;
  assert.equal(missing.fields.status, 404);
  assert.equal(missing.fields.body_sha256, undefined);

  const spa = result.records.find((r) => r.entityId === "manifest:spa.example:well-known-x402-json")!;
  assert.equal(spa.fields.non_manifest, true, "HTML catch-all은 채택 아님");
  assert.equal(spa.fields.body_sha256, undefined, "SPA 본문은 해시 배제(churn 방지)");
});

test("적합성 킷을 통과한다", async () => {
  const http = fakeHttp(() => ({
    "https://coinbase.example/.well-known/x402.json": { status: 200, body: '{"ok":1}' },
    "https://coinbase.example/.well-known/agentic-commerce.json": { status: 404 },
    "https://spa.example/.well-known/x402.json": { status: 404 },
    "https://spa.example/.well-known/agentic-commerce.json": { status: 404 },
  }));
  await assertAdapterConformance(adapter, ctx(http));
});

test("파이프라인: 매니페스트 등장(404→200)이 채택 이벤트", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-commerce-"));
  let adopted = false;
  const http = fakeHttp(() => ({
    "https://coinbase.example/.well-known/x402.json": { status: 200, body: '{"x402":1}' },
    "https://coinbase.example/.well-known/agentic-commerce.json": { status: 404 },
    "https://spa.example/.well-known/x402.json": { status: 404 },
    "https://spa.example/.well-known/agentic-commerce.json": adopted
      ? { status: 200, body: '{"acp":"v1","payment":"stripe"}' }
      : { status: 404 },
  }));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "agent-commerce-census", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-13T05:00:00.000Z");
  assert.equal(first.added, 4);

  // spa.example이 ACP 매니페스트 채택 (404 → 200)
  adopted = true;
  const second = await run("2026-07-20T05:00:00.000Z");
  const statusEvent = second.events.find(
    (e) => e.entity_id === "manifest:spa.example:well-known-agentic-commerce-json" && e.field === "status",
  )!;
  assert.equal(statusEvent.before, 404);
  assert.equal(statusEvent.after, 200);
  assert.ok(
    second.events.some((e) => e.entity_id === "manifest:spa.example:well-known-agentic-commerce-json" && e.field === "body_sha256"),
    "채택 시 본문 해시가 등장(신규 필드 이벤트)",
  );
});
