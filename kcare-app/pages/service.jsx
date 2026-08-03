import Head from "next/head";
import Logo from "../components/Logo";
import Link from "next/link";
import { useState } from "react";
import { FAQ, FAQ_NOTE, LANDING, LANDING_AI_QA } from "../lib/faq";
import { PRICING, BASE_BENEFITS, fmtWon } from "../lib/config";
import { WITHDRAWAL } from "../lib/lifecycle";
import { TRUST, FIT_FOR, PARTNERS, PARTNERS_NOTE } from "../lib/trust";
import { CHECKUP, CHECKUP_HEAD, CHECKUP_RULE, CHECKUP_CASE } from "../lib/checkup";
import Icon from "../components/icons";
import ScrollTop from "../components/ScrollTop";
import AiChat from "../components/AiChat";
import BgVideo from "../components/BgVideo";

// 서비스 랜딩 — 앱이 아니라 "서비스를 파는" 화면.
// pages/index.jsx 는 시연 허브(내부용)이고, 이 화면이 대외 얼굴이다.
//
// 구성 원칙: 자랑을 앞에 두지 않고 "무엇을 하지 않는가"를 위쪽에 둔다.
// 시니어 케어에서 가족이 가장 먼저 확인하려는 것은 능력이 아니라 경계다.
//
// 활자 크기: 이 화면만 기본보다 12% 크다 (0.5px 단위 반올림).
// 콘솔·앱은 정보 밀도가 우선이지만 이 화면은 처음 보는 사람이 읽는 곳이라
// 밀도보다 읽히는 것이 먼저다. 값이 13.5px 처럼 어중간한 이유가 이것이다.
// 아이콘 크기도 같은 비율로 키웠다 — 글자만 키우면 아이콘이 상대적으로 작아 보인다.

