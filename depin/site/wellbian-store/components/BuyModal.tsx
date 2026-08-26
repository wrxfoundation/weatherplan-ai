"use client";
/* 구매 모달 4스텝 (PRD §6.2 개정 8/26) — 상태 머신:
   qty → wallet → terms → pay(hold 20m) → signing → confirmed | expired | mismatch
   confirmed 시 /orders/[id] 이동. 홀드 만료 시 qty 복귀(재고 반환). mismatch는 안내 후 재서명.
   개인정보(주소·연락처·이메일)는 사이트에서 받지 않음 — 배송 접수는 발송 전 공지되는
   별도 접수 폼(구글폼)에서 배송 접수 코드+배송지만 받고 배송 후 파기.
   전부 mock — mismatch 분기는 ?demo=mismatch로 재현(첫 서명만 불일치). */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRICE, RECEIVE_ADDRESS, DEST_TAG, fmt } from "@/lib/data";
import { WALLETS, WalletAdapter } from "@/lib/wallet";
import { Check, ChevR, Clock, Warn } from "./icons";

const STEP_NAMES = ["수량", "지갑", "약관", "결제"] as const;
const HOLD_SECONDS = 20 * 60;

export default function BuyModal({
  ebLeft, onClose, demoMismatch = false,
}: { ebLeft: number; onClose: () => void; demoMismatch?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0..3
  const [qty, setQty] = useState(1);
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [terms1, setTerms1] = useState(false);
  const [terms2, setTerms2] = useState(false);
  const [hold, setHold] = useState(HOLD_SECONDS);
  const [signing, setSigning] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const mismatchOnce = useRef(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tier = ebLeft > 0 ? "eb" : "gen";
  const unit = tier === "eb" ? PRICE.eb : PRICE.gen;
  const total = unit * qty;

  /* 홀드 타이머: 결제 단계 진입 시 시작 (POST /api/checkout/hold 대응 지점) */
  useEffect(() => {
    if (step === 3) {
      setHold(HOLD_SECONDS);
      holdRef.current = setInterval(() => setHold((s) => s - 1), 1000);
      return () => { if (holdRef.current) clearInterval(holdRef.current); };
    }
  }, [step]);

  /* 홀드 만료 → 수량 단계 복귀 + 재고 반환 (PRD 상태 머신) */
  useEffect(() => {
    if (step === 3 && hold <= 0 && !signing) {
      alert("재고 홀드가 만료되었습니다. 수량 선택부터 다시 진행해 주세요.");
      setStep(0);
    }
  }, [hold, step, signing]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; removeEventListener("keydown", esc); };
  }, [onClose]);

  const connect = useCallback(async (w: WalletAdapter) => {
    setWallet(w); setConnecting(true);
    const { address } = await w.connect();
    setAddress(address); setConnecting(false);
  }, []);

  const sign = useCallback(async () => {
    if (!wallet) return;
    setSigning(true);
    await wallet.sign({ amount: total, to: RECEIVE_ADDRESS, tag: DEST_TAG });
    /* mismatch 분기: 서명 내용이 주문과 불일치 → 안내 후 재서명 (목 재현: ?demo=mismatch 첫 시도) */
    if (demoMismatch && !mismatchOnce.current) {
      mismatchOnce.current = true;
      setSigning(false);
      setMismatch(true);
      return;
    }
    /* POST /api/checkout/confirm 대응 지점 — mock 주문 생성 */
    router.push("/orders/WB-260826-01234");
  }, [wallet, total, router, demoMismatch]);

  /* 결제 단계 이탈 시 mismatch 안내 해제 */
  useEffect(() => { if (step !== 3) setMismatch(false); }, [step]);

  const holdMMSS = `${String(Math.max(0, Math.floor(hold / 60))).padStart(2, "0")}:${String(Math.max(0, hold % 60)).padStart(2, "0")}`;

  const stepBody = useMemo(() => {
    switch (step) {
      /* ── ① 수량 (1b) ── */
      case 0: return (
        <>
          <h3 style={h3}>수량을 선택하세요</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--bd-card)", borderRadius: 14, padding: "18px 20px", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--w-deep)" }}>
                Weather Data Token Generator™ · {tier === "eb" ? "얼리버드" : "일반"}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--cap)" }}>{unit} RLUSD / 대{tier === "eb" ? ` · 잔여 ${fmt(ebLeft)}대` : ""}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button aria-label="수량 감소" onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ ...qtyBtn, borderColor: "var(--bd-input)", color: "var(--hint)" }}>−</button>
              <input
                value={qty}
                onChange={(e) => { const v = parseInt(e.target.value.replace(/\D/g, "") || "1", 10); setQty(Math.max(1, Math.min(9999, v))); }}
                inputMode="numeric" aria-label="수량"
                style={{ width: 76, height: 38, border: "1.5px solid var(--w-main)", borderRadius: 10, textAlign: "center", fontSize: 17, fontWeight: 800, color: "var(--w-deep)", background: "#fff", boxShadow: "0 0 0 3px var(--w-tint)", outline: "none" }}
              />
              <button aria-label="수량 증가" onClick={() => setQty((q) => Math.min(9999, q + 1))}
                style={{ ...qtyBtn, borderColor: "var(--w-main)", color: "var(--w-main)" }}>+</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--sec-alt)", borderRadius: 12, padding: "14px 20px" }}>
            <span style={{ fontSize: 13.5, color: "var(--ink-4)" }}>합계 · {fmt(qty)}대</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--w-deep)" }}>{fmt(total)} RLUSD</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, lineHeight: 1.6, color: "var(--cap)" }}>
            <span>· − / + 버튼 또는 <b style={{ color: "var(--ink-2)" }}>숫자를 직접 입력</b>하세요 — 대량 구매 가능</span>
            <span>· 한정 수량 — <b style={{ color: "var(--ink-2)" }}>결제 확정 순</b>으로 제네시스 넘버가 배정됩니다</span>
            <span>· 지갑당 구매 수량 제한: 현재 없음 (정책 확정 시 변경될 수 있음)</span>
          </div>
          <button className="btn-main" style={cta} onClick={() => setStep(1)}>다음 — 지갑 연결</button>
        </>
      );
      /* ── ② 지갑 (1c) ── */
      case 1: return (
        <>
          <h3 style={h3}>지갑을 연결하세요</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {WALLETS.map((w) => {
              const sel = wallet?.id === w.id;
              return (
                <button key={w.id} onClick={() => setWallet(w)} style={{
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                  border: sel ? "2px solid var(--w-main)" : "1px solid var(--bd-card)",
                  background: sel ? "var(--w-tint)" : "#fff",
                  borderRadius: 14, padding: sel ? "15px 17px" : "16px 18px",
                }}>
                  <span style={{ width: 40, height: 40, borderRadius: 11, background: sel ? "var(--w-deep)" : "var(--chip)", color: sel ? "#fff" : "var(--ink-4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flex: "none" }}>
                    {w.name[0]}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--w-deep)" }}>{w.name}</span>
                    <span style={{ fontSize: 12, color: sel ? "var(--ink-4)" : "var(--cap)" }}>{w.desc}</span>
                  </span>
                  {w.detected
                    ? <span className="pill" style={{ fontSize: 11, color: "var(--w-main)", background: "#fff", border: "1px solid var(--w-main)", padding: "4px 10px" }}>감지됨</span>
                    : <ChevR size={16} color="var(--dis)" />}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, flexWrap: "wrap", gap: 6 }}>
            <a href="#" onClick={(e) => e.preventDefault()}>지갑이 없나요? 지갑 만들기 안내 →</a>
            <span style={{ color: "var(--cap)" }}>활성화(1 XRP) 1회 지원</span>
          </div>
          {address && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ok-text)" }}>
              <Check size={13} color="var(--ok-text)" /> {wallet?.name} 연결됨 — <span className="mono">{address}</span>
            </div>
          )}
          <button className="btn-main" style={cta} disabled={!wallet || connecting}
            onClick={async () => { if (!wallet) return; if (!address) await connect(wallet); setStep(2); }}>
            {connecting ? "연결 중…" : wallet ? `${wallet.name}로 연결하기` : "지갑을 선택하세요"}
          </button>
        </>
      );
      /* ── ③ 약관 + 배송 접수 안내 (1d) ── */
      case 2: return (
        <>
          <h3 style={h3}>약관에 동의해 주세요</h3>
          <div style={{ display: "flex", gap: 12, border: "1px solid color-mix(in oklab, var(--w-main) 30%, white)", background: "var(--w-tint)", borderRadius: 12, padding: "15px 18px", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
            <span style={{ flex: "none", marginTop: 2 }}><Clock /></span>
            <span>
              <b style={{ color: "var(--w-deep)" }}>이 사이트는 주소·연락처를 받지 않습니다.</b><br />
              발송 전에 공식 텔레그램·X로 배송 접수 폼을 알려드립니다. 폼에 <b style={{ color: "var(--w-deep)" }}>배송 접수 코드</b>(결제 후 발급)와 배송지만 입력하면 되고, 배송이 끝나면 정보는 바로 파기됩니다.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TermCard checked={terms1} onToggle={() => setTerms1(!terms1)}
              title="[필수] 환불 제한 사유 고지"
              desc="리딤코드 사용 또는 노드 연동 시 환불이 제한됩니다 (전자상거래법 제17조 제6항)" />
            <TermCard checked={terms2} onToggle={() => setTerms2(!terms2)}
              title="[필수] 이용약관 · 배송 접수 방식 확인"
              desc="배송 정보는 이 사이트가 아닌 별도 접수 폼에서 받는다는 안내를 확인했습니다" />
          </div>
          <div style={{ fontSize: 12, color: "var(--cap)" }}>환불: 제품 수령일부터 7일 이내 가능 (리딤코드 사용 전)</div>
          <button className="btn-main" style={cta} disabled={!(terms1 && terms2)} onClick={() => setStep(3)}>동의하고 결제하기</button>
        </>
      );
      /* ── ④ 결제 (1f) ── */
      case 3: return (
        <>
          <h3 style={h3}>RLUSD로 결제하세요</h3>
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--bd-card)", borderRadius: 14, overflow: "hidden" }}>
            <PayRow k="주문" v={<b style={{ color: "var(--w-deep)" }}>Weather Data Token Generator™ × {fmt(qty)} · {tier === "eb" ? "얼리버드" : "일반"}</b>} />
            <PayRow k="결제 금액" v={<b style={{ fontSize: 16, color: "var(--w-deep)" }}>{fmt(total)} RLUSD</b>} />
            <PayRow k="받는 주소" v={<span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{RECEIVE_ADDRESS} <span style={{ color: "var(--hint)" }}>(자동 입력)</span></span>} />
            <PayRow k="목적지 태그" v={<span className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{DEST_TAG} <span style={{ color: "var(--hint)" }}>(자동 입력)</span></span>} />
            <PayRow k="트러스트라인" last v={<span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--ok-text)" }}><Check size={14} color="var(--ok-text)" w={3} />점검 완료</span>} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--sec-alt)", borderRadius: 12, padding: "12px 18px" }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>재고 홀드 — 남은 시간</span>
            <span className="mono" aria-live="polite" style={{ fontSize: 15, fontWeight: 800, color: hold < 180 ? "#c0392b" : "var(--w-deep)" }}>{holdMMSS}</span>
          </div>
          {mismatch && (
            <div role="alert" style={{ display: "flex", gap: 10, border: "1px solid var(--warn-bd)", background: "var(--warn-bg)", borderRadius: 12, padding: "13px 16px", fontSize: 12.5, lineHeight: 1.6, color: "var(--warn-text)" }}>
              <span style={{ flex: "none", marginTop: 2 }}><Warn size={15} /></span>
              <span><b>서명 내용이 주문과 일치하지 않습니다.</b> 지갑에 표시된 금액·받는 주소·목적지 태그를 위 표와 대조한 뒤 다시 서명해 주세요. 결제는 진행되지 않았습니다.</span>
            </div>
          )}
          <button className="btn-main" style={cta} disabled={signing} onClick={sign}>
            {signing ? "서명 확인 중…" : mismatch ? "다시 서명하기" : "지갑에서 서명하기"}
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, color: "var(--cap)" }}>
            <span className="pulse" style={{ width: 8, height: 8, borderRadius: 99, background: mismatch ? "var(--warn-icon)" : "var(--w-main)" }} />
            서명 대기 중… 금액·주소가 일치하지 않으면 자동으로 안내합니다
          </div>
        </>
      );
    }
  }, [step, qty, tier, unit, total, ebLeft, wallet, connecting, address, terms1, terms2, hold, holdMMSS, signing, mismatch, connect, sign]);

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="구매하기">
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="mstep-ind">
            {STEP_NAMES.map((name, i) => (
              <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <span className={`mstep-line${i <= step ? " done" : ""}`} />}
                <span className={`mstep-dot ${i < step ? "done" : i === step ? "cur" : "todo"}`} aria-current={i === step ? "step" : undefined}>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={`mstep-label${i === step ? " cur" : ""}`}>{name}</span>
              </span>
            ))}
          </div>
          <button onClick={onClose} aria-label="닫기" style={{ color: "var(--dis)", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        {/* 스텝 전환 크로스페이드 150ms (PRD §8) — key로 재마운트 */}
        <div key={step} className="step-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {stepBody}
        </div>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ fontSize: 12.5, color: "var(--cap)", alignSelf: "flex-start" }}>← 이전 단계</button>
        )}
      </div>
    </div>
  );
}

