// 클라이언트(브라우저) 직접 vworld 호출 — Vercel 서버리스 IP는 vworld가 차단(502/소켓리셋)하지만
// 브라우저는 사용자 IP + 도메인 등록키(Referer 검증)라 vworld가 허용한다(= vworld 본래 사용 방식).
//
// ⚠️ vworld REST API(api.vworld.kr/req/*)는 CORS 헤더를 주지 않아 브라우저 fetch가 차단된다.
//    → **JSONP**(callback= 파라미터, <script> 주입)로 호출한다. vworld가 공식 지원하는 크로스도메인 방식.
//
// 활성 조건: VITE_VWORLD_KEY(브라우저 노출 env, 도메인 등록키)가 설정된 경우에만. 미설정 시 비활성.
// 키는 리포에 커밋하지 않는다(Vercel 환경변수 VITE_VWORLD_KEY로만).

const KEY = import.meta.env.VITE_VWORLD_KEY
export const hasVworldClient = () => Boolean(KEY)

let seq = 0
// JSONP: <script>로 vworld를 호출해 CORS를 우회. callback으로 결과 수신.
function jsonp(url, ms = 9000) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('no_document'))
    const cb = `__vw_${Date.now()}_${seq++}`
    const script = document.createElement('script')
    let done = false
    const cleanup = () => {
      done = true
      clearTimeout(timer)
      try {
        delete window[cb]
      } catch {
        window[cb] = undefined
      }
      script.remove()
    }
    const timer = setTimeout(() => {
      if (!done) {
        cleanup()
        reject(new Error('timeout'))
      }
    }, ms)
    window[cb] = (data) => {
      if (done) return
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      if (done) return
      cleanup()
      reject(new Error('script_error'))
    }
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${cb}`
    document.head.appendChild(script)
  })
}

async function vworldReq(path, params) {
  const qs = new URLSearchParams({ ...params, key: KEY, format: 'json' }).toString()
  try {
    return await jsonp(`https://api.vworld.kr/req/${path}?${qs}`)
  } catch {
    return null
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

// 지오메트리(Polygon/MultiPolygon) → 근사 면적(㎡). 로컬 등거투영 후 신발끈 공식.
function polygonAreaM2(geom) {
  if (!geom) return 0
  const rings =
    geom.type === 'MultiPolygon' ? geom.coordinates.flat() : geom.type === 'Polygon' ? geom.coordinates : []
  let total = 0
  for (const ring of rings) {
    if (!ring || ring.length < 4) continue
    const lat0 = (ring[0][1] * Math.PI) / 180
    const mLat = 111132
    const mLng = 111320 * Math.cos(lat0)
    let a = 0
    for (let i = 0; i < ring.length - 1; i++) {
      const x1 = ring[i][0] * mLng
      const y1 = ring[i][1] * mLat
      const x2 = ring[i + 1][0] * mLng
      const y2 = ring[i + 1][1] * mLat
      a += x1 * y2 - x2 * y1
    }
    total += Math.abs(a / 2)
  }
  return total
}

/** vworld 연속지적도(LP_PA_CBND_BUBUN) — 클릭 지점 파셀 면적(㎡). { available, areaM2, jibun } | null */
export async function parcelAreaClient(lat, lng) {
  const body = await vworldReq('data', {
    service: 'data',
    version: '2.0',
    request: 'GetFeature',
    data: 'LP_PA_CBND_BUBUN',
    geomFilter: `POINT(${lng} ${lat})`,
    geometry: 'true',
    attribute: 'true',
    size: '1',
    page: '1',
  })
  if (body?.response?.status !== 'OK') return null
  const feat = body.response.result?.featureCollection?.features?.[0]
  if (!feat) return null
  const props = feat.properties || {}
  let area = Number(props.lndpcl_ar ?? props.area ?? props.AREA ?? props.ar)
  if (!Number.isFinite(area) || area <= 0) area = polygonAreaM2(feat.geometry)
  const jibun = props.addr || props.jibun || props.bon_bun || null
  return Number.isFinite(area) && area > 0 ? { available: true, areaM2: Math.round(area), jibun } : null
}
