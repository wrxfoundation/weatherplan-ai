// 결제 화면 — 토스페이먼츠 결제위젯(주문서형) · 자동결제 카드 등록.
//
// /pay?kind=store&amount=80000&orderName=논슬립%20욕실%20매트&ref=rq-1
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
import { useAppState, useSync } from "../lib/state";
import { useAuth } from "../lib/auth";
import { meAs } from "../lib/people";
import { useGuardianRole } from "../lib/guardian-role";
import { fmtWon, PRICING, HOUSEHOLD } from "../lib/config";
import { AFTER_PAY_TEXT, afterPay, payerOf, paymentOf } from "../lib/requests";
import { extraIsFor } from "../lib/booking";
import { ConfirmSteps } from "../components/BookingParts";
import { cartOwner, orderTotal, pendingFor } from "../lib/store";
import {
  PAY_KINDS,
  PAY_NOTICE,
  TOSS_CLIENT_KEY,
  customerKey,
  hasClientKey,
  isTestKey,
  safeBack,
} from "../lib/payments";

// 자동결제는 금액이 없다 — 카드만 등록하고 청구는 매월 서버가 한다
const isBilling = (kind) => kind === "billing";

export default function PayPage() {
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const sync = useSync();
  // 데모(테스트 계정이 아닌 시연)에서만 '가상 승인'을 연다 (2026-10-02 결정). 테스트 계정은 실제 토스 테스트 결제로만 끝난다.
  const authUser = useAuth().user;
  const { isPrimary } = useGuardianRole();
  const demo = !authUser?.household;
  const [demoDone, setDemoDone] = useState(null);
  const { kind = "store", amount, orderName = "K-CARE 결제", ref: refId = "", back = "" } = router.query;
  const meta = PAY_KINDS[kind] || PAY_KINDS.store;
  // 돌아갈 화면 — 어르신 화면에서 낸 것은 어르신 화면으로 (앱 안 주소만 · lib/payments.js safeBack)
  const backTo = safeBack(back, meta.back);
  // 금액은 주소(amount)가 아니라 기록에서 정한다 — 해주세요는 그 요청의 요금, 추가 이용 금액은 그 청구, 스토어는 담은 물건의
  // 카탈로그 가격, 가입비는 가격표. 주소의 amount 를 고쳐도 표시 · 결제 금액이 바뀌지 않는다 (2026-10-19 점검 · 서버도 같은 값으로 서명한다)
  const req = kind === "request" ? (state.requests || []).find((r) => r.id === refId) || null : null;
  const xc = kind === "extra" ? (state.extraCharges || []).find((x) => x.id === refId) || null : null;
  // 결제자 — 가족 누구나 낸다 (2026-10-22). 어르신 계정 · 어르신 화면에서 온 결제는 어르신 이름, 그 밖은 보호자.
  // 센터 공간은 로그인한 사람 이름, 데모 · 테스트 가구는 예전 인물 (2026-10-06 점검)
  const payerRole = authUser?.role === "elder" || (!authUser?.role && backTo.startsWith("/elder")) ? "elder" : "guardian";
  const buyerName = meAs(authUser, payerRole);
  // 스토어 — 결제하는 사람이 담은 장바구니 (어르신 · 보호자 따로 · 2026-10-26 점검 · lib/store.js cartOwner)
  const owner = cartOwner(authUser, payerRole);
  const po = kind === "store" ? pendingFor(state, owner) : null;
  const expected =
    kind === "request"
      ? Number(req?.amount) || 0
      : kind === "extra"
        ? Number(xc?.amount) || 0
        : kind === "store"
          ? orderTotal(po?.items) || 0
          : kind === "entry"
            ? Number(PRICING.entryFee?.total) || 0
            : Number(amount) || 0;
  // 결제하면 안 되는 경우 — 이미 낸 해주세요(뒤로 가기로 다시 온 경우 포함) · 결제 단계가 아닌 요청 · 담은 물건이 없는 주문 ·
  // 내가 받는 분이 아닌 추가 이용 금액 (받는 분만 결제한다 — 서버도 같은 규칙 · lib/pay-server.js extraPayable) ·
  // 어르신이 직접 내기로 한 해주세요를 보호자가 여는 경우 (어르신이 '가족에게 결제 부탁'을 눌러야 보호자가 낸다 — 서버도 같은 규칙 · 2026-10-26)
  const paidAlready = req ? paymentOf(state.payments, req.id) : null;
  const blocked =
    kind === "request"
      ? !req
        ? "결제할 요청을 찾지 못했습니다. 해주세요 탭에서 다시 열어 주세요."
        : paidAlready && !paidAlready.refund
          ? `이미 결제한 요청입니다 — ${fmtWon(paidAlready.amount)}${paidAlready.demo ? " (데모)" : ""}. 두 번 결제하지 않습니다.`
          : req.status !== "awaitingPayment"
            ? "결제할 단계가 아닌 요청입니다 (승인 · 취소 등으로 상태가 바뀌었습니다)."
            : payerRole === "guardian" && payerOf(req) === "elder"
              ? "어르신이 직접 결제하기로 한 요청입니다. 어르신 화면에서 '가족에게 결제 부탁'을 누르시면 여기서 결제할 수 있어요."
              : null
      : kind === "extra"
        ? !xc
          ? "결제할 추가 이용 금액을 찾지 못했습니다. 홈에서 다시 열어 주세요."
          : xc.status === "paid"
            ? `이미 결제된 추가 이용 금액입니다 — ${fmtWon(xc.amount)}. 두 번 결제하지 않습니다.`
            : xc.status !== "pending"
              ? "결제할 수 없는 청구입니다 (취소되었습니다)."
              : !extraIsFor(xc, payerRole, buyerName)
                ? "이 추가 이용 금액은 받는 분만 결제할 수 있습니다."
                : null
        : kind === "store" && !expected
          ? "담은 물건이 없습니다. 스토어에서 다시 담아 주세요."
          : isBilling(kind) && (payerRole === "elder" || !isPrimary)
            ? "카드 등록 · 바꾸기는 주 보호자만 합니다. 결제는 가족 누구나 해요." // 2026-10-22 결정 §3 · 주소를 바로 열어도 막는다 (2026-10-26 점검)
            : null;

  const [phase, setPhase] = useState("loading"); // loading | ready | requesting | error | blocked
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null); // { orderId, amount, ref, sig } — 금액은 서버가 정한 값
  // 화면에 보이는 금액 — 서버가 주문을 만들면 그 값(서명된 금액), 그 전에는 기록에서 정한 값
  const value = order?.amount ?? expected;
  const widgetsRef = useRef(null);
  const paymentRef = useRef(null);
  const mounted = useRef(false);

  const ob = state.onboarding;
  const monthly = ob?.household === "couple" ? HOUSEHOLD.monthly : PRICING.subscription.monthly;

  // ── 위젯 준비 ──
  const setup = useCallback(async () => {
    if (!router.isReady || mounted.current) return;
    if (blocked) {
      setPhase("blocked");
      return;
    }
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
      // 일반 결제 — 주문번호·금액 서명을 서버에서 받는다. 테스트 계정이면 방금 만든 요청 · 담은 물건이
      // 서버에 먼저 들어가야 서버가 금액을 정할 수 있다 — 모아 둔 것을 먼저 보낸다
      await sync.flush();
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ref: refId, amount: expected, items: po?.items || null }),
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
  }, [router.isReady, kind, expected, refId, po, blocked, sync]);

  useEffect(() => {
    setup();
  }, [setup]);

  // ── 결제 요청 ──
  const pay = async () => {
    setPhase("requesting");
    const origin = window.location.origin;
    try {
      // 테스트 계정이면 담아 둔 주문을 서버에 먼저 저장한다 — 결제창에서 돌아오면 서버에서 다시 읽는다
      await sync.flush();
      if (isBilling(kind)) {
        await paymentRef.current.requestBillingAuth({
          method: "CARD",
          successUrl: `${origin}/pay/result?kind=billing`,
          failUrl: `${origin}/pay/result?kind=billing`,
          customerName: buyerName,
        });
        return;
      }
      const backQ = backTo !== meta.back ? `&back=${encodeURIComponent(backTo)}` : "";
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: String(orderName),
        successUrl: `${origin}/pay/result?kind=${kind}&sig=${order.sig}${order.ref ? `&ref=${encodeURIComponent(order.ref)}` : ""}${backQ}`,
        failUrl: `${origin}/pay/result?kind=${kind}${refId ? `&ref=${refId}` : ""}${backQ}`,
        customerName: buyerName,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 것도 여기로 온다 — 실패가 아니라 되돌아온 것
      setPhase("ready");
      if (e?.code && e.code !== "USER_CANCEL") setError({ code: e.code, message: e.message });
    }
  };

  const testMode = isTestKey();

  // ── 데모 가상 승인 — 토스를 부르지 않는다. 결제 기록에 '데모 · 실제 결제 없음'을 남기고,
  // 결제가 끝났을 때와 같은 다음 단계(해주세요는 컨시어지 승인 대기 · 확정, 스토어는 주문)를 세운다. 시연 흐름이 결제 키 없이도 이어지게.
  const demoApprove = () => {
    if (blocked || !value) return;
    const payment = {
      orderId: `demo_${kind}_${Date.now()}`,
      orderName: String(orderName),
      amount: value,
      method: "데모 가상 승인",
      approvedAt: new Date().toISOString(),
      demo: true,
    };
    dispatch({ type: "addPayment", payload: { kind, ref: refId || null, status: "done", ...payment } });
    dispatch({ type: "pushEvent", payload: { kind: "결제", text: `${meta.label} ${fmtWon(value)} 데모 가상 승인 (실제 결제 없음)`, color: "#8FE3C0" } });
    if (kind === "request" && refId) {
      dispatch({ type: "requestPaid", id: refId, amount: value, orderId: payment.orderId, by: buyerName, note: `${buyerName} 데모 가상 승인 ${fmtWon(value)} (실제 결제 없음)` });
    }
    if (kind === "extra" && refId) {
      dispatch({ type: "extraChargePaid", id: refId, amount: value, orderId: payment.orderId, by: buyerName, method: "데모 가상 승인", demo: true });
    }
    if (kind === "store") dispatch({ type: "commitPendingOrder", payload: payment, by: buyerName, owner });
    setDemoDone(payment);
  };

  return (
    <>
      <Head>
        <title>결제 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Link href={backTo} aria-label="뒤로" className="tap -ml-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center rounded-lg px-2 text-[18px] font-bold text-muted">
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
                    지금은 카드만 등록하고 결제되지 않습니다. 이 앱은 아직 매월 자동 청구를 하지
                    않습니다 (청구 방식은 관제센터가 따로 안내합니다). 해지는 마이 › 멤버십에서 상담을 요청하실 수 있습니다.
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
                <div className="text-[14px] font-bold text-amber">결제창을 준비하고 있습니다</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5A4A22]">
                  아직 결제 연결이 설정되지 않아 결제창이 열리지 않습니다. 금액은 청구되지 않았습니다.
                  {demo ? " 시연에서는 아래 '데모 승인'으로 다음 단계를 보실 수 있습니다." : " 관제센터에 문의해 주세요."}
                </p>
              </Card>
            )}
            {phase === "error" && error?.code !== "CLIENT_KEY_MISSING" && (
              <Card className="border border-amber/30 p-4" style={{ background: "#FFF7E8" }}>
                <div className="text-[14px] font-bold text-amber">결제창을 불러오지 못했습니다</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5A4A22]">{error.message}</p>
                <p className="mt-1 font-num text-[11px] text-[#5A4A22]">{error.code}</p>
              </Card>
            )}

            {/* 결제하면 안 되는 경우 — 이미 결제 · 단계가 바뀜 · 담은 물건 없음. 결제창 · 데모 승인을 열지 않는다 */}
            {phase === "blocked" && !demoDone && (
              <Card className="border border-amber/30 p-4" style={{ background: "#FFF7E8" }}>
                <div className="text-[14px] font-bold text-amber">결제하지 않았습니다</div>
                <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#5A4A22]">{blocked}</p>
                <Link href={backTo} className="tap mt-3 flex w-full items-center justify-center rounded-xl border border-navy/20 bg-white py-3 text-[14px] font-bold text-navy">
                  {kind === "store" ? "스토어로 " : kind === "request" && !backTo.startsWith("/elder") ? "해주세요로 " : ""}돌아가기
                </Link>
              </Card>
            )}

            {/* 결제위젯 — 토스가 이 자리에 결제수단·약관 UI 를 그린다 */}
            {!isBilling(kind) && phase !== "blocked" && (
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

            {demoDone && (
              <Card className="p-[18px]">
                <div className="flex items-center justify-between">
                  <SectionLabel>데모 가상 승인</SectionLabel>
                  <Badge fg="#1E7A5A" bg="rgba(30,122,90,.12)">승인 처리됨</Badge>
                </div>
                <p className="mt-2 text-[13px] leading-[1.7] text-ink">
                  {fmtWon(demoDone.amount)} — 실제 결제는 없습니다. 결제가 끝났을 때와 같이 다음 단계가 진행됩니다.
                  {/* 결제한 뒤 갈 곳은 요청의 지금 상태로 — 수락한 제안은 확정 · 요금을 정해 보낸 것은 관제 승인 (2026-10-26 점검) */}
                  {kind === "request" && (afterPay(req).next === "confirmed" ? " 일정이 확정됐어요." : ` ${AFTER_PAY_TEXT[afterPay(req).next]}. 확정되지 않으면 전액 환불돼요.`)}
                  {kind === "extra" && " 추가 이용 금액을 결제했어요 — 담당 컨시어지와 관제에 바로 전해졌어요."}
                </p>
                {/* 확정 단계 — 결제 → 컨시어지 확인 → 관제 승인 → 일정 확정 (2026-10-22) */}
                {kind === "request" && afterPay(req).next !== "confirmed" && (
                  <div className="mt-3">
                    <ConfirmSteps at={afterPay(req).at} />
                  </div>
                )}
                <Link href={backTo} className="tap mt-3 flex w-full items-center justify-center rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy">
                  돌아가기
                </Link>
              </Card>
            )}

            {!demoDone && phase !== "blocked" && (
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
            )}

            {/* 데모 전용 — 결제 키가 없어도 시연을 이어 간다. 실제 결제와 헷갈리지 않게 버튼 말에 '실제 결제 없음'을 박는다 */}
            {demo && !isBilling(kind) && !demoDone && !blocked && value > 0 && (
              <button
                onClick={demoApprove}
                disabled={phase === "requesting"}
                className="btn-press w-full rounded-2xl border border-navy/20 py-3.5 text-[14px] font-bold text-navy disabled:opacity-50"
              >
                데모 승인 (실제 결제 없음)
              </button>
            )}

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
