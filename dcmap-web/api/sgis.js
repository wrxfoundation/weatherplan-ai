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
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'
import { proxyConfigured, proxyGetText } from './_proxy.js'

// 인증 엔드포인트 — 계정이 통계청(kostat.go.kr)에 있으면 SGIS_AUTH_URL로 교체(재배포 불필요).
const AUTH_URL = process.env.SGIS_AUTH_URL || 'https://sgisapi.mods.go.kr/OpenAPI3/auth/authentication.json'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
// SGIS 인구(population.json)는 좌표가 아니라 year+adm_cd 기준인데, SGIS 시군구코드는 행정표준코드와
// 다르다(강남구: 행정표준 11680 vs SGIS 11230). 그래서 **시도 2자리 코드(양 체계 동일)로 질의 +
// low_search=1**로 하위 시군구를 모두 받은 뒤 **시군구 이름으로 매칭**한다(정적 코드표 불필요).
// {token}{sido}{year} 플레이스홀더. 경로/파라미터는 SGIS_STATS_URL env로 재배포 없이 보정 가능.
const DEFAULT_STATS_URL =
  'https://sgisapi.mods.go.kr/OpenAPI3/stats/population.json?accessToken={token}&year={year}&adm_cd={sido}&low_search=1'
// 최근 등록센서스 연도부터 시도(데이터 없는 연도는 건너뜀)
const YEARS = ['2023', '2022', '2021', '2020']

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

const parseBody = (text, ok, status) => {
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  // SGIS는 오류도 본문(errCd/errMsg)에 담아 주는 경우가 많다 — HTTP 상태와 함께 본문도 보존(진단)
  if (!ok) return { _status: status, _body: json, _head: text.slice(0, 200) }
  return json ?? { _status: 'not_json', _head: text.slice(0, 200) }
}

/** IPv4 A레코드 직결 GET(text) — sgisapi.mods.go.kr의 IPv6 블랙홀/클라우드IP 이슈 우회. */
async function rawGetText(urlStr, ms = 6000) {
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
    headers: { Host: u.hostname, 'User-Agent': UA, Accept: 'application/json', Connection: 'close' },
  }
  if (isHttps) opts.servername = u.hostname
  return await new Promise((resolve, reject) => {
    const req = mod.request(opts, (r) => {
      let data = ''
      r.setEncoding('utf8')
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve({ text: data, status: r.statusCode || 0 }))
    })
    req.on('timeout', () => req.destroy(new Error('raw_timeout')))
    req.on('error', reject)
    req.end()
  })
}

