// 자동결제(월 구독) 카드 등록 — 결제창에서 받은 authKey 를 billingKey 로 바꾼다.
//
// billingKey 는 그 자체로 청구가 가능한 값이라 브라우저로 내려보내지 않는다. 실서비스에서는
// 여기서 받은 billingKey 를 서버 DB 에 저장하고, 매월 스케줄러가 그 키로 청구한다.
// 이 데모에는 DB 가 없어 화면 표기용 정보(카드사·마스킹 번호)만 응답한다.
import { hasSecret, issueBillingKey, publicBilling } from "../../../lib/toss-server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!hasSecret()) {
    return res.status(503).json({
      error: "SECRET_KEY_MISSING",
      message: "서버에 토스 시크릿 키(TOSS_SECRET_KEY)가 설정되지 않아 등록할 수 없습니다.",
    });
  }
  const { customerKey, authKey } = req.body || {};
  if (!customerKey || !authKey) {
    return res.status(400).json({ error: "INVALID_REQUEST", message: "카드 등록에 필요한 값이 빠졌습니다." });
  }
  try {
    const billing = await issueBillingKey({ customerKey, authKey });
    return res.status(200).json({ ok: true, billing: publicBilling(billing) });
  } catch (e) {
    return res.status(e.status || 502).json({ error: e.tossCode || "BILLING_FAILED", message: e.message });
  }
}
