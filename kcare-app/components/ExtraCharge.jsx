// 추가 이용 금액 — 받는 분 화면 (2026-10-22 시제품 v17 · docs/kcare/decisions/2026-10-22-booking-pay.md).
//   홈 카드    결제 요청 · 금액 · 추가 시간 · 결제 기한 → '확인하고 결제'. 결제가 끝나면 '결제 완료'(기한이 지나 관제가
//              등록 카드로 처리했으면 '등록된 카드로 결제됐어요')로 사흘 동안 남는다.
//   자세히     예약한 시간 → 실제 이용 → 추가 시간 → 결제 기한 → 추가 금액 · 선생님 메모 · 결제 방법 · 결제 버튼.
//              문의하기 버튼은 두지 않는다 (시제품 결정).
// 받는 분으로 지정된 사람에게만 보인다 — 어르신 화면은 어르신에게 보낸 것만, 보호자 화면은 그 보호자에게 보낸 것만
// (lib/booking.js extraIsFor). 주황 · 빨강 대신 금색 — 빨강은 위험 신호 전용이다.
import { Btn, Sheet, SheetTitle, TONE, WhiteBtn } from "./ds";
import { fmtWon } from "../lib/config";
import { addMin, clock12, dateLabel, durOf, durText, extraDueYmd, extraIsFor, extraStateText, svcTitle } from "../lib/booking";

const PAID_KEEP = 3 * 86400000; // 결제 완료 카드는 사흘 동안 홈에 남긴다

// 이 사람이 받은 청구 — 결제 대기 전부 + 최근 결제된 것 (취소된 청구는 보이지 않는다)
export function myExtraCharges(charges, role, name, now = Date.now()) {
  return (charges || []).filter((x) => extraIsFor(x, role, name) && (x.status === "pending" || (x.status === "paid" && now - Number(x.paidAt || 0) < PAID_KEEP)));
}

const fs = (big, a, b) => (big ? a : b);

