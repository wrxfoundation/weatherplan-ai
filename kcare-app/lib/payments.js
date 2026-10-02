// 토스페이먼츠 결제 — 공용 설정·도우미 (2026-09-23 연동).
//
// 연동 방식: 토스페이먼츠 JavaScript SDK v2 (@tosspayments/tosspayments-sdk).
//  · 일반 결제 — 결제위젯(주문서형). widgets.setAmount → renderPaymentMethods/renderAgreement
//    → requestPayment(redirect). 성공하면 successUrl 로 paymentKey·orderId·amount 가 붙어 돌아오고,
//    그때 서버가 승인 API 를 호출해야 결제가 완료된다. 승인 전까지는 돈이 빠지지 않는다.
//  · 자동결제(구독) — payment.requestBillingAuth('CARD'). 카드 등록만 하고 billingKey 를 받아 둔다.
//    실제 월 청구는 서버 스케줄러가 billingKey 로 한다 (이 앱 범위 밖).
//
// 키: 클라이언트 키만 브라우저에 나간다. 시크릿 키는 서버(pages/api/payments/*)에서만 읽고
// 응답·로그 어디에도 싣지 않는다. 둘 다 환경변수로만 주입한다 — 코드에 키를 적지 않는다.
//   NEXT_PUBLIC_TOSS_CLIENT_KEY : 클라이언트 키 (브라우저 노출 전제 · 공개값)
//   TOSS_SECRET_KEY             : 시크릿 키 (서버 전용 · 절대 노출 금지)

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
// 테스트 키는 test_ 로 시작한다 — 화면에 '테스트 모드'를 띄워 실결제와 헷갈리지 않게 한다.
export const isTestKey = (k = TOSS_CLIENT_KEY) => /^test_/.test(k);
export const hasClientKey = () => TOSS_CLIENT_KEY.length > 0;

// 결제 종류 — 화면·영수증·관제 기록이 같은 이름을 쓴다.
export const PAY_KINDS = {
  entry: { label: "가입 및 설치비", note: "최초 1회", back: "/family/my" },
  store: { label: "스토어 주문", note: "물품 구매", back: "/family/store" },
  request: { label: "해주세요 요금", note: "서비스 이용료", back: "/family/requests" },
  billing: { label: "결제수단 등록", note: "월 구독 자동결제", back: "/family/my" },
};

// 주문번호 — 토스 규격: 영문 대소문자·숫자·`-`·`_` 로 6~64자.
// 시각과 난수를 같이 넣어 같은 초에 두 번 눌러도 겹치지 않게 한다.
export function makeOrderId(kind = "pay") {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 10);
  return `kcare_${kind}_${ymd}_${rand}`;
}

// 구매자 식별키 — 이메일·전화처럼 유추되는 값을 쓰지 말라는 SDK 규격에 맞춰 난수로 만들고
// 브라우저에 보관한다. 같은 사람이 다시 와도 같은 키를 쓴다 (자동결제 등록에 필요).
const CUSTOMER_KEY = "kcare-toss-customer-key";
export function customerKey() {
  if (typeof window === "undefined") return "";
  try {
    const saved = window.localStorage.getItem(CUSTOMER_KEY);
    if (saved) return saved;
    const made = `kcare_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
    window.localStorage.setItem(CUSTOMER_KEY, made);
    return made;
  } catch {
    // 저장이 막힌 브라우저 — 이번 결제에만 쓰는 임시 키
    return `kcare_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  }
}

// 결제 화면으로 보내는 링크. 금액은 서버가 서명한 값과 대조하므로 여기서 조작해도 승인되지 않는다.
export function payHref({ kind, amount, orderName, ref = "" }) {
  const q = new URLSearchParams({ kind, orderName });
  if (amount != null) q.set("amount", String(amount));
  if (ref) q.set("ref", ref);
  return `/pay?${q.toString()}`;
}

export const fmtCard = (c) =>
  !c ? "—" : [c.issuerName || c.company, c.number ? `**** ${String(c.number).slice(-4)}` : null].filter(Boolean).join(" · ");

// 결제 상태 표기 — 빨강은 SOS·낙상 전용이라 실패도 호박색을 쓴다.
export const PAY_STATUS = {
  ready: { label: "결제 진행 중", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)" },
  done: { label: "결제 완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" },
  failed: { label: "결제 실패", fg: "#8A5D12", bg: "rgba(138,93,18,.14)" },
  canceled: { label: "결제 취소", fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

// 카드사 무이자 등은 상점 설정 몫이라 지어내지 않는다. 화면에 필요한 고지만 상수로 둔다.
export const PAY_NOTICE = [
  "결제는 토스페이먼츠를 통해 처리되며 카드정보는 K-CARE 서버에 저장되지 않습니다.",
  "결제 승인이 끝나야 요청이 진행됩니다 — 승인 전에는 금액이 청구되지 않습니다.",
  "취소·환불은 마이 탭의 결제 내역에서 요청하거나 고객센터로 연락해 주세요.",
];
