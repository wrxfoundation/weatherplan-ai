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
 *  - SGIS_POP_URL / SGIS_RGEO_URL / SGIS_FLOOD_URL / SGIS_LANDSLIDE_URL (선택) — 엔드포인트 override
 *  - UPSTREAM_PROXY_BASE (선택) — 클라우드 IP 차단 시 KR-IP 프록시 경유
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
// low_search로 하위 시군구를 받은 뒤 이름 매칭하는 방식은 폴백에서만 사용(정적 코드표 불필요).
// SGIS 리버스지오코딩(WGS84) — 좌표 → SGIS 행정동코드(정의서 확인 경로). 정밀 인구는 이 코드로 조회.
const RGEO_URL = process.env.SGIS_RGEO_URL || 'https://sgisapi.mods.go.kr/OpenAPI3/addr/rgeocodewgs84.json'
const POP_BASE = process.env.SGIS_POP_URL || 'https://sgisapi.mods.go.kr/OpenAPI3/stats/population.json'
// 인구/주택 데이터 유효연도 2015~2024(정의서). 최신부터 시도(데이터 없는 연도는 건너뜀).
const YEARS = ['2024', '2023', '2022', '2021', '2020']

// ⚠️ SGIS 시도코드는 법정동/행정표준코드와 다르다(통계청 구코드). 서울만 11=11로 우연히 같고
// 나머지는 전부 다르다(경기 법정동 41 ≠ SGIS 31). 법정동 앞2자리 → SGIS 시도코드 변환 필수.
const LEGAL_TO_SGIS_SIDO = {
  11: '11', // 서울
  26: '21', // 부산
  27: '22', // 대구
  28: '23', // 인천
  29: '24', // 광주
  30: '25', // 대전
  31: '26', // 울산
  36: '29', // 세종
  41: '31', // 경기
  42: '32', // 강원
  43: '33', // 충북
  44: '34', // 충남
  45: '35', // 전북
  46: '36', // 전남
  47: '37', // 경북
  48: '38', // 경남
  50: '39', // 제주
}

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

/**
 * SGIS 리버스지오코딩(WGS84) — 좌표 → SGIS 행정동코드. 정의서 addr/rgeocodewgs84.json.
 * addr_type=20(행정동) → sido_cd(2)+sgg_cd(3)+emdong_cd(3) = 읍면동 8자리. 이 코드로 population을
 * 직접 조회하면 시도+이름매칭 없이 읍면동 단위 정밀 인구를 얻는다(SGIS 자체 코드 체계라 정확).
 */
async function sgisAdmCode(lat, lng, token) {
  const url = `${RGEO_URL}?accessToken=${encodeURIComponent(token)}&x_coor=${lng}&y_coor=${lat}&addr_type=20`
  const b = await fetchJson(url)
  const r = Array.isArray(b?.result) ? b.result[0] : b?.result
  if (!r?.sido_cd || !r?.sgg_cd) return null
  const sgg5 = `${r.sido_cd}${r.sgg_cd}`
  const emdong8 = r.emdong_cd ? `${r.sido_cd}${r.sgg_cd}${r.emdong_cd}` : null
  return {
    sgg5,
    emdong8,
    sidoNm: r.sido_nm,
    sggNm: r.sgg_nm,
    emdongNm: r.emdong_nm,
  }
}

const popUrl = (base, token, year, admCd, low = 0) =>
  `${base}?accessToken=${encodeURIComponent(token)}&year=${year}&adm_cd=${admCd}&low_search=${low}`

// 응답 배열 첫 행 중 인구값이 있는 행
const firstPopRow = (b) => {
  const rs = Array.isArray(b?.result) ? b.result : b?.result ? [b.result] : []
  return rs.find((r) => num(r.tot_ppltn) != null) || null
}

// SGIS 자연재해 위험지도 통계(정의서 ndsm/*). 클라우드 IP 차단으로 막힌 포털들을 SGIS 토큰으로 대체.
// 홍수·산사태 응답 스키마가 동일(iem_nm='인구' → data_list 총합의 affc_zone/administ_zone).
const NDSM_URL = {
  flood: process.env.SGIS_FLOOD_URL || 'https://sgisapi.mods.go.kr/OpenAPI3/ndsm/floodRiskDataBoard.json',
  landslide: process.env.SGIS_LANDSLIDE_URL || 'https://sgisapi.mods.go.kr/OpenAPI3/ndsm/lndsldWarnDataBoard.json',
}

