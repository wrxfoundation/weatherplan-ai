// 감사로그용 활동 기록 읽기 — 로그인한 계정의 가구 기록만, 최근 순 (2026-10-02 관제 감사로그 연동).
// 한 줄 요약(summary)만 보낸다 — 동작 내용(payload)에는 연락처 · 주소가 들어 있을 수 있어 화면으로 내보내지 않는다.
// 베타는 테스트 가구 하나를 모든 테스트 계정이 같이 쓰므로 역할로 막지 않는다.
// 운영에서는 계정·권한(관제사 이상)으로 열람을 제한하고, 열람 자체도 감사로그에 남긴다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { db, dbConfigured, dbErrorCode } from "../../lib/db";

const MAX_ROWS = 500;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });

  const limit = Math.min(MAX_ROWS, Math.max(1, Number(req.query.limit) || 300));
  try {
    const { data, error, status } = await db()
      .from("activity")
      .select("id, created_at, client_at, account_id, role, type, summary")
      .eq("household_id", user.household)
      .order("id", { ascending: false })
      .limit(limit);
    if (error) {
      const code = dbErrorCode(error, status);
      return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
    }
    return res.status(200).json({ household: user.household, rows: data || [] });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[activity]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
