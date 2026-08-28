/* 레퍼런스 HTML의 인라인 SVG 추출 (PRD §2) */

type P = { size?: number; color?: string; className?: string };

export const XIcon = ({ size = 14, color = "currentColor", className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M18.9 2h3.7l-8.1 9.3L24 22h-7.5l-5.9-7.7L3.9 22H.2l8.7-9.9L0 2h7.7l5.3 7L18.9 2zm-1.3 17.8h2L7.6 4.1H5.4l12.2 15.7z" />
  </svg>
);

export const TgIcon = ({ size = 15, color = "currentColor", className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M2.6 11.1 21 3.4c.6-.3 1.2.3 1 .9l-3.1 14.9c-.1.6-.8.8-1.3.5l-5-3.7-2.6 2.6c-.4.4-1.1.2-1.2-.4l-.5-3.4-5.7-2.5c-.6-.2-.6-1 0-1.2z" />
  </svg>
);

export const LinkIcon = ({ size = 17, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
);
export const Check = ({ size = 13, color = "#fff", w = 3.5 }: P & { w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4 4L19 6" />
  </svg>
);

export const ChevR = ({ size = 15, color = "#9a9ab5", w = 2.5 }: P & { w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevD = ({ size = 15, color = "#9a9ab5", className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* 8/28 서우: 티켓 이모지(🎟️)를 라인 아이콘으로. 기기마다 다르게 렌더되는 이모지 대신
   나머지 아이콘과 같은 stroke 2 라인으로 통일한다. 가운데 절취선 = 티켓의 시각적 단서. */
export const Ticket = ({ size = 19, color = "var(--w-main)" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8.5V6.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 6.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5v-2a2.5 2.5 0 0 0 0-5z" />
    <path d="M14 9v1M14 14v1" />
  </svg>
);

export const Shield = ({ size = 18, color = "var(--w-main)" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
  </svg>
);

export const ShieldCheck = ({ size = 24, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
    <path d="M8.5 12l2.5 2.5L16 9.5" />
  </svg>
);

export const Gauge = ({ size = 24, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M12 20a8 8 0 1 1 8-8" />
    <path d="M12 12l4-4" />
    <circle cx="12" cy="12" r="1.6" fill={color} />
  </svg>
);

export const Chart = ({ size = 24, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M4 4v16h16" />
    <path d="M8.5 15.5v-4M13 15.5V8M17.5 15.5v-6.5" />
  </svg>
);

export const Coin = ({ size = 24, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M9 8.5h4.5a2 2 0 0 1 0 4H9h5a2 2 0 0 1 0 4H9M12 6v2.5M12 16.5V19" strokeLinecap="round" />
  </svg>
);

export const Clock = ({ size = 17, color = "var(--w-main)" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5l3 2" />
  </svg>
);

export const Warn = ({ size = 17 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#c0392b">
    <path d="M12 2 23 21H1L12 2zm-1 7v6h2V9h-2zm0 8v2h2v-2h-2z" />
  </svg>
);

export const Mail = ({ size = 16, color = "#8a8aa3" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16v12H4z" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);

export const Book = ({ size = 15, color = "currentColor" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 0 2 2h13" />
  </svg>
);
