// ─── 판매자 설계 (사업자 전용) — 제로노트식 휴대폰 견적 설계 ──────────────────────────
// 사업자로 로그인해 휴대폰 온라인구매(/phone/shop/:model)나 견적 계산기(/calculator/phone)에 들어오면
// 소비자 화면 대신 이 화면이 열린다. 판매자가 고객 조건을 직접 넣어 월 납부금을 짜고, 그 대가로
// '내 수당'이 얼마 남는지를 같은 화면에서 본다.
//
//   A 단말기 할부정보 — 출고가 · 공시지원금(또는 가격표 적용가) · 추가지원금 · 포인트 · 선할인카드 · 선입금 · 할부
//   B 요금정보       — 요금제 · 선택약정 · 결합 · 청구할인카드 · 복지 · 프로모션 · 부가서비스
//   오른쪽           — 수당(R/B) → 그 아래 월 납부요금정보(A+B)  ← "월 납부요금정보칸 위쪽으로 수당" 요청
//
// 추가지원금은 판매자 부담이라 수당과 연동된다(rbFor support). 상한은 '내 수당 한도'이고 넘기면 잘린다.
// 인쇄·고객용 견적 복사에는 수당을 절대 싣지 않는다 — 고객에게 가는 문서다.
import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PHONE_DEVICES, PHONE_PLANS, JOIN_TYPES, INSTALLMENT_MONTHS, ADDONS, BUNDLE, bundleEligible, phoneDevice, designPhoneQuote, DESIGN_DEFAULTS } from '../../lib/phones'
import { PRICE_CARD, PRICE_ROW, priceDetail, isPriced } from '../../lib/ratecard'
import { rbFor } from '../../lib/rb'
import { won, copyText } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import { useToast } from '../ui'
import RbPanel from '../RbPanel'

const SAVE_KEY = 'moduon_seller_designs_v1'
const readSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) ?? [] } catch { return [] } }
const writeSaved = (list) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 30))) } catch { /* 저장 불가 환경 — 조용히 무시 */ } }

