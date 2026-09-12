/**
 * 케이웨더(Air365) 현재관측 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 * dcmap-web/api/kweather.js의 게이트웨이 문법을 현재관측만 쓰도록 줄여 옮겼다.
 *
 * 호출: /api/weather?lat=&lng=
 * 응답: { available, tempC, humidity, windMs, precipMm, sky, place, observedAt }
 *       키 미설정·조회 실패 시 { available:false, reason } — 가짜 수치를 만들어 내지 않는다.
 *
 * 환경변수: KWEATHER_API_KEY(필수) · KWEATHER_API_BASE(선택)
 */
const DEFAULT_BASE = 'https://gateway.kweather.co.kr:8443'
const SENSORS = '/weather/w3/v2/kw-sensors'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const WICON_TEXT = { 1: '맑음', 2: '구름조금', 3: '구름많음', 4: '흐림', 5: '비', 6: '비/눈', 7: '눈' }

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}
const pick = (o, names) => {
  for (const n of names) if (o?.[n] != null && o[n] !== '') return o[n]
  return undefined
}
/** 게이트웨이는 스칼라와 시계열 배열을 섞어 반환한다 — 배열이면 첫 값(현재시점) */
const at = (o, names) => {
  const v = pick(o, names)
  return Array.isArray(v) ? v[0] : v
}

async function getJson(url, ms = 7000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** 봉투 정규화 — 형태A: data가 곧 페이로드 · 형태B: data:{ "<code>": { service, data } } */
function dataBlock(json) {
  if (!json || (json.error != null && String(json.error) !== '0')) return null
  const d = json.data
  if (!d || typeof d !== 'object') return null
  if (d.tm || d.t1h || d.temp || d.maxTemp || d.rainP) return d
  const first = Object.values(d)[0]
  return first?.data ?? null
}

/** 한국어 하늘상태 → omen 엔진이 쓰는 코드 */
function skyCode(text) {
  const s = String(text ?? '')
  if (!s) return undefined
  if (s.includes('눈')) return 'snow'
  if (s.includes('비')) return 'rain'
  if (s.includes('맑')) return 'clear'
  if (s.includes('흐') || s.includes('구름')) return 'cloudy'
  return undefined
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800')

  const key = process.env.KWEATHER_API_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'KWEATHER_API_KEY 미설정' })
    return
  }

  const lat = num(req.query?.lat)
  const lng = num(req.query?.lng)
  if (lat == null || lng == null || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    res.status(400).json({ available: false, reason: '좌표 범위 오류' })
    return
  }

  const base = (process.env.KWEATHER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
  const q = `lat=${lat}&lon=${lng}&apikey=${encodeURIComponent(key)}`

  // ① 현재관측 직접 조회 → ② GPS 시계열 폴백
  const block =
    dataBlock(await getJson(`${base}${SENSORS}/kw-odam1?${q}`)) ??
    dataBlock(await getJson(`${base}${SENSORS}/kw-gis-gps?${q}`))

  if (!block) {
    res.status(200).json({ available: false, reason: '관측 응답 없음' })
    return
  }

  const tempC = num(at(block, ['t1h', 'temp', 'ta', 'currentTemp']))
  const humidity = num(at(block, ['reh', 'humidity']))
  const windMs = num(at(block, ['wsd', 'windSpeed', 'ws']))
  const precipMm = num(at(block, ['rn1', 'rain', 'rainAmount']))
  const skyText = at(block, ['sky', 'skyText', 'weather']) ?? WICON_TEXT[num(at(block, ['wIcon', 'icon']))]

  if (tempC == null && humidity == null && skyText == null) {
    res.status(200).json({ available: false, reason: '관측값 파싱 실패' })
    return
  }

  res.status(200).json({
    available: true,
    tempC,
    humidity,
    windMs,
    precipMm,
    sky: skyCode(skyText),
    skyText: skyText ?? null,
    place: [block.state, block.city, block.city2].filter(Boolean).join(' ') || null,
    observedAt: at(block, ['tm', 'timestamp']) ?? null,
  })
}
