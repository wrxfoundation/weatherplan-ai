import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/router";
// mock.js 가 아니라 seed.js 에서 가져온다 — state 는 _app 에서 import 되므로
// 여기서 mock.js 를 참조하면 콘솔 목데이터 전체가 모든 페이지에 실린다 (seed.js 주석 참고).
import { INITIAL_EVENTS, INITIAL_REQUESTS, SEED_ASK_DOCTOR, SEED_EVENTS, SEED_ORDERS, SEED_REPORTS } from "./seed";
import { URGENCY, approverOf, canEditRequest, cancelRule, crewOf, crewReady, fmtPreferred, paymentOf, transition } from "./requests";
import { canChargeExtra, durOf, durText, extraAmountOf, extraDueAt, extraToText, svcTitle } from "./booking";
import { SEED_VISIT, advance } from "./workflow";
import { VISIT_LEVELS, VISIT_TEXT_KEYS, isMeet, visitText } from "./checkup";
import { crewFor } from "./dispatch-policy";
import { logout, useAuth } from "./auth";
import { setStorageScope } from "./scope";
import { cleanMedSlot, cleanSupplement, healthOf, kstToday, medSummary, supplementLine } from "./meds";
import { AREAS, areaOfRole, centerOfHousehold, isCenterHousehold } from "./centers";
import { applyPeople, peopleFor } from "./people";
import { REAPPROVE_KEYS, eventLocked, eventOwner } from "./event-rights";
import { normalizePayStatus } from "./payments";
import { orderTotal } from "./store";
import { ASKS_KEEP, askLines } from "./elder-asks";
import { cleanHospital as cleanOpsHospital } from "./hospital-clean";
import { CONSENT_ITEMS, NO_STAFF, STAFF_LIVE, cleanGuardianPatch, cleanStaffPatch, reasonOk, staffRoleOf } from "./ops-records";

// 앱 전역 상태.
// 역할 간 연동: 어르신 SOS → 가족 배너 / 컨시어지 보충 요청 → 가족 결제 승인.
//
// 어디에 저장하나 (2026-09-30):
//   데모     로그인하지 않음 → 이 브라우저(localStorage)에만. 시연용 목데이터로 시작한다.
//   테스트   테스트 계정으로 로그인 → 가구 단위로 서버(Supabase)에 저장. 기록은 비운 채 시작한다.
//            같은 가구의 다른 계정(보호자·어르신·컨시어지)이 몇 초 안에 같은 상태를 본다.
//            서버 저장이 설정 전이면 이 기기에만 저장한다 (데모와 섞이지 않게 따로 둔다).

const KEY = "kcare-demo-state-v2";
const acctKey = (household) => `kcare-acct-${household}-v1`;

const DEFAULT = {
  onboarding: null, // { rel, res, elderName, district, tier, paymentMode, limitAmount, joinedAt }
  events: INITIAL_EVENTS,
  requests: INITIAL_REQUESTS,
  // cart: 가족 앱(REQ-07 장바구니)에서 변경 — 어르신 화면은 읽기만 (핸드오프 06 §3.9)
  // guardianRole: 주(primary)/부(secondary) 보호자 — 권한 분기 시연용. 초대 정책 문서 참조
  // nightOption: 야간 출동(외주) 옵션 가입 여부 — REQ-04. 기본 상품의 보증 범위는
  //   접수 + 119 연계까지라, 이 플래그가 관제의 조치 버튼 구성을 바꾼다.
  demo: {
    sos: false,
    anomaly: "open",
    offline: false,
    cart: false,
    guardianRole: "primary",
    nightOption: false,
  },
  // REQ-01 — 병력 기반 우선 표시는 자동 추론이 아니라 사람이 설정한다 (설정 주체 기록)
  priority: { factors: ["기온"], source: "보호자 설정", setAt: null },
  // 관찰 리포트 누적 — 본인 작성 전체 열람 · 타인 작성은 공유분만 (회의 7)
  reports: SEED_REPORTS.map((r) => ({ ...r, at: Date.now() - r.daysAgo * 86400000 })),
  // 어르신 1회성 잠금 상태 (undo 없음이 의도 — 핸드오프 06 §5). voicePlayed만 재클릭 가능.
  //
  // medSlots·reordered·visitAsked·askSpoken 도 여기 있어야 한다. 화면 로컬 state 로
  // 두면 새로고침 한 번에 "오늘 약 먹었어요" 체크가 사라지고, 이미 보낸 즉시방문요청·
  // 재구매 부탁을 다시 보낼 수 있게 된다 (중복 접수). 시연 중에 실제로 그렇게 된다.
  elder: {
    voicePlayed: false,
    askAdded: false,
    medSlots: {}, // { 아침: true, 점심: true, ... } — 오늘 복약 체크
    reordered: {}, // { sp1: true } — 건기식 재구매 부탁
    visitAsked: false, // 즉시 방문 요청
    askSpoken: false, // 선생님께 말로 요청하기
    // 2026-09-04 시트 —
    // todaySeen: 오늘 탭을 마지막으로 열었을 때의 일정 수. 그보다 늘면 홈 '오늘' 타일에
    //   점이 붙는다 (전체 9번 "새 일정이 생겼음을 표시").
    // msgPlayed: 마음사서함에서 들은 메시지 { t1: true }. 안 들은 것이 있으면 홈에
    //   "선생님이 마음을 보냈어요" 배너가 뜬다 (전체 5번).
    // medPopShown: 복용 시간에 자동으로 띄운 약 알람 { date: "2026-09-04", slots: {아침: true} }
    //   — 하루에 때마다 한 번만 (전체 2번 "복용 시간에 맞추어 팝업").
    todaySeen: 0,
    msgPlayed: {},
    medPopShown: { date: "", slots: {} },
  },
  // 복지혜택 (lib/welfare.js · 2026-09-04 시트 앱 전체 3번)
  //   status: { "POL-0012": { status: "신청예정", at, by } } — 관제·보호자가 같은 값을 본다
  //   answers: { pension: "Y", housing: "자가" } — 보호자가 답한 미확인 항목 (판정이 바뀐다)
  welfare: { status: {}, answers: {} },
  // 보호자 내 정보 (마이 탭 '관리' → 내 정보 수정 · 2026-09-04 영상 시안). 이름·생년월일·
  // 전화는 고객센터 경유라 여기 없다 — 본인이 바꿀 수 있는 것만.
  guardian: { email: "", sex: "" },
  // 관제 콘솔 상태 — sos 해제는 관제(ackSos)만 가능 (핸드오프 06 §5 · 09 §10)
  ops: { sosDispatched: false, sos119: false, assign: "pending", unmatchFixed: false },
  // 실시간 접수 티커 = 감사 로그의 실시간 뷰 (09 §7.2). 전 화면 액션이 여기로 push
  ticker: SEED_EVENTS.map((e, i) => ({
    id: `seed${i}`,
    at: Date.now() - e.minAgo * 60000,
    kind: e.kind,
    text: e.text,
    color: e.color,
  })),
  // 컨시어지 방문 수행 상태 + 감사 타임라인 (REQ-12 골격)
  // checks · notes · memo · photos — 21항목 점검 · 항목 메모 · 총평 · 사진 수. 관제 방문관리가 같은 값을 본다 (2026-10-02).
  // ops — 관제가 이 방문에 한 것 (검수 · 보호자 발송 · 중간 알림 · 후속조치).
  // grades — 항목 상태(양호 · 관찰 · 주의). 컨시어지가 고른 것만 있다 — 고르지 않은 항목에 상태를 지어 붙이지 않는다.
  visit: { checkedIn: false, reportSent: false, audit: [], checks: {}, notes: {}, grades: {}, memo: "", photos: 0, ops: {} },
  // 지난 방문 기록 — 보호자에게 발송한 방문은 '다음 방문 시작' 때 여기로 넘어가 그대로 보관된다 (2026-10-18 · 증명 기록)
  //   [{ visit, report, gpsAt, closedAt }]
  visitHistory: [],
  // 병원 동행 기록 — 컨시어지 '동행 기록 저장' → '리포트 제출' → 관제 '보호자 리포트 발송' → 보호자 홈 · 마이 '동행 리포트' (2026-10-02).
  // 녹화 여부는 컨시어지가 직접 체크한 값 그대로다 (없는 영상을 있다고 하지 않는다).
  escort: { note: "", photos: 0, recorded: false, by: "", savedAt: null, sentAt: null, viewedAt: null },
  // 관제 연락 — 컨시어지 '관제에 알리기'. 관제가 확인(·답장)하면 컨시어지 화면에 그대로 보인다 (2026-10-02).
  opsMessages: [],
  // 관제 상담 · 관제 메모 — 관제 어르신 관리 › 상담·관제메모 (2026-10-18). 관제 기기끼리 같은 값을 본다.
  // 고치면 이전 글을 prev 에 남기고, 지우면 목록에서 빠지되 감사로그에 글이 남는다.
  //   [{ id, at, who, text, editedAt?, editedBy?, prev?: [{ text, at }] }]
  opsNotes: [],
  // 스토어 상품 이미지 — 경영 콘솔에서 올리면 스토어 썸네일이 바뀐다 (실무자 요청).
  // { [상품id]: dataURL }. 업로드 시 320px 로 줄여 저장한다 — localStorage 5MB 한도.
  productImages: {},
  // 방문 업무흐름 8단계 (lib/workflow.js) — 관제·컨시어지·보호자가 같은 건을 본다.
  // 승인(approved) 전에는 어느 캘린더에도 뜨지 않는다는 것이 이 상태의 요점.
  visitPlan: SEED_VISIT,
  // 목소리 — 보호자 ↔ 어르신 안부, 어르신 ↔ 컨시어지 마음사서함, 말로 부탁하기 · 오늘 여쭤볼 것 (2026-08-12 시트).
  // 2026-10-14부터 실제로 녹음한다 — 소리는 서버(voice_clips 표)에 두고 여기에는 clip { id, mime, secs } 만 남는다
  // (lib/voice-client.js). clip 이 없는 것은 그 전에 남은 기록(길이만 있다).
  voices: [],
  // 오늘 여쭤볼 것 — 진료 때 선생님이 대신 여쭤볼 질문. 어르신이 말로 남기고(clip) · 다시 말하고 · 해결 · 지운다 (2026-10-14)
  //   [{ id, at, text?, clip?, secs?, source: elder|family|concierge, sourceLabel, status: open|resolved, resolvedAt?, editedAt? }]
  askDoctor: SEED_ASK_DOCTOR,
  // 동행 후기 — 동행 점수 아래 보호자가 남기는 코멘트 (2026-08-12 시트 홈 5번)
  reviews: [],
  // 스토어 구매내역 — 보호자 스토어 '구매내역 조회' (2026-08-12 시트 스토어 2번)
  orders: SEED_ORDERS.map((o) => ({ ...o, at: Date.now() - o.daysAgo * 86400000 })),
  // 기존에 다니시던 병원 — 제휴 병원이 아니어도 등록해 둔다 (2026-08-12 시트 예약 3번)
  myHospitals: [],
  // 지우거나 취소한 일정 — 달력에서는 빠지고 여기 남는다 (누가 · 언제 · 왜). 관제 · 보호자가 '취소된 일정'으로 본다 (2026-10-18)
  eventsRemoved: [],
  // 병원 명부 — 관제 병원 관리 (2026-10-28 요청 2 · lib/hospitals.js). null 이면 아직 아무도 고치지 않은 것(기본 명부).
  // 보호자 예약 › 제휴 병원 · 어르신 해주세요 병원 고르기 · 컨시어지 진료 예약이 여기서 '제휴'만 읽는다
  hospitals: null,
  hospitalsRemoved: [], // 명부에서 지운 병원 [{ at, by, id, name, dept }] — 관제 '삭제 이력'

  // 토스페이먼츠 결제 (2026-09-23) — 승인이 끝난 건만 쌓인다.
  //   payments: [{ id, kind, ref, orderId, orderName, amount, method, card, approvedAt, receiptUrl, status }]
  //   billing:  월 구독 자동결제로 등록한 카드 표기 정보. billingKey 원본은 서버 보관 대상이라 여기 없다.
  payments: [],
  billing: null,
  // 멤버십 이용료를 누가 · 어떻게 내나 (2026-10-22) — 보호자 멤버십과 어르신 마이가 같은 값을 보고 고친다.
  //   { who: "어르신 본인" | 보호자 이름 | "다른 가족 · 기관", how: "card" | "autoTransfer" | "bankDeposit", by, at }
  memberPay: null,
  // 추가 이용 금액 — 예약한 시간보다 길어진 해주세요를 컨시어지가 청구하고, 지정한 분이 결제한다 (2026-10-22).
  //   [{ id, reqId, service, title, customer, by, sentAt, bookedMin, usedMin, startTime, amount, base, memo,
  //      to: { role: "elder"|"guardian", name }, status: "pending"|"paid"|"cancelled",
  //      paidAt?, payer?, method?, auto?, demo?, orderId?, cancel? }]
  //   금액은 서비스 · 예약 · 실제 이용 시간으로 lib/booking.js extraAmountOf 가 정한다 (결제 서버도 같은 계산)
  extraCharges: [],
  // 결제창으로 넘어가기 전에 담아 둔 스토어 주문. 승인이 끝나야 orders·requests 로 선다.
  // 주인별로 따로 둔다 { [주인]: 주문 } — 한 칸이면 어르신 · 보호자가 거의 같이 결제할 때 서로의 장바구니를 덮어
  // 한쪽 결제가 주문 없이 사라졌다 (2026-10-26 점검 · lib/store.js cartOwner). pendingOrder 는 예전 화면이 남긴 한 칸
  pendingOrders: {},
  pendingOrder: null,
  // 건강 정보 한 벌 — 복용약 · 질환 · 알레르기 (2026-10-02 QA). null 이면 lib/meds.js 기본값.
  // 관제(어르신 관리 › 건강·질환)와 컨시어지(고객 탭)가 고치고, 어르신 · 보호자 · 관제 · SOS 신고 정보가 읽는다 (healthOf).
  health: null,
  // 선호 카드 — 컨시어지가 '오늘 알게 된 선호'로 남긴 것 [{ text, at, by }] (2026-10-24 설계서 v3 §2).
  // 관제 · 컨시어지만 보는 칸이다 — 어르신 · 보호자 앱에는 나가지 않는다
  prefNotes: [],
  // 어르신 부탁 — 미팅 리포트 '부탁하신 것' 한 줄 = 한 건 (2026-10-28 요청 1 · lib/elder-asks.js).
  // 컨시어지 고객 상세 · 어르신 홈 · 관제 어르신 관리가 같은 목록을 본다
  elderAsks: [],
  // 다른 사람의 정보를 고친 기록 (2026-10-28 요청 공통 원칙) — 어르신 건강 · 보호자 기본정보 · 컨시어지 상세 · 담당 변경.
  // 덮어쓰지 않고 한 줄씩 쌓는다. 관제 어르신 · 보호자 · 컨시어지 관리의 '수정이력'이 대상별로 읽는다 (lib/ops-records.js)
  //   [{ id, at, kind: "elder"|"guardian"|"concierge", name, key?(어르신 열쇠), field, before, after, reason, by, role }]
  editLog: [],
  // 컨시어지 상세 — 관제 컨시어지 관리 5개 탭에서 고친 값 { [이름]: { 근무 · 주간 일정 · 자격 · 교육 · 평가 · 민원 } }
  // (2026-10-28 요청 3 · lib/ops-records.js cleanStaffPatch). 목록 표 · 숫자 카드 · 상세가 같이 읽는다
  conciergeProfiles: {},
  // 담당 컨시어지 { [어르신 열쇠]: { pri, sub, by, at } } — 어르신 관리 · 컨시어지 관리가 같은 절차로 고친다 (요청 3).
  // 이 가구 어르신(STAFF_LIVE)의 주 담당은 센터 공간에서 새 해주세요의 담당이 된다 (lib/people.js)
  elderStaff: {},
  // 보호자 기본정보 { [이름]: { tel, where, city, tz, hours, night, sosOrder, role, consent, by, at } } — 관제 보호자 관리 [편집] (요청 4).
  // 관제 보호자 관리 · SOS 화면 · 보호자 앱 마이가 같은 값을 읽는다 (lib/ops-records.js withGuardianInfo)
  guardianInfo: {},
  // 보호자 앱 알림 — 관제가 연락 수신동의를 바꿨을 때 [{ id, at, to, kind, text, reason, by, seenAt }] (요청 4)
  guardianNotices: [],
};

// 테스트 가구의 첫 상태 — 구성(방문 흐름 · 복약 계획 · 우선 날씨)은 두고 기록(일정 · 요청 · 주문 · 결제 ·
// 음성 · 리포트 · 알림)은 비운다. 화면에 뜨는 기록이 전부 테스트하는 사람이 만든 것이 되게.
export function freshState() {
  // 테스트 가구의 방문 업무흐름은 '일주일 뒤 14:00' — 데모 씨앗(사흘 뒤)과 따로 잡는다 (2026-10-02 UX 점검)
  const ymd = new Date(Date.now() + 7 * 86400000 + 9 * 3600000).toISOString().slice(0, 10);
  return {
    ...DEFAULT,
    visitPlan: { ...SEED_VISIT, id: `vs-${ymd}`, at: `${ymd} 14:00`, trail: [{ at: Date.now(), status: "draft", note: "월 정기 안심방문", actor: "박지현" }] },
    // AI 이상 징후 카드는 센서가 없는 테스트 가구에서 지어낸 알림이 된다 — 닫아 둔다
    // (보호자 화면 아래 데모 조작으로 다시 띄울 수 있다)
    demo: { ...DEFAULT.demo, anomaly: "none" },
    events: [],
    requests: [],
    reports: [],
    ticker: [],
    orders: [],
    voices: [],
    reviews: [],
    payments: [],
    myHospitals: [],
    eventsRemoved: [],
    visitHistory: [],
    opsMessages: [],
    opsNotes: [],
    askDoctor: [],
    extraCharges: [],
  };
}

// 관제 센터 공간(HH-C1~3)의 첫 상태 (2026-10-06 "기존 db 가 없어야") — 테스트 가구 1 의 첫 상태에서 사람에 딸린
// 예시 값까지 비운다: 복약 · 질환 · 알레르기(예시 처방이 새 어르신에게 붙지 않게) · 방문 흐름의 예시 어르신 · 담당자 이름.
export function centerFreshState() {
  const base = freshState();
  return {
    ...base,
    health: { meds: [], conditions: [], allergies: [], by: null, at: null },
    visitPlan: { ...base.visitPlan, elderName: null, district: null, trail: [{ ...base.visitPlan.trail[0], actor: "관제" }] },
  };
}
const freshFor = (household) => (isCenterHousehold(household) ? centerFreshState() : freshState());

