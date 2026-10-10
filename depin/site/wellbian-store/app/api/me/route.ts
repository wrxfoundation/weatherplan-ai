import { NextResponse } from "next/server";
import { MOCK_DEVICE, MOCK_ORDER } from "@/lib/data";

/* GET /api/me — 주문 · 기기 · 계정 요약 (목) */
export async function GET() {
  return NextResponse.json({
    wallet: "rWLB9…kQ2f",
    email: "you@example.com",
    orders: [MOCK_ORDER],
    devices: [MOCK_DEVICE],
  });
}
