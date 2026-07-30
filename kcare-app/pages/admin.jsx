import Head from "next/head";
import { PendingTag } from "../components/ui";
import {
  ADMIN_COHORTS,
  ADMIN_RISKS,
  ADMIN_SLA,
  REVENUE_FORECAST,
  REVENUE_STREAMS,
  RULE_PERF,
} from "../lib/mock";

// 관리자(경영) — 핸드오프 02 §5. 수익·리스크 총괄, 개별 사건을 보지 않는다.
// 구현 규칙: 실시간 사건 티커 금지(경영자의 관제 개입 방지) ·
// 급여 사업(수익원 12)을 단독 마진으로 평가하는 뷰 금지 (13.4%는 의도값, KPI는 12개월 누적 기여).

const STREAM_STATUS = {
  impl: { label: "구현", color: "#4ADE80" },
  cond: { label: "조건부", color: "#F0D9A8" },
  todo: { label: "미구현", color: "#C9CFD8" },
};

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-dark p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-bold text-white">{children}</h2>
      {right}
    </div>
  );
}

export default function AdminConsole() {
  const counts = REVENUE_STREAMS.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }),
    {}
  );

  return (
    <>
      <Head>
        <title>경영 콘솔 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav px-4 pb-12 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1100px] space-y-4">
          {/* ── 헤더 — 실시간 사건 티커 없음 (의도) ── */}
          <header>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold tracking-[.16em] text-white/50">
                역할 05 / 관리자 · 경영
              </span>
              <a href="/" className="text-[11px] font-bold text-white/35 underline-offset-2 hover:underline">
                데모 홈
              </a>
            </div>
            <h1 className="mt-1 text-[26px] font-bold text-white">수익 · 리스크 총괄</h1>
            <p className="mt-1.5 max-w-[80ch] text-[13px] leading-[1.75] text-white/55">
              이 화면은 집계만 봅니다. 개별 SOS · 사건은 관제(배치관리자) 화면의 소관이며, 여기에는
              실시간 티커를 두지 않습니다 — 경영이 개별 사건에 개입하지 않기 위한 설계입니다.
            </p>
          </header>

          {/* ── 수익원 22종 커버리지 ── */}
          <Panel>
            <SectionTitle
              right={
                <span className="flex gap-3 text-[10px] font-bold">
                  {Object.entries(STREAM_STATUS).map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1" style={{ color: v.color }}>
                      <span className="h-[8px] w-[8px] rounded-full" style={{ background: v.color }} />
                      {v.label} {counts[k] || 0}
                    </span>
                  ))}
                </span>
              }
            >
              수익원 22종 커버리지
            </SectionTitle>
            <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {REVENUE_STREAMS.map((s) => (
                <div
                  key={s.no}
                  className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[.03] px-2.5 py-2"
                >
                  <span
                    className="h-[8px] w-[8px] shrink-0 rounded-full"
                    style={{ background: STREAM_STATUS[s.status].color }}
                  />
                  <span className="font-num text-[10px] font-bold text-white/40">{s.no}</span>
                  <span className="truncate text-[11px] font-medium text-white/80">{s.name}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── 수익 예측 ── */}
            <Panel>
              <SectionTitle right={<PendingTag>목 수치 · 실데이터 연동 대기</PendingTag>}>
                수익 예측 (월)
              </SectionTitle>
              <div className="mt-3 space-y-3">
                {REVENUE_FORECAST.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="font-bold text-white">{f.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-num font-bold text-white">{f.amount}</span>
                        <span className="rounded-full bg-white/10 px-2 py-[2px] text-[9px] font-bold text-gold-soft">
                          {f.phase}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* 급여 사업 평가 규칙 — 단독 마진 뷰 금지 */}
              <p className="mt-4 border-t border-white/8 pt-3 text-[10px] leading-[1.7] text-white/45">
                재가급여(12)는 단독 마진으로 평가하지 않습니다 — 13.4% 마진은 의도값이며 KPI는
                12개월 누적 기여입니다.
              </p>
            </Panel>

            {/* ── SLA 집계 ── */}
            <Panel>
              <SectionTitle>SLA 집계</SectionTitle>
              <div className="mt-3 space-y-3">
                {ADMIN_SLA.map((s) => (
                  <div key={s.name} className="flex items-baseline justify-between gap-3 border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <div>
                      <div className="text-[13px] font-bold text-white">{s.name}</div>
                      <div className="mt-0.5 text-[10px] text-white/45">{s.note}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-num text-[18px] font-bold text-green">{s.current}</span>
                      <span className="ml-1.5 font-num text-[11px] text-white/40">/ {s.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ── 규칙 성능 ── */}
            <Panel>
              <SectionTitle>알림 규칙 성능</SectionTitle>
              <div className="mt-3 space-y-3">
                {RULE_PERF.map((r) => {
                  const banned = r.policy.includes("금지");
                  return (
                    <div key={r.name} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <div className="text-[12px] font-bold text-white">{r.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/60">
                        <span>
                          발동 <span className="font-num font-bold text-white/85">{r.fired}</span>
                        </span>
                        <span>
                          실제 <span className="font-num font-bold text-white/85">{r.real}</span>
                        </span>
                        <span>
                          오탐률{" "}
                          <span className="font-num font-bold" style={{ color: banned ? "#FF8A80" : "#4ADE80" }}>
                            {r.falseRate}
                          </span>
                        </span>
                        <span
                          className="rounded-full px-2 py-[2px] text-[9px] font-bold"
                          style={
                            banned
                              ? { color: "#FF8A80", background: "rgba(192,57,43,.18)" }
                              : { color: "#4ADE80", background: "rgba(30,122,90,.2)" }
                          }
                        >
                          {r.policy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 border-t border-white/8 pt-2 text-[10px] font-bold text-white/50">
                오탐률 30%를 넘는 단독 규칙은 발송 금지 — 임계값 조정은 이 화면의 유일한 개입입니다.
              </p>
            </Panel>

            {/* ── 리스크 요약 — 01-domain-rules.md와 단일 출처 ── */}
            <Panel>
              <SectionTitle
                right={
                  <span className="flex gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-[rgba(192,57,43,.18)] px-2.5 py-1 text-[#FF8A80]">
                      CRITICAL {ADMIN_RISKS.critical}
                    </span>
                    <span className="rounded-full bg-[rgba(138,93,18,.22)] px-2.5 py-1 text-[#F0D9A8]">
                      HIGH {ADMIN_RISKS.high}
                    </span>
                  </span>
                }
              >
                리스크 요약
              </SectionTitle>
              <div className="mt-3 space-y-2.5">
                {ADMIN_RISKS.top.map((r) => (
                  <div key={r.name} className="flex gap-2.5 border-t border-white/8 pt-2.5 first:border-t-0 first:pt-0">
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={
                        r.grade === "C"
                          ? { color: "#FF8A80", background: "rgba(192,57,43,.18)" }
                          : { color: "#F0D9A8", background: "rgba(138,93,18,.22)" }
                      }
                    >
                      {r.grade}
                    </span>
                    <div>
                      <div className="text-[12px] font-bold text-white">{r.name}</div>
                      <div className="mt-0.5 text-[11px] text-white/55">{r.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* ── 코호트 리텐션 ── */}
          <Panel>
            <SectionTitle right={<PendingTag>목 수치 · LTV 산정 방식 미확정</PendingTag>}>
              코호트 리텐션
            </SectionTitle>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="text-[10px] font-bold tracking-[.1em] text-white/45">
                    <th className="pb-2 pr-4 font-bold">가입 월</th>
                    <th className="pb-2 pr-4 font-bold">M1</th>
                    <th className="pb-2 pr-4 font-bold">M3</th>
                    <th className="pb-2 pr-4 font-bold">M6</th>
                    <th className="pb-2 font-bold">LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_COHORTS.map((c) => (
                    <tr key={c.month} className="border-t border-white/8 text-[12px]">
                      <td className="py-2.5 pr-4 font-bold text-white">{c.month}</td>
                      <td className="py-2.5 pr-4 font-num font-bold text-green">{c.m1}</td>
                      <td className="py-2.5 pr-4 font-num text-white/80">{c.m3}</td>
                      <td className="py-2.5 pr-4 font-num text-white/80">{c.m6}</td>
                      <td className="py-2.5 font-num text-white/80">{c.ltv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
