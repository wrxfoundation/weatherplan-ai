// 회원 가입 창 (2026-10-06) — 영역마다 같은 틀, 고를 수 있는 역할과 덧붙이는 칸만 다르다.
//   1) 가입 코드 — 센터 관제가 나눠 준 6자리. 코드가 센터(관제 1 · 2 · 3센터)를 정한다
//   2) 역할 — 이용자: 보호자 · 어르신 / 현장 · 영업: 컨시어지 · 영업자 / 관제: 관제 관리자
//   3) 이름 · 휴대폰(선택) · 아이디 · 비밀번호 · 안내 동의
// 이용자는 가입하면 바로 로그인해 자기 화면으로 간다. 현장 · 영업과 관제는 센터 관제 승인 뒤에 로그인된다.
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MEMBER_LOGIN, memberSignIn } from "../lib/auth";
import { AREAS, checkLoginId, checkPassword, normCode } from "../lib/centers";
import { ROLE_HOME, ROLE_LABEL } from "../lib/test-accounts";

const ROLE_DESC = {
  guardian: "부모님을 돌보는 가족 — 요청 · 결제 · 리포트",
  elder: "서비스를 받는 어르신 — 큰 글씨 화면",
  concierge: "방문 · 동행 · 해주세요 현장 담당",
  sales: "가입 상담 · 추천 코드",
  ops: "관제 센터 — SOS · 요청 · 회원 관리",
};
// 영역 · 역할마다 덧붙이는 칸 (profile)
const EXTRA = {
  guardian: [["rel", "어르신과의 관계", "예: 아들 · 딸 · 배우자"]],
  elder: [],
  concierge: [["region", "활동 지역", "예: 강남 · 서초"]],
  sales: [["org", "소속 · 지점", "예: 강남 지점"]],
  ops: [["org", "소속 · 직책", "예: 관제 1센터 · 관제사"]],
};
const SERVER_ERR = {
  "member-not-configured": "회원 가입은 서버 저장(Supabase) 연결 뒤에 켜집니다 (DEPLOY.md).",
  "schema-missing": "서버 표가 아직 준비되지 않았습니다 — 관리자가 supabase/schema.sql 을 다시 실행해야 합니다.",
  "too-many": "잠시 뒤 다시 시도해 주세요.",
};

