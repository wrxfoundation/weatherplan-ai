/* 8/28 서우 8차: 첨부 시안(프로스티드 글래스 3D 아이콘 세트) 스타일로 재제작. 색상은 브랜드 바이올렛 유지.
   7차(아이소메트릭 단색 면)는 부피는 생겼지만 재질이 없어 종이 상자처럼 보였다.

   시안에서 읽은 재질 규칙:
   - 몸체는 **프로스티드 글래스** — 뿌연 흰빛에 색이 배어 뒤가 어렴풋이 비친다
   - 채도 높은 코어는 **아래쪽·안쪽에 몰린다**. 위·바깥으로 갈수록 우윳빛으로 빠진다
   - 두께는 **탑페이스(윗면) + 우측 옆면**으로 낸다. 사선 투영(oblique)이라 시안처럼 부드러운 3/4 뷰
   - 좌상단에 **림 라이트(밝은 테두리) + 스펙큘러 한 줄**, 아래에 색이 밴 소프트 섀도

   래스터가 아니라 CDN 이송이 필요 없고 배율·테마에 관계없이 선명하다. */

import React from "react";

/* ── PNG 교체 슬롯 (8/28 서우) ───────────────────────────────────────────────
   아래 SVG는 프로스티드 글래스를 그라디언트로 흉내 낸 것이라, 시안이 가진 굴절
   (두꺼운 유리 너머로 뒷면이 비치고 가장자리에서 빛이 휘는 것)은 재현할 수 없다.
   그건 3D 렌더러가 광선을 추적해 만드는 결과물이고 SVG에는 그 수단이 없다.
   그래서 생성 이미지로 교체할 수 있는 자리를 뒀다.

   생성 프롬프트: depin/content/icon-prompt.md
   파일 넣는 곳:  public/assets/icons/  (그 폴더의 README.txt 참고)

   교체한 아이콘만 아래에서 주석을 지우면 된다. 적지 않은 것은 SVG가 그대로 쓰인다.
   존재하지 않는 파일을 매번 요청하는 낭비를 막으려 자동 감지는 넣지 않았다. */
export type IconKey = "measure" | "verify" | "reward" | "use" | "data" | "flow" | "coins" | "nodes";

const ICON_PNG: Partial<Record<IconKey, string>> = {
  // 8/28 서우: 프로스티드 글래스 렌더로 8종 전면 교체.
  // 생성 → 흰 배경 floodfill 제거 → 정사각 정규화 → WebP. 카드용 192px / 칩용 128px.
  // 프롬프트는 depin/content/icon-prompt.md. SVG 는 굴절을 흉내 낼 수 없어 폴백으로만 남긴다.
  measure: "/assets/icons/measure.webp",
  verify:  "/assets/icons/verify.webp",
  reward:  "/assets/icons/reward.webp",
  use:     "/assets/icons/use.webp",
  data:    "/assets/icons/data.webp",
  flow:    "/assets/icons/flow.webp",
  coins:   "/assets/icons/coins.webp",
  nodes:   "/assets/icons/nodes.webp",
};

/* PNG가 지정돼 있으면 그걸, 아니면 인라인 SVG를 그린다. */
function pngOr(key: IconKey, size: number, className: string | undefined, svg: () => React.ReactElement) {
  const src = ICON_PNG[key];
  if (!src) return svg();
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}

const V = "124,107,240"; /* 브랜드 바이올렛 */

/* 두께 방향 — 위·오른쪽으로 밀어 3/4 뷰를 만든다 */
const DX = 6;
const DY = 5;

type IconProps = { size?: number; className?: string };
const box = (size: number): React.CSSProperties => ({ width: size, height: size, display: "block", flexShrink: 0, overflow: "visible" });

function Defs({ p }: { p: string }) {
  return (
    <defs>
      {/* 프로스티드 — 우윳빛에서 아래로 갈수록 색이 밴다 */}
      <linearGradient id={`${p}-frost`} x1=".25" y1="0" x2=".75" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.92)" />
        <stop offset=".45" stopColor={`rgba(${V},.20)`} />
        <stop offset="1" stopColor={`rgba(${V},.42)`} />
      </linearGradient>
      {/* 코어 — 채도 높은 바이올렛 */}
      <linearGradient id={`${p}-core`} x1=".2" y1="0" x2=".8" y2="1">
        <stop offset="0" stopColor="#A99BFF" />
        <stop offset="1" stopColor="#5B49D8" />
      </linearGradient>
      {/* 탑페이스 — 윗면은 빛을 받아 더 밝다 */}
      <linearGradient id={`${p}-top`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.88)" />
        <stop offset="1" stopColor="rgba(255,255,255,.42)" />
      </linearGradient>
      {/* 옆면 — 그늘 */}
      <linearGradient id={`${p}-side`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`rgba(${V},.55)`} />
        <stop offset="1" stopColor={`rgba(${V},.34)`} />
      </linearGradient>
      {/* 림 라이트 — 좌상단만 밝게 */}
      <linearGradient id={`${p}-rim`} x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,.98)" />
        <stop offset=".5" stopColor="rgba(255,255,255,.3)" />
        <stop offset="1" stopColor="rgba(255,255,255,.06)" />
      </linearGradient>
      {/* 스펙큘러 */}
      <radialGradient id={`${p}-spec`} cx=".3" cy=".22" r=".42">
        <stop offset="0" stopColor="rgba(255,255,255,.8)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <filter id={`${p}-drop`} x="-45%" y="-30%" width="190%" height="190%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor={`rgba(${V},.30)`} />
      </filter>
      <radialGradient id={`${p}-glow`} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor={`rgba(${V},.18)`} />
        <stop offset="1" stopColor={`rgba(${V},0)`} />
      </radialGradient>
    </defs>
  );
}

