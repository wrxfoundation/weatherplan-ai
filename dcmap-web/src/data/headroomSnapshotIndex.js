// 변전소 여유 스냅샷 '목록'만 — 메인 번들(지도·푸터·최신성 칩)용.
// import.meta.glob(non-eager)은 파일 경로만 동기로 주고 내용은 불러오지 않는다.
// 스냅샷 본문(월 ~80KB씩 누적)은 headroomSnapshots.js — 지연 로딩 페이지에서만 쓴다.
const files = import.meta.glob('../../data/headroom_snapshots/*.json')

export const SNAPSHOT_MONTHS = Object.keys(files)
  .map((p) => p.match(/(\d{4}-\d{2})\.json$/)?.[1])
  .filter(Boolean)
  .sort()
export const SNAPSHOT_COUNT = SNAPSHOT_MONTHS.length
export const LATEST_MONTH = SNAPSHOT_MONTHS.at(-1) ?? null
