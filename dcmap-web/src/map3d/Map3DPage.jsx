import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, slugOf } from '../data/facilities.js'
import { STYLE_3D, facilityLabelLayer } from './style3d.js'

/* 3D 베타 — MapLibre GL 전환 (사용자 우선순위 배정)
 * v2: 벡터 타일(OpenFreeMap) 커스텀 다크 HUD 스타일 + 건물 압출(줌 13+) +
 *     심볼 레이어 시설 라벨(자동 충돌 회피) + 아이소 빌딩 DOM 마커
 * 남은 단계: 지형(DEM)·345kV 라인 레이어(정보 공개 시) → 검증 후 메인 맵 대체 */

const ISO_SVG = `<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg">
  <polygon class="f-top" points="12,2 22,8 12,14 2,8"/>
  <polygon class="f-left" points="2,8 12,14 12,24 2,18"/>
  <polygon class="f-right" points="12,14 22,8 22,18 12,24"/>
</svg>`

const TITLE = '3D 맵 (베타) — AI InfraMap'
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
      style: STYLE_3D,
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
    const labelFeatures = []
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
        labelFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            label: `${f.name}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`,
            // 공개 용량 큰 시설의 라벨이 충돌에서 살아남게 (심볼 정렬 키는 오름차순 우선)
            sort: -(f.power_mw_public ?? 0),
          },
        })
      })
    }

    // 시설 라벨 — 심볼 레이어의 자동 충돌 회피 (겹치면 우선순위 낮은 라벨 자동 숨김)
    map.on('load', () => {
      map.addSource('dc', { type: 'geojson', data: { type: 'FeatureCollection', features: labelFeatures } })
      map.addLayer(facilityLabelLayer('dc'))
    })

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
          <span className="badge status-operating">3D 베타 v2</span>
          우클릭 드래그로 회전·기울임 · 줌 13+에서 건물 입체 · 마커 클릭 → 시설 상세
        </div>
      </div>
    </>
  )
}
