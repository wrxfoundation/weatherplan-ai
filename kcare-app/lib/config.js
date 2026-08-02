// 가격·상품 설정값 — PRD 11.3 지침: 모든 단가는 코드가 아니라 설정으로 관리한다.
// 확정 출처: 2026-08-01 방향성 회의 (진입비 + 월 구독 구조로 확정)

export const PRICING = {
  // 일시금 패키지(50~60만) 안을 접고 진입비 + 월 구독으로 확정.
  // 이유: 영업 현장에서 50만원 일시금은 저항이 크고, "부모님께 월 77,000원"은 거부감이 없다.
  entryFee: { amount: 250000, vat: 25000, total: 275000, confirmed: true }, // 진입비 (부가세 별도)
  subscription: { monthly: 77000, term: 12, confirmed: true }, // 월 구독료 · 최소 약정 12개월
  paymentLimitDefault: 50000, // 권장 기본값: 5만원 이하 사용자 직접 결제

  // 유통 경로별 수당 — 회사 실입금이 갈린다
  channel: {
    ddm: { commission: 0.6, note: "대리점망 경유 — 수당 60% · 회사 40%" },
    direct: { commission: 0.35, note: "직판 — 구독 · 매칭 보너스 포함 35%" },
  },

  // 서비스 1회 원가 (회의에서 실측치로 제시된 값)
  unitCost: { homeVisit: 65000, escort: 110000, watch: 70000, careBox: 30000 },
};

// 기본 제공 구성 — 2026-08-01 회의 확정.
// 최초 1회 방문에서 전달·설치하는 것과 구독 기간 중 제공하는 것을 분리한다. 나머지는 전부 옵션.
export const BASE_BENEFITS = [
  { name: "갤럭시 Fit3", note: "최초 1회 지급 · 낙상 감지 · 활동 · 수면", when: "최초" },
  { name: "K-CARE 케어박스", note: "가정용 상비약 · 방문 시 보충", when: "최초" },
  { name: "건강 · 집안 상태 21항목 점검", note: "최초 방문 실시 · 리포트 발송", when: "최초" },
  { name: "앱 설치 · 사용 안내", note: "어르신 · 보호자 계정 연결", when: "최초" },
  { name: "안심방문 (가정방문)", note: "월 1회 포함 · 추가는 옵션", when: "매월" },
  { name: "컨시어지 병원 동행", note: "연 1회 포함 · 2인 1조 · 추가는 옵션", when: "연간" },
  { name: "보호자 알림 · 공유 캘린더", note: "어르신 · 보호자 · 컨시어지 공동", when: "상시" },
  { name: "월간 케어리포트", note: "가족 앱으로 발송", when: "매월" },
  { name: "긴급신호 접수 · 119 연계", note: "24시간 관제 · 보호자 역할 대행 포함", when: "상시" },
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

// AI 설정 — 기본 모델은 Claude Sonnet (서버 내부 값).
// 외부(사용자 노출) 명칭은 항상 "AI"로 통일한다 — 모델·제공사 이름을 UI·응답에 노출하지 않는다.
export const AI_CONFIG = {
  model: "claude-sonnet-5", // 기본. 복잡 질의 라우팅이 필요해지면 여기서 분기
  publicLabel: "AI", // 외부 표기 통일
  // maxTokens는 "사고 + 응답"을 합쳐서 자르는 상한이다.
  // 이 모델은 thinking을 명시하지 않으면 적응형 사고가 켜지므로,
  // 600으로 두면 사고가 예산을 먹고 답변이 중간에 잘린다.
  // 답변은 3~5문장이라 사고가 필요 없고, 끄는 편이 체감 속도에도 낫다 (api/ai.js 참고).
  maxTokens: 900,
};

export const fmtWon = (n) =>
  n == null ? "별도 산정" : `${new Intl.NumberFormat("ko-KR").format(n)}원`;
