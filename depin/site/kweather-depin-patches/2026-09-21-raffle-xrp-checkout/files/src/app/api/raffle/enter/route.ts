import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/ratelimit";
import { getVerifiedWallet } from "@/lib/auth/session";
import { createRaffleEntry, type RaffleMode } from "@/lib/raffle";
import { hotWalletAddress } from "@/lib/xrpl/outbox";

export const dynamic = "force-dynamic";

/** 응모 시작 - 결제를 기다리는 응모 행(태그)을 만들고 입금 정보를 돌려준다. 계정당 1회, 이미 있으면 그 행. */
export async function POST(req: Request) {
  const limited = await guard(req, "raffle-enter", 60);
  if (limited) return NextResponse.json(limited.body, { status: limited.status });
  const body = z.object({ mode: z.enum(["prod", "test"]).optional() }).safeParse(await req.json().catch(() => ({})));
  const mode: RaffleMode = body.success && body.data.mode === "test" ? "test" : "prod";
  const wallet = await getVerifiedWallet();
  if (!wallet) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const r = await createRaffleEntry(wallet, mode);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({
    ok: true,
    entry: { status: r.entry.status, destTag: r.entry.destTag, entryNo: r.entry.entryNo, amountXrp: Number(r.entry.amountXrp) },
    destination: hotWalletAddress(),
    priceXrp: r.config.priceXrp,
  });
}
