// 토스페이먼츠 서버 호출 — 시크릿 키를 쓰는 유일한 자리 (pages/api/payments/* 전용).
//
// 절대 규칙: 시크릿 키는 응답 본문·에러 메시지·로그 어디에도 넣지 않는다.
// 키가 없으면 호출을 시도하지 않고 설정 안내 코드를 돌려준다 — 잘못된 키로 토스를 두드리면
// 상점 계정에 실패 로그만 쌓인다.
import crypto from "crypto";

const API = "https://api.tosspayments.com";
const secret = () => process.env.TOSS_SECRET_KEY || "";
export const hasSecret = () => secret().length > 0;

// 인증 헤더 — Basic base64("시크릿키:") (콜론까지 포함해야 한다)
const authHeader = () => `Basic ${Buffer.from(`${secret()}:`).toString("base64")}`;

// ── 금액 서명 ───────────────────────────────────────────────────────────
// 이 앱에는 주문을 보관하는 DB 가 없다. 그래서 결제 요청 때 서버가 (주문번호 + 금액)에
// 서명을 만들어 주고, 승인 때 그 서명을 다시 검증한다. 브라우저에서 금액을 1원으로 바꿔
// 결제하고 승인을 부르면 서명이 깨져 거부된다.
//
// 실서비스에서는 이 서명 대신 주문 테이블을 두고 서버가 보관한 금액과 대조해야 한다.
const signingKey = () => process.env.TOSS_SECRET_KEY || process.env.PAY_SIGNING_SECRET || "";
export function signOrder(orderId, amount) {
  return crypto.createHmac("sha256", signingKey()).update(`${orderId}|${amount}`).digest("hex").slice(0, 32);
}
export function verifyOrder(orderId, amount, sig) {
  if (!sig || !signingKey()) return false;
  const want = Buffer.from(signOrder(orderId, amount));
  const got = Buffer.from(String(sig));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

// ── 토스 호출 ───────────────────────────────────────────────────────────
// 실패해도 토스가 준 code·message 만 돌려준다 (키·헤더는 절대 싣지 않는다).
async function callToss(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.message || "결제 처리 중 오류가 발생했습니다.");
    err.tossCode = data?.code || `HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }
  return data;
}

// 결제 승인 — 이 호출이 성공해야 결제가 완료된다 (승인 전에는 청구되지 않는다)
export const confirmPayment = ({ paymentKey, orderId, amount }) =>
  callToss("/v1/payments/confirm", { paymentKey, orderId, amount });

// 빌링키 발급 — 카드 등록 뒤 받은 authKey 를 billingKey 로 바꾼다 (월 구독 자동결제용)
export const issueBillingKey = ({ customerKey, authKey }) =>
  callToss("/v1/billing/authorizations/issue", { customerKey, authKey });

// 응답에서 화면에 보여 줄 것만 추린다 — 카드번호 전체·영수증 내부 식별자는 넘기지 않는다
export function publicPayment(p) {
  if (!p) return null;
  return {
    orderId: p.orderId,
    orderName: p.orderName,
    amount: p.totalAmount ?? p.amount ?? null,
    method: p.method || null,
    status: p.status || null,
    approvedAt: p.approvedAt || null,
    receiptUrl: p.receipt?.url || null,
    card: p.card ? { issuerName: p.card.issuerName || null, number: p.card.number || null, installmentPlanMonths: p.card.installmentPlanMonths ?? 0 } : null,
    easyPay: p.easyPay?.provider || null,
  };
}

export function publicBilling(b) {
  if (!b) return null;
  return {
    billingKey: b.billingKey ? `${String(b.billingKey).slice(0, 6)}…` : null, // 화면 표기용 — 원본은 서버 보관 대상
    cardCompany: b.card?.issuerName || b.cardCompany || null,
    cardNumber: b.card?.number || b.cardNumber || null,
    method: b.method || "카드",
    authenticatedAt: b.authenticatedAt || null,
  };
}
