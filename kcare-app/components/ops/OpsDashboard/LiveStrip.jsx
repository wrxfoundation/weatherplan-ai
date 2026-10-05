// 통합 알림센터 맨 위 '테스트 가구 1 — 지금' (2026-10-02 "남은 것도 다" — 대시보드 숫자).
// 아래 12타일 · 우선 확인 대상은 전체 서비스 대상자 시안(예시)이다. 테스트 가구에서 실제로 일어난 것만
// 여기 따로 세고, 누르면 그 일을 처리하는 메뉴로 간다.
import { useAppState } from "../../../lib/state";
import { LIVE_TAG, liveVisit } from "../../../lib/live-household";
import { LIVE_ELDER } from "../../../lib/ops-health";
import { VISITS } from "../../../lib/ops-mgmt";
import { Panel, PanelHead, Pill, TONE } from "../ui";
import { useIncidents } from "../../../lib/ops-sos";

const OPEN = (r) => !["done", "cancelled", "rejected"].includes(r.status);

export default function LiveStrip({ onMenu }) {
  const { state } = useAppState();
  // 알림을 해제해도 SOS 센터 사건은 종료 절차(결과 · 사유)를 거쳐야 닫힌다 — 그 사이를 '없음'으로 보이지 않게
  const openIncident = useIncidents().open.some((i) => i.customer === LIVE_ELDER);
  const v = liveVisit(VISITS.find((x) => x.name === LIVE_ELDER) || VISITS[0], state);
  const ops = state.visit?.ops || {};
  const reqs = state.requests || [];
  const unacked = (state.opsMessages || []).filter((m) => !m.ackAt).length;
  const pendingEvents = (state.events || []).filter((e) => e.approval === "pending").length;
  const reportText = ops.viewed === "열람 완료" ? "보호자 열람 완료" : ops.sentAt ? "발송 · 열람 전" : v.status === "done" ? (ops.review === "검수 완료" ? "검수 완료 · 발송 전" : "검수 대기") : "방문 전 · 중";
  const tiles = [
    { k: "sos", label: "SOS", value: state.demo?.sos ? (state.ops?.sosAcceptedAt ? "출동 중" : state.ops?.sosDispatched ? "급파 · 수락 대기" : "확인 필요") : openIncident ? "알림 해제 · 사건 종료 전" : "없음", tone: state.demo?.sos ? "danger" : openIncident ? "warn" : "ok", menu: "sos" },
    { k: "comms", label: "관제 연락 확인 전", value: `${unacked}건`, tone: unacked ? "warn" : "ok", menu: "comms" },
    // 승인 대기 — 담당 컨시어지(제안은 보호자 · 어르신)가 승인할 것. 관제는 지켜본다 (2026-10-05)
    { k: "asks", label: "해주세요 승인 대기", value: `${reqs.filter((r) => r.status === "requested").length}건`, tone: reqs.some((r) => r.status === "requested") ? "warn" : "ok", menu: "requests" },
    { k: "open", label: "해주세요 진행 중", value: `${reqs.filter((r) => OPEN(r) && r.status !== "requested").length}건`, tone: "info", menu: "requests" },
    { k: "events", label: "일정 승인 대기", value: `${pendingEvents}건`, tone: pendingEvents ? "warn" : "ok", menu: null },
    { k: "visit", label: "오늘 방문", value: v.memoLine, tone: v.status === "active" ? "info" : "navy", menu: "visits" },
    { k: "report", label: "보호자 리포트", value: reportText, tone: ops.sentAt ? "ok" : "navy", menu: "visits" },
  ];
  return (
    <Panel>
      <PanelHead
        title={<span className="flex flex-wrap items-center gap-2">{LIVE_TAG} — 지금 <Pill tone="gold">실제</Pill></span>}
        sub={`${LIVE_ELDER} 님 가구에서 테스트 계정들이 실제로 한 일 · 누르면 처리하는 메뉴로 갑니다. 아래 통합현황 · 우선 확인 대상은 전체 대상자 예시입니다`}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {tiles.map((t) => {
          const body = (
            <>
              <span className="block text-[11px] font-bold text-muted">{t.label}</span>
              <span className="mt-0.5 block text-[14px] font-bold" style={{ color: TONE[t.tone].fg }}>{t.value}</span>
            </>
          );
          return t.menu ? (
            <button key={t.k} type="button" onClick={() => onMenu?.(t.menu)} className="btn-press rounded-xl bg-navy/[.04] px-3 py-2.5 text-left">
              {body}
            </button>
          ) : (
            <div key={t.k} className="rounded-xl bg-navy/[.04] px-3 py-2.5">{body}</div>
          );
        })}
      </div>
    </Panel>
  );
}
