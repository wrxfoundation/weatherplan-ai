// 지가변동률 스냅샷 로더 — KOSIS 월간(시군구), 토지축 근거 데이터 (점수화 전 단계)
import lp from '../../data/land_price_v0.json'

export const LAND_PRICE = lp

export const LAND_PRICE_PERIOD = `${lp.period.slice(0, 4)}.${lp.period.slice(4)}`

export function landPriceFor(facility) {
  const key = facility.sigungu ? `${facility.sido} ${facility.sigungu}` : facility.sido
  if (lp.entries[key] != null) return { value: lp.entries[key], scope: key, period: LAND_PRICE_PERIOD }
  if (lp.entries[facility.sido] != null)
    return { value: lp.entries[facility.sido], scope: facility.sido, period: LAND_PRICE_PERIOD }
  return null
}

export const fmtRate = (v) => `${v > 0 ? '+' : ''}${v}%`
