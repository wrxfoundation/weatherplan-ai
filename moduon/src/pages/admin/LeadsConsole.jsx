// ─── A-04 리드 관제 콘솔 — 전체 스트림·퍼널·수동 재배정·SLA 감시 ──
import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { LEAD_STATUS, STATUS_COLOR } from '../../lib/constants'
import { minutesAgo } from '../../lib/engine'
import { Card, LiveDot, useToast, binputCls } from '../../components/ui'
import { HBars } from '../../components/charts'
import { LeadRow, LeadDrawer } from '../../components/leads'

export default function AdminLeadsConsole() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState('전체')
  const [q, setQ] = useState('')
  const [openLead, setOpenLead] = useState(null)

  const leads = useMemo(() => [...db.leads].sort((a, b) => b.createdAt - a.createdAt), [db.leads])
  const today = leads.filter((l) => Date.now() - l.createdAt < 86400000)
  const unassigned = leads.filter((l) => !l.tenantId && !['완료', '취소'].includes(l.status))
  const slaBreach = leads.filter((l) => l.status === '접수' && minutesAgo(l.createdAt) >= 10)
  const done = leads.filter((l) => l.status === '완료')
  const conv = leads.length ? Math.round((done.length / leads.length) * 100) : 0

  const funnel = LEAD_STATUS.map((s) => ({ label: s, value: leads.filter((l) => l.status === s).length, color: STATUS_COLOR[s] }))
  const filtered = leads
    .filter((l) => (filter === '전체' ? true : filter === '미배정' ? !l.tenantId : l.status === filter))
    .filter((l) => !q || l.name.includes(q) || l.sigungu.includes(q))
  const live = db.leads.find((l) => l.id === openLead?.id) ?? null

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-extrabold text-bink">리드 관제 콘솔</h1>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-ok"><LiveDot /> 전 권역 실시간</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-bold text-bbody shadow-bcard">
            <input type="checkbox" checked={db.demoFeed} onChange={(e) => dispatch({ type: 'DEMO_FEED', on: e.target.checked })} className="accent-primary" />
            데모 리드 자동 유입
          </label>
          <button onClick={() => { dispatch({ type: 'SPAWN_DEMO_LEAD' }); toast('리드가 유입되어 권역 규칙으로 배정됐어요 ⚡') }} className="h-9 rounded-full bg-tint px-4 text-[12.5px] font-bold text-primary-text hover:bg-primary hover:text-white">
            + 리드 유입 시뮬레이션
          </button>
        </div>
      </div>

      {/* 관제 KPI */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">오늘 유입</div><div className="tnum mt-1 text-[24px] font-extrabold text-bink">{today.length}<span className="text-[14px]">건</span></div></Card>
        <Card track="b" className={`p-4 ${slaBreach.length ? 'ring-1 ring-warn/40' : ''}`}>
          <div className="text-[12px] text-bmuted">SLA 10분 초과</div>
          <div className={`tnum mt-1 text-[24px] font-extrabold ${slaBreach.length ? 'text-warn' : 'text-bink'}`}>{slaBreach.length}<span className="text-[14px]">건</span></div>
          {slaBreach.length > 0 && <div className="text-[11px] font-semibold text-warn">파트너 재알림 발송됨 · 60분 시 관리단 이관</div>}
        </Card>
        <Card track="b" className={`p-4 ${unassigned.length ? 'ring-1 ring-danger/30' : ''}`}>
          <div className="text-[12px] text-bmuted">미배정 (폴백)</div>
          <div className={`tnum mt-1 text-[24px] font-extrabold ${unassigned.length ? 'text-danger' : 'text-bink'}`}>{unassigned.length}<span className="text-[14px]">건</span></div>
          {unassigned.length > 0 && <div className="text-[11px] font-semibold text-danger">권역 공석 — 수동 배정 필요</div>}
        </Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">누적 전환율</div><div className="tnum mt-1 text-[24px] font-extrabold text-ok">{conv}%</div><div className="text-[11px] text-bfaint">완료 {done.length} / 전체 {leads.length}</div></Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[2fr_5fr]">
        {/* 상태 퍼널 */}
        <Card track="b" className="p-5">
          <h2 className="text-[14.5px] font-extrabold text-bink">상태 퍼널</h2>
          <div className="mt-3"><HBars data={funnel} format={(v) => `${v}건`} /></div>
          <p className="mt-3 text-[11px] leading-4 text-bfaint">배정 규칙: ①파트너몰 유입 → 해당 파트너 ②본진 유입 → 주소지 권역 파트너 ③공석 → 관리단 → 본사. 규칙은 어드민에서 조정 가능(코드 수정 없음).</p>
        </Card>

        {/* 전체 리드 스트림 */}
        <Card track="b" className="overflow-hidden">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
              {['전체', '미배정', ...LEAD_STATUS].map((s) => {
                const count = s === '전체' ? leads.length : s === '미배정' ? unassigned.length : leads.filter((l) => l.status === s).length
                return (
                  <button key={s} onClick={() => setFilter(s)} className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-bold transition-colors ${filter === s ? 'bg-bink text-white' : 'bg-brow text-bbody hover:bg-bline'}`}>
                    {s} <span className={`tnum ${filter === s ? 'text-white/70' : 'text-bfaint'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·지역 검색" className={`${binputCls} sm:w-44`} />
          </div>
          <div className="border-t border-brow">
            {filtered.slice(0, 14).map((l) => (
              <LeadRow key={l.id} lead={l} onOpen={() => setOpenLead(l)} showTenant tenants={db.tenants} />
            ))}
            {filtered.length === 0 && <div className="py-12 text-center text-[13px] text-bfaint">해당 조건의 리드가 없습니다</div>}
          </div>
        </Card>
      </div>

      <LeadDrawer lead={live} onClose={() => setOpenLead(null)} by="본사 관리자" tenants={db.tenants} allowReassign />
    </div>
  )
}
