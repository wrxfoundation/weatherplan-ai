"use client";
/* 판매 랜딩 S0~S9 (PRD §6.1) + 엣지 상태 1h/1i (§6.4) — KO/EN 토글 지원 (§5.4)
   EN 히어로 헤드라인 = 확정 슬로건 "Turn Your Weather Data into Value" (8/27 진행보고 기준,
   Data 포함으로 재확정 — 상표 출원 문자열과 일치 여부는 변리사 트랙에서 재확인) */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { IconMeasure, IconVerify, IconReward, IconUse, IconData, IconFlow, IconCoins, IconNodes, IconStep } from "./GlassIcons";
import {
  SPECS, SPECS_EN, FAQS, FAQS_EN, FAQS_EXTRA, FAQS_EXTRA_EN, LINK_STEPS, LINK_STEPS_EN,
  RL_STEPS, RL_STEPS_EN, LINKS, MOCK_INVENTORY, MOCK_PRENOTIFY, PREORDER_FEED, PRICE, calc, fmt,
  NOTICE_REWARD, NOTICE_REWARD_EN, type SalePhase,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { D } from "@/lib/dict";
import { Gnb, CommunityFooter } from "./chrome";
import BuyModal from "./BuyModal";
import PreOrderModal from "./PreOrderModal";
import { XIcon, TgIcon, ChevD, Warn, Check, LinkIcon } from "./icons";

/* 8/28 서우: "999,999 까지 소화할 수 있는 카운팅 자리".
   숫자가 실제로 자라는 자리(0→N 카운트업, 실시간 증가)는 최종값 글자수만큼 슬롯을 미리 잡는다.
   3,847(5자)이면 5ch, 999,999(7자)면 7ch — 상한을 코드에 박지 않고 값에서 끌어오므로
   6자리로 커져도 옆 글자("대 사전예약")가 밀리지 않는다. 폭은 tabular-nums 가 보장한다. */
const slot = (n: number) => ({ minWidth: `${fmt(n).length}ch` });

/* 8/28 서우: "지금은 나올 단계가 아녀서 비활성화" — 연동 4단계 안내(디바이스 도착 후 3분…)를
   감춘다. 배송 2주 전 공지 문구만 남긴다. 코드는 지우지 않았다 — 다시 켤 때 이 값만 true 로. */
const SHOW_SETUP_GUIDE = false;

export default function Landing() {
  const sp = useSearchParams();
  const { en , t } = useI18n();
  const stateParam = sp.get("state");
  const demoMismatch = sp.get("demo") === "mismatch"; // 결제 mismatch 분기 재현용 (내부 데모)
  const phase: SalePhase =
    stateParam === "eb_closed" ? "general" : stateParam === "sold_out" ? "sold_out" : "early_bird";
  /* 8/28 서우: 기본 진입 = 사전예약 화면. 판매 화면은 ?state=sale (eb_closed·sold_out은 판매 계열 렌더,
     ?state=teaser는 레거시 URL로 동일 동작, ?state=dday = 오픈 전 카운트다운) */
  const preMode: "pre" | "dday" | null =
    stateParam === "dday" ? "dday"
    : stateParam === "sale" || stateParam === "eb_closed" || stateParam === "sold_out" ? null
    : "pre";

  const inv = MOCK_INVENTORY[phase]; // GET /api/inventory 대응 지점
  /* 8/28 서우: 스크롤을 내리면 카드·칩이 순차로 스르르 올라오게.
     JS 가 클래스를 붙일 때만 숨기므로, 스크립트가 죽어도 콘텐츠는 그대로 보인다.
     동작 최소화를 켠 사용자에게는 아예 걸지 않는다. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!groups.length) return;
    const kidsOf = (g: HTMLElement) =>
      Array.from(g.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
    for (const g of groups) {
      kidsOf(g).forEach((k, i) => {
        k.classList.add("rv");
        k.style.transitionDelay = `${Math.min(i, 7) * 85}ms`;
      });
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          kidsOf(e.target as HTMLElement).forEach((k) => k.classList.add("in"));
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    groups.forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, []);

  /* 8/28 회의로 수량 상한이 없어져 잔여·소진율이 사라졌다 — 누적 판매 대수만 쓴다 */
  const { sold } = calc(inv);
  const soldOut = phase === "sold_out";
  /* 단일가 (8/27 서우: 얼리버드 폐지 — 대외 가격은 650 하나) */
  const curPrice = PRICE.first;  // 1차 판매가 (8/28 회의: 얼리버드 폐기, 1차 전체가 450)

  const specs = en ? SPECS_EN : SPECS;
  const faqs = en ? FAQS_EN : FAQS;
  const linkSteps = en ? LINK_STEPS_EN : LINK_STEPS;
  const rlSteps = en ? RL_STEPS_EN : RL_STEPS;

  const [modal, setModal] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  /* 접기/펴기 인라인 확장 3종 (8/27) — 연동 가이드 · RLUSD 가이드 · 전체 FAQ */
  const [walletGuideOpen, setWalletGuideOpen] = useState(false);
  const [rlGuideOpen, setRlGuideOpen] = useState(false);
  const [faqAllOpen, setFaqAllOpen] = useState(false);
  const faqExtra = en ? FAQS_EXTRA_EN : FAQS_EXTRA;
  const faqList = faqAllOpen ? [...faqs, ...faqExtra] : faqs;
  const faqTotal = faqs.length + faqExtra.length; /* 8/28: 하드코딩 23 → 배열 길이 기반 */
  const heroCtaRef = useRef<HTMLDivElement>(null);

  /* 히어로 배경 롤링 (8/27 후보 4장 비교) — 6초 크로스페이드, reduced-motion 시 고정 */
  const [heroBg, setHeroBg] = useState(0);
  useEffect(() => {
    if (HERO_BGS.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setHeroBg((i) => (i + 1) % HERO_BGS.length), 6000);
    return () => clearInterval(t);
  }, []);

  /* 히어로 루프 영상 (8/29) — reduced-motion 이면 <video> 자체를 만들지 않는다.
     CSS 로 숨기는 방식은 파일을 그대로 받아 버려서(861KB) 안 된다.
     서버 스냅샷을 "reduce" 로 두면 SSR 은 항상 정지컷만 내보내고, 하이드레이션 후 실제 설정에
     따라 붙는다 — 불일치도 없고 effect 안에서 setState 하지도 않는다.
     vidOn 은 canplay 때 켠다(정지컷과 첫 프레임이 같아 실제로는 전환이 보이지 않는다). */
  const reduceMotion = useSyncExternalStore(subscribeReduceMotion, getReduceMotion, () => true);
  const [vidOn, setVidOn] = useState(false);

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

  /* 사전예약 기간 CTA = 온보딩 모달(결제·수량 없음), 판매 기간 = 구매 모달 (8/27 서우) */
  const [preModal, setPreModal] = useState(false);
  const buy = () => (preMode === "pre" ? setPreModal(true) : setModal(true));

  /* D-day 자동 계산 (8/27 서우: "사전예약하기 D-n" 병기) — KST 날짜 기준, 하드코딩 금지 */
  const dDaysTo = (y: number, m: number, d: number) => {
    const kst = new Date(Date.now() + 9 * 3600 * 1000);
    const today = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
    return Math.max(0, Math.round((Date.UTC(y, m - 1, d) - today) / 86400000));
  };
  const dPre = dDaysTo(2026, 9, 5); // 사전예약 오픈 (dday 시뮬 GNB용)
  /* 8/28 서우: 사전예약 즉시 오픈 전제 — 자동 계산(현재 D-18) 대신 D-17 고정 표기.
     실배포 시 `dDaysTo(2026, 9, 15)` 기반 자동 계산으로 복귀 */
  const dSaleBadge = "D-17";

  /* 링크 복사 버튼 (8/27 서우: CTA 옆 링크 → X → 텔레그램 순) */
  const [linkCopied, setLinkCopied] = useState(false);
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + "/"); } catch { /* 클립보드 미허용 환경 무시 */ }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1600);
  };

  return (
    <div style={{ background: "#fff" }}>
      {/* GNB 우측 상태형 슬롯: 판매 중 = 완판 화면 미리보기 칩 / 완판 = 소식 CTA */}
      <Gnb
        dday={preMode === "pre" ? dSaleBadge : preMode === "dday" ? `D-${dPre}` : soldOut ? undefined : "D-12"}
        right={<>
          {preMode ? (
            <>
              <Link href="/?state=sale" className="desk-only" style={previewChip}>{en ? "Sale view" : "판매 화면 보기"}</Link>
              {preMode === "pre"
                ? <Link href="/?state=dday" style={previewChip}>{en ? "D-day view" : "오픈 당일 보기"}</Link>
                : <Link href="/" style={previewChip}>{en ? "Entry view" : "응모 화면 보기"}</Link>}
            </>
          ) : soldOut ? (
            <>
              <Link href="/?state=sale" className="desk-only" style={previewChip}>{en ? "Sale view" : "판매 화면 보기"}</Link>
              <a
                href={LINKS.telegram} target="_blank" rel="noopener"
                style={{ display: "inline-flex", background: "var(--w-main)", color: "#fff", fontSize: 16, fontWeight: 800, borderRadius: 9, padding: "8px 14px", textDecoration: "none" }}
              >
                {en ? "Get updates" : "소식 받기"}
              </a>
            </>
          ) : (
            <>
              <Link href="/" style={previewChip}>{en ? "Entry view" : "응모 화면 보기"}</Link>
              <Link href="/?state=sold_out" className="desk-only" style={previewChip}>{en ? "Closed view" : "판매 마감 화면 보기"}</Link>
            </>
          )}
        </>}
      />

      {/* ── S1 히어로 ── */}
      <section style={{ color: "#fff" }} className="sec-pad hero-photo" aria-label={en ? "Hero" : "히어로"}>
        <div aria-hidden>
          {HERO_BGS.map((src, i) => (
            <div key={src} className={`hero-bg-slide${i === heroBg ? " on" : ""}`} style={{ backgroundImage: `url(${src})` }} />
          ))}
          {!reduceMotion && (
            <video
              className={`hero-bg-vid${vidOn ? " on" : ""}`}
              src={HERO_VIDEO}
              poster={HERO_POSTER}
              autoPlay muted loop playsInline preload="auto"
              tabIndex={-1}
              onCanPlay={(e) => { void e.currentTarget.play().catch(() => {}); setVidOn(true); }}
            />
          )}
          <div className="hero-scrim" />
        </div>
        {soldOut ? (
          /* 1i 완판 히어로 */
          <div className="hero-grid" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: ".14em", color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>
                WEATHER DATA ECONOMY
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="pill" style={{ fontSize: 14.5, letterSpacing: ".1em", background: "rgba(255,255,255,.14)", padding: "5px 12px", color: "#fff" }}>SOLD OUT</span>
                <span style={{ fontSize: 17, color: "rgba(255,255,255,.6)" }}>{t(D.soldOutSub)}</span>
              </div>
              <h1 style={{ fontSize: "clamp(35px, 4.4vw, 44px)", lineHeight: 1.3, fontWeight: 800 }}>
                {en ? <>Sold out —<br />be the first to hear about Batch 2</> : <>완판되었습니다 —<br />2차 판매 소식을 가장 먼저 받아보세요</>}
              </h1>
              {/* 8/28 서우: 히어로 설명 2줄 삭제 (완판 화면도 동일) */}
              {/* 8/28 서우: 락업을 제품 정식명 바로 위로 이동 (기존엔 히어로 최상단). 색상은 그대로 라벤더 유지 */}
              <div className="hero-lockup">
                <Image src="/assets/wb-lav.png" alt="wellbian" width={593} height={215} className="lk-wb" />
                <span className="lk-x">X</span>
                <Image src="/assets/xrpl-lav.png" alt="XRP Ledger" width={609} height={154} className="lk-xrpl" />
              </div>
              <p style={{ fontSize: 19.5, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 520 }}>
                <b style={{ color: "#fff" }}>Weather Data Token Generator™</b>
              </p>
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
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: ".14em", color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>
                WEATHER DATA ECONOMY
              </div>
              <h1 className={en ? "hero-h1-en" : "hero-h1-ko"} style={{ fontSize: en ? "clamp(31px, 3.7vw, 48px)" : "clamp(35px, 5.2vw, 60px)", lineHeight: 1.25, fontWeight: 800, letterSpacing: "-.01em" }}>
                {en ? <>Turn your weather data<br />into value</> : <>당신의 날씨 데이터를<br />가치로 바꾸세요</>}
              </h1>
              {/* 8/28 서우: 히어로 설명 2줄 삭제 — 제품 정식명만 유지 */}
              {/* 8/28 서우: 락업을 제품 정식명 바로 위로 이동 (기존엔 히어로 최상단). 색상은 그대로 라벤더 유지 */}
              <div className="hero-lockup">
                <Image src="/assets/wb-lav.png" alt="wellbian" width={593} height={215} className="lk-wb" />
                <span className="lk-x">X</span>
                <Image src="/assets/xrpl-lav.png" alt="XRP Ledger" width={609} height={154} className="lk-xrpl" />
              </div>
              <p style={{ fontSize: 21, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 520 }}>
                <b style={{ color: "#fff" }}>Weather Data Token Generator™</b>
              </p>
              {preMode === "dday" ? (
                /* 사전예약 오픈 전: 오픈 정보 한 줄 */
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, maxWidth: 480, marginTop: 6, fontSize: 18, fontWeight: 700, flexWrap: "wrap" }}>
                  <span>{en ? "Entries open Sept 5" : "9월 5일 사전 구매응모 오픈"}</span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,.65)" }}>{t(D.ddayLead)}</span>
                </div>
              ) : preMode === "pre" ? (
                /* 8/28 서우 2차: 히어로 가격 한 줄("대당 650 RLUSD")도 삭제 — 가격은 제품·FAQ에서만 */
                null
              ) : (
                /* 판매 표기 = 판매 대수만 (8/27 서우: 잔여·%·게이지 제거) — flex 금지: 텍스트가 flex item으로 쪼개져 "대"가 벌어짐 */
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {en ? <><b className="mono" style={{ color: "#fff", fontSize: 21 }}>{fmt(sold)}</b> units sold</> : <>판매 <b className="mono" style={{ color: "#fff", fontSize: 21 }}>{fmt(sold)}</b>대</>}
                  </div>
                  {/* 8/28 서우: 추첨제로 바꾸고도 판매 화면은 "지금 구매하기"만 말하고 있었다.
                      응모하지 않은 사람이 그냥 살 수 있는 줄 알고 들어온다 — 상태를 먼저 말한다. */}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 9, alignSelf: "flex-start", background: "rgba(255,255,255,.14)", backdropFilter: "blur(14px)", borderRadius: 12, padding: "10px 16px", fontSize: 16, fontWeight: 700, color: "#fff", maxWidth: 520, lineHeight: 1.5 }}>
                    <span className="live-dot" />
                    <span>{t(D.saleWinnersOnly)}</span>
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,.55)", maxWidth: 520 }}>
                    * {t(D.saleLeftoverNote)}
                  </div>
                </div>
              )}
              {/* 모바일: 구매 버튼 전폭 → 아랫줄에 X·텔레그램 나란히 (8/27 서우) */}
              <div ref={heroCtaRef} className="hero-cta-row" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                {preMode === "pre" ? (
                  /* PRE-ORDER — 사전예약 = 실구매 (8/27 서우: 9/5부터 바로), 구매 모달 연결 */
                  /* 8/28 서우 3차: 히어로 버튼 라벨 "사전예약 신청하기" (D-day는 아래 누적 라인) */
                  <button onClick={buy} className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                    {t(D.preorderCta)}
                  </button>
                ) : preMode === "dday" ? (
                  /* 사전예약 오픈 카운트다운 (9/5) */
                  <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)", color: "#fff", textDecoration: "none" }}>
                    <span className="mono" style={{ fontWeight: 800 }}>{cd}</span>&nbsp;{en ? "until entries open" : "후 사전 구매응모 오픈"}
                  </a>
                ) : (
                  <button onClick={buy} className="btn-main btn-shine hero-buy-btn" style={{ fontSize: 21, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                    {en ? "Buy now · RLUSD" : "지금 구매하기 · RLUSD"}
                  </button>
                )}
                <div className="hero-social" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* 링크 → X → 텔레그램 순 (8/27 서우) */}
                  <button onClick={copyLink} className="hero-ico" aria-label={en ? "Copy link" : "링크 복사"} title={en ? "Copy link" : "링크 복사"} style={{ ...heroIcon, cursor: "pointer" }}>
                    {linkCopied ? <Check size={16} color="#8ef0b6" w={3} /> : <LinkIcon size={17} />}
                  </button>
                  <a href={LINKS.x} target="_blank" rel="noopener" className="hero-ico" aria-label="X" style={heroIcon}><XIcon size={18} /></a>
                  <a href={LINKS.telegram} target="_blank" rel="noopener" className="hero-ico" aria-label={en ? "Telegram" : "텔레그램"} style={heroIcon}><TgIcon size={18} /></a>
                </div>
              </div>
              {preMode && (
                /* 누적·D-day 글래스 스탯 테이블 (8/28 서우: 줄글 → "현재 N대 사전예약 | 판매 오픈 D-n",
                   글래스 = 비전 카드와 동일 rgba .3 + blur 14px) */
                <div className="pre-stat" style={{
                  /* 8/28 서우: 테두리 제거 + 흰 배경 단계적 약화(.3→.21→.15), 블러는 유지 */ background: "rgba(255,255,255,.15)",
                  backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                  borderRadius: 14, padding: "14px 22px", marginTop: 4, boxShadow: "0 8px 32px rgba(0,0,0,.18)",
                }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700, color: "#fff" }}>
                    {en
                      ? <><b className="mono count-slot" style={{ fontSize: 21, ...slot(MOCK_PRENOTIFY) }}>{fmt(preMode === "pre" ? notifyCount : MOCK_PRENOTIFY)}</b> units entered</>
                      : <>현재 <b className="mono count-slot" style={{ fontSize: 21, ...slot(MOCK_PRENOTIFY) }}>{fmt(preMode === "pre" ? notifyCount : MOCK_PRENOTIFY)}</b>대 응모</>}
                  </span>
                  <span aria-hidden className="ps-div" />
                  <span style={{ fontSize: 16.5, fontWeight: 700, color: "#fff" }}>
                    {en ? <>Sales open <b className="mono" style={{ fontSize: 21 }}>{dSaleBadge}</b></> : <>판매 오픈 <b className="mono" style={{ fontSize: 21 }}>{dSaleBadge}</b></>}
                  </span>
                </div>
              )}
              {/* 8/29 서우: 판매 조건 * 주석은 커뮤니티 패널 위로 옮겼다(CommunityFooter showNotice).
                  히어로는 CTA·현황까지만 두고 조건문은 아래에서 한 번에 읽게 한다. */}
            </div>
          </div>
        )}
      </section>

      {/* ── S1b 사전예약 실시간 현황판 (teaser 전용, 8/27) — 크레딧 롤: 아래→위 + 상단 페이드아웃 ── */}
      {preMode === "pre" && (
        <section className="sec-pad" style={{ position: "relative", overflow: "hidden", background: "var(--w-deep)", color: "#fff", paddingTop: 48, paddingBottom: 48 }} aria-label={t(D.liveBoard)}>
          {/* 노이즈 그레인 텍스처 — 256px 필름 그레인 타일 반복 (8/28 서우: 물결 → 그레인. wave·marble·contour는 보관) */}
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/assets/grain.png)", backgroundRepeat: "repeat", pointerEvents: "none" }} />
          {/* 8/28 서우: 위·아래 끝을 어둡게 깔아 판이 화면에 잠긴 느낌을 준다.
              콘텐츠(zIndex 1) 아래에 두므로 글자는 가려지지 않는다. */}
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: 96, background: "linear-gradient(180deg, rgba(8,8,30,.62) 0%, rgba(8,8,30,0) 100%)", pointerEvents: "none" }} />
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, background: "linear-gradient(0deg, rgba(8,8,30,.62) 0%, rgba(8,8,30,0) 100%)", pointerEvents: "none" }} />
          <div className="wrap" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19.5, fontWeight: 800 }}>
                <span className="live-dot" />
                {t(D.liveBoard)}
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
                      {f.q}{en ? ` unit${f.q > 1 ? "s" : ""}` : "대"} {en ? "entered" : "응모"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 14.5, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
              {en
                ? "Wallet prefixes are masked. Entries are not purchases — Genesis Numbers are randomly assigned at purchase."
                : "지갑 주소는 앞자리만 표시됩니다. 사전 구매응모는 구매가 아니며, 제네시스 넘버는 정식 구매 시 무작위로 배정됩니다."}
            </div>
          </div>
        </section>
      )}

      {/* ── S2 가격·수량 — 사전예약 기간엔 섹션 자체 숨김 (8/27 서우: 온보딩 과정만 표현) ── */}
      {!preMode && (
      <section className="sec-pad" style={{ background: "#fff" }} id="price">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>{en ? "Price & Supply" : "가격 · 수량"}</h2>
            <p style={{ fontSize: 19, color: "var(--ink-4)" }}>{en ? "Payment in RLUSD" : "결제는 RLUSD로 진행됩니다"}</p>
          </div>
          {/* 1차 판매가 카드 (8/28 회의: 얼리버드 티어 없이 1차 전체 450, 2차부터 650) */}
          <div style={{
            position: "relative", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 14,
            border: "2px solid var(--w-main)", background: "var(--w-tint)", width: "100%", maxWidth: 520, margin: "0 auto",
          }}>
            <div style={{ fontSize: 19.5, fontWeight: 700, color: "var(--w-deep)", marginTop: 6 }}>{en ? "First batch" : "1차 판매가"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center" }}>
              {/* 하드코딩 650 이었다 — 8/28 회의로 1차 450 이 되면서 PRICE 를 실제로 참조하게 고쳤다 */}
              <span className="mono" style={{ fontSize: 49.5, fontWeight: 800, color: "var(--w-deep)" }}>{curPrice}</span>
              <span style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-4)" }}>RLUSD</span>
            </div>
            {/* 2차 가격 안내 — 사실만, 선점 재촉 문구는 넣지 않는다 */}
            <div style={{ fontSize: 16, color: "var(--ink-4)" }}>
              {en ? `From the second batch: ${PRICE.later} RLUSD` : `2차 판매부터는 ${PRICE.later} RLUSD로 적용됩니다`}
            </div>
{/* 8/28 회의: 판매 수량을 스스로 정하지 않기로 해서 "오픈 임박 시 공개"할 수량 자체가 없어졌다 */}
            {soldOut
              ? <span style={{ display: "inline-flex", justifyContent: "center", background: "#d8d8e0", color: "var(--cap)", fontSize: 19.5, fontWeight: 800, borderRadius: 10, padding: 14 }}>{en ? "Sold out" : "완판되었습니다"}</span>
              : <>
                  <button onClick={buy} className="btn-main" style={{ fontSize: 19.5, borderRadius: 10, padding: 14 }}>{en ? "Buy" : "구매하기"}</button>
                  {/* 히어로를 지나쳐 여기까지 내려온 사람에게도 "당첨자 기간"이라는 상태를 한 번 더 알린다 */}
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--cap)", textAlign: "center" }}>{t(D.saleWinnersOnly)}</div>
                </>}
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
      )}

      {/* ── S4 비전 — Weather Data Economy (8/27 사업계획서 함축) + 작동 원리 4단계 ── */}
      {/* 8/28 서우: 시티 렌더(vision-city) 풀블리드 배경 + 카드 글래스(반투명·backdrop blur) */}
      <section className="sec-pad" style={{ position: "relative", overflow: "hidden", background: "var(--sec-alt)" }} id="how">
        {/* 8/28 서우 6차: 도시 사진 배경 제거. 사진 + 화이트 스크림 2겹을 걷어내고 옅은 그라디언트만 남긴다.
            글래스 카드는 backdrop-filter로 뒤를 비추므로 완전 단색이면 카드가 사라져 보인다 — 아주 옅은
            바이올렛 그라디언트를 깔아 카드 경계가 살아 있게 한다. */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(124,107,240,.05) 0%, rgba(124,107,240,.09) 45%, rgba(124,107,240,.04) 100%)", pointerEvents: "none" }} />
        <div className="wrap" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 34, textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: ".14em", color: "var(--w-main)" }}>WEATHER DATA ECONOMY</div>
            {/* 8/28 서우: 확정 슬로건을 선순환 아래에서 여기(eyebrow ↔ 제목 사이)로 옮겼다 */}
            <div style={{ fontSize: "clamp(23px, 2.8vw, 31px)", fontWeight: 800, color: "var(--w-main)", letterSpacing: "-.01em" }}>
              Turn Your Weather Data into Value
            </div>
            <h2 style={h2}>{t(D.howTitle)}</h2>
            <p style={{ fontSize: 19.5, lineHeight: 1.72, color: "var(--ink-4)", maxWidth: 780, margin: "0 auto" }}>
              {t(D.howLead)}
            </p>
          </div>
          <div className="how-grid" data-reveal>
            <HowCard icon={<IconMeasure />} title={`① ${t(D.step1Title)}`} desc={t(D.step1Desc)} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<IconVerify />} title={`② ${t(D.step2Title)}`} desc={t(D.step2Desc)} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<IconReward />} title={`③ ${t(D.step3Title)}`} desc={<>{t(D.step3Desc)}<br /><span style={{ fontSize: 15, color: "var(--cap)" }}>{t(D.rewardNotGuaranteed)}</span></>} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 26, fontWeight: 800 }}>→</div>
            <HowCard icon={<IconUse />} title={`④ ${t(D.step4Title)}`} desc={t(D.step4Desc)} />
          </div>
          {/* 선순환 — 데이터가 실수요처로 유통되어 지속되는 구조 (8/27 서우: 로드맵·역할 줄 대체) */}
          {/* 8/28 서우 2차: 비전·선순환 카드 테두리 원복 (히어로 스탯 테이블만 보더리스 유지) */}
          <div style={{ maxWidth: 880, margin: "0 auto", width: "100%", border: "1px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.25)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderRadius: 16, padding: "26px 28px", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 8px 32px rgba(27,27,72,.08)" }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: "var(--w-deep)" }}>
              {t(D.loopTitle)}
            </div>
            {/* 8/28 서우 6차: "네트워크 지속"이 와닿지 않는다 → 백서(intel/wlbn-platform.md)의 실제 구조로 다시 씀.
                핵심은 보상 재원의 출처다. 에폭 보상 예산이 B2B 데이터 매출에 연동되므로,
                "데이터가 팔린다 → 그 대금이 보상 재원이 된다 → 노드가 늘어 측정망이 촘촘해진다 →
                데이터가 더 쓸모 있어져 수요가 커진다" 로 고리가 닫힌다. 비율(α)은 백서에서
                「고정 예산」과 「매입-분배형」 서술이 아직 한 문장으로 통일되지 않아 대외 표기하지 않는다. */}
            <div className="loop-row" data-reveal>
              {/* 8/28 서우 8차: 칩 글씨가 길어 한눈에 안 들어온다 → 두 줄 → 한 줄 단문으로 축약.
                  자세한 설명은 바로 아래 본문이 이미 하고 있으므로 칩은 흐름만 보이면 된다. */}
              <span className="loop-chip"><IconData size={66} /><span>{t(D.loopData)}</span></span>
              <span className="loop-arrow" aria-hidden>→</span>
              <span className="loop-chip"><IconFlow size={66} /><span>{t(D.loopBuy)}</span></span>
              <span className="loop-arrow" aria-hidden>→</span>
              <span className="loop-chip"><IconCoins size={66} /><span>{t(D.loopFund)}</span></span>
              <span className="loop-arrow" aria-hidden>→</span>
              <span className="loop-chip"><IconNodes size={66} /><span>{t(D.loopGrow)}</span></span>
            </div>
            {/* 마지막에서 처음으로 되돌아가는 고리 — 칩이 4개가 되어 아이콘 하나로는 자리가 모자라
                행 아래 곡선 화살표로 뺐다(방향도 이쪽이 읽기 쉽다) */}
            <div className="loop-return">
              {/* 끝점을 칩 중앙에 맞추려면 폭이 칩 치수를 따라야 한다 — CSS 로 그린다(globals.css .lr-u) */}
              <div className="lr-u" aria-hidden />
              <span>{t(D.loopReturn)}</span>
            </div>
            <p style={{ fontSize: 17.5, lineHeight: 1.7, color: "var(--ink-4)" }}>
              {t(D.loopBody1)}<br />{t(D.loopBody2)}
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--cap)" }}>
              {t(D.privacyNotice)}
            </p>
          </div>
        </div>
      </section>

      {/* ── S3 제품 — 타이틀·스펙은 갤러리 밖(짙은 폰트), 갤러리는 풀폭 이미지 밴드 (8/27 3차) ── */}
      <section id="spec" style={{ background: "var(--sec-alt)" }}>
        <div className="sec-pad" style={{ paddingBottom: 26 }}>
          <div className="wrap" style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={h2}>{en ? "Weather Data Token Generator™" : "날씨데이터토큰생성기™"}</h2>
            <p style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-2)" }}>
              {en ? "Indoor Air Quality Monitor · Model ARC-600DA" : "실내공기측정기 · 모델명 ARC-600DA"}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <span style={certChip}>{en ? "KC Certified" : "KC 인증"}</span>
              <span style={certChip}>{en ? "Performance Certified" : "성능인증"}</span>
            </div>
          </div>
        </div>
        {/* 풀폭 갤러리 밴드 — 텍스트 없음, 롤링 + 도트 + 화살표 */}
        <div className="spec-band">
          {SPEC_GALLERY.map((g, i) => (
            <div key={g.src} className={`spec-bg${i === specImg ? " on" : ""}`} style={{ backgroundImage: `url(${g.src})` }} role="img" aria-label={en ? g.altEn : g.alt} />
          ))}
          <div className="spec-band-shade" aria-hidden />
          <button className="spec-nav prev" aria-label={en ? "Previous image" : "이전 이미지"} onClick={() => setSpecImg((i) => (i - 1 + SPEC_GALLERY.length) % SPEC_GALLERY.length)}>‹</button>
          <button className="spec-nav next" aria-label={en ? "Next image" : "다음 이미지"} onClick={() => setSpecImg((i) => (i + 1) % SPEC_GALLERY.length)}>›</button>
          <div className="spec-dots" style={{ zIndex: 2 }}>
            {SPEC_GALLERY.map((g, i) => (
              <button key={g.src} onClick={() => setSpecImg(i)} aria-label={`${en ? "Image" : "이미지"} ${i + 1}`}
                style={{ width: 9, height: 9, borderRadius: 99, background: i === specImg ? "#fff" : "rgba(255,255,255,.5)", transform: i === specImg ? "scale(1.25)" : "none", transition: "background .15s, transform .15s", boxShadow: "0 1px 4px rgba(0,0,0,.35)" }} />
            ))}
          </div>
        </div>
        <div className="sec-pad" style={{ paddingTop: 26 }}>
          <div className="wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSpecOpen(!specOpen)} aria-expanded={specOpen} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 18, fontWeight: 800, color: "var(--w-main)" }}>
              {specOpen ? (en ? "Hide specifications" : "제품 스펙 접기") : (en ? "See full specifications" : "제품 스펙 더보기")}
              <span style={{ display: "inline-flex", transform: specOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <ChevD size={15} color="var(--w-main)" />
              </span>
            </button>
            {specOpen && (
              <div className="step-in" style={{ width: "100%", maxWidth: 760, background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "8px 22px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {specs.map((s) => (
                    <div key={s.k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "9px 4px", borderBottom: "1px solid var(--line)", fontSize: 17.5, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 800, color: "var(--w-deep)" }}>{s.k}</span>
                      <span style={{ color: "var(--ink-2)" }}>{s.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 15.5, color: "var(--hint)", textAlign: "center" }}>{en ? "Based on the manufacturer's official specification sheet." : "제조사 공식 사양표 기준입니다."}</div>
              </div>
            )}
          </div>
        </div>
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
                {/* 8/28 서우: 카드·칩과 같은 톤의 아이콘으로 각 단계 이해를 돕는다 */}
                <IconStep n={Number(r.n) as 1 | 2 | 3} />
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

      {/* ── S5 연동 안내 (8/27 후순위 이동 — 비전 다음) ── */}
      {/* 8/29 서우: 배송 안내 캡션은 * 주석 블록으로 합쳤다(커뮤니티 패널 위). 가이드가 꺼진 지금
          이 섹션에 남는 내용이 없어 패딩을 0으로 접고 앵커만 유지한다 —
          /me 와 /orders 의 "연동 가이드 보기 →" 가 /#setup 을 가리키기 때문이다. */}
      <section className="sec-pad" style={{ background: "#fff", ...(SHOW_SETUP_GUIDE ? null : { padding: 0 }) }} id="setup">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {SHOW_SETUP_GUIDE && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <h2 style={h2}>{en ? "Your device becomes a node 3 minutes after it arrives" : "디바이스 도착 후 3분이면 노드가 됩니다"}</h2>
              <p style={{ fontSize: 19, color: "var(--ink-4)" }}>{en ? "Setup is easy — open the box and follow four steps." : "등록은 어렵지 않습니다 — 박스를 열고 네 단계면 끝."}</p>
            </div>
          )}
          {SHOW_SETUP_GUIDE && (
            <>
            <div className="link-grid">
              {linkSteps.map((st) => (
                <div key={st.n} style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "22px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, background: "var(--w-deep)", color: "#fff", fontSize: 17, fontWeight: 800 }}>{st.n}</span>
                  <div style={{ fontSize: 19, fontWeight: 800, color: "var(--w-deep)" }}>{st.t}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-4)" }}>
                    {st.d}
                    {st.d2 && <><br />{st.d2}</>}
                  </div>
                </div>
              ))}
            </div>
            {/* 8/28 서우가 왼쪽 "지갑이 처음이어도 됩니다" 안내를 빼면서 이 줄에 토글 버튼만 남았다.
                space-between 이면 버튼이 왼쪽에 붙고 오른쪽이 텅 빈다 — 가운데로 모은다. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, border: "1px solid color-mix(in oklab, var(--w-main) 30%, white)", background: "var(--w-tint)", borderRadius: 12, padding: "16px 20px", flexWrap: "wrap" }}>
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
            </>
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
              {faqAllOpen ? (en ? "Collapse FAQs" : "FAQ 접기") : (en ? `See all ${faqTotal} FAQs` : `전체 FAQ ${faqTotal}문항 보기`)}
              <span style={{ display: "inline-flex", transform: faqAllOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                <ChevD size={15} color="var(--w-main)" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── S9 커뮤니티 + 푸터 ── */}
      <CommunityFooter showNotice={preMode === "pre"} />

      {/* ── S0 스티키 구매 바 (오픈 전 카운트다운에서만 숨김 — 사전예약 중엔 구매 가능) ── */}
      {!soldOut && preMode !== "dday" && (
        <div aria-hidden={!sticky} style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60,
          transform: sticky ? "none" : "translateY(110%)", transition: "transform .3s ease",
          display: "flex", justifyContent: "center",
          background: "#fff", borderTop: "1px solid var(--bd-card)",
          boxShadow: "0 -8px 24px rgba(27,27,72,.1)",
        }} className="stickybar">
          {/* PC: 중앙 한 덩어리 — 사전예약 중엔 예약 대수 + CTA만 (게이지·%·얼리버드·가격 없음, 8/27 서우) */}
          {preMode === "pre" ? (
            <div className="stickybar-in">
              {/* 8/28 서우: "현재 N대 예약 D-n" 한 줄. 3차에서 모바일 2줄 깨짐을 막으려 라벨을
                  데스크톱 전용으로 뺐었는데, 이번엔 문구를 명시해 달라는 요청이라 모바일에도 보인다 —
                  대신 글자를 조금 줄여 한 줄을 유지한다(실측). */}
              {/* 8/28 서우: "999,999 까지 소화할 수 있는 카운팅 자리".
                  글자 크기를 인라인에 두면 좁은 폭에서 CSS 로 줄일 수가 없다(인라인이 이긴다).
                  클래스로 내리고, 400px 아래에서만 글자를 줄여 문구는 그대로 둔 채 한 줄을 지킨다. */}
              <div className="sb-count">
                <span className="sb-lab">{t(D.nowLabel)}</span>
                <span style={{ whiteSpace: "nowrap" }}>
                  <span className="mono sb-num">{fmt(MOCK_PRENOTIFY)}</span>
                  <span className="sb-lab">{t(D.unitsPreordered)}</span>
                </span>
                <span className="mono sb-dday">{dSaleBadge}</span>
              </div>
              <button onClick={buy} className="btn-main btn-shine" style={{ fontSize: 19.5, borderRadius: 10, padding: "13px 34px", whiteSpace: "nowrap" }}>{en ? "Enter" : "응모하기"}</button>
            </div>
          ) : (
          <div className="stickybar-in">
            <div className="desk-only" style={{ fontSize: 15, color: "var(--ink-4)" }}>
              {en ? <><b className="mono" style={{ color: "var(--w-deep)", fontSize: 19 }}>{fmt(sold)}</b> units sold</> : <>판매 <b className="mono" style={{ color: "var(--w-deep)", fontSize: 19 }}>{fmt(sold)}</b>대</>}
            </div>
            <span className="desk-only" style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mob-only" style={{ fontSize: 14.5, color: "var(--cap)" }}>
                {en ? `${fmt(sold)} sold` : `판매 ${fmt(sold)}대`}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="desk-only" style={{ fontSize: 15.5, color: "var(--cap)" }}>{en ? "Price" : "현재 가격"}</span>
                <span style={{ fontSize: 23.5, fontWeight: 800, color: "var(--w-deep)" }}>{curPrice} RLUSD</span>
              </div>
            </div>
            <button onClick={buy} className="btn-main btn-shine" style={{ fontSize: 19.5, borderRadius: 10, padding: "13px 34px" }}>{en ? "Buy" : "구매하기"}</button>
          </div>
          )}
        </div>
      )}

      {modal && <BuyModal demoMismatch={demoMismatch} onClose={() => setModal(false)} />}
      {preModal && <PreOrderModal onClose={() => setPreModal(false)} />}
    </div>
  );
}

function HowCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    /* 글래스 카드 (8/28 서우: 비전 배경 위 반투명 — 뒤 도시가 블러로 비침) */
    /* 8/28 서우 3차: SVG 아이콘 타일 → 힉스필드 매트 3D 아이콘 (투명 webp, 카드 상단 대형) */
    <div style={{ border: "1px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.25)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 8px 32px rgba(27,27,72,.08)", borderRadius: 16, padding: "26px 24px 30px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      {/* 8/28 서우 5차: 래스터 3D → 인라인 SVG(반투명·연한 색·약한 유광). 4개가 같은 96 뷰박스라 광학 크기가 자동으로 맞는다 */}
      <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--w-deep)" }}>{title}</div>
      <div style={{ fontSize: 17.5, lineHeight: 1.6, color: "var(--ink-4)" }}>{desc}</div>
    </div>
  );
}

/* 히어로 배경 — 블루+퍼플 확정 (8/27 서우). 나머지 후보(hero-bg.jpg·-3·-4)는 hide, 파일 유지 —
   재비교 시 배열에 다시 넣으면 롤링 복원 */
/* 히어로 배경 — 8/28 서우: 배경은 서우가 직접 교체한다(Vercel 배포 zip을 풀어 파일을 넣고 재압축).
   교체 지점을 public/assets/hero/ 한 폴더로 고정했다 — 같은 이름으로 덮어쓰면 코드는 손댈 필요가 없다.
   사용법·규격은 같은 폴더의 README.txt. (8/29 영상 전환 이후 교체 대상은 아래 세 파일이다.)

   폴백을 CSS 다중 레이어(url(a), url(b))로 만들지 않은 이유: 브라우저는 background-image의
   모든 레이어를 실제로 내려받는다. 즉 커스텀을 넣어도 폴백 이미지가 매번 같이 다운로드되고
   넣기 전에는 404가 콘솔·Vercel 로그에 남는다. 그래서 그 경로에 현재 파일을 미리 넣어 두는
   쪽을 택했다 — 파일이 항상 존재하므로 폴백 자체가 필요 없다.
   구 후보(hero-bg.webp·-bg.jpg·-2·-3·-4)는 재비교용으로 보관만 한다. */
