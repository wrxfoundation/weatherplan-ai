// 데이터센터 기후 적합도 지수 — 공개 기상 원리 기반(임의 가중치 아님).
// 핵심 동인: 연평균기온 → 프리쿨링(외기냉방) 가능시간 → PUE. 낮을수록 좋음.
// 정직성: 연평균기온이 없으면 현재기온으로 근사하고 그 사실을 표기(basedOn). 습도는 보조.
//
// 한국 연평균기온 분포(기상 평년값 대략): 대관령~7 · 춘천~11.5 · 서울~12.5 · 대전~13 ·
//   대구~14.5 · 부산~14.9 · 제주~16.5 — 냉각 관점에선 '낮을수록 유리'.

const LEVELS = [
  { level: 5, label: '아주좋음', tone: 'vgood' },
  { level: 4, label: '좋음', tone: 'good' },
  { level: 3, label: '보통', tone: 'mid' },
  { level: 2, label: '나쁨', tone: 'bad' },
  { level: 1, label: '아주나쁨', tone: 'vbad' },
]
export const CLIMATE_LEVELS = LEVELS

/** 연평균기온(℃) → 5단계 냉각 적합도 */
function levelFromTemp(t) {
  if (t <= 10.5) return LEVELS[0] // 아주좋음 — 강원 산간·고지대
  if (t <= 12.5) return LEVELS[1] // 좋음 — 춘천·중부 내륙
  if (t <= 13.5) return LEVELS[2] // 보통 — 수도권 평지
  if (t <= 15) return LEVELS[3] // 나쁨 — 남부 내륙
  return LEVELS[4] // 아주나쁨 — 온난 해안·제주
}

/**
 * @param {{avgTemp?:number, humidity?:number, currentTemp?:number}} d
 * @returns {{level, label, tone, temp, basedOn, note}|null}
 */
export function dcClimateIndex({ avgTemp, humidity, currentTemp } = {}) {
  const t = avgTemp != null ? avgTemp : currentTemp
  if (t == null) return null
  const base = levelFromTemp(t)
  const basedOn = avgTemp != null ? 'annual' : 'current'
  // 고습(연 65%+)은 증발식·외기냉방 효율을 떨어뜨림 — 경계선(보통 이상)일 때만 1단계 하향 보조 반영
  let level = base.level
  let humidNote = null
  if (humidity != null && humidity >= 70 && level >= 3) {
    level = Math.max(1, level - 1)
    humidNote = `습도 ${humidity}% 반영 1단계 하향`
  }
  const adj = LEVELS.find((l) => l.level === level)
  const note =
    basedOn === 'annual'
      ? `연평균기온 ${t}°C 기준 프리쿨링 잠재력${humidNote ? ` · ${humidNote}` : ''}`
      : `현재기온 ${t}°C 근사(연평균 미확보 — 참고치)${humidNote ? ` · ${humidNote}` : ''}`
  return { level: adj.level, label: adj.label, tone: adj.tone, temp: t, basedOn, note }
}
