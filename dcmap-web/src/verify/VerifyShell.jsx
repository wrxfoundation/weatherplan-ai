import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useMapLang, setMapLang } from '../i18n/mapLang.js'
import { CONTACT_EMAIL } from '../data/leadApi.js'
import { STATIONS_META } from './stationsData.js'
import { isWeatherFactHost } from './standalone.js'

/* 웨더팩트 전용 셸 — dcmap GNB 대신 자체 상단바·푸터.
 * 구매자(손해사정·건설 클레임·법무)에게 단일 목적 제품으로 보이게 한다.
 * 코드베이스는 dcmap 헤리티지(i18n·토큰·리드) 공유. */

const SAMPLE_REPORT_QS = 'lat=37.5665&lon=126.978&from=2026-06-01&to=2026-06-30&use=insurance'

export function verifyHome() {
  return isWeatherFactHost() ? '/' : '/verify'
}
export function verifyReportPath() {
  return isWeatherFactHost() ? '/report' : '/verify/report'
}
export function verifyMapPath() {
  return isWeatherFactHost() ? '/map' : '/verify/map'
}
export function verifyGuidesPath() {
  return isWeatherFactHost() ? '/guides' : '/verify/guides'
}
export function verifyStationsPath() {
  return isWeatherFactHost() ? '/stations' : '/verify/stations'
}

export function VerifyTopBar() {
  const en = useMapLang() === 'en'
  const home = verifyHome()
  useEffect(() => {
    document.title = en
      ? 'WeatherFact — Weather fact-check & appraisal support'
      : '웨더팩트 — 기상 사실확인·감정지원 리포트'
  }, [en])
  return (
    <header className="vf-topbar" role="banner">
      <Link to={home} className="vf-brand" aria-label="WeatherFact home">
        <span className="vf-brand-mark" aria-hidden>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 11.5a3 3 0 1 1 .8-5.9 4 4 0 0 1 7.7 1.1 2.5 2.5 0 0 1-.5 4.8z" />
            <path d="M5.5 14l1-1.5M8.5 14l1-1.5M11.5 14l1-1.5" />
          </svg>
        </span>
        <b>웨더팩트</b>
        <span className="vf-brand-en">WeatherFact</span>
      </Link>
      <nav className="vf-topnav" aria-label="WeatherFact">
        <NavLink to={home} end className={({ isActive }) => (isActive ? 'active' : '')}>
          {en ? 'Service' : '서비스'}
        </NavLink>
        <NavLink to={verifyMapPath()} className={({ isActive }) => (isActive ? 'active' : '')}>
          {en ? 'Map' : '맵'}
        </NavLink>
        <NavLink to={verifyGuidesPath()} className={({ isActive }) => (isActive ? 'active' : '')}>
          {en ? 'Guides' : '가이드'}
        </NavLink>
        <Link to={`${verifyReportPath()}?${SAMPLE_REPORT_QS}`}>{en ? 'Sample report' : '리포트 견본'}</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className="vf-topnav-contact">{en ? 'Contact' : '문의'}</a>
        <span className="nav-lang" role="group" aria-label="Language">
          <button type="button" className={`nav-lang-btn${!en ? ' on' : ''}`} onClick={() => setMapLang('ko')} aria-pressed={!en}>KO</button>
          <button type="button" className={`nav-lang-btn${en ? ' on' : ''}`} onClick={() => setMapLang('en')} aria-pressed={en}>EN</button>
        </span>
      </nav>
    </header>
  )
}

export function VerifyFooter() {
  const en = useMapLang() === 'en'
  return (
    <footer className="vf-footer" role="contentinfo">
      <div className="vf-footer-inner">
        <p className="vf-footer-brand"><b>웨더팩트 WeatherFact</b> — {en ? 'Weather fact-check & appraisal support report' : '기상 사실확인·감정지원 리포트'}</p>
        <p className="vf-footer-honesty">
          {en
            ? 'Drafts are not legally binding — legal use requires certified appraiser review. Station coordinates are approximate pending pipeline verification.'
            : '초안은 법적 효력이 없으며, 법적 활용은 기상감정사 검수본 기준입니다. 관측지점 좌표는 근사값(파이프라인 검증 대기)입니다.'}
        </p>
        <p className="vf-footer-src">
          {en ? 'Sources' : '출처'}: {STATIONS_META.source} · {en ? 'KMA observations · KWeather' : '기상청 관측자료 · 케이웨더'} · {STATIONS_META.updated}
          {' · '}
          <Link to={verifyStationsPath()}>{en ? 'Station explorer' : '관측지점 탐색기'}</Link>
          {' · '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </footer>
  )
}

export default function VerifyShell({ children }) {
  return (
    <div className="vf-shell">
      <VerifyTopBar />
      {children}
      <VerifyFooter />
    </div>
  )
}
