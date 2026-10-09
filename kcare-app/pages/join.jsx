// 이용자 회원가입 — 어르신 · 보호자 (2026-10-06). 센터 관제가 승인하면 로그인된다.
import AreaShell, { ShellLinks } from "../components/AreaShell";
import JoinForm from "../components/JoinForm";

export default function JoinPage() {
  return (
    <AreaShell
      area="user"
      mode="join"
      title="어르신 · 보호자 회원가입"
      lead="담당 케어센터에서 받은 가입 코드로 가입 신청합니다. 센터가 확인하면 로그인할 수 있고, 기록은 가입한 센터 안에서만 오갑니다."
      below={<ShellLinks links={[["/login", "이미 아이디가 있어요 · 로그인"], ["/", "로그인 없이 데모 둘러보기"]]} />}
    >
      <JoinForm area="user" />
    </AreaShell>
  );
}
