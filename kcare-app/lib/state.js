import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
// mock.js 가 아니라 seed.js 에서 가져온다 — state 는 _app 에서 import 되므로
// 여기서 mock.js 를 참조하면 콘솔 목데이터 전체가 모든 페이지에 실린다 (seed.js 주석 참고).
import { INITIAL_EVENTS, INITIAL_REQUESTS, SEED_EVENTS, SEED_ORDERS, SEED_REPORTS } from "./seed";
import { PRICING } from "./config";
import { approverOf, cancelRule, paymentOf, transition } from "./requests";
import { SEED_VISIT, advance } from "./workflow";
import { useAuth } from "./auth";
import { setStorageScope } from "./scope";
import { cleanMedSlot } from "./meds";

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
  // 병원 동행 기록 — 컨시어지 '동행 기록 저장' → '리포트 제출' → 관제 '보호자 리포트 발송' → 보호자 홈 · 마이 '동행 리포트' (2026-10-02).
  // 녹화 여부는 컨시어지가 직접 체크한 값 그대로다 (없는 영상을 있다고 하지 않는다).
  escort: { note: "", photos: 0, recorded: false, by: "", savedAt: null, sentAt: null, viewedAt: null },
  // 관제 연락 — 컨시어지 '관제에 알리기'. 관제가 확인(·답장)하면 컨시어지 화면에 그대로 보인다 (2026-10-02).
  opsMessages: [],
  // 스토어 상품 이미지 — 경영 콘솔에서 올리면 스토어 썸네일이 바뀐다 (실무자 요청).
  // { [상품id]: dataURL }. 업로드 시 320px 로 줄여 저장한다 — localStorage 5MB 한도.
  productImages: {},
  // 방문 업무흐름 8단계 (lib/workflow.js) — 관제·컨시어지·보호자가 같은 건을 본다.
  // 승인(approved) 전에는 어느 캘린더에도 뜨지 않는다는 것이 이 상태의 요점.
  visitPlan: SEED_VISIT,
  // 안부 음성 — 보호자 ↔ 어르신 양방향 (2026-08-12 시트).
  // 데모에서는 오디오를 저장하지 않고 길이·발신자만 기록한다. 실제 구현은 서버 업로드.
  voices: [],
  // 동행 후기 — 동행 점수 아래 보호자가 남기는 코멘트 (2026-08-12 시트 홈 5번)
  reviews: [],
  // 스토어 구매내역 — 보호자 스토어 '구매내역 조회' (2026-08-12 시트 스토어 2번)
  orders: SEED_ORDERS.map((o) => ({ ...o, at: Date.now() - o.daysAgo * 86400000 })),
  // 기존에 다니시던 병원 — 제휴 병원이 아니어도 등록해 둔다 (2026-08-12 시트 예약 3번)
  myHospitals: [],
  // 토스페이먼츠 결제 (2026-09-23) — 승인이 끝난 건만 쌓인다.
  //   payments: [{ id, kind, ref, orderId, orderName, amount, method, card, approvedAt, receiptUrl, status }]
  //   billing:  월 구독 자동결제로 등록한 카드 표기 정보. billingKey 원본은 서버 보관 대상이라 여기 없다.
  payments: [],
  billing: null,
  // 결제창으로 넘어가기 전에 담아 둔 스토어 주문. 승인이 끝나야 orders·requests 로 선다.
  pendingOrder: null,
  // 건강 정보 한 벌 — 복용약 · 질환 · 알레르기 (2026-10-02 QA). null 이면 lib/meds.js 기본값.
  // 관제(어르신 관리 › 건강·질환)와 컨시어지(고객 탭)가 고치고, 어르신 · 보호자 · 관제 · SOS 신고 정보가 읽는다 (healthOf).
  health: null,
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
    demo: { ...DEFAULT.demo, anomaly: "dismissed" },
    events: [],
    requests: [],
    reports: [],
    ticker: [],
    orders: [],
    voices: [],
    reviews: [],
    payments: [],
    myHospitals: [],
    opsMessages: [],
  };
}

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

