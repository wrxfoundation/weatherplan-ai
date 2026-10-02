// 관제 명부의 '테스트 가구 1' — 보호자가 가입 상담에 적은 것과 가구 기록(앱 상태)으로 데모 인물 위에 실제 값을 덮는다
// (2026-10-02 현장 요청: "관제랑은 SOS 빼고는 연동이 안 되어 있다" → 어르신 관리 · 보호자 관리 · 감사로그부터).
//
// 인물 이름은 앱 전체가 쓰는 데모 인물(어르신 김순자 · 주 보호자 김민수) 그대로 둔다 — SOS · 해주세요 · 방문이 모두
// 이 이름으로 이어져 있어서다. 가입 상담에 다른 어르신 이름을 적었으면 '가입 상담 이름'으로 따로 보여 준다.
// 연락처 · 주소 · 관계 · 결제권한 · 해주세요 · SOS 는 실제 값이다. 가입 상담 전이면 데모 값 그대로 두고 그렇다고 적는다.
import { STATUS } from "./requests";
import { fmtWon } from "./config";
import { LIVE_ELDER } from "./ops-health";
import { VISITS, visitDetail } from "./ops-mgmt";

export const LIVE_TAG = "테스트 가구 1";
export const LIVE_GUARDIAN = "김민수";

const KST = 9 * 3600 * 1000;
const ymd = (t) => (t ? new Date(Number(t) + KST).toISOString().slice(0, 10) : null);
const mdhm = (t) => (t ? new Date(Number(t) + KST).toISOString().slice(5, 16).replace("T", " ") : "—");

export const PAY_MODE = {
  limit: (ob) => `한도형 — ${Number(ob.limitAmount ?? 50000).toLocaleString("ko-KR")}원 이하 어르신 직접`,
  both: () => "양쪽 모두 결제",
  guardianOnly: () => "보호자만 결제",
  elderOnly: () => "어르신만 결제",
};
const payText = (ob) => (PAY_MODE[ob.paymentMode] || PAY_MODE.limit)(ob);

// 해주세요 — 관제 어르신 상세 '해주세요' 탭 모양으로
export function liveRequests(state) {
  return (state?.requests || []).map((r) => ({
    at: mdhm(r.history?.[0]?.at),
    name: r.type,
    price: r.amount != null ? fmtWon(r.amount) : "요금 확정 전",
    state: `${STATUS[r.status]?.label || r.status}${r.assignee ? ` · 담당 ${r.assignee}` : ""}`,
  }));
}

export function liveElder(e, state) {
  if (!e || e.name !== LIVE_ELDER) return e;
  const ob = state?.onboarding || null;
  const elderPhone = ob ? String(ob.elderPhone || (ob.forSelf ? ob.phone : "") || "").trim() : "";
  const sos = state?.demo?.sos
    ? [{ no: "진행 중 (실제)", at: mdhm(state.demo.sosAt), cause: "어르신 SOS 버튼", result: state.ops?.sosDispatched ? "급파 지시됨 · 대응 중" : "관제 확인 중" }]
    : [];
  const live = {
    ...e,
    live: true,
    onboarded: !!ob,
    appliedName: ob?.elderName && ob.elderName !== e.name ? ob.elderName : null,
    requests: liveRequests(state),
    sos: [...sos, ...(e.sos || [])],
  };
  if (!ob) return live;
  const guardianPhone = ob.forSelf ? "" : String(ob.phone || "").trim();
  return {
    ...live,
    phone: elderPhone || e.phone,
    phoneSource: elderPhone ? "가입 상담" : null,
    addr: ob.address?.trim() || e.addr,
    dong: ob.district || e.dong,
    regDate: ymd(ob.joinedAt) || e.regDate,
    service: {
      ...e.service,
      state: "active",
      since: ymd(ob.joinedAt) || e.service.since,
      product: `K-CARE 멤버십 티어${ob.tier || 1}${ob.household === "couple" ? " · 부부 가구" : ""}`,
      pay: `정상 · ${payText(ob)}`,
    },
    guardians: guardianPhone
      ? [
          { name: LIVE_GUARDIAN, rel: ob.rel || "아들", role: "주 보호자", region: ob.district || "—", tel: guardianPhone, consent: { call: true, sms: true, push: true }, live: true },
          ...e.guardians.filter((g) => g.name !== LIVE_GUARDIAN && !String(g.role).startsWith("주")),
        ]
      : e.guardians,
  };
}

