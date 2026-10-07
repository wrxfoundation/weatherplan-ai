// 관제 센터 회원 · 권한 (2026-10-06) — 그 센터 관제(ops)만. 다른 센터 회원은 보이지도 바뀌지도 않는다.
//
//   GET    /api/members                    { center: { id, name, joinCode }, members: [...], audit: [...] }
//   PATCH  /api/members  { id, action, role }
//          action: approve(role 선택) · reject · role(role) · suspend · activate
//   POST   /api/members  { action: "rotate-code" }   가입 코드 바꾸기 → { joinCode } (옛 코드는 바로 막힌다)
//
// 바꾼 것은 account_audit 에 남기고 센터 가구 활동 기록(관제 감사로그)에도 한 줄 남긴다.
// 자기 자신은 바꿀 수 없다 (실수로 자기 권한을 잃지 않게). 테스트 계정(비밀번호 해시가 없는 계정)도 바꾸지 않는다.
// 관제 역할을 주거나 빼는 일 · 관제 회원의 정지 · 다시 사용은 센터 관리자(ops1~3)만 한다 (2026-10-06 점검:
// 관제 회원 한 명이 관제 계정을 계속 만들거나 다른 관제를 모두 정지시킬 수 있었다).
// 역할 · 정지는 상대가 다음에 서버를 부를 때(15초 안) 적용된다 — 역할이 바뀌면 다시 로그인해야 한다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../lib/db";
import { ALL_ROLES, CENTERS, areaOfRole } from "../../lib/centers";
import { activityLine, audit, auditList, centerRow, forgetMember, getMember, listMembers, memberStillValid, patchMember, setJoinCode } from "../../lib/members";
import { newJoinCode } from "../../lib/password";
import { ROLE_LABEL, isCenterOwner } from "../../lib/test-accounts";
import { sameSiteJson } from "../../lib/http";

// 관제 화면으로 내보내는 회원 한 줄 — 비밀번호 해시는 애초에 읽지 않는다 (lib/members.js MEMBER_COLS)
const view = (m) => ({
  id: m.id,
  loginId: m.login_id || null,
  name: m.name,
  role: m.role,
  requestedRole: m.requested_role || null,
  area: areaOfRole(m.role),
  status: m.status || "active",
  phone: m.phone || null,
  profile: m.profile || null,
  member: m.provider === "member",
  createdAt: m.created_at,
  approvedBy: m.approved_by || null,
  approvedAt: m.approved_at || null,
  lastLoginAt: m.last_login_at || null,
});

const has = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
const NEXT = {
  approve: (m) => m.status === "pending",
  reject: (m) => m.status === "pending",
  suspend: (m) => m.status === "active",
  activate: (m) => m.status === "suspended" || m.status === "rejected",
  role: (m) => m.status !== "rejected",
};
const ACTION_TEXT = { approve: "가입 승인", reject: "가입 거절", suspend: "사용 정지", activate: "다시 사용", role: "역할 변경" };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  if (user.role !== "ops") return res.status(403).json({ error: "ops-only" });
  const center = CENTERS[user.center];
  if (!center) return res.status(403).json({ error: "no-center" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });

  try {
    const still = await memberStillValid(user);
    if (!still.ok) return res.status(401).json({ error: still.reason });
    if (req.method !== "GET" && !sameSiteJson(req)) return res.status(415).json({ error: "json-only" });
    const owner = isCenterOwner(user.id, center.id);

    if (req.method === "GET") {
      const [row, members, log] = await Promise.all([centerRow(center.id), listMembers(center.id), auditList(center.id)]);
      return res.status(200).json({
        center: { id: center.id, name: row?.name || center.name, joinCode: row?.join_code || null },
        me: user.id,
        owner,
        members: members.map(view),
        audit: log,
      });
    }

    if (req.method === "POST") {
      if (req.body?.action !== "rotate-code") return res.status(400).json({ error: "invalid-request" });
      let code = null;
      for (let i = 0; i < 5 && !code; i++) {
        try {
          code = await setJoinCode(center.id, newJoinCode());
        } catch (e) {
          if (String(e.code) !== "23505") throw e; // 다른 센터 코드와 겹침 — 다시 뽑는다
        }
      }
      if (!code) return res.status(502).json({ error: "code-failed" });
      await audit({ center_id: center.id, account_id: null, actor_id: user.id, action: "join-code", before: null, after: null });
      await activityLine(center.household, user.id, user.role, "memberAdmin", "가입 코드를 새로 만듦 (옛 코드는 더 쓸 수 없음)");
      return res.status(200).json({ joinCode: code });
    }

    if (req.method === "PATCH") {
      const { id, action, role } = req.body || {};
      if (typeof id !== "string" || !has(NEXT, action)) return res.status(400).json({ error: "invalid-request" });
      if (id === user.id) return res.status(400).json({ error: "self", message: "자기 계정은 바꿀 수 없습니다" });
      const m = await getMember(id);
      if (!m || m.center_id !== center.id) return res.status(404).json({ error: "not-found" });
      if (m.provider !== "member") return res.status(400).json({ error: "test-account", message: "테스트 계정은 바꿀 수 없습니다" });
      if (!NEXT[action](m)) return res.status(409).json({ error: "bad-state", message: "지금 상태에서는 할 수 없는 일입니다" });
      const nextRole = action === "approve" || action === "role" ? role || m.role : m.role;
      if (!ALL_ROLES.includes(nextRole)) return res.status(400).json({ error: "bad-role" });
      if (action === "role" && nextRole === m.role) return res.status(400).json({ error: "same-role" });
      if (!owner && (m.role === "ops" || nextRole === "ops"))
        return res.status(403).json({ error: "owner-only", message: "관제 역할과 관제 회원은 센터 관리자만 바꿀 수 있습니다" });

      const now = new Date().toISOString();
      const fields =
        action === "approve"
          ? { status: "active", role: nextRole, approved_by: user.id, approved_at: now }
          : action === "reject"
            ? { status: "rejected", approved_by: user.id, approved_at: now }
            : action === "suspend"
              ? { status: "suspended" }
              : action === "activate"
                ? { status: "active", ...(m.status === "rejected" ? { approved_by: user.id, approved_at: now } : {}) }
                : { role: nextRole };
      const after = await patchMember(m.id, fields);
      forgetMember(m.id);
      await audit({
        center_id: center.id,
        account_id: m.id,
        actor_id: user.id,
        action,
        before: { role: m.role, status: m.status },
        after: { role: after?.role ?? nextRole, status: after?.status ?? fields.status ?? m.status },
      });
      const roleNote = nextRole !== m.role ? ` · ${ROLE_LABEL[m.role]} → ${ROLE_LABEL[nextRole]}` : ` · ${ROLE_LABEL[nextRole]}`;
      await activityLine(center.household, user.id, user.role, "memberAdmin", `${ACTION_TEXT[action]} — ${m.name} (${m.login_id || m.id})${roleNote}`);
      return res.status(200).json({ member: after ? view(after) : null });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[members]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
