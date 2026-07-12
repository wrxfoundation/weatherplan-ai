// 산업단지 — 한국산업단지공단 전국산업단지현황 / vworld 산업단지 레이어(경계·대표점).
// AIDC 맥락: 산단 내/근접은 (1) 입주 인센티브·세제, (2) 전력·용수 기반시설 사전확보,
//  (3) 공업지역 용도 → 인허가 수월 로 DC 입지에 유리. 경계/좌표 데이터 확보 후 점수 활성.
// 정직성: 데이터 미확보 시 빈 배열 → 점수는 '대기'. 채워지면 최근접 산단 거리로 자동 산출.
export const INDUSTRIAL_COMPLEX_META = {
  source: '한국산업단지공단 전국산업단지현황 / vworld 산업단지(연동 대기)',
  note: '산단 내/근접 = 인센티브·전력·용수 기반시설 사전확보. 경계·대표점 데이터 연동 시 활성.',
}

// [name, lat, lng, type] — 산업단지 대표점(중심 좌표). type: 국가/일반/도시첨단/농공.
// 데이터 확보(GeoJSON/CSV) 후 채움. 예: ['구미국가산업단지', 36.11, 128.42, '국가']
export const INDUSTRIAL_COMPLEXES = []

const EARTH_R = 6371
function km(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

/** 최근접 산업단지 대표점 {name, type, km} 또는 null(데이터 미확보 시) */
export function nearestIndustrialComplex(lat, lng) {
  if (!INDUSTRIAL_COMPLEXES.length) return null
  let best = null
  for (const [name, cLat, cLng, type] of INDUSTRIAL_COMPLEXES) {
    const d = km(lat, lng, cLat, cLng)
    if (!best || d < best.km) best = { name, type, km: d }
  }
  return best
}
