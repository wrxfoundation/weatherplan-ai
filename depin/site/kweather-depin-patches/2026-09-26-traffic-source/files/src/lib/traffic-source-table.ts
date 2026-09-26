/**
 * 유입 소스별 일자 표 · 내려받기 (2026-09-26) - 관리자 "시스템·용량" 탭(components/admin/TrafficSources.tsx).
 *
 * 줄 = 소스(그날 방문자의 첫 입구 - lib/traffic-source.ts), 칸 = 날짜. 값은 방문자 또는 페이지뷰.
 * 한 방문자(하루 해시)는 하루에 한 소스로만 세므로 소스별 방문자를 더하면 그날 방문자와 같고,
 * 소스별 페이지뷰를 더하면 그날 페이지뷰와 같다(소스를 적기 시작한 날부터).
 * 소스를 적기 전의 방문자는 「(기록 전)」 한 줄로 모은다 - 지난 기간은 소스로 나눌 수 없다(소급 불가).
 *
 * 내려받기는 브라우저에서 만든다 - 관리자 키를 주소에 싣지 않으려고. 엑셀용(UTF-16 + 탭)과 일반 CSV(UTF-8 BOM) 두 가지.
 * 순수 계산이라 traffic-source.test.ts 가 값을 고정한다.
 */
export type SourceDayRow = { day: string; source: string | null; medium: string; campaign: string; visitors: number; pages: number };
export type Metric = "visitors" | "pages";
export type DayTotals = { page: number; api: number; bot: number; visitors: number };
export type PivotRow = { source: string; mediums: string[]; total: number; cells: number[]; quiet: boolean };
export type Pivot = { days: string[]; rows: PivotRow[]; colTotals: number[]; total: number };

export const BEFORE = "(기록 전)";
/* 우리가 움직일 수 없는 입구 - 표에서 흐리게 */
const QUIET = new Set(["(direct)", "(internal)", BEFORE]);

/** days 순서 그대로 열을 만든다(화면은 최근 날이 왼쪽). 합계 많은 순, 「(기록 전)」은 맨 아래. */
export function pivot(rows: SourceDayRow[], days: string[], metric: Metric): Pivot {
  const ix = new Map(days.map((d, i) => [d, i]));
  const by = new Map<string, { total: number; cells: number[]; med: Map<string, number> }>();
  for (const r of rows) {
    const i = ix.get(r.day);
    const v = metric === "visitors" ? r.visitors : r.pages;
    if (i === undefined || !v) continue;
    const key = r.source ?? BEFORE;
    let a = by.get(key);
    if (!a) { a = { total: 0, cells: days.map(() => 0), med: new Map() }; by.set(key, a); }
    a.total += v; a.cells[i] += v;
    if (r.source) a.med.set(r.medium || "(not set)", (a.med.get(r.medium || "(not set)") ?? 0) + v);
  }
  const out: PivotRow[] = [...by.entries()].map(([source, a]) => ({
    source, total: a.total, cells: a.cells, quiet: QUIET.has(source),
    mediums: [...a.med.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).map(([m]) => m),
  })).sort((x, y) => Number(x.source === BEFORE) - Number(y.source === BEFORE) || y.total - x.total || (x.source < y.source ? -1 : 1));
  const colTotals = days.map((_, i) => out.reduce((s, r) => s + r.cells[i], 0));
  return { days, rows: out, colTotals, total: out.reduce((s, r) => s + r.total, 0) };
}

/* ── 파일 ─────────────────────────────────────────────────────────── */
export type Table = (string | number)[][];

/** 일별 합계 - 날짜 오름차순 */
export const dailyTable = (daily: Record<string, DayTotals>): Table => [
  ["날짜", "방문자", "페이지뷰", "API 호출", "봇"],
  ...Object.keys(daily).sort().map((d) => [d, daily[d].visitors, daily[d].page, daily[d].api, daily[d].bot]),
];

/** 화면 표 그대로(파일은 날짜 오름차순) */
export const pivotTable = (p: Pivot, metric: Metric): Table => {
  const order = p.days.map((d, i) => [d, i] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return [
    [`소스 (${metric === "visitors" ? "방문자" : "페이지뷰"})`, "매체", "합계", ...order.map(([d]) => d)],
    ...p.rows.map((r) => [r.source, r.mediums.join(" · "), r.total, ...order.map(([, i]) => r.cells[i])]),
    ["합계", "", p.total, ...order.map(([, i]) => p.colTotals[i])],
  ];
};

/** 원자료 - 날짜 × 소스 × 매체 × 캠페인 한 줄씩. 날짜 오름차순, 그 안에서 방문자 많은 순 */
export const rawTable = (rows: SourceDayRow[]): Table => [
  ["날짜", "소스", "매체", "캠페인", "방문자", "페이지뷰"],
  ...[...rows]
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0) || b.visitors - a.visitors || String(a.source ?? "").localeCompare(String(b.source ?? "")))
    .map((r) => [r.day, r.source ?? BEFORE, r.medium, r.campaign, r.visitors, r.pages]),
];

const cell = (v: string | number) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** 일반 CSV - UTF-8 BOM(엑셀이 한글을 알아보게) + CRLF */
export const toCsv = (t: Table) => "﻿" + t.map((r) => r.map(cell).join(",")).join("\r\n");
/** 엑셀용 - UTF-16LE BOM + 탭. BOM 을 무시하는 엑셀·한셀에서도 한글이 깨지지 않는다 */
export const toUtf16 = (t: Table): Uint8Array => {
  const text = t.map((r) => r.map((v) => String(v ?? "").replace(/[\t\r\n]/g, " ")).join("\t")).join("\r\n");
  const out = new Uint8Array(2 + text.length * 2);
  out[0] = 0xff; out[1] = 0xfe;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); out[2 + i * 2] = c & 0xff; out[3 + i * 2] = c >> 8; }
  return out;
};
