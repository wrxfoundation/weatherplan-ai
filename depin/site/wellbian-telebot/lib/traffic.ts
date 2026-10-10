/* 유입 집계 — 순수 계산 (9/8 서우 — "이해하기 쉽게 일목요연하게, 그래프도 넣어서 일자별 주차별 월간별 채널별")

   GA 가 주는 것은 날짜 × 소스/매체 행뿐이다. 소스/매체 표는 정확하지만 읽는 사람이 매번
   "x_out 이 뭐지, kol2 는 누구지"를 머릿속에서 채널로 다시 묶어야 했다. 여기서 한 번 묶는다.

   채널은 열 개 — 우리가 링크를 뿌리는 곳(X·텔레그램·링크트리·KOL·다른 SNS·언론)과 우리가
   뿌리지 않은 곳(검색·직접·기타 리퍼럴), 그리고 방문은 잡혔지만 출처가 비어 있는 것(출처 미확인 —
   9/8 서우: "미측정이 미측정이 아니니까 오해하지 않게" — 측정이 안 된 게 아니라 경로만 모르는 것). 색은 앞의
   일곱만 갖고, 나머지 셋은 회색 계열 — 색이 있는 것만 "우리가 움직일 수 있는 채널"이다.
   일곱 색은 색약(적록·청황) 시뮬레이션으로 이웃 색끼리 갈리는 순서로 골랐다. 순서를 바꾸면
   막대 안에서 이웃이 바뀌므로 다시 검증해야 한다.

   일·주·월은 같은 행을 세 번 묶은 것이다 — GA 에 세 번 묻지 않는다. 주는 월요일 시작.
   날짜는 GA 속성 시간대(한국)를 그대로 쓴다.

   환경변수도 fetch 도 없다 — tools/traffic-check.mts 가 값을 고정해 두고 센다. */

export type Channel =
  | "x" | "telegram" | "linktree" | "kol" | "sns" | "press" | "search"
  | "direct" | "other" | "unset";

export type ChannelMeta = { key: Channel; label: string; color: string; hatch?: boolean; hint: string };

export const CHANNELS: ChannelMeta[] = [
  { key: "x",        label: "X",          color: "#4d4dce", hint: "x · x_out · t.co" },
  { key: "telegram", label: "텔레그램",    color: "#cf6a10", hint: "telegram · t.me" },
  { key: "linktree", label: "링크트리",    color: "#8a5fd9", hint: "linktree · linktr.ee" },
  { key: "kol",      label: "KOL",        color: "#2e9e5b", hint: "utm_medium=kol" },
  { key: "sns",      label: "다른 SNS",    color: "#d1489a", hint: "링크드인 · 인스타그램 · 유튜브 · 페이스북" },
  { key: "press",    label: "언론",        color: "#1f8fcc", hint: "언론사 도메인 · 네이버/다음 뉴스" },
  { key: "search",   label: "검색",        color: "#a8792a", hint: "구글 · 네이버 · 빙" },
  { key: "direct",   label: "직접",        color: "#8a8aa3", hint: "(direct) · 구글 로그인 복귀" },
  { key: "other",    label: "기타 리퍼럴", color: "#c3c3d2", hint: "목록에 없는 사이트" },
  { key: "unset",    label: "출처 미확인",  color: "#e4e4ee", hatch: true, hint: "(not set) — 방문은 잡혔고 출처만 비어 있음" },
];
export const CHANNEL = Object.fromEntries(CHANNELS.map((c) => [c.key, c])) as Record<Channel, ChannelMeta>;
const ORDER = Object.fromEntries(CHANNELS.map((c, i) => [c.key, i])) as Record<Channel, number>;

/* ── 채널 판정 ──────────────────────────────────────────────────────── */
const X = new Set(["x", "x_out", "xpurchase", "x.com", "t.co", "twitter", "twitter.com", "mobile.twitter.com"]);
const TG = new Set(["telegram", "tg", "t.me", "telegram.org", "telegram.me", "web.telegram.org", "org.telegram.messenger"]);
const LT = new Set(["linktree", "linktr.ee"]);
const DIRECT = new Set(["(direct)", "accounts.google.com", "tagassistant.google.com", "localhost"]);
const SEARCH = new Set([
  "google", "google.com", "www.google.com", "google.co.kr", "naver", "naver.com", "search.naver.com",
  "m.search.naver.com", "bing", "bing.com", "daum", "daum.net", "search.daum.net", "duckduckgo",
  "duckduckgo.com", "yahoo", "yahoo.com", "search.yahoo.com",
]);
/* 호스트 어디에든 들어 있으면 SNS 로 본다 — l.instagram.com · lm.facebook.com · com.linkedin.android */
const SNS = ["linkedin", "lnkd.in", "instagram", "facebook", "threads", "youtube", "youtu.be", "discord",
  "reddit", "kakao", "band.us", "tiktok", "medium.com", "substack"];
