// 오늘 › 지금 카드 — 내가 맡은 해주세요 (2026-10-24 컨시어지 화면설계서 v3 §1-2 · 1-3).
// 진행 시작 → 완료(체크아웃) → 그 뒤 이 카드 맨 아래에서 '추가 이용 금액 보내기' (예약한 시간보다 길어졌을 때).
// 보낸 뒤에는 버튼 자리에 상태 줄(결제 대기 · 결제 완료 · 자동 결제)이 들어간다.
// 금액은 서비스 메뉴의 30분 단가로 계산한다 (lib/booking.js extraAmountOf — 보내는 쪽이 금액을 적지 않는다).
import { useEffect, useId, useState } from "react";
import { Card, Badge } from "./ui";
import { fmtWon } from "../lib/config";
import { STATUS, kstYmd } from "../lib/requests";
import { EXTRA_USED_MAX, STEP, addMin, canChargeExtra, dateLabel, durOf, durText, extraAmountOf, extraDueYmd, extraOverdue, svcTitle } from "../lib/booking";

const KST = 9 * 3600 * 1000;
const hm = (t) => new Date(Number(t) + KST).toISOString().slice(11, 16);
// 상태 칩 색 — 주의 · 완료 (설계서 0-2)
const WARN = { bg: "#F1E9DC", fg: "#6A4C16" };
const DONE = { bg: "#E4EEE5", fg: "#2A4D33" };
const MUTE = { bg: "#EEEDEA", fg: "#5E5A52" };
const toLabel = (to) => (to?.role === "elder" ? "어르신" : `보호자${to?.name ? ` ${to.name}` : ""}`);

function Chip({ tone, children }) {
  return (
    <span className="inline-flex h-[22px] flex-none items-center rounded-[6px] px-2 text-[11px] font-bold" style={{ background: tone.bg, color: tone.fg }}>
      {children}
    </span>
  );
}

// 보낸 청구 한 줄 — 결제 대기 · 결제 완료 · 자동 결제 (관제가 취소했으면 그 사유)
export function ExtraStatusRow({ x }) {
  const add = durText(x.usedMin - x.bookedMin);
  const [label, tone, sub] =
    x.status === "paid"
      ? x.auto
        ? ["자동 결제", DONE, `기한 지남 · 등록 카드 ${hm(x.paidAt)}`]
        : ["결제 완료", DONE, `${toLabel(x.to)} 결제 ${hm(x.paidAt)}`]
      : x.status === "cancelled"
        ? ["청구 취소", MUTE, `관제 취소 — ${x.cancel?.reason || ""}`]
        : ["결제 대기", WARN, `${toLabel(x.to)}께 보냄 ${hm(x.sentAt)} · ${dateLabel(extraDueYmd(x.sentAt))}까지${extraOverdue(x) ? " · 기한 지남" : ""}`];
  return (
    <div role="status" className="mt-2.5 rounded-[10px] border border-[#E5E3DE] bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Chip tone={tone}>{label}</Chip>
        <b className="min-w-0 flex-1 truncate text-[14px] text-[#1B2340]">
          추가 이용 {add} · {fmtWon(x.amount)}
        </b>
      </div>
      <div className="mt-1 text-[12px] leading-[1.5] text-[#7A7F8E]">
        {sub}
        {x.demo ? " (데모)" : ""}
      </div>
    </div>
  );
}

// 받는 분께 보일 메모 기본 문구 — 추가 시간에 맞춰 바뀐다 (병원 동행은 목업 문구 그대로)
const defaultMemo = (type, add) => (/병원/.test(svcTitle(type)) ? `진료 대기가 길어져 ${durText(add)} 더 함께했어요` : `예약한 시간보다 ${durText(add)} 더 함께했어요`);

