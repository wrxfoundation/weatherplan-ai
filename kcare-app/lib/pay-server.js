// 결제 서버 도우미 — 로그인한 가구의 저장 상태로 결제 금액 · 가능 여부를 정한다 (pages/api/payments/* 전용).
// 금액은 브라우저가 보낸 값을 믿지 않는다 (2026-10-19 점검).
// 2026-10-22 — 이용 시간이 있는 해주세요는 저장된 서비스 · 이용 시간 · 인원으로 금액을 다시 계산하고(lib/booking.js),
// 추가 이용 금액은 청구받은 당사자만 낸다. 결제는 가족 그룹(보호자 · 어르신) 누구나 한다.
import { db } from "./db";
import { payerOf, paymentOf } from "./requests";
import { expectedAmount, extraAmountOf, extraIsFor } from "./booking";
import { centerOfHousehold } from "./centers";
import { DEFAULT_PEOPLE } from "./people";
import { applyToServerState } from "./state";
import { normalizePayStatus } from "./payments";
import { cartOwner } from "./store";
import { fmtWon } from "./config";

// 화면이 쓰는 이 계정의 이름 — 관제 센터 공간은 회원 이름, 테스트 가구는 예전 인물(보호자 김민수)이다 (lib/people.js meAs 와 같은 규칙).
// 컨시어지가 받는 분을 고를 때 이 이름으로 고르므로, 받는 분 확인도 같은 이름으로 한다
const screenName = (user) => (centerOfHousehold(user?.household) ? user?.name || "" : user?.role === "guardian" ? DEFAULT_PEOPLE.guardian : DEFAULT_PEOPLE.elder);

// 가구 저장 상태 — 없으면 빈 객체
export async function householdState(household) {
  const { data, error } = await db().from("households").select("state").eq("id", household).maybeSingle();
  if (error) throw error;
  return data?.state && typeof data.state === "object" ? data.state : {};
}

// 승인된 결제를 가구 기록에 바로 남긴다 (2026-10-26 점검) — 전에는 결제한 폰의 결과 화면만 기록을 남겨, 승인 중에 앱을 닫거나
// 연결이 끊기면 돈은 빠졌는데 요청은 '결제 대기'로 남았고 다시 결제할 수 있었다. 화면과 같은 동작(addPayment → requestPaid ·
// extraChargePaid · commitPendingOrder)을 같은 규칙(lib/state.js reducer)으로 넣는다. 결제한 폰도 같은 동작을 보내지만 주문번호로
// 걸러져 두 번 들어가지 않는다. 다른 폰이 그 사이 저장했으면(버전이 다르면) 다시 읽어 넣는다.
// 돌려주는 값: true(넣었거나 이미 있음) · false(가구 기록이 없거나 계속 엇갈림 — 결제한 폰의 화면이 대신 남긴다)
export async function applyPaidToHousehold(user, kind, refId, payment, client = db()) {
  if (!user?.household || !payment?.orderId) return false;
  const status = normalizePayStatus(payment.status);
  const pay = { ...payment, tossStatus: payment.status || null, status };
  const by = screenName(user) || (user.role === "elder" ? "어르신" : "보호자");
  const at = Date.now();
  const op = `srv${String(payment.orderId).replace(/[^A-Za-z0-9]/g, "").slice(-24)}`;
  const actions = [{ type: "addPayment", payload: { kind, ref: refId || null, ...pay }, _at: at, _op: `${op}a` }];
  if (status === "done") {
    if (kind === "request" && refId) actions.push({ type: "requestPaid", id: refId, amount: pay.amount, orderId: pay.orderId, by, note: `${by} 결제 완료 ${fmtWon(pay.amount)}`, _at: at, _op: `${op}b` });
    if (kind === "extra" && refId) actions.push({ type: "extraChargePaid", id: refId, amount: pay.amount, orderId: pay.orderId, by, method: pay.method || "카드", _at: at, _op: `${op}b` });
    if (kind === "store") actions.push({ type: "commitPendingOrder", payload: pay, by, owner: cartOwner(user), _at: at, _op: `${op}b` });
  }
  for (let i = 0; i < 4; i++) {
    const { data, error } = await client.from("households").select("state,version").eq("id", user.household).maybeSingle();
    if (error) throw error;
    const raw = data?.state;
    if (!raw || typeof raw !== "object") return false;
    if ((Array.isArray(raw.payments) ? raw.payments : []).some((p) => p && p.orderId === pay.orderId)) return true;
    const next = applyToServerState(raw, user.household, actions);
    const { data: upd, error: e2 } = await client
      .from("households")
      .update({ state: next, version: (data.version || 0) + 1, updated_at: new Date().toISOString(), updated_by: `결제 서버 · ${user.name || user.id}`.slice(0, 120) })
      .eq("id", user.household)
      .eq("version", data.version || 0)
      .select("version");
    if (e2) throw e2;
    if (upd && upd.length) return true;
  }
  return false;
}

