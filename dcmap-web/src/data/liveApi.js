// 라이브 API 클라이언트 — 서버리스 프록시(/api/*) 호출. 실패는 null (프런트는 '대기' 표시)
// 키는 전부 서버 측 env — 브라우저에 노출되지 않는다.

import { hasVworldClient, geocodeClient, revgeoClient, landUseClient } from './vworldClient.js'

const cache = new Map()

// 기본 9s — vworld(재시도)·정부포털은 4.5s 안에 못 끝나 '연동 대기'로 오탐되던 것을 완화.
// 집계형(EPSIS 페이지네이션 등)은 호출부에서 더 길게 지정한다(서버 예산 ~13s과 맞춤).
async function fetchJson(url, ms = 9000) {
  if (cache.has(url)) return cache.get(url)
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const body = await r.json()
    const value = body?.available ? body : null
    cache.set(url, value)
    return value
  } catch {
    return null
  }
}

const q = (lat, lng) => `lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`

/** 케이웨더 오늘 예보 요약 — { temp(최고), tempMin, sky, rainProb, snow } | null */
export const weatherFor = (lat, lng) => fetchJson(`/api/kweather?kind=current&${q(lat, lng)}`)

/** vworld 리버스 지오코딩 — { parcel, road } | null.
 *  브라우저 직접 호출(VITE_VWORLD_KEY) 우선 — Vercel 서버IP는 vworld가 차단하므로. 실패 시 /api 프록시. */
export const revgeoFor = async (lat, lng) => {
  if (hasVworldClient()) {
    const r = await revgeoClient(lat, lng)
    if (r) return r
  }
  return fetchJson(`/api/revgeo?${q(lat, lng)}`)
}

/** 지번주소에서 동단위 근거지 라벨 추출 — "○○동/읍/면" (없으면 시군구) | null.
 *  표출값의 위치 근거를 동단위까지 보여주기 위한 포매터. */
export function dongLabel(addr) {
  const s = addr?.parcel || addr?.road || ''
  if (!s) return null
  // 시/군/구는 동에 가장 가까운(마지막) 토큰 사용 — "서울특별시 강남구 역삼동" → "강남구 역삼동"
  const sggAll = s.match(/([가-힣]+(?:시|군|구))/g)
  const sgg = sggAll ? sggAll[sggAll.length - 1] : null
  const dong = s.match(/([가-힣A-Za-z0-9]+(?:동|읍|면))(?=\s|$|\d)/)
  if (dong) return sgg && sgg !== dong[1] ? `${sgg} ${dong[1]}` : dong[1]
  return sgg || null
}

/** vworld 포워드 지오코딩 — 지번/도로명 주소 → { lat, lng, matched, matchType } | null.
 *  vworld는 간헐 지연/재시도가 있어 클라이언트 타임아웃을 넉넉히(9s) 준다. */
export async function geocodeAddr(query) {
  const s = String(query || '').trim()
  if (!s) return null
  if (hasVworldClient()) {
    const r = await geocodeClient(s)
    if (r) return r
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 9000)
    const r = await fetch(`/api/revgeo?q=${encodeURIComponent(s)}`, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const body = await r.json()
    return body?.available ? body : null
  } catch {
    return null
  }
}

/** vworld 용도지역 (토지축 v1 근거) — { uses: string[] } | null. 브라우저 직접 우선, 실패 시 프록시. */
export const landUseFor = async (lat, lng) => {
  if (hasVworldClient()) {
    const r = await landUseClient(lat, lng)
    if (r) return r
  }
  return fetchJson(`/api/landuse?${q(lat, lng)}`)
}

/** 케이웨더 일별예보(최대 7일) — { days:[{label,tmax,tmin,rainProb,sky}], rain } | null */
export const forecastFor = (lat, lng) => fetchJson(`/api/kweather?kind=forecast&${q(lat, lng)}`)

/** 케이웨더 기상특보 — { warnings:[], count } | null (count 0 = 발효 특보 없음) */
export const warningFor = (lat, lng) => fetchJson(`/api/kweather?kind=warning&${q(lat, lng)}`)

/** 케이웨더 과거 연별 기후 — { avgTemp, maxTemp, minTemp, rainSum } | null (프리쿨링 잠재력) */
export const climateFor = (lat, lng) => fetchJson(`/api/kweather?kind=climate&${q(lat, lng)}`)

