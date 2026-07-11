/**
 * 케이웨더(KWeather) Air365 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 * 스펙 출처: Wellbian API 통합 가이드 v2.6(케이웨더 실사용 문서) + todayindex 참조 구현.
 *
 * 호출: /api/kweather?kind=current|forecast&lat=&lng=
 * 흐름(Wellbian 문법):
 *   1) GPS→행정동코드: {BASE}/kw-gis-gps?lat=&lon=&api_key=   (실패 시 레거시 /weather/map/v1/l015 폴백)
 *   2) kind=current  → {BASE}/kw-odam1/{code}   읍면동 실황(10분 갱신) — 온도·습도·날씨·강수·미세먼지
 *      kind=forecast → {BASE}/kw-3d24h1/{code}  3일 일별예보
 * 공통 봉투: { error:"0", data: { "<code>": { service:{timestamp}, data:{...} } } } — 센서마다 필드 상이(방어적 픽)
 *
 * 환경변수 (Vercel — 키 커밋 금지):
 *  - KWEATHER_API_KEY (필수)
 *  - KWEATHER_API_BASE (선택, 기본 https://gateway.kweather.co.kr:8443) ← 포트 8443 필수
 *
 * 응답:
 *  current  → { available, temp, sky, humidity, senseTemp, rain1h, pm10, pm25, scope, timestamp }
 *  forecast → { available, days:[{label,tmax,tmin,rainProb,sky}], rain, timestamp }
 *  실패/미설정 시 { available:false, reason } — 가짜 수치 금지
 */
const DEFAULT_BASE = 'https://gateway.kweather.co.kr:8443'
const SENSORS = '/weather/w3/v2/kw-sensors'
const DAY_LABEL = ['오늘', '내일', '모레', '+3일']
// wIcon: 1맑음 2구름조금 3구름많음 4흐림 5비 6눈/비 7눈
const WICON_TEXT = { 1: '맑음', 2: '구름조금', 3: '구름많음', 4: '흐림', 5: '비', 6: '비/눈', 7: '눈' }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

const pick = (o, names) => {
  for (const n of names) if (o?.[n] != null && o[n] !== '') return o[n]
  return undefined
}

// Wellbian 가이드 권장 타임아웃 15초
async function getJson(url, ms = 15000) {
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
  if (!json || (json.error != null && String(json.error) !== '0') || !json.data) return null
  const first = Object.values(json.data)[0]
  if (!first?.data) return null
  return { data: first.data, timestamp: first.service?.timestamp }
}

/** 응답 어디에 있든 행정동 코드 탐색 — 센서마다 구조가 달라 방어적으로.
 * 1순위: 알려진 키 이름(code/hcode/admCd…) 2순위: 키 무관 10자리 숫자값(행정동코드는 정확히 10자리) */
function findCode(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return undefined
  for (const [k, v] of Object.entries(obj)) {
    if (/^(code|hcode|admcd|adm_cd|dongcode|dong_cd|areacode)$/i.test(k) && /^\d{8,10}$/.test(String(v))) return String(v)
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const f = findCode(v, depth + 1)
      if (f) return f
    }
  }
  return undefined
}
function findAnyDongCode(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return undefined
  for (const v of Object.values(obj)) {
    if ((typeof v === 'string' || typeof v === 'number') && /^\d{10}$/.test(String(v))) return String(v)
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const f = findAnyDongCode(v, depth + 1)
      if (f) return f
    }
  }
  return undefined
}

