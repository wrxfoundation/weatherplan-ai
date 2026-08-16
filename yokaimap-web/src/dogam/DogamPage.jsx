import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { YOKAI, CATEGORIES, RARITY, REGIONS, applyFilters, countByCategory, META } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'

export default function DogamPage() {
  const [params, setParams] = useSearchParams()
  const [cats, setCats] = useState(() => new Set(params.get('cat') ? params.get('cat').split(',') : []))
  const [rarities, setRarities] = useState(() => new Set())
  const [sido, setSido] = useState(params.get('sido') ?? '')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [showLow, setShowLow] = useState(true)

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
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    setParams(next, { replace: true })
  }

  return (
    <main className="page">
      <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-h1)' }}>요괴도감</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        공개 자료에 근거가 있는 {META.count}체. 모든 항목에 출처와 검증등급을 표기하고, 근거가 약한 항목은 숨기지 않고
        등급을 낮춰 표시합니다.
      </p>

      <div className="panel" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
        <div className="row">
          <input
            className="search"
            placeholder="이름·이표기·특징 검색 (예: 도깨비, 여우, 바람)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              sync({ q: e.target.value })
            }}
          />
          <select
            className="search"
            style={{ flex: '0 0 140px' }}
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

        <div className="row" style={{ marginTop: 'var(--sp-2)' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${cats.has(c.id) ? ' on' : ''}`}
              style={{ '--chip-color': c.color }}
              onClick={() => {
                toggle(setCats)(c.id)
              }}
              title={c.blurb}
            >
              <span className="dot" />
              {c.name} {counts[c.id] ?? 0}
            </button>
          ))}
        </div>

        <div className="row" style={{ marginTop: 'var(--sp-2)' }}>
          {RARITY.map((r) => (
            <button
              key={r.id}
              className={`chip${rarities.has(r.id) ? ' on' : ''}`}
              style={{ '--chip-color': r.color }}
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
          <span className="small muted">{list.length}체</span>
        </div>
      </div>

      <div className="card-grid">
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      {list.length === 0 && <p className="muted">조건에 맞는 항목이 없습니다.</p>}

      <div className="section">
        <h2>지역별로 보기</h2>
        <div className="row">
          {REGIONS.map((r) => (
            <Link key={r.slug} className="chip" to={`/region/${r.slug}`}>
              {r.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
