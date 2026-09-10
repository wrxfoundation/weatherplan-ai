/* ============================================================
 * Pick AI · Supabase(PostgREST) 경량 헬퍼 — 의존성 0
 *
 * SUPABASE_URL + SUPABASE_ANON_KEY 가 없으면 모든 함수가 조용히
 * null/false 를 반환한다 (이력·벤치마크 기능만 비활성, 진단은 무관).
 * ============================================================ */

const TABLE = "pickai_scans";

export function dbEnabled() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function headers(extra = {}) {
  return {
    apikey: process.env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function base() {
  return `${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${TABLE}`;
}

async function req(url, opts = {}, ms = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/* 진단 결과 1건 저장 (실패해도 예외를 밖으로 내지 않음) */
export async function insertScan(row) {
  if (!dbEnabled()) return false;
  try {
    const r = await req(base(), {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(row),
    });
    if (!r.ok) console.error("[db.insertScan]", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error("[db.insertScan]", e?.message || e);
    return false;
  }
}

/* 호스트별 최근 이력 (오래된 → 최신 순으로 반환) */
export async function getHistory(host, limit = 20) {
  if (!dbEnabled()) return null;
  try {
    const q = `${base()}?host=eq.${encodeURIComponent(host)}&is_benchmark=eq.false` +
      `&select=overall,grade,seo,aeo,geo,reach,http_status,source,engine,created_at` +
      `&order=created_at.desc&limit=${limit}`;
    const r = await req(q, { headers: headers() });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows.reverse();
  } catch {
    return null;
  }
}

/* 호스트의 직전 스캔 1건 (크론 변동 비교용) */
export async function getLatestScan(host) {
  if (!dbEnabled()) return null;
  try {
    const q = `${base()}?host=eq.${encodeURIComponent(host)}&is_benchmark=eq.false` +
      `&select=overall,grade,http_status,created_at&order=created_at.desc&limit=1`;
    const r = await req(q, { headers: headers() });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

/* 벤치마크 통계 — 호스트당 최신 1건 기준 분포 */
export async function getBenchmarkStats(myOverall = null) {
  if (!dbEnabled()) return null;
  try {
    const q = `${base()}?is_benchmark=eq.true&select=host,overall,created_at` +
      `&order=created_at.desc&limit=1000`;
    const r = await req(q, { headers: headers() });
    if (!r.ok) return null;
    const rows = await r.json();
    /* 호스트당 최신 1건만 */
    const latest = new Map();
    for (const row of rows) if (!latest.has(row.host)) latest.set(row.host, row.overall);
    const scores = [...latest.values()];
    const n = scores.length;
    if (n === 0) return { count: 0 };
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / n);
    let topPct = null;
    if (typeof myOverall === "number") {
      const better = scores.filter((v) => v > myOverall).length;
      topPct = Math.max(1, Math.round(((better + 1) / (n + 1)) * 100));
    }
    return { count: n, avg, topPct };
  } catch {
    return null;
  }
}
