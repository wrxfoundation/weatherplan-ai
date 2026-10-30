// 현장 · 영업 회원가입 — 컨시어지 · 영업자 (2026-10-06). 센터 관제가 승인해야 로그인된다.
import AreaShell, { ShellLinks } from "../../components/AreaShell";
import JoinForm from "../../components/JoinForm";

export default function PartnerJoinPage() {
  return (
    <AreaShell
      area="partner"
      mode="join"
      title="컨시어지 · 영업자 가입 신청"
      lead="현장(방문 · 동행)과 영업(가입 상담) 담당자 입구입니다. 가입 신청 뒤 센터 관제가 승인하면 로그인할 수 있습니다."
      below={<ShellLinks links={[["/partner/login", "현장 · 영업 로그인"], ["/", "로그인 없이 데모 둘러보기"]]} />}
    >
      <JoinForm area="partner" />
    </AreaShell>
  );
}
