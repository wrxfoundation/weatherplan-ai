// 결제 화면 — 토스페이먼츠 결제위젯(주문서형) · 자동결제 카드 등록.
//
// /pay?kind=store&amount=26000&orderName=영국산%20비타민C&ref=rq-1
// /pay?kind=billing                        (월 구독 카드 등록)
//
// 흐름: 서버에서 주문번호·금액 서명을 받는다 → 위젯을 그린다 → 결제 요청(리다이렉트)
//      → /pay/result 로 돌아와 승인 API 를 부른다. 승인 전에는 청구되지 않는다.
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Card, SectionLabel, PrimaryButton, Badge } from "../components/ui";
import Icon from "../components/icons";
import { useAppState } from "../lib/state";
import { fmtWon, PRICING, HOUSEHOLD } from "../lib/config";
import {
  PAY_KINDS,
  PAY_NOTICE,
  TOSS_CLIENT_KEY,
  customerKey,
  hasClientKey,
  isTestKey,
} from "../lib/payments";

// 자동결제는 금액이 없다 — 카드만 등록하고 청구는 매월 서버가 한다
const isBilling = (kind) => kind === "billing";

export default function PayPage() {
  const router = useRouter();
  const { state } = useAppState();
  const { kind = "store", amount, orderName = "K-CARE 결제", ref: refId = "" } = router.query;
  const value = Number(amount) || 0;
  const meta = PAY_KINDS[kind] || PAY_KINDS.store;

  const [phase, setPhase] = useState("loading"); // loading | ready | requesting | error
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null); // { orderId, amount, sig }
  const widgetsRef = useRef(null);
  const paymentRef = useRef(null);
  const mounted = useRef(false);

  const ob = state.onboarding;
  const buyerName = ob?.elderName ? "김민수" : "김민수"; // 결제자는 보호자 — 데모 고정값
  const monthly = ob?.household === "couple" ? HOUSEHOLD.monthly : PRICING.subscription.monthly;

  // ── 위젯 준비 ──
  const setup = useCallback(async () => {
    if (!router.isReady || mounted.current) return;
    if (!hasClientKey()) {
      setPhase("error");
      setError({ code: "CLIENT_KEY_MISSING", message: "결제 키가 설정되지 않았습니다." });
      return;
    }
    mounted.current = true;
    try {
      const toss = await loadTossPayments(TOSS_CLIENT_KEY);
      if (isBilling(kind)) {
        // 자동결제 — 위젯이 아니라 결제창을 바로 띄운다 (카드 등록)
        paymentRef.current = toss.payment({ customerKey: customerKey() });
        setPhase("ready");
        return;
      }
      // 일반 결제 — 주문번호·금액 서명을 서버에서 받는다
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, amount: value }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message || "주문을 만들지 못했습니다."), { code: data.error });
      setOrder(data);

      const widgets = toss.widgets({ customerKey: ANONYMOUS });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: data.amount });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#toss-payment-methods" }),
        widgets.renderAgreement({ selector: "#toss-agreement" }),
      ]);
      setPhase("ready");
    } catch (e) {
      setPhase("error");
      setError({ code: e.code || e.name || "LOAD_FAILED", message: e.message || "결제창을 불러오지 못했습니다." });
    }
  }, [router.isReady, kind, value]);

  useEffect(() => {
    setup();
  }, [setup]);

  // ── 결제 요청 ──
  const pay = async () => {
    setPhase("requesting");
    const origin = window.location.origin;
    try {
      if (isBilling(kind)) {
        await paymentRef.current.requestBillingAuth({
          method: "CARD",
          successUrl: `${origin}/pay/result?kind=billing`,
          failUrl: `${origin}/pay/result?kind=billing`,
          customerName: buyerName,
        });
        return;
      }
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: String(orderName),
        successUrl: `${origin}/pay/result?kind=${kind}&sig=${order.sig}${refId ? `&ref=${refId}` : ""}`,
        failUrl: `${origin}/pay/result?kind=${kind}${refId ? `&ref=${refId}` : ""}`,
        customerName: buyerName,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 것도 여기로 온다 — 실패가 아니라 되돌아온 것
      setPhase("ready");
      if (e?.code && e.code !== "USER_CANCEL") setError({ code: e.code, message: e.message });
    }
  };

  const testMode = isTestKey();

  return (
    <>
      <Head>
        <title>결제 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Link href={meta.back} className="tap -ml-1 shrink-0 rounded-lg px-2 py-1 text-[18px] font-bold text-muted">
                ‹
              </Link>
              <h1 className="min-w-0 flex-1 text-[19px] font-black text-navy">{meta.label}</h1>
              {testMode && <Badge fg="#8A5D12" bg="rgba(138,93,18,.14)">테스트 모드</Badge>}
            </div>
          </header>

          <main className="flex-1 space-y-3.5 px-4 pb-10 pt-4">
            {/* 주문 요약 */}
            <Card className="p-[18px]">
              <SectionLabel>{meta.note}</SectionLabel>
              <div className="mt-2 text-[17px] font-bold leading-[1.45] text-navy">
                {isBilling(kind) ? "월 구독료 자동결제 카드 등록" : String(orderName)}
              </div>
              {isBilling(kind) ? (
                <>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-num text-[26px] font-black text-navy">{fmtWon(monthly)}</span>
                    <span className="text-[13px] text-muted">/ 월{ob?.household === "couple" ? " · 부부 가구" : ""}</span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-[1.7] text-muted">
                    지금은 카드만 등록하고 결제되지 않습니다. 매월 결제일에 등록하신 카드로 자동
                    청구되며, 해지는 마이 탭에서 언제든 하실 수 있습니다.
                  </p>
                </>
              ) : (
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-num text-[26px] font-black text-navy">{fmtWon(value)}</span>
                  {kind === "entry" && <span className="text-[13px] text-muted">최초 1회 · 부가세 포함</span>}
                </div>
              )}
              {order && !isBilling(kind) && (
                <div className="mt-2 border-t border-navy/[.08] pt-2 font-num text-[11px] text-muted">
                  주문번호 {order.orderId}
                </div>
              )}
            </Card>

            {/* 설정 안내 — 키가 없으면 결제창이 뜨지 않는다. 가짜로 성공시키지 않는다. */}
            {phase === "error" && error?.code === "CLIENT_KEY_MISSING" && (
              <Card className="border border-amber/30 p-4" style={{ background: "#FFF7E8" }}>
                <div className="text-[14px] font-bold text-amber">결제 키가 설정되지 않았습니다</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5A4A22]">
                  배포 환경변수에 아래 두 값을 등록하면 결제창이 열립니다. 토스페이먼츠
                  개발자센터의 내 개발정보에서 발급한 키를 넣어 주세요.
                </p>
                <ul className="mt-2 space-y-1 font-num text-[12px] text-[#5A4A22]">
                  <li>NEXT_PUBLIC_TOSS_CLIENT_KEY — 클라이언트 키</li>
                  <li>TOSS_SECRET_KEY — 시크릿 키 (서버 전용)</li>
                </ul>
              </Card>
            )}
            {phase === "error" && error?.code !== "CLIENT_KEY_MISSING" && (
              <Card className="border border-amber/30 p-4" style={{ background: "#FFF7E8" }}>
                <div className="text-[14px] font-bold text-amber">결제창을 불러오지 못했습니다</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5A4A22]">{error.message}</p>
                <p className="mt-1 font-num text-[11px] text-[#5A4A22]">{error.code}</p>
              </Card>
            )}

            {/* 결제위젯 — 토스가 이 자리에 결제수단·약관 UI 를 그린다 */}
            {!isBilling(kind) && (
              <Card className="overflow-hidden p-0">
                <div id="toss-payment-methods" />
                <div id="toss-agreement" />
                {phase === "loading" && (
                  <div className="px-4 py-10 text-center text-[13px] text-muted">결제수단을 불러오는 중입니다…</div>
                )}
              </Card>
            )}

            {isBilling(kind) && phase !== "error" && (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-[2px] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-navy/[.06] text-navy">
                    <Icon name="card" size={18} />
                  </span>
                  <p className="min-w-0 flex-1 text-[13px] leading-[1.7] text-ink">
                    아래 버튼을 누르면 토스페이먼츠 카드 등록 창이 열립니다. 카드정보는 토스페이먼츠가
                    보관하며 K-CARE 서버에는 저장되지 않습니다.
                  </p>
                </div>
              </Card>
            )}

            <PrimaryButton
              onClick={pay}
              disabled={phase !== "ready"}
              className={phase === "ready" ? "" : "opacity-50"}
            >
              {phase === "requesting"
                ? "결제창을 여는 중…"
                : isBilling(kind)
                  ? "카드 등록하기"
                  : `${fmtWon(value)} 결제하기`}
            </PrimaryButton>

            <div className="px-1">
              {PAY_NOTICE.map((n) => (
                <p key={n} className="mt-1.5 text-[11.5px] leading-[1.7] text-muted">
                  · {n}
                </p>
              ))}
              {testMode && (
                <p className="mt-2 rounded-xl bg-amber/10 px-3 py-2 text-[11.5px] font-bold leading-[1.7] text-amber">
                  테스트 키로 연결돼 있습니다 — 실제로 청구되지 않습니다.
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
