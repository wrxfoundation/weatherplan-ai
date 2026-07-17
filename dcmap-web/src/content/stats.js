// 국내 데이터센터 현황 통계 — 출처가 확인된 공개 수치만 수록 (SPEC §0-1)
// 1차 출처: 에너지경제연구원(KEEI) 에너지통계 월호 제82호 (2026.4.30 발행, 발행인 김현제)
//   ← 김철현·김성균(2025) 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」 KEEI 기본연구보고서
//   ← KDCC 「Korea Data Center Market Report 2024~2027」(2024) · 「2025~2028」(2025)

export const STATS_SOURCE = {
  publication: '에너지경제연구원(KEEI) 에너지통계 월호 제82호 (2026.4.30)',
  publicationEn: 'KEEI Energy Statistics Monthly No. 82 (2026.4.30)',
  base: [
    '김철현·김성균(2025), 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」, KEEI 기본연구보고서',
    'KDCC(한국데이터센터연합회), Korea Data Center Market Report 2024~2027 (2024) · 2025~2028 (2025)',
  ],
  baseEn: [
    'Kim Cheol-hyun · Kim Seong-gyun (2025), "Implications of the Rise of Datacenters for Domestic Energy Consumption in the AI Era," KEEI Basic Research Report',
    'KDCC (Korea Data Center Council), Korea Data Center Market Report 2024~2027 (2024) · 2025~2028 (2025)',
  ],
  url: 'https://kesis.keei.re.kr',
  note: '전산실 바닥면적 500㎡ 이상 데이터센터 기준. 조사 기관·분류 기준에 따라 시설 수는 달라질 수 있음.',
  noteEn: 'Based on datacenters with a server-room floor area of 500㎡ or more. Facility counts may vary by surveying body and classification criteria.',
}

export const KPI = [
  { key: 'count', value: '165', unit: '개소', unitEn: 'sites', label: '국내 데이터센터 수', labelEn: 'Domestic datacenters', sub: '2024년 · 500㎡ 이상 기준 (KDCC)', subEn: '2024 · 500㎡+ basis (KDCC)' },
  { key: 'capital', value: '60', unit: '%', label: '수도권 소재 비중', labelEn: 'Capital-region share', sub: '2024년 · 전체 DC 기준', subEn: '2024 · all DCs basis' },
  { key: 'capital-private', value: '75', unit: '%+', label: '민간 DC 수도권 비중', labelEn: 'Private DC capital-region share', sub: '2024년 · 강원은 165개 중 6개', subEn: '2024 · Gangwon: 6 of 165' },
  { key: 'total-mw', value: '1,913', unit: 'MW', label: '국내 DC 전체 수전용량(추정)', labelEn: 'Nationwide DC total power capacity (est.)', sub: '2023년 · 평균 수전용량 기반 추정', subEn: '2023 · est. from average power capacity' },
]

export const COMPOSITION = [
  {
    key: 'ownership',
    title: '민간 : 공공 (2024, 시설 수 기준)',
    titleEn: 'Private : Public (2024, by facility count)',
    a: { label: '민간', labelEn: 'Private', pct: 56 },
    b: { label: '공공', labelEn: 'Public', pct: 44 },
    note: '민간 상업용 DC는 주로 통신 3사(KT·LG U+·SK)가 운영. 공공은 공공기관·중앙정부·지자체.',
    noteEn: 'Private commercial DCs are mainly operated by the three telcos (KT · LG U+ · SK). Public covers public agencies, central government, and local governments.',
  },
  {
    key: 'size',
    title: '중소형 : 대형 이상 (2023, 면적 기준)',
    titleEn: 'Small-mid : Large+ (2023, by floor area)',
    a: { label: '중소형(~2,000㎡)', labelEn: 'Small-mid (~2,000㎡)', pct: 45 },
    b: { label: '대형 이상(2,001㎡~)', labelEn: 'Large+ (2,001㎡~)', pct: 55 },
    note: '민간은 대형 이상이 대부분(약 76%), 공공은 중소형이 대부분(73%).',
    noteEn: 'Private is mostly large+ (about 76%), public is mostly small-mid (73%).',
  },
]

export const POWER_AVG = {
  title: '평균 수전용량 (2023)',
  titleEn: 'Average power capacity (2023)',
  bars: [
    { label: '민간 DC 평균', labelEn: 'Private DC average', value: 17.7, unit: 'MW' },
    { label: '공공 DC 평균', labelEn: 'Public DC average', value: 6.0, unit: 'MW' },
  ],
  note: '민간이 공공의 2배 이상. 최신(업력 5년 미만) DC일수록 수전용량이 큰 경향 — 40MW 이상 구간 비중이 가장 높음.',
  noteEn: 'Private is more than double public. Newer DCs (under 5 years old) tend to have larger power capacity — the 40MW-and-above band has the highest share.',
}

