import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@fontsource/nanum-myeongjo/400.css'
import '@fontsource/nanum-myeongjo/700.css'
import './styles/tokens.css'
import './styles/app.css'
import HomePage from './home/HomePage.jsx'
import TopBar from './ui/TopBar.jsx'
import SiteFooter from './ui/SiteFooter.jsx'

/* 홈만 즉시 로드. 지도는 leaflet(~184KB)을 끌고 오므로 반드시 분리한다. */
const MapPage = lazy(() => import('./map/MapPage.jsx'))
const DogamPage = lazy(() => import('./dogam/DogamPage.jsx'))
const YokaiPage = lazy(() => import('./yokai/YokaiPage.jsx'))
const CategoryPage = lazy(() => import('./category/CategoryPage.jsx'))
const RegionPage = lazy(() => import('./region/RegionPage.jsx'))
const QuizPage = lazy(() => import('./quiz/QuizPage.jsx'))
const BusinessPage = lazy(() => import('./business/BusinessPage.jsx'))
const AboutPage = lazy(() => import('./about/AboutPage.jsx'))

const NIGHT_ROUTES = new Set(['/map'])

/** 지도는 밤(어두운) 서피스, 나머지는 한지(밝은) 서피스 — tokens.css의 data-surface로 전환 */
function useSurface(pathname) {
  const night = NIGHT_ROUTES.has(pathname)
  useEffect(() => {
    const root = document.documentElement
    if (night) root.dataset.surface = 'night'
    else delete root.dataset.surface
    document.head.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#100e0c' : '#f4efe3')
  }, [night])
  return night
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const Loader = () => <div className="loader">불러오는 중…</div>

function App() {
  const { pathname } = useLocation()
  const night = useSurface(pathname)
  return (
    <>
      <TopBar />
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/dogam" element={<DogamPage />} />
          <Route path="/yokai/:slug" element={<YokaiPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/region/:slug" element={<RegionPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<DogamPage />} />
        </Routes>
      </Suspense>
      {!night && <SiteFooter />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
