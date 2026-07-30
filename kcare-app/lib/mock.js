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

// F8 외출 컨디션 — 서버 1회 계산 가정(핸드오프 06 §3.4). 어르신·가족·컨시어지가
// 같은 legs를 역할별로 다르게 표현한다. grade는 서버 확정값 — 클라이언트 재계산 금지.
// 도착지는 일정(ev1)과 맞춰 강남세브란스 유지 (명세 예시는 서울아산병원).
export const OUTING = {
  legs: [
    {
      tag: "출발",
      place: "대치동 자택",
      score: 62,
      grade: "보통",
      level: "caution",
      detail: "13:50 · 체감 35° · 자외선 매우 높음 · 미세먼지 보통",
    },
    {
      tag: "도착",
      place: "강남세브란스",
      score: 52,
      grade: "주의",
      level: "danger",
      detail: "14:30 · 체감 36° · 자외선 매우 높음 · 미세먼지 나쁨 82",
    },
  ],
  advice: "오후 2~4시 외출은 피하고, 양산과 물을 준비하세요.", // 가족·컨시어지용 압축 표현
  adviceElder:
    "햇볕이 매우 강합니다. 밝은 색 긴팔과 챙 넓은 모자를 쓰시고, 병원 근처는 공기가 나쁘니 마스크를 끼세요.",
  kit: ["양산", "챙 넓은 모자", "KF94 마스크", "생수 500ml", "얇은 긴팔"],
  source: "100점 감점식 · 케이웨더 제공",
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
    approved: true,
    customer: "김순자 (78)",
    purpose: "안심방문 · 케어박스 점검",
    origin: "강남 거점 (역삼동)",
    address: "강남구 대치동 ○○아파트 103동 1204호",
    dong: "강남구 대치동",
    hospital: null,
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

// ─── 관제(dispatch) 목 데이터 — 핸드오프 02 §4 + REQ-04 ────────────────────────
// 서비스 경계(REQ-04): 기본 상품 보증 범위는 "긴급신호 접수 + 119 연계"까지.
// 컨시어지 급파는 주간·가용 시. 야간 출동은 외주 옵션 상품(가구별 플래그).

export const DISPATCH_KPIS = [
  { label: "가동 컨시어지", value: "14" },
  { label: "진행 중 동행", value: "6" },
  { label: "대기 배차", value: "3" },
  { label: "SOS 초동 (오늘)", value: "41초" },
];

// AI 자율 배차 배정안 — why(선정 근거) 없는 배정안은 렌더 금지 (핸드오프 02 §4)
export const AI_ASSIGN = [
  {
    customer: "김순자 (78)",
    time: "13:50",
    task: "안심방문 · 케어박스 점검",
    to: "박지현 · 서다인",
    fit: 96,
    why: "기존 담당 페어 · 자택 1.2km · 동성 페어 규칙 충족",
  },
  {
    customer: "이영호 (81)",
    time: "내일 09:10",
    task: "병원동행 · 정형외과 재진",
    to: "김도윤 · 정민재",
    fit: 91,
    why: "어르신 성별 동일 1명 포함 · 패스트트랙 동행 경험 8회",
  },
  {
    customer: "박말순 (83)",
    time: "15:30",
    task: "약국 구매대행 · 생활 심부름",
    to: "한지민 · 이서연",
    fit: 88,
    why: "동선 인접 (대치동 → 역삼동 2.1km) · 4회 연속 배정 제한 준수",
  },
];

// SLA — SOS 초동은 "접수·연계" SLA (현장 도착 SLA 아님 — REQ-04 문서화)
export const DISPATCH_SLA = [
  { name: "SOS 초동 응답 (접수·연계)", target: "60초", current: "41초", pct: 68, note: "오늘 2건 · 최장 52초" },
  { name: "배차 확정", target: "10분", current: "6분", pct: 60, note: "AI 배정안 승인 대기 1건 포함" },
  { name: "방문 리포트 발송", target: "24시간", current: "9시간", pct: 38, note: "지연 0건" },
  { name: "가족 문의 콜백", target: "4시간", current: "1.8시간", pct: 45, note: "야간 접수분 익일 오전 처리" },
];

// 위험 관찰 목록 — 사건 C(폭염) 등. 원시 경보가 아니라 "조치"가 주어
export const RISK_WATCH = [
  {
    who: "김순자 (78)",
    why: "실내 31° + 폭염 특보 + 심부전 이력",
    action: "냉방 확인 콜 완료 · 동행 시 보냉백 지참",
    level: "높음",
  },
  {
    who: "이영호 (81)",
    why: "재진 전 복약 변경 이력",
    action: "동행 시 처방전 지참 확인",
    level: "중간",
  },
  {
    who: "박말순 (83)",
    why: "워치 6시간 무수집 (배터리 추정)",
    action: "배터리 원인 분리 후 안부콜",
    level: "중간",
  },
];

// 지자체 재난 피드 — 원시 경보를 "우리가 이미 한 조치"로 해석해 노출 (핸드오프 02 §4)
export const DISASTER_FEED = [
  {
    raw: "폭염 특보 발효 (강남구)",
    done: "독거 12가구 냉방 확인 콜 완료 · 동행 6건에 보냉백 지참 지시",
  },
  {
    raw: "오후 소나기 예보 (수도권)",
    done: "15시 이후 동행 3건에 우산 · 이동 경로 미끄럼 주의 반영",
  },
];

// 지도 마커 대체 목록 — Leaflet 연동 대기. 컨시어지/병원 팝업 정보를 카드로 표기
export const MAP_MARKERS = {
  concierges: [
    { name: "박지현 · 서다인", status: "김순자 자택 방문 중", detail: "간호사 출신 · 주동행 214건 · 평점 4.9" },
    { name: "김도윤 · 정민재", status: "역삼 거점 대기", detail: "요양보호사 · 주동행 96건 · 평점 4.7" },
    { name: "한지민 · 이서연", status: "이동 중 (대치동)", detail: "수습 1명 포함 · 부동행 페어" },
  ],
  hospitals: [
    { name: "강남세브란스", detail: "패스트트랙 대기 2일 · 예약 API 부분 연동 (3/18)" },
    { name: "서울아산병원", detail: "패스트트랙 슬롯 운영 · 전화 예약 대행" },
  ],
};

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
