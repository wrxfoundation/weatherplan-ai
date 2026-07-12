// 송전선로 — OpenStreetMap power=line (전압별). OpenInfraMap 분류 준거.
// AIDC 맥락: 154kV+ 송전망 근접·경유는 계통 접속 여건의 근간(변전소 접속점과 함께 본다).
// 정직성: OSM 커뮤니티 매핑. 데이터 확보(GeoJSON export) 전까지 빈 배열 → 레이어 비활성.
// 데이터 채우는 법(Overpass turbo, export GeoJSON):
//   [out:json][timeout:180];
//   area["ISO3166-1"="KR"][admin_level=2]->.kr;
//   (way["power"="line"]["voltage"](area.kr););
//   out geom;
// → features[].geometry.coordinates(LineString) + properties.voltage 를 [[[lat,lng],...], kV] 로 변환해 LINES 채움.
export const POWER_LINES_META = {
  source: 'OpenStreetMap power=line (전압별, export 대기)',
  note: '154kV+ 송전망. OpenInfraMap 분류 준거(≥132kV 갈색·≥220 빨강·≥310 자주·≥550 청록·HVDC 보라). OSM 근사.',
}

// [ path:[[lat,lng],...], kv:number ] — 데이터 확보 후 채움.
export const POWER_LINES = []

// OpenInfraMap 준거 전압별 색(≥132/≥220/≥310/≥550/HVDC).
export function lineColor(kv) {
  if (kv == null) return '#93a3bd'
  if (kv >= 550) return '#22d3ee'
  if (kv >= 310) return '#c026d3'
  if (kv >= 220) return '#ef4444'
  if (kv >= 132) return '#b45309'
  if (kv >= 52) return '#eab308'
  return '#7dd3fc'
}