/* 끝이 이 도메인으로 끝나면 언론 — biz.chosun.com · n.news.naver.com */
const PRESS = [
  "chosun.com", "newsis.com", "mbn.co.kr", "mt.co.kr", "hansbiz.co.kr", "bloter.net", "smartbizn.com",
  "kharn.kr", "kmecnews.co.kr", "news.naver.com", "v.daum.net", "news.daum.net", "news.google.com",
  "zdnet.co.kr", "etnews.com", "tokenpost.kr", "blockmedia.co.kr", "coinreaders.com", "decenter.kr",
  "digitaltoday.co.kr", "hankyung.com", "edaily.co.kr", "yna.co.kr", "news1.kr", "newspim.com",
  "dt.co.kr", "ddaily.co.kr", "inews24.com", "sedaily.com", "asiae.co.kr", "mk.co.kr", "fnnews.com",
  "heraldcorp.com", "ytn.co.kr", "hani.co.kr", "khan.co.kr", "joongang.co.kr", "donga.com",
  "kmib.co.kr", "segye.com", "ajunews.com", "thebell.co.kr", "coindesk.com", "cointelegraph.com",
];

const endsWithDomain = (host: string, d: string) => host === d || host.endsWith(`.${d}`);

export const channelOf = (source: string, medium: string): Channel => {
  const s = (source ?? "").trim().toLowerCase();
  const m = (medium ?? "").trim().toLowerCase();
  if (s === "(not set)" || s === "") return "unset";
  if (m === "kol") return "kol";
  if (m === "press") return "press";
  if (X.has(s)) return "x";
  if (TG.has(s)) return "telegram";
  if (LT.has(s)) return "linktree";
  if (DIRECT.has(s)) return "direct";
  if (m === "organic" || SEARCH.has(s)) return "search";
  if (SNS.some((k) => s.includes(k))) return "sns";
  if (PRESS.some((d) => endsWithDomain(s, d))) return "press";
  return "other";
};

/* ── 날짜 ────────────────────────────────────────────────────────────
   키는 GA 의 date 차원 그대로 "YYYYMMDD". 한국은 서머타임이 없어 +9 시간 고정으로 오늘을 잡는다. */
export const kstToday = (now = Date.now()) =>
  new Date(now + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, "");
export const dayKey = (iso: string) => iso.replace(/-/g, "").slice(0, 8);
const toDate = (k: string) => new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)));
const toKey = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const addDays = (k: string, n: number) => { const d = toDate(k); d.setUTCDate(d.getUTCDate() + n); return toKey(d); };
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export const weekStart = (k: string) => addDays(k, -((toDate(k).getUTCDay() + 6) % 7));
export const monthKey = (k: string) => k.slice(0, 6);
export const dayLabel = (k: string) => `${+k.slice(4, 6)}/${+k.slice(6, 8)}`;
export const dayLong = (k: string) => `${+k.slice(4, 6)}/${+k.slice(6, 8)} (${DOW[toDate(k).getUTCDay()]})`;
export const weekLabel = (start: string) => `${dayLabel(start)}~`;
export const weekLong = (start: string) => `${dayLabel(start)}~${dayLabel(addDays(start, 6))} 주`;
export const monthLabel = (m: string) => `${+m.slice(4, 6)}월`;
export const monthLong = (m: string) => `${m.slice(0, 4)}년 ${+m.slice(4, 6)}월`;

/* ── 집계 ──────────────────────────────────────────────────────────── */
export type Raw = { date: string; source: string; medium: string; sessions: number; users: number; newUsers: number; engaged: number };
export type Bucket = { key: string; label: string; long: string; total: number; by: Partial<Record<Channel, number>> };
export type ChannelStat = { key: Channel; sessions: number; users: number; newUsers: number; engaged: number; share: number };
export type SourceRow = { channel: Channel; source: string; medium: string; sessions: number; users: number; engaged: number };
export type Kpi = { today: number; week: number; weekStart: string; total: number; users: number; newUsers: number; engaged: number };
export type TrafficData = {
  since: string; today: string;
  daily: Bucket[]; weekly: Bucket[]; monthly: Bucket[];
  channels: ChannelStat[];   // 세션 많은 순, 0 은 뺀다
  sources: SourceRow[];      // 채널 순서 → 세션 많은 순
  kpi: Kpi;
};

