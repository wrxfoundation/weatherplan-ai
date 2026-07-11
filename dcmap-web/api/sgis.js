/**
 * SGIS(통계지리정보서비스, 통계청) 프록시 — 지점 반경 인구/가구를 조회.
 * 리스크축(15점)의 "인구격자(민원 프록시)" 항목 소스: 반경 내 거주 인구가 낮을수록 민원 리스크 낮음.
 *
 * 소스: sgis.kostat.go.kr Open API. consumer key/secret → accessToken(만료형) → 통계 조회.
 * 인증 흐름: /OpenAPI3/auth/authentication.json?consumer_key=..&consumer_secret=.. → accessToken.
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - SGIS_KEY (필수) — consumer key
 *  - SGIS_SECRET (필수) — consumer secret
 *  - SGIS_STATS_URL (선택) — 인구 통계 엔드포인트 템플릿. {lat}{lng}{token} 플레이스홀더.
 *      경로·파라미터 확정 시 이 env만 수정(코드 재배포 불필요).
 *
 * 응답: { available, population?, households?, radiusKm?, scope } | { available:false, reason }
 */
const AUTH_URL = 'https://sgisapi.mods.go.kr/OpenAPI3/auth/authentication.json'
// 기본: 인구 통계(population.json)는 adm_cd(행정동코드)+year 기준. 좌표→adm_cd 변환이 필요하면
// SGIS_STATS_URL로 실경로/파라미터 보정(프로덕션). {lat}{lng}{token} 플레이스홀더 유지.
const DEFAULT_STATS_URL =
  'https://sgisapi.mods.go.kr/OpenAPI3/stats/population.json?accessToken={token}&lat={lat}&lng={lng}&radius=2000'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
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

// accessToken 캐시 (서버리스 인스턴스 수명 동안) — 매 요청 인증 방지
let tokenCache = { token: null, exp: 0 }
async function getToken(key, secret) {
  const nowMs = Date.now()
  if (tokenCache.token && tokenCache.exp > nowMs + 30000) return tokenCache.token
  const body = await fetchJson(`${AUTH_URL}?consumer_key=${encodeURIComponent(key)}&consumer_secret=${encodeURIComponent(secret)}`)
  const token = pick(body, ['accessToken', 'access_token'])
  if (!token) return null
  // SGIS 토큰 기본 만료 4시간 — 보수적으로 3시간 캐시
  tokenCache = { token: String(token), exp: nowMs + 3 * 3600 * 1000 }
  return tokenCache.token
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.SGIS_KEY
  const secret = process.env.SGIS_SECRET
  if (!key || !secret) {
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
    const token = await getToken(key, secret)
    if (!token) {
      res.status(200).json({ available: false, reason: 'auth_failed' })
      return
    }
    const url = (process.env.SGIS_STATS_URL || DEFAULT_STATS_URL)
      .replaceAll('{token}', encodeURIComponent(token))
      .replaceAll('{lat}', String(lat))
      .replaceAll('{lng}', String(lng))

    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const population = num(pick(body, ['population', 'ppltn', 'tot_ppltn', 'totalPopulation', '인구']))
    const households = num(pick(body, ['household', 'hshld', 'tot_hshld', 'households', '가구']))
    if (population == null && households == null) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    res.status(200).json({
      available: true,
      population,
      households,
      radiusKm: 2,
      scope: 'SGIS 반경 2km 인구/가구(추정 통계)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
