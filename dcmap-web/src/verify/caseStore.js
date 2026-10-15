/* 웨더팩트 케이스 보관함 — localStorage 기반 저장/조회/삭제.
 * dcmap Calc 시나리오 저장 패턴(CalcPage SCENARIO_KEY) 이식: try/catch + 배열 가드 + SSR 가드.
 * 손해사정사가 사건(케이스) 여러 건을 오가며 같은 조회를 반복하는 워크플로 지원.
 * 정직성: 조회 "조건"만 저장(좌표·기간·용도·라벨) — 관측값·결과 수치는 저장하지 않음(연동 전 창작 금지). */

const CASE_KEY = 'wf_verify_cases_v1'
const MAX_CASES = 20 // 초과 시 가장 오래된 케이스부터 제거

const hasStorage = () => typeof localStorage !== 'undefined'

/* crypto.randomUUID 미지원 환경(구형 브라우저·비보안 컨텍스트) 폴백 — 증가 카운터 + 랜덤 접미사.
 * Date.now 단독 id는 같은 ms 연속 저장 시 충돌하므로 쓰지 않음. */
let seq = 0
const genId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `case-${++seq}-${Math.random().toString(36).slice(2, 8)}`

function read() {
  if (!hasStorage()) return []
  try {
    const raw = localStorage.getItem(CASE_KEY)
    const p = raw ? JSON.parse(raw) : []
    return Array.isArray(p) ? p : [] // 구스키마/변조로 배열이 아니면 무시(이후 .filter 크래시 방지)
  } catch {
    return []
  }
}

function write(list) {
  if (!hasStorage()) return
  try {
    localStorage.setItem(CASE_KEY, JSON.stringify(list))
  } catch {
    /* 저장 불가(용량 초과·프라이빗 모드) 무시 — 다음 read는 이전 상태 반환 */
  }
}

/** 저장된 케이스 목록 (최신이 앞). SSR/저장 불가 환경에서는 빈 배열. */
export function listCases() {
  return read()
}

/** 케이스 저장 — {label, lat, lon, from, to, use}. 갱신된 목록을 반환(setState용). */
export function saveCase({ label, lat, lon, from, to, use }) {
  const item = {
    id: genId(),
    label: (label || '').trim(),
    lat,
    lon,
    from: from || '',
    to: to || '',
    use: use || '',
    savedAt: new Date().toISOString(),
  }
  const next = [item, ...read()].slice(0, MAX_CASES) // 최신이 앞 — 20건 초과 시 오래된 것 제거
  write(next)
  return next
}

/** 케이스 삭제 — 갱신된 목록을 반환(setState용). */
export function removeCase(id) {
  const next = read().filter((c) => c.id !== id)
  write(next)
  return next
}
