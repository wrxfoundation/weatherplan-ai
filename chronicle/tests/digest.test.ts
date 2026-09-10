/**
 * 투자-가독 다이제스트 — 12개 원장 가로지른 집계 검증.
 * 소멸/수정/신규 분류·기간 필터·소스별 롤업·마크다운 렌더·요약 절단.
 * 원장을 읽기만 하고 수정하지 않음(공증 무결성).
 */
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildDigest, type Digest, renderDigestHtml, renderDigestMarkdown, summarize } from "../engine/digest.js";
import { runOnce } from "../engine/pipeline.js";
import type { CollectResult, NormalizedRecord, SourceAdapter, SourceConfig } from "../engine/types.js";

function adapter(id: string, records: () => NormalizedRecord[]): SourceAdapter {
  return { id, family: "api-records", collect: async (): Promise<CollectResult> => ({ raw: {}, records: records() }) };
}
const cfg = (id: string): SourceConfig => ({ id, family: "api-records", max_removal_ratio: 1 });

test("소멸/수정/신규 분류 + 소스별 롤업 + 총계", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-digest-"));
  const root = dataDir; // sources/ 불필요 — adapter/config 주입

  // src-a: 두 공고 생성 → 하나(a:2) 소멸
  let aRecs: NormalizedRecord[] = [
    { entityId: "a:1", sourceUrl: "https://x/1", fields: { title: "공고 하나" } },
    { entityId: "a:2", sourceUrl: "https://x/2", fields: { title: "사라질 공고" } },
  ];
  const runA = (iso: string) => runOnce({ sourceId: "src-a", root, dataDir, adapter: adapter("src-a", () => aRecs), config: cfg("src-a"), now: () => new Date(iso), log: () => {} });
  await runA("2026-07-10T00:00:00.000Z");
  aRecs = [{ entityId: "a:1", sourceUrl: "https://x/1", fields: { title: "공고 하나" } }];
  await runA("2026-07-12T00:00:00.000Z");

  // src-b: 가격 100 → 200 (조용한 수정)
  let bRecs: NormalizedRecord[] = [{ entityId: "b:1", sourceUrl: "https://y/1", fields: { price: 100 } }];
  const runB = (iso: string) => runOnce({ sourceId: "src-b", root, dataDir, adapter: adapter("src-b", () => bRecs), config: cfg("src-b"), now: () => new Date(iso), log: () => {} });
  await runB("2026-07-10T00:00:00.000Z");
  bRecs = [{ entityId: "b:1", sourceUrl: "https://y/1", fields: { price: 200 } }];
  await runB("2026-07-12T00:00:00.000Z");

  const digest = buildDigest(dataDir, { sinceDays: 365, now: new Date("2026-07-13T00:00:00.000Z") });

  assert.equal(digest.totals.sources, 2);
  assert.equal(digest.totals.entities, 2, "a:1 + b:1 잔존");
  assert.equal(digest.totals.vanishedRecent, 1);
  assert.equal(digest.totals.editedRecent, 1);
  assert.equal(digest.totals.bornRecent, 3, "a:1,a:2,b:1 생성");
  assert.equal(digest.totals.eventsAllTime, 5, "생성3+소멸1+수정1");

  assert.equal(digest.vanished[0].entityId, "a:2");
  assert.equal(summarize(digest.vanished[0].before), "사라질 공고");
  const edit = digest.edited.find((e) => e.field === "price")!;
  assert.equal(edit.before, 100);
  assert.equal(edit.after, 200);

  const rollupA = digest.perSource.find((s) => s.source === "src-a")!;
  assert.equal(rollupA.vanishedRecent, 1);
  assert.equal(rollupA.entities, 1);
});

