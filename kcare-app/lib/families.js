// 가족(가구) — 서버(API 라우트 · 로그인)에서만 쓴다 (2026-11-12).
//
// 한 관제 센터 안에 가족이 여럿이다. 가족마다 가구 기록(households 한 줄)과 가족 가입 코드가 하나씩 있다.
//   · 어르신 · 보호자는 가족 가입 코드(또는 가족이 보낸 초대 링크)로 가입해 그 가족에 들어간다 (accounts.household_id).
//   · 관제는 그 센터의 모든 가족을 본다. 컨시어지는 관제가 주 · 부 담당으로 지정한 가족만 본다.
//   · 파트너(영업)는 예전 그대로 첫 가족을 본다 (가족 기록을 쓰지 않는 화면이다).
// 어느 가족의 기록을 읽고 쓰는지는 서버가 정한다 — 어르신 · 보호자는 로그인 세션의 가구, 직원은 ?hh= 로 고른 가족을
// 그 센터 것인지 · 볼 수 있는지 확인한 뒤에. 표의 새 칸은 supabase/families.sql (label · join_code · created_by).
import { randomBytes } from "crypto";
import { db, dbErrorCode, ensureHousehold } from "./db";
import { CENTERS, centerOfHousehold, familyIdOf, familyTitle, isFamilyRole, isFirstFamily } from "./centers";
import { newJoinCode } from "./password";
import { familySummary, isAssigned } from "./family-summary";

const fail = (error, status) => Object.assign(error, { status });
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newTail = () => Array.from(randomBytes(6), (x) => A[x % A.length]).join("");

const BASE_COLS = "id, label, join_code, center_id, version, created_at, updated_at, created_by";
// 요약에 필요한 칸만 꺼낸다 — 가구 상태 전체(상품 사진까지 수 MB)를 가족 수만큼 읽지 않게
const PARTS = "demo:state->demo, requests:state->requests, events:state->events, msgs:state->opsMessages, staff:state->elderStaff, plan:state->plan, onboarding:state->onboarding";

// 가족 가입 코드 → 가족. 없으면 null. 표에 새 칸이 아직 없으면(families.sql 실행 전) 오류 코드 schema-missing 으로 던진다
export async function familyByCode(code) {
  const { data, error, status } = await db().from("households").select("id, label, center_id").eq("join_code", code).maybeSingle();
  if (error) throw fail(error, status);
  const center = data ? centerOfHousehold(data.id) : null;
  return center ? { id: data.id, label: data.label || null, center } : null;
}

// 가족 가입 칸이 준비됐는지 (families.sql 을 돌렸는지) — 안 돌렸으면 예전 방식(센터 코드 하나)으로 가입을 받는다
export async function familiesReady() {
  const { error, status } = await db().from("households").select("id, label, join_code").limit(1);
  if (!error) return true;
  if (dbErrorCode(error, status) === "schema-missing") return false;
  throw fail(error, status);
}

const ensured = new Set();
async function rowsOf(centerId, cols) {
  const first = CENTERS[centerId].household;
  // 아무도 들어온 적 없는 센터도 첫 가족 한 줄은 있게 (서버 인스턴스마다 한 번만)
  if (!ensured.has(first)) {
    await ensureHousehold(first);
    ensured.add(first);
  }
  const { data, error, status } = await db()
    .from("households")
    .select(cols)
    .or(`center_id.eq.${centerId},id.eq.${first}`)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw fail(error, status);
  // 번호 앞머리가 이 센터인 것만 (센터 번호 칸이 잘못 적힌 줄이 섞이지 않게)
  return (data || []).filter((r) => centerOfHousehold(r.id)?.id === centerId);
}

// 그 센터의 가족 구성원(어르신 · 보호자) — 가족별로 묶는다. 이름 · 역할 · 상태만
async function membersByFamily(centerId) {
  const { data, error, status } = await db()
    .from("accounts")
    .select("id, name, role, status, household_id, created_at")
    .eq("center_id", centerId)
    .not("password_hash", "is", null)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) throw fail(error, status);
  const first = CENTERS[centerId].household;
  const map = new Map();
  (data || [])
    .filter((m) => isFamilyRole(m.role))
    .forEach((m) => {
      const hh = centerOfHousehold(m.household_id)?.id === centerId ? m.household_id : first;
      if (!map.has(hh)) map.set(hh, []);
      map.get(hh).push(m);
    });
  return map;
}

