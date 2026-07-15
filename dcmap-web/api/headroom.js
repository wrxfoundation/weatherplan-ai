/**
 * 한전 분산전원연계정보 프록시 — 계통 여유용량(전력축의 핵심 공백)을 지점 기준으로 조회.
 * 소스: 한전 전력데이터 개방포털 「분산전원연계정보」 (data.go.kr 15147381 / bigdata.kepco 000493).
 *   ✅ 확정 엔드포인트: bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do
 *   요청: metroCd(시도 2자리) · cityCd(시군구 3자리, 예 강남구=680) · apiKey(40자) · returnType=json
 *   응답 data[] 각 행: 변전소/변압기/DL 단위 누적연계용량(substPwr/mtrPwr/dlPwr)·용량(js*Pwr)
 *     ·여유용량 vol1(변전소)·vol2(변압기)·vol3(DL). 값 단위는 kW로 보고 MW 환산(÷1000).
 *
 * 좌표 → 시도(2)/시군구(3) 코드: vworld 법정동코드 10자리 → slice(0,2)/slice(2,5).
 *
 * 환경변수 (Vercel — 키는 서버 env 전용, 리포 커밋 절대 금지):
 *  - KEPCO_API_KEY (필수) — 전력데이터개방포털 발급 40자리 인증키. ⚠️ 코드/문서 하드코딩 금지, env만.
 *  - VWORLD_KEY (필수 — 좌표→코드)
 *  - KEPCO_HEADROOM_URL (선택) — 엔드포인트 템플릿. {metro} {city} {key} 플레이스홀더.
 *  - UPSTREAM_PROXY_BASE (선택) — 설정 시 KR-IP 프록시 경유(bigdata.kepco IP차단 우회).
 *
 * 응답: { available, availableMw?, cumulativeMw?, scope, unit, note? } | { available:false, reason }
 */
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'
import { proxyConfigured, proxyGetText } from './_proxy.js'

const DEFAULT_URL =
  'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do?metroCd={metro}&cityCd={city}&apiKey={key}&returnType=json'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const kwToMw = (kw) => (kw == null ? undefined : Math.round(kw / 100) / 10)

const num = (v) => {
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

const asJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA } })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

/**
 * IPv4 A레코드 직결 GET — bigdata.kepco.co.kr 등 일부 공사 서버는 IPv6 AAAA가 블랙홀이라
 * undici(전역 fetch)의 happy-eyeballs가 CONNECT_TIMEOUT/SOCKET을 낸다(openapi.kpx와 동일 증상).
 * 해석한 IPv4로 직접 붙으면 프록시 없이도 뚫린다. https는 SNI(servername)로 인증서 검증 유지.
 */
async function rawGetText(urlStr, ms = 7000) {
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
      if (r.statusCode && r.statusCode >= 400) {
        r.resume()
        reject(new Error(`status_${r.statusCode}`))
        return
      }
      let data = ''
      r.setEncoding('utf8')
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve(data))
    })
    req.on('timeout', () => req.destroy(new Error('raw_timeout')))
    req.on('error', reject)
    req.end()
  })
}

/* 좌표 → {metro(2), city(3)} 행정코드 (vworld 법정동코드). api.vworld.kr도 Vercel에서 막힐 수 있어
   프록시 → undici → IPv4 직결 순으로 폴백(KEPCO 조회 전에 여기서 죽지 않도록). */
