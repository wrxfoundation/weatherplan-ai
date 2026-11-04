/**
 * 표면(surface) 결정 — 한 곳에서만 한다.
 *
 * 표면은 두 가지 입력에서 나온다.
 *   1) 사용자 선택 테마: 'system' | 'light' | 'dark'  (localStorage에 저장)
 *   2) 라우트: 지도는 어두운 타일 위에 얹히므로 테마와 무관하게 항상 밤이다.
 *
 * 결과는 documentElement의 data-surface 하나로만 표현한다. CSS는 이미 전부
 * [data-surface='night']에 걸려 있으므로, 여기서 다른 속성을 새로 만들면
 * 선택자를 전부 이중으로 써야 한다. 입력이 늘어도 출력은 하나로 유지한다.
 */
export const THEME_KEY = 'yokaimap:theme'
export const THEMES = ['system', 'light', 'dark']

export function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return THEMES.includes(v) ? v : 'system'
  } catch {
    // 사파리 프라이빗 모드 등에서 localStorage 접근이 던진다. 테마 때문에 앱이 죽으면 안 된다.
    return 'system'
  }
}

export function writeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* 저장 실패는 무시 — 이번 세션에만 적용된다 */
  }
}

export function prefersDark() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

/** 최종 표면. routeNight는 지도처럼 테마를 무시하고 밤으로 고정하는 라우트. */
export function resolveSurface(theme, routeNight) {
  if (routeNight) return 'night'
  if (theme === 'dark') return 'night'
  if (theme === 'light') return 'day'
  return prefersDark() ? 'night' : 'day'
}

export function applySurface(surface) {
  const root = document.documentElement
  if (surface === 'night') root.dataset.surface = 'night'
  else delete root.dataset.surface
  // 주소창 색까지 맞춰야 모바일에서 경계가 뜨지 않는다. tokens.css의 --bg와 같은 값이어야 한다.
  document.head
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', surface === 'night' ? '#100e0c' : '#f4efe3')
}
