/**
 * 재난안전데이터 공유플랫폼 프록시 — 지점이 속한 시군구의 재해 이력(재해연보)을 조회.
 * 리스크축(15점)의 "재해" 항목 소스. 홍수(floodmap)·인구(sgis)와 함께 리스크축을 채운다.
 *
 * 소스: safetydata.go.kr (재난 발생 현황·피해 통계). 좌표 → 시군구 코드는 vworld 법정동코드(headroom과 동일 체인).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DISASTER_KEY (필수) — 재난안전 공유플랫폼 인증키
 *  - VWORLD_KEY (필수 — 좌표→시군구 코드)
 *  - DISASTER_URL (선택) — 엔드포인트 템플릿. {sigungu}{key} 플레이스홀더. 실경로 확정 시 이 env만 수정.
 *
 * 응답: { available, events?, recentYear?, topType?, scope } | { available:false, reason }
 */
const DEFAULT_URL =
  'https://www.safetydata.go.kr/openapi/disasterStats?sigunguCd={sigungu}&serviceKey={key}&returnType=json'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } })
    if (!r.ok) return { _status: r.status }
    const text = await r.text()
    try {
      return JSON.parse(text)
    } catch {
      return { _status: 'not_json' }
    }
  } finally {
    clearTimeout(t)
  }
}

function pick(obj, names, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined
  for (const n of names) if (obj[n] != null && obj[n] !== '') return obj[n]
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) {
      const f = pick(v[0], names, depth + 1)
      if (f !== undefined) return f
    } else if (v && typeof v === 'object') {
      const f = pick(v, names, depth + 1)
      if (f !== undefined) return f
    }
  }
  return undefined
}

/* 좌표 → 시군구(5) 행정코드 (vworld 법정동코드) — headroom.js와 동일 */
async function sigunguCode(lat, lng, vworldKey) {
  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=parcel&zipcode=false&simple=false&key=${vworldKey}&domain=${encodeURIComponent(process.env.VWORLD_DOMAIN || 'aidatacenter-red.vercel.app')}`
  const body = await fetchJson(url)
  if (body?.response?.status !== 'OK') return null
  for (const item of body.response.result ?? []) {
    const lc = item?.structure?.level4LC
    if (typeof lc === 'string' && /^\d{10}$/.test(lc)) return lc.slice(0, 5)
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.DISASTER_KEY
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
    const sigungu = await sigunguCode(lat, lng, vworldKey)
    if (!sigungu) {
      res.status(200).json({ available: false, reason: 'no_region_code' })
      return
    }
    const url = (process.env.DISASTER_URL || DEFAULT_URL)
      .replaceAll('{sigungu}', sigungu)
      .replaceAll('{key}', encodeURIComponent(key))

    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const events = num(pick(body, ['재해건수', 'events', 'cnt', 'occrCnt', 'totalCount', 'count']))
    const topType = pick(body, ['재해유형', 'disasterType', 'type', 'dsstSeNm', 'kind'])
    const recentYear = pick(body, ['발생연도', 'year', 'occrYear', 'yr'])
    if (events == null && topType == null) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    res.status(200).json({
      available: true,
      events,
      topType: topType ? String(topType) : undefined,
      recentYear: recentYear ? String(recentYear) : undefined,
      scope: `${sigungu} (시군구 재해 이력)`,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
