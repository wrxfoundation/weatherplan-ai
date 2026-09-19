import { NextResponse } from "next/server";
import { MOCK_WAITLIST_ME, WAITLIST_ENABLED } from "@/lib/data";

/* GET /api/waitlist/me — 내 대기 현황 (목). 8/29: 화면과 같은 플래그를 따른다. */
export async function GET() {
  if (!WAITLIST_ENABLED) return NextResponse.json({ error: "not_available" }, { status: 404 });
  return NextResponse.json(MOCK_WAITLIST_ME);
}
