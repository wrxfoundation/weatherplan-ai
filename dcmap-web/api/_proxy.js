/**
 * 상류 프록시 계층 — 한국 IP egress로 클라우드 IP 차단 gov API를 뚫는 "근본 해결"의 코드측 준비.
 *
 * 배경: Vercel 서버리스는 리전이 icn1(서울)이어도 실제 나가는(egress) IP가 KR 상용망이 아니라,
 *   data.floodmap.go.kr · openapi.kpx.or.kr · bigdata.kepco.co.kr 등이 소켓을 끊거나(raw_timeout)
 *   연결을 거부한다(SOCKET/CONNECT_TIMEOUT). 한국 상용 IP를 가진 얇은 패스스루 프록시
 *   (케이웨더 자체 서버 / KR VPS / KR 서버리스)를 두고 그쪽으로 우회하면 gov 서버가 KR 상용
 *   IP로 인식해 정상 응답한다. 이것이 직접조회 링크 우회를 대체하는 진짜 해결책.
 *
 * 활성화(코드 재배포 불필요 — Vercel env만 추가):
 *  - UPSTREAM_PROXY_BASE — 프록시 엔드포인트. 예) https://proxy.kweather.co.kr/fetch
 *      프록시는 ?url=<대상 URL(인코딩)> 쿼리를 받아 그대로 대상에 GET → 응답 바디를 그대로 반환해야 한다.
 *  - PROXY_TOKEN (선택·권장) — 공유 시크릿. x-proxy-token 헤더로 전달. 프록시는 이 토큰 검증 +
 *      대상 호스트 allowlist로 오픈프록시 악용을 반드시 막을 것.
 *
 * 미설정 시: 대상 URL/헤더를 그대로 통과 → 오늘과 100% 동일 동작. 프록시를 세우기 전까지 완전 무해.
 *
 * 최소 프록시 예시(KR VPS, Node 20+): 대상 호스트 allowlist + 토큰 검증만 하는 ~30줄.
 *   const ALLOW = new Set(['data.floodmap.go.kr','openapi.kpx.or.kr','bigdata.kepco.co.kr','www.safetydata.go.kr'])
 *   http.createServer(async (req,res)=>{ const u=new URL(req.url,'http://x'); const t=u.searchParams.get('url')
 *     if(req.headers['x-proxy-token']!==process.env.PROXY_TOKEN) return res.writeHead(401).end()
 *     const tgt=new URL(t); if(!ALLOW.has(tgt.hostname)) return res.writeHead(403).end()
 *     const r=await fetch(t); res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'application/json'})
 *     res.end(await r.text()) }).listen(process.env.PORT||8080)
 */

export function proxyConfigured() {
  return Boolean(process.env.UPSTREAM_PROXY_BASE)
}

/** 대상 URL → { url, headers }. 프록시 미설정 시 원본 그대로(무해 통과). */
export function viaProxy(targetUrl) {
  const base = process.env.UPSTREAM_PROXY_BASE
  if (!base) return { url: targetUrl, headers: {} }
  const sep = base.includes('?') ? '&' : '?'
  const headers = {}
  if (process.env.PROXY_TOKEN) headers['x-proxy-token'] = process.env.PROXY_TOKEN
  return { url: `${base}${sep}url=${encodeURIComponent(targetUrl)}`, headers }
}

/** 프록시 경유 GET(text). 프록시가 정상 호스트라 undici happy-eyeballs/IP차단 이슈가 없다. */
export async function proxyGetText(targetUrl, ms = 8000) {
  const { url, headers } = viaProxy(targetUrl)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: '*/*',
        ...headers,
      },
    })
    if (!r.ok) throw new Error(`proxy_${r.status}`)
    return await r.text()
  } finally {
    clearTimeout(t)
  }
}
