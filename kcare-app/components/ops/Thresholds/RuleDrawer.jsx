// 기준 편집 서랍 — 요청서 4절. 정상/주의/위험·지속·반복·시간대·적용 대상·알림방법·자동 SOS·사용 여부.
// 변경 사유는 필수이며, 저장 시 변경 전·후 값이 이력으로 넘어간다 (감사기록).
import { useState } from "react";
import { Btn, Drawer, Field, Note, Pill, Toggle } from "../ui";
import { ACTIONS, FIELD_LABELS, SCOPES, WINDOWS } from "../../../lib/ops-thresholds";
import { CUSTOMERS } from "../../../lib/ops-health";

const EDITABLE = ["normal", "warn", "danger", "duration", "repeat", "window", "action", "autoSos", "on"];
const show = (k, v) => (k === "autoSos" || k === "on" ? (v ? "사용" : "미사용") : v || "—");

export default function RuleDrawer({ open, rule, preset, exception, onClose, onSave }) {
  if (!open || !rule) return null;
  return <Body key={`${rule.id}-${exception?.id || "base"}`} rule={rule} preset={preset} exception={exception} onClose={onClose} onSave={onSave} />;
}

function Body({ rule, preset, exception, onClose, onSave }) {
  const [f, setF] = useState({ ...rule, ...(preset || {}) });
  const [scope, setScope] = useState(exception ? SCOPES[1] : SCOPES[0]);
  const [customer, setCustomer] = useState(exception?.customer || "김순자");
  const [reason, setReason] = useState("");
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const changes = EDITABLE.filter((k) => f[k] !== rule[k]).map((k) => ({ field: FIELD_LABELS[k], k, before: show(k, rule[k]), after: show(k, f[k]) }));
  const personal = scope === SCOPES[1];
  const valid = reason.trim().length >= 4 && (changes.length > 0 || personal);
  const id = `thr-${rule.id}`;
  const c = CUSTOMERS[customer];
  return (
    <Drawer
      open
      onClose={onClose}
      title={`${rule.name} · 기준 편집`}
      sub={personal ? `${customer} 고객 개별값 — 전체 기본값은 바뀌지 않습니다` : "전체 고객 기본값 — 관리자 승인 후 적용"}
      width={560}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] text-muted">변경 {changes.length}건 · {personal ? "개별값 저장" : "저장 후 승인 대기"}</span>
          <div className="flex gap-2">
            <Btn ghost tone="muted" onClick={onClose}>취소</Btn>
            <Btn disabled={!valid} title={!valid ? "변경 사유(4자 이상)와 바뀐 값이 필요합니다" : undefined} onClick={() => onSave({ ruleId: rule.id, fields: f, changes, reason: reason.trim(), scope, customer: personal ? customer : null })}>
              저장
            </Btn>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field id={`${id}-scope`} label="적용 대상" value={scope} onChange={setScope} options={SCOPES} required hint="전체 기본값과 고객별 개별값은 분리해 저장됩니다" />
          {personal && <Field id={`${id}-customer`} label="고객" value={customer} onChange={setCustomer} options={Object.keys(CUSTOMERS)} required hint={c?.conditions ? `기저질환: ${c.conditions.join(" · ")}` : undefined} />}
        </div>
        {personal && (
          <Note tone="gold">고령자마다 기저질환과 평상시 수치가 다르므로 개인 기준을 적용합니다. 개별값은 이 고객에게만 적용되고, 표준 기준과 나란히 이력에 남습니다.</Note>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Field id={`${id}-normal`} label="정상 기준" value={f.normal} onChange={set("normal")} />
          <Field id={`${id}-warn`} label="주의 기준" value={f.warn} onChange={set("warn")} required />
          <Field id={`${id}-danger`} label="위험 기준" value={f.danger} onChange={set("danger")} required />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field id={`${id}-duration`} label="기준 초과·미달 지속시간" value={f.duration} onChange={set("duration")} placeholder="예: 2분 지속" />
          <Field id={`${id}-repeat`} label="일정 시간 내 반복 횟수" value={f.repeat} onChange={set("repeat")} placeholder="예: 1시간 내 3회" />
          <Field id={`${id}-window`} label="적용 시간대" value={f.window} onChange={set("window")} options={WINDOWS.includes(f.window) ? WINDOWS : [f.window, ...WINDOWS]} />
          <Field id={`${id}-action`} label="알림방법" value={f.action} onChange={set("action")} options={ACTIONS.includes(f.action) ? ACTIONS : [f.action, ...ACTIONS]} />
        </div>
        <div className="flex flex-wrap gap-6 rounded-xl bg-navy/[.04] px-3 py-2.5 text-[13px] text-ink">
          <span className="flex items-center gap-2">
            <Toggle id={`${id}-autoSos`} on={!!f.autoSos} onChange={set("autoSos")} label="자동 SOS 전환 여부" />
            자동 SOS 전환 {f.autoSos ? "사용" : "미사용"}
          </span>
          <span className="flex items-center gap-2">
            <Toggle id={`${id}-on`} on={!!f.on} onChange={set("on")} label="사용 여부" />
            기준 {f.on ? "사용" : "미사용"}
          </span>
        </div>
        <Field id={`${id}-reason`} label="변경 사유" value={reason} onChange={setReason} type="textarea" required placeholder="왜 바꾸는지 — 감사기록에 그대로 남습니다" />
        {changes.length > 0 && (
          <div className="rounded-xl bg-navy/[.04] px-3 py-2">
            <div className="text-[11px] font-bold text-muted">변경 미리보기 (전 → 후)</div>
            <ul className="mt-1 space-y-0.5 text-[12px] text-ink">
              {changes.map((ch) => (
                <li key={ch.k} className="flex flex-wrap items-center gap-1.5">
                  <Pill tone="muted">{ch.field}</Pill>
                  <span className="text-muted line-through">{ch.before}</span>
                  <span>→</span>
                  <span className="font-bold text-navy">{ch.after}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!personal && <Note tone="warn">관리자 승인 후 전체 고객에게 적용됩니다. 저장하면 “승인 대기” 상태로 이력에 기록됩니다.</Note>}
      </div>
    </Drawer>
  );
}
