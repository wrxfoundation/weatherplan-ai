// ─── 공용 AI 인사이트 패널 (Opus 5 · 소스 배지 · 로컬 폴백) ─────────
// 본사 경영 브리핑 · 셀러 오늘의 코칭 · 소비자 진단 심화분석 공용 셸.
// build()가 {prompt, task, local}을 반환하면 callClaude로 실호출하고,
// 실패 시 local로 폴백한다. 결과 출처(Claude/데모)를 배지로 정직하게 표시.
import { useState } from 'react'
import { callClaude } from '../lib/ai'

export function AiSpark({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 2c.7 4.7 2.3 6.3 7 7-4.7.7-6.3 2.3-7 7-.7-4.7-2.3-6.3-7-7 4.7-.7 6.3-2.3 7-7Z" />
      <path d="M6 14c.35 2.2 1.15 3 3.3 3.3-2.15.3-2.95 1.1-3.3 3.3-.35-2.2-1.15-3-3.3-3.3C4.85 17 5.65 16.2 6 14Z" />
    </svg>
  )
}

// build: () => ({ prompt, task, local }) — 동기/비동기 모두 허용
export function AiInsight({ title, desc, cta = 'AI 분석 받기', build, consumer = false, className = '' }) {
  const [state, setState] = useState('idle')
  const [text, setText] = useState('')
  const [src, setSrc] = useState('local')
  const T = consumer
    ? { desc: 'text-muted', body: 'text-ink/90', muted: 'text-muted' }
    : { desc: 'text-bmuted', body: 'text-bbody', muted: 'text-bmuted' }

  const run = async () => {
    setState('loading')
    const { prompt, task, local } = await build()
    const reply = await callClaude(prompt, task)
    setText((reply ?? local ?? '').trim())
    setSrc(reply ? 'claude' : 'local')
    setState('done')
  }

  return (
    <div className={`rounded-card border border-primary/25 bg-tint/40 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-primary-text"><AiSpark /> {title}</div>
        {state === 'done' && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-bfaint">{src === 'claude' ? 'Claude Opus 5' : '데모 브레인'}</span>}
      </div>
      {state === 'idle' && (
        <>
          {desc && <p className={`mt-1 text-[12px] leading-4 ${T.desc}`}>{desc}</p>}
          <button onClick={run} className="glass-btn-cta mt-2.5 h-10 w-full rounded-field bg-primary text-[13.5px] font-bold text-white transition-colors hover:bg-primary-hover">{cta}</button>
        </>
      )}
      {state === 'loading' && (
        <div className={`mt-3 flex items-center gap-2 text-[13px] font-semibold ${T.muted}`}>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> 분석 중…
        </div>
      )}
      {state === 'done' && (
        <>
          <div className={`mt-2.5 whitespace-pre-line rounded-field bg-white p-3.5 text-[13px] leading-[22px] ${T.body}`}>{text}</div>
          <button onClick={run} className="mt-2 text-[12px] font-bold text-primary-text hover:underline">다시 생성</button>
        </>
      )}
    </div>
  )
}
