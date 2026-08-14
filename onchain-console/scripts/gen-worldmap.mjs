// 오픈맵 데이터(world-atlas ← Natural Earth) → 도트 월드맵 좌표 생성 (빌드 타임 1회)
// 결과는 정적 TS 파일로 저장 — 런타임 외부 의존성 없음
import { readFileSync, writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'))
const land = feature(topo, topo.objects.land) // FeatureCollection or Feature (MultiPolygon)
const geoms = (land.features ?? [land]).map(f => f.geometry)

function inRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function inLand(lon, lat) {
  for (const g of geoms) {
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const poly of polys) {
      let inside = false
      for (const ring of poly) if (inRing(lon, lat, ring)) inside = !inside
      if (inside) return true
    }
  }
  return false
}

const STEP = 2.5
const dots = []
for (let lat = 74; lat > -56; lat -= STEP) {
  for (let lon = -180 + STEP / 2; lon < 180; lon += STEP) {
    if (inLand(lon, lat)) dots.push([+lon.toFixed(1), +lat.toFixed(1)])
  }
}
const out = `// 자동 생성: scripts/gen-worldmap.mjs (world-atlas land-110m · Natural Earth)
// [경도, 위도] — 등장방형 투영용 육지 도트 그리드 (${STEP}° 간격, ${dots.length}점)
export const landDots: [number, number][] = ${JSON.stringify(dots)}
`
writeFileSync('src/demo/worldDots.ts', out)
console.log('dots:', dots.length)
