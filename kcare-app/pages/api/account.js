// 내 계정 (2026-11-18) — 가입한 회원이 자기 계정을 직접 다룬다. 화면은 pages/account.jsx '내 정보 관리'.
//   GET    /api/account                                   → { account, manage }
//   POST   /api/account  { action: "password", current, next }   비밀번호 바꾸기
//   POST   /api/account  { action: "delete", password }          회원 탈퇴 (내 계정 지우기)
//
// 비밀번호 바꾸기
//   · 지금 비밀번호를 확인한 뒤 바꾼다. 바꾸면 이 아이디로 로그인해 있던 모든 기기가 다시 로그인해야 한다
//     (lib/members.js memberStillValid — 바꾼 때보다 먼저 로그인한 세션을 끝낸다). 이 화면도 바꾼 뒤 로그아웃한다.
//   · 관제가 발급한 임시 비밀번호로 들어온 사람은 여기서 새 비밀번호를 정해야 기록을 읽고 쓸 수 있다.
//   · 비밀번호를 잊은 사람은 여기로 오지 못한다 — 관제가 계정 · 권한에서 임시 비밀번호를 발급한다 (pages/api/members.js).
//     앱에 문자 · 전자우편을 보내는 수단이 없어, 본인 확인은 관제가 전화로 한다.
//
// 회원 탈퇴
//   · 내 계정 줄(아이디 · 이름 · 연락처 · 비밀번호 해시 · 가입 때 적은 것)을 바로 지운다. 다시 로그인할 수 없다.
//   · 가족이 함께 쓰는 기록(일정 · 요청 · 리포트 등)은 지우지 않는다 — 남은 가족과 서비스 제공에 쓰는 기록이고, 결제 기록은 법이 정한 기간 보관한다.
//     관제가 적어 둔 이 사람의 연락 정보(보호자 기본정보)는 가족 기록에서 같이 지운다.
//   · 월 구독(서비스 이용계약)은 탈퇴로 해지되지 않는다 — 화면이 그렇게 알린다. 관제 '지금 처리할 일'에 탈퇴 사실이 뜬다
//     (남은 앱 회원이 없으면 서비스 해지 · 기록 정리를 확인하라고 적는다).
//   · 테스트 계정 · 센터 관리자 계정(ops1~3)은 가입한 계정이 아니라 여기서 다루지 않는다.
// 틀린 비밀번호는 계정마다 10분에 5번까지 (서버 인스턴스마다) — 로그인의 잠금과는 따로 센다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../lib/db";
import { CENTERS, areaOfRole, centerOfHousehold, checkPassword, isFamilyRole } from "../../lib/centers";
import { activityLine, audit, deleteMember, forgetMember, memberStillValid, memberWithHash, secOf, setPassword } from "../../lib/members";
import { familyPeople, forgetFamilyAccess } from "../../lib/families";
import { applyToHousehold } from "../../lib/household-server";
import { hashPassword, verifyPassword } from "../../lib/password";
import { sameSiteJson } from "../../lib/http";
import { ROLE_LABEL } from "../../lib/test-accounts";

