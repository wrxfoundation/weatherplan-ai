// 데이터센터 부동산 시장 데이터 — 거래 사례·랙 임대료·개발 갈등.
// 출처: 알스퀘어 리서치센터 「2025 Data Center Report」(2025.11) p.25(거래)·p.34(임대료)·p.36(갈등).
// 정직성: 거래가·임대료는 공표 시점 값(변동 가능), 갈등 사례는 리포트 수록분(전수 아님).

export const DC_DEALS_META = {
  asOf: '2025-11',
  source: '알스퀘어 리서치센터(2025.11) — 국내 데이터센터 주요 거래 사례',
  note: '수전용량 괄호는 IT Load. 매입가는 공표액(억원).',
}

// [자산명, 주소, 연면적㎡, 수전용량, 준공, 거래시기, 매입가(억원), 매도인, 매수인]
const DEALS = [
  ['드림마크원 구로 IDC', '서울 구로구', 23146, '10MW', 2004, '2018.08', 490, '신세계 I&C', '드림마크원'],
  ['분당 Hostway IDC', '경기 성남시', 14533, '12.5MW', 2000, '2020.10', 430, 'JB자산운용', '코람코자산운용(이지스밸류플러스리츠)'],
  ['하남 데이터센터', '경기 하남시', 41919, '40MW (IT 25.44)', 2023, '2024.08', 7340, '이지스자산운용', '그린디지털인프라㈜(맥쿼리한국인프라)'],
  ['세종텔레콤 분당 IDC', '경기 용인시', 8816, '6.75MW (IT 2.63)', 1998, '2025.07', 315, '하나대체투자자산운용', '파인앤파트너스자산운용(TPG안젤로고든)'],
  ['SK AX 판교 IDC', '경기 성남시', 67024, '30MW', 2014, '2025.07', 5068, 'SK AX(구 SK C&C)', 'SK브로드밴드'],
]
export const DC_DEALS = DEALS.map(([name, addr, gfaM2, power, built, dealAt, priceEok, seller, buyer]) => ({
  name, addr, gfaM2, power, built, dealAt, priceEok, seller, buyer,
}))

export const RACK_RATES_META = {
  asOf: '2025',
  source: '알스퀘어 리서치센터(2025.11) — 코로케이션 업체별 랙 임대료(각 사 공표)',
  note: 'Full 랙 기본 전력 통상 2.2kW 포함 — 저밀도 기준. AIDC 고밀도 랙(30~60kW/rack)과는 과금 구조가 다름.',
}

// [사업자, 랙타입, 월 임대료(원), 기본전력, 추가 전력 단가]
const RACKS = [
  ['KT Cloud IDC', '1/4 Rack', 436000, '2.2kW', '1.1kW당 220,000원'],
  ['KT Cloud IDC', '1/2 Rack', 653000, '2.2kW', '1.1kW당 220,000원'],
  ['KT Cloud IDC', 'Full Rack', 1087000, '2.2kW', '1.1kW당 220,000원'],
  ['가비아 IDC', '1/4 Rack', 300000, '0.55kW', '—'],
  ['가비아 IDC', '1/2 Rack', 550000, '1.1kW', '—'],
  ['가비아 IDC', 'Full Rack', 1000000, '2.2kW', '—'],
  ['BizMaru', '1/4 Rack', 330000, '0.55kW', '—'],
  ['BizMaru', '1/2 Rack', 750000, '1.1kW', '—'],
  ['BizMaru', 'Full Rack', 1300000, '2.2kW', '—'],
  ['KDT(한국데이터통신)', '1/4 Rack', 400000, '명시 없음', '—'],
  ['KDT(한국데이터통신)', '1/2 Rack', 850000, '명시 없음', '—'],
  ['KDT(한국데이터통신)', 'Full Rack', 1250000, '2.2kW', '—'],
]
export const RACK_RATES = RACKS.map(([vendor, rack, monthlyKrw, basePower, extraRate]) => ({ vendor, rack, monthlyKrw, basePower, extraRate }))

export const DEV_CONFLICTS_META = {
  asOf: '2025-11',
  source: '알스퀘어 리서치센터(2025.11) — 데이터센터 개발 이슈(주민 반대) 사례',
  note: '과기정통부 실측(’25.8~9): DC 6곳 고압전선 전자파 평균 = 인체보호기준(ICNIRP)의 0.4% (병원 0.68%·호텔 1.17%보다 낮음). 그럼에도 계획 철회·착공 지연이 다수 — 리스크축의 실재 변수.',
}

// [시행사, 지역, 주민 주장, 개발상 이슈]
const CONFLICTS = [
  ['에브리쇼', '경기 안양시', '전자파, 소음', '계획 철회 및 부지 매각'],
  ['네이버', '경기 용인시', '전자파, 환경 파괴', '계획 철회'],
  ['디지털 리얼티', '경기 김포시', '정전 사태 유발, 열섬현상', '김포시 착공 불허'],
  ['GS건설', '경기 고양시', '전자파, 소음, 열섬현상', '착공 지연'],
  ['NHN 클라우드', '경남 김해시', '전자파, 열섬현상', '계획 철회'],
  ['AWS', '인천 서구', '전자파', '착공 지연'],
  ['디지털 엣지', '인천 부평구', '전자파', '공사 일시중지'],
  ['하양 에너지발전', '서울 구로구', '전자파, 소음, 열섬현상', '착공 지연'],
]
export const DEV_CONFLICTS = CONFLICTS.map(([developer, region, claims, outcome]) => ({ developer, region, claims, outcome }))
