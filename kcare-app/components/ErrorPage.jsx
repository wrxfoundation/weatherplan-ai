import Head from "next/head";
import Link from "next/link";

// 오류 화면 공용 틀 — 404 · 500 · 렌더 예외가 같은 얼굴을 쓴다.
// 시연 중에 Next 기본 영문 화면이 뜨는 것만은 막는다는 게 이 화면의 목적이다.
export default function ErrorPage({ code, title, desc, onRetry }) {
  return (
    <>
      <Head>
        <title>{`${title} — K-CARE`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex min-h-dvh items-center justify-center break-keep bg-paper px-6 py-10">
        <div className="card-glass w-full max-w-[420px] rounded-[18px] px-6 py-8 text-center">
          <div className="font-num text-[44px] font-bold leading-none text-navy/25">{code}</div>
          <h1 className="mt-3 text-[19px] font-bold text-navy">{title}</h1>
          <p className="mt-2 text-[13px] leading-[1.75] text-muted">{desc}</p>

          <div className="mt-6 flex flex-col gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="btn-press w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white"
              >
                다시 시도
              </button>
            )}
            <Link
              href="/"
              className="btn-press w-full rounded-xl border border-navy/20 bg-white/70 py-3 text-[15px] font-bold text-navy"
            >
              데모 홈으로
            </Link>
          </div>

          <p className="mt-5 border-t border-navy/[.08] pt-3 text-[11px] leading-[1.7] text-muted">
            시연용 데모입니다. 이 화면이 반복되면 데모 홈에서 <b className="text-navy/70">시연 초기화</b>를
            눌러 주세요.
          </p>
        </div>
      </main>
    </>
  );
}
