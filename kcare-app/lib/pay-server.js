// 결제 서버 도우미 — 로그인한 가구의 저장 상태로 결제 금액 · 가능 여부를 정한다 (pages/api/payments/* 전용).
// 금액은 브라우저가 보낸 값을 믿지 않는다 (2026-10-19 점검).
import { db } from "./db";
import { paymentOf } from "./requests";

// 가구 저장 상태 — 없으면 빈 객체
export async function householdState(household) {
  const { data, error } = await db().from("households").select("state").eq("id", household).maybeSingle();
  if (error) throw error;
  return data?.state && typeof data.state === "object" ? data.state : {};
}

// 해주세요 결제 가능 여부 — 서버 기록 기준. 이미 낸 결제(환불 안 된 것)가 있거나 결제 대기가 아니면 거부한다.
export function requestPayable(state, ref) {
  const r = (Array.isArray(state?.requests) ? state.requests : []).find((x) => x && x.id === ref);
  if (!r) return { error: "REQUEST_NOT_FOUND", status: 404, message: "결제할 요청을 찾지 못했습니다. 화면을 새로 고친 뒤 다시 시도해 주세요." };
  const paid = paymentOf(state.payments, ref);
  if (paid && !paid.refund) return { error: "ALREADY_PAID", status: 409, message: "이미 결제한 요청입니다. 해주세요 탭에서 결제 내역을 확인해 주세요." };
  if (r.status !== "awaitingPayment") return { error: "NOT_PAYABLE", status: 409, message: "결제할 단계가 아닌 요청입니다 (그 사이 취소 · 변경되었을 수 있습니다)." };
  const amount = Number(r.amount);
  if (!Number.isInteger(amount) || amount <= 0) return { error: "PRICE_NOT_SET", status: 409, message: "요금이 아직 정해지지 않은 요청입니다." };
  return { amount };
}
