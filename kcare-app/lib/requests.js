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
    name: "생활 대행",
    priceLabel: "시간당 30,000원 · 기본 1시간 최대 2시간 · 추가 30분 10,000원",
    amount: 30000,
    cat: "생활지원",
    scope: "관공서 · 은행 · 장보기 · 산책 · 말벗",
    point: null,
    active: true,
  },
  { no: 7, name: "청소 서비스", cat: "생활지원", scope: "매트리스 · 냉장고 정리 · 에어컨 청소", active: false },
  { no: 8, name: "주거 관리 서비스", cat: "생활지원", scope: "전등 · 문고리 교체 등 간단 집수리", active: false },
  { no: 9, name: "복지 혜택 확인", cat: "생활지원", scope: "정부 지원금 · 혜택 알림", active: false },
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
    // 같은 서비스가 해주세요와 PLUS 양쪽에 있었고, 한쪽만 금액이 있어서 화면에 따라
    // 다른 값이 보이는 자리였다. 단가는 확정 전이라 "요금 확정 전"으로 남긴다.
    no: 12,
    name: "응급 상황 대응",
    priceLabel: "주간 · 야간 차등 (요금 확정 전)",
    amount: null,
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
  urgent: { label: "긴급", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
};
