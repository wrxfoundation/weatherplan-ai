/**
 * 건축HUB 건물에너지정보 프록시 (국토교통부, data.go.kr) — 지번별 전기·가스 사용량.
 * 특정 지번의 실제 전기 사용량(kWh)을 제공 → 지점 분석에서 "이 부지 인근의 실측 전력 소비" 맥락.
 * 단, 단독주택·200세대 미만 공동주택 제외, 산업·발전·열병합 용도 합산 제외(2020.01~).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키, 공용)
 *  - BLDENERGY_URL (선택) — 엔드포인트 베이스 템플릿. {key} 플레이스홀더.
 *
 * 쿼리: sigunguCd, bjdongCd, bun, ji, useYm (필수) — 시군구·법정동·번·지·사용년월(YYYYMM)
 *      kind=elec|gas (기본 elec)
 * 응답: { available, kind, useYm, usage, unit } | { available:false, reason }
 * 정직성: PNU→코드 변환은 클라이언트에서 vworld로 확보 필요. 코드 미제공 시 needs_params.
 */
const BASE = 'https://apis.data.go.kr/1613000/BldEngyHubService'
const OP = { elec: 'getBeElctyUsgInfo', gas: 'getBeGasUsgInfo' }

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')

  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  const { sigunguCd, bjdongCd, bun, ji, useYm, kind = 'elec' } = req.query
  const op = OP[kind] || OP.elec
  if (!sigunguCd || !bjdongCd || !useYm) {
    // 코드 미제공: 클라이언트가 vworld로 PNU/법정동코드를 확보한 뒤 호출해야 함
    res.status(200).json({ available: false, reason: 'needs_params' })
    return
  }

  try {
    const base = (process.env.BLDENERGY_URL || `${BASE}`).replace(/\/$/, '')
    const params = new URLSearchParams({
      serviceKey: key,
      sigunguCd: String(sigunguCd),
      bjdongCd: String(bjdongCd),
      bun: String(bun ?? '0000').padStart(4, '0'),
      ji: String(ji ?? '0000').padStart(4, '0'),
      useYm: String(useYm),
      numOfRows: '12',
      pageNo: '1',
      _type: 'json',
    })
    const url = `${base}/${op}?${params.toString()}`
    const body = await fetchJson(url)
    if (body?._status) {
      res.status(200).json({ available: false, reason: `upstream_${body._status}` })
      return
    }
    const items = findItems(body)
    if (!items || !items.length) {
      res.status(200).json({ available: false, reason: 'no_data' })
      return
    }
    const it = items[0]
    const usage = num(pick(it, ['useQty', 'elctyUseQty', 'gasUseQty', '사용량', 'useAmount']))
    if (usage == null) {
      res.status(200).json({ available: false, reason: 'no_usage_field' })
      return
    }
    res.status(200).json({
      available: true,
      kind,
      useYm: String(pick(it, ['useYm', useYm]) ?? useYm),
      usage,
      unit: kind === 'gas' ? 'MJ' : 'kWh',
      source: '국토부 건축HUB 건물에너지 (data.go.kr)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
