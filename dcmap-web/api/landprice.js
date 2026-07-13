/**
 * 토지/자원 부지속성 프록시 — 두 종류를 kind로 다중화(서버리스 함수 수 절약, Hobby 12개 상한).
 *  1) 기본: 개별공시지가 (국토교통부 NSDI, data.go.kr) — 필지(PNU)별 공시지가(원/㎡). 토지축 '지가 부담' 실데이터.
 *  2) kind=water: WAMIS 공업용수 취수능력(시도 집계) — DC 냉각수 확보 여건의 지역 신호(100점 외 참고).
 *  3) kind=kwater: K-water 국가상수도정보 취수·정수 시설용량(㎥/일) 시도 집계 — 냉각수 확보 여건 지역 신호(위치는 시군구까지).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (공시지가 필수) — data.go.kr 인증키(디코딩 키, 공용)
 *  - KWATER_KEY (kind=kwater) — K-water 실시간 수도정보 인증키(data.go.kr). 미설정 시 DATA_GO_KR_KEY 폴백
 *  - LANDPRICE_URL / WATER_URL / KWATER_URL (선택) — 각 엔드포인트 베이스 오버라이드
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
// K-water 국가상수도정보 시설정보(취수/정수/가압) — 시설용량 등 기본정보. 위치는 시군구까지(국가보안).
const KWATER_FCLTY = 'https://apis.data.go.kr/B500001/fcltySvc'

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

// 시도명(전체/약칭) → 약칭 정규화(응답이 '충청북도'·'경상남도' 등 장형일 수 있음)
const SIDO_FULL = [
  [/서울/, '서울'], [/부산/, '부산'], [/대구/, '대구'], [/인천/, '인천'], [/광주/, '광주'],
  [/대전/, '대전'], [/울산/, '울산'], [/세종/, '세종'], [/경기/, '경기'], [/강원/, '강원'],
  [/충청?북|충북/, '충북'], [/충청?남|충남/, '충남'], [/전라?북|전북/, '전북'], [/전라?남|전남/, '전남'],
  [/경상?북|경북/, '경북'], [/경상?남|경남/, '경남'], [/제주/, '제주'],
]
const sidoNorm = (s) => {
  const t = String(s || '').trim()
  for (const [re, nm] of SIDO_FULL) if (re.test(t)) return nm
  return null
}

const totalCountOf = (body) => {
  let n
  const walk = (o, d = 0) => {
    if (!o || typeof o !== 'object' || d > 6 || n != null) return
    for (const [k, v] of Object.entries(o)) {
      if (/totalcount/i.test(k)) { n = num(v); return }
      if (v && typeof v === 'object') walk(v, d + 1)
    }
  }
  walk(body)
  return n
}

// data.go.kr 페이지네이션 수집(최대 cap 페이지)
async function fetchAllItems(url, key, cap = 4) {
  const rows = 1000
  let all = []
  for (let page = 1; page <= cap; page++) {
    const p = new URLSearchParams({ serviceKey: key, _type: 'json', numOfRows: String(rows), pageNo: String(page) })
    const body = await fetchJson(`${url}?${p.toString()}`, 9000)
    if (body?._status) return { error: body._status, items: all }
    const items = findItems(body) || []
    all = all.concat(items)
    const total = totalCountOf(body)
    if (items.length < rows || (total && all.length >= total)) break
  }
  return { items: all }
}

// K-water 국가상수도정보 — 취수·정수 시설용량을 시도별 집계. 위치는 시군구까지(국가보안시설).
// 냉각수 확보 여건의 실데이터 지역 신호(㎥/일). 서버 env 키. 필드명 변형 방어적 픽.
async function kwaterHandler(_req, res) {
  const key = process.env.KWATER_KEY || process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }
  try {
    const base = (process.env.KWATER_URL || KWATER_FCLTY).replace(/\/$/, '')
    // 취수(원수 확보량)·정수(공급 정수량) 시설용량 — DC 냉각수 여건에 직결
    const [itk, cwp] = await Promise.all([
      fetchAllItems(`${base}/getItkFclty`, key), // 취수시설
      fetchAllItems(`${base}/getCwpFclty`, key), // 정수시설
    ])
    if (itk.error && cwp.error) {
      res.status(200).json({ available: false, reason: `upstream_${itk.error}` })
      return
    }
    const CAPA_KEYS = ['fcltyCapa', 'fcltyScale', 'dsnCapa', 'capa', '시설용량', 'facilityCapacity', 'wtrCapa', 'prductCapa']
    const SIDO_KEYS = ['ctpvNm', 'ctprvnNm', 'sidoNm', 'sido', '시도', 'signguCtpv']
    const SGG_KEYS = ['signguNm', 'sigunguNm', 'sggNm', '시군구', 'signgu']
    const bySido = {}
    const add = (items, capField, cntField) => {
      for (const it of items) {
        const sido = sidoNorm(pick(it, SIDO_KEYS)) || sidoOf(pick(it, SGG_KEYS))
        if (!sido) continue
        const cap = num(pick(it, CAPA_KEYS))
        if (!bySido[sido]) bySido[sido] = { 취수용량: 0, 정수용량: 0, 취수N: 0, 정수N: 0 }
        bySido[sido][cntField] += 1
        if (cap != null) bySido[sido][capField] += cap
      }
    }
    add(itk.items, '취수용량', '취수N')
    add(cwp.items, '정수용량', '정수N')
    if (!Object.keys(bySido).length) {
      res.status(200).json({ available: false, reason: 'no_region' })
      return
    }
    res.status(200).json({
      available: true,
      bySido,
      counts: { 취수: itk.items.length, 정수: cwp.items.length },
      source: 'K-water 국가상수도정보 취수·정수시설(data.go.kr)',
    })
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
  const kind = String(req.query?.kind || '')
  if (kind === 'kwater') return kwaterHandler(req, res)
  if (kind === 'water') return waterHandler(req, res)
  return landpriceHandler(req, res)
}
