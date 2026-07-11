/**
 * vworld 용도지역 프록시 — 맵 클릭 지점의 도시계획 용도지역 조회 (토지축 v1 근거 데이터).
 * vworld 데이터 API GetFeature, 레이어 LT_C_UQ111(용도지역). 키는 서버 env 전용.
 *
 * 환경변수: VWORLD_KEY (revgeo와 공용)
 * 응답: { available, uses: string[] } — 실패/미설정 시 available:false ('조회 대기' 표시)
 * 점수화 주의: 용도지역명은 표시·근거용. 토지축 배점은 골든케이스 캘리브레이션 후(가짜 점수 금지).
 */
const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

/* 응답 필드명 방어적 추출 — properties 안에서 '…지역/지구'로 끝나는 명칭 문자열 수집 */
function collectUseNames(obj, acc) {
  if (!obj || typeof obj !== 'object') return
  for (const v of Object.values(obj)) {
    if (typeof v === 'string' && /(지역|지구|구역)$/.test(v) && v.length <= 30) acc.add(v)
    else if (v && typeof v === 'object') collectUseNames(v, acc)
  }
}

export default async function handler(req, res) {
  // 용도지역은 고시 단위로만 바뀜 — 엣지 하루 캐시
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400')

  const key = process.env.VWORLD_KEY
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

  const url =
    'https://api.vworld.kr/req/data?service=data&version=2.0&request=GetFeature&format=json' +
    `&size=5&page=1&data=LT_C_UQ111&geomFilter=POINT(${lng} ${lat})&key=${key}`

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
    if (body?.response?.status !== 'OK') {
      res.status(200).json({ available: false, reason: 'no_result' })
      return
    }
    const names = new Set()
    collectUseNames(body.response.result, names)
    if (!names.size) {
      res.status(200).json({ available: false, reason: 'empty' })
      return
    }
    res.status(200).json({ available: true, uses: [...names] })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
