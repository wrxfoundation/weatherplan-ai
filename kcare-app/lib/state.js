import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
// mock.js 가 아니라 seed.js 에서 가져온다 — state 는 _app 에서 import 되므로
// 여기서 mock.js 를 참조하면 콘솔 목데이터 전체가 모든 페이지에 실린다 (seed.js 주석 참고).
import { INITIAL_EVENTS, INITIAL_REQUESTS, INITIAL_KIT, SEED_EVENTS, SEED_ORDERS, SEED_REPORTS } from "./seed";
import { PRICING } from "./config";
import { transition } from "./requests";
import { SEED_VISIT, advance } from "./workflow";
import { useAuth } from "./auth";

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
      return { ...state, priority: { ...action.payload, setAt: Date.now() } };
    case "addReport":
      return { ...state, reports: [{ ...action.payload, at: Date.now() }, ...state.reports] };
    case "addRequest":
      return { ...state, requests: [action.payload, ...state.requests] };
    case "transitionRequest":
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id ? transition(r, action.to, action.note) : r
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
          { id: `ev${Date.now()}`, at: Date.now(), ...action.payload },
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
          audit: [...state.visit.audit, { at: Date.now(), ...action.event }],
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
      return { ...state, payments: [{ id: `pay${Date.now()}`, at: Date.now(), ...action.payload }, ...list].slice(0, 30) };
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
      const now = Date.now();
      const pay = action.payload || {};
      return {
        ...state,
        pendingOrder: null,
        demo: { ...state.demo, cart: true, safetyCart: [] },
        orders: [
          { id: `od${now}`, at: now, by: "김민수", channel: po.channel, items: po.items, ship: po.ship, status: "preparing", receipt: pay.receiptUrl || null, note: "" },
          ...state.orders,
        ],
        requests: [
          {
            id: `rq-${now}`,
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
      return { ...state, voices: [{ id: `vo${Date.now()}`, at: Date.now(), ...action.payload }, ...state.voices].slice(0, 30) };
    case "addReview":
      return { ...state, reviews: [{ id: `rv${Date.now()}`, at: Date.now(), ...action.payload }, ...state.reviews] };
    case "addOrder":
      return { ...state, orders: [{ id: `od${Date.now()}`, at: Date.now(), ...action.payload }, ...state.orders] };
    case "addMyHospital":
      return { ...state, myHospitals: [...state.myHospitals, action.payload] };
    // 복지혜택 진행상태 — 관제·보호자·컨시어지 누가 바꿔도 같은 값 (lib/welfare.js WELFARE_STATUS)
    case "welfareStatus":
      return {
        ...state,
        welfare: {
          ...state.welfare,
          status: { ...state.welfare.status, [action.id]: { status: action.status, at: Date.now(), by: action.by || "" } },
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

// 서버에서 받은 상태를 화면용으로 — 빈 기록 위에 형태 검증을 거쳐 얹는다
const fromServer = (payload) => reducer(freshState(), { type: "hydrate", payload: payload || {} });

const POLL_MS = 4000; // 같은 가구의 다른 폰이 바꾼 것을 가져오는 간격
const SAVE_DELAY_MS = 400; // 연달아 누른 것을 한 번에 보낸다

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
  const backendRef = useRef("local");
  const storeKeyRef = useRef(KEY);
  const versionRef = useRef(0);
  const pendingRef = useRef([]); // 서버에 아직 안 보낸 동작 — 충돌하면 서버 상태 위에 다시 쌓는다
  const savingRef = useRef(false);
  const retryRef = useRef(0);

  // 화면이 쓰는 dispatch — 서버 저장 중이면 동작을 기록해 두었다가 함께 보낸다
  const dispatch = useCallback((action) => {
    let a = action;
    if (backendRef.current === "server" || scopeRef.current?.startsWith("acct:")) {
      if (a.type === "reset") a = { ...a, fresh: true };
    }
    if (backendRef.current === "server") {
      pendingRef.current.push({ ...a, _at: Date.now() });
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
    retryRef.current = 0;

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
        // 잠깐 끊긴 것 때문에 이 기기 저장으로 떨어지지 않게 두 번 더 해 본다 (설정 전 503 은 바로 받아들인다)
        let res = null;
        for (let i = 0; i < 3 && !cancelled; i++) {
          try {
            res = await fetch("/api/household", { cache: "no-store" });
          } catch (_) {
            res = null;
          }
          if (res && (res.ok || res.status < 500 || res.status === 503)) break;
          await new Promise((r) => setTimeout(r, 1500));
        }
        if (cancelled) return;
        const body = res ? await res.json().catch(() => ({})) : {};
        if (res?.ok) {
          backendRef.current = "server";
          versionRef.current = body.version || 0;
          if (body.state) {
            rawDispatch({ type: "set", state: fromServer(body.state) });
          } else {
            // 처음 들어온 가구 — 빈 기록으로 만들어 서버에 한 번 저장한다
            rawDispatch({ type: "set", state: freshState() });
            pendingRef.current.push({ type: "init", _at: Date.now() });
            setDirty((d) => d + 1);
          }
          setSync({ mode: "server", status: "saved", savedAt: body.updatedAt ? Date.parse(body.updatedAt) : null, error: null });
        } else {
          // 서버 저장 설정 전(503) · 네트워크 오류 — 이 기기에만 저장한다
          loadLocal(acctKey(household), freshState(), "local", body.error || (res ? `http-${res.status}` : "network"));
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

  // 서버에 저장 — 버전이 맞을 때만 덮어쓴다. 다른 폰이 먼저 바꿨으면(409) 그 상태 위에
  // 내가 한 동작을 다시 쌓아서 보낸다. 누른 것만으로 '저장됨'이 되지 않는다 — 서버 응답을 받아야 한다.
  const flush = useCallback(async ({ keepalive = false } = {}) => {
    if (backendRef.current !== "server" || savingRef.current || pendingRef.current.length === 0) return;
    savingRef.current = true;
    const sent = pendingRef.current.slice();
    const body = JSON.stringify({
      baseVersion: versionRef.current,
      state: stateRef.current,
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
        pendingRef.current = pendingRef.current.slice(sent.length);
        retryRef.current = 0;
        setSync((s) => ({ ...s, status: "saved", savedAt: Date.now(), error: null }));
        again = pendingRef.current.length > 0;
      } else if (res.status === 409 && j.error === "conflict") {
        // 서버 상태 + 아직 안 들어간 내 동작 → 다시 보낸다
        const mine = pendingRef.current.filter((a) => a.type !== "init");
        const next = mine.reduce((acc, a) => reducer(acc, a), fromServer(j.state));
        versionRef.current = j.version || 0;
        pendingRef.current = j.state ? mine : [{ type: "init", _at: Date.now() }, ...mine];
        rawDispatch({ type: "set", state: next });
        again = pendingRef.current.length > 0;
        setSync((s) => ({ ...s, status: again ? "saving" : "saved" }));
      } else {
        throw Object.assign(new Error("save-failed"), { code: j.error || `http-${res.status}` });
      }
    } catch (e) {
      retryRef.current += 1;
      setSync((s) => ({ ...s, status: "error", error: e.code || "network" }));
      // 3초 · 6초 · 12초 … 최대 30초 간격으로 다시 보낸다 (동작은 버리지 않는다)
      const wait = Math.min(30000, 3000 * 2 ** (retryRef.current - 1));
      setTimeout(() => setDirty((d) => d + 1), wait);
    } finally {
      savingRef.current = false;
    }
    if (again) setDirty((d) => d + 1);
  }, []);

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

  // 같은 가구의 다른 폰이 바꾼 것 가져오기 — 내가 보낼 것이 없을 때만 (보낼 게 있으면 충돌 처리가 맡는다)
  useEffect(() => {
    if (!ready || sync.mode !== "server") return undefined;
    let stopped = false;
    const tick = async () => {
      if (stopped || document.hidden || savingRef.current || pendingRef.current.length) return;
      try {
        const res = await fetch(`/api/household?v=${versionRef.current}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (stopped || !j.changed || savingRef.current || pendingRef.current.length) return;
        if (j.version > versionRef.current && j.state) {
          versionRef.current = j.version;
          rawDispatch({ type: "set", state: fromServer(j.state) });
          setSync((s) => ({ ...s, status: "saved", remoteAt: Date.now(), remoteBy: j.updatedBy || null }));
        }
      } catch (_) {
        /* 다음 차례에 다시 본다 */
      }
    };
    const id = setInterval(tick, POLL_MS);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [ready, sync.mode]);

  const syncValue = useMemo(() => ({ ...sync, household, flush }), [sync, household, flush]);

  return (
    <Ctx.Provider value={{ state, dispatch }}>
      <SyncCtx.Provider value={syncValue}>
        {ready ? children : <div className="min-h-screen bg-nav" />}
      </SyncCtx.Provider>
    </Ctx.Provider>
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
