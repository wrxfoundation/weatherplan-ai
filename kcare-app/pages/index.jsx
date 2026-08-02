import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAppState } from "../lib/state";

// 데모 홈 = 시연 허브 — 6단계 시연 동선(슬라이드와 동일) + 라이브 데모 상태 + 원탭 초기화.
// KO/EN 토글은 허브 한정 (해외 이해관계자 배석 대비) — 앱 본문은 한국어 단일.

const T = {
  ko: {
    // 슬로건은 예방·변화 감지로 확립 — 병원 동행은 연 1회 포함분이라
    // 간판으로 걸면 서비스의 무게중심(매월 안심방문 + 생활 요청)을 가린다.
    h1: "부모님의 작은 변화를,\n가장 먼저 알아채는 사람",
    sub: "몸만이 아니라 마음도 봅니다. 매월 같은 사람이 같은 기준으로 몸·마음·집 21항목을 보고, 지난달과 달라진 점을 기록합니다. 말수가 줄고 외출이 없어지는 것이 혈압보다 먼저 오기 때문입니다. 2인 1조 · 24시간 관제 · 구독 멤버십.",
    demoState: "DEMO 상태",
    idle: "대기 — 시연 준비 완료",
    reset: "↺ 시연 초기화",
    flowTitle: "시연 동선 — 15분 데모 가이드",
    flowHint: "순서대로 클릭 · 하나의 케어 루프",
    closing: "클로징 3원칙 — 구조가 해자 (동의 · 접근 기록 전면 공개) · 사람이 최종 판단 (L4) · 케어가 지표 (판매액 없는 평가)",
    join: "가입 상담 시작하기",
    rejoin: "가입 정보 다시 입력",
    footer: "데모 빌드입니다 — 결제 · 웨어러블 · 병원 연동은 “연동 대기”로 표기됩니다.",
    joinedChip: (name) => `가입 완료 · ${name}님 가구`,
    sosChip: (d) => (d ? "SOS · 급파 중" : "SOS 진행 중"),
    visitChip: "동행 중 (체크인)",
    npsChip: "NPS 회복 콜 대기",
    roles: [["/service", "서비스 소개 (대외)"], ["/family", "가족 앱"], ["/elder", "어르신 화면"], ["/concierge-onboarding", "컨시어지 등록"], ["/concierge", "컨시어지"], ["/dispatch", "관제 콘솔"], ["/admin", "경영 콘솔"], ["/care-profile", "케어 프로필"]],
    steps: [
      { n: "01", role: "어르신", href: "/elder", text: "SOS 글라스 버튼 (2초 홀드) · 소리로 듣기 · AI 안부 전화 — 빨강은 SOS뿐" },
      { n: "02", role: "보호자", href: "/family", text: "시연 컨트롤로 SOS 발생 → 배너 확인 · NPS 4점 제출 (회복 플로우)" },
      { n: "03", role: "관제", href: "/dispatch", text: "상태 필 · 급파 지시 → 액션 큐에 NPS 회복 콜 자동 등장" },
      { n: "04", role: "컨시어지", href: "/concierge", text: "긴급 급파 배너 수락 · 선호 카드 · 오늘의 한 끗" },
      { n: "05", role: "감사 로그", href: "/dispatch?menu=comms", text: "커뮤니케이션 메뉴 티커 — 전 역할의 액션이 실시간 기록 (열람도 공개)" },
      { n: "06", role: "경영", href: "/admin", text: "사람 KPI · CRM 라이프사이클 · NPS 루프 · 신뢰 거버넌스로 클로징" },
    ],
  },
  en: {
    h1: "The first to notice\nthe small changes",
    sub: "We watch the mind as closely as the body. The same person visits every month, checks the same 21 items across body, mind and home, and records what changed — because fewer words and fewer outings come long before blood pressure does. Two-person teams · 24/7 dispatch · subscription membership.",
    demoState: "DEMO STATE",
    idle: "Idle — ready to present",
    reset: "↺ Reset demo",
    flowTitle: "Demo flow — 15-minute guide",
    flowHint: "Click in order · one care loop",
    closing: "Closing principles — Trust is the moat (consent & access log fully disclosed) · Humans make the final call (L4) · Care is the metric (no sales-based evaluation)",
    join: "Start enrollment",
    rejoin: "Re-enter enrollment info",
    footer: "Demo build — payments, wearables and hospital integrations are marked as “pending”.",
    joinedChip: (name) => `Enrolled · ${name}'s household`,
    sosChip: (d) => (d ? "SOS · dispatching" : "SOS active"),
    visitChip: "Visit in progress",
    npsChip: "NPS recovery call queued",
    roles: [["/service", "Service site"], ["/family", "Family app"], ["/elder", "Elder screen"], ["/concierge-onboarding", "Concierge signup"], ["/concierge", "Concierge"], ["/dispatch", "Dispatch console"], ["/admin", "Executive console"], ["/care-profile", "Care profile"]],
    steps: [
      { n: "01", role: "Elder", href: "/elder", text: "Glass SOS button (2s hold) · listen aloud · AI check-in call — red is for SOS only" },
      { n: "02", role: "Family", href: "/family", text: "Trigger SOS from demo controls → banner · submit NPS 4 (recovery flow)" },
      { n: "03", role: "Dispatch", href: "/dispatch", text: "Status pill · dispatch order → NPS recovery call appears in the action queue" },
      { n: "04", role: "Concierge", href: "/concierge", text: "Accept the emergency dispatch banner · preference card · today's one detail" },
      { n: "05", role: "Audit log", href: "/dispatch?menu=comms", text: "Comms-menu ticker — every role's action recorded live (views disclosed too)" },
      { n: "06", role: "Executive", href: "/admin", text: "People KPIs · CRM lifecycle · NPS loop · close with trust governance" },
    ],
  },
};

