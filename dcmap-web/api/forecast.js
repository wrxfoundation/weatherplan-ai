/**
 * 케이웨더 초단기예보(VSRT) 프록시 — H+1~6 시간별 기온·날씨 (기상축 M3 시간축).
 *
 * 스펙: KW_기상API_OpenAPI_20250929
 *  - GET {BASE}/kw-vsrt1/{행정구역코드}?api_key={key} (읍면동, 시군구 5자리 프리픽스 지원)
 *  - 응답 data[code].data: tmp[6](℃) · wText[6] · wsd[6](m/s) · pcp[6](mm) ·
 *    reh[6](%) · rain(Y/N) · start/end(강수 시각)
 *
 * 좌표→코드: vworld 법정동코드 앞 5자리 (weather.js와 동일 체인)
 * 응답: { available, hours:[{temp,sky}×6], rain, start, end, scope, timestamp }
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
  if (!key || !vworldKey) {
    res.status(200).json({ available: false, reason: 'not_configured' })
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
    const body = await fetchJson(`${base}/kw-vsrt1/${sgg}?api_key=${key}`)
    if (body?._status || String(body?.error ?? '') !== '0' || !body?.data) {
      res.status(200).json({ available: false, reason: body?._status ? `upstream_${body._status}` : 'upstream_error_body' })
      return
    }

    const entries = Object.entries(body.data)
    const pickFrom =
      entries.find(([code, v]) => code.startsWith(sgg) && v?.data?.city2) ??
      entries.find(([, v]) => v?.data) ??
      entries[0]
    if (!pickFrom) {
      res.status(200).json({ available: false, reason: 'empty' })
      return
    }
    const d = pickFrom[1]?.data ?? {}
    const tmp = Array.isArray(d.tmp) ? d.tmp : []
    const wText = Array.isArray(d.wText) ? d.wText : []
    const hours = tmp.slice(0, 6).map((t, i) => ({ temp: num(t), sky: wText[i] }))
    if (!hours.length) {
      res.status(200).json({ available: false, reason: 'empty' })
      return
    }

    res.status(200).json({
      available: true,
      hours,
      rain: d.rain === 'Y',
      start: d.start || undefined,
      end: d.end || undefined,
      scope: [d.state, d.city, d.city2].filter(Boolean).join(' '),
      timestamp: pickFrom[1]?.service?.timestamp,
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
