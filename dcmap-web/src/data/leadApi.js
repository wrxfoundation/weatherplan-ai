// 리드/문의 접수 클라이언트. 백엔드는 /api/power?src=lead (POST, _lead.js 위임).
// 정직성: 서버가 실제 전달(webhook) 성공을 알릴 때만 '접수됨'. 미설정이면 mailto/클립보드로 실제 경로 보장.

// 공개 문의 이메일 — env 우선, 없으면 기본 공개 문의 주소. UI에 직통 노출도 이 값 사용.
export const CONTACT_EMAIL = import.meta.env.VITE_LEAD_EMAIL || 'kwangdol@gmail.com'

export async function submitLead(payload, timeoutMs = 12000) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await fetch('/api/power?src=lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    const j = await r.json().catch(() => null)
    if (j?.ok) return { ok: true, delivered: j.delivered }
    return { ok: false, reason: j?.reason || `http_${r.status}` }
  } catch (e) {
    return { ok: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' }
  }
}

export const hasContactEmail = () => !!CONTACT_EMAIL

export function inquiryText(p) {
  return [
    `[AI InfraMap 문의] ${p.type || '문의'}`,
    `이름: ${p.name || ''}`,
    `회사: ${p.company || ''}`,
    `이메일: ${p.email || ''}`,
    `연락처: ${p.phone || ''}`,
    `용량: ${p.mw || ''}MW`,
    `지역: ${p.region || ''}`,
    p.context ? `맥락: ${p.context}` : '',
    '',
    p.message || '',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

export function mailtoFor(p) {
  if (!CONTACT_EMAIL) return null
  const subject = `[AI InfraMap 문의] ${p.type || '문의'}${p.company ? ` · ${p.company}` : ''}`
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiryText(p))}`
}

export function leadReasonLabel(reason) {
  if (reason === 'not_configured') return '접수 채널(웹훅) 미설정 — 아래 대체 경로로 전달해 주세요.'
  if (reason === 'missing_contact') return '이메일 또는 연락처 중 하나는 입력해 주세요.'
  if (reason === 'timeout') return '전송 시간이 초과됐어요. 다시 시도해 주세요.'
  if (reason === 'forbidden_origin') return '허용되지 않은 출처입니다.'
  return '전송에 실패했어요. 잠시 후 다시 시도해 주세요.'
}