// tone="navy" 섹션은 배경에 미세 점 격자 패턴이 깔린다 (CSS 전용 · 추가 파일 없음).
// 자세한 것은 globals.css 의 .sec-navy 참고.
function Section({ id, eyebrow, title, desc, children, tone = "paper" }) {
  const navy = tone === "navy";
  const bg = navy ? "bg-navy text-white" : tone === "white" ? "bg-white" : "bg-paper";
  return (
    <section id={id} className={`${bg} ${navy ? "sec-navy " : ""}px-5 py-14 sm:py-20`}>
      <div className="mx-auto w-full max-w-[880px]">
        {eyebrow && (
          <div className={`font-num text-[12.5px] font-bold tracking-[.2em] ${tone === "navy" ? "text-gold-soft" : "text-gold"}`}>
            {eyebrow}
          </div>
        )}
        {title && (
          <h2 className={`mt-2.5 break-keep text-[28px] font-black leading-[1.35] sm:text-[34.5px] ${tone === "navy" ? "text-white" : "text-navy"}`}>
            {title}
          </h2>
        )}
        {desc && (
          <p className={`mt-3.5 max-w-[640px] break-keep text-[17px] leading-[1.85] ${tone === "navy" ? "text-white/70" : "text-muted"}`}>
            {desc}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-navy/[.1]">
      <h3>
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="btn-press flex w-full items-start gap-3 py-4 text-left"
        >
          <span className="mt-[3px] shrink-0 font-num text-[14.5px] font-bold text-gold">Q</span>
          <span className="min-w-0 flex-1 break-keep text-[17px] font-bold leading-[1.6] text-navy">{q}</span>
          <span className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
            <Icon name="chev" size={19} />
          </span>
        </button>
      </h3>
      <div className={`smooth-open ${open ? "is-open" : ""}`}>
        <div>
          <div className="flex gap-3 pb-5">
            <span className="mt-[2px] shrink-0 font-num text-[14.5px] font-bold text-navy/25">A</span>
            <p className="min-w-0 flex-1 whitespace-pre-line break-keep text-[15.5px] leading-[1.9] text-ink">{a}</p>
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

export default function ServiceLanding({ heroArt, heroVideo }) {
  const [openKey, setOpenKey] = useState(null);
  const [openGroup, setOpenGroup] = useState(null); // FAQ 그룹 — 전부 접어 둔다
  const monthly = fmtWon(PRICING.subscription.monthly);
  const entry = fmtWon(PRICING.entryFee.total);

  return (
    <>
      <Head>
        <title>K-CARE — 부모님은 늘 괜찮다고 하십니다</title>
        <meta
          name="description"
          content="정말 괜찮은지는 가 봐야 압니다. 매달 몸·마음·집 21가지를 같은 기준으로 살피는 시니어 케어 멤버십. 2인 1조 원칙."
        />
      </Head>

      <div className="min-h-dvh break-keep bg-paper">
        {/* ── 상단 바 ── */}
        <header className="sticky top-0 z-40 border-b border-navy/[.08] bg-paper/92 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[880px] items-center justify-between px-5 py-3.5">
            <Logo height={32} />
            {/* 좁은 화면에서는 구간 링크를 숨긴다 — 어차피 스크롤로 닿는 곳이고,
                로고와 CTA 까지 줄바꿈되면 상단바가 무너진다 (활자 12% 확대 이후 확인) */}
            <nav className="flex items-center gap-1.5">
              <a href="#checkup" className="btn-press hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[14.5px] font-bold text-muted sm:inline-block">
                점검 항목
              </a>
              <a href="#pricing" className="btn-press hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[14.5px] font-bold text-muted sm:inline-block">
                요금
              </a>
              <a href="#faq" className="btn-press hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[14.5px] font-bold text-muted md:inline-block">
                자주 묻는 질문
              </a>
              <Link
                href="/onboarding"
                className="btn-press btn-cta inline-flex items-center whitespace-nowrap rounded-xl px-4 py-2 text-[14.5px] font-bold text-white"
              >
                가입 상담
              </Link>
            </nav>
          </div>
        </header>

        {/* 랜드마크 — 이게 없으면 스크린리더에서 "본문으로 건너뛰기"가 안 되고
            섹션들이 전부 랜드마크 밖 콘텐츠로 잡힌다 (axe: region · landmark-one-main) */}
        <main>
          {/* ── 히어로 ── */}
        {/* public/hero/ 에 파일이 있으면 배경이 켜진다 (getStaticProps 에서 확인) */}
        <section className={`${heroArt ? "hero-bg " : ""}px-5 pb-14 pt-12 sm:pb-20 sm:pt-20`}>
          {heroVideo && (
            <BgVideo webm="/hero/loop.webm" mp4="/hero/loop.mp4" poster="/hero/home.webp" className="hero-vid" />
          )}
          <div className="mx-auto w-full max-w-[880px]">
            <div className="font-num text-[12.5px] font-bold tracking-[.2em] text-gold">{LANDING.eyebrow}</div>
            <h1 className="mt-4 text-[34.5px] font-black leading-[1.32] text-navy sm:text-[49.5px]">
              {LANDING.h1[0]}
              <br />
              {LANDING.h1[1]}
            </h1>
            <p className="mt-5 max-w-[560px] text-[18px] leading-[1.85] text-muted sm:text-[19px]">{LANDING.sub}</p>
            {/* 정체를 못 박는 한 줄 — 간병·요양으로 오해되면 가격 저항이 바로 생긴다 */}
            {/* 칩 배경은 거의 불투명해야 한다. bg-gold/[.08] 로 두면 뒤 영상이 그대로
                비쳐서 앰버 글자 대비가 4.0:1 까지 떨어진다 (기준 4.5). 종이색을 깔아
                배경과 무관하게 읽히게 한다 — 겉보기 색은 거의 그대로다. */}
            <p className="mt-4 inline-block rounded-full border border-gold/35 bg-[#F6F1E5]/95 px-4 py-1.5 text-[14.5px] font-bold text-amber">
              {LANDING.kicker}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="/onboarding"
                className="btn-press btn-cta inline-flex items-center rounded-xl px-6 py-3.5 text-[17px] font-bold text-white"
              >
                가입 상담 신청
              </Link>
              <a
                href="#pricing"
                className="btn-press rounded-xl border border-navy/20 bg-white/70 px-6 py-3.5 text-[17px] font-bold text-navy"
              >
                요금 보기
              </a>
            </div>

            {/* 근거 4칸 */}
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LANDING.proof.map((p) => (
                <div key={p.k} className="card-glass rounded-[14px] px-4 py-4">
                  <span className="mb-2 inline-block text-gold">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <div className="font-num text-[21.5px] font-bold text-navy">{p.k}</div>
                  <div className="mt-0.5 text-[13.5px] font-bold text-gold">{p.v}</div>
                  <div className="mt-2 text-[12.5px] leading-[1.65] text-muted">{p.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 하지 않는 것 (일부러 위쪽) ── */}
        <Section
          tone="navy"
          eyebrow="경계"
          title="저희가 하지 않는 것부터 말씀드립니다"
          desc="시니어 케어에서 가족이 가장 먼저 확인하려는 것은 무엇을 할 수 있는지가 아니라, 어디까지만 하는지입니다."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LANDING.nots.map((n) => (
              <div key={n.k} className="flex gap-3.5 rounded-[14px] border border-white/[.07] bg-white/[.045] px-5 py-4">
                <span className="mt-0.5 shrink-0 text-gold-soft">
                  <Icon name={n.icon} size={25} />
                </span>
                <div className="min-w-0">
                  <div className="text-[17px] font-bold text-white">{n.k}</div>
                  <div className="mt-2 text-[14.5px] leading-[1.8] text-white/65">{n.v}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 이용 흐름 ── */}
        <Section
          tone="white"
          eyebrow="이용 흐름"
          title="가입에서 매월 방문까지"
          desc="최초 방문 한 번으로 기기·물품·점검·앱 설치가 모두 끝납니다. 이후는 매월 같은 담당자가 옵니다."
        >
          <ol className="grid gap-3 sm:grid-cols-2">
            {LANDING.steps.map((s) => (
              <li key={s.n} className="flex gap-3.5 rounded-[14px] border border-navy/[.09] bg-paper/60 px-5 py-4">
                <span className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[14.5px] font-bold text-white">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gold">
                      <Icon name={s.icon} size={20} />
                    </span>
                    <span className="text-[17px] font-bold text-navy">{s.k}</span>
                  </div>
                  <div className="mt-1.5 text-[14.5px] leading-[1.8] text-muted">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Section>


        {/* ── 21항목 — "무엇을 보는가"의 실체 ── */}
        <Section
          id="checkup"
          eyebrow="점검 항목"
          title={CHECKUP_HEAD.title}
          desc={CHECKUP_HEAD.desc}
        >
          <p className="-mt-3 mb-6 max-w-[640px] break-keep rounded-[14px] border border-gold/25 bg-gold/[.07] px-5 py-4 text-[15.5px] leading-[1.9] text-ink">
            {CHECKUP_HEAD.key}
          </p>

          <div className="grid gap-3.5 lg:grid-cols-3">
            {CHECKUP.map((col) => {
              const c = col.tone === "green" ? "#1E7A5A" : col.tone === "gold" ? "#B08D57" : "#0A1F3C";
              return (
                <div key={col.axis} className="card-glass rounded-[16px] px-5 py-5">
                  <div className="flex items-baseline gap-2">
                    {/* 축 이름이 한 글자(몸·집)와 두 글자(마음)로 갈리므로 고정 원이 아니라 알약 */}
                    <span
                      className="inline-flex h-[27px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full pl-2.5 pr-3 text-[14.5px] font-bold text-white"
                      style={{ background: c }}
                    >
                      <Icon name={col.icon} size={17} />
                      {col.axis}
                    </span>
                    <span className="font-num text-[13.5px] font-bold text-muted">{col.items.length}가지</span>
                  </div>
                  <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted">{col.note}</p>
                  <ul className="mt-3 space-y-2.5">
                    {col.items.map((it) => (
                      <li key={it.k} className="border-t border-navy/[.07] pt-2.5">
                        <div className="text-[15px] font-bold text-navy">{it.k}</div>
                        <div className="mt-0.5 text-[13.5px] leading-[1.6] text-ink">{it.w}</div>
                        <div className="mt-1 text-[12.5px] leading-[1.6] text-muted">{it.why}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* 기록 원칙 — 진단하지 않는다는 선을 여기서 명확히 */}
          <div className="mt-4 rounded-[16px] border border-navy/[.1] bg-white/60 px-5 py-5">
            <div className="text-[17px] font-bold text-navy">기록하는 방식</div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKUP_RULE.map((r) => (
                <div key={r.k} className="rounded-[12px] border border-navy/[.07] bg-paper/50 px-4 py-3">
                  <div className="text-[14.5px] font-bold text-navy">{r.k}</div>
                  <div className="mt-1.5 text-[13.5px] leading-[1.75] text-muted">{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 사례 — 원칙보다 이 한 편이 설득력이 크다 */}
          <div className="mt-4 rounded-[16px] border border-navy/[.1] bg-white/60 px-5 py-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-[17px] font-bold text-navy">{CHECKUP_CASE.title}</h3>
              <span className="rounded-full border border-navy/15 px-2 py-0.5 text-[11px] font-bold text-muted">
                {CHECKUP_CASE.tag}
              </span>
            </div>
            <p className="mt-2.5 max-w-[680px] whitespace-pre-line break-keep text-[15px] leading-[1.95] text-ink">
              {CHECKUP_CASE.body}
            </p>
          </div>
        </Section>

        {/* ── 요금 ── */}
        <Section
          id="pricing"
          eyebrow="요금"
          title={`진입비 ${entry}, 이후 매월 ${monthly}`}
          desc="표기 금액은 부가세 포함입니다. 생활 요청은 건별 실비가 따로 붙습니다."
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="card-glass rounded-[16px] px-5 py-5">
              <div className="text-[13.5px] font-bold tracking-[.14em] text-gold">최초 1회</div>
              <div className="mt-1.5 font-num text-[30px] font-bold text-navy">{entry}</div>
              <ul className="mt-4 space-y-2">
                {BASE_BENEFITS.filter((b) => b.when === "최초").map((b) => (
                  <li key={b.name} className="flex gap-2 text-[14.5px] leading-[1.7]">
                    <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-gold" />
                    <span className="text-ink">
                      <b className="font-bold text-navy">{b.name}</b>
                      <span className="text-muted"> — {b.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-glass rounded-[16px] px-5 py-5">
              <div className="text-[13.5px] font-bold tracking-[.14em] text-gold">매월</div>
              <div className="mt-1.5 font-num text-[30px] font-bold text-navy">
                {monthly}
                <span className="ml-1 text-[14.5px] font-bold text-muted">/ 월</span>
              </div>
              <ul className="mt-4 space-y-2">
                {BASE_BENEFITS.filter((b) => b.when !== "최초").map((b) => (
                  <li key={b.name} className="flex gap-2 text-[14.5px] leading-[1.7]">
                    <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-navy/25" />
                    <span className="text-ink">
                      <b className="font-bold text-navy">{b.name}</b>
                      <span className="text-muted"> — {b.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 부부 가구 — 미확정이므로 확정값처럼 보이게 쓰지 않는다 */}
          <div className="mt-4 rounded-[16px] border border-gold/30 bg-gold/[.05] px-5 py-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-[17px] font-bold text-navy">두 분이 함께 계신 경우</h3>
              <span className="rounded-full border border-amber/35 px-2 py-0.5 text-[11px] font-bold text-amber">
                요금 확정 전
              </span>
            </div>
            <p className="mt-2.5 max-w-[640px] text-[14.5px] leading-[1.85] text-ink">
              방문은 가구 단위로 한 번 가고, 점검은 두 분이 각각 받으십니다. 몸 7가지와 마음
              7가지는 각자 보고, 집 7가지는 함께 봅니다. 웨어러블은 두 분께 각각, 케어박스는
              가구에 하나입니다.
            </p>
            <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">
              두 분 요금은 1인 요금에 2인차를 더하는 방식으로 설계 중입니다. 확정 전이라
              여기에 금액을 적지 않고, 상담에서 안내드립니다.
            </p>
          </div>

          {/* 해지 조건을 요금 바로 아래 — 숨기지 않는다 */}
          <div className="mt-4 rounded-[16px] border border-navy/[.1] bg-white/60 px-5 py-5">
            <div className="text-[17px] font-bold text-navy">해지와 환불</div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <caption className="sr-only">해지 시점별 환불 규정</caption>
                <thead>
                  <tr className="border-b-2 border-navy/15 text-[12.5px] font-bold text-muted">
                    <th scope="col" className="whitespace-nowrap py-2 pr-3">구분</th>
                    <th scope="col" className="whitespace-nowrap py-2 pr-3">시점</th>
                    <th scope="col" className="whitespace-nowrap py-2 pr-3">비용</th>
                    <th scope="col" className="py-2">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {WITHDRAWAL.rows.map((r) => (
                    <tr key={r.k} className="border-b border-navy/[.06]">
                      <th scope="row" className="whitespace-nowrap py-2.5 pr-3 text-[14.5px] font-bold text-navy">
                        {r.k}
                      </th>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-[13.5px] text-muted">{r.when}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-[13.5px] font-bold text-navy">{r.fee}</td>
                      <td className="py-2.5 text-[13.5px] leading-[1.6] text-muted">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[13.5px] leading-[1.8] text-muted">
              중도 해지에 위약금이 없습니다. 12개월은 요금 산정의 기준이지 묶어 두는 장치가 아닙니다.
            </p>
          </div>
        </Section>

        {/* ── 믿을 수 있는 K-CARE ── */}
        <Section
          id="trust"
          tone="navy"
          eyebrow="믿을 수 있는 이유"
          title="말보다 원칙으로 보여 드립니다"
          desc="인증서를 앞세우는 대신, 저희가 매일 지키는 운영 원칙을 그대로 공개합니다. 지키지 못하면 바로 드러나는 것들입니다."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {TRUST.map((t) => (
              <div
                key={t.no}
                className="flex gap-4 rounded-[14px] border border-white/[.07] bg-white/[.045] px-5 py-5"
              >
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <span className="font-num text-[13.5px] font-bold text-gold-soft">{t.no}</span>
                  <span className="text-gold-soft">
                    <Icon name={t.icon} size={25} />
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-bold text-white">{t.k}</h3>
                  <p className="mt-2 text-[14.5px] leading-[1.8] text-white/70">{t.v}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 이런 분께 권합니다 ── */}
        <Section
          eyebrow="권해 드리는 경우"
          title="이런 분께 권합니다"
          desc="아직 스스로 지내실 수 있을 때 시작하는 편이 낫습니다. 이미 돌봄이 필요한 상태라면 요양·간병 쪽이 맞습니다."
        >
          {/* 9칸 3x3 격자였는데 세로로 250px 을 먹어 아래 내용이 밀렸다.
              한 줄로 이어지는 칩으로 바꾼다 — 폭이 모자라면 다음 줄로 흐를 뿐
              칸이 격자로 갈라지지 않아 한 문장처럼 읽힌다.
              가로 스크롤 대신 흐르게 두는 이유: 스크롤 영역을 만들면 키보드로
              닿을 수 없는 스크롤 영역이 되어 별도 처리가 필요하고, 모바일에서
              옆으로 밀어야 나머지가 보인다는 것도 바로 알기 어렵다. */}
          <ul className="flex flex-wrap gap-x-2 gap-y-2.5">
            {FIT_FOR.map((f) => (
              <li
                key={f.k}
                className="inline-flex items-center gap-2 rounded-full border border-navy/[.09] bg-white/75 py-2 pl-3 pr-4"
              >
                <span className="shrink-0 text-gold">
                  <Icon name={f.icon} size={18} />
                </span>
                <span className="whitespace-nowrap text-[14.5px] font-bold leading-none text-navy">{f.k}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── 파트너사 — 확정된 곳이 없으면 통째로 안 그린다 (lib/trust.js) ── */}
        {PARTNERS.length > 0 && (
          <Section tone="white" eyebrow="파트너" title="함께하는 곳" desc={PARTNERS_NOTE}>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {PARTNERS.map((p) => (
                <li
                  key={p.name}
                  className="rounded-[14px] border border-navy/[.08] bg-paper px-4 py-4 text-center"
                >
                  <div className="text-[15.5px] font-bold text-navy">{p.name}</div>
                  {p.note && <div className="mt-1 text-[13.5px] text-muted">{p.note}</div>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── FAQ ── */}
        <Section
          id="faq"
          tone="white"
          eyebrow="자주 묻는 질문"
          title="가족들이 실제로 물어보시는 것들"
          desc={FAQ_NOTE}
        >
          {/* 39문항을 한 번에 펼쳐 두면 화면이 끝없이 길어져서 그 아래 내용이
              아예 안 읽힌다. 그룹 단위로 접고 전부 닫아 둔다 — 6줄로 줄어든다. */}
          <div className="border-t border-navy/[.1]">
            {FAQ.map((group, gi) => {
              const on = openGroup === gi;
              return (
                <div key={group.g} className="border-b border-navy/[.1]">
                  <h3>
                    <button
                      onClick={() => setOpenGroup((v) => (v === gi ? null : gi))}
                      aria-expanded={on}
                      className="btn-press flex min-h-[52px] w-full items-center gap-3 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1 text-[17px] font-bold text-navy">{group.g}</span>
                      <span className="shrink-0 font-num text-[13.5px] font-bold text-muted">
                        {group.items.length}
                      </span>
                      <span className={`shrink-0 text-muted transition-transform ${on ? "rotate-180" : ""}`}>
                        <Icon name="chev" size={19} />
                      </span>
                    </button>
                  </h3>
                  <div className={`smooth-open ${on ? "is-open" : ""}`}>
                    <div>
                      <div className="border-t border-navy/[.07] pb-2">
                        {group.items.map((it, ii) => {
                          const key = `${gi}-${ii}`;
                          return (
                            <FaqItem
                              key={it.q}
                              q={it.q}
                              a={it.a}
                              open={openKey === key}
                              onToggle={() => setOpenKey((v) => (v === key ? null : key))}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 마무리 ── */}
        <Section tone="navy" title="먼저 상담부터 받아 보세요" desc="가입을 권하기 전에 어르신 상태와 필요한 것부터 확인합니다. 상담에는 비용이 들지 않습니다.">
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/onboarding"
              className="btn-press rounded-xl bg-white px-6 py-3.5 text-[17px] font-bold text-navy"
            >
              가입 상담 신청
            </Link>
            <Link
              href="/"
              className="btn-press rounded-xl border border-white/25 px-6 py-3.5 text-[17px] font-bold text-white"
            >
              데모 화면 보기
            </Link>
          </div>
        </Section>

        </main>

        <footer className="border-t border-navy/[.08] px-5 py-8">
          <div className="mx-auto w-full max-w-[880px] text-[12.5px] leading-[1.9] text-muted">
            {/* 푸터는 조용해야 하지만, 로고 색이 남색(#0A1F3C)에서 브랜드 파랑
                (#24618A)으로 바뀌면서 같은 opacity-60 에서 대비가 4.23 → 2.59 로
                떨어졌다. 80 으로 올려 예전 무게(3.86)에 맞춘다. */}
            <Logo height={26} className="opacity-80" />
            <p className="mt-2">
              시니어 케어 프리미엄 멤버십 · 서울 강남구 · 송파구 · 서초구 운영 중
              <br />
              노인학대 신고 1577-1389 (노인보호전문기관) · 긴급 112 · 119
            </p>
            <p className="mt-2 text-muted/70">
              이 화면은 시연용 데모입니다. 표기된 금액과 지역은 확정 기준이며, 법무 검토가
              진행 중인 항목은 계약서에서 최종 확정됩니다.
            </p>
          </div>
        </footer>

        {/* 우측 하단 고정 — 위쪽에 맨 위로, 아래쪽에 AI 상담 */}
        <ScrollTop />
        <AiChat
          role="guardian"
          title="K-CARE 상담"
          subtitle="요금 · 이용 방법 · 해지 규정"
          qa={LANDING_AI_QA}
          context={
            `진입비 ${entry}(부가세 포함) · 월 ${monthly}. ` +
            "포함: 갤럭시 Fit3, 케어박스, 최초 21항목 점검, 앱 설치, 안심방문 월 1회, " +
            "병원 동행 연 1회, 보호자 알림·공유 캘린더, 월간 리포트, 24시간 긴급 접수. " +
            "점검 21가지 = 몸 7 · 마음 7 · 집 7. 마음 항목은 진단하지 않고 지난달 대비 변화만 기록. " +
            "2인 1조 예외 없음. 중도 해지 위약금 없음, 잔여분 일할 환급. 청약철회 14일. " +
            "운영 지역: 서울 강남·송파·서초, 마포·강서 확대 중. " +
            "부부 가구 요금은 설계 중이며 미확정. 의료행위·상시 위치추적·대리 인출은 하지 않음."
          }
          intro="요금, 이용 방법, 해지 규정을 물어보세요. 아래 질문을 눌러 보셔도 됩니다."
          note="가입 상담은 별도로 담당자가 연락드립니다. 이 창은 안내용입니다."
          evidence="공개된 요금표 · 점검 항목 · 해지 규정 범위 안에서만 답합니다."
        />
      </div>
    </>
  );
}
