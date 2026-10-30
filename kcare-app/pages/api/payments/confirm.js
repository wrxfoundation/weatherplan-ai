// 결제 승인 — 이 호출이 성공해야 결제가 완료된다.
// 순서: 금액 서명 검증 → 토스 승인 API → 화면에 보여 줄 값만 응답.
// 서명이 깨지면 토스를 부르지 않는다 (조작된 금액으로 승인하지 않는다).
import { getServerSession } from "next-auth/next";
import { confirmPayment, getPayment, hasSecret, publicPayment, verifyOrder } from "../../../lib/toss-server";
import { authConfigured } from "../../../lib/auth-server";
import { db, dbConfigured, dbErrorCode } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";
import { memberStillValid } from "../../../lib/members";
import { applyPaidToHousehold, extraPayable, householdState, recordedPayment, requestPayable } from "../../../lib/pay-server";
import { orderScope } from "../../../lib/payments";

// 테스트 계정으로 로그인한 결제는 서버(Supabase payments 표)에도 남긴다 — 금액·상태는 토스 응답 기준.
// 기록이 실패해도 결제 승인 응답은 그대로 돌려준다 (돈은 이미 승인됐다).
async function record(req, res, p) {
  if (!dbConfigured() || !authConfigured() || !p?.orderId) return;
  try {
    const session = await getServerSession(req, res, authOptions);
    const user = session?.user;
    if (!user?.household) return;
    // 관제가 정지 · 역할 변경한 회원의 결제는 가구 기록에 붙이지 않는다 (승인 자체는 토스에서 이미 끝났다 — 로그만)
    const still = await memberStillValid(user);
    if (!still.ok) {
      console.error("[payments] 정지 · 변경된 계정의 결제 기록 건너뜀", still.reason);
      return;
    }
    const kind = /^kcare_([a-z]+)_/.exec(p.orderId)?.[1] || null;
    const { error, status } = await db()
      .from("payments")
      .upsert(
        {
          order_id: p.orderId,
          household_id: user.household,
          account_id: user.id,
          kind,
          order_name: p.orderName ? String(p.orderName).slice(0, 100) : null,
          amount: p.amount,
          method: p.method,
          status: p.status,
          approved_at: p.approvedAt,
          receipt_url: p.receiptUrl,
          test_mode: String(process.env.TOSS_SECRET_KEY || "").startsWith("test_"),
        },
        { onConflict: "order_id", ignoreDuplicates: true }
      );
    if (error) throw Object.assign(error, { status });
  } catch (e) {
    console.error("[payments] 결제 기록 실패", dbErrorCode(e));
  }
}

