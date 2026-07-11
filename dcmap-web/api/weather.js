/**
 * 케이웨더 현재날씨 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 *
 * 스펙: KW_기상API_OpenAPI_20250929 (사용자 제공 가이드에서 확정)
 *  - 현재날씨(ODAM): GET {BASE}/apps-odam/{행정구역코드}?api_key={key}
 *    코드는 행정기관코드 10자리, 시군구 5자리 프리픽스 조회 지원
 *  - 응답: { error:"0", data: { [code]: { service:{timestamp}, data:{
 *      state, city, city2, pty, reh(습도%), rn1(mm), t1h(기온℃),
 *      senseTemp(체감℃), vec, wsd(m/s), wIcon, wText(한글 날씨) } } } }
 *
 * 좌표→코드: vworld getAddress의 법정동코드 앞 5자리(시군구)를 프리픽스로 사용
 * (법정동·행정동 코드는 시군구 단위까지 동일)
 *
 * 환경변수 (Vercel — 코드/리포에 키 커밋 금지):
 *  - KWEATHER_API_KEY (필수)
 *  - VWORLD_KEY (필수 — 좌표→시군구코드 변환)
 *  - KWEATHER_API_BASE (선택, 기본 https://gateway.kweather.co.kr/weather/w3/v2/kw-sensors)
 *
 * 응답: { available, temp, sky, humidity, senseTemp, rain1h, scope, timestamp }
 *  - 실패/미설정 시 available:false — 프런트는 '연동 대기' (가짜 수치 금지)
 */
const DEFAULT_BASE = 'https://gateway.kweather.co.kr/weather/w3/v2/kw-sensors'

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 5000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

/* 좌표 → 시군구 코드(행정기관코드 앞 5자리) — vworld 법정동코드에서 추출 */
async function sigunguCode(lat, lng, vworldKey) {
  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=parcel&zipcode=false&simple=false&key=${vworldKey}`
  const body = await fetchJson(url)
  if (body?.response?.status !== 'OK') return null
  for (const item of body.response.result ?? []) {
    const lc = item?.structure?.level4LC
    if (typeof lc === 'string' && /^\d{10}$/.test(lc)) return lc.slice(0, 5)
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const key = process.env.KWEATHER_API_KEY
  const vworldKey = process.env.VWORLD_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }
  if (!vworldKey) {
    res.status(200).json({ available: false, reason: 'need_vworld_key' })
    return
  }

  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  try {
    const sgg = await sigunguCode(lat, lng, vworldKey)
    if (!sgg) {
      res.status(200).json({ available: false, reason: 'no_region_code' })
      return
    }

    const base = (process.env.KWEATHER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
    const body = await fetchJson(`${base}/apps-odam/${sgg}?api_key=${key}`)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    if (String(body?.error ?? '') !== '0' || !body?.data || typeof body.data !== 'object') {
      res.status(200).json({ available: false, reason: 'upstream_error_body' })
      return
    }

    // 시군구 프리픽스 응답에서 대표 엔트리: 읍면동(city2) 채워진 첫 항목 우선
    const entries = Object.entries(body.data)
    if (!entries.length) {
      res.status(200).json({ available: false, reason: 'empty' })
      return
    }
    const pickFrom =
      entries.find(([code, v]) => code.startsWith(sgg) && v?.data?.city2) ??
      entries.find(([, v]) => v?.data) ??
      entries[0]
    const d = pickFrom[1]?.data ?? {}

    res.status(200).json({
      available: true,
      temp: num(d.t1h),
      sky: typeof d.wText === 'string' ? d.wText : undefined,
      humidity: num(d.reh),
      senseTemp: num(d.senseTemp),
      rain1h: num(d.rn1),
      scope: [d.state, d.city, d.city2].filter(Boolean).join(' '),
      timestamp: pickFrom[1]?.service?.timestamp,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.name || 'error'}` })
  }
}
