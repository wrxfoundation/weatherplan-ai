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
// SGIS 인구 통계(population.json)는 좌표가 아니라 **year + adm_cd(행정동/시군구 코드)** 기준.
// 좌표/반경(lat/lng/radius)을 넣으면 412(요청변수 미충족). 시군구코드(revgeo 법정동 앞 5자리)로 질의한다.
// {token}{admCd}{year} 플레이스홀더. 경로/파라미터는 SGIS_STATS_URL env로 재배포 없이 보정 가능.
const DEFAULT_STATS_URL =
  'https://sgisapi.mods.go.kr/OpenAPI3/stats/population.json?accessToken={token}&year={year}&adm_cd={admCd}&low_search=0'
// 최근 등록센서스 연도부터 시도(데이터 없는 연도는 건너뜀)
const YEARS = ['2023', '2022', '2021', '2020']

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
    const text = await r.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
    // SGIS는 오류도 본문(errCd/errMsg)에 담아 주는 경우가 많다 — HTTP 상태와 함께 본문도 보존(진단)
    if (!r.ok) return { _status: r.status, _body: json, _head: text.slice(0, 200) }
    return json ?? { _status: 'not_json', _head: text.slice(0, 200) }
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
  if (tokenCache.token && tokenCache.exp > nowMs + 30000) return { token: tokenCache.token }
  const body = await fetchJson(`${AUTH_URL}?consumer_key=${encodeURIComponent(key)}&consumer_secret=${encodeURIComponent(secret)}`)
  // SGIS 인증 응답: { errCd:0, errMsg:'Success', result:{ accessToken, accessTimeout } } — 토큰은 result 아래 중첩!
  const token = body?.result?.accessToken ?? pick(body, ['accessToken', 'access_token'])
  if (!token) return { token: null, errCd: body?.errCd, errMsg: body?.errMsg }
  // SGIS 토큰 기본 만료 4시간 — 보수적으로 3시간 캐시
  tokenCache = { token: String(token), exp: nowMs + 3 * 3600 * 1000 }
  return { token: tokenCache.token }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.SGIS_KEY
  const secret = process.env.SGIS_SECRET
  if (!key || !secret) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  // 시군구 코드(5자리) — 클라이언트가 revgeo 법정동코드 앞 5자리를 adm_cd로 전달.
  // SGIS는 좌표가 아니라 행정구역코드 기준이라 이 값이 필수.
  const admCd = String(req.query.adm_cd || req.query.admCd || '').replace(/[^0-9]/g, '').slice(0, 5)
  if (!/^\d{5}$/.test(admCd)) {
    res.status(200).json({ available: false, reason: 'needs_admcd' })
    return
  }

  try {
    const { token, errCd } = await getToken(key, secret)
    if (!token) {
      // errCd 노출로 원인 구분: -100 인증정보 오류(키 값 확인) / -401 만료 등
      res.status(200).json({ available: false, reason: `auth_failed${errCd != null ? `_${errCd}` : ''}` })
      return
    }
    const tmpl = process.env.SGIS_STATS_URL || DEFAULT_STATS_URL
    // year는 데이터 있는 연도를 최근순으로 탐색(빈 응답이면 다음 연도). env로 year를 고정했다면 그대로.
    const yearList = /\{year\}/.test(tmpl) ? YEARS : ['']
    let body = null
    let lastReason = null
    for (const year of yearList) {
      const url = tmpl
        .replaceAll('{token}', encodeURIComponent(token))
        .replaceAll('{admCd}', admCd)
        .replaceAll('{year}', year)
      const b = await fetchJson(url)
      if (req.query.debug) {
        res.status(200).json({ available: true, debug: true, year, httpStatus: b?._status ?? 200, errCd: b?.result?.errCd ?? b?.errCd, keys: b?.result ? Object.keys(Array.isArray(b.result) ? b.result[0] || {} : b.result) : Object.keys(b || {}), head: b?._head })
        return
      }
      if (b?._status) {
        // SGIS 본문 errMsg를 reason에 실어 정확한 원인 노출(진단)
        const em = b?._body?.errMsg || b?._body?.result?.errMsg
        lastReason = `upstream_${b._status}${em ? `_${String(em).replace(/\s+/g, '')}` : ''}`
        continue
      }
      const pop = num(pick(b, ['tot_ppltn', 'population', 'ppltn', 'totalPopulation']))
      if (pop != null) {
        body = b
        break
      }
      lastReason = 'schema_unknown'
    }
    if (!body) {
      res.status(200).json({ available: false, reason: lastReason || 'no_data' })
      return
    }
    const population = num(pick(body, ['tot_ppltn', 'population', 'ppltn', 'totalPopulation']))
    const households = num(pick(body, ['tot_house', 'tot_family', 'household', 'hshld', 'households']))
    const density = num(pick(body, ['ppltn_dnsty', 'density']))
    const admNm = pick(body, ['adm_nm', 'admNm'])
    res.status(200).json({
      available: true,
      population,
      households,
      density, // 인구밀도(명/km²) — 민원 리스크 프록시로 더 적합
      admNm: admNm ? String(admNm) : undefined,
      scope: `SGIS 시군구 인구/밀도${admNm ? ` · ${admNm}` : ''}(등록센서스)`,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
