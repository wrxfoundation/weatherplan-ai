// 로그인 — 구글 계정 (NextAuth). 베타 잠금(BETA_REQUIRE_LOGIN=1)이 켜지면 여기로 모인다.
//
// 세 가지 상태를 정직하게 보여 준다:
//  · 설정 전   — 구글 키가 배포 환경에 없다. 무엇을 넣어야 하는지 안내한다 (가짜 로그인을 하지 않는다)
//  · 로그인 전 — 'Google 계정으로 계속하기'
//  · 로그인됨  — 이름·이메일 · 계속하기 · 로그아웃
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "../components/Logo";
import { AUTH_ENABLED, GoogleMark, googleSignIn, logout, safeCallback, useAuth } from "../lib/auth";

// NextAuth 가 돌려주는 오류 코드 → 사람이 읽는 말
const ERRORS = {
  NotAllowed: "허용된 계정이 아닙니다. 관리자에게 계정 추가를 요청해 주세요.",
  AccessDenied: "허용된 계정이 아닙니다. 관리자에게 계정 추가를 요청해 주세요.",
  OAuthCallback: "구글에서 돌아오는 중 문제가 생겼습니다. 다시 시도해 주세요.",
  OAuthSignin: "구글 로그인 창을 열지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
  Configuration: "로그인 설정을 확인해야 합니다 (리디렉션 주소 · 키). 관리자에게 알려 주세요.",
  Callback: "로그인을 마치지 못했습니다. 다시 시도해 주세요.",
};

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const callbackUrl = safeCallback(router.query.callbackUrl, "/");
  const error = typeof router.query.error === "string" ? router.query.error : null;
  const signedIn = auth.status === "authenticated" && auth.user;

  return (
    <>
      <Head>
        <title>로그인 — K-CARE</title>
      </Head>
      <div className="flex min-h-screen items-start justify-center bg-nav px-5">
        <main className="w-full max-w-[420px] py-14">
          <Logo height={40} tone="onDark" beta />
          <h1 className="mt-6 text-[26px] font-black leading-[1.35] text-white">K-CARE 베타 로그인</h1>
          <p className="mt-2 text-[14px] leading-[1.75] text-white/60">
            구글 계정으로 로그인합니다. 이름과 이메일만 받고, 구글 비밀번호는 K-CARE 에 전달되지 않습니다.
          </p>

          <div className="mt-7 rounded-2xl bg-white p-5">
            {!AUTH_ENABLED ? (
              // 설정 전 — 무엇이 빠졌는지 알려 준다
              <div>
                <div className="text-[15px] font-bold text-amber">구글 로그인이 아직 설정되지 않았습니다</div>
                <p className="mt-2 text-[13px] leading-[1.7] text-ink">
                  배포 환경변수에 아래 값을 넣고 다시 배포하면 이 자리에 로그인 버튼이 생깁니다. 설정 순서는
                  저장소의 DEPLOY.md 에 있습니다.
                </p>
                <ul className="mt-2.5 space-y-1 rounded-xl bg-paper px-3.5 py-3 font-num text-[12.5px] text-navy">
                  <li>GOOGLE_CLIENT_ID</li>
                  <li>GOOGLE_CLIENT_SECRET</li>
                  <li>NEXTAUTH_SECRET</li>
                  <li>NEXTAUTH_URL</li>
                </ul>
                <Link href="/" className="tap mt-4 flex w-full items-center justify-center rounded-xl border border-navy/15 text-[14px] font-bold text-navy">
                  로그인 없이 둘러보기
                </Link>
              </div>
            ) : signedIn ? (
              // 로그인됨
              <div>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-navy text-[17px] font-bold text-white">
                    {(auth.user.name || auth.user.email || "?").slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-bold text-navy">{auth.user.name || "구글 계정"}</div>
                    <div className="truncate font-num text-[13px] text-muted">{auth.user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(callbackUrl)}
                  className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white"
                >
                  계속하기
                </button>
                <button
                  onClick={() => logout("/login")}
                  className="btn-press mt-2 w-full rounded-xl border border-navy/15 py-3 text-[14px] font-bold text-muted"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              // 로그인 전
              <div>
                {error && (
                  <p role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold leading-[1.6] text-amber">
                    {ERRORS[error] || "로그인하지 못했습니다. 다시 시도해 주세요."}
                  </p>
                )}
                <button
                  onClick={() => googleSignIn(callbackUrl)}
                  disabled={auth.status === "loading"}
                  className="btn-press flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#DADCE0] bg-white py-3.5 text-[15px] font-bold text-[#1F1F1F] disabled:opacity-60"
                >
                  <GoogleMark size={20} />
                  Google 계정으로 계속하기
                </button>
                <p className="mt-3 text-[12px] leading-[1.7] text-muted">
                  베타 기간에는 관리자가 등록한 구글 계정만 로그인할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          <Link href="/service" className="tap mt-6 inline-flex text-[13px] font-bold text-white/60 underline underline-offset-2">
            K-CARE 서비스 소개 보기
          </Link>
        </main>
      </div>
    </>
  );
}
