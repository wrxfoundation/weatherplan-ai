// ─── S-24 정산·지급 — 파트너별 테이블 · 일괄 확정 · CSV (멱등 AC) ──
import { useMemo, useState } from 'react'
import { useStore, tenantSettlement } from '../../lib/store'
import { won, downloadCSV, monthKey } from '../../lib/engine'
import { unitName } from '../../lib/constants'
import { Card, Btn, KpiCard, useToast } from '../../components/ui'

export default function AdminSettlements() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [confirmed, setConfirmed] = useState({}) // {tenantId: true} — 이번 세션 지급 확정 표시

  const rows = useMemo(() =>
    db.tenants.filter((t) => t.status === '활성').map((t) => ({ tenant: t, s: tenantSettlement(db, t.id) })),
  [db])

  const totals = rows.reduce((acc, r) => ({
    gross: acc.gross + r.s.gross, fee: acc.fee + r.s.fee, monthly: acc.monthly + r.s.monthlyFee, net: acc.net + Math.max(0, r.s.net),
  }), { gross: 0, fee: 0, monthly: 0, net: 0 })

  const confirmAll = () => {
    const all = {}
    rows.forEach((r) => { all[r.tenant.id] = true })
    setConfirmed(all)
    dispatch({ type: 'SETTLE_CONFIRM', period: monthKey(), detail: `파트너 ${rows.length}곳 · 총 지급 ${won(totals.net)}` })
    toast(`${monthKey()} 정산 일괄 확정 — 파트너 화면·CSV와 원단위 일치`)
  }

  const exportCsv = () => {
    downloadCSV(`모두온_월정산_${monthKey()}.csv`, [
      ['파트너', 'slug', '권역', '몰 매출', `수수료(${Math.round(db.policies.feeRate * 100)}%)`, '월 이용료', '순지급액', '상태'],
      ...rows.map((r) => [r.tenant.name, r.tenant.slug, unitName(r.tenant.unit), r.s.gross, r.s.fee, r.s.monthlyFee, Math.max(0, r.s.net), confirmed[r.tenant.id] ? '지급 확정' : '대기']),
      ['합계', '', '', totals.gross, totals.fee, totals.monthly, totals.net, ''],
    ])
    toast('정산서 CSV를 내려받았어요')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">정산 · 지급</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">{monthKey()} 집계 (매월 1일~말일 · 익월 20일 지급) — 배치 재실행 시 결과 동일(멱등)</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="boutline" size="sm" onClick={exportCsv}>CSV 내보내기</Btn>
          <Btn size="sm" onClick={confirmAll}>일괄 지급 확정</Btn>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="수수료 대상 매출 합계" value={totals.gross} suffix="원" />
        <KpiCard label={`운영 수수료 수입 (${Math.round(db.policies.feeRate * 100)}%)`} value={totals.fee} suffix="원" accent="text-ok" />
        <KpiCard label="월 이용료 수입" value={totals.monthly} suffix="원" accent="text-ok" />
        <KpiCard label="파트너 순지급 총액" value={totals.net} suffix="원" accent="text-primary-text" />
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="hidden grid-cols-[1.3fr_0.8fr_1fr_1fr_0.9fr_1fr_0.9fr] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid">
          <span>파트너</span><span>권역</span><span>몰 매출</span><span>수수료</span><span>이용료</span><span>순지급액</span><span>상태</span>
        </div>
        {rows.map(({ tenant, s }) => (
          <div key={tenant.id} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3.5 lg:grid-cols-[1.3fr_0.8fr_1fr_1fr_0.9fr_1fr_0.9fr] lg:px-5">
            <div>
              <div className="text-[13.5px] font-bold text-bink">{tenant.name}</div>
              <div className="text-[11.5px] text-bfaint">/m/{tenant.slug} <span className="lg:hidden">· {unitName(tenant.unit)}</span></div>
            </div>
            <span className="hidden text-[12.5px] text-bbody lg:block">{unitName(tenant.unit)}</span>
            <span className="tnum hidden text-[12.5px] text-bbody lg:block">{won(s.gross)}</span>
            <span className="tnum hidden text-[12.5px] text-danger lg:block">−{won(s.fee)}</span>
            <span className="tnum hidden text-[12.5px] text-danger lg:block">−{won(s.monthlyFee)}</span>
            <span className="tnum text-[13.5px] font-extrabold text-primary-text">{won(Math.max(0, s.net))}</span>
            <span className="col-span-2 flex lg:col-span-1">
              {confirmed[tenant.id]
                ? <span className="rounded-full bg-ok/10 px-2.5 py-1 text-[11.5px] font-bold text-ok">지급 확정</span>
                : (
                  <button
                    onClick={() => { setConfirmed((c) => ({ ...c, [tenant.id]: true })); dispatch({ type: 'SETTLE_CONFIRM', period: monthKey(), detail: `${tenant.name} ${won(Math.max(0, s.net))}` }); toast(`${tenant.name} 지급 확정`) }}
                    className="rounded-full bg-warn/10 px-2.5 py-1 text-[11.5px] font-bold text-warn hover:bg-warn hover:text-white"
                  >
                    대기 → 확정
                  </button>
                )}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] gap-2 bg-brow/40 px-5 py-3.5 lg:grid-cols-[1.3fr_0.8fr_1fr_1fr_0.9fr_1fr_0.9fr]">
          <span className="text-[13px] font-extrabold text-bink">합계 ({rows.length}개 몰)</span>
          <span className="hidden lg:block" />
          <span className="tnum hidden text-[12.5px] font-bold text-bink lg:block">{won(totals.gross)}</span>
          <span className="tnum hidden text-[12.5px] font-bold text-danger lg:block">−{won(totals.fee)}</span>
          <span className="tnum hidden text-[12.5px] font-bold text-danger lg:block">−{won(totals.monthly)}</span>
          <span className="tnum text-[13.5px] font-extrabold text-primary-text">{won(totals.net)}</span>
          <span className="hidden lg:block" />
        </div>
      </Card>

      <p className="mt-3 text-[11.5px] leading-5 text-bfaint">
        정산 산식: 순지급액 = 몰 매출 − 운영 수수료({Math.round(db.policies.feeRate * 100)}%) − 월 이용료({won(db.policies.monthlyFee)}). 취소·환불은 익월 차감, 조정 이력 전수 보존. 파트너 화면·어드민·CSV 3자 원단위 일치(AC).
      </p>
    </div>
  )
}
