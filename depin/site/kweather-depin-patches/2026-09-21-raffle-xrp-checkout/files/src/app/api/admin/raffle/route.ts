import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkAdminSecret } from "@/lib/auth/session";
import { findTicket, redeemTicket, assignPrizes, raffleEvent, inferRaffleMode, loadRaffleConfig, holdMsOf } from "@/lib/raffle";

export const dynamic = "force-dynamic";

/**
 * 래플 운영 (관리자 시크릿).
 *  GET  ?code=WBR-0001-…     티켓 조회(수령 처리 없음) - 스캐너가 먼저 보여 주는 용도
 *  GET  ?mode=prod|test      응모 목록·집계
 *  POST {code, staff?}        현장 수령 처리 - 한 번만. 두 번째부터는 언제 이미 썼는지 돌려준다
 *  PUT  {drawId, mode?}       공개된 블라인드 추첨 결과(지갑 순서)로 경품 배정 - 전원 하나씩. mode 없으면 전원이 속한 장부를 찾는다
 */
export async function GET(req: NextRequest) {
  if (!checkAdminSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = req.nextUrl.searchParams;
  const code = q.get("code");
  if (code) {
    const e = await findTicket(code);
    if (!e) return NextResponse.json({ error: "유효하지 않은 티켓입니다." }, { status: 404 });
    return NextResponse.json({ ok: true, ticket: view(e) });
  }
  const mode = q.get("mode") === "test" ? "test" : "prod";
  const rows = await prisma.raffleEntry.findMany({ where: { event: raffleEvent(mode) }, orderBy: [{ entryNo: "asc" }, { createdAt: "desc" }] });
  const paid = rows.filter((r) => r.status === "PAID");
  const config = await loadRaffleConfig(mode);
  const holds = rows.filter((r) => r.status === "PENDING" && r.createdAt.getTime() > Date.now() - holdMsOf(config)).length;
  /* 당첨 안내 이메일(초대권 발송) - 계정 연락처, 없으면 이메일 로그인 계정의 주소 */
  const wallets = rows.map((r) => r.wallet);
  const [contacts, socials] = await Promise.all([
    prisma.accountContact.findMany({ where: { address: { in: wallets } }, select: { address: true, email: true } }),
    prisma.socialAccount.findMany({ where: { address: { in: wallets }, provider: "email" }, select: { address: true, handle: true } }),
  ]);
  const emailOf = new Map<string, string>();
  for (const s of socials) if (s.address && s.handle) emailOf.set(s.address, s.handle);
  for (const c of contacts) emailOf.set(c.address, c.email);
  return NextResponse.json({
    ok: true, mode,
    summary: { total: rows.length, paid: paid.length, holds, overflow: rows.filter((r) => r.status === "OVERFLOW").length,
      redeemed: paid.filter((r) => r.redeemedAt).length, assigned: paid.filter((r) => r.prize).length,
      byPrize: Object.entries(paid.reduce<Record<string, number>>((m, r) => { if (r.prize) m[r.prize] = (m[r.prize] ?? 0) + 1; return m; }, {})) },
    entries: rows.map((r) => ({ ...view(r), email: emailOf.get(r.wallet) ?? null })),
  });
}

export async function POST(req: NextRequest) {
  if (!checkAdminSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = z.object({ code: z.string().max(40), staff: z.string().max(60).optional() }).safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const r = await redeemTicket(b.data.code, b.data.staff || "scanner");
  if (!r.ok) return NextResponse.json({ error: r.error, ticket: r.entry ? view(r.entry) : null }, { status: r.entry ? 409 : 404 });
  return NextResponse.json({ ok: true, ticket: view(r.entry) });
}

export async function PUT(req: NextRequest) {
  if (!checkAdminSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = z.object({ drawId: z.string(), mode: z.enum(["prod", "test"]).optional() }).safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  const d = await prisma.blindDraw.findUnique({ where: { id: b.data.drawId } });
  if (!d || d.status !== "REVEALED") return NextResponse.json({ error: "공개(리빌)된 추첨이 아닙니다." }, { status: 409 });
  /* computeDraw 의 result.ordered 는 지갑 문자열 배열이다(예전 코드는 {id} 객체로 읽어 전부 undefined 가 됐다 - 2026-09-21 점검에서 수정).
     혹시 다른 형태로 저장된 결과도 받을 수 있게 둘 다 읽는다. */
  const raw = ((d.result as { ordered?: unknown[] } | null)?.ordered ?? []);
  const ordered = raw.map((x) => (typeof x === "string" ? x : (x as { id?: string })?.id ?? "")).filter(Boolean);
  if (!ordered.length) return NextResponse.json({ error: "추첨 결과에 참가자 순서가 없습니다." }, { status: 409 });
  /* 어느 장부(실제/리허설)인지 - 요청이 지정하면 그것, 아니면 전원이 결제 확정된 장부를 찾는다(첫 지갑 하나로 판단하지 않는다:
     리허설과 실제 양쪽에 응모한 팀 지갑이 첫 자리에 오면 엉뚱한 장부로 갈 수 있다) */
  const mode = b.data.mode ?? (await inferRaffleMode(ordered));
  if (!mode) return NextResponse.json({ error: "추첨 참가자 전원이 한 장부(실제 또는 리허설)의 결제 확정 응모자가 아닙니다." }, { status: 409 });
  const inMode = await prisma.raffleEntry.count({ where: { event: raffleEvent(mode), status: "PAID", wallet: { in: ordered } } });
  if (inMode !== ordered.length) return NextResponse.json({ error: `참가자 ${ordered.length}명 중 ${inMode}명만 ${mode} 장부의 결제 확정 응모자입니다.` }, { status: 409 });
  const r = await assignPrizes(mode, ordered);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json({ ok: true, assigned: r.assigned, total: r.total, byPrize: r.byPrize, mode: r.mode });
}

function view(e: { id: string; event: string; wallet: string; status: string; entryNo: number | null; ticketCode: string | null; prize: string | null; redeemedAt: Date | null; redeemedBy: string | null; paidAt: Date | null; txHash: string | null; amountXrp: unknown; createdAt: Date }) {
  return { id: e.id, event: e.event, wallet: e.wallet, status: e.status, entryNo: e.entryNo, ticketCode: e.ticketCode, prize: e.prize,
    redeemedAt: e.redeemedAt?.toISOString() ?? null, redeemedBy: e.redeemedBy, paidAt: e.paidAt?.toISOString() ?? null, txHash: e.txHash, amountXrp: Number(e.amountXrp), createdAt: e.createdAt.toISOString() };
}
