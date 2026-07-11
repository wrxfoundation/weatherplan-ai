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
const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

const UA_HEADERS = (vwDomain) => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Referer: `https://${vwDomain}/`,
  Accept: 'application/json',
})

// vworld는 간헐 소켓 리셋(UND_ERR_SOCKET)이 있어 1회 재시도하는 공통 fetch
async function vworldFetch(url, vwDomain) {
  const once = async () => {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    try {
      return await fetch(url, { signal: ctrl.signal, headers: UA_HEADERS(vwDomain) })
    } finally {
      clearTimeout(t)
    }
  }
  try {
    return await once()
  } catch {
    await new Promise((ok) => setTimeout(ok, 400))
    return await once()
  }
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
        const r = await vworldFetch(gurl, vwDomain)
        if (req.query.debug) {
          const text = await r.text().catch(() => '')
          res.status(200).json({ available: true, debug: true, type, upstreamStatus: r.status, bodyHead: text.slice(0, 300) })
          return
        }
        if (!r.ok) continue
        const body = await r.json().catch(() => null)
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
    const r = await vworldFetch(url, vwDomain)
    // ?debug=1 → vworld 원응답 상태·본문 앞부분(주소 정보뿐, 시크릿 아님) — 502 원인 진단
    if (req.query.debug) {
      const text = await r.text().catch(() => '')
      res.status(200).json({ available: true, debug: true, upstreamStatus: r.status, bodyHead: text.slice(0, 300) })
      return
    }
    if (!r.ok) {
      res.status(200).json({ available: false, reason: `upstream_${r.status}` })
      return
    }
    const body = await r.json()
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
