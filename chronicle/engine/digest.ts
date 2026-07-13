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
    const json = JSON.stringify(value);
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
    },
  });
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  const sinceDays = values.since ? Number(values.since) : 30;
  const digest = buildDigest(dataDir, { sinceDays });

  if (values.json) {
    console.log(JSON.stringify(digest, null, 2));
  } else {
    const markdown = renderDigestMarkdown(digest);
    const outPath = values.out ? resolve(values.out) : join(root, "docs", "digest.md");
    if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, markdown);
    console.log(`다이제스트 작성: ${outPath}`);
    console.log(`  소스 ${digest.totals.sources} · 엔티티 ${digest.totals.entities} · 소멸 ${digest.totals.vanishedRecent} · 수정 ${digest.totals.editedRecent} · 앵커 ${digest.trust.headsAnchored}/${digest.totals.sources}`);
  }
}
