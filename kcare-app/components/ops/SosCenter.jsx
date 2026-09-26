// SOS 긴급대응 센터 — 요청서 6절 전체 · 시안 "SOS 긴급대응 센터".
// 설명형 프로토콜을 실행형 콘솔로: 왼쪽 사건 목록 / 가운데 사건 상세·단계 기록 / 오른쪽 고객·보호자·출동·119.
// 사건 상태는 lib/ops-sos 의 공유 저장소에 있어 새로고침·메뉴 이동 뒤에도 남는다.
import { useEffect, useRef, useState } from "react";
import { Avatar, Btn, Drawer, Empty, Field, Note, Panel, PanelHead, Pill, SevBar, SevPill, StatePill, TONE } from "./ui";
import { useIncidents } from "../../lib/ops-sos";
import { CUSTOMERS } from "../../lib/ops-health";
import { fmtClock, fmtElapsed, fmtTime, useNow } from "../../lib/ops-time";
import IncidentDetail from "./SosCenter/IncidentDetail";
import SidePanels from "./SosCenter/SidePanels";
import { stepTitle } from "./SosCenter/helpers";

const ROLE = { controller: "관제사 김태영", viewer: "조회 전용" };
const RE_ALERT = ["30초", "1분", "3분", "끄기"];

function IncidentCard({ inc, now, selected, flash, onSelect }) {
  const unread = inc.state === "new";
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(inc.id)}
        aria-pressed={selected}
        className={`btn-press flex w-full gap-2.5 rounded-xl px-3 py-2.5 text-left ${flash ? "animate-escalateGlow" : ""}`}
        style={{ background: selected ? "rgba(176,141,87,.14)" : unread ? TONE.danger.bg : "rgba(10,31,60,.03)", boxShadow: unread ? "inset 0 0 0 1.5px rgba(192,57,43,.55)" : undefined }}
      >
        <SevBar sev={inc.sev} />
        <Avatar name={inc.customer} size={36} tone={inc.sev === "sev1" || inc.sev === "danger" ? "danger" : "warn"} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[14px] font-bold text-navy">{inc.customer}</span>
            <SevPill sev={inc.sev} />
            {unread && <Pill tone="danger" dot>미확인</Pill>}
            {!inc.controller && <Pill tone="warn">담당자 없음</Pill>}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink">{inc.cause} · {inc.value}</span>
          <span className="mt-0.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted">
            <span className="font-num">{inc.id} · 발생 {fmtClock(inc.startedAt)}{(inc.alerts || 0) > 1 ? ` · 알림 ${inc.alerts}건 병합` : ""}</span>
            <StatePill state={inc.state} />
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">{stepTitle(inc.step)} · {inc.controller || "미배정"}</span>
        </span>
        <span className="font-num shrink-0 self-start rounded-lg px-1.5 py-0.5 text-[13px] font-bold" style={{ background: TONE.danger.bg, color: TONE.danger.fg }}>
          {now ? fmtElapsed(now - inc.startedAt) : "--:--"}
        </span>
      </button>
    </li>
  );
}

