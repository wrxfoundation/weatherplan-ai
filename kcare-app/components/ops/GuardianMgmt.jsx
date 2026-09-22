// 보호자 관리 — 연락 우선순위 · 알림 · 보고서 · 결제권한 · 소통이력 (요청서 8절 · 시안 보호자 통합관리).
// 알림 상태 8종(NOTIFY_STATE)으로 발송→열람→응답을 구분하고, 정보 수정은 사유 필수 + 이력.
import { useEffect, useState } from "react";
import { Panel, Stat, Pill, Avatar, Btn, Tabs, Table, KV, Field, Toggle, Drawer, Confirm, Stamp, Note, Empty, TONE } from "./ui";
import Icon from "../icons";
import { fmtWon } from "../../lib/config";
import { ROSTERS } from "../../lib/rosters";
import { NOTIFY_STATE, logEntry, stampNow } from "../../lib/ops-mgmt";
import { GUARDIANS, GUARDIAN_STATS, GUARDIAN_TABS, ROLE_TONE, CONTACT_TONE, SCOPES, REPORT_VIA, localClock } from "../../lib/ops-mgmt-people";
import { EditDrawer, HistoryTable } from "./mgmt/EditLog";

const ELDERS = ROSTERS.elders.rows.map((r) => `${r[0]} (${r[2]})`);
const TZ = { 국내: null, "LA (PDT)": -16, "밴쿠버 (PDT)": -16, "시드니 (AEST)": 1, "도쿄 (JST)": 0, "런던 (BST)": -8, "두바이 (GST)": -5 };
const RELS = ["아들", "장녀", "차녀", "삼남", "배우자", "며느리", "사위", "손주", "기타"];
const ROLES = ["주", "부", "비상"];
const F = { role: "전체 역할", where: "거주지역", rep: "보고서", pay: "결제권한", contact: "연락상태" };
const isUnread = (g) => g.report.includes("미열람");
const isAbroad = (g) => g.tz != null;
const rank = (g) => (g.contact !== "정상" ? 0 : isUnread(g) ? 1 : 2);
const clock = () => stampNow().slice(5);
const splitElder = (s) => { const [name, age] = s.replace(")", "").split(" ("); return { name, age }; };
const EMPTY_FORM = { name: "", rel: "아들", elder: ELDERS[0], role: "부", tel: "", region: "", tz: "국내", call: true, sms: true, push: true, night: false, sos: "2", via: REPORT_VIA[1], payer: false, limit: "50000", scope: SCOPES[1] };

function NotifyPill({ s }) {
  const n = NOTIFY_STATE[s] || NOTIFY_STATE.sent;
  return <Pill tone={n.tone}>{n.label}</Pill>;
}
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

