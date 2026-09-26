// 용어집 — 화면 (?) 도움말과 리포트 각주의 단일 출처.
// 원칙: 전문용어는 반드시 우리말 풀이와 함께 (경영·관제 화면용, 어르신·보호자 화면엔 용어 자체를 쓰지 않는다)
export const GLOSSARY = {
  NPS: "고객 추천 지수 (Net Promoter Score). \"지인에게 추천하시겠어요?\"를 0~10점으로 묻는 설문 — 9~10점은 추천, 0~6점은 비추천으로 집계합니다.",
  CRM: "고객 관계 관리 (Customer Relationship Management). 가구별 이용 이력과 다음 조치를 한 기록으로 관리하는 체계입니다.",
  라이프사이클: "가입부터 갱신까지 가구가 거치는 단계(온보딩 → 정착 → 확장 → 갱신). 단계마다 관리 방법이 다릅니다.",
  "이탈 신호": "리포트 미열람 · 요청 무응답 · 결제 신호 · 방문 감소를 가중 합산한 이탈 위험 점수(0~100)입니다. 요인과 가중치를 공개합니다.",
  NBA: "Next Best Action. 데이터가 제안하는 \"지금 가장 효과적인 다음 조치\"입니다 — 실행은 담당자가 합니다.",
  "Closed Loop": "조치 → 결과 측정 → 유지/표준화/롤백. 효과가 확인된 조치만 남기는 운영 방식입니다.",
  코호트: "같은 달에 가입한 가구 묶음. 묶음별로 시간이 지나며 유지율이 어떻게 변하는지 비교합니다.",
  LTV: "고객 생애 가치 (Lifetime Value). 한 가구가 이용 기간 전체에 만드는 매출 추정치입니다.",
  L4: "AI 자율성 4등급 — AI가 배정안까지 만들지만, 실행은 반드시 사람이 승인해야 합니다.",
  SLA: "서비스 수준 약속 (Service Level Agreement). 응답 · 처리 시간의 목표치와 실제치를 관리합니다.",
  해자: "경쟁사가 쉽게 복제할 수 없는 구조적 우위 — 여기서는 동의 · 접근 기록 공개 같은 신뢰 구조를 뜻합니다.",
  GA: "보험대리점 (General Agency). 등록 전 보험 모집은 법으로 금지되어 기능을 잠가 둡니다.",
  HITL: "Human-in-the-loop. AI의 제안 · 초안은 사람이 검수해야 확정되는 원칙입니다 (8.4).",
};

// 문서 지문 — 리포트 위변조 검증용 SHA-256 (Web Crypto)
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
