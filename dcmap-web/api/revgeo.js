/**
 * vworld 지오코딩 프록시 — 두 방향을 한 함수로 (Hobby 12함수 제한 보존).
 *   • 리버스: ?lat=&lng=      → 클릭 지점의 지번·도로명 주소
 *   • 포워드: ?q=<주소>        → 지번/도로명 주소를 좌표로 (지번입력 부지 검색)
 * 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 *
 * 환경변수: VWORLD_KEY (필수, vworld.kr 발급 — 커밋 금지)
 * 리버스 응답: { available, parcel?, road?, legalCode?, sigunguCd?, bjdongCd?, bun?, ji? }
 *       legalCode(법정동코드 10자리)와 번/지는 건축HUB 건물에너지(/api/bldenergy) 질의에 사용.
 * 포워드 응답: { available, lat, lng, matched?, matchType? }
 */
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

// IPv4 A레코드 직결 GET — vworld의 UND_ERR_SOCKET(연결 리셋)·IPv6 블랙홀·happy-eyeballs를
// 우회. https는 SNI(servername)로 인증서 검증 유지. { status, text } 반환.
async function rawGetText(urlStr, headers, ms = 8000) {
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

// vworld 호출: undici(전역 fetch) → 실패 시 IPv4 직결 https → IPv4 직결 http.
// vworld 서버가 클라우드에서 소켓을 리셋(UND_ERR_SOCKET)하는 케이스를 IPv4 직결로 우회한다.
// { status, text } 반환, 모든 경로 실패 시 throw.
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

export default async function handler(req, res) {
  // 주소는 사실상 불변 — 엣지에서 하루 캐시
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')

  const key = process.env.VWORLD_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const vwDomain = process.env.VWORLD_DOMAIN || 'aidatacenter-red.vercel.app'

  // ── 포워드 지오코딩: ?q=<주소> → 좌표 (지번입력 부지 검색) ──
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (query) {
    // 지번(PARCEL) 우선 → 실패 시 도로명(ROAD)로 재시도 (입력 형식 자동 판별)
    try {
      for (const type of ['PARCEL', 'ROAD']) {
        const gurl =
          'https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0' +
          `&crs=epsg:4326&address=${encodeURIComponent(query)}&format=json&type=${type}` +
          `&key=${key}&domain=${encodeURIComponent(vwDomain)}`
        const { status, text } = await vworldGet(gurl, vwDomain)
        if (req.query.debug) {
          res.status(200).json({ available: true, debug: true, type, upstreamStatus: status, bodyHead: text.slice(0, 300) })
          return
        }
        if (status >= 400) continue
        let body = null
        try {
          body = JSON.parse(text)
        } catch {
          continue
        }
        if (body?.response?.status !== 'OK') continue
        const pt = body.response.result?.point
        const x = num(pt?.x) // 경도
        const y = num(pt?.y) // 위도
        if (x == null || y == null || y < 32 || y > 40 || x < 123 || x > 132) continue
        res.status(200).json({
          available: true,
          lat: y,
          lng: x,
          matched: body.response.refined?.text || query,
          matchType: type === 'PARCEL' ? '지번' : '도로명',
        })
        return
      }
      res.status(200).json({ available: false, reason: 'no_result' })
    } catch (e) {
      res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
    }
    return
  }

  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=both&zipcode=false&simple=false&key=${key}&domain=${encodeURIComponent(vwDomain)}`

  try {
    const { status, text } = await vworldGet(url, vwDomain)
    // ?debug=1 → vworld 원응답 상태·본문 앞부분(주소 정보뿐, 시크릿 아님) — 원인 진단
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
    let parcel
    let road
    let legalCode
    let bun
    let ji
    for (const item of body.response.result ?? []) {
      if (item.type === 'parcel') {
        parcel = item.text
        const s = item.structure
        // level4LC = 법정동코드 10자리, level5 = 번지("31" 또는 "31-2")
        if (s?.level4LC && /^\d{10}$/.test(s.level4LC)) legalCode = s.level4LC
        const jibun = String(s?.level5 ?? '').trim()
        const m = jibun.match(/^(\d+)(?:-(\d+))?/)
        if (m) {
          bun = m[1].padStart(4, '0')
          ji = (m[2] ?? '0').padStart(4, '0')
        }
      }
      if (item.type === 'road') road = item.text
    }
    const codes = legalCode
      ? { legalCode, sigunguCd: legalCode.slice(0, 5), bjdongCd: legalCode.slice(5), bun, ji }
      : {}
    res.status(200).json({ available: true, parcel, road, ...codes })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
