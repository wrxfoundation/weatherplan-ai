/**
 * 케이웨더(KWeather) Air365 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 * 스펙 출처: Wellbian API 통합 가이드 v2.6 + 프로덕션 debug=gis 실응답 확인:
 *   kw-gis-gps?lat=&lon= 은 행정동코드가 아니라 { data:{ timeZone, tm:[시간…], …기상 배열 } }
 *   형태의 GPS 직접 시계열을 반환한다(error:"0"). → 코드 변환 없이 GPS로 바로 조회하는 구조.
 *
 * 호출: /api/kweather?kind=current|forecast&lat=&lng=
 * 전략(순차 폴백):
 *   current  → ① kw-odam1?lat&lon(GPS 직접) ② 코드 해석되면 kw-odam1/{code} ③ kw-gis-gps 시계열 현재시점
 *   forecast → ① kw-3d24h1?lat&lon ② kw-3d24h1/{code} ③ kw-gis-gps 시계열 일별 집계
 *
 * 환경변수: KWEATHER_API_KEY(필수) · KWEATHER_API_BASE(선택, 기본 :8443 게이트웨이)
 * 실패/미설정 시 { available:false, reason } — 가짜 수치 금지
 */
const DEFAULT_BASE = 'https://gateway.kweather.co.kr:8443'
const SENSORS = '/weather/w3/v2/kw-sensors'
const DAY_LABEL = ['오늘', '내일', '모레', '+3일', '+4일', '+5일', '+6일']
const MAX_DAYS = 7
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
/** 배열 필드면 i번째, 스칼라면 그대로 */
const at = (o, names, i = 0) => {
  const v = pick(o, names)
  return Array.isArray(v) ? v[i] : v
}

async function getJson(url, ms = 7000) {
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

/** 봉투 정규화 — 형태A: data가 곧 페이로드(tm/기상 배열) · 형태B: data:{ "<code>": {service,data} } */
function dataBlock(json) {
  if (!json || (json.error != null && String(json.error) !== '0')) return null
  const d = json.data
  if (!d || typeof d !== 'object') return null
  if (d.tm || d.t1h || d.temp || d.maxTemp || d.rainP) return { data: d, timestamp: undefined }
  const first = Object.values(d)[0]
  if (first?.data) return { data: first.data, timestamp: first.service?.timestamp }
  return null
}

/** 행정동코드 탐색 — 시도코드(11~50)로 시작하는 10자리만 유효. 타임스탬프(20YYMMDDHH) 오인 방지 */
const isDongCode = (v) => /^\d{10}$/.test(String(v)) && !/^20\d{8}$/.test(String(v))
function findCode(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return undefined
  for (const [k, v] of Object.entries(obj)) {
    if (/^(code|hcode|admcd|adm_cd|dongcode|dong_cd|areacode)$/i.test(k) && isDongCode(v)) return String(v)
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const f = findCode(v, depth + 1)
      if (f) return f
    }
  }
  return undefined
}

const T_NAMES = ['t1h', 'temp', 'ta', 't3h']
const SKY_NAMES = ['wText', 'condition', 'sky']
const ICON_NAMES = ['wIcon', 'icon']

function currentFrom(d, scopeFallback) {
  const temp = num(at(d, T_NAMES))
  const skyRaw = at(d, SKY_NAMES)
  const sky = skyRaw != null ? String(skyRaw) : WICON_TEXT[num(at(d, ICON_NAMES))]
  const humidity = num(at(d, ['reh', 'humidity']))
  if (temp == null && sky == null && humidity == null) return null
  return {
    available: true,
    temp,
    sky,
    humidity,
    senseTemp: num(at(d, ['senseTemp', 'feelsLike'])),
    rain1h: num(at(d, ['rn1', 'rain'])),
    windSpeed: num(at(d, ['wsd', 'windSpeed', 'ws'])),
    windDir: at(d, ['vec', 'windDir', 'wd']),
    pressure: num(at(d, ['pa', 'pressure'])),
    pm10: num(at(d, ['pm10'])),
    pm25: num(at(d, ['pm25', 'pm2_5'])),
    scope: [d.state, d.city, d.city2].filter(Boolean).join(' ') || scopeFallback,
  }
}

