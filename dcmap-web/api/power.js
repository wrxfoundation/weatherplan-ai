/**
 * KPX 전력 데이터 통합 프록시 (data.go.kr B552115) — Vercel Hobby 함수 12개 제한에 맞춰
 * epsis(발전설비)·supply(수급예보)·trading(전력거래실적) 3종을 하나의 함수로 통합.
 * 호출: /api/power?src=epsis | supply | trading
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키, 공용)
 *  - EPSIS_URL / SUPPLY_URL / TRADING_URL (선택) — 각 오퍼레이션 엔드포인트 템플릿({key} 치환)
 *
 * 응답: 소스별 스키마 | { available:false, reason }
 * 정직성: 스키마는 프로덕션 실응답 확인 후 필드 매핑 보정. 미확정 값 미표기.
 */
const DEFAULTS = {
  epsis:
    'https://apis.data.go.kr/B552115/PowerMarketGenInfo/getPowerMarketGenInfo?serviceKey={key}&pageNo=1&numOfRows=1000&dataType=JSON',
  supply:
    'https://apis.data.go.kr/B552115/PwrDmndInfo/getPwrDmndInfo?serviceKey={key}&pageNo=1&numOfRows=48&dataType=JSON',
  trading:
    'https://apis.data.go.kr/B552115/PowerTradingResultInfo1/getPowerTradingResultInfo1?serviceKey={key}&pageNo=1&numOfRows=100&dataType=JSON',
}
const ENV_KEY = { epsis: 'EPSIS_URL', supply: 'SUPPLY_URL', trading: 'TRADING_URL' }
const CACHE = { epsis: 's-maxage=86400, stale-while-revalidate=604800', supply: 's-maxage=300, stale-while-revalidate=3600', trading: 's-maxage=3600, stale-while-revalidate=86400' }

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
  if (/유연탄|무연탄|석탄|화력.*석탄/.test(t)) return '석탄'
  if (/LNG|가스|복합/i.test(t)) return 'LNG'
  if (/해상.*풍력/.test(t)) return '해상풍력'
  if (/양수/.test(t)) return '양수'
  if (/풍력/.test(t)) return '풍력'
  if (/태양/.test(t)) return '태양광'
  if (/수력/.test(t)) return '수력'
  if (/바이오|바이오매스/.test(t)) return '바이오'
  if (/연료전지/.test(t)) return '연료전지'
  if (/집단|열병합/.test(t)) return '집단에너지'
  if (/신재생|기타/.test(t)) return '신재생·기타'
  return t || '기타'
}

// ---- epsis: 발전설비현황(연료원별 설비용량) ----
function handleEpsis(items) {
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
  const byFuel = [...fuelAgg.entries()].map(([fuel, mw]) => ({ fuel, mw: Math.round(mw) })).sort((a, b) => b.mw - a.mw)
  const totalMw = byFuel.reduce((s, f) => s + f.mw, 0)
  if (!byFuel.length && !facilities.length) return { available: false, reason: 'no_capacity_fields' }
  return { available: true, byFuel, facilities: facilities.slice(0, 500), totalMw: totalMw || undefined, count: facilities.length, source: 'EPSIS/KPX 발전설비현황 (data.go.kr)' }
}

// ---- supply: 전력수급예보(공급능력·예비율) ----
function handleSupply(items) {
  const rows = []
  for (const it of items) {
    const at = pick(it, ['예보일자', '기준일시', 'baseDatetime', 'tm', 'fcstDate', 'aplyYmd', 'dateTime'])
    const supplyMw = num(pick(it, ['공급능력', 'supplyCapacity', 'suplAbility', 'supplyPower', '공급능력_MW']))
    const peakMw = num(pick(it, ['최대전력', 'maxPower', 'peakLoad', 'currPwrTot', '수요전력', 'demand']))
    let reserveMw = num(pick(it, ['공급예비력', 'reservePower', 'suplResvPwr', 'reserveMw']))
    let reservePct = num(pick(it, ['공급예비율', 'reserveRate', 'suplResvRate', 'reservePct']))
    if (reserveMw == null && supplyMw != null && peakMw != null) reserveMw = Math.round(supplyMw - peakMw)
    if (reservePct == null && reserveMw != null && peakMw) reservePct = Math.round((reserveMw / peakMw) * 1000) / 10
    if (at == null && supplyMw == null && peakMw == null) continue
    rows.push({ at: at != null ? String(at) : undefined, supplyMw, peakMw, reserveMw, reservePct })
  }
  if (!rows.length) return { available: false, reason: 'no_supply_fields' }
  const latest = rows[rows.length - 1]
  return { available: true, asOf: latest.at, supplyMw: latest.supplyMw, peakMw: latest.peakMw, reserveMw: latest.reserveMw, reservePct: latest.reservePct, rows: rows.slice(-48), source: 'KPX 전력수급예보조회 (data.go.kr)' }
}

// ---- trading: 전력거래실적(연료원별 거래량) ----
function handleTrading(items) {
  const capAgg = new Map()
  const tradeAgg = new Map()
  let asOf
  for (const it of items) {
    asOf = asOf ?? pick(it, ['거래일자', '기준일자', 'baseDate', 'tradeDate', 'aplyDate', 'ymd'])
    const fuel = normFuel(pick(it, ['연료원', 'fuelType', 'fuel', 'energySource', '발전원', '전원구분']))
    const cap = num(pick(it, ['설비용량', 'facilityCapa', 'genCapa', 'capacity']))
    const traded = num(pick(it, ['전력거래량', 'tradeQuantity', 'tradeQty', 'trdQty', 'elecTradeQty', '거래량']))
    if (cap != null) capAgg.set(fuel, (capAgg.get(fuel) || 0) + cap)
    if (traded != null) tradeAgg.set(fuel, (tradeAgg.get(fuel) || 0) + traded)
  }
  const fuels = new Set([...capAgg.keys(), ...tradeAgg.keys()])
  const byFuel = [...fuels]
    .map((fuel) => ({ fuel, capacityMw: capAgg.has(fuel) ? Math.round(capAgg.get(fuel)) : undefined, tradedMwh: tradeAgg.has(fuel) ? Math.round(tradeAgg.get(fuel)) : undefined }))
    .sort((a, b) => (b.tradedMwh ?? b.capacityMw ?? 0) - (a.tradedMwh ?? a.capacityMw ?? 0))
  if (!byFuel.length) return { available: false, reason: 'no_fuel_fields' }
  const totalMwh = byFuel.reduce((s, f) => s + (f.tradedMwh ?? 0), 0)
  return { available: true, asOf: asOf ? String(asOf) : undefined, byFuel, totalMwh: totalMwh || undefined, source: 'KPX 전력거래실적 (data.go.kr)' }
}

const HANDLERS = { epsis: handleEpsis, supply: handleSupply, trading: handleTrading }

export default async function handler(req, res) {
  const src = String(req.query.src || 'epsis')
  if (!HANDLERS[src]) {
    res.status(400).json({ available: false, reason: 'unknown_src' })
    return
  }
  res.setHeader('Cache-Control', CACHE[src])

  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  try {
    const tmpl = process.env[ENV_KEY[src]] || DEFAULTS[src]
    const url = tmpl.replaceAll('{key}', encodeURIComponent(key))
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
    res.status(200).json(HANDLERS[src](items))
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.name || 'error'}` })
  }
}
