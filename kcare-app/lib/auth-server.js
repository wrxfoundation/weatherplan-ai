// 구글 로그인 — 서버 쪽 판단 (API 라우트 · 미들웨어 공용). 여기에는 Node 전용 모듈을 쓰지 않는다
// (미들웨어는 엣지에서 돈다).
//
// 필요한 환경변수 (배포 환경에만 넣는다 · 코드·git 에 적지 않는다):
//   GOOGLE_CLIENT_ID      Google Cloud 콘솔 > Google Auth Platform > Clients 에서 만든 웹 클라이언트 ID
//   GOOGLE_CLIENT_SECRET  같은 클라이언트의 보안 비밀
//   NEXTAUTH_SECRET       세션 서명용 임의 문자열 (openssl rand -base64 32)
//   NEXTAUTH_URL          운영 주소 (예: https://kcare-beta.vercel.app) — 구글 리디렉션 주소의 기준
// 선택:
//   BETA_REQUIRE_LOGIN    "1" 이면 로그인해야 화면이 열린다 (공개 화면 제외 · middleware.js)
//   BETA_ALLOWED_EMAILS   로그인 허용 이메일 목록 (쉼표 구분). 비우면 제한 없음
//   BETA_ALLOWED_DOMAINS  로그인 허용 도메인 목록 (예: kcare.co.kr). 비우면 제한 없음

export const authConfigured = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET);

const list = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

// 허용 계정 — 목록이 둘 다 비어 있으면 누구나 (Google 콘솔이 '테스트' 단계면 거기 등록한
// 테스트 사용자만 로그인할 수 있으므로 1차 관문은 이미 구글 쪽에 있다).
export function isAllowedEmail(email) {
  const emails = list(process.env.BETA_ALLOWED_EMAILS);
  const domains = list(process.env.BETA_ALLOWED_DOMAINS);
  if (emails.length === 0 && domains.length === 0) return true;
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  return emails.includes(e) || domains.some((d) => e.endsWith(`@${d}`));
}

export const betaGateOn = () => process.env.BETA_REQUIRE_LOGIN === "1" && authConfigured();

// 로그인 없이 열리는 화면 — 로그인 화면 자체 · 인증 콜백 · 대외 서비스 소개 · 결제(토스 심사·결제창 복귀)
export const PUBLIC_PATHS = [/^\/login(\/|$)/, /^\/api\/auth(\/|$)/, /^\/service(\/|$)/, /^\/pay(\/|$)/, /^\/api\/payments(\/|$)/];
export const isPublicPath = (pathname) => PUBLIC_PATHS.some((r) => r.test(pathname));
