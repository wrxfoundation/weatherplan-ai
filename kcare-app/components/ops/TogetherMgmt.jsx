// 함께해요 관리 — 요청서 §13. 관계형 서비스(생활 대행 = '함께 해요' · 새 서비스 '함께가요')를 고객별로 본다.
// 정서상태는 진단하지 않는다 — "관찰 내용 · 변화 징후 · 추가 확인 필요" 세 칸만 쓴다 (§13 마지막 줄).
// 비공개 메모·약속은 덮어쓰지 않고 항목을 쌓는다 (감사로그 원칙).
import { useMemo, useState } from "react";
import Icon from "../icons";
import { SERVICE_MENU } from "../../lib/requests";
import { Panel, PanelHead, Stat, Pill, Btn, Tabs, Table, KV, Field, Avatar, Note, Empty, Stamp } from "./ui";
import { CONCIERGES, NOW, OUTING_REQUESTS, TODAY, TOGETHER_CLIENTS, TOGETHER_GO, daysBetween, elderOf, fmtDT, fmtRel } from "../../lib/ops-admin";

const TOGETHER_BASE = SERVICE_MENU.find((s) => s.no === 6);
const OPERATOR = "김태영 (관제사)";
const dayDiff = (dateStr) => daysBetween(NOW, Date.parse(`${dateStr}T09:00:00+09:00`));

