// 내 정보 관리 (2026-11-18) — 가입한 회원이 자기 계정을 직접 다루는 화면. 서버는 pages/api/account.js.
//   · 내 정보        이름 · 아이디 · 구분 · 가입한 날 · 휴대폰 (보기만 — 고치는 것은 고객센터 · 센터 관제로)
//   · 비밀번호 바꾸기  지금 비밀번호를 확인하고 바꾼다. 바꾸면 모든 기기에서 다시 로그인한다 (이 화면도 로그아웃된다)
//   · 회원 탈퇴      무엇이 지워지고 무엇이 남는지 먼저 보여 주고, 비밀번호를 확인한 뒤 내 계정을 지운다
// 관제가 발급한 임시 비밀번호로 들어온 사람은 여기로 보내진다(?must=1 · pages/_app.jsx) — 새 비밀번호를 정해야 앱을 쓸 수 있다.
// 어르신 · 보호자 마이, 로그인 화면의 '로그인됨' 카드가 여기로 잇는다. 회사 개인정보 처리방침의 '내 정보 관리' 메뉴가 이 화면이다.
// 가구 기록을 쓰지 않는 화면이다 (standalone). 빨강은 위험 신호 전용이라 탈퇴 단추도 남색 · 호박색으로 둔다.
import Link from "next/link";
import { useEffect, useState } from "react";
import AreaShell, { ShellLinks } from "../components/AreaShell";
import KeepTel from "../components/Tel";
import { AREAS, areaOfRole, checkPassword, isFamilyRole } from "../lib/centers";
import { COMPANY } from "../lib/company";
import { logout, useAuth } from "../lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "../lib/test-accounts";

AccountPage.standalone = true;

const CS = `고객센터 ${COMPANY.tel}`;
const ERR = {
  "too-many": "비밀번호를 여러 번 틀렸습니다. 10분 뒤에 다시 해 주세요.",
  "login-required": "로그인이 만료됐습니다. 다시 로그인해 주세요.",
  "not-member": "가입한 회원 아이디에서만 할 수 있습니다.",
  "db-not-configured": "지금은 처리할 수 없습니다. 잠시 뒤 다시 해 주세요.",
  network: "서버에 연결하지 못했습니다. 연결을 확인하고 다시 해 주세요.",
};
const errText = (code, message) => ERR[code] || message || "처리하지 못했습니다. 잠시 뒤 다시 해 주세요.";
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "—");
const inputCls = (bad) => `mt-1.5 w-full rounded-xl border px-3.5 py-3 font-num text-[16px] text-ink ${bad ? "border-amber bg-[#FFFBF2]" : "border-navy/15"}`;

async function post(body) {
  try {
    const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
  } catch (_) {
    return { ok: false, status: 0, j: { error: "network" } };
  }
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block text-[15px] font-bold text-navy">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-[14px] font-bold text-amber">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[13.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// 비밀번호 바꾸기 — 바꾸면 이 화면도 로그아웃해 새 비밀번호로 다시 들어오게 한다
function PasswordForm({ account, must }) {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };
  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const e = {};
    if (!f.current) e.current = must ? "받으신 임시 비밀번호를 적어 주세요" : "지금 비밀번호를 적어 주세요";
    const bad = checkPassword(f.next, account.loginId);
    if (bad) e.next = bad;
    else if (f.next === f.current) e.next = "지금 비밀번호와 다른 비밀번호를 정해 주세요";
    else if (f.next !== f.again) e.again = "새 비밀번호가 서로 다릅니다";
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      document.getElementById(e.current ? "a-cur" : e.next ? "a-new" : "a-new2")?.focus();
      return;
    }
    setBusy(true);
    const r = await post({ action: "password", current: f.current, next: f.next });
    if (r.ok) {
      // 서버가 옛 로그인을 모두 끝냈다 — 이 기기도 나갔다가 새 비밀번호로 들어온다
      const a = AREAS[r.j.area] || AREAS[account.area] || AREAS.user;
      await logout(`${a.login}?id=${encodeURIComponent(r.j.loginId || account.loginId || "")}&pw=changed`, { force: true });
      return;
    }
    if (r.j.fields) {
      setErrors(r.j.fields);
      document.getElementById(r.j.fields.current ? "a-cur" : "a-new")?.focus();
    } else setMsg(errText(r.j.error, r.j.message));
    setBusy(false);
  };
  return (
    <form onSubmit={submit} noValidate aria-labelledby="pw-title">
      <h2 id="pw-title" className="text-[18px] font-extrabold text-navy">
        {must ? "새 비밀번호 정하기" : "비밀번호 바꾸기"}
      </h2>
      {msg && (
        <p role="alert" className="mt-2 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[14px] font-bold leading-[1.6] text-amber">
          {msg}
        </p>
      )}
      <Field id="a-cur" label={must ? "임시 비밀번호" : "지금 비밀번호"} error={errors.current}>
        <input id="a-cur" type="password" value={f.current} onChange={set("current")} autoComplete="current-password" aria-invalid={!!errors.current} aria-describedby={errors.current ? "a-cur-err" : undefined} className={inputCls(errors.current)} />
      </Field>
      <Field id="a-new" label="새 비밀번호" hint="8자 이상, 영문과 숫자를 함께" error={errors.next}>
        <input id="a-new" type="password" value={f.next} onChange={set("next")} autoComplete="new-password" aria-invalid={!!errors.next} aria-describedby={errors.next ? "a-new-err" : undefined} className={inputCls(errors.next)} />
      </Field>
      <Field id="a-new2" label="새 비밀번호 확인" error={errors.again}>
        <input id="a-new2" type="password" value={f.again} onChange={set("again")} autoComplete="new-password" aria-invalid={!!errors.again} aria-describedby={errors.again ? "a-new2-err" : undefined} className={inputCls(errors.again)} />
      </Field>
      <button type="submit" disabled={busy} className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[16px] font-bold text-white disabled:opacity-50">
        {busy ? "바꾸는 중…" : must ? "새 비밀번호로 정하기" : "비밀번호 바꾸기"}
      </button>
      <p className="lp-bal mt-2 text-[13.5px] leading-[1.6] text-muted">바꾸면 이 아이디로 로그인한 모든 기기에서 다시 로그인해야 합니다.</p>
    </form>
  );
}