export function liveGuardian(g, state, account) {
  if (!g || g.name !== LIVE_GUARDIAN) return g;
  const ob = state?.onboarding || null;
  const mine = (state?.requests || []).filter((r) => r.dir === "fromGuardian");
  const base = {
    ...g,
    live: true,
    onboarded: !!ob,
    // 마지막 접속 시각은 감사로그(로그인 기록)에 있다 — 여기서 데모 시각을 보여 주지 않는다
    app: { state: account ? `테스트 계정 (${account}) · 접속 기록은 감사로그` : "테스트 계정", last: "—" },
    requests: mine.length ? mine.map((r) => `${r.type} — ${STATUS[r.status]?.label || r.status}${r.assignee ? ` · 담당 ${r.assignee}` : ""}`) : g.requests,
  };
  if (!ob || ob.forSelf) return base;
  const limit = Number(ob.limitAmount ?? 50000);
  return {
    ...base,
    rel: ob.rel || g.rel,
    tel: String(ob.phone || "").trim() || g.tel,
    telSource: ob.phone ? "가입 상담" : null,
    region: ob.district || g.region,
    payer: ob.paymentMode !== "elderOnly",
    payLimit: ob.paymentMode === "limit" ? limit : g.payLimit,
    payMode: payText(ob),
  };
}

// ── 방문관리 (2026-10-02 관제 연동 4) ──
// 김순자 님 오늘 방문 줄을 가구 기록으로 다시 만든다 — 컨시어지 앱의 체크인 · 21항목 점검 · 총평 · 사진 수 · 리포트,
// 관제가 한 검수 · 보호자 발송 · 중간 알림 · 후속조치(visit.ops). 데모 줄의 예시 내용(메모 · 변화 · 요청)은 가져오지 않는다.
const hhmm = (t) => (t ? new Date(Number(t) + KST).toISOString().slice(11, 16) : null);
export const LIVE_VISIT_ID = (VISITS.find((x) => x.name === LIVE_ELDER) || VISITS[0]).id;

export function liveVisit(base, state) {
  if (!base || base.name !== LIVE_ELDER) return base;
  const v = state?.visit || {};
  const plan = state?.visitPlan || {};
  const ops = v.ops || {};
  const d = visitDetail({ ...base, status: "planned", followup: false });
  const doneNames = new Set(Object.keys(v.checks || {}).map((k) => k.slice(k.indexOf("-") + 1)));
  const pending = d.keys.filter((k) => !doneNames.has(k));
  const gps = (v.audit || []).find((e) => e.kind === "gps");
  const checkinAt = gps?.at || (plan.gpsAt ? Number(plan.gpsAt) || null : null);
  const report = (state?.reports || [])[0] || null;
  const done = !!report || plan.status === "done";
  const active = !done && (!!v.checkedIn || !!checkinAt || doneNames.size > 0 || ["arrived", "recording"].includes(plan.status));
  const status = done ? "done" : active ? "active" : "planned";
  const followups = Array.isArray(ops.followups) ? ops.followups : [];
  const notes = Object.entries(v.notes || {}).filter(([, t]) => t).map(([k, t]) => `${k.slice(k.indexOf("-") + 1)} — ${t}`);
  return {
    ...d,
    live: true,
    date: base.date,
    status,
    pending,
    photos: v.photos || 0,
    memo: v.memo || "",
    itemNotes: notes,
    changes: [],
    request: null,
    checkin: checkinAt ? { at: hhmm(checkinAt), gps: "GPS 확인 · 컨시어지 앱 체크인" } : status === "active" ? { at: "—", gps: "체크인 기록 없이 점검 시작" } : null,
    completedAt: report ? hhmm(report.at) : null,
    reportNote: report?.note || null,
    review: done ? ops.review || "검수 대기" : active ? "수행 중" : "—",
    stepIdx: done ? (ops.stepIdx ?? 3) : active ? 1 : 0,
    viewed: ops.viewed || "—",
    reviewedAt: ops.reviewedAt || null,
    sentAt: ops.sentAt || null,
    interimAt: ops.interimAt || null,
    followups,
    followup: followups.length > 0,
    memoLine: status === "planned" ? "컨시어지 체크인 전" : status === "active" ? `점검 ${d.keys.length - pending.length}/${d.keys.length}` : "리포트 도착 · 관제 검수",
  };
}

// 관제 방문 상세에서 바꾼 것 중 관제 몫만 가구 기록으로 (점검 · 사진 · 메모 · 체크인은 컨시어지 몫)
const OPS_KEYS = ["review", "stepIdx", "reviewedAt", "sentAt", "viewed", "interimAt", "followups", "followup"];
export const visitOpsPatch = (p) => Object.fromEntries(Object.entries(p || {}).filter(([k]) => OPS_KEYS.includes(k)));
