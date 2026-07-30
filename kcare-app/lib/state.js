import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { INITIAL_EVENTS, INITIAL_REQUESTS, INITIAL_KIT, SEED_EVENTS, SEED_REPORTS } from "./mock";
import { PRICING } from "./config";
import { transition } from "./requests";

// 앱 전역 상태 — 데모 단계에서는 클라이언트 보관(localStorage).
// 실제 구현에서 이 상태는 전부 서버 소유가 된다 (핸드오프 04 §4).
// 역할 간 연동 데모: 어르신 SOS → 가족 배너 / 컨시어지 보충 요청 → 가족 결제 승인.

const KEY = "kcare-demo-state-v2";

const DEFAULT = {
  onboarding: null, // { rel, res, elderName, district, tier, paymentMode, limitAmount, joinedAt }
  events: INITIAL_EVENTS,
  requests: INITIAL_REQUESTS,
  // cart: 가족 앱(REQ-07 장바구니)에서 변경 — 어르신 화면은 읽기만 (핸드오프 06 §3.9)
  // guardianRole: 주(primary)/부(secondary) 보호자 — 권한 분기 시연용. 초대 정책 문서 참조
  demo: { sos: false, anomaly: "open", offline: false, cart: false, guardianRole: "primary" },
  // REQ-01 — 병력 기반 우선 표시는 자동 추론이 아니라 사람이 설정한다 (설정 주체 기록)
  priority: { factors: ["기온"], source: "보호자 설정", setAt: null },
  // 관찰 리포트 누적 — 본인 작성 전체 열람 · 타인 작성은 공유분만 (회의 7)
  reports: SEED_REPORTS.map((r) => ({ ...r, at: Date.now() - r.daysAgo * 86400000 })),
  // 어르신 1회성 잠금 상태 (undo 없음이 의도 — 핸드오프 06 §5). voicePlayed만 재클릭 가능.
  elder: { medTaken: false, cooled: false, voicePlayed: false, askAdded: false },
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
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      // 구버전 저장값(슬라이스에 새 키가 없는 형태)과 깊은 병합 — 새 키 기본값 유지.
      // localStorage는 신뢰할 수 없는 입력: 객체·배열 형태를 검증하고 아니면 기본값을 지킨다.
      const p = action.payload && typeof action.payload === "object" ? action.payload : {};
      const arr = (v, fallback) => (Array.isArray(v) ? v : fallback);
      return {
        ...state,
        ...p,
        demo: { ...state.demo, ...(p.demo || {}) },
        elder: { ...state.elder, ...(p.elder || {}) },
        ops: { ...state.ops, ...(p.ops || {}) },
        visit: {
          ...state.visit,
          ...(p.visit || {}),
          audit: arr(p.visit && p.visit.audit, state.visit.audit),
        },
        ticker: arr(p.ticker, state.ticker),
        events: arr(p.events, state.events),
        reports: arr(p.reports, state.reports),
        requests: arr(p.requests, state.requests),
      };
    }
    case "completeOnboarding":
      return { ...state, onboarding: action.payload };
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
    case "medTaken":
      return { ...state, elder: { ...state.elder, medTaken: true } };
    case "elderPatch":
      return { ...state, elder: { ...state.elder, ...action.patch } };
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
    case "reset":
      return DEFAULT;
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT);
  // 목 데이터가 현재 시각 기준이라 서버 프리렌더와 클라이언트가 어긋난다.
  // 데모 단계에서는 마운트 후 렌더로 하이드레이션 불일치를 차단한다.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", payload: JSON.parse(raw) });
    } catch (_) {
      /* 손상된 저장값은 무시 */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {
      /* 저장 실패는 데모 동작에 영향 없음 */
    }
  }, [state]);

  return (
    <Ctx.Provider value={{ state, dispatch }}>
      {ready ? children : <div className="min-h-screen bg-nav" />}
    </Ctx.Provider>
  );
}

export function useAppState() {
  return useContext(Ctx);
}

// 결제권한 판정 — REQ-07. 금액이 보호자 승인을 필요로 하는지.
export function needsGuardianApproval(onboarding, amount) {
  const mode = onboarding?.paymentMode || "limit";
  const limit = onboarding?.limitAmount ?? PRICING.paymentLimitDefault;
  if (mode === "guardianOnly") return true;
  if (mode === "elderOnly" || mode === "both") return false;
  return amount == null ? false : amount > limit;
}
