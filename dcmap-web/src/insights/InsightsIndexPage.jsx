import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { INSIGHTS } from '../content/insights_meta.js'
import AiDraftTool from '../ai/AiDraftTool.jsx'

const TITLE = '인사이트 — AI InfraMap'
const DESC = '데이터센터 입지·전력·민원·기상을 둘러싼 논쟁을 공개 데이터로 정리하는 AI InfraMap 인사이트.'

// 카테고리 표시 순서(건수 무관, 논리 순서)
const CAT_ORDER = ['전력·계통', '정책·인허가', '입지·토지', '냉각·설비', '안보·지정학']

const EN_COUNT = INSIGHTS.filter((a) => a.en).length

export default function InsightsIndexPage() {
  const [cat, setCat] = useState('전체')
  const [lang, setLang] = useState('ko')
  const en = lang === 'en'
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
  const list = useMemo(() => {
    if (en) return INSIGHTS.filter((a) => a.en) // EN: English-available only
    return cat === '전체' ? INSIGHTS : INSIGHTS.filter((a) => a.category === cat)
  }, [cat, en])

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="ins-head-row">
          <div>
            <div className="eyebrow">INSIGHTS</div>
            <h1>{en ? 'Insights' : '인사이트'}</h1>
          </div>
          <div className="ins-lang">
            <button type="button" className={`rlang-btn${!en ? ' on' : ''}`} onClick={() => setLang('ko')}>KO</button>
            <button type="button" className={`rlang-btn${en ? ' on' : ''}`} onClick={() => setLang('en')}>EN <span className="ins-lang-n">{EN_COUNT}</span></button>
          </div>
        </div>
        <p className="sub">
          {en
            ? `English summaries of ${EN_COUNT} flagship briefs — Korea AI-datacenter siting, power and investment. Full articles are in Korean.`
            : DESC}
        </p>

        {!en && <AiDraftTool />}

        {!en && (
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
        )}

        <div className="facility-list stagger-in" key={cat + lang}>
          {list.map((a) => (
            <Link key={a.slug} className="facility-row" to={`/insights/${a.slug}`}>
              <span>
                <span className="name">
                  {en && <span className="insight-tag insight-tag-en">EN</span>}
                  {!en && a.category && <span className="insight-tag">{a.category}</span>}
                  {en ? a.enTitle || a.title : a.title}
                </span>
                <span className="meta">{a.date}</span>
                {(en ? a.en : a.description) && <span className="row-desc">{en ? a.en : a.description}</span>}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
