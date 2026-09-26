// 운영 관리 목 데이터 — 보호자(8절) · 컨시어지(9절).
// 컨시어지는 lib/rosters.js 명부(역할·권역·평점·배차·피로도·자격·상태)를 원본으로 두고 상세만 얹는다.
// 보호자는 브리프의 데모 인물(이성호·박은지·최선영·한준호 …)이 명부와 다른 곳이 있어 여기서 따로 정의한다.
import { ROSTERS } from "./rosters";
import { SERVICE_MENU } from "./requests";
import { VISITS, maskTel, ADMIN, OPERATOR } from "./ops-mgmt";

const past = (at, field, before, after, reason, who = OPERATOR) => ({ at, account: who.account, name: who.name, role: who.role, field, before, after, reason });
const svc = (no) => SERVICE_MENU.find((s) => s.no === no);

// ── 보호자 (8절) ──────────────────────────────────────────────────────
export const GUARDIAN_TABS = ["기본정보", "권한·동의", "연락이력", "보고서", "결제"];
export const ROLE_TONE = { 주: "navy", 부: "info", 비상: "gold" };
export const CONTACT_TONE = { 정상: "ok", "확인 필요": "warn", 미응답: "warn" };
export const SCOPES = ["건강 · 방문 · SOS 전체", "방문 · 보고서 · SOS", "보고서만"];
export const REPORT_VIA = ["앱 푸시 + 이메일", "앱 푸시", "문자 + 이메일", "이메일"];

