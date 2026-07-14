// 전력계통영향평가 1차 기술검토 현황 — 데이터센터, 2026.3.27 기준. 신·증설 용량(MW).
// 분산에너지 활성화 특별법 제6장 전력계통영향평가 시범운영. 한전 1차 기술검토(전력공급 가능/불가) 결과.
// DC 신청 대비 '공급가능/공급불가' MW → 승인율=가능/(가능+불가). 지역 계통 병목의 실측(규제) 신호.
// 정직성: 신청 시점까지의 누적 심사치이며 특정 부지의 개별 가부는 한전 1차 기술검토(주소 기준)로 확정됨.
export const GRID_ASSESSMENT_META = {
  source: '한국전력공사 전력계통영향평가 1차 기술검토 현황(데이터센터, 2026.3.27 기준)',
  asOf: '2026.3.27',
  note: 'DC 신·증설 용량 기준 공급가능/불가(MW). 승인율=가능/(가능+불가). 지역 계통 병목의 규제 실측 신호.',
}

// [시도, DC 공급가능 MW, DC 공급불가 MW] — 2-2 표 데이터센터 열(2026.3.27)
const R = [
  ['서울', 744.2, 501.005],
  ['경기', 13606.45, 15919.144],
  ['인천', 1191, 1630],
  ['부산', 2575, 754.05],
  ['울산', 1300, 40],
  ['대구', 120, 0],
  ['광주', 530, 0],
  ['대전', 221, 400],
  ['세종', 661, 500],
  ['강원', 1140, 120],
  ['전북', 534.2, 330],
  ['전남', 3102, 440],
  ['충북', 2100, 0],
  ['충남', 2040, 120],
  ['경북', 710, 0],
  ['경남', 1865, 0],
  ['제주', 510, 560],
]

function rate(able, unable) {
  const t = able + unable
  return t > 0 ? Math.round((able / t) * 1000) / 10 : null
}

export const DC_ASSESSMENT = Object.fromEntries(
  R.map(([sido, able, unable]) => [sido, { sido, able, unable, ratePct: rate(able, unable) }]),
)

// 전국/수도권/비수도권 합계(2026.3.27 데이터센터)
export const DC_ASSESSMENT_ROLLUP = {
  전국: { able: 32949.85, unable: 21314.199, ratePct: rate(32949.85, 21314.199) },
  수도권: { able: 15541.65, unable: 18050.149, ratePct: rate(15541.65, 18050.149) },
  비수도권: { able: 17408, unable: 3264.05, ratePct: rate(17408, 3264.05) },
}

/** 시도 → DC 공급 심사({sido, able, unable, ratePct}) 또는 null */
export function dcApprovalForSido(sido) {
  return sido ? DC_ASSESSMENT[sido] || null : null
}

// 전력계통영향평가 시범운영 본심사(위원회) 결과 — 2026.5 기후에너지환경부 공표(심사기간 2025.8~2026.3).
// 1차 기술검토(위 R 표)와 다른 단계: 기술검토 통과 후 위원회 본심사의 통과/부결.
// 출처: 기후에너지환경부 자료 보도(머니투데이 2026-05-23). 수치는 공표값 그대로(가공·추정 없음).
export const PSIA_REVIEW_2026 = {
  asOf: '2025.8–2026.3 (2026.5 공표)',
  source: '기후에너지환경부 시범운영 결과 (머니투데이 2026-05-23 보도)',
  sourceUrl: 'https://www.mt.co.kr/tech/2026/05/23/2026052210211399740',
  capital: { applied: 522, reviewed: 24, passed: 10 }, // 수도권: 1차 신청 522 → 본심사 24 → 통과 10 (신청 대비 1.9%)
  nonCapital: { reviewed: 29, passed: 26 }, // 비수도권: 본심사 29 → 통과 26 (89.7%)
  capitalUnableSharePct: 91.2, // 전국 공급불가 판정 중 수도권 비중
}

/** DC 승인율(%) → 정성 라벨 */
export function approvalLabel(pct) {
  if (pct == null) return null
  if (pct >= 90) return '공급 원활'
  if (pct >= 70) return '대체로 가능'
  if (pct >= 50) return '혼재'
  if (pct >= 30) return '계통 병목'
  return '심각 병목'
}
