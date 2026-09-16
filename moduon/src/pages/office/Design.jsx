// ─── S-13 수당 설계기 (파트너 오피스) ─────────────────────────────────
// "이 사이트의 핵심은 설계하고 신청받을 때 수당을 어떻게 확인하느냐" — 수당구조 회의.
// 상품(정책 단가표)을 고르고 고객 지원금을 조절하면 내 수당이 즉시 나온다.
// 히든(상위 계층 몫)은 기본 숨김 — 버튼을 눌러야만 펼쳐진다(회의 요구사항).
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { RATE_CARD, RATE_GROUPS, TIERS, calcCommission, supportRange, supportPresets } from '../../lib/commission'
import { won, copyText } from '../../lib/engine'
import { Card, useToast } from '../../components/ui'
import { IcCoins, IcShare } from '../../components/icons'

export default function OfficeDesign() {
  const { tenant } = useOutletContext()
  const toast = useToast()
  const [itemId, setItemId] = useState('mno-fold')
  const [support, setSupport] = useState(400000)
  const [direct, setDirect] = useState(true)
  const [showHidden, setShowHidden] = useState(false)

  const item = useMemo(() => RATE_CARD.find((r) => r.id === itemId), [itemId])
  const range = useMemo(() => supportRange(item), [item])
  const q = useMemo(() => calcCommission({ itemId, support, direct }), [itemId, support, direct])
  const presets = supportPresets(item)

  // 상품을 바꾸면 지원금을 그 상품의 허용 범위로 맞춘다(고정형은 상한 그대로)
  const pick = (id) => {
    const next = RATE_CARD.find((r) => r.id === id)
    const r = supportRange(next)
    setItemId(id)
    setSupport(next.supportMode === 'free' ? Math.min(support, r.max) : r.min)
  }

  const shareQuote = async () => {
    const text = `[수당 설계]\n${item.name}\n리베이트 단가 ${won(item.rebate)}\n고객 지원금 ${won(q.customer)}\n내 수당 ${won(q.take)}${direct ? ' (대리점 직영)' : ''}`
    if (await copyText(text)) toast('설계 내용을 복사했어요')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">수당 설계기</h1>
          <p className="mt-1 text-[13px] text-bmuted">상품을 고르고 고객 지원금을 정하면 <b className="text-bink">내 수당</b>이 바로 나옵니다 — 팔기 전에 계산하세요.</p>
        </div>
        <span className="hidden rounded-card bg-tint p-3.5 text-primary-text lg:block"><IcCoins size={30} sw={1.6} /></span>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          {/* 상품 — 정책 단가표 */}
          <Card track="b" className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15.5px] font-extrabold text-bink">정책 단가표</h2>
              <span className="text-[11.5px] text-bfaint">본사가 정한 리베이트 단가 — 총판·대리점·셀러 모두 같은 값이 보입니다</span>
            </div>
            {RATE_GROUPS.map((g) => (
              <div key={g} className="mt-3">
                <div className="text-[11.5px] font-bold text-bfaint">{g}</div>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                  {RATE_CARD.filter((r) => r.group === g).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => pick(r.id)}
                      className={`flex items-center justify-between rounded-field border p-3 text-left transition-colors ${itemId === r.id ? 'border-primary bg-tint' : 'border-bline bg-white hover:border-primary/50'}`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate text-[13px] font-bold ${itemId === r.id ? 'text-primary-text' : 'text-bink'}`}>{r.short}</span>
                        <span className="block text-[11px] text-bfaint">
                          {r.supportMode === 'free' ? '지원금 재량' : r.supportMode === 'fixed' ? `지원금 고정 ${won(r.supportCap)}` : '지원금 없음'}
                        </span>
                      </span>
                      <span className="tnum shrink-0 text-[13px] font-extrabold text-bink">{won(r.rebate)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          {/* 고객 지원금 설계 */}
          <Card track="b" className="p-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">고객 지원금 설계</h2>
            {item.supportMode === 'free' ? (
              <>
                <p className="mt-1 text-[12.5px] text-bmuted">단가 한도 안에서 고객에게 얼마를 줄지 정하세요. <b className="text-bink">덜 주면 내 수당이 오르고, 더 주면 계약이 쉬워집니다.</b></p>
                <div className="mt-4">
                  <input
                    type="range" min={range.min} max={range.max} step={10000} value={q.customer}
                    onChange={(e) => setSupport(Number(e.target.value))}
                    aria-label="고객 지원금"
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-brow accent-primary"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-bfaint">
                    <span className="tnum">{won(range.min)}</span>
                    <span className="tnum">최대 {won(range.max)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button key={p.label} onClick={() => setSupport(p.value)} className={`h-8 rounded-full border px-3 text-[12px] font-bold transition-colors ${q.customer === p.value ? 'border-primary bg-tint text-primary-text' : 'border-bline text-bbody hover:border-primary/50'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            ) : item.supportMode === 'fixed' ? (
              <p className="mt-1 text-[12.5px] leading-5 text-bmuted">
                인터넷/TV는 <b className="text-bink">통신사가 고객 지원금 상한({won(item.supportCap)})을 고정</b>합니다 — 셀러 재량이 없어요.
                단가에서 지원금을 뺀 <b className="text-bink">{won(item.rebate - item.supportCap)}</b>을 계층이 나눠 갖습니다.
              </p>
            ) : (
              <p className="mt-1 text-[12.5px] leading-5 text-bmuted">렌탈은 고객 지원금 없이 <b className="text-bink">건당 수수료({won(item.rebate)})</b>를 나눠 갖는 구조입니다.</p>
            )}

            <button
              onClick={() => setDirect(!direct)}
              className={`mt-4 flex w-full items-center justify-between rounded-field border px-4 py-3 text-left transition-colors ${direct ? 'border-primary bg-tint' : 'border-bline bg-white'}`}
            >
              <span>
                <span className="block text-[13.5px] font-bold text-bink">대리점 직영 판매</span>
                <span className="block text-[11.5px] text-bfaint">내가 직접 판매하면 셀러 몫 + 대리점 몫을 함께 받습니다</span>
              </span>
              <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border text-[13px] text-white ${direct ? 'border-primary bg-primary' : 'border-bline bg-white'}`}>✓</span>
            </button>
          </Card>

          {/* 분배 내역 — 히든은 기본 접힘 */}
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">분배 내역</h2>
              <button onClick={() => setShowHidden(!showHidden)} className="rounded-full border border-bline px-3 py-1 text-[11.5px] font-bold text-bbody transition-colors hover:border-primary hover:text-primary-text">
                {showHidden ? '상세 접기' : '상세 보기'}
              </button>
            </div>
            <div className="mt-3 rounded-field bg-brow/50 p-3.5">
              <Line l="리베이트 단가" v={won(item.rebate)} bold />
              <Line l="고객 지원금" v={q.customer ? `−${won(q.customer)}` : '없음'} accent={q.customer ? 'text-ok' : 'text-bfaint'} />
              <div className="mt-1.5 flex justify-between border-t border-bline pt-1.5">
                <span className="text-[13px] font-bold text-bink">계층 배분 재원</span>
                <span className="tnum text-[13px] font-extrabold text-bink">{won(q.pool)}</span>
              </div>
            </div>

            {showHidden ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead className="text-[11.5px] text-bfaint">
                    <tr className="border-b border-bline">
                      <th className="px-2 py-2 text-left font-semibold">계층</th>
                      <th className="px-2 py-2 text-right font-semibold">금액(건당)</th>
                      <th className="px-2 py-2 text-right font-semibold">비중</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bline">
                    {[
                      ['seller', q.seller], ['agency', q.agency], ['distributor', q.distributor], ['hq', q.hq],
                    ].map(([k, v]) => (
                      <tr key={k} className={k === 'seller' ? 'bg-tint/40' : ''}>
                        <td className="px-2 py-2.5 font-bold text-bink">
                          {TIERS[k]}
                          {k === 'seller' && <span className="ml-1.5 text-[11px] font-bold text-primary-text">나</span>}
                          {direct && k === 'agency' && <span className="ml-1.5 text-[11px] font-bold text-primary-text">나(직영)</span>}
                        </td>
                        <td className="tnum px-2 py-2.5 text-right font-extrabold text-bink">{won(v)}</td>
                        <td className="tnum px-2 py-2.5 text-right font-semibold text-bmuted">{q.share[k]}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] leading-4 text-bfaint">
                  분배는 <b className="text-bbody">고정 단가(건당 정액)</b>로 계산합니다 — 비중(%)은 결과로 나온 참고값이며, 지원금을 바꾸면 함께 달라집니다.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[12px] leading-5 text-bmuted">
                상위 계층 몫은 기본적으로 표시하지 않습니다. 내 수당만 확인하고 진행하셔도 됩니다 — 상세가 필요하면 <b className="text-bink">상세 보기</b>를 누르세요.
              </p>
            )}
          </Card>
        </div>

        {/* 우: 내 수당 */}
        <aside className="sticky top-24 hidden rounded-section bg-white p-6 shadow-panel lg:block">
          <div className="text-[12.5px] font-semibold text-bfaint">이 건으로 내가 받는 수당</div>
          <div className="mt-0.5 truncate text-[14px] font-bold text-bink">{item.short}</div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[13.5px] font-bold text-bink">내 수당</span>
            <span className="tnum text-[32px] font-extrabold tracking-[-1px] text-primary-text">{won(q.take)}</span>
          </div>
          <div className="mt-1 text-right text-[11.5px] text-bfaint">
            {direct ? `셀러 ${won(q.seller)} + 대리점 ${won(q.agency)}` : `셀러 몫 ${won(q.seller)}`}
          </div>

          <div className="mt-4 rounded-field bg-brow/50 p-3.5 text-[12.5px]">
            <Line l="고객이 받는 지원금" v={q.customer ? won(q.customer) : '없음'} />
            <Line l="리베이트 단가" v={won(item.rebate)} />
          </div>

          <div className="mt-4 rounded-field bg-tint/50 px-3.5 py-3 text-[11.5px] leading-4 text-primary-text">
            하루 2건이면 월 {won(q.take * 2 * 22)} 수준입니다 — 실제 성사 건수에 따라 달라집니다.
          </div>

          <button onClick={shareQuote} className="glass-btn mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-btn border border-bline bg-white text-[13.5px] font-bold text-bbody transition-colors hover:border-primary hover:text-primary-text">
            <IcShare size={15} /> 설계 내용 복사
          </button>
          <p className="mt-3 text-center text-[11px] leading-4 text-bfaint">
            단가표는 본사 정책에 따라 수시로 갱신됩니다. 최종 수당은 개통·설치 확인 후 정산 기준으로 확정돼요.
          </p>
        </aside>
      </div>

      {/* 모바일 요약 바 */}
      <div className="mt-4 rounded-card bg-white p-4 shadow-card lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-bfaint">내 수당</div>
            <div className="tnum text-[24px] font-extrabold tracking-tight text-primary-text">{won(q.take)}</div>
          </div>
          <div className="text-right text-[11px] leading-4 text-bfaint">
            지원금 {q.customer ? won(q.customer) : '없음'}<br />단가 {won(item.rebate)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Line({ l, v, accent = 'text-bink', bold }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={`text-[12.5px] ${bold ? 'font-bold text-bink' : 'text-bmuted'}`}>{l}</span>
      <span className={`tnum text-[12.5px] ${bold ? 'font-extrabold' : 'font-bold'} ${accent}`}>{v}</span>
    </div>
  )
}
