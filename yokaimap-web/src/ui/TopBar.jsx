import { Link, NavLink } from 'react-router-dom'
import { META } from '../data/yokai.js'

const NAV = [
  { to: '/', label: '지도', end: true },
  { to: '/dogam', label: '도감' },
  { to: '/quiz', label: '체질진단' },
  { to: '/about', label: '데이터 원칙' },
]

export default function TopBar() {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="seal" aria-hidden="true">
          怪
        </span>
        <span>한국요괴지도</span>
      </Link>
      <nav className="topnav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <span className="spacer" />
      <span className="small muted" title={`데이터 v${META.version} · ${META.generated_at}`}>
        {META.count}체 · 전승지 {META.siteCount}곳
      </span>
    </header>
  )
}
