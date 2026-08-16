// 앱 상태 시드 — lib/state.js 가 쓰는 초기값만 모은 모듈.
//
// mock.js 에서 분리한 이유: state.js 는 _app.jsx 에서 import 되므로,
// state 가 mock.js 를 참조하면 3,000줄짜리 콘솔 목데이터 전체가 공용 청크에 실려
// 랜딩·어르신 앱까지 따라온다. 어르신 앱은 가장 낮은 사양에서 도는 화면이라
// 경영 콘솔 데이터를 짊어질 이유가 없다.
//
// mock.js 는 하위 호환을 위해 이 모듈을 그대로 re-export 한다.

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
    title: "순환기내과 진료 · 서울아산병원",
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

// K-CARE 안심케어박스 초기 재고 — REQ-10
// isMedicine=true 품목은 고객 요청 구매분 보관 또는 고객 소유 수량 확인만 (의료법 27조 경계)
export const INITIAL_KIT = [
  { name: "체온계", qty: 1, unit: "개", expiry: null, opened: false, isMedicine: false, low: false },
  { name: "밴드", qty: 4, unit: "매", expiry: "2027-03", opened: true, isMedicine: false, low: true },
  { name: "거즈·소독용품", qty: 2, unit: "세트", expiry: "2027-01", opened: false, isMedicine: false, low: false },
  { name: "마스크 (KF94)", qty: 6, unit: "매", expiry: null, opened: true, isMedicine: false, low: false },
  { name: "손소독제", qty: 1, unit: "병", expiry: "2026-11", opened: true, isMedicine: false, low: false },
  { name: "냉찜질팩", qty: 1, unit: "개", expiry: null, opened: false, isMedicine: false, low: false },
  { name: "비상연락카드 · 복약체크표", qty: 1, unit: "세트", expiry: null, opened: false, isMedicine: false, low: false },
  { name: "해열제 (고객 소유)", qty: 3, unit: "정", expiry: "2026-09", opened: true, isMedicine: true, low: true },
  { name: "파스 (고객 소유)", qty: 1, unit: "매", expiry: "2026-12", opened: true, isMedicine: true, low: true },
];

// 실시간 접수 티커 초기값 — 이후 이벤트는 전 화면 액션이 state.events로 push
export const SEED_EVENTS = [
  { kind: "리포트", text: "오태식 (77) 케어 리포트 검수 확정 · 가족 앱 전달", color: "#8FA9CC", minAgo: 8 },
  { kind: "체크인", text: "박지현 · 오태식 (77) 동행 완료 처리", color: "#4ADE80", minAgo: 21 },
  { kind: "배차", text: "AI 배정안 3건 준비 · 승인 대기", color: "#B08D57", minAgo: 34 },
  { kind: "보험", text: "실손 청구 접수 C-260726-118", color: "#8FA9CC", minAgo: 52 },
];

// 리포트 누적 시드 — 본인 작성은 전체, 타인 작성은 공유분만 (회의 7)
export const SEED_REPORTS = [
  {
    id: "rp1",
    by: "박지현",
    daysAgo: 30,
    flagged: 1,
    note: "거실 정리 상태 양호. \"요즘 입맛이 없다\"고 두 번 말씀하심.",
    secretNote: "다음 방문 시 식사량 재확인",
    shared: true,
  },
  {
    id: "rp2",
    by: "서다인",
    daysAgo: 60,
    flagged: 0,
    note: "특이 관찰 없음. 환기 양호.",
    secretNote: "",
    shared: true,
  },
];

// 스토어 구매내역 시드 — 보호자 스토어 '구매내역 조회' (2026-08-12 시트).
// 약국 품목은 우리가 파는 게 아니라 구매대행이므로 영수증 번호를 함께 남긴다.
export const SEED_ORDERS = [
  {
    id: "od-2026-0731",
    daysAgo: 16,
    by: "김민수",
    channel: "보호자 스토어",
    items: [
      { id: "pa1", name: "안티푸라민 쿨파워 10매 ×4", qty: 1, price: 9500 },
      { id: "dr2", name: "박카스 디 (10병)", qty: 2, price: 5700 },
    ],
    ship: 3000,
    status: "delivered",
    receipt: "대치온누리약국 · 영수증 #A-7731",
    note: "8/1 안심방문 때 함께 전달",
  },
  {
    id: "od-2026-0808",
    daysAgo: 8,
    by: "김민수",
    channel: "안전진단 자동 담기",
    items: [
      { id: "mat", name: "논슬립 욕실 미끄럼 방지 매트 (2.3m)", qty: 1, price: 80000 },
      { id: "sensorLight", name: "동작 인식 LED 센서등 (1m)", qty: 2, price: 20000 },
    ],
    ship: 3500,
    status: "delivered",
    receipt: null,
    note: "첫 방문 안전진단 '아니오' 항목에서 자동으로 담긴 용품",
  },
  {
    id: "od-2026-0814",
    daysAgo: 2,
    by: "김지영",
    channel: "보호자 스토어",
    items: [{ id: "vt2", name: "비타민씨 골드", qty: 1, price: 11000 }],
    ship: 3000,
    status: "shipping",
    receipt: null,
    note: "",
  },
];
