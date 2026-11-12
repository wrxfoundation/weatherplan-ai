/* eslint-disable react/display-name */
// 클레이 3D 아이콘 · 홈 사분면 그림 · 줄 아이콘 — 2026-10-15 디자인 시안에서 옮겼다.
// 이 파일은 scratchpad 의 변환기(gen-clay.py)가 만들었다. 손으로 고치지 말고 그림을 바꾸려면 변환기를 다시 돌린다.
// 시안의 SVG 를 그대로 붙이지 않았다 — 도형 요소와 모양 속성만 남겼다 (스크립트 · 이벤트 · 링크 · style 없음).
//
// 입체감은 그림이 아니라 필터(ClayDefs 의 ds-clay3d)가 만든다: 위 왼쪽 빛 · 가장자리 그늘 · 아래 그림자.
// 그라디언트 id 는 부를 때마다 접두어가 붙는다 — 같은 그림이 숨은 화면(display:none)과 보이는 화면에
// 함께 있으면, 숨은 쪽 id 를 가리킨 그림이 비어 보이기 때문이다.
import { useId } from "react";

const CLAY = {
  // hospitalBook · viewBox 0 0 48 48
  hospitalBook: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="6" y="9" width="36" height="33" rx="8" fill="#FFFFFF" />
      <path d="M6 17a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v3H6z" fill="#3B6B47" />
      <path d="M24 25v12M18 31h12" stroke="#DD6E5E" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  // escort2 · viewBox 0 0 48 48
  escort2: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="31" cy="13" r="6.5" fill="#F1D3AE" />
      <path d="M19 42a12 12 0 0 1 24 0z" fill="#F1D3AE" />
      <circle cx="17" cy="15" r="7" fill="#3B6B47" />
      <path d="M4 42a13 13 0 0 1 26 0z" fill="#3B6B47" />
      </>
    ),
  },
  // escort1 · viewBox 0 0 48 48
  escort1: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="24" cy="14" r="8" fill="#3B6B47" />
      <path d="M9 43a15 15 0 0 1 30 0z" fill="#3B6B47" />
      </>
    ),
  },
  // careHospital · viewBox 0 0 48 48
  careHospital: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M6 18L24 6l18 12z" fill="#3B6B47" />
      <rect x="9" y="18" width="30" height="24" fill="#FFFFFF" />
      <path d="M24 22v10M19 27h10" stroke="#DD6E5E" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  // safeVisit · viewBox 0 0 48 48
  safeVisit: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M4 22L24 6l20 16z" fill="#5470B8" />
      <rect x="9" y="21" width="30" height="21" rx="2" fill="#FFFFFF" />
      <path d="M24 37s-6-3.5-6-7.6a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 4.1-6 7.6-6 7.6z" fill="#DD6E5E" />
      </>
    ),
  },
  // together · viewBox 0 0 48 48
  together: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M22 6C12 6 4 12.3 4 20c0 4.5 2.7 8.5 7 11l-2 7 8-4.2c1.6.3 3.3.5 5 .5 10 0 18-6.3 18-14S32 6 22 6z" fill="#5470B8" />
      <circle cx="14" cy="20" r="2.6" fill="#FFFFFF" />
      <circle cx="22" cy="20" r="2.6" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="2.6" fill="#FFFFFF" />
      </>
    ),
  },
  // outing · viewBox 0 0 48 48
  outing: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="34" cy="13" r="7" fill="#E8B54A" />
      <path d="M2 42l14-18 9 10 6-6 15 14z" fill="#3B6B47" />
      </>
    ),
  },
  // broom · viewBox 0 0 48 48
  broom: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M30 4l-8 22" stroke="#9A968D" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 26h18l4 16H10z" fill="#BDB8AE" />
      </>
    ),
  },
  // welfare · viewBox 0 0 48 48
  welfare: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M10 4h20l8 8v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#C9A064" strokeWidth="2.5" />
      <path d="M14 16h12M14 22h16" stroke="#C9A064" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 38s-6-3.5-6-7.6a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 4.1-6 7.6-6 7.6z" fill="#DD6E5E" />
      </>
    ),
  },
  // siren · viewBox 0 0 48 48
  siren: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M12 36V26a12 12 0 0 1 24 0v10z" fill="#D9573F" />
      <rect x="8" y="36" width="32" height="7" rx="3" fill="#8E2A1F" />
      <path d="M24 4v5M8 12l3.5 3.5M40 12l-3.5 3.5" stroke="#D9573F" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  // wrench · viewBox 0 0 48 48
  wrench: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M30 6a10 10 0 0 0-9.5 13L7 32.5a4 4 0 0 0 5.6 5.6L26 24.5A10 10 0 0 0 39 15l-6 2-4-4 2-6z" fill="#C9A064" />
      <circle cx="10" cy="35" r="2" fill="#FFFFFF" />
      </>
    ),
  },
  // cloche · viewBox 0 0 48 48
  cloche: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M8 30a16 16 0 0 1 32 0z" fill="#E8B54A" />
      <rect x="5" y="30" width="38" height="6" rx="3" fill="#C9A064" />
      <rect x="21" y="10" width="6" height="12" rx="3" fill="#C9A064" />
      </>
    ),
  },
  // purifier · viewBox 0 0 48 48
  purifier: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="12" y="4" width="24" height="40" rx="6" fill="#FFFFFF" stroke="#5470B8" strokeWidth="3" />
      <circle cx="24" cy="18" r="6" fill="#8FA3D9" />
      <rect x="18" y="32" width="12" height="4" rx="2" fill="#5470B8" />
      </>
    ),
  },
  // moon · viewBox 0 0 48 48
  moon: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z" fill="#5470B8" />
      <circle cx="36" cy="12" r="2.5" fill="#E8B54A" />
      <circle cx="42" cy="22" r="1.8" fill="#E8B54A" />
      </>
    ),
  },
  // steps · viewBox 0 0 48 48
  steps: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <ellipse cx="17" cy="16" rx="7" ry="10" fill="#3B6B47" />
      <ellipse cx="17" cy="33" rx="5" ry="4" fill="#3B6B47" />
      <ellipse cx="32" cy="22" rx="7" ry="10" fill="#6FA37D" />
      <ellipse cx="32" cy="39" rx="5" ry="4" fill="#6FA37D" />
      </>
    ),
  },
  // pillHeart · viewBox 0 0 48 48
  pillHeart: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <g transform="rotate(-40 22 28)">
        <rect x="6" y="20" width="32" height="15" rx="7.5" fill="#FFFFFF" />
        <path d="M22 20h8.5a7.5 7.5 0 0 1 0 15H22z" fill="#6A4D9C" />
      </g>
      <path d="M37 15s-6-3.5-6-7.6a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 4.1-6 7.6-6 7.6z" fill="#DD6E5E" />
      </>
    ),
  },
  // cloudSun · viewBox 0 0 48 48
  cloudSun: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="30" cy="16" r="8" fill="#E8B54A" />
      <path d="M8 38a10 10 0 0 1 10-10h1a9 9 0 0 1 17 3 6 6 0 0 1 0 12H14a6 6 0 0 1-6-5z" fill="#FFFFFF" stroke="#C9A064" strokeWidth="2" />
      </>
    ),
  },
  // slipperRed · viewBox 0 0 48 48
  slipperRed: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M8 30c0-6 5-10 12-10h10c6 0 10 4 10 9v3H8z" fill="#E0552B" />
      <rect x="6" y="32" width="36" height="7" rx="3.5" fill="#8E2A1F" />
      </>
    ),
  },
  // houseSearch · viewBox 0 0 48 48
  houseSearch: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M4 22L24 6l20 16z" fill="#5470B8" />
      <rect x="9" y="21" width="30" height="21" rx="2" fill="#E8EBF7" />
      <circle cx="24" cy="31" r="5" fill="none" stroke="#5470B8" strokeWidth="3" />
      </>
    ),
  },
  // welfareDoc · viewBox 0 0 48 48
  welfareDoc: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M10 4h20l8 8v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#FFFFFF" stroke="#C9A064" strokeWidth="2.5" />
      <path d="M24 38s-6-3.5-6-7.6a3.3 3.3 0 0 1 6-1.9 3.3 3.3 0 0 1 6 1.9c0 4.1-6 7.6-6 7.6z" fill="#DD6E5E" />
      </>
    ),
  },
  // shieldGreen · viewBox 0 0 48 48
  shieldGreen: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z" fill="#3B6B47" />
      <path d="M17 24l5 5 9-10" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  // reportDoc · viewBox 0 0 48 48
  reportDoc: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#FFFFFF" stroke="#3B6B47" strokeWidth="2.5" />
      <path d="M15 15h18M15 22h18M15 29h10" stroke="#3B6B47" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="35" r="6" fill="#DD6E5E" />
      </>
    ),
  },
  // houseCheck · viewBox 0 0 48 48
  houseCheck: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M4 22L24 6l20 16z" fill="#C9A064" />
      <rect x="9" y="21" width="30" height="21" rx="2" fill="#FFFFFF" />
      <path d="M17 31l5 5 9-9" fill="none" stroke="#3B6B47" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  // heartPulse · viewBox 0 0 48 48
  heartPulse: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M24 42S6 31 6 18a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z" fill="#D9573F" />
      <path d="M12 22h7l3-5 4 10 3-5h7" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  // videoCam · viewBox 0 0 48 48
  videoCam: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="4" y="12" width="28" height="24" rx="6" fill="#6A4D9C" />
      <path d="M32 20l12-7v22l-12-7z" fill="#9C84C6" />
      <circle cx="18" cy="24" r="5" fill="#FFFFFF" />
      </>
    ),
  },
  // shieldBlue · viewBox 0 0 48 48
  shieldBlue: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z" fill="#5470B8" />
      <path d="M17 24l5 5 9-10" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  // card · viewBox 0 0 48 48
  card: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="4" y="10" width="40" height="28" rx="6" fill="#C9A064" />
      <rect x="4" y="17" width="40" height="6" fill="#86621F" />
      <rect x="10" y="29" width="12" height="4" rx="2" fill="#FFFFFF" />
      </>
    ),
  },
  // calendarBlue · viewBox 0 0 48 48
  calendarBlue: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="6" y="9" width="36" height="33" rx="8" fill="#FFFFFF" />
      <path d="M6 17a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v4H6z" fill="#5470B8" />
      <circle cx="16" cy="29" r="2.6" fill="#C5CDE8" />
      <circle cx="24" cy="29" r="2.6" fill="#4459A8" />
      <circle cx="32" cy="29" r="2.6" fill="#C5CDE8" />
      </>
    ),
  },
  // pill · viewBox 0 0 48 48
  pill: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <g transform="rotate(-40 22 28)">
        <rect x="6" y="20" width="32" height="15" rx="7.5" fill="#FFFFFF" />
        <path d="M22 20h8.5a7.5 7.5 0 0 1 0 15H22z" fill="#6A4D9C" />
      </g>
      </>
    ),
  },
  // jar · viewBox 0 0 48 48
  jar: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="12" y="12" width="24" height="30" rx="6" fill="#FFFFFF" stroke="#C9A064" strokeWidth="2.5" />
      <rect x="14" y="5" width="20" height="9" rx="3" fill="#C9A064" />
      <circle cx="24" cy="28" r="5" fill="#E8B54A" />
      </>
    ),
  },
  // question · viewBox 0 0 48 48
  question: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M22 6C12 6 4 12.3 4 20c0 4.5 2.7 8.5 7 11l-2 7 8-4.2c1.6.3 3.3.5 5 .5 10 0 18-6.3 18-14S32 6 22 6z" fill="#3B6B47" />
      <path d="M18 16a4 4 0 1 1 6 3.5c-1.3.7-2 1.5-2 3M22 27v.5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
  },
  // sunNow · viewBox 0 0 48 48
  sunNow: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="24" cy="24" r="10" fill="#E8B54A" />
      <g stroke="#E8B54A" strokeWidth="3" strokeLinecap="round">
        <path d="M24 4v5M24 39v5M4 24h5M39 24h5" />
      </g>
      </>
    ),
  },
  // sirenAlert · viewBox 0 0 48 48
  sirenAlert: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M12 36V26a12 12 0 0 1 24 0v10z" fill="#D9573F" />
      <path d="M19 26a5 5 0 0 1 5-5" stroke="#F9C9BD" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="8" y="36" width="32" height="7" rx="3" fill="#8E2A1F" />
      <g className="ds-glow">
        <path d="M24 4v5M8 12l3.5 3.5M40 12l-3.5 3.5" stroke="#D9573F" strokeWidth="3" strokeLinecap="round" />
      </g>
      </>
    ),
  },
  // timeNight · viewBox 0 0 48 48
  timeNight: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z" fill="#5470B8" />
      <circle cx="38" cy="12" r="2" fill="#E8B54A" />
      </>
    ),
  },
  // timeNoon · viewBox 0 0 48 48
  timeNoon: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="20" cy="18" r="9" fill="#E8B54A" />
      <path d="M12 38a9 9 0 0 1 9-9h1a8 8 0 0 1 15 3 5.5 5.5 0 0 1 0 11H17a5 5 0 0 1-5-5z" fill="#FFFFFF" stroke="#C9A064" strokeWidth="2" />
      </>
    ),
  },
  // timeMorning · viewBox 0 0 48 48
  timeMorning: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="24" cy="24" r="10" fill="#E8B54A" />
      <g stroke="#E8B54A" strokeWidth="3" strokeLinecap="round">
        <path d="M24 4v5M24 39v5M4 24h5M39 24h5M10 10l3.5 3.5M34.5 34.5L38 38M10 38l3.5-3.5M34.5 13.5L38 10" />
      </g>
      </>
    ),
  },
  // goods_mat · viewBox 0 0 48 48
  goods_mat: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="6" y="14" width="36" height="22" rx="5" fill="#5470B8" />
      <g fill="#C5CDE8">
        <circle cx="13" cy="21" r="2" />
        <circle cx="20" cy="21" r="2" />
        <circle cx="27" cy="21" r="2" />
        <circle cx="34" cy="21" r="2" />
        <circle cx="13" cy="29" r="2" />
        <circle cx="20" cy="29" r="2" />
        <circle cx="27" cy="29" r="2" />
        <circle cx="34" cy="29" r="2" />
      </g>
      </>
    ),
  },
  // goods_slippers · viewBox 0 0 48 48
  goods_slippers: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M8 30c0-6 5-10 12-10h10c6 0 10 4 10 9v3H8z" fill="#E0552B" />
      <rect x="6" y="32" width="36" height="7" rx="3.5" fill="#8E2A1F" />
      </>
    ),
  },
  // goods_grabBar · viewBox 0 0 48 48
  goods_grabBar: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <rect x="6" y="20" width="36" height="8" rx="4" fill="#3B6B47" />
      <rect x="4" y="14" width="8" height="20" rx="3" fill="#24432C" />
      <rect x="36" y="14" width="8" height="20" rx="3" fill="#24432C" />
      </>
    ),
  },
  // goods_sensorLight · viewBox 0 0 48 48
  goods_sensorLight: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <path d="M10 34l6-14h16l6 14" fill="#F6E3A8" />
      <rect x="8" y="34" width="32" height="6" rx="3" fill="#C9A064" />
      <rect x="16" y="12" width="16" height="8" rx="4" fill="#E8B54A" />
      </>
    ),
  },
  // goods_magnifier · viewBox 0 0 48 48
  goods_magnifier: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <circle cx="20" cy="20" r="13" fill="#FFFFFF" stroke="#6A4D9C" strokeWidth="4" />
      <path d="M29 29l12 12" stroke="#6A4D9C" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  // goods_swivel · viewBox 0 0 48 48
  goods_swivel: {
    vb: "0 0 48 48",
    draw: () => (
      <>
      <ellipse cx="24" cy="28" rx="18" ry="10" fill="#5470B8" />
      <ellipse cx="24" cy="25" rx="14" ry="6" fill="#8FA3D9" />
      </>
    ),
  },
};

