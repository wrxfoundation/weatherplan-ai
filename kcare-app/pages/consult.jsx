// 가입 상담 신청 (2026-11-06 랜딩 요청 5-4) — 로그인 없이 이름 · 연락처를 남기면 관제 화면 '상담 신청'에 쌓인다.
// 예전 가입 상담 화면(/onboarding)은 연결을 끊고 이 주소로 옮겨 준다 (pages/onboarding.jsx · 301).
//
// 형식은 로그인 화면과 같다 (남색 배경 · 흰 카드). 세 칸 탭과 BETA 표시는 없다.
// 겹친 접수 방지 — 보내는 동안 단추를 잠그고, 접수되면 양식을 치운다. 서버도 같은 연락처의 새 접수를 한 줄로 묶는다.
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import AreaShell from "../components/AreaShell";
import { CONSULT_WHO, checkConsult, fmtPhone, isMobile } from "../lib/consults";
import { META, SITE, TEL } from "../lib/landing";

const WHO_DESC = { guardian: "부모님의 가족", elder: "이용하실 분" };
const FIELD_IDS = [["name", "c-name"], ["phone", "c-phone"], ["who", "c-who-first"], ["agree", "c-agree"]];
const inputCls = (bad) => `mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[16px] text-ink placeholder:text-[#70757D] ${bad ? "border-amber bg-[#FFFBF2]" : "border-navy/15"}`;

// 가구 기록을 쓰지 않는 화면 — 서버가 본문까지 그려 보낸다 (pages/_app.jsx)
ConsultPage.standalone = true;

