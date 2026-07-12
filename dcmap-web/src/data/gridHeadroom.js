// 지역 계통 공급여유 — 한전 연계가능용량(공급여유) 지도, 2027 전망. 시도 총량 기준.
// 정직성:
//  - '시도 총 공급여유'이며 특정 시군구/부지가 그만큼 수전 가능하다는 뜻이 아님
//    (예: 서울 총 3,090MW지만 대부분 구는 0~100MW red, 도봉구 등에 집중).
//  - 세부 부지 여유는 한전 '주소로 검색'(접속가능용량 조회)이 필요 — 본 지표는 지역 스크리닝용.
//  - 자급률(발전÷소비)과는 별개: 인천은 자급률 165%(발전 잉여)지만 공급여유 5MW(계통 포화).
export const GRID_HEADROOM_META = {
  source: '한국전력공사 계통 공급여유(연계가능용량) 지도 — 2027 전망',
  year: 2027,
  note: '시도 총 공급여유(MW). 시군구·부지별 편차 크며 세부는 한전 주소검색(접속가능용량) 필요.',
}

// 시도 → 공급여유(MW). 현재 판독 확보분(전남은 광주 통합특별시 합산 기준).
const RAW = {
  서울: { mw: 3090 },
  인천: { mw: 5 },
  부산: { mw: 700 },
  대구: { mw: 4600 },
  전남: { mw: 6645, note: '전남·광주 통합특별시 합산 기준' },
  광주: { mw: 6645, note: '전남·광주 통합특별시 합산 기준(광주 단독 아님)' },
}

export const GRID_HEADROOM = Object.fromEntries(
  Object.entries(RAW).map(([sido, v]) => [sido, { sido, ...v }]),
)

/** 시도 → 공급여유 레코드({sido, mw, note?}) 또는 null */
export function gridHeadroomForSido(sido) {
  return sido ? GRID_HEADROOM[sido] || null : null
}

/** 공급여유(MW) → 정성 라벨 */
export function headroomLabel(mw) {
  if (mw == null) return null
  if (mw <= 10) return '계통 포화(신규 대형부하 불가)'
  if (mw <= 100) return '매우 빠듯'
  if (mw <= 500) return '제한적'
  if (mw <= 1500) return '여유 있음'
  return '여유 큼'
}
