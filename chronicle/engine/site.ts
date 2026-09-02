/**
 * 공개 프론트뷰 생성 — docs/index.html + docs/llms.txt (GitHub Pages용).
 *
 * 디자인은 KoreaAPI 헤리티지의 형제 계보(DESIGN.md): 리퀴드 글래스 재질 ·
 * 정적 글로우 · Montserrat+시스템 한글 · "색은 공증 상태의 인코딩" 원칙을
 * 계승하고, 시그니처는 블루 기운 청록(#3bcfe4). 사람에게는 현황판을,
 * 에이전트에게는 llms.txt와 Schema.org Dataset을 준다.
 *
 * 결정성 계약: 출력은 data/ 내용만으로 결정된다 — 생성 시각 같은 휘발 값을
 * 넣지 않으므로 데이터가 안 변하면 바이트가 안 변하고, 크론의 "변경 시에만
 * 커밋"이 그대로 성립한다.
 *
 * CLI: npm run site [-- --root <path>] [--data-dir <path>] [--repo <owner/name>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import YAML from "yaml";
import { type AggregateEntry, buildAggregateFeed } from "./aggregate.js";
import { collectStatus } from "./status.js";
import { readChangeLines, sourcePaths } from "./store.js";
import { RECORD_FIELD, type ChangeEvent } from "./types.js";
import { renderVerifyPage } from "./verify-page.js";

const AGG_PER_SOURCE = 20; // 소스별 최근 이벤트 상한 — 한 고빈도 소스가 통합 피드를 잠식하지 않게

const RECENT_EVENTS = 6;

export function escapeHtml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "\uFFFD")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface SiteSource {
  id: string;
  title: string;
  records: number;
  chainLength: number;
  chainHead: string;
  updatedAt: string;
  anchors: number;
  headAnchored: boolean;
  recent: ChangeEvent[];
}

function loadTitle(root: string, sourceId: string): string {
  const configPath = join(root, "sources", sourceId, "config.yml");
  if (!existsSync(configPath)) return sourceId;
  try {
    const parsed = YAML.parse(readFileSync(configPath, "utf8")) as { title?: string };
    return parsed?.title ?? sourceId;
  } catch {
    return sourceId;
  }
}

export function gatherSources(root: string, dataDir: string): SiteSource[] {
  return collectStatus(dataDir).map((status) => {
    const lines = readChangeLines(sourcePaths(dataDir, status.source_id));
    const recent = lines
      .slice(-RECENT_EVENTS)
      .map((line) => JSON.parse(line) as ChangeEvent)
      .reverse();
    return {
      id: status.source_id,
      title: loadTitle(root, status.source_id),
      records: status.records,
      chainLength: status.chain_length,
      chainHead: status.chain_head,
      updatedAt: status.updated_at,
      anchors: status.anchors,
      headAnchored: status.head_anchored,
      recent,
    };
  });
}

function eventBadge(event: ChangeEvent): { label: string; klass: string } {
  if (event.field === RECORD_FIELD) {
    return event.after === null ? { label: "삭제", klass: "ev-del" } : { label: "신규", klass: "ev-new" };
  }
  return { label: "변경", klass: "ev-chg" };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** 라인 스트로크 체인링크 마크 — 해시체인의 사슬 (DESIGN.md). */
const MARK_SVG = `<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="#3bcfe4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>`;

function renderEvents(events: ChangeEvent[]): string {
  if (events.length === 0) return '<p class="muted">아직 이벤트가 없습니다.</p>';
  const rows = events
    .map((event) => {
      const badge = eventBadge(event);
      const field = event.field === RECORD_FIELD ? "" : ` <span class="field">${escapeHtml(truncate(event.field, 24))}</span>`;
      return `<li><span class="ev ${badge.klass}">${badge.label}</span><code>${escapeHtml(truncate(event.entity_id, 44))}</code>${field}<span class="when">${escapeHtml(event.observed_at.slice(0, 10))}</span></li>`;
    })
    .join("\n");
  return `<ul class="events">\n${rows}\n</ul>`;
}

