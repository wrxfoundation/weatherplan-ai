// 컨시어지 오늘 탭 — 해주세요 데스크 (2026-10-05 운영 결정, lib/requests.js 머리말).
//
//   승인할 것   보호자 · 어르신 해주세요 — 내 일정을 보고 날짜 · 시간을 정해 승인하거나 거절한다.
//               요금 확정 전 항목은 여기서 금액을 정한다 (승인 뒤 보호자 결제).
//   확정된 것   내가 맡은 확정 건 — 진행 시작 · 완료.
//   보낸 제안   내가 제안해 보호자 · 어르신의 수락을 기다리는 것 — 철회할 수 있다.
//
// 도와줘요(즉시 방문 요청)는 여기서 승인하지 않는다 — 관제가 확인 전화 후 출동을 지시한다 (HelpCallCard).
import { useMemo, useState } from "react";
import { Card, Badge } from "./ui";
import { fmtWon } from "../lib/config";
import { CONCIERGE_CAL } from "../lib/console";
import {
  APPROVER_LABEL,
  CLOSED,
  STATUS,
  URGENCY,
  approverOf,
  fmtPreferred,
  fmtScheduled,
  isStoreOrder,
  isVisitCall,
  kstYmd,
  paymentOf,
  preferredYmd,
} from "../lib/requests";

