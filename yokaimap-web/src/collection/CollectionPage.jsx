import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { YOKAI, CATEGORIES, CAT } from '../data/yokai.js'
import { readCollection, clearCollection } from '../hunt/collection.js'
import CollectorCard from '../ui/CollectorCard.jsx'
import { useLightbox } from '../ui/Lightbox.jsx'
import Seal from '../ui/Seal.jsx'
import Icon from '../ui/Icon.jsx'
import { useHead } from '../ui/useHead.js'

/* 번호는 id 정렬 순서로 고정한다. 데이터가 늘어도 기존 번호가 밀리지 않아야
   "No.007을 모았다"가 계속 같은 대상을 가리킨다. */
const ORDERED = [...YOKAI].sort((a, b) => a.id.localeCompare(b.id))
const NO_OF = new Map(ORDERED.map((e, i) => [e.id, i + 1]))

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'owned', label: '수집함' },
  { id: 'missing', label: '미수집' },
]

export default function CollectionPage() {
  const [caught, setCaught] = useState(readCollection)
  const [filter, setFilter] = useState('all')
  const [cat, setCat] = useState(null)

  useHead({
    title: '수집첩 — 한국요괴지도',
    description: `요괴 ${YOKAI.length}체 중 내가 모은 것. 탐사에서 만난 요괴가 번호가 붙은 컬렉터 카드로 쌓입니다.`,
  })

  const ownedCount = Object.keys(caught).length

  const byCategory = useMemo(() => {
    const m = {}
    for (const c of CATEGORIES) m[c.id] = { total: 0, owned: 0 }
    for (const e of ORDERED) {
      const b = m[e.category]
      if (!b) continue
      b.total++
      if (caught[e.id]) b.owned++
    }
    return m
  }, [caught])

  const shown = useMemo(
    () =>
      ORDERED.filter((e) => {
        if (cat && e.category !== cat) return false
        const owned = Boolean(caught[e.id])
        if (filter === 'owned') return owned
        if (filter === 'missing') return !owned
        return true
      }),
    [caught, filter, cat],
  )

  /* 도판은 수집한 카드에만 있다. 미수집까지 넘기면 ←/→가 빈칸을 건너뛰느라 순서가 튄다. */
  const owned = useMemo(() => shown.filter((e) => caught[e.id]), [shown, caught])
  const { openPlate, lightbox } = useLightbox(owned)

  return (
    <main className="page">
      <p className="eyebrow">수집첩</p>
      <h1 style={{ margin: '4px 0 var(--sp-3)' }}>
        모은 요괴 <span className="num">{ownedCount}</span>
        <span className="muted num"> / {YOKAI.length}</span>
      </h1>
      <p className="body-text" style={{ maxWidth: 'var(--read-max)' }}>
        <Link to="/hunt">탐사</Link>에서 만난 요괴가 번호가 붙은 카드로 쌓입니다. 번호는 도감 순서로 고정되어 있어
        비어 있는 자리가 그대로 보입니다.
      </p>

      <div className="progress" style={{ marginTop: 'var(--sp-3)' }}>
        <span style={{ width: `${(ownedCount / YOKAI.length) * 100}%` }} />
      </div>

      {/* 분류별 진행도 — 어느 계열이 비었는지가 다음 목표가 된다 */}
      <div className="cc-progress" style={{ marginTop: 'var(--sp-4)' }}>
        {CATEGORIES.map((c) => {
          const b = byCategory[c.id] ?? { total: 0, owned: 0 }
          const full = b.total > 0 && b.owned === b.total
          return (
            <button
              key={c.id}
              type="button"
              className={`cc-prog${full ? ' full' : ''}`}
              style={{ '--cat': c.color, ...(cat === c.id ? { borderColor: c.color } : null) }}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              aria-pressed={cat === c.id}
            >
              <Seal category={c.id} size="sm" />
              <span>{c.name}</span>
              <span className="done num">
                {b.owned}/{b.total}
              </span>
            </button>
          )
        })}
      </div>

      <div className="row" style={{ marginTop: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip${filter === f.id ? ' on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        {cat && (
          <button type="button" className="chip" onClick={() => setCat(null)}>
            <Icon name="close" size={13} /> {CAT[cat]?.name} 해제
          </button>
        )}
        <span className="spacer" />
        {ownedCount > 0 && (
          <button
            type="button"
            className="chip"
            onClick={() => {
              if (confirm('수집 기록을 모두 지웁니다. 되돌릴 수 없습니다.')) {
                clearCollection()
                setCaught({})
              }
            }}
          >
            기록 지우기
          </button>
        )}
      </div>

      {ownedCount === 0 && (
        <div className="notice accent" style={{ marginTop: 'var(--sp-4)' }}>
          아직 모은 요괴가 없습니다. <Link to="/hunt">탐사</Link>에서 지금 내 권역에 나타난 요괴를 기록해 보세요.
        </div>
      )}

      <div className="cc-grid" style={{ marginTop: 'var(--sp-4)' }}>
        {shown.map((e) => (
          <CollectorCard
            key={e.id}
            entry={e}
            no={NO_OF.get(e.id)}
            total={YOKAI.length}
            owned={Boolean(caught[e.id])}
            onZoom={openPlate}
          />
        ))}
      </div>

      {shown.length === 0 && (
        <p className="muted" style={{ marginTop: 'var(--sp-4)' }}>
          조건에 맞는 카드가 없습니다.
        </p>
      )}

      <p className="small muted" style={{ marginTop: 'var(--sp-5)' }}>
        수집 기록은 이 브라우저에만 저장됩니다. 기기를 옮기거나 저장소를 지우면 사라집니다.
      </p>
      {lightbox}
    </main>
  )
}
