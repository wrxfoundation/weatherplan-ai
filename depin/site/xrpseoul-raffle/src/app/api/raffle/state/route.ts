import { NextResponse } from "next/server";
import { localRaffleState } from "@/lib/raffle-config";

export const dynamic = "force-dynamic";

/** 단독 앱의 상태 - DB 없이 시간만으로 계산한다(참여 현황 0). 정본에서는 lib/raffle.ts 의 raffleState() 가 같은 모양을 돌려준다. */
export async function GET() {
  return NextResponse.json(localRaffleState(), { headers: { "Cache-Control": "no-store" } });
}