test("기간 필터: 컷오프 이전 이벤트는 제외", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-digest-cut-"));
  let recs: NormalizedRecord[] = [{ entityId: "x:1", sourceUrl: "https://z/1", fields: { v: 1 } }];
  const run = (iso: string) => runOnce({ sourceId: "src-x", root: dataDir, dataDir, adapter: adapter("src-x", () => recs), config: cfg("src-x"), now: () => new Date(iso), log: () => {} });
  await run("2026-01-01T00:00:00.000Z"); // 생성 (오래됨)
  recs = [{ entityId: "x:1", sourceUrl: "https://z/1", fields: { v: 2 } }];
  await run("2026-07-12T00:00:00.000Z"); // 수정 (최근)

  const digest = buildDigest(dataDir, { sinceDays: 7, now: new Date("2026-07-13T00:00:00.000Z") });
  assert.equal(digest.totals.bornRecent, 0, "생성은 컷오프 밖");
  assert.equal(digest.totals.editedRecent, 1, "수정만 최근");
});

test("마크다운: 핵심 섹션 + 소멸 항목 + 공증 라인", () => {
  const digest = buildDigest(mkdtempSync(join(tmpdir(), "chronicle-digest-md-")), { sinceDays: 30, now: new Date("2026-07-13T00:00:00.000Z") });
  const md = renderDigestMarkdown(digest);
  assert.match(md, /# Chronicle 다이제스트/);
  assert.match(md, /## 사라진 것 — 소멸/);
  assert.match(md, /3중 공증/);
  assert.match(md, /소스별 현황/);
});

test("renderDigestHtml: 소멸 전면 + 적대적 값 이스케이프 + 디자인 헤리티지 불변식", () => {
  const d: Digest = {
    generatedAt: "2026-07-13T00:00:00.000Z",
    sinceDays: 30,
    since: "2026-06-13T00:00:00.000Z",
    totals: { sources: 1, entities: 1, chainLength: 1, eventsAllTime: 1, eventsRecent: 1, bornRecent: 0, vanishedRecent: 1, editedRecent: 0 },
    trust: { sourcesWithChain: 1, headsAnchored: 1 },
    perSource: [{ source: "s", entities: 1, chainLength: 1, updatedAt: "2026-07-13", headAnchored: true, bornRecent: 0, vanishedRecent: 1, editedRecent: 0 }],
    vanished: [{ source: "s", entityId: 'x:<script>alert(1)</script>', field: "__record__", before: { title: '<img src=x onerror="p()">' }, after: null, observedAt: "2026-07-13T00:00:00.000Z" }],
    edited: [],
    vanishedTruncated: 0,
    editedTruncated: 0,
  };
  const html = renderDigestHtml(d, "kwangdol-star/aiagentlabs");
  // 적대적 값 이스케이프
  assert.ok(!html.includes("<script>alert"), "entityId 태그 원문 노출 금지");
  assert.ok(!html.includes("<img src=x"), "값의 태그 원문 노출 금지");
  assert.ok(html.includes("&lt;script&gt;alert"), "이스케이프된 형태로 보존");
  // 소멸이 전면
  assert.ok(html.includes("사라진 것 — 소멸"));
  // 디자인 헤리티지 불변식 (site.ts와 동일 계보)
  assert.ok(html.includes("--accent:#3bcfe4"));
  assert.ok(html.includes("backdrop-filter:var(--blur)") && html.includes("-webkit-backdrop-filter:var(--blur)"));
  assert.ok(html.includes("background-attachment:fixed"));
  assert.ok(!/@keyframes/.test(html), "정적 글로우 — 배경 애니메이션 금지");
  assert.ok(html.includes("family=Montserrat") && html.includes("'Apple SD Gothic Neo','Noto Sans KR'"));
});

test("summarize: 스칼라·레코드객체·긴 문자열 절단", () => {
  assert.equal(summarize(null), "∅");
  assert.equal(summarize(42), "42");
  assert.equal(summarize(true), "true");
  assert.equal(summarize({ title: "대표 제목", other: "무시" }), "대표 제목");
  assert.equal(summarize("가".repeat(200)).endsWith("…"), true);
});
