// 관제 센터 · 가입 영역 · 회원 규칙 (2026-10-06) — 화면 · 서버 공용 (비밀 값 없음).
//
// 관제 1 · 2 · 3센터는 서로 완전히 따로 쓰는 테스트 공간이다. 센터마다 가구 상태(HH-C1 …) · 회원 · 활동 기록이
// 따로 쌓인다. 가입 코드(센터마다 하나 · 관제가 바꿀 수 있다)로 가입한 사람이 그 센터 회원이 된다.
//
// 가입 · 로그인 입구는 세 영역으로 나눈다 — 어느 영역이든 그 센터 관제가 승인해야 로그인된다
// (2026-10-06 점검: 이용자를 바로 열면 가입 코드만 아는 사람이 센터 기록 전체를 읽고 쓸 수 있었다):
//   이용자     어르신 · 보호자     /join          /login
//   현장 · 영업 컨시어지 · 영업자   /partner/join  /partner/login
//   관제       관제 관리자         /ops/join      /ops/login
// 역할은 관제가 바꿀 수 있다 (다른 영역 역할로 바꾸면 그 영역 입구로 다시 로그인).
// 관제 역할을 주고 빼는 일과 관제 회원의 정지는 센터 관리자(ops1 · ops2 · ops3)만 한다.
import { ROLE_LABEL } from "./test-accounts";

export const CENTERS = {
  C1: { id: "C1", name: "관제 1센터", household: "HH-C1" },
  C2: { id: "C2", name: "관제 2센터", household: "HH-C2" },
  C3: { id: "C3", name: "관제 3센터", household: "HH-C3" },
};
export const centerOfHousehold = (hh) => Object.values(CENTERS).find((c) => c.household === hh) || null;
export const isCenterHousehold = (hh) => !!centerOfHousehold(hh);

export const AREAS = {
  user: { key: "user", label: "이용자", desc: "어르신 · 보호자", roles: ["guardian", "elder"], join: "/join", login: "/login", approval: true },
  partner: { key: "partner", label: "현장 · 영업", desc: "컨시어지 · 영업자", roles: ["concierge", "sales"], join: "/partner/join", login: "/partner/login", approval: true },
  ops: { key: "ops", label: "관제", desc: "관제 관리자", roles: ["ops"], join: "/ops/join", login: "/ops/login", approval: true },
};
export const areaOfRole = (role) => Object.values(AREAS).find((a) => a.roles.includes(role))?.key || null;
// 요청 값으로 영역을 고를 때 — 'constructor' 같은 객체 기본 이름이 영역으로 읽히지 않게
export const isArea = (v) => typeof v === "string" && Object.prototype.hasOwnProperty.call(AREAS, v);
export const ALL_ROLES = ["guardian", "elder", "concierge", "sales", "ops"];
export const roleText = (role) => `${ROLE_LABEL[role] || role || "—"} · ${AREAS[areaOfRole(role)]?.label || "—"}`;

export const MEMBER_STATUS = {
  pending: { label: "승인 대기", tone: "warn" },
  active: { label: "사용 중", tone: "ok" },
  rejected: { label: "가입 거절", tone: "muted" },
  suspended: { label: "정지", tone: "muted" },
};

// 아이디 — 영문 소문자로 시작, 4~20자 (소문자 · 숫자 · . _ -). 테스트 계정 이름과 겹치는 것은 막는다
export const LOGIN_ID_RE = /^[a-z][a-z0-9._-]{3,19}$/;
const RESERVED = /^(test-|ops\d|admin|root|kcare|system|google)/;
export function checkLoginId(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "아이디를 적어 주세요";
  if (!LOGIN_ID_RE.test(s)) return "영문 소문자로 시작하는 4~20자 (소문자 · 숫자 · . _ -)";
  if (RESERVED.test(s)) return "쓸 수 없는 아이디입니다 (테스트 · 관리용 이름)";
  return null;
}
export function checkPassword(pw, id) {
  const s = String(pw || "");
  if (s.length < 8) return "비밀번호는 8자 이상";
  if (s.length > 64) return "비밀번호는 64자까지";
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return "영문과 숫자를 함께 넣어 주세요";
  if (id && s.toLowerCase().includes(String(id).toLowerCase())) return "아이디가 들어간 비밀번호는 쓸 수 없습니다";
  return null;
}
// 가입 코드 — 새로 만드는 코드는 8자리(헷갈리는 글자 뺀 32자 · 암호학적 난수). 예전 6자리 코드도 읽는다
export const JOIN_CODE_RE = /^[A-Z0-9]{6,8}$/;
export const normCode = (v) => String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
