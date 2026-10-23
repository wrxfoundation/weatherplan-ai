// 변전소 여유 월별 스냅샷 본문 — data/headroom_snapshots/*.json (데이터 자산화).
// 정직성: 한전ON '변전소 검색' 여유용량의 시점 캡처. 0=당해 여유 없음, 전기사용신청 후 확정.
// ⚠ 본문이 월 ~80KB씩 쌓이므로 지연 로딩 페이지(데이터 탐색기·대시보드·지역·파트너)에서만 import 할 것.
//   메인 번들(지도·푸터·최신성 칩)은 목록만 담은 headroomSnapshotIndex.js를 쓴다.
import { changeFeed, sigunguSummary, entriesOf } from './headroomLogic.js'

const files = import.meta.glob('../../data/headroom_snapshots/*.json', { eager: true })

export const SNAPSHOTS = Object.entries(files)
  .map(([path, mod]) => ({ month: path.match(/(\d{4}-\d{2})\.json$/)?.[1], ...(mod.default || mod) }))
  .filter((s) => s.month)
  .sort((a, b) => a.month.localeCompare(b.month))

export const SNAPSHOT_MONTHS = SNAPSHOTS.map((s) => s.month)
export const SNAPSHOT_COUNT = SNAPSHOTS.length
export const LATEST_SNAPSHOT = SNAPSHOTS[SNAPSHOTS.length - 1] ?? null
export const PREV_SNAPSHOT = SNAPSHOTS[SNAPSHOTS.length - 2] ?? null

/** 최신 스냅샷의 변전소 항목(v1·v2 정규화) */
export const LATEST_ENTRIES = entriesOf(LATEST_SNAPSHOT)

/** 직전 스냅샷 대비 변화(연도·흐름 단위) */
export const LATEST_CHANGES = changeFeed(PREV_SNAPSHOT, LATEST_SNAPSHOT)

/** DC 입지 시군구별 154kV 수전 여유 요약 */
export const SIGUNGU_HEADROOM = sigunguSummary(LATEST_SNAPSHOT)

// 하위 호환 — 변전소명 → 월별 최대여유 추이(재생e 연계 흐름 기준, v1 시드와 같은 지표)
export function headroomTrend(name) {
  return SNAPSHOTS.map((s) => {
    const e = entriesOf(s).find((x) => x.name === name)
    const series = e?.renew ?? e?.supply
    return { month: s.month, maxMw: series ? Math.max(...series) : null }
  }).filter((p) => p.maxMw != null)
}
