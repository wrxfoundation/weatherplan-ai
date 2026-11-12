// 이용자 회원가입 — 어르신 · 보호자 (2026-10-06). 가입 신청 뒤 확인이 끝나면 로그인된다.
import JoinScreen from "../components/JoinScreen";

export default function JoinPage() {
  return <JoinScreen area="user" title="어르신 · 보호자 회원가입" lead="담당 파트너에게 받은 가입 코드로 가입 신청합니다." />;
}
