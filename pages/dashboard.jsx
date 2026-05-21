/* ============================================================
 * Weather Plan AI · /dashboard
 *
 * MVP placeholder — 정식 대시보드는 v1.1에서 출시
 * 광고주가 등록 직후 보는 첫 화면 (베타 기간)
 *
 * 목적:
 * - 죽은 링크 방지 (OnboardingFlow 완료 → /dashboard 리다이렉트)
 * - 출시 로드맵 안내 (v1.1 / v1.2 / v2.0 예정 기능)
 * - 베타 기간 동안 핵심 액션 3가지 제공 (스튜디오 · 추가 등록 · 정확도 공시)
 * ============================================================ */

import React from "react";

const T = {
  canvas:        "#FFFFFF",
  surface:       "#F7F5EE",
  surfaceSoft:   "#FAF8F2",
  ink:           "#050038",
  charcoal:      "#1A1A1A",
  slate:         "#4F5460",
  steel:         "#7B7F8C",
  muted:         "#9CA3AF",
  hairline:      "rgba(5,0,56,0.12)",
  hairlineSoft:  "rgba(5,0,56,0.08)",
  brandTeal:     "#4EB3A8",
  mossDark:      "#14443B",
  brandBlue:     "#4262FF",
  tealLight:     "#D7F2EE",
  onPrimary:     "#FFFFFF",
};

const R = { sm: 8, md: 10, lg: 12, xl: 16, xxl: 20, xxxl: 24, full: 9999 };

