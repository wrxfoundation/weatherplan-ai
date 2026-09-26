// 커뮤니케이션 관리 — 요청서 §14. 채널 8종의 이력을 고객별 시간순으로 한 줄에 놓는다.
// SOS 관련 연락은 일반 상담과 탭으로 분리하고, 미열람 보고서 · 반복 미응답 보호자 · 장기 무응답 고객은
// 데이터에서 자동으로 후속조치 목록으로 뽑는다 (사람이 옮기지 않는다).
import { useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Tabs, Table, Avatar, Note, Empty, SevBar, Field } from "./ui";
import { COMMS, COMM_CHANNELS, COMM_STATUS, ELDERS, NOW, TODAY, daysBetween, elderOf, fmtDT, fmtRel } from "../../lib/ops-admin";

const HOUR = 3600000;
const isToday = (ts) => fmtRel(ts).startsWith("오늘");

// 후속조치 자동 전환 규칙 — §14 마지막 줄
function buildFollowups(items) {
  const out = [];
  items.filter((m) => m.channel === "report" && m.status === "unread" && NOW - m.at >= 24 * HOUR)
    .forEach((m) => out.push({ key: `rep-${m.id}`, kind: "미열람 보고서", elder: m.elder, target: m.to, text: m.text, since: `${daysBetween(m.at, NOW)}일 미열람`, tone: "warn" }));
  const noAns = {};
  items.filter((m) => m.channel === "guardianCall" && m.status === "noAnswer" && NOW - m.at <= 7 * 86400000)
    .forEach((m) => { noAns[m.to] = noAns[m.to] || { elder: m.elder, n: 0, last: 0 }; noAns[m.to].n += 1; noAns[m.to].last = Math.max(noAns[m.to].last, m.at); });
  Object.entries(noAns).filter(([, v]) => v.n >= 2)
    .forEach(([to, v]) => out.push({ key: `g-${to}`, kind: "반복 미응답 보호자", elder: v.elder, target: to, text: `최근 7일 통화 ${v.n}회 미응답`, since: `마지막 시도 ${fmtRel(v.last)}`, tone: "warn" }));
  ELDERS.forEach((e) => {
    const calls = items.filter((m) => m.elder === e.name && m.channel === "elderCall" && !m.sos);
    const lastOk = Math.max(0, ...calls.filter((m) => m.status === "answered").map((m) => m.at));
    const misses = calls.filter((m) => m.status === "noAnswer" && m.at > lastOk).length;
    if (misses >= 2 && NOW - lastOk > 7 * 86400000) out.push({ key: `e-${e.name}`, kind: "장기 무응답 고객", elder: e.name, target: e.name, text: `어르신 통화 ${misses}회 연속 미응답`, since: lastOk ? `마지막 통화 ${daysBetween(lastOk, NOW)}일 전` : "통화 이력 없음", tone: "warn" });
  });
  return out;
}

