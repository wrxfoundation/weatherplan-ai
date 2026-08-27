"use client";
/* 판매 랜딩 S0~S9 (PRD §6.1) + 엣지 상태 1h/1i (§6.4) — KO/EN 토글 지원 (§5.4)
   EN 히어로 헤드라인 = 확정 슬로건 "Turn Your Weather Data into Value" (8/27 진행보고 기준,
   Data 포함으로 재확정 — 상표 출원 문자열과 일치 여부는 변리사 트랙에서 재확인) */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SPECS, SPECS_EN, FAQS, FAQS_EN, FAQS_EXTRA, FAQS_EXTRA_EN, LINK_STEPS, LINK_STEPS_EN,
  RL_STEPS, RL_STEPS_EN, LINKS, MOCK_INVENTORY, MOCK_PRENOTIFY, PREORDER_FEED, PRICE, calc, fmt,
  NOTICE_REWARD, NOTICE_REWARD_EN, type SalePhase,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { Gnb, CommunityFooter } from "./chrome";
import BuyModal from "./BuyModal";
import { XIcon, TgIcon, ChevD, Shield, ShieldCheck, Gauge, Coin, Chart, Warn } from "./icons";

export default function Landing() {
  const sp = useSearchParams();
  const { en } = useI18n();
  const stateParam = sp.get("state");
  const demoMismatch = sp.get("demo") === "mismatch"; // 결제 mismatch 분기 재현용 (내부 데모)
  const phase: SalePhase =
    stateParam === "eb_closed" ? "general" : stateParam === "sold_out" ? "sold_out" : "early_bird";
  /* 사전예약(PRE-ORDER) 시뮬레이션 (8/27 서우 개정: 알림 아니라 예약구매, 9/5 오픈): ?state=teaser = 사전예약 진행 중 / ?state=dday = 오픈 전 카운트다운 */
  const preMode: "pre" | "dday" | null =
    stateParam === "teaser" ? "pre" : stateParam === "dday" ? "dday" : null;

  const inv = MOCK_INVENTORY[phase]; // GET /api/inventory 대응 지점
  const { remain, pct, ebPct, genPct } = calc(inv);
  const soldOut = phase === "sold_out";
  const ebClosed = phase !== "early_bird";
  const curPrice = ebClosed ? PRICE.gen : PRICE.eb;

  const specs = en ? SPECS_EN : SPECS;
  const faqs = en ? FAQS_EN : FAQS;
  const linkSteps = en ? LINK_STEPS_EN : LINK_STEPS;
  const rlSteps = en ? RL_STEPS_EN : RL_STEPS;

  const [modal, setModal] = useState(false);
  const [banner, setBanner] = useState(false);
  /* 1h 배너 잔여 수량 카운트업 (0 → genLeft, 1.2s ease-out) */
  const [bannerCount, setBannerCount] = useState(0);
  useEffect(() => {
    if (!(phase !== "early_bird" && phase !== "sold_out")) return;
    const target = inv.genLeft;
    const t0 = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setBannerCount(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, inv.genLeft]);
  const [sticky, setSticky] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  /* 접기/펴기 인라인 확장 3종 (8/27) — 연동 가이드 · RLUSD 가이드 · 전체 FAQ */
  const [walletGuideOpen, setWalletGuideOpen] = useState(false);
  const [rlGuideOpen, setRlGuideOpen] = useState(false);
  const [faqAllOpen, setFaqAllOpen] = useState(false);
  const faqList = faqAllOpen ? [...faqs, ...(en ? FAQS_EXTRA_EN : FAQS_EXTRA)] : faqs;
  const heroCtaRef = useRef<HTMLDivElement>(null);

  /* 히어로 배경 롤링 (8/27 후보 4장 비교) — 6초 크로스페이드, reduced-motion 시 고정 */
  const [heroBg, setHeroBg] = useState(0);
  useEffect(() => {
    if (HERO_BGS.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setHeroBg((i) => (i + 1) % HERO_BGS.length), 6000);
    return () => clearInterval(t);
  }, []);

  /* 제품 스펙 갤러리 (8/27) — 5초 자동 롤링 + 수동 내비, 스펙 표는 더보기로 감춤 */
  const [specImg, setSpecImg] = useState(0);
  const [specOpen, setSpecOpen] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setSpecImg((i) => (i + 1) % SPEC_GALLERY.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* 사전 알림 누적 카운트업 (teaser) + 오픈 카운트다운 (dday) — 목값 */
  const [notifyCount, setNotifyCount] = useState(0);
  useEffect(() => {
    if (preMode !== "pre") return;
    const t0 = performance.now(); const dur = 1200; let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setNotifyCount(Math.round(MOCK_PRENOTIFY * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [preMode]);
  const [countdown, setCountdown] = useState(7 * 3600 + 23 * 60 + 45); // 데모: 오픈까지 07:23:45
  useEffect(() => {
    if (preMode !== "dday") return;
    const t = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [preMode]);
  const cd = `${String(Math.floor(countdown / 3600)).padStart(2, "0")}:${String(Math.floor((countdown % 3600) / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`;

  /* 스티키 바: 히어로 CTA가 뷰포트를 벗어나면 표시 (PRD §8) */
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const buy = () => setModal(true);

  /* 1h 배너 1회성: 닫으면 세션 동안 다시 띄우지 않음 (PRD §6.4) */
  useEffect(() => {
    try { if (!sessionStorage.getItem("wb-eb-banner-closed")) setBanner(true); } catch { setBanner(true); }
  }, []);
  const dismissBanner = () => {
    setBanner(false);
    try { sessionStorage.setItem("wb-eb-banner-closed", "1"); } catch {}
  };

  return (
    <div style={{ background: "#fff" }}>
      {/* GNB 우측 상태형 슬롯: 판매 중 = 완판 화면 미리보기 칩 / 완판 = 소식 CTA */}
      <Gnb
        dday={preMode ? "D-07" : soldOut ? undefined : "D-12"}
        right={<>
          {preMode ? (
            <>
              <Link href="/" className="desk-only" style={previewChip}>{en ? "Sale view" : "판매 화면 보기"}</Link>
              {preMode === "pre"
                ? <Link href="/?state=dday" style={previewChip}>{en ? "D-day view" : "오픈 당일 보기"}</Link>
                : <Link href="/?state=teaser" style={previewChip}>{en ? "Pre-order view" : "사전예약 보기"}</Link>}
            </>
          ) : soldOut ? (
            <>
              <Link href="/" className="desk-only" style={previewChip}>{en ? "Sale view" : "판매 화면 보기"}</Link>
              <a
                href={LINKS.telegram} target="_blank" rel="noopener"
                style={{ display: "inline-flex", background: "var(--w-main)", color: "#fff", fontSize: 16, fontWeight: 800, borderRadius: 9, padding: "8px 14px", textDecoration: "none" }}
              >
                {en ? "Get updates" : "소식 받기"}
              </a>
            </>
          ) : ebClosed ? (
            <>
              <Link href="/" className="desk-only" style={previewChip}>{en ? "Sale view" : "판매 화면 보기"}</Link>
              <Link href="/?state=sold_out" style={previewChip}>{en ? "Sold-out view" : "완판 화면 보기"}</Link>
            </>
          ) : (
            <>
              <Link href="/?state=teaser" style={previewChip}>{en ? "Pre-order view" : "사전예약 보기"}</Link>
              <Link href="/?state=eb_closed" className="desk-only" style={previewChip}>{en ? "EB-closed view" : "얼리버드 마감 보기"}</Link>
              <Link href="/?state=sold_out" className="desk-only" style={previewChip}>{en ? "Sold-out view" : "완판 화면 보기"}</Link>
            </>
          )}
        </>}
      />

      {/* 1h 얼리버드 마감 배너 (1회성) — 밝은 톤 띠배너 + 일반 잔여 수량 카운트업 동시 노출 */}
      {ebClosed && !soldOut && banner && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap",
          background: "linear-gradient(90deg, var(--w-tint), #fff 50%, var(--w-tint))",
          borderBottom: "1px solid color-mix(in oklab, var(--w-main) 24%, white)",
          color: "var(--w-deep)", padding: "11px 16px", fontSize: 17, fontWeight: 700,
        }}>
          <span>{en ? "Early bird closed" : "얼리버드 마감"}</span>
          <span style={{ width: 1, height: 12, background: "color-mix(in oklab, var(--w-main) 32%, white)" }} />
          <span>
            {en
              ? <>only <b className="mono" style={{ color: "var(--w-main)", fontSize: 19 }}>{fmt(bannerCount)}</b> regular-price units left</>
              : <>일반 잔여 <b className="mono" style={{ color: "var(--w-main)", fontSize: 19 }}>{fmt(bannerCount)}</b>대 남았습니다</>}
          </span>
          <button onClick={dismissBanner} aria-label={en ? "Dismiss banner" : "배너 닫기"} style={{ opacity: 0.45, fontSize: 19.5, marginLeft: 6, color: "var(--w-deep)" }}>✕</button>
        </div>
      )}

      {/* ── S1 히어로 ── */}
      <section style={{ color: "#fff" }} className="sec-pad hero-photo" aria-label={en ? "Hero" : "히어로"}>
        <div aria-hidden>
          {HERO_BGS.map((src, i) => (
            <div key={src} className={`hero-bg-slide${i === heroBg ? " on" : ""}`} style={{ backgroundImage: `url(${src})` }} />
          ))}
          <div className="hero-scrim" />
        </div>
        {soldOut ? (
          /* 1i 완판 히어로 */
          <div className="hero-grid" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* wellbian X XRP LEDGER 락업 — 3배 확대 (8/27 서우), 크기는 CSS .hero-lockup */}
              <div className="hero-lockup">
                <Image src="/assets/wb-white.png" alt="wellbian" width={593} height={215} className="lk-wb" />
                <span className="lk-x">X</span>
                <Image src="/assets/xrpl-white.png" alt="XRP Ledger" width={609} height={154} className="lk-xrpl" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: ".14em", color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>
                WEATHER DATA ECONOMY
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="pill" style={{ fontSize: 14.5, letterSpacing: ".1em", background: "rgba(255,255,255,.14)", padding: "5px 12px", color: "#fff" }}>SOLD OUT</span>
                <span style={{ fontSize: 17, color: "rgba(255,255,255,.6)" }}>{en ? "Batch 1 has sold out" : "1차 물량이 모두 판매되었습니다"}</span>
              </div>
              <h1 style={{ fontSize: "clamp(35px, 4.4vw, 44px)", lineHeight: 1.3, fontWeight: 800 }}>
                {en ? <>Sold out —<br />be the first to hear about Batch 2</> : <>완판되었습니다 —<br />2차 판매 소식을 가장 먼저 받아보세요</>}
              </h1>
              <p style={{ fontSize: 19.5, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 520 }}>
                <b style={{ color: "#fff" }}>Weather Data Token Generator™</b>
                <br />
                {en
                  ? "Just measure your indoor air — your verified data turns into value that comes back to you."
                  : "실내 공기를 측정하는 것만으로, 검증된 내 데이터가 가치가 되어 돌아옵니다."}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 440 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "rgba(255,255,255,.65)" }}>
                  <span>{en ? "0 left · 100% sold" : "잔여 0대 · 100% 판매"}</span>
                </div>
                <div className="track on-dark" style={{ height: 8 }}><i style={{ width: "100%" }} /></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <a href={LINKS.telegram} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", color: "var(--w-deep)", fontSize: 19.5, fontWeight: 800, borderRadius: 12, padding: "16px 24px", textDecoration: "none" }}>
                  <TgIcon size={15} /> {en ? "Join the community" : "커뮤니티 입장"}
                </a>
                <a href={LINKS.x} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 18, fontWeight: 700, borderRadius: 12, padding: "15px 20px", textDecoration: "none" }}>
                  <XIcon size={14} /> {en ? "Follow for updates" : "소식 팔로우"}
                </a>
              </div>
              <div style={{ fontSize: 15.5, color: "rgba(255,255,255,.45)" }}>
                {en ? "Batch 2 news lands first on our official Telegram and X" : "공식 텔레그램과 X에서 2차 판매 소식을 가장 먼저 알려드립니다"}
              </div>
            </div>
          </div>
        ) : (
          <div className="hero-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* wellbian X XRP LEDGER 락업 — 3배 확대 (8/27 서우), 크기는 CSS .hero-lockup */}
              <div className="hero-lockup">
                <Image src="/assets/wb-white.png" alt="wellbian" width={593} height={215} className="lk-wb" />
                <span className="lk-x">X</span>
                <Image src="/assets/xrpl-white.png" alt="XRP Ledger" width={609} height={154} className="lk-xrpl" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: ".14em", color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>
                WEATHER DATA ECONOMY
              </div>
              <h1 className={en ? "hero-h1-en" : undefined} style={{ fontSize: en ? "clamp(31px, 3.7vw, 48px)" : "clamp(35px, 5.2vw, 60px)", lineHeight: 1.25, fontWeight: 800, letterSpacing: "-.01em" }}>
                {en ? <>Turn your weather data<br />into value</> : <>당신의 날씨 데이터를<br />가치로 바꾸세요</>}
              </h1>
              <p style={{ fontSize: 21, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 520 }}>
                <b style={{ color: "#fff" }}>Weather Data Token Generator™</b>
                <br />
                {en
                  ? "Just measure your indoor air — your verified data turns into value that comes back to you."
                  : "실내 공기를 측정하는 것만으로, 검증된 내 데이터가 가치가 되어 돌아옵니다."}
              </p>
              {preMode === "dday" ? (
                /* 사전예약 오픈 전: 오픈 정보 한 줄 */
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, maxWidth: 480, marginTop: 6, fontSize: 18, fontWeight: 700, flexWrap: "wrap" }}>
                  <span>{en ? "Pre-orders open Sept 5" : "9월 5일 사전예약 오픈"}</span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,.65)" }}>{en ? "Book now, buy calmly on Sept 15" : "예약하면 9월 15일에 여유 있게 구매"}</span>
                </div>
              ) : preMode === "pre" ? (
                /* 사전예약 중 (8/27 개정): 수요 파악·룸 확보 — 5,000 게이지 없음, 짧은 가격 + 우선 구매 안내 */
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 520, marginTop: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {en ? <>Early bird <b>1,000 units · 450 RLUSD</b> · then 650 RLUSD</> : <>얼리버드 <b>1,000대 450 RLUSD</b> · 이후 650 RLUSD</>}
                  </div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,.72)" }}>
                    {en
                      ? "Pre-ordering secures your right to buy on Sept 15, opening day — no first-come rush."
                      : "사전예약하면 9월 15일 판매 당일 구매할 수 있는 권한을 받습니다 · 선착순 걱정 없이"}
                  </div>
                </div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 440, marginTop: 6 }}>
                {/* 잔여·판매율을 좌측 선두로, 총량은 우측 보조로 (8/27 서우) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>
                    {en ? <><b className="mono" style={{ color: "#fff" }}>{fmt(remain)}</b> left · {pct}% sold</> : <>잔여 <b className="mono" style={{ color: "#fff" }}>{fmt(remain)}</b>대 · {pct}% 판매</>}
                  </span>
                </div>
                <div className="track on-dark" style={{ height: 8 }}><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
              </div>
              )}
              {/* 모바일: 구매 버튼 전폭 → 아랫줄에 X·텔레그램 나란히 (8/27 서우) */}
              <div ref={heroCtaRef} className="hero-cta-row" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                {preMode === "pre" ? (
                  /* PRE-ORDER — 사전예약 = 실구매 (8/27 서우: 9/5부터 바로), 구매 모달 연결 */
                  <button onClick={buy} className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                    {en ? "PRE-ORDER · RLUSD" : "PRE-ORDER · 사전예약 구매"}
                  </button>
                ) : preMode === "dday" ? (
                  /* 사전예약 오픈 카운트다운 (9/5) */
                  <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)", color: "#fff", textDecoration: "none" }}>
                    <span className="mono" style={{ fontWeight: 800 }}>{cd}</span>&nbsp;{en ? "until pre-orders open" : "후 사전예약 오픈"}
                  </a>
                ) : (
                  <button onClick={buy} className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                    {en ? "Buy now · RLUSD" : "지금 구매하기 · RLUSD"}
                  </button>
                )}
                <div className="hero-social" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <a href={LINKS.x} target="_blank" rel="noopener" aria-label="X" style={heroIcon}><XIcon size={18} /></a>
                  <a href={LINKS.telegram} target="_blank" rel="noopener" aria-label={en ? "Telegram" : "텔레그램"} style={heroIcon}><TgIcon size={18} /></a>
                </div>
              </div>
              {preMode && (
                /* 사전예약 누적 (목값 카운트업) */
                <div style={{ fontSize: 17, color: "rgba(255,255,255,.75)" }}>
                  {en
                    ? <>So far <b className="mono" style={{ color: "#fff", fontSize: 19 }}>{fmt(preMode === "pre" ? notifyCount : MOCK_PRENOTIFY)}</b> units pre-ordered</>
                    : <>지금까지 <b className="mono" style={{ color: "#fff", fontSize: 19 }}>{fmt(preMode === "pre" ? notifyCount : MOCK_PRENOTIFY)}</b>대가 사전예약되었습니다</>}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── S1b 사전예약 실시간 현황판 (teaser 전용, 8/27) — 크레딧 롤: 아래→위 + 상단 페이드아웃 ── */}
      {preMode === "pre" && (
        <section className="sec-pad" style={{ background: "var(--w-deep)", color: "#fff", paddingTop: 48, paddingBottom: 48 }} aria-label={en ? "Live pre-order board" : "실시간 사전예약 현황"}>
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19.5, fontWeight: 800 }}>
                <span className="live-dot" />
                {en ? "Live pre-order board" : "실시간 사전예약 현황"}
              </div>
              <div style={{ fontSize: 16.5, color: "rgba(255,255,255,.7)" }}>
                {en
                  ? <>Total <b className="mono" style={{ color: "#fff" }}>{fmt(MOCK_PRENOTIFY)}</b> units · up to 100 per account</>
                  : <>누적 <b className="mono" style={{ color: "#fff" }}>{fmt(MOCK_PRENOTIFY)}</b>대 · 1계정 최대 100대</>}
              </div>
            </div>
            <div className="feed-roll" aria-hidden>
              <div className="feed-track">
                {[...PREORDER_FEED, ...PREORDER_FEED].map((f, i) => (
                  <div key={i} className="feed-row">
                    <span className="mono" style={{ color: "#fff", fontWeight: 700 }}>{f.w}****</span>
                    <span style={{ color: "rgba(255,255,255,.55)" }}>{f.t}</span>
                    <span className="mono" style={{ color: "color-mix(in oklab, var(--w-main) 40%, white)", fontWeight: 800 }}>
                      {f.q}{en ? ` unit${f.q > 1 ? "s" : ""}` : "대"} {en ? "pre-ordered" : "사전예약"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 14.5, color: "rgba(255,255,255,.45)" }}>
              {en
                ? "Wallet prefixes are masked. Pre-orders gauge demand and hold your room — Genesis Numbers are assigned at purchase."
                : "지갑 주소는 앞자리만 표시됩니다. 사전예약은 수요 파악과 자리 확보 단계이며, 제네시스 넘버는 정식 구매 시 배정됩니다."}
            </div>
          </div>
        </section>
      )}

      {/* ── S2 가격·수량 ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="price">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>{en ? "Price & Supply" : "가격 · 수량"}</h2>
            <p style={{ fontSize: 19, color: "var(--ink-4)" }}>{en ? "Payment in RLUSD" : "결제는 RLUSD로 진행됩니다"}</p>
          </div>
          <div className="price-grid">
            {/* 얼리버드 카드 */}
            <div style={{
              position: "relative", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 14,
              ...(ebClosed
                ? { border: "1px solid var(--bd-card)", background: "var(--card-dis)", filter: "grayscale(1)", opacity: 0.6 }
                : { border: "2px solid var(--w-main)", background: "var(--w-tint)" }),
            }}>
              <span className="pill" style={{ position: "absolute", top: -12, left: 28, background: ebClosed ? "var(--cap)" : "var(--w-main)", color: "#fff", fontSize: 15, padding: "5px 12px" }}>
                {ebClosed ? (en ? "Early bird closed" : "얼리버드 마감") : (en ? "Early bird · almost gone" : "얼리버드 · 소진 임박")}
              </span>
              <div style={{ fontSize: 19.5, fontWeight: 700, color: "var(--w-deep)", marginTop: 6 }}>{en ? "Early Bird" : "얼리버드"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="mono" style={{ fontSize: 49.5, fontWeight: 800, color: "var(--w-deep)", textDecoration: ebClosed ? "line-through" : "none" }}>450</span>
                <span style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-4)" }}>RLUSD</span>
                {!ebClosed && <span style={{ fontSize: 17, color: "var(--hint)", textDecoration: "line-through", marginLeft: 4 }}>650 RLUSD</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "var(--ink-4)" }}>
                  <span>
                    {en
                      ? <><b style={{ color: ebClosed ? "var(--ink-4)" : "var(--w-main)" }}>{fmt(inv.ebLeft)}</b> of 1,000 left</>
                      : <>잔여 <b style={{ color: ebClosed ? "var(--ink-4)" : "var(--w-main)" }}>{fmt(inv.ebLeft)}</b> / 1,000대</>}
                  </span>
                  <span>{ebPct}% {en ? "sold" : "소진"}</span>
                </div>
                <div className={`track on-light${ebClosed ? " gray" : ""}`} style={{ height: 6 }}><i style={{ width: `${ebPct}%` }} /></div>
              </div>
              {ebClosed
                ? <span style={{ display: "inline-flex", justifyContent: "center", background: "#d8d8e0", color: "var(--cap)", fontSize: 19.5, fontWeight: 800, borderRadius: 10, padding: 14 }}>{en ? "Closed" : "마감되었습니다"}</span>
                : <button onClick={buy} className="btn-main" style={{ fontSize: 19.5, borderRadius: 10, padding: 14 }}>{en ? "Buy" : "구매하기"}</button>}
              {!ebClosed && <div style={{ fontSize: 15.5, color: "var(--cap)" }}>{en ? "Switches to the regular price automatically when sold out" : "소진 시 일반가로 자동 전환됩니다"}</div>}
            </div>
            {/* 일반 카드 */}
            <div style={{
              position: "relative", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 14,
              ...(ebClosed && !soldOut
                ? { border: "2px solid var(--w-main)", background: "var(--w-tint)" }
                : { border: "1px solid var(--bd-card)", background: "#fff" }),
            }}>
              {ebClosed && !soldOut && (
                <span className="pill" style={{ position: "absolute", top: -12, left: 28, background: "var(--w-main)", color: "#fff", fontSize: 15, padding: "5px 12px" }}>{en ? "Current price" : "현재 판매가"}</span>
              )}
              <div style={{ fontSize: 19.5, fontWeight: 700, color: "var(--w-deep)", marginTop: 6 }}>{en ? "Regular" : "일반"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="mono" style={{ fontSize: 49.5, fontWeight: 800, color: "var(--w-deep)" }}>650</span>
                <span style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-4)" }}>RLUSD</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "var(--ink-4)" }}>
                  <span>
                    {en
                      ? <><b style={{ color: ebClosed && !soldOut ? "var(--w-main)" : "var(--w-deep)" }}>{fmt(inv.genLeft)}</b> of 4,000 left</>
                      : <>잔여 <b style={{ color: ebClosed && !soldOut ? "var(--w-main)" : "var(--w-deep)" }}>{fmt(inv.genLeft)}</b> / 4,000대</>}
                  </span>
                  <span>{genPct}% {en ? "sold" : "소진"}</span>
                </div>
                <div className="track on-light" style={{ height: 6 }}>
                  <i style={{ width: `${Math.max(2, genPct)}%`, background: ebClosed && !soldOut ? "var(--w-main)" : "var(--arrow)" }} />
                </div>
              </div>
              {soldOut
                ? <span style={{ display: "inline-flex", justifyContent: "center", background: "#d8d8e0", color: "var(--cap)", fontSize: 19.5, fontWeight: 800, borderRadius: 10, padding: 14 }}>{en ? "Sold out" : "완판되었습니다"}</span>
                : ebClosed
                  ? <button onClick={buy} className="btn-main" style={{ fontSize: 19.5, borderRadius: 10, padding: 14 }}>{en ? "Buy" : "구매하기"}</button>
                  : <button onClick={buy} className="btn-outline-deep" style={{ fontSize: 19.5, padding: 14 }}>{en ? "Buy" : "구매하기"}</button>}
              <div style={{ fontSize: 15.5, color: "var(--cap)" }}>{ebClosed ? "" : en ? "Price after early bird closes" : "얼리버드 마감 후 판매가"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "16px 20px", background: "var(--panel)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: "var(--w-tint)", color: "var(--w-main)", fontWeight: 800, fontSize: 17, flex: "none" }}>#</span>
            <div style={{ fontSize: 17.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
              {en
                ? <><b style={{ color: "var(--w-deep)" }}>Genesis Number</b> — randomly assigned at purchase and permanently recorded on your license NFT.</>
                : <><b style={{ color: "var(--w-deep)" }}>제네시스 넘버</b> — 구매 시 무작위로 배정되며, 라이선스 NFT에 영구 기록됩니다.</>}
            </div>
          </div>
        </div>
      </section>

      {/* ── S3 제품 — 히어로형 풀블리드 갤러리 롤링 + 스펙 더보기 (8/27 2차: 배경 덮기 + 흰 폰트) ── */}
      <section className="sec-pad spec-hero" id="spec" style={{ color: "#fff" }}>
        <div aria-hidden>
          {SPEC_GALLERY.map((g, i) => (
            <div key={g.src} className={`spec-bg${i === specImg ? " on" : ""}`} style={{ backgroundImage: `url(${g.src})` }} role="img" aria-label={en ? g.altEn : g.alt} />
          ))}
          <div className="spec-hero-scrim" />
        </div>
        <div className="wrap" style={{ position: "relative", zIndex: 2, minHeight: 520, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ ...h2, color: "#fff", textShadow: "0 2px 14px rgba(0,0,0,.35)" }}>{en ? "Weather Data Token Generator™" : "날씨데이터토큰생성기™"}</h2>
            <p style={{ fontSize: 19, fontWeight: 600, color: "rgba(255,255,255,.85)", textShadow: "0 1px 10px rgba(0,0,0,.35)" }}>
              {en ? "Indoor Air Quality Monitor · Model ARC-600DA" : "실내공기측정기 · 모델명 ARC-600DA"}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <span style={certChipDark}>{en ? "KC Certified" : "KC 인증"}</span>
              <span style={certChipDark}>{en ? "Performance Certified" : "성능인증"}</span>
            </div>
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSpecOpen(!specOpen)} aria-expanded={specOpen} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 18, fontWeight: 800, color: "#fff", background: "rgba(27,27,72,.45)", border: "1px solid rgba(255,255,255,.35)", borderRadius: 99, padding: "12px 22px", backdropFilter: "blur(4px)" }}>
              {specOpen ? (en ? "Hide specifications" : "제품 스펙 접기") : (en ? "See full specifications" : "제품 스펙 더보기")}
              <span style={{ display: "inline-flex", transform: specOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <ChevD size={15} color="#fff" />
              </span>
            </button>
            {specOpen && (
              /* 글래스 테이블 (8/27 서우: 흰 카드 → 블러 글래스 + 흰 폰트) */
              <div className="step-in" style={{ width: "100%", maxWidth: 760, background: "rgba(27,27,72,.38)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 16, padding: "8px 22px 16px", display: "flex", flexDirection: "column", gap: 12, color: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {specs.map((s) => (
                    <div key={s.k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "9px 4px", borderBottom: "1px solid rgba(255,255,255,.18)", fontSize: 17.5, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 800, color: "#fff" }}>{s.k}</span>
                      <span style={{ color: "rgba(255,255,255,.88)" }}>{s.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 15.5, color: "rgba(255,255,255,.62)", textAlign: "center" }}>{en ? "Based on the manufacturer's official specification sheet." : "제조사 공식 사양표 기준입니다."}</div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {SPEC_GALLERY.map((g, i) => (
                <button key={g.src} onClick={() => setSpecImg(i)} aria-label={`${en ? "Image" : "이미지"} ${i + 1}`}
                  style={{ width: 9, height: 9, borderRadius: 99, background: i === specImg ? "#fff" : "rgba(255,255,255,.42)", transform: i === specImg ? "scale(1.25)" : "none", transition: "background .15s, transform .15s" }} />
              ))}
            </div>
          </div>
        </div>
        <button className="spec-nav prev" style={{ zIndex: 2 }} aria-label={en ? "Previous image" : "이전 이미지"} onClick={() => setSpecImg((i) => (i - 1 + SPEC_GALLERY.length) % SPEC_GALLERY.length)}>‹</button>
        <button className="spec-nav next" style={{ zIndex: 2 }} aria-label={en ? "Next image" : "다음 이미지"} onClick={() => setSpecImg((i) => (i + 1) % SPEC_GALLERY.length)}>›</button>
      </section>

      {/* ── S6 RLUSD 준비 ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="rlusd">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {/* 헤더 중앙 정렬 통일 (8/27 서우) */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>{preMode ? (en ? "Pay with RLUSD on opening day" : "오픈 당일 RLUSD로 구매 가능합니다") : (en ? "Don't have RLUSD yet?" : "RLUSD가 없다면")}</h2>
            <p style={{ fontSize: 19, color: "var(--ink-4)" }}>
              {en ? "RLUSD — a USD-pegged stablecoin issued by Ripple" : "RLUSD — 미국 달러 1:1 연동 · 리플(Ripple) 발행 스테이블코인"}
            </p>
          </div>
          <div className="rl-grid">
            {rlSteps.map((r) => (
              <div key={r.n} style={{ border: "1px solid var(--bd-card)", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--w-main)" }}>STEP {r.n}</span>
                <div style={{ fontSize: 21, fontWeight: 800, color: "var(--w-deep)" }}>{r.t}</div>
                <div style={{ fontSize: 17, lineHeight: 1.6, color: "var(--ink-4)" }}>{r.d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--warn-bd)", background: "var(--warn-bg)", borderRadius: 12, padding: "15px 20px", fontSize: 17.5, color: "var(--warn-text)" }}>
            <Warn />
            <span>
              {en
                ? <><b>Always select XRPL as the withdrawal network.</b> Withdrawing over any other network may result in loss of funds.</>
                : <><b>출금 네트워크는 반드시 XRPL을 선택하세요.</b> 다른 네트워크로 출금하면 자산을 잃을 수 있습니다.</>}
            </span>
          </div>
          <button onClick={() => setRlGuideOpen(!rlGuideOpen)} aria-expanded={rlGuideOpen} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: rlGuideOpen ? "1px solid var(--w-main)" : "1px solid var(--bd-card)", borderRadius: 12, padding: "16px 20px", fontSize: 18, fontWeight: 700, color: "var(--w-deep)", background: rlGuideOpen ? "var(--w-tint)" : "#fff", width: "100%" }}>
            <span>{rlGuideOpen ? (en ? "Collapse the RLUSD guide" : "RLUSD 구매 가이드 접기") : (en ? "See the full RLUSD guide" : "RLUSD 구매 가이드 전체 보기")}</span>
            <span style={{ display: "inline-flex", transform: rlGuideOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
              <ChevD size={16} color={rlGuideOpen ? "var(--w-main)" : "var(--cap)"} />
            </span>
          </button>
          {rlGuideOpen && (
            <div className="step-in" style={{ border: "1px solid var(--bd-card)", borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18, background: "var(--panel)" }}>
              {(en ? RL_GUIDE_EN : RL_GUIDE).map((g, i) => (
                <div key={g.t} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 99, background: "var(--w-deep)", color: "#fff", fontSize: 15.5, fontWeight: 800, flex: "none", marginTop: 1 }}>{i + 1}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 17.5, fontWeight: 800, color: "var(--w-deep)" }}>{g.t}</div>
                    <div style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink-4)" }}>{g.d}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                {(en ? RL_TIPS_EN : RL_TIPS).map((t) => (
                  <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 16, lineHeight: 1.6, color: "var(--ink-4)" }}>
                    <span style={{ color: "var(--w-main)", fontWeight: 800, flex: "none" }}>·</span>{t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── S4 비전 — Weather Data Economy (8/27 사업계획서 함축) + 작동 원리 4단계 ── */}
      <section className="sec-pad" style={{ background: "var(--sec-alt)" }} id="how">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 34, textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: ".14em", color: "var(--w-main)" }}>WEATHER DATA ECONOMY</div>
            <h2 style={h2}>{en ? "What we're building" : "우리가 만드는 것"}</h2>
            <p style={{ fontSize: 19.5, lineHeight: 1.72, color: "var(--ink-4)", maxWidth: 780, margin: "0 auto" }}>
              {en
                ? "Air differs building by building, street by street — beyond the reach of public weather stations. We turn the data measured where you actually live into an economy: measured by you, verified by the network, rewarded for contribution, and put to work as services."
                : "공기는 건물마다, 골목마다 다릅니다 — 기존 관측망이 닿지 않는 곳이죠. 내가 생활하는 공간에서 측정한 데이터가 검증을 거쳐 보상으로 돌아오고, 쌓인 데이터는 서비스가 되는 경제. 그것이 우리가 만드는 Weather Data Economy입니다."}
            </p>
          </div>
          <div className="how-grid">
            <HowCard icon={<Gauge />} title={en ? "① Measure" : "① 측정"} desc={en ? "Measures indoor air — CO₂, particulates, temperature & humidity" : "CO₂·미세먼지·온습도 등 실내 공기 데이터를 측정합니다"} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<ShieldCheck />} title={en ? "② Verify" : "② 검증"} desc={en ? "The network verifies the integrity of your data" : "네트워크가 데이터의 무결성을 검증합니다"} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<Coin />} title={en ? "③ Reward" : "③ 보상"} desc={en ? "Verified data earns WLBN under network rules" : "검증된 데이터에 네트워크 원칙에 따라 WLBN이 지급됩니다"} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<Chart />} title={en ? "④ Utilize" : "④ 활용"} desc={en ? "Accumulated data powers APIs, AI, and weather services" : "축적된 데이터는 API·AI·기상 서비스로 활용됩니다"} />
          </div>
          {/* 선순환 — 데이터가 실수요처로 유통되어 지속되는 구조 (8/27 서우: 로드맵·역할 줄 대체) */}
          <div style={{ maxWidth: 880, margin: "0 auto", width: "100%", border: "1px solid var(--bd-card)", background: "#fff", borderRadius: 16, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: "var(--w-deep)" }}>
              {en ? "A loop that sustains itself" : "데이터가 돌수록 단단해지는 선순환"}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", fontSize: 16.5, fontWeight: 700 }}>
              <span style={{ background: "var(--w-tint)", color: "var(--w-deep)", borderRadius: 10, padding: "9px 14px" }}>{en ? "Verified air data" : "검증된 공기질 데이터"}</span>
              <span style={{ color: "var(--arrow)", fontWeight: 800 }}>→</span>
              <span style={{ background: "var(--w-tint)", color: "var(--w-deep)", borderRadius: 10, padding: "9px 14px" }}>{en ? "Real demand — enterprises · APIs · AI" : "실제 수요처 유통 — 기업 · API · AI"}</span>
              <span style={{ color: "var(--arrow)", fontWeight: 800 }}>→</span>
              <span style={{ background: "var(--w-tint)", color: "var(--w-deep)", borderRadius: 10, padding: "9px 14px" }}>{en ? "Revenue → the network keeps running" : "수익 → 네트워크 지속"}</span>
              <span style={{ color: "var(--w-main)", fontSize: 21, fontWeight: 800 }}>↻</span>
            </div>
            <p style={{ fontSize: 17.5, lineHeight: 1.7, color: "var(--ink-4)" }}>
              {en
                ? <>The verified air-quality data our nodes produce flows to real buyers — enterprises, APIs, AI services.<br />The more it is used, the stronger the demand, and that demand is what keeps the network running.</>
                : <>노드가 모은 검증된 공기질 데이터는 기업·API·AI 서비스 같은 실제 수요처로 유통됩니다.<br />데이터가 쓰일수록 수요가 커지고, 그 수요가 다시 네트워크를 지속시키는 힘이 됩니다.</>}
            </p>
          </div>
          <div style={{ fontSize: "clamp(23px, 2.8vw, 31px)", fontWeight: 800, color: "var(--w-main)", letterSpacing: "-.01em" }}>
            Turn Your Weather Data into Value.
          </div>
          <div style={{ fontSize: 15.5, color: "var(--hint)" }}>
            {en ? `${NOTICE_REWARD_EN} · See the FAQ for details` : `${NOTICE_REWARD} · 자세한 원칙은 FAQ를 참고하세요`}
          </div>
        </div>
      </section>

      {/* ── S5 연동 안내 (8/27 후순위 이동 — 비전 다음) ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="setup">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            {/* 배송 안내 캡션 (8/27 서우) — 2주 전 공지 채널 + 11월 순차 배송 */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center", fontSize: 15.5, fontWeight: 700, color: "var(--w-main)", background: "var(--w-tint)", borderRadius: 99, padding: "9px 18px", marginBottom: 6 }}>
              {en
                ? <>Shipping is announced 2 weeks ahead in the community (Telegram) · updates on X <span style={{ color: "color-mix(in oklab, var(--w-main) 45%, var(--ink-4))" }}>· Est. shipping — sequentially from November</span></>
                : <>배송 2주 전에 커뮤니티(텔레그램) · 공지(X)로 안내드립니다 <span style={{ color: "color-mix(in oklab, var(--w-main) 45%, var(--ink-4))" }}>· 배송 시작 예상 — 11월 중 순차 배송</span></>}
            </div>
            <h2 style={h2}>{en ? "Your device becomes a node 3 minutes after it arrives" : "디바이스 도착 후 3분이면 노드가 됩니다"}</h2>
            <p style={{ fontSize: 19, color: "var(--ink-4)" }}>{en ? "Setup is easy — open the box and follow four steps." : "등록은 어렵지 않습니다 — 박스를 열고 네 단계면 끝."}</p>
          </div>
          <div className="link-grid">
            {linkSteps.map((st) => (
              <div key={st.n} style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, background: "var(--w-deep)", color: "#fff", fontSize: 17, fontWeight: 800 }}>{st.n}</span>
                <div style={{ fontSize: 19, fontWeight: 800, color: "var(--w-deep)" }}>{st.t}</div>
                <div style={{ fontSize: 16, lineHeight: 1.55, color: "var(--ink-4)" }}>
                  {st.d}
                  {st.d2 && <><br />{st.d2}</>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, border: "1px solid color-mix(in oklab, var(--w-main) 30%, white)", background: "var(--w-tint)", borderRadius: 12, padding: "16px 20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 17.5, color: "var(--ink-2)" }}>
              <Shield />
              <span>
                {en
                  ? <><b style={{ color: "var(--w-deep)" }}>New to wallets? No problem</b> — one-time wallet activation (1 XRP) is covered <span style={{ color: "var(--cap)" }}>(Terms, Art. 5)</span></>
                  : <><b style={{ color: "var(--w-deep)" }}>지갑이 처음이어도 됩니다</b> — 등록 지갑 활성화(1 XRP)는 1회 지원됩니다 <span style={{ color: "var(--cap)" }}>(약관 제5조)</span></>}
              </span>
            </div>
            <button onClick={() => setWalletGuideOpen(!walletGuideOpen)} aria-expanded={walletGuideOpen} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 17.5, fontWeight: 700, whiteSpace: "nowrap", color: "var(--w-main)" }}>
              {walletGuideOpen ? (en ? "Collapse the guide" : "가이드 접기") : (en ? "See the full setup guide" : "상세 연동 가이드 보기")}
              <span style={{ display: "inline-flex", transform: walletGuideOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <ChevD size={14} color="var(--w-main)" />
              </span>
            </button>
          </div>
          {walletGuideOpen && (
            <div className="step-in" style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
              {(en ? WALLET_GUIDE_EN : WALLET_GUIDE).map((g, i) => (
                <div key={g.t} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 99, background: "var(--w-tint)", color: "var(--w-main)", fontSize: 15.5, fontWeight: 800, flex: "none", marginTop: 1 }}>{i + 1}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 17.5, fontWeight: 800, color: "var(--w-deep)" }}>{g.t}</div>
                    <div style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink-4)" }}>{g.d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── S7 FAQ ── */}
      <section className="sec-pad" style={{ background: "var(--sec-alt)" }} id="faq">
        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ ...h2, textAlign: "center" }}>{en ? "FAQ" : "자주 묻는 질문"}</h2>
          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "8px 28px", display: "flex", flexDirection: "column" }}>
            {faqList.map((f, i) => {
              const open = faqOpen === i;
              return (
                /* 모바일: 3문항 축약 (PRD §6.1) — 전체 펼침 시 23문항 전부 노출 */
                <div key={f.q} style={{ borderBottom: i < faqList.length - 1 ? "1px solid var(--line)" : "none" }} className={`${open ? "acc-open" : ""}${i >= 3 && !faqAllOpen ? " desk-only" : ""}`}>
                  <button onClick={() => setFaqOpen(open ? -1 : i)} aria-expanded={open}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 2px", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: 19.5, fontWeight: 700, color: "var(--w-deep)" }}>{f.q}</span>
                    <ChevD className="acc-chev" />
                  </button>
                  {open && (
                    <div style={{ padding: "0 2px 20px", fontSize: 18, lineHeight: 1.7, color: "var(--ink-3)", maxWidth: 680 }}>{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center" }}>
            <button onClick={() => { setFaqAllOpen(!faqAllOpen); if (faqAllOpen) setFaqOpen(-1); }} aria-expanded={faqAllOpen} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 18, fontWeight: 700, color: "var(--w-main)" }}>
              {faqAllOpen ? (en ? "Collapse FAQs" : "FAQ 접기") : (en ? "See all 23 FAQs" : "전체 FAQ 23문항 보기")}
              <span style={{ display: "inline-flex", transform: faqAllOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <ChevD size={15} color="var(--w-main)" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── S9 커뮤니티 + 푸터 ── */}
      <CommunityFooter />

      {/* ── S0 스티키 구매 바 (오픈 전 카운트다운에서만 숨김 — 사전예약 중엔 구매 가능) ── */}
      {!soldOut && preMode !== "dday" && (
        <div aria-hidden={!sticky} style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60,
          transform: sticky ? "none" : "translateY(110%)", transition: "transform .3s ease",
          display: "flex", justifyContent: "center",
          background: "#fff", borderTop: "1px solid var(--bd-card)",
          boxShadow: "0 -8px 24px rgba(27,27,72,.1)",
        }} className="stickybar">
          {/* PC: 중앙 한 덩어리(진행 | 가격 | CTA), 모바일: 기존 좌우 배치 유지 */}
          <div className="stickybar-in">
            <div className="desk-only" style={{ display: "flex", flexDirection: "column", gap: 4, width: 190 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "var(--ink-4)" }}>
                <span>
                  {en ? <><b className="mono" style={{ color: "var(--w-deep)" }}>{fmt(remain)}</b> left</> : <>잔여 <b className="mono" style={{ color: "var(--w-deep)" }}>{fmt(remain)}</b>대</>}
                </span><span>{pct}%</span>
              </div>
              <div className="track" style={{ height: 5, background: "var(--line)" }}><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
            </div>
            <span className="desk-only" style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mob-only" style={{ fontSize: 14.5, color: "var(--cap)" }}>
                {en ? `${fmt(remain)} left · ${ebClosed ? "Regular" : "Early bird"}` : `잔여 ${fmt(remain)}대 · ${ebClosed ? "일반" : "얼리버드"}`}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="desk-only" style={{ fontSize: 15.5, color: "var(--cap)" }}>{en ? "Price" : "현재 가격"}</span>
                <span style={{ fontSize: 23.5, fontWeight: 800, color: "var(--w-deep)" }}>{curPrice} RLUSD</span>
                <span className="desk-only" style={{ fontSize: 15.5, color: "var(--hint)" }}>{ebClosed ? (en ? "Regular" : "일반") : (en ? "Early bird" : "얼리버드")}</span>
              </div>
            </div>
            <button onClick={buy} className="btn-main btn-shine" style={{ fontSize: 19.5, borderRadius: 10, padding: "13px 34px" }}>{en ? "Buy" : "구매하기"}</button>
          </div>
        </div>
      )}

      {modal && <BuyModal ebLeft={inv.ebLeft} demoMismatch={demoMismatch} onClose={() => setModal(false)} />}
    </div>
  );
}

function HowCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--bd-card)", borderRadius: 16, padding: "32px 24px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "var(--w-tint)", color: "var(--w-main)" }}>{icon}</span>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--w-deep)" }}>{title}</div>
      <div style={{ fontSize: 17.5, lineHeight: 1.6, color: "var(--ink-4)" }}>{desc}</div>
    </div>
  );
}