// 저장된 일정 중 씨앗(INITIAL_EVENTS)에서 온 것을 손본다 —
//  · 없어진 씨앗(ev4 아침 혈압약 · ev3 케어박스 점검 — 케어박스는 제공하지 않는다, 2026-10-02)은 지운다. 시드에서 빼도 localStorage 에 남아 있으면
//    화면에 계속 뜬다 (2026-09-04 시트 어르신 전체 2번).
//  · 시각이 지난 씨앗은 오늘 기준으로 다시 잡는다. 씨앗의 at 은 첫 실행일 기준으로
//    계산돼 저장되므로, 며칠 뒤 열면 "9월 3일 안심방문"처럼 지난 일정이 남는다
//    (같은 시트 3번이 그 화면이었다). 어르신·보호자가 직접 옮긴 미래 일정은 건드리지 않는다.
const SEED_BY_ID = Object.fromEntries(INITIAL_EVENTS.map((e) => [e.id, e]));
const REMOVED_SEED_IDS = new Set(["ev4", "ev3"]);
// 바뀐 씨앗 — 저장된 옛 모양이면 새 씨앗으로 갈아 끼운다. ev1(순환기내과)은 '일주일 뒤 10:00'이었다가
// 관제 · 컨시어지 화면의 '오늘 13:50 동행'과 맞췄다 (2026-10-02 QA).
const LEGACY_SEED_NOTES = { ev1: "박지현 선생님 동행 · 픽업 09:10" };
function rebaseSeedEvents(events) {
  return events
    .filter((e) => !REMOVED_SEED_IDS.has(e.id))
    .map((e) => (LEGACY_SEED_NOTES[e.id] && e.note === LEGACY_SEED_NOTES[e.id] ? { ...SEED_BY_ID[e.id] } : e))
    .map((e) => (SEED_BY_ID[e.id] && e.at < Date.now() ? { ...e, at: SEED_BY_ID[e.id].at } : e));
}

// 서버 저장 모드에서는 동작마다 시각(_at)과 번호(_op)가 붙는다. 시각·id 를 그 값에서 만들면
// 다른 폰에서 다시 쌓아도(충돌 처리) 같은 id 가 나온다 — 여러 건을 한 번에 다시 쌓을 때
// Date.now() 가 겹쳐 id 가 같아지는 일도 없다. 데모에서는 붙지 않으니 지금 시각을 쓴다.
const nowOf = (a) => (Number.isFinite(a?._at) ? a._at : Date.now());
const idOf = (prefix, a) => (a?._op ? `${prefix}${a._op}` : `${prefix}${Date.now()}`);

// 방문 리포트 잠금 (2026-10-18) — 컨시어지가 제출하면 21항목 · 등급 · 내용 · 사진 · 장소를 고칠 수 없다.
// 관제가 보호자에게 보내기 전에는 '반려'(returnVisit)로 되돌려 다시 고치게 하고, 보낸 뒤에는 증명 기록이라 영원히 잠근다.
// 돌려주는 값: "sent"(보호자에게 발송됨) | "submitted"(제출 · 관제 검수 중) | null(고칠 수 있음)
export const visitLock = (visit) => (visit?.ops?.sentAt ? "sent" : visit?.reportSent ? "submitted" : null);

// 다니시던 병원 한 줄의 열쇠 — 예전 항목(id 없음)은 이름 + 등록 시각으로 찾는다
export const hospitalKey = (h) => h?.id || `${h?.name}@${h?.at}`;
const cleanHospital = (p) => ({
  name: String(p?.name || "").trim().slice(0, 60),
  dept: String(p?.dept || "").trim().slice(0, 60),
  note: String(p?.note || "").trim().slice(0, 120),
});

// 녹음 하나의 표식 — 여러 폰이 쓰는 값이라 모양을 거른다 (서버 녹음 vc_… · 데모 녹음 mem:…)
function cleanClip(c) {
  if (!c || typeof c !== "object") return null;
  const id = String(c.id || "");
  if (!/^(vc_[A-Za-z0-9_-]{16,40}|mem:[a-z0-9]{6,24})$/.test(id)) return null;
  const secs = Math.round(Number(c.secs));
  return { id, mime: String(c.mime || "").slice(0, 60), secs: Number.isFinite(secs) && secs > 0 ? Math.min(secs, 180) : null };
}

// ── 해주세요 상태 바꾸기 도우미 (reducer 전용) ──
const CLOSED_REQ = ["done", "cancelled", "rejected"];
const reqTs = (ymd, hm) => Date.parse(`${ymd}T${/^\d{2}:\d{2}$/.test(hm || "") ? hm : "10:00"}:00+09:00`);
// 확정된 해주세요는 캘린더에도 — 보호자 · 어르신 · 컨시어지가 같은 일정을 본다. 취소 · 거절되면 뺀다.
const reqEvent = (r) => ({
  id: `ev-${r.id}`,
  reqId: r.id,
  kind: "request",
  title: `해주세요 · ${svcTitle(r.type)}`,
  at: reqTs(r.scheduledDate, r.scheduledTime),
  source: r.dir === "fromConcierge" ? "컨시어지 제안 수락" : "컨시어지 승인",
  note: r.assignee ? `${r.assignee} 담당` : "",
});
function withRequest(state, next, addEvent) {
  const events = (state.events || []).filter((e) => e.reqId !== next.id);
  return {
    ...state,
    requests: state.requests.map((x) => (x.id === next.id ? next : x)),
    events: addEvent && next.scheduledDate ? [...events, reqEvent(next)] : addEvent ? events : state.events,
  };
}
// 다른 사람의 정보를 고친 기록 한 묶음 — 같은 저장에서 바뀐 칸마다 한 줄 (2026-10-28 요청 공통 원칙).
// rows: [{ field, before, after, kind?, name?, key? }] · target: { kind, name, key? } (줄에 대상이 없으면 이것) · 사유 · 고친 사람은 동작(action)에서
function logEdits(state, rows, action, target) {
  if (!rows.length) return state.editLog || [];
  const at = nowOf(action);
  const base = idOf("ed", action);
  const by = String(action.by || "").slice(0, 40);
  const reason = String(action.reason || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const txt = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 300) || "—";
  const role = { ops: "관제", concierge: "컨시어지", guardian: "보호자", elder: "어르신" }[action.role] || "";
  const add = rows.map((r, i) => {
    const t = r.kind ? r : target;
    return { id: `${base}-${i}`, at, kind: t.kind, name: String(t.name || "").slice(0, 30), ...(t.key ? { key: String(t.key).slice(0, 40) } : {}), field: String(r.field).slice(0, 40), before: txt(r.before), after: txt(r.after), reason, by, role };
  });
  return [...add, ...(state.editLog || [])].slice(0, 300);
}
// 건강 정보 앞뒤로 바뀐 칸 — 질환 · 알레르기 · 복용약 · 건강식품
function healthDiff(a, b) {
  const pairs = [
    ["질환", a.conditions.join(" · "), b.conditions.join(" · ")],
    ["알레르기", a.allergies.join(" · "), b.allergies.join(" · ")],
    ["복용약", medSummary(a.meds).join(" / "), medSummary(b.meds).join(" / ")],
    ["건강식품", a.supplements.map(supplementLine).join(" / "), b.supplements.map(supplementLine).join(" / ")],
  ];
  return pairs.filter(([, x, y]) => x !== y).map(([field, before, after]) => ({ field, before: before || "등록 없음", after: after || "등록 없음" }));
}