/* 유리 슬래브 한 장 — 앞면(라운드 사각) + 윗면 + 우측 옆면.
   solid=true 면 채도 높은 코어, false 면 프로스티드(뿌연 유리). */
function Slab({
  p, x, y, w, h, r = 5, solid = false,
}: { p: string; x: number; y: number; w: number; h: number; r?: number; solid?: boolean }) {
  const top = `${x},${y} ${x + w},${y} ${x + w + DX},${y - DY} ${x + DX},${y - DY}`;
  const side = `${x + w},${y} ${x + w + DX},${y - DY} ${x + w + DX},${y + h - DY} ${x + w},${y + h}`;
  return (
    <>
      <polygon points={side} fill={`url(#${p}-side)`} />
      <polygon points={top} fill={`url(#${p}-top)`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={solid ? `url(#${p}-core)` : `url(#${p}-frost)`} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.4" />
    </>
  );
}

/* ① 측정 — 유리 디스플레이(측정기) + 받침 */
export function IconMeasure({ size = 120, className }: IconProps) {
  return pngOr("measure", size, className, () => {
  const p = "gm";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="83" rx="28" ry="7" fill={`url(#${p}-glow)`} />
      <g filter={`url(#${p}-drop)`}>
        {/* 본체 패널 */}
        <Slab p={p} x={18} y={22} w={54} h={40} r={8} />
        {/* 화면 — 안쪽은 더 맑게 */}
        <rect x={25} y={29} width={40} height={26} rx={5} fill="rgba(255,255,255,.72)" />
        {/* 측정 지표 3칸 */}
        <rect x={29} y={40} width={9} height={11} rx={2.4} fill="rgba(240,130,95,.8)" />
        <rect x={40.5} y={36} width={9} height={15} rx={2.4} fill="rgba(80,195,165,.8)" />
        <rect x={52} y={32} width={9} height={19} rx={2.4} fill={`url(#${p}-core)`} />
        {/* 목 + 받침 */}
        <rect x={42} y={62} width={12} height={9} rx={2} fill={`url(#${p}-side)`} />
        <Slab p={p} x={28} y={71} w={34} h={7} r={3.5} />
        <ellipse cx="38" cy="32" rx="20" ry="13" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
  });
}

/* ② 검증 — 유리 방패 + 체크 */
export function IconVerify({ size = 120, className }: IconProps) {
  return pngOr("verify", size, className, () => {
  const p = "gv";
  /* 두께(DX)가 오른쪽으로 붙어 시각 중심이 밀리므로 형상을 미리 왼쪽으로 3 당겨 둔다 */
  const shield = "M45 16 L71 26 V48 C71 63 59 73 45 78 C31 73 19 63 19 48 V26 Z";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="83" rx="26" ry="6.5" fill={`url(#${p}-glow)`} />
      <g filter={`url(#${p}-drop)`}>
        {/* 두께 — 본체를 위·오른쪽으로 민 그림자면 */}
        <path d={shield} transform={`translate(${DX} ${-DY})`} fill={`url(#${p}-side)`} />
        <path d={shield} fill={`url(#${p}-frost)`} />
        {/* 코어는 아래쪽에 몰린다 — 시안의 채도 분포 */}
        <path d="M45 44 L65 36 V48 C65 60 55 68.5 45 72.5 C35 68.5 25 60 25 48 V36 Z" fill={`url(#${p}-core)`} opacity=".92" />
        <path d="M34.5 48 L42 55.5 L57 40" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d={shield} fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.8" />
        <ellipse cx="38" cy="32" rx="16" ry="12" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
  });
}

/* ③ 보상 — 유리 토큰이 쌓인 스택
   (통화 기호 없음: 보상은 현금이 아니고 지급량·가치가 보장되지 않는다) */
export function IconReward({ size = 120, className }: IconProps) {
  return pngOr("reward", size, className, () => {
  const p = "gr";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="84" rx="30" ry="7" fill={`url(#${p}-glow)`} />
      <g filter={`url(#${p}-drop)`}>
        {/* 아래로 갈수록 채도가 높다 */}
        <Slab p={p} x={20} y={58} w={50} h={16} r={7} solid />
        <Slab p={p} x={20} y={40} w={50} h={16} r={7} solid />
        <Slab p={p} x={20} y={22} w={50} h={16} r={7} />
        <ellipse cx="38" cy="30" rx="18" ry="10" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
  });
}

/* ④ 활용 — 유리 막대 차트 (시안 2행 3열과 같은 구성: 왼쪽은 프로스티드, 오른쪽으로 갈수록 채도) */
export function IconUse({ size = 120, className }: IconProps) {
  return pngOr("use", size, className, () => {
  const p = "gu";
  return (
    <svg viewBox="0 0 96 96" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <ellipse cx="48" cy="82" rx="31" ry="7" fill={`url(#${p}-glow)`} />
      <g filter={`url(#${p}-drop)`}>
        <Slab p={p} x={18} y={54} w={13} h={22} r={4} />
        <Slab p={p} x={33} y={44} w={13} h={32} r={4} />
        <Slab p={p} x={48} y={33} w={13} h={43} r={4} solid />
        <Slab p={p} x={63} y={22} w={13} h={54} r={4} solid />
        <ellipse cx="34" cy="52" rx="19" ry="14" fill={`url(#${p}-spec)`} />
      </g>
    </svg>
  );
  });
}

/* ───────── 선순환 칩 행 아이콘 (같은 재질, 작은 사이즈) ───────── */

/* 데이터 — 유리 슬래브 3장 */
export function IconData({ size = 34, className }: IconProps) {
  return pngOr("data", size, className, () => {
  const p = "cd";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <Slab p={p} x={7} y={30} w={28} h={9} r={4} solid />
        <Slab p={p} x={7} y={19} w={28} h={9} r={4} solid />
        <Slab p={p} x={7} y={8} w={28} h={9} r={4} />
      </g>
    </svg>
  );
  });
}