const viewOf = (row, members, { withCode }) => {
  const mine = members || [];
  const active = mine.filter((m) => m.status === "active");
  const names = (role) => active.filter((m) => m.role === role).map((m) => String(m.name || "").trim()).filter(Boolean);
  const s = familySummary(row);
  const f = {
    id: row.id,
    first: isFirstFamily(row.id),
    label: row.label || null,
    elders: names("elder"),
    guardians: names("guardian"),
    members: mine.filter((m) => m.status !== "rejected").length,
    pending: mine.filter((m) => m.status === "pending").length,
    saved: (row.version || 0) > 0,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    ...s,
  };
  if (withCode) f.code = row.join_code || null;
  f.title = familyTitle(f);
  return f;
};

// 가족 목록 + 요약. 컨시어지에게는 자기가 주 · 부 담당인 가족만, 가입 코드 없이
export async function listFamilies(centerId, user) {
  const [rows, members] = await Promise.all([rowsOf(centerId, `${BASE_COLS}, ${PARTS}`), membersByFamily(centerId)]);
  const ops = user?.role === "ops";
  const all = rows.map((r) => viewOf(r, members.get(r.id), { withCode: ops }));
  return ops ? all : all.filter((f) => isAssigned(f, user?.name));
}

// 이름만 — 계정 · 권한 화면의 '가족' 칸 · 옮길 곳 고르기
export async function familyNames(centerId) {
  const [rows, members] = await Promise.all([rowsOf(centerId, "id, label, created_at, onboarding:state->onboarding"), membersByFamily(centerId)]);
  return rows.map((r) => {
    const f = viewOf({ ...r, version: 0 }, members.get(r.id), { withCode: false });
    return { id: f.id, first: f.first, title: f.title };
  });
}

export async function familyRow(id) {
  const { data, error, status } = await db().from("households").select(BASE_COLS).eq("id", id).maybeSingle();
  if (error) throw fail(error, status);
  return data;
}

const cleanLabel = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 30);

// 센터 가입 코드와 겹치는 가족 코드는 쓰지 않는다 — 가입할 때 가족 코드를 먼저 보므로, 겹치면 직원 가입이 막힌다
async function clashesWithCenter(code) {
  const { data, error, status } = await db().from("centers").select("id").eq("join_code", code).limit(1);
  if (error) throw fail(error, status);
  return (data || []).length > 0;
}
async function freshCode() {
  for (let i = 0; i < 5; i++) {
    const code = newJoinCode();
    if (!(await clashesWithCenter(code))) return code;
  }
  throw new Error("code-failed");
}

// 새 가족 — 가구 한 줄과 가족 가입 코드. 번호 · 코드가 겹치면 다시 뽑는다
export async function createFamily(centerId, { label, by }) {
  for (let i = 0; i < 5; i++) {
    const id = familyIdOf(centerId, newTail());
    const row = { id, name: CENTERS[centerId].name, label: cleanLabel(label) || null, is_test: true, center_id: centerId, join_code: await freshCode(), created_by: String(by || "").slice(0, 60) || null };
    const { data, error, status } = await db().from("households").insert(row).select(BASE_COLS);
    if (!error) return data?.[0] || row;
    if (String(error.code) !== "23505") throw fail(error, status);
  }
  throw new Error("code-failed");
}

export async function renameFamily(id, label) {
  const { data, error, status } = await db().from("households").update({ label: cleanLabel(label) || null }).eq("id", id).select(BASE_COLS);
  if (error) throw fail(error, status);
  return data?.[0] || null;
}

// 가족 가입 코드 새로 만들기 — 옛 코드는 바로 막힌다 (이미 가입한 사람은 그대로)
export async function rotateFamilyCode(id) {
  for (let i = 0; i < 5; i++) {
    const { data, error, status } = await db().from("households").update({ join_code: await freshCode() }).eq("id", id).select(BASE_COLS);
    if (!error) return data?.[0] || null;
    if (String(error.code) !== "23505") throw fail(error, status);
  }
  throw new Error("code-failed");
}

// 빈 가족 지우기 — 잘못 만든 가족 정리용. 구성원이 하나도 없고 기록을 한 번도 저장하지 않은 가족만 (첫 가족은 지우지 않는다)
export async function deleteEmptyFamily(id) {
  if (isFirstFamily(id)) return { ok: false, why: "first" };
  const { count, error, status } = await db().from("accounts").select("id", { count: "exact", head: true }).eq("household_id", id);
  if (error) throw fail(error, status);
  if ((count || 0) > 0) return { ok: false, why: "has-members" };
  const del = await db().from("households").delete().eq("id", id).eq("version", 0).select("id");
  if (del.error) throw fail(del.error, del.status);
  return (del.data || []).length ? { ok: true } : { ok: false, why: "has-records" };
}

