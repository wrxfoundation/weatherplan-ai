import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { YOKAI, CAT, CATEGORIES } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { categoryJsonLd } from '../seo.js'

export default function CategoryPage() {
  const { id } = useParams()
  const category = CAT[id]
  const list = useMemo(() => YOKAI.filter((e) => e.category === id), [id])

  useHead(
    category
      ? {
          title: `${category.name} — 한국요괴도감`,
          description: `${category.blurb} 공개 자료 기반 ${list.length}체 수록.`,
          canonical: `/category/${id}`,
          jsonLd: categoryJsonLd(category, list, SITE_ORIGIN),
        }
      : { title: '분류를 찾을 수 없음 — 한국요괴지도' },
  )

  if (!category) {
    return (
      <main className="page">
        <h1>없는 분류입니다</h1>
        <Link to="/dogam">도감으로</Link>
      </main>
    )
  }

  return (
    <main className="page">
      <p className="small muted" style={{ margin: 0 }}>
        <Link to="/dogam">도감</Link>
      </p>
      <h1 style={{ margin: '4px 0', fontSize: 'var(--text-h1)', color: category.color }}>
        {category.glyph} {category.name}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {category.blurb}
      </p>
      <p className="small muted">
        일본 요괴 분류 대응: {category.jp_counterpart} · 수록 {list.length}체
      </p>

      <div className="card-grid" style={{ marginTop: 'var(--sp-4)' }}>
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      <div className="section">
        <h2>다른 분류</h2>
        <div className="row">
          {CATEGORIES.filter((c) => c.id !== id).map((c) => (
            <Link key={c.id} className="chip" style={{ '--chip-color': c.color }} to={`/category/${c.id}`}>
              <span className="dot" />
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
