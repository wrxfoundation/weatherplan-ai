/* 글로벌 AI 인프라·기상 AI 벤치마크 사례 라이브러리
 *
 * 정직성 원칙(앱 전체와 동일):
 *  - 공개 자료로 확인된 것만 fact에 넣는다. 확인 못 한 것은 open[](미검증)으로 분리.
 *  - 모든 사례에 sources[](출처+시점)와 updated(정리 시점)를 단다.
 *  - read[]는 우리 해석이며 페이지에서 "자체 해석"으로 명시 표기한다. 추정 수치를 fact에 섞지 않는다.
 *
 * 사례 추가 방법: GLOBAL_CASES 배열에 객체 하나를 append 하면 카드·비교표·필터·통계가 자동 반영된다.
 * 필수: slug, name, country, type, lede, sources, updated. 나머지는 있으면 렌더, 없으면 자동 생략.
 */

export const CASE_TYPES = {
  infra: {
    ko: '인프라 주도형',
    en: 'Infrastructure-led',
    ko_desc: '컴퓨트·모델·운영을 하나의 국가급 패키지로 묶어 수출한다. 자본과 전력이 진입장벽.',
    en_desc: 'Bundles compute, models and operations into a national-scale package for export. Capital and power are the barrier.',
  },
  bigtech: {
    ko: '빅테크 연구형',
    en: 'Big-tech research-led',
    ko_desc: '모델 성능 자체로 경쟁한다. 논문·벤치마크가 1차 산출물이고 상용화는 후행.',
    en_desc: 'Competes on raw model performance. Papers and benchmarks come first, commercialisation follows.',
  },
  agency: {
    ko: '공공기관 주도형',
    en: 'Public-agency-led',
    ko_desc: '기존 수치예보 체계를 AI로 대체·보강한다. 공신력은 높고 상용 속도는 느리다.',
    en_desc: 'Replaces or augments existing numerical forecasting. High authority, slower to commercialise.',
  },
  vendor: {
    ko: '전문 사업자형',
    en: 'Specialist vendor',
    ko_desc: '특정 지역·산업에 좁게 파고들어 유상 계약으로 검증한다. 규모는 작지만 매출이 실재한다.',
    en_desc: 'Goes narrow on a region or industry and proves it with paid contracts. Small scale, real revenue.',
  },
}

/* 계층 정의 — 사례 간 비교표의 행(row). 여기 순서가 표시 순서. */
export const STACK_LAYERS = [
  { key: 'platform', ko: '모델 플랫폼', en: 'Model platform' },
  { key: 'compute', ko: '컴퓨트', en: 'Compute' },
  { key: 'model', ko: '모델 조직', en: 'Model org' },
  { key: 'observation', ko: '지상 관측', en: 'Ground observation' },
  { key: 'satellite', ko: '위성·지리정보', en: 'Satellite · geospatial' },
  { key: 'agency', ko: '국가기관 협력', en: 'National agency' },
  { key: 'revenue', ko: '수익 경로', en: 'Revenue path' },
]

