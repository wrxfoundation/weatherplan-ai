/**
 * 개별공시지가 프록시 (국토교통부 NSDI, data.go.kr) — 필지(PNU)별 공시지가(원/㎡).
 * 토지축 '지가 부담' 점수화의 실데이터(원/㎡ 절대값).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키, 공용)
 *  - LANDPRICE_URL (선택) — 엔드포인트 베이스 오버라이드
 *
 * 쿼리: pnu (19자리 필지고유번호, 필수) · year (선택, 미지정 시 최신)
 * 응답: { available, pricePerM2, year, pnu } | { available:false, reason }
 * 정직성: PNU는 클라이언트가 vworld 지적도에서 확보. 미제공 시 needs_params.
 */
const BASE = 'https://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/attr/getIndvdLandPriceAttr'

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
    obj?.field ??
    obj?.data
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=2592000')

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
