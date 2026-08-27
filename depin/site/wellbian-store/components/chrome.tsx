"use client";
/* GNB · 푸터 · 커뮤니티 패널 · ImageSlot — 공통 크롬 (PRD §5.4 / §5.7 / §6.1 S9) */
import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/data";
import { useI18n, type Lang } from "@/lib/i18n";
import { TgIcon, XIcon } from "./icons";

/* KO/EN 토글 (§5.4) — 전 페이지 공용, localStorage 유지 */
export function LangToggle() {
  const { lang, setLang } = useI18n();
  const seg = (l: Lang, label: string) => (
    <button
      key={l}
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      style={{
        padding: "6px 10px", fontSize: 15.5, fontWeight: 700,
        ...(lang === l ? { background: "var(--w-deep)", color: "#fff" } : { color: "var(--hint)", background: "transparent" }),
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", border: "1px solid var(--bd-btn)", borderRadius: 8, overflow: "hidden" }}>
      {seg("ko", "KO")}
      {seg("en", "EN")}
    </div>
  );
}

/* GNB: 로고 + 「제품」 1항목 + KO/EN 토글 (§5.4) + 상태형 우측 슬롯(완판 → 소식 CTA) */
export function Gnb({ dday, right }: { dday?: string; right?: React.ReactNode }) {
  const { en } = useI18n();
  return (
    <header
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, padding: "0 40px", borderBottom: "1px solid var(--line)",
        background: "#fff", position: "sticky", top: 0, zIndex: 50,
      }}
      className="gnb-root"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Link href="/" style={{ display: "inline-flex" }}>
          <Image src="/assets/wb-black.png" alt="wellbian" width={110} height={22} style={{ height: 29, width: "auto" }} priority />
        </Link>
        <nav style={{ display: "flex", gap: 26, fontSize: 18, fontWeight: 600, color: "var(--ink-2)" }} className="desk-only">
          <Link href="/" style={{ color: "inherit" }}>{en ? "Product" : "제품"}</Link>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {dday && (
          <span className="mob-only pill" style={{ fontSize: 13.5, fontWeight: 800, color: "var(--w-main)", background: "var(--w-tint)", borderRadius: 6, padding: "4px 7px" }}>
            {dday}
          </span>
        )}
        <LangToggle />
      </div>
    </header>
  );
}

/* 서브 페이지 헤더 (로고 + 우측 슬롯 + 토글) */
export function SubHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 36px", borderBottom: "1px solid var(--line)", background: "#fff" }}>
      <Link href="/" style={{ display: "inline-flex" }}>
        <Image src="/assets/wb-black.png" alt="wellbian" width={100} height={20} style={{ height: 26, width: "auto" }} />
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {right}
        <LangToggle />
      </div>
    </header>
  );
}

/* 커뮤니티 패널 + 다크 푸터 (S9) */
export function CommunityFooter() {
  const { en } = useI18n();
  return (
    <div style={{ background: "var(--w-deep)", color: "#fff", padding: "72px 64px 40px" }} className="s9-root">
      <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div className="s9-invite" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, border: "1px solid rgba(255,255,255,.14)", borderRadius: 18, padding: "32px 36px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 27.5, fontWeight: 800 }}>
              {en ? "Get updates in the official community" : "Official 커뮤니티에서 소식을 받아보세요"}
            </div>
            <div style={{ fontSize: 17.5, color: "rgba(255,255,255,.6)" }}>
              {en ? "Shipping schedules, setup guides, and network updates — delivered first" : "발송 일정 · 연동 가이드 · 네트워크 업데이트를 가장 먼저 전합니다"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main" style={{ fontSize: 18, borderRadius: 10, padding: "13px 20px", color: "#fff", textDecoration: "none" }}>
              <TgIcon size={15} /> {en ? "Join the community" : "커뮤니티 입장"}
            </a>
            <a href={LINKS.x} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 18, fontWeight: 800, borderRadius: 10, padding: "13px 20px", textDecoration: "none" }}>
              <XIcon size={14} /> {en ? "Follow for updates" : "소식 팔로우"}
            </a>
          </div>
        </div>
        <div className="s9-brands" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 28, flexWrap: "wrap" }}>
          {/* 브랜드 행 — 로고 광학 크기 (8/28 서우): wellbian 26 / xrpl 22 (+20%) / kw 11 유지 */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <Image src="/assets/wb-white.png" alt="wellbian" width={593} height={215} style={{ height: 26, width: "auto", opacity: 0.95 }} />
            <span style={{ fontSize: 14.5, color: "rgba(255,255,255,.4)" }}>POWERED BY</span>
            <Image src="/assets/xrpl-white.png" alt="XRP Ledger" width={609} height={154} style={{ height: 22, width: "auto", opacity: 0.9 }} />
            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.25)" }} />
            {/* 케이웨더 정식 CI(화이트) — 8/27 서우 수급. 헤비 대문자 워드마크라 광학 보정으로 축소 (8/28: 16→11px) */}
            <Image src="/assets/kw-white.png" alt="KWEATHER" width={283} height={39} style={{ height: 11, width: "auto", opacity: 0.9 }} />
          </div>
          <nav style={{ display: "flex", gap: 20, fontSize: 16, color: "rgba(255,255,255,.65)", flexWrap: "wrap" }}>
            <a href={LINKS.terms} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "none" }}>
              {en ? "Terms of Service (TERMS)" : "이용약관 (TERMS)"}
            </a>
          </nav>
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,.35)" }}>
          © 2026 WELLBIAN. All rights reserved. · {en ? "Weather Data Token Generator™ (Indoor Air Quality Monitor) · Model ARC-600DA" : "날씨데이터토큰생성기™ (실내공기측정기) · 모델명 ARC-600DA"}
        </div>
      </div>
    </div>
  );
}

/* 이미지 슬롯 — 렌더 에셋 수급 전 placeholder (PRD §10) */
export function ImageSlot({ w, h, r = 18, label = "제품 렌더 이미지" }: { w: number | string; h: number; r?: number; label?: string }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: r,
        background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
        border: "1.5px dashed rgba(140,140,180,.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: "var(--hint)", textAlign: "center", padding: 16,
      }}
    >
      {label} (에셋 수급 시 교체)
    </div>
  );
}
