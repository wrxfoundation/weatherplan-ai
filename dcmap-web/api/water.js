/**
 * 공업용수 취수능력 프록시 (WAMIS 국가수자원관리종합정보시스템, 한강홍수통제소).
 * 광역·공업용수도 취수장 시설현황 → 시도별 공업용수 취수 시설용량 집계.
 * DC 냉각수(공업용수) 확보 여건의 지역 신호.
 *
 * WAMIS OpenAPI(무료·키 불필요 추정): www.wamis.go.kr:8080/wamis/openapi/wks/wks_wiplsaa_lst
 *  - 응답 항목: addr(위치)·estnm(시설명)·estvol(시설용량)·usg(용도)·wstype(수원종류)·rivnm(취수원)
 * HTTP(8080)라 브라우저 직접 호출 불가(mixed-content) → 서버 프록시 필수.
 * 환경변수(선택): WATER_URL 오버라이드.
 * 응답: { available, bySido:{시도:{m3day,count}}, asOf } | { available:false, reason }
 */
const BASE = 'http://www.wamis.go.kr:8080/wamis/openapi/wks/wks_wiplsaa_lst'

const num = (v) => {
  if (v == null) return undefined
  const n = Number.parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

// 주소 앞부분 → 시도 단축명
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

async function fetchJson(url, ms = 9000) {
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
  if (!obj || typeof obj !== 'object' || depth > 7) return null
  if (Array.isArray(obj)) return obj.length && typeof obj[0] === 'object' ? obj : null
  const std = obj?.wamis?.list ?? obj?.list ?? obj?.response?.body?.items?.item ?? obj?.data ?? obj?.result
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
  try {
    const base = (process.env.WATER_URL || BASE).replace(/\/$/, '')
    const body = await fetchJson(`${base}?output=json`)
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
      // 공업용/광공업 취수만
      if (!/공업/.test(usg)) continue
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