/* 8/29 서우: 히어로를 루프 영상으로. 소스는 힉스필드 H.264 다운로드(2.55MB, 8bit).
   HEVC(H.265) 다운로드는 쓰지 않는다 — 크롬·파이어폭스가 대체로 못 열어 배경이 정지컷에서 멈춘다.
   오디오 트랙은 버렸다(무음 배경이라 필요 없고, muted autoplay 조건도 확실해진다).
   VP9 webm 을 같이 두지 않는 이유: 서우가 mp4 를 직접 갈아 끼우는데, 옛 webm 이 남아 있으면
   브라우저가 그쪽을 먼저 골라 "바꿨는데 그대로"가 된다. H.264 는 어차피 전 브라우저가 연다.

   원본은 첫/끝 프레임이 달라 5초마다 툭 끊겼다(PSNR 21dB). 끝 20프레임을 첫 20프레임에 알파
   크로스페이드로 겹쳐 4.21초 이음매 없는 루프로 만들었다(이음매 30.8dB ≒ 일반 연속 프레임 32.6dB).
   이 이음매 처리 때문에 재인코딩이 불가피하다. 처음에 CRF 26(949KB)으로 조였다가 홀로그램
   등고선이 뭉개져 서우가 반려했다 → CRF 16(3.0MB)으로 올렸다. 원본 대비 SSIM 0.990 이라
   1:1 확대에서도 구분이 안 된다. CRF 를 더 낮춰도(14 → 3.7MB) 지표가 0.002 움직일 뿐이다.

   정지컷(hero-loop-poster.webp)은 영상 첫 프레임이다. 영상과 같은 장면이라 로딩·저사양·
   reduced-motion 어디서도 화면이 바뀌지 않는다. 구 정지컷 hero-bg.webp(패키지 박스 구도)는
   장면이 달라 더 이상 히어로에 쓰지 않는다 — 파일은 재사용 대비로 남겨 뒀다. */
