/* GA4 유입 (9/8 서우 — "GA 분석 대시보드도 같이 연동 못 붙이나")

   붙는다. 다만 GA 화면을 iframe 으로 끼우는 방식은 쓰지 않는다 — 구글 로그인이 있어야
   보이고, 공유 설정을 열면 속성 전체가 새어 나간다. 대신 GA4 Data API 를 서버에서 부른다.
   서비스 계정 하나를 GA4 속성에 뷰어로 넣고, 그 키로 서명한 JWT 를 토큰으로 바꿔 쓴다.

   SDK 를 쓰지 않는다. 이 프로젝트는 텔레그램·정본·KV 를 전부 fetch 하나로 다루고 있고,
   구글 SDK 는 의존성이 수십 개다. 서명은 node:crypto 로 충분하다.

   환경변수 (Vercel · wellbian-telebot 프로젝트):
     GA_PROPERTY_ID     GA4 속성 ID (숫자). 측정 ID(G-…)도 컨테이너 ID(GTM-…)도 아니다.
     GA_SA_EMAIL        서비스 계정 이메일 (…@….iam.gserviceaccount.com)
     GA_SA_PRIVATE_KEY  서비스 계정 JSON 의 private_key 값. 줄바꿈이 \n 으로 이스케이프돼
                        들어와도 받는다.
     GA_SINCE           (선택) "런치 이후" 기간의 시작일. 기본 2026-09-07 — 사전예약 오픈일.
                        이 파일이 가진 유일한 날짜다.
   ※ NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다.

   호출량: 한 화면이 보고서 6개를 부른다. 5분 캐시를 두므로 하루 종일 새로고침해도
   속성 일일 토큰 한도(수만 단위)에 닿지 않는다. */

import { createSign } from "node:crypto";

