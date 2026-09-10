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

interface Row {
  title: string;
  date: string;
  views: number;
}

/** 기관 게시판 목록 페이지 흉내 — [번호 제목 작성자 날짜 조회수] 행 + 스크립트/스타일 노이즈. */
function page(title: string, rows: Row[]): string {
  const body = rows
    .map((row, index) => `<tr><td>${900 - index}</td><td>${row.title}</td><td>홍보담당</td><td>${row.date}</td><td>${row.views.toLocaleString()}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><title>${title}</title>
    <script>tracking()</script><style>.a{}</style></head>
    <body><h1>${title}</h1><table>${body}</table></body></html>`;
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

test("구조화 추출: 날짜 앵커 헤드라인 목록(items)을 tracked로 삼고 조회수·번호는 배제", async () => {
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", [{ title: "경제전망보고서 2026년 5월", date: "2026-05-30", views: 12345 }]),
    "https://kb.example/reports": page("KB보고서", [{ title: "KB 부동산 보고서", date: "2026-03-10", views: 200 }]),
  }));
  const result = await adapter.collect(ctxWith(http));
  assert.deepEqual(result.records.map((r) => r.entityId).sort(), ["page:bok-outlook", "page:kb-research"]);
  const bok = result.records.find((r) => r.entityId === "page:bok-outlook")!;
  const items = bok.fields.items as string[];
  assert.ok(Array.isArray(items) && items.length === 1);
  assert.ok(items[0].startsWith("2026-05-30 · "));
  assert.ok(items[0].includes("경제전망보고서 2026년 5월"), "제목이 항목에 담긴다");
  assert.ok(!items[0].includes("12,345") && !items[0].includes("12345"), "조회수는 배제");
  assert.equal(bok.fields.text, undefined, "전문 텍스트는 tracked에서 빠진다 (원본은 스냅샷)");
  assert.ok(http.seenHeaders.every((h) => h["user-agent"] === "chronicle-test-agent/1.0"));
});

test("항목 안정성: 조회수만 바뀌면 items 동일, 새 게시가 위에 끼어도 기존 항목 불변", () => {
  const rows = (extra: Row[] = [], views = 100): Row[] => [
    ...extra,
    { title: "2025년 주택시장 전망", date: "2025-12-23", views },
    { title: "2024년 주택시장 전망", date: "2024-12-19", views },
  ];
  const derive = (html: string) => (adapter as unknown as { fieldsFor(h: string): { items: string[] } }).fieldsFor(html);
  const base = derive(page("주택경기전망", rows())).items;
  // 조회수만 크게 바뀜 → 동일
  assert.deepEqual(derive(page("주택경기전망", rows([], 999999))).items, base);
  // 최신 게시 하나가 맨 위에 추가 → 새 항목 1개만 늘고 기존 항목은 그대로
  const withNew = derive(page("주택경기전망", rows([{ title: "2026년 주택시장 전망", date: "2026-07-09", views: 5 }]))).items;
  assert.equal(withNew.length, base.length + 1);
  assert.ok(base.every((item) => withNew.includes(item)), "기존 항목은 흔들리지 않는다");
  assert.ok(withNew[0].includes("2026년 주택시장 전망"), "새 항목이 최신순 맨 앞");
});

test("적합성 킷을 통과한다", async () => {
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", [{ title: "보고서A", date: "2026-01-05", views: 1 }]),
    "https://kb.example/reports": page("KB보고서", [{ title: "보고서B", date: "2026-02-06", views: 2 }]),
  }));
  await assertAdapterConformance(adapter, ctxWith(http));
});

test("파이프라인 통합: 발표는 items 이벤트, 조회수만 바뀌면 무기록", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-forecast-"));
  let bokRows: Row[] = [{ title: "경제전망보고서 2026년 5월", date: "2026-05-30", views: 100 }];
  let kbDown = false;
  const http = fakePages(() => ({
    "https://bok.example/outlook": page("경제전망", bokRows),
    "https://kb.example/reports": kbDown ? null : page("KB보고서", [{ title: "KB 부동산 보고서", date: "2026-03-10", views: 50 }]),
  }));
  const run = (isoNow: string) =>
    runOnce({ sourceId: "forecast-graders", root, dataDir, adapter, config, http, now: () => new Date(isoNow), log: () => {} });

  const first = await run("2026-07-10T21:17:00.000Z");
  assert.equal(first.added, 2);

  // 조회수만 증가 → 노이즈 면역, 무기록
  bokRows = [{ title: "경제전망보고서 2026년 5월", date: "2026-05-30", views: 88888 }];
  const second = await run("2026-07-13T21:17:00.000Z");
  assert.equal(second.wrote, false);

  // 새 전망 발표(최신 행 추가) → items 필드 변경 이벤트 1건
  bokRows = [{ title: "경제전망보고서 2026년 8월 하반기", date: "2026-08-29", views: 3 }, ...bokRows];
  const third = await run("2026-07-16T21:17:00.000Z");
  assert.equal(third.changed, 1, "items 한 필드만 변경");
  const itemsEvent = third.events.find((e) => e.field === "items")!;
  assert.ok((itemsEvent.after as string[]).some((item) => item.includes("2026년 8월 하반기")));

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
