import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import TopBar from '../TopBar.jsx'
import FilterBar from './FilterBar.jsx'
import ClimateBar from './ClimateBar.jsx'
import LineIcon, { factorySvg } from '../components/LineIcon.jsx'
import Legend from './Legend.jsx'
import ShareButton from './ShareButton.jsx'
import AiAssistant from '../ai/AiAssistant.jsx'
import FacilityCard from '../dc/FacilityCard.jsx'
import SitePanel from '../score/SitePanel.jsx'
import CompareTray from '../score/CompareTray.jsx'
import { FACILITIES, STATUS_LABEL, HYPERSCALE_MW, DATA_VERSION, applyFilters, isCoarseGeocode } from '../data/facilities.js'
import { PLANTS, WIND_PLANTS, PUBLIC_DCS } from '../data/plants.js'
import { SUBSTATION_POINTS } from '../data/substationPoints.js'
import { INDUSTRIAL_COMPLEXES } from '../data/industrialComplexes.js'
import { POWER_BALANCE, selfSufficiencyLabel } from '../data/powerBalance.js'
import { GRID_HEADROOM, GRID_HEADROOM_META } from '../data/gridHeadroom.js'
import { RENEWABLE_ESS } from '../data/renewableEss.js'
import { CAPITAL_PIPELINE } from '../data/capitalPipeline.js'
import { DEV_CONFLICTS } from '../data/dcRealEstate.js'
import { loadPowerLines, lineColor, POWER_LINES_AVAILABLE } from '../data/powerLines.js'
import { NETWORK_NODES } from '../data/network.js'
import { recommendSites, recoReasons } from '../score/recommend.js'
import { RENEWABLE_PLANTS } from '../data/renewablePlants.js'
import { WATER_SOURCES } from '../data/waterSources.js'
import { SEMI_CLUSTERS } from '../data/semiClusters.js'
import { GEN_PERMIT_BUBBLES, SIDO_CENTROIDS, SIDO_METRO_CD } from '../data/genLicenses.js'
import { dcApprovalForSido, approvalLabel } from '../data/gridAssessment.js'
import { geomAreaM2 } from '../data/geomArea.js'
import { NEW_PLANTS_2025 } from '../data/newPlants2025.js'
import { headroomFor, parcelAt, smpToday, fuelMixNow, epsisCapacity } from '../data/liveApi.js'
import { useMapLang } from '../i18n/mapLang.js'

const SIDO_LIST = Object.entries(SIDO_CENTROIDS).map(([sido, [lat, lng]]) => ({ sido, lat, lng }))

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
// vworld 한글 기본도·위성 — 브라우저 직접 로드(도메인 등록키). 미설정 시 다크만 노출.
const VW_KEY = import.meta.env.VITE_VWORLD_KEY
const vwUrl = (layer, ext) => `https://api.vworld.kr/req/wmts/1.0.0/${VW_KEY}/${layer}/{z}/{y}/{x}.${ext}`
const VW_ATTR = '&copy; <a href="https://www.vworld.kr">국토교통부 브이월드</a>'
const BASE_MAPS = {
  dark: { label: '다크', labelEn: 'Dark', needsKey: false, tiles: [{ url: DARK_TILES, attr: TILE_ATTRIBUTION }] },
  vbase: { label: '한글', labelEn: 'Korean', needsKey: true, tiles: [{ url: vwUrl('Base', 'png'), attr: VW_ATTR }] },
  sat: { label: '위성', labelEn: 'Satellite', needsKey: true, tiles: [{ url: vwUrl('Satellite', 'jpeg'), attr: VW_ATTR }, { url: vwUrl('Hybrid', 'png'), attr: VW_ATTR }] },
}
const BASE_KEYS = Object.keys(BASE_MAPS).filter((k) => !BASE_MAPS[k].needsKey || VW_KEY)
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
  // cancelled(무산): 계획 마커 모양을 쓰되 'cancelled' 수식자로 흐리게 표시(지도에서 사라지지 않게)
  const key = f.status === 'delayed' ? 'planned' : f.status === 'cancelled' ? 'planned cancelled' : f.status
  const xl = f.power_mw_public >= HYPERSCALE_MW
  // 근사 좌표(시군구/시도 중심점)는 'approx' 수식자로 점선 링 — 실제 부지가 아님을 정직하게 표시
  const approx = isCoarseGeocode(f.geocode_level) ? ' approx' : ''
  if (iso) {
    const s = xl ? 30 : 22
    return L.divIcon({
      className: `dc-iso ${key}${xl ? ' xl' : ''}${approx}`,
      html: ISO_SVG,
      iconSize: [s, s + 2],
      iconAnchor: [s / 2, s + 2], // 건물 바닥이 좌표에 닿게
    })
  }
  if (xl) {
    // 다이아몬드 회전은 내부 span에 — Leaflet의 루트 inline transform과 충돌 방지
    return L.divIcon({
      className: `dc-marker-xl-wrap${approx}`,
      html: `<span class="dc-marker ${key} xl"></span>`,
      iconSize: [18, 18],
    })
  }
  return L.divIcon({ className: `dc-marker ${key}${approx}`, iconSize: [14, 14] })
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
function hoverCard(f, t) {
  const key = f.status === 'delayed' ? 'planned' : f.status
  return `<div class="hc">
    <div class="hc-head"><span class="hc-dot ${key}"></span><strong>${esc(f.name)}</strong></div>
    <div class="hc-meta">${esc(f.operator ?? t('운영사 미공개', 'operator undisclosed'))} · ${esc(f.sido)}${f.sigungu ? ' ' + esc(f.sigungu) : ''}</div>
    <div class="hc-row">${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : t(' · 용량 비공개', ' · capacity undisclosed')}${f.year ? ` · ${f.year}` : ''}</div>
    ${isCoarseGeocode(f.geocode_level) ? `<div class="hc-approx">${t('📍 위치 근사 — 시군구 중심점(실제 부지 아님)', '📍 approx. location — sigungu centroid (not the actual site)')}</div>` : ''}
    ${f.needs_verify ? `<div class="hc-verify">${t('검증 필요', 'needs verification')}</div>` : ''}
    <div class="hc-cta">${t('클릭 → 상세 카드', 'Click → detail card')}</div>
  </div>`
}