const ART = {
  // tileToday · viewBox 0 0 96 96
  tileToday: {
    vb: "0 0 96 96",
    draw: (p) => (
      <>
      <defs>
        <linearGradient id={p + "c3b"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE2F4" />
        </linearGradient>
        <linearGradient id={p + "c3t"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8AA2E2" />
          <stop offset="1" stopColor="#4459A8" />
        </linearGradient>
        <linearGradient id={p + "c3r"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3A4570" />
          <stop offset=".45" stopColor="#6C78A6" />
          <stop offset="1" stopColor="#26305A" />
        </linearGradient>
        <radialGradient id={p + "c3d"} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#9FB2EC" />
          <stop offset="1" stopColor="#3A4E96" />
        </radialGradient>
        <radialGradient id={p + "c3g"} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#BFC8E6" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="89" rx="28" ry="4.5" fill="#4459A8" opacity=".22" />
      <rect x="13" y="22" width="70" height="62" rx="18" fill="#B9C3E3" />
      <rect x="13" y="19" width="70" height="62" rx="18" fill={"url(#" + p + "c3b)"} />
      <path d="M13 37a18 18 0 0 1 18-18h34a18 18 0 0 1 18 18v4H13z" fill={"url(#" + p + "c3t)"} />
      <ellipse cx="40" cy="26" rx="18" ry="3.5" fill="#FFFFFF" opacity=".45" />
      <rect x="28" y="9" width="9" height="20" rx="4.5" fill={"url(#" + p + "c3r)"} />
      <rect x="59" y="9" width="9" height="20" rx="4.5" fill={"url(#" + p + "c3r)"} />
      <rect x="30" y="11" width="3" height="10" rx="1.5" fill="#FFFFFF" opacity=".5" />
      <rect x="61" y="11" width="3" height="10" rx="1.5" fill="#FFFFFF" opacity=".5" />
      <circle cx="32" cy="55" r="5.5" fill={"url(#" + p + "c3g)"} />
      <circle cx="48" cy="55" r="5.5" fill={"url(#" + p + "c3g)"} />
      <circle cx="64" cy="55" r="6.5" fill={"url(#" + p + "c3d)"} />
      <circle cx="32" cy="70" r="5.5" fill={"url(#" + p + "c3g)"} />
      <circle cx="48" cy="70" r="5.5" fill={"url(#" + p + "c3g)"} />
      <circle cx="62" cy="52.5" r="1.8" fill="#FFFFFF" opacity=".8" />
      </>
    ),
  },
  // tileHealth · viewBox 0 0 96 96
  tileHealth: {
    vb: "0 0 96 96",
    draw: (p) => (
      <>
      <defs>
        <linearGradient id={p + "p3w"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9E3DA" />
        </linearGradient>
        <linearGradient id={p + "p3g"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DB08A" />
          <stop offset="1" stopColor="#2F5A3B" />
        </linearGradient>
        <radialGradient id={p + "p3h"} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#FFB2A6" />
          <stop offset=".55" stopColor="#E5705F" />
          <stop offset="1" stopColor="#B94A3C" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="89" rx="28" ry="4.5" fill="#3B6B47" opacity=".22" />
      <g transform="rotate(-38 44 56)">
        <rect x="12" y="44" width="64" height="30" rx="15" fill="#A9C3AE" />
        <rect x="12" y="40" width="64" height="30" rx="15" fill={"url(#" + p + "p3w)"} />
        <path d="M44 40h17a15 15 0 0 1 0 30H44z" fill={"url(#" + p + "p3g)"} />
        <rect x="20" y="45" width="46" height="6" rx="3" fill="#FFFFFF" opacity=".7" />
      </g>
      <g className="ds-beat">
        <path d="M76 36s-12-7-12-15.2a6.6 6.6 0 0 1 12-3.8 6.6 6.6 0 0 1 12 3.8c0 8.2-12 15.2-12 15.2z" fill={"url(#" + p + "p3h)"} />
        <ellipse cx="70" cy="19" rx="3" ry="2" fill="#FFFFFF" opacity=".7" transform="rotate(-30 70 19)" />
      </g>
      </>
    ),
  },
  // tileAsk · viewBox 0 0 96 96
  tileAsk: {
    vb: "0 0 96 96",
    draw: (p) => (
      <>
      <defs>
        <linearGradient id={p + "h3s"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCE6CB" />
          <stop offset="1" stopColor="#DDA978" />
        </linearGradient>
        <linearGradient id={p + "h3p"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9C80D0" />
          <stop offset="1" stopColor="#55398A" />
        </linearGradient>
        <radialGradient id={p + "h3h"} cx=".35" cy=".3" r=".85">
          <stop offset="0" stopColor="#FFB2A6" />
          <stop offset=".55" stopColor="#E5705F" />
          <stop offset="1" stopColor="#B94A3C" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="89" rx="28" ry="4.5" fill="#6A4D9C" opacity=".22" />
      <rect x="17" y="24" width="13" height="40" rx="6.5" fill={"url(#" + p + "h3s)"} />
      <rect x="31" y="16" width="13" height="46" rx="6.5" fill={"url(#" + p + "h3s)"} />
      <rect x="45" y="22" width="13" height="40" rx="6.5" fill={"url(#" + p + "h3s)"} />
      <rect x="15" y="44" width="47" height="28" rx="12" fill={"url(#" + p + "h3s)"} />
      <rect x="20" y="27" width="4" height="12" rx="2" fill="#FFFFFF" opacity=".55" />
      <rect x="34" y="19" width="4" height="14" rx="2" fill="#FFFFFF" opacity=".55" />
      <rect x="48" y="25" width="4" height="12" rx="2" fill="#FFFFFF" opacity=".55" />
      <rect x="14" y="68" width="49" height="17" rx="8.5" fill={"url(#" + p + "h3p)"} />
      <rect x="20" y="71" width="30" height="4" rx="2" fill="#FFFFFF" opacity=".35" />
      <g className="ds-beat">
        <path d="M76 36s-12-7-12-15.2a6.6 6.6 0 0 1 12-3.8 6.6 6.6 0 0 1 12 3.8c0 8.2-12 15.2-12 15.2z" fill={"url(#" + p + "h3h)"} />
        <ellipse cx="70" cy="19" rx="3" ry="2" fill="#FFFFFF" opacity=".7" transform="rotate(-30 70 19)" />
      </g>
      </>
    ),
  },
  // tileStore · viewBox 0 0 96 96
  tileStore: {
    vb: "0 0 96 96",
    draw: (p) => (
      <>
      <defs>
        <linearGradient id={p + "b3b"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EBCB8E" />
          <stop offset="1" stopColor="#A97E3A" />
        </linearGradient>
        <linearGradient id={p + "b3h"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6B4F2E" />
          <stop offset=".5" stopColor="#A9824E" />
          <stop offset="1" stopColor="#5A3F22" />
        </linearGradient>
        <radialGradient id={p + "b3a"} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFB2A6" />
          <stop offset=".55" stopColor="#E06A58" />
          <stop offset="1" stopColor="#A9402F" />
        </radialGradient>
        <linearGradient id={p + "b3l"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FC79B" />
          <stop offset="1" stopColor="#3B6B47" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="89" rx="28" ry="4.5" fill="#9A7432" opacity=".22" />
      <path d="M26 44c0-17 9.5-26 22-26s22 9 22 26" fill="none" stroke={"url(#" + p + "b3h)"} strokeWidth="6" strokeLinecap="round" />
      <circle cx="66" cy="34" r="11" fill={"url(#" + p + "b3a)"} />
      <ellipse cx="62" cy="30" rx="3.5" ry="2.4" fill="#FFFFFF" opacity=".75" transform="rotate(-30 62 30)" />
      <path d="M66 23c1-5 4-7 8-7-1 4-4 7-8 7z" fill={"url(#" + p + "b3l)"} />
      <path d="M12 46h72l-8 34a6 6 0 0 1-6 4.5H26a6 6 0 0 1-6-4.5z" fill="#94702F" />
      <path d="M12 43h72l-8 34a6 6 0 0 1-6 4.5H26a6 6 0 0 1-6-4.5z" fill={"url(#" + p + "b3b)"} />
      <rect x="9" y="39" width="78" height="10" rx="5" fill="#C9A064" />
      <rect x="14" y="40.5" width="50" height="3" rx="1.5" fill="#FFFFFF" opacity=".55" />
      <path d="M16 60h64M18.5 70h59" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  // helpBubble · viewBox 0 0 56 46
  helpBubble: {
    vb: "0 0 56 46",
    draw: () => (
      <>
      <path d="M28 3C14.7 3 4 11.3 4 21.5c0 6 3.7 11.3 9.5 14.7L11 44l10.5-5.6c2.1.4 4.2.6 6.5.6 13.3 0 24-8.3 24-18.5S41.3 3 28 3z" fill="#E2703A" />
      <circle cx="18" cy="21.5" r="3.4" fill="#FFF3EA" />
      <circle cx="28" cy="21.5" r="3.4" fill="#FFF3EA" />
      <circle cx="38" cy="21.5" r="3.4" fill="#FFF3EA" />
      </>
    ),
  },
  // family · viewBox 0 0 30 24
  family: {
    vb: "0 0 30 24",
    draw: () => (
      <>
      <circle cx="10" cy="6" r="4.5" fill="currentColor" />
      <path d="M1 21a9 9 0 0 1 18 0z" fill="currentColor" />
      <circle cx="21" cy="8" r="3.6" fill="#B79B52" />
      <path d="M15 21a7 7 0 0 1 14 0z" fill="#B79B52" />
      </>
    ),
  },
};

const LINE = {
  // chevR · viewBox 0 0 24 24
  chevR: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.6", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M9 6l6 6-6 6" />
      </>
    ),
  },
  // back · viewBox 0 0 24 24
  back: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.6", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M15 6l-6 6 6 6" />
      </>
    ),
  },
  // cardLine · viewBox 0 0 24 24
  cardLine: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20M6 15h4" />
      </>
    ),
  },
  // bell · viewBox 0 0 24 24
  bell: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
  },
  // noCam · viewBox 0 0 24 24
  noCam: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5H15l2 2h2a2 2 0 0 1 2 2v8M17 19H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
      </>
    ),
  },
  // doc · viewBox 0 0 24 24
  doc: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h6" />
      </>
    ),
  },
  // chevD · viewBox 0 0 24 24
  chevD: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.4", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M6 9l6 6 6-6" />
      </>
    ),
  },
  // won · viewBox 0 0 24 24
  won: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9l1.5 6L12 9l2.5 6L16 9M7 12h10" />
      </>
    ),
  },
  // lock · viewBox 0 0 24 24
  lock: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  // pin · viewBox 0 0 24 24
  pin: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  // sunLine · viewBox 0 0 24 24
  sunLine: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  // chatLines · viewBox 0 0 24 24
  chatLines: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
      </>
    ),
  },
  // radio · viewBox 0 0 24 24
  radio: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 4.6a10.4 10.4 0 0 1 0 14.8" />
      </>
    ),
  },
  // watch · viewBox 0 0 24 24
  watch: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <path d="M9 6V3h6v3M9 18v3h6v-3M9.5 12h1.5l1-2 1.5 4 1-2h1" />
      </>
    ),
  },
  // speaker · viewBox 0 0 24 24
  speaker: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M11 5L6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
      </>
    ),
  },
  // plus · viewBox 0 0 24 24
  plus: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.6", "strokeLinecap": "round"},
    draw: () => (
      <>
      <path d="M12 5v14M5 12h14" />
      </>
    ),
  },
  // chat · viewBox 0 0 24 24
  chat: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.4", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.5A8 8 0 1 1 21 12z" />
      </>
    ),
  },
  // homeFill · viewBox 0 0 24 24
  homeFill: {
    vb: "0 0 24 24",
    draw: () => (
      <>
      <path d="M2.5 11L12 3l9.5 8v9.5a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-6v6H4a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor" />
      </>
    ),
  },
  // gHome · viewBox 0 0 24 24
  gHome: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
      </>
    ),
  },
  // gCal · viewBox 0 0 24 24
  gCal: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round"},
    draw: () => (
      <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
  },
  // gPlus · viewBox 0 0 24 24
  gPlus: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
      </>
    ),
  },
  // gBag · viewBox 0 0 24 24
  gBag: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      <path d="M4 8h16l-1.5 13h-13z" />
      </>
    ),
  },
  // gUser · viewBox 0 0 24 24
  gUser: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
  // check · viewBox 0 0 24 24
  check: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "3.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
      </>
    ),
  },
  // clock · viewBox 0 0 24 24
  clock: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.4", "strokeLinecap": "round"},
    draw: () => (
      <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      </>
    ),
  },
  // mic · viewBox 0 0 24 24
  mic: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.2", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
      </>
    ),
  },
  // play · viewBox 0 0 24 24
  play: {
    vb: "0 0 24 24",
    draw: () => (
      <>
      <path d="M7 4l13 8-13 8z" fill="currentColor" />
      </>
    ),
  },
  // pause · viewBox 0 0 24 24
  pause: {
    vb: "0 0 24 24",
    draw: () => (
      <>
      <rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
      <rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
      </>
    ),
  },
  // phone · viewBox 0 0 24 24
  phone: {
    vb: "0 0 24 24",
    root: {"fill": "none", "stroke": "currentColor", "strokeWidth": "2.4", "strokeLinecap": "round", "strokeLinejoin": "round"},
    draw: () => (
      <>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z" />
      </>
    ),
  },
};

