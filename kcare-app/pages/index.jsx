import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useId, useState } from "react";
import Logo from "../components/Logo";
import Icon from "../components/icons";
import ScrollTop from "../components/ScrollTop";
import AiChat from "../components/AiChat";
import BgVideo from "../components/BgVideo";
import KeepTel from "../components/Tel";
import ExitTable from "../components/ExitTable";
import { useAuth } from "../lib/auth";
import { ROLE_HOME } from "../lib/roles";
import {
  META, SITE, TEL, NAV, LOGIN_LABEL, TAG_CARE,
  HERO, NOTS, FLOW, VISIT, FIRST, CHECK, PLACE, STORE, PRICE, TRUST, FIT, FAQ, CTA, FOOTER,
  AI_QA, AI_CONTEXT, AI_FALLBACK,
} from "../lib/landing";

// 서비스 소개 — 사이트의 맨 처음 화면(/). 2026-11-06 'K-CARE 랜딩페이지 수정 요청'으로 /service 에서 옮겨 왔다.
// 문구는 전부 lib/landing.js 에 있다 (요청서 4장 그대로). 이 파일은 그리는 일만 한다.
//
// 구성 원칙: 자랑을 앞에 두지 않고 "무엇을 하지 않는가"를 위쪽에 둔다.
// 시니어 케어에서 가족이 가장 먼저 확인하려는 것은 능력이 아니라 경계다.
//
// 요청서에서 정한 것:
//   · 요금제와 금액은 눌러야 보인다 (2-8) — 머리글 '요금' · 첫 화면 '요금 보기' · 요금 구역 '요금 보기' 가 같은 일을 한다.
//     주소가 #pricing 이면 열린 채로 시작한다.
//   · 문장이 둘 이상이면 문장마다 새 줄 (2-6) — Lines 가 나눈다. 줄 끝에 한 단어만 넘어가지 않게 하는 규칙은 globals.css 의 .lp.
//   · 해지 표는 700px 이하에서 세로로 쌓는다 (2-7) — globals.css 의 .lp-tb.
//   · 로그인한 사람은 이 화면 대신 자기 역할 홈으로 간다 (1장) — middleware.js 가 먼저 보내고, 여기서 한 번 더 본다.

