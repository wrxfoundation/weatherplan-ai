// 일정 하나를 누가 어떻게 고칠 수 있나 — 어르신 · 보호자 · 컨시어지 · 관제가 같은 규칙을 쓴다 (2026-10-18)
//
// 원칙: 등록한 쪽이 고치고 지운다. 다만 증명 성격인 것은 지우지 않는다 —
//   관제가 확정해 사람 · 차를 잡은 일정은 '취소'로 남기고(관제에 알림 · 취소 기록 보관),
//   지난 확정 일정은 기록이라 잠그고, 해주세요에 묶인 일정은 해주세요에서만, 안심방문은 관제 방문 관리에서만 바꾼다.
//
//   가족 일정 (승인 없음)         등록한 쪽 — 수정 · 삭제 (보호자는 어르신이 남긴 가족 일정도 함께 관리)
//   K-CARE 일정 · 승인 전          등록한 쪽 — 수정 · 삭제(요청 철회)
//   K-CARE 일정 · 반려됨           등록한 쪽 — 삭제(정리)
//   K-CARE 일정 · 확정 (앞으로)    주 보호자 · 어르신(본인 것) — 시간 · 동행을 바꾸면 관제 재승인 · 취소. 관제 — 취소(사유)
//   컨시어지가 등록한 진료 예약    컨시어지 — 수정 · 삭제. 주 보호자 — 수정 · 삭제 (병원과 직접 바꾼 경우)
//   해주세요에 묶인 일정 (reqId)   여기서는 못 바꾼다 → 해주세요에서 바꾸거나 취소
//   관제가 잡은 일정 (안심방문 등)  관제 방문 관리에서만

// 누가 만든 일정인가 — 새 일정은 by 를 남긴다. 예전 일정은 출처(source) 글로 가늠한다.
// 관제가 승인 · 반려하면 source 가 '관제 승인' · '관제 반려'로 바뀌므로, by 가 없으면 가족 쪽 요청으로 본다.
export function eventOwner(e) {
  if (!e) return "ops";
  if (e.reqId) return "request";
  if (["elder", "guardian", "concierge", "ops"].includes(e.by)) return e.by;
  const s = String(e.source || "");
  if (s.startsWith("어르신")) return "elder";
  if (s.startsWith("보호자")) return "guardian";
  if (s.startsWith("컨시어지")) return "concierge";
  if (s === "관제 승인" || s === "관제 반려") return "family";
  return "ops";
}

const NO = (why = "") => ({ edit: false, remove: null, why });

// role: elder | guardian | concierge | ops. primary: 주 보호자인가 (보호자만 쓴다)
// 돌려주는 값 — edit: 수정 가능 · remove: "delete"(지우기) | "cancel"(취소 — 기록을 남기고 관제에 알림) | null · why: 못 할 때 한 줄
export function eventRights(e, role, { primary = true, now = Date.now() } = {}) {
  if (!e) return NO();
  const owner = eventOwner(e);
  const past = Number(e.at) < now;
  const ap = e.approval; // 없음 | pending | approved | rejected
  if (owner === "request") return NO(role === "ops" ? "해주세요 관리에서 바꿉니다" : "해주세요에서 바꾸거나 취소합니다");
  if (role === "ops") return ap === "approved" && !past ? { edit: false, remove: "cancel", why: "" } : NO();
  if (owner === "ops") return NO("관제가 정한 일정입니다");

  const mine =
    role === "elder"
      ? owner === "elder"
      : role === "guardian"
        ? ["guardian", "elder", "family", "concierge"].includes(owner)
        : role === "concierge"
          ? owner === "concierge"
          : false;
  if (!mine) return NO(role === "elder" ? "가족이나 선생님이 정한 일정이에요" : "다른 쪽이 등록한 일정입니다");

  // 지난 진료 예약 · 확정(또는 확정됐던) 일정은 기록 — 컨시어지가 병원과 잡은 예약은 승인 칸이 없어도 확정된 것으로 본다
  if (past && (owner === "concierge" || ap === "approved" || e.reapproval)) return NO(owner === "concierge" ? "지난 진료 예약은 기록으로 남습니다" : "지난 일정은 기록으로 남습니다");
  if (ap === "rejected") return { edit: false, remove: "delete", why: "" };
  // 확정됐던 일정을 고쳐 관제 재확인 중 — 이미 사람 · 차가 잡혀 있었으니 '취소'(관제에 알림)로, 주 보호자만
  if (ap === "pending" && e.reapproval) {
    if (role === "guardian" && !primary) return NO("확정됐던 일정은 주 보호자가 바꿉니다");
    return { edit: true, remove: "cancel", why: "" };
  }
  if (ap === "pending") return { edit: true, remove: "delete", why: "" };
  if (ap === "approved") {
    if (role === "guardian" && !primary) return NO("확정된 일정은 주 보호자가 바꿉니다");
    return { edit: true, remove: "cancel", why: "" };
  }
  if (role === "guardian" && owner === "concierge" && !primary) return NO("컨시어지가 등록한 예약은 주 보호자가 바꿉니다");
  return { edit: true, remove: "delete", why: "" };
}

// 확정된 일정에서 이 값들이 바뀌면 관제가 다시 확인해야 한다 (사람 · 차 배정이 달라진다)
export const REAPPROVE_KEYS = ["at", "kind", "escort"];

// 기록으로 잠긴 일정인가 — 지난 확정(또는 확정됐던) 일정 · 지난 진료 예약. reducer 가 화면과 같은 기준으로 한 번 더 막는다
// (일정이 시작되기 전에 열어 둔 수정 창을 시작 뒤에 저장해도 바뀌지 않게)
export const eventLocked = (e, now = Date.now()) =>
  !!e && Number(e.at) < now && (e.approval === "approved" || !!e.reapproval || eventOwner(e) === "concierge");
