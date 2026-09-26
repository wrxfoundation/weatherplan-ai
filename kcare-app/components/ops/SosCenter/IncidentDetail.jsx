// 사건 상세 (가운데 열) — 6-2 상단 고정정보 전부 · 6-3 13단계 타임라인 · 종료 후 상황보고서.
// 팝업을 닫아도 사건은 목록에 남는다 — 닫기는 선택 해제일 뿐이다 (6-1 · 19절).
import { useState } from "react";
import { Avatar, Btn, FeedPill, KV, Panel, Pill, SEV, SevPill, Stamp, StatePill, Steps, TONE } from "../ui";
import { STEP_ORDER } from "../../../lib/ops-sos";
import { getCustomer, getHealth } from "../../../lib/ops-health";
import { fmtElapsed, fmtTime } from "../../../lib/ops-time";
import { guardianOf, resultLabel, stepSummary, stepTitle } from "./helpers";
import StepForm from "./StepForms";
import { ReportView } from "./CloseReport";

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

export default function IncidentDetail({ inc, now, api, role, onClosePopup }) {
  const c = getCustomer(inc.customer);
  const h = getHealth(inc.customer);
  const [infoOpen, setInfoOpen] = useState(true);
  const ro = role !== "controller";
  const closed = inc.state === "closed";
  const sevTone = SEV[inc.sev]?.tone || "danger";
  const main = guardianOf(c, "주");
  const sub = guardianOf(c, "부");

  const steps = STEP_ORDER.map((s) => {
    const rec = inc.steps?.[s.k];
    let state = "wait";
    if (rec?.result) state = rec.result === "skip" ? "skip" : rec.result === "noanswer" ? "fail" : "done";
    else if (!closed && s.k === inc.step) state = "active";
    if (closed && (s.k === "close" || s.k === "report")) state = "done";
    const right = rec?.result ? `${resultLabel(rec)} · ${fmtTime(rec.at)}` : state === "active" ? "진행 중" : rec?.tries?.length ? `시도 ${rec.tries.length}회` : undefined;
    return { k: s.k, title: s.title, state, right, sub: stepSummary(rec) || defaultSub(s.k, c) };
  });

  const stamp = (f) => (now ? fmtTime(now - (f?.agoSec ?? 0) * 1000) : "—");
  const lastNormal = inc.customer === "박말순" ? "걸음 감지 · 심박 84 bpm" : inc.customer === "김순자" ? "심박 96 bpm · 혈중산소 96%" : `심박 ${h.restHr.v} bpm · 혈중산소 ${h.spo2.v}%`;

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
        {inc.state === "new" && <Btn small tone="danger" disabled={ro} onClick={() => api.ack(inc.id, "김태영")}>사건 확인 (담당 김태영)</Btn>}
        {!inc.controller && inc.state !== "new" && <Btn small disabled={ro} onClick={() => api.assign(inc.id, "김태영")}>담당 배정 · 김태영</Btn>}
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
        <Steps steps={steps}>{(s) => <StepForm key={s.k} inc={inc} stepKey={s.k} api={api} role={role} />}</Steps>
      </div>

      {closed && <div className="mt-4"><ReportView inc={inc} api={api} role={role} /></div>}
    </Panel>
  );
}
