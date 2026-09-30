// 가구 상태 저장 — 테스트 계정으로 로그인했을 때만 (lib/state.js 가 부른다).
//
//   GET  /api/household        가구 상태 전체 { state, version, updatedAt, updatedBy }
//   GET  /api/household?v=12   바뀐 게 있을 때만 상태를 싣는다 { changed, ... } — 다른 폰 변경 확인용
//   PUT  /api/household        { baseVersion, state, actions } — 버전이 맞을 때만 덮어쓴다.
//                              다른 폰이 먼저 바꿨으면 409 와 최신 상태를 돌려준다.
//
// 어느 가구인지는 로그인 세션에서만 정한다 — 요청 본문의 값은 믿지 않는다.
// 함께 온 동작(actions)은 activity 표에 한 줄씩, 가입 신청은 signups 표에도 쌓는다.
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { authConfigured } from "../../lib/auth-server";
import { db, dbConfigured, dbErrorCode, ensureHousehold } from "../../lib/db";
import { summarize, trimPayload } from "../../lib/activity";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const MAX_STATE_CHARS = 3_500_000; // 스토어 상품 사진(축소본)까지 들어가도 넉넉한 크기
const MAX_ACTIONS = 100;
const MAX_PAYLOAD_CHARS = 8000;

const isPlainObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v, n = 200) => (v == null ? null : String(v).slice(0, n));
const int = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

async function current(household) {
  const { data, error } = await db()
    .from("households")
    .select("state,version,updated_at,updated_by")
    .eq("id", household)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function activityRows(actions, user) {
  return actions
    .map((a) => {
      const summary = summarize(a);
      if (!summary) return null;
      const { type, _at, _op, ...rest } = a; // eslint-disable-line no-unused-vars
      let payload = trimPayload(rest);
      if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) payload = { truncated: true };
      return {
        household_id: user.household,
        account_id: user.id,
        role: user.role || null,
        type: str(type, 40),
        summary: str(summary, 300),
        payload,
        client_at: Number.isFinite(_at) ? new Date(_at).toISOString() : null,
      };
    })
    .filter(Boolean);
}

// 가입 신청 — 온보딩 마지막 단계의 값 (pages/onboarding.jsx finish)
function signupRow(p, user) {
  return {
    household_id: user.household,
    account_id: user.id,
    track: str(p.track, 40),
    for_self: typeof p.forSelf === "boolean" ? p.forSelf : null,
    care_location: str(p.careLocation, 20),
    household_type: str(p.household, 20),
    relation: str(p.rel, 20),
    relation_detail: str(p.relDetail, 60),
    phone: str(p.phone, 30),
    address: str(p.address, 200),
    elder_phone: str(p.elderPhone, 30),
    residence: str(p.res, 40),
    elder_name: str(p.elderName, 40),
    district: str(p.district, 40),
    tier: int(p.tier),
    payment_mode: str(p.paymentMode, 20),
    limit_amount: int(p.limitAmount),
    video_consent: !!p.videoConsent,
    sales_ref: str(p.salesRef, 20),
    auth_provider: str(p.auth, 20),
    auth_email: str(p.authEmail, 120),
    is_test: true,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!authConfigured()) return res.status(401).json({ error: "login-required" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;
  if (!user?.household) return res.status(401).json({ error: "login-required" });
  if (!dbConfigured()) return res.status(503).json({ error: "db-not-configured" });

  try {
    if (req.method === "GET") {
      const since = req.query.v != null ? Number(req.query.v) : null;
      if (since != null && Number.isFinite(since)) {
        const { data, error } = await db().from("households").select("version").eq("id", user.household).maybeSingle();
        if (error) throw error;
        // 같을 때만 '안 바뀜'. 작아진 경우(관리자가 가구를 지워 처음부터)도 바뀐 것으로 알린다
        if ((data?.version ?? 0) === since) return res.status(200).json({ changed: false, version: since });
        if (!data) return res.status(200).json({ changed: true, state: null, version: 0, updatedAt: null, updatedBy: null });
      }
      let row = await current(user.household);
      if (!row) {
        await ensureHousehold(user.household);
        row = { state: null, version: 0 };
      }
      return res.status(200).json({
        changed: true,
        state: row.state,
        version: row.version,
        updatedAt: row.updated_at || null,
        updatedBy: row.updated_by || null,
      });
    }

    if (req.method === "PUT") {
      const { baseVersion, state, actions = [] } = req.body || {};
      if (!Number.isInteger(baseVersion) || baseVersion < 0 || !isPlainObject(state) || !Array.isArray(actions)) {
        return res.status(400).json({ error: "invalid-request" });
      }
      if (JSON.stringify(state).length > MAX_STATE_CHARS) return res.status(413).json({ error: "state-too-large" });
      const list = actions.filter((a) => isPlainObject(a) && typeof a.type === "string").slice(0, MAX_ACTIONS);

      if (baseVersion === 0) await ensureHousehold(user.household);
      const { data, error } = await db()
        .from("households")
        .update({
          state,
          version: baseVersion + 1,
          updated_at: new Date().toISOString(),
          updated_by: `${user.name || user.id} (${user.id})`.slice(0, 120),
        })
        .eq("id", user.household)
        .eq("version", baseVersion)
        .select("version");
      if (error) throw error;
      if (!data || data.length === 0) {
        // 다른 폰이 먼저 저장했다 — 최신 상태를 돌려주면 화면이 내 동작을 그 위에 다시 쌓는다
        const row = await current(user.household);
        return res.status(409).json({ error: "conflict", state: row?.state ?? null, version: row?.version ?? 0 });
      }

      // 기록 — 상태 저장은 이미 끝났으므로 여기서 실패해도 저장 자체는 성공으로 답한다
      const rows = activityRows(list, user);
      if (rows.length) {
        const { error: e1, status: s1 } = await db().from("activity").insert(rows);
        if (e1) console.error("[household] 활동 기록 실패", dbErrorCode(e1, s1));
      }
      const signups = list.filter((a) => a.type === "completeOnboarding" && isPlainObject(a.payload));
      if (signups.length) {
        const { error: e2, status: s2 } = await db().from("signups").insert(signups.map((a) => signupRow(a.payload, user)));
        if (e2) console.error("[household] 가입 신청 기록 실패", dbErrorCode(e2, s2));
      }
      return res.status(200).json({ version: data[0].version });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method-not-allowed" });
  } catch (e) {
    const code = dbErrorCode(e);
    console.error("[household]", code);
    return res.status(code === "schema-missing" ? 503 : 502).json({ error: code });
  }
}
