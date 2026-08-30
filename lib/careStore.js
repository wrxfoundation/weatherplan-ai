/* ============================================================
 * 시니어케어매니저 · /lib/careStore — Supabase 영속층 (서버 전용)
 *
 * 원칙 (dcmap 헤리티지):
 *  · 환경변수 미설정/실패 시 { available:false } — 가짜 저장 흉내 금지, UI는 '연동 대기'
 *  · SDK 의존성 없이 PostgREST fetch (배포 zip 경량 유지)
 *  · 타임아웃 4s 고정 — 저장 실패가 상담 응답을 지연·중단시키지 않는다
 *  · SUPABASE_SERVICE_ROLE_KEY는 서버 env 전용 — 클라이언트 노출 절대 금지
 * ============================================================ */

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storeAvailable = () => !!(URL_ && KEY);

async function pg(path, { method = "GET", body, query = "" } = {}) {
  if (!storeAvailable()) return { available: false };
  try {
    const res = await fetch(`${URL_}/rest/v1/${path}${query}`, {
      method,
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.warn(`[careStore] ${method} ${path} → ${res.status}`);
      return { available: true, ok: false, status: res.status };
    }
    const text = await res.text();
    return { available: true, ok: true, data: text ? JSON.parse(text) : null };
  } catch (e) {
    console.warn(`[careStore] ${method} ${path} 실패:`, e.message);
    return { available: true, ok: false, error: e.message };
  }
}

/* 세션 upsert (챗 시작~지속) */
export function upsertSession(sessionId, { channel = "web", demo = true } = {}) {
  if (!sessionId) return Promise.resolve({ available: storeAvailable(), ok: false });
  return pg("chat_sessions", {
    method: "POST",
    query: "?on_conflict=id",
    body: [{ id: sessionId, channel, demo }],
  });
}

/* 메시지 저장 (마지막 user + assistant 응답) */
export function saveMessages(sessionId, rows) {
  if (!sessionId || !rows?.length) return Promise.resolve({ available: storeAvailable(), ok: false });
  return pg("chat_messages", {
    method: "POST",
    body: rows.map((r) => ({ session_id: sessionId, role: r.role, content: String(r.content).slice(0, 8000), model: r.model, usage: r.usage })),
  });
}

/* 예약 저장 (booking 이벤트 → bookings 행) */
export function saveBooking(b, sessionId) {
  if (!b?.id) return Promise.resolve({ available: storeAvailable(), ok: false });
  return pg("bookings", {
    method: "POST",
    query: "?on_conflict=id",
    body: [{
      id: b.id, session_id: sessionId || null,
      service_type: b.service_type, manager_key: b.manager_id, manager_name: b.manager_name,
      hospital: b.hospital, date_text: `${b.date || ""}${b.time ? " " + b.time : ""}`.trim(), hours: b.hours,
      price: b.price, platform_fee: b.platform_fee, status: b.status || "confirmed",
      outing: b.outing || null, checklist: b.checklist || null, demo: true,
    }],
  });
}

/* 컨디션 스냅샷 저장 (weather 이벤트) */
export function saveOuting(ev, bookingId) {
  if (!ev) return Promise.resolve({ available: storeAvailable(), ok: false });
  return pg("outing_snapshots", {
    method: "POST",
    body: [{ booking_id: bookingId || null, location: ev.location, score: ev.score ?? null, verdict: ev.verdict || ev.grade, payload: ev }],
  });
}

/* 가족 프로필 upsert (진화 루프 — 예약 시점 병합 결과 저장) */
export function upsertFamilyProfile(key, profile) {
  if (!key || !profile) return Promise.resolve({ available: storeAvailable(), ok: false });
  return pg("family_profiles", {
    method: "POST",
    query: "?on_conflict=key",
    body: [{ key, profile, updated_at: new Date().toISOString() }],
  });
}

/* 오늘 예약 조회 (콘솔 부트스트랩) */
export async function fetchTodayBookings() {
  // '오늘' 경계는 KST 자정 — 서버(UTC)에서 setHours(0)를 쓰면 KST 09:00이 되어 양방향 오분류
  const kst = new Date(Date.now() + 9 * 3600e3);
  kst.setUTCHours(0, 0, 0, 0);
  const cutoff = new Date(kst.getTime() - 9 * 3600e3).toISOString();
  const r = await pg("bookings", {
    query: `?select=id,service_type,manager_key,manager_name,hospital,date_text,hours,price,status,outing&created_at=gte.${cutoff}&order=created_at.desc&limit=30`,
  });
  if (!r.available) return { available: false, bookings: [] };
  if (!r.ok) return { available: true, ok: false, bookings: [] };
  return { available: true, ok: true, bookings: r.data || [] };
}
