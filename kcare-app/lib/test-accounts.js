// 테스트 계정 — 베타에서 실제 저장(Supabase)을 확인하는 계정 세 개 (2026-09-30 결정).
//
// 셋이 한 가구(테스트 가구 1)를 함께 쓴다. 보호자 폰에서 해주세요를 보내면 어르신·컨시어지 폰에
// 뜨고, 어르신이 SOS 를 누르면 보호자 폰에 뜬다 — 서버를 거쳐서.
// 로그인하지 않으면 지금까지처럼 데모(시뮬레이션)로 돌고 이 브라우저에만 저장된다.
//
// 계정을 바꾸거나 늘릴 때는 이 목록만 고친다. 비밀번호는 여기 두지 않는다 —
// 배포 환경변수 BETA_TEST_PASSWORD 하나를 세 계정이 같이 쓴다.
// 이메일은 구글 로그인 시뮬레이션에 쓰는 가짜 주소다 (.test 는 실제로 쓰이지 않는 예약 도메인).

export const TEST_HOUSEHOLDS = {
  "HH-TEST-01": { id: "HH-TEST-01", name: "테스트 가구 1" },
};

export const TEST_ACCOUNTS = [
  { id: "test-guardian", name: "테스트 보호자", role: "guardian", email: "guardian@kcare.test", household: "HH-TEST-01" },
  { id: "test-elder", name: "테스트 어르신", role: "elder", email: "elder@kcare.test", household: "HH-TEST-01" },
  { id: "test-concierge", name: "테스트 컨시어지", role: "concierge", email: "concierge@kcare.test", household: "HH-TEST-01" },
];

export const ROLE_LABEL = { guardian: "보호자", elder: "어르신", concierge: "컨시어지" };
export const ROLE_HOME = { guardian: "/family", elder: "/elder", concierge: "/concierge" };

// 아이디나 이메일 어느 쪽으로 적어도 찾는다 (대소문자·앞뒤 공백 무시)
export function findTestAccount(idOrEmail) {
  const v = String(idOrEmail || "").trim().toLowerCase();
  if (!v) return null;
  return TEST_ACCOUNTS.find((a) => a.id === v || a.email === v) || null;
}

export const householdName = (id) => TEST_HOUSEHOLDS[id]?.name || id || "";
