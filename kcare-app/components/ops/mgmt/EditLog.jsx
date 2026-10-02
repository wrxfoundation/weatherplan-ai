// [정보 수정] 공용 — 수정 사유 없이는 저장되지 않고, 저장은 덮어쓰기가 아니라 이력 한 줄 추가다.
// 어르신·보호자·컨시어지 관리가 같이 쓴다 (요청서 7·8·9절 수정이력 · 17절 감사로그).
import { useState } from "react";
import { Drawer, Btn, Field, Table, Note, KV, Empty } from "../ui";
import { OPERATOR } from "../../../lib/ops-mgmt";

const PICK = "선택하세요";

// fields: [{ k, label, value, options?, apply?(entity, after) → entity }]
// 부모는 이 컴포넌트를 열 때만 렌더한다 — 대상이 바뀌면 입력값이 남지 않도록.
export function EditDrawer({ title, sub, fields, onClose, onSave }) {
  const [label, setLabel] = useState(fields[0]?.label || "");
  const [after, setAfter] = useState("");
  const [reason, setReason] = useState("");
  const f = fields.find((x) => x.label === label) || fields[0];
  const val = after === PICK ? "" : after.trim();
  const canSave = Boolean(f) && val.length > 0 && reason.trim().length >= 4 && val !== String(f.value);
  const pick = (l) => {
    setLabel(l);
    setAfter("");
  };
  return (
    <Drawer
      open
      title={title}
      sub={sub}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted">
            수정자 {OPERATOR.name} · {OPERATOR.role} · {OPERATOR.account}
          </span>
          <div className="flex gap-2">
            <Btn ghost tone="muted" onClick={onClose}>취소</Btn>
            <Btn disabled={!canSave} onClick={() => onSave(f, val, reason.trim())} title={canSave ? undefined : "수정 후 값과 사유(4자 이상)가 있어야 저장됩니다"}>
              사유와 함께 저장
            </Btn>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <Field id="edit-field" label="수정 항목" value={f?.label || ""} onChange={pick} options={fields.map((x) => x.label)} />
        <KV k="수정 전" v={String(f?.value ?? "—")} />
        {f?.options ? (
          <Field id="edit-after" label="수정 후" value={after || PICK} onChange={setAfter} options={[PICK, ...f.options]} required />
        ) : (
          <Field id="edit-after" label="수정 후" value={after} onChange={setAfter} placeholder="새 값" required />
        )}
        <Field
          id="edit-reason"
          label="수정 사유"
          type="textarea"
          value={reason}
          onChange={setReason}
          placeholder="누가 왜 요청했는지 · 근거 (4자 이상)"
          required
          hint="사유 없이는 저장되지 않습니다. 저장하면 기존 값은 지워지지 않고 이력으로 보존됩니다."
        />
        <Note>수정일시 · 접속계정 · 이름 · 권한 · 항목 · 수정 전 · 수정 후 · 사유가 감사로그에 남습니다. 일반 사용자는 이력을 삭제·수정할 수 없습니다.</Note>
      </div>
    </Drawer>
  );
}

const COLS = [
  { k: "at", label: "수정일시", render: (r) => <span className="font-num whitespace-nowrap">{r.at}</span> },
  {
    k: "who",
    label: "계정 · 이름 · 권한",
    render: (r) => (
      <span>
        {r.name} <span className="text-muted">({r.role})</span>
        <span className="block text-[11px] text-muted">{r.account}</span>
      </span>
    ),
  },
  { k: "field", label: "항목" },
  { k: "before", label: "수정 전", render: (r) => <span className="text-muted">{r.before}</span> },
  { k: "after", label: "수정 후", render: (r) => <span className="font-bold text-navy">{r.after}</span> },
  { k: "reason", label: "사유" },
];

export function HistoryTable({ rows }) {
  if (!rows.length) return <Empty>수정 이력이 없습니다. 정보를 수정하면 사유와 함께 여기에 쌓입니다.</Empty>;
  return <Table dense cols={COLS} rows={rows} rowKey={(r, i) => `${r.at}-${i}`} />;
}
