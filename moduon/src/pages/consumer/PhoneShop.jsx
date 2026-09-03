// ─── 휴대폰 온라인 구매 — 기종 브라우저 ───────────────────────────────────
// 좌: 브랜드(삼성/애플)·용량 필터. 우상단: 지금 쓰는 통신사.
// 기종마다 "현 통신사 기준 3사 비교 → 번호이동 vs 기기변경 중 싼 쪽"을 AI 추천 배지로 단다.
// 추천 계산은 lib/phones.js bestOffer 한 곳 — 카드는 결과를 보여줄 뿐 숫자를 만들지 않는다.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PHONE_DEVICES, PHONE_BRANDS, STORAGES, bestOffer, JOIN_TYPES } from '../../lib/phones'
import { PHONE_CARRIERS } from '../../lib/onboard'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

export const CUR_OPTIONS = PHONE_CARRIERS.map((c) => ({ key: c.key === 'mvno' ? 'mvno' : c.key, label: c.key === 'mvno' ? '알뜰폰' : c.name, color: c.color }))

export default function PhoneShop() {
  const [sp, setSp] = useSearchParams()
  const cur = sp.get('cur') ?? ''
  const [brand, setBrand] = useState('')
  const [storage, setStorage] = useState('')
  const setCur = (k) => { const n = new URLSearchParams(sp); if (k) n.set('cur', k); else n.delete('cur'); setSp(n, { replace: true }) }

  const list = useMemo(() => PHONE_DEVICES
    .filter((d) => !brand || d.brand === brand)
    .filter((d) => !storage || d.storages.some((s) => s.key === storage))
    .map((d) => ({ d, offer: bestOffer({ deviceId: d.id, cur: cur === 'mvno' ? '' : cur, storage: storage || null }) })), [brand, storage, cur])

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
        <div>
          <nav className="text-[12px] text-faint"><Link to="/category/phone" className="hover:text-primary-text">휴대폰</Link> › 온라인 구매</nav>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">온라인 구매 · 셀프가입</h1>
          <p className="mt-1.5 text-[14px] text-muted">지금 쓰는 통신사를 고르면 기종마다 <b className="text-ink">번호이동이 싼지, 기기변경이 싼지</b>를 먼저 계산해 드려요.</p>
        </div>
        {/* 우상단: 현재 사용중인 통신사 */}
        <div className="rounded-card bg-white p-3 shadow-card" data-t="shop-cur">
          <div className="text-[11.5px] font-bold text-label">지금 쓰시는 통신사</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CUR_OPTIONS.map((c) => (
              <button key={c.key} onClick={() => setCur(cur === c.key ? '' : c.key)} aria-pressed={cur === c.key}
                className={`h-9 rounded-full border px-3.5 text-[12.5px] font-bold transition-colors ${cur === c.key ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[220px_1fr]">
        {/* 좌: 필터 배너 */}
        <aside className="rounded-card bg-white p-4 shadow-card lg:sticky lg:top-24" data-t="shop-filters">
          <div className="text-[12.5px] font-bold text-label">브랜드</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 lg:flex-col">
            <FilterBtn on={brand === ''} onClick={() => setBrand('')}>전체</FilterBtn>
            {PHONE_BRANDS.map((b) => <FilterBtn key={b.key} on={brand === b.key} onClick={() => setBrand(b.key)}>{b.label} 휴대폰</FilterBtn>)}
          </div>
          <div className="mt-4 text-[12.5px] font-bold text-label">용량</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 lg:flex-col">
            <FilterBtn on={storage === ''} onClick={() => setStorage('')}>전체</FilterBtn>
            {STORAGES.map((s) => <FilterBtn key={s} on={storage === s} onClick={() => setStorage(s)}>{s}</FilterBtn>)}
          </div>
          <p className="mt-4 text-[11px] leading-4 text-faint">기종을 누르면 색상·할인방법·할부·파손보험까지 고르고 월 납부금을 확인할 수 있어요.</p>
        </aside>

        {/* 우: 기종 그리드 */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[16px] font-bold text-ink">기종 <span className="tnum text-primary-text">{list.length}</span></h2>
            <span className="text-[11.5px] text-faint">{cur ? `${CUR_OPTIONS.find((c) => c.key === cur)?.label} 사용 기준` : '통신사를 고르면 추천이 정확해져요'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-t="shop-grid">
            {list.map(({ d, offer }) => {
              const st = storage && d.storages.some((s) => s.key === storage) ? storage : d.storages[0].key
              const price = d.storages.find((s) => s.key === st)?.price ?? d.price
              const joinLabel = JOIN_TYPES.find((j) => j.key === offer.best.join)?.label
              return (
                <Link key={d.id} to={`/phone/shop/${d.id}?${new URLSearchParams({ ...(cur ? { cur } : {}), storage: st }).toString()}`}
                  className="flex flex-col rounded-card bg-white p-4 shadow-card transition-all hover:-translate-y-[2px] hover:shadow-panel" data-t="shop-card">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-orange-text">{d.tag}</span>
                    <span className="flex gap-1">{d.colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ background: c.hex }} />)}</span>
                  </div>
                  <PhoneArt brand={d.brand} color={d.colors[0].hex} />
                  <div className="text-[11.5px] font-semibold text-faint">{PHONE_BRANDS.find((b) => b.key === d.brand)?.label}</div>
                  <div className="text-[15px] font-bold leading-5 text-ink">{d.short} <span className="text-[12px] font-semibold text-label">{st}</span></div>
                  <div className="tnum mt-0.5 text-[11.5px] text-faint">출고가 {won(price)}</div>
                  <div className="mt-3 rounded-field bg-tint px-3 py-2.5">
                    <div className="text-[10.5px] font-bold text-primary-text">AI 추천 · {offer.best.carrier} {joinLabel}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-label">월 납부 예상</span>
                      <span className="tnum text-[17px] font-extrabold text-primary-text">{won(offer.best.total)}</span>
                    </div>
                    {offer.stay && offer.saving > 0 && <div className="tnum mt-0.5 text-[10.5px] font-semibold text-ok">{offer.stay.carrier} 기기변경보다 월 −{won(offer.saving)}</div>}
                    {offer.stay && offer.saving === 0 && <div className="mt-0.5 text-[10.5px] font-semibold text-label">지금 통신사에서 기기변경이 가장 싸요</div>}
                  </div>
                </Link>
              )
            })}
          </div>
          <p className="mt-4 text-[11.5px] text-disabled">{LEGAL.quote} 출고가·지원금은 공시 기준 대표값이며 상담 시 확정됩니다.</p>
        </div>
      </div>
    </main>
  )
}

function FilterBtn({ on, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`h-9 rounded-field border px-3 text-left text-[12.5px] font-bold transition-colors ${on ? 'border-primary bg-tint text-primary-text' : 'border-line bg-white text-label hover:border-primary/60'}`}>
      {children}
    </button>
  )
}

// 기종 일러스트 — CDN 없이 SVG 한 장. 브랜드별 실루엣만 다르게(애플: 다이내믹 아일랜드).
export function PhoneArt({ brand, color = '#2B2B2E', size = 84 }) {
  return (
    <div className="my-3 flex justify-center">
      <svg width={size} height={size} viewBox="0 0 84 84" aria-hidden>
        <rect x="24" y="6" width="36" height="72" rx="8" fill={color} />
        <rect x="27" y="10" width="30" height="64" rx="5" fill="#fff" opacity="0.92" />
        {brand === 'apple' ? <rect x="36" y="13" width="12" height="4" rx="2" fill={color} /> : <circle cx="42" cy="15" r="2" fill={color} />}
        <rect x="30" y="22" width="24" height="40" rx="3" fill={color} opacity="0.08" />
      </svg>
    </div>
  )
}
