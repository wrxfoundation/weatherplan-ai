// ─── 트랙 A 소비자몰 레이아웃: 헤더 76px + 푸터 + AI 상담봇 ─────
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Logo, Btn } from '../ui'
import { LEGAL } from '../../lib/constants'
import ChatWidget from '../ChatWidget'

const NAV = [
  { to: '/', label: '서비스' },
  { to: '/calculator', label: '견적 계산기' },
  { to: '/diagnosis', label: 'AI 진단' },
  { to: '/partner', label: '분양 안내' },
  { to: '/login', label: '고객센터' },
]

export function ConsumerHeader({ tenant }) {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-line-card/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-10">
        <Link to={tenant ? `/m/${tenant.slug}` : '/'} className="flex items-center gap-2">
          <Logo name={tenant ? tenant.name : '모두온'} />
          {tenant && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">파트너몰</span>}
        </Link>
        {!tenant && (
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `text-[15px] font-medium transition-colors hover:text-primary-text ${isActive ? 'text-primary-text' : 'text-body'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="hidden items-center gap-2.5 md:flex">
          <button onClick={() => nav('/login')} className="h-10 rounded-full border border-line-soft bg-white px-5 text-[14px] font-semibold text-body transition-colors hover:border-primary hover:text-primary-text">
            로그인
          </button>
          <button onClick={() => nav(tenant ? `/consult?src=${tenant.slug}` : '/consult')} className="h-10 rounded-full bg-primary px-5 text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">
            무료 상담
          </button>
        </div>
        <button className="text-[22px] md:hidden" onClick={() => setOpen(!open)} aria-label="메뉴">☰</button>
      </div>
      {open && (
        <div className="border-t border-line-card bg-white px-5 py-3 md:hidden">
          {(tenant ? [] : NAV).map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-2.5 text-[15px] font-semibold text-body">{n.label}</Link>
          ))}
          <Btn className="mt-2 w-full" onClick={() => { setOpen(false); nav(tenant ? `/consult?src=${tenant.slug}` : '/consult') }}>무료 상담 신청</Btn>
        </div>
      )}
    </header>
  )
}

export function ConsumerFooter({ tenant }) {
  return (
    <footer className="mt-16 border-t border-line-card bg-cream pb-24 pt-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <Logo size="sm" name={tenant ? tenant.name : '모두온'} />
            <p className="mt-2 max-w-sm text-[13px] leading-5 text-muted">
              생활의 모든 순간, 필요한 모든 서비스를 가장 합리적인 가격으로. {tenant ? `${tenant.name}은(는) 모두온 공식 파트너몰입니다.` : '모두온은 생활서비스 비교·상담 플랫폼입니다.'}
            </p>
          </div>
          <div className="flex gap-10 text-[13px] text-label">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-ink">서비스</span>
              <Link to="/calculator" className="hover:text-primary-text">견적 계산기</Link>
              <Link to="/diagnosis" className="hover:text-primary-text">AI 생활비 진단</Link>
              <Link to="/consult" className="hover:text-primary-text">무료 상담</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-bold text-ink">파트너</span>
              <Link to="/partner" className="hover:text-primary-text">분양 안내</Link>
              <Link to="/partner/apply" className="hover:text-primary-text">분양 신청</Link>
              <Link to="/login" className="hover:text-primary-text">마이오피스</Link>
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
  return (
    <div className="min-h-screen bg-cream">
      <ConsumerHeader />
      <Outlet />
      <ConsumerFooter />
      <ChatWidget />
    </div>
  )
}