/** kw-gis-gps 시간별 시계열 → 일별 집계(최고/최저/강수확률 최대) */
function daysFromHourly(d) {
  const tm = Array.isArray(d.tm) ? d.tm : []
  const temps = pick(d, T_NAMES)
  const rains = pick(d, ['rainP', 'pop', 'rnProb'])
  const icons = pick(d, ICON_NAMES)
  if (!tm.length || !Array.isArray(temps)) return null
  const byDay = new Map()
  for (let i = 0; i < tm.length; i++) {
    const day = String(tm[i]).slice(0, 8)
    if (!byDay.has(day)) byDay.set(day, { t: [], r: [], ic: [] })
    const g = byDay.get(day)
    const tv = num(temps[i])
    if (tv != null) g.t.push(tv)
    const rv = Array.isArray(rains) ? num(rains[i]) : undefined
    if (rv != null) g.r.push(rv)
    const iv = Array.isArray(icons) ? num(icons[i]) : undefined
    if (iv != null) g.ic.push(iv)
  }
  const days = [...byDay.entries()].slice(0, MAX_DAYS).map(([, g], i) => ({
    label: DAY_LABEL[i] ?? `+${i}일`,
    tmax: g.t.length ? Math.max(...g.t) : undefined,
    tmin: g.t.length ? Math.min(...g.t) : undefined,
    rainProb: g.r.length ? Math.max(...g.r) : undefined,
    sky: g.ic.length ? WICON_TEXT[g.ic[Math.floor(g.ic.length / 2)]] : undefined,
  }))
  return days.length ? days : null
}