function plantCard(p, t) {
  if (p.type === '풍력') {
    return `<div class="hc">
      <div class="hc-head"><strong>${esc(p.name)}</strong></div>
      <div class="hc-meta">${esc(p.address)}</div>
      <div class="hc-row">${t('풍력 발전 지점 · 필지 좌표 (2023 현황)', 'Wind generation point · parcel coordinates (2023 status)')}</div>
      <div class="hc-verify">${t('신재생 근접성 맥락 — DC 전원 매칭 아님', 'Renewable proximity context — not a DC power match')}</div>
    </div>`
  }
  let cap
  if (p.capacity_mw != null) {
    const bld = p.capacity_building_mw ? t(` (+건설 ${p.capacity_building_mw.toLocaleString()}MW)`, ` (+under construction ${p.capacity_building_mw.toLocaleString()}MW)`) : ''
    const units = p.units_operating ? t(` · ${p.units_operating}호기 운영`, ` · ${p.units_operating} units operating`) : ''
    cap = `${esc(p.type)} · ${t('설비용량', 'capacity')} ${p.capacity_mw.toLocaleString()}MW${bld}${units}`
  } else {
    cap = `${esc(p.type)} · ${t('설비용량 EPSIS 검증 대기', 'capacity EPSIS verification pending')}`
  }
  const src = p.capacity_mw != null ? t('원안위/한수원 호기별 현황(2025-06) · DC 전원 매칭 아님', '원안위/한수원 unit-by-unit status (2025-06) · not a DC power match') : t('발전 인프라 맥락 — DC 전원 매칭 아님', 'Power-generation infrastructure context — not a DC power match')
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

function publicCard(f, t) {
  return `<div class="hc">
    <div class="hc-head"><strong>${esc(f.name)}</strong></div>
    <div class="hc-meta">${esc(f.org)}${f.parent && f.parent !== f.org ? ` (${esc(f.parent)})` : ''}</div>
    <div class="hc-row">${esc(f.category)} · ${esc(f.sido)}${f.sigungu ? ' ' + esc(f.sigungu) : ''}</div>
    <div class="hc-verify">${t('행안부 공공데이터 · 좌표는 시군구 중심점', '행안부 public data · coordinates are sigungu centroid')}</div>
  </div>`
}

export default function MapPage({ power = false }) {
  const en = useMapLang() === 'en'
  const t = (ko, enStr) => (en ? enStr : ko)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMw = Number.parseFloat(searchParams.get('min_mw'))
  const minMw = Number.isFinite(rawMw) && rawMw > 0 ? rawMw : null
  // 입지 구분: zone = 'cap'(수도권만) | 'non'(비수도권만) | ''(전체). noncap=1은 하위호환.
  const zone = searchParams.get('zone') || (searchParams.get('noncap') === '1' ? 'non' : '')
  const q = searchParams.get('q') ?? ''
  // 활성 레이어 딥링크(?layers=subs,semi,...) — 초기 복원 + 공유용
  const _initLayers = new Set((searchParams.get('layers') || '').split(',').filter(Boolean))

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
  const [showLabels, setShowLabels] = useState(() => _initLayers.has('labels')) // 맵 정보 라벨 (시설명·용량) 상시 표시
  const [isoView, setIsoView] = useState(false) // 줌 ≥ ISO_ZOOM → 아이소메트릭 빌딩 마커
  const [denseLabels, setDenseLabels] = useState(false) // 줌 ≥ 13 → 그룹 개별 라벨 (미만은 대표 라벨)
  const [showPlants, setShowPlants] = useState(() => _initLayers.has('plants')) // 발전 인프라 레이어 (원전·석탄 대형 단지)
  const plantsLayerRef = useRef(null)
  const [showSubs, setShowSubs] = useState(() => _initLayers.has('subs')) // 154kV+ 변전소 레이어 (OSM 841개)
  const subsLayerRef = useRef(null)
  const [showLines, setShowLines] = useState(() => _initLayers.has('lines')) // 송전선로 레이어 (OSM power=line, 데이터 확보 시)
  const linesLayerRef = useRef(null)
  const [showComplexes, setShowComplexes] = useState(() => _initLayers.has('complex')) // 주요 국가산단 레이어
  const complexLayerRef = useRef(null)
  const [showNet, setShowNet] = useState(() => _initLayers.has('net')) // 통신망 레이어(국사·IDC·육양국)
  const netLayerRef = useRef(null)
  const [showPipeline, setShowPipeline] = useState(() => _initLayers.has('pipeline')) // 수도권 공급예정 DC(근사)
  const pipelineLayerRef = useRef(null)
  const siteSubstLayerRef = useRef(null)
  const [siteSubsts, setSiteSubsts] = useState([]) // 부지 분석 시 반환된 변전소(실좌표·여유) — 색상 레이어
  const [livePulse, setLivePulse] = useState(null) // 전국 실시간 전력시장 배지(SMP·발전믹스·예비율)
  const [showRe, setShowRe] = useState(() => _initLayers.has('re')) // 재생발전단지 레이어(RE100)
  const reLayerRef = useRef(null)
  const [showWater, setShowWater] = useState(() => _initLayers.has('water')) // 주요 수원(다목적·용수댐) 레이어
  const waterLayerRef = useRef(null)
  const [showSemi, setShowSemi] = useState(() => _initLayers.has('semi')) // 반도체·AI 메가클러스터 레이어
  const semiLayerRef = useRef(null)
  const [showReco, setShowReco] = useState(() => _initLayers.has('reco')) // 추천 입지 TOP(정적 근거 랭킹)
  const recoLayerRef = useRef(null)
  const [recoMw, setRecoMw] = useState(40) // 시뮬레이터: 필요 용량(계통 공급여유 하한)
  const [recoNonCap, setRecoNonCap] = useState(false) // 비수도권만
  const recoTop = useMemo(
    () => (showReco ? recommendSites(20, { minMw: recoMw || null, nonCapitalOnly: recoNonCap }) : []),
    [showReco, recoMw, recoNonCap],
  )
  // 사이드패널 확장(2배 폭) 토글 — 좌측 가운데 엣지 버튼. 선택은 브라우저 저장.
  const [panelWide, setPanelWide] = useState(() => {
    try {
      return localStorage.getItem('dcmap.panelWide') === '1'
    } catch {
      return false
    }
  })
  const togglePanelWide = () =>
    setPanelWide((v) => {
      const nv = !v
      try {
        localStorage.setItem('dcmap.panelWide', nv ? '1' : '0')
      } catch {
        /* 저장 불가 무시 */
      }
      return nv
    })
  // 확장 상태를 :root 클래스로 — 필터바·플로팅 요소 등 map-layout 밖의 --panel-width 소비자까지 일괄 반영
  useEffect(() => {
    document.documentElement.classList.toggle('panel-wide', panelWide)
    // 패널 폭 변경 → 맵 캔버스 크기 변동 — 전환 애니메이션 후 Leaflet 재계산
    const t = setTimeout(() => {
      try {
        mapObj.current?.invalidateSize()
      } catch {
        /* 무시 */
      }
    }, 320)
    return () => {
      clearTimeout(t)
      document.documentElement.classList.remove('panel-wide')
    }
  }, [panelWide])
  const [baseMap, setBaseMap] = useState(() => {
    try {
      const v = localStorage.getItem('dcmap.baseMap')
      if (v && BASE_KEYS.includes(v)) return v
    } catch {
      /* ignore */
    }
    return 'dark'
  })
  const baseTileRef = useRef([])
  const [showPublic, setShowPublic] = useState(() => _initLayers.has('public')) // 공공 DC 레이어 (행안부 운영시설 61곳)
  const publicLayerRef = useRef(null)
  const [showGenPermits, setShowGenPermits] = useState(() => power || _initLayers.has('permit')) // 발전 허가 2024+ 시도 버블 (전력 공급 파이프라인)
  const genLayerRef = useRef(null)
  const [showHeadroom, setShowHeadroom] = useState(() => _initLayers.has('headroom')) // 계통 여유용량 시도 버블 (한전 분산전원)
  const headroomLayerRef = useRef(null)
  const [showApproval, setShowApproval] = useState(() => _initLayers.has('approval')) // DC 공급 승인율 시도 버블 (계통영향평가 1차 기술검토)
  const approvalLayerRef = useRef(null)
  const parcelLayerRef = useRef(null) // 지점이 속한 필지(연속지적도) 경계
  const [headrooms, setHeadrooms] = useState(null) // {sido: availableMw|null}
  const [region, setRegion] = useState(null) // 전력지도: 클릭한 시도 (지역 요약 카드)
  const [mapCenter, setMapCenter] = useState(null) // 상단 기후 바: 확정 지점 없을 때 지도 중심 기후
  // 후보지 비교 — 부지 분석 스냅샷 최대 3곳(localStorage 유지)
  const [compare, setCompare] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dcmap.compare') || '[]').slice(0, 3)
    } catch {
      return []
    }
  })
  const persistCompare = (next) => {
    setCompare(next)
    try {
      localStorage.setItem('dcmap.compare', JSON.stringify(next))
    } catch {
      /* 저장 불가 무시 */
    }
  }
  const addCompare = (snap) => {
    persistCompare([...compare.filter((c) => c.id !== snap.id), snap].slice(-3))
  }
  const removeCompare = (id) => persistCompare(compare.filter((c) => c.id !== id))
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
  // 전력 공개 시설 수 — '공개 전력 합계'가 전체가 아닌 공개분 집계임을 명시(정직성)
  const mwDisclosed = useMemo(() => filtered.filter((f) => f.power_mw_public != null).length, [filtered])
  // 공개 전력을 상태별로 분해 — 합계의 상당수가 계획(미준공)임을 드러냄(운영 용량 과대해석 방지)
  const mwByStatus = useMemo(() => {
    const m = { operating: 0, construction: 0, planned: 0 }
    for (const f of filtered) {
      if (f.power_mw_public == null) continue
      const k = f.status === 'delayed' ? 'planned' : f.status
      if (m[k] != null) m[k] += f.power_mw_public // 무산(cancelled)은 합산 제외
    }
    return m
  }, [filtered])
  const statusCounts = useMemo(() => {
    const c = { operating: 0, construction: 0, planned: 0 }
    for (const f of filtered) {
      const k = f.status === 'delayed' ? 'planned' : f.status
      if (c[k] != null) c[k] += 1 // cancelled(무산) 등은 운영/건설/계획 집계에서 제외
    }
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
    // maxZoom을 맵에 직접 지정 — 베이스 타일이 [baseMap] 이펙트에서 지연 추가되므로,
    // 그전에 markerCluster가 붙어도 'Map has no maxZoom specified' 크래시가 나지 않게.
    // preferCanvas: 변전소 841·송전선 수천 폴리라인·산단 511 등 벡터 레이어를 SVG DOM 노드 대신
    // 단일 캔버스에 래스터 — DOM 노드·리스너·메모리 대폭 절감(다중 탭 성능의 핵심)
    const map = L.map(mapRef.current, { zoomControl: false, minZoom: 6, maxZoom: 19, preferCanvas: true })
    map.fitBounds(KR_BOUNDS, { padding: [8, 8] })
    map.setMaxBounds([
      [30.5, 119.5],
      [41.5, 136.5],
    ])
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)
    // 베이스맵은 아래 [baseMap] 이펙트가 적용(마운트 직후 실행)
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
    return () => {
      // 언마운트 누수 방지 — 레이어 ref가 detached DOM·리스너를 붙든 채 살아남지 않게
      // 전부 명시 해제(맵↔다른 페이지 왕복 시 노드·리스너 누적 실측으로 확인된 문제)
      for (const r of [
        plantsLayerRef, subsLayerRef, linesLayerRef, complexLayerRef, netLayerRef, pipelineLayerRef, reLayerRef,
        waterLayerRef, semiLayerRef, recoLayerRef, publicLayerRef, genLayerRef, headroomLayerRef,
        approvalLayerRef, parcelLayerRef, pointMarkerRef, siteSubstLayerRef,
      ]) {
        try {
          if (r.current) map.removeLayer(r.current)
        } catch {
          /* 무시 */
        }
        r.current = null
      }
      try {
        cluster.clearLayers()
        map.removeLayer(cluster)
      } catch {
        /* 무시 */
      }
      clusterRef.current = null
      map.off()
      map.remove()
      mapObj.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          .bindTooltip(plantCard(p, t), { direction: 'top', offset: [0, -10], className: 'dc-hovercard', opacity: 1 })
          .addTo(g)
      }
      g.addTo(map)
      plantsLayerRef.current = g
    }
  }, [showPlants, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 송전선로 레이어 토글 — OSM power=line, 전압별 색 폴리라인(켤 때 JSON 지연 로드).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (linesLayerRef.current) {
      map.removeLayer(linesLayerRef.current)
      linesLayerRef.current = null
    }
    if (!showLines) return
    let cancelled = false
    loadPowerLines()
      .then((lines) => {
        if (cancelled || !mapObj.current) return
        const g = L.layerGroup()
        for (const { p, v } of lines) {
          L.polyline(p, { color: lineColor(v), weight: v >= 345 ? 2.2 : 1.2, opacity: 0.65 }).addTo(g)
        }
        g.addTo(map)
        linesLayerRef.current = g
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [showLines])

  // 154kV+ 변전소 레이어 토글 — OSM 841개. 전압별 색(765>345>154), 가벼운 원형 마커.
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (subsLayerRef.current) {
      map.removeLayer(subsLayerRef.current)
      subsLayerRef.current = null
    }
    if (showSubs) {
      const g = L.layerGroup()
      const color = (kv) => (kv >= 765 ? '#f0abfc' : kv >= 345 ? '#c084fc' : '#7dd3fc')
      const rad = (kv) => (kv >= 765 ? 6 : kv >= 345 ? 5 : 3.5)
      for (const [lat, lng, kv, name] of SUBSTATION_POINTS) {
        L.circleMarker([lat, lng], {
          radius: rad(kv),
          color: color(kv),
          weight: 1.2,
          fillColor: color(kv),
          fillOpacity: 0.55,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${name || t(`${kv}kV 변전소`, `${kv}kV substation`)}</strong> · ${kv}kV<br/><span class="muted">${t('한전 변전소 · OSM 좌표(근사)', '한전 substation · OSM coordinates (approx)')}</span></div>`,
            { direction: 'top', offset: [0, -6], className: 'dc-hovercard', opacity: 1 },
          )
          .addTo(g)
      }
      g.addTo(map)
      subsLayerRef.current = g
    }
  }, [showSubs, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 베이스맵 전환 — 다크(CartoDB) / 한글 일반(vworld) / 위성(vworld). 타일은 최하단.
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    baseTileRef.current.forEach((l) => map.removeLayer(l))
    baseTileRef.current = []
    const conf = BASE_MAPS[baseMap] || BASE_MAPS.dark
    for (const t of conf.tiles) {
      const layer = L.tileLayer(t.url, { attribution: t.attr, maxZoom: 19, minZoom: 6 })
      layer.addTo(map)
      layer.bringToBack()
      baseTileRef.current.push(layer)
    }
    try {
      localStorage.setItem('dcmap.baseMap', baseMap)
    } catch {
      /* ignore */
    }
  }, [baseMap])

  // 추천 입지 레이어 — 정적 근거 점수 TOP20을 금색 순위 마커로. 클릭 시 전체 분석.
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (recoLayerRef.current) {
      map.removeLayer(recoLayerRef.current)
      recoLayerRef.current = null
    }
    if (showReco && recoTop.length) {
      const g = L.layerGroup()
      recoTop.forEach((s, i) => {
        const m = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: 'reco-marker', html: `<span class="reco-dot">${i + 1}</span>`, iconSize: [24, 24] }),
          zIndexOffset: 1000,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>#${i + 1} ${s.name}</strong> · ${s.sido}<br/>${t('정적 근거', 'static basis')} <b>${s.score}/${s.max}</b><br/><span class="muted">${recoReasons(s).join(' · ')}</span><br/><span class="muted">${t('클릭 → 전체 분석', 'Click → full analysis')}</span></div>`,
            { direction: 'top', offset: [0, -12], className: 'dc-hovercard', opacity: 1 },
          )
          .on('click', () => {
            setSelected(null)
            setRegion(null)
            setSitePoint({ lat: s.lat, lng: s.lng })
            map.setView([s.lat, s.lng], 12)
          })
        m.addTo(g)
      })
      g.addTo(map)
      recoLayerRef.current = g
    }
  }, [showReco, recoTop, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 재생발전단지 레이어 토글 — 대형 태양광·풍력(RE100 조달 맥락).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (reLayerRef.current) {
      map.removeLayer(reLayerRef.current)
      reLayerRef.current = null
    }
    if (showRe) {
      const g = L.layerGroup()
      for (const [lat, lng, type, name] of RENEWABLE_PLANTS) {
        L.circleMarker([lat, lng], {
          radius: type === 'W' ? 5 : 3.5,
          color: type === 'W' ? '#4ade80' : '#fde047',
          weight: 1.2,
          fillColor: type === 'W' ? '#4ade80' : '#fde047',
          fillOpacity: 0.55,
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${name || (type === 'W' ? t('풍력단지', 'Wind farm') : t('태양광단지', 'Solar farm'))}</strong> · ${type === 'W' ? t('풍력', 'Wind') : t('태양광', 'Solar')}<br/><span class="muted">${t('RE100/PPA 조달 맥락 · OSM 근사 좌표(개별 검증 전 참고용)', 'RE100/PPA procurement context · OSM approximate coordinates (reference before individual verification)')}</span></div>`, {
            direction: 'top',
            offset: [0, -6],
            className: 'dc-hovercard',
            opacity: 1,
          })
          .addTo(g)
      }
      g.addTo(map)
      reLayerRef.current = g
    }
  }, [showRe, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 주요 수원(다목적·용수댐) 레이어 — 냉각수 공급원 근접 맥락. 크기는 저수용량 로그 스케일.
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (waterLayerRef.current) {
      map.removeLayer(waterLayerRef.current)
      waterLayerRef.current = null
    }
    if (showWater) {
      const g = L.layerGroup()
      for (const [name, lat, lng, type, cap] of WATER_SOURCES) {
        const r = Math.max(4, Math.min(11, 3 + Math.log10(cap + 1) * 2.2)) // 저수용량 스케일
        L.circleMarker([lat, lng], {
          radius: r,
          color: '#38bdf8',
          weight: 1.3,
          fillColor: type === 'M' ? '#0ea5e9' : '#7dd3fc',
          fillOpacity: 0.5,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${t(`${name}댐`, `${name} Dam`)}</strong> · ${type === 'M' ? t('다목적댐', 'multipurpose dam') : t('용수댐', 'water-supply dam')}<br/><span class="muted">${t(`총저수 ${cap.toLocaleString()}백만㎥ · K-water(좌표 근사)`, `total storage ${cap.toLocaleString()} million㎥ · K-water (approx coordinates)`)}</span></div>`,
            { direction: 'top', offset: [0, -6], className: 'dc-hovercard', opacity: 1 },
          )
          .addTo(g)
      }
      g.addTo(map)
      waterLayerRef.current = g
    }
  }, [showWater, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 반도체·AI 메가클러스터 레이어 — 전력·용수 대수요처(DC와 계통·용수 경쟁/공존 앵커).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (semiLayerRef.current) {
      map.removeLayer(semiLayerRef.current)
      semiLayerRef.current = null
    }
    if (showSemi) {
      const g = L.layerGroup()
      for (const [name, lat, lng, operator, status, powerGw, waterKtd, note] of SEMI_CLUSTERS) {
        const planned = status === '예정'
        L.circleMarker([lat, lng], {
          radius: powerGw ? Math.max(7, Math.min(15, 5 + powerGw)) : 7,
          color: '#f59a3c',
          weight: 1.6,
          fillColor: planned ? '#7c5b2e' : '#f59a3c',
          fillOpacity: planned ? 0.4 : 0.55,
          dashArray: planned ? '3 3' : null,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${name}</strong> · ${operator}<br/><span class="muted">${status}${powerGw ? t(` · 전력 ${powerGw}GW`, ` · power ${powerGw}GW`) : ''}${waterKtd ? t(` · 용수 ${waterKtd.toLocaleString()}천t/일`, ` · water ${waterKtd.toLocaleString()}k t/day`) : ''}</span>${note ? `<br/><span class="muted">${note}</span>` : ''}</div>`,
            { direction: 'top', offset: [0, -6], className: 'dc-hovercard', opacity: 1 },
          )
          .addTo(g)
      }
      g.addTo(map)
      semiLayerRef.current = g
    }
  }, [showSemi, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 통신망 레이어 토글 — 백본 국사·IDC·해저케이블 육양국(네트워크축 근거).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (netLayerRef.current) {
      map.removeLayer(netLayerRef.current)
      netLayerRef.current = null
    }
    if (showNet) {
      const g = L.layerGroup()
      for (const n of NETWORK_NODES) {
        const cls = n.type === '해저케이블 육양국' ? 'cls' : n.type === 'DC' ? 'idc' : 'gs'
        const ico = n.type === '해저케이블 육양국' ? '🌊' : n.type === 'DC' ? '🖥️' : '📡'
        L.marker([n.lat, n.lng], {
          icon: L.divIcon({ className: 'net-marker', html: `<span class="net-dot ${cls}">${ico}</span>`, iconSize: [20, 20] }),
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${n.name}</strong> · ${n.type}<br/><span class="muted">${t('네트워크 인프라(백본 근접) — OSM 공개 태깅 표본. KT 위주로 수집되며 타 통신사 백본은 위치 미공개(부재 아님)', 'Network infrastructure (backbone proximity) — OSM public tagging sample. Collected mainly around KT; other carrier backbones are location-undisclosed (not absent)')}</span></div>`, {
            direction: 'top',
            offset: [0, -9],
            className: 'dc-hovercard',
            opacity: 1,
          })
          .addTo(g)
      }
      g.addTo(map)
      netLayerRef.current = g
    }
  }, [showNet, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 수도권 공급예정 민간 DC 레이어 — 삼일PwC·KDCC(’26.3) 21곳. 좌표는 시군구 근사(점선 골드 링).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (pipelineLayerRef.current) {
      map.removeLayer(pipelineLayerRef.current)
      pipelineLayerRef.current = null
    }
    if (showPipeline) {
      const g = L.layerGroup()
      for (const p of CAPITAL_PIPELINE) {
        if (!p.pos) continue
        const r = Math.max(6, Math.min(17, Math.round(Math.sqrt(p.itMw) * 1.4)))
        L.circleMarker(p.pos, {
          radius: r,
          color: '#d2b478',
          weight: 1.6,
          dashArray: '4 3',
          fillColor: '#d2b478',
          fillOpacity: 0.18,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${p.name}</strong><br/>${p.operator} · IT ${p.itMw}MW · ${t(`’${String(p.due).slice(2)} 준공예정`, `completion planned ’${String(p.due).slice(2)}`)}<br/><span class="muted">${t('시군구 근사 위치 — 개별 부지 아님 · PwC·KDCC ’26.3', 'sigungu approximate location — not an individual site · PwC·KDCC ’26.3')}</span></div>`,
            { direction: 'top', offset: [0, -8], className: 'dc-hovercard', opacity: 1 },
          )
          .addTo(g)
      }
      g.addTo(map)
      pipelineLayerRef.current = g
    }
  }, [showPipeline, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 부지 분석 시 반환된 변전소 전력공급 여유 — 실좌표에 색상 마커(초록=여유·회색=0). 클릭지점과 점선 연결.
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (siteSubstLayerRef.current) {
      map.removeLayer(siteSubstLayerRef.current)
      siteSubstLayerRef.current = null
    }
    if (!sitePoint || !siteSubsts.length) return
    const g = L.layerGroup()
    for (const s of siteSubsts) {
      const has = s.maxMw > 0
      const color = has ? '#34d399' : '#94a3b8'
      const r = has ? Math.max(6, Math.min(18, Math.round(Math.sqrt(s.maxMw) * 1.1))) : 5
      L.polyline([[sitePoint.lat, sitePoint.lng], [s.lat, s.lng]], {
        color, weight: 1, opacity: has ? 0.4 : 0.2, dashArray: '3 4', bubblingMouseEvents: false,
      }).addTo(g)
      L.circleMarker([s.lat, s.lng], {
        radius: r, color, weight: 1.8, fillColor: color, fillOpacity: has ? 0.32 : 0.15, bubblingMouseEvents: false,
      })
        .bindTooltip(
          `<div class="dc-hovercard"><strong>${t(`${s.name}변전소`, `${s.name} substation`)}</strong> · ${s.kv}<br/>${has ? t(`${s.firstAvailYear}년 ${s.series[s.years.indexOf(s.firstAvailYear)]?.toLocaleString()}MW~ · 최대 <b>${s.maxMw.toLocaleString()}MW</b>`, `${s.firstAvailYear} ${s.series[s.years.indexOf(s.firstAvailYear)]?.toLocaleString()}MW~ · max <b>${s.maxMw.toLocaleString()}MW</b>`) : t('전 기간 여유 0', 'zero headroom across all years')}<br/><span class="muted">${t('한전ON 전력공급 여유(연도별) · OSM 실좌표 · 참고', '한전ON power-supply headroom (by year) · OSM actual coordinates · reference')}</span></div>`,
          { direction: 'top', offset: [0, -8], className: 'dc-hovercard', opacity: 1 },
        )
        .addTo(g)
    }
    g.addTo(map)
    siteSubstLayerRef.current = g
  }, [siteSubsts, sitePoint, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 전국 실시간 전력시장 배지 — SMP·발전믹스(재생 비중)·예비율. 마운트 1회(라이브, 실패는 미표시).
  useEffect(() => {
    let alive = true
    Promise.all([smpToday().catch(() => null), fuelMixNow().catch(() => null), epsisCapacity().catch(() => null)]).then(
      ([smp, mix, cap]) => {
        if (!alive) return
        const smpVal = smp?.latest?.smp ?? null
        const renew = mix?.renewPct ?? null
        const reserve = cap?.supplyReserveRate ?? cap?.reserveRate ?? null
        if (smpVal == null && renew == null && reserve == null) return
        setLivePulse({ smp: smpVal, hour: smp?.latest?.hour ?? null, renew, nuclear: mix?.nuclearPct ?? null, reserve })
      },
    )
    return () => {
      alive = false
    }
  }, [])

  // 주요 국가산단 레이어 토글 — 인센티브·기반시설 사전확보 입지(초록 사각 마커).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (complexLayerRef.current) {
      map.removeLayer(complexLayerRef.current)
      complexLayerRef.current = null
    }
    if (showComplexes) {
      const g = L.layerGroup()
      for (const [name, lat, lng, type] of INDUSTRIAL_COMPLEXES) {
        L.marker([lat, lng], {
          icon: L.divIcon({ className: 'complex-marker', html: `<span class="complex-dot ${type === '국가' ? 'nat' : 'urb'}">${factorySvg()}</span>`, iconSize: [22, 22] }),
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${name}</strong> · ${t(`${type}산단`, `${type} industrial complex`)}<br/><span class="muted">${t('인센티브·전력/용수 기반시설 사전확보', 'Incentives · power/water infrastructure pre-secured')}</span></div>`, {
            direction: 'top',
            offset: [0, -10],
            className: 'dc-hovercard',
            opacity: 1,
          })
          .addTo(g)
      }
      g.addTo(map)
      complexLayerRef.current = g
    }
  }, [showComplexes, en]) // eslint-disable-line react-hooks/exhaustive-deps

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
            .bindTooltip(publicCard(f, t), { direction: 'top', offset: [0, -10], className: 'dc-hovercard', opacity: 1 })
            .addTo(g)
        })
      }
      g.addTo(map)
      publicLayerRef.current = g
    }
  }, [showPublic, en]) // eslint-disable-line react-hooks/exhaustive-deps

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
            `<div class="dc-hovercard"><strong>${b.sido}</strong> · ${t('발전 허가', 'Generation permits')} <b>${t(`${b.count}건`, `${b.count} cases`)}</b> (2024+)<br/>${t('신재생', 'Renewable')} ${renewPct}% · ${t('최다', 'top')} ${b.topFuel || '—'}</div>`,
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
  }, [showGenPermits, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 계통 여유용량: 토글 시 17개 시도 중심점에서 headroom 조회 (KEPCO env 연동 시 실데이터)
  useEffect(() => {
    if (!showHeadroom || headrooms) return
    let alive = true
    Promise.all(
      SIDO_LIST.map((s) =>
        // 시도 버블: 서버측 vworld 없이 시도코드(metroCd)를 직접 넘겨 KEPCO 조회.
        headroomFor(s.lat, s.lng, SIDO_METRO_CD[s.sido])
          .then((v) => [s.sido, v?.available ? { mw: v.availableMw ?? null, substNm: v.substNm ?? null, rows: v.rows ?? null } : null])
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
      const vals = SIDO_LIST.map((s) => headrooms?.[s.sido]?.mw).filter((v) => v != null)
      const max = vals.length ? Math.max(...vals) : 0
      for (const s of SIDO_LIST) {
        const h = headrooms?.[s.sido]
        const mw = h?.mw ?? null
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
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${s.sido}</strong> · ${t('계통 여유용량', 'Grid headroom')}<br/>${has ? `<b>${mw.toLocaleString()}MW</b>${h?.substNm ? t(` · ${h.substNm}변전소 최대 여유`, ` · ${h.substNm} substation max headroom`) : ''}${h?.rows ? `<br/><span style="opacity:.75">${t(`관내 선로 ${h.rows}개 조회 (한전 분산전원)`, `${h.rows} lines in area queried (한전 distributed generation)`)}</span>` : ''}` : t('연동 대기 (KEPCO env)', 'data pending (KEPCO env)')}</div>`,
            { direction: 'top', offset: [0, -r], className: 'dc-hovercard', opacity: 1 },
          )
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
  }, [showHeadroom, headrooms, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // DC 공급 승인율 시도 버블 — 계통영향평가 1차 기술검토(2026.3.27) 실측. 크기=신청량, 색=승인율
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (approvalLayerRef.current) {
      map.removeLayer(approvalLayerRef.current)
      approvalLayerRef.current = null
    }
    if (showApproval) {
      const g = L.layerGroup()
      const rows = SIDO_LIST.map((s) => ({ ...s, a: dcApprovalForSido(s.sido) })).filter((r) => r.a?.ratePct != null)
      const maxT = Math.max(...rows.map((r) => r.a.able + r.a.unable), 1)
      for (const r of rows) {
        const total = r.a.able + r.a.unable
        const rad = 11 + 24 * Math.sqrt(total / maxT) // 크기 = DC 신청 규모(MW)
        const pct = r.a.ratePct
        const col = pct >= 70 ? 'rgba(69,212,131' : pct >= 45 ? 'rgba(245,154,60' : 'rgba(239,68,68'
        L.circleMarker([r.lat, r.lng], {
          radius: rad,
          color: `${col},0.9)`,
          weight: 1.5,
          fillColor: `${col},0.22)`,
          fillOpacity: 0.5,
          bubblingMouseEvents: false,
        })
          .bindTooltip(
            `<div class="dc-hovercard"><strong>${r.sido}</strong> · ${t('DC 공급 승인율', 'DC supply approval rate')} <b>${pct}%</b> (${approvalLabel(pct)})<br/>${t('가능', 'approved')} ${Math.round(r.a.able).toLocaleString()}MW · ${t('불가', 'rejected')} ${Math.round(r.a.unable).toLocaleString()}MW<br/><span style="opacity:.75">${t('계통영향평가 1차 기술검토 · 2026.3.27 한전', 'Grid impact assessment 1st technical review · 2026.3.27 한전')}</span></div>`,
            { direction: 'top', offset: [0, -rad], className: 'dc-hovercard', opacity: 1 },
          )
          .on('click', () => {
            setSelected(null)
            setSitePoint(null)
            setRegion(r.sido)
          })
          .addTo(g)
        L.marker([r.lat, r.lng], {
          icon: L.divIcon({ className: 'gen-bubble-label', html: `${pct}%`, iconSize: [46, 16], iconAnchor: [23, 8] }),
          interactive: false,
        }).addTo(g)
      }
      g.addTo(map)
      approvalLayerRef.current = g
    }
  }, [showApproval, en]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // 필지 경계 — 지점(클릭·번지 검색)이 속한 연속지적도 폴리곤을 vworld에서 받아 표시.
  // 검토 대상 땅의 실제 경계를 명확히(부지 인텔리전스 핵심 UX). 실패 시 조용히 생략(정직: 근사 표시 안 함).
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (parcelLayerRef.current) {
      map.removeLayer(parcelLayerRef.current)
      parcelLayerRef.current = null
    }
    if (!sitePoint) return
    let alive = true
    parcelAt(sitePoint.lat, sitePoint.lng)
      .then((p) => {
        if (!alive || !p?.available || !p.geometry) return
        const areaM2 = geomAreaM2(p.geometry)
        const areaTxt = areaM2 ? `<br/>${t('면적', 'Area')} ≈ <b>${Math.round(areaM2).toLocaleString()}㎡</b> (${Math.round(areaM2 / 3.3058).toLocaleString()}평)` : ''
        const layer = L.geoJSON(
          { type: 'Feature', geometry: p.geometry },
          {
            style: {
              color: 'rgba(53,213,238,0.95)',
              weight: 2,
              dashArray: '5 4',
              fillColor: 'rgba(53,213,238,0.08)',
              fillOpacity: 0.5,
              interactive: false,
            },
          },
        )
        layer.bindTooltip(
          `<div class="dc-hovercard"><strong>${t('필지 경계', 'Parcel boundary')}</strong>${p.jibun ? ` · ${p.jibun}` : ''}${p.addr ? `<br/>${p.addr}` : ''}${areaTxt}<br/><span style="opacity:.75">${t('연속지적도(vworld) — 참고용, 지적측량 아님 · 면적은 도형 계산 근사', 'Continuous cadastral map (vworld) — reference, not a cadastral survey · area is an approximate geometric calc')}</span></div>`,
          { sticky: true, className: 'dc-hovercard', opacity: 1 },
        )
        layer.addTo(map)
        parcelLayerRef.current = layer
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [sitePoint, en]) // eslint-disable-line react-hooks/exhaustive-deps

  // 활성 레이어 → URL(?layers=) 동기화 (공유 링크로 켠 레이어 그대로 복원)
  useEffect(() => {
    const active = [
      showReco && 'reco', showLabels && 'labels', showSubs && 'subs', showLines && 'lines',
      showPlants && 'plants', showRe && 're', showWater && 'water', showSemi && 'semi',
      showComplexes && 'complex', showNet && 'net', showPipeline && 'pipeline', !power && showGenPermits && 'permit',
      showHeadroom && 'headroom', showApproval && 'approval', showPublic && 'public',
    ].filter(Boolean)
    const next = new URLSearchParams(searchParams)
    if (active.length) next.set('layers', active.join(','))
    else next.delete('layers')
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
  }, [showReco, showLabels, showSubs, showLines, showPlants, showRe, showWater, showSemi, showComplexes, showNet, showPipeline, showGenPermits, showHeadroom, showApproval, showPublic]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const labelText = groupSummary ? t(`${f.sido} ${f.sigungu ?? ''} · ${group.length}곳`, `${f.sido} ${f.sigungu ?? ''} · ${group.length} sites`).trim() : info
        const skipLabel = groupSummary && gi !== 0
        // 라벨 OFF: 호버 시 요약 카드 (클릭 없이 대략 정보) / 라벨 ON: 상시 칩
        m.bindTooltip(
          showLabels && !skipLabel ? (groupSummary ? labelText : info) : hoverCard(f, t),
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
  }, [filtered, showLabels, isoView, denseLabels, en]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // headrooms 값은 {mw, substNm, rows} 객체(라이브) — 숫자만 꺼내 표기(과거 숫자형도 방어)
    const h = headrooms?.[region]
    return {
      sido: region,
      gen: bubble || null,
      new2025: np2025,
      headroomMw: (typeof h === 'number' ? h : h?.mw) ?? null,
      headroomSubst: typeof h === 'object' ? (h?.substNm ?? null) : null,
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
        showSubs={showSubs}
        onToggleSubs={() => setShowSubs((v) => !v)}
        showLines={showLines}
        onToggleLines={() => setShowLines((v) => !v)}
        hasLines={POWER_LINES_AVAILABLE}
        showComplexes={showComplexes}
        onToggleComplexes={() => setShowComplexes((v) => !v)}
        showNet={showNet}
        onToggleNet={() => setShowNet((v) => !v)}
        showPipeline={showPipeline}
        onTogglePipeline={() => setShowPipeline((v) => !v)}
        showRe={showRe}
        onToggleRe={() => setShowRe((v) => !v)}
        showWater={showWater}
        onToggleWater={() => setShowWater((v) => !v)}
        showSemi={showSemi}
        onToggleSemi={() => setShowSemi((v) => !v)}
        showReco={showReco}
        onToggleReco={() => setShowReco((v) => !v)}
        showPublic={showPublic}
        onTogglePublic={() => setShowPublic((v) => !v)}
        power={power}
        showGenPermits={showGenPermits}
        onToggleGenPermits={() => setShowGenPermits((v) => !v)}
        showHeadroom={showHeadroom}
        onToggleHeadroom={() => setShowHeadroom((v) => !v)}
        showApproval={showApproval}
        onToggleApproval={() => setShowApproval((v) => !v)}
      />
      <div className="map-layout">
        <div ref={mapRef} className="map-canvas" />
        {/* 전국 실시간 전력시장 배지 — SMP·재생 비중·예비율(라이브). 대시보드로 딥링크 */}
        {livePulse && (
          <Link className="map-live-badge" to="/dashboard" title={t('실시간 전력수급·SMP·발전믹스 대시보드로', 'To the live power supply-demand · SMP · generation-mix dashboard')}>
            <span className="mlb-dot" aria-hidden="true" />
            <span className="mlb-label">{t('전국 실시간', 'Nationwide live')}</span>
            {livePulse.smp != null && (
              <span className="mlb-stat"><b>SMP {livePulse.smp.toLocaleString()}</b>{t('원/kWh', ' KRW/kWh')}{livePulse.hour != null ? t(` ${livePulse.hour}시`, ` ${livePulse.hour}:00`) : ''}</span>
            )}
            {livePulse.renew != null && (
              <span className="mlb-stat">{t('재생', 'Renewable')} <b>{livePulse.renew}%</b></span>
            )}
            {livePulse.reserve != null && (
              <span className="mlb-stat">{t('예비율', 'Reserve')} <b>{livePulse.reserve}%</b></span>
            )}
          </Link>
        )}
        {/* 사이드패널 확장 토글 — 패널 좌측 가운데 엣지(누르면 폭 2배) */}
        <button
          type="button"
          className="panel-expand"
          onClick={togglePanelWide}
          aria-pressed={panelWide}
          aria-label={panelWide ? t('패널 좁히기', 'Narrow panel') : t('패널 넓히기', 'Widen panel')}
          title={panelWide ? t('패널 좁히기', 'Narrow panel') : t('패널 넓히기 (2배)', 'Widen panel (2x)')}
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {panelWide ? <path d="M6 3.5 10.5 8 6 12.5" /> : <path d="M10 3.5 5.5 8 10 12.5" />}
          </svg>
        </button>
        {/* 입지 시뮬레이터 — 추천입지 레이어 켤 때 필요 MW·입지 조건으로 재랭킹 */}
        {showReco && (
          <div className="reco-sim" role="region" aria-label={t('입지 시뮬레이터', 'Site simulator')}>
            <div className="rs-head">
              <strong>{t('🏆 AI 추천 입지', '🏆 AI recommended sites')}</strong>
              <span className="muted">{t('정적 근거 랭킹 · 필터 재계산', 'Static-basis ranking · filter recompute')}</span>
            </div>
            <div className="rs-controls">
              <label>
                {t('필요 용량', 'Required capacity')}
                <input type="number" min="0" step="10" value={recoMw} onChange={(e) => setRecoMw(Math.max(0, Number(e.target.value) || 0))} /> MW
              </label>
              <button type="button" className={`chip ${recoNonCap ? 'on' : ''}`} onClick={() => setRecoNonCap((v) => !v)} aria-pressed={recoNonCap}>
                {t('비수도권만', 'Non-capital only')}
              </button>
            </div>
            <ol className="rs-list">
              {recoTop.slice(0, 10).map((s, i) => (
                <li key={`${s.lat},${s.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null)
                      setRegion(null)
                      setSitePoint({ lat: s.lat, lng: s.lng })
                      mapObj.current?.setView([s.lat, s.lng], 12)
                    }}
                  >
                    <span className="rs-rank">{i + 1}</span>
                    <span className="rs-main">
                      <span className="rs-name">{s.name}</span>
                      <span className="rs-why">{recoReasons(s).slice(0, 3).join(' · ')}</span>
                    </span>
                    <span className="rs-score">{s.score}/{s.max}</span>
                  </button>
                </li>
              ))}
              {recoTop.length === 0 && <li className="rs-empty">{t('조건에 맞는 후보 없음 — 필요 MW를 낮춰보세요', 'No candidates match — try lowering the required MW')}</li>}
            </ol>
          </div>
        )}
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
            aria-label={sheetCollapsed ? t('패널 펼치기', 'Expand panel') : t('패널 접기', 'Collapse panel')}
          >
            <span className="sheet-grip" />
            <span className="sheet-hint">{sheetCollapsed ? t('▲ 패널 펼치기', '▲ Expand panel') : t('▼ 지도 넓게 보기', '▼ See map wider')}</span>
          </button>
          {/* 베이스맵 전환 — 목록으로 줄에 맞춘 패널 헤더(스크롤 안쪽). 다크/한글/위성 */}
          {BASE_KEYS.length > 1 && (
            <div className="panel-basemap" role="group" aria-label={t('지도 종류', 'Map type')}>
              <span className="pb-label">{t('지도', 'Map')}</span>
              <div className="basemap-switch">
                {BASE_KEYS.map((k) => (
                  <button key={k} type="button" className={`bm-btn ${baseMap === k ? 'on' : ''}`} onClick={() => setBaseMap(k)} aria-pressed={baseMap === k}>
                    {en ? BASE_MAPS[k].labelEn : BASE_MAPS[k].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selected ? (
            <>
              <h2>
                <button type="button" className="chip btn" onClick={() => setSelected(null)}>
                  {t('← 목록으로', '← Back to list')}
                </button>
              </h2>
              <FacilityCard facility={selected} />
            </>
          ) : region && regionInfo ? (
            <>
              <h2>
                <button type="button" className="chip btn" onClick={() => setRegion(null)}>
                  {t('← 목록으로', '← Back to list')}
                </button>
              </h2>
              <article className="facility-card">
                <div className="status-line">
                  <span className="badge status-operating">{t('전력 · 지역 요약', 'Power · region summary')}</span>
                  <span className="badge">{regionInfo.sido}</span>
                </div>
                <h3>{regionInfo.sido} — {t('전력 공급 · 계통 · 데이터센터', 'Power supply · grid · data centers')}</h3>
                <div className="spec-grid">
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">{t('발전 공급 파이프라인 (2024+ 허가)', 'Generation supply pipeline (2024+ permits)')}</div>
                    <div className="v">
                      {regionInfo.gen ? (
                        <>
                          <strong>{t(`${regionInfo.gen.count}건`, `${regionInfo.gen.count} cases`)}</strong>
                          {regionInfo.gen.mw > 0 && t(` · 용량 ${regionInfo.gen.mw.toLocaleString()}MW(참고)`, ` · capacity ${regionInfo.gen.mw.toLocaleString()}MW (ref)`)}
                          {t(' · 신재생 ', ' · Renewable ')}
                          {Math.round((regionInfo.gen.renew / regionInfo.gen.count) * 100)}%
                          {regionInfo.gen.topFuel && t(` · 최다 ${regionInfo.gen.topFuel}`, ` · top ${regionInfo.gen.topFuel}`)}
                        </>
                      ) : (
                        <span className="muted">{t('허가 없음', 'No permits')}</span>
                      )}
                    </div>
                  </div>
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">{t('2025 신규 발전 설치 (설비용량·개수)', '2025 new generation installs (capacity · count)')}</div>
                    <div className="v">
                      {regionInfo.new2025 ? (
                        <>
                          <strong>{Math.round(regionInfo.new2025.capacityKw / 1000).toLocaleString()} MW</strong>
                          {t(` · ${regionInfo.new2025.count.toLocaleString()}개소`, ` · ${regionInfo.new2025.count.toLocaleString()} sites`)}
                        </>
                      ) : (
                        <span className="muted">{t('데이터 없음', 'No data')}</span>
                      )}
                    </div>
                  </div>
                  {GRID_HEADROOM[regionInfo.sido] && (
                    <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                      <div className="k">{t(`시도 총 계통 공급여유 (한전 연계가능용량 · ${GRID_HEADROOM_META.year} 전망)`, `Province total grid supply headroom (한전 interconnectable capacity · ${GRID_HEADROOM_META.year} outlook)`)}</div>
                      <div className="v">
                        <strong>
                          {(typeof GRID_HEADROOM[regionInfo.sido] === 'number'
                            ? GRID_HEADROOM[regionInfo.sido]
                            : GRID_HEADROOM[regionInfo.sido].mw
                          ).toLocaleString()}{' '}
                          MW
                        </strong>
                        <span className="muted"> · {t('시군구·부지별 편차 큼 (부지 클릭 시 변전소별 실측)', 'large variation by sigungu/site (click a site for per-substation measurement)')}</span>
                      </div>
                    </div>
                  )}
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">{t('배전 여유 — 소규모 접속 (한전 분산전원 22.9kV · 라이브)', 'Distribution headroom — small-scale connection (한전 distributed generation 22.9kV · live)')}</div>
                    <div className="v">
                      {regionInfo.headroomMw != null ? (
                        <>
                          <strong>{regionInfo.headroomMw.toLocaleString()} MW</strong>
                          {regionInfo.headroomSubst && (
                            <span className="muted"> · {t('최대 여유', 'max headroom')} {regionInfo.headroomSubst}</span>
                          )}
                          <div className="cell-basis">{t('대형 DC의 154kV 송전 접속여유는 별개 — 부지 클릭 시 변전소별 전력공급 여유(154kV·22.9kV) 자동 조회', 'Large-DC 154kV transmission connection headroom is separate — click a site to auto-query per-substation power-supply headroom (154kV·22.9kV)')}</div>
                        </>
                      ) : (
                        <>
                          <span className="badge verify">{t('연동 대기 (KEPCO 분산전원 API)', 'data pending (KEPCO distributed-generation API)')}</span>
                          <a
                            className="mini-link"
                            href="https://online.kepco.co.kr/EWM104D04"
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 8 }}
                          >
                            {t('한전ON 변전소 여유 직접 조회 →', '한전ON substation headroom direct query →')}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  {RENEWABLE_ESS[regionInfo.sido] && (
                    <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                      <div className="k">{t('재생에너지·ESS 설비용량 (RE100·PPA 근접 · ’25.5)', 'Renewable · ESS capacity (RE100·PPA proximity · ’25.5)')}</div>
                      <div className="v">
                        <strong>{t('태양광', 'Solar')} {Math.round(RENEWABLE_ESS[regionInfo.sido].solar).toLocaleString()} MW</strong>
                        {RENEWABLE_ESS[regionInfo.sido].wind != null && t(` · 풍력 ${Math.round(RENEWABLE_ESS[regionInfo.sido].wind).toLocaleString()}MW`, ` · Wind ${Math.round(RENEWABLE_ESS[regionInfo.sido].wind).toLocaleString()}MW`)}
                        {t(` · ESS 저장 ${Math.round(RENEWABLE_ESS[regionInfo.sido].ess).toLocaleString()}MW`, ` · ESS storage ${Math.round(RENEWABLE_ESS[regionInfo.sido].ess).toLocaleString()}MW`)}
                      </div>
                    </div>
                  )}
                  <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                    <div className="k">{t('전력 자급률 (발전÷소비, ’25)', 'Power self-sufficiency (generation÷consumption, ’25)')}</div>
                    <div className="v">
                      {POWER_BALANCE[regionInfo.sido] ? (
                        <>
                          <strong>{POWER_BALANCE[regionInfo.sido].ratio}%</strong>
                          {` · ${selfSufficiencyLabel(POWER_BALANCE[regionInfo.sido].ratio)}`}
                        </>
                      ) : (
                        <span className="muted">{t('데이터 없음', 'No data')}</span>
                      )}
                    </div>
                  </div>
                  {(() => {
                    const conflicts = DEV_CONFLICTS.filter((c) => c.region.startsWith(regionInfo.sido))
                    if (!conflicts.length) return null
                    return (
                      <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                        <div className="k">{t('DC 개발 민원·분쟁 사례 (알스퀘어 · 입지 리스크)', 'DC development complaints/disputes (알스퀘어 · siting risk)')}</div>
                        <div className="v">
                          <strong>{t(`${conflicts.length}건`, `${conflicts.length} cases`)}</strong>
                          <span className="muted"> · {conflicts.slice(0, 2).map((c) => c.region.replace(`${regionInfo.sido} `, '')).join('·')}{conflicts.length > 2 ? t(' 등', ' etc.') : ''}</span>
                          <div className="cell-basis">{conflicts[0].claims} — {t('주민 반발이 인허가 리드타임 리스크.', 'resident opposition is a permitting lead-time risk.')} <Link to="/data?tab=conflicts">{t('전체 →', 'All →')}</Link></div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="spec-cell">
                    <div className="k">{t('데이터센터 시설', 'Data-center facilities')}</div>
                    <div className="v">
                      <strong>{regionInfo.dcCount}</strong>{t('곳', ' sites')}
                    </div>
                  </div>
                  <div className="spec-cell">
                    <div className="k">{t('DC 공개 전력', 'DC disclosed power')}</div>
                    <div className="v">{regionInfo.dcMw > 0 ? `${regionInfo.dcMw.toLocaleString()} MW` : t('비공개', 'undisclosed')}</div>
                  </div>
                  {(() => {
                    // 수도권(서울·경기·인천)만 존재하는 집계 — 공급예정 민간 DC(삼일PwC·KDCC ’26.3)
                    const pipe = CAPITAL_PIPELINE.filter((p) => p.loc.startsWith(regionInfo.sido))
                    if (!pipe.length) return null
                    const mwSum = pipe.reduce((s, p) => s + p.itMw, 0)
                    return (
                      <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                        <div className="k">{t('공급예정 민간 DC (PwC·KDCC 집계 ’26.3)', 'Planned private DC (PwC·KDCC tally ’26.3)')}</div>
                        <div className="v">
                          <strong>{pipe.length}</strong>{t('곳 · IT용량 합계 ', ' sites · total IT capacity ')}<strong>{mwSum.toLocaleString()}</strong>MW{' '}
                          <Link className="mini-link" to="/data?tab=capital">
                            {t('목록 →', 'List →')}
                          </Link>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <p className="note">
                  {en ? (
                    <>
                      Generation supply is from the 3MW-plus permit register (2024+ case/capacity reference). Distribution
                      headroom is the maximum among what is queryable from 한전 distributed generation (22.9kV) —{' '}
                      <strong>a separate indicator from a large DC's 154kV transmission connection headroom</strong>. Now{' '}
                      <strong>154kV·22.9kV power-supply headroom is queried per-substation and per-year on site click via 한전ON</strong>{' '}
                      (345kV government disclosure is pre-announced and tracked in the policy tracker). Compare supply-headroom-DC in one region.
                    </>
                  ) : (
                    <>
                      발전 공급은 3MW 초과 허가대장(2024+ 건수·용량 참고치). 배전 여유는 한전 분산전원(22.9kV) 조회
                      가능분 중 최대치 — <strong>대형 DC의 154kV 송전 접속여유와는 별개 지표</strong>. 이제 <strong>154kV·22.9kV
                      전력공급 여유는 한전ON 연동으로 부지 클릭 시 변전소별·연도별 실측 조회</strong>(345kV는 정부 공개 예고를 제도
                      트래커에서 추적 중). 공급-여유-DC를 한 지역에서 대비.
                    </>
                  )}
                </p>
                <div className="card-actions">
                  <button type="button" className="btn primary" onClick={() => { setSido(regionInfo.sido); setRegion(null) }}>
                    {t('이 지역 시설만 보기', 'Show only this region\'s facilities')}
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
              onAddCompare={addCompare}
              inCompare={compare.some((c) => c.id === `${sitePoint.lat.toFixed(5)},${sitePoint.lng.toFixed(5)}`)}
              onSubstations={setSiteSubsts}
            />
          ) : (
            <>
              {power && (
                <div className="power-banner">
                  {en ? (
                    <>
                      <strong>⚡ Power map</strong> — see the generation supply pipeline (◎ generation permits) and grid
                      headroom (⚡ headroom) overlaid on DC locations. Turn on layers with the top chips; click a facility
                      marker for info, click empty space for site analysis.
                    </>
                  ) : (
                    <>
                      <strong>⚡ 전력 지도</strong> — 발전 공급 파이프라인(◎발전허가)·계통 여유용량(⚡여유용량)을 DC 위치와 겹쳐
                      본다. 상단 칩으로 레이어를 켜고, 시설 마커를 누르면 정보가, 빈 곳을 누르면 지점 분석이 나온다.
                    </>
                  )}
                </div>
              )}
              <div className="panel-title">
                {power ? t('전력 · 시설 요약', 'Power · facility summary') : t('사이트 인텔리전스', 'Site intelligence')}
                <span className="ver-chip" title={t('시드 데이터 버전 · 기준일', 'Seed data version · as-of date')}>
                  v{DATA_VERSION.version} · {DATA_VERSION.date}
                </span>
              </div>
              <h2>
                {t('시설', 'Facilities')} <strong>{filtered.length}</strong>{t('곳', ' sites')}
                {totalMw > 0 && (
                  <>
                    {t(' · 공개 전력 ', ' · Disclosed power ')}
                    <strong>{totalMw.toLocaleString()}</strong> MW
                    <span className="mw-disclosed" title={t('전력 규모를 공개한 시설만 합산 · 상당수가 계획(미준공) 용량이라 상태별로 분해 표기', 'Only facilities that disclose power are summed · much is planned (not-yet-completed) capacity, so broken down by status')}>
                      {' '}({mwDisclosed}/{filtered.length}{t('곳 공개 · 운영 ', ' sites disclosed · operating ')}{mwByStatus.operating.toLocaleString()}
                      {mwByStatus.construction > 0 && t(` · 건설 ${mwByStatus.construction.toLocaleString()}`, ` · construction ${mwByStatus.construction.toLocaleString()}`)}
                      {mwByStatus.planned > 0 && t(` · 계획 ${mwByStatus.planned.toLocaleString()}`, ` · planned ${mwByStatus.planned.toLocaleString()}`)} MW)
                    </span>
                  </>
                )}
                {minMw != null && t(` · 필터 ≥ ${minMw} MW`, ` · filter ≥ ${minMw} MW`)}
                {q && ` · “${q}”`}
              </h2>
              <p className="map-hint" style={{ marginTop: 2 }}>
                {t('참고 — 전국 계통 공급여유 합계', 'Note — nationwide grid supply headroom total')}{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  {(Object.values(GRID_HEADROOM).reduce((s, v) => s + (typeof v === 'number' ? v : v?.mw || 0), 0) / 1000).toFixed(1)}GW
                </strong>{' '}
                {t(`(17개 시도 · 한전 연계가능용량 ${GRID_HEADROOM_META.year} 전망). 위 MW는 개별 공개 시설 합(시장 총량 아님).`, `(17 provinces · 한전 interconnectable capacity ${GRID_HEADROOM_META.year} outlook). The MW above is a sum of individually disclosed facilities (not a market total).`)}
              </p>
              <p className="map-hint">
                <LineIcon name="target" size={14} /> <strong>{t('지도 빈 곳을 클릭', 'Click empty space on the map')}</strong> → {t('부지 분석(전력·냉각·리스크 점수)', 'site analysis (power · cooling · risk score)')} · <strong>{t('시설 마커 클릭', 'Click a facility marker')}</strong> → {t('상세 정보', 'details')}
              </p>
              {filtered.length > 0 && (
                <div className="status-summary">
                  <div
                    className="status-bar"
                    role="img"
                    aria-label={t(`운영 ${statusCounts.operating}, 건설 ${statusCounts.construction}, 계획 ${statusCounts.planned}`, `Operating ${statusCounts.operating}, Construction ${statusCounts.construction}, Planned ${statusCounts.planned}`)}
                  >
                    {statusCounts.operating > 0 && <span className="seg op" style={{ flexGrow: statusCounts.operating }} />}
                    {statusCounts.construction > 0 && (
                      <span className="seg co" style={{ flexGrow: statusCounts.construction }} />
                    )}
                    {statusCounts.planned > 0 && <span className="seg pl" style={{ flexGrow: statusCounts.planned }} />}
                  </div>
                  <div className="status-chips">
                    <span>
                      <i className="dot operating" /> {t('운영', 'Operating')} <strong>{statusCounts.operating}</strong>
                    </span>
                    <span>
                      <i className="dot construction" /> {t('건설', 'Construction')} <strong>{statusCounts.construction}</strong>
                    </span>
                    <span>
                      <i className="dot planned" /> {t('계획', 'Planned')} <strong>{statusCounts.planned}</strong>
                    </span>
                  </div>
                </div>
              )}
              <div className="list-toolbar">
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('정렬', 'Sort')}>
                  <option value="status">{t('상태순 (운영→계획)', 'By status (operating→planned)')}</option>
                  <option value="mw">{t('공개 용량순', 'By disclosed capacity')}</option>
                  <option value="name">{t('이름순', 'By name')}</option>
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
                        {isCoarseGeocode(f.geocode_level) && <span className="approx-tag" title={t('좌표가 시군구 중심점 — 실제 부지 아님', 'coordinates are sigungu centroid — not the actual site')}>{t('위치 근사', 'approx. location')}</span>}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
        <div className="map-br-cluster">
          <ShareButton />
          <Legend />
        </div>
        <AiAssistant />
      </div>
      <CompareTray
        items={compare}
        onRemove={removeCompare}
        onClear={() => persistCompare([])}
        onOpen={(c) => {
          setRegion(null)
          setSitePoint({ lat: c.lat, lng: c.lng })
        }}
      />
    </>
  )
}
