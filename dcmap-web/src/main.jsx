import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/app.css'
import MapPage from './map/MapPage.jsx'
import Map3DPage from './map3d/Map3DPage.jsx'
import FacilityPage from './dc/FacilityPage.jsx'
import CalcPage from './calc/CalcPage.jsx'
import GlossaryPage from './glossary/GlossaryPage.jsx'
import RegionPage from './region/RegionPage.jsx'
import StatsPage from './stats/StatsPage.jsx'
import InsightsIndexPage from './insights/InsightsIndexPage.jsx'
import DashboardPage from './dashboard/DashboardPage.jsx'
import InsightPage from './insights/InsightPage.jsx'
import LandPulsePage from './land/LandPulsePage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/map3d" element={<Map3DPage />} />
        <Route path="/dc/:slug" element={<FacilityPage />} />
        <Route path="/calc" element={<CalcPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/region/:slug" element={<RegionPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/land" element={<LandPulsePage />} />
        <Route path="/insights" element={<InsightsIndexPage />} />
        <Route path="/insights/:slug" element={<InsightPage />} />
        <Route path="*" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
