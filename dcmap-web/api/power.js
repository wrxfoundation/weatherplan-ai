/**
 * KPX 전력 데이터 통합 프록시 (data.go.kr B552115) — Vercel Hobby 함수 12개 제한에 맞춰
 * epsis(발전설비)·supply(수급예보)·trading(전력거래실적)·smp(계통한계가격)를 하나의 함수로 통합.
 * 호출: /api/power?src=epsis | supply | trading | smp
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 통합 인증키(디코딩 키, 공용).
 *    전력수급예보(openapi.kpx.or.kr)도 data.go.kr 통합관리라 같은 키를 쓴다.
 *  - EPSIS_URL / SUPPLY_URL / TRADING_URL (선택) — 각 오퍼레이션 엔드포인트 템플릿({key} 치환)
 *
 * 응답: 소스별 스키마 | { available:false, reason }
 * 정직성: 스키마는 프로덕션 실응답 확인 후 필드 매핑 보정. 미확정 값 미표기.
 */
import http from 'node:http'
import https from 'node:https'
import { promises as dnsp } from 'node:dns'
import { proxyConfigured, proxyGetText } from './_proxy.js'
import { aiHandler } from './_ai.js'
import { leadHandler } from './_lead.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const DEFAULTS = {
  epsis:
    'https://apis.data.go.kr/B552115/PowerMarketGenInfo/getPowerMarketGenInfo?serviceKey={key}&pageNo=1&numOfRows=1000&dataType=JSON',
  // 현재 전력수급(실시간 5분) — 신형 GW API(apis.data.go.kr 경유라 클라우드 차단 없음).
  // 구 openapi.kpx.or.kr 수급예보(XML·IP차단)를 대체 — 공급능력·현재수요·예비력.
  supply:
    'https://apis.data.go.kr/B552115/sukub5mMaxDatetime2/getSukub5mMaxDatetime2?serviceKey={key}&pageNo=1&numOfRows=60&dataType=JSON',
  trading:
    'https://apis.data.go.kr/B552115/PowerTradingResultInfo1/getPowerTradingResultInfo1?serviceKey={key}&pageNo=1&numOfRows=100&dataType=JSON',
  // SMP+수요예측(하루전 발전계획, 23시경 갱신) — 신형 API(자동승인·JSON). 레거시 smp1hToday(XML·심의제한) 대체.
  smp: 'https://apis.data.go.kr/B552115/SmpWithForecastDemand/getSmpWithForecastDemand?serviceKey={key}&pageNo=1&numOfRows=100&dataType=JSON&areaCd=1',
  // 발전원별 발전량 현황(실시간 5분·계통기준) — 실측 발전 믹스(수력~신재생 + PPA/BTM 추정 + 시장수요)
  fuelmix: 'https://apis.data.go.kr/B552115/sumperfuel5m/getSumperfuel5m?serviceKey={key}&pageNo=1&numOfRows=2&dataType=JSON',
}
const IS_XML = {} // 전 소스 신형 JSON API로 전환 — XML 폴백 머신은 env 오버라이드 대비 보존
const ENV_KEY = { epsis: 'EPSIS_URL', supply: 'SUPPLY_URL', trading: 'TRADING_URL', smp: 'SMP_URL', fuelmix: 'FUELMIX_URL' }
const CACHE = {
  epsis: 's-maxage=86400, stale-while-revalidate=604800',
  supply: 's-maxage=300, stale-while-revalidate=3600',
  trading: 's-maxage=3600, stale-while-revalidate=86400',
  smp: 's-maxage=1800, stale-while-revalidate=21600',
  fuelmix: 's-maxage=300, stale-while-revalidate=1800',
}

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchOnce(url, ms) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', 'User-Agent': UA } })
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

// data.go.kr 순간 과부하(429 Too Many Requests / 503)는 짧게 backoff 후 1회 재시도
async function fetchJson(url, ms = 14000) {
  let out = await fetchOnce(url, ms)
  if (out?._status === 429 || out?._status === 503) {
    await new Promise((ok) => setTimeout(ok, 800))
    out = await fetchOnce(url, ms)
  }
  return out
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

/** 평면 XML(<item>…</item>) 텍스트 → { items, _resultCode } */
function parseXmlItems(xml, tags) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
  const tagVal = (b, tag) => {
    const m = b.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
    return m ? m[1].trim() : undefined
  }
  const items = blocks.map((b) => Object.fromEntries(tags.map((tg) => [tg, tagVal(b, tg)])))
  return { items, _resultCode: (xml.match(/<resultCode>([\s\S]*?)<\/resultCode>/i) || [])[1] }
}

