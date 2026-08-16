// 양방향 "해주세요" 업무형 요청 시스템 — REQ-03
// 상태 8종(회의 확정)과 허용 전이. 상태 전이는 이 모듈만 경유한다.

export const STATUS = {
  requested: { label: "요청됨", fg: "#0A1F3C", bg: "rgba(10,31,60,.08)" },
  confirmed: { label: "확인됨", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)" },
  awaitingPayment: { label: "결제대기", fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  inProgress: { label: "처리중", fg: "#B08D57", bg: "rgba(176,141,87,.16)" },
  done: { label: "완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" },
  cancelled: { label: "취소", fg: "#5C5A54", bg: "rgba(92,90,84,.12)" },
  rejected: { label: "처리불가", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  needsAdmin: { label: "관리자 확인필요", fg: "#C0392B", bg: "rgba(192,57,43,.14)" },
};

const TRANSITIONS = {
  requested: ["confirmed", "cancelled", "rejected", "needsAdmin"],
  confirmed: ["awaitingPayment", "inProgress", "cancelled", "rejected", "needsAdmin"],
  awaitingPayment: ["inProgress", "cancelled", "needsAdmin"],
  inProgress: ["done", "rejected", "needsAdmin"],
  done: [],
  cancelled: [],
  rejected: [],
  needsAdmin: ["confirmed", "inProgress", "rejected"],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function transition(req, to, note) {
  if (!canTransition(req.status, to)) return req;
  return {
    ...req,
    status: to,
    history: [...req.history, { at: Date.now(), status: to, note: note || "" }],
  };
}

// ── 보호자 '해주세요' 서비스 메뉴 — kcare팀 실무자 피드백 (2026-08-09 엑셀) ──
//
// no1~6 활성 · no7~11 은 "추후 서비스 개시"로 표기만 하고 비활성.
// 실무자 요청 그대로: 고객이 "이런 서비스도 앞으로 이용할 수 있구나"라고
// 인식하게 하고, "혹시 이런 서비스가 필요하신가요?"로 수요를 파악한다.
// 단가는 시트의 값 그대로 — 임의로 바꾸지 않는다.
export const SERVICE_MENU = [
  {
    no: 1,
    name: "협력 병원 예약 대행",
    priceLabel: "무료",
    amount: 0,
    cat: "의료 지원",
    scope: "요청한 의료기관 병원 예약 · 일정 관리 (보호자 가족 포함)",
    point: "병원 선정 · 비급여 진료비의 정보 비대칭을 줄입니다",
    active: true,
  },
  {
    no: 2,
    name: "병원 동행 프리미엄 (2인 1조)",
    priceLabel: "기본 2시간 · 시간당 45,000원 (VAT 별도) · 추가 30분 10,000원",
    amount: 90000, // 기본 2시간 기준
    cat: "의료 지원",
    scope: "자택 픽업 · 드랍, 차량 지원, 기본 2시간 이후 30분 단위 연장",
    point: "동행 상세 리포트 제공",
    active: true,
  },
  {
    no: 3,
    name: "병원 동행 베이직 (1인)",
    priceLabel: "시간당 15,000원 · 추가 30분 8,000원",
    amount: 15000,
    cat: "의료 지원",
    scope: "지정한 의료기관에서 만나 접수 · 진료 · 수납 동행",
    point: "동행 상세 리포트 제공",
    active: true,
  },
  {
    no: 4,
    name: "요양병원 안심케어 (1인)",
    priceLabel: "1회 1시간 60,000원 (병원 위치 · 지역별 차등)",
    amount: 60000,
    cat: "의료 지원",
    scope: "요양병원 맞춤 21항목 안심 체크리스트 확인",
    point: "사진 포함 안심 리포트 · 자녀 동영상 메시지 전달",
    active: true,
  },
  {
    no: 5,
    name: "자택 안심케어 추가 방문",
    priceLabel: "1회 1시간 60,000원",
    amount: 60000,
    cat: "생활 지원",
    scope: "월 1회 포함분 외 추가 21항목 안심방문",
    point: "사진 포함 안심 리포트 · 자녀 동영상 메시지 전달",
    active: true,
  },
  {
    no: 6,
    name: "생활 대행",
    priceLabel: "시간당 30,000원 · 기본 1시간 최대 2시간 · 추가 30분 10,000원",
    amount: 30000,
    cat: "생활 지원",
    scope: "관공서 · 은행 · 장보기 · 산책 · 말벗",
    point: null,
    active: true,
  },
  { no: 7, name: "청소 서비스", cat: "주거 관리", scope: "매트리스 · 냉장고 정리 · 에어컨 청소", active: false },
  { no: 8, name: "주거 관리 서비스", cat: "주거 관리", scope: "전등 · 문고리 교체 등 간단 집수리", active: false },
  { no: 9, name: "복지 혜택 확인", cat: "행정 지원", scope: "정부 지원금 · 혜택 알림", active: false },
  { no: 10, name: "요양보호사 연결", cat: "돌봄 지원", scope: "주변 재가센터 연결", active: false },
  { no: 11, name: "방문 간호 연결", cat: "의료 지원", scope: "주변 재가센터 연결", active: false },
  {
    no: 12,
    name: "응급 상황 대응",
    priceLabel: "주간 · 야간 차등 (요금 확정 전)",
    amount: null,
    cat: "응급 관리",
    scope: "응급 상황 시 보호자 대신 병원 동행",
    point: "24시간 접수와 연결됩니다",
    active: true,
  },
];

// 요청 유형 프리셋 (회의 예시 그대로)
export const GUARDIAN_PRESETS = [
  "약 구매해 주세요",
  "병원 예약 확인해 주세요",
  "집 상태 확인해 주세요",
  "물품 전달해 주세요",
  "다음 방문 때 확인해 주세요",
];

export const CONCIERGE_PRESETS = [
  "결제가 필요합니다",
  "약이 부족합니다",
  "병원 예약 확인이 필요합니다",
  "추가 동행이 필요합니다",
  "집안 안전조치가 필요합니다",
];

export const URGENCY = {
  normal: { label: "보통", fg: "#5C5A54", bg: "rgba(92,90,84,.1)" },
  urgent: { label: "긴급", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
};
