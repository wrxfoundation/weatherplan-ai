import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";
import { getSessionWallet, getVerifiedWallet } from "@/lib/auth/session";

/**
 * Recovery/notice email for the account. Registration requires a
 * key-ownership-verified session; this is a contact channel, never an
 * authentication factor (an email can't move funds or change the account).
 */
export async function GET() {
  const wallet = await getSessionWallet();
  if (!wallet) return NextResponse.json({ error: "지갑을 먼저 연결해주세요" }, { status: 401 });
  const row = await prisma.accountContact.findUnique({ where: { address: wallet } });
  if (row) return NextResponse.json({ email: row.email, source: "contact" });
  /* 연락처가 없으면 로그인 계정(Google·이메일 = SocialAccount.handle)의 주소를 돌려준다.
     외부 지갑(Xaman·D'CENT·Girin) 로그인은 둘 다 없어 null - 래플 응모 때 이메일을 묻는다(2026-09-22 결정). */
  const social = await prisma.socialAccount.findFirst({ where: { address: wallet, handle: { not: null } }, select: { handle: true, provider: true } });
  const login = social?.handle && social.handle.includes("@") ? social.handle : null;
  return NextResponse.json({ email: login, source: login ? "login" : null, provider: login ? social?.provider ?? null : null });
}

export async function POST(req: Request) {
  const limited = await guard(req, "contact", 5);
  if (limited) return NextResponse.json(limited.body, { status: limited.status });

  const wallet = await getVerifiedWallet();
  if (!wallet) {
    return NextResponse.json({ error: "서명 인증된 세션이 필요합니다 - 지갑을 다시 연결해주세요" }, { status: 401 });
  }
  const body = z
    .object({ email: z.string().email().max(254) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다" }, { status: 400 });

  await prisma.accountContact.upsert({
    where: { address: wallet },
    create: { address: wallet, email: body.data.email },
    update: { email: body.data.email, updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true, email: body.data.email });
}

export async function DELETE() {
  const wallet = await getVerifiedWallet();
  if (!wallet) {
    return NextResponse.json({ error: "서명 인증된 세션이 필요합니다 - 지갑을 다시 연결해주세요" }, { status: 401 });
  }
  await prisma.accountContact.deleteMany({ where: { address: wallet } });
  return NextResponse.json({ ok: true });
}
