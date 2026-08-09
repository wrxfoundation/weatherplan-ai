// ─── 트랙 B 본사 어드민(관제) 레이아웃 — 그룹형 IA 사이드바 ──────
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore, getSession } from '../../lib/store'
import { Logo } from '../ui'

const GROUPS = [
  { label: null, items: [{ to: '/admin', label: '통합 대시보드', icon: '▦', end: true }] },
  { label: '서비스 관리', items: [
    { to: '/admin/tenants', label: '분양몰 관리', icon: '🏪' },
    { to: '/admin/products', label: '상품 관리', icon: '📦' },
    { to: '/admin/policies', label: '정책 관리', icon: '📋' },
  ]},
  { label: '리드 관제', items: [{ to: '/admin/leads', label: '리드 콘솔', icon: '⚡' }] },
  { label: 'AI 관리', items: [{ to: '/admin/ai', label: 'AI 운영 현황', icon: '🤖' }] },
  { label: '정산·수익', items: [{ to: '/admin/settlements', label: '정산·지급', icon: '₩' }] },
  { label: '시스템', items: [{ to: '/admin/audit', label: '권한·감사 로그', icon: '🔒' }] },
]

export default function AdminLayout() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (!session || session.role !== 'admin') nav('/login?next=/admin', { replace: true })
  }, []) // eslint-disable-line

  // 관제 데모 피드: 전체 권역으로 리드 유입
  useEffect(() => {
    if (!db.demoFeed) return
    const t = setInterval(() => {
      if (Math.random() < 0.5) dispatch({ type: 'SPAWN_DEMO_LEAD' })
    }, 50000 + Math.random() * 40000)
    return () => clearInterval(t)
  }, [db.demoFeed]) // eslint-disable-line

  if (!session || session.role !== 'admin') return null
  const pendingApps = db.applications.filter((a) => a.status === '대기').length

  return (
    <div className="min-h-screen bg-bbg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col overflow-y-auto border-r border-bline bg-white lg:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo size="sm" />
          <span className="rounded-full bg-bink px-2 py-0.5 text-[10px] font-bold text-white">HQ 관제</span>
        </div>
        <nav className="flex-1 px-3 pb-4">
          {GROUPS.map((g, gi) => (
            <div key={gi} className="mb-2">
              {g.label && <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-bfaint">{g.label}</div>}
              {g.items.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.end}
                  className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-field px-3 py-2.5 text-[14px] font-semibold transition-colors ${isActive ? 'bg-tint text-primary-text' : 'text-bbody hover:bg-brow'}`}
                >
                  <span className="w-5 text-center text-[13px]">{m.icon}</span>
                  {m.label}
                  {m.to === '/admin/tenants' && pendingApps > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warn px-1.5 text-[11px] font-bold text-white">{pendingApps}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-card bg-brow p-4">
          <div className="text-[12px] font-bold text-bink">🤖 AI 비서 모비</div>
          <p className="mt-1 text-[11px] leading-4 text-bmuted">자동 분류·인사이트가 실시간 반영 중입니다.</p>
          <NavLink to="/admin/ai" className="mt-2 inline-block text-[11px] font-bold text-primary-text">AI 운영 현황 →</NavLink>
        </div>
        <button onClick={() => nav('/login')} className="mx-3 mb-4 rounded-field border border-bline py-2 text-[12px] font-semibold text-bmuted hover:text-bink">
          역할 전환 / 로그아웃
        </button>
      </aside>

      <main className="px-4 pb-24 pt-5 sm:px-6 lg:ml-[224px] lg:pb-10">
        <Outlet />
      </main>

      {/* 모바일 하단 탭 */}
      <nav className="safe-b fixed inset-x-0 bottom-0 z-30 flex border-t border-bline bg-white shadow-bottombar lg:hidden">
        {[
          { to: '/admin', label: '대시보드', icon: '▦', end: true },
          { to: '/admin/leads', label: '관제', icon: '⚡' },
          { to: '/admin/tenants', label: '분양', icon: '🏪' },
          { to: '/admin/settlements', label: '정산', icon: '₩' },
          { to: '/admin/ai', label: 'AI', icon: '🤖' },
        ].map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-primary-text' : 'text-bfaint'}`}>
            <span className="text-[17px] leading-5">{m.icon}</span>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