function renderSourceCard(source: SiteSource, repo: string): string {
  const blob = `https://github.com/${repo}/blob/main/data/${source.id}`;
  const anchorState = source.headAnchored
    ? '<span class="pill pill-ok">TSA 앵커 ✓</span>'
    : source.anchors > 0
      ? '<span class="pill pill-wait">앵커 갱신 대기</span>'
      : '<span class="pill pill-wait">앵커 대기</span>';
  return `<article class="card">
  <header class="card-head">
    <h3>${escapeHtml(source.title)}</h3>
    <span class="src-id">${escapeHtml(source.id)}</span>
  </header>
  <div class="stat-row">
    <div class="stat"><b>${source.records.toLocaleString("ko-KR")}</b><span>레코드</span></div>
    <div class="stat"><b>${source.chainLength.toLocaleString("ko-KR")}</b><span>봉인 이벤트</span></div>
    <div class="stat"><b>${source.anchors.toLocaleString("ko-KR")}</b><span>외부 앵커</span></div>
  </div>
  <div class="hash-line">chain head <code>${escapeHtml(source.chainHead.slice(0, 20))}…</code> ${anchorState}</div>
  <div class="muted">최신 관측 ${escapeHtml(source.updatedAt)}</div>
  ${renderEvents(source.recent)}
  <nav class="links">
    <a href="./verify.html?source=${escapeHtml(source.id)}">✓ 검증</a><a href="${blob}/changes.jsonl">원장</a><a href="${blob}/latest.json">현재 상태</a><a href="${blob}/feed.xml">피드</a><a href="${blob}/integrity.json">체인</a>${source.anchors > 0 ? `<a href="https://github.com/${repo}/tree/main/data/${source.id}/anchors">앵커 증서</a>` : ""}
  </nav>
</article>`;
}

function renderJsonLd(sources: SiteSource[], repo: string): string {
  const datasets = sources.map((source) => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Chronicle — ${source.title}`,
    identifier: source.id,
    description: `append-only 변경 원장 (이벤트 ${source.chainLength}건, 레코드 ${source.records}건). SHA-256 해시체인 + 커밋 히스토리 + RFC 3161 외부 앵커의 3중 공증.`,
    dateModified: source.updatedAt,
    url: `https://github.com/${repo}/tree/main/data/${source.id}`,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/jsonl",
        contentUrl: `https://raw.githubusercontent.com/${repo}/main/data/${source.id}/changes.jsonl`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `https://raw.githubusercontent.com/${repo}/main/data/${source.id}/latest.json`,
      },
    ],
  }));
  return JSON.stringify(datasets, null, 2);
}

