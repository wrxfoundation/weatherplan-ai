import { useState } from 'react'
import { callAi, aiReasonLabel } from '../data/aiApi.js'
import AiText from './AiText.jsx'

/* 재사용 AI 브리핑 버튼 — data(집계 실데이터)만 넘겨 서술형 브리핑 생성. 없는 값은 프롬프트가 '미확보' 처리. */
export default function AiBriefButton({ data, query, label = '✨ AI 지역 브리핑' }) {
  const [ai, setAi] = useState(null)
  const gen = async () => {
    setAi('loading')
    const res = await callAi('brief', { data, query })
    if (res?.available && res.text) setAi({ text: res.text })
    else setAi({ error: res?.reason || 'error' })
  }
  return (
    <div className="ai-brief">
      <button type="button" className="btn ai" onClick={gen} disabled={ai === 'loading'}>
        {ai === 'loading' ? 'AI 브리핑 작성 중…' : label}
      </button>
      {ai === 'loading' && (
        <div className="ai-card loading" role="status">
          <span className="sp-spinner" aria-hidden /> 확보된 집계 데이터로 브리핑 작성 중…
        </div>
      )}
      {ai && ai !== 'loading' && ai.text && (
        <div className="ai-card" role="region" aria-label="AI 브리핑">
          <div className="ai-card-head">
            <span className="ai-badge">✨ AI 브리핑</span>
            <span className="ai-src">공개 집계 데이터 기반 · 없는 값은 미확보 표기</span>
          </div>
          <AiText text={ai.text} />
          <button type="button" className="ai-regen" onClick={gen}>다시 생성</button>
        </div>
      )}
      {ai && ai !== 'loading' && ai.error && (
        <div className="ai-card err" role="alert">
          {aiReasonLabel(ai.error)}
          {ai.error !== 'not_configured' && (
            <button type="button" className="ai-regen" onClick={gen}>다시 시도</button>
          )}
        </div>
      )}
    </div>
  )
}
