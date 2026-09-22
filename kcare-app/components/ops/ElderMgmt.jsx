// 어르신 관리 — 명부(검색·필터·엑셀) + 신규 등록 + 상세 14탭 + 사유 필수 수정이력 (요청서 7절).
// 서비스 시작·일시중지·종료 · 담당 변경 · 보호자 연결은 Confirm 을 거치고 이력을 남긴다.
import { useState } from "react";
import { Panel, Stat, Pill, SevPill, FeedPill, Avatar, Btn, Tabs, Table, Field, Toggle, Drawer, Confirm, Note } from "./ui";
import Icon from "../icons";
import { ROSTERS } from "../../lib/rosters";
import { ELDER_TABS, SERVICE_STATE, elderDetail, feedOf, sevOf, logEntry, TODAY } from "../../lib/ops-mgmt";
import { GUARDIANS } from "../../lib/ops-mgmt-people";
import ElderTabs from "./mgmt/ElderTabs";
import { EditDrawer } from "./mgmt/EditLog";

const ALL_BRANCH = "전체 지점";
const ALL_LOC = "전체 거주";
const BRANCHES = [ALL_BRANCH, ...new Set(ROSTERS.elders.rows.map((r) => r[3]))];
const STAFF = ROSTERS.concierges.rows.map((r) => r[0]);
const RISK_RANK = { 높음: 0, 중간: 1, 낮음: 2 };
const RELS = ["아들", "장녀", "차녀", "삼남", "배우자", "며느리", "사위", "손주", "기타"];
const PRODUCTS = ["K-CARE 멤버십 티어1", "K-CARE 멤버십 티어2", "K-CARE 멤버십 티어3"];
const PAYS = ["정상 · 자동결제", "결제 대기", "미납 · 안내 필요"];
const consentAll = { call: true, sms: true, push: true };

// 보호자는 브리프 데모 인물(lib/ops-mgmt-people) 우선, 없으면 명부(lib/rosters)
const guardiansOf = (name) => {
  const mine = GUARDIANS.filter((g) => g.elders.some((e) => e.name === name)).map((g) => ({ name: g.name, rel: g.rel, role: `${g.role} 보호자`, region: g.region, tel: g.tel, consent: g.consent }));
  if (mine.length) return mine;
  return ROSTERS.guardians.rows.filter((r) => r[3].startsWith(name)).map((r) => ({ name: r[0], rel: r[1], role: r[2], region: r[5], tel: r[9], consent: consentAll }));
};
const build = (row) => ({ ...elderDetail(row), guardians: guardiansOf(row[0]) });
const VIEWS = { all: () => true, risk: (e) => e.risk === "높음", watch: (e) => e.watch !== "정상 수신", nosub: (e) => e.sub === "—", paused: (e) => e.service.state !== "active" };
const VIEW_LABEL = { all: "전체", risk: "위험 높음", watch: "워치 이상", nosub: "부 담당 없음", paused: "일시중지 · 종료" };
const EMPTY_FORM = { name: "", sex: "여", born: "1948", loc: "자택", dong: "", branch: "강남 본점", gName: "", gRel: "아들", pri: "박지현", sub: "서다인", watchId: "", sensor: "거실 · 욕실", threshold: false, priority: "1순위 주 보호자 → 2순위 부 보호자 → 담당 컨시어지 → 119", visitDay: "매월 셋째 주", product: PRODUCTS[0], pay: PAYS[1], cEmergency: false, cEntry: false };

