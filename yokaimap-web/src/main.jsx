import React, { Suspense, lazy, useEffect, useState, createContext, useContext, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { readTheme, writeTheme, resolveSurface, applySurface } from './theme.js'
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

/* 지도는 어두운 타일 위에 UI가 얹히므로 테마와 무관하게 항상 밤 서피스다. */
const NIGHT_ROUTES = new Set(['/map'])

export const ThemeContext = createContext({ theme: 'system', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

/** 사용자 테마 × 라우트 → data-surface. 표면 계산은 theme.js 한 곳에서만 한다. */
function useSurface(pathname) {
  const [theme, setThemeState] = useState(readTheme)
  const routeNight = NIGHT_ROUTES.has(pathname)
  const surface = resolveSurface(theme, routeNight)

  useEffect(() => {
    applySurface(surface)
  }, [surface])

  // 시스템 테마를 따르는 동안에는 OS 설정 변경에 즉시 반응해야 한다.
  useEffect(() => {
    if (theme !== 'system' || typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applySurface(resolveSurface('system', routeNight))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme, routeNight])

  const setTheme = useCallback((next) => {
    writeTheme(next)
    setThemeState(next)
  }, [])

  return { night: surface === 'night', routeNight, theme, setTheme }
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
  const { routeNight, theme, setTheme } = useSurface(pathname)
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
      {/* 지도는 전체화면 캔버스라 푸터를 붙이지 않는다. 다크 테마에서는 붙인다. */}
      {!routeNight && <SiteFooter />}
    </ThemeContext.Provider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
