// 컨시어지 오늘 탭 — 해주세요 데스크 (2026-10-05 운영 결정, lib/requests.js 머리말).
//
//   확인할 것   보호자 · 어르신 해주세요 — 내 일정을 보고 날짜 · 시간(2인이면 짝)을 정해 확인하거나 거절한다.
//               확인하면 관제 승인을 거쳐 확정된다 (2026-10-22 결제 → 컨시어지 확인 → 관제 승인 → 일정 확정).
//               요금 확정 전 항목은 여기서 금액을 정한다 (확인 뒤 가족 결제).
//   관제 승인 대기  내가 확인해 관제 승인을 기다리는 것.
//   확정된 것   내가 맡은 확정 건 — 진행 시작 · 완료. 진행 중인 건이 예약한 시간보다 길어지면 '추가 이용 금액 보내기' (2026-10-22).
//   추가 이용 금액  내가 보낸 청구 — 결제 대기 · 결제 완료 · 등록 카드 결제가 바로 보인다.
//   보낸 제안   내가 제안해 보호자 · 어르신의 수락을 기다리는 것 — 철회할 수 있다.
//
// 도와줘요(즉시 방문 요청)는 여기서 승인하지 않는다 — 관제가 확인 전화 후 출동을 지시한다 (HelpCallCard).
//
// 말로 남기신 부탁 (2026-10-14) — 어르신 목소리를 여기서 듣고, 무엇을 부탁하셨는지 한 줄로 적는다. 그 글이 어르신
// '부탁해 둔 것' · 보호자 · 관제 화면의 요약이 된다 (받아쓰기가 아니라 담당 선생님이 정리한 글).
// 새 해주세요가 오면 어느 탭에 있든 알림 창이 뜬다 (NewRequestAlert — 현장 '기본 로직' 5번 · 연동 확인 3번).
import { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "./ui";
import { EvenGrid } from "./ds";
import Icon from "./icons";
import { clock, playErrorText, usePrefetchClips, useVoicePlayer } from "../lib/voice-client";
import { scopedKey } from "../lib/scope";
import { ringAlarm } from "../lib/alarm";
import { fmtWon } from "../lib/config";
import { CONCIERGE_CAL } from "../lib/console";
import { CONCIERGES } from "../lib/ops-admin";
import { conciergeChoices } from "../lib/people";
import {
  APPROVER_LABEL,
  CLOSED,
  STATUS,
  URGENCY,
  approverOf,
  canEditRequest,
  crewOf,
  fmtPreferred,
  fmtScheduled,
  isStoreOrder,
  isVisitCall,
  kstYmd,
  paymentOf,
  preferredYmd,
} from "../lib/requests";
import { EXTRA_USED_MAX, STEP, addMin, canChargeExtra, clock12, dateLabel, durOf, durText, extraAmountOf, extraDueYmd, extraStateText, extraToText, reqTitle, svcTitle } from "../lib/booking";

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
    .filter((r) => r.id !== exceptId && r.scheduledDate === ymd && r.assignee === me && ["confirmed", "inProgress", "cancelRequested", "awaitingPayment", "opsReview"].includes(r.status))
    .map((r) => ({ id: r.id, t: r.scheduledTime || "", text: `해주세요 · ${reqTitle(r)}${r.status === "awaitingPayment" ? " (결제 대기)" : r.status === "opsReview" ? " (관제 승인 대기)" : ""}` }));
  return [...cal, ...reqs].sort((a, b) => String(a.t).localeCompare(String(b.t)));
}

function PayLine({ r, payments }) {
  const pay = paymentOf(payments, r.id);
  const text = pay
    ? `결제 완료 ${fmtWon(pay.amount)}${pay.demo ? " (데모)" : ""}`
    : r.payBy === "elder"
      ? `어르신 직접 ${fmtWon(r.amount)}`
      : r.amount === 0
        ? "무료 (멤버십 포함)"
        : r.amount == null
          ? "요금 확정 전 — 승인하면서 정해 주세요"
          : `${fmtWon(r.amount)} · 결제 전`;
  return <div className={`mt-1 text-[12px] font-bold ${pay ? "text-green" : r.amount == null ? "text-amber" : "text-muted"}`}>{text}</div>;
}