export default function ElderMgmt() {
  const [elders, setElders] = useState(() => ROSTERS.elders.rows.map(build));
  const [sel, setSel] = useState("김순자");
  const [tab, setTab] = useState("기본정보");
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState(ALL_BRANCH);
  const [view, setView] = useState("all");
  const [loc, setLoc] = useState(ALL_LOC);
  const [reg, setReg] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const cur = elders.find((e) => e.name === sel) || elders[0];
  const update = (name, fn) => setElders((es) => es.map((e) => (e.name === name ? fn(e) : e)));
  const log = (e, field, before, after, reason) => ({ ...e, history: [logEntry({ field, before, after, reason }), ...e.history] });

  const stats = [
    { k: "all", label: "전체 관리 어르신", value: elders.length, tone: "navy" },
    { k: "risk", label: "위험 높음", value: elders.filter(VIEWS.risk).length, tone: "danger" },
    { k: "watch", label: "워치 이상", value: elders.filter(VIEWS.watch).length, tone: "device" },
    { k: "nosub", label: "부 담당 없음", value: elders.filter(VIEWS.nosub).length, tone: "warn" },
    { k: "paused", label: "일시중지 · 종료", value: elders.filter(VIEWS.paused).length, tone: "warn" },
  ];
  const list = elders
    .filter(VIEWS[view])
    .filter((e) => branch === ALL_BRANCH || e.branch === branch)
    .filter((e) => loc === ALL_LOC || (loc === "자택" ? e.loc === "home" : e.loc === "hospital"))
    .filter((e) => !q || e.name.includes(q) || e.dong.includes(q) || e.pri.includes(q) || e.sub.includes(q))
    .sort((a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk] || (a.watch === "정상 수신") - (b.watch === "정상 수신"));

  const cols = [
    { k: "name", label: "이름", render: (e) => <span className="font-bold text-navy">{e.name}</span> },
    { k: "sa", label: "성별 · 나이", render: (e) => <span className="font-num">{e.sex} · {e.age}</span> },
    { k: "where", label: "지점 · 동", render: (e) => <>{e.branch}<span className="block text-[11px] text-muted">{e.dong}</span></> },
    { k: "loc", label: "거주", render: (e) => (e.loc === "hospital" ? <Pill tone="info">요양병원</Pill> : <span className="text-muted">자택</span>) },
    { k: "staff", label: "담당 주 · 부", render: (e) => <>{e.pri} · {e.sub === "—" ? <span className="font-bold text-gold">미배정</span> : e.sub}</> },
    { k: "watch", label: "워치", render: (e) => <FeedPill feed={feedOf(e.watch)} /> },
    { k: "risk", label: "위험", render: (e) => <SevPill sev={sevOf(e.risk)} /> },
    { k: "svc", label: "서비스", render: (e) => <Pill tone={SERVICE_STATE[e.service.state].tone}>{SERVICE_STATE[e.service.state].label}</Pill> },
    { k: "next", label: "다음 일정", render: (e) => <span className="text-[12px] text-muted">{e.next}</span> },
  ];

  const editFields = cur
    ? [
        { label: "주소 (동)", value: cur.dong, apply: (e, v) => ({ ...e, dong: v }) },
        { label: "거주형태", value: cur.loc === "hospital" ? "요양병원" : "자택", options: ["자택", "요양병원"], apply: (e, v) => ({ ...e, loc: v === "요양병원" ? "hospital" : "home" }) },
        { label: "월 방문일정", value: cur.service.visitDay, apply: (e, v) => ({ ...e, service: { ...e.service, visitDay: v } }) },
        { label: "서비스 상품", value: cur.service.product, options: PRODUCTS, apply: (e, v) => ({ ...e, service: { ...e.service, product: v } }) },
        { label: "결제상태", value: cur.service.pay, options: PAYS, apply: (e, v) => ({ ...e, service: { ...e.service, pay: v } }) },
        { label: "긴급연락 우선순위", value: cur.priority.join(" → "), apply: (e, v) => ({ ...e, priority: v.split("→").map((s) => s.trim()).filter(Boolean) }) },
        { label: "경보 임계값 (개별)", value: cur.devices.watch.threshold, apply: (e, v) => ({ ...e, devices: { ...e.devices, watch: { ...e.devices.watch, threshold: v } } }) },
        { label: "워치 기기번호", value: cur.devices.watch.id, apply: (e, v) => ({ ...e, devices: { ...e.devices, watch: { ...e.devices.watch, id: v } } }) },
        { label: "주 이용 병원", value: cur.health.hospital, apply: (e, v) => ({ ...e, health: { ...e.health, hospital: v } }) },
      ]
    : [];
  const onEdit = (f, after, reason) => {
    update(cur.name, (e) => log(f.apply(e, after), f.label, String(f.value), after, reason));
    setEdit(false);
    setMsg(`${cur.name} 님 ${f.label} 수정 · 사유와 함께 이력 저장`);
  };

  const canReg = form.name.trim() && form.dong.trim() && form.gName.trim() && form.pri !== form.sub && form.cEmergency;
  const register = () => {
    const age = String(2026 - Number(form.born || 1948));
    const row = [form.name.trim(), form.sex, age, form.branch, form.dong.trim(), "—", "—", TODAY, "—", form.product.replace("K-CARE 멤버십 ", ""), form.pri, form.sub, form.watchId ? "정상 수신" : "워치 미착용", "중간", "온보딩 방문 예정"];
    let e = build(row);
    e = {
      ...e,
      loc: form.loc === "요양병원" ? "hospital" : "home",
      guardians: [{ name: form.gName.trim(), rel: form.gRel, role: "주 보호자", region: "—", tel: "등록 후 마스킹", consent: consentAll }],
      service: { ...e.service, product: form.product, pay: form.pay, visitDay: form.visitDay },
      priority: form.priority.split("→").map((s) => s.trim()).filter(Boolean),
      devices: { watch: { ...e.devices.watch, id: form.watchId || "연결 대기", feed: form.watchId ? "live" : "unworn", threshold: form.threshold ? "개별 임계값 설정 예정 (관제기준 설정)" : "기본값 적용" }, sensors: [{ type: "mmWave 센서", place: form.sensor, at: "—", state: "설치 예정" }] },
      docs: [{ name: "긴급조치 사전동의서", state: form.cEmergency ? "서명 완료" : "미서명", at: TODAY }, { name: "출입 동의서", state: form.cEntry ? "서명 완료" : "미서명", at: TODAY }],
    };
    e = log(e, "신규 고객 등록", "—", `${e.name} · ${form.loc} · ${form.branch}`, "신규 등록");
    setElders((es) => [e, ...es]);
    setSel(e.name);
    setTab("기본정보");
    setReg(false);
    setForm(EMPTY_FORM);
    setMsg(`${e.name} 님 등록 완료 · 온보딩 방문 일정은 방문관리에서 등록합니다`);
  };

  const setC = (k) => (v) => setConfirm((c) => ({ ...c, [k]: v, err: false }));
  const runConfirm = () => {
    const c = confirm;
    if (!c.reason?.trim()) return setConfirm({ ...c, err: true });
    if (c.type === "service") update(cur.name, (e) => log({ ...e, service: { ...e.service, state: c.to } }, "서비스 상태", SERVICE_STATE[e.service.state].label, SERVICE_STATE[c.to].label, c.reason));
    if (c.type === "concierge") update(cur.name, (e) => log({ ...e, pri: c.pri, sub: c.sub }, "담당 컨시어지", `${e.pri} · ${e.sub}`, `${c.pri} · ${c.sub}`, c.reason));
    if (c.type === "guardian") update(cur.name, (e) => log({ ...e, guardians: [...e.guardians, { name: c.name.trim(), rel: c.rel, role: `${c.role} 보호자`, region: "—", tel: "등록 후 마스킹", consent: consentAll }] }, "보호자 연결", e.guardians.map((g) => g.name).join(" · ") || "—", [...e.guardians.map((g) => g.name), c.name.trim()].join(" · "), c.reason));
    setConfirm(null);
    setMsg("확인 절차를 거쳐 실행 · 이력 저장");
  };
  const ctitle = confirm ? { service: `서비스를 ${SERVICE_STATE[confirm.to]?.label} 상태로 바꿉니다`, concierge: "담당 컨시어지를 변경합니다", guardian: "보호자를 연결합니다" }[confirm.type] : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">어르신 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">명부 · 상세정보 · 담당 · 기기 · 동의서 · 수정이력을 한곳에서 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Btn ghost onClick={() => setMsg("엑셀 다운로드는 권한 확인 후 제공됩니다 · 다운로드는 감사로그에 기록")} title="권한 확인 후 다운로드 · 감사로그 기록">
            <span className="inline-flex items-center gap-1"><Icon name="download" size={14} /> 엑셀 다운로드</span>
          </Btn>
          <Btn onClick={() => setReg(true)}>
            <span className="inline-flex items-center gap-1"><Icon name="plus" size={14} /> 신규 고객 등록</span>
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => <Stat key={s.k} label={s.label} value={s.value} unit="명" tone={s.tone} active={view === s.k} onClick={() => setView(view === s.k && s.k !== "all" ? "all" : s.k)} />)}
      </div>

      <Panel className="!p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <Field id="elder-q" label="검색" value={q} onChange={setQ} placeholder="이름 · 동 · 담당 컨시어지" />
          <Field id="elder-branch" label="지점" value={branch} onChange={setBranch} options={BRANCHES} />
          <Field id="elder-view" label="보기" value={VIEW_LABEL[view]} onChange={(l) => setView(Object.keys(VIEW_LABEL).find((k) => VIEW_LABEL[k] === l) || "all")} options={Object.values(VIEW_LABEL)} />
          <Field id="elder-loc" label="거주형태" value={loc} onChange={setLoc} options={[ALL_LOC, "자택", "요양병원"]} />
        </div>
      </Panel>

      {msg && <Note tone="ok">{msg}</Note>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-navy">어르신 명부</h2>
            <span className="text-[12px] text-muted">위험도 · 워치 이상 우선 · <span className="font-num">{list.length}</span>명</span>
          </div>
          <div className="mt-2"><Table cols={cols} rows={list} onRow={(e) => setSel(e.name)} rowKey={(e) => e.name} selected={cur?.name} /></div>
        </Panel>

        {cur && (
          <Panel>
            <div className="flex flex-wrap items-start gap-3">
              <Avatar name={cur.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-bold text-navy">{cur.name}</h2>
                  <span className="font-num text-[13px] text-muted">{cur.age}세 · {cur.sex}</span>
                  <SevPill sev={sevOf(cur.risk)} />
                  <Pill tone={SERVICE_STATE[cur.service.state].tone}>{SERVICE_STATE[cur.service.state].label}</Pill>
                  <FeedPill feed={feedOf(cur.watch)} />
                </div>
                <div className="mt-0.5 text-[12px] text-muted">{cur.branch} · {cur.addr} · 담당 {cur.pri} · {cur.sub} · 등록 <span className="font-num">{cur.regDate}</span></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn small onClick={() => setEdit(true)}>정보 수정</Btn>
              <Btn small ghost onClick={() => setConfirm({ type: "concierge", pri: cur.pri, sub: cur.sub === "—" ? STAFF[0] : cur.sub, reason: "" })}>담당 컨시어지 변경</Btn>
              <Btn small ghost onClick={() => setConfirm({ type: "guardian", name: "", rel: "아들", role: "부", reason: "" })}>보호자 연결</Btn>
              <span className="ml-auto flex gap-2">
                {cur.service.state !== "active" && <Btn small ghost tone="ok" onClick={() => setConfirm({ type: "service", to: "active", reason: "" })}>서비스 시작</Btn>}
                {cur.service.state === "active" && <Btn small ghost tone="warn" onClick={() => setConfirm({ type: "service", to: "paused", reason: "" })}>일시중지</Btn>}
                {cur.service.state !== "ended" && <Btn small ghost tone="muted" onClick={() => setConfirm({ type: "service", to: "ended", reason: "" })}>서비스 종료</Btn>}
              </span>
            </div>
            <Tabs className="mt-3" tabs={ELDER_TABS.map((t) => [t, t, t === "수정이력" ? cur.history.length : undefined])} value={tab} onChange={setTab} />
            <div className="mt-3"><ElderTabs e={cur} tab={tab} onChange={(fn) => update(cur.name, fn)} /></div>
          </Panel>
        )}
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>

      {edit && cur && <EditDrawer title={`${cur.name} 님 정보 수정`} sub="수정 사유 필수 · 이전 값은 이력으로 보존" fields={editFields} onClose={() => setEdit(false)} onSave={onEdit} />}

      <Confirm open={Boolean(confirm)} title={ctitle} onCancel={() => setConfirm(null)} onConfirm={runConfirm} confirmLabel="확인 · 실행" tone={confirm?.type === "service" && confirm.to === "ended" ? "warn" : "navy"}>
        {confirm && (
          <div className="mt-3 space-y-2">
            {confirm.type === "service" && <p className="text-[13px] text-ink">{cur.name} 님 · 현재 {SERVICE_STATE[cur.service.state].label}{confirm.to === "ended" ? " — 종료 후에는 방문·알림·보고서가 모두 멈춥니다. 되돌리려면 서비스 시작을 다시 실행해야 합니다." : ""}</p>}
            {confirm.type === "concierge" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Field id="cf-pri" label="주 담당" value={confirm.pri} onChange={setC("pri")} options={STAFF} />
                <Field id="cf-sub" label="부 담당" value={confirm.sub} onChange={setC("sub")} options={STAFF} hint={confirm.pri === confirm.sub ? "주·부가 같을 수 없습니다" : undefined} />
              </div>
            )}
            {confirm.type === "guardian" && (
              <div className="grid gap-2 sm:grid-cols-3">
                <Field id="cf-gname" label="보호자 이름" value={confirm.name} onChange={setC("name")} required />
                <Field id="cf-grel" label="관계" value={confirm.rel} onChange={setC("rel")} options={RELS} />
                <Field id="cf-grole" label="역할" value={confirm.role} onChange={setC("role")} options={["주", "부", "비상"]} />
              </div>
            )}
            <Field id="cf-reason" label="사유" type="textarea" value={confirm.reason} onChange={setC("reason")} placeholder="누가 왜 요청했는지" required hint={confirm.err ? "사유가 있어야 실행됩니다" : "실행 내용과 사유가 수정이력·감사로그에 남습니다"} />
          </div>
        )}
      </Confirm>

      <Drawer
        open={reg}
        onClose={() => setReg(false)}
        title="신규 고객 등록"
        sub="기본정보 · 거주형태 · 보호자 · 담당 · 기기 · 일정 · 상품 · 동의서"
        width={560}
        footer={
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted">{form.cEmergency ? "" : "긴급조치 동의서 서명이 있어야 등록됩니다"}</span>
            <div className="flex gap-2">
              <Btn ghost tone="muted" onClick={() => setReg(false)}>취소</Btn>
              <Btn disabled={!canReg} onClick={register}>등록</Btn>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="nr-name" label="이름" value={form.name} onChange={setF("name")} required />
            <Field id="nr-sex" label="성별" value={form.sex} onChange={setF("sex")} options={["여", "남"]} />
            <Field id="nr-born" label="출생연도" type="number" value={form.born} onChange={setF("born")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="nr-loc" label="거주형태" value={form.loc} onChange={setF("loc")} options={["자택", "요양병원"]} hint={form.loc === "요양병원" ? "21항목이 병실 7 로 바뀝니다" : undefined} />
            <Field id="nr-dong" label="주소 (동 · 병원명)" value={form.dong} onChange={setF("dong")} placeholder="예) 대치동" required />
            <Field id="nr-branch" label="지점" value={form.branch} onChange={setF("branch")} options={BRANCHES.slice(1)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="nr-gname" label="보호자 연결 (주)" value={form.gName} onChange={setF("gName")} placeholder="이름" required />
            <Field id="nr-grel" label="관계" value={form.gRel} onChange={setF("gRel")} options={RELS} />
            <Field id="nr-pri" label="담당 컨시어지 (주)" value={form.pri} onChange={setF("pri")} options={STAFF} />
            <Field id="nr-sub" label="담당 컨시어지 (부)" value={form.sub} onChange={setF("sub")} options={STAFF} hint={form.pri === form.sub ? "주·부가 같을 수 없습니다" : undefined} />
            <Field id="nr-watch" label="워치 연결 (기기번호)" value={form.watchId} onChange={setF("watchId")} placeholder="비우면 연결 대기" />
            <Field id="nr-sensor" label="센서 연결 (설치장소)" value={form.sensor} onChange={setF("sensor")} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
            <label htmlFor="nr-threshold" className="text-[13px] font-medium text-ink">경보 임계값 개별 설정 <span className="block text-[11px] text-muted">평상시 수치가 기본값과 다르면 켭니다 · 값은 관제기준 설정에서</span></label>
            <Toggle id="nr-threshold" on={form.threshold} onChange={setF("threshold")} label="경보 임계값 개별 설정" />
          </div>
          <Field id="nr-priority" label="긴급연락 우선순위" value={form.priority} onChange={setF("priority")} hint="→ 로 구분" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="nr-visit" label="월 방문일정" value={form.visitDay} onChange={setF("visitDay")} />
            <Field id="nr-product" label="서비스 상품" value={form.product} onChange={setF("product")} options={PRODUCTS} />
            <Field id="nr-pay" label="결제상태" value={form.pay} onChange={setF("pay")} options={PAYS} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
            <label htmlFor="nr-cemg" className="text-[13px] font-medium text-ink">긴급조치 사전동의서 <span className="block text-[11px] text-muted">119 신고 · 병원 이송 — 서명 필수</span></label>
            <Toggle id="nr-cemg" on={form.cEmergency} onChange={setF("cEmergency")} label="긴급조치 사전동의" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-navy/[.04] px-3 py-2.5">
            <label htmlFor="nr-centry" className="text-[13px] font-medium text-ink">출입 동의서 <span className="block text-[11px] text-muted">도어락 비밀번호 보관 · 현장 진입</span></label>
            <Toggle id="nr-centry" on={form.cEntry} onChange={setF("cEntry")} label="출입 동의" />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
