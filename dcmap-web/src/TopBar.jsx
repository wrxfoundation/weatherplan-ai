import { useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FACILITIES, STATUS_LABEL, SIDOS, slugOf } from './data/facilities.js'

/* 자동완성 후보: 시설(이름·운영사 매칭) 상위 5 + 지역 상위 2 */
function suggest(qv) {
  const v = qv.trim().toLowerCase()
  if (v.length < 1) return []
  const out = []
  for (const s of SIDOS) {
    if (s.toLowerCase().includes(v)) {
      const n = FACILITIES.filter((f) => f.sido === s).length
      out.push({ kind: '지역', label: s, meta: `${n}곳`, to: `/?sido=${encodeURIComponent(s)}` })
      if (out.length >= 2) break
    }
  }
  for (const f of FACILITIES) {
    if (
      f.name.toLowerCase().includes(v) ||
      (f.operator ?? '').toLowerCase().includes(v) ||
      (f.sigungu ?? '').toLowerCase().includes(v)
    ) {
      out.push({
        kind: STATUS_LABEL[f.status] ?? f.status,
        label: f.name,
        meta: `${f.sido}${f.sigungu ? ' ' + f.sigungu : ''}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`,
        to: `/dc/${slugOf(f)}`,
      })
      if (out.length >= 7) break
    }
  }
  return out
}

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [term, setTerm] = useState(q)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const blurTimer = useRef(null)

  const items = useMemo(() => suggest(term), [term])

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

  const choose = (item) => {
    setOpen(false)
    setActive(-1)
    navigate(item.to)
  }

  const onKey = (e) => {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + items.length) % items.length)
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      choose(items[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
    <header className="topbar">
      <NavLink to="/" className="logo">
        <span className="logo-mark">M</span>
        AI <em>Infra</em>Map
      </NavLink>

      <div className="topbar-search">
        <input
          type="search"
          placeholder="지역, 시설명, 운영사 검색…"
          value={term}
          onChange={(e) => {
            const v = e.target.value
            setTerm(v)
            setOpen(true)
            setActive(-1)
            onSearch(v.trim())
          }}
          onFocus={() => term && setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={onKey}
          aria-label="시설 검색"
          aria-expanded={open && items.length > 0}
          role="combobox"
        />
        {open && items.length > 0 && (
          <div className="search-suggest" role="listbox">
            {items.map((it, i) => (
              <button
                key={it.to + it.label}
                type="button"
                className={i === active ? 'active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault()
                  clearTimeout(blurTimer.current)
                  choose(it)
                }}
                role="option"
                aria-selected={i === active}
              >
                <span className="sg-kind">{it.kind}</span>
                <span>{it.label}</span>
                <span className="sg-meta">{it.meta}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          맵
        </NavLink>
        <NavLink to="/map3d" className={({ isActive }) => (isActive ? 'active' : '')}>
          3D <sup className="beta-sup">β</sup>
        </NavLink>
        <NavLink to="/calc" className={({ isActive }) => (isActive ? 'active' : '')}>
          GPU 계산기
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          대시보드
        </NavLink>
        <NavLink to="/power" className={({ isActive }) => (isActive ? 'active' : '')}>
          전력지도
        </NavLink>
        <NavLink to="/data" className={({ isActive }) => (isActive ? 'active' : '')}>
          데이터
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? 'active' : '')}>
          통계
        </NavLink>
        <NavLink to="/insights" className={({ isActive }) => (isActive ? 'active' : '')}>
          인사이트
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
        Generate Report <span className="btn-arrow">↗</span>
      </button>

    </header>

    {/* header 밖 형제로 — topbar의 backdrop-filter가 fixed 기준점이 되는 것 방지 */}
    <nav className="mobile-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        맵
      </NavLink>
      <NavLink to="/calc" className={({ isActive }) => (isActive ? 'active' : '')}>
        계산기
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => (isActive ? 'active' : '')}>
        통계
      </NavLink>
      <NavLink to="/insights" className={({ isActive }) => (isActive ? 'active' : '')}>
        인사이트
      </NavLink>
      <NavLink to="/glossary" className={({ isActive }) => (isActive ? 'active' : '')}>
        용어집
      </NavLink>
    </nav>
    </>
  )
}
