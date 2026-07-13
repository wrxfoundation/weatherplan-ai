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

// 스트리밍 호출 — SSE 델타를 onDelta(누적텍스트)로 흘려보낸다. 스트림 불가/키미설정 시 비스트리밍 폴백.
export async function callAiStream(task, { query, data } = {}, onDelta, timeoutMs = 33000) {
  const fallback = async () => {
    const j = await callAi(task, { query, data })
    if (j?.available && j.text) onDelta?.(j.text)
    return j
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await fetch('/api/power?src=ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, query, data, stream: true }),
      signal: ctrl.signal,
    })
    const ct = r.headers.get('content-type') || ''
    if (!r.ok || !r.body || !ct.includes('text/event-stream')) {
      clearTimeout(t)
      // 서버가 비스트리밍 JSON(예: not_configured) 반환 시 그대로 처리
      const j = await r.json().catch(() => null)
      if (j) {
        if (j.available && j.text) onDelta?.(j.text)
        return j
      }
      return fallback()
    }
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let text = ''
    let usage = null
    let refusal = false
    let errored = null
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let idx
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const line = block.split('\n').find((l) => l.startsWith('data:'))
        if (!line) continue
        let ev
        try {
          ev = JSON.parse(line.slice(5).trim())
        } catch {
          continue
        }
        if (ev.delta) {
          text += ev.delta
          onDelta?.(text)
        } else if (ev.error) {
          errored = ev.error
        } else if (ev.done) {
          usage = ev.usage
          refusal = ev.refusal
        }
      }
    }
    clearTimeout(t)
    if (errored && !text) return { available: false, reason: errored }
    if (refusal && !text) return { available: true, text: '요청을 처리할 수 없습니다(안전 정책).', refusal: true }
    return { available: true, text, usage }
  } catch (e) {
    return { available: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' }
  }
}

// 사용량/비용 요약 — 응답 usage → "입력 1.2K · 출력 0.4K · 캐시 ✓ · ≈$0.006"
export function usageLabel(u) {
  if (!u) return null
  const k = (n) => (n == null ? '?' : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
  const parts = [`입력 ${k(u.in)}`, `출력 ${k(u.out)}`]
  if (u.cacheRead) parts.push('캐시 ✓')
  if (u.usd != null) parts.push(`≈$${u.usd < 0.001 ? u.usd.toFixed(5) : u.usd.toFixed(4)}`)
  return parts.join(' · ')
}

export function aiReasonLabel(reason) {
  if (reason === 'not_configured') return 'AI 연동 대기 — 서버 환경변수(ANTHROPIC_API_KEY) 설정 시 활성화됩니다.'
  if (reason === 'timeout') return '응답 시간이 초과됐어요. 잠시 후 다시 시도해 주세요.'
  if (reason === 'unknown_task') return '지원하지 않는 요청입니다.'
  if (typeof reason === 'string' && reason.startsWith('upstream_429')) return 'AI 사용량이 일시적으로 한도에 도달했어요. 잠시 후 다시.'
  if (typeof reason === 'string' && reason.startsWith('upstream_')) return 'AI 서버 응답 오류 — 잠시 후 다시 시도해 주세요.'
  return 'AI 응답을 불러오지 못했어요.'
}
