// 웨어러블·센서 관리 — 요청서 10절 · 시안 "웨어러블·센서 관리".
// 고객별 장비 연결 상태와 실시간 수신 데이터를 한 화면에서 점검한다. 수신 이상은 원인 8종으로 구분한다.
import { useMemo, useState } from "react";
import { Avatar, Btn, Drawer, Empty, Field, Note, Panel, PanelHead, Pill, SevBar, Stamp, Stat, Tabs, TONE } from "./ui";
import { DevicesTab, FaultsTab, RealtimeTab, SwapsTab, TimelineTab } from "./Devices/DeviceTabs";
import { CAUSES, DEVICES, DEVICE_STATE, DEVICE_TYPES, FLEET, PLACES, sortDevices } from "../../lib/ops-devices";
import { fmtDate, fmtTime, MIN, useNow } from "../../lib/ops-time";

const STATUS_OPTS = ["전체 상태", "위험", "점검", "주의", "정상"];
const TYPE_OPTS = ["장비 유형 전체", "갤럭시 Fit3 이슈", "mmWave 센서 이슈", "이슈 없음"];
const REGION_OPTS = ["담당 권역 전체", "강남", "서초", "송파", "강동"];
const SEV_OF = { danger: "danger", check: "device", warn: "warn", ok: "ok" };
const TABS = [["devices", "장비 현황"], ["realtime", "실시간 데이터"], ["timeline", "이벤트 타임라인"], ["faults", "장애 이력"], ["swaps", "교체·회수"]];

function issueSource(r) {
  if (r.cause === "sensor_off") return "센서";
  if (r.cause || r.status !== "ok") return "워치";
  return null;
}

