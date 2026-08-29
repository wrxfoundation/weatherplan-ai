"use client";
/* GNB · 푸터 · 커뮤니티 패널 · ImageSlot — 공통 크롬 (PRD §5.4 / §5.7 / §6.1 S9) */
import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/data";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { D } from "@/lib/dict";
import { TgIcon, XIcon } from "./icons";

/* 언어 선택 (§5.4) — 전 페이지 공용, localStorage 유지.
   8/28 서우: KO/EN 2단 토글 → 5개 언어 드롭다운.
   커스텀 팝오버 대신 <select> 를 쓴다 — 모바일에서 OS 기본 피커가 뜨고,
   키보드·스크린리더 대응이 공짜로 따라온다. 화살표만 직접 그린다. */
export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label="Language"
        /* 글자·패딩은 CSS 로 — 320px 급에서 5개 언어 라벨("Español")이 GNB 를 밀어내
           페이지가 가로로 스크롤됐다. 인라인에 두면 미디어 쿼리로 줄일 수가 없다. */
        className="lang-sel"
        style={{
          appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
          border: "1px solid var(--bd-btn)", borderRadius: 8, background: "transparent",
          color: "var(--ink-2)", fontWeight: 700, fontFamily: "inherit",
          cursor: "pointer", lineHeight: 1.5,
        }}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      {/* 화살표 — select 위에 얹되 클릭은 통과시킨다 */}
      <svg
        aria-hidden
        width="10" height="6" viewBox="0 0 10 6"
        style={{ position: "absolute", right: 11, pointerEvents: "none" }}
      >
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      </svg>
    </div>
  );
}

/* GNB: 로고 + 「LAUNCH」 1항목 + KO/EN 토글 (§5.4) + 상태형 우측 슬롯(완판 → 소식 CTA) */
export function Gnb({ dday, right }: { dday?: string; right?: React.ReactNode }) {
  const { en, t } = useI18n();
  return (
    <header
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        /* 8/28 서우: GNB 로고 2배(29→58px) — 64px 헤더에는 안 들어가 88px로 올린다 */
        height: 88, padding: "0 40px", gap: 14, borderBottom: "1px solid var(--line)",
        background: "#fff", position: "sticky", top: 0, zIndex: 50,
      }}
      className="gnb-root"
    >
      {/* flexShrink: 0 — 이게 없으면 좁은 폭에서 이 그룹이 줄어들며 로고가 우측 그룹 위로 겹친다 */}
      <div style={{ display: "flex", alignItems: "center", gap: 36, flexShrink: 0 }}>
        <Link href="/" style={{ display: "inline-flex", flexShrink: 0 }}>
          {/* width/height는 실제 픽셀(593x215)로 — 기존 110x22는 비율이 어긋나 레이아웃 예약 공간이 틀렸다 */}
          <Image src="/assets/wb-black.png" alt="wellbian" width={593} height={215} className="gnb-logo" priority />
        </Link>
        <nav style={{ display: "flex", gap: 26, fontSize: 18, fontWeight: 600, color: "var(--ink-2)" }} className="desk-only">
          {/* 8/28 서우: 「제품」 → LAUNCH. KO/EN 공통 표기라 언어 분기를 두지 않는다 */}
          <Link href="/" style={{ color: "inherit", letterSpacing: ".02em" }}>LAUNCH</Link>
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
/* showNotice — 판매 조건 * 주석을 커뮤니티 패널 위에 붙인다 (8/29 서우: 히어로 하단에서 이동).
   응모 접수 중(pre)에만 의미가 있는 문구라 표시 여부는 Landing 이 정한다. */