/* prefers-reduced-motion 구독 — 설정을 바꾸면 즉시 반영된다.
   서버 스냅샷은 true(=모션 줄이기)로 둔다: SSR HTML 에 <video> 가 없어야 안전하다. */
const RM_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduceMotion = (cb: () => void) => {
  const m = matchMedia(RM_QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const getReduceMotion = () => matchMedia(RM_QUERY).matches;

const HERO_VIDEO = "/assets/hero/hero-loop.mp4";
const HERO_POSTER = "/assets/hero/hero-loop-poster.webp";
const HERO_BGS = [HERO_POSTER];

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
  { t: "비밀번호는 꼭 보관하세요", d: "비수탁 지갑은 비밀번호나 시드를 잃으면 누구도 복구해 줄 수 없습니다. 안전한 곳에 따로 적어 두세요." },
];
const WALLET_GUIDE_EN = [
  { t: "You can start without a wallet", d: "Device registration also works with an easy wallet created from an ID/password or social login. Keys are generated in your own browser (non-custodial) — even we can't open it." },
  { t: "Buy with an external wallet", d: "D'CENT (auto-detected in its app), Xaman (QR connect), and GemWallet (browser extension) are supported. Pick one at checkout and we walk you through connecting." },
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
];
const RL_TIPS_EN = [
  "Your wallet's readiness to receive RLUSD (the trust line) is checked automatically at payment",
  "Network fees cost a tiny amount of XRP — keep a little XRP in your wallet",
];

const h2: React.CSSProperties = { fontSize: "clamp(27px, 3.4vw, 39px)", fontWeight: 800, color: "var(--w-deep)" };
/* 히어로 소셜 아이콘 — 레이아웃만 인라인. 테두리·배경·hover 는 .hero-ico (globals.css).
   인라인 border 가 있으면 CSS 의 hover 가 우선순위에서 밀린다. */
const heroIcon: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 12, color: "#fff" };

/* GNB 미리보기 칩 — 점선 보더 = 데모 컨트롤 시그널 (실배포 시 상태 머신이 대체) */
const previewChip: React.CSSProperties = { display: "inline-flex", fontSize: 15, fontWeight: 700, color: "var(--cap)", border: "1px dashed var(--bd-input)", borderRadius: 8, padding: "6px 10px", textDecoration: "none", whiteSpace: "nowrap" };
const certChip: React.CSSProperties = { fontSize: 14.5, fontWeight: 700, border: "1px solid var(--bd-input)", borderRadius: 6, padding: "4px 8px", color: "var(--ink-2)" };
/* 다크(사진 배경) 위 인증 칩 — S3 히어로형 갤러리용 */
const certChipDark: React.CSSProperties = { fontSize: 15, fontWeight: 700, border: "1px solid rgba(255,255,255,.45)", background: "rgba(27,27,72,.35)", borderRadius: 99, padding: "6px 14px", color: "#fff", backdropFilter: "blur(3px)" };
