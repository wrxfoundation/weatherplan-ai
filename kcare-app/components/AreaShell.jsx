// 가입 · 로그인 입구의 틀 (2026-10-06) — 이용자 · 현장 · 영업 · 관제 세 영역을 다른 입구로 나눈다.
// 위쪽 탭으로 다른 영역 입구로 옮겨 갈 수 있다 (가입 화면이면 가입 화면끼리, 로그인이면 로그인끼리).
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

export default function AreaShell({ area, mode, title, lead, children, below }) {
  const a = AREAS[area];
  const t = TONE[area];
  // 가입 링크(?code=)로 들어와서 다른 영역 탭으로 옮겨도 코드를 들고 간다 (2026-10-06 UX 점검)
  const q = useRouter().query.code;
  const code = mode === "join" && typeof q === "string" ? q : "";
  return (
    <>
      <Head>
        <title>{`${title} — K-CARE`}</title>
      </Head>
      <div className="flex min-h-screen items-start justify-center bg-nav px-4">
        <main className="w-full max-w-[460px] py-10 sm:py-14">
          <Logo height={36} tone="onDark" beta />
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
          <p className={`mt-6 text-[12px] font-bold tracking-[.08em] ${t.line}`}>{a.label} · {a.desc}</p>
          <h1 className="mt-1 text-[24px] font-black leading-[1.35] text-white">{title}</h1>
          {lead && <p className="mt-2 text-[14px] leading-[1.75] text-white/65">{lead}</p>}
          <div className="mt-6 rounded-2xl bg-white p-5">{children}</div>
          {below && <div className="mt-5">{below}</div>}
        </main>
      </div>
    </>
  );
}

// 아래쪽 링크 줄 — 흰 글씨 밑줄 링크
export function ShellLinks({ links }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {links.map(([href, text]) => (
        <Link key={href} href={href} className="tap text-[13px] font-bold text-white/70 underline underline-offset-2">
          {text}
        </Link>
      ))}
    </div>
  );
}
