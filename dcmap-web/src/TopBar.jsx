import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FACILITIES, STATUS_LABEL, SIDOS, slugOf } from './data/facilities.js'
import { geocodeAddr } from './data/liveApi.js'

// 라우트 → GNB 섹션(색상 톤). 페이지 전체 accent가 섹션 톤을 따른다.
const SECTION_PREFIX = [
  ['/calc', 'data'], ['/dashboard', 'data'], ['/data', 'data'], ['/stats', 'data'], ['/land', 'data'], ['/compare', 'data'], ['/pricing', 'data'],
  ['/insights', 'knowledge'], ['/roadmap', 'knowledge'], ['/glossary', 'glossary'], ['/about', 'about'],
  ['/map3d', 'explore'], ['/power', 'explore'], ['/dc', 'explore'], ['/region', 'explore'],
]
function sectionForPath(pathname) {
  for (const [p, s] of SECTION_PREFIX) if (pathname === p || pathname.startsWith(`${p}/`)) return s
  return 'explore'
}

/* 입력이 지번·도로명 주소로 보이는지 — 행정구역 접미사/번지 패턴 */
function looksLikeAddress(q) {
  const t = String(q || '').trim()
  if (t.length < 2) return false
  return (
    /(읍|면|동|리|가|로|길)(\s|\d|$)/.test(t) || // 파주읍·부곡리·역삼동·세종로 …
    /(특별시|광역시|특별자치도|도|시|군|구)\s/.test(t) || // 경기도 …시 …
    /\d+(-\d+)?\s*$/.test(t) // 끝에 번지(4-1)
  )
}

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
  // 지번·도로명 주소 검색 통합(맵 상단 별도 검색창 대체). 주소처럼 보이면 최상단에 노출.
  const t = qv.trim()
  if (t.length >= 2) {
    const geoItem = { kind: '주소', label: `‘${t}’ 위치로 이동 · 부지 분석`, meta: 'vworld 지오코딩', geo: true, query: t, to: '' }
    if (looksLikeAddress(t)) out.unshift(geoItem)
    else out.push(geoItem)
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
  const [geocoding, setGeocoding] = useState(false)
  const blurTimer = useRef(null)

  const items = useMemo(() => suggest(term), [term])

  // 현재 라우트의 섹션을 document root에 반영 → 페이지 전체 색상 톤 전환
  useEffect(() => {
    const section = sectionForPath(location.pathname)
    document.documentElement.setAttribute('data-section', section)
  }, [location.pathname])

  // SEO: SPA 내 라우트 전환 시 canonical·og:url 동기화(프리렌더 셸 값이 낡지 않게)
  useEffect(() => {
    const origin = (import.meta.env.VITE_SITE_ORIGIN || 'https://aiagentlabs.co.kr').replace(/\/$/, '')
    const href = `${origin}${location.pathname === '/' ? '/' : location.pathname}`
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', href)
    const og = document.head.querySelector('meta[property="og:url"]')
    if (og) og.setAttribute('content', href)
  }, [location.pathname])

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

  const choose = async (item) => {
    setOpen(false)
    setActive(-1)
    if (item.geo) {
      // 주소 → 좌표 지오코딩 후 맵의 해당 지점으로(부지 분석). 실패 시 일반 검색으로 폴백.
      setGeocoding(true)
      const hit = await geocodeAddr(item.query).catch(() => null)
      setGeocoding(false)
      navigate(hit?.lat != null ? `/?site=${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}` : `/?q=${encodeURIComponent(item.query)}`)
      return
    }
    navigate(item.to)
  }

  const onKey = (e) => {
    if (e.key === 'Enter') {
      // 하이라이트된 후보가 있으면 그것 / 없으면 주소처럼 보이는 입력은 지오코딩(부지 분석)
      if (open && items.length && active >= 0) {
        e.preventDefault()
        choose(items[active])
        return
      }
      const t = term.trim()
      if (looksLikeAddress(t)) {
        e.preventDefault()
        choose({ geo: true, query: t })
      }
      return
    }
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + items.length) % items.length)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
    <header className="topbar">
      <NavLink to="/" className="logo">
        <span className="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M13.5 2 4 13.5h6L9 22l10-12h-6.5L13.5 2z" />
          </svg>
        </span>
        <span className="logo-word">AI <em>Infra</em>Map</span>
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
        {geocoding && (
          <div className="search-suggest" role="status">
            <button type="button" className="searching" disabled>
              <span className="sg-kind">주소</span>
              <span>위치 찾는 중…</span>
            </button>
          </div>
        )}
        {!geocoding && open && items.length > 0 && (
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
        <NavLink to="/about" data-nav="about" className={({ isActive }) => (isActive ? 'active' : '')}>
          소개
        </NavLink>
        <NavLink to="/" end data-nav="explore" className={({ isActive }) => (isActive ? 'active' : '')}>
          맵
        </NavLink>
        <NavLink to="/map3d" data-nav="explore" className={({ isActive }) => (isActive ? 'active' : '')}>
          3D <sup className="beta-sup">β</sup>
        </NavLink>
        <NavLink to="/calc" data-nav="data" className={({ isActive }) => (isActive ? 'active' : '')}>
          GPU 계산기
        </NavLink>
        <NavLink to="/dashboard" data-nav="data" className={({ isActive }) => (isActive ? 'active' : '')}>
          대시보드
        </NavLink>
        <NavLink to="/data" data-nav="data" className={({ isActive }) => (isActive ? 'active' : '')}>
          데이터
        </NavLink>
        <NavLink to="/stats" data-nav="data" className={({ isActive }) => (isActive ? 'active' : '')}>
          통계
        </NavLink>
        <NavLink to="/insights" data-nav="knowledge" className={({ isActive }) => (isActive ? 'active' : '')}>
          인사이트
        </NavLink>
        <NavLink to="/roadmap" data-nav="knowledge" className={({ isActive }) => (isActive ? 'active' : '')}>
          로드맵
        </NavLink>
        <NavLink to="/glossary" data-nav="glossary" className={({ isActive }) => (isActive ? 'active' : '')}>
          용어집
        </NavLink>
        <NavLink to="/pricing" data-nav="data" className={({ isActive }) => `nav-contact${isActive ? ' active' : ''}`} title="요금·문의">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 4h12v8H2z M2 4.5l6 4 6-4" />
          </svg>
          <span className="contact-full">요금·문의</span>
          <span className="contact-short">문의</span>
        </NavLink>
      </nav>

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
