"use client";
/* 3a 마이페이지 (데스크톱) + 3b (모바일 축약) — 주문 · 기기 · 계정 · 지원 (KO/EN 토글 지원) */
import Image from "next/image";
import Link from "next/link";
import { Check, ChevR } from "@/components/icons";
import { LangToggle } from "@/components/chrome";
import { MOCK_DEVICE, MOCK_ORDER, fmt } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

function StepDot({ i, size = 22 }: { i: number; size?: number }) {
  if (i === 0)
    return (
      <span style={{ width: size, height: size, borderRadius: 99, background: "var(--w-main)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Check size={size * 0.5} color="currentColor" />
      </span>
    );
  if (i === 1)
    return (
      <span style={{ width: size, height: size, borderRadius: 99, border: "2.5px solid var(--w-main)", background: "#fff", color: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, flex: "none" }}>
        2
      </span>
    );
  return (
    <span style={{ width: size, height: size, borderRadius: 99, border: "2px solid var(--bd-card)", background: "#fff", color: "var(--dis)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, flex: "none" }}>
      {i + 1}
    </span>
  );
}

export default function MePage() {
  const { en } = useI18n();
  const order = MOCK_ORDER;
  const device = MOCK_DEVICE;
  const g = (n: number) => `#${String(n).padStart(4, "0")}`;
  const steps = en
    ? ["Payment confirmed", "Shipping intake", "Dispatch · tracking", "Delivered"]
    : ["결제 확인", "배송 접수", "발송 · 송장", "완료"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--panel)" }}>
      {/* 헤더: 지갑 칩 + 연결 해제 */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, padding: "0 36px", borderBottom: "1px solid var(--line)", background: "#fff" }} className="gnb-root">
        <Link href="/" style={{ display: "inline-flex" }}>
          <Image src="/assets/wb-black.png" alt="wellbian" width={100} height={20} style={{ height: 20, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--w-deep)", background: "var(--sec-alt)", border: "1px solid var(--bd-card)", borderRadius: 9, padding: "8px 12px" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ok-dot)" }} />
            <span className="mono">rWLB9…kQ2f</span>
          </span>
          <button className="desk-only" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--cap)", border: "1px solid var(--bd-card)", borderRadius: 9, padding: "8px 12px" }}>
            {en ? "Disconnect" : "연결 해제"}
          </button>
          <LangToggle />
        </div>
      </header>

      <main className="dash-pad">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 타이틀 행 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "My Page" : "마이페이지"}</h2>
            <span style={{ fontSize: 13, color: "var(--cap)" }}>
              {en ? "2 devices" : "보유 기기 2대"} · {en ? "Genesis" : "제네시스"} <b style={{ color: "var(--w-main)" }}>{g(device.genesisNo)}</b> · <b style={{ color: "var(--w-main)" }}>#{order.genesisNos[0]}{order.qty > 1 ? (en ? ` +${order.qty - 1}` : ` 외 ${order.qty - 1}`) : ""}</b>
            </span>
          </div>
          <Link href="/#setup" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--w-main)" }}>{en ? "Setup guide →" : "연동 가이드 보기 →"}</Link>
        </div>

        {/* 주문 카드 #1234 (배송 접수 대기) */}
        <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "Genesis" : "제네시스"} <span style={{ color: "var(--w-main)" }}>#{order.genesisNos[0]}{order.qty > 1 ? (en ? ` +${order.qty - 1} more` : ` 외 ${order.qty - 1}대`) : ""}</span></span>
              <span className="pill" style={{ fontSize: 11, color: "var(--w-main)", background: "var(--w-tint)", padding: "4px 11px" }}>{en ? "Awaiting shipping intake" : "배송 접수 대기"}</span>
            </div>
            <div className="desk-only" style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--cap)" }}>
              <span>{order.id}</span>
              <span>{order.unitPrice} RLUSD · {en ? "Early bird" : "얼리버드"}</span>
              <span>{en ? "Paid 8/26" : "결제 8/26"}</span>
              <Link href={`/orders/${order.id}`} className="mono" style={{ fontSize: 12 }}>{order.txHash} ↗</Link>
            </div>
          </div>

          {/* 가로 4스텝 — 데스크톱: 라벨 인라인 / 모바일: 라벨 하단 행 */}
          <div className="desk-only" style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {steps.map((t, i) => (
                <div key={t} style={{ display: "contents" }}>
                  {i > 0 && <span style={{ flex: 1, height: 2, background: i === 1 ? "var(--w-main)" : "var(--bd-card)" }} />}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: i <= 1 ? 800 : 400, color: i === 0 ? "var(--w-deep)" : i === 1 ? "var(--w-main)" : "var(--hint)" }}>
                    <StepDot i={i} />{t}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mob-only" style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {steps.map((_, i) => (
                <div key={i} style={{ display: "contents" }}>
                  {i > 0 && <span style={{ flex: 1, height: 2, background: i === 1 ? "var(--w-main)" : "var(--bd-card)" }} />}
                  <StepDot i={i} size={18} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--hint)", marginTop: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--w-deep)" }}>{en ? "Paid" : "결제 확인"}</span>
              <span style={{ fontWeight: 700, color: "var(--w-main)" }}>{en ? "Intake" : "배송 접수"}</span>
              <span>{en ? "Dispatch" : "발송"}</span>
              <span>{en ? "Done" : "완료"}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "16px 24px", background: "var(--panel)", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--cap)" }}>
              {en
                ? <>Proof of purchase = <b style={{ color: "var(--w-main)" }}>your Genesis Numbers + your wallet address</b> · Intake form announced on Telegram/X from 2 weeks before dispatch · Est. shipping <b style={{ color: "var(--ink-2)" }}>sequentially from November</b></>
                : <>구매 확인 = <b style={{ color: "var(--w-main)" }}>제네시스 넘버 + 내 지갑 주소</b> · 발송 2주 전부터 텔레그램·X로 접수 폼 공지 · 예상 배송 <b style={{ color: "var(--ink-2)" }}>11월 순차 발송</b></>}
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={{ fontSize: 12, fontWeight: 700, color: "var(--cap)", border: "1px solid var(--bd-btn)", borderRadius: 8, padding: "8px 14px", background: "#fff" }}>{en ? "Request refund" : "환불 신청"}</button>
              <button disabled style={{ fontSize: 12, fontWeight: 800, color: "var(--dis)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 14px", background: "#fff", cursor: "not-allowed" }}>{en ? "Register device — after delivery" : "기기 등록 — 수령 후 가능"}</button>
            </div>
          </div>
        </div>

        {/* 기기 카드 #0812 (노드 가동 중) */}
        <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "Genesis" : "제네시스"} <span style={{ color: "var(--w-main)" }}>{g(device.genesisNo)}</span></span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "var(--ok-text)", background: "var(--ok-bg)", borderRadius: 99, padding: "4px 11px" }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--ok-dot)" }} />{en ? "Node running" : "노드 가동 중"}
              </span>
            </div>
            <div className="desk-only" style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--cap)" }}>
              <span>WB-3F8D-K21P</span>
              <span>450 RLUSD · {en ? "Early bird" : "얼리버드"}</span>
              <span>{en ? "Registered 8/24" : "등록 8/24"}</span>
              <a href="#nft" className="mono" style={{ fontSize: 12 }}>{en ? "License NFT ↗" : "라이선스 NFT ↗"}</a>
            </div>
          </div>

          <div className="stat4" style={{ padding: "6px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "14px 24px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>{en ? "Uptime" : "가동 시간"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "2d 14h" : device.uptime}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "14px 24px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>{en ? "Verified data" : "검증 데이터"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--w-deep)" }}>{fmt(device.verifiedCount)}{en ? " records" : "건"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "14px 24px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>{en ? "Total rewards" : "누적 보상"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--w-main)" }}>{device.rewardWlbn} WLBN</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "14px 24px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>{en ? "Wi-Fi" : "Wi-Fi 상태"}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ok-text)" }}>{en ? "Connected" : "연결됨"}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 24px", background: "var(--panel)", fontSize: 12, color: "var(--hint)", flexWrap: "wrap" }}>
            <span>
              {en ? "Rewards are paid under network rules; amounts and value are not guaranteed" : "보상은 네트워크 원칙에 따라 지급되며 지급량·가치는 보장되지 않습니다"}
            </span>
            <span style={{ fontWeight: 700, color: "var(--w-deep)" }}>{en ? "Device details →" : "기기 상세 →"}</span>
          </div>
        </div>

        {/* 계정 + 지원 */}
        <div className="me-2col">
          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "Account" : "계정"}</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--hint)" }}>{en ? "Sign-in method" : "로그인 수단"}</span>
                <span style={{ fontWeight: 700, color: "var(--ink-2)" }}>{en ? "Google account · wallet auto-created" : "구글 계정 · 내 지갑 자동 생성"} <span className="mono" style={{ color: "var(--cap)", fontWeight: 500 }}>rWLB9…kQ2f</span></span>
              </div>
              <span className="pill" style={{ fontSize: 11, fontWeight: 800, color: "var(--ok-text)", background: "var(--ok-bg)", padding: "4px 11px" }}>{en ? "Connected" : "연결됨"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--hint)" }}>{en ? "Personal data" : "개인정보"}</span>
              <span style={{ fontWeight: 700, color: "var(--ink-2)", lineHeight: 1.55 }}>
                {en
                  ? <>Google sign-in only — shipping details are collected via the intake form and <b style={{ color: "var(--w-main)" }}>deleted after delivery</b></>
                  : <>구글 로그인 외 저장하지 않습니다 — 배송지는 접수 폼에서만 받고 <b style={{ color: "var(--w-main)" }}>배송 후 파기</b></>}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--hint)" }}>{en ? "Updates" : "소식·공지"}</span>
              <span style={{ fontWeight: 700, color: "var(--ink-2)" }}>
                {en ? "Official Telegram · X — the shipping form is announced there too" : "공식 텔레그램 · X — 배송 접수 폼도 여기로 공지"}
              </span>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--bd-card)", borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)" }}>{en ? "Support" : "지원"}</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink-2)", borderBottom: "1px solid var(--line-2)", paddingBottom: 11 }}>
              {en ? "Refund request — within 7 days of delivery · before redeem code use" : "환불 신청 — 수령 후 7일 이내 · 리딤코드 사용 전"}<ChevR size={14} color="var(--dis)" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink-2)", borderBottom: "1px solid var(--line-2)", paddingBottom: 11 }}>
              {en ? "Setup guide · FAQ" : "연동 가이드 · FAQ"}<ChevR size={14} color="var(--dis)" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>
              {en ? "Contact us" : "1:1 문의"}<ChevR size={14} color="var(--dis)" />
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
