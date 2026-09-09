// ─── 트랙 A 소비자몰 레이아웃: 헤더(유틸행 + 본 GNB 2행) + 푸터 + 우측 플로팅 패널 + AI 상담봇 ─────
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '../ui'
import { IcMenu, IcBell, IcMegaphone, IcShare, IcThumbUp, IcChat, IcBulb, IcGift, IcAlert, IcPhone, IcHeadset } from '../icons'
import { LEGAL, SITE_NAV, BOARDS, UTIL_NAV, HQ_TEL, boardByKey } from '../../lib/constants'
import { captureRef, timeAgo } from '../../lib/engine'
import { useStore } from '../../lib/store'
import ChatWidget from '../ChatWidget'
import FloatingPanel from '../FloatingPanel'
import { INTERNET_CARRIERS } from '../../lib/internet'
import { RENTAL_BRANDS } from '../../lib/rentals'
import { CAR_BRANDS, ORIGINS } from '../../lib/cars'

// GNB(아정당식 2행) — 1행 유틸은 UTIL_NAV(게시판 5종), 2행 본 GNB 는 SITE_NAV(6종)를 그대로 읽는다.
// 예전 NAV 의 숨김 항목(견적 계산기·AI 진단·지급 명단·분양 안내·고객센터)은 라우트가 그대로 살아 있고
// 푸터·플로팅 패널·햄버거 패널에서 계속 연결된다 — 숨김 ≠ 삭제.

// ─── 메가메뉴 (아정당식) — GNB에 커서를 올리면 하위 카테고리가 펼쳐진다 ────────
// 키는 SITE_NAV.to 와 같다(/category/phone·/category/rental·/category/internet·/cars) — 매장패키지·모두온혜택은 메가메뉴 없음.
// 인터넷: 통신사별 → 빌더에 통신사 프리필. 휴대폰: 온라인 구매 / 알뜰폰 요금제.
// 렌탈: 좌측 브랜드 목록 + 우측 브랜드별 카테고리 그리드(첨부 스크린샷 구조).
// 패널은 <nav> 바깥에 호버 시에만 렌더한다 — GNB 링크 수를 세는 스모크·접근성 트리를 더럽히지 않게.
const MEGA = {
  '/category/internet': {
    title: '통신사별 인터넷', foot: { label: '조건 직접 골라 견적 내기 →', to: '/category/internet' },
    items: INTERNET_CARRIERS.map((c) => ({ key: c.key, label: c.sub, mark: c.mark, color: c.color, sub: c.tags.slice(0, 2).join(' '), to: `/category/internet?carrier=${encodeURIComponent(c.key)}`, badge: c.budget ? '알뜰' : null })),
  },
  '/category/phone': {
    title: '휴대폰',
    items: [
      { key: 'shop', label: '온라인 구매', sub: '셀프가입 · 기종별 월 납부금 계산', to: '/phone/shop' },
      { key: 'mvno', label: '알뜰폰 요금제', sub: '대표 요금제 · 브랜드별 혜택 · 전체 목록', to: '/phone/mvno' },
      { key: 'calc', label: '휴대폰 견적 계산기', sub: '단말 할부(A) + 요금(B)', to: '/calculator/phone' },
    ],
  },
  '/category/rental': { title: '렌탈 제품전체', brands: RENTAL_BRANDS },
  '/cars': {
    title: '렌트 · 리스', foot: { label: '전체 차종 보기 →', to: '/cars' },
    groups: ORIGINS.map((o) => ({ label: o.label, items: CAR_BRANDS.filter((b) => b.origin === o.key).map((b) => ({ key: b.key, label: b.name, to: `/cars?brand=${b.key}` })) })),
  },
}