// 이 결제가 토스에서 이미 승인됐나 — 같은 주문번호 · 같은 금액 · 완료(또는 가상계좌 입금 대기)일 때만 그 결제를 돌려준다 (2026-10-26 점검)
async function approvedPayment(paymentKey, orderId, value) {
  try {
    const p = await getPayment(paymentKey);
    if (p && p.orderId === orderId && Number(p.totalAmount) === value && ["DONE", "WAITING_FOR_DEPOSIT"].includes(p.status)) return publicPayment(p);
  } catch (e) {
    console.error("[payments/confirm] 결제 조회 실패", e.tossCode || "error");
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!hasSecret()) {
    return res.status(503).json({
      error: "SECRET_KEY_MISSING",
      message: "서버에 토스 시크릿 키(TOSS_SECRET_KEY)가 설정되지 않아 승인할 수 없습니다.",
    });
  }
  const { paymentKey, orderId, amount, sig, kind = "", ref = "" } = req.body || {};
  const value = Number(amount);
  if (!paymentKey || !orderId || !Number.isInteger(value)) {
    return res.status(400).json({ error: "INVALID_REQUEST", message: "승인에 필요한 값이 빠졌습니다." });
  }
  const refId = String(ref || "").slice(0, 80);
  if (!verifyOrder(orderId, value, sig, orderScope(kind, refId))) {
    // 결제창에서 돌아온 금액 · 종류 · 요청 번호가 결제 요청 때 서버가 서명한 것과 다르다
    return res.status(400).json({ error: "AMOUNT_MISMATCH", message: "결제 금액 · 주문 정보가 주문과 일치하지 않습니다." });
  }
  // 승인이 끝나면 — 서버 결제 표에 남기고, 가구 기록에도 바로 남긴다(결제한 폰의 결과 화면이 살아 있지 않아도 · 2026-10-26 점검).
  // 가구 기록 반영이 실패해도 승인 응답은 그대로 돌려준다 (돈은 이미 승인됐다 — 결과 화면이 같은 동작을 남긴다)
  let user = null;
  const finish = async (payment, recovered) => {
    await record(req, res, payment);
    if (user?.household) {
      try {
        await applyPaidToHousehold(user, kind, refId, payment);
      } catch (e) {
        console.error("[payments/confirm] 가구 기록 반영 실패", dbErrorCode(e));
      }
    }
    return res.status(200).json({ ok: true, payment, ...(recovered ? { recovered: true } : {}) });
  };
  // 로그인한 가구 — 승인(청구) 직전에 한 번 더 본다. 결제창에 있는 사이 다른 폰에서 이미 결제했거나
  // 요청이 취소 · 변경됐으면 토스를 부르지 않는다 — 돈을 받고 나서 환불 대기로 돌리는 것보다 안 받는 게 맞다 (2026-10-19 점검).
  // 추가 이용 금액도 같다 — 청구받은 당사자 · 결제 대기 · 같은 금액일 때만 (2026-10-22)
  if (["request", "extra", "store"].includes(kind) && authConfigured() && dbConfigured()) {
    try {
      user = (await getServerSession(req, res, authOptions))?.user || null;
      if (user?.household) {
        const st = await householdState(user.household);
        // 이미 가구 기록에 있는 결제 — 결과 화면을 다시 열었거나 '다시 확인'을 눌렀다. 승인을 다시 부르지 않고 그 기록을 돌려준다
        const known = recordedPayment(st, orderId);
        if (known) return res.status(200).json({ ok: true, payment: known, recovered: true });
        if (kind !== "store" && refId) {
          const p = kind === "extra" ? extraPayable(st, refId, user) : requestPayable(st, refId, user);
          if (p.error || p.amount !== value) {
            // 앞서 승인됐는데 응답이 폰에 닿지 못해 기록만 못 남긴 결제일 수 있다 — 토스에 물어 승인된 결제면 그대로 남긴다
            // (그 사이 요청이 끝났거나 다른 결제가 들어왔으면 기록 규칙이 이 결제를 환불 대기로 돌린다)
            const found = await approvedPayment(paymentKey, orderId, value);
            if (found) return finish(found, true);
            if (p.error) return res.status(p.status).json({ error: p.error, message: p.message });
            return res.status(409).json({ error: "AMOUNT_CHANGED", message: "그 사이 금액이 바뀌었습니다. 화면을 새로 고친 뒤 다시 결제해 주세요." });
          }
        }
      }
    } catch (e) {
      console.error("[payments/confirm] 가구 기록 확인 실패", dbErrorCode(e));
      return res.status(502).json({ error: "STATE_READ_FAILED", message: "요청 상태를 확인하지 못해 승인하지 않았습니다. 잠시 뒤 다시 시도해 주세요." });
    }
  }
  try {
    const payment = publicPayment(await confirmPayment({ paymentKey, orderId, amount: value }));
    return finish(payment, false);
  } catch (e) {
    // 이미 승인된 결제 — 앞선 승인의 응답만 못 받았을 수 있다. 토스에서 이 결제를 다시 읽어 같은 주문이면 승인 결과로 돌려준다
    if (e.tossCode === "ALREADY_PROCESSED_PAYMENT") {
      const found = await approvedPayment(paymentKey, orderId, value);
      if (found) return finish(found, true);
    }
    // 토스가 준 코드·메시지만 전달한다 — 키·헤더는 싣지 않는다
    return res.status(e.status || 502).json({ error: e.tossCode || "CONFIRM_FAILED", message: e.message });
  }
}
