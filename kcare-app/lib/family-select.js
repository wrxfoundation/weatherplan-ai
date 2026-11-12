// 관제 · 컨시어지가 지금 보고 있는 가족 (2026-11-12 · lib/families.js) — 브라우저에서만.
//
// 직원은 한 센터의 여러 가족을 맡는다. 화면(가구 기록 한 벌)은 한 번에 한 가족을 보여 주고, 어느 가족인지는 여기서 고른다.
// 탭마다 따로 기억한다(sessionStorage) — 탭 둘에 서로 다른 가족을 열어 둘 수 있다. 새 탭은 마지막으로 고른 가족으로 연다(localStorage).
// 서버에 보내는 모든 요청에는 고른 가족 번호가 같이 간다(?hh=) — 저장소의 값이 바뀌어도 열려 있는 화면의 기록이 다른 가족에 저장되지 않는다.
import { useSyncExternalStore } from "react";

const key = (uid) => `kcare-family-${uid}`;
const subs = new Set();
const HH_RE = /^HH-C[1-3](-[A-HJ-NP-Z2-9]{6})?$/;

function read(uid) {
  if (typeof window === "undefined" || !uid) return null;
  try {
    const v = sessionStorage.getItem(key(uid)) || localStorage.getItem(key(uid));
    return v && HH_RE.test(v) ? v : null;
  } catch (_) {
    return null;
  }
}

// 고르기 — null 이면 고른 것을 지운다 (서버가 기본 가족을 정한다)
export function chooseFamily(uid, household) {
  if (typeof window === "undefined" || !uid) return;
  try {
    if (household && HH_RE.test(household)) {
      sessionStorage.setItem(key(uid), household);
      localStorage.setItem(key(uid), household);
    } else {
      sessionStorage.removeItem(key(uid));
      localStorage.removeItem(key(uid));
    }
  } catch (_) {
    /* 저장소를 못 쓰는 브라우저 — 이번 화면에서만 */
  }
  subs.forEach((fn) => fn());
}

const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

// uid 가 없으면(직원이 아니면) 늘 null
export function useFamilyChoice(uid) {
  return useSyncExternalStore(
    subscribe,
    () => read(uid),
    () => null
  );
}