// 미팅 리포트 '부탁하신 것' → 부탁 목록 (2026-10-28 요청 1 · lib/elder-asks.js).
// 아직 어르신께 보이지 않은(관제 발송 전) 열린 부탁은 이번 제출로 바꾼다 — 반려받아 고쳐 다시 낸 리포트가 같은 부탁을
// 두 번 남기지 않게. 이미 보인 부탁 · 닫힌 부탁은 그대로 두고, 발송 전에 닫은 부탁과 같은 글은 다시 만들지 않는다
function syncAsks(prev, asks, { at, by, report }) {
  const list = Array.isArray(prev) ? prev : [];
  const lines = askLines(asks.map((x) => String(x ?? "")).join("\n"));
  const kept = list.filter((a) => a.shownAt || a.status !== "open");
  const closedDraft = new Set(list.filter((a) => !a.shownAt && a.status !== "open").map((a) => a.text));
  const fresh = lines
    .filter((t) => !closedDraft.has(t))
    .map((text, i) => ({ id: `${report}-a${i}`, text, at, by: String(by || "").slice(0, 30), report, status: "open", shownAt: null }));
  return [...fresh, ...kept].slice(0, ASKS_KEEP);
}
// 이 기능 전에 낸 미팅 리포트의 '부탁하신 것' → 부탁 기록 (2026-10-30 현장 확인 — 업데이트 전에 보낸 리포트의 부탁이 어르신 홈에
// 글로만 남아 해결 · 취소를 못 했고, 컨시어지 고객 상세에도 안 보였다). 부탁 기록이 하나도 없는 가구만, 어르신 홈이 보여 주는 리포트
// (lib/live-household.js sentReportState) 그대로 — 지금 방문을 관제가 보냈으면 그것, 아니면 보관된 지난 방문. 지금 방문을 내기만 했으면
// 그 부탁도 남기되 관제가 보낼 때 보인다(visitOps). 리포트 id 로 열쇠를 만들어 여러 폰이 따로 읽어도 같은 기록이 된다
function legacyAsks(s) {
  const cur = s.visit || {};
  const past = (s.visitHistory || [])[0];
  const sentOf = (v) => !!(v?.ops?.sentTs || v?.ops?.sentAt);
  const srcs = [cur.reportSent ? { visit: cur, report: (s.reports || [])[0] } : null, !sentOf(cur) && past?.visit ? { visit: past.visit, report: past.report } : null];
  const out = [];
  for (const src of srcs) {
    if (!src || !isMeet(src.visit.loc)) continue;
    const r = src.report || {};
    const at = Number(r.at) || 0;
    const report = r.id ? String(r.id).slice(0, 40) : `legacy-${at}`;
    if (out.some((a) => a.report === report)) continue;
    const ops = src.visit.ops || {};
    const shownAt = sentOf(src.visit) ? (Number.isFinite(ops.sentTs) ? ops.sentTs : at || 1) : null;
    askLines(visitText(src.visit, "asked")).forEach((text, i) => out.push({ id: `${report}-a${i}`, text, at, by: String(r.by || "").slice(0, 30), report, status: "open", shownAt }));
  }
  return out.slice(0, ASKS_KEEP);
}
// 거절 · 취소 — 보호자가 낸 돈은 환불 대기로 (베타: 관제가 토스 상점관리자에서 환불하고 '환불 완료'). 데모 가상 승인은 돈이 없어 바로 완료.
function closeRequest(state, r, to, note, at, by) {
  const next = transition(r, to, note, at, { by });
  if (next === r) return state;
  return {
    ...state,
    requests: state.requests.map((x) => (x.id === r.id ? next : x)),
    events: (state.events || []).filter((e) => e.reqId !== r.id),
    payments: (state.payments || []).map((p) =>
      p.ref === r.id && p.status === "done" && !p.refund
        ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: note, at, by, ...(p.demo ? { doneAt: at, doneBy: "데모 (실제 결제 없음)" } : {}) } }
        : p
    ),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      // 구버전 저장값(슬라이스에 새 키가 없는 형태)과 깊은 병합 — 새 키 기본값 유지.
      // localStorage는 신뢰할 수 없는 입력: 객체·배열 형태를 검증하고 아니면 기본값을 지킨다.
      const p = action.payload && typeof action.payload === "object" ? action.payload : {};
      const arr = (v, fallback) => (Array.isArray(v) ? v : fallback);
      const obj = (v, fallback) => (v && typeof v === "object" && !Array.isArray(v) ? v : fallback);
      const next = {
        ...state,
        ...p,
        demo: { ...state.demo, ...(p.demo || {}) },
        elder: {
          ...state.elder,
          ...(p.elder || {}),
          // 저장값이 객체가 아니면(구버전·손상) 기본값을 지킨다
          medSlots: obj(p.elder && p.elder.medSlots, state.elder.medSlots),
          reordered: obj(p.elder && p.elder.reordered, state.elder.reordered),
          msgPlayed: obj(p.elder && p.elder.msgPlayed, state.elder.msgPlayed),
          medPopShown: obj(p.elder && p.elder.medPopShown, state.elder.medPopShown),
        },
        welfare: {
          status: obj(p.welfare && p.welfare.status, state.welfare.status),
          answers: obj(p.welfare && p.welfare.answers, state.welfare.answers),
        },
        guardian: { ...state.guardian, ...obj(p.guardian, {}) },
        ops: { ...state.ops, ...(p.ops || {}) },
        // 우선 날씨는 어르신 홈 정렬과 마이 탭 칩이 factors 를 배열로 전제한다.
        // 저장값이 구버전이거나 손상되면 두 화면이 같이 죽으므로 형태를 지킨다.
        priority: {
          ...state.priority,
          ...obj(p.priority, {}),
          factors: arr(p.priority && p.priority.factors, state.priority.factors),
        },
        visit: {
          ...state.visit,
          ...(p.visit || {}),
          audit: arr(p.visit && p.visit.audit, state.visit.audit),
          checks: obj(p.visit && p.visit.checks, state.visit.checks),
          notes: obj(p.visit && p.visit.notes, state.visit.notes),
          grades: obj(p.visit && p.visit.grades, state.visit.grades),
          ops: obj(p.visit && p.visit.ops, state.visit.ops),
        },
        escort: { ...state.escort, ...obj(p.escort, {}) },
        opsMessages: arr(p.opsMessages, state.opsMessages),
        opsNotes: arr(p.opsNotes, state.opsNotes),
        ticker: arr(p.ticker, state.ticker),
        events: rebaseSeedEvents(arr(p.events, state.events)),
        reports: arr(p.reports, state.reports),
        requests: arr(p.requests, state.requests),
        productImages: obj(p.productImages, state.productImages),
        // 옛 씨앗 방문(2026-08-22 고정)이나, 아무도 손대지 않은 채(진행 기록 1줄 · 검토 전) 날짜가 지난 방문은
        // 날짜만 오늘 기준 씨앗(사흘 뒤 14:00)으로 옮긴다 — 저장된 날짜가 그대로 과거가 되지 않게 (2026-10-02 QA · 코드 리뷰)
        visitPlan: (() => {
          const v = { ...state.visitPlan, ...(p.visitPlan || {}) };
          const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
          const untouched = (v.trail || []).length <= 1 && ["draft", "review"].includes(v.status);
          const stale = v.id === "vs-2026-08-22" || (untouched && String(v.at || "").slice(0, 10) < today);
          return stale ? { ...v, id: SEED_VISIT.id, at: SEED_VISIT.at } : v;
        })(),
        voices: arr(p.voices, state.voices),
        askDoctor: arr(p.askDoctor, state.askDoctor),
        reviews: arr(p.reviews, state.reviews),
        orders: arr(p.orders, state.orders),
        myHospitals: arr(p.myHospitals, state.myHospitals),
        eventsRemoved: arr(p.eventsRemoved, state.eventsRemoved),
        visitHistory: arr(p.visitHistory, state.visitHistory),
        // 토스 대문자 상태("DONE")로 저장된 옛 기록도 앱 규칙(소문자 done)으로 — 결제 완료가 '없는 결제'로 보이지 않게 (2026-10-19 점검 F-01)
        payments: arr(p.payments, state.payments).map((x) =>
          x && typeof x === "object" && typeof x.status === "string" && x.status !== x.status.toLowerCase() ? { ...x, status: normalizePayStatus(x.status) } : x
        ),
        billing: p.billing ?? state.billing,
        memberPay: obj(p.memberPay, null),
        extraCharges: arr(p.extraCharges, state.extraCharges).filter((x) => x && typeof x === "object" && x.id),
        pendingOrders: obj(p.pendingOrders, state.pendingOrders),
        pendingOrder: p.pendingOrder ?? state.pendingOrder,
        health: obj(p.health, state.health),
        prefNotes: arr(p.prefNotes, state.prefNotes).filter((x) => x && typeof x === "object" && typeof x.text === "string"),
        elderAsks: arr(p.elderAsks, state.elderAsks).filter((x) => x && typeof x === "object" && x.id && typeof x.text === "string"),
        editLog: arr(p.editLog, state.editLog).filter((x) => x && typeof x === "object" && x.id && typeof x.field === "string"),
        hospitals: Array.isArray(p.hospitals) ? p.hospitals.filter((x) => x && typeof x === "object" && x.id && x.name) : state.hospitals ?? null,
        hospitalsRemoved: arr(p.hospitalsRemoved, state.hospitalsRemoved),
        conciergeProfiles: obj(p.conciergeProfiles, state.conciergeProfiles),
        elderStaff: obj(p.elderStaff, state.elderStaff),
        guardianInfo: obj(p.guardianInfo, state.guardianInfo),
        guardianNotices: arr(p.guardianNotices, state.guardianNotices).filter((x) => x && typeof x === "object" && x.id && typeof x.to === "string"),
      };
      return next.elderAsks.length ? next : { ...next, elderAsks: legacyAsks(next) };
    }
    case "completeOnboarding":
      return { ...state, onboarding: action.payload };
    // 가입 뒤 보호자가 바꾸는 것 — 결제권한·한도 (마이 탭 '결제 관리' · 온보딩 문구
    // "가입 후에도 보호자가 변경할 수 있습니다"). 온보딩을 안 거친 데모는 기본값 위에 얹는다.
    case "onboardingPatch":
      return { ...state, onboarding: { ...(state.onboarding || {}), ...action.patch } };
    case "addEvent":
      // 날짜 · 시간이 숫자가 아닌 일정은 받지 않는다 — 달력 · 오늘 화면이 이 값으로 날짜를 만든다 (2026-10-19 점검 G2)
      if (!action.payload || !Number.isFinite(action.payload.at)) return state;
      return { ...state, events: [...state.events, action.payload] };
    // 일정 고치기 — 누가 무엇을 고칠 수 있는지는 lib/event-rights.js (2026-10-18).
    // 해주세요에 묶인 일정은 해주세요가 다시 만들기 때문에 여기서 바꾸지 않는다. 확정된 일정의 시간 · 종류 · 동행이
    // 바뀌면 관제가 사람 · 차를 다시 봐야 하므로 '승인 대기'로 돌린다 (전에는 바꿔도 '승인'이 그대로 남았다).
    case "updateEvent": {
      const src = action.patch || {};
      const patch = {};
      if (typeof src.title === "string" && src.title.trim()) patch.title = src.title.trim().slice(0, 80);
      if (Number.isFinite(src.at)) patch.at = src.at;
      if (typeof src.kind === "string" && src.kind) patch.kind = src.kind.slice(0, 20);
      if (typeof src.escort === "boolean") patch.escort = src.escort;
      if (typeof src.note === "string") patch.note = src.note.slice(0, 160);
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.id || e.reqId || eventLocked(e, nowOf(action))) return e;
          const moved = e.approval === "approved" && REAPPROVE_KEYS.some((k) => k in patch && patch[k] !== e[k]);
          return {
            ...e,
            ...patch,
            // 확정 값은 prevApproved 에 남겨 둔다 — 관제가 바뀐 내용을 반려하면 원래 확정 일정으로 돌아간다
            // reBy — 확정 뒤 바꾼 쪽(역할). 보호자가 어르신 일정을 옮겼는데 어르신 달력에 승인 전 새 시각 · '원래대로'가 보이던 것을 막는다 (2026-10-26 점검)
            ...(moved ? { approval: "pending", reapproval: true, reBy: ["elder", "guardian", "concierge", "ops"].includes(action.role) ? action.role : null, prevApproved: { at: e.at, kind: e.kind, escort: e.escort, title: e.title, note: e.note } } : {}),
            changeRejected: null,
            editedAt: nowOf(action),
            editedBy: String(action.by || "").slice(0, 30) || null,
          };
        }),
      };
    }
    // 일정 지우기 · 취소 — 달력에서 빼고 eventsRemoved 에 남긴다. 'cancel' 은 확정된 일정을 거두는 것(관제에 알린다),
    // 'delete' 는 승인 전 · 가족 일정 · 반려된 것을 정리하는 것. 해주세요에 묶인 일정은 해주세요 취소로만 빠진다.
    case "removeEvent": {
      const e = state.events.find((x) => x.id === action.id);
      if (!e || e.reqId || eventLocked(e, nowOf(action))) return state;
      // 확정됐던 일정(재확인 중 포함)은 사람 · 차가 잡혀 있었으니 '취소'로 남긴다 — 관제 지금 처리할 일 · 취소된 일정 목록에 뜬다
      // 컨시어지가 동행까지 잡은 진료 예약을 지운 것도 '취소'로 — 관제 '일정 취소 · 배차 정리'에 뜬다 (2026-10-19 점검)
      const mode = action.mode === "cancel" || e.approval === "approved" || e.reapproval || (eventOwner(e) === "concierge" && e.escort) ? "cancel" : "delete";
      const removed = {
        mode,
        at: nowOf(action),
        by: String(action.by || "").slice(0, 30),
        reason: String(action.reason || "").replace(/\s+/g, " ").trim().slice(0, 120),
      };
      return {
        ...state,
        events: state.events.filter((x) => x.id !== e.id),
        eventsRemoved: [{ ...e, removed }, ...(state.eventsRemoved || [])].slice(0, 60),
      };
    }
    // 관제 병원 관리 — 등록 · 수정 · 삭제 (2026-10-28 요청 2). 명부는 가구 기록 한 곳이라 보호자 · 어르신 · 컨시어지 화면이
    // 새로고침 없이 같이 바뀐다. 아직 아무도 고치지 않은 가구는 화면이 기본 명부(base)를 같이 보낸다 — 기록 규칙은 예시 데이터를 모른다
    case "saveHospital": {
      const h = cleanOpsHospital(action.hospital);
      if (!h) return state;
      const list = Array.isArray(state.hospitals) ? state.hospitals : Array.isArray(action.base) ? action.base.map(cleanOpsHospital).filter(Boolean) : [];
      return { ...state, hospitals: list.some((x) => x.id === h.id) ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h] };
    }
    // 지운 병원은 명부에서 빠지고 삭제 이력에 남는다. 이미 잡힌 일정 · 해주세요는 병원 이름을 글로 갖고 있어 그대로다
    case "removeHospital": {
      const list = Array.isArray(state.hospitals) ? state.hospitals : Array.isArray(action.base) ? action.base.map(cleanOpsHospital).filter(Boolean) : [];
      const h = list.find((x) => x.id === action.id);
      if (!h) return state;
      return {
        ...state,
        hospitals: list.filter((x) => x.id !== h.id),
        hospitalsRemoved: [{ at: nowOf(action), by: String(action.by || "").slice(0, 40), id: h.id, name: h.name, dept: h.dept }, ...(state.hospitalsRemoved || [])].slice(0, 40),
      };
    }
    // 컨시어지 상세 고치기 — 관제 컨시어지 관리 5개 탭의 [편집] (2026-10-28 요청 3 · lib/ops-records.js cleanStaffPatch).
    // 아는 칸만 받고 사유(4자 이상)가 있어야 저장한다. 화면이 보낸 바뀐 칸(fields)마다 그 컨시어지 수정이력에 한 줄
    case "setConciergeProfile": {
      const name = String(action.name || "").trim().slice(0, 30);
      const patch = cleanStaffPatch(action.patch);
      const fields = (Array.isArray(action.fields) ? action.fields : []).filter((f) => f && typeof f.field === "string" && f.field.trim()).slice(0, 40);
      if (!name || !patch || !Object.keys(patch).length || !fields.length || !reasonOk(action.reason)) return state;
      const profiles = state.conciergeProfiles || {};
      return {
        ...state,
        conciergeProfiles: { ...profiles, [name]: { ...(profiles[name] || {}), ...patch, by: String(action.by || "").slice(0, 40), at: nowOf(action) } },
        editLog: logEdits(state, fields.map(({ field, before, after }) => ({ field, before, after })), action, { kind: "concierge", name }),
      };
    }
    // 담당 컨시어지 바꾸기 — 관제 어르신 관리 [담당 컨시어지 변경] · 컨시어지 관리 담당고객 [추가 · 해제] (2026-10-28 요청 3).
    // 주 담당은 꼭 있어야 하고 주 · 부가 같으면 받지 않는다(2인 1조 · 단독 배차 0). 부 담당은 비울 수 있다 — 관제 '부 담당 없음'에 뜬다.
    // 아직 아무도 고치지 않은 어르신은 화면이 지금 담당(prev · 명부 값)을 같이 보낸다. 어르신 · 바뀐 컨시어지의 수정이력에 한 줄씩
    case "setElderStaff": {
      const key = String(action.key || "").slice(0, 40);
      const nm = (v) => String(v || "").trim().slice(0, 30);
      const pri = nm(action.pri);
      const sub = nm(action.sub) || NO_STAFF;
      if (!key || !pri || pri === NO_STAFF || pri === sub || !reasonOk(action.reason)) return state;
      const saved = state.elderStaff?.[key];
      const prev = saved?.pri ? { pri: saved.pri, sub: saved.sub || NO_STAFF } : { pri: nm(action.prev?.pri) || NO_STAFF, sub: nm(action.prev?.sub) || NO_STAFF };
      const next = { pri, sub };
      if (prev.pri === pri && prev.sub === sub) return state;
      const elder = nm(action.elder) || "어르신";
      const was = (n) => staffRoleOf(prev, n);
      const now = (n) => staffRoleOf(next, n);
      const touched = [...new Set([prev.pri, prev.sub, pri, sub])].filter((n) => n && n !== NO_STAFF && was(n) !== now(n));
      const rows = [
        { kind: "elder", name: elder, key, field: "담당 컨시어지", before: `주 ${prev.pri} · 부 ${prev.sub}`, after: `주 ${pri} · 부 ${sub}` },
        ...touched.map((n) => ({ kind: "concierge", name: n, field: "담당 고객", before: was(n) ? `${elder} ${was(n)} 담당` : "—", after: now(n) ? `${elder} ${now(n)} 담당` : `${elder} 담당 해제` })),
      ];
      return {
        ...state,
        elderStaff: { ...(state.elderStaff || {}), [key]: { ...next, by: String(action.by || "").slice(0, 40), at: nowOf(action) } },
        editLog: logEdits(state, rows, action, { kind: "elder", name: elder, key }),
      };
    }
    // 보호자 기본정보 고치기 — 관제 보호자 관리 › 기본정보 [편집] (2026-10-28 요청 4 · lib/ops-records.js cleanGuardianPatch).
    // 사유(4자 이상)가 있어야 저장하고, 바뀐 칸마다 그 보호자 수정이력에 한 줄.
    // 연락 수신동의 · 야간 연락이 바뀌면 보호자 앱에 알린다 — 본인 동의 항목이라 바꾼 사실과 사유를 본인이 본다
    case "setGuardianInfo": {
      const name = String(action.name || "").trim().slice(0, 30);
      const patch = cleanGuardianPatch(action.patch);
      const fields = (Array.isArray(action.fields) ? action.fields : []).filter((f) => f && typeof f.field === "string" && f.field.trim()).slice(0, 20);
      if (!name || !patch || !Object.keys(patch).length || !fields.length || !reasonOk(action.reason)) return state;
      const all = state.guardianInfo || {};
      const prev = all[name] || {};
      const at = nowOf(action);
      const by = String(action.by || "").slice(0, 40);
      const reason = String(action.reason || "").replace(/\s+/g, " ").trim().slice(0, 200);
      // 앞 값 — 저장한 적이 있으면 저장값, 없으면 화면이 보낸 명부 값
      const was = { consent: prev.consent || action.prev?.consent || null, night: "night" in prev ? prev.night : action.prev?.night };
      const onOff = (b) => (b ? "받음" : "안 받음");
      const changed = [
        ...(patch.consent && was.consent ? CONSENT_ITEMS.filter(([k]) => !!was.consent[k] !== patch.consent[k]).map(([k, l]) => `${l} ${onOff(was.consent[k])} → ${onOff(patch.consent[k])}`) : []),
        ...("night" in patch && typeof was.night === "boolean" && was.night !== patch.night ? [`야간 연락 ${was.night ? "가능" : "안 함"} → ${patch.night ? "가능" : "안 함"}`] : []),
      ];
      const notice = changed.length ? { id: idOf("gn", action), at, to: name, kind: "consent", text: changed.join(" · "), reason, by, seenAt: null } : null;
      return {
        ...state,
        guardianInfo: { ...all, [name]: { ...prev, ...patch, by, at } },
        ...(notice ? { guardianNotices: [notice, ...(state.guardianNotices || [])].slice(0, 30) } : {}),
        editLog: logEdits(state, fields.map(({ field, before, after }) => ({ field, before, after })), action, { kind: "guardian", name }),
      };
    }
    // 보호자가 앱에서 알림을 확인했다 — 그 한 건만
    case "guardianNoticeSeen": {
      if (!(state.guardianNotices || []).some((n) => n.id === action.id && !n.seenAt)) return state;
      return { ...state, guardianNotices: state.guardianNotices.map((n) => (n.id === action.id ? { ...n, seenAt: nowOf(action), seenBy: String(action.by || "").slice(0, 30) } : n)) };
    }
    case "setPriority":
      return { ...state, priority: { ...action.payload, setAt: nowOf(action) } };
    // closesVisit — 컨시어지 '리포트 제출'. 오늘 방문의 리포트를 냈다는 표시(visit.reportSent)도 같이 켠다
    // (오늘 탭 '마무리 필요'가 이 값을 본다. 전에는 켜는 곳이 없어서 리포트를 내도 '마무리 필요'가 남았다).
    case "addReport": {
      const { closesVisit, asks, ...report } = action.payload || {};
      const v = state.visit || {};
      // 제출해 검수 중이거나 보호자에게 보낸 방문에는 리포트를 더 얹지 않는다 — 보낸 리포트(증명)가 뒤에 온 것으로 바뀌지 않게.
      // 고칠 것은 관제 반려 → 다시 제출로 (2026-10-18 리뷰)
      if (closesVisit && visitLock(v)) return state;
      // 반려받아 고친 뒤 다시 낸 것이면 관제 검수를 처음부터 (반려 기록은 returns 에 남는다)
      const again = closesVisit && v.returned ? { returned: null, ops: { ...(v.ops || {}), review: "검수 대기", stepIdx: 3, reviewedAt: null, reviewedTs: null } } : {};
      const at = nowOf(action);
      return {
        ...state,
        reports: [{ ...report, at }, ...state.reports],
        visit: closesVisit ? { ...v, reportSent: true, ...again } : state.visit,
        // 미팅 리포트 '부탁하신 것' — 줄마다 부탁 1건 (2026-10-28 요청 1). 이 화면이 부탁 칸을 보내 온 제출에서만 바꾼다
        ...(closesVisit && Array.isArray(asks) ? { elderAsks: syncAsks(state.elderAsks, asks, { at, by: report.by, report: report.id || idOf("rp", action) }) } : {}),
      };
    }
    // 어르신 부탁 닫기 — 해결(resolved) · 취소(cancelled). 누가 · 언제 · 메모를 남긴다 (2026-10-28 요청 1).
    // 컨시어지는 해결만 한다(취소는 부탁하신 어르신이). 어르신은 화면에 보이는 부탁(관제 발송 뒤)만 닫는다
    case "closeAsk": {
      const a = (state.elderAsks || []).find((x) => x.id === action.id);
      const to = action.to;
      const role = ["elder", "concierge", "ops"].includes(action.role) ? action.role : null;
      if (!a || a.status !== "open" || !["resolved", "cancelled"].includes(to) || !role) return state;
      if (role === "concierge" && to !== "resolved") return state;
      if (role === "elder" && !a.shownAt) return state;
      const memo = String(action.memo || "").replace(/\s+/g, " ").trim().slice(0, 80);
      return {
        ...state,
        elderAsks: state.elderAsks.map((x) =>
          x.id === a.id ? { ...x, status: to, doneAt: nowOf(action), doneBy: String(action.by || "").slice(0, 30), doneRole: role, ...(memo ? { memo } : {}) } : x
        ),
      };
    }
    // 다음 방문 시작 — 보호자에게 발송한 방문 기록을 visitHistory 로 넘기고(그대로 보관) 새 점검표를 연다.
    // 보내지 않은 기록은 넘기지 않는다 (제출 · 검수 중인 것은 반려 → 수정 → 재제출 → 발송을 먼저)
    case "startNextVisit": {
      const v = state.visit || {};
      if (!v.ops?.sentAt) return state;
      const at = nowOf(action);
      const by = String(action.by || "").slice(0, 30);
      // 보호자에게 보낸 동행 기록도 이 방문과 함께 보관하고 동행 칸을 비운다 — 다음 동행을 새로 적을 수 있고,
      // 다음 방문 리포트에 지난 동행 글이 다시 실리지 않게 (리포트 발송 때 저장된 동행은 같이 발송된다 · components/ops/Visits.jsx)
      const esc = state.escort || {};
      const escDone = !!esc.sentAt;
      const rec = { visit: v, report: (state.reports || [])[0] || null, gpsAt: state.visitPlan?.gpsAt || null, closedAt: at, by, ...(escDone ? { escort: esc } : {}) };
      // 방문 업무흐름도 새 초안으로 — 배차 유형(kind)은 그대로 둔다 (인원 기준을 여기서 바꾸지 않는다 · 단독 배차 0)
      const ymd = new Date(at + 28 * 86400000 + 9 * 3600000).toISOString().slice(0, 10);
      const cur = state.visitPlan || SEED_VISIT;
      const visitPlan = {
        ...SEED_VISIT,
        elderName: cur.elderName,
        district: cur.district,
        kind: cur.kind,
        id: `vs-${ymd}`,
        at: `${ymd} 14:00`,
        status: "draft",
        crew: [],
        vehicle: null,
        calls: { elder: false, guardian: false },
        gpsAt: null,
        recordingAt: null,
        trail: [{ at, status: "draft", note: "월 정기 안심방문 — 다음 방문", actor: by || "컨시어지" }],
      };
      return {
        ...state,
        visitHistory: [rec, ...(state.visitHistory || [])].slice(0, 12),
        visit: { ...DEFAULT.visit, loc: v.loc },
        visitPlan,
        ...(escDone ? { escort: { ...DEFAULT.escort } } : {}),
      };
    }
    // 관제 반려 — 보호자에게 보내기 전의 리포트를 컨시어지에게 되돌린다 (사유 필수). 보낸 리포트는 되돌리지 않는다 (증명)
    case "returnVisit": {
      const v = state.visit || {};
      const reason = String(action.reason || "").replace(/\s+/g, " ").trim().slice(0, 160);
      if (v.ops?.sentAt || !v.reportSent || !reason) return state;
      const ret = { at: nowOf(action), by: String(action.by || "관제").slice(0, 30), reason };
      return {
        ...state,
        visit: {
          ...v,
          reportSent: false,
          returned: ret,
          returns: [ret, ...(v.returns || [])].slice(0, 10),
          ops: { ...(v.ops || {}), review: "반려 — 컨시어지 수정 중", stepIdx: 1, reviewedAt: null, reviewedTs: null },
        },
      };
    }
    case "addRequest": {
      const r = action.payload;
      if (!r || !r.id) return state;
      // 같은 요청이 다시 들어오면(오래 남아 있던 동작을 다시 보냄) 두 번 넣지 않는다 (2026-10-26 점검)
      if (state.requests.some((x) => x.id === r.id)) return state;
      // 2인 해주세요 제안은 짝을 정해서만 보낸다 — 수락되면 바로 확정되므로 그때는 늦다 (2026-10-19 점검 C-06)
      if (r.dir === "fromConcierge" && crewOf(r) === 2 && !crewReady(r)) return state;
      return { ...state, requests: [r, ...state.requests] };
    }
    // 해주세요 내용 고치기 (2026-10-18) — 승인 전까지만, 낸 사람이 (lib/requests.js canEditRequest).
    // 종류 · 금액은 서비스 메뉴 값이라 그대로 둔다. 고친 것은 처리 이력에 한 줄로 남는다 (고치기 전 내용은 감사로그에)
    case "editRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || !canEditRequest(r)) return state;
      const p = action.patch || {};
      const txt = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
      const hhmm = (v) => (/^\d{2}:\d{2}$/.test(String(v || "")) ? String(v) : null);
      const next = { ...r };
      const said = [];
      if (p.detail != null) {
        const d = txt(p.detail, 400);
        if (d && d !== r.detail) {
          next.detail = d;
          said.push("내용");
        }
      }
      if (r.dir === "fromConcierge") {
        // 컨시어지 제안 — 제안 일정 (받는 분이 수락하면 그대로 확정된다)
        if (p.scheduledDate !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(String(p.scheduledDate || ""))) {
          const time = hhmm(p.scheduledTime) || r.scheduledTime || "";
          if (p.scheduledDate !== r.scheduledDate || time !== r.scheduledTime) {
            next.scheduledDate = p.scheduledDate;
            next.scheduledTime = time;
            said.push(`제안 일정 ${p.scheduledDate}${time ? ` ${time}` : ""}`);
          }
        }
      } else {
        if (p.preferredDate !== undefined) {
          const d = p.preferredDate ?? null;
          const ok = d == null || (typeof d === "number" && Number.isFinite(d)) || /^\d{4}-\d{2}-\d{2}$/.test(String(d));
          const time = p.preferredTime !== undefined ? hhmm(p.preferredTime) : r.preferredTime || null;
          const when = p.preferredWhen !== undefined ? txt(p.preferredWhen, 40) || null : r.preferredWhen ?? null;
          if (ok && (d !== (r.preferredDate ?? null) || time !== (r.preferredTime || null) || when !== (r.preferredWhen ?? null))) {
            next.preferredDate = d;
            next.preferredTime = time;
            if (p.preferredWhen !== undefined) next.preferredWhen = when;
            said.push(`희망 ${fmtPreferred(next)}`);
          }
        }
        if (p.hospital !== undefined) {
          const h = txt(p.hospital, 60) || null;
          if (h !== (r.hospital || null)) {
            next.hospital = h;
            said.push(h ? `병원 ${h}` : "병원 지움");
          }
        }
        if (URGENCY[p.urgency] && p.urgency !== (r.urgency || "normal")) {
          next.urgency = p.urgency;
          said.push(`긴급도 ${URGENCY[p.urgency].label}`);
        }
      }
      if (!said.length) return state;
      const at = nowOf(action);
      const by = txt(action.by, 30);
      next.editedAt = at;
      next.editedBy = by;
      next.history = [...(r.history || []), { at, status: r.status, note: `${by || "요청자"} 내용 수정 — ${said.join(" · ")}`, by }];
      return { ...state, requests: state.requests.map((x) => (x.id === r.id ? next : x)) };
    }
    case "transitionRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      // 2인 해주세요는 짝이 정해지기 전에 확정 · 진행 · 완료로 넘기지 않는다 (관제 상태 바꾸기 포함 · 2026-10-19 점검)
      if (["confirmed", "inProgress", "done"].includes(action.to) && !crewReady(r)) return state;
      const next = transition(r, action.to, action.note, nowOf(action), action.by ? { by: action.by } : {});
      if (next === r) return state;
      // 관제가 확정한 것(관리자 확인 → 확정)도 달력에 — 다른 확정 경로와 같이
      if (action.to === "confirmed") return withRequest(state, next, true);
      return { ...state, requests: state.requests.map((x) => (x.id === r.id ? next : x)) };
    }
    // ── 해주세요 승인 · 결제 · 취소 (2026-10-05 결정 — lib/requests.js 머리말) ──
    // 결제가 끝났다 — 승인 전이면 담당 컨시어지 승인 대기로, 이미 승인됐거나(요금 확정 전 항목) 제안을 수락한 것이면 확정으로
    case "requestPaid": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      // 낸 금액이 요청 요금과 다르면(주소의 금액을 고친 결제 등) 확정으로 넘기지 않는다 — 그 결제는 환불 대기로,
      // 요청은 결제 대기 그대로 (2026-10-19 점검 — '금액 90,000원 · 결제 완료 100원'으로 승인 대기에 올라갔다)
      const paidAmt = action.amount == null ? null : Number(action.amount);
      if (r.status === "awaitingPayment" && paidAmt != null && Number(r.amount) > 0 && paidAmt !== Number(r.amount)) {
        const at = nowOf(action);
        const hit = (p) => p.ref === r.id && p.status === "done" && !p.refund && (!action.orderId || p.orderId === action.orderId);
        return {
          ...state,
          payments: (state.payments || []).map((p) =>
            hit(p)
              ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: `결제 금액(${paidAmt.toLocaleString("ko-KR")}원)이 요금(${Number(r.amount).toLocaleString("ko-KR")}원)과 다름 — 환불`, at, by: "자동", ...(p.demo ? { doneAt: at, doneBy: "데모 (실제 결제 없음)" } : {}) } }
              : p
          ),
        };
      }
      // 결제창에 있는 사이 취소 · 거절됐거나 이미 결제된 건(두 번 결제) — 방금 들어온 결제는 환불 대기로 (돈만 받고 끝나지 않게)
      if (r.status !== "awaitingPayment") {
        const at = nowOf(action);
        const mine = (state.payments || []).filter((p) => p.ref === r.id && p.status === "done" && !p.refund);
        const late = CLOSED_REQ.includes(r.status) ? mine : mine.slice(0, Math.max(0, mine.length - 1));
        if (!late.length) return state;
        const ids = new Set(late.map((p) => p.id));
        const why = CLOSED_REQ.includes(r.status) ? "결제 전에 요청이 끝남 — 환불" : "같은 요청 두 번 결제 — 환불";
        return { ...state, payments: state.payments.map((p) => (ids.has(p.id) ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: why, at, by: "자동" } } : p)) };
      }
      const at = nowOf(action);
      // 누가 냈나 — 가족 그룹 누구나 낸다 (2026-10-22). 결과 화면이 낸 사람을 넘긴다
      const payer = String(action.by || "보호자").slice(0, 40);
      const proposal = r.dir === "fromConcierge" || r.dir === "fromOps";
      const approved = !!r.approvedAt || proposal;
      const base = approved && !r.approvedAt ? { ...r, approvedAt: at, approvedBy: payer } : r;
      // 짝이 없는 2인 해주세요(규칙 전에 만든 제안 등)는 확정하지 않고 관제 확인으로 — 짝을 정한 뒤 관제가 확정한다
      if (approved && !crewReady(base)) {
        return withRequest(state, transition(base, "needsAdmin", `${action.note || "결제 완료"} · 2인 짝 배정 필요 — 관제 확인`, at, { by: payer }), false);
      }
      // 결제 뒤 — 아직 컨시어지 확인 전이면 승인 대기, 컨시어지가 확인한 요청(요금을 정하고 결제로 보낸 것)이면 관제 승인 대기,
      // 수락한 제안이면 확정 (2026-10-22 · 결제 → 컨시어지 확인 → 관제 승인 → 일정 확정)
      const to = !approved ? "requested" : proposal ? "confirmed" : "opsReview";
      const next = transition(base, to, action.note || "결제 완료", at, { by: payer });
      return withRequest(state, next, to === "confirmed");
    }
    // 가족에게 결제 부탁 — 요청에 남겨 가족 화면에 보인다 (전에는 버튼 글자만 바뀌고 새로고침하면 사라졌다 · 2026-10-19 점검).
    // 2026-10-22부터 가족 누구나 결제하므로 부 보호자는 직접 낸다 — 지금은 어르신이 '가족에게 결제 부탁'으로 쓴다
    case "askPrimaryPay": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "awaitingPayment" || r.payAsk) return state;
      return { ...state, requests: state.requests.map((x) => (x.id === r.id ? { ...x, payAsk: { by: String(action.by || "부 보호자").slice(0, 30), at: nowOf(action) } } : x)) };
    }
    // 담당 컨시어지 확인 — 자기 일정을 보고 날짜 · 시간(· 2인이면 짝)을 정한다. 그다음은 관제 승인 (2026-10-22 결제 → 컨시어지 확인 →
    // 관제 승인 → 일정 확정). 요금 확정 전 항목은 금액도 여기서 정해 결제로 보낸다 — 결제가 끝나면 관제 승인 대기로.
    // 이용 시간 · 인원은 신청한 대로 둔다 (금액이 걸려 있다 — 바꾸려면 취소하고 다시 신청)
    case "approveRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "requested" || approverOf(r) !== "concierge") return state;
      const at = nowOf(action);
      const by = String(action.by || r.assignee || "");
      const amount = r.amount == null && action.amount !== "" && action.amount != null && Number.isFinite(Number(action.amount)) ? Number(action.amount) : r.amount;
      const paid = !!paymentOf(state.payments, r.id) || r.payBy === "elder";
      const to = !paid && amount > 0 ? "awaitingPayment" : "opsReview";
      const when = `${action.date || ""}${action.time ? ` ${action.time}` : ""}`.trim();
      // 2인 해주세요는 함께 갈 짝(다른 컨시어지)을 정해야 확인된다 (2026-10-19 점검 F-05 · C-06)
      const partner = crewOf(r) === 2 ? String(action.partner || r.partner || "").trim() : r.partner || "";
      const base = { ...r, amount, assignee: by || r.assignee, partner: partner || null, scheduledDate: action.date || null, scheduledTime: action.time || "", approvedAt: at, approvedBy: by, opsReturn: null };
      if (!crewReady(base)) return state;
      const next = transition(
        base,
        to,
        `${by} 확인${partner && crewOf(r) === 2 ? ` · 짝 ${partner}` : ""}${when ? ` · ${when}` : ""}${to === "awaitingPayment" ? ` · 결제 대기 ${amount.toLocaleString("ko-KR")}원` : " · 관제 승인 대기"}`,
        at,
        { by }
      );
      // 달력에는 관제가 승인해 확정될 때 들어간다
      return withRequest(state, next, false);
    }
    // 관제 승인 (2026-10-22) — 담당 컨시어지가 확인한 일정을 관제가 승인하면 확정되고 달력에 들어간다.
    // 2인 해주세요는 두 사람이 정해져 있어야 승인된다 (단독 배차 0)
    case "opsApproveRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "opsReview" || !crewReady(r)) return state;
      const at = nowOf(action);
      const by = String(action.by || "관제").slice(0, 30);
      const next = transition({ ...r, opsApprovedAt: at, opsApprovedBy: by }, "confirmed", `관제 승인 (${by}) · 일정 확정${action.note ? ` — ${String(action.note).slice(0, 200)}` : ""}`, at, { by });
      return withRequest(state, next, true);
    }
    // 관제가 일정을 다시 맞추게 한다 — 컨시어지 확인으로 돌아간다. 사유는 컨시어지 확인 칸 · 요청한 분 이력에 보인다. 결제는 그대로.
    // 컨시어지가 정했던 날짜 · 시간은 지운다 — 승인되지 않은 일정이 신청 이름에 남지 않게 (희망 일정으로 돌아간다 · 2026-10-22 점검)
    case "opsReturnRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      const reason = String(action.reason || "").trim().slice(0, 200);
      if (!r || r.status !== "opsReview" || !reason) return state;
      const at = nowOf(action);
      const by = String(action.by || "관제").slice(0, 30);
      const back = { ...r, approvedAt: null, approvedBy: null, scheduledDate: null, scheduledTime: "", opsReturn: { by, at, reason } };
      const next = transition(back, "requested", `관제가 일정을 다시 맞추게 함 (${by}) — ${reason}`, at, { by });
      return withRequest(state, next, false);
    }
    // ── 추가 이용 금액 (2026-10-22) ──
    // 컨시어지 청구 — 진행 중이거나 끝난 해주세요가 예약한 시간보다 길어졌을 때. 실제 이용 시간(30분 단위)과 받는 분(어르신 ·
    // 구두로 동의한 보호자)을 정해 보낸다. 금액은 lib/booking.js 가 정한다 (보낸 금액을 믿지 않는다). 한 해주세요에 청구는 한 번 —
    // 결제 대기 · 결제 완료 청구가 있으면 또 보내지 않는다 (두 번 청구 막기). 잘못 보냈으면 관제가 취소한 뒤 다시 보낸다
    case "sendExtraCharge": {
      const p = action.payload || {};
      const r = state.requests.find((x) => x.id === p.reqId);
      if (!r || !["inProgress", "done"].includes(r.status) || !canChargeExtra(r.type)) return state;
      if ((state.extraCharges || []).some((x) => x.reqId === r.id && x.status !== "cancelled")) return state;
      const role = p.to?.role === "elder" || p.to?.role === "guardian" ? p.to.role : null;
      const bookedMin = Number(r.durationMin) || durOf(r.type)?.min || 0;
      const usedMin = Math.round(Number(p.usedMin));
      const amount = extraAmountOf({ service: r.type, bookedMin, usedMin });
      if (!role || !amount) return state;
      const at = nowOf(action);
      const x = {
        id: idOf("xc-", action),
        reqId: r.id,
        service: r.type,
        customer: String(p.customer || "").slice(0, 40),
        by: String(action.by || r.assignee || "").slice(0, 30),
        sentAt: at,
        bookedMin,
        usedMin,
        startTime: r.scheduledTime || r.preferredTime || "",
        amount,
        base: Number(r.amount) || 0,
        memo: String(p.memo || "").trim().slice(0, 200),
        to: { role, name: String(p.to?.name || "").trim().slice(0, 40) },
        status: "pending",
      };
      const line = { at, status: r.status, note: `${x.by} 추가 이용 금액 청구 ${amount.toLocaleString("ko-KR")}원 (예약 ${durText(bookedMin)} → 실제 ${durText(usedMin)}) — 받는 분 ${extraToText(x)}`, by: x.by };
      return {
        ...state,
        extraCharges: [x, ...(state.extraCharges || [])].slice(0, 200),
        requests: state.requests.map((q) => (q.id === r.id ? { ...q, history: [...(q.history || []), line] } : q)),
      };
    }
    // 받는 분이 결제창(토스 · 데모 가상 승인)에서 냈다. 이미 냈거나 취소된 청구 · 금액이 다른 결제는 받지 않고 환불 대기로
    case "extraChargePaid": {
      const x = (state.extraCharges || []).find((c) => c.id === action.id);
      if (!x) return state;
      const at = nowOf(action);
      const paidAmt = Number(action.amount);
      const refund = (pick, why) => ({
        ...state,
        payments: (state.payments || []).map((p) =>
          p.kind === "extra" && p.ref === x.id && p.status === "done" && !p.refund && pick(p)
            ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: why, at, by: "자동", ...(p.demo ? { doneAt: at, doneBy: "데모 (실제 결제 없음)" } : {}) } }
            : p
        ),
      });
      const thisOne = (p) => !action.orderId || p.orderId === action.orderId;
      if (x.status === "cancelled") return refund(thisOne, "취소된 추가 이용 금액에 결제 — 환불");
      if (x.status === "paid") return refund((p) => p.orderId !== x.orderId && thisOne(p), "같은 추가 이용 금액 두 번 결제 — 환불");
      if (!Number.isFinite(paidAmt) || paidAmt !== Number(x.amount)) return refund(thisOne, `결제 금액(${paidAmt.toLocaleString("ko-KR")}원)이 청구(${Number(x.amount).toLocaleString("ko-KR")}원)와 다름 — 환불`);
      const next = { ...x, status: "paid", paidAt: at, payer: String(action.by || x.to?.name || "").slice(0, 40), method: String(action.method || "카드").slice(0, 30), auto: false, demo: !!action.demo, orderId: action.orderId || null };
      return { ...state, extraCharges: state.extraCharges.map((c) => (c.id === x.id ? next : c)) };
    }
    // 결제 기한(청구일 + 3일)이 지나 받는 분의 등록 카드로 결제 — 자동 청구(카드 키 서버 보관)가 붙기 전에는 관제가 토스 상점관리자에서
    // 청구한 뒤 이 버튼으로 남긴다 (환불 완료와 같은 방식). 기한 전에는 하지 않는다 — 데모 시연만 예외
    case "autoChargeExtra": {
      const x = (state.extraCharges || []).find((c) => c.id === action.id);
      if (!x) return state;
      const at = nowOf(action);
      // 관제가 등록 카드로 결제하는 사이 받는 분이 앱에서 먼저 냈다 — 카드로 받은 것은 환불 대기로 남긴다.
      // 아무 일 없이 넘어가면 두 번 받은 채 환불 기록이 없다 (2026-10-22 점검). 반대 순서는 extraChargePaid 가 환불 대기로 돌린다
      if (x.status === "paid" && !x.auto && !action.demo) {
        if ((state.payments || []).some((p) => p.kind === "extra" && p.ref === x.id && p.cardRecord)) return state; // 두 번 누름
        const by = String(action.by || "관제").slice(0, 30);
        const card = {
          id: idOf("pay", action),
          at,
          kind: "extra",
          ref: x.id,
          orderName: `추가 이용 금액 · ${svcTitle(x.service)} (등록 카드)`,
          amount: x.amount,
          method: "등록 카드 (관제 기록)",
          status: "done",
          cardRecord: true,
          by,
          refund: { status: "pending", amount: x.amount, reason: "앱에서 이미 결제된 추가 이용 금액을 등록 카드로 또 받음 — 환불", at, by: "자동" },
        };
        return { ...state, payments: [card, ...(state.payments || [])].slice(0, 200) };
      }
      if (x.status !== "pending") return state;
      if (!action.demo && at <= extraDueAt(x.sentAt)) return state;
      const next = { ...x, status: "paid", paidAt: at, payer: x.to?.name || "", method: "등록 카드 자동 결제", auto: true, demo: !!action.demo, autoBy: String(action.by || "관제").slice(0, 30) };
      return { ...state, extraCharges: state.extraCharges.map((c) => (c.id === x.id ? next : c)) };
    }
    // 잘못 보낸 청구를 거둔다 (관제) — 결제 전만. 사유를 남긴다
    case "cancelExtraCharge": {
      const x = (state.extraCharges || []).find((c) => c.id === action.id);
      const reason = String(action.reason || "").trim().slice(0, 200);
      if (!x || x.status !== "pending" || !reason) return state;
      const next = { ...x, status: "cancelled", cancel: { by: String(action.by || "관제").slice(0, 30), at: nowOf(action), reason } };
      return { ...state, extraCharges: state.extraCharges.map((c) => (c.id === x.id ? next : c)) };
    }
    // 관제가 수납 완료 · 취소된 청구를 봤다 — '지금 처리할 일'에서 내린다 (결제 대기 청구는 확인으로 닫지 않는다)
    case "ackExtraCharge": {
      const x = (state.extraCharges || []).find((c) => c.id === action.id);
      if (!x || x.status === "pending" || x.opsAck) return state;
      return { ...state, extraCharges: state.extraCharges.map((c) => (c.id === x.id ? { ...c, opsAck: { by: String(action.by || "관제").slice(0, 30), at: nowOf(action) } } : c)) };
    }
    // 멤버십 이용료를 누가 · 어떻게 — 보호자 멤버십 · 어르신 마이 어느 쪽에서 정해도 같은 값 (2026-10-22)
    case "setMemberPay": {
      const who = String(action.who || "").trim().slice(0, 40);
      const how = ["card", "autoTransfer", "bankDeposit"].includes(action.how) ? action.how : null;
      if (!who || !how) return state;
      return { ...state, memberPay: { who, how, by: String(action.by || "").slice(0, 40), at: nowOf(action) } };
    }
    // 담당 컨시어지 거절 — 결제했으면 환불 대기로
    case "declineRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "requested" || approverOf(r) !== "concierge") return state;
      const by = String(action.by || r.assignee || "");
      return closeRequest(state, r, "rejected", `${by} 거절${action.reason ? ` — ${action.reason}` : ""}`, nowOf(action), by);
    }
    // 컨시어지 제안 — 컨시어지가 정한 승인 대상(보호자 · 어르신)만 수락 · 거절한다
    case "respondProposal": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "requested" || approverOf(r) !== action.role) return state;
      const at = nowOf(action);
      const who = action.role === "elder" ? "어르신" : "보호자";
      if (!action.accept) return closeRequest(state, r, "rejected", `${who} 거절${action.reason ? ` — ${action.reason}` : ""}`, at, who);
      // 금액이 있으면 결제 대기 — 수락한 분이든 가족 누구든 결제하면 확정 (2026-10-22 · 어르신 하루 한도는 없앴다)
      let to = r.amount > 0 ? "awaitingPayment" : "confirmed";
      // 짝 없는 2인 제안(규칙 전에 보낸 것) — 수락은 받되 확정하지 않고 관제 확인으로 (결제가 있으면 결제 뒤에)
      if (to === "confirmed" && !crewReady(r)) to = "needsAdmin";
      const next = transition({ ...r, approvedAt: at, approvedBy: who }, to, `${who} 수락${to === "awaitingPayment" ? " · 결제 대기" : to === "needsAdmin" ? " · 2인 짝 배정 필요 — 관제 확인" : ""}`, at, { by: who });
      return withRequest(state, next, to === "confirmed");
    }
    // 취소 — 확정 전이거나 서비스일 3일 이상 남았으면 바로, 그 안(2일 전 · 전날 · 당일 · 진행 중)은 관제 승인 요청
    case "cancelRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const at = nowOf(action);
      const who = String(action.by || "");
      const why = action.reason ? ` — ${action.reason}` : "";
      const rule = cancelRule(r, at);
      if (rule.mode === "free") return closeRequest(state, r, "cancelled", `${who} 취소${why}`, at, who);
      if (rule.mode !== "ops") return state;
      const next = transition(r, "cancelRequested", `${who} 취소 요청${why} — 관제 승인 대기`, at, { by: who });
      return withRequest(state, next === r ? r : { ...next, cancelReq: { by: who, reason: action.reason || "", at, from: r.status } }, false);
    }
    // 관제 — 취소 요청 승인(취소 · 환불 대기) 또는 반려(원래 상태로)
    case "decideCancel": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "cancelRequested") return state;
      const at = nowOf(action);
      const by = String(action.by || "관제");
      const why = action.note ? ` — ${action.note}` : "";
      if (action.approve) return closeRequest(state, r, "cancelled", `관제 취소 승인 (${by})${why}`, at, by);
      const back = r.cancelReq?.from === "inProgress" ? "inProgress" : "confirmed";
      const { cancelReq: _gone, ...rest } = transition(r, back, `관제 취소 반려 (${by})${why}`, at, { by }); // eslint-disable-line no-unused-vars
      return withRequest(state, rest, false);
    }
    // 상태는 그대로 두고 처리 기록만 한 줄 — 도와줘요 '확인 전화 미연결 · 재시도' 같은 중간 단계 (보호자 · 컨시어지 팝업이 이 줄을 띄운다)
    case "noteRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || !action.note) return state;
      const next = { ...r, history: [...(r.history || []), { at: nowOf(action), status: r.status, note: String(action.note), by: String(action.by || "") }] };
      return { ...state, requests: state.requests.map((x) => (x.id === r.id ? next : x)) };
    }
    // 도와줘요(즉시 방문 요청) 관제 처리 — 확인 전화 결과 · 출동 지시 · 해결 완료 (2026-10-05).
    // 어느 단계에서든 해결 완료로 닫을 수 있다 (1차 전화로 끝나는 일이 많다). 각 단계는 이력 한 줄 → 보호자 · 컨시어지 팝업.
    case "helpCall": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || CLOSED_REQ.includes(r.status)) return state;
      const at = nowOf(action);
      const by = String(action.by || "관제");
      const memo = action.note ? ` — ${action.note}` : "";
      const line = (status, note, extra = {}) => ({ ...r, ...extra, status, history: [...(r.history || []), { at, status, note, by }] });
      let next = null;
      if (action.step === "call") {
        if (action.result === "fine") next = line("done", `확인 전화 연결 · 전화로 해결 (${by})${memo}`, { resolvedAt: at, resolvedBy: by });
        // 이미 출동 중이면 상태는 그대로 두고 기록만 (출동한 컨시어지 화면의 도착 · 완료 버튼이 사라지지 않게)
        else if (action.result === "visit") next = line(r.status === "requested" ? "confirmed" : r.status, `확인 전화 연결 · 방문 필요 (${by})${memo}`);
        else next = line(r.status, `확인 전화 미연결 — 다시 걸거나 바로 출동 (${by})${memo}`);
      } else if (action.step === "dispatch") {
        const who = String(action.assignee || r.assignee || "");
        next = line("inProgress", `${who} 컨시어지 출동 지시 (${by})${memo}`, { assignee: who });
      } else if (action.step === "arrive") {
        next = line(r.status, `${by} 현장 도착${memo}`);
      } else if (action.step === "resolve") {
        next = line("done", `해결 완료 (${by})${memo}`, { resolvedAt: at, resolvedBy: by });
      }
      return next ? { ...state, requests: state.requests.map((x) => (x.id === r.id ? next : x)) } : state;
    }
    // 관제 강제 취소 — 상태 · 기한과 상관없이. 결제했으면 환불 대기로
    case "forceCancel": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const by = String(action.by || "관제");
      return closeRequest(state, r, "cancelled", `관제 강제 취소 (${by})${action.reason ? ` — ${action.reason}` : ""}`, nowOf(action), by);
    }
    // 관제 — 토스 상점관리자에서 환불한 뒤 '환불 완료'로 닫는다
    case "refundDone":
      return {
        ...state,
        payments: (state.payments || []).map((p) =>
          p.id === action.paymentId && p.refund && p.refund.status !== "done"
            ? { ...p, refund: { ...p.refund, status: "done", doneAt: nowOf(action), doneBy: String(action.by || "관제") } }
            : p
        ),
      };
    // 관제가 담당 컨시어지를 바꾼다 — 보호자 해주세요 카드의 '담당'이 같이 바뀐다 (2026-10-01).
    // 빈 문자열이면 미배정. 상태는 그대로 두고, 바꾼 기록은 관제 화면의 변경 이력에 남는다.
    // 끝난 요청(완료 · 취소 · 거절)의 담당은 기록이라 바꾸지 않는다 (2026-10-18)
    // 담당 · 짝 바꾸기 (관제). 확정 · 진행 중인 2인 해주세요는 두 사람이 다르게 남아 있어야 바뀐다 — 한 명으로 줄이지 않는다
    case "assignRequest":
      return {
        ...state,
        requests: state.requests.map((r) => {
          if (r.id !== action.id || CLOSED_REQ.includes(r.status)) return r;
          const next = {
            ...r,
            ...(action.assignee !== undefined ? { assignee: String(action.assignee || "") } : {}),
            ...(action.partner !== undefined ? { partner: String(action.partner || "") || null } : {}),
          };
          // 관제 승인 대기도 — 컨시어지가 짝까지 정해 올린 것을 한 명으로 줄이면 승인할 수 없게 된다 (2026-10-22 점검)
          if (["opsReview", "confirmed", "inProgress", "cancelRequested"].includes(r.status) && !crewReady(next)) return r;
          return next;
        }),
      };
    // 새 SOS 가 켜지면 지난 SOS 의 급파 · 119 · 수락 표시를 지운다 — 남아 있으면 새 SOS 가 처음부터 '급파 · 수락됨'으로 보인다
    case "demo": {
      let p = action.payload || {};
      // 이미 끝난 SOS(또는 지금 것보다 옛 SOS)를 누른 기록이 늦게 다시 들어오면 SOS 는 켜지 않는다 — 보내지 못하고 남아 있던
      // 동작이 한참 뒤 다시 보내지면 끝난 SOS 가 모든 폰에 옛 시각으로 다시 켜졌다 (2026-10-26 점검)
      if (p.sos === true && p.sosAt != null) {
        const closed = state.demo.sosLast?.sosAt;
        if ((closed != null && p.sosAt <= closed) || (state.demo.sos && state.demo.sosAt != null && p.sosAt < state.demo.sosAt)) {
          const { sos: _s, sosAt: _t, ...rest } = p; // eslint-disable-line no-unused-vars
          if (!Object.keys(rest).length) return state;
          p = rest;
        }
      }
      const freshSos = p.sos === true && !state.demo.sos;
      return {
        ...state,
        demo: { ...state.demo, ...p },
        ops: freshSos ? { ...state.ops, sosDispatched: false, sosDispatchedTo: "", sos119: false, sosAcceptedAt: null, sosAcceptedBy: "" } : state.ops,
      };
    }
    case "elderPatch":
      return { ...state, elder: { ...state.elder, ...action.patch } };
    // 오늘 복약 체크 · 건기식 재구매 — 되돌리지 않는다 (06 §5). 키만 켜 준다.
    case "elderMark": {
      // 복약 체크는 날짜와 함께 — 날이 바뀌면 어제 체크 위에 쌓지 않고 새로 시작한다 (2026-10-19 점검 F-07 · lib/meds.js medTakenToday)
      if (action.key === "medSlots") {
        const day = kstToday(nowOf(action));
        const prev = state.elder.medSlotsDate === day && state.elder.medSlots && typeof state.elder.medSlots === "object" ? state.elder.medSlots : {};
        return { ...state, elder: { ...state.elder, medSlots: { ...prev, [action.id]: true }, medSlotsDate: day } };
      }
      return {
        ...state,
        elder: { ...state.elder, [action.key]: { ...state.elder[action.key], [action.id]: true } },
      };
    }
    case "opsPatch":
      // 급파 지시는 어느 SOS 의 것인지(sosAt)를 같이 받는다 — 지난 SOS 의 급파가 늦게 들어와 새 SOS 에 붙지 않게 (2026-10-26 점검)
      if (action.patch?.sosDispatched === true && action.sosAt != null && action.sosAt !== state.demo.sosAt) return state;
      return { ...state, ops: { ...state.ops, ...action.patch } };
    case "pushEvent":
      // 하나의 이벤트 스트림 — 규제 대응·분쟁 조사·품질 관리가 같은 데이터를 쓴다 (09 §7.2)
      return {
        ...state,
        ticker: [
          { id: idOf("ev", action), at: nowOf(action), ...action.payload },
          ...state.ticker,
        ].slice(0, 40),
      };
    case "ackSos":
      // SOS 해제 — 관제 전용(SOS 센터에서 사건을 종료할 때). 급파·연계 · 컨시어지 수락 플래그도 함께 초기화.
      // 어느 SOS 를 끄는지(sosAt)를 같이 받는다 — 다른 폰이 그 사이 새 SOS 를 눌렀으면 지난 사건의 종료가 새 SOS 를 끄지 않게 (2026-10-19 점검 F-06)
      if (action.sosAt != null && state.demo.sosAt && action.sosAt !== state.demo.sosAt) return state;
      return {
        ...state,
        // 끝난 SOS 한 줄을 남긴다 — 보호자 · 어르신 화면에 '어떻게 끝났는지', 관제 어르신 관리에 기록 (2026-10-19 점검 L-04)
        demo: {
          ...state.demo,
          sos: false,
          sosLast: state.demo.sos ? { sosAt: state.demo.sosAt || null, closedAt: nowOf(action), result: String(action.result || "해결 완료").slice(0, 60), dispatchedTo: state.ops.sosDispatchedTo || "" } : state.demo.sosLast || null,
        },
        ops: { ...state.ops, sosDispatched: false, sosDispatchedTo: "", sos119: false, sosAcceptedAt: null, sosAcceptedBy: "" },
      };
    // 컨시어지가 급파를 수락했다 — 관제 SOS 대응과 컨시어지 관리에 같은 시각이 뜬다 (한 번만).
    // 전에는 컨시어지 화면 안에서만 기억해서, 새로고침하면 다시 '수락' 버튼이 떴고 관제는 티커로만 알았다.
    // 2026-10-26 점검: 관제가 급파를 지시한 뒤에만 · 급파받은 컨시어지만 · 그 SOS(sosAt)에만. 전에는 컨시어지가 둘 이상인 센터에서
    // 지시받지 않은 사람도 수락할 수 있었고, 끊긴 채 누른 지난 SOS 의 수락이 다음 SOS 에 붙었다
    case "sosAccept":
      if (!state.demo.sos || !state.ops.sosDispatched || state.ops.sosAcceptedAt) return state;
      if (action.sosAt != null && state.demo.sosAt != null && action.sosAt !== state.demo.sosAt) return state;
      if (state.ops.sosDispatchedTo && action.by && String(action.by) !== state.ops.sosDispatchedTo) return state;
      return { ...state, ops: { ...state.ops, sosAcceptedAt: nowOf(action), sosAcceptedBy: String(action.by || "") } };
    case "audit":
      return {
        ...state,
        visit: {
          ...state.visit,
          ...(action.patch || {}),
          audit: [...state.visit.audit, { at: nowOf(action), ...action.event }],
        },
      };
    // 21항목 점검 하나 — done 이 아니면 지운다 (컨시어지 화면과 관제 방문관리가 같이 본다)
    // 아래 visit* 다섯 가지는 리포트를 제출한 뒤에는 받지 않는다 (visitLock — 증명 기록)
    case "visitCheck": {
      if (visitLock(state.visit)) return state;
      const checks = { ...(state.visit.checks || {}) };
      const grades = { ...(state.visit.grades || {}) };
      if (action.done) checks[action.key] = { at: nowOf(action) };
      else {
        delete checks[action.key];
        delete grades[action.key]; // 점검을 끄면 그 항목 상태(양호 · 관찰 · 주의)도 함께 — 보지 않은 항목에 상태가 남지 않게
      }
      return { ...state, visit: { ...state.visit, checks, grades } };
    }
    // 항목 메모(key) 또는 총평(key 없음) — 입력을 마칠 때 한 번 보낸다
    case "visitNote":
      if (visitLock(state.visit)) return state;
      return action.key
        ? { ...state, visit: { ...state.visit, notes: { ...(state.visit.notes || {}), [action.key]: String(action.text || "") } } }
        : { ...state, visit: { ...state.visit, memo: String(action.text || "") } };
    // 항목 상태 — 컨시어지가 직접 고른다. 상태를 고르면 그 항목은 본 것이므로 점검도 같이 켠다. 빈 값이면 지운다.
    case "visitGrade": {
      if (visitLock(state.visit)) return state;
      const grades = { ...(state.visit.grades || {}) };
      const checks = { ...(state.visit.checks || {}) };
      if (action.grade) {
        grades[action.key] = String(action.grade);
        if (!checks[action.key]) checks[action.key] = { at: nowOf(action) };
      } else delete grades[action.key];
      return { ...state, visit: { ...state.visit, grades, checks } };
    }
    // 사진 — 한 장 더 / 한 장 빼기(remove). 제출 전까지만
    case "visitPhoto":
      if (visitLock(state.visit)) return state;
      return { ...state, visit: { ...state.visit, photos: Math.max(0, (state.visit.photos || 0) + (action.remove ? -1 : 1)) } };
    // 거주 형태(자택 · 요양병원) — 컨시어지 점검표와 관제 방문관리 · 보호자 리포트가 같은 21항목을 쓰게 가구 기록에 둔다
    // 미팅(2026-10-24 설계서 v3) — 집 근처 카페에서 만나 쓰는 리포트. 21가지 점검 대신 대화 · 센서 · 워치 기록
    case "visitLoc":
      if (visitLock(state.visit)) return state;
      return ["home", "hospital", "meet"].includes(action.loc) ? { ...state, visit: { ...state.visit, loc: action.loc } } : state;
    // 리포트 글 칸 — 보호자께 부탁드려요 · 어르신께 남길 말 · 내부 메모, 미팅의 대화 기록 · 챙길 것 (lib/checkup.js VISIT_TEXT_KEYS).
    // 입력을 마칠 때 한 번 보낸다. 제출한 뒤에는 받지 않는다 (visitLock — 증명 기록)
    case "visitText":
      if (visitLock(state.visit) || !VISIT_TEXT_KEYS.includes(action.key)) return state;
      return { ...state, visit: { ...state.visit, text: { ...(state.visit.text || {}), [action.key]: String(action.text || "").slice(0, 2000) } } };
    // 미팅 리포트 상태 — talk 만나서 나눈 이야기 · life 생활 반응 · level 종합 (양호 · 관찰 · 주의 · 위험)
    case "visitLevel":
      if (visitLock(state.visit) || !["talk", "life", "level"].includes(action.k) || !VISIT_LEVELS.includes(action.v)) return state;
      return { ...state, visit: { ...state.visit, levels: { ...(state.visit.levels || {}), [action.k]: action.v } } };
    // 동행 기록 — 저장 한 번 (보낸 뒤에는 고치지 않는다 — 보호자가 본 것과 기록이 달라지면 안 된다)
    case "escortSave": {
      // 보낸 뒤에는 물론, 안심방문 리포트를 제출해 검수 중일 때도 받지 않는다 — 관제가 검수한 것과 보호자에게 갈 것이 같아야 한다
      // (같이 제출된 동행 기록은 관제 발송 때 함께 간다 · 2026-10-19 점검 C-02 · F-14)
      if (state.escort?.sentAt || visitLock(state.visit)) return state;
      const p = action.payload || {};
      return {
        ...state,
        escort: {
          ...state.escort,
          note: String(p.note || ""),
          photos: Math.max(0, Number(p.photos) || 0),
          recorded: !!p.recorded,
          by: String(p.by || ""),
          savedAt: nowOf(action),
        },
      };
    }
    case "escortSend":
      if (state.escort?.sentAt) return state;
      return { ...state, escort: { ...state.escort, sentAt: nowOf(action) } };
    case "escortViewed":
      if (!state.escort?.sentAt || state.escort.viewedAt) return state;
      return { ...state, escort: { ...state.escort, viewedAt: nowOf(action) } };
    // 관제가 이 방문에 한 것 — 검수 · 보호자 발송 · 중간 알림 · 후속조치 (관제 방문관리 상세)
    case "visitOps": {
      const v = state.visit || {};
      const ops = v.ops || {};
      const p = { ...(action.patch || {}) };
      // 열람은 보호자가 리포트를 열 때만 남는다 (visitViewed) — 관제 화면의 값으로 바뀌지 않게
      delete p.viewed;
      delete p.viewedTs;
      if (ops.sentAt) {
        // 보호자에게 보낸 방문은 증명 — 검수 · 발송 기록을 다시 쓰지 않는다. 중간 알림 · 후속조치만 더한다 (2026-10-19 점검 F-10)
        for (const k of ["review", "reviewedAt", "reviewedTs", "sentAt", "sentTs", "stepIdx"]) delete p[k];
      } else if (p.sentAt) {
        // 발송은 제출된 리포트를 검수 완료했을 때만 — 반려된 뒤 늦게 온 '발송'으로 잠기지 않게
        const review = p.review ?? ops.review;
        if (!v.reportSent || v.returned || review !== "검수 완료") {
          delete p.sentAt;
          delete p.sentTs;
        }
      }
      if (!Object.keys(p).length) return state;
      // 보호자에게 보내는 순간 — 이 리포트의 부탁이 어르신 홈에도 보인다 (관제 검수를 거친 글만 · 2026-10-28 요청 1)
      const shown = p.sentAt && (state.elderAsks || []).some((a) => !a.shownAt);
      return {
        ...state,
        visit: { ...v, ops: { ...ops, ...p } },
        ...(shown ? { elderAsks: state.elderAsks.map((a) => (a.shownAt ? a : { ...a, shownAt: nowOf(action) })) } : {}),
      };
    }
    // 보호자가 안심방문 리포트를 열었다 — 관제 방문관리에 '열람 완료' (한 번만)
    // 이번 방문을 아직 안 보냈으면(다음 방문을 시작한 뒤) 보호자가 보는 것은 보관된 지난 리포트다 — 그쪽에 찍는다 (2026-10-18 리뷰)
    case "visitViewed": {
      const ops = state.visit?.ops || {};
      if (ops.sentAt) {
        if (ops.viewed === "열람 완료") return state;
        return { ...state, visit: { ...state.visit, ops: { ...ops, viewed: "열람 완료", viewedTs: nowOf(action) } } };
      }
      const h = (state.visitHistory || [])[0];
      const hops = h?.visit?.ops;
      if (!hops?.sentAt || hops.viewed === "열람 완료") return state;
      return { ...state, visitHistory: [{ ...h, visit: { ...h.visit, ops: { ...hops, viewed: "열람 완료", viewedTs: nowOf(action) } } }, ...state.visitHistory.slice(1)] };
    }
    case "addOpsMessage":
      return {
        ...state,
        opsMessages: [{ id: idOf("om", action), at: nowOf(action), ackAt: null, ...action.payload }, ...(state.opsMessages || [])].slice(0, 60),
      };
    case "ackOpsMessage":
      return {
        ...state,
        opsMessages: (state.opsMessages || []).map((m) =>
          m.id === action.id && !m.ackAt ? { ...m, ackAt: nowOf(action), ackBy: action.by || "관제", reply: String(action.reply || "") } : m
        ),
      };
    case "advanceVisit": {
      // 8단계 전이 — 단계를 건너뛰면 workflow.advance 가 그대로 돌려보낸다.
      // 승인은 정책 인원(2인 방문이면 서로 다른 두 사람)이 채워져야 — 화면만이 아니라 여기서도 막는다 (단독 배차 0 · 2026-10-19 점검 F-05)
      const v = state.visitPlan;
      if (action.to === "approved" && new Set((v.crew || []).filter(Boolean)).size < crewFor(v.kind)) return state;
      return { ...state, visitPlan: advance(v, action.to, action.note, action.actor, nowOf(action)) };
    }
    // 건강 정보 저장 — 관제 · 컨시어지 화면의 '복용약 · 질환 수정'. 모양을 여기서 한 번 더 거른다 (여러 폰이 쓰는 값).
    // 선호 카드 — 오늘 알게 된 선호 한 줄 (컨시어지 고객 상세 · 2026-10-24 설계서 v3 §2). 새 것이 위로, 20줄까지
    case "prefNote": {
      const text = String(action.text || "").replace(/\s+/g, " ").trim().slice(0, 120);
      if (!text) return state;
      return { ...state, prefNotes: [{ text, at: nowOf(action), by: String(action.by || "").slice(0, 30) }, ...(state.prefNotes || [])].slice(0, 20) };
    }
    case "setHealth": {
      const pl = action.payload || {};
      const list = (v) => (Array.isArray(v) ? v.map((x) => String(x || "").trim().slice(0, 40)).filter(Boolean).slice(0, 20) : []);
      const prev = state.health && typeof state.health === "object" ? state.health : null;
      const health = {
        meds: (Array.isArray(pl.meds) ? pl.meds : []).map(cleanMedSlot).filter(Boolean).slice(0, 6),
        conditions: list(pl.conditions),
        allergies: list(pl.allergies),
        // 건강식품 (2026-10-28 요청 5 · 6) — 이 칸을 보내지 않은 화면(업데이트 전 화면)이 저장해도 등록한 것이 지워지지 않게 그대로 둔다
        ...(Array.isArray(pl.supplements)
          ? { supplements: pl.supplements.map(cleanSupplement).filter(Boolean).slice(0, 12) }
          : prev && Array.isArray(prev.supplements)
            ? { supplements: prev.supplements }
            : {}),
        by: String(action.by || "").slice(0, 30),
        at: nowOf(action),
      };
      // 바뀐 칸을 어르신 수정이력에 — 관제가 고친 것은 사유와 함께 (2026-10-28 요청 6), 컨시어지가 고친 것도 남긴다
      return {
        ...state,
        health,
        editLog: logEdits(state, healthDiff(healthOf(state), healthOf({ health })), action, { kind: "elder", name: action.elder || "", key: STAFF_LIVE }),
      };
    }
    case "patchVisit": {
      const v = state.visitPlan;
      const patch = { ...(action.patch || {}) };
      // 승인된 뒤에는 늦게 온 화면의 값으로 인원을 정책 아래로 줄이지 않는다 (2026-10-19 점검 F-05)
      if ("crew" in patch && !["draft", "review", "rejected"].includes(v.status)) {
        const n = Array.isArray(patch.crew) ? new Set(patch.crew.filter(Boolean)).size : 0;
        if (n < crewFor(v.kind)) delete patch.crew;
      }
      return { ...state, visitPlan: { ...v, ...patch } };
    }
    // 보호자 · 어르신 일정등록 '요청' 승인 — 관제만 할 수 있다 (2026-08-12 시트 예약 1번).
    // approval 이 "pending" 인 동안에는 컨시어지 캘린더에 뜨지 않는다 (누가 무엇을 보나: eventsFor).
    case "decideEvent": {
      const reason = String(action.reason || "").replace(/\s+/g, " ").trim().slice(0, 120);
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.id) return e;
          // 확정 뒤 고친 것을 반려 — 일정을 없애지 않고 원래 확정 값으로 돌린다 (사유는 등록한 쪽 달력에 · 2026-10-18 리뷰)
          if (action.approval === "rejected" && e.reapproval && e.prevApproved) {
            return { ...e, ...e.prevApproved, approval: "approved", source: "관제 승인", reapproval: false, prevApproved: null, changeRejected: { at: nowOf(action), reason } };
          }
          return {
            ...e,
            approval: action.approval,
            source: action.approval === "approved" ? "관제 승인" : "관제 반려",
            note: action.note ?? e.note,
            reapproval: false,
            prevApproved: null,
            // 반려 사유 — 등록한 쪽이 달력에서 본다 (2026-10-18 · 전에는 '사유는 해주세요로'라 해 놓고 받지 않았다)
            ...(action.approval === "rejected" ? { rejectReason: reason } : {}),
          };
        }),
      };
    }
    // 결제 승인이 끝난 건만 들어온다 (pages/pay/result.jsx). 같은 주문번호는 한 번만 쌓는다 —
    // 결과 화면을 새로고침해도 내역이 겹치지 않게.
    case "addPayment": {
      const list = state.payments || [];
      if (action.payload.orderId && list.some((p) => p.orderId === action.payload.orderId)) return state;
      // 상태는 앱 규칙(소문자)으로 — 토스는 "DONE" 으로 준다 (2026-10-19 점검 F-01)
      const pay = { ...action.payload, status: normalizePayStatus(action.payload.status) };
      // 환불 · '이미 결제' 판단이 이 기록을 본다 — 넉넉히 남긴다
      return { ...state, payments: [{ id: idOf("pay", action), at: nowOf(action), ...pay }, ...list].slice(0, 200) };
    }
    case "setBilling":
      return { ...state, billing: action.payload };
    case "setPendingOrder": {
      // 주인(lib/store.js cartOwner)별 칸에 — 주인이 없으면 예전 한 칸 (2026-10-26 점검)
      const owner = String(action.owner || "");
      if (!owner) return { ...state, pendingOrder: action.payload };
      return { ...state, pendingOrders: { ...(state.pendingOrders || {}), [owner]: action.payload } };
    }
    // 스토어 결제 승인 완료 → 주문·구매내역·배송 요청을 한 번에 세우고 담아 둔 것을 비운다.
    // 결제가 끝나야 주문이 선다는 규칙이 이 한 곳에 있다.
    case "commitPendingOrder": {
      // 이미 주문으로 세운 결제면(결제 서버가 먼저 반영했거나 결과 화면을 다시 열었다) 그대로 둔다 — 장바구니가 비어 있다고
      // 환불 대기로 돌리지 않게. 주문으로 세우면 그 결제에 배송 요청 번호(ref)가 붙는다 (2026-10-26 점검)
      if (action.payload?.orderId && (state.payments || []).some((p) => p.orderId === action.payload.orderId && p.ref)) return state;
      const owner = String(action.owner || "");
      const mine = owner ? (state.pendingOrders || {})[owner] || null : null;
      const po = mine || state.pendingOrder;
      const now = nowOf(action);
      const key = action._op || now;
      const pay = action.payload || {};
      // 결제는 됐는데 담은 물건을 찾지 못했다 — 전에는 그냥 넘어가 돈만 받고 주문 · 환불이 하나도 남지 않았다.
      // 그 결제를 환불 대기로 둔다 (관제 해주세요 관리 '환불 대기'에서 닫는다 · 2026-10-26 점검)
      if (!po) {
        if (!pay.orderId) return state;
        return {
          ...state,
          payments: (state.payments || []).map((p) =>
            p.orderId === pay.orderId && !p.refund
              ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: "결제한 장바구니를 찾지 못함 — 환불", at: now, by: "자동", ...(p.demo ? { doneAt: now, doneBy: "데모 (실제 결제 없음)" } : {}) } }
              : p
          ),
        };
      }
      // 낸 금액이 담은 물건의 카탈로그 합계와 다르면 주문을 세우지 않는다 — 그 결제는 환불 대기로 (2026-10-19 점검)
      const want = orderTotal(po.items);
      const elderOrder = po.from === "elder";
      if (pay.amount != null && want != null && Number(pay.amount) !== want) {
        return {
          ...state,
          payments: (state.payments || []).map((p) =>
            pay.orderId && p.orderId === pay.orderId && !p.refund
              ? { ...p, refund: { status: p.demo ? "done" : "pending", amount: p.amount, reason: `결제 금액이 주문 합계(${want.toLocaleString("ko-KR")}원)와 다름 — 환불`, at: now, by: "자동" } }
              : p
          ),
        };
      }
      const { [owner]: _paid, ...restCarts } = state.pendingOrders || {}; // eslint-disable-line no-unused-vars
      return {
        ...state,
        // 결제한 주인의 장바구니만 비운다 — 다른 사람이 담아 둔 것은 그대로
        pendingOrders: mine ? restCarts : state.pendingOrders || {},
        pendingOrder: mine ? state.pendingOrder : null,
        // 선생님이 안전진단에서 담아 둔 물건은 보호자 주문 때만 비운다 — 어르신이 다른 물건 하나를 사도 다 지워졌다 (2026-10-26 점검)
        demo: { ...state.demo, cart: true, safetyCart: elderOrder ? state.demo.safetyCart || [] : [] },
        // 이 결제를 배송 요청에 잇는다 — 전에는 이어지지 않아 컨시어지 · 관제 화면에 '결제 전'으로 보였다 (2026-10-26 점검)
        payments: (state.payments || []).map((p) => (pay.orderId && p.orderId === pay.orderId && !p.ref ? { ...p, ref: `rq-${key}` } : p)),
        orders: [
          { id: `od${key}`, at: now, by: String(action.by || (elderOrder ? "어르신" : "보호자")), channel: po.channel, items: po.items, ship: po.ship, status: "preparing", receipt: pay.receiptUrl || null, note: "" },
          ...state.orders,
        ],
        requests: [
          {
            id: `rq-${key}`,
            // 어르신 스토어에서 어르신이 직접 결제한 주문도 같은 길로 선다 (2026-10-22 · 금액 제한 없음)
            dir: elderOrder ? "fromElder" : "fromGuardian",
            type: elderOrder ? "물건을 담았어요" : "물품 전달해 주세요",
            storeOrder: true, // 스토어 주문 표시 — 보호자가 직접 적는 '물품 전달해 주세요' 부탁과 구분한다 (lib/requests.js isStoreOrder)
            // 담당은 관제가 정한다 (2026-10-02 QA — 박지현으로 미리 박지 않는다)
            detail: `${elderOrder ? "어르신" : "보호자"} 주문: ${po.items.map((i) => i.name).join(", ")} — 다음 배송일에 전달해 주세요.`,
            amount: po.total,
            preferredDate: null,
            urgency: "normal",
            assignee: "",
            photos: [],
            status: "inProgress",
            history: [
              { at: now, status: "requested", note: "스토어 주문" },
              { at: now, status: "confirmed", note: "" },
              { at: now, status: "inProgress", note: `${elderOrder ? "어르신" : "보호자"} 결제 완료 · ${pay.method || "카드"}` },
            ],
            proof: null,
          },
          ...state.requests,
        ],
      };
    }
    case "addVoice": {
      const p = action.payload || {};
      const clip = cleanClip(p.clip);
      const v = { id: idOf("vo", action), at: nowOf(action), ...p, ...(p.clip ? { clip } : {}) };
      // 같은 음성이 다시 들어오면(오래 남아 있던 동작을 다시 보냄) 두 번 넣지 않는다 (2026-10-26 점검)
      if (state.voices.some((x) => x.id === v.id)) return state;
      return { ...state, voices: [v, ...state.voices].slice(0, 30) };
    }
    // 보낸 음성 거두기 (2026-10-18) — 받는 분이 아직 듣지 않은 것만, 보낸 사람이. 가구 기록에서 빠져 받는 화면에서도 사라진다.
    // 녹음 파일 자체는 서버 voice_clips 표에 30일 보관 뒤 지워진다 (바로 지우는 서버 API 는 다음 단계 — docs 결정 기록)
    case "unsendVoice": {
      const v = (state.voices || []).find((x) => x.id === action.id);
      if (!v || state.elder?.msgPlayed?.[v.id] || state.guardian?.voiceHeard?.[v.id]) return state;
      if (action.from && v.from !== action.from) return state;
      return { ...state, voices: state.voices.filter((x) => x.id !== v.id) };
    }
    // ── 오늘 여쭤볼 것 (2026-10-14) — 어르신이 말로 남긴 질문. 다시 말하기 · 해결 · 지우기 ──
    case "askDoctorAdd": {
      const p = action.payload || {};
      const clip = cleanClip(p.clip);
      const item = {
        id: idOf("ad", action),
        at: nowOf(action),
        source: "elder",
        sourceLabel: "어르신이 말씀하신 것",
        status: "open",
        text: p.text ? String(p.text).slice(0, 120) : null,
        clip,
        secs: clip?.secs || null,
      };
      return { ...state, askDoctor: [...(state.askDoctor || []), item].slice(-30) };
    }
    case "askDoctorEdit": {
      const clip = cleanClip(action.clip);
      if (!clip) return state;
      return {
        ...state,
        askDoctor: (state.askDoctor || []).map((q) => (q.id === action.id ? { ...q, clip, secs: clip.secs, text: q.source === "elder" ? null : q.text, editedAt: nowOf(action) } : q)),
      };
    }
    case "askDoctorStatus":
      return {
        ...state,
        askDoctor: (state.askDoctor || []).map((q) =>
          q.id === action.id ? { ...q, status: action.status === "resolved" ? "resolved" : "open", resolvedAt: action.status === "resolved" ? nowOf(action) : null } : q
        ),
      };
    case "askDoctorRemove":
      return { ...state, askDoctor: (state.askDoctor || []).filter((q) => q.id !== action.id) };
    // 말로 남기신 부탁의 글 요약 — 담당 컨시어지가 듣고 적는다. 어르신 '부탁해 둔 것' · 보호자 · 관제가 이 한 줄을 본다 (2026-10-14)
    // ── 관제 상담 · 관제 메모 (2026-10-18) — 관제가 남기고 고치고 지운다. 고친 글의 이전 내용은 prev 에, 지운 글은 감사로그에 ──
    case "addOpsNote": {
      const text = String(action.payload?.text || "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!text) return state;
      const note = { id: idOf("on", action), at: nowOf(action), who: String(action.payload?.who || "관제").slice(0, 40), text };
      return { ...state, opsNotes: [note, ...(state.opsNotes || [])].slice(0, 100) };
    }
    case "editOpsNote": {
      const text = String(action.text || "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!text) return state;
      const at = nowOf(action);
      return {
        ...state,
        opsNotes: (state.opsNotes || []).map((n) =>
          n.id === action.id && n.text !== text
            ? { ...n, text, editedAt: at, editedBy: String(action.by || "").slice(0, 40), prev: [{ text: n.text, at: n.editedAt || n.at }, ...(n.prev || [])].slice(0, 5) }
            : n
        ),
      };
    }
    case "removeOpsNote":
      return { ...state, opsNotes: (state.opsNotes || []).filter((n) => n.id !== action.id) };
    // 끝난 요청의 요약은 처리 기록이라 그대로 둔다 (2026-10-18)
    case "requestSummary": {
      const text = String(action.text || "").replace(/\s+/g, " ").trim().slice(0, 120);
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id && !CLOSED_REQ.includes(r.status) ? { ...r, summary: text ? { text, by: String(action.by || "").slice(0, 30), at: nowOf(action) } : null } : r
        ),
      };
    }
    // 관제가 새 해주세요를 봤다 — 승인은 담당 컨시어지가 하고, 관제는 확인만 한다 (2026-10-14 현장 '기본 로직' 5번)
    case "opsAckRequest":
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.id && !r.opsAck ? { ...r, opsAck: { at: nowOf(action), by: String(action.by || "관제").slice(0, 30) } } : r)),
      };
    case "addReview":
      return { ...state, reviews: [{ id: idOf("rv", action), at: nowOf(action), ...action.payload }, ...state.reviews] };
    // 동행 후기 고치기 · 지우기 (2026-10-18) — 쓴 사람의 의견이라 증명 기록이 아니다. 고치면 이전 글은 prev 에, 지우면 감사로그에 글이 남는다
    case "editReview": {
      const text = String(action.text || "").replace(/\s+/g, " ").trim().slice(0, 500);
      if (!text) return state;
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.id && r.text !== text ? { ...r, text, editedAt: nowOf(action), prev: [{ text: r.text, at: r.editedAt || r.at }, ...(r.prev || [])].slice(0, 5) } : r
        ),
      };
    }
    case "removeReview":
      return { ...state, reviews: state.reviews.filter((r) => r.id !== action.id) };
    // 지난 동행 점수 (2026-10-18) — 화면에만 있어서 새로고침하면 다시 물었다. 보호자가 고칠 수 있고 이전 점수는 prev 에 남는다.
    // forSentAt — 어느 동행 리포트에 매긴 점수인지 (새 동행 리포트가 오면 다시 묻는다)
    case "rateEscort": {
      const score = Math.round(Number(action.score));
      if (!Number.isFinite(score) || score < 0 || score > 10) return state;
      const old = state.escort?.rating;
      const rating = {
        score,
        reason: score <= 6 ? String(action.reason || "").slice(0, 40) || null : null,
        at: nowOf(action),
        by: String(action.by || "보호자").slice(0, 30),
        forSentAt: state.escort?.sentAt || null,
        prev: old && old.forSentAt === (state.escort?.sentAt || null) ? [{ score: old.score, reason: old.reason, at: old.at }, ...(old.prev || [])].slice(0, 5) : [],
      };
      return { ...state, escort: { ...(state.escort || {}), rating } };
    }
    // 동의 철회 · 다시 동의 (2026-10-18 · lib/lifecycle.js CONSENT_WITHDRAW) — 접수 즉시 효력. 파기 여부는 따로 고른다 (철회 ≠ 자동 파기).
    // 방문 영상 동의는 가입 상담의 videoConsent 와 같은 값이라 같이 바꾼다 (컨시어지 바디캠 화면이 그 값을 본다)
    case "setConsent": {
      const k = String(action.k || "").slice(0, 60);
      if (!k) return state;
      const at = nowOf(action);
      const by = String(action.by || "보호자").slice(0, 30);
      const rec = action.on ? { on: true, at, by } : { on: false, at, by, purge: action.purge === "delete" ? "delete" : "keep" };
      const video = /^방문기록 영상/.test(k) && state.onboarding ? { onboarding: { ...state.onboarding, videoConsent: !!action.on } } : {};
      return { ...state, ...video, guardian: { ...state.guardian, consents: { ...(state.guardian?.consents || {}), [k]: rec } } };
    }
    case "addOrder":
      return { ...state, orders: [{ id: idOf("od", action), at: nowOf(action), ...action.payload }, ...state.orders] };
    case "addMyHospital": {
      const p = cleanHospital(action.payload);
      if (!p.name) return state;
      return { ...state, myHospitals: [...state.myHospitals, { id: idOf("mh", action), at: action.payload?.at || nowOf(action), ...p }] };
    }
    // 다니시던 병원 고치기 · 지우기 (2026-10-18) — 보호자가 적어 둔 메모라 증명 기록이 아니다.
    // 이미 잡힌 일정 · 해주세요는 병원 이름을 글로 갖고 있어서 여기서 지워도 그대로 남는다.
    case "editMyHospital": {
      const p = cleanHospital(action.patch);
      if (!p.name) return state;
      return { ...state, myHospitals: state.myHospitals.map((h) => (hospitalKey(h) === action.key ? { ...h, id: h.id || idOf("mh", action), ...p, editedAt: nowOf(action) } : h)) };
    }
    case "removeMyHospital":
      return { ...state, myHospitals: state.myHospitals.filter((h) => hospitalKey(h) !== action.key) };
    // 복지혜택 진행상태 — 관제·보호자·컨시어지 누가 바꿔도 같은 값 (lib/welfare.js WELFARE_STATUS)
    case "welfareStatus":
      return {
        ...state,
        welfare: {
          ...state.welfare,
          status: { ...state.welfare.status, [action.id]: { status: action.status, at: nowOf(action), by: action.by || "" } },
        },
      };
    // 보호자가 미확인 항목에 답한다 — 답이 바뀌면 자동판정이 바뀐다. 값이 없으면(모름) 답을 지워 다시 미확인으로 (2026-10-18)
    case "welfareAnswer": {
      const answers = { ...state.welfare.answers };
      if (action.value == null || action.value === "") delete answers[action.key];
      else answers[action.key] = action.value;
      return { ...state, welfare: { ...state.welfare, answers } };
    }
    case "guardianPatch":
      return { ...state, guardian: { ...state.guardian, ...action.patch } };
    // 보호자가 어르신 음성을 들었다 — 그 한 건만 켠다. 전에는 들은 표시 전체를 덮어써서, 다른 보호자 폰의 저장이 다시 들어오면
    // 이 폰에서 들은 표시가 '새'로 돌아갔다 (2026-10-26 점검)
    case "guardianHeard":
      if (!action.id) return state;
      return { ...state, guardian: { ...state.guardian, voiceHeard: { ...(state.guardian?.voiceHeard || {}), [action.id]: true } } };
    case "setProductImage": {
      // null 이면 삭제 — 기본 아이콘 썸네일로 돌아간다
      const next = { ...state.productImages };
      if (action.dataUrl) next[action.id] = action.dataUrl;
      else delete next[action.id];
      return { ...state, productImages: next };
    }
    // 테스트 가구에서 누르면 데모 목데이터가 아니라 빈 기록으로 돌아간다 (Provider 가 fresh 를 붙인다)
    case "reset":
      return action.fresh ? (action.center ? centerFreshState() : freshState()) : DEFAULT;
    // 저장소에서 읽은 값으로 통째로 바꾼다 — base 위에 hydrate 규칙(형태 검증)으로 얹는다
    case "replace":
      return reducer(action.base || DEFAULT, { type: "hydrate", payload: action.payload || {} });
    // 이미 계산해 둔 상태로 바꾼다 (서버 충돌 뒤 다시 쌓은 결과)
    case "set":
      return action.state || state;
    default:
      return state;
  }
}

