/* ============================================================
 * Pick AI · /api/history
 *
 * GET ?host=example.com&overall=54
 * → { ok, enabled, history: [...], benchmark: { count, avg, topPct } }
 *
 * DB 미설정이면 { enabled: false } — UI는 추이·백분위 섹션을 숨긴다.
 * ============================================================ */

import { dbEnabled, getHistory, getBenchmarkStats } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!dbEnabled()) return res.status(200).json({ ok: true, enabled: false });

  const host = String(req.query.host || "").trim().toLowerCase().slice(0, 200);
  if (!host) return res.status(400).json({ error: "host 필수" });
  const overall = Number.isFinite(+req.query.overall) ? Math.round(+req.query.overall) : null;

  const [history, benchmark] = await Promise.all([
    getHistory(host, 20),
    getBenchmarkStats(overall),
  ]);

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    enabled: true,
    history: history || [],
    benchmark: benchmark || { count: 0 },
  });
}
