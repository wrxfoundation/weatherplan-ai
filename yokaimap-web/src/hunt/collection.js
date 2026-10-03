/**
 * 수집 기록 — 브라우저에만 남는다.
 *
 * 서버를 두지 않는 이유는 1단계가 "재미가 성립하는가"만 보는 단계이기 때문이다.
 * 계정·동기화는 검증된 뒤에 붙인다. 대신 기기를 옮기면 기록이 사라진다는 점을
 * 화면에 정직하게 적는다 — 숨기면 나중에 항의가 된다.
 *
 * 저장소 접근은 사파리 프라이빗 모드 등에서 던진다. 수집 기록 때문에 앱이
 * 죽으면 안 되므로 모든 접근을 감싼다.
 */
const KEY = 'yokaimap:collection'

export function readCollection() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeCollection(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
    return true
  } catch {
    return false
  }
}

/** 이미 잡은 개체는 덮어쓰지 않는다 — 최초 조우 시각이 기록의 값이다. */
export function collect(id, meta) {
  const map = readCollection()
  if (map[id]) return { map, added: false }
  map[id] = { at: new Date().toISOString(), ...meta }
  const saved = writeCollection(map)
  return { map, added: true, saved }
}

export function clearCollection() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 지우지 못해도 앱은 계속 동작해야 한다 */
  }
}
