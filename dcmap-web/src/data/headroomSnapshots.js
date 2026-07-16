// 변전소 여유 월별 스냅샷 로더 — data/headroom_snapshots/*.json (데이터 자산화 P1).
// 정직성: 스냅샷은 한전ON '변전소 검색' 여유용량의 시점 캡처. 0=당해 여유 없음, 전기사용신청 후 확정.
// vite import.meta.glob로 신규 월 파일 자동 편입 → 수동 코드 수정 없이 시계열 확장.
// 시계열(월별 추이)은 P3 '변화 피드(diff)'와 모니터링 구독 상품의 기반이 된다.
const files = import.meta.glob('../../data/headroom_snapshots/*.json', { eager: true })

export const SNAPSHOTS = Object.entries(files)
  .map(([path, mod]) => ({ month: path.match(/(\d{4}-\d{2})\.json$/)?.[1], ...(mod.default || mod) }))
  .filter((s) => s.month)
  .sort((a, b) => a.month.localeCompare(b.month))

export const SNAPSHOT_MONTHS = SNAPSHOTS.map((s) => s.month)
export const SNAPSHOT_COUNT = SNAPSHOTS.length
export const LATEST_SNAPSHOT = SNAPSHOTS[SNAPSHOTS.length - 1] ?? null

// 변전소명 → 월별 최대여유(MW) 추이. 스냅샷이 2개월+ 쌓이면 변화(delta) 감지에 사용.
export function headroomTrend(name) {
  return SNAPSHOTS.map((s) => {
    const e = (s.entries || []).find((x) => x.name === name)
    return { month: s.month, maxMw: e ? Math.max(...e.series) : null }
  }).filter((p) => p.maxMw != null)
}

// 직전 스냅샷 대비 변화(P3 변화 피드 프리뷰) — 스냅샷 1개월뿐이면 빈 배열.
export function latestDeltas() {
  if (SNAPSHOTS.length < 2) return []
  const prev = SNAPSHOTS[SNAPSHOTS.length - 2]
  const cur = LATEST_SNAPSHOT
  const prevMap = Object.fromEntries((prev.entries || []).map((e) => [e.name, Math.max(...e.series)]))
  return (cur.entries || [])
    .map((e) => {
      const now = Math.max(...e.series)
      const was = prevMap[e.name]
      return was == null ? null : { name: e.name, was, now, delta: now - was }
    })
    .filter((d) => d && d.delta !== 0)
}
