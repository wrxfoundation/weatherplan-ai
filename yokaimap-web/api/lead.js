/**
 * B2B 리드 접수 — 지자체·기관·스튜디오 문의.
 *
 * 저장소: Supabase REST(SUPABASE_URL + SUPABASE_SERVICE_KEY). SDK 의존성 없이 fetch만 쓴다.
 * 미설정이면 **접수 성공을 가장하지 않는다**. { ok:false, reason:'storage_unconfigured' }를 돌려주고
 * 화면이 이메일 폴백을 안내한다 — 리드를 조용히 흘리는 것이 이 프로젝트에서 가장 비싼 실수다.
 *
 * 테이블(선택):
 *   create table public.yokai_leads (
 *     id bigint generated always as identity primary key,
 *     org text, name text, email text, phone text, kind text, message text,
 *     source text default 'web', created_at timestamptz default now()
 *   );
 */
const KINDS = new Set(['govt', 'license', 'ip', 'etc'])
const MAX = { org: 120, name: 60, email: 160, phone: 40, message: 4000 }

const clean = (v, n) => String(v ?? '').trim().slice(0, n)
const looksEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})

  // 허니팟 — 봇이 채우면 성공처럼 응답하고 버린다
  if (clean(body.website, 200)) {
    res.status(200).json({ ok: true })
    return
  }

  const lead = {
    org: clean(body.org, MAX.org),
    name: clean(body.name, MAX.name),
    email: clean(body.email, MAX.email),
    phone: clean(body.phone, MAX.phone),
    kind: KINDS.has(body.kind) ? body.kind : 'etc',
    message: clean(body.message, MAX.message),
    source: 'web',
  }

  if (!lead.name || !looksEmail(lead.email) || lead.message.length < 5) {
    res.status(400).json({ ok: false, reason: 'invalid_input' })
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    res.status(200).json({ ok: false, reason: 'storage_unconfigured' })
    return
  }

  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/yokai_leads`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(lead),
    })
    if (!r.ok) {
      res.status(200).json({ ok: false, reason: 'storage_error' })
      return
    }
    res.status(200).json({ ok: true })
  } catch {
    res.status(200).json({ ok: false, reason: 'storage_error' })
  }
}
