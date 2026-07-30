import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { INITIAL_EVENTS, INITIAL_REQUESTS, INITIAL_KIT } from "./mock";
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
  demo: { sos: false, anomaly: "open", offline: false, cart: false },
  // REQ-01 — 병력 기반 우선 표시는 자동 추론이 아니라 사람이 설정한다
  priority: { factors: ["기온"], source: "보호자 설정" },
  // 어르신 1회성 잠금 상태 (undo 없음이 의도 — 핸드오프 06 §5). voicePlayed만 재클릭 가능.
  elder: { medTaken: false, cooled: false, voicePlayed: false, askAdded: false },
  // 관제 콘솔 상태 — sos 해제는 관제(ackSos)만 가능 (핸드오프 06 §5 · 02 §4)
  ops: { sosDispatched: false, sos119: false, fall: "open", assign: "pending" },
  // 컨시어지 방문 수행 상태 + 감사 타임라인 (REQ-12 골격)
  visit: { checkedIn: false, kitDone: false, reportSent: false, audit: [] },
  kit: INITIAL_KIT,
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      // 구버전 저장값(elder/demo에 새 키가 없는 형태)과 깊은 병합 — 새 키 기본값 유지
      return {
        ...state,
        ...action.payload,
        demo: { ...state.demo, ...(action.payload.demo || {}) },
        elder: { ...state.elder, ...(action.payload.elder || {}) },
        ops: { ...state.ops, ...(action.payload.ops || {}) },
      };
    case "completeOnboarding":
      return { ...state, onboarding: action.payload };
    case "addEvent":
      return { ...state, events: [...state.events, action.payload] };
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
