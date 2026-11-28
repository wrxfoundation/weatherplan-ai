import { drainOutbox, reconcileOutbox } from "@/lib/xrpl/outbox";

/* 크론 없이도 래플 NFT 발행 → 오퍼 체인이 흐르게 한다 (2026-09-21).
   Vercel Hobby 계정은 크론이 하루 1회뿐이라 매분 도는 /api/cron/drain·reconcile 이 없다. 그러면 발행 결과 정산(reconcile)이 안 되어
   NFTokenCreateOffer 가 큐에 들어가지 않고, 사용자는 「NFT 발행 중」에서 멈춘다.
   그래서 상태 조회(/api/raffle/state - 페이지가 20초, 결제창 ④ 가 5초마다 부른다) 때 인스턴스당 20초에 한 번, 정산 3초 + 드레인 3초 예산으로 민다.
   Pro(매분 크론) 에서 겹쳐 돌아도 무해하다 - 드레인은 리스로 하나만 돌고 정산은 멱등이다. RAFFLE_SELF_DRAIN=0 이면 끈다. */
let last = 0;
let running: Promise<void> | null = null;

export async function nudgeRaffleOutbox(): Promise<void> {
  if (process.env.RAFFLE_SELF_DRAIN === "0") return;
  if (running) return running;
  if (Date.now() - last < 20_000) return;
  last = Date.now();
  running = (async () => {
    try { await reconcileOutbox(3_000); } catch { /* 다음 기회 */ }
    try { await drainOutbox(3_000); } catch { /* 다음 기회 */ }
  })().finally(() => { running = null; });
  return running;
}
