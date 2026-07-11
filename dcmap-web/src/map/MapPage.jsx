import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import TopBar from '../TopBar.jsx'
import FilterBar from './FilterBar.jsx'
import FacilityCard from '../dc/FacilityCard.jsx'
import SitePanel from '../score/SitePanel.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, DATA_VERSION, applyFilters } from '../data/facilities.js'
import { PLANTS, WIND_PLANTS, PUBLIC_DCS } from '../data/plants.js'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
// 남한 bbox — 초기 뷰를 여기에 맞춰 북한·일본으로 화면이 낭비되지 않게 한다
const KR_BOUNDS = [
  [33.0, 124.6],
  [38.65, 130.95],
]

/* 아이소메트릭 빌딩 SVG — 줌인 시 입체 마커 (레퍼런스 HUD의 건물 문법)
 * 색은 CSS(.dc-iso .f-*)에서 상태 토큰으로 — SVG 안 hex 하드코딩 금지 */
const ISO_SVG = `<svg viewBox="0 0 24 26" xmlns="http://www.w3.org/2000/svg">
  <polygon class="f-top" points="12,2 22,8 12,14 2,8"/>
  <polygon class="f-left" points="2,8 12,14 12,24 2,18"/>
  <polygon class="f-right" points="12,14 22,8 22,18 12,24"/>
</svg>`

function markerIcon(f, iso) {
  const key = f.status === 'delayed' ? 'planned' : f.status
  const xl = f.power_mw_public >= HYPERSCALE_MW
  if (iso) {
    const s = xl ? 30 : 22
    return L.divIcon({
      className: `dc-iso ${key}${xl ? ' xl' : ''}`,
      html: ISO_SVG,
      iconSize: [s, s + 2],
      iconAnchor: [s / 2, s + 2], // 건물 바닥이 좌표에 닿게
    })
  }
  if (xl) {
    // 다이아몬드 회전은 내부 span에 — Leaflet의 루트 inline transform과 충돌 방지
    return L.divIcon({
      className: 'dc-marker-xl-wrap',
      html: `<span class="dc-marker ${key} xl"></span>`,
      iconSize: [18, 18],
    })
  }
  return L.divIcon({ className: `dc-marker ${key}`, iconSize: [14, 14] })
}

const ISO_ZOOM = 10 // 클러스터 해제 줌과 동일 — 개별 마커가 보이는 순간 입체로

