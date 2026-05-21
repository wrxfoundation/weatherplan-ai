/* ============================================================
 * Weather Plan AI · /legal
 *
 * 법적 고지 통합 페이지 (베타 기간)
 * - #terms: 이용약관
 * - #privacy: 개인정보처리방침
 * - #business: 사업자 정보
 * ============================================================ */

import React from "react";
import Head from "next/head";

const T = {
  canvas: "#FFFFFF", surface: "#F7F5EE",
  ink: "#050038", charcoal: "#1A1A1A", slate: "#4F5460", steel: "#7B7F8C", muted: "#9CA3AF",
  hairline: "rgba(5,0,56,0.12)", hairlineSoft: "rgba(5,0,56,0.08)",
  brandTeal: "#4EB3A8", mossDark: "#14443B", tealLight: "#D7F2EE",
};

const SECTIONS = [
  {
    id: "terms",
    title: "이용약관",
    sub: "Weather Plan AI 서비스 이용약관",
    updated: "2026-05-21",
    body: [
      ["제1조 (목적)", "본 약관은 KWeather 디지털사업본부(이하 '회사')가 운영하는 Weather Plan AI 서비스(이하 '서비스')의 이용과 관련된 권리·의무 및 책임 사항, 기타 필요한 사항을 규정함을 목적으로 합니다."],
      ["제2조 (정의)", "1. '서비스'란 케이웨더 60일 예보·100+ 시그널을 기반으로 광고 의사결정 추천을 제공하는 AI 서비스를 말합니다.\n2. '이용자'란 본 약관에 따라 서비스를 이용하는 개인 또는 사업자를 말합니다.\n3. '베타 기간'이란 v1.0 정식 출시 이전까지의 무료 시범 운영 기간을 말합니다."],
      ["제3조 (서비스 제공)", "1. 회사는 베타 기간 동안 서비스를 무료로 제공합니다.\n2. AI 추천 결과는 의사결정 보조 자료이며, 실제 광고 집행에 대한 최종 책임은 이용자에게 있습니다.\n3. 회사는 시스템 점검·장애 복구·기능 추가 등의 사유로 서비스 일시 중단을 시행할 수 있습니다."],
      ["제4조 (책임 제한)", "회사는 천재지변, 통신망 장애, AI 모델 응답 지연 등 회사의 통제를 벗어난 사유로 인한 손해에 대해 책임을 지지 않습니다."],
      ["제5조 (지적재산권)", "서비스 내 모든 콘텐츠·로고·디자인의 지적재산권은 회사 또는 정당한 권리자에게 귀속됩니다."],
      ["제6조 (분쟁 해결)", "본 약관과 관련된 분쟁은 회사 본점 소재지를 관할하는 법원을 합의관할로 합니다."],
    ],
  },
  {
    id: "privacy",
    title: "개인정보처리방침",
    sub: "Weather Plan AI 개인정보 수집·이용·보관 방침",
    updated: "2026-05-21",
    body: [
      ["1. 수집하는 개인정보 항목",
        "필수 항목: 사업장명, 사업장 위치(시·도/시·군·구), 업종, 광고 예산 구간, 광고 채널 선호\n수집 방법: 온보딩 페이지 폼 입력\n저장 위치: 이용자 브라우저 localStorage (회사 서버에는 저장되지 않음)"],
      ["2. 개인정보 이용 목적",
        "1) 광고 추천 결과 산출\n2) 베타 사용성 개선을 위한 통계 분석 (식별 불가능한 집계 형태)"],
      ["3. 개인정보 보유 및 이용 기간",
        "이용자 단말기 localStorage에 저장되며, 이용자가 직접 삭제하거나 브라우저 데이터를 초기화할 때까지 유지됩니다. 회사 서버에는 별도 저장되지 않습니다."],
      ["4. 제3자 제공",
        "회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다."],
      ["5. 이용자의 권리",
        "이용자는 언제든 브라우저 설정에서 localStorage 데이터를 삭제하여 서비스 이용 정보를 완전히 제거할 수 있습니다."],
      ["6. 개인정보 보호 담당자",
        "이메일: weatherplan@kweather.co.kr"],
    ],
  },
  {
    id: "business",
    title: "사업자 정보",
    sub: "KWeather Corp.",
    updated: "2026-05-21",
    body: [
      ["상호", "주식회사 케이웨더 (KWeather Corp.)"],
      ["대표자", "김동식"],
      ["사업자 등록번호", "104-81-46907"],
      ["통신판매업 신고번호", "제2010-서울영등포-0857호"],
      ["본점 소재지", "서울특별시 영등포구 양평로21길 26, 11층 (양평동5가, 코오롱디지털타워)"],
      ["대표전화", "02-3149-0114"],
      ["서비스 문의", "weatherplan@kweather.co.kr"],
      ["상장 정보", "코스닥 상장 (KOSDAQ)"],
    ],
  },
];

