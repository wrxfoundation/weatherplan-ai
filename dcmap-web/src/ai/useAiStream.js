import { useCallback, useState } from 'react'
import { callAiStream } from '../data/aiApi.js'

/* AI 스트리밍 상태머신 통합 — 5개 소비처(부지브리프·지역브리핑·비교평·초안·계산해설)가
 * 반복하던 setAi('loading') → callAiStream(onDelta) → 결과/에러 처리 시퀀스를 한 곳으로.
 * ai: null | 'loading' | { text, streaming } | { text, usage } | { error }
 * busy: 로딩 또는 스트리밍 중(버튼 비활성용 — 동시 스트림 레이스 방지). */
export function useAiStream() {
  const [ai, setAi] = useState(null)
  const busy = ai === 'loading' || !!ai?.streaming

  const run = useCallback(
    async (task, payload) => {
      if (ai === 'loading' || ai?.streaming) return null // 재진입 차단
      setAi('loading')
      const res = await callAiStream(task, payload, (partial) => setAi({ text: partial, streaming: true }))
      if (res?.available && res.text) setAi({ text: res.text, usage: res.usage })
      else setAi({ error: res?.reason || 'error' })
      return res
    },
    [ai],
  )

  const reset = useCallback(() => setAi(null), [])
  return { ai, run, reset, busy }
}
