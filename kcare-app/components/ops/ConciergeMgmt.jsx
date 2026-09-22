// 컨시어지 관리 — 인력 · 가용상태 · 위치 · 자격 · 배차 · 수행품질 (요청서 9절 · 시안 컨시어지 통합관리).
// 기존 명부의 역할·권역·평점·배차·피로도·자격·상태를 그대로 쓰고, 등록·수정은 사유 필수 + 이력.
// 피로도 상한(96%)과 자격 만료 임박은 위험 신호가 아니라 운영 경고 — amber.
import { useState } from "react";
import { Panel, Stat, Pill, SevPill, FeedPill, Avatar, Btn, Tabs, Table, KV, Field, Toggle, Drawer, Confirm, Stamp, Bar, Note, Empty, TONE } from "./ui";
import Icon from "../icons";
import { ROSTERS } from "../../lib/rosters";
import { VISIT_STATE, logEntry, sevOf, TODAY } from "../../lib/ops-mgmt";
import { STAFF_TABS, STAFF_TONE, STAFF_STATS, conciergeDetail, fatigueTone, fatigueLabel, certNear } from "../../lib/ops-mgmt-people";
import { EditDrawer, HistoryTable } from "./mgmt/EditLog";

const BRANCHES = [...new Set(ROSTERS.concierges.rows.map((r) => r[1]))];
const REGIONS = [...new Set(ROSTERS.concierges.rows.map((r) => r[3]))];
const ROLES = ["주 담당", "부 담당", "주·부 겸용"];
const CONTRACTS = ["정규직", "수습 계약 (3개월)", "계약직", "사전 배치 계약"];
const F = { branch: "전체 지점", role: "역할", status: "근무상태", region: "담당권역", cert: "자격상태" };
const hasNear = (c) => c.certs.some(certNear);
const rank = (c) => (c.status === "휴식 권고" ? 0 : hasNear(c) ? 1 : c.status === "짝 대기" ? 2 : c.status === "동행 중" ? 3 : c.status === "가용" ? 4 : 5);
const yn = (b) => (b ? "예" : "아니오");
const EMPTY_FORM = { name: "", branch: BRANCHES[0], region: REGIONS[0], workDays: "월–금 09:00–18:00", vehicle: false, drive: true, role: ROLES[1], emergency: false, cert: "BLS 응급교육", certUntil: "", training: "노인돌봄 기본교육", contract: CONTRACTS[1], active: true, leave: "" };

function Sec({ title, right, children }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-center justify-between"><h3 className="text-[13px] font-bold text-navy">{title}</h3>{right}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
function Row({ id, label, hint, on, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}{hint && <span className="block text-[11px] text-muted">{hint}</span>}</label>
      <Toggle id={id} on={on} onChange={onChange} label={label} />
    </div>
  );
}
function Fatigue({ pct }) {
  const t = fatigueTone(pct);
  return (
    <div className="min-w-[110px]">
      <div className="flex justify-between font-num text-[11px] font-bold" style={{ color: TONE[t].fg }}><span>{pct}%</span><span>{fatigueLabel(pct)}</span></div>
      <Bar value={pct} tone={t} height={5} />
    </div>
  );
}