/* 히어로 배경 — 블루+퍼플 확정 (8/27 서우). 나머지 후보(hero-bg.jpg·-3·-4)는 hide, 파일 유지 —
   재비교 시 배열에 다시 넣으면 롤링 복원 */
const HERO_BGS = ["/assets/hero-bg-2.jpg"];

/* 제품 갤러리 5컷 (8/27 2차 — 서우 신규 렌더: 받침대·주방·거실·골드·블랙) — 히어로형 풀블리드 배경 */
const SPEC_GALLERY = [
  { src: "/assets/product-1.jpg", alt: "패키지 앞뒷면과 제품", altEn: "Package front, back, and product" },
  { src: "/assets/product-2.jpg", alt: "주방 설치 연출", altEn: "In the kitchen" },
  { src: "/assets/product-3.jpg", alt: "거실 설치 연출", altEn: "In the living room" },
  { src: "/assets/product-4.jpg", alt: "패키지 앞뒷면 (골드)", altEn: "Package set (gold)" },
  { src: "/assets/product-5.jpg", alt: "패키지 앞면", altEn: "Package front" },
];

/* ── 인라인 확장 가이드 콘텐츠 (8/27) — 약관 5조·구매 플로우·확정 정책 기준 ── */
const WALLET_GUIDE = [
  { t: "지갑이 없어도 시작할 수 있습니다", d: "기기 등록은 아이디·비밀번호나 소셜 계정으로 만드는 간편 지갑으로도 가능합니다. 지갑 키는 내 브라우저에서 만들어지는 비수탁 방식이라 회사도 열어볼 수 없습니다." },
  { t: "구매는 외부 지갑으로", d: "D'CENT(앱에서 자동 감지) · Xaman(QR 연결) · GemWallet(브라우저 확장)을 지원합니다. 구매 단계에서 지갑을 고르면 연결까지 안내합니다." },
  { t: "활성화 걱정은 하지 않아도 됩니다", d: "XRPL 지갑은 처음 쓸 때 1 XRP가 필요합니다. 기기 등록을 시작한 지갑에 한해 1회 지원됩니다 (약관 제5조)." },
  { t: "리딤코드 1개 = 지갑 1개", d: "박스 안 리딤코드는 한 지갑에만 등록됩니다. 등록한 뒤에는 환불이 제한되니, 쓸 지갑을 정한 다음 사용하세요." },
  { t: "비밀번호는 꼭 보관하세요", d: "비수탁 지갑은 비밀번호나 시드를 잃으면 누구도 복구해 줄 수 없습니다. 안전한 곳에 따로 적어 두세요." },
];
const WALLET_GUIDE_EN = [
  { t: "You can start without a wallet", d: "Device registration also works with an easy wallet created from an ID/password or social login. Keys are generated in your own browser (non-custodial) — even we can't open it." },
  { t: "Buy with an external wallet", d: "D'CENT (auto-detected in its app), Xaman (QR connect), and GemWallet (browser extension) are supported. Pick one at checkout and we walk you through connecting." },
  { t: "Don't worry about activation", d: "An XRPL wallet needs 1 XRP to start. It is covered once for the wallet that begins device registration (Terms, Art. 5)." },
  { t: "One redeem code = one wallet", d: "The code inside the box registers to a single wallet, and refunds are restricted once it is used — pick your wallet first, then redeem." },
  { t: "Keep your password safe", d: "With a non-custodial wallet, no one can recover a lost password or seed. Write it down and store it somewhere safe." },
];
const RL_GUIDE = [
  { t: "거래소에서 RLUSD 구매", d: "RLUSD를 지원하는 국내·해외 거래소에 원화(또는 달러)를 입금하고 RLUSD를 구매합니다." },
  { t: "개인 지갑으로 출금", d: "출금 화면에서 네트워크를 반드시 XRPL로 선택하고 내 지갑 주소로 보냅니다. 거래소가 태그 입력을 요구하면 안내대로 입력하세요. 처음이라면 소액으로 먼저 테스트 전송을 해보는 것이 안전합니다." },
  { t: "이 페이지에서 결제", d: "구매하기를 누르고 지갑을 연결하면 금액·받는 주소·태그가 자동으로 채워집니다. 지갑에 뜬 내용이 화면과 같은지 확인하고 서명하면 끝 — 다르면 결제가 진행되지 않고 자동으로 안내합니다." },
];
const RL_GUIDE_EN = [
  { t: "Buy RLUSD on an exchange", d: "Deposit KRW (or USD) on an exchange that supports RLUSD and purchase RLUSD." },
  { t: "Withdraw to your own wallet", d: "On the withdrawal screen, always select XRPL as the network and send to your wallet address. If the exchange asks for a tag, enter it as instructed. First time? A small test transfer is the safe way." },
  { t: "Pay on this page", d: "Hit Buy and connect your wallet — the amount, receiving address, and tag are filled in automatically. Check that what your wallet shows matches the screen, sign, and you're done. If anything differs, the payment stops and we alert you." },
];
const RL_TIPS = [
  "지갑이 RLUSD를 받을 준비(트러스트라인)는 결제 단계에서 자동 점검됩니다",
  "네트워크 수수료는 XRP로 아주 소액이 듭니다 — 지갑에 약간의 XRP를 남겨 두세요",
  "등록 지갑 활성화(1 XRP)는 1회 지원됩니다 (약관 제5조)",
];
const RL_TIPS_EN = [
  "Your wallet's readiness to receive RLUSD (the trust line) is checked automatically at payment",
  "Network fees cost a tiny amount of XRP — keep a little XRP in your wallet",
  "One-time wallet activation (1 XRP) is covered (Terms, Art. 5)",
];

