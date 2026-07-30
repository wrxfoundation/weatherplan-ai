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
// 디자인 톤: 관제(09)와 동일한 전폭형 라이트 — 페이퍼 배경 + 화이트 카드 + 네이비 강조.
// 구현 규칙: 실시간 사건 티커 금지(경영자의 관제 개입 방지) ·
// 급여 사업(수익원 12)을 단독 마진으로 평가하는 뷰 금지 (13.4%는 의도값, KPI는 12개월 누적 기여).

// 라이트 배경용 상태색 — #4ADE80 계열 밝은 변형은 다크 배경 전용 (09 §12-14)
const STREAM_STATUS = {
  impl: { label: "구현", color: "#1E7A5A" },
  cond: { label: "조건부", color: "#8A5D12" },
  todo: { label: "미구현", color: "#C9CFD8" },
};

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-[14px] border border-navy/10 bg-white p-[18px] shadow-[0_10px_24px_-18px_rgba(10,31,60,.35)] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHead({ title, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[13px] font-bold text-navy">{title}</h2>
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
      <div className="min-h-screen bg-paper px-4 pb-10 pt-7 text-ink sm:px-8">
        <div className="mx-auto max-w-[1240px] space-y-4">
          {/* ── 헤더 — 실시간 사건 티커 없음 (의도) ── */}
          <header>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold tracking-[.16em] text-muted">
                역할 05 / 관리자 · 경영
              </span>
              <a href="/" className="text-[11px] font-bold text-muted/60 underline-offset-2 hover:underline">
                데모 홈
              </a>
            </div>
            <h1 className="mt-0.5 text-[26px] font-bold text-navy">수익 · 리스크 총괄</h1>
            <p className="mt-1.5 max-w-[80ch] text-[13px] leading-[1.75] text-muted">
              이 화면은 집계만 봅니다. 개별 SOS · 사건은 관제(배치관리자) 화면의 소관이며, 여기에는
              실시간 티커를 두지 않습니다 — 경영이 개별 사건에 개입하지 않기 위한 설계입니다.
            </p>
          </header>

          {/* ── 수익원 22종 커버리지 ── */}
          <Panel>
            <PanelHead
              title="수익원 22종 커버리지"
              right={
                <span className="flex gap-3 text-[10px] font-bold">
                  {Object.entries(STREAM_STATUS).map(([k, v]) => (
                    <span key={k} className="flex items-center gap-1 text-muted">
                      <span className="h-[8px] w-[8px] rounded-full" style={{ background: v.color }} />
                      {v.label} {counts[k] || 0}
                    </span>
                  ))}
                </span>
              }
            />
            <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {REVENUE_STREAMS.map((s) => (
                <div
                  key={s.no}
                  className="flex items-center gap-2 rounded-lg border border-navy/[.08] bg-elder px-2.5 py-2"
                >
                  <span
                    className="h-[8px] w-[8px] shrink-0 rounded-full"
                    style={{ background: STREAM_STATUS[s.status].color }}
                  />
                  <span className="font-num text-[10px] font-bold text-muted/70">{s.no}</span>
                  <span className="truncate text-[11px] font-medium text-ink">{s.name}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            {/* ── 수익 예측 ── */}
            <Panel>
              <PanelHead title="수익 예측 (월)" right={<PendingTag>목 수치 · 실데이터 연동 대기</PendingTag>} />
              <div className="mt-3 space-y-3">
                {REVENUE_FORECAST.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="font-bold text-navy">{f.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-num font-bold text-navy">{f.amount}</span>
                        <span className="rounded-full bg-navy/[.06] px-2 py-[2px] text-[9px] font-bold text-amber">
                          {f.phase}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-navy/[.08]">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* 급여 사업 평가 규칙 — 단독 마진 뷰 금지 */}
              <p className="mt-4 border-t border-navy/[.08] pt-3 text-[10px] leading-[1.7] text-muted">
                재가급여(12)는 단독 마진으로 평가하지 않습니다 — 13.4% 마진은 의도값이며 KPI는 12개월
                누적 기여입니다.
              </p>
            </Panel>

            {/* ── SLA 집계 ── */}
            <Panel>
              <PanelHead title="SLA 집계" right={<span className="text-[11px] text-muted">개별 사건 비노출 · 집계만</span>} />
              <div className="mt-3 space-y-3">
                {ADMIN_SLA.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-baseline justify-between gap-3 border-t border-navy/[.06] pt-3 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-navy">{s.name}</div>
                      <div className="mt-0.5 text-[10px] text-muted">{s.note}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-num text-[18px] font-bold text-green">{s.current}</span>
                      <span className="ml-1.5 font-num text-[11px] text-muted/70">/ {s.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ── 규칙 성능 ── */}
            <Panel>
              <PanelHead title="알림 규칙 성능" />
              <div className="mt-3 space-y-3">
                {RULE_PERF.map((r) => {
                  const banned = r.policy.includes("금지");
                  return (
                    <div key={r.name} className="border-t border-navy/[.06] pt-3 first:border-t-0 first:pt-0">
                      <div className="text-[12px] font-bold text-navy">{r.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                        <span>
                          발동 <span className="font-num font-bold text-ink">{r.fired}</span>
                        </span>
                        <span>
                          실제 <span className="font-num font-bold text-ink">{r.real}</span>
                        </span>
                        <span>
                          오탐률{" "}
                          <span className="font-num font-bold" style={{ color: banned ? "#C0392B" : "#1E7A5A" }}>
                            {r.falseRate}
                          </span>
                        </span>
                        <span
                          className="rounded-full px-2 py-[2px] text-[9px] font-bold"
                          style={
                            banned
                              ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                              : { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                          }
                        >
                          {r.policy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2 text-[10px] font-bold text-muted">
                오탐률 30%를 넘는 단독 규칙은 발송 금지 — 임계값 조정은 이 화면의 유일한 개입입니다.
              </p>
            </Panel>

            {/* ── 리스크 요약 — 01-domain-rules.md와 단일 출처 ── */}
            <Panel>
              <PanelHead
                title="리스크 요약"
                right={
                  <span className="flex gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-[rgba(192,57,43,.1)] px-2.5 py-1 text-danger">
                      CRITICAL {ADMIN_RISKS.critical}
                    </span>
                    <span className="rounded-full bg-[rgba(138,93,18,.1)] px-2.5 py-1 text-amber">
                      HIGH {ADMIN_RISKS.high}
                    </span>
                  </span>
                }
              />
              <div className="mt-3 space-y-2.5">
                {ADMIN_RISKS.top.map((r) => (
                  <div key={r.name} className="flex gap-2.5 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={
                        r.grade === "C"
                          ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                          : { color: "#8A5D12", background: "rgba(138,93,18,.1)" }
                      }
                    >
                      {r.grade}
                    </span>
                    <div>
                      <div className="text-[12px] font-bold text-navy">{r.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted">{r.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* ── 코호트 리텐션 ── */}
          <Panel>
            <PanelHead title="코호트 리텐션" right={<PendingTag>목 수치 · LTV 산정 방식 미확정</PendingTag>} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="text-[10px] font-bold tracking-[.1em] text-muted">
                    <th className="pb-2 pr-4 font-bold">가입 월</th>
                    <th className="pb-2 pr-4 font-bold">M1</th>
                    <th className="pb-2 pr-4 font-bold">M3</th>
                    <th className="pb-2 pr-4 font-bold">M6</th>
                    <th className="pb-2 font-bold">LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_COHORTS.map((c) => (
                    <tr key={c.month} className="border-t border-navy/[.08] text-[12px]">
                      <td className="py-2.5 pr-4 font-bold text-navy">{c.month}</td>
                      <td className="py-2.5 pr-4 font-num font-bold text-green">{c.m1}</td>
                      <td className="py-2.5 pr-4 font-num text-ink">{c.m3}</td>
                      <td className="py-2.5 pr-4 font-num text-ink">{c.m6}</td>
                      <td className="py-2.5 font-num text-ink">{c.ltv}</td>
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
