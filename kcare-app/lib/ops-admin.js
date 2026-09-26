// 관제 콘솔 운영·관리 메뉴 목 데이터 — 해주세요 · 함께해요 · 커뮤니케이션 · 병원 · 계정 · 감사로그 · 연동상태.
// 2026-09-22 관제 개선 요청서 §12~§17 기준. 인물은 앱 데모 인물과 같다.
//
// 시각은 전부 고정 기준시각(NOW)에서 계산한다 — Date.now() 를 쓰면 서버 프리렌더와
// 클라이언트가 다른 값을 그려 하이드레이션이 어긋난다. 표기는 KST 로 직접 계산한다
// (toLocaleString 은 서버 시간대에 따라 결과가 달라진다).

export const TODAY = "2026-09-22";
const KST = 9 * 3600 * 1000;
export const NOW = Date.parse("2026-09-22T14:30:00+09:00");
export const T = (s) => Date.parse(`${s.replace(" ", "T")}:00+09:00`);
export const ago = (min) => NOW - min * 60000;

const p2 = (n) => String(n).padStart(2, "0");
function kst(ts) {
  const d = new Date(ts + KST);
  return {
    date: `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`,
    time: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`,
  };
}
export function fmtDate(ts) {
  return ts == null ? "—" : kst(ts).date;
}
export function fmtDT(ts) {
  if (ts == null) return "—";
  const k = kst(ts);
  return `${k.date.slice(5)} ${k.time}`;
}
// "오늘 09:10" · "어제 14:20" · "09-15 10:00"
export function fmtRel(ts) {
  if (ts == null) return "—";
  const k = kst(ts);
  if (k.date === TODAY) return `오늘 ${k.time}`;
  if (k.date === kst(NOW - 86400000).date) return `어제 ${k.time}`;
  return `${k.date.slice(5)} ${k.time}`;
}
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

// ── 데모 인물 ──
export const ELDERS = [
  // payLimit: 보호자 1회 결제 한도 — 김민수만 10만원으로 올려 두었다. 없으면 PRICING 기본 한도.
  { name: "김순자", age: 78, district: "강남구 대치동", manager: "박지현", guardian: "김민수", guardianRel: "아들", home: "대치동 자택", payLimit: 100000 },
  { name: "이영호", age: 81, district: "송파구 잠실동", manager: "이수민", guardian: "이성호", guardianRel: "아들", home: "잠실동 자택" },
  { name: "박말순", age: 83, district: "강동구 길동", manager: "정민호", guardian: "박은지", guardianRel: "장녀", home: "길동 자택" },
  { name: "한복자", age: 79, district: "강동구 길동", manager: "윤세라", guardian: "한준호", guardianRel: "아들", home: "길동 자택" },
  { name: "오태식", age: 80, district: "서초구", manager: "한서연", guardian: "확인 중", guardianRel: "", home: "서초 자택" },
  { name: "최정자", age: 75, district: "강남구", manager: "서다인", guardian: "최선영", guardianRel: "차녀", home: "강남 자택" },
  { name: "강필순", age: 82, district: "강남구", manager: "오하늘", guardian: "확인 중", guardianRel: "", home: "강남 자택" },
];
export const ELDER_NAMES = ELDERS.map((e) => e.name);
export const CONCIERGES = ["박지현", "서다인", "한서연", "오하늘", "정민호", "이수민", "윤세라"];
export const elderOf = (name) => ELDERS.find((e) => e.name === name);

// ── §12 해주세요 — 앱 상태(state.requests)에 없는 다른 고객의 데모 요청 ──
// 형태는 lib/seed.js INITIAL_REQUESTS 와 같고 elder 만 더 있다. 상태 전이는 lib/requests.transition 을 그대로 쓴다.
const hist = (arr) => arr.map(([d, status, note]) => ({ at: T(d), status, note: note || "" }));
export const OPS_REQUEST_EXTRAS = [
  {
    id: "rq-d1", elder: "김순자", dir: "fromGuardian", type: "협력 병원 예약 대행",
    detail: "10월 초 강남세브란스 내과 재진 예약을 잡아 주세요. 오전 시간대 선호.",
    amount: 0, preferredDate: "2026-10-02", urgency: "normal", assignee: "박지현", photos: [], proof: null,
    status: "confirmed",
    history: hist([["2026-09-21 20:12", "requested"], ["2026-09-22 09:05", "confirmed", "병원 예약 슬롯 확인 중"]]),
  },
  {
    id: "rq-d2", elder: "이영호", dir: "fromElder", type: "생활 대행",
    detail: "잠실 새마을시장 장보기 · 쌀 10kg · 김치 담을 배추 2포기.",
    amount: 30000, preferredDate: "2026-09-24", urgency: "normal", assignee: "이수민", photos: [], proof: null,
    status: "inProgress",
    history: hist([["2026-09-20 10:40", "requested", "말로 요청"], ["2026-09-20 11:02", "confirmed"], ["2026-09-21 09:00", "inProgress", "방문 일정에 반영"]]),
  },
  {
    id: "rq-d3", elder: "박말순", dir: "fromGuardian", type: "병원 동행 프리미엄 (2인 1조)",
    detail: "9/25 강동성심병원 정형외과 외래 · 자택 픽업 필요 · 휠체어 사용.",
    amount: 90000, preferredDate: "2026-09-25", urgency: "normal", assignee: "정민호", photos: [], proof: null,
    status: "awaitingPayment",
    history: hist([["2026-09-19 18:30", "requested"], ["2026-09-20 09:10", "confirmed", "정민호 · 서다인(차량) 2인 편성"], ["2026-09-20 09:12", "awaitingPayment", "기본 2시간 90,000원 · 보호자 승인 요청"]]),
  },
  {
    id: "rq-d4", elder: "최정자", dir: "fromConcierge", type: "약국 심부름",
    detail: "혈압약 처방전 재발급분 조제 · 자택 전달. 오늘 중 필요.",
    amount: null, preferredDate: "2026-09-23", urgency: "urgent", assignee: "서다인", photos: [], proof: null,
    status: "requested",
    history: hist([["2026-09-22 13:48", "requested", "안심방문 중 잔여 약 2일분 확인"]]),
  },
  {
    id: "rq-d5", elder: "한복자", dir: "fromGuardian", type: "자택 안심케어 추가 방문",
    detail: "명절 전 집 정리 상태 · 냉장고 식품 확인 부탁.",
    amount: 60000, preferredDate: "2026-09-18", urgency: "normal", assignee: "윤세라", photos: ["visit-2026-09-18-kitchen.jpg"], proof: "visit-2026-09-18-report.pdf",
    status: "done",
    history: hist([["2026-09-15 21:00", "requested"], ["2026-09-16 09:20", "confirmed"], ["2026-09-16 09:21", "awaitingPayment", "60,000원 승인 요청"], ["2026-09-16 12:40", "inProgress", "보호자 승인 완료"], ["2026-09-18 11:30", "done", "냉장고 유통기한 지난 식품 3건 폐기 · 사진 첨부"]]),
  },
  {
    id: "rq-d6", elder: "오태식", dir: "fromOps", type: "복지 혜택 확인",
    detail: "노인 돌봄 바우처 대상 여부 확인 후 보호자 안내.",
    amount: 0, preferredDate: null, urgency: "normal", assignee: "한서연", photos: [], proof: null,
    status: "cancelled",
    history: hist([["2026-09-12 10:00", "requested", "관제 제안"], ["2026-09-14 15:20", "cancelled", "보호자 연락처 미확정 · 확정 후 재접수"]]),
  },
  {
    id: "rq-d7", elder: "최정자", dir: "fromGuardian", type: "생활 대행",
    detail: "매주 금요일 오전 산책 동행 · 말벗 (반복).",
    amount: 30000, preferredDate: "2026-09-26", urgency: "normal", assignee: "서다인", photos: [], proof: null,
    status: "confirmed",
    history: hist([["2026-09-05 22:10", "requested", "도쿄에서 앱 접수"], ["2026-09-06 09:00", "confirmed", "매주 반복 요청"]]),
  },
];
// 앱 상태에 없는 열(실제 비용·영수증·완료 확인·평가·환불·반복)의 데모 초깃값 — id 별
export const OPS_REQUEST_META = {
  "rq-d5": { cost: 60000, receipt: "receipt-rq-d5.jpg", confirmedAt: T("2026-09-18 17:05"), confirmedBy: "한준호(보호자)", rating: 5, ratingNote: "사진 보고가 꼼꼼했어요" },
  "rq-d7": { repeat: { on: true, every: "매주" } },
  "rq-d6": { refund: { status: "해당 없음", amount: 0, reason: "무료 서비스" } },
};
export const REQ_DIR = {
  fromGuardian: "보호자",
  fromElder: "어르신",
  fromConcierge: "컨시어지",
  fromOps: "관제",
};
export const REPEAT_OPTIONS = ["매주", "2주마다", "매월"];

// ── §13 함께해요 ──
// 함께가요 — 2026-09-22 요청서로 새로 들어온 서비스. 단가·조건은 요청서 그대로다.
export const TOGETHER_GO = {
  name: "함께가요",
  priceLabel: "시간당 35,000원 · 실비 별도",
  scope: "컨시어지 2명 동행 · 근교 나들이 · 차량 제공 · 자택에서 편도 1시간 이내",
  note: "입장료 · 식사 · 주차 등 실비는 현장 결제 후 영수증으로 정산합니다",
};
export const TOGETHER_CLIENTS = [
  {
    elder: "김순자", manager: "박지현", active: true,
    lastTalk: { at: T("2026-09-21 10:40"), summary: "손주 운동회 이야기 · 무릎 통증으로 산책 거리 줄이고 싶다고 하심", by: "박지현" },
    interests: ["화초 가꾸기", "손주", "옛 가요", "시장 구경"],
    mood: { observed: "대화 시간 30분 유지 · 웃음 잦음 · 먼저 화초 이야기를 꺼내심", changes: "지난주보다 외출 의욕이 낮아짐 (\"무릎이 시원치 않다\")", needsCheck: "무릎 통증 정도 · 보행 보조 필요 여부 (다음 방문에서 확인)" },
    vsPrev: "대화량 비슷 · 외출 의욕 감소 · 식사량 유지",
    promises: [
      { text: "10/2 병원 재진 전날 전화로 준비물 확인", due: "2026-10-01", done: false },
      { text: "다음 방문 때 베란다 화분 분갈이 함께", due: "2026-09-26", done: false },
      { text: "옛 가요 CD 챙겨 오기", due: "2026-09-19", done: true },
    ],
    nextCheck: "2026-09-24",
    shared: "9/21 대화 요약 · 무릎 불편 언급 · 다음 방문 계획 (김민수 열람 완료)",
    privateMemo: "차녀 이야기가 나오면 말을 돌리심 — 먼저 묻지 않기. 보호자 미공유.",
    history: [
      { at: T("2026-09-21 10:40"), kind: "말벗", text: "정기 말벗 30분 · 화초·손주 이야기", by: "박지현" },
      { at: T("2026-09-16 14:00"), kind: "산책", text: "대치공원 20분 · 무릎 통증 호소로 조기 귀가", by: "박지현" },
      { at: T("2026-09-10 10:30"), kind: "장보기", text: "은마시장 장보기 동행 · 40분", by: "박지현" },
      { at: T("2026-09-02 15:00"), kind: "함께가요", text: "양재 시민의숲 나들이 · 컨시어지 2명 · 3시간", by: "박지현·서다인" },
    ],
  },
  {
    elder: "이영호", manager: "이수민", active: true,
    lastTalk: { at: T("2026-09-20 10:40"), summary: "장보기 목록 정리 · 바둑 프로그램 이야기", by: "이수민" },
    interests: ["바둑", "야구 중계", "시장 장보기"],
    mood: { observed: "말수 보통 · 바둑 이야기에 활기", changes: "특이 변화 없음", needsCheck: "" },
    vsPrev: "변화 없음",
    promises: [{ text: "9/24 장보기 때 배추 고르는 것 함께", due: "2026-09-24", done: false }],
    nextCheck: "2026-09-24",
    shared: "9/20 통화 요약 (이성호 열람 완료)",
    privateMemo: "",
    history: [
      { at: T("2026-09-20 10:40"), kind: "말벗", text: "전화 말벗 15분", by: "이수민" },
      { at: T("2026-09-13 10:00"), kind: "장보기", text: "새마을시장 장보기 1시간", by: "이수민" },
    ],
  },
  {
    elder: "박말순", manager: "정민호", active: true,
    lastTalk: { at: T("2026-09-19 15:20"), summary: "병원 동행 일정 안내 · 부산 딸 이야기", by: "정민호" },
    interests: ["텔레비전 연속극", "뜨개질", "딸 소식"],
    mood: { observed: "표정 차분 · 대화 중 딸 이야기에 눈물 비침", changes: "지난 2주 방문 때보다 말수 감소", needsCheck: "혼자 있는 시간의 식사 · 수면 — 보호자와 통화 필요" },
    vsPrev: "말수 감소 · 뜨개질은 계속 하심",
    promises: [{ text: "동행 전 휠체어 대여 확인", due: "2026-09-24", done: false }, { text: "뜨개실 색상 사진 보호자에게 전달", due: "2026-09-20", done: true }],
    nextCheck: "2026-09-23",
    shared: "9/19 방문 요약 · 말수 감소 관찰 (박은지 미열람)",
    privateMemo: "딸(박은지) 통화 후 기분 변동 큼 — 통화 직후 방문은 피하기. 보호자 미공유.",
    history: [
      { at: T("2026-09-19 15:20"), kind: "방문 말벗", text: "방문 말벗 40분 · 뜨개질 함께", by: "정민호" },
      { at: T("2026-09-05 15:00"), kind: "산책", text: "길동생태공원 산책 30분", by: "정민호" },
    ],
  },
  {
    elder: "한복자", manager: "윤세라", active: true,
    lastTalk: { at: T("2026-09-18 11:30"), summary: "명절 준비 · 손주 선물 이야기", by: "윤세라" },
    interests: ["요리", "손주", "성당 모임"],
    mood: { observed: "밝고 활기 · 명절 준비로 분주", changes: "특이 변화 없음", needsCheck: "" },
    vsPrev: "변화 없음",
    promises: [{ text: "10/3 함께가요 나들이 일정 확정 전화", due: "2026-09-26", done: false }],
    nextCheck: "2026-09-26",
    shared: "9/18 추가 방문 보고서 (한준호 열람 완료)",
    privateMemo: "",
    history: [
      { at: T("2026-09-18 11:30"), kind: "방문 말벗", text: "추가 방문 중 말벗 20분", by: "윤세라" },
      { at: T("2026-08-30 13:00"), kind: "함께가요", text: "남한산성 나들이 · 컨시어지 2명 · 4시간", by: "윤세라·정민호" },
    ],
  },
  {
    elder: "오태식", manager: "한서연", active: true,
    lastTalk: { at: T("2026-09-15 09:30"), summary: "KMI 검진 결과지 설명 · 등산 이야기", by: "한서연" },
    interests: ["등산", "신문 읽기"],
    mood: { observed: "말수 적음 · 질문에는 또박또박 답하심", changes: "지난달보다 전화 응답 느려짐", needsCheck: "보호자 연락처 미확정 — 비상연락 체계 확인" },
    vsPrev: "전화 응답 지연 · 외출은 유지",
    promises: [{ text: "가벼운 산책 코스 추천 자료 전달", due: "2026-09-22", done: false }],
    nextCheck: "2026-09-22",
    shared: "보호자 미등록 — 공유 대상 없음",
    privateMemo: "가족 이야기를 꺼리심. 보호자 미공유.",
    history: [{ at: T("2026-09-15 09:30"), kind: "동행", text: "KMI 검진 동행 중 대화 20분", by: "한서연" }],
  },
  {
    elder: "최정자", manager: "서다인", active: true,
    lastTalk: { at: T("2026-09-22 13:40"), summary: "약 잔여량 확인 · 금요일 산책 코스 상의", by: "서다인" },
    interests: ["산책", "커피", "일본 드라마"],
    mood: { observed: "밝음 · 금요일 산책을 기다리심", changes: "특이 변화 없음", needsCheck: "" },
    vsPrev: "변화 없음",
    promises: [{ text: "9/26 산책 후 카페 들르기", due: "2026-09-26", done: false }],
    nextCheck: "2026-09-26",
    shared: "9/22 방문 요약 (최선영 미열람 · 도쿄 시차)",
    privateMemo: "",
    history: [
      { at: T("2026-09-22 13:40"), kind: "방문 말벗", text: "안심방문 중 말벗 20분", by: "서다인" },
      { at: T("2026-09-19 10:00"), kind: "산책", text: "선정릉 산책 50분 · 카페", by: "서다인" },
      { at: T("2026-09-12 10:00"), kind: "산책", text: "선정릉 산책 45분", by: "서다인" },
    ],
  },
  {
    elder: "강필순", manager: "오하늘", active: true,
    lastTalk: { at: T("2026-09-10 11:00"), summary: "전화 말벗 · 무릎 · 날씨", by: "오하늘" },
    interests: ["라디오", "화투", "옛 사진"],
    mood: { observed: "9/10 이후 전화 미응답 3회 · 마지막 통화는 평온", changes: "연락 빈도 급감", needsCheck: "장기 무응답 — 방문 확인 필요 (보호자 미등록)" },
    vsPrev: "확인 불가 (무응답)",
    promises: [{ text: "옛 사진 앨범 함께 보기", due: "2026-09-17", done: false }],
    nextCheck: "2026-09-22",
    shared: "보호자 미등록 — 공유 대상 없음",
    privateMemo: "",
    history: [{ at: T("2026-09-10 11:00"), kind: "말벗", text: "전화 말벗 10분", by: "오하늘" }],
  },
];
// 함께가요 나들이 요청 — 데모 2건. 실비는 항목만 두고 금액은 현장 결제 후 정산.
export const OUTING_REQUESTS = [
  {
    id: "go1", elder: "한복자", date: "2026-10-03 10:00", concierges: ["윤세라", "정민호"], vehicle: "서다인 차량 (카니발)",
    destination: "남한산성 (성남)", oneWayMin: 45, estHours: 4, expenses: ["주차", "점심 식사", "입장료 없음"], status: "예정",
  },
  {
    id: "go2", elder: "김순자", date: "2026-10-10 13:00", concierges: ["박지현", "서다인"], vehicle: "서다인 차량 (카니발)",
    destination: "양재 시민의숲", oneWayMin: 25, estHours: 3, expenses: ["주차", "간식·차"], status: "일정 조율 중",
  },
];

// ── §14 커뮤니케이션 ──
export const COMM_CHANNELS = {
  elderCall: { label: "어르신 통화", icon: "mic" },
  guardianCall: { label: "보호자 통화", icon: "users" },
  push: { label: "앱 푸시", icon: "bell" },
  sms: { label: "문자", icon: "chat" },
  voice: { label: "음성메시지", icon: "speaker" },
  order: { label: "컨시어지 업무지시", icon: "list" },
  report: { label: "보고서 발송", icon: "doc" },
  auto: { label: "자동알림", icon: "repeat" },
};
export const COMM_STATUS = {
  read: { label: "읽음", tone: "ok" },
  unread: { label: "미열람", tone: "warn" },
  replied: { label: "회신", tone: "info" },
  failed: { label: "발송 실패", tone: "warn" },
  answered: { label: "통화 완료", tone: "ok" },
  noAnswer: { label: "미응답", tone: "warn" },
};
const c = (id, at, elder, channel, to, text, status, extra = {}) => ({ id, at: T(at), elder, channel, to, text, status, by: "김태영", sos: false, ...extra });
export const COMMS = [
  c("cm01", "2026-09-22 14:10", "김순자", "report", "김민수", "정기방문 보고서 9/21", "read"),
  c("cm02", "2026-09-22 13:52", "최정자", "order", "서다인", "약국 심부름 — 처방전 재발급분 조제·전달 (오늘 중)", "read"),
  c("cm03", "2026-09-22 13:30", "강필순", "elderCall", "강필순", "안부 전화 3차 시도", "noAnswer"),
  c("cm04", "2026-09-22 12:05", "박말순", "sms", "박은지", "9/25 병원 동행 결제 승인 요청 (90,000원)", "unread"),
  c("cm05", "2026-09-22 11:40", "이영호", "auto", "이영호", "복약 시간 알림 (점심)", "read"),
  c("cm06", "2026-09-22 10:30", "김순자", "guardianCall", "김민수", "10/2 재진 예약 진행 안내", "answered"),
  c("cm07", "2026-09-22 09:15", "오태식", "push", "오태식", "오늘 일정 안내 · 산책 코스 자료", "failed", { fail: "기기 토큰 만료" }),
  c("cm08", "2026-09-22 08:40", "한복자", "auto", "한준호", "야간 활동 정상 · 아침 요약", "read"),
  c("cm09", "2026-09-22 08:02", "김순자", "voice", "김순자", "아들 김민수 안부 음성 12초 전달", "read"),
  c("cm10", "2026-09-21 18:20", "김순자", "report", "김지영", "주간 건강 요약 9/15~9/21", "unread"),
  c("cm11", "2026-09-21 17:00", "강필순", "elderCall", "강필순", "안부 전화 2차 시도", "noAnswer"),
  c("cm12", "2026-09-21 16:30", "이영호", "guardianCall", "이성호", "장보기 대행 일정 안내", "noAnswer"),
  c("cm13", "2026-09-21 10:45", "김순자", "elderCall", "김순자", "박지현 말벗 후 관제 확인 전화", "answered"),
  c("cm14", "2026-09-20 19:10", "최정자", "report", "최선영", "안심방문 보고서 9/19", "unread"),
  c("cm15", "2026-09-20 15:00", "이영호", "guardianCall", "이성호", "결제 수단 확인", "noAnswer"),
  c("cm16", "2026-09-20 11:02", "이영호", "sms", "이영호", "장보기 요청 접수 확인", "replied"),
  c("cm17", "2026-09-19 18:35", "박말순", "push", "박은지", "병원 동행 요청 접수", "read"),
  c("cm18", "2026-09-19 09:00", "김순자", "auto", "김민수", "혈압 측정 미수신 6시간 안내", "read"),
  c("cm19", "2026-09-18 17:05", "한복자", "report", "한준호", "추가 방문 보고서 9/18", "read"),
  c("cm20", "2026-09-16 14:40", "김순자", "order", "박지현", "산책 조기 귀가 후 무릎 상태 관찰 기록 요청", "read"),
  c("cm21", "2026-09-15 20:10", "김순자", "report", "김지영", "주간 건강 요약 9/8~9/14", "unread"),
  c("cm22", "2026-09-14 10:20", "강필순", "elderCall", "강필순", "안부 전화 1차 시도", "noAnswer"),
  c("cm23", "2026-09-10 11:00", "강필순", "elderCall", "강필순", "정기 안부 전화", "answered"),
  // SOS 관련 연락 — 일반 상담과 분리 (§14)
  c("sos1", "2026-09-22 07:42", "김순자", "auto", "김민수", "SOS 낙상 의심 감지 · 관제 확인 중", "read", { sos: true }),
  c("sos2", "2026-09-22 07:43", "김순자", "elderCall", "김순자", "SOS 확인 전화 — 응답 · 욕실에서 미끄러짐, 의식 명료", "answered", { sos: true }),
  c("sos3", "2026-09-22 07:46", "김순자", "guardianCall", "김민수", "SOS 상황 · 컨시어지 출동 안내", "answered", { sos: true }),
  c("sos4", "2026-09-22 07:47", "김순자", "order", "박지현", "긴급 출동 — 대치동 자택 · 낙상 확인", "read", { sos: true }),
  c("sos5", "2026-09-22 08:35", "김순자", "sms", "김지영", "SOS 종료 · 경미한 타박 · 병원 이송 없음", "unread", { sos: true }),
  c("sos6", "2026-09-22 08:36", "김순자", "report", "김민수", "SOS 사건 보고서 #S-0922-01", "read", { sos: true }),
];
