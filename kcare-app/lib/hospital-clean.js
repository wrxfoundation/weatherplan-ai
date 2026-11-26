// 관제 병원 관리의 병원 한 곳 — 모양 검사 (2026-10-28 요청 2 · lib/hospitals.js).
// 기록 규칙(lib/state.js)이 쓰므로 예시 데이터 모듈을 불러오지 않는다 (화면 공통 묶음을 가볍게).
// 저장값은 여러 기기가 쓰는 입력이라 모양을 확인하고 넣는다 (lib/state.js saveHospital)
const TEXT_KEYS = ["name", "dept", "address", "phone", "hours", "travel", "parking", "wheelchair", "reception", "guardianNeeded", "caution", "verified", "slots"];
const ER = ["운영", "미운영", "확인 중"];
export function cleanHospital(h) {
  if (!h || typeof h !== "object") return null;
  const t = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const out = Object.fromEntries(TEXT_KEYS.map((k) => [k, t(h[k], k === "caution" ? 400 : 120)]));
  if (!out.name || !out.dept) return null;
  return {
    ...out,
    id: t(h.id, 40) || `h${Date.now()}`,
    partner: !!h.partner,
    fast: !!h.fast,
    er: ER.includes(h.er) ? h.er : "확인 중",
    mainFor: Array.isArray(h.mainFor) ? h.mainFor.map((x) => t(x, 20)).filter(Boolean).slice(0, 20) : [],
    booking: { status: t(h.booking?.status, 20) || "—", next: t(h.booking?.next, 80) },
    escorts: Array.isArray(h.escorts) ? h.escorts.slice(0, 30) : [],
    changes: Array.isArray(h.changes) ? h.changes.slice(-60) : [],
  };
}
