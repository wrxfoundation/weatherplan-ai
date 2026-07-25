/* ============================================================
 * Pick AI · /api/scorecard
 *
 * 무료 진단 엔드포인트 — 파이프라인은 lib/scanner.js 공용 모듈 사용.
 * DB(Supabase)가 설정되어 있으면 결과 요약을 이력으로 저장한다
 * (실패해도 진단 응답에는 영향 없음).
 * ============================================================ */

import { sendFetchError } from "../../lib/netUtils.js";
import { performScan, scanToRow } from "../../lib/scanner.js";
import { insertScan } from "../../lib/db.js";

export const config = {
  api: { responseLimit: "4mb" },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let result;
  try {
    result = await performScan(req.body?.url);
  } catch (err) {
    if (err?.message === "BAD_URL") {
      return res.status(400).json({ error: "올바른 URL 형식이 아닙니다 — 예: https://example.co.kr" });
    }
    return sendFetchError(res, err);
  }

  /* 이력 저장 (best-effort) */
  await insertScan(scanToRow(result, { source: "web" }));

  return res.status(200).json({
    ok: true,
    ...result,
    scannedAt: new Date().toISOString(),
  });
}
