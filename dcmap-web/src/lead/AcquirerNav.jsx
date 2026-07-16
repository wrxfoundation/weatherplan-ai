import { Link, useLocation } from 'react-router-dom'

/* 인수자용 DD 클러스터 내비 — /global·/methodology·/report-sample을 하나의 '데이터룸'처럼 연결.
 * children으로 우측 슬롯(예: 견본 리포트의 KO/EN 토글) 추가 가능. */
const LINKS = [
  { to: '/global', label: 'Overview' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/report-sample', label: 'Sample report' },
]

export default function AcquirerNav({ children }) {
  const { pathname } = useLocation()
  return (
    <nav className="acq-nav" aria-label="For partners">
      <span className="acq-nav-tag">FOR PARTNERS</span>
      <span className="acq-nav-links">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={pathname === l.to ? 'on' : ''}>
            {l.label}
          </Link>
        ))}
      </span>
      <span className="acq-nav-right">
        {children}
        <Link to="/about" className="acq-nav-ko">한국어 →</Link>
      </span>
    </nav>
  )
}
