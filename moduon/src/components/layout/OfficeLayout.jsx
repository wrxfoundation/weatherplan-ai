// ─── 트랙 B 파트너 마이오피스 레이아웃 (사이드바 224px / 모바일 하단 탭) ──
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useStore, getSession, tenantLeads } from '../../lib/store'
import { unitName, BRAND_PRESETS } from '../../lib/constants'
import { IcGrid, IcBolt, IcUsers, IcCoins, IcFolder, IcGear, IcRobot, IcBell, IcClock, IcCalendar, IcMegaphone, IcChart } from '../icons'

// 파생 알림(셀러) — AdminLayout의 NotifBell과 동일 패턴: 저장 없이 현재 상태에서 매번 계산,
// 읽음 처리는 내용 시그니처를 localStorage(moduon_office_notif_sig)에 비교 저장.
function buildOfficeNotifs(db, tenant) {
  const now = Date.now()
  const n = []
  const mine = db.leads.filter((l) => l.tenantId === tenant.id)
  const sla = mine.filter((l) => l.status === '접수' && now - l.createdAt > 10 * 60000).length
  if (sla) n.push({ icon: IcClock, cls: 'text-warn', text: `SLA 10분 초과 접수 리드 ${sla}건`, to: '/office/leads' })
  const expiring = (db.contracts ?? []).filter((c) => c.tenantId === tenant.id && c.expiry > now && c.expiry - now < 14 * 86400000).length
  if (expiring) n.push({ icon: IcCalendar, cls: 'text-warn', text: `14일 내 만기 계약 ${expiring}건`, to: '/office/customers' })
  const notice = (db.notices ?? []).filter((x) => x.target === 'office').sort((a, b) => b.at - a.at)[0]
  if (notice) n.push({ icon: IcMegaphone, cls: 'text-primary-text', text: notice.title.length > 36 ? `${notice.title.slice(0, 36)}…` : notice.title, to: '/office/resources' })
  return n
}

function OfficeNotifBell({ db, tenant }) {
  const [open, setOpen] = useState(false)
  const items = buildOfficeNotifs(db, tenant)
  const sig = items.map((i) => i.text).join('|')
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem('moduon_office_notif_sig') ?? '' } catch { return '' } })
  const unseen = items.length > 0 && sig !== seen
  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      try { localStorage.setItem('moduon_office_notif_sig', sig) } catch { /* noop */ }
      setSeen(sig)
    }
  }
  return (
    <div className="relative">
      <button onClick={toggle} aria-label="알림" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card transition-colors hover:bg-brow">
        <IcBell size={16} />
        {unseen && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warn" />}
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bink px-1 text-[10.5px] font-bold text-white">{items.length}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-[300px] overflow-hidden rounded-card bg-white shadow-panel">
            <div className="border-b border-bline px-4 py-3 text-[13px] font-bold text-bink">내 몰 알림</div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12.5px] text-bfaint">처리할 알림이 없어요 ✨</div>
            ) : (
              items.map((i) => (
                <NavLink key={i.text} to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-bline px-4 py-3 text-[13px] font-semibold text-bbody last:border-0 hover:bg-brow">
                  <i.icon size={15} className={`shrink-0 ${i.cls}`} />
                  <span className="flex-1">{i.text}</span>
                  <span className="text-bfaint">→</span>
                </NavLink>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

const MENU = [
  { to: '/office', label: '대시보드', icon: IcGrid, end: true },
  { to: '/office/leads', label: '리드', icon: IcBolt, badge: true },
  { to: '/office/customers', label: '고객', icon: IcUsers },
  { to: '/office/design', label: '수당 설계', icon: IcChart },
  { to: '/office/marketing', label: '마케팅', icon: IcMegaphone },
  { to: '/office/settlement', label: '정산', icon: IcCoins },
  { to: '/office/resources', label: '자료실', icon: IcFolder },
  { to: '/office/setup', label: '내 몰 설정', icon: IcGear },
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
              <span className="flex w-5 justify-center"><m.icon size={15} /></span>
              {m.label}
              {m.badge && newCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">{newCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-card bg-brow p-4">
          <div className="text-[12px] font-bold text-bink"><IcRobot size={14} className="inline -mt-0.5 mr-1" />AI 비서 모비</div>
          <p className="mt-1 text-[11px] leading-4 text-bmuted">스크립트 작성·리드 요약을 도와드려요. 소비자몰 챗봇에서 만나보세요.</p>
          <Link to="/" className="mt-2 inline-block text-[11px] font-bold text-primary-text">내 몰 보기 →</Link>
        </div>
        <button onClick={() => { nav('/login') }} className="mx-3 mb-4 rounded-field border border-bline py-2 text-[12px] font-semibold text-bmuted hover:text-bink">
          역할 전환 / 로그아웃
        </button>
      </aside>

      <main className="px-4 pb-24 pt-5 sm:px-6 lg:ml-[224px] lg:pb-10">
        <div className="relative z-30 mb-2 flex justify-end lg:-mb-8">
          <OfficeNotifBell db={db} tenant={tenant} />
        </div>
        <Outlet context={{ tenant }} />
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="safe-b fixed inset-x-0 bottom-0 z-30 flex border-t border-bline bg-white shadow-bottombar lg:hidden">
        {MENU.slice(0, 4).map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-primary-text' : 'text-bfaint'}`}>
            <span className="flex h-5 items-center"><m.icon size={17} /></span>
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
