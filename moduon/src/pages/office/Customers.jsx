// ─── P-06 고객 관리 · 가망고객 (약정 만기 D-day 락인 — 주다 벤치마크) ──
// 잔여개월수 기준 / 위약금 기준 정렬로 재상담 우선순위를 잡는다.
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { won, maskPhone, dday, fmtDate, timeAgo } from '../../lib/engine'
import { Card, useToast, EmptyState } from '../../components/ui'
import { IcPhone, IcFolder } from '../../components/icons'

export default function OfficeCustomers() {
  const { tenant } = useOutletContext()
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [sortBy, setSortBy] = useState('remain') // remain=잔여개월수 | penalty=위약금

  const contracts = useMemo(() => {
    const list = db.contracts.filter((c) => c.tenantId === tenant.id)
      .map((c) => ({ ...c, dd: dday(c.expiry), remain: Math.max(0, Math.ceil(dday(c.expiry) / 30)) }))
    return list.sort((a, b) => (sortBy === 'remain' ? a.dd - b.dd : (b.penalty ?? 0) - (a.penalty ?? 0)))
  }, [db.contracts, tenant.id, sortBy])

  const soon = contracts.filter((c) => c.dd <= 30).length
  const lowPenalty = contracts.filter((c) => (c.penalty ?? 0) <= 50000).length

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">고객 관리 · 가망고객</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">약정 만기 D-day와 위약금을 기준으로 재상담 우선순위를 잡으세요. 만기 90일 전 자동 캠페인이 돌고 있어요.</p>
        </div>
        {/* 주다식 가망고객 정렬 토글 */}
        <div className="inline-flex rounded-full bg-white p-1 shadow-bcard">
          {[{ k: 'remain', l: '잔여개월수 기준' }, { k: 'penalty', l: '위약금 기준' }].map((s) => (
            <button key={s.k} onClick={() => setSortBy(s.k)} className={`h-8 rounded-full px-3.5 text-[12px] font-bold transition-colors ${sortBy === s.k ? 'bg-bink text-white' : 'text-bbody hover:text-bink'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">관리 고객</div><div className="tnum mt-1 text-[22px] font-extrabold text-bink">{contracts.length}<span className="text-[13px]">명</span></div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">30일 내 만기</div><div className="tnum mt-1 text-[22px] font-extrabold text-warn">{soon}<span className="text-[13px]">명</span></div><div className="text-[11px] text-bfaint">지금 연락할 골든타임</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">위약금 5만원 이하</div><div className="tnum mt-1 text-[22px] font-extrabold text-ok">{lowPenalty}<span className="text-[13px]">명</span></div><div className="text-[11px] text-bfaint">전환 장벽 낮음 — 우선 제안</div></Card>
        <Card track="b" className="p-4"><div className="text-[12px] text-bmuted">자동 캠페인</div><div className="mt-1 text-[15px] font-extrabold text-ok">만기 90일 전 ON</div><div className="text-[11px] text-bfaint">응답 시 리드로 재접수</div></Card>
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="hidden grid-cols-[80px_1fr_1.2fr_90px_100px_100px_130px] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid">
          <span>D-day</span><span>고객</span><span>계약 상품</span><span>잔여개월</span><span>위약금 추정</span><span>만기일</span><span>액션</span>
        </div>
        {contracts.map((c) => {
          const tone = c.dd <= 14 ? 'bg-warn/10 text-warn' : c.dd <= 30 ? 'bg-tint text-primary-text' : 'bg-brow text-bmuted'
          const penaltyTone = (c.penalty ?? 0) === 0 ? 'text-ok' : (c.penalty ?? 0) <= 50000 ? 'text-ok' : 'text-danger'
          return (
            <div key={c.id} className="grid grid-cols-[auto_1fr] items-center gap-2 border-b border-brow px-4 py-3.5 lg:grid-cols-[80px_1fr_1.2fr_90px_100px_100px_130px] lg:px-5">
              <span className={`tnum w-fit rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${tone}`}>D-{c.dd}</span>
              <div>
                <div className="text-[13.5px] font-bold text-bink">{c.customer}</div>
                <div className="tnum text-[11.5px] text-bfaint">{maskPhone(c.phone)}</div>
                {c.lastTouch && <div className="mt-0.5 text-[10.5px] font-semibold text-ok">{c.lastTouch.kind} 발송 · {timeAgo(c.lastTouch.at)}</div>}
              </div>
              <span className="col-span-2 text-[12.5px] text-bbody lg:col-span-1">{c.product}</span>
              <span className="tnum hidden text-[12.5px] font-bold text-bink lg:block">{c.remain}개월</span>
              <span className={`tnum hidden text-[12.5px] font-bold lg:block ${penaltyTone}`}>{(c.penalty ?? 0) === 0 ? '없음' : won(c.penalty)}</span>
              <span className="hidden text-[12.5px] text-bmuted lg:block">{fmtDate(c.expiry)}</span>
              <div className="col-span-2 flex gap-1.5 lg:col-span-1">
                <button onClick={() => { dispatch({ type: 'CONTRACT_TOUCH', payload: { id: c.id, kind: '재상담 제안', by: tenant.id } }); toast(`${c.customer} 고객에게 재상담 알림톡을 보냈어요`) }} className="h-8 flex-1 rounded-full bg-tint px-3 text-[11.5px] font-bold text-primary-text hover:bg-primary hover:text-white lg:flex-none">
                  재상담 제안
                </button>
                <a href={`tel:${c.phone}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-brow text-bbody hover:bg-bline"><IcPhone size={14} /></a>
              </div>
            </div>
          )
        })}
        {contracts.length === 0 && <EmptyState icon={<IcFolder size={30} className="text-bfaint" />} text="아직 계약 고객이 없어요" sub="리드를 완료 처리하면 고객 목록이 쌓입니다" />}
      </Card>

      <p className="mt-3 text-[11.5px] text-bfaint">위약금은 지원금 반환금 기준 추정치로, 정확한 금액은 통신사 확인이 필요합니다. 위약금이 낮고 만기가 가까운 고객부터 제안하면 전환율이 높아요.</p>
    </div>
  )
}
