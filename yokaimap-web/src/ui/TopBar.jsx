import { Link, NavLink } from 'react-router-dom'
import { META } from '../data/yokai.js'
import Icon from './Icon.jsx'
import { useTheme } from '../main.jsx'

/* system → light → dark 순환. 아이콘과 라벨이 "지금 무엇인지"를 말하게 둔다. */
const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' }
const THEME_UI = {
  system: { icon: 'contrast', label: '시스템 설정' },
  light: { icon: 'sun', label: '밝은 화면' },
  dark: { icon: 'moon', label: '어두운 화면' },
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const ui = THEME_UI[theme] ?? THEME_UI.system
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(THEME_CYCLE[theme] ?? 'light')}
      title={`화면 밝기: ${ui.label} (눌러서 전환)`}
      aria-label={`화면 밝기 ${ui.label}. 눌러서 전환합니다`}
    >
      <Icon name={ui.icon} size={16} />
    </button>
  )
}

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
      {/* 데이터 규모는 신뢰 신호라 유지하되, 좁은 화면에서는 자리를 아이콘에 양보한다 */}
      <span className="small muted num topbar-stat" title={`데이터 v${META.version} · ${META.generated_at}`}>
        {META.count}체 · 전승지 {META.siteCount}곳
      </span>
      <ThemeToggle />
    </header>
  )
}
