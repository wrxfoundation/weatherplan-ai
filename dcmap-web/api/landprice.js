/**
 * 토지/자원 부지속성 프록시 — 두 종류를 kind로 다중화(서버리스 함수 수 절약, Hobby 12개 상한).
 *  1) 기본: 개별공시지가 (국토교통부 NSDI, data.go.kr) — 필지(PNU)별 공시지가(원/㎡). 토지축 '지가 부담' 실데이터.
 *  2) kind=water: WAMIS 공업용수 취수능력(시도 집계) — DC 냉각수 확보 여건의 지역 신호(100점 외 참고).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (공시지가 필수) — data.go.kr 인증키(디코딩 키, 공용)
 *  - LANDPRICE_URL (선택) — 공시지가 엔드포인트 베이스 오버라이드
 *  - WATER_URL (선택) — WAMIS 엔드포인트 베이스 오버라이드
 *
 * 공시지가 쿼리: pnu (19자리 필지고유번호, 필수) · year (선택, 미지정 시 최신)
 *  응답: { available, pricePerM2, year, pnu } | { available:false, reason }
 * 용수 쿼리: kind=water
 *  응답: { available, bySido:{시도:{m3day,count}}, source } | { available:false, reason }
 * 정직성: PNU는 클라이언트가 vworld 지적도에서 확보. 미제공 시 needs_params. WAMIS 미도달 시 정직히 대기.
 */
const BASE = 'https://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/attr/getIndvdLandPriceAttr'
// WAMIS 광역·공업용수도 취수장 시설현황(한강홍수통제소). HTTP(8080)라 서버 프록시 필수(mixed-content).
const WATER_BASE = 'http://www.wamis.go.kr:8080/wamis/openapi/wks/wks_wiplsaa_lst'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' },
    })
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
  if (!obj || typeof obj !== 'object' || depth > 7) return null
  if (Array.isArray(obj)) return obj.length && typeof obj[0] === 'object' ? obj : null
  const std =
    obj?.response?.body?.items?.item ??
    obj?.body?.items?.item ??
    obj?.items?.item ??
    obj?.indvdLandPrices?.field ??
    obj?.wamis?.list ??
    obj?.list ??
    obj?.field ??
    obj?.data ??
    obj?.result
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

// 주소 앞부분 → 시도 단축명(용수 집계용)
const SIDO_MAP = [
  [/^서울/, '서울'], [/^부산/, '부산'], [/^대구/, '대구'], [/^인천/, '인천'], [/^광주/, '광주'],
  [/^대전/, '대전'], [/^울산/, '울산'], [/^세종/, '세종'], [/^경기/, '경기'], [/^강원/, '강원'],
  [/^충청?북/, '충북'], [/^충청?남/, '충남'], [/^전라?북|^전북/, '전북'], [/^전라?남|^전남/, '전남'],
  [/^경상?북|^경북/, '경북'], [/^경상?남|^경남/, '경남'], [/^제주/, '제주'],
]
const sidoOf = (addr) => {
  const s = String(addr || '').trim()
  for (const [re, nm] of SIDO_MAP) if (re.test(s)) return nm
  return null
}

// WAMIS 공업용수 취수 시설용량 시도 집계
async function waterHandler(_req, res) {
  try {
    const base = (process.env.WATER_URL || WATER_BASE).replace(/\/$/, '')
    const body = await fetchJson(`${base}?output=json`, 9000)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const items = findItems(body)
    if (!items || !items.length) {
      res.status(200).json({ available: false, reason: 'no_data' })
      return
    }
    const bySido = {}
    for (const it of items) {
      const usg = String(pick(it, ['usg', '용도']) ?? '')
      if (!/공업/.test(usg)) continue // 공업용/광공업 취수만
      const sido = sidoOf(pick(it, ['addr', '위치']))
      const vol = num(pick(it, ['estvol', '시설용량']))
      if (!sido || vol == null) continue
      if (!bySido[sido]) bySido[sido] = { m3day: 0, count: 0 }
      bySido[sido].m3day += vol
      bySido[sido].count += 1
    }
    if (!Object.keys(bySido).length) {
      res.status(200).json({ available: false, reason: 'no_industrial' })
      return
    }
    res.status(200).json({ available: true, bySido, source: 'WAMIS 광역·공업용수도 취수장 시설현황(한강홍수통제소)' })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}

// 개별공시지가(원/㎡) — PNU 기준
async function landpriceHandler(req, res) {
  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const { pnu, year } = req.query
  if (!pnu || String(pnu).length < 10) {
    res.status(200).json({ available: false, reason: 'needs_params' })
    return
  }

  try {
    const base = (process.env.LANDPRICE_URL || BASE).replace(/\/$/, '')
    const params = new URLSearchParams({
      serviceKey: key,
      pnu: String(pnu),
      format: 'json',
      numOfRows: '10',
      pageNo: '1',
    })
    if (year) params.set('stdrYear', String(year))
    const body = await fetchJson(`${base}?${params.toString()}`)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const items = findItems(body)
    if (!items || !items.length) {
      res.status(200).json({ available: false, reason: 'no_data' })
      return
    }
    // 최신 연도 우선(공시지가 필드명 변형 대응)
    const withYear = items
      .map((it) => ({ it, yr: num(pick(it, ['stdrYear', 'stdr_year', '기준연도', 'baseYear'])) ?? 0 }))
      .sort((a, b) => b.yr - a.yr)
    const top = withYear[0].it
    const price = num(pick(top, ['pblntfPclnd', 'pclnd', 'indvdLandPrice', 'individualLandPrice', '개별공시지가', 'price', 'lndpclPc']))
    if (price == null || price <= 0) {
      res.status(200).json({ available: false, reason: 'no_price_field' })
      return
    }
    res.status(200).json({
      available: true,
      pricePerM2: Math.round(price),
      year: withYear[0].yr || null,
      pnu: String(pnu),
      source: '국토교통부 개별공시지가 (data.go.kr NSDI)',
    })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.cause?.code || e?.name || 'error'}` })
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=2592000')
  if (String(req.query?.kind || '') === 'water') return waterHandler(req, res)
  return landpriceHandler(req, res)
}
