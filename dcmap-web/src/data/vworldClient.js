// 클라이언트(브라우저) 직접 vworld 호출 — Vercel 서버리스 IP는 vworld가 차단(502/소켓리셋)하지만
// 브라우저는 사용자 IP + 도메인 등록키(Referer 검증)라 vworld가 허용한다(= vworld 본래 사용 방식).
//
// 활성 조건: VITE_VWORLD_KEY(브라우저 노출 env)가 설정된 경우에만. 이 키는 반드시 vworld 콘솔에서
//   '도메인 등록'된 키여야 하며(등록 도메인 외에선 무효), 그래서 브라우저 노출이 안전하다.
//   미설정 시 이 모듈은 비활성 → liveApi가 기존 /api 프록시로 폴백.
// 키는 리포에 커밋하지 않는다(Vercel 환경변수 VITE_VWORLD_KEY로만).

const KEY = import.meta.env.VITE_VWORLD_KEY
export const hasVworldClient = () => Boolean(KEY)

async function vworldReq(path, params) {
  const qs = new URLSearchParams({ ...params, key: KEY, format: 'json' }).toString()
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(`https://api.vworld.kr/req/${path}?${qs}`, { signal: ctrl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** 포워드 지오코딩: 주소 → { available, lat, lng, matched, matchType } | null */
export async function geocodeClient(query) {
  const q = String(query || '').trim()
  if (!q) return null
  for (const type of ['PARCEL', 'ROAD']) {
    const body = await vworldReq('address', {
      service: 'address',
      request: 'getcoord',
      version: '2.0',
      crs: 'epsg:4326',
      address: q,
      type,
    })
    if (body?.response?.status !== 'OK') continue
    const pt = body.response.result?.point
    const x = Number.parseFloat(pt?.x)
    const y = Number.parseFloat(pt?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y) || y < 32 || y > 40 || x < 123 || x > 132) continue
    return { available: true, lat: y, lng: x, matched: body.response.refined?.text || q, matchType: type === 'PARCEL' ? '지번' : '도로명' }
  }
  return null
}

/** 리버스 지오코딩: 좌표 → { available, parcel, road, legalCode, sigunguCd, bjdongCd, bun, ji } | null */
export async function revgeoClient(lat, lng) {
  const body = await vworldReq('address', {
    service: 'address',
    request: 'getAddress',
    version: '2.0',
    crs: 'epsg:4326',
    point: `${lng},${lat}`,
    type: 'both',
    zipcode: 'false',
    simple: 'false',
  })
  if (body?.response?.status !== 'OK') return null
  let parcel
  let road
  let legalCode
  let bun
  let ji
  for (const item of body.response.result ?? []) {
    if (item.type === 'parcel') {
      parcel = item.text
      const s = item.structure
      if (s?.level4LC && /^\d{10}$/.test(s.level4LC)) legalCode = s.level4LC
      const m = String(s?.level5 ?? '').trim().match(/^(\d+)(?:-(\d+))?/)
      if (m) {
        bun = m[1].padStart(4, '0')
        ji = (m[2] ?? '0').padStart(4, '0')
      }
    }
    if (item.type === 'road') road = item.text
  }
  const codes = legalCode ? { legalCode, sigunguCd: legalCode.slice(0, 5), bjdongCd: legalCode.slice(5), bun, ji } : {}
  return { available: true, parcel, road, ...codes }
}

/** 용도지역: 좌표 → { available, uses:string[] } | null */
export async function landUseClient(lat, lng) {
  const body = await vworldReq('data', {
    service: 'data',
    version: '2.0',
    request: 'GetFeature',
    data: 'LT_C_UQ111',
    geomFilter: `POINT(${lng} ${lat})`,
    size: '5',
    page: '1',
  })
  if (body?.response?.status !== 'OK') return null
  const names = new Set()
  const walk = (o) => {
    if (!o || typeof o !== 'object') return
    for (const v of Object.values(o)) {
      if (typeof v === 'string' && /(지역|지구|구역)$/.test(v) && v.length <= 30) names.add(v)
      else if (v && typeof v === 'object') walk(v)
    }
  }
  walk(body.response.result)
  return names.size ? { available: true, uses: [...names] } : null
}