function Field({ id, label, hint, error, children }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block text-[13px] font-bold text-navy">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-[12px] font-bold text-amber">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
const inputCls = "mt-1.5 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] text-ink";

export default function JoinForm({ area }) {
  const router = useRouter();
  const a = AREAS[area];
  const [code, setCode] = useState("");
  const [center, setCenter] = useState(null); // { id, name }
  const [checking, setChecking] = useState(false);
  const [role, setRole] = useState(a.roles.length === 1 ? a.roles[0] : "");
  const [f, setF] = useState({ name: "", phone: "", loginId: "", password: "", password2: "" });
  const [extra, setExtra] = useState({});
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { status, center }

  const checkCode = async (raw) => {
    const c = normCode(raw);
    setCode(c);
    setCenter(null);
    if (c.length !== 6) {
      setErrors((e) => ({ ...e, code: "가입 코드 6자리를 적어 주세요" }));
      return;
    }
    setChecking(true);
    try {
      const r = await fetch(`/api/join?code=${encodeURIComponent(c)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setCenter(j.center);
        setErrors((e) => ({ ...e, code: null }));
        setServerErr(null);
      } else if (r.status === 404) setErrors((e) => ({ ...e, code: "맞지 않는 가입 코드입니다 — 센터 관제에 다시 받아 주세요" }));
      else setServerErr(j.error || `http-${r.status}`);
    } catch (_) {
      setServerErr("network");
    }
    setChecking(false);
  };

  // 관제가 나눠 준 가입 링크(?code=)로 들어오면 코드를 바로 확인한다
  useEffect(() => {
    const q = typeof router.query.code === "string" ? router.query.code : "";
    if (q && !code) checkCode(q);
  }, [router.query.code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!MEMBER_LOGIN) {
    return <p className="rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-[1.7] text-ink">{SERVER_ERR["member-not-configured"]}</p>;
  }

  if (done) {
    const pending = done.status === "pending";
    return (
      <div role="status">
        <div className={`text-[18px] font-black ${pending ? "text-navy" : "text-green"}`}>{pending ? "가입 신청을 보냈습니다" : "가입했습니다"}</div>
        <p className="mt-2 text-[14px] leading-[1.75] text-ink">
          {done.center.name} · {ROLE_LABEL[role]} · 아이디 <b className="font-num">{f.loginId.trim().toLowerCase()}</b>
          <br />
          {pending
            ? `${done.center.name} 관제가 승인하면 ${a.label} 로그인에서 들어올 수 있습니다. 승인 전에는 로그인되지 않습니다.`
            : "로그인 중입니다…"}
        </p>
        {pending && (
          <Link href={a.login} className="btn-press mt-4 block w-full rounded-xl bg-navy py-3.5 text-center text-[15px] font-bold text-white">
            {a.label} 로그인으로
          </Link>
        )}
      </div>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (!center) e.code = "가입 코드를 먼저 확인해 주세요";
    if (!role) e.role = "역할을 골라 주세요";
    if (f.name.trim().length < 2) e.name = "이름을 2자 이상 적어 주세요";
    const idErr = checkLoginId(f.loginId);
    if (idErr) e.loginId = idErr;
    const pwErr = checkPassword(f.password, f.loginId.trim().toLowerCase());
    if (pwErr) e.password = pwErr;
    else if (f.password !== f.password2) e.password2 = "비밀번호가 서로 다릅니다";
    if (!agree) e.agree = "안내를 읽고 동의해 주세요";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setServerErr(null);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    const loginId = f.loginId.trim().toLowerCase();
    try {
      const r = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, area, role, name: f.name.trim(), phone: f.phone.trim(), loginId, password: f.password, profile: extra, agree }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j.fields) setErrors(j.fields);
        else setServerErr(j.error || `http-${r.status}`);
        setBusy(false);
        return;
      }
      setDone(j);
      if (j.status === "active") {
        const s = await memberSignIn({ id: loginId, password: f.password, area });
        if (s.ok) window.location.assign(ROLE_HOME[role] || "/");
        else window.location.assign(`${a.login}?id=${encodeURIComponent(loginId)}`);
      }
    } catch (_) {
      setServerErr("network");
      setBusy(false);
    }
  };

  const err = (k) => errors[k] || null;
  const described = (k) => (errors[k] ? `${k}-err` : undefined);

  return (
    <form onSubmit={submit} noValidate>
      {serverErr && (
        <p role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold leading-[1.6] text-amber">
          {SERVER_ERR[serverErr] || "가입하지 못했습니다. 잠시 뒤 다시 시도해 주세요."}
        </p>
      )}

      <Field id="code" label="가입 코드 (센터 관제에게 받은 6자리)" error={err("code")} hint={center ? null : "코드가 어느 관제 센터에 가입할지 정합니다"}>
        <div className="mt-1.5 flex gap-2">
          <input
            id="code"
            value={code}
            onChange={(e) => {
              setCode(normCode(e.target.value));
              setCenter(null);
            }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            aria-describedby={described("code")}
            className="min-w-0 flex-1 rounded-xl border border-navy/15 px-3.5 py-3 font-num text-[17px] tracking-[.2em] text-ink"
          />
          <button
            type="button"
            onClick={() => checkCode(code)}
            disabled={checking || code.length !== 6}
            className="btn-press shrink-0 rounded-xl border border-navy/20 px-4 text-[14px] font-bold text-navy disabled:opacity-50"
          >
            {checking ? "확인 중…" : "확인"}
          </button>
        </div>
      </Field>
      {center && (
        <p className="mt-2 rounded-xl bg-green/[.08] px-3.5 py-2 text-[13px] font-bold text-green" role="status">
          {center.name} 회원으로 가입합니다
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="text-[13px] font-bold text-navy">누구로 가입하나요?</legend>
        <div className={`mt-2 grid gap-2 ${a.roles.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {a.roles.map((r) => (
            <label key={r} className="relative cursor-pointer">
              <input
                type="radio"
                name="join-role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <span className="flex min-h-[64px] flex-col justify-center rounded-xl border border-navy/15 px-3 py-2 text-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <span className="text-[15px] font-bold">{ROLE_LABEL[r]}</span>
                <span className="mt-0.5 text-[12px] leading-[1.45] opacity-80">{ROLE_DESC[r]}</span>
              </span>
            </label>
          ))}
        </div>
        {err("role") && <p className="mt-1 text-[12px] font-bold text-amber">{err("role")}</p>}
      </fieldset>

      <Field id="j-name" label="이름" error={err("name")}>
        <input id="j-name" value={f.name} onChange={set("name")} autoComplete="name" maxLength={20} aria-describedby={described("name")} className={inputCls} />
      </Field>
      <Field id="j-phone" label="휴대폰 (선택)" hint="베타 테스트는 실제 번호 대신 가짜 번호를 적어도 됩니다">
        <input id="j-phone" value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" maxLength={20} className={`${inputCls} font-num`} />
      </Field>
      {(EXTRA[role] || []).map(([k, label, ph]) => (
        <Field key={k} id={`j-${k}`} label={`${label} (선택)`}>
          <input
            id={`j-${k}`}
            value={extra[k] || ""}
            onChange={(e) => setExtra({ ...extra, [k]: e.target.value })}
            placeholder={ph}
            maxLength={40}
            className={inputCls}
          />
        </Field>
      ))}
      <Field id="j-id" label="아이디" error={err("loginId")} hint="영문 소문자로 시작하는 4~20자 (소문자 · 숫자 · . _ -)">
        <input
          id="j-id"
          value={f.loginId}
          onChange={set("loginId")}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          aria-describedby={described("loginId")}
          className={`${inputCls} font-num`}
        />
      </Field>
      <Field id="j-pw" label="비밀번호" error={err("password")} hint="8자 이상 · 영문과 숫자를 함께">
        <input id="j-pw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" aria-describedby={described("password")} className={`${inputCls} font-num`} />
      </Field>
      <Field id="j-pw2" label="비밀번호 확인" error={err("password2")}>
        <input id="j-pw2" type="password" value={f.password2} onChange={set("password2")} autoComplete="new-password" aria-describedby={described("password2")} className={`${inputCls} font-num`} />
      </Field>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-[1.65] text-ink">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0" />
        <span>
          베타 테스트용 가입입니다. 실명 · 실제 연락처 같은 실제 개인정보는 넣지 않습니다. 비밀번호는 암호화해 저장하고, 기록은 가입한 센터 안에서만
          보입니다.
        </span>
      </label>
      {err("agree") && <p className="mt-1 text-[12px] font-bold text-amber">{err("agree")}</p>}

      <button type="submit" disabled={busy} className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white disabled:opacity-50">
        {busy ? "가입 중…" : a.approval ? "가입 신청 (관제 승인 뒤 사용)" : "가입하고 시작하기"}
      </button>
      {a.approval && <p className="mt-2 text-[12px] leading-[1.6] text-muted">{a.label} 계정은 가입한 센터의 관제가 승인해야 로그인할 수 있습니다.</p>}
    </form>
  );
}
