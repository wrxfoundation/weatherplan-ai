import Head from "next/head";
import { useState } from "react";
import { PendingTag } from "../components/ui";
import AiChat from "../components/AiChat";
import HelpTip from "../components/HelpTip";
import Icon from "../components/icons";
import RosterTable from "../components/RosterTable";
import { ROSTERS } from "../lib/rosters";
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
  CS_METRICS,
  CS_TOPICS,
  VOICE_FEED,
  VOICE_METRICS,
  VOICE_STATUS,
  WELFARE_METRICS,
  MKT_CHANNELS,
  MKT_RULES,
  SM_KPIS,
  SM_ALERT,
  SM_ROSTER,
  SM_PROFILE,
  HIRE_FUNNEL,
  BG_GATES,
  EDU_ITEMS,
  SUPPLY_GAP,
  ATTRITION,
  GRADE_TABLE,
  DISCIPLINE,
  RETENTION_KPIS,
  PAY_COMPARE,
  RETENTION_ITEMS,
  PAY_SIM,
  GROWTH_PATH,
  PROTECT_RULES,
  PAIR_WHY,
  PAIR_RULES,
  PAIR_STATS,
  RC_KPIS,
  MEDLAW_ROWS,
  MEDLAW_FIX,
  FIELD_CAN,
  FIELD_CANT,
  RISK_REGISTER,
  RISK_STATE_STYLE,
  INSURANCE_ROWS,
  REG_CALENDAR,
  BRANCH_TOTALS,
  BRANCHES,
  BRANCH_ALERTS,
  BRANCH_OPEN_STEPS,
  BRANCH_SUPPORT,
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

// 좌측 GNB — 섹션이 늘어나는 구조라 탭 대신 사이드 내비 (모바일은 가로 칩)
const MENUS = [
  ["branches", "지점 현황", "pin"],
  ["staff", "컨시어지 분석", "users"],
  ["staffmgmt", "인원 관리", "user"],
  ["family", "보호자 · 가구", "home"],
  ["crm", "CRM · 라이프사이클", "activity"],
  ["cs", "CS · 마케팅", "megaphone"],
  ["roster", "명부", "doc"],
  ["care", "케어 성과", "heart"],
  ["biz", "수익 · 리스크", "coin"],
  ["risk", "리스크 · 컴플라이언스", "alert"],
];

