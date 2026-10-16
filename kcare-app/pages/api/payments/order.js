// 결제 시작 — 주문번호를 만들고 금액에 서명해 돌려준다.
// 승인(confirm)에서 이 서명을 다시 검증하므로, 브라우저에서 금액을 바꿔 결제해도 승인되지 않는다.
import { hasSecret, signOrder } from "../../../lib/toss-server";
import { makeOrderId } from "../../../lib/payments";

const MAX = 10_000_000; // 한 건 상한 — 데모 오입력 방지 (실서비스 한도는 상점 정책에 따른다)

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!hasSecret()) {
    return res.status(503).json({
      error: "SECRET_KEY_MISSING",
      message: "서버에 토스 시크릿 키(TOSS_SECRET_KEY)가 설정되지 않았습니다.",
    });
  }
  const { kind = "pay", amount } = req.body || {};
  const value = Number(amount);
  if (!Number.isInteger(value) || value < 100 || value > MAX) {
    return res.status(400).json({ error: "INVALID_AMOUNT", message: "결제 금액이 올바르지 않습니다." });
  }
  const orderId = makeOrderId(String(kind).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "pay");
  return res.status(200).json({ orderId, amount: value, sig: signOrder(orderId, value) });
}
