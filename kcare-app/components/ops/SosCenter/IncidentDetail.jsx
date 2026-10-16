// 사건 상세 (가운데 열) — 6-2 상단 고정정보 전부 · 6-3 13단계 타임라인 · 종료 후 상황보고서.
// 팝업을 닫아도 사건은 목록에 남는다 — 닫기는 선택 해제일 뿐이다 (6-1 · 19절).
import { useState } from "react";
import { Avatar, Btn, Confirm, FeedPill, KV, Panel, Pill, SEV, SevPill, Stamp, StatePill, Steps, TONE, useOperator } from "../ui";
import { JUMP_LABEL, STEP_INDEX, STEP_ORDER, firstOpenFrom } from "../../../lib/ops-sos";
import { liveCustomer, liveHealth } from "../../../lib/ops-health";
import { useAuth } from "../../../lib/auth";
import { useAppState } from "../../../lib/state";
import { fmtDateTime, fmtElapsed, fmtTime } from "../../../lib/ops-time";
import { guardianOf, resultLabel, stepSummary, stepTitle } from "./helpers";
import StepForm from "./StepForms";
import { ReportView, ResolvePanel } from "./CloseReport";

function defaultSub(k, c) {
  const main = guardianOf(c, "주");
  const sub = guardianOf(c, "부");
  switch (k) {
    case "confirm": return "수치·위치·기기 상태를 확인하고 기록";
    case "call1": return `어르신 ${c.phone} · 전화 연결을 시도합니다`;
    case "call2": return "1차 미연결 시 진행";
    case "call3": return "2차 미연결 시 자동 활성";
    case "guardian1": return main ? `${main.name}(${main.rel}) · 전화·앱 알림` : "주 보호자 등록 없음";
    case "guardian2": return sub ? `${sub.name}(${sub.rel}) · ${sub.place}` : "부 보호자 등록 없음 — 건너뛸 수 있음";
    case "notice": return "미연결 시 119 신고 예정 통보 (보호자·컨시어지)";
    case "call119": return "전달용 고객정보 자동 요약 · 신고 후 접수번호 기록";
    case "dispatch": return `근접 컨시어지 자동 추천 · 관제사 승인 후 파견 (${c.district})`;
    case "arrive": return "수락·출발·도착 시각과 현장 조치 기록";
    case "transfer": return "119 이송 · 병원 동행 · 보호자 인계 중 하나";
    case "close": return "결과 필수 선택 · 사유·조치결과 입력 · 권한 있는 관제사만";
    case "report": return "종료 후 발생~종료 기록을 시간순으로 자동 정리";
    default: return "";
  }
}

