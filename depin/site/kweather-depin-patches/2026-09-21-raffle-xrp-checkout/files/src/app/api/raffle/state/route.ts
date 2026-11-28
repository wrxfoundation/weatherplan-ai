import { NextRequest, NextResponse } from "next/server";
import { getSessionWallet } from "@/lib/auth/session";
import { raffleState, type RaffleMode } from "@/lib/raffle";
import { nudgeRaffleOutbox } from "@/lib/raffle-keepalive";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** XRPL SEOUL 2026 래플 - 화면 상태 한 번에. ?mode=test 는 리허설(격리된 event·kind·설정).
 *  상태를 읽기 전에 아웃박스를 살짝 민다(인스턴스당 20초에 한 번) - 크론이 없는 배포에서도 NFT 발행→오퍼가 이어진다. */
export async function GET(req: NextRequest) {
  const mode: RaffleMode = req.nextUrl.searchParams.get("mode") === "test" ? "test" : "prod";
  await nudgeRaffleOutbox();
  const wallet = await getSessionWallet();
  return NextResponse.json(await raffleState(wallet, mode));
}
