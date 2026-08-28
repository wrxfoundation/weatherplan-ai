/* 8/28 서우 7차: "지금건 2D 느낌이 강하다" → 아이소메트릭 3D 솔리드로 재제작.
   6차(글래스)는 그라디언트로 입체를 흉내냈을 뿐 실루엣이 평면이라 2D로 읽혔다.
   이번엔 진짜 부피를 만든다 — 솔리드마다 **윗면·좌면·우면 3개 면**을 각각 다른 명도로 칠하고
   모서리를 또렷하게 남긴다(좌상단 광원). 큐브 계열로 통일하되 실루엣으로 4개를 구분한다:
     ① 측정  = 세워진 패널(측정기) 한 덩어리
     ② 검증  = 큐브 하나 + 체크
     ③ 보상  = 큐브 여러 개가 쌓인 더미
     ④ 활용  = 높이가 커지는 큐브 3개
   색상 톤은 기존 브랜드 바이올렛 유지. 래스터가 아니라 CDN 이송이 필요 없다. */

import React from "react";

/* 브랜드 바이올렛 램프 — 면 3개의 명도 단계 */
const TOP = "#C3BAFF"; /* 윗면 — 가장 밝음 */
const LEFT = "#8B7BF2"; /* 좌면 — 중간 */
const RIGHT = "#5B49D8"; /* 우면 — 가장 어두움 */
const V = "124,107,240";

type IconProps = { size?: number; className?: string };
const box = (size: number): React.CSSProperties => ({ width: size, height: size, display: "block", flexShrink: 0, overflow: "visible" });

/* 아이소메트릭 투영: x는 우하, y는 좌하, z는 위.
   기울기 0.866/0.5 = 30° — 평행 모서리가 유지돼 큐브가 큐브로 읽힌다. */
const P = (x: number, y: number, z: number) => `${((x - y) * 0.866).toFixed(2)},${((x + y) * 0.5 - z).toFixed(2)}`;
const poly = (...pts: string[]) => pts.join(" ");

/* 한 덩어리(직육면체)의 보이는 세 면.
   윗면에만 얇은 흰 림을 넣어 광택을 약하게 준다 — 하이글로스는 다시 2D처럼 보인다. */
function Solid({
  x, y, z, w, d, h, top = TOP, left = LEFT, right = RIGHT, rim = true,
}: {
  x: number; y: number; z: number; w: number; d: number; h: number;
  top?: string; left?: string; right?: string; rim?: boolean;
}) {
  const t = poly(P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h));
  const l = poly(P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h));
  const r = poly(P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h));
  return (
    <>
      <polygon points={l} fill={left} />
      <polygon points={r} fill={right} />
      <polygon points={t} fill={top} />
      {rim && <polygon points={t} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1" strokeLinejoin="round" />}
    </>
  );
}

/* 접지 그림자 — 받침 대신 부피가 놓여 있다는 감각을 준다 */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <filter id={`${p}-drop`} x="-40%" y="-30%" width="180%" height="190%">
        <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor={`rgba(${V},.32)`} />
      </filter>
      <radialGradient id={`${p}-glow`} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor={`rgba(${V},.20)`} />
        <stop offset="1" stopColor={`rgba(${V},0)`} />
      </radialGradient>
    </defs>
  );
}

/* ① 측정 — 세워진 측정기 패널 (좌면이 화면) */
export function IconMeasure({ size = 120, className }: IconProps) {
  const p = "im";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="78" rx="30" ry="8" fill={`url(#${p}-glow)`} />
      <g transform="translate(46.3 54.5)" filter={`url(#${p}-drop)`}>
        {/* 받침 슬래브 */}
        <Solid x={-4} y={-4} z={0} w={30} d={26} h={4} top="#D7D1FF" left="#A79AF7" right="#7C6BE6" />
        {/* 세워진 패널 */}
        <Solid x={0} y={2} z={4} w={24} d={7} h={26} />
        {/* 화면 — 좌면 위에 얹은 밝은 판 */}
        <polygon
          points={poly(P(2.5, 9, 8), P(21.5, 9, 8), P(21.5, 9, 27), P(2.5, 9, 27))}
          fill="rgba(255,255,255,.82)"
        />
        {/* 지표 셀 3개 — 색은 약하게 */}
        <polygon points={poly(P(4.5, 9, 17), P(9, 9, 17), P(9, 9, 24), P(4.5, 9, 24))} fill="rgba(240,130,95,.75)" />
        <polygon points={poly(P(10, 9, 17), P(14.5, 9, 17), P(14.5, 9, 24), P(10, 9, 24))} fill="rgba(80,195,165,.75)" />
        <polygon points={poly(P(15.5, 9, 17), P(20, 9, 17), P(20, 9, 24), P(15.5, 9, 24))} fill={`rgba(${V},.8)`} />
        <polygon points={poly(P(4.5, 9, 11), P(16, 9, 11), P(16, 9, 14), P(4.5, 9, 14))} fill="rgba(124,107,240,.28)" />
      </g>
    </svg>
  );
}

