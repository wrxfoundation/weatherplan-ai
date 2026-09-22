// ─── S-23 정책 관리 — 분양비·이용료·수수료율 (버전·이력·영향 고지) ──
import { useState } from 'react'
import { useStore } from '../../lib/store'
import { won, fmtDate, SAUP_TIERS } from '../../lib/engine'
import { Card, Btn, Modal, Field, binputCls, useToast } from '../../components/ui'
import { AiInsight } from '../../components/AiPanel'
import { policyPanel } from '../../lib/ai'
import { selfMarginOf, RATE_CARD, rebateDetail, DEVICE_ROW, ETC_ROW, isListed } from '../../lib/ratecard'
import { calcPhoneQuote, PHONE_DEVICES, PHONE_PLANS } from '../../lib/phones'

export default function AdminPolicies() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const p = db.policies
  const [open, setOpen] = useState(false)
  const [joinFee, setJoinFee] = useState(p.joinFee)
  const [monthlyFee, setMonthlyFee] = useState(p.monthlyFee)
  const [feeRate, setFeeRate] = useState(Math.round(p.feeRate * 100))
  const [note, setNote] = useState('')
  const margin = selfMarginOf(db)
  const [marginIn, setMarginIn] = useState(margin)

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
          { label: '대리점 가입비', value: won(p.joinFee), sub: '분양몰 개설 1회 (정액)' },
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

      {/* 셀프개통 고정 마진 — 정책 단가표 리베이트에서 회사가 남길 금액.
          온라인구매 가격과 사업자 R/B 가 같은 값을 읽으므로 여기 하나만 바꾸면 전 화면이 따라온다. */}
      <Card track="b" className="mt-4 p-5" data-t="self-margin">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-bink">셀프개통 고정 마진</h2>
            <p className="mt-1 text-[12.5px] text-bmuted">
              {RATE_CARD.name} ({RATE_CARD.effectiveFrom}~) 리베이트에서 이 금액만 남기고 <b className="text-bink">전부 고객 지원금</b>으로 풉니다.
              온라인구매 가격과 사업자 R/B 가 같은 값을 읽습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input type="number" step="10000" className={`${binputCls} w-36`} value={marginIn} onChange={(e) => setMarginIn(e.target.value)} data-t="self-margin-input" />
            <Btn size="sm" data-t="self-margin-save" disabled={+marginIn === margin}
              onClick={() => { dispatch({ type: 'POLICY_SELF_MARGIN', margin: +marginIn }); toast(`셀프개통 마진 ${won(+marginIn)} 적용 — 온라인구매·R/B 즉시 반영`) }}>
              적용
            </Btn>
          </div>
        </div>
        {/* 지금 마진으로 실제 얼마가 되는지 — 대표 조합 3개를 바로 보여 준다(설정과 결과가 따로 놀지 않게) */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-[12.5px]" data-t="self-margin-preview">
            <thead>
              <tr className="border-b border-brow text-[11.5px] text-bmuted">
                <th className="px-2 py-2 text-left font-semibold">대표 조합</th>
                <th className="px-2 py-2 text-right font-semibold">정책 리베이트</th>
                <th className="px-2 py-2 text-right font-semibold">회사 마진</th>
                <th className="px-2 py-2 text-right font-semibold">고객 지원금</th>
                <th className="px-2 py-2 text-right font-semibold">월 납부금</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brow">
              {[['fold8', 'choice110', 'mnp'], ['s26', 'choice90', 'mnp'], ['ip17p', 'choice110', 'chg'], ['flip8', 'basic4g', 'new']].map(([d, pid, j]) => {
                const q = calcPhoneQuote({ deviceId: d, planId: pid, join: j, months: 24, policyMargin: margin })
                const x = rebateDetail({ deviceId: d, planId: pid, join: j })
                return (
                  <tr key={`${d}${pid}${j}`} data-t="self-margin-row">
                    <td className="px-2 py-2.5 font-bold text-bink">{q.device.short} · {x.joinLabel}
                      <span className="ml-1.5 font-semibold text-bfaint">{x.plan?.name}</span>
                      {!x.listed && <span className="ml-1.5 rounded bg-warn/15 px-1.5 py-0.5 text-[10.5px] font-bold text-warn">그 외</span>}
                    </td>
                    <td className="tnum px-2 py-2.5 text-right text-bbody">{won(q.rebate)}</td>
                    <td className="tnum px-2 py-2.5 text-right text-bfaint">{q.margin > 0 ? `−${won(q.margin)}` : won(0)}</td>
                    <td className="tnum px-2 py-2.5 text-right font-extrabold text-ok">{won(q.extraSupport)}</td>
                    <td className="tnum px-2 py-2.5 text-right font-extrabold text-primary-text">{won(q.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-bfaint">
          리베이트가 마진보다 작으면 고객 지원금은 0원이고 마진도 리베이트까지만 남습니다(마이너스 마진을 만들지 않습니다).
          24개월 할부·공시지원금 포함 기준이며 {RATE_CARD.notes.length}개 환수 조건은 단가표 고지를 따릅니다.
        </p>
      </Card>

      {/* 정책 단가표 전문 — 시트를 그대로 화면에 올린다.
          "홈페이지에 적용됐는지" 를 눈으로 대조하는 자리라, 시트와 같은 단위(만원)·같은 행 순서로 둔다. */}
      <Card track="b" className="mt-4 p-5" data-t="rate-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-bink">{RATE_CARD.name} <span className="text-[12.5px] font-semibold text-bmuted">· {RATE_CARD.effectiveFrom}~ · {RATE_CARD.carrier}</span></h2>
            <p className="mt-1 text-[12.5px] text-bmuted">
              이 표가 <b className="text-bink">요금제 목록까지</b> 정합니다 — 온라인구매 화면의 요금제 선택지가 아래 열에서 나옵니다.
              단가표를 갈아끼우면 요금제·셀프개통 가격·사업자 R/B 가 함께 바뀝니다.
            </p>
          </div>
          <span className="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-bold text-primary-text">단위: 만원</span>
        </div>

        <div className="mt-3.5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-[12.5px]" data-t="rate-card-table">
            <thead>
              <tr className="border-b border-brow text-[11.5px] text-bmuted">
                <th rowSpan={2} className="px-2 py-2 text-left align-bottom font-semibold">단말</th>
                {RATE_CARD.plans.map((pl) => (
                  <th key={pl.key} colSpan={RATE_CARD.joins.length} className="border-l border-brow px-2 py-2 text-center font-semibold">
                    {pl.name}{pl.sub ? <span className="block text-[10.5px] font-medium text-bfaint">{pl.sub}</span> : null}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-brow text-[11px] text-bfaint">
                {RATE_CARD.plans.flatMap((pl) => RATE_CARD.joins.map((j, i) => (
                  <th key={`${pl.key}${j.key}`} className={`px-2 py-1.5 text-right font-semibold ${i === 0 ? 'border-l border-brow' : ''}`}>{j.label.replace('010 신규', '010')}</th>
                )))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brow">
              {RATE_CARD.devices.map((d) => (
                <tr key={d.key} data-t="rate-card-row" data-row={d.key} className={d.fallback ? 'bg-warn/[0.06]' : ''}>
                  <td className="px-2 py-2 font-bold text-bink">
                    {d.label}{d.capacity ? <span className="ml-1 font-semibold text-bfaint">{d.capacity}</span> : null}
                    {d.assumed && <span className="ml-1.5 rounded bg-warn/15 px-1.5 py-0.5 text-[10.5px] font-bold text-warn">확인 필요</span>}
                  </td>
                  {RATE_CARD.plans.flatMap((pl) => (d.rows[pl.key] ?? []).map((v, i) => (
                    <td key={`${pl.key}${i}`} className={`tnum px-2 py-2 text-right ${v === 0 ? 'text-bfaint' : 'text-bbody'} ${i === 0 ? 'border-l border-brow' : ''}`}>{v}</td>
                  )))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 우리 상품 단말이 어느 줄로 잡히는지 — 매핑이 틀리면 여기서 바로 보인다 */}
        <div className="mt-4 rounded-card bg-bbg px-4 py-3">
          <div className="text-[12.5px] font-extrabold text-bink">판매 단말 → 단가표 행 매핑</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5" data-t="rate-card-map">
            {PHONE_DEVICES.map((dev) => {
              const listed = isListed(dev.id)
              return (
                <span key={dev.id} data-t="rate-map-item" data-listed={listed ? '1' : '0'} className="text-[12px]">
                  <b className="font-bold text-bbody">{dev.short}</b>
                  <span className="mx-1 text-bfaint">→</span>
                  <span className={listed ? 'font-semibold text-ok' : 'font-semibold text-warn'}>
                    {RATE_CARD.devices.find((x) => x.key === (DEVICE_ROW[dev.id] ?? ETC_ROW))?.label}
                  </span>
                </span>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-bfaint">
            단가표에 이름이 없는 단말은 <b className="text-warn">그 외</b> 줄을 씁니다. 시트에 그 외 행이 없어
            각 칸의 최솟값(= 아이폰18 P/PM 줄)으로 임시 설정했습니다 — 높게 잡으면 고객 지원금을 과다 약속하게 되므로 낮은 쪽으로 두었습니다.
            확정값을 주시면 그 줄만 교체합니다. 요금제 {PHONE_PLANS.filter((x) => x.assumed).map((x) => x.name).join(' · ') || '없음'}
            {PHONE_PLANS.some((x) => x.assumed) ? ' 의 월정액도 시트에 없어 임시값입니다.' : ''}
          </p>
        </div>

        <ul className="mt-3 space-y-1 text-[11px] leading-[1.6] text-bfaint">
          {RATE_CARD.excludes.map((x) => <li key={x}>· <b className="text-bmuted">미반영</b> — {x}</li>)}
          {RATE_CARD.notes.map((n) => <li key={n}>· {n}</li>)}
        </ul>
      </Card>

      <Card track="b" className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[15.5px] font-extrabold text-bink">사업권(권역) 판매가 <span className="text-[12.5px] font-semibold text-bmuted">· 총판 · 사업기획서 v4</span></div>
          <span className="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-bold text-primary-text">총 75개 판매단위 · 완판 ~14.8억</span>
        </div>
        <div className="mt-3.5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {SAUP_TIERS.map((t) => (
            <div key={t.label} className="flex items-center justify-between border-b border-brow py-2 text-[13px]">
              <span className="font-semibold text-bbody">{t.label}</span>
              <span className="tnum font-bold text-bink">{won(t.price)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-bfaint">수도권(수도1·2·3단)은 관리단 유지 · 행정구역 단위 개별 판매, 지방 8단은 단 단위 일괄. 상세 per-구 표는 별도 시트 반영 예정.</p>
      </Card>

      <div className="mt-4 flex items-center justify-between rounded-card bg-tint px-5 py-4">
        <div className="text-[13px] font-semibold text-primary-text">
          현재 정책 <strong className="font-extrabold">v{p.version}</strong> · {fmtDate(p.appliedAt)} 적용 — 시뮬레이션: 월 수수료 수입 864만(24건) → 파트너 순수익 {won(8640000 - Math.round(8640000 * p.feeRate) - p.monthlyFee)}
        </div>
        <Btn size="sm" onClick={() => setOpen(true)}>정책 변경</Btn>
      </div>

      {/* 정책 인상 페르소나 시뮬레이션 — 변경 전 세그먼트 반응 사전 탐색 */}
      <div className="mt-4">
        <AiInsight
          title="정책 인상 시뮬레이션 — 파트너 세그먼트 패널"
          desc="수수료 +1%p · 이용료 +5만원 시나리오에 파트너 4세그먼트(신규/저매출/표준/고매출)가 어떻게 반응할지 실제 정산 산식으로 사전 탐색해요."
          cta="세그먼트 반응 시뮬레이션"
          build={() => policyPanel({ feeRate: p.feeRate, monthlyFee: p.monthlyFee })}
        />
        <p className="mt-1.5 text-[10.5px] leading-4 text-bfaint">시뮬레이션은 가설 탐색용이며 실제 파트너 반응을 대체하지 않아요 — 인상은 파트너 협의체 의견 수렴 후 결정하세요.</p>
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
