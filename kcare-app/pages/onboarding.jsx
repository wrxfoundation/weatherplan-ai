// 옛 주소 /onboarding → 상담 신청(/consult). 가입 상담 화면 연결을 끊었다 (2026-11-06 랜딩 요청 1장 · 5-3 · 301).
// 파트너 추천 링크(?ref=S-0012)로 들어온 사람은 추천 코드를 그대로 들고 간다.
export default function OnboardingMoved() {
  return null;
}

export function getServerSideProps({ query }) {
  const ref = typeof query.ref === "string" ? query.ref.slice(0, 40) : "";
  return { redirect: { destination: ref ? `/consult?ref=${encodeURIComponent(ref)}` : "/consult", statusCode: 301 } };
}
