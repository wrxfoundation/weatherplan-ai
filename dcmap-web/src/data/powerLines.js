// 송전선로 — OpenStreetMap power=line (전압별). OpenInfraMap 분류 준거.
// 데이터가 커서(2,500여 선로) 메인 번들이 아닌 public/data/power_lines.json 로 분리 → 레이어 켤 때만 동적 로드.
// AIDC 맥락: 154kV+ 송전망 근접·경유는 계통 접속 여건의 근간(변전소 접속점과 함께 본다). OSM 근사.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
export const POWER_LINES_URL = `${BASE}/data/power_lines.json`
export const POWER_LINES_AVAILABLE = true

export const POWER_LINES_META = {
  source: 'OpenStreetMap power=line (전압별, 2026.7 export)',
  note: '154kV+ 송전망 2,500여 선로. OpenInfraMap 분류 준거. OSM 근사 좌표(3소수점).',
}

let _cache = null
/** 송전선 데이터 [{p:[[lat,lng]...], v:kV}] 를 지연 로드(1회 캐시). */
export async function loadPowerLines() {
  if (_cache) return _cache
  const res = await fetch(POWER_LINES_URL)
  if (!res.ok) throw new Error('power_lines fetch failed')
  _cache = await res.json()
  return _cache
}

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
