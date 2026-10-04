"use client";
/* 사전 구매응모 온보딩 모달 (8/27 서우: 가격·수량 창 없이 "구매 온보딩 과정"만 표현)
   개념: 응모 = 추첨 대상 등록, 결제 아님. 구글 로그인 → 내 기본 지갑 자동 생성 → 응모 완료.
   8/28 서우 2차: 선착순 사전예약 → 추첨제. "자리 확보"가 아니라 추첨으로 구매 권한을 준다.
   결과 통지 = 9/14 09시(KST) 가입 메일. 완료 화면에 그 문장을 반드시 둔다.
   8/28 서우: 지갑 생성 뒤 "응모 대수 설정" 단계 추가 (1계정 최대 100대 — 현황판 표기와 동일).
   실구현 대응 지점: 구글 OAuth(POST /api/auth/google) · 지갑 생성(POST /api/wallet) · 예약 등록(POST /api/preorder { qty }) */
import { useState, useEffect } from "react";
import { LINKS, MOCK_ORDER } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { D } from "@/lib/dict";
import { TgIcon, XIcon, Check, Ticket } from "./icons";

/* 구글 사인인 버튼용 G 마크 (브랜드 가이드 표준 4색) */
const GoogleG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/* 로그인 여부는 데모용 플래그. 실구현에서는 세션/토큰으로 대체된다. */
const SIGNED_IN_KEY = "wb-signed-in";

