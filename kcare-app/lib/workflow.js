// 방문 업무흐름 8단계 — 2026-08-13 미팅에서 클라이언트가 직접 적어 준 순서 그대로.
//
//   ① 방문일정 수립          → 관제 대시보드에 알람
//   ② 관제실 검토            팀 배정 + 배차 적절 여부
//   ③ 일정계획 승인          → 관제 · 어르신 · 보호자 · 컨시어지 4개 화면 캘린더 반영
//   ④ D-7 · D-3 · D-1 푸시   → 컨시어지가 일정 변경 여부 재확인 후 컨펌
//   ⑤ D-3 · D-1 통화          컨시어지 → 어르신 · 보호자 · 통화 여부 체크 → 관제에 표시
//   ⑥ 방문                    GPS 체크 → 관제 · 보호자 알람
//   ⑦ 영상 녹화               초인종 누르기 전 시작, 그 다음 업무 개시
//   ⑧ 업무 수행               21항목 체크 → 보완사항 발생 시 두 갈래
//                              (가) 해주세요 기안(컨시어지) → 관제 검토 → 보호자·어르신 알람
//                              (나) 현장 즉시 해결          → 관제 검토 → 보호자·어르신 알람
//
// 설계 원칙 두 가지가 이 흐름에 박혀 있다.
//
// 1) 승인 없이는 아무 화면에도 안 뜬다.
//    일정은 '수립'만으로 확정되지 않는다. 관제가 팀·차량을 붙여 승인해야
//    비로소 네 화면의 캘린더에 나타난다. 그래서 상태가 draft → review →
//    approved 로 나뉘고, 화면들은 approved 이상만 읽는다.
//
// 2) 각 단계는 '했다'가 아니라 '누가 언제 했다'로 남는다.
//    통화 체크, GPS 체크인, 녹화 시작이 전부 기록이다. 나중에 분쟁이 나면
//    이 타임라인이 유일한 사실이다.

