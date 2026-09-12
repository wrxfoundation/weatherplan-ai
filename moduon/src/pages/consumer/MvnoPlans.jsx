// ─── 알뜰폰 요금제 — 대표 2 → 브랜드별 혜택 → 전체 목록 ─────────────────────
// 위에 대표 요금제 2개, 아래 브랜드별 혜택 요금제, "전체 요금제 보러가기"를 누르면 보유 전 요금제.
// 데이터는 lib/mvno.js 한 곳(보유 목록 교체 지점).
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FEATURED, BY_BRAND, MVNO_PLANS, MVNO_BRANDS, mvnoBrand, showPrice } from '../../lib/mvno'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'

const NETS = ['전체', 'SKT', 'KT', 'LG U+']

export default function MvnoPlans() {
  const [sp] = useSearchParams()
  const [all, setAll] = useState(sp.get('all') === '1')
  const [net, setNet] = useState('전체')
  const [sort, setSort] = useState('price')

  const full = useMemo(() => MVNO_PLANS
    .filter((p) => net === '전체' || mvnoBrand(p.brand)?.network === net)
    .sort((a, b) => (sort === 'price' ? showPrice(a) - showPrice(b) : b.data - a.data)), [net, sort])

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      <div className="pt-8 sm:pt-12">
        <nav className="text-[12px] text-faint"><Link to="/category/phone" className="hover:text-primary-text">휴대폰</Link> › 알뜰폰 요금제</nav>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">알뜰폰 요금제</h1>
        <p className="mt-1.5 text-[14px] text-muted">3사 망을 그대로 쓰니 품질은 같고 요금은 반값 — 약정 없이 시작할 수 있어요.</p>
      </div>

      {/* 대표 요금제 2 */}
      <section className="mt-6" data-t="mvno-featured">
        <h2 className="text-[16px] font-bold text-ink">지금 가장 많이 고르는 요금제</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FEATURED.map((p) => <PlanCard key={p.id} p={p} big />)}
        </div>
      </section>

      {/* 브랜드별 혜택 */}
      <section className="mt-8" data-t="mvno-brands">
        <h2 className="text-[16px] font-bold text-ink">브랜드별 혜택 요금제</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">브랜드마다 프로모션 할인폭이 가장 큰 요금제 하나씩</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BY_BRAND.map(({ brand, plan, count }) => <PlanCard key={plan.id} p={plan} perk={brand.perk} count={count} />)}
        </div>
      </section>

      {/* 전체 요금제 */}
      <section className="mt-8" data-t="mvno-all">
        {!all ? (
          <button onClick={() => setAll(true)} data-t="mvno-all-btn" className="glass-btn flex h-[52px] w-full items-center justify-center rounded-btn border-[1.5px] border-primary bg-white text-[15px] font-extrabold text-primary-text transition-colors hover:bg-tint">
            전체 요금제 보러가기 <span className="tnum ml-1.5 text-[12px] font-bold text-label">{MVNO_PLANS.length}종</span>
          </button>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-bold text-ink">전체 요금제 <span className="tnum text-primary-text">{full.length}</span></h2>
              <div className="flex flex-wrap gap-1.5">
                {NETS.map((n) => (
                  <button key={n} onClick={() => setNet(n)} aria-pressed={net === n} className={`h-8 rounded-full border px-3 text-[12px] font-bold transition-colors ${net === n ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label'}`}>{n === '전체' ? '전체 망' : `${n}망`}</button>
                ))}
                <button onClick={() => setSort(sort === 'price' ? 'data' : 'price')} className="h-8 rounded-full border border-line bg-white px-3 text-[12px] font-bold text-label hover:border-primary">{sort === 'price' ? '요금 낮은 순' : '데이터 많은 순'} ↕</button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto rounded-card bg-white shadow-card">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead><tr className="border-b border-line text-[11.5px] text-faint">
                  <th className="px-4 py-2.5 text-left font-semibold">요금제</th><th className="px-3 py-2.5 text-left font-semibold">브랜드 · 망</th><th className="px-3 py-2.5 text-right font-semibold">데이터</th><th className="px-3 py-2.5 text-right font-semibold">통화</th><th className="px-3 py-2.5 text-right font-semibold">월 요금</th><th className="px-3 py-2.5 text-right font-semibold">가입</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {full.map((p) => {
                    const b = mvnoBrand(p.brand)
                    return (
                      <tr key={p.id} className="hover:bg-cream/40">
                        <td className="px-4 py-2.5"><Link to={`/phone/mvno/${p.id}`} className="font-bold text-ink hover:text-primary-text">{p.name}</Link>{p.tags.map((t) => <span key={t} className="ml-1.5 rounded bg-tint px-1.5 py-0.5 text-[10px] font-bold text-primary-text">{t}</span>)}</td>
                        <td className="px-3 py-2.5 text-label"><span className="font-bold" style={{ color: b?.color }}>{b?.name}</span> <span className="text-[11px] text-faint">{b?.network}망</span></td>
                        <td className="tnum px-3 py-2.5 text-right text-label">{p.data}GB <span className="text-[10.5px] text-faint">+{p.after}</span></td>
                        <td className="px-3 py-2.5 text-right text-label">{p.call}</td>
                        <td className="tnum px-3 py-2.5 text-right font-extrabold text-ink">{won(showPrice(p))}{p.promo && <span className="ml-1 text-[10.5px] font-semibold text-faint line-through">{won(p.monthly)}</span>}</td>
                        <td className="px-3 py-2.5 text-right text-[11.5px] font-semibold">{p.newJoin ? <span className="text-label">신규·번호이동</span> : <span className="text-orange-text">번호이동만</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      <p className="mt-4 text-[11.5px] text-disabled">{LEGAL.policy} 프로모션 요금은 기간 종료 후 정가로 전환됩니다.</p>
    </main>
  )
}

function PlanCard({ p, big, perk, count }) {
  const b = mvnoBrand(p.brand)
  return (
    <Link to={`/phone/mvno/${p.id}`} className={`flex flex-col rounded-card bg-white shadow-card transition-all hover:-translate-y-[2px] hover:shadow-panel ${big ? 'p-5' : 'p-4'}`} data-t="mvno-card">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-extrabold" style={{ color: b?.color }}>{b?.name} <span className="font-semibold text-faint">{b?.network}망</span></span>
        {!p.newJoin && <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[10px] font-bold text-orange-text">번호이동 전용</span>}
      </div>
      <div className={`mt-1.5 font-bold leading-6 text-ink ${big ? 'text-[18px]' : 'text-[15px]'}`}>{p.name}</div>
      <div className="mt-1 text-[12.5px] text-label"><b className="tnum text-ink">{p.data}GB</b> + {p.after} · 통화 {p.call}</div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          {p.promo && <div className="text-[11px] text-faint"><s className="tnum">{won(p.monthly)}</s> · {p.months}개월 프로모션</div>}
          <div><span className="text-[11px] text-faint">월 </span><span className={`tnum font-extrabold tracking-tight text-primary-text ${big ? 'text-[26px]' : 'text-[20px]'}`}>{won(showPrice(p))}</span></div>
        </div>
        <span className="rounded-field bg-tint px-3 py-1.5 text-[12px] font-bold text-primary-text">자세히 ›</span>
      </div>
      {(perk || count) && <div className="mt-2.5 border-t border-line pt-2 text-[11.5px] text-label">{perk}{count > 1 && <span className="text-faint"> · 이 브랜드 {count}종</span>}</div>}
    </Link>
  )
}