async function regionCodes(lat, lng, vworldKey) {
  const url =
    'https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0' +
    `&crs=epsg:4326&point=${lng},${lat}&format=json&type=parcel&zipcode=false&simple=false&key=${vworldKey}&domain=${encodeURIComponent(process.env.VWORLD_DOMAIN || 'aidatacenter-red.vercel.app')}`
  let body = null
  if (proxyConfigured()) {
    try {
      body = asJson(await proxyGetText(url, 6000))
    } catch {
      body = null
    }
  }
  if (!body) {
    const b = await fetchJson(url, 5000)
    if (b && !b._status) body = b
  }
  if (!body) {
    for (const u of [url, url.replace('https://', 'http://')]) {
      try {
        const b = asJson(await rawGetText(u, 4500))
        if (b) {
          body = b
          break
        }
      } catch {
        /* 다음 경로 시도 */
      }
    }
  }
  if (body?.response?.status !== 'OK') return null
  for (const item of body.response.result ?? []) {
    const lc = item?.structure?.level4LC
    // 법정동코드 10자리 → 시도(2) + 시군구(3). KEPCO cityCd는 3자리(강남구=680)라 slice(2,5).
    if (typeof lc === 'string' && /^\d{10}$/.test(lc)) return { metro: lc.slice(0, 2), city: lc.slice(2, 5) }
  }
  return null
}

/* 응답에서 data[] 리스트 추출 (dispersedGeneration.do는 { data:[...] }) */
function pickList(body) {
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body)) return body
  for (const v of Object.values(body || {})) if (Array.isArray(v) && v.length && typeof v[0] === 'object') return v
  return []
}

/* 공통 GET 폴백 체인 — 프록시 → undici → IPv4 직결 (bigdata.kepco 계열 공용) */
async function kepcoGet(url) {
  let body = null
  if (proxyConfigured()) {
    try {
      body = asJson(await proxyGetText(url, 7000))
    } catch {
      body = null
    }
  }
  if (!body) {
    const b = await fetchJson(url, 6000)
    if (b && !b._status) body = b
  }
  if (!body) {
    for (const u of [url, url.replace('https://', 'http://')]) {
      try {
        const b = asJson(await rawGetText(u, 6000))
        if (b) {
          body = b
          break
        }
      } catch {
        /* 다음 경로 */
      }
    }
  }
  return body
}

/**
 * 계약종별 전력사용량(contractType.do) — 시군구별 일반용 계약전력·사용량·평균판매단가.
 * 여유용량(공급측)의 보완 지표: 수요측 밀도·단가 실측. 최근월은 2~3개월 지연 공표라 뒤로 탐색.
 */
