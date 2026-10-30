/**
 * CLI: npm run digest [-- --since <days>] [--data-dir <path>] [--root <path>] [--json]
 *
 * 12개 원장을 가로질러 "무엇이 사라지고·바뀌고·태어났나 + 3중 공증"을 한 장의
 * 투자-가독 리포트로 뽑는다. 소멸(지금 찍은 자만 소유)·조용한 수정을 전면에 세우는
 * 게 핵심 — 축적물의 "so what"을 언론·투자자에게 증명하는 표면.
 *
 * 원장(changes.jsonl)은 무가공 사실만 담는다. 다이제스트는 그 위의 읽기 전용
 * 집계라 원장을 절대 수정하지 않는다(공증 무결성 보존).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { collectStatus } from "./status.js";
import { readChangeLines, sourcePaths } from "./store.js";
import { RECORD_FIELD, type ChangeEvent } from "./types.js";
import { listSourceDirs } from "./verify.js";

export interface DigestEvent {
  source: string;
  entityId: string;
  field: string;
  before: unknown;
  after: unknown;
  observedAt: string;
}

export interface SourceRollup {
  source: string;
  entities: number;
  chainLength: number;
  updatedAt: string;
  headAnchored: boolean;
  bornRecent: number;
  vanishedRecent: number;
  editedRecent: number;
}

export interface Digest {
  generatedAt: string;
  sinceDays: number;
  since: string;
  totals: {
    sources: number;
    entities: number;
    chainLength: number;
    eventsAllTime: number;
    eventsRecent: number;
    bornRecent: number;
    vanishedRecent: number;
    editedRecent: number;
  };
  trust: { sourcesWithChain: number; headsAnchored: number };
  perSource: SourceRollup[];
  vanished: DigestEvent[]; // 소멸 — 가장 값진 신호
  edited: DigestEvent[]; // 조용한 수정
  vanishedTruncated: number;
  editedTruncated: number;
}

const NOTABLE_CAP = 25;

function classify(event: ChangeEvent): "born" | "vanished" | "edited" {
  if (event.field === RECORD_FIELD) return event.after === null ? "vanished" : "born";
  return "edited";
}

/** before/after 요약 — 스칼라는 값, 레코드(fields 객체)는 대표 라벨. 길면 자른다. */
export function summarize(value: unknown, max = 140): string {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "string") return value.length > max ? `${value.slice(0, max)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // 레코드 필드 객체 — 사람이 읽을 대표 필드 우선
    for (const key of ["title", "text", "name", "question", "lab", "model", "version"]) {
      if (typeof obj[key] === "string" && obj[key]) return summarize(obj[key], max);
    }
    let json: string;
    try {
      json = JSON.stringify(value) ?? "[값]";
    } catch {
      return "[직렬화 불가]"; // 순환/비직렬화 객체 방어(원장 데이터에선 도달 불가하나 안전판)
    }
    return json.length > max ? `${json.slice(0, max)}…` : json;
  }
  return String(value);
}

export function buildDigest(dataDir: string, opts: { sinceDays?: number; now?: Date } = {}): Digest {
  const sinceDays = opts.sinceDays ?? 30;
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - sinceDays * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  const statuses = collectStatus(dataDir);
  const statusById = new Map(statuses.map((s) => [s.source_id, s]));

  const vanished: DigestEvent[] = [];
  const edited: DigestEvent[] = [];
  const perSource: SourceRollup[] = [];
  let eventsAllTime = 0;
  let bornRecentTotal = 0;

  for (const source of listSourceDirs(dataDir)) {
    const paths = sourcePaths(dataDir, source);
    const lines = readChangeLines(paths);
    eventsAllTime += lines.length;
    let born = 0;
    let vanishedCount = 0;
    let editedCount = 0;
    for (const line of lines) {
      let event: ChangeEvent;
      try {
        event = JSON.parse(line) as ChangeEvent;
      } catch {
        continue; // 손상된 줄은 집계에서 무시(원장 검증은 verify가 담당)
      }
      if (event.observed_at < cutoffIso) continue; // 기간 밖
      const kind = classify(event);
      const de: DigestEvent = { source, entityId: event.entity_id, field: event.field, before: event.before, after: event.after, observedAt: event.observed_at };
      if (kind === "born") born++;
      else if (kind === "vanished") {
        vanishedCount++;
        vanished.push(de);
      } else {
        editedCount++;
        edited.push(de);
      }
    }
    bornRecentTotal += born;
    const st = statusById.get(source);
    perSource.push({
      source,
      entities: st?.records ?? 0,
      chainLength: st?.chain_length ?? 0,
      updatedAt: st?.updated_at ?? "-",
      headAnchored: st?.head_anchored ?? false,
      bornRecent: born,
      vanishedRecent: vanishedCount,
      editedRecent: editedCount,
    });
  }

  // 최신순 정렬, 소멸을 먼저(가장 값진 신호)
  const byRecent = (a: DigestEvent, b: DigestEvent) => (a.observedAt < b.observedAt ? 1 : a.observedAt > b.observedAt ? -1 : 0);
  vanished.sort(byRecent);
  edited.sort(byRecent);

  return {
    generatedAt: now.toISOString(),
    sinceDays,
    since: cutoffIso,
    totals: {
      sources: perSource.length,
      entities: perSource.reduce((n, s) => n + s.entities, 0),
      chainLength: perSource.reduce((n, s) => n + s.chainLength, 0),
      eventsAllTime,
      eventsRecent: vanished.length + edited.length + bornRecentTotal,
      bornRecent: bornRecentTotal,
      vanishedRecent: vanished.length,
      editedRecent: edited.length,
    },
    trust: {
      sourcesWithChain: statuses.filter((s) => s.chain_length > 0).length,
      headsAnchored: statuses.filter((s) => s.head_anchored).length,
    },
    perSource,
    vanished: vanished.slice(0, NOTABLE_CAP),
    edited: edited.slice(0, NOTABLE_CAP),
    vanishedTruncated: Math.max(0, vanished.length - NOTABLE_CAP),
    editedTruncated: Math.max(0, edited.length - NOTABLE_CAP),
  };
}

export function renderDigestMarkdown(d: Digest): string {
  const day = d.generatedAt.slice(0, 10);
  const L: string[] = [];
  L.push(`# Chronicle 다이제스트 — ${day}`);
  L.push("");
  L.push(`> 최근 ${d.sinceDays}일(${d.since.slice(0, 10)}~) 관측. 시간해자 아카이브의 축적물 요약.`);
  L.push("");
  L.push("## 한눈에");
  L.push(`- 소스 **${d.totals.sources}개** · 추적 엔티티 **${d.totals.entities.toLocaleString()}** · 원장 총 이벤트 **${d.totals.eventsAllTime.toLocaleString()}** · 체인 총 길이 **${d.totals.chainLength.toLocaleString()}**`);
  L.push(`- 이번 기간: 소멸 **${d.totals.vanishedRecent}** · 수정 **${d.totals.editedRecent}** · 신규 **${d.totals.bornRecent.toLocaleString()}**`);
  L.push(`- **3중 공증**: 해시체인 ${d.trust.sourcesWithChain}/${d.totals.sources} 소스 봉인 · git 히스토리 · TSA 외부앵커 **${d.trust.headsAnchored}/${d.totals.sources}** 머리 고정`);
  L.push("");

  L.push("## 사라진 것 — 소멸 (지금 찍은 자만 소유)");
  if (d.vanished.length === 0) L.push("_이번 기간 소멸 없음._");
  else {
    for (const e of d.vanished) L.push(`- \`${e.source}\` **${e.entityId}** — ${summarize(e.before)} _(${e.observedAt.slice(0, 10)})_`);
    if (d.vanishedTruncated > 0) L.push(`- …외 ${d.vanishedTruncated}건 더 (원장 changes.jsonl에 전량 보존)`);
  }
  L.push("");

  L.push("## 바뀐 것 — 조용한 수정");
  if (d.edited.length === 0) L.push("_이번 기간 필드 변경 없음._");
  else {
    for (const e of d.edited) L.push(`- \`${e.source}\` **${e.entityId}** · ${e.field}: ${summarize(e.before, 80)} → ${summarize(e.after, 80)} _(${e.observedAt.slice(0, 10)})_`);
    if (d.editedTruncated > 0) L.push(`- …외 ${d.editedTruncated}건 더 (원장 changes.jsonl에 전량 보존)`);
  }
  L.push("");

  L.push("## 소스별 현황");
  L.push("| 소스 | 엔티티 | 체인 | 최신 | 앵커 | 신규 | 소멸 | 수정 |");
  L.push("| --- | ---: | ---: | --- | :---: | ---: | ---: | ---: |");
  for (const s of d.perSource) {
    L.push(`| ${s.source} | ${s.entities.toLocaleString()} | ${s.chainLength.toLocaleString()} | ${s.updatedAt.slice(0, 10)} | ${s.headAnchored ? "⚓" : "—"} | ${s.bornRecent.toLocaleString()} | ${s.vanishedRecent} | ${s.editedRecent} |`);
  }
  L.push("");
  L.push(`_생성 ${d.generatedAt} · 무결성 검증은 \`npm run verify\`, 재현은 각 소스 snapshots/ 원본._`);
  L.push("");
  return L.join("\n");
}

