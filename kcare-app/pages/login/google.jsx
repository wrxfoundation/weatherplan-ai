// 구글 로그인 시뮬레이션 — 구글 연결(Google Cloud 콘솔 설정) 전에 'Google 계정으로 계속하기'
// 흐름을 끝까지 보여 주기 위한 화면이다 (2026-09-30 요청).
//
// 계정 선택 → 비밀번호 → 정보 제공 동의 → 돌아가기 순서는 실제와 같게 두고, 실제 Google 에는
// 연결하지 않는다. 고를 수 있는 계정은 테스트 계정(lib/test-accounts.js)이고 비밀번호는
// K-CARE 테스트 비밀번호다 — 로그인하면 세션에 'Google (시뮬레이션)'으로 남아 실제 구글과 구별된다.
// 실제 구글이 켜지면(GOOGLE_CLIENT_ID 등) 이 화면은 곧바로 진짜 구글로 넘긴다.
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GOOGLE_ENABLED, TEST_LOGIN, GoogleMark, googleStart, safeCallback, testSignIn } from "../../lib/auth";
import { ROLE_HOME, ROLE_LABEL, TEST_ACCOUNTS } from "../../lib/test-accounts";

const ERRORS = {
  CredentialsSignin: "비밀번호가 맞지 않습니다. 다시 입력해 주세요.",
};

export default function GoogleSimulation() {
  const router = useRouter();
  const callbackUrl = safeCallback(router.query.callbackUrl, "/");
  const [step, setStep] = useState("pick"); // pick → password → consent
  const [acct, setAcct] = useState(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // 실제 구글이 켜져 있으면 흉내 낼 이유가 없다
  useEffect(() => {
    if (GOOGLE_ENABLED && router.isReady) googleStart(callbackUrl);
  }, [router.isReady, callbackUrl]);

  const back = () => {
    setError(null);
    setStep(step === "consent" ? "password" : "pick");
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    const r = await testSignIn({ id: acct.id, password: pw, via: "google-sim" });
    if (r.ok) {
      window.location.assign(callbackUrl !== "/" ? callbackUrl : ROLE_HOME[acct.role] || "/");
      return;
    }
    setError(r.error || "CredentialsSignin");
    setBusy(false);
    setStep("password");
  };

  return (
    <>
      <Head>
        <title>Google 로그인 (시뮬레이션) — K-CARE</title>
      </Head>
      <div className="flex min-h-screen items-start justify-center bg-paper px-4">
        <main className="w-full max-w-[440px] py-10">
          {/* 시뮬레이션임을 첫 줄에서 밝힌다 — 실제 구글 화면으로 착각하지 않게 */}
          <p className="rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.6] text-amber">
            테스트 모드 · 구글 로그인 시뮬레이션 — 실제 Google 에 연결하지 않습니다.
          </p>

          <div className="mt-4 rounded-2xl border border-navy/10 bg-white px-5 pb-6 pt-6">
            <div className="flex items-center gap-2 text-[14px] font-bold text-[#1F1F1F]">
              <GoogleMark size={22} />
              Google 계정으로 로그인
            </div>

            {GOOGLE_ENABLED ? (
              <p className="mt-6 text-[14px] text-ink">Google 로 이동하고 있습니다…</p>
            ) : !TEST_LOGIN ? (
              <div className="mt-6">
                <h1 className="text-[20px] font-black text-navy">로그인 설정 전입니다</h1>
                <p className="mt-2 text-[13px] leading-[1.7] text-ink">
                  시뮬레이션도 테스트 계정으로 들어가므로 NEXTAUTH_SECRET · BETA_TEST_PASSWORD 가 필요합니다.
                </p>
              </div>
            ) : step === "pick" ? (
              <div className="mt-5">
                <h1 className="text-[22px] font-black text-navy">계정 선택</h1>
                <p className="mt-1 text-[13px] text-muted">K-CARE(으)로 이동</p>
                <ul className="mt-4 divide-y divide-navy/10 rounded-xl border border-navy/10">
                  {TEST_ACCOUNTS.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => {
                          setAcct(a);
                          setPw("");
                          setError(null);
                          setStep("password");
                        }}
                        className="btn-press flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-paper"
                      >
                        <span aria-hidden className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-navy text-[14px] font-bold text-white">
                          {(ROLE_LABEL[a.role] || a.name).slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-bold text-ink">
                            {a.name} <span className="text-[12px] font-medium text-muted">{ROLE_LABEL[a.role]}</span>
                          </span>
                          <span className="block truncate font-num text-[12.5px] text-muted">{a.email}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : step === "password" ? (
              <form
                className="mt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  setStep("consent");
                }}
              >
                <h1 className="text-[22px] font-black text-navy">환영합니다</h1>
                <button
                  type="button"
                  onClick={back}
                  className="btn-press mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-navy/15 px-3 text-[13px] font-bold text-ink"
                >
                  <span className="truncate font-num">{acct.email}</span>
                  <span aria-hidden className="text-muted">▾</span>
                  <span className="sr-only">다른 계정 선택</span>
                </button>
                {error && (
                  <p role="alert" className="mt-4 text-[13px] font-bold text-amber">
                    {ERRORS[error] || "로그인하지 못했습니다. 다시 시도해 주세요."}
                  </p>
                )}
                <label htmlFor="sim-pw" className="mt-4 block text-[13px] font-bold text-navy">
                  비밀번호 <span className="font-medium text-muted">(K-CARE 테스트 비밀번호)</span>
                </label>
                <input
                  id="sim-pw"
                  type="password"
                  autoComplete="current-password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[15px] text-ink"
                />
                <div className="mt-5 flex items-center justify-between">
                  <button type="button" onClick={back} className="btn-press rounded-xl px-2 text-[14px] font-bold text-muted">
                    뒤로
                  </button>
                  <button type="submit" disabled={!pw} className="btn-press btn-dark rounded-xl bg-navy px-6 py-3 text-[14px] font-bold text-white disabled:opacity-50">
                    다음
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <h1 className="text-[20px] font-black leading-[1.45] text-navy">K-CARE 에서 내 Google 계정 정보에 접근하려고 합니다</h1>
                <p className="mt-2 font-num text-[13px] text-muted">{acct.email}</p>
                <ul className="mt-4 space-y-2 rounded-xl bg-paper px-3.5 py-3 text-[13px] text-ink">
                  <li>· 이름</li>
                  <li>· 이메일 주소</li>
                </ul>
                <p className="mt-3 text-[12px] leading-[1.7] text-muted">
                  실제 구글 로그인도 이 두 가지만 받습니다. 구글 비밀번호는 K-CARE 에 전달되지 않습니다.
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <button onClick={back} disabled={busy} className="btn-press rounded-xl px-2 text-[14px] font-bold text-muted">
                    취소
                  </button>
                  <button onClick={finish} disabled={busy} className="btn-press btn-dark rounded-xl bg-navy px-6 py-3 text-[14px] font-bold text-white disabled:opacity-60">
                    {busy ? "확인 중…" : "계속"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link href={`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="tap mt-5 text-[13px] font-bold text-muted underline underline-offset-2">
            로그인 화면으로 돌아가기
          </Link>
        </main>
      </div>
    </>
  );
}
