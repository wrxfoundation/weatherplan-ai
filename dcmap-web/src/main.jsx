import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/app.css'
import MapPage from './map/MapPage.jsx'
import FacilityPage from './dc/FacilityPage.jsx'
import CalcPage from './calc/CalcPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/dc/:slug" element={<FacilityPage />} />
        <Route path="/calc" element={<CalcPage />} />
        <Route path="*" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
