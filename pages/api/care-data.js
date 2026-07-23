/* ============================================================
 * 시니어케어매니저 · /api/care-data — 콘솔 부트스트랩 (오늘 예약 조회)
 * Supabase 미설정 시 { available:false } — 콘솔은 '연동 대기' 표기 후
 * 시드 데이터로 시연 완주 (가짜 수치 금지 원칙).
 * ============================================================ */
import { fetchTodayBookings } from "../../lib/careStore.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const r = await fetchTodayBookings();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  } catch (e) {
    return res.status(200).json({ available: true, ok: false, bookings: [], error: e.message });
  }
}
