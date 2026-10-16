// 테스트 계정 한 역할의 마지막 앱 사용 — 감사로그와 같은 기록(/api/activity)에서 가장 최근 한 줄 (2026-10-02).
// 관제 웨어러블(어르신 앱 신호) · 보호자 관리(마지막 접속)가 쓴다. 로그인하지 않았으면 부르지 않는다.
import { useEffect, useState } from "react";

export function useLastActivity(role, enabled = true, everyMs = 30000) {
  const [last, setLast] = useState({ status: "idle", at: null, summary: "" });
  useEffect(() => {
    if (!enabled || !role) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/activity?role=${encodeURIComponent(role)}&limit=1`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) return setLast({ status: "error", at: null, summary: "" });
        const row = (j.rows || [])[0];
        setLast(row ? { status: "ok", at: Date.parse(row.created_at) || null, summary: row.summary || row.type } : { status: "none", at: null, summary: "" });
      } catch (_) {
        if (alive) setLast({ status: "error", at: null, summary: "" });
      }
    };
    load();
    const t = setInterval(load, everyMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [role, enabled, everyMs]);
  return last;
}

const KST = 9 * 3600 * 1000;
export const lastText = (last) =>
  last.status === "ok" && last.at
    ? `${new Date(last.at + KST).toISOString().slice(5, 16).replace("T", " ")} · ${last.summary}`
    : last.status === "none"
      ? "아직 기록 없음"
      : last.status === "error"
        ? "기록을 불러오지 못했습니다"
        : "불러오는 중";