const FROM = { fromGuardian: "보호자", fromElder: "어르신", fromConcierge: "컨시어지 제안", fromOps: "관제" };
const hm = (t) => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
// "오후 1:50" → "13:50" — 데모 달력 시각을 해주세요 시각과 같은 꼴로 맞춰 정렬한다
const to24 = (s) => {
  const m = String(s || "").match(/(오전|오후)?\s*(\d{1,2}):(\d{2})/);
  if (!m) return String(s || "");
  let h = Number(m[2]);
  if (m[1] === "오후" && h < 12) h += 12;
  if (m[1] === "오전" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[3]}`;
};

// 그 날 내 일정 — 컨시어지 달력(CONCIERGE_CAL)에서 내가 나가는 건 + 이미 확정한 해주세요
export function scheduleOn(ymd, me, requests, exceptId) {
  if (!ymd) return [];
  const cal = CONCIERGE_CAL.filter((j) => j.ymd === ymd && String(j.crew || "").includes(me)).map((j) => ({
    id: j.id,
    t: to24(j.time),
    text: `${j.client} · ${j.detail}`,
  }));
  const reqs = (requests || [])
    .filter((r) => r.id !== exceptId && r.scheduledDate === ymd && r.assignee === me && ["confirmed", "inProgress", "cancelRequested", "awaitingPayment"].includes(r.status))
    .map((r) => ({ id: r.id, t: r.scheduledTime || "", text: `해주세요 · ${r.type}${r.status === "awaitingPayment" ? " (결제 대기)" : ""}` }));
  return [...cal, ...reqs].sort((a, b) => String(a.t).localeCompare(String(b.t)));
}

function PayLine({ r, payments }) {
  const pay = paymentOf(payments, r.id);
  const text = pay
    ? `결제 완료 ${fmtWon(pay.amount)}${pay.demo ? " (데모)" : ""}`
    : r.payBy === "elder"
      ? `어르신 직접 ${fmtWon(r.amount)} (하루 한도 안)`
      : r.amount === 0
        ? "무료 (멤버십 포함)"
        : r.amount == null
          ? "요금 확정 전 — 승인하면서 정해 주세요"
          : `${fmtWon(r.amount)} · 결제 전`;
  return <div className={`mt-1 text-[12px] font-bold ${pay ? "text-green" : r.amount == null ? "text-amber" : "text-muted"}`}>{text}</div>;
}

function ApproveRow({ r, me, requests, payments, dispatch, push }) {
  const tomorrow = kstYmd(Date.now() + 86400000);
  const [date, setDate] = useState(preferredYmd(r) || tomorrow);
  const [time, setTime] = useState(r.preferredTime || "10:00");
  const [amount, setAmount] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const day = useMemo(() => scheduleOn(date, me, requests, r.id), [date, me, requests, r.id]);
  const clash = day.some((d) => d.t && time && d.t.slice(0, 2) === time.slice(0, 2));
  const past = date < kstYmd(Date.now());
  // 요금 확정 전 항목은 금액을 정해야 승인된다 (무료면 0) — 비워 두면 아무도 결제하지 않은 채 확정됐다 (2026-10-05 리뷰)
  const needPrice = r.amount == null && !isStoreOrder(r);
  const priceOk = !needPrice || (amount !== "" && Number(amount) >= 0 && Number.isFinite(Number(amount)));
  const who = FROM[r.dir] || "";
  return (
    <div className="rounded-xl border border-navy/[.08] bg-white/70 p-3">
      <div className="flex items-center gap-2">
        <Badge fg={STATUS.requested.fg} bg={STATUS.requested.bg}>승인 대기</Badge>
        {r.urgency === "urgent" && <Badge fg={URGENCY.urgent.fg} bg={URGENCY.urgent.bg}>긴급</Badge>}
        <span className="ml-auto text-[11px] text-muted">
          {who} · {hm(r.history?.[0]?.at || Date.now())}
          {r.assignee && r.assignee !== me ? ` · 담당 ${r.assignee}` : ""}
        </span>
      </div>
      <div className="mt-1.5 text-[14px] font-bold text-navy">{r.type}</div>
      {r.detail && <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{r.detail}</div>}
      <div className="mt-1 text-[12px] text-ink">
        희망 <b>{fmtPreferred(r)}</b>
        {r.hospital ? ` · ${r.hospital}` : ""}
      </div>
      <PayLine r={r} payments={payments} />

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-bold text-muted">
          확정 날짜
          <input
            type="date"
            value={date}
            min={kstYmd(Date.now())}
            onChange={(e) => setDate(e.target.value)}
            aria-label="확정 날짜"
            className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold"
          />
        </label>
        <label className="block text-[11px] font-bold text-muted">
          시간
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold"
          />
        </label>
      </div>
      {needPrice && (
        <label className="mt-2 block text-[11px] font-bold text-muted">
          요금 (원) — 승인 전에 꼭 정해 주세요 (무료면 0). 금액이 있으면 승인 뒤 보호자가 결제합니다
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예: 30000"
            className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 font-num text-[14px] text-ink outline-none focus:border-gold"
          />
        </label>
      )}

      {/* 그 날 내 일정 — 승인 판단의 근거 (2026-10-05 "본인 스케쥴을 보고 판단") */}
      <div className="mt-2.5 rounded-lg bg-navy/[.04] px-3 py-2">
        <div className="text-[11px] font-bold text-navy">{date} 내 일정 {day.length}건</div>
        {day.length === 0 ? (
          <div className="mt-0.5 text-[12px] text-muted">비어 있습니다</div>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {day.map((d) => (
              <li key={d.id} className="text-[12px] leading-[1.5] text-ink">
                <span className="font-num font-bold">{d.t || "시간 미정"}</span> {d.text}
              </li>
            ))}
          </ul>
        )}
        {clash && <div className="mt-1 text-[11.5px] font-bold text-amber">같은 시간대에 일정이 있습니다 — 시간을 확인해 주세요</div>}
      </div>

      {declining ? (
        <div className="mt-2.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="거절 사유 (요청한 분께 보입니다)"
            aria-label="거절 사유"
            className="w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[13px] outline-none focus:border-gold"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={() => setDeclining(false)} className="btn-press flex-1 rounded-xl border border-navy/15 py-2.5 text-[13px] font-bold text-muted">
              돌아가기
            </button>
            <button
              disabled={!reason.trim()}
              onClick={() => {
                dispatch({ type: "declineRequest", id: r.id, by: me, reason: reason.trim() });
                push("해주세요", `${me} 거절 — ${r.type} · ${reason.trim()}`, "#8FA9CC");
              }}
              className="btn-press flex-[2] rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              거절 보내기{paymentOf(payments, r.id) ? " (환불 대기로)" : ""}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex gap-2">
          <button onClick={() => setDeclining(true)} className="btn-press flex-1 rounded-xl border border-navy/15 py-2.5 text-[13px] font-bold text-muted">
            거절
          </button>
          <button
            disabled={!date || past || !priceOk}
            onClick={() => {
              dispatch({ type: "approveRequest", id: r.id, by: me, date, time, amount: needPrice ? amount : undefined });
              push("해주세요", `${me} 승인 — ${r.type} · ${date} ${time}`, "#8FE3C0");
            }}
            className="btn-press flex-[2] rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
          >
            승인 · {date.slice(5).replace("-", "/")} {time}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ConciergeRequests({ requests, payments, me, dispatch, push }) {
  // 베타에서 앱을 쓰는 컨시어지는 한 사람(테스트 컨시어지 계정)이라, 관제가 다른 컨시어지로 바꾼 건도 여기서 받는다
  // (안 그러면 아무 큐에도 없어 승인 대기로 멈춘다 — 2026-10-05 리뷰). 담당이 다르면 카드에 이름을 단다.
  const mine = () => true;
  const asks = (requests || []).filter((r) => !isVisitCall(r) && !CLOSED.includes(r.status));
  const toApprove = asks.filter((r) => r.status === "requested" && approverOf(r) === "concierge" && mine(r));
  const waitingPay = asks.filter((r) => r.status === "awaitingPayment" && mine(r));
  const booked = asks
    .filter((r) => ["confirmed", "inProgress", "cancelRequested"].includes(r.status) && mine(r))
    .sort((a, b) => `${a.scheduledDate || ""}${a.scheduledTime || ""}`.localeCompare(`${b.scheduledDate || ""}${b.scheduledTime || ""}`));
  const sent = asks.filter((r) => r.status === "requested" && approverOf(r) !== "concierge" && r.dir === "fromConcierge" && mine(r));
  const total = toApprove.length + waitingPay.length + booked.length + sent.length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-black text-navy">해주세요</span>
        {toApprove.length > 0 && <span className="rounded-full bg-amber/15 px-2 py-[2px] text-[11px] font-bold text-amber">승인할 것 {toApprove.length}</span>}
        <span className="ml-auto font-num text-[12px] text-muted">{total}건</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
        보호자 · 어르신이 부탁한 것은 내 일정을 보고 승인합니다. 확정 뒤 취소는 서비스일 3일 전까지 요청자가 바로, 그 안은 관제가 승인합니다.
      </p>
      {total === 0 && <p className="mt-2 text-[13px] text-muted">지금 처리할 해주세요가 없습니다.</p>}

      {toApprove.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[12px] font-bold text-navy">승인할 것</div>
          {toApprove.map((r) => (
            <ApproveRow key={r.id} r={r} me={me} requests={requests} payments={payments} dispatch={dispatch} push={push} />
          ))}
        </div>
      )}

      {booked.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[12px] font-bold text-navy">확정된 것</div>
          {booked.map((r) => {
            const st = STATUS[r.status];
            const next = r.status === "confirmed" ? ["진행 시작", "inProgress", `${me} 진행 시작`] : r.status === "inProgress" ? ["완료", "done", `${me} 완료`] : null;
            return (
              <div key={r.id} className="rounded-xl border border-navy/[.08] bg-white/70 p-3">
                <div className="flex items-center gap-2">
                  <Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
                  <span className="font-num text-[12px] font-bold text-navy">{fmtScheduled(r) || "날짜 미정"}</span>
                  <span className="ml-auto text-[11px] text-muted">{FROM[r.dir]}</span>
                </div>
                <div className="mt-1.5 text-[14px] font-bold text-navy">{r.type}</div>
                <PayLine r={r} payments={payments} />
                {r.status === "cancelRequested" ? (
                  <p className="mt-1.5 text-[12px] font-bold text-amber">취소 요청 — 관제 승인 대기 ({r.cancelReq?.by || "요청자"})</p>
                ) : (
                  next && (
                    <button
                      onClick={() => {
                        dispatch({ type: "transitionRequest", id: r.id, to: next[1], note: next[2], by: me });
                        push("해주세요", `${r.type} — ${next[2]}`, "#8FE3C0");
                      }}
                      className={`btn-press mt-2 w-full rounded-xl border py-2.5 text-[13px] font-bold ${next[1] === "done" ? "border-green/40 text-green" : "border-navy/20 text-navy"}`}
                    >
                      {next[0]}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {waitingPay.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">보호자 결제 대기</div>
          {waitingPay.map((r) => (
            <div key={r.id} className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] text-ink">
              <b>{r.type}</b> · {fmtWon(r.amount)}
              {fmtScheduled(r) ? ` · ${fmtScheduled(r)}` : ""} — 결제되면 {r.approvedAt ? "확정" : "승인 대기"}로 넘어옵니다
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">보낸 제안 — 수락 대기</div>
          {sent.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] text-ink">
              <span className="min-w-0 flex-1">
                <b>{r.type}</b> · {APPROVER_LABEL[approverOf(r)]} 수락 대기{fmtScheduled(r) ? ` · ${fmtScheduled(r)}` : ""}
              </span>
              <button
                onClick={() => {
                  dispatch({ type: "cancelRequest", id: r.id, by: me, reason: "제안 철회" });
                  push("해주세요", `${me} 제안 철회 — ${r.type}`, "#8FA9CC");
                }}
                className="btn-press shrink-0 rounded-lg border border-navy/15 px-2.5 py-1.5 text-[12px] font-bold text-muted"
              >
                철회
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
