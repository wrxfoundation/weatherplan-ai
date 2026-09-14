/**
 * 탐사(조우) 엔진 — 위치·시간·날씨로 "지금 이 권역에 나타나는 요괴"를 정한다.
 *
 * 설계에서 물러설 수 없는 두 가지:
 *
 * 1) 조우는 **시군구 권역** 단위다. 특정 지점으로 유인하지 않는다.
 *    우리는 푸터에 "실존 신당·사유지 방문을 권유하지 않습니다"라고 적어 뒀다.
 *    좌표를 목표로 찍어 주는 순간 그 고지문이 거짓이 된다. 마침 시드의 좌표
 *    정밀도는 sigungu/dong/sido뿐이고 parcel(지번)은 0건이라, 데이터 자체가
 *    이미 권역 수준이다. 지점이 아니라 권역을 쓰는 것이 데이터에도 맞다.
 *
 * 2) 난수를 쓰지 않는다. (날짜 + 권역 + 시간대)에서 결정적으로 뽑는다.
 *    같은 지역·같은 시간대의 두 사람은 같은 것을 본다. 그래야 "지금 경주에
 *    뭐 떴어?"가 성립하고, 서버 없이도 공유가 된다. 흉조지수·체질진단과
 *    같은 원칙이다.
 */
import { timeBucket, seasonOf, weatherConditions, WEATHER_LABEL, TIME_LABEL, SEASON_LABEL } from './omen.js'

/** 권역 반경 — 이 안의 전승지가 속한 시군구를 '내 권역'으로 본다. */
export const REGION_RADIUS_KM = 30

/** 오늘 한 권역에 나타나는 수 */
export const ENCOUNTER_COUNT = 3

const R = 6371
const rad = (d) => (d * Math.PI) / 180

export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** FNV-1a — quiz.js와 같은 방식. 서버 없이 결정적 추첨을 하기 위한 것이지 보안용이 아니다. */
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 좌표 → 내 권역. 반경 안에 전승지가 없으면 null(= 기록된 전승지가 없는 지역). */
export function regionAt(entries, pos, radiusKm = REGION_RADIUS_KM) {
  let best = null
  const sigungu = new Set()
  const sido = new Set()
  for (const e of entries) {
    for (const s of e.sites ?? []) {
      const d = distanceKm(pos, s)
      if (d > radiusKm) continue
      sigungu.add(s.sigungu)
      sido.add(s.sido)
      if (!best || d < best.distanceKm) best = { site: s, entryId: e.id, distanceKm: d }
    }
  }
  if (!best) return null
  return { nearest: best, sigungu: [...sigungu], sido: [...sido], radiusKm }
}

const RARITY_WEIGHT = { common: 30, uncommon: 18, rare: 8 }

/**
 * 권역 + 조건 → 출현 후보와 점수.
 * 지역 연고가 있는 개체를 우선하되, 전국 전승(nationwide)은 어디서나 낮은 가중치로 붙는다.
 */
export function candidates(entries, region, ctx) {
  const cond = weatherConditions(ctx.weather)
  const tb = timeBucket(ctx.hour)
  const season = seasonOf(ctx.month)
  const inRegion = new Set(region?.sigungu ?? [])
  const inSido = new Set(region?.sido ?? [])

  const out = []
  for (const e of entries) {
    let score = 0
    const reasons = []

    const localSite = (e.sites ?? []).find((s) => inRegion.has(s.sigungu))
    if (localSite) {
      score += 60
      reasons.push(`${localSite.sigungu} 전승지`)
    } else if ((e.sites ?? []).some((s) => inSido.has(s.sido))) {
      score += 24
      reasons.push('같은 시도 전승')
    } else if (e.distribution === 'nationwide') {
      score += 10
      reasons.push('전국 전승')
    } else {
      continue // 연고 없는 지역 개체는 뽑지 않는다
    }

    for (const w of e.omens?.weather ?? []) {
      if (cond.has(w)) {
        score += 30
        reasons.push(`${WEATHER_LABEL[w]}에 나타남`)
      }
    }
    if ((e.omens?.time ?? []).includes(tb)) {
      score += 25
      reasons.push(`${TIME_LABEL[tb]} 전승`)
    }
    if ((e.omens?.season ?? []).includes(season)) {
      score += 12
      reasons.push(`${SEASON_LABEL[season]} 전승`)
    }
    score += RARITY_WEIGHT[e.rarity] ?? 10

    out.push({ entry: e, score, reasons })
  }
  return out.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
}

/** 결정적 추첨 키 — 날짜·권역·시간대가 같으면 결과가 같다. */
export function encounterKey(region, ctx) {
  const day = ctx.now.toISOString().slice(0, 10)
  const area = region ? [...region.sigungu].sort().join(',') : 'none'
  return `${day}|${area}|${timeBucket(ctx.hour)}`
}

/**
 * 오늘 이 권역의 출현 목록.
 * 상위 후보군에서 결정적으로 고른다 — 1등만 계속 나오면 재미가 없고,
 * 완전 무작위면 "전승지가 있는 지역"이라는 의미가 사라진다.
 */
export function encountersFor(entries, region, ctx, count = ENCOUNTER_COUNT) {
  const pool = candidates(entries, region, ctx)
  if (!pool.length) return []
  const key = encounterKey(region, ctx)
  const inRegion = new Set(region?.sigungu ?? [])
  const isLocal = (c) => (c.entry.sites ?? []).some((s) => inRegion.has(s.sigungu))

  const picked = []
  const used = new Set()
  const take = (list, i) => {
    if (!list.length) return
    let idx = hash(`${key}#${i}`) % list.length
    for (let n = 0; n < list.length && used.has(list[idx].entry.id); n++) idx = (idx + 1) % list.length
    const c = list[idx]
    if (used.has(c.entry.id)) return
    used.add(c.entry.id)
    picked.push(c)
  }

  // 지역 연고 개체를 최소 1체 보장한다. 없으면 "여기 올 이유"가 사라져서
  // 전국 전승만 뜨는 목록이 되고, 그건 위치 기반이라고 부를 수 없다.
  const locals = pool.filter(isLocal)
  if (locals.length) take(locals.slice(0, 8), 'local')

  const rest = pool.slice(0, Math.max(count * 4, 12))
  for (let i = picked.length; i < count; i++) take(rest, i)
  return picked
}

/**
 * 현행 신앙에 속한 신격인지. 조우 자체는 막지 않되 화면에 고지를 띄운다.
 * 무속·불교 신격을 '퇴치 대상'처럼 다루면 그 자체가 공격 지점이 된다.
 */
export function needsFaithNotice(entry) {
  return entry.sensitivity?.kind === 'living_faith'
}
