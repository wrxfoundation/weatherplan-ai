/**
 * 케이웨더 날씨 프록시 — 키를 브라우저에 노출하지 않기 위한 서버리스 함수.
 *
 * 환경변수 (Vercel 프로젝트 설정):
 *  - KWEATHER_API_KEY  (필수) — 코드/리포에 절대 커밋 금지
 *  - KWEATHER_API_URL  (선택) — 엔드포인트 템플릿. {lat} {lng} {key} 플레이스홀더 지원.
 *      기본값은 케이웨더 API(api.kweather.co.kr) 현재날씨 추정 경로이며,
 *      실제 API 가이드의 경로와 다르면 이 env만 바꾸면 된다(코드 재배포 불필요).
 *
 * 응답: { available, temp?, sky?, humidity?, pm10?, period? }
 *  - 업스트림 실패/미설정 시 available:false — 프런트는 '연동 대기'로 표시 (가짜 수치 금지)
 */
const DEFAULT_URL = 'http://api.kweather.co.kr/v1/current?lat={lat}&lon={lng}&apikey={key}'

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

/* 케이웨더 응답 필드명이 확정 전이라 알려진 이름들을 방어적으로 탐색 */
function pick(obj, names) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const n of names) {
    if (obj[n] != null && obj[n] !== '') return obj[n]
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = pick(v, names)
      if (found !== undefined) return found
    }
  }
  return undefined
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

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

  const url = (process.env.KWEATHER_API_URL || DEFAULT_URL)
    .replaceAll('{lat}', String(lat))
    .replaceAll('{lng}', String(lng))
    .replaceAll('{key}', key)

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) {
      res.status(200).json({ available: false, reason: `upstream_${r.status}` })
      return
    }
    const body = await r.json()
    const temp = num(pick(body, ['temp', 'TEMP', 't1h', 'T1H', 'ta', 'temperature']))
    const sky = pick(body, ['skyName', 'wfKor', 'wf', 'sky', 'SKY', 'weather'])
    const humidity = num(pick(body, ['humi', 'reh', 'REH', 'humidity']))
    const pm10 = num(pick(body, ['pm10', 'PM10', 'pm10Value']))
    if (temp == null && sky == null) {
      // 응답은 왔지만 알려진 필드가 없음 — 스키마 확인 필요 (가짜 표시 대신 대기)
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    res.status(200).json({ available: true, temp, sky, humidity, pm10 })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
