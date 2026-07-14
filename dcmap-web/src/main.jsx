import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './styles/tokens.css'
import './styles/app.css'
import MapPage from './map/MapPage.jsx'

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
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
          <Route path="*" element={<MapPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