export const COOLING = {
  title: '공조(냉각) 방식 (2023, 복수응답)',
  titleEn: 'Cooling (HVAC) methods (2023, multiple responses)',
  bars: [
    { label: '공랭식', labelEn: 'Air-cooled', value: 60.9 },
    { label: '수냉식', labelEn: 'Water-cooled', value: 25.4 },
    { label: '외기도입', labelEn: 'Outside-air (free cooling)', value: 18.1 },
    { label: '냉수식', labelEn: 'Chilled-water', value: 17.4 },
    { label: '기타', labelEn: 'Other', value: 5.8 },
  ],
  note: '외기도입(프리쿨링 계열)은 18.1%에 그침 — 냉각 전력 절감 여지가 큰 영역이다(기상 레이어 M3에서 다룸).',
  noteEn: 'Outside-air (free-cooling family) is only 18.1% — a large opening for cooling-power savings (covered in weather layer M3).',
}

export const BACKUP = [
  { value: '89.5', unit: '%', label: '백업 발전기 중 디젤 비중', labelEn: 'Diesel share of backup generators', sub: '2023년 · 가스터빈 5.3%', subEn: '2023 · gas turbine 5.3%' },
  { value: '31.5', unit: '시간', unitEn: 'h', label: '백업 발전기 평균 최대 연속운전', labelEn: 'Backup generator avg. max continuous run', sub: '2023년', subEn: '2023' },
  { value: '91.3', unit: '%', label: '민간 DC 코로케이션 제공 비중', labelEn: 'Private DC colocation-offering share', sub: '2023년 · 복수응답', subEn: '2023 · multiple responses' },
]

/* 한국전력 데이터센터 고객 현황 — 지역본부 단위 (사용자 제공 공공데이터 CSV, 2023.12.31 기준)
 * '고객호수' = 한전에 데이터센터 용도로 계약된 수용가 수, '계약전력' = 합산 MW */
/* 발전사업 허가 파이프라인 — 3MW 초과 발전사업 허가대장 v2 (2026-04-17 기준)
 * v2는 ToUnicode 임베드본이라 원문 파싱 신뢰 → 건수 집계·연료원·허가일 발행.
 * 개별 용량(MW)은 참고치(needs_verify)로만. 상세 집계는 src/data/genLicenses.js. */
export const GEN_PIPELINE = {
  headline: '재생에너지 86.5%',
  headlineEn: 'Renewables 86.5%',
  detail:
    '3MW 초과 발전사업 허가대장(2026-04-17 기준) 4,647건 중 연료원이 확인되는 4,567건의 86.5%가 풍력·연료전지·태양광·해상풍력 등 신재생 — 석탄·LNG·원자력 등 화석·원자력은 약 7.4%에 그친다. 허가일 2024년 이후 신규 파이프라인 633건은 전남(146)·경북(85)·강원(84)에 집중, 86%가 비수도권 — AIDC 특별법의 비수도권 유인과 RE100 조달 여건이 지리적으로 정합한다. (누적 등재 건수 기준·용량 아님)',
  detailEn:
    'Of the 4,647 entries in the register of power-generation licenses above 3MW (as of 2026-04-17), among the 4,567 with an identified fuel source, 86.5% are renewables — wind, fuel cells, solar, offshore wind — while fossil and nuclear (coal, LNG, nuclear) account for only about 7.4%. The 633 new-pipeline entries licensed from 2024 onward are concentrated in Jeonnam (146), Gyeongbuk (85), and Gangwon (84), with 86% non-capital — the AIDC Special Act non-capital incentive and RE100 procurement conditions align geographically. (By cumulative registered count, not capacity.)',
  source: '3MW 초과 발전사업 허가대장 v2(2026-04-17) — AI InfraMap D1 발전 트랙. 개별 MW 참고치',
  sourceEn: 'Register of power-generation licenses above 3MW v2 (2026-04-17) — AI InfraMap D1 generation track. Individual MW figures are indicative.',
}

