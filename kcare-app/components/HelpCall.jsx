// 도와줘요(어르신 '즉시 방문 요청') — 관제 · 컨시어지 · 보호자 팝업 (2026-10-05 요청:
// "도와줘요는 정말 특수한 경우이니 관제 화면과 컨시어지, 보호자 화면에서 팝업알림으로 뜰 수 있게 하고,
//  관제에서 처리하는 과정이 보호자 · 컨시어지에게 지속 팝업으로. 닫기 기능이 있어야 함").
//
// 흐름 — 관제가 처리한다 (해주세요 승인 규칙 밖):
//   접수 → 확인 전화(연결 · 전화로 해결 / 연결 · 방문 필요 / 미연결) → 출동 지시(컨시어지) → 해결 완료
//   어느 단계에서든 해결 완료로 닫을 수 있다. 각 단계는 요청 이력 한 줄(lib/state.js helpCall)이고,
//   보호자 · 컨시어지 화면은 이 기기에서 아직 안 본 줄이 있으면 팝업으로 띄운다 (닫으면 다음 단계까지 조용).
// 색은 금색 — 빨강은 SOS · 낙상 전용이다.
import { useEffect, useRef, useState } from "react";
import { useAppState } from "../lib/state";
import { useAuth } from "../lib/auth";
import { CLOSED, isVisitCall } from "../lib/requests";
import { scopedKey } from "../lib/scope";
import { ringAlarm } from "../lib/alarm";
import { ELDER } from "../lib/mock";
import { LIVE_CONCIERGE } from "../lib/live-household";
import { CONCIERGES } from "../lib/ops-admin";

const RECENT_MS = 12 * 3600 * 1000; // 끝난 도와줘요도 12시간은 팝업 · 카드에 남긴다 (결과를 알려야 하므로)
const lastAt = (r) => r.history?.[r.history.length - 1]?.at || 0;
const hm = (t) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

export const HELP_STAGE = {
  requested: "관제 확인 전화 중",
  confirmed: "관제 확인 · 출동 준비",
  inProgress: "컨시어지 출동",
  done: "해결 완료",
  cancelled: "종료",
  rejected: "종료",
  needsAdmin: "관제 확인 중",
};

export function helpCalls(requests, now = Date.now()) {
  return (requests || [])
    .filter((r) => isVisitCall(r) && (!CLOSED.includes(r.status) || now - lastAt(r) < RECENT_MS))
    .sort((a, b) => lastAt(b) - lastAt(a));
}

// 이 기기에서 본 이력 수 — 역할마다 따로 (같은 폰으로 역할을 바꿔 보는 시연에서도 각자 뜨게)
function useSeen(role) {
  const key = scopedKey(`kcare-helpcall-seen-v1-${role}`);
  const [seen, setSeen] = useState(null);
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(key) || "{}") || {});
    } catch {
      setSeen({});
    }
  }, [key]);
  const mark = (id, n) =>
    setSeen((cur) => {
      const next = { ...(cur || {}), [id]: n };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* 저장이 막힌 브라우저 — 이 화면에서만 기억 */
      }
      return next;
    });
  return [seen, mark];
}

function Timeline({ r, from = 0 }) {
  return (
    <ol className="space-y-1.5">
      {(r.history || []).map((h, i) => (
        <li key={i} className={`flex gap-2 text-[13px] leading-[1.5] ${i >= from ? "font-bold text-navy" : "text-muted"}`}>
          <span className="shrink-0 font-num">{hm(h.at)}</span>
          <span className="min-w-0">{i === 0 ? `${ELDER.name} 님 도와줘요 — 즉시 방문 요청` : h.note || HELP_STAGE[h.status]}</span>
        </li>
      ))}
    </ol>
  );
}

