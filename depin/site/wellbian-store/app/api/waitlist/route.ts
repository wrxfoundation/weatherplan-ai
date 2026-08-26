import { NextResponse } from "next/server";

/* POST /api/waitlist — 2차 대기 등록 (목). body: { email, wallet?, invite? } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body?.email || typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }
  return NextResponse.json({ queueNo: 12848, tickets: 10, score: 100, emailSent: true });
}
