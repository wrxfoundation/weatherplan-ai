/* 내려받기 — /export?t=daily|weekly|monthly|channels|sources|srcusers|srcdaily|raw|content|campaigns|pages|all&f=csv|csv16|xlsx
   f=xlsx 는 표 전부를 시트로 담은 엑셀 파일(t 무시). f=csv16 은 UTF-16LE+탭 — BOM 을 무시하는 프로그램용.
   srcusers(소스×일자 사용자)·srcdaily(소스×일자 세션)·raw(원자료)는 gaSourceDaily, 나머지는 gaTraffic — 둘 다 화면과 같은 5분 캐시라 GA 를 더 부르지 않는다.
   잠가 둔 사이트(TRAFFIC_KEY)면 쿠키나 ?k= 가 있어야 한다 — 없으면 404. */
import type { NextRequest } from "next/server";
import { gaTraffic, gaSourceDaily } from "@/lib/ga";
import { passed } from "@/lib/gate";
import { trafficCsv, trafficCsv16, trafficXlsx, isCsvTable, isExportFormat, needsRaw } from "@/lib/traffic-csv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!(await passed(sp.get("k")))) return new Response("not found", { status: 404 });

  const t = sp.get("t");
  const table = isCsvTable(t) ? t : "all";
  const f = sp.get("f");
  const fmt = isExportFormat(f) ? f : "csv";
  /* 원자료 두 표만 받을 때는 개요 스냅샷이 실패해도 내보낸다 — 파일명 날짜만 거기서 빌린다 */
  const rawOnly = fmt !== "xlsx" && (table === "srcusers" || table === "srcdaily" || table === "raw");
  const [snap, sd] = await Promise.all([gaTraffic(), needsRaw(table, fmt) ? gaSourceDaily() : undefined]);
  const busy = (msg: string, why?: string) => {
    if (why) console.error("[export]", why);
    return new Response(msg, { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  };
  if (!rawOnly && snap.error) return busy("GA4 를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.", snap.error);
  if (rawOnly && (!sd || sd.error)) return busy("GA4 원자료를 읽을 수 없습니다. 잠시 뒤 다시 시도해 주세요.", sd?.error);

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
