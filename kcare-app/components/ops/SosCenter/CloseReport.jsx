// 사건 종료(6-7)와 사후 상황보고서 — 결과·사유·조치결과 필수, 권한 있는 관제사만, Confirm 을 거친다.
// 종료 후에는 발생~종료 기록을 시간순으로 자동 정리하고 보호자 전달용 문구 초안을 만든다.
import { useState } from "react";
import { Btn, Confirm, Field, KV, Note, Pill, Table, TONE } from "../ui";
import { CLOSE_RESULTS } from "../../../lib/ops-sos";
import { getCustomer } from "../../../lib/ops-health";
import { fmtDateTime, fmtDur, fmtTime } from "../../../lib/ops-time";
import { buildTimeline } from "./helpers";

export function CloseForm({ inc, api, role }) {
  const [result, setResult] = useState("");
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [ask, setAsk] = useState(false);
  const ro = role !== "controller";
  const valid = result && reason.trim() && outcome.trim();
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
          api.close(inc.id, { result, reason: reason.trim(), outcome: outcome.trim(), by: "김태영" });
          setAsk(false);
        }}
      />
    </div>
  );
}

function draftForGuardian(inc, c, timeline) {
  const first = timeline[0]?.at ?? inc.startedAt;
  const end = inc.closed?.at ?? Date.now();
  const calls = ["call1", "call2", "call3"].filter((k) => inc.steps?.[k]?.tries?.length).length;
  const dispatched = inc.steps?.dispatch?.dispatch;
  const r119 = inc.steps?.call119?.report;
  return [
    `[K-CARE 관제센터] ${c.name} 어르신 보호자님께 상황을 알려드립니다.`,
    `· 발생: ${fmtDateTime(first)} — ${inc.cause} (${inc.value})`,
    `· 대응: 관제사 ${inc.controller || "김태영"}이(가) 어르신께 ${calls}차례 연락을 시도했고${dispatched ? `, 컨시어지 ${dispatched.name}이(가) 현장을 방문했습니다` : ""}${r119 ? `, ${r119.agency}에 신고했습니다` : ""}.`,
    `· 결과: ${inc.closed?.result || "—"} — ${inc.closed?.outcome || "—"}`,
    `· 종료: ${fmtDateTime(end)} (발생 후 ${fmtDur(end - first)})`,
    "추가 확인이 필요하시면 관제센터로 연락 주세요. 건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.",
  ].join("\n");
}

export function ReportView({ inc, api, role }) {
  const c = getCustomer(inc.customer);
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
