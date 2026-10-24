/* 세션 소스 × 날짜 (9/26 서우 — "일자별 세션 소스 별로 보고싶은데 아니면 rawdata 다운로드 가능하게 해줄래")

   GA 「트래픽 획득: 세션 소스」 표는 기간 합계만 보여 준다. 보조 측정기준에 날짜를 넣으면 펼쳐지지만
   행이 소스 × 날짜로 길게 늘어서서 「9/16 에 어디서 왔나」와 「pixie 는 언제 들어왔나」를 한 번에 못 본다.
   여기서는 소스를 행으로, 날짜를 열로 세운다 — GA 탐색 보고서의 자유 형식 표와 같은 모양이다.

   행 하나 = 세션 소스 하나(GA 화면과 같은 단위). 매체가 둘 이상인 소스는 한 행으로 합치고 매체는 작은
   글씨로 붙인다. 채널 색은 그 소스에서 세션이 가장 많은 매체로 매긴다(lib/traffic.ts channelOf).

   원자료(raw)는 GA Data API 가 주는 가장 잘게 쪼갠 집계다 — 날짜 × 소스 × 매체 × 캠페인 한 줄에
   세션·참여 세션·사용자·신규·이벤트·참여 시간·주요 이벤트·수익. 방문 한 건 한 건(이벤트 로그)은 GA 가
   API 로 주지 않는다. 그건 BigQuery 내보내기를 켜야 하고, 켠 날부터만 쌓인다(README).

   환경변수도 fetch 도 없다 — tools/traffic-check.mts 가 값을 고정해 두고 센다. */

import {
  CHANNEL, channelOf, dayKey, dayLabel, dayLong, weekStart, weekLabel, weekLong, type Channel,
} from "./traffic";

export type SrcRaw = {
  date: string;        // YYYYMMDD (GA 속성 시간대 = 한국)
  source: string; medium: string; campaign: string;
  sessions: number; engaged: number; users: number; newUsers: number;
  events: number;      // eventCount
  engageSec: number;   // userEngagementDuration (초, 합)
  keyEvents: number; revenue: number;
};

/* 사용자 (9/26 서우 — "엑셀 소스일자에서 사용자수로 볼 수 있는 탭을 추가하면 좋을 듯, 사용자수 기준이야")
   사용자는 세션과 달리 더할 수 없다 — 사흘 온 한 사람을 날짜별로 더하면 3명이 된다. 그래서 칸(그날 · 그 소스)은 GA 값 그대로,
   합계 열(그 소스의 기간 사용자) · 합계 줄(그날 전체 사용자) · 총계는 GA 에 따로 물어 중복을 뺀 값을 쓴다 — 칸을 더한 값보다
   작은 것이 정상이다. 주별도 같은 이유로 GA 의 ISO 주(월요일 시작) 값을 따로 받는다(week = 그 주 월요일 YYYYMMDD). */
export type SdUsers = {
  cells: { date: string; source: string; users: number }[];
  bySource: Record<string, number>;
  byDay: Record<string, number>;
  total: number;
  week?: { cells: { week: string; source: string; users: number }[]; byWeek: Record<string, number> };
};

export type SourceDaily = {
  since: string;       // GA_RAW_SINCE 원문 (YYYY-MM-DD)
  today: string;       // YYYYMMDD
  fetchedAt: number;
  rows: SrcRaw[];
  full: boolean;       // 주요 이벤트·수익 열까지 읽었는가 — GA 가 그 두 지표를 거부하면 빼고 다시 읽는다
  note?: string;       // full=false 인 까닭
  users?: SdUsers;     // 사용자 — 못 읽었으면 없다(세션 표는 그대로)
  usersNote?: string;  // 사용자(또는 주별 사용자)를 못 읽은 까닭
  error?: string;
};

export type SdGran = "day" | "week";
export type SdCol = { key: string; label: string; long: string; off: boolean };   // off = 주말
export type SdRow = { source: string; mediums: string[]; channel: Channel; total: number; engaged: number; cells: number[] };
export type SdPivot = { gran: SdGran; cols: SdCol[]; rows: SdRow[]; colTotals: number[]; total: number };

const toDate = (k: string) => new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)));
const addDays = (k: string, n: number) => {
  const d = toDate(k); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};
