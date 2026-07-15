/**
 * 리드/문의 접수 핸들러 (헬퍼: 파일명 '_' 접두라 Vercel 함수 카운트 제외).
 * power.js가 src=lead로 위임 (POST /api/power?src=lead).
 *
 * 정직성: 실제로 어딘가에 전달됐을 때만 성공을 보고한다.
 *  - LEAD_WEBHOOK_URL(env)가 설정되면 그 웹훅으로 POST 포워드(Slack/Discord/구글앱스스크립트 등 호환).
 *    → { ok:true, delivered:'webhook' }
 *  - 미설정이면 저장할 곳이 없으므로 성공을 꾸미지 않는다 → { ok:false, reason:'not_configured' }.
 *    클라이언트가 mailto 폴백으로 실제 전달 경로를 보장한다.
 *
 * 환경변수(서버 전용 — 리포 커밋/로그 노출 금지):
 *  - LEAD_WEBHOOK_URL (선택). 없으면 not_configured.
 */

function originAllowed(origin) {
  if (!origin) return true
  let host = ''
  try {
    host = new URL(origin).host
  } catch {
    return false
  }
  return (
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host.endsWith('.vercel.app') ||
    host.endsWith('koreaapi.dev') ||
    host === 'aiagentlabs.co.kr' ||
    host.endsWith('.aiagentlabs.co.kr')
  )
}

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')

export async function leadHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' })
    return
  }
  if (!originAllowed(req.headers.origin)) {
    res.status(403).json({ ok: false, reason: 'forbidden_origin' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  body = body || {}

  // 필드 정규화(길이 제한) — 저장/전달 페이로드
  const lead = {
    유형: clip(body.type, 40) || '문의',
    이름: clip(body.name, 80),
    회사: clip(body.company, 120),
    이메일: clip(body.email, 160),
    연락처: clip(body.phone, 40),
    용량MW: clip(String(body.mw ?? ''), 20),
    지역: clip(body.region, 80),
    메시지: clip(body.message, 2000),
    맥락: clip(body.context, 400),
    출처: clip(req.headers.referer || '', 200),
    ts: new Date().toISOString(),
  }

  // 최소 검증 — 연락 수단(이메일 또는 연락처) 없으면 접수 불가
  if (!lead.이메일 && !lead.연락처) {
    res.status(400).json({ ok: false, reason: 'missing_contact' })
    return
  }

  const webhook = process.env.LEAD_WEBHOOK_URL
  if (!webhook) {
    // 저장/전달 경로 없음 — 성공을 꾸미지 않는다(정직). 클라이언트가 mailto로 폴백.
    res.status(200).json({ ok: false, reason: 'not_configured' })
    return
  }

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const text = [
      `📥 AI InfraMap 새 문의 — ${lead.유형}`,
      `이름: ${lead.이름 || '-'} / 회사: ${lead.회사 || '-'}`,
      `이메일: ${lead.이메일 || '-'} / 연락처: ${lead.연락처 || '-'}`,
      `용량: ${lead.용량MW || '-'}MW / 지역: ${lead.지역 || '-'}`,
      `맥락: ${lead.맥락 || '-'}`,
      `메시지: ${lead.메시지 || '-'}`,
      `출처: ${lead.출처 || '-'} · ${lead.ts}`,
    ].join('\n')
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Slack/Discord 호환(text) + 원본 필드 동봉(구글앱스스크립트 등에서 파싱)
      body: JSON.stringify({ text, content: text, lead }),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!r.ok) {
      res.status(200).json({ ok: false, reason: `webhook_${r.status}` })
      return
    }
    res.status(200).json({ ok: true, delivered: 'webhook' })
  } catch (e) {
    res.status(200).json({ ok: false, reason: e?.name === 'AbortError' ? 'timeout' : 'webhook_error' })
  }
}
