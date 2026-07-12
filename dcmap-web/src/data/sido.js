// 좌표 → 시도(근사) — 오프라인 분류기. 17개 시도 대표점 최근접.
// 국경 인근은 부정확할 수 있으나, 시도 단위 신호(공급여유·승인율) 매칭·랭킹용으로 충분.
const CENTROIDS = [
  ['서울', 37.5665, 126.978],
  ['부산', 35.18, 129.08],
  ['대구', 35.87, 128.6],
  ['인천', 37.456, 126.705],
  ['광주', 35.16, 126.851],
  ['대전', 36.35, 127.385],
  ['울산', 35.539, 129.311],
  ['세종', 36.56, 127.29],
  ['경기', 37.41, 127.35],
  ['강원', 37.83, 128.16],
  ['충북', 36.9, 127.75],
  ['충남', 36.52, 126.85],
  ['전북', 35.72, 127.05],
  ['전남', 34.9, 126.99],
  ['경북', 36.4, 128.85],
  ['경남', 35.35, 128.35],
  ['제주', 33.43, 126.56],
]

const EARTH_R = 6371
function km(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

/** 좌표 → 시도 단축명(근사) */
export function sidoOf(lat, lng) {
  let best = null
  let bestKm = Infinity
  for (const [sido, cLat, cLng] of CENTROIDS) {
    const d = km(lat, lng, cLat, cLng)
    if (d < bestKm) {
      bestKm = d
      best = sido
    }
  }
  return best
}