const isOff = (k: string) => { const w = toDate(k).getUTCDay(); return w === 0 || w === 6; };
export const ymd = (k: string) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;

/* 일 단위 표. 열은 첫 유입일부터 오늘까지 빠짐없이 — 0 인 날도 칸이 있어야 「안 들어온 날」이 보인다.
   집계 시작(GA_RAW_SINCE)이 첫 유입보다 이르면 앞쪽 빈 날은 자른다. */
export const pivotSources = (raw: SrcRaw[], sinceIso: string, today: string): SdPivot => {
  let since = dayKey(sinceIso);
  if (since > today) since = today;
  const live = raw.filter((r) => r.sessions > 0 && r.date >= since && r.date <= today);
  const first = live.reduce((a, r) => (r.date < a ? r.date : a), today);

  const cols: SdCol[] = [];
  const ix = new Map<string, number>();
  for (let k = first; k <= today; k = addDays(k, 1)) {
    ix.set(k, cols.length);
    cols.push({ key: k, label: dayLabel(k), long: dayLong(k), off: isOff(k) });
  }

  type Acc = { total: number; engaged: number; cells: number[]; med: Map<string, number> };
  const by = new Map<string, Acc>();
  for (const r of live) {
    const i = ix.get(r.date);
    if (i === undefined) continue;
    let a = by.get(r.source);
    if (!a) { a = { total: 0, engaged: 0, cells: cols.map(() => 0), med: new Map() }; by.set(r.source, a); }
    a.total += r.sessions; a.engaged += r.engaged; a.cells[i] += r.sessions;
    a.med.set(r.medium, (a.med.get(r.medium) ?? 0) + r.sessions);
  }

  const rows: SdRow[] = [...by.entries()].map(([source, a]) => {
    const mediums = [...a.med.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).map(([m]) => m);
    return { source, mediums, channel: channelOf(source, mediums[0] ?? ""), total: a.total, engaged: a.engaged, cells: a.cells };
  }).sort((x, y) => y.total - x.total || (x.source < y.source ? -1 : x.source > y.source ? 1 : 0));

  const colTotals = cols.map((_, i) => rows.reduce((s, r) => s + r.cells[i], 0));
  return { gran: "day", cols, rows, colTotals, total: rows.reduce((s, r) => s + r.total, 0) };
};

/* 주 단위 — 일 표의 열을 월요일 시작 주로 더한다. 첫 주·이번 주는 모자란 주일 수 있다. 화면(클라이언트)에서 부른다. */
export const rollWeeks = (p: SdPivot): SdPivot => {
  const cols: SdCol[] = [];
  const map: number[] = [];
  const ix = new Map<string, number>();
  for (const c of p.cols) {
    const w = weekStart(c.key);
    let i = ix.get(w);
    if (i === undefined) { i = cols.length; ix.set(w, i); cols.push({ key: w, label: weekLabel(w), long: weekLong(w), off: false }); }
    map.push(i);
  }
  const roll = (xs: number[]) => { const out = cols.map(() => 0); xs.forEach((v, j) => { out[map[j]] += v; }); return out; };
  return { gran: "week", cols, rows: p.rows.map((r) => ({ ...r, cells: roll(r.cells) })), colTotals: roll(p.colTotals), total: p.total };
};

