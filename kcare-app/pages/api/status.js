// 설정 상태 — 로그인 · 서버 저장이 켜졌는지만 알려 준다 (값·키·주소는 싣지 않는다).
// 로그인 화면과 배포 뒤 확인(DEPLOY.md)에서 쓴다. 베타 잠금 중에도 열려 있다.
import { googleConfigured, testLoginConfigured } from "../../lib/auth-server";
import { db, dbConfigured, dbErrorCode } from "../../lib/db";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const out = {
    login: { test: testLoginConfigured(), google: googleConfigured() },
    db: { configured: dbConfigured(), ok: false, error: null },
  };
  if (out.db.configured) {
    try {
      // 표가 다 있는지 한 번씩 두드려 본다 (행은 읽지 않는다)
      for (const table of ["households", "accounts", "activity", "signups", "payments"]) {
        const { error } = await db().from(table).select("*").limit(0);
        if (error) throw error;
      }
      out.db.ok = true;
    } catch (e) {
      out.db.error = dbErrorCode(e);
    }
  }
  return res.status(200).json(out);
}