// ── 해주세요 상태 바꾸기 도우미 (reducer 전용) ──
const CLOSED_REQ = ["done", "cancelled", "rejected"];
const reqTs = (ymd, hm) => Date.parse(`${ymd}T${/^\d{2}:\d{2}$/.test(hm || "") ? hm : "10:00"}:00+09:00`);
// 확정된 해주세요는 캘린더에도 — 보호자 · 어르신 · 컨시어지가 같은 일정을 본다. 취소 · 거절되면 뺀다.
const reqEvent = (r) => ({
  id: `ev-${r.id}`,
  reqId: r.id,
  kind: "request",
  title: `해주세요 · ${r.type}`,
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

function reducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      // 구버전 저장값(슬라이스에 새 키가 없는 형태)과 깊은 병합 — 새 키 기본값 유지.
      // localStorage는 신뢰할 수 없는 입력: 객체·배열 형태를 검증하고 아니면 기본값을 지킨다.
      const p = action.payload && typeof action.payload === "object" ? action.payload : {};
      const arr = (v, fallback) => (Array.isArray(v) ? v : fallback);
      const obj = (v, fallback) => (v && typeof v === "object" && !Array.isArray(v) ? v : fallback);
      return {
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
        reviews: arr(p.reviews, state.reviews),
        orders: arr(p.orders, state.orders),
        myHospitals: arr(p.myHospitals, state.myHospitals),
        payments: arr(p.payments, state.payments),
        billing: p.billing ?? state.billing,
        pendingOrder: p.pendingOrder ?? state.pendingOrder,
        health: obj(p.health, state.health),
      };
    }
    case "completeOnboarding":
      return { ...state, onboarding: action.payload };
    // 가입 뒤 보호자가 바꾸는 것 — 결제권한·한도 (마이 탭 '결제 관리' · 온보딩 문구
    // "가입 후에도 보호자가 변경할 수 있습니다"). 온보딩을 안 거친 데모는 기본값 위에 얹는다.
    case "onboardingPatch":
      return { ...state, onboarding: { ...(state.onboarding || {}), ...action.patch } };
    case "addEvent":
      return { ...state, events: [...state.events, action.payload] };
    case "updateEvent":
      // 보호자 권한: 조회·등록·수정 (REQ-02 권한표)
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e
        ),
      };
    case "setPriority":
      return { ...state, priority: { ...action.payload, setAt: nowOf(action) } };
    // closesVisit — 컨시어지 '리포트 제출'. 오늘 방문의 리포트를 냈다는 표시(visit.reportSent)도 같이 켠다
    // (오늘 탭 '마무리 필요'가 이 값을 본다. 전에는 켜는 곳이 없어서 리포트를 내도 '마무리 필요'가 남았다).
    case "addReport": {
      const { closesVisit, ...report } = action.payload || {};
      return {
        ...state,
        reports: [{ ...report, at: nowOf(action) }, ...state.reports],
        visit: closesVisit ? { ...state.visit, reportSent: true } : state.visit,
      };
    }
    case "addRequest":
      return { ...state, requests: [action.payload, ...state.requests] };
    case "transitionRequest":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? transition(r, action.to, action.note, nowOf(action), action.by ? { by: action.by } : {}) : r
        ),
      };
    // ── 해주세요 승인 · 결제 · 취소 (2026-10-05 결정 — lib/requests.js 머리말) ──
    // 결제가 끝났다 — 승인 전이면 담당 컨시어지 승인 대기로, 이미 승인됐거나(요금 확정 전 항목) 제안을 수락한 것이면 확정으로
    case "requestPaid": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
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
      const proposal = r.dir === "fromConcierge" || r.dir === "fromOps";
      const approved = !!r.approvedAt || proposal;
      const base = approved && !r.approvedAt ? { ...r, approvedAt: at, approvedBy: "보호자" } : r;
      const next = transition(base, approved ? "confirmed" : "requested", action.note || "결제 완료", at, { by: "보호자" });
      return withRequest(state, next, approved);
    }
    // 담당 컨시어지 승인 — 자기 일정을 보고 날짜 · 시간을 정한다. 요금 확정 전 항목은 금액도 여기서 정해 결제로 보낸다
    case "approveRequest": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "requested" || approverOf(r) !== "concierge") return state;
      const at = nowOf(action);
      const by = String(action.by || r.assignee || "");
      const amount = r.amount == null && action.amount !== "" && action.amount != null && Number.isFinite(Number(action.amount)) ? Number(action.amount) : r.amount;
      let payBy = r.payBy || null;
      let to = "confirmed";
      const paid = !!paymentOf(state.payments, r.id) || payBy === "elder";
      if (!paid && amount > 0) {
        if (r.dir === "fromElder" && !needsGuardianApproval(state.onboarding, amount, elderSpentToday(state, at))) payBy = "elder";
        else to = "awaitingPayment";
      }
      const when = `${action.date || ""}${action.time ? ` ${action.time}` : ""}`.trim();
      const base = { ...r, amount, payBy, assignee: by || r.assignee, scheduledDate: action.date || null, scheduledTime: action.time || "", approvedAt: at, approvedBy: by };
      const next = transition(base, to, `${by} 승인${when ? ` · ${when}` : ""}${to === "awaitingPayment" ? ` · 결제 대기 ${amount.toLocaleString("ko-KR")}원` : ""}`, at, { by });
      return withRequest(state, next, to === "confirmed");
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
      let payBy = r.payBy || null;
      let to = "confirmed";
      if (r.amount > 0) {
        if (action.role === "elder" && !needsGuardianApproval(state.onboarding, r.amount, elderSpentToday(state, at))) payBy = "elder";
        else to = "awaitingPayment";
      }
      const next = transition({ ...r, payBy, approvedAt: at, approvedBy: who }, to, `${who} 수락${to === "awaitingPayment" ? " · 보호자 결제 대기" : ""}`, at, { by: who });
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
    case "assignRequest":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? { ...r, assignee: String(action.assignee || "") } : r
        ),
      };
    // 새 SOS 가 켜지면 지난 SOS 의 급파 · 119 · 수락 표시를 지운다 — 남아 있으면 새 SOS 가 처음부터 '급파 · 수락됨'으로 보인다
    case "demo": {
      const p = action.payload || {};
      const freshSos = p.sos === true && !state.demo.sos;
      return {
        ...state,
        demo: { ...state.demo, ...p },
        ops: freshSos ? { ...state.ops, sosDispatched: false, sos119: false, sosAcceptedAt: null, sosAcceptedBy: "" } : state.ops,
      };
    }
    case "elderPatch":
      return { ...state, elder: { ...state.elder, ...action.patch } };
    // 오늘 복약 체크 · 건기식 재구매 — 되돌리지 않는다 (06 §5). 키만 켜 준다.
    case "elderMark":
      return {
        ...state,
        elder: { ...state.elder, [action.key]: { ...state.elder[action.key], [action.id]: true } },
      };
    case "opsPatch":
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
      // SOS 해제 — 관제 전용. 급파·연계 · 컨시어지 수락 플래그도 함께 초기화
      return {
        ...state,
        demo: { ...state.demo, sos: false },
        ops: { ...state.ops, sosDispatched: false, sos119: false, sosAcceptedAt: null, sosAcceptedBy: "" },
      };
    // 컨시어지가 급파를 수락했다 — 관제 SOS 대응과 컨시어지 관리에 같은 시각이 뜬다 (한 번만).
    // 전에는 컨시어지 화면 안에서만 기억해서, 새로고침하면 다시 '수락' 버튼이 떴고 관제는 티커로만 알았다.
    case "sosAccept":
      if (!state.demo.sos || state.ops.sosAcceptedAt) return state;
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
    case "visitCheck": {
      const checks = { ...(state.visit.checks || {}) };
      if (action.done) checks[action.key] = { at: nowOf(action) };
      else delete checks[action.key];
      return { ...state, visit: { ...state.visit, checks } };
    }
    // 항목 메모(key) 또는 총평(key 없음) — 입력을 마칠 때 한 번 보낸다
    case "visitNote":
      return action.key
        ? { ...state, visit: { ...state.visit, notes: { ...(state.visit.notes || {}), [action.key]: String(action.text || "") } } }
        : { ...state, visit: { ...state.visit, memo: String(action.text || "") } };
    // 항목 상태 — 컨시어지가 직접 고른다. 상태를 고르면 그 항목은 본 것이므로 점검도 같이 켠다. 빈 값이면 지운다.
    case "visitGrade": {
      const grades = { ...(state.visit.grades || {}) };
      const checks = { ...(state.visit.checks || {}) };
      if (action.grade) {
        grades[action.key] = String(action.grade);
        if (!checks[action.key]) checks[action.key] = { at: nowOf(action) };
      } else delete grades[action.key];
      return { ...state, visit: { ...state.visit, grades, checks } };
    }
    case "visitPhoto":
      return { ...state, visit: { ...state.visit, photos: (state.visit.photos || 0) + 1 } };
    // 거주 형태(자택 · 요양병원) — 컨시어지 점검표와 관제 방문관리 · 보호자 리포트가 같은 21항목을 쓰게 가구 기록에 둔다
    case "visitLoc":
      return action.loc === "home" || action.loc === "hospital" ? { ...state, visit: { ...state.visit, loc: action.loc } } : state;
    // 동행 기록 — 저장 한 번 (보낸 뒤에는 고치지 않는다 — 보호자가 본 것과 기록이 달라지면 안 된다)
    case "escortSave": {
      if (state.escort?.sentAt) return state;
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
    case "visitOps":
      return { ...state, visit: { ...state.visit, ops: { ...(state.visit.ops || {}), ...(action.patch || {}) } } };
    // 보호자가 안심방문 리포트를 열었다 — 관제 방문관리에 '열람 완료' (한 번만)
    case "visitViewed": {
      const ops = state.visit.ops || {};
      if (ops.viewed === "열람 완료") return state;
      return { ...state, visit: { ...state.visit, ops: { ...ops, viewed: "열람 완료", viewedTs: nowOf(action) } } };
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
    case "advanceVisit":
      // 8단계 전이 — 단계를 건너뛰면 workflow.advance 가 그대로 돌려보낸다
      return { ...state, visitPlan: advance(state.visitPlan, action.to, action.note, action.actor) };
    // 건강 정보 저장 — 관제 · 컨시어지 화면의 '복용약 · 질환 수정'. 모양을 여기서 한 번 더 거른다 (여러 폰이 쓰는 값).
    case "setHealth": {
      const pl = action.payload || {};
      const list = (v) => (Array.isArray(v) ? v.map((x) => String(x || "").trim().slice(0, 40)).filter(Boolean).slice(0, 20) : []);
      return {
        ...state,
        health: {
          meds: (Array.isArray(pl.meds) ? pl.meds : []).map(cleanMedSlot).filter(Boolean).slice(0, 6),
          conditions: list(pl.conditions),
          allergies: list(pl.allergies),
          by: String(action.by || "").slice(0, 30),
          at: nowOf(action),
        },
      };
    }
    case "patchVisit":
      return { ...state, visitPlan: { ...state.visitPlan, ...action.patch } };
    // 보호자 · 어르신 일정등록 '요청' 승인 — 관제만 할 수 있다 (2026-08-12 시트 예약 1번).
    // approval 이 "pending" 인 동안에는 컨시어지 캘린더에 뜨지 않는다 (누가 무엇을 보나: eventsFor).
    case "decideEvent":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id
            ? { ...e, approval: action.approval, source: action.approval === "approved" ? "관제 승인" : "관제 반려", note: action.note ?? e.note }
            : e
        ),
      };
    // 결제 승인이 끝난 건만 들어온다 (pages/pay/result.jsx). 같은 주문번호는 한 번만 쌓는다 —
    // 결과 화면을 새로고침해도 내역이 겹치지 않게.
    case "addPayment": {
      const list = state.payments || [];
      if (action.payload.orderId && list.some((p) => p.orderId === action.payload.orderId)) return state;
      // 환불 · '이미 결제' 판단이 이 기록을 본다 — 넉넉히 남긴다
      return { ...state, payments: [{ id: idOf("pay", action), at: nowOf(action), ...action.payload }, ...list].slice(0, 200) };
    }
    case "setBilling":
      return { ...state, billing: action.payload };
    case "setPendingOrder":
      return { ...state, pendingOrder: action.payload };
    // 스토어 결제 승인 완료 → 주문·구매내역·배송 요청을 한 번에 세우고 담아 둔 것을 비운다.
    // 결제가 끝나야 주문이 선다는 규칙이 이 한 곳에 있다.
    case "commitPendingOrder": {
      const po = state.pendingOrder;
      if (!po) return state;
      const now = nowOf(action);
      const key = action._op || now;
      const pay = action.payload || {};
      return {
        ...state,
        pendingOrder: null,
        demo: { ...state.demo, cart: true, safetyCart: [] },
        orders: [
          { id: `od${key}`, at: now, by: "김민수", channel: po.channel, items: po.items, ship: po.ship, status: "preparing", receipt: pay.receiptUrl || null, note: "" },
          ...state.orders,
        ],
        requests: [
          {
            id: `rq-${key}`,
            dir: "fromGuardian",
            type: "물품 전달해 주세요",
            // 담당은 관제가 정한다 (2026-10-02 QA — 박지현으로 미리 박지 않는다)
            detail: `보호자 주문: ${po.items.map((i) => i.name).join(", ")} — 다음 배송일에 전달해 주세요.`,
            amount: po.total,
            preferredDate: null,
            urgency: "normal",
            assignee: "",
            photos: [],
            status: "inProgress",
            history: [
              { at: now, status: "requested", note: "스토어 주문" },
              { at: now, status: "confirmed", note: "" },
              { at: now, status: "inProgress", note: `보호자 결제 완료 · ${pay.method || "카드"}` },
            ],
            proof: null,
          },
          ...state.requests,
        ],
      };
    }
    case "addVoice":
      return { ...state, voices: [{ id: idOf("vo", action), at: nowOf(action), ...action.payload }, ...state.voices].slice(0, 30) };
    case "addReview":
      return { ...state, reviews: [{ id: idOf("rv", action), at: nowOf(action), ...action.payload }, ...state.reviews] };
    case "addOrder":
      return { ...state, orders: [{ id: idOf("od", action), at: nowOf(action), ...action.payload }, ...state.orders] };
    case "addMyHospital":
      return { ...state, myHospitals: [...state.myHospitals, action.payload] };
    // 복지혜택 진행상태 — 관제·보호자·컨시어지 누가 바꿔도 같은 값 (lib/welfare.js WELFARE_STATUS)
    case "welfareStatus":
      return {
        ...state,
        welfare: {
          ...state.welfare,
          status: { ...state.welfare.status, [action.id]: { status: action.status, at: nowOf(action), by: action.by || "" } },
        },
      };
    // 보호자가 미확인 항목에 답한다 — 답이 바뀌면 자동판정이 바뀐다
    case "welfareAnswer":
      return { ...state, welfare: { ...state.welfare, answers: { ...state.welfare.answers, [action.key]: action.value } } };
    case "guardianPatch":
      return { ...state, guardian: { ...state.guardian, ...action.patch } };
    case "setProductImage": {
      // null 이면 삭제 — 기본 아이콘 썸네일로 돌아간다
      const next = { ...state.productImages };
      if (action.dataUrl) next[action.id] = action.dataUrl;
      else delete next[action.id];
      return { ...state, productImages: next };
    }
    // 테스트 가구에서 누르면 데모 목데이터가 아니라 빈 기록으로 돌아간다 (Provider 가 fresh 를 붙인다)
    case "reset":
      return action.fresh ? freshState() : DEFAULT;
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
const fromServer = (payload) => reducer(freshState(), { type: "hydrate", payload: stripOps(payload) });

