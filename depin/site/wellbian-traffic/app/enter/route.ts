/* 키 확인 → 쿠키 → 원래 화면으로 (TRAFFIC_KEY 가 있을 때만 쓰인다 — lib/gate.ts)
   GET  /enter?k=…&next=/sources  — 키가 붙은 주소로 들어온 경우(건네받은 링크)
   POST /enter (k, next)          — 잠금 화면에서 넣은 경우 */
import type { NextRequest } from "next/server";
import { COOKIE, cookieValue, gated, keyOk, safeNext } from "@/lib/gate";

export const dynamic = "force-dynamic";

const go = (req: NextRequest, k: string | null, next: string | null) => {
  const to = safeNext(next);
  if (!gated()) return Response.redirect(new URL(to, req.url), 303);
  if (!keyOk(k)) {
    const u = new URL(to, req.url);
    u.searchParams.set("e", "1");
    return Response.redirect(u, 303);
  }
  const res = new Response(null, { status: 303, headers: { location: new URL(to, req.url).toString() } });
  /* 로컬은 http 라 secure 를 켜면 쿠키가 아예 안 걸린다 */
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.headers.append("set-cookie", `${COOKIE}=${cookieValue()}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax${secure}`);
  return res;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return go(req, sp.get("k"), sp.get("next"));
}

export async function POST(req: NextRequest) {
  const f = await req.formData();
  return go(req, String(f.get("k") ?? ""), String(f.get("next") ?? "/"));
}