const bucket = (key: string, label: string, long: string): Bucket => ({ key, label, long, total: 0, by: {} });
const add = (b: Bucket, ch: Channel, n: number) => { b.total += n; b.by[ch] = (b.by[ch] ?? 0) + n; };

export const build = (
  raw: Raw[], sinceIso: string, today: string,
  /* 사용자 수는 소스별로 더하면 중복된다(한 사람이 두 경로로 오면 둘). 합계는 GA 에 따로 물은 값을 쓴다. */
  totals?: { users: number; newUsers: number; engaged: number },
): TrafficData => {
  let since = dayKey(sinceIso);
  if (since > today) since = today;

  /* 날은 빠짐없이 — 0 인 날도 막대 자리가 있어야 "안 들어온 날"이 보인다 */
  const daily: Bucket[] = [];
  const dayIx = new Map<string, Bucket>();
  for (let k = since; k <= today; k = addDays(k, 1)) {
    const b = bucket(k, dayLabel(k), dayLong(k));
    daily.push(b); dayIx.set(k, b);
  }

  const chSum = new Map<Channel, ChannelStat>();
  const srcSum = new Map<string, SourceRow>();
  for (const r of raw) {
    if (!r.sessions && !r.users) continue;
    const d = dayIx.get(r.date);
    if (!d) continue;                                  // 기간 밖 행은 버린다
    const ch = channelOf(r.source, r.medium);
    add(d, ch, r.sessions);

    const c = chSum.get(ch) ?? { key: ch, sessions: 0, users: 0, newUsers: 0, engaged: 0, share: 0 };
    c.sessions += r.sessions; c.users += r.users; c.newUsers += r.newUsers; c.engaged += r.engaged;
    chSum.set(ch, c);

    const sk = `${r.source}${r.medium}`;
    const s = srcSum.get(sk) ?? { channel: ch, source: r.source, medium: r.medium, sessions: 0, users: 0, engaged: 0 };
    s.sessions += r.sessions; s.users += r.users; s.engaged += r.engaged;
    srcSum.set(sk, s);
  }

  const roll = (keyOf: (k: string) => string, label: (k: string) => string, long: (k: string) => string) => {
    const out: Bucket[] = [];
    const ix = new Map<string, Bucket>();
    for (const d of daily) {
      const k = keyOf(d.key);
      let b = ix.get(k);
      if (!b) { b = bucket(k, label(k), long(k)); ix.set(k, b); out.push(b); }
      for (const [ch, n] of Object.entries(d.by) as [Channel, number][]) add(b, ch, n);
    }
    return out;
  };
  const weekly = roll(weekStart, weekLabel, weekLong);
  const monthly = roll(monthKey, monthLabel, monthLong);

  const total = daily.reduce((a, b) => a + b.total, 0);
  const channels = [...chSum.values()]
    .filter((c) => c.sessions > 0)
    .map((c) => ({ ...c, share: total ? Math.round((c.sessions / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.sessions - a.sessions || ORDER[a.key] - ORDER[b.key]);
  const sources = [...srcSum.values()]
    .filter((s) => s.sessions > 0)
    .sort((a, b) => ORDER[a.channel] - ORDER[b.channel] || b.sessions - a.sessions);

  const ws = weekStart(today);
  const sum = (f: (c: ChannelStat) => number) => [...chSum.values()].reduce((a, c) => a + f(c), 0);
  const kpi: Kpi = {
    today: dayIx.get(today)?.total ?? 0,
    week: daily.filter((d) => d.key >= ws).reduce((a, d) => a + d.total, 0),
    weekStart: ws,
    total,
    users: totals?.users ?? sum((c) => c.users),
    newUsers: totals?.newUsers ?? sum((c) => c.newUsers),
    engaged: totals?.engaged ?? sum((c) => c.engaged),
  };

  return { since, today, daily, weekly, monthly, channels, sources, kpi };
};

/* 막대 눈금의 윗값 — 4칸으로 나눠도 정수가 되는 수 중 가장 가까운 것 (187 → 200, 28 → 40, 7 → 8) */
export const niceMax = (peak: number) => {
  if (peak <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(peak));
  for (const f of [0.4, 0.8, 1, 1.2, 1.6, 2, 2.4, 3.2, 4, 6, 8, 10, 12, 16, 20]) {
    const v = Math.round(f * p);
    if (v >= peak && v % 4 === 0) return v;
  }
  return 20 * p;
};
