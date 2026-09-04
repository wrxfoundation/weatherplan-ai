// ─── 휴대폰 상세 — 색상·할인방법·할부개월·파손보험 → 우측 월 납부 예상(VAT 포함) ──
// 아정당 상세 구조를 그대로: 좌측에서 고르면 우측 카드가 "휴대폰 월 납부금(할부원금 분해) +
// 요금제(+부가) = 월 납부 예상 금액"으로 즉시 다시 선다. 계산은 lib/phones.js 한 곳.
// 신청하기 → AI / 전문 상담사(평일 18시까지) 갈림길.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { phoneDevice, PHONE_PLANS, JOIN_TYPES, INSTALLMENT_MONTHS, INSURANCE, ADDONS, MNO, calcPhoneQuote, compareMethods, bestOffer } from '../../lib/phones'
import { PHONE_CARRIERS } from '../../lib/onboard'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import ApplyChoiceModal from '../../components/ApplyChoiceModal'
import { PhoneArt, CUR_OPTIONS } from './PhoneShop'

const MARK = Object.fromEntries(PHONE_CARRIERS.map((c) => [c.key, c]))

export default function PhoneDetail() {
  const { model } = useParams()
  return <PhoneDetailInner key={model} />
}

function PhoneDetailInner() {
  const { model } = useParams()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const device = phoneDevice(model)
  const cur = sp.get('cur') ?? ''
  const curMno = MNO.includes(cur) ? cur : ''

  // 기본값은 AI 추천(현 통신사 기준 최저) — 사용자가 통신사를 바꾸면 가입유형이 따라 바뀐다
  const rec = useMemo(() => bestOffer({ deviceId: device.id, cur: curMno, storage: sp.get('storage') }), [device.id, curMno]) // eslint-disable-line react-hooks/exhaustive-deps
  // 카드에서 특정 통신사 줄을 눌러 들어오면 그 조건으로 연다. 없으면 AI 추천(최저)이 기본.
  const qCarrier = MNO.includes(sp.get('carrier')) ? sp.get('carrier') : null
  const qJoin = JOIN_TYPES.some((j) => j.key === sp.get('join')) ? sp.get('join') : null
  const [carrier, setCarrier] = useState(qCarrier ?? rec.best.carrier)
  const [join, setJoin] = useState(qJoin ?? rec.best.join)
  const [storage, setStorage] = useState(device.storages.some((s) => s.key === sp.get('storage')) ? sp.get('storage') : device.storages[0].key)
  const [color, setColor] = useState(device.colors[0].name)
  const [method, setMethod] = useState('support')
  const [months, setMonths] = useState(24)
  const [insurance, setInsurance] = useState(true)
  const [planId, setPlanId] = useState('choice90')
  const [addon, setAddon] = useState(false)
  const [ask, setAsk] = useState(false)

  const pickCarrier = (c) => { setCarrier(c); setJoin(curMno ? (curMno === c ? 'chg' : 'mnp') : 'mnp') }

  const q = useMemo(() => calcPhoneQuote({ deviceId: device.id, planId, join, method, months, extra15: true, storage, carrier, insurance, addon }),
    [device.id, planId, join, method, months, storage, carrier, insurance, addon])
  const cmp = useMemo(() => compareMethods({ deviceId: device.id, planId, join, months, extra15: true }), [device.id, planId, join, months])
  const joinLabel = JOIN_TYPES.find((j) => j.key === join)?.label
  const label = `${device.short} ${storage} ${color} · ${carrier} ${joinLabel} · ${q.plan.name} · ${months ? `${months}개월` : '일시불'}${method === 'select' ? ' · 선택약정' : ' · 공통지원금'}`
  const quote = { type: 'phone', label: `${label} → 월 ${won(q.total)}`, total: q.total, gift: q.publicSupport + q.extraSupport, device: device.id, storage, color, carrier, join, method, months, planId, insurance, addon }
  const seed = `${label} 조건으로 월 ${won(q.total)} 나왔어요. 이 조건이 저한테 맞는지, 더 줄일 데가 있는지 봐주세요.`

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <nav className="text-[12px] text-faint"><Link to="/category/phone" className="hover:text-primary-text">휴대폰</Link> › <Link to={`/phone/shop${cur ? `?cur=${cur}` : ''}`} className="hover:text-primary-text">온라인 구매</Link> › {device.short}</nav>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <h1 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">{device.short}</h1>
          <span className="rounded-full bg-orange-tint px-2.5 py-1 text-[11.5px] font-bold text-orange-text">{device.tag}</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">{device.spec}</p>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          {/* 이용할 통신사 + 가입유형 */}
          <Sec title="이용할 통신사" sub={curMno ? `${curMno} 사용 중 기준` : cur === 'mvno' ? '알뜰폰 사용 중 → 3사 모두 번호이동' : '지금 쓰는 통신사를 고르면 추천이 정확해져요'}>
            <div className="grid grid-cols-3 gap-2" data-t="detail-carriers">
              {MNO.map((c) => {
                const o = rec.offers.find((x) => x.carrier === c)
                return (
                  <button key={c} onClick={() => pickCarrier(c)} aria-pressed={carrier === c}
                    className={`relative flex h-[64px] flex-col items-center justify-center rounded-btn border transition-colors ${carrier === c ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                    <span className="text-[16px] font-black" style={{ color: MARK[c]?.color }}>{MARK[c]?.mark}</span>
                    <span className="tnum text-[11px] font-semibold text-label">월 {won(o?.total ?? 0)}</span>
                    {rec.best.carrier === c && <span className="absolute -top-2 right-2 rounded-full bg-ok px-2 py-0.5 text-[10px] font-extrabold text-white">AI 추천</span>}
                  </button>
                )
              })}
            </div>
            <div className="mt-2.5 rounded-field bg-cream/70 px-3.5 py-2.5 text-[12.5px] leading-5 text-label" data-t="detail-join-note">
              <b className="text-ink">{carrier} {joinLabel}</b> — {join === 'mnp' ? '쓰던 번호 그대로, 통신사만 변경' : join === 'chg' ? '번호·통신사 유지, 기기만 변경' : '새 번호로 개통'}
              {rec.stay && rec.saving > 0 && rec.best.carrier === carrier && <span className="text-ok"> · {rec.stay.carrier} 기기변경보다 월 {won(rec.saving)} 저렴</span>}
              {join === 'mnp' && <span className="block text-[11px] text-faint">번호이동 시 개통이 최대 2주까지 걸릴 수 있어요.</span>}
            </div>
            <div className="mt-2 flex gap-1.5">
              {JOIN_TYPES.map((j) => (
                <button key={j.key} onClick={() => setJoin(j.key)} aria-pressed={join === j.key}
                  className={`h-8 rounded-full border px-3 text-[12px] font-bold transition-colors ${join === j.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
                  {j.label}
                </button>
              ))}
            </div>
            {!curMno && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-faint">
                지금 쓰는 통신사:
                {CUR_OPTIONS.map((c) => (
                  <button key={c.key} onClick={() => nav(`/phone/shop/${device.id}?cur=${c.key}&storage=${storage}`, { replace: true })} className="rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-bold text-label hover:border-primary hover:text-primary-text">{c.label}</button>
                ))}
              </div>
            )}
          </Sec>

          {/* 색상 · 용량 */}
          <Sec title="색상" sub={color}>
            <div className="flex gap-2.5" data-t="detail-colors">
              {device.colors.map((c) => (
                <button key={c.name} onClick={() => setColor(c.name)} aria-pressed={color === c.name} aria-label={c.name} title={c.name}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${color === c.name ? 'border-primary scale-110' : 'border-transparent hover:border-line'}`}>
                  <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
            <div className="mt-3 text-[12.5px] font-bold text-label">용량</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5" data-t="detail-storage">
              {device.storages.map((s) => (
                <button key={s.key} onClick={() => setStorage(s.key)} aria-pressed={storage === s.key}
                  className={`h-9 rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${storage === s.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
                  {s.key} <span className={`tnum text-[10.5px] ${storage === s.key ? 'opacity-80' : 'text-faint'}`}>{won(s.price)}</span>
                </button>
              ))}
            </div>
          </Sec>

          {/* 할인방법 */}
          <Sec title="할인방법" sub={`지금 조건에선 ${cmp.better === 'support' ? '공통지원금' : '선택약정'}이 ${cmp.months}개월 총액 기준 약 ${won(cmp.diff)} 유리해요`}>
            <div className="grid gap-2 sm:grid-cols-2" data-t="detail-method">
              {[{ k: 'support', t: '공통지원금', d: '단말기 기기값을 할인받아요 (구 공시지원금)' }, { k: 'select', t: '선택약정', d: '요금제에서 25% 할인 받아요' }].map((m) => (
                <button key={m.k} onClick={() => setMethod(m.k)} aria-pressed={method === m.k}
                  className={`relative rounded-btn border p-3.5 text-left transition-colors ${method === m.k ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <div className={`text-[14px] font-bold ${method === m.k ? 'text-primary-text' : 'text-ink'}`}>{m.t}</div>
                  <div className="mt-0.5 text-[11.5px] text-faint">{m.d}</div>
                  {cmp.better === m.k && <span className="absolute -top-2 right-2 rounded-full bg-ok px-2 py-0.5 text-[10px] font-extrabold text-white">유리 ✓</span>}
                </button>
              ))}
            </div>
          </Sec>

          {/* 할부개월 · 파손보험 */}
          <Sec title="단말기 할부 개월" sub="연 5.9% 원리금균등">
            <div className="grid grid-cols-4 gap-1.5" data-t="detail-months">
              {INSTALLMENT_MONTHS.map((m) => (
                <button key={m.key} onClick={() => setMonths(m.key)} aria-pressed={months === m.key}
                  className={`h-11 rounded-field border text-[13px] font-bold transition-colors ${months === m.key ? 'border-primary bg-tint text-primary-text' : 'border-line bg-white text-label hover:border-primary/50'}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="mt-3 text-[12.5px] font-bold text-label">파손보험 <span className="ml-1 rounded bg-tint px-1.5 py-0.5 text-[10px] font-bold text-primary-text">모두온 전용 혜택</span></div>
            <button onClick={() => setInsurance(!insurance)} aria-pressed={insurance} data-t="detail-insurance"
              className={`mt-1.5 flex w-full items-center justify-between rounded-field border px-3.5 py-2.5 text-left transition-colors ${insurance ? 'border-primary bg-tint' : 'border-line bg-white'}`}>
              <span>
                <span className="block text-[13px] font-bold text-ink">{INSURANCE.label} 가입</span>
                <span className="block text-[11px] text-faint">가입 부담금 <s className="tnum">{won(INSURANCE.once)}</s> → <b className="text-ok">무료</b> · {INSURANCE.waivedLabel}</span>
              </span>
              <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[13px] text-white ${insurance ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
            </button>
          </Sec>

          {/* 요금제 · 부가 */}
          <Sec title="요금제" sub="185일 유지 후 변경 가능">
            <div className="flex flex-col gap-2" data-t="detail-plans">
              {PHONE_PLANS.map((p) => (
                <button key={p.id} onClick={() => setPlanId(p.id)} aria-pressed={planId === p.id}
                  className={`flex items-center justify-between rounded-btn border p-3.5 text-left transition-colors ${planId === p.id ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <span><span className="block text-[14px] font-bold text-ink">{p.name}</span><span className="block text-[11.5px] text-faint">{p.desc}</span></span>
                  <span className="text-right"><span className="tnum block text-[14px] font-extrabold text-ink">{won(p.monthly)}<span className="text-[11px] font-semibold text-faint">/월</span></span>{method === 'select' && <span className="tnum block text-[11px] font-bold text-ok">약정 시 {won(Math.round(p.monthly * 0.75))}</span>}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddon(!addon)} aria-pressed={addon} data-t="detail-addon"
              className={`mt-2.5 flex w-full items-center justify-between rounded-field border px-3.5 py-2.5 text-left transition-colors ${addon ? 'border-primary bg-tint' : 'border-line bg-white'}`}>
              <span><span className="block text-[13px] font-bold text-ink">{ADDONS[0].name} <span className="text-[11px] font-semibold text-faint">(선택)</span></span><span className="block text-[11px] text-faint">월 {won(ADDONS[0].monthly)} · {ADDONS[0].keep}</span></span>
              <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[13px] text-white ${addon ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
            </button>
          </Sec>
        </div>

        {/* 우: 아정당식 월 납부 카드 */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block" data-t="detail-card">
          <PriceCard device={device} storage={storage} setStorage={setStorage} q={q} months={months} onApply={() => setAsk(true)} />
        </aside>
      </div>

      {/* 모바일: 카드 본문 + 하단 고정 바 */}
      <section className="mt-4 rounded-section bg-white p-5 shadow-panel lg:hidden">
        <PriceCard device={device} storage={storage} setStorage={setStorage} q={q} months={months} onApply={() => setAsk(true)} compact />
      </section>
      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-3 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] font-semibold text-faint">월 납부 예상 <span className="rounded bg-brow px-1.5 text-[10px] font-bold text-bmuted">VAT 포함</span></div><div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.total)}</div></div>
          <button onClick={() => setAsk(true)} className="h-12 rounded-btn bg-primary px-8 text-[15px] font-extrabold text-white">신청하기</button>
        </div>
      </div>

      <ApplyChoiceModal open={ask} onClose={() => setAsk(false)} summary={`${label} → 월 ${won(q.total)} (VAT 포함)`} seed={seed} consultTo="/consult?cat=phone" consultState={{ quote }} />
    </main>
  )
}

function PriceCard({ device, storage, setStorage, q, months, onApply, compact }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[15.5px] font-extrabold text-ink">{device.short}</div>
        <select value={storage} onChange={(e) => setStorage(e.target.value)} aria-label="용량" className="h-8 rounded-field border border-line bg-white px-2 text-[12.5px] font-bold text-label">
          {device.storages.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
        </select>
      </div>
      {!compact && <PhoneArt brand={device.brand} color={device.colors[0].hex} size={72} />}

      <div className="mt-3 rounded-field bg-cream/70 p-3.5 text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-ink">휴대폰 월 납부금 <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-label">{months ? `${months}개월` : '일시불'}</span></span>
          <span className="tnum text-[16px] font-extrabold text-ink" data-t="card-device">{months ? won(q.deviceMonthly) : '일시불'}</span>
        </div>
        <Row l="할부원금" v={won(q.principal)} bold />
        <Row l="출고가" v={won(q.price)} sub />
        <Row l="공통지원금" v={q.publicSupport ? `−${won(q.publicSupport)}` : '미적용'} accent={q.publicSupport ? 'text-primary-text' : 'text-disabled'} sub />
        <Row l="추가지원금" v={q.extraSupport ? `−${won(q.extraSupport)}` : '미적용'} accent={q.extraSupport ? 'text-primary-text' : 'text-disabled'} sub />
        {months > 0 && <Row l="단말기 총 할부이자" v={won(q.interest)} />}
        {q.upfront > 0 && <Row l="일시불 결제액" v={won(q.upfront)} bold />}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-label">{INSURANCE.label} <span className="rounded bg-tint px-1 text-[9.5px] font-bold text-primary-text">모두온 전용</span></span>
          <span className="tnum">{q.insurance ? <><s className="text-faint">{won(INSURANCE.once)}</s> <b className="text-primary-text">무료</b></> : <span className="text-disabled">미가입</span>}</span>
        </div>
      </div>

      <div className="mt-2 rounded-field bg-cream/70 p-3.5 text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-ink">요금제</span>
          <span className="tnum text-[16px] font-extrabold text-ink" data-t="card-plan">{won(q.planMonthly + q.addonFee)}</span>
        </div>
        <Row l={<>{q.plan.name} <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-label">185일 유지</span></>} v={won(q.plan.monthly)} />
        {q.planDiscount > 0 && <Row l="선택약정 할인 25%" v={`−${won(q.planDiscount)}`} accent="text-primary-text" sub />}
        {q.addonFee > 0 && <Row l={ADDONS[0].name} v={won(q.addonFee)} sub />}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[14px] font-bold text-ink">월 납부 예상 금액 <span className="rounded bg-brow px-1.5 py-0.5 text-[10px] font-bold text-bmuted">VAT 포함</span></span>
        <span className="tnum text-[30px] font-extrabold tracking-[-1px] text-primary-text" data-t="card-total">{won(q.total)}</span>
      </div>
      <button onClick={onApply} data-t="card-apply" className="shimmer-cta glass-btn-cta mt-4 h-[52px] w-full rounded-btn bg-primary text-[15.5px] font-extrabold text-white transition-colors hover:bg-primary-hover">신청하기</button>
      <p className="mt-3 text-center text-[11px] leading-4 text-label">{LEGAL.quote} 공시일 기준 지원금은 변동될 수 있습니다.</p>
    </>
  )
}

function Sec({ title, sub, children }) {
  return (
    <section className="rounded-card bg-white p-5 shadow-card sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <h2 className="text-[15.5px] font-bold text-ink">{title}</h2>
        {sub && <span className="text-[11.5px] text-faint">{sub}</span>}
      </div>
      {children}
    </section>
  )
}
function Row({ l, v, accent = 'text-ink', bold, sub }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${sub ? 'pl-3' : ''}`}>
      <span className={`${sub ? 'text-[12px] text-faint' : bold ? 'font-bold text-label' : 'text-label'}`}>{l}</span>
      <span className={`tnum ${sub ? 'text-[12px]' : ''} ${bold ? 'font-extrabold' : 'font-bold'} ${accent}`}>{v}</span>
    </div>
  )
}
