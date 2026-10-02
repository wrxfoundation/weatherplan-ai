import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Icon from "../../components/icons";
import { GLOSSARY, sha256Hex } from "../../lib/glossary";
import { ALL_ITEMS, RESULT_TONE, STATE_ORDER, VISIT_GRADES, VISIT_REPORT, countStates } from "../../lib/visit-report";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { STAGE_LABEL, visitReportOf } from "../../lib/live-household";
import { LIVE_ELDER } from "../../lib/ops-health";
import {
  AI_REPORT,
  CARE_OUTCOMES,
  CARE_TEAM,
  CRM_TIMELINE,
  EXEC_BRIEF,
  LIFECYCLE_STAGES,
  NPS_LOOP,
  PEOPLE_KPIS,
  SEED_REPORTS,
  TRUST_METRICS,
  VITALS,
  WEEKLY,
} from "../../lib/mock";

// A4 인쇄 리포트 — 브라우저 인쇄(PDF 저장)로 출력. @page A4 · 14mm 여백 (globals.css).
// 화면에서는 종이 시트 미리보기, 인쇄 시 시트만 남는다. 진단어 없음 · 검수 원칙 문구 포함.

const NAVY = "#0A1F3C";
// 작은 글자용 금색 — 브랜드 골드(#B08D57)는 흰 배경에서 3.09:1 이라 본문 기준(4.5:1)에
// 못 미친다. 큰 글자·장식에는 그대로 쓰고, 12px 이하 라벨은 이 색으로 쓴다 (5.75:1).
// 리포트는 고객에게 인쇄되어 나가는 문서라 여기서만큼은 읽히는 쪽이 먼저다.
const GOLD_TEXT = "#8A5D12";

// 문서 정본 데이터 — 지문(SHA-256)의 입력. 렌더 내용과 같은 원본 mock에서 파생 (단일 출처)
export function canonicalDoc(type) {
  return JSON.stringify({ type, period: "2026-07", v: 1 });
}

// live — 테스트 가구의 실제 리포트: { stamp: 머리 둘째 줄, canon: 지문 입력(실제 내용) } (2026-10-02).
// 데모 문서의 '2026.07.30 생성 · 데모 데이터'와 체인 앵커링 예시 문구를 실제 문서에 붙이지 않는다.
function DocShell({ title, period, backHref, backLabel, docType, glossary = [], live = null, children }) {
  const [hash, setHash] = useState("");
  const canon = live?.canon || canonicalDoc(docType);
  useEffect(() => {
    sha256Hex(canon).then(setHash).catch(() => {});
  }, [canon]);
  return (
    <>
      <Head>
        <title>{title} — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-paper py-8 print:bg-white print:py-0">
        {/* 화면 전용 컨트롤 — 랜드마크 밖에 두면 스크린리더가 "본문 외 콘텐츠"로 흘린다.
            돌아가기·인쇄는 문서 도구라 nav 로 이름을 준다 (axe: region) */}
        <nav
          aria-label="문서 도구"
          className="print-hide mx-auto mb-4 flex w-full max-w-[794px] items-center gap-2 px-4"
        >
          {/* 터치 타깃 — 글자만 있으면 20px 밖에 안 된다. 인쇄 도구줄이라 44px 로 넉넉히 (WCAG 2.5.8 권장값) */}
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center py-1 text-[13px] font-bold text-muted underline underline-offset-2"
          >
            ← {backLabel}
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-press ml-auto rounded-xl px-5 py-2.5 text-[14px] font-bold text-white"
            style={{ background: NAVY }}
          >
            PDF로 저장 (A4)
          </button>
        </nav>

        {/* A4 시트 — 문서 본문이라 <main> 이다.
            div 로 두면 스크린리더에 본문 랜드마크가 없어 처음부터 훑어야 한다. */}
        <main className="report-sheet mx-auto w-full max-w-[794px] bg-white px-4 py-6 shadow-[0_18px_44px_-24px_rgba(10,31,60,.4)] sm:px-[15mm] sm:py-[13mm] print:max-w-none print:shadow-none">
          <header className="flex items-end justify-between border-b-2 pb-3" style={{ borderColor: NAVY }}>
            <div>
              <div className="font-num text-[15px] font-extrabold tracking-[.06em]" style={{ color: NAVY }}>
                K-CARE <span className="align-top text-[9px] font-bold" style={{ color: GOLD_TEXT }}>BETA</span>
              </div>
              <h1 className="mt-1 text-[22px] font-black" style={{ color: NAVY }}>
                {title}
              </h1>
            </div>
            <div className="text-right text-[11px] leading-[1.7] text-muted">
              <div>{period}</div>
              <div>{live ? live.stamp : "2026.07.30 생성 · 데모 데이터"}</div>
            </div>
          </header>
          {children}
          {glossary.length > 0 && (
            <div className="avoid-break mt-5 border-t border-navy/15 pt-2.5">
              <div className="text-[10px] font-bold text-muted">용어 설명</div>
              {glossary.map((t) => (
                <p key={t} className="mt-1 text-[10px] leading-[1.6] text-muted">
                  · <span className="font-bold">{t}</span> — {GLOSSARY[t]}
                </p>
              ))}
            </div>
          )}
          <footer className="mt-5 border-t border-navy/15 pt-3 text-[10px] leading-[1.7] text-muted">
            본 문서는 의료 기록이 아니며 진단·소견을 포함하지 않습니다 ·{" "}
            {live ? "컨시어지 방문 기록을 관제가 검수해 보냅니다" : "AI 초안은 사람 검수 후 확정됩니다 (8.4 Human-in-the-loop)"} · 문의 K-CARE 케어센터 1588-0000
            <div className="mt-2 rounded-lg border border-navy/15 px-3 py-2">
              <span className="font-bold" style={{ color: NAVY }}>위변조 검증 — 문서 지문 (SHA-256)</span>
              <span className="ml-2 break-all font-num">{hash || "계산 중…"}</span>
              <div className="mt-1">
                {live
                  ? "이 리포트 내용으로 계산한 지문입니다 · 체인 앵커링은 베타에서 아직 연결하지 않았습니다"
                  : "검증 방법: K-CARE 앱 → /report/verify 에서 지문 대조 · 체인 앵커링: K-CARE Trust Chain 블록 #182,340 · 2026.07.30 14:00 (데모 — 퍼블릭 체인 연동 대기)"}
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="mb-2 mt-5 text-[14px] font-black" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex justify-between gap-3 border-b border-navy/[.08] py-[7px] text-[12px]">
      <span className="text-muted">{k}</span>
      <span className="text-right font-bold text-ink">{v}</span>
    </div>
  );
}

