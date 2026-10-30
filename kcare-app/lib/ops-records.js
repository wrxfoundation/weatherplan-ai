// 관제가 다른 사람의 정보를 고칠 때의 공용 규칙 (2026-10-28 업데이트 요청 3 · 4 · 6 · 공통 원칙).
//
//   1. 값은 가구 기록 한 곳에 — 컨시어지 상세(state.conciergeProfiles) · 보호자 기본정보(state.guardianInfo) ·
//      어르신 건강(state.health) · 담당 컨시어지(state.elderStaff). 화면마다 따로 들고 있지 않는다.
//   2. 저장할 때 수정 사유를 받고, 바뀐 칸마다 한 줄씩 공용 수정이력(state.editLog)에 쌓는다 — 덮어쓰지 않는다.
//   3. 고치는 것은 관제 관리자 이상 — 센터 관리자 계정(ops1 · ops2 · ops3). 승인된 일반 관제 회원은 보기만 한다
//      (계정 · 권한 기준 · lib/test-accounts.js). 데모 · 테스트 가구 관제는 관리자로 본다.
//      기록 규칙(reducer)은 역할을 보지 않는다 — 서버 역할 검사는 2026-10-19 결정 #1 로 열려 있다.
import { inCenter, people } from "./people";

const KST = 9 * 3600 * 1000;
export const stampOf = (t) => (Number.isFinite(t) ? new Date(t + KST).toISOString().slice(0, 16).replace("T", " ") : "—");

// 고칠 수 있나 — 로그인한 관제 계정 기준
export function canEditPeople(user) {
  if (!user?.household) return true; // 데모 (로그인 없이 보는 시연)
  if (user.role !== "ops") return false;
  if (!user.center) return true; // 테스트 가구 1 의 관제 테스트 계정
  return user.provider === "center"; // 센터 관리자(ops1~3)만 — 승인된 관제 회원은 보기만
}
export const VIEW_ONLY_NOTE = "보기만 할 수 있어요 — 고치기는 관제 관리자(센터 관리자 계정)가 합니다.";

// 공용 수정이력 → 관제 '수정이력' 표 한 줄 (components/ops/mgmt/EditLog.jsx HistoryTable 모양).
// 어르신은 이름 대신 열쇠(key · 여럿이면 배열)로 찾는다 — 이 가구의 어르신(STAFF_LIVE)은 가입 전 이름이 회원 이름으로 바뀌어도 같은 이력.
// 열쇠가 없는 어르신 줄은 이 가구의 어르신 것이다
export function historyRows(state, kind, name, key = STAFF_LIVE) {
  const keys = [].concat(key);
  return (Array.isArray(state?.editLog) ? state.editLog : [])
    .filter((r) => r && r.kind === kind && (kind === "elder" ? keys.includes(r.key || STAFF_LIVE) : r.name === name))
    .map((r) => ({ at: stampOf(r.at), account: "—", name: r.by || "—", role: r.role || "관제", field: r.field, before: r.before, after: r.after, reason: r.reason || "—" }));
}

// ── 담당 컨시어지 (2026-10-28 요청 3) ── state.elderStaff[열쇠] = { pri, sub, by, at }
// 관제 어르신 관리 [담당 컨시어지 변경]과 컨시어지 관리 담당고객 [추가 · 해제]가 같은 확인 절차 · 같은 칸을 쓴다.
// 이 가구의 어르신은 STAFF_LIVE 열쇠, 예시 명부의 어르신은 이름이 열쇠다.
// 관제 센터 공간에서는 주 담당이 새 해주세요 · 제안의 담당이 된다 (lib/people.js peopleFor · assigneeNow)
export const STAFF_LIVE = "@live";
export const NO_STAFF = "—"; // 부 담당 없음 — 관제 어르신 관리 '부 담당 없음'에 뜬다
export const staffKeyOf = (e) => (e?.live ? STAFF_LIVE : String(e?.name || ""));
export function staffOf(state, key) {
  const s = state?.elderStaff?.[key];
  return s && typeof s === "object" && s.pri ? s : null;
}
// 어르신 한 줄 위에 저장한 담당을 얹는다. 센터 공간의 어르신은 앱 전체가 쓰는 이름 묶음에서 —
// 저장한 담당이 그 사이 센터에서 빠진 회원이면 이름 묶음이 첫 컨시어지로 돌려 둔 값을 같이 본다
export function withStaff(e, state) {
  if (!e) return e;
  if (e.live && inCenter()) {
    const p = people();
    return { ...e, pri: p.concierge, sub: p.conciergeSub || NO_STAFF };
  }
  const s = staffOf(state, staffKeyOf(e));
  return s ? { ...e, pri: s.pri, sub: s.sub || NO_STAFF } : e;
}
// 이 컨시어지가 그 어르신의 무엇인가 — '주' · '부' · null
export const staffRoleOf = (e, name) => (e?.pri === name ? "주" : e?.sub === name ? "부" : null);

