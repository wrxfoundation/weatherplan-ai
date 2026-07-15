/**
 * 연동 현황 진단 — 각 프록시가 필요한 env가 설정됐는지 보고(값은 절대 노출 안 함).
 * 프로덕션에서 무엇이 켜졌는지 UI로 확인하는 용도. 실제 업스트림 성공 여부는 각 기능에서 나타남.
 * ?probe=1 이면 configured 소스에 한해 대표 지점으로 가벼운 실호출을 시도해 available/reason 보고.
 */
const SOURCES = [
  { key: 'weather', label: '케이웨더 오늘예보', env: ['KWEATHER_API_KEY'], path: '/api/kweather?kind=current', point: true, axis: '기상' },
  { key: 'forecast', label: '케이웨더 3일예보', env: ['KWEATHER_API_KEY'], path: '/api/kweather?kind=forecast', point: true, axis: '기상' },
  { key: 'revgeo', label: 'vworld 지번주소', env: ['VWORLD_KEY'], path: '/api/revgeo', point: true, axis: '토지' },
  { key: 'landuse', label: 'vworld 용도지역', env: ['VWORLD_KEY'], path: '/api/landuse', point: true, axis: '토지' },
  { key: 'headroom', label: '한전 계통 여유용량', env: ['KEPCO_API_KEY'], path: '/api/headroom?metroCd=11', point: true, axis: '전력' },
  { key: 'epsis', label: 'EPSIS/전력시장 발전설비', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=epsis', point: false, axis: '전력' },
  { key: 'supply', label: 'KPX 현재 전력수급(5분)', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=supply', point: false, axis: '전력' },
  { key: 'trading', label: 'KPX 전력거래실적', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=trading', point: false, axis: '전력' },
  { key: 'smp', label: 'KPX 계통한계가격·수요예측', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=smp', point: false, axis: '전력' },
  { key: 'fuelmix', label: 'KPX 발전원별 발전량(5분)', env: ['DATA_GO_KR_KEY'], path: '/api/power?src=fuelmix', point: false, axis: '전력' },
  // probe는 실지번(강남구 삼성동 159, 무역센터)으로 엔드투엔드 검사 — needs_params 오탐 방지
  { key: 'bldenergy', label: '건축HUB 건물에너지', env: ['DATA_GO_KR_KEY'], path: '/api/bldenergy?kind=elec&sigunguCd=11680&bjdongCd=10500&bun=0159&ji=0000&useYm=202503', point: false, axis: '리스크' },
  { key: 'filings', label: 'DART 공시', env: ['DART_API_KEY'], path: '/api/filings', point: false, axis: '시장' },
  { key: 'floodmap', label: '침수 위험(SGIS 홍수위험지도)', env: ['SGIS_KEY', 'SGIS_SECRET'], path: '/api/sgis?kind=flood', point: true, axis: '리스크' },
  { key: 'sgis', label: 'SGIS 인구', env: ['SGIS_KEY', 'SGIS_SECRET'], path: '/api/sgis', point: true, axis: '리스크' },
  { key: 'disaster', label: '산사태 위험(SGIS 산사태위험지도)', env: ['SGIS_KEY', 'SGIS_SECRET'], path: '/api/sgis?kind=landslide', point: true, axis: '리스크' },
]
// 대표 지점(서울시청) — probe용
const PROBE = 'lat=37.5665&lng=126.9780'

async function probeOne(base, src, ms) {
  try {
    const sep = src.path.includes('?') ? '&' : '?'
    const url = `${base}${src.path}${src.point ? `${sep}${PROBE}` : ''}`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } })
    clearTimeout(t)
    const body = await r.json().catch(() => ({}))
    return { available: body?.available === true, reason: body?.reason }
  } catch (e) {
    return { available: false, reason: e?.name === 'AbortError' ? 'probe_timeout' : 'probe_error' }
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
    // 병렬 발사(전체 소요 = 가장 느린 단일 프로브 ≤15s < 30s)하되, 소스마다 조금씩 지연 발사(stagger).
    // 동시에 다 쏘면 data.go.kr 계열(epsis/trading/bldenergy)이 순간 과부하로 429가 나므로.
    const PER_PROBE_MS = 15000
    const probed = await Promise.all(
      list.map(async (s, i) => {
        if (!s.configured) return { ...s, available: false, reason: 'not_configured' }
        await new Promise((ok) => setTimeout(ok, i * 130)) // 계단식 발사로 순간 동시 호출 완화
        const src = SOURCES.find((x) => x.key === s.key)
        const p = await probeOne(base, src, PER_PROBE_MS)
        return { ...s, ...p }
      }),
    )
    res.status(200).json({ sources: probed, probed: true })
    return
  }

  res.status(200).json({ sources: list, probed: false })
}
