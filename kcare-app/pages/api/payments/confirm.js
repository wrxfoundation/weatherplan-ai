// 결제 승인 — 이 호출이 성공해야 결제가 완료된다.
// 순서: 금액 서명 검증 → 토스 승인 API → 화면에 보여 줄 값만 응답.
// 서명이 깨지면 토스를 부르지 않는다 (조작된 금액으로 승인하지 않는다).
import { confirmPayment, hasSecret, publicPayment, verifyOrder } from "../../../lib/toss-server";

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
  const { paymentKey, orderId, amount, sig } = req.body || {};
  const value = Number(amount);
  if (!paymentKey || !orderId || !Number.isInteger(value)) {
    return res.status(400).json({ error: "INVALID_REQUEST", message: "승인에 필요한 값이 빠졌습니다." });
  }
  if (!verifyOrder(orderId, value, sig)) {
    // 결제창에서 돌아온 금액이 결제 요청 때 서버가 서명한 금액과 다르다
    return res.status(400).json({ error: "AMOUNT_MISMATCH", message: "결제 금액이 주문과 일치하지 않습니다." });
  }
  try {
    const payment = await confirmPayment({ paymentKey, orderId, amount: value });
    return res.status(200).json({ ok: true, payment: publicPayment(payment) });
  } catch (e) {
    // 토스가 준 코드·메시지만 전달한다 — 키·헤더는 싣지 않는다
    return res.status(e.status || 502).json({ error: e.tossCode || "CONFIRM_FAILED", message: e.message });
  }
}
