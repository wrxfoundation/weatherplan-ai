import { createContext, useContext, useEffect, useReducer } from "react";
import { INITIAL_EVENTS, INITIAL_REQUESTS } from "./mock";
import { PRICING } from "./config";
import { transition } from "./requests";

// 앱 전역 상태 — 데모 단계에서는 클라이언트 보관(localStorage).
// 실제 구현에서 이 상태는 전부 서버 소유가 된다 (핸드오프 04 §4).

const KEY = "kcare-demo-state-v1";

const DEFAULT = {
  onboarding: null, // { rel, res, elderName, district, tier, paymentMode, limitAmount, joinedAt }
  events: INITIAL_EVENTS,
  requests: INITIAL_REQUESTS,
  demo: { sos: false, anomaly: "open" }, // 시연 토글 (open|sent|dismissed)
};

function reducer(state, action) {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload };
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
    case "reset":
      return DEFAULT;
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", payload: JSON.parse(raw) });
    } catch (_) {
      /* 손상된 저장값은 무시 */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {
      /* 저장 실패는 데모 동작에 영향 없음 */
    }
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
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
