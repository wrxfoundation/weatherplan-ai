const paths: Record<string, JSX.Element> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="15" r="1.2" fill="currentColor" stroke="none" /></>,
  gauge: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="M12 14l3.5-4" /><path d="M4 18h16" /></>,
  exchange: <><path d="M7 10h11l-3-3" /><path d="M17 14H6l3 3" /></>,
  cpu: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  coins: <><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></>,
  handshake: <><path d="M8 12 5 9l4-4 3 3" /><path d="m16 12 3-3-4-4-3 3" /><path d="M5 9 2 12l5 5 2-2M19 9l3 3-5 5-2-2" /><path d="m9 16 3 3 3-3" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-8 8H4l2.5-2.7A8 8 0 1 1 21 12Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.6a5.5 5.5 0 0 1 3 5.4" /></>,
  doc: <><path d="M6 2.5h8l4 4V21.5H6z" /><path d="M14 2.5v4h4" /><path d="M9 12h6M9 15.5h6M9 8.5h2" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2" /><circle cx="16" cy="7" r="1.8" /><circle cx="8" cy="12" r="1.8" /><circle cx="16" cy="17" r="1.8" /></>,
  registry: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  bell: <><path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6 1.8 6H4.2S6 14.5 6 9.5" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M4.5 5.9l1.7 1.7M17.8 19.2l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.5 18.1l1.7-1.7M17.8 4.8l1.7-1.7" /></>,
  audit: <><path d="M12 3 4.5 6v5c0 4.8 3.2 8.4 7.5 10 4.3-1.6 7.5-5.2 7.5-10V6z" /><path d="m9 11.5 2.2 2.2L15.5 9.5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 0 1 5.1.8c0 1.7-2.6 2.2-2.6 3.7" /><path d="M12 17h.01" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" transform="translate(2 2)" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6.5A1.5 1.5 0 0 1 5.5 5H11" /></>,
  refresh: <><path d="M20 11.5A8 8 0 1 0 18.3 17" /><path d="M20 6v5.5h-5.5" /></>,
  download: <><path d="M12 3v11" /><path d="m7 10 5 5 5-5" /><path d="M4 19h16" /></>,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></>,
  dots: <><circle cx="12" cy="5.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="18.5" r="1.2" fill="currentColor" stroke="none" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  alert: <><path d="M12 3 2.5 20h19z" /><path d="M12 9.5V14" /><path d="M12 17h.01" /></>,
  inbound: <><path d="M12 4v10" /><path d="m7.5 10 4.5 4.5L16.5 10" /><path d="M5 19.5h14" /></>,
  outbound: <><path d="M12 18.5V8.5" /><path d="m7.5 12.5 4.5-4.5 4.5 4.5" /><path d="M5 4.5h14" /></>,
  snow: <><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" /></>,
  trendUp: <><path d="m3 16.5 5.5-5.5 4 4L20 7.5" /><path d="M14.5 7.5H20V13" /></>,
  thermo: <><path d="M10 4a2 2 0 0 1 4 0v9.3a4.5 4.5 0 1 1-4 0z" /><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" /></>,
  network: <><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M10.8 6.9 6.2 16M13.2 6.9l4.6 9.1M7.2 18h9.6" /></>,
  badge: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-1.5 7 5-2.6 5 2.6-1.5-7" /></>,
  drop: <><path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 10 12 3 12 3Z" /></>,
  bolt: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />,
  dollar: <><circle cx="12" cy="12" r="9" /><path d="M15 9.2c-.5-1-1.6-1.7-3-1.7-1.7 0-3 .9-3 2.2 0 2.9 6 1.5 6 4.5 0 1.3-1.3 2.2-3 2.2-1.4 0-2.5-.7-3-1.7" /><path d="M12 5.8v12.4" /></>,
  mappin: <><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></>,
  power: <><path d="M12 3v8" /><path d="M6.3 6.5a8 8 0 1 0 11.4 0" /></>,
  heart: <path d="M12 20.5S3.5 15 3.5 9.3A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.5 2.9C20.5 15 12 20.5 12 20.5Z" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  share: <><circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="5.5" r="2.4" /><circle cx="17.5" cy="18.5" r="2.4" /><path d="m8.2 10.8 7.1-4.1M8.2 13.2l7.1 4.1" /></>,
  link: <><path d="M10 14a4.5 4.5 0 0 0 6.4.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.4 6.6" /><path d="M14 10a4.5 4.5 0 0 0-6.4-.4L5 12.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></>,
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 16, className = '', strokeWidth = 1.7 }: {
  name: IconName | string
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={`shrink-0 ${className}`} aria-hidden>
      {paths[name] ?? paths.info}
    </svg>
  )
}