// 프록시(설정 시) → undici → IPv4 직결 순으로 시도. SGIS도 Vercel 클라우드 IP에서 막힐 수 있어(vworld와 동일)
// 정부포털 공통 우회 체인을 적용.
async function fetchJson(url, ms = 7000) {
  if (proxyConfigured()) {
    try {
      return parseBody(await proxyGetText(url, ms), true, 200)
    } catch {
      /* undici로 폴백 */
    }
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': UA } })
    return parseBody(await r.text(), r.ok, r.status)
  } catch (undiciErr) {
    // undici 실패(CONNECT_TIMEOUT/SOCKET) → IPv4 직결 https/http
    const httpUrl = url.startsWith('https://') ? url.replace('https://', 'http://') : url
    for (const u of [url, httpUrl]) {
      try {
        const { text, status } = await rawGetText(u, ms)
        return parseBody(text, status >= 200 && status < 400, status)
      } catch {
        /* 다음 경로 */
      }
    }
    return { _status: `net_${undiciErr?.cause?.code || undiciErr?.name || 'error'}` }
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

  // 시도 2자리 코드(행정표준·SGIS 동일) — 클라이언트가 revgeo 법정동코드 앞 5자리를 넘기면 앞 2자리 사용.
  const admCd5 = String(req.query.adm_cd || req.query.admCd || '').replace(/[^0-9]/g, '').slice(0, 5)
  const sido = admCd5.slice(0, 2)
  // 시군구 이름(예: '강남구') — SGIS 하위목록에서 이 이름으로 매칭(코드 체계 불일치 회피)
  const sggName = String(req.query.sgg || '').trim()
  if (!/^\d{2}$/.test(sido)) {
    res.status(200).json({ available: false, reason: 'needs_admcd' })
    return
  }

  // 결과 배열에서 대상 행 선택: 시군구 이름 매칭 우선, 없으면 시도(2자리) 집계행
  const rows = (b) => (Array.isArray(b?.result) ? b.result : b?.result ? [b.result] : [])
  const pickRow = (b) => {
    const rs = rows(b)
    if (sggName) {
      const hit = rs.find((r) => String(r.adm_nm || '').replace(/\s/g, '').includes(sggName.replace(/\s/g, '')))
      if (hit) return hit
    }
    return rs.find((r) => String(r.adm_cd) === sido) || rs.find((r) => num(r.tot_ppltn) != null) || null
  }

  try {
    const { token, errCd } = await getToken(key, secret)
    if (!token) {
      res.status(200).json({ available: false, reason: `auth_failed${errCd != null ? `_${errCd}` : ''}` })
      return
    }
    const tmpl = process.env.SGIS_STATS_URL || DEFAULT_STATS_URL
    const yearList = /\{year\}/.test(tmpl) ? YEARS : ['']
    let row = null
    let usedYear = null
    let lastReason = null
    for (const year of yearList) {
      const url = tmpl
        .replaceAll('{token}', encodeURIComponent(token))
        .replaceAll('{sido}', sido)
        .replaceAll('{admCd}', admCd5) // env 호환(구 플레이스홀더)
        .replaceAll('{year}', year)
      const b = await fetchJson(url)
      if (req.query.debug) {
        res.status(200).json({
          available: true,
          debug: true,
          year,
          sido,
          sggName,
          httpStatus: b?._status ?? 200,
          errCd: b?.errCd ?? b?.result?.errCd,
          errMsg: b?.errMsg ?? b?.result?.errMsg,
          rowCount: rows(b).length,
          sampleNm: rows(b).slice(0, 3).map((r) => r.adm_nm),
          keys: Object.keys(rows(b)[0] || b || {}),
        })
        return
      }
      if (b?._status) {
        const em = b?._body?.errMsg || b?._body?.result?.errMsg
        lastReason = `upstream_${b._status}${em ? `_${String(em).replace(/\s+/g, '')}` : ''}`
        continue
      }
      const r = pickRow(b)
      if (r && num(pick(r, ['tot_ppltn', 'population', 'ppltn'])) != null) {
        row = r
        usedYear = year
        break
      }
      const em = b?.errMsg || b?.result?.errMsg
      lastReason = em && !/success/i.test(String(em)) ? `sgis_${String(em).replace(/\s+/g, '').slice(0, 40)}` : 'no_match'
    }
    if (!row) {
      res.status(200).json({ available: false, reason: lastReason || 'no_data' })
      return
    }
    const population = num(pick(row, ['tot_ppltn', 'population', 'ppltn']))
    const households = num(pick(row, ['tot_house', 'tot_family', 'household', 'hshld']))
    const density = num(pick(row, ['ppltn_dnsty', 'density']))
    const admNm = pick(row, ['adm_nm', 'admNm'])
    const matched = sggName && admNm && String(admNm).replace(/\s/g, '').includes(sggName.replace(/\s/g, ''))
    res.status(200).json({
      available: true,
      population,
      households,
      density,
      admNm: admNm ? String(admNm) : undefined,
      level: matched ? '시군구' : '시도',
      year: usedYear || undefined,
      scope: `SGIS ${admNm || sido} 인구/밀도(등록센서스${usedYear ? ` ${usedYear}` : ''})`,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