const h2: React.CSSProperties = { fontSize: "clamp(27px, 3.4vw, 39px)", fontWeight: 800, color: "var(--w-deep)" };
const heroIcon: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, border: "1px solid rgba(255,255,255,.28)", borderRadius: 12, color: "#fff" };

/* GNB 미리보기 칩 — 점선 보더 = 데모 컨트롤 시그널 (실배포 시 상태 머신이 대체) */
const previewChip: React.CSSProperties = { display: "inline-flex", fontSize: 15, fontWeight: 700, color: "var(--cap)", border: "1px dashed var(--bd-input)", borderRadius: 8, padding: "6px 10px", textDecoration: "none", whiteSpace: "nowrap" };
const certChip: React.CSSProperties = { fontSize: 14.5, fontWeight: 700, border: "1px solid var(--bd-input)", borderRadius: 6, padding: "4px 8px", color: "var(--ink-2)" };
/* 다크(사진 배경) 위 인증 칩 — S3 히어로형 갤러리용 */
const certChipDark: React.CSSProperties = { fontSize: 15, fontWeight: 700, border: "1px solid rgba(255,255,255,.45)", background: "rgba(27,27,72,.35)", borderRadius: 99, padding: "6px 14px", color: "#fff", backdropFilter: "blur(3px)" };
