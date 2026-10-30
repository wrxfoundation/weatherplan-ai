// 관제 컨시어지 관리 상세 — 탭마다 [편집] (2026-10-28 업데이트 요청 3).
// 편집 → 입력칸 → 취소 / 저장(수정 사유 4자 이상 필수). 저장하면 가구 기록(state.conciergeProfiles)에 남고
// 바뀐 칸마다 평가·이력 › 수정이력에 한 줄('누가 · 언제 · 무엇을 · 사유'). 목록 표 · 숫자 카드가 같은 값을 읽는다.
// 근무시간 · 오늘 배차 · 피로도 · 위치 · 오늘 일정 · 미수락 · SOS 출동이력은 앱이 계산하는 값이라 편집 칸이 없다.
// 담당 고객 추가 · 해제는 어르신 관리 [담당 컨시어지 변경]과 같은 확인 창(StaffChange)을 쓴다.
import { useState } from "react";
import { Btn, Confirm, Field, Note, Toggle } from "../ui";
import {
  EVAL_ITEMS,
  ISSUE_KINDS,
  NO_STAFF,
  STAFF_CONTRACTS,
  STAFF_ROLES,
  VIEW_ONLY_NOTE,
  WEEK_DAYS,
  certLine,
  issueLine,
  leaveTextOf,
  reasonOk,
  trainingLine,
  weekLine,
} from "../../../lib/ops-records";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const yn = (b) => (b ? "예" : "아니오");
const blank = (v) => (v && v !== "—" ? String(v) : "");
const todayYmd = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
// 앞뒤가 다른 칸만 수정이력 한 줄로
const diff = (pairs) => pairs.filter(([, a, b]) => a !== b).map(([field, before, after]) => ({ field, before: before || "—", after: after || "—" }));

// 탭 위 — 왼쪽은 앱이 채우는 칸(편집 안 함), 오른쪽 위에 [편집]. 관리자가 아니면 '보기만'
export function TabBar({ auto, canEdit, onEdit, label = "편집" }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <span className="min-w-0 flex-1 text-[11px] text-muted">{auto ? `자동(편집 안 함) — ${auto}` : ""}</span>
      {canEdit ? <Btn small onClick={onEdit}>{label}</Btn> : <span className="text-[11px] text-muted">{VIEW_ONLY_NOTE}</span>}
    </div>
  );
}

// 저장 — 바뀐 칸이 있고 사유가 4자 이상일 때만 (보호자 기본정보 편집도 같이 쓴다)
export function useSave(onSave) {
  const [reason, setReasonRaw] = useState("");
  const [err, setErr] = useState("");
  const setReason = (v) => {
    setReasonRaw(v);
    setErr("");
  };
  const save = (patch, fields, check, extra) => {
    if (check) return setErr(check);
    if (!fields.length) return setErr("바뀐 내용이 없습니다 — 고친 칸이 있어야 저장됩니다.");
    if (!reasonOk(reason)) return setErr("수정 사유를 4자 이상 적어야 저장됩니다.");
    onSave(patch, fields, reason.trim(), extra);
  };
  return { reason, setReason, err, setErr, save };
}

export function SaveBar({ id, s, onCancel, onSave, hint = "사유 없이는 저장되지 않습니다. 저장하면 바뀐 칸마다 평가·이력 › 수정이력에 남습니다." }) {
  return (
    <div className="mt-4 space-y-2 border-t border-navy/[.08] pt-3">
      <Field id={`${id}-reason`} label="수정 사유" type="textarea" value={s.reason} onChange={s.setReason} placeholder="누가 왜 요청했는지 · 근거 (4자 이상)" required hint={hint} />
      {s.err && <Note tone="warn">{s.err}</Note>}
      <div className="flex justify-end gap-2">
        <Btn ghost tone="muted" onClick={onCancel}>취소</Btn>
        <Btn onClick={onSave}>사유와 함께 저장</Btn>
      </div>
    </div>
  );
}

function Switch({ id, label, on, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-navy/[.04] px-3 py-2.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
      <Toggle id={id} on={on} onChange={onChange} label={label} />
    </div>
  );
}

