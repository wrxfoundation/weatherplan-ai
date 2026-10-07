// 서버 저장 (Supabase) — API 라우트에서만 쓴다. 비밀 키는 서버에만 있고 브라우저로 나가지 않는다.
//
// 필요한 환경변수 (배포 환경에만 넣는다 · 코드·git 에 적지 않는다):
//   SUPABASE_URL          프로젝트 주소 (https://xxxx.supabase.co) — NEXT_PUBLIC_SUPABASE_URL 이어도 된다
//   SUPABASE_SECRET_KEY   비밀 키 (sb_secret_…) — 예전 방식의 SUPABASE_SERVICE_ROLE_KEY 여도 된다
// 테이블은 supabase/schema.sql 을 SQL Editor 에서 한 번 실행해 만든다.
// 모든 테이블에 RLS 를 켜고 정책을 두지 않아서, 이 비밀 키 말고는 아무도 읽고 쓰지 못한다.
import { createClient } from "@supabase/supabase-js";
import { householdName, TEST_HOUSEHOLDS } from "./test-accounts";
import { centerOfHousehold } from "./centers";

const url = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const dbConfigured = () => !!(url() && key());

let client = null;
export function db() {
  if (!client) {
    client = createClient(url(), key(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

// Supabase 오류를 화면·로그에 싣기 좋은 짧은 코드로 — 키·주소는 싣지 않는다
export function dbErrorCode(error, status = error?.status) {
  if (!error) return null;
  const c = String(error.code || "");
  // 테이블이 없다 (schema.sql 을 아직 안 돌렸다). 본문 없이 돌아오는 쓰기 요청은 404 로만 알 수 있다
  // 칸이 없다(42703 · PGRST204) — 2026-10-06 회원 칸이 추가되기 전의 schema.sql 로 만든 표
  if (c === "42P01" || c === "PGRST205" || c === "PGRST202" || c === "42703" || c === "PGRST204" || (!c && status === 404)) return "schema-missing";
  if (c === "42501") return "permission-denied";
  if (c === "PGRST301" || c === "401" || /jwt|api key|apikey/i.test(error.message || "")) return "bad-key";
  return c || "db-error";
}

// 가구 행을 준비한다 — 이미 있으면 그대로 둔다 (상태는 화면이 처음 저장할 때 채운다)
// 관제 센터 가구(HH-C1 …)는 센터 번호도 적는다 — supabase/schema.sql 의 2026-10-06 칸이 있어야 한다
export async function ensureHousehold(id) {
  const center = centerOfHousehold(id);
  const row = { id, name: householdName(id), is_test: !!TEST_HOUSEHOLDS[id], ...(center ? { center_id: center.id } : {}) };
  const { error, status } = await db().from("households").upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw Object.assign(error, { status });
}

const LOGIN_TEXT = { "google-sim": "로그인 · Google (시뮬레이션)", google: "로그인 · Google", member: "로그인 · 회원 아이디", center: "로그인 · 센터 관리자" };

// 로그인 기록 — 계정 표(마지막 로그인)와 활동 기록(로그인 한 줄). 실패해도 로그인은 막지 않는다.
export async function recordLogin(user) {
  if (!dbConfigured() || !user?.aid) return;
  try {
    if (user.household) await ensureHousehold(user.household);
    if (user.provider === "member") {
      // 회원은 가입 때 이미 행이 있다 — 로그인 시각만 (이름 · 역할 · 상태는 관제가 정한 값 그대로)
      const now = new Date().toISOString();
      const a = await db().from("accounts").update({ last_login_at: now }).eq("id", user.aid);
      if (a.error) throw Object.assign(a.error, { status: a.status });
      await db().from("accounts").update({ first_login_at: now }).eq("id", user.aid).is("first_login_at", null);
    } else {
      const center = centerOfHousehold(user.household);
      const a = await db()
        .from("accounts")
        .upsert(
          {
            id: user.aid,
            email: user.email || null,
            name: user.name || null,
            role: user.role || null,
            household_id: user.household || null,
            provider: user.provider,
            is_test: user.provider !== "google",
            last_login_at: new Date().toISOString(),
            ...(center ? { center_id: center.id } : {}),
          },
          { onConflict: "id" }
        );
      if (a.error) throw Object.assign(a.error, { status: a.status });
    }
    if (user.household) {
      const b = await db()
        .from("activity")
        .insert({
          household_id: user.household,
          account_id: user.aid,
          role: user.role || null,
          type: "login",
          summary: LOGIN_TEXT[user.provider] || "로그인 · 테스트 아이디",
        });
      if (b.error) throw Object.assign(b.error, { status: b.status });
    }
  } catch (e) {
    console.error("[db] 로그인 기록 실패", dbErrorCode(e));
  }
}
