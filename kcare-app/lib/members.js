// 회원 · 관제 센터 — 서버(API 라우트 · 로그인)에서만 쓴다 (2026-10-06).
// 표는 supabase/schema.sql 의 centers · accounts(회원 칸) · account_audit. 비밀번호 해시는 이 파일 밖으로 내보내지 않는다.
import { db, dbErrorCode, ensureHousehold } from "./db";
import { CENTERS, areaOfRole } from "./centers";

const MEMBER_COLS = "id, login_id, name, role, requested_role, status, phone, profile, center_id, provider, created_at, approved_by, approved_at, last_login_at";

const fail = (error, status) => Object.assign(error, { status });

export async function centerByCode(code) {
  const { data, error, status } = await db().from("centers").select("id, name, household_id").eq("join_code", code).maybeSingle();
  if (error) throw fail(error, status);
  return data && CENTERS[data.id] ? { ...CENTERS[data.id], name: data.name || CENTERS[data.id].name } : null;
}

export async function centerRow(id) {
  const { data, error, status } = await db().from("centers").select("id, name, household_id, join_code").eq("id", id).maybeSingle();
  if (error) throw fail(error, status);
  return data;
}

export async function setJoinCode(id, code) {
  const { data, error, status } = await db().from("centers").update({ join_code: code }).eq("id", id).select("join_code");
  if (error) throw fail(error, status);
  return data?.[0]?.join_code || null;
}

// 로그인용 — 비밀번호 해시 · 잠금까지 (로그인 확인에만 쓰고 응답에 싣지 않는다)
export async function memberForLogin(loginId) {
  const { data, error, status } = await db()
    .from("accounts")
    .select(`${MEMBER_COLS}, password_hash, locked_until`)
    .eq("login_id", loginId)
    .maybeSingle();
  if (error) throw fail(error, status);
  return data;
}

// 로그인 실패 — 5번 틀리면 잠근다 (supabase/schema.sql kcare_login_failed). 표가 예전 모양이면 조용히 넘어간다
export async function loginFailed(id) {
  try {
    const { error, status } = await db().rpc("kcare_login_failed", { p_id: id });
    if (error) throw fail(error, status);
  } catch (e) {
    console.error("[members] 로그인 실패 기록 안 됨", dbErrorCode(e));
  }
}
export async function loginSucceeded(id) {
  try {
    await db().from("accounts").update({ failed_logins: 0, locked_until: null }).eq("id", id).gt("failed_logins", 0);
  } catch (_) {
    /* 잠금 칸이 없는 예전 표 — 로그인은 막지 않는다 */
  }
}

// 그 센터 승인 대기 수 — 가입 신청이 한꺼번에 쏟아지는 것을 막는다 (pages/api/join.js)
export async function pendingCount(centerId) {
  const { count, error, status } = await db().from("accounts").select("id", { count: "exact", head: true }).eq("center_id", centerId).eq("status", "pending");
  if (error) throw fail(error, status);
  return count || 0;
}

// 회원 계정 id 는 아이디 그대로다 (테스트 · 구글 계정 id 와는 모양이 달라 겹치지 않는다 — lib/centers.js checkLoginId)
export async function loginIdTaken(loginId) {
  const { data, error, status } = await db().from("accounts").select("id").eq("id", loginId).limit(1);
  if (error) throw fail(error, status);
  return (data || []).length > 0;
}

export async function createMember(row) {
  const { error, status } = await db().from("accounts").insert(row);
  if (error) throw fail(error, status);
}

export async function listMembers(centerId) {
  const { data, error, status } = await db()
    .from("accounts")
    .select(MEMBER_COLS)
    .eq("center_id", centerId)
    .order("created_at", { ascending: true });
  if (error) throw fail(error, status);
  return data || [];
}

export async function getMember(id) {
  const { data, error, status } = await db().from("accounts").select(MEMBER_COLS).eq("id", id).maybeSingle();
  if (error) throw fail(error, status);
  return data;
}

export async function patchMember(id, fields) {
  const { data, error, status } = await db().from("accounts").update(fields).eq("id", id).select(MEMBER_COLS);
  if (error) throw fail(error, status);
  return data?.[0] || null;
}

// 권한 기록 — 실패해도 바꾼 것은 되돌리지 않는다 (로그만)
export async function audit(row) {
  const { error, status } = await db().from("account_audit").insert(row);
  if (error) console.error("[members] 권한 기록 실패", dbErrorCode(error, status));
}

export async function auditList(centerId, limit = 30) {
  const { data, error, status } = await db()
    .from("account_audit")
    .select("id, created_at, account_id, actor_id, action, before, after")
    .eq("center_id", centerId)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw fail(error, status);
  return data || [];
}

// 센터 가구 활동 기록에도 한 줄 — 관제 감사로그에 가입 · 승인이 보이게
export async function activityLine(household, accountId, role, type, summary) {
  try {
    await ensureHousehold(household);
    const { error, status } = await db().from("activity").insert({ household_id: household, account_id: accountId, role, type, summary: String(summary).slice(0, 300) });
    if (error) throw fail(error, status);
  } catch (e) {
    console.error("[members] 활동 기록 실패", dbErrorCode(e));
  }
}

// 그 센터의 사용 중인 사람 — 화면 이름(어르신 · 보호자 · 컨시어지 · 영업자)에 쓴다. 이름 · 역할만 (연락처는 싣지 않는다).
// 관제가 아닌 회원에게는 아이디를 보내지 않고 관제 회원도 빼고 보낸다 (2026-10-06 점검: 로그인 아이디가 다 보였다) — pages/api/household.js
export async function centerPeople(centerId) {
  const { data, error, status } = await db()
    .from("accounts")
    .select("id, name, role, created_at")
    .eq("center_id", centerId)
    .eq("status", "active")
    .not("password_hash", "is", null)
    .order("created_at", { ascending: true });
  if (error) throw fail(error, status);
  return (data || []).map((m) => ({ id: m.id, name: m.name, role: m.role }));
}

// 로그인한 회원이 아직 그 권한 그대로인지 — 관제가 정지 · 역할 변경하면 다음 요청부터 막는다.
// 같은 계정을 몇 초마다 묻지 않게 15초 동안 기억한다 (서버 인스턴스마다).
const cache = new Map();
const TTL = 15000;
export async function memberStillValid(user) {
  if (user?.provider !== "member") return { ok: true };
  const hit = cache.get(user.id);
  let row = hit && Date.now() - hit.at < TTL ? hit.row : null;
  if (!row) {
    const { data, error, status } = await db().from("accounts").select("status, role, center_id").eq("id", user.id).maybeSingle();
    if (error) throw fail(error, status);
    row = data || { status: "gone" };
    cache.set(user.id, { at: Date.now(), row });
  }
  if (row.status !== "active") return { ok: false, reason: row.status === "gone" ? "account-removed" : `account-${row.status}` };
  // 바뀐 역할의 입구(영역)는 본인에게만 알려 준다 — 다시 로그인할 곳으로 바로 보내려고
  if (row.role !== user.role || row.center_id !== user.center) return { ok: false, reason: "role-changed", area: row.center_id === user.center ? areaOfRole(row.role) : null };
  return { ok: true };
}
export const forgetMember = (id) => cache.delete(id);

export const memberArea = (m) => areaOfRole(m?.role);
