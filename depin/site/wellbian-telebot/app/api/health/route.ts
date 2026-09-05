/* 설정이 제대로 붙었는지 눈으로 보는 자리. 토큰·시크릿은 값이 아니라 "있다/없다"만 말한다.
   웹훅이 안 될 때 원인이 대개 셋 중 하나다 — 환경변수 미설정, Redeploy 안 함, 정본 주소 오타. */
import { cacheInfo } from "@/lib/faq-client";
import { storeKind, storeProbe } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const info = cacheInfo();
  /* 환경변수 유무(store)와 실제 쓰기 가능 여부(storeProbe)는 다른 이야기다 */
  const probe = await storeProbe();
  return Response.json({
    ok: true,
    token: Boolean(process.env.TG_BOT_TOKEN),
    secret: Boolean(process.env.TG_WEBHOOK_SECRET),
    group: process.env.TG_GROUP || null,
    csInbox: Boolean(process.env.TG_CS_CHAT),
    /* 이 줄이 응답에 있으면 그룹 대화를 지켜보는 코드가 올라간 것이다.
       "설정은 맞는데 안 잡힌다" 가 배포 문제인지 텔레그램 쪽 문제인지 여기서 갈린다. */
    watchGroup: true,
    store: storeKind(),
    /* ok:true 여야 저장이 실제로 되는 것이다.
       note — ok / memory / readback_mismatch / "kv 401"(토큰) / "kv 404"(URL) */
    storeProbe: probe,
    admin: Boolean(process.env.ADMIN_KEY),
    faqSource: info.configured,
    faqBypass: info.bypass,
    faqCached: info.cached,
    faqAgeSec: info.ageSec,
    faqEntries: info.entries,
    /* 마지막 정본 읽기 시도 — note 가 원인을 바로 말해준다:
       not_found_deploy_the_site / blocked_check_deployment_protection /
       network_or_bad_response / unexpected_shape / no_source_url / ok */
    faqLast: info.last,
  }, { headers: { "cache-control": "no-store" } });
}