// 위험영향구역 인구 노출 비율 = 영향구역내 인구(affc_zone) / 행정구역 인구(administ_zone). 높을수록 리스크.
async function sgisExposure(baseUrl, admCd, token) {
  const b = await fetchJson(`${baseUrl}?accessToken=${encodeURIComponent(token)}&adm_cd=${admCd}`)
  if (b?._status) return { _status: b._status }
  const items = Array.isArray(b?.result) ? b.result : b?.result ? [b.result] : []
  const popItem = items.find((it) => String(it.iem_nm || '').includes('인구'))
  const list = popItem?.data_list
  if (!Array.isArray(list)) return null
  const total = list.find((d) => /총|합/.test(String(d.div_nm || '')))
  if (!total) return null
  const administ = num(total.administ_zone)
  const affc = num(total.affc_zone)
  if (administ == null || affc == null || administ === 0) return null
  return {
    totalPop: administ,
    affectedPop: affc,
    exposurePct: Math.round((affc / administ) * 1000) / 10,
    baseYear: popItem.crtr_yr,
  }
}

// 노출 비율 → 정성 등급(부지 리스크 판단용)
function exposureGrade(pct) {
  if (pct == null) return undefined
  if (pct <= 0) return '해당없음'
  if (pct < 10) return '낮음'
  if (pct < 30) return '보통'
  if (pct < 50) return '높음'
  return '매우높음'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.SGIS_KEY
  const secret = process.env.SGIS_SECRET
  if (!key || !secret) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const kind = String(req.query.kind || 'pop') // pop(기본) | flood(홍수위험지도 영향범위)
  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  // 폴백용(rgeocode 실패 시): 클라이언트가 넘긴 법정동 5자리 → SGIS 시도코드 + 시군구 이름 매칭.
  const admCd5 = String(req.query.adm_cd || req.query.admCd || '').replace(/[^0-9]/g, '').slice(0, 5)
  const legalSido = admCd5.slice(0, 2)
  const fbSido = LEGAL_TO_SGIS_SIDO[Number(legalSido)] || legalSido
  const sggName = String(req.query.sgg || '').trim()
  if ((lat == null || lng == null) && !/^\d{2}$/.test(legalSido)) {
    res.status(200).json({ available: false, reason: 'needs_point' })
    return
  }

  try {
    const { token, errCd } = await getToken(key, secret)
    if (!token) {
      res.status(200).json({ available: false, reason: `auth_failed${errCd != null ? `_${errCd}` : ''}` })
      return
    }

    // 좌표 → SGIS 행정동코드(읍면동/시군구). pop·flood·landslide 공통 선행 단계.
    const geo = lat != null && lng != null ? await sgisAdmCode(lat, lng, token) : null
    const riskCodes = geo ? [geo.emdong8, geo.sgg5].filter(Boolean) : /^\d{5}$/.test(admCd5) ? [admCd5] : []

    // 한 재해종(flood|landslide)의 노출 정보 산출(읍면동 우선, 시군구 폴백)
    const oneRisk = async (rk) => {
      for (const adm of riskCodes) {
        const f = await sgisExposure(NDSM_URL[rk], adm, token)
        if (f?._status || !f) continue
        const admNm = geo ? [geo.sggNm, adm === geo.emdong8 ? geo.emdongNm : null].filter(Boolean).join(' ') : undefined
        return {
          exposurePct: f.exposurePct,
          affectedPop: f.affectedPop,
          totalPop: f.totalPop,
          grade: exposureGrade(f.exposurePct),
          admNm: admNm || undefined,
          baseYear: f.baseYear || undefined,
          level: adm === geo?.emdong8 ? '읍면동' : '시군구',
        }
      }
      return null
    }

    // ── kind=flood|landslide: 단일 재해종 영향범위(막힌 포털 대체) ──
    if (kind === 'flood' || kind === 'landslide') {
      const kindNm = kind === 'flood' ? '홍수위험지도' : '산사태위험지도'
      const e = await oneRisk(kind)
      if (e) {
        res.status(200).json({
          available: true,
          source: 'sgis',
          kind,
          ...e,
          scope: `SGIS ${kindNm} 영향범위(${e.level}${e.baseYear ? ` ${e.baseYear}` : ''})`,
        })
        return
      }
      res.status(200).json({ available: false, reason: geo ? 'no_data' : 'no_region_code' })
      return
    }

    // ── kind=risk: 홍수+산사태를 한 번에(대시보드 지역 롤업용, rgeocode 1회 공유) ──
    if (kind === 'risk') {
      const [flood, landslide] = await Promise.all([oneRisk('flood'), oneRisk('landslide')])
      if (flood || landslide) {
        res.status(200).json({
          available: true,
          source: 'sgis',
          kind: 'risk',
          admNm: (flood || landslide).admNm,
          flood: flood || null,
          landslide: landslide || null,
        })
        return
      }
      res.status(200).json({ available: false, reason: geo ? 'no_data' : 'no_region_code' })
      return
    }

    // ── kind=pop(기본): 리버스지오코딩 → SGIS 행정동코드 → population 직접 조회(읍면동 정밀) ──
    let row = null
    let usedYear = null
    let usedLevel = null
    let usedNm = null
    let lastReason = null
    if (geo) {
      const targets = [
        geo.emdong8 && { adm: geo.emdong8, level: '읍면동', nm: [geo.sggNm, geo.emdongNm].filter(Boolean).join(' ') },
        geo.sgg5 && { adm: geo.sgg5, level: '시군구', nm: geo.sggNm },
      ].filter(Boolean)
      for (const year of YEARS) {
        for (const t of targets) {
          const b = await fetchJson(popUrl(POP_BASE, token, year, t.adm, 0))
          if (b?._status) {
            const em = b?._body?.errMsg || b?._body?.result?.errMsg
            lastReason = `upstream_${b._status}${em ? `_${String(em).replace(/\s+/g, '')}` : ''}`
            continue
          }
          const r = firstPopRow(b)
          if (r) {
            row = r
            usedYear = year
            usedLevel = t.level
            usedNm = pick(r, ['adm_nm', 'admNm']) || t.nm
            break
          }
          const em = b?.errMsg || b?.result?.errMsg
          if (em && !/success/i.test(String(em))) lastReason = `sgis_${String(em).replace(/\s+/g, '').slice(0, 40)}`
        }
        if (row) break
      }
    }

    // ── 2순위(폴백): 기존 시도코드 + 시군구 이름 매칭 (rgeocode 실패 시) ──
    if (!row && /^\d{2}$/.test(legalSido)) {
      const rows = (b) => (Array.isArray(b?.result) ? b.result : b?.result ? [b.result] : [])
      for (const year of YEARS) {
        const b = await fetchJson(popUrl(POP_BASE, token, year, fbSido, 1))
        if (b?._status) {
          const em = b?._body?.errMsg || b?._body?.result?.errMsg
          lastReason = `upstream_${b._status}${em ? `_${String(em).replace(/\s+/g, '')}` : ''}`
          continue
        }
        const rs = rows(b)
        const hit =
          (sggName && rs.find((r) => String(r.adm_nm || '').replace(/\s/g, '').includes(sggName.replace(/\s/g, '')))) ||
          rs.find((r) => String(r.adm_cd) === fbSido) ||
          rs.find((r) => num(r.tot_ppltn) != null)
        if (hit && num(hit.tot_ppltn) != null) {
          row = hit
          usedYear = year
          usedLevel = sggName ? '시군구' : '시도'
          usedNm = pick(hit, ['adm_nm', 'admNm'])
          break
        }
        const em = b?.errMsg || b?.result?.errMsg
        if (em && !/success/i.test(String(em))) lastReason = `sgis_${String(em).replace(/\s+/g, '').slice(0, 40)}`
      }
    }

    if (req.query.debug) {
      res.status(200).json({
        available: !!row,
        debug: true,
        lat,
        lng,
        rgeo: geo || null,
        legalSido,
        fbSido,
        usedYear,
        usedLevel,
        usedNm,
        reason: row ? undefined : lastReason || 'no_data',
      })
      return
    }
    if (!row) {
      res.status(200).json({ available: false, reason: lastReason || 'no_data' })
      return
    }
    const population = num(pick(row, ['tot_ppltn', 'population', 'ppltn']))
    // 세대(가구) = tot_family(총가구). tot_house는 총주택이라 세대와 다름 → tot_family 우선.
    const households = num(pick(row, ['tot_family', 'household', 'hshld']))
    const density = num(pick(row, ['ppltn_dnsty', 'density']))
    const admNm = usedNm || pick(row, ['adm_nm', 'admNm'])
    res.status(200).json({
      available: true,
      population,
      households,
      density,
      admNm: admNm ? String(admNm) : undefined,
      level: usedLevel || '시군구',
      year: usedYear || undefined,
      scope: `SGIS ${admNm || ''} 인구/밀도(${usedLevel || '시군구'} · 등록센서스${usedYear ? ` ${usedYear}` : ''})`,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
