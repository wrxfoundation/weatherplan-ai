// 이 공간의 사람 이름 묶음을 들고 있는 칸 — lib/people.js 가 바꾸고, 이름을 쓰는 라이브러리들이 구독한다 (2026-10-06).
// 서로 불러오는 고리가 생기지 않고, 화면 공통 묶음(_app)에 예시 데이터 모듈을 끌고 들어가지 않게 따로 둔다.
// 이름을 쓰는 모듈(ops-health · live-household · mock · sales)은 불러와질 때 onPeople 로 등록하고,
// 이미 정해진 이름이 있으면 그 자리에서 바로 받는다.
let center = null; // 관제 센터 공간이면 이름 묶음, 아니면 null
let names = null; // 지금 이름 묶음 (데모 · 테스트 가구 포함) — 아직 안 정했으면 null (각 모듈의 기본값)
const subs = new Set();

export const peopleNow = () => center;
export const centerNow = () => !!center;
export function onPeople(fn) {
  subs.add(fn);
  if (names) fn(names);
}
export function publishPeople(p) {
  names = p;
  center = p?.center ? p : null;
  subs.forEach((fn) => fn(p));
}
