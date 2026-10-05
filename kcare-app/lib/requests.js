// 양방향 "해주세요" 업무형 요청 시스템 — REQ-03
// 상태와 허용 전이. 상태 전이는 이 모듈만 경유한다.
//
// 2026-10-05 운영 결정 (docs/kcare/decisions/2026-10-05-request-flow.md):
//   · 보호자 · 어르신의 해주세요는 '배정된 컨시어지'가 자기 일정을 보고 승인(날짜 · 시간 확정)하거나 거절한다.
//     관제는 처리 현황 · 승인 내역 · 결제액을 보고, 강제 취소와 취소 요청 승인만 한다.
//   · 컨시어지가 제안하는 해주세요는 컨시어지가 정한 승인 대상(보호자 또는 어르신)이 수락 · 거절한다.
//   · 결제는 요청할 때 먼저 (보호자 결제). 거절 · 취소되면 환불 — 베타에서는 관제의 '환불 대기'로 넘어간다.
//   · 확정 뒤 취소: 서비스일 3일 전까지는 바로 취소, 그 안(2일 전 · 전날 · 당일)은 관제가 취소를 승인한다.
//   · 도와줘요(즉시 방문 요청)는 지금처럼 관제가 확인 전화 후 배차한다 — 이 규칙 밖.

