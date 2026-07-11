// 라이브 API 클라이언트 — 서버리스 프록시(/api/*) 호출. 실패는 null (프런트는 '대기' 표시)
// 키는 전부 서버 측 env — 브라우저에 노출되지 않는다.

const cache = new Map()

async function fetchJson(url) {
  if (cache.has(url)) return cache.get(url)
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4500)
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

/** vworld 리버스 지오코딩 — { parcel, road } | null */
export const revgeoFor = (lat, lng) => fetchJson(`/api/revgeo?${q(lat, lng)}`)

/** vworld 포워드 지오코딩 — 지번/도로명 주소 → { lat, lng, matched, matchType } | null.
 *  vworld는 간헐 지연/재시도가 있어 클라이언트 타임아웃을 넉넉히(9s) 준다. */
export async function geocodeAddr(query) {
  const s = String(query || '').trim()
  if (!s) return null
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

/** vworld 용도지역 (토지축 v1 근거) — { uses: string[] } | null */
export const landUseFor = (lat, lng) => fetchJson(`/api/landuse?${q(lat, lng)}`)

/** 케이웨더 일별예보(최대 7일) — { days:[{label,tmax,tmin,rainProb,sky}], rain } | null */
export const forecastFor = (lat, lng) => fetchJson(`/api/kweather?kind=forecast&${q(lat, lng)}`)

/** 케이웨더 기상특보 — { warnings:[], count } | null (count 0 = 발효 특보 없음) */
export const warningFor = (lat, lng) => fetchJson(`/api/kweather?kind=warning&${q(lat, lng)}`)

/** 케이웨더 과거 연별 기후 — { avgTemp, maxTemp, minTemp, rainSum } | null (프리쿨링 잠재력) */
export const climateFor = (lat, lng) => fetchJson(`/api/kweather?kind=climate&${q(lat, lng)}`)

/** 한전 분산전원 계통 여유용량 — { availableMw, cumulativeMw, scope } | null */
export const headroomFor = (lat, lng) => fetchJson(`/api/headroom?${q(lat, lng)}`)

/** DART 최근 DC 관련 공시 (D2 이벤트) — { filings: [{corp,title,date,url}] } | null */
export const filingsRecent = () => fetchJson('/api/filings')

/** EPSIS/KPX 발전설비현황 — { byFuel:[{fuel,mw}], facilities, totalMw } | null (연동 대기 시 null) */
export const epsisCapacity = () => fetchJson('/api/power?src=epsis')

/** KPX 전력수급예보 — { asOf, supplyMw, peakMw, reserveMw, reservePct, rows } | null (연동 대기 시 null) */
export const supplyForecast = () => fetchJson('/api/power?src=supply')

/** KPX 전력거래실적 — { asOf, byFuel:[{fuel,capacityMw,tradedMwh}], totalMwh } | null (연동 대기 시 null) */
export const tradingMix = () => fetchJson('/api/power?src=trading')

/** 건축HUB 지번별 전기사용량 — { usage, unit, useYm } | null. 법정동코드+번지+사용년월 필요 */
export const bldEnergyFor = ({ sigunguCd, bjdongCd, bun, ji, useYm }) =>
  sigunguCd && bjdongCd && useYm
    ? fetchJson(
        `/api/bldenergy?kind=elec&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun ?? ''}&ji=${ji ?? ''}&useYm=${useYm}`,
      )
    : Promise.resolve(null)

/** 홍수위험지도 침수 위험 — { depthM, grade, floodType, scenario } | null (리스크축 침수) */
export const floodRiskFor = (lat, lng) => fetchJson(`/api/floodmap?${q(lat, lng)}`)

/** SGIS 반경 인구/가구 — { population, households, radiusKm } | null (리스크축 민원 프록시) */
export const populationFor = (lat, lng) => fetchJson(`/api/sgis?${q(lat, lng)}`)

/** 재난안전 시군구 재해 이력 — { events, topType, recentYear } | null (리스크축 재해) */
export const disasterFor = (lat, lng) => fetchJson(`/api/disaster?${q(lat, lng)}`)

/** API 연동 현황 — { sources:[{key,label,axis,configured,available?,reason?}], probed } | null */
export const apiStatus = (probe = true) =>
  fetch(`/api/status${probe ? '?probe=1' : ''}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
