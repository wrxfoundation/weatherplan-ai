/**
 * DART 전자공시 프록시 — 데이터센터 관련 최근 공시 (D2 이벤트: 투자·착공·설비 신설 등).
 * 사업자 공시는 언론 보도보다 선행하는 1차 출처 — 시드 needs_verify 해소 단서.
 *
 * 소스: opendart.fss.or.kr 공시검색 API (list.json)
 * 환경변수: DART_API_KEY (서버 env 전용, 리포 커밋 금지)
 *
 * 쿼리: ?corp=고유번호(선택) 또는 최근 90일 DC 키워드 공시 스캔.
 * 응답: { available, filings: [{ corp, title, date, url }] } | { available:false }
 *
 * 주의: DART list.json은 corp_code(고유번호) 기반 — 키워드 전문검색 API는 별도(document.xml).
 * v0는 알려진 DC 운영사 corp_code 목록으로 최근 공시를 모아 필터한다.
 */
const num = (v) => {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

// 주요 DC 운영·건설 상장사 DART 고유번호 (corp_code) — 공개 정보. 확장 가능.
const DC_CORPS = {
  '00126380': '삼성전자',
  '00164779': 'SK(주)',
  '00266961': 'LG유플러스',
  '00164742': 'KT',
  '01515323': '네이버',
  '00258999': '카카오',
  '00113058': 'GS',
}

const DC_KEYWORDS = /(데이터센터|데이터\s*센터|IDC|전산센터|AI\s*데이터|하이퍼스케일)/

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-InfraMap/1.0; +https://aidatacenter.vercel.app)' } })
    if (!r.ok) return { _status: r.status }
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

function ymd(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  const key = process.env.DART_API_KEY
  if (!key) {
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  // 최근 N일 (기본 90) — 프로덕션에서 new Date() 사용 가능 (엣지/서버리스 런타임)
  const days = Math.min(180, Math.max(7, num(req.query.days) ?? 90))
  const end = new Date()
  const begin = new Date(end.getTime() - days * 86400_000)

  try {
    const perCorp = await Promise.all(
      Object.entries(DC_CORPS).map(async ([corp, name]) => {
        const url =
          `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}` +
          `&corp_code=${corp}&bgn_de=${ymd(begin)}&end_de=${ymd(end)}&page_count=100`
        const body = await fetchJson(url)
        if (body?.status !== '000' || !Array.isArray(body.list)) return []
        return body.list
          .filter((it) => DC_KEYWORDS.test(it.report_nm ?? ''))
          .map((it) => ({
            corp: name,
            title: it.report_nm,
            date: it.rcept_dt,
            url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${it.rcept_no}`,
          }))
      }),
    )
    const filings = perCorp.flat().sort((a, b) => (a.date < b.date ? 1 : -1))
    if (!filings.length) {
      res.status(200).json({ available: false, reason: 'no_recent_dc_filings' })
      return
    }
    res.status(200).json({ available: true, filings: filings.slice(0, 20), window_days: days })
  } catch (e) {
    res.status(200).json({ available: false, reason: `upstream_${e?.name || 'error'}` })
  }
}