const PROP = process.env.GA_PROPERTY_ID ?? "";
const EMAIL = process.env.GA_SA_EMAIL ?? "";
const KEY = (process.env.GA_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
const SINCE = process.env.GA_SINCE || "2026-09-07";

export const gaConfigured = () => Boolean(PROP && EMAIL && KEY);
/* 첫 화면에서 "무엇이 비었는지"를 말해 주기 위한 것. 값은 내보내지 않는다. */
export const gaMissing = () =>
  [!PROP && "GA_PROPERTY_ID", !EMAIL && "GA_SA_EMAIL", !KEY && "GA_SA_PRIVATE_KEY"].filter(Boolean).join(" · ");

/* ── 토큰 ──────────────────────────────────────────────────────────────
   서비스 계정 JWT(RS256) → 액세스 토큰. 1시간짜리라 인스턴스 안에서 재사용한다. */
const b64u = (s: string | Buffer) => Buffer.from(s).toString("base64url");
let tok: { v: string; exp: number } | null = null;

const token = async (): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  if (tok && tok.exp - 60 > now) return tok.v;
  const header = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64u(JSON.stringify({
    iss: EMAIL,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const sig = b64u(createSign("RSA-SHA256").update(`${header}.${claims}`).end().sign(KEY));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${sig}`,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`token ${r.status} — 서비스 계정 이메일·키를 확인`);
  const j = (await r.json()) as { access_token: string; expires_in?: number };
  tok = { v: j.access_token, exp: now + (j.expires_in ?? 3600) };
  return tok.v;
};

/* ── 보고서 ────────────────────────────────────────────────────────── */
export type GaRow = Record<string, string>;

type Api = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  error?: { message?: string };
};

const call = async (method: "runReport" | "runRealtimeReport", body: unknown): Promise<GaRow[]> => {
  const t = await token();
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROP}:${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const j = (await r.json()) as Api;
  if (!r.ok) {
    /* 403 은 거의 항상 "서비스 계정을 GA4 속성에 뷰어로 안 넣음"이다. 그대로 말해 준다. */
    const hint = r.status === 403 ? " — 서비스 계정을 GA4 속성 액세스 관리에 뷰어로 추가했는지 확인"
      : r.status === 400 ? " — 속성 ID 가 숫자인지 확인" : "";
    throw new Error(`${method} ${r.status} ${j.error?.message ?? ""}${hint}`.trim());
  }
  const dims = (j.dimensionHeaders ?? []).map((h) => h.name);
  const mets = (j.metricHeaders ?? []).map((h) => h.name);
  return (j.rows ?? []).map((row) => ({
    ...Object.fromEntries(dims.map((d, i) => [d, row.dimensionValues[i]?.value ?? ""])),
    ...Object.fromEntries(mets.map((m, i) => [m, row.metricValues[i]?.value ?? "0"])),
  }));
};

export type GaSpan = "today" | "7d" | "launch";
export const GA_SPAN_LABEL: Record<GaSpan, string> = { today: "오늘", "7d": "최근 7일", launch: "런치 이후" };
const range = (s: GaSpan) => [{
  startDate: s === "today" ? "today" : s === "7d" ? "7daysAgo" : SINCE,
  endDate: "today",
}];

const report = (s: GaSpan, dims: string[], mets: string[], orderBy: string, limit = 25) =>
  call("runReport", {
    dateRanges: range(s),
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    orderBys: [{ metric: { metricName: orderBy }, desc: true }],
    limit,
  });

export type GaSnapshot = {
  span: GaSpan;
  since: string;
  fetchedAt: number;
  realtime: number;                 // 지난 30분 활성 사용자
  total: { sessions: number; users: number; engaged: number; newUsers: number };
  bySource: GaRow[];                // sessionSource · sessionMedium
  byContent: GaRow[];               // sessionSource · sessionManualAdContent  (utm_content)
  byCampaign: GaRow[];              // sessionCampaignName
  byDay: GaRow[];                   // date (오름차순으로 정렬해 돌려준다)
  byPage: GaRow[];                  // pagePath
  error?: string;
};

const cache = new Map<GaSpan, { at: number; v: GaSnapshot }>();
const TTL = 5 * 60_000;

const num = (v: string | undefined) => Number(v ?? 0) || 0;

export const gaSnapshot = async (span: GaSpan): Promise<GaSnapshot> => {
  const hit = cache.get(span);
  if (hit && Date.now() - hit.at < TTL) return hit.v;

  const base: GaSnapshot = {
    span, since: SINCE, fetchedAt: Date.now(), realtime: 0,
    total: { sessions: 0, users: 0, engaged: 0, newUsers: 0 },
    bySource: [], byContent: [], byCampaign: [], byDay: [], byPage: [],
  };
  if (!gaConfigured()) return { ...base, error: `미연결 — ${gaMissing()}` };

  try {
    const [rt, total, bySource, byContent, byCampaign, byDay, byPage] = await Promise.all([
      call("runRealtimeReport", { metrics: [{ name: "activeUsers" }] }),
      call("runReport", { dateRanges: range(span), metrics: ["sessions", "activeUsers", "engagedSessions", "newUsers"].map((name) => ({ name })) }),
      report(span, ["sessionSource", "sessionMedium"], ["sessions", "activeUsers", "engagedSessions"], "sessions"),
      report(span, ["sessionSource", "sessionManualAdContent"], ["sessions", "activeUsers"], "sessions", 30),
      report(span, ["sessionCampaignName"], ["sessions", "activeUsers"], "sessions", 10),
      report(span, ["date"], ["sessions", "activeUsers"], "sessions", 60),
      report(span, ["pagePath"], ["screenPageViews", "activeUsers"], "screenPageViews", 12),
    ]);
    const t = total[0] ?? {};
    const v: GaSnapshot = {
      ...base,
      realtime: num(rt[0]?.activeUsers),
      total: { sessions: num(t.sessions), users: num(t.activeUsers), engaged: num(t.engagedSessions), newUsers: num(t.newUsers) },
      bySource, byContent, byCampaign, byPage,
      byDay: [...byDay].sort((a, b) => (a.date < b.date ? -1 : 1)),
    };
    cache.set(span, { at: Date.now(), v });
    return v;
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  }
};

/* "20260908" → "9/8" */
export const gaDay = (d: string) => `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}`;
