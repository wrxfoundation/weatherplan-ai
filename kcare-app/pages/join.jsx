// 이용자 회원가입 — 어르신 · 보호자 (2026-10-06). 가입하면 바로 자기 화면으로 간다.
import AreaShell, { ShellLinks } from "../components/AreaShell";
import JoinForm from "../components/JoinForm";

export default function JoinPage() {
  return (
    <AreaShell
      area="user"
      mode="join"
      title="어르신 · 보호자 회원가입"
      lead="센터 관제에게 받은 가입 코드로 가입합니다. 가입한 센터 안에서만 기록이 오가고, 다른 센터와는 섞이지 않습니다."
      below={<ShellLinks links={[["/login", "이미 아이디가 있어요 · 로그인"], ["/", "로그인 없이 데모 둘러보기"]]} />}
    >
      <JoinForm area="user" />
    </AreaShell>
  );
}
