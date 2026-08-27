"use client";
/* 1g 배송 대기 (데스크톱) + 1l (모바일 세로 타임라인) — PRD §3, §6.3 (8/27 개정:
   구매 확인 2요소 = 랜덤 배정 제네시스 넘버(구매 시 #1~5000 풀에서 수량만큼, 정렬·복사 지원)
   + 내 지갑 주소(구글 가입 시 자동 생성). 주문 ID는 내부 참조용. 배송 접수는 발송 2주 전부터
   공지되는 폼에서 제네시스 넘버·내 지갑 주소·배송 정보만 접수, 배송 후 파기 — '배송 정보' = 성함·연락처·배송지 뭉뚱 표기, 8/27) */
import { useState } from "react";
import { useParams } from "next/navigation";
import { SubHeader } from "@/components/chrome";
import { Check, XIcon, TgIcon, Book, Mail } from "@/components/icons";
import { LINKS, MOCK_ORDER } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

function StepCircleH({ i }: { i: number }) {
  if (i === 0)
    return (
      <span style={{ width: 34, height: 34, borderRadius: 99, background: "var(--w-main)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Check size={16} color="currentColor" w={3} />
      </span>
    );
  if (i === 1)
    return (
      <span style={{ width: 34, height: 34, borderRadius: 99, border: "2.5px solid var(--w-main)", background: "#fff", color: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
        2
      </span>
    );
  return (
    <span style={{ width: 34, height: 34, borderRadius: 99, border: "2px solid var(--bd-card)", background: "#fff", color: "var(--dis)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
      {i + 1}
    </span>
  );
}

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { en } = useI18n();
  const order = { ...MOCK_ORDER, id: decodeURIComponent(orderId ?? MOCK_ORDER.id) };
  const sortedNos = [...order.genesisNos].sort((a, b) => a - b);
  const g4 = (n: number) => String(n).padStart(4, "0");
  const [copied, setCopied] = useState(false);
  const copyNos = async () => {
    try {
      await navigator.clipboard.writeText(sortedNos.map((n) => `#${g4(n)}`).join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* 클립보드 미지원 시 무시 — 칩에서 수동 복사 가능 */ }
  };
  const steps = en
    ? ["Payment confirmed", "Shipping intake", "Dispatch · tracking", "Delivered"]
    : ["결제 확인", "배송 접수", "발송 · 송장", "완료"];

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <SubHeader right={<span style={{ fontSize: 12.5, color: "var(--cap)" }}>{en ? "Order" : "주문 조회"} · {order.id}</span>} />

      <main className="wl-sec-pad" style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", background: "linear-gradient(var(--panel), #fff)" }}>
        {/* 헤드: 체크 + 제네시스 배정 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
          <span style={{ width: 64, height: 64, borderRadius: 99, background: "var(--w-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={30} color="var(--w-main)" w={3} />
          </span>
          <h2 className="big-title" style={{ fontWeight: 800, color: "var(--w-deep)" }}>
            {order.qty > 1
              ? (en
                ? <>Genesis Numbers assigned — <span style={{ color: "var(--w-main)" }}>{order.qty} units</span></>
                : <>제네시스 넘버 <span style={{ color: "var(--w-main)" }}>{order.qty}개</span>가 배정되었습니다</>)
              : (en
                ? <>Genesis Number <span style={{ color: "var(--w-main)" }}>#{g4(order.genesisNos[0])}</span> has been assigned</>
                : <>제네시스 넘버 <span style={{ color: "var(--w-main)" }}>#{g4(order.genesisNos[0])}</span>가 배정되었습니다</>)}
          </h2>
          <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--ink-4)", flexWrap: "wrap", justifyContent: "center" }}>
            <span>{en ? "Order ID" : "주문 ID"} <b style={{ color: "var(--ink-2)" }}>{order.id}</b></span>
            <span>{en ? "Transaction" : "트랜잭션"} <a href="#tx" className="mono" style={{ fontSize: 12 }}>{order.txHash} ↗</a></span>
            <span>{en ? "Est. shipping" : "예상 배송"} <b style={{ color: "var(--ink-2)" }}>{en ? "sequentially from Nov 2026" : "2026년 11월 순차 발송"}</b></span>
          </div>
        </div>

        {/* 배정된 제네시스 넘버 — 오름차순 정렬 + 전체 복사 (8/27) */}
        <div className="w720" style={{ border: "1.5px solid var(--w-main)", background: "#fff", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>
              {en ? `My Genesis Numbers (${order.qty})` : `내 제네시스 넘버 (${order.qty}개)`}
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cap)", marginLeft: 8 }}>{en ? "sorted ascending" : "오름차순 정렬"}</span>
            </span>
            <button
              onClick={copyNos}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: copied ? "var(--ok-text)" : "#fff", background: copied ? "var(--ok-bg)" : "var(--w-main)", borderRadius: 9, padding: "8px 14px" }}
            >
              {copied ? (en ? "Copied!" : "복사됨!") : (en ? "Copy all" : "전체 복사")}
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sortedNos.map((n) => (
              <span key={n} className="mono" style={{ fontSize: 13.5, fontWeight: 800, color: "var(--w-deep)", background: "var(--w-tint)", borderRadius: 8, padding: "6px 10px" }}>
                #{g4(n)}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-4)" }}>
            {en
              ? "Randomly assigned at purchase — one per device. You'll enter these numbers on the shipping form, so keep a copy."
              : "구매 시 무작위로 배정된 번호입니다 — 기기마다 1개. 배송 접수 폼에 이 번호를 입력하니 복사해 보관하세요."}
          </span>
        </div>

        {/* 가로 4스텝 (데스크톱) */}
        <div className="order-steps-h" style={{ display: "grid", gridTemplateColumns: "repeat(7, auto)", alignItems: "center", gap: 10 }}>
          {steps.map((t, i) => (
            <div key={t} style={{ display: "contents" }}>
              {i > 0 && <span style={{ width: 60, height: 2, background: i === 1 ? "var(--w-main)" : "var(--bd-card)" }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 120 }}>
                <StepCircleH i={i} />
                <span style={{ fontSize: 12.5, fontWeight: i <= 1 ? 800 : 400, color: i === 0 ? "var(--w-deep)" : i === 1 ? "var(--w-main)" : "var(--hint)" }}>{t}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 세로 타임라인 (모바일, 1l) */}
        <div className="order-steps-v" style={{ display: "flex", flexDirection: "column", gap: 0, alignSelf: "stretch" }}>
          {steps.map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 12, alignItems: i === 3 ? "center" : "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {i === 0 ? (
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: "var(--w-main)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Check size={13} color="currentColor" />
                  </span>
                ) : i === 1 ? (
                  <span style={{ width: 26, height: 26, borderRadius: 99, border: "2.5px solid var(--w-main)", background: "#fff", color: "var(--w-main)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flex: "none" }}>2</span>
                ) : (
                  <span style={{ width: 26, height: 26, borderRadius: 99, border: "2px solid var(--bd-card)", background: "#fff", color: "var(--dis)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flex: "none" }}>{i + 1}</span>
                )}
                {i < 3 && <span style={{ width: 2, height: 22, background: i === 0 ? "var(--w-main)" : "var(--bd-card)" }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: i <= 1 ? 800 : 400, color: i === 0 ? "var(--w-deep)" : i === 1 ? "var(--w-main)" : "var(--hint)", marginTop: i === 3 ? 0 : 4 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* 기다리는 동안 */}
        <div className="w720" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-deep)", textAlign: "center" }}>{en ? "While you wait" : "기다리는 동안"}</div>
          <div className="rl-grid" style={{ gap: 12 }}>
            <a href={LINKS.x} target="_blank" rel="noopener" className="btn-ghost" style={{ padding: 15, fontSize: 13.5, textDecoration: "none" }}>
              <XIcon size={14} /> {en ? "Follow for updates" : "소식 팔로우"}
            </a>
            <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main" style={{ padding: 15, fontSize: 13.5, textDecoration: "none", color: "#fff" }}>
              <TgIcon size={15} /> {en ? "Join the community" : "커뮤니티 입장"}
            </a>
            <a href="/#setup" className="btn-ghost" style={{ padding: 15, fontSize: 13.5, textDecoration: "none" }}>
              <Book size={15} /> {en ? "Preview the setup guide" : "연동 가이드 미리보기"}
            </a>
          </div>
        </div>

        {/* 구매 확인 2요소(제네시스 넘버 + 내 지갑 주소) · 접수 방식 · 환불 안내 */}
        <div className="w720" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, border: "1.5px solid var(--w-main)", background: "var(--w-tint)", borderRadius: 12, padding: "15px 18px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", color: "var(--w-main)" }}>{en ? "GENESIS NUMBERS" : "제네시스 넘버"}</span>
                <span className="mono" style={{ fontSize: 16.5, fontWeight: 800, color: "var(--w-deep)" }}>
                  #{g4(sortedNos[0])}{order.qty > 1 ? (en ? ` +${order.qty - 1}` : ` 외 ${order.qty - 1}개`) : ""}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", color: "var(--w-main)" }}>{en ? "MY WALLET" : "내 지갑 주소"}</span>
                <span className="mono" style={{ fontSize: 16.5, fontWeight: 800, color: "var(--w-deep)" }}>{order.wallet}</span>
              </div>
            </div>
            <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-4)", maxWidth: 300 }}>
              {en
                ? <>These two are your <b style={{ color: "var(--w-deep)" }}>proof of purchase</b> — the wallet is created automatically with your Google account. Copy your numbers above and keep them safe.</>
                : <>이 두 가지가 <b style={{ color: "var(--w-deep)" }}>구매자 확인 수단</b>입니다 — 지갑은 구글 계정 가입 시 자동 생성됩니다. 위에서 넘버를 복사해 보관하세요.</>}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "14px 18px", fontSize: 13, lineHeight: 1.7, color: "var(--ink-4)", alignItems: "flex-start" }}>
            <span style={{ flex: "none", marginTop: 2 }}><Mail size={16} /></span>
            <span>
              {en ? (
                <>
                  <b style={{ color: "var(--ink-2)" }}>How shipping intake works.</b> Starting 2 weeks before devices ship, we announce the intake form on our official Telegram and X → enter your <b style={{ color: "var(--ink-2)" }}>Genesis Numbers · wallet address · shipping details</b>, and units ship in order. We collect only what delivery requires and <b style={{ color: "var(--ink-2)" }}>delete it after delivery</b>. Your redeem code for product registration is on the card inside the box.
                </>
              ) : (
                <>
                  <b style={{ color: "var(--ink-2)" }}>배송 접수는 이렇게 진행됩니다.</b> 디바이스 발송 2주 전부터 공식 텔레그램·X로 접수 폼을 알려드립니다 → 폼에 <b style={{ color: "var(--ink-2)" }}>제네시스 넘버 · 내 지갑 주소 · 배송 정보</b>를 입력하면 순서대로 발송합니다. 배송에 필요한 정보만 받고, <b style={{ color: "var(--ink-2)" }}>배송이 끝나면 파기</b>합니다. 정품 등록용 리딤코드는 박스 안 카드에 있습니다.
                </>
              )}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: "1px solid var(--bd-card)", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--ink-4)", flexWrap: "wrap" }}>
            <span>{en ? "Refund window — within 7 days of delivery (before the redeem code is used)" : "환불 가능 기간 — 제품 수령일부터 7일 이내 (리딤코드 사용 전)"}</span>
            <span className="pill" style={{ fontSize: 12, color: "var(--w-deep)", background: "var(--chip)", padding: "4px 12px" }}>{en ? "Countdown starts on delivery" : "수령 후 카운트다운 시작"}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
