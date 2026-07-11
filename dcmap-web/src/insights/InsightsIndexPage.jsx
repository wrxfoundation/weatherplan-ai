import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { INSIGHTS } from '../content/insights_meta.js'

const TITLE = '인사이트 — AI InfraMap'
const DESC = '데이터센터 입지·전력·민원·기상을 둘러싼 논쟁을 공개 데이터로 정리하는 AI InfraMap 인사이트.'

export default function InsightsIndexPage() {
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">INSIGHTS</div>
        <h1>인사이트</h1>
        <p className="sub">{DESC}</p>
        <div className="facility-list">
          {INSIGHTS.map((a) => (
            <Link key={a.slug} className="facility-row" to={`/insights/${a.slug}`}>
              <span>
                <span className="name">{a.title}</span>
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
