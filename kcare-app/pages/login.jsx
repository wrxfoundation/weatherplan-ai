// 로그인 — 테스트 계정 · 구글. 베타 잠금(BETA_REQUIRE_LOGIN=1)이 켜지면 여기로 모인다.
//
// 상태를 정직하게 보여 준다:
//  · 설정 전   — 로그인 환경변수가 없다. 무엇을 넣어야 하는지 안내한다 (가짜로 로그인시키지 않는다)
//  · 로그인 전 — 'Google 계정으로 계속하기' (구글 설정 전이면 시뮬레이션) + 테스트 아이디
//  · 로그인됨  — 누구로 · 어느 가구 · 어디에 저장되는지 · 계속하기 · 로그아웃
// 로그인하지 않고 둘러보면 데모(시뮬레이션)다 — 이 브라우저에만 저장된다.
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import {
  AUTH_ENABLED,
  GOOGLE_SIMULATED,
  TEST_LOGIN,
  GoogleMark,
  PROVIDER_LABEL,
  googleStart,
  logout,
  safeCallback,
  testSignIn,
  useAuth,
} from "../lib/auth";
import { storageText, useSync } from "../lib/state";
import { ROLE_HOME, ROLE_LABEL, TEST_ACCOUNTS, findTestAccount, householdName } from "../lib/test-accounts";

// NextAuth 가 돌려주는 오류 코드 → 사람이 읽는 말
const ERRORS = {
  CredentialsSignin: "아이디 또는 비밀번호가 맞지 않습니다.",
  NotAllowed: "허용된 계정이 아닙니다. 관리자에게 계정 추가를 요청해 주세요.",
  AccessDenied: "허용된 계정이 아닙니다. 관리자에게 계정 추가를 요청해 주세요.",
  OAuthCallback: "구글에서 돌아오는 중 문제가 생겼습니다. 다시 시도해 주세요.",
  OAuthSignin: "구글 로그인 창을 열지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
  Configuration: "로그인 설정을 확인해야 합니다 (리디렉션 주소 · 키). 관리자에게 알려 주세요.",
  Callback: "로그인을 마치지 못했습니다. 다시 시도해 주세요.",
};

