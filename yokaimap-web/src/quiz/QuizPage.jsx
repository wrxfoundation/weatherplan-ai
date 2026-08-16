import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { YOKAI, CAT, slugOf } from '../data/yokai.js'
import { QUESTIONS, diagnose, AXIS_LABEL } from '../engine/quiz.js'
import { CategoryBadge, RarityBadge, VerificationBadge } from '../ui/Badges.jsx'
import { useHead } from '../ui/useHead.js'

/** 답변을 URL(a=01230123)에 담아 결과 링크가 그대로 공유되게 한다 — 서버 상태 없이 바이럴. */
const encode = (answers) => answers.join('')
const decode = (s) =>
  /^[0-3]{8}$/.test(s ?? '') ? s.split('').map(Number) : null

export default function QuizPage() {
  const [params, setParams] = useSearchParams()
  const fromUrl = decode(params.get('a'))
  const [answers, setAnswers] = useState(fromUrl ?? [])

  useHead({
    title: '요괴 체질진단 — 한국요괴지도',
    description: '8문항으로 알아보는 나와 가장 가까운 한국 요괴. 음양·물뭍·자연사람·수호장난 4축 결정론 진단.',
    canonical: '/quiz',
  })

  const done = answers.length === QUESTIONS.length
  const result = useMemo(() => (done ? diagnose(YOKAI, answers) : null), [done, answers])

  const choose = (i) => {
    const next = [...answers, i]
    setAnswers(next)
    if (next.length === QUESTIONS.length) setParams({ a: encode(next) }, { replace: true })
  }

  const restart = () => {
    setAnswers([])
    setParams({}, { replace: true })
  }

  if (!done) {
    const idx = answers.length
    const q = QUESTIONS[idx]
    return (
      <main className="page page-narrow">
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 4 }}>요괴 체질진단</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          8문항 · 같은 답이면 언제나 같은 결과가 나오는 결정론 진단입니다.
        </p>
        <div className="progress" style={{ margin: 'var(--sp-4) 0' }}>
          <span style={{ width: `${(idx / QUESTIONS.length) * 100}%` }} />
        </div>
        <div className="quiz-q">
          <p className="small muted" style={{ margin: 0 }}>
            {idx + 1} / {QUESTIONS.length}
          </p>
          <h2>{q.text}</h2>
          {q.options.map((o, i) => (
            <button key={i} className="quiz-opt" onClick={() => choose(i)}>
              {o.label}
            </button>
          ))}
        </div>
        {idx > 0 && (
          <p className="small">
            <button className="chip" onClick={() => setAnswers(answers.slice(0, -1))}>
              ← 이전 문항
            </button>
          </p>
        )}
      </main>
    )
  }

  const { entry, category, reasons, runnersUp } = result
  const cat = CAT[category]

  return (
    <main className="page page-narrow">
      <p className="small muted" style={{ margin: 0 }}>
        요괴 체질진단 결과
      </p>
      <div className="detail-head">
        <h1>{entry.canonical}</h1>
        <div className="row" style={{ gap: 6 }}>
          <CategoryBadge id={entry.category} />
          <RarityBadge id={entry.rarity} />
          <VerificationBadge id={entry.verification} confidence={entry.confidence} />
        </div>
      </div>

      <p className="body-text" style={{ fontSize: 'var(--text-title)' }}>
        {entry.summary}
      </p>

      <div className="section">
        <h2>왜 이 결과인가</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          당신의 답은 <strong style={{ color: cat?.color }}>{cat?.name}</strong> 계열에 가장 가깝습니다.
        </p>
        <dl className="kv">
          {reasons.map((r) => (
            <div key={r.axis} style={{ display: 'contents' }}>
              <dt>{AXIS_LABEL[r.axis].join(' ↔ ')}</dt>
              <dd>
                {r.label} <span className="muted">({r.value > 0 ? `+${r.value}` : r.value})</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="small muted">
          가까운 다른 계열: {runnersUp.map((id) => CAT[id]?.name).filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="row" style={{ marginTop: 'var(--sp-4)' }}>
        <Link className="chip on" style={{ '--chip-color': 'var(--accent)' }} to={`/yokai/${slugOf(entry)}`}>
          {entry.canonical} 자세히 보기
        </Link>
        <button
          className="chip"
          onClick={() => {
            const url = `${window.location.origin}/quiz?a=${encode(answers)}`
            navigator.clipboard?.writeText(url)
          }}
        >
          결과 링크 복사
        </button>
        <button className="chip" onClick={restart}>
          다시 하기
        </button>
      </div>

      <p className="notice" style={{ marginTop: 'var(--sp-4)' }}>
        이 진단은 재미를 위한 것이며 운세·점술이 아닙니다. 결과로 나오는 요괴 항목의 서술은 모두 공개 자료에 출처를 둔
        도감 데이터입니다.
      </p>
    </main>
  )
}
