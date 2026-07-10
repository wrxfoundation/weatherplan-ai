import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const onSearch = (value) => {
    if (location.pathname === '/') {
      const next = new URLSearchParams(searchParams)
      if (value) next.set('q', value)
      else next.delete('q')
      setSearchParams(next, { replace: true })
    } else {
      navigate(value ? `/?q=${encodeURIComponent(value)}` : '/')
    }
  }

  return (
    <header className="topbar">
      <NavLink to="/" className="logo">
        <span className="logo-mark">M</span>
        MyeongDang <em>AI</em> 명당
      </NavLink>

      <div className="topbar-search">
        <input
          type="search"
          placeholder="지역, 시설명, 운영사 검색…"
          defaultValue={q}
          onChange={(e) => onSearch(e.target.value.trim())}
          aria-label="시설 검색"
        />
      </div>

      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          맵
        </NavLink>
        <NavLink to="/calc" className={({ isActive }) => (isActive ? 'active' : '')}>
          GPU 계산기
        </NavLink>
        <NavLink to="/glossary" className={({ isActive }) => (isActive ? 'active' : '')}>
          용어집
        </NavLink>
      </nav>

      <button
        type="button"
        className="btn primary report-btn"
        title="부지 적합도 리포트는 M2(스코어링 엔진)에서 열립니다 — 지금은 필요 용량 산정(GPU 계산기)부터 시작하세요"
        onClick={() => navigate('/calc')}
      >
        Generate Report
      </button>
    </header>
  )
}
