// ─── 트랙 B 파트너 마이오피스 레이아웃 (사이드바 224px / 모바일 하단 탭) ──
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useStore, getSession, tenantLeads } from '../../lib/store'
import { unitName, BRAND_PRESETS } from '../../lib/constants'

const MENU = [
  { to: '/office', label: '대시보드', icon: '▦', end: true },
  { to: '/office/leads', label: '리드', icon: '⚡', badge: true },
  { to: '/office/customers', label: '고객', icon: '👥' },
  { to: '/office/settlement', label: '정산', icon: '₩' },
  { to: '/office/resources', label: '자료실', icon: '📁' },
  { to: '/office/setup', label: '내 몰 설정', icon: '⚙' },
]

export default function OfficeLayout() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (!session || session.role !== 'partner') nav('/login?next=/office', { replace: true })
  }, []) // eslint-disable-line

  const tenant = db.tenants.find((t) => t.id === session?.tenantId)

  // 데모 실시간 리드: 마이오피스를 보는 동안 40~70초 간격으로 새 리드 유입
  useEffect(() => {
    if (!tenant || !db.demoFeed) return
    const t = setInterval(() => {
      if (Math.random() < 0.55) dispatch({ type: 'SPAWN_DEMO_LEAD', tenantId: tenant.id })
    }, 40000 + Math.random() * 30000)
    return () => clearInterval(t)
  }, [tenant?.id, db.demoFeed]) // eslint-disable-line

  const newCount = useMemo(() => (tenant ? tenantLeads(db, tenant.id).filter((l) => !l.read).length : 0), [db, tenant])

  if (!session || session.role !== 'partner') return null
  if (!tenant) return null
  const brand = BRAND_PRESETS.find((b) => b.key === tenant.brand)?.color ?? '#5377D6'

  return (
    <div className="min-h-screen bg-bbg">
      {/* 사이드바 (≥1024px) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-bline bg-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${brand}, #7D8EE8)` }}>
            {tenant.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-extrabold text-bink">{tenant.name}</div>
            <div className="text-[11px] text-bfaint">{unitName(tenant.unit)} · {tenant.owner} 사장님</div>
          </div>
        </div>
        <nav className="flex-1 px-3">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-field px-3 py-2.5 text-[14px] font-semibold transition-colors ${isActive ? 'bg-tint text-primary-text' : 'text-bbody hover:bg-brow'}`}
            >
              <span className="w-5 text-center">{m.icon}</span>
              {m.label}
              {m.badge && newCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{newCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-card bg-brow p-4">
          <div className="text-[12px] font-bold text-bink">🤖 AI 비서 모비</div>
          <p className="mt-1 text-[11px] leading-4 text-bmuted">스크립트 작성·리드 요약을 도와드려요. 소비자몰 챗봇에서 만나보세요.</p>
          <Link to="/" className="mt-2 inline-block text-[11px] font-bold text-primary-text">내 몰 보기 →</Link>
        </div>
        <button onClick={() => { nav('/login') }} className="mx-3 mb-4 rounded-field border border-bline py-2 text-[12px] font-semibold text-bmuted hover:text-bink">
          역할 전환 / 로그아웃
        </button>
      </aside>

      <main className="px-4 pb-24 pt-5 sm:px-6 lg:ml-[224px] lg:pb-10">
        <Outlet context={{ tenant }} />
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-bline bg-white shadow-bottombar lg:hidden">
        {MENU.slice(0, 4).map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-primary-text' : 'text-bfaint'}`}>
            <span className="text-[17px] leading-5">{m.icon}</span>
            {m.label}
            {m.badge && newCount > 0 && <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-danger" />}
          </NavLink>
        ))}
        <NavLink to="/office/setup" className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-primary-text' : 'text-bfaint'}`}>
          <span className="text-[17px] leading-5">⋯</span>더보기
        </NavLink>
      </nav>
    </div>
  )
}
