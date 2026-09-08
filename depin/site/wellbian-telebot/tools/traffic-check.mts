/* 유입 집계 확인 (9/8)

   유입 화면은 틀려도 티가 안 난다 — 채널 하나가 엉뚱한 색으로 쌓여도 그럴듯해 보이고,
   그 그림을 보고 KOL 정산과 채널 판단을 하게 된다. 채널 판정·주 시작·일/주/월 묶기·KPI 를
   값으로 고정해 둔다. 도메인 목록이나 주 시작 규칙을 손대면 여기부터 돌려 볼 것.

   실행: npm run check */

import {
  channelOf, weekStart, monthKey, build, niceMax, kstToday, dayLong, weekLong, monthLong,
} from "../lib/traffic.ts";
import { trafficCsv, csvLines } from "../lib/traffic-csv.ts";

let fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { console.log(`✗ ${name}\n   got  ${g}\n   want ${w}`); fail++; }
  else console.log(`✓ ${name} = ${g}`);
};

/* 채널 판정 */
eq("x", channelOf("x", "owned"), "x");
eq("x_out", channelOf("x_out", "owned"), "x");
eq("t.co referral", channelOf("t.co", "referral"), "x");
eq("telegram", channelOf("telegram", "owned"), "telegram");
eq("linktree", channelOf("linktree", "owned"), "linktree");
eq("kol by medium", channelOf("xrpkorea", "kol"), "kol");
eq("kol2", channelOf("kol2", "kol"), "kol");
eq("instagram", channelOf("l.instagram.com", "referral"), "sns");
eq("linkedin app", channelOf("com.linkedin.android", "referral"), "sns");
eq("press chosun", channelOf("www.chosun.com", "referral"), "press");
eq("press naver news", channelOf("n.news.naver.com", "referral"), "press");
eq("search organic", channelOf("google", "organic"), "search");
eq("search naver", channelOf("m.search.naver.com", "referral"), "search");
eq("direct", channelOf("(direct)", "(none)"), "direct");
eq("google login back", channelOf("accounts.google.com", "referral"), "direct");
eq("tag assistant", channelOf("tagassistant.google.com", "referral"), "direct");
eq("not set", channelOf("(not set)", "(not set)"), "unset");
eq("unknown site", channelOf("example.org", "referral"), "other");
eq("case/space", channelOf(" Telegram ", "OWNED"), "telegram");

/* 날짜 */
eq("weekStart 화요일 → 월요일", weekStart("20260908"), "20260907");
eq("weekStart 월요일 그대로", weekStart("20260907"), "20260907");
eq("weekStart 일요일 → 전 월요일", weekStart("20260913"), "20260907");
eq("weekStart 월 경계", weekStart("20261001"), "20260928");
eq("monthKey", monthKey("20260908"), "202609");
eq("kstToday 자정 직후", kstToday(Date.UTC(2026, 8, 7, 15, 30)), "20260908");   // 9/7 15:30Z = 9/8 00:30 KST
eq("kstToday 자정 직전", kstToday(Date.UTC(2026, 8, 7, 14, 59)), "20260907");
eq("dayLong", dayLong("20260908"), "9/8 (화)");
eq("weekLong", weekLong("20260907"), "9/7~9/13 주");
eq("monthLong", monthLong("202609"), "2026년 9월");

/* 눈금 — 4칸으로 나눠도 정수 */
eq("niceMax 187", niceMax(187), 200);
eq("niceMax 28", niceMax(28), 32);
eq("niceMax 7", niceMax(7), 8);
eq("niceMax 9", niceMax(9), 12);
eq("niceMax 0", niceMax(0), 4);
eq("niceMax 100", niceMax(100), 100);
eq("niceMax 250", niceMax(250), 320);

/* 집계 */
const raw = [
  { date: "20260907", source: "x", medium: "owned", sessions: 10, users: 8, newUsers: 7, engaged: 2 },
  { date: "20260907", source: "x_out", medium: "owned", sessions: 3, users: 1, newUsers: 1, engaged: 0 },
  { date: "20260907", source: "(direct)", medium: "(none)", sessions: 100, users: 70, newUsers: 60, engaged: 1 },
  { date: "20260907", source: "(not set)", medium: "(not set)", sessions: 50, users: 40, newUsers: 0, engaged: 0 },
  { date: "20260908", source: "xrpkorea", medium: "kol", sessions: 4, users: 2, newUsers: 2, engaged: 0 },
  { date: "20260908", source: "telegram", medium: "owned", sessions: 1, users: 1, newUsers: 1, engaged: 0 },
  { date: "20260914", source: "linktree", medium: "owned", sessions: 6, users: 3, newUsers: 3, engaged: 0 },
  { date: "20260905", source: "x", medium: "owned", sessions: 99, users: 99, newUsers: 99, engaged: 99 },  // 기간 앞 — 버린다
  { date: "20260909", source: "x", medium: "owned", sessions: 0, users: 0, newUsers: 0, engaged: 0 },        // 0 행 — 무시
];
const t = build(raw, "2026-09-07", "20260915", { users: 120, newUsers: 70, engaged: 3 });
eq("daily 날 수 (9/7~9/15)", t.daily.length, 9);
eq("daily 키", t.daily.map((d) => d.key),
  ["20260907", "20260908", "20260909", "20260910", "20260911", "20260912", "20260913", "20260914", "20260915"]);