// 회원 탈퇴 — 무엇이 지워지고 남는지 먼저 보여 준 뒤 비밀번호로 확인한다
function LeaveSection({ account }) {
  const family = isFamilyRole(account.role);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const lines = family
    ? [
        "아이디 · 이름 · 연락처 · 비밀번호가 바로 지워지고, 이 아이디로 다시 로그인할 수 없습니다. 되돌릴 수 없습니다.",
        "가족이 함께 쓰는 기록(일정 · 요청 · 리포트 등)은 남은 가족과 서비스 제공을 위해 그대로 남습니다. 결제 기록은 법이 정한 기간 동안 보관합니다.",
        `월 구독(서비스 이용계약)은 탈퇴로 해지되지 않습니다. 해지는 ${CS}로 따로 신청해 주세요.`,
      ]
    : [
        "아이디 · 이름 · 연락처 · 비밀번호가 바로 지워지고, 이 아이디로 다시 로그인할 수 없습니다. 되돌릴 수 없습니다.",
        "맡고 있던 담당 · 업무 기록은 센터에 그대로 남고, 담당은 센터 관제가 다시 지정합니다.",
      ];

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    if (!pw) {
      setError("비밀번호를 적어 주세요");
      document.getElementById("a-leave-pw")?.focus();
      return;
    }
    if (!agree) {
      setMsg("위 내용을 확인했다는 칸에 표시해 주세요.");
      return;
    }
    setBusy(true);
    const r = await post({ action: "delete", password: pw });
    if (r.ok) {
      const a = AREAS[r.j.area] || AREAS[account.area] || AREAS.user;
      await logout(`${a.login}?left=1`, { force: true, wipe: true });
      return;
    }
    if (r.j.fields?.password) {
      setError(r.j.fields.password);
      document.getElementById("a-leave-pw")?.focus();
    } else setMsg(errText(r.j.error, r.j.message));
    setBusy(false);
  };

  if (!open) {
    return (
      <div>
        <h2 className="text-[18px] font-extrabold text-navy">회원 탈퇴</h2>
        <p className="lp-bal mt-1.5 text-[14.5px] leading-[1.65] text-ink">내 계정을 지웁니다. 지워지는 것과 남는 것을 먼저 보여 드립니다.</p>
        <button type="button" onClick={() => setOpen(true)} className="btn-press mt-3 w-full rounded-xl border border-navy/20 py-3 text-[15px] font-bold text-navy">
          회원 탈퇴 안내 보기
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate aria-labelledby="leave-title">
      <h2 id="leave-title" className="text-[18px] font-extrabold text-navy">
        회원 탈퇴 전에 확인해 주세요
      </h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14.5px] leading-[1.7] text-ink marker:text-[#B08D57]">
        {lines.map((x) => (
          <li key={x}>
            <KeepTel text={x} />
          </li>
        ))}
      </ul>
      {msg && (
        <p role="alert" className="mt-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[14px] font-bold leading-[1.6] text-amber">
          {msg}
        </p>
      )}
      <Field id="a-leave-pw" label="비밀번호 확인" error={error}>
        <input
          id="a-leave-pw"
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="current-password"
          aria-invalid={!!error}
          aria-describedby={error ? "a-leave-pw-err" : undefined}
          className={inputCls(error)}
        />
      </Field>
      <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-[14.5px] leading-[1.55] text-ink">
        <input id="a-leave-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-6 w-6 shrink-0" />
        <span className="lp-bal">위 내용을 확인했고, 내 계정을 지우는 데 동의합니다.</span>
      </label>
      <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
        <button type="button" onClick={() => (setOpen(false), setPw(""), setAgree(false), setError(null), setMsg(null))} className="btn-press rounded-xl border border-navy/20 py-3.5 text-[15px] font-bold text-navy">
          그만두기
        </button>
        <button type="submit" disabled={busy} className="btn-press rounded-xl border border-amber/40 bg-[#FFF7E8] py-3.5 text-[15px] font-bold text-[#7A4B00] disabled:opacity-50">
          {busy ? "처리 중…" : "탈퇴하기"}
        </button>
      </div>
    </form>
  );
}

