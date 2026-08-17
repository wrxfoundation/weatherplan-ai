import { ReactNode, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Icon, IconName } from '@/components/Icon'
import { HelpDrawer } from '@/components/HelpDrawer'
import { WellbianChat } from '@/ai/WellbianChat'
import { SHOW_ONCHAIN, HOME_PATH, DATA_DATE, communityNav as community, moduleNav as modules, settingsNav as settings } from '@/app/nav'

function NavItem({ to, icon, label }: { to: string; icon: IconName | string; label: string }) {
  return (
    <NavLink to={to} end
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-label transition-colors ${
          isActive
            ? 'bg-navy-soft font-semibold text-navy-deep'
            : 'text-body hover:bg-line-soft hover:text-ink'
        }`}>
      <Icon name={icon} size={15} className="text-current opacity-80" />
      {label}
    </NavLink>
  )
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[236px] flex-col border-r border-line bg-panel lg:flex">
      <Link to={HOME_PATH} className="flex items-center gap-2.5 px-5 pb-5 pt-5">
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-navy-soft">
          <span className="absolute h-4 w-4 -translate-x-1 rounded-full bg-navy-deep/90" />
          <span className="absolute h-3 w-3 translate-x-1.5 translate-y-1 rounded-full bg-navy/70" />
        </span>
        <div className="leading-tight">
          <div className="text-[17px] font-extrabold tracking-tight text-ink">KWeather</div>
          <div className="text-[10px] font-semibold tracking-[0.12em] text-mute">
            {SHOW_ONCHAIN ? 'ON-CHAIN CONSOLE' : 'COMMUNITY CONSOLE'}
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {SHOW_ONCHAIN && <NavItem to="/" icon="home" label="대시보드" />}
        <div className={`mb-1.5 flex items-center gap-1.5 px-3 text-tiny font-semibold text-mute ${SHOW_ONCHAIN ? 'mt-4' : ''}`}>
          WELLBIAN 커뮤니티 <span className="rounded bg-amber-soft px-1 py-px text-[9px] font-bold text-amber">NEW</span>
        </div>
        <div className="space-y-0.5">{community.map(m => <NavItem key={m.to} {...m} />)}</div>
        {SHOW_ONCHAIN && (
          <>
            <div className="mt-5 mb-1.5 px-3 text-tiny font-semibold text-mute">온체인 모듈</div>
            <div className="space-y-0.5">{modules.map(m => <NavItem key={m.to} {...m} />)}</div>
            <div className="mt-5 mb-1.5 px-3 text-tiny font-semibold text-mute">설정</div>
            <div className="space-y-0.5">{settings.map(m => <NavItem key={m.to} {...m} />)}</div>
          </>
        )}
      </nav>

      {SHOW_ONCHAIN ? (
        <div className="m-3 rounded-card border border-line p-3">
          <div className="text-tiny font-semibold text-mute">모드 요약</div>
          <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-line text-center text-label font-semibold">
            <button type="button" className="bg-navy py-1.5 text-white">DEMO</button>
            <button type="button" className="bg-panel py-1.5 text-mute" title="라이브 전환 조건 미충족">LIVE</button>
          </div>
          <div className="mt-2 text-meta text-body"><b className="num font-semibold text-navy">9 / 9</b> 모듈 데모 모드</div>
          <button type="button"
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-line px-2.5 py-1.5 text-meta font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">
            라이브 전환 조건 확인 <Icon name="chevronRight" size={13} />
          </button>
        </div>
      ) : (
        <div className="m-3 rounded-card border border-line p-3">
          <div className="text-tiny font-semibold text-mute">운영 대상</div>
          <div className="mt-1.5 text-meta leading-relaxed text-body">
            WELLBIAN 커뮤니티 채널 운영 <b className="font-semibold text-navy">2개 화면</b>
          </div>
          <div className="mt-2 border-t border-line pt-2 text-tiny leading-relaxed text-mute">
            온체인 모듈(M1~M9)·설정은 현재 담당 범위가 아니라 감춰 두었습니다.
          </div>
        </div>
      )}
    </aside>
  )
}

// 모바일: 사이드바 대신 상단 가로 스크롤 칩 내비게이션 (PRD §9)
function MobileNav() {
  const items: { to: string; label: string }[] = SHOW_ONCHAIN
    ? [
        { to: '/', label: '대시보드' },
        ...community.map(c => ({ to: c.to, label: c.label })),
        ...modules.map(m => ({ to: m.to, label: m.label.replace(' (VWI)', '') })),
        ...settings.map(s => ({ to: s.to, label: s.label })),
      ]
    : community.map(c => ({ to: c.to, label: c.label }))
  return (
    <nav className="sticky top-[64px] z-10 flex gap-1.5 overflow-x-auto border-b border-line bg-panel/95 px-4 py-2 backdrop-blur lg:hidden scrollbar-thin">
      {items.map(i => (
        <NavLink key={i.to} to={i.to} end
          className={({ isActive }) =>
            `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-meta font-semibold transition-colors ${
              isActive ? 'border-navy bg-navy text-white' : 'border-line text-body hover:border-navy/40'}`}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  )
}

function TopBar({ onHelp }: { onHelp: () => void }) {
  const { pathname } = useLocation()
  return (
    <header className="sticky top-0 z-10 flex h-[64px] items-center gap-4 border-b border-line bg-panel/95 px-6 backdrop-blur">
      {SHOW_ONCHAIN && pathname === '/' && (
        <button type="button"
          className="hidden items-center gap-6 whitespace-nowrap rounded-lg border border-line px-3.5 py-2 text-label font-medium text-ink hover:border-navy/40 transition-colors md:flex">
          전체 모듈 <Icon name="chevronDown" size={14} className="text-mute" />
        </button>
      )}
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="flex items-center gap-2.5 truncate rounded-lg bg-navy-tint px-4 py-2 text-label">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-navy" />
          <b className="shrink-0 whitespace-nowrap font-bold text-navy">DEMO<span className="hidden sm:inline"> MODE</span></b>
          <span className="hidden text-line md:inline">│</span>
          <span className="hidden truncate text-body md:inline">
            {SHOW_ONCHAIN
              ? '회사 지갑 주소 연결 시 XRPL 공개 원장 라이브 집계로 전환됩니다.'
              : '텔레그램 Bot API·GA4·서치콘솔 연동 시 실데이터 집계로 전환됩니다.'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" className="relative grid h-9 w-9 place-items-center rounded-lg text-body hover:bg-line-soft transition-colors" aria-label="알림">
          <Icon name="bell" size={17} />
          <span className="num absolute -top-0.5 -right-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">12</span>
        </button>
        <button type="button" onClick={onHelp} className="grid h-9 w-9 place-items-center rounded-lg text-body hover:bg-line-soft transition-colors" aria-label="도움말" title="이 화면 도움말">
          <Icon name="help" size={17} />
        </button>
        <button type="button" className="ml-1 flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-1.5 hover:border-navy/40 transition-colors">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-soft text-navy"><Icon name="user" size={15} /></span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-label font-semibold text-ink">박서우</span>
            <span className="block text-tiny font-medium text-mute">operator</span>
          </span>
          <Icon name="chevronDown" size={14} className="hidden text-mute sm:block" />
        </button>
      </div>
    </header>
  )
}

// 맨 위로 (dcmap ScrollTopFab 포인트) — 긴 관제 화면용, 챗 FAB 왼쪽
function ScrollTopFab() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  return (
    <button type="button" aria-label="맨 위로" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-[84px] z-30 grid h-10 w-10 place-items-center rounded-full border border-line bg-panel text-body shadow-lg transition-colors hover:border-navy/50 hover:text-navy">
      <Icon name="chevronDown" size={16} className="rotate-180" />
    </button>
  )
}

function Footer() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-line px-4 py-4 text-meta text-mute sm:justify-between sm:px-6">
      <span>
        {SHOW_ONCHAIN ? 'KWeather On-Chain Console' : 'KWeather WELLBIAN Community Console'}
        <span className="num text-mute/80"> · 데이터 기준 {DATA_DATE} · 데모 v1.3</span>
      </span>
      <span>© 2026 KWeather Inc. All rights reserved.</span>
      <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {SHOW_ONCHAIN && <>
          <Link to="/methodology" className="hover:text-navy hover:underline">산식·방법론</Link>
          <Link to="/transparency" className="hover:text-navy hover:underline">RLUSD 투명성</Link>
        </>}
        <span>데이터 출처:&nbsp; <b className="font-medium text-body">{SHOW_ONCHAIN ? 'XRPL Public Ledger' : '텔레그램 · X · GA4 · 서치콘솔 (연동 예정)'}</b></span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> 상태:&nbsp;<b className="font-medium text-body">정상</b></span>
      </span>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false)
  // 페이지 헤더의 (?) 버튼에서도 열 수 있게 커스텀 이벤트 수신
  useEffect(() => {
    const open = () => setHelpOpen(true)
    window.addEventListener('kw:open-help', open)
    return () => window.removeEventListener('kw:open-help', open)
  }, [])
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col pl-0 lg:pl-[236px]">
        <TopBar onHelp={() => setHelpOpen(true)} />
        <MobileNav />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
        <Footer />
      </div>
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <WellbianChat />
      <ScrollTopFab />
    </div>
  )
}
