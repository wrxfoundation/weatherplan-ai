/* XRP SEOUL 2026 래플 - 화면(RafflePage)과 결제창(RaffleCheckoutModal)이 같이 쓰는 형 (2026-09-21).
   서버 쪽 정본은 lib/raffle.ts 의 raffleState() 반환값이다 - 여기는 그 JSON 을 읽는 쪽의 형만 둔다. */
export type RaffleMode = "prod" | "test";

export interface RafflePrizeView { name: string; qty: number; note?: string }

export interface RaffleMine {
  status: string; destTag: number; entryNo: number | null; txHash: string | null; amountXrp: number;
  ticketCode: string | null; prize: string | null; redeemedAt: string | null;
  pass: { state: string; offerIndex: string | null; nftTokenId: string | null } | null;
}

export interface RaffleStateView {
  mode: RaffleMode; phase: "BEFORE" | "OPEN" | "SOLD_OUT" | "CLOSED";
  config: { open: string; close: string; drawAt: string; eventAt: string; priceXrp: number; maxEntries: number; prizes: RafflePrizeView[] };
  count: number; remaining: number; destination: string; mine: RaffleMine | null;
}

/** 응모에 필요한 지갑 잔고 = 응모 금액 + 계정 예치금 1 + NFT 한 장 예치금 0.2 + 수수료 여유 */
export const RESERVE_XRP = 1.3;

export const raffleQs = (mode: RaffleMode) => (mode === "test" ? "?mode=test" : "");
