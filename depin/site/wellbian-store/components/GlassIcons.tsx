/* 8/28 서우 5차: 래스터 3D 아이콘(힉스필드 webp) → 인라인 SVG로 교체.
   요구 재질 = "반투명 · 색상 약한 · 약한 유광".
   - 본체는 브랜드 바이올렛을 0.28~0.55 알파로만 채워 뒤 배경(글래스 카드·도시 사진)이 비치게 한다
   - 유광은 상단 하이라이트 그라디언트 + 옅은 스펙큘러 하나로 "약하게"만 준다 (하이글로스 금지)
   - 흰 받침(스탠드)은 서우 지시로 유지 — 반투명 흰 타원
   래스터를 쓰지 않으므로 CDN 이송이 필요 없고, 배율·테마에 관계없이 선명하다. */

import React from "react";

const V = "124,107,240"; /* 브랜드 바이올렛 */

/* 공용 defs — id 충돌을 막으려 인스턴스마다 접두사를 받는다 */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      {/* 본체: 위가 밝고 아래로 옅어지는 반투명 채움 */}
      <linearGradient id={`${p}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={`rgba(${V},.52)`} />
        <stop offset="1" stopColor={`rgba(${V},.28)`} />
      </linearGradient>
      {/* 약한 유광: 상단 45%에만 걸리는 흰 하이라이트 */}
      <linearGradient id={`${p}-gloss`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.62)" />
        <stop offset=".45" stopColor="rgba(255,255,255,.10)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      {/* 받침: 반투명 흰 타원 */}
      <linearGradient id={`${p}-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.92)" />
        <stop offset="1" stopColor="rgba(255,255,255,.55)" />
      </linearGradient>
      <radialGradient id={`${p}-shadow`} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="rgba(27,27,72,.20)" />
        <stop offset="1" stopColor="rgba(27,27,72,0)" />
      </radialGradient>
    </defs>
  );
}

/* 받침 + 접지 그림자 (4개 아이콘 공통, 광학 정렬 기준) */
function Pedestal({ p, cy = 82 }: { p: string; cy?: number }) {
  return (
    <>
      <ellipse cx="48" cy={cy + 4} rx="30" ry="9" fill={`url(#${p}-shadow)`} />
      <ellipse cx="48" cy={cy} rx="26" ry="7.5" fill={`url(#${p}-base)`} stroke="rgba(255,255,255,.85)" strokeWidth="1" />
    </>
  );
}

type IconProps = { size?: number; className?: string };
const box = (size: number): React.CSSProperties => ({ width: size, height: size, display: "block", flexShrink: 0 });

/* ① 측정 — 공기질 측정기(화면에 지표 셀 3개) */
export function IconMeasure({ size = 120, className }: IconProps) {
  const p = "im";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <Pedestal p={p} />
      <g>
        <rect x="22" y="18" width="52" height="52" rx="13" fill={`url(#${p}-body)`} stroke="rgba(255,255,255,.75)" strokeWidth="1.4" />
        <rect x="30" y="30" width="36" height="21" rx="5" fill="rgba(255,255,255,.55)" stroke="rgba(255,255,255,.8)" strokeWidth="1" />
        {/* 지표 셀 — 색상은 약하게(알파 .55) */}
        <rect x="34" y="35" width="8" height="11" rx="2.2" fill="rgba(244,132,95,.62)" />
        <rect x="44" y="35" width="8" height="11" rx="2.2" fill="rgba(90,200,168,.62)" />
        <rect x="54" y="35" width="8" height="11" rx="2.2" fill={`rgba(${V},.62)`} />
        <rect x="34" y="57" width="28" height="4" rx="2" fill="rgba(255,255,255,.5)" />
        <rect x="22" y="18" width="52" height="52" rx="13" fill={`url(#${p}-gloss)`} />
      </g>
    </svg>
  );
}

/* ② 검증 — 방패 + 체크 */
export function IconVerify({ size = 120, className }: IconProps) {
  const p = "iv";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <Pedestal p={p} />
      <g>
        {/* 면적이 큰 형상이라 같은 알파에서도 더 진해 보임 → 방패만 채움을 한 단계 낮춰 4개를 광학 균일화 */}
        <path
          d="M48 14 L72 23 V45 C72 59 61 68.5 48 73 C35 68.5 24 59 24 45 V23 Z"
          fill={`rgba(${V},.34)`}
          stroke="rgba(255,255,255,.75)"
          strokeWidth="1.4"
        />
        <path d="M37 44.5 L45 52.5 L60 36.5" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M48 14 L72 23 V45 C72 59 61 68.5 48 73 C35 68.5 24 59 24 45 V23 Z" fill={`url(#${p}-gloss)`} />
      </g>
    </svg>
  );
}

