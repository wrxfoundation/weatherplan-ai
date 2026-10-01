// 테스트 계정 — 베타에서 실제 저장(Supabase)을 확인하는 계정 (2026-09-30 세 개로 시작,
// 2026-10-01 관제 · 영업자 추가 — "관제랑 영업자는 테스트가 없다"는 현장 의견).
//
// 모두 한 가구(테스트 가구 1)를 함께 쓴다. 보호자 폰에서 해주세요를 보내면 어르신·컨시어지·관제
// 화면에 뜨고, 어르신이 SOS 를 누르면 보호자 폰과 관제 화면에 뜬다 — 서버를 거쳐서.
// 영업자는 실제로는 고객 가구 밖의 사람이지만, 베타에서는 같은 가구에 넣어 둔다 — 보호자 계정이
// 영업자 추천 코드로 가입 상담을 끝내면 그 신청이 영업자 화면에 '새 신청'으로 뜨게 (lib/sales.js liveLead).
// 로그인하지 않으면 지금까지처럼 데모(시뮬레이션)로 돌고 이 브라우저에만 저장된다.
//
// 계정을 바꾸거나 늘릴 때는 이 목록만 고친다. 비밀번호는 여기 두지 않는다 —
// 배포 환경변수 BETA_TEST_PASSWORD 하나를 모든 테스트 계정이 같이 쓴다.
// 이메일은 구글 로그인 시뮬레이션에 쓰는 가짜 주소다 (.test 는 실제로 쓰이지 않는 예약 도메인).

export const TEST_HOUSEHOLDS = {
  "HH-TEST-01": { id: "HH-TEST-01", name: "테스트 가구 1" },
};

export const TEST_ACCOUNTS = [
  { id: "test-guardian", name: "테스트 보호자", role: "guardian", email: "guardian@kcare.test", household: "HH-TEST-01" },
  { id: "test-elder", name: "테스트 어르신", role: "elder", email: "elder@kcare.test", household: "HH-TEST-01" },
  { id: "test-concierge", name: "테스트 컨시어지", role: "concierge", email: "concierge@kcare.test", household: "HH-TEST-01" },
  { id: "test-ops", name: "테스트 관제", role: "ops", email: "ops@kcare.test", household: "HH-TEST-01" },
  { id: "test-sales", name: "테스트 영업자", role: "sales", email: "sales@kcare.test", household: "HH-TEST-01" },
];

export const ROLE_LABEL = { guardian: "보호자", elder: "어르신", concierge: "컨시어지", ops: "관제", sales: "영업자" };
export const ROLE_HOME = { guardian: "/family", elder: "/elder", concierge: "/concierge", ops: "/dispatch", sales: "/sales" };

// 아이디나 이메일 어느 쪽으로 적어도 찾는다 (대소문자·앞뒤 공백 무시)
export function findTestAccount(idOrEmail) {
  const v = String(idOrEmail || "").trim().toLowerCase();
  if (!v) return null;
  return TEST_ACCOUNTS.find((a) => a.id === v || a.email === v) || null;
}

export const householdName = (id) => TEST_HOUSEHOLDS[id]?.name || id || "";
