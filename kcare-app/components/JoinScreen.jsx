// 회원가입 화면 (이용자 /join · 현장 · 영업 /partner/join · 관제 /ops/join) — 틀과 가입 창을 묶는다.
// 가입 신청을 보내면 화면 제목이 '가입 신청이 접수되었습니다'로 바뀐다 (2026-11-06 랜딩 요청 4장 /join).
import { useState } from "react";
import AreaShell from "./AreaShell";
import JoinForm from "./JoinForm";

export default function JoinScreen({ area, title, lead }) {
  const [sent, setSent] = useState(false);
  return (
    <AreaShell
      area={area}
      mode="join"
      title={sent ? "가입 신청이 접수되었습니다" : title}
      lead={sent ? "확인이 끝나면 로그인하실 수 있습니다." : lead}
      // 접수 뒤에는 카드 안에 '로그인 화면으로' · 'K-CARE 서비스 소개' 단추가 있다 — 아래 링크를 겹쳐 두지 않는다
      below={sent ? null : undefined}
    >
      <JoinForm area={area} onSent={() => setSent(true)} />
    </AreaShell>
  );
}