export default function SellerDesigner({ viewer, initialDeviceId }) {
  const toast = useToast()
  const [d, setD] = useState(() => ({ ...DESIGN_DEFAULTS, deviceId: phoneDevice(initialDeviceId ?? DESIGN_DEFAULTS.deviceId).id }))
  const set = (k) => (v) => setD((x) => ({ ...x, [k]: v }))
  const owner = viewer.code ?? viewer.label
  const [saved, setSaved] = useState(() => readSaved().filter((s) => s.owner === owner))

  // 경로의 기종이 바뀌면(목록에서 다른 기종으로 들어오면) 설계 기종도 맞춘다
  useEffect(() => { if (initialDeviceId) setD((x) => ({ ...x, deviceId: phoneDevice(initialDeviceId).id, storage: null })) }, [initialDeviceId])

  // 가격표(KT K1)가 다루는 기종이면 표에 값이 있는 조합만 고를 수 있다 — 'X' 칸은 버튼을 끈다(소비자 계산기와 같은 규칙)
  const locked = isPriced(d.deviceId)
  const covered = (planId, j, m) => priceDetail({ deviceId: d.deviceId, planId, join: j, method: m, carrier: 'KT' }).state === 'covered'
  const cellOk = (j, m) => !locked || covered(d.planId, j, m)
  const joinOk = (j) => !locked || PRICE_CARD.methods.some((m) => cellOk(j, m.key))
  // 요금제 통째로 'X' 인 경우(폴드8 × 베이직 4GB 등) — 요금제 목록에서 끄고, 이미 골라져 있으면 되는 요금제로 옮긴다
  const planOk = (planId) => !locked || PRICE_CARD.joins.some((j) => PRICE_CARD.methods.some((m) => covered(planId, j.key, m.key)))
  useEffect(() => {
    if (!locked) return
    if (!planOk(d.planId)) { const p = PHONE_PLANS.find((x) => planOk(x.id)); if (p) setD((x) => ({ ...x, planId: p.id })); return }
    if (cellOk(d.join, d.method)) return
    for (const j of PRICE_CARD.joins) for (const m of PRICE_CARD.methods) if (cellOk(j.key, m.key)) { setD((x) => ({ ...x, join: j.key, method: m.key })); return }
  }, [d.deviceId, d.planId, d.join, d.method, locked]) // eslint-disable-line react-hooks/exhaustive-deps

  // 수당 먼저 — 추가지원금은 내 수당 한도로 잘리고, 잘린 값으로 가격을 계산해야 두 칸 숫자가 맞는다
  const rb = useMemo(() => rbFor({ kind: 'phone', deviceId: d.deviceId, join: d.join, support: Number(d.extraSupport) || 0, planId: d.planId, viewer }), [d.deviceId, d.join, d.extraSupport, d.planId, viewer])
  const q = useMemo(() => designPhoneQuote({ ...d, extraSupport: rb.customer }), [d, rb.customer])
  const clipped = (Number(d.extraSupport) || 0) > rb.customer

  // 단말지원 vs 선택약정 — 같은 판매자 입력으로 24개월 총 납부를 비교(선택약정이 가격표에서 막히면 비교하지 않는다)
  const alt = useMemo(() => {
    const other = d.method === 'support' ? 'select' : 'support'
    if (!cellOk(d.join, other)) return null
    const o = designPhoneQuote({ ...d, method: other, extraSupport: rb.customer })
    return { method: other, total24: o.total24, diff: o.total24 - q.total24 }
  }, [d, q.total24, rb.customer]) // eslint-disable-line react-hooks/exhaustive-deps

  const device = q.device
  const code = PRICE_CARD.devices.find((x) => x.key === PRICE_ROW[d.deviceId])?.code
  const joinLabel = JOIN_TYPES.find((j) => j.key === d.join)?.label
  const methodLabel = d.method === 'support' ? '단말지원' : '선택약정'

  const save = () => {
    const entry = { id: `SD${Date.now()}`, owner, savedAt: Date.now(), name: `${device.short} · ${joinLabel} · ${q.plan.name} · 월 ${won(q.total)}`, state: d }
    const all = [entry, ...readSaved()]
    writeSaved(all); setSaved(all.filter((s) => s.owner === owner))
    toast('설계를 저장했어요 — 불러오기에서 다시 열 수 있어요')
  }
  const load = (id) => {
    const s = saved.find((x) => x.id === id); if (!s) return
    setD({ ...DESIGN_DEFAULTS, ...s.state }); toast('저장한 설계를 불러왔어요')
  }
  // 고객에게 보내는 견적 — 수당·R/B 는 절대 넣지 않는다
  const customerText = () => [
    `[모두온 휴대폰 견적 · KT]`,
    `${device.name} · ${joinLabel} · ${methodLabel}`,
    `요금제 ${q.plan.name} (월 ${won(q.plan.monthly)})`,
    `출고가 ${won(q.price)} → 할부원금 ${won(q.principal)}${q.months ? ` (${q.months}개월)` : ' (일시불)'}`,
    `월 단말 할부금 ${q.months ? won(q.deviceMonthly) : '일시불'} + 월 요금 ${won(q.planMonthly)}${q.addonFee ? ` + 부가서비스 ${won(q.addonFee)}` : ''}`,
    `▶ 월 납부 예상 ${won(q.total)}`,
    q.oneTime ? `개통 시 별도 ${won(q.oneTime)}` : null,
    `※ 예상 견적이며 최종 조건은 개통 시 확정됩니다.`,
  ].filter(Boolean).join('\n')
  const copyQuote = async () => { if (await copyText(customerText())) toast('고객용 견적을 복사했어요 (수당 정보 제외)') }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-8 lg:pb-12" data-t="seller-designer">
      {/* 머리 — 누가 무엇을 설계 중인지 + 도구 */}
      <div className="flex flex-wrap items-end justify-between gap-3 pt-6 sm:pt-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-bindigo px-2 py-0.5 text-[11px] font-extrabold text-white">사업자 설계</span>
            <span className="text-[12px] font-semibold text-bmuted">{viewer.label}{viewer.code ? ` · ${viewer.code}` : ''} · {viewer.name}</span>
          </div>
          <h1 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.5px] text-bink sm:text-[24px]">휴대폰 판매 설계</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">
            {device.name}{code ? ` · 모델 ${code}` : ''} · KT · 고객 조건을 넣으면 월 납부금과 <b className="text-bink">내 수당</b>이 함께 움직여요
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden" data-t="seller-toolbar">
          <ToolBtn onClick={save} t="seller-save">저장하기</ToolBtn>
          <label className="relative">
            <span className="sr-only">저장한 설계 불러오기</span>
            <select value="" onChange={(e) => load(e.target.value)} data-t="seller-load" disabled={!saved.length}
              className="h-10 max-w-[180px] rounded-field border border-bline bg-white pl-3 pr-8 text-[13px] font-bold text-bbody disabled:opacity-50">
              <option value="">불러오기{saved.length ? ` (${saved.length})` : ''}</option>
              {saved.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <ToolBtn onClick={() => window.print()} t="seller-print">인쇄하기</ToolBtn>
          <ToolBtn onClick={copyQuote} t="seller-copy">고객용 견적 복사</ToolBtn>
          <Link to={`/phone/shop/${d.deviceId}?view=customer`} className="inline-flex h-10 items-center rounded-field px-3 text-[13px] font-bold text-primary-text hover:bg-tint" data-t="seller-customer-view">고객 화면 보기 →</Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
        {/* ── A. 단말기 할부정보 ── */}
        <Panel title="단말기 할부정보" tag="A" t="seller-a"
          foot={<FootRow label="단말 할부금" value={q.months ? `${won(q.deviceMonthly)}/월` : '일시불'} t="seller-device-monthly" />}>
          <Row label="단말기" stack>
            <Select value={d.deviceId} onChange={(v) => setD((x) => ({ ...x, deviceId: v, storage: null }))} t="seller-device" label="단말기"
              options={PHONE_DEVICES.map((x) => ({ value: x.id, label: x.name }))} />
          </Row>
          {device.storages?.length > 1 && (
            <Row label="용량" stack>
              <Seg t="seller-storage" value={q.storage} onChange={set('storage')} options={device.storages.map((s) => ({ key: s.key, label: s.key }))} />
            </Row>
          )}
          <Row label="출고가"><Value>{won(q.price)}</Value></Row>
          <Row label="할인 방식" stack>
            <Seg t="calc-method" value={d.method} onChange={set('method')}
              options={[{ key: 'support', label: '단말지원' }, { key: 'select', label: '선택약정' }].map((o) => ({ ...o, disabled: !cellOk(d.join, o.key) }))} />
          </Row>
          <Row label="가입유형" stack>
            <Seg t="calc-join" value={d.join} onChange={set('join')} options={JOIN_TYPES.map((j) => ({ key: j.key, label: j.label, disabled: !joinOk(j.key) }))} />
          </Row>
          <Row label={q.priced ? '가격표 반영 할인' : '공통지원금'} hint={q.priced ? `${PRICE_CARD.name} 적용가` : d.method === 'select' ? '선택약정은 공시지원금 없음' : '통신사 공시지원금'}>
            <Value tone="ok">{q.publicSupport ? `−${won(q.publicSupport)}` : '0원'}</Value>
          </Row>
          {q.blocked && <p className="py-2 text-[11.5px] font-bold leading-4 text-danger" data-t="seller-blocked">가격표에서 취급하지 않는 조합이에요 — 금액은 참고용 계산값입니다</p>}
          <Row label="추가지원금" hint={clipped ? `내 수당 한도 ${won(rb.range.max)}까지만 적용됐어요` : `내 수당에서 나가요 · 최대 ${won(rb.range.max)}`} warn={clipped}>
            <Money value={d.extraSupport} onChange={set('extraSupport')} t="seller-extra" label="추가지원금" />
          </Row>
          <Row label="포인트할인"><Money value={d.pointDc} onChange={set('pointDc')} t="seller-point" label="포인트할인" /></Row>
          <Row label="선할인카드"><Money value={d.preCard} onChange={set('preCard')} t="seller-precard" label="선할인카드" /></Row>
          <Row label="고객선입금"><Money value={d.prepay} onChange={set('prepay')} t="seller-prepay" label="고객선입금" /></Row>
          <Row label="할부개월" stack>
            <Select value={String(d.months)} onChange={(v) => set('months')(Number(v))} t="seller-months" label="할부개월"
              options={INSTALLMENT_MONTHS.map((m) => ({ value: String(m.key), label: m.label }))} />
          </Row>
          <Row label="할부원금"><Value strong t="seller-principal">{won(q.principal)}</Value></Row>
          {q.months > 0 && <Row label="할부수수료" hint={`원리금균등 연 5.9%`}><Value>{won(q.interest)}</Value></Row>}
        </Panel>

        {/* ── B. 요금정보 + 별도 청구 ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="요금정보" tag="B" t="seller-b"
            foot={<FootRow label="월요금" value={`${won(q.planMonthly + q.addonFee)}/월`} t="seller-plan-monthly" />}>
            <Row label="요금제" stack hint={`월 ${won(q.plan.monthly)}${q.plan.assumed ? ' (임시 월정액)' : ''}`}>
              <Select value={d.planId} onChange={set('planId')} t="seller-plan" label="요금제"
                options={PHONE_PLANS.map((p) => ({ value: p.id, label: `${p.name}${planOk(p.id) ? '' : ' (이 기종 취급 불가)'}`, disabled: !planOk(p.id) }))} />
            </Row>
            <Row label="선택약정 할인" hint="요금 25% · 선택약정일 때만"><Value tone="ok">{q.planDiscount ? `−${won(q.planDiscount)}` : '미적용'}</Value></Row>
            <Row label="결합할인" hint={bundleEligible(q.plan) ? `${BUNDLE.label} · 요금 25%` : `${won(BUNDLE.minPlan)} 이상 요금제만`}>
              <Toggle on={d.bundle && bundleEligible(q.plan)} disabled={!bundleEligible(q.plan)} onClick={() => set('bundle')(!d.bundle)} t="seller-bundle" label="결합할인" />
            </Row>
            <Row label="청구할인카드" hint="원/월"><Money value={d.cardDc} onChange={set('cardDc')} t="seller-card" label="청구할인카드" /></Row>
            <Row label="복지할인" hint="원/월"><Money value={d.welfareDc} onChange={set('welfareDc')} t="seller-welfare" label="복지할인" /></Row>
            <Row label="프로모션할인" hint="원/월"><Money value={d.promoDc} onChange={set('promoDc')} t="seller-promo" label="프로모션할인" /></Row>
            <Row label="부가서비스" hint={`${won(ADDONS[0].monthly)}/월 · ${ADDONS[0].keep}`}>
              <Toggle on={d.addon} onClick={() => set('addon')(!d.addon)} t="seller-addon" label="부가서비스" />
            </Row>
          </Panel>

          <Panel title="별도 청구" tag="개통 시 1회" t="seller-onetime-panel"
            foot={<FootRow label="별도 청구금액" value={won(q.oneTime)} t="seller-onetime" />}>
            <Row label="가입비"><Money value={d.joinFee} onChange={set('joinFee')} t="seller-joinfee" label="가입비" /></Row>
            <Row label="유심비"><Money value={d.usimFee} onChange={set('usimFee')} t="seller-usim" label="유심비" /></Row>
            {q.upfront > 0 && <Row label="일시불 결제액"><Value>{won(q.upfront)}</Value></Row>}
          </Panel>
        </div>

        {/* ── 오른쪽: 수당(R/B) → 월 납부요금정보(A+B) ── */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--gnb-h,111px)+16px)]" data-t="seller-right">
          <div className="print:hidden" data-t="seller-rb">
            <RbPanel kind="phone" deviceId={d.deviceId} join={d.join} support={rb.customer} planId={d.planId} compact />
          </div>

          <section className="rounded-card bg-white p-4 shadow-card sm:p-5" data-t="seller-summary">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-extrabold text-bink">월 납부요금정보 <span className="text-primary-text">(A+B)</span></h2>
              <span className="rounded-full bg-brow px-2 py-0.5 text-[10.5px] font-bold text-bmuted">VAT 포함</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[12.5px] font-semibold text-bmuted">월 청구금액</span>
              <span className="tnum text-[26px] font-extrabold tracking-[-0.5px] text-primary-text" data-t="seller-total">{won(q.total)}</span>
            </div>
            <dl className="mt-2 divide-y divide-brow rounded-field bg-bbg px-3 text-[12.5px]">
              <Line k="A 단말 할부금" v={q.months ? won(q.deviceMonthly) : '일시불'} />
              <Line k="B 월요금" v={won(q.planMonthly)} />
              {q.addonFee > 0 && <Line k="부가서비스" v={won(q.addonFee)} />}
              <Line k="24개월 총 납부" v={won(q.total24)} />
              {q.oneTime > 0 && <Line k="개통 시 별도" v={won(q.oneTime)} />}
            </dl>
            {alt && (
              <p className="mt-2.5 text-[11.5px] leading-4 text-bbody" data-t="seller-compare">
                {alt.diff > 0
                  ? <>지금 <b className="text-ok">{methodLabel}</b>이 {alt.method === 'select' ? '선택약정' : '단말지원'}보다 24개월 <b className="text-ok">{won(alt.diff)}</b> 유리해요</>
                  : alt.diff < 0
                    ? <><b className="text-warn">{alt.method === 'select' ? '선택약정' : '단말지원'}</b>으로 바꾸면 24개월 <b className="text-warn">{won(-alt.diff)}</b> 더 싸요</>
                    : <>단말지원과 선택약정의 24개월 총액이 같아요</>}
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-2 print:hidden">
              <Link to="/consult?cat=phone" state={{ quote: { type: 'phone', total: q.total, gift: q.publicSupport + q.aSum, label: `${device.short}${q.storage ? ` ${q.storage}` : ''} · ${joinLabel} · ${methodLabel} · ${q.plan.name}${q.months ? ` · ${q.months}개월` : ' · 일시불'} → 월 ${won(q.total)}` } }}
                className="inline-flex h-11 items-center justify-center rounded-btn bg-primary text-[14px] font-bold text-white hover:bg-primary-hover" data-t="seller-submit">
                이 설계로 가입 접수
              </Link>
            </div>
            <p className="mt-2.5 text-[10.5px] leading-4 text-bfaint">{LEGAL.quote} 인쇄·견적 복사에는 수당(R/B)이 포함되지 않아요.</p>
          </section>
        </div>
      </div>

      {/* 모바일 하단 고정 — 입력하는 동안 결과(월 납부 · 내 수당)를 계속 보이게 */}
      <div data-bottom-bar className="safe-b fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 rounded-t-card bg-white px-5 pb-3 pt-3 shadow-bottombar lg:hidden print:hidden">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-bmuted">월 청구금액</div>
          <div className="tnum text-[18px] font-extrabold text-primary-text">{won(q.total)}</div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[11px] font-semibold text-bmuted">{rb.mineLabel}</div>
          <div className="tnum text-[16px] font-extrabold text-bindigo" data-t="seller-bar-mine">{won(rb.mine)}</div>
        </div>
        <button type="button" onClick={save} className="h-11 shrink-0 rounded-btn bg-bink px-4 text-[13.5px] font-bold text-white">저장</button>
      </div>
    </main>
  )
}