// 말로 남기신 부탁 — 듣기 + 한 줄 정리
function VoiceAsk({ r, me, dispatch, push }) {
  const player = useVoicePlayer();
  const key = `cr-${r.id}`;
  const saved = r.summary?.text || "";
  const [text, setText] = useState(saved);
  useEffect(() => setText(saved), [saved]);
  const clip = r.voice?.clip || null;
  return (
    <div className="mt-2 rounded-lg border border-gold/30 bg-[#FBF6EC] px-3 py-2.5">
      {clip ? (
        <button
          type="button"
          onClick={() => player.play(key, { clip })}
          aria-pressed={player.playing === key}
          className="btn-press flex w-full items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-left text-[13px] font-bold text-navy"
        >
          <Icon name={player.playing === key ? "stop" : "play"} size={16} strokeWidth={2} />
          {player.playing === key ? "멈추기" : player.busy === key ? "받는 중…" : "어르신 목소리 듣기"}
          <span className="ml-auto font-num text-[12px] text-muted">{clock(clip.secs || 0)}</span>
        </button>
      ) : (
        <p className="text-[12px] text-muted">녹음 기능 전에 남은 요청 — 소리가 없습니다. 어르신께 전화로 여쭤봐 주세요.</p>
      )}
      {player.failed?.key === key && <p role="alert" className="mt-1 text-[11.5px] font-bold text-amber">{playErrorText(player.failed.code)}</p>}
      <label className="mt-2 block text-[11px] font-bold text-muted">
        무엇을 부탁하셨는지 한 줄로 — 어르신 &lsquo;부탁해 둔 것&rsquo;에 이 글이 그대로 보입니다
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="예: 화장실 전등이 나가서 갈아 주세요"
          className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[13px] text-ink outline-none focus:border-gold"
        />
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[11px] text-muted">{saved ? `저장됨 · ${r.summary?.by || ""}` : "아직 정리 전 — 어르신 화면에 '선생님이 듣고 정리해 드립니다'로 보입니다"}</span>
        <button
          type="button"
          disabled={text.trim() === saved}
          onClick={() => {
            dispatch({ type: "requestSummary", id: r.id, text: text.trim(), by: me });
            push?.("해주세요", `${me} 말로 부탁 정리 — ${text.trim() || "(지움)"}`, "#8FA9CC");
          }}
          className="btn-press ml-auto shrink-0 rounded-lg bg-navy px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
        >
          정리 저장
        </button>
      </div>
    </div>
  );
}

