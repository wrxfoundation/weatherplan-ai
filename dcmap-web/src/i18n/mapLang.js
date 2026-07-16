import { useSyncExternalStore } from 'react'

/* 맵 UI 공유 언어 스토어 — FilterBar 토글 하나로 SitePanel까지 동기화(프롭 스레딩 없이).
 * Phase 1·2: 가시 라벨만. 데이터값·출처 각주는 KO 유지(Phase 3). */
let lang = 'ko'
const subs = new Set()
export function getMapLang() {
  return lang
}
export function setMapLang(next) {
  if (next !== lang) {
    lang = next
    subs.forEach((f) => f())
  }
}
function subscribe(f) {
  subs.add(f)
  return () => subs.delete(f)
}
export function useMapLang() {
  return useSyncExternalStore(subscribe, getMapLang, getMapLang)
}
