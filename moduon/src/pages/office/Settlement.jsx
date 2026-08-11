// ─── P-05 정산 대시보드 — "월말이 아니라 매일 보인다" ─────────────
import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore, tenantSettlement } from '../../lib/store'
import { won, fmtDateTime, downloadCSV, monthKey } from '../../lib/engine'
import { catBySlug } from '../../lib/constants'
import { Card, KpiCard, Btn, useToast } from '../../components/ui'
import { LineChart } from '../../components/charts'

export default function OfficeSettlement() {
  const { tenant } = useOutletContext()
  const { db } = useStore()
  const toast = useToast()
  const s = useMemo(() => tenantSettlement(db, tenant.id), [db, tenant.id])

  // 최근 7일 일별 확정 수익(데모 곡선 + 실데이터 가중)
  const daily = useMemo(() => {
    const base = [420, 380, 610, 540, 720, 660, 810]
    return base.map((v) => Math.round(v * 1000 * (1 + s.doneCount * 0.05)))
  }, [s.doneCount])
  const labels = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  const exportCsv = () => {
    downloadCSV(`모두온_정산명세_${tenant.slug}_${monthKey()}.csv`, [
      ['구분', '금액(원)'],
      ['몰 매출(수수료 대상)', s.gross],
      [`운영 수수료(${Math.round(db.policies.feeRate * 100)}%)`, -s.fee],
      ['월 이용료', -s.monthlyFee],
      ['파트너 순수익', s.net],
      [],
      ['건별 명세', ''],
      ['리드 ID', '고객', '카테고리', '매출', '수수료', '일시'],
      ...s.lines.map((l) => [l.id, l.name, catBySlug(l.cat)?.name, l.amount, l.fee, fmtDateTime(l.at)]),
    ])
    toast('정산 명세 CSV를 내려받았어요')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">정산 대시보드</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">{monthKey()} 집계 · 익월 20일 지급 · 어드민 집계와 원단위 일치</p>
        </div>
        <Btn variant="boutline" size="sm" onClick={exportCsv}>CSV 내보내기</Btn>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="몰 매출 (수수료 대상)" value={s.gross} suffix="원" />
        <KpiCard label={`운영 수수료 (${Math.round(db.policies.feeRate * 100)}%)`} value={s.fee} format={(n) => `−${n.toLocaleString('ko-KR')}`} suffix="원" accent="text-danger" />
        <KpiCard label="월 이용료" value={s.monthlyFee} format={(n) => `−${n.toLocaleString('ko-KR')}`} suffix="원" accent="text-danger" />
        <KpiCard label="파트너 순수익" value={Math.max(0, s.net)} suffix="원" accent="text-primary-text" caption="매출 − 수수료 − 이용료" />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Card track="b" className="p-5">
          <h2 className="text-[15.5px] font-extrabold text-bink">최근 7일 일별 확정 수익</h2>
          <div className="mt-4">
            <LineChart series={[{ label: '일 확정 수익', color: '#5377D6', values: daily, fill: true }]} labels={labels} />
          </div>
        </Card>

        <Card track="b" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">건별 수수료 명세</h2>
            <span className="tnum text-[12px] font-bold text-bfaint">{s.lines.length}건</span>
          </div>
          <div className="mt-3 border-t border-brow">
            {s.lines.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-brow px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brow">
                  <img src={catBySlug(l.cat)?.icon} alt="" className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="pii truncate text-[13px] font-bold text-bink">{l.name} · {catBySlug(l.cat)?.name}</div>
                  <div className="tnum text-[11.5px] text-bfaint">매출 {won(l.amount)} · {fmtDateTime(l.at)}</div>
                </div>
                <span className="tnum text-[13.5px] font-extrabold text-ok">+{won(l.fee)}</span>
              </div>
            ))}
            {s.lines.length === 0 && <div className="py-10 text-center text-[13px] text-bfaint">이번 달 완료 건이 아직 없어요<br /><span className="text-[11.5px]">리드를 "완료"로 처리하면 즉시 반영됩니다</span></div>}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-[11.5px] text-bfaint">취소·환불 건은 익월 정산에서 차감되며 모든 조정 이력이 보존됩니다. 정산 기준: 매월 1일~말일 집계, 익월 20일 지급.</p>
    </div>
  )
}