/** 한전 분산전원 계통 여유용량 — { availableMw, cumulativeMw, scope } | null.
 *  code: 브라우저 vworld가 받은 법정동코드(10/5자리) 또는 시도코드(2자리)를 서버로 전달 →
 *  서버측 vworld(Vercel IP 502) 우회. code 없으면 서버가 vworld 폴백. */
export const headroomFor = (lat, lng, code) =>
  fetchJson(`/api/headroom?${q(lat, lng)}${code ? `&${String(code).length === 2 ? 'metroCd' : 'admCd'}=${code}` : ''}`)

/** DART 최근 DC 관련 공시 (D2 이벤트) — { filings: [{corp,title,date,url}] } | null */
export const filingsRecent = () => fetchJson('/api/filings')

// 집계형 data.go.kr 프록시는 서버에서 최대 ~13s(EPSIS 페이지네이션·supply 폴백) 걸리므로
// 클라이언트 타임아웃을 16s로 — 4.5s로는 정상 응답도 '연동 대기'로 오탐됐다.
const POWER_MS = 16000
/** EPSIS/KPX 발전설비현황 — { byFuel:[{fuel,mw}], facilities, totalMw } | null (연동 대기 시 null) */
export const epsisCapacity = () => fetchJson('/api/power?src=epsis', POWER_MS)

/** KPX 전력수급예보 — { asOf, supplyMw, peakMw, reserveMw, reservePct, rows } | null (연동 대기 시 null) */
export const supplyForecast = () => fetchJson('/api/power?src=supply', POWER_MS)

/** KPX 전력거래실적 — { asOf, byFuel:[{fuel,capacityMw,tradedMwh}], totalMwh } | null (연동 대기 시 null) */
export const tradingMix = () => fetchJson('/api/power?src=trading', POWER_MS)

/** 건축HUB 지번별 전기사용량 — { usage, unit, useYm } | null. 법정동코드+번지+사용년월 필요 */
export const bldEnergyFor = ({ sigunguCd, bjdongCd, bun, ji, useYm }) =>
  sigunguCd && bjdongCd && useYm
    ? fetchJson(
        `/api/bldenergy?kind=elec&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun ?? ''}&ji=${ji ?? ''}&useYm=${useYm}`,
      )
    : Promise.resolve(null)

/** 홍수위험지도 침수 위험 — { depthM, grade, floodType, scenario } | null (리스크축 침수).
 *  포털 IPv4 폴백까지 서버가 ~10s 쓸 수 있어 클라이언트도 12s로 넉넉히 준다. */
export const floodRiskFor = async (lat, lng) => {
  // 1순위: SGIS 홍수위험지도 영향범위(읍면동, 토큰 연동 시 도달) → 막힌 홍수위험지도포털 대체.
  const s = await fetchJson(`/api/sgis?kind=flood&${q(lat, lng)}`, 12000)
  if (s?.available) return s
  // 2순위: 홍수위험지도포털 침수심(클라우드 IP 차단 시 대기)
  return fetchJson(`/api/floodmap?${q(lat, lng)}`, 12000)
}

/** SGIS 인구/밀도 — { population, households, density, admNm, level } | null (리스크축 민원 프록시).
 *  서버가 SGIS 리버스지오코딩(좌표→행정동코드)으로 읍면동 정밀 조회. admCd/sgg는 폴백용(선택). */
export const populationFor = (lat, lng, admCd, sgg) =>
  fetchJson(
    `/api/sgis?${q(lat, lng)}${admCd ? `&adm_cd=${admCd}` : ''}${sgg ? `&sgg=${encodeURIComponent(sgg)}` : ''}`,
  )

/** 재해 위험 — SGIS 산사태위험지도 영향범위 1순위(읍면동), 재난안전(시군구 재해 이력) 폴백. */
export const disasterFor = async (lat, lng, admCd) => {
  const s = await fetchJson(`/api/sgis?kind=landslide&${q(lat, lng)}`)
  if (s?.available) return s
  return fetchJson(`/api/disaster?${q(lat, lng)}${admCd ? `&admCd=${admCd}` : ''}`)
}

/** API 연동 현황 — { sources:[{key,label,axis,configured,available?,reason?}], probed } | null */
export const apiStatus = (probe = true) =>
  fetch(`/api/status${probe ? '?probe=1' : ''}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
