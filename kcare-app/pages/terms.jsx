// 이용약관 — 로그인 없이 읽는 공개 문서 (2026-11-10). 본문은 lib/policies.js, 그리는 일은 components/LegalPage.jsx.
import LegalPage from "../components/LegalPage";

// 가구 기록을 쓰지 않는 화면 — 서버가 본문까지 그려 보낸다 (pages/_app.jsx)
TermsPage.standalone = true;

export default function TermsPage() {
  return <LegalPage id="terms" />;
}
