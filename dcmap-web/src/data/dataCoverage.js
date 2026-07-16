// 데이터 커버리지 집계 — 인수 실사(due diligence) 관점의 '데이터룸' 지표.
// 정직성: 전부 실제 보유 데이터셋에서 계산. 조작·추정 수치 없음. 소스·갱신 주기 명시.
import { FACILITIES } from './facilities.js'
import { GRID_HEADROOM, GRID_HEADROOM_META } from './gridHeadroom.js'
import { SUBSTATION_POINTS_META } from './substationPoints.js'
import { SUBSTATION_HEADROOM } from './substationHeadroom.js'
import { GRID_CONSTRUCTION, GRID_CONSTRUCTION_META } from './gridConstruction.js'
import { INSIGHTS } from '../content/insights_meta.js'
import { GLOSSARY } from '../content/glossary.js'
import { PROCESS_NODES } from '../content/processOntology.js'
import { SNAPSHOT_COUNT, LATEST_SNAPSHOT, SNAPSHOTS } from './headroomSnapshots.js'
import targets from '../../data/headroom_targets.json'

const sidoCount = Object.keys(GRID_HEADROOM).length
const gridHeadroomGw = (
  Object.values(GRID_HEADROOM).reduce((s, v) => s + (typeof v === 'number' ? v : v?.mw || 0), 0) / 1000
).toFixed(1)
const constructionRows = GRID_CONSTRUCTION.length
const pipelineTotal = Object.values(GRID_CONSTRUCTION_META?.stageTotals || {}).reduce((s, n) => s + (Number(n) || 0), 0)

// 데이터룸 커버리지 지표(EN 라벨 병기) — 실집계값.
export const COVERAGE = [
  { k: 'facilities', en: 'DC facilities (parcel-geocoded)', v: FACILITIES.length, unit: '', src: 'AI InfraMap curation' },
  { k: 'substations', en: '154kV+ substations (coordinates)', v: SUBSTATION_POINTS_META.count, unit: '', src: 'OSM / OpenInfraMap' },
  { k: 'gridHeadroom', en: 'Regional grid headroom mapped', v: `${gridHeadroomGw}`, unit: 'GW', src: `KEPCO ${GRID_HEADROOM_META.year}` },
  { k: 'sido', en: 'Provinces with headroom data', v: sidoCount, unit: '', src: `KEPCO ${GRID_HEADROOM_META.year}` },
  { k: 'construction', en: 'Transmission build records', v: constructionRows, unit: '', src: 'KEPCO T&D disclosure' },
  { k: 'pipelineTotal', en: 'T&D pipeline nodes (total)', v: pipelineTotal, unit: '', src: 'KEPCO T&D disclosure' },
  { k: 'insights', en: 'Sourced research briefs', v: INSIGHTS.length, unit: '', src: 'AI InfraMap' },
  { k: 'glossary', en: 'Power/permitting terms', v: GLOSSARY.length, unit: '', src: 'AI InfraMap' },
  { k: 'process', en: 'Permitting process nodes', v: PROCESS_NODES.length, unit: '', src: 'AI InfraMap' },
]

// P1 파이프라인 상태 — 스냅샷 신선도·커버리지(인수자가 데이터 활력을 보는 지표).
export const PIPELINE = {
  snapshotMonths: SNAPSHOT_COUNT,
  latestMonth: LATEST_SNAPSHOT?.month ?? null,
  targetsDefined: (targets.targets || []).length,
  captured: LATEST_SNAPSHOT?.entries?.length ?? 0,
  months: SNAPSHOTS.map((s) => s.month),
}

// 데이터 사전 — dataset · source · cadence · coverage (EN).
export const DATA_DICTIONARY = [
  { name: 'DC facilities', source: 'AI InfraMap (public filings, geocoded)', cadence: 'on change', coverage: `${FACILITIES.length} sites, parcel-level` },
  { name: 'Grid headroom (regional)', source: `KEPCO connectable capacity ${GRID_HEADROOM_META.year}`, cadence: 'annual outlook', coverage: `${sidoCount} provinces, ${gridHeadroomGw} GW` },
  { name: 'Substation reserve (live)', source: 'KEPCO ON substation search', cadence: 'quarterly + on-demand proxy', coverage: `snapshots: ${SNAPSHOT_COUNT} mo (P1, expanding)` },
  { name: '154kV+ substations', source: 'OSM / OpenInfraMap', cadence: 'periodic export', coverage: `${SUBSTATION_POINTS_META.count} coordinates` },
  { name: 'T&D construction pipeline', source: 'KEPCO T&D disclosure', cadence: 'periodic', coverage: `${constructionRows} rows / ${pipelineTotal} nodes` },
  { name: 'PSIA pass model', source: 'Public proxies (weighted scorecard)', cadence: 'live', coverage: 'any clicked point' },
]
