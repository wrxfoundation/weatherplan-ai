// 발전 인프라 레이어 v0 — 대형 발전단지(원전·석탄) 근접성 맥락
// 정직성: 특정 DC↔발전소 전원 매칭은 존재하지 않음(풀 계통·계약 비공개) — '주변 발전 인프라'로만 표기
import raw from '../../data/power_plants_v0.json'
import windRaw from '../../data/wind_plants_v0.json'

export const PLANTS = raw.plants
export const WIND_PLANTS = windRaw.plants
export const PLANTS_VERSION = { version: raw.version, date: raw.date }
export const PLANTS_HONESTY = raw.honesty_note

/** 원전 호기별 현황 — 원안위/한수원 (2025-06-12). 상업운전 호기 설비용량 기준 */
import nuclearRaw from '../../data/nuclear_units_v0.json'

export const NUCLEAR_UNITS = nuclearRaw.units
export const NUCLEAR_META = { version: nuclearRaw.version, date: nuclearRaw.date, source: nuclearRaw.source }
export const NUCLEAR_FLEET = (() => {
  const bases = nuclearRaw.bases
  const nameOf = { 'pp-kori': '고리', 'pp-saeul': '새울', 'pp-wolsong': '월성', 'pp-hanbit': '한빛', 'pp-hanul': '한울' }
  const rows = Object.entries(bases).map(([id, b]) => ({
    id,
    base: nameOf[id] ?? id,
    operatingMw: b.operating_mw,
    operatingUnits: b.operating_units,
    buildingMw: b.building_mw,
    buildingUnits: b.building_units,
  }))
  rows.sort((a, b) => b.operatingMw - a.operatingMw)
  return {
    rows,
    operatingMw: rows.reduce((s, r) => s + r.operatingMw, 0),
    operatingUnits: rows.reduce((s, r) => s + r.operatingUnits, 0),
    buildingMw: rows.reduce((s, r) => s + r.buildingMw, 0),
    buildingUnits: rows.reduce((s, r) => s + r.buildingUnits, 0),
  }
})()

const R = 6371
const hav = (a, b) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 공공 DC 레이어 — 행안부 「행정·공공기관 정보시스템 운영시설 현황」 (공공누리, ②공공 정형) */
import pub from '../../data/public_dc_v0.json'

export const PUBLIC_DCS = pub.facilities
export const PUBLIC_DCS_META = { version: pub.version, date: pub.date, source: pub.source }

/** 지점에서 가장 가까운 발전단지 — { plant, km } */
export function nearestPlant(point) {
  let best = null
  for (const p of PLANTS) {
    const d = hav(point, p)
    if (!best || d < best.km) best = { plant: p, km: d }
  }
  return best
}

/** 반경 km 내 풍력 지점 수 + 최근접 거리 — RE100·신재생 근접성 맥락 */
export function windContext(point, radiusKm = 20) {
  let count = 0
  let nearest = null
  for (const w of WIND_PLANTS) {
    const d = hav(point, w)
    if (d <= radiusKm) count++
    if (!nearest || d < nearest.km) nearest = { plant: w, km: d }
  }
  return { count, radiusKm, nearest }
}
