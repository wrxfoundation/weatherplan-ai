// 공개 문서 화면 — 이용약관(/terms) · 환불 정책(/refund) · 개인정보 처리방침(/privacy). 2026-11-10.
// 로그인 없이 읽는다. 본문은 lib/policies.js 한 곳 — 앱 안 '약관 · 정책'과 같은 글이다.
// 검색에는 열지 않는다 (서비스 소개와 상담 신청만 연다 — pages/_app.jsx INDEXABLE).
import Head from "next/head";
import Link from "next/link";
import Logo from "./Logo";
import ExitTable from "./ExitTable";
import { parasOf } from "./Policy";
import { LEGAL, PUBLIC_POLICIES, policyOf } from "../lib/policies";
import { SITE, TEL } from "../lib/landing";

// 기호가 낀 낱말은 줄 끝에서 쪼개지지 않게 묶는다 — K-CARE는 · "회사")가 · 02-2135-7751로 · 09시~19시에.
// (.lp 의 keep-all 은 한글 낱말만 지킨다 — 붙임표 · 따옴표 · 괄호 뒤에서는 줄이 바뀔 수 있다)
function Keep({ text }) {
  return String(text)
    .split(/(\s+)/)
    .map((t, i) =>
      /[-"()%~]/.test(t) ? (
        <span key={i} className="whitespace-nowrap">
          {t}
        </span>
      ) : (
        t
      )
    );
}

export default function LegalPage({ id }) {
  const policy = policyOf(id);
  const others = PUBLIC_POLICIES.filter((p) => p.id !== id);
  return (
    <>
      <Head>
        <title>{`${policy.title} — K-CARE`}</title>
        <meta name="description" content={policy.lead} />
        <link rel="canonical" href={`${SITE.origin}${policy.path}`} />
      </Head>
      <div className="lp min-h-dvh bg-paper">
        <header className="border-b border-navy/[.08] bg-[#F7F6F1]">
          <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-5 py-3">
            <Link href="/" aria-label="K-CARE 서비스 소개로" className="tap shrink-0">
              <Logo height={34} />
            </Link>
            <Link href="/" className="btn-press inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[15px] font-bold text-[#34404F]">
              서비스 소개
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[760px] px-5 pb-14 pt-9">
          <p className="text-[14px] font-bold text-[#8A5D12]">K-CARE</p>
          <h1 className="mt-1 text-[30px] font-extrabold leading-[1.3] text-navy sm:text-[34px]">{policy.title}</h1>
          <p className="lp-lead mt-2.5 text-[17px] leading-[1.7] text-[#34404F]">{policy.lead}</p>
          <p className="mt-2 text-[14.5px] text-muted">시행일 {LEGAL.effective}</p>
          {policy.draft && (
            <p role="note" className="lp-bal mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] px-4 py-3 text-[14.5px] font-bold leading-[1.65] text-amber">
              {LEGAL.draftNote}
            </p>
          )}

          <div className="mt-7 space-y-7">
            {policy.sections.map((s) => (
              <section key={s.h} aria-label={s.h}>
                <h2 className="text-[19px] font-extrabold leading-[1.45] text-navy">{s.h}</h2>
                {parasOf(s.p).map((x) => (
                  <p key={x} className="mt-2 text-[16px] leading-[1.8] text-ink">
                    <Keep text={x} />
                  </p>
                ))}
                {s.table === "exit" ? (
                  <div className="lp-tb mt-3 rounded-[18px] bg-[#FBFAF6] px-[18px] py-2 sm:px-5">
                    <ExitTable />
                  </div>
                ) : (
                  s.li && (
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[16px] leading-[1.8] text-ink marker:text-[#B08D57]">
                      {s.li.map((x) => (
                        <li key={x}>
                          <Keep text={x} />
                        </li>
                      ))}
                    </ul>
                  )
                )}
                {s.note && (
                  <p className="mt-2.5 text-[15.5px] leading-[1.8] text-[#5C5A54]">
                    <Keep text={s.note} />
                  </p>
                )}
              </section>
            ))}
          </div>

          <nav aria-label="다른 문서" className="mt-10 border-t border-navy/10 pt-6">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15.5px] font-bold text-navy">
              {others.map((p) => (
                <li key={p.id}>
                  <Link href={p.path} className="tap inline-block py-[3px] underline underline-offset-2">
                    {p.short}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/" className="tap inline-block py-[3px] underline underline-offset-2">
                  서비스 소개
                </Link>
              </li>
            </ul>
          </nav>
        </main>

        <footer className="border-t border-navy/[.08] bg-paper py-8">
          <div className="mx-auto w-full max-w-[760px] px-5 text-[14px] leading-[1.75] text-muted">
            <p>
              <Keep text={policy.foot} />
            </p>
            <p className="mt-1">
              문의는{" "}
              <a href={TEL.href} className="tap inline-block whitespace-nowrap py-[3px] font-bold text-ink underline underline-offset-2">
                고객센터 {TEL.label}
              </a>
              로 해 주세요.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
