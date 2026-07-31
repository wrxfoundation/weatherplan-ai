// 라인 SVG 아이콘 — stroke: currentColor · 1.8px · 24 viewBox (유니코드 글리프 대체)
const PATHS = {
  home: (
    <>
      <path d="M3 11.2 12 3.5l9 7.7" />
      <path d="M5.5 9.8V20h13V9.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  bag: (
    <>
      <path d="M6.2 8.2h11.6l1.1 11.3H5.1L6.2 8.2Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.8" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.8" r="2.4" />
      <path d="M15.6 19.5a4.6 4.6 0 0 1 5.4-4.3" />
    </>
  ),
  heart: <path d="M12 19.8S4.8 15.4 3.3 11a4.7 4.7 0 0 1 8.7-3 4.7 4.7 0 0 1 8.7 3c-1.5 4.4-8.7 8.8-8.7 8.8Z" />,
  doc: (
    <>
      <path d="M7 3.5h7l4 4V20.5H7V3.5Z" />
      <path d="M14 3.5v4.5h4M9.5 12.5h5M9.5 16h5" />
    </>
  ),
  diamond: <path d="M12 3.5 19.5 12 12 20.5 4.5 12 12 3.5Z" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M8.7 9.3 10.3 15l1.7-4.6 1.7 4.6 1.6-5.7M8.3 12.4h7.4" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 10v4h3.2l5 4V6l-5 4H4Z" />
      <path d="M15.6 9.3a4 4 0 0 1 0 5.4M18 7.2a7 7 0 0 1 0 9.6" />
    </>
  ),
  activity: <path d="M3 12h4l2.2-6.5L13.5 18l2.3-6H21" />,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  drop: <path d="M12 3.5s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11Z" />,
  wave: <path d="M3 12c1.8-4.5 3.6-4.5 5.4 0s3.6 4.5 5.4 0 3.6-4.5 5.4 0" />,
  shield: <path d="M12 3.5 19 6.3v5.3c0 4.5-2.9 7.3-7 8.9-4.1-1.6-7-4.4-7-8.9V6.3L12 3.5Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  trend: <path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5M20.5 6.5h-5m5 0v5" />,
  box: (
    <>
      <path d="M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2V8.2Z" />
      <path d="M4 8.2 12 12.4l8-4.2M12 12.4V20" />
    </>
  ),
  chart: <path d="M4 19.5V9.5M9.7 19.5V5M15.3 19.5v-7M21 19.5V8" />,
  alert: (
    <>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 10.5v4M12 17.2h.01" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-10.2a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  watch: (
    <>
      <rect x="7.5" y="7" width="9" height="10" rx="2.5" />
      <path d="M10 7V3.5h4V7M10 17v3.5h4V17M12 10v2.5l1.8 1" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10.5v3l11.5 4.5v-12L4 10.5Z" />
      <path d="M18.5 9.5a3.5 3.5 0 0 1 0 5M6.5 14.2 8 19.5" />
    </>
  ),
  chev: <path d="M6.5 9.5 12 15l5.5-5.5" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.4 15.4 20 20" />
    </>
  ),
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
