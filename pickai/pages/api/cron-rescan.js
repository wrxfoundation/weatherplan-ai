/* ============================================================
 * Pick AI · /api/cron-rescan  (Vercel Cron — 주간 자동 재진단)
 *
 * vercel.json crons가 매주 월요일 09:00 KST(00:00 UTC)에 호출.
 * 환경변수:
 *   WATCH_HOSTS        감시 대상 호스트 목록 (쉼표 구분, 3~4개 권장)
 *   CRON_SECRET        설정 시 Vercel이 Authorization: Bearer로 전달 — 검증
 *   ALERT_WEBHOOK_URL  점수 변동 시 알림 보낼 웹훅 (Slack/Discord incoming)
 *
 * 동작: 각 호스트 재진단 → DB 이력 저장(source=cron) →
 *       직전 기록 대비 |Δ|≥5점, 등급 변화, 도달성 변화 시 웹훅 알림.
 * ============================================================ */

import { performScan, scanToRow } from "../../lib/scanner.js";
import { insertScan, getLatestScan, dbEnabled } from "../../lib/db.js";

async function notify(text) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return false;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  /* Vercel cron 인증 — CRON_SECRET이 설정된 경우에만 강제 */
  if (process.env.CRON_SECRET) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "unauthorized" });
    }
  }

  const hosts = String(process.env.WATCH_HOSTS || "")
    .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (hosts.length === 0) {
    return res.status(200).json({ ok: true, message: "WATCH_HOSTS 미설정 — 재진단 대상 없음" });
  }

  const results = [];
  const alerts = [];

  for (const host of hosts) {
    try {
      const prev = await getLatestScan(host);
      const result = await performScan(host);
      const r = result.report;
      await insertScan(scanToRow(result, { source: "cron" }));

      const entry = { host, overall: r.overall, grade: r.grade, status: result.target.status };
      results.push(entry);

      if (prev) {
        const delta = r.overall - prev.overall;
        const gradeChanged = r.grade !== prev.grade;
        const prevReachable = prev.http_status >= 200 && prev.http_status < 300;
        const nowReachable = result.target.status >= 200 && result.target.status < 300;
        const reachChanged = prevReachable !== nowReachable;
        if (Math.abs(delta) >= 5 || gradeChanged || reachChanged) {
          alerts.push(
            `• ${host}: ${prev.overall}점(${prev.grade}) → ${r.overall}점(${r.grade}) ` +
            `(${delta >= 0 ? "+" : ""}${delta})${reachChanged ? ` · 도달성 변화(HTTP ${prev.http_status}→${result.target.status})` : ""}`
          );
        }
      }
    } catch (e) {
      results.push({ host, error: String(e?.message || e).slice(0, 80) });
      alerts.push(`• ${host}: 진단 실패 — ${String(e?.message || e).slice(0, 80)}`);
    }
  }

  let notified = false;
  if (alerts.length > 0) {
    notified = await notify(
      `📊 Pick AI 주간 재진단 — 변동 감지 ${alerts.length}건\n${alerts.join("\n")}`
    );
  }

  return res.status(200).json({
    ok: true,
    scanned: results,
    alerts,
    notified,
    dbEnabled: dbEnabled(),
  });
}