export default async function handler(req, res) {
  const kind = req.query.kind === 'forecast' ? 'forecast' : 'current'
  // 실황은 10분 갱신(Wellbian 캐시 정책: 실황 30초·예보 5분+) — 엣지 캐시는 보수적으로
  res.setHeader('Cache-Control', kind === 'current' ? 's-maxage=300, stale-while-revalidate=600' : 's-maxage=600, stale-while-revalidate=1200')

  const key = process.env.KWEATHER_API_KEY
  if (!key) {
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
    const base = (process.env.KWEATHER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
    const auth = `api_key=${encodeURIComponent(key)}`

    // 1) GPS → 행정동코드 (Wellbian: kw-gis-gps 센서) — 실패 시 레거시 l015 폴백
    let gis = await getJson(`${base}${SENSORS}/kw-gis-gps?lat=${lat}&lon=${lng}&${auth}`)
    let code = gis?._status ? undefined : (findCode(gis) ?? findAnyDongCode(gis))
    if (!code) {
      const legacy = await getJson(`${base}/weather/map/v1/l015?lat=${lat}&lon=${lng}&${auth}`)
      if (!legacy?._status) {
        const c = legacy?.data?.[0]?.hcode ?? findCode(legacy) ?? findAnyDongCode(legacy)
        if (c != null) code = String(c)
        gis = legacy
      }
    }
    // ?debug=gis → 코드 해석 원응답 구조(행정동코드뿐, 시크릿 아님)
    if (req.query.debug === 'gis') {
      res.status(200).json({ available: true, debug: 'gis', resolvedCode: code ?? null, errorField: gis?.error, sample: JSON.stringify(gis).slice(0, 400) })
      return
    }
    if (!code) {
      const shape = gis?._status ? `http${gis._status}` : `e${gis?.error ?? 'null'}`
      res.status(200).json({ available: false, reason: `no_region_code_${shape}` })
      return
    }

    if (kind === 'current') {
      // 2a) 읍면동 실황 kw-odam1 (Wellbian ★ 가장 많이 사용)
      const raw = await getJson(`${base}${SENSORS}/kw-odam1/${code}?${auth}`)
      if (raw?._status) {
        res.status(200).json({ available: false, reason: `upstream_${raw._status}` })
        return
      }
      const obs = firstData(raw)
      if (!obs) {
        res.status(200).json({ available: false, reason: 'schema_unknown_odam' })
        return
      }
      const d = obs.data
      const temp = num(pick(d, ['t1h', 'temp', 'ta']))
      const sky = pick(d, ['wText', 'condition', 'sky'])
      const humidity = num(pick(d, ['reh', 'humidity']))
      if (temp == null && sky == null && humidity == null) {
        res.status(200).json({ available: false, reason: 'no_weather_fields' })
        return
      }
      res.status(200).json({
        available: true,
        temp,
        sky: sky != null ? String(sky) : WICON_TEXT[num(d.wIcon)] ,
        humidity,
        senseTemp: num(pick(d, ['senseTemp', 'feelsLike'])),
        rain1h: num(pick(d, ['rn1', 'rain'])),
        pm10: num(d.pm10),
        pm25: num(pick(d, ['pm25', 'pm2_5'])),
        scope: [d.state, d.city, d.city2].filter(Boolean).join(' ') || `행정동 ${code}`,
        timestamp: obs.timestamp,
      })
      return
    }

    // 2b) 3일 일별예보 kw-3d24h1
    const raw = await getJson(`${base}${SENSORS}/kw-3d24h1/${code}?${auth}`)
    if (raw?._status) {
      res.status(200).json({ available: false, reason: `upstream_${raw._status}` })
      return
    }
    const fcst = firstData(raw)
    if (!fcst) {
      res.status(200).json({ available: false, reason: 'schema_unknown_3d' })
      return
    }
    const d = fcst.data
    const rainP = d.rainP ?? []
    const maxT = d.maxTemp ?? []
    const minT = d.minTemp ?? []
    const wIcon = d.wIcon ?? []
    const days = []
    for (let i = 0; i < Math.min(4, Math.max(rainP.length, maxT.length)); i++) {
      days.push({ label: DAY_LABEL[i] ?? `+${i}일`, tmax: num(maxT[i]), tmin: num(minT[i]), rainProb: num(rainP[i]), sky: WICON_TEXT[num(wIcon[i])] })
    }
    if (!days.length) {
      res.status(200).json({ available: false, reason: 'no_forecast_fields' })
      return
    }
    res.status(200).json({ available: true, days, rain: days.some((x) => (x.rainProb ?? 0) >= 60), timestamp: fcst.timestamp })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