const Ctx = createContext(null);
const SyncCtx = createContext({ mode: "demo", status: "idle" });

const readLocal = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null; // 손상된 저장값은 무시
  }
};

// 서버 상태에는 `_ops`(이미 들어간 동작 번호 목록)가 같이 실린다. 화면 상태에는 싣지 않고 따로 든다 —
// 응답을 못 받아 같은 동작을 다시 보내도 두 번 들어가지 않게 하는 표식이다.
const stripOps = (s) => {
  if (!s || typeof s !== "object") return {};
  const { _ops, ...rest } = s; // eslint-disable-line no-unused-vars
  return rest;
};
const opsOf = (s) => (s && Array.isArray(s._ops) ? s._ops : []);
// 서버에서 받은 상태를 화면용으로 — 빈 기록 위에 형태 검증을 거쳐 얹는다
const fromServer = (payload, household) => reducer(freshFor(household), { type: "hydrate", payload: stripOps(payload) });
// 서버가 가구 기록에 동작을 직접 반영할 때 (결제 승인 — lib/pay-server.js applyPaidToHousehold). 화면과 같은 규칙(reducer)으로 바꾸고,
// 서버 상태의 _ops(이미 들어간 화면 동작 번호)는 그대로 둔다 — 결제한 폰이 같은 동작을 보내도 주문번호로 걸러 두 번 들어가지 않는다
export function applyToServerState(raw, household, actions) {
  const next = actions.reduce((acc, a) => reducer(acc, a), fromServer(raw, household));
  return { ...next, _ops: opsOf(raw) };
}

