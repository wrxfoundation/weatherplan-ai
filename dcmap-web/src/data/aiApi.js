// AI InfraMap — Claude 인텔리전스 클라이언트. 백엔드는 /api/power?src=ai (POST, _ai.js 위임).
// 정직성: 키 미설정이면 { available:false, reason:'not_configured' } → UI가 '연동 대기'로 표시.

export async function callAi(task, { query, data } = {}, timeoutMs = 30000) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await fetch('/api/power?src=ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, query, data }),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!r.ok) return { available: false, reason: `http_${r.status}` }
    return await r.json()
  } catch (e) {
    return { available: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' }
  }
}

export function aiReasonLabel(reason) {
  if (reason === 'not_configured') return 'AI 연동 대기 — 서버 환경변수(ANTHROPIC_API_KEY) 설정 시 활성화됩니다.'
  if (reason === 'timeout') return '응답 시간이 초과됐어요. 잠시 후 다시 시도해 주세요.'
  if (reason === 'unknown_task') return '지원하지 않는 요청입니다.'
  if (typeof reason === 'string' && reason.startsWith('upstream_429')) return 'AI 사용량이 일시적으로 한도에 도달했어요. 잠시 후 다시.'
  if (typeof reason === 'string' && reason.startsWith('upstream_')) return 'AI 서버 응답 오류 — 잠시 후 다시 시도해 주세요.'
  return 'AI 응답을 불러오지 못했어요.'
}
