import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/ratelimit";
import { getVerifiedWallet } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createRaffleEntry, holdUntilOf, type RaffleMode } from "@/lib/raffle";
import { hotWalletAddress } from "@/lib/xrpl/outbox";

export const dynamic = "force-dynamic";

/** 응모 시작(예약) - 결제를 기다리는 응모 행(태그)을 만들고 입금 정보를 돌려준다. 계정당 1회, 이미 있으면 예약을 연장해 그 행.
 *  정원(확정 + 유효 예약)이 차면 409 {code:"SOLD_OUT"}. email 은 당첨 안내(초대권 발송) 연락처. */
export async function POST(req: Request) {
  const limited = await guard(req, "raffle-enter", 60);
  if (limited) return NextResponse.json(limited.body, { status: limited.status });
  const body = z.object({ mode: z.enum(["prod", "test"]).optional(), email: z.string().email().max(254).optional() }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  const mode: RaffleMode = body.data.mode === "test" ? "test" : "prod";
  const wallet = await getVerifiedWallet();
  if (!wallet) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const email = body.data.email?.trim().toLowerCase();
  const r = await createRaffleEntry(wallet, mode, email);
  if (!r.ok) return NextResponse.json({ error: r.error, code: r.code }, { status: 409 });
  /* 외부 지갑 로그인처럼 계정에 이메일이 없던 경우, 응모 때 적은 주소를 연락처로 남겨 다음부터 묻지 않는다(있으면 그대로) */
  if (email) { try { await prisma.accountContact.createMany({ data: [{ address: wallet, email }], skipDuplicates: true }); } catch { /* 연락처 저장 실패는 응모를 막지 않는다 */ } }
  return NextResponse.json({
    ok: true,
    entry: { status: r.entry.status, destTag: r.entry.destTag, entryNo: r.entry.entryNo, amountXrp: Number(r.entry.amountXrp), holdUntil: holdUntilOf(r.entry, r.config)?.toISOString() ?? null },
    destination: hotWalletAddress(),
    priceXrp: r.config.priceXrp,
  });
}