// 톤 공용 스타일 — 인원 관리 · 리스크 섹션
const TONE = {
  ok: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  warn: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  bad: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  info: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

// 수급 갭 히트맵 셀 — 1.0 미만이 배차 실패 구간 (붉을수록 부족)
function gapCell(v) {
  if (v < 1.0) return { background: "rgba(192,57,43,.18)", color: "#C0392B" };
  if (v < 1.3) return { background: "rgba(138,93,18,.14)", color: "#8A5D12" };
  if (v < 1.8) return { background: "rgba(10,31,60,.05)", color: "#0A1F3C" };
  return { background: "rgba(30,122,90,.1)", color: "#1E7A5A" };
}

// 명부 서브메뉴 — 종합 대시보드 + 유형별 분리 관리 (방대해질 명부의 기본 골격)
const ROSTER_SUBS = [
  ["home", "종합", null],
  ["elders", "어르신", "user"],
  ["guardians", "보호자", "users"],
  ["concierges", "컨시어지", "heart"],
  ["hospitals", "병원", "plus"],
];

// 최근 등록 집계 — 등록일(dateCol) 기준, 전 명부 통합
function recentRegs(days) {
  const cut = Date.now() - days * 86400000;
  return [
    ["elders", "어르신"],
    ["guardians", "보호자"],
    ["concierges", "컨시어지"],
    ["hospitals", "병원"],
  ].flatMap(([key, label]) =>
    ROSTERS[key].rows
      .filter((r) => new Date(`${r[ROSTERS[key].dateCol]}T00:00:00`).getTime() >= cut)
      .map((r) => ({ type: label, sub: key, name: r[0], date: r[ROSTERS[key].dateCol] }))
  ).sort((a, b) => (a.date < b.date ? 1 : -1));
}

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
  const [tab, setTab] = useState("branches"); // 랜딩 = 다지점 통합 현황
  const [rosterSub, setRosterSub] = useState("home"); // 명부 서브메뉴 — 종합/어르신/보호자/컨시어지/병원
  const [smOpen, setSmOpen] = useState(false); // 인원 관리 — 프로필 카드 열림 (데모: 박지현 기준)
  const [renewSent, setRenewSent] = useState(false); // 자격 갱신 안내 원샷
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
      <div className="console-bg min-h-screen text-ink lg:flex">
        {/* 전고 사이드바 — 화면 전체 높이 고정 · 헤더 아래 매립형 아님 (다크 네이비) */}
        <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col overflow-y-auto lg:flex" style={{ background: NAVY }}>
          <div className="px-5 pt-6">
            <div className="font-num text-[20px] font-extrabold tracking-[.04em] text-white">
              K-CARE <span className="align-top text-[9px] font-bold text-gold">BETA</span>
            </div>
            <div className="mt-1 text-[11px] font-bold tracking-[.14em] text-white/40">경영 콘솔 · 사람 관리</div>
          </div>
          <nav className="mt-5 flex-1 space-y-0.5 px-3 pb-4">
            {MENUS.map(([k, label, icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="btn-press flex w-full items-center gap-2.5 rounded-[10px] border-l-[3px] px-3 py-2.5 text-left text-[13px] font-bold"
                style={
                  tab === k
                    ? { background: "rgba(255,255,255,.1)", color: "#FFFFFF", borderColor: "#B08D57" }
                    : { color: "rgba(255,255,255,.55)", borderColor: "transparent" }
                }
              >
                <Icon name={icon} size={16} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-[10px] leading-[1.6] text-white/35">집계 전용 콘솔 — 개별 사건 개입은 관제 · CS 소관</p>
            <a href="/" className="btn-press mt-2.5 block rounded-[10px] border border-white/20 py-2 text-center text-[12px] font-bold text-white/80">데모 홈</a>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-10 pt-7 sm:px-8">
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

          {/* ── 사람 KPI — 전 탭 공통 (card-glass 원톤) ── */}
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

          {/* 모바일 — 가로 스크롤 칩 (전고 사이드바 대체) */}
              <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
                {MENUS.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className="btn-press shrink-0 rounded-[10px] border px-3.5 py-2 text-[13px] font-bold"
                    style={
                      tab === k
                        ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                        : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                    }
                  >
                    {label}
                  </button>
                ))}
              </nav>

          {/* ════ 지점 현황 — 다지점 통합 (비교는 케어 품질·안전 지표만, 판매액 순위 금지) ════ */}
          {tab === "branches" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 다지점 관리</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">지점 통합 현황</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  지점 비교는 케어 품질 · 안전 · 수급 지표만 봅니다 — 판매액 순위를 만들지 않습니다 (원칙 1).
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {BRANCH_TOTALS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[25px] font-bold text-navy">{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 지점 카드 */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {BRANCHES.map((b) => (
                  <Panel key={b.name} className="min-w-0 !p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-navy">{b.name}</span>
                      {b.hq && <span className="rounded-md bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-[#7A5C28]">본점</span>}
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={
                          b.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                          : b.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                          : b.tone === "prep" ? { color: "#7A5C28", background: "rgba(176,141,87,.16)" }
                          : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                        }
                      >
                        {b.state}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">{b.area} · 오픈 {b.open}</div>
                    {b.state !== "오픈 준비" ? (
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                        {[["가구", b.homes], ["컨시어지", b.staff], ["가동률", b.load], ["평점", b.rate], ["NPS", b.nps], ["오늘 배차", b.jobs]].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-navy/[.04] px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold text-muted">{k}</div>
                            <div className="font-num text-[14px] font-bold text-navy">{v}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2.5 rounded-lg bg-navy/[.04] px-3 py-2.5 text-[12px] font-bold text-navy">
                        컨시어지 채용 8/12 · 병원 제휴 2/4 · 10월 오픈 목표
                      </div>
                    )}
                    <p className="mt-2 border-t border-navy/[.06] pt-2 text-[11px] leading-[1.6] text-muted">{b.issue}</p>
                  </Panel>
                ))}
              </div>

              {/* 지점 비교 테이블 */}
              <Panel className="min-w-0">
                <PanelHead title="지점 비교" right={<span className="text-[12px] text-muted">케어 품질 · 안전 · 수급 — 판매액 컬럼 없음</span>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">지점</th>
                        <th className="py-2 pr-4">가입 가구</th>
                        <th className="py-2 pr-4">컨시어지</th>
                        <th className="py-2 pr-4">가동률</th>
                        <th className="py-2 pr-4">평점</th>
                        <th className="py-2 pr-4">NPS</th>
                        <th className="py-2 pr-4">SOS (월)</th>
                        <th className="py-2 pr-4">미매칭 (주)</th>
                        <th className="py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BRANCHES.map((b) => (
                        <tr key={b.name} className="whitespace-nowrap border-b border-navy/[.06]">
                          <td className="py-2.5 pr-4 font-bold text-navy">{b.name}{b.hq ? " ★" : ""}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.homes || "—"}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.staff || "—"}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.load}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.rate}</td>
                          <td className="py-2.5 pr-4 font-num font-bold text-ink">{b.nps ?? "—"}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.sos}</td>
                          <td className="py-2.5 pr-4 font-num text-ink">{b.unmatch}</td>
                          <td className="py-2.5">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={
                                b.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                                : b.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                                : b.tone === "prep" ? { color: "#7A5C28", background: "rgba(176,141,87,.16)" }
                                : { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                              }
                            >
                              {b.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  권역 × 요일 수급 갭 상세는 인원 관리 메뉴에서 — 지점별 개별 사건은 각 지점 관제 소관이며 여기는 집계만 봅니다.
                </p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {/* 지점 이슈 · 액션 */}
                <Panel className="min-w-0">
                  <PanelHead title="지점 이슈 · 액션" right={<span className="text-[12px] text-muted">이번 주 집계</span>} />
                  <div className="mt-3 space-y-2.5">
                    {BRANCH_ALERTS.map((a) => (
                      <div key={a.branch + a.text} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{a.branch}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={
                              a.level === "주의" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                              : a.level === "관찰" ? { color: "#5C5A54", background: "rgba(10,31,60,.06)" }
                              : { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                            }
                          >
                            {a.level}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-[1.6] text-ink">{a.text}</p>
                        {a.act !== "—" && <p className="mt-0.5 text-[12px] font-bold leading-[1.55] text-navy">→ {a.act}</p>}
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 오픈 파이프라인 */}
                <Panel className="min-w-0">
                  <PanelHead title="신규 지점 오픈 파이프라인 — 일산·고양" right={<span className="text-[12px] font-bold text-amber">10월 오픈 목표</span>} />
                  <ol className="mt-3 space-y-2.5">
                    {BRANCH_OPEN_STEPS.map(([k, st, note], i) => (
                      <li key={k} className="flex items-start gap-3">
                        <span
                          className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-num text-[11px] font-bold"
                          style={st === "완료" ? { background: "#1E7A5A", color: "#fff" } : st.startsWith("진행") ? { background: "#B08D57", color: "#0A1F3C" } : { background: "rgba(10,31,60,.08)", color: "#0A1F3C" }}
                        >
                          {st === "완료" ? "✓" : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[13px] font-bold text-navy">{k}</span>
                            <span className="font-num text-[11px] font-bold text-amber">{st}</span>
                          </div>
                          <div className="text-[11px] leading-[1.6] text-muted">{note}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    오픈 게이트 — 컨시어지 12명 · 병원 제휴 4곳 · 경계선 교육 100% 미충족 시 오픈을 연기합니다 (원칙이 확장 속도보다 우선).
                  </p>
                </Panel>

                {/* 지점 간 크로스 지원 */}
                <Panel className="min-w-0">
                  <PanelHead title="지점 간 크로스 지원" right={<span className="text-[12px] text-muted">본점 → 신규 지점 시니어 파견</span>} />
                  <div className="mt-3 space-y-2.5">
                    {BRANCH_SUPPORT.map((c) => (
                      <div key={c.who} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="text-[13px] font-bold text-navy">{c.who} <span className="font-num text-muted">→</span> {c.to}</div>
                        <p className="mt-1 text-[12px] leading-[1.6] text-muted">{c.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    크로스 지원도 2인 1조 · 페어 순환 규칙을 그대로 따릅니다 — 장거리 지원자의 피로 누적은 이탈 위험 예측(인원 관리)과 연동해 상한을 겁니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

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

              <Panel className="min-w-0">
                <PanelHead title="현장의 소리" right={<span className="text-[12px] text-muted">평가 미반영 · 익명 보장 · 48h 답변</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {VOICE_METRICS.map((v) => (
                    <StatTile key={v.k} k={v.k} v={v.v} note={v.note} />
                  ))}
                </div>
                <div className="mt-3 space-y-2.5 border-t border-navy/[.08] pt-3">
                  {VOICE_FEED.map((f) => (
                    <div key={f.at + f.text} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">
                          {f.type}
                        </span>
                        <span className="font-num text-[11px] text-muted">{f.at} · {f.who}</span>
                        <span
                          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ color: VOICE_STATUS[f.status].fg, background: VOICE_STATUS[f.status].bg }}
                        >
                          {f.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-[1.6] text-ink">{f.text}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  컨시어지는 사업 파트너입니다 — 목소리가 기능이 된 사례 5건 (케어박스 경량화 · 필담 카드
                  등). "지쳐요" 체크인 증가 시 HR 워치와 교차 확인합니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="파트너 복지 이용 현황" right={<span className="text-[12px] text-muted">상담 내용 비공개 · 이용률만 익명 집계</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {WELFARE_METRICS.map((w) => (
                    <StatTile key={w.k} k={w.k} v={w.v} note={w.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  복지는 비용이 아니라 유지율 투자입니다 — 90일 유지 87% · 이직으로 인한 재채용 비용이
                  복지 예산을 상회합니다. 심리상담 예약은 감사 로그에도 남지 않습니다 (비밀 보장 설계).
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 인원 관리 — 인력·자격·프로필 · 2인 1조 · 채용 · 처우 (운영) ════ */}
          {tab === "staffmgmt" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">운영 / 인력 · 자격 · 프로필</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">컨시어지 인원 관리</h2>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                {SM_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[25px] font-bold" style={{ color: k.color }}>{k.v}</div>
                  </Panel>
                ))}
              </div>

              {/* 자격 만료 임박 배너 */}
              <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-danger/25 bg-danger/[.06] px-4 py-3">
                <span className="rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">자격 만료 임박</span>
                <p className="min-w-0 flex-1 text-[13px] leading-[1.6] text-navy">{SM_ALERT}</p>
                <button
                  onClick={() => setRenewSent(true)}
                  disabled={renewSent}
                  className="btn-press shrink-0 rounded-[10px] border border-danger/40 px-3.5 py-2 text-[12px] font-bold text-danger disabled:opacity-50"
                >
                  {renewSent ? "갱신 안내 발송됨 ✓" : "갱신 안내 발송"}
                </button>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {/* 인력 명부 */}
                <Panel className="min-w-0">
                  <PanelHead title="인력 명부" right={<span className="text-[12px] text-muted">클릭해 프로필 열기</span>} />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-[12px]">
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th className="py-2 pr-4">이름 · 자격</th>
                          <th className="py-2 pr-4">권역</th>
                          <th className="py-2 pr-4">가동</th>
                          <th className="py-2 pr-4">평점</th>
                          <th className="py-2">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SM_ROSTER.map((r) => (
                          <tr key={r.name} onClick={() => setSmOpen(true)} className="cursor-pointer whitespace-nowrap border-b border-navy/[.06] hover:bg-navy/[.03]">
                            <td className="py-2 pr-4"><span className="font-bold text-navy">{r.name}</span> <span className="text-[11px] text-muted">{r.cert}</span></td>
                            <td className="py-2 pr-4 text-ink">{r.area}</td>
                            <td className="py-2 pr-4 font-num text-ink">{r.load}</td>
                            <td className="py-2 pr-4 font-num text-ink">{r.rate}</td>
                            <td className="py-2"><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[r.tone].fg, background: TONE[r.tone].bg }}>{r.state}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    데모 명부는 대표 6명 표시 — 상세 프로필 카드는 박지현 기준 예시입니다.
                  </p>
                </Panel>

                {/* 프로필 카드 — 박지현 (데모) */}
                {smOpen && (
                  <Panel className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-navy text-[15px] font-bold text-white">박</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-bold text-navy">{SM_PROFILE.name}</span>
                          <span className="rounded-full bg-gold/20 px-2 py-0.5 font-num text-[10px] font-bold text-[#7A5C28]">{SM_PROFILE.grade}</span>
                        </div>
                        <div className="truncate text-[11px] text-muted">{SM_PROFILE.sub}</div>
                      </div>
                      <button onClick={() => setSmOpen(false)} aria-label="닫기" className="btn-press text-[13px] font-bold text-muted">✕</button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {SM_PROFILE.stats.map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3 py-2.5 text-center">
                          <div className="text-[10px] font-bold text-muted">{k}</div>
                          <div className="font-num text-[17px] font-bold text-navy">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                      <div className="text-[12px] font-bold text-navy">자격 · 검증</div>
                      <div className="mt-2 space-y-1.5">
                        {SM_PROFILE.certs.map(([k, until, st]) => (
                          <div key={k} className="flex items-center gap-2 text-[12px]">
                            <span className="font-bold text-ink">{k}</span>
                            <span className="font-num text-[11px] text-muted">{until}</span>
                            <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE.ok.fg, background: TONE.ok.bg }}>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                      <div className="text-[12px] font-bold text-navy">전문 역량 · 매칭 태그</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {SM_PROFILE.tags.map((tg) => (
                          <span key={tg} className="rounded-full bg-navy/[.06] px-2.5 py-1 text-[11px] font-bold text-navy">{tg}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                      <div className="text-[12px] font-bold text-navy">가용 시간</div>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {SM_PROFILE.hours.map(([d, h]) => (
                          <div key={d} className="rounded-lg bg-navy/[.04] px-1 py-1.5 text-center">
                            <div className="text-[10px] font-bold text-muted">{d}</div>
                            <div className={`font-num text-[12px] font-bold ${h === "휴" ? "text-muted" : "text-navy"}`}>{h}</div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] leading-[1.6] text-muted">가용 시간·권역·역량 태그가 AI 배차 적합도 계산에 그대로 입력됩니다.</p>
                    </div>
                    <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                      <div className="text-[12px] font-bold text-navy">교육 이수 · 다음 과정</div>
                      <div className="mt-2 space-y-1.5">
                        {SM_PROFILE.edu.map(([k, d, st]) => (
                          <div key={k} className="flex items-center gap-2 text-[12px]">
                            <span className="font-bold text-ink">{k}</span>
                            <span className="font-num text-[11px] text-muted">{d}</span>
                            <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={st === "완료" ? { color: TONE.ok.fg, background: TONE.ok.bg } : { color: TONE.warn.fg, background: TONE.warn.bg }}>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                )}

                {/* 2인 1조 원칙 */}
                <Panel className="min-w-0">
                  <PanelHead title="2인 1조 페어 배차 — 예외 없는 운영 원칙" right={<span className="text-[12px] font-bold text-danger">단독 배차 불가</span>} />
                  <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                    어르신 단독 가구에 성인 1명이 들어가는 구조는 양쪽 모두에게 위험합니다. 2인 1조는 비용이 아니라 이 사업을 계속하기 위한 조건입니다.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PAIR_WHY.map(([cat, k, v]) => (
                      <div key={k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="text-[10px] font-bold text-gold">{cat}</div>
                        <div className="mt-0.5 text-[12px] font-bold text-navy">{k}</div>
                        <p className="mt-1 text-[11px] leading-[1.6] text-muted">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-navy/[.08] pt-2.5">
                    <div className="text-[12px] font-bold text-navy">페어링 규칙</div>
                    <ol className="mt-2 space-y-1.5">
                      {PAIR_RULES.map((r, i) => (
                        <li key={r} className="flex items-start gap-2 text-[12px] leading-[1.6] text-ink">
                          <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-navy/[.08] font-num text-[10px] font-bold text-navy">{i + 1}</span>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-navy/[.08] pt-3">
                    {PAIR_STATS.map((k) => (
                      <StatTile key={k.k} k={k.k} v={k.v} note={k.note} />
                    ))}
                  </div>
                </Panel>

                {/* 채용 파이프라인 */}
                <Panel className="min-w-0">
                  <PanelHead title="채용 파이프라인 — 지원부터 현장 투입까지 평균 24일" right={<span className="text-[12px] text-muted">이번 달 · 최종 합격률 8.4%</span>} />
                  <div className="mt-3 space-y-3">
                    {HIRE_FUNNEL.map((f) => (
                      <BarRow key={f.stage} label={f.stage} value={`${f.n}명`} w={Math.round((f.n / HIRE_FUNNEL[0].n) * 100)} color={NAVY} note={f.note} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    탈락 사유 1위는 신원조회(성범죄·아동학대 경력)이며 예외를 두지 않습니다. 요양보호사 수급이 급여사업(12)의 성장 상한을 정하므로 이 퍼널의 전환율이 곧 확장 속도입니다.
                  </p>
                </Panel>

                {/* 신원 검증 게이트 */}
                <Panel className="min-w-0">
                  <PanelHead title="신원 검증 게이트 · 5종" right={<span className="text-[12px] font-bold text-danger">1건이라도 미통과면 배차 불가</span>} />
                  <div className="mt-3 space-y-2">
                    {BG_GATES.map((g) => (
                      <div key={g.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{g.k}</span>
                          <span className="ml-auto font-num text-[13px] font-bold text-ink">{g.v}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[g.tone].fg, background: TONE[g.tone].bg }}>{g.note}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted">{g.law}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    신원조회는 채용 시 1회가 아니라 연 1회 재확인합니다. 어르신 단독 가구에 진입하는 직무이므로 재직 중 발생한 결격 사유를 놓치면 회사가 책임집니다.
                  </p>
                </Panel>

                {/* 서약 · 교육 */}
                <Panel className="min-w-0">
                  <PanelHead title="의료법 행위 경계 서약 · 교육" right={<span className="text-[12px] text-muted">배차 전제 조건</span>} />
                  <p className="mt-2 text-[12px] leading-[1.7] text-muted">
                    의료법 제27조 위반은 본사 방침이 아니라 현장의 선의에서 발생합니다 — “어르신이 부탁해서 약을 챙겨드렸다”가 무면허 의료행위가 되는 지점을 반복 교육합니다.
                  </p>
                  <div className="mt-3 space-y-3">
                    {EDU_ITEMS.map((e) => (
                      <BarRow key={e.k} label={e.k} value={e.v} w={parseInt(e.v, 10)} color={parseInt(e.v, 10) < 95 ? "#8A5D12" : "#1E7A5A"} note={e.cycle} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] font-bold leading-[1.7] text-amber">
                    경계선 교육 미이수 3명 배차에서 자동 제외
                  </p>
                </Panel>

                {/* 수급 갭 히트맵 */}
                <Panel className="min-w-0">
                  <PanelHead title="권역 × 요일 수급 갭" right={<span className="text-[12px] text-muted">붉을수록 인력 부족 · 배차 실패 위험</span>} />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-center text-[12px]">
                      <thead>
                        <tr className="text-[11px] font-bold text-muted">
                          <th className="py-1.5 pr-2 text-left">권역</th>
                          {SUPPLY_GAP.days.map((d) => (<th key={d} className="px-1 py-1.5">{d}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {SUPPLY_GAP.rows.map((r) => (
                          <tr key={r.area}>
                            <td className="whitespace-nowrap py-1 pr-2 text-left text-[12px] font-bold text-navy">{r.area}</td>
                            {r.v.map((v, i) => (
                              <td key={i} className="p-0.5">
                                <div className="rounded-md py-1.5 font-num text-[11px] font-bold" style={gapCell(v)}>{v.toFixed(1)}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    숫자는 수요 대비 가용 인력 배수입니다. 1.0 미만은 배차 실패가 발생하는 구간 — 강남·송파 화·목 오전이 상시 부족 구간입니다.
                  </p>
                </Panel>

                {/* 이탈 위험 예측 */}
                <Panel className="min-w-0">
                  <PanelHead title="이탈 위험 예측" right={<span className="text-[12px] text-muted">한 명 이탈 = 담당 가구 평균 6.2가구 재배정</span>} />
                  <div className="mt-3 space-y-2.5">
                    {ATTRITION.map((a) => (
                      <div key={a.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{a.name}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={a.level === "높음" ? { color: TONE.bad.fg, background: TONE.bad.bg } : a.level === "주의" ? { color: TONE.warn.fg, background: TONE.warn.bg } : { color: TONE.info.fg, background: TONE.info.bg }}>{a.level}</span>
                          <span className="ml-auto font-num text-[15px] font-bold" style={{ color: a.score >= 70 ? "#C0392B" : a.score >= 50 ? "#8A5D12" : "#1E7A5A" }}>{a.score}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{a.why}</div>
                        <div className="mt-0.5 text-[12px] font-bold leading-[1.55] text-ink">→ {a.act}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 위반 · 징계 */}
                <Panel className="min-w-0">
                  <PanelHead title="위반 · 징계 이력" right={<span className="text-[12px] text-muted">경계선 위반은 평점과 별도로 관리</span>} />
                  <div className="mt-3 space-y-2.5">
                    {DISCIPLINE.map((d) => (
                      <div key={d.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[d.tone].fg, background: TONE[d.tone].bg }}>{d.level}</span>
                          <span className="text-[13px] font-bold text-navy">{d.k}</span>
                          <span className="ml-auto font-num text-[11px] text-muted">{d.m}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{d.act}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] font-bold leading-[1.7] text-danger">
                    무면허 의료행위·금품 수수·기록 위조는 1회로 계약 해지합니다 — 경고 단계를 두지 않습니다.
                  </p>
                </Panel>
              </div>

              {/* ── 등급 체계 ── */}
              <Panel className="min-w-0">
                <PanelHead title="등급 체계 — 단가 · 권한 · 승급 조건" right={<span className="text-[12px] text-muted">2인 1조 기준 주/부 두 요율 · 평가 기준은 판매액이 아니라 케어 품질</span>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">등급</th>
                        <th className="py-2 pr-4">인원</th>
                        <th className="py-2 pr-4">주 동행 건당</th>
                        <th className="py-2 pr-4">부 동행 건당</th>
                        <th className="py-2">승급 조건 · 권한</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADE_TABLE.map((g) => (
                        <tr key={g.g} className="border-b border-navy/[.06]">
                          <td className="whitespace-nowrap py-2.5 pr-4 font-bold text-navy">{g.g}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num text-ink">{g.n}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num font-bold text-ink">{g.lead}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num text-ink">{g.sup}</td>
                          <td className="py-2.5 text-[12px] leading-[1.6] text-muted">{g.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* ── 처우 설계 · 리텐션 ── */}
              <Panel className="min-w-0">
                <PanelHead title="처우 설계 · 리텐션 — 좋은 동행자를 뺏기지 않는 구조" right={<span className="text-[12px] text-muted">방어선은 시급이 아니라 끊기지 않는 소득과 회사가 내 편이라는 경험</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  {RETENTION_KPIS.map((k) => (
                    <StatTile key={k.k} k={k.k} v={k.v} note={k.note} />
                  ))}
                </div>
                {/* 월 실수령 비교 */}
                <div className="mt-4 border-t border-navy/[.08] pt-3">
                  <div className="text-[12px] font-bold text-navy">핵심 장치 — 단골 가구 지분제 <span className="ml-1 font-medium text-muted">건별 노동 → 반복 소득 · 월 실수령 비교(동일 근무 강도)</span></div>
                  <div className="mt-2.5 space-y-3">
                    {PAY_COMPARE.map((c) => (
                      <BarRow key={c.k} label={c.k} value={c.v} w={c.w} color={c.k.includes("K-CARE") ? "#B08D57" : "#9AA3AF"} note={c.note} />
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
                    지분은 동행 원가(85%)가 아니라 구독 매출에서 나갑니다 — 구독 가구가 늘수록 회사와 동행자가 같이 버는 구조입니다.
                  </p>
                </div>
                {/* 8개 제도 */}
                <div className="mt-4 grid gap-2.5 border-t border-navy/[.08] pt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {RETENTION_ITEMS.map((r) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{r.cat}</span>
                        <span className="text-[13px] font-bold text-navy">{r.k}</span>
                        {r.key && <span className="ml-auto rounded-md bg-gold/20 px-1.5 py-0.5 font-num text-[9px] font-bold text-[#7A5C28]">KEY</span>}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-gold">{r.sub}</div>
                      <p className="mt-1 text-[12px] leading-[1.65] text-ink">{r.text}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                        <span>부담 {r.cost}</span>
                        <span className="font-bold text-green">{r.effect}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 실수령 시뮬레이션 */}
                <div className="mt-4 border-t border-navy/[.08] pt-3">
                  <div className="text-[12px] font-bold text-navy">등급별 월 실수령 시뮬레이션 <span className="ml-1 font-medium text-muted">2인 1조 기준 · 모집 공고에 그대로 쓰는 숫자</span></div>
                  <div className="mt-2.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    {PAY_SIM.map((g) => (
                      <div key={g.g} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-bold text-navy">{g.g}</span>
                          <span className="text-[11px] text-muted">{g.mix}</span>
                        </div>
                        <div className="mt-1 font-num text-[21px] font-bold text-navy">{g.v}</div>
                        <div className="mt-0.5 text-[11px] leading-[1.6] text-muted">{g.note}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
                    3.3% 원천징수 전 금액 · 주 동행 142,800 / 부 동행 48,000 기준. 2인 1조라 배차 슬롯이 두 배로 열려 하위 등급도 일할 기회가 늘고, 지분과 수당은 배차량과 무관해 비수기 변동 폭이 건별 매칭의 절반 수준입니다.
                  </p>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {/* 성장 경로 */}
                <Panel className="min-w-0">
                  <PanelHead title="성장 경로 — 현장을 떠나지 않고 올라간다" />
                  <ol className="mt-3 space-y-2.5">
                    {GROWTH_PATH.map(([k, cond, gain], i) => (
                      <li key={k} className="flex items-start gap-3">
                        <span className="mt-[1px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[11px] font-bold text-navy">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <div className="text-[13px] font-bold text-navy">{k} <span className="ml-1 text-[11px] font-medium text-muted">{cond}</span></div>
                          <div className="text-[12px] leading-[1.6] text-ink">{gain}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>

                {/* 보호 규칙 */}
                <Panel className="min-w-0">
                  <PanelHead title="컨시어지 보호 규칙" right={<span className="text-[12px] text-muted">고객이 무조건 옳지는 않습니다</span>} />
                  <div className="mt-3 space-y-2">
                    {PROTECT_RULES.map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="text-[13px] font-bold text-navy">{k}</div>
                        <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    이 규칙은 고객 약관에도 동일하게 명시합니다 — 동행자에게만 약속하고 고객에게 숨기면 현장에서 지켜지지 않습니다.
                  </p>
                </Panel>
              </div>
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

          {/* ════ CS · 마케팅 — 베타 단계: 별도 콘솔 대신 경영 집계 (개별 응대는 CS 도구) ════ */}
          {tab === "cs" && (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="CS 운영 지표" right={<span className="text-[12px] text-muted">개별 응대는 CS 도구 · 여기는 집계</span>} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CS_METRICS.map((c) => (
                    <StatTile key={c.k} k={c.k} v={c.v} note={c.note} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  최고의 CS는 회복 속도입니다 — NPS 비추천 접수는 자동으로 회복 콜 큐에 올라갑니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="자주 묻는 주제 Top 5" right={<span className="text-[12px] text-muted">이번 주 · 제품 개선 신호</span>} />
                <div className="mt-3 space-y-3">
                  {CS_TOPICS.map((t) => (
                    <BarRow key={t.k} label={t.k} value={`${t.n}건`} w={t.w} color={NAVY} />
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  1위가 "바우처 신청 대행" — 동네 소식 피드의 신청 대행 버튼이 여기서 나왔습니다.
                  문의는 기능이 되어야 줄어듭니다.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="유입 채널" right={<span className="text-[12px] text-muted">최근 90일 가입 기준</span>} />
                <div className="mt-3 space-y-2.5">
                  {MKT_CHANNELS.map((m) => (
                    <div key={m.k} className="flex items-baseline gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                      <span className="text-[13px] font-bold text-navy">{m.k}</span>
                      <span className="ml-auto font-num text-[17px] font-bold" style={{ color: m.color }}>
                        {m.v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {MKT_CHANNELS.map((m) => (
                    <div key={m.k} className="text-[11px] text-muted">
                      · {m.k} — {m.note}
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  추천이 최고의 마케팅입니다 — NPS 추천군(9–10)의 초대 링크가 유입 1위 · 획득 비용 0원.
                </p>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="마케팅 운영 원칙" right={<span className="text-[12px] text-muted">심의 · 규정</span>} />
                <p className="mt-3 rounded-xl border border-navy/[.08] bg-white/60 px-4 py-3 text-[13px] leading-[1.75] text-ink">
                  {MKT_RULES}
                </p>
                <p className="mt-3 text-[11px] leading-[1.7] text-muted">
                  케어 서비스의 광고는 신뢰 자산입니다 — 과장 한 줄이 해자(동의 · 접근 공개)를 무너뜨립니다.
                  캠페인 효과는 조치 효과(Closed Loop)와 같은 방식으로 검증 후 표준화합니다.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 명부 — 종합 대시보드 + 유형별 서브메뉴 (어르신·보호자·컨시어지·병원) ════ */}
          {tab === "roster" && (
            <div className="space-y-4">
              {/* 서브 내비 — 명부가 방대해지는 구조라 유형별 분리 관리 */}
              <div className="flex flex-wrap gap-2">
                {ROSTER_SUBS.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setRosterSub(k)}
                    className="btn-press rounded-full border px-4 py-2 text-[13px] font-bold"
                    style={
                      rosterSub === k
                        ? { background: NAVY, color: "#FFFFFF", borderColor: NAVY }
                        : { background: "rgba(255,255,255,.6)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                    }
                  >
                    {label}
                    {k !== "home" && (
                      <span className={`ml-1.5 font-num text-[11px] ${rosterSub === k ? "text-white/60" : "text-muted/70"}`}>
                        {ROSTERS[k].rows.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 종합 — 규모 · 신규 등록 흐름 · 유형별 바로가기 */}
              {rosterSub === "home" && (
                <>
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    {[
                      ["활성 어르신", "132", "명부 표시는 대표 6건"],
                      ["보호자", "241", "주 128 · 부 113"],
                      ["컨시어지", "24", "수습 3 포함"],
                      ["제휴 병원", "6", "패스트트랙 3"],
                    ].map(([k, v, note]) => (
                      <Panel key={k} className="!p-4">
                        <div className="text-[11px] font-bold text-muted">{k}</div>
                        <div className="mt-1 font-num text-[25px] font-bold text-navy">{v}</div>
                        <div className="mt-0.5 text-[11px] text-muted">{note}</div>
                      </Panel>
                    ))}
                  </div>

                  <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                    <Panel className="min-w-0">
                      <PanelHead title="신규 등록 흐름" right={<span className="text-[12px] text-muted">등록일 기준 · 전 명부 통합</span>} />
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          ["오늘", recentRegs(1).length],
                          ["최근 1주", recentRegs(7).length],
                          ["최근 1개월", recentRegs(30).length],
                        ].map(([k, n]) => (
                          <StatTile key={k} k={k} v={`${n}건`} />
                        ))}
                      </div>
                      <div className="mt-3 space-y-2 border-t border-navy/[.08] pt-3">
                        {recentRegs(30).slice(0, 5).map((r) => (
                          <button
                            key={`${r.type}-${r.name}`}
                            onClick={() => setRosterSub(r.sub)}
                            className="flex w-full items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2 text-left hover:bg-navy/[.03]"
                          >
                            <span className="shrink-0 rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">
                              {r.type}
                            </span>
                            <span className="text-[13px] font-bold text-navy">{r.name}</span>
                            <span className="ml-auto font-num text-[11px] text-muted">{r.date}</span>
                          </button>
                        ))}
                        {recentRegs(30).length === 0 && (
                          <p className="py-2 text-center text-[12px] text-muted">최근 1개월 신규 등록이 없습니다.</p>
                        )}
                      </div>
                    </Panel>

                    <Panel className="min-w-0">
                      <PanelHead title="명부 바로가기" right={<span className="text-[12px] text-muted">유형별 검색 · 기간 필터 · 엑셀</span>} />
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {ROSTER_SUBS.filter(([k]) => k !== "home").map(([k, label, icon]) => (
                          <button
                            key={k}
                            onClick={() => setRosterSub(k)}
                            className="btn-press rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3 text-left hover:bg-navy/[.03]"
                          >
                            <div className="flex items-center gap-2 text-navy">
                              <Icon name={icon} size={16} />
                              <span className="text-[13px] font-bold">{label} 명부</span>
                            </div>
                            <div className="mt-1 font-num text-[19px] font-bold text-navy">
                              {ROSTERS[k].rows.length}
                              <span className="ml-1 text-[11px] font-medium text-muted">건 표시</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                        게이팅 원칙 — 명부에는 상세 주소 · 건강 상세가 없습니다 (동 단위 · 상태 라벨까지만).
                        내보낸 파일의 관리 책임은 다운로드한 계정에 있으며, 다운로드 이력은 접근 기록으로 남습니다.
                      </p>
                    </Panel>
                  </div>
                </>
              )}

              {/* 유형별 명부 — 검색 · 기간 필터는 테이블 내장 */}
              {rosterSub !== "home" && (
                <Panel className="min-w-0">
                  <RosterTable roster={ROSTERS[rosterSub]} />
                </Panel>
              )}
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

          {/* ════ 리스크 · 컴플라이언스 — 거버넌스 (무엇이 회사를 멈추게 하는가) ════ */}
          {tab === "risk" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[17px] font-bold text-navy">무엇이 회사를 멈추게 하는가</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  발생확률 × 영향도로 정렬하고, 완화되지 않은 항목은 착수를 막습니다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                {RC_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[25px] font-bold" style={{ color: k.color }}>{k.v}</div>
                  </Panel>
                ))}
              </div>

              {/* 의료법 조항별 준수 */}
              <Panel className="min-w-0">
                <PanelHead title="의료법 준수 재점검 — 조항별" right={<span className="text-[12px] font-bold text-danger">위반 소지 1건 · 조건부 3건</span>} />
                <p className="mt-2 text-[12px] leading-[1.7] text-muted">비의료인이 운영하는 플랫폼은 이 8개 조항 위에서만 존재할 수 있습니다.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">조항</th>
                        <th className="py-2 pr-4">우리 서비스의 접점</th>
                        <th className="py-2 pr-4">지금 지키는 방법</th>
                        <th className="py-2">판정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MEDLAW_ROWS.map((r) => (
                        <tr key={r.law} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            <div className="font-bold text-navy">{r.law}</div>
                            <div className="text-[11px] text-muted">{r.sub}</div>
                          </td>
                          <td className="py-2.5 pr-4 text-ink">{r.touch}</td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-muted">{r.how}</td>
                          <td className="whitespace-nowrap py-2.5">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[r.tone].fg, background: TONE[r.tone].bg }}>{r.verdict}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* 최우선 시정 */}
              <div className="rounded-[14px] border border-danger/25 bg-danger/[.06] p-[18px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">최우선 시정</span>
                  <span className="text-[14px] font-bold text-navy">{MEDLAW_FIX.title}</span>
                </div>
                <p className="mt-2 text-[12px] leading-[1.7] text-ink">{MEDLAW_FIX.why}</p>
                <ol className="mt-2.5 space-y-1.5">
                  {MEDLAW_FIX.steps.map((st, i) => (
                    <li key={st} className="flex items-start gap-2 text-[12px] leading-[1.6] text-ink">
                      <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-danger font-num text-[10px] font-bold text-white">{i + 1}</span>
                      {st}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 현장 행위 경계선 */}
              <Panel className="min-w-0">
                <PanelHead title="현장 행위 경계선 — 컨시어지" right={<span className="text-[12px] text-muted">위반은 본사가 아니라 현장에서 발생합니다</span>} />
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-green/25 bg-green/[.05] p-3.5">
                    <div className="text-[12px] font-bold text-green">할 수 있다</div>
                    <ul className="mt-2 space-y-1.5">
                      {FIELD_CAN.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] leading-[1.6] text-ink">
                          <span className="mt-[2px] shrink-0 text-[11px] font-bold text-green">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/[.04] p-3.5">
                    <div className="text-[12px] font-bold text-danger">절대 안 된다</div>
                    <ul className="mt-2 space-y-1.5">
                      {FIELD_CANT.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] leading-[1.6] text-ink">
                          <span className="mt-[2px] shrink-0 text-[11px] font-bold text-danger">✕</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  이 경계선은 인원 관리 화면의 서약·교육 이수 항목과 연결되어 있고, 미이수자는 배차에서 자동 제외됩니다.
                </p>
              </Panel>

              {/* 리스크 매트릭스 + 레지스터 */}
              <Panel className="min-w-0">
                <PanelHead title="리스크 레지스터 · 23건" right={<span className="text-[12px] text-muted">발생 가능성 × 영향 · 등급 · 완화 조치 · 담당</span>} />
                {/* 매트릭스 — 3×3 그리드 배치 */}
                <div className="mt-3 grid grid-cols-[24px_1fr] gap-1">
                  <div className="flex items-center justify-center">
                    <span className="rotate-180 text-[10px] font-bold tracking-[.1em] text-muted" style={{ writingMode: "vertical-rl" }}>↑ 영향 큼</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[3, 2, 1].map((impactBand) =>
                      [1, 2, 3].map((probBand) => {
                        const band = (v) => (v >= 3 ? 3 : v >= 2.3 ? 2 : 1);
                        const items = RISK_REGISTER.filter((r) => band(r.impact) === impactBand && r.prob === probBand);
                        const heat =
                          impactBand + probBand >= 5 ? "rgba(192,57,43,.10)" : impactBand + probBand >= 4 ? "rgba(138,93,18,.08)" : "rgba(10,31,60,.03)";
                        return (
                          <div key={`${impactBand}-${probBand}`} className="min-h-[64px] rounded-lg p-1.5" style={{ background: heat }}>
                            <div className="flex flex-wrap gap-1">
                              {items.map((r) => (
                                <span
                                  key={r.id}
                                  title={r.name}
                                  className="rounded-md px-1.5 py-0.5 font-num text-[10px] font-bold"
                                  style={r.state === "미완화" ? { background: "#C0392B", color: "#fff" } : { background: "rgba(10,31,60,.1)", color: "#0A1F3C" }}
                                >
                                  {r.id}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div className="col-span-3 flex justify-between px-1 text-[10px] font-bold text-muted">
                      <span>낮음</span><span>중간</span><span>높음 · 발생 가능성 →</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-[1.6] text-muted">
                  등록부 23건 전체를 발생 가능성 × 영향으로 배치했습니다. 우상단에 남은 항목과 <span className="font-bold text-danger">미완화(빨강)</span> 항목이 착수 게이트를 막고 있는 리스크입니다.
                </p>
                {/* 레지스터 테이블 */}
                <div className="mt-3 overflow-x-auto border-t border-navy/[.08] pt-3">
                  <table className="w-full min-w-[860px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-3">등급</th>
                        <th className="py-2 pr-4">리스크</th>
                        <th className="py-2 pr-4">완화 조치</th>
                        <th className="py-2 pr-4">담당</th>
                        <th className="py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RISK_REGISTER.map((r) => (
                        <tr key={r.id} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2.5 pr-3">
                            <span className="rounded-md px-1.5 py-0.5 font-num text-[10px] font-bold" style={r.id.startsWith("C") ? { background: "rgba(192,57,43,.1)", color: "#C0392B" } : r.id.startsWith("H") ? { background: "rgba(138,93,18,.12)", color: "#8A5D12" } : { background: "rgba(10,31,60,.06)", color: "#0A1F3C" }}>{r.id}</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="font-bold text-navy">{r.name}</div>
                            <div className="text-[11px] text-muted">{r.detail}</div>
                          </td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-muted">{r.act}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-ink">{r.owner}</td>
                          <td className="whitespace-nowrap py-2.5">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: RISK_STATE_STYLE[r.state].fg, background: RISK_STATE_STYLE[r.state].bg }}>{r.state}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] font-bold leading-[1.7] text-danger">
                  CRITICAL 항목이 '완화됨'이 되기 전에는 해당 사업 영역의 착수 승인을 내리지 않습니다 — 인바운드 유치업 등록이 대표 사례입니다.
                </p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {/* 보험 · 배상 */}
                <Panel className="min-w-0">
                  <PanelHead title="보험 · 배상 체계" />
                  <div className="mt-3 space-y-2.5">
                    {INSURANCE_ROWS.map((r) => (
                      <div key={r.k} className="flex items-baseline gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-navy">{r.k}</div>
                          <div className="text-[11px] text-muted">{r.sub}</div>
                        </div>
                        <span className="ml-auto shrink-0 font-num text-[15px] font-bold text-navy">{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    동행 중 낙상 1건의 평균 배상은 320만원 — 연 12건 가정 시 보험료 대비 손해율 61%로 관리 가능 범위입니다.
                  </p>
                </Panel>

                {/* 규제 준수 캘린더 */}
                <Panel className="min-w-0">
                  <PanelHead title="규제 준수 캘린더" right={<span className="text-[12px] text-muted">CPO 분기 감사 · 위반 시 킬 스위치</span>} />
                  <div className="mt-3 space-y-2">
                    {REG_CALENDAR.map((c) => (
                      <div key={c.m + c.k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                        <span className="mt-0.5 w-[52px] shrink-0 font-num text-[11px] font-bold text-navy">{c.m}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold leading-[1.5] text-navy">{c.k}</div>
                          <div className="text-[11px] text-muted">{c.law}</div>
                        </div>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[c.tone].fg, background: TONE[c.tone].bg }}>{c.state}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    CPO가 분기별 내부 감사를 수행하고, 위반 발견 시 해당 기능을 즉시 중단하는 킬 스위치를 운영합니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}
        </div>
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
