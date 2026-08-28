// ─── S-03c 렌탈 견적 계산기 (정수기·비데·공기청정기) ─────────────────
// 월 렌탈료만 비교하면 속는다 — 방문형/셀프형 · 약정 기간 · 제휴카드 · 동시렌탈을
// 모두 반영한 "카드할인 후 실부담"과 "약정 총 부담"을 함께 보여준다.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RENTAL_ITEMS, CARE_TYPES, TERMS, COMBO_DC, OWNERSHIP_TERM, MIN_REAL, calcRental, rentalMatrix } from '../../lib/rentals'
import { won, copyText } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import { IcShare, IcCheck } from '../../components/icons'
import { CalcTabs } from './PhoneCalculator'

export default function RentalCalculator() {
  const nav = useNavigate()
  const [itemId, setItemId] = useState('water-inspure')
  const [care, setCare] = useState('visit')
  const [term, setTerm] = useState(60)
  const [card, setCard] = useState(true)
  const [combo, setCombo] = useState(1)
  const [copied, setCopied] = useState(false)

  const q = useMemo(() => calcRental({ itemId, care, term, card, combo }), [itemId, care, term, card, combo])
  const matrix = useMemo(() => rentalMatrix({ itemId, card, combo }), [itemId, card, combo])

  const label = `${q.item.brand} ${q.item.short} · ${CARE_TYPES.find((c) => c.key === care)?.label} ${term}개월${combo > 1 ? ` · ${combo}대 동시` : ''}`

  const goConsult = () => nav('/consult?cat=' + q.item.cat, {
    state: { quote: { type: 'rental', total: q.real, gift: q.saved, label: `${label} → 월 ${won(q.real)}` } },
  })

  const share = async () => {
    const text = `[모두온 렌탈 견적]\n${label}\n월 실부담 ${won(q.real)} (정가 ${won(q.base)})\n약정 총 부담 ${won(q.totalReal)}\n직접 계산해 보기 → ${window.location.origin}/calculator/rental\n※ 예상 견적이며 최종 조건은 상담 시 확정됩니다.`
    if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 1600) }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 sm:px-10 lg:pb-0">
      <div className="pt-8 sm:pt-12">
        <CalcTabs active="rental" />
        <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">렌탈 견적 계산기</h1>
        <p className="mt-1.5 text-[14px] text-muted sm:text-[15px]">방문형/셀프형·약정 기간·제휴카드까지 넣어 <b className="text-ink">진짜 내는 돈</b>을 계산해요.</p>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          {/* 상품 */}
          <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
            <h2 className="text-[16px] font-bold text-ink">어떤 제품인가요?</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {RENTAL_ITEMS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setItemId(r.id)}
                  className={`relative flex flex-col rounded-btn border p-3.5 text-left transition-all ${itemId === r.id ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
                >
                  <span className={`absolute right-3 top-3 h-[18px] w-[18px] rounded-full ${itemId === r.id ? 'border-[6px] border-primary bg-white' : 'border border-line bg-white'}`} />
                  <span className="w-fit rounded-full bg-brow px-2 py-0.5 text-[10px] font-bold text-bmuted">{r.brand}</span>
                  <span className="mt-2 text-[13.5px] font-bold leading-5 text-ink">{r.short}</span>
                  <span className="tnum mt-1 text-[11.5px] text-faint">월 {won(r.monthly.self[60])}~</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {q.item.features.map((f) => (
                <span key={f} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-label">{f}</span>
              ))}
            </div>
          </section>

          {/* 관리 방식 · 기간 */}
          <section className="rounded-card bg-white p-5 shadow-card sm:p-6 animate-rise">
            <h2 className="text-[16px] font-bold text-ink">관리 방식과 약정 기간</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CARE_TYPES.map((c) => (
                <button key={c.key} onClick={() => setCare(c.key)} className={`rounded-field border p-3.5 text-left transition-colors ${care === c.key ? 'border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}>
                  <div className={`text-[14px] font-bold ${care === c.key ? 'text-primary-text' : 'text-ink'}`}>{c.label}</div>
                  <div className="mt-0.5 text-[11.5px] leading-4 text-faint">{c.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TERMS.map((t) => (
                <button key={t} onClick={() => setTerm(t)} className={`h-12 rounded-field border text-[13.5px] font-bold transition-colors ${term === t ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/50'}`}>
                  {t}개월 약정
                  {t >= OWNERSHIP_TERM && <span className="ml-1.5 text-[11px] font-bold opacity-80">소유권 이전</span>}
                </button>
              ))}
            </div>

            {/* 할인 옵션 */}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setCard(!card)} className={`flex items-center justify-between rounded-field border px-4 py-3 text-left transition-colors ${card ? 'border-primary bg-tint' : 'border-line bg-white'}`}>
                <div>
                  <div className="text-[13px] font-bold text-ink">제휴카드 청구할인</div>
                  <div className="tnum text-[11px] text-faint">월 {won(q.item.cardDc)} 할인 (실적 조건)</div>
                </div>
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[13px] text-white ${card ? 'border-primary bg-primary' : 'border-line bg-white'}`}>✓</span>
              </button>
              <div className="rounded-field border border-line px-4 py-2.5">
                <div className="text-[13px] font-bold text-ink">동시 렌탈 대수</div>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <button key={n} onClick={() => setCombo(n)} className={`h-8 rounded-field border text-[12px] font-bold ${combo === n ? 'border-primary bg-tint text-primary-text' : 'border-line text-label'}`}>
                      {n}대{COMBO_DC[n] ? ` −${(COMBO_DC[n] / 1000).toFixed(0)}천` : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 조합 비교표 */}
          <section className="rounded-card bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-bold text-ink">관리 방식 × 기간 비교</h2>
              <span className="text-[11.5px] text-faint">{q.item.brand} {q.item.short} · {card ? '카드할인 적용' : '카드할인 미적용'}{combo > 1 ? ` · ${combo}대` : ''}</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-[11.5px] text-faint">
                    <th className="px-2 py-2 text-left font-semibold">조합</th>
                    <th className="px-2 py-2 text-right font-semibold">정가 월</th>
                    <th className="px-2 py-2 text-right font-semibold">실부담 월</th>
                    <th className="px-2 py-2 text-right font-semibold">약정 총 부담</th>
                    <th className="px-2 py-2 text-right font-semibold">소유권</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {matrix.map((r) => {
                    const on = r.care === care && r.term === term
                    return (
                      <tr key={r.key} className={on ? 'bg-tint/50' : r.cheapest ? 'bg-cream/50' : ''}>
                        <td className="px-2 py-2.5 font-bold text-ink">
                          {r.careLabel} {r.term}개월
                          {r.cheapest && <span className="ml-1.5 rounded-full bg-ok px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">총액 최저</span>}
                          {on && <span className="ml-1.5 text-[10.5px] font-bold text-primary-text">선택중</span>}
                        </td>
                        <td className="tnum px-2 py-2.5 text-right text-faint line-through">{won(r.base)}</td>
                        <td className="tnum px-2 py-2.5 text-right font-extrabold text-ink">{won(r.real)}</td>
                        <td className="tnum px-2 py-2.5 text-right font-semibold text-label">{won(r.totalReal)}</td>
                        <td className="px-2 py-2.5 text-right text-[11.5px] font-semibold text-label">{r.ownership ? '이전 ✓' : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-faint">
              월 렌탈료가 싼 조합이 총 부담까지 싼 건 아니에요 — 기간이 길면 월은 내려가도 총액은 올라갈 수 있습니다.
            </p>
          </section>

          {/* 조건 고지 */}
          <section className="rounded-card border border-line bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-ink">계약 전에 꼭 확인하세요</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[12.5px] leading-5 text-label">
              <li className="flex gap-2"><span className="text-primary-text">·</span><span><b className="text-ink">의무사용 기간</b>이 있습니다({term}개월). 중도 해지 시 잔여 렌탈료의 일부와 설치·철거 비용이 청구될 수 있어요.</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span><b className="text-ink">소유권 이전</b>은 {OWNERSHIP_TERM}개월 이상 사용 시 적용됩니다 — 36개월 약정은 만료 후에도 제품이 내 것이 되지 않아요.</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span>필터 교체는 <b className="text-ink">{q.item.filterCycle}개월 주기</b>, 방문형은 8개월·셀프형은 12개월 관리 주기입니다. 셀프형은 필터를 직접 교체하는 조건으로 월 요금이 낮아요.</span></li>
              <li className="flex gap-2"><span className="text-primary-text">·</span><span>제휴카드 할인은 <b className="text-ink">카드 실적 조건</b>(월 사용액)을 충족해야 유지됩니다. 조건 미달 시 정가가 청구돼요.</span></li>
            </ul>
          </section>
        </div>

        {/* 우: 스티키 요약 */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block">
          <div className="text-[12.5px] font-semibold text-faint">월 실부담</div>
          <div className="mt-0.5 text-[15px] font-bold text-ink">{label}</div>

          <div className="mt-4 rounded-field bg-cream/70 p-3.5 text-[13px]">
            <Row l="정가 월 렌탈료" v={won(q.base)} />
            {q.comboDc > 0 && <Row l={`동시렌탈 할인(${combo}대)`} v={`−${won(q.comboDc)}`} accent="text-ok" />}
            {q.cardDc > 0 && <Row l="제휴카드 청구할인" v={`−${won(q.cardDc)}`} accent="text-ok" />}
            <div className="mt-1.5 flex justify-between border-t border-line pt-1.5">
              <span className="font-bold text-ink">월 실부담</span>
              <span className="tnum font-extrabold text-ink">{won(q.real)}</span>
            </div>
            {q.floored && <div className="mt-1.5 text-[11px] leading-4 text-faint">할인 중복 시 월 최소 부담금({won(MIN_REAL)})까지만 적용돼요 — 남은 할인은 중복되지 않습니다.</div>}
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[14px] font-bold text-ink">월 실부담</span>
            <span className="tnum text-[32px] font-extrabold tracking-[-1px] text-primary-text">{won(q.real)}</span>
          </div>
          <div className="mt-1 text-right text-[11.5px] text-faint">
            약정 총 부담 {won(q.totalReal)} · {q.saved > 0 ? `총 ${won(q.saved)} 절약` : '할인 미적용'}
          </div>
          {q.ownership && <div className="mt-2 rounded-field bg-ok/10 px-3 py-2 text-[11.5px] font-bold text-ok">{OWNERSHIP_TERM}개월 이상 — 만료 시 소유권이 이전돼요</div>}

          <button onClick={goConsult} className="mt-4 h-[52px] w-full rounded-btn bg-primary text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-primary-hover">
            이 조건으로 렌탈 상담 신청
          </button>
          <button onClick={share} className="glass-btn mt-2 h-11 w-full rounded-btn border border-line bg-white text-[13.5px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">
            {copied ? '✓ 복사됐어요 — 카톡에 붙여넣으세요' : '견적 공유하기'}
          </button>
          <p className="mt-3 text-center text-[11.5px] leading-4 text-label">{LEGAL.quote} 제휴 조건에 따라 변동될 수 있습니다.</p>
        </aside>
      </div>

      {/* 모바일 하단 고정 바 */}
      <div className="safe-b fixed inset-x-0 bottom-0 z-40 rounded-t-card bg-white px-5 pb-4 pt-4 shadow-bottombar lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-faint">월 실부담</div>
            <div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.real)}</div>
          </div>
          <div className="text-right text-[11px] leading-4 text-faint">
            정가 {won(q.base)}<br />총 {won(q.totalReal)}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={share} aria-label="견적 공유" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn border border-line bg-white text-label">
            {copied ? <IcCheck size={18} className="text-ok" /> : <IcShare size={18} />}
          </button>
          <button onClick={goConsult} className="h-12 flex-1 rounded-btn bg-primary text-[15px] font-bold text-white">이 조건으로 상담 신청</button>
        </div>
      </div>
    </main>
  )
}

function Row({ l, v, accent = 'text-ink' }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-label">{l}</span>
      <span className={`tnum font-bold ${accent}`}>{v}</span>
    </div>
  )
}
