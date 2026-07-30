import Head from "next/head";
import { useState } from "react";
import { PendingTag } from "../components/ui";
import AiChat from "../components/AiChat";
import HelpTip from "../components/HelpTip";
import {
  ADMIN_AI_QA,
  ADMIN_COHORTS,
  ADMIN_RISKS,
  ADMIN_SLA,
  ACTION_RESULTS,
  CHURN_BANDS,
  CHURN_FACTORS,
  LIFECYCLE_STAGES,
  NBA_QUEUE,
  COACHING_LOG,
  EXEC_BRIEF,
  NPS_LOOP,
  TRUST_METRICS,
  CARE_OUTCOMES,
  CHURN_SEGMENTS,
  ELDER_MIX,
  ELDER_RISK_MIX,
  FAMILY_ENGAGE,
  FAMILY_FUNNEL,
  INCENTIVE_MIX,
  MEMBERSHIP_MIX,
  OPTION_ATTACH,
  PEOPLE_KPIS,
  REVENUE_FORECAST,
  REVENUE_STREAMS,
  RULE_PERF,
  SAFETY_MONTHLY,
  STAFF_CERTS,
  STAFF_HR_WATCH,
  STAFF_PIPELINE,
  STAFF_QUALITY_DIST,
  STAFF_QUALITY_OPS,
} from "../lib/mock";

// 관리자(경영) — 핸드오프 02 §5 + 사람 관리 중심 고도화.
// 관제(09)가 현장 관리라면, 경영은 사람 관리다: 컨시어지·보호자·어르신의 관리와 분석.
// 디자인 톤: 관제와 동일한 전폭형 라이트 — 페이퍼 배경 + 화이트 카드 + 네이비 강조.
// 구현 규칙: 실시간 사건 티커 금지(경영자의 관제 개입 방지) · 개별 사건 비노출(집계만) ·
// 컨시어지 화면에 판매액·업셀 컬럼 금지(원칙 1 — 평가는 케어 품질만) ·
// 급여 사업(수익원 12)을 단독 마진으로 평가하는 뷰 금지 (13.4%는 의도값, KPI는 12개월 누적 기여).

const NAVY = "#0A1F3C";

// 라이트 배경용 상태색 — #4ADE80 계열 밝은 변형은 다크 배경 전용 (09 §12-14)
const STREAM_STATUS = {
  impl: { label: "구현", color: "#1E7A5A" },
  cond: { label: "조건부", color: "#8A5D12" },
  todo: { label: "미구현", color: "#C9CFD8" },
};

const LEVEL_STYLE = {
  높음: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  중간: { fg: "#8A5D12", bg: "rgba(138,93,18,.1)" },
};