export function CommunityFooter({ showNotice = false }: { showNotice?: boolean }) {
  const { en, t } = useI18n();
  return (
    <div style={{ background: "var(--w-deep)", color: "#fff", padding: "72px 64px 40px" }} className="s9-root">
      <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {showNotice && (
          <div className="s9-notice" style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,.55)", maxWidth: 760 }}>
            <div>* {t(D.noticeDraw)}</div>
            <div>* {t(D.noticeWinners)}</div>
            <div>* {t(D.noticeGenesis)}</div>
            <div>* {t(D.noticeTicket)}</div>
            <div style={{ marginTop: 7 }}>{t(D.noticeShipping)}</div>
          </div>
        )}
        <div className="s9-invite" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, border: "1px solid rgba(255,255,255,.14)", borderRadius: 18, padding: "32px 36px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 27.5, fontWeight: 800 }}>
              {t(D.footCta)}
            </div>
            <div style={{ fontSize: 17.5, color: "rgba(255,255,255,.6)" }}>
              {t(D.footSub)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main" style={{ fontSize: 18, borderRadius: 10, padding: "13px 20px", color: "#fff", textDecoration: "none" }}>
              <TgIcon size={15} /> {t(D.joinCommunity)}
            </a>
            <a href={LINKS.x} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 18, fontWeight: 800, borderRadius: 10, padding: "13px 20px", textDecoration: "none" }}>
              <XIcon size={14} /> {t(D.followUpdates)}
            </a>
          </div>
        </div>
        <div className="s9-brands" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 28, flexWrap: "wrap" }}>
          {/* 브랜드 행 — 로고 광학 크기 (8/28 서우): wellbian 26 / xrpl 22 (+20%) / kw 11 유지 */}
          {/* sizes 를 주는 이유 (8/29): 없으면 next/image 가 width prop(원본 폭) 기준으로 2x 후보를
              고른다. xrpl-white 는 609px 라 2x 후보가 w=1920 이 되는데, 이 파일만 그 크기에서
              옵티마이저가 응답하지 않아(25초 타임아웃 재현) 레티나에서 XRP Ledger 로고가
              통째로 비었다. 실제 렌더 폭은 셋 다 80~105px 이므로 140px 로 선언해
              작은 후보(384px 이하)만 받게 한다 — 화질 손해 없이 요청 크기도 줄어든다. */}
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <a href={LINKS.wellbian} target="_blank" rel="noopener" className="foot-logo" aria-label="wellbian">
              <Image src="/assets/wb-white.png" alt="wellbian" width={593} height={215} sizes="140px" style={{ height: 31.2, width: "auto", display: "block" }} />
            </a>
            {/* 8/28 서우: 모바일은 wellbian 로고 다음 줄부터 POWERED BY (flex 강제 개행) */}
            <span className="mob-only" aria-hidden style={{ display: "block", flexBasis: "100%", width: "100%", height: 0 }} />
            <span style={{ fontSize: 14.5, color: "rgba(255,255,255,.4)" }}>POWERED BY</span>
            <a href={LINKS.xrpl} target="_blank" rel="noopener" className="foot-logo" aria-label="XRP Ledger">
              <Image src="/assets/xrpl-white.png" alt="XRP Ledger" width={609} height={154} sizes="140px" style={{ height: 26.4, width: "auto", display: "block" }} />
            </a>
            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,.25)" }} />
            {/* 케이웨더 정식 CI(화이트) — 8/27 서우 수급. 헤비 대문자 워드마크라 광학 보정으로 축소 (8/28: 16→11px) */}
            <a href={LINKS.kweather} target="_blank" rel="noopener" className="foot-logo" aria-label="KWEATHER">
              <Image src="/assets/kw-white.png" alt="KWEATHER" width={283} height={39} sizes="140px" style={{ height: 11, width: "auto", display: "block" }} />
            </a>
          </div>
          <nav style={{ display: "flex", gap: 20, fontSize: 16, color: "rgba(255,255,255,.65)", flexWrap: "wrap" }}>
            <a href={LINKS.terms} target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "none" }}>
              {t(D.terms)}
            </a>
          </nav>
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,.35)" }}>
          © 2026 WELLBIAN. All rights reserved. · {/* 8/28 서우: 푸터에서 (실내공기측정기)·모델명 제거 — 제품 정식명만 남긴다 */}
          {t(D.productName)}
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
