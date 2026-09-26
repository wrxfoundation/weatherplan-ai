// 결제 결과 — 토스 결제창에서 돌아오는 착지 화면 (successUrl · failUrl 공용).
//
// 성공: ?paymentType&orderId&paymentKey&amount  → 서버 승인 API 호출 → 완료
// 실패: ?code&message&orderId                    → 사유 표시
// 자동결제 등록 성공: ?customerKey&authKey        → 빌링키 발급 API 호출
//
// 승인 API 가 성공해야 결제가 끝난다. 이 화면에 도달한 것만으로 완료 처리하지 않는다.
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge } from "../../components/ui";
import Icon from "../../components/icons";
import { useAppState } from "../../lib/state";
import { fmtWon } from "../../lib/config";
import { PAY_KINDS, fmtCard } from "../../lib/payments";

export default function PayResult() {
  const router = useRouter();
  const { dispatch } = useAppState();
  const { kind = "store", ref: refId = "", sig = "", paymentKey, orderId, amount, code, message, authKey, customerKey } = router.query;
  const meta = PAY_KINDS[kind] || PAY_KINDS.store;

  const [phase, setPhase] = useState("working"); // working | done | failed
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const ran = useRef(false);

  const run = useCallback(async () => {
    if (!router.isReady || ran.current) return;
    ran.current = true;

    // 결제창이 사유와 함께 돌려보낸 경우 (사용자 취소 포함)
    if (code) {
      setPhase("failed");
      setErr({ code, message: message || "결제가 완료되지 않았습니다." });
      return;
    }

    try {
      // ── 자동결제 카드 등록 ──
      if (authKey) {
        const res = await fetch("/api/payments/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerKey, authKey }),
        });
        const data = await res.json();
        if (!res.ok) throw Object.assign(new Error(data.message), { code: data.error });
        setResult({ billing: data.billing });
        setPhase("done");
        dispatch({ type: "setBilling", payload: { ...data.billing, at: Date.now() } });
        dispatch({
          type: "pushEvent",
          payload: { kind: "결제", text: `월 구독 자동결제 카드 등록 — ${fmtCard(data.billing)}`, color: "#8FE3C0" },
        });
        return;
      }

      // ── 일반 결제 승인 ──
      if (!paymentKey || !orderId) {
        setPhase("failed");
        setErr({ code: "INVALID_RETURN", message: "결제 정보가 올바르지 않습니다." });
        return;
      }
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), sig }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message), { code: data.error });

      setResult({ payment: data.payment });
      setPhase("done");
      dispatch({
        type: "addPayment",
        payload: { kind, ref: refId || null, status: "done", ...data.payment },
      });
      dispatch({
        type: "pushEvent",
        payload: { kind: "결제", text: `${meta.label} ${fmtWon(data.payment.amount)} 결제 완료 — ${data.payment.method || "카드"}`, color: "#8FE3C0" },
      });
      // 결제가 끝나야 다음 단계가 선다 — 해주세요는 진행으로, 스토어는 주문·배송 요청으로.
      if (kind === "request" && refId) {
        dispatch({ type: "transitionRequest", id: refId, to: "inProgress", note: `보호자 결제 완료 ${fmtWon(data.payment.amount)}` });
      }
      if (kind === "store") {
        dispatch({ type: "commitPendingOrder", payload: data.payment });
      }
    } catch (e) {
      setPhase("failed");
      setErr({ code: e.code || "CONFIRM_FAILED", message: e.message || "결제 승인에 실패했습니다." });
    }
  }, [router.isReady, code, message, authKey, customerKey, paymentKey, orderId, amount, sig, kind, refId, meta.label, dispatch]);

  useEffect(() => {
    run();
  }, [run]);

  const p = result?.payment;
  const b = result?.billing;

  return (
    <>
      <Head>
        <title>결제 결과 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper px-4 pb-10 pt-8">
          {/* 상태 머리 */}
          <div className="text-center">
            <span
              aria-hidden
              className="inline-flex h-[62px] w-[62px] items-center justify-center rounded-full"
              style={{
                background: phase === "done" ? "rgba(30,122,90,.12)" : phase === "failed" ? "rgba(138,93,18,.14)" : "rgba(10,31,60,.06)",
                color: phase === "done" ? "#1E7A5A" : phase === "failed" ? "#8A5D12" : "#5C5A54",
              }}
            >
              <Icon name={phase === "done" ? "check" : phase === "failed" ? "alert" : "clock"} size={28} strokeWidth={2.2} />
            </span>
            <h1 className="mt-3 text-[24px] font-black leading-[1.4] text-navy">
              {phase === "working" && "결제를 확인하고 있습니다"}
              {phase === "done" && (b ? "카드가 등록되었습니다" : "결제가 완료되었습니다")}
              {phase === "failed" && "결제가 완료되지 않았습니다"}
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-[1.7] text-muted">
              {phase === "working" && "승인 요청 중입니다 — 창을 닫지 말아 주세요."}
              {phase === "done" && !b && "영수증은 아래에서 확인하실 수 있습니다."}
              {phase === "done" && b && "다음 결제일부터 이 카드로 자동 청구됩니다."}
              {phase === "failed" && "금액은 청구되지 않았습니다. 다시 시도하시거나 다른 결제수단을 선택해 주세요."}
            </p>
          </div>

          {/* 완료 — 일반 결제 */}
          {phase === "done" && p && (
            <Card className="mt-6 p-[18px]">
              <div className="flex items-center justify-between">
                <SectionLabel>결제 내역</SectionLabel>
                <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">승인 완료</Badge>
              </div>
              <div className="mt-3 space-y-2 text-[14px]">
                {[
                  ["결제 항목", p.orderName],
                  ["결제 금액", fmtWon(p.amount)],
                  ["결제 수단", p.easyPay || p.method || "카드"],
                  ...(p.card ? [["카드", fmtCard(p.card)]] : []),
                  ["주문번호", p.orderId],
                  ["승인 시각", p.approvedAt ? new Date(p.approvedAt).toLocaleString("ko-KR") : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-navy/[.07] pb-2 last:border-b-0">
                    <span className="text-muted">{k}</span>
                    <span className="break-all text-right font-bold text-ink">{v}</span>
                  </div>
                ))}
              </div>
              {p.receiptUrl && (
                <a
                  href={p.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tap mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy"
                >
                  <Icon name="doc" size={16} /> 영수증 보기
                </a>
              )}
            </Card>
          )}

          {/* 완료 — 자동결제 등록 */}
          {phase === "done" && b && (
            <Card className="mt-6 p-[18px]">
              <SectionLabel>등록된 결제수단</SectionLabel>
              <div className="mt-3 flex items-center gap-3">
                <span aria-hidden className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-navy/[.06] text-navy">
                  <Icon name="card" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-navy">{fmtCard(b)}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{b.method || "카드"} · 자동결제</div>
                </div>
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11.5px] leading-[1.7] text-muted">
                카드정보는 토스페이먼츠가 보관하며 K-CARE 서버에는 저장되지 않습니다. 등록 해지는
                마이 탭 결제 관리에서 하실 수 있습니다.
              </p>
            </Card>
          )}

          {/* 실패 */}
          {phase === "failed" && (
            <Card className="mt-6 border border-amber/30 p-[18px]" style={{ background: "#FFF7E8" }}>
              <div className="text-[14px] font-bold text-amber">진행되지 않은 이유</div>
              <p className="mt-1.5 text-[13px] leading-[1.7] text-[#5A4A22]">{err?.message}</p>
              <p className="mt-2 font-num text-[11px] text-[#5A4A22]">{err?.code}</p>
            </Card>
          )}

          <div className="mt-auto space-y-2 pt-8">
            {phase === "failed" && (
              <PrimaryButton onClick={() => router.back()}>다시 시도하기</PrimaryButton>
            )}
            {phase === "done" && (
              <PrimaryButton onClick={() => router.replace(meta.back)}>확인</PrimaryButton>
            )}
            <Link href="/family" className="block">
              <GhostButton>가족 앱 홈으로</GhostButton>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
