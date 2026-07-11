/**
 * 연동 현황 진단 — 각 프록시가 필요한 env가 설정됐는지 보고(값은 절대 노출 안 함).
 * 프로덕션에서 무엇이 켜졌는지 UI로 확인하는 용도. 실제 업스트림 성공 여부는 각 기능에서 나타남.
 * ?probe=1 이면 configured 소스에 한해 대표 지점으로 가벼운 실호출을 시도해 available/reason 보고.
 */
const SOURCES = [
  { key: 'weather', label: '케이웨더 기상', env: ['KWEATHER_API_KEY'], path: '/api/weather', point: true, axis: '기상' },
  { key: 'forecast', label: '케이웨더 초단기예보', env: ['KWEATHER_API_KEY'], path: '/api/forecast', point: true, axis: '기상' },
  { key: 'revgeo', label: 'vworld 지번주소', env: ['VWORLD_KEY'], path: '/api/revgeo', point: true, axis: '토지' },
  { key: 'landuse', label: 'vworld 용도지역', env: ['VWORLD_KEY'], path: '/api/landuse', point: true, axis: '토지' },
  { key: 'headroom', label: '한전 계통 여유용량', env: ['KEPCO_API_KEY', 'VWORLD_KEY'], path: '/api/headroom', point: true, axis: '전력' },
  { key: 'epsis', label: 'EPSIS/전력시장 발전설비', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=epsis', point: false, axis: '전력' },
  { key: 'supply', label: 'KPX 전력수급예보', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=supply', point: false, axis: '전력' },
  { key: 'trading', label: 'KPX 전력거래실적', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=trading', point: false, axis: '전력' },
  { key: 'bldenergy', label: '건축HUB 건물에너지', env: ['DATA_GO_KR_KEY'], path: '/api/bldenergy', point: false, axis: '리스크' },
  { key: 'filings', label: 'DART 공시', env: ['DART_API_KEY'], path: '/api/filings', point: false, axis: '시장' },
  { key: 'floodmap', label: '홍수위험지도 침수', env: ['FLOODMAP_KEY'], path: '/api/floodmap', point: true, axis: '리스크' },
  { key: 'sgis', label: 'SGIS 인구격자', env: ['SGIS_KEY', 'SGIS_SECRET'], path: '/api/sgis', point: true, axis: '리스크' },
  { key: 'disaster', label: '재난안전 재해', env: ['DISASTER_KEY', 'VWORLD_KEY'], path: '/api/disaster', point: true, axis: '리스크' },
]
// 대표 지점(서울시청) — probe용
const PROBE = 'lat=37.5665&lng=126.9780'

async function probeOne(base, src) {
  try {
    const url = `${base}${src.path}${src.point ? `?${PROBE}` : ''}`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    const r = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    const body = await r.json().catch(() => ({}))
    return { available: body?.available === true, reason: body?.reason }
  } catch {
    return { available: false, reason: 'probe_error' }
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const has = (k) => Boolean(process.env[k] && String(process.env[k]).trim())
  const list = SOURCES.map((s) => ({ key: s.key, label: s.label, axis: s.axis, configured: s.env.every(has) }))

  if (req.query.probe && String(req.query.probe) !== '0') {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const base = `${proto}://${host}`
    const probed = await Promise.all(
      list.map(async (s) => {
        if (!s.configured) return { ...s, available: false, reason: 'not_configured' }
        const src = SOURCES.find((x) => x.key === s.key)
        const p = await probeOne(base, src)
        return { ...s, ...p }
      }),
    )
    res.status(200).json({ sources: probed, probed: true })
    return
  }

  res.status(200).json({ sources: list, probed: false })
}
