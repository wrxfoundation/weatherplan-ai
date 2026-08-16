import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './styles/tokens.css'
import './styles/app.css'
import MapPage from './map/MapPage.jsx'
import TopBar from './ui/TopBar.jsx'
import SiteFooter from './ui/SiteFooter.jsx'

/* 홈(지도)만 즉시 로드 — 나머지는 코드 스플릿 */
const DogamPage = lazy(() => import('./dogam/DogamPage.jsx'))
const YokaiPage = lazy(() => import('./yokai/YokaiPage.jsx'))
const CategoryPage = lazy(() => import('./category/CategoryPage.jsx'))
const RegionPage = lazy(() => import('./region/RegionPage.jsx'))
const QuizPage = lazy(() => import('./quiz/QuizPage.jsx'))
const AboutPage = lazy(() => import('./about/AboutPage.jsx'))

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
  const isMap = pathname === '/'
  return (
    <>
      <TopBar />
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/dogam" element={<DogamPage />} />
          <Route path="/yokai/:slug" element={<YokaiPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/region/:slug" element={<RegionPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<DogamPage />} />
        </Routes>
      </Suspense>
      {!isMap && <SiteFooter />}
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
