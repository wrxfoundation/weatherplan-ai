"use client";

/* 보상 클레임 (8/30 회의 — "클레임 가능 잔액(지갑 잔액 아님) + 전액 클레임 → 지갑 이동")

   괄호 안이 이 화면이 푸는 문제다. 보상은 쌓여 있어도 아직 지갑에 없다. 큰 숫자만
   띄우면 그게 지갑 잔액으로 읽히고, 지갑을 열어 본 사람이 "돈이 없다" 고 문의를 넣는다.
   그래서 숫자 바로 아래에 "아직 지갑에 있지 않다" 를 붙였다 — 각주가 아니라 숫자와
   같은 덩어리로 둔다. 각주로 내리면 안 읽힌다.

   클레임을 한 번에 보내지 않는다. 온체인 거래이고 되돌릴 수 없는데, 큰 파란 단추는
   눌러 보고 싶게 생겼다. 확인 한 단계를 두고 거기서 무슨 일이 일어나는지 —— 수수료가
   붙는다는 것까지 —— 적는다.

   수익을 말하지 않는다. 지급량·가치 비보장 고지를 화면에서 떼지 않는다. */

import { useState } from "react";
import { MOCK_REWARD, rewardTotal, NOTICE_REWARD, NOTICE_REWARD_EN } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

/* 소수 넷째 자리까지 — 클레임 기록은 온체인 값이라 반올림해서 보여 주면 지갑과 안 맞는다.
   대신 꼬리의 0 은 지운다(4.8781 은 그대로, 128.4000 은 128.4 로). */
const wl = (n: number) => n.toFixed(4).replace(/\.?0+$/, "");

/* 한국어 로케일에 그냥 맡기면 "9. 1. 00:00" 이 나온다 — 점 세 개가 무엇을 가르는지
   읽는 사람이 한 번 멈춘다. 월·일을 글자로 적는다. */
const kst = (iso: string, en: boolean) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const time = `${g("hour")}:${g("minute")}`;
  return en ? `${g("month")}/${g("day")} ${time}` : `${g("month")}월 ${g("day")}일 ${time}`;
};

type Step = "idle" | "confirm" | "sending" | "done";

export default function ClaimCard() {
  const { en } = useI18n();
  const [step, setStep] = useState<Step>("idle");
  const [movedAt, setMovedAt] = useState<string | null>(null);

  /* 옮기고 나면 세 값이 다 움직인다. 처음엔 성공 안내만 띄웠더니 옆에 "클레임 가능
     128.4" 가 그대로 남아 있었다 — 이 카드가 막으려던 불일치를 카드가 만든 셈이다.
     그래서 화면에 쓰는 값을 전부 여기서 한 번에 갈아 끼운다. */
  const done = step === "done";
  const amount = done ? 0 : MOCK_REWARD.claimable;
  const inWallet = done ? rewardTotal() : MOCK_REWARD.claimed;
  const lastClaim = movedAt ?? MOCK_REWARD.lastClaimAt;
  const nothing = amount <= 0;

  const claim = () => {
    setStep("sending");
    /* 목업이다. 실제로는 서명 요청 → 원장 확정까지 기다린다 — 그 사이 화면이 멈춰
       있으면 두 번 누르게 되므로 단추를 잠그는 상태를 지금부터 만들어 둔다. */
    setTimeout(() => { setMovedAt(new Date().toISOString()); setStep("done"); }, 1200);
  };

  return (
    <div className="claim-card">
      <div className="claim-head">
        <span className="claim-h">{en ? "Rewards" : "보상"}</span>
        <span className="claim-epoch">
          {en ? "Next settlement" : "다음 정산"}{" "}
          <b className="mono">{kst(MOCK_REWARD.nextEpochAt, en)}</b>
        </span>
      </div>

      <div className="claim-main">
        <div className="claim-amt-box">
          <span className="claim-k">{en ? "Claimable" : "클레임 가능"}</span>
          <span className={`claim-amt${nothing ? " zero" : ""}`}>
            {wl(amount)}<i>WLBN</i>
          </span>
          {/* 회의록의 "(지갑 잔액 아님)" — 숫자와 한 덩어리로 둔다.
              다 옮긴 뒤에는 이 문장이 거짓이 되므로 같이 바꾼다. */}
          <span className="claim-note">
            {nothing
              ? (en
                  ? "Nothing waiting right now — rewards build up again at the next settlement."
                  : "지금 기다리는 보상은 없습니다 — 다음 정산부터 다시 쌓입니다.")
              : (en
                  ? "Not in your wallet yet — claiming moves it there."
                  : "아직 지갑에 있지 않습니다 — 클레임해야 지갑으로 옮겨집니다.")}
          </span>
        </div>

        <div className="claim-act">
          {step === "done" ? (
            <div className="claim-done">
              <span className="claim-done-h">{en ? "Moved to your wallet" : "지갑으로 옮겼습니다"}</span>
              <span className="claim-done-s">
                {en
                  ? "It may take a moment to appear in your wallet app."
                  : "지갑 앱에 보이기까지 잠시 걸릴 수 있습니다."}
              </span>
            </div>
          ) : step === "confirm" ? (
            <div className="claim-confirm">
              <p>
                {en
                  ? <><b>{wl(amount)} WLBN</b> will be moved to your wallet <span className="mono">rWLB9…kQ2f</span>. A network fee applies, paid in XRP from that wallet.</>
                  : <><b>{wl(amount)} WLBN</b>을 내 지갑 <span className="mono">rWLB9…kQ2f</span>으로 옮깁니다. 네트워크 수수료가 발생하며, 그 지갑의 XRP에서 나갑니다.</>}
              </p>
              <div className="claim-btns">
                <button className="claim-go" onClick={claim}>{en ? "Move now" : "옮기기"}</button>
                <button className="claim-cancel" onClick={() => setStep("idle")}>{en ? "Cancel" : "취소"}</button>
              </div>
            </div>
          ) : (
            <button className="claim-go wide" disabled={nothing || step === "sending"}
                    onClick={() => setStep("confirm")}>
              {step === "sending"
                ? (en ? "Moving…" : "옮기는 중…")
                : nothing
                  ? (en ? "Nothing to claim yet" : "아직 클레임할 보상이 없습니다")
                  : (en ? "Claim all → my wallet" : "전액 클레임 → 내 지갑")}
            </button>
          )}
        </div>
      </div>

      <div className="claim-foot">
        <div className="claim-sub">
          <span>
            {en ? "Earned in total" : "누적"} <b>{wl(rewardTotal())}</b>
          </span>
          <span>
            {en ? "Already in wallet" : "지갑으로 옮긴 것"}{" "}
            <b>{wl(inWallet)}</b>
          </span>
          <span className="claim-last">
            {en ? "Last claim" : "마지막 클레임"} {kst(lastClaim, en)}
          </span>
        </div>
        <span className="claim-guard">{en ? NOTICE_REWARD_EN : NOTICE_REWARD}</span>
      </div>
    </div>
  );
}
