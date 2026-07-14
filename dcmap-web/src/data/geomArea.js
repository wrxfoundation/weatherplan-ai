// GeoJSON 폴리곤 평면 면적(㎡) — 등장방형 근사 투영 + 신발끈. 필지 스케일에서 오차 무시 가능.
// MapPage(필지 툴팁)·SitePanel(토지 셀)이 공유.
const ringAreaM2 = (ring) => {
  const rad = Math.PI / 180
  const R = 6378137
  const lat0 = ring[0][1] * rad
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i][0] * rad * R * Math.cos(lat0)
    const y1 = ring[i][1] * rad * R
    const x2 = ring[i + 1][0] * rad * R * Math.cos(lat0)
    const y2 = ring[i + 1][1] * rad * R
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a / 2)
}

export function geomAreaM2(g) {
  try {
    if (g?.type === 'Polygon') return ringAreaM2(g.coordinates[0])
    if (g?.type === 'MultiPolygon') return g.coordinates.reduce((s, poly) => s + ringAreaM2(poly[0]), 0)
  } catch {
    /* 무시 */
  }
  return null
}