// 사유 — 4자 이상 (관제 [정보 수정] 서랍과 같은 기준)
export const reasonOk = (v) => String(v || "").trim().length >= 4;

// ── 컨시어지 상세 (2026-10-28 요청 3) ── state.conciergeProfiles[이름] — 관제 컨시어지 관리 5개 탭에서 고친 값.
// 근무시간 · 오늘 배차 · 피로도 · 누적 근무 · 계정 · 현재 위치 · 오늘 일정 · 미수락 · 지각 · 취소 · SOS 출동이력은 앱이 계산하는 값이라
// 여기 두지 않는다 (편집하지 않는다)
export const STAFF_ROLES = ["주 담당", "부 담당", "주·부 겸용"];
export const STAFF_CONTRACTS = ["정규직", "수습 계약 (3개월)", "계약직", "사전 배치 계약", "베타 회원"];
export const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];
// 내부평가 5항목 — 관제 화면의 평가 칸 이름 그대로. 점수는 센터가 쓰는 방식 그대로 적는다
// (만점 · 등급 기준이 정해지지 않아 앱이 척도를 정하지 않는다 — 예시 값도 %, 등급, '/ 5', 건수가 섞여 있다)
export const EVAL_ITEMS = ["정시성", "점검 완성도", "보고서 품질", "고객·보호자 평가", "민원·사고 여부"];
export const ISSUE_KINDS = ["민원", "사고"];

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, n = 80) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const ymdOr = (v) => (YMD.test(String(v || "")) ? String(v) : "");
const rows = (v, max, fn) => (Array.isArray(v) ? v.map(fn).filter(Boolean).slice(0, max) : null);
const rid = (v, i) => str(v, 40) || `r${Date.now().toString(36)}${i}`;

// 저장값은 여러 기기가 쓰는 입력이라 아는 칸만 모양을 확인하고 받는다 (lib/state.js setConciergeProfile)
export function cleanStaffPatch(p) {
  if (!p || typeof p !== "object") return null;
  const out = {};
  for (const k of ["branch", "region", "workDays", "contract", "leaveNote", "rest", "tel", "evalNote"]) if (k in p) out[k] = str(p[k], k === "evalNote" ? 300 : 80);
  for (const k of ["leaveFrom", "leaveTo"]) if (k in p) out[k] = ymdOr(p[k]);
  for (const k of ["vehicle", "drive", "emergency"]) if (k in p) out[k] = !!p[k];
  if ("roleType" in p && STAFF_ROLES.includes(p.roleType)) out.roleType = p.roleType;
  if ("week" in p) out.week = rows(p.week, 14, (w, i) => (w && WEEK_DAYS.includes(w.day) ? { id: rid(w.id, i), day: w.day, time: str(w.time, 30), memo: str(w.memo, 60) } : null)) || [];
  if ("certs" in p)
    out.certs = rows(p.certs, 12, (c, i) => (c && str(c.name) ? { id: rid(c.id, i), name: str(c.name, 40), no: str(c.no, 40), issued: ymdOr(c.issued), until: ymdOr(c.until), file: str(c.file, 80) } : null)) || [];
  if ("trainings" in p)
    out.trainings = rows(p.trainings, 20, (t, i) => (t && str(t.name) ? { id: rid(t.id, i), name: str(t.name, 60), date: ymdOr(t.date), hours: Math.max(0, Math.min(200, Number(t.hours) || 0)) } : null)) || [];
  if ("evalScores" in p && p.evalScores && typeof p.evalScores === "object")
    out.evalScores = Object.fromEntries(EVAL_ITEMS.map((k) => [k, str(p.evalScores[k], 20)]).filter(([, v]) => v));
  if ("complaints" in p)
    out.complaints = rows(p.complaints, 30, (c, i) => (c && str(c.text) && ISSUE_KINDS.includes(c.kind) ? { id: rid(c.id, i), at: ymdOr(c.at), kind: c.kind, text: str(c.text, 120) } : null)) || [];
  return out;
}

