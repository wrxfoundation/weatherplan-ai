// ─── P-04 리드 인박스 전체 (검색·필터·모바일 완결) ────────────────
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore, tenantLeads } from '../../lib/store'
import { LEAD_STATUS } from '../../lib/constants'
import { Card, LiveDot, useToast, binputCls } from '../../components/ui'
import { LeadRow, LeadDrawer } from '../../components/leads'

export default function OfficeLeads() {
  const { tenant } = useOutletContext()
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState('전체')
  const [q, setQ] = useState('')
  const [openLead, setOpenLead] = useState(null)

  const leads = useMemo(() => tenantLeads(db, tenant.id).sort((a, b) => b.createdAt - a.createdAt), [db, tenant.id])
  const filtered = leads
    .filter((l) => filter === '전체' || l.status === filter)
    .filter((l) => !q || l.name.includes(q) || l.sigungu.includes(q) || l.phone.includes(q))
  const live = db.leads.find((l) => l.id === openLead?.id) ?? null

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-extrabold text-bink">리드 인박스</h1>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-ok"><LiveDot /> 실시간 수신 중</span>
        </div>
        <button
          onClick={() => { dispatch({ type: 'SPAWN_DEMO_LEAD', tenantId: tenant.id }); toast('데모 리드가 도착했어요! ⚡') }}
          className="h-9 rounded-full bg-tint px-4 text-[12.5px] font-bold text-primary-text hover:bg-primary hover:text-white"
        >
          + 데모 리드 받아보기
        </button>
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
            {['전체', ...LEAD_STATUS].map((s) => {
              const count = s === '전체' ? leads.length : leads.filter((l) => l.status === s).length
              return (
                <button key={s} onClick={() => setFilter(s)} className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] font-bold transition-colors ${filter === s ? 'bg-bink text-white' : 'bg-brow text-bbody hover:bg-bline'}`}>
                  {s} <span className={`tnum ${filter === s ? 'text-white/70' : 'text-bfaint'}`}>{count}</span>
                </button>
              )
            })}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·지역·연락처 검색" className={`${binputCls} sm:w-56`} />
        </div>
        <div className="border-t border-brow">
          {filtered.map((l) => <LeadRow key={l.id} lead={l} onOpen={() => setOpenLead(l)} />)}
          {filtered.length === 0 && <div className="py-12 text-center text-[13px] text-bfaint">해당 상태의 리드가 없습니다</div>}
        </div>
      </Card>

      <LeadDrawer lead={live} onClose={() => setOpenLead(null)} by={tenant.id} />
    </div>
  )
}
