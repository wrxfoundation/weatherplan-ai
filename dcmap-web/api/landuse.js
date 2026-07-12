/**
 * vworld 용도지역 프록시 — 맵 클릭 지점의 도시계획 용도지역 조회 (토지축 v1 근거 데이터).
 * vworld 데이터 API GetFeature, 레이어 LT_C_UQ111(용도지역). 키는 서버 env 전용.
 *
 * 환경변수: VWORLD_KEY (revgeo와 공용)
 * 응답: { available, uses: string[] } — 실패/미설정 시 available:false ('조회 대기' 표시)
 * 점수화 주의: 용도지역명은 표시·근거용. 토지축 배점은 골든케이스 캘리브레이션 후(가짜 점수 금지).
 */
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

// IPv4 A레코드 직결 GET — vworld UND_ERR_SOCKET·IPv6 블랙홀 우회(https는 SNI 유지). { status, text }
async function rawGetText(urlStr, headers, ms = 7000) {
  const u = new URL(urlStr)
  const ips = await dnsp.resolve4(u.hostname)
  if (!ips?.length) throw new Error('no_a_record')
  const isHttps = u.protocol === 'https:'
  const mod = isHttps ? https : http
  const opts = {
    host: ips[0],
    port: u.port || (isHttps ? 443 : 80),
    path: u.pathname + u.search,
    method: 'GET',
    timeout: ms,
    headers: { ...headers, Host: u.hostname, Connection: 'close' },
  }
  if (isHttps) opts.servername = u.hostname
  return await new Promise((resolve, reject) => {
    const rq = mod.request(opts, (r) => {
      let data = ''
      r.setEncoding('utf8')
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve({ status: r.statusCode || 200, text: data }))
    })
    rq.on('timeout', () => rq.destroy(new Error('raw_timeout')))
    rq.on('error', reject)
    rq.end()
  })
}

// vworld 호출: undici → IPv4 직결 https → IPv4 직결 http. { status, text } | throw
async function vworldGet(url, vwDomain) {
  const headers = { 'User-Agent': UA, Referer: `https://${vwDomain}/`, Accept: 'application/json' }
  let lastErr = null
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers })
      return { status: r.status, text: await r.text() }
    } finally {
      clearTimeout(t)
    }
  } catch (e) {
    lastErr = e
  }
  const httpUrl = url.startsWith('https://') ? url.replace('https://', 'http://') : url
  for (const u of [url, httpUrl]) {
    try {
      return await rawGetText(u, headers, 7000)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('unreachable')
}

/* 응답 필드명 방어적 추출 — properties 안에서 '…지역/지구'로 끝나는 명칭 문자열 수집 */
function collectUseNames(obj, acc) {
  if (!obj || typeof obj !== 'object') return
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && /(지역|지구|구역)$/.test(v) && v.length <= 30) acc.add(v)
    else if (v && typeof v === 'object') collectUseNames(v, acc)
  }
}

export default async function handler(req, res) {
  // 용도지역은 고시 단위로만 바뀜 — 엣지 하루 캐시
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')

  const key = process.env.VWORLD_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  const vwDomain = process.env.VWORLD_DOMAIN || 'aidatacenter-red.vercel.app'
  const url =
    'https://api.vworld.kr/req/data?service=data&version=2.0&request=GetFeature&format=json' +
    `&size=5&page=1&data=LT_C_UQ111&geomFilter=POINT(${lng} ${lat})&key=${key}&domain=${encodeURIComponent(vwDomain)}`

  try {
    const { status, text } = await vworldGet(url, vwDomain)
    if (req.query.debug) {
      res.status(200).json({ available: true, debug: true, upstreamStatus: status, bodyHead: text.slice(0, 300) })
      return
    }
    if (status >= 400) {
      res.status(200).json({ available: false, reason: `upstream_${status}` })
      return
    }
    let body = null
    try {
      body = JSON.parse(text)
    } catch {
      res.status(200).json({ available: false, reason: 'not_json' })
      return
    }
    if (body?.response?.status !== 'OK') {
      res.status(200).json({ available: false, reason: 'no_result' })
      return
    }
    const names = new Set()
    collectUseNames(body.response.result, names)
    if (!names.size) {
      res.status(200).json({ available: false, reason: 'empty' })
      return
    }
    res.status(200).json({ available: true, uses: [...names] })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
