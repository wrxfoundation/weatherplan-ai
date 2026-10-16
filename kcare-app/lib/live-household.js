// 관제 명부의 '테스트 가구 1' — 보호자가 가입 상담에 적은 것과 가구 기록(앱 상태)으로 데모 인물 위에 실제 값을 덮는다
// (2026-10-02 현장 요청: "관제랑은 SOS 빼고는 연동이 안 되어 있다" → 어르신 관리 · 보호자 관리 · 감사로그부터).
//
// 인물 이름은 앱 전체가 쓰는 데모 인물(어르신 김순자 · 주 보호자 김민수) 그대로 둔다 — SOS · 해주세요 · 방문이 모두
// 이 이름으로 이어져 있어서다. 가입 상담에 다른 어르신 이름을 적었으면 '가입 상담 이름'으로 따로 보여 준다.
// 연락처 · 주소 · 관계 · 결제권한 · 해주세요 · SOS 는 실제 값이다. 가입 상담 전이면 데모 값 그대로 두고 그렇다고 적는다.
import { STATUS } from "./requests";
import { fmtWon } from "./config";
import { LIVE_ELDER, fmtPhone } from "./ops-health";
import { VISITS, itemKeys, visitDetail } from "./ops-mgmt";
import { checkupFor } from "./checkup";
import { AI_REPORT } from "./mock";
import { centerNow, onPeople } from "./people-store";

// 관제 센터 공간(2026-10-06)에서는 센터 이름 · 가입한 보호자 · 컨시어지 이름으로 바뀐다 — lib/people.js applyPeople
export let LIVE_TAG = "테스트 가구 1";
export const NO_DEVICE_WATCH = "수신 안 함 (베타)";
export let LIVE_GUARDIAN = "김민수";
export let LIVE_CONCIERGE = "박지현";
onPeople((p) => {
  LIVE_TAG = p.tag;
  LIVE_GUARDIAN = p.guardian;
  LIVE_CONCIERGE = p.concierge;
});

const KST = 9 * 3600 * 1000;
const ymd = (t) => (t ? new Date(Number(t) + KST).toISOString().slice(0, 10) : null);
const mdhm = (t) => (t ? new Date(Number(t) + KST).toISOString().slice(5, 16).replace("T", " ") : "—");

export const PAY_MODE = {
  limit: (ob) => `한도형 — 하루 ${Number(ob.limitAmount ?? 50000).toLocaleString("ko-KR")}원까지 어르신 직접`,
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
    state: `${STATUS[r.status]?.label || r.status}${r.assignee ? ` · 담당 ${r.assignee}` : " · 담당 미배정"}`,
  }));
}

// 가입 상담을 마친 가구인지 — 마이 '결제 관리'에서 결제권한만 먼저 저장하면 onboarding 이 반쯤 생긴다.
// 그걸 가입으로 보면 관제에 지어낸 '티어1 · 이용 중'이 뜬다 (2026-10-02 코드 점검). joinedAt 이 있어야 가입이다.
export const signedUp = (state) => (state?.onboarding?.joinedAt ? state.onboarding : null);