export default function TogetherMgmt() {
  const [clients, setClients] = useState(TOGETHER_CLIENTS);
  const [sel, setSel] = useState(TOGETHER_CLIENTS[0].elder);
  const [tab, setTab] = useState("rel");
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [manager, setManager] = useState("전체");

  const stats = useMemo(() => {
    const promises = clients.flatMap((c) => c.promises);
    return {
      active: clients.filter((c) => c.active).length,
      talked: clients.filter((c) => daysBetween(c.lastTalk.at, NOW) <= 7).length,
      promise: `${promises.filter((p) => p.done).length}/${promises.length}`,
      soon: clients.filter((c) => dayDiff(c.nextCheck) <= 1).length,
      check: clients.filter((c) => c.mood.needsCheck).length,
    };
  }, [clients]);

  const rows = useMemo(() => {
    const kw = q.trim();
    return clients
      .filter((c) => manager === "전체" || c.manager === manager)
      .filter((c) => !kw || [c.elder, c.manager, ...c.interests, c.lastTalk.summary].join(" ").includes(kw))
      .filter((c) => {
        if (filter === "check") return !!c.mood.needsCheck;
        if (filter === "soon") return dayDiff(c.nextCheck) <= 1;
        if (filter === "talked") return daysBetween(c.lastTalk.at, NOW) <= 7;
        return true;
      })
      // 예외 먼저 — 추가 확인 필요 → 다음 확인 임박 → 최근 대화 오래된 순
      .sort((a, b) => (b.mood.needsCheck ? 1 : 0) - (a.mood.needsCheck ? 1 : 0) || dayDiff(a.nextCheck) - dayDiff(b.nextCheck) || a.lastTalk.at - b.lastTalk.at);
  }, [clients, q, manager, filter]);

  const cur = clients.find((c) => c.elder === sel) || clients[0];
  const patch = (elder, fn) => setClients((prev) => prev.map((c) => (c.elder === elder ? fn(c) : c)));

  const cols = [
    { k: "elder", label: "고객", render: (c) => { const e = elderOf(c.elder); return (
      <div className="flex items-center gap-2"><Avatar name={c.elder} size={32} /><div><div className="font-bold text-navy">{c.elder} <span className="font-num text-[11px] text-muted">{e?.age}</span></div><div className="text-[11px] text-muted">{e?.district}</div></div></div>
    ); } },
    { k: "manager", label: "전담 케어매니저", render: (c) => <span className="font-medium text-ink">{c.manager}</span> },
    { k: "talk", label: "최근 대화", render: (c) => <div className="min-w-[160px]"><div className="font-num text-[12px] text-ink">{fmtRel(c.lastTalk.at)}</div><div className="truncate text-[11px] text-muted" style={{ maxWidth: 220 }}>{c.lastTalk.summary}</div></div> },
    { k: "next", label: "다음 확인일", render: (c) => { const d = dayDiff(c.nextCheck); return <span className="flex items-center gap-1.5 font-num text-[12px]">{c.nextCheck.slice(5)}{d <= 1 && <Pill tone="warn">{d < 0 ? "지남" : d === 0 ? "오늘" : "내일"}</Pill>}</span>; } },
    { k: "check", label: "추가 확인", render: (c) => (c.mood.needsCheck ? <Pill tone="warn" dot>확인 필요</Pill> : <Pill tone="ok">—</Pill>) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">함께해요 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">말벗 · 산책 · 장보기 · 나들이 같은 관계형 서비스의 대화 · 정서 관찰 · 약속을 고객별로 이어서 봅니다</p>
        </div>
        <div className="text-[12px] text-muted">기준 {TODAY}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="활성 고객" value={stats.active} unit="명" active={filter === ""} onClick={() => setFilter("")} />
        <Stat label="이번 주 대화" value={stats.talked} unit="명" tone="info" active={filter === "talked"} onClick={() => setFilter(filter === "talked" ? "" : "talked")} />
        <Stat label="약속 이행" value={stats.promise} tone="ok" sub="이행 / 전체 약속" />
        <Stat label="다음 확인 임박" value={stats.soon} unit="명" tone="warn" active={filter === "soon"} onClick={() => setFilter(filter === "soon" ? "" : "soon")} />
        <Stat label="추가 확인 필요" value={stats.check} unit="명" tone="warn" active={filter === "check"} onClick={() => setFilter(filter === "check" ? "" : "check")} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ServiceCard title={`${TOGETHER_BASE?.name || "생활 대행"} → 함께 해요`} price={TOGETHER_BASE?.priceLabel} scope={TOGETHER_BASE?.scope} note="서비스 메뉴 no6 — 이름이 '함께 해요'로 바뀝니다 · 가격은 메뉴 값 그대로" icon="heart" />
        <ServiceCard title={TOGETHER_GO.name} price={TOGETHER_GO.priceLabel} scope={TOGETHER_GO.scope} note={TOGETHER_GO.note} icon="sun" badge="신규" />
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1"><Field id="tg-q" label="검색" value={q} onChange={setQ} placeholder="고객 · 케어매니저 · 관심사 · 대화 내용" /></div>
          <div className="w-[180px]"><Field id="tg-manager" label="전담 케어매니저" value={manager} onChange={setManager} options={["전체", ...CONCIERGES]} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>명</div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel>
          <PanelHead title="함께 해요 고객 명부" sub="추가 확인 필요 · 다음 확인 임박 순" />
          <div className="mt-3"><Table cols={cols} rows={rows} rowKey={(c) => c.elder} selected={cur?.elder} onRow={(c) => setSel(c.elder)} dense /></div>
        </Panel>
        {/* key 로 고객이 바뀔 때 입력 상태를 새로 시작한다 */}
        {cur && <ClientDetail key={cur.elder} c={cur} tab={tab} setTab={setTab} patch={patch} />}
      </div>

      <Panel>
        <PanelHead title="함께가요 나들이 요청" sub="컨시어지 2명 동행 · 차량 제공 · 자택에서 편도 1시간 이내" right={<Pill tone="gold">{OUTING_REQUESTS.length}건</Pill>} />
        <div className="mt-3">
          <Table dense rows={OUTING_REQUESTS} cols={[
            { k: "elder", label: "고객", render: (o) => <b className="text-navy">{o.elder}</b> },
            { k: "date", label: "예정일", render: (o) => <span className="font-num text-[12px]">{o.date}</span> },
            { k: "concierges", label: "동행 컨시어지 (2명)", render: (o) => o.concierges.join(" · ") },
            { k: "vehicle", label: "차량" },
            { k: "destination", label: "목적지 · 편도", render: (o) => <span className="flex flex-wrap items-center gap-1.5">{o.destination}<span className="font-num text-[11px] text-muted">편도 {o.oneWayMin}분</span>{o.oneWayMin <= 60 ? <Pill tone="ok">1시간 내</Pill> : <Pill tone="warn">1시간 초과</Pill>}</span> },
            { k: "est", label: "예상 시간", render: (o) => <span className="font-num">{o.estHours}시간</span> },
            { k: "expenses", label: "실비 항목", render: (o) => <span className="text-[12px] text-muted">{o.expenses.join(" · ")} · 현장 결제 후 정산</span> },
            { k: "status", label: "상태", render: (o) => <Pill tone={o.status === "예정" ? "ok" : "info"}>{o.status}</Pill> },
          ]} />
        </div>
      </Panel>

      <Note>건강 · 센서 데이터와 정서 관찰은 참고자료이며 의료진의 진단을 대신하지 않습니다. 정서상태는 관찰 내용 · 변화 징후 · 추가 확인 필요로만 기록합니다.</Note>
    </div>
  );
}

function ServiceCard({ title, price, scope, note, icon, badge }) {
  return (
    <Panel className="!p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gold" style={{ background: "rgba(176,141,87,.14)" }}><Icon name={icon} size={20} /></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[14px] font-bold text-navy">{title}{badge && <Pill tone="gold">{badge}</Pill>}</div>
          <div className="mt-0.5 font-num text-[12px] font-bold text-gold">{price || "요금 확정 전"}</div>
          <div className="mt-1 text-[12px] text-ink">{scope}</div>
          <div className="mt-1 text-[11px] text-muted">{note}</div>
        </div>
      </div>
    </Panel>
  );
}

function ClientDetail({ c, tab, setTab, patch }) {
  const e = elderOf(c.elder);
  const [memo, setMemo] = useState("");
  const [promise, setPromise] = useState("");
  const [promiseDue, setPromiseDue] = useState(TODAY);
  const [nextCheck, setNextCheck] = useState(c.nextCheck);
  const memos = Array.isArray(c.privateMemos) ? c.privateMemos : c.privateMemo ? [{ at: c.lastTalk.at, by: c.manager, text: c.privateMemo }] : [];
  const nextLog = c.nextCheckLog || [];

  const addMemo = () => {
    if (!memo.trim()) return;
    patch(c.elder, (x) => ({ ...x, privateMemos: [...memos, { at: Date.now(), by: OPERATOR, text: memo.trim() }] }));
    setMemo("");
  };
  const addPromise = () => {
    if (!promise.trim()) return;
    patch(c.elder, (x) => ({ ...x, promises: [...x.promises, { text: promise.trim(), due: promiseDue, done: false, by: OPERATOR }] }));
    setPromise("");
  };
  const togglePromise = (i) => patch(c.elder, (x) => ({ ...x, promises: x.promises.map((p, j) => (j === i ? { ...p, done: !p.done, doneAt: !p.done ? Date.now() : null } : p)) }));
  const saveNext = () => {
    if (!nextCheck || nextCheck === c.nextCheck) return;
    patch(c.elder, (x) => ({ ...x, nextCheck, nextCheckLog: [...nextLog, { at: Date.now(), by: OPERATOR, before: x.nextCheck, after: nextCheck }] }));
  };

  return (
    <Panel className="self-start">
      <div className="flex items-start gap-3">
        <Avatar name={c.elder} size={44} tone="gold" />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold text-navy">{c.elder} <span className="font-num text-[12px] text-muted">{e?.age} · {e?.district}</span></div>
          <div className="text-[12px] text-muted">전담 케어매니저 <b className="text-ink">{c.manager}</b> · 보호자 {e?.guardian}{e?.guardianRel ? `(${e.guardianRel})` : ""}</div>
          <div className="mt-1 flex flex-wrap gap-1">{c.interests.map((i) => <Pill key={i} tone="gold">{i}</Pill>)}</div>
        </div>
      </div>
      <Tabs className="mt-3" value={tab} onChange={setTab} tabs={[["rel", "관계 현황"], ["promise", "약속 · 다음 확인", c.promises.filter((p) => !p.done).length], ["share", "공유 · 비공개"], ["hist", "누적 이력", c.history.length]]} />

      {tab === "rel" && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[12px] font-bold text-muted"><span>최근 대화내용</span><Stamp at={fmtRel(c.lastTalk.at)} prefix="대화" /></div>
            <p className="rounded-xl bg-navy/[.04] px-3 py-2 text-[13px] leading-[1.6] text-ink">{c.lastTalk.summary} <span className="text-[11px] text-muted">— {c.lastTalk.by}</span></p>
          </div>
          <div>
            <div className="mb-1 text-[12px] font-bold text-muted">관찰된 정서상태 <span className="font-normal">(진단 아님)</span></div>
            <KV k="관찰 내용" v={c.mood.observed} />
            <KV k="변화 징후" v={c.mood.changes} tone={c.mood.changes.includes("없음") ? undefined : "warn"} />
            <KV k="추가 확인 필요" v={c.mood.needsCheck || "없음"} tone={c.mood.needsCheck ? "warn" : "ok"} />
          </div>
          <KV k="이전 방문 대비" v={c.vsPrev} />
          <KV k="고객 관심사" v={c.interests.join(" · ")} />
        </div>
      )}

      {tab === "promise" && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 text-[12px] font-bold text-muted">고객과의 약속사항</div>
            <ul className="space-y-1.5">
              {c.promises.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  <button type="button" role="checkbox" aria-checked={p.done} aria-label={`${p.text} ${p.done ? "이행 취소" : "이행 완료"}`} onClick={() => togglePromise(i)}
                    className="btn-press btn-inline mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border" style={{ borderColor: p.done ? "#1E7A5A" : "rgba(10,31,60,.3)", background: p.done ? "#1E7A5A" : "transparent", color: "#fff" }}>
                    {p.done && <Icon name="check" size={12} strokeWidth={2.5} />}
                  </button>
                  <span className={`min-w-0 flex-1 ${p.done ? "text-muted line-through" : "text-ink"}`}>{p.text} <span className="font-num text-[11px] text-muted">기한 {p.due.slice(5)}{p.by ? ` · ${p.by}` : ""}</span></span>
                  {!p.done && dayDiff(p.due) < 0 && <Pill tone="warn">기한 지남</Pill>}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <div className="min-w-[160px] flex-1"><Field id={`tg-promise-${c.elder}`} label="약속 추가" value={promise} onChange={setPromise} placeholder="고객과 한 약속" /></div>
              <div className="w-[150px]"><Field id={`tg-promise-due-${c.elder}`} label="기한" type="date" value={promiseDue} onChange={setPromiseDue} /></div>
              <Btn small onClick={addPromise}>추가</Btn>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[12px] font-bold text-muted">다음 확인일</div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-[170px]"><Field id={`tg-next-${c.elder}`} label="다음 확인일" type="date" value={nextCheck} onChange={setNextCheck} /></div>
              <Btn small ghost onClick={saveNext} disabled={nextCheck === c.nextCheck}>변경 저장</Btn>
              {dayDiff(c.nextCheck) <= 1 && <Pill tone="warn">{dayDiff(c.nextCheck) < 0 ? "확인일 지남" : "임박"}</Pill>}
            </div>
            {nextLog.length > 0 && <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted">{nextLog.map((l, i) => <li key={i} className="font-num">{fmtDT(l.at)} · {l.by} · {l.before} → {l.after}</li>)}</ul>}
          </div>
        </div>
      )}

      {tab === "share" && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-muted"><Icon name="users" size={14} /> 보호자 공유내용</div>
            <p className="rounded-xl px-3 py-2 text-[13px] leading-[1.6] text-ink" style={{ background: "rgba(30,122,90,.08)" }}>{c.shared}</p>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-muted"><Icon name="shield" size={14} /> 내부 비공개 메모 <Pill tone="muted">보호자 미공유</Pill></div>
            {memos.length === 0 ? <Empty>비공개 메모가 없습니다.</Empty> : (
              <ul className="space-y-1.5">{memos.map((m, i) => <li key={i} className="rounded-xl bg-navy/[.05] px-3 py-2 text-[13px] leading-[1.6] text-ink">{m.text}<div className="mt-0.5 font-num text-[11px] text-muted">{fmtDT(m.at)} · {m.by}</div></li>)}</ul>
            )}
            <div className="mt-2 flex items-end gap-2">
              <div className="flex-1"><Field id={`tg-memo-${c.elder}`} label="메모 추가 (덮어쓰지 않고 쌓입니다)" value={memo} onChange={setMemo} placeholder="관제 · 컨시어지만 봅니다" /></div>
              <Btn small onClick={addMemo}>추가</Btn>
            </div>
          </div>
        </div>
      )}

      {tab === "hist" && (
        <ol className="mt-3 space-y-2">
          {c.history.map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-[12px]">
              <span className="w-[84px] shrink-0 font-num text-muted">{fmtDT(h.at)}</span>
              <Pill tone={h.kind === "함께가요" ? "gold" : "navy"}>{h.kind}</Pill>
              <span className="min-w-0 flex-1 text-ink">{h.text} <span className="text-muted">· {h.by}</span></span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
