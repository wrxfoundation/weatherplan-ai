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
