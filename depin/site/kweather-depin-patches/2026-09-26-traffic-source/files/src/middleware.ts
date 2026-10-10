import { NextResponse, type NextRequest } from "next/server";
import { SRC_COOKIE, SRC_HEADER, SRC_TTL_SEC, encodeSrc, isDocumentRequest, landingSource } from "@/lib/traffic-source";

/**
 * 주소로 화면을 가른다.
 *
 *   admin.wellbianlabs.io   운영 콘솔 전용. 루트로 들어오면 /admin 으로 보내고,
 *                           일반 이용자 화면(마이페이지·리딤·DeFi 등)은 막는다.
 *   wellbian.io (구 wlbn.wellbianlabs.io)  일반 이용자용. /admin 은 노출하지 않는다.
 *
 * 이건 화면 분리이지 인증이 아니다 - 실제 권한은 각 /api/admin/* 라우트가
 * `x-admin-secret` 으로 확인한다(미들웨어를 우회해도 API는 뚫리지 않는다).
 */
const ADMIN_HOSTS = new Set(["admin.wellbianlabs.io"]);

/** 기기·외부 연동 전용. 화면은 없고 /api/v1/* 만 응답한다. */
const API_HOSTS = new Set(["api.wellbianlabs.io"]);

/**
 * 옛 주소는 본 주소로 넘긴다.
 *
 * 같은 사이트가 두 주소로 떠 있으면 두 가지가 깨진다.
 *  ① 구글 로그인 - redirect_uri 는 접속한 주소로 만들어지는데, 구글 콘솔에 등록된
 *     것은 wellbian.io 하나뿐이다. 옛 주소로 들어온 사람은 로그인을 누르는 순간
 *     구글의 영문 오류 화면(400 redirect_uri_mismatch)에 떨어진다(2026-09-11 확인).
 *  ② 간편지갑 - 지갑은 브라우저에 주소(origin)별로 저장된다. 두 주소를 오가면
 *     한쪽에서 만든 지갑이 다른 쪽에서는 없는 것으로 보인다.
 *
 * 그래서 하나로 모은다. 경로와 쿼리는 그대로 살려 보낸다 - 옛 주소로 공유된 링크가
 * 엉뚱한 데로 떨어지지 않게.
 */
const LEGACY_HOSTS = new Set(["wlbn.wellbianlabs.io"]);
const CANONICAL_HOST = "wellbian.io";

