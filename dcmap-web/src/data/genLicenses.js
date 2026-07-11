// 3MW 초과 발전사업 허가 명단 v2 — 파생 집계 (명당 D1 발전 트랙 시드)
// 원문: 발전사업 허가대장(2026-04-17 기준) PDF, ToUnicode 임베드본 → 파싱 신뢰.
// 정직성(SPEC §0-1): 건수 기준 집계·연료원·허가일은 신뢰. 개별 MW는 참고치(needs_verify)로만 표기.
import raw from '../../data/gen_licenses_v2.json'

export const GEN_LICENSE_META = {
  source: raw.source,
  note: raw.note,
  total: raw.total_records,
  renewableSharePct: raw.renewable_share_pct,
}

// 연료원별 등재 건수 (누적) — 내림차순
export const GEN_FUEL_TOTALS = Object.entries(raw.fuel_totals)
  .map(([fuel, count]) => ({ fuel, count }))
  .sort((a, b) => b.count - a.count)

// 허가일 2024+ 파이프라인 (D1) — 최신순
export const GEN_RECENT = [...raw.recent].sort((a, b) =>
  (b.date || '').localeCompare(a.date || ''),
)

// 최근 파이프라인 연료 구성
export const GEN_RECENT_BY_FUEL = (() => {
  const m = new Map()
  for (const r of GEN_RECENT) if (r.fuel) m.set(r.fuel, (m.get(r.fuel) || 0) + 1)
  return [...m.entries()].map(([fuel, count]) => ({ fuel, count })).sort((a, b) => b.count - a.count)
})()

// 최근 파이프라인 시도 구성 (재생E 벨트 = 비수도권 정합 신호)
export const GEN_RECENT_BY_SIDO = (() => {
  const m = new Map()
  for (const r of GEN_RECENT) if (r.sido) m.set(r.sido, (m.get(r.sido) || 0) + 1)
  return [...m.entries()].map(([sido, count]) => ({ sido, count })).sort((a, b) => b.count - a.count)
})()

const CAPITAL = new Set(['서울', '경기', '인천'])
export const GEN_RECENT_NONCAPITAL_PCT = (() => {
  const tagged = GEN_RECENT.filter((r) => r.sido)
  if (!tagged.length) return null
  const nc = tagged.filter((r) => !CAPITAL.has(r.sido)).length
  return Math.round((nc / tagged.length) * 100)
})()

// 연도별 신재생 vs 비신재생 건수 (트렌드 미니차트용)
const RENEW = new Set(['풍력', '해상풍력', '육상풍력', '태양광', '연료전지', '바이오', '수력', '수소', 'BESS'])
export const GEN_YEAR_TREND = Object.entries(raw.by_year)
  .map(([year, fuels]) => {
    let renew = 0
    let other = 0
    for (const [f, c] of Object.entries(fuels)) (RENEW.has(f) ? (renew += c) : (other += c))
    return { year: Number(year), renew, other, total: renew + other }
  })
  .filter((d) => d.year >= 2010)
  .sort((a, b) => a.year - b.year)
