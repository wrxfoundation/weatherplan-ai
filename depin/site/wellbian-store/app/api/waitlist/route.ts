import { NextResponse } from "next/server";
import { WAITLIST_ENABLED } from "@/lib/data";

/* POST /api/waitlist — 2차 대기 등록 (목). body: { email, wallet?, invite? }
   8/29: 화면(app/waitlist/**)은 WAITLIST_ENABLED=false 로 "/" 로 리다이렉트되는데
   이 API 는 열려 있어서, 폐기된 응모권·순번점수 제도가 여전히 도는 것처럼 보였다
   (응답이 queueNo·tickets·score 를 돌려줬다). 화면과 같은 플래그를 따르게 한다. */
export async function POST(request: Request) {
  if (!WAITLIST_ENABLED) return NextResponse.json({ error: "not_available" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  if (!body?.email || typeof body.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }
  return NextResponse.json({ queueNo: 12848, tickets: 10, score: 100, emailSent: true });
}