export default function SosCenter({ focusId }) {
  const store = useIncidents();
  const { incidents, open, closed } = store;
  const now = useNow(1000);
  const [selected, setSelected] = useState(focusId || null);
  const [role, setRole] = useState("controller");
  const [sound, setSound] = useState(true);
  const [reAlert, setReAlert] = useState("30초");
  const [flash, setFlash] = useState(null);
  const [manual, setManual] = useState(false);
  const [mName, setMName] = useState("최정자");
  const [mCause, setMCause] = useState("보호자 요청 확인 (전화 불통)");
  const knownIds = useRef(null);

  useEffect(() => {
    if (focusId) setSelected(focusId);
  }, [focusId]);

  // 신규 사건이 들어오면 카드를 강조한다 (6-6 화면 알림). 소리는 설정 칩으로 표시만 한다.
  useEffect(() => {
    const ids = new Set(open.map((i) => i.id));
    if (knownIds.current) {
      const fresh = open.find((i) => !knownIds.current.has(i.id));
      if (fresh) setFlash(fresh.id);
    }
    knownIds.current = ids;
  }, [open]);
  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 8000);
    return () => clearTimeout(t);
  }, [flash]);

  const current = incidents.find((i) => i.id === selected) || (selected === "__none__" ? null : open[0] || null);
  const avgFirst = "31초";

  return (
    <div className="space-y-4">
      <PanelHead
        title="SOS 긴급대응 센터"
        sub="진행 중 사건을 고객별로 분리하여 대응·기록합니다 · 팝업을 닫아도 사건은 종료되지 않습니다"
        right={
          <>
            <span className="card-glass rounded-xl px-3 py-1.5" style={open.length ? { boxShadow: "inset 0 0 0 1.5px rgba(192,57,43,.55)" } : undefined}>
              진행 중 SOS <span className="font-num text-[16px] font-bold" style={{ color: open.length ? TONE.danger.fg : TONE.navy.fg }}>{open.length}</span>
            </span>
            <span className="card-glass rounded-xl px-3 py-1.5">평균 1차 응답 <span className="font-num text-[16px] font-bold text-navy">{avgFirst}</span></span>
            <label htmlFor="sos-role" className="flex items-center gap-1.5">
              권한
              <select id="sos-role" value={role} onChange={(e) => setRole(e.target.value)} className="card-glass rounded-lg px-2 py-1 text-[12px] font-bold text-navy">
                {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <button type="button" aria-pressed={sound} onClick={() => setSound(!sound)} className="btn-press btn-inline rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: sound ? TONE.ok.bg : TONE.muted.bg, color: sound ? TONE.ok.fg : TONE.muted.fg }}>
              {sound ? "소리 알림 켜짐" : "음소거"}
            </button>
            <label htmlFor="sos-realert" className="flex items-center gap-1.5">
              재알림
              <select id="sos-realert" value={reAlert} onChange={(e) => setReAlert(e.target.value)} className="card-glass rounded-lg px-2 py-1 text-[12px] font-bold text-navy">
                {RE_ALERT.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <Btn ghost small tone="danger" onClick={() => setManual(true)} disabled={role !== "controller"}>+ 수동 사건 등록</Btn>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* 왼쪽 — 긴급사건 목록 */}
        <div className="space-y-4 lg:col-span-3">
          <Panel>
            <PanelHead title="긴급사건 목록" sub="위험도·발생시각 순" right={open.some((i) => i.state === "new") && <Pill tone="danger">미확인 {open.filter((i) => i.state === "new").length}</Pill>} />
            {open.length === 0 ? (
              <div className="mt-3"><Empty>진행 중인 사건이 없습니다.</Empty></div>
            ) : (
              <ul className="mt-3 space-y-2">
                {open.map((inc) => <IncidentCard key={inc.id} inc={inc} now={now} selected={current?.id === inc.id} flash={flash === inc.id} onSelect={setSelected} />)}
              </ul>
            )}
            <div className="mt-4 border-t border-navy/[.08] pt-3">
              <h4 className="text-[13px] font-bold text-navy">최근 종료 사건</h4>
              {closed.length === 0 ? (
                <div className="mt-1 text-[12px] text-muted">오늘 종료된 사건이 없습니다.</div>
              ) : (
                <ul className="mt-1 divide-y divide-navy/[.06]">
                  {closed.slice(0, 5).map((inc) => (
                    <li key={inc.id}>
                      <button type="button" onClick={() => setSelected(inc.id)} className="btn-press flex w-full items-center gap-2 py-2 text-left" style={current?.id === inc.id ? { background: "rgba(176,141,87,.12)", borderRadius: 10 } : undefined}>
                        <Avatar name={inc.customer} size={28} tone="muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-navy">{inc.customer} <span className="font-num text-[11px] font-normal text-muted">{inc.id}</span></span>
                          <span className="block truncate text-[11px] text-muted">{inc.closed?.result} · {inc.closed?.reason}</span>
                        </span>
                        <span className="font-num text-[11px] text-muted">{fmtClock(inc.closed?.at)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          {/* 기존 프로토콜 설명은 접이식 한 칸으로만 */}
          <details className="card-glass rounded-[14px] px-4 py-3">
            <summary className="cursor-pointer text-[13px] font-bold text-navy">대응 원칙 (3콜 · 보호자 · 119 · 현장 합류)</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12px] leading-[1.7] text-ink">
              <li>이상징후 확인 후 어르신께 1·2·3차 전화 — 2차 미연결 시 3차가 자동으로 열립니다.</li>
              <li>본인 미연결 시 주 보호자 → 부 보호자 순으로 연락하고, 조치 예정을 통보합니다.</li>
              <li>의식·통화 불가가 의심되면 119 전달용 요약을 읽고 신고하며 접수번호를 기록합니다.</li>
              <li>가장 가까운 출동 가능 컨시어지를 추천하되 파견은 관제사가 승인합니다. 현장 도착·조치·병원 동행을 기록합니다.</li>
              <li>종료는 결과·사유·조치결과를 필수로 남기고, 권한 있는 관제사만 실행합니다. 종료 후 상황보고서가 자동 정리됩니다.</li>
            </ol>
          </details>
        </div>

        {/* 가운데 — 사건 상세 */}
        <div className="lg:col-span-6">
          {current ? (
            <IncidentDetail key={current.id} inc={current} now={now} api={store} role={role} onClosePopup={() => setSelected("__none__")} />
          ) : (
            <Panel>
              <PanelHead title="사건을 선택하세요" sub="왼쪽 목록의 사건을 누르면 상세와 단계별 대응 기록이 열립니다." />
              <div className="mt-3"><Empty>진행 중 사건 {open.length}건 · 종료 사건 {closed.length}건. 닫은 팝업의 사건도 목록에서 다시 열 수 있습니다.</Empty></div>
            </Panel>
          )}
        </div>

        {/* 오른쪽 — 고객·보호자·출동·119 */}
        <div className="lg:col-span-3">
          {current ? <SidePanels key={current.id} inc={current} now={now} api={store} role={role} /> : <Panel><Empty>사건을 선택하면 고객 핵심정보·보호자 연락·출동 추천·119 요약이 여기에 열립니다.</Empty></Panel>}
        </div>
      </div>

      <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다. 사건 기록은 감사로그로 남으며 삭제되지 않습니다.</Note>

      {/* 수동 사건 등록 — 보호자 요청·전화 불통처럼 기기 경보가 아닌 사건도 같은 번호 체계로 만든다 (6-1) */}
      <Drawer open={manual} onClose={() => setManual(false)} title="수동 사건 등록" sub="사건번호 SOS-날짜8자리-일련번호가 자동 부여됩니다" width={440}
        footer={
          <div className="flex justify-end gap-2">
            <Btn ghost tone="muted" onClick={() => setManual(false)}>취소</Btn>
            <Btn tone="danger" onClick={() => {
              const c = CUSTOMERS[mName];
              const id = store.start({ name: mName, age: c?.age ?? null, sev: "danger", value: "수동 등록", threshold: "—", controller: "김태영" }, mCause);
              setSelected(id);
              setManual(false);
            }}>사건 생성</Btn>
          </div>
        }
      >
        <div className="space-y-3">
          <Field id="sos-manual-name" label="고객" value={mName} onChange={setMName} options={Object.keys(CUSTOMERS)} required />
          <Field id="sos-manual-cause" label="발생 원인" value={mCause} onChange={setMCause} placeholder="예: 보호자 요청 확인 · 전화 불통" required />
          <Note>같은 고객의 진행 중 사건이 이미 있으면 새 사건을 만들지 않고 그 사건에 추가 이상징후로 붙습니다. 현재 시각 {now ? fmtTime(now) : "—"}.</Note>
        </div>
      </Drawer>
    </div>
  );
}
