// 국내 데이터센터 현황 통계 — 출처가 확인된 공개 수치만 수록 (SPEC §0-1)
// 1차 출처: 에너지경제연구원(KEEI) 에너지통계 월호 제82호 (2026.4.30 발행, 발행인 김현제)
//   ← 김철현·김성균(2025) 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」 KEEI 기본연구보고서
//   ← KDCC 「Korea Data Center Market Report 2024~2027」(2024) · 「2025~2028」(2025)

export const STATS_SOURCE = {
  publication: '에너지경제연구원(KEEI) 에너지통계 월호 제82호 (2026.4.30)',
  base: [
    '김철현·김성균(2025), 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」, KEEI 기본연구보고서',
    'KDCC(한국데이터센터연합회), Korea Data Center Market Report 2024~2027 (2024) · 2025~2028 (2025)',
  ],
  url: 'https://kesis.keei.re.kr',
  note: '전산실 바닥면적 500㎡ 이상 데이터센터 기준. 조사 기관·분류 기준에 따라 시설 수는 달라질 수 있음.',
}

export const KPI = [
  { key: 'count', value: '165', unit: '개소', label: '국내 데이터센터 수', sub: '2024년 · 500㎡ 이상 기준 (KDCC)' },
  { key: 'capital', value: '60', unit: '%', label: '수도권 소재 비중', sub: '2024년 · 전체 DC 기준' },
  { key: 'capital-private', value: '75', unit: '%+', label: '민간 DC 수도권 비중', sub: '2024년 · 강원은 165개 중 6개' },
  { key: 'total-mw', value: '1,913', unit: 'MW', label: '국내 DC 전체 수전용량(추정)', sub: '2023년 · 평균 수전용량 기반 추정' },
]

export const COMPOSITION = [
  {
    key: 'ownership',
    title: '민간 : 공공 (2024, 시설 수 기준)',
    a: { label: '민간', pct: 56 },
    b: { label: '공공', pct: 44 },
    note: '민간 상업용 DC는 주로 통신 3사(KT·LG U+·SK)가 운영. 공공은 공공기관·중앙정부·지자체.',
  },
  {
    key: 'size',
    title: '중소형 : 대형 이상 (2023, 면적 기준)',
    a: { label: '중소형(~2,000㎡)', pct: 45 },
    b: { label: '대형 이상(2,001㎡~)', pct: 55 },
    note: '민간은 대형 이상이 대부분(약 76%), 공공은 중소형이 대부분(73%).',
  },
]

export const POWER_AVG = {
  title: '평균 수전용량 (2023)',
  bars: [
    { label: '민간 DC 평균', value: 17.7, unit: 'MW' },
    { label: '공공 DC 평균', value: 6.0, unit: 'MW' },
  ],
  note: '민간이 공공의 2배 이상. 최신(업력 5년 미만) DC일수록 수전용량이 큰 경향 — 40MW 이상 구간 비중이 가장 높음.',
}

export const COOLING = {
  title: '공조(냉각) 방식 (2023, 복수응답)',
  bars: [
    { label: '공랭식', value: 60.9 },
    { label: '수냉식', value: 25.4 },
    { label: '외기도입', value: 18.1 },
    { label: '냉수식', value: 17.4 },
    { label: '기타', value: 5.8 },
  ],
  note: '외기도입(프리쿨링 계열)은 18.1%에 그침 — 냉각 전력 절감 여지가 큰 영역이다(기상 레이어 M3에서 다룸).',
}

export const BACKUP = [
  { value: '89.5', unit: '%', label: '백업 발전기 중 디젤 비중', sub: '2023년 · 가스터빈 5.3%' },
  { value: '31.5', unit: '시간', label: '백업 발전기 평균 최대 연속운전', sub: '2023년' },
  { value: '91.3', unit: '%', label: '민간 DC 코로케이션 제공 비중', sub: '2023년 · 복수응답' },
]

/* 한국전력 데이터센터 고객 현황 — 지역본부 단위 (사용자 제공 공공데이터 CSV, 2023.12.31 기준)
 * '고객호수' = 한전에 데이터센터 용도로 계약된 수용가 수, '계약전력' = 합산 MW */
/* 발전사업 허가 파이프라인 — 3MW 초과 발전사업 허가대장 v2 (2026-04-17 기준)
 * v2는 ToUnicode 임베드본이라 원문 파싱 신뢰 → 건수 집계·연료원·허가일 발행.
 * 개별 용량(MW)은 참고치(needs_verify)로만. 상세 집계는 src/data/genLicenses.js. */
export const GEN_PIPELINE = {
  headline: '재생에너지 86.5%',
  detail:
    '3MW 초과 발전사업 허가대장(2026-04-17 기준) 4,652건 중 연료원이 확인되는 4,567건의 86.5%가 풍력·연료전지·태양광·해상풍력 등 신재생 — 석탄·LNG·원자력 등 화석·원자력은 8%대에 그친다. 허가일 2024년 이후 신규 파이프라인 633건은 전남(146)·경북(85)·강원(84)에 집중, 86%가 비수도권 — AIDC 특별법의 비수도권 유인과 RE100 조달 여건이 지리적으로 정합한다. (누적 등재 건수 기준·용량 아님)',
  source: '3MW 초과 발전사업 허가대장 v2(2026-04-17) — AI InfraMap D1 발전 트랙. 개별 MW 참고치',
}

export const KEPCO_REGION = {
  title: '지역별 DC 고객호수·계약전력 (한전, 2023.12)',
  bars: [
    { label: '경기 (34호)', value: 681 },
    { label: '서울 (48호)', value: 653 },
    { label: '부산울산경남 (15호)', value: 179 },
    { label: '대전충남 (17호)', value: 162 },
    { label: '강원 (7호)', value: 85 },
    { label: '인천 (8호)', value: 69 },
    { label: '대구경북 (7호)', value: 63 },
    { label: '광주전남 (9호)', value: 62 },
    { label: '충북 (4호)', value: 30 },
    { label: '전북 (1호)', value: 2 },
    { label: '제주 (0호)', value: 0 },
  ],
  note: '전국 합계 150호 · 계약전력 1,986MW — 수도권(서울·인천·경기) 90호 1,403MW = 계약전력 기준 71%. 한전 지역본부 구분(대전충남·광주전남 등 묶음), KEEI 추정 1,913MW와 정합하는 계약전력 기준 공식 단면.',
}

export const CUSTOMERS = {
  title: '상업용 DC 평균 입주 고객 수 (2023)',
  bars: [
    { label: '수도권', value: 168, unit: '개' },
    { label: '비수도권', value: 33, unit: '개' },
  ],
  note: '수도권 대비 비수도권의 고객 확보가 어려움 — 수도권 집중(인프라·수요·인력·네트워크 지연율)의 수요 측 원인.',
}
