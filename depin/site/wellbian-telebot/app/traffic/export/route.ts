/* 유입 내려받기 — /traffic/export?t=daily|weekly|monthly|channels|sources|content|campaigns|pages|all&f=csv|csv16|xlsx
   f=xlsx 는 표 전부를 시트로 담은 엑셀 파일(t 무시). f=csv16 은 UTF-16LE+탭 — BOM 을 무시하는 프로그램용.
   공개 화면(/traffic)과 같은 문을 쓴다 — TRAFFIC_PUBLIC=off 면 관리 키(쿠키 또는 ?k=)가 있어야 한다.
   데이터는 화면과 같은 5분 캐시 스냅샷이라 GA 를 더 부르지 않는다. */

import type { NextRequest } from "next/server";
import { gaTraffic, trafficPublic } from "@/lib/ga";
import { isAuthed } from "@/lib/auth";
import { trafficCsv, trafficCsv16, trafficXlsx, isCsvTable, isExportFormat } from "@/lib/traffic-csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!trafficPublic() && !(await isAuthed(sp.get("k") ?? undefined))) return new Response("not found", { status: 404 });

  const t = sp.get("t");
  const snap = await gaTraffic();
  if (snap.error) return new Response("GA4 를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });

  const table = isCsvTable(t) ? t : "all";
  const f = sp.get("f");
  const fmt = isExportFormat(f) ? f : "csv";
  /* 파일명은 ASCII 만 — 한글 파일명은 브라우저마다 헤더 처리가 갈린다 */
  const send = (name: string, body: BodyInit, type: string) =>
    new Response(body, { headers: { "content-type": type, "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });

  if (fmt === "xlsx") {
    const { name, data } = trafficXlsx(snap);
    return send(name, new Uint8Array(data), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  if (fmt === "csv16") {
    const { name, data } = trafficCsv16(snap, table);
    return send(name, new Uint8Array(data), "text/csv; charset=utf-16le");
  }
  const { name, csv } = trafficCsv(snap, table);
  return send(name, csv, "text/csv; charset=utf-8");
}
