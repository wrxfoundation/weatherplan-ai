/* ============================================================
 * Pick AI · /api/benchmark-run  (관리자 전용)
 *
 * 벤치마크 축적용 — 국내 기업 사이트를 파이프라인으로 진단해
 * is_benchmark=true 행으로 저장한다.
 *
 * 사용:
 *   curl -X POST https://<배포도메인>/api/benchmark-run \
 *     -H "Content-Type: application/json" \
 *     -H "x-admin-token: $ADMIN_TOKEN" \
 *     -d '{"url":"samsung.com","company":"삼성전자","industry":"전자·반도체"}'
 *
 * 보호: 환경변수 ADMIN_TOKEN 과 일치하는 x-admin-token 헤더 필수.
 * ============================================================ */

import { sendFetchError } from "../../lib/netUtils.js";
import { performScan, scanToRow } from "../../lib/scanner.js";
import { dbEnabled, insertScan } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.ADMIN_TOKEN) {
    return res.status(503).json({ error: "ADMIN_TOKEN이 설정되지 않아 벤치마크 축적이 비활성입니다" });
  }
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!dbEnabled()) {
    return res.status(503).json({ error: "SUPABASE_URL/SUPABASE_ANON_KEY가 설정되지 않았습니다" });
  }

  const { url, company, industry } = req.body || {};

  let result;
  try {
    result = await performScan(url);
  } catch (err) {
    if (err?.message === "BAD_URL") return res.status(400).json({ error: "올바른 URL 형식이 아닙니다" });
    return sendFetchError(res, err);
  }

  const saved = await insertScan(scanToRow(result, {
    isBenchmark: true,
    company: company ? String(company).slice(0, 100) : null,
    industry: industry ? String(industry).slice(0, 100) : null,
    source: "benchmark",
  }));

  return res.status(200).json({
    ok: true,
    saved,
    host: result.target.inputHost,
    finalHost: result.target.host,
    status: result.target.status,
    overall: result.report.overall,
    grade: result.report.grade,
    areas: {
      seo: result.report.areas.seo.score,
      aeo: result.report.areas.aeo.score,
      geo: result.report.areas.geo.score,
      reach: result.report.areas.reach.score,
    },
  });
}
