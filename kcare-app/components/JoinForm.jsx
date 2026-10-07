// 회원 가입 창 (2026-10-06) — 영역마다 같은 틀, 고를 수 있는 역할과 덧붙이는 칸만 다르다.
//   1) 가입 코드 — 센터 관제가 나눠 준 8자리. 코드가 센터(관제 1 · 2 · 3센터)를 정한다
//   2) 역할 — 이용자: 보호자 · 어르신 / 현장 · 영업: 컨시어지 · 영업자 / 관제: 관제 관리자
//   3) 이름 · 휴대폰(선택) · 아이디 · 비밀번호 · 안내 동의
// 어느 영역이든 가입한 센터의 관제가 승인해야 로그인된다 (2026-10-06 점검).
// 2026-10-06 UX 점검 — 코드는 8자리를 다 적거나 칸을 벗어나면 저절로 확인 · Enter 는 확인 단추와 같다.
// 가입을 누르면 틀린 첫 칸으로 옮겨 가고(화면 밖에 오류가 남지 않게), 몇 칸이 남았는지 단추 위에 적는다.
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { MEMBER_LOGIN, logout, memberSignIn, useAuth } from "../lib/auth";
import { AREAS, JOIN_CODE_RE, checkLoginId, checkPassword, normCode } from "../lib/centers";
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
  "member-not-configured": "회원 가입은 서버 저장 연결 뒤에 켜집니다 (DEPLOY.md).",
  "schema-missing": "서버 표가 아직 준비되지 않았습니다 — 관리자가 supabase/schema.sql 을 다시 실행해야 합니다.",
  "too-many": "잠시 뒤 다시 시도해 주세요.",
  "pending-full": "이 센터에 승인을 기다리는 가입이 많습니다. 센터 관제가 정리한 뒤 다시 신청해 주세요.",
};

// big — 어르신 · 보호자 입구는 글씨를 한 단계 키운다
function Field({ id, label, hint, error, big, children }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className={`block font-bold text-navy ${big ? "text-[15px]" : "text-[13px]"}`}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className={`mt-1 font-bold text-amber ${big ? "text-[14px]" : "text-[12px]"}`}>
          {error}
        </p>
      ) : hint ? (
        <p className={`mt-1 text-muted ${big ? "text-[13.5px]" : "text-[12px]"}`}>{hint}</p>
      ) : null}
    </div>
  );
}
const inputCls = (bad) => `mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[16px] text-ink ${bad ? "border-amber bg-[#FFFBF2]" : "border-navy/15"}`;
// 오류 칸 → 옮겨 갈 입력칸 (화면 순서)
const FIELD_ORDER = [["code", "code"], ["role", "join-role-first"], ["name", "j-name"], ["loginId", "j-id"], ["password", "j-pw"], ["password2", "j-pw2"], ["agree", "j-agree"]];
const CODE_CHANGED = "가입 코드가 바뀌었거나 맞지 않습니다 — 센터 관제에게 새 코드를 받아 다시 확인해 주세요";

