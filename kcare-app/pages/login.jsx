// 이용자 로그인 — 어르신 · 보호자가 가입한 아이디로 들어온다.
//
// 2026-11-06 랜딩 요청 5-2 — 고객이 보는 화면이다:
//   · 아이디 · 비밀번호만 둔다. '가입한 아이디 / 베타 테스트 계정' 탭은 없앴다 — 테스트 계정 · 구글(시뮬레이션)
//     로그인은 내부 주소 /login/test 로 옮겼다 (pages/login/test.jsx)
//   · '로그인 없이 데모 둘러보기' · 서버 저장 연결 표시 · '베타' 문구를 뺐다
//   · 아래 링크는 'K-CARE 서비스 소개'(/) 하나
// 로그인돼 있으면 누구로 들어와 있는지 · 어디에 저장되는지 · 계속하기 · 로그아웃을 보여 준다 (화면 위 '계정' 링크가 여기로 온다).
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AreaShell from "../components/AreaShell";
import { JoinPrompt } from "../components/AreaLogin";
import MemberLogin from "../components/MemberLogin";
import { AREAS, areaOfRole } from "../lib/centers";
import { PROVIDER_LABEL, logout, safeCallback, useAuth } from "../lib/auth";
import { storageText, useSync } from "../lib/state";
import { ROLE_HOME, ROLE_LABEL, householdName } from "../lib/test-accounts";

// NextAuth 가 돌려주는 오류 코드 → 사람이 읽는 말
const ERRORS = {
  CredentialsSignin: "아이디 또는 비밀번호가 맞지 않습니다.",
  NotAllowed: "허용된 계정이 아닙니다. 고객센터로 문의해 주세요.",
  AccessDenied: "허용된 계정이 아닙니다. 고객센터로 문의해 주세요.",
  Callback: "로그인을 마치지 못했습니다. 다시 시도해 주세요.",
};

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const sync = useSync();
  const callbackUrl = safeCallback(router.query.callbackUrl, "/");
  const [error, setError] = useState(null);
  const signedIn = auth.status === "authenticated" && auth.user;

  useEffect(() => {
    if (typeof router.query.error === "string") setError(router.query.error);
  }, [router.query.error]);

  // 로그인 뒤 갈 곳 — 요청받은 화면이 있으면 거기, 없으면 역할 화면
  const destination = (role) => (callbackUrl !== "/" ? callbackUrl : ROLE_HOME[role] || "/");

  return (
    <AreaShell area="user" mode="login" title="K-CARE 로그인" lead="가족이 같은 기록을 함께 봅니다.">
      {signedIn ? (
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-navy text-[17px] font-bold text-white">
              {(ROLE_LABEL[auth.user.role] || auth.user.name || auth.user.email || "?").slice(0, 1)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-bold text-navy">
                {auth.user.name || "계정"}
                {ROLE_LABEL[auth.user.role] && <span className="ml-1.5 text-[13px] font-medium text-muted">{ROLE_LABEL[auth.user.role]}</span>}
              </div>
              {auth.user.email && <div className="truncate font-num text-[13px] text-muted">{auth.user.email}</div>}
            </div>
          </div>
          <dl className="mt-4 space-y-1.5 rounded-xl bg-paper px-3.5 py-3 text-[13px]">
            <div className="flex gap-3">
              <dt className="w-[52px] shrink-0 text-muted">로그인</dt>
              <dd className="font-bold text-ink">{PROVIDER_LABEL[auth.user.provider] || "—"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-[52px] shrink-0 text-muted">소속</dt>
              <dd className="font-bold text-ink">{householdName(auth.user.household) || "없음"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-[52px] shrink-0 text-muted">저장</dt>
              <dd className={`font-bold ${sync.mode === "server" && sync.status !== "error" ? "text-green" : "text-amber"}`}>{storageText(sync)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => router.push(destination(auth.user.role))}
            className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white"
          >
            {callbackUrl === "/" && ROLE_LABEL[auth.user.role] ? `${ROLE_LABEL[auth.user.role]} 화면으로 계속하기` : "계속하기"}
          </button>
          <button
            type="button"
            onClick={async () => {
              // 모아 둔 것을 다 보낸 뒤에 나간다 — 로그아웃하면 세션이 끊겨 더는 못 보낸다
              await sync.flush?.();
              // 가입한 회원 · 센터 관리자는 자기 영역 입구로, 테스트 계정은 내부 로그인 주소로
              const member = ["member", "center"].includes(auth.user.provider);
              logout(member ? AREAS[areaOfRole(auth.user.role)]?.login || "/login" : "/login/test");
            }}
            className="btn-press mt-2 w-full rounded-xl border border-navy/15 py-3 text-[14px] font-bold text-muted"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div>
          {error && (
            <p role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold leading-[1.6] text-amber">
              {ERRORS[error] || "로그인하지 못했습니다. 다시 시도해 주세요."}
            </p>
          )}
          <MemberLogin area="user" callbackUrl={callbackUrl} defaultId={typeof router.query.id === "string" ? router.query.id : ""} />
          <JoinPrompt note="아직 아이디가 없으면 담당 파트너에게 받은 가입 코드로 가입하세요." href="/join" label="회원가입 (가입 코드 필요)" />
        </div>
      )}
    </AreaShell>
  );
}
