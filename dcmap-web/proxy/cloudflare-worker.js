/**
 * AI InfraMap 상류 프록시 — Cloudflare Workers 버전 (무료 · 유지할 서버 없음)
 *
 * 케이웨더 자체 서버를 못 쓸 때의 무료 대안. Cloudflare 무료 계정에 이 코드를 붙여넣고
 * 배포하면 끝(유지보수 대상 서버 없음, 무료 100k req/day).
 *
 * ⚠️ 한계(정직): CF Workers의 egress IP도 클라우드 대역이라 gov 서버가 CF까지 막으면
 *   이 경로도 안 뚫린다. 다만 KEPCO/floodmap이 "IPv6 블랙홀"이 원인이면 Vercel의 IPv4-직결
 *   폴백(api/*.js에 이미 구현)만으로 프록시 없이 뚫린다 — 그래서 순서는 아래 "배포 전 확인".
 *
 * ── 배포 전 확인(프록시가 정말 필요한지) ──
 *   1) Vercel에 KEPCO_API_KEY만 넣고 재배포 → /api/headroom?lat=37.5&lng=127.0 호출.
 *   2) { available:true, ... } 나오면 프록시 불필요(IPv4-직결로 이미 뚫림). 끝.
 *   3) { reason: "upstream_raw_timeout" / "upstream_UND_ERR_SOCKET" } 면 하드 차단 → 이 워커 배포.
 *
 * ── 배포 방법 (대시보드, ~5분) ──
 *   1) dash.cloudflare.com → Workers & Pages → Create → Worker → 이 파일 내용 붙여넣기 → Deploy.
 *   2) 워커 Settings → Variables and Secrets → Secret 추가: PROXY_TOKEN = <임의의 긴 문자열>.
 *   3) 배포된 워커 URL 확인(예: https://infra-proxy.<계정>.workers.dev).
 *   4) Vercel env 3개 추가 후 재배포:
 *        UPSTREAM_PROXY_BASE = https://infra-proxy.<계정>.workers.dev
 *        PROXY_TOKEN         = (2에서 정한 값과 동일)
 *        KEPCO_API_KEY       = (한전 40자리 인증키)
 *   5) /api/headroom 다시 호출 → 실데이터 확인.
 *
 * (wrangler CLI를 쓰면: `wrangler deploy` + `wrangler secret put PROXY_TOKEN`)
 */

// 프록시가 대신 호출해도 되는 대상 호스트만 허용(오픈프록시 악용 차단). 필요 시 추가.
const ALLOW = new Set([
  'data.floodmap.go.kr', // 홍수위험지도
  'openapi.kpx.or.kr', // KPX 수급예보
  'apis.data.go.kr', // data.go.kr 공통(EPSIS·전력거래 등)
  'bigdata.kepco.co.kr', // 한전 분산전원연계정보(여유용량)
  'www.safetydata.go.kr', // 재난안전
  'api.vworld.kr', // 좌표→법정동코드(headroom/disaster 선행 호출)
])

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export default {
  async fetch(request, env) {
    const u = new URL(request.url)
    const target = u.searchParams.get('url')
    if (!target) return new Response('missing ?url', { status: 400 })

    // 공유 토큰 검증(설정된 경우) — 아무나 프록시를 못 쓰게.
    if (env.PROXY_TOKEN && request.headers.get('x-proxy-token') !== env.PROXY_TOKEN) {
      return new Response('unauthorized', { status: 401 })
    }

    let t
    try {
      t = new URL(target)
    } catch {
      return new Response('bad url', { status: 400 })
    }
    if (!ALLOW.has(t.hostname)) return new Response(`host not allowed: ${t.hostname}`, { status: 403 })

    try {
      const r = await fetch(target, { headers: { 'User-Agent': UA, Accept: '*/*' }, cf: { cacheTtl: 0 } })
      const body = await r.text()
      return new Response(body, {
        status: r.status,
        headers: {
          'content-type': r.headers.get('content-type') || 'application/json',
          'cache-control': 'no-store',
        },
      })
    } catch (e) {
      return new Response(JSON.stringify({ proxy_error: String(e && e.message ? e.message : e) }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      })
    }
  },
}