// 로그인 전 — 서버 저장이 켜져 있는지 (/api/status · 값은 싣지 않고 켜짐 여부만)
function ServerLine() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let on = true;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => on && setS(j))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);
  if (!s) return null;
  const ok = s.db?.ok;
  const text = ok
    ? "서버 저장 연결됨 — 로그인하면 기록이 Supabase 에 쌓입니다"
    : s.db?.configured
      ? `서버 저장 확인 필요 (${s.db.error || "오류"}) — DEPLOY.md 5단계`
      : "서버 저장 설정 전 — 로그인해도 이 기기에만 저장됩니다";
  return (
    <p className={`mt-4 flex items-start gap-2 text-[12px] leading-[1.6] ${ok ? "text-green" : "text-amber"}`}>
      <span aria-hidden className={`mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full ${ok ? "bg-green" : "border border-amber"}`} />
      {text}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const sync = useSync();
  const callbackUrl = safeCallback(router.query.callbackUrl, "/");
  const [error, setError] = useState(null);
  const [id, setId] = useState(TEST_ACCOUNTS[0].id);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const signedIn = auth.status === "authenticated" && auth.user;

  useEffect(() => {
    if (typeof router.query.error === "string") setError(router.query.error);
  }, [router.query.error]);

  // 로그인 뒤 갈 곳 — 요청받은 화면이 있으면 거기, 없으면 역할 화면
  const destination = (role) => (callbackUrl !== "/" ? callbackUrl : ROLE_HOME[role] || "/");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await testSignIn({ id, password: pw });
    if (r.ok) {
      window.location.assign(destination(findTestAccount(id)?.role));
      return;
    }
    setError(r.error || "CredentialsSignin");
    setBusy(false);
  };

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
            로그인하면 한 일이 서버에 저장되고 같은 가구의 다른 폰에도 보입니다. 로그인하지 않으면 데모(시뮬레이션)로
            둘러봅니다.
          </p>

          <div className="mt-7 rounded-2xl bg-white p-5">
            {!AUTH_ENABLED ? (
              // 설정 전 — 무엇이 빠졌는지 알려 준다
              <div>
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#DADCE0] bg-white py-3.5 text-[15px] font-bold text-[#1F1F1F] opacity-50"
                >
                  <GoogleMark size={20} />
                  Google 계정으로 계속하기
                </button>
                <div className="mt-4 text-[15px] font-bold text-amber">로그인이 아직 설정되지 않았습니다</div>
                <p className="mt-2 text-[13px] leading-[1.7] text-ink">
                  배포 환경변수에 아래 값을 넣고 다시 배포하면 켜집니다. 순서는 저장소의 DEPLOY.md 에 있습니다.
                </p>
                <dl className="mt-2.5 space-y-2 rounded-xl bg-paper px-3.5 py-3 text-[12.5px]">
                  <div>
                    <dt className="font-bold text-ink">테스트 아이디 (먼저)</dt>
                    <dd className="font-num text-navy">NEXTAUTH_SECRET · BETA_TEST_PASSWORD</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-ink">구글 (나중에)</dt>
                    <dd className="font-num text-navy">GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET · NEXTAUTH_URL</dd>
                  </div>
                </dl>
              </div>
            ) : signedIn ? (
              // 로그인됨
              <div>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-navy text-[17px] font-bold text-white">
                    {(ROLE_LABEL[auth.user.role] || auth.user.name || auth.user.email || "?").slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-bold text-navy">
                      {auth.user.name || "구글 계정"}
                      {ROLE_LABEL[auth.user.role] && <span className="ml-1.5 text-[13px] font-medium text-muted">{ROLE_LABEL[auth.user.role]}</span>}
                    </div>
                    <div className="truncate font-num text-[13px] text-muted">{auth.user.email}</div>
                  </div>
                </div>
                <dl className="mt-4 space-y-1.5 rounded-xl bg-paper px-3.5 py-3 text-[13px]">
                  <div className="flex gap-3">
                    <dt className="w-[52px] shrink-0 text-muted">로그인</dt>
                    <dd className="font-bold text-ink">{PROVIDER_LABEL[auth.user.provider] || "—"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-[52px] shrink-0 text-muted">가구</dt>
                    <dd className="font-bold text-ink">{householdName(auth.user.household) || "없음 (데모로 봅니다)"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-[52px] shrink-0 text-muted">저장</dt>
                    <dd className={`font-bold ${sync.mode === "server" && sync.status !== "error" ? "text-green" : "text-amber"}`}>{storageText(sync)}</dd>
                  </div>
                </dl>
                <button
                  onClick={() => router.push(destination(auth.user.role))}
                  className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white"
                >
                  {callbackUrl === "/" && ROLE_LABEL[auth.user.role] ? `${ROLE_LABEL[auth.user.role]} 화면으로 계속하기` : "계속하기"}
                </button>
                <button
                  onClick={async () => {
                        // 모아 둔 것을 다 보낸 뒤에 나간다 — 로그아웃하면 세션이 끊겨 더는 못 보낸다
                        await sync.flush?.();
                        logout("/login");
                      }}
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
                  onClick={() => googleStart(callbackUrl)}
                  disabled={auth.status === "loading"}
                  className="btn-press flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#DADCE0] bg-white py-3.5 text-[15px] font-bold text-[#1F1F1F] disabled:opacity-60"
                >
                  <GoogleMark size={20} />
                  Google 계정으로 계속하기
                </button>
                {GOOGLE_SIMULATED && (
                  <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                    <b className="text-navy">테스트 모드</b> — 구글 연결 전이라 실제 Google 대신 테스트 계정으로 흐름만 흉내 냅니다.
                  </p>
                )}

                {TEST_LOGIN ? (
                  <form onSubmit={submit} className="mt-5">
                    <div className="mb-4 flex items-center gap-3 text-[12px] font-bold text-muted">
                      <span className="h-px flex-1 bg-navy/10" />
                      또는 테스트 아이디
                      <span className="h-px flex-1 bg-navy/10" />
                    </div>
                    <fieldset>
                      <legend className="text-[13px] font-bold text-navy">누구로 들어갈까요?</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {TEST_ACCOUNTS.map((a) => (
                          <label key={a.id} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name="test-account"
                              value={a.id}
                              checked={id === a.id}
                              onChange={() => setId(a.id)}
                              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <span className="flex min-h-[44px] items-center justify-center rounded-xl border border-navy/15 text-[14px] font-bold text-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                              {ROLE_LABEL[a.role]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label htmlFor="login-id" className="mt-4 block text-[13px] font-bold text-navy">
                      아이디
                    </label>
                    <input
                      id="login-id"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[15px] text-ink"
                    />
                    <label htmlFor="login-pw" className="mt-3 block text-[13px] font-bold text-navy">
                      비밀번호
                    </label>
                    <input
                      id="login-pw"
                      type="password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoComplete="current-password"
                      className="mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[15px] text-ink"
                    />
                    <button
                      type="submit"
                      disabled={busy || !pw || !id.trim()}
                      className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
                    >
                      {busy ? "확인 중…" : "로그인"}
                    </button>
                    <p className="mt-3 text-[12px] leading-[1.7] text-muted">
                      테스트 계정은 모두 <b className="text-ink">{householdName(TEST_ACCOUNTS[0].household)}</b>을 함께 씁니다. 보호자가 보낸
                      요청이 어르신·컨시어지·관제 화면에 뜹니다. 비밀번호는 관리자에게 받으세요.
                    </p>
                  </form>
                ) : (
                  <p className="mt-4 text-[12px] leading-[1.7] text-muted">
                    테스트 아이디 로그인은 설정 전입니다 (BETA_TEST_PASSWORD).
                  </p>
                )}
                <ServerLine />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/" className="tap text-[13px] font-bold text-white/70 underline underline-offset-2">
              로그인 없이 데모 둘러보기
            </Link>
            <Link href="/service" className="tap text-[13px] font-bold text-white/60 underline underline-offset-2">
              K-CARE 서비스 소개
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