// 단계 메모 — 처리 중이든 종료 뒤든 지난 단계로 돌아가 메모를 남긴다 (2026-10-05 현장 요청).
// 사후 기록이라 고친 흔적이 남아야 한다: 메모는 덮어쓰지 않고 한 줄씩 쌓으며, 추가 · 수정한 시각(날짜 시:분)과
// 관제사를 같이 남긴다. 수정은 원래 메모를 지우지 않고 '수정' 줄을 새로 붙인다. 종료 뒤에 쓴 것은 '사후'로 표시한다.
function StepNotes({ inc, stepKey, api, ro, by }) {
  const rec = inc.steps?.[stepKey] || {};
  const notes = rec.notes || [];
  const [open, setOpen] = useState(null); // null | "new" | 수정할 메모 id
  const [text, setText] = useState("");
  const edited = new Set(notes.filter((n) => n.editOf).map((n) => n.editOf));
  const save = () => {
    const v = text.trim();
    if (!v) return;
    const now = Date.now();
    const note = { id: `n${now}`, at: now, by, text: v, after: inc.state === "closed", ...(open !== "new" ? { editOf: open } : {}) };
    api.update(inc.id, { steps: { ...(inc.steps || {}), [stepKey]: { ...rec, notes: [...notes, note] } } });
    setOpen(null);
    setText("");
  };
  return (
    <div className="mt-1.5 space-y-1">
      {notes.map((n) => {
        const orig = n.editOf ? notes.find((x) => x.id === n.editOf) : null;
        return (
          <div key={n.id} className={`rounded-lg px-2.5 py-1.5 text-[12px] leading-[1.55] ${edited.has(n.id) ? "bg-navy/[.03] text-muted line-through decoration-muted/60" : "bg-gold/[.08] text-ink"}`}>
            <span className="font-num font-bold text-navy no-underline">{fmtDateTime(n.at)}</span>{" "}
            <span className="font-bold">{n.editOf ? "메모 수정" : "메모 추가"}</span>
            {n.after && <span className="ml-1 rounded bg-amber/15 px-1 text-[10.5px] font-bold text-amber">사건 종료 뒤</span>}
            <span className="text-muted"> · {n.by}</span>
            {orig && <span className="text-muted"> · {fmtDateTime(orig.at)} 메모를 고침</span>}
            <div>{n.text}</div>
            {!ro && !edited.has(n.id) && open === null && (
              <button type="button" onClick={() => { setOpen(n.id); setText(n.text); }} className="btn-press btn-inline text-[11px] font-bold text-navy underline underline-offset-2">
                수정
              </button>
            )}
          </div>
        );
      })}
      {!ro && (open === null ? (
        <button type="button" onClick={() => { setOpen("new"); setText(""); }} className="btn-press btn-inline text-[12px] font-bold text-navy underline underline-offset-2">
          + 메모 {notes.length ? "더 " : ""}남기기
        </button>
      ) : (
        <div className="rounded-lg border border-navy/15 bg-white p-2">
          <textarea
            aria-label={`${STEP_ORDER.find((x) => x.k === stepKey)?.title || stepKey} 메모`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-navy/10 px-2 py-1.5 text-[13px] text-ink outline-none focus:border-gold"
            placeholder="추가 · 수정한 시각(날짜 시:분)과 관제사 이름이 같이 남습니다"
          />
          <div className="mt-1.5 flex justify-end gap-1.5">
            <Btn ghost small tone="muted" onClick={() => { setOpen(null); setText(""); }}>닫기</Btn>
            <Btn small disabled={!text.trim()} onClick={save}>{open === "new" ? "메모 저장" : "수정 저장"}</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IncidentDetail({ inc, now, api, role, onClosePopup }) {
  const appState = useAppState()?.state;
  const ob = appState?.onboarding;
  const c = liveCustomer(inc.customer, ob, appState?.health);
  const h = liveHealth(inc.customer, ob, !!useAuth().user?.household);
  const [infoOpen, setInfoOpen] = useState(true);
  const [resolveAt, setResolveAt] = useState(null); // 해결 완료 패널 — 단계 키 (어느 단계에서든 종료)
  const [jump, setJump] = useState(null); // 바로 이동 확인 — "call119" | "dispatch"
  const ro = role !== "controller";
  const closed = inc.state === "closed";
  // 처리 기록의 관제사 — 테스트 계정이면 로그인한 이름 (예시 관제사 이름을 박아 두지 않는다)
  const operator = useOperator().replace(/ \(관제사\)$/, "");
  // 지금 진행 중인 단계 — 가리키는 단계가 이미 끝나 있으면(예전 기록) 다음 빈 단계
  const activeK = closed ? null : inc.steps?.[inc.step]?.result ? firstOpenFrom(inc.steps, (STEP_INDEX[inc.step] ?? 0) + 1) : inc.step;
  // 어느 단계에서든 119 신고 · 담당자 파견으로 바로 (2026-10-05 현장 요청) — 아직 안 했고 지금 단계보다 뒤일 때
  const canJump = (t) => !closed && !ro && !inc.steps?.[t]?.result && (STEP_INDEX[t] ?? 0) > (STEP_INDEX[activeK] ?? 99);
  const jumpOver = jump ? STEP_ORDER.slice(STEP_INDEX[activeK] ?? 0, STEP_INDEX[jump]).filter((x) => !inc.steps?.[x.k]?.result) : [];
  const scrollToActive = () => setTimeout(() => document.getElementById(`active-${inc.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  const sevTone = SEV[inc.sev]?.tone || "danger";
  const main = guardianOf(c, "주");
  const sub = guardianOf(c, "부");
  // 통화가 '연결'로 저장되면 그 자리에서 해결 완료를 권한다 — 다음 단계로 넘어가도 바로 끝낼 수 있게 (2026-10-05)
  const openResolve = (k) => {
    setResolveAt(k);
    setTimeout(() => document.getElementById(`resolve-${inc.id}-${k}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };
  const apiX = {
    ...api,
    setStep: (id, k, rec, opts) => {
      api.setStep(id, k, rec, { ...opts, by: operator });
      if (rec?.result === "connected") setResolveAt(k);
    },
    resolveHere: openResolve, // 단계 폼의 '저장하고 여기서 해결'
  };
  // 해결 완료 패널 — 고른 단계 바로 아래에 연다 (지난 단계를 눌러도 그 자리에서)
  const panelFor = (k) =>
    !closed && resolveAt === k ? (
      <div id={`resolve-${inc.id}-${k}`} className="mt-2">
        <ResolvePanel key={k} inc={inc} api={api} role={role} stepKey={k} onPick={openResolve} onDone={() => setResolveAt(null)} onCancel={() => setResolveAt(null)} />
      </div>
    ) : null;

  const steps = STEP_ORDER.map((s) => {
    const rec = inc.steps?.[s.k];
    let state = "wait";
    // 미연결 · 거절 · 통화불가는 '못 함'으로 — 초록(완료)은 연결 · 완료만
    if (rec?.result) state = rec.result === "skip" ? "skip" : ["noanswer", "refused", "unavailable"].includes(rec.result) ? "fail" : "done";
    else if (!closed && s.k === activeK) state = "active";
    if (closed && (s.k === "close" || s.k === "report")) state = "done";
    const right = rec?.result ? `${resultLabel(rec)} · ${fmtTime(rec.at)}` : state === "active" ? "진행 중" : rec?.tries?.length ? `시도 ${rec.tries.length}회` : undefined;
    // 기록이 있는 단계(완료 · 건너뜀 · 미연결 · 메모)와 지금 단계는 메모를 남길 수 있다 — 종료 뒤에도
    const notable = !!rec || state === "active" || (closed && ["close", "report"].includes(s.k));
    const summary = stepSummary(rec) || defaultSub(s.k, c);
    // 지난 단계(결과가 남은 단계)에도 '이 단계에서 해결 완료' — 다음 단계로 넘어간 뒤 돌아와 끝낼 수 있게 (2026-10-05 현장 요청)
    const canResolveHere = !closed && !ro && !["close", "report"].includes(s.k) && rec?.result && rec.result !== "skip" && state !== "active";
    // 건너뛴 단계(바로 이동 · 직접 건너뜀 · 본인 연결로 생략)는 사건이 열려 있는 동안 다시 진행할 수 있다
    const canRedo = !closed && !ro && rec?.result === "skip";
    const sub = notable ? (
      <>
        {summary}
        <StepNotes inc={inc} stepKey={s.k} api={api} ro={ro} by={operator} />
        {canResolveHere && resolveAt !== s.k && (
          <button type="button" onClick={() => openResolve(s.k)} className="btn-press btn-inline mt-1 text-[12px] font-bold text-green underline underline-offset-2">
            이 단계에서 해결 완료
          </button>
        )}
        {canRedo && (
          <button type="button" onClick={() => { api.redo(inc.id, s.k, operator); scrollToActive(); }} className="btn-press btn-inline mt-1 text-[12px] font-bold text-navy underline underline-offset-2">
            이 단계 다시 진행
          </button>
        )}
        {state !== "active" && panelFor(s.k)}
      </>
    ) : summary;
    return { k: s.k, title: s.title, state, right, sub };
  });

  const stamp = (f) => (now && f?.agoSec != null ? fmtTime(now - f.agoSec * 1000) : "—");
  const lastNormal = h.noDevice ? "워치 없음 — 받은 건강 데이터 없음" : inc.customer === "박말순" ? "걸음 감지 · 심박 84 bpm" : inc.customer === "김순자" ? "심박 96 bpm · 혈중산소 96%" : `심박 ${h.restHr.v} bpm · 혈중산소 ${h.spo2.v}%`;

  return (
    <Panel style={{ boxShadow: closed ? undefined : `inset 0 0 0 1.5px ${TONE[sevTone].bar}66` }}>
      {/* 상단 — 이름·사건번호·위험등급·경과시간 타이머 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={c.name} size={48} tone={closed ? "muted" : sevTone} />
          <div className="min-w-0">
            <div className="font-num text-[12px] font-bold text-muted">{inc.id}</div>
            <h3 className="text-[18px] font-bold leading-tight" style={{ color: closed ? "#0A1F3C" : TONE[sevTone].fg }}>
              {c.name} 고객 · {inc.cause}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
              <span>{c.age ?? "—"}세 · {c.district} · <span className="font-num">{fmtTime(inc.startedAt)}</span> 발생</span>
              <SevPill sev={inc.sev} />
              <StatePill state={inc.state} />
              {inc.controller ? <Pill tone="info">관제사 {inc.controller}</Pill> : <Pill tone="warn">담당자 없음</Pill>}
              {(inc.alerts || 0) > 1 && <Pill tone="muted">반복 알림 {inc.alerts}건 병합</Pill>}
            </div>
            {/* 병합된 최근 신호 — 어르신 SOS 버튼 발신처럼 사건 제목(첫 이상징후)과 다른 신호가 접힌 로그에만 있으면 안 된다 */}
            {inc.signals?.length > 1 && (
              <div className="mt-1 text-[12px] font-semibold text-ink">
                최근 신호 <span className="font-num text-muted">{fmtTime(inc.signals[inc.signals.length - 1].at)}</span> ·{" "}
                {inc.signals[inc.signals.length - 1].text}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl px-4 py-2 text-center" style={{ background: closed ? TONE.muted.bg : TONE[sevTone].fg, color: closed ? TONE.muted.fg : "#fff" }}>
          <div className="text-[11px] font-bold opacity-90">{closed ? "종료 · 총 소요" : `${SEV[inc.sev]?.label} · 경과`}</div>
          <div className="font-num text-[24px] font-bold leading-none">{closed ? fmtElapsed((inc.closed?.at ?? 0) - inc.startedAt) : now ? fmtElapsed(now - inc.startedAt) : "--:--"}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {inc.state === "new" && <Btn small tone="danger" disabled={ro} onClick={() => api.ack(inc.id, operator)}>사건 확인 (담당 {operator})</Btn>}
        {!inc.controller && inc.state !== "new" && <Btn small disabled={ro} onClick={() => api.assign(inc.id, operator)}>담당 배정 · {operator}</Btn>}
        {/* 어느 단계에서든 — 해결 완료(지금 단계, 패널에서 해결한 단계를 바꿀 수 있다) · 119 신고 · 담당자 파견 */}
        {!closed && <Btn small tone="ok" disabled={ro} onClick={() => openResolve(activeK)}>해결 완료</Btn>}
        {canJump("call119") && <Btn ghost small tone="danger" onClick={() => setJump("call119")}>119 신고로</Btn>}
        {canJump("dispatch") && <Btn ghost small tone="navy" onClick={() => setJump("dispatch")}>담당자 파견으로</Btn>}
        {!closed && <Btn ghost small tone="warn" disabled={ro} onClick={() => api.addSignal(inc.id, "추가 이상징후 수신 — 같은 사건에 병합 (데모)")}>추가 이상징후 병합</Btn>}
        <Btn ghost small tone="muted" onClick={() => setInfoOpen(!infoOpen)}>{infoOpen ? "고정정보 접기" : "고정정보 펼치기"}</Btn>
        <span className="flex-1" />
        <Btn ghost small tone="muted" onClick={onClosePopup} title="사건은 종료되지 않고 목록에 남습니다">팝업 닫기 · 사건 유지</Btn>
      </div>

      {/* 6-2 사건 상단 고정정보 */}
      {infoOpen && (
        <div className="mt-3 grid grid-cols-1 gap-x-6 rounded-xl bg-navy/[.03] px-3 py-1 sm:grid-cols-2">
          <KV k="사건번호" v={inc.id} mono />
          <KV k="위험등급" v={<SevPill sev={inc.sev} />} />
          <KV k="이상징후" v={inc.cause} />
          <KV k="실제 측정값" v={inc.value} tone={sevTone} />
          <KV k="설정 기준값" v={inc.threshold} />
          <KV k="발생 시각" v={fmtTime(inc.startedAt)} mono />
          <KV k="경과시간" v={closed ? fmtElapsed((inc.closed?.at ?? 0) - inc.startedAt) : now ? fmtElapsed(now - inc.startedAt) : "--:--"} mono />
          <KV k="현재 위치" v={<span>{h.location.v} <FeedPill feed={h.location.feed} /> <Stamp at={stamp(h.location)} /> · 좌표 지도 연동 대기</span>} />
          <KV k="자택 주소" v={c.address} />
          <KV k="마지막 정상 데이터" v={lastNormal} />
          <KV k="주요 질환" v={c.conditions.join(" · ")} />
          <KV k="복용약" v={c.meds.join(" · ")} />
          <KV k="알레르기" v={c.allergies.join(" · ")} />
          <KV k="주·부 보호자" v={`${main ? `${main.name}(${main.rel}·${main.place})` : "주 보호자 없음"} · ${sub ? `${sub.name}(${sub.rel}·${sub.place})` : "부 보호자 없음"}`} />
          <KV k="담당 컨시어지" v={`주 ${c.concierge.main} · 부 ${c.concierge.sub}`} />
          <KV k="사전동의" v={`${c.consent.entry} · ${c.consent.measure}`} />
          <KV k="현재 처리단계" v={closed ? "종료 · 상황보고서" : stepTitle(inc.step)} tone="info" />
        </div>
      )}

      {/* 반복 알림 병합 · 추가 이상징후 */}
      {inc.signals?.length > 0 && (
        <details className="mt-3 rounded-xl bg-navy/[.03] px-3 py-2">
          <summary className="cursor-pointer text-[12px] font-bold text-muted">이상징후 로그 {inc.signals.length}건 (같은 사건에 병합)</summary>
          <ul className="mt-1 space-y-0.5 text-[12px] text-ink">
            {inc.signals.map((s, i) => <li key={`${s.at}-${i}`}><span className="font-num text-muted">{fmtTime(s.at)}</span> · {s.text}</li>)}
          </ul>
        </details>
      )}

      <div className="mt-4 flex items-center justify-between">
        <h4 className="text-[14px] font-bold text-navy">대응 진행상황</h4>
        <span className="text-[12px] text-muted">담당 관제사 {inc.controller || "미배정"} · 권한 {ro ? "조회 전용" : "관제사"}</span>
      </div>
      <div className="mt-3">
        <Steps steps={steps}>
          {(s) => (
            <>
              <div id={`active-${inc.id}`} />
              <StepForm key={s.k} inc={inc} stepKey={s.k} api={apiX} role={role} />
              {/* 지금 단계에서 바로 — 119 신고 · 담당자 파견으로 가거나 여기서 끝낸다. 통화 · 확인 단계는 폼 안의
                  '저장하고 여기서 해결'로 입력한 내용까지 남긴다. 지난 단계에서 해결됐으면 그 단계의 링크를 누른다 */}
              {!closed && !["close", "report"].includes(s.k) && resolveAt !== s.k && (
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                  <span className="mr-auto text-[11.5px] font-bold text-muted">이 단계에서 바로</span>
                  {canJump("call119") && <Btn ghost small tone="danger" onClick={() => setJump("call119")}>119 신고로</Btn>}
                  {canJump("dispatch") && <Btn ghost small tone="navy" onClick={() => setJump("dispatch")}>담당자 파견으로</Btn>}
                  {!["confirm", "call1", "call2", "call3", "guardian1", "guardian2"].includes(s.k) && <Btn ghost small tone="ok" disabled={ro} onClick={() => openResolve(s.k)}>이 단계에서 해결 완료</Btn>}
                </div>
              )}
              {panelFor(s.k)}
            </>
          )}
        </Steps>
      </div>

      {closed && <div className="mt-4"><ReportView inc={inc} api={api} role={role} /></div>}
      <Confirm
        open={!!jump}
        title={jump === "call119" ? "119 신고 단계로 바로 갑니다" : "담당자 파견 단계로 바로 갑니다"}
        body={jump ? `${jumpOver.map((x) => x.title).join(" · ") || "남은 단계 없음"} — ${jumpOver.length}단계는 '건너뜀 — ${JUMP_LABEL[jump]}'으로 남습니다. 건너뛴 단계는 '이 단계 다시 진행'으로 언제든 다시 할 수 있습니다.` : ""}
        confirmLabel={jump === "call119" ? "119 신고로" : "담당자 파견으로"}
        tone={jump === "call119" ? "danger" : "navy"}
        onCancel={() => setJump(null)}
        onConfirm={() => {
          api.jumpTo(inc.id, jump, operator);
          setJump(null);
          setResolveAt(null);
          scrollToActive();
        }}
      />
    </Panel>
  );
}
