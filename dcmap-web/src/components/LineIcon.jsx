// 공용 라인(스트로크) 아이콘 — 이모지 대신 통일된 SVG. currentColor 상속.
const PATHS = {
  power: <path d="M9 1.5 3.5 9.5H7l-.8 5 5.8-8H9L9 1.5Z" />,
  cooling: (
    <>
      <path d="M8 1.5v13" />
      <path d="M2.2 4.75 13.8 11.25" />
      <path d="M13.8 4.75 2.2 11.25" />
    </>
  ),
  site: (
    <>
      <path d="M2.5 14V6.5L8 3l5.5 3.5V14" />
      <path d="M6 14v-4h4v4" />
    </>
  ),
  risk: (
    <>
      <path d="M8 2.5 1.8 13.5h12.4L8 2.5Z" />
      <path d="M8 6.5v3.2M8 11.6h.01" />
    </>
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2.4" />
    </>
  ),
  arrowUR: (
    <>
      <path d="M4.8 11.2 11.2 4.8" />
      <path d="M6 4.8h5.2V10" />
    </>
  ),
}

export default function LineIcon({ name, size = 15, className = '', title }) {
  const p = PATHS[name]
  if (!p) return null
  return (
    <svg
      className={`lni ${className}`.trim()}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {p}
    </svg>
  )
}

// Leaflet divIcon 등 HTML 문자열용 팩토리(라인 팩토리 아이콘)
export const factorySvg = (cls = '') =>
  `<svg class="lni ${cls}" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 14V8l3.2 1.8V8l3.2 1.8V5l3.6 2.2V14z"/></svg>`