// 문장 나누기 — 마침표 · 물음표 · 느낌표 뒤 공백에서 끊는다. 문구에 소수점이 없어서 이 규칙으로 충분하다.
const sentences = (text) =>
  (String(text).match(/[^.?!]+[.?!]+["')\]]*(?:\s+|$)|[^.?!]+$/g) || []).map((s) => s.trim()).filter(Boolean);

function Lines({ text }) {
  const parts = sentences(text);
  // 전화번호는 줄 끝에서 쪼개지지 않게 (components/Tel.jsx)
  if (parts.length < 2) return <KeepTel text={text} />;
  // 사이의 공백은 화면에서는 안 보이지만, 읽어 주는 프로그램과 복사한 글에서 문장이 붙지 않게 한다
  return parts.map((s, i) => (
    <span key={i} className="lp-s">
      {i > 0 ? " " : ""}
      <KeepTel text={s} />
    </span>
  ));
}

function CareTag({ className = "" }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full bg-navy/[.07] px-2.5 py-0.5 text-[13px] font-bold text-navy ${className}`}>
      {TAG_CARE}
    </span>
  );
}

// 구역 틀 — 제목과 한 줄 설명은 항상 보이고, 긴 본문만 '자세히 보기' 로 접는다.
// 접힌 본문은 inert 로 둔다 — 탭 초점이 보이지 않는 곳으로 들어가지 않고, 화면 안 찾기에도 걸리지 않는다.
function Section({ id, tone = "paper", eyebrow, title, lead, care = false, extra, collapsible = false, flush = false, children }) {
  const navy = tone === "navy";
  const bg = navy ? "sec-navy bg-navy text-white" : tone === "white" ? "bg-white" : "bg-paper";
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const hasBody = children != null && children !== false;
  return (
    <section id={id} className={`${bg} ${id ? "lp-anchor " : ""}px-5 ${flush ? "pb-14 sm:pb-20" : "py-14 sm:py-20"}`}>
      <div className="mx-auto w-full max-w-[1040px]">
        {eyebrow && <p className={`text-[13px] font-bold tracking-[.14em] ${navy ? "text-gold-soft" : "text-gold"}`}>{eyebrow}</p>}
        <h2 className={`mt-2.5 text-[28px] font-black leading-[1.35] sm:text-[34.5px] ${navy ? "text-white" : "text-navy"}`}>{title}</h2>
        {lead && (
          <p className={`lp-lead mt-3.5 max-w-[700px] text-[17px] leading-[1.8] ${navy ? "text-white/75" : "text-muted"}`}>
            <Lines text={lead} />
            {care && (
              <>
                {" "}
                <CareTag className="mt-1.5 align-middle" />
              </>
            )}
          </p>
        )}
        {extra}
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={bodyId}
            className={`btn-press mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-bold ${
              navy ? "border-white/30 text-white" : "border-navy/[.16] bg-white text-navy"
            }`}
          >
            {open ? "접기" : "자세히 보기"}
            <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
              <Icon name="chev" size={18} />
            </span>
          </button>
        )}
        {hasBody &&
          (collapsible ? (
            <div id={bodyId} className={`smooth-open ${open ? "is-open" : ""}`} {...(open ? {} : { inert: "" })}>
              <div>
                <div className="pt-6">{children}</div>
              </div>
            </div>
          ) : (
            <div className="mt-8">{children}</div>
          ))}
      </div>
    </section>
  );
}

// 번호가 붙은 단계 카드 (이용 흐름 · 방문 과정) — 넓으면 다섯 칸, 태블릿 두 칸, 휴대폰 한 칸
function Steps({ steps, tone = "paper" }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s, i) => (
        <li key={s.k} className={`lp-card rounded-[16px] px-[18px] py-5 ${tone === "paper" ? "bg-paper" : "bg-[#FBFAF6]"}`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[14px] font-bold text-white">
              {i + 1}
            </span>
            {s.icon && (
              <span className="text-gold">
                <Icon name={s.icon} size={20} />
              </span>
            )}
          </div>
          <h3 className="mt-3 text-[17px] font-extrabold leading-[1.45] text-navy">{s.k}</h3>
          <p className="mt-1.5 text-[14.5px] leading-[1.65] text-muted">
            <Lines text={s.d} />
          </p>
          {s.care && <CareTag className="mt-2" />}
        </li>
      ))}
    </ol>
  );
}

// 이름 · 내용 두 칸 줄 (첫 방문 · 거주 형태 · 점검 항목)
function Row({ k, v, stack = false }) {
  return (
    <div className={`grid gap-x-3 gap-y-0.5 border-t border-navy/10 py-3 text-[15px] leading-[1.65] ${stack ? "" : "sm:grid-cols-[150px_minmax(0,1fr)]"}`}>
      <b className="font-bold text-navy">{k}</b>
      <span className="lp-bal text-muted">{v}</span>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  const id = useId();
  return (
    <div className="border-t border-navy/10">
      <h4>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id} className="btn-press flex w-full items-start gap-3 py-3.5 text-left">
          <span className="mt-[2px] shrink-0 font-num text-[15px] font-extrabold text-gold">Q</span>
          <span className="lp-bal min-w-0 flex-1 text-[16px] font-bold leading-[1.6] text-navy">{q}</span>
          <span className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
            <Icon name="chev" size={19} />
          </span>
        </button>
      </h4>
      <div id={id} className={`smooth-open ${open ? "is-open" : ""}`} {...(open ? {} : { inert: "" })}>
        <div>
          <div className="flex flex-col gap-2 pb-4 text-[15.5px] leading-[1.75] text-muted sm:pl-[26px]">
            {a.map((para) => (
              <p key={para}>
                <Lines text={para} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 히어로 배경은 파일이 있으면 켜지고 없으면 꺼진다 — 빌드 시점에 확인한다.
// 런타임에 이미지 로드를 시도해 보는 방식은 실패할 때 콘솔에 404를 남기므로 쓰지 않는다.
// 쓰는 법: public/hero/ 에 파일을 넣고 다시 빌드하면 끝 (스위치를 만질 필요 없음).
//   home.webp            정지 배경 — 이것만 있어도 배경이 켜진다
//   loop.webm + loop.mp4 루프 영상 — 둘 다 있어야 켠다. 한쪽만 두면 그 코덱을
//                        못 읽는 브라우저에서 재생 경로가 통째로 없어진다.
export async function getStaticProps() {
  const fs = require("fs");
  const path = require("path");
  const at = (dir, f) => fs.existsSync(path.join(process.cwd(), "public", dir, f));
  const heroArt = at("hero", "home.webp");
  return {
    props: {
      heroArt,
      heroVideo: heroArt && at("hero", "loop.webm") && at("hero", "loop.mp4"),
    },
  };
}

// 가구 기록을 쓰지 않는 화면 — 서버가 본문까지 그려 보낸다 (pages/_app.jsx)
ServiceLanding.standalone = true;

export default function ServiceLanding({ heroArt, heroVideo }) {
  const router = useRouter();
  const auth = useAuth();
  const [priceOpen, setPriceOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null); // 자주 묻는 질문 묶음 — 전부 접어 둔다
  const [openKey, setOpenKey] = useState(null);
  const priceBodyId = useId();

  // 로그인한 사람은 자기 역할 홈으로 (미들웨어가 먼저 보낸다 — 여기는 화면 안에서 넘어온 경우의 안전망).
  // ?intro=1 은 로그인한 채로 소개를 봐야 하는 사람(파트너 화면의 '서비스 소개 열기')이다.
  const role = auth.user?.role;
  useEffect(() => {
    if (!router.isReady || "intro" in router.query) return;
    const home = ROLE_HOME[role];
    if (home) router.replace(home);
  }, [router, role]);

  // 요금 열고 그 자리로 부드럽게 이동 — 머리글 '요금' · 첫 화면 '요금 보기' 가 같이 쓴다 (주소 #refund 로 들어오면 표까지 간다).
  // 표(#refund)는 접힌 본문 안에 있어서 펼쳐지는 동안 자리가 내려간다 — 다 펼쳐진 뒤에 움직인다.
  const goPrice = useCallback((targetId = "pricing") => {
    setPriceOpen(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, targetId === "pricing" ? 60 : 300);
    try {
      window.history.replaceState(window.history.state, "", `#${targetId}`);
    } catch (_) {
      /* 주소를 못 바꿔도 이동은 된다 */
    }
  }, []);

  // 주소가 #pricing (또는 #refund) 이면 열린 상태로
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash;
      if (h === "#pricing") setPriceOpen(true);
      if (h === "#refund") goPrice("refund");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [goPrice]);

  const onPriceLink = (targetId) => (e) => {
    e.preventDefault();
    goPrice(targetId);
  };
  const togglePrice = () => {
    if (priceOpen) setPriceOpen(false);
    else goPrice("pricing");
  };

  const ogImage = `${SITE.origin}${META.ogImage}`;

  return (
    <>
      <Head>
        <title>{META.title}</title>
        <meta name="description" content={META.description} />
        <link rel="canonical" href={`${SITE.origin}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="K-CARE" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:url" content={`${SITE.origin}/`} />
        <meta property="og:title" content={META.ogTitle} />
        <meta property="og:description" content={META.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={META.ogTitle} />
        <meta name="twitter:description" content={META.description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div id="top" className="lp min-h-dvh bg-paper">
        {/* ── 머리글 — 메뉴 3개 + K-CARE 로그인. 좁은 화면에서는 메뉴를 숨긴다 (스크롤로 닿는 곳이다) ── */}
        <header className="sticky top-0 z-40 border-b border-navy/[.08] bg-[#F7F6F1]/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 px-5 py-3">
            <a href="#top" aria-label="K-CARE 처음으로" className="tap shrink-0">
              <Logo height={34} />
            </a>
            <nav aria-label="주요 메뉴" className="flex items-center gap-1 sm:gap-2.5">
              {NAV.map((n) => (
                <a
                  key={n.key}
                  href={n.href}
                  onClick={n.key === "pricing" ? onPriceLink("pricing") : undefined}
                  className="btn-press hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[15px] font-bold text-[#34404F] md:inline-flex"
                >
                  {n.label}
                </a>
              ))}
              <Link href="/login" className="btn-press btn-cta ml-1 inline-flex items-center whitespace-nowrap rounded-xl px-[18px] py-2 text-[15px] font-bold text-white">
                {LOGIN_LABEL}
              </Link>
            </nav>
          </div>
        </header>

        {/* 랜드마크 — 이게 없으면 스크린리더에서 "본문으로 건너뛰기"가 안 되고
            섹션들이 전부 랜드마크 밖 콘텐츠로 잡힌다 (axe: region · landmark-one-main) */}
        <main>
          {/* ── 첫 화면 ── public/hero/ 에 파일이 있으면 배경이 켜진다 (getStaticProps 에서 확인) */}
          <section className={`${heroArt ? "hero-bg " : ""}px-5 pb-14 pt-12 sm:pb-20 sm:pt-20`}>
            {heroVideo && <BgVideo webm="/hero/loop.webm" mp4="/hero/loop.mp4" poster="/hero/home.webp" className="hero-vid" />}
            <div className="mx-auto w-full max-w-[1040px]">
              <p className="text-[13px] font-bold tracking-[.14em] text-gold">{HERO.eyebrow}</p>
              <h1 className="mt-4 text-[34.5px] font-black leading-[1.32] text-navy sm:text-[49.5px]">
                {HERO.h1[0]}
                <br />
                {HERO.h1[1]}
              </h1>
              <p className="lp-lead mt-[18px] max-w-[640px] text-[17px] leading-[1.8] text-[#4A4A46] sm:text-[19px]">
                <Lines text={HERO.lead} />
              </p>
              {/* 정체를 못 박는 한 줄 — 간병·요양으로 오해되면 가격 저항이 바로 생긴다.
                  칩 배경은 거의 불투명해야 한다 — 옅게 두면 뒤 영상이 비쳐 앰버 글자 대비가 기준(4.5) 아래로 떨어진다.
                  휴대폰에서는 두 줄로 고정한다 (요청서 2-6). */}
              <p className="mt-4 inline-block rounded-2xl border border-gold/35 bg-[#F6F1E5]/95 px-4 py-[7px] text-[14.5px] font-bold text-amber sm:rounded-full sm:text-[15px]">
                <span className="block sm:inline">{HERO.pill[0]}</span> <span className="block sm:inline">{HERO.pill[1]}</span>
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className="btn-press btn-cta inline-flex items-center rounded-xl px-6 py-3 text-[17px] font-bold text-white">
                  {LOGIN_LABEL}
                </Link>
                <a
                  href="#pricing"
                  onClick={onPriceLink("pricing")}
                  className="btn-press inline-flex items-center rounded-xl border border-navy/[.14] bg-white/75 px-6 py-3 text-[17px] font-bold text-navy"
                >
                  {HERO.priceBtn}
                </a>
              </div>

              {/* 네 칸 — 금액은 넣지 않는다 (요청서 2-8) */}
              <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {HERO.cards.map((c) => (
                  <div key={c.k} className="card-glass rounded-[16px] p-4 sm:p-5">
                    <span className="inline-block text-gold">
                      <Icon name={c.icon} size={22} />
                    </span>
                    <b className="mt-3 block text-[20px] font-black leading-[1.3] text-navy sm:text-[23px]">{c.k}</b>
                    <span className="mt-1 block text-[14px] font-bold text-gold">{c.v}</span>
                    <span className="lp-bal mt-2 block text-[14px] leading-[1.6] text-ink">{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 경계 — 하지 않는 것 (일부러 위쪽) ── */}
          <Section tone="navy" eyebrow={NOTS.eyebrow} title={NOTS.title} lead={NOTS.lead}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {NOTS.items.map((n) => (
                <div key={n.k} className="lp-card flex gap-3.5 rounded-[16px] border border-white/10 bg-white/[.05] p-[22px]">
                  <span className="mt-0.5 shrink-0 text-gold-soft">
                    <Icon name={n.icon} size={25} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-extrabold leading-[1.45] text-white">{n.k}</h3>
                    <p className="mt-1.5 text-[15px] leading-[1.7] text-white/70">
                      <Lines text={n.v} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 이용 흐름 5단계 ── */}
          <Section tone="white" eyebrow={FLOW.eyebrow} title={FLOW.title} lead={FLOW.lead}>
            <Steps steps={FLOW.steps} />
          </Section>

          {/* ── 방문 한 번의 과정 5단계 ── */}
          <Section collapsible eyebrow={VISIT.eyebrow} title={VISIT.title} lead={VISIT.lead}>
            <Steps steps={VISIT.steps} tone="white" />
            <p className="lp-lead mt-5 max-w-[700px] text-[17px] leading-[1.8] text-muted">
              <Lines text={VISIT.note} />
            </p>
          </Section>

          {/* ── 첫 방문 — 집 안전 30가지 ── */}
          <Section collapsible tone="white" eyebrow={FIRST.eyebrow} title={FIRST.title} lead={FIRST.lead} care={FIRST.care}>
            <div className="border-b border-navy/10">
              {FIRST.rows.map((r) => (
                <Row key={r.k} k={r.k} v={r.v} />
              ))}
            </div>
            <p className="lp-lead mt-5 max-w-[700px] text-[17px] leading-[1.8] text-muted">{FIRST.note}</p>
          </Section>

          {/* ── 점검 항목 21가지 — 베타 안내 상자는 접지 않고 항상 보인다 ── */}
          <Section
            collapsible
            id="checkup"
            eyebrow={CHECK.eyebrow}
            title={CHECK.title}
            lead={CHECK.lead}
            care={CHECK.care}
            extra={
              CHECK.beta && (
                <p className="lp-bal mt-4 rounded-xl border border-gold/30 bg-white px-[18px] py-3.5 text-[15px] leading-[1.7] text-[#5E4A28]">
                  <b className="font-bold text-amber">{CHECK.beta.k}</b> {CHECK.beta.v}
                </p>
              )
            }
          >
            <p className="lp-lead max-w-[700px] text-[17px] leading-[1.8] text-muted">
              <Lines text={CHECK.intro} />
            </p>
            <div className="mt-6 grid gap-3.5 lg:grid-cols-3">
              {CHECK.axes.map((ax) => (
                <div key={ax.k} className="lp-card rounded-[16px] bg-[#FBFAF6] p-[22px] shadow-[0_10px_26px_-16px_rgba(10,31,60,.08)]">
                  <h3 className="text-[18px] font-extrabold leading-[1.45] text-navy">{ax.k}</h3>
                  <p className="mb-2.5 mt-1.5 text-[15px] leading-[1.7] text-muted">
                    <Lines text={ax.note} />
                  </p>
                  {ax.items.map(([k, v]) => (
                    <Row key={k} k={k} v={v} stack />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
              {CHECK.rules.map((r) => (
                <div key={r.k} className="lp-card rounded-[16px] bg-[#FBFAF6] p-[22px] shadow-[0_10px_26px_-16px_rgba(10,31,60,.08)]">
                  <h3 className="text-[18px] font-extrabold leading-[1.45] text-navy">{r.k}</h3>
                  <p className="mt-1.5 text-[15px] leading-[1.7] text-muted">{r.v}</p>
                </div>
              ))}
            </div>
            {/* 예시 — 원칙보다 이 한 편이 설득력이 크다. 실제 사례가 아니라는 표시를 위에 단다 */}
            <div className="lp-card mt-3.5 rounded-[16px] bg-[#FBFAF6] p-[22px] shadow-[0_10px_26px_-16px_rgba(10,31,60,.08)]">
              <p className="text-[13px] font-bold tracking-[.14em] text-gold">{CHECK.example.tag}</p>
              <h3 className="mt-1.5 text-[18px] font-extrabold leading-[1.45] text-navy">{CHECK.example.title}</h3>
              {CHECK.example.body.map((para) => (
                <p key={para} className="mt-1.5 text-[15px] leading-[1.7] text-muted">
                  <Lines text={para} />
                </p>
              ))}
            </div>
          </Section>

          {/* ── 거주 형태 ── */}
          <Section collapsible tone="white" eyebrow={PLACE.eyebrow} title={PLACE.title} lead={PLACE.lead}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {PLACE.cards.map((c) => (
                <div key={c.k} className="rounded-[16px] bg-paper p-[22px]">
                  <h3 className="mb-3 text-[18px] font-extrabold leading-[1.45] text-navy">{c.k}</h3>
                  {c.rows.map(([k, v]) => (
                    <Row key={k} k={k} v={v} />
                  ))}
                </div>
              ))}
            </div>
            <p className="lp-lead mt-5 max-w-[700px] text-[17px] leading-[1.8] text-muted">{PLACE.note}</p>
          </Section>

          {/* ── 스토어 — 본문만 (펼침 없음) ── */}
          <Section eyebrow={STORE.eyebrow} title={STORE.title} lead={STORE.lead} />

          {/* ── 요금 — 처음에는 제목과 '요금 보기' 버튼만. 금액은 눌러야 보인다 (요청서 2-8) ── */}
          <section id="pricing" className="lp-anchor bg-paper px-5 pb-14 sm:pb-20">
            <div className="mx-auto w-full max-w-[1040px]">
              <p className="text-[13px] font-bold tracking-[.14em] text-gold">{PRICE.eyebrow}</p>
              <h2 className="mt-2.5 text-[28px] font-black leading-[1.35] text-navy sm:text-[34.5px]">{PRICE.title}</h2>
              <div className="mt-7">
                <button
                  type="button"
                  onClick={togglePrice}
                  aria-expanded={priceOpen}
                  aria-controls={priceBodyId}
                  className="btn-press btn-cta inline-flex items-center rounded-xl px-6 py-3 text-[17px] font-bold text-white"
                >
                  {priceOpen ? PRICE.close : PRICE.open}
                </button>
              </div>

              <div id={priceBodyId} className={`smooth-open ${priceOpen ? "is-open" : ""}`} {...(priceOpen ? {} : { inert: "" })}>
                <div>
                  <p className="lp-lead mt-8 max-w-[700px] text-[17px] leading-[1.8] text-muted">
                    <Lines text={PRICE.lead} />
                  </p>

                  <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
                    {PRICE.plans.map((p) => (
                      <div
                        key={p.key}
                        className={`flex flex-col rounded-[20px] px-[22px] py-6 shadow-[0_14px_30px_-18px_rgba(10,31,60,.1)] sm:p-7 ${
                          p.dark ? "bg-navy text-white/85" : "bg-[#FBFAF6] text-ink"
                        }`}
                      >
                        <h3 className={`text-[15px] font-extrabold tracking-[.02em] ${p.dark ? "text-gold-soft" : "text-gold"}`}>{p.name}</h3>
                        <p className={`mt-1.5 text-[34px] font-black leading-[1.25] sm:text-[38px] ${p.dark ? "text-white" : "text-navy"}`}>
                          {p.price}
                          <small className="text-[16px] font-bold"> / 월</small>
                        </p>
                        <p className={`mt-1 text-[15px] font-bold ${p.dark ? "text-white/70" : "text-muted"}`}>{p.term}</p>
                        <ul className="mt-[18px] flex flex-1 flex-col gap-2">
                          {p.items.map((it) => (
                            <li key={it} className="lp-bal relative pl-3.5 text-[15.5px] leading-[1.65]">
                              <span aria-hidden className="absolute left-0 top-[.72em] h-[5px] w-[5px] rounded-full bg-gold" />
                              {it}
                            </li>
                          ))}
                        </ul>
                        {p.not && <p className="lp-bal mt-3.5 text-[14px] leading-[1.65] text-muted">{p.not}</p>}
                        <p
                          className={`mt-[18px] flex items-baseline justify-between gap-3 border-t pt-3.5 text-[15px] font-bold ${
                            p.dark ? "border-white/[.16] text-white" : "border-navy/10 text-navy"
                          }`}
                        >
                          <span>{PRICE.firstLabel}</span>
                          <b className="whitespace-nowrap text-[20px] font-black">{p.first}</b>
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-1 text-[15px] leading-[1.7] text-muted">
                    {PRICE.fine.map((para) => (
                      <p key={para} className="lp-bal">
                        <Lines text={para} />
                      </p>
                    ))}
                  </div>

                  {/* 해지 조건을 요금 바로 아래 — 숨기지 않는다. 700px 이하에서는 표를 풀어 세로로 쌓는다 (.lp-tb) */}
                  <div id="refund" className="lp-tb lp-anchor mt-3.5 rounded-[20px] bg-[#FBFAF6] px-[18px] py-5 shadow-[0_10px_26px_-16px_rgba(10,31,60,.08)] sm:p-6">
                    <h3 className="text-[20px] font-extrabold text-navy">{PRICE.refund.title}</h3>
                    <ExitTable />
                    <p className="mt-3 text-[14.5px] leading-[1.7] text-muted">{PRICE.refund.note}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 믿을 수 있는 이유 ── */}
          <Section collapsible id="trust" tone="navy" eyebrow={TRUST.eyebrow} title={TRUST.title} lead={TRUST.lead}>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {TRUST.items.map((t) => (
                <div key={t.no} className="lp-card flex gap-4 rounded-[16px] border border-white/10 bg-white/[.05] p-[22px]">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="font-num text-[13px] font-extrabold text-gold-soft">{t.no}</span>
                    <span className="text-gold-soft">
                      <Icon name={t.icon} size={25} />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-extrabold leading-[1.45] text-white">{t.k}</h3>
                    <p className="mt-1.5 text-[15px] leading-[1.7] text-white/70">
                      <Lines text={t.v} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 권해 드리는 경우 — 격자가 아니라 흐르는 칩 (폭이 모자라면 다음 줄로 넘어갈 뿐이다) ── */}
          <Section eyebrow={FIT.eyebrow} title={FIT.title} lead={FIT.lead}>
            <ul className="-mt-2 flex flex-wrap gap-2.5">
              {FIT.chips.map((f) => (
                <li key={f.k} className="inline-flex items-center gap-2 rounded-full bg-[#FBFAF6] py-[9px] pl-3 pr-4">
                  <span className="shrink-0 text-gold">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <span className="whitespace-nowrap text-[15px] font-bold leading-none text-navy">{f.k}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* ── 자주 묻는 질문 — 묶음 6개가 바로 보인다 (바깥 '자세히 보기' 없음 · 안내 문구 없음) ── */}
          <Section id="faq" tone="white" eyebrow={FAQ.eyebrow} title={FAQ.title}>
            <div className="-mt-1.5 border-t border-navy/10">
              {FAQ.groups.map((group, gi) => {
                const on = openGroup === gi;
                const gid = `faq-g${gi}`;
                return (
                  <div key={group.g} className="border-b border-navy/10">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenGroup((v) => (v === gi ? null : gi))}
                        aria-expanded={on}
                        aria-controls={gid}
                        className="btn-press flex w-full items-center gap-3 py-4 text-left"
                      >
                        <span className="min-w-0 flex-1 text-[18px] font-extrabold text-navy">{group.g}</span>
                        <span className="shrink-0 font-num text-[15px] font-bold text-muted">{group.items.length}</span>
                        <span className={`shrink-0 text-muted transition-transform ${on ? "rotate-180" : ""}`}>
                          <Icon name="chev" size={19} />
                        </span>
                      </button>
                    </h3>
                    <div id={gid} className={`smooth-open ${on ? "is-open" : ""}`} {...(on ? {} : { inert: "" })}>
                      <div>
                        {group.items.map((it, ii) => {
                          const key = `${gi}-${ii}`;
                          return <FaqItem key={it.q} q={it.q} a={it.a} open={openKey === key} onToggle={() => setOpenKey((v) => (v === key ? null : key))} />;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 마지막 안내 ── */}
          <Section tone="navy" title={CTA.title} lead={CTA.lead}>
            <div className="-mt-1 flex flex-wrap gap-3">
              <Link href="/consult" className="btn-press inline-flex items-center rounded-xl bg-white px-6 py-3 text-[17px] font-bold text-navy">
                {CTA.consult}
              </Link>
              <a href={TEL.href} className="btn-press inline-flex items-center whitespace-nowrap rounded-xl border border-white/30 px-6 py-3 text-[17px] font-bold text-white">
                {CTA.call}
              </a>
            </div>
          </Section>
        </main>

        <footer className="bg-paper px-5 py-9">
          <div className="mx-auto w-full max-w-[1040px] text-[14px] leading-[1.75] text-muted">
            <Logo height={30} className="mb-3" />
            <p>
              <b className="font-bold text-ink">{FOOTER.company}</b>
            </p>
            {FOOTER.lines.map((ln) => (
              <p key={ln}>
                <KeepTel text={ln} />
              </p>
            ))}
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {FOOTER.docs.map((d) => (
                <li key={d.label}>
                  {/* 약관 3종은 따로 여는 화면이다 (/terms · /refund · /privacy) */}
                  {d.href ? (
                    <Link href={d.href} className="tap underline underline-offset-2">
                      {d.label}
                    </Link>
                  ) : (
                    d.label
                  )}
                </li>
              ))}
            </ul>
            <p>
              <KeepTel text={FOOTER.report} />
            </p>
          </div>
        </footer>

        {/* 우측 하단 고정 — 위쪽에 맨 위로, 아래쪽에 AI 상담 */}
        <ScrollTop />
        <AiChat
          role="guardian"
          title="K-CARE 상담"
          subtitle="요금, 이용 방법, 해지 조건"
          qa={AI_QA}
          context={AI_CONTEXT}
          fallback={AI_FALLBACK}
          intro="요금, 이용 방법, 해지 조건을 물어보세요. 아래 질문을 눌러 보셔도 됩니다."
          note="가입 상담은 따로 담당자가 연락드립니다. 이 창은 안내용입니다."
          evidence="공개된 요금표, 점검 항목, 해지 조건 범위 안에서만 답합니다."
        />
      </div>
    </>
  );
}