function Icon({ name, size = 18, stroke = 2 }) {
  const p = {
    width: size, height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "cloud":       return <svg {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775A6.5 6.5 0 1 0 5.5 19Z"/></svg>;
    case "sparkles":    return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case "check":       return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "clock":       return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "calendar":    return <svg {...p}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>;
    case "shield":      return <svg {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>;
    default: return null;
  }
}

const ROADMAP = [
  { v: "v1.0", label: "현재",            status: "live",
    items: ["랜딩 페이지", "온보딩 3단계 등록", "스튜디오 챗봇 16업종", "광고 콘솔 deep-link"] },
  { v: "v1.1", label: "다음 출시",       status: "next",
    items: ["일별 추천 결과 자동 발송", "정확도 점수 사후 갱신", "성과 검증 리포트 (광고비 ROI)", "광고주 카톡 알림"] },
  { v: "v1.2", label: "준비 중",         status: "planned",
    items: ["광고대행사 다중 광고주 콘솔", "AE 일간 보고용 자동 요약", "광고주별 대화 분리·저장", "예보관 직접 1:1 채팅"] },
  { v: "v2.0", label: "장기 로드맵",     status: "planned",
    items: ["광고 자동 실행 (광고주 승인 시)", "사진 AI 분석 22종 연동", "글로벌 5,400+ 도시 캠페인", "Wellbian 사용자 카테고리 광고 inventory"] },
];

const QUICK_ACTIONS = [
  { icon: "sparkles",  label: "스튜디오에서 새 추천 받기",     href: "/studio",       desc: "16개 업종 × 실시간 챗봇" },
  { icon: "cloud",     label: "다른 사업장 추가 등록",         href: "/onboarding",   desc: "광고주 5~10개 운영 AE 추천" },
];

function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="select-none flex-shrink-0" style={{ display: "block" }}>
      <g stroke="#0080FF" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="3"  x2="24" y2="10" />
        <line x1="36" y1="12" x2="40" y2="8"  />
        <line x1="38" y1="24" x2="45" y2="24" />
        <line x1="36" y1="36" x2="40" y2="40" />
        <line x1="24" y1="38" x2="24" y2="45" />
        <line x1="12" y1="36" x2="8"  y2="40" />
        <line x1="10" y1="24" x2="14" y2="24" />
        <line x1="12" y1="12" x2="8"  y2="8"  />
      </g>
      <circle cx="2.5" cy="24" r="1.8" fill="#4EB3A8" />
      <circle cx="24" cy="24" r="8" stroke="#0080FF" strokeWidth="3" />
      <g stroke="#4EB3A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="19" y1="29" x2="30" y2="18" />
        <polyline points="24,18 30,18 30,24" />
      </g>
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.surface, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif" }}>
      <header style={{
        background: T.canvas,
        borderBottom: `1px solid ${T.hairlineSoft}`,
        padding: "14px 20px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div className="max-w-[960px] mx-auto flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 min-w-0">
            <BrandMark size={32} />
            <div className="leading-none min-w-0">
              <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                Weather Plan AI
              </div>
              <div className="hidden sm:block" style={{ color: T.steel, fontSize: 11, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
                by KWeather · wellbian AI
              </div>
            </div>
          </a>

          <span style={{
            background: T.tealLight, color: T.mossDark,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            padding: "4px 11px", borderRadius: R.full,
            border: `1px solid ${T.brandTeal}`,
            whiteSpace: "nowrap",
          }}>
            🎁 BETA 무료
          </span>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-6 py-10">

        {/* 환영 카드 */}
        <div style={{
          background: T.canvas,
          border: `1px solid ${T.hairlineSoft}`,
          borderRadius: R.xxxl,
          padding: "32px 28px",
          marginBottom: 28,
          boxShadow: "0 1px 3px rgba(5,0,56,0.04), 0 8px 24px rgba(5,0,56,0.06)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: -80, right: -80,
            width: 240, height: 240,
            background: `radial-gradient(circle, rgba(78,179,168,0.18) 0%, transparent 70%)`,
            borderRadius: R.full,
            pointerEvents: "none",
          }} />

          <div className="inline-flex items-center gap-1.5 mb-4" style={{
            background: T.tealLight, color: T.mossDark,
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
            padding: "4px 11px", borderRadius: R.full,
            border: `1px solid ${T.brandTeal}`,
          }}>
            <Icon name="sparkles" size={11} stroke={2} />
            등록 완료 · 베타 합류
          </div>

          <h1 style={{
            color: T.ink, fontSize: "clamp(24px, 3.6vw, 36px)",
            fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25,
            marginBottom: 12,
          }}>
            환영합니다.<br />
            <span style={{ color: T.mossDark }}>광고 추천 시스템이 학습 중</span>입니다.
          </h1>
          <p style={{ color: T.slate, fontSize: 14.5, fontWeight: 400, lineHeight: 1.65, maxWidth: 620, wordBreak: "keep-all" }}>
            등록하신 사업장 정보를 케이웨더 60일 예보·100+ 시그널과 매칭하고 있습니다.
            <br />
            <strong style={{ color: T.ink, fontWeight: 600 }}>정식 대시보드는 다음 버전에서 출시</strong>됩니다. 그동안은 아래 기능으로 추천을 받아보실 수 있습니다.
          </p>
        </div>

        {/* 빠른 액션 3개 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: T.steel, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
            지금 할 수 있는 것
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="transition active:translate-y-px hover:opacity-95"
                style={{
                  background: T.canvas,
                  border: `1px solid ${T.hairlineSoft}`,
                  borderRadius: R.xxl,
                  padding: "18px 20px",
                  textDecoration: "none",
                  display: "flex", flexDirection: "column", gap: 10,
                  boxShadow: "0 1px 2px rgba(5,0,56,0.04)",
                }}
              >
                <div style={{
                  width: 36, height: 36,
                  background: T.tealLight, color: T.mossDark,
                  borderRadius: R.md,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${T.brandTeal}`,
                }}>
                  <Icon name={action.icon} size={18} stroke={2} />
                </div>
                <div>
                  <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4, wordBreak: "keep-all" }}>
                    {action.label}
                  </div>
                  <div style={{ color: T.steel, fontSize: 12, fontWeight: 400, lineHeight: 1.5, wordBreak: "keep-all" }}>
                    {action.desc}
                  </div>
                </div>
                <div style={{ color: T.mossDark, fontSize: 12, fontWeight: 600, marginTop: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                  바로 가기 <Icon name="arrow-right" size={11} stroke={2.2} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 로드맵 */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div style={{ color: T.steel, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <Icon name="calendar" size={11} stroke={2} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />
              출시 로드맵
            </div>
            <span style={{ color: T.muted, fontSize: 11.5, fontWeight: 500 }}>
              베타 종료 시점은 별도 공지 · 1.0이 안정화될 때까지 무료
            </span>
          </div>

          <div className="space-y-3">
            {ROADMAP.map((r) => {
              const isLive = r.status === "live";
              const isNext = r.status === "next";
              return (
                <div
                  key={r.v}
                  style={{
                    background: isLive ? T.tealLight : T.canvas,
                    border: `1px solid ${isLive ? T.brandTeal : T.hairlineSoft}`,
                    borderRadius: R.xxl,
                    padding: "18px 22px",
                    opacity: r.status === "planned" ? 0.85 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span style={{
                        background: isLive ? T.mossDark : (isNext ? T.brandBlue : T.steel),
                        color: "#FFFFFF",
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                        padding: "3px 10px", borderRadius: R.full,
                      }}>
                        {r.v}
                      </span>
                      <span style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>
                        {r.label}
                      </span>
                    </div>
                    {isLive && (
                      <span style={{
                        background: T.mossDark, color: "#FFFFFF",
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                        padding: "2px 9px", borderRadius: R.full,
                      }}>
                        LIVE
                      </span>
                    )}
                    {isNext && (
                      <span style={{
                        background: "transparent", color: T.brandBlue,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                        padding: "2px 9px", borderRadius: R.full,
                        border: `1px solid ${T.brandBlue}`,
                      }}>
                        다음 출시
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {r.items.map((item) => (
                      <div key={item} className="flex items-start gap-2" style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all" }}>
                        <span style={{ color: isLive ? T.mossDark : T.muted, marginTop: 3, flexShrink: 0 }}>
                          {isLive ? <Icon name="check" size={11} stroke={2.5} /> : <Icon name="clock" size={11} stroke={2} />}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p style={{ color: T.muted, fontSize: 11.5, fontWeight: 400, lineHeight: 1.65, wordBreak: "keep-all" }}>
            의견·문의는 <a href="mailto:weatherplan@kweather.co.kr" style={{ color: T.mossDark, fontWeight: 600 }}>weatherplan@kweather.co.kr</a> 로 보내주세요.<br />
            여러분의 피드백이 다음 버전을 만듭니다.
          </p>
        </div>

      </main>
    </div>
  );
}