function ApproveRow({ r, me, requests, payments, dispatch, push }) {
  const tomorrow = kstYmd(Date.now() + 86400000);
  const [date, setDate] = useState(preferredYmd(r) || tomorrow);
  const [time, setTime] = useState(r.preferredTime || "10:00");
  const [amount, setAmount] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  // 2인 해주세요 — 함께 갈 짝(나 말고 다른 컨시어지)을 골라야 승인된다 (2026-10-19 점검 C-06 · 단독 배차 0)
  const two = crewOf(r) === 2;
  const mates = conciergeChoices(CONCIERGES).filter((n) => n && n !== me);
  const [partner, setPartner] = useState(r.partner && r.partner !== me ? r.partner : "");
  // 요청한 분이 희망 일시를 고치면(승인 전) 승인 칸의 기본값도 새 희망으로 (2026-10-18)
  useEffect(() => {
    if (!r.editedAt) return;
    setDate(preferredYmd(r) || tomorrow);
    setTime(r.preferredTime || "10:00");
  }, [r.editedAt]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <Badge fg={STATUS.requested.fg} bg={STATUS.requested.bg}>확인 대기</Badge>
        {r.urgency === "urgent" && <Badge fg={URGENCY.urgent.fg} bg={URGENCY.urgent.bg}>긴급</Badge>}
        <span className="ml-auto text-[11px] text-muted">
          {who} · {hm(r.history?.[0]?.at || Date.now())}
          {r.assignee && r.assignee !== me ? ` · 담당 ${r.assignee}` : ""}
        </span>
      </div>
      <div className="mt-1.5 text-[14px] font-bold text-navy">{reqTitle(r)}</div>
      {r.detail && <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{r.detail}</div>}
      {/* 이용 시간 · 인원 — 신청한 대로 (금액이 걸려 있어 확인 때 바꾸지 않는다 · 2026-10-22) */}
      {(Number(r.durationMin) > 0 || Number(r.extraPeople) > 0 || r.nextAppt) && (
        <div className="mt-1 text-[12px] text-ink">
          {Number(r.durationMin) > 0 && (
            <>
              이용 <b>{durText(r.durationMin)}</b>
              {time ? ` · ${clock12(time)} → ${clock12(addMin(time, r.durationMin))}` : ""}
            </>
          )}
          {Number(r.extraPeople) > 0 && ` · ${Number(r.extraPeople) + 1}명 (추가 ${r.extraPeople}명)`}
          {r.nextAppt && ` · 다음 외래 동행 (${r.nextAppt.title || "진료"})`}
        </div>
      )}
      {r.opsReturn && (
        <div className="mt-1 rounded-lg bg-amber/10 px-2.5 py-1.5 text-[11.5px] font-bold text-amber">
          관제가 일정을 다시 맞춰 달라고 했습니다 ({r.opsReturn.by} · {hm(r.opsReturn.at)}) — {r.opsReturn.reason}
        </div>
      )}
      {r.editedAt && (
        <div className="mt-1 rounded-lg bg-amber/10 px-2.5 py-1.5 text-[11.5px] font-bold text-amber">
          {r.editedBy || who} {hm(r.editedAt)} 내용 수정 — 지금 보이는 내용이 최신입니다
        </div>
      )}
      {r.voice && <VoiceAsk r={r} me={me} dispatch={dispatch} push={push} />}
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
      {past && <div className="mt-1 text-[11.5px] font-bold text-amber">희망일이 지났어요 — 오늘 이후로 날짜를 정해 주세요</div>}
      {two && (
        <label className="mt-2 block text-[11px] font-bold text-muted">
          함께 갈 짝 — 2인 1조 서비스라 두 사람이 정해져야 확인됩니다
          {mates.length ? (
            <select
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold"
            >
              <option value="">짝을 고르세요</option>
              {mates.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          ) : (
            <span className="mt-1 block rounded-lg bg-amber/10 px-2.5 py-2 text-[12px] font-bold text-amber">
              함께 갈 컨시어지가 없습니다 — 관제에 알려 짝을 정한 뒤 승인해 주세요
            </span>
          )}
        </label>
      )}
      {needPrice && (
        <label className="mt-2 block text-[11px] font-bold text-muted">
          요금 (원) — 확인 전에 꼭 정해 주세요 (무료면 0). 금액이 있으면 확인 뒤 가족이 결제합니다
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

      {/* 그 날 내 일정 — 확인 판단의 근거 (2026-10-05 "본인 스케쥴을 보고 판단") */}
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
                push("해주세요", `${me} 거절 — ${svcTitle(r.type)} · ${reason.trim()}`, "#8FA9CC");
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
            disabled={!date || past || !priceOk || (two && !partner)}
            onClick={() => {
              dispatch({ type: "approveRequest", id: r.id, by: me, date, time, amount: needPrice ? amount : undefined, ...(two ? { partner } : {}) });
              push("해주세요", `${me}${two ? ` · ${partner}` : ""} 확인 — ${reqTitle(r)} · ${date} ${time} · 관제 승인 대기`, "#8FE3C0");
            }}
            className="btn-press flex-[2] rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
          >
            {two && !partner ? "짝을 고르면 확인할 수 있어요" : `확인 · ${date.slice(5).replace("-", "/")} ${time} · 관제 승인 요청`}
          </button>
        </div>
      )}
    </div>
  );
}

// 보낸 제안 — 받는 분이 수락하기 전까지 내용 · 제안 일정을 고치거나 철회한다 (2026-10-18).
// 수락 · 결제 뒤에는 기록이라 고치지 않는다 (lib/requests.js canEditRequest)
function SentRow({ r, me, dispatch, push }) {
  const [mode, setMode] = useState(null); // null | "edit" | "withdraw"
  const [detail, setDetail] = useState(r.detail || "");
  const [date, setDate] = useState(r.scheduledDate || "");
  const [time, setTime] = useState(r.scheduledTime || "14:00");
  const to = APPROVER_LABEL[approverOf(r)];
  const begin = () => {
    setDetail(r.detail || "");
    setDate(r.scheduledDate || "");
    setTime(r.scheduledTime || "14:00");
    setMode("edit");
  };
  const patch = {};
  if (detail.trim() && detail.trim() !== String(r.detail || "").trim()) patch.detail = detail.trim();
  if (date && (date !== r.scheduledDate || time !== (r.scheduledTime || ""))) {
    patch.scheduledDate = date;
    patch.scheduledTime = time;
  }
  const past = !!date && date < kstYmd(Date.now());
  const ok = Object.keys(patch).length > 0 && !past && canEditRequest(r);
  const input = "mt-1 w-full rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[13px] text-ink outline-none focus:border-gold";
  return (
    <div className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] text-ink">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1">
          <b>{svcTitle(r.type)}</b> · {to} 수락 대기{fmtScheduled(r) ? ` · ${fmtScheduled(r)}` : ""}
          {r.editedAt ? <span className="text-muted"> · {hm(r.editedAt)} 고침</span> : null}
        </span>
        {!mode && (
          <>
            <button type="button" onClick={begin} aria-label={`${svcTitle(r.type)} 제안 고치기`} className="btn-press shrink-0 rounded-lg border border-navy/15 px-2.5 py-1.5 text-[12px] font-bold text-navy">
              고치기
            </button>
            <button type="button" onClick={() => setMode("withdraw")} aria-label={`${svcTitle(r.type)} 제안 철회`} className="btn-press shrink-0 rounded-lg border border-navy/15 px-2.5 py-1.5 text-[12px] font-bold text-muted">
              철회
            </button>
          </>
        )}
      </div>
      {mode === "edit" && (
        <div className="mt-2 space-y-2">
          <label className="block text-[11px] font-bold text-muted">
            제안 내용
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} maxLength={400} className={`${input} resize-none leading-[1.5]`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] font-bold text-muted">
              제안 날짜
              <input type="date" value={date} min={kstYmd(Date.now())} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            <label className="block text-[11px] font-bold text-muted">
              시간
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} />
            </label>
          </div>
          <p className="text-[11px] leading-[1.5] text-muted">종류 · 금액은 그대로입니다 — 바꾸려면 철회하고 새로 제안합니다. 고친 내용은 {to} 화면에 바로 보이고 처리 이력에 남습니다.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode(null)} className="btn-press flex-1 rounded-xl border border-navy/15 py-2 text-[12.5px] font-bold text-muted">
              그만두기
            </button>
            <button
              type="button"
              disabled={!ok}
              onClick={() => {
                dispatch({ type: "editRequest", id: r.id, patch, by: me, title: svcTitle(r.type) });
                push("해주세요", `${me} 제안 수정 — ${svcTitle(r.type)}${patch.scheduledDate ? ` · ${patch.scheduledDate} ${patch.scheduledTime}` : ""}`, "#8FA9CC");
                setMode(null);
              }}
              className="btn-press flex-[2] rounded-xl bg-navy py-2 text-[12.5px] font-bold text-white disabled:opacity-40"
            >
              고친 제안 저장
            </button>
          </div>
        </div>
      )}
      {mode === "withdraw" && (
        <div className="mt-2 space-y-2">
          <p className="text-[12px] leading-[1.5]">이 제안을 철회할까요? {to} 화면에서 &lsquo;취소&rsquo;로 바뀝니다.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode(null)} className="btn-press flex-1 rounded-xl border border-navy/15 py-2 text-[12.5px] font-bold text-muted">
              그대로 두기
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "cancelRequest", id: r.id, by: me, reason: "제안 철회" });
                push("해주세요", `${me} 제안 철회 — ${svcTitle(r.type)}`, "#8FA9CC");
                setMode(null);
              }}
              className="btn-press flex-[2] rounded-xl bg-navy py-2 text-[12.5px] font-bold text-white"
            >
              제안 철회
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 추가 이용 금액 보내기 (2026-10-22) — 예약한 시간보다 길어진 해주세요. 실제 이용 시간을 30분씩 맞추면 금액이 정해지고
// (lib/booking.js — 보내는 쪽이 금액을 적지 않는다), 구두로 동의한 받는 분(어르신 · 보호자)을 골라 메모와 함께 보낸다.
// 받는 분 화면에만 '결제 요청'으로 뜨고, 관제 알림 · 할 일 · 해주세요 관리 표에 들어간다
function ExtraChargePanel({ r, me, payees, customer, dispatch, push, onClose }) {
  const d = durOf(r.type);
  const booked = Number(r.durationMin) || d?.min || 0;
  const [used, setUsed] = useState(booked + STEP);
  const [to, setTo] = useState(-1);
  const [memo, setMemo] = useState("");
  const add = used - booked;
  const amount = extraAmountOf({ service: r.type, bookedMin: booked, usedMin: used });
  const start = r.scheduledTime || r.preferredTime || "";
  const due = dateLabel(extraDueYmd(Date.now()));
  const pick = payees[to] || null;
  const roleText = (p) => (p.role === "elder" ? "어르신" : "보호자");
  const row = "flex items-center justify-between gap-2 border-t border-navy/[.08] py-2 text-[12.5px]";
  return (
    <div className="mt-2 rounded-xl border border-gold/40 bg-[#FBF6EC] p-3">
      <div className="text-[11px] font-bold tracking-[.08em] text-[#8A5D12]">추가 이용 금액</div>
      <div className="text-[14px] font-black text-navy">
        {customer} · {svcTitle(r.type)}
      </div>
      <div className="mt-1.5 rounded-lg bg-white/80 px-3">
        <div className={`${row} border-t-0`}>
          <span className="text-muted">예약한 시간</span>
          <b className="font-num text-ink">
            {durText(booked)}
            {start ? ` · ${clock12(start)}~${clock12(addMin(start, booked))}` : ""}
          </b>
        </div>
        <div className={row}>
          <span className="shrink-0 whitespace-nowrap text-muted">실제 이용</span>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="30분 줄이기"
              disabled={used - STEP <= booked}
              onClick={() => setUsed((v) => Math.max(booked + STEP, v - STEP))}
              className="btn-press h-9 w-9 rounded-lg border border-navy/20 bg-white text-[16px] font-black text-navy disabled:opacity-35"
            >
              −
            </button>
            <b className="min-w-[84px] text-center font-num text-[13px] leading-[1.35] text-ink">
              {durText(used)}
              {start && <span className="block text-[11.5px] font-bold text-muted">~{clock12(addMin(start, used))}</span>}
            </b>
            <button
              type="button"
              aria-label="30분 늘리기"
              disabled={used + STEP > EXTRA_USED_MAX}
              onClick={() => setUsed((v) => Math.min(EXTRA_USED_MAX, v + STEP))}
              className="btn-press h-9 w-9 rounded-lg border border-navy/20 bg-white text-[16px] font-black text-navy disabled:opacity-35"
            >
              +
            </button>
          </span>
        </div>
        <div className={row}>
          <span className="text-muted">추가 시간</span>
          <b className="font-num text-ink">
            {durText(add)} · 30분마다 {fmtWon(d?.each || 0)}
          </b>
        </div>
        <div className="flex items-center justify-between gap-2 border-t-[1.5px] border-navy py-2.5">
          <b className="text-[13px] text-navy">추가 금액</b>
          <b className="font-num text-[17px] text-navy">{amount ? fmtWon(amount) : "—"}</b>
        </div>
      </div>
      <div className="mt-2.5 text-[11px] font-bold text-muted">받는 분 — 구두로 동의한 분</div>
      {payees.length ? (
        <EvenGrid cols={2} center={false} gap={6} className="mt-1">
          {payees.map((p, i) => (
            <button
              key={`${p.role}-${p.name}`}
              type="button"
              aria-pressed={to === i}
              onClick={() => setTo(i)}
              className={`btn-press rounded-lg border px-2.5 py-2 text-left text-[12.5px] font-bold ${to === i ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy"}`}
            >
              {roleText(p)} {p.name}
            </button>
          ))}
        </EvenGrid>
      ) : (
        <p className="mt-1 rounded-lg bg-amber/10 px-2.5 py-2 text-[12px] font-bold text-amber">받을 분이 없습니다 — 관제에 알려 주세요</p>
      )}
      <label className="mt-2.5 block text-[11px] font-bold text-muted">
        받는 분께 보일 메모
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder={`예: 진료 대기가 길어져 ${durText(add)} 더 함께했어요`}
          className="mt-1 w-full resize-none rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[13px] leading-[1.5] text-ink outline-none focus:border-gold"
        />
      </label>
      <p className="mt-1.5 text-[11.5px] leading-[1.5] text-muted">결제 기한 {due}까지 · 지나면 받는 분의 등록된 카드로 결제됩니다</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onClose} className="btn-press flex-1 rounded-xl border border-navy/15 py-2.5 text-[13px] font-bold text-muted">
          그만두기
        </button>
        <button
          type="button"
          disabled={!amount || !pick}
          onClick={() => {
            dispatch({ type: "sendExtraCharge", payload: { reqId: r.id, usedMin: used, to: { role: pick.role, name: pick.name }, memo: memo.trim(), customer }, by: me });
            push("추가 이용 금액", `${me} → ${roleText(pick)} ${pick.name} · ${svcTitle(r.type)} 추가 ${durText(add)} · ${fmtWon(amount)} · ${due}까지`, "#E8B04B");
            onClose();
          }}
          className="btn-press flex-[2] rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
        >
          {!pick ? "받는 분을 고르면 보낼 수 있어요" : `${fmtWon(amount)} 청구 보내기`}
        </button>
      </div>
    </div>
  );
}

