/* 입지 배제 오버레이 엔진 — 5축 밖 '법적 건축가능성'(GO/NO-GO) 판정.
 *
 * 정직성 원칙: 공개 GIS 폴리곤(그린벨트·군사·공항 고도제한·상수원·문화재)이 있어야
 * "이 부지 저촉"을 말할 수 있다. 폴리곤 데이터가 없으면 status='pending'(데이터 대기)로
 * 반환하고, 저촉 여부를 절대 지어내지 않는다.
 *
 * 데이터 주입: 배포측에서 scripts/fetch-exclusions.mjs 로 data/exclusions/layers/<key>.json
 * (표준 GeoJSON FeatureCollection, properties.name 권장)을 채우면 빌드에 번들되어 자동 활성화.
 * 이 샌드박스는 토지이음/브이월드/data.go.kr outbound가 차단돼 여기서 수집 불가(배포측 전용). */

export const EXCLUSION_LAYERS = [
  { key: 'greenbelt', ko: '개발제한구역(그린벨트)', en: 'Greenbelt (development-restricted)', kind: 'block', source: '국토교통부·브이월드' },
  { key: 'military', ko: '군사시설보호구역', en: 'Military protection zone', kind: 'restrict', source: '국방부·토지이음' },
  { key: 'airport_height', ko: '공항 고도제한(장애물제한표면)', en: 'Airport obstacle-limitation surface', kind: 'restrict', source: '국토교통부·한국공항공사' },
  { key: 'water_source', ko: '상수원보호구역', en: 'Water-source protection area', kind: 'block', source: '환경부' },
  { key: 'heritage', ko: '문화재보호구역·매장문화재 유존지역', en: 'Cultural-heritage / buried-relic area', kind: 'restrict', source: '국가유산청' },
]

const LAYER_KEYS = new Set(EXCLUSION_LAYERS.map((l) => l.key))

// 존재하는 GeoJSON만 번들 로드(없으면 빈 객체 → 전부 pending). 파일 없을 때도 안전.
const files = import.meta.glob('../../data/exclusions/layers/*.json', { eager: true })
const LAYER_DATA = {}
for (const path in files) {
  const m = path.match(/\/([a-z_]+)\.json$/)
  if (m && LAYER_KEYS.has(m[1])) LAYER_DATA[m[1]] = files[path].default ?? files[path]
}

function pointInRing(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygon(lng, lat, rings) {
  if (!rings || !rings.length || !pointInRing(lng, lat, rings[0])) return false
  for (let k = 1; k < rings.length; k++) if (pointInRing(lng, lat, rings[k])) return false // 구멍(hole)
  return true
}

function hitGeometry(lng, lat, geom) {
  if (!geom) return false
  if (geom.type === 'Polygon') return pointInPolygon(lng, lat, geom.coordinates)
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((poly) => pointInPolygon(lng, lat, poly))
  return false
}

/* 해당 레이어의 폴리곤 데이터가 실제로 있는지 */
export function hasExclusionData(key) {
  const fc = LAYER_DATA[key]
  return !!(fc && Array.isArray(fc.features) && fc.features.length)
}

export function anyExclusionData() {
  return EXCLUSION_LAYERS.some((l) => hasExclusionData(l.key))
}

/* 데이터가 있는 레이어의 FeatureCollection(맵 렌더용). 없으면 null. */
export function exclusionFeatureCollection(key) {
  return hasExclusionData(key) ? LAYER_DATA[key] : null
}

/* 지점 판정 — [{key,ko,en,kind,source,status:'hit'|'clear'|'pending',name?}] */
export function checkExclusions({ lat, lng }) {
  return EXCLUSION_LAYERS.map((L) => {
    if (!hasExclusionData(L.key)) return { ...L, status: 'pending' }
    let name = null
    for (const f of LAYER_DATA[L.key].features) {
      if (hitGeometry(lng, lat, f.geometry)) {
        name = f.properties?.name ?? f.properties?.NAME ?? f.properties?.보호구역명 ?? true
        break
      }
    }
    return { ...L, status: name ? 'hit' : 'clear', name: typeof name === 'string' ? name : undefined }
  })
}

/* 종합 판정 — verdict: 'no-go'(block 저촉) | 'restrict'(restrict 저촉) | 'go'(전부 clear) | 'pending'(데이터 대기) */
export function exclusionSummary(results) {
  const hit = results.filter((r) => r.status === 'hit')
  const pending = results.filter((r) => r.status === 'pending')
  const blocked = hit.some((r) => r.kind === 'block')
  const verdict = blocked ? 'no-go' : hit.length ? 'restrict' : pending.length === results.length ? 'pending' : pending.length ? 'partial' : 'go'
  return { blocked, hit, pending, verdict }
}
