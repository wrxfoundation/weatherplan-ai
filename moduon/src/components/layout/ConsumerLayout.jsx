// ─── 트랙 A 소비자몰 레이아웃: 헤더 76px + 푸터 + AI 상담봇 ─────
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Logo, Btn } from '../ui'
import { IcMenu, IcPhone } from '../icons'
import { LEGAL } from '../../lib/constants'
import { captureRef } from '../../lib/engine'
import ChatWidget from '../ChatWidget'

// GNB — 사업 초기에는 3대 주력(인터넷·핸드폰·렌탈)과 쇼핑몰만 노출한다.
// hidden: true 는 "삭제"가 아니라 "숨김" — 페이지와 라우트는 그대로 살아 있고
// 직접 URL·내부 링크로는 계속 동작한다. 준비되는 메뉴부터 hidden 을 지우면 즉시 복귀.
const NAV = [
  { to: '/category/internet', label: '인터넷' },
  { to: '/category/phone', label: '핸드폰' },
  { to: '/category/rental', label: '렌탈' },
  { to: '/shop', label: '쇼핑몰' },
  { to: '/calculator', label: '견적 계산기', hidden: true },
  { to: '/diagnosis', label: 'AI 진단', hidden: true },
  { to: '/payouts', label: '지급 명단', hidden: true },
  { to: '/partner', label: '분양 안내', hidden: true },
  { to: '/support', label: '고객센터', hidden: true },
]
const VISIBLE_NAV = NAV.filter((n) => !n.hidden)

// 즉시통화 — 파트너몰은 매장 직통, 본진은 대표번호
const telOf = (tenant) => {
  const num = tenant?.phone ?? '1660-0000'
  return { num, href: `tel:${num.replace(/-/g, '')}`, name: tenant?.phone ? '매장 직통' : '대표번호' }
}

export function ConsumerHeader({ tenant }) {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const tel = telOf(tenant)
  return (
    <header className="sticky top-0 z-40 border-b border-line-card/50 bg-cream/60 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-10">
        <Link to={tenant ? `/m/${tenant.slug}` : '/'} className="flex items-center gap-2">
          <Logo name={tenant ? tenant.name : '모두온'} />
          {tenant && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">파트너몰</span>}
        </Link>
        {!tenant && (
          <nav className="hidden items-center gap-8 md:flex">
            {VISIBLE_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `text-[15px] font-medium transition-colors hover:text-primary-text ${isActive ? 'text-primary-text' : 'text-body'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="hidden items-center gap-2.5 md:flex">
          <a href={tel.href} className="hidden items-center gap-1.5 pr-1.5 text-[13px] font-semibold text-body transition-colors hover:text-primary-text lg:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {tel.name} <span className="tnum">{tel.num}</span>
          </a>
          <button onClick={() => nav('/login')} className="glass-btn h-10 rounded-full border border-line-soft bg-white px-5 text-[14px] font-semibold text-body transition-colors hover:border-primary hover:text-primary-text">
            로그인
          </button>
          <button onClick={() => nav(tenant ? `/consult?src=${tenant.slug}` : '/consult')} className="shimmer-cta glass-btn-cta h-10 rounded-full bg-primary px-5 text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">
            무료 상담
          </button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="메뉴"><IcMenu size={22} /></button>
      </div>
      {open && (
        <div className="border-t border-line-card bg-white px-5 py-3 md:hidden">
          {(tenant ? [] : VISIBLE_NAV).map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-2.5 text-[15px] font-semibold text-body">{n.label}</Link>
          ))}
          <Btn className="mt-2 w-full shimmer-cta" onClick={() => { setOpen(false); nav(tenant ? `/consult?src=${tenant.slug}` : '/consult') }}>무료 상담 신청</Btn>
          <a href={tel.href} onClick={() => setOpen(false)} className="glass-btn mt-2 flex h-12 w-full items-center justify-center gap-1.5 rounded-btn border border-line-soft bg-white text-[15px] font-bold text-body">
            <IcPhone size={16} /> {tel.name} <span className="tnum">{tel.num}</span>
          </a>
        </div>
      )}
    </header>
  )
}

export function ConsumerFooter({ tenant }) {
  const tel = telOf(tenant)
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
              <Link to="/payouts" className="hover:text-primary-text">사은품 지급 명단</Link>
              <Link to="/consult" className="hover:text-primary-text">무료 상담</Link>
              <a href={tel.href} className="tnum hover:text-primary-text">{tenant?.phone ? `매장 직통 ${tel.num}` : `전화 상담 ${tel.num}`}</a>
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
  // 추천 링크(?ref=) 최초 진입 시 귀속 각인 — 이후 어느 화면에서 신청해도 유지
  useEffect(() => { captureRef() }, [])
  return (
    <div className="min-h-screen bg-cream">
      <ConsumerHeader />
      <Outlet />
      <ConsumerFooter />
      <ChatWidget />
    </div>
  )
}
