/* 8/28 서우 6차: 아이콘 전면 교체 — 참고 시안의 "글래스 3D" 스타일.
   색상 톤은 기존 브랜드 바이올렛 유지(시안은 블루였으나 지시대로 톤 보존).

   시안에서 읽은 재질 규칙:
   - 코어는 진하게, 그 위를 감싸는 유리 셸은 옅게 — 두 겹으로 두께를 만든다
   - 좌상단 스펙큘러(밝은 하이라이트) 하나 + 림 라이트(테두리 밝은 선)
   - 받침(스탠드) 없이 떠 있고, 아래에 색이 밴 소프트 섀도만 깐다
   - 모티프: ① 구름 in 유리 원반 · ② 방패+체크 · ③ 스택+체크 배지 · ④ 막대+상승 화살표

   5차의 흰 타원 받침은 시안에 없어 제거했다(되살리려면 Pedestal 복구).
   래스터가 아니라 CDN 이송이 필요 없고 배율·테마에 관계없이 선명하다. */

import React from "react";

/* 브랜드 바이올렛 램프 — 톤 유지, 명도만 3단 */
const C_LIGHT = "#B6ACFF";
const C_MID = "#8B7BF2";
const C_DEEP = "#5B49D8";
const V = "124,107,240";

type IconProps = { size?: number; className?: string };
const box = (size: number): React.CSSProperties => ({ width: size, height: size, display: "block", flexShrink: 0, overflow: "visible" });

/* 공용 그라디언트/필터. id 충돌을 막으려 인스턴스마다 접두사를 받는다 */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      {/* 코어 — 좌상단이 밝고 우하단으로 진해지는 입체 채움 */}
      <linearGradient id={`${p}-core`} x1=".15" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor={C_LIGHT} />
        <stop offset=".5" stopColor={C_MID} />
        <stop offset="1" stopColor={C_DEEP} />
      </linearGradient>
      {/* 유리 셸 — 코어를 감싸는 옅은 겉면(두께감) */}
      <linearGradient id={`${p}-shell`} x1=".2" y1="0" x2=".8" y2="1">
        <stop offset="0" stopColor={`rgba(${V},.26)`} />
        <stop offset="1" stopColor={`rgba(${V},.10)`} />
      </linearGradient>
      {/* 림 라이트 — 위/왼쪽만 밝은 테두리 */}
      <linearGradient id={`${p}-rim`} x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.95)" />
        <stop offset=".45" stopColor="rgba(255,255,255,.35)" />
        <stop offset="1" stopColor="rgba(255,255,255,.08)" />
      </linearGradient>
      {/* 스펙큘러 — 좌상단 한 점 */}
      <radialGradient id={`${p}-spec`} cx=".32" cy=".26" r=".45">
        <stop offset="0" stopColor="rgba(255,255,255,.85)" />
        <stop offset=".55" stopColor="rgba(255,255,255,.18)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      {/* 색이 밴 소프트 섀도 — 받침 대신 접지감을 만든다 */}
      <filter id={`${p}-drop`} x="-40%" y="-30%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor={`rgba(${V},.34)`} />
      </filter>
    </defs>
  );
}

