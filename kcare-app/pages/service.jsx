// 옛 주소 /service → 맨 처음 화면(/). 서비스 소개가 / 로 옮겨졌다 (2026-11-06 랜딩 요청 1장 · 301).
// 설정 파일(next.config.js)의 redirects 대신 화면 파일로 둔다 — 예전 파일이 저장소에 남아 있어도 이 파일이 덮어쓴다.
export default function ServiceMoved() {
  return null;
}

export function getServerSideProps() {
  return { redirect: { destination: "/", statusCode: 301 } };
}