/* ③ 보상 — 코인 스택 (원화·달러 각인 없음: 보상은 현금이 아니며 지급량·가치 비보장) */
export function IconReward({ size = 120, className }: IconProps) {
  const p = "ir";
  const disc = (cy: number, o: number) => (
    <g key={cy}>
      <ellipse cx="48" cy={cy} rx="22" ry="8" fill={`rgba(${V},${o})`} stroke="rgba(255,255,255,.7)" strokeWidth="1.2" />
      <ellipse cx="48" cy={cy - 1.6} rx="15" ry="4.6" fill="rgba(255,255,255,.34)" />
    </g>
  );
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <Pedestal p={p} />
      <g>
        {/* 옆면(스택 두께) */}
        <path d="M26 30 V60 A22 8 0 0 0 70 60 V30 Z" fill={`rgba(${V},.30)`} />
        {disc(60, 0.48)}
        {disc(50, 0.46)}
        {disc(40, 0.44)}
        {disc(30, 0.5)}
        <path d="M26 30 V60 A22 8 0 0 0 70 60 V30 Z" fill={`url(#${p}-gloss)`} />
      </g>
    </svg>
  );
}

/* ④ 활용 — 성장 막대 + 상승 화살표 */
export function IconUse({ size = 120, className }: IconProps) {
  const p = "iu";
  const bar = (x: number, y: number, o: number) => (
    <g key={x}>
      <rect x={x} y={y} width="12" height={72 - y} rx="3.5" fill={`rgba(${V},${o})`} stroke="rgba(255,255,255,.7)" strokeWidth="1.2" />
      <rect x={x} y={y} width="12" height={(72 - y) * 0.5} rx="3.5" fill="rgba(255,255,255,.28)" />
    </g>
  );
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <Pedestal p={p} />
      <g>
        {bar(24, 54, 0.4)}
        {bar(40, 44, 0.46)}
        {bar(56, 32, 0.52)}
        <path d="M26 40 L44 30 L58 20" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 18 H61 V29" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/* ───────── 선순환 칩 행 아이콘 (작은 사이즈, 받침 없음) ───────── */

/* 데이터 — 실린더 스택 */
export function IconData({ size = 34, className }: IconProps) {
  const p = "cd";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <path d="M9 14 V34 A15 5.5 0 0 0 39 34 V14 Z" fill={`rgba(${V},.30)`} />
      {[34, 26, 18].map((cy, i) => (
        <g key={cy}>
          <ellipse cx="24" cy={cy} rx="15" ry="5.5" fill={`rgba(${V},${0.42 + i * 0.04})`} stroke="rgba(255,255,255,.72)" strokeWidth="1" />
          <ellipse cx="24" cy={cy - 1.2} rx="9.5" ry="3" fill="rgba(255,255,255,.32)" />
        </g>
      ))}
      <ellipse cx="24" cy="14" rx="15" ry="5.5" fill={`rgba(${V},.5)`} stroke="rgba(255,255,255,.8)" strokeWidth="1" />
      <ellipse cx="24" cy="12.6" rx="9.5" ry="3" fill="rgba(255,255,255,.4)" />
    </svg>
  );
}

/* 유통 — 라운드 타일 안 라인 차트 */
export function IconFlow({ size = 34, className }: IconProps) {
  const p = "cf";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <rect x="7" y="7" width="34" height="34" rx="10" fill={`url(#${p}-body)`} stroke="rgba(255,255,255,.75)" strokeWidth="1.2" />
      <path d="M14 30 L21 22 L27 27 L34 17" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="7" width="34" height="34" rx="10" fill={`url(#${p}-gloss)`} />
    </svg>
  );
}

/* 수익 — 코인 스택(각인 없음) */
export function IconCoins({ size = 34, className }: IconProps) {
  const p = "cc";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <path d="M10 16 V32 A14 5 0 0 0 38 32 V16 Z" fill={`rgba(${V},.30)`} />
      {[32, 26, 20].map((cy, i) => (
        <g key={cy}>
          <ellipse cx="24" cy={cy} rx="14" ry="5" fill={`rgba(${V},${0.42 + i * 0.04})`} stroke="rgba(255,255,255,.72)" strokeWidth="1" />
          <ellipse cx="24" cy={cy - 1.1} rx="8.5" ry="2.7" fill="rgba(255,255,255,.32)" />
        </g>
      ))}
      <ellipse cx="24" cy="16" rx="14" ry="5" fill={`rgba(${V},.5)`} stroke="rgba(255,255,255,.8)" strokeWidth="1" />
      <ellipse cx="24" cy="14.9" rx="8.5" ry="2.7" fill="rgba(255,255,255,.4)" />
    </svg>
  );
}

/* 순환 — 마지막에서 처음으로 돌아가는 두 개의 화살표 */
export function IconLoop({ size = 38, className }: IconProps) {
  const p = "cl";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g fill="none" stroke={`url(#${p}-loopStroke)`} strokeWidth="6" strokeLinecap="round">
        <defs>
          <linearGradient id={`${p}-loopStroke`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`rgba(${V},.62)`} />
            <stop offset="1" stopColor={`rgba(${V},.38)`} />
          </linearGradient>
        </defs>
        <path d="M35 20 A13 13 0 0 0 13 15" />
        <path d="M13 28 A13 13 0 0 0 35 33" />
      </g>
      <path d="M13 8 v8 h8" fill="none" stroke={`rgba(${V},.62)`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 40 v-8 h-8" fill="none" stroke={`rgba(${V},.42)`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* 약한 유광 — 위쪽 호에만 */}
      <path d="M35 20 A13 13 0 0 0 13 15" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
