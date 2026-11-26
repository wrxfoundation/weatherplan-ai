// 회원 · 관제 센터 — 서버(API 라우트 · 로그인)에서만 쓴다 (2026-10-06).
// 표는 supabase/schema.sql 의 centers · accounts(회원 칸) · account_audit. 비밀번호 해시는 이 파일 밖으로 내보내지 않는다.
import { db, dbErrorCode, ensureHousehold } from "./db";
import { CENTERS, areaOfRole, centerOfHousehold, isFamilyRole } from "./centers";

const MEMBER_COLS = "id, login_id, name, role, requested_role, status, phone, profile, center_id, household_id, provider, created_at, approved_by, approved_at, last_login_at";

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

// 초대 링크 하나로 가입한 사람 수 — 가입 신청에 남긴 표 번호(profile.invite)로 센다 (lib/invite.js · 거절된 것도 센다)
export async function inviteUses(jti) {
  const { count, error, status } = await db().from("accounts").select("id", { count: "exact", head: true }).eq("profile->>invite", jti);
  if (error) throw fail(error, status);
  return count || 0;
}

// 가입한 뒤 내 순번 — 동시에 여러 명이 가입하면 '세고 → 넣기' 사이로 한도를 넘을 수 있어, 넣은 뒤 먼저 들어온
// 순서(가입 시각 · 아이디)로 다시 세고 한도 밖이면 내 것을 지운다 (pages/api/join.js). 표를 따로 만들지 않는 방법.
async function rankOf(query, id) {
  const { data, error, status } = await query.order("created_at", { ascending: true }).order("id", { ascending: true }).limit(500);
  if (error) throw fail(error, status);
  return (data || []).findIndex((r) => r.id === id);
}
export const inviteRank = (jti, id) => rankOf(db().from("accounts").select("id").eq("profile->>invite", jti), id);
export const pendingRank = (centerId, id) => rankOf(db().from("accounts").select("id").eq("center_id", centerId).eq("status", "pending"), id);
// 방금 넣은 가입 신청을 되돌린다 — 승인 대기인 것만
export async function removePending(id) {
  const { error, status } = await db().from("accounts").delete().eq("id", id).eq("status", "pending");
  if (error) throw fail(error, status);
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

// 비밀번호 보안 표시 — accounts.profile 안의 sec 칸에 둔다 (2026-11-18 · 표를 바꾸지 않으려고 — 초대 표시 profile.invite 와 같은 방식).
//   sec.temp   관제가 발급한 임시 비밀번호 상태 — 로그인하면 새 비밀번호를 정해야 한다
//   sec.pwAt   비밀번호를 마지막으로 바꾼 때 — 그보다 먼저 로그인한 기기는 다시 로그인해야 한다
export const secOf = (profile) => (profile && typeof profile === "object" && profile.sec && typeof profile.sec === "object" ? profile.sec : {});

// 내 계정 확인용 — 비밀번호 해시까지 (확인에만 쓰고 응답에 싣지 않는다)
export async function memberWithHash(id) {
  const { data, error, status } = await db().from("accounts").select(`${MEMBER_COLS}, password_hash`).eq("id", id).maybeSingle();
  if (error) throw fail(error, status);
  return data;
}

// 비밀번호 바꾸기 — 해시와 보안 표시를 같이 적는다. temp: 관제가 발급한 임시 비밀번호. 잠금도 푼다 (잠금 칸이 없는 예전 표면 그 칸은 건너뛴다)
export async function setPassword(id, hash, { temp = false } = {}) {
  const m = await getMember(id);
  if (!m) return null;
  const profile = { ...(m.profile && typeof m.profile === "object" ? m.profile : {}), sec: { ...(temp ? { temp: true } : {}), pwAt: new Date().toISOString() } };
  let r = await db().from("accounts").update({ password_hash: hash, profile, failed_logins: 0, locked_until: null }).eq("id", id).not("password_hash", "is", null).select(MEMBER_COLS);
  if (r.error && dbErrorCode(r.error, r.status) === "schema-missing") r = await db().from("accounts").update({ password_hash: hash, profile }).eq("id", id).not("password_hash", "is", null).select(MEMBER_COLS);
  if (r.error) throw fail(r.error, r.status);
  return r.data?.[0] || null;
}

export async function patchMember(id, fields) {
  const { data, error, status } = await db().from("accounts").update(fields).eq("id", id).select(MEMBER_COLS);
  if (error) throw fail(error, status);
  return data?.[0] || null;
}

// 회원 계정 지우기 (2026-11-12 요청) — 그 센터의 회원 계정(비밀번호 해시가 있는 계정)만. 지운 줄 수를 돌려준다.
// 계정만 지운다 — 이 회원이 남긴 가구 기록 · 활동 기록 · 권한 변경 기록은 그대로다 (그 표들은 계정을 이름표로만 적는다).
export async function deleteMember(id, centerId) {
  const { data, error, status } = await db().from("accounts").delete().eq("id", id).eq("center_id", centerId).not("password_hash", "is", null).select("id");
  if (error) throw fail(error, status);
  return (data || []).length;
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
// allowTemp: 임시 비밀번호 상태에서도 통과시킨다 — 새 비밀번호를 정하는 요청(pages/api/account.js)만 쓴다
export async function memberStillValid(user, { allowTemp = false } = {}) {
  if (user?.provider !== "member") return { ok: true };
  const hit = cache.get(user.id);
  let row = hit && Date.now() - hit.at < TTL ? hit.row : null;
  if (!row) {
    const { data, error, status } = await db().from("accounts").select("status, role, center_id, household_id, created_at, profile").eq("id", user.id).maybeSingle();
    if (error) throw fail(error, status);
    row = data || { status: "gone" };
    cache.set(user.id, { at: Date.now(), row });
  }
  if (row.status !== "active") return { ok: false, reason: row.status === "gone" ? "account-removed" : `account-${row.status}` };
  // 이 로그인보다 나중에 만들어진 계정 — 관제가 지운 아이디를 누군가 다시 만든 것이다. 옛 기기의 로그인은 그 계정의 것이 아니다
  // (2026-11-18 점검 — 전에는 센터 · 역할 · 가족만 같으면 지워진 계정의 옛 로그인이 새 비밀번호 없이 되살아났다)
  // 로그인할 때 세션에 적어 둔 '계정이 만들어진 때'(born)와 지금 계정의 것이 다르면 다른 계정이다. born 이 없는 예전 세션은
  // 로그인한 때(since)와 견준다 (서버 · DB 시계 차이를 1분까지 봐준다)
  const joinedAt = Date.parse(row.created_at || "");
  if (user.born && Number.isFinite(joinedAt) && Number.isFinite(Date.parse(user.born)) && Date.parse(user.born) !== joinedAt) return { ok: false, reason: "account-removed" };
  if (!user.born && Number(user.since) > 0 && Number.isFinite(joinedAt) && joinedAt > Number(user.since) + 60000) return { ok: false, reason: "account-removed" };
  // 비밀번호가 이 로그인 뒤에 바뀌었다 (본인이 바꿨거나 관제가 임시 비밀번호를 발급) — 옛 로그인은 여기서 끝낸다 (2026-11-18).
  // 로그인한 때가 없는 예전 세션은 0 으로 본다 — 비밀번호를 한 번이라도 바꾼 계정이면 다시 로그인하게 된다
  const sec = secOf(row.profile);
  const pwAt = Date.parse(sec.pwAt || "");
  if (Number.isFinite(pwAt) && pwAt > Number(user.since || 0) + 1000) return { ok: false, reason: "password-changed", area: areaOfRole(row.role) };
  // 임시 비밀번호로 로그인한 채로는 기록을 읽고 쓰지 못한다 — 새 비밀번호를 정한 뒤에
  if (sec.temp && !allowTemp) return { ok: false, reason: "password-temp", area: areaOfRole(row.role) };
  // 바뀐 역할의 입구(영역)는 본인에게만 알려 준다 — 다시 로그인할 곳으로 바로 보내려고
  if (row.role !== user.role || row.center_id !== user.center) return { ok: false, reason: "role-changed", area: row.center_id === user.center ? areaOfRole(row.role) : null };
  // 관제가 이 회원을 다른 가족으로 옮겼다 (2026-11-12) — 세션에는 예전 가족이 실려 있으니 다시 로그인해 새 가족 기록을 연다
  if (isFamilyRole(row.role)) {
    const center = CENTERS[row.center_id];
    const home = center && centerOfHousehold(row.household_id)?.id === center.id ? row.household_id : center?.household;
    if (home && home !== user.household) return { ok: false, reason: "family-changed", area: areaOfRole(row.role) };
  }
  return { ok: true };
}
export const forgetMember = (id) => cache.delete(id);

export const memberArea = (m) => areaOfRole(m?.role);