const pre = (id) => "c" + id.replace(/[^a-zA-Z0-9]/g, "");

// 클레이 아이콘 (48 격자) — <Clay name="moon" size={48} />
export function Clay({ name, size = 48, className = "", style }) {
  const p = pre(useId());
  const a = CLAY[name];
  if (!a) return null;
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox={a.vb} className={`ds-clay ${className}`} style={style}>
      {a.draw(p)}
    </svg>
  );
}

// 홈 사분면 그림 · 도와줘요 말풍선 · 가족 (자체 그라디언트 — 클레이 필터 없음)
export function Art({ name, size, width, height, className = "", style }) {
  const p = pre(useId());
  const a = ART[name];
  if (!a) return null;
  const [, , w, h] = a.vb.split(" ").map(Number);
  return (
    <svg aria-hidden="true" focusable="false" width={width || size || w} height={height || (size ? (size * h) / w : h)} viewBox={a.vb} className={className} style={style}>
      {a.draw(p)}
    </svg>
  );
}

// 줄 아이콘 (24 격자) — 색은 글자색(currentColor)을 따른다
export function Line({ name, size = 24, className = "", style }) {
  const p = pre(useId());
  const a = LINE[name];
  if (!a) return null;
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox={a.vb} className={className} style={style} {...(a.root || {})}>
      {a.draw(p)}
    </svg>
  );
}

