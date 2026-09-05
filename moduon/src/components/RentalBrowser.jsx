// ─── 렌탈 브랜드 브라우저 — 9브랜드 × 카테고리 + 정수기 냉온/얼음 + 렌트/리스 ─────
// 브랜드 탭에 커서를 올리면 그 브랜드의 카테고리가 펼쳐진다(스펙). 누르면 선택.
// 정수기 계열을 고르면 우상단에 냉온만/얼음냉온 필터가 뜬다. 렌트/리스는 상단 토글.
// 품목·단가는 lib/rentals.js 한 곳. 리스 보정도 거기서 계산한다(화면은 숫자를 만들지 않는다).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RENTAL_BRANDS, WATER_TYPES, isWaterCat, browseRentals, calcRental } from '../lib/rentals'
import { won } from '../lib/engine'
import { LEGAL } from '../lib/constants'
import { EmptyState } from './ui'
import { IcSearch } from './icons'

export default function RentalBrowser() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  // 브랜드·카테고리는 URL 이 단일 소스다. useState 초기값으로 읽으면 마운트 때 한 번만 반영되는데,
  // GNB 메가메뉴에서 같은 페이지로 다시 들어오면 쿼리만 바뀌고 리마운트는 없어서 화면이 반응하지 않는다.
  const brandParam = sp.get('brand') ?? ''
  const brand = RENTAL_BRANDS.some((x) => x.key === brandParam) ? brandParam : ''
  const category = sp.get('type') ?? ''
  const [waterType, setWaterType] = useState('')
  const [hover, setHover] = useState(null) // 호버 중인 브랜드 키(데스크톱 드롭다운)
  const ref = useRef(null)

  // 브랜드·카테고리를 URL 에 쓴다. 뒤로가기가 필터 클릭 수만큼 쌓이지 않게 replace 로.
  const select = (nextBrand, nextCat = '') => setSp((prev) => {
    const p = new URLSearchParams(prev)
    nextBrand ? p.set('brand', nextBrand) : p.delete('brand')
    nextCat ? p.set('type', nextCat) : p.delete('type')
    return p
  }, { replace: true })

  const b = RENTAL_BRANDS.find((x) => x.key === brand)
  // 브랜드에 없는 카테고리가 URL 로 들어오면 지운다(직접 주소를 고친 경우)
  useEffect(() => { if (b && category && !b.cats.includes(category)) select(brand) }, [brand, category]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isWaterCat(category)) setWaterType('') }, [category])
  // GNB 에서 넘어오면 목록이 화면 밖에 있다 — 접힌 걸로 보이므로 끌어올린다.
  // 이미 목록을 보며 탭을 누르는 중이면(화면 안이면) 건드리지 않는다.
  useEffect(() => {
    const el = ref.current
    if (!el || (!brand && !category)) return
    if (el.getBoundingClientRect().top > window.innerHeight * 0.8) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [brand, category])

  const items = useMemo(() => browseRentals({ brand: brand || undefined, category: category || undefined, waterType: waterType || undefined }), [brand, category, waterType])
  const priced = useMemo(() => items.map((it) => ({ it, q: calcRental({ itemId: it.id, care: 'self', term: 60, card: false }) })), [items])

  return (
    <section ref={ref} className="mt-8 scroll-mt-20" data-t="rental-browser">
      {/* 상단: 제목 + 렌트/리스 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-extrabold text-ink">브랜드로 찾기</h2>
          <p className="mt-1 text-[13px] text-muted">브랜드에 커서를 올리면 품목이 펼쳐져요. 정수기는 냉온·얼음으로 한 번 더 거를 수 있어요.</p>
        </div>
      </div>
      {/* 브랜드 탭 (호버 → 카테고리 드롭다운) */}
      <div className="relative mt-4 rounded-card bg-white shadow-card" onMouseLeave={() => setHover(null)}>
        {/* 모바일만 가로 스크롤 — 데스크톱에서 overflow 를 두면 호버 드롭다운이 세로로 잘려 안 보인다 */}
        <div className="flex gap-1 overflow-x-auto px-2 py-2 md:overflow-visible" data-t="rental-brands">
          <Tab active={brand === ''} onClick={() => select('')}>전체</Tab>
          {RENTAL_BRANDS.map((x) => (
            <div key={x.key} className="relative shrink-0" onMouseEnter={() => setHover(x.key)}>
              <Tab active={brand === x.key} onClick={() => { select(x.key); setHover(null) }}>{x.name}</Tab>
              {hover === x.key && (
                <div className="absolute left-0 top-full z-30 hidden pt-1 md:block" data-t="rental-hover" role="menu">{/* 바깥 래퍼가 탭과 박스 사이 4px 을 투명하게 메운다 — 틈이 있으면 커서가 지나는 동안 mouseleave 로 닫힌다 */}
                <div className="min-w-[200px] rounded-btn border border-line bg-white p-2 shadow-panel">
                  <div className="px-2 py-1 text-[11px] font-bold text-faint">{x.name}</div>
                  {x.cats.map((c) => (
                    <button key={c} role="menuitem" onClick={() => { select(x.key, c); setHover(null) }}
                      className="block w-full rounded-field px-2.5 py-2 text-left text-[13px] font-semibold text-body hover:bg-tint hover:text-primary-text">
                      {c}
                    </button>
                  ))}
                </div></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 선택 브랜드의 카테고리 칩 (모바일·클릭용) + 정수기 필터 */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" data-t="rental-cats">
        {(b ? b.cats : [...new Set(RENTAL_BRANDS.flatMap((x) => x.cats))]).map((c) => (
          <button key={c} onClick={() => select(brand, category === c ? '' : c)} aria-pressed={category === c}
            className={`h-8 rounded-full border px-3 text-[12.5px] font-bold transition-colors ${category === c ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
            {c}
          </button>
        ))}
        {isWaterCat(category) && (
          <div className="ml-auto inline-flex rounded-full bg-white p-1 shadow-card" data-t="rental-water">
            {WATER_TYPES.map((w) => (
              <button key={w.key} onClick={() => setWaterType(waterType === w.key ? '' : w.key)} aria-pressed={waterType === w.key} title={w.desc}
                className={`flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-bold transition-colors ${waterType === w.key ? 'bg-primary text-white' : 'text-label hover:text-primary-text'}`}>
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 품목 그리드 */}
      {priced.length === 0 ? (
        <div className="mt-4 rounded-card bg-white p-8 shadow-card">
          <EmptyState icon={IcSearch} text="이 조합의 품목은 상담으로 안내해 드려요" sub="브랜드·카테고리를 바꾸거나 상담을 신청해 주세요" />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-t="rental-items">
          {priced.map(({ it, q }) => (
            <div key={it.id} className="flex flex-col rounded-card bg-white p-4 shadow-card transition-all hover:-translate-y-[2px] hover:shadow-panel">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11.5px] font-semibold text-faint">{it.brand} · {it.category}</div>
                  <div className="mt-0.5 text-[15px] font-bold leading-5 text-ink">{it.name}</div>
                </div>
                {it.waterType && <span className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-[10.5px] font-bold text-primary-text">{WATER_TYPES.find((w) => w.key === it.waterType)?.label}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {it.features.slice(0, 4).map((f) => <span key={f} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-semibold text-label">{f}</span>)}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-faint">셀프형 60개월 기준</span>
                  <div><span className="text-[11px] text-faint">월 </span><span className="tnum text-[20px] font-extrabold tracking-tight text-ink">{won(q.base)}</span></div>
                </div>
                {q.ownership && <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[10.5px] font-bold text-ok">소유권 이전</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <Link to={`/calculator/rental?item=${it.id}`} className="flex h-10 items-center justify-center rounded-field bg-tint text-[13px] font-bold text-primary-text transition-colors hover:bg-primary hover:text-white">자세히 계산</Link>
                <button onClick={() => nav(`/consult?cat=${it.cat}`, { state: { quote: { type: 'rental', label: `${it.brand} ${it.name}`, total: q.base, gift: 0 } } })}
                  className="h-10 rounded-field border border-line bg-white text-[13px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">상담</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11.5px] text-disabled">{LEGAL.policy} 제휴 단가표 수령 시 금액이 갱신됩니다.</p>
    </section>
  )
}

function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold transition-colors ${active ? 'bg-primary text-white' : 'text-label hover:bg-tint hover:text-primary-text'}`}>
      {children}
    </button>
  )
}
