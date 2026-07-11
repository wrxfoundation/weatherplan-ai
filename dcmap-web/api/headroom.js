/**
 * 한전 분산전원연계 여유용량 프록시 — 계통 여유용량(전력축의 핵심 공백)을 지점 기준으로 조회.
 * 소스: 한전 전력데이터 개방포털 API #12 「분산전원연계 정보」 (시도·시군구·도로명 기준
 *       누적 연계용량 및 여유용량). data.go.kr 15147381 동일.
 *
 * 좌표 → 시도/시군구 코드: vworld 법정동코드(앞 2/5자리) — weather.js와 동일 체인.
 *
 * 환경변수 (Vercel — 키는 서버 env 전용, 리포 커밋 절대 금지):
 *  - KEPCO_API_KEY (필수)
 *  - VWORLD_KEY (필수 — 좌표→코드)
 *  - KEPCO_HEADROOM_URL (선택) — 엔드포인트 템플릿. {sido} {sigungu} {key} 플레이스홀더.
 *      포털 실제 경로 확정 시 이 env만 수정(코드 재배포 불필요). 기본값은 개방포털 추정 경로.
 *
 * 응답: { available, availableMw?, cumulativeMw?, scope, unit } | { available:false, reason }
 */
const DEFAULT_URL =
  'https://bigdata.kepco.co.kr/openapi/v1/DISTRIBUTED.do?metroCd={sido}&cityCd={sigungu}&apiKey={key}&returnType=json'

const num = (v) => {
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)' } })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

/* 좌표 → {sido2, sigungu5} 행정코드 (vworld 법정동코드) */
async function regionCodes(lat, lng, vworldKey) {
  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=parcel&zipcode=false&simple=false&key=${vworldKey}&domain=${encodeURIComponent(process.env.VWORLD_DOMAIN || 'aidatacenter-red.vercel.app')}`
  const body = await fetchJson(url)
  if (body?.response?.status !== 'OK') return null
  for (const item of body.response.result ?? []) {
    const lc = item?.structure?.level4LC
    if (typeof lc === 'string' && /^\d{10}$/.test(lc)) return { sido: lc.slice(0, 2), sigungu: lc.slice(0, 5) }
  }
  return null
}

/* 응답에서 여유용량/누적용량 방어적 추출 (필드명이 포털 버전마다 달라 다중 후보) */
function pick(obj, names) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const n of names) if (obj[n] != null && obj[n] !== '') return obj[n]
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) {
      const f = pick(v[0], names)
      if (f !== undefined) return f
    } else if (v && typeof v === 'object') {
      const f = pick(v, names)
      if (f !== undefined) return f
    }
  }
  return undefined
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')

  const key = process.env.KEPCO_API_KEY
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
    const codes = await regionCodes(lat, lng, vworldKey)
    if (!codes) {
      res.status(200).json({ available: false, reason: 'no_region_code' })
      return
    }
    const url = (process.env.KEPCO_HEADROOM_URL || DEFAULT_URL)
      .replaceAll('{sido}', codes.sido)
      .replaceAll('{sigungu}', codes.sigungu)
      .replaceAll('{key}', key)

    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const availableMw = num(pick(body, ['여유용량', 'sparCapa', 'availCapa', 'sparcapa', 'restCapa']))
    const cumulativeMw = num(pick(body, ['누적연계용량', 'accCapa', 'connCapa', 'cumCapa', 'acumCapa']))
    if (availableMw == null && cumulativeMw == null) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    res.status(200).json({
      available: true,
      availableMw,
      cumulativeMw,
      scope: `${codes.sigungu} (배전 22.9kV 분산전원 기준)`,
      unit: 'MW',
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
