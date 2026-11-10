import { describe, it, expect } from "vitest";
import { landingSource, encodeSrc, decodeSrc, isDocumentRequest, DIRECT, INTERNAL } from "./traffic-source";
import { pivot, dailyTable, pivotTable, rawTable, toCsv, toUtf16, BEFORE, type SourceDayRow } from "./traffic-source-table";

const q = (s: string) => new URLSearchParams(s);
const L = (search: string, referer: string | null = null, cookie: string | null = null) =>
  landingSource({ search: q(search), referer, host: "wellbian.io", cookie });

describe("landingSource - 방문의 입구", () => {
  it("utm 이 먼저 - 매체·캠페인 같이", () => {
    expect(L("promo=PIXIE-F811&utm_source=pixie&utm_medium=kol&utm_campaign=prereg0907", "https://t.co/x"))
      .toEqual({ src: { source: "pixie", medium: "kol", campaign: "prereg0907" }, keep: true });
  });
  it("utm_medium 이 없으면 (not set) - KOL 링크 규약이 그렇다", () => {
    expect(L("utm_source=PIXIE-F811").src).toEqual({ source: "PIXIE-F811", medium: "(not set)", campaign: "" });
  });
  it("promo 만 있으면 promo:코드", () => {
    expect(L("promo=SUNNYSID-45D5").src.source).toBe("promo:SUNNYSID-45D5");
  });
  it("리퍼러 호스트 - www. 떼기, 검색엔진은 이름·organic", () => {
    expect(L("", "https://www.linkedin.com/feed/").src).toEqual({ source: "linkedin.com", medium: "referral", campaign: "" });
    expect(L("", "https://t.co/abc").src.source).toBe("t.co");
    expect(L("", "https://www.google.co.kr/").src).toEqual({ source: "google", medium: "organic", campaign: "" });
    expect(L("", "https://m.search.naver.com/search.naver?query=x").src).toEqual({ source: "naver", medium: "organic", campaign: "" });
  });
  it("리퍼러 전체 주소는 남기지 않는다(호스트만)", () => {
    expect(JSON.stringify(L("", "https://example.com/p?email=a@b.c").src)).not.toContain("email");
  });
  it("리퍼러·UTM 없으면 (direct), 쿠키가 있으면 그 입구를 잇는다", () => {
    expect(L("")).toEqual({ src: DIRECT, keep: true });
    const kept = encodeSrc({ source: "pixie", medium: "kol", campaign: "" });
    expect(L("", null, kept)).toEqual({ src: { source: "pixie", medium: "kol", campaign: "" }, keep: true });
  });
  it("사이트 안 이동은 새 입구가 아니다 - 쿠키 없으면 (internal) 이고 쿠키에 적지 않는다", () => {
    expect(L("", "https://wellbian.io/launch")).toEqual({ src: INTERNAL, keep: false });
    expect(L("", "https://admin.wellbianlabs.io/admin")).toEqual({ src: INTERNAL, keep: false });
    const kept = encodeSrc({ source: "t.co", medium: "referral", campaign: "" });
    expect(L("", "https://wellbian.io/", kept).src.source).toBe("t.co");
  });
  it("새 외부 입구는 쿠키를 덮는다", () => {
    const kept = encodeSrc({ source: "pixie", medium: "kol", campaign: "" });
    expect(L("utm_source=x&utm_medium=owned", null, kept).src.source).toBe("x");
  });
  it("값 정리 - 구분자·제어 문자 제거, 길이 제한", () => {
    const s = L(`utm_source=${encodeURIComponent("a|b\nc")}&utm_campaign=${"c".repeat(200)}`).src;
    expect(s.source).toBe("abc");
    expect(s.campaign.length).toBe(80);
  });
  it("encode/decode 왕복, 망가진 값은 null", () => {
    const s = { source: "채널명지정가능(예:XRPKOREA)", medium: "(not set)", campaign: "런치 0907" };
    expect(decodeSrc(encodeSrc(s))).toEqual(s);
    expect(decodeSrc("%E0%A4%A")).toBeNull();
    expect(decodeSrc("")).toBeNull();
  });
});

