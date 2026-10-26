// 자동결제(월 구독) 카드 등록 — 결제창에서 받은 authKey 를 billingKey 로 바꾼다.
//
// billingKey 는 그 자체로 청구가 가능한 값이라 브라우저로 내려보내지 않는다. 실서비스에서는
// 여기서 받은 billingKey 를 서버 DB 에 저장하고, 매월 스케줄러가 그 키로 청구한다.
// 이 데모에는 DB 가 없어 화면 표기용 정보(카드사·마스킹 번호)만 응답한다.
import { getServerSession } from "next-auth/next";
import { hasSecret, issueBillingKey, publicBilling } from "../../../lib/toss-server";
import { authConfigured } from "../../../lib/auth-server";
import { authOptions } from "../auth/[...nextauth]";

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
  // 로그인한 가구는 보호자 계정만 카드를 등록한다 — 주소를 바로 열면 누구나 가구의 카드 표시를 바꿀 수 있었다 (2026-10-26 점검).
  // 카드 등록 · 바꾸기는 주 보호자만 (2026-10-22 결정 §3) — 주 · 부 구분은 결제 화면이 막는다
  if (authConfigured()) {
    const user = (await getServerSession(req, res, authOptions))?.user;
    if (user?.household && user.role !== "guardian") return res.status(403).json({ error: "GUARDIAN_ONLY", message: "카드 등록은 보호자 계정에서 합니다." });
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
