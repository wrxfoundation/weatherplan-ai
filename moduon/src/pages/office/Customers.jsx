// ─── P-06 고객 관리 (약정 만기 D-day 락인) ───────────────────────
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { won, maskPhone, dday, fmtDate } from '../../lib/engine'
import { Card, useToast, EmptyState } from '../../components/ui'

export default function OfficeCustomers() {
  const { tenant } = useOutletContext()
  const { db } = useStore()
  const toast = useToast()
  const contracts = db.contracts.filter((c) => c.tenantId === tenant.id).sort((a, b) => a.expiry - b.expiry)

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">고객 관리 · 만기 D-day</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">만기 90일 전 자동 재상담 캠페인으로 고객을 락인하세요. 재계약도 새 수수료로 정산됩니다.</p>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="hidden grid-cols-[90px_1fr_1fr_110px_110px_120px] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted sm:grid">
          <span>D-day</span><span>고객</span><span>계약 상품</span><span>계약 금액</span><span>만기일</span><span>액션</span>
        </div>
        {contracts.map((c) => {
          const dd = dday(c.expiry)
          const tone = dd <= 14 ? 'bg-warn/10 text-warn' : dd <= 30 ? 'bg-tint text-primary-text' : 'bg-brow text-bmuted'
          return (
            <div key={c.id} className="grid grid-cols-[auto_1fr] items-center gap-2 border-b border-brow px-4 py-3.5 sm:grid-cols-[90px_1fr_1fr_110px_110px_120px] sm:px-5">
              <span className={`tnum w-fit rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${tone}`}>D-{dd}</span>
              <div>
                <div className="text-[13.5px] font-bold text-bink">{c.customer}</div>
                <div className="tnum text-[11.5px] text-bfaint">{maskPhone(c.phone)}</div>
              </div>
              <span className="col-span-2 text-[12.5px] text-bbody sm:col-span-1">{c.product}</span>
              <span className="tnum hidden text-[12.5px] font-semibold text-bink sm:block">{won(c.amount)}</span>
              <span className="hidden text-[12.5px] text-bmuted sm:block">{fmtDate(c.expiry)}</span>
              <div className="col-span-2 flex gap-1.5 sm:col-span-1">
                <button onClick={() => toast(`${c.customer} 고객에게 재상담 알림톡을 보냈어요`)} className="h-8 flex-1 rounded-full bg-tint px-3 text-[11.5px] font-bold text-primary-text hover:bg-primary hover:text-white sm:flex-none">
                  재상담 제안
                </button>
                <a href={`tel:${c.phone}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-brow text-[12px] hover:bg-bline">📞</a>
              </div>
            </div>
          )
        })}
        {contracts.length === 0 && <EmptyState icon="🗂️" text="아직 계약 고객이 없어요" sub="리드를 완료 처리하면 고객 목록이 쌓입니다" />}
      </Card>

      <Card track="b" className="mt-4 flex items-center gap-4 p-5">
        <span className="text-[26px]">🤖</span>
        <div className="flex-1">
          <div className="text-[13.5px] font-bold text-bink">AI 자동 캠페인이 켜져 있어요</div>
          <p className="text-[12px] text-bmuted">만기 90일 전 고객에게 재상담 알림톡이 자동 발송되고, 응답하면 리드로 재접수됩니다.</p>
        </div>
        <span className="rounded-full bg-ok/10 px-3 py-1 text-[11.5px] font-bold text-ok">ON</span>
      </Card>
    </div>
  )
}