// 보내기 시트 (설계서 v3 §1-3) — 예약한 시간 · 실제 이용(30분씩, 예약한 시간 ~ 서비스 최대 이용 시간) · 추가 시간 · 추가 금액 ·
// 받는 분(구두로 동의한 분, 처음은 어르신) · 메모 · 결제 기한(보낸 날 + 3일)
export function ExtraChargeSheet({ r, payees, customer, onClose, onSend }) {
  const memoId = useId();
  const d = durOf(r.type);
  const booked = Number(r.durationMin) || d?.min || 0;
  // 최댓값 — 그 서비스의 최대 이용 시간 (병원 동행 5시간 · 설계서 v3 '최댓값 5시간'). 예약이 이미 최대면 늘릴 수 없다
  const max = Math.min(EXTRA_USED_MAX, Math.max(booked, d?.max || EXTRA_USED_MAX));
  const [used, setUsed] = useState(Math.min(max, booked + STEP));
  const elderAt = payees.findIndex((p) => p.role === "elder");
  const [to, setTo] = useState(elderAt >= 0 ? elderAt : payees.length ? 0 : -1);
  const [memo, setMemo] = useState(null); // null 이면 기본 문구 (추가 시간에 맞춰 바뀐다)
  const add = used - booked;
  const amount = add > 0 ? extraAmountOf({ service: r.type, bookedMin: booked, usedMin: used }) : 0;
  const start = r.scheduledTime || r.preferredTime || "";
  const due = dateLabel(extraDueYmd(Date.now()));
  const pick = payees[to] || null;
  const memoText = memo ?? (add > 0 ? defaultMemo(r.type, add) : "");
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const row = "flex min-h-[48px] items-center justify-between gap-3 border-b border-[#EFEDE8] py-2 text-[14px]";
  const stepBtn = "btn-press h-10 w-10 flex-none rounded-[10px] border border-[#D9D6CF] bg-white text-[18px] font-black text-[#1B2340] disabled:opacity-35";
  return (
    <div role="dialog" aria-modal="true" aria-label="추가 이용 금액" className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white px-5 pb-7 pt-5 text-[#1B2340]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-[#7A7F8E]">추가 이용 금액</div>
            <div className="text-[18px] font-black leading-[1.35]">
              {customer} 고객 · {svcTitle(r.type)}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="btn-press flex h-[44px] w-[44px] flex-none items-center justify-center rounded-[12px] border border-[#D9D6CF] text-[18px] font-bold text-[#5E6676]">
            ✕
          </button>
        </div>

        <div className="mt-3 border-t border-[#EFEDE8]">
          <div className={row}>
            <span className="text-[#7A7F8E]">예약한 시간</span>
            <b className="font-num">
              {durText(booked)}
              {start ? ` · ${start}–${addMin(start, booked)}` : ""}
            </b>
          </div>
          <div className={row}>
            <span className="flex-none text-[#7A7F8E]">실제 이용</span>
            <span className="flex items-center gap-2">
              <button type="button" aria-label="30분 줄이기" disabled={used - STEP < booked} onClick={() => setUsed((v) => Math.max(booked, v - STEP))} className={stepBtn}>
                −
              </button>
              <b className="min-w-[92px] text-center font-num leading-[1.35]">
                {durText(used)}
                {start && <span className="block text-[12px] font-bold text-[#7A7F8E]">~{addMin(start, used)}</span>}
              </b>
              <button type="button" aria-label="30분 늘리기" disabled={used + STEP > max} onClick={() => setUsed((v) => Math.min(max, v + STEP))} className={stepBtn}>
                +
              </button>
            </span>
          </div>
          <div className={row}>
            <span className="text-[#7A7F8E]">추가 시간</span>
            <b className="font-num">{add > 0 ? `${durText(add)} · 30분마다 ${fmtWon(d?.each || 0)}` : "없음"}</b>
          </div>
          <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[#1B2340] py-3">
            <b className="text-[15px]">추가 금액</b>
            <b className="font-num text-[24px]">{fmtWon(amount || 0)}</b>
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <b className="text-[14px]">받는 분</b>
          <span className="text-[12px] text-[#7A7F8E]">구두로 동의한 분</span>
        </div>
        {payees.length ? (
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="받는 분">
            {payees.map((p, i) => (
              <button
                key={`${p.role}-${p.name}`}
                type="button"
                aria-pressed={to === i}
                onClick={() => setTo(i)}
                className={`btn-press min-h-[44px] rounded-[10px] border px-2 text-[14px] font-bold ${to === i ? "border-[#1B2340] bg-[#1B2340] text-white" : "border-[#D9D6CF] bg-white text-[#1B2340]"}`}
              >
                {p.role === "elder" ? "어르신" : "보호자"} {p.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-[10px] bg-[#F1E9DC] px-3 py-2 text-[13px] font-bold text-[#6A4C16]">받을 분이 없습니다 — 관제에 알려 주세요</p>
        )}

        <label htmlFor={memoId} className="mt-4 block text-[14px] font-bold">
          받는 분께 보일 메모
        </label>
        <input
          id={memoId}
          type="text"
          value={memoText}
          maxLength={200}
          onChange={(e) => setMemo(e.target.value)}
          className="mt-2 min-h-[44px] w-full rounded-[10px] border border-[#D9D6CF] bg-white px-3 text-[14px] outline-none placeholder:text-[#9A9690] focus:border-[#1B2340]"
        />

        <p className="mt-3 rounded-[10px] bg-[#F3F1EC] px-3 py-2.5 text-[13px] leading-[1.55]">
          <b>{due}까지</b> · 지나면 등록 카드로 자동 결제돼요
        </p>

        <button
          type="button"
          disabled={!amount || !pick}
          onClick={() => onSend({ used, pick, memo: memoText.trim(), amount, add })}
          className="btn-press mt-4 min-h-[48px] w-full rounded-[10px] bg-[#1B2340] text-[15px] font-bold text-white disabled:bg-[#E5E3DE] disabled:text-[#9A9690]"
        >
          {!amount ? "추가 시간이 없어요" : !pick ? "받는 분이 없어요" : `${fmtWon(amount)} 청구 보내기`}
        </button>
        <p className="mt-2 text-[11.5px] leading-[1.6] text-[#7A7F8E]">받는 분 앱에만 결제 요청이 뜨고, 관제 지금 처리할 일 · 해주세요 관리에 들어갑니다. 한 해주세요에 청구는 한 번이에요.</p>
      </div>
    </div>
  );
}

// 지금 카드 — 해주세요 한 건. 버튼 줄: 관제센터 연락 + 진행 시작 / 완료 / 방문 화면 열기
export function ReqNowCard({ r, me, customer, charges, payees, chips = [], onOps, onGo, dispatch, push, toast }) {
  const [asking, setAsking] = useState(false);
  const [sheet, setSheet] = useState(false);
  const st = STATUS[r.status] || STATUS.confirmed;
  const booked = Number(r.durationMin) || durOf(r.type)?.min || 0;
  const start = r.scheduledTime || "";
  const early = r.status === "confirmed" && r.scheduledDate && r.scheduledDate > kstYmd(Date.now());
  const mine = charges.filter((x) => x.reqId === r.id);
  const charge = mine.find((x) => x.status !== "cancelled") || null;
  const canExtra = r.status === "done" && canChargeExtra(r.type);
  const crew = r.partner ? `${r.assignee} · ${r.partner} (2인)` : r.assignee || me;
  const step = (to, note) => {
    dispatch({ type: "transitionRequest", id: r.id, to, note, by: me });
    push("해주세요", `${svcTitle(r.type)} — ${note}`, "#8FE3C0");
    setAsking(false);
  };
  const send = ({ used, pick, memo, amount, add }) => {
    dispatch({ type: "sendExtraCharge", payload: { reqId: r.id, usedMin: used, to: { role: pick.role, name: pick.name }, memo, customer }, by: me });
    push("추가 이용 금액", `${me} → ${pick.role === "elder" ? "어르신" : "보호자"} ${pick.name} · ${svcTitle(r.type)} 추가 ${durText(add)} · ${fmtWon(amount)} · ${dateLabel(extraDueYmd(Date.now()))}까지`, "#E8B04B");
    setSheet(false);
    toast(`${pick.role === "elder" ? "어르신" : "보호자"} 앱과 관제에 보냈어요`);
  };
  const primary = "btn-press btn-dark flex-[1.4] rounded-xl bg-green py-3 text-[14px] font-bold text-white disabled:opacity-50";
  return (
    <Card className="p-[18px]" style={{ borderColor: r.status === "inProgress" ? "rgba(30,122,90,.35)" : "rgba(10,31,60,.1)" }}>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-bold tracking-[.08em] text-muted">지금</span>
        <span className="font-num text-[14px] font-bold text-navy">{start ? `${start}–${addMin(start, booked)}` : "시간 미정"}</span>
        <span className="ml-auto">
          <Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
        </span>
      </div>
      <div className="mt-2 text-[21px] font-black leading-[1.3] text-navy">
        {customer} 고객 · {svcTitle(r.type)}
      </div>
      <div className="mt-0.5 text-[12.5px] leading-[1.6] text-muted">{[r.hospital, crew].filter(Boolean).join(" · ")}</div>
      {r.summary?.text && <div className="mt-0.5 text-[12.5px] leading-[1.6] text-ink">&ldquo;{r.summary.text}&rdquo;</div>}
      {chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map(([tag, text, tone]) => (
            <span key={tag} className="rounded-[10px] px-2.5 py-1.5 text-[12px] font-bold" style={{ background: `${tone}14`, color: tone }}>
              <span className="opacity-70">{tag} </span>
              {text}
            </span>
          ))}
        </div>
      )}
      {asking ? (
        <div className="mt-3 rounded-xl border border-green/30 bg-green/5 p-2.5">
          <p className="text-[12.5px] font-bold text-ink">완료로 남길까요? 완료는 되돌릴 수 없고, 요청한 분 화면에 &lsquo;완료&rsquo;로 보입니다.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setAsking(false)} className="btn-press flex-1 rounded-lg border border-navy/15 py-2 text-[13px] font-bold text-muted">
              아직이에요
            </button>
            <button type="button" onClick={() => step("done", `${me} 완료`)} className="btn-press flex-[2] rounded-lg bg-green py-2 text-[13px] font-bold text-white">
              네, 완료했어요
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onOps} className="btn-press flex-1 rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
            관제센터 연락
          </button>
          {r.status === "confirmed" && (
            <button type="button" disabled={!!early} onClick={() => step("inProgress", `${me} 진행 시작`)} className={primary}>
              {early ? `서비스일(${r.scheduledDate.slice(5).replace("-", "/")})에 시작` : "진행 시작"}
            </button>
          )}
          {r.status === "inProgress" && (
            <button type="button" onClick={() => setAsking(true)} className={primary}>
              완료 (체크아웃)
            </button>
          )}
          {r.status === "done" && (
            <button type="button" onClick={onGo} className={primary}>
              방문 화면 열기
            </button>
          )}
        </div>
      )}
      {r.status === "cancelRequested" && <p className="mt-2 text-[12px] font-bold text-amber">취소 요청 — 관제 승인 대기 ({r.cancelReq?.by || "요청자"})</p>}
      {/* 추가 이용 금액 — 서비스가 끝난 뒤(완료)에만. 보낸 뒤에는 버튼 자리에 상태 줄 */}
      {mine
        .filter((x) => x.status === "cancelled")
        .map((x) => (
          <ExtraStatusRow key={x.id} x={x} />
        ))}
      {charge ? (
        <ExtraStatusRow x={charge} />
      ) : (
        canExtra && (
          <button type="button" onClick={() => setSheet(true)} className="btn-press mt-2.5 min-h-[44px] w-full rounded-[10px] border border-[#D9D6CF] bg-white text-[14px] font-bold text-[#1B2340]">
            추가 이용 금액 보내기
          </button>
        )
      )}
      {sheet && <ExtraChargeSheet r={r} payees={payees} customer={customer} onClose={() => setSheet(false)} onSend={send} />}
    </Card>
  );
}