export const VISIT_STATUS = {
  draft: { label: "일정 수립", fg: "#5C5A54", bg: "rgba(92,90,84,.1)", step: 1 },
  review: { label: "관제 검토 중", fg: "#8A5D12", bg: "rgba(138,93,18,.12)", step: 2 },
  approved: { label: "승인 완료", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)", step: 3 },
  confirmed: { label: "컨시어지 컨펌", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", step: 4 },
  called: { label: "사전 통화 완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", step: 5 },
  arrived: { label: "현장 도착", fg: "#B08D57", bg: "rgba(176,141,87,.16)", step: 6 },
  recording: { label: "녹화 · 업무 중", fg: "#B08D57", bg: "rgba(176,141,87,.16)", step: 7 },
  done: { label: "방문 완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", step: 8 },
  rejected: { label: "반려", fg: "#C0392B", bg: "rgba(192,57,43,.1)", step: 0 },
};

// 허용 전이 — 단계를 건너뛰지 못하게 한다. 반려는 검토 단계에서만.
const NEXT = {
  draft: ["review"],
  review: ["approved", "rejected"],
  approved: ["confirmed"],
  confirmed: ["called"],
  called: ["arrived"],
  arrived: ["recording"],
  recording: ["done"],
  done: [],
  rejected: ["draft"],
};

export const canAdvance = (from, to) => (NEXT[from] || []).includes(to);

export function advance(visit, to, note, actor) {
  if (!canAdvance(visit.status, to)) return visit;
  return {
    ...visit,
    status: to,
    trail: [...(visit.trail || []), { at: Date.now(), status: to, note: note || "", actor: actor || "" }],
  };
}

// 8단계 정의 — 화면(관제·컨시어지)에서 진행 막대와 안내 문구로 쓴다
export const FLOW_STEPS = [
  {
    n: 1,
    key: "draft",
    title: "방문일정 수립",
    who: "컨시어지 · 보호자",
    detail: "일정이 만들어지면 관제 대시보드에 알람이 뜹니다.",
    notify: ["관제"],
  },
  {
    n: 2,
    key: "review",
    title: "관제 검토 — 팀 배정 · 배차",
    who: "관제",
    detail: "인원 규칙(1인/2인)과 차량을 붙이고 일정이 적절한지 검토합니다.",
    notify: [],
  },
  {
    n: 3,
    key: "approved",
    title: "일정계획 승인",
    who: "관제",
    detail: "승인해야 관제 · 어르신 · 보호자 · 컨시어지 네 화면의 캘린더에 반영됩니다.",
    notify: ["관제", "어르신", "보호자", "컨시어지"],
  },
  {
    n: 4,
    key: "confirmed",
    title: "D-7 · D-3 · D-1 알림 → 컨시어지 컨펌",
    who: "시스템 → 컨시어지",
    detail: "세 번 푸시가 나가고, 컨시어지가 일정 변경 여부를 다시 확인해 컨펌합니다.",
    notify: ["어르신", "보호자", "컨시어지"],
  },
  {
    n: 5,
    key: "called",
    title: "D-3 · D-1 사전 통화",
    who: "컨시어지",
    detail: "어르신과 보호자에게 각각 통화하고 통화 여부를 체크합니다 — 관제 화면에 바로 표시됩니다.",
    notify: ["관제"],
  },
  {
    n: 6,
    key: "arrived",
    title: "방문 · GPS 체크",
    who: "컨시어지",
    detail: "현장 도착을 GPS로 확인하면 관제와 보호자에게 알람이 갑니다.",
    notify: ["관제", "보호자"],
  },
  {
    n: 7,
    key: "recording",
    title: "영상 녹화 시작",
    who: "컨시어지",
    detail: "초인종을 누르기 전에 녹화를 시작하고, 그 다음 업무를 개시합니다.",
    notify: [],
  },
  {
    n: 8,
    key: "done",
    title: "업무 수행 — 21항목 체크",
    who: "컨시어지",
    detail: "보완사항이 나오면 해주세요로 기안하거나 현장에서 즉시 해결합니다. 어느 쪽이든 관제 검토를 거쳐 보호자·어르신에게 알립니다.",
    notify: ["관제", "보호자", "어르신"],
  },
];

// D-7 · D-3 · D-1 알림 규격 — 대상과 문구가 단계마다 다르다
export const REMINDERS = [
  {
    d: 7,
    to: ["어르신", "보호자", "컨시어지"],
    msg: "일주일 뒤 방문이 예정되어 있습니다.",
    action: "컨시어지는 일정 변경 여부를 확인합니다",
  },
  {
    d: 3,
    to: ["어르신", "보호자", "컨시어지"],
    msg: "사흘 뒤 방문입니다. 컨시어지가 통화를 드립니다.",
    action: "컨시어지 → 어르신 · 보호자 사전 통화 (1차)",
    call: true,
  },
  {
    d: 1,
    to: ["어르신", "보호자", "컨시어지"],
    msg: "내일 방문입니다. 준비물과 시간을 확인해 주세요.",
    action: "컨시어지 → 어르신 · 보호자 사전 통화 (2차)",
    call: true,
  },
];

// ⑧ 보완사항 처리 두 갈래 — 어느 쪽이든 관제 검토를 반드시 거친다
export const FOLLOWUP_ROUTES = [
  {
    key: "request",
    label: "해주세요 기안",
    who: "컨시어지가 기안",
    flow: ["컨시어지 기안", "관제 확인 · 검토", "보호자 · 어르신 알람"],
    when: "현장에서 바로 해결할 수 없거나, 비용·승인이 필요할 때",
  },
  {
    key: "onsite",
    label: "현장 즉시 해결",
    who: "컨시어지가 그 자리에서",
    flow: ["현장 즉시 해결", "관제 확인 · 검토", "보호자 · 어르신 알람"],
    when: "전구 교체처럼 그 자리에서 끝나는 일 — 해결했더라도 관제 검토와 알림은 생략하지 않습니다",
  },
];

// 데모 시드 — 관제·컨시어지 화면이 같은 방문을 본다
export const SEED_VISIT = {
  id: "vs-2026-08-22",
  elderName: "김순자",
  district: "강남구 대치동",
  kind: "firstVisit", // lib/dispatch-policy.js 의 배차 유형
  at: "2026-08-22 14:00",
  status: "review",
  crew: [],
  vehicle: null,
  calls: { elder: false, guardian: false }, // ⑤ 통화 체크
  gpsAt: null, // ⑥
  recordingAt: null, // ⑦
  trail: [{ at: Date.now() - 3600000, status: "draft", note: "월 정기 안심방문", actor: "박지현" }],
};
