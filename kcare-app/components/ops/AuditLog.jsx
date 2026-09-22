// 감사로그 — 요청서 §17. 기록 대상 11종을 필터로, 표는 작업일시 · 접속계정 · 작업자 · 권한 · 대상 고객 · 작업내용 · 변경 전 · 변경 후.
// 추가만 가능하다 — 삭제·수정 버튼이 없고, 이 화면의 내보내기도 곧바로 로그에 한 줄 더해진다.
import { useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Field, Note, Empty } from "./ui";
import { TODAY, fmtDT, fmtRel } from "../../lib/ops-admin";
import { AUDIT_KINDS, AUDIT_SEED, ROLES } from "../../lib/ops-admin-sys";

const KIND_TONE = { auth: "muted", viewCustomer: "info", viewHealth: "info", viewLocation: "info", edit: "warn", threshold: "warn", download: "gold", contact: "navy", dispatch: "navy", sos: "danger", report: "ok" };
const VIEW_KINDS = ["viewCustomer", "viewHealth", "viewLocation"];
const CHANGE_KINDS = ["edit", "threshold"];

export default function AuditLog() {
  const [log, setLog] = useState(AUDIT_SEED);
  const [kinds, setKinds] = useState([]);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("전체");
  const [role, setRole] = useState("전체");
  const [statF, setStatF] = useState("");
  const [selId, setSelId] = useState(AUDIT_SEED.find((e) => e.before != null)?.id || null);

  const accounts = useMemo(() => ["전체", ...Array.from(new Set(log.map((e) => e.login)))], [log]);
  const stats = useMemo(() => ({
    today: log.filter((e) => fmtRel(e.at).startsWith("오늘")).length,
    view: log.filter((e) => VIEW_KINDS.includes(e.kind)).length,
    change: log.filter((e) => CHANGE_KINDS.includes(e.kind)).length,
    download: log.filter((e) => e.kind === "download").length,
    sos: log.filter((e) => e.kind === "sos").length,
  }), [log]);

  const rows = useMemo(() => {
    const kw = q.trim();
    return log
      .filter((e) => kinds.length === 0 || kinds.includes(e.kind))
      .filter((e) => account === "전체" || e.login === account)
      .filter((e) => role === "전체" || e.role === role)
      .filter((e) => !statF || (statF === "today" ? fmtRel(e.at).startsWith("오늘") : statF === "view" ? VIEW_KINDS.includes(e.kind) : statF === "change" ? CHANGE_KINDS.includes(e.kind) : statF === "download" ? e.kind === "download" : e.kind === "sos"))
      .filter((e) => !kw || [e.login, e.name, e.role, e.elder, e.text, e.before, e.after].join(" ").includes(kw))
      .sort((a, b) => b.at - a.at);
  }, [log, kinds, q, account, role, statF]);

  const cur = log.find((e) => e.id === selId) || null;
  const toggleKind = (k) => setKinds((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  // 내보내기 자체가 '파일 다운로드' 기록이다 — 추가만 된다
  const exportCsv = () => {
    setLog((p) => [{ id: `au${Date.now()}`, at: Date.now(), login: "ops.kim", name: "김태영", role: "관제사", elder: "—", kind: "download", text: `감사로그 CSV 내보내기 (${rows.length}건 · 필터 적용)`, before: null, after: null }, ...p]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">감사로그</h2>
          <p className="mt-0.5 text-[13px] text-muted">누가 · 언제 · 어느 고객의 · 무엇을 · 어떻게 바꿨는지 — 조회부터 SOS 종료까지 모두 남습니다</p>
        </div>
        <Btn ghost onClick={exportCsv}><Icon name="download" size={14} /> CSV 내보내기 (기록됨)</Btn>
      </div>
      <p className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] font-bold leading-[1.7]" style={{ background: "rgba(10,31,60,.06)", color: "#0A1F3C" }}><Icon name="shield" size={14} /> 감사기록은 일반 사용자가 삭제 · 수정할 수 없습니다 (추가만 가능). 보존 기간과 열람 권한은 최고관리자가 정합니다.</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="오늘 기록" value={stats.today} unit="건" active={statF === "today"} onClick={() => setStatF(statF === "today" ? "" : "today")} />
        <Stat label="조회 (고객 · 건강 · 위치)" value={stats.view} unit="건" tone="info" active={statF === "view"} onClick={() => setStatF(statF === "view" ? "" : "view")} />
        <Stat label="변경 (정보 · 임계값)" value={stats.change} unit="건" tone="warn" active={statF === "change"} onClick={() => setStatF(statF === "change" ? "" : "change")} />
        <Stat label="파일 다운로드" value={stats.download} unit="건" tone="gold" active={statF === "download"} onClick={() => setStatF(statF === "download" ? "" : "download")} />
        <Stat label="SOS 처리 · 종료" value={stats.sos} unit="건" tone="danger" active={statF === "sos"} onClick={() => setStatF(statF === "sos" ? "" : "sos")} />
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><Field id="au-q" label="검색" value={q} onChange={setQ} placeholder="계정 · 작업자 · 고객 · 작업내용 · 값" /></div>
          <div className="w-[160px]"><Field id="au-account" label="접속계정" value={account} onChange={setAccount} options={accounts} /></div>
          <div className="w-[170px]"><Field id="au-role" label="권한" value={role} onChange={setRole} options={["전체", ...ROLES.map((r) => r.label)]} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>건 · 기준 {TODAY}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="기록 대상 필터">
          {Object.entries(AUDIT_KINDS).map(([k, label]) => {
            const on = kinds.includes(k);
            return <button key={k} type="button" aria-pressed={on} onClick={() => toggleKind(k)} className="btn-press btn-inline rounded-full px-2.5 py-1 text-[11px] font-bold" style={on ? { background: "#0A1F3C", color: "#fff" } : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }}>{label}</button>;
          })}
          {kinds.length > 0 && <button type="button" onClick={() => setKinds([])} className="btn-press btn-inline px-2 text-[11px] font-bold text-gold">필터 해제</button>}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHead title="기록" sub="최근 순 · 변경 전·후가 있는 행은 누르면 오른쪽에 차이가 펼쳐집니다" />
          <div className="mt-3">
            <Table dense rows={rows} selected={cur?.id} onRow={(e) => setSelId(e.id)} cols={[
              { k: "at", label: "작업일시", render: (e) => <span className="whitespace-nowrap font-num text-[12px]">{fmtDT(e.at)}</span> },
              { k: "login", label: "접속계정", render: (e) => <span className="font-num text-[12px] text-muted">{e.login}</span> },
              { k: "name", label: "작업자", render: (e) => <b className="whitespace-nowrap text-navy">{e.name}</b> },
              { k: "role", label: "권한", render: (e) => <span className="whitespace-nowrap text-[12px]">{e.role}</span> },
              { k: "elder", label: "대상 고객", render: (e) => <span className="whitespace-nowrap">{e.elder}</span> },
              { k: "kind", label: "작업내용", render: (e) => <div className="min-w-[220px]"><Pill tone={KIND_TONE[e.kind]}>{AUDIT_KINDS[e.kind]}</Pill><div className="mt-0.5 text-[12px] text-ink">{e.text}</div></div> },
              { k: "before", label: "변경 전", render: (e) => (e.before != null ? <span className="whitespace-nowrap font-num text-[12px] text-muted line-through">{e.before}</span> : <span className="text-muted">—</span>) },
              { k: "after", label: "변경 후", render: (e) => (e.after != null ? <span className="flex items-center gap-1 whitespace-nowrap font-num text-[12px] font-bold text-green">{e.after}<Icon name="chev" size={12} className="-rotate-90 text-muted" /></span> : <span className="text-muted">—</span>) },
            ]} empty="조건에 맞는 기록이 없습니다." />
          </div>
        </Panel>

        <Panel className="self-start">
          <PanelHead title="기록 상세" sub={cur ? AUDIT_KINDS[cur.kind] : "행을 선택하세요"} right={cur && <Pill tone={KIND_TONE[cur.kind]}>{AUDIT_KINDS[cur.kind]}</Pill>} />
          {!cur ? <div className="mt-3"><Empty>왼쪽 표에서 기록을 선택하면 전·후 값이 여기 펼쳐집니다.</Empty></div> : (
            <div className="mt-2">
              <KV k="작업일시" v={fmtDT(cur.at)} mono />
              <KV k="접속계정" v={cur.login} mono />
              <KV k="작업자" v={cur.name} />
              <KV k="권한" v={cur.role} />
              <KV k="대상 고객" v={cur.elder} />
              <KV k="작업내용" v={cur.text} />
              {cur.before != null || cur.after != null ? (
                <div className="mt-3">
                  <div className="mb-1 text-[12px] font-bold text-muted">변경 전 · 후 (diff)</div>
                  <div className="overflow-hidden rounded-xl border border-navy/[.08] font-num text-[13px]">
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(138,93,18,.1)", color: "#8A5D12" }}><span className="w-3 shrink-0 font-bold">−</span><span className="line-through">{cur.before ?? "—"}</span></div>
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(30,122,90,.12)", color: "#1E7A5A" }}><span className="w-3 shrink-0 font-bold">+</span><span className="font-bold">{cur.after ?? "—"}</span></div>
                  </div>
                </div>
              ) : <div className="mt-3"><Empty>값 변경이 없는 기록입니다 (조회 · 연락 · 발송 등).</Empty></div>}
              <div className="mt-3 text-[11px] text-muted">기록 ID {cur.id} · 이 기록은 수정 · 삭제할 수 없습니다.</div>
            </div>
          )}
        </Panel>
      </div>

      <Note>감사로그는 규제 대응 · 분쟁 조사 · 품질 관리가 같은 데이터를 봅니다. 상세주소 · 위치 · 건강정보 조회는 열람만 해도 기록됩니다.</Note>
    </div>
  );
}
