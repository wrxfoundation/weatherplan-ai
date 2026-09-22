// 방문관리 — 월 1회 2인 1조 방문 일정부터 21항목 점검 · 결과보고까지 (요청서 11절 · 시안 방문관리).
// 배차 완료로 끝나지 않는다: 수행 → 결과입력 → 관제검수 → 보호자 보고까지 상태가 이어진다 (Visits/VisitDetail).
import { useState } from "react";
import { Panel, PanelHead, Stat, Pill, Btn, Field, Toggle, Drawer, Note, Empty } from "./ui";
import Icon from "../icons";
import { ROSTERS } from "../../lib/rosters";
import { VISITS, VISIT_STATE, VISIT_TEAMS, VISIT_REGIONS, TODAY, TODAY_LABEL, visitDetail, visitPill, stampNow } from "../../lib/ops-mgmt";
import VisitDetail from "./Visits/VisitDetail";

const ALL_STATUS = "전체 상태";
const ALL_REGION = "전체 권역";
const ALL_TEAM = "담당팀 전체";
const ELDERS = ROSTERS.elders.rows.map((r) => r[0]);
const STAFF = ROSTERS.concierges.rows.map((r) => r[0]);
const CYCLES = ["월 1회", "월 2회", "주 1회"];

// 예외 먼저 — 진행 중 → 검수가 남은 후속 → 예정 → 완료 (같은 등급은 시각순)
const rank = (v) => (v.status === "active" ? 0 : v.status === "done" && v.followup && v.review !== "검수 완료" ? 1 : v.status === "planned" ? 2 : 3);