function Panel({ children, className = "" }) {
  return (
    <section
      className={`card-glass rounded-[14px] p-[18px] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHead({ title, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[15px] font-bold text-navy">{title}</h2>
      {right}
    </div>
  );
}

// 수평 막대 행 — 퍼널·분포 공용
function BarRow({ label, value, w, color = "#B08D57", note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-bold text-navy">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-num font-bold text-ink">{value}</span>
          {note && <span className="text-[11px] text-muted">{note}</span>}
        </span>
      </div>
      <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}

// 지표 타일 — 값 + 목표/설명
function StatTile({ k, v, color = NAVY, note }) {
  return (
    <div className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
      <div className="text-[11px] font-bold text-muted">{k}</div>
      <div className="mt-0.5 font-num text-[22px] font-bold" style={{ color }}>
        {v}
      </div>
      {note && <div className="mt-0.5 text-[11px] text-muted">{note}</div>}
    </div>
  );
}

export default function AdminConsole() {
  const [tab, setTab] = useState("staff");
  const [nbaDone, setNbaDone] = useState({}); // NBA 큐 — 담당 배정 원샷
  const [execRead, setExecRead] = useState(false); // 주간 브리핑 읽음
  const counts = REVENUE_STREAMS.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }),
    {}
  );

  return (
    <>
      <Head>
        <title>경영 콘솔 — K-CARE</title>
      </Head>
      <div className="console-bg min-h-screen px-4 pb-10 pt-7 text-ink sm:px-8">
        <div className="mx-auto max-w-[1240px] space-y-4">
          {/* ── 헤더 — 실시간 사건 티커 없음 (의도) ── */}
          <header>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-[.16em] text-muted">
                역할 05 / 관리자 · 경영
              </span>
              <a href="/" className="text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">
                데모 홈
              </a>
            </div>
            <h1 className="mt-0.5 text-[29px] font-bold tracking-[-.01em] text-navy">사람 · 경영 총괄</h1>
            <p className="mt-1.5 max-w-[84ch] text-[15px] leading-[1.75] text-muted">
              관제가 현장을 본다면, 경영은 사람을 봅니다 — 컨시어지 · 보호자 · 어르신의 관리와 분석.
              이 화면은 집계만 봅니다. 개별 SOS · 사건은 관제 화면의 소관이며, 여기에는 실시간 티커를
              두지 않습니다 — 경영이 개별 사건에 개입하지 않기 위한 설계입니다.
            </p>
          </header>

          {/* ── 사람 KPI — 전 탭 공통 ── */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {PEOPLE_KPIS.map((k) => (
              <Panel key={k.k} className="!p-4">
                <div className="text-[11px] font-bold text-muted">{k.k}</div>
                <div className="mt-1 font-num text-[25px] font-bold" style={{ color: k.color }}>
                  {k.v}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">{k.sub}</div>
              </Panel>
            ))}
          </div>

          {/* ── 주간 AI 브리핑 — 능동형 (집계 전용 · 개별 사건 없음) ── */}
          <Panel>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">AI</span>
              <h2 className="text-[15px] font-bold text-navy">주간 경영 브리핑</h2>
              <span className="font-num text-[12px] text-muted">{EXEC_BRIEF.date}</span>
              <a
                href="/report/exec"
                className="btn-press ml-auto rounded-[10px] border border-navy/20 px-3.5 py-1.5 text-[12px] font-bold text-navy"
              >
                월간 리포트 PDF
              </a>
              <button
                onClick={() => setExecRead(true)}
                disabled={execRead}
                className="btn-press rounded-[10px] border border-navy/20 px-3.5 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
              >
                {execRead ? "읽음 확인됨 ✓" : "읽음 확인"}
              </button>
            </div>
            <p className="mt-2 text-[14px] font-bold leading-[1.6] text-ink">{EXEC_BRIEF.summary}</p>
            <div className="mt-2.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {EXEC_BRIEF.items.map((b) => (
                <div key={b.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                  <div className="text-[11px] font-bold text-gold">{b.k}</div>
                  <div className="mt-0.5 text-[12px] leading-[1.6] text-ink">{b.text}</div>
                </div>
              ))}
            </div>
          </Panel>

          {/* ── 탭 — 사람 축 3개 + 수익·리스크 ── */}
          <div className="flex flex-wrap gap-2">
            {[
              ["staff", "컨시어지 분석"],
              ["family", "보호자 · 가구"],
              ["crm", "CRM · 라이프사이클"],
              ["care", "케어 성과"],
              ["biz", "수익 · 리스크"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="btn-press rounded-[10px] border px-[18px] py-2.5 text-[13px] font-bold"
                style={
                  tab === k
                    ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                    : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* ════ 컨시어지 분석 — 품질 · 파이프라인 · HR 워치 ════ */}
          {tab === "staff" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="케어 품질 분포" right={<span className="text-[12px] text-muted">평점 출처: 가족 만족도</span>} />
                <div className="mt-3 space-y-3">
                  {STAFF_QUALITY_DIST.map((b) => (
                    <BarRow key={b.band} label={b.band} value={`${b.n}명`} w={b.w} color={b.color} note={b.note} />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {STAFF_QUALITY_OPS.map((o) => (
                    <StatTile key={o.k} k={o.k} v={o.v} note={o.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  이 화면에 판매액 · 업셀 컬럼은 없습니다 — 컨시어지 평가는 케어 품질만 봅니다 (원칙 1).
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="인력 파이프라인 (최근 90일)" right={<PendingTag>목 수치 · 채용 시스템 연동 대기</PendingTag>} />
                <div className="mt-3 space-y-3">
                  {STAFF_PIPELINE.map((p) => (
                    <BarRow key={p.stage} label={p.stage} value={`${p.n}명`} w={p.w} color={NAVY} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  수습 → 일반 전환 기준: 부 동행 12건 + 가족 만족 4.5 이상 · 투석 등 고난도 배차는 전환 후 개방
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="HR 워치 — 이직 · 번아웃 신호" right={<span className="text-[12px] text-muted">사람 관리 · 사건 아님</span>} />
                <div className="mt-3 space-y-2.5">
                  {STAFF_HR_WATCH.map((r) => (
                    <div key={r.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: LEVEL_STYLE[r.level].fg, background: LEVEL_STYLE[r.level].bg }}
                        >
                          {r.level}
                        </span>
                        <span className="text-[13px] font-bold text-navy">{r.name}</span>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.55] text-muted">{r.why}</div>
                      <div className="mt-1 text-[12px] font-bold leading-[1.55] text-ink">조치 — {r.action}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  90일 유지율 87%의 핵심 변수는 피로도 상한 준수 — 상한은 관제가 강제, 경영은 추세를 관리합니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="케어 품질 인센티브 구성" right={<span className="text-[12px] text-muted">업셀 인센티브 대체 (원칙 1)</span>} />
                <div className="mt-3 space-y-3">
                  {INCENTIVE_MIX.map((m) => (
                    <BarRow key={m.k} label={m.k} value={`${m.pct}%`} w={m.pct} color="#B08D57" note={m.note} />
                  ))}
                </div>
                <div className="mt-4 border-t border-navy/[.08] pt-3">
                  <div className="text-[12px] font-bold text-navy">자격 · 교육 현황</div>
                  <div className="mt-2.5 space-y-3">
                    {STAFF_CERTS.map((c) => (
                      <BarRow
                        key={c.k}
                        label={c.k}
                        value={`${c.n}명`}
                        w={c.w}
                        color={c.warn ? "#8A5D12" : "#1E7A5A"}
                        note={c.warn ? "갱신 일정 배정 필요" : undefined}
                      />
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="코칭 로그" right={<span className="text-[12px] text-muted">케어하는 사람을 케어한다</span>} />
                <div className="mt-3 space-y-2.5">
                  {COACHING_LOG.map((c) => (
                    <div key={c.who} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-navy">{c.who}</span>
                        <span className="text-[11px] text-muted">코치 {c.coach}</span>
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.state === "조치" ? "bg-gold/15 text-[#7A5C28]" : "bg-green/10 text-green"
                          }`}
                        >
                          {c.state}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.6] text-ink">{c.topic}</div>
                      <div className="mt-0.5 text-[11px] text-muted">다음 — {c.next}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  코칭은 평가가 아니라 성장 기록입니다 — 90일 유지율 87%의 다른 절반은 여기서 나옵니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 보호자 · 가구 — 퍼널 · 참여도 · 이탈 세그먼트 ════ */}
          {tab === "family" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="가입 퍼널 (최근 90일)" right={<span className="text-[12px] text-muted">주보호자 가입 → 초대 링크 → 부보호자</span>} />
                <div className="mt-3 space-y-3">
                  {FAMILY_FUNNEL.map((f) => (
                    <BarRow key={f.stage} label={f.stage} value={`${f.n}`} w={f.w} color={NAVY} note={f.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  가장 큰 이탈 구간은 등록 → 결제 (−18%) — 가입비 정책(12 – 15만 · 미확정) 확정이 선결 과제입니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="보호자 참여도" right={<span className="text-[12px] text-muted">참여도가 유지율의 선행 지표</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {FAMILY_ENGAGE.map((e) => (
                    <StatTile key={e.k} k={e.k} v={e.v} color={e.color} note={e.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  부보호자 열람률이 낮은 가구부터 이탈 신호가 옵니다 — 시차 가구는 발송 시간 개인화로 보정 중.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="이탈 위험 세그먼트" right={<span className="text-[12px] text-muted">개별 가구 연락은 CS 소관</span>} />
                <div className="mt-3 space-y-2.5">
                  {CHURN_SEGMENTS.map((c) => (
                    <div key={c.seg} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: LEVEL_STYLE[c.level].fg, background: LEVEL_STYLE[c.level].bg }}
                        >
                          {c.level}
                        </span>
                        <span className="text-[13px] font-bold text-navy">{c.seg}</span>
                        <span className="ml-auto font-num text-[13px] font-bold text-ink">{c.n}</span>
                      </div>
                      <div className="mt-1 text-[12px] font-bold leading-[1.55] text-ink">조치 — {c.action}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="멤버십 구성 · 옵션 부착" right={<PendingTag>가입비 12 – 15만 · 미확정</PendingTag>} />
                <div className="mt-3 space-y-3">
                  {MEMBERSHIP_MIX.map((m) => (
                    <BarRow key={m.k} label={m.k} value={`${m.n}가구`} w={m.w} color="#B08D57" />
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-navy/[.08] pt-3">
                  {OPTION_ATTACH.map((o) => (
                    <StatTile key={o.k} k={o.k} v={o.v} note={o.note} />
                  ))}
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead
                  title={<>NPS 수집 루프<HelpTip term="NPS" /></>}
                  right={<span className="text-[12px] text-muted">동행 후 24h 설문 · 응답률 {NPS_LOOP.respond}</span>}
                />
                <div className="mt-3 flex gap-2">
                  {NPS_LOOP.mix.map((m) => (
                    <div key={m.k} className="flex-1 rounded-xl border border-navy/[.06] bg-white/60 px-3 py-3 text-center">
                      <div className="font-num text-[20px] font-bold" style={{ color: m.color }}>
                        {m.v}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-muted">{m.k}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-navy/[.08] pt-3 sm:grid-cols-3">
                  {NPS_LOOP.recovery.map((r) => (
                    <StatTile key={r.k} k={r.k} v={r.v} note={r.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  비추천(0 – 6)은 접수 즉시 회복 플로우 — 점수보다 회복 속도가 NPS를 만듭니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ CRM · 라이프사이클 — 스테이지 · 이탈 스코어 · NBA · Closed Loop ════ */}
          {tab === "crm" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title={<>라이프사이클 스테이지<HelpTip term="라이프사이클" /></>} right={<span className="text-[12px] text-muted">전체 128가구 · 세그먼트 집계</span>} />
                <div className="mt-3 space-y-3">
                  {LIFECYCLE_STAGES.map((s) => (
                    <BarRow key={s.k} label={s.k} value={`${s.n}가구`} w={s.w} color={s.color} note={s.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  가입은 시작일 뿐입니다 — 온보딩 첫 30일이 이탈의 61%. 스테이지별 플레이북으로 관리합니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title={<>이탈 신호 스코어 분포<HelpTip term="이탈 신호" /></>} right={<span className="text-[12px] text-muted">요인 · 가중치 공개</span>} />
                <div className="mt-3 flex gap-2">
                  {CHURN_BANDS.map((b) => (
                    <div key={b.k} className="flex-1 rounded-xl border border-navy/[.06] bg-white/60 px-3 py-3 text-center">
                      <div className="font-num text-[22px] font-bold" style={{ color: b.color }}>
                        {b.n}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-muted">{b.k}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 rounded-xl bg-navy/[.04] px-3 py-2 text-[11px] leading-[1.7] text-muted">
                  스코어 구성 — {CHURN_FACTORS}
                </p>
                <p className="mt-2.5 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  블랙박스 스코어 금지 — 요인과 가중치를 공개합니다. 개별 가구 개입은 CS · 관제 소관입니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title={<>Next Best Action 큐<HelpTip term="NBA" /></>} right={<span className="text-[12px] text-muted">세그먼트 → 조치 → 담당 배정</span>} />
                <div className="mt-3 space-y-2.5">
                  {NBA_QUEUE.map((n) => (
                    <div key={n.id} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: LEVEL_STYLE[n.level].fg, background: LEVEL_STYLE[n.level].bg }}
                        >
                          {n.level}
                        </span>
                        <span className="text-[13px] font-bold text-navy">{n.seg}</span>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.55] text-ink">{n.act}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted">기대 효과 — {n.expect}</span>
                        <button
                          onClick={() => setNbaDone((v) => ({ ...v, [n.id]: true }))}
                          disabled={!!nbaDone[n.id]}
                          className="btn-press ml-auto rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                        >
                          {nbaDone[n.id] ? `${n.owner} 배정됨 ✓` : `${n.owner} 배정`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  경영은 배정까지 — 실행과 기록은 CS · 관제 도구에서 진행됩니다 (개별 개입 금지 원칙 유지).
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title={<>조치 효과 (Closed Loop)<HelpTip term="Closed Loop" /></>} right={<span className="text-[12px] text-muted">조치는 효과로 검증한다</span>} />
                <div className="mt-3 space-y-2.5">
                  {ACTION_RESULTS.map((r) => (
                    <div key={r.act} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-navy">{r.act}</span>
                        <span
                          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={
                            r.verdict === "롤백"
                              ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                              : r.verdict === "표준화"
                              ? { color: "#7A5C28", background: "rgba(176,141,87,.16)" }
                              : { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                          }
                        >
                          {r.verdict}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-muted">
                        대상 {r.target} · 결과 <span className="font-num font-bold text-ink">{r.result}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  효과 없는 조치는 롤백합니다 — 플레이북은 데이터로만 늘립니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 케어 성과 — 어르신 결과 지표 · 안전 집계 · 구성 ════ */}
          {tab === "care" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="케어 성과 지표 (월)" right={<span className="text-[12px] text-muted">서비스의 결과 — 사람 지표의 합</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CARE_OUTCOMES.map((c) => (
                    <StatTile key={c.k} k={c.k} v={c.v} color={c.color} note={c.target} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  동행 정시율 91%는 목표 미달 — 지연 원인 전수는 교통. 배차 여유 시간 정책을 계획 · 인력에서 조정 중.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="월간 안전 집계" right={<span className="text-[12px] text-muted">개별 사건 비노출 · 집계만</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SAFETY_MONTHLY.map((s) => (
                    <StatTile key={s.k} k={s.k} v={s.v} note={s.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  야간 공백 접수 3건 — 야간 출동 옵션 부착률(22%)을 높이는 것이 보증 범위(REQ-04)의 실질 보완책입니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="어르신 구성" right={<span className="text-[12px] text-muted">전체 132명</span>} />
                <div className="mt-3 space-y-3">
                  {ELDER_MIX.map((m) => (
                    <BarRow key={m.k} label={m.k} value={`${m.n}명`} w={m.w} color={NAVY} />
                  ))}
                </div>
                <div className="mt-4 flex gap-2 border-t border-navy/[.08] pt-3">
                  {ELDER_RISK_MIX.map((r) => (
                    <div key={r.k} className="flex-1 rounded-xl border border-navy/[.06] bg-white/60 px-3 py-2.5 text-center">
                      <div className="font-num text-[20px] font-bold" style={{ color: r.color }}>
                        {r.n}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-muted">{r.k}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  위험 분류는 환경 × 건강 이력 교차 — 단일 지표 판정 금지. 개별 명단은 관제 리스크 워치의 소관.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title={<>신뢰 거버넌스 — 해자<HelpTip term="해자" /></>} right={<span className="text-[12px] text-muted">신뢰는 기능이 아니라 구조</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TRUST_METRICS.map((t) => (
                    <StatTile key={t.k} k={t.k} v={t.v} note={t.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  경쟁이 따라오기 어려운 것은 화면이 아니라 이 숫자들입니다 — 동의 · 접근 공개 · 민감정보
                  게이팅은 처음부터 설계에 박혀 있습니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 수익 · 리스크 — 기존 총괄 뷰 ════ */}
          {tab === "biz" && (
            <>
              <Panel>
                <PanelHead
                  title="수익원 22종 커버리지"
                  right={
                    <span className="flex gap-3 text-[11px] font-bold">
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
                      <span className="font-num text-[11px] font-bold text-muted/70">{s.no}</span>
                      <span className="truncate text-[12px] font-medium text-ink">{s.name}</span>
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
                        <div className="flex items-baseline justify-between gap-2 text-[13px]">
                          <span className="font-bold text-navy">{f.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-num font-bold text-navy">{f.amount}</span>
                            <span className="rounded-full bg-navy/[.06] px-2 py-[2px] text-[10px] font-bold text-amber">
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
                  <p className="mt-4 border-t border-navy/[.08] pt-3 text-[11px] leading-[1.7] text-muted">
                    재가급여(12)는 단독 마진으로 평가하지 않습니다 — 13.4% 마진은 의도값이며 KPI는 12개월
                    누적 기여입니다.
                  </p>
                </Panel>

                {/* ── SLA 집계 ── */}
                <Panel>
                  <PanelHead title={<>SLA 집계<HelpTip term="SLA" /></>} right={<span className="text-[12px] text-muted">개별 사건 비노출 · 집계만</span>} />
                  <div className="mt-3 space-y-3">
                    {ADMIN_SLA.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-baseline justify-between gap-3 border-t border-navy/[.06] pt-3 first:border-t-0 first:pt-0"
                      >
                        <div>
                          <div className="text-[15px] font-bold text-navy">{s.name}</div>
                          <div className="mt-0.5 text-[11px] text-muted">{s.note}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-num text-[20px] font-bold text-green">{s.current}</span>
                          <span className="ml-1.5 font-num text-[12px] text-muted/70">/ {s.target}</span>
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
                          <div className="text-[13px] font-bold text-navy">{r.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
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
                              className="rounded-full px-2 py-[2px] text-[10px] font-bold"
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
                  <p className="mt-3 border-t border-navy/[.08] pt-2 text-[11px] font-bold text-muted">
                    오탐률 30%를 넘는 단독 규칙은 발송 금지 — 임계값 조정은 이 화면의 유일한 개입입니다.
                  </p>
                </Panel>

                {/* ── 리스크 요약 — 01-domain-rules.md와 단일 출처 ── */}
                <Panel>
                  <PanelHead
                    title="리스크 요약"
                    right={
                      <span className="flex gap-2 text-[12px] font-bold">
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
                          className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                          style={
                            r.grade === "C"
                              ? { color: "#C0392B", background: "rgba(192,57,43,.1)" }
                              : { color: "#8A5D12", background: "rgba(138,93,18,.1)" }
                          }
                        >
                          {r.grade}
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-navy">{r.name}</div>
                          <div className="mt-0.5 text-[12px] text-muted">{r.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              {/* ── 코호트 리텐션 ── */}
              <Panel>
                <PanelHead title={<>코호트 리텐션<HelpTip term="코호트" /><HelpTip term="LTV" /></>} right={<PendingTag>목 수치 · LTV 산정 방식 미확정</PendingTag>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="whitespace-nowrap text-[11px] font-bold tracking-[.1em] text-muted">
                        <th className="pb-2 pr-4 font-bold">가입 월</th>
                        <th className="pb-2 pr-4 font-bold">M1</th>
                        <th className="pb-2 pr-4 font-bold">M3</th>
                        <th className="pb-2 pr-4 font-bold">M6</th>
                        <th className="pb-2 font-bold">LTV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ADMIN_COHORTS.map((c) => (
                        <tr key={c.month} className="whitespace-nowrap border-t border-navy/[.08] text-[13px]">
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
            </>
          )}
        </div>

        {/* AI 경영 어시스턴트 — 우측 하단 플로팅 */}
        <AiChat
          role="admin"
          title="AI 경영 어시스턴트"
          subtitle="사람 지표 분석 · 집계 전용"
          qa={ADMIN_AI_QA}
          context="가입 128가구(+12) · 활성 어르신 132 · 보호자 241(주 128 / 부 113) · 컨시어지 24 · 90일 유지 87% · NPS 62 · 이탈 위험 11가구 · 부보호자 열람 64%"
          intro="사람 · 경영 지표를 분석해 드립니다. 이번 달 요약, 이탈 위험 조치, 유지율 개선 포인트를 물어보세요."
          note="집계 데이터만 다룹니다 — 개별 사건 · 개인정보는 관제 · CS 소관입니다."
        />
      </div>
    </>
  );
}