/* ① 측정 — 유리 원반 안의 구름 (실내 공기) */
export function IconMeasure({ size = 120, className }: IconProps) {
  const p = "gm";
  /* 원반 안쪽 원(r=26)에 스트로크까지 여유 있게 들어가도록 직접 치수를 잡은 구름 */
  const cloud =
    "M35 57 C30 57 26 53 26 48 C26 43.5 29.3 39.8 33.6 39.2 " +
    "C35.1 33.4 40.4 29.2 46.6 29.2 C52.4 29.2 57.4 32.9 59.2 38 " +
    "C59.7 37.9 60.2 37.9 60.7 37.9 C65.6 37.9 69.6 41.9 69.6 46.9 " +
    "C69.6 51.8 65.6 57 60.7 57 Z";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        {/* 유리 원반 */}
        <circle cx="48" cy="45" r="33" fill={`url(#${p}-shell)`} stroke={`url(#${p}-rim)`} strokeWidth="2" />
        <circle cx="48" cy="45" r="26" fill="rgba(255,255,255,.30)" />
        {/* 구름 — 시안처럼 굵은 아웃라인 + 옅은 채움 */}
        <path d={cloud} fill="rgba(255,255,255,.55)" />
        <path d={cloud} fill="none" stroke={`url(#${p}-core)`} strokeWidth="6" strokeLinejoin="round" />
        {/* 스펙큘러 */}
        <circle cx="48" cy="45" r="33" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* ② 검증 — 방패 + 체크 */
export function IconVerify({ size = 120, className }: IconProps) {
  const p = "gv";
  const shell = "M48 11 L77 22 V46 C77 62.5 64.5 73.5 48 79 C31.5 73.5 19 62.5 19 46 V22 Z";
  const core = "M48 18 L71 26.5 V46 C71 58.8 61.2 67.7 48 72.2 C34.8 67.7 25 58.8 25 46 V26.5 Z";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        {/* 겉 유리(두께) */}
        <path d={shell} fill={`url(#${p}-shell)`} stroke={`url(#${p}-rim)`} strokeWidth="2" />
        {/* 코어 */}
        <path d={core} fill={`url(#${p}-core)`} />
        <path d="M37.5 46.5 L45 54 L60 38.5" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={core} fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* ③ 보상 — 토큰 스택 + 체크 배지
   (통화 기호는 넣지 않는다: 보상은 현금이 아니고 지급량·가치가 보장되지 않는다) */
export function IconReward({ size = 120, className }: IconProps) {
  const p = "gr";
  const disc = (cy: number) => (
    <g key={cy}>
      <ellipse cx="41" cy={cy} rx="27" ry="10" fill={`url(#${p}-core)`} />
      <ellipse cx="41" cy={cy - 2} rx="18" ry="6" fill="rgba(255,255,255,.30)" />
    </g>
  );
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        {/* 스택 옆면 */}
        <path d="M14 22 V59 A27 10 0 0 0 68 59 V22 Z" fill={`url(#${p}-core)`} opacity=".92" />
        <path d="M14 22 V59 A27 10 0 0 0 68 59 V22 Z" fill={`url(#${p}-shell)`} />
        {disc(59)}
        {disc(40.5)}
        {/* 최상단 디스크는 유리처럼 더 밝게 */}
        <ellipse cx="41" cy="22" rx="27" ry="10" fill="rgba(255,255,255,.62)" stroke={`url(#${p}-rim)`} strokeWidth="1.6" />
        <ellipse cx="41" cy="20.4" rx="18" ry="6" fill="rgba(255,255,255,.5)" />
        {/* 체크 배지 — 시안처럼 스택 우하단에 겹쳐 앉힌다 */}
        <circle cx="68" cy="62" r="15" fill={`url(#${p}-shell)`} stroke={`url(#${p}-rim)`} strokeWidth="2" />
        <circle cx="68" cy="62" r="11.5" fill={`url(#${p}-core)`} opacity=".55" />
        <path d="M62 62 L66.5 66.5 L74.5 57" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="41" cy="41" rx="27" ry="32" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* ④ 활용 — 성장 막대 + 상승 화살표 */
export function IconUse({ size = 120, className }: IconProps) {
  const p = "gu";
  const bar = (x: number, y: number) => (
    <g key={x}>
      <rect x={x} y={y} width="17" height={76 - y} rx="4.5" fill={`url(#${p}-core)`} />
      <rect x={x} y={y} width="17" height={76 - y} rx="4.5" fill={`url(#${p}-shell)`} />
      <rect x={x + 3} y={y + 3.5} width="4.5" height={76 - y - 11} rx="2.2" fill="rgba(255,255,255,.42)" />
      <rect x={x} y={y} width="17" height={76 - y} rx="4.5" fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.6" />
    </g>
  );
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        {bar(15, 56)}
        {bar(39, 45)}
        {bar(63, 32)}
        {/* 상승 화살표 — 시안처럼 막대 위를 지나는 곡선 */}
        <path d="M17 41.5 C31 41.5 43 32.5 51 22.5 C57.5 14.5 64 12.5 71 12.5" fill="none" stroke={`url(#${p}-core)`} strokeWidth="4.8" strokeLinecap="round" />
        <path d="M61 13 L72 12 L71 23" fill="none" stroke={`url(#${p}-core)`} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="15" y="10" width="66" height="68" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* ───────── 선순환 칩 행 아이콘 (작은 사이즈, 같은 재질) ───────── */

/* 데이터 — 실린더 스택 */
export function IconData({ size = 34, className }: IconProps) {
  const p = "cd";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <path d="M9 14 V34 A15 5.5 0 0 0 39 34 V14 Z" fill={`url(#${p}-core)`} opacity=".92" />
        <path d="M9 14 V34 A15 5.5 0 0 0 39 34 V14 Z" fill={`url(#${p}-shell)`} />
        {[34, 24].map((cy) => (
          <ellipse key={cy} cx="24" cy={cy} rx="15" ry="5.5" fill={`url(#${p}-core)`} />
        ))}
        <ellipse cx="24" cy="14" rx="15" ry="5.5" fill="rgba(255,255,255,.6)" stroke={`url(#${p}-rim)`} strokeWidth="1.2" />
        <ellipse cx="24" cy="13" rx="9.5" ry="3.2" fill="rgba(255,255,255,.5)" />
        <ellipse cx="24" cy="24" rx="15" ry="20" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* 유통 — 라운드 타일 안 라인 차트 */
export function IconFlow({ size = 34, className }: IconProps) {
  const p = "cf";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <rect x="6" y="6" width="36" height="36" rx="11" fill={`url(#${p}-core)`} />
        <rect x="6" y="6" width="36" height="36" rx="11" fill={`url(#${p}-shell)`} />
        <rect x="6" y="6" width="36" height="36" rx="11" fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.8" />
        <path d="M13.5 31 L21 22.5 L27 28 L34.5 16.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="6" y="6" width="36" height="36" rx="11" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* 수익 — 토큰 스택(각인 없음) */
export function IconCoins({ size = 34, className }: IconProps) {
  const p = "cc";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <path d="M10 16 V32 A14 5 0 0 0 38 32 V16 Z" fill={`url(#${p}-core)`} opacity=".92" />
        <path d="M10 16 V32 A14 5 0 0 0 38 32 V16 Z" fill={`url(#${p}-shell)`} />
        <ellipse cx="24" cy="32" rx="14" ry="5" fill={`url(#${p}-core)`} />
        <ellipse cx="24" cy="24" rx="14" ry="5" fill={`url(#${p}-core)`} />
        <ellipse cx="24" cy="16" rx="14" ry="5" fill="rgba(255,255,255,.6)" stroke={`url(#${p}-rim)`} strokeWidth="1.2" />
        <ellipse cx="24" cy="15" rx="8.5" ry="2.9" fill="rgba(255,255,255,.5)" />
        {/* 기대어 선 코인 한 닢 — 데이터(IconData) 스택과 실루엣이 겹쳐 구분이 안 되던 문제 */}
        <circle cx="37" cy="30" r="9.5" fill={`url(#${p}-core)`} />
        <circle cx="37" cy="30" r="9.5" fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.4" />
        <ellipse cx="35.6" cy="27.6" rx="5" ry="3.4" transform="rotate(-28 35.6 27.6)" fill="rgba(255,255,255,.42)" />
        <ellipse cx="24" cy="24" rx="14" ry="18" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* 측정망 — 서로 연결된 노드들 (칩 4번: "노드가 늘어 측정망이 촘촘해짐")
   회귀 화살표와 의미가 겹치던 IconLoop를 대체한다 */
export function IconNodes({ size = 34, className }: IconProps) {
  const p = "cn";
  const dot = (cx: number, cy: number, r: number) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${p}-core)`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.1" />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.32} r={r * 0.34} fill="rgba(255,255,255,.45)" />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <g stroke={`url(#${p}-core)`} strokeWidth="2" opacity=".5" strokeLinecap="round">
          <path d="M24 24 L11 13" />
          <path d="M24 24 L38 14" />
          <path d="M24 24 L12 36" />
          <path d="M24 24 L37 35" />
        </g>
        {dot(11, 13, 5)}
        {dot(38, 14, 5)}
        {dot(12, 36, 5)}
        {dot(37, 35, 5)}
        {dot(24, 24, 7.5)}
        <circle cx="24" cy="24" r="20" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
}

/* 순환 — 마지막에서 처음으로 돌아가는 두 화살표 */
export function IconLoop({ size = 38, className }: IconProps) {
  const p = "cl";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 21 A13 13 0 0 0 13.5 14.5" stroke={`url(#${p}-core)`} strokeWidth="6.5" />
        <path d="M13 8.5 v8 h8" stroke={`url(#${p}-core)`} strokeWidth="6.5" />
        <path d="M12 27 A13 13 0 0 0 34.5 33.5" stroke={`url(#${p}-core)`} strokeWidth="6.5" opacity=".72" />
        <path d="M35 39.5 v-8 h-8" stroke={`url(#${p}-core)`} strokeWidth="6.5" opacity=".72" />
        {/* 림 라이트 — 위쪽 호에만 */}
        <path d="M36 21 A13 13 0 0 0 13.5 14.5" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
      </g>
    </svg>
  );
}