export const STATUS = {
  awaitingPayment: { label: "결제대기", fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  requested: { label: "승인 대기", fg: "#0A1F3C", bg: "rgba(10,31,60,.08)" },
  confirmed: { label: "확정", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)" },
  cancelRequested: { label: "취소 요청", fg: "#8A5D12", bg: "rgba(138,93,18,.14)" },
  inProgress: { label: "처리중", fg: "#B08D57", bg: "rgba(176,141,87,.16)" },
  done: { label: "완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" },
  cancelled: { label: "취소", fg: "#5C5A54", bg: "rgba(92,90,84,.12)" },
  // 빨강은 위험 신호(SOS · 낙상) 전용 — 거절 · 관리자 확인은 회색 · 금색으로 둔다
  rejected: { label: "거절", fg: "#5C5A54", bg: "rgba(92,90,84,.12)" },
  needsAdmin: { label: "관리자 확인필요", fg: "#8A5D12", bg: "rgba(138,93,18,.14)" },
};

const TRANSITIONS = {
  // 선결제 — 결제가 끝나면 승인 대기로(이미 승인된 건 · 수락한 제안은 확정으로)
  awaitingPayment: ["requested", "confirmed", "cancelled", "needsAdmin"],
  // 승인 대기 — 컨시어지(또는 제안의 승인 대상)가 확정 · 거절. 요금 확정 전 항목은 승인하면서 금액을 정하고 결제로
  requested: ["confirmed", "awaitingPayment", "cancelled", "rejected", "needsAdmin"],
  confirmed: ["inProgress", "cancelRequested", "cancelled", "needsAdmin"],
  // 취소 요청 — 관제가 승인하면 취소, 반려하면 원래 상태로
  cancelRequested: ["cancelled", "confirmed", "inProgress"],
  inProgress: ["done", "cancelRequested", "cancelled", "needsAdmin"],
  done: [],
  cancelled: [],
  rejected: [],
  needsAdmin: ["requested", "confirmed", "inProgress", "cancelled", "rejected"],
};

export const CLOSED = ["done", "cancelled", "rejected"];

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// at — 서버 저장 모드에서는 동작 시각(_at)을 넘긴다 (다른 기기에서 다시 적용해도 같은 이력이 되게)
export function transition(req, to, note, at = Date.now(), extra = {}) {
  if (!canTransition(req.status, to)) return req;
  return {
    ...req,
    status: to,
    history: [...(req.history || []), { at, status: to, note: note || "", ...extra }],
  };
}

// ── 날짜 · 취소 규칙 ──
const KST = 9 * 3600 * 1000;
export const kstYmd = (t) => new Date(Number(t) + KST).toISOString().slice(0, 10);
const isYmd = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
// 희망일 — 보호자 앱은 시각값(숫자), 어르신 · 예시 데이터는 'YYYY-MM-DD'
export function preferredYmd(r) {
  const v = r?.preferredDate;
  if (typeof v === "number" && Number.isFinite(v)) return kstYmd(v);
  return isYmd(v) ? v : null;
}
// 서비스일 — 컨시어지가 승인하며 정한 날짜, 아직이면 희망일
export const serviceYmd = (r) => (isYmd(r?.scheduledDate) ? r.scheduledDate : preferredYmd(r));
// 오늘(한국 날짜)부터 그 날까지 며칠 — 당일 0, 전날 1
export function daysUntil(ymd, now = Date.now()) {
  if (!isYmd(ymd)) return null;
  return Math.round((Date.parse(ymd) - Date.parse(kstYmd(now))) / 86400000);
}
export const CANCEL_FREE_DAYS = 3; // 서비스일 3일 전까지는 바로 취소

// 지금 이 요청을 취소하면 어떻게 되나
//   free    — 바로 취소 (승인 전이거나 서비스일 3일 이상 남음). 결제했으면 환불 대기로
//   ops     — 관제 승인이 필요한 취소 요청 (서비스일 2일 전 · 전날 · 당일 · 진행 중)
//   pending — 이미 취소 요청이 관제에 가 있다
//   none    — 끝난 건
export function cancelRule(r, now = Date.now()) {
  if (!r || CLOSED.includes(r.status)) return { mode: "none" };
  if (r.status === "cancelRequested") return { mode: "pending" };
  if (r.status === "inProgress") return { mode: "ops", days: daysUntil(serviceYmd(r), now) };
  if (r.status !== "confirmed") return { mode: "free" };
  const days = daysUntil(serviceYmd(r), now);
  if (days == null) return { mode: "ops", days };
  return days >= CANCEL_FREE_DAYS ? { mode: "free", days } : { mode: "ops", days };
}

// 확정 일정 한 줄 — "2026-10-28 14:00"
export function fmtScheduled(r) {
  if (!isYmd(r?.scheduledDate)) return null;
  return `${r.scheduledDate}${r.scheduledTime ? ` ${r.scheduledTime}` : ""}`;
}

// 이 요청의 결제 — 보호자가 토스(또는 데모 가상 승인)로 낸 것. 어르신 직접(payBy elder)은 기록만 있다
export function paymentOf(payments, id) {
  return (payments || []).find((p) => p.ref === id && p.status === "done") || null;
}

// 누가 승인하나 — 보호자 · 어르신 요청은 담당 컨시어지, 컨시어지 제안은 컨시어지가 정한 승인 대상
export const APPROVER_LABEL = { concierge: "담당 컨시어지", guardian: "보호자", elder: "어르신", ops: "관제" };
export function approverOf(r) {
  if (r?.dir === "fromConcierge") return r.approver === "elder" ? "elder" : "guardian";
  if (r?.dir === "fromOps") return "guardian";
  return "concierge";
}
// 도와줘요(즉시 방문 요청)는 관제가 확인 전화로 받는다 — 컨시어지 승인 큐에 넣지 않는다
export const isVisitCall = (r) => r?.type === "즉시 방문 요청";
// 스토어 주문의 배송 요청 — 결제가 주문(스토어)에 묶여 있어 해주세요 취소 · 환불로 다루지 않는다 (주문 취소는 관제 · 고객센터)
export const isStoreOrder = (r) => ["물품 전달해 주세요", "물건을 담았어요", "물건 승인 부탁해요"].includes(r?.type);

// ── 보호자 '해주세요' 서비스 메뉴 — kcare팀 실무자 피드백 (2026-08-09 엑셀) ──
//
// 분류는 2026-08-28 실무진 제안대로 5개 축이다:
//   건강지원 — 병원동행 · 검진동행 · 약국 심부름
//   생활지원 — 장보기 · 생활용품 구매 · 방문지원
//   가족지원 — 자녀 등하원 · 학원 · 병원 동행 (신규)
//   전문지원 — 검증된 전문인력 · 지역업체 연결
//   긴급지원 — 보호자 요청에 따른 확인방문 · 긴급 동행
// 이전 6분류(의료/생활/주거/행정/돌봄/응급)를 여기에 접었다 — 어르신·보호자가
// 고를 때 "이건 어느 분류지"를 덜 묻게 하는 것이 목적이다.
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
    cat: "건강지원",
    scope: "요청한 의료기관 병원 예약 · 일정 관리 (보호자 가족 포함)",
    point: "병원 선정 · 비급여 진료비의 정보 비대칭을 줄입니다",
    active: true,
  },
  {
    no: 2,
    name: "병원 동행 프리미엄 (2인 1조)",
    priceLabel: "기본 2시간 · 시간당 45,000원 (VAT 별도) · 추가 30분 10,000원",
    amount: 90000, // 기본 2시간 기준
    cat: "건강지원",
    scope: "자택 픽업 · 드랍, 차량 지원, 기본 2시간 이후 30분 단위 연장",
    point: "동행 상세 리포트 제공",
    active: true,
  },
  {
    no: 3,
    name: "병원 동행 베이직 (1인)",
    priceLabel: "시간당 15,000원 · 추가 30분 8,000원",
    amount: 15000,
    cat: "건강지원",
    scope: "지정한 의료기관에서 만나 접수 · 진료 · 수납 동행",
    point: "동행 상세 리포트 제공",
    active: true,
  },
  {
    no: 4,
    name: "요양병원 안심케어 (1인)",
    priceLabel: "1회 1시간 60,000원 (병원 위치 · 지역별 차등)",
    amount: 60000,
    cat: "건강지원",
    scope: "요양병원 맞춤 21항목 안심 체크리스트 확인",
    point: "사진 포함 안심 리포트 · 자녀 동영상 메시지 전달",
    active: true,
  },
  {
    no: 5,
    name: "자택 안심케어 추가 방문",
    priceLabel: "1회 1시간 60,000원",
    amount: 60000,
    cat: "생활지원",
    scope: "월 1회 포함분 외 추가 21항목 안심방문",
    point: "사진 포함 안심 리포트 · 자녀 동영상 메시지 전달",
    active: true,
  },
  {
    no: 6,
    // 이름은 '생활 대행' → '함께 해요' (2026-09-11 시트 어르신 해주세요 2번). 내용은 그대로.
    name: "함께 해요",
    priceLabel: "시간당 30,000원 · 기본 1시간 최대 2시간 · 추가 30분 10,000원",
    amount: 30000,
    cat: "생활지원",
    scope: "관공서 · 은행 · 장보기 · 산책 · 말벗",
    point: null,
    active: true,
  },
  {
    // 함께가요 — 2026-09-11 시트 어르신 해주세요 3번 (신설). 컨시어지 2명과 근교 나들이.
    // 시간당 35,000원 · 차량 제공 · 자택에서 편도 1시간 안 · 입장료·식사 등 실비는 별도.
    no: 15,
    name: "함께가요",
    priceLabel: "시간당 35,000원 · 차량 제공 · 자택에서 편도 1시간 이내 · 실비 별도",
    amount: 35000,
    cat: "생활지원",
    scope: "컨시어지 2명과 함께 근교 나들이 — 차량으로 모시고 다녀옵니다",
    point: "자택에서 편도 1시간 안에 갈 수 있는 곳",
    note: "입장료 · 식사 등 실비는 별도입니다",
    crew: 2,
    active: true,
  },
  { no: 7, name: "청소 서비스", cat: "생활지원", scope: "매트리스 · 냉장고 정리 · 에어컨 청소", active: false },
  { no: 8, name: "주거 관리 서비스", cat: "생활지원", scope: "전등 · 문고리 교체 등 간단 집수리", active: false },
  {
    // 복지혜택 — 베타부터 연다 (2026-09-04 시트 앱 전체 3번). 고객 정보에 맞는
    // 나라·지자체 지원을 관제가 자동으로 찾고(lib/welfare.js), 보호자가 신청하거나
    // 컨시어지가 제안한다. 무료 회원도 같이 쓴다 — 그래서 amount 0.
    no: 9,
    name: "복지 혜택 확인",
    priceLabel: "무료 · 무료 회원도 이용",
    amount: 0,
    cat: "생활지원",
    scope: "나라·지자체 지원 중 받으실 수 있는 것을 찾아 알려드리고 신청을 돕습니다",
    point: "정책 79건 · 2026-09-04 검증 · 분기마다 재확인",
    active: true,
    welfare: true, // 화면이 일반 요청 시트 대신 복지혜택 목록을 연다
  },
  { no: 10, name: "요양보호사 연결", cat: "전문지원", scope: "주변 재가센터 연결", active: false },
  { no: 11, name: "방문 간호 연결", cat: "건강지원", scope: "주변 재가센터 연결", active: false },
  {
    // 약국 심부름 — 처방약 수령·전달 동행 (2026-08-28 분류 제안 '건강지원').
    // 스토어의 일반의약품 구매대행과는 다른 것이다 — 그쪽은 앱 결제라 불가해서
    // 통째로 뺐고(lib/store.js), 이것은 현장에서 어르신 돈으로 결제하고 받아다
    // 드리는 심부름이다. 단가는 아직 확정 전.
    no: 13,
    name: "약국 심부름",
    priceLabel: "요금 확정 전",
    amount: null,
    cat: "건강지원",
    scope: "처방전 접수 · 조제약 수령 · 자택 전달",
    point: "약값은 어르신 카드로 현장 결제하고 영수증을 드립니다",
    active: true,
  },
  {
    // 자녀 동행 — 2026-08-28 실무진 제안 '가족지원'. 조부모를 대신한 손주 이동지원까지.
    // 보호자가 지정한 장소까지 도보·대중교통으로 데려다 드리고, 지정된 보호자나
    // 담당자에게 직접 인계한다. 인계 확인 없이 두고 오는 일은 없다.
    // 단가는 시트에 없어서 확정 전으로 둔다 — 지어내지 않는다.
    no: 14,
    name: "자녀 · 손주 동행",
    priceLabel: "요금 확정 전",
    amount: null,
    cat: "가족지원",
    scope: "학교 · 학원 등하원 · 학원 간 이동 · 병원 · 치과 방문 동행",
    point: "지정된 보호자 또는 담당자에게 직접 인계합니다",
    note: "보호자가 지정한 장소까지 도보·대중교통으로 동행합니다. 긴급한 단시간 외출 동행, 조부모를 대신한 손주 이동지원도 포함합니다",
    active: true,
  },
  {
    // PLUS 에 있던 "SOS 응급 보호자 대행"을 여기로 합쳤다 (2026-08-21 시트 보호자 1번).
    // 요금은 2026-09-11 실무진 결정 2번으로 확정: 평일 주간 30,000 · 야간 50,000 /
    // 토·일·공휴일 주간 45,000 · 야간 70,000. amount 는 결제권한 판단에 쓰는 최저 단가(평일 주간).
    no: 12,
    name: "응급 상황 대응",
    priceLabel: "평일 주간 30,000원 · 야간 50,000원 / 토·일·공휴일 주간 45,000원 · 야간 70,000원",
    amount: 30000,
    rates: [
      { when: "평일 주간", amount: 30000 },
      { when: "평일 야간", amount: 50000 },
      { when: "토·일·공휴일 주간", amount: 45000 },
      { when: "토·일·공휴일 야간", amount: 70000 },
    ],
    cat: "긴급지원",
    scope:
      "보호자가 도착하기 전까지, 또는 보호자가 오지 못하면 상황 종료 시점까지 병원에 함께 있습니다",
    point: "24시간 접수와 연결됩니다",
    note: "관제가 응급동행자를 호출하고 고객 기본정보를 전송합니다. 응급동행자는 현장 상황 전달 역할입니다",
    active: true,
  },
];

