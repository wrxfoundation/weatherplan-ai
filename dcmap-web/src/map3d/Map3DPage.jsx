import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, slugOf } from '../data/facilities.js'
import { SUBSTATION_POINTS } from '../data/substationPoints.js'
import { loadPowerLines } from '../data/powerLines.js'
import { recommendSites } from '../score/recommend.js'
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
    let cancelled = false
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

      // 송전선(154kV+) — 전압별 색 라인(계통 백본). 2D 대비 빈약하던 3D에 송전망 추가. 동적 로드(2,500여 선로).
      loadPowerLines()
        .then((lines) => {
          if (cancelled) return
          const feats = lines.map((ln) => ({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: ln.p.map(([la, lo]) => [lo, la]) },
            properties: { v: ln.v ?? 0 },
          }))
          try {
            map.addSource('lines', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } })
            map.addLayer(
              {
                id: 'lines',
                type: 'line',
                source: 'lines',
                paint: {
                  'line-color': [
                    'case',
                    ['>=', ['get', 'v'], 550], '#22d3ee',
                    ['>=', ['get', 'v'], 310], '#c026d3',
                    ['>=', ['get', 'v'], 220], '#ef4444',
                    ['>=', ['get', 'v'], 132], '#b45309',
                    ['>=', ['get', 'v'], 52], '#eab308',
                    '#7dd3fc',
                  ],
                  'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 2.2],
                  'line-opacity': 0.5,
                },
              },
              map.getLayer('subs') ? 'subs' : 'dc', // 변전소·라벨 아래로
            )
          } catch {
            /* 스타일/타이밍 — 무시 */
          }
        })
        .catch(() => {})

      // 변전소(154kV+) — 전압별 색 서클(계통 접속점 맥락)
      try {
        map.addSource('subs', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: SUBSTATION_POINTS.map(([lat, lng, kv]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { kv } })) },
        })
        map.addLayer({
          id: 'subs',
          type: 'circle',
          source: 'subs',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.4, 12, 4],
            'circle-color': ['case', ['>=', ['get', 'kv'], 765], '#f0abfc', ['>=', ['get', 'kv'], 345], '#c084fc', '#7dd3fc'],
            'circle-opacity': 0.5,
          },
        })
      } catch {
        /* 스타일 로드 타이밍 — 무시 */
      }

      // 추천 입지 TOP20 — 금색 서클, 클릭 시 2D 분석으로
      try {
        const reco = recommendSites(20)
        map.addSource('reco', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: reco.map((s, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { rank: i + 1, name: s.name, score: `${s.score}/${s.max}`, lat: s.lat, lng: s.lng } })) },
        })
        map.addLayer({
          id: 'reco-c',
          type: 'circle',
          source: 'reco',
          paint: { 'circle-radius': 9, 'circle-color': '#f4c14b', 'circle-stroke-color': '#fff8e1', 'circle-stroke-width': 2, 'circle-opacity': 0.95 },
        })
        map.on('click', 'reco-c', (e) => {
          const p = e.features?.[0]?.properties
          if (p) navigate(`/?site=${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}`)
        })
        map.on('mouseenter', 'reco-c', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'reco-c', () => {
          map.getCanvas().style.cursor = ''
        })
      } catch {
        /* 무시 */
      }
    })

    return () => {
      cancelled = true
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
          <span className="badge status-operating">3D 베타 v4</span>
          우클릭 드래그로 회전·기울임 · 줌 13+ 건물 입체 · 🟡 추천입지 클릭 → 분석 · 송전선·변전소(154kV+) 전압별 색: 154 갈/345 보라/765 분홍
        </div>
      </div>
    </>
  )
}
