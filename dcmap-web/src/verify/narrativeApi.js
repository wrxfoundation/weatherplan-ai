/* AI 감정 서술문 초안 조회 — /api/power?src=ai (task 'wxfact' — Claude 프록시, api/_ai.js).
 * 정직성: 실패·미설정은 { available:false, reason }로 그대로 전달 — UI는 'AI 연동 대기' 유지(가짜 서술문 금지).
 * 로컬 vite dev/preview에는 서버리스 함수가 없으므로 404 → 'no_api'로 정규화된다. */
export async function fetchNarrative(payload) {
  try {
    const r = await fetch('/api/power?src=ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ task: 'wxfact', data: payload }),
    })
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) return { available: false, reason: 'no_api' }
    const j = await r.json()
    if (!j || typeof j !== 'object') return { available: false, reason: 'bad_payload' }
    if (j.available && typeof j.text === 'string' && j.text.trim()) return { available: true, text: j.text.trim() }
    return { available: false, reason: j.reason || 'empty' }
  } catch {
    return { available: false, reason: 'network' }
  }
}
