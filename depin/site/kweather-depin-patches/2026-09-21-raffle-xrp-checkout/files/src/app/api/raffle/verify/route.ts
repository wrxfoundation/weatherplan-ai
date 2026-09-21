import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/ratelimit";
import { getVerifiedWallet } from "@/lib/auth/session";
import { verifyRaffleEntry, type RaffleMode } from "@/lib/raffle";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 결제 확정 - XRP 입금 해시로 응모를 PAID 처리하고 래플 NFT 발행을 큐에 넣는다. 재호출은 멱등. */
export async function POST(req: Request) {
  const limited = await guard(req, "raffle-verify", 30);
  if (limited) return NextResponse.json(limited.body, { status: limited.status });
  const body = z.object({ txHash: z.string().max(64), mode: z.enum(["prod", "test"]).optional() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const mode: RaffleMode = body.data.mode === "test" ? "test" : "prod";
  const wallet = await getVerifiedWallet();
  if (!wallet) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const origin = new URL(req.url).origin;
  try {
    const r = await verifyRaffleEntry(wallet, body.data.txHash, origin, mode);
    if (!r.ok) return NextResponse.json({ error: r.error, pending: r.pending ?? false }, { status: r.pending ? 202 : 400 });
    return NextResponse.json({ ok: true, entryNo: r.entry.entryNo, already: r.already });
  } catch (e) {
    /* 원장 조회·DB 오류 - 입금은 살아 있으므로 실패로 굳히지 않고 같은 해시로 다시 확인하게 안내한다(202) */
    console.error("raffle verify", (e as Error).message);
    return NextResponse.json({ error: "결제 확인 중 오류가 났습니다. 잠시 후 같은 해시로 다시 확인해 주세요.", pending: true }, { status: 202 });
  }
}