export const KEPCO_REGION = {
  title: '지역별 DC 고객호수·계약전력 (한전, 2023.12)',
  titleEn: 'DC customers · contracted power by region (KEPCO, 2023.12)',
  bars: [
    { label: '경기 (34호)', labelEn: 'Gyeonggi (34)', value: 681 },
    { label: '서울 (48호)', labelEn: 'Seoul (48)', value: 653 },
    { label: '부산울산경남 (15호)', labelEn: 'Busan·Ulsan·Gyeongnam (15)', value: 179 },
    { label: '대전충남 (17호)', labelEn: 'Daejeon·Chungnam (17)', value: 162 },
    { label: '강원 (7호)', labelEn: 'Gangwon (7)', value: 85 },
    { label: '인천 (8호)', labelEn: 'Incheon (8)', value: 69 },
    { label: '대구경북 (7호)', labelEn: 'Daegu·Gyeongbuk (7)', value: 63 },
    { label: '광주전남 (9호)', labelEn: 'Gwangju·Jeonnam (9)', value: 62 },
    { label: '충북 (4호)', labelEn: 'Chungbuk (4)', value: 30 },
    { label: '전북 (1호)', labelEn: 'Jeonbuk (1)', value: 2 },
    { label: '제주 (0호)', labelEn: 'Jeju (0)', value: 0 },
  ],
  note: '전국 합계 150호 · 계약전력 1,986MW — 수도권(서울·인천·경기) 90호 1,403MW = 계약전력 기준 71%. 한전 지역본부 구분(대전충남·광주전남 등 묶음), KEEI 추정 1,913MW와 정합하는 계약전력 기준 공식 단면.',
  noteEn: 'Nationwide total 150 customers · 1,986MW contracted power — capital region (Seoul · Incheon · Gyeonggi) 90 customers, 1,403MW = 71% by contracted power. Grouped by KEPCO regional offices (Daejeon·Chungnam, Gwangju·Jeonnam, etc.); an official cross-section by contracted power consistent with the KEEI estimate of 1,913MW.',
}

// 수도권 DC 시장 최신 단면 — Cushman & Wakefield / KDCC "Korea DC Market Report 2H 2025"
// 스코프: 수도권 메이저 운영사(하이퍼스케일·코로·엣지·통신사), 캡티브·ICT 제외 — 165개소(전국 500㎡+)와 스코프 다름
export const MARKET_2025H2 = {
  asOf: '2025 하반기',
  asOfEn: '2H 2025',
  source: 'Cushman & Wakefield · KDCC, Korea Data Centre Market Report 2H 2025',
  kpi: [
    { value: '601', unit: 'MW', label: '수도권 운영 용량', labelEn: 'Capital-region operating capacity', sub: '2H 2025 · 전년比 +16%', subEn: '2H 2025 · +16% YoY' },
    { value: '921', unit: 'MW', label: '개발 파이프라인', labelEn: 'Development pipeline', sub: '전년比 +43% · UC 223 / 계획 698', subEn: '+43% YoY · UC 223 / planned 698' },
    { value: '25 / 55', unit: '', label: '운영사 / 데이터센터', labelEn: 'Operators / datacenters', sub: '수도권 메이저 기준', subEn: 'capital-region majors basis' },
    { value: '31', unit: '%', label: '기타권역 파이프라인 비중', labelEn: 'Other-region pipeline share', sub: '탈중심화 가속', subEn: 'decentralization accelerating' },
  ],
  note:
    '수도권 전력 가용성 제한·높은 토지비로 개발 탈중심화 가속(기타권역 파이프라인 31%). 공실률 6.9%. 아시아 건설단가 한국 $9.0/W. OpenAI Stargate(삼성·SK하이닉스·SKT·삼성SDS)·AWS 50억달러·워버그핀커스 용인 등 대형 투자 유입.',
  noteEn:
    'Limited capital-region power availability and high land costs are accelerating development decentralization (other-region pipeline 31%). Vacancy rate 6.9%. Asia construction cost in Korea $9.0/W. Large investments flowing in — OpenAI Stargate (Samsung · SK hynix · SKT · Samsung SDS), AWS $5B, Warburg Pincus Yongin, etc.',
  policy:
    '2025.11 계통영향평가 개편 — 적정전압 필수·비기술(지역수용성·정책부합) 평가 강화·입지별 최대 ±15점 가감점(수도권 억제)·자가발전/에너지효율 의무 정량화·기술검토비 신설. 2025.9 국가기간 전력망 확충 특별법 시행(국무총리 산하 위원회·인허가 간소화·환경영향평가 특례) — 비수도권 개발 신속 지원.',
  policyEn:
    '2025.11 grid-impact-assessment overhaul — mandatory adequate-voltage, strengthened non-technical (regional acceptance · policy alignment) evaluation, up to ±15 points by location (curbing the capital region), quantified self-generation / energy-efficiency obligations, and a new technical-review fee. 2025.9 National Backbone Power Grid Expansion Special Act took effect (committee under the Prime Minister · streamlined permitting · environmental-impact-assessment exceptions) — fast-tracking non-capital development.',
}

export const CUSTOMERS = {
  title: '상업용 DC 평균 입주 고객 수 (2023)',
  titleEn: 'Average tenant customers per commercial DC (2023)',
  bars: [
    { label: '수도권', labelEn: 'Capital region', value: 168, unit: '개', unitEn: '' },
    { label: '비수도권', labelEn: 'Non-capital', value: 33, unit: '개', unitEn: '' },
  ],
  note: '수도권 대비 비수도권의 고객 확보가 어려움 — 수도권 집중(인프라·수요·인력·네트워크 지연율)의 수요 측 원인.',
  noteEn: 'Non-capital regions have a harder time securing customers than the capital region — the demand-side cause of capital concentration (infrastructure · demand · talent · network latency).',
}
