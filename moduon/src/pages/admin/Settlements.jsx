// ─── S-24 정산·지급 — 파트너별 테이블 · 일괄 확정 · CSV (멱등 AC) ──
import { useMemo } from 'react'
import { useStore, tenantSettlement, distributorSettlement } from '../../lib/store'
import { won, downloadCSV, monthKey } from '../../lib/engine'
import { unitName } from '../../lib/constants'
import { Card, Btn, KpiCard, useToast } from '../../components/ui'

export default function AdminSettlements() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const period = monthKey()
  // 지급 확정 상태는 db.settleConfirms에 영속 — 새로고침에도 유지 (기간 키 = 일괄, 기간:테넌트 키 = 개별)
  const confirms = db.settleConfirms ?? {}
  const allConfirmed = !!confirms[period]
  const isConfirmed = (tid) => allConfirmed || !!confirms[`${period}:${tid}`]

  const rows = useMemo(() =>
    db.tenants.filter((t) => t.status === '활성').map((t) => ({ tenant: t, s: tenantSettlement(db, t.id) })),
  [db])
  // 총판 배분 — 본사 수수료 수입에서 지급 (셀러 순지급액 불변, 3계층 수익 구조)
  const dists = useMemo(() => distributorSettlement(db), [db])
  const distTotal = dists.reduce((s, d) => s + d.share, 0)

  // 음수 정산(이용료 미달 = 미수)은 숨기지 않는다 — 지급 합계(양수)와 미수 합계(음수)를 분리 집계
  const totals = rows.reduce((acc, r) => ({
    gross: acc.gross + r.s.gross, fee: acc.fee + r.s.fee, monthly: acc.monthly + r.s.monthlyFee,
    net: acc.net + Math.max(0, r.s.net), owed: acc.owed + Math.min(0, r.s.net),
  }), { gross: 0, fee: 0, monthly: 0, net: 0, owed: 0 })

  const confirmAll = () => {
    dispatch({ type: 'SETTLE_CONFIRM', period, detail: `파트너 ${rows.length}곳 · 총 지급 ${won(totals.net)}` })
    toast(`${period} 정산 일괄 확정 — 파트너 화면·CSV와 원단위 일치`)
  }

  const exportCsv = () => {
    downloadCSV(`모두온_월정산_${period}.csv`, [
      // 펌뱅킹 실연동 전 안전장치 — 파일만 보고 이체하는 사고 방지 (axion 흡수)
      ['※ 실연동 전 검증용 파일입니다 — 실제 이체 아님', '', '', '', '', '', '', ''],
      ['파트너', 'slug', '권역', '몰 매출', `수수료(${Math.round(db.policies.feeRate * 100)}%)`, '월 이용료', '순지급액', '상태'],
      // 순지급액은 참값 그대로 — 음수(미수)도 숨기지 않고 내보낸다 (열 합계 검증 가능)
      ...rows.map((r) => [r.tenant.name, r.tenant.slug, unitName(r.tenant.unit), r.s.gross, r.s.fee, r.s.monthlyFee, r.s.net, isConfirmed(r.tenant.id) ? '지급 확정' : '대기']),
      ['합계', '', '', totals.gross, totals.fee, totals.monthly, totals.net + totals.owed, ''],
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
        <KpiCard label={`운영 수수료 수입 (${Math.round(db.policies.feeRate * 100)}%)`} value={totals.fee} suffix="원" accent="text-ok" caption={distTotal > 0 ? `총판 배분 ${won(distTotal)} 차감 전` : undefined} />
        <KpiCard label="월 이용료 수입" value={totals.monthly} suffix="원" accent="text-ok" />
        <KpiCard label="파트너 순지급 총액" value={totals.net} suffix="원" accent="text-primary-text" caption={totals.owed < 0 ? `미수 ${won(-totals.owed)} 별도 청구` : undefined} />
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
            <span className="flex items-center gap-1.5">
              <span className={`tnum text-[13.5px] font-extrabold ${s.net < 0 ? 'text-danger' : 'text-primary-text'}`}>{won(s.net)}</span>
              {s.net < 0 && <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">미수</span>}
            </span>
            <span className="col-span-2 flex lg:col-span-1">
              {isConfirmed(tenant.id)
                ? <span className="rounded-full bg-ok/10 px-2.5 py-1 text-[11.5px] font-bold text-ok">지급 확정</span>
                : (
                  <button
                    onClick={() => { dispatch({ type: 'SETTLE_CONFIRM', period: `${period}:${tenant.id}`, detail: `${tenant.name} ${won(s.net)}` }); toast(`${tenant.name} 지급 확정`) }}
                    className="rounded-full bg-warn/10 px-2.5 py-1 text-[11.5px] font-bold text-warn hover:bg-warn hover:text-white"
                  >
                    대기 → 확정
                  </button>
                )}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] gap-2 bg-brow/40 px-5 py-3.5 lg:grid-cols-[1.3fr_0.8fr_1fr_1fr_0.9fr_1fr_0.9fr]">
          <span className="text-[13px] font-extrabold text-bink">순지급 합계 ({rows.length}개 몰)</span>
          <span className="hidden lg:block" />
          <span className="tnum hidden text-[12.5px] font-bold text-bink lg:block">{won(totals.gross)}</span>
          <span className="tnum hidden text-[12.5px] font-bold text-danger lg:block">−{won(totals.fee)}</span>
          <span className="tnum hidden text-[12.5px] font-bold text-danger lg:block">−{won(totals.monthly)}</span>
          <span className="tnum text-[13.5px] font-extrabold text-primary-text">{won(totals.net)}</span>
          <span className="hidden lg:block" />
        </div>
        {totals.owed < 0 && (
          <div className="flex items-center justify-between border-t border-brow bg-danger/5 px-5 py-2.5">
            <span className="text-[12px] font-bold text-danger">미수 합계 — 이용료 미달 몰, 익월 청구 대상</span>
            <span className="tnum text-[13px] font-extrabold text-danger">{won(-totals.owed)}</span>
          </div>
        )}
      </Card>

      {/* 총판 배분 — 3계층 수익 구조의 가운데 층 */}
      {dists.length > 0 && (
        <Card track="b" className="mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-[15.5px] font-extrabold text-bink">총판 배분 <span className="text-[12px] font-semibold text-bmuted">· 본사 수수료 수입에서 지급</span></h2>
            <span className="tnum text-[12.5px] font-extrabold text-bindigo">합계 {won(distTotal)}</span>
          </div>
          <div className="mt-3 border-t border-brow">
            {dists.map((d) => (
              <div key={d.id} className="grid grid-cols-[1.4fr_auto] items-center gap-2 border-b border-brow px-5 py-3 last:border-0 sm:grid-cols-[1.4fr_0.8fr_1fr_0.9fr_1fr]">
                <div>
                  <div className="text-[13.5px] font-bold text-bink">{d.name}</div>
                  <div className="text-[11.5px] text-bfaint">{d.owner} · {unitName(d.unit)}</div>
                </div>
                <span className="tnum hidden text-[12px] text-bfaint sm:block">셀러 {d.sellerCount}곳</span>
                <span className="tnum hidden text-[12.5px] text-bbody sm:block">{won(d.gross)}</span>
                <span className="tnum hidden text-[12px] text-bfaint sm:block">× {((d.sharePct ?? 0) * 100).toFixed(0)}%</span>
                <span className="tnum justify-self-end text-[13.5px] font-extrabold text-bindigo sm:justify-self-start">{won(d.share)}</span>
              </div>
            ))}
          </div>
          <p className="px-5 py-3 text-[11px] text-bfaint">총판 배분은 권역 활성 셀러 매출 × 배분율로 산정하며 본사 운영 수수료에서 지급됩니다 — 셀러 순지급액에는 영향이 없습니다.</p>
        </Card>
      )}

      <p className="mt-3 text-[11.5px] leading-5 text-bfaint">
        정산 산식: 순지급액 = 몰 매출 − 운영 수수료({Math.round(db.policies.feeRate * 100)}%) − 월 이용료({won(db.policies.monthlyFee)}). 이용료가 매출을 넘는 몰은 음수(미수)로 표기하고 익월 청구합니다. 취소·환불은 익월 차감, 조정 이력 전수 보존. 파트너 화면·어드민·CSV 3자 원단위 일치(AC). 총판 배분은 본사 수수료 수입에서 별도 지급.
      </p>
    </div>
  )
}
