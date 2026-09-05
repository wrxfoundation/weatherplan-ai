// ─── 휴대폰 온라인 구매 — 기종 브라우저 ───────────────────────────────────
// 좌: 브랜드 > 기종 체크박스 트리(아정당 사이드 배너 구조). 우상단: 지금 쓰는 통신사.
// 카드에는 3사를 전부 세운다 — 한 곳만 보여주면 "왜 그게 싼지" 비교가 사라진다.
// 각 줄은 통신사/가입유형 · 할인율 · 실구매가 · 정가(취소선)이고, 그대로 상세로 이어진다.
// 계산은 lib/phones.js bestOffer 한 곳 — 화면은 숫자를 만들지 않는다.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PHONE_DEVICES, PHONE_BRANDS, STORAGES, bestOffer, JOIN_TYPES } from '../../lib/phones'
import { PHONE_CARRIERS } from '../../lib/onboard'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

export const CUR_OPTIONS = PHONE_CARRIERS.map((c) => ({ key: c.key === 'mvno' ? 'mvno' : c.key, label: c.key === 'mvno' ? '알뜰폰' : c.name, color: c.color }))
const MARK = Object.fromEntries(PHONE_CARRIERS.map((c) => [c.key, c]))
const FOLD_AT = 6 // 브랜드당 이 개수를 넘으면 접는다(아정당 "접기 ∧")

