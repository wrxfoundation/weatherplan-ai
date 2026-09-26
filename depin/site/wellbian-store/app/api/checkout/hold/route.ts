import { NextResponse } from "next/server";

/* POST /api/checkout/hold — 수량 홀드 20분 (목). body: { qty } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const qty = Math.max(1, Number(body?.qty) || 1);
  return NextResponse.json({
    holdId: `HOLD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    qty,
    expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  });
}