// ── 근무현황 ──
export function WorkForm({ c, onSave, onCancel }) {
  const p = c.profile || {};
  const [init] = useState(() => ({
    branch: blank(c.branch),
    region: blank(c.region),
    workDays: blank(c.workDays),
    vehicle: !!c.vehicle,
    drive: typeof c.drive === "boolean" ? c.drive : !!c.vehicle,
    roleType: STAFF_ROLES.includes(c.roleType) ? c.roleType : STAFF_ROLES[1],
    emergency: !!c.emergency,
    contract: blank(c.contract) || STAFF_CONTRACTS[0],
    leaveFrom: p.leaveFrom || "",
    leaveTo: p.leaveTo || "",
    leaveNote: "leaveNote" in p ? p.leaveNote : blank(c.leave),
    rest: blank(c.rest),
    tel: blank(c.tel),
  }));
  const [f, setF] = useState(init);
  const s = useSave(onSave);
  const set = (k) => (v) => {
    setF((x) => ({ ...x, [k]: v }));
    s.setErr("");
  };
  const submit = () => {
    const t = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v]));
    const fields = diff([
      ["소속 지점", init.branch, t.branch],
      ["담당 가능지역", init.region, t.region],
      ["근무 요일 · 시간", init.workDays, t.workDays],
      ["차량 보유", yn(init.vehicle), yn(t.vehicle)],
      ["운전 가능", yn(init.drive), yn(t.drive)],
      ["주·부 담당 역할", init.roleType, t.roleType],
      ["긴급출동 가능", yn(init.emergency), yn(t.emergency)],
      ["계약상태", init.contract, t.contract],
      ["휴무 · 휴가", leaveTextOf(init), leaveTextOf(t)],
      ["휴식시간", init.rest, t.rest],
      ["연락처", init.tel, t.tel],
    ]);
    const bad = t.leaveFrom && t.leaveTo && t.leaveFrom > t.leaveTo ? "휴가 시작일이 끝나는 날보다 늦습니다." : "";
    s.save(t, fields, bad);
  };
  const contracts = [...new Set([init.contract, ...STAFF_CONTRACTS].filter(Boolean))];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sw-branch" label="소속 지점" value={f.branch} onChange={set("branch")} />
        <Field id="sw-region" label="담당 가능지역" value={f.region} onChange={set("region")} placeholder="예) 강남 · 서초" />
        <Field id="sw-work" label="근무 요일 · 시간" value={f.workDays} onChange={set("workDays")} placeholder="예) 월–금 09:00–18:00" />
        <Field id="sw-role" label="주·부 담당 역할" value={f.roleType} onChange={set("roleType")} options={STAFF_ROLES} />
        <Field id="sw-contract" label="계약상태" value={f.contract} onChange={set("contract")} options={contracts} />
        <Field id="sw-tel" label="연락처" type="tel" value={f.tel} onChange={set("tel")} placeholder="010-0000-0000" />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Switch id="sw-vehicle" label="차량 보유" on={f.vehicle} onChange={set("vehicle")} />
        <Switch id="sw-drive" label="운전 가능" on={f.drive} onChange={set("drive")} />
        <Switch id="sw-emg" label="긴급출동 가능" on={f.emergency} onChange={set("emergency")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="sw-leave-from" label="휴무 · 휴가 시작" type="date" value={f.leaveFrom} onChange={set("leaveFrom")} />
        <Field id="sw-leave-to" label="휴무 · 휴가 끝" type="date" value={f.leaveTo} onChange={set("leaveTo")} />
        <Field id="sw-leave-note" label="휴무 · 휴가 메모" value={f.leaveNote} onChange={set("leaveNote")} placeholder="예) 매주 수요일 휴무" />
      </div>
      <Field id="sw-rest" label="휴식시간" value={f.rest} onChange={set("rest")} placeholder="예) 점심 12:00–13:00" />
      <SaveBar id="sw" s={s} onCancel={onCancel} onSave={submit} />
    </div>
  );
}

