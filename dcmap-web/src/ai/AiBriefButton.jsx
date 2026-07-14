import { useAiStream } from './useAiStream.js'
import AiResultCard from './AiResultCard.jsx'

/* 재사용 AI 브리핑 버튼 — data(집계 실데이터)만 넘겨 서술형 브리핑 생성. 없는 값은 프롬프트가 '미확보' 처리. */
export default function AiBriefButton({ data, query, label = '✨ AI 지역 브리핑' }) {
  const { ai, run, busy } = useAiStream()
  const gen = () => run('brief', { data, query })
  return (
    <div className="ai-brief">
      <button type="button" className="btn ai" onClick={gen} disabled={busy}>
        {busy ? 'AI 브리핑 작성 중…' : label}
      </button>
      <AiResultCard
        ai={ai}
        badge="✨ AI 브리핑"
        src="공개 집계 데이터 기반 · 없는 값은 미확보 표기"
        onRegen={gen}
        loadingText="확보된 집계 데이터로 브리핑 작성 중…"
      />
    </div>
  )
}