/* 유통 — 유리 타일에서 빠져나가는 화살표 */
export function IconFlow({ size = 34, className }: IconProps) {
  return pngOr("flow", size, className, () => {
  const p = "cf";
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <Slab p={p} x={6} y={12} w={30} h={28} r={7} />
        <rect x={12} y={22} width={18} height={4} rx={2} fill={`url(#${p}-core)`} />
        <path d="M25 18 L31 24 L25 30" fill="none" stroke="#5B49D8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
  });
}

/* 수익 — 원형 유리 토큰 스택.
   데이터(IconData)가 가로 슬래브라 사각으로 그리면 실루엣이 겹쳐 두 칩이 같은 아이콘으로 보인다.
   여기는 원형 디스크로 구분한다. */
export function IconCoins({ size = 34, className }: IconProps) {
  return pngOr("coins", size, className, () => {
  const p = "cc";
  const coin = (cy: number, solid: boolean) => (
    <g key={cy}>
      <ellipse cx={24 + DX * 0.5} cy={cy - DY * 0.4} rx="14" ry="5.4" fill={`url(#${p}-side)`} />
      <ellipse cx="24" cy={cy} rx="14" ry="5.4" fill={solid ? `url(#${p}-core)` : `url(#${p}-frost)`} />
      <ellipse cx="24" cy={cy} rx="14" ry="5.4" fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.2" />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        {coin(34, true)}
        {coin(25, true)}
        {coin(16, false)}
      </g>
    </svg>
  );
  });
}

/* 측정망 — 유리 노드 넷이 선으로 연결 */
export function IconNodes({ size = 34, className }: IconProps) {
  return pngOr("nodes", size, className, () => {
  const p = "cn";
  const node = (cx: number, cy: number, r: number, solid = false) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx + DX * 0.5} cy={cy - DY * 0.5} r={r} fill={`url(#${p}-side)`} />
      <circle cx={cx} cy={cy} r={r} fill={solid ? `url(#${p}-core)` : `url(#${p}-frost)`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${p}-rim)`} strokeWidth="1.3" />
    </g>
  );
  return (
    <svg viewBox="0 0 48 48" style={box(size)} className={className} aria-hidden focusable="false">
      <Defs p={p} />
      <g filter={`url(#${p}-drop)`}>
        <g stroke={`rgba(${V},.5)`} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M13 14 L24 24 L35 15" />
          <path d="M13 34 L24 24 L35 33" />
        </g>
        {node(13, 14, 6)}
        {node(35, 15, 6)}
        {node(13, 34, 6)}
        {node(35, 33, 6)}
        {node(24, 24, 7.5, true)}
      </g>
    </svg>
  );
  });
}