export default function CommsMgmt() {
  const [tab, setTab] = useState("general");
  const [elder, setElder] = useState("전체");
  const [status, setStatus] = useState("전체");
  const [q, setQ] = useState("");
  const [channels, setChannels] = useState([]);
  const [acted, setActed] = useState({});
  const [resent, setResent] = useState({});

  const followups = useMemo(() => buildFollowups(COMMS), []);
  const stats = useMemo(() => ({
    today: COMMS.filter((m) => isToday(m.at)).length,
    unread: COMMS.filter((m) => m.status === "unread").length,
    failed: COMMS.filter((m) => m.status === "failed" && !resent[m.id]).length,
    follow: followups.filter((f) => !acted[f.key]).length,
    sos: COMMS.filter((m) => m.sos).length,
  }), [followups, acted, resent]);

  const timeline = useMemo(() => {
    const kw = q.trim();
    return COMMS
      .filter((m) => (tab === "sos" ? m.sos : !m.sos))
      .filter((m) => elder === "전체" || m.elder === elder)
      .filter((m) => status === "전체" || COMM_STATUS[m.status].label === status)
      .filter((m) => channels.length === 0 || channels.includes(m.channel))
      .filter((m) => !kw || [m.elder, m.to, m.text].join(" ").includes(kw))
      .sort((a, b) => b.at - a.at);
  }, [tab, elder, status, channels, q]);

  // 고객 명부 — 예외(미열람 · 실패 · 미응답) 많은 고객 먼저
  const roster = useMemo(() => ELDERS.map((e) => {
    const mine = COMMS.filter((m) => m.elder === e.name && !m.sos);
    const last = mine.reduce((a, m) => Math.max(a, m.at), 0);
    return { ...e, n: mine.length, last, unread: mine.filter((m) => m.status === "unread").length, failed: mine.filter((m) => m.status === "failed" && !resent[m.id]).length, noAnswer: mine.filter((m) => m.status === "noAnswer").length, follow: followups.filter((f) => f.elder === e.name && !acted[f.key]).length };
  }).sort((a, b) => b.follow - a.follow || (b.unread + b.failed + b.noAnswer) - (a.unread + a.failed + a.noAnswer) || b.last - a.last), [followups, acted, resent]);

  const act = (key, action, target) => setActed((p) => ({ ...p, [key]: { action, target, at: Date.now() } }));
  const toggleChannel = (k) => setChannels((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">커뮤니케이션 관리</h2>
          <p className="mt-0.5 text-[13px] text-muted">어르신 · 보호자 · 컨시어지와 주고받은 통화 · 푸시 · 문자 · 음성 · 업무지시 · 보고서 · 자동알림을 고객별 시간순으로 봅니다</p>
        </div>
        <div className="text-[12px] text-muted">기준 {TODAY}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="오늘 발송 · 연락" value={stats.today} unit="건" />
        <Stat label="미열람" value={stats.unread} unit="건" tone="warn" active={status === "미열람"} onClick={() => setStatus(status === "미열람" ? "전체" : "미열람")} />
        <Stat label="발송 실패" value={stats.failed} unit="건" tone="warn" active={status === "발송 실패"} onClick={() => setStatus(status === "발송 실패" ? "전체" : "발송 실패")} />
        <Stat label="후속조치" value={stats.follow} unit="건" tone="info" sub="자동 전환 · 미처리" />
        <Stat label="SOS 연락" value={stats.sos} unit="건" tone="danger" active={tab === "sos"} onClick={() => setTab(tab === "sos" ? "general" : "sos")} />
      </div>

      <Panel className="!py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1"><Field id="cm-q" label="검색" value={q} onChange={setQ} placeholder="고객 · 수신자 · 내용" /></div>
          <div className="w-[160px]"><Field id="cm-elder" label="고객" value={elder} onChange={setElder} options={["전체", ...ELDERS.map((e) => e.name)]} /></div>
          <div className="w-[150px]"><Field id="cm-status" label="상태" value={status} onChange={setStatus} options={["전체", ...Array.from(new Set(Object.values(COMM_STATUS).map((s) => s.label)))]} /></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="채널 필터">
          {Object.entries(COMM_CHANNELS).map(([k, ch]) => {
            const on = channels.includes(k);
            return (
              <button key={k} type="button" aria-pressed={on} onClick={() => toggleChannel(k)} className="btn-press btn-inline flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={on ? { background: "#0A1F3C", color: "#fff" } : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }}>
                <Icon name={ch.icon} size={12} /> {ch.label}
              </button>
            );
          })}
          {channels.length > 0 && <button type="button" onClick={() => setChannels([])} className="btn-press btn-inline px-2 text-[11px] font-bold text-gold">채널 필터 해제</button>}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel className="self-start">
          <PanelHead title="고객별 현황" sub="후속조치 · 미열람 · 실패 · 미응답 많은 순" />
          <div className="mt-3">
            <Table dense rows={roster} rowKey={(r) => r.name} selected={elder === "전체" ? null : elder} onRow={(r) => setElder(elder === r.name ? "전체" : r.name)} cols={[
              { k: "name", label: "고객", render: (r) => <div className="flex items-center gap-2"><Avatar name={r.name} size={28} /><div><div className="font-bold text-navy">{r.name}</div><div className="text-[11px] text-muted">보호자 {r.guardian}</div></div></div> },
              { k: "last", label: "최근 연락", render: (r) => <span className="font-num text-[12px]">{r.last ? fmtRel(r.last) : "—"}</span> },
              { k: "ex", label: "예외", render: (r) => <span className="flex flex-wrap gap-1">{r.follow > 0 && <Pill tone="info">후속 {r.follow}</Pill>}{r.unread > 0 && <Pill tone="warn">미열람 {r.unread}</Pill>}{r.failed > 0 && <Pill tone="warn">실패 {r.failed}</Pill>}{r.noAnswer > 0 && <Pill tone="muted">미응답 {r.noAnswer}</Pill>}{r.follow + r.unread + r.failed + r.noAnswer === 0 && <Pill tone="ok">정상</Pill>}</span> },
            ]} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={elder === "전체" ? "통합 이력 (전체 고객)" : `${elder} 통합 이력`} sub={tab === "sos" ? "SOS 관련 연락 — 일반 상담과 분리해 표시합니다" : "채널 8종 · 시간순"} right={<span className="font-num">{timeline.length}건</span>} />
          <Tabs className="mt-2" value={tab} onChange={setTab} tabs={[["general", "일반 상담", COMMS.filter((m) => !m.sos).length], ["sos", "SOS 관련 연락", COMMS.filter((m) => m.sos).length]]} />
          <ol className="mt-3 space-y-1.5">
            {timeline.length === 0 && <li><Empty>조건에 맞는 이력이 없습니다.</Empty></li>}
            {timeline.map((m) => {
              const ch = COMM_CHANNELS[m.channel];
              const st = COMM_STATUS[m.status];
              const wasResent = resent[m.id];
              return (
                <li key={m.id} className="flex items-stretch gap-3 rounded-xl px-2 py-2 hover:bg-navy/[.03]">
                  {m.sos ? <SevBar sev="sev1" /> : <span className="w-[4px] shrink-0 rounded-full" style={{ background: m.status === "unread" || m.status === "failed" || m.status === "noAnswer" ? "#C9862B" : "rgba(10,31,60,.08)" }} aria-hidden />}
                  <span className="w-[86px] shrink-0 pt-0.5 font-num text-[11px] text-muted">{fmtDT(m.at)}</span>
                  <span className="flex w-[130px] shrink-0 items-center gap-1 self-start rounded-full px-2 py-[2px] text-[11px] font-bold text-navy" style={{ background: "rgba(10,31,60,.06)" }}><Icon name={ch.icon} size={12} /> {ch.label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink"><b className="text-navy">{m.elder}</b>{m.to !== m.elder && <span className="text-muted"> → {m.to}</span>} · {m.text}</div>
                    {m.fail && <div className="text-[11px] text-muted">실패 사유: {m.fail}{wasResent ? ` · 재발송 완료 ${fmtRel(wasResent)}` : ""}</div>}
                  </div>
                  <div className="flex shrink-0 items-start gap-1.5">
                    {wasResent ? <Pill tone="ok">재발송 완료</Pill> : <Pill tone={st.tone}>{st.label}</Pill>}
                    {m.status === "failed" && !wasResent && <Btn small ghost onClick={() => setResent((p) => ({ ...p, [m.id]: Date.now() }))}>재발송</Btn>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="후속조치 목록 (자동 전환)" sub="미열람 보고서 24시간 이상 · 7일 내 보호자 통화 2회 이상 미응답 · 어르신 통화 연속 미응답 7일 이상" right={<Pill tone="info">{stats.follow}건 미처리</Pill>} />
        <div className="mt-3">
          <Table dense rows={followups} rowKey={(f) => f.key} cols={[
            { k: "kind", label: "구분", render: (f) => <Pill tone={f.tone}>{f.kind}</Pill> },
            { k: "elder", label: "고객", render: (f) => <b className="text-navy">{f.elder}</b> },
            { k: "target", label: "대상", render: (f) => (f.target === f.elder ? "어르신 본인" : `${f.target} (보호자)`) },
            { k: "text", label: "내용" },
            { k: "since", label: "경과", render: (f) => <span className="font-num text-[12px] text-muted">{f.since}</span> },
            { k: "act", label: "조치 (1회)", render: (f) => {
              const a = acted[f.key];
              if (a) return <Pill tone="ok">{a.action}{a.target ? ` → ${a.target}` : ""} · {fmtRel(a.at)}</Pill>;
              const mgr = elderOf(f.elder)?.manager || "담당";
              return (
                <span className="flex flex-wrap gap-1">
                  <Btn small onClick={() => act(f.key, "전화 완료")}>전화</Btn>
                  <Btn small ghost onClick={() => act(f.key, "재발송")}>재발송</Btn>
                  <Btn small ghost tone="gold" onClick={() => act(f.key, "담당 배정", mgr)}>담당 배정</Btn>
                </span>
              );
            } },
          ]} empty="후속조치가 필요한 항목이 없습니다." />
        </div>
      </Panel>

      <Note>건강 · 센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 통화 내용은 요약만 기록하고 녹취는 저장하지 않습니다.</Note>
    </div>
  );
}