eq("daily 9/7 total", t.daily[0].total, 163);
eq("daily 9/7 by", t.daily[0].by, { x: 13, direct: 100, unset: 50 });
eq("daily 9/8 by", t.daily[1].by, { kol: 4, telegram: 1 });
eq("daily 빈 날 0", t.daily[2].total, 0);
eq("weekly 2주", t.weekly.map((w) => [w.key, w.total]), [["20260907", 168], ["20260914", 6]]);
eq("weekly 라벨", [t.weekly[0].label, t.weekly[0].long], ["9/7~", "9/7~9/13 주"]);
eq("monthly 1달", t.monthly.map((m) => [m.key, m.label, m.total]), [["202609", "9월", 174]]);
eq("kpi", t.kpi, { today: 0, week: 6, weekStart: "20260914", total: 174, users: 120, newUsers: 70, engaged: 3 });
eq("channels 세션순·비중", t.channels.map((c) => [c.key, c.sessions, c.share]),
  [["direct", 100, 57.5], ["unset", 50, 28.7], ["x", 13, 7.5], ["linktree", 6, 3.4], ["kol", 4, 2.3], ["telegram", 1, 0.6]]);
eq("sources 채널순→세션순", t.sources.map((s) => `${s.channel}:${s.source}`),
  ["x:x", "x:x_out", "telegram:telegram", "linktree:linktree", "kol:xrpkorea", "direct:(direct)", "unset:(not set)"]);
eq("since 정규화", t.since, "20260907");
eq("totals 없으면 소스 합", build(raw, "2026-09-07", "20260915").kpi.users, 125);

const e = build([], "2026-09-07", "20260907");
eq("빈 입력", [e.daily.length, e.weekly.length, e.channels.length, e.kpi.total], [1, 1, 0, 0]);
const f = build([], "2026-12-01", "20260907");
eq("since 가 미래면 오늘로", f.daily.length, 1);

/* CSV */
const snap = {
  since: "2026-09-07", today: "20260915", fetchedAt: 0, realtime: 3, data: t,
  byContent: [{ sessionSource: "x", sessionMedium: "owned", sessionManualAdContent: "thread_ko", sessions: "14", activeUsers: "9" },
              { sessionSource: "(direct)", sessionMedium: "(none)", sessionManualAdContent: "(not set)", sessions: "100", activeUsers: "70" }],
  byCampaign: [{ sessionCampaignName: "prereg0907", sessions: "17", activeUsers: "10" }],
  byPage: [{ pagePath: "/", screenPageViews: "228", activeUsers: "112" }],
};
const daily = trafficCsv(snap, "daily");
eq("csv 파일명", daily.name, "wellbian-traffic-daily-20260915.csv");
eq("csv BOM", daily.csv.charCodeAt(0), 0xfeff);
eq("csv 일별 머리", daily.csv.slice(1).split("\r\n")[0], "날짜,요일,세션,X,텔레그램,링크트리,KOL,다른 SNS,언론,검색,직접,기타 리퍼럴,출처 미확인");
eq("csv 일별 9/7 행", daily.csv.slice(1).split("\r\n")[1], "2026-09-07,월,163,13,0,0,0,0,0,0,100,0,50");
eq("csv 따옴표 이스케이프", csvLines([["a,b", 'say "hi"', 3]]), '"a,b","say ""hi""",3');
eq("csv utm_content 빈 값", trafficCsv(snap, "content").csv.slice(1).split("\r\n")[2], "직접,(direct),(none),,100,70");
const all = trafficCsv(snap, "all").csv;
eq("csv 전체 구역 수", (all.match(/^## /gm) ?? []).length, 8);
eq("csv 전체 첫 줄", all.slice(1).split("\r\n")[0], "wellbian.io 유입 · GA4");

console.log(fail ? `\n${fail} 개 실패` : "\n모두 통과");
process.exit(fail ? 1 : 0);