export default function Visits({ openProfile }) {
  const [visits, setVisits] = useState(() => VISITS.map((v) => ({ ...visitDetail(v), date: TODAY })));
  const [sel, setSel] = useState("V-0922-14");
  const [q, setQ] = useState("");
  const [date, setDate] = useState(TODAY);
  const [status, setStatus] = useState(ALL_STATUS);
  const [region, setRegion] = useState(ALL_REGION);
  const [team, setTeam] = useState(ALL_TEAM);
  const [byTime, setByTime] = useState(false);
  const [reg, setReg] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "김순자", cycle: "월 1회", date: TODAY, time: "10:00", pri: "박지현", sub: "서다인", confirmed: true, notify: true });
  const setF = (k) => (val) => setForm((f) => ({ ...f, [k]: val }));

  const todays = visits.filter((v) => v.date === TODAY);
  const n = (f) => todays.filter(f).length;
  const stats = [
    { label: "오늘 방문", value: todays.length, tone: "navy", k: ALL_STATUS },
    { label: "완료", value: n((v) => v.status === "done"), tone: "ok", k: "완료" },
    { label: "진행 중", value: n((v) => v.status === "active"), tone: "info", k: "진행" },
    { label: "방문 예정", value: n((v) => v.status === "planned"), tone: "gold", k: "예정" },
    { label: "후속조치 필요", value: n((v) => v.followup), tone: "warn", k: "후속" },
  ];

  const list = visits
    .filter((v) => v.date === date)
    .filter((v) => !q || v.name.includes(q) || v.pri.includes(q) || v.sub.includes(q) || v.team.includes(q))
    .filter((v) => status === ALL_STATUS || (status === "후속" ? v.followup : VISIT_STATE[visitPill(v)].label === status))
    .filter((v) => region === ALL_REGION || v.region === region)
    .filter((v) => team === ALL_TEAM || v.team === team)
    .sort((a, b) => (byTime ? 0 : rank(a) - rank(b)) || a.time.localeCompare(b.time));
  const cur = visits.find((v) => v.id === sel) || list[0];
  const patch = (id, p) => setVisits((vs) => vs.map((v) => (v.id === id ? { ...v, ...p } : v)));

  const register = () => {
    const like = VISITS.find((v) => v.pri === form.pri) || VISITS[0];
    const nv = visitDetail({ id: `V-NEW-${Date.now()}`, time: form.time, name: form.name, team: like.team, region: like.region, memo: form.confirmed ? "신규 등록 · 일정 확정" : "신규 등록 · 확정 전", status: "planned", followup: false, pri: form.pri, sub: form.sub });
    const full = { ...nv, date: form.date, cycle: form.cycle, nextDate: form.date, confirmed: form.confirmed, notified: form.notify };
    setVisits((vs) => [...vs, full]);
    setDate(form.date);
    setSel(full.id);
    setReg(false);
    setMsg(`${form.name} 님 방문 일정 등록 · ${form.date} ${form.time} · 주 ${form.pri} · 부 ${form.sub} · ${form.notify ? "보호자 통보 발송" : "보호자 통보 보류"} · ${stampNow()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">방문관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">월 1회 2인 1조 방문 일정부터 21가지 점검 · 결과보고까지 관리합니다.</p>
        </div>
        <Btn onClick={() => setReg(true)}>
          <span className="inline-flex items-center gap-1"><Icon name="plus" size={14} /> 방문 일정 등록</span>
        </Btn>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Stat key={s.k} label={s.label} value={s.value} unit="건" tone={s.tone} active={status === s.k} onClick={() => setStatus(status === s.k ? ALL_STATUS : s.k)} />
        ))}
      </div>

      <Panel className="!p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field id="visit-q" label="검색" value={q} onChange={setQ} placeholder="고객명 · 컨시어지 · 팀" />
          <Field id="visit-date" label="날짜" type="date" value={date} onChange={setDate} />
          <Field id="visit-status" label="상태" value={status} onChange={setStatus} options={[ALL_STATUS, "완료", "진행", "예정", "후속"]} />
          <Field id="visit-region" label="권역" value={region} onChange={setRegion} options={[ALL_REGION, ...VISIT_REGIONS]} />
          <Field id="visit-team" label="담당팀" value={team} onChange={setTeam} options={[ALL_TEAM, ...VISIT_TEAMS]} />
          <div className="flex items-center gap-2 pb-1.5">
            <Toggle id="visit-bytime" on={byTime} onChange={setByTime} label="시간순 정렬" />
            <label htmlFor="visit-bytime" className="text-[12px] text-muted">{byTime ? "시간순" : "예외 우선"}</label>
          </div>
        </div>
      </Panel>

      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel>
          <PanelHead title={date === TODAY ? "오늘의 방문 일정" : "방문 일정"} sub={date === TODAY ? TODAY_LABEL : date} right={<span className="font-num text-[13px] font-bold text-navy">{list.length}건</span>} />
          <div className="mt-3 space-y-1">
            {list.length === 0 && <Empty>{date === TODAY ? "조건에 맞는 방문이 없습니다." : "선택한 날짜의 일정은 연동 대기입니다 — 이 화면에서 등록한 일정만 표시됩니다."}</Empty>}
            {list.map((v) => {
              const pk = visitPill(v);
              const on = cur && cur.id === v.id;
              const done = v.keys.length - v.pending.length;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSel(v.id)}
                  aria-pressed={on}
                  className="btn-press btn-inline flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-navy/[.03]"
                  style={on ? { boxShadow: "inset 0 0 0 2px #B08D57", background: "rgba(176,141,87,.10)" } : undefined}
                >
                  <span className="font-num w-[44px] shrink-0 pt-0.5 text-[13px] font-bold text-navy">{v.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-navy">{v.name}</span>
                    <span className="block truncate text-[12px] text-muted">
                      {v.team} · {v.status === "active" ? `점검 ${done}/${v.keys.length}${v.loc === "hospital" ? " · 병실" : ""}` : v.memo}
                    </span>
                  </span>
                  <Pill tone={VISIT_STATE[pk].tone}>{VISIT_STATE[pk].label}</Pill>
                </button>
              );
            })}
          </div>
        </Panel>

        {cur ? <VisitDetail visit={cur} onChange={(p) => patch(cur.id, p)} openProfile={openProfile} /> : <Panel><Empty>방문을 선택하면 상세가 여기 표시됩니다.</Empty></Panel>}
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>

      <Drawer
        open={reg}
        onClose={() => setReg(false)}
        title="방문 일정 등록"
        sub="월 1회 2인 1조 — 주·부 컨시어지가 서로 달라야 합니다"
        footer={
          <div className="flex justify-end gap-2">
            <Btn ghost tone="muted" onClick={() => setReg(false)}>취소</Btn>
            <Btn disabled={!form.name || !form.date || form.pri === form.sub} onClick={register}>일정 등록</Btn>
          </div>
        }
      >
        <div className="space-y-3">
          <Field id="reg-name" label="고객" value={form.name} onChange={setF("name")} options={ELDERS} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="reg-cycle" label="방문 주기" value={form.cycle} onChange={setF("cycle")} options={CYCLES} />
            <Field id="reg-date" label="다음 방문일" type="date" value={form.date} onChange={setF("date")} required />
            <Field id="reg-time" label="시각" type="time" value={form.time} onChange={setF("time")} />
            <Field id="reg-pri" label="주 컨시어지" value={form.pri} onChange={setF("pri")} options={STAFF} required />
            <Field id="reg-sub" label="부 컨시어지" value={form.sub} onChange={setF("sub")} options={STAFF} required hint={form.pri === form.sub ? "주·부가 같은 사람일 수 없습니다" : undefined} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
            <label htmlFor="reg-confirmed" className="text-[13px] font-medium text-ink">일정 확정 <span className="block text-[11px] text-muted">확정 전 일정은 배차 그리드에 임시로 표시됩니다</span></label>
            <Toggle id="reg-confirmed" on={form.confirmed} onChange={setF("confirmed")} label="일정 확정" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
            <label htmlFor="reg-notify" className="text-[13px] font-medium text-ink">보호자 통보 <span className="block text-[11px] text-muted">등록 즉시 주 보호자에게 일정 알림 · 발송 상태는 보호자 관리 연락이력에</span></label>
            <Toggle id="reg-notify" on={form.notify} onChange={setF("notify")} label="보호자 통보" />
          </div>
          <Note>등록된 일정은 배차로 끝나지 않습니다 — 방문 수행 · 결과입력 · 관제검수 · 보호자 보고까지 이 화면에서 이어집니다.</Note>
        </div>
      </Drawer>
    </div>
  );
}
