// 시스템 연동상태 — 외부 연동 7종의 상태 · 마지막 확인 시각 · 최근 24시간 장애 · 담당, 최근 장애 이력.
// 아직 계약·심사 전인 것(결제 PG · 알림톡 · 119)은 "연동 대기"로 정직하게 두고 대체 수동 절차를 적는다.
import { useMemo, useState } from "react";
import Icon from "../icons";
import { Panel, PanelHead, Stat, Pill, Btn, Table, KV, Note, Stamp, Empty } from "./ui";
import { fmtDT, fmtRel } from "../../lib/ops-admin";
import { INTEGRATIONS, INTEG_INCIDENTS, INTEG_STATUS } from "../../lib/ops-admin-sys";

const RANK = { down: 0, delayed: 1, pending: 2, ok: 3 };
const ICON = { shealth: "watch", mmwave: "wave", push: "bell", alimtalk: "chat", pg: "card", map: "pin", e119: "alert" };

export default function Integrations() {
  const [items, setItems] = useState(INTEGRATIONS);
  const [selKey, setSelKey] = useState(INTEGRATIONS.find((i) => i.status === "delayed")?.key || INTEGRATIONS[0].key);
  const [statF, setStatF] = useState("");

  const stats = useMemo(() => ({
    ok: items.filter((i) => i.status === "ok").length,
    delayed: items.filter((i) => i.status === "delayed").length,
    down: items.filter((i) => i.status === "down").length,
    pending: items.filter((i) => i.status === "pending").length,
    incidents: items.reduce((a, i) => a + i.incidents24h, 0),
  }), [items]);

  const rows = useMemo(() => items
    .filter((i) => !statF || i.status === statF)
    // 예외 먼저 — 장애 → 지연 → 연동 대기 → 정상
    .sort((a, b) => RANK[a.status] - RANK[b.status] || b.incidents24h - a.incidents24h), [items, statF]);

  const cur = items.find((i) => i.key === selKey) || null;
  const curIncidents = cur ? INTEG_INCIDENTS.filter((x) => x.system === cur.name) : [];

  // 수동 재확인 — 확인 시각만 갱신한다 (상태 판정은 실제 연동이 붙은 뒤)
  const recheck = (key) => setItems((p) => p.map((i) => (i.key === key && i.status !== "pending" ? { ...i, checkedAt: Date.now(), rechecked: true } : i)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-navy">시스템 연동상태</h2>
          <p className="mt-0.5 text-[13px] text-muted">건강 · 센서 · 발송 · 결제 · 지도 · 119 연계의 수신 상태와 최근 장애를 한 곳에서 봅니다</p>
        </div>
        <div className="text-[12px] text-muted">상태 판정 주기 5분 · 연동 대기 항목은 수동 절차로 운영</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="정상" value={stats.ok} unit="건" tone="ok" active={statF === "ok"} onClick={() => setStatF(statF === "ok" ? "" : "ok")} />
        <Stat label="지연" value={stats.delayed} unit="건" tone="warn" active={statF === "delayed"} onClick={() => setStatF(statF === "delayed" ? "" : "delayed")} />
        <Stat label="장애" value={stats.down} unit="건" tone="device" active={statF === "down"} onClick={() => setStatF(statF === "down" ? "" : "down")} />
        <Stat label="연동 대기" value={stats.pending} unit="건" tone="muted" active={statF === "pending"} onClick={() => setStatF(statF === "pending" ? "" : "pending")} />
        <Stat label="최근 24시간 장애" value={stats.incidents} unit="건" tone="warn" sub="지연 · 장애 합계" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel>
          <PanelHead title="연동 항목" sub="장애 · 지연 · 연동 대기 먼저" right={<span className="font-num">{rows.length}건</span>} />
          <div className="mt-3">
            <Table dense rows={rows} rowKey={(i) => i.key} selected={cur?.key} onRow={(i) => setSelKey(i.key)} cols={[
              { k: "name", label: "항목", render: (i) => <div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy" style={{ background: "rgba(10,31,60,.06)" }}><Icon name={ICON[i.key]} size={16} /></span><div><div className="font-bold text-navy">{i.name}</div><div className="text-[11px] text-muted">{i.desc}</div></div></div> },
              { k: "status", label: "상태", render: (i) => <Pill tone={INTEG_STATUS[i.status].tone} dot>{INTEG_STATUS[i.status].label}</Pill> },
              { k: "checked", label: "마지막 확인", render: (i) => (i.checkedAt ? <Stamp at={fmtRel(i.checkedAt)} prefix="확인" /> : <span className="text-[11px] text-muted">확인 대상 아님</span>) },
              { k: "incidents24h", label: "24시간 장애", align: "right", render: (i) => (i.incidents24h ? <span className="font-bold" style={{ color: "#8A5D12" }}>{i.incidents24h}건</span> : <span className="text-muted">0</span>) },
              { k: "owner", label: "담당", render: (i) => <span className="text-[12px]">{i.owner}</span> },
              { k: "act", label: "", render: (i) => (i.status === "pending" ? <span className="text-[11px] text-muted">—</span> : <Btn small ghost onClick={() => recheck(i.key)}>다시 확인</Btn>) },
            ]} />
          </div>
        </Panel>

        {cur ? (
          <Panel className="self-start">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy" style={{ background: "rgba(10,31,60,.06)" }}><Icon name={ICON[cur.key]} size={22} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold text-navy">{cur.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2"><Pill tone={INTEG_STATUS[cur.status].tone} dot>{INTEG_STATUS[cur.status].label}</Pill>{cur.checkedAt && <Stamp at={fmtDT(cur.checkedAt)} prefix="마지막 확인" />}</div>
              </div>
            </div>
            <div className="mt-3">
              <KV k="역할" v={cur.desc} />
              <KV k="방식 · 비고" v={cur.mode} tone={cur.status === "pending" ? "warn" : undefined} />
              <KV k="담당" v={cur.owner} />
              <KV k="24시간 장애" v={`${cur.incidents24h}건`} tone={cur.incidents24h ? "warn" : undefined} />
              {cur.rechecked && <KV k="재확인" v="이 세션에서 수동 재확인 — 상태 판정은 실제 연동 뒤" tone="info" />}
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[12px] font-bold text-muted">이 항목의 장애 이력</div>
              {curIncidents.length === 0 ? <Empty>{cur.status === "pending" ? "연동 전 — 장애 이력이 없습니다." : "최근 장애 이력이 없습니다."}</Empty> : (
                <ul className="space-y-1">{curIncidents.map((x) => <li key={x.id} className="text-[12px]"><span className="font-num text-muted">{fmtDT(x.at)}</span> · <Pill tone={INTEG_STATUS[x.level].tone}>{INTEG_STATUS[x.level].label}</Pill> <span className="text-ink">{x.text}</span> <span className="text-muted">· {x.duration}</span></li>)}</ul>
              )}
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel>
        <PanelHead title="최근 장애 이력" sub="최근 7일 · 지연 · 장애 모두" right={<Pill tone="warn">{INTEG_INCIDENTS.filter((x) => !x.resolved).length}건 진행 중</Pill>} />
        <div className="mt-3">
          <Table dense rows={[...INTEG_INCIDENTS].sort((a, b) => (a.resolved ? 1 : 0) - (b.resolved ? 1 : 0) || b.at - a.at)} cols={[
            { k: "at", label: "발생", render: (x) => <span className="whitespace-nowrap font-num text-[12px]">{fmtDT(x.at)}</span> },
            { k: "system", label: "시스템", render: (x) => <b className="text-navy">{x.system}</b> },
            { k: "level", label: "수준", render: (x) => <Pill tone={INTEG_STATUS[x.level].tone}>{INTEG_STATUS[x.level].label}</Pill> },
            { k: "text", label: "내용" },
            { k: "duration", label: "지속", render: (x) => <span className="font-num text-[12px]">{x.duration}</span> },
            { k: "resolved", label: "상태", render: (x) => (x.resolved ? <Pill tone="ok">해결</Pill> : <Pill tone="warn" dot>진행 중</Pill>) },
          ]} />
        </div>
      </Panel>

      <Note tone="warn">연동 대기 항목의 현재 절차 — 결제(PG): 보호자 승인만 기록하고 실결제는 계약 후 · 알림톡: 심사 완료까지 문자로 대체 발송 · 119: 관제사가 직접 신고하고 상황을 공유합니다.</Note>
      <Note>센서 · 워치 수신 상태는 기기와 연동의 상태이며 어르신의 건강 상태를 뜻하지 않습니다.</Note>
    </div>
  );
}
