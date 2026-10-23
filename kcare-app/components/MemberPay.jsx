// 멤버십 이용료 결제 · 결제 권한 (2026-10-22 시제품 v17) — 보호자 멤버십 · 어르신 마이가 같이 쓴다.
//   이용료 결제  누가(어르신 본인 · 보호자 · 다른 가족) × 어떻게(카드 · 계좌 자동이체 · 무통장 입금). 한쪽에서 정하면 양쪽에 같은
//               값이 보인다 (state.memberPay). 정한 값은 관제가 보고 청구를 맞춘다 — 앱이 매달 자동으로 빼 가지는 않는다.
//   결제 권한    한 가족 그룹이면 누구나 금액 제한 없이 결제한다 — 하루 한도 · 보호자 승인 단계는 없앴다.
// 시제품의 산호색 카드 · 버튼은 금색으로 — 빨강 계열은 위험 신호 전용이다.
import { useState } from "react";
import { Btn, EvenGrid, Sheet, SheetTitle, TONE, WhiteBtn } from "./ds";
import { givenName } from "../lib/people";

export const PAY_HOW = { card: "카드", autoTransfer: "계좌 자동이체", bankDeposit: "무통장 입금" };

// '누가 낼까요' 고를 것 — 어르신 본인 · 가족 그룹 보호자 · 다른 가족
export const payWhoOptions = (group) => ["어르신 본인", ...group.filter((m) => !m.elder).map((m) => `${m.name} · ${m.rel}`), "다른 가족"];

const fs = (big, a, b) => (big ? a : b);

// 이용료 결제 카드 — 정하기 전이면 '결제 방법 정하기', 정했으면 누가 · 어떻게 + 바꾸기. children 은 카드 아래쪽(카드 등록 등)
export function MemberPayCard({ value, big = false, onOpen, children }) {
  const g = TONE.gold;
  const mini = "ds-press ds-btn3d flex flex-none items-center gap-1 rounded-[14px] bg-white px-3.5";
  return (
    <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: g.bg }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="ds-lab m-0" style={{ color: g.fg, fontSize: big ? 18 : undefined }}>
          이용료 결제
        </h2>
        {value ? (
          <button type="button" onClick={onOpen} className={mini} style={{ height: fs(big, 48, 40), fontSize: fs(big, 17, 15), boxShadow: `0 3px 0 ${g.sh}`, color: g.fg }}>
            바꾸기
          </button>
        ) : (
          <span className="ds-gchip flex-none" style={{ color: g.fg }}>
            미정
          </span>
        )}
      </div>
      {value ? (
        <div>
          <b className="block" style={{ fontSize: fs(big, 21, 19), color: "#1B2340" }}>
            {value.who}
          </b>
          <span className="font-bold" style={{ fontSize: fs(big, 17, 15), color: g.sub }}>
            {PAY_HOW[value.how] || value.how}
            {value.how === "card" ? " · 토스페이먼츠" : ""}
          </span>
        </div>
      ) : (
        <>
          <Btn tone="gold" h={fs(big, 60, 54)} className="w-full font-extrabold" style={{ fontSize: fs(big, 19, 17) }} onClick={onOpen}>
            결제 방법 정하기
          </Btn>
          <div className="text-center font-bold" style={{ fontSize: fs(big, 15, 13), color: g.sub }}>
            가족 그룹 안에서 누구나 낼 수 있어요
          </div>
        </>
      )}
      {children}
    </div>
  );
}

// 결제 방법 정하기 — 누가 · 어떻게를 고르면 저장
export function MemberPaySheet({ value, whoList, big = false, onSave, onClose }) {
  const [who, setWho] = useState(value?.who && whoList.includes(value.who) ? value.who : null);
  const [how, setHow] = useState(value?.how || null);
  const chip = (on) =>
    on ? { background: TONE.gold.bg, boxShadow: "inset 0 0 0 2.5px #1B2340", color: "#1B2340" } : { background: "#FFFFFF", boxShadow: "0 3px 0 #E3DED3", color: "#1B2340" };
  const opt = `ds-press w-full rounded-[18px] px-4 text-left font-extrabold`;
  return (
    <Sheet onClose={onClose} label="멤버십 이용료 결제 방법">
      <SheetTitle sub="멤버십 이용료" title="결제 방법" />
      <div role="group" aria-label="누가 낼까요" className="flex flex-col gap-2">
        <div className="font-extrabold" style={{ fontSize: fs(big, 18, 16) }}>
          누가 낼까요
        </div>
        {whoList.map((w) => (
          <button key={w} type="button" aria-pressed={who === w} onClick={() => setWho(w)} className={opt} style={{ minHeight: fs(big, 60, 52), fontSize: fs(big, 18, 16), ...chip(who === w) }}>
            {w}
          </button>
        ))}
      </div>
      <div role="group" aria-label="어떻게 낼까요" className="flex flex-col gap-2">
        <div className="font-extrabold" style={{ fontSize: fs(big, 18, 16) }}>
          어떻게 낼까요
        </div>
        {Object.entries(PAY_HOW).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={how === k} onClick={() => setHow(k)} className={opt} style={{ minHeight: fs(big, 60, 52), fontSize: fs(big, 18, 16), ...chip(how === k) }}>
            {l}
          </button>
        ))}
      </div>
      <p className="font-bold leading-[1.6]" style={{ fontSize: fs(big, 15, 13), color: "#5E6270" }}>
        정한 방법은 관제가 보고 청구를 맞춰요. 카드는 결제 창에서 등록하고, 계좌 자동이체 · 무통장 입금은 관제가 연락드려 안내해요.
      </p>
      <Btn tone="navy" h={fs(big, 66, 58)} className="w-full font-extrabold" style={{ fontSize: fs(big, 20, 18) }} disabled={!who || !how} onClick={() => onSave({ who, how })}>
        이렇게 정하기
      </Btn>
      <WhiteBtn h={fs(big, 60, 54)} className="w-full font-extrabold" style={{ fontSize: fs(big, 19, 17) }} onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

// 결제 권한 — 한 가족 그룹 누구나 · 금액 제한 없이 + 가족 칩
export function PermCard({ group, text, big = false }) {
  const p = TONE.purple;
  return (
    <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: p.bg }}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="ds-lab m-0" style={{ color: p.fg, fontSize: big ? 18 : undefined }}>
          결제 권한
        </h2>
        <span className="font-extrabold" style={{ fontSize: fs(big, 14, 13), color: p.sub }}>
          한 가족 그룹
        </span>
      </div>
      <p className="m-0 font-extrabold leading-[1.5]" style={{ fontSize: fs(big, 20, 18), color: "#1B2340" }}>
        {text}
      </p>
      <EvenGrid labels={group.map((m) => `${givenName(m.name)} ${m.rel}`)} gap={6}>
        {group.map((m) => (
          <span key={`${m.rel}-${m.name}`} className="ds-gchip gap-1.5" style={{ color: p.fg }}>
            <b>{givenName(m.name)}</b>
            <span className="font-bold" style={{ fontSize: 13, color: p.sub }}>
              {m.rel}
            </span>
          </span>
        ))}
      </EvenGrid>
    </div>
  );
}
