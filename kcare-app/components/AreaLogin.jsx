// 영역 로그인 화면 (현장 · 영업 /partner/login · 관제 /ops/login) — 이용자 로그인은 /login (테스트 계정 · 구글과 함께).
import { useRouter } from "next/router";
import AreaShell, { ShellLinks } from "./AreaShell";
import MemberLogin from "./MemberLogin";
import { AREAS, areaOfRole } from "../lib/centers";
import { logout, safeCallback, useAuth } from "../lib/auth";
import { ROLE_HOME, ROLE_LABEL, householdName } from "../lib/test-accounts";

export function SignedInCard({ area }) {
  const { user } = useAuth();
  const mine = areaOfRole(user.role);
  return (
    <div>
      <div className="text-[16px] font-bold text-navy">
        {user.name}
        {ROLE_LABEL[user.role] && <span className="ml-1.5 text-[13px] font-medium text-muted">{ROLE_LABEL[user.role]}</span>}
      </div>
      <div className="mt-0.5 text-[13px] text-muted">{householdName(user.household) || "소속 없음"}</div>
      {mine && mine !== area && (
        <p className="mt-2 rounded-xl bg-paper px-3.5 py-2 text-[12.5px] leading-[1.6] text-ink">
          지금 계정은 {AREAS[mine].label} 계정입니다. {AREAS[area].label} 계정으로 들어가려면 로그아웃하고 다시 로그인하세요.
        </p>
      )}
      <a href={ROLE_HOME[user.role] || "/"} className="btn-press btn-dark mt-4 block w-full rounded-xl bg-navy py-3.5 text-center text-[15px] font-bold text-white">
        {ROLE_LABEL[user.role] ? `${ROLE_LABEL[user.role]} 화면으로` : "계속하기"}
      </a>
      <button type="button" onClick={() => logout(AREAS[area].login)} className="btn-press mt-2 w-full rounded-xl border border-navy/15 py-3 text-[14px] font-bold text-muted">
        로그아웃
      </button>
    </div>
  );
}

export default function AreaLogin({ area, lead, hint }) {
  const router = useRouter();
  const auth = useAuth();
  const a = AREAS[area];
  const signedIn = auth.status === "authenticated" && auth.user;
  return (
    <AreaShell
      area={area}
      mode="login"
      title={`${a.label} 로그인`}
      lead={lead}
      below={<ShellLinks links={[[a.join, `${a.label} 회원가입`], ["/", "로그인 없이 데모 둘러보기"]]} />}
    >
      {signedIn ? (
        <SignedInCard area={area} />
      ) : (
        <>
          <MemberLogin area={area} callbackUrl={safeCallback(router.query.callbackUrl, "/")} defaultId={typeof router.query.id === "string" ? router.query.id : ""} />
          {hint && <p className="mt-3 text-[12px] leading-[1.7] text-muted">{hint}</p>}
        </>
      )}
    </AreaShell>
  );
}
