// 가족(가구) 목록 · 관리 (2026-11-12) — 관제 센터의 직원만.
//
//   GET    /api/families                         { center, role, canManage, families: [...] }
//          관제는 그 센터의 모든 가족(가입 코드 포함), 컨시어지는 자기가 주 · 부 담당인 가족만(가입 코드 없이).
//          가족마다 지금 상황 요약을 싣는다 — SOS · 도와줘요 · 승인 대기 수 (lib/family-summary.js). 화면이 가족을 고르는 칸과
//          '다른 가족에서 온 긴급'을 여기서 읽는다.
//   POST   /api/families  { label }              새 가족 + 가족 가입 코드 → { family }   (관제)
//   PATCH  /api/families  { id, action, label }  rename · code(가입 코드 새로) · delete(빈 가족만 · 센터 관리자)   (관제)
//
// 만든 것 · 바꾼 것은 권한 변경 기록(account_audit)과 그 센터 첫 가족의 활동 기록(관제 감사로그)에 남긴다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../lib/db";
import { CENTERS, centerOfHousehold, familyTitle } from "../../lib/centers";
import { activityLine, audit, memberStillValid } from "../../lib/members";
import { createFamily, deleteEmptyFamily, familyRow, forgetFamilyAccess, listFamilies, renameFamily, rotateFamilyCode } from "../../lib/families";
import { isCenterOwner } from "../../lib/test-accounts";
import { makeLimiter, sameSiteJson } from "../../lib/http";

const MAX_FAMILIES = 300; // 한 센터 — 실수로 끝없이 만드는 것을 막는다
const made = makeLimiter({ windowMs: 10 * 60 * 1000, max: 60 });
const WHY = {
  first: "첫 가족은 지울 수 없습니다",
  "has-members": "구성원이 있는 가족은 지울 수 없습니다 — 구성원을 다른 가족으로 옮기거나 계정을 지운 뒤에 지워 주세요",
  "has-records": "기록이 있는 가족은 지울 수 없습니다",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  const center = CENTERS[user.center];
  if (!center) return res.status(403).json({ error: "no-center" });
  if (user.role !== "ops" && user.role !== "concierge") return res.status(403).json({ error: "staff-only" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });

  try {
    const still = await memberStillValid(user);
    if (!still.ok) return res.status(401).json({ error: still.reason, area: still.area || null });
    const ops = user.role === "ops";
    const owner = ops && isCenterOwner(user.id, center.id);

    if (req.method === "GET") {
      const families = await listFamilies(center.id, user);
      return res.status(200).json({ center: { id: center.id, name: center.name }, role: user.role, canManage: ops, owner, families });
    }

    if (!ops) return res.status(403).json({ error: "ops-only" });
    if (!sameSiteJson(req)) return res.status(415).json({ error: "json-only" });

    if (req.method === "POST") {
      if (made(user.id)) return res.status(429).json({ error: "too-many" });
      const now = await listFamilies(center.id, user);
      if (now.length >= MAX_FAMILIES) return res.status(409).json({ error: "too-many-families" });
      const row = await createFamily(center.id, { label: req.body?.label, by: user.id });
      const title = familyTitle({ label: row.label });
      await audit({ center_id: center.id, account_id: null, actor_id: user.id, action: "family-add", before: null, after: { household: row.id, label: row.label || null } });
      await activityLine(center.household, user.id, user.role, "memberAdmin", `가족 추가 — ${title} (가족 가입 코드 발급)`);
      return res.status(201).json({ family: { id: row.id, first: false, label: row.label || null, title, code: row.join_code, elders: [], guardians: [], members: 0, pending: 0, saved: false } });
    }

    if (req.method === "PATCH") {
      const { id, action, label } = req.body || {};
      if (typeof id !== "string" || centerOfHousehold(id)?.id !== center.id || !["rename", "code", "delete"].includes(action)) return res.status(400).json({ error: "invalid-request" });
      const row = await familyRow(id);
      if (!row) return res.status(404).json({ error: "not-found" });
      const before = familyTitle({ label: row.label, first: centerOfHousehold(id)?.household === id });

      if (action === "rename") {
        const after = await renameFamily(id, label);
        await audit({ center_id: center.id, account_id: null, actor_id: user.id, action: "family-rename", before: { household: id, label: row.label || null }, after: { household: id, label: after?.label || null } });
        await activityLine(center.household, user.id, user.role, "memberAdmin", `가족 이름 바꿈 — ${before} → ${familyTitle({ label: after?.label, first: centerOfHousehold(id)?.household === id })}`);
        return res.status(200).json({ id, label: after?.label || null });
      }
      if (action === "code") {
        const after = await rotateFamilyCode(id);
        await audit({ center_id: center.id, account_id: null, actor_id: user.id, action: "family-code", before: null, after: { household: id } });
        await activityLine(center.household, user.id, user.role, "memberAdmin", `가족 가입 코드를 새로 만듦 — ${before} (옛 코드는 더 쓸 수 없음)`);
        return res.status(200).json({ id, code: after?.join_code || null });
      }
      // delete — 되돌릴 수 없어 센터 관리자만. 구성원 · 기록이 없는 가족만
      if (!owner) return res.status(403).json({ error: "owner-only", message: "가족 지우기는 센터 관리자만 할 수 있습니다" });
      const r = await deleteEmptyFamily(id);
      if (!r.ok) return res.status(409).json({ error: r.why, message: WHY[r.why] || "지울 수 없습니다" });
      forgetFamilyAccess();
      await audit({ center_id: center.id, account_id: null, actor_id: user.id, action: "family-delete", before: { household: id, label: row.label || null }, after: null });
      await activityLine(center.household, user.id, user.role, "memberAdmin", `빈 가족 지움 — ${before}`);
      return res.status(200).json({ deleted: id });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = e?.message === "code-failed" ? "code-failed" : dbErrorCode(e);
    console.error("[families]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
