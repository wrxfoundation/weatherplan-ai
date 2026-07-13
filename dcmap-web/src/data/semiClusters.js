// 반도체·AI 메가클러스터 — 전력·용수 대수요처. AI DC와 계통·용수를 두고 경쟁/공존하는 앵커.
// 전력(GW)·용수(천t/일)는 정부·기업 공개 발표에 명시된 값만 기입(없으면 null — 추정 금지).
// 좌표는 대표 지번 지오코딩 근사(국가산단·캠퍼스 중심점). 예정 부지는 위치 협의중 → 대표점.
// 1차 소스: 3대 메가프로젝트 국민보고회(2026.6.29)·주간조선 2915·2916호 / 제11차 전력수급기본계획 실무안.

// [name, lat, lng, operator, status, powerGw, waterKtd, note]
export const SEMI_CLUSTERS = [
  ['용인 반도체 국가산단', 37.16386, 127.22389, '삼성전자', '조성중', 9.3, null, '처인구 이동·남사읍 · 1단계 3GW LNG 자체조달 + 북천안 송전 40km 추가'],
  ['용인 원삼 반도체클러스터', 37.16188, 127.33299, 'SK하이닉스', '착공', null, null, '처인구 원삼면 일반산단 · 골조 단계'],
  ['평택 캠퍼스', 37.02416, 127.05363, '삼성전자', '운영·확장', null, null, '고덕 국제화계획지구'],
  ['이천 캠퍼스', 37.27056, 127.51694, 'SK하이닉스', '운영', null, null, 'SK하이닉스 D램 본진'],
  ['청주 캠퍼스(M15)', 36.65186, 127.43348, 'SK하이닉스', '운영', null, null, '낸드 팹'],
  ['광주·전남 반도체 클러스터', 35.0116, 126.7815, '삼성·SK', '예정', 6.3, 650, '800조·팹 4기 · 위치 협의중(대표점 근사) · 공업용수 65만t/일'],
]

export const SEMI_CLUSTER_META = {
  source: '3대 메가프로젝트 국민보고회(2026.6.29)·주간조선 2915·2916호',
  count: SEMI_CLUSTERS.length,
  note: '전력·용수는 공개 발표값만 · 예정 부지 좌표는 대표점 근사',
}

const EARTH_R = 6371
function km(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

/** 최근접 반도체·AI 메가클러스터 — { name, operator, status, powerGw, waterKtd, km } | null. */
export function nearestCluster(lat, lng) {
  let best = null
  for (const [name, sLat, sLng, operator, status, powerGw, waterKtd] of SEMI_CLUSTERS) {
    const d = km(lat, lng, sLat, sLng)
    if (!best || d < best.km) best = { name, operator, status, powerGw, waterKtd, km: d }
  }
  return best
}