/** 관리자 주소에서 열어줄 경로 - 나머지는 콘솔로 되돌린다. */
const ADMIN_ALLOWED = [/^\/admin(\/|$)/, /^\/api\//, /^\/brand\//, /^\/_next\//, /^\/favicon/];

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = req.nextUrl;
  const isAdminHost = ADMIN_HOSTS.has(host);

  /* 옛 주소 → 본 주소. 영구 이동(308)이라 브라우저·검색엔진이 기억한다.
     308 은 메서드와 본문을 보존하므로 POST 로 들어온 요청도 잃지 않는다. */
  if (LEGACY_HOSTS.has(host)) {
    const u = new URL(req.url);
    u.protocol = "https:";
    u.host = CANONICAL_HOST;
    u.port = "";
    return NextResponse.redirect(u, 308);
  }

  // api.wellbianlabs.io 는 공개 기기 API 만 연다.
  // 루트 경로 없이 /v1/... 로 부를 수 있게 내부적으로 /api/v1/... 로 넘긴다.
  if (API_HOSTS.has(host)) {
    // 개발자가 API 주소에서 바로 규격서를 찾을 수 있게 /docs 를 열어둔다.
    if (pathname === "/docs" || pathname === "/docs/") {
      const u = req.nextUrl.clone();
      u.pathname = "/docs/device-api.html";
      return NextResponse.rewrite(u);
    }
    if (pathname.startsWith("/docs/")) return NextResponse.next();
    if (pathname.startsWith("/api/v1/")) return NextResponse.next();
    // /v1/c 는 실제 라우트가 있다. 리라이트를 태우면 쿼리가 정규화되면서
    // base64 페이로드가 망가지므로 손대지 않고 그대로 통과시킨다.
    if (pathname === "/v1/c") return NextResponse.next();
    if (pathname.startsWith("/v1/")) {
      // 쿼리를 한 글자도 건드리지 않고 경로만 바꾼다.
      //
      // nextUrl.clone() 을 쓰면 안 된다. NextURL 은 쿼리를 URLSearchParams 로
      // 파싱했다가 다시 직렬화하는데, 기기는 base64 페이로드를 key=value 가 아닌
      // 통짜 토큰으로 보낸다(?SUFSQVc...). 그러면 "값 없는 키"로 취급돼 재직렬화
      // 과정에서 통째로 사라진다. 실측:
      //     ?ABC     -> (빈 쿼리)      ?ABC=    -> (빈 쿼리)
      //     ?ABC==   -> ?ABC=%3D       ?AB+CD   -> ?AB+CD=&AB+CD=
      // base64 패딩은 길이에 따라 0/1/2 개로 갈리므로 3건 중 2건이 측정값을
      // 잃었다(2026-09-04 확인, 손실률 54~62%).
      const raw = req.url;
      const q = raw.indexOf("?");
      const search = q >= 0 ? raw.slice(q) : "";
      return NextResponse.rewrite(`${req.nextUrl.origin}/api${pathname}${search}`);
    }
    return new NextResponse(
      JSON.stringify({ ok: false, error: "NOT_FOUND", docs: "https://wellbian.io/support" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  if (isAdminHost) {
    if (pathname === "/") {
      const u = req.nextUrl.clone();
      u.pathname = "/admin";
      return NextResponse.redirect(u);
    }
    if (!ADMIN_ALLOWED.some((re) => re.test(pathname))) {
      const u = req.nextUrl.clone();
      u.pathname = "/admin";
      return NextResponse.redirect(u);
    }
    return NextResponse.next();
  }

  // 일반 주소에서는 운영 콘솔을 감춘다 - 관리자 주소로 안내
  if (/^\/admin(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL("https://admin.wellbianlabs.io/admin"));
  }

  // 마케팅 전략 계획서 덱(public/marketing/index.html, 정적 HTML).
  // /docs 와 같은 방식 - 확장자 없는 /marketing 으로 열면 index.html 을 돌려준다.
  if (pathname === "/marketing" || pathname === "/marketing/") {
    const u = req.nextUrl.clone();
    u.pathname = "/marketing/index.html";
    return NextResponse.rewrite(u);
  }

  // 유입 소스(2026-09-26) - 페이지를 여는 요청에서 방문의 입구(utm·promo·리퍼러)를 정해 레이아웃의
  // 페이지뷰 기록으로 넘긴다(lib/traffic-source.ts). 밖에서 같은 이름의 헤더를 보내 와도 믿지 않는다.
  const reqHeaders = new Headers(req.headers);
  reqHeaders.delete(SRC_HEADER);
  const landing = isDocumentRequest(req.headers, req.method, pathname)
    ? landingSource({ search: req.nextUrl.searchParams, referer: req.headers.get("referer"), host, cookie: req.cookies.get(SRC_COOKIE)?.value })
    : null;
  if (landing) reqHeaders.set(SRC_HEADER, encodeSrc(landing.src));

  // 접속 IP 국가 기반 자동 언어 - 처음 방문(쿠키 없음)에만 심는다.
  // 수동 언어 선택은 localStorage에 저장되어 이 쿠키보다 항상 우선한다(i18n.tsx).
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  if (landing?.keep) {
    res.cookies.set(SRC_COOKIE, encodeSrc(landing.src), {
      path: "/", maxAge: SRC_TTL_SEC, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production",
    });
  }
  if (!req.cookies.get("kw_locale")) {
    const country = (req.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
    const lang =
      country === "KR" ? "ko"
      : country === "JP" ? "ja"
      : ["CN", "TW", "HK", "MO", "SG"].includes(country) ? "zh"
      : ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR"].includes(country) ? "es"
      : "en"; // 디폴트 영어
    res.cookies.set("kw_locale", lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|toml)$).*)"],
};
