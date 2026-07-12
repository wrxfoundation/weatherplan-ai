import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import TopBar from '../TopBar.jsx'
import FilterBar from './FilterBar.jsx'
import ClimateBar from './ClimateBar.jsx'
import FacilityCard from '../dc/FacilityCard.jsx'
import SitePanel from '../score/SitePanel.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, DATA_VERSION, applyFilters } from '../data/facilities.js'
import { PLANTS, WIND_PLANTS, PUBLIC_DCS } from '../data/plants.js'
import { GEN_PERMIT_BUBBLES, SIDO_CENTROIDS, SIDO_METRO_CD } from '../data/genLicenses.js'
import { NEW_PLANTS_2025 } from '../data/newPlants2025.js'
import { headroomFor } from '../data/liveApi.js'

const SIDO_LIST = Object.entries(SIDO_CENTROIDS).map(([sido, [lat, lng]]) => ({ sido, lat, lng }))

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
  let cap
  if (p.capacity_mw != null) {
    const bld = p.capacity_building_mw ? ` (+건설 ${p.capacity_building_mw.toLocaleString()}MW)` : ''
    const units = p.units_operating ? ` · ${p.units_operating}호기 운영` : ''
    cap = `${esc(p.type)} · 설비용량 ${p.capacity_mw.toLocaleString()}MW${bld}${units}`
  } else {
    cap = `${esc(p.type)} · 설비용량 EPSIS 검증 대기`
  }
  const src = p.capacity_mw != null ? '원안위/한수원 호기별 현황(2025-06) · DC 전원 매칭 아님' : '발전 인프라 맥락 — DC 전원 매칭 아님'
  return `<div class="hc">
    <div class="hc-head"><strong>${esc(p.name)}</strong></div>
    <div class="hc-meta">${esc(p.operator)} · ${esc(p.sido)} ${esc(p.sigungu)}</div>
    <div class="hc-row">${cap}</div>
    <div class="hc-verify">${src}</div>
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

export default function MapPage({ power = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMw = Number.parseFloat(searchParams.get('min_mw'))
  const minMw = Number.isFinite(rawMw) && rawMw > 0 ? rawMw : null
  // 입지 구분: zone = 'cap'(수도권만) | 'non'(비수도권만) | ''(전체). noncap=1은 하위호환.
  const zone = searchParams.get('zone') || (searchParams.get('noncap') === '1' ? 'non' : '')
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
  const [showGenPermits, setShowGenPermits] = useState(power) // 발전 허가 2024+ 시도 버블 (전력 공급 파이프라인)
  const genLayerRef = useRef(null)
  const [showHeadroom, setShowHeadroom] = useState(false) // 계통 여유용량 시도 버블 (한전 분산전원)
  const headroomLayerRef = useRef(null)
  const [headrooms, setHeadrooms] = useState(null) // {sido: availableMw|null}
  const [region, setRegion] = useState(null) // 전력지도: 클릭한 시도 (지역 요약 카드)
  const [mapCenter, setMapCenter] = useState(null) // 상단 기후 바: 확정 지점 없을 때 지도 중심 기후
  // 모바일 바텀시트: 기본 접힘 → 로드 시 맵이 보이게. 지점/시설 선택하면 자동 펼침.
  const [sheetCollapsed, setSheetCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 760px)')?.matches === true,
  )

  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const clusterRef = useRef(null)
  const pointMarkerRef = useRef(null)

  const filtered = useMemo(
    () => applyFilters(FACILITIES, { statuses, type, sido, minMw, q, zone }),
    [statuses, type, sido, minMw, q, zone],
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
      setRegion(null)
      setSitePoint({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    // 딥링크 복원 시 해당 지점으로 카메라
    if (sitePoint) map.setView([sitePoint.lat, sitePoint.lng], 11)
    // 상단 기후 바: 확정 지점이 없을 땐 지도 중심 기후를 표시.
    // 0.05°(~5km) 격자로 스냅해 팬 중 과도한 재조회를 막고 캐시를 재사용한다.
    const snapCenter = (c) => ({ lat: Math.round(c.lat * 20) / 20, lng: Math.round(c.lng * 20) / 20 })
    map.whenReady(() => setMapCenter(snapCenter(map.getCenter())))
    map.on('moveend', () => setMapCenter(snapCenter(map.getCenter())))
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

  // 발전 허가 2024+ 시도 버블 — 개별 지번좌표 부재 → 시도 중심점에 건수 버블(정직: 건수 기준)
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (genLayerRef.current) {
      map.removeLayer(genLayerRef.current)
      genLayerRef.current = null
    }
    if (showGenPermits) {
      const g = L.layerGroup()
      const maxCount = Math.max(...GEN_PERMIT_BUBBLES.map((b) => b.count))
      for (const b of GEN_PERMIT_BUBBLES) {
        const r = 10 + 26 * Math.sqrt(b.count / maxCount) // sqrt 스케일 — 면적 비례
        const renewPct = Math.round((b.renew / b.count) * 100)
        L.circleMarker([b.lat, b.lng], {
          radius: r,
          color: 'rgba(53,213,238,0.9)',
          weight: 1.5,
          fillColor: 'rgba(69,212,131,0.28)',
          fillOpacity: 0.5,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${b.sido}</strong> · 발전 허가 <b>${b.count}건</b> (2024+)<br/>신재생 ${renewPct}% · 최다 ${b.topFuel || '—'}</div>`,
            { direction: 'top', offset: [0, -r], className: 'dc-hovercard', opacity: 1 },
          )
          .on('click', () => {
            setSelected(null)
            setSitePoint(null)
            setRegion(b.sido)
          })
          .addTo(g)
        L.marker([b.lat, b.lng], {
          icon: L.divIcon({ className: 'gen-bubble-label', html: `${b.count}`, iconSize: [40, 16], iconAnchor: [20, 8] }),
          interactive: false,
        }).addTo(g)
      }
      g.addTo(map)
      genLayerRef.current = g
    }
  }, [showGenPermits])

  // 계통 여유용량: 토글 시 17개 시도 중심점에서 headroom 조회 (KEPCO env 연동 시 실데이터)
  useEffect(() => {
    if (!showHeadroom || headrooms) return
    let alive = true
    Promise.all(
      SIDO_LIST.map((s) =>
        // 시도 버블: 서버측 vworld 없이 시도코드(metroCd)를 직접 넘겨 KEPCO 조회.
        headroomFor(s.lat, s.lng, SIDO_METRO_CD[s.sido])
          .then((v) => [s.sido, v?.available ? (v.availableMw ?? null) : null])
          .catch(() => [s.sido, null]),
      ),
    ).then((pairs) => alive && setHeadrooms(Object.fromEntries(pairs)))
    return () => {
      alive = false
    }
  }, [showHeadroom, headrooms])

  // 계통 여유용량 시도 버블 (cyan) — 값 있으면 크기, 없으면 회색 점선 '연동 대기'
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (headroomLayerRef.current) {
      map.removeLayer(headroomLayerRef.current)
      headroomLayerRef.current = null
    }
    if (showHeadroom) {
      const g = L.layerGroup()
      const vals = SIDO_LIST.map((s) => headrooms?.[s.sido]).filter((v) => v != null)
      const max = vals.length ? Math.max(...vals) : 0
      for (const s of SIDO_LIST) {
        const mw = headrooms?.[s.sido]
        const has = mw != null && max > 0
        const r = has ? 10 + 26 * Math.sqrt(mw / max) : 9
        L.circleMarker([s.lat, s.lng], {
          radius: r,
          color: has ? 'rgba(53,213,238,0.95)' : 'rgba(120,140,170,0.5)',
          weight: 1.3,
          fillColor: has ? 'rgba(53,213,238,0.24)' : 'rgba(120,140,170,0.12)',
          fillOpacity: has ? 0.5 : 0.25,
          dashArray: has ? undefined : '3 3',
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${s.sido}</strong> · 계통 여유용량<br/>${has ? `<b>${mw.toLocaleString()}MW</b>` : '연동 대기 (KEPCO env)'}</div>`, {
            direction: 'top', offset: [0, -r], className: 'dc-hovercard', opacity: 1,
          })
          .on('click', () => {
            setSelected(null)
            setSitePoint(null)
            setRegion(s.sido)
          })
          .addTo(g)
        if (has) L.marker([s.lat, s.lng], { icon: L.divIcon({ className: 'gen-bubble-label', html: `${Math.round(mw)}`, iconSize: [46, 16], iconAnchor: [23, 8] }), interactive: false }).addTo(g)
      }
      g.addTo(map)
      headroomLayerRef.current = g
    }
  }, [showHeadroom, headrooms])

  // 새 선택(시설·지점·지역)이 생기면 모바일 바텀시트를 자동으로 펼쳐 결과를 바로 보게 한다
  useEffect(() => {
    if (selected || sitePoint || region) setSheetCollapsed(false)
  }, [selected, sitePoint, region])

  // URL ?site= → sitePoint 동기화. 상단 통합검색(주소 지오코딩)이 /?site=로 이동하면
  // 이미 맵에 있어도 해당 지점으로 부지 분석 + 카메라 이동되게 한다.
  useEffect(() => {
    const raw = searchParams.get('site')
    if (!raw) return
    const [lat, lng] = raw.split(',').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 32 || lat > 40 || lng < 124 || lng > 132) return
    if (sitePoint && Math.abs(sitePoint.lat - lat) < 1e-4 && Math.abs(sitePoint.lng - lng) < 1e-4) return
    setSelected(null)
    setRegion(null)
    setSitePoint({ lat, lng })
    mapObj.current?.setView([lat, lng], Math.max(mapObj.current.getZoom?.() ?? 11, 12))
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

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
          setRegion(null)
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
    setRegion(null)
    mapObj.current?.setView([f.lat, f.lng], Math.max(mapObj.current.getZoom(), 11))
  }

  // 전력지도 지역 클릭 요약 데이터
  const regionInfo = useMemo(() => {
    if (!region) return null
    const bubble = GEN_PERMIT_BUBBLES.find((x) => x.sido === region)
    const dcs = FACILITIES.filter((f) => f.sido === region)
    const dcMw = dcs.reduce((s, f) => s + (f.power_mw_public ?? 0), 0)
    const np2025 = NEW_PLANTS_2025.find((x) => x.sido === region) || null
    return {
      sido: region,
      gen: bubble || null,
      new2025: np2025,
      headroomMw: headrooms?.[region] ?? null,
      dcCount: dcs.length,
      dcMw,
    }
  }, [region, headrooms])

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
        onMinMw={(v) => {
          const next = new URLSearchParams(searchParams)
          if (v != null && v > 0) next.set('min_mw', String(v))
          else next.delete('min_mw')
          setSearchParams(next, { replace: true })
        }}
        zone={zone}
        onZone={(z) => {
          const next = new URLSearchParams(searchParams)
          next.delete('noncap') // 레거시 파라미터 정리
          if (z) next.set('zone', z)
          else next.delete('zone')
          setSearchParams(next, { replace: true })
        }}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((v) => !v)}
        showPlants={showPlants}
        onTogglePlants={() => setShowPlants((v) => !v)}
        showPublic={showPublic}
        onTogglePublic={() => setShowPublic((v) => !v)}
        power={power}
        showGenPermits={showGenPermits}
        onToggleGenPermits={() => setShowGenPermits((v) => !v)}
        showHeadroom={showHeadroom}
        onToggleHeadroom={() => setShowHeadroom((v) => !v)}
      />
      <div className="map-layout">
        <div ref={mapRef} className="map-canvas" />
        <div className="map-top">
          {/* 주소(지번·도로명) 검색은 상단 통합 검색창으로 이동 — 여기선 기후 바만 */}
          <ClimateBar point={sitePoint || mapCenter} committed={!!sitePoint} />
        </div>
        <aside className={`side-panel${sheetCollapsed ? ' collapsed' : ''}`}>
          <button
            type="button"
            className="sheet-handle"
            onClick={() => setSheetCollapsed((v) => !v)}
            aria-expanded={!sheetCollapsed}
            aria-label={sheetCollapsed ? '패널 펼치기' : '패널 접기'}
          >
            <span className="sheet-grip" />
            <span className="sheet-hint">{sheetCollapsed ? '▲ 패널 펼치기' : '▼ 지도 넓게 보기'}</span>
          </button>
          {selected ? (
            <>
              <h2>
                <button type="button" className="chip btn" onClick={() => setSelected(null)}>
                  ← 목록으로
                </button>
              </h2>
              <FacilityCard facility={selected} />
            </>
          ) : region && regionInfo ? (
            <>
              <h2>
                <button type="button" className="chip btn" onClick={() => setRegion(null)}>
                  ← 목록으로
                </button>
              </h2>
              <article className="facility-card">
                <div className="status-line">
                  <span className="badge status-operating">전력 · 지역 요약</span>
                  <span className="badge">{regionInfo.sido}</span>
                </div>
                <h3>{regionInfo.sido} — 전력 공급 · 계통 · 데이터센터</h3>
                <div className="spec-grid">
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">발전 공급 파이프라인 (2024+ 허가)</div>
                    <div className="v">
                      {regionInfo.gen ? (
                        <>
                          <strong>{regionInfo.gen.count}건</strong>
                          {regionInfo.gen.mw > 0 && ` · 용량 ${regionInfo.gen.mw.toLocaleString()}MW(참고)`}
                          {' · 신재생 '}
                          {Math.round((regionInfo.gen.renew / regionInfo.gen.count) * 100)}%
                          {regionInfo.gen.topFuel && ` · 최다 ${regionInfo.gen.topFuel}`}
                        </>
                      ) : (
                        <span className="muted">허가 없음</span>
                      )}
                    </div>
                  </div>
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">2025 신규 발전 설치 (설비용량·개수)</div>
                    <div className="v">
                      {regionInfo.new2025 ? (
                        <>
                          <strong>{Math.round(regionInfo.new2025.capacityKw / 1000).toLocaleString()} MW</strong>
                          {` · ${regionInfo.new2025.count.toLocaleString()}개소`}
                        </>
                      ) : (
                        <span className="muted">데이터 없음</span>
                      )}
                    </div>
                  </div>
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">계통 여유용량 (한전 분산전원 22.9kV)</div>
                    <div className="v">
                      {regionInfo.headroomMw != null ? (
                        <strong>{regionInfo.headroomMw.toLocaleString()} MW</strong>
                      ) : (
                        <>
                          <span className="badge verify">실데이터 연동 대기 · 공개 API 미제공</span>
                          <a
                            className="mini-link"
                            href="https://cyber.kepco.co.kr/ckepco/mobile/resources/resources_search.jsp"
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 8 }}
                          >
                            한전 여유용량 직접 조회 →
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="spec-cell">
                    <div className="k">데이터센터 시설</div>
                    <div className="v">
                      <strong>{regionInfo.dcCount}</strong>곳
                    </div>
                  </div>
                  <div className="spec-cell">
                    <div className="k">DC 공개 전력</div>
                    <div className="v">{regionInfo.dcMw > 0 ? `${regionInfo.dcMw.toLocaleString()} MW` : '비공개'}</div>
                  </div>
                </div>
                <p className="note">
                  발전 공급은 3MW 초과 허가대장(2024+ 건수·용량 참고치), 계통 여유는 한전 분산전원 기준. 공급-여유-DC를 한 지역에서 대비.
                </p>
                <div className="card-actions">
                  <button type="button" className="btn primary" onClick={() => { setSido(regionInfo.sido); setRegion(null) }}>
                    이 지역 시설만 보기
                  </button>
                </div>
              </article>
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
              {power && (
                <div className="power-banner">
                  <strong>⚡ 전력 지도</strong> — 발전 공급 파이프라인(◎발전허가)·계통 여유용량(⚡여유용량)을 DC 위치와 겹쳐
                  본다. 상단 칩으로 레이어를 켜고, 시설 마커를 누르면 정보가, 빈 곳을 누르면 지점 분석이 나온다.
                </div>
              )}
              <div className="panel-title">
                {power ? '전력 · 시설 요약' : '사이트 인텔리전스'}
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
              <p className="map-hint">
                🧭 <strong>지도 빈 곳을 클릭</strong> → 부지 분석(전력·냉각·리스크 점수) · <strong>시설 마커 클릭</strong> → 상세 정보
              </p>
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
