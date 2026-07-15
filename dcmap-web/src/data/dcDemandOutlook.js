// 국내 DC 수요(전기사용신청) vs 한전 공급가능전력 전망 — MW.
// 원출처: 산업통상자원부 제11차 전력수급기본계획·PwC analysis (삼일PwC 2026.3 리포트 p.19·21 재인용).
// 정직성: '수요'는 한전에 제출된 DC 전기사용신청 총량 — 실제 착공·수전과 다르며,
// 지자체 추진 28개 프로젝트 대부분이 수전용량 미확정이라 보수적 해석 필요(원문 명시).
export const DC_DEMAND_OUTLOOK_META = {
  source: '산업통상자원부 제11차 전력수급기본계획 · PwC analysis (삼일PwC 2026.3 재인용)',
  note: '수요=한전 제출 DC 전기사용신청, 공급=한전 공급 가능 전력량. F=전망.',
}

// [연도, 수요MW(전기사용신청), 공급가능MW, 전망여부]
const R = [
  [2023, 906, 776, false],
  [2024, 2724, 2514, false],
  [2025, 4866, 3738, true],
  [2026, 6531, 4578, true],
  [2027, 7343, 4718, true],
]

export const DC_DEMAND_OUTLOOK = R.map(([y, demandMw, supplyMw, forecast]) => ({
  y,
  demandMw,
  supplyMw,
  forecast,
  gapMw: demandMw - supplyMw,
}))
