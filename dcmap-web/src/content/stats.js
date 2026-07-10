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

export const CUSTOMERS = {
  title: '상업용 DC 평균 입주 고객 수 (2023)',
  bars: [
    { label: '수도권', value: 168, unit: '개' },
    { label: '비수도권', value: 33, unit: '개' },
  ],
  note: '수도권 대비 비수도권의 고객 확보가 어려움 — 수도권 집중(인프라·수요·인력·네트워크 지연율)의 수요 측 원인.',
}
