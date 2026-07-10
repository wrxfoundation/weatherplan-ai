import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { INSIGHTS } from '../content/insights_meta.js'
import DcLocalImpact from './articles/DcLocalImpact.jsx'
import MegaProjectAidc from './articles/MegaProjectAidc.jsx'

const ARTICLES = {
  'mega-project-aidc': {
    component: MegaProjectAidc,
    sources: [
      '산업통상부 참고자료, 「대한민국 대도약 3대 메가프로젝트 국민보고회」 개최 (2026.6.29)',
      '대한민국 정책브리핑(korea.kr), AI데이터센터 규제 확 푼다…인허가 절차 대폭 단축 (2026.5.8, 과학기술정보통신부)',
      '헤럴드경제, SK·삼성·앰코, 서남권 반도체·데이터센터에 896조원 투자 (2026.6.30)',
      '연합뉴스, 산업부, 산단 지원사업 10개 선정 (2026.7.10) · 뉴시스/KITA, 초광역산업협력과 신설 (2026.7.9)',
      '실행 리스크 프레임 재인용: 커넥트 기고(2026.6.30) — 콘텐츠 등급 ④참고·인사이트',
    ],
  },
  'dc-local-impact': {
    component: DcLocalImpact,
    sources: [
      'Dany Bahar & Greg Wright, 데이터센터의 지역 고용 효과 연구 (미국)',
      '미국 데이터센터 물 사용량·라우던 카운티 재산세: 미국 공개 통계·현지 보도',
      '재인용 경로: 서진호(AI 산업 전문가) 칼럼, 커넥트, 2026.7 — 콘텐츠 등급 ④참고·인사이트',
    ],
  },
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function InsightPage() {
  const { slug } = useParams()
  const meta = INSIGHTS.find((a) => a.slug === slug)
  const article = ARTICLES[slug]

  useEffect(() => {
    if (!meta) return
    const title = `${meta.title} — 명당 AI 인사이트`
    document.title = title
    setMeta('name', 'description', meta.description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', meta.description)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      datePublished: meta.date,
      author: { '@type': 'Organization', name: '명당 AI' },
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [meta])

  if (!meta || !article) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>아티클을 찾을 수 없습니다</h1>
          <p className="sub">
            <Link className="back-link" to="/insights">
              ← 인사이트 목록
            </Link>
          </p>
        </main>
      </>
    )
  }

  const Body = article.component
  return (
    <>
      <TopBar />
      <main className="page">
        <Link className="back-link" to="/insights">
          ← 인사이트
        </Link>
        <h1>{meta.title}</h1>
        <p className="sub">{meta.date}</p>
        <div className="prose">
          <Body />
        </div>
        <p className="footer-note">
          출처
          <br />
          {article.sources.map((s) => (
            <span key={s}>
              · {s}
              <br />
            </span>
          ))}
          본 아티클은 공개 연구·보도에 기반한 참고·인사이트 콘텐츠이며, 시설 데이터(현황 맵)와 분리 관리됩니다.
        </p>
      </main>
    </>
  )
}
