// 3MW 초과 발전사업 허가 명단 v2 — 파생 집계 (AI InfraMap D1 발전 트랙 시드)
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

// 시도 중심좌표 — 개별 지번좌표가 없는 허가 레코드를 시도 단위 버블로 집계(정직: 건수 기준, 가짜 점 없음)
export const SIDO_CENTROIDS = {
  서울: [37.5665, 126.978], 부산: [35.1796, 129.0756], 대구: [35.8714, 128.6014],
  인천: [37.4563, 126.7052], 광주: [35.1595, 126.8526], 대전: [36.3504, 127.3845],
  울산: [35.5384, 129.3114], 세종: [36.4801, 127.289], 경기: [37.4138, 127.5183],
  강원: [37.8228, 128.1555], 충북: [36.8, 127.7], 충남: [36.5184, 126.8],
  전북: [35.7175, 127.153], 전남: [34.8679, 126.991], 경북: [36.4919, 128.8889],
  경남: [35.4606, 128.2132], 제주: [33.4996, 126.5312],
}
const RENEW_SET = new Set(['풍력', '해상풍력', '육상풍력', '태양광', '연료전지', '바이오', '수력', '수소', 'BESS'])

// 허가 2024+ 시도 버블 — 맵 오버레이용 [{sido, lat, lng, count, renew, topFuel}]
export const GEN_PERMIT_BUBBLES = (() => {
  const agg = new Map()
  for (const r of GEN_RECENT) {
    const c = SIDO_CENTROIDS[r.sido]
    if (!c) continue
    if (!agg.has(r.sido)) agg.set(r.sido, { sido: r.sido, lat: c[0], lng: c[1], count: 0, renew: 0, mw: 0, fuels: new Map() })
    const a = agg.get(r.sido)
    a.count += 1
    if (RENEW_SET.has(r.fuel)) a.renew += 1
    if (typeof r.mw === 'number') a.mw += r.mw
    if (r.fuel) a.fuels.set(r.fuel, (a.fuels.get(r.fuel) || 0) + 1)
  }
  return [...agg.values()].map((a) => ({
    sido: a.sido, lat: a.lat, lng: a.lng, count: a.count, renew: a.renew, mw: Math.round(a.mw),
    topFuel: [...a.fuels.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] || null,
  })).sort((a, b) => b.count - a.count)
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
