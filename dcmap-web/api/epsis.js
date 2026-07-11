/**
 * EPSIS(전력통계정보시스템, KPX) 발전설비현황 프록시 — 발전소/연료원별 설비용량(MW)을 끌어와
 * 발전소 레이어의 capacity_mw 공백(현재 null)과 집단에너지 좌표 공백을 정합시키는 공급측 소스.
 *
 * 실소스: KPX가 data.go.kr에 개방한 발전설비 정보(연료원별·발전소별 설비용량). EPSIS 웹은 무인증
 *        열람이나 프로그램 접근은 data.go.kr 인증키를 쓴다(개방포털 키와 별개).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키)
 *  - EPSIS_URL (선택) — 엔드포인트 템플릿. {key} 플레이스홀더. 데이터셋 경로 확정 시 이 env만 수정
 *      (코드 재배포 불필요). 기본값은 KPX 발전설비 개방 데이터 추정 경로.
 *  - EPSIS_FUEL_URL (선택) — 연료원별 설비용량 별도 엔드포인트가 있으면.
 *
 * 응답: { available, byFuel?: [{fuel, mw}], facilities?: [{name, fuel, mw, region}], totalMw?, asOf? }
 *       | { available:false, reason }
 */
const DEFAULT_URL =
  'https://apis.data.go.kr/B552115/GnrtElecGenInfoInqireSvc/getRegionGenInfo?serviceKey={key}&pageNo=1&numOfRows=1000&dataType=JSON'

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
      return { _status: 'not_json', _raw: text.slice(0, 200) }
    }
  } finally {
    clearTimeout(t)
  }
}

/* 응답 구조가 포털 버전마다 달라 items 배열을 방어적으로 탐색 */
function findItems(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return null
  if (Array.isArray(obj)) return obj.length && typeof obj[0] === 'object' ? obj : null
  // OpenAPI 표준: response.body.items.item
  const std = obj?.response?.body?.items?.item ?? obj?.body?.items?.item ?? obj?.items?.item ?? obj?.data
  if (Array.isArray(std)) return std
  if (std && typeof std === 'object') return [std]
  for (const v of Object.values(obj)) {
    const found = findItems(v, depth + 1)
    if (found) return found
  }
  return null
}

const pick = (o, names) => {
  for (const n of names) if (o?.[n] != null && o[n] !== '') return o[n]
  return undefined
}

// 연료원 정규화 (EPSIS/KPX 표기 흡수)
function normFuel(s) {
  const t = String(s || '')
  if (/원자력|원전/.test(t)) return '원자력'
  if (/유연탄|무연탄|석탄|화력.*석탄/.test(t)) return '석탄'
  if (/LNG|가스|복합/i.test(t)) return 'LNG'
  if (/해상.*풍력/.test(t)) return '해상풍력'
  if (/풍력/.test(t)) return '풍력'
  if (/태양/.test(t)) return '태양광'
  if (/수력|양수/.test(t)) return '수력'
  if (/바이오|바이오매스/.test(t)) return '바이오'
  if (/연료전지/.test(t)) return '연료전지'
  if (/집단|열병합/.test(t)) return '집단에너지'
  return t || '기타'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  try {
    const url = (process.env.EPSIS_URL || DEFAULT_URL).replaceAll('{key}', encodeURIComponent(key))
    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const items = findItems(body)
    if (!items || !items.length) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }

    // 발전소/설비 리스트 방어적 매핑
    const facilities = []
    const fuelAgg = new Map()
    for (const it of items) {
      const mw = num(pick(it, ['설비용량', 'genCapa', 'capacity', 'facilityCapa', 'capa', '설비용량_MW']))
      const name = pick(it, ['발전소명', 'genName', 'powerNm', 'plantNm', 'name', '호기명'])
      const fuelRaw = pick(it, ['연료원', 'fuelType', 'fuel', 'energySource', '발전원', '전원'])
      const region = pick(it, ['지역', 'region', 'area', '시도', 'sido', '소재지'])
      if (mw == null && !name) continue
      const fuel = normFuel(fuelRaw)
      if (mw != null) fuelAgg.set(fuel, (fuelAgg.get(fuel) || 0) + mw)
      if (name) facilities.push({ name: String(name), fuel, mw, region: region ? String(region) : undefined })
    }

    const byFuel = [...fuelAgg.entries()]
      .map(([fuel, mw]) => ({ fuel, mw: Math.round(mw) }))
      .sort((a, b) => b.mw - a.mw)
    const totalMw = byFuel.reduce((s, f) => s + f.mw, 0)

    if (!byFuel.length && !facilities.length) {
      res.status(200).json({ available: false, reason: 'no_capacity_fields' })
      return
    }

    res.status(200).json({
      available: true,
      byFuel,
      facilities: facilities.slice(0, 500),
      totalMw: totalMw || undefined,
      count: facilities.length,
      source: 'EPSIS/KPX 발전설비현황 (data.go.kr)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
