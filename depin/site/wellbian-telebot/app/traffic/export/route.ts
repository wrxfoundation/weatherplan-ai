/* 유입 내려받기 — /traffic/export?t=daily|weekly|monthly|channels|sources|srcdaily|raw|content|campaigns|pages|all&f=csv|csv16|xlsx
   f=xlsx 는 표 전부를 시트로 담은 엑셀 파일(t 무시). f=csv16 은 UTF-16LE+탭 — BOM 을 무시하는 프로그램용.
   srcdaily(소스×일자)·raw(원자료, 9/26)는 GA 원자료(gaSourceDaily, 같은 5분 캐시)에서 나온다 — 엑셀·전체도 그것을 부른다.
   공개 화면(/traffic)과 같은 문을 쓴다 — TRAFFIC_PUBLIC=off 면 관리 키(쿠키 또는 ?k=)가 있어야 한다.
   데이터는 화면과 같은 5분 캐시 스냅샷이라 GA 를 더 부르지 않는다. */

import type { NextRequest } from "next/server";
import { gaTraffic, gaSourceDaily, trafficPublic } from "@/lib/ga";
import { isAuthed } from "@/lib/auth";
import { trafficCsv, trafficCsv16, trafficXlsx, isCsvTable, isExportFormat, needsRaw } from "@/lib/traffic-csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!trafficPublic() && !(await isAuthed(sp.get("k") ?? undefined))) return new Response("not found", { status: 404 });

  const t = sp.get("t");
  const table = isCsvTable(t) ? t : "all";
  const f = sp.get("f");
  const fmt = isExportFormat(f) ? f : "csv";
  const [snap, sd] = await Promise.all([gaTraffic(), needsRaw(table, fmt) ? gaSourceDaily() : undefined]);
  const busy = (msg: string) => new Response(msg, { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  if (snap.error) return busy("GA4 를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.");
  if (fmt !== "xlsx" && (table === "srcdaily" || table === "raw") && (!sd || sd.error)) return busy("GA4 원자료를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.");
  /* 파일명은 ASCII 만 — 한글 파일명은 브라우저마다 헤더 처리가 갈린다 */
  const send = (name: string, body: BodyInit, type: string) =>
    new Response(body, { headers: { "content-type": type, "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });

  if (fmt === "xlsx") {
    const { name, data } = trafficXlsx(snap, sd);
    return send(name, new Uint8Array(data), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  if (fmt === "csv16") {
    const { name, data } = trafficCsv16(snap, table, sd);
    return send(name, new Uint8Array(data), "text/csv; charset=utf-16le");
  }
  const { name, csv } = trafficCsv(snap, table, sd);
  return send(name, csv, "text/csv; charset=utf-8");
}
