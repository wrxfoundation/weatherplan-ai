/* 설정이 제대로 붙었는지 눈으로 보는 자리. 토큰·시크릿은 값이 아니라 "있다/없다"만 말한다.
   웹훅이 안 될 때 원인이 대개 셋 중 하나다 — 환경변수 미설정, Redeploy 안 함, 정본 주소 오타. */
import { cacheInfo } from "@/lib/faq-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = cacheInfo();
  return Response.json({
    ok: true,
    token: Boolean(process.env.TG_BOT_TOKEN),
    secret: Boolean(process.env.TG_WEBHOOK_SECRET),
    group: process.env.TG_GROUP || null,
    faqSource: info.configured,
    faqCached: info.cached,
    faqAgeSec: info.ageSec,
    faqEntries: info.entries,
  }, { headers: { "cache-control": "no-store" } });
}
