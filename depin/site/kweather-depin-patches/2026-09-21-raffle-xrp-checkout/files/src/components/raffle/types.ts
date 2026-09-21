/* XRP SEOUL 2026 래플 - 화면(RafflePage)과 결제창(RaffleCheckoutModal)이 같이 쓰는 형 (2026-09-21).
   서버 쪽 정본은 lib/raffle.ts 의 raffleState() 반환값이다 - 여기는 그 JSON 을 읽는 쪽의 형만 둔다. */
export type RaffleMode = "prod" | "test";

export interface RafflePrizeView { name: string; qty: number; note?: string }

export interface RaffleMine {
  status: string; destTag: number; entryNo: number | null; txHash: string | null; amountXrp: number;
  ticketCode: string | null; prize: string | null; redeemedAt: string | null;
  /** 결제 대기(PENDING) 예약 만료 시각 - 그때까지 자리가 확보돼 있다(결제창을 열어 두면 자동 연장). 다른 상태는 null */
  holdUntil: string | null; holdLive: boolean;
  pass: { state: string; offerIndex: string | null; nftTokenId: string | null } | null;
}

export interface RaffleStateView {
  mode: RaffleMode; phase: "BEFORE" | "OPEN" | "SOLD_OUT" | "CLOSED";
  config: { open: string; close: string; drawAt: string; eventAt: string; priceXrp: number; maxEntries: number; holdMinutes: number; prizes: RafflePrizeView[] };
  /** count = 결제 확정 수(참여 현황) · holds = 유효 예약(결제 대기) 수 · remaining = 정원 - 확정 - 유효 예약 */
  count: number; holds: number; remaining: number; destination: string; mine: RaffleMine | null;
}

/** 응모에 필요한 지갑 잔고 = 응모 금액 + 계정 예치금 1 + NFT 한 장 예치금 0.2 + 수수료 여유 */
export const RESERVE_XRP = 1.3;

export const raffleQs = (mode: RaffleMode) => (mode === "test" ? "?mode=test" : "");