export default function JoinForm({ area }) {
  const router = useRouter();
  const { user } = useAuth();
  const a = AREAS[area];
  const big = area === "user";
  const asked = useRef(""); // 마지막으로 확인한 코드 — 같은 코드를 두 번 묻지 않는다
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

  // 코드 확인 — 맞으면 센터를 돌려준다 (가입 단추가 이어서 쓴다)
  const checkCode = async (raw) => {
    const c = normCode(raw);
    setCode(c);
    setCenter(null);
    if (!JOIN_CODE_RE.test(c)) {
      const msg = "받으신 가입 코드를 적어 주세요 (6~8자리)";
      setErrors((e) => ({ ...e, code: msg }));
      return { center: null, error: msg };
    }
    asked.current = c;
    setChecking(true);
    let found = null;
    let msg = null;
    try {
      const r = await fetch(`/api/join?code=${encodeURIComponent(c)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        found = j.center;
        setCenter(j.center);
        setErrors((e) => ({ ...e, code: null }));
        setServerErr(null);
      } else if (r.status === 404) {
        msg = "맞지 않는 가입 코드입니다 — 센터 관제에게 다시 받아 주세요";
        setErrors((e) => ({ ...e, code: msg }));
      } else setServerErr(j.error || `http-${r.status}`);
    } catch (_) {
      setServerErr("network");
    }
    setChecking(false);
    return { center: found, error: msg };
  };
  const focusFirst = (e) => {
    const hit = FIELD_ORDER.find(([k]) => e[k]);
    if (!hit) return;
    const el = document.getElementById(hit[1]);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    }
  };

  // 다 적고 잠깐 멈추면 저절로 확인한다 — 예전 6자리 코드도 (8자리를 치는 중에 6자리에서 묻지 않게 잠깐 기다린다)
  useEffect(() => {
    if (center || checking || !JOIN_CODE_RE.test(code) || code === asked.current) return undefined;
    const t = setTimeout(() => checkCode(code), 700);
    return () => clearTimeout(t);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

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
            ? `${done.center.name}가 확인하면 ${a.label} 로그인에서 바로 들어올 수 있습니다. 승인 전에는 로그인되지 않습니다. 급하면 센터에 아이디를 알려 주세요.`
            : "로그인 중입니다…"}
        </p>
        {pending && (
          <Link href={`${a.login}?tab=member&id=${encodeURIComponent(f.loginId.trim().toLowerCase())}`} className="btn-press mt-4 block w-full rounded-xl bg-navy py-3.5 text-center text-[15px] font-bold text-white">
            {a.label} 로그인으로
          </Link>
        )}
      </div>
    );
  }

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };
  const validate = (c, codeErr) => {
    const e = {};
    if (!c) e.code = codeErr || "가입 코드를 확인해 주세요";
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
    setServerErr(null);
    // 코드를 적기만 하고 확인을 안 눌렀으면 여기서 확인한다
    const checked = center ? { center } : await checkCode(code);
    const e = validate(checked.center, checked.error);
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      focusFirst(e);
      return;
    }
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
        if (j.fields) {
          // 가입 코드가 그사이 바뀌었다(관제가 코드 바꾸기) — 확인된 센터를 지우고 코드 칸으로
          const fields = j.fields.code ? { ...j.fields, code: CODE_CHANGED } : j.fields;
          if (j.fields.code) setCenter(null);
          setErrors(fields);
          focusFirst(fields);
        } else setServerErr(j.error || `http-${r.status}`);
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
  const ids = { code: "code", name: "j-name", loginId: "j-id", password: "j-pw", password2: "j-pw2" };
  const described = (k) => (errors[k] ? `${ids[k] || k}-err` : undefined);
  const missing = Object.values(errors).filter(Boolean).length;

  return (
    <form onSubmit={submit} noValidate>
      {user && (
        <div role="note" className="mb-3 rounded-xl border border-navy/15 bg-paper px-3.5 py-2.5 text-[13px] leading-[1.6] text-ink">
          지금 <b className="text-navy">{user.name}</b>{ROLE_LABEL[user.role] ? `(${ROLE_LABEL[user.role]})` : ""}(으)로 로그인되어 있습니다. 새 아이디로 가입하려면 먼저 로그아웃하세요.
          <button type="button" onClick={() => logout(a.join + (code ? `?code=${code}` : ""))} className="tap ml-1 font-bold text-navy underline underline-offset-2">
            로그아웃
          </button>
        </div>
      )}
      {serverErr && (
        <p role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold leading-[1.6] text-amber">
          {SERVER_ERR[serverErr] || "가입하지 못했습니다. 잠시 뒤 다시 시도해 주세요."}
        </p>
      )}

      <Field id="code" big={big} label="가입 코드 (담당 센터에서 받은 코드)" error={err("code")} hint={center ? null : "다 적으면 저절로 확인합니다 — 코드가 어느 센터에 가입할지 정합니다"}>
        <div className="mt-1.5 flex gap-2">
          <input
            id="code"
            value={code}
            onChange={(e) => {
              const c = normCode(e.target.value);
              setCode(c);
              setCenter(null);
              if (errors.code) setErrors((x) => ({ ...x, code: null }));
            }}
            onBlur={() => {
              if (!center && !checking && JOIN_CODE_RE.test(code) && code !== asked.current) checkCode(code);
            }}
            onKeyDown={(e) => {
              // Enter 는 가입 단추가 아니라 '확인'
              if (e.key === "Enter") {
                e.preventDefault();
                if (JOIN_CODE_RE.test(code)) checkCode(code);
              }
            }}
            aria-invalid={!!errors.code}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            aria-describedby={described("code")}
            className={`min-w-0 flex-1 rounded-xl border px-3.5 py-3 font-num text-[17px] tracking-[.2em] text-ink ${errors.code ? "border-amber bg-[#FFFBF2]" : "border-navy/15"}`}
          />
          <button
            type="button"
            onClick={() => checkCode(code)}
            disabled={checking || !JOIN_CODE_RE.test(code)}
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
        <legend className={`font-bold text-navy ${big ? "text-[15px]" : "text-[13px]"}`}>누구로 가입하나요?</legend>
        <div className={`mt-2 grid gap-2 ${a.roles.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {a.roles.map((r, i) => (
            <label key={r} className="relative cursor-pointer">
              <input
                id={i === 0 ? "join-role-first" : undefined}
                type="radio"
                aria-describedby={errors.role ? "role-err" : undefined}
                name="join-role"
                value={r}
                checked={role === r}
                onChange={() => {
                  setRole(r);
                  if (errors.role) setErrors((x) => ({ ...x, role: null }));
                }}
                className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              <span className="flex min-h-[64px] flex-col justify-center rounded-xl border border-navy/15 px-3 py-2 text-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <span className="text-[15px] font-bold">{ROLE_LABEL[r]}</span>
                <span className="mt-0.5 text-[12px] leading-[1.45] opacity-80">{ROLE_DESC[r]}</span>
              </span>
            </label>
          ))}
        </div>
        {err("role") && <p id="role-err" className="mt-1 text-[12px] font-bold text-amber">{err("role")}</p>}
      </fieldset>

      <Field id="j-name" big={big} label="이름" error={err("name")}>
        <input id="j-name" value={f.name} onChange={set("name")} autoComplete="name" maxLength={20} aria-invalid={!!errors.name} aria-describedby={described("name")} className={inputCls(errors.name)} />
      </Field>
      <Field id="j-phone" big={big} label="휴대폰 (선택)" hint="베타 테스트는 실제 번호 대신 가짜 번호를 적어도 됩니다">
        <input id="j-phone" value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" maxLength={20} className={`${inputCls(false)} font-num`} />
      </Field>
      {(EXTRA[role] || []).map(([k, label, ph]) => (
        <Field key={k} id={`j-${k}`} big={big} label={`${label} (선택)`}>
          <input
            id={`j-${k}`}
            value={extra[k] || ""}
            onChange={(e) => setExtra({ ...extra, [k]: e.target.value })}
            placeholder={ph}
            maxLength={40}
            className={inputCls(false)}
          />
        </Field>
      ))}
      <Field id="j-id" big={big} label="아이디" error={err("loginId")} hint="영문 소문자로 시작하는 4~20자 (소문자 · 숫자 · . _ -)">
        <input
          id="j-id"
          value={f.loginId}
          onChange={set("loginId")}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          aria-invalid={!!errors.loginId}
          aria-describedby={described("loginId")}
          className={`${inputCls(errors.loginId)} font-num`}
        />
      </Field>
      <Field id="j-pw" big={big} label="비밀번호" error={err("password")} hint="8자 이상 · 영문과 숫자를 함께">
        <input id="j-pw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={described("password")} className={`${inputCls(errors.password)} font-num`} />
      </Field>
      <Field id="j-pw2" big={big} label="비밀번호 확인" error={err("password2")}>
        <input id="j-pw2" type="password" value={f.password2} onChange={set("password2")} autoComplete="new-password" aria-invalid={!!errors.password2} aria-describedby={described("password2")} className={`${inputCls(errors.password2)} font-num`} />
      </Field>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-[1.65] text-ink">
        <input
          id="j-agree"
          type="checkbox"
          checked={agree}
          onChange={(e) => {
            setAgree(e.target.checked);
            if (errors.agree) setErrors((x) => ({ ...x, agree: null }));
          }}
          aria-invalid={!!errors.agree}
          aria-describedby={errors.agree ? "agree-err" : undefined}
          className="mt-0.5 h-6 w-6 shrink-0"
        />
        <span>
          베타 테스트용 가입입니다. 실명 · 실제 연락처 같은 실제 개인정보는 넣지 않습니다. 비밀번호는 암호화해 저장하고, 기록은 가입한 센터 안에서만
          보입니다.
        </span>
      </label>
      {err("agree") && <p id="agree-err" className="mt-1 text-[12px] font-bold text-amber">{err("agree")}</p>}

      {missing > 0 && (
        <p role="alert" className="mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13px] font-bold text-amber">
          고쳐야 할 칸이 {missing}곳 있습니다 — 노란 칸을 확인해 주세요
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-press btn-dark mt-4 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white disabled:opacity-50">
        {busy ? "가입 중…" : a.approval ? "가입 신청 (관제 승인 뒤 사용)" : "가입하고 시작하기"}
      </button>
      {a.approval && <p className="mt-2 text-[12px] leading-[1.6] text-muted">{a.label} 계정은 가입한 센터의 관제가 승인해야 로그인할 수 있습니다.</p>}
    </form>
  );
}