/* 발전소 마커 — 육각 아웃라인 + ⚡ (원자력 cyan / 석탄 grey / 풍력 green·소형) */
const plantIcon = (p) => {
  const kind = p.type === '원자력' ? 'nuclear' : p.type === '풍력' ? 'wind' : 'coal'
  const s = kind === 'wind' ? [14, 15] : [22, 24]
  return L.divIcon({
    className: `plant-marker ${kind}`,
    html: `<svg viewBox="0 0 22 24"><polygon points="11,1 20.5,6.5 20.5,17.5 11,23 1.5,17.5 1.5,6.5"/><text x="11" y="16" text-anchor="middle">⚡</text></svg>`,
    iconSize: s,
  })
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

/* 호버 카드 — 클릭 없이 보는 요약 (시설) */
function hoverCard(f) {
  const key = f.status === 'delayed' ? 'planned' : f.status
  return `<div class="hc">
    <div class="hc-head"><span class="hc-dot ${key}"></span><strong>${esc(f.name)}</strong></div>
    <div class="hc-meta">${esc(f.operator ?? '운영사 미공개')} · ${esc(f.sido)}${f.sigungu ? ' ' + esc(f.sigungu) : ''}</div>
    <div class="hc-row">${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ' · 용량 비공개'}${f.year ? ` · ${f.year}` : ''}</div>
    ${f.needs_verify ? '<div class="hc-verify">검증 필요</div>' : ''}
    <div class="hc-cta">클릭 → 상세 카드</div>
  </div>`
}

function plantCard(p) {
  if (p.type === '풍력') {
    return `<div class="hc">
      <div class="hc-head"><strong>${esc(p.name)}</strong></div>
      <div class="hc-meta">${esc(p.address)}</div>
      <div class="hc-row">풍력 발전 지점 · 필지 좌표 (2023 현황)</div>
      <div class="hc-verify">신재생 근접성 맥락 — DC 전원 매칭 아님</div>
    </div>`
  }
  return `<div class="hc">
    <div class="hc-head"><strong>${esc(p.name)}</strong></div>
    <div class="hc-meta">${esc(p.operator)} · ${esc(p.sido)} ${esc(p.sigungu)}</div>
    <div class="hc-row">${esc(p.type)} · 설비용량 EPSIS 검증 대기</div>
    <div class="hc-verify">발전 인프라 맥락 — DC 전원 매칭 아님</div>
  </div>`
}

/* 공공 DC 마커 — 사각 아웃라인 + 公 (행안부 공공데이터, 시군구청 중심점) */
const publicIcon = () =>
  L.divIcon({
    className: 'pub-marker',
    html: `<svg viewBox="0 0 18 18"><rect x="1.5" y="1.5" width="15" height="15" rx="3.5"/><text x="9" y="13" text-anchor="middle">公</text></svg>`,
    iconSize: [18, 18],
  })

function publicCard(f) {
  return `<div class="hc">
    <div class="hc-head"><strong>${esc(f.name)}</strong></div>
    <div class="hc-meta">${esc(f.org)}${f.parent && f.parent !== f.org ? ` (${esc(f.parent)})` : ''}</div>
    <div class="hc-row">${esc(f.category)} · ${esc(f.sido)}${f.sigungu ? ' ' + esc(f.sigungu) : ''}</div>
    <div class="hc-verify">행안부 공공데이터 · 좌표는 시군구 중심점</div>
  </div>`
}

export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMw = Number.parseFloat(searchParams.get('min_mw'))
  const minMw = Number.isFinite(rawMw) && rawMw > 0 ? rawMw : null
  const q = searchParams.get('q') ?? ''

  const [statuses, setStatuses] = useState(() => new Set())
  const [type, setType] = useState('')
  const [sort, setSort] = useState('status') // status | mw | name
  // 지역 랜딩(/region/[slug]) "맵에서 보기" 진입점: ?sido= 초기값
  const [sido, setSido] = useState(() => searchParams.get('sido') ?? '')
  const [selected, setSelected] = useState(null)
  // 맵 빈 곳 클릭 → 지점 분석. ?site=lat,lng 딥링크로 공유 가능 (초기값 복원)
  const [sitePoint, setSitePoint] = useState(() => {
    const raw = searchParams.get('site')
    if (!raw) return null
    const [lat, lng] = raw.split(',').map(Number)
    return Number.isFinite(lat) && Number.isFinite(lng) && lat > 32 && lat < 40 && lng > 124 && lng < 132
      ? { lat, lng }
      : null
  })
  const [showLabels, setShowLabels] = useState(false) // 맵 정보 라벨 (시설명·용량) 상시 표시
  const [isoView, setIsoView] = useState(false) // 줌 ≥ ISO_ZOOM → 아이소메트릭 빌딩 마커
  const [denseLabels, setDenseLabels] = useState(false) // 줌 ≥ 13 → 그룹 개별 라벨 (미만은 대표 라벨)
  const [showPlants, setShowPlants] = useState(false) // 발전 인프라 레이어 (원전·석탄 대형 단지)
  const plantsLayerRef = useRef(null)
  const [showPublic, setShowPublic] = useState(false) // 공공 DC 레이어 (행안부 운영시설 61곳)
  const publicLayerRef = useRef(null)

  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const clusterRef = useRef(null)
  const pointMarkerRef = useRef(null)

  const filtered = useMemo(
    () => applyFilters(FACILITIES, { statuses, type, sido, minMw, q }),
    [statuses, type, sido, minMw, q],
  )
  const totalMw = useMemo(() => filtered.reduce((s, f) => s + (f.power_mw_public ?? 0), 0), [filtered])
  const statusCounts = useMemo(() => {
    const c = { operating: 0, construction: 0, planned: 0 }
    for (const f of filtered) c[f.status === 'delayed' ? 'planned' : f.status] += 1
    return c
  }, [filtered])

  const STATUS_ORDER = { operating: 0, construction: 1, planned: 2, delayed: 3 }
  const sorted = useMemo(() => {
    const list = [...filtered]
    if (sort === 'mw') {
      list.sort((a, b) => (b.power_mw_public ?? -1) - (a.power_mw_public ?? -1))
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    } else {
      list.sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (b.power_mw_public ?? -1) - (a.power_mw_public ?? -1),
      )
    }
    return list
  }, [filtered, sort])

  useEffect(() => {
    // 시안(hero-v1) 준거: 줌 컨트롤 우하단, 축척 좌하단
    const map = L.map(mapRef.current, { zoomControl: false, minZoom: 6 })
    map.fitBounds(KR_BOUNDS, { padding: [8, 8] })
    map.setMaxBounds([
      [30.5, 119.5],
      [41.5, 136.5],
    ])
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)
    L.tileLayer(DARK_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 30, // 밀도감: 촘촘히 붙은 것만 묶고 개별 마커를 최대한 노출
      disableClusteringAtZoom: 10,
      spiderfyOnMaxZoom: false,
      // 내부 span 절대배치로 센터링 — 외부 CSS(leaflet) 로드 순서와 무관하게 숫자를 원 중앙에 고정
      iconCreateFunction: (c) =>
        L.divIcon({
          className: 'dc-cluster',
          html: `<span class="dc-cluster-n">${c.getChildCount()}</span>`,
          iconSize: [30, 30],
        }),
    })
    map.addLayer(cluster)
    map.on('click', (e) => {
      setSelected(null)
      setSitePoint({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    // 딥링크 복원 시 해당 지점으로 카메라
    if (sitePoint) map.setView([sitePoint.lat, sitePoint.lng], 11)
    map.on('zoomend', () => {
      setIsoView(map.getZoom() >= ISO_ZOOM)
      setDenseLabels(map.getZoom() >= 13)
    })
    mapObj.current = map
    clusterRef.current = cluster
    return () => map.remove()
  }, [])

  // 발전 인프라 레이어 토글
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (plantsLayerRef.current) {
      map.removeLayer(plantsLayerRef.current)
      plantsLayerRef.current = null
    }
    if (showPlants) {
      const g = L.layerGroup()
      for (const p of [...PLANTS, ...WIND_PLANTS]) {
        L.marker([p.lat, p.lng], { icon: plantIcon(p), bubblingMouseEvents: false })
          .bindTooltip(plantCard(p), { direction: 'top', offset: [0, -10], className: 'dc-hovercard', opacity: 1 })
          .addTo(g)
      }
      g.addTo(map)
      plantsLayerRef.current = g
    }
  }, [showPlants])

  // 공공 DC 레이어 토글 — 같은 시군구 중심점 공유 다수라 동일 분산 규칙 적용
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (publicLayerRef.current) {
      map.removeLayer(publicLayerRef.current)
      publicLayerRef.current = null
    }
    if (showPublic) {
      const g = L.layerGroup()
      const groups = new Map()
      for (const f of PUBLIC_DCS) {
        const k = `${f.lat},${f.lng}`
        if (!groups.has(k)) groups.set(k, [])
        groups.get(k).push(f)
      }
      const SPREAD = 0.006
      for (const group of groups.values()) {
        group.forEach((f, gi) => {
          let { lat, lng } = f
          if (group.length > 1) {
            const a = (2 * Math.PI * gi) / group.length
            lat += SPREAD * Math.cos(a)
            lng += (SPREAD * Math.sin(a)) / Math.cos((f.lat * Math.PI) / 180)
          }
          L.marker([lat, lng], { icon: publicIcon(), bubblingMouseEvents: false })
            .bindTooltip(publicCard(f), { direction: 'top', offset: [0, -10], className: 'dc-hovercard', opacity: 1 })
            .addTo(g)
        })
      }
      g.addTo(map)
      publicLayerRef.current = g
    }
  }, [showPublic])

  // 지점 분석 마커 (십자 링) + ?site= URL 동기화 (공유 링크)
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (pointMarkerRef.current) {
      map.removeLayer(pointMarkerRef.current)
      pointMarkerRef.current = null
    }
    if (sitePoint) {
      pointMarkerRef.current = L.marker([sitePoint.lat, sitePoint.lng], {
        icon: L.divIcon({ className: 'site-point', iconSize: [26, 26] }),
        interactive: false,
      }).addTo(map)
    }
    const next = new URLSearchParams(searchParams)
    if (sitePoint) next.set('site', `${sitePoint.lat.toFixed(5)},${sitePoint.lng.toFixed(5)}`)
    else next.delete('site')
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
  }, [sitePoint]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return
    cluster.clearLayers()
    // 같은 시군구 중심점을 공유하는 시설은 표시 전용 원형 오프셋으로 분산
    // (데이터 좌표는 불변 — 겹친 마커·라벨이 서로를 가리는 문제 해결)
    const coordGroups = new Map()
    for (const f of filtered) {
      const k = `${f.lat},${f.lng}`
      if (!coordGroups.has(k)) coordGroups.set(k, [])
      coordGroups.get(k).push(f)
    }
    const SPREAD_DEG = 0.006 // ≈ 650m — 시군구 중심점 공유 그룹의 분산 반경
    let idx = 0
    for (const group of coordGroups.values()) {
      // 같은 방향으로 방사된 멤버 수 — 중간 줌에서 칩 폭(~200px)이 분산 간격보다
      // 넓어 같은 줄에서 겹치므로, 방향별로 세로 스태거를 준다
      const dirCount = {}
      group.forEach((f, gi) => {
        let lat = f.lat
        let lng = f.lng
        let angle = null
        if (group.length > 1) {
          angle = (2 * Math.PI * gi) / group.length
          lat += SPREAD_DEG * Math.cos(angle)
          lng += (SPREAD_DEG * Math.sin(angle)) / Math.cos((f.lat * Math.PI) / 180)
        }
        // bubblingMouseEvents:false — 마커 클릭이 맵 클릭(지점 분석)으로 전파되는 것 방지
        const m = L.marker([lat, lng], { icon: markerIcon(f, isoView), bubblingMouseEvents: false })
        const info = `${f.name} · ${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`
        // 라벨 ON 방향 규칙: 그룹 분산 마커는 분산 각도의 바깥쪽으로 방사(서로 반대 방향으로
        // 벌어져 충돌 최소화), 단독 마커는 좌우 교차 — / OFF: 호버 툴팁
        let dir
        if (angle != null) {
          const e = Math.sin(angle)
          const n = Math.cos(angle)
          if (Math.abs(e) < 0.4) dir = n > 0 ? 'top' : 'bottom'
          else dir = e > 0 ? 'right' : 'left'
        } else {
          dir = idx % 2 === 0 ? 'right' : 'left'
        }
        // 방향별 스태거: 같은 방향 2번째 멤버부터 18px씩 아래(top은 위)로 줄을 내린다
        const nth = (dirCount[dir] = (dirCount[dir] ?? 0) + 1) - 1
        const dy = nth * 18
        const OFF = {
          right: [10, dy],
          left: [-10, dy],
          top: [0, -12 - dy],
          bottom: [0, 12 + dy],
        }
        // 줌 13 미만에서 그룹(중심점 공유)은 개별 칩이 물리적으로 못 벌어짐 —
        // 대표 멤버 하나에만 "시군구 · N곳" 요약 라벨을 단다
        const groupSummary = group.length > 1 && !denseLabels
        const labelText = groupSummary ? `${f.sido} ${f.sigungu ?? ''} · ${group.length}곳`.trim() : info
        const skipLabel = groupSummary && gi !== 0
        // 라벨 OFF: 호버 시 요약 카드 (클릭 없이 대략 정보) / 라벨 ON: 상시 칩
        m.bindTooltip(
          showLabels && !skipLabel ? (groupSummary ? labelText : info) : hoverCard(f),
          showLabels && !skipLabel
            ? groupSummary
              ? { permanent: true, direction: 'top', offset: [0, -12], className: 'dc-label' }
              : { permanent: true, direction: dir, offset: OFF[dir], className: 'dc-label' }
            : { direction: 'top', offset: [0, -8], className: 'dc-hovercard', opacity: 1 },
        )
        m.on('click', () => {
          setSitePoint(null)
          setSelected(f)
        })
        cluster.addLayer(m)
        idx += 1
      })
    }
  }, [filtered, showLabels, isoView, denseLabels])

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
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showPlants={showPlants}
        onTogglePlants={() => setShowPlants((v) => !v)}
        showPublic={showPublic}
        onTogglePublic={() => setShowPublic((v) => !v)}
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
          ) : sitePoint ? (
            <SitePanel
              point={sitePoint}
              onClose={() => setSitePoint(null)}
              onSelectFacility={(f) => {
                setSitePoint(null)
                focusFacility(f)
              }}
            />
          ) : (
            <>
              <div className="panel-title">
                사이트 인텔리전스
                <span className="ver-chip" title="시드 데이터 버전 · 기준일">
                  v{DATA_VERSION.version} · {DATA_VERSION.date}
                </span>
              </div>
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
              {filtered.length > 0 && (
                <div className="status-summary">
                  <div
                    className="status-bar"
                    role="img"
                    aria-label={`운영 ${statusCounts.operating}, 건설 ${statusCounts.construction}, 계획 ${statusCounts.planned}`}
                  >
                    {statusCounts.operating > 0 && <span className="seg op" style={{ flexGrow: statusCounts.operating }} />}
                    {statusCounts.construction > 0 && (
                      <span className="seg co" style={{ flexGrow: statusCounts.construction }} />
                    )}
                    {statusCounts.planned > 0 && <span className="seg pl" style={{ flexGrow: statusCounts.planned }} />}
                  </div>
                  <div className="status-chips">
                    <span>
                      <i className="dot operating" /> 운영 <strong>{statusCounts.operating}</strong>
                    </span>
                    <span>
                      <i className="dot construction" /> 건설 <strong>{statusCounts.construction}</strong>
                    </span>
                    <span>
                      <i className="dot planned" /> 계획 <strong>{statusCounts.planned}</strong>
                    </span>
                  </div>
                </div>
              )}
              <div className="list-toolbar">
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
                  <option value="status">상태순 (운영→계획)</option>
                  <option value="mw">공개 용량순</option>
                  <option value="name">이름순</option>
                </select>
              </div>
              <div className="facility-list">
                {sorted.map((f) => (
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
