/* 데이터 최신성 — 기준일을 '원본 데이터 파일·모듈 META'에서 직접 읽어내는 곳.
 *
 * 왜 freshness.js와 분리했나: 이 파일은 지가 JSON(48KB)·송변전 건설 목록(38KB) 등 무거운 원본을 끌어온다.
 * 기준일 칩·푸터 배지는 메인 번들에 실리므로, 원본 전체 대신 여기서 뽑은 기준일만
 * data/freshness_asof.json(수백 바이트)에 적어 두고 freshness.js는 그 JSON만 읽는다.
 *  - scripts/gen-freshness-asof.mjs가 이 함수로 JSON을 다시 만든다(빌드 전·데이터 Action 수집 후 자동).
 *  - test/freshness.test.mjs가 JSON과 이 함수 결과가 같은지 확인한다 — 손으로 고친 날짜가 끼어들 틈이 없다.
 * Node 전용 경로라 Vite 기능(import.meta.glob)은 쓰지 않는다. */
import landSgg from '../../data/land_price_v0.json' with { type: 'json' }
import landDong from '../../data/land_price_dong_v0.json' with { type: 'json' }
import dcCenters from '../../data/dc_centers.json' with { type: 'json' }
import nuclear from '../../data/nuclear_units_v0.json' with { type: 'json' }
import exclusions from '../../data/exclusions/manifest.json' with { type: 'json' }
import { GRID_ASSESSMENT_META } from './gridAssessment.js'
import { GRID_CONSTRUCTION_META } from './gridConstruction.js'
import { CAPITAL_PIPELINE_META } from './capitalPipeline.js'
import { DC_DEALS_META } from './dcRealEstate.js'
import { RENEWABLE_ESS_META } from './renewableEss.js'
import { RESERVE_12M } from './powerReserve.js'

const yyyymm = (p) => (p ? `${String(p).slice(0, 4)}-${String(p).slice(4, 6)}` : null)
const maxUpdated = (rows) => rows.reduce((m, r) => (r.updated_at && r.updated_at > m ? r.updated_at : m), '') || null
const reserveLast = () => {
  const ym = RESERVE_12M.at(-1)?.[0] // '26.07'
  return ym ? `20${ym.slice(0, 2)}-${ym.slice(3, 5)}` : null
}

/** 데이터셋 id → 원본에서 읽은 기준일(없으면 null — 지어내지 않는다) */
export function deriveAsOf() {
  return {
    'land-sgg': yyyymm(landSgg.period),
    'land-dong': yyyymm(landDong.period),
    'psia-review': GRID_ASSESSMENT_META.asOf ?? null,
    'grid-construction': GRID_CONSTRUCTION_META.asOf ?? null,
    'power-reserve': reserveLast(),
    'renewable-ess': RENEWABLE_ESS_META.asOf ?? null,
    nuclear: nuclear.date ?? null,
    'dc-facilities': maxUpdated(dcCenters.facilities),
    'capital-pipeline': CAPITAL_PIPELINE_META.asOf ?? null,
    'dc-deals': DC_DEALS_META.asOf ?? null,
    exclusions: exclusions.asOf ?? null,
  }
}
