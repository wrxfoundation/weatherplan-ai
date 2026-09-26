// 병원 관리 — 요청서 §15. 기본 명부(lib/mock MOU_HOSPITALS)를 §15 필드로 넓히고, 등록·수정·삭제를 연다.
// 편집 결과는 localStorage(kcare-ops-hospitals-v1)에 남기고, 수정은 덮어쓰지 않고 변경 이력을 쌓는다.
// 실제 주소·전화는 지어내지 않는다 — 공개 대표정보를 확인한 곳만 적고 나머지는 "확인 중".
import { useEffect, useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Tabs, Table, KV, Field, Drawer, Confirm, Note, Empty, Stamp } from "./ui";
import { ELDERS, ELDER_NAMES, TODAY, elderOf, fmtDT } from "../../lib/ops-admin";
import { HOSPITALS_SEED, HOSPITALS_STORAGE_KEY, HOSPITAL_FIELDS, HOSPITAL_NOTICE, NEAREST_ER } from "../../lib/ops-admin-sys";

const OPERATOR = "김태영 (관제사)";
const ER_OPTIONS = ["운영", "미운영", "확인 중"];
const BOOKING_OPTIONS = ["—", "대기", "예약 진행 중", "예약 확정"];
const CHECK_KEYS = ["address", "phone", "hours", "travel", "parking", "wheelchair", "reception", "guardianNeeded"];
const pendingCount = (h) => CHECK_KEYS.filter((k) => String(h[k]).startsWith("확인 중")).length + (h.er === "확인 중" ? 1 : 0);

const blank = () => ({ name: "", dept: "", partner: "제휴", er: "확인 중", address: "확인 중", phone: "확인 중", hours: "확인 중", travel: "확인 중", parking: "확인 중", wheelchair: "확인 중", reception: "확인 중", guardianNeeded: "확인 중", caution: "", bookingStatus: "—", bookingNext: "", mainFor: [] });
const toForm = (h) => ({ ...blank(), ...h, partner: h.partner ? "제휴" : "비제휴", bookingStatus: h.booking?.status || "—", bookingNext: h.booking?.next || "", mainFor: [...(h.mainFor || [])] });

