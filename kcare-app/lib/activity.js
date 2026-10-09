// 활동 기록 — 테스트 계정이 화면에서 한 일을 서버(Supabase activity 테이블)에 한 줄씩 쌓는다.
//
// 앱 상태(lib/state.js)는 가구 단위로 통째로 저장하고, 여기서는 "누가 · 언제 · 무엇을" 을
// 사람이 읽는 한 줄로 남긴다. 회사는 Supabase Table Editor 에서 이 표만 봐도 흐름을 따라갈 수 있다.
// 화면 표시용 깃발(오늘 탭을 봤다 · 알람을 띄웠다 등)은 남기지 않는다 — null 을 돌려주면 건너뛴다.

import { STATUS } from "./requests";

const won = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toLocaleString("ko-KR")}원` : "");
const clip = (s, n = 80) => {
  const v = String(s ?? "").replace(/\s+/g, " ").trim();
  return v.length > n ? `${v.slice(0, n)}…` : v;
};

// 관제 방문관리에서 바꾼 칸 → 사람이 읽는 말 (stepIdx · viewed · followup 은 같이 따라오는 값이라 뺀다)
const VISIT_OPS = { review: "검수", reviewedAt: "검수", sentAt: "보호자 리포트 발송", interimAt: "보호자 중간 알림", followups: "후속조치" };
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
      return `요청 상태 → ${clip(STATUS[a.to]?.label || a.to, 20)}`;
    case "assignRequest":
      return `요청 담당 → ${clip(a.assignee || "미배정", 20)}`;
    case "requestPaid":
      return "해주세요 결제 완료";
    case "approveRequest":
      return `해주세요 승인 · ${clip(a.by, 12)} · ${clip(a.date, 10)}${a.time ? ` ${clip(a.time, 5)}` : ""}`;
    case "declineRequest":
      return `해주세요 거절 · ${clip(a.by, 12)}${a.reason ? ` · ${clip(a.reason, 40)}` : ""}`;
    case "respondProposal":
      return `컨시어지 제안 ${a.accept ? "수락" : "거절"} · ${a.role === "elder" ? "어르신" : "보호자"}`;
    case "cancelRequest":
      return `해주세요 취소 · ${clip(a.by, 12)}${a.reason ? ` · ${clip(a.reason, 40)}` : ""}`;
    case "decideCancel":
      return `취소 요청 ${a.approve ? "승인" : "반려"} · 관제`;
    case "forceCancel":
      return `해주세요 강제 취소 · 관제${a.reason ? ` · ${clip(a.reason, 40)}` : ""}`;
    case "helpCall":
      return `도와줘요 · ${{ call: "확인 전화", dispatch: "출동 지시", arrive: "현장 도착", resolve: "해결 완료" }[a.step] || a.step}${a.step === "call" ? ` · ${{ fine: "전화로 해결", visit: "방문 필요", noanswer: "미연결" }[a.result] || ""}` : ""}${a.assignee ? ` · ${clip(a.assignee, 12)}` : ""}`;
    case "noteRequest":
      return `요청 처리 기록 · ${clip(a.note, 60)}`;
    case "refundDone":
      return "환불 완료 처리 · 관제";
    case "demo":
      return p.sos === true ? "SOS 발신" : p.sos === false ? "SOS 알림 끔 (시연 컨트롤)" : null;
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
    case "visitCheck":
      return `방문 점검 · ${clip(String(a.key || "").replace(/^[^-]*-/, ""), 30)} ${a.done ? "완료" : "취소"}`;
    case "visitNote":
      return a.key ? `방문 항목 메모 · ${clip(String(a.key).replace(/^[^-]*-/, ""), 30)}` : "방문 총평 메모";
    case "visitGrade":
      return `방문 항목 상태 · ${clip(String(a.key || "").replace(/^[^-]*-/, ""), 30)} ${a.grade ? clip(a.grade, 8) : "지움"}`;
    case "visitPhoto":
      return "방문 사진 첨부";
    case "visitLoc":
      return `방문 거주 형태 → ${a.loc === "hospital" ? "요양병원" : "자택"}`;
    case "escortSave":
      return `동행 기록 저장 · 사진 ${Number(p.photos) || 0}장${p.recorded ? " · 영상 있음" : ""}`;
    case "escortSend":
      return "동행 리포트 보호자 전달";
    case "escortViewed":
      return "보호자 동행 리포트 열람";
    case "sosAccept":
      return `SOS 급파 수락 · ${clip(a.by, 20)}`;
    case "visitOps":
      return `관제 방문 처리 · ${[...new Set(Object.keys(a.patch || {}).map((k) => VISIT_OPS[k]).filter(Boolean))].join(" · ") || "기타"}`;
    case "visitViewed":
      return "보호자 안심방문 리포트 열람";
    case "addOpsMessage":
      return `관제 연락 · ${clip(p.from, 20)} — ${clip(p.text, 80)}`;
    case "ackOpsMessage":
      return `관제 연락 확인${a.reply ? ` · 답: ${clip(a.reply, 60)}` : ""}`;
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
    case "setHealth":
      return `건강 정보 수정 · 복용 ${Array.isArray(p.meds) ? p.meds.length : 0}번 · 질환 ${Array.isArray(p.conditions) ? p.conditions.length : 0}가지${a.by ? ` · ${clip(a.by, 20)}` : ""}`;
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
