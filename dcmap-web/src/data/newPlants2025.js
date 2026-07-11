// 2025년도 신규 발전소 설치 현황 — 시도별 설비용량(KW)·개수 (공개 통계 흡수)
// 정직성: 원문 시도별 수치 그대로. 비수도권 비중은 용량 기준 계산값.
import raw from '../../data/new_plants_2025_v0.json'

export const NEW_PLANTS_2025_META = { source: raw.source, note: raw.note, asOf: raw.asOf }
export const NEW_PLANTS_2025 = raw.rows // [{ sido, capacityKw, count }] (용량 내림차순)
export const NEW_PLANTS_2025_TOTALS = {
  totalKw: raw.totalKw,
  totalMw: raw.totalMw,
  totalCount: raw.totalCount,
  nonCapitalPct: raw.nonCapitalPct,
}
