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

// 주간 요약 (프로토타입 목 수치 재사용) — 웨어러블 실연동 대기 표기 필수
export const WEEKLY = [
  { name: "수면", value: "6.4h", delta: "+0.3", last: "지난주 6.1" },
  { name: "활동", value: "3,820", delta: "+12%", last: "지난주 3,410" },
  { name: "복약", value: "19/21", delta: "+2", last: "지난주 17/21" },
];

// F8 외출 컨디션 — 서버 1회 계산 가정(핸드오프 06 §3.4). 어르신·가족·컨시어지가
// 같은 legs를 역할별로 다르게 표현한다. grade는 서버 확정값 — 클라이언트 재계산 금지.
// 도착지는 서울아산병원 — 일정(ev1)·관제 JOBS·브리핑과 단일 값.
export const OUTING = {
  legs: [
    {
      tag: "출발",
      place: "대치동 자택",
      score: 62,
      grade: "보통",
      level: "caution",
      detail: "13:50 · 체감 35° · 자외선 매우 높음 · 미세먼지 보통",
      compact: "체감 35° · UV 매우높음",
    },
    {
      tag: "도착",
      place: "서울아산병원",
      score: 52,
      grade: "주의",
      level: "danger",
      detail: "14:30 · 체감 36° · 자외선 매우 높음 · 미세먼지 나쁨 82",
      compact: "체감 36° · PM10 82",
    },
  ],
  advice: "오후 2~4시 외출은 피하고, 양산과 물을 준비하세요.", // 가족·컨시어지용 압축 표현
  adviceElder:
    "햇볕이 매우 강합니다. 밝은 색 긴팔과 챙 넓은 모자를 쓰시고, 병원 근처는 공기가 나쁘니 마스크를 끼세요.",
  kit: ["양산", "챙 넓은 모자", "KF94 마스크", "생수 500ml", "얇은 긴팔"],
  source: "100점 감점식 · 케이웨더 제공",
  asOf: "케이웨더 · 14:00 기준",
  // 보호자 카드 3열 요인 그리드 (디자인 콘솔)
  factors3: [
    { label: "실내 온도", value: "31° 주의", level: "caution" },
    { label: "실외 체감", value: "36°", level: "neutral" },
    { label: "미세먼지", value: "나쁨 82", level: "danger" },
  ],
  // 문장형 안내 — 이미 한 조치를 말한다 (어르신 안내 + 컨시어지 준비물 자동 반영)
  adviceGuardian:
    "병원 근처 미세먼지가 나쁨입니다. 어머니께 KF94 마스크와 양산을 안내했고, 컨시어지 준비물에도 자동 반영됐습니다.",
};

// ─── 어르신 화면 전용 뷰 데이터 — 핸드오프 06 §3 · §8 ─────────────────────────
// 내부 용어(주/부 동행)를 어르신 노출 카피로 번역한 값. 관제·컨시어지 화면은 CONCIERGES 사용.

export const ELDER_VISITORS = [
  {
    initials: "박지현",
    displayName: "박지현 선생님",
    relationLabel: "늘 오시던 분 · 오후 1시 50분", // 방문 횟수 기반 분기 (첫 방문 = "처음 오시는 분" + 사진)
    avBg: "#0A1F3C",
    avFg: "#FFFFFF",
    isPrimary: true,
  },
  {
    initials: "서다인",
    displayName: "서다인 선생님",
    relationLabel: "함께 오는 분 · 짐과 접수 담당",
    avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
    avFg: "#0A1F3C",
    isPrimary: false,
  },
];

// done: null → 상태(state.elder.medTaken) 의존. 미완료는 1건만 (실패 목록 금지 — 06 §3.6)
export const MED_DOSES = [
  { slotLabel: "아침", drugs: "혈압약 · 아스피린", done: true },
  { slotLabel: "점심", drugs: "당뇨약", done: true },
  { slotLabel: "저녁 7시", drugs: "혈압약 · 콜레스테롤약", done: null },
];

// 실내 센서 카드 — cooled 상태별 표현 (06 §3.7). 데모 목 값: 센서 실연동 전.
export const INDOOR = {
  hot: {
    tempLabel: "31°",
    sub: "습도 62% · 에어컨 꺼짐",
    level: "danger",
    alertTitle: "집 안이 너무 덥습니다",
    alertBody: "실외보다 2도 낮지만 온열질환 주의 구간입니다. 에어컨을 켜고 물을 드세요.",
    btnLines: ["에어컨 켜고", "가족에게 알리기"],
  },
  cooled: {
    tempLabel: "28°",
    sub: "습도 58% · 에어컨 가동 중",
    level: "ok",
    alertTitle: "적정 온도로 내려갔습니다",
    alertBody: "가족과 컨시어지에게도 알렸습니다. 물을 한 잔 드시고 쉬세요.",
    btnLines: ["가족에게", "알림 완료"],
  },
};

// 실외 현재 — 지금 우리 동네 (06 §3.5). level → 색 매핑은 클라이언트.
export const ELDER_NOW = {
  tempLabel: "33°",
  feelsLabel: "체감 35° · 맑음",
  factors: [
    { label: "자외선", value: "매우 높음", level: "danger" },
    { label: "미세먼지", value: "보통 45", level: "caution" },
    { label: "습도", value: "62%", level: "neutral" },
    { label: "비 올 확률", value: "10%", level: "neutral" },
  ],
};

// 오늘 여쭤볼 것 — 출처 3종(elder|family|concierge)이 요점. 데이터 방화벽 원칙 (06 §3.3)
export const ASK_DOCTOR = [
  { seq: 1, text: "어지러운 게 약 때문인지 여쭤보기", source: "elder", sourceLabel: "어르신이 말씀하신 것" },
  { seq: 2, text: "무릎 통증 약을 같이 먹어도 되는지", source: "family", sourceLabel: "아들 민수가 남긴 것" },
  { seq: 3, text: "다음 진료는 언제 와야 하는지", source: "concierge", sourceLabel: "컨시어지가 확인할 것" },
];

export const VOICE_MSG = {
  fromLabel: "아들 민수",
  durationSec: 28,
  transcript: "어머니, 오늘 병원 잘 다녀오세요. 저녁에 다시 전화드릴게요.",
};

// 배송 — 금액 필드 없음(스키마 방어선). cart는 가족 앱(REQ-07)에서 바뀌고 여기선 읽기만.
export const DELIVERY = {
  dayLabel: "토요일",
  timeLabel: "오전 10시",
  itemsBase: "혈압약 · 시험지 · 위생용품 (3가지)",
  itemsWithCart: "혈압약 · 시험지 · 위생용품 · 파스 · 커프 (5가지)",
};

