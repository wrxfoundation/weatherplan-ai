// 관제 메뉴의 '실제 기록 (테스트 가구 1) / 예시 기록' 전환 (2026-10-02).
// 테스트 계정으로 들어오면 실제가 기본, 로그인하지 않은 데모는 예시가 기본이다.
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { LIVE_TAG } from "../../lib/live-household";

export function useLiveView() {
  const liveOn = !!useAuth().user?.household;
  const [mode, setMode] = useState(null);
  return { liveOn, view: mode || (liveOn ? "real" : "demo"), setView: setMode };
}

export function LiveToggle({ view, onChange, label = "보기", realLabel = `실제 기록 (${LIVE_TAG})`, demoLabel = "예시 기록", children }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {[["real", realLabel], ["demo", demoLabel]].map(([k, text]) => (
        <button
          key={k}
          type="button"
          aria-pressed={view === k}
          onClick={() => onChange(k)}
          className="btn-press rounded-full px-3.5 py-1.5 text-[12px] font-bold"
          style={view === k ? { background: "#0A1F3C", color: "#fff" } : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }}
        >
          {text}
        </button>
      ))}
      {children}
    </div>
  );
}
