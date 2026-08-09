import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { GLOSSARY, sha256Hex } from "../../lib/glossary";
import {
  AI_REPORT,
  CARE_OUTCOMES,
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
const GOLD = "#B08D57";

// 문서 정본 데이터 — 지문(SHA-256)의 입력. 렌더 내용과 같은 원본 mock에서 파생 (단일 출처)
export function canonicalDoc(type) {
  return JSON.stringify({ type, period: "2026-07", v: 1 });
}

function DocShell({ title, period, backHref, backLabel, docType, glossary = [], children }) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    sha256Hex(canonicalDoc(docType)).then(setHash).catch(() => {});
  }, [docType]);
  return (
    <>
      <Head>
        <title>{title} — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-paper py-8 print:bg-white print:py-0">
        {/* 화면 전용 컨트롤 */}
        <div className="print-hide mx-auto mb-4 flex w-full max-w-[794px] items-center gap-2 px-4">
          <Link href={backHref} className="text-[13px] font-bold text-muted underline underline-offset-2">
            ← {backLabel}
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-press ml-auto rounded-xl px-5 py-2.5 text-[14px] font-bold text-white"
            style={{ background: NAVY }}
          >
            PDF로 저장 (A4)
          </button>
        </div>

        {/* A4 시트 */}
        <div className="report-sheet mx-auto w-full max-w-[794px] bg-white px-[15mm] py-[13mm] shadow-[0_18px_44px_-24px_rgba(10,31,60,.4)] print:max-w-none print:shadow-none">
          <header className="flex items-end justify-between border-b-2 pb-3" style={{ borderColor: NAVY }}>
            <div>
              <div className="font-num text-[15px] font-extrabold tracking-[.06em]" style={{ color: NAVY }}>
                K-CARE <span className="align-top text-[9px] font-bold" style={{ color: GOLD }}>BETA</span>
              </div>
              <h1 className="mt-1 text-[22px] font-black" style={{ color: NAVY }}>
                {title}
              </h1>
            </div>
            <div className="text-right text-[11px] leading-[1.7] text-muted">
              <div>{period}</div>
              <div>2026.07.30 생성 · 데모 데이터</div>
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
            본 문서는 의료 기록이 아니며 진단·소견을 포함하지 않습니다 · AI 초안은 사람 검수 후
            확정됩니다 (8.4 Human-in-the-loop) · 문의 K-CARE 케어센터 1588-0000
            <div className="mt-2 rounded-lg border border-navy/15 px-3 py-2">
              <span className="font-bold" style={{ color: NAVY }}>위변조 검증 — 문서 지문 (SHA-256)</span>
              <span className="ml-2 break-all font-num">{hash || "계산 중…"}</span>
              <div className="mt-1">
                검증 방법: K-CARE 앱 → /report/verify 에서 지문 대조 · 체인 앵커링: K-CARE Trust
                Chain 블록 #182,340 · 2026.07.30 14:00 (데모 — 퍼블릭 체인 연동 대기)
              </div>
            </div>
          </footer>
        </div>
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
        오늘 김순자 어르신의 자택은 안전하고 건강합니다.
      </p>
      <div className="avoid-break">
        <SectionTitle>가구 정보</SectionTitle>
        <div className="grid grid-cols-2 gap-x-8">
          <KV k="어르신" v="김순자 (78) · 강남구 대치동" />
          <KV k="주 보호자" v="김민수 (아들)" />
          <KV k="담당 컨시어지" v="박지현 (주) · 서다인 (부)" />
          <KV k="멤버십" v="티어 1 · 가입 14개월" />
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>이번 주 핵심 지표</SectionTitle>
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
            <span className="w-[52px] shrink-0 font-bold" style={{ color: GOLD }}>{t.kind}</span>
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
    </DocShell>
  );
}

// ── 컨시어지 방문(동행) 리포트 ──
function VisitReport() {
  return (
    <DocShell title="동행 방문 리포트" period="2026.07.30 (목) · 서울아산병원" backHref="/concierge" backLabel="컨시어지로" docType="visit">
      <div className="avoid-break">
        <SectionTitle>방문 개요</SectionTitle>
        <div className="grid grid-cols-2 gap-x-8">
          <KV k="어르신" v="김순자 (78)" />
          <KV k="일정" v="13:50 – 16:10 순환기내과 외래" />
          <KV k="주 동행" v="박지현 (간호사 출신 · 14년)" />
          <KV k="부 동행" v="서다인 (차량 · 접수 · 수납)" />
          <KV k="이동" v="차량 · 휠체어 동선" />
          <KV k="체크인" v="GPS 2인 체크인 완료" />
        </div>
      </div>

      <div className="avoid-break">
        <SectionTitle>방문 기록 (AI 초안 · 검수 확정)</SectionTitle>
        <p className="rounded-lg border border-navy/15 px-4 py-3 text-[12px] leading-[1.8] text-ink">
          {AI_REPORT.draft}
        </p>
        <p className="mt-1.5 text-[10px] leading-[1.6] text-muted">{AI_REPORT.hitl}</p>
      </div>

      <div className="avoid-break">
        <SectionTitle>수행 체크</SectionTitle>
        {[
          "케어박스 점검 — 의약품 · 진료의뢰서 지참",
          "외출 컨디션 브리핑 확인 (출발 62 보통 · 도착 52 주의)",
          "진료 내용 가족 공유 캘린더 기록 — 다음 외래 8/23",
          "복약 안내 · 약국 동행 · 귀가 확인",
        ].map((c) => (
          <div key={c} className="flex gap-2 border-b border-navy/[.08] py-[7px] text-[12px] text-ink">
            <span className="font-bold text-green">✓</span> {c}
          </div>
        ))}
      </div>

      <div className="avoid-break mt-6">
        <SectionTitle>서명 (2인 필수)</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          {["주 동행 · 박지현", "부 동행 · 서다인"].map((who) => (
            <div key={who}>
              <div className="h-[68px] rounded-lg border border-dashed border-navy/30" />
              <div className="mt-1.5 text-[11px] font-bold text-ink">{who}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-[1.6] text-muted">{AI_REPORT.signRule}</p>
      </div>
    </DocShell>
  );
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
            <span className="w-[52px] shrink-0 font-bold" style={{ color: GOLD }}>{b.k}</span>
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

const REPORTS = { care: CareReport, visit: VisitReport, exec: ExecReport };

export default function ReportPage() {
  const { query } = useRouter();
  const Comp = REPORTS[query.type];
  if (!Comp)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-[14px] text-muted">
        리포트 준비 중 — /report/care · /report/visit · /report/exec
      </div>
    );
  return <Comp />;
}
