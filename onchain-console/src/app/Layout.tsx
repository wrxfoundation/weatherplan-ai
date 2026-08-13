import { ReactNode, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Icon, IconName } from '@/components/Icon'
import { HelpDrawer } from '@/components/HelpDrawer'

const modules: { to: string; icon: IconName | string; label: string }[] = [
  { to: '/m1', icon: 'wallet', label: 'M1 활성 지갑' },
  { to: '/m2', icon: 'thermo', label: 'M2 정산 지수 (VWI)' },
  { to: '/m3', icon: 'exchange', label: 'M3 결제/정산' },
  { to: '/m4', icon: 'cpu', label: 'M4 DePIN 보상' },
  { to: '/m5', icon: 'gauge', label: 'M5 재무 현황' },
  { to: '/m6', icon: 'handshake', label: 'M6 파트너 정산' },
  { to: '/m7', icon: 'chat', label: 'M7 소셜 & 미디어' },
  { to: '/m8', icon: 'coins', label: 'M8 토큰 홀더' },
  { to: '/m9', icon: 'doc', label: 'M9 리포트 & 알림' },
]

const settings: { to: string; icon: IconName | string; label: string }[] = [
  { to: '/settings/modes', icon: 'sliders', label: '모듈 모드 관리' },
  { to: '/settings/wallets', icon: 'registry', label: '지갑 레지스트리' },
  { to: '/settings/alerts', icon: 'bell', label: '알림 규칙' },
  { to: '/settings/users', icon: 'users', label: '사용자 관리' },
  { to: '/settings/audit', icon: 'audit', label: '감사 로그' },
]

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
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-5">
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-navy-soft">
          <span className="absolute h-4 w-4 -translate-x-1 rounded-full bg-navy-deep/90" />
          <span className="absolute h-3 w-3 translate-x-1.5 translate-y-1 rounded-full bg-navy/70" />
        </span>
        <div className="leading-tight">
          <div className="text-[17px] font-extrabold tracking-tight text-ink">KWeather</div>
          <div className="text-[10px] font-semibold tracking-[0.12em] text-mute">ON-CHAIN CONSOLE</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <NavItem to="/" icon="home" label="대시보드" />
        <div className="mt-4 mb-1.5 px-3 text-tiny font-semibold text-mute">모듈</div>
        <div className="space-y-0.5">{modules.map(m => <NavItem key={m.to} {...m} />)}</div>
        <div className="mt-5 mb-1.5 px-3 text-tiny font-semibold text-mute">설정</div>
        <div className="space-y-0.5">{settings.map(m => <NavItem key={m.to} {...m} />)}</div>
      </nav>

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
    </aside>
  )
}

// 모바일: 사이드바 대신 상단 가로 스크롤 칩 내비게이션 (PRD §9)
function MobileNav() {
  const items: { to: string; label: string }[] = [
    { to: '/', label: '대시보드' },
    ...modules.map(m => ({ to: m.to, label: m.label.replace(' (VWI)', '') })),
    ...settings.map(s => ({ to: s.to, label: s.label })),
  ]
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
      {pathname === '/' && (
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
          <span className="hidden truncate text-body md:inline">회사 지갑 주소 연결 시 XRPL 공개 원장 라이브 집계로 전환됩니다.</span>
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
          <span className="text-left leading-tight">
            <span className="block text-label font-semibold text-ink">박서우</span>
            <span className="block text-tiny font-medium text-mute">operator</span>
          </span>
          <Icon name="chevronDown" size={14} className="text-mute" />
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-auto flex items-center justify-between gap-4 border-t border-line px-6 py-4 text-meta text-mute">
      <span>KWeather On-Chain Console</span>
      <span>© 2026 KWeather Inc. All rights reserved.</span>
      <span className="flex items-center gap-4">
        <Link to="/methodology" className="hover:text-navy hover:underline">산식·방법론</Link>
        <Link to="/transparency" className="hover:text-navy hover:underline">RLUSD 투명성</Link>
        <span>데이터 출처:&nbsp; <b className="font-medium text-body">XRPL Public Ledger</b></span>
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
    </div>
  )
}
