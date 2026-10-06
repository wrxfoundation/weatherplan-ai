// 회원 가입 (2026-10-06) — 로그인 없이 부른다 (가입 화면 /join · /partner/join · /ops/join).
//
//   GET  /api/join?code=AB12CD   가입 코드가 맞는지 → { center: { id, name } } (그 밖의 정보는 싣지 않는다)
//   POST /api/join               { code, area, role, name, phone, loginId, password, profile, agree }
//                                → { status: "active" | "pending", center, role, area }
//
// 가입 코드가 센터를 정한다 — 코드는 그 센터 관제가 회원 · 권한 화면에서 나눠 주고 바꿀 수 있다.
// 이용자(어르신 · 보호자)는 바로 사용, 현장 · 영업(컨시어지 · 영업자)과 관제는 그 센터 관제가 승인해야 로그인된다.
// 비밀번호는 scrypt 해시로만 저장한다. 실패 이유는 아이디 중복 · 입력 오류만 알려 준다.
import { memberLoginConfigured } from "../../lib/auth-server";
import { dbConfigured, dbErrorCode, ensureHousehold } from "../../lib/db";
import { AREAS, JOIN_CODE_RE, checkLoginId, checkPassword, normCode } from "../../lib/centers";
import { activityLine, audit, centerByCode, createMember, loginIdTaken } from "../../lib/members";
import { hashPassword } from "../../lib/password";
import { ROLE_LABEL } from "../../lib/test-accounts";

const str = (v, n) => String(v ?? "").trim().slice(0, n);
const slow = () => new Promise((r) => setTimeout(r, 400));

// 같은 곳에서 짧은 시간에 여러 번 두드리는 것을 늦춘다 (서버 인스턴스마다 · 베타용 최소 장치)
const hits = new Map();
function tooMany(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 30;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!memberLoginConfigured() || !dbConfigured()) return res.status(503).json({ error: "member-not-configured" });
  if (tooMany(req)) return res.status(429).json({ error: "too-many" });

  try {
    if (req.method === "GET") {
      const code = normCode(req.query.code);
      const center = JOIN_CODE_RE.test(code) ? await centerByCode(code) : null;
      if (!center) {
        await slow();
        return res.status(404).json({ error: "bad-code" });
      }
      return res.status(200).json({ center: { id: center.id, name: center.name } });
    }

    if (req.method === "POST") {
      const b = req.body || {};
      const area = AREAS[b.area] ? b.area : null;
      const role = area && AREAS[area].roles.includes(b.role) ? b.role : null;
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
      if (!JOIN_CODE_RE.test(code)) errors.code = "가입 코드 6자리를 적어 주세요";
      if (Object.keys(errors).length) return res.status(400).json({ error: "invalid", fields: errors });

      const center = await centerByCode(code);
      if (!center) {
        await slow();
        return res.status(400).json({ error: "invalid", fields: { code: "맞지 않는 가입 코드입니다" } });
      }
      if (await loginIdTaken(loginId)) return res.status(409).json({ error: "taken", fields: { loginId: "이미 쓰는 아이디입니다" } });

      const profile = {};
      if (b.profile && typeof b.profile === "object") {
        ["region", "org", "rel", "note"].forEach((k) => {
          const v = str(b.profile[k], 60);
          if (v) profile[k] = v;
        });
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
          household_id: center.household,
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
      await audit({ center_id: center.id, account_id: loginId, actor_id: loginId, action: "signup", before: null, after: { role, status } });
      await activityLine(
        center.household,
        loginId,
        role,
        "memberSignup",
        `회원 가입 · ${ROLE_LABEL[role]} ${name}${status === "pending" ? " (관제 승인 대기)" : ""}`
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
