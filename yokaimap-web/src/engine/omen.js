/**
 * 날씨 × 괴담 엔진 — 결정론 전용(같은 입력 → 같은 출력, 난수 없음).
 *
 * 설계 원칙
 *  1) 전승에 실제로 기상 조건이 붙어 있는 개체만 가점한다. omens.weather가 비어 있는 개체를
 *     날씨로 끌어올리지 않는다(데이터에 없는 것을 만들어 내지 않음).
 *  2) 괴담지수는 '무서움'이 아니라 '전승 조건 부합도'다. 근거를 factors[]로 항상 함께 반환해
 *     화면에서 이유를 설명할 수 있게 한다.
 *  3) 날씨 API가 없으면(available=false) 시간·계절만으로 계산하고 그 사실을 표시한다.
 */

export const WEATHER_LABEL = {
  rain: '비',
  heavy_rain: '큰비',
  fog: '안개',
  snow: '눈',
  wind: '바람',
  storm: '폭풍',
  heat: '무더위',
  cold: '추위',
  humid: '높은 습도',
  dry: '건조',
  clear: '맑음',
}

export const TIME_LABEL = { dawn: '새벽', day: '낮', dusk: '해질녘', night: '밤', midnight: '한밤중' }
export const SEASON_LABEL = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }

/** 시각(0~23) → 전승의 시간대 구분 */
export function timeBucket(hour) {
  if (hour >= 4 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  if (hour >= 20 && hour < 24) return 'night'
  return 'midnight'
}

export function seasonOf(month) {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/**
 * 관측값 → 전승 기상 조건 집합.
 * 임계값은 기상 관행 기준(강수 3mm/h·10mm/h, 습도 80%, 풍속 9·14m/s, 기온 30·0도, 시정 1km).
 */
export function weatherConditions(w) {
  const out = new Set()
  if (!w || w.available === false) return out
  const { precipMm, humidity, windMs, tempC, visibilityKm, sky } = w

  if (precipMm != null) {
    if (precipMm >= 10) out.add('heavy_rain')
    if (precipMm > 0) out.add(tempC != null && tempC <= 0 ? 'snow' : 'rain')
  }
  if (sky === 'snow') out.add('snow')
  if (sky === 'rain' && !out.has('rain')) out.add('rain')
  if (visibilityKm != null && visibilityKm <= 1) out.add('fog')
  if (humidity != null) {
    if (humidity >= 80) out.add('humid')
    if (humidity <= 30) out.add('dry')
    // 습도 90% 이상 + 시정 정보 없음 → 안개 가능 조건으로 본다
    if (humidity >= 90 && visibilityKm == null) out.add('fog')
  }
  if (windMs != null) {
    if (windMs >= 14) out.add('storm')
    if (windMs >= 9) out.add('wind')
  }
  if (tempC != null) {
    if (tempC >= 30) out.add('heat')
    if (tempC <= 0) out.add('cold')
  }
  if (sky === 'clear' && !out.has('rain') && !out.has('snow')) out.add('clear')
  return out
}

/* 조건별 '괴이 친화 가중치' — 전승에서 요괴 출몰과 결합 빈도가 높은 순 */
const OMEN_WEIGHT = {
  fog: 18,
  heavy_rain: 14,
  storm: 14,
  rain: 10,
  snow: 9,
  humid: 8,
  wind: 7,
  heat: 5,
  cold: 5,
  dry: 4,
  clear: 0,
}
const TIME_WEIGHT = { midnight: 26, night: 20, dusk: 12, dawn: 10, day: 0 }

/**
 * 괴담지수 0~100 + 근거.
 * ctx = { weather, hour, month, sido }
 */
export function omenIndex(ctx) {
  const cond = weatherConditions(ctx.weather)
  const tb = timeBucket(ctx.hour)
  const factors = []

  let score = 12 // 기저값 — 아무 조건이 없어도 도감은 열려 있다
  const t = TIME_WEIGHT[tb] ?? 0
  if (t > 0) factors.push({ kind: 'time', code: tb, label: TIME_LABEL[tb], points: t })
  score += t

  for (const c of cond) {
    const w = OMEN_WEIGHT[c] ?? 0
    if (w > 0) factors.push({ kind: 'weather', code: c, label: WEATHER_LABEL[c], points: w })
    score += w
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const grade =
    score >= 75 ? '매우 높음' : score >= 55 ? '높음' : score >= 35 ? '보통' : score >= 20 ? '낮음' : '매우 낮음'

  return { score, grade, conditions: [...cond], timeBucket: tb, season: seasonOf(ctx.month), factors }
}

/**
 * 현재 조건에 부합하는 요괴 랭킹.
 * 반환: [{ entry, score, reasons[] }] — score가 0인 개체는 제외(억지 매칭 금지).
 */
export function rankYokai(entries, ctx, limit = 6) {
  const cond = weatherConditions(ctx.weather)
  const tb = timeBucket(ctx.hour)
  const season = seasonOf(ctx.month)

  const scored = entries.map((e) => {
    let score = 0
    const reasons = []

    for (const w of e.omens?.weather ?? []) {
      if (cond.has(w)) {
        score += 30
        reasons.push(`${WEATHER_LABEL[w]} 조건 전승`)
      }
    }
    if ((e.omens?.time ?? []).includes(tb)) {
      score += 20
      reasons.push(`${TIME_LABEL[tb]}에 나타남`)
    }
    if ((e.omens?.season ?? []).includes(season)) {
      score += 12
      reasons.push(`${SEASON_LABEL[season]} 전승`)
    }
    if (ctx.sido && e.sites?.some((s) => s.sido === ctx.sido)) {
      score += 15
      reasons.push(`${ctx.sido} 전승지`)
    }
    // 검증등급이 높은 항목을 먼저 보여 준다(동점 시 정렬 안정화 겸용)
    if (score > 0) {
      const bonus = { primary_text: 6, field_record: 5, public_encyclopedia: 4, secondary_compilation: 1, modern_online: 1 }
      score += bonus[e.verification] ?? 0
      if (e.confidence === 'low') score -= 8
    }
    return { entry: e, score, reasons }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit)
}
