import AiText from './AiText.jsx'
import { usageLabel, aiReasonLabel } from '../data/aiApi.js'

/* AI 결과 카드 통합 — loading / text(+스트리밍 커서·사용량·재생성) / error 3상태.
 * 5개 소비처의 동일 마크업(~140줄 중복)을 대체.
 * props:
 *  - ai: useAiStream의 상태값
 *  - badge, src: 헤더 배지/출처 문구
 *  - onRegen: 있으면 '다시 생성'/'다시 시도' 버튼 노출(없으면 생략 — 예: 비교평)
 *  - className: 추가 클래스(예: 'ct-ai')
 *  - loadingText: 로딩 문구
 *  - footer: 비스트리밍 하단 커스텀(초안의 복사+재생성 flex 등). 주면 기본 usage/regen 대신 렌더. */
export default function AiResultCard({ ai, badge, src, onRegen, className = '', loadingText = 'AI가 작성 중…', footer }) {
  if (!ai) return null

  if (ai === 'loading') {
    return (
      <div className={`ai-card loading ${className}`.trim()} role="status">
        <span className="sp-spinner" aria-hidden /> {loadingText}
      </div>
    )
  }

  if (ai.error) {
    return (
      <div className={`ai-card err ${className}`.trim()} role="alert">
        {aiReasonLabel(ai.error)}
        {onRegen && ai.error !== 'not_configured' && (
          <button type="button" className="ai-regen" onClick={onRegen}>
            다시 시도
          </button>
        )}
      </div>
    )
  }

  if (!ai.text) return null

  return (
    <div className={`ai-card ${className}`.trim()} role="region" aria-label={badge}>
      <div className="ai-card-head">
        <span className="ai-badge">{badge}</span>
        {src && <span className="ai-src">{src}</span>}
      </div>
      <AiText text={ai.text} />
      {ai.streaming && <span className="ai-cursor" aria-hidden />}
      {!ai.streaming &&
        (footer !== undefined ? (
          footer
        ) : (
          <>
            {ai.usage && <div className="ai-usage">{usageLabel(ai.usage)}</div>}
            {onRegen && (
              <button type="button" className="ai-regen" onClick={onRegen}>
                다시 생성
              </button>
            )}
          </>
        ))}
    </div>
  )
}
