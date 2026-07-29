// 목 데이터 — 프로토타입 페르소나(김순자 가구) 재사용.
// 미연동 지표는 임의 생성하지 않고 "연동 대기"로 표기한다 (PRD 정직성 원칙).

export const ELDER = {
  name: "김순자",
  age: 78,
  district: "강남구",
  dong: "대치동",
};

export const GUARDIANS = [
  { name: "김민수", relation: "아들 · 주 보호자", residence: "서울", isPrimary: true, share: "40%" },
  { name: "김지영", relation: "차녀", residence: "LA (PST)", isPrimary: false, share: "30%" },
  { name: "김현우", relation: "삼남", residence: "시드니 (AEST)", isPrimary: false, share: "30%" },
];

export const CONCIERGES = [
  { name: "박지현", role: "주 동행 · 간호사 출신" },
  { name: "서다인", role: "부 동행" },
];

// 공유 캘린더 일정 9종 kind — REQ-02
export const EVENT_KINDS = {
  hospital: { label: "병원 예약", color: "#C0392B" },
  medication: { label: "복약 알림", color: "#3B5C8A" },
  visit: { label: "컨시어지 방문", color: "#B08D57" },
  kit: { label: "약상자 교체", color: "#8A5D12" },
  checkup: { label: "건강검진", color: "#1E7A5A" },
  family: { label: "보호자 방문", color: "#0A1F3C" },
  delivery: { label: "상품 배송", color: "#5C5A54" },
  request: { label: "추가 요청사항", color: "#7A4C8A" },
  nextAppt: { label: "다음 진료 예정일", color: "#C0392B" },
};

function daysFromNow(d, h = 10, m = 0) {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(h, m, 0, 0);
  return t.getTime();
}

export const INITIAL_EVENTS = [
  {
    id: "ev1",
    kind: "hospital",
    title: "내과 진료 · 강남세브란스",
    at: daysFromNow(7, 10, 0),
    source: "컨시어지 등록",
    note: "박지현 선생님 동행 · 픽업 09:10",
  },
  {
    id: "ev2",
    kind: "visit",
    title: "K-CARE 안심방문 (월 1회)",
    at: daysFromNow(3, 14, 0),
    source: "관제 배정",
    note: "박지현 · 서다인 2인 방문",
  },
  {
    id: "ev3",
    kind: "kit",
    title: "안심케어박스 점검·교체",
    at: daysFromNow(3, 14, 30),
    source: "관제 배정",
    note: "안심방문과 동시 진행",
  },
  {
    id: "ev4",
    kind: "medication",
    title: "아침 혈압약",
    at: daysFromNow(1, 8, 0),
    source: "보호자 등록",
    note: "매일 반복",
  },
  {
    id: "ev5",
    kind: "delivery",
    title: "생수 · 생활물품 배송",
    at: daysFromNow(5, 11, 0),
    source: "스토어 주문",
    note: "",
  },
  {
    id: "ev6",
    kind: "nextAppt",
    title: "정형외과 재진 예정",
    at: daysFromNow(21, 9, 30),
    source: "컨시어지 등록",
    note: "병원에서 예약 확정 후 자동 공유됨",
  },
];

// 해주세요 초기 데이터 — 컨시어지→보호자 요청 1건(결제대기 데모), 완료 1건
export const INITIAL_REQUESTS = [
  {
    id: "rq1",
    dir: "fromConcierge",
    type: "약이 부족합니다",
    detail: "해열제와 파스 잔여량이 적습니다. 다음 안심방문 전에 약국 구매대행이 필요합니다.",
    amount: 18000,
    preferredDate: null,
    urgency: "normal",
    assignee: "박지현",
    photos: ["kit-2026-07-visit.jpg"],
    status: "awaitingPayment",
    history: [
      { at: Date.now() - 86400000 * 2, status: "requested", note: "안심방문 중 잔여량 확인" },
      { at: Date.now() - 86400000 * 2 + 3600000, status: "confirmed", note: "" },
      { at: Date.now() - 86400000, status: "awaitingPayment", note: "예상 금액 18,000원" },
    ],
    proof: null,
  },
  {
    id: "rq2",
    dir: "fromGuardian",
    type: "집 상태 확인해 주세요",
    detail: "장마철이라 곰팡이·환기 상태를 봐주세요.",
    amount: null,
    preferredDate: null,
    urgency: "normal",
    assignee: "박지현",
    photos: [],
    status: "done",
    history: [
      { at: Date.now() - 86400000 * 9, status: "requested", note: "" },
      { at: Date.now() - 86400000 * 8, status: "confirmed", note: "" },
      { at: Date.now() - 86400000 * 5, status: "inProgress", note: "방문 일정에 반영" },
      { at: Date.now() - 86400000 * 4, status: "done", note: "거실·주방 환기 완료, 사진 첨부" },
    ],
    proof: "visit-2026-07-21-livingroom.jpg",
  },
];

// 주간 요약 (프로토타입 목 수치 재사용) — 웨어러블 실연동 대기 표기 필수
export const WEEKLY = [
  { name: "수면", value: "6.4h", delta: "+0.3", last: "지난주 6.1" },
  { name: "활동", value: "3,820", delta: "+12%", last: "지난주 3,410" },
  { name: "복약", value: "19/21", delta: "+2", last: "지난주 17/21" },
];

export const OUTING = {
  legs: [
    { tag: "출발", place: "대치동 자택", score: 78 },
    { tag: "도착", place: "강남세브란스", score: 71 },
  ],
  factors: [
    { name: "기온", value: "31°" },
    { name: "미세먼지", value: "보통" },
    { name: "자외선", value: "높음" },
  ],
  advice: "오후 2~4시 외출은 피하고, 양산과 물을 준비하세요.",
  kit: ["양산", "생수", "KF94"],
};
