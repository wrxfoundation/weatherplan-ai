// ─── 인터넷/TV 요금표·가입 안내 (S-02 internet 전용 — 탐라몰 벤치마크) ──
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { won, CARRIERS, SPEED_MAP } from '../lib/engine'
import { TV_OPTIONS, CARRIER_PROMO, SPEED_DESC, telcoCell, INSTALL_STEPS, GIFT_POLICY, TELCO_FAQ } from '../lib/telco'
import { IcGift } from './icons'

export default function TelcoCompare() {
  const nav = useNavigate()
  const [carrier, setCarrier] = useState('KT')
  const [open, setOpen] = useState(0)
  const speeds = Object.keys(SPEED_MAP)

  return (
    <>
      {/* ── 요금표 매트릭스 ── */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[19px] font-extrabold text-ink">통신사별 요금표</h2>
          <span className="text-[12px] text-faint">3년 약정 · 부가세 포함 · 결합 할인 전 기준</span>
        </div>

        <div className="mt-4 flex gap-2">
          {CARRIERS.map((c) => (
            <button
              key={c}
              onClick={() => setCarrier(c)}
              className={`h-10 rounded-full border px-4 text-[13.5px] font-bold transition-colors ${
                carrier === c ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary hover:text-primary-text'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-card bg-white shadow-card scrollbar-none">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-card">
                <th className="px-5 py-4 text-[12.5px] font-semibold text-faint">속도</th>
                {TV_OPTIONS.map((tv) => (
                  <th key={tv.key} className="px-4 py-4">
                    <div className="text-[13.5px] font-bold text-ink">{tv.label}</div>
                    <div className="mt-0.5 text-[11.5px] font-normal text-faint">{tv.desc}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {speeds.map((s) => (
                <tr key={s} className="border-b border-line-card last:border-0">
                  <td className="px-5 py-4">
                    <div className="text-[15px] font-extrabold text-ink">{s}</div>
                    <div className="mt-0.5 text-[11.5px] text-faint">{SPEED_DESC[s]}</div>
                  </td>
                  {TV_OPTIONS.map((tv) => {
                    const cell = telcoCell(s, tv.key, carrier)
                    const hot = s === '500M' && tv.key === 'basic'
                    return (
                      <td key={tv.key} className="px-2 py-2">
                        <button
                          onClick={() => nav('/calculator', { state: { preset: { carrier, speed: s } } })}
                          className={`w-full rounded-field border p-3 text-left transition-all hover:-translate-y-px hover:border-primary ${
                            hot ? 'border-primary bg-tint' : 'border-transparent bg-white'
                          }`}
                        >
                          {hot && <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold text-white">가장 인기</span>}
                          <div className="tnum text-[16px] font-extrabold tracking-tight text-ink">월 {won(cell.monthly)}</div>
                          <div className="tnum mt-0.5 text-[12px] font-bold text-orange-text"><IcGift size={13} className="inline -mt-0.5 mr-1" />{won(cell.gift)}</div>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>✔ {carrier} 가입 혜택: <strong className="font-bold text-primary-text">{CARRIER_PROMO[carrier].note}</strong></span>
          <span className="text-faint">칸을 누르면 결합 할인까지 계산기에서 이어서 계산돼요</span>
        </div>
      </section>

      {/* ── 가입 → 지급 절차 ── */}
      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink">신청부터 사은품까지</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {INSTALL_STEPS.map((st, i) => (
            <div key={st.t} className="relative rounded-card bg-white p-4 shadow-card">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tint text-[12.5px] font-extrabold text-primary-text">{i + 1}</span>
              <div className="mt-2.5 text-[14px] font-bold text-ink">{st.t}</div>
              <div className="mt-1 text-[12.5px] leading-5 text-muted">{st.d}</div>
              {i < INSTALL_STEPS.length - 1 && (
                <span className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-faint sm:block">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-card bg-orange-tint p-4">
          <div className="text-[13px] font-bold text-orange-text">사은품 지급 약속</div>
          <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] leading-5 text-body">
            {GIFT_POLICY.map((g) => <li key={g}>· {g}</li>)}
          </ul>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mt-10">
        <h2 className="text-[19px] font-extrabold text-ink">자주 묻는 질문</h2>
        <div className="mt-4 overflow-hidden rounded-card bg-white shadow-card">
          {TELCO_FAQ.map((f, i) => (
            <div key={f.q} className="border-b border-line-card last:border-0">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={open === i}
              >
                <span className="text-[14px] font-bold text-ink">Q. {f.q}</span>
                <span className={`shrink-0 text-[13px] text-faint transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              <div className={`smooth-open ${open === i ? 'is-open' : ''}`}>
                <p className="px-5 pb-4 text-[13.5px] leading-6 text-muted">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