// 보낸 청구 한 줄 — 결제 대기 · 결제 완료 · 등록 카드 결제 · 취소가 바로 보인다 (받는 분 · 관제와 같은 말)
function ExtraLine({ x }) {
  const tone = x.status === "paid" ? { fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" } : x.status === "cancelled" ? { fg: "#6B7280", bg: "rgba(107,114,128,.12)" } : { fg: "#8A5D12", bg: "rgba(232,176,75,.2)" };
  const sub =
    x.status === "paid"
      ? `${x.auto ? "기한이 지나 등록 카드로" : `${x.payer || extraToText(x)} 결제`} · ${hm(x.paidAt)}${x.method && !x.auto ? ` · ${x.method}` : ""}${x.demo ? " (데모)" : ""}`
      : x.status === "cancelled"
        ? `관제 취소 — ${x.cancel?.reason || ""}`
        : `${extraToText(x)}께 보냄 ${hm(x.sentAt)} · ${dateLabel(extraDueYmd(x.sentAt))}까지`;
  return (
    <div className="mt-2 rounded-lg bg-navy/[.04] px-3 py-2">
      <div className="flex items-center gap-2">
        <Badge fg={tone.fg} bg={tone.bg}>{extraStateText(x)}</Badge>
        <b className="min-w-0 flex-1 truncate text-[12.5px] text-navy">
          추가 이용 {durText(x.usedMin - x.bookedMin)} · {fmtWon(x.amount)}
        </b>
      </div>
      <div className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">{sub}</div>
    </div>
  );
}

// 진행 중 · 끝난 해주세요 카드의 추가 이용 금액 칸 — 보낸 청구가 있으면 그 상태, 없으면 보내기 버튼
function ExtraArea({ r, me, charges, payees, customer, dispatch, push }) {
  const [open, setOpen] = useState(false);
  if (!canChargeExtra(r.type)) return null;
  const mine = charges.filter((x) => x.reqId === r.id);
  const live = mine.find((x) => x.status !== "cancelled");
  return (
    <>
      {mine.map((x) => (
        <ExtraLine key={x.id} x={x} />
      ))}
      {!live &&
        (open ? (
          <ExtraChargePanel r={r} me={me} payees={payees} customer={customer} dispatch={dispatch} push={push} onClose={() => setOpen(false)} />
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="btn-press mt-2 w-full rounded-xl border border-gold/60 bg-[#FBF6EC] py-2.5 text-[13px] font-bold text-[#8A5D12]">
            추가 이용 금액 보내기
          </button>
        ))}
    </>
  );
}

// 진행 시작 · 완료 — 시작은 서비스일부터, 완료는 한 번 더 묻는다 (완료는 되돌릴 수 없는 기록이다).
// 전에는 '진행 시작'을 두 번 누르면 바로 '완료'가 됐고, 며칠 전에도 시작할 수 있었다 (2026-10-19 점검 C-07)
function StepButton({ r, next, me, dispatch, push }) {
  const [asking, setAsking] = useState(false);
  const today = kstYmd(Date.now());
  const early = next[1] === "inProgress" && r.scheduledDate && r.scheduledDate > today;
  const run = () => {
    dispatch({ type: "transitionRequest", id: r.id, to: next[1], note: next[2], by: me });
    push("해주세요", `${svcTitle(r.type)} — ${next[2]}`, "#8FE3C0");
    setAsking(false);
  };
  if (asking)
    return (
      <div className="mt-2 rounded-xl border border-green/30 bg-green/5 p-2.5">
        <p className="text-[12.5px] font-bold text-ink">완료로 남길까요? 완료는 되돌릴 수 없고, 요청한 분 화면에 &lsquo;완료&rsquo;로 보입니다.</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => setAsking(false)} className="btn-press flex-1 rounded-lg border border-navy/15 py-2 text-[13px] font-bold text-muted">
            아직이에요
          </button>
          <button onClick={run} className="btn-press flex-[2] rounded-lg bg-green py-2 text-[13px] font-bold text-white">
            네, 완료했어요
          </button>
        </div>
      </div>
    );
  return (
    <button
      disabled={!!early}
      onClick={() => (next[1] === "done" ? setAsking(true) : run())}
      className={`btn-press mt-2 w-full rounded-xl border py-2.5 text-[13px] font-bold disabled:opacity-50 ${next[1] === "done" ? "border-green/40 text-green" : "border-navy/20 text-navy"}`}
    >
      {early ? `서비스일(${r.scheduledDate.slice(5).replace("-", "/")})에 시작할 수 있어요` : next[0]}
    </button>
  );
}

