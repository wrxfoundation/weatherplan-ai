import { useState } from "react";
import Icon from "./icons";
import { FLOW_STEPS, REMINDERS, FOLLOWUP_ROUTES, VISIT_STATUS } from "../lib/workflow";
import { crewFor, crewLabel, crewReason } from "../lib/dispatch-policy";
import { useAppState } from "../lib/state";
import { LIVE_ELDER } from "../lib/ops-health";
import { inCenter, people } from "../lib/people";

// 배정 버튼 — 센터 공간은 그 센터 컨시어지(주 · 부 순서), 데모 · 테스트 가구는 예시 짝 (2026-10-06 점검)
const crewChoices = () =>
  inCenter() ? people().concierges.map((n, i) => `${n} (${i === 0 ? "주" : "부"})`) : ["박지현 (주)", "서다인 (부)"];

// 방문 업무흐름 8단계 — 관제(/dispatch)와 컨시어지(/concierge)가 같은 건을 본다.
// role 로 조작 권한이 갈린다: 관제만 승인·반려하고, 컨시어지만 컨펌·통화·GPS·녹화를 한다.
// 클라이언트가 적어 준 순서 그대로이고, 단계를 건너뛰는 버튼은 만들지 않았다.

const STEP_OF = (status) => VISIT_STATUS[status]?.step ?? 0;

