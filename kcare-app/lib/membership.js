// 보호자 마이 · 멤버십 · 가족 화면이 같이 쓰는 값 (2026-10-15 디자인 시안으로 마이가 여러 화면으로 나뉘면서 한 곳에 모았다).
import { GUARDIANS } from "./mock";
import { HOUSEHOLD, PRICING, fmtWon } from "./config";
import { inCenter, people } from "./people";

// 월 구독료 표기 — 가입 때 고른 가구 구성(한 분 / 부부)에 따라 갈린다. 2급지는 확정 전.
export const monthlyLabel = (ob) =>
  ob?.tier === 2 ? "별도 산정" : ob?.household === "couple" ? `${fmtWon(HOUSEHOLD.monthly)} · 부부 가구` : fmtWon(PRICING.subscription.monthly);

// 한 가족 그룹 — 결제 권한 칩 · 이용료 '누가 낼까요' (2026-10-22). 데모 · 테스트 가구는 예시 세 자녀, 센터 공간은 그 센터 보호자 회원
export function payGroup(elderName) {
  const kids = inCenter()
    ? people().guardians.map((name) => ({ name, rel: "보호자" }))
    : GUARDIANS.map((g) => ({ name: g.name, rel: String(g.relation || "").split(" · ")[0] || "보호자" }));
  return [{ name: elderName, rel: "어르신", elder: true }, ...kids];
}

// 추가 이용 금액 받는 분 — 앱에서 그 청구를 열어 결제할 수 있는 사람만 (2026-10-22 점검).
// 데모 · 테스트 가구 1 은 어르신 화면과 주 보호자(김민수) 화면뿐이다 — 예시 자녀(김지영 · 김현우)에게 보내면 아무도 결제하지 못한다.
// 센터 공간은 그 센터 어르신 회원(가입했을 때) · 보호자 회원 — 각자 자기 이름으로 청구를 찾는다 (lib/people.js meAs)
export function extraPayees(elderName) {
  const p = people();
  if (!inCenter()) return [{ role: "elder", name: elderName || p.elder }, { role: "guardian", name: p.guardian }];
  return [...(p.elders.length ? [{ role: "elder", name: p.elders[0] }] : []), ...p.guardians.map((name) => ({ role: "guardian", name }))];
}

// 화면 주인 — 데모는 주 보호자 페르소나(김민수). 테스트 계정은 로그인한 계정 이름 (예시 이름을 붙이지 않는다).
export const meOf = (user) => (user?.household ? { name: user.name || "보호자", isPrimary: true } : GUARDIANS.find((g) => g.isPrimary) || GUARDIANS[0]);

// 가족 구성원 — 관제 센터 공간은 그 센터에 가입 · 승인된 보호자 (예시 김민수 · 김지영 · 김현우를 보이지 않는다)
export const familyOf = (me) =>
  inCenter() ? people().guardians.map((name, i) => ({ name, relation: name === me.name ? "나" : "보호자", isPrimary: i === 0 })) : GUARDIANS;

// 이름에서 성을 뺀 두 글자 — 얼굴 동그라미
export const shortName = (name = "") => (name.length >= 3 ? name.slice(1, 3) : name);
