// ─── S-03b 휴대폰 견적 계산기 (주다식 A+B) ───────────────────────
// 단말기 할부정보(A) + 요금정보(B) → 월 납부요금(A+B). 단말지원 vs 선택약정 자동 비교.
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PHONE_DEVICES, PHONE_PLANS, JOIN_TYPES, INSTALLMENT_MONTHS, calcPhoneQuote, compareMethods } from '../../lib/phones'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

export default function PhoneCalculator() {
  const nav = useNavigate()
  const [deviceId, setDeviceId] = useState('fold8')
  const [planId, setPlanId] = useState('choice110')
  const [join, setJoin] = useState('mnp')
  const [method, setMethod] = useState('support')
  const [months, setMonths] = useState(24)
  const [extra15, setExtra15] = useState(true)

  const q = useMemo(() => calcPhoneQuote({ deviceId, planId, join, method, months, extra15 }), [deviceId, planId, join, method, months, extra15])
  const cmp = useMemo(() => compareMethods({ deviceId, planId, join, months, extra15 }), [deviceId, planId, join, months, extra15])

  const goConsult = () => nav('/consult?cat=phone', {
    state: { quote: {
      type: 'phone', total: q.total, gift: q.publicSupport + q.extraSupport,
      label: `${q.device.short} · ${JOIN_TYPES.find((j) => j.key === join)?.label} · ${q.plan.name}${q.months ? ` · ${q.months}개월` : ' · 일시불'} → 월 ${won(q.total)}`,
    } },
  })

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <CalcTabs active="phone" />
        <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">휴대폰 견적 계산기</h1>
        <p className="mt-1.5 text-[14px] text-muted sm:text-[15px]">단말 할부금(A)과 요금(B)을 나눠 보여드려요 — 공시지원금과 선택약정 중 유리한 쪽도 자동 비교!</p>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          {/* A. 단말기 */}
          <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-[26px] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-extrabold text-white">A</span>
              <h2 className="text-[16px] font-bold text-ink">단말기 할부정보</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PHONE_DEVICES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDeviceId(d.id)}
                  className={`relative flex flex-col rounded-btn border p-3.5 text-left transition-all ${deviceId === d.id ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
                >
                  <span className={`absolute right-3 top-3 h-[18px] w-[18px] rounded-full ${deviceId === d.id ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
                  <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-orange-text w-fit">{d.tag}</span>
                  <span className="mt-2 text-[13.5px] font-bold leading-5 text-ink">{d.short}</span>
                  <span className="tnum mt-1 text-[11.5px] text-faint">출고가 {won(d.price)}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-faint">{q.device.name} — {q.device.spec}</p>

            {/* 가입 유형 */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {JOIN_TYPES.map((j) => (
                <button key={j.key} onClick={() => setJoin(j.key)} className={`h-11 rounded-field border text-[13.5px] font-bold transition-colors ${join === j.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/50'}`}>
                  {j.label}
                </button>
              ))}
            </div>

            {/* 단말지원 vs 선택약정 */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[{ k: 'support', l: '단말지원 (공시지원금)' }, { k: 'select', l: '선택약정 (요금 25%↓)' }].map((m) => (
                <button key={m.k} onClick={() => setMethod(m.k)} className={`relative h-12 rounded-field border text-[13.5px] font-bold transition-colors ${method === m.k ? 'border-primary bg-tint text-primary-text' : 'border-line bg-white text-label hover:border-primary/50'}`}>
                  {m.l}
                  {cmp.better === m.k && (
                    <span className="absolute -top-2 right-2 rounded-full bg-ok px-2 py-0.5 text-[10px] font-extrabold text-white">유리 ✓</span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] font-semibold text-ok">
              지금 조건에선 {cmp.better === 'support' ? '단말지원' : '선택약정'}이 {cmp.months}개월 총액 기준 약 {won(cmp.diff)} 유리해요
            </p>

            {/* 할부개월 + 추가지원 */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[12.5px] font-semibold text-label">할부개월 <span className="text-faint">(연 5.9% 원리금균등)</span></div>
                <div className="grid grid-cols-4 gap-1.5">
                  {INSTALLMENT_MONTHS.map((m) => (
                    <button key={m.key} onClick={() => setMonths(m.key)} className={`h-10 rounded-field border text-[12.5px] font-bold ${months === m.key ? 'border-primary bg-tint text-primary-text' : 'border-line text-label hover:border-primary/50'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setExtra15(!extra15)}
                disabled={method !== 'support'}
                className={`flex items-center justify-between rounded-field border px-4 py-2.5 text-left transition-colors disabled:opacity-40 ${extra15 && method === 'support' ? 'border-primary bg-tint' : 'border-line bg-white'}`}
              >
                <div>
                  <div className="text-[13px] font-bold text-ink">매장 추가지원금 적용</div>
                  <div className="text-[11px] text-faint">공시지원금의 15% (법정 한도)</div>
                </div>
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[13px] text-white ${extra15 && method === 'support' ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
              </button>
            </div>
          </section>

          {/* B. 요금제 */}
          <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-[26px] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-extrabold text-white">B</span>
              <h2 className="text-[16px] font-bold text-ink">요금정보</h2>
            </div>
            <div className="flex flex-col gap-2">
              {PHONE_PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanId(p.id)}
                  className={`flex items-center justify-between rounded-btn border p-4 text-left transition-all ${planId === p.id ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-[18px] w-[18px] shrink-0 rounded-full ${planId === p.id ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
                    <div>
                      <div className="text-[14px] font-bold text-ink">{p.name}</div>
                      <div className="text-[11.5px] text-faint">{p.desc}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum text-[14px] font-extrabold text-ink">{won(p.monthly)}<span className="text-[11px] font-semibold text-faint">/월</span></div>
                    {method === 'select' && <div className="tnum text-[11px] font-bold text-ok">약정 시 {won(Math.round(p.monthly * 0.75))}</div>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 모바일 전용 — A+B 분해 (데스크톱은 우측 스티키 카드) */}
          <section className="rounded-card bg-white p-5 shadow-card lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-ink">월 납부요금정보 (A+B)</span>
              <span className="rounded-full bg-brow px-2 py-0.5 text-[10.5px] font-bold text-bmuted">VAT 포함</span>
            </div>
            <div className="mt-3 rounded-field bg-cream/70 p-3.5 text-[13px]">
              <div className="mb-1 text-[11.5px] font-extrabold text-primary-text">A. 단말 할부금</div>
              <Row l="출고가" v={won(q.device.price)} />
              <Row l="공통지원금" v={q.publicSupport ? `−${won(q.publicSupport)}` : '미적용'} accent={q.publicSupport ? 'text-ok' : 'text-disabled'} />
              <Row l="추가지원금(15%)" v={q.extraSupport ? `−${won(q.extraSupport)}` : '미적용'} accent={q.extraSupport ? 'text-ok' : 'text-disabled'} />
              <Row l="할부원금" v={won(q.principal)} bold />
              {q.months > 0 && <Row l={`할부수수료(${q.months}개월)`} v={`+${won(q.interest)}`} accent="text-orange-text" />}
              {q.upfront > 0 && <Row l="일시불 결제액" v={won(q.upfront)} bold />}
              <div className="mt-1.5 flex justify-between border-t border-line pt-1.5">
                <span className="font-bold text-ink">월 단말 할부금</span>
                <span className="tnum font-extrabold text-ink">{q.months > 0 ? won(q.deviceMonthly) : '일시불'}</span>
              </div>
            </div>
            <div className="mt-2 rounded-field bg-cream/70 p-3.5 text-[13px]">
              <div className="mb-1 text-[11.5px] font-extrabold text-primary-text">B. 월 요금</div>
              <Row l={q.plan.name} v={won(q.plan.monthly)} />
              {q.planDiscount > 0 && <Row l="선택약정 할인(25%)" v={`−${won(q.planDiscount)}`} accent="text-ok" />}
            </div>
            <p className="mt-2.5 text-[11px] leading-4 text-disabled">{LEGAL.quote} 공시일 기준 지원금은 변동될 수 있습니다.</p>
          </section>
        </div>

        {/* 우: 스티키 A+B 합계 */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-faint">월 납부요금정보 (A+B)</span>
            <span className="rounded-full bg-brow px-2 py-0.5 text-[10.5px] font-bold text-bmuted">VAT 포함</span>
          </div>
          <div className="mt-1 text-[15px] font-bold text-ink">{q.device.short} · {JOIN_TYPES.find((j) => j.key === join)?.label}</div>

          <div className="mt-4 rounded-field bg-cream/70 p-3.5 text-[13px]">
            <div className="mb-1 text-[11.5px] font-extrabold text-primary-text">A. 단말 할부금</div>
            <Row l="출고가" v={won(q.device.price)} />
            <Row l="공통지원금" v={q.publicSupport ? `−${won(q.publicSupport)}` : '미적용'} accent={q.publicSupport ? 'text-ok' : 'text-disabled'} />
            <Row l="추가지원금(15%)" v={q.extraSupport ? `−${won(q.extraSupport)}` : '미적용'} accent={q.extraSupport ? 'text-ok' : 'text-disabled'} />
            <Row l="할부원금" v={won(q.principal)} bold />
            {q.months > 0 && <Row l={`할부수수료(${q.months}개월)`} v={`+${won(q.interest)}`} accent="text-orange-text" />}
            <div className="mt-1.5 flex justify-between border-t border-line pt-1.5">
              <span className="font-bold text-ink">월 단말 할부금</span>
              <span className="tnum font-extrabold text-ink">{q.months > 0 ? won(q.deviceMonthly) : '일시불'}</span>
            </div>
            {q.upfront > 0 && <Row l="일시불 결제액" v={won(q.upfront)} bold />}
          </div>

          <div className="mt-2.5 rounded-field bg-cream/70 p-3.5 text-[13px]">
            <div className="mb-1 text-[11.5px] font-extrabold text-primary-text">B. 월 요금</div>
            <Row l={q.plan.name} v={won(q.plan.monthly)} />
            {q.planDiscount > 0 && <Row l="선택약정 할인(25%)" v={`−${won(q.planDiscount)}`} accent="text-ok" />}
            <div className="mt-1.5 flex justify-between border-t border-line pt-1.5">
              <span className="font-bold text-ink">월 요금</span>
              <span className="tnum font-extrabold text-ink">{won(q.planMonthly)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-ink">월 납부금 (A+B)</span>
            <span className="tnum text-[32px] font-extrabold tracking-[-1px] text-primary-text">{won(q.total)}</span>
          </div>
          <div className="mt-1 text-right text-[11.5px] text-faint">{q.months > 0 ? `${q.months}개월 할부 기준` : '단말 일시불 + 월 요금'}</div>

          <button onClick={goConsult} className="mt-4 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-primary-hover">
            이 조건으로 상담 신청하기
          </button>
          <p className="mt-3 text-center text-[11.5px] leading-4 text-disabled">{LEGAL.quote} 공시일 기준 지원금은 변동될 수 있습니다.</p>
        </aside>
      </div>

      {/* 모바일 하단 고정 바 */}
      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-4 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-faint">월 납부금 (A+B)</div>
            <div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.total)}</div>
          </div>
          <div className="text-right text-[11px] leading-4 text-faint">
            단말 {q.months > 0 ? won(q.deviceMonthly) : '일시불'}<br />요금 {won(q.planMonthly)}
          </div>
        </div>
        <button onClick={goConsult} className="mt-3 h-12 w-full rounded-btn bg-primary text-[15px] font-bold text-white">이 조건으로 상담 신청하기</button>
      </div>
    </main>
  )
}

export function CalcTabs({ active }) {
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-card">
      <Link to="/calculator" className={`flex h-9 items-center rounded-full px-4 text-[13px] font-bold transition-colors ${active === 'internet' ? 'bg-primary text-white' : 'text-label hover:text-primary-text'}`}>
        인터넷/TV
      </Link>
      <Link to="/calculator/phone" className={`flex h-9 items-center rounded-full px-4 text-[13px] font-bold transition-colors ${active === 'phone' ? 'bg-primary text-white' : 'text-label hover:text-primary-text'}`}>
        휴대폰
      </Link>
    </div>
  )
}

function Row({ l, v, accent = 'text-ink', bold }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={bold ? 'font-bold text-label' : 'text-label'}>{l}</span>
      <span className={`tnum ${bold ? 'font-extrabold' : 'font-bold'} ${accent}`}>{v}</span>
    </div>
  )
}