export default function AccountPage() {
  const auth = useAuth();
  const [data, setData] = useState(null); // { manage, account } | { error }
  const signedIn = auth.status === "authenticated" && auth.user;
  const uid = auth.user?.id || null;

  useEffect(() => {
    if (!uid) return undefined;
    let stop = false;
    (async () => {
      try {
        const r = await fetch("/api/account", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!stop) setData(r.ok ? j : { error: j.error || `http-${r.status}`, area: j.area || null });
      } catch (_) {
        if (!stop) setData({ error: "network" });
      }
    })();
    return () => {
      stop = true;
    };
  }, [uid]);

  const account = data?.account || null;
  const area = account?.area || areaOfRole(auth.user?.role) || "user";
  const must = !!account?.mustChange;
  const home = ROLE_HOME[auth.user?.role] || "/";
  // 임시 비밀번호 상태에서는 다른 화면으로 가는 링크를 두지 않는다 — 새 비밀번호를 정하는 것이 먼저다
  const below = <ShellLinks center links={signedIn && !must ? [[home, `${ROLE_LABEL[auth.user.role] || "내"} 화면으로`], ["/", "K-CARE 서비스 소개"]] : [["/", "K-CARE 서비스 소개"]]} />;

  return (
    <AreaShell bare area={area} mode="login" title="내 정보 관리" lead="내 계정의 비밀번호를 바꾸거나 탈퇴할 수 있습니다." below={below}>
      {auth.status === "loading" || (signedIn && !data) ? (
        <p className="text-[15px] text-muted" role="status">
          불러오는 중입니다…
        </p>
      ) : !signedIn ? (
        <div>
          <p className="text-[15px] leading-[1.7] text-ink">로그인한 뒤에 볼 수 있습니다.</p>
          <Link href="/login?callbackUrl=%2Faccount" className="btn-press btn-dark mt-4 block w-full rounded-xl bg-navy py-3.5 text-center text-[15px] font-bold text-white">
            로그인
          </Link>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-muted">
            컨시어지 · 파트너는{" "}
            <Link href="/partner/login?callbackUrl=%2Faccount" className="tap inline-block py-[3px] font-bold text-navy underline underline-offset-2">
              현장 · 영업 로그인
            </Link>
            , 관제는{" "}
            <Link href="/ops/login?callbackUrl=%2Faccount" className="tap inline-block py-[3px] font-bold text-navy underline underline-offset-2">
              관제 로그인
            </Link>
            에서 들어와 주세요.
          </p>
        </div>
      ) : data.error ? (
        <div role="alert">
          <p className="text-[15px] font-bold leading-[1.7] text-amber">
            {data.error === "password-changed" ? "비밀번호가 바뀌었습니다. 새 비밀번호로 다시 로그인해 주세요." : errText(data.error, "계정 정보를 불러오지 못했습니다. 다시 로그인해 주세요.")}
          </p>
          <button type="button" onClick={() => logout((AREAS[data.area] || AREAS[area]).login, { force: true })} className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white">
            다시 로그인
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {must && (
            <p role="alert" className="lp-bal rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-3 text-[15px] font-bold leading-[1.65] text-amber">
              임시 비밀번호로 로그인했습니다. 새 비밀번호를 정한 뒤에 앱을 쓸 수 있습니다.
            </p>
          )}

          <section aria-labelledby="me-title">
            <h2 id="me-title" className="text-[18px] font-extrabold text-navy">
              내 정보
            </h2>
            <dl className="mt-2 space-y-1.5 rounded-xl bg-paper px-3.5 py-3 text-[15px]">
              {[
                ["이름", account.name || "—"],
                ["아이디", account.loginId || "—"],
                ["구분", ROLE_LABEL[account.role] || "—"],
                ...(data.manage ? [["가입한 날", day(account.createdAt)], ["휴대폰", account.phone || "적지 않음"]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-[76px] shrink-0 text-muted">{k}</dt>
                  <dd className="min-w-0 break-all font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {data.manage ? (
              <p className="lp-bal mt-2 text-[13.5px] leading-[1.6] text-muted">
                <KeepTel text={isFamilyRole(account.role) ? `이름이나 연락처를 고치려면 ${CS}로 알려 주세요.` : "이름이나 연락처를 고치려면 센터 관제에 알려 주세요."} />
              </p>
            ) : (
              <p className="lp-bal mt-2 text-[13.5px] leading-[1.6] text-muted">테스트 계정 · 센터 관리자 계정은 가입한 아이디가 아니라, 비밀번호 바꾸기와 탈퇴를 여기서 하지 않습니다.</p>
            )}
          </section>

          {data.manage && (
            <section className="border-t border-navy/10 pt-5">
              <PasswordForm account={account} must={must} />
            </section>
          )}

          {data.manage && !must && (
            <section className="border-t border-navy/10 pt-5">
              <LeaveSection account={account} />
            </section>
          )}
        </div>
      )}
    </AreaShell>
  );
}
