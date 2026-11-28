/* 래플 설정 정본(정본 lib/raffle.ts 의 DEFAULT 와 같은 값) - 단독 앱은 DB 가 없으므로 여기서 읽는다.
   시작 2026-09-22 18:00 KST · 마감 09-27 18:00 KST · 발표 09-28 18:00 KST · 행사 10-03 · 5 XRP · 500명 · 예약 30분. */
import type { RaffleStateView } from "@/components/raffle/types";

export const RAFFLE_CONFIG: RaffleStateView["config"] = {
  open: "2026-09-22T09:00:00Z",
  close: "2026-09-27T09:00:00Z",
  drawAt: "2026-09-28T09:00:00Z",
  eventAt: "2026-10-03T00:00:00Z",
  priceXrp: 5,
  maxEntries: 500,
  holdMinutes: 30,
  prizes: [
    { name: "XRP SEOUL 2026 초대권", qty: 290, note: "10월 3일 서울 · 행사장 입장권 · 당첨자 이메일로 발송" },
    { name: "Weather Data Token Generator™", qty: 10, note: "제네시스 한정판, 실물 날씨데이터 토큰 생성기 1대 · 행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 우산", qty: 50, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
    { name: "wellbian 에코백", qty: 150, note: "행사 당일 'wellbian 플래티넘 부스' 현장수령" },
  ],
};

/** 시간만 보는 페이즈 - 정본은 여기에 정원(결제 확정 + 유효 예약)을 더한다 */
export function phaseAt(c: RaffleStateView["config"], now = new Date()): RaffleStateView["phase"] {
  const t = now.getTime();
  if (t < Date.parse(c.open)) return "BEFORE";
  if (t >= Date.parse(c.close)) return "CLOSED";
  return "OPEN";
}

export function localRaffleState(): RaffleStateView {
  const config = RAFFLE_CONFIG;
  return { mode: "prod", phase: phaseAt(config), config, count: 0, holds: 0, remaining: config.maxEntries, destination: "", mine: null, draw: null };
}