const KST_DAY = (t) => new Date(t + KST).toISOString().slice(0, 10);
// 자격 상태 — 유효기간까지 30일 이내면 '만료 D-n'(만료 임박), 지났으면 '만료됨'. 기간을 적지 않았으면 '기간 미입력'
export function certStateOf(until, now = Date.now()) {
  if (!YMD.test(String(until || ""))) return "기간 미입력";
  const days = Math.round((Date.parse(`${until}T00:00:00+09:00`) - Date.parse(`${KST_DAY(now)}T00:00:00+09:00`)) / 86400000);
  if (days < 0) return "만료됨";
  return days <= 30 ? `만료 D-${days}` : "유효";
}
// 한 줄 글 — 상세 화면 · 편집 칸 · 수정이력이 같은 모양을 쓴다
export const leaveTextOf = (p) => [p.leaveFrom && p.leaveTo ? `${p.leaveFrom} ~ ${p.leaveTo}` : p.leaveFrom || p.leaveTo || "", p.leaveNote].filter(Boolean).join(" · ") || "—";
export const weekLine = (w) => `${w.day} · ${w.time || "시간 미정"}${w.memo ? ` · ${w.memo}` : ""}`;
export const trainingLine = (t) => `${t.name}${t.date || t.hours ? ` (${[t.date, t.hours ? `${t.hours}시간` : ""].filter(Boolean).join(" · ")})` : ""}`;
export const issueLine = (x) => `${x.at || "날짜 미입력"} · ${x.kind} · ${x.text}`;
export const certLine = (x) => [x.name, x.no && `번호 ${x.no}`, x.issued && `발급 ${x.issued}`, `유효 ${x.until || "기간 미입력"}`, x.file && `첨부 ${x.file}`].filter(Boolean).join(" · ");

// 관제 컨시어지 관리의 한 줄(명부 · 센터 회원) 위에 저장한 상세를 얹는다 — 목록 표(역할 · 권역 · 자격 · 특이) · 숫자 카드 · 상세 탭이 같은 값을 본다.
// 저장한 칸은 비웠어도 그 값('—')을 쓴다 — 지운 연락처가 예시 번호로 돌아가 보이지 않게
export function withStaffProfile(c, p) {
  if (!c || !p) return c;
  const certs = Array.isArray(p.certs) ? p.certs.map((x) => ({ ...x, until: x.until || "—", state: certStateOf(x.until) })) : c.certs;
  const text = (k) => (k in p ? { [k]: p[k] || "—" } : {});
  return {
    ...c,
    ...text("branch"),
    ...text("region"),
    ...text("workDays"),
    ...text("contract"),
    ...text("rest"),
    ...text("tel"),
    ...("vehicle" in p ? { vehicle: p.vehicle } : {}),
    ...("drive" in p ? { drive: p.drive } : {}),
    ...(p.roleType ? { roleType: p.roleType } : {}),
    ...("emergency" in p ? { emergency: p.emergency } : {}),
    ...("leaveFrom" in p || "leaveTo" in p || "leaveNote" in p ? { leave: leaveTextOf(p) } : {}),
    certs,
    // 목록 '자격 · 특이' 칸 — 만료 · 만료 임박이 있으면 그것부터
    ...(Array.isArray(p.certs)
      ? { cert: certs.length ? [...certs].sort((a, b) => (certNearState(b.state) ? 1 : 0) - (certNearState(a.state) ? 1 : 0)).map((x) => `${x.name}${certNearState(x.state) ? ` ${x.state}` : ""}`).join(" · ") : "자격 미등록" }
      : {}),
    ...(Array.isArray(p.trainings) ? { trainings: p.trainings.map(trainingLine) } : {}),
    ...(Array.isArray(p.week) ? { week: p.week.map(weekLine) } : {}),
    ...(p.evalScores && Object.keys(p.evalScores).length ? { eval: EVAL_ITEMS.map((k) => [k, p.evalScores[k] || "—"]) } : {}),
    ...("evalNote" in p ? { internal: p.evalNote || "평가 전" } : {}),
    ...(Array.isArray(p.complaints) ? { complaints: p.complaints.map(issueLine) } : {}),
    profile: p,
  };
}
// 만료 임박 · 만료 — 숫자 카드 '자격 만료임박'이 센다
export const certNearState = (s) => /D-\d+|만료됨/.test(String(s || ""));

