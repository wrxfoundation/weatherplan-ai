/**
 * AI InfraMap 상류 프록시 — Deno Deploy 버전 (무료 · CF 대안)
 *
 * 배포(대시보드, ~5분):
 *   1) dash.deno.com → New Project → Playground(또는 GitHub 연결) → 이 코드 붙여넣기 → Save & Deploy.
 *   2) Project → Settings → Environment Variables: PROXY_TOKEN = <임의 긴 문자열>.
 *   3) 발급 URL(예: https://infra-proxy.deno.dev) 확인.
 *   4) Vercel env: UPSTREAM_PROXY_BASE = 발급 URL · PROXY_TOKEN = 동일 값 · KEPCO_API_KEY = 한전 40자리 → 재배포.
 *
 * 원리는 cloudflare-worker.js와 동일: ?url=<대상> + x-proxy-token → 호스트 allowlist 확인 후 패스스루.
 */

const ALLOW = new Set<string>([
  'data.floodmap.go.kr',
  'openapi.kpx.or.kr',
  'apis.data.go.kr',
  'bigdata.kepco.co.kr',
  'www.safetydata.go.kr',
  'api.vworld.kr',
])

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

Deno.serve(async (req: Request) => {
  const u = new URL(req.url)
  const target = u.searchParams.get('url')
  if (!target) return new Response('missing ?url', { status: 400 })

  const token = Deno.env.get('PROXY_TOKEN')
  if (token && req.headers.get('x-proxy-token') !== token) {
    return new Response('unauthorized', { status: 401 })
  }

  let t: URL
  try {
    t = new URL(target)
  } catch {
    return new Response('bad url', { status: 400 })
  }
  if (!ALLOW.has(t.hostname)) return new Response(`host not allowed: ${t.hostname}`, { status: 403 })

  try {
    const r = await fetch(target, { headers: { 'User-Agent': UA, Accept: '*/*' } })
    const body = await r.text()
    return new Response(body, {
      status: r.status,
      headers: {
        'content-type': r.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ proxy_error: String(e instanceof Error ? e.message : e) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
})
