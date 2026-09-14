import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpClient, safeUrl } from "../engine/fetch.js";

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

test("safeUrl: 민감 쿼리 파라미터를 마스킹한다", () => {
  assert.match(safeUrl("https://api.example.com/x?serviceKey=SECRET123&pageNo=1"), /serviceKey=REDACTED/);
  assert.ok(!safeUrl("https://api.example.com/x?serviceKey=SECRET123&pageNo=1").includes("SECRET123"));
  assert.ok(!safeUrl("https://api.example.com/x?authKey=ABC%2BDEF&a=1").includes("ABC"), "authKey 값 노출 안 됨");
  assert.match(safeUrl("https://generativelanguage.googleapis.com/v1beta/models/x:gen?key=AIzaSECRET"), /key=REDACTED/);
  assert.ok(!safeUrl("https://o/x?KEY=zzz").includes("zzz"), "대문자 KEY도 마스킹");
  assert.equal(safeUrl("https://example.com/x?pageNo=1"), "https://example.com/x?pageNo=1"); // 비밀 없으면 원본 유지
});

test("에러 메시지에 API 키가 새지 않는다 (4xx·재시도소진·네트워크)", async () => {
  const url = "https://apis.data.go.kr/svc?serviceKey=TOPSECRETKEY&pageNo=1";
  const noKey = (e: Error) => {
    assert.ok(!e.message.includes("TOPSECRETKEY"), `키 노출: ${e.message}`);
    return true;
  };
  // 4xx 즉시 실패 (fetch.ts L82 경로)
  await assert.rejects(
    () => createHttpClient({ retries: 0, baseDelayMs: 1 }, async () => new Response("no", { status: 401, statusText: "Unauthorized" })).json(url),
    noKey,
  );
  // 5xx 재시도 소진
  await assert.rejects(
    () => createHttpClient({ retries: 1, baseDelayMs: 1 }, async () => new Response("x", { status: 503 })).json(url),
    noKey,
  );
  // 네트워크 오류 (fetch.ts "요청 실패" 경로)
  await assert.rejects(
    () => createHttpClient({ retries: 0, baseDelayMs: 1 }, async () => {
      throw new Error("ECONNREFUSED");
    }).text(url),
    noKey,
  );
});
