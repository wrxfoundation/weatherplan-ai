// ─── S-23 정책 관리 — 분양비·이용료·수수료율 (버전·이력·영향 고지) ──
import { useState } from 'react'
import { useStore } from '../../lib/store'
import { won, fmtDate } from '../../lib/engine'
import { unitName } from '../../lib/constants'
import { Card, Btn, Modal, Field, binputCls, useToast } from '../../components/ui'

export default function AdminPolicies() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const p = db.policies
  const [open, setOpen] = useState(false)
  const [joinFee, setJoinFee] = useState(p.joinFee)
  const [monthlyFee, setMonthlyFee] = useState(p.monthlyFee)
  const [feeRate, setFeeRate] = useState(Math.round(p.feeRate * 100))
  const [note, setNote] = useState('')

  const apply = () => {
    dispatch({ type: 'UPDATE_POLICIES', payload: { joinFee: +joinFee, monthlyFee: +monthlyFee, feeRate: +feeRate / 100, note: note.trim() || '정책 조정' } })
    setOpen(false); setNote('')
    toast(`정책 v${p.version + 1} 적용 — 랜딩·계산기·정산에 즉시 반영`)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">정책 관리</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">정책값은 코드 하드코딩 없이 이 테이블이 단일 소스 — 파트너 랜딩·분양 신청·정산 로직이 실시간 참조합니다.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: '초기 분양비(대표)', value: won(p.joinFee), sub: '권역 미지정 시 폴백 · 권역별은 아래 표' },
          { label: '월 이용료', value: won(p.monthlyFee), sub: '매월 정산 시 차감' },
          { label: '운영 수수료율', value: `${Math.round(p.feeRate * 100)}%`, sub: '몰 매출 기준' },
        ].map((c) => (
          <Card key={c.label} track="b" className="p-5">
            <div className="text-[12.5px] font-medium text-bmuted">{c.label}</div>
            <div className="tnum mt-1.5 text-[26px] font-extrabold text-bink">{c.value}</div>
            <div className="mt-1 text-[11.5px] text-bfaint">{c.sub}</div>
          </Card>
        ))}
      </div>

      {p.joinFeeByUnit && (
        <Card track="b" className="mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[15.5px] font-extrabold text-bink">권역별 분양비 <span className="text-[12.5px] font-semibold text-bmuted">· 11개 영업단</span></div>
            <span className="rounded-full bg-warn/10 px-2.5 py-0.5 text-[11px] font-bold text-warn">사업계획서 표 반영 대기 — 임시 tier값</span>
          </div>
          <div className="mt-3.5 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(p.joinFeeByUnit).map(([code, fee]) => (
              <div key={code} className="flex items-center justify-between border-b border-brow py-2 text-[13px]">
                <span className="font-semibold text-bbody">{unitName(code)}</span>
                <span className="tnum font-bold text-bink">{won(fee)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-bfaint">분양 신청 화면은 소재지 권역에 해당하는 위 금액을 자동 표시합니다. 실제 표를 전달주시면 값만 교체돼요.</p>
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between rounded-card bg-tint px-5 py-4">
        <div className="text-[13px] font-semibold text-primary-text">
          현재 정책 <strong className="font-extrabold">v{p.version}</strong> · {fmtDate(p.appliedAt)} 적용 — 시뮬레이션: 월 매출 1,000만 → 순수익 {won(10000000 - 10000000 * p.feeRate - p.monthlyFee)}
        </div>
        <Btn size="sm" onClick={() => setOpen(true)}>정책 변경</Btn>
      </div>

      <Card track="b" className="mt-4 overflow-hidden">
        <div className="px-5 pt-4 text-[15.5px] font-extrabold text-bink">버전 이력</div>
        <div className="mt-3 hidden grid-cols-[70px_1fr_1fr_1fr_1fr_1.4fr] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted sm:grid">
          <span>버전</span><span>분양비</span><span>월 이용료</span><span>수수료율</span><span>적용일</span><span>비고</span>
        </div>
        {[...p.history].reverse().map((h) => (
          <div key={h.version} className="grid grid-cols-2 gap-2 border-b border-brow px-5 py-3 text-[12.5px] sm:grid-cols-[70px_1fr_1fr_1fr_1fr_1.4fr]">
            <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-extrabold ${h.version === p.version ? 'bg-ok/10 text-ok' : 'bg-brow text-bmuted'}`}>v{h.version}{h.version === p.version ? ' 현행' : ''}</span>
            <span className="tnum text-bbody">{won(h.joinFee)}</span>
            <span className="tnum text-bbody">{won(h.monthlyFee)}</span>
            <span className="tnum text-bbody">{Math.round(h.feeRate * 100)}%</span>
            <span className="text-bmuted">{fmtDate(h.appliedAt)}</span>
            <span className="col-span-2 text-bfaint sm:col-span-1">{h.note}</span>
          </div>
        ))}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="분양 정책 변경">
        <div className="flex flex-col gap-3.5">
          <Field label="초기 분양비 (원)"><input type="number" className={binputCls} value={joinFee} onChange={(e) => setJoinFee(e.target.value)} /></Field>
          <Field label="월 이용료 (원)"><input type="number" className={binputCls} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} /></Field>
          <Field label="운영 수수료율 (%)"><input type="number" className={binputCls} value={feeRate} onChange={(e) => setFeeRate(e.target.value)} /></Field>
          <Field label="변경 사유"><input className={binputCls} placeholder="예) 신규 권역 프로모션" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <div className="mt-4 rounded-field bg-warn/10 px-3.5 py-3 text-[12px] leading-5 text-warn">
          ⚠ 영향 범위: 파트너 모집 랜딩 · 분양 신청 안내 · 마이오피스 정산 · 어드민 정산 집계가 <strong>즉시</strong> 새 값으로 계산됩니다. 기존 계약 파트너 적용 시점은 계약 조항을 따르세요.
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setOpen(false)}>취소</Btn>
          <Btn size="sm" className="flex-1" onClick={apply}>v{p.version + 1}로 적용</Btn>
        </div>
      </Modal>
    </div>
  )
}
