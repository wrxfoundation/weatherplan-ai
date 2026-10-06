// 이 공간의 사람 이름 (2026-10-06) — 화면 전체가 쓰는 어르신 · 보호자 · 컨시어지 · 영업자 이름을 한 곳에서 정한다.
//
//   데모 · 테스트 가구 1   예전 그대로 김순자 · 김민수 · 박지현 · 한지우 (화면과 기록이 이 이름으로 이어져 있다)
//   관제 센터 공간(HH-C1~3) 그 센터에 가입한 회원 이름 — 아직 가입 전이면 '어르신' · '보호자'처럼 역할 이름.
//                         예시 인물의 나이 · 동네 · 질환 같은 값도 쓰지 않는다 (새로 시작하는 공간)
//
// lib/state.js 의 Provider 가 가구를 읽을 때(서버가 센터 회원 이름 · 역할을 함께 준다) applyPeople 을 부른다.
// 이름 상수(LIVE_ELDER · LIVE_GUARDIAN · LIVE_CONCIERGE · LIVE_TAG)는 다시 쓸 수 있는 값이라 화면이 그릴 때마다 지금 값을 읽는다.
// 브라우저에서만 바꾼다 — 서버에서 그리는 동안 바꾸면 다른 사람의 요청에 섞인다.
import { setLiveElder } from "./ops-health";
import { setLiveNames } from "./live-household";
import { ELDER, TEACHER } from "./mock";
import { SALES_REP } from "./sales";
import { centerOfHousehold } from "./centers";
import { setPeopleNow } from "./people-store";

export const DEFAULT_PEOPLE = Object.freeze({
  center: null,
  tag: "테스트 가구 1",
  elder: "김순자",
  elderAge: 78,
  district: "강남구",
  dong: "대치동",
  guardian: "김민수",
  elders: ["김순자"],
  guardians: ["김민수"],
  concierge: "박지현",
  concierges: ["박지현"],
  sales: "한지우",
  byId: {},
});

let current = DEFAULT_PEOPLE;
export const people = () => current;
export const inCenter = () => !!current.center;

// 센터 회원 목록([{ id, name, role }]) + 가입 상담 값 → 이름 묶음
export function peopleFor(household, list, onboarding) {
  const center = centerOfHousehold(household);
  if (!center) return DEFAULT_PEOPLE;
  const names = (role) => (Array.isArray(list) ? list : []).filter((m) => m.role === role).map((m) => String(m.name || "").trim()).filter(Boolean);
  const elders = names("elder");
  const guardians = names("guardian");
  const concierges = names("concierge");
  const sales = names("sales");
  const district = String(onboarding?.district || "").trim();
  return {
    center: center.id,
    tag: center.name,
    // 어르신 회원이 먼저 · 없으면 보호자가 가입 상담에 적은 어르신 이름 · 그것도 없으면 '어르신'
    elder: elders[0] || String(onboarding?.elderName || "").trim() || "어르신",
    elderAge: null,
    elders,
    district: district || "지역 미등록",
    dong: district || "지역 미등록",
    guardian: guardians[0] || "보호자",
    guardians,
    concierge: concierges[0] || "담당 컨시어지",
    concierges,
    sales: sales[0] || "영업 담당",
    // 계정 아이디 → 이름 (관제 감사로그의 '누가')
    byId: Object.fromEntries((Array.isArray(list) ? list : []).map((m) => [m.id, m.name])),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function applyPeople(next) {
  if (typeof window === "undefined") return;
  const p = next || DEFAULT_PEOPLE;
  if (same(p, current)) return;
  current = p;
  setPeopleNow(p.center ? p : null);
  setLiveElder(p.elder);
  setLiveNames({ tag: p.tag, guardian: p.guardian, concierge: p.concierge });
  ELDER.name = p.elder;
  ELDER.age = p.elderAge;
  ELDER.district = p.district;
  ELDER.dong = p.dong;
  TEACHER.name = p.concierge;
  SALES_REP.name = p.sales;
}

// 담당 컨시어지 고르는 칸 — 센터 공간이면 그 센터 컨시어지만 (예시 인력 명단을 보이지 않는다)
export const conciergeChoices = (demoList) => (current.center ? (current.concierges.length ? current.concierges : [current.concierge]) : demoList);

// "김순자(78)" · 나이를 모르면 이름만 — 센터 공간에는 나이를 지어 넣지 않는다
export const elderWho = (sep = "") => (ELDER.age ? `${ELDER.name}${sep}(${ELDER.age})` : ELDER.name);