// ── 일정·위치 › 주간 근무 일정 ──
export function WeekForm({ c, onSave, onCancel }) {
  const p = c.profile || {};
  // 저장한 적이 없으면 지금 보이는 주간 일정 줄을 요일 · 메모로 풀어 시작한다
  const [init] = useState(() =>
    Array.isArray(p.week)
      ? p.week
      : (c.week || []).map((w, i) => {
          const t = String(w);
          const day = WEEK_DAYS.find((d) => t.startsWith(d)) || WEEK_DAYS[0];
          return { id: `w${i}`, day, time: "", memo: t.startsWith(day) ? t.slice(day.length).trim() : t };
        })
  );
  const [rows, setRows] = useState(init);
  const s = useSave(onSave);
  const upd = (id, k) => (v) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
    s.setErr("");
  };
  const submit = () => {
    const clean = rows.map((r) => ({ ...r, time: r.time.trim(), memo: r.memo.trim() }));
    const after = clean.map(weekLine).join(" / ");
    const fields = after === init.map(weekLine).join(" / ") ? [] : [{ field: "주간 근무 일정", before: (c.week || []).join(" / ") || "없음", after: after || "없음" }];
    s.save({ week: clean }, fields);
  };
  return (
    <div>
      <p className="text-[11px] text-muted">현재 위치(체크인 GPS) · 오늘 일정(배차)은 앱 기록이라 여기서 고치지 않습니다.</p>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="grid items-end gap-2 rounded-xl bg-navy/[.04] p-2.5 sm:grid-cols-[90px_1fr_1.4fr_auto]">
            <Field id={`wk-day-${r.id}`} label="요일" value={r.day} onChange={upd(r.id, "day")} options={WEEK_DAYS} />
            <Field id={`wk-time-${r.id}`} label="시간" value={r.time} onChange={upd(r.id, "time")} placeholder="예) 09:00–18:00" />
            <Field id={`wk-memo-${r.id}`} label="메모" value={r.memo} onChange={upd(r.id, "memo")} placeholder="예) 방문 2건 · 오후 동행" />
            <Btn small ghost tone="muted" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} aria-label={`${r.day}요일 일정 삭제`}>삭제</Btn>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="mt-2 text-[12px] text-muted">주간 근무 일정이 없습니다.</p>}
      <div className="mt-2">
        <Btn small ghost onClick={() => setRows((rs) => [...rs, { id: newId("w"), day: WEEK_DAYS[0], time: "", memo: "" }])}>근무 일정 추가</Btn>
      </div>
      <SaveBar id="wk" s={s} onCancel={onCancel} onSave={submit} />
    </div>
  );
}