function esc(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "\uFFFD")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * 다이제스트를 투자자용 폴리시드 HTML로 렌더한다 — 통합 피드와 짝을 이루는 "한 장".
 * site.ts와 같은 디자인 헤리티지(리퀴드 글래스·시그니처 블루틸·정적 글로우·Montserrat).
 * 소멸(지금 찍은 자만 소유)과 조용한 수정을 전면에 세운다.
 */
export function renderDigestHtml(d: Digest, repo: string): string {
  const day = esc(d.generatedAt.slice(0, 10));
  const evLi = (list: DigestEvent[], kind: "del" | "chg"): string =>
    list
      .map((e) => {
        const body =
          kind === "del"
            ? esc(summarize(e.before, 100))
            : `${esc(summarize(e.before, 60))} <span class="arr">→</span> ${esc(summarize(e.after, 60))}`;
        const field = kind === "chg" ? ` <span class="field">${esc(e.field)}</span>` : "";
        return `<li><span class="src">${esc(e.source)}</span><code>${esc(e.entityId)}</code>${field}<span class="body">${body}</span><span class="when">${esc(e.observedAt.slice(0, 10))}</span></li>`;
      })
      .join("\n");

  const rows = d.perSource
    .map(
      (s) =>
        `<tr><td>${esc(s.source)}</td><td class="n">${s.entities.toLocaleString("ko-KR")}</td><td class="n">${s.chainLength.toLocaleString("ko-KR")}</td><td>${esc(s.updatedAt.slice(0, 10))}</td><td class="c">${s.headAnchored ? "⚓" : "—"}</td><td class="n">${s.bornRecent.toLocaleString("ko-KR")}</td><td class="n">${s.vanishedRecent}</td><td class="n">${s.editedRecent}</td></tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chronicle 다이제스트 — ${day}</title>
<meta name="description" content="시간해자 크로니클 다이제스트 — 최근 ${d.sinceDays}일 전 소스가 잡은 소멸·수정·신규. 무엇이 사라졌고 조용히 바뀌었나.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&display=swap" rel="stylesheet">
<style>
:root{--bg:#06141b;--glow:#0a2e3d;--line:#1e3a47;--ink:#eaf4f7;--mut:#9fb8c4;--dim:#6e8794;
  --accent:#3bcfe4;--blue:#5fa8f5;--bad:#ef4444;--ok:#10b981;
  --glass:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02));--gbord:rgba(255,255,255,.14);
  --blur:saturate(170%) blur(18px);--gshadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background-color:var(--bg);color:var(--ink);
  font:16px/1.65 'Montserrat','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif;
  background-image:radial-gradient(1100px 520px at 50% -160px,var(--glow) 0%,transparent 58%);background-attachment:fixed}
main{max-width:940px;margin:0 auto;padding:44px 20px 72px}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.82em;background:rgba(59,207,228,.08);border:1px solid rgba(59,207,228,.2);border-radius:6px;padding:1px 6px;word-break:break-all}
.eyebrow{color:var(--dim);font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-top:8px;
  background:linear-gradient(90deg,var(--accent),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
.period{color:var(--mut);margin-top:8px;font-size:14.5px}
.totals{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:28px 0 6px}
.tile{background:var(--glass);border:1px solid var(--gbord);border-radius:16px;padding:15px 17px;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
.tile b{display:block;font-size:24px;font-weight:800;font-variant-numeric:tabular-nums}
.tile span{color:var(--mut);font-size:12.5px}
.tile.hot{border-left:3px solid var(--bad)}
.tile.hot b{color:#ff8080}
.section{margin:40px 0 12px}
.section h2{font-size:19px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:9px}
.section .dot{width:9px;height:9px;border-radius:50%}
.dot-del{background:var(--bad)}.dot-chg{background:var(--blue)}
.lead{color:var(--mut);font-size:14px;margin:2px 0 10px}
ul.ev{list-style:none;background:var(--glass);border:1px solid var(--gbord);border-radius:16px;overflow:hidden;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);box-shadow:var(--gshadow)}
ul.ev li{display:flex;align-items:baseline;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.05);font-size:13.5px;flex-wrap:wrap}
ul.ev li:last-child{border-bottom:none}
.src{font-size:11px;color:var(--accent);border:1px solid rgba(59,207,228,.35);border-radius:999px;padding:1px 8px;flex-shrink:0}
.body{color:var(--mut);flex:1;min-width:200px}
.field{color:var(--dim);font-family:var(--mono);font-size:12px}
.arr{color:var(--accent)}
.when{color:var(--dim);font-size:12px;font-variant-numeric:tabular-nums;margin-left:auto}
.empty{color:var(--dim);padding:14px 16px;background:var(--glass);border:1px solid var(--gbord);border-radius:16px}
.more{color:var(--dim);font-size:12.5px;padding:8px 16px}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px;
  background:var(--glass);border:1px solid var(--gbord);border-radius:16px;overflow:hidden;
  backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur)}
th,td{padding:9px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.05)}
th{color:var(--dim);font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
td.n{text-align:right;font-variant-numeric:tabular-nums}td.c{text-align:center}
tr:last-child td{border-bottom:none}
footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:13px;display:flex;gap:16px;flex-wrap:wrap}
</style>
</head>
<body>
<main>
<header>
  <span class="eyebrow">Chronicle · 시간해자 크로니클</span>
  <h1>다이제스트 — ${day}</h1>
  <p class="period">최근 <b>${d.sinceDays}일</b>(${esc(d.since.slice(0, 10))}~) · 원장 위의 읽기 전용 집계 · <b>소멸</b>은 지금 찍은 자만 소유한다</p>
</header>

<div class="totals">
  <div class="tile"><b>${d.totals.sources}</b><span>가동 소스</span></div>
  <div class="tile"><b>${d.totals.entities.toLocaleString("ko-KR")}</b><span>추적 엔티티</span></div>
  <div class="tile"><b>${d.totals.eventsAllTime.toLocaleString("ko-KR")}</b><span>봉인 이벤트(누적)</span></div>
  <div class="tile hot"><b>${d.totals.vanishedRecent.toLocaleString("ko-KR")}</b><span>소멸(기간)</span></div>
  <div class="tile"><b>${d.totals.editedRecent.toLocaleString("ko-KR")}</b><span>수정(기간)</span></div>
  <div class="tile"><b>${d.trust.headsAnchored}/${d.totals.sources}</b><span>TSA 외부앵커</span></div>
</div>

<div class="section"><h2><span class="dot dot-del"></span>사라진 것 — 소멸</h2></div>
<p class="lead">기관이 조용히 내렸지만, 여기엔 남는다. 지금 찍은 자만 소유하는 신호.</p>
${d.vanished.length ? `<ul class="ev">\n${evLi(d.vanished, "del")}\n${d.vanishedTruncated > 0 ? `<li class="more">…외 ${d.vanishedTruncated}건 (원장에 전량 보존)</li>` : ""}</ul>` : '<p class="empty">이번 기간 소멸 없음.</p>'}

<div class="section"><h2><span class="dot dot-chg"></span>바뀐 것 — 조용한 수정</h2></div>
<p class="lead">before → after. 문구 삭제·상태 전환·가격 변경을 원장이 봉인했다.</p>
${d.edited.length ? `<ul class="ev">\n${evLi(d.edited, "chg")}\n${d.editedTruncated > 0 ? `<li class="more">…외 ${d.editedTruncated}건 (원장에 전량 보존)</li>` : ""}</ul>` : '<p class="empty">이번 기간 필드 변경 없음.</p>'}

<div class="section"><h2>소스별 현황</h2></div>
<table>
<thead><tr><th>소스</th><th>엔티티</th><th>체인</th><th>최신</th><th>앵커</th><th>신규</th><th>소멸</th><th>수정</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>

<footer>
  <a href="./index.html">현황판</a>
  <a href="./feed.xml">통합 피드</a>
  <a href="./digest.md">마크다운</a>
  <a href="https://github.com/${esc(repo)}">GitHub</a>
  <span>무결성 검증: npm run verify · 재현: 각 소스 snapshots/</span>
</footer>
</main>
</body>
</html>
`;
}

const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { values } = parseArgs({
    allowPositionals: true,
    options: {
      since: { type: "string" },
      "data-dir": { type: "string" },
      root: { type: "string" },
      json: { type: "boolean", default: false },
      out: { type: "string" },
      repo: { type: "string" },
    },
  });
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "kwangdol-star/aiagentlabs";
  const sinceDays = values.since ? Number(values.since) : 30;
  const digest = buildDigest(dataDir, { sinceDays });

  if (values.json) {
    console.log(JSON.stringify(digest, null, 2));
  } else {
    const outPath = values.out ? resolve(values.out) : join(root, "docs", "digest.md");
    const docsDir = dirname(outPath);
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
    writeFileSync(outPath, renderDigestMarkdown(digest));
    // 투자자용 폴리시드 HTML (통합 피드와 짝, GitHub Pages에 게시)
    const htmlPath = join(docsDir, "digest.html");
    writeFileSync(htmlPath, renderDigestHtml(digest, repo));
    console.log(`다이제스트 작성: ${outPath} + ${htmlPath}`);
    console.log(`  소스 ${digest.totals.sources} · 엔티티 ${digest.totals.entities} · 소멸 ${digest.totals.vanishedRecent} · 수정 ${digest.totals.editedRecent} · 앵커 ${digest.trust.headsAnchored}/${digest.totals.sources}`);
  }
}
