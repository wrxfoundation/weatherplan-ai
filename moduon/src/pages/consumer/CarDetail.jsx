// ─── 렌트/리스 상세 — 트림·옵션 → 초기부담금·계약기간·선납/보증 → 월 납입금 ──
// 오토클래스 상세 구조 그대로: 트림표 → 선택옵션+계약선택사항 →
// 실제차량가격/선택옵션가격/총차량가격 → 초기부담금 · 계약기간 · 선납금/보증금 기준
// → 리스 월 / 렌트 월. 잔존가치는 숨기지 않고 함께 보여준다(계약 종료 시 부담).
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { carModel, carBrand, calcCar, trimsOf, optionsOf, DOWN_RATES, TERMS, BASIS, residualRate, RENT_LABEL } from '../../lib/cars'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import ApplyChoiceModal from '../../components/ApplyChoiceModal'
import { CarImage, CarGallery } from './Cars'

export default function CarDetail() {
  const { model: id } = useParams()
  return <CarDetailInner key={id} />
}

function CarDetailInner() {
  const { model: id } = useParams()
  const model = carModel(id)
  const trims = model ? trimsOf(model.id) : []
  const [trimName, setTrimName] = useState(trims[0]?.name ?? null)
  const [options, setOptions] = useState([])
  const [down, setDown] = useState(0.3)
  const [term, setTerm] = useState(36)
  const [basis, setBasis] = useState('prepay')
  const [ask, setAsk] = useState(null) // 'lease' | 'rent'

  const q = useMemo(() => (model ? calcCar({ modelId: model.id, trimName, options, down, term, basis }) : null),
    [model, trimName, options, down, term, basis])

  if (!model) {
    return <main className="mx-auto max-w-6xl px-5 pt-12 sm:px-10"><div className="rounded-card bg-white p-8 text-center shadow-card"><div className="text-[16px] font-bold text-ink">차종을 찾지 못했어요</div><Link to="/cars" className="mt-3 inline-block text-[13.5px] font-bold text-primary-text underline">렌트·리스 전체 보기</Link></div></main>
  }
  const brand = carBrand(model.brand)
  const toggle = (oid) => setOptions((p) => (p.includes(oid) ? p.filter((x) => x !== oid) : [...p, oid]))
  const label = `${brand.name} ${model.name} · ${q.trim.name}${q.picked.length ? ` + 옵션 ${q.picked.length}종` : ''} · 초기부담금 ${Math.round(down * 100)}% · ${term}개월 · ${BASIS.find((x) => x.key === basis).label}`
  const kindLabel = ask === 'rent' ? '렌트' : '리스'
  const monthly = ask === 'rent' ? q.rent : q.lease
  const quote = { type: 'car', label: `${label} → ${kindLabel} 월 ${won(monthly ?? 0)}`, total: monthly ?? 0, gift: 0, modelId: model.id, trim: q.trim.name, options, down, term, basis, kind: ask }
  const seed = `${label} 조건으로 ${kindLabel} 월 ${won(monthly ?? 0)} 나왔는데, 제 조건에서 더 낮출 방법이 있는지 봐주세요.`

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <nav className="text-[12px] text-faint"><Link to="/cars" className="hover:text-primary-text">렌트·리스</Link> › <Link to={`/cars?brand=${model.brand}`} className="hover:text-primary-text">{brand.name}</Link> › {model.name}</nav>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">{brand.name} {model.name}</h1>
        <p className="mt-1 text-[13px] text-muted">{model.seg} · {model.fuel === 'ev' ? '전기' : model.fuel === 'hev' ? '하이브리드' : '가솔린'}{q.rentState === 'none' ? ' · 이 차종은 장기렌터카를 취급하지 않아요' : q.rentState === 'consult' ? ' · 렌트는 물량 확인 후 안내드려요' : ''}</p>
        <div className="mt-3 rounded-field bg-tint px-4 py-2.5 text-[12.5px] font-semibold leading-5 text-primary-text">
          아래 견적은 일반적인 조건·일반 신용·할인 미포함 기준으로, 실제 견적은 더 낮아질 수 있습니다.
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          {/* 트림 */}
          <Sec title="트림" sub={`${trims.length}종`}>
            <div className="overflow-x-auto" data-t="car-trims">
              <table className="w-full min-w-[420px] text-[13px]">
                <tbody className="divide-y divide-line">
                  {trims.map((t) => (
                    <tr key={t.name} onClick={() => setTrimName(t.name)} data-t="car-trim"
                      className={`cursor-pointer transition-colors ${t.name === q.trim.name ? 'bg-primary text-white' : 'hover:bg-tint'}`}>
                      <td className="px-3 py-2.5 font-semibold">{t.name}</td>
                      <td className={`tnum px-3 py-2.5 text-right font-bold ${t.name === q.trim.name ? '' : 'text-ink'}`}>{won(t.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sec>

          {/* 선택옵션 */}
          <Sec title="선택옵션 + 계약선택사항" sub="옵션·보증금·계약기간을 고르면 실시간으로 월납입액이 바뀝니다">
            <div className="grid gap-1.5 sm:grid-cols-2" data-t="car-options">
              {optionsOf(model.id).map((o) => {
                const on = options.includes(o.id)
                return (
                  <button key={o.id} onClick={() => toggle(o.id)} aria-pressed={on} data-t="car-option"
                    className={`flex items-center justify-between gap-2 rounded-field border px-3 py-2.5 text-left transition-colors ${on ? 'border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-black text-white ${on ? 'border-primary bg-primary' : 'border-line bg-white'}`}>{on ? '✓' : ''}</span>
                      <span className="truncate text-[12.5px] font-semibold text-ink">{o.name}</span>
                    </span>
                    <span className="tnum shrink-0 text-[12px] font-bold text-label">{won(o.price)}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-3">
              <Money l="실제차량가격" v={q.carPrice} />
              <Money l="선택옵션가격" v={q.optionPrice} />
              <Money l="총차량가격" v={q.total} big />
            </div>
          </Sec>

          {/* 계약 조건 */}
          <Sec title="계약 조건">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[12.5px] font-bold text-label">초기부담금</div>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5" data-t="car-down">
                  {DOWN_RATES.map((d) => (
                    <button key={d} onClick={() => setDown(d)} aria-pressed={down === d}
                      className={`h-10 rounded-field border text-[12.5px] font-bold transition-colors ${down === d ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
                      {Math.round(d * 100)} %
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-label">계약기간</div>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5" data-t="car-term">
                  {TERMS.map((t) => (
                    <button key={t} onClick={() => setTerm(t)} aria-pressed={term === t}
                      className={`h-10 rounded-field border text-[12.5px] font-bold transition-colors ${term === t ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
                      {t} 개월
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2" data-t="car-basis">
              {BASIS.map((x) => (
                <button key={x.key} onClick={() => setBasis(x.key)} aria-pressed={basis === x.key}
                  className={`rounded-btn border p-3 text-left transition-colors ${basis === x.key ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <div className={`text-[13.5px] font-bold ${basis === x.key ? 'text-primary-text' : 'text-ink'}`}>{x.label}</div>
                  <div className="mt-0.5 text-[11px] leading-4 text-faint">{x.desc}</div>
                </button>
              ))}
            </div>
            {q.upfrontCapped && (
              <p className="mt-2 rounded-field bg-orange-tint px-3.5 py-2.5 text-[11.5px] leading-4 text-orange-text" data-t="car-capped">
                초기부담금이 커서 일부는 월 납입금을 더 낮추지 못하고 계약 종료 시 정산에 반영됩니다 — 이 구간부터는 넣는 만큼 월이 내려가지 않아요.
              </p>
            )}
          </Sec>

          {/* 계약 전 확인 */}
          <section className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-ink">계약 전에 꼭 확인하세요</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[12.5px] leading-5 text-label">
              <li className="flex gap-2"><span className="text-primary-text">·</span><span><b className="text-ink">잔존가치 {won(q.residual)}</b>는 계약 종료 시점에 인수하거나 반납으로 정산하는 금액입니다. 기간이 짧을수록 월 납입금은 낮지만 잔존가치가 커요 — {term}개월은 총차량가격의 {Math.round(residualRate(model.seg, term) * 100)}%.</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span><b className="text-ink">리스</b>는 취등록세·공채·탁송료가 별도이거나 원금에 포함되고(약 {won(q.acquisition)} 상당), <b className="text-ink">렌트</b>는 취등록세·자동차세·보험료·탁송료가 월 요금에 포함됩니다(VAT 포함).</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span>중도 해지 시 잔여 기간 리스료의 일부와 위약금이 발생합니다. 승계·반납 조건은 캐피탈사마다 달라 상담에서 확인해 드려요.</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span>주행거리 약정(보통 연 2만km)을 넘기면 추가 정산금이 붙습니다.</span></li>
            </ul>
          </section>
        </div>

        {/* 우: 월 납입금 */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block" data-t="car-card">
          <Summary q={q} model={model} onApply={setAsk} />
        </aside>
      </div>

      <section className="mt-4 rounded-section bg-white p-5 shadow-panel lg:hidden">
        <Summary q={q} model={model} onApply={setAsk} compact />
      </section>
      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-3 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div><div className="text-[11px] font-semibold text-faint">리스 월</div><div className="tnum text-[22px] font-extrabold tracking-tight text-primary-text">{won(q.lease)}</div></div>
          <div className="flex gap-2">
            <button onClick={() => setAsk('lease')} className="h-12 rounded-btn bg-primary px-5 text-[14px] font-extrabold text-white">리스 상담신청</button>
            {q.rentState !== 'none' && <button onClick={() => setAsk('rent')} className="h-12 rounded-btn bg-orange px-5 text-[14px] font-extrabold text-white">렌트 상담신청</button>}
          </div>
        </div>
      </div>

      <ApplyChoiceModal open={!!ask} onClose={() => setAsk(null)} title={`${kindLabel} 상담을 어떻게 진행할까요?`}
        summary={`${label} → ${kindLabel} 월 ${won(monthly ?? 0)}`} seed={seed} consultTo="/consult?cat=car" consultState={{ quote }} />
    </main>
  )
}

function Summary({ q, model, onApply, compact }) {
  return (
    <>
      {!compact && <><CarImage model={model} size={220} kind="main" /><CarGallery model={model} /></>}
      <div className="text-[15px] font-bold leading-5 text-ink">{q.trim.name}</div>
      <div className="mt-3 rounded-field bg-cream/70 p-3.5 text-[13px]">
        <Row l="총차량가격" v={won(q.total)} bold />
        <Row l={`초기부담금 (${Math.round(q.down * 100)}%)`} v={won(q.upfront)} accent="text-primary-text" />
        <Row l={`잔존가치 (${q.term}개월)`} v={won(q.residual)} sub />
        <Row l="약정기간 납입 원금" v={won(q.financed)} sub />
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[14px] font-bold text-ink">리스 월</span>
        <span><span className="tnum text-[28px] font-extrabold tracking-[-1px] text-primary-text" data-t="car-lease">{won(q.lease)}</span><span className="text-[12px] text-faint"> ~</span></span>
      </div>
      <div className="text-right text-[11px] text-faint">취등록세·공채·탁송료 포함</div>
      <button onClick={() => onApply('lease')} data-t="car-apply-lease" className="mt-2 h-12 w-full rounded-btn bg-primary text-[15px] font-extrabold text-white transition-colors hover:bg-primary-hover">리스 상담신청</button>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[14px] font-bold text-ink">렌트 월</span>
        {q.rent !== null
          ? <span><span className="tnum text-[28px] font-extrabold tracking-[-1px] text-orange-text" data-t="car-rent">{won(q.rent)}</span><span className="text-[12px] text-faint"> ~</span></span>
          : <span className={`text-[15px] font-bold ${q.rentState === 'none' ? 'text-disabled' : 'text-faint'}`} data-t="car-rent">{RENT_LABEL[q.rentState]}</span>}
      </div>
      <div className="text-right text-[11px] text-faint">취등록세·공채·자동차세·보험료·탁송료 포함, VAT 포함</div>
      {q.rentState !== 'none' && (
        <button onClick={() => onApply('rent')} data-t="car-apply-rent" className="mt-2 h-12 w-full rounded-btn bg-orange text-[15px] font-extrabold text-white transition-colors hover:brightness-95">렌트 상담신청</button>
      )}

      <p className="mt-3 text-center text-[11px] leading-4 text-label">{LEGAL.quote} 고객의 신용·조건에 따라 실제 요금은 더 낮아질 수 있습니다.</p>
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
function Money({ l, v, big }) {
  return (
    <div className="rounded-field bg-cream/70 px-3.5 py-2.5 text-center">
      <div className="text-[11.5px] font-semibold text-faint">{l}</div>
      <div className={`tnum font-extrabold ${big ? 'text-[19px] text-primary-text' : 'text-[15px] text-ink'}`}>{won(v)}</div>
    </div>
  )
}
function Row({ l, v, accent = 'text-ink', bold, sub }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${sub ? 'pl-3' : ''}`}>
      <span className={sub ? 'text-[12px] text-faint' : bold ? 'font-bold text-label' : 'text-label'}>{l}</span>
      <span className={`tnum ${sub ? 'text-[12px]' : ''} ${bold ? 'font-extrabold' : 'font-bold'} ${accent}`}>{v}</span>
    </div>
  )
}
