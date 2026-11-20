// 역할별 홈 — 로그인한 사람이 맨 처음 화면(/)으로 오면 보내는 곳.
// 미들웨어(엣지)와 화면이 같은 값을 쓰도록 의존성 없는 파일로 따로 둔다 (2026-11-06 랜딩 요청 1장).
// 경영 콘솔(/admin)은 관제 역할이 여는 화면이라 따로 홈이 없다 — 관제는 /dispatch 로 간다.
export const ROLE_HOME = { guardian: "/family", elder: "/elder", concierge: "/concierge", ops: "/dispatch", sales: "/sales" };
