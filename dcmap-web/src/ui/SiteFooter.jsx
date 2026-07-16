import { Link, useLocation } from 'react-router-dom'
import { CONTACT_EMAIL } from '../data/leadApi.js'

/* 전역 푸터 — 발견성(EN/파트너 클러스터 포함)·SEO 내부링크·마감감. 풀스크린 맵 라우트에서는 숨김. */
const HIDE_ON = new Set(['/', '/map3d'])
const SOURCES = ['한전', 'EPSIS', 'KOSIS', 'SGIS', 'vworld', '기상청', 'K-water', '국가법령정보센터', 'DART', 'OSM']

const COLS = [
  {
    h: '탐색',
    links: [
      { to: '/', label: '현황 맵' },
      { to: '/dashboard', label: '대시보드' },
      { to: '/data', label: '데이터 탐색기' },
      { to: '/stats', label: '통계' },
      { to: '/calc', label: 'GPU 계산기' },
    ],
  },
  {
    h: '지식',
    links: [
      { to: '/insights', label: '인사이트' },
      { to: '/roadmap', label: '인허가 로드맵' },
      { to: '/glossary', label: '용어집·온톨로지' },
    ],
  },
  {
    h: '서비스',
    links: [
      { to: '/about', label: '서비스 소개' },
      { to: '/pricing', label: '요금·문의' },
      { to: '/report-sample', label: '정밀 리포트 견본' },
    ],
  },
  {
    h: 'For partners (EN)',
    links: [
      { to: '/global', label: 'Overview' },
      { to: '/methodology', label: 'Methodology' },
      { to: '/report-sample', label: 'Sample report' },
    ],
  },
]

export default function SiteFooter() {
  const { pathname } = useLocation()
  if (HIDE_ON.has(pathname)) return null

  return (
    <footer className="site-footer">
      <div className="sf-inner">
        <div className="sf-brand">
          <div className="sf-logo">AI <span>InfraMap</span></div>
          <p className="sf-tag">
            AI 데이터센터 부지 인텔리전스 — 전국 시설·전력계통·인허가를 한 장의 지도로. 공개 데이터만, 정직한
            커버리지로.
          </p>
          <Link className="sf-en" to="/global">English · For partners →</Link>
        </div>
        <div className="sf-cols">
          {COLS.map((c) => (
            <div key={c.h} className="sf-col">
              <div className="sf-col-h">{c.h}</div>
              {c.links.map((l) => (
                <Link key={l.to + l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="sf-bottom">
        <div className="sf-src" aria-label="데이터 소스">
          {SOURCES.map((s) => (
            <span key={s} className="sf-chip">{s}</span>
          ))}
        </div>
        <div className="sf-meta">
          <span>공개 데이터 기반 · 근거 없는 항목은 “데이터 대기”로 표기</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <span>© 2026 AI InfraMap</span>
        </div>
      </div>
    </footer>
  )
}
