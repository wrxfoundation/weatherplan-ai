/* GA 없이 유입 화면을 볼 때 쓰는 가짜 자료 (9/8)

   GA_FIXTURE=1 로 켠다 — 로컬에서 화면을 만지거나 스크린샷을 찍을 때. 운영 Vercel 에는 절대 넣지 않는다.
   숫자는 9/7~9/8 실제 분포를 흉내 낸 것이다(첫날 몰림 → 완만한 감소, 직접 절반 · 출처 미확인 3할 · UTM 은 한 자리).
   날짜는 집계 시작일부터 오늘까지 채우므로 일·주·월 탭이 다 채워져 보인다. 난수는 씨앗 고정 — 켤 때마다 같다. */

import type { GaRow } from "./ga";
import type { Raw } from "./traffic";
import type { SrcRaw } from "./source-daily";

const SOURCES: [string, string, number][] = [
  ["(direct)", "(none)", 0.44],
  ["(not set)", "(not set)", 0.30],
  ["x", "owned", 0.05],
  ["x_out", "owned", 0.02],
  ["telegram", "owned", 0.04],
  ["linktree", "owned", 0.04],
  ["xrpkorea", "kol", 0.03],
  ["accounts.google.com", "referral", 0.03],
  ["instagram.com", "referral", 0.01],
  ["google", "organic", 0.02],
  ["www.chosun.com", "referral", 0.01],
  ["t.co", "referral", 0.01],
];

const addDays = (k: string, n: number) => {
  const d = new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

export const fixture = (sinceIso: string, today: string) => {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const since = sinceIso.replace(/-/g, "");
  const raw: Raw[] = [];
  let i = 0;
  for (let k = since; k <= today; k = addDays(k, 1), i++) {
    const dow = new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8))).getUTCDay();
    const base = i === 0 ? 187 : Math.round(60 * Math.exp(-i / 6) + 22 + (dow === 0 || dow === 6 ? -6 : 0) + rnd() * 10);
    for (const [source, medium, w] of SOURCES) {
      const sessions = Math.round(base * w * (0.7 + rnd() * 0.6));
      if (!sessions) continue;
      const users = Math.max(1, Math.round(sessions * (0.55 + rnd() * 0.25)));
      raw.push({ date: k, source, medium, sessions, users, newUsers: Math.round(users * 0.8), engaged: Math.round(sessions * 0.02) });
    }
  }
  const sessions = raw.reduce((a, r) => a + r.sessions, 0);
  const totals = { users: Math.round(sessions * 0.6), newUsers: Math.round(sessions * 0.5), engaged: Math.round(sessions * 0.02) };
  const row = (o: Record<string, string | number>): GaRow => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
  const byContent: GaRow[] = [
    row({ sessionSource: "(direct)", sessionMedium: "(none)", sessionManualAdContent: "(not set)", sessions: Math.round(sessions * 0.44), activeUsers: Math.round(sessions * 0.3) }),
    row({ sessionSource: "(not set)", sessionMedium: "(not set)", sessionManualAdContent: "(not set)", sessions: Math.round(sessions * 0.3), activeUsers: Math.round(sessions * 0.2) }),
    row({ sessionSource: "x", sessionMedium: "owned", sessionManualAdContent: "thread_ko", sessions: 14, activeUsers: 9 }),
    row({ sessionSource: "x", sessionMedium: "owned", sessionManualAdContent: "thread_en", sessions: 6, activeUsers: 4 }),
    row({ sessionSource: "telegram", sessionMedium: "owned", sessionManualAdContent: "video", sessions: 9, activeUsers: 7 }),
    row({ sessionSource: "linktree", sessionMedium: "owned", sessionManualAdContent: "(not set)", sessions: 12, activeUsers: 6 }),
    row({ sessionSource: "xrpkorea", sessionMedium: "kol", sessionManualAdContent: "x", sessions: 8, activeUsers: 5 }),
  ];
  const byCampaign: GaRow[] = [
    row({ sessionCampaignName: "(direct)", sessions: Math.round(sessions * 0.44), activeUsers: Math.round(sessions * 0.3) }),
    row({ sessionCampaignName: "(not set)", sessions: Math.round(sessions * 0.3), activeUsers: Math.round(sessions * 0.2) }),
    row({ sessionCampaignName: "prereg0907", sessions: 49, activeUsers: 31 }),
    row({ sessionCampaignName: "(referral)", sessions: 21, activeUsers: 15 }),
  ];
  const byPage: GaRow[] = [
    row({ pagePath: "/", screenPageViews: 228, activeUsers: 112 }),
    row({ pagePath: "/my", screenPageViews: 144, activeUsers: 24 }),
    row({ pagePath: "/token", screenPageViews: 70, activeUsers: 25 }),
    row({ pagePath: "/launch", screenPageViews: 39, activeUsers: 23 }),
    row({ pagePath: "/redeem", screenPageViews: 22, activeUsers: 9 }),
    row({ pagePath: "/membership", screenPageViews: 16, activeUsers: 13 }),
  ];
  return { raw, totals, byContent, byCampaign, byPage, realtime: 7 };
};

