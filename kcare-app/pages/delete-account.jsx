// 계정 삭제 안내 — 로그인 없이 읽는 공개 화면 (2026-11-26 구글 플레이 준비).
// 구글 플레이 데이터 보안 양식의 '계정 삭제 URL'에 이 주소를 적는다 — 앱을 지운 사람도 삭제를 요청할 수 있어야 한다.
// 본문은 lib/account-deletion.js (내 정보 관리의 탈퇴 안내와 같은 글), 그리는 일은 components/LegalPage.jsx.
import LegalPage from "../components/LegalPage";
import { ACCOUNT_DELETION } from "../lib/account-deletion";

// 가구 기록을 쓰지 않는 화면 — 서버가 본문까지 그려 보낸다 (pages/_app.jsx)
DeleteAccountPage.standalone = true;

export default function DeleteAccountPage() {
  return <LegalPage doc={ACCOUNT_DELETION} />;
}
