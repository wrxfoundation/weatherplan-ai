// 감사로그 — 요청서 §17. 기록 대상 11종을 필터로, 표는 작업일시 · 접속계정 · 작업자 · 권한 · 대상 고객 · 작업내용 · 변경 전 · 변경 후.
// 추가만 가능하다 — 삭제·수정 버튼이 없고, 이 화면의 내보내기도 곧바로 로그에 한 줄 더해진다.
//
// 2026-10-02 — 테스트 계정으로 들어오면 '실제 기록' 보기가 기본이다. Supabase activity 표(모든 테스트 계정이
// 화면에서 한 일)를 /api/activity 로 10초마다 읽는다. '예시 기록'은 요청서 시안용 데모 데이터 그대로.
import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Field, Note, Empty } from "./ui";
import { TODAY, fmtDT, fmtRel } from "../../lib/ops-admin";
import { AUDIT_KINDS, AUDIT_SEED, ROLES } from "../../lib/ops-admin-sys";
import { useAuth } from "../../lib/auth";
import { useAppState } from "../../lib/state";
import { ROLE_LABEL, accountName, householdName } from "../../lib/test-accounts";
import { LIVE_ELDER } from "../../lib/ops-health";
import { downloadCsv } from "../../lib/rosters";

const KIND_TONE = { auth: "muted", viewCustomer: "info", viewHealth: "info", viewLocation: "info", edit: "warn", threshold: "warn", download: "gold", contact: "navy", dispatch: "navy", sos: "danger", report: "ok", request: "navy", schedule: "info", message: "info", signup: "gold", visit: "ok", ticker: "muted", other: "muted" };
const VIEW_KINDS = ["viewCustomer", "viewHealth", "viewLocation"];
const CHANGE_KINDS = ["edit", "threshold"];

// 실제 기록(activity.type) → 기록 대상 분류. 시안의 11종에 앱 동작 분류를 더한다.
const REAL_KINDS = { request: "해주세요 요청·처리", schedule: "일정 등록·승인", message: "음성·메시지", signup: "가입·결제·주문", visit: "방문 업무", ticker: "관제 알림판", other: "기타" };
const KIND_LABEL = { ...AUDIT_KINDS, ...REAL_KINDS };
const KIND_OF_TYPE = {
  login: "auth",
  demo: "sos", ackSos: "sos",
  opsPatch: "dispatch", sosAccept: "dispatch",
  addRequest: "request", transitionRequest: "request", assignRequest: "request",
  // 2026-10-05 해주세요 승인 · 결제 · 취소 · 환불, 도와줘요 처리 단계
  requestPaid: "request", approveRequest: "request", declineRequest: "request", respondProposal: "request",
  cancelRequest: "request", decideCancel: "request", forceCancel: "request", refundDone: "request", noteRequest: "request", helpCall: "request",
  addEvent: "schedule", updateEvent: "schedule", decideEvent: "schedule",
  addVoice: "message", addReview: "message", welfareAnswer: "message", addOpsMessage: "message", ackOpsMessage: "message",
  completeOnboarding: "signup", onboardingPatch: "signup", addPayment: "signup", setBilling: "signup", commitPendingOrder: "signup", addOrder: "signup",
  audit: "visit", advanceVisit: "visit", patchVisit: "visit",
  visitCheck: "visit", visitLoc: "visit", visitNote: "visit", visitGrade: "visit", visitPhoto: "visit", visitOps: "visit", visitViewed: "visit",
  escortSave: "visit", escortSend: "visit", escortViewed: "visit",
  guardianPatch: "edit", setHealth: "edit", welfareStatus: "edit", addMyHospital: "edit", setPriority: "edit", addReport: "edit", reset: "edit",
  pushEvent: "ticker",
};
const kstDate = (t) => new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10);
const toEntry = (household) => (r) => ({
  id: `db-${r.id}`,
  at: Date.parse(r.client_at || r.created_at),
  login: r.account_id || "—",
  name: accountName(r.account_id),
  role: ROLE_LABEL[r.role] || r.role || "—",
  elder: `${LIVE_ELDER} · ${householdName(household)}`,
  kind: KIND_OF_TYPE[r.type] || "other",
  text: r.summary || r.type,
  before: null,
  after: null,
  real: true,
});
const REAL_STATS = [
  ["today", "오늘 기록", "navy", null],
  ["request", "해주세요 요청 · 처리", "info", (e) => e.kind === "request"],
  ["schedule", "일정 등록 · 승인", "warn", (e) => e.kind === "schedule"],
  ["sos", "SOS · 출동", "danger", (e) => e.kind === "sos" || e.kind === "dispatch"],
  ["auth", "로그인", "gold", (e) => e.kind === "auth"],
];

