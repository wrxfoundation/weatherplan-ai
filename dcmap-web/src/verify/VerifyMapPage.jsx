import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import VerifyShell, { verifyHome } from './VerifyShell.jsx'
import LineIcon from '../components/LineIcon.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import { geocodeAddr } from '../data/liveApi.js'
import { ASOS_STATIONS, STATIONS_META } from './stationsData.js'
import { nearestStations, coverageGrade, USE_CASES } from './verifyEngine.js'
import './verify.css'

/* 웨더팩트 맵 — dcmap 맵 헤리티지(다크 타일·레이어 토글 UX)를 사실확인 목적으로 이식.
 * 역할: 사고 지점을 지도에서 찍고 관측 근거(최근접 지점·거리·커버리지)를 공간적으로 확인 → 리포트로 연결.
 * 정직성: 지점 좌표는 근사값(STATIONS_META.note) — 패널·지도 각주에 상시 표기. */

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
const KR_BOUNDS = [
  [33.0, 124.6],
  [38.65, 130.95],
]
const RING_STYLE = [
  { r: 5000, color: '#9ff0c8', label: '5km (A)' },
  { r: 15000, color: '#7ea6ff', label: '15km (B)' },
  { r: 30000, color: '#8a93a8', label: '30km (C)' },
]

export default function VerifyMapPage() {
  const en = useMapLang() === 'en'
  const navigate = useNavigate()
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({}) // { stations, labels, rings, picked }
  const [point, setPoint] = useState(null) // { lat, lon }
  const [show, setShow] = useState({ stations: true, labels: false, rings: true })
  const [form, setForm] = useState({ from: '', to: '', use: USE_CASES[0]?.key ?? 'insurance' })
  const [addrQ, setAddrQ] = useState('')
  const [addrBusy, setAddrBusy] = useState(false)
  const [addrMiss, setAddrMiss] = useState(false)

  useEffect(() => {
    document.title = en ? 'WeatherFact — Station Map' : '웨더팩트 — 관측지점 맵'
  }, [en])

  const near = useMemo(() => (point ? nearestStations(point.lat, point.lon, 3) : []), [point])
  const grade = near.length ? coverageGrade(near[0].distKm) : null

  /* 지도 초기화 — 1회 */
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const map = L.map(mapEl.current, { zoomControl: true, minZoom: 6, maxZoom: 18, preferCanvas: true })
    L.tileLayer(DARK_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 18, minZoom: 6 }).addTo(map)
    map.fitBounds(KR_BOUNDS)
    mapRef.current = map

    const stations = L.layerGroup()
    const labels = L.layerGroup()
    for (const s of ASOS_STATIONS) {
      L.circleMarker([s.lat, s.lon], { radius: 5, color: '#7ea6ff', weight: 1.5, fillColor: '#7ea6ff', fillOpacity: 0.55 })
        .bindTooltip(`${s.name} (${s.id})`, { direction: 'top', offset: [0, -6] })
        .addTo(stations)
      L.marker([s.lat, s.lon], {
        interactive: false,
        icon: L.divIcon({ className: 'vfm-stn-label', html: `<span>${s.name}</span>`, iconSize: [0, 0] }),
      }).addTo(labels)
    }
    layersRef.current = { stations, labels, rings: L.layerGroup(), picked: L.layerGroup() }
    stations.addTo(map)
    layersRef.current.picked.addTo(map)
    layersRef.current.rings.addTo(map)

    map.on('click', (e) => setPoint({ lat: e.latlng.lat, lon: e.latlng.lng }))
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  /* 레이어 토글 동기화 */
  useEffect(() => {
    const map = mapRef.current
    const ly = layersRef.current
    if (!map || !ly.stations) return
    const sync = (layer, on) => {
      if (on && !map.hasLayer(layer)) layer.addTo(map)
      if (!on && map.hasLayer(layer)) map.removeLayer(layer)
    }
    sync(ly.stations, show.stations)
    sync(ly.labels, show.labels)
    sync(ly.rings, show.rings)
  }, [show])

  /* 선택 지점 → 마커·연결선·커버리지 링 갱신 */
  useEffect(() => {
    const map = mapRef.current
    const ly = layersRef.current
    if (!map || !ly.picked) return
    ly.picked.clearLayers()
    ly.rings.clearLayers()
    if (!point) return
    L.marker([point.lat, point.lon], {
      icon: L.divIcon({ className: 'vfm-pick', html: '<span>✕</span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(ly.picked)
    for (const s of near) {
      L.polyline(
        [
          [point.lat, point.lon],
          [s.lat, s.lon],
        ],
        { color: '#9ff0c8', weight: 1.5, dashArray: '4 5', opacity: 0.8 }
      )
        .bindTooltip(`${s.name} · ${s.distKm}km`, { sticky: true })
        .addTo(ly.picked)
    }
    for (const ring of RING_STYLE) {
      L.circle([point.lat, point.lon], { radius: ring.r, color: ring.color, weight: 1, fill: false, opacity: 0.5, dashArray: '2 6' }).addTo(ly.rings)
    }
    if (show.rings && map.hasLayer(ly.rings) === false) ly.rings.addTo(map)
  }, [point, near])

  const onAddr = async (e) => {
    e.preventDefault()
    const q = addrQ.trim()
    if (!q || addrBusy) return
    setAddrBusy(true)
    setAddrMiss(false)
    const r = await geocodeAddr(q)
    setAddrBusy(false)
    if (r?.available && Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
      setPoint({ lat: r.lat, lon: r.lng })
      mapRef.current?.setView([r.lat, r.lng], 12)
    } else {
      setAddrMiss(true)
    }
  }

  const reportHref = () => {
    if (!point) return '#'
    const p = new URLSearchParams({ lat: point.lat.toFixed(5), lon: point.lon.toFixed(5), use: form.use })
    if (form.from) p.set('from', form.from)
    if (form.to) p.set('to', form.to)
    return `/verify/report?${p.toString()}`
  }
  const canReport = point && form.from && form.to

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <VerifyShell>
      <main className="vfm-wrap">
        <div className="vfm-map-col">
          {/* 레이어 토글 — dcmap FilterBar UX 축소판 */}
          <div className="vfm-filterbar" role="group" aria-label={en ? 'Map layers' : '맵 레이어'}>
            {[
              { k: 'stations', ko: '관측지점', en: 'Stations' },
              { k: 'labels', ko: '지점명', en: 'Labels' },
              { k: 'rings', ko: '커버리지 링', en: 'Coverage rings' },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                className={`vfm-toggle${show[t.k] ? ' on' : ''}`}
                aria-pressed={show[t.k]}
                onClick={() => setShow((s) => ({ ...s, [t.k]: !s[t.k] }))}
              >
                {en ? t.en : t.ko}
              </button>
            ))}
            <span className="vfm-hint">{en ? 'Click the map to set the incident point' : '지도를 클릭해 사고 지점을 지정'}</span>
          </div>
          <div ref={mapEl} className="vfm-map" />
          <p className="vfm-foot vf-muted">
            {en ? 'Station coordinates are approximate' : '지점 좌표는 근사값'} — {STATIONS_META.note} · {STATIONS_META.source} ({STATIONS_META.updated})
          </p>
        </div>

        {/* 우측 패널 — 관측 근거 + 리포트 연결 */}
        <aside className="vfm-panel vf-card">
          <h2 className="vf-h2">
            <LineIcon name="target" size={16} /> {en ? 'Incident point' : '사고 지점'}
          </h2>
          <form onSubmit={onAddr} className="vfm-addr">
            <input
              type="text"
              value={addrQ}
              onChange={(e) => setAddrQ(e.target.value)}
              placeholder={en ? 'Address search' : '주소 검색'}
              disabled={addrBusy}
            />
            <button type="submit" className="btn" disabled={addrBusy || !addrQ.trim()}>
              {addrBusy ? '…' : en ? 'Go' : '이동'}
            </button>
          </form>
          {addrMiss && <p className="vf-muted">{en ? 'Address search unavailable — click the map instead.' : '주소 검색 불가 — 지도를 클릭해 지정해 주세요.'}</p>}

          {point ? (
            <>
              <p className="vfm-coord">
                {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
                {grade && (
                  <span className={`vf-grade vf-grade-${grade.grade}`} style={{ marginLeft: 8 }}>
                    {en ? 'Coverage' : '커버리지'} {grade.grade}
                  </span>
                )}
              </p>
              <ul className="vfm-stnlist" role="list">
                {near.map((s, i) => (
                  <li key={s.id}>
                    <b>{en ? s.nameEn : s.name}</b> <span className="vf-muted">#{s.id}</span>
                    <span className="vfm-dist">{s.distKm} km</span>
                    {i === 0 && <span className="vf-soon-badge">{en ? 'nearest' : '최근접'}</span>}
                  </li>
                ))}
              </ul>
              <div className="vfm-form">
                <label>
                  {en ? 'From' : '기간 시작'}
                  <input type="date" value={form.from} onChange={set('from')} />
                </label>
                <label>
                  {en ? 'To' : '기간 종료'}
                  <input type="date" value={form.to} onChange={set('to')} />
                </label>
                <label>
                  {en ? 'Use case' : '용도'}
                  <select value={form.use} onChange={set('use')}>
                    {USE_CASES.map((u) => (
                      <option key={u.key} value={u.key}>
                        {en ? u.en : u.ko}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="button" className="btn primary vfm-cta" disabled={!canReport} onClick={() => canReport && navigate(reportHref())}>
                {en ? 'Open draft report' : '리포트 초안 열기'}
              </button>
              {!canReport && <p className="vf-muted">{en ? 'Set the period to enable the report.' : '기간을 입력하면 리포트를 열 수 있습니다.'}</p>}
            </>
          ) : (
            <p className="vf-muted">
              {en
                ? 'Click anywhere on the map (or search an address) to see the nearest stations, distances and coverage grade for that point.'
                : '지도를 클릭하거나 주소를 검색하면 그 지점의 최근접 관측지점·거리·커버리지 등급이 표시됩니다.'}
            </p>
          )}
          <p className="vf-muted vfm-panel-foot">
            {en ? 'Full lookup form' : '전체 조회 화면'}: <a href={verifyHome()}>{en ? 'WeatherFact lookup' : '웨더팩트 조회'}</a>
          </p>
        </aside>
      </main>
    </VerifyShell>
  )
}