// 이 주문번호의 결제가 가구 기록에 이미 있나 — 결과 화면을 다시 열거나 '다시 확인'을 눌렀을 때 승인을 다시 부르지 않고 그 기록을 돌려준다
export function recordedPayment(state, orderId) {
  return (Array.isArray(state?.payments) ? state.payments : []).find((p) => p && p.orderId === orderId) || null;
}

// 결제할 수 있는 계정 — 가족 그룹(보호자 · 어르신). 컨시어지 · 관제 · 영업 계정은 고객 대신 결제하지 않는다
export const PAYER_ROLES = ["guardian", "elder"];
export const canPayRole = (role) => PAYER_ROLES.includes(role);

// 해주세요 결제 가능 여부 — 서버 기록 기준. 이미 낸 결제(환불 안 된 것)가 있거나 결제 대기가 아니면 거부한다.
// 이용 시간 규칙이 있는 서비스는 다시 계산한 금액이 기록된 금액과 같아야 한다 (기록의 금액만 고쳐 싸게 내지 못하게).
// 어르신이 직접 내기로 한 해주세요(가족에게 결제 부탁 전)는 보호자 계정이 결제하지 못한다 — 어르신 결제창과 보호자 결제가
// 같이 열리지 않게 (2026-10-26 연동 점검 · lib/requests.js payerOf)
export function requestPayable(state, ref, user) {
  const r = (Array.isArray(state?.requests) ? state.requests : []).find((x) => x && x.id === ref);
  if (!r) return { error: "REQUEST_NOT_FOUND", status: 404, message: "결제할 요청을 찾지 못했습니다. 화면을 새로 고친 뒤 다시 시도해 주세요." };
  const paid = paymentOf(state.payments, ref);
  if (paid && !paid.refund) return { error: "ALREADY_PAID", status: 409, message: "이미 결제한 요청입니다. 해주세요 탭에서 결제 내역을 확인해 주세요." };
  if (r.status !== "awaitingPayment") return { error: "NOT_PAYABLE", status: 409, message: "결제할 단계가 아닌 요청입니다 (그 사이 취소 · 변경되었을 수 있습니다)." };
  if (user?.role === "guardian" && payerOf(r) === "elder") return { error: "ELDER_PAYS", status: 403, message: "어르신이 직접 결제하기로 한 요청입니다. 어르신 화면에서 '가족에게 결제 부탁'을 누르시면 결제할 수 있어요." };
  const amount = Number(r.amount);
  if (!Number.isInteger(amount) || amount <= 0) return { error: "PRICE_NOT_SET", status: 409, message: "요금이 아직 정해지지 않은 요청입니다." };
  const want = expectedAmount(r);
  if (want !== amount) return { error: "PRICE_MISMATCH", status: 409, message: "요청에 적힌 요금이 이용 시간 요금과 맞지 않습니다. 취소하고 다시 신청해 주세요." };
  return { amount };
}

// 추가 이용 금액 결제 가능 여부 — 청구받은 당사자만, 결제 대기일 때만. 금액은 서비스 · 예약 · 실제 이용 시간으로 다시 계산한다
export function extraPayable(state, ref, user) {
  const x = (Array.isArray(state?.extraCharges) ? state.extraCharges : []).find((c) => c && c.id === ref);
  if (!x) return { error: "CHARGE_NOT_FOUND", status: 404, message: "결제할 추가 이용 금액을 찾지 못했습니다. 화면을 새로 고친 뒤 다시 시도해 주세요." };
  if (x.status === "paid") return { error: "ALREADY_PAID", status: 409, message: "이미 결제된 추가 이용 금액입니다." };
  if (x.status !== "pending") return { error: "NOT_PAYABLE", status: 409, message: "결제할 수 없는 청구입니다 (취소되었을 수 있습니다)." };
  if (user && !extraIsFor(x, user.role, screenName(user))) return { error: "NOT_RECIPIENT", status: 403, message: "이 추가 이용 금액은 청구받은 분만 결제할 수 있습니다." };
  const amount = extraAmountOf(x);
  if (!Number.isInteger(amount) || amount <= 0 || amount !== Number(x.amount)) return { error: "PRICE_MISMATCH", status: 409, message: "청구 금액을 확인하지 못했습니다. 담당 컨시어지에게 다시 보내 달라고 해 주세요." };
  return { amount };
}
