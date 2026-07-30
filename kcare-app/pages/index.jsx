import Head from "next/head";
import Link from "next/link";
import { useAppState } from "../lib/state";

// 데모 홈 = 시연 허브 — 6단계 시연 동선(슬라이드와 동일) + 라이브 데모 상태 + 원탭 초기화.
// 발표자는 이 화면에서 시작해 순서대로 클릭만 하면 15분 데모가 완성된다.

const DEMO_STEPS = [
  { n: "01", role: "어르신", href: "/elder", text: "SOS 글라스 버튼 (2초 홀드) · AI 안부 전화 — 빨강은 SOS뿐" },
  { n: "02", role: "보호자", href: "/family", text: "시연 컨트롤로 SOS 발생 → 배너 확인 · NPS 4점 제출 (회복 플로우)" },
  { n: "03", role: "관제", href: "/dispatch", text: "상태 필 · 급파 지시 → 액션 큐에 NPS 회복 콜 자동 등장" },
  { n: "04", role: "컨시어지", href: "/concierge", text: "긴급 급파 배너 수락 · 선호 카드 · 오늘의 한 끗" },
  { n: "05", role: "감사 로그", href: "/dispatch", text: "관제 티커 — 전 역할의 액션이 실시간 기록 (열람도 공개)" },
  { n: "06", role: "경영", href: "/admin", text: "사람 KPI · CRM 라이프사이클 · NPS 루프 · 신뢰 거버넌스로 클로징" },
];

export default function Home() {
  const { state, dispatch } = useAppState();
  const joined = !!state.onboarding;

  // 라이브 데모 상태 — 발표자가 현재 시연 상태를 한눈에
  const live = [
    state.demo.sos && { label: state.ops.sosDispatched ? "SOS · 급파 중" : "SOS 진행 중", cls: "bg-danger text-white animate-sosPulse" },
    state.visit.checkedIn && { label: "동행 중 (체크인)", cls: "bg-green/20 text-[#8FE3C0]" },
    state.ops.npsDetractor && { label: "NPS 회복 콜 대기", cls: "bg-[rgba(138,93,18,.3)] text-[#F0D9A8]" },
  ].filter(Boolean);

  return (
    <>
      <Head>
        <title>K-CARE</title>
      </Head>
      <div className="flex min-h-screen items-start justify-center bg-nav px-5">
        <div className="w-full max-w-[880px] py-12">
          <div className="font-num text-[29px] font-extrabold tracking-[.04em] text-white">
            K-CARE <span className="align-top text-[11px] font-bold text-gold">BETA</span>
          </div>
          <h1 className="mt-4 text-[30px] font-black leading-[1.35] text-white">
            부모의 병원 가는 길을 자녀가 대신 지킵니다
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.8] text-white/60">
            전담 컨시어지 2인 1조 · 24시간 관제 · 공유 캘린더 · 안심케어박스. 자녀(보호자)가
            결제하고 부모(어르신)가 서비스를 받는 구독형 케어 멤버십입니다.
          </p>

          {/* 라이브 데모 상태 + 초기화 */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold tracking-[.12em] text-white/40">DEMO 상태</span>
            {live.length === 0 && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white/60">
                대기 — 시연 준비 완료
              </span>
            )}
            {live.map((l) => (
              <span key={l.label} className={`rounded-full px-3 py-1 text-[12px] font-bold ${l.cls}`}>
                {l.label}
              </span>
            ))}
            <button
              onClick={() => dispatch({ type: "reset" })}
              className="btn-press ml-auto rounded-full border border-white/25 px-4 py-1.5 text-[12px] font-bold text-white/80"
            >
              ↺ 시연 초기화
            </button>
          </div>

          {/* 시연 동선 6단계 — 슬라이드와 동일한 순서 */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-bold text-white">시연 동선 — 15분 데모 가이드</h2>
              <span className="text-[11px] text-white/40">순서대로 클릭 · 하나의 케어 루프</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {DEMO_STEPS.map((s) => (
                <Link
                  key={s.n}
                  href={s.href}
                  className="btn-press flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.05] px-4 py-3 hover:bg-white/[.09]"
                >
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[13px] font-bold text-nav">
                    {s.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-white">
                      {s.role} <span className="ml-1 font-num text-[11px] font-medium text-white/40">{s.href}</span>
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-[1.6] text-white/60">{s.text}</span>
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-[1.7] text-white/40">
              클로징 3원칙 — 구조가 해자 (동의 · 접근 기록 전면 공개) · 사람이 최종 판단 (L4) · 케어가
              지표 (판매액 없는 평가)
            </p>
          </div>

          {/* 역할 바로가기 + 온보딩 */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/onboarding"
              className="btn-press block rounded-2xl bg-gold py-3.5 text-center text-[15px] font-bold text-nav shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
            >
              {joined ? "가입 정보 다시 입력" : "가입 상담 시작하기"}
            </Link>
            {[
              ["/family", "가족 앱"],
              ["/elder", "어르신 화면"],
              ["/concierge", "컨시어지"],
              ["/dispatch", "관제 콘솔"],
              ["/admin", "경영 콘솔"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="btn-press block rounded-2xl border border-white/25 py-3.5 text-center text-[15px] font-bold text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          <p className="mt-8 border-t border-white/10 pt-4 text-[12px] leading-[1.8] text-white/40">
            데모 빌드입니다 — 결제 · 웨어러블 · 병원 연동은 &ldquo;연동 대기&rdquo;로 표기됩니다.
          </p>
        </div>
      </div>
    </>
  );
}
