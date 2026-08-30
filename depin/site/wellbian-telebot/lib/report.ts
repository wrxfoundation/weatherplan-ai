/* 분석 리포트 집계 (8/30 서우 — "분석 리포트도 고도화")

   화면과 떼어 놓는다. 여기 있는 함수는 항목 배열만 받아 숫자를 돌려주므로
   눈으로 보지 않아도 값을 확인할 수 있다 — 리포트는 틀려도 티가 안 나는
   종류의 화면이라, 검증할 수 있는 형태로 두는 편이 낫다.

   집계는 "무엇을 고쳐야 하는가"에 답하는 것만 담았다. 예쁜 숫자는 넣지 않았다. */

import { SLA_MIN, type CsSeverity } from "./cs";
import type { Beat } from "./store";

/* 서버는 UTC 로 돌아간다. 라벨을 그대로 뽑으면 한국에서 보는 화면이 9시간 어긋나
   "언제 몰리는가" 가 통째로 틀린 그림이 된다. 표시는 전부 KST 로 맞춘다. */
const KST_OFF = 9 * 3600_000;
const kstHour = (ms: number) => new Date(ms + KST_OFF).getUTCHours();
const kstDay = (ms: number) => {
  const d = new Date(ms + KST_OFF);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

export type Row = {
  at: number;
  topic: string;
  mood: string;
  status: string;
  kind: string;
  sev?: string;
  lang?: string;
  who?: string;
  fixed?: boolean;
  repliedAt?: number;
  closedAt?: number;
};

const sevOf = (r: Row) => (r.sev ?? "low") as CsSeverity;
const isOpen = (r: Row) => r.status !== "done" && r.status !== "faq";

export const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

/* ── 기간 ─────────────────────────────────────────────────────────────── */
export type Span = "24h" | "7d" | "all";
export const SPAN_LABEL: Record<Span, string> = { "24h": "최근 24시간", "7d": "최근 7일", all: "전체" };
export const spanFrom = (span: Span, now = Date.now()) =>
  span === "24h" ? now - 24 * 3600_000 : span === "7d" ? now - 7 * 86400_000 : 0;
export const inSpan = <T extends Row>(rows: T[], span: Span, now = Date.now()): T[] => {
  const from = spanFrom(span, now);
  return from ? rows.filter((r) => r.at >= from) : rows;
};

/* ── 언제 몰리는가 ─────────────────────────────────────────────────────
   막대 하나가 한 칸(시간 또는 하루)이다. 비어 있는 칸도 남긴다 —
   들어온 것만 이어 붙이면 잠잠했던 구간이 사라져서 추이가 실제보다 고르게 보인다. */
export type Bucket = { label: string; n: number; open: number; from: number };

export const buckets = (rows: Row[], span: Span, now = Date.now()): Bucket[] => {
  const hourly = span === "24h";
  const step = hourly ? 3600_000 : 86400_000;
  const count = hourly ? 24 : span === "7d" ? 7 : 14;
  const end = Math.floor(now / step) * step;
  const out: Bucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const from = end - i * step;
    out.push({
      from,
      label: hourly ? `${kstHour(from)}시` : kstDay(from),
      n: 0,
      open: 0,
    });
  }
  for (const r of rows) {
    const idx = out.findIndex((b) => r.at >= b.from && r.at < b.from + step);
    if (idx < 0) continue;
    out[idx].n++;
    if (isOpen(r)) out[idx].open++;
  }
  return out;
};

/* 몰리는 중인가 — 목록 화면 한 줄에 쓴다.
   "지금 몇 건" 만 보면 늘고 있는지 줄고 있는지 알 수 없다. 최근 몇 시간을 나란히
   놓고, 직전 시간과의 차이를 같이 준다. 사람을 더 넣을지 판단하는 근거다. */
export type Pulse = { bars: Bucket[]; lastHour: number; delta: number; openNow: number };

export const pulse = (rows: Row[], hours = 12, now = Date.now()): Pulse => {
  const step = 3600_000;
  const end = Math.floor(now / step) * step;
  const bars: Bucket[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const from = end - i * step;
    bars.push({ from, label: `${kstHour(from)}시`, n: 0, open: 0 });
  }
  for (const r of rows) {
    const idx = bars.findIndex((b) => r.at >= b.from && r.at < b.from + step);
    if (idx < 0) continue;
    bars[idx].n++;
    if (isOpen(r)) bars[idx].open++;
  }
  const last = bars[bars.length - 1]?.n ?? 0;
  const prev = bars[bars.length - 2]?.n ?? 0;
  return { bars, lastHour: last, delta: last - prev, openNow: bars.reduce((a, b) => a + b.open, 0) };
};

