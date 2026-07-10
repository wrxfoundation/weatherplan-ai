import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import TopBar from '../TopBar.jsx'
import FilterBar from './FilterBar.jsx'
import FacilityCard from '../dc/FacilityCard.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, applyFilters } from '../data/facilities.js'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
const KR_CENTER = [36.4, 127.7]

function markerIcon(f) {
  const key = f.status === 'delayed' ? 'planned' : f.status
  if (f.power_mw_public >= HYPERSCALE_MW) {
    // 다이아몬드 회전은 내부 span에 — Leaflet의 루트 inline transform과 충돌 방지
    return L.divIcon({
      className: 'dc-marker-xl-wrap',
      html: `<span class="dc-marker ${key} xl"></span>`,
      iconSize: [18, 18],
    })
  }
  return L.divIcon({ className: `dc-marker ${key}`, iconSize: [14, 14] })
}

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMw = Number.parseFloat(searchParams.get('min_mw'))
  const minMw = Number.isFinite(rawMw) && rawMw > 0 ? rawMw : null
  const q = searchParams.get('q') ?? ''

  const [statuses, setStatuses] = useState(() => new Set())
  const [type, setType] = useState('')
  // 지역 랜딩(/region/[slug]) "맵에서 보기" 진입점: ?sido= 초기값
  const [sido, setSido] = useState(() => searchParams.get('sido') ?? '')
  const [selected, setSelected] = useState(null)

  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const clusterRef = useRef(null)

  const filtered = useMemo(
    () => applyFilters(FACILITIES, { statuses, type, sido, minMw, q }),
    [statuses, type, sido, minMw, q],
  )
  const totalMw = useMemo(() => filtered.reduce((s, f) => s + (f.power_mw_public ?? 0), 0), [filtered])

  useEffect(() => {
    // 시안(hero-v1) 준거: 줌 컨트롤 우하단, 축척 좌하단
    const map = L.map(mapRef.current, { center: KR_CENTER, zoom: 7, zoomControl: false })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)
    L.tileLayer(DARK_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 44,
      iconCreateFunction: (c) =>
        L.divIcon({ className: 'dc-cluster', html: `${c.getChildCount()}`, iconSize: [34, 34] }),
    })
    map.addLayer(cluster)
    mapObj.current = map
    clusterRef.current = cluster
    return () => map.remove()
  }, [])

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    for (const f of filtered) {
      const m = L.marker([f.lat, f.lng], { icon: markerIcon(f) })
      m.bindTooltip(`${f.name} · ${STATUS_LABEL[f.status] ?? f.status}`, { direction: 'top' })
      m.on('click', () => setSelected(f))
      cluster.addLayer(m)
    }
  }, [filtered])

  const toggleStatus = (key) =>
    setStatuses((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const focusFacility = (f) => {
    setSelected(f)
    mapObj.current?.setView([f.lat, f.lng], Math.max(mapObj.current.getZoom(), 11))
  }

  return (
    <>
      <TopBar />
      <FilterBar
        statuses={statuses}
        onToggleStatus={toggleStatus}
        type={type}
        onType={setType}
        sido={sido}
        onSido={setSido}
        minMw={minMw}
        onClearMw={() => {
          searchParams.delete('min_mw')
          setSearchParams(searchParams, { replace: true })
        }}
      />
      <div className="map-layout">
        <div ref={mapRef} className="map-canvas" />
        <aside className="side-panel">
          {selected ? (
            <>
              <h2>
                <button type="button" className="chip btn" onClick={() => setSelected(null)}>
                  ← 목록으로
                </button>
              </h2>
              <FacilityCard facility={selected} />
            </>
          ) : (
            <>
              <div className="panel-title">사이트 인텔리전스</div>
              <h2>
                시설 <strong>{filtered.length}</strong>곳
                {totalMw > 0 && (
                  <>
                    {' · 공개 전력 합계 '}
                    <strong>{totalMw.toLocaleString()}</strong> MW
                  </>
                )}
                {minMw != null && ` · 필터 ≥ ${minMw} MW`}
                {q && ` · “${q}”`}
              </h2>
              <div className="facility-list">
                {filtered.map((f) => (
                  <button key={f.id} type="button" className="facility-row" onClick={() => focusFacility(f)}>
                    <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
                    <span>
                      <span className="name">{f.name}</span>
                      <span className="meta">
                        {f.sido}
                        {f.sigungu ? ` ${f.sigungu}` : ''} · {STATUS_LABEL[f.status] ?? f.status}
                        {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  )
}
