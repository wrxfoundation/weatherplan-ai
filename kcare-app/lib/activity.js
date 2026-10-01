// 활동 기록 — 테스트 계정이 화면에서 한 일을 서버(Supabase activity 테이블)에 한 줄씩 쌓는다.
//
// 앱 상태(lib/state.js)는 가구 단위로 통째로 저장하고, 여기서는 "누가 · 언제 · 무엇을" 을
// 사람이 읽는 한 줄로 남긴다. 회사는 Supabase Table Editor 에서 이 표만 봐도 흐름을 따라갈 수 있다.
// 화면 표시용 깃발(오늘 탭을 봤다 · 알람을 띄웠다 등)은 남기지 않는다 — null 을 돌려주면 건너뛴다.

const won = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toLocaleString("ko-KR")}원` : "");
const clip = (s, n = 80) => {
  const v = String(s ?? "").replace(/\s+/g, " ").trim();
  return v.length > n ? `${v.slice(0, n)}…` : v;
};

const ELDER_MARKS = { medSlots: "복약 체크", reordered: "건기식 재구매 부탁", msgPlayed: "마음사서함 메시지 청취" };

// 기록하지 않는 동작 — 저장·동기화 내부 동작이거나, 결제 전 임시 상태이거나, 내용이 이미지라 큰 것이거나,
// 화면 깃발이라 같은 클릭의 다른 동작(요청 접수 등)이 이미 기록하는 것 (elderPatch: 즉시방문·말로 요청 깃발)
const SKIP = new Set(["hydrate", "replace", "set", "init", "setPendingOrder", "setProductImage", "kitUpdate", "elderPatch"]);

export function summarize(a) {
  if (!a || typeof a.type !== "string" || SKIP.has(a.type)) return null;
  const p = a.payload || {};
  switch (a.type) {
    case "completeOnboarding":
      return `가입 신청 · ${clip(p.elderName, 20)} · ${clip(p.district, 20)}${p.salesRef ? ` · 추천 ${clip(p.salesRef, 12)}` : ""}`;
    case "onboardingPatch":
      return "결제권한 · 한도 변경";
    case "addEvent":
      return `일정 등록 · ${clip(p.title, 60)}`;
    case "updateEvent":
      return "일정 수정";
    case "decideEvent":
      return a.approval === "approved" ? "일정 요청 승인" : "일정 요청 반려";
    case "setPriority":
      return "우선 날씨 설정";
    case "addReport":
      return "관찰 리포트 작성";
    case "addRequest":
      return `해주세요 요청 · ${clip(p.type, 40)}`;
    case "transitionRequest":
      return `요청 상태 → ${clip(a.to, 20)}`;
    case "assignRequest":
      return `요청 담당 → ${clip(a.assignee || "미배정", 20)}`;
    case "demo":
      return p.sos === true ? "SOS 발신" : null;
    case "ackSos":
      return "SOS 해제";
    case "elderMark":
      return ELDER_MARKS[a.key] ? `${ELDER_MARKS[a.key]} · ${clip(a.id, 20)}` : null;
    case "opsPatch":
      return "관제 조치";
    case "pushEvent":
      return clip(p.text, 120) || null;
    case "audit":
      return `방문 기록 · ${clip(a.event?.label, 60)}`;
    case "advanceVisit":
      return `방문 단계 → ${clip(a.to, 20)}`;
    case "patchVisit":
      return "방문 정보 수정";
    case "addPayment":
      return `결제 승인 · ${clip(p.orderName, 40)} · ${won(p.amount)}`;
    case "setBilling":
      return "자동결제 카드 등록";
    case "commitPendingOrder":
      return "스토어 주문 확정";
    case "addVoice":
      return `음성 메시지 · ${clip(p.from, 20)} → ${clip(p.to, 20)} · ${Number(p.secs) || 0}초`;
    case "addReview":
      return "동행 후기";
    case "addOrder":
      return "스토어 주문";
    case "addMyHospital":
      return `다니는 병원 등록 · ${clip(p.name, 30)}`;
    case "welfareStatus":
      return `복지혜택 ${clip(a.id, 20)} → ${clip(a.status, 20)}`;
    case "welfareAnswer":
      return "복지 질문 답변";
    case "guardianPatch":
      return "보호자 정보 수정";
    case "reset":
      return "테스트 가구 기록 비우기";
    default:
      return a.type;
  }
}

// 기록에 싣는 내용 — 긴 글(사진 dataURL 등)은 길이만 남기고, 깊거나 긴 것은 자른다.
// 서버가 다시 한 번 크기를 본다 (pages/api/household.js).
export function trimPayload(v, depth = 0) {
  if (v == null || typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "string") return v.length > 400 ? `[${v.length}자 생략]` : v;
  if (depth > 4) return "[…]";
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => trimPayload(x, depth + 1));
  if (typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).slice(0, 40)) out[k] = trimPayload(v[k], depth + 1);
    return out;
  }
  return null;
}
