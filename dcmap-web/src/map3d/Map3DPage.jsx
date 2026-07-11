import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, slugOf } from '../data/facilities.js'

/* 3D 베타 — MapLibre GL 전환 1단계 (사용자 우선순위 배정)
 * v1: 카메라 피치(55°)로 기울인 다크 래스터 베이스 + 아이소메트릭 빌딩 DOM 마커
 * v2(벡터 타일 단계): 건물 압출(fill-extrusion)·지형(DEM)·글로우 라인 — README 로드맵 참조 */
const TILE_URL = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'

const ISO_SVG = `<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg">
  <polygon class="f-top" points="12,2 22,8 12,14 2,8"/>
  <polygon class="f-left" points="2,8 12,14 12,24 2,18"/>
  <polygon class="f-right" points="12,14 22,8 22,18 12,24"/>
</svg>`

const TITLE = '3D 맵 (베타) — 명당 AI'
const DESC = '한국 데이터센터 현황을 기울인 3D 시점에서 — MapLibre GL 전환 1단계 베타.'

export default function Map3DPage() {
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: wrapRef.current,
      style: {
        version: 8,
        sources: {
          base: { type: 'raster', tiles: [TILE_URL], tileSize: 256, attribution: '© OpenStreetMap © CARTO' },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#050d1a' } },
          {
            id: 'base',
            type: 'raster',
            source: 'base',
            paint: {
              // 전술맵 네이비 틴트 — leaflet 틴트와 동일 방향 (실배포에서 강도 확인)
              'raster-hue-rotate': 185,
              'raster-saturation': 0.35,
              'raster-brightness-max': 0.78,
              'raster-opacity': 0.92,
            },
          },
        ],
      },
      center: [127.6, 36.3],
      zoom: 6.4,
      pitch: 55,
      bearing: -12,
      maxBounds: [
        [119.5, 30.5],
        [136.5, 41.5],
      ],
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    // 동일 좌표 그룹 분산 (2D 맵과 동일 규칙 — 표시 전용, 데이터 불변)
    const groups = new Map()
    for (const f of FACILITIES) {
      const k = `${f.lat},${f.lng}`
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(f)
    }
    const SPREAD = 0.0045
    const markers = []
    for (const group of groups.values()) {
      group.forEach((f, gi) => {
        let { lat, lng } = f
        if (group.length > 1) {
          const a = (2 * Math.PI * gi) / group.length
          lat += SPREAD * Math.cos(a)
          lng += (SPREAD * Math.sin(a)) / Math.cos((f.lat * Math.PI) / 180)
        }
        const key = f.status === 'delayed' ? 'planned' : f.status
        const el = document.createElement('div')
        el.className = `dc-iso ${key}${f.power_mw_public >= HYPERSCALE_MW ? ' xl' : ''} dc-iso-3d`
        el.innerHTML = ISO_SVG
        el.title = `${f.name} · ${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`
        el.addEventListener('click', () => navigate(`/dc/${slugOf(f)}`))
        markers.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map))
      })
    }

    return () => {
      markers.forEach((m) => m.remove())
      map.remove()
    }
  }, [navigate])

  return (
    <>
      <TopBar />
      <div className="map-layout">
        <div ref={wrapRef} className="map-canvas map3d" />
        <div className="map3d-banner">
          <span className="badge status-operating">3D 베타</span>
          기울여 보기(우클릭 드래그) · 마커 클릭 → 시설 상세. 건물 압출·지형은 벡터 타일 단계에서 추가됩니다.
        </div>
      </div>
    </>
  )
}
