/* 유입 집계 확인 (9/8)

   유입 화면은 틀려도 티가 안 난다 — 채널 하나가 엉뚱한 색으로 쌓여도 그럴듯해 보이고,
   그 그림을 보고 KOL 정산과 채널 판단을 하게 된다. 채널 판정·주 시작·일/주/월 묶기·KPI 를
   값으로 고정해 둔다. 도메인 목록이나 주 시작 규칙을 손대면 여기부터 돌려 볼 것.

   실행: npm run check */

import {
  channelOf, weekStart, monthKey, build, niceMax, kstToday, dayLong, weekLong, monthLong,
} from "../lib/traffic.ts";
import { trafficCsv, trafficCsv16, trafficXlsx, csvLines } from "../lib/traffic-csv.ts";
import { pivotSources, rollWeeks, rawRows, pivotRows, RAW_HEAD, isoWeekMonday, pivotUsers, pivotUsersRows } from "../lib/source-daily.ts";

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
/* 9/26 — 링크 규약(utm_source=핸들, 매체 없음)과 프로모 코드 소스가 기타 리퍼럴로 새던 것 */
eq("KOL 핸들(매체 없음)", channelOf("pixie", "(not set)"), "kol");
eq("KOL 핸들 대문자", channelOf("KOSO", "(not set)"), "kol");
eq("프로모 코드 소스", channelOf("PIXIE-F811", "(not set)"), "kol");
eq("프로모 코드 소스 2", channelOf("HONEYBAG-9086", "(not set)"), "kol");
eq("kol 번호 코드(매체 없음)", channelOf("kol3", "(not set)"), "kol");
eq("하이픈 도메인은 프로모 아님", channelOf("my-site.co.kr", "referral"), "other");
eq("결제창 복귀", channelOf("payment-gateway.tosspayments.com", "referral"), "direct");
eq("구글 로그인 복귀(.co.kr)", channelOf("accounts.google.co.kr", "referral"), "direct");
eq("개발 PC 포트", channelOf("localhost:3000", "referral"), "direct");
eq("data not available", channelOf("(data not available)", "(data not available)"), "unset");
eq("링크 틀 자리표시는 기타", channelOf("채널명지정가능(예:XRPKOREA)", "(not set)"), "other");
eq("모르는 코드는 기타", channelOf("gpa", "(not set)"), "other");
eq("매체 community 는 KOL(9/22~ 커뮤니티 링크)", channelOf("yunlog", "community"), "kol");

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
eq("csv 전체 구역 수", (all.match(/^## /gm) ?? []).length, 11);
eq("csv 전체 첫 줄", all.slice(1).split("\r\n")[0], "wellbian.io 유입 · GA4");

const u16 = trafficCsv16(snap, "daily");
eq("utf16 파일명", u16.name, "wellbian-traffic-daily-20260915-unicode.csv");
eq("utf16 BOM", [u16.data[0], u16.data[1]], [0xff, 0xfe]);
eq("utf16 첫 줄(탭)", u16.data.subarray(2).toString("utf16le").split("\r\n")[0].split("\t").slice(0, 3), ["날짜", "요일", "세션"]);
const xl = trafficXlsx(snap);
eq("xlsx 파일명", xl.name, "wellbian-traffic-20260915.xlsx");
eq("xlsx ZIP 서명", [xl.data[0], xl.data[1]], [0x50, 0x4b]);
eq("xlsx 끝 서명(중앙 디렉터리 끝)", xl.data.readUInt32LE(xl.data.length - 22), 0x06054b50);
eq("xlsx 항목 수(시트 12 + 부속 5 — 원자료 없이도 자리는 있다)", xl.data.readUInt16LE(xl.data.length - 12), 17);

/* 세션 소스 × 날짜 (9/26) — 8/20(목) 첫 유입 · 8/22(토) pixie 두 매체 · 8/24(월) 다음 주 */
const R = (date: string, source: string, medium: string, sessions: number, engaged: number, campaign = "(not set)") =>
  ({ date, source, medium, campaign, sessions, engaged, users: sessions, newUsers: 0, events: sessions * 5, engageSec: sessions * 60, keyEvents: 0, revenue: 0 });
const sraw = [
  R("20260805", "(direct)", "(none)", 0, 0),                  // 0 세션 — 첫 유입일 계산에서 빠진다
  R("20260820", "(direct)", "(none)", 5, 3, "(direct)"),
  R("20260822", "pixie", "(not set)", 2, 1),
  R("20260822", "pixie", "kol", 3, 3, "prereg0907"),
  R("20260824", "(direct)", "(none)", 7, 2, "(direct)"),
  R("20260826", "x", "owned", 4, 4),                          // 오늘 뒤 — 버린다
];
const sp = pivotSources(sraw, "2026-08-01", "20260825");
eq("sd 열 = 첫 유입일~오늘", sp.cols.map((c) => c.key), ["20260820", "20260821", "20260822", "20260823", "20260824", "20260825"]);
eq("sd 주말 표시", sp.cols.map((c) => c.off), [false, false, true, true, false, false]);
eq("sd 행 = 합계순", sp.rows.map((r) => [r.source, r.total, r.channel]), [["(direct)", 12, "direct"], ["pixie", 5, "kol"]]);
eq("sd 칸", sp.rows.map((r) => r.cells), [[5, 0, 0, 0, 7, 0], [0, 0, 5, 0, 0, 0]]);
eq("sd 매체 = 세션 많은 순", sp.rows[1].mediums, ["kol", "(not set)"]);
eq("sd 열 합 · 전체", [sp.colTotals, sp.total], [[5, 0, 5, 0, 7, 0], 17]);
const sw = rollWeeks(sp);
eq("sd 주별 열", sw.cols.map((c) => [c.key, c.label]), [["20260817", "8/17~"], ["20260824", "8/24~"]]);
eq("sd 주별 칸", sw.rows.map((r) => r.cells), [[5, 7], [5, 0]]);
eq("sd 주별 열 합", [sw.colTotals, sw.total], [[10, 7], 17]);
eq("sd 빈 입력", (() => { const e = pivotSources([], "2026-08-01", "20260825"); return [e.cols.length, e.rows.length, e.total]; })(), [1, 0, 0]);
const rr = rawRows(sraw, true);
eq("원자료 머리 열 수", rr[0].length, 16);
eq("원자료 줄 수(0 세션 포함, 기간 거르기 없음)", rr.length - 1, 6);
eq("원자료 날짜순→세션순", rr.slice(1, 5).map((r) => `${r[0]}:${r[2]}:${r[3]}`),
  ["2026-08-05:(direct):(none)", "2026-08-20:(direct):(none)", "2026-08-22:pixie:kol", "2026-08-22:pixie:(not set)"]);
eq("원자료 한 줄", rr[3], ["2026-08-22", "토", "pixie", "kol", "prereg0907", "KOL", 3, 3, 100, 3, 0, 15, 5, 60, 0, 0]);
eq("원자료 0 세션 줄 비율은 빈칸", [rr[1][8], rr[1][12], rr[1][13]], ["", "", ""]);
eq("원자료 full=false 면 주요 이벤트·수익 빈칸", rawRows(sraw, false)[3].slice(-2), ["", ""]);
eq("원자료 머리", RAW_HEAD.slice(0, 6), ["날짜", "요일", "세션 소스", "세션 매체", "세션 캠페인", "채널"]);
const pr = pivotRows(sp);
eq("소스×일자 머리", pr[0], ["세션 소스", "매체", "채널", "합계", "참여율(%)", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25"]);
eq("소스×일자 pixie", pr[2], ["pixie", "kol · (not set)", "KOL", 5, 80, 0, 0, 5, 0, 0, 0]);
eq("소스×일자 합계 줄", pr[3], ["합계", "", "", 17, 52.9, 5, 0, 5, 0, 7, 0]);

const sd = { since: "2026-08-01", today: "20260825", fetchedAt: 0, rows: sraw, full: true };
eq("csv 원자료 파일명", trafficCsv(snap, "raw", sd).name, "wellbian-traffic-raw-20260915.csv");
eq("csv 원자료 첫 줄", trafficCsv(snap, "raw", sd).csv.slice(1).split("\r\n")[0].split(",").slice(0, 3), ["날짜", "요일", "세션 소스"]);
eq("csv 소스×일자 둘째 줄", trafficCsv(snap, "srcdaily", sd).csv.slice(1).split("\r\n")[1], "(direct),(none),직접,12,41.7,5,0,0,0,7,0");
eq("csv 전체 구역 수(원자료 포함)", (trafficCsv(snap, "all", sd).csv.match(/^## /gm) ?? []).length, 11);
eq("csv 전체 — 원자료 못 읽으면 한 줄", trafficCsv(snap, "all", { ...sd, error: "x" }).csv.includes("GA 원자료를 읽지 못했습니다"), true);
const xl2 = trafficXlsx(snap, sd);
eq("xlsx 항목 수(시트 12 + 부속 5)", xl2.data.readUInt16LE(xl2.data.length - 12), 17);

/* 사용자 (9/26 — "사용자수 기준이야") — 칸은 날짜 × 소스, 합계는 GA 중복 제거 값 */
eq("ISO 주 → 월요일 2026-37", isoWeekMonday("202637"), "20260907");
eq("ISO 주 → 월요일 2026-01(전해 12/29)", isoWeekMonday("202601"), "20251229");
eq("ISO 주 → 월요일 2020-53", isoWeekMonday("202053"), "20201228");
const su = {
  cells: [
    { date: "20260820", source: "(direct)", users: 4 }, { date: "20260824", source: "(direct)", users: 6 },
    { date: "20260822", source: "pixie", users: 4 }, { date: "20260819", source: "pixie", users: 9 },   // 표 앞날 — 버린다
  ],
  bySource: { "(direct)": 8, pixie: 4 },
  byDay: { "20260820": 4, "20260822": 4, "20260824": 6 },
  total: 11,
  week: { cells: [{ week: "20260817", source: "(direct)", users: 4 }, { week: "20260817", source: "pixie", users: 4 }, { week: "20260824", source: "(direct)", users: 5 }],
          byWeek: { "20260817": 7, "20260824": 5 } },
};
const pu = pivotUsers(sp, su)!;
eq("사용자 줄 = 기간 사용자(중복 제거)순", pu.rows.map((r) => [r.source, r.total, r.channel]), [["(direct)", 8, "direct"], ["pixie", 4, "kol"]]);
eq("사용자 칸", pu.rows.map((r) => r.cells), [[4, 0, 0, 0, 6, 0], [0, 0, 4, 0, 0, 0]]);
eq("사용자 합계 줄·총계 = GA 중복 제거", [pu.colTotals, pu.total], [[4, 0, 4, 0, 6, 0], 11]);
eq("사용자 매체는 세션 표에서", pu.rows[1].mediums, ["kol", "(not set)"]);
const puw = pivotUsers(rollWeeks(sp), su)!;
eq("사용자 주별 칸·합계", [puw.rows.map((r) => r.cells), puw.colTotals], [[[4, 5], [4, 0]], [7, 5]]);
eq("주별 사용자 없으면 주 단위 null", pivotUsers(rollWeeks(sp), { ...su, week: undefined }), null);
const pur = pivotUsersRows(pu);
eq("사용자 파일 머리", pur[0].slice(0, 5), ["세션 소스", "매체", "채널", "사용자(기간·중복 제거)", "2026-08-20"]);
eq("사용자 파일 합계 줄", pur.at(-1), ["합계(날짜별 중복 제거)", "", "", 11, 4, 0, 4, 0, 6, 0]);
eq("csv 사용자 표", trafficCsv(snap, "srcusers", { ...sd, users: su }).csv.slice(1).split("\r\n")[1], "(direct),(none),직접,8,4,0,0,0,6,0");
eq("csv 사용자 못 읽으면 한 줄", trafficCsv(snap, "srcusers", { ...sd, usersNote: "x" }).csv.includes("GA 사용자 수를 읽지 못했습니다 — x"), true);

console.log(fail ? `\n${fail} 개 실패` : "\n모두 통과");
process.exit(fail ? 1 : 0);
