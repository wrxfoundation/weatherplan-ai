// 월 요금 카드 등록 — 닫았다 (2026-11-10).
//
// 전에는 결제창에서 받은 authKey 를 토스 billingKey 로 바꿔 '등록된 카드'를 화면에 보였다.
// 월 요금은 토스가 아니라 자동이체 대행으로 받기로 했다 (2026-11-06 결제 범위 — 토스는 해주세요 같은 그때그때 결제만).
// 쓰지 않는 카드 등록 입구를 열어 두면 '등록했는데 왜 안 빠져나가나'가 된다 — 화면의 입구를 없애고 이 주소도 닫는다.
// 다시 열어야 하면 git 기록의 이 파일과 lib/toss-server.js issueBillingKey 를 쓴다.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  return res.status(410).json({
    error: "BILLING_CLOSED",
    message: "월 요금은 이 화면에서 카드를 등록하지 않습니다. 자동 결제 등록은 관제가 연락드려 안내합니다.",
  });
}
