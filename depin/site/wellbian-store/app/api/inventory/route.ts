import { NextResponse } from "next/server";
import { MOCK_INVENTORY, PRICE } from "@/lib/data";
import type { SalePhase } from "@/lib/data";

/* GET /api/inventory?phase=early_bird — 재고 목데이터 (PRD §7) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phase = (searchParams.get("phase") ?? "early_bird") as SalePhase;
  const inv = MOCK_INVENTORY[phase] ?? MOCK_INVENTORY.early_bird;
  return NextResponse.json({ phase, ...inv, price: PRICE });
}
