// ─── 트랙 B 본사 어드민(관제) 레이아웃 — 그룹형 IA 사이드바 + ⌘K 팔레트 ──
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, getSession } from '../../lib/store'
import { maskName } from '../../lib/engine'
import { unitName } from '../../lib/constants'
import { Logo, useToast } from '../ui'
import { IcGrid, IcCompass, IcStore, IcBox, IcClipboard, IcBolt, IcRobot, IcCoins, IcLock, IcBell, IcClock, IcAlert, IcSearch, IcUsers, IcMegaphone } from '../icons'

// 파생 알림 — 알림을 저장하지 않고 현재 상태에서 매번 계산한다 (axion 패턴).
// 읽음 처리는 내용 시그니처를 localStorage에 비교 저장 — 알림 테이블 없이 배지가 동작.
function buildNotifs(db) {
  const now = Date.now()
  const n = []
  const sla = db.leads.filter((l) => l.status === '접수' && now - l.createdAt > 10 * 60000).length
  if (sla) n.push({ icon: IcClock, cls: 'text-warn', text: `SLA 10분 초과 접수 리드 ${sla}건`, to: '/admin/leads' })
  const unassigned = db.leads.filter((l) => !l.tenantId && !['완료', '취소'].includes(l.status)).length
  if (unassigned) n.push({ icon: IcAlert, cls: 'text-warn', text: `미배정 리드 ${unassigned}건 — 재배정 필요`, to: '/admin/leads' })
  const apps = db.applications.filter((a) => a.status === '대기').length
  if (apps) n.push({ icon: IcStore, cls: 'text-primary-text', text: `분양 신청 승인 대기 ${apps}건`, to: '/admin/tenants' })
  return n
}

function NotifBell({ db }) {
  const [open, setOpen] = useState(false)
  const items = buildNotifs(db)
  const sig = items.map((i) => i.text).join('|')
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem('moduon_notif_sig') ?? '' } catch { return '' } })
  const unseen = items.length > 0 && sig !== seen
  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      try { localStorage.setItem('moduon_notif_sig', sig) } catch { /* noop */ }
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
            <div className="border-b border-bline px-4 py-3 text-[13px] font-bold text-bink">관제 알림</div>
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