// 보호자 · 컨시어지 팝업 — 새 도와줘요 · 관제 처리 단계마다 뜬다
export function HelpCallPopup({ role }) {
  const { state } = useAppState();
  const [seen, mark] = useSeen(role);
  const calls = helpCalls(state.requests);
  // 내가 한 단계(컨시어지의 현장 도착 · 처리 완료)는 나에게 다시 띄우지 않는다 — 다음 버튼을 가린다
  const fromOthers = (h) => !(role === "concierge" && h.by === LIVE_CONCIERGE);
  const pending = seen ? calls.find((r) => (r.history || []).slice(seen[r.id] || 0).some(fromOthers)) : null;
  const rang = useRef("");
  useEffect(() => {
    if (!pending || role !== "concierge") return;
    const k = `${pending.id}:${pending.history.length}`;
    if (rang.current === k) return;
    rang.current = k;
    ringAlarm();
  }, [pending, role]);
  if (!pending) return null;
  const from = seen[pending.id] || 0;
  const first = from === 0;
  const mine = role === "concierge" && pending.status === "inProgress" && pending.assignee === LIVE_CONCIERGE;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(8,23,45,.55)] p-4">
      <div role="alertdialog" aria-modal="true" aria-label="도와줘요 알림" className="w-full max-w-[400px] rounded-[22px] bg-white p-5 shadow-xl" style={{ borderTop: "6px solid #B08D57" }}>
        <div className="text-[12px] font-bold tracking-[.12em] text-[#8A5D12]">도와줘요 · 즉시 방문 요청</div>
        <div className="mt-1 text-[19px] font-black leading-[1.4] text-navy">
          {first ? `${ELDER.name} 님이 도와줘요를 눌렀습니다` : `도와줘요 — ${HELP_STAGE[pending.status] || "진행"}`}
        </div>
        <div className="mt-3 rounded-xl bg-[#FBF6EC] p-3">
          <Timeline r={pending} from={first ? 0 : from} />
        </div>
        <p className="mt-3 text-[13px] leading-[1.6] text-ink">
          {pending.status === "done"
            ? "관제센터가 해결 완료로 닫았습니다."
            : mine
              ? "출동 지시를 받았습니다 — 오늘 탭 '도와줘요' 카드에서 도착 · 처리 완료를 눌러 주세요."
              : role === "concierge"
                ? "관제센터가 대응하고 있습니다. 출동 지시가 오면 다시 알려 드립니다."
                : "관제센터가 대응하고 있습니다. 진행될 때마다 알려 드립니다."}
        </p>
        <button
          onClick={() => mark(pending.id, pending.history.length)}
          className="btn-press mt-4 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

// 진행 중 카드 — 보호자 홈 · 컨시어지 오늘 탭. 팝업을 닫아도 여기 남는다.
export function HelpCallCard({ role, me = LIVE_CONCIERGE }) {
  const { state, dispatch } = useAppState();
  const calls = helpCalls(state.requests);
  if (calls.length === 0) return null;
  return (
    <div className="space-y-2">
      {calls.map((r) => {
        const open = !CLOSED.includes(r.status);
        const mine = role === "concierge" && r.status === "inProgress" && r.assignee === me;
        const arrived = (r.history || []).some((h) => /현장 도착/.test(h.note || ""));
        return (
          <section key={r.id} aria-label="도와줘요 진행" className="rounded-[18px] border border-gold/40 bg-[#FBF6EC] p-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-navy">도와줘요 · {ELDER.name} 님</span>
              <span className={`ml-auto rounded-full px-2 py-[2px] text-[11px] font-bold ${open ? "bg-gold/20 text-[#8A5D12]" : "bg-green/10 text-green"}`}>
                {HELP_STAGE[r.status] || "진행"}
              </span>
            </div>
            <div className="mt-2.5">
              <Timeline r={r} from={r.history.length} />
            </div>
            {mine && (
              <div className="mt-3 flex gap-2">
                <button
                  disabled={arrived}
                  onClick={() => dispatch({ type: "helpCall", id: r.id, step: "arrive", by: me })}
                  className="btn-press flex-1 rounded-xl border border-navy/20 py-2.5 text-[13px] font-bold text-navy disabled:opacity-50"
                >
                  {arrived ? "✓ 도착 알림" : "현장 도착"}
                </button>
                <button
                  onClick={() => dispatch({ type: "helpCall", id: r.id, step: "resolve", by: me, note: "현장 처리 완료" })}
                  className="btn-press flex-[2] rounded-xl bg-green py-2.5 text-[13px] font-bold text-white"
                >
                  처리 완료
                </button>
              </div>
            )}
            {role === "guardian" && open && <p className="mt-2 text-[12px] leading-[1.6] text-muted">관제센터가 처리하고 있습니다. 단계가 바뀌면 팝업으로 알려 드립니다.</p>}
          </section>
        );
      })}
    </div>
  );
}