async function fetchXmlItems(url, tags, ms = 7000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA } })
    if (!r.ok) return { _status: r.status }
    return parseXmlItems(await r.text(), tags)
  } finally {
    clearTimeout(t)
  }
}

/**
 * IPv4 A레코드로 직결하는 원시 GET. 일부 정부/공사 서버는 IPv6 AAAA가 블랙홀이라
 * undici(전역 fetch)의 happy-eyeballs가 CONNECT_TIMEOUT을 내는데(openapi.kpx.or.kr 케이스),
 * 해석한 IPv4로 직접 붙으면 우회된다. https는 SNI(servername)로 인증서 검증 유지.
 */
async function rawGetText(urlStr, ms = 8000) {
  const u = new URL(urlStr)
  const ips = await dnsp.resolve4(u.hostname)
  if (!ips?.length) throw new Error('no_a_record')
  const isHttps = u.protocol === 'https:'
  const mod = isHttps ? https : http
  const opts = {
    host: ips[0],
    port: u.port || (isHttps ? 443 : 80),
    path: u.pathname + u.search,
    method: 'GET',
    timeout: ms,
    headers: { Host: u.hostname, 'User-Agent': UA, Accept: '*/*', Connection: 'close' },
  }
  if (isHttps) opts.servername = u.hostname
  return await new Promise((resolve, reject) => {
    const req = mod.request(opts, (r) => {
      if (r.statusCode && r.statusCode >= 400) {
        r.resume()
        reject(new Error(`status_${r.statusCode}`))
        return
      }
      let data = ''
      r.setEncoding('utf8')
      r.on('data', (c) => (data += c))
      r.on('end', () => resolve(data))
    })
    req.on('timeout', () => req.destroy(new Error('raw_timeout')))
    req.on('error', reject)
    req.end()
  })
}

/**
 * EPSIS 발전설비 수집 — 단일 페이지(1000행)만. 페이지네이션(다중 페이지)은 대시보드 카드와
 * 상태 프로브가 동시에 EPSIS를 호출하면(둘 다 엣지캐시 미스) data.go.kr 429를 유발했다.
 * 단일 요청으로 부하를 최소화하고, 전체 등록 수(totalCount)는 그대로 노출해 표본임을 정직 표기.
 * (더 넓은 커버리지가 필요하면 EPSIS_URL env의 numOfRows를 키우거나 별도 온디맨드 로드로.)
 */