export default function PreOrderModal({ onClose }: { onClose: () => void }) {
  const { en, t } = useI18n();
  /* 8/28 서우: 메인에서 이미 구글 로그인이 되어 있으면 로그인·지갑 단계를 건너뛰고
     '예약 대수'(step 2)로 바로 진입한다. 지갑은 가입 시 자동 생성되므로 두 단계가 함께 끝나 있다.
     SSR/CSR 하이드레이션이 어긋나지 않도록 초기값은 0으로 두고 마운트 후에 옮긴다. */
  const [step, setStep] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [enteredSignedIn, setEnteredSignedIn] = useState(false);
  useEffect(() => {
    let already = false;
    try { already = !!localStorage.getItem(SIGNED_IN_KEY); } catch { /* 사파리 프라이빗 등 */ }
    if (already) { setSignedIn(true); setEnteredSignedIn(true); setStep(2); }
  }, []);

  const [connecting, setConnecting] = useState(false);
  const [qty, setQty] = useState(1);

  /* 4단계로 늘며 인디케이터가 2줄로 넘쳐 라벨 축약 (8/28) */
  const stepNames = t(D.stepNames);

  /* 데모: 구글 OAuth 왕복을 0.9s 목동작으로 표현 */
  const googleSignIn = () => {
    if (connecting) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setSignedIn(true);
      try { localStorage.setItem(SIGNED_IN_KEY, "1"); } catch { /* 저장 실패해도 이번 세션은 진행된다 */ }
      setStep(1);
    }, 900);
  };

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={t(D.preorderLabel)}>
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="mstep-ind">
            {stepNames.map((name, i) => (
              <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <span className={`mstep-line${i <= step ? " done" : ""}`} />}
                <span className={`mstep-dot ${i < step ? "done" : i === step ? "cur" : "todo"}`} aria-current={i === step ? "step" : undefined}>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={`mstep-label${i === step ? " cur" : ""}`}>{name}</span>
              </span>
            ))}
          </div>
          <button onClick={onClose} aria-label={t(D.close)} style={{ color: "var(--dis)", fontSize: 23.5, lineHeight: 1 }}>✕</button>
        </div>

        <div key={step} className="step-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {step === 0 && (
            <>
              <h3 style={h3}>{t(D.signInTitle)}</h3>
              <p style={pStyle}>
                {en
                  ? "Entering takes only a Google sign-in. It is not a payment — a draw decides who can buy on opening day."
                  : "사전 구매응모는 구글 로그인만으로 진행됩니다. 결제가 아니며, 추첨으로 오픈 당일 구매 권한이 정해집니다."}
              </p>
              <button
                onClick={googleSignIn}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  border: "1px solid var(--bd-input)", borderRadius: 12, padding: "15px 20px",
                  background: "#fff", fontSize: 18.5, fontWeight: 700, color: "var(--ink-1)", cursor: "pointer",
                }}
              >
                <GoogleG size={21} />
                {connecting ? t(D.connecting) : t(D.continueGoogle)}
              </button>
              <div style={capStyle}>
                {en
                  ? "Your basic wallet (address) is created automatically the moment you sign up."
                  : "가입과 동시에 나의 기본 지갑(주소)이 자동으로 만들어집니다."}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 style={h3}>{t(D.walletReady)}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid var(--bd-card)", borderRadius: 14, padding: "18px 20px", background: "var(--panel)" }}>
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: ".12em", color: "var(--cap)" }}>MY WALLET</span>
                <span className="mono" style={{ fontSize: 21, fontWeight: 800, color: "var(--w-deep)" }}>{MOCK_ORDER.wallet}</span>
              </div>
              <p style={pStyle}>
                {en
                  ? "A non-custodial wallet linked to your Google account. It will be used to confirm your purchase and receive rewards."
                  : "구글 계정에 연결된 비수탁 간편지갑입니다. 구매 확인과 보상 수령에 사용됩니다."}
              </p>
              <button onClick={() => setStep(2)} className="btn-main" style={{ fontSize: 19.5, borderRadius: 10, padding: 14 }}>
                {t(D.nextQuantity)}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={h3}>{t(D.qtyTitle)}</h3>
              <p style={pStyle}>
                {t(D.notCommitment)} {t(D.perAccountCap)}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label={t(D.decrease)} style={{ ...stepBtn, opacity: qty <= 1 ? 0.35 : 1 }}>−</button>
                <div style={{ minWidth: 120, textAlign: "center" }}>
                  <span className="mono" style={{ fontSize: 42, fontWeight: 800, color: "var(--w-deep)" }}>{qty}</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "var(--ink-3)", marginLeft: 5 }}>{t(D.unitSuffix)(qty)}</span>
                </div>
                <button onClick={() => setQty(Math.min(100, qty + 1))} disabled={qty >= 100} aria-label={t(D.increase)} style={{ ...stepBtn, opacity: qty >= 100 ? 0.35 : 1 }}>+</button>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                {[1, 5, 10, 50, 100].map((n) => (
                  <button key={n} onClick={() => setQty(n)} style={{ border: `1px solid ${qty === n ? "var(--w-main)" : "var(--bd-input)"}`, color: qty === n ? "var(--w-main)" : "var(--cap)", background: qty === n ? "var(--w-tint)" : "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 15.5, fontWeight: 700 }}>{n}</button>
                ))}
              </div>
              {/* 8/28 서우: 정식 판매 오픈 후 구매 시 XRP SEOUL 2026 티켓 증정 */}
              <div style={perkStyle}>
                <span aria-hidden style={{ display: "inline-flex", flex: "none" }}><Ticket /></span>
                <span>
                  {en
                    ? <>After sales open, buy and get one free &#39;<b>XRP SEOUL 2026</b>&#39; ticket per device <span style={{ color: "var(--cap)", fontWeight: 600 }}>(₩100,000 value)</span></>
                    : <>정식 판매 오픈 후, 구매 시 &#39;<b>XRP SEOUL 2026</b>&#39; 티켓 1대당, 1장 무료 증정 <span style={{ color: "var(--cap)", fontWeight: 600 }}>(10만원 상당)</span></>}
                </span>
              </div>
              <button onClick={() => setStep(3)} className="btn-main" style={{ fontSize: 19.5, borderRadius: 10, padding: 14 }}>
                {t(D.reserveCta)(qty)}
              </button>
              {/* 8/29 서우: 추첨 결과를 메일로 보낸다는 고지는 뺀다(통지 수단 미확정).
                  위 리드가 "결제 아님 · 추첨 · 1계정 100대"를 이미 말하므로 이 자리는 비운다. */}
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 99, background: "var(--w-main)", flex: "none" }}>
                  <Check size={20} w={3} />
                </span>
                <h3 style={h3}>{t(D.preorderDone)}</h3>
              </div>
              <p style={pStyle}>
                {en
                  ? `Your entry for ${qty} unit${qty > 1 ? "s" : ""} is in. An entry is not a payment — a draw grants the right to buy from the limited quantity on opening day.`
                  : `${qty}대 응모가 접수되었습니다. 사전 구매응모는 결제가 아니며, 추첨을 통해 오픈 당일 한정수량을 구매할 수 있는 권한을 드립니다.`}
              </p>
              {/* 8/29 서우: 결과 통지 고지 제거. 결과를 어디서 듣는지는 아래 커뮤니티·X 버튼이 대신한다 */}
                <div style={perkStyle}>
                  <span aria-hidden style={{ display: "inline-flex", flex: "none" }}><Ticket /></span>
                  <span>
                    {en
                      ? <>After sales open, buy and get one free &#39;<b>XRP SEOUL 2026</b>&#39; ticket per device <span style={{ color: "var(--cap)", fontWeight: 600 }}>(₩100,000 value)</span></>
                      : <>정식 판매 오픈 후, 구매 시 &#39;<b>XRP SEOUL 2026</b>&#39; 티켓 1대당, 1장 무료 증정 <span style={{ color: "var(--cap)", fontWeight: 600 }}>(10만원 상당)</span></>}
                  </span>
                </div>
              <a href={LINKS.telegram} target="_blank" rel="noopener" className="btn-main btn-shine" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 19.5, borderRadius: 10, padding: 14, color: "#fff", textDecoration: "none" }}>
                <TgIcon size={16} /> {t(D.communityTg)}
              </a>
              <a href={LINKS.x} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid var(--bd-input)", borderRadius: 10, padding: 13, fontSize: 18, fontWeight: 700, color: "var(--w-deep)", textDecoration: "none" }}>
                <XIcon size={14} /> {t(D.updatesX)}
              </a>
              <button onClick={onClose} style={{ fontSize: 16, color: "var(--cap)", alignSelf: "center" }}>
                {t(D.close)}
              </button>
            </>
          )}
        </div>

        {/* 이미 로그인된 상태로 대수 단계에 바로 들어온 경우엔 되돌아갈 단계가 없다 */}
        {(step === 1 || (step === 2 && !enteredSignedIn)) && (
          <button onClick={() => setStep(step - 1)} style={{ fontSize: 16, color: "var(--cap)", alignSelf: "flex-start" }}>
            {t(D.back)}
          </button>
        )}
      </div>
    </div>
  );
}

const h3: React.CSSProperties = { fontSize: 28.5, fontWeight: 800, color: "var(--w-deep)" };
/* 혜택 스트립 — 본문과 구분되게 옅은 브랜드 틴트 */
const perkStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, textAlign: "left",
  background: "var(--w-tint)", border: "1px solid rgba(27,27,72,.08)",
  borderRadius: 11, padding: "12px 14px", fontSize: 15.5, fontWeight: 700,
  color: "var(--w-deep)", lineHeight: 1.5,
};

const stepBtn: React.CSSProperties = { width: 46, height: 46, borderRadius: 99, border: "1px solid var(--bd-input)", background: "#fff", fontSize: 25, fontWeight: 700, color: "var(--w-deep)", lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" };
const pStyle: React.CSSProperties = { fontSize: 17.5, lineHeight: 1.7, color: "var(--ink-3)" };
const capStyle: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.6, color: "var(--cap)" };
