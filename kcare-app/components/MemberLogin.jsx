// 회원 아이디 로그인 (2026-10-06) — 영역 입구마다 같은 창. 영역이 다른 계정이면 맞는 입구를 알려 준다.
// 관제 입구에서는 센터 관제 테스트 계정(ops1 · ops2 · ops3 · 공용 테스트 비밀번호)도 들어온다.
import Link from "next/link";
import { useState } from "react";
import { getSession } from "next-auth/react";
import { MEMBER_LOGIN, memberSignIn } from "../lib/auth";
import { AREAS } from "../lib/centers";
import { ROLE_HOME } from "../lib/test-accounts";

const ERR = {
  CredentialsSignin: "아이디 또는 비밀번호가 맞지 않습니다.",
  Pending: "가입 승인 대기 중입니다. 센터 관제가 승인하면 들어올 수 있습니다.",
  Rejected: "가입이 거절된 아이디입니다. 센터 관제에 문의해 주세요.",
  Suspended: "사용이 정지된 아이디입니다. 센터 관제에 문의해 주세요.",
  ServerDown: "서버 저장에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
  NoCenter: "소속 센터를 찾지 못했습니다. 센터 관제에 문의해 주세요.",
  Locked: "비밀번호를 여러 번 틀려 잠시 잠겼습니다. 몇 분 뒤 다시 시도해 주세요.",
};

export default function MemberLogin({ area, callbackUrl = "/", idHint, defaultId = "" }) {
  const [id, setId] = useState(defaultId);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!MEMBER_LOGIN) {
    return (
      <p className="rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-[1.7] text-ink">
        회원 로그인은 서버 저장 연결 뒤에 켜집니다 — 배포 환경변수 NEXTAUTH_SECRET · SUPABASE_URL · SUPABASE_SECRET_KEY (DEPLOY.md).
      </p>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await memberSignIn({ id: id.trim(), password: pw, area });
    if (r.ok) {
      const s = await getSession();
      const role = s?.user?.role;
      window.location.assign(callbackUrl !== "/" ? callbackUrl : ROLE_HOME[role] || "/");
      return;
    }
    setError(r.error || "CredentialsSignin");
    setBusy(false);
  };

  const wrong = typeof error === "string" && error.startsWith("WrongArea") ? AREAS[error.split(":")[1]] || null : null;
  const message = wrong
    ? `이 아이디는 ${wrong.label}(${wrong.desc}) 계정입니다. 그쪽 입구에서 로그인해 주세요.`
    : error === "WrongArea"
      ? `이 아이디는 ${AREAS[area].label} 입구에서 쓸 수 없습니다.`
      : ERR[error] || (error ? "로그인하지 못했습니다. 다시 시도해 주세요." : null);

  return (
    <form onSubmit={submit} noValidate>
      {message && (
        <div role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold leading-[1.6] text-amber">
          {message}
          {wrong && (
            <Link href={`${wrong.login}?tab=member&id=${encodeURIComponent(id.trim())}`} className="ml-1 underline underline-offset-2">
              {wrong.label} 로그인으로
            </Link>
          )}
        </div>
      )}
      <label htmlFor={`m-${area}-id`} className="block text-[13px] font-bold text-navy">
        아이디
      </label>
      <input
        id={`m-${area}-id`}
        value={id}
        onChange={(e) => setId(e.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={idHint || "가입할 때 만든 아이디"}
        className="mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[15px] text-ink"
      />
      <label htmlFor={`m-${area}-pw`} className="mt-3 block text-[13px] font-bold text-navy">
        비밀번호
      </label>
      <input
        id={`m-${area}-pw`}
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
        className="mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[15px] text-ink"
      />
      <button
        type="submit"
        disabled={busy || !pw || !id.trim()}
        className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
      >
        {busy ? "확인 중…" : `${AREAS[area].label} 로그인`}
      </button>
    </form>
  );
}