/* ② 검증 — 큐브 하나 + 체크 */
export function IconVerify({ size = 120, className }: IconProps) {
  const p = "iv";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="78" rx="28" ry="7.5" fill={`url(#${p}-glow)`} />
      <g transform="translate(48 52)" filter={`url(#${p}-drop)`}>
        <Solid x={0} y={0} z={0} w={26} d={26} h={26} />
        {/* 체크 — 좌면(가장 넓게 보이는 면) 위에 눕힌다 */}
        <path
          d={`M ${P(4, 26, 14)} L ${P(10, 26, 9)} L ${P(22, 26, 22)}`}
          fill="none"
          stroke="#fff"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* ③ 보상 — 큐브가 쌓인 더미
   (통화 기호 없음: 보상은 현금이 아니고 지급량·가치가 보장되지 않는다) */
export function IconReward({ size = 120, className }: IconProps) {
  const p = "ir";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="78" rx="31" ry="8" fill={`url(#${p}-glow)`} />
      <g transform="translate(48 43)" filter={`url(#${p}-drop)`}>
        {/* 아래 단 — 뒤에서 앞으로 그려야 가림이 맞는다 */}
        <Solid x={0} y={0} z={0} w={16} d={16} h={11} />
        <Solid x={16} y={0} z={0} w={16} d={16} h={11} top="#BAB0FF" left="#8271EE" right="#5442D2" />
        <Solid x={0} y={16} z={0} w={16} d={16} h={11} top="#BAB0FF" left="#8271EE" right="#5442D2" />
        <Solid x={16} y={16} z={0} w={16} d={16} h={11} />
        {/* 위 단 — 살짝 밝게 얹어 더미가 쌓였음을 보인다 */}
        <Solid x={8} y={8} z={11} w={16} d={16} h={11} top="#D2CBFF" left="#9A8CF6" right="#6957DE" />
      </g>
    </svg>
  );
}

/* ④ 활용 — 높이가 커지는 큐브 3개 */
export function IconUse({ size = 120, className }: IconProps) {
  const p = "iu";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="78" rx="31" ry="8" fill={`url(#${p}-glow)`} />
      <g transform="translate(35 48)" filter={`url(#${p}-drop)`}>
        {/* screen_x = (x - y) * 0.866 이므로 x==y 로 놓으면 세 큐브가 화면상 같은 열에 겹친다.
            y를 고정하고 x만 늘려 가로로 벌린다. 그리면서 x가 커질수록 앞이므로 이 순서가 곧 페인터 순서. */}
        <Solid x={0} y={0} z={0} w={13} d={13} h={12} top="#CFC8FF" left="#9587F5" right="#6553DC" />
        <Solid x={15} y={0} z={0} w={13} d={13} h={22} />
        <Solid x={30} y={0} z={0} w={13} d={13} h={33} top="#D5CFFF" left="#9E90F7" right="#6E5CE1" />
        {/* 상승 화살표 — 큐브 윗면들을 잇는다 */}
        <path
          d={`M ${P(6.5, 6.5, 18)} L ${P(21.5, 6.5, 28)} L ${P(36.5, 6.5, 40)}`}
          fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity=".95"
        />
        <path
          d={`M ${P(30, 6.5, 41.5)} L ${P(36.5, 6.5, 40)} L ${P(36.5, 6.5, 33)}`}
          fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity=".95"
        />
      </g>
    </svg>
  );
}

/* ───────── 선순환 칩 행 아이콘 (같은 아이소메트릭 체계, 작은 사이즈) ───────── */

/* 데이터 — 납작한 슬래브 3장 */
export function IconData({ size = 34, className }: IconProps) {
  const p = "cd";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g transform="translate(24 31) scale(.62)" filter={`url(#${p}-drop)`}>
        <Solid x={0} y={0} z={0} w={26} d={26} h={7} top="#BAB0FF" left="#8271EE" right="#5442D2" />
        <Solid x={0} y={0} z={9} w={26} d={26} h={7} />
        <Solid x={0} y={0} z={18} w={26} d={26} h={7} top="#D5CFFF" left="#9E90F7" right="#6E5CE1" />
      </g>
    </svg>
  );
}

/* 유통 — 큐브에서 빠져나가는 화살표 */
export function IconFlow({ size = 34, className }: IconProps) {
  const p = "cf";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g transform="translate(20 30) scale(.66)" filter={`url(#${p}-drop)`}>
        <Solid x={0} y={0} z={0} w={22} d={22} h={22} />
        <path
          d={`M ${P(5, 22, 11)} L ${P(18, 22, 11)}`}
          fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
        />
        <path
          d={`M ${P(13, 22, 16)} L ${P(18, 22, 11)} L ${P(13, 22, 6)}`}
          fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* 수익 — 큐브 더미(작은 버전) */
export function IconCoins({ size = 34, className }: IconProps) {
  const p = "cc";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g transform="translate(24 30) scale(.58)" filter={`url(#${p}-drop)`}>
        <Solid x={0} y={0} z={0} w={15} d={15} h={10} />
        <Solid x={15} y={0} z={0} w={15} d={15} h={10} top="#BAB0FF" left="#8271EE" right="#5442D2" />
        <Solid x={0} y={15} z={0} w={15} d={15} h={10} top="#BAB0FF" left="#8271EE" right="#5442D2" />
        <Solid x={15} y={15} z={0} w={15} d={15} h={10} />
        <Solid x={7.5} y={7.5} z={10} w={15} d={15} h={10} top="#D5CFFF" left="#9E90F7" right="#6E5CE1" />
      </g>
    </svg>
  );
}

/* 측정망 — 큐브 노드 넷이 선으로 연결 */
export function IconNodes({ size = 34, className }: IconProps) {
  const p = "cn";
  const cube = (x: number, y: number, z: number, s: number) => (
    <Solid key={`${x}-${y}-${z}`} x={x} y={y} z={z} w={s} d={s} h={s} />
  );
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g transform="translate(24 27) scale(.62)" filter={`url(#${p}-drop)`}>
        <g stroke={`rgba(${V},.55)`} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d={`M ${P(4, 4, 4)} L ${P(22, 22, 4)}`} />
          <path d={`M ${P(4, 22, 4)} L ${P(22, 4, 4)}`} />
        </g>
        {cube(-4, -4, 0, 9)}
        {cube(18, -4, 0, 9)}
        {cube(-4, 18, 0, 9)}
        {cube(18, 18, 0, 9)}
      </g>
    </svg>
  );
}
