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
