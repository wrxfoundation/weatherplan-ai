import { NextResponse } from "next/server";
import { MOCK_ORDER } from "@/lib/data";

/* POST /api/checkout/confirm — 서명 확인 → 주문 확정 (목). body: { holdId, txHash } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    orderId: MOCK_ORDER.id,
    genesisNos: MOCK_ORDER.genesisNos,
    txHash: body?.txHash ?? MOCK_ORDER.txHash,
    status: "paid",
    /* 지갑 주소 = 구매 증명 — 배송 접수 폼에서 이 주소+성함·연락처·배송지만 접수, 배송 후 파기 */
    wallet: MOCK_ORDER.wallet,
  });
}