export default function VisitFlow({ role = "ops" }) {
  const { state, dispatch } = useAppState();
  const v = state.visitPlan;
  const st = VISIT_STATUS[v.status];
  const cur = STEP_OF(v.status);
  const crew = crewFor(v.kind);
  const isOps = role === "ops";
  // 일정계획 반려 사유 — null 이면 닫힘. 정해 둔 글('일정 부적절')로 반려하지 않는다 (2026-10-19 점검 OPS-06)
  const [rejectWhy, setRejectWhy] = useState(null);
  // 현장 단계는 방문일에만 — 며칠 전에 '현장 도착'을 누를 수 없게 (2026-10-19 점검 C-04)
  const visitYmd = String(v.at || "").slice(0, 10);
  const todayYmd = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const beforeDay = /^\d{4}-\d{2}-\d{2}$/.test(visitYmd) && visitYmd > todayYmd;
  // ⑧ 방문 완료는 점검표 리포트를 제출한 뒤에만 — 0개 체크로 '21항목 체크 완료 · 리포트 발행'이 남던 것 (C-04)
  const doneN = Object.keys(state.visit?.checks || {}).length;
  const reportIn = !!state.visit?.reportSent || !!state.visit?.ops?.sentAt;

  const go = (to, note) => {
    dispatch({ type: "advanceVisit", to, note, actor: isOps ? "관제" : "컨시어지" });
    const step = FLOW_STEPS.find((s) => s.key === to);
    if (step?.notify?.length) {
      dispatch({
        type: "pushEvent",
        payload: {
          kind: "일정",
          text: `${step.title} — ${v.elderName || LIVE_ELDER}님 (${step.notify.join(" · ")} 알림)`,
          color: "#8FA9CC",
        },
      });
    }
  };

  return (
    <div className="min-w-0 rounded-2xl border border-navy/[.08] bg-white/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* '다음 정기 안심방문'이라고 못 박는다 — 같은 화면의 오늘 병원 동행(짝 출발 확정)과 다른 건이다 (2026-10-02 QA) */}
        <span className="text-[15px] font-bold text-navy">다음 정기 안심방문 · 업무흐름</span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ color: st.fg, background: st.bg }}
        >
          {cur > 0 ? `${cur}/8 · ` : ""}
          {st.label}
        </span>
        <span className="ml-auto font-num text-[12px] text-muted">
          {v.elderName || LIVE_ELDER}님 · {v.at}
        </span>
      </div>

      {/* 단계 막대 */}
      <div className="mt-3 flex gap-1">
        {FLOW_STEPS.map((s) => (
          <div key={s.n} className="flex-1">
            <div className={`h-[4px] rounded-full ${s.n <= cur ? "bg-gold" : "bg-navy/10"}`} />
            <div className={`mt-1 text-[9px] font-bold ${s.n === cur ? "text-navy" : "text-muted/50"}`}>
              {s.n}
            </div>
          </div>
        ))}
      </div>

      {/* 현재 단계 안내 */}
      {cur > 0 && cur <= 8 && (
        <div className="mt-2.5 rounded-xl bg-navy/[.045] px-3.5 py-2.5">
          <div className="text-[13.5px] font-bold text-navy">
            {FLOW_STEPS[cur - 1].n}. {FLOW_STEPS[cur - 1].title}
          </div>
          <div className="mt-0.5 text-[12px] leading-[1.65] text-muted">
            {FLOW_STEPS[cur - 1].detail}
          </div>
          {FLOW_STEPS[cur - 1].notify.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {FLOW_STEPS[cur - 1].notify.map((n) => (
                <span key={n} className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-muted">
                  {n} 알림
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ② 관제 검토 — 팀 배정 + 배차 */}
      {isOps && v.status === "review" && (
        <div className="mt-3 rounded-xl border border-gold/30 bg-gold/[.06] p-3.5">
          <div className="text-[13px] font-bold text-navy">팀 배정 · 배차 검토</div>
          <p className="mt-1 text-[12px] leading-[1.65] text-muted">
            이 방문은 <b className="text-navy">{crewLabel(crew)}</b>입니다 — {crewReason(v.kind)}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {crewChoices().slice(0, crew).map((n) => (
              <button
                key={n}
                onClick={() =>
                  dispatch({
                    type: "patchVisit",
                    patch: { crew: [...new Set([...(v.crew || []), n])] },
                  })
                }
                className={`btn-press btn-inline btn-chip rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${
                  (v.crew || []).includes(n)
                    ? "border-green/40 bg-green/10 text-green"
                    : "border-navy/20 text-navy"
                }`}
              >
                {(v.crew || []).includes(n) ? "✓ " : "+ "}
                {n}
              </button>
            ))}
            <button
              onClick={() => dispatch({ type: "patchVisit", patch: { vehicle: "12가 3456" } })}
              className={`btn-press btn-inline btn-chip rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${
                v.vehicle ? "border-green/40 bg-green/10 text-green" : "border-navy/20 text-navy"
              }`}
            >
              {v.vehicle ? `✓ 차량 ${v.vehicle}` : "+ 차량 배차"}
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={(v.crew || []).length < crew || !v.vehicle}
              onClick={() => go("approved", `${crewLabel(crew)} · 차량 ${v.vehicle}`)}
              className="btn-press flex-[2] rounded-xl bg-navy py-2.5 text-[13.5px] font-bold text-white disabled:opacity-40"
            >
              {inCenter() && crewChoices().length < crew
                ? `${crewLabel(crew)} 방문 — 이 센터에 승인된 컨시어지가 ${crew}명 이상이어야 배정할 수 있습니다 (지금 ${crewChoices().length}명)`
                : (v.crew || []).length < crew || !v.vehicle
                ? "인원 · 차량을 채워야 승인할 수 있습니다"
                : "일정계획 승인 — 4개 화면에 반영"}
            </button>
            <button
              onClick={() => setRejectWhy(rejectWhy === null ? "" : null)}
              aria-expanded={rejectWhy !== null}
              className="btn-press btn-inline btn-chip rounded-xl border border-amber/40 px-3 py-2.5 text-[13px] font-bold text-amber"
            >
              반려
            </button>
          </div>
          {rejectWhy !== null && (
            <div className="mt-2 rounded-lg border border-amber/30 bg-white/70 p-2.5">
              <label className="block text-[11.5px] font-bold text-muted">
                반려 사유 — 방문 이력에 남고, 일정을 다시 잡는 데 쓰입니다
                <input
                  value={rejectWhy}
                  onChange={(e) => setRejectWhy(e.target.value)}
                  placeholder="예: 그날 차량이 없습니다 · 오후로 다시 잡아 주세요"
                  className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[13px] font-medium text-ink outline-none focus:border-gold"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setRejectWhy(null)} className="btn-press flex-1 rounded-lg border border-navy/15 py-2 text-[12.5px] font-bold text-muted">
                  닫기
                </button>
                <button
                  disabled={!rejectWhy.trim()}
                  onClick={() => {
                    go("rejected", `일정 반려 — ${rejectWhy.trim()}`);
                    setRejectWhy(null);
                  }}
                  className="btn-press flex-[2] rounded-lg bg-amber py-2 text-[12.5px] font-bold text-white disabled:opacity-40"
                >
                  반려 — 다시 잡게 하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ④ 컨시어지 컨펌 */}
      {!isOps && v.status === "approved" && (
        <div className="mt-3 rounded-xl border border-navy/12 p-3.5">
          <div className="text-[13px] font-bold text-navy">D-7 · D-3 · D-1 알림이 예약되었습니다</div>
          <ul className="mt-2 space-y-1.5">
            {REMINDERS.map((r) => (
              <li key={r.d} className="flex items-start gap-2 text-[12px] leading-[1.6]">
                <span className="mt-[1px] w-[30px] shrink-0 font-num font-bold text-gold">D-{r.d}</span>
                <span className="min-w-0 flex-1 text-muted">
                  <b className="text-ink">{r.msg}</b>
                  <br />
                  {r.action} · 대상 {r.to.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => go("confirmed", "일정 변경 없음 — 컨펌")}
            className="btn-press mt-3 w-full rounded-xl bg-navy py-2.5 text-[13.5px] font-bold text-white"
          >
            일정 변경 없음 — 방문 컨펌
          </button>
        </div>
      )}

      {/* ⑤ 사전 통화 체크 — 컨시어지가 체크하면 관제 화면에 그대로 뜬다 */}
      {v.status === "confirmed" && (
        <div className="mt-3 rounded-xl border border-navy/12 p-3.5">
          <div className="text-[13px] font-bold text-navy">D-3 · D-1 사전 통화</div>
          <p className="mt-1 text-[12px] text-muted">
            {isOps ? "컨시어지의 통화 여부가 여기에 표시됩니다." : "통화 후 체크해 주세요 — 관제에 바로 표시됩니다."}
          </p>
          <div className="mt-2.5 flex gap-2">
            {[
              ["elder", "어르신 통화"],
              ["guardian", "보호자 통화"],
            ].map(([k, label]) => {
              const on = v.calls?.[k];
              return (
                <button
                  key={k}
                  disabled={isOps}
                  onClick={() =>
                    dispatch({ type: "patchVisit", patch: { calls: { ...v.calls, [k]: true } } })
                  }
                  className={`btn-press flex-1 rounded-lg border py-2.5 text-[12.5px] font-bold ${
                    on ? "border-green/40 bg-green/10 text-green" : "border-navy/20 text-navy"
                  } ${isOps ? "cursor-default" : ""}`}
                >
                  {on ? "✓ " : ""}
                  {label}
                </button>
              );
            })}
          </div>
          {!isOps && v.calls?.elder && v.calls?.guardian && (
            <button
              onClick={() => go("called", "어르신 · 보호자 통화 완료")}
              className="btn-press mt-2.5 w-full rounded-xl bg-navy py-2.5 text-[13.5px] font-bold text-white"
            >
              통화 완료 — 관제 보고
            </button>
          )}
        </div>
      )}

      {/* ⑥⑦ GPS · 녹화 — 컨시어지만 */}
      {!isOps && (v.status === "called" || v.status === "arrived") && (
        <div className="mt-3 space-y-2">
          {v.status === "called" && beforeDay && (
            <p className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12px] font-bold text-muted">방문일({visitYmd.slice(5).replace("-", "/")})에 현장에서 체크인합니다</p>
          )}
          {v.status === "called" && (
            <button
              disabled={beforeDay}
              onClick={() => {
                if (beforeDay) return;
                dispatch({ type: "patchVisit", patch: { gpsAt: Date.now() } });
                go("arrived", "GPS 도착 확인 — 관제 · 보호자 알림");
              }}
              className="btn-press flex w-full items-center gap-2 rounded-xl bg-navy py-3 text-[14px] font-bold text-white disabled:opacity-40"
            >
              <span className="ml-3">
                <Icon name="pin" size={17} />
              </span>
              현장 도착 — GPS 체크인
            </button>
          )}
          {v.status === "arrived" && (
            <button
              onClick={() => {
                dispatch({ type: "patchVisit", patch: { recordingAt: Date.now() } });
                go("recording", "초인종 전 녹화 시작");
              }}
              className="btn-press flex w-full items-center gap-2 rounded-xl border-2 border-gold bg-gold/[.08] py-3 text-[14px] font-bold text-[#86621F]"
            >
              {/* 녹화 중 표시는 금색 — 빨강은 위험 신호(SOS · 낙상) 전용 (2026-10-19 점검) */}
              <span className="ml-3 h-[9px] w-[9px] animate-livePing rounded-full bg-gold" />
              녹화 시작 — 초인종은 그 다음입니다
            </button>
          )}
        </div>
      )}

      {/* ⑧ 업무 수행 · 보완사항 두 갈래 */}
      {v.status === "recording" && (
        <div className="mt-3 rounded-xl border border-navy/12 p-3.5">
          <div className="text-[13px] font-bold text-navy">21항목 체크 중 · 보완사항이 나오면</div>
          <div className="mt-2 space-y-2">
            {FOLLOWUP_ROUTES.map((r) => (
              <div key={r.key} className="rounded-lg bg-navy/[.04] px-3 py-2">
                <div className="text-[12.5px] font-bold text-ink">{r.label}</div>
                <div className="mt-0.5 font-num text-[11px] text-muted">{r.flow.join(" → ")}</div>
                <div className="mt-0.5 text-[11px] leading-[1.55] text-muted">{r.when}</div>
              </div>
            ))}
          </div>
          {!isOps && (
            <>
              <button
                disabled={!reportIn}
                onClick={() => reportIn && go("done", `21항목 중 ${doneN}개 확인 · 리포트 제출됨`)}
                className="btn-press mt-3 w-full rounded-xl bg-navy py-2.5 text-[13.5px] font-bold text-white disabled:opacity-40"
              >
                방문 완료 — 업무흐름 닫기
              </button>
              {!reportIn && (
                <p className="mt-1.5 text-[11.5px] leading-[1.6] text-muted">점검표에서 리포트를 제출하면 닫을 수 있습니다 (지금 {doneN}개 확인).</p>
              )}
            </>
          )}
        </div>
      )}

      {v.status === "rejected" && isOps && (
        <button
          onClick={() => go("draft", "재수립")}
          className="btn-press mt-3 w-full rounded-xl border border-navy/20 py-2.5 text-[13.5px] font-bold text-navy"
        >
          일정 재수립 요청
        </button>
      )}

      {/* 진행 기록 — 누가 언제 했는지가 남는다 */}
      {(v.trail || []).length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] font-bold text-muted">
            진행 기록 {(v.trail || []).length}건
          </summary>
          <ul className="mt-1.5 space-y-1">
            {[...(v.trail || [])].reverse().map((t, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-[1.6]">
                <span className="w-[42px] shrink-0 font-num text-muted">
                  {new Date(t.at).toTimeString().slice(0, 5)}
                </span>
                <span className="min-w-0 flex-1 text-ink">
                  <b>{VISIT_STATUS[t.status]?.label || t.status}</b>
                  {t.actor && <span className="text-muted"> · {t.actor}</span>}
                  {t.note && <span className="text-muted"> — {t.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