// ─── 햄버거 패널 구성 — 아이콘 그리드 · 혜택 · 게시판 ───────────────────────
// 그리드는 목업 순서(인터넷·가전렌탈·휴대폰 / 매장패키지·멤버십몰). 멤버십몰은 상품 카테고리가 아니라 별도 목적지(/shop).
// 모바일은 본 GNB 6종이 가로 스크롤로 보이지만, 패널만 열어도 전부 닿도록 렌트/리스·모두온혜택을 md 미만에서만 덧붙인다.
const MENU_GRID = [
  ...['internet', 'rental', 'phone', 'package'].map((k) => SITE_NAV.find((n) => n.key === k)),
  { key: 'shop', label: '멤버십몰', icon: '/assets/cat-shop.png', to: '/shop' },
  ...['car', 'benefit'].map((k) => ({ ...SITE_NAV.find((n) => n.key === k), mobileOnly: true })),
]
const MENU_BENEFIT = [
  { key: 'ads', label: '광고보기', to: '/benefits/ads', Icon: IcMegaphone },
  { key: 'invite', label: '친구초대하기', to: '/benefits/invite', Icon: IcShare },
]
const BOARD_ICON = { review: IcThumbUp, qna: IcChat, tip: IcBulb, event: IcGift, complaint: IcAlert, notice: IcMegaphone }

// 소비자 알림 읽음 시그니처 — 최신 3건의 id 를 콤마로 이어 저장. 새 글이 끼어들면 그 건만 안 읽음으로 센다.
const CNOTIF_KEY = 'moduon_cnotif_sig'

// 즉시통화 — 파트너몰은 매장 직통, 본진은 대표번호
const telOf = (tenant) => {
  const num = tenant?.phone ?? HQ_TEL
  return { num, href: `tel:${num.replace(/-/g, '')}`, name: tenant?.phone ? '매장 직통' : '대표번호' }
}

// 3D 타일 아이콘 — 에셋은 배포 시 내려받으므로 로드 실패 시 첫 글자 원형으로 폴백(외부 URL 금지)
function TileImg({ src, label, size = 44 }) {
  const [err, setErr] = useState(false)
  if (err) return <span className="flex items-center justify-center rounded-full bg-tint text-[15px] font-extrabold text-primary-text" style={{ width: size, height: size }} aria-hidden>{label[0]}</span>
  return <img src={src} alt="" onError={() => setErr(true)} className="object-contain" style={{ width: size, height: size }} loading="lazy" />
}

