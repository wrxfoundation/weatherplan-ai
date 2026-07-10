/**
 * #11 forecast-graders — 페이지 텍스트형 계열 검증.
 * 가짜 HTML 페이지로: 정규화·노이즈 면역(조회수)·발표 감지 diff·
 * 개별 실패 허용(삭제 오탐 없음)·전원 실패 중단·적합성 킷·파이프라인 통합.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import adapter from "../sources/forecast-graders/adapter.js";
import { assertAdapterConformance } from "../engine/conformance.js";
import { runOnce } from "../engine/pipeline.js";
import type { CollectContext, HttpClient, SourceConfig } from "../engine/types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: SourceConfig = {
  id: "forecast-graders",
  family: "page-text",
  title: "기관 전망 박제",
  user_agent: "chronicle-test-agent/1.0",
  targets: [
    { id: "bok-outlook", url: "https://bok.example/outlook" },
    { id: "kb-research", url: "https://kb.example/reports" },
  ],
};

function page(title: string, items: string[], hits: number): string {
  return `<!doctype html><html><head><title>${title}</title>
    <script>tracking()</script><style>.a{}</style></head>
    <body><h1>${title}</h1><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    <span>조회수 ${hits.toLocaleString()}</span></body></html>`;
}

/** URL별 HTML을 서빙하는 가짜 http — 요청 헤더도 기록한다. */
function fakePages(pages: () => Record<string, string | null>): HttpClient & { seenHeaders: Array<Record<string, string>> } {
  const seenHeaders: Array<Record<string, string>> = [];
  return {
    seenHeaders,
    async text(url, init) {
      seenHeaders.push(Object.fromEntries(new Headers(init?.headers).entries()));
      const body = pages()[url];
      if (body === null || body === undefined) throw new Error(`HTTP 403 Forbidden — ${url}`);
      return body;
    },
    json: async () => {
      throw new Error("not implemented");
    },
    raw: async () => {
      throw new Error("not implemented");
    },
  };
}

function ctxWith(http: HttpClient, cfg: SourceConfig = config): CollectContext {
  return { config: cfg, http, log: () => {}, now: () => new Date("2026-07-10T00:00:00Z") };
}

test("정규화: 태그·스크립트 제거, UA 헤더 전송, 엔티티 계약", async () => {
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", ["경제전망보고서(2026.5)"], 100),
    "https://kb.example/reports": page("KB보고서", ["2026 KB 부동산 보고서"], 200),
  }));
  const result = await adapter.collect(ctxWith(http));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["page:bok-outlook", "page:kb-research"]);
  const bok = result.records.find((r) => r.entityId === "page:bok-outlook")!;
  assert.ok(String(bok.fields.text).includes("경제전망보고서(2026.5)"));
  assert.ok(!String(bok.fields.text).includes("tracking"), "스크립트는 제거되어야 한다");
  assert.ok(!String(bok.fields.text).includes("조회수"), "조회수 노이즈는 제거되어야 한다");
  assert.ok(http.seenHeaders.every((h) => h["user-agent"] === "chronicle-test-agent/1.0"));
});

test("적합성 킷을 통과한다", async () => {
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", ["보고서A"], 1),
    "https://kb.example/reports": page("KB보고서", ["보고서B"], 2),
  }));
  await assertAdapterConformance(adapter, ctxWith(http));
});

test("파이프라인 통합: 발표는 이벤트가 되고, 조회수만 바뀌면 무기록", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-forecast-"));
  let bokItems = ["경제전망보고서(2026.5)"];
  let hits = 100;
  let kbDown = false;
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", bokItems, hits),
    "https://kb.example/reports": kbDown ? null : page("KB보고서", ["2026 KB 부동산 보고서"], 50),
  }));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "forecast-graders", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-10T21:17:00.000Z");
  assert.equal(first.added, 2);

  // 조회수만 증가 → 노이즈 면역, 무기록
  hits = 999;
  const second = await run("2026-07-13T21:17:00.000Z");
  assert.equal(second.wrote, false);

  // 새 전망 발표 → text/text_sha256 필드 변경 이벤트
  bokItems = [...bokItems, "경제전망보고서(2026.8) — 하반기 전망"];
  const third = await run("2026-07-16T21:17:00.000Z");
  assert.equal(third.changed, 2); // text + text_sha256
  assert.ok(third.events.some((e) => e.field === "text" && String(e.after).includes("2026.8")));

  // 대상 하나가 일시 차단(403) → 그 대상만 건너뛰고, 삭제 이벤트도 아니다
  kbDown = true;
  const fourth = await run("2026-07-20T21:17:00.000Z");
  assert.equal(fourth.removed, 0, "페치 실패는 삭제가 아니다");
  const latest = JSON.parse(readFileSync(join(dataDir, "forecast-graders", "latest.json"), "utf8"));
  assert.ok(latest.records["page:kb-research"], "실패한 대상의 마지막 관측 상태는 보존된다");
});

test("전 대상 페치 실패는 소스 장애로 중단한다", async () => {
  const http = fakePages(() => ({}));
  await assert.rejects(() => adapter.collect(ctxWith(http)), /전부 페치 실패/);
});

test("targets 없는 config는 즉시 오류다", async () => {
  const http = fakePages(() => ({}));
  await assert.rejects(
    () => adapter.collect(ctxWith(http, { id: "forecast-graders", family: "page-text" })),
    /targets가 없습니다/,
  );
});
