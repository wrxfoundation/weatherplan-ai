"use client";
/* 판매 랜딩 S0~S9 (PRD §6.1) + 엣지 상태 1h/1i (§6.4) */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SPECS, FAQS, LINK_STEPS, RL_STEPS, LINKS, MOCK_INVENTORY, PRICE,
  calc, fmt, NOTICE_REWARD, type SalePhase,
} from "@/lib/data";
import { Gnb, CommunityFooter } from "./chrome";
import BuyModal from "./BuyModal";
import { XIcon, TgIcon, ChevD, Shield, ShieldCheck, Gauge, Coin, Warn, ChevR } from "./icons";

export default function Landing() {
  const sp = useSearchParams();
  const stateParam = sp.get("state");
  const demoMismatch = sp.get("demo") === "mismatch"; // 결제 mismatch 분기 재현용 (내부 데모)
  const phase: SalePhase =
    stateParam === "eb_closed" ? "general" : stateParam === "sold_out" ? "sold_out" : "early_bird";

  const inv = MOCK_INVENTORY[phase]; // GET /api/inventory 대응 지점
  const { remain, pct, ebPct, genPct } = calc(inv);
  const soldOut = phase === "sold_out";
  const ebClosed = phase !== "early_bird";
  const curPrice = ebClosed ? PRICE.gen : PRICE.eb;

  const [modal, setModal] = useState(false);
  const [banner, setBanner] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const heroCtaRef = useRef<HTMLDivElement>(null);

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
      {/* GNB 우측 상태형 슬롯: 판매 중 = 완판 화면 미리보기 칩 / 완판 = 2차 대기 CTA */}
      <Gnb
        dday={soldOut ? undefined : "D-12"}
        right={<>
          {soldOut ? (
            <>
              <Link href="/" className="desk-only" style={previewChip}>판매 화면 보기</Link>
              <a
                href={LINKS.telegram} target="_blank" rel="noopener"
                style={{ display: "inline-flex", background: "var(--w-main)", color: "#fff", fontSize: 12.5, fontWeight: 800, borderRadius: 9, padding: "8px 14px", textDecoration: "none" }}
              >
                소식 받기
              </a>
            </>
          ) : ebClosed ? (
            <>
              <Link href="/" className="desk-only" style={previewChip}>판매 화면 보기</Link>
              <Link href="/?state=sold_out" style={previewChip}>완판 화면 보기</Link>
            </>
          ) : (
            <>
              <Link href="/?state=eb_closed" className="desk-only" style={previewChip}>얼리버드 마감 보기</Link>
              <Link href="/?state=sold_out" style={previewChip}>완판 화면 보기</Link>
            </>
          )}
        </>}
      />

      {/* 1h 얼리버드 마감 배너 (1회성) */}
      {ebClosed && !soldOut && banner && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--w-deep)", color: "#fff", padding: 11, fontSize: 13, fontWeight: 700 }}>
          얼리버드 마감 — 일반가 650 RLUSD로 판매 중입니다
          <button onClick={dismissBanner} aria-label="배너 닫기" style={{ opacity: 0.5, fontSize: 15, marginLeft: 8, color: "#fff" }}>✕</button>
        </div>
      )}

      {/* ── S1 히어로 ── */}
      <section style={{ background: "var(--w-deep)", color: "#fff" }} className="sec-pad" aria-label="히어로">
        {soldOut ? (
          /* 1i 완판 히어로 */
          <div className="hero-grid" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="pill" style={{ fontSize: 11, letterSpacing: ".1em", background: "rgba(255,255,255,.14)", padding: "5px 12px", color: "#fff" }}>SOLD OUT</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>총 5,000대가 모두 판매되었습니다</span>
              </div>
              <h1 style={{ fontSize: "clamp(27px, 3.4vw, 34px)", lineHeight: 1.3, fontWeight: 800 }}>
                완판되었습니다 —<br />2차 판매 소식을 가장 먼저 받아보세요
              </h1>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 440 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>
                  <span>총 5,000대 한정</span><span>잔여 0대 · 100% 판매</span>
                </div>
                <div className="track on-dark" style={{ height: 8 }}><i style={{ width: "100%" }} /></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <a href={LINKS.telegram} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", color: "var(--w-deep)", fontSize: 15, fontWeight: 800, borderRadius: 12, padding: "16px 24px", textDecoration: "none" }}>
                  <TgIcon size={15} /> 텔레그램 소식 받기
                </a>
                <a href={LINKS.x} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 12, padding: "15px 20px", textDecoration: "none" }}>
                  <XIcon size={14} /> X 소식 받기
                </a>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>공식 텔레그램과 X에서 2차 판매 소식을 가장 먼저 알려드립니다</div>
            </div>
            <DeviceRender />
          </div>
        ) : (
          <div className="hero-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".14em", color: "color-mix(in oklab, var(--w-main) 45%, white)" }}>
                WEATHER DATA ECONOMY
              </div>
              <h1 style={{ fontSize: "clamp(27px, 4vw, 46px)", lineHeight: 1.25, fontWeight: 800, letterSpacing: "-.01em" }}>
                당신의 날씨 데이터를<br />가치로 바꾸세요
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 520 }}>
                <b style={{ color: "#fff" }}>Weather Data Token Generator™</b>
                <br />
                실내 공기를 측정하고, 검증된 데이터로 네트워크에 기여하는 가장 쉬운 방법.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 440, marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>총 5,000대 한정</span>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>잔여 <b style={{ color: "#fff" }}>{fmt(remain)}</b>대 · {pct}% 판매</span>
                </div>
                <div className="track on-dark" style={{ height: 8 }}><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
              </div>
              <div ref={heroCtaRef} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={buy} className="btn-main" style={{ fontSize: 16, padding: "16px 28px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
                  지금 구매하기 · RLUSD
                </button>
                <a href={LINKS.x} target="_blank" rel="noopener" aria-label="X" style={heroIcon}><XIcon size={18} /></a>
                <a href={LINKS.telegram} target="_blank" rel="noopener" aria-label="텔레그램" style={heroIcon}><TgIcon size={18} /></a>
              </div>
            </div>
            <DeviceRender />
          </div>
        )}
      </section>

      {/* ── S2 가격·수량 ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="price">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>가격 · 수량</h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-4)" }}>결제는 RLUSD로 진행됩니다 · 총 5,000대 한정</p>
          </div>
          <div className="price-grid">
            {/* 얼리버드 카드 */}
            <div style={{
              position: "relative", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 14,
              ...(ebClosed
                ? { border: "1px solid var(--bd-card)", background: "var(--card-dis)", filter: "grayscale(1)", opacity: 0.6 }
                : { border: "2px solid var(--w-main)", background: "var(--w-tint)" }),
            }}>
              <span className="pill" style={{ position: "absolute", top: -12, left: 28, background: ebClosed ? "var(--cap)" : "var(--w-main)", color: "#fff", fontSize: 11.5, padding: "5px 12px" }}>
                {ebClosed ? "얼리버드 마감" : "얼리버드 · 소진 임박"}
              </span>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--w-deep)", marginTop: 6 }}>얼리버드</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: "var(--w-deep)", textDecoration: ebClosed ? "line-through" : "none" }}>450</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-4)" }}>RLUSD</span>
                {!ebClosed && <span style={{ fontSize: 13, color: "var(--hint)", textDecoration: "line-through", marginLeft: 4 }}>650 RLUSD</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-4)" }}>
                  <span>잔여 <b style={{ color: ebClosed ? "var(--ink-4)" : "var(--w-main)" }}>{fmt(inv.ebLeft)}</b> / 1,000대</span>
                  <span>{ebPct}% 소진</span>
                </div>
                <div className={`track on-light${ebClosed ? " gray" : ""}`} style={{ height: 6 }}><i style={{ width: `${ebPct}%` }} /></div>
              </div>
              {ebClosed
                ? <span style={{ display: "inline-flex", justifyContent: "center", background: "#d8d8e0", color: "var(--cap)", fontSize: 15, fontWeight: 800, borderRadius: 10, padding: 14 }}>마감되었습니다</span>
                : <button onClick={buy} className="btn-main" style={{ fontSize: 15, borderRadius: 10, padding: 14 }}>구매하기</button>}
              {!ebClosed && <div style={{ fontSize: 12, color: "var(--cap)" }}>소진 시 일반가로 자동 전환됩니다</div>}
            </div>
            {/* 일반 카드 */}
            <div style={{
              position: "relative", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 14,
              ...(ebClosed && !soldOut
                ? { border: "2px solid var(--w-main)", background: "var(--w-tint)" }
                : { border: "1px solid var(--bd-card)", background: "#fff" }),
            }}>
              {ebClosed && !soldOut && (
                <span className="pill" style={{ position: "absolute", top: -12, left: 28, background: "var(--w-main)", color: "#fff", fontSize: 11.5, padding: "5px 12px" }}>현재 판매가</span>
              )}
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--w-deep)", marginTop: 6 }}>일반</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: "var(--w-deep)" }}>650</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-4)" }}>RLUSD</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-4)" }}>
                  <span>잔여 <b style={{ color: ebClosed && !soldOut ? "var(--w-main)" : "var(--w-deep)" }}>{fmt(inv.genLeft)}</b> / 4,000대</span>
                  <span>{genPct}% 소진</span>
                </div>
                <div className="track on-light" style={{ height: 6 }}>
                  <i style={{ width: `${Math.max(2, genPct)}%`, background: ebClosed && !soldOut ? "var(--w-main)" : "var(--arrow)" }} />
                </div>
              </div>
              {soldOut
                ? <span style={{ display: "inline-flex", justifyContent: "center", background: "#d8d8e0", color: "var(--cap)", fontSize: 15, fontWeight: 800, borderRadius: 10, padding: 14 }}>완판되었습니다</span>
                : ebClosed
                  ? <button onClick={buy} className="btn-main" style={{ fontSize: 15, borderRadius: 10, padding: 14 }}>구매하기</button>
                  : <button onClick={buy} className="btn-outline-deep" style={{ fontSize: 15, padding: 14 }}>구매하기</button>}
              <div style={{ fontSize: 12, color: "var(--cap)" }}>{ebClosed ? "" : "얼리버드 마감 후 판매가"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "16px 20px", background: "var(--panel)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: "var(--w-tint)", color: "var(--w-main)", fontWeight: 800, fontSize: 13, flex: "none" }}>#</span>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
              <b style={{ color: "var(--w-deep)" }}>제네시스 넘버</b> — 결제 확정 순서대로 배정되며, 라이선스 NFT에 영구 기록됩니다.
            </div>
          </div>
        </div>
      </section>

      {/* ── S3 제품 스펙 ── */}
      <section className="sec-pad" style={{ background: "var(--sec-alt)" }} id="spec">
        <div className="wrap spec-grid">
          {/* 제품 이미지 좌측 · 스펙 테이블 우측 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ width: "100%", height: 380, borderRadius: 14, border: "1px solid var(--bd-card)", overflow: "hidden" }}>
              <Image src="/assets/spec-package.jpg" alt="Weather Data Token Generator 패키지 및 제품" width={1000} height={749} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ border: "1px solid var(--bd-card)", borderRadius: 12, background: "#fff", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)" }}>날씨데이터토큰생성기™ (실내공기측정기)</div>
              <div style={{ fontSize: 13, color: "var(--ink-4)" }}>모델명: ARC-600DA</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={certChip}>KC 인증</span>
                <span style={certChip}>성능인증</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={h2}>제품 스펙</h2>
            {/* 15행 — 행 간격 압축 */}
            <div style={{ display: "flex", flexDirection: "column", borderTop: "2px solid var(--w-deep)" }}>
              {SPECS.map((s, i) => (
                /* 모바일: 5행 축약 (PRD §6.1) */
                <div key={s.k} className={i >= 5 ? "desk-only" : undefined} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "7px 4px", borderBottom: "1px solid var(--line)", fontSize: 13.5, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 700, color: "var(--w-deep)" }}>{s.k}</span>
                  <span style={{ color: "var(--ink-2)" }}>{s.v}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--hint)" }}>제조사 공식 사양표 기준입니다.</div>
          </div>
        </div>
      </section>

      {/* ── S4 작동 원리 ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="how">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 32, textAlign: "center" }}>
          <h2 style={h2}>작동 원리, 3단계</h2>
          <div className="how-grid">
            <HowCard icon={<Gauge />} title="① 측정" desc={<>CO₂·미세먼지·온습도 등<br />실내 공기 데이터를 측정합니다</>} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 20, fontWeight: 800 }}>→</div>
            <HowCard icon={<ShieldCheck />} title="② 검증" desc={<>네트워크가 데이터의<br />무결성을 검증합니다</>} />
            <div className="how-arrow" style={{ color: "var(--arrow)", fontSize: 20, fontWeight: 800 }}>→</div>
            <HowCard icon={<Coin />} title="③ 보상" desc={<>검증된 데이터에 네트워크 원칙에<br />따라 WLBN이 지급됩니다</>} />
          </div>
          <div style={{ fontSize: 12, color: "var(--hint)" }}>{NOTICE_REWARD} · 자세한 원칙은 FAQ를 참고하세요</div>
        </div>
      </section>

      {/* ── S5 연동 안내 ── */}
      <section className="sec-pad" style={{ background: "var(--sec-alt)" }} id="setup">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>도착 후 3분이면 노드가 됩니다</h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-4)" }}>등록은 어렵지 않습니다 — 박스를 열고 네 단계면 끝.</p>
          </div>
          <div className="link-grid">
            {LINK_STEPS.map((st) => (
              <div key={st.n} style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, background: "var(--w-deep)", color: "#fff", fontSize: 13, fontWeight: 800 }}>{st.n}</span>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>{st.t}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-4)" }}>
                  {st.d}
                  {st.d2 && <><br />{st.d2}</>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, border: "1px solid color-mix(in oklab, var(--w-main) 30%, white)", background: "var(--w-tint)", borderRadius: 12, padding: "16px 20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5, color: "var(--ink-2)" }}>
              <Shield />
              <span><b style={{ color: "var(--w-deep)" }}>지갑이 처음이어도 됩니다</b> — 등록 지갑 활성화(1 XRP)는 1회 지원됩니다 <span style={{ color: "var(--cap)" }}>(약관 제5조)</span></span>
            </div>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}>상세 연동 가이드 보기 →</a>
          </div>
        </div>
      </section>

      {/* ── S6 RLUSD 준비 ── */}
      <section className="sec-pad" style={{ background: "#fff" }} id="rlusd">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={h2}>RLUSD가 없다면</h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-4)" }}>RLUSD — 미국 달러 1:1 연동 · NYDFS 규제 · 리플(Ripple) 발행 스테이블코인</p>
          </div>
          <div className="rl-grid">
            {RL_STEPS.map((r) => (
              <div key={r.n} style={{ border: "1px solid var(--bd-card)", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--w-main)" }}>STEP {r.n}</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--w-deep)" }}>{r.t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-4)" }}>{r.d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--warn-bd)", background: "var(--warn-bg)", borderRadius: 12, padding: "15px 20px", fontSize: 13.5, color: "var(--warn-text)" }}>
            <Warn />
            <span><b>출금 네트워크는 반드시 XRPL을 선택하세요.</b> 다른 네트워크로 출금하면 자산을 잃을 수 있습니다.</span>
          </div>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--bd-card)", borderRadius: 12, padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "var(--w-deep)", background: "#fff", width: "100%" }}>
            <span>RLUSD 구매 가이드 전체 보기</span>
            <ChevD size={16} color="var(--cap)" />
          </button>
        </div>
      </section>

      {/* ── S7 FAQ ── */}
      <section className="sec-pad" style={{ background: "var(--sec-alt)" }} id="faq">
        <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ ...h2, textAlign: "center" }}>자주 묻는 질문</h2>
          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "8px 28px", display: "flex", flexDirection: "column" }}>
            {FAQS.map((f, i) => {
              const open = faqOpen === i;
              return (
                /* 모바일: 3문항 축약 (PRD §6.1) — 전체는 "전체 FAQ 보기"로 */
                <div key={f.q} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--line)" : "none" }} className={`${open ? "acc-open" : ""}${i >= 3 ? " desk-only" : ""}`}>
                  <button onClick={() => setFaqOpen(open ? -1 : i)} aria-expanded={open}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 2px", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--w-deep)" }}>{f.q}</span>
                    <ChevD className="acc-chev" />
                  </button>
                  {open && (
                    <div style={{ padding: "0 2px 20px", fontSize: 14, lineHeight: 1.7, color: "var(--ink-3)", maxWidth: 680 }}>{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center" }}>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, fontWeight: 700 }}>전체 FAQ 23문항 보기 →</a>
          </div>
        </div>
      </section>

      {/* ── S9 커뮤니티 + 푸터 ── */}
      <CommunityFooter />

      {/* ── S0 스티키 구매 바 ── */}
      {!soldOut && (
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-4)" }}>
                <span>잔여 <b style={{ color: "var(--w-deep)" }}>{fmt(remain)}</b> / 5,000대</span><span>{pct}%</span>
              </div>
              <div className="track" style={{ height: 5, background: "var(--line)" }}><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
            </div>
            <span className="desk-only" style={{ width: 1, height: 30, background: "var(--line)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mob-only" style={{ fontSize: 11, color: "var(--cap)" }}>잔여 {fmt(remain)}대 · {ebClosed ? "일반" : "얼리버드"}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="desk-only" style={{ fontSize: 12, color: "var(--cap)" }}>현재 가격</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--w-deep)" }}>{curPrice} RLUSD</span>
                <span className="desk-only" style={{ fontSize: 12, color: "var(--hint)" }}>{ebClosed ? "일반" : "얼리버드"}</span>
              </div>
            </div>
            <button onClick={buy} className="btn-main" style={{ fontSize: 15, borderRadius: 10, padding: "13px 34px" }}>구매하기</button>
          </div>
        </div>
      )}

      {modal && <BuyModal ebLeft={inv.ebLeft} demoMismatch={demoMismatch} onClose={() => setModal(false)} />}
    </div>
  );
}

function DeviceRender() {
  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: 20, overflow: "hidden", boxShadow: "0 28px 60px rgba(0,0,0,.45)" }}>
      <Image src="/assets/hero-life.webp" alt="Weather Data Token Generator — 실내 설치 컷" width={1000} height={749} priority
        style={{ width: "100%", height: "auto", display: "block" }} />
    </div>
  );
}

function HowCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--bd-card)", borderRadius: 16, padding: "32px 24px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "var(--w-tint)", color: "var(--w-main)" }}>{icon}</span>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--w-deep)" }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-4)" }}>{desc}</div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: "clamp(21px, 2.6vw, 30px)", fontWeight: 800, color: "var(--w-deep)" };
const heroIcon: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, border: "1px solid rgba(255,255,255,.28)", borderRadius: 12, color: "#fff" };

/* GNB 미리보기 칩 — 점선 보더 = 데모 컨트롤 시그널 (실배포 시 상태 머신이 대체) */
const previewChip: React.CSSProperties = { display: "inline-flex", fontSize: 11.5, fontWeight: 700, color: "var(--cap)", border: "1px dashed var(--bd-input)", borderRadius: 8, padding: "6px 10px", textDecoration: "none", whiteSpace: "nowrap" };
const certChip: React.CSSProperties = { fontSize: 11, fontWeight: 700, border: "1px solid var(--bd-input)", borderRadius: 6, padding: "4px 8px", color: "var(--ink-2)" };