// ─── 소비자 알림(🔔) — 공지·이벤트 최신 3건 드롭다운 ────────────────────────
function NotifBell() {
  const { db } = useStore()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const items = useMemo(
    () => db.posts.filter((p) => (p.board === 'notice' || p.board === 'event') && !['숨김', '비공개', '삭제'].includes(p.status)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [db.posts],
  )
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem(CNOTIF_KEY) ?? '' } catch { return '' } })
  const seenIds = new Set(seen.split(',').filter(Boolean))
  const unread = items.filter((p) => !seenIds.has(p.id)).length
  const toggle = () => {
    if (!open) {
      const sig = items.map((p) => p.id).join(',')
      setSeen(sig)
      try { localStorage.setItem(CNOTIF_KEY, sig) } catch { /* noop */ }
    }
    setOpen(!open)
  }
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])
  // 패널 앵커 — sm 이상은 종 버튼 우측에 300px 드롭다운. sm 미만은 종 오른쪽에 로그인 알약이 있어 벨 기준 right-0 이면
  // 패널 왼쪽 45px 이 뷰포트 밖으로 잘린다(390). 래퍼의 relative 를 sm 에서만 걸어 모바일은 <header>(sticky=positioned) 기준
  // 좌우 16px 여백으로 펼친다. 패널은 여전히 래퍼의 자식이라 바깥 클릭 판정(ref.contains)도 그대로 동작.
  return (
    <div ref={ref} className="sm:relative">
      <button data-t="cnotif" onClick={toggle} aria-label={unread ? `알림 ${unread}건` : '알림'} aria-expanded={open} aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-body transition-colors hover:bg-white hover:text-primary-text">
        <IcBell size={19} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold leading-none text-white">{unread}</span>}
      </button>
      {open && (
        <div data-t="cnotif-panel" className="absolute left-4 right-4 top-[60px] z-50 overflow-hidden rounded-card border border-line-card bg-white shadow-panel animate-rise sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:w-[300px]">
          <div className="flex items-center justify-between border-b border-line-card px-4 py-2.5">
            <span className="text-[13px] font-extrabold text-ink">알림</span>
            <span className="text-[11px] text-faint">공지·이벤트 최신 3건</span>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-faint">새 소식이 없어요</p>
          ) : (
            <ul>
              {items.map((p) => (
                <li key={p.id}>
                  <Link to={`/board/${p.board}/${p.id}`} className="flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-tint">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[10px] font-bold leading-[18px] ${p.board === 'event' ? 'bg-orange-tint text-orange-text' : 'bg-tint text-primary-text'}`}>{boardByKey(p.board)?.name}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{p.title}</span>
                      <span className="mt-0.5 block text-[11px] text-faint">{timeAgo(p.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/board/notice" className="block border-t border-line-card px-4 py-2.5 text-center text-[12.5px] font-bold text-primary-text transition-colors hover:bg-tint">공지사항 전체 보기 →</Link>
        </div>
      )}
    </div>
  )
}

// ─── 햄버거 패널 내용 — 데스크톱 드롭다운(320px)·모바일 전폭이 같은 컴포넌트를 쓴다 ─────
function MenuPanel({ onClose, membershipOn }) {
  const rowCls = 'flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-semibold text-body transition-colors hover:bg-tint hover:text-primary-text'
  return (
    <>
      <div className="grid grid-cols-3 gap-1 p-3">
        {MENU_GRID.map((n) => (
          <Link key={n.key} to={n.to} onClick={onClose} className={`flex flex-col items-center gap-1.5 rounded-field py-2.5 transition-colors hover:bg-tint ${n.mobileOnly ? 'md:hidden' : ''}`}>
            <TileImg src={n.icon} label={n.label} />
            <span className="text-[12.5px] font-semibold text-body">
              {n.label}
              {n.key === 'shop' && !membershipOn && <span className="ml-1 text-[10px] font-bold text-faint">준비중</span>}
            </span>
          </Link>
        ))}
      </div>
      <div className="border-t border-line-card py-1.5">
        <div className="px-4 pb-0.5 pt-1.5 text-[11.5px] font-bold text-faint">혜택</div>
        {MENU_BENEFIT.map(({ key, label, to, Icon }) => (
          <Link key={key} to={to} onClick={onClose} className={rowCls}>
            <Icon size={16} className="text-label" /><span className="flex-1">{label}</span><span className="text-[15px] text-faint">›</span>
          </Link>
        ))}
      </div>
      <div className="border-t border-line-card py-1.5">
        <div className="px-4 pb-0.5 pt-1.5 text-[11.5px] font-bold text-faint">게시판</div>
        {BOARDS.map((b) => {
          const Icon = BOARD_ICON[b.key]
          return (
            <Link key={b.key} to={`/board/${b.key}`} onClick={onClose} className={rowCls}>
              <Icon size={16} className="text-label" /><span className="flex-1">{b.name}</span><span className="text-[15px] text-faint">›</span>
            </Link>
          )
        })}
      </div>
      {/* 고객센터 — 옛 NAV 의 숨김 항목. GNB 에서 빠졌어도 여기서 계속 닿아야 한다(숨김 ≠ 삭제) */}
      <div className="border-t border-line-card py-1.5">
        <Link to="/support" onClick={onClose} className={rowCls}>
          <IcHeadset size={16} className="text-label" /><span className="flex-1">고객센터</span><span className="text-[15px] text-faint">›</span>
        </Link>
      </div>
    </>
  )
}

export function ConsumerHeader({ tenant }) {
  const nav = useNavigate()
  const { db } = useStore()
  const [open, setOpen] = useState(false) // 햄버거 패널
  const [mega, setMega] = useState(null) // 호버 중인 GNB 항목(to)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  // 패널을 닫는 mouseleave 는 <header> 에 건다. <nav> 에 두면 글자와 패널 사이 여백을 지나는 동안 닫혀 클릭이 불가능하다.
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { setMega(null); setOpen(false) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  // 라우트가 바뀌면 메가메뉴·햄버거 패널을 닫는다 — 마우스가 GNB 위에 머문 채 이동하면 패널이 새 페이지를 덮는다
  const { pathname } = useLocation()
  useEffect(() => { setMega(null); setOpen(false) }, [pathname])
  // 햄버거 패널 바깥 클릭 → 닫힘 (버튼 자체는 토글이 처리)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return; setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  // 메가메뉴가 있는 항목에 커서를 올리면 햄버거 패널은 접는다 — 두 패널이 겹치지 않게
  const hoverMega = (to) => { if (MEGA[to]) { setMega(to); setOpen(false) } else setMega(null) }
  // 파트너몰 즉시통화 — 유틸행 우측에 그린다(파트너몰은 GNB·햄버거가 없어 유틸행이 상단의 유일한 동선)
  const tel = telOf(tenant)
  return (
    // 배경은 거의 불투명하게(95%) — 60% 였을 때 히어로의 흰 CTA·제목이 GNB 뒤로 비쳐 호버 상태처럼 오독됐다. 블러는 남은 5% 몫.
    <header className="sticky top-0 z-40 border-b border-line-card/50 bg-cream/95 backdrop-blur-md" onMouseLeave={() => setMega(null)}>
      {/* 1행 · 유틸 — 로고 · 게시판 5종 · 알림 · 로그인/회원가입 (파트너몰은 로고 + 배지 + 매장 직통 전화 + 무료 상담) */}
      <div className="mx-auto flex h-[56px] max-w-6xl items-center justify-between gap-3 px-5 sm:px-10">
        <div className="flex min-w-0 items-center gap-7">
          <Link to={tenant ? `/m/${tenant.slug}` : '/'} className="flex shrink-0 items-center gap-2">
            <Logo name={tenant ? tenant.name : '모두온'} />
            {tenant && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">파트너몰</span>}
          </Link>
          {!tenant && (
            <nav data-t="util-nav" aria-label="게시판 바로가기" className="hidden items-center gap-4 md:flex">
              {UTIL_NAV.map((b) => (
                <NavLink key={b.key} to={`/board/${b.key}`} className={({ isActive }) => `whitespace-nowrap text-[13px] font-medium transition-colors hover:text-primary-text ${isActive ? 'text-primary-text' : 'text-label'}`}>
                  {b.name}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        {tenant ? (
          /* 파트너몰 — 매장 직통 전화(사장님이 직접 상담) + 무료 상담(src 슬러그로 리드 귀속).
             sm 미만은 로고+배지가 폭을 거의 다 먹어 전화는 아이콘만, 상담 버튼은 sm 부터(본문 CTA·챗봇이 같은 경로를 연다) */
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <a href={tel.href} data-t="tenant-tel" aria-label={`${tel.name} ${tel.num}`}
              className="glass-btn flex h-9 items-center gap-1.5 rounded-full border border-line-soft bg-white px-2.5 text-[13px] font-semibold text-body transition-colors hover:border-primary hover:text-primary-text sm:px-3.5">
              <IcPhone size={14} />
              <span className="hidden lg:inline">{tel.name}</span>
              <span className="tnum hidden sm:inline">{tel.num}</span>
            </a>
            <button data-t="tenant-consult" onClick={() => nav(`/consult?src=${tenant.slug}`)}
              className="shimmer-cta glass-btn-cta hidden h-9 whitespace-nowrap rounded-full bg-primary px-4 text-[13px] font-bold text-white transition-colors hover:bg-primary-hover sm:inline-flex sm:items-center">
              무료 상담
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotifBell />
            <button onClick={() => nav('/login')} className="glass-btn h-8 whitespace-nowrap rounded-full bg-[#EEF0F3] px-3 text-[12px] font-semibold text-label transition-colors hover:bg-line-soft hover:text-ink sm:px-3.5 sm:text-[12.5px]">
              로그인/회원가입
            </button>
          </div>
        )}
      </div>

      {/* 2행 · 본 GNB — SITE_NAV 6종 굵게 + 우측 끝 ☰(데스크톱·모바일 공통). 모바일은 가로 스크롤 */}
      {!tenant && (
        <div className="relative mx-auto flex h-[46px] max-w-6xl items-center justify-between gap-3 px-5 sm:px-10 md:h-[54px]">
          <nav data-t="main-nav" aria-label="주요 메뉴" className="scrollbar-none flex h-full min-w-0 items-center gap-5 overflow-x-auto md:gap-8 md:overflow-visible">
            {SITE_NAV.map((n) => (
              <NavLink key={n.key} to={n.to} onMouseEnter={() => hoverMega(n.to)} onFocus={() => hoverMega(n.to)} onClick={() => setMega(null)}
                aria-haspopup={MEGA[n.to] ? 'true' : undefined} aria-expanded={MEGA[n.to] ? mega === n.to : undefined}
                className={({ isActive }) => `relative shrink-0 whitespace-nowrap py-1.5 text-[15px] font-extrabold tracking-tight transition-colors hover:text-primary-text md:text-[17px] ${isActive || mega === n.to ? 'text-primary-text' : 'text-ink'}`}>
                {n.badge && <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#8B7BFF] px-1.5 text-[9px] font-bold leading-[13px] text-white md:-top-2.5">{n.badge}</span>}
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button ref={btnRef} data-t="hamburger" onClick={() => { setOpen(!open); setMega(null) }} aria-label="전체 메뉴" aria-expanded={open} aria-controls="hamburger-panel"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white ${open ? 'bg-white text-primary-text' : 'text-ink'}`}>
            <IcMenu size={24} />
          </button>
          {open && (
            <div ref={panelRef} id="hamburger-panel" data-t="hamburger-panel"
              className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-120px)] overflow-y-auto border-b border-line-card bg-white shadow-panel animate-rise md:left-auto md:mt-1.5 md:w-[320px] md:rounded-card md:border">
              <MenuPanel onClose={() => setOpen(false)} membershipOn={db.benefits?.membershipMallOn !== false} />
            </div>
          )}
        </div>
      )}

      {mega && MEGA[mega] && !tenant && (
        <div className="absolute inset-x-0 top-full hidden border-b border-line-card bg-white shadow-panel md:block" data-t="mega" data-mega={mega}>
          <div className="mx-auto max-w-6xl px-10 py-5">
            {MEGA[mega].brands ? (
              <div className="grid grid-cols-[200px_1fr] gap-6">
                <ul className="flex flex-col border-r border-line pr-4" data-t="mega-brands">
                  <li>
                    <Link to="/category/rental" onClick={() => setMega(null)}
                      className="flex items-center justify-between rounded-field px-2 py-1.5 text-[13.5px] font-extrabold text-ink transition-colors hover:bg-tint hover:text-primary-text">
                      {MEGA[mega].title}<span className="text-[15px] text-faint">›</span>
                    </Link>
                  </li>
                  {MEGA[mega].brands.map((b) => (
                    <li key={b.key}><Link to={`/category/rental?brand=${b.key}`} onClick={() => setMega(null)} className="flex items-center justify-between rounded-field px-2 py-1.5 text-[13.5px] font-semibold text-body transition-colors hover:bg-tint hover:text-primary-text">{b.name}<span className="text-[15px] text-faint">›</span></Link></li>
                  ))}
                </ul>
                <div className="grid grid-cols-4 gap-x-6 gap-y-5" data-t="mega-grid">
                  {MEGA[mega].brands.map((b) => (
                    <div key={b.key}>
                      <Link to={`/category/rental?brand=${b.key}`} onClick={() => setMega(null)} className="-mx-2 block rounded-field border-b border-line px-2 pb-1.5 pt-1 text-[13.5px] font-extrabold text-ink transition-colors hover:bg-tint hover:text-primary-text">{b.name}</Link>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {b.cats.map((c) => (
                          <li key={c}>
                            {/* 블록 + 패딩으로 행 전체가 히트 영역이 된다 — 인라인이면 글자 획 위에서만 반응해 "클릭이 안 된다"고 느낀다 */}
                            <Link to={`/category/rental?brand=${b.key}&type=${encodeURIComponent(c)}`} onClick={() => setMega(null)}
                              className="-mx-2 block rounded-field px-2 py-[3px] text-[12.5px] text-label transition-colors hover:bg-tint hover:font-semibold hover:text-primary-text">{c}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : MEGA[mega].groups ? (
              <div data-t="mega-groups">
                <div className="text-[12px] font-bold text-faint">{MEGA[mega].title}</div>
                {MEGA[mega].groups.map((g) => (
                  <div key={g.label} className="mt-2.5">
                    <div className="text-[12px] font-extrabold text-label">{g.label}</div>
                    <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                      {g.items.map((it) => (
                        <Link key={it.key} to={it.to} onClick={() => setMega(null)}
                          className="flex h-10 items-center justify-center rounded-btn border border-line bg-white text-[12.5px] font-bold text-label transition-colors hover:border-primary hover:bg-tint hover:text-primary-text">{it.label}</Link>
                      ))}
                    </div>
                  </div>
                ))}
                {MEGA[mega].foot && <Link to={MEGA[mega].foot.to} onClick={() => setMega(null)} className="mt-3 inline-block text-[12.5px] font-bold text-primary-text hover:underline">{MEGA[mega].foot.label}</Link>}
              </div>
            ) : (
              <div>
                <div className="text-[12px] font-bold text-faint">{MEGA[mega].title}</div>
                <div className={`mt-2 grid gap-2 ${MEGA[mega].items.length > 3 ? 'grid-cols-5' : 'grid-cols-3'}`} data-t="mega-items">
                  {MEGA[mega].items.map((it) => (
                    <Link key={it.key} to={it.to} onClick={() => setMega(null)} className="flex flex-col rounded-btn border border-line bg-white p-3.5 transition-colors hover:border-primary hover:bg-tint hover:text-primary-text">
                      {it.mark && <span className="text-[15px] font-black" style={{ color: it.color }}>{it.mark}</span>}
                      <span className="text-[14px] font-bold text-ink">{it.label} {it.badge && <span className="rounded bg-ok/10 px-1.5 text-[9.5px] font-bold text-ok">{it.badge}</span>}</span>
                      <span className="mt-0.5 text-[11px] leading-4 text-faint">{it.sub}</span>
                    </Link>
                  ))}
                </div>
                {MEGA[mega].foot && <Link to={MEGA[mega].foot.to} onClick={() => setMega(null)} className="mt-3 inline-block text-[12.5px] font-bold text-primary-text hover:underline">{MEGA[mega].foot.label}</Link>}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export function ConsumerFooter({ tenant }) {
  const tel = telOf(tenant)
  const col = 'flex flex-col gap-2'
  const lnk = 'hover:text-primary-text'
  return (
    <footer className="mt-16 border-t border-line-card bg-cream pb-24 pt-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row">
          <div>
            <Logo size="sm" name={tenant ? tenant.name : '모두온'} />
            <p className="mt-2 max-w-sm text-[13px] leading-5 text-muted">
              생활의 모든 순간, 필요한 모든 서비스를 가장 합리적인 가격으로. {tenant ? `${tenant.name}은(는) 모두온 공식 파트너몰입니다.` : '모두온은 생활서비스 비교·상담 플랫폼입니다.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-[13px] text-label sm:flex sm:gap-10">
            <div className={col}>
              <span className="font-bold text-ink">서비스</span>
              <Link to="/calculator" className={lnk}>견적 계산기</Link>
              <Link to="/diagnosis" className={lnk}>AI 생활비 진단</Link>
              <Link to="/payouts" className={lnk}>사은품 지급 명단</Link>
              <Link to="/consult" className={lnk}>무료 상담</Link>
              <Link to="/support" className={lnk}>고객센터</Link>
              <a href={tel.href} className={`tnum ${lnk}`}>{tenant?.phone ? `매장 직통 ${tel.num}` : `대표번호 ${tel.num}`}</a>
            </div>
            <div className={col}>
              <span className="font-bold text-ink">게시판</span>
              {BOARDS.map((b) => <Link key={b.key} to={`/board/${b.key}`} className={lnk}>{b.name}</Link>)}
            </div>
            <div className={col}>
              <span className="font-bold text-ink">혜택</span>
              <Link to="/benefits" className={lnk}>모두온혜택</Link>
              <Link to="/benefits/invite" className={lnk}>친구초대</Link>
              <Link to="/benefits/ads" className={lnk}>광고보기</Link>
            </div>
            <div className={col}>
              <span className="font-bold text-ink">파트너</span>
              <Link to="/partner" className={lnk}>분양 안내</Link>
              <Link to="/partner/apply" className={lnk}>분양 신청</Link>
              <Link to="/login" className={lnk}>마이오피스</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-line-card pt-5 text-[12px] leading-5 text-disabled">
          <p>{LEGAL.policy} {LEGAL.privacy}</p>
          <p className="mt-1">© 2026 MODUON. 모두온 데모 빌드 — 화면의 수치·업체명은 시연용 예시입니다.</p>
        </div>
      </div>
    </footer>
  )
}

export default function ConsumerLayout() {
  // 추천 링크(?ref=) 최초 진입 시 귀속 각인 — 이후 어느 화면에서 신청해도 유지
  useEffect(() => { captureRef() }, [])
  // 본진 전용 레이아웃 — 파트너몰(TenantMall)은 헤더·푸터를 직접 조립하므로 플로팅 패널은 여기서만 붙는다
  return (
    <div className="min-h-screen bg-cream">
      <ConsumerHeader />
      <Outlet />
      <ConsumerFooter />
      <FloatingPanel />
      <ChatWidget />
    </div>
  )
}