async function fetchEpsisItems(url) {
  const hasPage = /[?&]pageNo=\d+/.test(url)
  const pageUrl = (n) => url.replace(/([?&]pageNo=)\d+/, `$1${n}`)
  const first = await fetchJson(hasPage ? pageUrl(1) : url, 12000)
  if (first?._status) return { _status: first._status }
  const items = findItems(first) || []
  const total = num(first?.response?.body?.totalCount)
  return { items, total: total ?? items.length }
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

// ---- epsis: 발전설비현황(연료원/구분별 설비용량) ----
function handleEpsis(items, total) {
  const facilities = []
  const fuelAgg = new Map()
  let capRows = 0 // 설비용량(pcap)이 실제로 기재된 행 수 — 커버리지 정직 표기용
  for (const it of items) {
    // 실제 EPSIS 필드(확인): pcap 설비용량 · fuel 연료원/구분 · genNm 발전기명 · area 지역 · company 발전사
    const mw = num(pick(it, ['pcap', '설비용량', 'genCapa', 'capacity', 'facilityCapa', 'capa']))
    const name = pick(it, ['genNm', '발전소명', 'genName', 'powerNm', 'plantNm', 'name', '호기명'])
    const fuelRaw = pick(it, ['fuel', '연료원', 'fuelType', 'energySource', 'genSrc', '발전원', '전원'])
    const region = pick(it, ['area', '지역', 'region', '시도', 'sido', '소재지'])
    if (mw == null && !name) continue
    const fuel = normFuel(fuelRaw)
    if (mw != null) {
      fuelAgg.set(fuel, (fuelAgg.get(fuel) || 0) + mw)
      if (mw > 0) capRows += 1
    }
    if (name) facilities.push({ name: String(name), fuel, mw, region: region ? String(region) : undefined })
  }
  // 0MW·미기재 구분은 표기하지 않는다 — '신재생 0MW'처럼 '측정값 0'으로 오해되는 것을 방지
  // (해당 구분은 이 데이터셋에 설비용량이 기재되지 않았을 뿐, 실제 용량이 0인 것이 아님)
  const byFuel = [...fuelAgg.entries()]
    .map(([fuel, mw]) => ({ fuel, mw: Math.round(mw) }))
    .filter((f) => f.mw > 0)
    .sort((a, b) => b.mw - a.mw)
  const totalMw = byFuel.reduce((s, f) => s + f.mw, 0)
  if (!byFuel.length && !facilities.length) return { available: false, reason: 'no_capacity_fields' }
  return {
    available: true,
    byFuel,
    facilities: facilities.slice(0, 500),
    totalMw: totalMw || undefined,
    count: facilities.length, // 이번에 수집한 설비 수(이름 기준)
    capRows, // 설비용량이 기재된 설비 수
    total: total || undefined, // data.go.kr totalCount(전체 등록 설비 수)
    source: 'EPSIS 전력시장 등록 발전설비 (data.go.kr)',
  }
}

// ---- supply: 현재 전력수급(신형 GW·5분) — 공급능력·현재수요·공급예비력/률.
// 구 XML 수급예보(fc*) 필드도 pick으로 수용(SUPPLY_URL 오버라이드 대비) ----
const SUPPLY_TAGS = ['fcDate', 'fcStime', 'fcEtime', 'fcMaxload', 'fcReservePwr', 'fcLevel']
function handleSupply(items) {
  const rows = []
  for (const it of items) {
    const peakMw = num(pick(it, ['currPwrTot', 'currLoad', 'fcMaxload'])) // 현재(또는 예측최대) 수요
    const supplyCap = num(pick(it, ['suppAbility', 'suppPwr'])) // 공급능력
    let reserveMw = num(pick(it, ['supplyReservePwr', 'operReservePwr', 'fcReservePwr']))
    let reservePct = num(pick(it, ['supplyReserveRate', 'operReserveRate']))
    if (peakMw == null && reserveMw == null && supplyCap == null) continue
    if (reserveMw == null && supplyCap != null && peakMw != null) reserveMw = supplyCap - peakMw
    if (reservePct == null && reserveMw != null && peakMw) reservePct = Math.round((reserveMw / peakMw) * 1000) / 10
    const supplyMw = supplyCap ?? (peakMw != null && reserveMw != null ? peakMw + reserveMw : undefined)
    const at = pick(it, ['baseDatetime', 'baseDate', 'fcDate']) ?? undefined
    rows.push({ at: at ? String(at) : undefined, supplyMw, peakMw, reserveMw, reservePct, level: num(it.fcLevel) })
  }
  if (!rows.length) return { available: false, reason: 'no_supply_fields' }
  const latest = rows[rows.length - 1]
  return { available: true, asOf: latest.at, supplyMw: latest.supplyMw, peakMw: latest.peakMw, reserveMw: latest.reserveMw, reservePct: latest.reservePct, level: latest.level, rows: rows.slice(-48), source: 'KPX 현재 전력수급현황(5분·계통기준)' }
}

// ---- fuelmix: 발전원별 발전량 현황(5분·MW) — 실측 발전 믹스 + PPA/BTM 추정 + 시장수요 ----
const FUEL_NAMES = { fuelPwr1: '수력', fuelPwr2: '유류', fuelPwr3: '유연탄', fuelPwr4: '원자력', fuelPwr5: '양수', fuelPwr6: 'LNG', fuelPwr7: '국내탄', fuelPwr8: '태양광(시장)', fuelPwr9: '풍력', fuelPwr10: '신재생·기타' }
const FUEL_RENEW = new Set(['수력', '태양광(시장)', '풍력', '신재생·기타'])
function handleFuelmix(items) {
  // 최신 행 1개(응답이 최신순인지 불명이라 baseDatetime 최대값 선택, 없으면 첫 행)
  let it = items[0]
  for (const row of items) {
    if (String(pick(row, ['baseDatetime', 'baseDate']) ?? '') > String(pick(it, ['baseDatetime', 'baseDate']) ?? '')) it = row
  }
  const byFuel = []
  let total = 0
  let renew = 0
  for (const [k, fuel] of Object.entries(FUEL_NAMES)) {
    const mw = num(it[k])
    if (mw == null || mw <= 0) continue
    byFuel.push({ fuel, mw: Math.round(mw) })
    total += mw
    if (FUEL_RENEW.has(fuel)) renew += mw
  }
  if (!byFuel.length) return { available: false, reason: 'no_fuel_fields' }
  byFuel.sort((a, b) => b.mw - a.mw)
  const nuclear = byFuel.find((f) => f.fuel === '원자력')?.mw ?? 0
  return {
    available: true,
    asOf: String(pick(it, ['baseDatetime', 'baseDate']) ?? '') || undefined,
    byFuel,
    totalMw: Math.round(total),
    renewPct: Math.round((renew / total) * 100),
    nuclearPct: Math.round((nuclear / total) * 100),
    fossilPct: Math.max(0, 100 - Math.round((renew / total) * 100) - Math.round((nuclear / total) * 100)),
    ppaMw: num(pick(it, ['pEsmw'])), // PPA 추정
    btmMw: num(pick(it, ['bEmsw', 'bEsmw'])), // BTM(자가소비 태양광) 추정 — 스펙 오탈자 대비 둘 다
    demandMw: num(pick(it, ['fuelPwrTot'])),
    source: 'KPX 발전원별 발전량 현황(5분·계통기준, 육지+제주)',
  }
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
    .map((fuel) => {
      const cap = capAgg.has(fuel) ? Math.round(capAgg.get(fuel)) : undefined
      const trd = tradeAgg.has(fuel) ? Math.round(tradeAgg.get(fuel)) : undefined
      // 0/미기재는 undefined로 — '거래 0MWh'가 측정값 0으로 오해되는 것을 방지(EPSIS와 동일 원칙)
      return { fuel, capacityMw: cap > 0 ? cap : undefined, tradedMwh: trd > 0 ? trd : undefined }
    })
    .filter((f) => f.capacityMw != null || f.tradedMwh != null)
    .sort((a, b) => (b.tradedMwh ?? b.capacityMw ?? 0) - (a.tradedMwh ?? a.capacityMw ?? 0))
  if (!byFuel.length) return { available: false, reason: 'no_fuel_fields' }
  const totalMwh = byFuel.reduce((s, f) => s + (f.tradedMwh ?? 0), 0)
  return { available: true, asOf: asOf ? String(asOf) : undefined, byFuel, totalMwh: totalMwh || undefined, source: 'KPX 전력거래실적 (data.go.kr)' }
}

// ---- smp: 계통한계가격 + 수요예측(하루전 발전계획, 시간별) — areaCd 1=육지 · 9=제주 ----
// 신형(SmpWithForecastDemand)·레거시(smp1hToday: tradHour 오탈자 포함) 필드 모두 방어적으로 수용
function handleSmp(items) {
  const rows = []
  let asOf
  for (const it of items) {
    const price = num(pick(it, ['smp', 'smpVal']))
    const hour = num(pick(it, ['tradHour', 'tradeHour', 'hour', 'time']))
    if (price == null || hour == null) continue
    const area = String(it.areaCd ?? '').trim()
    if (area && area !== '1') continue // 육지만 — 제주는 별도 계통(시범사업 가격 상이)
    asOf = asOf ?? pick(it, ['tradeDay', 'baseDate'])
    const demandMw = num(pick(it, ['lfd', 'forecastDemand', 'fcstLoad', 'demand']))
    rows.push(demandMw != null ? { hour, smp: price, demandMw } : { hour, smp: price })
  }
  if (!rows.length) return { available: false, reason: 'no_smp_fields' }
  rows.sort((a, b) => a.hour - b.hour)
  const latest = rows[rows.length - 1]
  const prices = rows.map((r) => r.smp)
  // 단순 산술평균 — KPX 공표 '일 가중평균'(거래량 가중)과 다르므로 라벨에 명시할 것
  const avgSmp = Math.round((prices.reduce((s, v) => s + v, 0) / prices.length) * 10) / 10
  return {
    available: true,
    asOf: asOf ? String(asOf) : undefined,
    latest,
    avgSmp,
    minSmp: Math.min(...prices),
    maxSmp: Math.max(...prices),
    peakDemandMw: rows.some((r) => r.demandMw != null) ? Math.max(...rows.map((r) => r.demandMw ?? 0)) : undefined,
    rows,
    source: 'KPX 계통한계가격·수요예측(하루전 발전계획) — 시간별 · 육지',
  }
}

const HANDLERS = { epsis: handleEpsis, supply: handleSupply, trading: handleTrading, smp: handleSmp, fuelmix: handleFuelmix }
const XML_TAGS = { supply: SUPPLY_TAGS } // 신형 전환으로 기본은 미사용 — env 오버라이드(레거시 XML) 대비 보존

export default async function handler(req, res) {
  const src = String(req.query.src || 'epsis')
  // AI 인텔리전스 프록시 위임 — Hobby 12함수 제한 유지 위해 별도 함수 대신 여기로 멀티플렉싱.
  // (_ai.js는 '_' 접두라 함수 카운트 제외 · POST /api/power?src=ai)
  if (src === 'ai') {
    return aiHandler(req, res)
  }
  // 리드/문의 접수 위임 (POST /api/power?src=lead) — _lead.js도 '_' 접두라 함수 미카운트
  if (src === 'lead') {
    return leadHandler(req, res)
  }
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

    let items
    let epsisTotal
    if (IS_XML[src]) {
      const tags = XML_TAGS[src]
      // supply·smp는 KPX openapi(openapi.kpx.or.kr) XML. 이 레거시 서버는 Vercel에서
      // 간헐 CONNECT_TIMEOUT(IPv6 블랙홀) — 3단 폴백: undici https → IPv4 직결 https → IPv4 직결 http.
      // 전체 마감시한(13s)으로 묶어 상태 프로브(15s)·함수예산(30s) 안에 반드시 반환 — 504 방지.
      const start = Date.now()
      const DEADLINE = 13000
      const remain = () => DEADLINE - (Date.now() - start)
      const httpUrl = url.startsWith('https://') ? url.replace('https://', 'http://') : url
      let xr = null
      let lastErr = null
      // 프록시(UPSTREAM_PROXY_BASE) 설정 시 KR-IP 경유를 최우선 — openapi.kpx.or.kr IP차단 근본 우회.
      if (proxyConfigured()) {
        try {
          xr = parseXmlItems(await proxyGetText(url, Math.min(7000, remain())), tags)
          if (!xr?.items?.length) xr = null
        } catch (e0) {
          lastErr = e0
          xr = null
        }
      }
      try {
        if (!xr) {
          xr = await fetchXmlItems(url, tags, Math.min(6000, remain()))
          if (xr?._status) xr = null
        }
      } catch (e1) {
        lastErr = e1
      }
      if (!xr) {
        for (const u of [url, httpUrl]) {
          if (remain() < 1500) break // 남은 예산 없으면 중단(마감시한 준수)
          try {
            xr = parseXmlItems(await rawGetText(u, Math.min(6000, remain() - 500)), tags)
            if (xr?.items?.length) break
          } catch (e2) {
            lastErr = e2
            xr = null
          }
        }
      }
      if (!xr) {
        res.status(200).json({ available: false, reason: `upstream_${lastErr?.cause?.code || lastErr?.message || lastErr?.name || 'unreachable'}` })
        return
      }
      items = xr.items
    } else if (src === 'epsis') {
      const got = await fetchEpsisItems(url)
      if (got?._status) {
        res.status(200).json({ available: false, reason: `upstream_${got._status}` })
        return
      }
      items = got.items
      epsisTotal = got.total
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
      res.status(200).json({ available: true, debug: true, src, fieldKeys: Object.keys(items[0] || {}), itemCount: items.length, total: epsisTotal })
      return
    }
    res.status(200).json(src === 'epsis' ? handleEpsis(items, epsisTotal) : HANDLERS[src](items))
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}