export function renderHtml(sources: SiteSource[], repo: string): string {
  const totalEvents = sources.reduce((sum, s) => sum + s.chainLength, 0);
  const totalRecords = sources.reduce((sum, s) => sum + s.records, 0);
  const lastUpdated = sources.map((s) => s.updatedAt).sort().at(-1) ?? "-";
  const cards = sources.length
    ? sources.map((source) => renderSourceCard(source, repo)).join("\n")
    : '<p class="muted">첫 수집 전입니다.</p>';

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chronicle — 시간해자 크로니클</title>
<meta name="description" content="오늘 기록하지 않으면 영원히 없는 것들의 공증 원장 — SHA-256 해시체인·커밋 히스토리·RFC 3161 외부 앵커의 3중 공증으로 '먼저·진짜로 기록했다'를 증명한다.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&display=swap" rel="stylesheet">
<style>
/* Chronicle Design Heritage (DESIGN.md) — KoreaAPI 계보 · 시그니처 블루-틸 */
:root{
  --bg:#06141b; --glow:#0a2e3d; --line:#1e3a47;
  --ink:#eaf4f7; --mut:#9fb8c4; --dim:#6e8794;
  --accent:#3bcfe4; --accent2:#1899c2; --blue:#5fa8f5;
  --ok:#10b981; --warn:#f59e0b; --bad:#ef4444;
  --glass:linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  --gbord:rgba(255,255,255,.14);
  --blur:saturate(170%) blur(18px);
  --gshadow:0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background-color:var(--bg);color:var(--ink);
  font:16px/1.65 'Montserrat','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif;
  background-image:radial-gradient(1100px 520px at 50% -160px, var(--glow) 0%, transparent 58%);
  background-attachment:fixed}
main{max-width:980px;margin:0 auto;padding:44px 20px 72px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.86em;background:rgba(59,207,228,.08);border:1px solid rgba(59,207,228,.2);border-radius:6px;padding:1px 6px;word-break:break-all}
.brand{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.mark-tile{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  background:var(--glass);border:1px solid var(--gbord);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
.mark{width:26px;height:26px}
.brand h1{font-size:30px;font-weight:800;letter-spacing:-.02em;
  background:linear-gradient(90deg,var(--accent),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
.brand .sub{color:var(--dim);font-size:12.5px;letter-spacing:.2em}
.tagline{margin-top:14px;color:var(--mut);max-width:660px}
.tagline b{color:var(--ink)}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.pill{display:inline-block;font-size:12.5px;padding:4px 12px;border-radius:999px;color:var(--mut);
  background:var(--glass);border:1px solid var(--gbord);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
.pill-key{color:var(--accent);border-color:rgba(59,207,228,.35)}
.pill-ok{color:var(--ok);border-color:rgba(16,185,129,.4)}
.pill-wait{color:var(--warn);border-color:rgba(245,158,11,.35)}
.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:34px 0 6px}
.totals .stat{background:var(--glass);border:1px solid var(--gbord);border-radius:18px;padding:16px 18px;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
.stat b{display:block;font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--ink)}
.stat span{color:var(--mut);font-size:13px}
.section{margin:46px 0 14px}
.section .en{display:block;color:var(--dim);font-size:11.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.section h2{font-size:20px;font-weight:800;letter-spacing:-.01em;color:var(--ink)}
.card{background:var(--glass);border:1px solid var(--gbord);border-left:3px solid var(--accent);border-radius:18px;
  padding:20px 22px;margin:14px 0;backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
.card-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.card-head h3{font-size:17px;font-weight:700}
.src-id{font-family:var(--mono);font-size:12.5px;color:var(--dim)}
.stat-row{display:flex;gap:26px;margin:14px 0 10px;flex-wrap:wrap}
.stat-row b{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}
.stat-row span{display:block;color:var(--mut);font-size:12.5px}
.hash-line{margin:8px 0 2px;color:var(--mut);font-size:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.muted{color:var(--dim);font-size:13.5px}
.events{list-style:none;margin:12px 0 4px;border-top:1px dashed var(--line)}
.events li{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:14px;flex-wrap:wrap}
.ev{font-size:11.5px;padding:2px 8px;border-radius:999px;letter-spacing:.06em;flex-shrink:0}
.ev-new{color:var(--accent);border:1px solid rgba(59,207,228,.4)}
.ev-chg{color:var(--blue);border:1px solid rgba(95,168,245,.4)}
.ev-del{color:var(--bad);border:1px solid rgba(239,68,68,.4)}
.field{color:var(--dim);font-family:var(--mono);font-size:12.5px}
.when{margin-left:auto;color:var(--dim);font-size:12.5px;font-variant-numeric:tabular-nums}
.links{display:flex;gap:14px;margin-top:12px;font-size:13.5px;flex-wrap:wrap}
.note{background:var(--glass);border:1px solid var(--gbord);border-left:3px solid var(--accent);border-radius:12px;
  padding:12px 16px;color:var(--mut);font-size:14.5px;margin:10px 0 14px;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
pre{background:rgba(3,12,17,.7);border:1px solid var(--gbord);border-radius:12px;padding:14px 16px;overflow-x:auto;
  font-family:var(--mono);font-size:13px;line-height:1.7;color:#bfe3ee;margin:10px 0;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
footer{margin-top:56px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:13px;display:flex;gap:14px;flex-wrap:wrap}
</style>
<script type="application/ld+json">
${renderJsonLd(sources, repo)}
</script>
</head>
<body>
<main>
<header>
  <div class="brand">
    <span class="mark-tile">${MARK_SVG}</span>
    <h1>CHRONICLE</h1>
    <span class="sub">시간해자 크로니클</span>
  </div>
  <p class="tagline"><b>오늘 기록하지 않으면 영원히 살 수 없는 것</b>에 크론을 걸고,
  해시체인으로 <b>"먼저·진짜로 기록했다"</b>를 증명한다. 원장은 append-only —
  기관이 조용히 고치거나 내려도, 여기엔 남는다.</p>
  <div class="badges">
    <span class="pill pill-key">① SHA-256 해시체인</span>
    <span class="pill pill-key">② 커밋 히스토리 공증</span>
    <span class="pill pill-key">③ RFC 3161 외부 앵커</span>
    <span class="pill">append-only</span>
    <span class="pill">원본 무가공 보존</span>
  </div>
</header>

<div class="totals">
  <div class="stat"><b>${totalEvents.toLocaleString("ko-KR")}</b><span>봉인된 이벤트</span></div>
  <div class="stat"><b>${totalRecords.toLocaleString("ko-KR")}</b><span>추적 중인 레코드</span></div>
  <div class="stat"><b>${sources.length}</b><span>가동 소스</span></div>
  <div class="stat"><b>${escapeHtml(lastUpdated.slice(0, 10))}</b><span>최신 관측</span></div>
</div>

<div class="section"><span class="en">Live Sources</span><h2>가동 소스</h2></div>
${cards}

<div class="section"><span class="en">Consume</span><h2>구독 · 질의 · 리포트</h2></div>
<p class="note">흩어진 ${sources.length}개 원장이 아니라 <b>하나의 자산</b> — 전 소스를 한 번에 구독·질의·요약한다.</p>
<nav class="links">
  <a href="./feed.xml">통합 인텔리전스 피드 (Atom)</a>
  <a href="./digest.html">주간 다이제스트</a>
  <a href="./status.json">기계 매니페스트 (status.json)</a>
  <a href="./llms.txt">llms.txt</a>
</nav>
<p class="note">에이전트는 떠가지 않고 <b>질의</b>한다 — MCP 서버(chronicle-mcp)로 엔티티 이력·변경 스트림·체인 검증을 호출한다.
<code>npx tsx mcp/server.ts</code> · 도구: list_sources · get_history · get_changes · verify_source</p>

<div class="section"><span class="en">Verify</span><h2>직접 검증하기</h2></div>
<p class="note">이 원장은 신뢰를 요구하지 않는다 — <a href="./verify.html"><b>브라우저에서 클릭 한 번으로 재검증 →</b></a>
당신의 브라우저가 공개 원장을 받아 제네시스부터 해시체인을 다시 계산한다(무설치·무신뢰). 또는 로컬에서:</p>
<pre>git clone https://github.com/${escapeHtml(repo)}.git &amp;&amp; cd ${escapeHtml(repo.split("/")[1] ?? "repo")}
npm ci &amp;&amp; npm run verify -- --all     # 전 소스 해시체인을 제네시스부터 전수 재계산</pre>
<p class="note">외부 앵커(제3자 공증)는 openssl만으로 검증된다 — 리포 소유자도 위조할 수 없는 층.</p>
<pre>openssl ts -reply -in data/&lt;source&gt;/anchors/&lt;ts&gt;.tsr -text   # 서명 시각·다이제스트 확인
openssl ts -verify -digest &lt;chain_hash&gt; -in &lt;ts&gt;.tsr -CAfile cacert.pem</pre>

<footer>
  <a href="https://github.com/${escapeHtml(repo)}">GitHub</a>
  <a href="https://github.com/${escapeHtml(repo)}/blob/main/PLAN.md">스펙 (PLAN.md)</a>
  <a href="https://github.com/${escapeHtml(repo)}/blob/main/README.md">산출물 계약</a>
  <a href="https://github.com/${escapeHtml(repo)}/blob/main/DESIGN.md">디자인 헤리티지</a>
  <a href="./llms.txt">llms.txt</a>
  <span>1 엔진 + 19 어댑터 · a kwangdol-star project</span>
</footer>
</main>
</body>
</html>
`;
}

export function renderLlms(sources: SiteSource[], repo: string): string {
  const lines: string[] = [
    "# Chronicle — 시간해자 크로니클",
    "",
    "> Append-only notarized ledgers of ephemeral Korean market data. Each change event is",
    "> sealed in a SHA-256 hash chain, notarized by git commit history, and externally",
    "> anchored via RFC 3161 timestamps — the ledger proves *when* something was observed.",
    "",
    "Contract: one line of changes.jsonl = {observed_at, entity_id, field, before, after,",
    "source_url, content_hash, chain_hash}. Record creation/deletion uses field=__record__.",
    "Raw responses are preserved verbatim under snapshots/.",
    "",
    "## Aggregate surfaces (all sources at once)",
    "",
    `- unified feed (Atom, newest first, source-tagged): https://raw.githubusercontent.com/${repo}/main/docs/feed.xml`,
    `- weekly digest (vanished/edited highlights): https://raw.githubusercontent.com/${repo}/main/docs/digest.md`,
    `- machine manifest (source list + stats): https://raw.githubusercontent.com/${repo}/main/docs/status.json`,
    "",
    "## Query instead of scrape (MCP)",
    "",
    "chronicle-mcp is a stdio JSON-RPC 2.0 server — agents call it rather than crawling the ledger.",
    "Tools: list_sources · get_record(source, entity_id) · get_history(source, entity_id) ·",
    "get_changes(source, since?, until?, field?, limit?) · verify_source(source).",
    `Run: \`npx tsx mcp/server.ts\` (set CHRONICLE_REPO=${repo} to query the public ledger remotely).`,
    "",
    "## Sources",
    "",
  ];
  for (const source of sources) {
    const raw = `https://raw.githubusercontent.com/${repo}/main/data/${source.id}`;
    lines.push(
      `### ${source.id} — ${source.title}`,
      `- events: ${source.chainLength}, records: ${source.records}, last observed: ${source.updatedAt}`,
      `- ledger (append-only): ${raw}/changes.jsonl`,
      `- current state: ${raw}/latest.json`,
      `- chain state: ${raw}/integrity.json`,
      `- atom feed: ${raw}/feed.xml`,
      "",
    );
  }
  lines.push(
    "## Verify",
    "",
    "Recompute the whole chain from genesis: `npm run verify -- --all` in the repo.",
    `Spec: https://github.com/${repo}/blob/main/PLAN.md · Contract: https://github.com/${repo}/blob/main/README.md`,
    "",
  );
  return lines.join("\n");
}

export function writeSite(root: string, dataDir: string, repo: string): { htmlPath: string; llmsPath: string } {
  const docsDir = join(root, "docs");
  mkdirSync(docsDir, { recursive: true });
  const sources = gatherSources(root, dataDir);
  const htmlPath = join(docsDir, "index.html");
  const llmsPath = join(docsDir, "llms.txt");
  writeFileSync(htmlPath, renderHtml(sources, repo));
  writeFileSync(llmsPath, renderLlms(sources, repo));
  // 기계 판독 현황 매니페스트 — chronicle-mcp의 원격 원장이 소스 목록을 읽는 곳,
  // 겸 공개 상태 API. 결정적(data/만으로 생성).
  writeFileSync(
    join(docsDir, "status.json"),
    `${JSON.stringify(
      sources.map((source) => ({
        source_id: source.id,
        title: source.title,
        records: source.records,
        events: source.chainLength,
        chain_head: source.chainHead,
        updated_at: source.updatedAt,
        anchors: source.anchors,
        head_anchored: source.headAnchored,
      })),
      null,
      2,
    )}\n`,
  );
  // 통합 인텔리전스 피드 — 전 소스를 하나의 구독 가능한 Atom 스트림으로.
  const aggEntries: AggregateEntry[] = [];
  for (const source of sources) {
    const lines = readChangeLines(sourcePaths(dataDir, source.id));
    for (const line of lines.slice(-AGG_PER_SOURCE)) {
      try {
        aggEntries.push({ sourceId: source.id, title: source.title, event: JSON.parse(line) as ChangeEvent });
      } catch {
        /* 손상 라인은 건너뜀 (무결성 검증은 verify가 담당) */
      }
    }
  }
  writeFileSync(join(docsDir, "feed.xml"), buildAggregateFeed(repo, aggEntries));
  // 공개 검증 페이지 — 방문자 브라우저가 Web Crypto로 원장을 직접 재검증(무설치·무신뢰).
  writeFileSync(join(docsDir, "verify.html"), renderVerifyPage(repo));
  // GitHub Pages의 Jekyll 처리를 통째로 우회 — 우리는 완성된 정적 파일만 서빙한다
  writeFileSync(join(docsDir, ".nojekyll"), "");
  return { htmlPath, llmsPath };
}

const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { values } = parseArgs({
    allowPositionals: true,
    options: { "data-dir": { type: "string" }, root: { type: "string" }, repo: { type: "string" } },
  });
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "kwangdol-star/aiagentlabs";
  const { htmlPath, llmsPath } = writeSite(root, dataDir, repo);
  console.log(`site: ${htmlPath}, ${llmsPath}`);
}
