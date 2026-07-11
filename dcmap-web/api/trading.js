/**
 * 전력거래실적 프록시 (한국전력거래소/KPX, data.go.kr) — 일별 연료원별 설비용량·전력거래량.
 * EPSIS(설비용량 정적)와 달리 '실제 거래량(발전 실적)'을 연료원별로 제공 → 대시보드에서 계통의
 * 실제 발전 믹스를 보여주는 공급측 라이브 지표. (값은 수정정산 등으로 변동 가능)
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키, EPSIS/supply와 공용)
 *  - TRADING_URL (선택) — 엔드포인트 템플릿. {key} 플레이스홀더. 오퍼레이션 경로 확정 시 이 env만 수정.
 *
 * 응답: { available, asOf?, byFuel:[{fuel, capacityMw?, tradedMwh?}], totalMwh? } | { available:false, reason }
 * 정직성: 스키마는 프로덕션 실응답 확인 후 필드 매핑 보정. 미확정 값 미표기.
 */
// 한국전력거래소_전력거래실적 (data.go.kr B552115) — 일별 연료원별 설비용량·전력거래량
const DEFAULT_URL =
  'https://apis.data.go.kr/B552115/PowerTradingResultInfo1/getPowerTradingResultInfo1?serviceKey={key}&pageNo=1&numOfRows=100&dataType=JSON'

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

function findItems(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return null
  if (Array.isArray(obj)) return obj.length && typeof obj[0] === 'object' ? obj : null
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

function normFuel(s) {
  const t = String(s || '')
  if (/원자력|원전/.test(t)) return '원자력'
  if (/유연탄|무연탄|석탄/.test(t)) return '석탄'
  if (/LNG|가스|복합/i.test(t)) return 'LNG'
  if (/양수/.test(t)) return '양수'
  if (/수력/.test(t)) return '수력'
  if (/태양/.test(t)) return '태양광'
  if (/풍력/.test(t)) return '풍력'
  if (/바이오/.test(t)) return '바이오'
  if (/연료전지/.test(t)) return '연료전지'
  if (/신재생|기타/.test(t)) return '신재생·기타'
  return t || '기타'
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  try {
    const url = (process.env.TRADING_URL || DEFAULT_URL).replaceAll('{key}', encodeURIComponent(key))
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

    const capAgg = new Map()
    const tradeAgg = new Map()
    let asOf
    for (const it of items) {
      asOf = asOf ?? pick(it, ['거래일자', '기준일자', 'baseDate', 'tradeDate', 'aplyDate', 'ymd'])
      const fuel = normFuel(pick(it, ['연료원', '연료源', 'fuelType', 'fuel', 'energySource', '발전원', '전원구분']))
      const cap = num(pick(it, ['설비용량', 'facilityCapa', 'genCapa', 'capacity']))
      const traded = num(pick(it, ['전력거래량', 'tradeQuantity', 'tradeQty', 'trdQty', 'elecTradeQty', '거래량']))
      if (cap != null) capAgg.set(fuel, (capAgg.get(fuel) || 0) + cap)
      if (traded != null) tradeAgg.set(fuel, (tradeAgg.get(fuel) || 0) + traded)
    }

    const fuels = new Set([...capAgg.keys(), ...tradeAgg.keys()])
    const byFuel = [...fuels]
      .map((fuel) => ({
        fuel,
        capacityMw: capAgg.has(fuel) ? Math.round(capAgg.get(fuel)) : undefined,
        tradedMwh: tradeAgg.has(fuel) ? Math.round(tradeAgg.get(fuel)) : undefined,
      }))
      .sort((a, b) => (b.tradedMwh ?? b.capacityMw ?? 0) - (a.tradedMwh ?? a.capacityMw ?? 0))

    if (!byFuel.length) {
      res.status(200).json({ available: false, reason: 'no_fuel_fields' })
      return
    }

    const totalMwh = byFuel.reduce((s, f) => s + (f.tradedMwh ?? 0), 0)
    res.status(200).json({
      available: true,
      asOf: asOf ? String(asOf) : undefined,
      byFuel,
      totalMwh: totalMwh || undefined,
      source: 'KPX 전력거래실적 (data.go.kr)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