function TermCard({ checked, onToggle, title, desc }: { checked: boolean; onToggle: () => void; title: string; desc: string }) {
  return (
    <button onClick={onToggle} style={{ display: "flex", gap: 12, border: checked ? "1px solid var(--w-main)" : "1px solid var(--bd-card)", background: checked ? "var(--panel)" : "#fff", borderRadius: 14, padding: "16px 18px", alignItems: "flex-start", textAlign: "left" }}>
      <span style={{ width: 22, height: 22, borderRadius: 7, background: checked ? "var(--w-main)" : "#fff", border: checked ? "none" : "1.5px solid var(--bd-input)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>
        {checked && <Check size={13} />}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-deep)" }}>{title}</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-4)" }}>{desc}</span>
      </span>
      <a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} style={{ fontSize: 12, whiteSpace: "nowrap" }}>보기</a>
    </button>
  );
}

function PayRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 18px", fontSize: 13.5, borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <span style={{ color: "var(--ink-4)", flex: "none" }}>{k}</span>
      <span style={{ textAlign: "right" }}>{v}</span>
    </div>
  );
}

const h3: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: "var(--w-deep)" };
const cta: React.CSSProperties = { fontSize: 15.5, padding: 16, width: "100%" };
const qtyBtn: React.CSSProperties = { width: 44, height: 44, border: "1px solid", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: "#fff" };
