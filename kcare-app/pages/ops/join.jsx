// 관제 회원가입 (2026-10-06) — 이용자 · 현장과 따로 둔 입구. 가입 신청 뒤 확인이 끝나면 로그인된다.
import JoinScreen from "../../components/JoinScreen";

export default function OpsJoinPage() {
  return <JoinScreen area="ops" title="관제 회원가입" lead="관제 관리자가 가입하는 화면입니다." />;
}
