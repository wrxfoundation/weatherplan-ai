// 관제 로그인 (2026-10-06) — 관제 관리자 회원과 센터 관제 테스트 계정(ops1 · ops2 · ops3).
import AreaLogin from "../../components/AreaLogin";

export default function OpsLoginPage() {
  return (
    <AreaLogin
      area="ops"
      lead="관제 센터 관리자 입구입니다. 센터마다 따로 쓰는 공간(관제 1 · 2 · 3센터)으로 들어갑니다."
      hint="센터 관리자 아이디: ops1(관제 1센터) · ops2(관제 2센터) · ops3(관제 3센터) — 비밀번호는 테스터 공용 비밀번호와 다른 센터 관리자 비밀번호입니다 (담당자에게 받으세요). 예전 '테스트 가구 1'의 관제(test-ops)는 첫 로그인 화면에서 들어옵니다."
    />
  );
}
