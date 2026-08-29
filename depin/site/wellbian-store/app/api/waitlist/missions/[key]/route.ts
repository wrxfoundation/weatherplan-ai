import { NextResponse } from "next/server";
import { MISSIONS, WAITLIST_ENABLED } from "@/lib/data";

/* POST /api/waitlist/missions/[key] — 미션 완료 체크 (목). 8/29: 화면과 같은 플래그를 따른다. */
export async function POST(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!WAITLIST_ENABLED) return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { key } = await params;
  const mission = MISSIONS.find((m) => m.key === key);
  if (!mission) return NextResponse.json({ error: "unknown_mission" }, { status: 404 });
  return NextResponse.json({ ok: true, key, tickets: mission.tickets, verify: mission.verify });
}
