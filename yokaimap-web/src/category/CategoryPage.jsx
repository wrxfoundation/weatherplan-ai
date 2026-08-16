import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { YOKAI, CAT, CATEGORIES } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'
import Seal from '../ui/Seal.jsx'
import AdSlot from '../ui/AdSlot.jsx'
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
        <p>
          <Link to="/dogam">도감으로</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="page" style={{ '--cat': category.color }}>
      <p className="crumbs">
        <Link to="/dogam">도감</Link>
      </p>

      <div className="detail-hero">
        <Seal category={category.id} size="xl" />
        <div>
          <h1 style={{ fontSize: 'var(--text-h1)' }}>{category.name}</h1>
          <p className="body-text" style={{ margin: '4px 0 0', maxWidth: 'var(--read-max)' }}>
            {category.blurb}
          </p>
          <div className="small muted" style={{ marginTop: 6 }}>
            일본 요괴 분류 대응: {category.jp_counterpart} · 수록 {list.length}체
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 'var(--sp-5)' }}>
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      <AdSlot slot="category-footer" />

      <section className="section">
        <div className="section-head">
          <h2>다른 분류</h2>
        </div>
        <div className="row">
          {CATEGORIES.filter((c) => c.id !== id).map((c) => (
            <Link key={c.id} className="chip" style={{ '--cat': c.color }} to={`/category/${c.id}`}>
              <Seal category={c.id} size="sm" />
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
