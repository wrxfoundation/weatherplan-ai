// 요금제 — 금액과 구성의 한 곳 (2026-11-06 랜딩 요청 4장 · 2026-11-10 앱 안쪽 반영).
// 서비스 소개(lib/landing.js) · 앱 안 멤버십 화면 · 관제 어르신 관리 · 약관/환불 정책(lib/policies.js)이 모두 여기를 읽는다.
// 금액이 바뀌면 FEE 숫자만 고친다 — 첫 달 금액 · 해지 비용 합계는 계산한다.
//
// 가구의 요금제는 가구 기록의 plan 칸에 둔다 ({ key: "basic" | "care", by, at }).
//   · 가입 상담에서 정한 요금제를 관제(센터 관리자)가 어르신 관리에서 지정한다 — 사유와 함께 수정이력에 남는다 (lib/state.js setPlan).
//   · 지정 전에는 금액을 지어내지 않는다 — 화면은 '요금제 확인 중'이라고 쓰고, 관제 '지금 처리할 일'에 뜬다.
//   · 로그인하지 않은 시연 화면만 전담 케어를 예시로 보여 준다 (planFor).
//   · 두 분이 함께 계신 경우의 요금은 정해진 금액이 없다 — '상담에서 안내'로 쓴다.

export const won = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`;

export const FEE = {
  basic: 12900, // 안심 기본 월 요금 (1년 약정)
  care: 55000, // 전담 케어 월 요금 (약정 없음)
  install: 35000, // 설치비 — 두 요금제 모두 설치하는 달에 한 번
  fit: 65000, // 갤럭시 핏 기기값 — 안심 기본 약정 중 해지
  sensorReturn: 35000, // 센서 회수비
  sensorLost: 75000, // 센서 3대 분실 · 미반납
};
export const EARLY_BASIC = FEE.fit + FEE.sensorReturn; // 안심 기본 약정 중 해지 — 100,000

export const PLANS = {
  basic: {
    key: "basic",
    name: "안심 기본",
    monthly: FEE.basic,
    first: FEE.basic + FEE.install, // 첫 달 결제 금액 — 47,900
    term: "1년 약정, 매년 갱신",
    items: ["모션 감지 센서 3대 대여", "갤럭시 핏 제공, K-CARE 앱", "24시간 무반응 관제", "움직임이 없으면 관제가 전화로 확인하고 보호자께 연락합니다"],
    not: "정기 방문, 전담 컨시어지, 현장 확인은 포함되지 않습니다.",
    // 해지할 때 드는 비용 — 앱 안 멤버십 화면용 (서비스 소개의 표와 같은 값)
    exit: [
      { when: "약정 중 해지", cost: won(EARLY_BASIC), note: `갤럭시 핏 기기값 ${won(FEE.fit)}, 센서 회수비 ${won(FEE.sensorReturn)}` },
      { when: "약정이 끝난 뒤 해지", cost: won(FEE.sensorReturn), note: "센서 회수비" },
    ],
  },
  care: {
    key: "care",
    name: "전담 케어",
    monthly: FEE.care,
    first: FEE.care + FEE.install, // 90,000
    term: "약정 없음",
    items: ["안심 기본의 모든 것", "전담 컨시어지 배정", "월 1회 정기 방문, 보호자 리포트", "복약 관리, 음성 사서함", "연락이 닿지 않으면 컨시어지가 찾아가 확인합니다"],
    not: null,
    exit: [{ when: "해지", cost: won(FEE.sensorReturn), note: "센서 회수비, 갤럭시 핏은 반납" }],
  },
};
export const PLAN_KEYS = Object.keys(PLANS);
export const isPlan = (k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(PLANS, k);

// 해지와 환불 표 — 서비스 소개 요금 구역 · 환불 정책 · 이용약관이 같은 줄을 쓴다.
// cells: 두 칸이면 [안심 기본, 전담 케어], 한 칸이면 두 요금제 공통. { b: 굵은 값, lines: 아래 줄들 }
export const EXIT_HEAD = ["구분", "안심 기본", "전담 케어"];
export const EXIT_BOTH = "두 요금제 공통";
export const EXIT_ROWS = [
  { k: "계약서를 받은 날부터 14일 안에 철회", cells: [{ b: "전액 환불", lines: ["기기 회수 비용은 회사가 부담합니다"] }] },
  {
    k: "약정 중 해지",
    cells: [
      { b: won(EARLY_BASIC), lines: [`갤럭시 핏 기기값 ${won(FEE.fit)}`, `센서 회수비 ${won(FEE.sensorReturn)}`] },
      { b: "약정 없음", lines: [] },
    ],
  },
  {
    k: "약정이 끝난 뒤 해지",
    cells: [
      { b: won(FEE.sensorReturn), lines: ["센서 회수비"] },
      { b: won(FEE.sensorReturn), lines: ["센서 회수비", "갤럭시 핏은 반납"] },
    ],
  },
  { k: "갤럭시 핏 분실, 파손", cells: [{ b: "고객 개별 구매", lines: [] }] },
  { k: "센서 3대 분실, 미반납", cells: [{ b: won(FEE.sensorLost), lines: [] }] },
];
export const EXIT_NOTE = "해지하면 다음 결제일부터 결제가 멈추고, 이미 결제한 회차는 다음 결제일 전날까지 이용하실 수 있습니다.";
// 표를 글 한 줄씩으로 — 좁은 화면의 약관 · AI 상담 답변 기준
export const exitLines = () =>
  EXIT_ROWS.map((r) =>
    r.cells.length === 1
      ? `${r.k}: ${[r.cells[0].b, ...r.cells[0].lines].join(", ")} (${EXIT_BOTH})`
      : `${r.k}: 안심 기본 ${[r.cells[0].b, ...r.cells[0].lines].join(", ")} / 전담 케어 ${[r.cells[1].b, ...r.cells[1].lines].join(", ")}`
  );

// 가구 기록에 적힌 요금제 — 지정 전이면 null
export const planOf = (state) => (isPlan(state?.plan?.key) ? PLANS[state.plan.key] : null);
// 화면용 — 로그인한 가구는 적힌 값 그대로(지정 전이면 null), 로그인 없는 시연 화면은 전담 케어 예시
export const planFor = (state, user) => planOf(state) || (user?.household ? null : PLANS.care);

export const PLAN_PENDING = "요금제 확인 중";
export const PLAN_PENDING_NOTE = "가입 상담에서 정한 요금제를 관제가 등록하면 여기에 보여요";
// 한 줄 표기 — "전담 케어 · 월 55,000원" / 두 분이면 금액 대신 상담 안내 / 지정 전이면 확인 중
export function planLine(plan, { couple = false } = {}) {
  if (!plan) return PLAN_PENDING;
  return couple ? `${plan.name} · 두 분 요금은 상담에서 안내` : `${plan.name} · 월 ${won(plan.monthly)}`;
}
// 금액만 — 큰 숫자 자리
export const planPrice = (plan, { couple = false } = {}) => (!plan ? PLAN_PENDING : couple ? "상담에서 안내" : won(plan.monthly));