const POLL_ACTIVE_MS = 4000; // 누군가 만지고 있을 때 — 다른 폰이 바꾼 것을 4초 안에
const POLL_IDLE_MS = 10000; // 2분 넘게 손대지 않은 화면은 10초마다 (켜 둔 화면이 서버를 계속 두드리지 않게)
const ACTIVE_WINDOW_MS = 120000;
const SAVE_DELAY_MS = 400; // 연달아 누른 것을 한 번에 보낸다
const MAX_OPS = 300; // 서버에 남겨 두는 최근 동작 번호 수

const newOpId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
// 이 기기에 남겨 두는 것 (테스트 가구별) — 보내지 못한 동작 · 마지막으로 받은 서버 상태
const pendingKey = (hh) => `kcare-acct-pending-${hh}-v1`;
const cacheKey = (hh) => `kcare-acct-cache-${hh}-v1`;
const writeLocal = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    /* 용량 초과 등 — 이 기기 보관은 보조 수단이라 조용히 넘어간다 */
  }
};
const savePending = (hh, list) => hh && writeLocal(pendingKey(hh), list.length ? list : null);
const saveCache = (hh, state, version) => hh && state && writeLocal(cacheKey(hh), { version, state });

export function AppStateProvider({ children }) {
  const auth = useAuth();
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

  const stateRef = useRef(state);
  stateRef.current = state;
  const scopeRef = useRef(null);
  const householdRef = useRef(null);
  const backendRef = useRef("local");
  const storeKeyRef = useRef(KEY);
  const versionRef = useRef(0);
  const opsRef = useRef([]); // 서버 상태에 이미 들어간 동작 번호
  const pendingRef = useRef([]); // 서버에 아직 안 들어간 동작 — 충돌하면 서버 상태 위에 다시 쌓는다
  const savingRef = useRef(false);
  const retryRef = useRef(0);
  const lastActiveRef = useRef(Date.now());

  // 화면이 쓰는 dispatch — 서버 저장 중이면 동작에 번호를 붙여 모아 두었다가 함께 보낸다.
  // 모은 것은 이 기기에도 적어 둔다 — 보내기 전에 새로고침하거나 끊겨도 잃지 않게.
  const dispatch = useCallback((action) => {
    let a = action;
    if (scopeRef.current?.startsWith("acct:") && a.type === "reset") a = { ...a, fresh: true };
    if (backendRef.current === "server") {
      // 같은 번호를 화면에도 쓴다 — 나중에 충돌로 다시 쌓아도 id·시각이 그대로다
      a = { ...a, _at: Date.now(), _op: newOpId() };
      pendingRef.current.push(a);
      savePending(householdRef.current, pendingRef.current);
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
    householdRef.current = household;
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
          loadLocal(acctKey(household), freshState(), "local", "db-not-configured");
        } else {
          // 서버 저장. 첫 읽기가 실패해도(끊김 · 일시 오류) 서버 모드로 연다 — 마지막으로 받아 둔 상태를
          // 보여 주고, 누른 것은 모아 두었다가 연결되면 보낸다 (다음 확인에서 최신을 받는다).
          backendRef.current = "server";
          const cached = readLocal(cacheKey(household));
          const base = res?.ok ? body.state : cached?.state || null;
          versionRef.current = res?.ok ? body.version || 0 : cached?.version || 0;
          opsRef.current = opsOf(base);
          // 이 기기에서 보내지 못한 동작 — 서버에 이미 들어간 것은 빼고 다시 쌓는다
          const saved = readLocal(pendingKey(household));
          const carried = (Array.isArray(saved) ? saved : []).filter(
            (a) => a && typeof a.type === "string" && a.type !== "init" && !opsRef.current.includes(a._op)
          );
          const next = carried.reduce((acc, a) => reducer(acc, a), base ? fromServer(base) : freshState());
          rawDispatch({ type: "set", state: next });
          // 처음 들어온 가구 — 빈 기록으로 만들어 서버에 한 번 저장한다
          pendingRef.current = res?.ok && !base ? [{ type: "init", _at: Date.now(), _op: newOpId() }, ...carried] : carried;
          savePending(household, pendingRef.current);
          if (res?.ok && base) saveCache(household, base, versionRef.current);
          if (pendingRef.current.length) setDirty((d) => d + 1);
          const err = res?.ok ? null : body.error || (res ? `http-${res.status}` : "network");
          setSync({
            mode: "server",
            status: err ? "error" : "saved",
            savedAt: res?.ok && body.updatedAt ? Date.parse(body.updatedAt) : null,
            error: err,
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
  }, [scope, household]);

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
    if (backendRef.current !== "server" || savingRef.current || pendingRef.current.length === 0) return;
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
    try {
      const res = await fetch("/api/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: keepalive && body.length < 60000,
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        versionRef.current = j.version;
        opsRef.current = ops;
        pendingRef.current = pendingRef.current.slice(sent.length);
        savePending(hh, pendingRef.current);
        saveCache(hh, snapshot, j.version);
        retryRef.current = 0;
        setSync((s) => ({ ...s, status: "saved", savedAt: Date.now(), error: null }));
        again = pendingRef.current.length > 0;
      } else if (res.status === 409 && j.error === "conflict") {
        // 서버 상태 + 내 동작 중 아직 안 들어간 것 → 다시 보낸다
        // (응답만 못 받았던 저장은 서버의 _ops 에 이미 있으니 여기서 빠진다 — 중복 없음)
        const serverOps = opsOf(j.state);
        const mine = pendingRef.current.filter((a) => a.type !== "init" && !serverOps.includes(a._op));
        const next = mine.reduce((acc, a) => reducer(acc, a), fromServer(j.state));
        versionRef.current = j.version || 0;
        opsRef.current = serverOps;
        pendingRef.current = j.state ? mine : [{ type: "init", _at: Date.now(), _op: newOpId() }, ...mine];
        savePending(hh, pendingRef.current);
        if (j.state) saveCache(hh, j.state, versionRef.current);
        rawDispatch({ type: "set", state: next });
        again = pendingRef.current.length > 0;
        setSync((s) => ({ ...s, status: again ? "saving" : "saved", error: null }));
      } else {
        // 다시 보내도 소용없는 오류 — 로그인 만료(401) · 잘못된 요청(400) · 용량 초과(413).
        // 되풀이하지 않고 안내만 띄운다 (로그인하면 다시 읽으면서 모아 둔 것을 보낸다).
        const code = j.error || (res.status === 413 ? "state-too-large" : `http-${res.status}`);
        const permanent = res.status === 401 || res.status === 400 || res.status === 413;
        throw Object.assign(new Error("save-failed"), { code, permanent });
      }
    } catch (e) {
      retryRef.current += 1;
      setSync((s) => ({ ...s, status: "error", error: e.code || "network" }));
      if (!e.permanent) {
        // 3초 · 6초 · 12초 … 최대 30초 간격으로 다시 보낸다 (동작은 버리지 않는다)
        const wait = Math.min(30000, 3000 * 2 ** (retryRef.current - 1));
        setTimeout(() => setDirty((d) => d + 1), wait);
      }
    } finally {
      savingRef.current = false;
    }
    if (again) setDirty((d) => d + 1);
  }, []);

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
      if (stopped || (document.hidden && !keepRef.current) || savingRef.current || pendingRef.current.length) return;
      const idle = document.hidden || Date.now() - lastActiveRef.current > ACTIVE_WINDOW_MS;
      if (!force && idle && Date.now() - lastPoll < POLL_IDLE_MS) return;
      lastPoll = Date.now();
      // 읽는 동안 내 저장이 끝나 버전이 올라갔으면 이 응답은 그보다 옛것이다 — 버린다.
      // 받으면 화면이 잠깐 내 동작 전으로 돌아가고 버전도 뒤로 간다 (2026-10-02 코드 점검).
      const askedAt = versionRef.current;
      try {
        const res = await fetch(`/api/household?v=${askedAt}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (stopped || versionRef.current !== askedAt) return;
        if (!res.ok) {
          if (res.status === 401) setSync((s) => ({ ...s, status: "error", error: "login-required" }));
          return;
        }
        if (savingRef.current || pendingRef.current.length) return;
        // 버전이 다르면 서버 것을 받는다 — 작아진 경우도(관리자가 SQL 로 가구를 지워 처음부터 다시 시작)
        if (j.changed && j.version !== versionRef.current) {
          versionRef.current = j.version;
          opsRef.current = opsOf(j.state);
          if (j.state) saveCache(householdRef.current, j.state, j.version);
          rawDispatch({ type: "set", state: j.state ? fromServer(j.state) : freshState() });
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
  }, [ready, sync.mode]);

  const syncValue = useMemo(() => ({ ...sync, household, flush: flushNow }), [sync, household, flushNow]);

  return (
    <Ctx.Provider value={{ state, dispatch }}>
      <SyncCtx.Provider value={syncValue}>
        {ready ? (
          <>
            {children}
            <SyncNotice sync={sync} />
          </>
        ) : (
          <div className="min-h-screen bg-nav" />
        )}
      </SyncCtx.Provider>
    </Ctx.Provider>
  );
}

// 저장이 안 되고 있을 때 어느 화면에서든 보이는 안내 — 누른 것이 서버에 안 들어가는 걸 모르고
// 테스트를 이어 가지 않게. 빨강은 위험 신호 전용이라 주황(amber)으로.
function SyncNotice({ sync }) {
  if (sync.mode !== "server" || sync.status !== "error") return null;
  const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
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
        <a href={`/login?callbackUrl=${encodeURIComponent(here)}`} className="tap shrink-0 underline underline-offset-2">
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

// 결제권한 판정 — REQ-07. 금액이 보호자 승인을 필요로 하는지.
// spentToday — 오늘(한국 날짜) 어르신이 직접 결제한 합계. 한도는 하루 누적으로 센다 (2026-10-02 결정:
// 30,000원 + 25,000원을 같은 날 내면 둘째 것은 보호자 승인으로 간다).
export function needsGuardianApproval(onboarding, amount, spentToday = 0) {
  const mode = onboarding?.paymentMode || "limit";
  const limit = onboarding?.limitAmount ?? PRICING.paymentLimitDefault;
  if (mode === "guardianOnly") return true;
  if (mode === "elderOnly" || mode === "both") return false;
  return amount == null ? false : amount + (Number(spentToday) || 0) > limit;
}

// 오늘 어르신이 직접 결제한 합계 — 해주세요 · 스토어에서 payBy:"elder" 로 들어간 것 (취소 · 처리불가는 빼고)
const kstDay = (t) => new Date(Number(t) + 9 * 3600000).toISOString().slice(0, 10);
export function elderSpentToday(state, now = Date.now()) {
  const today = kstDay(now);
  return (state?.requests || [])
    .filter((r) => r.payBy === "elder" && Number(r.amount) > 0 && !["cancelled", "rejected"].includes(r.status))
    .filter((r) => kstDay(r.history?.[0]?.at || 0) === today)
    .reduce((s, r) => s + Number(r.amount), 0);
}

// 누가 어떤 일정을 보나 — 관제 승인 전 · 반려된 일정이 확정된 것처럼 보이면 안 된다.
// 보호자: 전부 (캘린더가 '승인 대기 · 반려' 칩을 단다). 어르신: 확정된 것 + 본인이 남긴 승인 대기 · 반려 건
// ('관제 확인 중' · '관제에서 다시 연락드립니다'로 표시 — 말없이 사라지지 않게). 그 밖(컨시어지 · 집계): 확정된 것만.
export function eventsFor(events, who) {
  return (events || []).filter((e) => {
    if (!e.approval || e.approval === "approved") return true;
    if (who === "guardian") return true;
    if (who === "elder") return e.by === "elder" && (e.approval === "pending" || e.approval === "rejected");
    return false;
  });
}