// ── 조각들 ─────────────────────────────────────────────────────────────
function Panel({ title, tag, t, foot, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-card bg-white shadow-card" data-t={t}>
      <div className="flex items-center gap-2 border-b border-brow bg-bbg px-4 py-2.5">
        <h2 className="text-[14px] font-extrabold text-bink">{title}</h2>
        {tag && <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10.5px] font-extrabold text-white">{tag}</span>}
      </div>
      <div className="divide-y divide-brow px-4">{children}</div>
      {foot}
    </section>
  )
}
// stack — 버튼 묶음·드롭다운 줄은 폰(sm 미만)에서 라벨 아래로 내려 폭을 다 쓴다(좁은 칸에서 버튼이 두세 줄로 흩어지지 않게)
function Row({ label, hint, warn, stack, children }) {
  return (
    <div className={`flex py-2.5 ${stack ? 'flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3' : 'items-center justify-between gap-3'}`}>
      <div className={`min-w-0 shrink-0 ${stack ? 'sm:basis-[34%]' : 'basis-[34%]'}`}>
        <div className="text-[13px] font-bold text-bbody">{label}</div>
        {hint && <div className={`mt-0.5 text-[10.5px] leading-[1.35] ${warn ? 'font-bold text-warn' : 'text-bfaint'}`}>{hint}</div>}
      </div>
      <div className={`flex min-w-0 flex-1 ${stack ? 'sm:justify-end' : 'justify-end'}`}>{children}</div>
    </div>
  )
}
function FootRow({ label, value, t }) {
  return (
    <div className="flex items-center justify-between bg-tint px-4 py-3">
      <span className="text-[13.5px] font-extrabold text-bink">{label}</span>
      <span className="tnum text-[18px] font-extrabold text-primary-text" data-t={t}>{value}</span>
    </div>
  )
}
function Value({ children, strong, tone, t }) {
  const c = tone === 'ok' ? 'text-ok' : strong ? 'text-bink' : 'text-bbody'
  return <span className={`tnum text-right text-[14px] ${strong ? 'font-extrabold' : 'font-bold'} ${c}`} data-t={t}>{children}</span>
}
function Line({ k, v }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-bbody">{k}</dt>
      <dd className="tnum font-bold text-bink">{v}</dd>
    </div>
  )
}
// 금액 입력 — 숫자만 받고 쉼표로 보여 준다. 판매자가 넣는 칸은 전부 이걸 쓴다.
function Money({ value, onChange, t, label }) {
  const id = useId()
  const n = Number(value) || 0
  return (
    <div className="flex w-full max-w-[170px] items-center rounded-field border border-bline bg-white focus-within:border-primary">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input id={id} inputMode="numeric" autoComplete="off" data-t={t} value={n ? n.toLocaleString('ko-KR') : ''} placeholder="0"
        onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
        className="tnum h-10 min-w-0 flex-1 bg-transparent px-3 text-right text-[14px] font-bold text-bink placeholder:text-bfaint" />
      <span className="pr-3 text-[12px] font-semibold text-bmuted">원</span>
    </div>
  )
}
function Select({ value, onChange, options, t, label }) {
  const id = useId()
  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} data-t={t}
        className="h-10 w-full min-w-0 truncate rounded-field border border-bline bg-white px-3 text-[13.5px] font-bold text-bink focus:border-primary sm:max-w-[240px]">
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </>
  )
}
function Seg({ value, onChange, options, t }) {
  return (
    <div className="grid w-full auto-cols-fr grid-flow-col gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
      {options.map((o) => (
        <button key={o.key} type="button" data-t={t} data-id={o.key} disabled={o.disabled} aria-pressed={value === o.key}
          title={o.disabled ? '가격표에 없는 조합입니다' : undefined} onClick={() => onChange(o.key)}
          className={`h-10 rounded-field border px-2.5 text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${value === o.key ? 'border-primary bg-primary text-white' : 'border-bline bg-white text-bbody hover:border-primary/60'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
function Toggle({ on, onClick, disabled, t, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled} onClick={onClick} data-t={t}
      className={`h-10 min-w-[84px] rounded-field border px-3 text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-primary bg-primary text-white' : 'border-bline bg-white text-bmuted'}`}>
      {on ? '적용' : '미적용'}
    </button>
  )
}
function ToolBtn({ onClick, t, children }) {
  return (
    <button type="button" onClick={onClick} data-t={t}
      className="h-10 rounded-field border border-bline bg-white px-3.5 text-[13px] font-bold text-bbody transition-colors hover:border-primary hover:text-primary-text">
      {children}
    </button>
  )
}