// 그 가족 화면에 쓰는 사람 이름 — 이 가족의 어르신 · 보호자 + 센터의 컨시어지 · 파트너 · 관제.
// 이름 · 역할만 (연락처는 싣지 않는다). 관제가 아닌 회원에게는 아이디 없이 · 관제 회원은 빼고 보낸다 — pages/api/household.js
export async function familyPeople(centerId, household) {
  const { data, error, status } = await db()
    .from("accounts")
    .select("id, name, role, household_id, created_at")
    .eq("center_id", centerId)
    .eq("status", "active")
    .not("password_hash", "is", null)
    .order("created_at", { ascending: true });
  if (error) throw fail(error, status);
  const first = CENTERS[centerId].household;
  const homeOf = (m) => (centerOfHousehold(m.household_id)?.id === centerId ? m.household_id : first);
  return (data || []).filter((m) => !isFamilyRole(m.role) || homeOf(m) === household).map((m) => ({ id: m.id, name: m.name, role: m.role }));
}

// 회원 계정의 가구 — 어르신 · 보호자는 가입한 가족, 그 밖(직원)은 센터의 첫 가족을 세션에 싣는다 (직원은 화면에서 가족을 고른다)
export const homeOfMember = (m, center) => (isFamilyRole(m?.role) && centerOfHousehold(m?.household_id)?.id === center.id ? m.household_id : center.household);

// ── 이 요청이 어느 가족의 기록을 보는가 ──
//   어르신 · 보호자 · 테스트 가구   로그인 세션의 가구 (요청 값이 다르면 거절한다)
//   관제                          ?hh= 로 고른 그 센터의 가족. 없으면 첫 가족
//   컨시어지                      ?hh= 로 고른, 자기가 주 · 부 담당인 가족. 없으면 담당 가족 중 첫 번째 — 하나도 없으면 no-family
//   파트너(영업)                   첫 가족
// 같은 것을 몇 초마다 묻지 않게 잠깐 기억한다 (서버 인스턴스마다 — 담당이 바뀌면 15초 안에 따라온다)
const seen = new Map();
const TTL = 15000;
const remember = (key, value) => {
  if (seen.size > 5000) for (const [k, v] of seen) if (Date.now() - v.at > TTL) seen.delete(k);
  seen.set(key, { at: Date.now(), value });
  return value;
};
const recall = (key) => {
  const hit = seen.get(key);
  return hit && Date.now() - hit.at < TTL ? hit.value : undefined;
};
export const forgetFamilyAccess = () => seen.clear();

async function staffOf(household) {
  const { data, error, status } = await db().from("households").select("id, staff:state->elderStaff").eq("id", household).maybeSingle();
  if (error) throw fail(error, status);
  return data ? familySummary({ staff: data.staff }) : null;
}

export async function householdOf(req, user) {
  const asked = typeof req?.query?.hh === "string" ? req.query.hh.trim() : "";
  const center = CENTERS[user?.center] || null;
  // 센터 밖(테스트 가구 1) · 어르신 · 보호자 — 세션의 가구만
  if (!center || isFamilyRole(user.role)) {
    if (asked && asked !== user.household) return { error: "family-not-allowed", status: 403 };
    return { household: user.household, center };
  }
  if (asked && centerOfHousehold(asked)?.id !== center.id) return { error: "family-not-allowed", status: 403 };

  if (user.role === "ops") {
    const hh = asked || center.household;
    if (isFirstFamily(hh)) return { household: hh, center };
    const key = `ops|${hh}`;
    let ok = recall(key);
    if (ok === undefined) ok = remember(key, !!(await familyRow(hh)));
    return ok ? { household: hh, center } : { error: "family-not-found", status: 404 };
  }

  if (user.role === "concierge") {
    if (asked) {
      const key = `c|${user.id}|${asked}`;
      let ok = recall(key);
      if (ok === undefined) ok = remember(key, isAssigned(await staffOf(asked), user.name));
      return ok ? { household: asked, center } : { error: "family-not-allowed", status: 403 };
    }
    const key = `c|${user.id}|*`;
    let mine = recall(key);
    if (mine === undefined) {
      const rows = await rowsOf(center.id, "id, created_at, staff:state->elderStaff");
      mine = remember(key, rows.find((r) => isAssigned(familySummary({ staff: r.staff }), user.name))?.id || null);
    }
    return mine ? { household: mine, center } : { error: "no-family", status: 404 };
  }

  // 파트너(영업) — 가족을 고르지 않는다
  return { household: center.household, center };
}
