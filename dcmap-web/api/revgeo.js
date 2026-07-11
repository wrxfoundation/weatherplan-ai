/**
 * vworld 리버스 지오코딩 프록시 — 맵 클릭 지점의 지번·도로명 주소 조회.
 * 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 *
 * 환경변수: VWORLD_KEY (필수, vworld.kr 발급 — 커밋 금지)
 * 응답: { available, parcel?, road?, legalCode?, sigunguCd?, bjdongCd?, bun?, ji? }
 *       legalCode(법정동코드 10자리)와 번/지는 건축HUB 건물에너지(/api/bldenergy) 질의에 사용.
 */
const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

export default async function handler(req, res) {
  // 주소는 사실상 불변 — 엣지에서 하루 캐시
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

  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=both&zipcode=false&simple=false&key=${key}`

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)' } })
    clearTimeout(t)
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
    res.status(200).json({ available: false, reason: `upstream_${e?.name || 'error'}` })
  }
}
