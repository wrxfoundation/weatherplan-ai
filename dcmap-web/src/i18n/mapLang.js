import { useSyncExternalStore } from 'react'

/* 앱 공용 언어 스토어 — 토글 하나로 맵(FilterBar·SitePanel)·계산기·인사이트·견본 리포트까지 동기화.
 * localStorage 지속(새로고침·재방문 유지). document.documentElement.lang 반영(a11y/SEO).
 * 데이터값·출처 각주 등 미번역 영역은 각 화면에서 KO 유지(단계적 i18n). */
const KEY = 'aimap-lang'
function readInitial() {
  try {
    const v = typeof localStorage !== 'undefined' && localStorage.getItem(KEY)
    return v === 'en' || v === 'ko' ? v : 'ko'
  } catch {
    return 'ko'
  }
}
let lang = readInitial()
const subs = new Set()
if (typeof document !== 'undefined') {
  try {
    document.documentElement.lang = lang
  } catch {
    /* noop */
  }
}
export function getMapLang() {
  return lang
}
export function setMapLang(next) {
  if ((next === 'ko' || next === 'en') && next !== lang) {
    lang = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* noop */
    }
    try {
      document.documentElement.lang = next
    } catch {
      /* noop */
    }
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
