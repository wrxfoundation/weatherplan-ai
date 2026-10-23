import { Link } from 'react-router-dom'
import { DATASETS, judge, STATUS, behindLabel } from '../data/freshness.js'
import { LATEST_MONTH } from '../data/headroomSnapshotIndex.js'
import { useMapLang } from '../i18n/mapLang.js'

/* 데이터가 쓰이는 자리에 붙이는 기준일 칩 — 「기준 2026-05 · 3개월 지연」.
 * 지연·재확인일 때만 색을 띠고, 누르면 /data#freshness 표로 간다. */
export default function FreshnessChip({ id, className = '' }) {
  const en = useMapLang() === 'en'
  const ds = DATASETS.find((d) => d.id === id)
  if (!ds) return null
  const r = judge(ds, new Date(), { headroomLatest: LATEST_MONTH })
  const st = STATUS[r.status]
  const asOf = r.asOf
  const tail = r.status === 'overdue' ? behindLabel(ds, r, en) : r.status === 'review' || r.status === 'unknown' ? (en ? st.en : st.ko) : ''
  return (
    <Link
      to="/data#freshness"
      className={`fresh-inline tone-${tail ? st.tone : 'muted'} ${className}`}
      title={en ? 'Data freshness — see all datasets' : '데이터 최신성 — 전체 보기'}
    >
      {en ? 'as of' : '기준'} {asOf ?? (en ? 'n/a' : '미기록')}
      {tail && <> · {tail}</>}
    </Link>
  )
}
