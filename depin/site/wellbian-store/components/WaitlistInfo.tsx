"use client";
/* GNB 우측 「응모·순번 안내」 칩 — 서브페이지(/waitlist/guide)로 이동
   (플로팅 모달 → 서브페이지 전환: 그룹별 참여 예시까지 담기 위해) */
import Link from "next/link";

export default function WaitlistInfoChip({ deskOnly = false }: { deskOnly?: boolean }) {
  return (
    <Link
      href="/waitlist/guide"
      className={deskOnly ? "desk-only" : undefined}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--w-deep)", border: "1px solid var(--bd-btn)", borderRadius: 8, padding: "7px 11px", background: "#fff", whiteSpace: "nowrap", textDecoration: "none" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: 99, background: "var(--w-tint)", color: "var(--w-main)", fontSize: 10, fontWeight: 800 }}>?</span>
      응모·순번 안내
    </Link>
  );
}
