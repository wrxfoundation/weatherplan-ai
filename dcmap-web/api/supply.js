/**
 * 전력수급예보조회 프록시 (한국전력거래소/KPX, data.go.kr) — 공급능력·최대전력·공급예비력·예비율.
 * 대시보드 "전력 계통 현황" 라이브 위젯의 공급측 실시간 지표. AIDC 대량 수요가 계통 예비력을
 * 잠식하는 구도를 실측으로 드러내는 근거(전력축 서사).
 *
 * 환경변수 (Vercel — 서버 env 전용, 리포 커밋 절대 금지):
 *  - DATA_GO_KR_KEY (필수) — data.go.kr 인증키(디코딩 키, EPSIS와 공용)
 *  - SUPPLY_URL (선택) — 엔드포인트 템플릿. {key} 플레이스홀더. 데이터셋 오퍼레이션 경로 확정 시
 *      이 env만 수정(코드 재배포 불필요). 기본값은 KPX 전력수급예보 개방 데이터 추정 경로.
 *
 * 응답: { available, asOf?, supplyMw?, peakMw?, reserveMw?, reservePct?, rows? } | { available:false, reason }
 * 정직성: 스키마는 프로덕션에서 실응답 확인 후 필드 매핑 보정. 미확정 값은 표기하지 않음.
 */
// 한국전력거래소_전력수급예보조회 (data.go.kr, B552115) — 예보일자별 공급능력/최대전력/공급예비력/공급예비율
const DEFAULT_URL =
  'https://apis.data.go.kr/B552115/PwrDmndInfo/getPwrDmndInfo?serviceKey={key}&pageNo=1&numOfRows=48&dataType=JSON'

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
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')

  const key = process.env.DATA_GO_KR_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  try {
    const url = (process.env.SUPPLY_URL || DEFAULT_URL).replaceAll('{key}', encodeURIComponent(key))
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

    if (!rows.length) {
      res.status(200).json({ available: false, reason: 'no_supply_fields' })
      return
    }

    const latest = rows[rows.length - 1]
    res.status(200).json({
      available: true,
      asOf: latest.at,
      supplyMw: latest.supplyMw,
      peakMw: latest.peakMw,
      reserveMw: latest.reserveMw,
      reservePct: latest.reservePct,
      rows: rows.slice(-48),
      source: 'KPX 전력수급예보조회 (data.go.kr)',
    })
  } catch {
    res.status(200).json({ available: false, reason: 'upstream_error' })
  }
}