export default function ConciergeMgmt({ openProfile }) {
  const [rows, setRows] = useState(() => ROSTERS.concierges.rows.map(conciergeDetail));
  const [sel, setSel] = useState("박지현");
  const [tab, setTab] = useState("근무현황");
  const [q, setQ] = useState("");
  const [f, setFilter] = useState(F);
  const [reg, setReg] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [training, setTraining] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const setF = (k) => (v) => setForm((x) => ({ ...x, [k]: v }));
  const setFl = (k) => (v) => setFilter((x) => ({ ...x, [k]: v }));
  const preset = (k, v) => setFilter({ ...F, ...(k ? { [k]: v } : {}) });

  const cur = rows.find((c) => c.name === sel) || rows[0];
  const update = (name, fn) => setRows((rs) => rs.map((c) => (c.name === name ? fn(c) : c)));
  const log = (c, field, before, after, reason) => ({ ...c, history: [logEntry({ field, before, after, reason }), ...c.history] });

  const stats = [
    { label: "전체 인원", value: STAFF_STATS.total, tone: "navy", on: () => preset(), active: JSON.stringify(f) === JSON.stringify(F) },
    { label: "현재 가용", value: STAFF_STATS.free, tone: "ok", on: () => preset("status", "가용"), active: f.status === "가용" },
    { label: "동행 중", value: STAFF_STATS.onDuty, tone: "info", on: () => preset("status", "동행 중"), active: f.status === "동행 중" },
    { label: "피로 · 휴식권고", value: STAFF_STATS.fatigue, tone: "warn", on: () => preset("status", "피로·휴식권고"), active: f.status === "피로·휴식권고" },
    { label: "자격 만료임박", value: STAFF_STATS.cert, tone: "warn", on: () => preset("cert", "만료 임박"), active: f.cert === "만료 임박" },
  ];
  const list = rows
    .filter((c) => !q || c.name.includes(q) || c.branch.includes(q) || c.region.includes(q) || c.cert.includes(q))
    .filter((c) => f.branch === F.branch || c.branch === f.branch)
    .filter((c) => f.role === F.role || (f.role === "수습" ? /수습/.test(c.role) : c.roleType === f.role))
    .filter((c) => f.status === F.status || (f.status === "피로·휴식권고" ? c.fatigue >= 70 || c.status === "휴식 권고" : c.status === f.status))
    .filter((c) => f.region === F.region || c.region === f.region)
    .filter((c) => f.cert === F.cert || (f.cert === "만료 임박" ? hasNear(c) : !hasNear(c)))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  const cols = [
    { k: "name", label: "이름", render: (c) => <span className="flex items-center gap-2"><Avatar name={c.name} size={30} /><span className="font-bold text-navy">{c.name}</span></span> },
    { k: "role", label: "역할 · 권역", render: (c) => <>{c.roleType} · {c.region}{/수습/.test(c.role) && <Pill tone="muted" className="ml-1">수습</Pill>}</> },
    { k: "status", label: "현재상태", render: (c) => <Pill tone={STAFF_TONE[c.status] || "muted"} dot>{c.status}</Pill> },
    { k: "today", label: "오늘 일정", render: (c) => <span className="font-num">{c.jobs} · {c.hours}h</span> },
    { k: "fatigue", label: "피로도", render: (c) => <Fatigue pct={c.fatigue} /> },
    { k: "cert", label: "자격 · 특이", render: (c) => <span className={hasNear(c) ? "font-bold text-gold" : "text-ink"}>{c.cert}</span> },
  ];

  const editFields = cur
    ? [
        { label: "소속 지점", value: cur.branch, options: BRANCHES, apply: (c, v) => ({ ...c, branch: v }) },
        { label: "담당 가능지역", value: cur.region, apply: (c, v) => ({ ...c, region: v }) },
        { label: "근무 요일 · 시간", value: cur.workDays, apply: (c, v) => ({ ...c, workDays: v }) },
        { label: "주·부 담당 역할", value: cur.roleType, options: ROLES, apply: (c, v) => ({ ...c, roleType: v }) },
        { label: "차량 보유 · 운전", value: yn(cur.vehicle), options: ["예", "아니오"], apply: (c, v) => ({ ...c, vehicle: v === "예" }) },
        { label: "긴급출동 가능", value: yn(cur.emergency), options: ["예", "아니오"], apply: (c, v) => ({ ...c, emergency: v === "예" }) },
        { label: "계약상태", value: cur.contract, options: CONTRACTS, apply: (c, v) => ({ ...c, contract: v }) },
        { label: "휴무 · 휴가", value: cur.leave, apply: (c, v) => ({ ...c, leave: v }) },
      ]
    : [];
  const onEdit = (fd, after, reason) => {
    update(cur.name, (c) => log(fd.apply(c, after), fd.label, String(fd.value), after, reason));
    setEdit(false);
    setMsg(`${cur.name} ${fd.label} 수정 · 사유와 함께 이력 저장`);
  };
  const register = () => {
    const roleText = form.role === "주·부 겸용" ? "주·부 겸용" : form.role === "주 담당" ? "주 동행" : "부 동행 · 수습";
    let c = conciergeDetail([form.name.trim(), form.branch, roleText, form.region, TODAY, "—", "0건", "정상", form.cert, "가용"]);
    c = {
      ...c, roleType: form.role, workDays: form.workDays, vehicle: form.vehicle, emergency: form.emergency, contract: form.contract, account: form.active ? "활성" : "비활성", leave: form.leave || "—",
      certs: [{ name: form.cert, until: form.certUntil || "—", state: "확인 대기" }], trainings: [form.training], location: { text: `${form.branch} 등록 · 위치 수신 전`, at: "—", feed: "stale" }, elders: [], today: [],
      history: [logEntry({ field: "신규 컨시어지 등록", before: "—", after: `${form.name.trim()} · ${form.branch} · ${form.role}`, reason: "신규 등록" })],
    };
    setRows((rs) => [c, ...rs]);
    setSel(c.name);
    setTab("근무현황");
    setReg(false);
    setForm(EMPTY_FORM);
    setMsg(`${c.name} 등록 · 자격증 확인 후 배차 가능`);
  };
  const runConfirm = () => {
    if (!confirm.reason?.trim()) return setConfirm({ ...confirm, err: true });
    const to = cur.account === "활성" ? "비활성" : "활성";
    update(cur.name, (c) => log({ ...c, account: to, status: to === "비활성" ? "오픈 대기" : c.status }, "계정 상태", c.account, to, confirm.reason));
    setConfirm(null);
    setMsg(`${cur.name} 계정 ${to} · 이력 저장`);
  };

  const renderTab = () => {
    if (tab === "근무현황")
      return (
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[["근무시간", `${cur.hours}h`], ["오늘 배차", cur.jobs], ["피로도", `${cur.fatigue}%`]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-navy/[.04] px-3.5 py-3">
                <div className="text-[11px] font-bold text-muted">{l}</div>
                <div className="mt-1 font-num text-[20px] font-bold" style={{ color: l === "피로도" ? TONE[fatigueTone(cur.fatigue)].fg : "#0A1F3C" }}>{v}</div>
                {l === "피로도" && <div className="mt-1"><Bar value={cur.fatigue} tone={fatigueTone(cur.fatigue)} height={5} /></div>}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <KV k="소속 지점" v={cur.branch} />
            <KV k="담당 가능지역" v={cur.region} />
            <KV k="근무 요일 · 시간" v={cur.workDays} />
            <KV k="차량 · 운전" v={cur.vehicle ? "차량 보유 · 운전 가능" : "차량 없음 · 대중교통 이동"} />
            <KV k="주·부 담당 역할" v={cur.roleType} />
            <KV k="긴급출동 가능" v={yn(cur.emergency)} tone={cur.emergency ? "ok" : undefined} />
            <KV k="계약상태" v={cur.contract} />
            <KV k="계정" v={cur.account} tone={cur.account === "활성" ? "ok" : "warn"} />
            <KV k="휴무 · 휴가" v={cur.leave} />
            <KV k="누적 근무시간" v={`이번 주 ${cur.weekHours}h · 오늘 ${cur.hours}h`} mono />
            <KV k="휴식시간" v={cur.rest} />
            <KV k="연락" v={cur.tel} mono />
            <KV k="등록일" v={cur.regDate} mono />
          </div>
        </div>
      );
    if (tab === "일정·위치")
      return (
        <div>
          <Sec title="현재 위치" right={<span className="inline-flex items-center gap-2"><FeedPill feed={cur.location.feed} /><Stamp at={cur.location.at} prefix="위치 수신" /></span>}>
            <div className="text-[13px] font-medium text-ink">{cur.location.text}</div>
            <div className="mt-2 flex h-[120px] items-center justify-center rounded-xl border border-dashed border-navy/[.15] bg-navy/[.03] text-[12px] text-muted">지도 연동 대기 — 실시간 위치와 마지막 수신 위치를 구분해 표시합니다</div>
          </Sec>
          <Sec title="오늘 일정">
            <Table
              dense
              cols={[{ k: "time", label: "시각", render: (s) => <span className="font-num">{s.time}</span> }, { k: "name", label: "고객", render: (s) => (openProfile ? <button type="button" onClick={() => openProfile(s.name)} className="btn-press btn-inline font-bold text-navy underline decoration-gold/60">{s.name}</button> : <span className="font-bold text-navy">{s.name}</span>) }, { k: "memo", label: "업무" }, { k: "role", label: "역할", render: (s) => <Pill tone={s.role === "주" ? "navy" : "info"}>{s.role}</Pill> }, { k: "status", label: "상태", render: (s) => <Pill tone={VISIT_STATE[s.status].tone}>{VISIT_STATE[s.status].label}</Pill> }]}
              rows={cur.today}
              rowKey={(s, i) => `${s.time}-${i}`}
              empty="오늘 배정된 일정이 없습니다."
            />
          </Sec>
          <Sec title="주간 일정"><ul className="grid gap-1 text-[12px] text-ink sm:grid-cols-2">{cur.week.map((w) => <li key={w} className="rounded-lg bg-navy/[.04] px-2.5 py-1.5">{w}</li>)}</ul></Sec>
        </div>
      );
    if (tab === "담당고객")
      return (
        <div>
          <Table
            dense
            cols={[{ k: "name", label: "어르신", render: (e) => (openProfile ? <button type="button" onClick={() => openProfile(e.name)} className="btn-press btn-inline font-bold text-navy underline decoration-gold/60">{e.name}</button> : <span className="font-bold text-navy">{e.name}</span>) }, { k: "age", label: "나이", render: (e) => <span className="font-num">{e.age}</span> }, { k: "dong", label: "동" }, { k: "role", label: "역할", render: (e) => <Pill tone={e.role === "주" ? "navy" : "info"}>{e.role} 담당</Pill> }, { k: "risk", label: "위험", render: (e) => <SevPill sev={sevOf(e.risk)} /> }]}
            rows={cur.elders}
            rowKey={(e) => e.name}
            empty="담당 어르신이 없습니다 — 어르신 관리에서 담당 변경으로 배정합니다."
          />
          <div className="mt-2 text-[11px] text-muted">담당 변경은 어르신 관리 [담당 컨시어지 변경] (확인 절차 · 이력 기록).</div>
        </div>
      );
    if (tab === "자격·교육")
      return (
        <div>
          <Sec title="자격증 · 유효기간">
            <Table dense cols={[{ k: "name", label: "자격" }, { k: "until", label: "유효기간", render: (c) => <span className="font-num">{c.until}</span> }, { k: "state", label: "상태", render: (c) => <Pill tone={certNear(c) ? "warn" : c.state === "확인 대기" ? "muted" : "ok"}>{c.state}</Pill> }]} rows={cur.certs} rowKey={(c) => c.name} />
            {hasNear(cur) && <div className="mt-2"><Note tone="warn">만료 임박 자격이 있습니다 — 만료 시 해당 유형 배차가 자동 제한됩니다. 갱신 안내가 필요합니다.</Note></div>}
          </Sec>
          <Sec title="교육이수">
            <ul className="space-y-1 text-[13px] text-ink">{cur.trainings.map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="check" size={13} className="text-green" />{t}</li>)}</ul>
            <div className="mt-2 flex gap-2">
              <input id={`tr-${cur.name}`} aria-label="교육 이수 등록" value={training} onChange={(e) => setTraining(e.target.value)} placeholder="교육명 (이수 연월)" className="card-glass min-w-0 flex-1 rounded-[10px] px-3 py-2 text-[13px] text-navy outline-none focus:ring-1 focus:ring-gold" />
              <Btn small disabled={!training.trim()} onClick={() => { update(cur.name, (c) => log({ ...c, trainings: [...c.trainings, training.trim()] }, "교육이수", c.trainings.join(" · "), [...c.trainings, training.trim()].join(" · "), "교육 이수 등록")); setTraining(""); }}>이수 등록</Btn>
            </div>
          </Sec>
        </div>
      );
    return (
      <div>
        <Sec title="평가 (5항목)">
          <div className="grid gap-2 sm:grid-cols-5">{cur.eval.map(([k, v]) => <div key={k} className="rounded-xl bg-navy/[.04] px-3 py-2"><div className="text-[11px] font-bold text-muted">{k}</div><div className="mt-0.5 font-num text-[14px] font-bold text-navy">{v}</div></div>)}</div>
        </Sec>
        <KV k="내부평가" v={cur.internal} />
        <KV k="미수락 · 지각 · 취소" v={<span className="font-num">미수락 {cur.missed.declined} · 지각 {cur.missed.late} · 취소 {cur.missed.cancel}</span>} tone={cur.missed.declined + cur.missed.late + cur.missed.cancel > 0 ? "warn" : undefined} />
        <Sec title="SOS 출동이력">{cur.sos.length ? <Table dense cols={[{ k: "no", label: "사건번호", render: (s) => <span className="font-num font-bold text-navy">{s.no}</span> }, { k: "at", label: "일시", render: (s) => <span className="font-num">{s.at}</span> }, { k: "role", label: "역할 · 결과" }]} rows={cur.sos} rowKey={(s) => s.no} /> : <Empty>SOS 출동이력이 없습니다.</Empty>}</Sec>
        <Sec title="민원 · 사고이력">{cur.complaints.length ? <ul className="list-disc pl-4 text-[13px]">{cur.complaints.map((c) => <li key={c}>{c}</li>)}</ul> : <Empty>민원 · 사고이력이 없습니다.</Empty>}</Sec>
        <Sec title="수정이력"><HistoryTable rows={cur.history} /></Sec>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">컨시어지 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">인력 · 가용상태 · 위치 · 자격 · 배차 및 수행품질을 통합 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Btn ghost onClick={() => setMsg("엑셀 다운로드는 권한 확인 후 제공됩니다 · 다운로드는 감사로그에 기록")}><span className="inline-flex items-center gap-1"><Icon name="download" size={14} /> 엑셀 다운로드</span></Btn>
          <Btn onClick={() => setReg(true)}><span className="inline-flex items-center gap-1"><Icon name="plus" size={14} /> 신규 컨시어지 등록</span></Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} unit="명" tone={s.tone} active={s.active} onClick={s.on} />)}
      </div>

      <Panel className="!p-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">
          <Field id="c-q" label="검색" value={q} onChange={setQ} placeholder="이름 · 지점 · 권역 · 자격" />
          <Field id="c-branch" label="지점" value={f.branch} onChange={setFl("branch")} options={[F.branch, ...BRANCHES]} />
          <Field id="c-role" label="역할" value={f.role} onChange={setFl("role")} options={[F.role, ...ROLES, "수습"]} />
          <Field id="c-status" label="근무상태" value={f.status} onChange={setFl("status")} options={[F.status, "가용", "동행 중", "짝 대기", "휴식 권고", "피로·휴식권고", "오픈 대기"]} />
          <Field id="c-region" label="담당권역" value={f.region} onChange={setFl("region")} options={[F.region, ...REGIONS]} />
          <Field id="c-cert" label="자격상태" value={f.cert} onChange={setFl("cert")} options={[F.cert, "유효", "만료 임박"]} />
        </div>
      </Panel>

      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-navy">컨시어지 명부</h2>
            <span className="text-[12px] text-muted">휴식 권고 · 자격 임박 · 짝 대기 우선</span>
          </div>
          <div className="mt-2"><Table cols={cols} rows={list} onRow={(c) => setSel(c.name)} rowKey={(c) => c.name} selected={cur?.name} /></div>
          <div className="mt-2 text-right font-num text-[11px] text-muted">1–{list.length} / {STAFF_STATS.total}명</div>
        </Panel>

        {cur && (
          <Panel>
            <div className="flex flex-wrap items-start gap-3">
              <Avatar name={cur.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-bold text-navy">{cur.name} 컨시어지</h2>
                  <Pill tone={STAFF_TONE[cur.status] || "muted"} dot>{cur.status}</Pill>
                  {cur.emergency && <Pill tone="gold">긴급출동 가능</Pill>}
                </div>
                <div className="mt-0.5 text-[12px] text-muted">{cur.branch} · {cur.roleType} · 평점 <span className="font-num">{cur.rating}</span> · {cur.cert}</div>
              </div>
              <div className="flex gap-2">
                <Btn small onClick={() => setEdit(true)}>정보 수정</Btn>
                <Btn small ghost tone={cur.account === "활성" ? "muted" : "ok"} onClick={() => setConfirm({ reason: "" })}>{cur.account === "활성" ? "계정 비활성화" : "계정 활성화"}</Btn>
              </div>
            </div>
            <Tabs className="mt-3" tabs={STAFF_TABS.map((t) => [t, t, t === "담당고객" ? cur.elders.length : undefined])} value={tab} onChange={setTab} />
            <div className="mt-3">{renderTab()}</div>
          </Panel>
        )}
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>

      {edit && cur && <EditDrawer title={`${cur.name} 컨시어지 정보 수정`} sub="수정 사유 필수 · 수정 전·후 · 수정자 · 일시가 감사로그에 남습니다" fields={editFields} onClose={() => setEdit(false)} onSave={onEdit} />}

      <Confirm open={Boolean(confirm)} title={`${cur?.name} 계정을 ${cur?.account === "활성" ? "비활성화" : "활성화"}합니다`} onCancel={() => setConfirm(null)} onConfirm={runConfirm} confirmLabel="확인 · 실행" tone={cur?.account === "활성" ? "warn" : "navy"}>
        {confirm && (
          <div className="mt-3 space-y-2">
            {cur.account === "활성" && <p className="text-[13px] text-ink">비활성화하면 배차 · 앱 접속 · 위치 수신이 멈춥니다. 담당 어르신 {cur.elders.length}명은 다른 컨시어지로 재배정해야 합니다.</p>}
            <Field id="cc-reason" label="사유" type="textarea" value={confirm.reason} onChange={(v) => setConfirm({ ...confirm, reason: v, err: false })} placeholder="퇴사 · 휴직 · 계약 종료 등" required hint={confirm.err ? "사유가 있어야 실행됩니다" : "실행 내용과 사유가 수정이력·감사로그에 남습니다"} />
          </div>
        )}
      </Confirm>

      <Drawer
        open={reg}
        onClose={() => setReg(false)}
        title="신규 컨시어지 등록"
        sub="소속 · 지역 · 근무 · 차량 · 역할 · 긴급출동 · 자격 · 교육 · 계약 · 계정 · 휴무"
        width={560}
        footer={<div className="flex justify-end gap-2"><Btn ghost tone="muted" onClick={() => setReg(false)}>취소</Btn><Btn disabled={!form.name.trim()} onClick={register}>등록</Btn></div>}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="cr-name" label="이름" value={form.name} onChange={setF("name")} required />
            <Field id="cr-branch" label="소속 지점" value={form.branch} onChange={setF("branch")} options={BRANCHES} />
            <Field id="cr-region" label="담당 가능지역" value={form.region} onChange={setF("region")} options={REGIONS} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="cr-work" label="근무 가능 요일 · 시간" value={form.workDays} onChange={setF("workDays")} />
            <Field id="cr-role" label="주 · 부 담당 역할" value={form.role} onChange={setF("role")} options={ROLES} hint="부 담당으로 시작하면 수습 · 짝 배정" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Row id="cr-vehicle" label="차량 보유" on={form.vehicle} onChange={setF("vehicle")} />
            <Row id="cr-drive" label="운전 가능" on={form.drive} onChange={setF("drive")} />
            <Row id="cr-emg" label="긴급출동 가능" on={form.emergency} onChange={setF("emergency")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="cr-cert" label="자격증" value={form.cert} onChange={setF("cert")} placeholder="요양보호사 · 간호조무사 · BLS" />
            <Field id="cr-cert-until" label="자격 유효기간" type="date" value={form.certUntil} onChange={setF("certUntil")} hint="만료 30일 전부터 임박 표시" />
            <Field id="cr-training" label="교육이수" value={form.training} onChange={setF("training")} />
            <Field id="cr-contract" label="계약상태" value={form.contract} onChange={setF("contract")} options={CONTRACTS} />
          </div>
          <Row id="cr-active" label="계정 활성화" hint="비활성 계정은 배차 · 앱 접속 불가" on={form.active} onChange={setF("active")} />
          <Field id="cr-leave" label="휴무 · 휴가" value={form.leave} onChange={setF("leave")} placeholder="예) 매주 수요일 휴무" />
          <Note>등록 정보의 수정은 수정 전·후 · 수정자 · 일시가 감사로그에 남습니다.</Note>
        </div>
      </Drawer>
    </div>
  );
}