export default function Home() {
  const { state, dispatch } = useAppState();
  const [lang, setLang] = useState("ko");
  const t = T[lang];
  const joined = !!state.onboarding;

  // 라이브 데모 상태 — 발표자가 현재 시연 상태를 한눈에
  const live = [
    joined && { label: t.joinedChip(state.onboarding.elderName || "김순자"), cls: "bg-gold/20 text-[#E8CFA4]" },
    state.demo.sos && { label: t.sosChip(state.ops.sosDispatched), cls: "bg-danger text-white animate-sosPulse" },
    state.visit.checkedIn && { label: t.visitChip, cls: "bg-green/20 text-[#8FE3C0]" },
    state.ops.npsDetractor && { label: t.npsChip, cls: "bg-[rgba(138,93,18,.3)] text-[#F0D9A8]" },
  ].filter(Boolean);

  return (
    <>
      <Head>
        <title>K-CARE</title>
      </Head>
      <div className="flex min-h-screen items-start justify-center bg-nav px-5">
        <div className="w-full max-w-[880px] py-12">
          <div className="flex items-start justify-between">
            <div className="font-num text-[29px] font-extrabold tracking-[.04em] text-white">
              K-CARE <span className="align-top text-[11px] font-bold text-gold">BETA</span>
            </div>
            <div className="flex gap-1 rounded-full border border-white/15 p-1">
              {["ko", "en"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`btn-press rounded-full px-3 py-1 text-[11px] font-bold ${
                    lang === l ? "bg-white text-nav" : "text-white/50"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {/* whitespace-pre-line: 카피의 개행(\n)을 그대로 살린다 — 슬로건은 줄바꿈 위치가 리듬이다 */}
          <h1 className="mt-4 whitespace-pre-line break-keep text-[30px] font-black leading-[1.35] text-white">
            {t.h1}
          </h1>
          <p className="mt-3 max-w-[62ch] break-keep text-[15px] leading-[1.8] text-white/60">{t.sub}</p>

          {/* 라이브 데모 상태 + 초기화 */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold tracking-[.12em] text-white/40">{t.demoState}</span>
            {live.length === 0 && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white/60">{t.idle}</span>
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
              {t.reset}
            </button>
          </div>

          {/* 시연 동선 6단계 — 슬라이드와 동일한 순서 */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-bold text-white">{t.flowTitle}</h2>
              <span className="text-[11px] text-white/40">{t.flowHint}</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {t.steps.map((s) => (
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
            <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-[1.7] text-white/40">{t.closing}</p>
          </div>

          {/* 역할 바로가기 + 온보딩 */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/onboarding"
              className="btn-press block rounded-2xl bg-gold py-3.5 text-center text-[15px] font-bold text-nav shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
            >
              {joined ? t.rejoin : t.join}
            </Link>
            {t.roles.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="btn-press block rounded-2xl border border-white/25 py-3.5 text-center text-[15px] font-bold text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          <p className="mt-8 border-t border-white/10 pt-4 text-[12px] leading-[1.8] text-white/40">{t.footer}</p>
        </div>
      </div>
    </>
  );
}