export default function ConsultPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", who: "guardian", agree: false, website: "" });
  const [errors, setErrors] = useState({});
  const [fail, setFail] = useState(null); // closed | too-many
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // 보내는 중 — 화면이 다시 그려지기 전에 한 번 더 눌려도 두 번 보내지 않는다
  const sending = useRef(false);

  const put = (k, v) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };
  const focusFirst = (e) => {
    const hit = FIELD_IDS.find(([k]) => e[k]);
    const el = hit && document.getElementById(hit[1]);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    }
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (sending.current) return;
    setFail(null);
    const { fields } = checkConsult(f);
    setErrors(fields);
    if (Object.keys(fields).length) return focusFirst(fields);
    sending.current = true;
    setBusy(true);
    try {
      const ref = typeof router.query.ref === "string" ? router.query.ref : undefined;
      const r = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name, phone: f.phone, who: f.who, agree: f.agree, website: f.website, ref }),
      });
      if (r.ok) {
        setDone(true);
        window.scrollTo({ top: 0 });
        return;
      }
      const j = await r.json().catch(() => ({}));
      if (r.status === 400 && j.fields) {
        setErrors(j.fields);
        focusFirst(j.fields);
      } else setFail(r.status === 429 ? "too-many" : "closed");
    } catch (_) {
      setFail("closed");
    }
    sending.current = false;
    setBusy(false);
  };

  const missing = Object.values(errors).filter(Boolean).length;
  const head = (
    <>
      <meta name="description" content="이름과 연락처를 남겨 주시면 K-CARE 담당자가 연락드립니다. 상담에는 비용이 들지 않습니다." />
      <link rel="canonical" href={`${SITE.origin}/consult`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="K-CARE" />
      <meta property="og:url" content={`${SITE.origin}/consult`} />
      <meta property="og:title" content="가입 상담 신청 — K-CARE" />
      <meta property="og:description" content={META.description} />
      <meta property="og:image" content={`${SITE.origin}${META.ogImage}`} />
    </>
  );

  if (done) {
    return (
      <AreaShell bare title="상담 신청이 접수되었습니다" lead="담당자가 남겨 주신 연락처로 연락드립니다." head={head} below={null}>
        <Link href="/" className="btn-press btn-dark block w-full rounded-xl bg-navy py-3.5 text-center text-[15.5px] font-bold text-white">
          K-CARE 서비스 소개
        </Link>
      </AreaShell>
    );
  }

  return (
    <AreaShell bare title="가입 상담 신청" lead="이름과 연락처를 남겨 주시면 담당자가 연락드립니다." head={head}>
      <form onSubmit={submit} noValidate>
        {fail && (
          <p role="alert" className="mb-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[14px] font-bold leading-[1.6] text-amber">
            {fail === "too-many" ? (
              "잠시 뒤 다시 시도해 주세요."
            ) : (
              <>
                <span className="lp-s">지금은 온라인 접수가 어렵습니다.</span>{" "}
                <span className="lp-s">
                  <a href={TEL.href} className="inline-block whitespace-nowrap py-[3px] underline underline-offset-2">
                    고객센터 {TEL.label}
                  </a>
                  로 전화 주세요.
                </span>
              </>
            )}
          </p>
        )}

        <label htmlFor="c-name" className="block text-[15px] font-bold text-navy">
          이름
        </label>
        <input
          id="c-name"
          value={f.name}
          onChange={(e) => put("name", e.target.value)}
          autoComplete="name"
          maxLength={40}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "c-name-err" : undefined}
          className={inputCls(errors.name)}
        />
        {errors.name && <p id="c-name-err" className="mt-1 text-[14px] font-bold text-amber">{errors.name}</p>}

        <label htmlFor="c-phone" className="mt-4 block text-[15px] font-bold text-navy">
          연락처
        </label>
        <input
          id="c-phone"
          value={f.phone}
          onChange={(e) => put("phone", e.target.value)}
          // 다 적고 칸을 벗어나면 010-0000-0000 모양으로 맞춘다
          onBlur={() => isMobile(f.phone) && put("phone", fmtPhone(f.phone))}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          required
          placeholder="010-0000-0000"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "c-phone-err" : undefined}
          className={`${inputCls(errors.phone)} font-num`}
        />
        {errors.phone && <p id="c-phone-err" className="mt-1 text-[14px] font-bold text-amber">{errors.phone}</p>}

        <fieldset className="mt-4">
          <legend className="text-[15px] font-bold text-navy">누가 신청하시나요?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.keys(CONSULT_WHO).map((k, i) => (
              <label key={k} className="relative cursor-pointer">
                <input
                  id={i === 0 ? "c-who-first" : undefined}
                  type="radio"
                  name="consult-who"
                  value={k}
                  checked={f.who === k}
                  onChange={() => put("who", k)}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <span className="flex min-h-[64px] flex-col justify-center rounded-xl border border-navy/15 px-3 py-2 text-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                  <span className="text-[15px] font-bold">{CONSULT_WHO[k]}</span>
                  <span className="mt-0.5 text-[12.5px] leading-[1.45] opacity-80">{WHO_DESC[k]}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.who && <p className="mt-1 text-[14px] font-bold text-amber">{errors.who}</p>}
        </fieldset>

        {/* 사람은 못 보는 칸 — 자동 등록기가 채우면 서버가 받지 않는다 */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="c-website">이 칸은 비워 두세요</label>
          <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => put("website", e.target.value)} />
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-[14px] leading-[1.55] text-ink">
          <input
            id="c-agree"
            type="checkbox"
            checked={f.agree}
            onChange={(e) => put("agree", e.target.checked)}
            required
            aria-invalid={!!errors.agree}
            aria-describedby={errors.agree ? "c-agree-err c-agree-note" : "c-agree-note"}
            className="h-6 w-6 shrink-0"
          />
          <span className="lp-bal">상담을 위한 개인정보 수집에 동의합니다.</span>
        </label>
        {errors.agree && <p id="c-agree-err" className="mt-1 text-[14px] font-bold text-amber">{errors.agree}</p>}
        <p id="c-agree-note" className="lp-bal mt-1.5 text-[13px] leading-[1.6] text-muted">
          이름과 연락처는 상담 연락에만 쓰고, 상담이 끝나면 파기합니다.
        </p>

        {missing > 0 && (
          <p role="alert" className="mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3.5 py-2.5 text-[13.5px] font-bold text-amber">
            고쳐야 할 칸이 {missing}곳 있습니다. 노란 칸을 확인해 주세요
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-press btn-dark mt-[18px] w-full rounded-xl bg-navy py-3.5 text-[15.5px] font-bold text-white disabled:opacity-50">
          {busy ? "보내는 중…" : "상담 신청"}
        </button>
      </form>
    </AreaShell>
  );
}