const POLL_ACTIVE_MS = 4000; // 누군가 만지고 있을 때 — 다른 폰이 바꾼 것을 4초 안에
const POLL_IDLE_MS = 10000; // 2분 넘게 손대지 않은 화면은 10초마다 (켜 둔 화면이 서버를 계속 두드리지 않게)
const ACTIVE_WINDOW_MS = 120000;
const SAVE_DELAY_MS = 400; // 연달아 누른 것을 한 번에 보낸다
const MAX_OPS = 300; // 서버에 남겨 두는 최근 동작 번호 수

const newOpId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
// 이 기기에 남겨 두는 것 (테스트 가구별) — 보내지 못한 동작 · 마지막으로 받은 서버 상태
// 보내지 못한 동작은 계정별로 — 가구별 한 칸이면 한 폰을 둘이 쓸 때 앞사람이 못 보낸 동작이 다음에 로그인한 사람 이름으로
// 저장됐다 (2026-10-26 점검). 예전 한 칸(-v1)은 처음 한 번 읽고 지운다
const pendingKey = (hh, uid) => `kcare-acct-pending-${hh}-${uid || "-"}-v2`;
const legacyPendingKey = (hh) => `kcare-acct-pending-${hh}-v1`;
const cacheKey = (hh) => `kcare-acct-cache-${hh}-v1`;
const writeLocal = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    /* 용량 초과 등 — 이 기기 보관은 보조 수단이라 조용히 넘어간다 */
  }
};
const savePending = (hh, uid, list) => hh && writeLocal(pendingKey(hh, uid), list.length ? list : null);
const saveCache = (hh, state, version) => hh && state && writeLocal(cacheKey(hh), { version, state });

