// 관제 센터 회원 · 권한 (2026-10-06) — 그 센터 관제(ops)만. 다른 센터 회원은 보이지도 바뀌지도 않는다.
//
//   GET    /api/members                    { center: { id, name, joinCode }, members: [...], families: [...] | null, audit: [...] }
//   PATCH  /api/members  { id, action, role, household }
//          action: approve(role 선택) · reject · role(role) · suspend · activate · delete · move(household — 다른 가족으로)
//   POST   /api/members  { action: "rotate-code" }   가입 코드 바꾸기 → { joinCode } (옛 코드는 바로 막힌다)
//
// 바꾼 것은 account_audit 에 남기고 센터 가구 활동 기록(관제 감사로그)에도 한 줄 남긴다.
// 자기 자신은 바꿀 수 없다 (실수로 자기 권한을 잃지 않게). 테스트 계정(비밀번호 해시가 없는 계정)도 바꾸지 않는다.
// 관제 역할을 주거나 빼는 일 · 관제 회원의 정지 · 다시 사용은 센터 관리자(ops1~3)만 한다 (2026-10-06 점검:
// 관제 회원 한 명이 관제 계정을 계속 만들거나 다른 관제를 모두 정지시킬 수 있었다).
// 역할 · 정지는 상대가 다음에 서버를 부를 때(15초 안) 적용된다 — 역할이 바뀌면 다시 로그인해야 한다.
// 계정 삭제(2026-11-12 요청)는 되돌릴 수 없어 센터 관리자(ops1~3)만 한다. 승인 대기는 거절한 뒤에 지운다.
// 계정 줄만 지운다 — 그 회원이 남긴 기록과 권한 변경 기록은 남고(지운 사실도 한 줄 남긴다), 같은 아이디로 다시 가입할 수 있다.
// 가족 옮기기(2026-11-12 · lib/families.js) — 어르신 · 보호자를 그 센터의 다른 가족으로. 기록은 가족에 남고 사람만 옮긴다.
// 옮긴 회원은 다음에 서버를 부를 때(15초 안) 멈추고, 다시 로그인하면 새 가족의 기록이 열린다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../lib/db";
import { ALL_ROLES, CENTERS, areaOfRole, centerOfHousehold, isFamilyRole } from "../../lib/centers";
import { familyNames, familyRow, forgetFamilyAccess } from "../../lib/families";
import { activityLine, audit, auditList, centerRow, deleteMember, forgetMember, getMember, listMembers, memberStillValid, patchMember, setJoinCode } from "../../lib/members";
import { newJoinCode } from "../../lib/password";
import { ROLE_LABEL, isCenterOwner } from "../../lib/test-accounts";
import { sameSiteJson } from "../../lib/http";

// 그 회원이 속한 가족 — 어르신 · 보호자만 (직원은 가족에 속하지 않는다). 번호가 이 센터 것이 아니면 첫 가족
const homeOf = (m, center) => (isFamilyRole(m.role) ? (centerOfHousehold(m.household_id)?.id === center.id ? m.household_id : center.household) : null);

// 관제 화면으로 내보내는 회원 한 줄 — 비밀번호 해시는 애초에 읽지 않는다 (lib/members.js MEMBER_COLS)
const view = (m, center) => ({
  id: m.id,
  household: homeOf(m, center),
  // 역할과 상관없이 계정에 적힌 가족 — 직원을 어르신 · 보호자로 바꾸면 이 가족에 들어간다 (화면이 미리 알려 준다)
  home: centerOfHousehold(m.household_id)?.id === center.id ? m.household_id : center.household,
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
  delete: (m) => m.status !== "pending",
  move: (m) => m.status !== "rejected",
};
const ACTION_TEXT = { approve: "가입 승인", reject: "가입 거절", suspend: "사용 정지", activate: "다시 사용", role: "역할 변경", delete: "계정 삭제", move: "가족 옮김" };

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
      // 가족 이름 — 표에 가족 칸이 아직 없으면(families.sql 실행 전) null: 화면은 예전처럼 한 가족으로 보인다
      let families = null;
      try {
        families = await familyNames(center.id);
      } catch (e) {
        if (dbErrorCode(e) !== "schema-missing") throw e;
      }
      return res.status(200).json({
        center: { id: center.id, name: row?.name || center.name, joinCode: row?.join_code || null },
        me: user.id,
        owner,
        members: members.map((m) => view(m, center)),
        families,
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
      const { id, action, role, household } = req.body || {};
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

      // 지우기 — 센터 관리자만. 지운 사실은 권한 변경 기록(이름을 같이 적어 둔다 — 계정 줄이 없어지므로)과 감사로그에 남긴다
      if (action === "delete") {
        if (!owner) return res.status(403).json({ error: "owner-only-delete", message: "계정 삭제는 센터 관리자만 할 수 있습니다" });
        const n = await deleteMember(m.id, center.id);
        forgetMember(m.id);
        if (!n) return res.status(409).json({ error: "bad-state", message: "지금 상태에서는 할 수 없는 일입니다" });
        await audit({ center_id: center.id, account_id: m.id, actor_id: user.id, action: "delete", before: { role: m.role, status: m.status, name: m.name }, after: null });
        await activityLine(homeOf(m, center) || center.household, user.id, user.role, "memberAdmin", `${ACTION_TEXT.delete} — ${m.name} (${m.login_id || m.id}) · ${ROLE_LABEL[m.role]}`);
        return res.status(200).json({ member: null, deleted: m.id });
      }

      // 가족 옮기기 — 어르신 · 보호자만, 이 센터의 가족으로만
      if (action === "move") {
        if (!isFamilyRole(m.role)) return res.status(400).json({ error: "not-family-role", message: "가족은 어르신 · 보호자만 옮길 수 있습니다" });
        const from = homeOf(m, center);
        if (typeof household !== "string" || centerOfHousehold(household)?.id !== center.id) return res.status(400).json({ error: "bad-family" });
        if (household === from) return res.status(400).json({ error: "same-family", message: "이미 그 가족입니다" });
        if (household !== center.household && !(await familyRow(household))) return res.status(404).json({ error: "family-not-found" });
        const moved = await patchMember(m.id, { household_id: household });
        forgetMember(m.id);
        forgetFamilyAccess();
        await audit({ center_id: center.id, account_id: m.id, actor_id: user.id, action: "move", before: { household: from }, after: { household } });
        const line = `${ACTION_TEXT.move} — ${m.name} (${m.login_id || m.id}) · ${ROLE_LABEL[m.role]}`;
        await activityLine(from, user.id, user.role, "memberAdmin", `${line} · 다른 가족으로 나감`);
        await activityLine(household, user.id, user.role, "memberAdmin", `${line} · 이 가족으로 들어옴`);
        return res.status(200).json({ member: moved ? view(moved, center) : null });
      }

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
      // 어르신 · 보호자의 일은 그 가족의 기록에, 직원의 일은 센터 첫 가족의 기록에 남긴다
      await activityLine(homeOf(m, center) || center.household, user.id, user.role, "memberAdmin", `${ACTION_TEXT[action]} — ${m.name} (${m.login_id || m.id})${roleNote}`);
      return res.status(200).json({ member: after ? view(after, center) : null });
    }

    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[members]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
