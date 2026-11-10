import { NextResponse } from "next/server";
import { MOCK_ORDER } from "@/lib/data";

/* GET /api/orders/[id] — 주문 조회 (목) */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ ...MOCK_ORDER, id: decodeURIComponent(id) });
}
