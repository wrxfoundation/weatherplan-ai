/* 유입 CSV 내려받기 — /traffic/export?t=daily|weekly|monthly|channels|sources|content|campaigns|pages|all
   공개 화면(/traffic)과 같은 문을 쓴다 — TRAFFIC_PUBLIC=off 면 관리 키(쿠키 또는 ?k=)가 있어야 한다.
   데이터는 화면과 같은 5분 캐시 스냅샷이라 GA 를 더 부르지 않는다. */

import type { NextRequest } from "next/server";
import { gaTraffic, trafficPublic } from "@/lib/ga";
import { isAuthed } from "@/lib/auth";
import { trafficCsv, isCsvTable } from "@/lib/traffic-csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!trafficPublic() && !(await isAuthed(sp.get("k") ?? undefined))) return new Response("not found", { status: 404 });

  const t = sp.get("t");
  const snap = await gaTraffic();
  if (snap.error) return new Response("GA4 를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });

  const { name, csv } = trafficCsv(snap, isCsvTable(t) ? t : "all");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
