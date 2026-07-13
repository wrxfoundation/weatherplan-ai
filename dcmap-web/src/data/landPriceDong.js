// 읍면동별 지가변동률 로더 — KOSIS·한국부동산원 DT_31501N_010 (월간), DC 입지 시군구만 수록
// 생성: scripts/land_dong.mjs (시군구 요약 + 읍면동 상세, rate 내림차순 정렬)
import lpd from '../../data/land_price_dong_v0.json'

export const LAND_DONG = lpd

export const LAND_DONG_PERIOD = `${lpd.period.slice(0, 4)}.${lpd.period.slice(4)}`

/** 시설/시군구 키의 읍면동 펄스: 시군구 평균 + 동 단위 최고·최저. 없으면 null */
export function dongPulseFor(facilityOrKey) {
  if (!facilityOrKey) return null
  const key =
    typeof facilityOrKey === 'string'
      ? facilityOrKey
      : facilityOrKey.sigungu
        ? `${facilityOrKey.sido} ${facilityOrKey.sigungu}`
        : null
  const e = key ? lpd.entries[key] : null
  if (!e || !e.dongs.length) return null
  return {
    key,
    rate: e.rate,
    top: e.dongs[0],
    bottom: e.dongs[e.dongs.length - 1],
    count: e.dongs.length,
    dongs: e.dongs,
    period: LAND_DONG_PERIOD,
  }
}
