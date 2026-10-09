// 이 공간의 사람 이름 (2026-10-06) — 화면 전체가 쓰는 어르신 · 보호자 · 컨시어지 · 영업자 이름을 한 곳에서 정한다.
//
//   데모 · 테스트 가구 1   예전 그대로 김순자 · 김민수 · 박지현 · 한지우 (화면과 기록이 이 이름으로 이어져 있다)
//   관제 센터 공간(HH-C1~3) 그 센터에 가입 · 승인된 회원 이름 — 아직 가입 전이면 '어르신' · '보호자'처럼 역할 이름.
//                         예시 인물의 나이 · 동네 · 질환 같은 값도 쓰지 않는다 (새로 시작하는 공간)
//
// lib/state.js 의 Provider 가 가구를 읽을 때(서버가 센터 회원 이름 · 역할을 함께 준다) applyPeople 을 부른다.
// 이름을 쓰는 모듈(LIVE_ELDER · LIVE_GUARDIAN · LIVE_CONCIERGE · LIVE_TAG · ELDER · TEACHER · SALES_REP)은
// lib/people-store.js 를 구독해 값을 바꾼다 — 이 파일은 예시 데이터 모듈을 불러오지 않는다 (화면 공통 묶음을 가볍게).
// 브라우저에서만 바꾼다 — 서버에서 그리는 동안 바꾸면 다른 사람의 요청에 섞인다.
import { centerOfHousehold } from "./centers";
import { centerNow, publishPeople } from "./people-store";

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

// 센터 회원 목록([{ name, role, id? }]) + 가입 상담 값 → 이름 묶음
export function peopleFor(household, list, onboarding) {
  const center = centerOfHousehold(household);
  if (!center) return DEFAULT_PEOPLE;
  const rows = Array.isArray(list) ? list : [];
  const names = (role) => rows.filter((m) => m.role === role).map((m) => String(m.name || "").trim()).filter(Boolean);
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
    // 계정 아이디 → 이름 (관제 감사로그의 '누가' · 관제 계정에만 아이디가 온다)
    byId: Object.fromEntries(rows.filter((m) => m.id).map((m) => [m.id, m.name])),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function applyPeople(next) {
  if (typeof window === "undefined") return;
  const p = next || DEFAULT_PEOPLE;
  if (same(p, current)) return;
  current = p;
  publishPeople(p);
}

// 담당 컨시어지 고르는 칸 — 센터 공간이면 그 센터 컨시어지만 (없으면 빈 목록 — 예시 인력 · 자리 이름을 보이지 않는다)
export const conciergeChoices = (demoList) => (current.center ? current.concierges : demoList);
// 새 요청 · 제안의 담당 — 센터 공간에 승인된 컨시어지가 없으면 비워 둔다 ('담당 컨시어지' 같은 자리 이름을 저장하지 않는다)
export const assigneeNow = () => (current.center ? current.concierges[0] || null : current.concierge);
// 이 기기에 로그인한 사람 이름 — 센터 공간에서 같은 역할 회원이 여럿이면 각자 자기 이름으로 남긴다.
// 데모 · 테스트 가구 1 은 예전 인물 이름 그대로
export function meAs(user, role) {
  if (centerNow() && user?.role === role && user?.name) return user.name;
  return role === "concierge" ? current.concierge : role === "guardian" ? current.guardian : role === "sales" ? current.sales : current.elder;
}
// 어르신 이름 — 센터 공간은 회원 이름 한 곳에서(가입 상담 이름과 갈리지 않게), 데모 · 테스트 가구는 가입 상담 이름 → 기본 인물
export const elderNameOf = (ob) => (current.center ? current.elder : String(ob?.elderName || "").trim() || current.elder);

// 어르신 가족 탭 · 보호자 홈이 쓰는 '목소리 받는 사람' — 센터 공간은 그 센터 보호자 회원 (예시 세 자녀 없이)
export const voiceTargetsCenter = () => [
  ...current.guardians.map((g, i) => ({ id: i === 0 ? "v1" : `vg${i}`, initials: avatarText(g), name: g, sub: "보호자", avBg: i === 0 ? "#0A1F3C" : "#E8DFCB", avFg: i === 0 ? "#FFFFFF" : "#7A5C28" })),
  { id: "all", initials: "가족", name: "가족 모두", sub: "보호자 모두에게 함께", avBg: "#1E7A5A", avFg: "#FFFFFF" },
];

// 부르는 이름 · 동그라미 글자 (2026-10-06 점검) — 흔한 세 글자 이름(김순자 → 순자)만 성을 뗀다.
// 회원이 적은 이름은 두 글자 · 네 글자 이상일 수 있고, '어르신' · '담당 컨시어지' 같은 자리 이름을 자르면 '르신' · '당'이 된다
const PLACEHOLDERS = new Set(["어르신", "보호자", "담당 컨시어지", "영업 담당"]);
export const isPlaceholder = (name) => PLACEHOLDERS.has(String(name || "").trim());
export function givenName(full) {
  const s = String(full || "").trim();
  return /^[가-힣]{3}$/.test(s) && !PLACEHOLDERS.has(s) ? s.slice(1) : s;
}
export function avatarText(full) {
  const s = String(full || "").trim();
  if (!s || PLACEHOLDERS.has(s)) return s.slice(0, 1);
  if (/^[가-힣]{3}$/.test(s)) return s.slice(1);
  return s.slice(0, 2);
}
