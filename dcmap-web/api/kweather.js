/**
 * 케이웨더(KWeather) Air365 예보 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 * 스펙 출처: 사용자 제공 참조 구현(todayindex) lib/adapters/kweather.ts — KW_기상API_OpenAPI_20250929.
 *
 * 호출: /api/kweather?kind=current|forecast&lat=&lng=
 * 흐름(위경도 입력):
 *   1) GIS  {BASE}/weather/map/v1/l015?lat=&lon=&api_key=  → 행정동코드(hcode)
 *   2) 예보 {BASE}/weather/w3/v2/kw-sensors/kw-3d24h1/{hcode}?api_key= → 3일 일별예보
 * 응답 봉투: { error:"0", data: { "<hcode>": { service:{timestamp}, data:{ tmEf[],maxTemp[],minTemp[],rainP[],snowF[],wIcon[] } } } }
 *
 * 환경변수 (Vercel — 키 커밋 금지):
 *  - KWEATHER_API_KEY (필수)
 *  - KWEATHER_API_BASE (선택, 기본 https://gateway.kweather.co.kr:8443)  ← 포트 8443 필수
 *
 * 응답:
 *  kind=current  → { available, temp(오늘 최고), tempMin, sky, rainProb, snow, scope, timestamp }
 *  kind=forecast → { available, days:[{label,tmax,tmin,rainProb,sky}], rain, timestamp }
 *  실패/미설정 시 { available:false, reason } — 가짜 수치 금지
 */
const DEFAULT_BASE = 'https://gateway.kweather.co.kr:8443'
const DAY_LABEL = ['오늘', '내일', '모레', '+3일']
// wIcon: 1맑음 2구름조금 3구름많음 4흐림 5비 6눈/비 7눈
const WICON_TEXT = { 1: '맑음', 2: '구름조금', 3: '구름많음', 4: '흐림', 5: '비', 6: '비/눈', 7: '눈' }

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

const UA = 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)'

async function getJson(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

/** 케이웨더 공통 봉투에서 첫 행정동의 data 블록 추출 */
function firstData(json) {
  if (!json || json.error !== '0' || !json.data) return null
  const first = Object.values(json.data)[0]
  if (!first?.data) return null
  return { data: first.data, timestamp: first.service?.timestamp }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const key = process.env.KWEATHER_API_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }
  const kind = req.query.kind === 'forecast' ? 'forecast' : 'current'
  const lat = num(req.query.lat)
  const lng = num(req.query.lng)
  if (lat == null || lng == null || lat < 32 || lat > 40 || lng < 123 || lng > 132) {
    res.status(400).json({ available: false, reason: 'bad_point' })
    return
  }

  try {
    const base = (process.env.KWEATHER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
    const auth = `api_key=${encodeURIComponent(key)}`

    // 1) 행정동코드 해석
    const gis = await getJson(`${base}/weather/map/v1/l015?lat=${lat}&lon=${lng}&${auth}`)
    if (gis?._status) {
      res.status(200).json({ available: false, reason: `upstream_${gis._status}` })
      return
    }
    // ?debug=1 → l015 원응답 구조(행정동코드, 시크릿 아님) 노출로 파싱 진단
    if (req.query.debug === 'gis') {
      res.status(200).json({ available: true, debug: 'gis', errorField: gis?.error, topKeys: Object.keys(gis || {}), sample: JSON.stringify(gis).slice(0, 400) })
      return
    }
    // 방어적 hcode 추출(error가 숫자 0/문자 "0" 혼재 대비, 구조 변형 대비)
    const okError = gis?.error == null || String(gis.error) === '0'
    const hcode =
      gis?.data?.[0]?.hcode ?? gis?.data?.hcode ?? gis?.hcode ?? (Array.isArray(gis?.data) ? gis.data.find((x) => x?.hcode)?.hcode : undefined)
    if (!okError || hcode == null) {
      res.status(200).json({ available: false, reason: 'no_region_code' })
      return
    }

    // 2) 3일 일별예보
    const raw = await getJson(`${base}/weather/w3/v2/kw-sensors/kw-3d24h1/${hcode}?${auth}`)
    if (raw?._status) {
      res.status(200).json({ available: false, reason: `upstream_${raw._status}` })
      return
    }
    const fcst = firstData(raw)
    if (!fcst) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    const d = fcst.data
    const rainP = d.rainP ?? []
    const maxT = d.maxTemp ?? []
    const minT = d.minTemp ?? []
    const snowF = d.snowF ?? []
    const wIcon = d.wIcon ?? []
    const skyOf = (i) => WICON_TEXT[num(wIcon[i])] || undefined

    if (kind === 'forecast') {
      const days = []
      for (let i = 0; i < Math.min(4, Math.max(rainP.length, maxT.length)); i++) {
        days.push({ label: DAY_LABEL[i] ?? `+${i}일`, tmax: num(maxT[i]), tmin: num(minT[i]), rainProb: num(rainP[i]), sky: skyOf(i) })
      }
      if (!days.length) {
        res.status(200).json({ available: false, reason: 'no_forecast_fields' })
        return
      }
      res.status(200).json({ available: true, days, rain: days.some((x) => (x.rainProb ?? 0) >= 60), timestamp: fcst.timestamp })
      return
    }

    // kind=current — 오늘 일별 요약(케이웨더 Air365는 일별 예보 제공)
    const temp = num(maxT[0])
    const sky = skyOf(0)
    if (temp == null && sky == null && num(rainP[0]) == null) {
      res.status(200).json({ available: false, reason: 'no_weather_fields' })
      return
    }
    res.status(200).json({
      available: true,
      temp,
      tempMin: num(minT[0]),
      sky,
      rainProb: num(rainP[0]),
      snow: num(snowF[0]),
      scope: `행정동 ${hcode}`,
      timestamp: fcst.timestamp,
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
