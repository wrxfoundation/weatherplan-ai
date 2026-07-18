import { Link, useLocation } from 'react-router-dom'
import { CONTACT_EMAIL } from '../data/leadApi.js'
import { useMapLang } from '../i18n/mapLang.js'

/* 전역 푸터 — 발견성(EN/파트너 클러스터 포함)·SEO 내부링크·마감감. 풀스크린 맵 라우트에서는 숨김. */
const HIDE_ON = new Set(['/', '/map3d'])
const SOURCES = [
  { ko: '한전', en: 'KEPCO' }, { ko: 'EPSIS', en: 'EPSIS' }, { ko: 'KOSIS', en: 'KOSIS' },
  { ko: 'SGIS', en: 'SGIS' }, { ko: 'vworld', en: 'vworld' }, { ko: '기상청', en: 'KMA' },
  { ko: 'K-water', en: 'K-water' }, { ko: '국가법령정보센터', en: 'Korea Law' },
  { ko: 'DART', en: 'DART' }, { ko: 'OSM', en: 'OSM' },
]

const COLS = [
  {
    h: '탐색', hEn: 'Explore',
    links: [
      { to: '/', label: '현황 맵', en: 'Live map' },
      { to: '/dashboard', label: '대시보드', en: 'Dashboard' },
      { to: '/data', label: '데이터 탐색기', en: 'Data explorer' },
      { to: '/stats', label: '통계', en: 'Statistics' },
      { to: '/calc', label: 'GPU 계산기', en: 'GPU calculator' },
    ],
  },
  {
    h: '지식', hEn: 'Knowledge',
    links: [
      { to: '/insights', label: '인사이트', en: 'Insights' },
      { to: '/roadmap', label: '인허가 로드맵', en: 'Permitting roadmap' },
      { to: '/glossary', label: '용어집·온톨로지', en: 'Glossary · ontology' },
    ],
  },
  {
    h: '서비스', hEn: 'Service',
    links: [
      { to: '/about', label: '서비스 소개', en: 'About' },
      { to: '/pricing', label: '요금·문의', en: 'Pricing · contact' },
      { to: '/report-sample', label: '정밀 리포트 견본', en: 'Sample report' },
    ],
  },
  {
    h: 'For partners (EN)', hEn: 'For partners (EN)',
    links: [
      { to: '/global', label: 'Overview', en: 'Overview' },
      { to: '/methodology', label: 'Methodology', en: 'Methodology' },
      { to: '/report-sample', label: 'Sample report', en: 'Sample report' },
    ],
  },
]

export default function SiteFooter() {
  const { pathname } = useLocation()
  const en = useMapLang() === 'en'
  if (HIDE_ON.has(pathname)) return null

  return (
    <footer className="site-footer">
      <div className="sf-inner">
        <div className="sf-brand">
          <div className="sf-logo">AI <span>InfraMap</span></div>
          <p className="sf-tag">
            {en
              ? 'AI datacenter site intelligence — nationwide facilities, the grid and permitting on one map. Public data only, with honest coverage.'
              : 'AI 데이터센터 부지 인텔리전스 — 전국 시설·전력계통·인허가를 한 장의 지도로. 공개 데이터만, 정직한 커버리지로.'}
          </p>
          {!en && <Link className="sf-en" to="/global">English · For partners →</Link>}
        </div>
        <div className="sf-cols">
          {COLS.map((c) => (
            <div key={c.h} className="sf-col">
              <div className="sf-col-h">{en ? c.hEn : c.h}</div>
              {c.links.map((l) => (
                <Link key={l.to + l.label} to={l.to}>{en ? l.en : l.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="sf-bottom">
        <div className="sf-src" aria-label={en ? 'Data sources' : '데이터 소스'}>
          {SOURCES.map((s) => (
            <span key={s.ko} className="sf-chip">{en ? s.en : s.ko}</span>
          ))}
        </div>
        <div className="sf-meta">
          <span>{en ? 'Built on public data · unsupported items marked “data pending”' : '공개 데이터 기반 · 근거 없는 항목은 “데이터 대기”로 표기'}</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <span>© 2026 AI InfraMap</span>
        </div>
      </div>
    </footer>
  )
}
