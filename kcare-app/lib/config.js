// 가격·상품 설정값 — PRD 11.3 지침: 모든 단가는 코드가 아니라 설정으로 관리한다.
// 확정 출처: docs/kcare/requirements-2026-07-meeting.md REQ-05 · REQ-15
// TODO(경영 확정): 가입비 120,000 vs 150,000 택일(§7-1), 2급지 요율(§7-2)

export const PRICING = {
  joinFee: { min: 120000, max: 150000, confirmed: false },
  subscription: {
    tier1: { monthly: 57000, confirmed: true },
    tier2: { monthly: null, confirmed: false }, // 별도 산정 — 상담 후 확정
  },
  paymentLimitDefault: 50000, // 권장 기본값: 5만원 이하 사용자 직접 결제
};

// 기본 제공 구성 — 회의 확정 10종 (REQ-05)
export const BASE_BENEFITS = [
  { name: "갤럭시 워치", note: "웨어러블 건강 모니터링 기기" },
  { name: "K-CARE 안심케어박스", note: "체온계·밴드·소독용품 등 케어키트 (명칭 확정 전)" },
  { name: "웨어러블 기반 건강정보 모니터링", note: "실연동 대기" },
  { name: "보호자 알림", note: "" },
  { name: "공유 캘린더", note: "보호자·어르신·컨시어지 공동" },
  { name: "월 1회 재택 케어방문 (연 12회)", note: "K-CARE 안심방문" },
  { name: "연 4회 병원동행 또는 픽업", note: "포함분 초과 시 건별 이용" },
  { name: "상비약·생활물품 구매지원", note: "구매대행 · 전달" },
  { name: "월간 케어리포트", note: "" },
  { name: "긴급신호 접수 · 119 신고지원", note: "24시간 관제" },
];

// 결제권한 4모드 — REQ-07 (가입 시 선택)
export const PAYMENT_MODES = [
  {
    key: "limit",
    label: "한도 기반 (권장)",
    desc: "일정 금액 이하는 어르신이 직접 결제하고, 초과분은 보호자가 승인합니다.",
    recommended: true,
  },
  {
    key: "both",
    label: "양쪽 모두 결제",
    desc: "어르신과 보호자 모두 금액 제한 없이 결제할 수 있습니다.",
  },
  {
    key: "guardianOnly",
    label: "보호자만 결제",
    desc: "모든 결제를 보호자가 승인·결제합니다.",
  },
  {
    key: "elderOnly",
    label: "어르신만 결제",
    desc: "어르신 본인이 모든 결제를 직접 합니다.",
  },
];

export const fmtWon = (n) =>
  n == null ? "별도 산정" : `${new Intl.NumberFormat("ko-KR").format(n)}원`;
