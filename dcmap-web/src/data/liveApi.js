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

/** 케이웨더 현재 기상 — { temp, sky, humidity, pm10 } | null */
export const weatherFor = (lat, lng) => fetchJson(`/api/weather?${q(lat, lng)}`)

/** vworld 리버스 지오코딩 — { parcel, road } | null */
export const revgeoFor = (lat, lng) => fetchJson(`/api/revgeo?${q(lat, lng)}`)

/** vworld 용도지역 (토지축 v1 근거) — { uses: string[] } | null */
export const landUseFor = (lat, lng) => fetchJson(`/api/landuse?${q(lat, lng)}`)

/** 케이웨더 초단기예보 H+1~6 — { hours:[{temp,sky}], rain } | null */
export const forecastFor = (lat, lng) => fetchJson(`/api/forecast?${q(lat, lng)}`)

/** 한전 분산전원 계통 여유용량 — { availableMw, cumulativeMw, scope } | null */
export const headroomFor = (lat, lng) => fetchJson(`/api/headroom?${q(lat, lng)}`)