// 클레이 필터 정의 — 화면(페이지)마다 한 번만 둔다. 크기 0 으로 숨기되 display:none 은 쓰지 않는다
// (display:none 인 svg 안의 필터는 다른 그림이 참조해도 적용되지 않는다).
export function ClayDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <filter id="ds-clay3d" x="-25%" y="-25%" width="150%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="2.6" specularConstant=".75" specularExponent="16" lightingColor="#FFFFFF" result="spec">
            <fePointLight x="-30" y="-50" z="90" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feOffset in="SourceAlpha" dx="-1.6" dy="-2.2" result="off" />
          <feComposite in="SourceAlpha" in2="off" operator="out" result="rim" />
          <feGaussianBlur in="rim" stdDeviation=".9" result="rimB" />
          <feFlood floodColor="#3A2A10" floodOpacity=".28" />
          <feComposite in2="rimB" operator="in" result="dark" />
          <feComposite in="dark" in2="SourceAlpha" operator="in" result="darkIn" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="ds" />
          <feOffset in="ds" dy="3" result="dso" />
          <feFlood floodColor="#3A2A10" floodOpacity=".18" />
          <feComposite in2="dso" operator="in" result="drop" />
          <feMerge>
            <feMergeNode in="drop" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="darkIn" />
            <feMergeNode in="specIn" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

export const CLAY_NAMES = Object.keys(CLAY);
export const ART_NAMES = Object.keys(ART);
export const LINE_NAMES = Object.keys(LINE);
