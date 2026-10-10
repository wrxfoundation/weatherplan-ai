/**
 * 유입 소스 (2026-09-26) — 자체 트래픽 계측(lib/traffic.ts)에 "어디서 왔나"를 더한다.
 * 관리자 "시스템·용량" 탭에서 일자별 방문자·페이지뷰를 소스별로 보고 내려받기 위한 것이다.
 *
 * 방문의 입구는 문서 요청(주소창·링크로 페이지를 여는 요청)에서 미들웨어가 정한다.
 *   ① utm_source 가 있으면 그것 - utm_medium · utm_campaign 을 같이 적는다
 *   ② 없고 promo 만 있으면 "promo:코드" (KOL 링크 규약은 promo + utm_source 지만 promo 만 도는 링크도 있다)
 *   ③ 없으면 리퍼러 호스트 - www. 는 떼고, 검색엔진은 이름으로(google · naver · daum · bing …, 매체 organic)
 *   ④ 리퍼러도 없으면 "(direct)" - 주소 직접 입력, 텔레그램·카카오톡 앱 안 브라우저처럼 리퍼러를 안 보내는 곳
 * 우리 주소에서 온 요청(사이트 안 이동)과 리퍼러 없는 재방문은 새 입구가 아니다 - 30분 쿠키(wb_src)에 남은
 * 입구를 잇는다(GA 가 직접 유입으로 캠페인을 덮어쓰지 않는 것과 같은 원리). 쿠키도 없는 사이트 안 이동은
 * "(internal)" - 휴대폰 망이 바뀌어 방문자 해시가 새로 생긴 경우 등이다.
 *
 * 저장하는 것은 소스·매체·캠페인 문자열뿐이다. 리퍼러 전체 주소는 쿼리에 개인정보가 섞일 수 있어 남기지 않는다.
 * 이 파일은 미들웨어(엣지)에서도 돌므로 Node 전용 API 를 쓰지 않는다.
 */
export type Src = { source: string; medium: string; campaign: string };

export const SRC_COOKIE = "wb_src";
export const SRC_HEADER = "x-wb-src";
export const SRC_TTL_SEC = 30 * 60;

/* 우리 주소 - wellbian.io · admin.wellbianlabs.io · 옛 wlbn.wellbianlabs.io 와 그 하위 */
const OWN = /(^|\.)wellbian\.io$|(^|\.)wellbianlabs\.io$/;
const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "google"], [/(^|\.)naver\.com$/, "naver"], [/(^|\.)daum\.net$/, "daum"],
  [/(^|\.)bing\.com$/, "bing"], [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"], [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
];

/* 제어 문자와 구분자(|)는 빼고 길이를 자른다 - 헤더·쿠키·DB 어디에 들어가도 안전하게 */
export const clean = (v: string | null | undefined, max = 60) =>
  (v ?? "").replace(/[\u0000-\u001f\u007f|]/g, "").trim().slice(0, max);

export const encodeSrc = (s: Src) => [s.source, s.medium, s.campaign].map((x) => encodeURIComponent(x)).join("|");
export const decodeSrc = (v: string | null | undefined): Src | null => {
  if (!v) return null;
  const [a = "", b = "", c = ""] = v.split("|");
  try {
    const source = clean(decodeURIComponent(a));
    if (!source) return null;
    return { source, medium: clean(decodeURIComponent(b)), campaign: clean(decodeURIComponent(c), 80) };
  } catch {
    return null;
  }
};

const refHost = (referer: string | null | undefined): string => {
  if (!referer) return "";
  try {
    const u = new URL(referer);
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname.toLowerCase() : "";
  } catch {
    return "";
  }
};

export const DIRECT: Src = { source: "(direct)", medium: "(none)", campaign: "" };
export const INTERNAL: Src = { source: "(internal)", medium: "(none)", campaign: "" };

/**
 * 이 문서 요청의 입구.
 *  keep = 쿠키에 적어(또는 30분 연장해) 둘 값인가 - 사이트 안 이동으로 정해진 (internal) 만 적지 않는다.
 */
export function landingSource(input: {
  search: URLSearchParams; referer?: string | null; host: string; cookie?: string | null;
}): { src: Src; keep: boolean } {
  const { search, referer, host, cookie } = input;
  const utm = clean(search.get("utm_source"));
  if (utm) {
    return { src: { source: utm, medium: clean(search.get("utm_medium")) || "(not set)", campaign: clean(search.get("utm_campaign"), 80) }, keep: true };
  }
  const promo = clean(search.get("promo"), 40);
  if (promo) return { src: { source: `promo:${promo}`, medium: "(not set)", campaign: "" }, keep: true };

  const ref = refHost(referer);
  const self = host.split(":")[0].toLowerCase();
  if (ref && ref !== self && !OWN.test(ref)) {
    const se = SEARCH.find(([re]) => re.test(ref));
    return { src: se ? { source: se[1], medium: "organic", campaign: "" } : { source: ref.replace(/^www\./, ""), medium: "referral", campaign: "" }, keep: true };
  }
  const kept = decodeSrc(cookie);
  if (kept) return { src: kept, keep: true };
  return ref ? { src: INTERNAL, keep: false } : { src: DIRECT, keep: true };
}

/** 페이지를 여는 요청인가 - 화면 전환용 RSC 요청·미리 불러오기·API 는 입구가 아니다. */
export function isDocumentRequest(h: Headers, method: string, pathname: string): boolean {
  if (method !== "GET" || pathname.startsWith("/api") || pathname.startsWith("/_next")) return false;
  if (h.get("rsc") || h.get("next-router-prefetch") || h.get("purpose") === "prefetch") return false;
  return h.get("sec-fetch-dest") === "document" || (h.get("accept") ?? "").includes("text/html");
}
