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
     GA_SINCE           (선택) 집계 시작일. 기본 2026-09-07 — 사전예약 오픈일(태그를 붙인 날).
                        이 파일이 가진 유일한 날짜다.
   ※ NEXT_PUBLIC_ 접두사를 절대 붙이지 않는다.

   호출량: 한 화면이 보고서 6개를 부른다. 5분 캐시를 두므로 하루 종일 새로고침해도
   속성 일일 토큰 한도(수만 단위)에 닿지 않는다. */

import { createSign } from "node:crypto";
import { build, kstToday, type Raw, type TrafficData } from "./traffic";
import { fixture } from "./ga-fixture";

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
/* 화면이 "미연결 안내"를 낼지 정하는 기준. 가짜 자료(GA_FIXTURE)로 볼 때는 연결된 셈 친다 — health 의 ga 는 그대로 진짜 값이다. */
export const gaReady = () => Boolean(process.env.GA_FIXTURE) || gaConfigured();
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

/* ── 유입 스냅샷 ─────────────────────────────────────────────────────
   (9/8 2차 — 서우 "일자별 주차별 월간별 채널별") 기간 칩(오늘·7일·런치 이후)을 없애고 런치 이후
   전체를 한 번에 받는다. 일·주·월은 날짜 × 소스/매체 행 하나를 lib/traffic.ts 가 세 번 묶어 만든다 —
   GA 에 세 번 물을 이유가 없다. 화면 하나가 보고서 6개를 부르는 것은 전과 같다. 5분 캐시. */

const RANGE = [{ startDate: SINCE, endDate: "today" }];

const report = (dims: string[], mets: string[], orderBy: string, limit = 25) =>
  call("runReport", {
    dateRanges: RANGE,
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    orderBys: [{ metric: { metricName: orderBy }, desc: true }],
    limit,
  });

export type TrafficSnapshot = {
  since: string;                    // GA_SINCE 원문 (YYYY-MM-DD)
  today: string;                    // 한국 기준 오늘 (YYYYMMDD)
  fetchedAt: number;
  realtime: number;                 // 지난 30분 활성 사용자
  data: TrafficData;                // 일·주·월·채널·소스 (lib/traffic.ts)
  byContent: GaRow[];               // sessionSource · sessionMedium · sessionManualAdContent  (utm_content)
  byCampaign: GaRow[];              // sessionCampaignName
  byPage: GaRow[];                  // pagePath
  error?: string;
};

/* 공개 화면(/traffic)은 기본으로 열려 있다. 닫아야 할 일이 생기면 TRAFFIC_PUBLIC=off — Redeploy 없이 다음 요청부터. */
export const trafficPublic = () => process.env.TRAFFIC_PUBLIC !== "off";

let cached: { at: number; v: TrafficSnapshot } | null = null;
const TTL = 5 * 60_000;

const num = (v: string | undefined) => Number(v ?? 0) || 0;

export const gaTraffic = async (): Promise<TrafficSnapshot> => {
  if (cached && Date.now() - cached.at < TTL) return cached.v;

  const today = kstToday();
  const base: TrafficSnapshot = {
    since: SINCE, today, fetchedAt: Date.now(), realtime: 0,
    data: build([], SINCE, today), byContent: [], byCampaign: [], byPage: [],
  };
  /* GA 없이 화면만 볼 때(로컬·스크린샷). 운영에는 넣지 않는다 — lib/ga-fixture.ts */
  if (process.env.GA_FIXTURE) {
    const f = fixture(SINCE, today);
    return { ...base, realtime: f.realtime, data: build(f.raw, SINCE, today, f.totals), byContent: f.byContent, byCampaign: f.byCampaign, byPage: f.byPage };
  }
  if (!gaConfigured()) return { ...base, error: `미연결 — ${gaMissing()}` };

  try {
    const [rt, total, rows, byContent, byCampaign, byPage] = await Promise.all([
      call("runRealtimeReport", { metrics: [{ name: "activeUsers" }] }),
      call("runReport", { dateRanges: RANGE, metrics: ["sessions", "activeUsers", "engagedSessions", "newUsers"].map((name) => ({ name })) }),
      /* 날짜 × 소스/매체 — 이 한 표에서 일·주·월·채널이 다 나온다. 하루 소스 수십 개 × 몇 달이라도 수천 행이다. */
      report(["date", "sessionSource", "sessionMedium"], ["sessions", "activeUsers", "newUsers", "engagedSessions"], "sessions", 5000),
      report(["sessionSource", "sessionMedium", "sessionManualAdContent"], ["sessions", "activeUsers"], "sessions", 30),
      report(["sessionCampaignName"], ["sessions", "activeUsers"], "sessions", 10),
      report(["pagePath"], ["screenPageViews", "activeUsers"], "screenPageViews", 12),
    ]);
    const t = total[0] ?? {};
    const raw: Raw[] = rows.map((r) => ({
      date: r.date, source: r.sessionSource, medium: r.sessionMedium,
      sessions: num(r.sessions), users: num(r.activeUsers), newUsers: num(r.newUsers), engaged: num(r.engagedSessions),
    }));
    const v: TrafficSnapshot = {
      ...base,
      realtime: num(rt[0]?.activeUsers),
      data: build(raw, SINCE, today, { users: num(t.activeUsers), newUsers: num(t.newUsers), engaged: num(t.engagedSessions) }),
      byContent, byCampaign, byPage,
    };
    cached = { at: Date.now(), v };
    return v;
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  }
};
