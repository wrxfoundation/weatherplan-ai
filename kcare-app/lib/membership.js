// 보호자 마이 · 멤버십 · 가족 화면이 같이 쓰는 값 (2026-10-15 디자인 시안으로 마이가 여러 화면으로 나뉘면서 한 곳에 모았다).
import { GUARDIANS } from "./mock";
import { HOUSEHOLD, PRICING, fmtWon } from "./config";
import { inCenter, people } from "./people";

// 월 구독료 표기 — 가입 때 고른 가구 구성(한 분 / 부부)에 따라 갈린다. 2급지는 확정 전.
export const monthlyLabel = (ob) =>
  ob?.tier === 2 ? "별도 산정" : ob?.household === "couple" ? `${fmtWon(HOUSEHOLD.monthly)} · 부부 가구` : fmtWon(PRICING.subscription.monthly);

// 결제권한 한 줄
export function payLabel(ob, honor) {
  if (!ob || ob.paymentMode === "limit") return `하루 ${fmtWon(ob?.limitAmount ?? PRICING.paymentLimitDefault)}까지 ${honor} 직접 결제`;
  return { both: "양쪽 모두 결제", guardianOnly: "보호자만 결제", elderOnly: `${honor}만 결제` }[ob.paymentMode];
}

// 화면 주인 — 데모는 주 보호자 페르소나(김민수). 테스트 계정은 로그인한 계정 이름 (예시 이름을 붙이지 않는다).
export const meOf = (user) => (user?.household ? { name: user.name || "보호자", isPrimary: true } : GUARDIANS.find((g) => g.isPrimary) || GUARDIANS[0]);

// 가족 구성원 — 관제 센터 공간은 그 센터에 가입 · 승인된 보호자 (예시 김민수 · 김지영 · 김현우를 보이지 않는다)
export const familyOf = (me) =>
  inCenter() ? people().guardians.map((name, i) => ({ name, relation: name === me.name ? "나" : "보호자", isPrimary: i === 0 })) : GUARDIANS;

// 이름에서 성을 뺀 두 글자 — 얼굴 동그라미
export const shortName = (name = "") => (name.length >= 3 ? name.slice(1, 3) : name);
