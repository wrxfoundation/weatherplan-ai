import { NextResponse } from "next/server";
import { MISSIONS } from "@/lib/data";

/* POST /api/waitlist/missions/[key] — 미션 완료 체크 (목, 자진 체크 포함) */
export async function POST(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const mission = MISSIONS.find((m) => m.key === key);
  if (!mission) return NextResponse.json({ error: "unknown_mission" }, { status: 404 });
  return NextResponse.json({ ok: true, key, tickets: mission.tickets, verify: mission.verify });
}
