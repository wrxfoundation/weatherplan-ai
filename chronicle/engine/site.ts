/**
 * 공개 프론트뷰 생성 — docs/index.html + docs/llms.txt (GitHub Pages용).
 *
 * KoreaAPI 헤리티지(다크 그라운드 · 필드 도시어 · 검증 언어 · llms.txt ·
 * JSON-LD)를 잇되, 액센트는 블루·청록. 사람에게는 현황판을, 에이전트에게는
 * llms.txt와 Schema.org Dataset을 준다.
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
import { collectStatus } from "./status.js";
import { readChangeLines, sourcePaths } from "./store.js";
import { RECORD_FIELD, type ChangeEvent } from "./types.js";

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
    <a href="${blob}/changes.jsonl">원장</a><a href="${blob}/latest.json">현재 상태</a><a href="${blob}/feed.xml">피드</a><a href="${blob}/integrity.json">체인</a>${source.anchors > 0 ? `<a href="https://github.com/${repo}/tree/main/data/${source.id}/anchors">앵커 증서</a>` : ""}
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
<style>
:root{
  --bg:#071019; --panel:#0c1a29; --panel-2:#0a1622; --line:rgba(96,165,250,.16);
  --ink:#e6edf3; --sub:#8ba3b8; --teal:#2dd4bf; --blue:#60a5fa; --deep:#0e7490;
  --ok:#34d399; --warn:#fbbf24; --del:#f87171; --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:16px/1.65 "Pretendard Variable",Pretendard,-apple-system,"Noto Sans KR",system-ui,sans-serif;
  background-image:radial-gradient(1200px 500px at 70% -10%,rgba(14,116,144,.22),transparent 60%),radial-gradient(900px 400px at 10% 0,rgba(96,165,250,.10),transparent 55%)}
main{max-width:980px;margin:0 auto;padding:56px 20px 80px}
a{color:var(--teal);text-decoration:none}a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.86em;background:rgba(45,212,191,.08);border:1px solid rgba(45,212,191,.18);border-radius:6px;padding:1px 6px;word-break:break-all}
.brand{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.brand h1{font-size:30px;letter-spacing:.12em;background:linear-gradient(90deg,var(--blue),var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent}
.brand .beta{color:var(--sub);font-size:13px;letter-spacing:.2em}
.tagline{margin-top:10px;color:var(--sub);max-width:640px}
.tagline b{color:var(--ink)}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.pill{display:inline-block;font-size:12.5px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);color:var(--sub);background:rgba(12,26,41,.6)}
.pill-ok{color:var(--ok);border-color:rgba(52,211,153,.35)}
.pill-wait{color:var(--warn);border-color:rgba(251,191,36,.3)}
.pill-key{color:var(--teal);border-color:rgba(45,212,191,.35)}
.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:32px 0 8px}
.totals .stat{background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.stat b{display:block;font-size:26px;font-variant-numeric:tabular-nums;color:var(--ink)}
.stat span{color:var(--sub);font-size:13px}
h2{margin:44px 0 14px;font-size:20px;color:var(--ink)}
h2 .en{color:var(--sub);font-weight:400;font-size:13px;letter-spacing:.15em;margin-left:10px}
.card{background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid var(--line);border-left:3px solid var(--teal);border-radius:12px;padding:20px 22px;margin:14px 0}
.card-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.card-head h3{font-size:17px}
.src-id{font-family:var(--mono);font-size:12.5px;color:var(--blue)}
.stat-row{display:flex;gap:26px;margin:14px 0 10px;flex-wrap:wrap}
.stat-row b{font-size:22px;font-variant-numeric:tabular-nums}
.stat-row span{display:block;color:var(--sub);font-size:12.5px}
.hash-line{margin:8px 0 2px;color:var(--sub);font-size:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.muted{color:var(--sub);font-size:13.5px}
.events{list-style:none;margin:12px 0 4px;border-top:1px dashed var(--line)}
.events li{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:14px;flex-wrap:wrap}
.ev{font-size:11.5px;padding:2px 8px;border-radius:999px;letter-spacing:.06em;flex-shrink:0}
.ev-new{color:var(--teal);border:1px solid rgba(45,212,191,.35)}
.ev-chg{color:var(--blue);border:1px solid rgba(96,165,250,.35)}
.ev-del{color:var(--del);border:1px solid rgba(248,113,113,.35)}
.field{color:var(--sub);font-family:var(--mono);font-size:12.5px}
.when{margin-left:auto;color:var(--sub);font-size:12.5px;font-variant-numeric:tabular-nums}
.links{display:flex;gap:14px;margin-top:12px;font-size:13.5px;flex-wrap:wrap}
pre{background:#050b12;border:1px solid var(--line);border-radius:10px;padding:14px 16px;overflow-x:auto;font-family:var(--mono);font-size:13px;line-height:1.7;color:#bcd3e6}
.verify p{color:var(--sub);font-size:14.5px;margin:8px 0}
footer{margin-top:56px;padding-top:18px;border-top:1px solid var(--line);color:var(--sub);font-size:13px;display:flex;gap:14px;flex-wrap:wrap}
</style>
<script type="application/ld+json">
${renderJsonLd(sources, repo)}
</script>
</head>
<body>
<main>
<header>
  <div class="brand"><h1>CHRONICLE</h1><span class="beta">시간해자 크로니클</span></div>
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

<h2>가동 소스<span class="en">LIVE SOURCES</span></h2>
${cards}

<h2>직접 검증하기<span class="en">VERIFY</span></h2>
<section class="verify">
<p>이 원장은 신뢰를 요구하지 않는다 — 아래 두 단계로 누구나 재계산할 수 있다.</p>
<pre>git clone https://github.com/${escapeHtml(repo)}.git &amp;&amp; cd ${escapeHtml(repo.split("/")[1] ?? "repo")}
npm ci &amp;&amp; npm run verify -- --all     # 전 소스 해시체인을 제네시스부터 전수 재계산</pre>
<p>외부 앵커(제3자 공증)는 openssl만으로 검증된다 — 리포 소유자도 위조할 수 없는 층:</p>
<pre>openssl ts -reply -in data/&lt;source&gt;/anchors/&lt;ts&gt;.tsr -text   # 서명 시각·다이제스트 확인
openssl ts -verify -digest &lt;chain_hash&gt; -in &lt;ts&gt;.tsr -CAfile cacert.pem</pre>
</section>

<footer>
  <a href="https://github.com/${escapeHtml(repo)}">GitHub</a>
  <a href="https://github.com/${escapeHtml(repo)}/blob/main/PLAN.md">스펙 (PLAN.md)</a>
  <a href="https://github.com/${escapeHtml(repo)}/blob/main/README.md">산출물 계약</a>
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
