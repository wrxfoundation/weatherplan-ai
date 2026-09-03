// ─── 인터넷 셀프견적 빌더 (아정당식 4필터 + 우측 요금 요약) ─────────────────
// 좌 2/3: ① 통신사 ② 조합(단독/인터넷+TV, +전화) ③ 속도(+공유기) ④ TV채널
// 우 1/3: 예상 월요금 · 기본요금 · 카드할인가 · 사은품 ~원 → 셀프가입 / AI 연결 / 전문상담원 연결
// 고를 때마다 우측이 즉시 다시 선다. 단가는 lib/internet.js 한 곳(제로노트 단가표 교체 지점).
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { INTERNET_CARRIERS, COMBOS, ADDON, tiersOf, tvTiersOf, calcInternet, internetLabel, internetQuery } from '../lib/internet'
import { won } from '../lib/engine'
import { LEGAL } from '../lib/constants'
import { IcGift, IcBulb } from './icons'

export default function InternetBuilder() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  // GNB(통신사별) · 공유 링크에서 같은 조건으로 연다
  const init = (k, d) => sp.get(k) ?? d
  const [carrier, setCarrier] = useState(INTERNET_CARRIERS.some((c) => c.key === init('carrier')) ? init('carrier') : 'KT')
  const [combo, setCombo] = useState(COMBOS.some((c) => c.key === init('combo')) ? init('combo') : 'net')
  const [speed, setSpeed] = useState(init('speed', '500M'))
  const [tv, setTv] = useState(init('tv', null))
  const [phone, setPhone] = useState(sp.get('phone') === '1')
  const [router, setRouter] = useState(sp.get('router') === '1')

  const tiers = tiersOf(carrier)
  const tvTiers = tvTiersOf(carrier)
  // 통신사를 바꾸면 그 통신사에 없는 속도·TV 티어는 대표값으로 되돌린다
  useEffect(() => {
    if (!tiers.some((t) => t.key === speed)) setSpeed(tiers[1]?.key ?? tiers[0].key)
    if (combo === 'net-tv' && !tvTiers.some((t) => t.key === tv)) setTv(tvTiers[0].key)
  }, [carrier]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (combo === 'net-tv' && !tv) setTv(tvTiers[0].key); if (combo === 'net') setTv(null) }, [combo]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = useMemo(() => calcInternet({ carrier, combo, speed, tv, phone, router }), [carrier, combo, speed, tv, phone, router])
  const label = internetLabel(q)
  const quote = { type: 'internet', label, total: q.total, gift: q.gift, carrier: q.carrier.name, speed, combo, tv, phone, router, cardTotal: q.cardTotal, base: q.base }
  const seed = `${label} 조건으로 월 ${won(q.total)} 나왔는데, 사은품 ${won(q.gift)}까지 포함하면 실제로 얼마나 유리한 건가요?`

  const goSelf = () => nav('/consult?cat=internet&mode=self&' + internetQuery({ carrier, combo, speed, tv, phone, router }), { state: { quote, mode: 'self' } })
  const goAI = () => window.dispatchEvent(new CustomEvent('moduon:chat-open', { detail: { seed } }))
  const goHuman = () => nav('/consult?cat=internet&' + internetQuery({ carrier, combo, speed, tv, phone, router }), { state: { quote } })

  const hint = combo === 'net' ? `TV를 함께 쓰면 결합 할인 월 ${won(5500)}에 사은품 +${won(50000)}` : !router && speed !== '1G' ? '1Gbps로 올리면 공유기 임대가 무료예요' : null

  return (
    <section className="mt-8" data-t="net-builder">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[19px] font-extrabold text-ink">조건만 고르면 월요금이 바로 나와요</h2>
          <p className="mt-1 text-[13px] text-muted">통신사 → 조합 → 속도 → 채널 순서로 고르면 오른쪽에 예상 월요금과 사은품이 섭니다.</p>
        </div>
        <span className="text-[11.5px] text-faint">3년 약정 · VAT 포함 · 대표 단가</span>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
        {/* ── 좌: 필터 4 ── */}
        <div className="flex flex-col gap-4">
          <Filter no={1} title="통신사" sub="어디로 하실지 아직이면 비교해 드릴게요">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" data-t="net-carriers">
              {INTERNET_CARRIERS.map((c) => (
                <button key={c.key} onClick={() => setCarrier(c.key)} aria-pressed={carrier === c.key}
                  className={`flex h-[78px] flex-col items-center justify-center gap-1 rounded-btn border transition-colors ${carrier === c.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <span className="text-[16px] font-black tracking-tight" style={{ color: c.color }}>{c.mark}</span>
                  <span className="text-[11.5px] font-semibold text-label">{c.sub}</span>
                  {c.budget && <span className="rounded bg-ok/10 px-1.5 text-[9.5px] font-bold text-ok">알뜰</span>}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.carrier.tags.map((t) => <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-label">{t}</span>)}
            </div>
          </Filter>

          <Filter no={2} title="조합 선택" sub="인터넷만 할지, TV까지 할지">
            <div className="grid grid-cols-2 gap-2" data-t="net-combos">
              {COMBOS.map((c) => (
                <button key={c.key} onClick={() => setCombo(c.key)} aria-pressed={combo === c.key}
                  className={`rounded-btn border p-3.5 text-left transition-colors ${combo === c.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <div className={`text-[14px] font-bold ${combo === c.key ? 'text-primary-text' : 'text-ink'}`}>{c.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-faint">{c.desc}</div>
                </button>
              ))}
            </div>
            <Check on={phone} onClick={() => setPhone(!phone)} label={ADDON.phone.label} sub={`${ADDON.phone.desc} · 월 +${won(ADDON.phone.monthly(carrier))}`} testId="net-phone" />
          </Filter>

          <Filter no={3} title="인터넷 속도" sub={`${q.carrier.name} 기준 단가`}>
            <div className="grid grid-cols-3 gap-2" data-t="net-speeds">
              {tiers.map((t) => (
                <button key={t.key} onClick={() => setSpeed(t.key)} aria-pressed={speed === t.key}
                  className={`flex flex-col items-start rounded-btn border p-3.5 text-left transition-colors ${speed === t.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <span className="text-[15px] font-extrabold text-ink">{t.label}</span>
                  <span className="tnum mt-0.5 text-[12.5px] font-bold text-label">{won(t.monthly)}<span className="text-[10.5px] font-semibold text-faint">/월</span></span>
                  <span className="mt-0.5 text-[10.5px] text-faint">{t.fit}</span>
                </button>
              ))}
            </div>
            <Check on={router} onClick={() => setRouter(!router)} label={ADDON.router.label}
              sub={speed === '1G' ? ADDON.router.freeNote : `${ADDON.router.desc} · 월 +${won(ADDON.router.monthly(carrier, speed))}`} testId="net-router" />
          </Filter>

          {combo === 'net-tv' && (
            <Filter no={4} title="TV 채널" sub={`${q.carrier.name} TV 요금제`}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-t="net-tv">
                {tvTiers.map((t) => (
                  <button key={t.key} onClick={() => setTv(t.key)} aria-pressed={tv === t.key}
                    className={`flex flex-col items-start rounded-btn border p-3.5 text-left transition-colors ${tv === t.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                    <span className="text-[14px] font-extrabold text-ink">{t.label}</span>
                    <span className="mt-0.5 text-[11.5px] text-label">{t.channels}개 채널</span>
                    <span className="tnum mt-0.5 text-[12.5px] font-bold text-label">{won(t.monthly)}<span className="text-[10.5px] font-semibold text-faint">/월</span></span>
                  </button>
                ))}
              </div>
            </Filter>
          )}
        </div>

        {/* ── 우: 요금 요약 (sticky) ── */}
        <aside className="lg:sticky lg:top-24 rounded-section bg-white p-5 shadow-panel sm:p-6" data-t="net-summary">
          <div className="text-[12.5px] font-semibold text-faint">나의 구성</div>
          <div className="mt-0.5 text-[14.5px] font-bold leading-5 text-ink">{label}</div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-ink">예상 월요금</span>
            <span className="tnum text-[32px] font-extrabold tracking-[-1px] text-primary-text" data-t="net-total">{won(q.total)}</span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5 rounded-field bg-cream/70 p-3.5 text-[13px]">
            <Row l="기본요금" v={won(q.base)} />
            {q.tvFee > 0 && <Row l={`TV ${q.tvTier.label}`} v={`+${won(q.tvFee)}`} />}
            {q.phone && <Row l="전화" v={`+${won(q.phoneFee)}`} />}
            {q.router && <Row l="공유기" v={q.routerFee ? `+${won(q.routerFee)}` : '무료'} accent={q.routerFee ? 'text-ink' : 'text-ok'} />}
            {q.comboDc > 0 && <Row l="인터넷+TV 결합 할인" v={`−${won(q.comboDc)}`} accent="text-ok" />}
            <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5">
              <span className="font-bold text-ink">카드할인가 <span className="text-[10.5px] font-semibold text-faint">제휴카드 −{won(q.cardDc)}</span></span>
              <span className="tnum font-extrabold text-ink" data-t="net-card">{won(q.cardTotal)}</span>
            </div>
          </div>

          <div className="mt-3 rounded-field bg-orange-tint px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-orange-text"><IcGift size={13} className="mr-1 inline -mt-0.5" />사은품</span>
              <span className="tnum text-[20px] font-extrabold text-orange-text" data-t="net-gift">{won(q.gift)}</span>
            </div>
            <div className="tnum mt-1 text-[11px] leading-4 text-orange-text/80">
              기본 {won(q.giftBase)}{q.giftCarrier ? ` + ${q.carrier.name} 가산 ${won(q.giftCarrier)}` : ''}{q.giftTv ? ` + TV ${won(q.giftTv)}` : ''}{q.giftPhone ? ` + 전화 ${won(q.giftPhone)}` : ''}
            </div>
          </div>
          {hint && <div className="mt-2 rounded-field bg-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-primary-text"><IcBulb size={13} className="mr-1 inline -mt-0.5" />{hint}</div>}

          <div className="mt-4 grid gap-2">
            <button onClick={goSelf} data-t="net-self" className="shimmer-cta glass-btn-cta h-[52px] w-full rounded-btn bg-primary text-[15px] font-extrabold text-white transition-colors hover:bg-primary-hover">셀프가입</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={goAI} data-t="net-ai" className="glass-btn h-12 rounded-btn border-[1.5px] border-primary bg-white text-[14px] font-bold text-primary-text transition-colors hover:bg-tint">AI 연결</button>
              <button onClick={goHuman} data-t="net-human" className="glass-btn h-12 rounded-btn border border-line bg-white text-[14px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">전문상담원 연결</button>
            </div>
          </div>
          <p className="mt-3 text-center text-[11.5px] leading-4 text-label">{LEGAL.quote}</p>
        </aside>
      </div>
    </section>
  )
}

function Filter({ no, title, sub, children }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-tint text-[12px] font-extrabold text-primary-text">{no}</span>
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {sub && <span className="text-[11.5px] text-faint">{sub}</span>}
      </div>
      {children}
    </div>
  )
}
function Check({ on, onClick, label, sub, testId }) {
  return (
    <button onClick={onClick} aria-pressed={on} data-t={testId}
      className={`mt-2.5 flex w-full items-center justify-between rounded-field border px-3.5 py-2.5 text-left transition-colors ${on ? 'border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
      <span>
        <span className="block text-[13px] font-bold text-ink">{label}</span>
        <span className="block text-[11px] text-faint">{sub}</span>
      </span>
      <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[13px] text-white ${on ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
    </button>
  )
}
function Row({ l, v, accent = 'text-ink' }) {
  return <div className="flex items-center justify-between"><span className="text-label">{l}</span><span className={`tnum font-bold ${accent}`}>{v}</span></div>
}
