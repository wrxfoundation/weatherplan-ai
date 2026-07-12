// 네트워크 인프라 — 통신 국사·IDC·IX·해저케이블 육양국.
// 시드(육양국·주요 IX, network_infra_v0.json) + OSM 통신국사/데이터센터(telecom, 2026.7 export) 병합.
// 스코어링 §5.2 네트워크축(백본/국사 거리·해저케이블 육양국) 근접성. OSM 근사 좌표.
import raw from '../../data/network_infra_v0.json'

// OSM telecom(office=telecommunication 국사/전화국·telecom=data_center) — 백본 근접 신호.
const OSM_TELECOM = [
  { type: 'DC', name: '드림마크원 데이터센터', lat: 37.48591, lng: 126.89156 },
  { type: '국사', name: '목동전화국', lat: 37.53042, lng: 126.87625 },
  { type: 'DC', name: 'KT 용산 IDC', lat: 37.53534, lng: 126.95895 },
  { type: 'DC', name: '데이터센터(춘천)', lat: 37.88926, lng: 127.7736 },
  { type: 'DC', name: '데이터센터(거제)', lat: 34.77776, lng: 128.64097 },
  { type: 'DC', name: '데이터센터(김해)', lat: 35.24986, lng: 128.86352 },
  { type: 'DC', name: '각 세종(네이버)', lat: 36.50812, lng: 127.34063 },
  { type: 'DC', name: '하남 IDC', lat: 37.55133, lng: 127.19519 },
  { type: 'DC', name: 'KR1 강남데이터센터', lat: 37.45811, lng: 127.03783 },
  { type: 'DC', name: 'SK브로드밴드 IDC', lat: 37.47579, lng: 126.88783 },
  { type: 'DC', name: '국가정보자원관리원 대구센터', lat: 35.96858, lng: 128.70644 },
  { type: '국사', name: 'KT 강서지사', lat: 37.52964, lng: 126.84835 },
  { type: '국사', name: 'KT보은빌딩', lat: 36.48836, lng: 127.71443 },
  { type: '국사', name: 'KT상당지사', lat: 36.67076, lng: 127.48848 },
  { type: '국사', name: 'KT 용전지사', lat: 36.35291, lng: 127.43181 },
  { type: '국사', name: 'KT용인지사', lat: 37.23795, lng: 127.20647 },
  { type: '국사', name: 'KT 광양지사', lat: 34.97649, lng: 127.58596 },
  { type: '국사', name: 'kt석남지사', lat: 37.50121, lng: 126.67525 },
  { type: '국사', name: 'KT 김포지사', lat: 37.62297, lng: 126.71311 },
  { type: '국사', name: '제주 한국통신', lat: 33.41255, lng: 126.26102 },
  { type: '국사', name: 'KT 울산지사', lat: 35.5658, lng: 129.34219 },
  { type: '국사', name: 'KT 광화문지사', lat: 37.57198, lng: 126.97777 },
  { type: '국사', name: 'KT 단양지사', lat: 36.9861, lng: 128.36713 },
  { type: '국사', name: 'KT 노원지사', lat: 37.65428, lng: 127.06383 },
  { type: '국사', name: 'KT 양평지사', lat: 37.49039, lng: 127.49737 },
  { type: '국사', name: 'kt 구래분기국사', lat: 37.65626, lng: 126.62536 },
  { type: '국사', name: '경주 전화국', lat: 35.84484, lng: 129.2142 },
  { type: '국사', name: '서령정보통신(서산)', lat: 36.78803, lng: 126.45304 },
  { type: '국사', name: 'KT 홍성지사', lat: 36.60206, lng: 126.66279 },
  { type: '국사', name: 'KT청양전화국', lat: 36.45337, lng: 126.80281 },
  { type: '국사', name: 'KT유구빌딩', lat: 36.55491, lng: 126.95 },
  { type: '국사', name: '제주 대우통신', lat: 33.51642, lng: 126.52864 },
]

export const NETWORK_META = { source: `${raw.source} + OSM telecom(2026.7)`, note: raw.note }
export const NETWORK_NODES = [...raw.nodes, ...OSM_TELECOM]

const EARTH_R = 6371
function km(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

// 지점에서 최근접 백본 국사/IX/IDC 와 최근접 해저케이블 육양국
export function networkContext(point) {
  const withKm = NETWORK_NODES.map((n) => ({ node: n, km: km(point.lat, point.lng, n.lat, n.lng) }))
  const backbone = withKm.filter((x) => x.node.type !== '해저케이블 육양국').sort((a, b) => a.km - b.km)[0] || null
  const cls = withKm.filter((x) => x.node.type === '해저케이블 육양국').sort((a, b) => a.km - b.km)[0] || null
  return { backbone, cls }
}