export default function ConciergeRequests({ requests, payments, extraCharges = [], payees = [], customer = "어르신", me, dispatch, push }) {
  // 베타에서 앱을 쓰는 컨시어지는 한 사람(테스트 컨시어지 계정)이라, 관제가 다른 컨시어지로 바꾼 건도 여기서 받는다
  // (안 그러면 아무 큐에도 없어 승인 대기로 멈춘다 — 2026-10-05 리뷰). 담당이 다르면 카드에 이름을 단다.
  const mine = () => true;
  const asks = (requests || []).filter((r) => !isVisitCall(r) && !CLOSED.includes(r.status));
  const toApprove = asks.filter((r) => r.status === "requested" && approverOf(r) === "concierge" && mine(r));
  // 내가 확인해 관제 승인을 기다리는 것 (2026-10-22)
  const opsWait = asks.filter((r) => r.status === "opsReview" && mine(r));
  const waitingPay = asks.filter((r) => r.status === "awaitingPayment" && mine(r));
  const booked = asks
    .filter((r) => ["confirmed", "inProgress", "cancelRequested"].includes(r.status) && mine(r))
    .sort((a, b) => `${a.scheduledDate || ""}${a.scheduledTime || ""}`.localeCompare(`${b.scheduledDate || ""}${b.scheduledTime || ""}`));
  const sent = asks.filter((r) => r.status === "requested" && approverOf(r) !== "concierge" && r.dir === "fromConcierge" && mine(r));
  // 확정됐다가 취소된 것 — 사흘 동안 알려 둔다. 내 일정에서 말없이 사라지면 그날 찾아가게 된다 (2026-10-19 점검 L-15)
  const lastOf = (r) => (r.history || [])[(r.history || []).length - 1] || null;
  const dropped = (requests || []).filter(
    (r) =>
      r.status === "cancelled" &&
      !isVisitCall(r) &&
      (r.history || []).some((h) => h.status === "confirmed" || h.status === "inProgress") &&
      Date.now() - Number(lastOf(r)?.at || 0) < 3 * 86400000
  );
  // 끝난 해주세요 — 사흘 안이면 여기서도 추가 이용 금액을 보낸다 (완료를 먼저 누른 뒤 길어진 시간을 청구할 수 있게)
  const charges = extraCharges || [];
  const finished = (requests || []).filter(
    (r) => r.status === "done" && !isVisitCall(r) && canChargeExtra(r.type) && Date.now() - Number(lastOf(r)?.at || 0) < 3 * 86400000
  );
  // 내가 보낸 추가 이용 금액 중 아직 결제 전인 것 — 위 카드에 안 보이는 것(오래전 끝난 건)도 놓치지 않게
  const shown = new Set([...booked, ...finished].map((r) => r.id));
  const otherCharges = charges.filter((x) => !shown.has(x.reqId) && x.status === "pending");
  const total = toApprove.length + opsWait.length + waitingPay.length + booked.length + sent.length;
  usePrefetchClips(toApprove.map((r) => r.voice?.clip));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-black text-navy">해주세요</span>
        {toApprove.length > 0 && <span className="rounded-full bg-amber/15 px-2 py-[2px] text-[11px] font-bold text-amber">확인할 것 {toApprove.length}</span>}
        <span className="ml-auto font-num text-[12px] text-muted">{total}건</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-[1.6] text-muted">
        보호자 · 어르신이 부탁한 것은 내 일정을 보고 확인합니다. 확인하면 관제 승인을 거쳐 일정이 확정됩니다. 확정 뒤 취소는 서비스일 3일 전까지
        요청자가 바로, 그 안은 관제가 승인합니다.
      </p>
      {total === 0 && <p className="mt-2 text-[13px] text-muted">지금 처리할 해주세요가 없습니다.</p>}

      {toApprove.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[12px] font-bold text-navy">확인할 것</div>
          {toApprove.map((r) => (
            <ApproveRow key={r.id} r={r} me={me} requests={requests} payments={payments} dispatch={dispatch} push={push} />
          ))}
        </div>
      )}

      {opsWait.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">관제 승인 대기</div>
          {opsWait.map((r) => (
            <div key={r.id} className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] leading-[1.6] text-ink">
              <b>{reqTitle(r)}</b>
              {r.partner ? ` · 2인 1조 ${r.assignee} · ${r.partner}` : ""} — {r.approvedBy || me} 확인 {r.approvedAt ? hm(r.approvedAt) : ""} · 관제가 승인하면 확정됩니다
            </div>
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
                <div className="mt-1.5 text-[14px] font-bold text-navy">{reqTitle(r)}</div>
                {r.summary?.text && <div className="mt-0.5 text-[12px] leading-[1.6] text-ink">&ldquo;{r.summary.text}&rdquo;</div>}
                <PayLine r={r} payments={payments} />
                {r.partner && <div className="mt-0.5 text-[11.5px] text-muted">2인 1조 · {r.assignee} · {r.partner}</div>}
                {r.status === "inProgress" && <ExtraArea r={r} me={me} charges={charges} payees={payees} customer={customer} dispatch={dispatch} push={push} />}
                {r.status === "cancelRequested" ? (
                  <p className="mt-1.5 text-[12px] font-bold text-amber">취소 요청 — 관제 승인 대기 ({r.cancelReq?.by || "요청자"})</p>
                ) : (
                  next && <StepButton r={r} next={next} me={me} dispatch={dispatch} push={push} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {waitingPay.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">가족 결제 대기</div>
          {waitingPay.map((r) => (
            <div key={r.id} className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] text-ink">
              <b>{reqTitle(r)}</b> · {fmtWon(r.amount)} — 결제되면{" "}
              {!r.approvedAt ? "확인 대기" : r.dir === "fromConcierge" || r.dir === "fromOps" ? "확정" : "관제 승인 대기"}로 넘어옵니다
            </div>
          ))}
        </div>
      )}

      {(finished.length > 0 || otherCharges.length > 0) && (
        <div className="mt-3 space-y-2">
          <div className="text-[12px] font-bold text-navy">끝난 것 — 예약한 시간보다 길어졌다면</div>
          {finished.map((r) => (
            <div key={r.id} className="rounded-xl border border-navy/[.08] bg-white/70 p-3">
              <div className="flex items-center gap-2">
                <Badge fg={STATUS.done.fg} bg={STATUS.done.bg}>{STATUS.done.label}</Badge>
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-navy">{reqTitle(r)}</span>
              </div>
              <ExtraArea r={r} me={me} charges={charges} payees={payees} customer={customer} dispatch={dispatch} push={push} />
            </div>
          ))}
          {otherCharges.map((x) => (
            <div key={x.id}>
              <div className="text-[12px] font-bold text-ink">
                {x.customer || customer} · {svcTitle(x.service)}
              </div>
              <ExtraLine x={x} />
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">보낸 제안 — 수락 대기</div>
          {sent.map((r) => (
            <SentRow key={r.id} r={r} me={me} dispatch={dispatch} push={push} />
          ))}
        </div>
      )}

      {dropped.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[12px] font-bold text-navy">취소된 것 — 가지 않아도 됩니다</div>
          {dropped.map((r) => (
            <div key={r.id} className="rounded-lg bg-navy/[.04] px-3 py-2 text-[12.5px] leading-[1.6] text-ink">
              <b>{svcTitle(r.type)}</b>
              {fmtScheduled(r) ? ` · ${fmtScheduled(r)}` : ""} — {lastOf(r)?.note || "취소"}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── 추가 이용 금액 결제 알림 (2026-10-22 시제품 v17) ──
// 보낸 청구가 결제되면 — 받는 분이 앱에서 냈든, 기한이 지나 등록 카드로 결제됐든 — 어느 탭에 있든 화면 위에 알린다.
// 이 기기에서 확인한 것은 다시 띄우지 않고, 결제된 지 사흘이 지난 것은 띄우지 않는다 (카드의 상태 줄은 그대로 남는다)
const PAID_SEEN_KEY = "kcare-concierge-extra-paid-v1";
const PAID_NOTICE_DAYS = 3;
export function ExtraPaidNotice({ charges }) {
  const [seen, setSeen] = useState(null);
  const key = scopedKey(PAID_SEEN_KEY);
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(key) || "{}") || {});
    } catch {
      setSeen({});
    }
  }, [key]);
  const now = Date.now();
  const fresh = seen ? (charges || []).filter((x) => x.status === "paid" && now - Number(x.paidAt || 0) < PAID_NOTICE_DAYS * 86400000 && !seen[x.id]) : [];
  if (!fresh.length) return null;
  const close = () => {
    const next = { ...(seen || {}) };
    fresh.forEach((x) => {
      next[x.id] = Date.now();
    });
    const ids = Object.keys(next).sort((a, b) => next[b] - next[a]).slice(0, 200);
    const trimmed = Object.fromEntries(ids.map((id) => [id, next[id]]));
    setSeen(trimmed);
    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      /* 저장이 막힌 브라우저 — 이 화면에서만 기억 */
    }
  };
  return (
    <div role="status" aria-label="추가 이용 금액 결제 알림" className="rounded-xl border border-green/30 bg-[#EEF6F1] p-3">
      <div className="text-[11px] font-bold tracking-[.08em] text-green">추가 이용 금액 · 결제 알림</div>
      <ul className="mt-1 space-y-1">
        {fresh.slice(0, 3).map((x) => (
          <li key={x.id} className="text-[13px] leading-[1.5] text-ink">
            <b className="text-navy">
              {x.customer || "고객"} · {svcTitle(x.service)} {fmtWon(x.amount)}
            </b>{" "}
            — {x.auto ? "기한이 지나 등록된 카드로 결제됐어요" : `${x.payer || extraToText(x)} 결제 완료`}
          </li>
        ))}
      </ul>
      {fresh.length > 3 && <p className="mt-0.5 text-[12px] text-muted">그 밖에 {fresh.length - 3}건</p>}
      <button type="button" onClick={close} className="btn-press mt-2 w-full rounded-lg border border-green/40 bg-white py-2 text-[13px] font-bold text-green">
        알림 확인
      </button>
    </div>
  );
}

// ── 새 해주세요 알림 (2026-10-14 현장 '기본 로직' 5번 · 연동 확인 3번) ──
// 어르신 · 보호자가 해주세요(말로 부탁 포함)를 보내면 담당 컨시어지 화면에 — 어느 탭에 있든 — 창이 뜨고 알림음이 한 번 울린다.
// 이 기기에서 본 요청은 다시 띄우지 않는다. 확인 · 거절은 오늘 탭 '해주세요'에서 한다.
const SEEN_KEY = "kcare-concierge-newreq-v1";
export function newRequestsFor(requests) {
  return (requests || []).filter((r) => r.status === "requested" && approverOf(r) === "concierge" && !isVisitCall(r) && r.dir !== "fromConcierge");
}
export function NewRequestAlert({ requests, onOpen }) {
  const [seen, setSeen] = useState(null);
  const key = scopedKey(SEEN_KEY);
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem(key) || "{}") || {});
    } catch {
      setSeen({});
    }
  }, [key]);
  const fresh = seen ? newRequestsFor(requests).filter((r) => !seen[r.id]) : [];
  const freshKey = fresh.map((r) => r.id).join(",");
  useEffect(() => {
    if (freshKey) ringAlarm();
  }, [freshKey]);
  if (!fresh.length) return null;
  const close = (go) => {
    const next = { ...(seen || {}) };
    fresh.forEach((r) => {
      next[r.id] = Date.now();
    });
    // 오래된 표시는 버린다 (요청 id 가 계속 쌓이지 않게)
    const ids = Object.keys(next).sort((a, b) => next[b] - next[a]).slice(0, 200);
    const trimmed = Object.fromEntries(ids.map((id) => [id, next[id]]));
    setSeen(trimmed);
    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      /* 저장이 막힌 브라우저 — 이 화면에서만 기억 */
    }
    if (go) onOpen?.();
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(8,23,45,.55)] p-4">
      <div role="alertdialog" aria-modal="true" aria-label="새 해주세요" className="w-full max-w-[400px] rounded-[22px] bg-white p-5 shadow-xl" style={{ borderTop: "6px solid #B08D57" }}>
        <div className="text-[12px] font-bold tracking-[.12em] text-[#8A5D12]">새 해주세요 · 확인 대기</div>
        <div className="mt-1 text-[19px] font-black text-navy">새 부탁 {fresh.length}건이 왔습니다</div>
        <ul className="mt-3 space-y-2">
          {fresh.slice(0, 4).map((r) => (
            <li key={r.id} className="rounded-xl bg-navy/[.04] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-navy">{svcTitle(r.type)}</span>
                {r.urgency === "urgent" && <Badge fg={URGENCY.urgent.fg} bg={URGENCY.urgent.bg}>긴급</Badge>}
                <span className="ml-auto text-[11px] text-muted">{FROM[r.dir] || ""}</span>
              </div>
              <div className="mt-0.5 text-[12px] text-ink">
                {r.voice ? `어르신 목소리 ${clock(r.voice.clip?.secs || 0)} — 들어 보고 정리해 주세요` : `희망 ${fmtPreferred(r)}`}
              </div>
            </li>
          ))}
        </ul>
        {fresh.length > 4 && <p className="mt-1.5 text-[12px] text-muted">그 밖에 {fresh.length - 4}건</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => close(false)} className="btn-press flex-1 rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
            나중에
          </button>
          <button type="button" autoFocus onClick={() => close(true)} className="btn-press flex-[1.6] rounded-xl bg-navy py-3 text-[14px] font-bold text-white">
            확인하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}
