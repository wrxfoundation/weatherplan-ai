import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { TALE_SITES, KIND, taleSlug } from '../data/tales.js'
import {
  SITES,
  CATEGORIES,
  CAT,
  RARITY,
  REGIONS,
  applyFilters,
  isApprox,
  PRECISION_LABEL,
  slugOf,
  META,
} from '../data/yokai.js'
import OmenPanel from './OmenPanel.jsx'
import Icon from '../ui/Icon.jsx'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

/* vworld 한글 기본도·위성 — 브라우저 직접 로드(도메인 등록키). 미설정 시 다크 타일만. */
const VW_KEY = import.meta.env.VITE_VWORLD_KEY
const VW_ATTR = '&copy; <a href="https://www.vworld.kr">국토교통부 브이월드</a>'
const BASE_MAPS = {
  dark: { label: '다크', url: DARK_TILES, attr: TILE_ATTR, needsKey: false },
  vbase: { label: '한글', url: `https://api.vworld.kr/req/wmts/1.0.0/${VW_KEY}/Base/{z}/{y}/{x}.png`, attr: VW_ATTR, needsKey: true },
  sat: { label: '위성', url: `https://api.vworld.kr/req/wmts/1.0.0/${VW_KEY}/Satellite/{z}/{y}/{x}.jpeg`, attr: VW_ATTR, needsKey: true },
}
const BASE_KEYS = Object.keys(BASE_MAPS).filter((k) => !BASE_MAPS[k].needsKey || VW_KEY)

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
    html: `<span class="yk-marker${approx}" style="width:${size}px;height:${size}px;background:${c?.color ?? '#d9583c'}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

const KIND_COLOR = { myth: '#6b5b95', legend: '#4a7a5c', folktale: '#c2922f' }

/* 설화 배경지는 요괴 전승지와 모양을 달리한다 — 같은 원으로 찍으면
   '여기 요괴가 나온다'로 읽힌다. 마름모로 두고 색은 분류(신화·전설·민담)를 쓴다. */
function taleIcon(site) {
  const size = 12
  const approx = isApprox(site.precision) ? ' approx' : ''
  return L.divIcon({
    className: '',
    html: `<span class="yk-marker tale${approx}" style="width:${size}px;height:${size}px;background:${KIND_COLOR[site.tale.kind] ?? '#6b5b95'}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function talePopupHtml(site) {
  const t = site.tale
  return `<div class="hovercard">
    <div style="display:flex;align-items:center;gap:8px">
      <span class="tale-kind" data-kind="${t.kind}" style="--kind:${KIND_COLOR[t.kind]}">${esc(KIND[t.kind]?.name ?? t.kind)}</span>
      <strong>${esc(t.title)}</strong>
    </div>
    <p>${esc(t.summary)}</p>
    <div class="small muted">${esc(site.name)} · ${esc(site.sido)}${site.sigungu ? ' ' + esc(site.sigungu) : ''}</div>
  </div>`
}

