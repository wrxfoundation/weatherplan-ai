import { Link, NavLink } from 'react-router-dom'
import { META } from '../data/yokai.js'
import Icon from './Icon.jsx'

const NAV = [
  { to: '/', label: '홈', icon: 'home', end: true },
  { to: '/map', label: '지도', icon: 'map' },
  { to: '/dogam', label: '도감', icon: 'book' },
  { to: '/quiz', label: '체질진단', icon: 'compass' },
  { to: '/business', label: '기관·기업', icon: 'building' },
  { to: '/about', label: '데이터 원칙', icon: 'shield' },
]

export default function TopBar() {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-seal" aria-hidden="true">
          怪
        </span>
        <span>한국요괴지도</span>
      </Link>
      <nav className="topnav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
            <Icon name={n.icon} size={15} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <span className="spacer" />
      <span className="small muted num" title={`데이터 v${META.version} · ${META.generated_at}`}>
        {META.count}체 · 전승지 {META.siteCount}곳
      </span>
    </header>
  )
}
