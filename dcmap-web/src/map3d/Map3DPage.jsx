import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, slugOf } from '../data/facilities.js'
import { SUBSTATION_POINTS } from '../data/substationPoints.js'
import { loadPowerLines } from '../data/powerLines.js'
import { recommendSites } from '../score/recommend.js'
import { STYLE_3D, facilityLabelLayer } from './style3d.js'

/* 3D 베타 — MapLibre GL
 * v5 성능 재점검: 79개 DOM 마커(프레임마다 transform 재계산 → 회전/기울임 버벅임의 주원인)를
 *   GPU 렌더 GL 서클 레이어로 교체. antialias off·maxPitch 제한·fadeDuration 축소로 렌더 부하↓.
 * 애니메이션 토글(기본 OFF): 켜면 송전선 흐름(line-dasharray 시퀀스) + 시설 반짝임(글로우 펄스). */

const TITLE = '3D 맵 (베타) — AI InfraMap'
const DESC = '한국 데이터센터 현황을 기울인 3D 시점에서 — MapLibre GL 전환 베타.'

// 상태별 색(tokens.css 미러) — operating green / construction orange / delayed amber / planned sky
const STATUS_COLOR = [
  'match',
  ['get', 'status'],
  'operating', '#45d483',
  'construction', '#f59a3c',
  'delayed', '#f4c14b',
  'planned', '#7dd3fc',
  '#7dd3fc',
]

// 흐르는 송전선 — dash 시퀀스 순환(GPU, setPaintProperty만; 저비용)
const DASH_SEQ = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
]

export default function Map3DPage() {
  const wrapRef = useRef(null)
  const mapRef = useRef(null)
  const readyRef = useRef(false)
  const navigate = useNavigate()
  const [anim, setAnim] = useState(false)

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
      maxPitch: 70,
      maxBounds: [
        [119.5, 30.5],
        [136.5, 41.5],
      ],
      antialias: false, // MSAA 비활성 — 회전/기울임 시 GPU 부하 큰 폭 감소
      fadeDuration: 100, // 심볼 페이드 단축(렌더 프레임 절감)
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    // 동일 좌표 그룹 분산(2D와 동일 규칙 — 표시 전용). GL 포인트 피처로만 구성(DOM 마커 없음).
    const groups = new Map()
    for (const f of FACILITIES) {
      const k = `${f.lat},${f.lng}`
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(f)
    }
    const SPREAD = 0.0045
    const dcFeatures = []
    for (const group of groups.values()) {
      group.forEach((f, gi) => {
        let { lat, lng } = f
        if (group.length > 1) {
          const a = (2 * Math.PI * gi) / group.length
          lat += SPREAD * Math.cos(a)
          lng += (SPREAD * Math.sin(a)) / Math.cos((f.lat * Math.PI) / 180)
        }
        dcFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] },
          properties: {
            status: f.status,
            slug: slugOf(f),
            xl: f.power_mw_public >= HYPERSCALE_MW ? 1 : 0,
            label: `${f.name}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`,
            title: `${f.name} · ${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`,
            sort: -(f.power_mw_public ?? 0),
          },
        })
      })
    }

    map.on('load', () => {
      if (cancelled) return
      map.addSource('dc', { type: 'geojson', data: { type: 'FeatureCollection', features: dcFeatures } })

      // 송전선(154kV+) — 전압별 색. 먼저 추가해 시설/라벨 아래로.
      loadPowerLines()
        .then((lines) => {
          if (cancelled || !map.getSource) return
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
                layout: { 'line-cap': 'round' },
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
              'dc-glow',
            )
          } catch {
            /* 스타일/타이밍 — 무시 */
          }
        })
        .catch(() => {})

      // 변전소(154kV+) — 전압별 색 서클
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
        /* 무시 */
      }

      // 시설 — GL 서클(글로우 + 코어). DOM 마커 대체(회전 시 버벅임 제거).
      map.addLayer({
        id: 'dc-glow',
        type: 'circle',
        source: 'dc',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, ['case', ['==', ['get', 'xl'], 1], 9, 6], 12, ['case', ['==', ['get', 'xl'], 1], 20, 13]],
          'circle-color': STATUS_COLOR,
          'circle-blur': 1,
          'circle-opacity': 0.35,
        },
      })
      map.addLayer({
        id: 'dc-core',
        type: 'circle',
        source: 'dc',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, ['case', ['==', ['get', 'xl'], 1], 4.5, 3], 12, ['case', ['==', ['get', 'xl'], 1], 8, 5.5]],
          'circle-color': STATUS_COLOR,
          'circle-stroke-color': '#eaf4ff',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.95,
        },
      })
      map.addLayer(facilityLabelLayer('dc'))

      map.on('click', 'dc-core', (e) => {
        const slug = e.features?.[0]?.properties?.slug
        if (slug) navigate(`/dc/${slug}`)
      })
      map.on('mouseenter', 'dc-core', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'dc-core', () => {
        map.getCanvas().style.cursor = ''
      })

      // 추천 입지 TOP20 — 금색 서클, 클릭 시 2D 분석으로
      try {
        const reco = recommendSites(20)
        map.addSource('reco', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: reco.map((s, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { rank: i + 1, lat: s.lat, lng: s.lng } })) },
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

      readyRef.current = true
    })

    return () => {
      cancelled = true
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [navigate])

  // 애니메이션 토글 — 송전선 흐름 + 시설 글로우 펄스. 기본 OFF(3D 렌더 부하 고려).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !anim) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let alive = true
    const start = typeof performance !== 'undefined' ? performance.now() : 0
    const tick = (now) => {
      if (!alive) return
      const map2 = mapRef.current
      if (map2 && readyRef.current) {
        const t = now - start
        // 송전선 흐름
        if (map2.getLayer('lines')) {
          const idx = Math.floor((t / 55) % DASH_SEQ.length)
          try {
            map2.setPaintProperty('lines', 'line-dasharray', DASH_SEQ[idx])
          } catch {
            /* 무시 */
          }
        }
        // 시설 글로우 펄스(0.2~0.55)
        if (map2.getLayer('dc-glow')) {
          const pulse = 0.38 + 0.2 * Math.sin(t / 480)
          try {
            map2.setPaintProperty('dc-glow', 'circle-opacity', pulse)
          } catch {
            /* 무시 */
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      // 토글 OFF 시 정적 상태 복원
      const map2 = mapRef.current
      if (map2 && readyRef.current) {
        try {
          if (map2.getLayer('lines')) map2.setPaintProperty('lines', 'line-dasharray', [1])
          if (map2.getLayer('dc-glow')) map2.setPaintProperty('dc-glow', 'circle-opacity', 0.35)
        } catch {
          /* 무시 */
        }
      }
    }
  }, [anim])

  return (
    <>
      <TopBar />
      <div className="map-layout">
        <div ref={wrapRef} className="map-canvas map3d" />
        <button
          type="button"
          className={`map3d-anim ${anim ? 'on' : ''}`}
          onClick={() => setAnim((v) => !v)}
          aria-pressed={anim}
          title="송전망 흐름·시설 반짝임 애니메이션"
        >
          {anim ? '✨ 애니메이션 ON' : '애니메이션 OFF'}
        </button>
        <div className="map3d-banner">
          <span className="badge status-operating">3D 베타 v5</span>
          우클릭 드래그로 회전·기울임 · 줌 13+ 건물 입체 · 🟡 추천입지 클릭 → 분석 · 송전선·변전소(154kV+) 전압별 색: 154 갈/345 보라/765 분홍
        </div>
      </div>
    </>
  )
}