/* ── 얼마나 빨리 답했는가 ──────────────────────────────────────────────
   두 가지를 따로 센다. 첫 응답은 사람이 답장을 보낸 순간(repliedAt),
   처리 완료는 닫힌 순간(closedAt)이다. 답장 없이 상태만 바꿔 닫는 건이 많아
   둘을 합쳐 놓으면 "빨리 답한다" 는 착시가 생긴다.

   SLA 는 이미 결론이 난 것만 센다: 닫힌 건은 걸린 시간으로, 아직 열린 건은
   지금까지 경과가 기한을 넘겼으면 미준수로 확정한다. 아직 기한 안에 있는
   열린 건은 판정을 미룬다 — 지금 세면 준수율이 실제보다 좋게 나온다. */
export type TimeStats = {
  firstReply: number | null;   // 분, 중앙값
  firstReplyN: number;
  closed: number | null;       // 분, 중앙값
  closedN: number;
  botInstant: number;          // 봇이 즉시 해결한 건수
  slaOk: number;
  slaBad: number;
  slaRate: number | null;      // %
  worstOpen: number;           // 열린 건 중 가장 오래 기다린 분
};

export const timeStats = (rows: Row[], now = Date.now()): TimeStats => {
  const mins = (a: number, b: number) => Math.max(0, Math.round((b - a) / 60000));
  const reply: number[] = [];
  const close: number[] = [];
  let botInstant = 0, slaOk = 0, slaBad = 0, worstOpen = 0;

  for (const r of rows) {
    if (r.repliedAt) reply.push(mins(r.at, r.repliedAt));
    if (r.closedAt) close.push(mins(r.at, r.closedAt));
    /* 후보를 눌러 스스로 해결한 건 — 사람 손이 닿지 않았다 */
    if (r.kind === "matched" && !isOpen(r) && !r.repliedAt) botInstant++;

    const limit = SLA_MIN[sevOf(r)];
    if (!isOpen(r)) {
      /* 닫혔는데 시각이 없는 옛 기록은 판정에서 뺀다 — 모르는 것을 준수로 세지 않는다 */
      if (r.closedAt) (mins(r.at, r.closedAt) <= limit ? slaOk++ : slaBad++);
    } else {
      const waited = mins(r.at, now);
      if (waited > worstOpen) worstOpen = waited;
      if (waited > limit) slaBad++;
    }
  }
  const total = slaOk + slaBad;
  return {
    firstReply: median(reply), firstReplyN: reply.length,
    closed: median(close), closedN: close.length,
    botInstant,
    slaOk, slaBad,
    slaRate: total ? Math.round((slaOk / total) * 100) : null,
    worstOpen,
  };
};

/* ── 어디가 아픈가 ─────────────────────────────────────────────────────
   주제별로 긴급도를 갈라 본다. "결제 문의가 많다" 보다 "결제 문의 중 긴급이
   절반" 이 손을 어디에 둘지 알려 준다. */
export type TopicRow = {
  topic: string; n: number; high: number; mid: number; low: number;
  open: number; neg: number; unanswered: number;
};

export const topicRows = (rows: Row[]): TopicRow[] => {
  const m = new Map<string, TopicRow>();
  for (const r of rows) {
    const t = r.topic || "기타";
    const cur = m.get(t) ?? { topic: t, n: 0, high: 0, mid: 0, low: 0, open: 0, neg: 0, unanswered: 0 };
    cur.n++;
    cur[sevOf(r)]++;
    if (isOpen(r)) cur.open++;
    if (r.mood === "negative") cur.neg++;
    if (r.kind === "unanswered") cur.unanswered++;
    m.set(t, cur);
  }
  /* 긴급이 많은 순, 같으면 건수 순 — 목록 위쪽이 곧 먼저 볼 곳이 되게 */
  return [...m.values()].sort((a, b) => b.high - a.high || b.n - a.n);
};

/* ── 무엇을 정본에 넣어야 하는가 ───────────────────────────────────────
   정본에 답이 없어 사람에게 넘어온 질문이 곧 정본에 채울 목록이다.
   같은 질문이 여러 번 오면 그만큼 위로 올라온다. */
export const answerGaps = <T extends Row>(rows: T[]): T[] =>
  rows.filter((r) => r.kind === "unanswered");