/* 「세션 소스 × 날짜」 표용 (9/26). 소스 이름은 실제로 보인 모양을 흉내 냈다 — X 네 갈래(x · x_out · t.co · xpurchase),
   KOL 핸들과 대문자 프로모 코드(9/15~), 결제창 복귀, 구글 로그인 복귀, 개발 PC, 링크 틀 자리표시 문구가 그대로 배포된 것.
   숫자는 가짜다. 주요 이벤트·수익은 0 — 지금 GA 가 실제로 그렇다(구매가 주요 이벤트로 표시되지 않음). */
const SRC: { source: string; medium: string; campaign: string; w: number; from?: string; to?: string }[] = [
  { source: "(direct)", medium: "(none)", campaign: "(direct)", w: 0.46 },
  { source: "(not set)", medium: "(not set)", campaign: "(not set)", w: 0.1 },
  { source: "accounts.google.com", medium: "referral", campaign: "(referral)", w: 0.07, from: "20260907" },
  { source: "kol3", medium: "(not set)", campaign: "(not set)", w: 0.05, from: "20260910" },
  { source: "xrpkorea", medium: "kol", campaign: "prereg0907", w: 0.04, from: "20260907" },
  { source: "linktree", medium: "owned", campaign: "prereg0907", w: 0.03, from: "20260907" },
  { source: "telegram", medium: "owned", campaign: "prereg0907", w: 0.025, from: "20260907" },
  { source: "gpa", medium: "(not set)", campaign: "(not set)", w: 0.05, from: "20260916", to: "20260919" },
  { source: "x", medium: "owned", campaign: "prereg0907", w: 0.012, from: "20260907" },
  { source: "x_out", medium: "owned", campaign: "prereg0907", w: 0.01, from: "20260908" },
  { source: "t.co", medium: "referral", campaign: "(referral)", w: 0.006 },
  { source: "xpurchase", medium: "owned", campaign: "prereg0907", w: 0.005, from: "20260915" },
  { source: "sw", medium: "(not set)", campaign: "(not set)", w: 0.012, from: "20260913" },
  { source: "psw", medium: "(not set)", campaign: "(not set)", w: 0.012, from: "20260913" },
  { source: "PIXIE-F811", medium: "(not set)", campaign: "(not set)", w: 0.02, from: "20260915" },
  { source: "BINYL-1B33", medium: "(not set)", campaign: "(not set)", w: 0.012, from: "20260915" },
  { source: "HONEYBAG-9086", medium: "(not set)", campaign: "(not set)", w: 0.008, from: "20260915" },
  { source: "KOSO-3BEA", medium: "(not set)", campaign: "(not set)", w: 0.006, from: "20260916" },
  { source: "pixie", medium: "(not set)", campaign: "(not set)", w: 0.01, from: "20260918" },
  { source: "koso", medium: "(not set)", campaign: "(not set)", w: 0.008, from: "20260918" },
  { source: "payment-gateway.tosspayments.com", medium: "referral", campaign: "(referral)", w: 0.012, from: "20260915" },
  { source: "kakao", medium: "owned", campaign: "(not set)", w: 0.008, from: "20260909" },
  { source: "google", medium: "organic", campaign: "(organic)", w: 0.012 },
  { source: "naver", medium: "organic", campaign: "(organic)", w: 0.006 },
  { source: "kweather", medium: "(not set)", campaign: "(not set)", w: 0.005, from: "20260907" },
  { source: "localhost:3000", medium: "referral", campaign: "(referral)", w: 0.004, from: "20260905", to: "20260912" },
  { source: "채널명지정가능(예:XRPKOREA)", medium: "(not set)", campaign: "(not set)", w: 0.004, from: "20260908", to: "20260912" },
];

export const fixtureSourceDaily = (sinceIso: string, today: string): SrcRaw[] => {
  let seed = 11;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const out: SrcRaw[] = [];
  let i = 0;
  /* 8/20 전에는 방문이 없었던 것으로 — 표가 첫 유입일부터 열을 자르는지 보인다 */
  for (let k = sinceIso.replace(/-/g, ""); k <= today; k = addDays(k, 1)) {
    if (k < "20260820") continue;
    const pre = k < "20260907";
    const dow = new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8))).getUTCDay();
    const base = pre ? 3 + rnd() * 4 : Math.round((i === 0 ? 190 : 150 + 70 * Math.exp(-i / 5)) * (dow === 0 || dow === 6 ? 0.85 : 1) + rnd() * 30);
    if (!pre) i++;
    for (const s of SRC) {
      if ((s.from && k < s.from) || (s.to && k > s.to)) continue;
      if (pre && s.source !== "(direct)" && s.source !== "(not set)" && s.source !== "localhost:3000") continue;
      const sessions = Math.round(base * s.w * (0.5 + rnd()));
      if (!sessions) continue;
      const engaged = Math.round(sessions * (0.35 + rnd() * 0.45));
      const users = Math.max(1, Math.round(sessions * (0.7 + rnd() * 0.25)));
      out.push({
        date: k, source: s.source, medium: s.medium, campaign: s.campaign,
        sessions, engaged, users, newUsers: Math.round(users * 0.75),
        events: Math.round(sessions * (4 + rnd() * 4)), engageSec: Math.round(sessions * (30 + rnd() * 90)),
        keyEvents: 0, revenue: 0,
      });
    }
  }
  return out;
};