async function usageHandler(req, res, key) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  const metro = String(req.query.metroCd || '').replace(/\D/g, '')
  if (!/^\d{2}$/.test(metro)) {
    res.status(400).json({ available: false, reason: 'bad_metro' })
    return
  }
  const now = new Date()
  // 2~5개월 전을 순서대로 시도 — 공표 지연 대응
  for (let back = 2; back <= 5; back++) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
    const year = String(d.getFullYear())
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const url = `https://bigdata.kepco.co.kr/openapi/v1/powerUsage/contractType.do?year=${year}&month=${month}&metroCd=${metro}&apiKey=${key}&returnType=json`
    try {
      const body = await kepcoGet(url)
      const rows = pickList(body)
      if (!rows.length) continue
      // 일반용만 집계(민간 DC 요금 계약종) — 시군구별 계약전력 합계·사용량·가중평균 단가
      const byCity = new Map()
      for (const r of rows) {
        if (!/일반용/.test(String(r.cntr || ''))) continue
        const city = String(r.city || '').trim()
        if (!city) continue
        const cur = byCity.get(city) || { city, cntrPwrKw: 0, usageKwh: 0, billKrw: 0 }
        cur.cntrPwrKw += num(r.cntrPwr) ?? 0
        cur.usageKwh += num(r.powerUsage) ?? 0
        cur.billKrw += num(r.bill) ?? 0
        byCity.set(city, cur)
      }
      const cities = [...byCity.values()]
        .map((c) => ({
          city: c.city,
          cntrPwrMw: Math.round(c.cntrPwrKw / 100) / 10,
          usageGwh: Math.round(c.usageKwh / 100000) / 10,
          unitCost: c.usageKwh > 0 ? Math.round((c.billKrw / c.usageKwh) * 10) / 10 : null,
        }))
        .sort((a, b) => b.cntrPwrMw - a.cntrPwrMw)
      if (!cities.length) continue
      res.status(200).json({
        available: true,
        year,
        month,
        cities,
        totalCntrPwrMw: Math.round(cities.reduce((s, c) => s + c.cntrPwrMw, 0)),
        source: '한전 전력데이터 개방포털 — 계약종별 전력사용량(일반용 집계)',
      })
      return
    } catch {
      /* 다음 달 시도 */
    }
  }
  res.status(200).json({ available: false, reason: 'no_recent_month' })
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')

  const key = process.env.KEPCO_API_KEY
  const vworldKey = process.env.VWORLD_KEY
  // KEPCO 키만 필수. vworld는 서버 폴백(좌표→코드)용이라, 클라이언트가 admCd/metroCd를 넘기면 불필요.
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  // 계약종별 전력사용량 모드 — ?usage=1&metroCd=41 (좌표 불필요)
  if (req.query.usage) {
    await usageHandler(req, res, key)
    return
  }

  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  // 좌표→코드: 클라이언트가 브라우저 vworld로 받은 법정동코드(admCd 10/5) 또는 시도코드(metroCd 2)를
  // 넘기면 그대로 사용(서버측 vworld 502 우회). 없을 때만 서버 vworld 폴백.
  const admCd = String(req.query.admCd || '').replace(/\D/g, '')
  const metroCdQ = String(req.query.metroCd || '').replace(/\D/g, '')
  let codes = null
  if (/^\d{10}$/.test(admCd) || /^\d{5}$/.test(admCd)) codes = { metro: admCd.slice(0, 2), city: admCd.slice(2, 5) }
  else if (/^\d{2}$/.test(metroCdQ)) codes = { metro: metroCdQ, city: '' }

  try {
    if (!codes && vworldKey) codes = await regionCodes(lat, lng, vworldKey)
    if (!codes) {
      res.status(200).json({ available: false, reason: admCd || metroCdQ ? 'bad_region_code' : 'no_region_code' })
      return
    }
    let url = (process.env.KEPCO_HEADROOM_URL || DEFAULT_URL)
      .replaceAll('{metro}', codes.metro)
      .replaceAll('{city}', codes.city)
      // 레거시 플레이스홀더 호환(과거 env가 {sido}/{sigungu}를 쓰는 경우)
      .replaceAll('{sido}', codes.metro)
      .replaceAll('{sigungu}', codes.city)
      .replaceAll('{key}', key)
    // cityCd가 비면(시도만 조회) 빈 파라미터 제거 — KEPCO는 cityCd 미지정 시 시도 전체 반환.
    if (!codes.city) url = url.replace(/([?&])cityCd=(&|$)/, (m, p1, p2) => (p2 === '&' ? p1 : '')).replace(/[?&]$/, '')

    // 마감시한(11s) 안에서 순차 폴백. bigdata.kepco의 실패 원인을 단정하지 않고 여러 경로 시도:
    //  1) 프록시(UPSTREAM_PROXY_BASE, 설정 시) → 2) undici 직접 → 3) IPv4 직결 https/http.
    // KPX openapi와 동일한 IPv6 블랙홀이면 3)에서 프록시 없이 뚫린다.
    const start = Date.now()
    const DEADLINE = 11000
    const remain = () => DEADLINE - (Date.now() - start)
    const httpUrl = url.startsWith('https://') ? url.replace('https://', 'http://') : url
    let body = null
    let lastErr = null
    if (proxyConfigured()) {
      try {
        body = asJson(await proxyGetText(url, Math.min(7000, remain())))
      } catch (e) {
        lastErr = e
      }
    }
    if (!body) {
      const b = await fetchJson(url, Math.min(5000, remain()))
      if (b && !b._status) body = b
      else if (b?._status) lastErr = new Error(`status_${b._status}`)
    }
    if (!body) {
      for (const u of [url, httpUrl]) {
        if (remain() < 1200) break
        try {
          const b = asJson(await rawGetText(u, Math.min(5000, remain() - 500)))
          if (b) {
            body = b
            break
          }
        } catch (e) {
          lastErr = e
        }
      }
    }
    if (!body) {
      res.status(200).json({ available: false, reason: `upstream_${lastErr?.cause?.code || lastErr?.message || lastErr?.name || 'unreachable'}` })
      return
    }

    const rows = pickList(body)
    if (!rows.length) {
      res.status(200).json({ available: false, reason: 'no_rows' })
      return
    }

    // 변전소별 목록 모드 (?list=1) — 관내 변전소 단위로 최대 여유 선로를 집계해 상위 8개 반환.
    if (req.query.list) {
      const bySubst = new Map()
      for (const row of rows) {
        const name = row.substNm ? String(row.substNm) : '미상'
        const freeKw = num(row.vol3) ?? num(row.vol2) ?? num(row.vol1)
        if (freeKw == null) continue
        const cur = bySubst.get(name)
        if (!cur || freeKw > cur) bySubst.set(name, freeKw)
      }
      const list = [...bySubst.entries()]
        .map(([name, kw]) => ({ name, mw: kwToMw(kw) }))
        .sort((a, b) => (b.mw ?? 0) - (a.mw ?? 0))
        .slice(0, 8)
      if (!list.length) {
        res.status(200).json({ available: false, reason: 'no_capacity_fields' })
        return
      }
      res.status(200).json({
        available: true,
        list,
        rows: rows.length,
        unit: 'MW',
        note: '관내 변전소별 최대 여유 선로 (배전 22.9kV 분산전원 기준 · kW→MW 환산)',
      })
      return
    }

    // 시군구 내 여러 변전소·DL(배전선로) 행 → 접속 관점에서 여유가 가장 큰 선로를 대표값으로.
    // 여유용량: vol3(DL) 우선, 없으면 vol2(변압기)·vol1(변전소). 누적연계: dlPwr/mtrPwr/substPwr.
    let best = null
    for (const row of rows) {
      const freeKw = num(row.vol3) ?? num(row.vol2) ?? num(row.vol1)
      if (freeKw == null) continue
      if (!best || freeKw > best.freeKw) best = { freeKw, row }
    }

    if (best) {
      const r = best.row
      const cumKw = num(r.dlPwr) ?? num(r.mtrPwr) ?? num(r.substPwr)
      const capKw = num(r.jsDlPwr) ?? num(r.jsMtrPwr) ?? num(r.jsSubstPwr)
      res.status(200).json({
        available: true,
        availableMw: kwToMw(best.freeKw),
        cumulativeMw: kwToMw(cumKw),
        capacityMw: kwToMw(capKw) || undefined,
        substNm: r.substNm ? String(r.substNm) : undefined,
        rows: rows.length,
        scope: `${codes.metro}${codes.city}${r.substNm ? ` · ${r.substNm}변전소` : ''} 최대여유 선로 (배전 22.9kV 분산전원)`,
        unit: 'MW',
        note: `관내 ${rows.length}개 선로 중 여유 최대 선로 기준 · 개방포털 값 kW→MW 환산`,
      })
      return
    }

    // 여유용량 필드가 전부 공란이면(포털 샘플처럼) 누적연계용량만이라도 공급 맥락으로 제공.
    let cumKw = null
    let cumNm = null
    for (const row of rows) {
      const c = num(row.dlPwr) ?? num(row.substPwr)
      if (c != null && (cumKw == null || c > cumKw)) {
        cumKw = c
        cumNm = row.substNm ? String(row.substNm) : null
      }
    }
    if (cumKw != null) {
      res.status(200).json({
        available: true,
        cumulativeMw: kwToMw(cumKw),
        substNm: cumNm || undefined,
        rows: rows.length,
        scope: `${codes.metro}${codes.city}${cumNm ? ` · ${cumNm}변전소` : ''} (배전 22.9kV 분산전원)`,
        unit: 'MW',
        note: '여유용량 미제공 · 누적연계용량만(kW→MW 환산)',
      })
      return
    }

    res.status(200).json({ available: false, reason: 'schema_unknown' })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