/* ── 분위기와 분류 품질 ────────────────────────────────────────────── */
export type Quality = {
  pos: number; neg: number; q: number;
  negRate: number | null;
  fixed: number; fixedRate: number | null;
  shown: number; solved: number; hitRate: number | null;
};

export const quality = (rows: Row[]): Quality => {
  let pos = 0, neg = 0, q = 0, fixed = 0, shown = 0, solved = 0;
  for (const r of rows) {
    if (r.mood === "positive") pos++;
    else if (r.mood === "negative") neg++;
    else q++;
    if (r.fixed) fixed++;
    if (r.kind === "matched") { shown++; if (!isOpen(r)) solved++; }
  }
  const n = rows.length;
  return {
    pos, neg, q,
    negRate: n ? Math.round((neg / n) * 100) : null,
    fixed, fixedRate: n ? Math.round((fixed / n) * 100) : null,
    shown, solved,
    hitRate: shown ? Math.round((solved / shown) * 100) : null,
  };
};

/* ── 그룹 분위기 (8/30 서우 — privacy off 로 그룹 대화를 지켜본다) ──────────
   원문이 없는 개수만으로 본다. 그래도 답할 수 있는 것이 있다 —
   "지금 말이 늘고 있는가", "부정이 갑자기 뛰었는가", "무슨 주제로 떠드는가".

   9/7 당일에 필요한 건 그 셋뿐이다. 부정 비율이 뛰면 그룹을 직접 열어 봐야 한다는
   신호이고, 이 화면은 그 신호를 놓치지 않는 것까지가 역할이다. */
export type MoodHour = { at: number; label: string; n: number; neg: number; negRate: number | null };

export const beatHours = (beats: Beat[], hours = 24, now = Date.now()): MoodHour[] => {
  const step = 3600_000;
  const end = Math.floor(now / step) * step;
  const rows: MoodHour[] = [];
  const index = new Map<string, number>();
  for (let i = hours - 1; i >= 0; i--) {
    const at = end - i * step;
    index.set(new Date(at).toISOString().slice(0, 13), rows.length);
    rows.push({ at, label: `${kstHour(at)}시`, n: 0, neg: 0, negRate: null });
  }
  for (const b of beats) {
    const i = index.get(b.hour);
    if (i === undefined) continue;
    rows[i].n += b.n;
    if (b.mood === "negative") rows[i].neg += b.n;
  }
  for (const r of rows) r.negRate = r.n ? Math.round((r.neg / r.n) * 100) : null;
  return rows;
};

export type BeatTopic = { topic: string; n: number; neg: number };

export const beatTopics = (beats: Beat[], hours = 24, now = Date.now()): BeatTopic[] => {
  const from = new Date(Math.floor(now / 3600_000) * 3600_000 - (hours - 1) * 3600_000)
    .toISOString().slice(0, 13);
  const m = new Map<string, BeatTopic>();
  for (const b of beats) {
    if (b.hour < from) continue;
    const cur = m.get(b.topic) ?? { topic: b.topic, n: 0, neg: 0 };
    cur.n += b.n;
    if (b.mood === "negative") cur.neg += b.n;
    m.set(b.topic, cur);
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
};

/* 직전 시간과 견주어 부정이 튀었는지. 뛴 순간을 놓치지 않는 것이 이 화면의 목적이다. */
export const moodSpike = (rows: MoodHour[]) => {
  const live = rows.filter((r) => r.n >= 3);
  if (live.length < 2) return null;
  const last = live[live.length - 1];
  const before = live.slice(0, -1);
  const baseN = before.reduce((a, r) => a + r.n, 0);
  const baseNeg = before.reduce((a, r) => a + r.neg, 0);
  const base = baseN ? Math.round((baseNeg / baseN) * 100) : 0;
  return { now: last.negRate ?? 0, base, jumped: (last.negRate ?? 0) - base >= 20 };
};

/* ── 누가 오래 기다리고 있는가 ─────────────────────────────────────────
   기한을 넘긴 열린 건을 오래 기다린 순으로. 리포트를 보다가 바로 처리로
   넘어갈 수 있어야 한다 — 숫자만 보여 주고 끝내면 다시 목록을 뒤져야 한다. */
export const waiting = <T extends Row>(rows: T[], now = Date.now()) =>
  rows
    .filter(isOpen)
    .map((r) => ({ r, over: Math.round((now - r.at) / 60000) - SLA_MIN[sevOf(r)] }))
    .filter((x) => x.over > 0)
    .sort((a, b) => b.over - a.over);
