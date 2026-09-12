// ─── S-06 맞춤 추천 온보딩 (아정당식 3문항 위저드) ─────────────────────
// /onboard/internet · /onboard/phone
// 설계 의도: 질문을 던지면서 동시에 판단 기준을 가르친다(💡 팁). 고객은 답을
// 고르는 사이 "왜 그게 유리한지"를 알게 되고, 상담 전에 신뢰가 먼저 쌓인다.
// 마지막에 답변을 쿼리로 실어 계산기로 넘긴다 — 같은 걸 두 번 묻지 않는다.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FLOWS, progressOf, answersToQuery } from '../../lib/onboard'
import { useStore } from '../../lib/store'

export default function Onboard() {
  const { slug = 'internet' } = useParams()
  const flow = FLOWS[slug] ?? FLOWS.internet
  const nav = useNavigate()
  const { dispatch } = useStore()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})

  const step = flow.steps[idx]
  const total = flow.steps.length
  const prog = useMemo(() => progressOf(idx, total), [idx, total])
  const picked = answers[step.id] ?? []
  const canNext = step.optional || picked.length > 0
  const last = idx === total - 1

  const toggle = (key) => {
    setAnswers((prev) => {
      const cur = prev[step.id] ?? []
      if (step.multi) {
        return { ...prev, [step.id]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
      }
      return { ...prev, [step.id]: [key] }
    })
  }

  const finish = () => {
    // 설문 완료도 AI 이벤트로 남긴다 — 어느 질문에서 이탈하는지 관제에서 보이게
    dispatch({ type: 'AI_EVENT', payload: { kind: 'onboard', q: flow.slug, source: 'engine', label: `${total}문항 완료`, auto: true } })
    nav(`${flow.resultTo}?${answersToQuery(flow.slug, answers)}`)
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 sm:px-8">
      <div className="mt-6 rounded-section bg-white p-5 shadow-card sm:mt-10 sm:p-8">
        {/* 진행률 — 남은 질문 수를 말로 알려 이탈을 줄인다 */}
        <div className="rounded-card bg-cream/70 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold text-muted">{prog.label}</span>
            <span className="tnum text-[15px] font-extrabold text-primary-text">{prog.pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${prog.pct}%` }} />
          </div>
        </div>

        {/* 질문 */}
        <div className="mt-6 flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint text-[14px] font-extrabold text-primary-text">{idx + 1}</span>
          <div className="pt-0.5">
            <h1 className="text-[19px] font-extrabold leading-[27px] tracking-[-0.4px] text-ink sm:text-[21px] sm:leading-[30px]">
              {step.q}{step.q2 && <><br />{step.q2}</>}
            </h1>
            {step.sub && <p className="mt-1 text-[13.5px] text-muted">{step.sub}</p>}
            {step.multi && <p className="mt-1 text-[12.5px] font-bold text-orange-text">(여러 개 선택 가능)</p>}
          </div>
        </div>

        {/* 보기 */}
        <div className={`mt-5 ${step.kind === 'carrier' ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-3'}`}>
          {step.options.map((o) => {
            const on = picked.includes(o.key)
            return step.kind === 'carrier' ? (
              <button
                key={o.key} onClick={() => toggle(o.key)} aria-pressed={on}
                className={`flex items-center gap-3.5 rounded-btn border p-3.5 text-left transition-colors ${on ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
              >
                <span className="flex h-9 w-[70px] shrink-0 items-center justify-center rounded-md bg-white text-[14px] font-extrabold" style={{ color: o.color }}>{o.mark}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] text-muted">{o.sub}</span>
                  <span className="block truncate text-[13px] font-bold text-label">{o.tags.join(' ')}</span>
                </span>
                {o.budget && <span className="shrink-0 rounded bg-ok/10 px-1.5 py-0.5 text-[11px] font-bold text-ok">알뜰</span>}
              </button>
            ) : (
              <button
                key={o.key} onClick={() => toggle(o.key)} aria-pressed={on}
                className={`rounded-btn border px-3 py-4 text-center transition-colors ${on ? 'border-[1.5px] border-primary bg-tint' : 'border-line bg-white hover:border-primary/50'}`}
              >
                <span className={`block text-[15px] font-extrabold ${on ? 'text-primary-text' : 'text-ink'}`}>{o.label}</span>
                <span className="mt-0.5 block text-[11.5px] text-muted">({o.desc})</span>
              </button>
            )
          })}
        </div>

        {/* 교육형 팁 — 이 화면의 핵심. 고르는 동안 판단 기준을 같이 배운다 */}
        <div className="mt-4 flex flex-col gap-2">
          {step.tips.map((tip) => (
            <div key={tip.t} className="rounded-card bg-cream/70 px-4 py-3.5">
              <div className="text-[13px] font-bold text-ink">💡 {tip.t}</div>
              {tip.d.map((line) => (
                <p key={line} className="mt-1 text-[12.5px] leading-[19px] text-muted">{line}</p>
              ))}
            </div>
          ))}
        </div>

        {/* 이동 */}
        <div className="mt-6 flex gap-2.5">
          {idx > 0 && (
            <button onClick={() => setIdx(idx - 1)} className="glass-btn h-[52px] flex-1 rounded-btn border border-line bg-white text-[15px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">
              이전
            </button>
          )}
          <button
            onClick={() => (last ? finish() : setIdx(idx + 1))}
            disabled={!canNext}
            className={`h-[52px] rounded-btn text-[15px] font-bold text-white transition-colors ${idx > 0 ? 'flex-[2]' : 'w-full'} ${canNext ? 'glass-btn-cta bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-primary/35'}`}
          >
            {last ? '결과보기' : '다음'}
          </button>
        </div>
        {!canNext && <p className="mt-2 text-center text-[12px] text-faint">하나 이상 선택하시면 다음으로 넘어가요</p>}
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        답변은 견적에만 사용되고 저장되지 않아요 ·{' '}
        <Link to="/consult" className="font-bold text-primary-text hover:underline">바로 상담 신청하기</Link>
      </p>
    </main>
  )
}
