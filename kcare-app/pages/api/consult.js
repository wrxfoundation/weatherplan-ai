// 상담 신청 (2026-11-06 랜딩 요청 5-4)
//
//   POST   /api/consult  { name, phone, who, agree, ref? }   로그인 없이 — 접수 저장 → { ok: true }
//   GET    /api/consult                                       센터 관제만 — { consults: [...], fresh: 새 접수 수 }
//   PATCH  /api/consult  { id, status }                       센터 관제만 — 처리 상태 (new · contacted · done)
//
// 이름 · 연락처가 쌓이는 표라 읽고 바꾸는 것은 센터 관제(ops1 · ops2 · ops3 또는 승인된 관제 회원)만 한다.
// 테스터 공용 비밀번호로 들어오는 테스트 관제(test-ops)에게는 보이지 않는다.
// 접수는 누구나 보낼 수 있으므로: JSON · 같은 사이트 요청만 · 같은 곳에서 10분에 5번까지 · 사람 눈에 안 보이는 칸(website)이
// 채워져 있으면 받은 척만 한다 · 같은 연락처의 새 접수가 있으면 새로 쌓지 않는다 (lib/consults.js).
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { db, dbConfigured, dbErrorCode } from "../../lib/db";
import { CENTERS } from "../../lib/centers";
import { CONSULT_STATUS, addConsult, checkConsult, consultView, listConsults, setConsultStatus } from "../../lib/consults";
import { clientIp, makeLimiter, sameSiteJson } from "../../lib/http";

const tooMany = makeLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

async function opsUser(req, res) {
  if (!authConfigured()) return { code: 401, error: "login-required" };
  const user = (await getServerSession(req, res, authOptions))?.user;
  if (!user?.household) return { code: 401, error: "login-required" };
  if (user.role !== "ops") return { code: 403, error: "ops-only" };
  if (!CENTERS[user.center]) return { code: 403, error: "no-center" };
  return { user };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") {
      if (!sameSiteJson(req)) return res.status(400).json({ error: "json-only" });
      const body = req.body && typeof req.body === "object" ? req.body : {};
      // 사람은 못 보는 칸 — 채워져 있으면 자동 등록기다. 받은 척만 하고 쌓지 않는다
      if (typeof body.website === "string" && body.website.trim()) return res.status(200).json({ ok: true });
      const { fields, value } = checkConsult(body);
      if (Object.keys(fields).length) return res.status(400).json({ error: "invalid", fields });
      if (tooMany(clientIp(req))) return res.status(429).json({ error: "too-many" });
      if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });
      await addConsult(db(), value);
      // 겹친 접수인지는 돌려주지 않는다 — 그 번호로 이미 신청이 있었는지를 남이 알아낼 수 없게
      return res.status(200).json({ ok: true });
    }

    if (req.method === "GET" || req.method === "PATCH") {
      const who = await opsUser(req, res);
      if (who.error) return res.status(who.code).json({ error: who.error });
      if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });
      if (req.method === "PATCH") {
        if (!sameSiteJson(req)) return res.status(400).json({ error: "json-only" });
        const { id, status } = req.body || {};
        const n = Number(id);
        if (!Number.isSafeInteger(n) || n <= 0 || !Object.prototype.hasOwnProperty.call(CONSULT_STATUS, status)) {
          return res.status(400).json({ error: "invalid" });
        }
        const r = await setConsultStatus(db(), n, status, who.user.name || who.user.id);
        if (r.error) return res.status(r.error === "not-found" ? 404 : 409).json({ error: r.error });
      }
      const rows = await listConsults(db());
      return res.status(200).json({ consults: rows.map(consultView), fresh: rows.filter((r) => r.status === "new").length });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    // 키 · 주소는 싣지 않는다 — 짧은 코드만
    const code = dbErrorCode(e) || "db-error";
    return res.status(code === "schema-missing" ? 503 : 500).json({ error: code });
  }
}
