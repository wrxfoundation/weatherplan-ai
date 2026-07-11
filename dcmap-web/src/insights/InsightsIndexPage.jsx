import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { INSIGHTS } from '../content/insights_meta.js'

const TITLE = '인사이트 — AI InfraMap'
const DESC = '데이터센터 입지·전력·민원·기상을 둘러싼 논쟁을 공개 데이터로 정리하는 AI InfraMap 인사이트.'

// 카테고리 표시 순서(건수 무관, 논리 순서)
const CAT_ORDER = ['전력·계통', '정책·인허가', '입지·토지', '냉각·설비', '안보·지정학']

export default function InsightsIndexPage() {
  const [cat, setCat] = useState('전체')
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  const counts = useMemo(() => {
    const m = new Map()
    for (const a of INSIGHTS) m.set(a.category, (m.get(a.category) || 0) + 1)
    return m
  }, [])
  const cats = useMemo(() => CAT_ORDER.filter((c) => counts.has(c)), [counts])
  const list = useMemo(
    () => (cat === '전체' ? INSIGHTS : INSIGHTS.filter((a) => a.category === cat)),
    [cat],
  )

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">INSIGHTS</div>
        <h1>인사이트</h1>
        <p className="sub">{DESC}</p>

        <div className="seg-tabs" role="tablist" aria-label="인사이트 주제 분류">
          <button type="button" role="tab" className={`seg-tab ${cat === '전체' ? 'on' : ''}`} onClick={() => setCat('전체')} aria-selected={cat === '전체'}>
            전체 <span className="n">{INSIGHTS.length}</span>
          </button>
          {cats.map((c) => (
            <button key={c} type="button" role="tab" className={`seg-tab ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)} aria-selected={cat === c}>
              {c} <span className="n">{counts.get(c)}</span>
            </button>
          ))}
        </div>

        <div className="facility-list">
          {list.map((a) => (
            <Link key={a.slug} className="facility-row" to={`/insights/${a.slug}`}>
              <span>
                <span className="name">
                  {a.category && <span className="insight-tag">{a.category}</span>}
                  {a.title}
                </span>
                <span className="meta">
                  {a.date} · {a.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