export default function PhoneShop() {
  const [sp, setSp] = useSearchParams()
  const cur = sp.get('cur') ?? ''
  const [picked, setPicked] = useState([]) // 선택 기종 id — 비어 있으면 전체
  const [storage, setStorage] = useState('')
  const [folded, setFolded] = useState({})
  const setCur = (k) => { const n = new URLSearchParams(sp); if (k) n.set('cur', k); else n.delete('cur'); setSp(n, { replace: true }) }

  const byBrand = useMemo(() => PHONE_BRANDS.map((b) => ({ ...b, models: PHONE_DEVICES.filter((d) => d.brand === b.key) })), [])
  const toggleModel = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const toggleBrand = (b) => {
    const ids = b.models.map((d) => d.id)
    const all = ids.every((id) => picked.includes(id))
    setPicked((p) => (all ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])]))
  }

  const list = useMemo(() => PHONE_DEVICES
    .filter((d) => picked.length === 0 || picked.includes(d.id))
    .filter((d) => !storage || d.storages.some((s) => s.key === storage))
    .map((d) => ({ d, offer: bestOffer({ deviceId: d.id, cur: cur === 'mvno' ? '' : cur, storage: storage || null }) })), [picked, storage, cur])

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
        <div>
          <nav className="text-[12px] text-faint"><Link to="/category/phone" className="hover:text-primary-text">휴대폰</Link> › 온라인 구매</nav>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">온라인 구매 · 셀프가입</h1>
          <p className="mt-1.5 text-[14px] text-muted">기종마다 <b className="text-ink">3사를 모두</b> 계산해 보여드려요. 지금 쓰는 통신사를 고르면 번호이동·기기변경이 자동으로 갈립니다.</p>
        </div>
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

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[230px_1fr]">
        {/* ── 좌: 기종 트리 ── */}
        <aside className="rounded-card bg-white p-4 shadow-card lg:sticky lg:top-24" data-t="shop-filters">
          <div className="flex items-baseline justify-between">
            <div className="text-[13.5px] font-extrabold text-ink">기종</div>
            {picked.length > 0 && <button onClick={() => setPicked([])} className="text-[11.5px] font-bold text-primary-text hover:underline">초기화</button>}
          </div>
          <div className="mt-2 flex flex-col gap-0.5" data-t="shop-tree">
            {byBrand.map((b) => {
              const ids = b.models.map((d) => d.id)
              const allOn = ids.every((id) => picked.includes(id))
              const someOn = !allOn && ids.some((id) => picked.includes(id))
              const isFolded = folded[b.key] ?? b.models.length > FOLD_AT
              const shown = isFolded ? b.models.slice(0, FOLD_AT) : b.models
              return (
                <div key={b.key}>
                  <Check on={allOn} partial={someOn} onClick={() => toggleBrand(b)} bold>{b.label}</Check>
                  <div className="ml-4 flex flex-col gap-0.5">
                    {shown.map((d) => (
                      <Check key={d.id} on={picked.includes(d.id)} onClick={() => toggleModel(d.id)}>{d.short}</Check>
                    ))}
                    {b.models.length > FOLD_AT && (
                      <button onClick={() => setFolded((f) => ({ ...f, [b.key]: !isFolded }))} className="py-1 pl-7 text-left text-[11.5px] text-faint hover:text-primary-text">
                        {isFolded ? `더보기 ∨ (${b.models.length - FOLD_AT})` : '접기 ∧'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 border-t border-line pt-3 text-[13.5px] font-extrabold text-ink">용량</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Pill on={storage === ''} onClick={() => setStorage('')}>전체</Pill>
            {STORAGES.map((s) => <Pill key={s} on={storage === s} onClick={() => setStorage(s)}>{s}</Pill>)}
          </div>
        </aside>

        {/* ── 우: 기종 그리드 ── */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[16px] font-bold text-ink">기종 <span className="tnum text-primary-text">{list.length}</span></h2>
            <span className="text-[11.5px] text-faint">{cur ? `${CUR_OPTIONS.find((c) => c.key === cur)?.label} 사용 기준` : '통신사를 고르면 번호이동·기기변경이 갈립니다'}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2" data-t="shop-grid">
            {list.map(({ d, offer }) => {
              const st = storage && d.storages.some((s) => s.key === storage) ? storage : d.storages[0].key
              const qs = (o) => new URLSearchParams({ ...(cur ? { cur } : {}), storage: st, carrier: o.carrier, join: o.join }).toString()
              return (
                <div key={d.id} className="flex flex-col rounded-card bg-white p-4 shadow-card transition-shadow hover:shadow-panel" data-t="shop-card">
                  <Link to={`/phone/shop/${d.id}?${new URLSearchParams({ ...(cur ? { cur } : {}), storage: st }).toString()}`} className="group">
                    <div className="flex items-start justify-between">
                      <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-orange-text">{d.tag}</span>
                      <span className="flex gap-1">{d.colors.map((c) => <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full border border-white shadow-sm" style={{ background: c.hex }} />)}</span>
                    </div>
                    <PhoneArt brand={d.brand} color={d.colors[0].hex} />
                    <div className="text-center text-[15.5px] font-bold leading-5 text-ink group-hover:text-primary-text">{d.short}</div>
                    <div className="mt-1 flex justify-center"><span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">{st}</span></div>
                  </Link>

                  {/* 3사 — 저렴한 순. 통신사/가입유형 · 할인율 · 실구매가 · 정가 */}
                  <div className="mt-3 flex flex-col divide-y divide-line border-t border-line" data-t="card-offers">
                    {offer.offers.map((o, i) => (
                      <Link key={o.carrier} to={`/phone/shop/${d.id}?${qs(o)}`} data-t="card-offer"
                        className="flex items-center gap-2.5 py-2.5 transition-colors hover:bg-tint">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-cream text-[12px] font-black" style={{ color: MARK[o.carrier]?.color }}>{MARK[o.carrier]?.mark}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[11.5px] text-label">
                            {o.carrier} / {JOIN_TYPES.find((j) => j.key === o.join)?.label}
                            {i === 0 && <span className="rounded bg-ok/10 px-1.5 text-[10px] font-extrabold text-ok">최저</span>}
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="tnum text-[12.5px] font-extrabold text-primary-text">{o.discountPct}%</span>
                            <span className="tnum text-[15px] font-extrabold text-ink">{won(o.principal)}</span>
                          </span>
                          <span className="tnum block text-[11px] text-faint line-through">{won(o.price)}</span>
                        </span>
                        <span className="shrink-0 text-[15px] text-faint">›</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 text-center text-[11px] text-faint">실구매가 = 출고가 − 공통지원금 − 추가지원금 · 월 납부금은 상세에서</div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-[11.5px] text-disabled">{LEGAL.quote} 출고가·지원금은 공시 기준 대표값이며 상담 시 확정됩니다.</p>
        </div>
      </div>
    </main>
  )
}

function Check({ on, partial, onClick, bold, children }) {
  return (
    <button onClick={onClick} aria-pressed={on} data-t="tree-item"
      className={`flex w-full items-center gap-2 rounded-field px-1.5 py-[5px] text-left transition-colors hover:bg-tint ${bold ? 'text-[13px] font-bold text-ink' : 'text-[12.5px] text-body'}`}>
      <span className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-black text-white ${on ? 'border-primary bg-primary' : partial ? 'border-primary bg-primary/30' : 'border-line bg-white'}`}>
        {on ? '✓' : partial ? '–' : ''}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}
function Pill({ on, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`h-8 rounded-full border px-3 text-[12px] font-bold transition-colors ${on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}>
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
