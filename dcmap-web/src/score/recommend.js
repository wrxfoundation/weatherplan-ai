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

let _cache = null

/** 산단 후보를 정적 근거 점수로 랭킹 → 상위 topN [{name,type,lat,lng,sido,score,max,pct,nearestSub,gridMw,gridApproval}] */
export function recommendSites(topN = 20) {
  if (!_cache) {
    _cache = INDUSTRIAL_COMPLEXES.map(([name, lat, lng, type]) => {
      const sido = sidoOf(lat, lng)
      const nonCapital = !CAPITAL_SIDOS.has(sido)
      const gridMw = gridHeadroomForSido(sido)?.mw ?? null
      const gridApproval = dcApprovalForSido(sido)?.ratePct ?? null
      const plantKm = nearestPlant({ lat, lng })?.km ?? null
      const r = scoreSite({ lat, lng, nonCapital, gridMw, gridApproval, plantKm })
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
        gridMw,
        gridApproval,
      }
    }).sort((a, b) => b.score - a.score || b.pct - a.pct)
  }
  return _cache.slice(0, topN)
}
