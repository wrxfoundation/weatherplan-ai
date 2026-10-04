/* 내보내기 — 화면에서 걸러 둔 그대로 파일로 받는다.
   CSV 는 엑셀로 열어 보고용으로, JSON 은 나중에 다른 도구에 옮길 때 쓴다. */

import type { NextRequest } from "next/server";
import { listItems } from "@/lib/store";
import { applyFilters, toCsv } from "@/lib/filter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const KEY = process.env.ADMIN_KEY ?? "";
  if (!KEY || sp.get("k") !== KEY) return new Response("unauthorized", { status: 401 });

  const items = applyFilters(await listItems(), {
    status: sp.get("status") ?? "", topic: sp.get("topic") ?? "",
    kind: sp.get("kind") ?? "", sev: sp.get("sev") ?? "", q: sp.get("q") ?? "",
  });

  const d = new Date(Date.now() + 9 * 3600000);
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;

  if (sp.get("format") === "json") {
    return new Response(JSON.stringify(items, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="cs-${stamp}.json"`,
      },
    });
  }
  return new Response(toCsv(items), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cs-${stamp}.csv"`,
    },
  });
}