export const GLOBAL_CASES = [
  {
    slug: 'g42-uae',
    name: 'G42',
    full: 'Group 42 Holding Ltd',
    country: 'UAE · 아부다비',
    country_en: 'UAE · Abu Dhabi',
    founded: 2018,
    type: 'infra',
    lede:
      '기상 데이터 회사가 AI를 도입한 것이 아니라, AI 인프라 회사가 기상 도메인을 수직계열화한 사례. NVIDIA Earth-2 생태계의 최대 상용 레퍼런스다.',
    lede_en:
      'Not a weather company adopting AI — an AI-infrastructure company absorbing the weather domain vertically. The largest commercial reference in the NVIDIA Earth-2 ecosystem.',
    entry: {
      year: 2024,
      ko: '2024.9 NVIDIA와 아부다비에 Earth-2 Climate Tech Lab 설립. NVIDIA의 첫 UAE 기업 파트너십.',
      en: 'Sep 2024 — Earth-2 Climate Tech Lab established with NVIDIA in Abu Dhabi. NVIDIA’s first UAE corporate partnership.',
    },
    stack: {
      platform: { ko: 'NVIDIA Earth-2 (CorrDiff)', en: 'NVIDIA Earth-2 (CorrDiff)' },
      compute: {
        ko: '자체 보유 (CAPEX) — Core42 / Khazna',
        en: 'Owned (CAPEX) — Core42 / Khazna',
        note: 'Stargate UAE 1GW 클러스터, 1단계 200MW는 2026년 3분기 가동 목표',
        note_en: 'Stargate UAE 1GW cluster; phase 1 (200MW) targeted for Q3 2026',
      },
      model: { ko: 'Inception (AI 리서치 자회사)', en: 'Inception (in-house AI research arm)' },
      observation: {
        ko: '없음 — 자체 지상 관측망 미보유',
        en: 'None — no own ground observation network',
        gap: true,
      },
      satellite: { ko: 'Space42 (Bayanat+Yahsat 합병)', en: 'Space42 (Bayanat + Yahsat merger)' },
      agency: { ko: 'NCM(UAE 국가기상센터) 협력', en: 'NCM (UAE National Center of Meteorology) partnership' },
      revenue: {
        ko: '정부 레퍼런스 → 산업 B2B → 국가급 패키지 수출',
        en: 'Government reference → industrial B2B → national-package export',
      },
    },
    scale: [
      { k: '초국지 예보 해상도', k_en: 'Hyper-local forecast resolution', v: '200', unit: 'm', note: 'CorrDiff 생성형 다운스케일링, 2025.3 공개', note_en: 'CorrDiff generative downscaling, published Mar 2025' },
      { k: 'AI 캠퍼스 규모', k_en: 'AI campus scale', v: '5', unit: 'GW', note: 'UAE-US AI Campus 총 규모(약 19.2㎢)', note_en: 'Total UAE-US AI Campus (~19.2 km²)' },
      { k: '1단계 가동 용량', k_en: 'Phase-1 capacity', v: '200', unit: 'MW', note: '2026년 3분기 목표, Khazna 주관', note_en: 'Targeted Q3 2026, led by Khazna' },
      { k: 'Microsoft 투자', k_en: 'Microsoft investment', v: '15', unit: '억$', v_en: '1.5', unit_en: 'B$', note: '2024.4 소수지분 + 이사회 참여', note_en: 'Apr 2024, minority stake + board seat' },
    ],
    timeline: [
      { when: '2018', ko: 'UAE 아부다비 설립. Royal Group 산하 출발.', en: 'Founded in Abu Dhabi under Royal Group.' },
      { when: '2020', ko: '무바달라가 Injazat·Khazna를 합병시키며 지분 참여.', en: 'Mubadala takes a stake, folding in Injazat and Khazna.' },
      { when: '2021', ko: 'Silver Lake 8억 달러 투자.', en: 'Silver Lake invests $800M.' },
      { when: '2024.2', ko: 'Core42 출범 (G42 Cloud+Khazna+Inject AI 통합).', en: 'Core42 formed (G42 Cloud + Khazna + Inject AI).' },
      { when: '2024.4', ko: 'Microsoft 15억 달러 투자, 미·UAE 정부간 보증 협정 체결.', en: 'Microsoft invests $1.5B; US–UAE intergovernmental assurance agreement signed.' },
      { when: '2024.9', ko: 'NVIDIA와 Earth-2 Climate Tech Lab 설립 — 기상 AI 진입.', en: 'Earth-2 Climate Tech Lab launched with NVIDIA — entry into weather AI.' },
      { when: '2025.3', ko: 'Inception이 CorrDiff 지역 특화 200m 초국지 예보 상용 공개.', en: 'Inception ships a region-tuned CorrDiff 200m hyper-local forecast system.' },
      { when: '2025.5', ko: 'Stargate UAE 발표 (OpenAI·Oracle·NVIDIA·Cisco·SoftBank).', en: 'Stargate UAE announced (OpenAI, Oracle, NVIDIA, Cisco, SoftBank).' },
      { when: '2025', ko: '미 상무부 NVIDIA 첨단칩(GB300 등) 대규모 수출 승인 확보.', en: 'Secures US Commerce approval for large-scale NVIDIA advanced-chip exports (GB300 etc.).' },
    ],
    verified: [
      { ko: '생성형 다운스케일링으로 200m급 도시 예보가 상용 수준에서 작동한다는 것', en: 'That generative downscaling delivers 200m-class city forecasts at commercial quality' },
      { ko: 'UAE 안개 예보에서 정확도 개선 — 기존 수치예보(NWP) 대비 속도·비용 우위 주장', en: 'Accuracy gains on UAE fog forecasting, with claimed speed/cost advantage over conventional NWP' },
      { ko: '국가기상청(NCM)과 민간 AI 기업의 역할 분담 모델이 성립한다는 것', en: 'That a division of labour between a national met service (NCM) and a private AI firm holds up' },
    ],
    open: [
      { ko: '다른 기후대에서의 일반화 성능 — 검증 실적이 사막 기후(안개) 중심', en: 'Generalisation to other climate zones — validation so far is desert-climate (fog) centric' },
      { ko: '인프라 수출 모델의 실제 수주 실적 — Global South 확장은 공표 단계', en: 'Actual wins for the infrastructure-export model — Global South expansion is announced, not booked' },
      { ko: '기상사업 단독 매출 규모 — 그룹 내 응용 분야로 분리 공시되지 않음', en: 'Standalone weather revenue — not disclosed separately within the group' },
    ],
    markets: [
      { ko: '항공 — 공항 주변 급변 기상(안개), 비행계획·지연 감소', en: 'Aviation — rapid-onset airport weather (fog), flight planning, delay reduction' },
      { ko: '도로·물류 — 노면·시정 위험 예보', en: 'Road & logistics — surface and visibility risk' },
      { ko: '에너지 — 재생에너지 발전량 예측, 전력망 최적화', en: 'Energy — renewable output forecasting, grid optimisation' },
      { ko: '보험 — 극한 기상 리스크 평가·언더라이팅', en: 'Insurance — extreme-weather risk assessment and underwriting' },
      { ko: '공공·도시 — 조기경보, 재난 대비, 인프라 복원력', en: 'Public & urban — early warning, disaster preparedness, resilience' },
      { ko: '수출 — 아프리카·남아시아·동남아 기후취약국', en: 'Export — climate-vulnerable states in Africa, South Asia, Southeast Asia' },
    ],
    read: [
      {
        ko: '경쟁 지점이 인프라가 아니라 데이터로 이동한다. G42는 컴퓨트에서 압도적이지만 자체 지상 관측망이 없다. 다운스케일링 모델의 학습·검증 품질은 고밀도 지상 실측에 좌우된다.',
        en: 'The contest moves from infrastructure to data. G42 dominates on compute but owns no ground observation network — and downscaling quality is bounded by dense ground truth.',
      },
      {
        ko: '국가기상청을 경쟁자가 아니라 검증·공신력 파트너로 세운 구도(NCM 모델)가 마찰을 줄였다. 기상 AI에서 반복될 표준 구조로 보인다.',
        en: 'Framing the national met service as a validation partner rather than a competitor (the NCM model) reduced friction — likely the repeating standard structure in weather AI.',
      },
      {
        ko: '첫 실증을 “안개”라는 단일 국지 현상으로 좁힌 것이 주효했다. 전면적 예보 성능 경쟁을 피하고 한 가지 킬러 케이스로 상용성을 증명했다.',
        en: 'Narrowing the first proof to a single local phenomenon (fog) worked — it sidestepped a head-on forecast-skill race and proved commercial value on one killer case.',
      },
    ],
    sources: [
      { name: 'G42 · NVIDIA 공동 발표 (Earth-2 Climate Tech Lab)', name_en: 'G42 · NVIDIA joint announcement (Earth-2 Climate Tech Lab)', when: '2024.9' },
      { name: 'Inception 초국지 예보 시스템 공개 자료', name_en: 'Inception hyper-local forecast system release materials', when: '2025.3' },
      { name: 'Microsoft 투자 발표 · 미·UAE 정부간 보증 협정 보도', name_en: 'Microsoft investment announcement · US–UAE assurance agreement reporting', when: '2024.4' },
      { name: 'Stargate UAE 발표 (OpenAI·Oracle·NVIDIA·Cisco·SoftBank)', name_en: 'Stargate UAE announcement (OpenAI, Oracle, NVIDIA, Cisco, SoftBank)', when: '2025.5' },
    ],
    updated: '2026-08-07',
  },
]

export const CASES_META = {
  updated: '2026-08-07',
  ko_note:
    '공개 자료(기업·기관 발표, 언론 보도) 기반으로 정리했다. 재무 등 비공개 정보는 포함하지 않는다. 「검증된 것」과 「아직 검증되지 않은 것」을 분리하고, 우리 해석은 자체 해석으로 별도 표기한다.',
  en_note:
    'Compiled from public sources (company/agency announcements, press). No non-public financials. What is proven and what is not are kept separate, and our own reading is labelled as interpretation.',
}

/* 유형별 사례 수 — 필터 칩 배지용 */
export function countByType(cases = GLOBAL_CASES) {
  const out = {}
  for (const c of cases) out[c.type] = (out[c.type] ?? 0) + 1
  return out
}

/* 비교표에서 실제로 값이 하나라도 있는 계층만 노출 (사례가 적을 때 빈 행 방지) */
export function activeLayers(cases = GLOBAL_CASES) {
  return STACK_LAYERS.filter((l) => cases.some((c) => c.stack?.[l.key]))
}
