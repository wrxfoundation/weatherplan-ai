// 주 · 부 보호자 — 결제 · 법적 동의 · 설정은 주 보호자만 (docs/kcare/guardian-invite-policy.md).
//
// 데모: 머리의 역할 배지를 눌러 바꾸는 시연 값(state.demo.guardianRole).
// 로그인한 가구: 계정으로 정한다 — 시연 배지가 가구 전체의 값을 바꿔 아무나 주 보호자가 되던 것을 막는다 (2026-10-19 점검 F-08).
//   센터 회원  그 센터 보호자 명단의 맨 앞(먼저 승인된 보호자)이 주 보호자 — 가족 화면의 '주 보호자' 표시와 같은 기준
//   테스트 계정 가구에 보호자 계정이 하나라 주 보호자
import { useAppState } from "./state";
import { useAuth } from "./auth";
import { familyOf, meOf } from "./membership";

export function useGuardianRole() {
  const { state } = useAppState();
  const user = useAuth().user;
  if (!user?.household) {
    const role = state.demo?.guardianRole === "secondary" ? "secondary" : "primary";
    return { role, isPrimary: role === "primary", demo: true };
  }
  if (user.provider === "member") {
    const me = meOf(user);
    const fam = familyOf(me);
    const primary = fam.length === 0 || fam[0]?.name === me.name;
    return { role: primary ? "primary" : "secondary", isPrimary: primary, demo: false };
  }
  return { role: "primary", isPrimary: true, demo: false };
}
