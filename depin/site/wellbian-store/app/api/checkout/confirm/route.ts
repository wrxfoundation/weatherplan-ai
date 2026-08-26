import { NextResponse } from "next/server";
import { MOCK_ORDER } from "@/lib/data";

/* POST /api/checkout/confirm — 서명 확인 → 주문 확정 (목). body: { holdId, txHash } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    orderId: MOCK_ORDER.id,
    genesisNo: MOCK_ORDER.genesisNo,
    txHash: body?.txHash ?? MOCK_ORDER.txHash,
    status: "paid",
  });
}
