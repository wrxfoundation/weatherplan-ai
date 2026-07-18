import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
/* 폰트 셀프호스팅(외부 CDN 의존 제거) — Pretendard(한글 가변·동적서브셋) + Montserrat(라틴 가변) */
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@fontsource-variable/montserrat'
import './styles/tokens.css'
import './styles/app.css'
import MapPage from './map/MapPage.jsx'
import CursorGlow from './ui/CursorGlow.jsx'
import ScrollTopFab from './ui/ScrollTopFab.jsx'
import SiteFooter from './ui/SiteFooter.jsx'

/* 홈(맵)만 즉시 로드 — 나머지 라우트는 코드 스플릿.
 * 특히 /map3d의 maplibre-gl(~800KB)이 홈 번들에 실리는 것을 차단한다 */
const Map3DPage = lazy(() => import('./map3d/Map3DPage.jsx'))
const FacilityPage = lazy(() => import('./dc/FacilityPage.jsx'))
const CalcPage = lazy(() => import('./calc/CalcPage.jsx'))
const GlossaryPage = lazy(() => import('./glossary/GlossaryPage.jsx'))
const RegionPage = lazy(() => import('./region/RegionPage.jsx'))
const StatsPage = lazy(() => import('./stats/StatsPage.jsx'))
const InsightsIndexPage = lazy(() => import('./insights/InsightsIndexPage.jsx'))
const DashboardPage = lazy(() => import('./dashboard/DashboardPage.jsx'))
const InsightPage = lazy(() => import('./insights/InsightPage.jsx'))
const LandPulsePage = lazy(() => import('./land/LandPulsePage.jsx'))
const ComparePage = lazy(() => import('./compare/ComparePage.jsx'))
const DataExplorerPage = lazy(() => import('./explorer/DataExplorerPage.jsx'))
const RoadmapPage = lazy(() => import('./roadmap/RoadmapPage.jsx'))
const PricingPage = lazy(() => import('./lead/PricingPage.jsx'))
const SampleReportPage = lazy(() => import('./lead/SampleReportPage.jsx'))
const GlobalPage = lazy(() => import('./lead/GlobalPage.jsx'))
const MethodologyPage = lazy(() => import('./lead/MethodologyPage.jsx'))
const AboutPage = lazy(() => import('./about/AboutPage.jsx'))
const VerifyPage = lazy(() => import('./verify/VerifyPage.jsx'))
const VerifyReportPage = lazy(() => import('./verify/VerifyReportPage.jsx'))
import { isWeatherFactHost } from './verify/standalone.js'

/* 웨더팩트 단독 모드(별도 도메인/VITE_WEATHERFACT=1) — verify 라우트만 노출.
 * 같은 코드베이스·별도 브랜드: 구매자에게 단일 목적 제품으로 보이게 한다. */
const WEATHERFACT_STANDALONE = isWeatherFactHost()

/* verify 계열은 자체 셸(VerifyShell) 푸터를 쓰므로 전역 SiteFooter 숨김 */
function FooterGate() {
  const { pathname } = useLocation()
  if (WEATHERFACT_STANDALONE || pathname.startsWith('/verify') || pathname === '/report') return null
  return <SiteFooter />
}

/* SPA 라우트 전환 시 스크롤 최상단 — 긴 페이지에서 이전 스크롤 위치가 남는 UX 문제 방지 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="로딩 중">
      <span className="loader-ring" />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <CursorGlow />
      <ScrollTopFab />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        {WEATHERFACT_STANDALONE ? (
          <Routes>
            <Route path="/" element={<VerifyPage />} />
            <Route path="/report" element={<VerifyReportPage />} />
            <Route path="/verify" element={<Navigate to="/" replace />} />
            <Route path="/verify/report" element={<VerifyReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
        <Routes>
          <Route path="/" element={<MapPage key="home" />} />
          <Route path="/map3d" element={<Map3DPage />} />
          <Route path="/dc/:slug" element={<FacilityPage />} />
          <Route path="/calc" element={<CalcPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/region/:slug" element={<RegionPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/land" element={<LandPulsePage />} />
          {/* 전력지도는 맵으로 통합 — 전력 레이어(◎발전허가·⚡여유용량)는 맵 필터바에 상시 노출. 기존 링크 보존 위해 리다이렉트 */}
          <Route path="/power" element={<Navigate to="/" replace />} />
          <Route path="/data" element={<DataExplorerPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/insights" element={<InsightsIndexPage />} />
          <Route path="/insights/:slug" element={<InsightPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/report-sample" element={<SampleReportPage />} />
          <Route path="/global" element={<GlobalPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/report" element={<VerifyReportPage />} />
          <Route path="*" element={<MapPage />} />
        </Routes>
        )}
      </Suspense>
      <FooterGate />
    </BrowserRouter>
  </React.StrictMode>,
)
