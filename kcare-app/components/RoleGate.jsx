// 테스트 가구에서 다른 역할의 화면으로 들어왔을 때 (2026-10-02 코드 점검).
// 모든 테스트 계정이 가구 기록 하나를 같이 쓰므로, 보호자 계정이 관제 화면에서 'SOS 해제'를 누르면
// 관제 · 컨시어지 · 어르신 폰에서 SOS 가 같이 사라진다. 역할마다 자기 화면만 쓴다 — 테스트 안내서의 '폰 하나에 계정 하나'.
// 로그인하지 않은 데모는 지금처럼 모든 화면을 연다.
import Head from "next/head";
import Link from "next/link";
import { logout, useAuth } from "../lib/auth";
import { AREAS, areaOfRole } from "../lib/centers";
import { ROLE_HOME, ROLE_LABEL, householdName } from "../lib/test-accounts";

export default function RoleGate({ role, title, children }) {
  const { user } = useAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!user?.household || !user.role || roles.includes(user.role)) return children;
  const need = roles.map((r) => ROLE_LABEL[r] || r).join(" · ");
  const home = ROLE_HOME[user.role] || "/";
  // 그 화면 역할의 로그인 입구 — 이용자 · 현장 · 영업 · 관제가 입구가 다르다 (2026-10-06)
  const needArea = AREAS[areaOfRole(roles[0])];
  const loginAt = user.provider === "member" || user.center ? needArea?.login || "/login" : "/login";
  return (
    <>
      <Head>
        <title>{title} — K-CARE</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-center shadow-[0_18px_44px_-24px_rgba(10,31,60,.4)]">
          <div className="text-[12px] font-bold tracking-[.08em] text-muted">{householdName(user.household)}</div>
          <h1 className="mt-1 text-[20px] font-black text-navy">{title} 화면은 {need} 계정으로 봅니다</h1>
          <p className="mt-2 text-[14px] leading-[1.7] text-ink">
            지금은 <b>{ROLE_LABEL[user.role] || user.role}</b> 계정({user.name})으로 들어와 있습니다. 같은 가구 · 센터의 계정은 기록을 함께
            쓰므로, 역할마다 자기 화면만 씁니다 (권한은 관제가 정합니다).
          </p>
          <Link href={home} className="btn-press mt-5 block w-full rounded-xl bg-navy py-3.5 text-[16px] font-bold text-white">
            내 화면으로 ({ROLE_LABEL[user.role] || user.role})
          </Link>
          <button
            type="button"
            onClick={() => logout(`${loginAt}?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`)}
            className="btn-press mt-2 w-full rounded-xl border border-navy/20 py-3 text-[14px] font-bold text-navy"
          >
            로그아웃하고 {need} 계정으로 들어가기
          </button>
        </div>
      </main>
    </>
  );
}