// 관제 — 새 도와줘요는 팝업으로 뜨고(알림음), 여기서 확인 전화 · 출동 지시 · 해결 완료를 처리한다.
// openId — 지금 처리할 일 '대응 열기'로 다시 연다. 닫으면 다음 변화까지 조용.
export function HelpCallOps({ openId, onClose }) {
  const { state, dispatch } = useAppState();
  const { user } = useAuth();
  const by = user?.name ? String(user.name).replace(/\s*\(.*\)$/, "") : "관제";
  const [seen, mark] = useSeen("ops");
  const calls = helpCalls(state.requests).filter((r) => !CLOSED.includes(r.status) || r.id === openId);
  const auto = seen ? calls.find((r) => !CLOSED.includes(r.status) && (seen[r.id] || 0) === 0) : null;
  const r = (openId && calls.find((x) => x.id === openId)) || auto;
  const [memo, setMemo] = useState("");
  const [who, setWho] = useState(LIVE_CONCIERGE);
  const rang = useRef("");
  useEffect(() => {
    if (!auto || rang.current === auto.id) return;
    rang.current = auto.id;
    ringAlarm();
  }, [auto]);
  if (!r) return null;
  const close = () => {
    mark(r.id, Math.max(1, r.history.length));
    setMemo("");
    onClose?.();
  };
  const act = (step, extra = {}) => {
    dispatch({ type: "helpCall", id: r.id, step, by, note: memo.trim(), ...extra });
    dispatch({
      type: "pushEvent",
      payload: { kind: "대응", text: `도와줘요 ${ELDER.name} — ${{ call: "확인 전화", dispatch: `${extra.assignee || ""} 출동 지시`, resolve: "해결 완료" }[step]}${extra.result === "fine" ? " · 전화로 해결" : extra.result === "visit" ? " · 방문 필요" : extra.result === "noanswer" ? " · 미연결" : ""}`, color: "#E8C88A" },
    });
    setMemo("");
  };
  const done = CLOSED.includes(r.status);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(8,23,45,.55)] p-4">
      <div role="alertdialog" aria-modal="true" aria-label="도와줘요 대응" className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[22px] bg-white p-6 shadow-xl" style={{ borderTop: "6px solid #B08D57" }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold tracking-[.12em] text-[#8A5D12]">도와줘요 · 즉시 방문 요청</span>
          <span className="ml-auto rounded-full bg-gold/20 px-2.5 py-[3px] text-[12px] font-bold text-[#8A5D12]">{HELP_STAGE[r.status]}</span>
        </div>
        <div className="mt-1 text-[22px] font-black text-navy">
          {ELDER.name} ({ELDER.age}) 님이 도와줘요를 눌렀습니다
        </div>
        <p className="mt-1 text-[13px] text-muted">어르신 화면 · {hm(r.history[0].at)} 접수 — 확인 전화부터. 어느 단계에서든 해결되면 해결 완료로 닫습니다.</p>

        <div className="mt-4 rounded-xl bg-[#FBF6EC] p-3.5">
          <Timeline r={r} from={r.history.length} />
        </div>

        {!done && (
          <>
            <label className="mt-4 block text-[12px] font-bold text-muted">
              메모 (보호자 · 컨시어지에게 그대로 보입니다)
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 어지러워 누워 계심 · 물 드시고 괜찮다 하심"
                className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-[14px] text-ink outline-none focus:border-gold"
              />
            </label>

            <div className="mt-4">
              <div className="text-[13px] font-black text-navy">1. 확인 전화</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button onClick={() => act("call", { result: "fine" })} className="btn-press rounded-xl border border-green/40 py-2.5 text-[13px] font-bold text-green">
                  연결 · 전화로 해결
                </button>
                <button onClick={() => act("call", { result: "visit" })} className="btn-press rounded-xl border border-navy/20 py-2.5 text-[13px] font-bold text-navy">
                  연결 · 방문 필요
                </button>
                <button onClick={() => act("call", { result: "noanswer" })} className="btn-press rounded-xl border border-navy/20 py-2.5 text-[13px] font-bold text-muted">
                  미연결
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[13px] font-black text-navy">2. 출동 지시</div>
              <div className="mt-2 flex gap-2">
                <select
                  aria-label="출동할 컨시어지"
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  className="flex-1 rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-[14px] text-ink"
                >
                  {CONCIERGES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {c === LIVE_CONCIERGE ? " (담당)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  disabled={r.status === "inProgress" && r.assignee === who}
                  onClick={() => act("dispatch", { assignee: who })}
                  className="btn-press rounded-xl bg-navy px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  {r.status === "inProgress" ? "다시 지시" : "출동 지시"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[13px] font-black text-navy">3. 해결 완료</div>
              <button onClick={() => act("resolve")} className="btn-press mt-2 w-full rounded-xl bg-green py-3 text-[14px] font-bold text-white">
                해결 완료로 닫기
              </button>
            </div>
          </>
        )}

        <button onClick={close} className="btn-press mt-5 w-full rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
          닫기
        </button>
      </div>
    </div>
  );
}
