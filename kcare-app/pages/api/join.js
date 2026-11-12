// 회원 가입 (2026-10-06) — 로그인 없이 부른다 (가입 화면 /join · /partner/join · /ops/join).
//
//   GET  /api/join?code=AB12CD   가입 코드가 맞는지 → { center: { id, name }, kind: "family" | "staff" | "any" } (그 밖의 정보는 싣지 않는다)
//   GET  /api/join?invite=…      초대 링크가 맞는지 → { center, invite: { fromName, fromRole, role, exp } }
//   POST /api/join               { code | invite, area, role, name, phone, loginId, password, profile, agree }
//                                → { status: "active" | "pending", center, role, area }
//
// 초대 링크(2026-10-14 · lib/invite.js) — 어르신 · 보호자가 만든 링크로 들어온 자녀는 가입 코드 없이 그 센터에
// 보호자로 가입 신청한다. 링크 하나로 5명까지 · 7일. 초대로 와도 센터 관제가 승인해야 로그인된다.
// 보낸 사람이 정지 · 탈퇴했거나 센터가 바뀌었으면 그 링크는 더 쓰지 못한다.
//
// 가입 코드는 두 가지다 (2026-11-12 — "가입 코드가 달라도 모두 한 사람으로 묶인다" · lib/families.js):
//   가족 가입 코드   가족마다 하나 (관제 '가족 관리'에서 만든다). 어르신 · 보호자가 이 코드로 가입하면 그 가족에 들어간다.
//   센터 가입 코드   센터마다 하나 (관제 '계정 · 권한'). 직원(컨시어지 · 파트너 · 관제) 가입에만 쓴다.
// 서로 바꿔 쓰면 받지 않고 어느 코드가 필요한지 알려 준다. 표에 가족 칸이 아직 없으면(families.sql 실행 전) 예전처럼
// 센터 가입 코드 하나로 모두 받는다 — 어르신 · 보호자는 그 센터의 첫 가족으로 들어간다.
// 어느 영역이든 그 센터 관제가 승인해야 로그인된다 (lib/centers.js). 승인 대기가 너무 쌓이면 새 가입을 잠시 받지 않는다.
// 비밀번호는 scrypt 해시로만 저장한다. 실패 이유는 아이디 중복 · 입력 오류만 알려 준다.
import { memberLoginConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode, ensureHousehold } from "../../lib/db";
import { AREAS, JOIN_CODE_RE, checkLoginId, checkPassword, isArea, normCode } from "../../lib/centers";
import { activityLine, audit, centerByCode, createMember, getMember, inviteRank, inviteUses, loginIdTaken, pendingCount, pendingRank, removePending } from "../../lib/members";
import { familyByCode, homeOfMember } from "../../lib/families";
import { INVITE_MAX_USES, readInvite } from "../../lib/invite";
import { hashPassword } from "../../lib/password";
import { ROLE_LABEL } from "../../lib/test-accounts";
import { clientIp, makeLimiter, sameSiteJson } from "../../lib/http";

const str = (v, n) => String(v ?? "").trim().slice(0, n);
const slow = () => new Promise((r) => setTimeout(r, 400));

// 같은 곳(IP)에서 짧은 시간에 여러 번 두드리는 것을 늦춘다 — 전체 150번, 틀린 코드 20번 / 10분 (서버 인스턴스마다).
// 한 사무실 와이파이(같은 IP)에서 테스터 여럿이 함께 가입해도 걸리지 않을 만큼 — 코드 맞히기는 틀린 코드 수로 막는다
const anyHit = makeLimiter({ windowMs: 10 * 60 * 1000, max: 150 });
const badCode = makeLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
const badCodeSeen = new Map();
const MAX_PENDING = 30; // 한 센터의 승인 대기 — 넘으면 관제가 정리할 때까지 새 가입을 받지 않는다

// 초대를 보낸 사람 — 아직 그 센터의 사용 중인 회원일 때만 (정지 · 탈퇴한 사람의 링크는 막는다). 초대받은 사람은 보낸 사람의 가족으로 들어간다
async function inviterOf(invite) {
  const m = invite?.from ? await getMember(invite.from) : null;
  return m && m.status === "active" && m.provider === "member" && m.center_id === invite.center.id ? m : null;
}