/* GA isoYearIsoWeek("202637") → 그 ISO 주의 월요일("20260907"). 1주 = 1월 4일이 든 주. */
export const isoWeekMonday = (yw: string) => {
  const y = +yw.slice(0, 4), w = +yw.slice(4);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const d = new Date(Date.UTC(y, 0, 4 - ((jan4.getUTCDay() + 6) % 7) + (w - 1) * 7));
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

/* 세션 표(일 또는 주)와 같은 열로 사용자 표를 만든다. 줄은 사용자 기간 합계(중복 제거) 많은 순.
   매체·채널은 세션 표의 같은 소스에서 빌린다. 주별 사용자를 못 읽었으면 주 단위는 null. */
export const pivotUsers = (p: SdPivot, u: SdUsers): SdPivot | null => {
  const week = p.gran === "week";
  if (week && !u.week) return null;
  const ix = new Map(p.cols.map((c, i) => [c.key, i]));
  const base = new Map(p.rows.map((r) => [r.source, r]));
  const acc = new Map<string, number[]>();
  const cells = week
    ? (u.week?.cells ?? []).map((c) => ({ key: c.week, source: c.source, n: c.users }))
    : u.cells.map((c) => ({ key: c.date, source: c.source, n: c.users }));
  for (const c of cells) {
    const i = ix.get(c.key);
    if (i === undefined || !c.n) continue;
    let a = acc.get(c.source);
    if (!a) { a = p.cols.map(() => 0); acc.set(c.source, a); }
    a[i] += c.n;
  }
  const rows: SdRow[] = [...acc.entries()].map(([source, cs]) => {
    const b = base.get(source);
    return { source, mediums: b?.mediums ?? [], channel: b?.channel ?? channelOf(source, ""), total: u.bySource[source] ?? Math.max(...cs), engaged: 0, cells: cs };
  }).sort((x, y) => y.total - x.total || (x.source < y.source ? -1 : x.source > y.source ? 1 : 0));
  const tot = week ? u.week?.byWeek ?? {} : u.byDay;
  return { gran: p.gran, cols: p.cols, rows, colTotals: p.cols.map((c) => tot[c.key] ?? 0), total: u.total };
};

/* ── 내려받기 행 ─────────────────────────────────────────────────── */
type Row = (string | number)[];
const rate = (a: number, b: number, digits: number) => (b ? Math.round((a / b) * 100 * 10 ** digits) / 10 ** digits : "");
const per = (a: number, b: number, digits: number) => (b ? Math.round((a / b) * 10 ** digits) / 10 ** digits : "");
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/* 원자료 — 한 줄 = 날짜 × 소스 × 매체 × 캠페인. 날짜 오름차순, 그 안에서 세션 많은 순.
   비율 열은 그 줄의 합에서 다시 계산한다(GA 화면의 비율과 같은 정의). full=false 면 주요 이벤트·수익은 빈칸. */
export const RAW_HEAD = [
  "날짜", "요일", "세션 소스", "세션 매체", "세션 캠페인", "채널", "세션", "참여 세션", "참여율(%)",
  "사용자", "신규 사용자", "이벤트 수", "세션당 이벤트", "세션당 평균 참여 시간(초)", "주요 이벤트", "총수익",
];
export const rawRows = (raw: SrcRaw[], full: boolean): Row[] => [
  RAW_HEAD,
  ...[...raw]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || b.sessions - a.sessions
      || (a.source < b.source ? -1 : a.source > b.source ? 1 : 0) || (a.medium < b.medium ? -1 : a.medium > b.medium ? 1 : 0)
      || (a.campaign < b.campaign ? -1 : a.campaign > b.campaign ? 1 : 0))
    .map((r) => [
      ymd(r.date), DOW[toDate(r.date).getUTCDay()], r.source, r.medium, r.campaign,
      CHANNEL[channelOf(r.source, r.medium)].label,
      r.sessions, r.engaged, rate(r.engaged, r.sessions, 1),
      r.users, r.newUsers, r.events, per(r.events, r.sessions, 2), per(r.engageSec, r.sessions, 0),
      full ? r.keyEvents : "", full ? Math.round(r.revenue * 100) / 100 : "",
    ]),
];

/* 사용자 표 — 합계 열·합계 줄은 GA 가 중복을 뺀 값(칸을 더한 값과 다르다) */
export const pivotUsersRows = (p: SdPivot): Row[] => [
  ["세션 소스", "매체", "채널", "사용자(기간·중복 제거)", ...p.cols.map((c) => ymd(c.key))],
  ...p.rows.map((r) => [r.source, r.mediums.join(" · "), CHANNEL[r.channel].label, r.total, ...r.cells]),
  ["합계(날짜별 중복 제거)", "", "", p.total, ...p.colTotals],
];

/* 화면 표 그대로 — 소스가 행, 날짜(또는 주)가 열. 맨 아래 합계 줄. */
export const pivotRows = (p: SdPivot): Row[] => [
  ["세션 소스", "매체", "채널", "합계", "참여율(%)", ...p.cols.map((c) => ymd(c.key))],
  ...p.rows.map((r) => [r.source, r.mediums.join(" · "), CHANNEL[r.channel].label, r.total, rate(r.engaged, r.total, 1), ...r.cells]),
  ["합계", "", "", p.total, rate(p.rows.reduce((s, r) => s + r.engaged, 0), p.total, 1), ...p.colTotals],
];
