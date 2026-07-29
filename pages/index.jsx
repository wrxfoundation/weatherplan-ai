import Head from "next/head";
import Link from "next/link";
import { useAppState } from "../lib/state";

export default function Home() {
  const { state, dispatch } = useAppState();
  const joined = !!state.onboarding;

  return (
    <>
      <Head>
        <title>K-CARE</title>
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-nav px-5">
        <div className="w-full max-w-[430px] py-14">
          <div className="font-num text-[26px] font-extrabold tracking-[.04em] text-white">
            K-CARE <span className="align-top text-[10px] font-bold text-gold">BETA</span>
          </div>
          <h1 className="mt-5 text-[30px] font-black leading-[1.35] text-white">
            부모의 병원 가는 길을
            <br />
            자녀가 대신 지킵니다
          </h1>
          <p className="mt-4 text-[13px] leading-[1.8] text-white/60">
            전담 컨시어지 2인 1조 · 24시간 관제 · 공유 캘린더 · 안심케어박스.
            자녀(보호자)가 결제하고 부모(어르신)가 서비스를 받는 구독형 케어 멤버십입니다.
          </p>

          <div className="mt-10 space-y-3">
            <Link
              href="/onboarding"
              className="btn-press block w-full rounded-2xl bg-gold py-4 text-center text-[15px] font-bold text-nav shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
            >
              {joined ? "가입 정보 다시 입력하기" : "가입 상담 시작하기"}
            </Link>
            <Link
              href="/family"
              className="btn-press block w-full rounded-2xl border border-white/25 py-4 text-center text-[15px] font-bold text-white"
            >
              가족 앱 미리보기 {joined ? "" : "(데모 데이터)"}
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/elder"
                className="btn-press block rounded-2xl border border-white/25 py-4 text-center text-[15px] font-bold text-white"
              >
                어르신 화면
              </Link>
              <Link
                href="/concierge"
                className="btn-press block rounded-2xl border border-white/25 py-4 text-center text-[15px] font-bold text-white"
              >
                컨시어지 화면
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-[11px] leading-[1.8] text-white/40">
            데모 빌드입니다 — 결제·웨어러블·병원 연동은 &ldquo;연동 대기&rdquo;로 표기됩니다.
            <button
              className="ml-2 underline decoration-white/30 underline-offset-2"
              onClick={() => dispatch({ type: "reset" })}
            >
              데모 초기화
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
