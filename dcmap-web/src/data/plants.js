// 발전 인프라 레이어 v0 — 대형 발전단지(원전·석탄) 근접성 맥락
// 정직성: 특정 DC↔발전소 전원 매칭은 존재하지 않음(풀 계통·계약 비공개) — '주변 발전 인프라'로만 표기
import raw from '../../data/power_plants_v0.json'

export const PLANTS = raw.plants
export const PLANTS_VERSION = { version: raw.version, date: raw.date }
export const PLANTS_HONESTY = raw.honesty_note

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