export function AppStateProvider({ children }) {
  const auth = useAuth();
  // 저장소를 읽는 동안의 빈 화면 색 — 어르신 화면은 밝은 바탕 · 밝은 스플래시라 같은 색으로 (남색이 번쩍이지 않게).
  // 보호자 화면은 남색 스플래시(components/Splash.jsx)로 이어지므로 남색 그대로 둔다.
  const lightShell = /^\/elder(\/|$)/.test(useRouter().pathname);
  const household = auth.user?.household || null;
  // 관제 PC 는 창이 다른 창에 가려져도(브라우저가 '숨김'으로 본다) 계속 가져온다 — SOS 팝업 · 알림음이
  // 창을 앞으로 꺼내야만 뜨면 늦는다 (2026-10-02 QA "관제 화면을 열어 둔 채 1분 넘게 새 요청이 안 뜸")
  const keepPollingHidden = auth.user?.role === "ops";
  const keepRef = useRef(keepPollingHidden);
  keepRef.current = keepPollingHidden;
  // 세션을 아직 모르면 아무것도 읽지 않는다 — 데모 상태를 잠깐 보여 줬다가 바꾸지 않게
  const scope = auth.status === "loading" ? null : household ? `acct:${household}` : "demo";

  const [state, rawDispatch] = useReducer(reducer, DEFAULT);
  // 목 데이터가 현재 시각 기준이라 서버 프리렌더와 클라이언트가 어긋난다.
  // 마운트 후 렌더로 하이드레이션 불일치를 차단한다 · 저장소를 다 읽은 뒤에 화면을 연다.
  const [ready, setReady] = useState(false);
  // sync.mode: "demo" | "local"(테스트 계정 · 서버 설정 전) | "server"
  const [sync, setSync] = useState({ mode: "demo", status: "idle", savedAt: null, error: null });
  const [dirty, setDirty] = useState(0);
  // 관제 센터 공간 — 그 센터 회원 이름 · 역할 (화면의 어르신 · 보호자 · 컨시어지 이름 · lib/people.js)
  const [centerPeople, setCenterPeople] = useState(null);

  // 서버로 보낼 상태 — 화면이 다시 그려지기를 기다리지 않고, 내 동작 · 받은 서버 상태를 그 자리에서 반영한다.
  // 전에는 그려질 때만 바뀌어, 충돌(409) 직후 바로 다시 보내면(flushNow — 결제창 · 로그아웃 직전) 충돌 전 상태가 올라가
  // 다른 폰이 방금 저장한 것(결제 기록 · SOS 등)을 지웠다 (2026-10-26 점검). 서버 저장 모드에서만 쓴다
  const stateRef = useRef(state);
  const showState = useCallback((next) => {
    stateRef.current = next;
    rawDispatch({ type: "set", state: next });
  }, []);
  const scopeRef = useRef(null);
  const householdRef = useRef(null);
  const accountRef = useRef(null); // 로그인한 계정 id — 보내지 못한 동작을 계정별로 둔다
  accountRef.current = auth.user?.id || null;
  const backendRef = useRef("local");
  const storeKeyRef = useRef(KEY);
  const versionRef = useRef(0);
  const opsRef = useRef([]); // 서버 상태에 이미 들어간 동작 번호
  const pendingRef = useRef([]); // 서버에 아직 안 들어간 동작 — 충돌하면 서버 상태 위에 다시 쌓는다
  const savingRef = useRef(false);
  const retryRef = useRef(0);
  const lastActiveRef = useRef(Date.now());
  const peopleAtRef = useRef(Date.now());
  // 관제가 이 아이디를 정지 · 거절 · 역할 변경했다 — 저장 · 확인을 멈춘다 (계속 보내도 401 만 돌아온다 · 2026-10-06 UX 점검)
  const blockedRef = useRef(false);

  // 화면이 쓰는 dispatch — 서버 저장 중이면 동작에 번호를 붙여 모아 두었다가 함께 보낸다.
  // 모은 것은 이 기기에도 적어 둔다 — 보내기 전에 새로고침하거나 끊겨도 잃지 않게.
  const dispatch = useCallback((action) => {
    let a = action;
    if (scopeRef.current?.startsWith("acct:") && a.type === "reset") a = { ...a, fresh: true, center: isCenterHousehold(householdRef.current) };
    if (backendRef.current === "server") {
      // 같은 번호를 화면에도 쓴다 — 나중에 충돌로 다시 쌓아도 id·시각이 그대로다
      a = { ...a, _at: Date.now(), _op: newOpId() };
      pendingRef.current.push(a);
      savePending(householdRef.current, accountRef.current, pendingRef.current);
      // 보낼 상태에도 바로 — 같은 번호 · 시각이라 화면 상태와 같은 결과다
      stateRef.current = reducer(stateRef.current, a);
      setDirty((d) => d + 1);
    }
    rawDispatch(a);
  }, []);

  // 저장소 고르기 — 로그인·로그아웃하면 다시 읽는다
  useEffect(() => {
    if (!scope || scope === scopeRef.current) return undefined;
    let cancelled = false;
    setReady(false);
    pendingRef.current = [];
    versionRef.current = 0;
    opsRef.current = [];
    retryRef.current = 0;
    blockedRef.current = false;
    householdRef.current = household;
    // 다른 센터 · 계정으로 바뀌면 앞 공간의 회원 이름을 들고 가지 않는다 (2026-10-06 점검)
    setCenterPeople(null);
    setStorageScope(scope === "demo" ? null : household);

    const loadLocal = (key, base, mode, error = null) => {
      backendRef.current = "local";
      storeKeyRef.current = key;
      rawDispatch({ type: "replace", base, payload: readLocal(key) });
      setSync({ mode, status: "idle", savedAt: null, error });
    };

    (async () => {
      if (scope === "demo") {
        loadLocal(KEY, DEFAULT, "demo");
      } else {
        let res = null;
        let body = {};
        try {
          res = await fetch("/api/household", { cache: "no-store" });
          body = await res.json().catch(() => ({}));
        } catch (_) {
          res = null;
        }
        if (cancelled) return;
        if (res && res.status === 503 && body.error === "db-not-configured") {
          // 서버 저장 설정 전 — 이 기기에만 (데모와 섞이지 않게 계정 가구별 칸)
          loadLocal(acctKey(household), freshFor(household), "local", "db-not-configured");
        } else {
          // 서버 저장. 첫 읽기가 실패해도(끊김 · 일시 오류) 서버 모드로 연다 — 마지막으로 받아 둔 상태를
          // 보여 주고, 누른 것은 모아 두었다가 연결되면 보낸다 (다음 확인에서 최신을 받는다).
          backendRef.current = "server";
          const cached = readLocal(cacheKey(household));
          const base = res?.ok ? body.state : cached?.state || null;
          versionRef.current = res?.ok ? body.version || 0 : cached?.version || 0;
          opsRef.current = opsOf(base);
          // 이 기기에서 보내지 못한 동작 — 서버에 이미 들어간 것은 빼고 다시 쌓는다
          const saved = readLocal(pendingKey(household, accountRef.current));
          const legacy = readLocal(legacyPendingKey(household));
          if (legacy != null) writeLocal(legacyPendingKey(household), null);
          const carried = [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(saved) ? saved : [])].filter(
            (a) => a && typeof a.type === "string" && a.type !== "init" && !opsRef.current.includes(a._op)
          );
          if (res?.ok && Array.isArray(body.people)) setCenterPeople(body.people);
          const next = carried.reduce((acc, a) => reducer(acc, a), base ? fromServer(base, household) : freshFor(household));
          showState(next);
          // 처음 들어온 가구 — 빈 기록으로 만들어 서버에 한 번 저장한다
          pendingRef.current = res?.ok && !base ? [{ type: "init", _at: Date.now(), _op: newOpId() }, ...carried] : carried;
          savePending(household, accountRef.current, pendingRef.current);
          if (res?.ok && base) saveCache(household, base, versionRef.current);
          if (pendingRef.current.length) setDirty((d) => d + 1);
          const err = res?.ok ? null : body.error || (res ? `http-${res.status}` : "network");
          if (res?.status === 401 && ACCOUNT_NOTICE[err]) blockedRef.current = true;
          setSync({
            mode: "server",
            status: err ? "error" : "saved",
            savedAt: res?.ok && body.updatedAt ? Date.parse(body.updatedAt) : null,
            error: err,
            area: body.area || null,
          });
        }
      }
      if (cancelled) return;
      scopeRef.current = scope;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, household, showState]);

  // 이 기기에 저장 (데모 · 서버 설정 전 테스트 계정)
  useEffect(() => {
    if (!ready || backendRef.current !== "local") return;
    try {
      localStorage.setItem(storeKeyRef.current, JSON.stringify(state));
    } catch (_) {
      /* 저장 실패는 화면 동작에 영향 없음 */
    }
  }, [state, ready]);

  // 서버에 저장 — 버전이 맞을 때만 덮어쓴다. 다른 폰이 먼저 바꿨으면(409) 그 상태 위에 내 동작 중
  // 아직 안 들어간 것만 다시 쌓아서 보낸다. 누른 것만으로 '저장됨'이 되지 않는다 — 서버 응답을 받아야 한다.
  const flush = useCallback(async ({ keepalive = false } = {}) => {
    if (backendRef.current !== "server" || blockedRef.current || savingRef.current || pendingRef.current.length === 0) return;
    savingRef.current = true;
    const hh = householdRef.current;
    const sent = pendingRef.current.slice();
    const ops = [...opsRef.current, ...sent.map((a) => a._op).filter(Boolean)].slice(-MAX_OPS);
    const snapshot = { ...stateRef.current, _ops: ops };
    const body = JSON.stringify({
      baseVersion: versionRef.current,
      state: snapshot,
      actions: sent.filter((a) => a.type !== "init"),
    });
    setSync((s) => ({ ...s, status: "saving" }));
    let again = false;
    // 저장이 15초 넘게 멈추면 끊고 다시 보낸다 — 전에는 멈춘 저장 하나가 뒤의 저장 · 확인을 모두 막았다 (2026-10-26 점검).
    // 서버에 이미 들어갔으면 다시 보낼 때 409 로 오고, 들어간 동작은 _ops 로 걸러져 두 번 들어가지 않는다
    const ctl = !keepalive && typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 15000) : null;
    try {
      const res = await fetch("/api/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: keepalive && body.length < 60000,
        ...(ctl ? { signal: ctl.signal } : {}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        versionRef.current = j.version;
        opsRef.current = ops;
        pendingRef.current = pendingRef.current.slice(sent.length);
        savePending(hh, accountRef.current, pendingRef.current);
        saveCache(hh, snapshot, j.version);
        retryRef.current = 0;
        setSync((s) => ({ ...s, status: "saved", savedAt: Date.now(), error: null }));
        again = pendingRef.current.length > 0;
      } else if (res.status === 409 && j.error === "conflict") {
        // 서버 상태 + 내 동작 중 아직 안 들어간 것 → 다시 보낸다
        // (응답만 못 받았던 저장은 서버의 _ops 에 이미 있으니 여기서 빠진다 — 중복 없음)
        const serverOps = opsOf(j.state);
        const mine = pendingRef.current.filter((a) => a.type !== "init" && !serverOps.includes(a._op));
        const next = mine.reduce((acc, a) => reducer(acc, a), fromServer(j.state, hh));
        versionRef.current = j.version || 0;
        opsRef.current = serverOps;
        pendingRef.current = j.state ? mine : [{ type: "init", _at: Date.now(), _op: newOpId() }, ...mine];
        savePending(hh, accountRef.current, pendingRef.current);
        if (j.state) saveCache(hh, j.state, versionRef.current);
        showState(next);
        again = pendingRef.current.length > 0;
        setSync((s) => ({ ...s, status: again ? "saving" : "saved", error: null }));
      } else {
        // 다시 보내도 소용없는 오류 — 로그인 만료(401) · 잘못된 요청(400) · 용량 초과(413).
        // 되풀이하지 않고 안내만 띄운다 (로그인하면 다시 읽으면서 모아 둔 것을 보낸다).
        const code = j.error || (res.status === 413 ? "state-too-large" : `http-${res.status}`);
        const permanent = res.status === 401 || res.status === 400 || res.status === 413;
        if (res.status === 401 && ACCOUNT_NOTICE[code]) blockedRef.current = true;
        throw Object.assign(new Error("save-failed"), { code, permanent, area: j.area || null });
      }
    } catch (e) {
      retryRef.current += 1;
      setSync((s) => ({ ...s, status: "error", error: e.code || "network", area: e.area || null }));
      if (!e.permanent) {
        // 3초 · 6초 · 12초 … 최대 30초 간격으로 다시 보낸다 (동작은 버리지 않는다)
        const wait = Math.min(30000, 3000 * 2 ** (retryRef.current - 1));
        setTimeout(() => setDirty((d) => d + 1), wait);
      }
    } finally {
      if (timer) clearTimeout(timer);
      savingRef.current = false;
    }
    if (again) setDirty((d) => d + 1);
  }, [showState]);

  // 지금 모인 것을 다 보낼 때까지 기다린다 — 결제창으로 떠나기 전 · 로그아웃 전
  const flushNow = useCallback(async () => {
    for (let i = 0; i < 6; i++) {
      if (backendRef.current !== "server" || pendingRef.current.length === 0) return true;
      if (savingRef.current) await new Promise((r) => setTimeout(r, 250));
      else await flush();
    }
    return pendingRef.current.length === 0;
  }, [flush]);

  useEffect(() => {
    if (!ready || backendRef.current !== "server" || pendingRef.current.length === 0) return undefined;
    const t = setTimeout(() => flush(), SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [dirty, ready, flush]);

  // 화면을 떠나거나 백그라운드로 가면 기다리지 않고 바로 보낸다
  useEffect(() => {
    if (!ready || sync.mode !== "server") return undefined;
    const onHide = () => {
      if (document.visibilityState === "hidden") flush({ keepalive: true });
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [ready, sync.mode, flush]);

  // 같은 가구의 다른 폰이 바꾼 것 가져오기 — 내가 보낼 것이 없을 때만 (보낼 게 있으면 충돌 처리가 맡는다).
  // 만지고 있으면 4초, 2분 넘게 가만히 있으면 10초, 화면이 꺼져 있으면 쉬고 켜지는 순간 바로 본다.
  useEffect(() => {
    if (!ready || sync.mode !== "server") return undefined;
    let stopped = false;
    let lastPoll = 0;
    const mark = () => {
      lastActiveRef.current = Date.now();
    };
    const tick = async (force = false) => {
      if (stopped || blockedRef.current || (document.hidden && !keepRef.current) || savingRef.current || pendingRef.current.length) return;
      const idle = document.hidden || Date.now() - lastActiveRef.current > ACTIVE_WINDOW_MS;
      if (!force && idle && Date.now() - lastPoll < POLL_IDLE_MS) return;
      lastPoll = Date.now();
      // 읽는 동안 내 저장이 끝나 버전이 올라갔으면 이 응답은 그보다 옛것이다 — 버린다.
      // 받으면 화면이 잠깐 내 동작 전으로 돌아가고 버전도 뒤로 간다 (2026-10-02 코드 점검).
      const askedAt = versionRef.current;
      try {
        // 센터 공간은 1분에 한 번 회원 이름도 같이 묻는다 — 새로 가입 · 승인된 사람이 화면 이름에 들어오게
        const withPeople = isCenterHousehold(householdRef.current) && Date.now() - peopleAtRef.current > 60000;
        const res = await fetch(`/api/household?v=${askedAt}${withPeople ? "&people=1" : ""}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(j.people)) {
          peopleAtRef.current = Date.now();
          setCenterPeople(j.people);
        }
        if (stopped || versionRef.current !== askedAt) return;
        if (!res.ok) {
          // 관제가 정지 · 역할 변경한 회원은 그 이유를 그대로 (account-suspended · role-changed …)
          if (res.status === 401) {
            if (ACCOUNT_NOTICE[j.error]) blockedRef.current = true;
            setSync((s) => ({ ...s, status: "error", error: j.error || "login-required", area: j.area || null }));
          }
          return;
        }
        if (savingRef.current || pendingRef.current.length) return;
        // 버전이 다르면 서버 것을 받는다 — 작아진 경우도(관리자가 SQL 로 가구를 지워 처음부터 다시 시작)
        if (j.changed && j.version !== versionRef.current) {
          versionRef.current = j.version;
          opsRef.current = opsOf(j.state);
          if (j.state) saveCache(householdRef.current, j.state, j.version);
          showState(j.state ? fromServer(j.state, householdRef.current) : freshFor(householdRef.current));
          setSync((s) => ({ ...s, status: "saved", error: null, remoteAt: Date.now(), remoteBy: j.updatedBy || null }));
        } else {
          // 연결이 돌아왔다 — 첫 읽기 실패로 켜져 있던 안내를 내린다
          setSync((s) => (s.status === "error" ? { ...s, status: "saved", error: null } : s));
        }
      } catch (_) {
        /* 다음 차례에 다시 본다 */
      }
    };
    const id = setInterval(() => tick(), POLL_ACTIVE_MS);
    const onFocus = () => {
      mark();
      tick(true);
    };
    const ACTIVITY = ["pointerdown", "keydown", "touchstart"];
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    ACTIVITY.forEach((ev) => window.addEventListener(ev, mark, { passive: true }));
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      ACTIVITY.forEach((ev) => window.removeEventListener(ev, mark));
    };
  }, [ready, sync.mode, showState]);

  const syncValue = useMemo(() => ({ ...sync, household, flush: flushNow }), [sync, household, flushNow]);

  // 화면이 그리기 전에 이 공간의 사람 이름을 맞춘다 — 데모 · 테스트 가구 1 은 예전 이름, 센터 공간은 회원 이름
  // 센터 공간의 주 · 부 담당은 관제가 정한 값(state.elderStaff)을 따른다 — 새 해주세요가 바뀐 주 담당에게 간다 (2026-10-28 요청 3)
  if (ready) applyPeople(peopleFor(scopeRef.current?.startsWith("acct:") ? household : null, centerPeople, state.onboarding, state.elderStaff?.[STAFF_LIVE]));

  return (
    <Ctx.Provider value={{ state, dispatch }}>
      <SyncCtx.Provider value={syncValue}>
        {ready ? (
          <>
            {children}
            <SyncNotice sync={syncValue} />
          </>
        ) : (
          <div className={lightShell ? "min-h-screen bg-[#F8F7F4]" : "min-h-screen bg-nav"} />
        )}
      </SyncCtx.Provider>
    </Ctx.Provider>
  );
}

// 저장이 안 되고 있을 때 어느 화면에서든 보이는 안내 — 누른 것이 서버에 안 들어가는 걸 모르고
// 테스트를 이어 가지 않게. 빨강은 위험 신호 전용이라 주황(amber)으로.
// 관제가 회원을 정지 · 거절 · 역할 변경했을 때 — 화면 전체를 막고 갈 곳 하나만 준다 (2026-10-06 UX 점검:
// 전에는 '로그인이 만료됐어요' 띠만 떠서 로그인 화면과 앱 사이를 맴돌았고, 누른 것은 조용히 저장되지 않았다)
const ACCOUNT_NOTICE = {
  "account-suspended": { title: "이 아이디는 사용이 멈춰졌습니다", body: (c) => `${c} 관제가 이 아이디의 사용을 멈췄습니다. 지금부터 누른 것은 저장되지 않습니다. 센터 관제에 문의해 주세요.` },
  "account-rejected": { title: "쓸 수 없는 아이디입니다", body: (c) => `${c} 관제가 이 가입을 받지 않았습니다. 센터 관제에 문의해 주세요.` },
  "account-removed": { title: "아이디를 찾을 수 없습니다", body: (c) => `${c}에 이 아이디가 없습니다. 센터 관제에 문의해 주세요.` },
  "account-pending": { title: "관제 승인을 기다리는 아이디입니다", body: (c) => `${c} 관제가 승인하면 다시 로그인해 주세요.` },
  "role-changed": { title: "관제가 역할을 바꿨습니다", body: () => "다시 로그인하면 바뀐 역할의 화면으로 들어갑니다. 지금 화면에서 누른 것은 저장되지 않습니다." },
};

function SyncNotice({ sync }) {
  const { user } = useAuth();
  if (sync.mode !== "server" || sync.status !== "error") return null;
  const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  const loginAt = AREAS[areaOfRole(user?.role)]?.login || "/login";
  const notice = ACCOUNT_NOTICE[sync.error];
  if (notice) {
    const centerName = centerOfHousehold(sync.household)?.name || "센터";
    // 역할이 바뀌면 바뀐 역할의 입구로 — 아이디를 채워서 보낸다
    const area = sync.error === "role-changed" ? AREAS[sync.area] : null;
    const idq = user?.id ? `&id=${encodeURIComponent(user.id)}` : "";
    const go = area ? `${area.login}?tab=member${idq}` : `${loginAt}?tab=member${idq}`;
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(8,23,45,.6)] p-4">
        <div role="alertdialog" aria-modal="true" aria-labelledby="acct-block-title" className="w-full max-w-[400px] rounded-[22px] bg-white p-6 shadow-xl" style={{ borderTop: "6px solid #B08D57" }}>
          <h2 id="acct-block-title" className="text-[19px] font-black leading-[1.4] text-navy">{notice.title}</h2>
          <p className="mt-2 text-[15px] leading-[1.7] text-ink">{notice.body(centerName)}</p>
          <button
            type="button"
            autoFocus
            onClick={() => logout(go)}
            className="btn-press mt-5 w-full rounded-xl bg-navy py-3.5 text-[16px] font-bold text-white"
          >
            {area ? `${area.label} 로그인으로 다시 들어가기` : "로그아웃"}
          </button>
        </div>
      </div>
    );
  }
  const text =
    sync.error === "login-required"
      ? "로그인이 만료됐어요. 다시 로그인하면 모아 둔 것을 이어서 저장합니다."
      : sync.error === "schema-missing"
        ? "서버 저장 설정을 확인해야 해요 (표 없음). 누른 것은 이 기기에 모아 둡니다."
        : sync.error === "state-too-large"
          ? "저장할 내용이 너무 커졌어요 (스토어 사진 등). 관리자에게 알려 주세요."
          : sync.error === "invalid-request"
            ? "저장 요청이 거절됐어요. 새로고침한 뒤 다시 해 주세요."
            : "저장이 안 되고 있어요. 연결되면 모아 둔 것을 자동으로 보냅니다.";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-2 z-[70] flex w-max max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full border border-amber/40 bg-[#FFF7E8] px-4 py-2 text-[13px] font-bold leading-[1.5] text-amber shadow-lg"
    >
      <span aria-hidden className="h-[7px] w-[7px] shrink-0 animate-pulse rounded-full bg-amber" />
      <span>{text}</span>
      {sync.error === "login-required" && (
        // 테스트 가구는 '베타 테스트 계정' 탭으로 — 영역 입구 · 기본 탭은 가입한 아이디 로그인이라 헤맨다 (2026-10-19 점검 L-20)
        <a
          href={`${isCenterHousehold(sync.household) ? `${loginAt}?` : "/login?tab=test&"}callbackUrl=${encodeURIComponent(here)}`}
          className="tap shrink-0 underline underline-offset-2"
        >
          로그인
        </a>
      )}
    </div>
  );
}

export function useAppState() {
  return useContext(Ctx);
}

// 저장 상태 — { mode: demo|local|server, status: idle|saving|saved|error, savedAt, error, household, flush }
export function useSync() {
  return useContext(SyncCtx);
}

// 어디에 저장되는지 한 줄 — 로그인 화면 · 시연 허브 · 마이 탭
export function storageText(sync) {
  if (sync.mode === "server") {
    if (sync.status === "error") {
      if (ACCOUNT_NOTICE[sync.error]) return `저장 멈춤 — ${ACCOUNT_NOTICE[sync.error].title}`;
      return sync.error === "login-required"
        ? "로그인이 만료됐습니다 — 다시 로그인하면 이어서 저장됩니다"
        : "서버 저장 재시도 중 — 연결을 확인해 주세요";
    }
    const at = sync.savedAt ? new Date(sync.savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
    return `서버에 저장 (Supabase)${at ? ` · 마지막 저장 ${at}` : ""}`;
  }
  if (sync.mode === "local") {
    return sync.error && sync.error !== "db-not-configured"
      ? `서버 저장 오류 (${sync.error}) — 지금은 이 기기에만 저장`
      : "이 기기에만 저장 — 서버 저장 설정 전";
  }
  return "데모 (시뮬레이션) — 이 브라우저에만 저장";
}

// 결제권한 판정(REQ-07 · 어르신 하루 누적 한도 → 보호자 승인)은 2026-10-22에 없앴다 — 한 가족 그룹(어르신 · 주 보호자 ·
// 부 보호자)이면 누구나 금액 제한 없이 결제한다. 예전 기록의 paymentMode · limitAmount 는 남아 있지만 쓰지 않는다.

// 누가 어떤 일정을 보나 — 관제 승인 전 · 반려된 일정이 확정된 것처럼 보이면 안 된다.
// 보호자: 전부 (캘린더가 '승인 대기 · 반려' 칩을 단다). 어르신: 확정된 것 + 본인이 남긴 승인 대기 · 반려 건
// ('관제 확인 중' · '관제에서 다시 연락드립니다'로 표시 — 말없이 사라지지 않게). 그 밖(컨시어지 · 집계): 확정된 것만.
// 확정된 일정을 고쳐 관제가 다시 보는 중(reapproval)이면 — 보호자 말고는 아직 바뀌기 전의 확정 값(prevApproved)을 본다.
// 고친 쪽 말고는 '변경 확인 중'인 원래 약속이 그대로 유효하다 (전에는 어르신 달력에서 통째로 사라졌다 · 2026-10-19 점검 L-07)
export function eventsFor(events, who) {
  // 확정 뒤 고친 것(재승인 대기)은 고친 쪽(reBy)이 새 내용을, 나머지는 원래 확정 내용을 본다 — 만든 쪽(by)으로 정하면
  // 보호자가 옮긴 어르신 일정이 어르신에게 승인 전 새 시각으로 보였다 (2026-10-26 점검)
  const mine = (e) => (e.reapproval && e.reBy ? e.reBy : e.by) === "elder";
  return (events || [])
    .map((e) => (e.approval === "pending" && e.reapproval && e.prevApproved && who !== "guardian" && !(who === "elder" && mine(e)) ? { ...e, ...e.prevApproved, approval: "approved", changePending: true } : e))
    .filter((e) => {
      if (!e.approval || e.approval === "approved") return true;
      if (who === "guardian") return true;
      if (who === "elder") return mine(e) && (e.approval === "pending" || e.approval === "rejected");
      return false;
    });
}
