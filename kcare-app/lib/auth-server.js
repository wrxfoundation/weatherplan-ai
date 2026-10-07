// 로그인 — 서버 쪽 판단 (API 라우트 · 미들웨어 공용). 여기에는 Node 전용 모듈을 쓰지 않는다
// (미들웨어는 엣지에서 돈다).
//
// 로그인은 두 갈래다. 둘 다 NEXTAUTH_SECRET(세션 서명)이 있어야 켜진다.
//   테스트 계정  BETA_TEST_PASSWORD 를 넣으면 켜진다 — 계정 목록은 lib/test-accounts.js
//   구글        GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET 를 넣으면 켜진다 (NEXTAUTH_URL 도 넣는다)
// 구글이 꺼져 있으면 'Google 계정으로 계속하기'는 테스트 계정으로 흉내 내는 시뮬레이션이 된다.
//
// 필요한 환경변수 (배포 환경에만 넣는다 · 코드·git 에 적지 않는다):
//   NEXTAUTH_SECRET       세션 서명용 임의 문자열 (openssl rand -base64 32)
//   BETA_TEST_PASSWORD    테스트 계정이 모두 같이 쓰는 비밀번호 (12자 이상 권장)
//   GOOGLE_CLIENT_ID      Google Cloud 콘솔 > Google Auth Platform > Clients 에서 만든 웹 클라이언트 ID
//   GOOGLE_CLIENT_SECRET  같은 클라이언트의 보안 비밀
//   NEXTAUTH_URL          운영 주소 (예: https://kcare-beta.vercel.app) — 구글 리디렉션 주소의 기준
// 선택:
//   BETA_REQUIRE_LOGIN    "1" 이면 로그인해야 화면이 열린다 (공개 화면 제외 · middleware.js)
//   BETA_ALLOWED_EMAILS   구글 로그인 허용 이메일 목록 (쉼표 구분). 비우면 제한 없음
//   BETA_ALLOWED_DOMAINS  구글 로그인 허용 도메인 목록 (예: kcare.co.kr). 비우면 제한 없음

export const sessionConfigured = () => !!process.env.NEXTAUTH_SECRET;
export const googleConfigured = () =>
  sessionConfigured() && !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const testLoginConfigured = () => sessionConfigured() && !!process.env.BETA_TEST_PASSWORD;
// 회원 가입 · 로그인 (2026-10-06) — 회원 표가 서버 저장(Supabase)에 있으므로 그 연결까지 있어야 켜진다
export const memberLoginConfigured = () =>
  sessionConfigured() &&
  !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
export const authConfigured = () => googleConfigured() || testLoginConfigured() || memberLoginConfigured();
// 관제 센터 관리자(ops1 · ops2 · ops3) 비밀번호 — 테스터 공용 비밀번호(BETA_TEST_PASSWORD)와 따로 둔다 (2026-10-06 점검:
// 공용 비밀번호를 아는 테스터 누구나 모든 센터의 관리자가 될 수 있었다). 센터마다 CENTER_OPS_PASSWORD_C1 … 로 따로 줄 수 있고,
// 없으면 CENTER_OPS_PASSWORD 하나를 세 센터가 같이 쓴다. 둘 다 없으면 센터 관리자 로그인은 꺼진다.
export const centerOpsPassword = (centerId) => process.env[`CENTER_OPS_PASSWORD_${centerId}`] || process.env.CENTER_OPS_PASSWORD || "";
export const centerOpsConfigured = () => ["C1", "C2", "C3"].some((c) => !!centerOpsPassword(c));

// 비밀번호 비교 — 길이·내용과 상관없이 같은 시간이 걸리게 끝까지 본다
export function testPasswordMatches(input) {
  const want = String(process.env.BETA_TEST_PASSWORD || "");
  const got = String(input || "");
  if (!want) return false;
  let diff = want.length ^ got.length;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ (i < got.length ? got.charCodeAt(i) : 0);
  return diff === 0;
}

const list = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

// 구글 허용 계정 — 목록이 둘 다 비어 있으면 누구나 (Google 콘솔이 '테스트' 단계면 거기 등록한
// 테스트 사용자만 로그인할 수 있으므로 1차 관문은 이미 구글 쪽에 있다).
export function isAllowedEmail(email) {
  const emails = list(process.env.BETA_ALLOWED_EMAILS);
  const domains = list(process.env.BETA_ALLOWED_DOMAINS);
  if (emails.length === 0 && domains.length === 0) return true;
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  return emails.includes(e) || domains.some((d) => e.endsWith(`@${d}`));
}

// 세션 토큰이 베타에 들어올 수 있는지 — 테스트 계정은 비밀번호를 통과했으니 허용,
// 구글 계정은 허용 목록을 본다
export function isAllowedToken(token) {
  if (!token) return false;
  if (["test", "google-sim", "member", "center"].includes(token.provider)) return true;
  return isAllowedEmail(token.email);
}

export const betaGateOn = () => process.env.BETA_REQUIRE_LOGIN === "1" && authConfigured();

// 로그인 없이 열리는 화면 — 로그인 화면 자체(구글 시뮬레이션 포함) · 인증 콜백 · 설정 상태 ·
// 대외 서비스 소개 · 결제(토스 심사·결제창 복귀) · 회원 가입과 영역별 로그인 입구(2026-10-06)
export const PUBLIC_PATHS = [
  /^\/login(\/|$)/,
  /^\/join(\/|$)/,
  /^\/partner\/(join|login)$/,
  /^\/ops\/(join|login)$/,
  /^\/api\/join$/,
  /^\/api\/auth(\/|$)/,
  /^\/api\/status$/,
  /^\/service(\/|$)/,
  /^\/pay(\/|$)/,
  /^\/api\/payments(\/|$)/,
];
export const isPublicPath = (pathname) => PUBLIC_PATHS.some((r) => r.test(pathname));