// ── 해주세요 PLUS — 외주 파트너 연계 (2026-08-13 사업모델 개편안 V2 4장) ──
//
// 개편안의 ONE STOP 축이 이것이다. 컨시어지가 안심방문에서 발견한 문제 중
// 우리가 직접 못 하는 일을 외부 업체로 연결하고, 진행 상황만 보고한다.
//
// 책임 경계가 이 메뉴의 핵심이다 — 공사·수리의 책임은 외주업체에 있고
// K-CARE 는 알아봐 주고 진행 상황을 보고하는 역할이다. 이걸 흐리면 우리가
// 시공 하자까지 뒤집어쓴다. 화면에도 그대로 쓴다.
export const SERVICE_PLUS = [
  {
    key: "handyman",
    name: "도와줘요! 핸디맨",
    tag: "즉시 방문 홈닥터",
    priceLabel: "1회 출장비 100,000원",
    amount: 100000,
    scope: "집 안 간단 설치·유지보수 (2시간 미만) · 전등 교체 · 생활안전용품 설치 · 간단한 수전 교체",
    note: "일반 배치는 안심방문에서 해결합니다 — 설비가 필요한 것만 핸디맨입니다",
    confirmed: true,
  },
  {
    key: "builder",
    name: "찾아줘요! 공사맨",
    tag: "견적 대행",
    priceLabel: "견적서 제출 후 진행 · 건당 수수료 10%",
    amount: null,
    scope: "핸디맨 범위를 넘어 설비와 인력이 필요한 공사 — 고객 대신 견적을 알아보고 진행을 돕습니다",
    note: "공사의 책임은 외주업체에 있고 K-CARE 는 진행 상황을 보고합니다",
    confirmed: true,
  },
  {
    key: "rental",
    name: "생활 가전 렌탈",
    tag: "제휴 렌탈",
    priceLabel: "품목별 상이 (요금 확정 전)",
    amount: null,
    scope: "음식물 처리기 · 정수기 · 공기청정기 · 신발 살균 건조기",
    note: "제휴사 확정 후 품목별 요금을 올립니다",
    confirmed: false,
  },
  // "SOS 응급 보호자 대행"은 여기서 뺐다 (2026-08-21 시트 보호자 1번) —
  // 해주세요 '긴급지원'(no12)과 같은 서비스였다. 통합처는 SERVICE_MENU no12.
];