// ── 자격·교육 ── 자격증 추가 · 수정 · 삭제, 교육 이수는 추가 (요청서 표 그대로 — 저장한 이수 기록은 지우지 않는다)
export function CertForm({ c, onSave, onCancel }) {
  const p = c.profile || {};
  const [initCerts] = useState(() =>
    Array.isArray(p.certs) ? p.certs : (c.certs || []).map((x, i) => ({ id: `c${i}`, name: x.name, no: "", issued: "", until: YMD.test(x.until) ? x.until : "", file: "" }))
  );
  const [initTrain] = useState(() => (Array.isArray(p.trainings) ? p.trainings : (c.trainings || []).map((t, i) => ({ id: `t${i}`, name: String(t), date: "", hours: 0 }))));
  const [certs, setCerts] = useState(initCerts);
  const [added, setAdded] = useState([]); // 이번에 추가하는 교육 이수
  const s = useSave(onSave);
  const updC = (id, k) => (v) => {
    setCerts((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
    s.setErr("");
  };
  const updT = (id, k) => (v) => {
    setAdded((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
    s.setErr("");
  };
  const submit = () => {
    const cs = certs.map((x) => ({ ...x, name: x.name.trim(), no: x.no.trim() }));
    // 손대지 않은 빈 줄(오늘 날짜만 채워진 것)은 뺀다
    const ts = added.map((t) => ({ ...t, name: t.name.trim(), hours: Number(t.hours) || 0 })).filter((t) => t.name || t.hours || (t.date && t.date !== todayYmd()));
    const bad = cs.some((x) => !x.name)
      ? "자격명이 빈 줄이 있습니다 — 자격명을 적거나 그 줄을 삭제해 주세요."
      : cs.some((x) => x.issued && x.until && x.issued > x.until)
        ? "발급일이 유효기간보다 늦은 자격이 있습니다."
        : ts.some((t) => !t.name)
          ? "교육명이 빈 이수 기록이 있습니다."
          : "";
    const fields = diff([
      ["자격증", initCerts.map(certLine).join(" / "), cs.map(certLine).join(" / ")],
      ...(ts.length ? [["교육 이수 추가", "", ts.map(trainingLine).join(" / ")]] : []),
    ]);
    s.save({ certs: cs, trainings: [...initTrain, ...ts] }, fields, bad);
  };
  return (
    <div>
      <h3 className="text-[13px] font-bold text-navy">자격증</h3>
      <p className="mt-0.5 text-[11px] text-muted">유효기간이 30일 안으로 남으면 만료 임박으로 표시되고 숫자 카드 &lsquo;자격 만료임박&rsquo;에 잡힙니다. 첨부는 베타에서 파일을 올리지 않고 파일 이름만 기록합니다.</p>
      <ul className="mt-2 space-y-2">
        {certs.map((x) => (
          <li key={x.id} className="rounded-xl bg-navy/[.04] p-2.5">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id={`ct-name-${x.id}`} label="자격명" value={x.name} onChange={updC(x.id, "name")} required />
              <Field id={`ct-no-${x.id}`} label="자격 번호" value={x.no} onChange={updC(x.id, "no")} />
              <Field id={`ct-issued-${x.id}`} label="발급일" type="date" value={x.issued} onChange={updC(x.id, "issued")} />
              <Field id={`ct-until-${x.id}`} label="유효기간" type="date" value={x.until} onChange={updC(x.id, "until")} hint="기간이 없는 면허는 비워 둡니다" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor={`ct-file-${x.id}`} className="text-[11px] font-bold text-muted">첨부</label>
              <input id={`ct-file-${x.id}`} type="file" className="max-w-full text-[12px] text-ink" onChange={(ev) => updC(x.id, "file")(ev.target.files?.[0]?.name || x.file)} />
              {x.file && (
                <>
                  <span className="text-[12px] font-medium text-navy">{x.file}</span>
                  <Btn small ghost tone="muted" onClick={() => updC(x.id, "file")("")} aria-label={`${x.name || "자격"} 첨부 지우기`}>첨부 지우기</Btn>
                </>
              )}
              <Btn small ghost tone="muted" className="ml-auto" onClick={() => setCerts((rs) => rs.filter((r) => r.id !== x.id))} aria-label={`${x.name || "자격"} 삭제`}>자격 삭제</Btn>
            </div>
          </li>
        ))}
      </ul>
      {!certs.length && <p className="mt-2 text-[12px] text-muted">등록된 자격증이 없습니다.</p>}
      <div className="mt-2">
        <Btn small ghost onClick={() => setCerts((rs) => [...rs, { id: newId("c"), name: "", no: "", issued: "", until: "", file: "" }])}>자격증 추가</Btn>
      </div>

      <h3 className="mt-5 text-[13px] font-bold text-navy">교육 이수</h3>
      <ul className="mt-1.5 space-y-1 text-[13px] text-ink">
        {initTrain.map((t) => <li key={t.id}>{trainingLine(t)}</li>)}
        {!initTrain.length && <li className="text-[12px] text-muted">이수 기록이 없습니다.</li>}
      </ul>
      <ul className="mt-2 space-y-2">
        {added.map((t) => (
          <li key={t.id} className="grid items-end gap-2 rounded-xl bg-navy/[.04] p-2.5 sm:grid-cols-[1.6fr_1fr_90px_auto]">
            <Field id={`tr-name-${t.id}`} label="교육명" value={t.name} onChange={updT(t.id, "name")} required />
            <Field id={`tr-date-${t.id}`} label="날짜" type="date" value={t.date} onChange={updT(t.id, "date")} />
            <Field id={`tr-hours-${t.id}`} label="시간" type="number" value={t.hours} onChange={updT(t.id, "hours")} />
            <Btn small ghost tone="muted" onClick={() => setAdded((rs) => rs.filter((r) => r.id !== t.id))} aria-label="이 이수 기록 빼기">빼기</Btn>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <Btn small ghost onClick={() => setAdded((rs) => [...rs, { id: newId("t"), name: "", date: todayYmd(), hours: "" }])}>교육 이수 추가</Btn>
      </div>
      <SaveBar id="ct" s={s} onCancel={onCancel} onSave={submit} />
    </div>
  );
}

// ── 평가·이력 ── 내부평가 5항목 점수 + 코멘트, 민원 · 사고 기록 추가 (저장한 기록은 지우지 않는다)
export function EvalForm({ c, onSave, onCancel }) {
  const p = c.profile || {};
  const [initScores] = useState(() => (p.evalScores ? p.evalScores : Object.fromEntries((c.eval || []).filter(([, v]) => v && v !== "—").map(([k, v]) => [k, String(v)]))));
  const [initNote] = useState(() => ("evalNote" in p ? p.evalNote : c.internal && c.internal !== "평가 전" ? c.internal : ""));
  const [initIssues] = useState(() => (Array.isArray(p.complaints) ? p.complaints : (c.complaints || []).map((x, i) => ({ id: `x${i}`, at: "", kind: ISSUE_KINDS[0], text: String(x) }))));
  const [scores, setScores] = useState(initScores);
  const [note, setNote] = useState(initNote);
  const [added, setAdded] = useState([]);
  const s = useSave(onSave);
  const updI = (id, k) => (v) => {
    setAdded((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
    s.setErr("");
  };
  const submit = () => {
    const sc = Object.fromEntries(EVAL_ITEMS.map((k) => [k, String(scores[k] || "").trim()]).filter(([, v]) => v));
    const is = added.map((x) => ({ ...x, text: x.text.trim() })).filter((x) => x.text || x.at !== todayYmd());
    const fields = diff([
      ...EVAL_ITEMS.map((k) => [`내부평가 · ${k}`, initScores[k] || "", sc[k] || ""]),
      ["평가 코멘트", initNote, note.trim()],
      ...(is.length ? [["민원 · 사고 기록 추가", "", is.map(issueLine).join(" / ")]] : []),
    ]);
    s.save({ evalScores: sc, evalNote: note.trim(), complaints: [...initIssues, ...is] }, fields, is.some((x) => !x.text) ? "내용이 빈 민원 · 사고 기록이 있습니다." : "");
  };
  return (
    <div>
      <h3 className="text-[13px] font-bold text-navy">내부평가 (5항목)</h3>
      <p className="mt-0.5 text-[11px] text-muted">센터가 쓰는 점수 방식 그대로 적습니다 (예: 점수 · 등급 · 건수).</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-5">
        {EVAL_ITEMS.map((k, i) => (
          <Field key={k} id={`ev-${i}`} label={k} value={scores[k] || ""} onChange={(v) => { setScores((x) => ({ ...x, [k]: v })); s.setErr(""); }} placeholder="점수" />
        ))}
      </div>
      <div className="mt-3">
        <Field id="ev-note" label="평가 코멘트" type="textarea" value={note} onChange={(v) => { setNote(v); s.setErr(""); }} placeholder="내부평가 코멘트 — 관제 · 센터만 봅니다" />
      </div>

      <h3 className="mt-5 text-[13px] font-bold text-navy">민원 · 사고 기록</h3>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[13px] text-ink">
        {initIssues.map((x) => <li key={x.id}>{issueLine(x)}</li>)}
      </ul>
      {!initIssues.length && <p className="mt-1 text-[12px] text-muted">민원 · 사고 기록이 없습니다.</p>}
      <ul className="mt-2 space-y-2">
        {added.map((x) => (
          <li key={x.id} className="grid items-end gap-2 rounded-xl bg-navy/[.04] p-2.5 sm:grid-cols-[1fr_90px_2fr_auto]">
            <Field id={`is-at-${x.id}`} label="날짜" type="date" value={x.at} onChange={updI(x.id, "at")} />
            <Field id={`is-kind-${x.id}`} label="구분" value={x.kind} onChange={updI(x.id, "kind")} options={ISSUE_KINDS} />
            <Field id={`is-text-${x.id}`} label="내용" value={x.text} onChange={updI(x.id, "text")} required />
            <Btn small ghost tone="muted" onClick={() => setAdded((rs) => rs.filter((r) => r.id !== x.id))} aria-label="이 기록 빼기">빼기</Btn>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <Btn small ghost onClick={() => setAdded((rs) => [...rs, { id: newId("x"), at: todayYmd(), kind: ISSUE_KINDS[0], text: "" }])}>민원 · 사고 기록 추가</Btn>
      </div>
      <p className="mt-3 text-[11px] text-muted">미수락 · 지각 · 취소 횟수, SOS 출동이력, 수정이력은 앱 기록이라 고치지 않습니다.</p>
      <SaveBar id="ev" s={s} onCancel={onCancel} onSave={submit} />
    </div>
  );
}

// ── 담당 컨시어지 변경 확인 창 ── 어르신 관리 [담당 컨시어지 변경]과 컨시어지 관리 담당고객 [추가 · 해제]가 같이 쓴다.
// elders: 고를 수 있는 어르신 [{ name, pri, sub, … }] (한 분이면 고르는 칸 없이) · start(어르신) → 처음 채울 { pri, sub }
// 주 담당은 꼭 있어야 하고 주 · 부가 같을 수 없다(2인 1조). 부 담당은 '—'(없음)로 비울 수 있다 — 관제 '부 담당 없음'에 뜬다
export function StaffChange({ title, intro, elders, start, choices, onCancel, onSave }) {
  const [name, setName] = useState(elders[0]?.name || "");
  const e = elders.find((x) => x.name === name) || elders[0] || null;
  const [v, setV] = useState(() => (elders[0] ? start(elders[0]) : { pri: "", sub: NO_STAFF }));
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const set = (k) => (x) => {
    setV((o) => ({ ...o, [k]: x }));
    setErr("");
  };
  const pick = (n) => {
    const next = elders.find((x) => x.name === n);
    setName(n);
    if (next) setV(start(next));
    setErr("");
  };
  const priOpts = [...new Set([...(v.pri && v.pri !== NO_STAFF ? [v.pri] : []), ...choices])];
  const subOpts = [...new Set([NO_STAFF, ...(v.sub && v.sub !== NO_STAFF ? [v.sub] : []), ...choices])];
  const run = () => {
    if (!e) return onCancel();
    if (!v.pri || v.pri === NO_STAFF) return setErr("주 담당을 골라 주세요 — 주 담당이 없으면 실행되지 않습니다.");
    if (v.pri === v.sub) return setErr("주 · 부가 같을 수 없습니다 — 한 사람이 두 자리를 맡으면 2인 1조가 깨집니다.");
    if (v.pri === e.pri && v.sub === (e.sub || NO_STAFF)) return setErr("지금 담당과 같습니다 — 바꿀 담당을 골라 주세요.");
    if (!reasonOk(reason)) return setErr("사유를 4자 이상 적어야 실행됩니다.");
    onSave({ e, pri: v.pri, sub: v.sub || NO_STAFF, reason: reason.trim() });
  };
  return (
    <Confirm open title={title} onCancel={onCancel} onConfirm={run} confirmLabel="확인 · 실행">
      <div className="mt-3 space-y-2">
        {intro && <p className="text-[13px] text-ink">{intro}</p>}
        {!e ? (
          <Note tone="warn">고를 수 있는 어르신이 없습니다.</Note>
        ) : (
          <>
            {elders.length > 1 ? (
              <Field id="sc-elder" label="어르신" value={e.name} onChange={pick} options={elders.map((x) => x.name)} />
            ) : null}
            <p className="text-[12px] text-muted">
              {e.name} 님 지금 담당 — 주 {e.pri || NO_STAFF} · 부 {e.sub || NO_STAFF}
            </p>
            {!choices.length && <Note tone="warn">이 센터에 승인된 컨시어지가 없습니다 — 계정·권한에서 컨시어지를 먼저 승인합니다.</Note>}
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id="sc-pri" label="주 담당" value={v.pri || ""} onChange={set("pri")} options={priOpts.length ? priOpts : [""]} />
              <Field id="sc-sub" label="부 담당" value={v.sub || NO_STAFF} onChange={set("sub")} options={subOpts} hint={`${NO_STAFF} 는 부 담당 없음`} />
            </div>
          </>
        )}
        <Field id="sc-reason" label="사유" type="textarea" value={reason} onChange={(x) => { setReason(x); setErr(""); }} placeholder="누가 왜 요청했는지 (4자 이상)" required hint="실행 내용과 사유가 어르신 · 컨시어지 수정이력과 감사로그에 남습니다" />
        {err && <Note tone="warn">{err}</Note>}
      </div>
    </Confirm>
  );
}

// 담당고객 [추가] · [해제]가 확인 창에 처음 채울 값 — 사람이 그대로 바꿔 실행할 수 있다
export function staffStart(e, me, mode, choices) {
  const sub = e.sub || NO_STAFF;
  if (mode === "remove") {
    if (e.pri !== me) return { pri: e.pri, sub: NO_STAFF };
    // 주 담당을 해제하면 부 담당이 주로 올라간다 (없으면 다른 컨시어지 중 첫 사람 — 고를 수 있다)
    return { pri: sub !== NO_STAFF ? sub : choices.find((n) => n !== me) || "", sub: NO_STAFF };
  }
  if (!e.pri || e.pri === NO_STAFF) return { pri: me, sub: sub === me ? NO_STAFF : sub };
  return { pri: e.pri, sub: me };
}
