import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
// mock.js 가 아니라 seed.js 에서 가져온다 — state 는 _app 에서 import 되므로
// 여기서 mock.js 를 참조하면 콘솔 목데이터 전체가 모든 페이지에 실린다 (seed.js 주석 참고).
import { INITIAL_EVENTS, INITIAL_REQUESTS, INITIAL_KIT, SEED_EVENTS, SEED_ORDERS, SEED_REPORTS } from "./seed";
import { PRICING } from "./config";
import { transition } from "./requests";
import { SEED_VISIT, advance } from "./workflow";
import { useAuth } from "./auth";
import { setStorageScope } from "./scope";

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
  visit: { checkedIn: false, kitDone: false, reportSent: false, audit: [] },
  kit: INITIAL_KIT,
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
};

// 테스트 가구의 첫 상태 — 구성(방문 흐름 · 키트 · 우선 날씨)은 두고 기록(일정 · 요청 · 주문 · 결제 ·
// 음성 · 리포트 · 알림)은 비운다. 화면에 뜨는 기록이 전부 테스트하는 사람이 만든 것이 되게.
export function freshState() {
  return {
    ...DEFAULT,
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
  };
}

// 저장된 일정 중 씨앗(INITIAL_EVENTS)에서 온 것을 손본다 —
//  · 없어진 씨앗(ev4 아침 혈압약)은 지운다. 시드에서 빼도 localStorage 에 남아 있으면
//    화면에 계속 뜬다 (2026-09-04 시트 어르신 전체 2번).
//  · 시각이 지난 씨앗은 오늘 기준으로 다시 잡는다. 씨앗의 at 은 첫 실행일 기준으로
//    계산돼 저장되므로, 며칠 뒤 열면 "9월 3일 안심방문"처럼 지난 일정이 남는다
//    (같은 시트 3번이 그 화면이었다). 어르신·보호자가 직접 옮긴 미래 일정은 건드리지 않는다.
const SEED_BY_ID = Object.fromEntries(INITIAL_EVENTS.map((e) => [e.id, e]));
const REMOVED_SEED_IDS = new Set(["ev4"]);
function rebaseSeedEvents(events) {
  return events
    .filter((e) => !REMOVED_SEED_IDS.has(e.id))
    .map((e) => (SEED_BY_ID[e.id] && e.at < Date.now() ? { ...e, at: SEED_BY_ID[e.id].at } : e));
}

// 서버 저장 모드에서는 동작마다 시각(_at)과 번호(_op)가 붙는다. 시각·id 를 그 값에서 만들면
// 다른 폰에서 다시 쌓아도(충돌 처리) 같은 id 가 나온다 — 여러 건을 한 번에 다시 쌓을 때
// Date.now() 가 겹쳐 id 가 같아지는 일도 없다. 데모에서는 붙지 않으니 지금 시각을 쓴다.
const nowOf = (a) => (Number.isFinite(a?._at) ? a._at : Date.now());
const idOf = (prefix, a) => (a?._op ? `${prefix}${a._op}` : `${prefix}${Date.now()}`);

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
        },
        ticker: arr(p.ticker, state.ticker),
        events: rebaseSeedEvents(arr(p.events, state.events)),
        reports: arr(p.reports, state.reports),
        requests: arr(p.requests, state.requests),
        productImages: obj(p.productImages, state.productImages),
        visitPlan: { ...state.visitPlan, ...(p.visitPlan || {}) },
        voices: arr(p.voices, state.voices),
        reviews: arr(p.reviews, state.reviews),
        orders: arr(p.orders, state.orders),
        myHospitals: arr(p.myHospitals, state.myHospitals),
        payments: arr(p.payments, state.payments),
        billing: p.billing ?? state.billing,
        pendingOrder: p.pendingOrder ?? state.pendingOrder,
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
    case "addReport":
      return { ...state, reports: [{ ...action.payload, at: nowOf(action) }, ...state.reports] };
    case "addRequest":
      return { ...state, requests: [action.payload, ...state.requests] };
    case "transitionRequest":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? transition(r, action.to, action.note) : r
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
    case "demo":
      return { ...state, demo: { ...state.demo, ...action.payload } };
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
      // SOS 해제 — 관제 전용. 급파·연계 플래그도 함께 초기화
      return {
        ...state,
        demo: { ...state.demo, sos: false },
        ops: { ...state.ops, sosDispatched: false, sos119: false },
      };
    case "audit":
      return {
        ...state,
        visit: {
          ...state.visit,
          ...(action.patch || {}),
          audit: [...state.visit.audit, { at: nowOf(action), ...action.event }],
        },
      };
    case "kitUpdate":
      return { ...state, kit: action.items };
    case "advanceVisit":
      // 8단계 전이 — 단계를 건너뛰면 workflow.advance 가 그대로 돌려보낸다
      return { ...state, visitPlan: advance(state.visitPlan, action.to, action.note, action.actor) };
    case "patchVisit":
      return { ...state, visitPlan: { ...state.visitPlan, ...action.patch } };
    // 보호자 일정등록 '요청' 승인 — 관제만 할 수 있다 (2026-08-12 시트 예약 1번).
    // approval 이 "pending" 인 동안에는 어르신·컨시어지 캘린더에 뜨지 않는다.
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
      return { ...state, payments: [{ id: idOf("pay", action), at: nowOf(action), ...action.payload }, ...list].slice(0, 30) };
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
            detail: `보호자 주문: ${po.items.map((i) => i.name).join(", ")} — 다음 배송일에 전달해 주세요.`,
            amount: po.total,
            preferredDate: null,
            urgency: "normal",
            assignee: "박지현",
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
      if (stopped || document.hidden || savingRef.current || pendingRef.current.length) return;
      const idle = Date.now() - lastActiveRef.current > ACTIVE_WINDOW_MS;
      if (!force && idle && Date.now() - lastPoll < POLL_IDLE_MS) return;
      lastPoll = Date.now();
      try {
        const res = await fetch(`/api/household?v=${versionRef.current}`, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (stopped) return;
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
export function needsGuardianApproval(onboarding, amount) {
  const mode = onboarding?.paymentMode || "limit";
  const limit = onboarding?.limitAmount ?? PRICING.paymentLimitDefault;
  if (mode === "guardianOnly") return true;
  if (mode === "elderOnly" || mode === "both") return false;
  return amount == null ? false : amount > limit;
}
