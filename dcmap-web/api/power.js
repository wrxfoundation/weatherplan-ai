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
  // 전력수급예보: KPX openapi(XML) — 최대예측수요(fcMaxload)·예측예비력(fcReservePwr)
  supply: 'https://openapi.kpx.or.kr/openapi/forecast1dMaxBaseDate/getForecast1dMaxBaseDate?serviceKey={key}',
  trading:
    'https://apis.data.go.kr/B552115/PowerTradingResultInfo1/getPowerTradingResultInfo1?serviceKey={key}&pageNo=1&numOfRows=100&dataType=JSON',
}
const IS_XML = { supply: true } // supply만 XML 응답
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
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)' } })
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

/** 단순 평면 XML(<item>…</item>) → 객체 배열. 태그명은 요청 목록만 추출 */
async function fetchXmlItems(url, tags, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)' } })
    if (!r.ok) return { _status: r.status }
    const xml = await r.text()
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
    const tagVal = (b, tag) => {
      const m = b.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
      return m ? m[1].trim() : undefined
    }
    const items = blocks.map((b) => Object.fromEntries(tags.map((tg) => [tg, tagVal(b, tg)])))
    return { items, _resultCode: (xml.match(/<resultCode>([\s\S]*?)<\/resultCode>/i) || [])[1] }
  } finally {
    clearTimeout(t)
  }
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
    // 실제 EPSIS 필드(확인): pcap 설비용량 · fuel 연료원 · genNm 발전기명 · area 지역 · company 발전사
    const mw = num(pick(it, ['pcap', '설비용량', 'genCapa', 'capacity', 'facilityCapa', 'capa']))
    const name = pick(it, ['genNm', '발전소명', 'genName', 'powerNm', 'plantNm', 'name', '호기명'])
    const fuelRaw = pick(it, ['fuel', '연료원', 'fuelType', 'energySource', 'genSrc', '발전원', '전원'])
    const region = pick(it, ['area', '지역', 'region', '시도', 'sido', '소재지'])
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

// ---- supply: 전력수급예보(KPX XML) — fcMaxload 최대예측수요·fcReservePwr 예측예비력 ----
const SUPPLY_TAGS = ['fcDate', 'fcStime', 'fcEtime', 'fcMaxload', 'fcReservePwr', 'fcLevel']
function handleSupply(items) {
  const rows = []
  for (const it of items) {
    const peakMw = num(it.fcMaxload) // 최대예측수요
    const reserveMw = num(it.fcReservePwr) // 예측예비력
    if (peakMw == null && reserveMw == null) continue
    const supplyMw = peakMw != null && reserveMw != null ? peakMw + reserveMw : undefined
    const reservePct = reserveMw != null && peakMw ? Math.round((reserveMw / peakMw) * 1000) / 10 : undefined
    const at = [it.fcDate, it.fcStime ? `${it.fcStime}시` : ''].filter(Boolean).join(' ')
    rows.push({ at: at || undefined, supplyMw, peakMw, reserveMw, reservePct, level: num(it.fcLevel) })
  }
  if (!rows.length) return { available: false, reason: 'no_supply_fields' }
  const latest = rows[rows.length - 1]
  return { available: true, asOf: latest.at, supplyMw: latest.supplyMw, peakMw: latest.peakMw, reserveMw: latest.reserveMw, reservePct: latest.reservePct, level: latest.level, rows: rows.slice(-48), source: 'KPX 전력수급예보조회' }
}

// ---- trading: 전력거래실적(연료원별 거래량) ----
function handleTrading(items) {
  const capAgg = new Map()
  const tradeAgg = new Map()
  let asOf
  for (const it of items) {
    // 실제 거래실적 필드(확인): pcap 설비용량 · mgo 거래량 · fuel 연료원 · tradeDay 거래일자 · rtotal 합계
    asOf = asOf ?? pick(it, ['tradeDay', '거래일자', '기준일자', 'baseDate', 'tradeDate', 'time'])
    const fuel = normFuel(pick(it, ['fuel', '연료원', 'fuelType', 'energySource', '발전원', '전원구분']))
    const cap = num(pick(it, ['pcap', '설비용량', 'facilityCapa', 'genCapa', 'capacity']))
    const traded = num(pick(it, ['mgo', 'rtotal', '전력거래량', 'tradeQuantity', 'tradeQty', 'trdQty', '거래량']))
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

    // supply는 KPX openapi XML — 별도 파서
    let items
    if (IS_XML[src]) {
      const xr = await fetchXmlItems(url, SUPPLY_TAGS)
      if (xr?._status) {
        res.status(200).json({ available: false, reason: `upstream_${xr._status}` })
        return
      }
      items = xr.items
    } else {
      const body = await fetchJson(url)
      if (body?._status) {
        res.status(200).json({ available: false, reason: `upstream_${body._status}` })
        return
      }
      items = findItems(body)
    }
    if (!items || !items.length) {
      res.status(200).json({ available: false, reason: 'schema_unknown' })
      return
    }
    // 진단: ?debug=1 → 응답 필드명만 노출(값 아님) — no_*_fields 원인 파악용
    if (req.query.debug) {
      res.status(200).json({ available: true, debug: true, src, fieldKeys: Object.keys(items[0] || {}), itemCount: items.length })
      return
    }
    res.status(200).json(HANDLERS[src](items))
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
