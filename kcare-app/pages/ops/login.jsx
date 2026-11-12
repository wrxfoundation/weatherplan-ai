// 관제 로그인 (2026-10-06) — 관제 관리자 회원과 센터 관리자 계정(ops1 · ops2 · ops3)이 들어온다.
// 센터 관리자 아이디 안내는 내부용 화면(/login/test)으로 옮겼다 — 이 화면은 고객 로그인의 탭에서 닿는 곳이다 (2026-11-06).
import AreaLogin from "../../components/AreaLogin";

export default function OpsLoginPage() {
  return <AreaLogin area="ops" lead="관제 관리자 아이디로 들어옵니다." />;
}
