import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpClient } from "../engine/fetch.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("5xx는 재시도 후 성공한다", async () => {
  let calls = 0;
  const http = createHttpClient({ retries: 3, baseDelayMs: 1 }, async () => {
    calls += 1;
    return calls < 3 ? new Response("boom", { status: 503 }) : jsonResponse({ ok: true });
  });
  assert.deepEqual(await http.json("https://example.com/x"), { ok: true });
  assert.equal(calls, 3);
});

test("재시도 소진 시 마지막 오류를 던진다", async () => {
  let calls = 0;
  const http = createHttpClient({ retries: 2, baseDelayMs: 1 }, async () => {
    calls += 1;
    return new Response("down", { status: 502 });
  });
  await assert.rejects(() => http.json("https://example.com/x"), /HTTP 502/);
  assert.equal(calls, 3); // 첫 시도 + 재시도 2회
});

test("4xx(비재시도)는 즉시 실패한다", async () => {
  let calls = 0;
  const http = createHttpClient({ retries: 3, baseDelayMs: 1 }, async () => {
    calls += 1;
    return new Response("nope", { status: 404, statusText: "Not Found" });
  });
  await assert.rejects(() => http.json("https://example.com/x"), /HTTP 404/);
  assert.equal(calls, 1);
});

test("Retry-After 헤더는 상한(maxRetryAfterMs)까지만 존중한다", async () => {
  let calls = 0;
  const startedAt = Date.now();
  const http = createHttpClient({ retries: 1, baseDelayMs: 1, maxRetryAfterMs: 20 }, async () => {
    calls += 1;
    return calls === 1
      ? new Response("slow down", { status: 429, headers: { "retry-after": "3600" } })
      : jsonResponse({ ok: true });
  });
  assert.deepEqual(await http.json("https://example.com/x"), { ok: true });
  assert.equal(calls, 2);
  assert.ok(Date.now() - startedAt < 2000, "1시간짜리 Retry-After를 그대로 기다리면 안 된다");
});

test("네트워크 오류도 재시도한다", async () => {
  let calls = 0;
  const http = createHttpClient({ retries: 2, baseDelayMs: 1 }, async () => {
    calls += 1;
    if (calls === 1) throw new Error("ECONNRESET");
    return jsonResponse({ ok: 1 });
  });
  assert.deepEqual(await http.json("https://example.com/x"), { ok: 1 });
  assert.equal(calls, 2);
});