export default function AuditLog() {
  const liveOn = !!useAuth().user?.household;
  const dispatch = useAppState()?.dispatch;
  const [mode, setMode] = useState(null); // null = 테스트 계정이면 실제, 아니면 예시
  const viewMode = mode || (liveOn ? "real" : "demo");
  const [real, setReal] = useState({ status: "idle", rows: [], at: null, error: null });
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/activity?limit=300", { cache: "no-store" });
      if (r.status === 401) return setReal((x) => ({ ...x, status: "login" }));
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return setReal((x) => ({ ...x, status: "error", error: j.error || String(r.status) }));
      setReal({ status: "ok", rows: (j.rows || []).map(toEntry(j.household)), at: Date.now(), error: null });
    } catch (_) {
      setReal((x) => ({ ...x, status: "error", error: "network" }));
    }
  }, []);
  useEffect(() => {
    if (!liveOn || viewMode !== "real") return undefined;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [liveOn, viewMode, load]);

  const [demoLog, setLog] = useState(AUDIT_SEED);
  const log = viewMode === "real" ? real.rows : demoLog;
  const [kinds, setKinds] = useState([]);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("전체");
  const [role, setRole] = useState("전체");
  const [statF, setStatF] = useState("");
  const [selId, setSelId] = useState(AUDIT_SEED.find((e) => e.before != null)?.id || null);

  const accounts = useMemo(() => ["전체", ...Array.from(new Set(log.map((e) => e.login)))], [log]);
  const roleOptions = viewMode === "real" ? ["전체", ...Array.from(new Set(log.map((e) => e.role)))] : ["전체", ...ROLES.map((r) => r.label)];
  const kindOptions = viewMode === "real" ? Object.fromEntries(Array.from(new Set(log.map((e) => e.kind))).map((k) => [k, KIND_LABEL[k] || k])) : AUDIT_KINDS;
  const realToday = kstDate(Date.now());
  const realStat = (k) => (k === "today" ? (e) => kstDate(e.at) === realToday : REAL_STATS.find(([key]) => key === k)?.[3] || (() => true));
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
      .filter((e) => !statF || (viewMode === "real" ? realStat(statF)(e) : statF === "today" ? fmtRel(e.at).startsWith("오늘") : statF === "view" ? VIEW_KINDS.includes(e.kind) : statF === "change" ? CHANGE_KINDS.includes(e.kind) : statF === "download" ? e.kind === "download" : e.kind === "sos"))
      .filter((e) => !kw || [e.login, e.name, e.role, e.elder, e.text, e.before, e.after].join(" ").includes(kw))
      .sort((a, b) => b.at - a.at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, kinds, q, account, role, statF, viewMode, realToday]);

  const cur = log.find((e) => e.id === selId) || null;
  const toggleKind = (k) => setKinds((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  // 내보내기 자체가 '파일 다운로드' 기록이다 — 추가만 된다
  const exportCsv = () => {
    if (viewMode === "real") {
      // 실제 기록은 진짜 CSV 로 내려받고, 내려받았다는 사실도 가구 기록(감사로그)에 한 줄 남긴다
      downloadCsv({ file: "kcare-audit-test-household", cols: ["작업일시", "접속계정", "작업자", "권한", "대상 고객", "분류", "작업내용"], rows: rows.map((e) => [fmtDT(e.at), e.login, e.name, e.role, e.elder, KIND_LABEL[e.kind] || e.kind, e.text]) });
      dispatch?.({ type: "pushEvent", payload: { kind: "감사", text: `감사로그 CSV 내보내기 (${rows.length}건)`, color: "#8FA9CC" } });
      return;
    }
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
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="기록 보기">
        {[["real", "실제 기록 (테스트 가구 1)"], ["demo", "예시 기록"]].map(([k, label]) => {
          const on = viewMode === k;
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => { setMode(k); setStatF(""); setKinds([]); setAccount("전체"); setRole("전체"); setSelId(null); }} className="btn-press rounded-full px-3.5 py-1.5 text-[12px] font-bold" style={on ? { background: "#0A1F3C", color: "#fff" } : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }}>
              {label}
            </button>
          );
        })}
        {viewMode === "real" && (
          <span className="text-[12px] text-muted">
            {!liveOn || real.status === "login"
              ? "테스트 계정으로 로그인하면 테스트 가구의 실제 기록이 여기에 뜹니다."
              : real.status === "error"
                ? `기록을 불러오지 못했습니다 (${real.error}) — 10초 뒤 다시 시도합니다.`
                : real.at
                  ? `Supabase activity 표 · 최근 ${real.rows.length}건 · ${new Date(real.at).toLocaleTimeString("ko-KR", { hour12: false })} 불러옴 · 10초마다 갱신`
                  : "불러오는 중…"}
            {liveOn && <button type="button" onClick={load} className="btn-press btn-inline ml-2 font-bold text-gold underline underline-offset-2">지금 새로고침</button>}
          </span>
        )}
      </div>
      <p className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px] font-bold leading-[1.7]" style={{ background: "rgba(10,31,60,.06)", color: "#0A1F3C" }}><Icon name="shield" size={14} /> 감사기록은 일반 사용자가 삭제 · 수정할 수 없습니다 (추가만 가능). 보존 기간과 열람 권한은 최고관리자가 정합니다.</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {viewMode === "real" ? (
          REAL_STATS.map(([k, label, tone]) => (
            <Stat key={k} label={label} value={log.filter(realStat(k)).length} unit="건" tone={tone} active={statF === k} onClick={() => setStatF(statF === k ? "" : k)} />
          ))
        ) : (
          <>
            <Stat label="오늘 기록" value={stats.today} unit="건" active={statF === "today"} onClick={() => setStatF(statF === "today" ? "" : "today")} />
            <Stat label="조회 (고객 · 건강 · 위치)" value={stats.view} unit="건" tone="info" active={statF === "view"} onClick={() => setStatF(statF === "view" ? "" : "view")} />
            <Stat label="변경 (정보 · 임계값)" value={stats.change} unit="건" tone="warn" active={statF === "change"} onClick={() => setStatF(statF === "change" ? "" : "change")} />
            <Stat label="파일 다운로드" value={stats.download} unit="건" tone="gold" active={statF === "download"} onClick={() => setStatF(statF === "download" ? "" : "download")} />
            <Stat label="SOS 처리 · 종료" value={stats.sos} unit="건" tone="danger" active={statF === "sos"} onClick={() => setStatF(statF === "sos" ? "" : "sos")} />
          </>
        )}
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><Field id="au-q" label="검색" value={q} onChange={setQ} placeholder="계정 · 작업자 · 고객 · 작업내용 · 값" /></div>
          <div className="w-[160px]"><Field id="au-account" label="접속계정" value={account} onChange={setAccount} options={accounts} /></div>
          <div className="w-[170px]"><Field id="au-role" label="권한" value={role} onChange={setRole} options={roleOptions} /></div>
          <div className="pb-2 text-[12px] text-muted">총 <b className="font-num text-navy">{rows.length}</b>건 · {viewMode === "real" ? "실제 기록" : `기준 ${TODAY}`}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="기록 대상 필터">
          {Object.entries(kindOptions).map(([k, label]) => {
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
              { k: "kind", label: "작업내용", render: (e) => <div className="min-w-[220px]"><Pill tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind] || e.kind}</Pill><div className="mt-0.5 text-[12px] text-ink">{e.text}</div></div> },
              { k: "before", label: "변경 전", render: (e) => (e.before != null ? <span className="whitespace-nowrap font-num text-[12px] text-muted line-through">{e.before}</span> : <span className="text-muted">—</span>) },
              { k: "after", label: "변경 후", render: (e) => (e.after != null ? <span className="flex items-center gap-1 whitespace-nowrap font-num text-[12px] font-bold text-green">{e.after}<Icon name="chev" size={12} className="-rotate-90 text-muted" /></span> : <span className="text-muted">—</span>) },
            ]} empty="조건에 맞는 기록이 없습니다." />
          </div>
        </Panel>

        <Panel className="self-start">
          <PanelHead title="기록 상세" sub={cur ? KIND_LABEL[cur.kind] : "행을 선택하세요"} right={cur && <Pill tone={KIND_TONE[cur.kind]}>{KIND_LABEL[cur.kind]}</Pill>} />
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
              <div className="mt-3 text-[11px] text-muted">기록 ID {cur.id} · {cur.real ? "Supabase activity 표의 실제 기록" : "예시 기록"} · 이 기록은 수정 · 삭제할 수 없습니다.</div>
            </div>
          )}
        </Panel>
      </div>

      <Note>감사로그는 규제 대응 · 분쟁 조사 · 품질 관리가 같은 데이터를 봅니다. 상세주소 · 위치 · 건강정보 조회는 열람만 해도 기록됩니다.</Note>
    </div>
  );
}