export function liveElder(e, state) {
  if (!e || e.name !== LIVE_ELDER) return e;
  const ob = signedUp(state);
  const elderPhone = ob ? fmtPhone(ob.elderPhone || (ob.forSelf ? ob.phone : "") || "") : "";
  const sos = state?.demo?.sos
    ? [{ no: "진행 중 (실제)", at: mdhm(state.demo.sosAt), cause: "어르신 SOS 버튼", result: state.ops?.sosDispatched ? "급파 지시됨 · 대응 중" : "관제 확인 중" }]
    : [];
  const live = {
    ...e,
    live: true,
    onboarded: !!ob,
    // 테스트 가구에는 워치 · 센서가 없다 — 예시 기기의 '정상 수신 · 착용 중'과 건강 수치를 실제처럼 보이면 안 된다
    watch: NO_DEVICE_WATCH,
    devices: { watch: { model: "워치 없음 — 베타는 휴대폰 앱으로 테스트", id: "—", feed: "none", at: "—", battery: "—", worn: "—", threshold: "기본값 적용" }, sensors: [] },
    trend: [],
    appliedName: ob?.elderName && ob.elderName !== e.name ? ob.elderName : null,
    requests: liveRequests(state),
    // 예시 SOS 이력(09-01 심박 경보 등)을 실제 뒤에 붙이지 않는다 — 실제 가구에는 실제 SOS 만
    sos,
  };
  if (!ob) return live;
  const guardianPhone = ob.forSelf ? "" : fmtPhone(ob.phone || "");
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
  const ob = signedUp(state);
  const mine = (state?.requests || []).filter((r) => r.dir === "fromGuardian");
  const vops = state?.visit?.ops || {};
  const esc = state?.escort || {};
  // 보호자에게 실제로 간 것 · 보호자가 실제로 보낸 것만 — 예시 연락 · 보고서 · 결제 이력은 쓰지 않는다 (2026-10-02 코드 점검)
  const log = [
    ...(state?.voices || []).filter((v) => v.from === "보호자").map((v) => ({ ts: v.at, at: mdhm(v.at), ch: "앱 음성", text: `안부 음성 ${Number(v.secs) || 0}초 → ${v.to}`, state: "sent" })),
    ...(vops.sentTs ? [{ ts: vops.sentTs, at: mdhm(vops.sentTs), ch: "보고서", text: "안심방문 리포트 발송", state: vops.viewed === "열람 완료" ? "read" : "delivered" }] : []),
    ...(esc.sentAt ? [{ ts: esc.sentAt, at: mdhm(esc.sentAt), ch: "보고서", text: "동행 리포트 전달", state: esc.viewedAt ? "read" : "delivered" }] : []),
    ...(state?.payments || []).map((p) => ({ ts: p.at, at: mdhm(p.at), ch: "결제", text: `${p.orderName || "결제"} 승인`, state: "approved" })),
  ].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const reports = [
    ...(vops.sentTs ? [{ at: mdhm(vops.sentTs), title: "안심방문 리포트", state: vops.viewed === "열람 완료" ? "read" : "delivered" }] : []),
    ...(esc.sentAt ? [{ at: mdhm(esc.sentAt), title: "동행 리포트", state: esc.viewedAt ? "read" : "delivered" }] : []),
  ];
  const base = {
    ...g,
    live: true,
    onboarded: !!ob,
    app: { state: centerNow() ? "회원 계정" : account ? `테스트 계정 (${account})` : "테스트 계정", last: "—" },
    // 담당이 비어 있으면 '미배정'이라고 쓴다 — 관제가 정할 일이 남았다는 뜻 (2026-10-02 QA: 담당을 박지현으로 미리 박지 않는다)
    requests: mine.map((r) => `${r.type} — ${STATUS[r.status]?.label || r.status}${r.assignee ? ` · 담당 ${r.assignee}` : " · 담당 미배정"}`),
    complaints: [],
    log,
    reports,
    // 명부 '보고서' 칸 — 실제로 보낸 리포트의 열람 여부 (예시의 '오늘 열람'을 쓰지 않는다)
    report: reports.length ? (reports.every((r) => r.state === "read") ? "열람" : "미열람") : "보낸 보고서 없음",
    payments: (state?.payments || []).map((p) => ({ at: mdhm(p.at), item: p.orderName || "결제", amount: p.amount, state: "approved" })),
  };
  if (!ob || ob.forSelf) return base;
  const limit = Number(ob.limitAmount ?? 50000);
  return {
    ...base,
    rel: ob.rel || g.rel,
    tel: fmtPhone(ob.phone || "") || g.tel,
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
// 실제 가구의 방문 줄 바탕 — 명부의 기본 인물 줄. 관제 센터 공간이면 이름 · 담당만 그 센터 사람으로 바꾸고 예시 내용(팀 · 메모)은 뺀다
export function liveVisitBase() {
  const t = VISITS.find((x) => x.id === LIVE_VISIT_ID) || VISITS[0];
  return centerNow() ? { ...t, name: LIVE_ELDER, team: LIVE_TAG, region: "—", memo: "", pri: LIVE_CONCIERGE, sub: "—" } : t;
}

export function liveVisit(base, state) {
  if (!base || base.name !== LIVE_ELDER) return base;
  const v = state?.visit || {};
  const plan = state?.visitPlan || {};
  const ops = v.ops || {};
  const d0 = visitDetail({ ...base, status: "planned", followup: false });
  // 거주 형태 — 컨시어지가 현장에서 고른 값 → 가입 상담 값 → 명부 값 순 (점검표와 같은 21항목을 세기 위해)
  const loc = v.loc || state?.onboarding?.careLocation || d0.loc;
  const d = loc === d0.loc ? d0 : { ...d0, loc, keys: itemKeys(loc) };
  const doneNames = new Set(Object.keys(v.checks || {}).map((k) => k.slice(k.indexOf("-") + 1)));
  const pending = d.keys.filter((k) => !doneNames.has(k));
  const gps = (v.audit || []).find((e) => e.kind === "gps");
  const checkinAt = gps?.at || (plan.gpsAt ? Number(plan.gpsAt) || null : null);
  const report = (state?.reports || [])[0] || null;
  const done = !!report || plan.status === "done";
  const active = !done && (!!v.checkedIn || !!checkinAt || doneNames.size > 0 || ["arrived", "recording"].includes(plan.status));
  const status = done ? "done" : active ? "active" : "planned";
  const followups = Array.isArray(ops.followups) ? ops.followups : [];
  // 항목 메모 · 상태 — 컨시어지가 적거나 고른 것만 (상태가 없으면 지어 붙이지 않는다)
  const grades = v.grades || {};
  const noteKeys = [...new Set([...Object.keys(v.notes || {}).filter((k) => (v.notes || {})[k]), ...Object.keys(grades)])];
  const notes = noteKeys.map((k) => `${k.slice(k.indexOf("-") + 1)} — ${[grades[k], (v.notes || {})[k]].filter(Boolean).join(" · ")}`);
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
    // 컨시어지 화면의 리포트 문장은 아직 동행 예시 초안(AI_REPORT.draft)이다 — 실제 방문 기록처럼 보이면 안 되므로 뺀다
    reportNote: report?.note && report.note !== AI_REPORT.draft ? report.note : null,
    review: done ? ops.review || "검수 대기" : active ? "수행 중" : "—",
    stepIdx: done ? (ops.stepIdx ?? 3) : active ? 1 : 0,
    viewed: ops.viewed || "—",
    reviewedAt: ops.reviewedAt || null,
    sentAt: ops.sentAt || null,
    interimAt: ops.interimAt || null,
    followups,
    followup: followups.length > 0,
    memoLine:
      status === "planned"
        ? "컨시어지 체크인 전"
        : status === "active"
          ? `점검 ${d.keys.length - pending.length}/${d.keys.length}`
          : ops.sentAt
            ? "보호자 리포트 발송됨"
            : ops.review === "검수 완료"
              ? "검수 완료 · 발송 전"
              : "리포트 도착 · 관제 검수",
  };
}

// 관제 방문 상세에서 바꾼 것 중 관제 몫만 가구 기록으로 (점검 · 사진 · 메모 · 체크인은 컨시어지 몫)
const OPS_KEYS = ["review", "stepIdx", "reviewedAt", "sentAt", "viewed", "interimAt", "followups", "followup", "reviewedTs", "sentTs"];
export const visitOpsPatch = (p) => Object.fromEntries(Object.entries(p || {}).filter(([k]) => OPS_KEYS.includes(k)));

// ── 보호자 안심방문 리포트 (2026-10-02 관제 연동 — "보호자 리포트도 연동") ──
// 관제가 '보호자 리포트 발송'을 해야 보호자에게 열린다. 내용은 컨시어지 방문 기록 그대로 —
// 21항목 중 확인한 것과 항목 메모 · 총평 · 사진 수 · 체크인 · 관제 검수 시각.
// 항목 상태(양호 · 관찰 · 주의)는 컨시어지가 고른 항목에만 붙는다. 종합 판정은 만들지 않는다.
export const STAGE_LABEL = {
  planned: "컨시어지 방문 전",
  active: "방문 중 — 점검하고 있습니다",
  review: "방문 완료 — 관제 검수 중",
  ready: "관제 검수 완료 — 곧 보내 드립니다",
  sent: "발송됨",
};
export function visitReportOf(state) {
  const base = liveVisitBase();
  const v = liveVisit(base, state);
  const ops = state?.visit?.ops || {};
  const checks = state?.visit?.checks || {};
  const notes = state?.visit?.notes || {};
  const grades = state?.visit?.grades || {};
  const axes = checkupFor(v.loc).map((a) => ({
    axis: a.axis,
    icon: a.icon,
    items: a.items.map((i) => ({ k: i.k, done: !!checks[`${a.axis}-${i.k}`], note: notes[`${a.axis}-${i.k}`] || "", grade: grades[`${a.axis}-${i.k}`] || "" })),
  }));
  const done = axes.reduce((n, a) => n + a.items.filter((i) => i.done).length, 0);
  const gradeCounts = axes.flatMap((a) => a.items).reduce((m, i) => (i.grade ? { ...m, [i.grade]: (m[i.grade] || 0) + 1 } : m), {});
  const total = axes.reduce((n, a) => n + a.items.length, 0);
  const sent = !!ops.sentAt;
  const stage = sent ? "sent" : v.status === "done" ? (ops.review === "검수 완료" ? "ready" : "review") : v.status;
  const gps = (state?.visit?.audit || []).find((e) => e.kind === "gps");
  return {
    stage,
    sent,
    client: LIVE_ELDER,
    visitedTs: gps?.at || state?.visitPlan?.gpsAt || (state?.reports || [])[0]?.at || null,
    // 실제로 앱을 쓰는 컨시어지는 박지현(테스트 컨시어지 계정) 한 사람 — 명부의 부 동행(예시)을 다녀간 사람처럼 적지 않는다
    concierge: { pri: LIVE_CONCIERGE, sub: null },
    axes,
    done,
    total,
    gradeCounts,
    photos: state?.visit?.photos || 0,
    memo: state?.visit?.memo || "",
    reportNote: v.reportNote,
    reviewedAt: ops.reviewedAt || null,
    sentAt: ops.sentAt || null,
    sentTs: ops.sentTs || null,
    viewed: ops.viewed === "열람 완료",
  };
}

// ── 컨시어지 관리 (2026-10-02 "남은 것도 다") ──
// 테스트 컨시어지 계정(test-concierge)이 앱에서 한 것으로 박지현 줄의 일부를 다시 만든다 —
// 지금 상태(SOS 출동 · 방문 중), 오늘 일정(김순자 안심방문 · 맡은 해주세요), SOS 출동이력, 관제 연락.
// 근무시간 · 피로도 · 자격 · 평가 · 위치는 앱이 모으지 않으므로 예시 그대로 두고 화면에 그렇다고 적는다.
export function liveConcierge(c, state) {
  if (!c || c.name !== LIVE_CONCIERGE) return c;
  const base = liveVisitBase();
  const v = liveVisit(base, state);
  const sosOn = !!state?.demo?.sos;
  const ops = state?.ops || {};
  const status = sosOn && ops.sosAcceptedAt ? "SOS 출동 중" : sosOn && ops.sosDispatched ? "급파 수락 대기" : v.status === "active" ? "방문 중" : "기록 없음";
  const asks = (state?.requests || []).filter((r) => r.assignee === LIVE_CONCIERGE && !["done", "cancelled", "rejected"].includes(r.status));
  const today = [
    { time: v.checkin?.at && v.checkin.at !== "—" ? v.checkin.at : "—", name: LIVE_ELDER, memo: `안심방문 · ${v.memoLine}`, role: "주", status: v.status },
    ...asks.map((r) => ({ time: mdhm(r.history?.[0]?.at).slice(6), name: LIVE_ELDER, memo: `해주세요 · ${r.type} (${STATUS[r.status]?.label || r.status})`, role: "주", status: r.status === "inProgress" ? "active" : "planned" })),
  ];
  const sos = sosOn
    ? [{ no: "진행 중 (실제)", at: mdhm(state.demo.sosAt), role: ops.sosAcceptedAt ? `주 · 급파 수락 ${hhmm(ops.sosAcceptedAt)}` : ops.sosDispatched ? "주 · 급파 지시됨 · 수락 대기" : "관제 확인 중 · 급파 전" }]
    : [];
  const msgs = (state?.opsMessages || []).filter((m) => m.role === "concierge");
  return {
    ...c,
    live: true,
    status,
    today,
    elders: c.elders.some((e) => e.name === LIVE_ELDER) ? c.elders : [{ name: LIVE_ELDER, age: "—", dong: state?.onboarding?.district || "—", risk: "—", role: "주" }, ...c.elders],
    sos: [...sos, ...c.sos],
    location: { text: v.checkin?.at && v.checkin.at !== "—" ? `${LIVE_ELDER} 님 댁 체크인 ${v.checkin.at} (GPS 체크인 기록) · 실시간 위치는 베타에서 받지 않습니다` : "실시간 위치는 베타에서 받지 않습니다 — 체크인 때 GPS 기록만 남습니다", at: v.checkin?.at || "—", feed: "none" },
    opsMsgs: { total: msgs.length, open: msgs.filter((m) => !m.ackAt).length },
  };
}
