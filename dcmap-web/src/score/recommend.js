// 전국 입지 추천 — 산업단지(511곳)를 후보로 'API 없이 계산되는 정적 근거'로 랭킹.
// 정적 축: 154kV+ 변전소 거리·계통 공급여유(시도)·DC 공급승인율(시도)·자가발전 인접·산단 입지·네트워크.
// 정직성: 침수/인구/기후/용도지역/면적 등 라이브 축은 제외한 '정적 근거 점수'로 스크리닝 → 클릭 시 전체 분석.
import { scoreSite } from './engine.js'
import { INDUSTRIAL_COMPLEXES } from '../data/industrialComplexes.js'
import { sidoOf } from '../data/sido.js'
import { CAPITAL_SIDOS } from '../data/facilities.js'
import { gridHeadroomForSido } from '../data/gridHeadroom.js'
import { dcApprovalForSido } from '../data/gridAssessment.js'
import { nearestPlant } from '../data/plants.js'
import { nearestNormal, dcClimateIndex } from './climateIndex.js'

let _cache = null

/**
 * 산단 후보를 정적 근거 점수로 랭킹.
 * @param topN 상위 N개
 * @param opts {minMw:필요 MW(계통 공급여유 하한), nonCapitalOnly:비수도권만}
 */
export function recommendSites(topN = 20, opts = {}) {
  if (!_cache) {
    _cache = INDUSTRIAL_COMPLEXES.map(([name, lat, lng, type]) => {
      const sido = sidoOf(lat, lng)
      const nonCapital = !CAPITAL_SIDOS.has(sido)
      const gridMw = gridHeadroomForSido(sido)?.mw ?? null
      const gridApproval = dcApprovalForSido(sido)?.ratePct ?? null
      const plantKm = nearestPlant({ lat, lng })?.km ?? null
      // 냉각(기후)축은 평년값(오프라인)으로 산출 가능 — 이걸 빼면 511곳 전부 기상축이 대기로 랭킹이 왜곡됨
      const nrm = nearestNormal(lat, lng)
      const climate = dcClimateIndex({ normalTemp: nrm?.t, normalStation: nrm?.name })
      const r = scoreSite({ lat, lng, nonCapital, gridMw, gridApproval, plantKm, climate })
      return {
        name,
        type,
        lat,
        lng,
        sido,
        nonCapital,
        score: r.knownScore,
        max: r.knownMax,
        pct: r.knownMax ? Math.round((r.knownScore / r.knownMax) * 100) : 0,
        nearestSub: r.nearestSub,
        subKm: r.nearestSub?.km ?? null,
        gridMw,
        gridApproval,
        climateLevel: climate?.level ?? null,
        climateLabel: climate?.label ?? null,
      }
    }).sort((a, b) => b.score - a.score || b.pct - a.pct)
  }
  let list = _cache
  if (opts.nonCapitalOnly) list = list.filter((s) => s.nonCapital)
  if (opts.minMw) list = list.filter((s) => (s.gridMw ?? 0) >= opts.minMw)
  // 지역 다양화 캡(시도당 최대 N) — 전국 스크리닝 목적 보정.
  // 근거: 순수 점수순은 충남 쏠림(TOP20 중 17곳)이 발생 — 서해안 발전소 인접 축 + OSM 산단
  // 표본 밀도 편향(충남 39곳 vs 경북 21곳) 때문이지 경북·경남 계통 여건이 나빠서가 아님
  // (공급여유 경북 7,935MW 1위·승인율 100%). 캡을 걸어 시도별 최상위 후보가 고루 노출되게 한다.
  const cap = opts.perSidoMax ?? 3
  if (cap) {
    const cnt = {}
    list = list.filter((s) => (cnt[s.sido] = (cnt[s.sido] || 0) + 1) <= cap)
  }
  return list.slice(0, topN)
}

/** 추천 근거 요약 — 왜 이 후보가 상위인지 핵심 드라이버 3~4개. (정적 근거 기준) */
export function recoReasons(s) {
  const out = []
  if (s.subKm != null) out.push(`변전소 ${s.subKm.toFixed(1)}km`)
  if (s.gridApproval != null) out.push(`승인율 ${s.gridApproval}%`)
  if (s.gridMw != null) out.push(`공급여유 ${s.gridMw.toLocaleString()}MW`)
  if (s.climateLabel) out.push(`냉각 ${s.climateLabel}`)
  if (s.nonCapital) out.push('비수도권 유인')
  return out
}
