// 자녀 초대 링크 만들기 (2026-10-14) — 관제 센터에 회원으로 가입한 어르신 · 보호자만.
//
//   POST /api/invite   → { url, exp, uses }   (7일 · 링크 하나로 5명까지 · 가입해도 관제 승인 뒤 로그인)
//
// 어느 센터의 초대인지는 로그인 세션에서만 정한다 — 요청 본문의 값은 믿지 않는다. 링크 주소는 이 요청이 들어온
// 주소 그대로(배포 주소 · 미리보기 주소)로 만든다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../lib/db";
import { audit, memberStillValid } from "../../lib/members";
import { CENTERS } from "../../lib/centers";
import { INVITE_MAX_USES, inviteConfigured, makeInvite } from "../../lib/invite";
import { makeLimiter, sameSiteJson } from "../../lib/http";

const made = makeLimiter({ windowMs: 60 * 60 * 1000, max: 20 }); // 한 계정이 한 시간에 20개까지

function origin(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || (/^localhost(:\d+)?$/.test(host) ? "http" : "https");
  if (host && /^[A-Za-z0-9.-]+(:\d+)?$/.test(host)) return `${proto}://${host}`;
  return (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  if (!authConfigured() || !inviteConfigured()) return res.status(401).json({ error: "login-required" });
  if (!sameSiteJson(req)) return res.status(415).json({ error: "json-only" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  // 관제 센터 회원(가입 코드로 가입한 어르신 · 보호자)만 — 테스트 계정 가구는 센터가 아니라 초대할 곳이 없다
  if (user.provider !== "member" || !CENTERS[user.center] || !["elder", "guardian"].includes(user.role)) {
    return res.status(403).json({ error: "not-member" });
  }
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });
  try {
    const still = await memberStillValid(user);
    if (!still.ok) return res.status(401).json({ error: still.reason });
    if (made(String(user.id))) return res.status(429).json({ error: "too-many" });
    const { token, exp, jti } = makeInvite({ center: user.center, from: user.id, fromName: user.name, fromRole: user.role });
    // 누가 언제 초대 링크를 만들었는지 — 관제 '권한 변경 기록'에 남는다 (실패해도 링크는 준다)
    await audit({ center_id: user.center, account_id: user.id, actor_id: user.id, action: "invite", before: null, after: { jti, exp, uses: INVITE_MAX_USES } });
    return res.status(201).json({ url: `${origin(req)}/join?invite=${token}`, exp, uses: INVITE_MAX_USES });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[invite]", code);
    return res.status(502).json({ error: code || "invite-failed" });
  }
}
