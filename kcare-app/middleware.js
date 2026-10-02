// 베타 잠금 — BETA_REQUIRE_LOGIN=1 이면 로그인(테스트 계정 또는 구글)을 해야 화면이 열린다.
// 기본은 꺼져 있다 (토스 심사·시연처럼 누구나 봐야 하는 때가 있어서).
// 로그인 설정(NEXTAUTH_SECRET + 테스트 비밀번호 또는 구글 키)이 없으면 잠그지 않는다 — 잠그면 아무도 못 들어온다.
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { betaGateOn, isAllowedToken, isPublicPath } from "./lib/auth-server";

export async function middleware(req) {
  if (!betaGateOn()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const ok = isAllowedToken(token);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "login-required" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}${token ? "&error=NotAllowed" : ""}`;
  return NextResponse.redirect(url);
}

// 정적 파일·Next 내부 경로는 검사하지 않는다 (public 의 이미지·영상·지도 타일·manifest 등)
export const config = {
  matcher: [
    "/((?!_next/|favicon|brand/|demo/|hero/|bg/|tiles/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|mp4|webm|wav|mp3|ico|txt|xml|json|webmanifest|woff2?|css|js|map)$).*)",
  ],
};
