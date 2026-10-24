import { NextRequest, NextResponse } from "next/server";
import { findTicket } from "@/lib/raffle";
import { prizeLabel } from "@/lib/raffle-prizes";

export const dynamic = "force-dynamic";

/** 래플 NFT 메타데이터 - 티켓 코드별. 이미지는 번호·QR 이 들어간 세로 카드(/api/raffle/card/<code>). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const entry = await findTicket(code);
  if (!entry) return NextResponse.json({ error: "unknown ticket" }, { status: 404 });
  const origin = new URL(req.url).origin;
  const no = String(entry.entryNo).padStart(4, "0");
  const test = entry.event.endsWith("-test");
  return NextResponse.json({
    name: `${test ? "[TEST] " : ""}Wellbian × XRP SEOUL 2026 Raffle Ticket #${no}`,
    description: "Raffle ticket for the Wellbian × XRP SEOUL 2026 event (Seoul, 3 October 2026), issued for a 5 XRP entry. Every confirmed entrant receives one prize; the blind draw decides which. Present the QR code at the venue to collect your prize. Valid once. Do not share or expose the QR code: prizes collected by others will not be compensated.",
    image: `${origin}/api/raffle/card/${entry.ticketCode}`,
    type: "raffle-ticket",
    cohort: "xrpseoul-2026",
    issuer: "Wellbian Labs",
    attributes: [
      { trait_type: "Ticket No.", value: no },
      { trait_type: "Event", value: "XRP SEOUL 2026" },
      { trait_type: "Date", value: "2026-10-03" },
      ...(entry.prize ? [{ trait_type: "Prize", value: prizeLabel(entry.prize, "en") }] : []),
    ],
  }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