// ⌘K 커맨드 팔레트 — 메뉴·분양몰·리드·액션을 한 입력으로 (세계급 SaaS 관제 UX)
function CommandPalette({ db, dispatch, open, onClose }) {
  const nav = useNavigate()
  const toast = useToast()
  const inputRef = useRef(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open])

  const items = useMemo(() => {
    const menu = GROUPS.flatMap((g) => g.items).map((m) => ({ type: '메뉴', label: m.label, hint: m.to, run: () => nav(m.to) }))
    const tenants = db.tenants.map((t) => ({ type: '분양몰', label: t.name, hint: `${unitName(t.unit)} · ${t.status}`, run: () => nav('/admin/tenants') }))
    const leads = db.leads.slice(0, 40).map((l) => ({ type: '리드', label: `${maskName(l.name)} · ${l.status}`, hint: l.sigungu, run: () => nav('/admin/leads') }))
    const actions = [
      { type: '액션', label: '데모 리드 1건 생성', hint: '관제 데모 피드', run: () => { dispatch({ type: 'SPAWN_DEMO_LEAD' }); toast('데모 리드를 생성했어요') } },
      { type: '액션', label: '오늘의 브리핑으로 이동', hint: 'AI 경영 브리핑', run: () => nav('/admin') },
    ]
    return [...menu, ...actions, ...tenants, ...leads]
  }, [db.tenants, db.leads]) // eslint-disable-line

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const hit = s ? items.filter((i) => (i.label + i.hint).toLowerCase().includes(s)) : items
    return hit.slice(0, 10)
  }, [q, items])

  const run = (i) => { const it = list[i]; if (!it) return; onClose(); it.run() }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="빠른 검색">
      <div className="absolute inset-0 bg-bink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute left-1/2 top-[16%] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-card bg-white shadow-panel">
        <div className="flex items-center gap-2.5 border-b border-bline px-4 py-3.5">
          <IcSearch size={16} className="shrink-0 text-bfaint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0) }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((v) => Math.min(v + 1, list.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((v) => Math.max(v - 1, 0)) }
              if (e.key === 'Enter') run(sel)
            }}
            placeholder="메뉴·분양몰·리드·액션 검색…"
            className="w-full bg-transparent text-[14.5px] font-semibold text-bink outline-none placeholder:text-bfaint"
          />
          <kbd className="rounded border border-bline px-1.5 py-0.5 text-[10px] font-bold text-bfaint">ESC</kbd>
        </div>
        <div className="max-h-[340px] overflow-y-auto py-1.5">
          {list.map((it, i) => (
            <button
              key={`${it.type}-${it.label}-${i}`}
              onClick={() => run(i)}
              onMouseEnter={() => setSel(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${i === sel ? 'bg-tint' : ''}`}
            >
              <span className={`w-[46px] shrink-0 rounded-md px-1.5 py-0.5 text-center text-[10px] font-extrabold ${it.type === '액션' ? 'bg-orange-tint text-orange-text' : it.type === '메뉴' ? 'bg-brow text-bmuted' : 'bg-tint text-primary-text'}`}>{it.type}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-bink">{it.label}</span>
              <span className="shrink-0 text-[11px] text-bfaint">{it.hint}</span>
            </button>
          ))}
          {list.length === 0 && <div className="px-4 py-6 text-center text-[12.5px] text-bfaint">"{q}" 검색 결과가 없어요</div>}
        </div>
        <div className="flex items-center justify-between border-t border-bline bg-brow/40 px-4 py-2 text-[10.5px] font-semibold text-bfaint">
          <span>↑↓ 이동 · Enter 실행</span><span>모두온 관제 커맨드</span>
        </div>
      </div>
    </div>
  )
}

const GROUPS = [
  { label: null, items: [{ to: '/admin', label: '통합 대시보드', icon: IcGrid, end: true }] },
  { label: '경영', items: [
    { to: '/admin/biz', label: '경영 전략', icon: IcCompass },
    { to: '/admin/press', label: '프레스룸', icon: IcMegaphone },
  ] },
  { label: '서비스 관리', items: [
    { to: '/admin/tenants', label: '분양몰 관리', icon: IcStore },
    { to: '/admin/products', label: '상품 관리', icon: IcBox },
    { to: '/admin/policies', label: '정책 관리', icon: IcClipboard },
  ]},
  { label: '리드 관제', items: [{ to: '/admin/leads', label: '리드 콘솔', icon: IcBolt }] },
  { label: 'AI 관리', items: [
    { to: '/admin/ai', label: 'AI 운영 현황', icon: IcRobot },
    { to: '/admin/persona-lab', label: '페르소나 랩', icon: IcUsers },
  ]},
  { label: '정산·수익', items: [{ to: '/admin/settlements', label: '정산·지급', icon: IcCoins }] },
  { label: '시스템', items: [{ to: '/admin/audit', label: '권한·감사 로그', icon: IcLock }] },
]

export default function AdminLayout() {
  const { db, dispatch } = useStore()
  const nav = useNavigate()
  const session = getSession()
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    if (!session || session.role !== 'admin') nav('/login?next=/admin', { replace: true })
  }, []) // eslint-disable-line

  // ⌘K / Ctrl+K — 어디서든 커맨드 팔레트
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
                  <span className="flex w-5 justify-center"><m.icon size={15} /></span>
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
          <div className="text-[12px] font-bold text-bink"><IcRobot size={14} className="inline -mt-0.5 mr-1" />AI 비서 모비</div>
          <p className="mt-1 text-[11px] leading-4 text-bmuted">자동 분류·인사이트가 실시간 반영 중입니다.</p>
          <NavLink to="/admin/ai" className="mt-2 inline-block text-[11px] font-bold text-primary-text">AI 운영 현황 →</NavLink>
        </div>
        <button onClick={() => nav('/login')} className="mx-3 mb-4 rounded-field border border-bline py-2 text-[12px] font-semibold text-bmuted hover:text-bink">
          역할 전환 / 로그아웃
        </button>
      </aside>

      <main className="px-4 pb-24 pt-5 sm:px-6 lg:ml-[224px] lg:pb-10">
        <div className="relative z-30 mb-2 flex items-center justify-end gap-2 lg:-mb-8">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-[12px] font-bold text-bmuted shadow-card transition-colors hover:bg-brow hover:text-bink"
            aria-label="빠른 검색 열기"
          >
            <IcSearch size={14} /> 검색 <kbd className="rounded border border-bline px-1.5 py-0.5 text-[9.5px] font-extrabold text-bfaint">⌘K</kbd>
          </button>
          <NotifBell db={db} />
        </div>
        <Outlet />
      </main>

      <CommandPalette db={db} dispatch={dispatch} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* 모바일 하단 탭 */}
      <nav className="safe-b fixed inset-x-0 bottom-0 z-30 flex border-t border-bline bg-white shadow-bottombar lg:hidden">
        {[
          { to: '/admin', label: '대시보드', icon: IcGrid, end: true },
          { to: '/admin/leads', label: '관제', icon: IcBolt },
          { to: '/admin/tenants', label: '분양', icon: IcStore },
          { to: '/admin/settlements', label: '정산', icon: IcCoins },
          { to: '/admin/ai', label: 'AI', icon: IcRobot },
        ].map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-primary-text' : 'text-bfaint'}`}>
            <span className="flex h-5 items-center"><m.icon size={17} /></span>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