const WINDOW = 10 * 60 * 1000;
const MAX_WRONG = 5;
const wrong = new Map();
const recent = (id) => (wrong.get(id) || []).filter((t) => Date.now() - t < WINDOW);
const blocked = (id) => recent(id).length >= MAX_WRONG;
const miss = (id) => {
  if (wrong.size > 5000) for (const k of wrong.keys()) if (!recent(k).length) wrong.delete(k);
  wrong.set(id, [...recent(id), Date.now()]);
};
const slow = () => new Promise((r) => setTimeout(r, 400));

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const user = (await getServerSession(req, res, authOptions))?.user;
  if (!user?.id) return res.status(401).json({ error: "login-required" });
  // 가입한 회원 계정만 — 테스트 계정 · 구글 · 센터 관리자 계정은 비밀번호도 계정 줄도 여기서 다루는 것이 아니다
  const member = user.provider === "member";

  if (req.method === "GET") {
    if (!member || !dbConfigured()) {
      return res.status(200).json({ manage: false, account: { id: user.id, loginId: null, name: user.name || null, role: user.role || null, area: areaOfRole(user.role) || null, provider: user.provider || null } });
    }
    try {
      const still = await memberStillValid(user, { allowTemp: true });
      if (!still.ok) return res.status(401).json({ error: still.reason, area: still.area || null });
      const m = await memberWithHash(user.id);
      if (!m) return res.status(401).json({ error: "account-removed" });
      return res.status(200).json({
        manage: true,
        account: { id: m.id, loginId: m.login_id || m.id, name: m.name, role: m.role, area: areaOfRole(m.role), phone: m.phone || null, createdAt: m.created_at || null, mustChange: !!secOf(m.profile).temp, provider: "member" },
      });
    } catch (e) {
      console.error("[account]", dbErrorCode(e));
      return res.status(502).json({ error: dbErrorCode(e) });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method-not-allowed" });
  }
  if (!sameSiteJson(req)) return res.status(415).json({ error: "json-only" });
  if (!member) return res.status(403).json({ error: "not-member", message: "가입한 회원 아이디에서만 할 수 있습니다" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });
  const { action, current, next, password } = req.body || {};
  if (action !== "password" && action !== "delete") return res.status(400).json({ error: "invalid-request" });

  try {
    const still = await memberStillValid(user, { allowTemp: true });
    if (!still.ok) return res.status(401).json({ error: still.reason, area: still.area || null });
    if (blocked(user.id)) return res.status(429).json({ error: "too-many", message: "비밀번호를 여러 번 틀렸습니다. 10분 뒤에 다시 해 주세요." });
    const m = await memberWithHash(user.id);
    const center = m ? CENTERS[m.center_id] : null;
    if (!m || !m.password_hash || !center) return res.status(401).json({ error: "account-removed" });

    // 본인 확인 — 지금 비밀번호
    const given = action === "password" ? current : password;
    if (typeof given !== "string" || !given || !(await verifyPassword(given, m.password_hash))) {
      miss(user.id);
      await slow();
      const field = action === "password" ? "current" : "password";
      return res.status(400).json({ error: "invalid", fields: { [field]: "지금 비밀번호가 맞지 않습니다" } });
    }

    if (action === "password") {
      const bad = checkPassword(next, m.login_id || m.id);
      if (bad) return res.status(400).json({ error: "invalid", fields: { next: bad } });
      if (next === current) return res.status(400).json({ error: "invalid", fields: { next: "지금 비밀번호와 다른 비밀번호를 정해 주세요" } });
      const after = await setPassword(m.id, await hashPassword(next), { temp: false });
      forgetMember(m.id);
      if (!after) return res.status(409).json({ error: "bad-state" });
      await audit({ center_id: center.id, account_id: m.id, actor_id: m.id, action: "password-change", before: null, after: null });
      return res.status(200).json({ ok: true, area: areaOfRole(m.role), loginId: m.login_id || m.id });
    }

    // 회원 탈퇴 — 계정 줄을 지운다
    const home = isFamilyRole(m.role) ? (centerOfHousehold(m.household_id)?.id === center.id ? m.household_id : center.household) : null;
    let left = null; // 이 가족에 남는 앱 회원(어르신 · 보호자) 수
    if (home) {
      try {
        left = (await familyPeople(center.id, home)).filter((p) => isFamilyRole(p.role) && p.id !== m.id).length;
      } catch (_) {
        left = null;
      }
    }
    const n = await deleteMember(m.id, center.id);
    forgetMember(m.id);
    forgetFamilyAccess();
    if (!n) return res.status(409).json({ error: "bad-state" });

    const who = `${m.name} 님(${ROLE_LABEL[m.role] || m.role})`;
    if (home) {
      const text =
        left === 0
          ? `회원 탈퇴 — ${who}. 이 가족에 남은 앱 회원이 없습니다 — 서비스 해지 여부와 기록 정리를 확인해 주세요`
          : `회원 탈퇴 — ${who}${left != null ? ` · 이 가족에 남은 앱 회원 ${left}명` : ""}. 월 구독(서비스 이용계약)은 그대로입니다`;
      try {
        await applyToHousehold(home, [{ type: "memberLeft", name: m.name, from: `${ROLE_LABEL[m.role] || "회원"} ${m.name}`, role: m.role, text, _at: Date.now(), _op: `left${Date.now().toString(36)}${m.id}`.slice(0, 40) }], `회원 탈퇴 · ${m.name}`);
      } catch (e) {
        console.error("[account] 가족 기록 정리 실패", dbErrorCode(e));
      }
    }
    await audit({ center_id: center.id, account_id: m.id, actor_id: m.id, action: "self-delete", before: { role: m.role, status: m.status, name: m.name }, after: null });
    await activityLine(home || center.household, m.id, m.role, "memberAdmin", `본인 탈퇴 — ${m.name} (${m.login_id || m.id}) · ${ROLE_LABEL[m.role] || m.role}`);
    return res.status(200).json({ ok: true, area: areaOfRole(m.role) });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[account]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
