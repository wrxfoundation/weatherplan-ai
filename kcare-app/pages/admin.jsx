import Head from "next/head";
import Logo from "../components/Logo";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PendingTag } from "../components/ui";
import AiChat from "../components/AiChat";
import HelpTip from "../components/HelpTip";
import Icon from "../components/icons";
import RosterTable from "../components/RosterTable";
import MobileSectionNav from "../components/MobileSectionNav";
import StaggerIn from "../components/StaggerIn";
import { ROSTERS, ROSTER_CHECKS, ROSTER_ACCESS, searchAll } from "../lib/rosters";
import {
  LIFECYCLE_STAGES,
  EXEC_BRIEF,
  NPS_LOOP,
  CARE_OUTCOMES,
  PEOPLE_KPIS,
} from "../lib/mock";
import {
  ADMIN_AI_QA,
  ADMIN_COHORTS,
  ADMIN_SLA,
  ACTION_RESULTS,
  CHURN_BANDS,
  CHURN_FACTORS,
  NBA_QUEUE,
  COACHING_LOG,
  CHURN_SEGMENTS,
  ELDER_MIX,
  ELDER_RISK_MIX,
  FAMILY_ENGAGE,
  FAMILY_FUNNEL,
  INCENTIVE_MIX,
  REVENUE_STREAMS,
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
  BRANCH_MANAGERS,
  MGR_RHYTHM,
  MGR_CAN,
  MGR_CANT,
  AI_PEOPLE_SIGNALS,
  AI_PEOPLE_SPLIT,
  PEOPLE_MAP,
  SEC_KPIS,
  SEC_CLASSES,
  SEC_MATRIX,
  SEC_TECH,
  SEC_AI_RULES,
  SEC_LIFECYCLE,
  SEC_INCIDENT,
  SEC_STATUS,
  EXEC_OVERVIEW,
  CRM_FUNNEL,
  CRM_STUCK,
  HIRE_STUCK_STAGES,
  HIRE_STUCK,
  CASH_KPIS,
  CASH_IN,
  CASH_OUT,
  CASH_FLOW_STEPS,
  CORP_CARDS,
  CARD_ALERTS,
  SETTLE_CYCLE,
  AR_ITEMS,
  OKR_QUARTER,
  OKRS,
  MARKET_SIZE,
  COMPETITORS,
  MILESTONES,
  GROWTH_KPIS,
  VIRAL_LOOP,
  LOOP_BOTTLENECK,
  CHANNELS,
  UNIT_ECON,
  EXPERIMENTS,
  PRODUCT_KPIS,
  RELEASES,
  TECH_DEBT,
  FEATURE_COVERAGE,
  IR_KPIS,
  IR_METRICS,
  IR_STATE,
  IR_PROOF,
  IR_LTV_DEF,
  IR_PROOFS,
  IR_PROOF_AI,
  IR_GAPS,
  AI_STAGE_NOW,
  AI_STAGES,
  AI_ASSETS,
  AI_LOCKED,
  AI_ACCURACY,
  AI_RULES,
  AI_AXES,
  AI_MULTIPLY,
  AI_MODEL_POLICY,
  AI_EVIDENCE,
  REC_DEVICES,
  REC_COMPARE,
  REC_SCALE,
  REC_HYBRID,
  GLASS_MODES,
  GLASS_RETENTION,
  GLASS_TRANSFER,
  GLASS_FIELD,
  GLASS_ONLY,
  REC_PHASES,
  CAP_TABLE,
  ROUNDS,
  DATAROOM,
  IR_UPDATE,
  PARTNER_KPIS,
  PARTNER_PORTFOLIO,
  B2G_PIPELINE,
  PARTNER_RULES,
  PRICING_KPIS,
  PLANS,
  OPTIONS_CATALOG,
  PRICING_DECISIONS,
  PRICING_UNIT,
  REV_DEF,
  PROFIT_SPLIT,
  GOVERNANCE,
  PL_KPIS,
  PL_ROWS,
  BUDGET_ALERTS,
  SCENARIOS,
  EXEC_PRIORITY,
  PRIORITY_TONE,
} from "../lib/console";
import {
  LIFECYCLE_HEAD,
  GUARDIANSHIP,
  BEREAVEMENT,
  MISSING,
  ABUSE,
  WITHDRAWAL,
  GRIEVANCE,
  CONSENT_WITHDRAW,
} from "../lib/lifecycle";

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
// 좌측 GNB — 그룹으로 묶어 17개 섹션을 탐색 가능하게
// 좌측 GNB — 긴급도·확인 빈도 순 (매일 → 주간 → 월간 → 분기). 그룹 라벨에 주기를 표기해
// "지금 봐야 할 것"이 위에 오도록 정렬한다. 4번째 값 true = 숨김(코드는 유지).
const MENU_GROUPS = [
  ["매일", [
    ["dash", "대시보드", "home"],
    ["branches", "지점 현황", "pin"],
  ]],
  ["주간 · 사람", [
    ["staffmgmt", "인원 관리", "user"],
    ["staff", "컨시어지 분석", "heart"],
  ]],
  ["주간 · 고객", [
    ["crm", "CRM · 라이프사이클", "activity"],
    ["cs", "CS · 문의", "megaphone"],
    ["family", "보호자 · 가구", "users"],
  ]],
  ["월간 · 성장 · 돈", [
    ["growth", "그로스 · 바이럴", "trend"],
    ["pricing", "가격 · 상품", "bag"],
    ["cash", "자금 흐름", "coin"],
    ["pl", "예산 · 손익", "chart"],
  ]],
  ["월간 · 품질 · 제휴", [
    ["care", "케어 성과", "plus"],
    ["partners", "파트너 · 제휴", "diamond"],
    ["product", "제품 · 로드맵", "box"],
  ]],
  ["분기 · 전략 · 거버넌스", [
    ["strategy", "전략 · OKR", "target"],
    ["risk", "리스크 · 컴플라이언스", "alert"],
    ["security", "보안 · 데이터", "shield"],
    ["lifecycle", "생애주기 · 법정절차", "heart"],
  ]],
  ["상시 조회", [
    ["roster", "명부", "doc"],
    ["ir", "투자 · IR", "chart", true],
  ]],
];
const GROUP_OF = Object.fromEntries(MENU_GROUPS.flatMap(([g, items]) => items.map(([k]) => [k, g])));

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
  const [tab, setTab] = useState("dash"); // 랜딩 = 전체 포괄 대시보드
  const [rosterSub, setRosterSub] = useState("home"); // 명부 서브메뉴 — 종합/어르신/보호자/컨시어지/병원
  const [smOpen, setSmOpen] = useState(false); // 인원 관리 — 프로필 카드 열림 (데모: 박지현 기준)
  const [renewSent, setRenewSent] = useState(false); // 자격 갱신 안내 원샷
  const [psDone, setPsDone] = useState({}); // AI 사람 신호 — 담당 배정 원샷
  const [funnelStage, setFunnelStage] = useState("pay"); // CRM 퍼널 정체 — 선택 단계 (기본: 최대 이탈 구간)
  const [stuckDone, setStuckDone] = useState({}); // 정체 가구 대응 배정 원샷
  const [hireStage, setHireStage] = useState("bg"); // 채용 정체 — 선택 단계 (기본: 최대 정체)
  const [hireDone, setHireDone] = useState({}); // 채용 정체 처리 원샷
  const [nbaDone, setNbaDone] = useState({}); // NBA 큐 — 담당 배정 원샷
  const [execRead, setExecRead] = useState(false); // 주간 브리핑 읽음
  // 좌측 GNB 접기/펴기 — 그룹 단위. 섹션이 17개라 안 보는 주기는 접어 두는 게 기본 사용법이다.
  const [navOpen, setNavOpen] = useState(() => Object.fromEntries(MENU_GROUPS.map(([g]) => [g, true])));
  const [rosterQ, setRosterQ] = useState(""); // 명부 통합 검색어
  const [subQ, setSubQ] = useState(""); // 유형별 명부로 이월되는 검색어
  const [subView, setSubView] = useState(null); // 품질 점검에서 넘어온 빠른 필터

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kcare-admin-nav-v1"));
      if (saved && typeof saved === "object") setNavOpen((o) => ({ ...o, ...saved }));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("kcare-admin-nav-v1", JSON.stringify(navOpen));
    } catch {}
  }, [navOpen]);
  // 다른 화면에서 섹션으로 점프하면(이번 주 챙길 일 등) 그 그룹은 자동으로 펴진다.
  // 단 첫 렌더는 제외 — "모두 접기" 상태로 다시 들어왔을 때 한 그룹만 멋대로 펴지지 않게.
  const navFirst = useRef(true);
  useEffect(() => {
    if (navFirst.current) {
      navFirst.current = false;
      return;
    }
    const g = GROUP_OF[tab];
    if (g) setNavOpen((o) => (o[g] ? o : { ...o, [g]: true }));
  }, [tab]);

  // 좌측 메뉴로 섹션을 바꾸면 본문은 항상 맨 위에서 시작한다 —
  // 긴 섹션을 보다가 다른 섹션으로 가면 중간부터 보이던 문제.
  const scrollFirst = useRef(true);
  useEffect(() => {
    if (scrollFirst.current) {
      scrollFirst.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab, rosterSub]);

  const allFolded = MENU_GROUPS.every(([g]) => !navOpen[g]);
  const hits = useMemo(() => searchAll(rosterQ), [rosterQ]);
  const openRoster = (sub, view = null, q = "") => {
    setRosterSub(sub);
    setSubView(view);
    setSubQ(q);
    setTab("roster");
  };
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
        <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col lg:flex" style={{ background: NAVY }}>
          <div className="px-5 pt-5">
            <Logo height={30} tone="onDark" beta />
            <div className="mt-1 text-[11px] font-bold tracking-[.14em] text-white/40">경영 콘솔 · 사람 관리</div>
          </div>
          <nav className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            <button
              onClick={() =>
                setNavOpen(Object.fromEntries(MENU_GROUPS.map(([g]) => [g, allFolded])))
              }
              className="btn-press mb-0.5 flex w-full items-center justify-center gap-1.5 rounded-[9px] border border-white/10 py-1.5 text-[11px] font-bold text-white/45"
            >
              {allFolded ? "모두 펴기" : "모두 접기"}
              <Icon name="chev" size={12} className={allFolded ? "-rotate-90" : ""} />
            </button>
            {MENU_GROUPS.map(([group, items]) => {
              const vis = items.filter(([, , , hidden]) => !hidden);
              if (!vis.length) return null;
              const open = !!navOpen[group];
              const here = vis.some(([k]) => k === tab);
              return (
                <div key={group}>
                  <button
                    onClick={() => setNavOpen((o) => ({ ...o, [group]: !open }))}
                    aria-expanded={open}
                    className="flex w-full items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[10px] font-bold tracking-[.14em] text-white/25 hover:bg-white/[.05] hover:text-white/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-left">{group}</span>
                    {!open && here && <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-gold" />}
                    {!open && <span className="font-num text-[10px] text-white/25">{vis.length}</span>}
                    <Icon name="chev" size={13} className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
                  </button>
                  <div className={`smooth-open ${open ? "is-open" : ""}`}>
                    <div>
                    <div className="space-y-0.5">
                      {vis.map(([k, label, icon]) => (
                        <button
                          key={k}
                          onClick={() => setTab(k)}
                          className="btn-press flex w-full items-center gap-2.5 rounded-[10px] border-l-[3px] px-3 py-[7px] text-left text-[13px] font-bold"
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
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="border-t border-white/10 px-5 py-3">
            <p className="text-[10px] leading-[1.5] text-white/35">집계 전용 콘솔 — 개별 사건 개입은 관제 · CS 소관</p>
            <Link href="/" className="btn-press mt-2.5 block rounded-[10px] border border-white/20 py-2 text-center text-[12px] font-bold text-white/80">데모 홈</Link>
          </div>
        </aside>

        {/* 랜드마크 — 이 파일은 3,000줄대라 태그를 <main> 으로 바꾸면 짝을 잘못 맞출
            위험이 크다. role="main" 은 보조기기에 같은 랜드마크로 전달되고
            구조를 건드리지 않는다. 파일을 쪼갤 때 <main> 으로 바꾼다. */}
        <div role="main" className="min-w-0 flex-1 px-4 pb-10 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1240px] space-y-4">
          {/* ── 헤더 — 실시간 사건 티커 없음 (의도) ── */}
          {/* 콘텐츠 제목 영역 — 페이지 배너가 아니다.
              <header> 로 두면 banner 랜드마크로 잡히는데, 이 파일은 role="main"
              (속성)이라 <main> 요소처럼 배너 매핑을 막아 주지 못한다. 그래서
              본문 안에 배너가 중첩된 것으로 보고된다 (axe: landmark-banner-is-top-level). */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-[.16em] text-muted">
                역할 05 / 관리자 · 경영
              </span>
              <Link href="/" className="tap text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">
                데모 홈
              </Link>
            </div>
            <h1 className="mt-0.5 text-[29px] font-bold tracking-[-.01em] text-navy">사람 · 경영 총괄</h1>
          </div>

          {/* 모바일 — 현재 섹션 표시 + 눌러서 그룹 목록 (칩 18개를 옆으로 미는 것보다 빠르다) */}
          <MobileSectionNav groups={MENU_GROUPS} current={tab} onSelect={setTab} />

          {/* ════ 대시보드 — 전체 포괄 (사람 KPI · 주간 브리핑 · 섹션 요약) ════ */}
          {/* 섹션 본문 — 좌측 메뉴로 바꾸면 스르르 올라오며 들어온다 (key로 애니메이션 재생) */}
          <StaggerIn trigger={tab} className="space-y-4">
          {tab === "dash" && (
            <div className="space-y-4">
              <p className="max-w-[84ch] text-[14px] leading-[1.75] text-muted">
                관제가 현장을 본다면, 경영은 사람을 봅니다 — 컨시어지 · 보호자 · 어르신의 관리와 분석.
                이 화면은 집계만 봅니다. 개별 SOS · 사건은 관제 소관이며 실시간 티커를 두지 않습니다 —
                경영이 개별 사건에 개입하지 않기 위한 설계입니다.
              </p>
              {/* 이번 주 챙길 일 — 전 섹션 긴급 항목을 한 곳에 (긴급도 순) */}
              <Panel className="min-w-0">
                <PanelHead
                  title="이번 주 챙길 일"
                  right={<span className="text-[12px] text-muted">전 섹션 긴급 항목 통합 · 클릭하면 해당 섹션으로</span>}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["now", "soon", "watch"].map((u) => (
                    <span key={u} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: PRIORITY_TONE[u].fg, background: PRIORITY_TONE[u].bg }}>
                      {PRIORITY_TONE[u].label} {EXEC_PRIORITY.filter((x) => x.u === u).length}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {EXEC_PRIORITY.map((x) => (
                    <button
                      key={x.k}
                      onClick={() => setTab(x.menu)}
                      className="btn-press flex w-full flex-col items-start gap-1.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5 text-left hover:bg-navy/[.03] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5"
                    >
                      {/* 모바일: 배지+제목 / 사유 / 담당·이동 3줄로 쌓고, sm 이상에서 한 줄로 */}
                      <span className="flex items-center gap-2 sm:contents">
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: PRIORITY_TONE[x.u].fg, background: PRIORITY_TONE[x.u].bg }}>
                          {PRIORITY_TONE[x.u].label}
                        </span>
                        <span className="text-[13px] font-bold text-navy">{x.k}</span>
                      </span>
                      <span className="min-w-0 w-full text-[12px] leading-[1.5] text-muted sm:w-auto sm:flex-1">{x.why}</span>
                      <span className="flex w-full items-center gap-2 sm:contents">
                        <span className="shrink-0 text-[11px] font-bold text-muted">{x.who}</span>
                        <span className="ml-auto shrink-0 text-[11px] font-bold text-gold sm:ml-0">{x.label} →</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  좌측 메뉴는 확인 주기 순입니다 — 매일(대시보드 · 지점) → 주간(사람 · 고객) → 월간(성장 · 돈 · 품질) → 분기(전략 · 거버넌스).
                </p>
              </Panel>

          {/* 사람 KPI — 대시보드 전용 (섹션 반복 제거) */}
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
              <Link
                href="/report/exec"
                className="btn-press ml-auto rounded-[10px] border border-navy/20 px-3.5 py-1.5 text-[12px] font-bold text-navy"
              >
                월간 리포트 PDF
              </Link>
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

              {/* 섹션 요약 — 전 메뉴 한눈에 · 클릭 이동 */}
              <Panel className="min-w-0">
                <PanelHead title="섹션 요약" right={<span className="text-[12px] text-muted">각 카드를 클릭하면 해당 섹션으로 이동합니다</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
                  {EXEC_OVERVIEW.map((o) => (
                    <button
                      key={o.menu}
                      onClick={() => setTab(o.menu)}
                      className="btn-press rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3 text-left hover:bg-navy/[.03]"
                    >
                      <div className="text-[12px] font-bold text-gold">{o.label}</div>
                      <div className="mt-0.5 font-num text-[15px] font-bold text-navy">{o.headline}</div>
                      <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{o.sub}</div>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          )}

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

              {/* AI 사람 신호 — 교차 감지는 AI, 인사 결정은 사람 (L4 인사 원칙) */}
              <Panel className="min-w-0">
                <PanelHead
                  title={<><span className="mr-2 rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">AI</span>사람 신호 — 교차 감지</>}
                  right={<span className="text-[12px] text-muted">AI는 신호 교차·제안까지 · 면담·배정·징계는 항상 사람 (L4 인사)</span>}
                />
                <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {AI_PEOPLE_SIGNALS.map((sg) => (
                    <div key={sg.id} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                      <div className="text-[13px] font-bold text-navy">{sg.who}</div>
                      <p className="mt-1 text-[12px] leading-[1.6] text-muted">{sg.cross}</p>
                      <p className="mt-1 text-[12px] font-bold leading-[1.6] text-ink">제안 — {sg.suggest}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => setPsDone((v) => ({ ...v, [sg.id]: true }))}
                          disabled={!!psDone[sg.id]}
                          className="btn-press rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                        >
                          {psDone[sg.id] ? `${sg.owner} 배정됨 ✓` : `${sg.owner} 배정`}
                        </button>
                        <button
                          onClick={() => setTab(sg.menu)}
                          className="btn-press rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-navy"
                        >
                          {sg.menuLabel} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2.5 border-t border-navy/[.08] pt-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-navy/[.04] px-3.5 py-2.5">
                    <div className="text-[11px] font-bold text-gold">AI가 돕는 것</div>
                    <ul className="mt-1 space-y-0.5">
                      {AI_PEOPLE_SPLIT.ai.map((x) => (
                        <li key={x} className="text-[12px] leading-[1.6] text-ink">· {x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-navy/[.04] px-3.5 py-2.5">
                    <div className="text-[11px] font-bold text-navy">사람이 정하는 것</div>
                    <ul className="mt-1 space-y-0.5">
                      {AI_PEOPLE_SPLIT.human.map((x) => (
                        <li key={x} className="text-[12px] leading-[1.6] text-ink">· {x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>

              {/* 사람 관리 체계 맵 — 흩어진 사람 기능의 단계별 정돈 (메뉴 점프) */}
              <Panel className="min-w-0">
                <PanelHead title="사람 관리 체계 맵" right={<span className="text-[12px] text-muted">채용 → 온보딩 → 운영 → 성장 → 보호 · 클릭하면 담당 화면으로</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                  {PEOPLE_MAP.map((m, i) => (
                    <button
                      key={m.stage}
                      onClick={() => setTab(m.menu)}
                      className="btn-press rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3 text-left hover:bg-navy/[.03]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[13px] font-bold text-navy">{m.stage}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">{m.what}</p>
                      <div className="mt-1.5 text-[11px] font-bold text-gold">{m.label} →</div>
                    </button>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  전 단계 공통 — 판매액 지표 없음 · 모든 열람 기록 공개 · 인사 결정은 사람. 배차·현장 개입은 관제 콘솔 소관입니다.
                </p>
              </Panel>

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

              {/* ── 지점장 보드 — 지점을 맡은 사람을 관리한다 ── */}
              <Panel className="min-w-0">
                <PanelHead title="지점장 보드" right={<span className="text-[12px] text-muted">지점장 평가도 사람 지표만 — 팀 유지율 · 팀 평점 · 소리 응답 SLA · 페어 준수</span>} />
                <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                  {BRANCH_MANAGERS.map((m) => (
                    <div key={m.name} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-navy text-[13px] font-bold text-white">{m.name[0]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-bold text-navy">{m.name}</span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                              style={
                                m.tone === "ok" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" }
                                : m.tone === "warn" ? { color: "#8A5D12", background: "rgba(138,93,18,.12)" }
                                : { color: "#7A5C28", background: "rgba(176,141,87,.16)" }
                              }
                            >
                              {m.state}
                            </span>
                          </div>
                          <div className="truncate text-[11px] text-muted">{m.branch} · {m.career}</div>
                        </div>
                      </div>
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                        {[["팀", `${m.team || "—"}명`], ["팀 유지율", m.keep], ["팀 평점", m.rate]].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-navy/[.04] px-1.5 py-1.5 text-center">
                            <div className="text-[9px] font-bold text-muted">{k}</div>
                            <div className="font-num text-[13px] font-bold text-navy">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 flex gap-1.5 text-[10px] text-muted">
                        <span>재직 {m.tenure}</span>
                        <span>· 소리 응답 {m.sla}</span>
                      </div>
                      <p className="mt-1.5 border-t border-navy/[.06] pt-1.5 text-[11px] leading-[1.6] text-ink">
                        <span className="font-bold text-gold">이번 주 — </span>{m.focus}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2.5 border-t border-navy/[.08] pt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  <div>
                    <div className="text-[12px] font-bold text-navy">지점장 운영 리듬</div>
                    <div className="mt-2 space-y-1.5">
                      {MGR_RHYTHM.map(([k, v]) => (
                        <div key={k} className="text-[12px] leading-[1.6] text-ink">
                          <span className="font-bold text-navy">{k}</span> <span className="text-muted">— {v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-green/[.05] px-3.5 py-2.5">
                    <div className="text-[11px] font-bold text-green">지점장이 할 수 있다</div>
                    <ul className="mt-1 space-y-0.5">
                      {MGR_CAN.map((x) => (
                        <li key={x} className="text-[11px] leading-[1.6] text-ink">✓ {x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-danger/[.04] px-3.5 py-2.5">
                    <div className="text-[11px] font-bold text-danger">지점장도 할 수 없다</div>
                    <ul className="mt-1 space-y-0.5">
                      {MGR_CANT.map((x) => (
                        <li key={x} className="text-[11px] leading-[1.6] text-ink">✕ {x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  지점장 권한도 시스템이 강제합니다 — 평점 수정·단독 배차 예외·EAP 기록 열람은 권한 자체가 없습니다.
                  내부 승격(분당 최윤희)이 기본 경로입니다: 시니어 → 코치 → 지점장.
                </p>
              </Panel>
            </div>
          )}

          {/* ════ 전략 · OKR — 분기 목표 · 시장 · 경쟁 · 마일스톤 ════ */}
          {tab === "strategy" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 전략 · 목표</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">전략 · OKR — {OKR_QUARTER}</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  목표는 4개까지만 둡니다 — 다 하려다 아무것도 못 하는 것이 스케일업의 첫 실패입니다.
                </p>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                {OKRS.map((o, i) => (
                  <Panel key={o.o} className="min-w-0">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-[1px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[11px] font-bold text-navy">O{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold leading-[1.5] text-navy">{o.o}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-navy/[.08]">
                            <div className="h-full rounded-full" style={{ width: `${o.progress}%`, background: o.progress >= 70 ? "#1E7A5A" : o.progress >= 45 ? "#8A5D12" : "#C0392B" }} />
                          </div>
                          <span className="font-num text-[12px] font-bold text-navy">{o.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-navy/[.08] pt-3">
                      {o.krs.map((kr) => (
                        <div key={kr.k}>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[12px] font-bold text-navy">{kr.k}</span>
                            <span className="ml-auto shrink-0 text-[11px] font-bold" style={{ color: TONE[kr.tone].fg }}>{kr.now}</span>
                          </div>
                          <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-navy/[.06]">
                            <div className="h-full rounded-full" style={{ width: `${kr.pct}%`, background: TONE[kr.tone].fg }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>

              {/* ── IR 지표 — 투자자가 실제로 언더라이팅하는 것 ── */}
              <Panel>
                <PanelHead
                  title="투자자가 보는 지표"
                  right={
                    <span className="text-[12px] text-muted">
                      기준선 대비 판정 + 증빙 등급 · 눌러서 해당 섹션으로
                    </span>
                  }
                />
                <p className="mt-2 max-w-[92ch] text-[12px] leading-[1.75] text-muted">
                  라운드는 지표가 좋아서가 아니라 <b className="text-navy">증명되는 지표가 있어서</b> 만들어집니다.
                  그래서 값과 함께 기준선 충족 여부, 그리고 지금 당장 로그로 제출할 수 있는지(증빙 등급)를 같이 둡니다 —
                  부풀린 숫자 하나가 나머지 숫자 전부의 신뢰를 깎습니다.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.entries(IR_PROOF).map(([k, t]) => (
                    <span
                      key={k}
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {t.label} — {t.desc}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-3.5">
                  {IR_METRICS.map(([group, items]) => (
                    <div key={group}>
                      <div className="text-[11px] font-bold tracking-[.12em] text-muted">{group}</div>
                      <div className="mt-1.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                        {items.map((m) => {
                          const st = IR_STATE[m.state];
                          const pr = IR_PROOF[m.proof];
                          return (
                            <button
                              key={m.k}
                              onClick={() => setTab(m.menu)}
                              className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5 text-left hover:bg-navy/[.03]"
                            >
                              <div className="flex items-baseline gap-2">
                                <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-navy">{m.k}</span>
                                <span className="shrink-0 font-num text-[15px] font-bold" style={{ color: st.fg }}>
                                  {m.v}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{ background: st.bg, color: st.fg }}
                                >
                                  {st.label} · 기준 {m.base}
                                </span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{ background: pr.bg, color: pr.fg }}
                                >
                                  {pr.label}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">{m.why}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 rounded-xl border border-navy/[.08] bg-white/50 p-3">
                  <div className="text-[12px] font-bold text-navy">지표 정의 — LTV는 두 값이 있고, IR에서는 하나만 씁니다</div>
                  <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {IR_LTV_DEF.map((d) => (
                      <div key={d.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12px] font-bold text-navy">{d.k}</span>
                          <span className="ml-auto font-num text-[14px] font-bold text-navy">{d.v}</span>
                        </div>
                        <div className="mt-1 text-[11px] leading-[1.6] text-muted">{d.how}</div>
                        <div className="mt-1 text-[11px] font-bold" style={{ color: "#8A5D12" }}>{d.use}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
                    슬라이드마다 다른 LTV가 나오는 것이 실사에서 가장 흔한 사고입니다 — 정의를 하나로 고정하고,
                    자료 어디서든 같은 산식만 씁니다.
                  </p>
                </div>
              </Panel>

              <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                {/* 우리만 증명 가능한 것 — 어필의 실체 */}
                <Panel className="min-w-0">
                  <PanelHead
                    title="우리만 증명할 수 있는 것"
                    right={<span className="text-[12px] text-muted">잘 살리면 그대로 라운드의 논거</span>}
                  />
                  <div className="mt-3 space-y-2.5">
                    {[...IR_PROOFS, IR_PROOF_AI].map((pf, i) => (
                      <div key={pf.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold leading-[1.5] text-navy">{pf.k}</div>
                            <div className="mt-1 font-num text-[14px] font-bold text-green">{pf.v}</div>
                          </div>
                        </div>
                        <p className="mt-2 text-[12px] leading-[1.7] text-muted">{pf.body}</p>
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-navy/[.04] px-3 py-2">
                          <span className="shrink-0 text-[10px] font-bold text-gold">지금부터 기록</span>
                          <span className="text-[11px] leading-[1.6] text-ink">{pf.keep}</span>
                        </div>
                        <button
                          onClick={() => setTab(pf.menu)}
                          className="btn-press mt-2 text-[11px] font-bold text-navy underline decoration-navy/20 underline-offset-2"
                        >
                          해당 섹션에서 보기 →
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 실사 전에 메울 것 */}
                <Panel className="min-w-0">
                  <PanelHead
                    title="실사 전에 메울 것"
                    right={<span className="text-[12px] text-muted">지금 안 채우면 라운드에서 깎이는 것</span>}
                  />
                  <div className="mt-3 space-y-2">
                    {IR_GAPS.map((g) => (
                      <button
                        key={g.k}
                        onClick={() => setTab(g.menu)}
                        className="block w-full rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5 text-left hover:bg-navy/[.03]"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 text-[13px] font-bold text-navy">{g.k}</span>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 font-num text-[10px] font-bold"
                            style={{ background: TONE[g.tone].bg, color: TONE[g.tone].fg }}
                          >
                            {g.when}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-[1.6]" style={{ color: TONE[g.tone].fg }}>
                          {g.risk}
                        </p>
                        <p className="mt-1 text-[11px] leading-[1.6] text-muted">→ {g.fix}</p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    다섯 중 셋은 지표가 아니라 기록의 문제입니다 — 지금부터 남기지 않으면 나중에 만들 수 없습니다.
                  </p>
                </Panel>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="시장 규모 — TAM · SAM · SOM" right={<span className="text-[12px] text-muted">3년 목표 기준</span>} />
                  <div className="mt-3 space-y-3">
                    {MARKET_SIZE.map((m) => (
                      <BarRow key={m.k} label={m.k} value={m.v} w={m.w} color="#B08D57" note={m.note} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    SOM은 지점 확장 속도에 종속됩니다 — 인력 수급(채용 퍼널)이 곧 시장 점유 속도입니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="마일스톤" right={<span className="text-[12px] text-muted">분기 단위</span>} />
                  <ol className="mt-3 space-y-2">
                    {MILESTONES.map(([q, what, st], i) => (
                      <li key={q} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[10px] font-bold text-white">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-num text-[12px] font-bold text-navy">{q}</div>
                          <div className="text-[12px] leading-[1.55] text-ink">{what}</div>
                        </div>
                        <span className="shrink-0 rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{st}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>

              <Panel className="min-w-0">
                <PanelHead title="경쟁 포지셔닝" right={<span className="text-[12px] text-muted">우리가 이기는 지점 · 지는 지점을 같이 본다</span>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">경쟁 유형</th>
                        <th className="py-2 pr-4">과금</th>
                        <th className="py-2 pr-4">동행 구조</th>
                        <th className="py-2 pr-4">그들의 강점 · 약점</th>
                        <th className="py-2">우리의 차별점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPETITORS.map((c) => (
                        <tr key={c.k} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2.5 pr-4 font-bold text-navy">{c.k}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-ink">{c.price}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-ink">{c.pair}</td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-muted">{c.moat}</td>
                          <td className="py-2.5 text-[12px] font-bold leading-[1.6]" style={{ color: TONE[c.tone].fg }}>{c.us}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {/* ════ 그로스 · 바이럴 루프 — K-factor · 채널 · 유닛 이코노믹스 · 실험 ════ */}
          {tab === "growth" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 성장 · 획득</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">그로스 · 바이럴 루프</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  케어 품질이 곧 획득 채널입니다 — 좋은 동행이 추천을 만들고, 추천이 CAC를 0으로 만듭니다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                {GROWTH_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 바이럴 루프 */}
              <Panel className="min-w-0">
                <PanelHead title="바이럴 루프 — 케어 경험이 다음 가구를 데려온다" right={<span className="text-[12px] text-muted">단계별 전환율 · 최근 90일</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                  {VIRAL_LOOP.map((v, i) => (
                    <div
                      key={v.k}
                      className="rounded-xl border px-3.5 py-3"
                      style={v.k === LOOP_BOTTLENECK.stage
                        ? { borderColor: "rgba(192,57,43,.35)", background: "rgba(192,57,43,.05)" }
                        : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-num text-[10px] font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[12px] font-bold text-navy">{v.k}</span>
                        {v.k === LOOP_BOTTLENECK.stage && (
                          <span className="ml-auto rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">병목</span>
                        )}
                      </div>
                      <div className="mt-1 font-num text-[20px] font-bold text-navy">{v.v}</div>
                      <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{v.note}</div>
                      {v.conv != null && (
                        <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-navy/[.08]">
                          <div className="h-full rounded-full" style={{ width: `${v.conv}%`, background: v.k === LOOP_BOTTLENECK.stage ? "#C0392B" : "#1E7A5A" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-danger/25 bg-danger/[.05] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">루프 병목</span>
                    <span className="text-[13px] font-bold text-navy">{LOOP_BOTTLENECK.stage}</span>
                    <span className="text-[12px] text-muted">— {LOOP_BOTTLENECK.why}</span>
                  </div>
                  <ol className="mt-2 space-y-1">
                    {LOOP_BOTTLENECK.acts.map((a, i) => (
                      <li key={a} className="flex items-start gap-2 text-[12px] leading-[1.6] text-ink">
                        <span className="mt-[1px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-danger font-num text-[9px] font-bold text-white">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ol>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="채널별 CAC · LTV · 회수" right={<span className="text-[12px] text-muted">비중 · 최근 90일 가입</span>} />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[440px] text-left text-[12px]">
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th className="py-2 pr-3">채널</th>
                          <th className="py-2 pr-3">비중</th>
                          <th className="py-2 pr-3">CAC</th>
                          <th className="py-2 pr-3">LTV (매출)</th>
                          <th className="py-2">회수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHANNELS.map((c) => (
                          <tr key={c.k} className="border-b border-navy/[.06]">
                            <td className="whitespace-nowrap py-2 pr-3 font-bold text-navy">{c.k}</td>
                            <td className="whitespace-nowrap py-2 pr-3">
                              <div className="flex items-center gap-1.5">
                                <div className="h-[4px] w-[36px] overflow-hidden rounded-full bg-navy/[.08]">
                                  <div className="h-full rounded-full bg-gold" style={{ width: `${c.share}%` }} />
                                </div>
                                <span className="font-num text-[11px]">{c.share}%</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap py-2 pr-3 font-num font-bold" style={{ color: TONE[c.tone].fg }}>{c.cac}</td>
                            <td className="whitespace-nowrap py-2 pr-3 font-num text-ink">{c.ltv}</td>
                            <td className="whitespace-nowrap py-2 text-muted">{c.payback}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    검색 광고는 회수 9.4개월로 목표(6개월)를 넘습니다 — 다만 중단 테스트에서 총 유입이 7% 줄어 롤백했습니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="유닛 이코노믹스 — 가구 1곳 월 기준" right={<span className="text-[12px] font-bold text-green">+7만 기여</span>} />
                  <div className="mt-3 space-y-2">
                    {UNIT_ECON.map((u, i) => (
                      <div
                        key={u.k}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${i === UNIT_ECON.length - 1 ? "border-2 border-green/30 bg-green/[.05]" : "border border-navy/[.06] bg-white/60"}`}
                      >
                        <span className="min-w-0 flex-1 text-[13px] font-bold text-navy">{u.k}</span>
                        <span className="shrink-0 font-num text-[15px] font-bold" style={{ color: u.tone === "bad" ? "#C0392B" : "#1E7A5A" }}>{u.v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    가구당 기여이익이 얇은 구조입니다 — 확장은 가구 수가 아니라 <b className="text-navy">가구당 옵션 부착률</b>과
                    지점 고정비 분산으로 만듭니다. 원가 절감을 정산 단가에서 찾지 않습니다.
                  </p>
                </Panel>
              </div>

              <Panel className="min-w-0">
                <PanelHead title="성장 실험 — 가설 · 상태 · 결과" right={<span className="text-[12px] text-muted">효과 없으면 롤백 (Closed Loop와 동일 원칙)</span>} />
                <div className="mt-3 space-y-2">
                  {EXPERIMENTS.map((e) => (
                    <div key={e.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-navy">{e.k}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[e.tone].fg, background: TONE[e.tone].bg }}>{e.state}</span>
                        <span className="ml-auto shrink-0 text-[11px] font-bold" style={{ color: TONE[e.tone].fg }}>{e.impact}</span>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.55] text-muted">가설 — {e.hyp}</div>
                    </div>
                  ))}
                </div>
              </Panel>
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

              {/* 채용 → 현장 투입 정체 보드 — 단계 클릭 → 멈춘 사람 */}
              <Panel className="min-w-0">
                <PanelHead
                  title="채용 → 현장 투입 정체"
                  right={<span className="text-[12px] text-muted">단계를 클릭하면 멈춰 있는 사람이 열립니다 · 지연은 곧 수급 갭</span>}
                />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  {HIRE_STUCK_STAGES.map((h, i) => {
                    const on = hireStage === h.id;
                    const tone = h.stuckN >= 5 ? "#C0392B" : h.stuckN >= 3 ? "#8A5D12" : "#1E7A5A";
                    return (
                      <button
                        key={h.id}
                        onClick={() => setHireStage(h.id)}
                        className="btn-press rounded-xl border px-3 py-2.5 text-left"
                        style={
                          on
                            ? { borderColor: NAVY, background: "rgba(10,31,60,.05)", boxShadow: "inset 0 0 0 1px rgba(10,31,60,.35)" }
                            : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-num text-[10px] font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                          <span className="text-[12px] font-bold text-navy">{h.stage}</span>
                          {h.worst && <span className="ml-auto rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">최대 정체</span>}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="font-num text-[18px] font-bold text-navy">{h.n}</span>
                          <span className="text-[10px] text-muted">명</span>
                        </div>
                        <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-navy/[.08]">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((h.stuckN / h.n) * 100)}%`, background: tone }} />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="font-num text-[11px] font-bold" style={{ color: tone }}>정체 {h.stuckN}</span>
                          <span className="ml-auto text-[10px] text-muted">{h.sla}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const cur = HIRE_STUCK_STAGES.find((h) => h.id === hireStage);
                  const rows = HIRE_STUCK[hireStage] || [];
                  return (
                    <div className="mt-3 border-t border-navy/[.08] pt-3">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[14px] font-bold text-navy">{cur.stage}</span>
                        <span className="font-num text-[12px] font-bold text-danger">정체 {cur.stuckN}명</span>
                        <span className="text-[12px] text-muted">— {cur.note}</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {rows.map((r) => (
                          <div key={r.code} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-navy/[.06] px-2 py-0.5 font-num text-[10px] font-bold text-navy">{r.code}</span>
                              <span className="text-[13px] font-bold text-navy">{r.who}</span>
                              <span className="font-num text-[11px] font-bold text-amber">{r.wait}</span>
                            </div>
                            <div className="mt-1 text-[12px] leading-[1.55] text-muted">{r.signal}</div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="min-w-0 flex-1 text-[12px] font-bold leading-[1.55] text-ink">조치 — {r.act}</span>
                              <button
                                onClick={() => setHireDone((v) => ({ ...v, [r.code]: true }))}
                                disabled={!!hireDone[r.code]}
                                className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                              >
                                {hireDone[r.code] ? `${r.owner} 배정됨 ✓` : `${r.owner} 배정`}
                              </button>
                            </div>
                          </div>
                        ))}
                        {rows.length === 0 && <p className="py-3 text-center text-[12px] text-muted">이 단계에 정체된 인원이 없습니다.</p>}
                      </div>
                    </div>
                  );
                })()}
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  신원 조회는 외부 회신 대기라 가장 오래 멈춥니다 — 예외는 두지 않되 대체 인력을 준비합니다.
                  수습 전환 지연은 소득 정체로 이어져 이탈 위험 예측과 직결됩니다.
                </p>
              </Panel>

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
            <div className="space-y-4">
            {/* ── 퍼널 정체 보드 — 단계 클릭 → 정체 가구 · 권장 대응 · 담당 배정 ── */}
            <Panel className="min-w-0">
              <PanelHead
                title="퍼널 정체 보드"
                right={<span className="text-[12px] text-muted">최근 90일 코호트 · 단계를 클릭하면 정체 가구가 열립니다</span>}
              />
              <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                {CRM_FUNNEL.map((f, i) => {
                  const on = funnelStage === f.id;
                  const stuckTone = f.stuckN >= 6 ? "#C0392B" : f.stuckN >= 4 ? "#8A5D12" : "#1E7A5A";
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFunnelStage(f.id)}
                      className="btn-press rounded-xl border px-3.5 py-3 text-left"
                      style={
                        on
                          ? { borderColor: NAVY, background: "rgba(10,31,60,.05)", boxShadow: "inset 0 0 0 1px rgba(10,31,60,.35)" }
                          : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-num text-[10px] font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[12px] font-bold text-navy">{f.stage}</span>
                        {f.worst && (
                          <span className="ml-auto rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">최대 이탈</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-num text-[20px] font-bold text-navy">{f.n}</span>
                        <span className="text-[10px] text-muted">가구</span>
                        {f.conv != null && (
                          <span className="ml-auto font-num text-[11px] font-bold" style={{ color: f.conv < 80 ? "#C0392B" : "#1E7A5A" }}>
                            전환 {f.conv}%
                          </span>
                        )}
                      </div>
                      {/* 정체 게이지 — 단계 내 정체 비중 */}
                      <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-navy/[.08]">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((f.stuckN / f.n) * 100)}%`, background: stuckTone }} />
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-num text-[11px] font-bold" style={{ color: stuckTone }}>정체 {f.stuckN}건</span>
                        <span className="ml-auto text-[10px] text-muted">SLA {f.sla}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택 단계 상세 — 정체 가구 · 권장 대응 */}
              {(() => {
                const cur = CRM_FUNNEL.find((f) => f.id === funnelStage);
                const rows = CRM_STUCK[funnelStage] || [];
                return (
                  <div className="mt-3 border-t border-navy/[.08] pt-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[14px] font-bold text-navy">{cur.stage}</span>
                      <span className="font-num text-[12px] font-bold text-danger">정체 {cur.stuckN}건</span>
                      <span className="text-[12px] text-muted">— {cur.note}</span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      {rows.map((r) => (
                        <div key={r.code} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-navy/[.06] px-2 py-0.5 font-num text-[10px] font-bold text-navy">{r.code}</span>
                            <span className="font-num text-[11px] font-bold text-amber">{r.days}</span>
                            <span className="text-[12px] text-muted">{r.signal}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="min-w-0 flex-1 text-[12px] font-bold leading-[1.55] text-ink">권장 대응 — {r.act}</span>
                            <button
                              onClick={() => setStuckDone((v) => ({ ...v, [r.code]: true }))}
                              disabled={!!stuckDone[r.code]}
                              className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy disabled:opacity-50"
                            >
                              {stuckDone[r.code] ? `${r.owner} 배정됨 ✓` : `${r.owner} 배정`}
                            </button>
                          </div>
                        </div>
                      ))}
                      {rows.length === 0 && (
                        <p className="py-3 text-center text-[12px] text-muted">이 단계에 정체 가구가 없습니다.</p>
                      )}
                    </div>
                  </div>
                );
              })()}
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                가구는 가명 코드로만 표시됩니다 — 경영은 개별 레코드에 접근하지 않고 배정까지만 합니다 (실행·기록은 CS · 관제 · 지점장 도구).
                결제 단계(−18%)가 최대 병목이며, 가입비 정책 확정이 선결 과제입니다.
              </p>
            </Panel>

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
                <PanelHead title="마케팅 운영 원칙" right={<span className="text-[12px] text-muted">심의 · 규정 · 유입 채널은 그로스 섹션</span>} />
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
                    onClick={() => {
                      setRosterSub(k);
                      setSubQ("");
                      setSubView(null);
                    }}
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

              {/* 종합 — 통합 검색 · 규모 · 품질 점검 · 신규 등록 흐름 · 접근 기록 */}
              {rosterSub === "home" && (
                <>
                  {/* 전 명부 교차 검색 — 이름 하나로 어르신·보호자·컨시어지·병원을 동시에 */}
                  <Panel>
                    <PanelHead
                      title="명부 통합 검색"
                      right={<span className="text-[12px] text-muted">4개 명부 동시 · 결과를 눌러 해당 명부로</span>}
                    />
                    <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-navy/15 bg-white/70 px-3 py-2">
                      <span className="text-muted">
                        <Icon name="search" size={16} />
                      </span>
                      <input
                        value={rosterQ}
                        onChange={(e) => setRosterQ(e.target.value)}
                        placeholder="이름 · 동 · 지점 · 담당 · 병원 — 전 명부에서 찾기"
                        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/60"
                      />
                      {rosterQ && (
                        <button onClick={() => setRosterQ("")} className="btn-press text-[12px] font-bold text-muted">
                          지우기
                        </button>
                      )}
                    </div>
                    {rosterQ.trim() && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="text-[11px] font-bold text-muted">
                          결과 <span className="font-num text-navy">{hits.length}</span>건
                        </div>
                        {hits.slice(0, 8).map((h) => (
                          <button
                            key={`${h.sub}-${h.name}`}
                            onClick={() => openRoster(h.sub, null, h.name)}
                            className="flex w-full items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2 text-left hover:bg-navy/[.03]"
                          >
                            <span className="shrink-0 rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">
                              {h.title.replace(" 명부", "")}
                            </span>
                            <span className="shrink-0 text-[13px] font-bold text-navy">{h.name}</span>
                            <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{h.desc}</span>
                            <span className="shrink-0 text-[12px] font-bold text-gold">→</span>
                          </button>
                        ))}
                        {hits.length === 0 && (
                          <p className="py-2 text-center text-[12px] text-muted">일치하는 항목이 없습니다.</p>
                        )}
                        {hits.length > 8 && (
                          <p className="pt-0.5 text-[11px] text-muted">상위 8건만 표시 — 유형별 명부에서 좁혀 보세요.</p>
                        )}
                      </div>
                    )}
                    <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                      게이팅 원칙 — 명부에는 상세 주소 · 건강 상세가 없습니다 (동 단위 · 상태 라벨까지만).
                      내보낸 파일의 관리 책임은 다운로드한 계정에 있으며, 다운로드 이력은 접근 기록으로 남습니다.
                    </p>
                  </Panel>

                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    {[
                      ["활성 어르신", "132", `명부 표시 ${ROSTERS.elders.rows.length}건`],
                      ["보호자", "241", `명부 표시 ${ROSTERS.guardians.rows.length}건 · 주 128 · 부 113`],
                      ["컨시어지", "24", `재직 전원 ${ROSTERS.concierges.rows.length}건 · 수습 4`],
                      ["제휴 병원", String(ROSTERS.hospitals.rows.length), "패스트트랙 3"],
                    ].map(([k, v, note]) => (
                      <Panel key={k} className="!p-4">
                        <div className="text-[11px] font-bold text-muted">{k}</div>
                        <div className="mt-1 font-num text-[25px] font-bold text-navy">{v}</div>
                        <div className="mt-0.5 text-[11px] text-muted">{note}</div>
                      </Panel>
                    ))}
                  </div>

                  <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
                    {/* 명부 품질 점검 — 방대해질수록 사람이 못 보는 "빠진 것"을 규칙으로 잡는다 */}
                    <Panel className="min-w-0">
                      <PanelHead
                        title="명부 품질 점검"
                        right={<span className="text-[12px] text-muted">규칙 위반 · 누락 — 눌러서 해당 조건으로</span>}
                      />
                      <div className="mt-3 space-y-1.5">
                        {ROSTER_CHECKS.map((c) => {
                          const r = ROSTERS[c.sub];
                          const v = r.views.find((x) => x.k === c.view);
                          const n = r.rows.filter(v.match).length;
                          const t = TONE[n === 0 ? "ok" : c.tone];
                          return (
                            <button
                              key={`${c.sub}-${c.view}`}
                              onClick={() => openRoster(c.sub, c.view)}
                              disabled={n === 0}
                              className="flex w-full items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5 text-left enabled:hover:bg-navy/[.03] disabled:opacity-55"
                            >
                              <span
                                className="mt-[1px] shrink-0 rounded-full px-2 py-0.5 font-num text-[11px] font-bold"
                                style={{ background: t.bg, color: t.fg }}
                              >
                                {n}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-bold text-navy">{c.label}</span>
                                <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{c.why}</span>
                              </span>
                              <span className="shrink-0 text-[11px] font-bold text-muted">
                                {r.title.replace(" 명부", "")} {n > 0 && <span className="text-gold">→</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Panel>

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
                            onClick={() => openRoster(r.sub)}
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

                    {/* 접근 · 내보내기 기록 — 원칙을 문구가 아니라 기록으로 */}
                    <Panel className="min-w-0">
                      <PanelHead
                        title="접근 · 내보내기 기록"
                        right={<span className="text-[12px] text-muted">최근 5건 · 전체는 보안 · 데이터 섹션</span>}
                      />
                      <div className="mt-3 space-y-1.5">
                        {ROSTER_ACCESS.map((a) => {
                          const t = TONE[a.tone];
                          return (
                            <div
                              key={`${a.at}-${a.act}`}
                              className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2"
                            >
                              <span className="w-[62px] shrink-0 font-num text-[11px] text-muted">{a.at}</span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-bold text-navy">{a.act}</span>
                                <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{a.detail}</span>
                              </span>
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{ background: t.bg, color: t.fg }}
                              >
                                {a.who}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                        지점장은 자기 지점 행만 조회됩니다 (행 수준 접근 제어) — 타 지점 접근은 차단과 함께 기록됩니다.
                      </p>
                    </Panel>
                  </div>
                </>
              )}

              {/* 유형별 명부 — 검색 · 기간 필터는 테이블 내장 */}
              {rosterSub !== "home" && (
                <Panel className="min-w-0">
                  <RosterTable
                    roster={ROSTERS[rosterSub]}
                    defaultQuery={subQ}
                    defaultView={subView}
                  />
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
            </div>
          )}

          {/* ════ 가격 · 상품 — 플랜 · 옵션 · 가격 결정 (퍼널 최대 병목 대응) ════ */}
          {tab === "pricing" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 가격 · 상품</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">가격 · 상품 설계</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  가격은 마케팅이 아니라 약속입니다 — 케어 원가를 감당하지 못하는 가격은 결국 사람을 갈아 넣게 됩니다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {PRICING_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              <Panel className="min-w-0">
                <PanelHead title="확정 상품 구조" right={<span className="text-[12px] font-bold text-green">2026-08-01 방향성 회의 확정</span>} />
                <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                  {PLANS.map((pl) => (
                    <div key={pl.k} className="rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-navy">{pl.k}</span>
                        <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[pl.tone].fg, background: TONE[pl.tone].bg }}>{pl.n}</span>
                      </div>
                      <div className="mt-1 font-num text-[22px] font-bold text-navy">{pl.price}</div>
                      <p className="mt-1 text-[12px] leading-[1.55] text-ink">{pl.inc}</p>
                      <p className="mt-1 text-[11px] leading-[1.5] text-muted">{pl.who}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead
                  title={PRICING_UNIT.head}
                  right={<span className="text-[12px] text-muted">가구 1곳 · 월 기준</span>}
                />
                <div className="mt-3 space-y-1.5">
                  {PRICING_UNIT.rows.map((r) => (
                    <div key={r.k} className="flex items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                      <span className="min-w-0 flex-1 text-[13px] font-bold text-navy">{r.k}</span>
                      <span className="shrink-0 font-num text-[15px] font-bold" style={{ color: TONE[r.tone].fg }}>{r.v}</span>
                      <span className="hidden w-[200px] shrink-0 text-right text-[11px] text-muted sm:block">{r.note}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[12px] leading-[1.75] text-muted">{PRICING_UNIT.note}</p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="옵션 카탈로그 · 부착률" right={<span className="text-[12px] text-muted">확장은 가구 수보다 부착률</span>} />
                  <div className="mt-3 space-y-3">
                    {OPTIONS_CATALOG.map((o) => (
                      <BarRow key={o.k} label={`${o.k} · ${o.price}`} value={`${o.attach}%`} w={o.attach * 2} color={o.attach >= 30 ? "#1E7A5A" : "#B08D57"} note={o.note} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    기본 구독이 구조적 역마진이라 옵션 부착률은 “확장의 지렛대”가 아니라 <b className="text-navy">손익분기의 조건</b>입니다 —
                    다만 부착률을 컨시어지 평가에 넣지는 않습니다 (원칙 1).
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="가격 결정 · 확정 이력" right={<span className="text-[12px] text-muted">남은 것은 유통 경로 하나</span>} />
                  <div className="mt-3 space-y-2">
                    {PRICING_DECISIONS.map((d) => (
                      <div key={d.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{d.k}</span>
                          <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[d.tone].fg, background: TONE[d.tone].bg }}>{d.state}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">배경 — {d.why}</div>
                        <div className="mt-0.5 text-[12px] font-bold leading-[1.55] text-ink">{d.opt}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <Panel className="min-w-0">
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

              {/* ── 코호트 리텐션 ── */}
              <Panel>
                <PanelHead title={<>코호트 리텐션<HelpTip term="코호트" /><HelpTip term="LTV" /></>} right={<span className="text-[12px] text-muted">LTV는 기여이익 기준 — 산식은 전략 · OKR의 지표 정의</span>} />
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
            </div>
          )}

          {/* ════ 파트너 · 제휴 — 포트폴리오 · B2G 파이프라인 · 원칙 ════ */}
          {tab === "partners" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 제휴 · 공공</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">파트너 · 제휴</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  제휴는 매출 다각화이자 리스크 유입 경로입니다 — 제휴사 부실은 우리 고객의 피해가 됩니다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {PARTNER_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              <Panel className="min-w-0">
                <PanelHead title="제휴 포트폴리오" right={<span className="text-[12px] text-muted">유형 · 기여 매출 · 상태</span>} />
                <div className="mt-3 space-y-2">
                  {PARTNER_PORTFOLIO.map((pp) => (
                    <div key={pp.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{pp.type}</span>
                        <span className="text-[13px] font-bold text-navy">{pp.k}</span>
                        <span className="ml-auto font-num text-[13px] font-bold text-navy">{pp.rev}</span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[pp.tone].fg, background: TONE[pp.tone].bg }}>{pp.state}</span>
                      </div>
                      <div className="mt-1 text-[12px] leading-[1.55] text-muted">{pp.note}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="B2G · 공공사업 파이프라인" right={<span className="text-[12px] text-muted">지자체 장기 계약 = 대기업 방어선</span>} />
                  <div className="mt-3 space-y-2">
                    {B2G_PIPELINE.map((b) => (
                      <div key={b.k} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="text-[13px] font-bold text-navy">{b.k}</span>
                        <span className="text-[11px] text-muted">{b.org}</span>
                        <span className="ml-auto shrink-0 font-num text-[11px] font-bold text-amber">{b.due}</span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[b.tone].fg, background: TONE[b.tone].bg }}>{b.state}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="제휴 원칙" right={<span className="text-[12px] text-muted">매출보다 먼저 지키는 것</span>} />
                  <ol className="mt-3 space-y-2">
                    {PARTNER_RULES.map((r, i) => (
                      <li key={r} className="flex items-start gap-2.5 text-[12px] leading-[1.65] text-ink">
                        <span className="mt-[1px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        {r}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    병원 연계(670만)는 계약 구조 전환 전까지 수취를 중단합니다 — 매출보다 형사 리스크가 큽니다 (C4).
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 예산 · 손익 — P&L · 예산 대비 실적 · 시나리오 ════ */}
          {tab === "pl" && (
            <div className="space-y-4">
              {/* ── 매출 정의 · 수익 배분 (2026-08-01 회의 확정) ── */}
              <Panel>
                <PanelHead
                  title="매출의 정의 · 수익 배분"
                  right={<span className="text-[12px] font-bold text-green">2026-08-01 방향성 회의 확정</span>}
                />
                <p className="mt-2 max-w-[92ch] text-[12px] leading-[1.75] text-muted">
                  무엇을 매출로 볼지부터 못 박았습니다 — 나중에 서로 다른 숫자를 들고 오면 그때부터 오해가 시작되기 때문입니다.
                  {" "}{REV_DEF.base}
                </p>
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  <div className="rounded-xl border border-green/25 bg-green/[.06] px-3.5 py-3">
                    <div className="text-[12px] font-bold text-green">매출로 잡는 것</div>
                    <div className="mt-1.5 space-y-1.5">
                      {REV_DEF.include.map((x) => (
                        <div key={x.k}>
                          <span className="text-[12px] font-bold text-navy">{x.k}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{x.body}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-danger/25 bg-danger/[.05] px-3.5 py-3">
                    <div className="text-[12px] font-bold text-danger">매출로 잡지 않는 것</div>
                    <div className="mt-1.5 space-y-1.5">
                      {REV_DEF.exclude.map((x) => (
                        <div key={x.k}>
                          <span className="text-[12px] font-bold text-navy">{x.k}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{x.why}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  <div>
                    <div className="text-[12px] font-bold text-navy">배분 구조</div>
                    <div className="mt-1.5 space-y-1">
                      {PROFIT_SPLIT.map((r) => (
                        <div key={r.k} className="flex items-center gap-2 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                          <span className="shrink-0 text-[12px] font-bold" style={{ color: TONE[r.tone].fg }}>{r.k}</span>
                          <span className="min-w-0 flex-1 text-right font-num text-[12px] font-bold text-navy">{r.v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] leading-[1.7] text-muted">
                      유보금 10%를 먼저 떼는 이유 — 회사에 남는 것이 있어야 다음 것을 만들 수 있기 때문입니다.
                    </p>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-navy">운영 · 거버넌스</div>
                    <div className="mt-1.5 space-y-1.5">
                      {GOVERNANCE.map((g) => (
                        <div key={g.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                          <span className="text-[12px] font-bold text-navy">{g.k}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{g.body}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {PL_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              <Panel className="min-w-0">
                <PanelHead title="손익계산 — 계획 대비 실적 (월)" right={<span className="text-[12px] text-muted">차이가 큰 항목이 다음 달 안건</span>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">항목</th>
                        <th className="py-2 pr-4">계획</th>
                        <th className="py-2 pr-4">실적</th>
                        <th className="py-2 pr-4">차이</th>
                        <th className="py-2">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PL_ROWS.map((r) => (
                        <tr key={r.k} className={`border-b border-navy/[.06] ${r.k === "영업이익" || r.k === "매출총이익" ? "bg-navy/[.03]" : ""}`}>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-bold text-navy">{r.k}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num text-muted">{r.plan}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num font-bold text-navy">{r.act}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num font-bold" style={{ color: TONE[r.tone].fg }}>{r.diff}</td>
                          <td className="py-2.5 text-[12px] leading-[1.55] text-muted">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="예산 경보" right={<span className="text-[12px] text-muted">이번 달 이슈</span>} />
                  <div className="mt-3 space-y-2">
                    {BUDGET_ALERTS.map((a) => (
                      <div key={a.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[a.tone].fg, background: TONE[a.tone].bg }}>{a.level}</span>
                          <span className="text-[13px] font-bold text-navy">{a.k}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{a.text}</div>
                        <div className="mt-0.5 text-[12px] font-bold leading-[1.55] text-ink">→ {a.act}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="시나리오 — 12개월 후" right={<span className="text-[12px] text-muted">확장 속도는 채용이 정한다</span>} />
                  <div className="mt-3 space-y-2">
                    {SCENARIOS.map((sc) => (
                      <div key={sc.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold" style={{ color: TONE[sc.tone].fg }}>{sc.k}</span>
                          <span className="ml-auto font-num text-[12px] font-bold text-navy">{sc.homes}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-[12px]">
                          <span className="text-muted">매출 <b className="font-num text-ink">{sc.rev}</b></span>
                          <span className="text-muted">영업이익 <b className="font-num text-ink">{sc.op}</b></span>
                          <span className="text-muted">런웨이 <b className="font-num text-ink">{sc.runway}</b></span>
                        </div>
                        <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{sc.note}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    비관 시나리오의 원인은 시장이 아니라 채용입니다 — 인력 수급이 성장 상한이라는 구조가 여기서도 확인됩니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 제품 · 로드맵 — 릴리스 · 기능 커버리지 · 기술 부채 ════ */}
          {tab === "product" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 제품 · 기술</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">제품 · 로드맵</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  운영 원칙이 곧 제품 스펙입니다 — 방침이 바뀌면 릴리스가 따라갑니다(반대 방향은 없습니다).
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {PRODUCT_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* ── 동행 기록 기기 — 바디캠 · 글래스 비교와 비용 ── */}
              <Panel>
                <PanelHead
                  title="동행 기록 기기 — 도입 검토"
                  right={<span className="text-[12px] text-muted">비용의 90%는 클라우드가 아니라 하드웨어다</span>}
                />
                <p className="mt-2 max-w-[92ch] text-[13px] leading-[1.75] text-muted">
                  계산해 보면 <b className="text-navy">바디캠이 초기 33% · 월 27% 싸면서 성능도 앞섭니다</b> —
                  배터리 8~12시간, 사전 녹화 버퍼 30초, IP67. 글래스가 이기는 건 시선 일치와 원격 지원 둘뿐이라,
                  <b className="text-navy"> 바디캠으로 깔고 원격 지원이 필요한 곳에만 글래스를 얹는 것</b>이 무리 없는 안입니다.
                </p>

                <div className="mt-3 text-[12px] font-bold text-navy">기기 4안</div>
                <div className="mt-1.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {REC_DEVICES.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border px-3.5 py-3"
                      style={
                        d.state === "권장"
                          ? { borderColor: "rgba(30,122,90,.35)", background: "rgba(30,122,90,.06)" }
                          : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }
                      }
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-num text-[11px] font-bold text-muted">{d.id}</span>
                        <span className="min-w-0 flex-1 text-[13px] font-bold text-navy">{d.k}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: TONE[d.tone].bg, color: TONE[d.tone].fg }}
                        >
                          {d.state}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-[11px] text-muted">{d.ex}</span>
                        <span className="ml-auto font-num text-[13px] font-bold text-navy">{d.price} / 대</span>
                      </div>
                      <ul className="mt-2 space-y-0.5">
                        {d.pros.map((x) => (
                          <li key={x} className="flex gap-1.5 text-[11px] leading-[1.6] text-ink">
                            <span className="shrink-0 text-green">+</span>
                            <span>{x}</span>
                          </li>
                        ))}
                        {d.cons.map((x) => (
                          <li key={x} className="flex gap-1.5 text-[11px] leading-[1.6] text-muted">
                            <span className="shrink-0 text-danger">−</span>
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-[1.7] text-muted">
                  C안(컨슈머 글래스)은 가장 트렌디하지만 <b className="text-navy">영상이 제조사 클라우드를 경유</b>합니다 —
                  민감정보 처리위탁 요건을 못 맞춰 케어 기록으로는 쓸 수 없습니다. 취향이 아니라 규정 문제입니다.
                </p>

                <div className="mt-4 text-[12px] font-bold text-navy">바디캠 vs 글래스 — 항목별로 누가 이기나</div>
                <div className="mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
                  {REC_COMPARE.map((c) => (
                    <div key={c.k} className="flex items-center gap-2 rounded-xl border border-navy/[.06] bg-white/60 px-3 py-2">
                      <span className="w-[92px] shrink-0 text-[11px] font-bold text-navy">{c.k}</span>
                      <span
                        className="min-w-0 flex-1 rounded-lg px-2 py-1 text-[11px] leading-[1.5]"
                        style={c.win === "cam" ? { background: "rgba(30,122,90,.1)", color: "#1E7A5A", fontWeight: 700 } : { color: "#5C5A54" }}
                      >
                        {c.cam}
                      </span>
                      <span
                        className="min-w-0 flex-1 rounded-lg px-2 py-1 text-[11px] leading-[1.5]"
                        style={c.win === "gl" ? { background: "rgba(176,141,87,.16)", color: "#8A5D12", fontWeight: 700 } : { color: "#5C5A54" }}
                      >
                        {c.gl}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  왼쪽 = 바디캠 · 오른쪽 = 글래스 · 색이 칠해진 쪽이 우세. <b className="text-navy">8개 중 5개를 바디캠이 가져갑니다.</b>
                </p>

                <div className="mt-4 text-[12px] font-bold text-navy">규모별 총비용 — 두 안 나란히 (구간 녹화 8분 · 30일 보관 공통)</div>
                <div className="mt-1.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  {REC_SCALE.map((sc) => (
                    <div key={sc.n} className="rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-bold text-navy">{sc.n}</span>
                        <span className="ml-auto font-num text-[11px] text-muted">컨시어지 {sc.staff}</span>
                      </div>
                      <div className="mt-2 rounded-lg border border-green/25 bg-green/[.06] px-3 py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-bold text-green">바디캠 (권장)</span>
                          <span className="ml-auto font-num text-[10px] text-muted">{sc.cam.units}</span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-[10px] text-muted">초기 <b className="font-num text-[13px] text-navy">{sc.cam.capex}</b></span>
                          <span className="text-[10px] text-muted">월 <b className="font-num text-[13px] text-navy">{sc.cam.opex}</b></span>
                          <span className="ml-auto font-num text-[12px] font-bold text-green">{sc.cam.per} / 가구</span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 border-t border-green/20 pt-1.5">
                          {sc.cam.detail.map(([k, v]) => (
                            <div key={k} className="flex items-baseline gap-2 text-[10px]">
                              <span className="min-w-0 flex-1 text-muted">{k}</span>
                              <span className="shrink-0 font-num font-bold text-ink">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-1.5 rounded-lg border border-navy/[.08] bg-white/50 px-3 py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-bold text-muted">글래스 (병행안)</span>
                          <span className="ml-auto font-num text-[10px] text-muted">{sc.gl.units}</span>
                        </div>
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-[10px] text-muted">초기 <b className="font-num text-[13px] text-navy">{sc.gl.capex}</b></span>
                          <span className="text-[10px] text-muted">월 <b className="font-num text-[13px] text-navy">{sc.gl.opex}</b></span>
                          <span className="ml-auto font-num text-[12px] font-bold text-muted">{sc.gl.per} / 가구</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-[1.7] text-muted">
                  대수가 다른 이유 — 글래스는 배터리 2시간이라 <b className="text-navy">동행 회 단위</b>로 돌려 쓰고,
                  바디캠은 8시간 이상이라 <b className="text-navy">하루 단위</b>로 불출합니다. 바디캠이 대수는 더 필요하지만
                  단가가 절반 이하라 총액은 낮고, 불출 · 반납이 하루 한 번이라 운영도 단순합니다.
                </p>

                <div className="mt-4 text-[12px] font-bold text-navy">단계 전략 — 무리 없이</div>
                <div className="mt-1.5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {REC_HYBRID.map((h) => (
                    <div
                      key={h.d}
                      className="rounded-xl border px-3.5 py-2.5"
                      style={{ borderColor: `${TONE[h.tone].fg}33`, background: TONE[h.tone].bg }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-num text-[11px] font-bold" style={{ color: TONE[h.tone].fg }}>{h.d}</span>
                        <span className="min-w-0 flex-1 text-[12px] font-bold text-navy">{h.k}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-[1.6] text-muted">{h.body}</p>
                      <div className="mt-1 font-num text-[11px] font-bold text-navy">{h.cost}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-[12px] font-bold text-navy">녹화 방식이 비용을 결정한다 — 화질 × 길이 × 보관기간은 곱해진다</div>
                <div className="mt-1.5 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-3">방식</th>
                        <th className="py-2 pr-3">회당 용량</th>
                        <th className="py-2 pr-3">10,000가구 월 클라우드</th>
                        <th className="py-2 pr-3">판정</th>
                        <th className="py-2">이유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GLASS_MODES.map((m) => (
                        <tr key={m.k} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2 pr-3 font-bold text-navy">{m.k}</td>
                          <td className="whitespace-nowrap py-2 pr-3 font-num text-ink">{m.size}</td>
                          <td className="whitespace-nowrap py-2 pr-3 font-num font-bold" style={{ color: TONE[m.tone].fg }}>{m.cloud10k}</td>
                          <td className="whitespace-nowrap py-2 pr-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: TONE[m.tone].bg, color: TONE[m.tone].fg }}>
                              {m.state}
                            </span>
                          </td>
                          <td className="py-2 text-[11px] leading-[1.6] text-muted">{m.why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-[11px] leading-[1.7] text-muted">
                  초기 투자가 부담이면 <b className="text-navy">리스(대당 월 1.5만 수준)</b>가 현금 0으로 같은 월비용을 만듭니다 —
                  파일럿 단계에서는 리스가 맞습니다. 그리고 서버에서 재인코딩하면 10,000가구 기준 월 340만이 더 붙으니,
                  <b className="text-navy"> 기기에서 H.265로 바로 올리는 것</b>이 설계 전제입니다.
                </p>
              </Panel>

              <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="보관 · 파기" right={<span className="text-[12px] text-muted">우리는 의료기관이 아니다 — 10년 보존 대상 아님</span>} />
                  <div className="mt-3 space-y-2">
                    {GLASS_RETENTION.map((r) => (
                      <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-bold text-navy">{r.k}</span>
                          <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: TONE[r.tone].bg, color: TONE[r.tone].fg }}>
                            {r.term}
                          </span>
                        </div>
                        <div className="mt-1 font-num text-[11px] text-muted">{r.store}</div>
                        <p className="mt-0.5 text-[11px] leading-[1.6] text-ink">{r.why}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    30일을 1년으로 늘리면 스토리지가 12배입니다 — 보관기한은 정책이 아니라 원가입니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="옮겨서 보관해도 되는가" right={<span className="text-[12px] text-muted">위탁 · 국외이전 · 사내 보관</span>} />
                  <div className="mt-3 space-y-2">
                    {GLASS_TRANSFER.map((t) => (
                      <div key={t.q} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-[1px] shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: TONE[t.tone].bg, color: TONE[t.tone].fg }}>
                            Q
                          </span>
                          <span className="text-[12px] font-bold text-navy">{t.q}</span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-[1.7] text-muted">{t.a}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="현장 운영 규칙" right={<span className="text-[12px] text-muted">거부감은 설계로 관리한다</span>} />
                  <div className="mt-3 space-y-1.5">
                    {GLASS_FIELD.map((f) => (
                      <div key={f.k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                        <span className="mt-[3px] h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: TONE[f.tone].fg }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-bold text-navy">{f.k}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{f.body}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="글래스를 굳이 얹는다면" right={<span className="text-[12px] text-muted">바디캠으로 안 되는 것만 남긴다</span>} />
                  <div className="mt-3 space-y-2">
                    {GLASS_ONLY.map((v) => (
                      <div key={v.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="text-[13px] font-bold text-navy">{v.k}</div>
                        <p className="mt-1 text-[11px] leading-[1.7] text-muted">{v.body}</p>
                        <div className="mt-1.5 border-t border-navy/[.06] pt-1.5 text-[11px] font-bold text-gold">{v.ir}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    기본은 바디캠입니다. 위 세 가지를 실제로 쓸 계획이 없다면 글래스는 얹지 마세요 —
                    2단계는 수습 교육에 원격 지원 수요가 확인된 뒤에 판단합니다.
                  </p>
                </Panel>
              </div>

              <Panel className="min-w-0">
                <PanelHead title="도입 단계 · 회귀 기준" right={<span className="text-[12px] text-muted">바디캠 기준 · 중단 기준을 먼저 정하고 시작한다</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {REC_PHASES.map((x) => (
                    <div key={x.d} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-num text-[11px] font-bold text-gold">{x.d}</span>
                        <span className="min-w-0 flex-1 text-[12px] font-bold text-navy">{x.k}</span>
                        <span className="shrink-0 text-[10px] font-bold text-muted">{x.who}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-[1.6] text-muted">{x.body}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  2단계(병원 MOU 촬영 조항)가 실제 게이트입니다 — 기기를 먼저 사도 조항이 없으면 진료실에서 못 씁니다.
                  제휴 6곳 재협상 안건에 지금 올리세요.
                </p>
              </Panel>

              {/* ── AI 진화 — 업력과 DB가 쌓일수록 능력이 올라간다 ── */}
              <Panel>
                <PanelHead
                  title="AI 진화 단계"
                  right={<span className="text-[12px] text-muted">지금 {AI_STAGE_NOW} · 다음 단계는 데이터가 열어 준다</span>}
                />
                <p className="mt-2 max-w-[92ch] text-[13px] leading-[1.75] text-muted">
                  성능은 <b className="text-navy">모델 × 기록</b>입니다 — 둘 중 하나를 고르는 문제가 아닙니다.
                  좋은 모델이 나오면 당연히 바꿔서 더 좋아지고, 그 위에 우리 기록이 곱해집니다.
                  다만 모델 상승분은 경쟁사도 같은 날 같이 받고, <b className="text-navy">기록 상승분은 우리만 받습니다</b>.
                  아래 단계는 그 기록 축의 진도이며, 단계마다 무엇이 얼마나 쌓여야 열리는지를 숨기지 않고 적습니다.
                </p>
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(212px, 1fr))" }}>
                  {AI_STAGES.map((st) => {
                    const done = st.state === "완료";
                    const live = st.id === AI_STAGE_NOW;
                    return (
                      <div
                        key={st.id}
                        className="rounded-xl border px-3.5 py-3"
                        style={
                          live
                            ? { borderColor: "#B08D57", background: "rgba(176,141,87,.08)" }
                            : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)" }
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-[22px] w-[26px] shrink-0 items-center justify-center rounded-md font-num text-[11px] font-bold"
                            style={done ? { background: "#1E7A5A", color: "#FFFFFF" } : live ? { background: "#B08D57", color: "#0A1F3C" } : { background: "rgba(10,31,60,.08)", color: "#5C5A54" }}
                          >
                            {st.id}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-navy">{st.k}</span>
                          <span className="shrink-0 font-num text-[11px] font-bold text-muted">{st.pct}%</span>
                        </div>
                        <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-navy/[.08]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${st.pct}%`, background: done ? "#1E7A5A" : live ? "#B08D57" : "#9AA3AF" }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] leading-[1.6] text-ink">{st.what}</p>
                        <p className="mt-1.5 border-t border-navy/[.06] pt-1.5 text-[11px] leading-[1.6] text-muted">
                          해금 조건 — {st.gate}
                        </p>
                        <div className="mt-1 font-num text-[11px] font-bold text-muted">{st.state} · {st.when}</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* ── 두 축 — 모델과 기록은 곱셈이다 ── */}
              <Panel>
                <PanelHead
                  title="성능의 두 축 — 모델 × 기록"
                  right={<span className="text-[12px] text-muted">둘 다 필요하고, 둘의 성격이 다르다</span>}
                />
                <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  {AI_AXES.map((ax) => (
                    <div
                      key={ax.k}
                      className="rounded-xl border px-4 py-3.5"
                      style={{ borderColor: `${TONE[ax.tone].fg}33`, background: TONE[ax.tone].bg }}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-bold text-navy">{ax.k}</span>
                        <span
                          className="ml-auto shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold"
                          style={{ color: TONE[ax.tone].fg }}
                        >
                          {ax.who}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {ax.gets.map((g) => (
                          <li key={g} className="flex gap-1.5 text-[12px] leading-[1.6] text-ink">
                            <span className="shrink-0" style={{ color: TONE[ax.tone].fg }}>·</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">{ax.note}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 rounded-xl bg-navy/[.04] px-4 py-3 text-[12px] leading-[1.75] text-ink">
                  <b className="text-navy">모델은 일반 지능을 주고, 기록은 이 어르신을 줍니다.</b> 최신 모델도 김순자 어르신의
                  왼쪽 귀가 안 들린다는 것은 모릅니다. 반대로 기록만 많고 모델이 낡으면 38개 속성을 브리프 6줄로 압축하지 못합니다.
                  둘 중 하나만으로는 동행 브리프 한 장도 못 씁니다.
                </p>

                <div className="mt-3.5">
                  <div className="text-[12px] font-bold text-navy">모델이 좋아질수록 기록의 가치가 함께 커집니다</div>
                  <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    {AI_MULTIPLY.map((m) => (
                      <div key={m.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="text-[12px] font-bold text-navy">{m.k}</div>
                        <div className="mt-1 text-[11px] leading-[1.6] text-muted">이전 — {m.was}</div>
                        <div className="mt-0.5 text-[11px] font-bold leading-[1.6] text-green">지금 — {m.now}</div>
                        <div className="mt-1.5 border-t border-navy/[.06] pt-1.5 text-[11px] leading-[1.6] text-ink">{m.why}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
                    그래서 <b className="text-navy">지금 처리하지 못하는 기록도 원문으로 남깁니다</b> — 요약만 남기면
                    모델이 좋아졌을 때 되살릴 것이 없습니다 (보존 기간 · 동의 범위 내).
                  </p>
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead
                  title="모델 교체 정책"
                  right={<span className="text-[12px] text-muted">좋은 모델이 나오면 바꾼다 · 검증 없이는 바꾸지 않는다</span>}
                />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {AI_MODEL_POLICY.map((r, i) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">
                          {i + 1}
                        </span>
                        <span className="text-[12px] font-bold text-navy">{r.k}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-[1.7] text-muted">{r.body}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead
                    title="데이터 자산 축적"
                    right={<span className="text-[12px] text-muted">쌓이는 속도 = 진화 속도</span>}
                  />
                  <div className="mt-3 space-y-1.5">
                    {AI_ASSETS.map((a) => (
                      <div key={a.k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-bold text-navy">{a.k}</span>
                          <span className="mt-0.5 block text-[11px] leading-[1.6] text-muted">{a.use}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-num text-[13px] font-bold" style={{ color: TONE[a.tone].fg }}>{a.n}</span>
                          <span className="block font-num text-[10px] text-muted">{a.rate}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    붉은 두 줄(해지 사유 · 사고 라벨)이 지금 E3를 막고 있습니다 — 데이터가 없어서가 아니라
                    <b className="text-navy"> 라벨을 안 남겨서</b>입니다. 입력 시점을 고치는 것이 모델을 바꾸는 것보다 빠릅니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead
                    title="진화의 증거"
                    right={<span className="text-[12px] text-muted">6개월 전 → 지금</span>}
                  />
                  <div className="mt-3 space-y-3">
                    {AI_ACCURACY.map((a) => (
                      <div key={a.k}>
                        <div className="flex items-baseline gap-2 text-[12px]">
                          <span className="font-bold text-navy">{a.k}</span>
                          <span className="ml-auto shrink-0 font-num text-[11px] text-muted">{a.was}%</span>
                          <span className="shrink-0 text-[11px] text-muted">→</span>
                          <span className="shrink-0 font-num text-[13px] font-bold text-green">{a.now}%</span>
                        </div>
                        <div className="relative mt-1 h-[6px] overflow-hidden rounded-full bg-navy/[.06]">
                          {/* 뒤 막대 = 지금 · 앞 막대 = 6개월 전 (늘어난 만큼이 초록으로 남는다) */}
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${a.now}%`, background: "#1E7A5A" }} />
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${a.was}%`, background: "rgba(10,31,60,.25)" }} />
                        </div>
                        <p className="mt-1 text-[11px] leading-[1.6] text-muted">{a.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    이 구간은 <b className="text-navy">모델을 고정한 채</b> 측정했습니다 — 그래서 이 상승은 온전히 기록의 몫입니다.
                    모델 세대가 오르면 이 위에 더 얹힙니다 (다만 그 몫은 경쟁사도 같이 받습니다).
                  </p>
                </Panel>
              </div>

              <Panel className="min-w-0">
                <PanelHead
                  title="잠긴 기능 · 해금 조건"
                  right={<span className="text-[12px] text-muted">무엇이 쌓이면 켜지는지 · 눌러서 해당 섹션으로</span>}
                />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                  {AI_LOCKED.map((f) => {
                    const tone = f.pct >= 100 ? "ok" : f.pct >= 60 ? "warn" : "bad";
                    return (
                      <button
                        key={f.k}
                        onClick={() => setTab(f.menu)}
                        className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3 text-left hover:bg-navy/[.03]"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="min-w-0 flex-1 text-[13px] font-bold text-navy">{f.k}</span>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: TONE[tone].bg, color: TONE[tone].fg }}
                          >
                            {f.state}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2 text-[11px]">
                          <span className="text-muted">{f.need}</span>
                          <span className="ml-auto shrink-0 font-num font-bold" style={{ color: TONE[tone].fg }}>
                            {f.now}
                          </span>
                        </div>
                        <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
                          <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: TONE[tone].fg }} />
                        </div>
                        <p className="mt-2 text-[11px] leading-[1.6] text-ink">{f.how}</p>
                        <p className="mt-1 font-num text-[11px] font-bold text-muted">{f.eta}</p>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead
                  title="진화 원칙"
                  right={<span className="text-[12px] text-muted">능력이 올라가도 바뀌지 않는 것</span>}
                />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                  {AI_RULES.map((r, i) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="text-[12px] font-bold text-navy">{r.k}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-[1.7] text-muted">{r.body}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="릴리스 계획" right={<span className="text-[12px] text-muted">실서버 전환이 v1.1의 전부</span>} />
                <div className="mt-3 space-y-2">
                  {RELEASES.map((r) => (
                    <div key={r.v} className="flex flex-wrap items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <span className="font-num text-[13px] font-bold text-navy">{r.v}</span>
                      <span className="font-num text-[11px] text-muted">{r.when}</span>
                      <span className="min-w-0 flex-1 text-[12px] leading-[1.55] text-ink">{r.items}</span>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[r.tone].fg, background: TONE[r.tone].bg }}>{r.state}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="영역별 기능 커버리지" right={<span className="text-[12px] text-muted">데모 v1.0 기준</span>} />
                  <div className="mt-3 space-y-3">
                    {FEATURE_COVERAGE.map((f) => (
                      <BarRow key={f.k} label={f.k} value={`${f.pct}%`} w={f.pct} color={f.pct >= 80 ? "#1E7A5A" : f.pct >= 60 ? "#8A5D12" : "#C0392B"} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    결제·정산 자동화(38%)가 가장 낮습니다 — 24시간 정산 약속을 사람 손으로 지키고 있다는 뜻이라 v1.2 최우선입니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="기술 부채 · 해소 계획" right={<span className="text-[12px] font-bold text-danger">실서버 전환 전 해소</span>} />
                  <div className="mt-3 space-y-2">
                    {TECH_DEBT.map((t2) => (
                      <div key={t2.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{t2.k}</span>
                          <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[t2.tone].fg, background: TONE[t2.tone].bg }}>
                            {t2.tone === "bad" ? "높음" : t2.tone === "warn" ? "중간" : "낮음"}
                          </span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">리스크 — {t2.risk}</div>
                        <div className="mt-0.5 text-[12px] font-bold leading-[1.55] text-ink">계획 — {t2.plan}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 자금 흐름 — 유입 · 유출 · 카드 지출 · 정산 · 미수 (돈이 흐르는 전 구간) ════ */}
          {tab === "cash" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 자금 · 지출 · 정산</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">자금 흐름 관리</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  사람 평가에는 판매액을 쓰지 않지만, 회사의 돈은 끝까지 추적합니다 — 고객 결제부터 현장 지급까지.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                {CASH_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 자금 흐름도 — 결제에서 잔여 현금까지 */}
              <Panel className="min-w-0">
                <PanelHead title="자금 흐름도" right={<span className="text-[12px] text-muted">고객 결제 → 회사 수취 → 현장 지급 → 운영 → 잔여</span>} />
                <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                  {CASH_FLOW_STEPS.map((f, i) => (
                    <div key={f.k} className="relative rounded-xl border border-navy/[.08] bg-white/60 px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-num text-[10px] font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[12px] font-bold text-navy">{f.k}</span>
                      </div>
                      <div
                        className="mt-1 font-num text-[20px] font-bold"
                        style={{ color: f.k === "잔여 현금" ? "#1E7A5A" : f.tone === "warn" ? "#8A5D12" : "#0A1F3C" }}
                      >
                        {f.v}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-[1.5] text-muted">{f.note}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                {/* 유입 */}
                <Panel className="min-w-0">
                  <PanelHead title="유입 — 수익원별 (월)" right={<span className="text-[12px] font-bold text-green">1.42억</span>} />
                  <div className="mt-3 space-y-3">
                    {CASH_IN.map((c) => (
                      <BarRow
                        key={c.k}
                        label={c.k}
                        value={c.v}
                        w={c.w}
                        color={c.tone === "bad" ? "#C0392B" : c.tone === "warn" ? "#8A5D12" : "#1E7A5A"}
                        note={c.note}
                      />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    병원 연계(05)는 계약 구조 전환 전까지 수취를 중단합니다 — 리스크 C4 최우선 시정 항목.
                  </p>
                </Panel>

                {/* 유출 */}
                <Panel className="min-w-0">
                  <PanelHead title="유출 — 비용 구성 (월)" right={<span className="text-[12px] font-bold text-danger">1.19억</span>} />
                  <div className="mt-3 space-y-3">
                    {CASH_OUT.map((c) => (
                      <BarRow
                        key={c.k}
                        label={c.k}
                        value={c.v}
                        w={c.w}
                        color={c.tone === "warn" ? "#8A5D12" : "#B08D57"}
                        note={c.note}
                      />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    유출의 68%가 사람에게 갑니다(정산 + 지분) — 이 비중을 낮추는 방향의 원가 절감은 하지 않습니다.
                  </p>
                </Panel>
              </div>

              {/* 법인카드 · 지출 관리 */}
              <Panel className="min-w-0">
                <PanelHead
                  title="법인카드 · 지출 관리"
                  right={<span className="text-[12px] font-bold text-danger">확인 필요 {CARD_ALERTS.filter((a) => a.level === "확인 필요").length}건</span>}
                />
                <div className="mt-3 space-y-2">
                  {CARD_ALERTS.map((a) => (
                    <div key={a.text} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ color: TONE[a.tone].fg, background: TONE[a.tone].bg }}
                      >
                        {a.level}
                      </span>
                      <span className="min-w-0 flex-1 text-[12px] text-ink">{a.text}</span>
                      <span className="shrink-0 text-[12px] font-bold text-navy">→ {a.act}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">카드번호</th>
                        <th className="py-2 pr-4">별칭</th>
                        <th className="py-2 pr-4">소지자</th>
                        <th className="py-2 pr-4">한도</th>
                        <th className="py-2 pr-4">사용률</th>
                        <th className="py-2 pr-4">최근 결제</th>
                        <th className="py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CORP_CARDS.map((c) => (
                        <tr key={c.no} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            <span className="font-num font-bold text-navy">{c.no}</span>
                            <div className="text-[11px] text-muted">{c.note}</div>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-bold text-navy">{c.alias}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-ink">{c.owner}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-num text-ink">{c.limit}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-[5px] w-[70px] overflow-hidden rounded-full bg-navy/[.08]">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${c.used}%`, background: c.used >= 90 ? "#C0392B" : c.used >= 70 ? "#8A5D12" : "#1E7A5A" }}
                                />
                              </div>
                              <span className="font-num font-bold" style={{ color: c.used >= 90 ? "#C0392B" : c.used >= 70 ? "#8A5D12" : "#1E7A5A" }}>
                                {c.used}%
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-muted">{c.last}</td>
                          <td className="whitespace-nowrap py-2.5">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[c.tone].fg, background: TONE[c.tone].bg }}>
                              {c.state}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                  복지 · EAP 카드는 총액만 회계 처리하고 개인 이용 내역은 식별하지 않습니다 — 상담 비밀 보장 원칙의 회계 버전입니다.
                </p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                {/* 정산 사이클 */}
                <Panel className="min-w-0">
                  <PanelHead title="정산 사이클" right={<span className="text-[12px] text-muted">사람에게 나가는 돈은 늦으면 신뢰가 깨진다</span>} />
                  <ol className="mt-3 space-y-2">
                    {SETTLE_CYCLE.map(([k, v, when], i) => (
                      <li key={k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-navy">{k}</div>
                          <div className="text-[12px] leading-[1.55] text-muted">{v}</div>
                        </div>
                        <span className="shrink-0 font-num text-[10px] font-bold text-green">{when}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    정산 지연 0건 — 24시간 정산은 채용 퍼널 문의 1위 항목이자 리텐션 장치입니다.
                  </p>
                </Panel>

                {/* 미수 · 회수 */}
                <Panel className="min-w-0">
                  <PanelHead title="미수 · 회수 관리" right={<span className="text-[12px] font-bold text-amber">870만</span>} />
                  <div className="mt-3 space-y-2">
                    {AR_ITEMS.map((a) => (
                      <div key={a.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{a.k}</span>
                          <span className="ml-auto font-num text-[13px] font-bold" style={{ color: TONE[a.tone].fg }}>{a.v}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">{a.note}</div>
                        <div className="mt-1 text-[12px] font-bold leading-[1.55] text-ink">→ {a.act}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    결제 실패 6가구는 CRM 퍼널의 결제 정체 구간과 같은 건입니다 — 돈 문제는 이탈 신호로도 같이 봅니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 투자 · IR — 캡테이블 · 라운드 · 데이터룸 · 투자자 업데이트 ════ */}
          {tab === "ir" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">경영 / 투자 · IR</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">투자 · IR</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  투자자에게 보여줄 숫자를 따로 만들지 않습니다 — 운영에서 쓰는 지표를 그대로 씁니다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                {IR_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[23px] font-bold" style={{ color: k.color }}>{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
                <Panel className="min-w-0">
                  <PanelHead title="캡테이블" right={<span className="text-[12px] text-muted">베스팅 2년 · 1년 클리프 적용</span>} />
                  <div className="mt-3 space-y-3">
                    {CAP_TABLE.map((c) => (
                      <BarRow key={c.k} label={c.k} value={`${c.pct}%`} w={c.pct} color={c.tone === "warn" ? "#8A5D12" : "#B08D57"} note={c.note} />
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    임직원 풀 12%는 시니어 컨시어지까지 포함하는 설계입니다 — 현장이 지분을 갖는 구조가 이 사업의 리텐션 장치입니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="라운드 히스토리 · 계획" right={<span className="text-[12px] text-muted">Pre-A 준비 중</span>} />
                  <div className="mt-3 space-y-2">
                    {ROUNDS.map((r) => (
                      <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{r.k}</span>
                          <span className="font-num text-[11px] text-muted">{r.when}</span>
                          <span className="ml-auto font-num text-[14px] font-bold text-navy">{r.amount}</span>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[r.tone].fg, background: TONE[r.tone].bg }}>{r.state}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-[1.55] text-muted">용도 — {r.use}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    Pre-A 전에 CRITICAL 리스크 4건이 정리되어야 합니다 — 실사에서 가장 먼저 열리는 항목입니다.
                  </p>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="데이터룸 준비 상태" right={<span className="text-[12px] font-bold text-danger">미비 1 · 진행 2</span>} />
                  <div className="mt-3 space-y-1.5">
                    {DATAROOM.map((d) => (
                      <div key={d.k} className="flex items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2">
                        <span className="min-w-0 flex-1 text-[12px] font-bold text-navy">{d.k}</span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[d.tone].fg, background: TONE[d.tone].bg }}>{d.state}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="min-w-0">
                  <PanelHead title="투자자 업데이트" right={<span className="text-[12px] text-muted">{IR_UPDATE.cycle}</span>} />
                  <ol className="mt-3 space-y-2">
                    {IR_UPDATE.items.map((x, i) => (
                      <li key={x} className="flex items-start gap-2.5 text-[12px] leading-[1.65] text-ink">
                        <span className="mt-[1px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        {x}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    나쁜 소식을 먼저, 같은 크기로 씁니다 — 침해 대응 원칙(숨기지 않는다)을 투자자 커뮤니케이션에도 적용합니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ 수익 · 리스크 — 기존 총괄 뷰 ════ */}
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

          {/* ════ 보안 · 데이터 거버넌스 — 질병·민감 프로필 보호 체계 ════ */}
          {tab === "security" && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold tracking-[.14em] text-muted">거버넌스 / 개인정보 · 보안</div>
                <h2 className="mt-0.5 text-[17px] font-bold text-navy">보안 · 데이터 거버넌스</h2>
                <p className="mt-1 text-[13px] leading-[1.7] text-muted">
                  질병 · 민감 프로필을 다루는 서비스의 원칙 — 덜 모으고 · 짧게 두고 · 좁게 열고 · 전부 기록한다.
                </p>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {SEC_KPIS.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[25px] font-bold text-navy">{k.v}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 데이터 분류 4등급 */}
              <Panel className="min-w-0">
                <PanelHead title="데이터 분류 체계 — 4등급" right={<span className="text-[12px] text-muted">등급이 암호화 · 접근 · 보존을 결정한다</span>} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-[12px]">
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th className="py-2 pr-4">등급</th>
                        <th className="py-2 pr-4">대표 항목</th>
                        <th className="py-2 pr-4">저장 · 암호화</th>
                        <th className="py-2 pr-4">접근</th>
                        <th className="py-2">보존 · 파기</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SEC_CLASSES.map((c) => (
                        <tr key={c.grade} className="border-b border-navy/[.06] align-top">
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[c.tone].fg, background: TONE[c.tone].bg }}>{c.grade}</span>
                          </td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-ink">{c.examples}</td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-muted">{c.store}</td>
                          <td className="py-2.5 pr-4 text-[12px] leading-[1.6] text-muted">{c.access}</td>
                          <td className="py-2.5 text-[12px] leading-[1.6] text-muted">{c.keep}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
                {/* 접근 매트릭스 */}
                <Panel className="min-w-0">
                  <PanelHead title="역할 × 데이터 접근 매트릭스" right={<span className="text-[12px] text-muted">S1 건강 · S2 식별 · S3 운영 — ● 열람 · ◐ 제한 · ✕ 차단</span>} />
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[340px] text-left text-[12px]">
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th className="py-2 pr-3">역할</th>
                          {SEC_MATRIX.cols.map((c) => (<th key={c} className="px-0.5 py-2 text-center">{c}</th>))}
                        </tr>
                      </thead>
                      <tbody>
                        {SEC_MATRIX.rows.map((r) => (
                          <tr key={r.role} className="border-b border-navy/[.06]" title={r.note}>
                            <td className="whitespace-nowrap py-2 pr-3 font-bold text-navy">{r.role}</td>
                            {r.v.map((v, i) => (
                              <td key={i} className="px-1 py-2 text-center font-bold" style={{ color: v === "✕" ? "#C0392B" : v === "◐" ? "#8A5D12" : "#1E7A5A" }}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {SEC_MATRIX.rows.map((r) => (
                      <div key={r.role} className="text-[11px] leading-[1.6] text-muted">· {r.role} — {r.note}</div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] font-bold leading-[1.7] text-danger">{SEC_MATRIX.foot}</p>
                </Panel>

                {/* 기술 통제 */}
                <Panel className="min-w-0">
                  <PanelHead title="기술 통제" right={<span className="text-[12px] text-muted">키와 데이터를 같은 곳에 두지 않는다</span>} />
                  <div className="mt-3 space-y-2.5">
                    {SEC_TECH.map((t2) => (
                      <div key={t2.k} className="flex items-baseline gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-navy">{t2.k}</div>
                          <div className="text-[11px] text-muted">{t2.note}</div>
                        </div>
                        <span className="shrink-0 text-right font-num text-[12px] font-bold text-ink">{t2.v}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* AI 데이터 경계 */}
                <Panel className="min-w-0">
                  <PanelHead title={<><span className="mr-2 rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">AI</span>AI 데이터 경계</>} right={<span className="text-[12px] text-muted">모델이 바뀌어도 데이터는 우리 것</span>} />
                  <ol className="mt-3 space-y-2">
                    {SEC_AI_RULES.map((r, i) => (
                      <li key={r} className="flex items-start gap-2 text-[12px] leading-[1.65] text-ink">
                        <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-navy/[.08] font-num text-[10px] font-bold text-navy">{i + 1}</span>
                        {r}
                      </li>
                    ))}
                  </ol>
                </Panel>

                {/* 수집→파기 수명주기 */}
                <Panel className="min-w-0">
                  <PanelHead title="데이터 수명주기 — 수집부터 파기까지" />
                  <ol className="mt-3 space-y-2.5">
                    {SEC_LIFECYCLE.map(([k, v], i) => (
                      <li key={k} className="flex items-start gap-3">
                        <span className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gold font-num text-[10px] font-bold text-navy">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <div className="text-[13px] font-bold text-navy">{k}</div>
                          <div className="text-[12px] leading-[1.6] text-muted">{v}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>

                {/* 침해 대응 */}
                <Panel className="min-w-0">
                  <PanelHead title="침해 대응 플레이북" right={<span className="text-[12px] font-bold text-danger">숨기지 않는 것이 신뢰 해자</span>} />
                  <div className="mt-3 space-y-2">
                    {SEC_INCIDENT.map(([k, v, sla], i) => (
                      <div key={k} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <span className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[10px] font-bold text-white">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-navy">{k}</div>
                          <div className="text-[12px] leading-[1.6] text-muted">{v}</div>
                        </div>
                        <span className="shrink-0 rounded-full bg-navy/[.06] px-2 py-0.5 font-num text-[10px] font-bold text-navy">{sla}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 구현 현황 */}
                <Panel className="min-w-0">
                  <PanelHead title="구현 현황 — 데모 vs 실서비스" right={<span className="text-[12px] text-muted">정직한 표기 — 데모는 목 데이터</span>} />
                  <div className="mt-3 space-y-2">
                    {SEC_STATUS.map((st) => (
                      <div key={st.k} className="flex items-center gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-navy">{st.k}</div>
                          <div className="text-[11px] text-muted">{st.note}</div>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={st.state === "구현" ? { color: "#1E7A5A", background: "rgba(30,122,90,.1)" } : { color: "#8A5D12", background: "rgba(138,93,18,.12)" }}
                        >
                          {st.state}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    실서비스 전환 게이트 — 서버 DB 이전 · 필드 암호화 · PIA 완료 전에는 실명 데이터를 넣지 않습니다.
                    데모의 인물 · 건강 정보는 전부 가상입니다.
                  </p>
                </Panel>
              </div>
            </div>
          )}

          {tab === "lifecycle" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[17px] font-bold text-navy">{LIFECYCLE_HEAD.title}</h2>
                <p className="mt-1 max-w-[760px] text-[13px] leading-[1.75] text-muted">{LIFECYCLE_HEAD.desc}</p>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                {LIFECYCLE_HEAD.gaps.map((g) => (
                  <Panel key={g.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{g.k}</div>
                    <div className="mt-1 text-[15px] font-bold" style={{ color: TONE[g.tone].fg }}>{g.v}</div>
                    <div className="mt-1.5 text-[11px] leading-[1.6] text-muted">{g.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 1. 후견 · 법정대리 */}
              <Panel className="min-w-0">
                <PanelHead title="후견 · 법정대리" right={<span className="text-[11px] font-bold text-amber">{GUARDIANSHIP.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{GUARDIANSHIP.why}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-[12px]">
                    <caption className="sr-only">후견 유형별 대리 범위</caption>
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th scope="col" className="py-2 pr-4">유형</th>
                        <th scope="col" className="py-2 pr-4">판단 능력</th>
                        <th scope="col" className="py-2 pr-4">대리 범위</th>
                        <th scope="col" className="py-2">우리 처리</th>
                      </tr>
                    </thead>
                    <tbody className="rows-in">
                      {GUARDIANSHIP.types.map((t) => (
                        <tr key={t.k} className="border-b border-navy/[.06]">
                          <th scope="row" className="whitespace-nowrap py-2.5 pr-4 font-bold text-navy">{t.k}</th>
                          <td className="whitespace-nowrap py-2.5 pr-4 text-muted">{t.who}</td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-bold" style={{ color: TONE[t.tone].fg }}>{t.can}</td>
                          <td className="py-2.5 leading-[1.6] text-muted">{t.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                  <div>
                    <div className="text-[12px] font-bold text-navy">권한 이전 4단계</div>
                    <div className="mt-2 space-y-2">
                      {GUARDIANSHIP.ladder.map((l) => (
                        <div key={l.step} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                          <div className="flex items-baseline gap-2">
                            <span className="font-num text-[11px] font-bold text-gold">{l.step}</span>
                            <span className="text-[13px] font-bold text-navy">{l.k}</span>
                            <span className="ml-auto text-[10px] font-bold text-muted">{l.who}</span>
                          </div>
                          <div className="mt-1 text-[11px] leading-[1.65] text-muted">
                            <b className="text-navy/70">방아쇠</b> {l.trig}
                          </div>
                          <div className="mt-0.5 text-[11px] leading-[1.65] text-muted">
                            <b className="text-navy/70">조치</b> {l.act}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-danger">회사가 하지 않는 것</div>
                    <ul className="mt-2 space-y-2">
                      {GUARDIANSHIP.never.map((n) => (
                        <li key={n} className="flex gap-2 rounded-xl border border-danger/15 bg-danger/[.04] px-3.5 py-2.5 text-[12px] leading-[1.7] text-ink">
                          <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-danger" />
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>

              {/* 2. 임종 · 멤버십 종결 */}
              <Panel className="min-w-0">
                <PanelHead title="임종 · 멤버십 종결" right={<span className="text-[11px] font-bold text-amber">{BEREAVEMENT.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{BEREAVEMENT.why}</p>

                <div className="mt-3 space-y-2">
                  {BEREAVEMENT.flow.map((f) => (
                    <div key={f.d} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: TONE[f.tone].fg, background: TONE[f.tone].bg }}>{f.d}</span>
                      <span className="text-[13px] font-bold text-navy">{f.k}</span>
                      <span className="w-full text-[11px] leading-[1.65] text-muted sm:w-auto sm:flex-1">{f.act}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="overflow-x-auto">
                    <div className="text-[12px] font-bold text-navy">정산 규칙</div>
                    <table className="mt-2 w-full min-w-[300px] text-left text-[12px]">
                      <caption className="sr-only">사망 시 항목별 정산 규칙</caption>
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th scope="col" className="py-2 pr-3">항목</th>
                          <th scope="col" className="py-2 pr-3">처리</th>
                          <th scope="col" className="py-2">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {BEREAVEMENT.settle.map((r) => (
                          <tr key={r.k} className="border-b border-navy/[.06]">
                            <th scope="row" className="py-2.5 pr-3 font-bold text-navy">{r.k}</th>
                            <td className="py-2.5 pr-3 text-navy">{r.rule}</td>
                            <td className="py-2.5 leading-[1.6] text-muted">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-navy">기록 처리</div>
                    <p className="mt-2 text-[11px] leading-[1.8] text-muted">{BEREAVEMENT.records.rule}</p>
                    <div className="mt-2 space-y-1.5">
                      {BEREAVEMENT.records.options.map((o) => (
                        <div key={o.k} className="rounded-lg border border-navy/[.06] bg-white/60 px-3 py-2 text-[11px] leading-[1.6]">
                          <b className="text-navy">{o.k}</b> <span className="text-muted">{o.v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2.5 rounded-lg bg-gold/[.08] px-3 py-2 text-[11px] leading-[1.7] text-amber">{BEREAVEMENT.voiceNote}</p>
                  </div>
                </div>
              </Panel>

              {/* 3. 실종 · 배회 */}
              <Panel className="min-w-0">
                <PanelHead title="실종 · 배회 대응" right={<span className="text-[11px] font-bold text-green">{MISSING.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{MISSING.why}</p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="overflow-x-auto">
                    <div className="text-[12px] font-bold text-navy">감지 신호 — 단독 판단 금지</div>
                    <table className="mt-2 w-full min-w-[300px] text-left text-[12px]">
                      <caption className="sr-only">배회 감지 신호와 신뢰도</caption>
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th scope="col" className="py-2 pr-3">신호</th>
                          <th scope="col" className="py-2 pr-3">조건</th>
                          <th scope="col" className="py-2">신뢰도</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MISSING.signals.map((r) => (
                          <tr key={r.k} className="border-b border-navy/[.06]">
                            <th scope="row" className="py-2.5 pr-3 font-bold text-navy">{r.k}</th>
                            <td className="py-2.5 pr-3 text-muted">{r.d}</td>
                            <td className="py-2.5 font-bold text-navy">{r.conf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-navy">초동 프로토콜</div>
                    <div className="mt-2 space-y-1.5">
                      {MISSING.protocol.map((r) => (
                        <div key={r.t} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border border-navy/[.06] bg-white/60 px-3 py-2">
                          <span className="font-num text-[11px] font-bold" style={{ color: r.tone ? TONE[r.tone].fg : "#B08D57" }}>{r.t}</span>
                          <span className="text-[12px] font-bold text-navy">{r.k}</span>
                          <span className="ml-auto text-[10px] font-bold text-muted">{r.who}</span>
                          <span className="w-full text-[11px] leading-[1.6] text-muted">{r.act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {MISSING.prepare.map((r) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="text-[12px] font-bold text-navy">{r.k}</div>
                      <div className="mt-1 text-[11px] leading-[1.6] text-muted">{r.v}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.75] text-muted">{MISSING.limit}</p>
              </Panel>

              {/* 4. 학대 의심 */}
              <Panel className="min-w-0">
                <PanelHead title="노인학대 의심 대응" right={<span className="text-[11px] font-bold text-amber">{ABUSE.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{ABUSE.why}</p>
                <p className="mt-2.5 rounded-xl border border-navy/10 bg-white/60 px-3.5 py-2.5 text-[11px] leading-[1.8] text-ink">{ABUSE.legal}</p>

                <div className="mt-3.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ABUSE.kinds.map((r) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="text-[12px] font-bold text-navy">{r.k}</div>
                      <div className="mt-1 text-[11px] leading-[1.6] text-muted">{r.sign}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[12px] font-bold text-green">현장에서 할 것</div>
                    <ul className="mt-2 space-y-1.5">
                      {ABUSE.onsite.do.map((t) => (
                        <li key={t} className="flex gap-2 rounded-lg border border-green/15 bg-green/[.04] px-3 py-2 text-[11px] leading-[1.7] text-ink">
                          <span className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-green" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-danger">절대 하지 않을 것</div>
                    <ul className="mt-2 space-y-1.5">
                      {ABUSE.onsite.dont.map((t) => (
                        <li key={t} className="flex gap-2 rounded-lg border border-danger/15 bg-danger/[.04] px-3 py-2 text-[11px] leading-[1.7] text-ink">
                          <span className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-danger" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5">
                  {ABUSE.flow.map((r) => (
                    <div key={r.t} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border border-navy/[.06] bg-white/60 px-3 py-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: r.tone ? TONE[r.tone].fg : "#5C5A54", background: r.tone ? TONE[r.tone].bg : "rgba(10,31,60,.06)" }}>{r.t}</span>
                      <span className="text-[12px] font-bold text-navy">{r.k}</span>
                      <span className="ml-auto text-[10px] font-bold text-muted">{r.who}</span>
                      <span className="w-full text-[11px] leading-[1.6] text-muted">{r.act}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 rounded-xl bg-danger/[.05] px-3.5 py-2.5 text-[11px] leading-[1.8] text-ink">{ABUSE.conflict}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ABUSE.contact.map((c) => (
                    <span key={c.k} className="rounded-full border border-navy/15 bg-white/70 px-3 py-1 text-[11px] text-muted">
                      <b className="text-navy">{c.k}</b> <span className="font-num font-bold text-danger">{c.v}</span> · {c.note}
                    </span>
                  ))}
                </div>
              </Panel>

              {/* 5. 청약철회 · 해지 */}
              <Panel className="min-w-0">
                <PanelHead title="청약철회 · 해지 · 환불" right={<span className="text-[11px] font-bold text-amber">{WITHDRAWAL.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{WITHDRAWAL.why}</p>
                <p className="mt-2 rounded-xl border border-amber/20 bg-gold/[.06] px-3.5 py-2.5 text-[11px] leading-[1.8] text-amber">{WITHDRAWAL.legalNote}</p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="overflow-x-auto">
                    <div className="text-[12px] font-bold text-navy">계약 단위</div>
                    <table className="mt-2 w-full min-w-[320px] text-left text-[12px]">
                      <caption className="sr-only">계약 해지 시점별 환불</caption>
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th scope="col" className="py-2 pr-3">구분</th>
                          <th scope="col" className="py-2 pr-3">시점</th>
                          <th scope="col" className="py-2">비용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WITHDRAWAL.rows.map((r) => (
                          <tr key={r.k} className="border-b border-navy/[.06]">
                            <th scope="row" className="py-2.5 pr-3 font-bold text-navy">{r.k}</th>
                            <td className="py-2.5 pr-3 text-muted">{r.when}</td>
                            <td className="py-2.5 font-bold" style={{ color: TONE[r.tone].fg }}>{r.fee}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="text-[12px] font-bold text-navy">회차 단위 (예약 변경·취소)</div>
                    <table className="mt-2 w-full min-w-[300px] text-left text-[12px]">
                      <caption className="sr-only">회차 취소 수수료</caption>
                      <thead>
                        <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                          <th scope="col" className="py-2 pr-3">시점</th>
                          <th scope="col" className="py-2 pr-3">수수료</th>
                          <th scope="col" className="py-2">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WITHDRAWAL.visitCancel.map((r) => (
                          <tr key={r.k} className="border-b border-navy/[.06]">
                            <th scope="row" className="py-2.5 pr-3 font-bold text-navy">{r.k}</th>
                            <td className="py-2.5 pr-3 font-bold" style={{ color: r.tone ? TONE[r.tone].fg : "#0A1F3C" }}>{r.fee}</td>
                            <td className="py-2.5 leading-[1.6] text-muted">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-navy/[.04] px-3.5 py-2.5 text-[11px] leading-[1.8] text-ink">{WITHDRAWAL.diff}</p>
              </Panel>

              {/* 6. 고충 · 이의제기 */}
              <Panel className="min-w-0">
                <PanelHead title="고충 · 이의제기" right={<span className="text-[11px] font-bold text-green">{GRIEVANCE.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{GRIEVANCE.why}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {GRIEVANCE.who.map((r) => (
                    <div key={r.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                      <div className="text-[12px] font-bold text-navy">{r.k}</div>
                      <div className="mt-1 text-[11px] leading-[1.6] text-muted">{r.how}</div>
                      {r.note && <div className="mt-1 text-[10px] text-muted/80">{r.note}</div>}
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                  {GRIEVANCE.stages.map((r) => (
                    <div key={r.s} className="rounded-xl border border-navy/[.08] bg-white/60 px-4 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white">{r.s}</span>
                        <span className="text-[13px] font-bold text-navy">{r.k}</span>
                        <span className="ml-auto text-[10px] font-bold text-gold">{r.due}</span>
                      </div>
                      <div className="mt-1.5 text-[11px] leading-[1.7] text-muted">
                        <b className="text-navy/70">담당</b> {r.who}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-[1.7] text-muted">{r.note}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <ul className="space-y-1.5">
                    {GRIEVANCE.rules.map((t) => (
                      <li key={t} className="flex gap-2 text-[11px] leading-[1.75] text-ink">
                        <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-gold" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-1.5">
                    {GRIEVANCE.kpi.map((r) => (
                      <div key={r.k} className="flex items-baseline gap-2 rounded-lg border border-navy/[.06] bg-white/60 px-3 py-2">
                        <span className="text-[11px] font-bold text-navy">{r.k}</span>
                        <span className="ml-auto font-num text-[12px] font-bold text-green">{r.v}</span>
                        <span className="text-[10px] text-muted">{r.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* 7. 동의 철회 */}
              <Panel className="min-w-0">
                <PanelHead title="동의 철회" right={<span className="text-[11px] font-bold text-green">{CONSENT_WITHDRAW.check}</span>} />
                <p className="mt-2 max-w-[760px] text-[12px] leading-[1.8] text-muted">{CONSENT_WITHDRAW.why}</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[12px]">
                    <caption className="sr-only">동의 항목별 철회 시 영향</caption>
                    <thead>
                      <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                        <th scope="col" className="py-2 pr-4">동의 항목</th>
                        <th scope="col" className="py-2 pr-4">철회 시</th>
                        <th scope="col" className="py-2">구분</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONSENT_WITHDRAW.items.map((r) => (
                        <tr key={r.k} className="border-b border-navy/[.06]">
                          <th scope="row" className="py-2.5 pr-4 font-bold text-navy">{r.k}</th>
                          <td className="py-2.5 pr-4 leading-[1.6] text-muted">{r.effect}</td>
                          <td className="py-2.5">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={r.block ? { color: TONE.bad.fg, background: TONE.bad.bg } : { color: TONE.ok.fg, background: TONE.ok.bg }}>
                              {r.block ? "필수" : "선택"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {CONSENT_WITHDRAW.rule.map((t) => (
                    <li key={t} className="flex gap-2 text-[11px] leading-[1.75] text-ink">
                      <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-gold" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}
          </StaggerIn>
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
          stage={AI_STAGE_NOW}
          evidence={AI_EVIDENCE.admin}
        />
      </div>
    </>
  );
}