// 홈 카드 한 장
export function ExtraChargeCard({ x, big = false, onOpen }) {
  const g = TONE.gold;
  if (x.status === "paid")
    return (
      <div role="status" className="flex items-center gap-3 rounded-[22px] px-4 py-3.5" style={{ background: TONE.green.bg }}>
        <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full" style={{ background: TONE.green.solid }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <b className="block font-extrabold" style={{ fontSize: fs(big, 19, 17), color: TONE.green.fg }}>
            {extraStateText(x)}
          </b>
          <span className="font-bold" style={{ fontSize: fs(big, 16, 14), color: TONE.green.title }}>
            추가 이용 금액 {fmtWon(x.amount)}
          </span>
        </span>
      </div>
    );
  return (
    <div className="flex flex-col gap-3 rounded-[26px]" style={{ background: g.bg, padding: fs(big, 18, 16), boxShadow: `0 5px 0 ${g.sh}` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full px-3 py-1 font-extrabold" style={{ fontSize: fs(big, 15, 14), background: g.badge, color: "#FFFFFF" }}>
          결제 요청
        </span>
        <span className="truncate font-bold" style={{ fontSize: fs(big, 15, 14), color: g.sub }}>
          {x.by} 선생님
        </span>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2.5">
          <b style={{ fontSize: fs(big, 22, 19), color: "#1B2340" }}>추가 이용 금액</b>
          <b className="font-num" style={{ fontSize: fs(big, 24, 20), color: "#1B2340" }}>
            {fmtWon(x.amount)}
          </b>
        </div>
        <div style={{ fontSize: fs(big, 17, 15), color: g.sub }}>
          {svcTitle(x.service)} · {durText(x.usedMin - x.bookedMin)} 더
        </div>
        <div className="mt-1 font-extrabold" style={{ fontSize: fs(big, 16, 14), color: g.fg }}>
          {dateLabel(extraDueYmd(x.sentAt))}까지
        </div>
      </div>
      <Btn tone="gold" h={fs(big, 62, 54)} className="w-full font-extrabold" style={{ fontSize: fs(big, 19, 17) }} onClick={() => onOpen(x.id)}>
        확인하고 결제
      </Btn>
    </div>
  );
}

// 자세히 — 예약 → 실제 → 추가 시간 → 기한 → 금액 · 메모 · 결제 방법 · 결제 버튼
export function ExtraChargeSheet({ x, r, big = false, demo = false, onPay, onClose }) {
  if (!x) return null;
  const each = durOf(x.service)?.each || 0;
  const start = x.startTime || "";
  const span = (min) => (start ? `${clock12(start)}~${clock12(addMin(start, min))}` : "");
  const when = r?.scheduledDate ? dateLabel(r.scheduledDate) : "";
  const place = r?.hospital || "";
  const text = fs(big, 18, 16);
  const small = { fontSize: fs(big, 15, 13), color: "#6B6658", fontWeight: 700 };
  const row = (label, value, sub, first = false) => (
    <div className="flex items-start justify-between gap-2.5 py-2.5" style={first ? undefined : { borderTop: "1px solid #F0ECE4" }}>
      <span className="font-bold" style={{ color: "#5E6270" }}>
        {label}
      </span>
      <span className="text-right">
        <b className="font-num">{value}</b>
        {sub && <span className="block" style={small}>{sub}</span>}
      </span>
    </div>
  );
  const paid = x.status !== "pending";
  return (
    <Sheet onClose={onClose} label="추가 이용 금액">
      <SheetTitle sub="추가 이용 금액" title={svcTitle(x.service)} />
      {(when || place) && (
        <div className="font-bold" style={{ fontSize: fs(big, 17, 15), color: "#5E6270" }}>
          {[when, place].filter(Boolean).join(" · ")}
        </div>
      )}
      <div className="rounded-[20px] bg-white px-4 py-1" style={{ fontSize: text }}>
        {row("예약한 시간", durText(x.bookedMin), span(x.bookedMin), true)}
        {row("실제 이용", durText(x.usedMin), span(x.usedMin))}
        {row("추가 시간", durText(x.usedMin - x.bookedMin), each ? `30분마다 ${fmtWon(each)}` : "")}
        {row("결제 기한", `${dateLabel(extraDueYmd(x.sentAt))}까지`)}
        <div className="flex items-center justify-between gap-2.5 py-3" style={{ borderTop: "2px solid #1B2340" }}>
          <span className="font-extrabold">추가 금액</span>
          <b className="font-num" style={{ fontSize: fs(big, 24, 21) }}>
            {fmtWon(x.amount)}
          </b>
        </div>
      </div>
      {x.memo && (
        <div className="rounded-[18px] px-3.5 py-3 font-bold" style={{ background: TONE.green.bg, color: TONE.green.fg, fontSize: fs(big, 17, 15) }}>
          <b className="block" style={{ fontSize: "0.85em", color: TONE.green.title }}>
            {x.by} 선생님
          </b>
          {x.memo}
        </div>
      )}
      {paid ? (
        <div role="status" className="rounded-[18px] px-4 py-3.5 text-center font-extrabold" style={{ background: TONE.green.bg, color: TONE.green.fg, fontSize: fs(big, 19, 17) }}>
          {extraStateText(x)}
        </div>
      ) : (
        <>
          <div className="rounded-[18px] bg-white px-4 py-3">
            <div className="font-extrabold" style={{ fontSize: fs(big, 19, 17) }}>
              결제 방법
            </div>
            <div className="mt-1 font-bold" style={{ fontSize: fs(big, 16, 14), color: "#5E6270" }}>
              {demo ? "데모 — 실제 결제 없이 가상 승인해요" : "카드 · 간편결제 — 결제 창에서 골라요"}
            </div>
          </div>
          <Btn tone="gold" h={fs(big, 66, 58)} className="w-full font-extrabold" style={{ fontSize: fs(big, 20, 18) }} onClick={() => onPay(x)}>
            {fmtWon(x.amount)} 결제하기
          </Btn>
          <div className="text-center font-bold" style={small}>
            기한이 지나면 등록된 카드로 자동 결제돼요
          </div>
        </>
      )}
      <WhiteBtn h={fs(big, 60, 54)} className="w-full font-extrabold" style={{ fontSize: fs(big, 19, 17) }} onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}
