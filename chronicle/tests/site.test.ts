/**
 * 프론트뷰 생성기 검증 — 결정성(같은 데이터 = 같은 바이트), HTML 이스케이프,
 * JSON-LD 유효성, llms.txt 계약, 빈 상태 처리.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import bunyangAdapter from "../sources/bunyang-capsule/adapter.js";
import { runOnce } from "../engine/pipeline.js";
import { gatherSources, renderHtml, renderLlms, writeSite } from "../engine/site.js";
import type { NormalizedRecord, SourceAdapter, SourceConfig } from "../engine/types.js";
import { odcloudEmulator, type OdcloudDatasets } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const day1 = JSON.parse(readFileSync(join(here, "fixtures", "bunyang-day1.json"), "utf8")) as OdcloudDatasets;
const REPO = "kwangdol-star/aiagentlabs";

async function setupData(): Promise<string> {
  process.env.DATA_GO_KR_KEY = "test-key";
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-site-"));
  await runOnce({
    sourceId: "bunyang-capsule",
    root,
    dataDir,
    adapter: bunyangAdapter,
    http: odcloudEmulator(() => day1),
    now: () => new Date("2026-07-09T05:00:00.000Z"),
    log: () => {},
  });
  return dataDir;
}

test("현황·이벤트·링크가 담기고, 같은 데이터는 같은 바이트를 낸다", async () => {
  const dataDir = await setupData();
  const sources = gatherSources(root, dataDir);
  const html = renderHtml(sources, REPO);

  assert.ok(html.includes("bunyang-capsule"));
  assert.ok(html.includes("청약홈 APT 분양공고"), "config title이 카드에 실려야 한다");
  assert.ok(html.includes("봉인된 이벤트"));
  assert.ok(html.includes(`https://github.com/${REPO}/blob/main/data/bunyang-capsule/changes.jsonl`));
  assert.ok(html.includes("서울숲") === false, "레코드 값 원문은 페이지에 싣지 않는다(entity/필드만)");
  assert.ok(html.includes("apt:2026000001:2026000001"), "entity_id는 이벤트 목록에 보인다");

  // 결정성 — 크론의 "변경 시에만 커밋"의 전제
  assert.equal(renderHtml(gatherSources(root, dataDir), REPO), html);

  // JSON-LD가 유효한 JSON이고 Dataset을 담는다
  const jsonLd = html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
  assert.ok(jsonLd, "JSON-LD 블록이 있어야 한다");
  const datasets = JSON.parse(jsonLd![1]);
  assert.equal(datasets[0]["@type"], "Dataset");
  assert.equal(datasets[0].identifier, "bunyang-capsule");
});

test("적대적 entity_id·필드명은 이스케이프된다", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "chronicle-site-hostile-"));
  const hostile: NormalizedRecord[] = [
    {
      entityId: 'x:<script>alert(1)</script>"',
      sourceUrl: "https://example.com/",
      fields: { '<img src=x onerror="p()">': "v" },
    },
  ];
  const adapter: SourceAdapter = {
    id: "hostile",
    family: "api-records",
    collect: async () => ({ raw: {}, records: hostile }),
  };
  const config: SourceConfig = { id: "hostile", family: "api-records", title: 'T<script>"&' };
  await runOnce({ sourceId: "hostile", root, dataDir, adapter, config, now: () => new Date("2026-07-10T00:00:00Z"), log: () => {} });

  // 2회차: 필드 변경 이벤트로 적대적 필드명도 노출 경로에 태운다
  hostile[0] = { ...hostile[0], fields: { '<img src=x onerror="p()">': "v2" } };
  await runOnce({ sourceId: "hostile", root, dataDir, adapter, config, now: () => new Date("2026-07-11T00:00:00Z"), log: () => {} });

  const html = renderHtml(gatherSources(root, dataDir), REPO);
  assert.ok(!html.includes("<script>alert"), "entity_id의 태그가 원문으로 새면 안 된다");
  assert.ok(!html.includes("<img src=x"), "필드명의 태그가 원문으로 새면 안 된다");
  assert.ok(html.includes("&lt;script&gt;alert"), "이스케이프된 형태로 보존된다");
});

test("llms.txt: 소스·원장 URL·계약이 담긴다", async () => {
  const dataDir = await setupData();
  const llms = renderLlms(gatherSources(root, dataDir), REPO);
  assert.ok(llms.includes("### bunyang-capsule"));
  assert.ok(llms.includes(`https://raw.githubusercontent.com/${REPO}/main/data/bunyang-capsule/changes.jsonl`));
  assert.ok(llms.includes("observed_at, entity_id, field, before, after"));
});

test("디자인 불변식(DESIGN.md): 유리 재질·시그니처·정적 글로우·시스템 한글 폴백", async () => {
  const dataDir = await setupData();
  const html = renderHtml(gatherSources(root, dataDir), REPO);
  // 유리엔 backdrop-filter + -webkit- 쌍 필수
  assert.ok(html.includes("backdrop-filter:var(--blur)"));
  assert.ok(html.includes("-webkit-backdrop-filter:var(--blur)"));
  // 시그니처 블루-틸 토큰
  assert.ok(html.includes("--accent:#3bcfe4"));
  // 정적 글로우 (배경 애니메이션 금지)
  assert.ok(html.includes("background-attachment:fixed"));
  assert.ok(!/@keyframes/.test(html), "배경 애니메이션 금지 — 정적 글로우가 확정");
  // Montserrat + 시스템 한글 폴백 (무거운 한글 웹폰트 금지)
  assert.ok(html.includes("family=Montserrat"));
  assert.ok(html.includes("'Apple SD Gothic Neo','Noto Sans KR'"));
  assert.ok(!html.includes("family=Noto+Sans+KR"), "한글 웹폰트를 싣지 않는다");
});

test("writeSite: docs/에 파일을 쓰고, 빈 데이터에서도 동작한다", async () => {
  const emptyData = mkdtempSync(join(tmpdir(), "chronicle-site-empty-"));
  const siteRoot = mkdtempSync(join(tmpdir(), "chronicle-site-root-"));
  const { htmlPath, llmsPath } = writeSite(siteRoot, emptyData, REPO);
  const html = readFileSync(htmlPath, "utf8");
  assert.ok(html.includes("첫 수집 전입니다"));
  assert.ok(readFileSync(llmsPath, "utf8").includes("Chronicle"));
});
