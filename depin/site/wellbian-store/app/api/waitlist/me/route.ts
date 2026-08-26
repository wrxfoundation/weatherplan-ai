import { NextResponse } from "next/server";
import { MOCK_WAITLIST_ME } from "@/lib/data";

/* GET /api/waitlist/me — 내 대기 현황 (목) */
export async function GET() {
  return NextResponse.json(MOCK_WAITLIST_ME);
}