export default async function handler(req, res) {
  const KINDS = ['current', 'forecast', 'warning', 'climate']
  const kind = KINDS.includes(req.query.kind) ? req.query.kind : 'current'
  const CACHE = {
    current: 's-maxage=300, stale-while-revalidate=600',
    forecast: 's-maxage=600, stale-while-revalidate=1200',
    warning: 's-maxage=60, stale-while-revalidate=300', // Wellbian 캐시 정책: 특보는 빠른 전파
    climate: 's-maxage=86400, stale-while-revalidate=604800', // 과거 연별 — 사실상 불변
  }
  res.setHeader('Cache-Control', CACHE[kind])

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

  // 순차 다단 폴백이 Vercel 30s 함수 한도를 넘지 않게 전체 마감시한(13s) — 남은 예산만큼만 각 호출에 할당.
  const start = Date.now()
  const DEADLINE = 13000
  const left = () => Math.max(600, DEADLINE - (Date.now() - start))
  const budgeted = (url) => getJson(url, Math.min(6000, left()))

  try {
    const base = (process.env.KWEATHER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
    const auth = `api_key=${encodeURIComponent(key)}`
    const gpsQ = `lat=${lat}&lon=${lng}&${auth}`
    // Wellbian 센서 카탈로그 — 예보 7일 우선, 특보는 동별→전국, 기후는 과거 연별→일별
    const CANDIDATES = {
      current: ['kw-odam1'],
      forecast: ['kw-7d24h1', 'kw-3d24h1'],
      warning: ['kw-warning1', 'kw-ktko511', 'kw-wrn-now1'],
      climate: ['kw-past-year1', 'kw-cbko1'],
    }
    const candidates = CANDIDATES[kind]

    // ① 센서에 GPS 직접 질의 (kw-gis-gps가 GPS 직접 응답인 것으로 확인된 게이트웨이 문법)
    let raw = null
    let block = null
    let okRaw = null // error=0 원응답(블록이 비어도 유효 — 특보 없음 등)
    let sensor = candidates[0]
    for (const s of candidates) {
      raw = await budgeted(`${base}${SENSORS}/${s}?${gpsQ}`)
      if (!raw?._status && String(raw?.error ?? '') === '0' && !okRaw) okRaw = raw
      block = raw?._status ? null : dataBlock(raw)
      if (block) {
        sensor = s
        break
      }
    }

    // ② GPS 시계열(kw-gis-gps) — 코드 해석·최후 폴백 재료
    let gps = null
    if (!block || req.query.debug === 'gis') {
      gps = await budgeted(`${base}${SENSORS}/kw-gis-gps?${gpsQ}`)
    }
    if (req.query.debug === 'gis') {
      const g = gps && !gps._status ? gps : raw
      res.status(200).json({
        available: true,
        debug: 'gis',
        resolvedCode: findCode(g) ?? null,
        errorField: g?.error,
        dataKeys: g?.data && typeof g.data === 'object' ? Object.keys(g.data).slice(0, 40) : null,
        sample: JSON.stringify(g).slice(0, 1200),
      })
      return
    }

    // 특보(warning): 문자열에서 주의보/경보 수집 — 빈 배열 = 발효 특보 없음(정상)
    if (kind === 'warning') {
      const srcObj = block?.data ?? okRaw
      if (!srcObj) {
        const shape = raw?._status ? `http${raw._status}` : `e${raw?.error ?? 'null'}`
        res.status(200).json({ available: false, reason: `no_warning_source_${shape}` })
        return
      }
      const warns = new Set()
      ;(function scan(o, depth = 0) {
        if (!o || typeof o !== 'object' || depth > 6) return
        for (const v of Object.values(o)) {
          if (typeof v === 'string' && /(주의보|경보)/.test(v) && v.length <= 40) warns.add(v)
          else if (v && typeof v === 'object') scan(v, depth + 1)
        }
      })(srcObj)
      res.status(200).json({ available: true, warnings: [...warns], count: warns.size, source: '케이웨더 기상특보' })
      return
    }

    // 기후(climate): 과거 연별 — 연평균/최고/최저기온·연강수량 (배열이면 최근값)
    if (kind === 'climate') {
      const d = block?.data ?? okRaw?.data
      if (d && typeof d === 'object') {
        const lastOf = (names) => {
          const v = pick(d, names)
          if (Array.isArray(v)) {
            for (let i = v.length - 1; i >= 0; i--) if (num(v[i]) != null) return num(v[i])
            return undefined
          }
          return num(v)
        }
        const avgTemp = lastOf(['avgTa', 'avgTemp', 'taAvg', 'yearTa', 'annualTemp', 'ta'])
        const maxTemp = lastOf(['maxTa', 'maxTemp'])
        const minTemp = lastOf(['minTa', 'minTemp'])
        const rainSum = lastOf(['sumRn', 'rnSum', 'rainSum', 'yearRn', 'rn'])
        if (avgTemp != null || maxTemp != null || rainSum != null) {
          res.status(200).json({ available: true, avgTemp, maxTemp, minTemp, rainSum, source: `케이웨더 과거 기후(${sensor})` })
          return
        }
        // 필드 미확인 — 진단용 키 목록(값 아님)
        res.status(200).json({ available: false, reason: 'no_climate_fields', dataKeys: Object.keys(d).slice(0, 30) })
        return
      }
      const shape = raw?._status ? `http${raw._status}` : `e${raw?.error ?? 'null'}`
      res.status(200).json({ available: false, reason: `no_climate_source_${shape}` })
      return
    }

    // ③ 코드가 해석되면 코드 경로 재시도
    if (!block && gps && !gps._status) {
      const code = findCode(gps)
      if (code) {
        raw = await budgeted(`${base}${SENSORS}/${sensor}/${code}?${auth}`)
        block = raw?._status ? null : dataBlock(raw)
      }
    }

    if (block) {
      if (kind === 'current') {
        const out = currentFrom(block.data, 'GPS 지점')
        if (out) {
          res.status(200).json({ ...out, timestamp: block.timestamp })
          return
        }
      } else {
        const d = block.data
        const rainP = d.rainP ?? []
        const maxT = d.maxTemp ?? []
        if (maxT.length || rainP.length) {
          const days = []
          for (let i = 0; i < Math.min(MAX_DAYS, Math.max(rainP.length, maxT.length)); i++) {
            days.push({ label: DAY_LABEL[i] ?? `+${i}일`, tmax: num(maxT[i]), tmin: num((d.minTemp ?? [])[i]), rainProb: num(rainP[i]), sky: WICON_TEXT[num((d.wIcon ?? [])[i])] })
          }
          res.status(200).json({ available: true, days, rain: days.some((x) => (x.rainProb ?? 0) >= 60), timestamp: block.timestamp })
          return
        }
        const days = daysFromHourly(d)
        if (days) {
          res.status(200).json({ available: true, days, rain: days.some((x) => (x.rainProb ?? 0) >= 60) })
          return
        }
      }
    }

    // ④ 최후: kw-gis-gps 시계열에서 직접 추출
    const gpsBlock = gps && !gps._status ? dataBlock(gps) : null
    if (gpsBlock) {
      if (kind === 'current') {
        const out = currentFrom(gpsBlock.data, 'GPS 지점')
        if (out) {
          res.status(200).json(out)
          return
        }
      } else {
        const days = daysFromHourly(gpsBlock.data)
        if (days) {
          res.status(200).json({ available: true, days, rain: days.some((x) => (x.rainProb ?? 0) >= 60) })
          return
        }
      }
    }

    const shape = raw?._status ? `http${raw._status}` : `e${raw?.error ?? 'null'}`
    res.status(200).json({ available: false, reason: `no_weather_fields_${shape}` })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