export default function HospitalsMgmt() {
  const [list, setList] = useState(HOSPITALS_SEED);
  const [removed, setRemoved] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selId, setSelId] = useState(HOSPITALS_SEED[0]?.id || null);
  const [tab, setTab] = useState("basic");
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("전체");
  const [partner, setPartner] = useState("전체");
  const [er, setEr] = useState("전체");
  const [statF, setStatF] = useState("");
  const [form, setForm] = useState(null); // { mode: 'add'|'edit', id?, values }
  const [del, setDel] = useState(null);
  const [sosElder, setSosElder] = useState("김순자");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HOSPITALS_STORAGE_KEY) || "null");
      if (saved && Array.isArray(saved.hospitals) && saved.hospitals.length) setList(saved.hospitals);
      if (saved && Array.isArray(saved.removed)) setRemoved(saved.removed);
    } catch (_) {
      /* 손상된 저장값은 무시 */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(HOSPITALS_STORAGE_KEY, JSON.stringify({ hospitals: list, removed }));
    } catch (_) {
      /* 저장 실패는 데모 동작에 영향 없음 */
    }
  }, [list, removed, loaded]);

  const depts = useMemo(() => ["전체", ...Array.from(new Set(list.map((h) => h.dept)))], [list]);
  const stats = useMemo(() => ({
    partner: list.filter((h) => h.partner).length,
    er: list.filter((h) => h.er === "운영").length,
    main: list.filter((h) => h.mainFor.length > 0).length,
    booking: list.filter((h) => ["대기", "예약 진행 중", "예약 확정"].includes(h.booking?.status)).length,
    pending: list.filter((h) => pendingCount(h) > 0).length,
  }), [list]);

  const rows = useMemo(() => {
    const kw = q.trim();
    return list
      .filter((h) => dept === "전체" || h.dept === dept)
      .filter((h) => partner === "전체" || (partner === "제휴" ? h.partner : !h.partner))
      .filter((h) => er === "전체" || h.er === er)
      .filter((h) => !statF || (statF === "pending" ? pendingCount(h) > 0 : statF === "booking" ? ["대기", "예약 진행 중", "예약 확정"].includes(h.booking?.status) : statF === "main" ? h.mainFor.length > 0 : statF === "er" ? h.er === "운영" : h.partner))
      .filter((h) => !kw || [h.name, h.dept, h.address, ...h.mainFor, h.caution].join(" ").includes(kw))
      // 예외 먼저 — 예약 진행 · 확인 중 많은 곳 → 제휴 → 이름
      .sort((a, b) => (b.booking?.status === "예약 진행 중" ? 1 : 0) - (a.booking?.status === "예약 진행 중" ? 1 : 0) || pendingCount(b) - pendingCount(a) || (b.partner ? 1 : 0) - (a.partner ? 1 : 0) || a.name.localeCompare(b.name, "ko"));
  }, [list, q, dept, partner, er, statF]);

  const cur = list.find((h) => h.id === selId) || rows[0] || list[0] || null;

  // 저장 — 수정은 필드별 전·후를 이력으로 남긴다
  const save = () => {
    const v = form.values;
    if (!v.name.trim() || !v.dept.trim()) return;
    const next = { ...v, name: v.name.trim(), dept: v.dept.trim(), partner: v.partner === "제휴", booking: { status: v.bookingStatus, next: v.bookingNext }, fast: !!v.fast, escorts: v.escorts || [], verified: v.verified || "관제 입력 · 확인 중" };
    delete next.bookingStatus;
    delete next.bookingNext;
    if (form.mode === "add") {
      const id = `h${Date.now()}`;
      setList((p) => [...p, { ...next, id, changes: [{ at: Date.now(), by: OPERATOR, field: "등록", before: "—", after: next.name }] }]);
      setSelId(id);
    } else {
      setList((p) => p.map((h) => {
        if (h.id !== form.id) return h;
        const labels = Object.fromEntries(HOSPITAL_FIELDS.map(([k, l]) => [k, l]));
        const diffs = [];
        Object.keys(labels).forEach((k) => { if (String(h[k] ?? "") !== String(next[k] ?? "")) diffs.push({ at: Date.now(), by: OPERATOR, field: labels[k], before: h[k] || "—", after: next[k] || "—" }); });
        if (h.partner !== next.partner) diffs.push({ at: Date.now(), by: OPERATOR, field: "제휴 여부", before: h.partner ? "제휴" : "비제휴", after: next.partner ? "제휴" : "비제휴" });
        if (h.er !== next.er) diffs.push({ at: Date.now(), by: OPERATOR, field: "응급실 운영", before: h.er, after: next.er });
        if (h.mainFor.join() !== next.mainFor.join()) diffs.push({ at: Date.now(), by: OPERATOR, field: "주 이용 고객", before: h.mainFor.join(", ") || "—", after: next.mainFor.join(", ") || "—" });
        if ((h.booking?.status || "—") !== next.booking.status || (h.booking?.next || "") !== next.booking.next) diffs.push({ at: Date.now(), by: OPERATOR, field: "예약정보", before: `${h.booking?.status || "—"} ${h.booking?.next || ""}`.trim(), after: `${next.booking.status} ${next.booking.next}`.trim() });
        return { ...h, ...next, changes: [...(h.changes || []), ...diffs] };
      }));
    }
    setForm(null);
  };
  const remove = () => {
    const h = list.find((x) => x.id === del);
    if (h) {
      setRemoved((p) => [...p, { at: Date.now(), by: OPERATOR, name: h.name, dept: h.dept }]);
      setList((p) => p.filter((x) => x.id !== del));
      if (selId === del) setSelId(null);
    }
    setDel(null);
  };

  const sosE = elderOf(sosElder);
  const mainHospitals = list.filter((h) => h.mainFor.includes(sosElder));
  const nearestEr = NEAREST_ER[sosE?.district] || "확인 중";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">병원 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">제휴 · 고객 주 이용 병원의 접근성 · 예약 · 동행이력 · 유의사항을 관리합니다</p>
        </div>
        <Btn onClick={() => setForm({ mode: "add", values: blank() })}><Icon name="plus" size={14} /> 병원 등록</Btn>
      </div>
      <Note tone="warn">{HOSPITAL_NOTICE}</Note>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="제휴 병원" value={stats.partner} unit="곳" active={statF === "partner"} onClick={() => setStatF(statF === "partner" ? "" : "partner")} />
        <Stat label="응급실 운영" value={stats.er} unit="곳" tone="ok" active={statF === "er"} onClick={() => setStatF(statF === "er" ? "" : "er")} />
        <Stat label="고객 주 이용 등록" value={stats.main} unit="곳" tone="info" active={statF === "main"} onClick={() => setStatF(statF === "main" ? "" : "main")} />
        <Stat label="예약 진행 · 확정" value={stats.booking} unit="곳" tone="gold" active={statF === "booking"} onClick={() => setStatF(statF === "booking" ? "" : "booking")} />
        <Stat label="정보 확인 중" value={stats.pending} unit="곳" tone="warn" active={statF === "pending"} onClick={() => setStatF(statF === "pending" ? "" : "pending")} />
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><Field id="hp-q" label="검색" value={q} onChange={setQ} placeholder="병원명 · 진료과 · 고객 · 유의사항" /></div>
          <div className="w-[150px]"><Field id="hp-dept" label="진료과" value={dept} onChange={setDept} options={depts} /></div>
          <div className="w-[130px]"><Field id="hp-partner" label="제휴 여부" value={partner} onChange={setPartner} options={["전체", "제휴", "비제휴"]} /></div>
          <div className="w-[130px]"><Field id="hp-er" label="응급실" value={er} onChange={setEr} options={["전체", ...ER_OPTIONS]} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>곳</div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <Panel>
          <PanelHead title="병원 명부" sub="예약 진행 · 정보 확인 중인 곳 먼저" />
          <div className="mt-3">
            <Table dense rows={rows} selected={cur?.id} onRow={(h) => setSelId(h.id)} cols={[
              { k: "name", label: "병원명", render: (h) => <div className="min-w-[150px]"><div className="flex flex-wrap items-center gap-1.5 font-bold text-navy">{h.name}{h.fast && <Pill tone="gold">빠른 예약</Pill>}</div><div className="text-[11px] text-muted">{h.partner ? "제휴" : "비제휴 · 고객 등록"}</div></div> },
              { k: "dept", label: "진료과" },
              { k: "mainFor", label: "주 이용 고객", render: (h) => (h.mainFor.length ? h.mainFor.join(" · ") : <span className="text-muted">—</span>) },
              { k: "er", label: "응급실", render: (h) => <Pill tone={h.er === "운영" ? "ok" : h.er === "미운영" ? "muted" : "warn"}>{h.er}</Pill> },
              { k: "booking", label: "예약정보", render: (h) => <div className="min-w-[140px] text-[12px]"><Pill tone={h.booking?.status === "예약 확정" ? "ok" : h.booking?.status === "예약 진행 중" ? "gold" : h.booking?.status === "대기" ? "warn" : "muted"}>{h.booking?.status || "—"}</Pill>{h.booking?.next && <div className="mt-0.5 text-muted">{h.booking.next}</div>}</div> },
              { k: "pending", label: "확인 중", render: (h) => (pendingCount(h) ? <Pill tone="warn">{pendingCount(h)}항목</Pill> : <Pill tone="ok">완료</Pill>) },
            ]} empty="조건에 맞는 병원이 없습니다." />
          </div>
          {removed.length > 0 && (
            <div className="mt-3 text-[11px] text-muted">삭제 이력 · {removed.map((r, i) => <span key={i} className="font-num">{i > 0 && " / "}{fmtDT(r.at)} {r.name}({r.dept}) — {r.by}</span>)}</div>
          )}
        </Panel>

        {cur ? (
          <Panel className="self-start">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-navy">{cur.name}<Pill tone={cur.partner ? "gold" : "muted"}>{cur.partner ? "제휴" : "비제휴"}</Pill></div>
                <div className="text-[12px] text-muted">{cur.dept} · {cur.verified}</div>
              </div>
              <div className="flex gap-1.5">
                <Btn small ghost onClick={() => setForm({ mode: "edit", id: cur.id, values: toForm(cur) })}><Icon name="pencil" size={13} /> 수정</Btn>
                <Btn small ghost tone="muted" onClick={() => setDel(cur.id)}>삭제</Btn>
              </div>
            </div>
            <Tabs className="mt-3" value={tab} onChange={setTab} tabs={[["basic", "기본정보"], ["access", "접근 · 이동"], ["booking", "예약 · 동행", cur.escorts.length], ["note", "유의사항 · 이력", cur.changes?.length || 0]]} />
            {tab === "basic" && (
              <div className="mt-2">
                <KV k="주소" v={cur.address} tone={cur.address.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="대표번호" v={cur.phone} mono tone={cur.phone.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="진료과" v={cur.dept} />
                <KV k="진료시간" v={cur.hours} />
                <KV k="응급실 운영" v={<Pill tone={cur.er === "운영" ? "ok" : cur.er === "미운영" ? "muted" : "warn"}>{cur.er}</Pill>} />
                <KV k="제휴 여부" v={cur.partner ? `제휴${cur.fast ? " · 빠른 예약 가능" : ""}` : "비제휴 — 고객이 다니는 병원으로 등록"} />
                <KV k="주 이용 고객" v={cur.mainFor.length ? cur.mainFor.map((n) => `${n}${elderOf(n) ? ` (${elderOf(n).district})` : ""}`).join(" · ") : "—"} />
              </div>
            )}
            {tab === "access" && (
              <div className="mt-2">
                <KV k="예상 이동시간" v={cur.travel} tone={cur.travel.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="주차정보" v={cur.parking} tone={cur.parking.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="휠체어 접근성" v={cur.wheelchair} tone={cur.wheelchair.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="접수 위치" v={cur.reception} tone={cur.reception.startsWith("확인 중") ? "warn" : undefined} />
                <KV k="보호자 필요 여부" v={cur.guardianNeeded} tone={cur.guardianNeeded.startsWith("확인 중") ? "warn" : undefined} />
              </div>
            )}
            {tab === "booking" && (
              <div className="mt-2 space-y-3">
                <div>
                  <KV k="예약 상태" v={cur.booking?.status || "—"} />
                  <KV k="다음 예약" v={cur.booking?.next || "—"} />
                </div>
                <div>
                  <div className="mb-1 text-[12px] font-bold text-muted">동행이력</div>
                  {cur.escorts.length === 0 ? <Empty>동행 이력이 없습니다.</Empty> : (
                    <ul className="space-y-1">{cur.escorts.map((s, i) => <li key={i} className="flex gap-3 text-[12px]"><span className="w-[80px] shrink-0 font-num text-muted">{s.at}</span><span className="text-ink"><b>{s.elder}</b> · {s.concierge} · {s.note}</span></li>)}</ul>
                  )}
                </div>
              </div>
            )}
            {tab === "note" && (
              <div className="mt-2 space-y-3">
                <div>
                  <div className="mb-1 text-[12px] font-bold text-muted">병원별 유의사항</div>
                  <p className="rounded-xl bg-navy/[.04] px-3 py-2 text-[13px] leading-[1.6] text-ink">{cur.caution || "등록된 유의사항이 없습니다."}</p>
                </div>
                <div>
                  <div className="mb-1 text-[12px] font-bold text-muted">변경 이력 (덮어쓰지 않음)</div>
                  {(cur.changes || []).length === 0 ? <Empty>변경 이력이 없습니다 — 기본 명부 그대로입니다.</Empty> : (
                    <ul className="space-y-1">{cur.changes.map((c, i) => <li key={i} className="text-[12px]"><span className="font-num text-muted">{fmtDT(c.at)}</span> · {c.by} · <b className="text-ink">{c.field}</b> <span className="text-muted line-through">{String(c.before)}</span> → <span className="text-green">{String(c.after)}</span></li>)}</ul>
                  )}
                </div>
              </div>
            )}
          </Panel>
        ) : <Panel className="self-start"><Empty>명부에서 병원을 선택하세요.</Empty></Panel>}
      </div>

      <Panel>
        <PanelHead title="SOS 상황 병원 표시" sub="고객의 주 이용 병원과 가장 가까운 응급실을 구분해 보여줍니다" right={<div className="w-[150px]"><Field id="hp-sos-elder" label="고객" value={sosElder} onChange={setSosElder} options={ELDER_NAMES} /></div>} />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl p-3" style={{ background: "rgba(59,92,138,.08)" }}>
            <div className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "#3B5C8A" }}><Icon name="hospital" size={14} /> 주 이용 병원 · {sosElder}</div>
            {mainHospitals.length === 0 ? <div className="mt-1 text-[13px] text-muted">등록된 주 이용 병원이 없습니다 — 명부에서 지정하세요.</div> : mainHospitals.map((h) => (
              <div key={h.id} className="mt-1.5 text-[13px] text-ink"><b className="text-navy">{h.name}</b> · {h.dept} · 응급실 {h.er} · {h.travel}</div>
            ))}
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(192,57,43,.08)" }}>
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-danger"><Icon name="alert" size={14} /> 가장 가까운 응급실 · {sosE?.district || "—"}</div>
            <div className="mt-1.5 text-[13px] font-bold text-navy">{nearestEr}</div>
            <div className="mt-0.5 text-[11px] text-muted"><Stamp at={TODAY} prefix="자치구 매핑 기준" /> · 실시간 거리 계산은 지도 연동 후</div>
          </div>
        </div>
        <p className="mt-3 rounded-xl px-3.5 py-2.5 text-[12px] font-bold leading-[1.7]" style={{ background: "rgba(10,31,60,.06)", color: "#0A1F3C" }}>실제 이송병원은 119와 의료진의 판단에 따라 변경될 수 있습니다.</p>
      </Panel>

      <Note>건강 · 센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 병원 정보 중 "확인 중"은 실무진 명부 수령 후 반영합니다.</Note>

      {form && (
        <Drawer open onClose={() => setForm(null)} title={form.mode === "add" ? "병원 등록" : `${form.values.name} 수정`} sub="확인되지 않은 값은 '확인 중'으로 두세요 — 지어 넣지 않습니다" width={560}
          footer={<div className="flex justify-end gap-2"><Btn ghost tone="muted" onClick={() => setForm(null)}>취소</Btn><Btn onClick={save} disabled={!form.values.name.trim() || !form.values.dept.trim()}>{form.mode === "add" ? "등록" : "변경 저장"}</Btn></div>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {HOSPITAL_FIELDS.map(([k, label, req]) => (
              <div key={k} className={k === "caution" || k === "address" ? "sm:col-span-2" : ""}>
                <Field id={`hp-f-${k}`} label={label} required={!!req} value={form.values[k] || ""} onChange={(v) => setForm((f) => ({ ...f, values: { ...f.values, [k]: v } }))} type={k === "caution" ? "textarea" : "text"} />
              </div>
            ))}
            <Field id="hp-f-partner" label="제휴 여부" value={form.values.partner} options={["제휴", "비제휴"]} onChange={(v) => setForm((f) => ({ ...f, values: { ...f.values, partner: v } }))} />
            <Field id="hp-f-er" label="응급실 운영 여부" value={form.values.er} options={ER_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, values: { ...f.values, er: v } }))} />
            <Field id="hp-f-bstatus" label="예약 상태" value={form.values.bookingStatus} options={BOOKING_OPTIONS} onChange={(v) => setForm((f) => ({ ...f, values: { ...f.values, bookingStatus: v } }))} />
            <Field id="hp-f-bnext" label="다음 예약" value={form.values.bookingNext} onChange={(v) => setForm((f) => ({ ...f, values: { ...f.values, bookingNext: v } }))} placeholder="예: 2026-10-02 10:30 내과" />
            <div className="sm:col-span-2">
              <div className="text-[11px] font-bold text-muted">고객별 주 이용 병원으로 지정</div>
              <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label="주 이용 고객">
                {ELDERS.map((e) => {
                  const on = form.values.mainFor.includes(e.name);
                  return <button key={e.name} type="button" aria-pressed={on} onClick={() => setForm((f) => ({ ...f, values: { ...f.values, mainFor: on ? f.values.mainFor.filter((n) => n !== e.name) : [...f.values.mainFor, e.name] } }))} className="btn-press btn-inline rounded-full px-2.5 py-1 text-[11px] font-bold" style={on ? { background: "#0A1F3C", color: "#fff" } : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }}>{e.name}</button>;
                })}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      <Confirm open={!!del} title="병원을 명부에서 삭제합니다" body={`${list.find((h) => h.id === del)?.name || ""} — 삭제 이력은 남지만 명부에서는 사라집니다. 고객 주 이용 병원 지정도 함께 해제됩니다.`} confirmLabel="삭제" tone="navy" onCancel={() => setDel(null)} onConfirm={remove} />
    </div>
  );
}
