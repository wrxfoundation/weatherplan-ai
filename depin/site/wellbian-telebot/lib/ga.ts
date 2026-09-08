/* GA4 유입 (9/8 서우 — "GA 분석 대시보드도 같이 연동 못 붙이나")

   붙는다. 다만 GA 화면을 iframe 으로 끼우는 방식은 쓰지 않는다 — 구글 로그인이 있어야
   보이고, 공유 설정을 열면 속성 전체가 새어 나간다. 대신 GA4 Data API 를 서버에서 부른다.
   서비스 계정 하나를 GA4 속성에 뷰어로 넣고, 그 키로 서명한 JWT 를 토큰으로 바꿔 쓴다.

   SDK 를 쓰지 않는다. 이 프로젝트는 텔레그램·정본·KV 를 전부 fetch 하나로 다루고 있고,
   구글 SDK 는 의존성이 수십 개다. 서명은 node:crypto 로 충분하다.

   인증은 두 길 중 하나. 둘 다 있으면 OAuth 를 먼저 쓴다.
     A. 서비스 계정 키 — GA_SA_EMAIL + GA_SA_PRIVATE_KEY
     B. OAuth 리프레시 토큰 — GA_OAUTH_CLIENT_ID + GA_OAUTH_CLIENT_SECRET + GA_OAUTH_REFRESH_TOKEN
        (9/8) Workspace 조직은 iam.disableServiceAccountKeyCreation 정책이 기본으로 걸려
        서비스 계정 키를 못 만든다. 그때는 B — 관리자 계정(GA 속성 소유자)의 리프레시 토큰으로
        같은 API 를 부른다. 키 파일이 없으니 정책과 부딪히지 않는다. 토큰은 tools/ga-oauth.mts 로 받는다.

   공통:
     GA_PROPERTY_ID     GA4 속성 ID (숫자). 측정 ID(G-…)도 컨테이너 ID(GTM-…)도 아니다.
     GA_SINCE           (선택) "런치 이후" 기간의 시작일. 기본 2026-09-07 — 사전예약 오픈일.
                        이 파일이 가진 유일한 날짜다.
   ※ NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다.

   호출량: 한 화면이 보고서 6개를 부른다. 5분 캐시를 두므로 하루 종일 새로고침해도
   속성 일일 토큰 한도(수만 단위)에 닿지 않는다. */

import { createSign } from "node:crypto";

const PROP = process.env.GA_PROPERTY_ID ?? "";
const EMAIL = process.env.GA_SA_EMAIL ?? "";
const KEY = (process.env.GA_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
const OA = {
  id: process.env.GA_OAUTH_CLIENT_ID ?? "",
  secret: process.env.GA_OAUTH_CLIENT_SECRET ?? "",
  refresh: process.env.GA_OAUTH_REFRESH_TOKEN ?? "",
};
const SINCE = process.env.GA_SINCE || "2026-09-07";

const saReady = () => Boolean(EMAIL && KEY);
const oauthReady = () => Boolean(OA.id && OA.secret && OA.refresh);
export type GaMode = "oauth" | "sa" | "";
export const gaMode = (): GaMode => (oauthReady() ? "oauth" : saReady() ? "sa" : "");
export const gaConfigured = () => Boolean(PROP) && gaMode() !== "";
/* 첫 화면에서 "무엇이 비었는지"를 말해 주기 위한 것. 값은 내보내지 않는다. */
export const gaMissing = () => {
  const m: string[] = [];
  if (!PROP) m.push("GA_PROPERTY_ID");
  if (!gaMode()) m.push("인증 — GA_SA_EMAIL+GA_SA_PRIVATE_KEY 또는 GA_OAUTH_CLIENT_ID+CLIENT_SECRET+REFRESH_TOKEN");
  return m.join(" · ");
};

/* ── 토큰 ──────────────────────────────────────────────────────────────
   서비스 계정 JWT(RS256) → 액세스 토큰. 1시간짜리라 인스턴스 안에서 재사용한다. */
const b64u = (s: string | Buffer) => Buffer.from(s).toString("base64url");
let tok: { v: string; exp: number } | null = null;

const token = async (): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  if (tok && tok.exp - 60 > now) return tok.v;

  /* B. OAuth 리프레시 토큰 → 액세스 토큰. 서비스 계정 키가 조직 정책으로 막힐 때의 길. */
  if (oauthReady()) {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: OA.id, client_secret: OA.secret, refresh_token: OA.refresh,
      }),
      cache: "no-store",
    });
    const j = (await r.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
    if (!r.ok || !j.access_token) {
      /* invalid_grant = 리프레시 토큰이 취소됐거나(비밀번호 변경·앱 접근 철회) 외부 앱 테스트 모드의
         7일 만료. 동의 화면을 "내부"로 두면 만료가 없다 — tools/ga-oauth.mts 로 다시 받는다. */
      const why = j.error === "unauthorized_client"
        ? " — 리프레시 토큰을 발급한 클라이언트와 GA_OAUTH_CLIENT_ID/SECRET 이 다름. Playground ⚙ 에 웹 클라이언트를 다시 넣고(새로고침하면 지워진다) 재발급한 뒤, Vercel 세 값을 같은 클라이언트로 맞출 것"
        : j.error === "invalid_grant"
          ? " — 토큰이 취소됐거나 만료됨(외부+테스트 앱은 7일). 동의 화면을 내부로 두고 재발급"
          : "";
      throw new Error(`oauth ${r.status} ${j.error ?? ""} ${j.error_description ?? ""}${why}`.trim());
    }
    tok = { v: j.access_token, exp: now + (j.expires_in ?? 3600) };
    return tok.v;
  }

  /* A. 서비스 계정 JWT */
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
    /* 403 은 세 가지다. "has not been used in project … or it is disabled" 는 토큰을 발급한 GCP
       프로젝트에 Analytics Data API 가 사용 설정되지 않은 것 — 새로 판 프로젝트는 API 가 하나도
       켜져 있지 않다(9/8 wellbian-ga 에서 실제로 그랬다). "insufficient authentication scopes" 는
       토큰에 analytics.readonly 범위가 없는 것 — OAuth 라면 Playground 에서 다른 스코프를 골라
       발급한 토큰이다. 그 밖의 403 은 동의한 계정(또는 서비스 계정)이 그 속성에 권한이 없는 것. */
    const msg = j.error?.message ?? "";
    const hint = r.status === 403
      ? (/has not been used|is disabled/i.test(msg)
          ? " — 토큰을 발급한 GCP 프로젝트에 Google Analytics Data API 가 사용 설정되지 않음. 메시지의 링크(또는 API 및 서비스 › 라이브러리)에서 '사용'을 누르고 2~3분 뒤 새로고침"
          : /scope/i.test(msg)
          ? ` — 토큰에 GA 읽기 범위가 없음. ${gaMode() === "oauth"
              ? "Playground 에서 스코프를 https://www.googleapis.com/auth/analytics.readonly 로 다시 골라 리프레시 토큰을 새로 받아 넣을 것"
              : "서비스 계정 JWT 의 scope 확인"}`
          : ` — ${gaMode() === "oauth" ? "동의한 계정이" : "서비스 계정이"} GA4 속성 액세스 관리에 뷰어 이상으로 있는지 확인`)
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
