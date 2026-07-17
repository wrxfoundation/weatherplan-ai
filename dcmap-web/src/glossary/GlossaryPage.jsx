import { useEffect, useMemo, useState } from 'react'
import TopBar from '../TopBar.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../content/glossary.js'
import GlossaryMap from './GlossaryMap.jsx'

const TITLE = '데이터센터 전력 인허가 용어집 — AI InfraMap'
const DESC =
  '계약전력·수전전압·전력계통영향평가·과부하율·PUE·프리쿨링 — 데이터센터 부지와 전력 인허가를 이해하는 데 필요한 용어를 공개 규정 기준으로 쉽게 풀었습니다.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function buildGlossaryJsonLd(origin = '') {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: '데이터센터 전력 인허가 용어집',
    description: DESC,
    url: `${origin}/glossary`,
    hasDefinedTerm: GLOSSARY.map((g) => ({
      '@type': 'DefinedTerm',
      '@id': `${origin}/glossary#${g.id}`,
      name: g.term,
      alternateName: g.en ?? undefined,
      description: g.def,
    })),
  }
}

export default function GlossaryPage() {
  const en = useMapLang() === 'en'
  const catLabel = (c) => (en ? c.labelEn ?? c.label : c.label)
  const [cat, setCat] = useState('전체')
  // 보기 모드 — 딕셔너리(리스트) / 온톨로지 맵(용어·법령 성좌). 선택 브라우저 저장.
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem('dcmap.glossaryView') === 'map' ? 'map' : 'dict'
    } catch {
      return 'dict'
    }
  })
  const setViewPersist = (v) => {
    setView(v)
    try {
      localStorage.setItem('dcmap.glossaryView', v)
    } catch {
      /* 저장 불가 무시 */
    }
  }
  const countOf = useMemo(() => {
    const m = new Map()
    for (const g of GLOSSARY) m.set(g.category, (m.get(g.category) || 0) + 1)
    return m
  }, [])
  const shownCats = cat === '전체' ? GLOSSARY_CATEGORIES : GLOSSARY_CATEGORIES.filter((c) => c.key === cat)
  useEffect(() => {
    document.title = TITLE
    setMeta('name', 'description', DESC)
    setMeta('property', 'og:title', TITLE)
    setMeta('property', 'og:description', DESC)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(buildGlossaryJsonLd())
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">GLOSSARY</div>
        <h1>{en ? 'Power Permitting · Datacenter Glossary' : '전력 인허가 · 데이터센터 용어집'}</h1>
        <p className="sub">
          {en ? (
            <>
              {GLOSSARY.length} terms explained against public rules (KEPCO Basic Supply Provisions · Ministry of Climate,
              Energy and Environment Notice No. 2025-139).
            </>
          ) : (
            <>
              공개 규정(한전 기본공급약관 · 기후에너지환경부공고 제2025-139호) 기준으로 풀어 쓴 {GLOSSARY.length}개
              용어입니다.
            </>
          )}
        </p>

        <div className="glossary-toolbar">
          <div className="seg-tabs" role="tablist" aria-label={en ? 'Term categories' : '용어 분류'}>
            <button type="button" role="tab" className={`seg-tab ${cat === '전체' ? 'on' : ''}`} onClick={() => setCat('전체')} aria-selected={cat === '전체'}>
              {en ? 'All' : '전체'} <span className="n">{GLOSSARY.length}</span>
            </button>
            {GLOSSARY_CATEGORIES.map((c) => (
              <button key={c.key} type="button" role="tab" className={`seg-tab ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)} aria-selected={cat === c.key}>
                {catLabel(c)} <span className="n">{countOf.get(c.key) || 0}</span>
              </button>
            ))}
          </div>
          {/* 보기 모드 — 딕셔너리 / 온톨로지 맵 */}
          <div className="view-seg" role="group" aria-label={en ? 'View mode' : '보기 모드'}>
            <button type="button" className={view === 'dict' ? 'on' : ''} onClick={() => setViewPersist('dict')} aria-pressed={view === 'dict'}>
              {en ? 'Dictionary' : '딕셔너리'}
            </button>
            <button type="button" className={view === 'map' ? 'on' : ''} onClick={() => setViewPersist('map')} aria-pressed={view === 'map'}>
              {en ? 'Ontology map' : '온톨로지 맵'}
            </button>
          </div>
        </div>

        {view === 'map' && <GlossaryMap cat={cat} />}

        {view === 'dict' && shownCats.map((sec) => (
          <section key={sec.key} className="glossary-section">
            <h2 className="glossary-cat">{catLabel(sec)}</h2>
            <dl className="glossary-list">
              {GLOSSARY.filter((g) => g.category === sec.key).map((g) => (
                <div key={g.id} id={g.id} className="glossary-item">
                  <dt>
                    {g.term}
                    {g.en && <span className="glossary-en">{g.en}</span>}
                  </dt>
                  <dd>{en ? (g.defEn ?? g.def) : g.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <p className="footer-note">
          {en
            ? 'This glossary gives general explanations based on public rules and public technical materials; figures and procedures may change once the pilot notice is formally enacted. Cooling-technology terms draw on public technical materials such as the OCP educational webinar (Jun 2025). For a specific project review, check the latest KEPCO / Ministry of Climate, Energy and Environment notices.'
            : '본 용어집은 공개 규정·공개 기술 자료 기준의 일반 설명이며, 시범운영 고시가 정식 제정되면 수치·절차가 바뀔 수 있습니다. 냉각 기술 용어는 OCP 교육 웨비나(2025.6) 등 공개 기술 자료를 참고했습니다. 구체적 사업 검토는 한전·기후부 최신 공고를 확인하세요.'}
        </p>
      </main>
    </>
  )
}
