// 사건 종료(6-7)와 사후 상황보고서 — 결과·사유·조치결과 필수, 권한 있는 관제사만, Confirm 을 거친다.
// 종료 후에는 발생~종료 기록을 시간순으로 자동 정리하고 보호자 전달용 문구 초안을 만든다.
import { useState } from "react";
import { Btn, Confirm, Field, KV, Note, Pill, Table, TONE, useOperator } from "../ui";
import { CALL_RESULTS, CLOSE_RESULTS, STEP_INDEX, STEP_ORDER } from "../../../lib/ops-sos";
import { LIVE_ELDER, liveCustomer } from "../../../lib/ops-health";
import { useAppState } from "../../../lib/state";
import { fmtDateTime, fmtDur, fmtTime } from "../../../lib/ops-time";
import { buildTimeline } from "./helpers";

// 어느 단계에서든 해결 완료 (2026-10-05 현장 요청: "1차에서 처리완료될 수도, 2차에서 처리완료될 수도 있는데
// 끝까지 해결할 수 있는 기능이 없어 단계별로 해결되면 해결완료 할 수 있게"). 해결한 단계에 '완료'를 남기고,
// 그 뒤 남은 단계는 '건너뜀 — ○○에서 해결'로 닫은 다음 사건을 종료한다. 상황보고서는 그대로 만들어진다.
// 실제 앱의 SOS(김순자 댁)로 열린 사건을 끝내면 어르신 · 보호자 · 컨시어지 화면의 SOS 알림도 같이 끈다
function useReleaseSos() {
  const ctx = useAppState();
  return (inc, result) => {
    if (!ctx?.state?.demo?.sos || inc.customer !== LIVE_ELDER) return;
    ctx.dispatch({ type: "ackSos" });
    ctx.dispatch({ type: "pushEvent", payload: { kind: "대응", text: `SOS 사건 종료 — ${result || "해결 완료"} · 어르신 · 가족 앱 알림 해제`, color: "#8FE3C0" } });
  };
}
const titleOf = (k) => STEP_ORDER.find((s) => s.k === k)?.title || k;
// 누가 해결했나에 따라 기본 종료 결과 (2026-10-05 사람별 해결 시나리오) — 관제사가 바꿀 수 있다
//   이상징후 확인 → 단순 오작동 · 어르신 통화 → 정상 확인 · 보호자 → 보호자 인계 · 컨시어지 → 현장 조치 완료
//   119 → 119 이송 · 이송/인계 단계 → 그때 고른 처리 방식
function defaultResult(k, rec) {
  if (k === "confirm") return "단순 오작동";
  // 보호자가 통화로 확인해 준 것은 '정상 확인' — '보호자 인계'는 이송 / 인계 단계에서 실제로 넘겼을 때
  if (k === "guardian1" || k === "guardian2") return "정상 확인";
  if (k === "call119") return "119 이송";
  if (k === "dispatch" || k === "arrive") return "현장 조치 완료";
  if (k === "transfer") {
    const a = String(rec?.answer || "");
    return a.startsWith("병원 이송") ? "119 이송" : a.startsWith("병원 동행") ? "병원 동행" : a.startsWith("현장 종결") ? "현장 조치 완료" : "보호자 인계";
  }
  return "정상 확인";
}
// 해결 내용 첫 글 — 그 단계에 남은 답변 · 메모 · 현장 조치
function defaultOutcome(k, rec) {
  if (k === "confirm") return ""; // 이상징후 확인 메모(수치 급상승 등)는 '오작동' 결론과 다를 수 있어 미리 넣지 않는다
  const said = rec?.answer || rec?.dispatch?.actions || rec?.memo || "";
  return said ? `${titleOf(k)} — ${said}` : "";
}
// 해결한 단계 — 마지막으로 결과가 남은 단계(예: 1차 전화 '연결'), 없으면 지금 단계
export function resolveStepOf(inc) {
  // 실제로 해결이 가능했던 결과만 — 미연결 · 거절 · 통화불가 단계에서 '해결'했다고 적지 않는다
  const done = STEP_ORDER.filter((s) => !["close", "report"].includes(s.k) && ["connected", "done"].includes(inc.steps?.[s.k]?.result));
  return done.length ? done[done.length - 1].k : inc.step;
}
// 해결할 수 있는 단계 — 실제로 진행한 단계(건너뜀 제외) + 지금 단계
export function resolvableSteps(inc) {
  return STEP_ORDER.filter((s) => !["close", "report"].includes(s.k) && ((inc.steps?.[s.k]?.result && inc.steps[s.k].result !== "skip") || s.k === inc.step));
}
export function ResolvePanel({ inc, api, role, stepKey, by: byProp, onDone, onCancel, onPick }) {
  const operator = useOperator();
  const by = byProp || operator;
  const ro = role !== "controller";
  const at = stepKey || inc.step || resolveStepOf(inc);
  const rec0 = inc.steps?.[at];
  const [result, setResult] = useState(defaultResult(at, rec0));
  const [outcome, setOutcome] = useState(defaultOutcome(at, rec0 || (at === "arrive" ? inc.steps?.dispatch : null)));
  const choices = resolvableSteps(inc);
  const failed = rec0?.result && !["done", "connected"].includes(rec0.result);
  const [ask, setAsk] = useState(false);
  const releaseSos = useReleaseSos();
  return (
    <div className="rounded-xl border border-green/30 bg-green/[.05] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-green">{titleOf(at)} 단계에서 해결 완료</span>
        {onPick && choices.length > 1 && (
          <label className="ml-auto flex items-center gap-1 text-[12px] text-muted">
            해결한 단계
            <select aria-label="해결한 단계" value={at} disabled={ro} onChange={(e) => onPick(e.target.value)} className="rounded-md border border-navy/15 bg-white px-2 py-1 text-[12px] font-bold text-navy">
              {choices.map((s) => (
                <option key={s.k} value={s.k}>{s.title}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {!rec0?.result && <p className="mt-1 text-[11.5px] font-bold text-amber">이 단계 입력칸에 쓴 내용은 따로 저장되지 않습니다 — 남길 내용은 아래 &lsquo;해결 내용&rsquo;에 적어 주세요.</p>}
      {failed && <p className="mt-1 text-[11.5px] font-bold text-amber">이 단계는 &lsquo;{rec0.result === "skip" ? "건너뜀" : "미연결"}&rsquo;으로 남아 있습니다 — 나중에 연결돼 해결했다는 메모가 시각과 함께 붙습니다.</p>}
      <p className="mt-0.5 text-[12px] leading-[1.6] text-muted">남은 단계는 &lsquo;건너뜀 — {titleOf(at)}에서 해결&rsquo;로 닫히고 사건이 종료됩니다. 상황보고서는 그대로 정리됩니다.</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field id={`${inc.id}-resolve-result`} label="종료 결과" value={result} onChange={setResult} options={CLOSE_RESULTS} disabled={ro} required />
        <Field id={`${inc.id}-resolve-outcome`} label="해결 내용" value={outcome} onChange={setOutcome} placeholder="예: 1차 통화 연결 · 잠깐 어지러웠다 하심 · 이상 없음" disabled={ro} required />
      </div>
      <div className="mt-2.5 flex justify-end gap-2">
        {onCancel && <Btn ghost small tone="muted" onClick={onCancel}>닫기</Btn>}
        <Btn small tone="ok" disabled={ro || !result || !outcome.trim()} onClick={() => setAsk(true)}>해결 완료 · 사건 종료</Btn>
      </div>
      <Confirm
        open={ask}
        title={`${titleOf(at)} 단계에서 해결하고 ${inc.id} 사건을 종료합니다`}
        body={`결과 “${result}” · ${outcome.trim()}. 남은 단계는 건너뜀으로 남고, 종료는 이력에 남습니다 (재개는 별도 기록).`}
        confirmLabel="해결 완료"
        tone="navy"
        onCancel={() => setAsk(false)}
        onConfirm={() => {
          const now = Date.now();
          const idx = STEP_INDEX[at] ?? -1;
          const steps = { ...(inc.steps || {}) };
          // 지운 기록이 없게 합친다 — 시도 횟수 · 메모 · 파견 기록은 그대로 두고 결과 · 메모 한 줄만 더한다
          const join = (prev, add) => (prev ? `${prev} · ${add}` : add);
          const note = { id: `n${now}`, at: now, by, text: `이 단계에서 해결 — ${outcome.trim()}`, after: false };
          // autoPrev — 재개하면 해결 전 모습(시각 · 수행자 · 메모)으로 되돌린다
          const prevOf = (r) => ({ at: r?.at ?? null, by: r?.by ?? null, memo: r?.memo ?? "" });
          if (!steps[at]?.result) steps[at] = { ...(steps[at] || {}), at: steps[at]?.at ?? now, by: steps[at]?.by ?? by, result: "done", autoDone: true, autoPrev: prevOf(steps[at]), memo: join(steps[at]?.memo, `해결 — ${outcome.trim()}`) };
          // 미연결 · 건너뜀으로 남은 단계에서 해결 — 결과는 그대로 두고(그때 기록) 해결 메모를 시각과 함께 붙인다
          else if (!["done", "connected"].includes(steps[at].result)) steps[at] = { ...steps[at], resolvedHere: now, notes: [...(steps[at].notes || []), note] };
          // 아직 하지 않은 단계는 앞뒤 모두 '건너뜀 — ○○에서 해결' (다시 진행으로 되돌려 둔 앞 단계 포함)
          STEP_ORDER.forEach((s, i) => {
            if (i !== idx && !["close", "report"].includes(s.k) && !steps[s.k]?.result)
              steps[s.k] = { ...(steps[s.k] || {}), at: steps[s.k]?.at ?? now, by: steps[s.k]?.by ?? by, result: "skip", autoSkip: true, autoPrev: prevOf(steps[s.k]), memo: join(steps[s.k]?.memo, `${titleOf(at)}에서 해결 — 진행하지 않음`) };
          });
          api.update(inc.id, { steps });
          api.close(inc.id, { result, reason: `${titleOf(at)} 단계에서 해결`, outcome: outcome.trim(), by });
          releaseSos(inc, result);
          setAsk(false);
          onDone?.();
        }}
      />
    </div>
  );
}

export function CloseForm({ inc, api, role }) {
  const [result, setResult] = useState("");
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [ask, setAsk] = useState(false);
  const ro = role !== "controller";
  const valid = result && reason.trim() && outcome.trim();
  const releaseSos = useReleaseSos();
  const operator = useOperator();
  return (
    <div className="card-glass rounded-xl p-3">
      {ro && <div className="mb-2"><Note tone="warn">조회 전용 권한은 사건을 종료할 수 없습니다. 담당 관제사(김태영)에게 종료를 요청하세요.</Note></div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field id={`${inc.id}-close-result`} label="종료 결과" value={result} onChange={setResult} options={["", ...CLOSE_RESULTS]} disabled={ro} required hint="8가지 중 하나를 반드시 선택" />
        <Field id={`${inc.id}-close-reason`} label="종료 사유" value={reason} onChange={setReason} placeholder="예: 본인 통화 연결 · 낙상 아님 확인" disabled={ro} required />
        <div className="sm:col-span-2"><Field id={`${inc.id}-close-outcome`} label="조치결과" value={outcome} onChange={setOutcome} type="textarea" placeholder="누가 무엇을 확인·조치했는지" disabled={ro} required /></div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted">종료 권한: {ro ? "없음 (조회 전용)" : "관제사 김태영"}</span>
        <Btn small tone="danger" disabled={ro || !valid} title={!valid ? "결과·사유·조치결과를 모두 입력합니다" : undefined} onClick={() => setAsk(true)}>사건 종료</Btn>
      </div>
      <Confirm
        open={ask}
        title={`${inc.id} 사건을 종료합니다`}
        body={`결과 “${result}” · 사유 “${reason}”. 종료 후 발생~종료 기록이 상황보고서로 정리되고 보호자 전달 문구가 생성됩니다. 종료는 이력에 남으며 재개는 별도 기록으로 남습니다.`}
        confirmLabel="종료 확정"
        tone="danger"
        onCancel={() => setAsk(false)}
        onConfirm={() => {
          api.close(inc.id, { result, reason: reason.trim(), outcome: outcome.trim(), by: operator });
          releaseSos(inc, result);
          setAsk(false);
        }}
      />
    </div>
  );
}

function draftForGuardian(inc, c, timeline) {
  const first = timeline[0]?.at ?? inc.startedAt;
  const end = inc.closed?.at ?? Date.now();
  // 실제로 건 전화 — 시도 기록이 있거나 통화 결과(연결 · 미연결 · 거절 · 통화불가)를 남긴 단계
  const calls = ["call1", "call2", "call3"].filter((k) => inc.steps?.[k]?.tries?.length || CALL_RESULTS[inc.steps?.[k]?.result]).length;
  const dispatched = inc.steps?.dispatch?.dispatch;
  const r119 = inc.steps?.call119?.report;
  // 한 일만 적는다 — 전화를 안 했으면 '0차례 연락' 같은 문장을 만들지 않는다
  const did = [
    calls ? `어르신께 ${calls}차례 연락을 시도했습니다` : "",
    dispatched ? `컨시어지 ${dispatched.name}이(가) 현장을 방문했습니다` : "",
    r119 ? `${r119.agency}에 신고했습니다` : "",
  ].filter(Boolean);
  return [
    `[K-CARE 관제센터] ${c.name} 어르신 보호자님께 상황을 알려드립니다.`,
    `· 발생: ${fmtDateTime(first)} — ${inc.cause} (${inc.value})`,
    `· 대응: 관제사 ${inc.closed?.by || inc.controller || "김태영"}${did.length ? ` — ${did.join(" · ")}.` : "이(가) 확인했습니다."}`,
    `· 결과: ${inc.closed?.result || "—"} — ${inc.closed?.outcome || "—"}`,
    `· 종료: ${fmtDateTime(end)} (발생 후 ${fmtDur(end - first)})`,
    "추가 확인이 필요하시면 관제센터로 연락 주세요. 건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.",
  ].join("\n");
}

export function ReportView({ inc, api, role }) {
  const appState = useAppState()?.state;
  const c = liveCustomer(inc.customer, appState?.onboarding, appState?.health);
  const timeline = buildTimeline(inc);
  const [draft, setDraft] = useState(() => draftForGuardian(inc, c, timeline));
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3" style={{ background: TONE.navy.bg }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-[14px] font-bold text-navy">사후 상황보고서 · {inc.id}</h5>
          <Pill tone="muted">종료 {inc.closed ? fmtDateTime(inc.closed.at) : "—"} · {inc.closed?.by}</Pill>
        </div>
        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2">
          <KV k="고객" v={`${c.name} · ${c.age ?? "—"}세 · ${c.district}`} />
          <KV k="발생 원인" v={`${inc.cause} · ${inc.value}`} />
          <KV k="종료 결과" v={inc.closed?.result || "—"} tone="navy" />
          <KV k="종료 사유" v={inc.closed?.reason || "—"} />
          <KV k="조치결과" v={inc.closed?.outcome || "—"} />
          <KV k="총 소요" v={inc.closed ? fmtDur(inc.closed.at - inc.startedAt) : "—"} mono />
        </div>
      </div>
      <Table
        dense
        cols={[
          { k: "at", label: "시각", w: 90, render: (r) => <span className="font-num">{fmtTime(r.at)}</span> },
          { k: "kind", label: "구분", w: 130 },
          { k: "text", label: "내용" },
          { k: "by", label: "수행자", w: 80, render: (r) => r.by || "—" },
        ]}
        rows={timeline.map((e, i) => ({ ...e, id: `${e.at}-${i}` }))}
        empty="기록이 없습니다."
      />
      <div>
        <Field id={`${inc.id}-draft`} label="보호자 전달용 문구 초안 (수정 가능)" value={draft} onChange={setDraft} type="textarea" />
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Btn ghost small tone="navy" onClick={copy}>{copied ? "복사됨" : "문구 복사"}</Btn>
          <Btn small tone="muted" disabled title="보호자 앱 발송 연동 대기">보호자 앱으로 발송 (연동 대기)</Btn>
          {api && role === "controller" && <Btn ghost small tone="warn" onClick={() => api.reopen(inc.id)}>사건 재개</Btn>}
        </div>
      </div>
    </div>
  );
}
