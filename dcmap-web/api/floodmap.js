/**
 * 홍수위험지도 정보제공포털 프록시 — 임의 지점의 침수 위험(침수심·위험등급)을 조회.
 * 리스크축(15점)의 "침수 리스크" 항목 소스. 데이터센터에 침수는 치명적이라 우선순위 높음.
 *
 * 소스: data.floodmap.go.kr (국가·지방하천 및 도시침수 홍수위험지도 통계·침수심 조회 API).
 *       키 발급: data.floodmap.go.kr/main/guide/auth_key_issuance
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - FLOODMAP_KEY (필수) — 홍수위험지도 포털 인증키
 *  - FLOODMAP_URL (선택) — 엔드포인트 템플릿. {lat}{lng}{key} 플레이스홀더. 실경로 확정 시 이 env만 수정
 *      (코드 재배포 불필요). 기본값은 포털 침수심 조회 추정 경로.
 *
 * 응답: { available, depthM?, grade?, scenario?, floodType?, scope } | { available:false, reason }
 */
const DEFAULT_URL =
  'https://data.floodmap.go.kr/openapi/floodDepth?lon={lng}&lat={lat}&serviceKey={key}&dataType=JSON'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!r.ok) return { _status: r.status }
    const text = await r.text()
    try {
      return JSON.parse(text)
    } catch {
      return { _status: 'not_json' }
    }
  } finally {
    clearTimeout(t)
  }
}

/* 응답 구조가 포털 버전마다 달라 방어적으로 필드 탐색 */
function pick(obj, names, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined
  for (const n of names) if (obj[n] != null && obj[n] !== '') return obj[n]
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length) {
      const f = pick(v[0], names, depth + 1)
      if (f !== undefined) return f
    } else if (v && typeof v === 'object') {
      const f = pick(v, names, depth + 1)
      if (f !== undefined) return f
    }
  }
  return undefined
}

// 침수심(m) → 위험등급(정성). 포털이 등급을 직접 주면 그걸 우선.
function depthGrade(depthM) {
  if (depthM == null) return undefined
  if (depthM <= 0) return '해당없음'
  if (depthM < 0.5) return '낮음'
  if (depthM < 1.0) return '보통'
  if (depthM < 2.0) return '높음'
  return '매우높음'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.FLOODMAP_KEY
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
    const url = (process.env.FLOODMAP_URL || DEFAULT_URL)
      .replaceAll('{lat}', String(lat))
      .replaceAll('{lng}', String(lng))
      .replaceAll('{key}', encodeURIComponent(key))

    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }

    const depthM = num(pick(body, ['침수심', 'floodDepth', 'depth', 'inundationDepth', 'maxDepth', 'dep']))
    const gradeRaw = pick(body, ['위험등급', 'riskGrade', 'grade', 'dangerLevel', 'level'])
    const floodType = pick(body, ['홍수유형', 'floodType', 'type', 'riverType']) // 하천/도시침수 등
    const scenario = pick(body, ['시나리오', 'scenario', 'freqency', 'frequency', 'returnPeriod']) // 재현빈도

    if (depthM == null && gradeRaw == null) {
      // 조회 지점이 침수구역 밖이면 포털이 빈 결과를 줄 수 있음 → 위험 없음으로 간주(등급 해당없음)
      const hasResult = pick(body, ['resultCode', 'result', 'header', 'body']) !== undefined
      if (hasResult) {
        res.status(200).json({ available: true, depthM: 0, grade: '해당없음', scope: '홍수위험지도 조회(침수구역 외)' })
        return
      }
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }

    res.status(200).json({
      available: true,
      depthM,
      grade: gradeRaw != null ? String(gradeRaw) : depthGrade(depthM),
      floodType: floodType ? String(floodType) : undefined,
      scenario: scenario ? String(scenario) : undefined,
      scope: '홍수위험지도 침수심(포털 조회)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