// ── 보호자 월간 케어 리포트 ──
function CareReport() {
  return (
    <DocShell title="월간 케어 리포트" period="2026년 7월 · 김순자 (78) 가구" backHref="/family/my" backLabel="마이로" docType="care">
      {/* 상단 카피 — 실무자 지정 문구 (자택 거주 · lib/checkup.js REPORT_HEADLINE) */}
      <p className="mt-4 rounded-lg px-4 py-3 text-[15px] font-bold" style={{ background: "rgba(10,31,60,.05)", color: NAVY }}>
        오늘 김순자 님의 자택은 안전하고 건강합니다.
      </p>
      <div className="avoid-break">
        <SectionTitle>가구 정보</SectionTitle>
        <div className="grid grid-cols-2 gap-x-8">
          <KV k="고객" v="김순자 님 (78) · 강남구 대치동" />
          <KV k="주 보호자" v="김민수 (아들)" />
          <KV k="담당 컨시어지" v="박지현 (주) · 서다인 (부)" />
          <KV k="멤버십" v="티어 1 · 가입 14개월" />
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>이번 달 핵심 지표</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {WEEKLY.map((w) => (
            <div key={w.name} className="rounded-lg border border-navy/15 px-3 py-2.5">
              <div className="text-[10px] font-bold text-muted">{w.name}</div>
              <div className="font-num text-[18px] font-bold" style={{ color: NAVY }}>
                {w.value} <span className="text-[11px] text-green">{w.delta}</span>
              </div>
              <div className="text-[10px] text-muted">{w.last}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>건강 신호 (워치 · 월 평균)</SectionTitle>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b-2 text-left text-[10px] font-bold text-muted" style={{ borderColor: NAVY }}>
              <th className="py-1.5 pr-3">항목</th>
              <th className="py-1.5 pr-3">값</th>
              <th className="py-1.5">상태</th>
            </tr>
          </thead>
          <tbody>
            {VITALS.map((v) => (
              <tr key={v.name} className="border-b border-navy/[.08]">
                <td className="py-1.5 pr-3 font-bold text-ink">{v.name}</td>
                <td className="py-1.5 pr-3 font-num">{v.value} {v.unit}</td>
                <td className="py-1.5 text-muted">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="avoid-break">
        <SectionTitle>이번 달 케어 기록</SectionTitle>
        {(CRM_TIMELINE["김순자"] || []).map((t, i) => (
          <div key={i} className="flex gap-3 border-b border-navy/[.08] py-[7px] text-[12px]">
            <span className="w-[44px] shrink-0 font-num font-bold text-muted">{t.at}</span>
            <span className="w-[52px] shrink-0 font-bold" style={{ color: GOLD_TEXT }}>{t.kind}</span>
            <span className="flex-1 text-ink">{t.text}</span>
          </div>
        ))}
      </div>

      <div className="avoid-break">
        <SectionTitle>컨시어지 관찰 노트 (공유분)</SectionTitle>
        {SEED_REPORTS.filter((r) => r.shared).map((r) => (
          <p key={r.id} className="mb-1.5 text-[12px] leading-[1.7] text-ink">
            · {r.note} <span className="text-[10px] text-muted">— {r.by}</span>
          </p>
        ))}
        <p className="mt-2 text-[12px] leading-[1.7] text-ink">· {AI_REPORT.draft}</p>
      </div>

      {/* 안심방문 리포트로 건너가는 자리 (2026-08-28 질문: "케어리포트에서
          컨시어지가 평가한 리포트를 보려면?"). 월간 리포트는 한 달을 모아 놓은
          것이고, 방문 한 건을 20항목으로 평가한 것은 별도 문서다. 여기서만
          찾다가 못 찾는 일이 없게 링크를 둔다. 인쇄물에는 URL 로 남긴다. */}
      <div className="avoid-break">
        <SectionTitle>방문 한 건을 자세히 — 안심방문 리포트</SectionTitle>
        <p className="text-[12px] leading-[1.7] text-ink">
          이 월간 리포트는 한 달치를 모은 것입니다. 컨시어지가 방문 한 건을 몸 · 마음 · 집
          20항목으로 평가한 결과는 안심방문 리포트에서 봅니다 —{" "}
          {VISIT_REPORT.head.visitedAt} · {VISIT_REPORT.head.round}회차 · 담당{" "}
          {VISIT_REPORT.head.by}.
        </p>
        <Link
          href="/report/visit?from=family"
          className="print-hide btn-press mt-2 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
          style={{ background: NAVY }}
        >
          안심방문 리포트 열기 <span aria-hidden>›</span>
        </Link>
        <p className="mt-2 hidden text-[10px] text-muted print:block">
          보호자 앱 · 마이 → 안심방문 리포트 보기
        </p>
      </div>
    </DocShell>
  );
}

// ── 도넛 — 상태별 비율. SVG stroke-dasharray 로 그린다 (차트 라이브러리 없이).
//     인쇄에서도 벡터라 깨지지 않는다. 숫자는 옆 범례가 말하므로 도넛은 비율만. */
function Donut({ counts, size = 92, thick = 13, center }) {
  const total = STATE_ORDER.reduce((s, k) => s + (counts[k] || 0), 0) || 1;
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={
      STATE_ORDER.filter((k) => counts[k]).map((k) => `${k} ${counts[k]}건`).join(", ")
    }>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {STATE_ORDER.map((k) => {
          const n = counts[k] || 0;
          if (!n) return null;
          const len = (n / total) * c;
          const el = (
            <circle
              key={k}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={RESULT_TONE[k].dot}
              strokeWidth={thick}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </g>
      {center && (
        <>
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="font-num" fontSize={size * 0.3} fontWeight="800" fill={NAVY}>
            {center.n}
          </text>
          <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.13} fill="#5C5A54">
            {center.label}
          </text>
        </>
      )}
    </svg>
  );
}

// 5점 스케일 — 점 다섯 개 중 하나가 굵게. 수치가 아니라 '치우침'을 본다.
function Scale({ pos, tone }) {
  return (
    <span aria-hidden className="flex items-center gap-[7px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="rounded-full"
          style={
            i === pos
              ? { width: 9, height: 9, background: tone.dot }
              : { width: 5, height: 5, background: "rgba(10,31,60,.14)" }
          }
        />
      ))}
    </span>
  );
}

// 항목 한 줄 — 이름 · 추이/태그 · 상태 배지 / 스케일(또는 수치 막대) / 한 줄 설명
function ResultItem({ it }) {
  const tone = RESULT_TONE[it.state];
  return (
    <div className="border-b border-navy/[.07] py-[9px] last:border-b-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[11.5px] font-black" style={{ color: NAVY }}>{it.k}</span>
        {it.trend && (
          <span aria-label={it.trend === "up" ? "증가" : "감소"} className="text-[10px] font-bold" style={{ color: it.trend === "up" ? "#C0392B" : "#4A5C78" }}>
            {it.trend === "up" ? "▲" : "▼"}
          </span>
        )}
        {it.tag && <span className="text-[9.5px] font-bold text-muted">{it.tag}</span>}
        <span
          className="ml-auto rounded-full px-2 py-[2px] text-[9.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {it.state}
        </span>
      </div>
      {it.bars ? (
        <div className="mt-1.5">
          {it.bars.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="w-[22px] shrink-0 text-[9px] text-muted">{b.label}</span>
              <span className="relative h-[4px] flex-1 rounded-full" style={{ background: "rgba(10,31,60,.1)" }}>
                <span className="absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full" style={{ left: `${b.pos * 100}%`, background: tone.dot }} />
              </span>
              <span className="font-num w-[26px] shrink-0 text-right text-[11px] font-black" style={{ color: NAVY }}>{b.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1.5">
          <Scale pos={it.scale} tone={tone} />
        </div>
      )}
      <p className="mt-1 text-[10px] leading-[1.55] text-ink">{it.note}</p>
    </div>
  );
}

// ── 컨시어지 방문(안심방문) 리포트 — 2026-08-28 실무진 리포트 예시 시안 ──
// 예전에는 동행 개요·AI 초안·수행 체크·서명이었다. 시안은 "이번에 무엇이
// 어떻게 보였는지"를 20항목으로 펼치고, 보호자가 할 일을 맨 아래 모은다.
function VisitReport() {
  const H = VISIT_REPORT.head;
  const all = countStates(ALL_ITEMS);
  // 이 문서는 컨시어지와 보호자가 같이 본다. 돌아가는 곳이 늘 컨시어지 콘솔이면
  // 보호자가 마이 탭에서 열었다가 남의 화면으로 떨어진다 — 온 곳으로 되돌린다
  // (2026-08-28). ?from=family 로 들어오면 보호자 마이 탭으로.
  const { query } = useRouter();
  const fromFamily = query.from === "family";
  return (
    <DocShell
      title="안심방문 리포트"
      period={`${H.visitedAt} · ${H.round}회차`}
      backHref={fromFamily ? "/family/my" : "/concierge"}
      backLabel={fromFamily ? "마이로" : "컨시어지로"}
      docType="visit"
    >
      {/* 헤더 — 누구의 · 몇 회차 · 누가 다녀왔는지 + 종합 판정 + 방문확인 스탬프 */}
      <div className="avoid-break mt-3 flex flex-col gap-3 rounded-[14px] px-5 py-4 sm:flex-row sm:items-start sm:gap-4" style={{ background: NAVY }}>
        <div className="min-w-0 flex-1 text-white">
          <div className="text-[10px] font-bold tracking-[.08em] text-white/60">
            케이케어 방문 리포트 · {H.round}회차 · 데모 예시
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-black">{H.client}</span>
            <span className="text-[12px] text-white/75">{H.honorific} · {H.age}세</span>
          </div>
          <div className="mt-1 text-[10.5px] leading-[1.7] text-white/70">
            {H.visitedAt} 방문 · 이전 방문 {H.prevAt} 대비 · 담당 컨시어지 {H.concierge} · {H.tags}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold sm:text-[11px]" style={{ background: "rgba(201,164,107,.22)", color: "#E8D5B0" }}>
            <span aria-hidden className="h-[6px] w-[6px] rounded-full" style={{ background: "#C9A46B" }} />
            {H.verdict}
          </span>
          <span className="flex h-[54px] w-[54px] flex-col items-center justify-center rounded-full text-center text-[8px] font-bold leading-[1.4] text-white/80" style={{ border: "1.5px solid rgba(255,255,255,.4)" }}>
            <span>{H.stamp.line1}</span>
            <span className="font-num text-[10px]">{H.stamp.line2}</span>
            <span className="text-[7px] tracking-[.08em]">K-CARE</span>
          </span>
        </div>
      </div>

      {/* 요약 — 전체 도넛 + 범례 + 축별 도넛 3개 */}
      <div className="avoid-break mt-3 flex flex-col items-center gap-4 rounded-[14px] border border-navy/[.1] px-5 py-4 sm:flex-row sm:gap-6">
        <Donut counts={all} size={96} thick={14} center={{ n: ALL_ITEMS.length, label: "항목" }} />
        <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2 sm:w-auto sm:gap-y-1.5">
          {STATE_ORDER.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span aria-hidden className="h-[9px] w-[9px] shrink-0 rounded-[2px]" style={{ background: RESULT_TONE[k].dot }} />
              <span className="text-[11px] text-ink">{k}</span>
              <span className="font-num ml-auto text-[13px] font-black" style={{ color: NAVY }}>{all[k] || 0}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-5 sm:ml-auto sm:gap-4">
          {VISIT_REPORT.axes.map((a) => (
            <div key={a.axis} className="text-center">
              <Donut counts={countStates(a.items)} size={54} thick={9} />
              <div className="mt-1 text-[10px] font-bold" style={{ color: NAVY }}>{a.axis}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 총평 — 사람이 쓴 문장 */}
      <div className="avoid-break mt-3 rounded-[14px] px-5 py-3.5" style={{ background: "rgba(176,141,87,.07)", borderLeft: `3px solid #B08D57` }}>
        <p className="text-[11.5px] leading-[1.8] text-ink">
          <span className="font-black" style={{ color: NAVY }}>총평 </span>
          {VISIT_REPORT.summary}
        </p>
      </div>

      {/* 3열 — 몸 · 마음 · 집 */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {VISIT_REPORT.axes.map((a) => (
          <div key={a.axis} className="avoid-break rounded-[14px] border border-navy/[.1] px-3.5 py-3">
            <div className="flex items-center gap-2 border-b-2 pb-1.5" style={{ borderColor: NAVY }}>
              <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full" style={{ background: NAVY, color: "#fff" }}>
                <Icon name={a.icon} size={12} strokeWidth={2} />
              </span>
              <span className="text-[13px] font-black" style={{ color: NAVY }}>{a.axis}</span>
              <span className="text-[9px] font-bold text-muted">{a.en} · {a.items.length}</span>
            </div>
            <div className="mt-1">
              {a.items.map((it) => (
                <ResultItem key={it.k} it={it} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 보호자께서 꼭 확인해 주세요 — 리포트에서 유일하게 행동을 요구하는 자리 */}
      <div className="avoid-break mt-3 rounded-[14px] px-5 py-4" style={{ background: NAVY }}>
        <div className="flex items-center gap-2 text-[13px] font-black text-white">
          <span aria-hidden style={{ color: "#C9A46B" }}>
            <Icon name="alert" size={16} strokeWidth={2} />
          </span>
          보호자께서 꼭 확인해 주세요
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {VISIT_REPORT.guardianTodos.map((t) => (
            <div key={t.tag} className="flex gap-2">
              <span className="mt-[1px] h-fit shrink-0 rounded-[5px] px-1.5 py-[2px] text-[9.5px] font-bold" style={{ background: "rgba(255,255,255,.13)", color: "#E8D5B0" }}>
                {t.tag}
              </span>
              <span className="text-[10.5px] leading-[1.65] text-white/90">{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[9.5px] leading-[1.6] text-muted">
        컨시어지 방문 기록 기반 자동 생성 리포트 · 데모 예시 · {AI_REPORT.hitl}
      </p>
    </DocShell>
  );
}

// ── 테스트 가구 1 의 실제 안심방문 리포트 (2026-10-02 "보호자 리포트도 연동") ──
// 컨시어지 방문 기록(21항목 · 항목 메모 · 총평 · 사진 수) → 관제 검수 → 관제가 '보호자 리포트 발송'을 해야 열린다.
// 발송 전이면 지금 어느 단계인지만 보여 준다. 처음 열면 관제 방문관리에 '보호자 열람 완료'.
// 항목 상태(양호 · 관찰 · 주의)는 컨시어지가 고른 항목에만 붙인다. 종합 판정은 만들지 않는다 — 본 것 · 확인한 것만.
const ymdDot = (t) => (t ? new Date(Number(t) + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, ".") : "—");
function LiveVisitReport() {
  const { state, dispatch } = useAppState();
  const r = visitReportOf(state);
  const { query } = useRouter();
  const fromFamily = query.from === "family";
  const viewed = r.viewed;
  // '보호자 열람'은 보호자 계정이 열었을 때만 — 컨시어지 · 관제가 같은 주소를 열어도 열람으로 치지 않는다 (2026-10-02 코드 점검)
  const asGuardian = useAuth().user?.role === "guardian";
  useEffect(() => {
    if (fromFamily && asGuardian && r.sent && !viewed) dispatch({ type: "visitViewed" });
  }, [fromFamily, asGuardian, r.sent, viewed, dispatch]);
  const back = { backHref: fromFamily ? "/family/my" : "/concierge", backLabel: fromFamily ? "마이로" : "컨시어지로" };
  if (!r.sent)
    return (
      <DocShell title="안심방문 리포트" period="테스트 가구 1 · 발송 전" {...back} docType="visit-live" live={{ stamp: "관제 검수 뒤 발송", canon: "visit-live-pending" }}>
        <div className="mt-4 rounded-[14px] border border-navy/[.1] px-5 py-6 text-center">
          <div className="text-[16px] font-black" style={{ color: NAVY }}>이번 방문 리포트는 아직 오지 않았습니다</div>
          <p className="mt-2 text-[13px] leading-[1.8] text-muted">
            컨시어지가 방문을 마치면 관제가 기록을 검수한 뒤 보내 드립니다.
            <br />
            지금 단계: <b className="text-ink">{STAGE_LABEL[r.stage]}</b>
            {r.stage === "active" ? ` · 점검 ${r.done}/${r.total}` : ""}
          </p>
        </div>
      </DocShell>
    );
  return (
    <DocShell
      title="안심방문 리포트"
      period={`${ymdDot(r.visitedTs)} 방문 · 테스트 가구 1`}
      {...back}
      docType="visit-live"
      live={{ stamp: `${ymdDot(r.sentTs)} 발송 · 실제 방문 기록`, canon: JSON.stringify({ type: "visit-live", visitedTs: r.visitedTs, sentTs: r.sentTs, axes: r.axes, memo: r.memo, photos: r.photos }) }}
    >
      <div className="avoid-break mt-3 flex flex-col gap-3 rounded-[14px] px-5 py-4 sm:flex-row sm:items-start sm:gap-4" style={{ background: NAVY }}>
        <div className="min-w-0 flex-1 text-white">
          <div className="text-[10px] font-bold tracking-[.08em] text-white/60">케이케어 방문 리포트 · 테스트 가구 1 · 실제 방문 기록</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[24px] font-black">{r.client}</span>
            <span className="text-[12px] text-white/75">어르신</span>
          </div>
          <div className="mt-1 text-[10.5px] leading-[1.7] text-white/70">
            {ymdDot(r.visitedTs)} 방문 · 담당 컨시어지 {r.concierge.pri}{r.concierge.sub ? ` · ${r.concierge.sub}` : ""} · 관제 검수 {r.reviewedAt || "—"} · 발송 {r.sentAt}
          </div>
        </div>
        <span className="flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center rounded-full text-center text-[8px] font-bold leading-[1.4] text-white/80" style={{ border: "1.5px solid rgba(255,255,255,.4)" }}>
          <span>방문확인</span>
          <span className="font-num text-[10px]">{ymdDot(r.visitedTs).slice(5)}</span>
          <span className="text-[7px] tracking-[.08em]">K-CARE</span>
        </span>
      </div>

      <div className="avoid-break mt-3 grid grid-cols-2 gap-3 rounded-[14px] border border-navy/[.1] px-5 py-4 sm:grid-cols-4">
        {[["확인한 항목", `${r.done} / ${r.total}`], ...r.axes.map((a) => [a.axis, `${a.items.filter((i) => i.done).length} / ${a.items.length}`])].map(([k, val]) => (
          <div key={k}>
            <div className="text-[10.5px] font-bold text-muted">{k}</div>
            <div className="font-num text-[18px] font-black" style={{ color: NAVY }}>{val}</div>
          </div>
        ))}
        {Object.keys(r.gradeCounts).length > 0 && (
          <div className="col-span-2 flex flex-wrap items-center gap-1.5 border-t border-navy/[.08] pt-2.5 sm:col-span-4">
            <span className="text-[10.5px] font-bold text-muted">컨시어지가 고른 상태</span>
            {VISIT_GRADES.filter((g) => r.gradeCounts[g]).map((g) => (
              <span key={g} className="rounded-full px-2 py-[2px] text-[11px] font-bold" style={{ background: RESULT_TONE[g].bg, color: RESULT_TONE[g].fg }}>
                {g} <span className="font-num">{r.gradeCounts[g]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="avoid-break mt-3 rounded-[14px] px-5 py-3.5" style={{ background: "rgba(176,141,87,.07)", borderLeft: "3px solid #B08D57" }}>
        <p className="text-[11.5px] leading-[1.8] text-ink">
          <span className="font-black" style={{ color: NAVY }}>총평 </span>
          {r.memo || "컨시어지가 남긴 총평이 없습니다."}
        </p>
        <p className="mt-1 text-[10.5px] text-muted">현장 사진 {r.photos}장 · 사진 파일은 베타에서 저장하지 않습니다</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {r.axes.map((a) => (
          <div key={a.axis} className="avoid-break rounded-[14px] border border-navy/[.1] px-3.5 py-3">
            <div className="flex items-center gap-2 border-b-2 pb-1.5" style={{ borderColor: NAVY }}>
              <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full" style={{ background: NAVY, color: "#fff" }}>
                <Icon name={a.icon} size={12} strokeWidth={2} />
              </span>
              <span className="text-[13px] font-black" style={{ color: NAVY }}>{a.axis}</span>
              <span className="text-[9px] font-bold text-muted">확인 {a.items.filter((i) => i.done).length} / {a.items.length}</span>
            </div>
            <ul className="mt-1">
              {a.items.map((i) => (
                <li key={i.k} className="border-b border-navy/[.06] py-1.5 last:border-0">
                  <div className="flex items-center justify-between gap-2 text-[11.5px]">
                    <span className="font-bold text-ink">{i.k}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-[1px] text-[10px] font-bold"
                      style={
                        i.grade && RESULT_TONE[i.grade]
                          ? { color: RESULT_TONE[i.grade].fg, background: RESULT_TONE[i.grade].bg }
                          : i.done
                            ? { color: "#1E7A5A", background: "rgba(30,122,90,.12)" }
                            : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                      }
                    >
                      {i.grade ? i.grade : i.done ? "확인함" : "이번엔 보지 않음"}
                    </span>
                  </div>
                  {i.note && <div className="mt-0.5 text-[10.5px] leading-[1.6] text-muted">{i.note}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>


      <p className="mt-2 text-[9.5px] leading-[1.6] text-muted">
        컨시어지 방문 기록 → 관제 검수 → 보호자 발송 · 관찰 기록이며 진단 · 판단이 아닙니다
        {Object.keys(r.gradeCounts).length > 0 ? " · 상태는 컨시어지가 고른 항목에만 붙습니다" : ""} · 확인하지 않은 항목은 이번 방문에서 보지 않은 것입니다
      </p>
    </DocShell>
  );
}

// 테스트 계정으로 들어오면 실제 리포트, 아니면 데모 예시 (2026-10-02)
function VisitReportPage() {
  const live = !!useAuth().user?.household;
  return live ? <LiveVisitReport /> : <VisitReport />;
}

// ── 병원 동행 리포트 (2026-10-02 "남은 것도 다" — 동행 리포트 연동) ──
// 컨시어지 '동행 기록 저장'(적은 글 · 사진 장수 · 영상 녹화 여부) → '리포트 제출' → 관제 검수 · 보호자 리포트 발송 때 함께 열린다.
// 적은 글을 그대로 싣는다 — AI 초안 · 진단 · 판정을 붙이지 않는다. 보호자가 처음 열면 관제 커뮤니케이션 · 감사로그에 '열람'.
const hmDot = (t) => (t ? new Date(Number(t) + 9 * 3600 * 1000).toISOString().slice(11, 16) : "—");
function LiveEscortReport() {
  const { state, dispatch } = useAppState();
  const e = state.escort || {};
  const { query } = useRouter();
  const fromFamily = query.from === "family";
  const sent = !!e.sentAt;
  const viewed = !!e.viewedAt;
  const asGuardian = useAuth().user?.role === "guardian";
  useEffect(() => {
    if (fromFamily && asGuardian && sent && !viewed) dispatch({ type: "escortViewed" });
  }, [fromFamily, asGuardian, sent, viewed, dispatch]);
  const back = { backHref: fromFamily ? "/family/my" : "/concierge", backLabel: fromFamily ? "마이로" : "컨시어지로" };
  if (!sent)
    return (
      <DocShell title="동행 리포트" period="테스트 가구 1 · 전달 전" {...back} docType="escort-live" live={{ stamp: "관제 검수 뒤 전달", canon: "escort-live-pending" }}>
        <div className="mt-4 rounded-[14px] border border-navy/[.1] px-5 py-6 text-center">
          <div className="text-[16px] font-black" style={{ color: NAVY }}>동행 리포트가 아직 오지 않았습니다</div>
          <p className="mt-2 text-[13px] leading-[1.8] text-muted">
            병원 동행을 마치면 컨시어지가 적은 기록을 확인한 뒤 보내 드립니다.
            <br />
            지금 단계: <b className="text-ink">{e.savedAt ? "컨시어지가 동행 기록을 저장했습니다 — 관제 검수 뒤 전달" : "동행 기록 전"}</b>
          </p>
        </div>
      </DocShell>
    );
  return (
    <DocShell
      title="동행 리포트"
      period={`${ymdDot(e.savedAt)} 병원 동행 · 테스트 가구 1`}
      {...back}
      docType="escort-live"
      live={{ stamp: `${ymdDot(e.sentAt)} ${hmDot(e.sentAt)} 전달 · 실제 동행 기록`, canon: JSON.stringify({ type: "escort-live", note: e.note, photos: e.photos, recorded: e.recorded, savedAt: e.savedAt, sentAt: e.sentAt }) }}
    >
      <div className="avoid-break mt-3 rounded-[14px] px-5 py-4 text-white" style={{ background: NAVY }}>
        <div className="text-[10px] font-bold tracking-[.08em] text-white/60">케이케어 동행 리포트 · 테스트 가구 1 · 실제 동행 기록</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[24px] font-black">{LIVE_ELDER}</span>
          <span className="text-[12px] text-white/75">어르신 · 병원 동행</span>
        </div>
        <div className="mt-1 text-[10.5px] leading-[1.7] text-white/70">
          기록 저장 {ymdDot(e.savedAt)} {hmDot(e.savedAt)} · 담당 컨시어지 {e.by || "—"} · 가족 전달 {hmDot(e.sentAt)}
        </div>
      </div>
      <div className="avoid-break">
        <SectionTitle>동행 기록 — 컨시어지가 적은 그대로</SectionTitle>
        <p className="whitespace-pre-wrap rounded-[14px] px-5 py-3.5 text-[12.5px] leading-[1.85] text-ink" style={{ background: "rgba(176,141,87,.07)", borderLeft: "3px solid #B08D57" }}>
          {e.note}
        </p>
      </div>
      <div className="avoid-break grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <KV k="현장 사진" v={`${e.photos || 0}장 · 파일은 베타에서 저장하지 않습니다`} />
        <KV k="영상 녹화" v={e.recorded ? "녹화함 — 컨시어지 기록" : "녹화하지 않음"} />
      </div>
      <p className="mt-3 text-[9.5px] leading-[1.6] text-muted">
        컨시어지 동행 기록 → 컨시어지 검수 확정 → 보호자 전달 · 의료진 말씀과 현장에서 있었던 일의 기록이며 진단 · 판단이 아닙니다
      </p>
    </DocShell>
  );
}
function DemoEscortReport() {
  return (
    <DocShell title="동행 리포트" period={`${CARE_TEAM.dateLabel} · 김순자 (78) 가구`} backHref="/family/my" backLabel="마이로" docType="escort">
      <div className="avoid-break">
        <SectionTitle>동행 기록 (데모 예시)</SectionTitle>
        <p className="text-[12.5px] leading-[1.85] text-ink">{AI_REPORT.draft}</p>
        <p className="mt-2 text-[10.5px] leading-[1.7] text-muted">{AI_REPORT.hitl}</p>
      </div>
    </DocShell>
  );
}
function EscortReportPage() {
  const live = !!useAuth().user?.household;
  return live ? <LiveEscortReport /> : <DemoEscortReport />;
}

// ── 경영 월간 리포트 ──
function ExecReport() {
  return (
    <DocShell title="월간 사람 · 경영 리포트" period="2026년 7월 · 강남지점" backHref="/admin" backLabel="경영 콘솔로" docType="exec" glossary={["NPS", "LTV", "Closed Loop", "라이프사이클"]}>
      <div className="avoid-break">
        <SectionTitle>사람 KPI</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {PEOPLE_KPIS.map((k) => (
            <div key={k.k} className="rounded-lg border border-navy/15 px-3 py-2.5">
              <div className="text-[10px] font-bold text-muted">{k.k}</div>
              <div className="font-num text-[18px] font-bold" style={{ color: NAVY }}>{k.v}</div>
              <div className="text-[10px] text-muted">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>주간 브리핑 요약 (AI · 집계 전용)</SectionTitle>
        <p className="text-[12px] font-bold leading-[1.7] text-ink">{EXEC_BRIEF.summary}</p>
        {EXEC_BRIEF.items.map((b) => (
          <div key={b.k} className="flex gap-3 border-b border-navy/[.08] py-[7px] text-[12px]">
            <span className="w-[52px] shrink-0 font-bold" style={{ color: GOLD_TEXT }}>{b.k}</span>
            <span className="flex-1 text-ink">{b.text}</span>
          </div>
        ))}
      </div>

      <div className="avoid-break">
        <SectionTitle>라이프사이클 · NPS</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          <div>
            {LIFECYCLE_STAGES.map((s) => (
              <KV key={s.k} k={s.k} v={`${s.n}가구`} />
            ))}
          </div>
          <div>
            <KV k="설문 응답률" v={NPS_LOOP.respond} />
            {NPS_LOOP.mix.map((m) => (
              <KV key={m.k} k={m.k} v={m.v} />
            ))}
            {NPS_LOOP.recovery.map((r) => (
              <KV key={r.k} k={r.k} v={r.v} />
            ))}
          </div>
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>케어 성과 · 신뢰 거버넌스</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          <div>
            {CARE_OUTCOMES.map((c) => (
              <KV key={c.k} k={c.k} v={`${c.v} (${c.target})`} />
            ))}
          </div>
          <div>
            {TRUST_METRICS.map((t) => (
              <KV key={t.k} k={t.k} v={t.v} />
            ))}
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-[1.6] text-muted">
          컨시어지 평가에 판매액 · 업셀 지표를 사용하지 않습니다 (원칙 1) · 개별 사건은 포함하지
          않습니다 (집계 전용)
        </p>
      </div>
    </DocShell>
  );
}

const REPORTS = { care: CareReport, visit: VisitReportPage, escort: EscortReportPage, exec: ExecReport };

export default function ReportPage() {
  const { query } = useRouter();
  const Comp = REPORTS[query.type];
  if (!Comp)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-[14px] text-muted">
        리포트 준비 중 — /report/care · /report/visit · /report/escort · /report/exec
      </div>
    );
  return <Comp />;
}