export default function GuardianMgmt({ openProfile }) {
  const [rows, setRows] = useState(GUARDIANS);
  const [sel, setSel] = useState("G-001");
  const [tab, setTab] = useState("기본정보");
  const [q, setQ] = useState("");
  const [f, setFilter] = useState(F);
  const [reg, setReg] = useState(false);
  const [edit, setEdit] = useState(false);
  const [link, setLink] = useState(null);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const setF = (k) => (v) => setForm((x) => ({ ...x, [k]: v }));
  const setFl = (k) => (v) => setFilter((x) => ({ ...x, [k]: v }));
  // 현지시간은 마운트 후 실제 시계로 — 서버 렌더와 어긋나지 않게 처음엔 "—"
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const cur = rows.find((g) => g.id === sel) || rows[0];
  const update = (id, fn) => setRows((rs) => rs.map((g) => (g.id === id ? fn(g) : g)));
  const log = (g, field, before, after, reason) => ({ ...g, history: [logEntry({ field, before, after, reason }), ...g.history] });
  const addLog = (id, entry) => update(id, (g) => ({ ...g, log: [{ at: clock(), ...entry }, ...g.log] }));
  const preset = (k, v) => setFilter({ ...F, ...(k ? { [k]: v } : {}) });

  const stats = [
    { label: "전체 보호자", value: GUARDIAN_STATS.total, tone: "navy", on: () => preset(), active: JSON.stringify(f) === JSON.stringify(F) },
    { label: "주 보호자", value: GUARDIAN_STATS.primary, tone: "ok", on: () => preset("role", "주"), active: f.role === "주" },
    { label: "해외 거주", value: GUARDIAN_STATS.overseas, tone: "info", on: () => preset("where", "해외"), active: f.where === "해외" },
    { label: "보고서 미열람", value: GUARDIAN_STATS.unread, tone: "warn", on: () => preset("rep", "미열람"), active: f.rep === "미열람" },
    { label: "연락 확인 필요", value: GUARDIAN_STATS.contact, tone: "warn", on: () => preset("contact", "확인 필요"), active: f.contact === "확인 필요" },
  ];
  const list = rows
    .filter((g) => !q || g.name.includes(q) || g.elders.some((e) => e.name.includes(q)) || g.tel.includes(q))
    .filter((g) => f.role === F.role || g.role === f.role)
    .filter((g) => f.where === F.where || (f.where === "해외" ? isAbroad(g) : !isAbroad(g)))
    .filter((g) => f.rep === F.rep || (f.rep === "미열람" ? isUnread(g) : !isUnread(g)))
    .filter((g) => f.pay === F.pay || (f.pay === "승인자" ? g.payer : !g.payer))
    .filter((g) => f.contact === F.contact || (f.contact === "확인 필요" ? g.contact !== "정상" : g.contact === "정상"))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  const elderBtn = (e) =>
    openProfile ? (
      <button key={e.name} type="button" onClick={(ev) => { ev.stopPropagation(); openProfile(e.name); }} className="btn-press btn-inline mr-1 font-bold text-navy underline decoration-gold/60">{e.name}({e.age})</button>
    ) : (
      <span key={e.name} className="mr-1">{e.name}({e.age})</span>
    );
  const cols = [
    { k: "name", label: "보호자", render: (g) => <span className="flex items-center gap-2"><Avatar name={g.name} size={30} tone="info" /><span className="font-bold text-navy">{g.name}</span></span> },
    { k: "rel", label: "관계 · 역할", render: (g) => <span className="inline-flex items-center gap-1">{g.rel} <Pill tone={ROLE_TONE[g.role]}>{g.role}</Pill></span> },
    { k: "elders", label: "담당 어르신", render: (g) => g.elders.map(elderBtn) },
    { k: "where", label: "거주 · 현지시간", render: (g) => <><span style={isAbroad(g) ? { color: TONE.info.fg, fontWeight: 700 } : undefined}>{g.region}</span> · <span className="font-num">{localClock(now, g.tz)}</span></> },
    { k: "report", label: "보고서", render: (g) => <span className={isUnread(g) ? "font-bold text-gold" : ""}>{g.report}</span> },
    { k: "pay", label: "결제 · 연락", render: (g) => <><span className="block text-[12px]">{g.payer ? `${fmtWon(g.payLimit)} 승인` : "열람 전용"}</span><Pill tone={CONTACT_TONE[g.contact]}>{g.contact}</Pill></> },
  ];

  const editFields = cur
    ? [
        { label: "휴대전화", value: cur.tel, apply: (g, v) => ({ ...g, tel: v }) },
        { label: "거주지역", value: cur.region, apply: (g, v) => ({ ...g, region: v }) },
        { label: "연락 가능시간", value: cur.hours, apply: (g, v) => ({ ...g, hours: v }) },
        { label: "역할 (주·부·비상)", value: cur.role, options: ROLES, apply: (g, v) => ({ ...g, role: v, elders: g.elders.map((e, i) => (i === 0 ? { ...e, role: v } : e)) }) },
        { label: "SOS 연락 우선순위", value: String(cur.sosOrder), options: ["1", "2", "3"], apply: (g, v) => ({ ...g, sosOrder: Number(v) }) },
        { label: "야간 연락 가능", value: cur.night ? "예" : "아니오", options: ["예", "아니오"], apply: (g, v) => ({ ...g, night: v === "예" }) },
        { label: "보고서 수신방법", value: cur.reportVia, options: REPORT_VIA, apply: (g, v) => ({ ...g, reportVia: v }) },
        { label: "고객정보 열람범위", value: cur.scope, options: SCOPES, apply: (g, v) => ({ ...g, scope: v }) },
        { label: "결제 승인 한도 (원)", value: cur.payLimit == null ? "권한 없음" : String(cur.payLimit), apply: (g, v) => ({ ...g, payer: Number(v) > 0, payLimit: Number(v) > 0 ? Number(v) : null }) },
        { label: "앱 계정 상태", value: cur.app.state, options: ["정상", "잠금", "탈퇴"], apply: (g, v) => ({ ...g, app: { ...g.app, state: v } }) },
      ]
    : [];
  const onEdit = (fd, after, reason) => {
    update(cur.id, (g) => log(fd.apply(g, after), fd.label, String(fd.value), after, reason));
    setEdit(false);
    setMsg(`${cur.name} 보호자 ${fd.label} 수정 · 사유와 함께 이력 저장`);
  };
  const register = () => {
    const e = splitElder(form.elder);
    const tel = form.tel.replace(/\D/g, "");
    const g = {
      id: `G-${Date.now()}`, name: form.name.trim(), rel: form.rel, role: form.role, elders: [{ ...e, role: form.role }],
      region: form.region.trim() || form.tz.split(" ")[0], tz: TZ[form.tz], tel: tel.length >= 10 ? `${tel.slice(0, 3)}-${tel.slice(3, 5)}**-${tel.slice(-4, -2)}**` : "미입력",
      hours: "08:00–22:00", night: form.night, consent: { call: form.call, sms: form.sms, push: form.push }, sosOrder: Number(form.sos), scope: form.scope, reportVia: form.via,
      report: "발송 전", payer: form.payer, payLimit: form.payer ? Number(form.limit) || 0 : null, contact: "정상", app: { state: "초대 발송 · 가입 대기", last: "—" },
      emergency: form.role === "주" ? "119 신고 · 현장출동 동의 (서명 대기)" : "열람 동의", requests: [], complaints: [], reports: [], payments: [],
      log: [{ at: clock(), ch: "문자", text: "보호자 앱 초대 발송", state: "sent" }],
      history: [logEntry({ field: "신규 보호자 등록", before: "—", after: `${form.name.trim()} · ${e.name} ${form.role} 보호자`, reason: "신규 등록" })],
    };
    setRows((rs) => [g, ...rs]);
    setSel(g.id);
    setTab("기본정보");
    setReg(false);
    setForm(EMPTY_FORM);
    setMsg(`${g.name} 보호자 등록 · 앱 초대 발송`);
  };
  const runLink = () => {
    if (!link.reason?.trim()) return setLink({ ...link, err: true });
    const e = splitElder(link.elder);
    update(cur.id, (g) => log({ ...g, elders: [...g.elders, { ...e, role: link.role }] }, "어르신 연결", g.elders.map((x) => x.name).join(" · "), [...g.elders.map((x) => x.name), e.name].join(" · "), link.reason));
    setLink(null);
    setMsg(`${e.name} 님을 ${cur.name} 보호자에 연결 · 이력 저장`);
  };

  const renderTab = () => {
    if (tab === "기본정보")
      return (
        <div>
          <Sec title="연락 및 거주정보">
            <KV k="휴대전화" v={cur.tel} mono />
            <KV k="거주지역" v={cur.region} />
            {isAbroad(cur) && <KV k="현지시간" v={<span className="font-num">{localClock(now, cur.tz)} <span className="text-muted">(KST {localClock(now, 0)} · 시차 {cur.tz > 0 ? "+" : ""}{cur.tz}h)</span></span>} />}
            <KV k="연락 가능시간" v={cur.hours} />
            <KV k="야간 연락" v={cur.night ? "가능 (22:00 이후 포함)" : "불가 — 야간에는 다음 순위로"} tone={cur.night ? "ok" : "warn"} />
            <KV k="앱 계정" v={<span>{cur.app.state} · <Stamp at={cur.app.last} prefix="마지막 접속" /></span>} />
          </Sec>
          <Sec title="연락 수신동의">
            <div className="flex flex-wrap gap-1.5">
              {[["전화", cur.consent.call], ["문자", cur.consent.sms], ["앱 푸시", cur.consent.push], ["야간 연락", cur.night]].map(([l, on]) => <Pill key={l} tone={on ? "ok" : "muted"} dot>{l} {on ? "ON" : "OFF"}</Pill>)}
            </div>
          </Sec>
          <Sec title="연결 어르신 (복수 연결)" right={<Btn small ghost onClick={() => setLink({ elder: ELDERS[0], role: "부", reason: "" })}>+ 어르신 연결</Btn>}>
            <ul className="space-y-1">
              {cur.elders.map((e) => <li key={e.name} className="flex items-center gap-2 text-[13px]"><Pill tone={ROLE_TONE[e.role]}>{e.role} 보호자</Pill>{elderBtn(e)}</li>)}
            </ul>
          </Sec>
          <Sec title="보호자 요청사항">{cur.requests.length ? <ul className="list-disc pl-4 text-[13px] text-ink">{cur.requests.map((r) => <li key={r}>{r}</li>)}</ul> : <Empty>등록된 요청사항이 없습니다.</Empty>}</Sec>
          <Sec title="수정 이력"><HistoryTable rows={cur.history} /></Sec>
        </div>
      );
    if (tab === "권한·동의")
      return (
        <div>
          <KV k="고객정보 열람범위" v={cur.scope} />
          <KV k="보고서 수신" v={cur.reportVia} />
          <KV k="결제 승인" v={cur.payer ? `승인자 · 1회 ${fmtWon(cur.payLimit)} 한도` : "권한 없음 (열람 전용)"} tone={cur.payer ? "ok" : undefined} />
          <KV k="긴급조치 동의" v={cur.emergency} />
          <KV k="SOS 연락 우선순위" v={`${cur.sosOrder}순위`} />
          <KV k="야간 연락 가능" v={cur.night ? "예" : "아니오"} />
          <KV k="수신동의" v={`전화 ${cur.consent.call ? "동의" : "거부"} · 문자 ${cur.consent.sms ? "동의" : "거부"} · 앱 푸시 ${cur.consent.push ? "동의" : "거부"}`} />
          <div className="mt-3"><Note>권한·동의 변경은 [정보 수정]에서 사유와 함께 저장됩니다 — 이전 값은 이력으로 보존.</Note></div>
        </div>
      );
    if (tab === "연락이력")
      return (
        <div>
          <div className="flex flex-wrap gap-1.5">{Object.keys(NOTIFY_STATE).map((k) => <NotifyPill key={k} s={k} />)}</div>
          <div className="mt-2">
            <Table dense cols={[{ k: "at", label: "일시", render: (l) => <span className="font-num whitespace-nowrap">{l.at}</span> }, { k: "ch", label: "채널" }, { k: "text", label: "내용" }, { k: "state", label: "상태", render: (l) => <NotifyPill s={l.state} /> }]} rows={cur.log} rowKey={(l, i) => `${l.at}-${i}`} empty="연락 · 통보 이력이 없습니다." />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn small ghost onClick={() => { addLog(cur.id, { ch: "전화", text: "관제사 확인 전화 시도", state: "called" }); setMsg("전화 시도 기록 · 결과(연결·미연결)는 통화 후 갱신"); }}>전화 연결 기록</Btn>
            <Btn small ghost onClick={() => addLog(cur.id, { ch: "앱 푸시", text: "확인 요청 재알림", state: "sent" })}>재알림 발송</Btn>
          </div>
          <Sec title="상담 · 민원 이력">
            {cur.complaints.length ? <Table dense cols={[{ k: "at", label: "일자" }, { k: "type", label: "구분" }, { k: "text", label: "내용" }, { k: "state", label: "처리", render: (c) => <Pill tone="ok">{c.state}</Pill> }]} rows={cur.complaints} rowKey={(c, i) => `${c.at}-${i}`} /> : <Empty>상담 · 민원 이력이 없습니다.</Empty>}
          </Sec>
        </div>
      );
    if (tab === "보고서")
      return (
        <div>
          <KV k="수신방법" v={cur.reportVia} />
          <KV k="최근 열람" v={cur.report} tone={isUnread(cur) ? "warn" : "ok"} />
          <div className="mt-2"><Table dense cols={[{ k: "at", label: "일자", render: (r) => <span className="font-num">{r.at}</span> }, { k: "title", label: "보고서" }, { k: "state", label: "열람 상태", render: (r) => <NotifyPill s={r.state} /> }]} rows={cur.reports} rowKey={(r, i) => `${r.at}-${i}`} empty="발송된 보고서가 없습니다." /></div>
          {isUnread(cur) && <div className="mt-2"><Btn small ghost tone="warn" onClick={() => { addLog(cur.id, { ch: "보고서", text: "미열람 보고서 재발송", state: "sent" }); setMsg("보고서 재발송 · 열람되면 상태가 바뀝니다"); }}>미열람 보고서 재발송</Btn></div>}
        </div>
      );
    return (
      <div>
        <KV k="승인권한" v={cur.payer ? "승인자" : "없음 (열람 전용)"} />
        <KV k="1회 한도" v={cur.payer ? fmtWon(cur.payLimit) : "—"} mono />
        <div className="mt-2"><Table dense cols={[{ k: "at", label: "일자" }, { k: "item", label: "항목" }, { k: "amount", label: "금액", align: "right", render: (p) => fmtWon(p.amount) }, { k: "state", label: "상태", render: (p) => <NotifyPill s={p.state} /> }]} rows={cur.payments} rowKey={(p, i) => `${p.at}-${i}`} empty="결제 승인 이력이 없습니다." /></div>
        <div className="mt-2 text-[11px] text-muted">금액은 서비스 메뉴 가격 기준 · 요금 확정 전 항목은 "별도 산정"으로 표시됩니다.</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">보호자 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">연락 우선순위 · 알림 · 보고서 · 결제권한 및 소통이력을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Btn ghost onClick={() => setMsg("엑셀 다운로드는 권한 확인 후 제공됩니다 · 연락처는 마스킹 상태로 · 다운로드는 감사로그에 기록")}><span className="inline-flex items-center gap-1"><Icon name="download" size={14} /> 엑셀 다운로드</span></Btn>
          <Btn onClick={() => setReg(true)}><span className="inline-flex items-center gap-1"><Icon name="plus" size={14} /> 신규 보호자 등록</span></Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} unit="명" tone={s.tone} active={s.active} onClick={s.on} />)}
      </div>

      <Panel className="!p-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr]">
          <Field id="g-q" label="검색" value={q} onChange={setQ} placeholder="보호자 · 어르신 · 연락처" />
          <Field id="g-role" label="역할" value={f.role} onChange={setFl("role")} options={[F.role, ...ROLES]} />
          <Field id="g-where" label="거주지역" value={f.where} onChange={setFl("where")} options={[F.where, "국내", "해외"]} />
          <Field id="g-rep" label="보고서" value={f.rep} onChange={setFl("rep")} options={[F.rep, "열람", "미열람"]} />
          <Field id="g-pay" label="결제권한" value={f.pay} onChange={setFl("pay")} options={[F.pay, "승인자", "열람 전용"]} />
          <Field id="g-contact" label="연락상태" value={f.contact} onChange={setFl("contact")} options={[F.contact, "정상", "확인 필요"]} />
        </div>
      </Panel>

      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-navy">보호자 명부</h2>
            <span className="text-[12px] text-muted">확인 필요 · 미열람 우선</span>
          </div>
          <div className="mt-2"><Table cols={cols} rows={list} onRow={(g) => setSel(g.id)} rowKey={(g) => g.id} selected={cur?.id} /></div>
          <div className="mt-2 text-right font-num text-[11px] text-muted">1–{list.length} / {GUARDIAN_STATS.total}명</div>
        </Panel>

        {cur && (
          <Panel>
            <div className="flex flex-wrap items-start gap-3">
              <Avatar name={cur.name} size={44} tone="info" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-bold text-navy">{cur.name} 보호자</h2>
                  <Pill tone={ROLE_TONE[cur.role]}>{cur.role} 보호자</Pill>
                  <Pill tone="gold">{cur.sosOrder}순위 연락</Pill>
                  <Pill tone={CONTACT_TONE[cur.contact]}>{cur.contact}</Pill>
                </div>
                <div className="mt-0.5 text-[12px] text-muted">{cur.elders.map((e) => `${e.name} 고객의 ${cur.rel}`).join(" · ")} · {cur.region}{isAbroad(cur) ? ` · 현지 ${localClock(now, cur.tz)}` : ""}</div>
              </div>
              <Btn small onClick={() => setEdit(true)}>정보 수정</Btn>
            </div>
            <Tabs className="mt-3" tabs={GUARDIAN_TABS.map((t) => [t, t, t === "연락이력" ? cur.log.length : undefined])} value={tab} onChange={setTab} />
            <div className="mt-3">{renderTab()}</div>
          </Panel>
        )}
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>

      {edit && cur && <EditDrawer title={`${cur.name} 보호자 정보 수정`} sub="수정 사유 필수 · 이전 값은 이력으로 보존" fields={editFields} onClose={() => setEdit(false)} onSave={onEdit} />}

      <Confirm open={Boolean(link)} title="어르신을 추가로 연결합니다" onCancel={() => setLink(null)} onConfirm={runLink} confirmLabel="연결">
        {link && (
          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field id="lk-elder" label="어르신" value={link.elder} onChange={(v) => setLink({ ...link, elder: v })} options={ELDERS} />
              <Field id="lk-role" label="역할" value={link.role} onChange={(v) => setLink({ ...link, role: v })} options={ROLES} />
            </div>
            <Field id="lk-reason" label="사유" type="textarea" value={link.reason} onChange={(v) => setLink({ ...link, reason: v, err: false })} placeholder="누가 왜 요청했는지" required hint={link.err ? "사유가 있어야 실행됩니다" : "연결 내용과 사유가 수정이력에 남습니다"} />
          </div>
        )}
      </Confirm>

      <Drawer
        open={reg}
        onClose={() => setReg(false)}
        title="신규 보호자 등록"
        sub="연결 어르신 · 우선순위 · 수신동의 · 보고서 · 결제권한 · 열람범위"
        width={560}
        footer={<div className="flex justify-end gap-2"><Btn ghost tone="muted" onClick={() => setReg(false)}>취소</Btn><Btn disabled={!form.name.trim()} onClick={register}>등록</Btn></div>}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="gr-name" label="이름" value={form.name} onChange={setF("name")} required />
            <Field id="gr-rel" label="관계" value={form.rel} onChange={setF("rel")} options={RELS} />
            <Field id="gr-role" label="역할" value={form.role} onChange={setF("role")} options={ROLES} hint="주 · 부 · 비상 우선순위" />
          </div>
          <Field id="gr-elder" label="연결 어르신" value={form.elder} onChange={setF("elder")} options={ELDERS} hint="등록 후 [+ 어르신 연결]로 복수 연결" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="gr-tel" label="휴대전화" value={form.tel} onChange={setF("tel")} placeholder="010-0000-0000" hint="저장 시 마스킹" />
            <Field id="gr-region" label="거주지역" value={form.region} onChange={setF("region")} placeholder="서울 강남구" />
            <Field id="gr-tz" label="해외 시간대" value={form.tz} onChange={setF("tz")} options={Object.keys(TZ)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Row id="gr-call" label="전화 수신 동의" on={form.call} onChange={setF("call")} />
            <Row id="gr-sms" label="문자 수신 동의" on={form.sms} onChange={setF("sms")} />
            <Row id="gr-push" label="앱 푸시 수신 동의" on={form.push} onChange={setF("push")} />
            <Row id="gr-night" label="야간 연락 가능" hint="22:00 이후" on={form.night} onChange={setF("night")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="gr-sos" label="SOS 연락 우선순위" value={form.sos} onChange={setF("sos")} options={["1", "2", "3"]} />
            <Field id="gr-via" label="보고서 수신방법" value={form.via} onChange={setF("via")} options={REPORT_VIA} />
          </div>
          <Row id="gr-payer" label="결제 승인권한" hint="해주세요 유료 서비스 승인" on={form.payer} onChange={setF("payer")} />
          {form.payer && <Field id="gr-limit" label="1회 승인 한도 (원)" type="number" value={form.limit} onChange={setF("limit")} hint={`${fmtWon(Number(form.limit) || 0)}`} />}
          <Field id="gr-scope" label="고객정보 열람범위" value={form.scope} onChange={setF("scope")} options={SCOPES} />
        </div>
      </Drawer>
    </div>
  );
}
