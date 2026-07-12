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
import { proxyConfigured, proxyGetText } from './_proxy.js'

const DEFAULT_URL =
  'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do?metroCd={metro}&cityCd={city}&apiKey={key}&returnType=json'

const kwToMw = (kw) => (kw == null ? undefined : Math.round(kw / 100) / 10)

const num = (v) => {
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } })
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
      .replaceAll('{metro}', codes.metro)
      .replaceAll('{city}', codes.city)
      // 레거시 플레이스홀더 호환(과거 env가 {sido}/{sigungu}를 쓰는 경우)
      .replaceAll('{sido}', codes.metro)
      .replaceAll('{sigungu}', codes.city)
      .replaceAll('{key}', key)

    // 프록시(UPSTREAM_PROXY_BASE) 설정 시 KR-IP 경유 최우선 — bigdata.kepco.co.kr IP차단 근본 우회.
    let body = null
    if (proxyConfigured()) {
      try {
        body = JSON.parse(await proxyGetText(url, 8000))
      } catch {
        body = null
      }
    }
    if (!body) body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }

    const rows = pickList(body)
    if (!rows.length) {
      res.status(200).json({ available: false, reason: 'no_rows' })
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