export default function Devices() {
  const now = useNow(1000);
  const [rows, setRows] = useState(DEVICES);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(STATUS_OPTS[0]);
  const [type, setType] = useState(TYPE_OPTS[0]);
  const [region, setRegion] = useState(REGION_OPTS[0]);
  const [selName, setSelName] = useState(DEVICES[0].name);
  const [tab, setTab] = useState("devices");
  const [reg, setReg] = useState(null);

  const sorted = useMemo(() => sortDevices(rows), [rows]);
  const filtered = useMemo(() => sorted.filter((r) => {
    if (status !== STATUS_OPTS[0] && DEVICE_STATE[r.status].label !== status) return false;
    if (region !== REGION_OPTS[0] && r.district !== region) return false;
    const src = issueSource(r);
    if (type === TYPE_OPTS[1] && src !== "워치") return false;
    if (type === TYPE_OPTS[2] && src !== "센서") return false;
    if (type === TYPE_OPTS[3] && src) return false;
    const s = q.trim();
    if (s && !(r.name.includes(s) || r.watch.id.includes(s) || r.sensors.some((x) => x.id.includes(s)))) return false;
    return true;
  }), [sorted, status, region, type, q]);
  const sel = rows.find((r) => r.name === selName) || sorted[0];
  const noData = rows.filter((r) => r.cause && r.cause !== "sensor_off").length;
  const needsCheck = rows.filter((r) => r.status === "check" || r.status === "warn").length;

  // 기기 등록 — 워치는 교체 이력, 센서는 신규 등록 이력을 남긴다 (덮어쓰지 않는다)
  function register(f) {
    const today = fmtDate(Date.now());
    setRows(rows.map((r) => {
      if (r.name !== f.customer) return r;
      if (f.type === DEVICE_TYPES[0]) {
        return { ...r, watch: { ...r.watch, id: f.id, registered: today, firmware: r.watch.firmware, lastCheck: `${today} 등록 · 초기 점검 대기` }, swaps: [{ at: today, device: f.id, type: "교체", from: r.watch.id, to: f.id, reason: f.reason || "기기 등록", by: "김태영" }, ...r.swaps] };
      }
      const slot = (r.sensors.reduce((m, s) => Math.max(m, s.slot), 0) || 0) + 1;
      const sensorRow = { slot, place: f.place, type: f.type, model: f.type.startsWith("도어") ? "KDR-10" : "KMW-60G", id: f.id, registered: today, power: f.type.startsWith("도어") ? "배터리 (100%)" : "유선 전원", online: false, rxAgoSec: 0, firmware: f.type.startsWith("도어") ? "0.9.1" : "1.4.2", lastCheck: "설치 후 첫 수신 대기" };
      return { ...r, sensors: [...r.sensors, sensorRow], swaps: [{ at: today, device: f.id, type: "신규 등록", from: "—", to: `${f.type} (${f.place})`, reason: f.reason || "센서 추가", by: "김태영" }, ...r.swaps] };
    }));
    setReg(null);
  }

  return (
    <div className="space-y-4">
      <PanelHead title="웨어러블·센서 관리" sub="고객별 장비 연결 상태와 실시간 수신 데이터를 통합 점검합니다" right={<span className="card-glass rounded-xl px-3 py-1.5">마지막 동기화 <span className="font-num font-bold text-navy">{now ? fmtTime(now - FLEET.syncAgoSec * 1000) : "--:--:--"}</span></span>} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="관리 대상 가구" value={FLEET.households} unit="가구" sub="전체 서비스 가구" tone="ok" />
        <Stat label="갤럭시 Fit 등록" value={FLEET.fitRegistered} unit="대" sub="가구당 1대 필수" tone="ok" />
        <Stat label="등록 센서" value={FLEET.sensors} unit="대" sub="mmWave · 도어 센서" tone="info" />
        <Stat label="데이터 미수신" value={FLEET.noData} unit="건" sub={`명단 표시 ${noData}건 · 원인별 분류`} tone="warn" onClick={() => setType(type === TYPE_OPTS[1] ? TYPE_OPTS[0] : TYPE_OPTS[1])} active={type === TYPE_OPTS[1]} />
        <Stat label="점검 필요" value={FLEET.needsCheck} unit="건" sub={`명단 표시 ${needsCheck}건`} tone="device" onClick={() => setStatus(status === "점검" ? STATUS_OPTS[0] : "점검")} active={status === "점검"} />
      </div>

      <Panel>
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="dev-q" className="min-w-[200px] flex-1">
            <span className="sr-only">고객명·장비 ID 검색</span>
            <input id="dev-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="고객명 · 장비 ID 검색" className="card-glass w-full rounded-[10px] px-3 py-2 text-[13px] font-medium text-navy outline-none focus:ring-1 focus:ring-gold" />
          </label>
          <label htmlFor="dev-status"><span className="sr-only">상태</span><select id="dev-status" value={status} onChange={(e) => setStatus(e.target.value)} className="card-glass rounded-[10px] px-3 py-2 text-[13px] font-bold text-navy">{STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="dev-type"><span className="sr-only">장비 유형</span><select id="dev-type" value={type} onChange={(e) => setType(e.target.value)} className="card-glass rounded-[10px] px-3 py-2 text-[13px] font-bold text-navy">{TYPE_OPTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="dev-region"><span className="sr-only">담당 권역</span><select id="dev-region" value={region} onChange={(e) => setRegion(e.target.value)} className="card-glass rounded-[10px] px-3 py-2 text-[13px] font-bold text-navy">{REGION_OPTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <Btn type="submit">검색</Btn>
          <Btn ghost onClick={() => setReg({ kind: "any" })}>기기 등록</Btn>
        </form>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-4">
          <PanelHead title="고객·장비 현황" sub={`위험·점검 대상 우선 · ${filtered.length}가구 표시`} />
          {filtered.length === 0 ? (
            <div className="mt-3"><Empty>조건에 맞는 가구가 없습니다.</Empty></div>
          ) : (
            <ul className="mt-2 divide-y divide-navy/[.06]">
              {filtered.map((r) => {
                const st = DEVICE_STATE[r.status];
                const on = sel?.name === r.name;
                return (
                  <li key={r.name}>
                    <button type="button" aria-pressed={on} onClick={() => setSelName(r.name)} className="btn-press flex w-full items-stretch gap-2.5 rounded-xl px-2 py-2.5 text-left" style={on ? { background: "rgba(176,141,87,.14)", boxShadow: "inset 0 0 0 1.5px #B08D57" } : undefined}>
                      <SevBar sev={SEV_OF[r.status]} />
                      <Avatar name={r.name} size={36} tone={st.tone} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-bold text-navy">{r.name} <span className="font-num text-[11px] font-normal text-muted">{r.age}세</span></span>
                          <Pill tone={st.tone}>{st.label}</Pill>
                        </span>
                        <span className="mt-0.5 block text-[12px] font-semibold" style={{ color: TONE[st.tone].fg }}>{r.summary}</span>
                        <span className="mt-0.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted">
                          <span>Fit3 기본 + 센서 <span className="font-num">{r.sensors.length}/10</span> · {r.district} · {r.concierge}</span>
                          <Stamp at={now ? fmtTime(now - r.rxAgoMin * MIN) : "—"} prefix="최근" />
                        </span>
                        {r.cause && <span className="mt-1 block"><Pill tone={CAUSES[r.cause].tone} dot>{CAUSES[r.cause].label}</Pill></span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-8">
          {sel ? (
            <>
              <PanelHead
                title={<span className="flex flex-wrap items-center gap-2">{sel.name} 고객 <Pill tone={DEVICE_STATE[sel.status].tone}>{DEVICE_STATE[sel.status].label}</Pill></span>}
                sub={`서울 ${sel.district} · 담당 컨시어지 ${sel.concierge} · Fit3 ${sel.watch.id} · 센서 ${sel.sensors.length}대`}
                right={<Btn ghost small tone="navy" title="고객 상세는 어르신 탭에서 같은 화면으로 열립니다">고객 상세</Btn>}
              />
              <Tabs className="mt-3" value={tab} onChange={setTab} tabs={TABS.map(([k, l]) => [k, l, k === "faults" ? sel.faults.length : k === "swaps" ? sel.swaps.length : k === "timeline" ? sel.timeline.length : undefined])} />
              <div className="mt-3">
                {tab === "devices" && <DevicesTab dev={sel} now={now} onAdd={() => setReg({ kind: "sensor", customer: sel.name })} />}
                {tab === "realtime" && <RealtimeTab dev={sel} now={now} />}
                {tab === "timeline" && <TimelineTab dev={sel} now={now} />}
                {tab === "faults" && <FaultsTab dev={sel} />}
                {tab === "swaps" && <SwapsTab dev={sel} />}
              </div>
            </>
          ) : (
            <Empty>왼쪽에서 고객을 선택하세요.</Empty>
          )}
        </Panel>
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 장비 등록·교체·회수는 이력으로 남습니다.</Note>

      <RegisterDrawer reg={reg} rows={rows} onClose={() => setReg(null)} onSave={register} />
    </div>
  );
}

function RegisterDrawer({ reg, rows, onClose, onSave }) {
  if (!reg) return null;
  return <RegisterBody key={`${reg.kind}-${reg.customer || ""}`} reg={reg} rows={rows} onClose={onClose} onSave={onSave} />;
}

function RegisterBody({ reg, rows, onClose, onSave }) {
  const [type, setType] = useState(reg.kind === "sensor" ? DEVICE_TYPES[1] : DEVICE_TYPES[0]);
  const [id, setId] = useState("");
  const [customer, setCustomer] = useState(reg.customer || rows[0].name);
  const [place, setPlace] = useState(PLACES[0]);
  const [reason, setReason] = useState("");
  const isSensor = type !== DEVICE_TYPES[0];
  const target = rows.find((r) => r.name === customer);
  const full = isSensor && target && target.sensors.length >= 10;
  const valid = id.trim().length >= 4 && !full;
  return (
    <Drawer open onClose={onClose} title={isSensor ? "센서 추가" : "기기 등록"} sub="기기 종류 · 번호 · 고객 · 설치장소" width={440}
      footer={<div className="flex justify-end gap-2"><Btn ghost tone="muted" onClick={onClose}>취소</Btn><Btn disabled={!valid} onClick={() => onSave({ type, id: id.trim(), customer, place, reason })}>등록</Btn></div>}>
      <div className="space-y-3">
        <Field id="dev-reg-type" label="기기 종류" value={type} onChange={setType} options={DEVICE_TYPES} required />
        <Field id="dev-reg-id" label="기기번호" value={id} onChange={setId} placeholder={isSensor ? "예: KMW-1103" : "예: KCF-260922"} required />
        <Field id="dev-reg-customer" label="연결 고객" value={customer} onChange={setCustomer} options={rows.map((r) => r.name)} required hint={target ? `현재 센서 ${target.sensors.length}/10 · Fit3 ${target.watch.id}` : undefined} />
        {isSensor && <Field id="dev-reg-place" label="센서 설치장소" value={place} onChange={setPlace} options={PLACES} required />}
        <Field id="dev-reg-reason" label="등록·교체 사유" value={reason} onChange={setReason} placeholder={isSensor ? "예: 욕실 낙상 감지 강화" : "예: 충전 단자 불량 교체"} />
        {full && <Note tone="warn">이 고객은 센서 슬롯 10개가 모두 사용 중입니다. 회수 후 등록하세요.</Note>}
        {!isSensor && target && <Note tone="warn">기존 Fit3 {target.watch.id}는 회수 처리되고 교체 이력에 남습니다.</Note>}
      </div>
    </Drawer>
  );
}
