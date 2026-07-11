// 네트워크 인프라 — 해저케이블 육양국·주요 IX/국사 (공개 정보 기반 근사, 검증 대기)
// 스코어링 §5.2 네트워크축(백본/국사 거리·해저케이블 육양국) 근접성 맥락. 좌표는 참고치.
import raw from '../../data/network_infra_v0.json'

export const NETWORK_META = { source: raw.source, note: raw.note }
export const NETWORK_NODES = raw.nodes

const EARTH_R = 6371
function km(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

// 지점에서 최근접 백본 국사/IX 와 최근접 해저케이블 육양국
export function networkContext(point) {
  const withKm = NETWORK_NODES.map((n) => ({ node: n, km: km(point.lat, point.lng, n.lat, n.lng) }))
  const backbone = withKm.filter((x) => x.node.type !== '해저케이블 육양국').sort((a, b) => a.km - b.km)[0] || null
  const cls = withKm.filter((x) => x.node.type === '해저케이블 육양국').sort((a, b) => a.km - b.km)[0] || null
  return { backbone, cls }
}
