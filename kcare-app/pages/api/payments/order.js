// 결제 시작 — 주문번호를 만들고 금액에 서명해 돌려준다.
// 금액은 서버가 정한다 (2026-10-19 점검 — 전에는 브라우저가 보낸 금액에 그대로 서명해서, 주소의 amount 를 100 으로
// 바꾸면 9만 원짜리 해주세요가 100원에 '결제 완료'됐다):
//   · 해주세요 — 로그인한 가구는 서버에 저장된 그 요청의 요금 (결제 대기 상태일 때만 · 이미 결제했으면 거부)
//   · 스토어   — 카탈로그 가격으로 다시 계산 (로그인한 가구는 서버에 저장된 담은 물건, 데모는 보낸 상품 번호)
//   · 가입비   — 확정된 가격표 값 (확정 전이면 결제하지 않는다)
//   · 추가 이용 금액 — 서버에 저장된 그 청구 (청구받은 당사자 · 결제 대기일 때만). 금액은 예약 · 실제 이용 시간으로 다시 계산 (2026-10-22)
// 데모(로그인 없이 시연)의 해주세요는 기록이 이 브라우저에만 있어 서버가 대조할 수 없다 — 실제 서비스가 나가지 않는 시연이라
// 보낸 금액을 쓰되, 앱 쪽(requestPaid)이 요청 요금과 다른 결제를 확정하지 않고 환불 대기로 돌린다.
// 승인(confirm)에서 이 서명을 (금액 + 종류 · 요청 번호까지) 다시 검증하므로, 결제창에서 돌아오는 값을 바꿔도 승인되지 않는다.
// 결제는 가족 그룹(보호자 · 어르신) 누구나 한다 — 금액 제한 없음 (2026-10-22 · 전에는 보호자 계정만)
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { authConfigured } from "../../../lib/auth-server";
import { dbConfigured, dbErrorCode } from "../../../lib/db";
import { hasSecret, signOrder } from "../../../lib/toss-server";
import { canPayRole, extraPayable, householdState, requestPayable } from "../../../lib/pay-server";
import { makeOrderId, orderScope } from "../../../lib/payments";
import { cartOwner, orderTotal, pendingFor } from "../../../lib/store";
import { PRICING } from "../../../lib/config";

const MAX = 10_000_000; // 한 건 상한 — 데모 오입력 방지 (실서비스 한도는 상점 정책에 따른다)
const KINDS = new Set(["request", "store", "entry", "extra"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!hasSecret()) {
    return res.status(503).json({
      error: "SECRET_KEY_MISSING",
      message: "서버에 결제 키가 설정되지 않았습니다.",
    });
  }
  const { kind = "", amount, ref = "", items } = req.body || {};
  if (!KINDS.has(kind)) return res.status(400).json({ error: "INVALID_KIND", message: "결제 종류가 올바르지 않습니다." });
  const refId = String(ref || "").slice(0, 80);

  let value = null;
  try {
    // 로그인한 가구(테스트 계정 · 센터 회원)면 서버에 저장된 기록으로 금액을 정한다
    const user = authConfigured() && dbConfigured() ? (await getServerSession(req, res, authOptions))?.user : null;
    const state = user?.household ? await householdState(user.household) : null;
    if (state && !canPayRole(user.role)) {
      return res.status(403).json({ error: "FAMILY_ONLY", message: "결제는 가족(보호자 · 어르신) 계정에서 합니다." });
    }
    if (kind === "extra") {
      if (!refId) return res.status(400).json({ error: "REF_MISSING", message: "어떤 청구의 결제인지 빠졌습니다." });
      if (state) {
        const p = extraPayable(state, refId, user);
        if (p.error) return res.status(p.status).json({ error: p.error, message: p.message });
        value = p.amount;
      } else {
        value = Number(amount);
      }
    } else if (kind === "entry") {
      value = Number(PRICING.entryFee?.total);
      if (!PRICING.entryFee?.confirmed || !Number.isInteger(value)) {
        return res.status(409).json({ error: "PRICE_NOT_CONFIRMED", message: "가입 및 설치비가 아직 확정되지 않았습니다." });
      }
    } else if (kind === "store") {
      // 이 계정이 담은 장바구니로 — 가구 기록 한 칸을 같이 쓰면 다른 가족이 방금 담은 물건으로 금액이 정해졌다 (2026-10-26 점검)
      value = orderTotal(state ? pendingFor(state, cartOwner(user))?.items : items);
      if (value == null) return res.status(409).json({ error: "ORDER_NOT_FOUND", message: "담은 물건을 확인하지 못했습니다. 스토어에서 다시 담아 주세요." });
    } else if (state) {
      if (!refId) return res.status(400).json({ error: "REF_MISSING", message: "어떤 요청의 결제인지 빠졌습니다." });
      const p = requestPayable(state, refId, user);
      if (p.error) return res.status(p.status).json({ error: p.error, message: p.message });
      value = p.amount;
    } else {
      value = Number(amount);
    }
  } catch (e) {
    console.error("[payments/order]", dbErrorCode(e));
    return res.status(502).json({ error: "STATE_READ_FAILED", message: "주문 정보를 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
  }
  if (!Number.isInteger(value) || value < 100 || value > MAX) {
    return res.status(400).json({ error: "INVALID_AMOUNT", message: "결제 금액이 올바르지 않습니다." });
  }
  const orderId = makeOrderId(String(kind).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "pay");
  return res.status(200).json({ orderId, amount: value, ref: refId, sig: signOrder(orderId, value, orderScope(kind, refId)) });
}
