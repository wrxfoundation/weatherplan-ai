// 가입 · 로그인 입구의 틀 (2026-10-06) — 이용자 · 현장 · 영업 · 관제 세 영역을 다른 입구로 나눈다.
// 위쪽 탭으로 다른 영역 입구로 옮겨 갈 수 있다 (가입 화면이면 가입 화면끼리, 로그인이면 로그인끼리).
//
// 2026-11-06 랜딩 요청 5-2 · 5-4 — 형식(남색 배경 · 세 칸 탭 · 흰 카드)은 그대로 두고 문구만 바꿨다.
//   · 아래 링크는 'K-CARE 서비스 소개'(/) 하나 — 시연 허브로 가는 링크는 고객 화면에 두지 않는다
//   · 상담 신청(/consult)은 같은 틀을 쓰되 세 칸 탭과 BETA 표시가 없다 (bare)
//   · .lp — 문장 끝 한 단어만 다음 줄로 넘어가지 않게 하는 줄바꿈 규칙 (globals.css)
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "./Logo";
import { AREAS } from "../lib/centers";

const TONE = {
  user: { chip: "bg-gold text-navy", line: "text-gold-soft" },
  partner: { chip: "bg-green text-white", line: "text-[#8FE3C0]" },
  ops: { chip: "bg-white text-navy", line: "text-white/70" },
};

export const HOME_LINK = ["/", "K-CARE 서비스 소개"];

export default function AreaShell({ area, mode, title, lead, children, below, bare = false, head = null }) {
  const a = bare ? null : AREAS[area];
  const t = bare ? null : TONE[area];
  // 가입 링크(?code=)로 들어와서 다른 영역 탭으로 옮겨도 코드를 들고 간다 (2026-10-06 UX 점검)
  const q = useRouter().query.code;
  const code = mode === "join" && typeof q === "string" ? q : "";
  return (
    <>
      <Head>
        <title>{`${title} — K-CARE`}</title>
        {head}
      </Head>
      <div className="lp flex min-h-screen items-start justify-center bg-nav px-4">
        <main className="w-full max-w-[460px] py-10 sm:py-14">
          <Link href="/" aria-label="K-CARE 서비스 소개로 돌아가기" className="inline-block">
            <Logo height={36} tone="onDark" beta={!bare} />
          </Link>
          {!bare && (
            <nav aria-label={mode === "join" ? "가입 입구" : "로그인 입구"} className="mt-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-white/[.06] p-1.5">
              {Object.values(AREAS).map((x) => {
                const on = x.key === area;
                return (
                  <Link
                    key={x.key}
                    href={mode === "join" ? `${x.join}${code ? `?code=${encodeURIComponent(code)}` : ""}` : x.login}
                    aria-current={on ? "page" : undefined}
                    className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl px-1 text-center leading-tight ${on ? TONE[x.key].chip : "text-white/70"}`}
                  >
                    <span className="text-[14px] font-bold">{x.label}</span>
                    <span className={`text-[11px] ${on ? "opacity-90" : "text-white/60"}`}>{x.desc}</span>
                  </Link>
                );
              })}
            </nav>
          )}
          {!bare && <p className={`mt-6 text-[12px] font-bold tracking-[.08em] ${t.line}`}>{a.label} · {a.desc}</p>}
          <h1 className={`${bare ? "mt-7" : "mt-1"} text-[24px] font-black leading-[1.35] text-white sm:text-[26px]`}>{title}</h1>
          {lead && <p className="lp-lead mt-2 text-[15px] leading-[1.7] text-white/65">{lead}</p>}
          <div className="mt-6 rounded-2xl bg-white p-5">{children}</div>
          <div className="mt-5">{below === undefined ? <ShellLinks links={[HOME_LINK]} center /> : below}</div>
        </main>
      </div>
    </>
  );
}

// 아래쪽 링크 줄 — 흰 글씨 밑줄 링크
export function ShellLinks({ links, center = false }) {
  return (
    <div className={`flex flex-wrap gap-x-5 gap-y-2 ${center ? "justify-center" : ""}`}>
      {links.map(([href, text]) => (
        <Link key={href} href={href} className="tap text-[14px] font-bold text-white/70 underline underline-offset-2">
          {text}
        </Link>
      ))}
    </div>
  );
}