// 자녀 확인 기록 — 상대 시간만, 미확인 카운트 금지 (06 §3.10). GUARDIANS 페르소나와 동일 인물.
export const FAMILY_SEEN = [
  {
    initials: "민수",
    displayName: "아들 민수",
    seenLabel: "어제 저녁 리포트를 봤습니다",
    avBg: "#0A1F3C",
    avFg: "#FFFFFF",
  },
  {
    initials: "지영",
    displayName: "딸 지영",
    seenLabel: "오늘 아침에 확인했습니다",
    avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
    avFg: "#0A1F3C",
  },
  {
    initials: "현우",
    displayName: "아들 현우",
    seenLabel: "그저께 확인했습니다",
    avBg: "linear-gradient(180deg,#FBFAF7,#F5F3EE)",
    avFg: "#40413F",
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

// 컨시어지 당일 동선 — REQ-09. 상세 주소는 담당 확정(approved) 후에만.
export const TODAY_ROUTE = [
  {
    id: "as1",
    time: "13:50",
    timeRange: "13:50 – 18:00",
    approved: true,
    customer: "김순자 (78)",
    purpose: "병원동행 · 순환기내과 외래",
    meta1: "순환기내과 외래 · 휠체어 필요 · 차량 동행",
    meta2: "직전 방문 6/14 · 보행 보조 필요 · 청력 저하",
    origin: "강남 거점 (역삼동)",
    address: "강남구 대치동 ○○아파트 103동 1204호",
    dong: "강남구 대치동",
    hospital: "서울아산병원",
    etaMin: 22,
    parking: "지하주차장 B2 · 방문차량 등록 필요",
    pickup: "103동 정문 앞 승하차",
    wheelchair: true,
    bufferMin: 90,
  },
  {
    id: "as2",
    time: "내일 09:10",
    approved: false,
    customer: "이영호 (81)",
    purpose: "병원동행 · 정형외과 재진",
    origin: "자택 → 병원",
    address: null,
    dong: "송파구 잠실동",
    hospital: "서울아산병원 (패스트트랙)",
    etaMin: null,
    parking: null,
    pickup: null,
    wheelchair: null,
    bufferMin: null,
  },
];

// 관찰 리포트 12항목 — REQ-11 (판단이 아니라 관찰)
export const OBSERVATION_ITEMS = [
  "집안 정리 상태", "냄새·환기", "식품 보관상태", "낙상 위험물",
  "조명", "냉난방 상태", "의복 상태", "대화 반응",
  "식사 여부", "외로움 호소", "수면 호소", "반복되는 불안 표현",
];

// 진단성 어휘 — 입력 단계 경고 (의료법 17조 · REQ-11)
export const DIAGNOSIS_WORDS = ["우울증", "치매", "정신질환", "자살", "조현", "진단"];

// ─── 관제(dispatch) 목 데이터 — 핸드오프 09 상세 명세 + REQ-04 ─────────────────
// 서비스 경계(REQ-04): 기본 상품 보증 범위는 "긴급신호 접수 + 119 연계"까지.
// 컨시어지 급파는 주간·가용 시. 야간 출동은 외주 옵션 상품(가구별 플래그).

// KPI (09 §1) — SOS 값은 화면에서 상태로 계산
export const DISPATCH_KPIS = [
  { k: "진행중", v: "2", color: "#0A1F3C" },
  { k: "오늘 배차", v: "6", color: "#0A1F3C" },
  { k: "가동률", v: "82%", color: "#1E7A5A" },
];

// ⚙ 오늘 배차의 단일 원본 (09 §6) — 그리드·페어보드·KPI·동선이 전부 여기서 파생.
// s/e는 시(hour) 소수. kind가 null인 건(j2)은 화면에서 상태로 계산:
// sosDispatched → 'sos', visit.checkedIn → 'active', 아니면 'planned'.
export const JOBS = [
  { id: "j1", t: "09:00", s: 9, e: 11.5, client: "오태식 (77)", job: "KMI 검진 · 수면내시경 보호자", lead: "박지현", sup: "오하늘", kind: "done", note: "동성 페어 · 검진 대행 자격 보유 · 순환 규칙 통과", state: "완료" },
  { id: "j2", t: "13:50", s: 13.83, e: 16.17, client: "김순자 (78)", job: "서울아산 순환기내과 · 차량", lead: "박지현", sup: "서다인", kind: null, note: "동성 페어 · 단골 리드 유지 · 연속 2회차", state: "진행중" },
  { id: "j3", t: "15:00", s: 15, e: 17, client: "이영호 (81)", job: "분당서울대 정형외과", lead: "한서연", sup: "오하늘", kind: "planned", note: "동성 페어 · 신규 조합 (유착 방지)", state: "확정" },
  { id: "j4", t: "16:20", s: 16.33, e: 19, client: "한복자 (79)", job: "투석 동행 · 왕복", lead: "정민호", sup: null, kind: "sos", note: "부 동행 미배정 · 투석은 수습 배차 불가", state: "짝 없음" },
  { id: "j5", t: "17:00", s: 17, e: 19, client: "박말순 (83)", job: "강동경희대 내과 · 도보", lead: "윤세라", sup: "최도현", kind: "planned", note: "동일 페어 3회 연속 — 다음 배정은 순환 필요 (4회부터 위반)", state: "순환 경고" },
  { id: "j6", t: "18:10", s: 18.17, e: 20, client: "최정자 (75)", job: "약국 · 장보기 동행", lead: "서다인", sup: "김도윤", kind: "planned", note: "리드 연속 근무 7.6시간 · 주의 구간이나 상한 내", state: "확정" },
];

// 인력 명부 8명 (09 §6). 매출·판매 지표 필드 금지 (원칙 1)
export const STAFF = [
  { name: "박지현", meta: "주 동행 · 강남 · 4.9" },
  { name: "서다인", meta: "주·부 겸용 · 강남 · 4.8" },
  { name: "한서연", meta: "주 동행 · 서초·분당 · 5.0" },
  { name: "오하늘", meta: "부 동행 · 수습 · 4.3" },
  { name: "정민호", meta: "주 동행 · 강동 · 4.7" },
  { name: "윤세라", meta: "주 동행 · 강동 · 4.8" },
  { name: "최도현", meta: "부 동행 · 강동 · 4.6" },
  { name: "김도윤", meta: "부 동행 · 송파 · 4.5" },
];

// AI 자율 배차 L4 (09 §3) — why(근거)는 규제 요건. 없으면 렌더 금지
export const AI_ASSIGN = [
  { client: "한복자 (79)", time: "7/28 09:00", job: "고대구로 재활의학과 · 휠체어", staff: "한서연 + 김도윤", score: 96, why: "주: 재활 이력 2회 · 부: 휠체어 이동 실습 필요 · 동성 페어 · 신규 조합" },
  { client: "오태식 (77)", time: "7/28 13:00", job: "KMI 검진 · 수면내시경 보호자", staff: "정민호 + 오하늘", score: 94, why: "주: 검진 대행 자격 · 부: 당일 공백 4시간 · 순환 규칙 통과" },
  { client: "최정자 (75)", time: "7/29 08:30", job: "세브란스 투석 · 주 3회 고정", staff: "윤세라 + 최도현", score: 91, why: "주: 투석 동행 이력 11회 · 이수민은 주 근무 상한 임박으로 후보 제외" },
];

// SLA 관제 (09 §8.4) — SOS 초동은 "접수·연계" SLA (현장 도착 아님, REQ-04)
export const SLA_ROWS = [
  { k: "SOS 초동 응답 (접수·연계)", target: "60초", now: "41초", w: 68, color: "#1E7A5A", note: "오늘 2건 · 최장 52초" },
  { k: "낙상 복합 알림 → 확인", target: "3분", now: "2분 10초", w: 72, color: "#1E7A5A", note: "단독 충격은 알림 미발송" },
  { k: "픽업 정시율", target: "95%", now: "91%", w: 91, color: "#8A5D12", note: "지연 3건 · 전부 교통" },
  { k: "리포트 전송 (동행 후)", target: "2시간", now: "1시간 24분", w: 70, color: "#1E7A5A", note: "AI 초안 적용 이후 단축" },
  { k: "짝 미매칭 해소", target: "30분", now: "52분", w: 100, color: "#C0392B", note: "오늘 1건 · 목표 초과" },
];

// 짝 미매칭 (09 §8.3) — 1인 배차라는 선택지가 없다. feasible:false도 이유와 함께 표시
export const UNMATCHED = {
  time: "16:20",
  client: "한복자 (79)",
  reason: "투석 동행 자격자 중 가용 부 동행 0명 · 자동 탐색 3회 · 인접 권역 2곳 확장",
  options: [
    { label: "송파 권역 서다인 재배치", cost: "이동 24분 · 18:10 건 재편성 필요", fg: "#8A5D12" },
    { label: "시니어 박지현 부 동행 투입", cost: "단가 역전 · 이번 건 마진 −18,000", fg: "#8A5D12" },
    { label: "고객 일정 조정 요청 (내일 오전)", cost: "투석은 지연 불가 — 선택지 아님", fg: "#C0392B" },
  ],
};

// 동선 체인 (09 §8.5) — 프로토타입 하드코딩. 실제 구현은 JOBS 파생 + 라우팅 API 실측
export const ROUTE_CHAIN = [
  { staff: "박지현 (주)", legs: ["13:50 대치동 자택", "14:30 서울아산", "16:10 대치동 복귀"], gap: "오늘 마지막 건 · 여유 정상", color: "#1E7A5A" },
  { staff: "서다인 (부 → 주)", legs: ["13:50 대치동 · 부 동행", "16:10 동행 종료", "17:32 송파 이동 38분", "18:10 최정자 · 주 동행"], gap: "여유 1시간 22분 · 정상 (일 7.6시간 · 주의 구간)", color: "#8A5D12" },
  { staff: "정민호 (주)", legs: ["16:20 길동 자택", "17:00 투석센터", "19:00 자택 복귀"], gap: "부 동행 미배정 — 출발 보류 중 (해소 목표 15:50)", color: "#C0392B" },
];

// 피로도 (09 §8.6) — 표시가 아니라 게이트. 90%+ 는 AI 배정 후보 자동 제외
export const FATIGUE = [
  { name: "서다인", hours: "7.6h", w: 76, jobs: "부 1 + 주 1건 · 권역 간 이동 포함", state: "주의", color: "#8A5D12" },
  { name: "박지현", hours: "6.2h", w: 62, jobs: "주 동행 2건 · 이동 1.4시간", state: "정상", color: "#1E7A5A" },
  { name: "오하늘", hours: "5.8h", w: 58, jobs: "부 동행 2건 · 수습", state: "정상", color: "#1E7A5A" },
  { name: "이수민", hours: "9.6h", w: 96, jobs: "타 권역 지원 · 오늘 강남 배차 없음", state: "상한 임박", color: "#C0392B" },
];

// 리스크 워치 (09 §8.7) — why는 항상 "환경 × 이력" 교차. 단일 지표 판정 금지
export const RISK_WATCH = [
  { level: "높음", name: "김순자 (78)", why: "실내 31° + 폭염 특보 + 심부전 이력", action: "냉방 확인 콜 + 동행 시 보냉백 지참" },
  { level: "높음", name: "박말순 (83)", why: "등급 갱신 심사 중 · 낙상 이력 2회", action: "2인 모두 부축 가능 인력으로 편성" },
  { level: "중간", name: "이영호 (81)", why: "어제 낙상 복합 알림 · 경과 관찰", action: "동행 전 컨디션 확인 · 무리 시 취소 권한" },
  { level: "중간", name: "최정자 (75)", why: "투석일 다음날 · 탈수 위험", action: "도보 구간 최소화 · 차량 배차 고정" },
];

// 컨디션 예보 캘린더 (09 §9.1) — jobs 건수가 점수와 역상관 (예보 기반 배차 조절의 증거)
export const WEEK_FORECAST = [
  { day: "일 26", score: 68, grade: "보통", note: "폭염 주의", jobs: "9건", tone: "warn" },
  { day: "월 27", score: 74, grade: "좋음", note: "맑음", jobs: "11건", tone: "ok" },
  { day: "화 28", score: 81, grade: "좋음", note: "구름 조금", jobs: "12건", tone: "ok" },
  { day: "수 29", score: 58, grade: "주의", note: "소나기", jobs: "8건", tone: "warn" },
  { day: "목 30", score: 64, grade: "보통", note: "습도 높음", jobs: "10건", tone: "warn" },
  { day: "금 31", score: 41, grade: "위험", note: "폭염 특보", jobs: "6건", tone: "bad" },
  { day: "토 1", score: 77, grade: "좋음", note: "맑음", jobs: "7건", tone: "ok" },
];

// 감점 내역 (09 §9.2) — 룰 엔진 L0 · 결측은 0점이 아니라 계산 제외 + 커버리지 표기
export const SCORE_FACTORS = [
  { name: "기온", weight: 25, basis: "33° · 폭염주의보 구간", delta: "−14", color: "#C0392B" },
  { name: "체감온도", weight: 25, basis: "36° · 습도 68% 반영", delta: "−16", color: "#C0392B" },
  { name: "미세먼지", weight: 20, basis: "PM10 82 · 나쁨", delta: "−12", color: "#8A5D12" },
  { name: "자외선", weight: 20, basis: "지수 매우 높음", delta: "−16", color: "#C0392B" },
  { name: "강수", weight: 10, basis: "강수 확률 10% · 영향 없음", delta: "0", color: "#1E7A5A" },
];

// 오늘 배차 브리핑 (09 §9.3) — 34점 건의 "일정 조정 권고"는 자동 실행 금지 (관제사 판단)
export const BRIEFINGS = [
  { score: 52, grade: "주의", name: "김순자 · 서울아산병원", detail: "자외선 -16 · 미세먼지 -12 · 체감 -20 · 양산·KF94·생수", legs: "출발 대치동 62 보통 → 도착 풍납동 52 주의", color: "#C0392B" },
  { score: 84, grade: "좋음", name: "박말순 · 재택 방문", detail: "감점 요인 없음 · 준비물 없음", legs: "출발 길동 86 좋음 → 도착 길동 84 좋음", color: "#1E7A5A" },
  { score: 34, grade: "나쁨", name: "최정자 · 세브란스 투석", detail: "미세먼지 나쁨 -24 · KF94 필수 · 일정 조정 권고 (F8-4)", legs: "출발 방배동 41 주의 → 도착 신촌동 34 나쁨", color: "#C0392B" },
];

// 컨시어지 현황 (09 §9.4) — 평점만. 매출·판매액 컬럼 금지 (원칙 1)
export const STAFF_STATUS = [
  { name: "박지현", area: "강남·서초", jobs: "2건", rating: "4.9", color: "#1E7A5A" },
  { name: "이수민", area: "송파·강동", jobs: "2건", rating: "4.8", color: "#1E7A5A" },
  { name: "정민호", area: "강남", jobs: "1건", rating: "4.7", color: "#7A5C28" },
  { name: "한서연", area: "서초·동작", jobs: "2건", rating: "5.0", color: "#8FA9CC" },
];

// 관제 맵 실측 좌표 (09 §4) — 전부 실제 서울 좌표. 라이브러리를 바꿔도 좌표는 그대로
export const MAP_DISTRICTS = [
  { name: "종로구", lat: 37.5735, lng: 126.9788 },
  { name: "마포구", lat: 37.5637, lng: 126.9084 },
  { name: "영등포구", lat: 37.5264, lng: 126.8963 },
  { name: "강남구", lat: 37.5172, lng: 127.0473 },
  { name: "송파구", lat: 37.5145, lng: 127.1059 },
  { name: "한강", lat: 37.5185, lng: 126.9976 },
];
export const MAP_HOSPITALS = [
  { name: "세브란스", lat: 37.5622, lng: 126.9408 },
  { name: "서울아산병원", lat: 37.527, lng: 127.1088 },
  { name: "삼성서울병원", lat: 37.4881, lng: 127.0857 },
];
export function mapPeople(sos, mode = "light") {
  const idle = mode === "dark" ? "rgba(255,255,255,.5)" : "#3B5C8A"; // 타일 모드별 평시 색
  return [
    { lat: 37.4945, lng: 127.0614, label: sos ? "김순자 · SOS" : "김순자 · 대치동", color: sos ? "#FF6B5B" : idle },
    { lat: 37.5029, lng: 127.0567, label: "박지현 · 이동중", color: "#4ADE80" },
    { lat: 37.4956, lng: 126.8974, label: "정민호 · 수행중", color: "#4ADE80" },
    { lat: 37.5219, lng: 126.9895, label: "한서연 · 대기", color: "#8FA9CC" },
  ];
}

// 실시간 접수 티커 초기값 — 이후 이벤트는 전 화면 액션이 state.events로 push
export const SEED_EVENTS = [
  { kind: "리포트", text: "오태식 (77) 케어 리포트 검수 확정 · 가족 앱 전달", color: "#8FA9CC", minAgo: 8 },
  { kind: "체크인", text: "박지현 · 오태식 (77) 동행 완료 처리", color: "#4ADE80", minAgo: 21 },
  { kind: "배차", text: "AI 배정안 3건 준비 · 승인 대기", color: "#B08D57", minAgo: 34 },
  { kind: "보험", text: "실손 청구 접수 C-260726-118", color: "#8FA9CC", minAgo: 52 },
];

// ─── 경영(admin) 목 데이터 — 핸드오프 02 §5. 개별 사건 없음, 집계만 ─────────────

// 수익원 22종 커버리지 — impl(구현) / cond(조건부: 규제·제휴 선행) / todo(미구현)
export const REVENUE_STREAMS = [
  { no: "01", name: "병원동행 (건별)", status: "impl" },
  { no: "02", name: "가입비", status: "impl" },
  { no: "03", name: "월 구독", status: "impl" },
  { no: "04", name: "제휴 병원 연계", status: "cond" },
  { no: "05", name: "검진 패키지", status: "cond" },
  { no: "06", name: "헬스케어 커머스", status: "impl" },
  { no: "07", name: "해외 환자 인바운드", status: "todo" },
  { no: "08", name: "글로벌 아웃바운드", status: "todo" },
  { no: "09", name: "보험 연계 (GA)", status: "cond" },
  { no: "10", name: "데이터 라이선싱", status: "cond" },
  { no: "11", name: "안심케어박스", status: "impl" },
  { no: "12", name: "재가급여", status: "cond" },
  { no: "13", name: "B2B SaaS 공급", status: "todo" },
  { no: "14", name: "기관 위탁 운영", status: "todo" },
  { no: "15", name: "복지용구", status: "cond" },
  { no: "16", name: "생활지원 (행정·심부름)", status: "impl" },
  { no: "17", name: "가사 · 청소 연계", status: "cond" },
  { no: "18", name: "렌탈 (대리점형)", status: "todo" },
  { no: "19", name: "생활 계약 점검", status: "todo" },
  { no: "20", name: "케어푸드", status: "todo" },
  { no: "21", name: "디바이스 렌탈", status: "cond" },
  { no: "22", name: "원격 진료 연계 (행정)", status: "todo" },
];

// 수익 예측 — 목 수치. 실데이터 연동 대기 표기 필수
export const REVENUE_FORECAST = [
  { name: "월 구독 (03)", amount: "₩ 48,450,000", pct: 72, phase: "P0" },
  { name: "병원동행 건별 (01)", amount: "₩ 21,300,000", pct: 54, phase: "P0" },
  { name: "가입비 (02)", amount: "₩ 12,600,000", pct: 41, phase: "P0" },
  { name: "커머스 · 케어박스 (06 · 11)", amount: "₩ 6,180,000", pct: 23, phase: "P1" },
  { name: "재가급여 (12)", amount: "₩ 0", pct: 0, phase: "P2 · 지정 심사 대기" },
];

// 규칙 성능 — 오탐률 30% 초과 단독 규칙은 발송 금지 (핸드오프 02 §5 · 03 device)
export const RULE_PERF = [
  { name: "낙상 복합 (충격 3G + 모션 정지 + 통화 실패)", fired: 12, real: 11, falseRate: "8.3%", policy: "발송" },
  { name: "낙상 충격 단독", fired: 36, real: 22, falseRate: "38.9%", policy: "발송 금지 · 로그만" },
  { name: "6시간 무수집", fired: 16, real: 13, falseRate: "18.8%", policy: "배터리 분리 후 발송" },
  { name: "실내 고온 (31° · 30분)", fired: 41, real: 39, falseRate: "4.9%", policy: "발송" },
];

// SLA 집계 — 관제와 같은 수치의 집계 뷰 (개별 사건 비노출)
export const ADMIN_SLA = [
  { name: "SOS 초동 응답", target: "60초", current: "41초", note: "오늘 2건 · 최장 52초" },
  { name: "배차 확정", target: "10분", current: "6분", note: "주간 평균" },
  { name: "방문 리포트", target: "24시간", current: "9시간", note: "지연 0건" },
  { name: "CS 콜백", target: "4시간", current: "1.8시간", note: "NPS 디텍터 24시간 내 전화 별도" },
];

// 리스크 요약 — 01-domain-rules.md와 단일 출처 유지 (요약만 노출)
export const ADMIN_RISKS = {
  critical: 4,
  high: 13,
  top: [
    { grade: "C", name: "의료법 17조 — 진단성 기록", action: "관찰 12항목 고정 + 금칙어 필터 (REQ-11 구현)" },
    { grade: "C", name: "의료법 27조 — 무면허 의료행위", action: "케어박스 의약품 경계 (REQ-10 구현)" },
    { grade: "C", name: "병원 건별 수수료 (C4)", action: "건별 수수료 UI 부재 확인" },
    { grade: "H", name: "GA 등록 전 보험 모집 (H4)", action: "기능 플래그 잠금" },
    { grade: "H", name: "재가급여 부당청구 환수 (H8)", action: "청구 배치 전 자격·한도 검증 필수 경로" },
  ],
};

// 코호트 리텐션 — 목 수치. LTV는 산정 방식 미확정
export const ADMIN_COHORTS = [
  { month: "3월", m1: "92%", m3: "81%", m6: "74%", ltv: "₩ 1,840,000" },
  { month: "4월", m1: "94%", m3: "83%", m6: "—", ltv: "산정 중" },
  { month: "5월", m1: "93%", m3: "—", m6: "—", ltv: "산정 중" },
  { month: "6월", m1: "95%", m3: "—", m6: "—", ltv: "산정 중" },
];

// ─── 회의 요구 전면 반영분 (더미 우선) ──────────────────────────────────────────

// 병력 기반 우선 날씨 — 사람이 설정한다 (자동 추론 금지 · 회의 1 조건부 반영).
// factors 값은 어르신 화면 그리드 라벨과 일치해야 정렬이 작동한다.
export const WEATHER_FACTORS = ["기온", "자외선", "미세먼지", "습도", "비 올 확률"];
export const PRIORITY_PRESETS = [
  { label: "심혈관 · 갑상선", factors: ["기온"], hint: "온도 변화에 취약 — 고온·한파 우선" },
  { label: "호흡기", factors: ["미세먼지", "습도"], hint: "미세먼지·습도 우선" },
  { label: "피부 · 안질환", factors: ["자외선"], hint: "자외선 우선" },
  { label: "관절", factors: ["습도", "비 올 확률"], hint: "습도·강수 우선" },
];

// 어르신 스토어 — 부모가 담고 결제권한에 따라 분기 (회의 6 · REQ-07).
// 금액 비노출 원칙(06)의 예외: 직접 결제 상거래 화면은 금액 표기가 필수.
export const STORE_ITEMS = [
  { id: "s1", name: "파스 (대형 20매)", price: 12000 },
  { id: "s2", name: "혈당 시험지 50매", price: 28000 },
  { id: "s3", name: "KF94 마스크 30매", price: 15000 },
  { id: "s4", name: "생수 2L 12병", price: 9800 },
  { id: "s5", name: "종합 영양제 (2개월)", price: 39000 },
  { id: "s6", name: "무릎 보호대 (의료용)", price: 62000 },
];

// 컨시어지 구매대행 품목 — 쇼핑탭 (회의 7.1). 예상금액 → 보호자 승인 → 구매 → 완료사진
export const CONCIERGE_SHOP_ITEMS = [
  { id: "c1", name: "해열제 (고객 요청)", est: 6500 },
  { id: "c2", name: "파스", est: 12000 },
  { id: "c3", name: "소독약 · 거즈", est: 8000 },
  { id: "c4", name: "밴드 리필", est: 4500 },
];

// MOU 병원 — 진료 과목마다 한 곳 이상 (회의 8)
export const MOU_HOSPITALS = [
  { dept: "내과", name: "강남세브란스", note: "패스트트랙 · 예약 API 부분 연동", fast: true },
  { dept: "정형외과", name: "분당서울대병원", note: "재진 패스트트랙 대기 2일", fast: true },
  { dept: "재활의학과", name: "고대구로병원", note: "휠체어 동선 확인 완료", fast: false },
  { dept: "순환기내과", name: "서울아산병원", note: "패스트트랙 슬롯 운영", fast: true },
  { dept: "안과", name: "삼성서울병원", note: "백내장 수술 연계", fast: false },
  { dept: "치과", name: "강남 미소치과의원", note: "방문 진료 협의 중", fast: false },
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

// 옵션 서비스 — 신규 등록·판매 프로세스 (회의 9 · REQ-04 야간 외주)
// 보험은 GA 등록 전 모집 금지(H4) — 기능 플래그로 잠금
export const OPTION_SERVICES = [
  {
    key: "night",
    name: "야간 출동 서비스 (외주)",
    desc: "야간 긴급 출동 — 외주 파트너 수행 · 가구별 옵션",
    price: "월 12,000원 (확정 전)",
    locked: false,
  },
  {
    key: "escort",
    name: "추가 병원동행 (건별)",
    desc: "기본 연 4회 초과분 · 건별 이용",
    price: "건당 48,000원",
    locked: false,
  },
  {
    key: "insurance",
    name: "보험 연계",
    desc: "보험회사 입점 연계 상품",
    price: "준비 중",
    locked: true,
    lockNote: "GA 등록 후 오픈 (등록 전 모집 금지 · 기능 플래그 잠금)",
  },
];

// 방문 영상 3모드 — REQ-12 (회의 확정). 항상 녹화 금지, 필요한 순간 세그먼트만.
export const VIDEO_MODES = [
  { key: "tele", name: "원격상담 모드", rule: "고객·보호자 요청 시에만 연결 · 기본 저장 없음 · 녹화는 별도 동의 시" },
  { key: "visit", name: "방문기록 모드", rule: "사전 동의 가구만 · 품질관리·분쟁 예방 목적 · 제한 열람" },
  { key: "sos", name: "긴급상황 모드", rule: "낙상·응급 시 관제·의료진과 일시 공유 · 사건 종료 후 삭제" },
];
export const VIDEO_SEGMENTS = ["현관 진입 · 본인 확인", "케어박스 점검", "생활환경 확인", "서비스 종료 확인"];
export const VIDEO_POLICY = {
  allowed: ["거실", "현관", "주방", "병원 이동", "약상자 점검", "생활환경 확인"],
  banned: ["욕실", "화장실", "탈의공간", "침실"],
  retention: "일반 방문 4주 후 자동 삭제 · 사고·민원은 사건 종료 시까지 · 법적 분쟁은 법령 기준 별도 보관",
};

// ─── 보호자 앱 디자인 콘솔 정합분 ──────────────────────────────────────────────

// 실시간 건강 요약 5지표 — 지표별 상태 라벨 병행 (색만으로 상태 전달 금지)
export const VITALS = [
  { name: "심박수", value: "72", unit: "bpm", status: "정상 범위", level: "ok" },
  { name: "걸음 수", value: "3,140", unit: "걸음", status: "목표의 62%", level: "neutral" },
  { name: "수면", value: "6.2", unit: "시간", status: "3일 평균 하락", level: "caution" },
  { name: "혈압", value: "128/82", unit: "mmHg", status: "경계", level: "caution" },
  { name: "복약 준수율", value: "86", unit: "%", status: "미이행 2회 · 저녁 대기", level: "caution" },
];

// 담당 컨시어지 2인 1조 — 관계 연속성("12번 모셨습니다")이 신뢰의 근거
export const CARE_TEAM = {
  dateLabel: "8/23 (금) 동행",
  members: [
    {
      initials: "박지현",
      name: "박지현",
      role: "주 동행",
      career: "간호사 · 상급종합 14년 · 평점 4.9",
      relation: "어머니를 12번 모셨습니다",
      avBg: "#0A1F3C",
      avFg: "#FFFFFF",
    },
    {
      initials: "서다인",
      name: "서다인",
      role: "부 동행",
      career: "요양보호사 · 차량 · 접수와 서류 담당",
      relation: "이번이 두 번째입니다",
      avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
      avFg: "#0A1F3C",
    },
  ],
  trust:
    "두 사람 모두 신원조회와 배상책임보험을 마쳤습니다. 방문 전날 저녁에 두 분의 사진과 이름을 다시 보내드립니다 — 어머니께서 문 앞에서 확인하실 수 있도록.",
};

// ─── 컨시어지 앱 디자인 콘솔 정합분 ────────────────────────────────────────────

// 오늘의 짝 — 2인 1조 실행 UI. "혼자 들어가지 마세요"가 원칙의 실행 카피
export const PAIR_TODAY = {
  initials: "서다인",
  name: "서다인",
  role: "부 동행",
  eta: "13:38 출발 · 도착 예정 13:47",
  avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
  avFg: "#0A1F3C",
  duties: [
    { who: "나 (주)", what: "어르신 밀착 보조 · 의료진 소통 · 리포트 작성 · 최종 판단" },
    { who: "서다인 (부)", what: "차량 · 접수·수납 · 짐과 서류 · 응급 시 119와 가족 연락" },
  ],
  rule: "두 사람 모두 체크인해야 동행이 시작됩니다. 짝이 도착하지 않으면 어르신 댁에 혼자 들어가지 마세요.",
};

// 준비물 문서 — 날씨 준비물(OUTING.kit)에 더해 동행 문서
export const KIT_DOCS = ["진료의뢰서"];

// 동행 완료 리포트 — AI 초안 · 컨시어지 확정 (8.4 Human-in-the-loop) · 2인 서명
export const AI_REPORT = {
  draft:
    "14:32 도착, 순환기내과 접수 완료. 대기 40분 중 어르신 컨디션 양호. 처방 3종 수령, 약국 동행 후 15:50 귀가 완료. 다음 외래 8월 23일 안내드렸습니다.",
  hitl: "AI가 초안을 만들고 컨시어지가 확정합니다 — 검수 없이는 가족에게 전달되지 않습니다 (8.4 Human-in-the-loop)",
  signRule:
    "사고·분쟁 시 두 사람의 기록이 각각 남아야 증언이 됩니다 — 한 명만 서명한 리포트는 발송되지 않습니다.",
};

// 정산 — 원칙 1 준수: 업셀링 인센티브 금지 → 케어 품질 인센티브(평점·리포트 검수)로 대체.
// 판매액·업셀 실적은 평가·보상에 반영하지 않는다.
export const EARNINGS = {
  week: "7월 4주차",
  grade: "GOLD",
  total: "742,000",
  delta: "지난주 대비 +18% · 7월 28일(월) 오전 입금 예정",
  breakdown: [
    { name: "기본급 (주할)", meta: "고정", amount: "420,000", gold: false },
    { name: "동행 수행 성과급", meta: "7건", amount: "258,000", gold: false },
    { name: "케어 품질 인센티브", meta: "평점 4.9 · 리포트 무반려", amount: "64,000", gold: true },
  ],
  designNote: "기본급 + 성과 인센티브 구조 · 월 300만원 이상 실현을 목표로 설계했습니다 (3.2)",
  principleNote: "판매액·업셀 실적은 평가·보상에 반영되지 않습니다 — 품질 인센티브 기준은 평점·리포트 검수입니다 (원칙 1)",
  stats: [
    ["완료 건수", "7건"],
    ["수락률", "82%"],
    ["평점", "4.9"],
  ],
  items: [
    { who: "김순자 (78) · 서울아산 순환기내과", meta: "7/26 · 4시간 · 차량 동행", net: "142,800", gross: "168,000", state: "확정" },
    { who: "이영호 (81) · 삼성서울 정형외과", meta: "7/26 · 2.5시간", net: "89,250", gross: "105,000", state: "확정" },
    { who: "한복자 (79) · 고대구로 종합검진", meta: "7/24 · 4시간 · 검진 대행", net: "178,500", gross: "210,000", state: "확정" },
    { who: "박말순 (83) · 재택 방문 케어", meta: "7/25 · 2시간", net: "68,000", gross: "80,000", state: "검수중" },
  ],
  feeNote: "표기 금액은 플랫폼 수수료 15% 차감 후 실수령액입니다 · 3.3% 원천징수 별도",
  tier: {
    now: "GOLD",
    perk: "수수료 15% · 우선 배정",
    toNext: "PLATINUM까지 6건",
    pct: 65,
    nextPerk: "PLATINUM 승급 시 수수료 12% · 월 20만원 고정 수당 · 신규 고객 우선 배정",
  },
  // "놓친 수익 · 예상 손실" 프레임 금지 — 무리 동행 강행 압박 (신뢰 우선 원칙)
  declinedNote:
    "이번 주 거절 2건 — 사유가 기록되었습니다. 어르신 컨디션·안전 사유의 거절과 취소 권한은 불이익 없이 보장됩니다. 수락률 82% (GOLD 유지 기준 80%)",
  earlyPayNote: "조기 지급은 주 정산액의 50% 한도 안에서 가능합니다 (한도 규칙)",
};

// 케어 제안 — 제안은 반드시 근거(trigger)를 동반한다 (도메인 규칙 1.1)
export const CARE_SUGGESTIONS = [
  { item: "미끄럼 방지 매트", trigger: "근거: 낙상 위험물 관찰 2회 (6/14 · 7/26 리포트)", est: 28000 },
  { item: "쿨매트 · 냉감 침구", trigger: "근거: 실내 31° 고온 알림 · 폭염 특보", est: 35000 },
];

// ─── AI 활용 지점 — 원칙: 8.4 사람 검수 · 근거 동반 · 어르신 무부담(앰비언트) ────

// 어르신 안부 전화 — 어르신은 받기만 한다. 발언은 자동으로 질문·리포트에 담긴다.
// 어르신 화면 카피에 시스템 주어(AI가~)를 쓰지 않는다 (06 §7).
export const AI_CALL = {
  timeLabel: "오전 10시",
  body: "오전 10시에 전화가 와요.\n받기만 하시면 됩니다.",
  yesterday: "어제 통화 — \"무릎이 조금 아프다\"고 하셨어요. 선생님에게 전달해 두었어요.",
  autoNote: "말씀하신 내용은 '오늘 여쭤볼 것'에 자동으로 담깁니다.",
};

// 보호자 AI 케어 어시스턴트 — 답변은 항상 근거(src) 동반. 의료 판단 아님.
export const AI_ASSISTANT_QA = [
  {
    q: "요즘 수면은 어때요?",
    a: "최근 3일 평균 6.2시간으로 지난주(6.4시간)보다 조금 줄었습니다. 낮잠은 늘지 않았고, 저녁 복약 후 취침이 늦어진 날이 이틀 있었습니다.",
    src: "워치 수면 데이터 · 최근 7일",
  },
  {
    q: "다음 진료 전에 챙길 게 있나요?",
    a: "8/23 순환기내과 외래 전, '어지러움' 발언이 2회 기록되어 질문 목록에 올라가 있습니다. 혈압 기록은 컨시어지가 지참합니다.",
    src: "안부 전화 기록 · 공유 캘린더",
  },
  {
    q: "이번 주 복약은 잘 하셨나요?",
    a: "주간 복약 19/21회로 지난주보다 2회 늘었습니다. 미이행 2회는 모두 저녁분이라, 저녁 알림을 30분 앞당기는 것을 제안드립니다.",
    src: "복약 체크 기록 · 최근 7일",
  },
];

// 컨시어지 AI 동행 브리핑 — 진화형 케어 프로필의 '주입' 단계.
// 확정/미확정을 구분해 저장·표시한다 (03 profile: 추론값과 확인값 구분).
export const AI_BRIEFING = {
  confirmed: [
    "청력 저하 — 왼쪽에서 또박또박 말하기",
    "휠체어 이동 — 병원 정문 경사로 이용",
    "지난 방문 \"입맛이 없다\" 발언 2회 — 식사 여부 여쭤보기",
  ],
  unconfirmed: ["낙상 이력 상세 — 가족 진술과 본인 진술이 다름 · 캐묻지 말고 관찰만"],
};

// 관찰 리포트 음성 초안 — AI가 녹음을 관찰 문장으로 정리 (진단 표현은 금칙어 필터가 차단)
export const AI_VOICE_DRAFT =
  '거실 정리 상태 양호. 점심 식사는 절반 정도 드심. "요즘 밤에 두 번씩 깬다"고 말씀하심. 현관 앞 신문 3일치 쌓여 있음.';

// 가족 초대 — 주 보호자만 발급. 링크 참여 시 주 보호자 알림 + 제거 권한은 주 보호자 전용
export const INVITE = { link: "kcare.app/i/7F2K9Q", rule: "7일 유효 · 1회용 · 참여 시 주 보호자에게 알림" };

// ─── 관제 통합 디렉터리 — 검색·플로팅 프로필 카드 공용 (더미) ─────────────────────
// rows: [라벨, 값] · alert: 챙겨야 할 것(강조). 주소 상세는 담당 확정 게이팅 원칙 유지.
export const DIRECTORY = [
  // 어르신
  { type: "elder", name: "김순자", tag: "78", summary: "대치동 · 오늘 13:50 서울아산 동행 · 위험 높음",
    rows: [["담당", "박지현 (주) · 서다인 (부)"], ["오늘", "13:50–16:10 순환기내과 · 차량"], ["보호자", "김민수 (아들 · 주 보호자)"], ["워치", "정상 수신 · 심박 72"]],
    alert: "심부전 이력 + 폭염 — 보냉백 · 휠체어 · 청력 저하 (왼쪽에서 말하기)" },
  { type: "elder", name: "이영호", tag: "81", summary: "잠실동 · 내일 09:10 병원동행 · 경과 관찰",
    rows: [["담당", "한서연 (주) · 오하늘 (부)"], ["일정", "내일 09:10 분당서울대 정형외과"], ["보호자", "이정민 (딸)"]],
    alert: "어제 낙상 복합 알림 — 동행 전 컨디션 확인 · 무리 시 취소 권한" },
  { type: "elder", name: "박말순", tag: "83", summary: "길동 · 17:00 재택 방문 · 낙상 이력 2회",
    rows: [["담당", "윤세라 (주) · 최도현 (부)"], ["일정", "17:00 강동경희대 내과 · 도보"], ["워치", "6시간 무수집 — 배터리 확인 콜 예정"]],
    alert: "등급 갱신 심사 중 · 낙상 이력 2회 — 2인 모두 부축 가능 편성" },
  { type: "elder", name: "한복자", tag: "79", summary: "길동 · 16:20 투석 동행 · 짝 재배치 완료",
    rows: [["담당", "정민호 (주) · 서다인 (재배치)"], ["일정", "16:20–19:00 투석 왕복"], ["이력", "재활 동행 2회"]],
    alert: "투석은 지연 불가 — 출발 15:50 전 2인 체크인 확인" },
  { type: "elder", name: "오태식", tag: "77", summary: "역삼동 · 오늘 09:00 검진 완료",
    rows: [["담당", "박지현 (주) · 오하늘 (부)"], ["오늘", "KMI 검진 완료 · 리포트 검수 대기"], ["특이", "수면내시경 — 보호자 인계 완료"]] },
  { type: "elder", name: "최정자", tag: "75", summary: "방배동 · 18:10 장보기 동행 · 투석일 다음날",
    rows: [["담당", "서다인 (주) · 김도윤 (부)"], ["일정", "18:10 약국 · 장보기"], ["고정", "세브란스 투석 주 3회"]],
    alert: "투석일 다음날 탈수 위험 — 도보 최소화 · 차량 고정" },
  // 보호자
  { type: "guardian", name: "김민수", tag: "아들", summary: "김순자 보호자 · 주 보호자 · 서울",
    rows: [["가구", "김순자 (78) · 대치동"], ["역할", "연락 담당 · 결제 승인자 (5만원 한도)"], ["최근", "어제 저녁 리포트 열람"], ["연락", "010-****-1234"]] },
  { type: "guardian", name: "김지영", tag: "차녀", summary: "김순자 보호자 · LA (PST)",
    rows: [["가구", "김순자 (78)"], ["시차", "리포트 20:00 PST 발송"], ["최근", "오늘 아침 확인"]] },
  { type: "guardian", name: "김현우", tag: "삼남", summary: "김순자 보호자 · 시드니 (AEST)",
    rows: [["가구", "김순자 (78)"], ["최근", "그저께 확인"]] },
  // 컨시어지
  { type: "concierge", name: "박지현", tag: "주 동행", summary: "강남 · 평점 4.9 · 오늘 2건 · 6.2h 정상",
    rows: [["자격", "간호사 출신 · 상급종합 14년"], ["오늘", "오태식 완료 · 김순자 13:50 동행"], ["피로도", "6.2h · 정상 (이동 1.4h 포함)"], ["페어", "서다인 (부)"]] },
  { type: "concierge", name: "서다인", tag: "주·부 겸용", summary: "강남 · 평점 4.8 · 부1+주1건 · 7.6h 주의",
    rows: [["오늘", "김순자 부 동행 → 최정자 주 동행"], ["피로도", "7.6h · 주의 구간 (상한 내)"], ["재배치", "한복자 투석 건 부 동행 승인"]] },
  { type: "concierge", name: "한서연", tag: "주 동행", summary: "서초·분당 · 평점 5.0 · 오늘 1건",
    rows: [["오늘", "이영호 15:00 정형외과"], ["피로도", "정상"]] },
  { type: "concierge", name: "오하늘", tag: "부 동행 · 수습", summary: "평점 4.3 · 부 동행 2건 · 5.8h",
    rows: [["제한", "수습 — 투석 배차 불가 · 주 동행 불가"], ["승격", "부 동행 12건 후 일반"]] },
  { type: "concierge", name: "정민호", tag: "주 동행", summary: "강동 · 평점 4.7 · 투석 동행 대기",
    rows: [["오늘", "한복자 16:20 투석 — 짝 도착 대기"], ["주의", "부 동행 체크인 전 출발 보류"]] },
  { type: "concierge", name: "윤세라", tag: "주 동행", summary: "강동 · 평점 4.8 · 오늘 1건",
    rows: [["오늘", "박말순 17:00 내과"], ["편성", "순환 경고 — 다음 배정 순환 필요"]] },
  { type: "concierge", name: "최도현", tag: "부 동행", summary: "강동 · 평점 4.6",
    rows: [["오늘", "박말순 17:00 부 동행"]] },
  { type: "concierge", name: "김도윤", tag: "부 동행", summary: "송파 · 평점 4.5",
    rows: [["오늘", "최정자 18:10 부 동행"], ["내일", "한복자 재활 부 동행 (AI 배정)"]] },
  { type: "concierge", name: "이수민", tag: "주 동행", summary: "송파·강동 · 9.6h 상한 임박 — 오늘 배차 제외",
    rows: [["피로도", "9.6h · 상한 임박 (일 10h)"], ["조치", "오늘·내일 AI 배정 후보 자동 제외"]] },
];

// 병원도 디렉터리에 포함 (MOU_HOSPITALS 파생)
export const DIRECTORY_ALL = [
  ...DIRECTORY,
  ...MOU_HOSPITALS.map((h) => ({
    type: "hospital",
    name: h.name,
    tag: h.dept,
    summary: `${h.note}${h.fast ? " · 패스트트랙" : ""}`,
    rows: [["과목", h.dept], ["연계", h.note], ["패스트트랙", h.fast ? "운영" : "미운영"]],
  })),
];

export const DIRECTORY_TYPE = {
  elder: { label: "어르신", fg: "#F0D9A8", bg: "rgba(138,93,18,.25)" },
  guardian: { label: "보호자", fg: "#8FA9CC", bg: "rgba(59,92,138,.3)" },
  concierge: { label: "컨시어지", fg: "#8FE3C0", bg: "rgba(30,122,90,.3)" },
  hospital: { label: "병원", fg: "#C9A46B", bg: "rgba(176,141,87,.25)" },
};

// ════ 경영 · 사람 관리 (관제 = 현장 관리, 경영 = 사람 관리 · 분석) ════
// 집계 전용 — 개별 사건은 관제 소관. HR·CS 조치는 세그먼트/담당 배정 수준까지만.

export const PEOPLE_KPIS = [
  { k: "가입 가구", v: "128", sub: "+12 이번 달", color: "#0A1F3C" },
  { k: "활성 어르신", v: "132", sub: "멤버십 유지 97%", color: "#0A1F3C" },
  { k: "보호자 계정", v: "241", sub: "주 128 · 부 113", color: "#0A1F3C" },
  { k: "컨시어지 재직", v: "24", sub: "수습 5 · 시니어 4", color: "#0A1F3C" },
  { k: "컨시어지 90일 유지", v: "87%", sub: "업계 평균 61%", color: "#1E7A5A" },
  { k: "보호자 NPS", v: "62", sub: "리포트 만족 기여 1위", color: "#1E7A5A" },
];

// 컨시어지 — 케어 품질 분포 (평점 출처: 가족 만족도. 판매액 컬럼 금지 — 원칙 1)
export const STAFF_QUALITY_DIST = [
  { band: "4.8 이상", n: 9, w: 38, color: "#1E7A5A", note: "시니어 후보군" },
  { band: "4.5 – 4.7", n: 11, w: 46, color: "#B08D57", note: "표준 구간" },
  { band: "4.5 미만", n: 4, w: 16, color: "#8A5D12", note: "코칭 대상 · 3개월 재평가" },
];
export const STAFF_QUALITY_OPS = [
  { k: "2인 페어 준수", v: "100%", note: "예외 0건 — 시스템 강제" },
  { k: "리포트 정시 전송", v: "96%", note: "동행 후 2시간 내" },
  { k: "브리핑 사전 확인", v: "89%", note: "미확인 시 개별 콜" },
  { k: "GPS 체크인 정시", v: "94%", note: "지연 대부분 교통" },
];
export const STAFF_PIPELINE = [
  { stage: "지원", n: 46, w: 100 },
  { stage: "서류 · 인터뷰", n: 18, w: 39 },
  { stage: "교육 수료", n: 9, w: 20 },
  { stage: "수습 (부 동행 12건)", n: 5, w: 11 },
  { stage: "일반 전환", n: 3, w: 7 },
];
// HR 워치 — 이직·번아웃 신호. 개별 사건이 아니라 사람 관리 (경영 소관)
export const STAFF_HR_WATCH = [
  { name: "서다인", why: "주 근무 상한 근접 3주 연속 · 권역 간 이동 과다", action: "권역 재편 + 2주 배차 하향", level: "높음" },
  { name: "오하늘", why: "수습 평점 4.3 · 어르신 응대 피드백 2건", action: "시니어 동행 코칭 4회 배정", level: "중간" },
  { name: "이수민", why: "타 권역 지원 반복 — 피로 누적 · 만족도 하락 신호", action: "지원 요청 상한 설정 · 면담", level: "중간" },
];
export const INCENTIVE_MIX = [
  { k: "가족 만족도", pct: 40, note: "평점 · 재예약 의사" },
  { k: "리포트 충실도", pct: 30, note: "관찰 항목 완성도 · 정시" },
  { k: "안전 · 무사고", pct: 30, note: "체크인 · 페어 규정 준수" },
];
export const STAFF_CERTS = [
  { k: "요양보호사 자격", n: 14, w: 58 },
  { k: "간호 인력 출신", n: 6, w: 25 },
  { k: "치매 케어 교육 이수", n: 17, w: 71 },
  { k: "응급처치 갱신 필요", n: 4, w: 17, warn: true },
];

// 보호자 · 가구 — 가입 퍼널 (최근 90일) · 참여도 · 이탈 세그먼트
export const FAMILY_FUNNEL = [
  { stage: "상담 접수", n: 210, w: 100 },
  { stage: "어르신 등록", n: 156, w: 74 },
  { stage: "결제 · 가입 확정", n: 128, w: 61 },
  { stage: "부보호자 초대 발송", n: 96, w: 46 },
  { stage: "초대 수락", n: 74, w: 35, note: "수락률 77%" },
];
export const FAMILY_ENGAGE = [
  { k: "리포트 열람 (주보호자)", v: "91%", color: "#1E7A5A", note: "발송 24시간 내" },
  { k: "리포트 열람 (부보호자)", v: "64%", color: "#8A5D12", note: "시차 가구 보정 후 71%" },
  { k: "결제 승인 응답 중간값", v: "18분", color: "#1E7A5A", note: "5만원 한도 정책" },
  { k: "주간 앱 방문", v: "4.2회", color: "#0A1F3C", note: "리포트 발송일 피크" },
];
export const CHURN_SEGMENTS = [
  { seg: "리포트 2주 미열람", n: "6가구", action: "CS 아웃바운드 + 발송 시간 재설정", level: "중간" },
  { seg: "결제 실패 · 갱신 임박", n: "2가구", action: "결제 수단 교체 안내 (D-5)", level: "높음" },
  { seg: "요청 무응답 3회 이상", n: "3가구", action: "주보호자 유선 확인", level: "중간" },
];
export const MEMBERSHIP_MIX = [
  { k: "티어 1 (월 57,000)", n: 84, w: 66 },
  { k: "티어 2", n: 32, w: 25 },
  { k: "티어 3", n: 12, w: 9 },
];
export const OPTION_ATTACH = [
  { k: "야간 출동 (외주)", v: "22%", note: "SOS 야간 공백 보완" },
  { k: "간병보험 (GA)", v: "출시 대기", note: "라이선스 확보 후 오픈" },
];

// 어르신 케어 성과 — 월 집계만 (개별 사건 비노출)
export const CARE_OUTCOMES = [
  { k: "복약 순응률", v: "92%", target: "목표 90%", color: "#1E7A5A" },
  { k: "병원 동행 정시율", v: "91%", target: "목표 95%", color: "#8A5D12" },
  { k: "일정 조정 권고 수용", v: "68%", target: "목표 60%", color: "#1E7A5A" },
  { k: "리포트 가족 전달", v: "1.4h", target: "목표 2h 내", color: "#1E7A5A" },
];
export const SAFETY_MONTHLY = [
  { k: "SOS", v: "4건", note: "초동 평균 41초 · 전월 5건" },
  { k: "낙상 복합 알림", v: "10건", note: "전월 12건 · 오탐 개선" },
  { k: "119 연계", v: "1건", note: "기본 보증 범위 내 조치" },
  { k: "야간 공백 접수", v: "3건", note: "야간 옵션 미가입 가구" },
];
export const ELDER_MIX = [
  { k: "75 – 79세", n: 58, w: 44 },
  { k: "80 – 84세", n: 51, w: 39 },
  { k: "85세 이상", n: 23, w: 17 },
];
export const ELDER_RISK_MIX = [
  { k: "위험 높음", n: 11, color: "#C0392B" },
  { k: "중간 · 관찰", n: 34, color: "#8A5D12" },
  { k: "안정", n: 87, color: "#1E7A5A" },
];

// ── AI 어시스턴트 캔드 Q&A — 관제·경영 (키 미설정 데모 폴백 · keys는 자유 입력 매칭용) ──
export const DISPATCH_AI_QA = [
  {
    q: "지금 가장 급한 일은?",
    keys: ["급한", "우선", "먼저", "뭐부터"],
    a: "1) 짝 미매칭 — 한복자님 투석 16:20 건, 해소 목표 15:50 전에 서다인 재배치안 승인이 필요합니다. 2) AI 배정안 3건 승인 대기(평균 적합 94%). 3) 외출 브리핑 3건 발송 — 최정자님 34점 건은 일정 조정 권고가 포함돼 있습니다.",
    src: "액션 큐 · 오늘 배차 현황",
  },
  {
    q: "미매칭 해소 옵션 비교",
    keys: ["미매칭", "짝", "한복자"],
    a: "가능한 안은 두 가지입니다. ① 송파 서다인 재배치 — 이동 24분, 18:10 건 재편성 필요 ② 시니어 박지현 부 동행 투입 — 이번 건 마진 역전. 고객 일정 조정은 투석 특성상 선택지가 아닙니다. 정시성 기준으로는 ①이 우선입니다.",
    src: "미매칭 보드 · 동선 체인",
  },
  {
    q: "오늘 리스크 워치 요약",
    keys: ["리스크", "위험"],
    a: "높음 2명 — 김순자님(실내 31° + 심부전 이력 → 냉방 확인 콜 · 보냉백), 박말순님(낙상 이력 2회 → 부축 가능 2인 편성). 중간 2명 — 이영호님(어제 낙상 알림 → 동행 전 컨디션 확인), 최정자님(투석 다음날 → 차량 고정).",
    src: "리스크 워치 · 환경 × 이력 교차",
  },
  {
    q: "피로도 상한 걸리는 사람?",
    keys: ["피로", "상한", "근무"],
    a: "이수민님이 9.6시간으로 상한(일 10시간) 임박 — 오늘 · 내일 AI 배정 후보에서 자동 제외돼 있습니다. 서다인님은 7.6시간 주의 구간이라 권역 간 이동이 더 붙지 않게 배차를 권합니다.",
    src: "피로도 게이트 · 근무 시간",
  },
];

export const ADMIN_AI_QA = [
  {
    q: "이번 달 사람 지표 요약",
    keys: ["요약", "지표", "이번 달"],
    a: "가입 128가구(+12), 컨시어지 24명 재직에 90일 유지율 87%로 업계 평균(61%)을 크게 웃돕니다. 보호자 NPS 62. 주의 신호는 부보호자 리포트 열람률 64%와 이탈 위험 11가구입니다.",
    src: "사람 KPI · 참여도 집계",
  },
  {
    q: "이탈 위험 가구 조치는?",
    keys: ["이탈", "churn", "위험 가구"],
    a: "세 세그먼트입니다. 결제 실패 · 갱신 임박 2가구(높음)는 D-5 결제 수단 교체 안내, 리포트 2주 미열람 6가구는 CS 아웃바운드 + 발송 시간 재설정, 요청 무응답 3가구는 주보호자 유선 확인. 개별 가구 연락은 CS 소관입니다.",
    src: "이탈 위험 세그먼트",
  },
  {
    q: "컨시어지 유지율 개선 포인트",
    keys: ["유지율", "이직", "컨시어지"],
    a: "데이터상 유지율의 핵심 변수는 피로도 상한 준수입니다. HR 워치 3명(서다인 · 오하늘 · 이수민)의 조치를 이행하고, 수습 → 일반 전환(현재 3명)을 정체 없이 운영하는 것이 우선입니다. 인센티브는 케어 품질 3축(만족 40 · 리포트 30 · 안전 30)을 유지하세요.",
    src: "HR 워치 · 인력 파이프라인",
  },
  {
    q: "가입 퍼널 최대 이탈 구간은?",
    keys: ["퍼널", "가입", "전환"],
    a: "등록 → 결제 구간이 −18%로 최대 이탈 구간입니다. 가입비(12 – 15만) 미확정이 원인으로 지목되며, 정책 확정이 선결 과제입니다. 부보호자 초대 수락률은 77%로 양호합니다.",
    src: "가입 퍼널 (최근 90일)",
  },
];

// ════ CRM 고도화 — 가구 360° · 라이프사이클 · Next Best Action ════
// 원칙: 경영은 세그먼트 집계·담당 배정까지 (개별 개입 금지) · 개별 가구 실행은 관제·CS 도구에서.
// 스코어는 요인·가중치 공개 (블랙박스 금지 — 8.4와 동일 사상).

export const LIFECYCLE_STAGES = [
  { k: "온보딩 (첫 30일)", n: 18, w: 14, color: "#3B5C8A", note: "이탈의 61%가 이 구간" },
  { k: "정착", n: 71, w: 55, color: "#1E7A5A" },
  { k: "확장 (옵션 부착)", n: 24, w: 19, color: "#B08D57" },
  { k: "갱신 (D-30 이내)", n: 4, w: 3, color: "#8A5D12" },
  { k: "위기 (개입 중)", n: 11, w: 9, color: "#C0392B" },
];
export const CHURN_BANDS = [
  { k: "안정 (0 – 39)", n: 103, color: "#1E7A5A" },
  { k: "주의 (40 – 69)", n: 14, color: "#8A5D12" },
  { k: "위험 (70+)", n: 11, color: "#C0392B" },
];
export const CHURN_FACTORS = "리포트 미열람 35 · 요청 무응답 25 · 결제 신호 25 · 방문 감소 15";
export const NBA_QUEUE = [
  { id: "nba1", seg: "위기 11가구 중 결제 신호 2가구", act: "D-5 결제 수단 교체 안내 + 주보호자 콜", owner: "CS", expect: "갱신 실패 예방", level: "높음" },
  { id: "nba2", seg: "온보딩 18가구 중 첫 리포트 미열람 5가구", act: "발송 시간 재설정 + 열람 가이드 메시지", owner: "CS", expect: "온보딩 이탈 −30% (파일럿 기준)", level: "중간" },
  { id: "nba3", seg: "야간 SOS 이력 보유 미부착 9가구", act: "야간 출동 옵션 안내 — 케어 필요 기반", owner: "멤버십팀", expect: "야간 공백 접수 감소", level: "중간" },
];
export const ACTION_RESULTS = [
  { act: "발송 시간 개인화 (6월)", target: "미열람 21가구", result: "열람률 64% → 71%", verdict: "유지" },
  { act: "갱신 D-30 콜 (6월)", target: "갱신 12가구", result: "갱신율 83% → 92%", verdict: "표준화" },
  { act: "리포트 요약 상단 고정 (5월)", target: "전체 가구", result: "유의미한 변화 없음", verdict: "롤백" },
];

// 가구 360° — 관제 프로필 카드용 (관제는 개별 소관 · 주소 게이팅 원칙 유지)
export const CRM_STAGE = {
  김순자: { stage: "정착", months: 14, churn: 18, color: "#1E7A5A", nba: "여름 냉방 확인 콜 + 동행 시 보냉백 준비 — 환경 × 이력 기반" },
  이영호: { stage: "온보딩", months: 1, churn: 42, color: "#3B5C8A", nba: "첫 리포트 열람 확인 콜 — 온보딩 30일 케어" },
  박말순: { stage: "위기", months: 9, churn: 71, color: "#C0392B", nba: "등급 갱신 심사 진행 상황 공유 + 주보호자 면담 요청" },
  한복자: { stage: "정착", months: 11, churn: 24, color: "#1E7A5A", nba: "투석 고정 배차 만족도 확인 (월 1회 루틴)" },
  오태식: { stage: "확장", months: 7, churn: 12, color: "#B08D57", nba: "검진 결과 리포트 발송 후 가족 열람 확인" },
  최정자: { stage: "갱신 D-21", months: 12, churn: 35, color: "#8A5D12", nba: "갱신 안내 + 1년 케어 리포트 요약 발송" },
};
export const CRM_TIMELINE = {
  김순자: [
    { at: "오늘", kind: "동행", text: "13:50 서울아산 순환기내과 · 박지현 + 서다인" },
    { at: "7/28", kind: "리포트", text: "관찰 리포트 가족 전달 · 김민수 열람" },
    { at: "7/26", kind: "구매", text: "혈압계 구매대행 · 보호자 승인 완료" },
    { at: "7/21", kind: "안부", text: "AI 안부 콜 — \"입맛이 없다\" 2회 → 식사 확인 등록" },
    { at: "7/12", kind: "SOS", text: "접수 41초 초동 · 확인 후 해제" },
    { at: "6/30", kind: "결제", text: "월 멤버십 정기 결제 · 티어 1" },
  ],
  이영호: [
    { at: "7/29", kind: "알림", text: "낙상 복합 알림 → 경과 관찰 전환" },
    { at: "7/25", kind: "예약", text: "분당서울대 정형외과 동행 예약 (내일)" },
    { at: "7/2", kind: "가입", text: "온보딩 시작 · 주보호자 이정민" },
  ],
  박말순: [
    { at: "7/29", kind: "워치", text: "6시간 무수집 — 배터리 확인 콜 예정" },
    { at: "7/18", kind: "심사", text: "등급 갱신 심사 접수" },
    { at: "7/8", kind: "동행", text: "강동경희대 내과 · 재택 방문" },
  ],
  한복자: [
    { at: "오늘", kind: "동행", text: "16:20 투석 왕복 · 짝 재배치 완료" },
    { at: "7/23", kind: "동행", text: "재활의학과 2회차" },
  ],
  오태식: [
    { at: "오늘", kind: "동행", text: "09:00 KMI 검진 완료 · 리포트 검수 대기" },
    { at: "7/15", kind: "옵션", text: "야간 출동 옵션 부착" },
  ],
  최정자: [
    { at: "7/29", kind: "브리핑", text: "외출지수 34 — 일정 조정 권고" },
    { at: "7/10", kind: "결제", text: "갱신 D-21 안내 발송" },
  ],
};

// ════ 세계 최고 컨시어지 서비스 — 개인화 · 선제 · 리커버리 · 성장 ════
// 원칙: 판매 없음 · 진단어 없음 · 좋은 동행은 기억(선호)과 한 끗(선제)에서 나온다.
export const ELDER_PREFS = [
  ["호칭", "\"여사님\" — 이름만 부르는 것 싫어하심"],
  ["대화", "왼쪽에서 또렷하게 · 손주 이야기 좋아하심"],
  ["이동", "걸음 느림 — 15분 여유 · 계단보다 엘리베이터"],
  ["음료", "찬물 대신 미지근한 보리차"],
  ["피할 것", "다른 어르신과 병세 비교 · 재촉하는 말"],
];
export const TODAY_DETAIL = {
  text: "모레(8/1)는 김순자님 생신입니다. 오늘 동행 마무리에 축하 말씀 한마디와, 따님 김지영님(LA)이 남긴 안부 메시지 전달을 부탁드려요.",
  src: "가족 캘린더 · 메시지함",
};
export const RECOVERY_STEPS = [
  ["즉시", "변명 없이 사과하고 사실을 확인합니다"],
  ["1시간 내", "관제에 보고하고 대안을 마련합니다"],
  ["24시간 내", "가족에게 조치 결과를 공유합니다"],
  ["재발 방지", "선호 카드와 리포트에 기록합니다"],
];
export const GROWTH_QUESTS = [
  { k: "치매 케어 심화 교육", state: "완료", w: 100, color: "#1E7A5A" },
  { k: "투석 동행 자격 (동행 10건)", state: "6 / 10", w: 60, color: "#B08D57" },
  { k: "신규 코칭 멘토 (시니어 요건)", state: "예정", w: 8, color: "#C9CFD8" },
];

// ════ 신뢰 거버넌스 — 해자 (설계에 박힌 신뢰: 동의 · 접근 공개 · 게이팅) ════
// 나중에 붙일 수 없는 것이 해자다. 모든 열람은 기록되고, 기록은 가족에게 공개된다.
export const CONSENTS = [
  { k: "위치 정보 (동행 중)", state: "동의", until: "2026.08", on: true, expiring: "D-15" },
  { k: "방문기록 영상 (요약 30초)", state: "동의", until: "2027.02", on: true },
  { k: "건강 신호 (워치)", state: "동의", until: "2027.02", on: true },
  { k: "제휴 병원 정보 제공", state: "예약 시 건별 동의", until: "—", on: false },
];
export const ACCESS_LOG = [
  { at: "오늘 13:12", who: "박지현 (컨시어지)", what: "케어 프로필 · 선호 카드", why: "동행 준비" },
  { at: "오늘 09:40", who: "관제 (강남지점)", what: "일정 · 워치 상태", why: "배차 브리핑" },
  { at: "어제 20:00", who: "AI 리포트 시스템", what: "방문 기록", why: "리포트 초안 작성" },
  { at: "7/26", who: "김지영 (부 보호자)", what: "케어 리포트", why: "열람" },
];
export const TRUST_METRICS = [
  { k: "동의 최신화율", v: "98%", note: "만료 30일 전 자동 갱신 안내" },
  { k: "접근 기록 공개", v: "100%", note: "모든 열람이 가족에게 공개" },
  { k: "삭제 요청 처리", v: "24h 내", note: "탈퇴 시 데이터 삭제 SLA" },
  { k: "민감정보 게이팅 위반", v: "0건", note: "주소 · 건강 접근 통제" },
];

// 발송 추적 — 양방향화: 보내고 끝이 아니라 수신·열람·응답까지. 미열람은 채널 에스컬레이션
export const COMMS_TRACKING = {
  heat: { sent: 6, read: 4, replied: 2, next: "미열람 2가구 — 내일 09:00 음성 콜 자동 전환" },
  call: { sent: 2, read: 2, replied: 1, next: "무응답 1가구 — 보호자 알림 병행" },
  briefAll: { sent: 9, read: 8, replied: 8, next: "미확인 1명 — 08:00 개별 콜 예약" },
  tz: { sent: 2, read: 1, replied: 1, next: "미열람 1가구 — 현지 저녁 시간대 재발송" },
  consent: { sent: 3, read: 2, replied: 2, next: "미응답 1가구 — 주보호자 유선 안내 예약" },
};

// NPS 수집 루프 — 동행 후 24h 설문 · 비추천은 즉시 회복 플로우 (점수보다 회복 속도)
export const NPS_REASONS = ["도착 지각", "소통 아쉬움", "준비물 누락", "리포트 지연", "기타"];
export const NPS_LOOP = {
  respond: "71%",
  mix: [
    { k: "추천 (9–10)", v: "58%", color: "#1E7A5A" },
    { k: "중립 (7–8)", v: "24%", color: "#B08D57" },
    { k: "비추천 (0–6)", v: "18%", color: "#C0392B" },
  ],
  recovery: [
    { k: "24h 내 회복 연락", v: "100%", note: "SLA — 매니저 직접 콜" },
    { k: "회복 후 재응답", v: "+4.2점", note: "재설문 평균 상승" },
    { k: "비추천 → 이탈", v: "2가구", note: "전분기 5가구 → 감소" },
  ],
};

// ════ 확장 — AI 능동형 아침 브리핑 (관제 출근 3분 요약 · 읽음도 감사 로그) ════
export const MORNING_BRIEF = {
  date: "7/30 (목) 07:30 생성",
  summary: "오늘 배차 6건 · 위험 높음 2명 · 오후 체감 36° 폭염 주의 — 외출 브리핑 발송이 최우선입니다.",
  items: [
    { k: "날씨", text: "14시 체감 36° · 외출지수 오후 급락 — 13:50 김순자님 동행은 차량 대기 최소화" },
    { k: "인력", text: "이수민 상한 임박 자동 제외 · 서다인 주의 구간 — 추가 배차 없이 운영 가능" },
    { k: "리스크", text: "박말순님 워치 6시간 무수집 — 09시 배터리 확인 콜 예정" },
    { k: "추천 순서", text: "① 외출 브리핑 발송 ② AI 배정안 승인 ③ 미매칭 재배치 확정 (15:50 전)" },
  ],
};

// ════ 확장 — 병원 파트너 레코드 (파트너도 관계 관리: 담당·최근 접점·실적) ════
export const HOSPITAL_PARTNERS = {
  강남세브란스: { contact: "예약팀 김OO", last: "7/28 슬롯 협의", trips: 14, slots: "내일 오전 2", status: "양호" },
  분당서울대병원: { contact: "원무 박OO", last: "7/21 재진 프로세스", trips: 9, slots: "D+2 1", status: "양호" },
  고대구로병원: { contact: "재활센터 이OO", last: "7/15 휠체어 동선", trips: 6, slots: "협의 필요", status: "재협의" },
  서울아산병원: { contact: "협력센터 최OO", last: "어제 패스트트랙 확인", trips: 17, slots: "오늘 오후 1", status: "양호" },
  삼성서울병원: { contact: "안과 코디 정OO", last: "6/30 수술 연계", trips: 4, slots: "—", status: "점검" },
  "강남 미소치과의원": { contact: "실장 한OO", last: "7/10 방문진료 협의", trips: 2, slots: "협의 중", status: "협의" },
};
export const PARTNER_STATUS = { 양호: "#1E7A5A", 재협의: "#C0392B", 점검: "#8A5D12", 협의: "#8A5D12" };
export const INSURANCE_PARTNER = {
  name: "간병보험 GA 파트너",
  stage: [["라이선스 확보", true], ["상품 설계", true], ["감독 신고", false], ["오픈", false]],
  note: "GA 등록 전 보험 모집 금지(H4) — 등록 완료까지 앱 내 기능 잠금 유지",
};

// ════ 확장 — 컨시어지 내부 CRM: 인정(감사 피드) · 코칭 로그 (케어하는 사람을 케어한다) ════
export const THANKS_FEED = [
  { from: "김민수 (김순자님 가족)", text: "어머니가 \"박 선생 오는 날이 제일 좋다\"고 하세요. 감사합니다.", at: "어제" },
  { from: "이정민 (이영호님 가족)", text: "낙상 뒤에 세심하게 살펴주셔서 마음이 놓였습니다.", at: "7/27" },
  { from: "오태식님", text: "검진 내내 손 잡아줘서 고마웠어요.", at: "7/28" },
];
export const COACHING_LOG = [
  { who: "오하늘 (수습)", coach: "박지현", topic: "어르신 응대 — 속도 맞추기 · 경청", next: "8/2 동행 코칭 3회차", state: "진행" },
  { who: "서다인", coach: "관제 매니저", topic: "권역 이동 부담 면담 — 배차 하향 합의", next: "2주 후 재점검", state: "조치" },
  { who: "김도윤", coach: "한서연", topic: "투석 동행 자격 준비 (6/10건)", next: "8월 내 10건 달성 예상", state: "진행" },
];

// ════ 경영 주간 AI 브리핑 — 능동형: 경영에게도 묻기 전에 요약 (집계 전용) ════
export const EXEC_BRIEF = {
  date: "7/28 (월) 주간 생성",
  summary: "가입 +12가구 · 컨시어지 유지율 87% 유지 — 주의 신호는 부보호자 열람률(64%)과 위기 11가구입니다.",
  items: [
    { k: "사람", text: "수습 5명 중 2명이 8월 일반 전환 요건 도달 예상 — 투석 배차 여력 +15%" },
    { k: "리스크", text: "폭염 지속 시 외출지수 하락 → 8월 첫 주 배차 12% 감소 전망 · 재택 방문 전환 권고" },
    { k: "권고", text: "가입비 정책(12 – 15만) 확정이 퍼널 최대 병목 — 이번 주 의사결정 안건 상정" },
  ],
};

// ════ 동네 소식 피드 — 동·구 단위 재난·안전·정책·바우처 (디자인 콘솔 복원 · 행정 데이터 연동 대상) ════
export const NEIGHBORHOOD_FEED = [
  { id: "nb1", kind: "재난", at: "오늘 11:00", title: "폭염 특보 발효 — 강남구", body: "14~17시 야외활동 자제 권고. 오늘 어머니 동행은 차량 대기 최소화로 이미 조정되어 있습니다.", tone: "danger" },
  { id: "nb2", kind: "안전", at: "어제", title: "대치동 무더위 쉼터 운영", body: "대치1동 주민센터 · 은마상가 경로당 — 평일 09~18시. 산책 코스에 반영해 드립니다.", tone: "amber" },
  { id: "nb3", kind: "바우처", at: "7/28", title: "강남구 어르신 교통비 지원 (분기 3만 원)", body: "만 75세 이상 · 8/15 신청 마감 — 김순자님이 대상에 해당합니다.", tone: "gold", action: "신청 대행 요청" },
  { id: "nb4", kind: "정책", at: "7/25", title: "서울시 안심콜 서비스 확대", body: "독거 어르신 안부 확인 콜 — K-CARE AI 안부 전화와 중복 없이 병행할 수 있습니다.", tone: "muted" },
];
export const FEED_TONE = {
  danger: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  amber: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  gold: { fg: "#7A5C28", bg: "rgba(176,141,87,.16)" },
  muted: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

// ════ CS · 마케팅 — 경영 탭 (베타 단계: 별도 콘솔 대신 경영 집계로 시작) ════
export const CS_METRICS = [
  { k: "이번 주 티켓", v: "23건", note: "신규 8 · 처리 중 5 · 완료 10" },
  { k: "첫 응답", v: "11분", note: "목표 30분 — 준수 96%" },
  { k: "해결까지", v: "4.2h", note: "환불 · 정산 제외 중앙값" },
  { k: "회복 콜 이행", v: "100%", note: "NPS 비추천 → 24h 내" },
];
export const CS_TOPICS = [
  { k: "바우처 · 정책 신청 대행", n: 7, w: 100 },
  { k: "결제 · 승인 한도", n: 5, w: 71 },
  { k: "리포트 발송 시간", n: 4, w: 57 },
  { k: "일정 변경 · 취소", n: 4, w: 57 },
  { k: "워치 착용 불편", n: 3, w: 43 },
];
export const MKT_CHANNELS = [
  { k: "가족 추천 (초대 링크)", v: "42%", note: "CAC 0원 — NPS 추천군 연동", color: "#1E7A5A" },
  { k: "검색 · 블로그", v: "27%", note: "\"부모님 병원 동행\" 키워드", color: "#0A1F3C" },
  { k: "제휴 병원 안내", v: "19%", note: "MOU 6곳 원내 안내", color: "#B08D57" },
  { k: "지역 커뮤니티", v: "12%", note: "강남구 맘카페 · 경로당", color: "#8A5D12" },
];
export const MKT_RULES = "의료 효능 · 치료 표현 광고 금지 (의료법 56조) · 후기는 동의받은 실제 가족 사례만 사용";

// ════ 웨어러블 — 갤럭시 Fit3 (Samsung Health → Health Connect → 폰 컴패니언, 준실시간 동기화) ════
// 정직 표기: Fit3는 서드파티 SDK 미제공 — 실시간 스트리밍이 아니라 5분 주기 동기화.
// 낙상 SOS는 Fit3 → 보호자 직통이 기본, 관제 연계는 컴패니언 앱 경유 (삼성 파트너 협의 항목).
export const FIT3_INFO = {
  device: "갤럭시 Fit3",
  path: "Samsung Health → Health Connect → K-CARE 컴패니언(폰)",
  cycle: "5분 주기 동기화 (준실시간)",
  lastSync: "14:02",
  battery: "62%",
};
export const FIT3_METRICS = [
  { icon: "heart", name: "심박수", value: "72", unit: "bpm", status: "정상 범위 · 오늘 평균 71", level: "ok", action: "고 · 저심박 지속 시 보호자 알림 + 진료 상담 안내" },
  { icon: "activity", name: "활동량", value: "3,140", unit: "걸음", status: "목표의 62% · 활동 52분", level: "neutral", action: "활동량 급감 시 컨디션 변화 신호로 확인 콜" },
  { icon: "moon", name: "수면", value: "6.2", unit: "시간", status: "수면 점수 71 · 깊은잠 1.1h", level: "caution", action: "수면 부족 · 급변 시 생활 관리 안내" },
  { icon: "drop", name: "혈중산소 SpO₂", value: "96", unit: "%", status: "야간 평균 95%", level: "ok", action: "평소보다 지속 저하 시 병원 상담 안내" },
  { icon: "wave", name: "스트레스", value: "보통", unit: "", status: "HRV 기반 추정", level: "neutral", partner: true, action: "높은 상태 지속 시 휴식 · 안부 콜" },
  { icon: "alert", name: "낙상 감지", value: "이상 없음", unit: "", status: "어제 복합 알림 1건 → 오탐 확인", level: "ok", sos: true, action: "낙상 감지 → 보호자 알림 → 무응답 시 관제 확인" },
  { icon: "pin", name: "위치", value: "자택", unit: "", status: "스마트폰 연동 · 대치동", level: "ok", action: "외출 동선 확인 · 긴급 시 참고 (동행 중에만 상세)" },
  { icon: "watch", name: "착용 상태", value: "착용 중", unit: "", status: "마지막 수신 14:02 · 배터리 62%", level: "ok", action: "6시간 무수집 시 가족 알림 + 확인 콜" },
];
// 관제 — 가구별 워치 보드 (착용 · 수신 · 핵심 신호)
export const WATCH_BOARD = [
  { name: "김순자", wear: "착용", sync: "14:02", hr: "72", spo2: "96%", note: "동행 중 — 위치 공유 ON", level: "ok" },
  { name: "이영호", wear: "착용", sync: "13:58", hr: "68", spo2: "97%", note: "낙상 복합 알림 경과 관찰", level: "caution" },
  { name: "박말순", wear: "미수집", sync: "08:01", hr: "—", spo2: "—", note: "6시간 무수집 — 배터리 확인 콜", level: "warn" },
  { name: "한복자", wear: "착용", sync: "14:00", hr: "76", spo2: "95%", note: "투석 전 안정", level: "ok" },
  { name: "오태식", wear: "착용", sync: "13:55", hr: "70", spo2: "97%", note: "검진 완료 귀가", level: "ok" },
  { name: "최정자", wear: "착용", sync: "14:01", hr: "74", spo2: "96%", note: "투석 다음날 — 탈수 주의", level: "caution" },
];

// ════ 현장의 소리 — 컨시어지 불편·제안 접수 (파트너 케어: 목소리는 평가에 반영되지 않는다) ════
export const VOICE_TYPES = ["불편사항", "개선 제안", "어르신 관련", "기타"];
export const VOICE_METRICS = [
  { k: "이번 달 접수", v: "14건", note: "익명 6 · 실명 8" },
  { k: "답변률", v: "100%", note: "48시간 내 답변 약속" },
  { k: "반영됨", v: "5건", note: "제안 → 기능·정책 변경" },
  { k: "이번 주 마음 지수", v: "3.9/5", note: "체크인 평균 · 익명 집계" },
];
export const VOICE_FEED = [
  { at: "7/29", type: "개선 제안", text: "케어박스가 무거워요 — 여름엔 보냉백과 분리 휴대하게 해주세요", status: "반영됨", who: "익명" },
  { at: "7/27", type: "불편사항", text: "병원 주차장에서 픽업 위치 찾기가 어렵습니다. 병원별 픽업 포인트 사진이 있으면 좋겠어요", status: "검토 중", who: "박지현" },
  { at: "7/24", type: "어르신 관련", text: "청력 저하 어르신용 필담 카드가 있으면 좋겠습니다", status: "반영됨", who: "익명" },
  { at: "7/21", type: "기타", text: "폭염 수당 기준이 궁금합니다", status: "답변 완료", who: "익명" },
];
export const VOICE_STATUS = {
  반영됨: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  "검토 중": { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  "답변 완료": { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

// ════ 파트너 복지 — 컨시어지 복지·심리상담 지원 (상담 내용은 회사 비공개 · 이용률만 익명 집계) ════
export const WELFARE_ITEMS = [
  { k: "심리상담 (EAP)", desc: "월 1회 무료 · 외부 전문기관 직접 연결 — 내용은 회사에 공유되지 않습니다", action: "상담 예약", eap: true },
  { k: "종합 건강검진", desc: "연 1회 · 배우자 50% 지원 · 근무일 인정", action: null },
  { k: "동행 중 상해보험", desc: "전원 자동 가입 · 이동 구간 포함 · 자기부담 0원", action: null },
  { k: "혹서 · 혹한 수당", desc: "폭염특보 · 한파주의보 발효일 동행 건당 지급 (자동 계산)", action: null },
  { k: "자격 · 교육비 지원", desc: "요양보호사 · 치매 케어 등 취득 비용 전액 · 승급 로드맵 연동", action: null },
  { k: "리프레시 휴가", desc: "분기 1일 유급 — '지쳐요' 체크인과 무관하게 눈치 없이 사용", action: null },
];
export const WELFARE_METRICS = [
  { k: "심리상담 이용", v: "월 7건", note: "익명 집계 — 내용 비공개" },
  { k: "검진 수검률", v: "92%", note: "미수검 2명 일정 안내" },
  { k: "상해보험 가입", v: "100%", note: "전원 자동 · 청구 이력 1건" },
  { k: "혹서 수당 지급", v: "31건", note: "7월 폭염특보 일수 기준" },
];

// ════ 날씨 관제 (관제 GNB '날씨') — 기상 데이터는 케이웨더 단일 출처 ════
// 수치는 SCORE_FACTORS(체감 36°·PM10 82·자외선 매우 높음)·WEEK_FORECAST(목 30 습도 높음 · 금 31 폭염 특보)와 동기.
export const WEATHER_NOW = {
  temp: "33.4°",
  feels: "36.1°",
  sky: "구름 조금",
  humid: "68%",
  wind: "남서 2.8m/s",
  uv: "매우 높음",
  alert: {
    name: "폭염주의보",
    since: "오늘 10:00 발효 · 서울 전역",
    guide: "체감 35° 이상 — 12~17시 어르신 외출 동행 최소화 · 차량 대기 냉방 유지",
  },
  updated: "5분 전 갱신",
};
export const WEATHER_AIR = [
  { k: "미세먼지 PM10", v: "82", grade: "나쁨", tone: "bad" },
  { k: "초미세먼지 PM2.5", v: "41", grade: "나쁨", tone: "bad" },
  { k: "오존", v: "0.092", grade: "주의", tone: "warn" },
  { k: "통합 대기", v: "—", grade: "나쁨", tone: "bad" },
];
export const WEATHER_HOURLY = [
  { t: "14시", temp: "33°", feels: "36°", pop: "10%", note: "폭염 피크" },
  { t: "15시", temp: "34°", feels: "36°", pop: "10%", note: "자외선 최고" },
  { t: "16시", temp: "33°", feels: "35°", pop: "10%", note: "" },
  { t: "17시", temp: "32°", feels: "34°", pop: "20%", note: "" },
  { t: "18시", temp: "30°", feels: "32°", pop: "20%", note: "동행 권장대" },
  { t: "19시", temp: "29°", feels: "30°", pop: "30%", note: "" },
];
// 권역별 — 이름은 MAP_DISTRICTS와 일치해야 지도에 얹힌다 (한강 제외)
export const WEATHER_DISTRICTS = [
  // dir: 지도 라벨 방향 — 인접 권역(마포↔종로 · 강남↔송파)이 겹치지 않게 분산
  { name: "종로구", temp: "32.8°", pm: "보통 64", tone: "warn", dir: "top" },
  { name: "마포구", temp: "32.5°", pm: "보통 58", tone: "warn", dir: "left" },
  { name: "영등포구", temp: "33.1°", pm: "나쁨 78", tone: "bad", dir: "left" },
  { name: "강남구", temp: "33.4°", pm: "나쁨 82", tone: "bad", dir: "bottom" },
  { name: "송파구", temp: "33.9°", pm: "나쁨 85", tone: "bad", dir: "right" },
];
// 이슈는 곧 케어 판단 재료 — 각 이슈에 관제 액션을 붙인다 (자동 실행 금지 · 관제사 판단)
export const WEATHER_ISSUES = [
  {
    level: "특보",
    tone: "bad",
    title: "폭염주의보 발효 — 서울 전역",
    time: "10:00 발효 · 내일(금) 폭염경보 격상 가능",
    care: "위험 높음 2가구 냉방 확인 콜 · 12~17시 동행은 차량 대기 최소화 · 혹서 수당 자동 적용",
    cta: "발송 센터에서 폭염 안내 발송",
  },
  {
    level: "주의",
    tone: "warn",
    title: "미세먼지 나쁨 — 강남 · 송파 PM10 80+",
    time: "오후 내 지속 전망",
    care: "호흡기 이력 가구 KF94 준비물 자동 반영 · 병원 정문 하차 동선으로 노출 최소화",
    cta: null,
  },
  {
    level: "주의",
    tone: "warn",
    title: "오존 · 자외선 동반 상승 — 14~17시",
    time: "자외선 지수 매우 높음",
    care: "장시간 야외 대기 금지 · 양산 · 생수 준비물 반영 (F8-4 일정 조정 권고 유지)",
    cta: null,
  },
  {
    level: "예보",
    tone: "info",
    title: "금 31 폭염 특보 지속 · 토 1 맑음 회복",
    time: "케이웨더 주간 전망",
    care: "금요일 배차 6건으로 이미 축소 편성 — 연기 가능 일정은 토요일로 이동 권고",
    cta: null,
  },
];

// ════ F7 진화형 케어 프로필 · F11-1 AI 안부콜 (/care-profile) ════
// 원칙: 프로필은 특정 AI에 종속되지 않게 저장 · 관측만 하고 진단하지 않는다 (9.4)
export const CP_KPIS = [
  { k: "누적 속성", v: "38", note: "쓸수록 깊어짐" },
  { k: "문진 생략률", v: "92%", note: "재방문 시 재설명 불필요" },
  { k: "단골 재지정", v: "68%", note: "선호 컨시어지 우선" },
  { k: "안부콜 응답률", v: "87%", note: "주 3회 · 화·목·토" },
];
export const CP_LOOP = [
  ["01", "수집", "대화 · 리포트 · 웨어러블 · 현장 관측"],
  ["02", "병합", "중복 제거 후 변화된 상태로 갱신"],
  ["03", "주입", "다음 상담·배차 시 컨텍스트로 자동 투입"],
  ["04", "개인화", "문진 제로 · 단골 배정 · 선제 조치"],
  ["05", "재이용", "만족도 상승 → 데이터가 다시 쌓임"],
];
export const CP_ATTRS = [
  { k: "거동 수준", v: "실내 보행 가능 · 외출 시 휠체어", src: "컨시어지 리포트", conf: "높음" },
  { k: "청력", v: "좌측 저하 · 우측 정상", src: "동행 중 대화 관측", conf: "높음" },
  { k: "선호 컨시어지", v: "박지현 (3회 연속 지정)", src: "예약 이력", conf: "높음" },
  { k: "복약", v: "혈압·콜레스테롤·아스피린 3종", src: "처방전 · 복약 기록", conf: "높음" },
  { k: "정서 상태", v: "주말 고립감 경향", src: "AI 안부콜 대화 분석", conf: "보통" },
  { k: "식이 제한", v: "저염 권고 (확인 필요)", src: "가족 발화 1회", conf: "낮음" },
];
export const CP_CALLS = [
  { d: "7/25", text: "식사·수면 모두 양호, 손주 이야기로 대화 지속", meta: "통화 6분 12초 · 발화량 평소 대비 +14%", state: "안정" },
  { d: "7/23", text: "“요즘 아무도 안 온다” 발화 · 반복 질문 2회", meta: "통화 4분 03초 · 고립감 표현 감지", state: "관찰" },
  { d: "7/20", text: "외출 계획 언급, 목소리 톤 평상 수준", meta: "통화 5분 30초", state: "안정" },
  { d: "7/18", text: "단어 찾기 지연 3회 · 날짜 혼동 1회", meta: "통화 5분 02초 · 인지 신호 누적 기록", state: "관찰" },
];
export const CP_GUARD = [
  "자살예방상담전화 109 안내 · 통화 연결 제안",
  "가족 앱 긴급 배너 · 관제 긴급 티커 동시 점등",
  "컨시어지 긴급 방문 배정 또는 119 연계 검토",
];
export const CP_BRIEF = {
  head: "7/26 13:50 김순자 (78) · 박지현(주) + 서다인(부)",
  why: "2인 1조가 되면서 어르신을 처음 만나는 사람이 항상 한 명은 있습니다. 프로필 38개 속성을 다 읽을 시간은 없으니, 이 어르신에게만 해당하는 것 6개로 압축해 출발 전에 두 사람 모두에게 보냅니다.",
  dont: [
    ["왼쪽에서 말 걸지 않기", "왼쪽 귀 청력이 거의 없습니다. 대답이 없으면 못 들으신 겁니다 — 다시 크게 말하지 말고 오른쪽으로 돌아가세요."],
    ["팔을 잡아 끌지 않기", "오른쪽 어깨 회전근개 손상 이력. 부축은 반드시 왼팔 아래를 받쳐서."],
    ["“어머니”라고 부르지 않기", "본인이 싫어하십니다. ‘순자 어르신’으로 부릅니다."],
  ],
  do: [
    ["엘리베이터 앞에서 한 번 쉬기", "3층 계단 후 숨이 차십니다. 서두르면 다음부터 동행을 거부하십니다."],
    ["접수 번호표는 부 동행이 받기", "대기 줄에서 오래 서 계시면 어지러워하십니다. 주 동행은 어르신과 함께 앉아 있으세요."],
    ["진료 후 ‘오늘 여쭤볼 것’ 3건 확인", "어르신 앱에 담긴 질문입니다. 답을 듣고 리포트에 그대로 옮겨 적으세요."],
  ],
  delta: "6/14 방문 대비 — 보행이 눈에 띄게 느려졌고 휠체어를 처음 사용하십니다. 야간 화장실 횟수가 늘어 이뇨제 복용 시간 조정을 여쭤볼 예정입니다. 아들 민수 님이 9월 귀국 예정이라 그때 요양원 상담을 계획 중입니다.",
};
export const CP_TIMELINE = [
  { d: "7/24", k: "야간 배뇨", v: "주 2회 → 주 6회 · 이뇨제 복용 시간 확인 필요", src: "실내 센서 · 생활 리듬" },
  { d: "7/12", k: "보행 상태", v: "보행 보조 필요 → 휠체어 필요 (외출 시)", src: "컨시어지 리포트 · 3회 연속 기록" },
  { d: "6/28", k: "식사 준비", v: "직접 조리 → 주 2~3회 거름", src: "주방 활동 데이터 + 안부콜" },
  { d: "6/14", k: "청력", v: "왼쪽 귀 청력 저하 확인 · 응대 방식 변경", src: "컨시어지 관찰 → 이비인후과 확인" },
  { d: "5/30", k: "선호 호칭", v: "“어머니” 거부 · “순자 어르신”으로 통일", src: "안부콜 대화 추출" },
];
export const CP_GAPS = [
  { level: "높음", k: "복용 중인 건강기능식품", why: "약물 상호작용 확인에 필요 · 다음 방문 시 약통 사진으로 확인", when: "7/29 예정" },
  { level: "높음", k: "응급 시 1순위 연락처 우선순위", why: "3남매 중 누구부터인지 미확정 · 가족 회의 안건에 포함", when: "8/3 회의" },
  { level: "중간", k: "종교 · 식이 제한", why: "케어푸드 제안 전 필요 · 안부콜 대화에서 자연 확인", when: "다음 안부콜" },
  { level: "중간", k: "낙상 이력 상세 (시기·장소)", why: "가족 진술과 본인 진술이 다름 · 재확인 필요", when: "보류" },
  { level: "낮음", k: "취미 · 관심사", why: "생활지원 제안 개인화용 · 급하지 않음", when: "수시" },
];
export const CP_FEATURES = [
  { id: "F7-1", k: "프로필 자동 병합", state: "구현", note: "대화에서 흘러나온 정보를 중복 없이 병합" },
  { id: "F7-2", k: "문진 제로 재방문", state: "구현", note: "두 번째 예약부터 상태 재설명 불필요" },
  { id: "F7-3", k: "단골 우선 배정", state: "구현", note: "선호 컨시어지를 최우선 제안" },
  { id: "F7-4", k: "도메인 규칙 주입", state: "부분", note: "휠체어·치매·투석 케어 규칙 자동 반영" },
  { id: "F7-5", k: "예측 기반 추천", state: "Phase 2", note: "검진 주기·질환 이력 기반 선제 제안" },
];
// 가입 개월이 쌓이면서 AI가 할 수 있게 된 일 — 진화를 가구 눈높이에서 보여준다
export const CP_TENURE = [
  { m: "가입 1개월", attrs: "속성 6개", state: "past",
    can: ["이름 · 나이 · 거주 동 확인", "예약 접수와 동행 배차"],
    cant: "방문할 때마다 상태를 다시 여쭤봐야 했습니다 — 문진 생략률 0%" },
  { m: "가입 6개월", attrs: "속성 21개", state: "past",
    can: ["청력 · 보행에 맞춘 응대 방식 자동 반영", "선호 컨시어지 우선 배정", "동행 전 브리프 자동 생성"],
    cant: "변화가 '얼마나 빨리' 오는지는 아직 못 봤습니다" },
  { m: "가입 14개월 — 지금", attrs: "속성 38개", state: "now",
    can: ["보행 · 야간 배뇨 등 변화 추세 감지", "안부콜 대화에서 정서 · 인지 신호 추출", "문진 없이 재방문 (생략률 92%)"],
    cant: "낙상 '위험 예측'은 아직 — 회사 전체 사고 라벨이 34건뿐입니다" },
  { m: "가입 24개월 — 예정", attrs: "속성 50+ 예상", state: "next",
    can: ["계절 · 질환 주기 기반 선제 제안", "검진 주기 자동 리마인드", "이 어르신에게 맞는 안부콜 시나리오"],
    cant: "" },
];
export const CP_GLOSSARY = [
  { k: "장기요양등급", en: "LTC Grade", cat: "제도", text: "국가가 어르신의 돌봄 필요 정도를 1~5등급과 인지지원등급으로 판정하는 제도. 등급을 받으면 방문요양·주야간보호 비용의 대부분을 건강보험공단이 부담합니다." },
  { k: "본인부담금", en: "Co-payment", cat: "비용", text: "전체 진료비 중 환자가 직접 내는 몫. 나머지는 건강보험이 냅니다. 등급·소득 수준에 따라 15~20% 선이며 감경 대상이면 더 낮아집니다." },
  { k: "진료비 세부산정내역서", en: "Itemized Bill", cat: "서류", text: "진료비가 항목별로 얼마인지 적힌 서류. 실손보험 청구에 반드시 필요하며, 컨시어지가 현장에서 함께 받아 옵니다." },
  { k: "외래 vs 입원", en: "Outpatient / Inpatient", cat: "진료", text: "외래는 당일 진료 후 귀가, 입원은 병상에서 하루 이상 머무는 것. 동행 서비스 시간과 비용, 보험 보장 범위가 달라집니다." },
  { k: "처방전 유효기간", en: "Rx Validity", cat: "복약", text: "처방전을 받은 날부터 보통 3일(장기 처방은 별도 표기) 안에 약국에서 조제해야 합니다. 지나면 다시 진료를 받아야 합니다." },
  { k: "외출 컨디션 점수", en: "Outing Score", cat: "K-CARE", text: "기온·체감·미세먼지·자외선·강수를 100점에서 깎아 계산한 그날의 외출 안전도. 60점 아래면 일정 조정을 권고합니다." },
];

// ════ 경영 · 인원 관리 (운영 / 인력·자격·프로필) ════
export const SM_KPIS = [
  { k: "전체 인력", v: "46", color: "#0A1F3C" },
  { k: "활동중", v: "39", color: "#1E7A5A" },
  { k: "자격 만료 임박", v: "2", color: "#C0392B" },
  { k: "경계 교육 미이수", v: "3", color: "#8A5D12" },
  { k: "90일 이탈률", v: "6.5%", color: "#1E7A5A" },
  { k: "평균 평점", v: "4.8", color: "#0A1F3C" },
];
export const SM_ALERT = "정민호 · 요양보호사 자격 30일 후 만료 · 오하늘 · 심폐소생술(BLS) 갱신 필요 · 2명 배차 제한 예정";
export const SM_ROSTER = [
  { name: "박지현", cert: "간호사 · 상급종합 14년", area: "강남·서초", load: "82%", rate: "4.9", state: "활동중", tone: "ok" },
  { name: "이수민", cert: "요양보호사 · 재활 전문", area: "송파·강동", load: "76%", rate: "4.8", state: "활동중", tone: "ok" },
  { name: "정민호", cert: "요양보호사 · 자격 만료 30일", area: "강남", load: "64%", rate: "4.7", state: "자격 확인", tone: "bad" },
  { name: "한서연", cert: "간호조무사 · 검진 대행 자격", area: "서초·동작", load: "88%", rate: "5.0", state: "활동중", tone: "ok" },
  { name: "오하늘", cert: "요양보호사 · BLS 갱신 필요", area: "마포", load: "41%", rate: "4.3", state: "재교육", tone: "warn" },
  { name: "윤태경", cert: "간호사 · 온보딩 교육중", area: "분당·판교", load: "—", rate: "—", state: "온보딩", tone: "info" },
];
export const SM_PROFILE = {
  name: "박지현",
  grade: "GOLD",
  sub: "간호사 · 상급종합 14년 · 누적 동행 412건 · 재지정률 68%",
  stats: [["누적 동행", "412건"], ["재지정률", "68%"], ["무사고", "412일"]],
  certs: [
    ["간호사 면허", "영구", "검증 완료", "ok"],
    ["심폐소생술 (BLS)", "2027-03", "유효", "ok"],
    ["범죄경력 조회", "2026-11", "유효", "ok"],
    ["운전면허 · 차량 보험", "2028-05", "유효", "ok"],
  ],
  tags: ["휠체어 이송", "순환기 동행", "투석 동행", "수어 기초", "치매 케어", "영어 소통"],
  hours: [["월", "8h"], ["화", "8h"], ["수", "4h"], ["목", "8h"], ["금", "8h"], ["토", "6h"], ["일", "휴"]],
  edu: [
    ["치매 케어 심화 과정", "이수 6/12", "완료"],
    ["응급 상황 대응 훈련", "이수 5/28", "완료"],
    ["PLATINUM 승급 과정", "8/14 예정", "신청됨"],
  ],
};
export const HIRE_FUNNEL = [
  { stage: "지원", n: 142, note: "제휴 요양기관·지인 추천 61%" },
  { stage: "서류 · 자격 확인", n: 78, note: "자격증 진위 조회 자동화" },
  { stage: "대면 면접", n: 41, note: "상황 판단 시나리오 6문항" },
  { stage: "신원 조회", n: 27, note: "탈락 사유 1위 · 예외 없음" },
  { stage: "교육 · 서약", n: 18, note: "경계선 교육 16시간 + 실습" },
  { stage: "현장 투입", n: 12, note: "부 동행으로 시작 · 12건 후 리드 승격" },
];
export const BG_GATES = [
  { k: "성범죄 경력 조회", law: "아동·청소년의 성보호에 관한 법률 · 노인복지법", v: "46 / 46", note: "전원 통과", tone: "ok" },
  { k: "노인학대 관련 범죄 경력", law: "노인복지법 제39조의17 · 취업제한", v: "46 / 46", note: "전원 통과", tone: "ok" },
  { k: "자격증 진위 · 행정처분 이력", law: "요양보호사 · 간호조무사 · 사회복지사", v: "44 / 46", note: "2건 갱신중", tone: "warn" },
  { k: "건강진단 · 결핵 검진", law: "감염병예방법 · 연 1회", v: "43 / 46", note: "3건 기한 임박", tone: "warn" },
  { k: "운전 경력 · 사고 이력 (차량 동행)", law: "차량 동행 배차 자격", v: "31 / 46", note: "차량 자격자", tone: "info" },
];
export const EDU_ITEMS = [
  { k: "무면허 의료행위 금지 서약", cycle: "입사 시 + 연 1회 재서약", v: "100%" },
  { k: "행위 경계선 교육 (의료법 27조)", cycle: "분기 2시간 · 사례 기반", v: "93%" },
  { k: "금품 수수 · 유인 알선 금지 교육", cycle: "반기 1시간 · 27조 3항", v: "96%" },
  { k: "개인정보 · 진료기록 취급 교육", cycle: "분기 1시간 · 21조 · 개인정보법", v: "98%" },
  { k: "응급 상황 대응 · BLS 실습", cycle: "연 1회 · 실기 평가 포함", v: "89%" },
];
export const SUPPLY_GAP = {
  days: ["월", "화", "수", "목", "금", "토", "일"],
  rows: [
    { area: "강남·서초", v: [1.2, 0.7, 1.1, 0.8, 1.0, 1.6, 2.1] },
    { area: "송파·강동", v: [1.0, 0.8, 1.3, 0.9, 1.1, 1.8, 2.3] },
    { area: "마포·서대문", v: [1.5, 1.2, 1.6, 1.3, 1.4, 2.0, 2.6] },
    { area: "분당·판교", v: [1.1, 1.0, 1.2, 1.1, 1.2, 1.7, 2.2] },
    { area: "일산·고양", v: [1.8, 1.5, 1.9, 1.6, 1.7, 2.4, 2.9] },
  ],
};
export const ATTRITION = [
  { name: "오하늘 · 마포", level: "높음", score: 82, why: "가동률 34% · 최근 4주 배차 6건 · 컴플레인 2건", act: "지점장 1:1 면담 · 권역 재배정 검토" },
  { name: "정민호 · 강동", level: "주의", score: 64, why: "자격 만료 임박 · 월 소득 전월 대비 −28%", act: "갱신 비용 지원 · 우선 배차 2주" },
  { name: "서다인 · 일산", level: "관찰", score: 48, why: "장거리 이동 누적 · 야간 배차 편중", act: "야간 비중 상한 적용" },
  { name: "박지현 · 강남", level: "안정", score: 12, why: "가동률 88% · 단골 가구 9곳 · 평점 4.9", act: "시니어 승급 대상" },
];
export const GRADE_TABLE = [
  { g: "시니어", n: 6, lead: "142,800", sup: "—", note: "주 동행 300건 + 평점 4.8 + 무사고 12개월 · 신입 지도 수당 300,000 · 프리미엄 동행 우선" },
  { g: "정규", n: 21, lead: "142,800", sup: "48,000", note: "주 동행 리드 자격 (부 동행 12건 + 평점 4.5) · 단골 가구 지분 배정 시작" },
  { g: "일반", n: 12, lead: "142,800", sup: "48,000", note: "주 동행 가능 (표준 동행 한정) · 응급·투석 동행은 부 동행으로만" },
  { g: "수습", n: 7, lead: "—", sup: "48,000", note: "부 동행 전담 · 주 동행 승격은 부 동행 12건 이후 · 최소 보장 적용" },
];
export const DISCIPLINE = [
  { level: "즉시 해지", k: "복약 직접 투여 (무면허 의료행위)", act: "계약 해지 · 고객 통지 · 재발 방지 교육 전사 실시", m: "3월", tone: "bad" },
  { level: "경고", k: "보호자 동의 없이 진료기록 사본 수령", act: "서면 경고 · 개인정보 교육 재이수 · 배차 2주 제한", m: "5월", tone: "warn" },
  { level: "경고", k: "특정 병원 방문 권유 (알선 소지)", act: "서면 경고 · 27조 3항 교육 · 해당 병원 배차 제외", m: "6월", tone: "warn" },
  { level: "주의", k: "리포트 기록 지연 3회 (24시간 초과)", act: "구두 주의 · 앱 리마인더 강제 적용", m: "7월", tone: "info" },
];
export const RETENTION_KPIS = [
  { k: "12개월 재계약률", v: "84%", note: "업계 평균 52% (건별 매칭 플랫폼)" },
  { k: "추천 유입 비중", v: "61%", note: "채용 퍼널 1위 채널 — 리텐션의 결과" },
  { k: "지분 수령 인원", v: "27명", note: "평균 4.2가구 · 월 299,000원" },
  { k: "정산 소요", v: "24시간", note: "동행 종료 → 입금" },
];
export const PAY_COMPARE = [
  { k: "건별 매칭 (경쟁사 · 단독 동행)", v: "2,856,000", note: "동행 20건 × 142,800 · 일이 끊기면 0원 · 혼자 감당", w: 55 },
  { k: "K-CARE 정규 (지분제 포함)", v: "3,565,600", note: "주 18 + 부 8 + 단골 6가구 지분 + 이동·대기 수당", w: 69 },
  { k: "K-CARE 시니어", v: "5,182,800", note: "동행 24건 + 단골 9가구 + 멘토 수당", w: 100 },
];
export const RETENTION_ITEMS = [
  { cat: "지분", key: true, k: "단골 가구 지분제", sub: "내가 맡은 가구는 내 자산이 된다", text: "담당 가구가 구독을 유지하는 동안 구독료의 8%를 매월 지속 지급. 6가구면 동행을 못 나간 달에도 427,200원이 들어옵니다.", cost: "구독 매출 8%", effect: "재계약률 +19%p" },
  { cat: "보장", key: true, k: "최소 보장 소득", sub: "비수기에도 바닥이 있다", text: "주 3일 이상 가용 등록 시 월 1,400,000원을 보장합니다. 배차가 모자란 달은 회사가 채웁니다.", cost: "월 평균 2.1명 발생", effect: "이탈 위험군 −34%" },
  { cat: "정산", key: false, k: "24시간 정산", sub: "월말까지 기다리지 않는다", text: "동행 종료 다음 날 입금. 급할 때는 당일 조기 지급(수수료 0원)도 신청할 수 있습니다.", cost: "운전자본 부담", effect: "지원자 문의 1위 항목" },
  { cat: "수당", key: false, k: "이동 · 대기 수당", sub: "공짜 노동을 없앤다", text: "편도 10km 초과 이동 건당 8,000원, 병원 대기 30분 초과 시 10분당 2,500원을 별도 지급합니다.", cost: "건당 평균 8,400", effect: "장거리 배차 수락률 +41%" },
  { cat: "자격", key: true, k: "자격 취득 전액 지원", sub: "일하면서 경력이 쌓인다", text: "요양보호사·사회복지사·BLS 교육비와 응시료 전액 지원, 취득 즉시 건당 단가 인상. 교육 시간도 유급으로 인정합니다.", cost: "1인 평균 84만원", effect: "급여사업(12) 인력 내부 조달" },
  { cat: "보호", key: true, k: "컨시어지 보호 정책", sub: "고객이 무조건 옳지는 않다", text: "폭언·성희롱·부당 요구 발생 시 즉시 배차 중단 및 고객 계약 해지. 법률 자문과 심리 상담 비용을 회사가 부담합니다.", cost: "연 계약 해지 3건", effect: "재계약률 기여 2위" },
  { cat: "가족", key: false, k: "본인 부모 케어 무상", sub: "내 부모도 같이 챙긴다", text: "6개월 근속 시 본인 부모에게 베이직 구독(월 안부콜·연 2회 동행)을 무상 제공합니다.", cost: "1인 월 8.2만원", effect: "장기 근속자 만족도 1위" },
  { cat: "추천", key: true, k: "동료 추천 보상", sub: "좋은 사람이 좋은 사람을 데려온다", text: "추천한 동료가 3개월 근속 시 추천인 50만원, 입사자 30만원. 인력 수급이 성장 상한이므로 CAC보다 싸고 이탈률도 낮습니다.", cost: "1인 80만원", effect: "채용 CAC 대비 −62%" },
];
export const PAY_SIM = [
  { g: "수습", mix: "부 18 · 주 0", v: "1,400,000", note: "동행 지급 864,000 · 최소 보장 보전 +536,000" },
  { g: "일반", mix: "부 14 · 주 12", v: "2,446,400", note: "동행 지급 2,184,000 · 수당 +120,000 · 지분 2가구 +142,400" },
  { g: "정규", mix: "부 8 · 주 18", v: "3,565,600", note: "동행 지급 2,954,400 · 수당 +184,000 · 지분 6가구 +427,200" },
  { g: "시니어", mix: "부 0 · 주 24", v: "5,182,800", note: "동행 지급 4,032,000 · 수당 +210,000 · 지분 9가구 +640,800 · 멘토 +300,000" },
];
export const GROWTH_PATH = [
  ["수습 → 일반", "부 동행 12건 + 교육 이수", "주 동행(리드) 자격 획득 — 건당 48,000 → 142,800"],
  ["일반 → 정규", "주 동행 80건 + 평점 4.5", "단골 가구 지분 배정 시작 — 소득 구조가 바뀌는 지점"],
  ["정규 → 시니어", "주 동행 300건 + 무사고 12개월", "신입 지도 수당 · 프리미엄 동행 우선 배정"],
  ["시니어 → 교육 강사 · 지점", "지도 실적 + 본인 희망", "교육원 강사 또는 신규 권역 지점 운영 — 현장을 떠나지 않고 올라가는 경로"],
];
export const PROTECT_RULES = [
  ["단독 동행 금지", "모든 동행은 2인 1조 · 짝이 없으면 배차하지 않음 · 고객 요청으로도 축소 불가"],
  ["폭언 · 성희롱 발생 시", "두 사람이 함께 현장 이탈 · 해당 건 수당 전액 지급 · 2인 진술로 고객 계약 해지"],
  ["직무 범위 밖 요구 (의료행위 · 가사)", "거절이 원칙 · 거절로 인한 불이익 없음 · 평점 반영 제외"],
  ["사고 발생 시", "배상책임보험이 1차 · 개인에게 구상하지 않음 (고의·중과실 제외)"],
  ["고객 평점 이의 신청", "단일 저평점은 자동 반영 보류 · 지점장 검토 후 확정"],
  ["취소 · 노쇼", "고객 귀책 당일 취소는 수당 50% 지급 · 이동 중이면 100%"],
];
export const PAIR_WHY = [
  ["동행자 보호", "성희롱 · 폭언의 목격자", "단둘이 있는 상황 자체를 만들지 않습니다. 발생 시 즉시 두 사람이 함께 이탈하고, 진술이 두 개 남습니다."],
  ["고객 보호", "도난 · 금품 의혹 차단", "어르신 가정에서 물건이 없어졌다는 의혹은 증명도 반증도 어렵습니다. 2인 동시 입실이 양쪽을 지킵니다."],
  ["안전", "낙상 · 응급 시 2인 대응", "한 명이 어르신을 지키는 동안 다른 한 명이 119 신고와 가족 연락을 맡습니다 — 혼자서는 둘 다 못 합니다."],
  ["컴플라이언스", "무면허 의료행위 상호 감시", "“약 좀 먹여달라”는 요청을 혼자서는 거절하기 어렵습니다. 짝이 있으면 원칙이 지켜집니다."],
];
export const PAIR_RULES = [
  "동성 페어를 우선 배정하되, 어르신 성별과 동일한 성별이 최소 1명 포함되도록 강제",
  "같은 페어가 4회 연속 배정되지 않도록 순환 — 담합·유착 방지",
  "수습은 반드시 부 동행으로만 시작 · 주 동행 승격은 부 동행 12건 이후",
  "짝을 찾지 못하면 예약 자체를 받지 않음 — 단독 배차로 대체하지 않음",
  "가족 요청이 있어도 1인 동행으로 축소 불가 · 요금 할인 항목이 아님",
];
export const PAIR_STATS = [
  { k: "2인 1조 적용률", v: "100%", note: "단독 배차 0건 · 예외 승인 절차 없음" },
  { k: "성희롱 · 폭언 신고", v: "2건", note: "모두 2인 진술 확보 · 고객 계약 해지" },
  { k: "건당 인건비 증가", v: "+48,000", note: "단가 168,000 → 218,000으로 반영" },
  { k: "배차 실패율", v: "3.1%", note: "짝 미매칭 — 수급 갭 구간에 집중" },
];

// ════ 경영 · 리스크 · 컴플라이언스 (거버넌스) ════
export const RC_KPIS = [
  { k: "CRITICAL", v: "4", color: "#C0392B" },
  { k: "HIGH", v: "11", color: "#8A5D12" },
  { k: "완화 완료", v: "61%", color: "#1E7A5A" },
  { k: "보험 손해율", v: "61%", color: "#0A1F3C" },
];
export const MEDLAW_ROWS = [
  { law: "의료법 제27조", sub: "무면허 의료행위 금지", touch: "동행 중 복약·혈압 측정·상처 처치 요청", how: "컨시어지 직무를 이동·소통·기록으로 한정 · 측정값 판단 및 투약 금지 · 앱에서 해당 항목 입력 자체를 차단", verdict: "준수", tone: "ok" },
  { law: "의료법 제27조 3항", sub: "환자 유인 · 알선 금지", touch: "수익원 05 병원연계 수수료 (건별 성과 연동)", how: "현재 구조는 소개 대가로 해석될 위험 — 광고·행정 용역 계약으로 전환 필요", verdict: "위반 소지", tone: "bad" },
  { law: "의료법 제17조", sub: "진단서 등 작성 · 교부", touch: "동행 리포트 · AI 케어 리포트", how: "관찰 사실과 의료진 발언 인용만 기재 · 소견·진단·예후 표현 금지 · AI 초안에 차단 필터 적용", verdict: "준수", tone: "ok" },
  { law: "의료법 제21조", sub: "진료기록 열람 · 사본 발급", touch: "보호자 대신 검사 결과·기록 수령", how: "환자 본인 위임장 + 신분 확인 서류 원본 지참 · 컨시어지 단독 수령 금지 · 미비 시 동행 취소", verdict: "조건부", tone: "warn" },
  { law: "의료법 제33조", sub: "의료기관 개설 자격", touch: "원격 진료 대행 · 파트너 의원 연계", how: "의료기관 개설·운영·수익 배분 일절 없음 · 플랫폼은 예약·이동·기록 지원에 한정", verdict: "준수", tone: "ok" },
  { law: "의료법 제56조", sub: "의료광고 심의", touch: "제휴 병원 노출 · 앱 내 병원 안내", how: "병원 정보는 공공 데이터 기반 사실 표기만 · 치료 효과·비교 우위 표현 금지 · 광고 게재 시 사전 심의 필수", verdict: "조건부", tone: "warn" },
  { law: "약사법 제23조 · 제50조", sub: "조제 · 의약품 판매", touch: "처방약 대리 수령 · 전달", how: "약사 대면 복약지도 원칙 · 대리 수령은 법정 요건 충족 건만 · 의약품 재판매·분할·보관 금지", verdict: "조건부", tone: "warn" },
  { law: "응급의료법 제6조", sub: "응급처치 · 이송", touch: "동행 중 응급 상황 발생", how: "119 신고 및 인계까지가 직무 · CPR은 선의의 응급의료 면책 범위 내 · 자체 이송·처치 금지", verdict: "준수", tone: "ok" },
];
export const MEDLAW_FIX = {
  title: "최우선 시정 · 의료법 제27조 제3항 — 수익원 05 병원연계를 ‘소개 대가’로 두면 알선입니다",
  why: "국내 환자를 특정 의료기관에 소개하고 그 대가를 받는 구조는 형사처벌 대상입니다. 건당·성사 연동 수수료는 명칭이 무엇이든 알선으로 해석될 위험이 큽니다.",
  steps: [
    "건별·성사 연동 수수료를 폐지하고 월정액 광고·행정 지원 용역료로 전환",
    "계약서 목적 조항에서 “환자 소개”를 삭제하고 예약 행정·기록 연동·홍보 대행으로 특정",
    "어르신에게 병원 선택지를 2곳 이상 제시하고 선택 근거를 기록 — 유도 정황 차단",
    "외국인 환자는 유치업 등록 완료 전까지 수수료 수취 자체를 하지 않음 (C2와 연동)",
    "전환 전까지 05번 매출을 잠정 중단하고 법률 자문 의견서를 확보 (선결 사항 등록)",
  ],
};
export const FIELD_CAN = [
  "병원 예약 · 접수 · 수납 대행",
  "이동 · 보행 부축 · 휠체어 이동 보조",
  "의료진 설명을 듣고 그대로 기록 · 전달",
  "약 봉투 수령 후 보관함까지 전달 (복용은 본인)",
  "복약 시간 알림 · 복용 여부 확인 질문",
  "이상 징후 발견 시 119 · 가족 · 관제 즉시 연락",
];
export const FIELD_CANT = [
  "약을 직접 입에 넣어 드리거나 주사·투약",
  "혈압 · 혈당 측정값을 보고 판단 · 조언",
  "상처 소독 · 드레싱 · 카테터 · 흡인 처치",
  "“이 병원이 좋다”는 특정 의료기관 권유",
  "리포트에 소견 · 진단명 · 예후 기재",
  "보호자 위임 없이 진료기록 사본 수령",
];
// 리스크 레지스터 — prob/impact: 1 낮음 · 2 중간 · 3 높음(치명)
export const RISK_REGISTER = [
  { id: "C1", name: "응급 대응 실패", detail: "발생 낮음 × 영향 치명 · 플랫폼 존립", act: "다중 채널 알림 이중화 · 60초 KPI 감시 · 119 연계 매뉴얼 정형화", owner: "관제총괄", state: "완화됨", prob: 1, impact: 3 },
  { id: "C2", name: "외국인환자 유치업 미등록 영업", detail: "발생 중간 × 영향 치명 · 형사 리스크", act: "보건복지부 등록 완료 전 인바운드 영업 전면 차단", owner: "법무", state: "미완화", prob: 2, impact: 3 },
  { id: "C3", name: "유전정보 보험 인수 활용 (생명윤리법 제46조)", detail: "발생 낮음 × 영향 치명 · 형사처벌·사업 중단", act: "유전 리포트 DB와 보험 심사 시스템 물리 분리 · 조인 차단 · 접근 시 CPO 알림", owner: "CPO · 법무", state: "미완화", prob: 1, impact: 3 },
  { id: "C4", name: "국내 환자 유인 · 알선 (의료법 제27조 3항)", detail: "발생 중간 × 영향 치명 · 형사처벌·수익원 중단", act: "수익원 05를 건별 소개 대가에서 월정액 광고·행정 용역으로 전환 · 전환 전까지 수수료 수취 중단 · 법률 의견서 확보", owner: "법무 · 제휴", state: "미완화", prob: 2, impact: 3 },
  { id: "H1", name: "개인정보 유출 · 국외 이전 위반", detail: "발생 낮음 × 영향 큼 · 과징금·신뢰", act: "전 구간 암호화 · 국외 이전 동의 분리 · 분기 CPO 감사", owner: "CPO", state: "완화됨", prob: 1, impact: 2.6 },
  { id: "H2", name: "AI 의료법 위반 (진단·처방)", detail: "발생 중간 × 영향 큼 · 행정처분", act: "표현 차단 필터 · 도구 호출 강제 · 자격자 검수 없이는 미발송", owner: "AI리드", state: "완화됨", prob: 2, impact: 2.6 },
  { id: "H3", name: "컨시어지 공급 부족", detail: "발생 높음 × 영향 큼 · 매출 직결", act: "지역별 수급 갭 상시 감시 · 정산 주간화 · 등급 사다리", owner: "운영총괄", state: "진행중", prob: 3, impact: 2.6 },
  { id: "H4", name: "보험 무자격 모집 · 부당 권유", detail: "발생 중간 × 영향 큼 · 등록취소·과태료", act: "GA 자회사 설립 후에만 모집 · 설계사 자격자만 청약 · 컨시어지는 연결만", owner: "법무", state: "진행중", prob: 2, impact: 2.6 },
  { id: "H5", name: "상조 선수금 미보전 · 제휴사 부실", detail: "발생 중간 × 영향 큼 · 소비자 피해 전가", act: "공정위 등록·선수금 50% 예치 확인된 업체만 제휴 · 반기 재무 실사", owner: "제휴총괄", state: "진행중", prob: 2, impact: 2.5 },
  { id: "H6", name: "데이터 판매 재식별 · 동의 범위 초과", detail: "발생 낮음 × 영향 큼 · 과징금·신뢰 붕괴", act: "가명처리 적정성 외부 검증 · 목적별 분리 동의 · 계약상 재식별 금지 및 감사권", owner: "CPO", state: "진행중", prob: 1, impact: 2.5 },
  { id: "H7", name: "무인증 가사서비스 제공 (가사근로자법)", detail: "발생 중간 × 영향 큼 · 과태료·분쟁", act: "제공기관 인증 취득 또는 인증 기관 제휴 확정 전까지 청소·세탁 정기권 파일럿 한정", owner: "인사 · 법무", state: "미완화", prob: 2, impact: 2.4 },
  { id: "H8", name: "급여 청구 오류 · 부당청구 환수", detail: "발생 중간 × 영향 큼 · 환수·지정취소", act: "자격·한도·수급기간 사전 검증 강제 · 한도 초과 자동 보류 · 월 내부 감사", owner: "급여사업", state: "설계완료", prob: 2, impact: 2.4 },
  { id: "H9", name: "고령 고객 렌탈 다년 약정 불완전판매 분쟁", detail: "발생 중간 × 영향 큼 · 브랜드 신뢰 훼손", act: "가족 보호자 확인 필수화 · 설명 이력·동의 기록 · 렌탈 인센티브 비중 상한(최저)", owner: "법무 · 운영", state: "설계완료", prob: 2, impact: 2.3 },
  { id: "H10", name: "계약 중개 판매 자격 미비 상태 착수", detail: "발생 낮음 × 영향 큼 · 사전 승낙 위반", act: "취급 범위별 자격 요건 법률 검토 확정 전까지 점검·안내만 수행, 전환 중개 보류", owner: "법무", state: "검토중", prob: 1, impact: 2.3 },
  { id: "H11", name: "가정 내 성희롱 · 폭언 · 금품 의혹 (양방향)", detail: "발생 중간 × 영향 큼 · 브랜드 존립·형사", act: "2인 1조 배차 예외 없이 강제 · 짝 미매칭 시 예약 거부 · 2인 진술 기록 · 고객 계약 해지 권한", owner: "운영 · 법무", state: "완화됨", prob: 2, impact: 2.7 },
  { id: "H12", name: "심리 모니터링 중 무자격 상담 개입 (수익원 21)", detail: "발생 중간 × 영향 큼 · 위탁 취소·행정처분", act: "행위 범위를 발굴·모니터링·연계·동행으로 고정 · 상담 발화 금지 교육 · 유자격자 배치", owner: "운영 · 법무", state: "검토중", prob: 2, impact: 2.4 },
  { id: "H13", name: "상속·법률사무 유상 알선 (변호사법 제109조)", detail: "발생 낮음 × 영향 큼 · 7년 이하 징역 또는 5천만원 이하 벌금", act: "전문가 연결은 무보수 원칙 · 소개료·성공보수·구독 배분 전면 금지 · 유상 대행은 사후 행정 절차로 한정", owner: "법무", state: "설계완료", prob: 1, impact: 2.7 },
  { id: "M1", name: "VASP 신고 의무 발생", detail: "발생 중간 × 영향 중간", act: "직접 수탁·매매 금지 · 라이선스 PSP 위탁 구조 고정", owner: "법무", state: "설계완료", prob: 2, impact: 2 },
  { id: "M2", name: "외부 API 장애 (케이웨더·PG)", detail: "발생 중간 × 영향 중간", act: "룰 기반 폴백 가이드 · 캐시된 최근값 표기 · 수동 전환", owner: "CTO", state: "완화됨", prob: 2, impact: 1.9 },
  { id: "M3", name: "대기업 시장 진입", detail: "발생 높음 × 영향 중간", act: "진화형 케어 프로필 데이터 해자 · 지자체 장기 계약 선점", owner: "전략", state: "모니터링", prob: 3, impact: 1.9 },
  { id: "B1", name: "재가급여 저마진이 전사 수익성 희석", detail: "발생 높음 × 영향 중간 · 총이익률 13.4%", act: "단독 손익이 아닌 12개월 누적 기여로 평가 · 전환율 미달 시 확장 중단", owner: "경영 · 재무", state: "모니터링", prob: 3, impact: 1.8 },
  { id: "B2", name: "플랫폼 고객사의 자체 구축 이탈", detail: "발생 중간 × 영향 중간 · 라이선스 MRR", act: "AI 리포트·환경 데이터 등 복제 비용 큰 모듈을 계약 핵심에 배치 · 다년 계약", owner: "전략 · 개발", state: "모니터링", prob: 2, impact: 1.8 },
  { id: "B3", name: "자체 렌탈 자산 보유 시 운전자본·회수 지연", detail: "발생 낮음 × 영향 중간 · 현금흐름", act: "1단계 대리점형 유지 · 계정 규모와 캐피탈 연계 확보 전 3단계 진입 금지", owner: "경영 · 재무", state: "모니터링", prob: 1, impact: 1.8 },
];
export const RISK_STATE_STYLE = {
  완화됨: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  진행중: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  설계완료: { fg: "#7A5C28", bg: "rgba(176,141,87,.16)" },
  미완화: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  검토중: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
  모니터링: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};
export const INSURANCE_ROWS = [
  { k: "영업배상책임보험", sub: "동행 중 대인·대물 사고", v: "건당 1억" },
  { k: "전문직업배상책임", sub: "간호·요양 행위 관련 과실", v: "건당 5천만" },
  { k: "컨시어지 산재보험", sub: "전원 가입 · 이동 중 재해 포함", v: "법정 한도" },
  { k: "차량 동행 종합보험", sub: "제휴 차량 · 자차 운행 특약", v: "무한" },
];
export const REG_CALENDAR = [
  { m: "이달", k: "병원연계 계약 구조 전환 (알선 → 광고·행정 용역)", law: "의료법 제27조 3항 · 수익원 05", state: "착수 필요", tone: "bad" },
  { m: "8월", k: "개인정보 영향평가 (PIA)", law: "건강 민감정보 대량 처리", state: "진행중", tone: "warn" },
  { m: "9월", k: "외국인환자 유치업 등록", law: "의료 해외진출법", state: "서류 준비", tone: "warn" },
  { m: "10월", k: "CPO 분기 내부 감사", law: "개인정보보호법", state: "예정", tone: "info" },
  { m: "11월", k: "사회서비스 제공기관 갱신", law: "지자체 계약 요건", state: "예정", tone: "info" },
  { m: "12월", k: "의료광고 사전심의 갱신", law: "의료법 · 소재 전량", state: "예정", tone: "info" },
  { m: "내년 1월", k: "GA(법인보험대리점) 등록", law: "보험업법 · 모집 자격", state: "검토중", tone: "info" },
  { m: "내년 1월", k: "렌탈 약관 사전 법률 검토", law: "방문판매법·약관법 · 수익원 18", state: "진행중", tone: "warn" },
  { m: "내년 2월", k: "가명정보 적정성 외부 검증", law: "개인정보보호법 제28조의2", state: "검토중", tone: "info" },
  { m: "내년 3월", k: "장기요양기관 지정 신청", law: "노인장기요양보험법 · 수익원 12", state: "경영 결정 대기", tone: "warn" },
  { m: "내년 3월", k: "통신·방송 상품 판매 사전 승낙", law: "전기통신사업법 · 수익원 19", state: "취급 범위 확정 대기", tone: "info" },
  { m: "내년 3월", k: "반려동물 장례식장 등록 확인 · 위탁 계약", law: "동물보호법 제73조 · 수익원 20", state: "제휴처 실사 필요", tone: "info" },
  { m: "내년 4월", k: "가사서비스 제공기관 인증", law: "가사근로자법 · 수익원 16", state: "취득 vs 제휴 미정", tone: "warn" },
  { m: "내년 4월", k: "심리 모니터링 행위 범위 확정 · 유자격자 배치", law: "정신건강복지법 · 수익원 21", state: "법률 검토 필요", tone: "warn" },
  { m: "내년 5월", k: "복지용구 사업소 지정", law: "장기요양 급여 · 수익원 15", state: "재가급여 후행", tone: "info" },
];

// ════ 경영 · 지점 현황 (다지점 통합) ════
// 합계 정합성: 가구 68+34+18+8=128(가입 가구) · 인력 21+12+8+5=46(인원 관리 전체 인력)
// 권역은 SUPPLY_GAP(수급 갭)과 동일 축. 지점 비교는 케어 품질·안전 지표만 — 판매액 순위 금지 (원칙 1).
export const BRANCH_TOTALS = [
  { k: "운영 지점", v: "4", note: "+ 오픈 준비 1 (일산·고양)" },
  { k: "총 가입 가구", v: "128", note: "본점 68 · 지점 60" },
  { k: "총 컨시어지", v: "46", note: "수습 7 포함" },
  { k: "전 지점 페어 준수", v: "100%", note: "단독 배차 0 · 예외 없음" },
];
export const BRANCHES = [
  { name: "강남 본점", area: "강남·서초", state: "안정", tone: "ok", hq: true, open: "2025-03",
    homes: 68, staff: 21, load: "82%", rate: "4.8", nps: 64, jobs: "6건", sos: "0", unmatch: "1",
    issue: "화·목 오전 수급 갭 0.7 — 채용 2명 진행 중" },
  { name: "송파지점", area: "송파·강동", state: "주의", tone: "warn", hq: false, open: "2025-09",
    homes: 34, staff: 12, load: "76%", rate: "4.7", nps: 61, jobs: "4건", sos: "0", unmatch: "2",
    issue: "화 0.8 수급 갭 + 투석 자격자 1명 — 크로스 지원 운영" },
  { name: "마포지점", area: "마포·서대문", state: "주의", tone: "warn", hq: false, open: "2026-04",
    homes: 18, staff: 8, load: "71%", rate: "4.6", nps: 58, jobs: "2건", sos: "0", unmatch: "0",
    issue: "오픈 90일 · 수습 비중 50% — 시니어 코치 주 2회 파견" },
  { name: "분당지점", area: "분당·판교", state: "관찰", tone: "info", hq: false, open: "2026-06",
    homes: 8, staff: 5, load: "64%", rate: "4.9", nps: 66, jobs: "1건", sos: "0", unmatch: "0",
    issue: "오픈 45일 · 첫 30일 온보딩 가구 리텐션 집중 관리" },
  { name: "일산·고양", area: "일산·고양", state: "오픈 준비", tone: "prep", hq: false, open: "2026-10 예정",
    homes: 0, staff: 0, load: "—", rate: "—", nps: null, jobs: "—", sos: "—", unmatch: "—",
    issue: "10월 오픈 목표 — 아래 오픈 파이프라인 진행 중" },
];
export const BRANCH_ALERTS = [
  { branch: "송파", level: "주의", text: "화·목 수급 갭 0.8~0.9 지속 — 신규 채용 공고 + 강남 크로스 지원 주 4건", act: "채용 2명 서류 단계 · 8월 해소 목표" },
  { branch: "마포", level: "주의", text: "수습 비중 50% (4/8) — 고난도 배차 불가 구간 발생", act: "시니어 코치 파견 주 2회 · 9월 일반 전환 3명 예정" },
  { branch: "분당", level: "관찰", text: "오픈 45일 · NPS 66으로 양호 — 첫 30일 이탈 구간 통과 가구 6/8", act: "온보딩 플레이북 유지 · 추가 개입 없음" },
  { branch: "전사", level: "안정", text: "전 지점 페어 준수 100% · SOS 0건 (이번 주) — 원칙 위반 지점 없음", act: "—" },
];
export const BRANCH_OPEN_STEPS = [
  ["상권 · 수요 분석", "완료", "고령 인구 밀도 · 병원 접근성 · 경쟁 분석"],
  ["지점장 채용", "완료", "요양기관 운영 경력 12년"],
  ["컨시어지 채용", "진행 8/12", "지원 34명 · 신원 조회 통과 8명"],
  ["교육 · 서약", "예정", "경계선 교육 16시간 + 케어 서약 — 9월 2주"],
  ["병원 제휴", "진행 2/4", "일산백병원 · 국민건강보험 일산병원 협의 중"],
  ["오픈", "10월 목표", "첫 달 목표 12가구 · 본점 시니어 2명 파견"],
];
export const BRANCH_SUPPORT = [
  { who: "서다인 (강남)", to: "일산 오픈 준비 지원", note: "장거리 이동 누적 — 야간 비중 상한 적용 중 (이탈 위험 관찰과 연동)" },
  { who: "한서연 (강남)", to: "마포 시니어 코치 파견", note: "주 2회 · 수습 4명 페어 코칭 — 코칭 수당 지급" },
  { who: "정민호 (강동)", to: "송파 투석 동행 크로스 지원", note: "주 4건 — 송파 투석 자격자 채용 시 종료" },
];

// ════ 경영 · 지점장 관리 + 사람 관리 정돈 (AI 사람 신호 · 체계 맵) ════
// 지점장 평가도 사람 지표만 — 팀 유지율·팀 평점·소리 응답 SLA·페어 준수 (판매액 없음).
export const BRANCH_MANAGERS = [
  { name: "김태영", branch: "강남 본점", career: "재가요양센터 운영 9년", tenure: "17개월", team: 21, homes: 68,
    keep: "91%", rate: "4.8", sla: "21h", focus: "화·목 수급 갭 채용 마감 · 크로스 지원자 피로 관리", state: "안정", tone: "ok" },
  { name: "이정란", branch: "송파지점", career: "간호사 출신 · 병동 관리 8년", tenure: "10개월", team: 12, homes: 34,
    keep: "84%", rate: "4.7", sla: "19h", focus: "투석 자격자 채용 · 크로스 지원 8월 종료", state: "주의", tone: "warn" },
  { name: "박성호", branch: "마포지점", career: "사회복지사 · 노인복지관 7년", tenure: "4개월", team: 8, homes: 18,
    keep: "88%", rate: "4.6", sla: "24h", focus: "수습 4명 9월 일반 전환 · 오하늘 1:1 면담", state: "주의", tone: "warn" },
  { name: "최윤희", branch: "분당지점", career: "본점 시니어 코치 출신 (내부 승격)", tenure: "2개월", team: 5, homes: 8,
    keep: "100%", rate: "4.9", sla: "12h", focus: "온보딩 가구 첫 30일 통과 · 지역 병원 제휴 1곳 추가", state: "안정", tone: "ok" },
  { name: "강혜원", branch: "일산·고양 (오픈 준비)", career: "요양기관 운영 12년", tenure: "온보딩 교육 중", team: 0, homes: 0,
    keep: "—", rate: "—", sla: "—", focus: "컨시어지 채용 면접 · 병원 제휴 협의 동석 · 9월 합류", state: "온보딩", tone: "prep" },
];
export const MGR_RHYTHM = [
  ["주간 1:1", "이탈 위험군·수습 대상 개별 면담 — AI가 대상을 추천하고 면담은 지점장이 한다"],
  ["월간 지점장 회의", "지점 간 이슈·크로스 지원 조정 · 오픈 준비 점검 — 판매 실적 안건 금지"],
  ["분기 캘리브레이션", "지점 간 평점·코칭 기준 맞추기 — 같은 케어가 지점마다 다르게 평가되지 않도록"],
];
export const MGR_CAN = [
  "AI 배차안 승인 (L4) · 페어 편성 조정",
  "코칭 로그 작성 · 수습 전환 상신",
  "자격 갱신 · 교육 배정 승인",
  "현장의 소리 1차 답변 (48h SLA)",
  "고객 귀책 취소 수당 승인",
];
export const MGR_CANT = [
  "평점 · 가족 만족도 수정",
  "단독 배차 예외 승인 (권한 자체가 없음)",
  "EAP 심리상담 이용 기록 열람",
  "판매 목표 부여 · 커머스 실적 지시",
  "리포트 내용 수정 (검수 반려만 가능)",
];
// AI 사람 신호 — 흩어진 신호(가동률·컴플레인·소리·자격·소득·피로)를 교차해 제안까지만.
// 면담·배정·징계 등 인사 결정은 항상 사람 (L4 인사 원칙).
export const AI_PEOPLE_SIGNALS = [
  { id: "ps1", who: "오하늘 (마포 · 수습)", cross: "가동률 34% + 어르신 응대 피드백 2건 + '지쳐요' 체크인 — 3개 신호 교차",
    suggest: "지점장 1:1 면담 + 권역 재배정 검토 · 시니어 코치 페어 유지", owner: "박성호 지점장", menu: "staffmgmt", menuLabel: "인원 관리 · 이탈 위험" },
  { id: "ps2", who: "정민호 (송파 크로스)", cross: "요양보호사 자격 만료 D-30 + 월 소득 −28% — 이탈 위험 64 상승 교차",
    suggest: "갱신 비용 전액 지원 + 우선 배차 2주 · 갱신 완료 시 배차 제한 예약 해제", owner: "이정란 지점장", menu: "staffmgmt", menuLabel: "인원 관리 · 자격" },
  { id: "ps3", who: "서다인 (강남 → 일산 지원)", cross: "크로스 지원 3주 연속 + 야간 편중 + 이동 거리 누적 — 피로 신호",
    suggest: "야간 비중 상한 적용 + 지원 순환 교대 편성 (본점 시니어 2명 로테이션)", owner: "김태영 지점장", menu: "branches", menuLabel: "지점 현황 · 크로스 지원" },
  { id: "ps4", who: "마포지점 (조직 신호)", cross: "수습 비중 50% — 고난도 배차 공백 + 지점장 신임 4개월 교차",
    suggest: "시니어 코치 파견을 9월 전환(3명)까지 연장 · 투석 배차는 송파 크로스 유지", owner: "본점 코치팀", menu: "staff", menuLabel: "컨시어지 분석 · 코칭" },
];
export const AI_PEOPLE_SPLIT = {
  ai: ["이탈 위험 스코어 — 요인·가중치 공개", "수급 갭 · 배차 부하 예측", "코칭 대상 추천 · 1:1 브리핑 초안", "안부콜 · 현장의 소리 신호 교차 감지"],
  human: ["채용 합격 · 계약 체결", "평가 확정 · 승급 · 등급", "징계 · 계약 종료", "면담 · 재배정 · 파견 실행"],
};
// 사람 관리 체계 맵 — 단계별로 어느 화면이 담당하는지 (메뉴 점프)
export const PEOPLE_MAP = [
  { stage: "채용 · 등록", what: "채용 파이프라인 · 신원 게이트 5종 · 앱 온보딩 서약", menu: "staffmgmt", label: "인원 관리" },
  { stage: "온보딩 · 수습", what: "교육 2일 · 시니어 페어 · 부 동행 12건 전환 게이트", menu: "staff", label: "컨시어지 분석" },
  { stage: "일상 운영", what: "배차 승인(L4) · 페어 준수는 관제 — 경영은 지점 집계만", menu: "branches", label: "지점 현황" },
  { stage: "성장 · 보상", what: "등급 사다리 · 단골 가구 지분제 · 코칭 로그", menu: "staffmgmt", label: "인원 관리" },
  { stage: "보호 · 유지", what: "현장의 소리 · EAP(무기록) · 이탈 위험 예측 · HR 워치", menu: "staff", label: "컨시어지 분석" },
];

// ════ 경영 · 보안 · 데이터 거버넌스 (질병·민감 프로필 보호 체계) ════
// 원칙: 민감정보는 "덜 모으고 · 짧게 두고 · 좁게 열고 · 전부 기록"한다.
export const SEC_KPIS = [
  { k: "민감정보 등급", v: "4단계", note: "S1 건강 · S2 식별 · S3 운영 · S4 공개" },
  { k: "접근 기록 공개율", v: "100%", note: "전 열람 가족 공개 — 해자" },
  { k: "동의 유효율", v: "97%", note: "만료 D-30 자동 갱신 루프" },
  { k: "침해 신고 SLA", v: "72h", note: "개인정보보호법 · CPO 직보" },
];
export const SEC_CLASSES = [
  { grade: "S1 민감 (건강)", tone: "bad", examples: "복약 · 병력 · 안부콜 정서/인지 분석 · 워치 생체 · 케어 프로필 신뢰도 항목",
    store: "필드 레벨 암호화 (AES-256) · 별도 키", access: "담당 컨시어지(당일 배차분) · 관제 · 주치의 연계 시 본인 동의", keep: "케어 계약 종료 후 1년 → 파기" },
  { grade: "S2 식별 (개인)", tone: "warn", examples: "이름 · 연락처 · 동 단위 주소 · 보호자 관계 · 결제 수단",
    store: "저장 시 암호화 · 마스킹 기본 표시", access: "역할별 최소 권한 (아래 매트릭스)", keep: "계약 종료 후 5년 (전자상거래법) → 파기" },
  { grade: "S3 운영 (케어 기록)", tone: "info", examples: "배차 · 리포트(검수본) · 감사 로그 · 코칭 로그",
    store: "표준 암호화 (전송 TLS 1.3 + 저장)", access: "관제 · 지점장 · 경영(집계만)", keep: "3년 — 분쟁 대응 근거" },
  { grade: "S4 공개 (비개인)", tone: "ok", examples: "날씨 · 동네 정책 피드 · 병원 공개 정보 · 용어 사전",
    store: "일반 저장", access: "전 역할", keep: "상시" },
];
// 역할 × 데이터 접근 매트릭스 — ●열람 ◐제한(담당·집계만) ✕차단
export const SEC_MATRIX = {
  cols: ["S1", "S2", "S3", "EAP"],
  rows: [
    { role: "어르신 본인", v: ["●", "●", "◐", "✕"], note: "본인 정보 전체 · 운영은 본인 관련만" },
    { role: "보호자 (주)", v: ["●", "●", "◐", "✕"], note: "가구 범위 · 열람도 기록·공개" },
    { role: "컨시어지", v: ["◐", "◐", "◐", "✕"], note: "당일 배차 가구만 · 브리프로 최소 전달" },
    { role: "관제", v: ["◐", "●", "●", "✕"], note: "케어 수행 목적 한정 · 전 열람 기록" },
    { role: "지점장", v: ["✕", "◐", "●", "✕"], note: "건강 상세 차단 · 팀 운영 기록만" },
    { role: "경영", v: ["✕", "✕", "◐", "✕"], note: "집계만 — 개별 레코드 접근 권한 없음" },
    { role: "AI (안부콜·챗)", v: ["◐", "✕", "◐", "✕"], note: "가명 ID 컨텍스트만 · 실명·연락처 미주입" },
  ],
  foot: "EAP 심리상담 기록은 열이 아니라 원칙입니다 — 어떤 역할도 열람할 수 없고, 외부 기관에만 존재합니다.",
};
export const SEC_TECH = [
  { k: "전송 구간", v: "TLS 1.3 강제 · HSTS", note: "평문 전송 경로 없음" },
  { k: "저장 암호화", v: "AES-256 · S1은 필드 레벨", note: "DB 유출 시에도 민감 컬럼 별도 키" },
  { k: "키 관리", v: "KMS 분리 보관 · 분기 로테이션", note: "키와 데이터를 같은 곳에 두지 않음" },
  { k: "백업", v: "암호화 백업 · 30일 보존", note: "복구 리허설 분기 1회" },
  { k: "앱 헤더", v: "CSP · nosniff · frame 차단", note: "허용 출처: 폰트·지도 타일뿐" },
  { k: "API", v: "입력 검증 → 레이트 리밋 → no-store", note: "IP당 분당 20회 · 캐시 금지" },
];
export const SEC_AI_RULES = [
  "AI 컨텍스트에는 가명 ID만 주입 — 실명 · 연락처 · 상세 주소는 프롬프트에 넣지 않는다",
  "프롬프트 · 응답을 모델 학습에 사용하지 않는 계약 조건 (Zero Data Retention 협의)",
  "AI 출력에 진단 · 처방 표현 차단 필터 — 자격자 검수 없이는 가족에게 미발송",
  "안부콜 원음성은 72시간 후 파기 — 텍스트 요약과 신호만 프로필에 남긴다",
  "AI 접근도 감사 로그 대상 — 어떤 데이터가 컨텍스트로 나갔는지 기록",
];
export const SEC_LIFECYCLE = [
  ["수집", "목적별 분리 동의 · 최소 수집 — 위치는 근무 중만, 건강은 케어 필요 항목만"],
  ["이용", "역할별 최소 권한 + 당일 배차 게이팅 · 전 열람 실시간 기록 · 가족 공개"],
  ["보관", "등급별 암호화 · 키 분리 · 접근 없는 계정 90일 자동 잠금"],
  ["제공", "제3자 제공 없음 기본 — 병원 연계는 본인 동의 건별 · 보험 심사와 물리 분리(C3)"],
  ["파기", "등급별 보존 기한 도래 시 자동 파기 · 파기 이력도 감사 로그에 기록"],
];
export const SEC_INCIDENT = [
  ["감지 · 차단", "이상 접근 탐지 → 해당 계정 · 기능 즉시 차단 (킬 스위치)", "즉시"],
  ["내부 보고", "CPO 직보 · 영향 범위 산정 (누구의 어떤 등급 데이터인가)", "1h"],
  ["당국 신고", "개인정보보호위원회 신고 — 지체 없이", "72h"],
  ["본인 통지", "영향 가구에 앱 · 문자 통지 + 조치 안내 — 숨기지 않는 것이 신뢰 해자", "72h"],
  ["재발 방지", "원인 분석 · 통제 보강 · 전사 공유 — 감사 로그로 전 과정 증빙", "2주"],
];
export const SEC_STATUS = [
  { k: "보안 헤더 (CSP · HSTS · noindex)", state: "구현", note: "이번 배포 반영" },
  { k: "API 검증 · 레이트 리밋 · no-store", state: "구현", note: "보안 QA 완료" },
  { k: "접근 기록 전면 공개 (감사 로그)", state: "구현", note: "전 역할 액션 티커 기록" },
  { k: "동의 만료 갱신 루프 (D-30)", state: "구현", note: "신뢰센터 · 발송 센터 연동" },
  { k: "실서버 전환 — Supabase 서울 리전", state: "로드맵", note: "RLS로 접근 매트릭스 구현 · Vault 필드 암호화 · service 키 서버 전용 · PITR — 데모는 목 데이터" },
  { k: "PIA (개인정보 영향평가)", state: "8월 진행", note: "규제 캘린더 등재 · 건강 민감정보 대량 처리" },
  { k: "가명정보 적정성 외부 검증", state: "내년 2월", note: "데이터 활용 전 선결" },
];

// ════ 경영 · 대시보드 (전체 포괄) — 섹션 요약 점프 카드 ════
export const EXEC_OVERVIEW = [
  { menu: "branches", label: "지점 현황", headline: "운영 4 · 오픈 준비 1", sub: "페어 준수 100% · SOS 0 (주)" },
  { menu: "staffmgmt", label: "인원 관리", headline: "전체 46명", sub: "채용 정체 23명 — 신원 조회 5건 최대" },
  { menu: "staff", label: "컨시어지 분석", headline: "평점 4.8 · 유지 87%", sub: "코칭 대상 4명 · 이탈 위험 1명" },
  { menu: "crm", label: "CRM · 라이프사이클", headline: "퍼널 정체 26건", sub: "결제 단계 6건 — 최대 이탈 구간" },
  { menu: "cs", label: "CS · 문의", headline: "회복 콜 24h 내 92%", sub: "문의 1위 바우처 대행 — 기능화 완료" },
  { menu: "family", label: "보호자 · 가구", headline: "128가구 · NPS 62", sub: "부보호자 열람 64% — 주의 신호" },
  { menu: "growth", label: "그로스 · 바이럴", headline: "K-factor 0.42", sub: "LTV/CAC 14.7x · 병목은 초대 발송" },
  { menu: "pricing", label: "가격 · 상품", headline: "ARPU 70만", sub: "가입비 미확정 — 퍼널 최대 병목" },
  { menu: "cash", label: "자금 흐름", headline: "순현금 +2,340만", sub: "유입 1.42억 · 미수 870만" },
  { menu: "pl", label: "예산 · 손익", headline: "영업이익 2,340만", sub: "GPM 29.4% — 목표 32% 미달" },
  { menu: "care", label: "케어 성과", headline: "동행 정시율 91%", sub: "SOS 오인율 0 · 야간 공백 3건" },
  { menu: "partners", label: "파트너 · 제휴", headline: "제휴 18곳", sub: "병원 연계 구조 전환 1건 (C4)" },
  { menu: "product", label: "제품 · 로드맵", headline: "v1.1 개발 중", sub: "결제·정산 자동화 38% — 최우선" },
  { menu: "strategy", label: "전략 · OKR", headline: "Q3 진척 58%", sub: "IR 지표 14종 중 미달 3 · 증빙 부분 3" },
  { menu: "risk", label: "리스크 · 컴플라이언스", headline: "CRITICAL 4 · 미완화 5", sub: "의료법 27조 3항 시정이 최우선" },
  { menu: "security", label: "보안 · 데이터", headline: "분류 4등급 · 공개 100%", sub: "실서버 전환은 Supabase 로드맵" },
  { menu: "roster", label: "명부", headline: "4종 통합", sub: "최근 1개월 신규 등록 5건" },
];

// ════ 경영 · CRM 퍼널 정체 보드 — 최근 90일 코호트 · 단계 클릭 → 정체 가구 대응 ════
// 원칙: 정체 가구는 가명 ID로만 표시(경영은 개별 레코드 접근 없음) · 경영은 배정까지, 실행은 CS·관제·지점장.
export const CRM_FUNNEL = [
  { id: "lead", stage: "상담 신청", n: 46, conv: null, stuckN: 8, sla: "첫 콜 48h", note: "제휴 요양기관 · 추천 유입 중심" },
  { id: "reg", stage: "등록 · 정보 입력", n: 38, conv: 83, stuckN: 5, sla: "3일 내 완료", note: "병력 입력 단계에서 이탈 집중" },
  { id: "pay", stage: "결제 · 가입 확정", n: 31, conv: 82, stuckN: 6, sla: "견적 후 5일", worst: true, note: "최대 이탈 구간 −18% — 가입비 정책 미확정 영향" },
  { id: "onb", stage: "온보딩 첫 30일", n: 24, conv: 77, stuckN: 4, sla: "첫 동행 14일 내", note: "전체 이탈의 61%가 이 구간" },
  { id: "settle", stage: "정착 · 갱신", n: 19, conv: 79, stuckN: 3, sla: "갱신 D-30 접점", note: "코호트 정착 전환 — 갱신 · 동의 만료 관리로 연결" },
];
export const CRM_STUCK = {
  lead: [
    { code: "L-118", days: "6일 정체", signal: "낮 시간 전화 2회 부재 · 문자 미응답", act: "저녁 시간대 콜 재시도 + 서비스 안내문 발송", owner: "CS팀" },
    { code: "L-104", days: "9일 정체", signal: "상담 후 “가족과 상의” — 후속 접점 없음", act: "형제 초대 링크 안내 · 주말 콜 배정", owner: "CS팀" },
    { code: "L-097", days: "5일 정체", signal: "요금 문의 후 무응답", act: "멤버십 구성 비교표 발송 + 콜", owner: "CS팀" },
  ],
  reg: [
    { code: "R-052", days: "5일 정체", signal: "어르신 정보 입력 중단 (병력 단계)", act: "전화로 대신 입력 지원 — 문진 부담 낮추기", owner: "CS팀" },
    { code: "R-047", days: "4일 정체", signal: "부보호자 초대만 완료 · 주보호자 미완", act: "주보호자에게 남은 1단계 리마인드", owner: "CS팀" },
  ],
  pay: [
    { code: "P-031", days: "7일 정체", signal: "결제 단계 이탈 — 가입비 문의 1회", act: "가입비 안내 + 첫 달 체험 제안 (정책 확정 전 한시)", owner: "CS팀" },
    { code: "P-029", days: "12일 정체", signal: "견적 후 무응답 · 경쟁 서비스 비교 추정", act: "차별점 자료(감사 로그 · 2인 1조) 발송 + 지점장 콜", owner: "지점장" },
    { code: "P-027", days: "5일 정체", signal: "해외 보호자 결제 수단 문제 (LA)", act: "해외 카드 · 시차 결제 안내", owner: "CS팀" },
  ],
  onb: [
    { code: "O-012", days: "8일 정체", signal: "첫 동행 후 리포트 열람 0회", act: "열람 가이드 콜 + 부보호자 초대 재안내", owner: "관제" },
    { code: "O-009", days: "14일 정체", signal: "둘째 동행 예약 없음 — 어르신 거부감", act: "선호 컨시어지 재지정 + 짧은 산책 동행 제안", owner: "관제" },
  ],
  settle: [
    { code: "S-201", days: "D-21", signal: "위치 동의 만료 임박 · 갱신 미완", act: "원탭 갱신 링크 재발송", owner: "CS팀" },
    { code: "S-188", days: "D-9", signal: "멤버십 갱신 임박 · 부보호자 열람 급감", act: "가구 360 리뷰 후 갱신 제안 콜", owner: "지점장" },
  ],
};

// ════ 관제 · 웨어러블 운영 섹션 (기기 자산 · 알림 · 배터리 · 페어링) ════
// 원칙: 단일 지표로 판정하지 않는다 · 알림은 복합 조건 · 낙상은 보호자 직통 + 관제 우회 (이중 경로).
export const WEAR_KPIS = [
  { k: "배포 기기", v: "132", note: "어르신 1인 1대 · 예비 8대", color: "#0A1F3C" },
  { k: "정상 수신", v: "126", note: "5분 주기 준실시간", color: "#1E7A5A" },
  { k: "무수집 4h+", v: "3", note: "배터리 · 착용 확인 콜 대상", color: "#C0392B" },
  { k: "배터리 20% 이하", v: "5", note: "방문 시 충전 안내", color: "#8A5D12" },
  { k: "미착용 (오늘)", v: "4", note: "전날 취침 후 미착용", color: "#8A5D12" },
  { k: "펌웨어 최신", v: "94%", note: "8대 업데이트 대기", color: "#0A1F3C" },
];
// 기기 자산 대장 — 명부와 별개로 '기기'를 관리한다
export const WEAR_DEVICES = [
  { serial: "FIT3-0142", owner: "김순자", branch: "강남", batt: 78, fw: "최신", state: "정상", since: "2025-05-14", tone: "ok" },
  { serial: "FIT3-0177", owner: "이영호", branch: "송파", batt: 61, fw: "최신", state: "알림 관찰", since: "2026-07-29", tone: "warn" },
  { serial: "FIT3-0119", owner: "박말순", branch: "강동", batt: 9, fw: "업데이트 대기", state: "무수집 6h", since: "2025-10-22", tone: "bad" },
  { serial: "FIT3-0203", owner: "한복자", branch: "강동", batt: 44, fw: "최신", state: "정상", since: "2025-08-20", tone: "ok" },
  { serial: "FIT3-0088", owner: "오태식", branch: "강남", batt: 83, fw: "최신", state: "정상", since: "2025-12-16", tone: "ok" },
  { serial: "FIT3-0231", owner: "최정자", branch: "서초", batt: 17, fw: "최신", state: "배터리 부족", since: "2026-07-08", tone: "warn" },
  { serial: "FIT3-0250", owner: "— (예비)", branch: "본점 보관", batt: 100, fw: "최신", state: "미배포", since: "—", tone: "info" },
];
// 알림 규칙 — 단일 지표 금지 · 복합 조건 · 오탐률 30% 초과는 단독 발송 금지
export const WEAR_RULES = [
  { k: "낙상 복합 감지", cond: "충격 감지 + 30초 무동작 + 심박 급변", fired: "4건", real: "3건", falseRate: "25%", route: "보호자 직통 + 관제 동시 (이중 경로)", tone: "ok" },
  { k: "장시간 무수집", cond: "4시간 이상 데이터 없음 + 배터리 20% 이하", fired: "9건", real: "8건", falseRate: "11%", route: "관제 확인 콜 → 컨시어지 방문 시 점검", tone: "ok" },
  { k: "야간 이상 심박", cond: "취침 구간 심박 ±25% + 3회 연속", fired: "6건", real: "2건", falseRate: "67%", route: "단독 발송 금지 — 아침 브리핑에 관찰 기록만", tone: "bad" },
  { k: "SpO₂ 저하", cond: "94% 미만 + 10분 지속 + 활동 없음", fired: "3건", real: "2건", falseRate: "33%", route: "관제 확인 후 보호자 안내 (자동 발송 안 함)", tone: "warn" },
  { k: "미착용 지속", cond: "12시간 이상 착용 감지 없음", fired: "7건", real: "7건", falseRate: "0%", route: "안부 콜 큐 · 거부 시 사유 기록", tone: "ok" },
];
// 오늘의 기기 액션 큐 — 관제가 처리하는 기기 단위 업무
export const WEAR_ACTIONS = [
  { level: "긴급", serial: "FIT3-0119", who: "박말순 (83)", text: "6시간 무수집 + 배터리 9% — 착용·충전 확인 필요", act: "확인 콜", tone: "bad" },
  { level: "주의", serial: "FIT3-0231", who: "최정자 (75)", text: "배터리 17% · 오늘 18:10 동행 예정", act: "동행 시 충전 안내", tone: "warn" },
  { level: "주의", serial: "FIT3-0177", who: "이영호 (81)", text: "어제 낙상 복합 알림 — 경과 관찰 24h 남음", act: "경과 확인", tone: "warn" },
  { level: "일반", serial: "FIT3-0119", who: "박말순 (83)", text: "펌웨어 업데이트 대기 — 다음 방문 시 적용", act: "방문 배정", tone: "info" },
];
// 연동 상태 — Fit3 → Samsung Health → Health Connect → 컴패니언
export const WEAR_PIPELINE = [
  ["기기 (갤럭시 Fit3)", "정상", "심박 · 활동 · 수면 · SpO₂ · 낙상 · 착용", "ok"],
  ["Samsung Health", "정상", "기기 데이터 1차 수집", "ok"],
  ["Health Connect", "정상", "앱 간 표준 연동 계층 (Android)", "ok"],
  ["컴패니언 앱", "정상", "5분 주기 동기화 · 준실시간", "ok"],
  ["스트레스 지표", "미연동", "파트너 SDK 조건부 — 삼성 제휴 필요", "warn"],
  ["위치 (GPS)", "폰 GPS 사용", "워치 단독 GPS 미탑재 — 폰 경유", "info"],
];
export const WEAR_CONSENT = [
  { k: "생체정보 수집 동의", v: "132 / 132", note: "가입 시 필수 · 만료 D-30 갱신 루프", tone: "ok" },
  { k: "낙상 시 보호자 직통", v: "129 / 132", note: "3가구 미동의 — 관제 경유만", tone: "warn" },
  { k: "위치 공유 (동행 중)", v: "128 / 132", note: "동행 구간에만 수집", tone: "ok" },
  { k: "데이터 보존", v: "S1 등급", note: "케어 종료 후 1년 → 자동 파기", tone: "info" },
];

// ════ 관제 · 역할 간 핸드오프 정체 보드 ════
// 이 사업의 사고는 사람과 사람 사이(인수인계 지점)에서 난다 — 각 단계의 '멈춘 건'을 본다.
export const HANDOFF_CHAIN = [
  { id: "req", stage: "요청 접수", from: "보호자", to: "관제", n: 14, stuckN: 3, sla: "2h 내 확인", note: "가족 앱 요청 · 전화 접수" },
  { id: "assign", stage: "배차 편성", from: "관제", to: "AI 제안 → 관제 승인", n: 11, stuckN: 2, sla: "제안 후 1h", note: "짝 미매칭이 최대 지연 원인" },
  { id: "accept", stage: "컨시어지 수락", from: "관제", to: "컨시어지", n: 9, stuckN: 2, sla: "발송 후 30분", worst: true, note: "미수락이 곧 배차 실패 — 최대 정체 구간" },
  { id: "visit", stage: "동행 수행", from: "컨시어지", to: "현장", n: 7, stuckN: 1, sla: "정시 ±10분", note: "지연 대부분 교통" },
  { id: "report", stage: "리포트 작성", from: "컨시어지", to: "관제", n: 6, stuckN: 3, sla: "동행 후 2h", note: "정시 전송 96% — 나머지가 여기 쌓인다" },
  { id: "review", stage: "검수 · 가족 전달", from: "관제", to: "보호자", n: 5, stuckN: 2, sla: "접수 후 3h", note: "진단어 검수 후 전달" },
];
export const HANDOFF_STUCK = {
  req: [
    { code: "REQ-118", who: "김민수 (김순자 가구)", wait: "3h 12분 대기", signal: "병원 변경 요청 — 접수만 되고 담당 미지정", act: "관제 담당 지정 + 회신", owner: "관제" },
    { code: "REQ-121", who: "김지영 (LA · 부보호자)", wait: "5h 40분 대기", signal: "시차 — 야간 접수분 아침까지 미확인", act: "해외 가구 우선 큐로 이동", owner: "관제" },
    { code: "REQ-124", who: "이영호 가구", wait: "2h 05분 대기", signal: "차량 배차 오류 항의 — 1차 응대만", act: "지점장 회신 배정", owner: "지점장" },
  ],
  assign: [
    { code: "JOB-4412", who: "16:20 투석 왕복 (한복자)", wait: "1h 30분 정체", signal: "부 동행 짝 미매칭 — 투석 자격자 부족", act: "송파 크로스 지원 요청", owner: "관제" },
    { code: "JOB-4418", who: "내일 09:10 정형외과 (이영호)", wait: "2h 정체", signal: "AI 배정안 3건 승인 대기", act: "배정안 승인 (L4)", owner: "관제" },
  ],
  accept: [
    { code: "DSP-2201", who: "오하늘 (수습)", wait: "42분 미수락", signal: "발송 후 무응답 — 앱 알림 미확인 추정", act: "음성 콜 에스컬레이션", owner: "관제" },
    { code: "DSP-2205", who: "이수민", wait: "35분 미수락", signal: "피로도 상한 임박 — 자동 제외 대상인데 발송됨", act: "대체 인력 재배정", owner: "관제" },
  ],
  visit: [
    { code: "VIS-0912", who: "박지현 · 서울아산", wait: "12분 지연", signal: "교통 지연 — 어르신 대기 중", act: "가족 지연 안내 발송", owner: "관제" },
  ],
  report: [
    { code: "RPT-3301", who: "윤세라 · 박말순 재택", wait: "4h 초과", signal: "동행 종료 후 리포트 미작성", act: "앱 리마인더 + 확인 콜", owner: "관제" },
    { code: "RPT-3305", who: "정민호 · 한복자 투석", wait: "2h 30분", signal: "작성 중 저장만 · 전송 안 됨", act: "전송 안내", owner: "관제" },
    { code: "RPT-3309", who: "오하늘 · 오태식 검진", wait: "3h", signal: "수습 — 기재 항목 누락으로 반려됨", act: "시니어 코치 동반 재작성", owner: "지점장" },
  ],
  review: [
    { code: "REV-1102", who: "최도현 리포트 (박말순)", wait: "2h 40분", signal: "진단어 의심 표현 1건 — 검수 보류", act: "표현 수정 요청", owner: "관제" },
    { code: "REV-1105", who: "서다인 리포트 (최정자)", wait: "1h 50분", signal: "검수 완료 · 가족 전달 미발송", act: "가족 전달 발송", owner: "관제" },
  ],
};

// ════ 경영 · 채용 → 현장 투입 정체 (사람 파이프라인) ════
export const HIRE_STUCK_STAGES = [
  { id: "doc", stage: "서류 · 자격 확인", n: 78, stuckN: 6, sla: "접수 후 3일", note: "자격증 진위 조회 자동화" },
  { id: "itv", stage: "대면 면접", n: 41, stuckN: 4, sla: "일정 확정 5일", note: "상황 판단 시나리오 6문항" },
  { id: "bg", stage: "신원 조회", n: 27, stuckN: 5, sla: "회신 7일", worst: true, note: "외부 회신 대기 — 최대 정체 구간" },
  { id: "edu", stage: "교육 · 서약", n: 18, stuckN: 3, sla: "합류 후 14일", note: "경계선 교육 16시간 + 실습" },
  { id: "first", stage: "첫 배차 (부 동행)", n: 12, stuckN: 2, sla: "교육 수료 7일", note: "첫 4건 선임 동반" },
  { id: "conv", stage: "수습 → 일반 전환", n: 7, stuckN: 3, sla: "부 동행 12건", note: "전환 지연은 소득 정체로 직결 — 이탈 신호" },
];
export const HIRE_STUCK = {
  doc: [
    { code: "A-0412", who: "지원자 · 강남 권역", wait: "6일 정체", signal: "보건증 미제출 — 2회 안내 후 무응답", act: "최종 안내 후 종결 처리", owner: "채용 담당" },
    { code: "A-0431", who: "지원자 · 마포 권역", wait: "4일 정체", signal: "요양보호사 자격 진위 조회 회신 지연", act: "협회 재조회 요청", owner: "채용 담당" },
  ],
  itv: [
    { code: "A-0388", who: "지원자 · 송파 권역", wait: "8일 정체", signal: "면접 일정 3회 조율 실패 (주간 근무 중)", act: "야간·주말 면접 슬롯 제안", owner: "이정란 지점장" },
    { code: "A-0402", who: "지원자 · 분당 권역", wait: "5일 정체", signal: "면접 완료 · 평가 미제출", act: "면접관 평가 입력 독려", owner: "최윤희 지점장" },
  ],
  bg: [
    { code: "A-0355", who: "합격 예정 · 강동 권역", wait: "11일 정체", signal: "성범죄 경력 조회 회신 대기 — 기관 지연", act: "회신 독촉 · 대체 인력 준비", owner: "채용 담당" },
    { code: "A-0361", who: "합격 예정 · 일산 (오픈)", wait: "9일 정체", signal: "노인학대 경력 조회 서류 반려 (서식 오류)", act: "서식 재제출 안내", owner: "강혜원 지점장" },
    { code: "A-0369", who: "합격 예정 · 마포 권역", wait: "7일 정체", signal: "건강진단 예약 미완료", act: "제휴 검진기관 예약 대행", owner: "채용 담당" },
  ],
  edu: [
    { code: "N-0121", who: "박지현(신규 동명) · 강남", wait: "9일 정체", signal: "등록 완료 · 기본 교육 미배정 (차수 대기)", act: "8월 1차 교육 배정", owner: "박성호 지점장" },
    { code: "N-0126", who: "신규 · 송파", wait: "6일 정체", signal: "경계선 교육 미이수 — 배차 자동 제외 상태", act: "재교육 일정 확정", owner: "이정란 지점장" },
  ],
  first: [
    { code: "N-0118", who: "수습 · 마포", wait: "10일 정체", signal: "교육 수료 후 첫 배차 없음 — 권역 수요 부족", act: "인접 권역 크로스 배차", owner: "관제" },
  ],
  conv: [
    { code: "C-0207", who: "오하늘 · 마포 (수습)", wait: "부 동행 6/12 · 8주 경과", signal: "배차 부족으로 전환 요건 미달 — 소득 정체", act: "우선 배차 2주 + 1:1 면담", owner: "박성호 지점장" },
    { code: "C-0211", who: "김도윤 · 송파 (수습)", wait: "부 동행 9/12 · 투석 자격 6/10", signal: "고난도 배차 게이트에 막힘", act: "투석 자격 교육 우선 배정", owner: "이정란 지점장" },
    { code: "C-0214", who: "최도현 · 강동 (부 동행)", wait: "부 동행 12/12 · 평점 4.6", signal: "요건 충족 · 전환 심사 미상신", act: "전환 상신 처리", owner: "지점장" },
  ],
};

// ════ 관제 · SOS 대응 전용 섹션 ════
// 원칙: 60초 내 1차 응답 · 다중 채널 이중화 · 해제는 관제만 · 경과는 관제만 본다(가족 화면 비노출).
// 대응 인력과 가족 연락은 '누가 어디까지 됐는지'를 한 줄로 — 중복 연락과 공백을 동시에 막는다.
export const SOS_SUBJECT = {
  name: "김순자 (78)",
  where: "대치동 자택 · 3층 (엘리베이터 없음)",
  key: "현관 비밀번호 — 담당 확정 후 노출 (게이팅)",
  alert: "심부전 이력 · 좌측 청력 저하 (오른쪽에서 말하기) · 혈압약 3종",
  watch: "워치 정상 수신 · 심박 112 (평소 72) · 낙상 감지 없음",
};
// 대응 인력 — 역할별 상태 (통보/응답/도착)
export const SOS_TEAM = [
  { role: "주 컨시어지", name: "박지현", detail: "간호사 출신 14년 · 현재 대치동 인근 (도보 8분)", state: "급파 대기", tone: "warn", action: "급파 지시" },
  { role: "부 컨시어지", name: "서다인", detail: "2인 1조 짝 · 차량 보유 · 12분 거리", state: "급파 대기", tone: "warn", action: "동반 배정" },
  { role: "관제 담당", name: "김태영 (강남 본점)", detail: "1차 응답자 · 상황 판단 및 해제 권한 (L4)", state: "대응 중", tone: "ok", action: null },
  { role: "119 · 응급", name: "강남소방서", detail: "심부전 이력 고지 · 3층 계단 진입 안내 필요", state: "연계 대기", tone: "bad", action: "119 연계" },
  { role: "제휴 병원", name: "서울아산병원 순환기내과", detail: "패스트트랙 운영 · 주치의 진료 이력 있음", state: "대기", tone: "info", action: "이송 사전 통보" },
];
// 가족 연락 — 우선순위·시차 고려 (중복 연락 방지가 핵심)
export const SOS_FAMILY = [
  { rank: "1순위", name: "김민수 (아들 · 주 보호자)", where: "서울 · 결제 승인자", state: "통보 완료 · 응답", detail: "앱 배너 + 음성 콜 — 30분 내 도착 예정", tone: "ok" },
  { rank: "2순위", name: "김지영 (차녀 · 부 보호자)", where: "LA (PST 21:40)", state: "통보 완료 · 미응답", detail: "야간 시차 — 앱 배너만, 콜은 1순위 응답으로 보류", tone: "warn" },
  { rank: "3순위", name: "김현우 (삼남 · 부 보호자)", where: "시드니 (AEST 15:40)", state: "대기", detail: "1·2순위 응답 시 상황 종료 후 요약 통보", tone: "info" },
];
// 골든타임 체크 — 경과별 목표
export const SOS_GOLDEN = [
  ["0–60초", "1차 응답 · 상황 확인 콜", "관제"],
  ["1–3분", "급파 지시 · 2인 편성 · 가족 1순위 통보", "관제"],
  ["3–5분", "119 연계 판단 · 병원 사전 통보", "관제 (L4)"],
  ["5–15분", "현장 도착 · 상태 확인 · 실시간 공유", "컨시어지 2인"],
  ["종료 후 2h", "가족 상황 리포트 · 해제 기록", "관제 → 보호자"],
];
export const SOS_LEVELS = [
  { k: "SEV1 · 생명 위협", desc: "의식 없음 · 호흡 곤란 · 심정지 의심", route: "즉시 119 + 급파 동시 · 가족 전원 통보", tone: "bad" },
  { k: "SEV2 · 응급", desc: "낙상 · 흉통 · 심한 어지럼 — 거동 불가", route: "급파 우선 → 현장 판단 후 119", tone: "warn" },
  { k: "SEV3 · 확인 필요", desc: "버튼 오작동 의심 · 무응답 · 워치 이상", route: "확인 콜 → 무응답 시 급파", tone: "info" },
];
export const SOS_HISTORY = [
  { at: "7/28 14:12", who: "박말순 (83)", level: "SEV3", cause: "워치 무수집 6시간", resp: "1차 응답 38초", result: "배터리 방전 — 오인 확인", tone: "info" },
  { at: "7/21 09:40", who: "이영호 (81)", level: "SEV2", cause: "낙상 복합 감지", resp: "1차 응답 22초", result: "급파 · 타박상 · 병원 동행", tone: "warn" },
  { at: "7/09 18:03", who: "최정자 (75)", level: "SEV2", cause: "투석 후 어지럼", resp: "1차 응답 41초", result: "급파 · 안정 후 귀가", tone: "warn" },
  { at: "6/27 03:15", who: "한복자 (79)", level: "SEV1", cause: "호흡 곤란", resp: "1차 응답 19초", result: "119 이송 · 3일 입원 후 퇴원", tone: "bad" },
];
export const SOS_KPIS = [
  { k: "1차 응답 (평균)", v: "31초", note: "목표 60초 이내", color: "#1E7A5A" },
  { k: "이번 달 SOS", v: "4건", note: "SEV1 1 · SEV2 2 · SEV3 1", color: "#0A1F3C" },
  { k: "오인 비율", v: "25%", note: "1건 — 워치 배터리 방전", color: "#8A5D12" },
  { k: "가족 통보 누락", v: "0", note: "다중 채널 이중화", color: "#1E7A5A" },
];
export const SOS_AFTER = [
  ["상황 리포트 작성", "발생–조치–결과를 사실만 기록 · 진단어 금지", "관제"],
  ["가족 설명 콜", "리포트 전달 + 구두 설명 — 숨기지 않는 것이 신뢰", "관제 · 지점장"],
  ["케어 프로필 반영", "재발 요인을 프로필·브리프에 반영 (예: 계단 동선)", "AI 병합 → 관제 검수"],
  ["재발 방지 리뷰", "월간 안전 집계에 반영 · 규칙 임계값 재조정", "경영 · 관제"],
];

// ════ 경영 · 자금 흐름 (돈이 들어오고 나가는 전 구간) ════
// 원칙: 사람 평가에는 판매액을 쓰지 않지만, 회사의 돈은 끝까지 추적한다.
// 가구 128 · 컨시어지 46 · 지점 4 기준 · 단위 원 (데모 목 수치).
export const CASH_KPIS = [
  { k: "월 유입", v: "1.42억", note: "구독 · 급여 · 제휴 · 커머스", color: "#1E7A5A" },
  { k: "월 유출", v: "1.19억", note: "정산 · 구매 · 운영 · 마케팅", color: "#C0392B" },
  { k: "순현금 (월)", v: "+2,340만", note: "3개월 연속 흑자", color: "#0A1F3C" },
  { k: "미수 · 미회수", v: "870만", note: "결제 실패 6가구 · 급여 청구 2건", color: "#8A5D12" },
  { k: "런웨이", v: "14개월", note: "현 소진 속도 · 투자 미반영", color: "#0A1F3C" },
];
// 유입 — 수익원별 월 실적 (기존 수익원 22종과 번호 정합)
export const CASH_IN = [
  { k: "구독 멤버십 (01)", v: "8,960만", w: 100, note: "128가구 · 티어1 96 · 티어2 32", tone: "ok" },
  { k: "재가급여 (12)", v: "2,410만", w: 27, note: "공단 청구 · 총이익률 13.4% (의도값)", tone: "warn" },
  { k: "동행 추가 · 야간 옵션", v: "1,180만", w: 13, note: "옵션 부착률 22%", tone: "ok" },
  { k: "케어스토어 · 커머스", v: "980만", w: 11, note: "평가지표에 미반영 (원칙 1)", tone: "ok" },
  { k: "제휴 · 병원 연계 (05)", v: "670만", w: 7, note: "알선 소지 — 광고·행정 용역 전환 대기", tone: "bad" },
];
// 유출 — 비용 구성
export const CASH_OUT = [
  { k: "컨시어지 정산 (인건비)", v: "7,240만", w: 100, note: "주 동행 142,800 · 부 동행 48,000 · 24h 정산", tone: "ok" },
  { k: "단골 가구 지분 지급", v: "810만", w: 11, note: "구독 매출의 8% · 27명 수령", tone: "ok" },
  { k: "구매 · 자산 (케어박스 · 워치)", v: "1,320만", w: 18, note: "Fit3 12대 · 케어박스 소모품", tone: "warn" },
  { k: "지점 운영비 (임대 · 차량)", v: "1,680만", w: 23, note: "4지점 + 일산 오픈 준비", tone: "ok" },
  { k: "보험 · 교육 · 복지", v: "540만", w: 7, note: "배상책임 · 산재 · EAP · 자격 지원", tone: "ok" },
  { k: "마케팅 · 채용", v: "310만", w: 4, note: "추천 보상 61% — CAC 대비 −62%", tone: "ok" },
];
// 자금 흐름도 — 유입에서 유출로 흐르는 구조 (단계별)
export const CASH_FLOW_STEPS = [
  { k: "고객 결제", v: "1.42억", note: "구독 자동결제 · 옵션 · 커머스 · 공단 청구", tone: "ok" },
  { k: "회사 수취", v: "1.39억", note: "PG 수수료 2.2% · 결제 실패 6가구 차감", tone: "warn" },
  { k: "현장 지급", v: "8,050만", note: "정산 24시간 · 지분 · 수당 — 지연 0건", tone: "ok" },
  { k: "운영 · 자산", v: "3,850만", note: "지점 · 구매 · 보험 · 마케팅", tone: "ok" },
  { k: "잔여 현금", v: "+2,340만", note: "예비비 적립 · 오픈 준비금", tone: "ok" },
];
// 법인카드 · 지출 관리 — 소지자 · 한도 · 사용률 · 확인 필요
export const CORP_CARDS = [
  { no: "5525-76**-****-0900", alias: "관제 운영", owner: "김태영 · 강남 본점", limit: "500만", used: 96, last: "오늘", state: "확인 필요", tone: "bad", note: "한도 임박 — 증액 또는 이월 판단" },
  { no: "5525-76**-****-3706", alias: "케어박스 구매", owner: "운영팀 · 공동", limit: "1,000만", used: 85, last: "1일 전", state: "정상", tone: "warn", note: "8월 소모품 발주 예정" },
  { no: "5525-76**-****-7490", alias: "차량 · 유류", owner: "지점 공용 (4지점)", limit: "300만", used: 62, last: "오늘", state: "정상", tone: "ok", note: "동행 차량 유류 · 통행료" },
  { no: "4518-44**-****-0245", alias: "교육 · 자격 지원", owner: "박성호 · 마포", limit: "200만", used: 41, last: "3일 전", state: "정상", tone: "ok", note: "요양보호사 교육비 지원분" },
  { no: "5525-76**-****-3294", alias: "복지 · EAP", owner: "인사 · 공동", limit: "150만", used: 27, last: "5일 전", state: "정상", tone: "ok", note: "이용 내역은 총액만 — 개인 식별 불가" },
  { no: "4518-44**-****-5993", alias: "일산 오픈 준비", owner: "강혜원 · 일산", limit: "500만", used: 12, last: "2일 전", state: "신규", tone: "info", note: "오픈 전 집기 · 초기 물품" },
];
export const CARD_ALERTS = [
  { level: "확인 필요", text: "관제 운영 카드 한도 96% — 이번 주 내 소진 예상", act: "증액 상신 또는 예비 카드 전환", tone: "bad" },
  { level: "확인 필요", text: "증빙 미첨부 4건 (7일 경과) — 케어박스 구매 2 · 유류 2", act: "담당자 증빙 요청", tone: "warn" },
  { level: "정책", text: "복지 · EAP 카드는 총액만 회계 처리 — 개인 이용 내역 비식별", act: "예외 없음", tone: "info" },
];
// 정산 사이클 — 사람에게 나가는 돈은 늦으면 신뢰가 깨진다
export const SETTLE_CYCLE = [
  ["동행 종료", "GPS 체크아웃 + 리포트 전송 시점 확정", "즉시"],
  ["검수 · 확정", "관제 리포트 검수 → 정산 금액 확정", "2h 내"],
  ["지급", "익일 입금 · 조기 지급 신청 시 당일 (수수료 0원)", "24h"],
  ["지분 지급", "단골 가구 구독 유지분 8% — 매월 25일", "월 1회"],
  ["공개", "정산 내역 항목별 앱 공개 (수당 · 지분 포함)", "상시"],
];
export const AR_ITEMS = [
  { k: "구독 결제 실패", v: "6가구 · 312만", note: "카드 만료 3 · 잔액 부족 2 · 해외 카드 1 — CRM 결제 정체와 동일 건", tone: "bad", act: "결제 수단 교체 안내" },
  { k: "급여 청구 보류", v: "2건 · 418만", note: "한도 초과 자동 보류 — 자격·한도 사전 검증 대상", tone: "warn", act: "공단 재청구 준비" },
  { k: "제휴 미수금", v: "1건 · 140만", note: "병원 연계 수수료 — 계약 구조 전환 전까지 수취 중단", tone: "bad", act: "수취 중단 유지 (C4)" },
];

// ════ 어르신 기본 속성 — 성별 · 장애 정도 · 보훈 · 장기요양등급 ════
// 표기 원칙: 장애등급제 폐지(2019) 이후 법령 표기를 따른다 —
// "장애의 정도가 심한 장애인 / 심하지 않은 장애인" (구 1~6급 표기 금지).
// 장애·보훈은 민감정보(S1/S2) — 케어 수행에 필요한 범위만 칩으로 표시하고 열람은 기록된다.
export const ELDER_TAGS = {
  김순자: { sex: "여", age: 78, disability: "심한 장애 (지체)", veteran: null, ltc: "장기요양 3등급",
    care: "휠체어 이송 · 계단 동선 확인 · 활동지원 병행" },
  이영호: { sex: "남", age: 81, disability: null, veteran: "국가유공자 (참전)", ltc: "장기요양 4등급",
    care: "보훈병원 우선 이용 · 보훈 감면 대상 안내" },
  박말순: { sex: "여", age: 83, disability: "심하지 않은 장애 (청각)", veteran: null, ltc: "장기요양 2등급",
    care: "필담 카드 · 정면에서 천천히 말하기" },
  한복자: { sex: "여", age: 79, disability: "심한 장애 (신장)", veteran: null, ltc: "장기요양 3등급",
    care: "주 3회 투석 동행 · 투석 자격자 배차 필수" },
  오태식: { sex: "남", age: 77, disability: null, veteran: "보훈보상대상자 유족", ltc: "인지지원등급",
    care: "보훈 감면 · 검진 대행 이용" },
  최정자: { sex: "여", age: 75, disability: null, veteran: null, ltc: "장기요양 4등급",
    care: "투석 다음날 탈수 주의" },
};
// 칩 톤 — 한눈에 구분 (빨강은 SOS 전용이므로 장애는 앰버 계열 사용)
export const TAG_TONE = {
  sex: { fg: "#0A1F3C", bg: "rgba(10,31,60,.06)" },
  disability: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  veteran: { fg: "#7A5C28", bg: "rgba(176,141,87,.18)" },
  ltc: { fg: "#1B7F79", bg: "rgba(27,127,121,.1)" },
};

// ════ 경영 · 전략 · OKR (스케일업 방향타) ════
export const OKR_QUARTER = "2026 Q3 (7~9월)";
export const OKRS = [
  { o: "케어 품질을 지키면서 지점을 2배로 연다", progress: 62, krs: [
    { k: "일산 지점 오픈 (인력 12 · 병원 4)", now: "8 / 12명 · 2 / 4곳", pct: 58, tone: "warn" },
    { k: "전 지점 페어 준수 100% 유지", now: "100%", pct: 100, tone: "ok" },
    { k: "지점별 NPS 60 이상", now: "마포 58 · 나머지 충족", pct: 75, tone: "warn" },
  ]},
  { o: "가구가 스스로 가구를 데려온다 (바이럴)", progress: 48, krs: [
    { k: "K-factor 0.6 달성", now: "0.42", pct: 70, tone: "warn" },
    { k: "추천 유입 비중 70%", now: "61%", pct: 87, tone: "ok" },
    { k: "온보딩 30일 이탈 −30%", now: "−18%", pct: 60, tone: "warn" },
  ]},
  { o: "사람이 남는 회사를 만든다", progress: 81, krs: [
    { k: "컨시어지 90일 유지 90%", now: "87%", pct: 96, tone: "ok" },
    { k: "수습 → 일반 전환 8명", now: "5명", pct: 63, tone: "warn" },
    { k: "정산 지연 0건 유지", now: "0건", pct: 100, tone: "ok" },
  ]},
  { o: "규제 리스크를 착수 전에 없앤다", progress: 40, krs: [
    { k: "의료법 27조 3항 계약 구조 전환", now: "착수 필요", pct: 10, tone: "bad" },
    { k: "PIA(개인정보 영향평가) 완료", now: "8월 진행", pct: 45, tone: "warn" },
    { k: "CRITICAL 리스크 4 → 1", now: "4건", pct: 25, tone: "bad" },
  ]},
];
export const MARKET_SIZE = [
  { k: "TAM · 국내 시니어 케어", v: "24.6조", note: "65세 이상 1,024만 · 돌봄 지출 총액", w: 100 },
  { k: "SAM · 수도권 유료 동행·구독", v: "1.8조", note: "수도권 중산층 이상 · 자녀 결제 가능 가구", w: 34 },
  { k: "SOM · 3년 목표", v: "420억", note: "4개 권역 × 가구 4,000 · 점유 2.3%", w: 12 },
];
export const COMPETITORS = [
  { k: "건별 매칭 플랫폼", price: "건당 과금", pair: "단독 동행", moat: "가격 경쟁 · 동행자 이탈률 높음", us: "구독 + 2인 1조로 안전·지속 소득", tone: "warn" },
  { k: "대형 요양기관", price: "급여 중심", pair: "인력 중심", moat: "공단 급여 의존 · 디지털 접점 약함", us: "가족 앱 · 감사 로그 · 프로필 자산", tone: "info" },
  { k: "대기업 신규 진입", price: "미정", pair: "미정", moat: "자본력 · 브랜드", us: "진화형 프로필 데이터 · 지자체 선점", tone: "bad" },
  { k: "지역 소규모 업체", price: "저가", pair: "혼재", moat: "지역 밀착", us: "표준 프로세스 · 다지점 품질 균일", tone: "info" },
];
export const MILESTONES = [
  ["2026 Q3", "일산 오픈 · 가구 160 · 의료법 계약 전환", "진행"],
  ["2026 Q4", "실서버 전환(Supabase) · PIA 완료 · 가구 220", "예정"],
  ["2027 Q1", "장기요양기관 지정 · 급여사업 본격화", "검토"],
  ["2027 Q2", "Pre-A 라운드 · 6지점 · 가구 400", "목표"],
];

// ════ AI 진화 — 업력과 DB가 쌓일수록 능력이 올라가는 구조 ════
// 원칙(9.4 계승): 프로필은 특정 모델에 종속되지 않게 저장한다. 모델을 바꿔도 자산은 남는다.
// 이 보드가 답하는 질문 — "우리 AI는 지금 어디까지 할 수 있고, 무엇이 쌓여야 다음이 열리는가."
export const AI_STAGE_NOW = "E3";
export const AI_STAGES = [
  { id: "E1", k: "기록", what: "규칙 + 조회 — 기록을 찾아 보여준다",
    gate: "케어 로그 1,000건", state: "완료", when: "2025 Q2", pct: 100 },
  { id: "E2", k: "개인화", what: "가구별 프로필 병합 · 문진 제로 · 단골 배정",
    gate: "가구 100 · 프로필 속성 3,000개", state: "완료", when: "2026 Q1", pct: 100 },
  { id: "E3", k: "예측", what: "이탈 · 위험 · 수급을 미리 본다",
    gate: "코호트 12개월 · 라벨 데이터 (해지 50 · 사고 200)", state: "진행", when: "2026 Q4 예상", pct: 62 },
  { id: "E4", k: "처방", what: "무엇을 할지까지 제안한다 (조치–결과 학습)",
    gate: "조치 → 결과 쌍 1,000건", state: "대기", when: "2027 Q2 예상", pct: 24 },
  { id: "E5", k: "자율 제안", what: "루틴 판단은 AI가 초안, 사람은 승인만",
    gate: "처방 채택률 70% · 6개월 무사고", state: "대기", when: "2027 Q4~", pct: 8 },
];
// 데이터 자산 — 이것이 쌓이는 속도가 곧 AI가 진화하는 속도
export const AI_ASSETS = [
  { k: "동행 리포트", n: "4,820건", rate: "+520 / 월", use: "브리프 · 변화 감지 · 품질 평가", tone: "ok" },
  { k: "AI 안부콜 대화", n: "3,140건", rate: "+380 / 월", use: "정서 · 인지 신호 추출", tone: "ok" },
  { k: "워치 신호", n: "41,600 가구·일", rate: "+3,840 / 월", use: "생활 리듬 · 이상 감지", tone: "ok" },
  { k: "케어 프로필 속성", n: "3,720개", rate: "128가구 × 평균 29", use: "문진 제로 · 개인화 응대", tone: "ok" },
  { k: "조치 → 결과 쌍", n: "892건", rate: "+96 / 월", use: "E4 처방의 유일한 연료", tone: "warn" },
  { k: "해지 사유 라벨", n: "21건", rate: "+3 / 월", use: "이탈 예측 — 지금 가장 부족", tone: "bad" },
  { k: "사고 · 아차사고 라벨", n: "34건", rate: "+4 / 월", use: "낙상 위험 예측", tone: "bad" },
  { k: "지점 월 손익 스냅샷", n: "47개월분", rate: "4지점 누적", use: "입지 · 오픈 계획 추천", tone: "warn" },
];
// 잠긴 기능 — 무엇이 얼마나 쌓이면 켜지는가 (해금 조건을 숨기지 않는다)
export const AI_LOCKED = [
  { k: "수요 예측 배차", need: "동행 12개월 연속 계절성", now: "15개월", pct: 100, state: "해금 가능",
    eta: "이번 분기 적용", how: "요일 · 계절 · 날씨별 배차 수요를 미리 계산해 채용·교대 계획에 반영", menu: "staffmgmt" },
  { k: "케어 플랜 자동 제안", need: "조치 → 결과 쌍 1,000건", now: "892건", pct: 89, state: "임박",
    eta: "약 1개월 후", how: "'이 상태에는 이 조치가 효과 있었다'를 학습해 다음 플랜을 초안으로 제시", menu: "care" },
  { k: "지점 입지 추천", need: "손익 확보 지점 5곳", now: "4곳", pct: 80, state: "임박",
    eta: "일산 오픈 시", how: "밀도 · 이동시간 · 병원 접근성으로 다음 지점 후보를 순위화", menu: "branches" },
  { k: "개인 맞춤 안부콜 시나리오", need: "대화 5,000건", now: "3,140건", pct: 63, state: "축적 중",
    eta: "2027 Q1", how: "어르신마다 반응이 좋은 화제 · 시간대 · 통화 길이를 개인화", menu: "care" },
  { k: "가구 이탈 예측", need: "해지 사유 라벨 50건", now: "21건", pct: 42, state: "가속 필요",
    eta: "현 속도로 10개월", how: "해지 사유 코드를 종료 시점 필수 입력으로 고정하면 수집 속도가 2배", menu: "crm" },
  { k: "낙상 위험 예측", need: "사고 라벨 200건", now: "34건", pct: 17, state: "가속 필요",
    eta: "현 속도로 41개월", how: "사고만 말고 아차사고까지 라벨링 — 리포트에 '위험했던 순간' 필드 추가", menu: "risk" },
];
// 진화의 증거 — 업력이 쌓이며 실제로 좋아진 값 (6개월 전 → 지금)
export const AI_ACCURACY = [
  { k: "배차 제안 채택률", was: 58, now: 81, note: "관제사가 AI 제안을 그대로 승인한 비율" },
  { k: "위험 워치 적중률", was: 63, now: 79, note: "높음 판정 후 실제 조치가 필요했던 비율" },
  { k: "안부콜 이상 감지 정밀도", was: 44, now: 71, note: "이상 알림 중 실제 이상이었던 비율" },
  { k: "문진 생략률", was: 71, now: 92, note: "재방문 시 상태를 다시 묻지 않아도 된 비율" },
  { k: "프로필 자동 병합 정확도", was: 82, now: 94, note: "사람 수정 없이 그대로 반영된 비율" },
];
// 성능 = 모델 × 기록 — 두 축은 곱셈이지 택일이 아니다.
// 모델은 남들도 같이 오르고(공통 상승분), 기록은 우리만 오른다(고유 상승분).
export const AI_AXES = [
  { k: "모델 세대", who: "누구나 같이 오른다", tone: "info",
    gets: ["요약 · 문장 품질", "긴 문맥 처리 (리포트 원문 통째 투입)", "다단계 추론 (브리프 자동 작성)", "음성 대화의 자연스러움", "토큰 비용 하락 → 안부콜 확대"],
    note: "우리 서비스의 절대 수준을 올려 준다. 다만 경쟁사도 같은 날 같이 오른다 — 우위가 되지는 않는다." },
  { k: "우리 기록", who: "우리만 오른다", tone: "ok",
    gets: ["김순자 어르신의 왼쪽 귀", "6/14 대비 보행 속도 변화", "박지현을 3회 연속 지정한 이유", "‘어머니’ 호칭을 싫어하신다는 사실", "이 지점 화·목 오전 수급 갭"],
    note: "어떤 최신 모델도 이 어르신을 모른다. 업력을 지나야만 생기고, 자본으로 건너뛸 수 없다." },
];
// 모델이 좋아질수록 기록의 가치가 함께 커진다 — 이 방향이 핵심
export const AI_MULTIPLY = [
  { k: "긴 문맥", was: "리포트 요약본만 투입 가능", now: "원문 4,820건을 통째로 참조", why: "이미 쌓아 둔 데이터의 잠금이 풀린다" },
  { k: "추론 향상", was: "속성 나열 → 사람이 판단", now: "속성 38개 → 동행 브리프 6줄 자동 압축", why: "같은 데이터에서 더 많은 것이 나온다" },
  { k: "비용 하락", was: "안부콜 주 1회가 한계", now: "주 3회 · 통화 분석까지", why: "수집량 자체가 늘어 다음 단계가 빨라진다" },
];
// 모델 교체 정책 — 좋은 모델이 나오면 바꾼다. 다만 검증 없이는 바꾸지 않는다.
export const AI_MODEL_POLICY = [
  { k: "복잡도 라우팅", body: "브리프 생성 · 리스크 판정 같은 판단은 상위 모델로, 요약 · 분류 · 태깅은 경량 모델로 분리합니다. 전부 최신 모델로 도는 것이 항상 정답은 아닙니다 (비용 · 지연)." },
  { k: "회귀 세트로 A/B", body: "실제 기록 200건을 고정 세트로 두고, 새 모델을 붙이면 채택률 · 적중률 · 금지 표현 위반을 같은 세트로 비교합니다. 통과해야 전환합니다." },
  { k: "롤백 기준을 먼저 정한다", body: "채택률이 기존 대비 5%p 이상 떨어지거나 의료 판단 금지 규칙을 1건이라도 위반하면 즉시 롤백합니다." },
  { k: "프로필은 모델 비종속", body: "속성 · 출처 · 신뢰도 구조로 저장하므로 모델을 갈아도 자산은 그대로 남습니다. 교체가 손실이 되지 않게 만드는 것이 원칙 9.4의 목적입니다." },
  { k: "외부 표기는 항상 ‘AI’", body: "모델명 · 제공사를 화면과 답변에 노출하지 않습니다. 모델은 부품이고, 고객이 신뢰하는 대상은 K-CARE입니다." },
];
export const AI_RULES = [
  { k: "AI는 제안, 사람이 승인", body: "E5(자율)에 가도 배차 확정 · 의료 판단 · 해지 처리는 사람 승인이 필수입니다. 자율은 초안을 쓰는 범위까지입니다." },
  { k: "학습은 비식별 집계만", body: "이름 · 연락처 · 상세 주소는 학습 대상에서 제외합니다. 모델이 보는 것은 상태 라벨과 변화량입니다." },
  { k: "가구 데이터는 그 가구에", body: "다른 가구로 넘어가는 것은 동의받은 집계 통계뿐입니다 — 개별 발화 · 리포트 원문은 넘어가지 않습니다." },
  { k: "프로필은 모델에 종속되지 않는다", body: "속성 · 출처 · 신뢰도 구조로 저장하므로 모델을 교체해도 자산은 그대로 남습니다 (원칙 9.4)." },
  { k: "틀린 예측도 남긴다", body: "적중률 · 채택률을 숨기지 않습니다. 틀린 기록이 없으면 다음 단계로 갈 근거도 없습니다." },
  { k: "지금 못 써도 원문은 남긴다", body: "요약만 남기고 원문을 버리면, 모델이 좋아졌을 때 되살릴 것이 없습니다. 오늘 처리 못 하는 기록이 내년의 자산입니다 (보존 기간 · 동의 범위 내)." },
];
// AI 챗 학습 범위 — 역할별로 "이 답변이 무엇에 근거하는가"를 화면에 명시
export const AI_EVIDENCE = {
  admin: "케어 로그 4,820건 · 지점 손익 47개월분 · 집계 지표 (개인 식별 정보 제외)",
  dispatch: "동행 리포트 4,820건 · 워치 41,600 가구·일 · 프로필 속성 3,720개",
};

// ════ 경영 · IR 지표 (투자자가 실제로 언더라이팅하는 것) ════
// 원칙: 부풀린 숫자는 라운드를 못 만들고 실사에서 나머지 숫자까지 무너뜨린다.
// 그래서 지표마다 "기준선 · 충족 여부"와 함께 "증빙 등급"을 같이 둔다.
export const IR_PROOF = {
  hard: { label: "증빙", fg: "#1E7A5A", bg: "rgba(30,122,90,.1)", desc: "로그 · DB에서 그대로 제출 가능" },
  partial: { label: "부분", fg: "#8A5D12", bg: "rgba(138,93,18,.12)", desc: "집계는 되나 기간 · 정의 보강 필요" },
  story: { label: "서사", fg: "#C0392B", bg: "rgba(192,57,43,.1)", desc: "아직 숫자 없음 — 지금부터 기록" },
};
export const IR_STATE = {
  pass: { label: "충족", fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  near: { label: "근접", fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  miss: { label: "미달", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
};
export const IR_METRICS = [
  ["성장 — 지금 속도가 나는가", [
    { k: "MRR 성장 (MoM)", v: "+9.4%", base: "≥ 10%", state: "near", proof: "hard", menu: "pl",
      why: "3개월 연속 두 자릿수가 사실상 라운드 입장권" },
    { k: "가구 성장 (MoM)", v: "+10.3%", base: "≥ 10%", state: "pass", proof: "hard", menu: "branches",
      why: "매출보다 가구 수가 먼저 — 매출은 뒤따라온다" },
    { k: "신규 지점 램프", v: "분당 45일 8가구", base: "90일 15가구", state: "near", proof: "partial", menu: "branches",
      why: "지점이 공식이 되면 질문이 '될까'에서 '몇 개 열까'로 바뀐다" },
  ]],
  ["유지 · 확장 — 새는가", [
    { k: "자발적 해지율 (월)", v: "1.1%", base: "< 1.5%", state: "pass", proof: "hard", menu: "crm",
      why: "자연 종료(사망 · 시설 입소)를 분리한 값 — 이 분리가 이 카테고리의 핵심" },
    { k: "가구 12개월 유지", v: "84%", base: "≥ 75%", state: "pass", proof: "partial", menu: "crm",
      why: "코호트가 14개월뿐 — 24개월 확보 전까지는 추정치" },
    { k: "NRR (순매출 유지)", v: "104%", base: "≥ 100%", state: "pass", proof: "hard", menu: "pricing",
      why: "100%를 넘기면 '해지가 나도 매출은 는다'는 서사가 성립" },
    { k: "옵션 부착률", v: "38%", base: "≥ 40%", state: "near", proof: "hard", menu: "pricing",
      why: "NRR을 만드는 사실상 유일한 레버" },
  ]],
  ["유닛 이코노믹스 — 남는가", [
    { k: "CAC 회수 기간", v: "4.0개월", base: "≤ 9개월", state: "pass", proof: "hard", menu: "growth",
      why: "회수가 빠르면 성장에 자금이 덜 든다 — 조달 규모를 줄이는 근거" },
    { k: "LTV / CAC (기여 기준)", v: "3.5x", base: "≥ 3x", state: "pass", proof: "partial", menu: "growth",
      why: "매출 기준 35x는 쓰지 않는다 — 부풀린 배수는 실사 첫 질문에서 깨진다" },
    { k: "매출총이익률", v: "29.4%", base: "≥ 32%", state: "miss", proof: "hard", menu: "pl",
      why: "케어업 마진의 상한을 증명해야 소프트웨어 배수가 붙는다" },
    { k: "무료(추천) 유입 비중", v: "61%", base: "≥ 35%", state: "pass", proof: "hard", menu: "growth",
      why: "가구가 늘어도 CAC가 오르지 않는다는 증거" },
  ]],
  ["공급 · 해자 — 남이 못 따라오는가", [
    { k: "컨시어지 90일 유지", v: "87%", base: "업계 61%", state: "pass", proof: "hard", menu: "staff",
      why: "'사람 사업은 안 된다'는 반론을 정면으로 깨는 유일한 숫자" },
    { k: "가동률", v: "82%", base: "75 ~ 85%", state: "pass", proof: "hard", menu: "staffmgmt",
      why: "낮으면 낭비 · 높으면 이탈 — 밴드 안에 있다는 것이 운영력의 증명" },
    { k: "채용 → 투입 리드타임", v: "31일", base: "≤ 21일", state: "miss", proof: "hard", menu: "staffmgmt",
      why: "이 숫자가 곧 지점 확장 속도의 상한 — 자금을 넣어도 이 이상 못 연다" },
    { k: "중대 사건", v: "0건", base: "0건 유지", state: "pass", proof: "hard", menu: "risk",
      why: "1건이면 밸류에이션이 아니라 존속의 문제가 된다" },
    { k: "AI 제안 채택률", v: "81%", base: "≥ 70%", state: "pass", proof: "hard", menu: "product",
      why: "모델이 아니라 업력으로 오른 값 — 후발 주자가 자본으로 건너뛸 수 없는 구간" },
  ]],
];
// LTV 정의 — 슬라이드마다 다른 값이 나오는 것이 실사에서 가장 흔한 사고
export const IR_LTV_DEF = [
  { k: "LTV (매출 기준)", v: "980만", how: "가구당 월 구독 70만 × 평균 유지 14개월", use: "시장 규모 · 가격 논의에만" },
  { k: "LTV (기여이익 기준)", v: "98만", how: "가구당 월 기여이익 7만 × 평균 유지 14개월", use: "IR · LTV/CAC는 이 값만 사용" },
];
export const IR_PROOFS = [
  {
    k: "이탈의 성격을 분리해서 증명한다",
    v: "자발적 해지 1.1% / 월",
    body: "해지 21건 중 자연 종료(사망 6 · 시설 입소 5 · 이사 3)가 14건, 서비스 사유가 7건. 시니어 케어는 자연 감소가 있는 카테고리라 합산 이탈률만 내놓으면 우리 잘못이 아닌 것까지 우리 점수로 깎인다.",
    keep: "해지 사유 코드를 계약 종료 시점 필수 입력으로 고정 — 사후 분류는 실사에서 인정되지 않는다.",
    menu: "crm",
  },
  {
    k: "사람 사업의 반론을 숫자로 뒤집는다",
    v: "컨시어지 90일 유지 87% · 업계 61%",
    body: "짝 원칙(2인 1가구) · 피로도 상한 · 순환 배정이 유지율을 만들고, 유지율이 무사고를, 무사고가 가구 유지를 만든다. 이 연쇄를 한 장으로 보여주는 것이 이 회사의 해자 설명이다.",
    keep: "컨시어지별 재직 개월 · 사고 건수 · 담당 가구 유지율을 같은 키로 조인 가능하게 적재.",
    menu: "staff",
  },
  {
    k: "지점 J-커브가 재현된다는 것을 보여준다",
    v: "BEP 강남 11개월 → 송파 8개월 → 마포 6개월(예상)",
    body: "지점마다 손익분기가 빨라지면 투자는 '이 회사가 될까'가 아니라 '몇 개 열 자금인가'의 문제가 된다. 오픈 비용 4,200만 · 회수 개월이 공식이 되는 순간 조달 논리 자체가 바뀐다.",
    keep: "지점별 오픈일 · 월 누적 손익 · 가구 수를 월 스냅샷으로 적재 — 사후 재구성이 불가능한 데이터.",
    menu: "branches",
  },
];

export const IR_PROOF_AI = {
  k: "AI가 자본이 아니라 업력으로 좋아진다는 것을 보여준다",
  v: "배차 제안 채택률 58% → 81% (6개월)",
  body: "이 구간에서는 모델을 고정한 채 측정했습니다 — 늘어난 것은 동행 리포트 4,820건 · 대화 3,140건 · 속성 3,720개뿐입니다. 그래서 이 23%p는 온전히 기록의 몫입니다. 모델 세대가 오르면 그 위에 더 얹히지만, 그 상승분은 경쟁사도 같이 받습니다 — 우리만 받는 것은 이쪽입니다.",
  keep: "예측 · 제안의 채택 여부와 결과를 매 건 남긴다 — 조치 → 결과 쌍이 다음 단계(E4 처방)의 유일한 연료.",
  menu: "product",
};
export const IR_GAPS = [
  { k: "코호트 길이 14개월", risk: "LTV · 12개월 유지가 전부 추정치 — 실사에서 가장 먼저 찔린다",
    fix: "24개월 코호트 확보 전까지 보수 시나리오(유지 10개월) 병기", when: "2027 Q1", menu: "crm", tone: "warn" },
  { k: "지표가 수기 집계", risk: "슬라이드 숫자와 DB 숫자가 다르면 나머지 숫자까지 못 믿게 된다",
    fix: "대시보드 지표를 analytics 뷰로 고정 · 산식 문서화", when: "2026 Q4", menu: "security", tone: "warn" },
  { k: "의료법 27조 3항 계약 구조", risk: "병원 연계 수수료가 알선으로 해석되면 형사 리스크 — 딜 브레이커",
    fix: "법무 의견서 + 수수료 → 정액 업무위탁으로 계약 전환", when: "2026 Q3", menu: "risk", tone: "bad" },
  { k: "PIA 미완료", risk: "민감정보(질병 · 장애) 처리 근거 미비 — 실서버 전환 자체가 막힌다",
    fix: "8월 PIA 진행 · 완료 전 실명 데이터 투입 금지", when: "2026 Q3", menu: "security", tone: "bad" },
  { k: "매출총이익률 29.4%", risk: "케어업 마진 상한이 30% 아래로 보이면 소프트웨어 배수가 안 붙는다",
    fix: "권역 밀도 상향 · 크로스 지원 이동 수당 축소로 32% 경로", when: "2026 Q4", menu: "pl", tone: "warn" },
];

// ════ 경영 · 그로스 · 바이럴 루프 ════
export const GROWTH_KPIS = [
  { k: "K-factor", v: "0.42", note: "가구 1곳이 데려오는 신규 가구", color: "#8A5D12" },
  { k: "추천 유입", v: "61%", note: "채널 1위 · 획득 비용 0원", color: "#1E7A5A" },
  { k: "CAC", v: "28만", note: "유료 채널 혼합 평균", color: "#0A1F3C" },
  { k: "LTV (기여 기준)", v: "98만", note: "월 기여 7만 × 유지 14개월", color: "#1E7A5A" },
  { k: "LTV / CAC", v: "3.5x", note: "기여이익 기준 · 건전선 3x 상회", color: "#1E7A5A" },
  { k: "회수 기간", v: "4.0개월", note: "CAC 28만 ÷ 월 기여 7만", color: "#1E7A5A" },
];
export const VIRAL_LOOP = [
  { k: "케어 경험", v: "128가구", note: "동행 후 만족 — 루프의 시작", conv: null },
  { k: "NPS 추천군 (9–10)", v: "79가구", note: "62% — 추천 의향 확보", conv: 62 },
  { k: "초대 링크 발송", v: "41건", note: "52% — 앱 내 원탭 초대", conv: 52 },
  { k: "상담 신청", v: "23건", note: "56% — 지인 신뢰가 전환을 올린다", conv: 56 },
  { k: "가입 완료", v: "12가구", note: "52% — 유료 채널의 3.1배", conv: 52 },
];
export const LOOP_BOTTLENECK = {
  stage: "초대 링크 발송",
  why: "추천 의향(79) 대비 실제 발송(41) — 52%에서 절반이 샌다",
  acts: [
    "동행 직후 만족 순간에 초대 카드 노출 (현재는 마이페이지 안쪽)",
    "형제 초대와 지인 초대를 분리 — 문구·보상 구조가 다르다",
    "추천인·피추천인 양측 혜택 명시 (현재 피추천인만)",
  ],
};
export const CHANNELS = [
  { k: "가구 추천 (바이럴)", share: 61, cac: "0원", ltv: "438만", payback: "즉시", tone: "ok" },
  { k: "제휴 요양기관", share: 14, cac: "12만", ltv: "402만", payback: "1.8개월", tone: "ok" },
  { k: "병원 대기실 · 오프라인", share: 11, cac: "34만", ltv: "391만", payback: "5.1개월", tone: "warn" },
  { k: "검색 광고", share: 9, cac: "61만", ltv: "355만", payback: "9.4개월", tone: "bad" },
  { k: "지자체 · 복지관 연계", share: 5, cac: "8만", ltv: "376만", payback: "1.2개월", tone: "ok" },
];
export const UNIT_ECON = [
  { k: "가구당 월 구독", v: "+70만", tone: "ok" },
  { k: "동행 원가 (정산·수당)", v: "−48만", tone: "bad" },
  { k: "지분 지급 (구독 8%)", v: "−5.6만", tone: "bad" },
  { k: "운영 배부 (지점·보험)", v: "−9.4만", tone: "bad" },
  { k: "가구당 월 기여이익", v: "+7만", tone: "ok" },
];
export const EXPERIMENTS = [
  { k: "동행 직후 초대 카드 노출", hyp: "만족 순간 노출 시 발송률 52% → 70%", state: "진행 중", impact: "K-factor +0.12 예상", tone: "warn" },
  { k: "첫 달 체험가 (가입비 유예)", hyp: "결제 단계 이탈 −18%p 완화", state: "설계", impact: "퍼널 최대 병목 대응", tone: "info" },
  { k: "부보호자 초대 자동 리마인드", hyp: "열람률 64% → 80% · 이탈 선행지표 개선", state: "완료", impact: "이탈 −9% (검증됨)", tone: "ok" },
  { k: "검색 광고 중단 테스트", hyp: "CAC 61만 채널 중단해도 총 유입 유지", state: "완료", impact: "롤백 — 신규 −7% 감소", tone: "bad" },
];

// ════ 경영 · 제품 · 로드맵 ════
export const PRODUCT_KPIS = [
  { k: "구현 완료 기능", v: "42", note: "F 시리즈 · 데모 기준", color: "#1E7A5A" },
  { k: "부분 구현", v: "7", note: "조건부 · 연동 대기", color: "#8A5D12" },
  { k: "Phase 2 대기", v: "11", note: "예측 추천 · 퍼블릭 체인 등", color: "#5C5A54" },
  { k: "기술 부채", v: "5건", note: "실서버 전환 전 해소 대상", color: "#C0392B" },
];
export const RELEASES = [
  { v: "v1.0 (현재)", when: "2026-07", items: "5역할 데모 · 관제 8메뉴 · 경영 17섹션 · A4 리포트 · 감사 로그", state: "배포됨", tone: "ok" },
  { v: "v1.1", when: "2026-08", items: "실서버 전환 M1~M3 · 로그인 · 알림 실발송", state: "개발", tone: "warn" },
  { v: "v1.2", when: "2026-09", items: "웨어러블 실연동 · 결제 PG · 정산 자동화", state: "설계", tone: "info" },
  { v: "v2.0", when: "2026-Q4", items: "지자체 계약 대응 · 다지점 운영 · 급여 청구 연동", state: "구상", tone: "info" },
];
export const TECH_DEBT = [
  { k: "상태 저장소 localStorage", risk: "실데이터 저장 불가 · 다중 기기 미지원", plan: "Supabase 전환 (M1~M8)", tone: "bad" },
  { k: "목 데이터 219종 하드코딩", risk: "화면-데이터 결합 · 변경 비용", plan: "API 계층 분리 후 점진 이관", tone: "warn" },
  { k: "AI 프롬프트 서버 라우트 단일", risk: "장애 시 전 AI 기능 중단", plan: "폴백 응답 + 큐잉 (부분 구현)", tone: "warn" },
  { k: "Next 14 · 이미지 최적화 미사용", risk: "성능 여유 있으나 확장 시 병목", plan: "Next 16 업그레이드 검토", tone: "info" },
  { k: "테스트 자동화 부재", risk: "회귀 검증을 수동 스크린샷에 의존", plan: "E2E 스모크 + CI 도입", tone: "warn" },
];
export const FEATURE_COVERAGE = [
  { k: "케어 운영 (배차·동행·리포트)", pct: 92 },
  { k: "가족 경험 (앱·리포트·NPS)", pct: 88 },
  { k: "컨시어지 경험 (정산·성장·보호)", pct: 85 },
  { k: "AI (프로필·안부콜·브리핑)", pct: 74 },
  { k: "웨어러블 · 기기 운영", pct: 61 },
  { k: "결제 · 정산 자동화", pct: 38 },
];

// ════ 경영 · 투자 · IR ════
export const IR_KPIS = [
  { k: "MRR", v: "1.42억", note: "전월 대비 +9.4%", color: "#1E7A5A" },
  { k: "번레이트 (순)", v: "−0 (흑자)", note: "순현금 +2,340만", color: "#1E7A5A" },
  { k: "런웨이", v: "14개월", note: "투자 미반영 · 현 소진 속도", color: "#0A1F3C" },
  { k: "가구 성장률", v: "+10.3%", note: "MoM · 128가구", color: "#1E7A5A" },
  { k: "총 유지율 (12개월)", v: "84%", note: "가구 기준", color: "#1E7A5A" },
];
export const CAP_TABLE = [
  { k: "창업팀 (4인)", pct: 72, note: "베스팅 적용 — 2년 · 1년 클리프", tone: "ok" },
  { k: "임직원 스톡옵션 풀", pct: 12, note: "시니어 컨시어지·핵심 인력 배정 예정", tone: "ok" },
  { k: "엔젤 · 시드", pct: 11, note: "초기 라운드 완료분", tone: "info" },
  { k: "예비 (Pre-A 희석분)", pct: 5, note: "라운드 시 재조정", tone: "warn" },
];
export const ROUNDS = [
  { k: "시드 (완료)", when: "2025-09", amount: "3.5억", use: "MVP 개발 · 강남 본점 · 초기 인력", state: "완료", tone: "ok" },
  { k: "브릿지 (완료)", when: "2026-03", amount: "2.0억", use: "송파·마포 오픈 · 웨어러블 도입", state: "완료", tone: "ok" },
  { k: "Pre-A (준비)", when: "2027-Q2 목표", amount: "15~20억", use: "6지점 확장 · 급여사업 · 실서버 인프라", state: "준비", tone: "warn" },
];
export const DATAROOM = [
  { k: "재무제표 · 자금 흐름", state: "준비 완료", tone: "ok" },
  { k: "코호트 · 유닛 이코노믹스", state: "준비 완료", tone: "ok" },
  { k: "리스크 레지스터 23건", state: "준비 완료", tone: "ok" },
  { k: "의료법 자문 의견서", state: "미비 — C4 시정 후", tone: "bad" },
  { k: "PIA 결과 보고서", state: "8월 진행", tone: "warn" },
  { k: "컨시어지 계약서 표준안", state: "노무 자문 대기", tone: "warn" },
  { k: "지자체 · 병원 제휴 계약", state: "준비 완료", tone: "ok" },
  { k: "기술 아키텍처 · DB 설계", state: "준비 완료", tone: "ok" },
];
export const IR_UPDATE = {
  cycle: "월간 · 매월 5일 발송",
  items: [
    "핵심 지표 5종(MRR · 가구 · 유지율 · NPS · 런웨이) — 좋은 소식과 나쁜 소식을 같은 크기로",
    "지난달 약속한 것의 결과 — 달성 여부를 먼저 쓴다",
    "이번 달 최대 리스크 1건과 대응 계획",
    "요청 사항 (소개 · 채용 · 자문) — 투자자가 도울 수 있는 형태로",
  ],
};

// ════ 경영 · 파트너 · 제휴 (B2G 포함 · 매출 다각화 축) ════
export const PARTNER_KPIS = [
  { k: "제휴 기관", v: "18곳", note: "병원 6 · 요양 5 · 지자체 3 · 기타 4", color: "#0A1F3C" },
  { k: "제휴 기여 매출", v: "월 1,650만", note: "전체 유입의 11.6%", color: "#1E7A5A" },
  { k: "계약 갱신 임박", v: "3건", note: "90일 내 — 조건 재협의 필요", color: "#8A5D12" },
  { k: "구조 전환 대상", v: "1건", note: "병원 연계 — 알선 소지 (C4)", color: "#C0392B" },
];
export const PARTNER_PORTFOLIO = [
  { k: "제휴 병원 (6)", type: "의료", rev: "670만", state: "구조 전환", tone: "bad",
    note: "패스트트랙 · 예약 행정 — 건별 수수료를 월정액 광고·행정 용역으로 전환 필요" },
  { k: "제휴 요양기관 (5)", type: "인력·유입", rev: "—", state: "운영", tone: "ok",
    note: "채용 유입 1위 채널(61% 중 상당) · CAC 12만 · 상호 추천" },
  { k: "지자체 · 복지관 (3)", type: "B2G", rev: "420만", state: "확대", tone: "ok",
    note: "사회서비스 제공기관 · 바우처 연계 — 장기 계약이 대기업 방어선" },
  { k: "보험 GA (준비)", type: "금융", rev: "—", state: "자회사 설립 전", tone: "warn",
    note: "무자격 모집 금지 — 설계사 자격자만 청약 · 컨시어지는 연결까지" },
  { k: "복지용구 · 렌탈 (2)", type: "커머스", rev: "310만", state: "운영", tone: "ok",
    note: "급여 연계 대상 — 사업소 지정 후 확대 (재가급여 후행)" },
  { k: "상조 · 장례 (2)", type: "생애주기", rev: "250만", state: "실사 중", tone: "warn",
    note: "선수금 50% 예치 확인된 업체만 · 반기 재무 실사 (H5)" },
];
export const B2G_PIPELINE = [
  { k: "사회서비스 제공기관 등록", org: "강남구", state: "운영 중", due: "11월 갱신", tone: "ok" },
  { k: "노인맞춤돌봄 수행기관 공모", org: "송파구", state: "제안서 준비", due: "9월 마감", tone: "warn" },
  { k: "장기요양기관 지정 신청", org: "보건복지부", state: "경영 결정 대기", due: "내년 3월", tone: "warn" },
  { k: "AI 돌봄 실증사업", org: "서울시", state: "컨소시엄 협의", due: "10월 접수", tone: "info" },
  { k: "고독사 예방 안부확인 위탁", org: "마포구", state: "검토", due: "미정", tone: "info" },
];
export const PARTNER_RULES = [
  "환자 소개 대가는 받지 않는다 — 광고·행정 용역 계약으로만 (의료법 27조 3항)",
  "어르신에게 선택지를 2곳 이상 제시하고 선택 근거를 기록한다 (유도 정황 차단)",
  "제휴사 부실은 우리 고객 피해로 이어진다 — 상조·렌탈은 반기 재무 실사 필수",
  "지자체 계약은 단가보다 지속성 — 낮은 마진이라도 장기 계약이 해자가 된다",
];

// ════ 경영 · 가격 · 상품 (Pricing & Packaging) ════
export const PRICING_KPIS = [
  { k: "평균 객단가 (ARPU)", v: "70만", note: "월 · 옵션 포함", color: "#0A1F3C" },
  { k: "옵션 부착률", v: "22%", note: "야간 출동 · 추가 동행", color: "#8A5D12" },
  { k: "가입비 정책", v: "미확정", note: "12~15만 · 퍼널 최대 병목", color: "#C0392B" },
  { k: "가격 인상 여력", v: "+8%", note: "NPS 62 · 이탈 민감도 낮은 구간", color: "#1E7A5A" },
];
export const PLANS = [
  { k: "베이직", price: "39만", inc: "월 안부콜 4 · 연 2회 동행 · 리포트", who: "원거리 가족 · 저빈도", n: "—", tone: "info" },
  { k: "티어1 (표준)", price: "68만", inc: "월 동행 2회 · 안부콜 주 3 · 케어박스 · 워치", who: "가장 많은 선택 (75%)", n: "96가구", tone: "ok" },
  { k: "티어2 (집중)", price: "98만", inc: "월 동행 4회 · 투석·재활 대응 · 우선 배차", who: "고난도 케어 필요", n: "32가구", tone: "ok" },
  { k: "기업 복지 (B2B)", price: "협의", inc: "임직원 부모 케어 — 단체 계약", who: "미출시 — 파일럿 검토", n: "—", tone: "warn" },
];
export const OPTIONS_CATALOG = [
  { k: "야간 출동 옵션", price: "월 12만", attach: 22, note: "야간 공백 3건 → 보증 범위 실질 보완" },
  { k: "추가 동행 (건당)", price: "9만", attach: 38, note: "티어 초과분 · 가장 높은 부착" },
  { k: "해외 가족 리포트 번역", price: "월 3만", attach: 9, note: "LA·시드니 가구 대상" },
  { k: "복지용구 구매대행", price: "수수료 8%", attach: 17, note: "급여 연계 시 본인부담만" },
  { k: "케어푸드 정기배송", price: "월 14만", attach: 11, note: "식이 제한 프로필 연동" },
];
export const PRICING_DECISIONS = [
  { k: "가입비 12~15만 확정", why: "결제 단계 −18% 이탈의 직접 원인 · CS 문의 3위", opt: "① 15만 유지 ② 12만 인하 ③ 첫 달 유예(체험가)", state: "이번 주 상정", tone: "bad" },
  { k: "티어2 가격 인상 (+8%)", why: "투석·재활 원가가 티어1 대비 1.4배 · 현재 역마진 구간", opt: "98만 → 106만 · 기존 가구 6개월 유예", state: "검토", tone: "warn" },
  { k: "기업 복지 상품 출시", why: "B2B 단체 계약은 CAC 0 · 지자체와 다른 축", opt: "파일럿 2개사 → 표준 상품화", state: "구상", tone: "info" },
  { k: "옵션 번들 (야간+추가동행)", why: "개별 부착률 22%/38% — 번들 시 예상 45%", opt: "월 18만 번들 (개별 대비 −14%)", state: "실험 설계", tone: "info" },
];

// ════ 경영 · 예산 · 손익 (P&L · 예산 대비 실적) ════
export const PL_KPIS = [
  { k: "월 매출", v: "1.42억", note: "예산 1.38억 대비 +2.9%", color: "#1E7A5A" },
  { k: "매출총이익", v: "4,180만", note: "GPM 29.4% · 목표 32%", color: "#8A5D12" },
  { k: "영업이익", v: "2,340만", note: "OPM 16.5%", color: "#1E7A5A" },
  { k: "예산 집행률", v: "86%", note: "누적 · 마케팅 미집행 잔여", color: "#0A1F3C" },
];
export const PL_ROWS = [
  { k: "매출", plan: "1.38억", act: "1.42억", diff: "+2.9%", tone: "ok", note: "가구 +12 · 옵션 부착 상승" },
  { k: "매출원가 (동행 정산·지분)", plan: "−9,600만", act: "−1.00억", diff: "+4.2%", tone: "warn", note: "크로스 지원 이동 수당 증가" },
  { k: "매출총이익", plan: "4,200만", act: "4,180만", diff: "−0.5%", tone: "warn", note: "GPM 29.4% (목표 32%)" },
  { k: "인건비 (본사·지점장)", plan: "−1,180만", act: "−1,150만", diff: "−2.5%", tone: "ok", note: "일산 지점장 9월 합류" },
  { k: "지점 운영비", plan: "−520만", act: "−540만", diff: "+3.8%", tone: "warn", note: "일산 오픈 준비 집기" },
  { k: "마케팅", plan: "−400만", act: "−310만", diff: "−22.5%", tone: "ok", note: "추천 유입 61% — 유료 집행 축소" },
  { k: "보험·교육·복지", plan: "−160만", act: "−154만", diff: "−3.8%", tone: "ok", note: "계획 내" },
  { k: "영업이익", plan: "1,940만", act: "2,340만", diff: "+20.6%", tone: "ok", note: "마케팅 미집행 효과 포함" },
];
export const BUDGET_ALERTS = [
  { level: "주의", k: "매출원가율 상승", text: "크로스 지원 이동 수당이 계획 대비 +4.2% — 수급 갭 해소 전까지 지속 전망", act: "일산·송파 채용 완료 시 정상화", tone: "warn" },
  { level: "정보", k: "마케팅 미집행 890만", text: "추천 유입이 유료 채널을 대체 — 잔여 예산은 채용 브랜딩으로 전용 검토", act: "8월 경영회의 안건", tone: "info" },
  { level: "주의", k: "GPM 29.4% (목표 32%)", text: "티어2 역마진 구간 — 가격 인상 결정과 연동", act: "가격 · 상품 섹션 참조", tone: "warn" },
];
export const SCENARIOS = [
  { k: "기본 (Base)", homes: "220가구", rev: "월 2.4억", op: "+4,100만", runway: "18개월", note: "일산 오픈 · 현 성장률 유지", tone: "ok" },
  { k: "낙관 (Bull)", homes: "280가구", rev: "월 3.1억", op: "+6,800만", runway: "24개월+", note: "K-factor 0.6 달성 · 급여사업 조기 진입", tone: "ok" },
  { k: "비관 (Bear)", homes: "160가구", rev: "월 1.7억", op: "+400만", runway: "9개월", note: "채용 실패로 확장 정체 · 규제 지연", tone: "bad" },
];

// ════ 경영 · 이번 주 챙길 일 (전 섹션 긴급 항목 통합) ════
// 방대한 섹션을 다 돌지 않아도 "지금 손대야 할 것"만 대시보드에서 본다.
// urgency: now(이번 주) · soon(2주 내) · watch(관찰)
export const EXEC_PRIORITY = [
  { u: "now", k: "의료법 27조 3항 계약 구조 전환", why: "병원 연계 수수료가 알선으로 해석될 위험 · 형사 리스크 (C4)",
    who: "법무 · 제휴", menu: "risk", label: "리스크 · 컴플라이언스" },
  { u: "now", k: "가입비 정책 확정 (12~15만)", why: "결제 단계 −18% 이탈의 직접 원인 · 퍼널 최대 병목",
    who: "경영 · 의사결정", menu: "pricing", label: "가격 · 상품" },
  { u: "now", k: "자격 만료 임박 2명 · 배차 제한 예정", why: "정민호 요양보호사 D-30 · 오하늘 BLS 갱신 — 배차 게이트 작동",
    who: "지점장", menu: "staffmgmt", label: "인원 관리" },
  { u: "now", k: "신원 조회 정체 5명 (최대 11일)", why: "외부 기관 회신 지연 — 일산 오픈 인력 12명 목표에 직결",
    who: "채용 담당", menu: "staffmgmt", label: "인원 관리" },
  { u: "soon", k: "결제 실패 6가구 · 312만", why: "카드 만료 3 · 잔액 부족 2 · 해외 카드 1 — 이탈 신호와 동일 건",
    who: "CS팀", menu: "crm", label: "CRM · 라이프사이클" },
  { u: "soon", k: "송파·마포 수급 갭 (화·목 0.8)", why: "배차 실패 구간 · 크로스 지원으로 임시 대응 중",
    who: "운영총괄", menu: "branches", label: "지점 현황" },
  { u: "soon", k: "PIA(개인정보 영향평가) 8월 진행", why: "완료 전에는 실명 데이터 투입 불가 — 실서버 전환 게이트",
    who: "CPO", menu: "security", label: "보안 · 데이터" },
  { u: "watch", k: "GPM 29.4% (목표 32%)", why: "티어2 역마진 · 크로스 지원 이동 수당 상승",
    who: "재무", menu: "pl", label: "예산 · 손익" },
  { u: "watch", k: "바이럴 루프 병목 — 초대 발송 52%", why: "추천 의향 79가구 대비 실제 발송 41건",
    who: "그로스", menu: "growth", label: "그로스 · 바이럴" },
  { u: "watch", k: "오하늘 이탈 위험 82점", why: "가동률 34% · 컴플레인 2건 · '지쳐요' 체크인 교차",
    who: "박성호 지점장", menu: "staff", label: "컨시어지 분석" },
];
export const PRIORITY_TONE = {
  now: { label: "이번 주", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  soon: { label: "2주 내", fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  watch: { label: "관찰", fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};
