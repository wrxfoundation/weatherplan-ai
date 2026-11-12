// 가족 한 곳의 '지금 상황' 요약 (2026-11-12) — 관제 · 컨시어지가 여러 가족을 맡으면서, 지금 보고 있지 않은 가족의
// SOS · 도와줘요 · 승인 대기를 놓치지 않게 가족 목록에 같이 싣는다. 서버(pages/api/families.js)가 가구 기록에서
// 필요한 칸만 꺼내 이 함수로 센다 — 화면의 '지금 처리할 일'(pages/dispatch.jsx)과 같은 기준의 줄인 판이다.
// 숫자를 지어내지 않는다: 기록에 있는 것만 센다.
import { CLOSED, isVisitCall } from "./requests";

const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);

// parts: { demo, requests, events, msgs, staff, plan, onboarding } — 가구 상태의 해당 칸 그대로
export function familySummary(parts) {
  const p = parts || {};
  const reqs = list(p.requests);
  const open = reqs.filter((r) => !CLOSED.includes(r.status));
  const live = p.staff && typeof p.staff === "object" ? p.staff["@live"] : null; // lib/ops-records.js STAFF_LIVE
  // "—" 는 '부 담당 없음'으로 저장되는 값이다 (lib/ops-records.js NO_STAFF)
  const name = (v) => (typeof v === "string" && v.trim() && v.trim() !== "—" ? v.trim().slice(0, 40) : null);
  return {
    sos: p.demo?.sos === true,
    sosAt: p.demo?.sos === true && Number.isFinite(p.demo?.sosAt) ? p.demo.sosAt : null,
    // 도와줘요(즉시 방문 요청) — 관제가 확인 전화로 받는 것
    help: open.filter((r) => isVisitCall(r)).length,
    // 관제 승인 대기 — 해주세요(관제 승인 · 관제 확인 필요) + 일정 승인 대기 + 확인 전인 관제 연락
    opsTodo:
      open.filter((r) => !isVisitCall(r) && (r.status === "opsReview" || r.status === "needsAdmin")).length +
      list(p.events).filter((e) => e.approval === "pending").length +
      list(p.msgs).filter((m) => !m.ackAt).length,
    // 컨시어지 확인 대기 — 담당 컨시어지가 받아야 하는 해주세요
    conciergeTodo: open.filter((r) => !isVisitCall(r) && r.status === "requested").length,
    plan: p.plan && typeof p.plan === "object" && typeof p.plan.key === "string" ? p.plan.key : null,
    pri: name(live?.pri),
    sub: name(live?.sub),
    elderName: name(p.onboarding?.elderName),
  };
}

// 주 · 부 담당인가 — 컨시어지는 관제가 지정한 가족의 기록만 본다 (이름으로 맞춘다 — 담당 지정이 이름으로 저장된다)
export const isAssigned = (summary, userName) => {
  const me = String(userName || "").trim();
  return !!me && (summary?.pri === me || summary?.sub === me);
};
