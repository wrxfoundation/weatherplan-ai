"use client";
/* 2a 2차 대기 등록 랜딩 — 이메일 + 지갑만 (개인정보 최소화, PRD §6.4) */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevR, Clock } from "@/components/icons";
import { TIERS } from "@/lib/data";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [wallet, setWallet] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes("@") || busy) return;
    setBusy(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, wallet: wallet ? "rWLB9…kQ2f" : null }),
      });
    } catch {}
    router.push("/waitlist/complete");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* 헤더 */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 36px", borderBottom: "1px solid var(--line)", background: "#fff" }} className="gnb-root">
        <Link href="/" style={{ display: "inline-flex" }}>
          <Image src="/assets/wb-black.png" alt="wellbian" width={100} height={20} style={{ height: 20, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--cap)" }} className="desk-only">2차 판매 10/3 오픈</span>
          <a href="#register" className="btn-main" style={{ fontSize: 13, borderRadius: 9, padding: "9px 16px", color: "#fff", textDecoration: "none" }}>대기 등록</a>
        </div>
      </header>

      {/* 딥 히어로 + 등록 카드 */}
      <section className="wl-hero-pad" style={{ background: "var(--w-deep)", color: "#fff" }}>
        <div className="wl-hero-grid wrap">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="pill" style={{ fontSize: 11, letterSpacing: ".1em", background: "rgba(255,255,255,.14)", padding: "5px 12px" }}>1차 완판</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>2차 접수는 9/30 마감 · 판매 10/3</span>
            </div>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", lineHeight: 1.3, fontWeight: 800 }}>
              활동할수록 앞자리 —<br />2차 구매 우선권을 확보하세요
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,.72)", maxWidth: 480 }}>
              미션 참여로 <b style={{ color: "#fff" }}>응모권</b>을 모으면 S그룹(1,000명) 추첨 확률이 오르고, <b style={{ color: "#fff" }}>순번 점수</b>는 미당첨이어도 A/B 그룹을 확정합니다 — 떨어져도 완전히 잃지 않습니다.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--ok-dot)" }} />
                현재 <b style={{ color: "#fff" }}>12,847명</b> 대기 중
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>추첨 시드는 마감 전 공개 — 재현 가능한 공정성</span>
            </div>
          </div>

          <div id="register" style={{ background: "#fff", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 14, color: "var(--ink-1)", boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--w-deep)" }}>2차 대기 등록</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="wl-email" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>이메일</label>
              <input
                id="wl-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: "1px solid var(--bd-input)", borderRadius: 10, padding: "13px 14px", fontSize: 14, outline: "none", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>지갑</label>
              <button
                onClick={() => setWallet((w) => !w)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: wallet ? "1.5px solid var(--w-main)" : "1px solid var(--bd-input)",
                  borderRadius: 10, padding: "13px 14px", fontSize: 13.5, fontWeight: 700,
                  color: "var(--w-deep)", background: wallet ? "var(--w-tint)" : "#fff", textAlign: "left",
                }}
              >
                {wallet ? <span className="mono" style={{ fontSize: 13 }}>rWLB9…kQ2f — 연결됨</span> : "지갑 연결하기"}
                <ChevR size={15} />
              </button>
            </div>
            <button className="btn-main" style={{ fontSize: 15, borderRadius: 11, padding: 15 }} disabled={!email.includes("@") || busy} onClick={submit}>
              {busy ? "등록 중…" : "대기 등록 — 응모권 +10장"}
            </button>
            {/* 프로모션 직행 — 등록 완료 화면 경유 없이 미션 대시보드로 (서우 요청: 단계 태우지 않기) */}
            <Link href="/me/waitlist" className="btn-outline-deep" style={{ fontSize: 14, borderRadius: 11, padding: 13, textDecoration: "none" }}>
              우선권 프로모션 참여 →
            </Link>
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--cap)" }}>
              이미 등록하셨다면 바로 미션에 참여해 응모권을 모을 수 있습니다 · 수집은 이메일·지갑 주소 2가지뿐입니다
            </div>
          </div>
        </div>
      </section>

      {/* 이원 구조 설명 */}
      <section className="wl-sec-pad" style={{ background: "#fff", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--w-deep)", textAlign: "center" }}>두 가지를 동시에 모읍니다</h2>

        <div className="price-grid" style={{ gap: 20, maxWidth: 1080, margin: "0 auto", width: "100%" }}>
          <div style={{ border: "2px solid var(--w-main)", background: "var(--w-tint)", borderRadius: 16, padding: 26, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--w-main)", letterSpacing: ".06em" }}>응모권 — 추첨 확률</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--w-deep)" }}>모을수록 S그룹 당첨 확률이 오릅니다</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>
              등록 +10 · 공유 +6 · 커뮤니티 +5 · 케이웨더 앱 +5 · 초대 +5/명(상한 10명) · X 팔로우 +3 · 유튜브 +3 · 인스타 +2 · 매일 방문 +1
            </div>
          </div>
          <div style={{ border: "1px solid var(--bd-card)", borderRadius: 16, padding: 26, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--w-deep)", letterSpacing: ".06em" }}>순번 점수 — 그룹 확정</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--w-deep)" }}>미당첨이어도 A/B 그룹으로 자동 편입</div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--ink-3)" }}>
              등록 100 · 구매 의사 20 · 커뮤니티 20 · 초대 30 — 검증 가능한 항목만 반영됩니다 (팔로우·구독은 응모권 전용)
            </div>
          </div>
        </div>

        <div className="tier-grid" style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>
          {TIERS.map((g) => (
            <div key={g.n} style={{ border: "1px solid var(--bd-card)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {g.hot ? (
                <span style={{ display: "inline-flex", alignSelf: "flex-start", width: 34, height: 34, borderRadius: 10, background: "var(--w-main)", color: "#fff", fontSize: 15, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{g.n}</span>
              ) : (
                <span style={{ display: "inline-flex", alignSelf: "flex-start", minWidth: 34, height: 34, borderRadius: 10, background: "var(--chip)", color: "var(--w-deep)", fontSize: 14, fontWeight: 800, alignItems: "center", justifyContent: "center", padding: "0 8px" }}>{g.n}</span>
              )}
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)" }}>{g.t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--cap)" }}>{g.d}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink-4)", flexWrap: "wrap" }}>
          오픈 순서<span style={{ color: "var(--w-main)" }}>S</span>→<span>A</span>→<span>B</span>→<span>일반</span>
          <span style={{ color: "var(--hint)", fontWeight: 500 }}>· 10/3 순차 오픈 · 현장 배분 500대(10/2~3 부스)</span>
        </div>

        <div style={{ display: "flex", gap: 10, border: "1px solid var(--bd-card)", background: "var(--panel)", borderRadius: 12, padding: "14px 18px", fontSize: 12.5, lineHeight: 1.6, color: "var(--cap)", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
          <span style={{ flex: "none", marginTop: 2 }}><Clock size={15} color="var(--hint)" /></span>
          <span>
            팔로우·구독 미션의 완료 여부는 직접 체크하시는 방식이며, 사실과 다른 경우 해당 응모권은 인정되지 않습니다. · 1차 사전신청 점수·응모권은 이월됩니다(1차 구매 완료자는 별도 트랙).
          </span>
        </div>
      </section>
    </div>
  );
}