// ── 보호자 기본정보 (2026-10-28 요청 4) ── state.guardianInfo[이름] — 관제 보호자 관리 › 기본정보 [편집]에서 고친 값.
// 고치는 칸: 휴대전화 · 거주지역(국내/해외 · 도시 · 시차) · 연락 가능시간 · 야간 연락 · 연락 우선순위 · 역할 · 연락 수신동의.
// 앱 계정 · 연결 어르신(가입 · 초대로만) · 보호자 요청사항(기록)은 고치지 않는다.
// 주 보호자를 다른 사람으로 바꾸는 것은 결제 권한과 엮여 있어 이번 범위 밖 — 주 보호자의 역할은 잠그고, 다른 분을 '주'로 올리지 않는다.
// 수신동의 · 야간 연락은 본인 동의라 바꾸면 사유와 함께 보호자 앱에 알린다 (state.guardianNotices).
// 관제 보호자 관리 · SOS 화면(lib/ops-health.js liveCustomer) · 보호자 앱 마이가 같은 값을 읽는다
export const GUARDIAN_ROLES_EDIT = ["부", "비상"];
export const WHERE = ["국내", "해외"];
export const CONSENT_ITEMS = [
  ["call", "전화"],
  ["sms", "문자"],
  ["push", "앱 푸시"],
];
export function cleanGuardianPatch(p) {
  if (!p || typeof p !== "object") return null;
  const out = {};
  if ("tel" in p) out.tel = str(p.tel, 20);
  if ("where" in p && WHERE.includes(p.where)) out.where = p.where;
  if ("city" in p) out.city = str(p.city, 40);
  if ("tz" in p) {
    const n = Number(p.tz);
    out.tz = p.tz === null || p.tz === "" || !Number.isFinite(n) ? null : Math.max(-24, Math.min(24, Math.round(n * 2) / 2));
  }
  if ("hours" in p) out.hours = str(p.hours, 40);
  if ("night" in p) out.night = !!p.night;
  if ("sosOrder" in p) {
    const n = Math.round(Number(p.sosOrder));
    if (n >= 1 && n <= 9) out.sosOrder = n;
  }
  if ("role" in p && GUARDIAN_ROLES_EDIT.includes(p.role)) out.role = p.role;
  if ("consent" in p && p.consent && typeof p.consent === "object") out.consent = { call: !!p.consent.call, sms: !!p.consent.sms, push: !!p.consent.push };
  return out;
}
// 시차 글 — 'KST −16시간' · 'KST와 같음'
export const tzText = (tz) => (tz == null ? "—" : tz === 0 ? "KST와 같음" : `KST ${tz > 0 ? "+" : "−"}${Math.abs(tz)}시간`);
// 보호자 한 줄(명부 · 센터 회원) 위에 관제가 저장한 기본정보를 얹는다
export function withGuardianInfo(g, p) {
  if (!g || !p) return g;
  const abroad = p.where ? p.where === "해외" : g.tz != null;
  const locked = g.role === "주";
  return {
    ...g,
    // 관제가 번호를 실제로 바꿨을 때만 '관제 등록' — 다른 칸만 고친 저장이 가입 상담 번호를 관제 번호처럼 보이게 하지 않게
    ...("tel" in p ? { tel: p.tel || "—", telSource: p.tel && p.tel !== g.tel ? "관제 등록" : g.telSource } : {}),
    ...("where" in p || "city" in p || "tz" in p ? { region: p.city || (abroad ? "해외" : "—"), tz: abroad ? (p.tz ?? 0) : null, tzLabel: abroad ? p.city || null : null } : {}),
    ...("hours" in p ? { hours: p.hours || "—" } : {}),
    ...("night" in p ? { night: p.night } : {}),
    ...("sosOrder" in p ? { sosOrder: p.sosOrder } : {}),
    ...(p.role && !locked ? { role: p.role, elders: (g.elders || []).map((e, i) => (i === 0 ? { ...e, role: p.role } : e)) } : {}),
    ...(p.consent ? { consent: p.consent } : {}),
    info: p,
  };
}
// 보호자 앱에 보낸 알림 중 아직 확인하지 않은 것 (이 보호자 것만)
export const guardianNoticesFor = (state, name) => (Array.isArray(state?.guardianNotices) ? state.guardianNotices : []).filter((n) => n && n.to === name && !n.seenAt);