// 가입 코드 → 무엇의 코드인가. { kind: "family", center, household } · { kind: "staff" | "any", center, household(첫 가족) } · null
// any: 가족 칸이 아직 없는 예전 표 — 센터 코드 하나로 모두 받는다
async function readCode(code) {
  if (!JOIN_CODE_RE.test(code)) return null;
  let ready = true;
  let fam = null;
  try {
    fam = await familyByCode(code);
  } catch (e) {
    if (dbErrorCode(e) !== "schema-missing") throw e;
    ready = false;
  }
  if (fam) return { kind: "family", center: { ...fam.center }, household: fam.id };
  const center = await centerByCode(code);
  if (!center) return null;
  return { kind: ready ? "staff" : "any", center, household: center.household };
}
const WRONG_KIND = {
  // 어르신 · 보호자가 센터(직원) 코드를 적었다
  user: "직원 가입용 코드입니다. 관제에서 가족마다 따로 드리는 가족 가입 코드를 적어 주세요",
  // 직원이 가족 코드를 적었다
  staff: "가족 가입 코드입니다. 컨시어지 · 파트너 · 관제는 센터 가입 코드로 가입해 주세요",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!memberLoginConfigured() || !dbConfigured()) return res.status(503).json({ error: "member-not-configured" });
  const ip = clientIp(req);
  if (anyHit(ip) || (badCodeSeen.get(ip) || 0) > Date.now()) return res.status(429).json({ error: "too-many" });
  const wrongCode = async () => {
    if (badCode(ip)) badCodeSeen.set(ip, Date.now() + 10 * 60 * 1000);
    if (badCodeSeen.size > 5000) for (const [k, t] of badCodeSeen) if (t < Date.now()) badCodeSeen.delete(k);
    await slow();
  };

  try {
    if (req.method === "GET" && req.query.invite != null) {
      const r = readInvite(req.query.invite);
      if (!r.ok) {
        if (r.error === "bad") await wrongCode();
        return res.status(r.error === "expired" ? 410 : 404).json({ error: r.error === "expired" ? "invite-expired" : "bad-invite" });
      }
      if (!(await inviterOf(r.invite))) return res.status(410).json({ error: "invite-revoked" });
      const used = await inviteUses(r.invite.jti);
      if (used >= INVITE_MAX_USES) return res.status(410).json({ error: "invite-used-up" });
      const { center, fromName, fromRole, role, exp } = r.invite;
      return res.status(200).json({ center: { id: center.id, name: center.name }, invite: { fromName, fromRole, role, exp, left: INVITE_MAX_USES - used } });
    }

    if (req.method === "GET") {
      const found = await readCode(normCode(req.query.code));
      if (!found) {
        await wrongCode();
        return res.status(404).json({ error: "bad-code" });
      }
      // 어느 가족인지(이름)는 싣지 않는다 — 코드만 아는 사람에게 가족 이름을 알려 주지 않는다
      return res.status(200).json({ center: { id: found.center.id, name: found.center.name }, kind: found.kind });
    }

    if (req.method === "POST") {
      if (!sameSiteJson(req)) return res.status(415).json({ error: "json-only" });
      const b = req.body || {};
      // 초대 링크로 온 가입 — 센터 · 역할(보호자)은 링크가 정한다 (요청 값은 믿지 않는다)
      const inv = b.invite != null ? readInvite(b.invite) : null;
      if (inv && !inv.ok) {
        if (inv.error === "bad") await wrongCode();
        return res.status(400).json({ error: inv.error === "expired" ? "invite-expired" : "bad-invite" });
      }
      const invite = inv?.invite || null;
      const area = invite ? "user" : isArea(b.area) ? b.area : null;
      const role = invite ? invite.role : area && AREAS[area].roles.includes(b.role) ? b.role : null;
      const loginId = str(b.loginId, 40).toLowerCase();
      const name = str(b.name, 20);
      const phone = str(b.phone, 20).replace(/[^\d-]/g, "");
      const code = normCode(b.code);
      const errors = {};
      if (!area || !role) errors.role = "가입할 역할을 골라 주세요";
      const idErr = checkLoginId(loginId);
      if (idErr) errors.loginId = idErr;
      const pwErr = checkPassword(b.password, loginId);
      if (pwErr) errors.password = pwErr;
      if (name.length < 2) errors.name = "이름을 2자 이상 적어 주세요";
      if (!b.agree) errors.agree = "안내에 동의해야 가입할 수 있습니다";
      if (!invite && !JOIN_CODE_RE.test(code)) errors.code = "가입 코드를 적어 주세요 (6~8자리)";
      if (Object.keys(errors).length) return res.status(400).json({ error: "invalid", fields: errors });

      const found = invite ? null : await readCode(code);
      if (!invite && !found) {
        await wrongCode();
        return res.status(400).json({ error: "invalid", fields: { code: "맞지 않는 가입 코드입니다" } });
      }
      // 가족 코드는 어르신 · 보호자만, 센터 코드는 직원만 (예전 표면 센터 코드 하나로 모두)
      if (found && found.kind === "staff" && area === "user") return res.status(400).json({ error: "invalid", fields: { code: WRONG_KIND.user } });
      if (found && found.kind === "family" && area !== "user") return res.status(400).json({ error: "invalid", fields: { code: WRONG_KIND.staff } });
      const center = invite ? invite.center : found.center;
      const inviter = invite ? await inviterOf(invite) : null;
      if (invite && !inviter) return res.status(410).json({ error: "invite-revoked" });
      // 들어갈 가족 — 초대는 보낸 사람의 가족, 가족 코드는 그 가족, 직원은 센터의 첫 가족(화면에서 가족을 고른다)
      const household = invite ? homeOfMember(inviter, center) : found.household;
      if (invite && (await inviteUses(invite.jti)) >= INVITE_MAX_USES) return res.status(410).json({ error: "invite-used-up" });
      if ((await pendingCount(center.id)) >= MAX_PENDING) return res.status(429).json({ error: "pending-full" });
      if (await loginIdTaken(loginId)) return res.status(409).json({ error: "taken", fields: { loginId: "이미 쓰는 아이디입니다" } });

      const profile = {};
      if (b.profile && typeof b.profile === "object") {
        ["region", "org", "rel", "note"].forEach((k) => {
          const v = str(b.profile[k], 60);
          if (v) profile[k] = v;
        });
      }
      // 초대로 온 가입 — 누가 보낸 링크인지 남긴다 (관제 승인 화면에 보이고, 링크당 사용 수를 센다)
      if (invite) {
        profile.invite = invite.jti;
        profile.invitedBy = str(invite.fromName, 20);
        profile.invitedById = str(invite.from, 60); // 서버가 링크에서 푼 값 — 관제 화면에서만 보인다
      }
      const status = AREAS[area].approval ? "pending" : "active";
      await ensureHousehold(center.household);
      try {
        await createMember({
          id: loginId,
          login_id: loginId,
          name,
          role,
          requested_role: role,
          status,
          phone: phone || null,
          profile: Object.keys(profile).length ? profile : null,
          center_id: center.id,
          household_id: household,
          password_hash: await hashPassword(b.password),
          provider: "member",
          is_test: true,
          first_login_at: null,
          last_login_at: null,
        });
      } catch (e) {
        // 동시에 같은 아이디로 가입 — 고유 색인이 막는다
        if (String(e.code) === "23505") return res.status(409).json({ error: "taken", fields: { loginId: "이미 쓰는 아이디입니다" } });
        throw e;
      }
      // 동시에 들어온 가입이 한도(초대 5명 · 승인 대기 30명)를 함께 넘지 않게 — 넣은 뒤 순번으로 다시 본다
      if (status === "pending") {
        const overInvite = invite && (await inviteRank(invite.jti, loginId)) >= INVITE_MAX_USES;
        const overPending = !overInvite && (await pendingRank(center.id, loginId)) >= MAX_PENDING;
        if (overInvite || overPending) {
          await removePending(loginId);
          return overInvite ? res.status(410).json({ error: "invite-used-up" }) : res.status(429).json({ error: "pending-full" });
        }
      }
      await audit({ center_id: center.id, account_id: loginId, actor_id: loginId, action: "signup", before: null, after: { role, status } });
      await activityLine(
        household,
        loginId,
        role,
        "memberSignup",
        `회원 가입 · ${ROLE_LABEL[role]} ${name}${invite ? ` · ${invite.fromName || "회원"} 님 초대` : ""}${status === "pending" ? " (관제 승인 대기)" : ""}`
      );
      return res.status(201).json({ status, center: { id: center.id, name: center.name }, role, area });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[join]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