// 요청 유형 프리셋 (회의 예시 그대로)
export const GUARDIAN_PRESETS = [
  "약 구매해 주세요",
  "병원 예약 확인해 주세요",
  "집 상태 확인해 주세요",
  "물품 전달해 주세요",
  "다음 방문 때 확인해 주세요",
];

export const URGENCY = {
  normal: { label: "보통", fg: "#5C5A54", bg: "rgba(92,90,84,.1)" },
  urgent: { label: "긴급", fg: "#8A5D12", bg: "rgba(176,141,87,.18)" }, // 긴급도 위험 신호는 아니다 — 금색
};

// 희망일 표기 — 보호자 앱은 시각값(숫자)으로, 예시 데이터는 'YYYY-MM-DD' 로 남는다. 관제가 숫자를 그대로
// 보여 '1791590400000'이 됐다 (2026-10-02 QA). 날짜 · 시간 · '이번 주 안' 같은 말을 한 줄로.
export function fmtPreferred(r, empty = "미정") {
  const v = r?.preferredDate;
  const d = typeof v === "number" && Number.isFinite(v) ? new Date(v + 9 * 3600000).toISOString().slice(0, 10) : v || null;
  if (d) return `${d}${r.preferredTime ? ` ${r.preferredTime}` : ""}`;
  return r?.preferredWhen && r.preferredWhen !== "선생님과 통화해서 정하기" ? r.preferredWhen : r?.preferredWhen ? "통화로 정함" : empty;
}
