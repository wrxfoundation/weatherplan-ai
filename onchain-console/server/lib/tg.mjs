// 텔레그램 Bot API 최소 래퍼 — 외부 의존성 없음(Node 18+ 내장 fetch).
// 토큰은 반드시 환경변수로만 받는다. 코드·로그에 절대 남기지 않는다.

const API = 'https://api.telegram.org'

export function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`[env] ${name} 이(가) 없습니다. server/.env 를 만들고 채우세요 (.env.example 참고).`)
    process.exit(1)
  }
  return v
}

/** Bot API 호출. 실패 시 description을 그대로 올려 원인 파악이 되게 한다. */
export async function tg(method, params = {}) {
  const token = requireEnv('TELEGRAM_BOT_TOKEN')
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.ok) {
    const desc = json.description ?? `HTTP ${res.status}`
    throw new Error(`${method} 실패: ${desc}`)
  }
  return json.result
}

/** 토큰이 로그·에러에 섞여 나가지 않게 마스킹 */
export const mask = (s) => String(s).replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot***')

export const today = () => new Date().toISOString().slice(0, 10)
export const nowIso = () => new Date().toISOString()