describe("isDocumentRequest", () => {
  const H = (o: Record<string, string>) => new Headers(o);
  it("주소창·링크로 여는 요청만", () => {
    expect(isDocumentRequest(H({ "sec-fetch-dest": "document" }), "GET", "/")).toBe(true);
    expect(isDocumentRequest(H({ accept: "text/html,application/xhtml+xml" }), "GET", "/launch")).toBe(true);
    expect(isDocumentRequest(H({ rsc: "1", accept: "text/html" }), "GET", "/launch")).toBe(false);
    expect(isDocumentRequest(H({ "next-router-prefetch": "1", "sec-fetch-dest": "document" }), "GET", "/")).toBe(false);
    expect(isDocumentRequest(H({ "sec-fetch-dest": "document" }), "POST", "/")).toBe(false);
    expect(isDocumentRequest(H({ "sec-fetch-dest": "document" }), "GET", "/api/x")).toBe(false);
    expect(isDocumentRequest(H({ accept: "*/*" }), "GET", "/")).toBe(false);
  });
});

describe("pivot / 내려받기", () => {
  const R = (day: string, source: string | null, medium: string, visitors: number, pages: number, campaign = ""): SourceDayRow =>
    ({ day, source, medium, campaign, visitors, pages });
  const rows = [
    R("2026-09-25", null, "", 200, 350),
    R("2026-09-26", "(direct)", "(none)", 20, 30),
    R("2026-09-26", "pixie", "kol", 5, 12, "prereg0907"),
    R("2026-09-26", "pixie", "(not set)", 2, 2),
    R("2026-09-26", "t.co", "referral", 9, 15),
    R("2026-09-20", "x", "owned", 3, 3),          // 30일 창 밖 날짜로 치고 days 에 없으면 버린다
  ];
  const days = ["2026-09-26", "2026-09-25"];
  it("방문자 - 줄은 합계순, (기록 전)은 맨 아래, 매체는 많은 순", () => {
    const p = pivot(rows, days, "visitors");
    expect(p.rows.map((r) => [r.source, r.total, r.cells])).toEqual([
      ["(direct)", 20, [20, 0]], ["t.co", 9, [9, 0]], ["pixie", 7, [7, 0]], [BEFORE, 200, [0, 200]],
    ]);
    expect(p.rows.find((r) => r.source === "pixie")?.mediums).toEqual(["kol", "(not set)"]);
    expect([p.colTotals, p.total]).toEqual([[36, 200], 236]);
    expect(p.rows.map((r) => r.quiet)).toEqual([true, false, false, true]);
  });
  it("페이지뷰", () => {
    const p = pivot(rows, days, "pages");
    expect(p.rows.map((r) => [r.source, r.total])).toEqual([["(direct)", 30], ["t.co", 15], ["pixie", 14], [BEFORE, 350]]);
  });
  it("파일 - 날짜 오름차순, 합계 줄", () => {
    const t = pivotTable(pivot(rows, days, "visitors"), "visitors");
    expect(t[0]).toEqual(["소스 (방문자)", "매체", "합계", "2026-09-25", "2026-09-26"]);
    expect(t[3]).toEqual(["pixie", "kol · (not set)", 7, 0, 7]);
    expect(t.at(-1)).toEqual(["합계", "", 236, 200, 36]);
    expect(rawTable(rows)[1]).toEqual(["2026-09-20", "x", "owned", "", 3, 3]);
    expect(rawTable(rows)[2]).toEqual(["2026-09-25", BEFORE, "", "", 200, 350]);
    expect(dailyTable({ "2026-09-26": { page: 87, api: 2547, bot: 21, visitors: 49 }, "2026-09-25": { page: 369, api: 5739, bot: 49, visitors: 210 } }))
      .toEqual([["날짜", "방문자", "페이지뷰", "API 호출", "봇"], ["2026-09-25", 210, 369, 5739, 49], ["2026-09-26", 49, 87, 2547, 21]]);
  });
  it("CSV 는 BOM·따옴표, 엑셀용은 UTF-16LE BOM + 탭", () => {
    const csv = toCsv([["a,b", 'say "hi"', 3]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('"a,b","say ""hi""",3');
    const u = toUtf16([["소스", 1]]);
    expect([u[0], u[1]]).toEqual([0xff, 0xfe]);
    expect(new TextDecoder("utf-16le").decode(u.subarray(2))).toBe("소스\t1");
  });
});