export default function LegalPage() {
  return (
    <>
      <Head>
        <title>법적 고지 · Weather Plan AI</title>
        <meta name="description" content="Weather Plan AI 이용약관·개인정보처리방침·사업자 정보. KWeather 디지털사업본부 운영." />
        <meta name="robots" content="index, follow" />
      </Head>
      <div style={{ minHeight: "100vh", background: T.surface, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif" }}>
        <header style={{ background: T.canvas, borderBottom: `1px solid ${T.hairlineSoft}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-[820px] mx-auto flex items-center justify-between gap-3">
            <a href="/" style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", textDecoration: "none" }}>
              ← Weather Plan AI
            </a>
            <span style={{ color: T.steel, fontSize: 11.5, fontWeight: 500 }}>법적 고지</span>
          </div>
        </header>

        <main className="max-w-[820px] mx-auto px-6 py-10">
          <h1 style={{ color: T.ink, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 8 }}>
            법적 고지
          </h1>
          <p style={{ color: T.slate, fontSize: 13.5, fontWeight: 400, lineHeight: 1.65, marginBottom: 28 }}>
            이용약관, 개인정보처리방침, 사업자 정보를 모아 보실 수 있습니다.
          </p>

          {/* 목차 */}
          <nav className="flex flex-wrap items-center gap-2 mb-10" style={{ background: T.canvas, border: `1px solid ${T.hairlineSoft}`, borderRadius: 14, padding: "12px 14px" }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{
                background: T.tealLight, color: T.mossDark,
                fontSize: 12, fontWeight: 600,
                padding: "5px 12px", borderRadius: 9999,
                textDecoration: "none",
                border: `1px solid ${T.brandTeal}`,
                letterSpacing: "-0.005em",
              }}>
                {s.title}
              </a>
            ))}
          </nav>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} style={{
              background: T.canvas,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: 20,
              padding: "26px 28px",
              marginBottom: 18,
              scrollMarginTop: 80,
              boxShadow: "0 1px 3px rgba(5,0,56,0.04)",
            }}>
              <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
                <h2 style={{ color: T.ink, fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em" }}>
                  {s.title}
                </h2>
                <span style={{ color: T.muted, fontSize: 11.5, fontWeight: 500 }}>
                  최종 갱신 {s.updated}
                </span>
              </div>
              <p style={{ color: T.steel, fontSize: 13, fontWeight: 400, marginBottom: 18, letterSpacing: "-0.005em" }}>
                {s.sub}
              </p>

              <div className="space-y-5">
                {s.body.map(([title, content], i) => (
                  <div key={i}>
                    <div style={{ color: T.mossDark, fontSize: 13, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.005em" }}>
                      {title}
                    </div>
                    <div style={{ color: T.charcoal, fontSize: 13, fontWeight: 400, lineHeight: 1.7, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
                      {content}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-8 text-center" style={{ color: T.muted, fontSize: 11.5, fontWeight: 400, lineHeight: 1.65 }}>
            추가 문의는 <a href="mailto:weatherplan@kweather.co.kr" style={{ color: T.mossDark, fontWeight: 600 }}>weatherplan@kweather.co.kr</a> 로 주세요.
          </div>
        </main>
      </div>
    </>
  );
}
