/* 웨더팩트 단독 모드 판별 — 같은 코드베이스, 별도 도메인 배포.
 * 우선순위: 빌드 env(별도 Vercel 프로젝트에서 VITE_WEATHERFACT=1) > 호스트명 휴리스틱.
 * dcmap 도메인에서는 항상 false → 기존 앱 전체 라우트 유지. */
export function isWeatherFactHost() {
  if (import.meta.env.VITE_WEATHERFACT === '1') return true
  if (typeof location === 'undefined') return false
  const h = location.hostname
  return /^(weatherfact|fact)\./.test(h) || h.startsWith('weatherfact')
}
