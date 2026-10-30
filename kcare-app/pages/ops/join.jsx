// 관제 관리자 가입 신청 (2026-10-06) — 이용자 · 현장과 따로 둔 입구. 그 센터의 관제가 승인해야 로그인된다.
import AreaShell, { ShellLinks } from "../../components/AreaShell";
import JoinForm from "../../components/JoinForm";

export default function OpsJoinPage() {
  return (
    <AreaShell
      area="ops"
      mode="join"
      title="관제 관리자 가입 신청"
      lead="관제 센터 관리자 입구입니다. 그 센터의 가입 코드로 신청하고, 이미 일하고 있는 센터 관제가 승인하면 로그인할 수 있습니다."
      below={<ShellLinks links={[["/ops/login", "관제 로그인"], ["/", "로그인 없이 데모 둘러보기"]]} />}
    >
      <JoinForm area="ops" />
    </AreaShell>
  );
}
