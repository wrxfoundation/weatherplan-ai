import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { YOKAI, CATEGORIES, RARITY, REGIONS, applyFilters, countByCategory, META } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'
import Seal from '../ui/Seal.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'

export default function DogamPage() {
  const [params, setParams] = useSearchParams()
  const [cats, setCats] = useState(() => new Set(params.get('cat') ? params.get('cat').split(',') : []))
  const [rarities, setRarities] = useState(() => new Set())
  const [sido, setSido] = useState(params.get('sido') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [showLow, setShowLow] = useState(true)

  useHead({
    title: `한국요괴도감 — ${META.count}체 전체 목록`,
    description: `공개 자료에 근거가 있는 한국 요괴·신격 ${META.count}체 전체 목록. 분류·희귀도·지역으로 좁혀 보고, 각 항목의 출처와 검증등급을 확인할 수 있습니다.`,
    canonical: '/dogam',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: '한국요괴도감',
      url: `${SITE_ORIGIN}/dogam`,
      inLanguage: 'ko',
    },
  })

  const list = useMemo(
    () => applyFilters(YOKAI, { cats, rarities, sido, q, showLowConfidence: showLow }),
    [cats, rarities, sido, q, showLow],
  )
  const counts = useMemo(() => countByCategory(YOKAI), [])

  const toggle = (setter) => (id) =>
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const sync = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k))
    setParams(next, { replace: true })
  }

  const reset = () => {
    setCats(new Set())
    setRarities(new Set())
    setSido('')
    setQ('')
    setParams({}, { replace: true })
  }

  return (
    <main className="page">
      <p className="eyebrow">한국요괴도감</p>
      <h1 style={{ margin: '4px 0 var(--sp-2)', fontSize: 'var(--text-h1)' }}>{META.count}체 전체 목록</h1>
      <p className="body-text" style={{ maxWidth: 'var(--read-max)' }}>
        공개 자료에 근거가 있는 항목만 싣습니다. 근거가 약한 항목은 지우는 대신 검증등급을 낮춰 표시합니다.
      </p>

      <div className="panel" style={{ padding: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <input
            className="input"
            style={{ flex: '2 1 260px', width: 'auto' }}
            placeholder="이름·이표기·특징 검색 (예: 도깨비, 여우, 바람)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              sync({ q: e.target.value })
            }}
          />
          <select
            className="input"
            style={{ flex: '0 1 150px', width: 'auto' }}
            value={sido}
            onChange={(e) => {
              setSido(e.target.value)
              sync({ sido: e.target.value })
            }}
          >
            <option value="">전체 지역</option>
            {REGIONS.map((r) => (
              <option key={r.slug} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: 'var(--sp-3)', gap: 5 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${cats.has(c.id) ? ' on' : ''}`}
              style={{ '--cat': c.color }}
              onClick={() => toggle(setCats)(c.id)}
              title={c.blurb}
            >
              <span className="dot" />
              {c.name}
              <span className="cnt">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="row" style={{ marginTop: 'var(--sp-2)', gap: 5 }}>
          {RARITY.map((r) => (
            <button
              key={r.id}
              className={`chip${rarities.has(r.id) ? ' on' : ''}`}
              style={{ '--cat': r.color }}
              onClick={() => toggle(setRarities)(r.id)}
              title={r.desc}
            >
              {r.name}
            </button>
          ))}
          <button className={`chip${showLow ? ' on' : ''}`} onClick={() => setShowLow((v) => !v)}>
            이설·미검증 포함
          </button>
          <span className="spacer" />
          <span className="small muted num">{list.length}체</span>
          {(cats.size > 0 || rarities.size > 0 || sido || q) && (
            <button className="chip" onClick={reset}>
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 'var(--sp-4)' }}>
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">
          조건에 맞는 항목이 없습니다.{' '}
          <button className="chip" onClick={reset}>
            필터 초기화
          </button>
        </div>
      )}

      <AdSlot slot="dogam-footer" />

      <section className="section">
        <div className="section-head">
          <h2>지역별로 보기</h2>
        </div>
        <div className="row">
          {REGIONS.map((r) => (
            <Link key={r.slug} className="chip" to={`/region/${r.slug}`}>
              {r.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>분류별로 보기</h2>
        </div>
        <div className="row">
          {CATEGORIES.map((c) => (
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