function popupHtml(site) {
  const e = site.yokai
  const c = CAT[e.category]
  return `<div class="hovercard">
    <div style="display:flex;align-items:center;gap:8px">
      <span class="seal sm" style="--cat:${c?.color}">${esc(c?.glyph ?? '')}</span>
      <strong>${esc(e.canonical)}</strong>
    </div>
    <div class="muted" style="margin:4px 0 6px">${esc(site.name)} · ${esc(PRECISION_LABEL[site.precision])}</div>
    <div>${esc(e.summary)}</div>
    ${isApprox(site.precision) ? '<div style="color:var(--gold);margin-top:5px">근사 좌표 — 실제 지점이 아닙니다</div>' : ''}
    <div style="margin-top:8px;color:var(--seal-ink);font-weight:600">클릭 → 상세 보기</div>
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
  const [open, setOpen] = useState(false)
  const [cats, setCats] = useState(() => new Set(params.get('cat') ? params.get('cat').split(',') : []))
  const [rarities, setRarities] = useState(() => new Set())
  const [q, setQ] = useState(params.get('q') ?? '')
  const [showTales, setShowTales] = useState(true)
  const [showLow, setShowLow] = useState(params.get('low') === '1')

  const entries = useMemo(
    () => applyFilters(SITES.map((s) => s.yokai), { cats, rarities, q, showLowConfidence: showLow }),
    [cats, rarities, q, showLow],
  )
  const filteredSites = useMemo(() => {
    const keep = new Set(entries.map((e) => e.id))
    return SITES.filter((s) => keep.has(s.yokai.id))
  }, [entries])

  const catCounts = useMemo(
    () =>
      SITES.reduce((acc, s) => {
        acc[s.yokai.category] = (acc[s.yokai.category] ?? 0) + 1
        return acc
      }, {}),
    [],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (cats.size) next.set('cat', [...cats].join(','))
    if (q) next.set('q', q)
    if (showLow) next.set('low', '1')
    setParams(next, { replace: true })
  }, [cats, q, showLow, setParams])

  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    // maxZoom은 필수 — markerClusterGroup이 타일 레이어보다 먼저 붙기 때문에
    // 지도에 maxZoom이 없으면 "Map has no maxZoom specified"로 초기화가 통째로 실패한다.
    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: true, minZoom: 6, maxZoom: 18 })
    map.fitBounds(KR_BOUNDS)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    clusterRef.current = L.markerClusterGroup({ maxClusterRadius: 46, disableClusteringAtZoom: 11 }).addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    const b = BASE_MAPS[base]
    tileRef.current = L.tileLayer(b.url, { attribution: b.attr, maxZoom: 18 }).addTo(map)
    tileRef.current.bringToBack()
  }, [base])

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    for (const site of filteredSites) {
      const m = L.marker([site.lat, site.lng], { icon: markerIcon(site), title: site.yokai.canonical })
      m.bindPopup(popupHtml(site), { closeButton: false })
      m.on('popupopen', (ev) => {
        ev.popup.getElement()?.addEventListener('click', () => navigate(`/yokai/${slugOf(site.yokai)}`), { once: true })
      })
      cluster.addLayer(m)
    }
    if (showTales) {
      for (const site of TALE_SITES) {
        const m = L.marker([site.lat, site.lng], { icon: taleIcon(site), title: site.tale.title })
        m.bindPopup(talePopupHtml(site), { closeButton: false })
        m.on('popupopen', (ev) => {
          ev.popup
            .getElement()
            ?.addEventListener('click', () => navigate(`/seolhwa/${taleSlug(site.tale)}`), { once: true })
        })
        cluster.addLayer(m)
      }
    }
  }, [filteredSites, showTales, navigate])

  const flyTo = (r) => mapRef.current?.flyTo([r.lat, r.lng], 10, { duration: 0.8 })
  const toggle = (setter) => (id) =>
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const activeCount = cats.size + rarities.size + (showLow ? 1 : 0) + (showTales ? 0 : 1)

  return (
    <div className="map-shell">
      <div className="map-canvas" ref={mapEl} />

      <div className="map-ui map-topleft">
        <div className="panel map-search">
          <Icon name="search" size={16} style={{ color: 'var(--text-3)' }} />
          <input
            placeholder="요괴 이름·이표기·특징 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="요괴 검색"
          />
          <button className={`chip${open || activeCount ? ' on' : ''}`} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'close' : 'filter'} size={14} />
            필터{activeCount ? ` ${activeCount}` : ''}
          </button>
        </div>

        {open && (
          <div className="panel drawer">
            <section>
              <h3>분류</h3>
              <div className="cat-list">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`cat-row${cats.has(c.id) ? ' on' : ''}`}
                    style={{ '--cat': c.color }}
                    onClick={() => toggle(setCats)(c.id)}
                    title={c.blurb}
                  >
                    <span className="seal sm" style={{ '--cat': c.color }} aria-hidden="true">
                      {c.glyph}
                    </span>
                    {c.name}
                    <span className="cnt">{catCounts[c.id] ?? 0}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>희귀도</h3>
              <div className="row" style={{ gap: 5 }}>
                {RARITY.map((r) => (
                  <button
                    key={r.id}
                    className={`chip${rarities.has(r.id) ? ' on' : ''}`}
                    style={{ '--cat': r.color }}
                    onClick={() => toggle(setRarities)(r.id)}
                    title={r.desc}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>표시 옵션</h3>
              <div className="row">
                <button className={`chip${showLow ? ' on' : ''}`} onClick={() => setShowLow((v) => !v)}>
                  이설·미검증 포함
                </button>
                <button className={`chip${showTales ? ' on' : ''}`} onClick={() => setShowTales((v) => !v)}>
                  설화 배경지 <span className="num">{TALE_SITES.length}</span>
                </button>
              </div>
              <p className="small muted" style={{ margin: '8px 0 0' }}>
                근거가 약해 검증등급을 낮춘 항목은 기본적으로 숨깁니다. 설화 배경지는 요괴 전승지와 구분하려고
                마름모로 찍습니다 — 개체가 나타나는 곳이 아니라 이야기의 무대입니다.
              </p>
            </section>

            <section>
              <h3 className="row" style={{ gap: 6 }}>
                <Icon name="pin" size={14} />
                지역으로 이동
              </h3>
              <div className="row" style={{ gap: 4 }}>
                {REGIONS.map((r) => (
                  <button key={r.slug} className="chip" onClick={() => flyTo(r)}>
                    {r.name}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="row" style={{ gap: 6 }}>
                <Icon name="layers" size={14} />
                배경 지도
              </h3>
              <div className="row" style={{ gap: 5 }}>
                {BASE_KEYS.map((k) => (
                  <button key={k} className={`chip${base === k ? ' on' : ''}`} onClick={() => setBase(k)}>
                    {BASE_MAPS[k].label}
                  </button>
                ))}
              </div>
              {BASE_KEYS.length === 1 && (
                <p className="small muted" style={{ margin: '8px 0 0' }}>
                  한글·위성 배경은 vworld 키가 설정된 배포에서만 나타납니다.
                </p>
              )}
            </section>
          </div>
        )}

        <span className="spacer" />
        <OmenPanel lat={36.5} lng={127.8} sido={null} />
      </div>

      <div
        className="map-ui panel"
        style={{ left: 'var(--sp-3)', bottom: 'var(--sp-3)', padding: '10px 14px', maxWidth: 330 }}
      >
        <div className="row num" style={{ gap: 12, fontSize: 'var(--text-sm)' }}>
          <strong>
            {entries.length}체 · 전승지 {filteredSites.length}곳
          </strong>
          {RARITY.map((r) => (
            <span key={r.id} className="row" style={{ gap: 4 }}>
              <span
                className="yk-marker"
                style={{ width: RARITY_SIZE[r.id], height: RARITY_SIZE[r.id], background: 'var(--text-3)' }}
              />
              {r.name}
            </span>
          ))}
        </div>
        <div className="muted small" style={{ marginTop: 5 }}>
          점선 테두리는 시군구·시도 중심점(근사 좌표). 광포설화는 대표 채록지만 표시합니다. 데이터 v{META.version}
        </div>
      </div>
    </div>
  )
}