// 현지시간 — 해외 거주 보호자에게 전화할 시각을 고르기 위해서다. tz 는 KST 대비 시차(시간).
export function localClock(now, tz) {
  if (!now) return "—";
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const d = new Date(utc + (9 + (tz || 0)) * 3600000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const G = (id, name, rel, role, elder, age, region, tz, report, payLimit, contact, x = {}) => ({
  id: `G-${String(id).padStart(3, "0")}`, name, rel, role, elders: [{ name: elder, age, role }], region, tz, tzLabel: tz == null ? null : region,
  tel: maskTel(name), hours: "08:00–22:00", night: role === "주", consent: { call: true, sms: true, push: true }, sosOrder: role === "주" ? 1 : role === "부" ? 2 : 3,
  scope: role === "주" ? SCOPES[0] : SCOPES[1], reportVia: REPORT_VIA[1], report, payer: payLimit != null, payLimit, contact,
  app: { state: "정상", last: "오늘 09:12" }, emergency: role === "주" ? "119 신고 · 현장출동 동의" : "열람 동의",
  requests: [], complaints: [], reports: [{ at: "09-16", title: "9월 정기방문 보고서", state: report.includes("미열람") ? "noreply" : "read" }],
  log: [{ at: "09-16 14:10", ch: "보고서", text: "9월 정기방문 보고서 발송", state: report.includes("미열람") ? "delivered" : "read" }],
  payments: payLimit == null ? [] : [{ at: "09-08", item: svc(6).name, amount: svc(6).amount, state: "approved" }],
  history: [], ...x,
});
export const GUARDIANS = [
  G(1, "김민수", "아들", "주", "김순자", 78, "서울 강남구", null, "오늘 열람", 100000, "정상", {
    hours: "06:00–23:00", app: { state: "정상", last: "오늘 16:58" },
    requests: ["22시 이후 알림은 문자 대신 앱 푸시로", "월 방문 때 어머니 사진 꼭 보내주세요", "복약 관련 변화는 바로 전화 주세요"],
    complaints: [{ at: "08-20", type: "상담", text: "보고서 사진 화질 문의", state: "답변 완료" }],
    log: [
      { at: "오늘 16:42", ch: "앱 푸시", text: "건강 주의 알림 (외출 횟수 변화)", state: "replied" },
      { at: "오늘 14:10", ch: "보고서", text: "방문 중간 알림 · 점검 17/21", state: "read" },
      { at: "어제 09:30", ch: "앱 푸시", text: `결제 승인 요청 · ${svc(13).name}`, state: "approved" },
      { at: "09-18 18:00", ch: "문자", text: "9월 방문 일정 통보 (09-22 14:00)", state: "delivered" },
      { at: "09-01 07:40", ch: "전화", text: "야간 심박 경보 사후 통보 (정상 확인)", state: "called" },
      { at: "08-30 21:05", ch: "문자", text: "복약 알림 재발송", state: "failed" },
    ],
    reports: [{ at: "오늘 14:10", title: "방문 중간 알림", state: "read" }, { at: "09-01", title: "SOS-20260901-002 상황보고서", state: "read" }, { at: "08-19", title: "8월 정기방문 보고서", state: "read" }],
    payments: [{ at: "어제", item: svc(13).name, amount: svc(13).amount, state: "approved" }, { at: "09-08", item: svc(6).name, amount: svc(6).amount, state: "approved" }, { at: "08-27", item: svc(2).name, amount: svc(2).amount, state: "approved" }],
    history: [past("2026-08-12 15:05", "결제 승인 한도", "50,000원", "100,000원", "병원 동행 프리미엄 2시간 요금이 한도를 넘어 승인이 막힘 — 보호자 요청", ADMIN)],
  }),
  G(2, "김지영", "차녀", "부", "김순자", 78, "LA", -16, "7일 미열람", null, "확인 필요", { hours: "현지 09:00–21:00", night: false, reportVia: REPORT_VIA[3], app: { state: "정상", last: "09-14" }, log: [{ at: "09-16 14:10", ch: "보고서", text: "9월 정기방문 보고서 발송", state: "delivered" }, { at: "09-20 10:00", ch: "앱 푸시", text: "보고서 미열람 재알림", state: "noreply" }] }),
  G(3, "김현우", "삼남", "비상", "김순자", 78, "시드니", 1, "오늘 열람", null, "정상", { consent: { call: true, sms: false, push: true }, scope: SCOPES[2], history: [past("2026-08-12 15:02", "보호자 연결", "—", "김순자 · 비상 보호자", "보호자 김민수 요청으로 비상 연락 등록", ADMIN)] }),
  G(4, "이성호", "아들", "주", "이영호", 81, "서울 송파구", null, "어제 열람", 50000, "정상"),
  G(5, "박은지", "장녀", "주", "박말순", 83, "부산", null, "오늘 열람", 100000, "정상", { requests: ["청각 보조기 관련은 문자로 먼저"], log: [{ at: "09-16 14:10", ch: "보고서", text: "9월 정기방문 보고서 발송", state: "read" }, { at: "09-10 02:20", ch: "전화", text: "SOS-20260910-001 주 보호자 연락 (정상 확인 종료)", state: "called" }] }),
  G(6, "최선영", "차녀", "주", "최정자", 75, "도쿄", 0, "3일 미열람", 50000, "정상", { reportVia: REPORT_VIA[0] }),
  G(7, "한준호", "아들", "주", "한복자", 79, "서울 강동구", null, "오늘 열람", 100000, "정상", { requests: ["투석 왕복 동행 결과는 당일 알림"] }),
  G(8, "오세라", "장녀", "주", "오태식", 77, "서울 강남구", null, "오늘 열람", 50000, "정상"),
  G(9, "노시우", "아들", "주", "노만수", 80, "대전", null, "3일 미열람", 50000, "미응답", { log: [{ at: "오늘 13:40", ch: "앱 푸시", text: "워치 배터리 부족 · 충전기 교체 통보", state: "noreply" }, { at: "09-16 14:10", ch: "보고서", text: "9월 정기방문 보고서 발송", state: "delivered" }] }),
  G(10, "도예진", "장녀", "주", "도금례", 86, "서울 강동구", null, "오늘 열람", 100000, "정상"),
  G(11, "문성호", "아들", "주", "문순덕", 88, "서울 마포구", null, "어제 열람", 100000, "정상"),
  G(12, "서유진", "장녀", "주", "서옥자", 82, "경기 성남", null, "그저께 열람", 50000, "정상"),
  G(13, "임재현", "아들", "주", "임화자", 87, "런던", -8, "오늘 열람", 100000, "정상", { hours: "현지 08:00–22:00" }),
  G(14, "강도윤", "아들", "주", "강필순", 84, "서울 강남구", null, "7일 미열람", 100000, "확인 필요", { log: [{ at: "오늘 12:10", ch: "전화", text: "복약 불일치 확인 요청", state: "noreply" }, { at: "09-16 14:10", ch: "보고서", text: "9월 정기방문 보고서 발송", state: "delivered" }] }),
];
// 상단 현황은 시안 값 — 명부는 그중 일부(1–14)만 표시한다
export const GUARDIAN_STATS = { total: 218, primary: 200, overseas: 35, unread: 12, contact: 4 };

// ── 컨시어지 (9절) ────────────────────────────────────────────────────
export const STAFF_TABS = ["근무현황", "일정·위치", "담당고객", "자격·교육", "평가·이력"];
export const STAFF_TONE = { "동행 중": "info", 가용: "ok", "짝 대기": "info", "휴식 권고": "warn", "오픈 대기": "muted" };
export const STAFF_STATS = { total: 42, free: 18, onDuty: 14, fatigue: 4, cert: 2 };
// 피로도 — 10시간을 100% 로 본다. 상한(96%)도 위험 신호가 아니라 amber.
export const fatigueTone = (pct) => (pct >= 70 ? "warn" : "ok");
export const fatigueLabel = (pct) => (pct >= 90 ? "상한 임박" : pct >= 70 ? "주의" : "정상");
const HOURS = { 한서연: 4.1, 오하늘: 5.8, 정민호: 4.7, 윤세라: 3.8, 최도현: 3.5, 김도윤: 4.4, 고은비: 3.9, 박서준: 2.8, 전소율: 3.2, 장민서: 4.0, 손하린: 3.6, 신유진: 2.5, 안정우: 5.1, 조현우: 0, 하지민: 0 };

function certsOf(text) {
  const list = [];
  if (/간호사/.test(text)) list.push({ name: "간호사 면허", until: "—", state: "유효 · 경력 14년" });
  if (/간호조무사/.test(text)) list.push({ name: "간호조무사 자격", until: "—", state: "유효" });
  if (/요양보호사/.test(text)) list.push({ name: "요양보호사 자격", until: /D-30/.test(text) ? "2026-10-22" : "—", state: /D-30/.test(text) ? "만료 D-30" : "유효" });
  list.push({ name: "BLS 응급교육", until: /BLS 갱신 D-12/.test(text) ? "2026-10-04" : "2027-03-20", state: /BLS 갱신 D-12/.test(text) ? "갱신 D-12" : "유효" });
  return list;
}
export const certNear = (c) => /D-\d+/.test(c.state);

const C_EXTRA = {
  박지현: { vehicle: false, trainings: ["노인돌봄 기본교육 (2025-03)", "치매 케어 교육 (2025-11)", "낙상 예방 실습 (2026-04)"], sos: [{ no: "SOS-20260901-002", at: "09-01 03:20", role: "현장 파견 대기 → 정상 확인으로 취소" }, { no: "SOS-20260612-001", at: "06-12 19:05", role: "현장 도착 22분 · 보호자 인계" }], internal: "A · 보고서 반려 0건 · 후속조치 등록 정확", history: [past("2026-07-01 10:00", "담당 가능지역", "강남", "강남·서초", "서초 권역 인력 공백 보강 — 본인 동의", ADMIN)] },
  서다인: { vehicle: true, history: [past("2026-08-25 09:30", "주·부 담당 역할", "부 동행", "주·부 겸용", "재배치 승인 — 강남 주 담당 인력 부족", ADMIN)] },
  오하늘: { contract: "수습 계약 (3개월 · 2026-10-14 종료 예정)", trainings: ["노인돌봄 기본교육 (2026-07)"] },
  정민호: { trainings: ["노인돌봄 기본교육 (2025-06)", "투석 환자 이동 지원 교육 (2025-09)"] },
  이수민: { rest: "주 근무 상한 근접 · 내일 오전 휴식 권고 · AI 배정 자동 제외", missed: { declined: 1, late: 0, cancel: 0 }, leave: "09-23 오전 휴식 (권고)" },
  하지민: { account: "비활성 (10월 오픈 전)", contract: "사전 배치 계약", location: { text: "일산 교육장 · 교육 중", at: "09:00", feed: "live" } },
};

// 명부 한 줄 → 상세 객체. 기존 역할·권역·평점·배차·피로도·자격·상태는 명부 값을 그대로 쓴다.
export function conciergeDetail(r) {
  const [name, branch, role, region, regDate, rating, jobs, fat, cert, status] = r;
  const h = HOURS[name] ?? (parseFloat(fat) || 0);
  const fatigue = Math.round(h * 10);
  const elders = ROSTERS.elders.rows.filter((e) => e[10] === name || e[11] === name).map((e) => ({ name: e[0], age: e[2], dong: e[4], risk: e[13], role: e[10] === name ? "주" : "부" }));
  const today = VISITS.filter((v) => v.pri === name || v.sub === name).map((v) => ({ time: v.time, name: v.name, memo: v.memo, status: v.status, role: v.pri === name ? "주" : "부" }));
  const probation = /수습/.test(role);
  const late = { declined: 0, late: probation ? 1 : 0, cancel: 0 };
  const ratingNum = parseFloat(rating) || null;
  return {
    name, branch, role, region, regDate, rating, jobs, fat, cert, status, hours: h, fatigue, tel: maskTel(name),
    roleType: /주·부/.test(role) ? "주·부 겸용" : /주/.test(role) ? "주 담당" : "부 담당",
    workDays: probation ? "월–금 10:00–17:00" : "월–금 09:00–18:00 (토 격주)",
    vehicle: /차량/.test(cert), emergency: /주/.test(role) && status !== "휴식 권고" && status !== "오픈 대기",
    certs: certsOf(cert), trainings: ["노인돌봄 기본교육 (이수)"],
    contract: probation ? "수습 계약 (3개월)" : "정규직", account: "활성", leave: "—",
    location: status === "동행 중" ? { text: `${elders[0]?.dong || region} 고객 자택 인근 · 실시간`, at: "14:03", feed: "live" } : status === "휴식 권고" ? { text: `${branch} 대기 · 마지막 수신`, at: "12:40", feed: "delayed" } : { text: `${branch} 대기`, at: "14:00", feed: "live" },
    elders, today, week: ["수 09-23 · 방문 1건", "목 09-24 · 병원 동행 1건", "금 09-25 · 방문 2건", "토 09-26 · 휴무"],
    weekHours: Math.round(h * 4.2 * 10) / 10, rest: "점심 12:00–13:00 · 이동 중 휴식 30분", missed: late,
    sos: [], internal: ratingNum ? (ratingNum >= 4.7 ? "A · 보고서 반려 0건" : "B · 보고서 보완 1건") : "평가 전",
    eval: [["정시성", `${100 - late.late * 3}%`], ["점검 완성도", ratingNum ? "평균 20.6 / 21" : "—"], ["보고서 품질", ratingNum ? (ratingNum >= 4.7 ? "A" : "B") : "—"], ["고객·보호자 평가", ratingNum ? `${rating} / 5` : "—"], ["민원·사고 여부", "0건"]],
    complaints: [], history: [],
    ...(C_EXTRA[name] || {}),
  };
}
