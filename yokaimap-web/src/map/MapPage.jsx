import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { SITES, CATEGORIES, CAT, RAR, applyFilters, isApprox, PRECISION_LABEL, slugOf, META } from '../data/yokai.js'
import OmenPanel from './OmenPanel.jsx'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

/* vworld 한글 기본도 — 브라우저 직접 로드(도메인 등록키). 미설정 시 다크 타일만. */
const VW_KEY = import.meta.env.VITE_VWORLD_KEY
const VW_ATTR = '&copy; <a href="https://www.vworld.kr">국토교통부 브이월드</a>'
const BASE_MAPS = {
  dark: { label: '다크', url: DARK_TILES, attr: TILE_ATTR, needsKey: false },
  vbase: { label: '한글', url: `https://api.vworld.kr/req/wmts/1.0.0/${VW_KEY}/Base/{z}/{y}/{x}.png`, attr: VW_ATTR, needsKey: true },
  sat: { label: '위성', url: `https://api.vworld.kr/req/wmts/1.0.0/${VW_KEY}/Satellite/{z}/{y}/{x}.jpeg`, attr: VW_ATTR, needsKey: true },
}
const BASE_KEYS = Object.keys(BASE_MAPS).filter((k) => !BASE_MAPS[k].needsKey || VW_KEY)

// 남한 bbox — 초기 뷰 고정
const KR_BOUNDS = [
  [33.0, 124.6],
  [38.65, 131.0],
]

const RARITY_SIZE = { common: 11, uncommon: 13, rare: 15, epic: 17, legendary: 19 }

function markerIcon(site) {
  const c = CAT[site.yokai.category]
  const size = RARITY_SIZE[site.yokai.rarity] ?? 12
  const approx = isApprox(site.precision) ? ' approx' : ''
  return L.divIcon({
    className: '',
    html: `<span class="yk-marker${approx}" style="display:block;width:${size}px;height:${size}px;background:${c?.color ?? '#d94f36'}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

function popupHtml(site) {
  const e = site.yokai
  const c = CAT[e.category]
  return `<div class="hovercard">
    <div><strong>${esc(e.canonical)}</strong> <span style="color:${c?.color}">${esc(c?.name ?? '')}</span></div>
    <div class="muted" style="margin:2px 0 4px">${esc(site.name)} · ${esc(PRECISION_LABEL[site.precision])}</div>
    <div>${esc(e.summary)}</div>
    ${isApprox(site.precision) ? '<div style="color:var(--dancheong-gold);margin-top:4px">📍 근사 좌표 — 실제 지점이 아닙니다</div>' : ''}
    <div style="margin-top:6px;color:var(--accent-soft)">클릭 → 상세 보기</div>
  </div>`
}

export default function MapPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const clusterRef = useRef(null)
  const tileRef = useRef(null)

  const [base, setBase] = useState(BASE_KEYS[0])
  const [cats, setCats] = useState(() => new Set(params.get('cat') ? params.get('cat').split(',') : []))
  const [q, setQ] = useState(params.get('q') ?? '')
  const [showLow, setShowLow] = useState(params.get('low') === '1')

  const filteredSites = useMemo(() => {
    const entries = applyFilters(
      SITES.map((s) => s.yokai),
      { cats, q, showLowConfidence: showLow },
    )
    const keep = new Set(entries.map((e) => e.id))
    return SITES.filter((s) => keep.has(s.yokai.id))
  }, [cats, q, showLow])

  /* URL 동기화 — 공유 링크가 필터 상태를 그대로 복원한다 */
  useEffect(() => {
    const next = new URLSearchParams()
    if (cats.size) next.set('cat', [...cats].join(','))
    if (q) next.set('q', q)
    if (showLow) next.set('low', '1')
    setParams(next, { replace: true })
  }, [cats, q, showLow, setParams])

  /* 지도 생성 (1회) */
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    // maxZoom은 필수 — markerClusterGroup이 타일 레이어보다 먼저 붙기 때문에
    // 지도에 maxZoom이 없으면 "Map has no maxZoom specified"로 초기화가 통째로 실패한다.
    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: true, minZoom: 6, maxZoom: 18 })
    // 줌 컨트롤은 우하단 — 좌상단은 필터바, 우상단은 괴담지수 패널이 차지한다
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.fitBounds(KR_BOUNDS)
    mapRef.current = map
    clusterRef.current = L.markerClusterGroup({ maxClusterRadius: 46, disableClusteringAtZoom: 11 }).addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  /* 베이스맵 교체 */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    const b = BASE_MAPS[base]
    tileRef.current = L.tileLayer(b.url, { attribution: b.attr, maxZoom: 18 }).addTo(map)
    tileRef.current.bringToBack()
  }, [base])

  /* 마커 갱신 */
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    for (const site of filteredSites) {
      const m = L.marker([site.lat, site.lng], { icon: markerIcon(site), title: site.yokai.canonical })
      m.bindPopup(popupHtml(site), { closeButton: false })
      m.on('click', () => m.openPopup())
      m.on('popupopen', (ev) => {
        ev.popup.getElement()?.addEventListener('click', () => navigate(`/yokai/${slugOf(site.yokai)}`))
      })
      cluster.addLayer(m)
    }
  }, [filteredSites, navigate])

  const toggleCat = (id) =>
    setCats((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const shownEntries = new Set(filteredSites.map((s) => s.yokai.id)).size

  return (
    <div className="map-shell">
      <div className="map-canvas" ref={mapEl} />

      <div className="filterbar">
        <div className="panel filter-main">
          <input
            className="search"
            placeholder="요괴 이름·이표기·특징 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="요괴 검색"
          />
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${cats.has(c.id) ? ' on' : ''}`}
              style={{ '--chip-color': c.color }}
              onClick={() => toggleCat(c.id)}
              title={c.blurb}
            >
              <span className="dot" />
              {c.name}
            </button>
          ))}
          <button className={`chip${showLow ? ' on' : ''}`} onClick={() => setShowLow((v) => !v)} title="검증등급이 낮은 이설·미검증 항목을 함께 표시">
            이설·미검증 포함
          </button>
          <span className="small muted">
            {shownEntries}체 / 전승지 {filteredSites.length}곳
          </span>
          <span className="row" style={{ gap: 4 }}>
            {BASE_KEYS.map((k) => (
              <button key={k} className={`chip${base === k ? ' on' : ''}`} onClick={() => setBase(k)}>
                {BASE_MAPS[k].label}
              </button>
            ))}
          </span>
        </div>

        <OmenPanel lat={36.5} lng={127.8} sido={null} />
      </div>

      <div
        className="panel"
        style={{
          position: 'absolute',
          left: 'var(--sp-3)',
          bottom: 'var(--sp-3)',
          zIndex: 500,
          padding: '8px 12px',
          fontSize: 'var(--text-sm)',
          maxWidth: 300,
        }}
      >
        <div className="row" style={{ gap: 10 }}>
          {Object.entries(RAR).map(([id, r]) => (
            <span key={id} className="row" style={{ gap: 4 }}>
              <span
                className="yk-marker"
                style={{ width: RARITY_SIZE[id], height: RARITY_SIZE[id], background: 'var(--grey)', display: 'block' }}
              />
              {r.name}
            </span>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          점선 테두리 = 시군구·시도 중심점(근사 좌표). 광포설화는 대표 채록지만 표시합니다. 데이터 v{META.version}
        </div>
      </div>
    </div>
  )
}
