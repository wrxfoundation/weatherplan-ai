/**
 * Weather Plan AI · AI 성적표
 * ─────────────────────────────────────────────
 * SEO · AEO · GEO 통합 무료 진단 — "우리 사이트, AI 검색에서 몇 점일까?"
 *
 * 디자인: index.jsx v5 규약 그대로
 *  · 폰트 weight 400/500/600만 사용
 *  · 시그니처 brand-teal · 네이비 #050038 · warm off-white #F7F5EE
 *  · glass-card / nl-shine / reveal 등 globals.css 클래스 재사용
 *
 * 데이터 흐름:
 *  · POST /api/scorecard        → 결정론 진단 (lib/scorecardEngine)
 *  · POST /api/scorecard-insight → wellbian AI 총평 (선택 — 실패해도 리포트는 유지)
 *  · 데모 리포트는 같은 엔진을 클라이언트에서 돌려 생성 (네트워크 0)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import { analyzeHtml, runScorecard, AI_BOTS } from "../lib/scorecardEngine";

/* ═════════════════════════════════════════════════════════════
   0.  DESIGN TOKENS  (index.jsx v5와 동일)
   ═════════════════════════════════════════════════════════════ */

const T = {
  canvas: "#FFFFFF",
  surface: "#F7F5EE",
  surfaceSoft: "#FAFAF6",
  hairline: "#E5E1D6",
  hairlineSoft: "#EFEBE0",
  hairlineStrong: "#C9C5B7",

  inkDeep: "#050038",
  ink: "#0F0A2E",
  charcoal: "#2D2A4A",
  slate: "#6B6781",
  steel: "#8E8AA3",
  stone: "#A5A2B8",
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.62)",

  primary: "#050038",
  onPrimary: "#FFFFFF",

  brandBlue: "#4262FF",
  navy: "#1E3A8A",
  navyLight: "#DBE5FA",

  brandCoral: "#FF6850",
  coralLight: "#FFE0D6",
  coralDark: "#8B2C16",

  brandRose: "#F4C8C8",
  roseLight: "#FBE4E4",

  brandTeal: "#4EB3A8",
  tealLight: "#CDEEE8",
  mossDark: "#14443B",

  successAccent: "#1FAB6A",
  footerBg: "#050038",
};

const R = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, xxxl: 28, feature: 32, full: 9999 };

const GRADE_META = {
  A: { color: "#1FAB6A", soft: "#DDF3E7", label: "AI 검색 선도" },
  B: { color: "#2E9C8F", soft: "#CDEEE8", label: "상위권 — 다듬으면 A" },
  C: { color: "#C77E1B", soft: "#FFE5C2", label: "평균권 — 기회 큼" },
  D: { color: "#E05237", soft: "#FFE0D6", label: "개선 필요" },
  F: { color: "#B3301C", soft: "#FBD9D3", label: "AI 검색 사각지대" },
};

const STATUS_META = {
  pass: { label: "통과", bg: "#DDF3E7", fg: "#116A44" },
  warn: { label: "주의", bg: "#FFE5C2", fg: "#7A4500" },
  fail: { label: "실패", bg: "#FFE0D6", fg: "#8B2C16" },
  manual: { label: "평가 불가", bg: "#E7E3FF", fg: "#4A3DB8" },
  na: { label: "비해당", bg: "#EFEBE0", fg: "#6B6781" },
};

const SEVERITY_META = {
  critical: { label: "치명적", fg: "#B3301C" },
  high: { label: "높음", fg: "#8B2C16" },
  medium: { label: "중간", fg: "#7A4500" },
  low: { label: "낮음", fg: "#6B6781" },
};

const AREA_META = {
  seo: { label: "검색엔진 (SEO)", short: "SEO", desc: "구글·네이버가 크롤·인덱싱하고 이해할 수 있는가", weight: "35%" },
  aeo: { label: "답변엔진 (AEO)", short: "AEO", desc: "AI가 발췌해 답변으로 쓰기 좋은 구조인가", weight: "35%" },
  geo: { label: "생성형엔진 (GEO)", short: "GEO", desc: "생성형 AI가 출처로 인용할 근거가 있는가", weight: "30%" },
};

/* ═════════════════════════════════════════════════════════════
   1.  공용 소품  (index.jsx에서 이식)
   ═════════════════════════════════════════════════════════════ */

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true" className="select-none flex-shrink-0" style={{ display: "block" }}>
      <g stroke="#0091FF" strokeWidth="3.5" strokeLinecap="round">
        <line x1="24" y1="5" x2="24" y2="12" />
        <line x1="32" y1="16" x2="37" y2="11" />
        <line x1="36" y1="24" x2="43" y2="24" />
        <line x1="32" y1="32" x2="37" y2="37" />
        <line x1="24" y1="36" x2="24" y2="43" />
        <line x1="16" y1="32" x2="11" y2="37" />
        <line x1="13" y1="24" x2="9" y2="24" />
        <line x1="16" y1="16" x2="11" y2="11" />
      </g>
      <circle cx="2.8" cy="24" r="2" fill="#4EB3A8" />
      <circle cx="24" cy="24" r="8" stroke="#0091FF" strokeWidth="3" />
      <g stroke="#4EB3A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="19" y1="29" x2="29" y2="19" />
        <polyline points="24,19 29,19 29,24" />
      </g>
    </svg>
  );
}

function BtnPrimary({ children, onClick, fullWidth, compact, href, disabled }) {
  const [pressed, setPressed] = useState(false);
  const Tag = href ? "a" : "button";
  const props = href ? { href } : { onClick, disabled };
  return (
    <Tag
      {...props}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`btn-shine inline-flex items-center justify-center gap-1.5 transition active:translate-y-px ${fullWidth ? "w-full" : ""}`}
      style={{
        background: pressed
          ? "linear-gradient(180deg, #1F1A48 0%, #050038 100%)"
          : "linear-gradient(180deg, #2D2862 0%, #050038 100%)",
        color: T.onPrimary,
        fontSize: compact ? 13 : 14,
        fontWeight: 500,
        padding: compact ? "8px 13px" : "14px 26px",
        borderRadius: R.full,
        whiteSpace: "nowrap",
        flexShrink: 0,
        textDecoration: "none",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "wait" : "pointer",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 0 -1px 0 rgba(0,0,0,0.4)",
          "0 1px 2px rgba(5,0,56,0.14)",
          "0 4px 14px rgba(5,0,56,0.28)",
        ].join(", "),
      }}
    >
      <span className="relative" style={{ zIndex: 2 }}>{children}</span>
    </Tag>
  );
}

function BtnSecondary({ children, onClick, href, compact }) {
  const Tag = href ? "a" : "button";
  const props = href ? { href } : { onClick };
  return (
    <Tag
      {...props}
      className="inline-flex items-center justify-center gap-1.5 transition hover:bg-white active:translate-y-px"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        color: T.ink,
        border: "1px solid rgba(201,197,183,0.7)",
        fontSize: compact ? 13 : 14, fontWeight: 500,
        padding: compact ? "8px 14px" : "13px 24px", borderRadius: R.full,
        textDecoration: "none", whiteSpace: "nowrap",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.95)",
          "inset 0 -1px 0 rgba(5,0,56,0.04)",
          "0 1px 2px rgba(5,0,56,0.04)",
          "0 4px 14px rgba(5,0,56,0.08)",
        ].join(", "),
      }}
    >
      {children}
    </Tag>
  );
}

function Tag_({ tint = "teal", children }) {
  const tints = {
    teal: { bg: T.tealLight, text: T.mossDark },
    coral: { bg: T.coralLight, text: T.coralDark },
    lavender: { bg: "#E7E3FF", text: T.brandBlue },
    amber: { bg: "#FFE5C2", text: "#7A4500" },
  };
  const t = tints[tint] || tints.teal;
  return (
    <span className="inline-flex items-center gap-1.5"
      style={{ background: t.bg, color: t.text, fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: R.full }}>
      {children}
    </span>
  );
}

function LiveDot({ color = T.successAccent }) {
  return (
    <span className="relative inline-flex w-1.5 h-1.5">
      <span className="absolute inset-0 rounded-full opacity-60 animate-ping" style={{ background: color }}></span>
      <span className="relative inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }}></span>
    </span>
  );
}

function Reveal({ children, delay = 0, as: Tag = "div", className = "", style = {}, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { setShown(true); obs.unobserve(el); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${shown ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms", ...style }} {...rest}>
      {children}
    </Tag>
  );
}

/* ═════════════════════════════════════════════════════════════
   2.  진단 전용 소품
   ═════════════════════════════════════════════════════════════ */

function StatusChip({ status, compact }) {
  const m = STATUS_META[status] || STATUS_META.na;
  return (
    <span style={{
      background: m.bg, color: m.fg, fontSize: compact ? 11 : 12, fontWeight: 600,
      padding: compact ? "2px 8px" : "3px 10px", borderRadius: R.full, whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
}

function AreaChip({ area }) {
  return (
    <span style={{
      background: "rgba(5,0,56,0.06)", color: T.charcoal, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: R.full, letterSpacing: "0.04em",
    }}>
      {AREA_META[area]?.short || area}
    </span>
  );
}

function GradeBadge({ grade, size = 44 }) {
  const g = GRADE_META[grade] || GRADE_META.C;
  return (
    <span className="inline-flex items-center justify-center flex-shrink-0" style={{
      width: size, height: size, borderRadius: R.lg,
      background: g.soft, color: g.color, fontSize: size * 0.5, fontWeight: 600,
    }}>
      {grade}
    </span>
  );
}

/* 종합 점수 도넛 게이지 */
function ScoreDonut({ score, grade, size = 200 }) {
  const g = GRADE_META[grade] || GRADE_META.C;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(score), 150);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.hairlineSoft} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={g.color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - anim / 100)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div style={{ color: g.color, fontSize: size * 0.3, fontWeight: 600, lineHeight: 1 }}>{grade}</div>
        <div style={{ color: T.ink, fontSize: size * 0.11, fontWeight: 600, marginTop: 6 }}>
          {score}<span style={{ color: T.steel, fontWeight: 500 }}> / 100</span>
        </div>
      </div>
    </div>
  );
}

/* 영역 점수 바 */
function ScoreBar({ value, color, height = 8 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ background: T.hairlineSoft, borderRadius: R.full, height, overflow: "hidden" }}>
      <div style={{
        width: `${w}%`, height: "100%", background: color, borderRadius: R.full,
        transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)",
      }} />
    </div>
  );
}

/* 6축 레이더 차트 */
function RadarChart({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2;
  const rMax = size / 2 - 42;
  const n = data.length;
  const pt = (i, ratio) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(ang) * rMax * ratio, cy + Math.sin(ang) * rMax * ratio];
  };
  const ringPath = (ratio) =>
    data.map((_, i) => pt(i, ratio).map((v) => v.toFixed(1)).join(",")).join(" ");
  const valuePoly = data
    .map((d, i) => pt(i, Math.max(0.04, (d.value ?? 0) / 100)).map((v) => v.toFixed(1)).join(","))
    .join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }} role="img"
      aria-label="영역별 6축 점수 레이더 차트">
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon key={ratio} points={ringPath(ratio)} fill="none"
          stroke={ratio === 1 ? T.hairlineStrong : T.hairlineSoft} strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.hairlineSoft} strokeWidth="1" />;
      })}
      <polygon points={valuePoly} fill="rgba(78,179,168,0.24)" stroke={T.brandTeal} strokeWidth="2"
        strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = pt(i, Math.max(0.04, (d.value ?? 0) / 100));
        return <circle key={i} cx={x} cy={y} r="3.5" fill={T.brandTeal} stroke="#fff" strokeWidth="1.5" />;
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, 1.22);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 11, fontWeight: 600, fill: T.charcoal }}>
            {d.label}
            <tspan x={x} dy="13" style={{ fontSize: 11, fontWeight: 500, fill: T.steel }}>
              {d.value == null ? "—" : `${d.value}점`}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

/* 복사 버튼 */
function CopyBtn({ text, label = "복사" }) {
  const [done, setDone] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* 클립보드 권한 없는 환경 — 조용히 무시 */
    }
  }, [text]);
  return (
    <button onClick={copy} className="transition hover:opacity-80"
      style={{
        background: done ? T.tealLight : "rgba(5,0,56,0.06)",
        color: done ? T.mossDark : T.charcoal,
        fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: R.full, border: "none",
      }}>
      {done ? "복사됨 ✓" : label}
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════
   3.  체크 아코디언
   ═════════════════════════════════════════════════════════════ */

function CheckItem({ check, defaultOpen = false, rank }) {
  const [open, setOpen] = useState(defaultOpen);
  const sev = SEVERITY_META[check.severity] || SEVERITY_META.medium;
  return (
    <div className="glass-card" style={{ borderRadius: R.xl, overflow: "hidden" }}>
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-left transition hover:bg-white/40"
        style={{ padding: "14px 18px", background: "transparent", border: "none" }}>
        {rank != null && (
          <span className="flex-shrink-0" style={{ color: T.stone, fontSize: 12, fontWeight: 600, width: 18 }}>
            {rank}
          </span>
        )}
        <StatusChip status={check.status} compact />
        <span className="flex-1 min-w-0" style={{ color: T.ink, fontSize: 14, fontWeight: 500 }}>
          {check.label}
        </span>
        <span className="hidden sm:inline" style={{ color: sev.fg, fontSize: 11, fontWeight: 600 }}>
          {sev.label}
        </span>
        <AreaChip area={check.area} />
        <span aria-hidden="true" style={{
          color: T.steel, fontSize: 12, transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.25s ease", flexShrink: 0,
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.hairlineSoft}` }}>
          <p style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 1.7, paddingTop: 14 }}>
            {check.summary}
          </p>

          {check.details?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
              {check.details.map((d) => (
                <div key={d.k} className="flex items-baseline gap-2 min-w-0">
                  <span className="flex-shrink-0" style={{ color: T.steel, fontSize: 12, fontWeight: 500 }}>{d.k}</span>
                  <span className="truncate" style={{ color: T.ink, fontSize: 12.5, fontWeight: 500 }} title={d.v}>{d.v}</span>
                </div>
              ))}
            </div>
          )}

          {check.passRule && (
            <div className="mt-3" style={{ color: T.steel, fontSize: 12 }}>
              통과 조건 · {check.passRule}
            </div>
          )}

          {check.fix && (
            <div className="mt-4" style={{
              background: "rgba(5,0,56,0.028)", borderRadius: R.lg,
              border: `1px solid ${T.hairlineSoft}`, padding: 14,
            }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span style={{
                    background: T.tealLight, color: T.mossDark, fontSize: 11, fontWeight: 600,
                    padding: "2px 8px", borderRadius: R.full,
                  }}>{check.fix.action}</span>
                  <span style={{ color: T.ink, fontSize: 13, fontWeight: 600 }}>{check.fix.title}</span>
                </div>
                {check.fix.code && <CopyBtn text={check.fix.code} label="수정안 복사" />}
              </div>
              {check.fix.note && (
                <p style={{ color: T.slate, fontSize: 12.5, lineHeight: 1.65, marginTop: 8 }}>
                  {check.fix.note}
                </p>
              )}
              {check.fix.code && (
                <pre className="overflow-x-auto mt-3" style={{
                  background: T.inkDeep, color: "#D9F2EE", fontSize: 12, lineHeight: 1.65,
                  padding: "12px 14px", borderRadius: R.md, margin: 0,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                }}>{check.fix.code}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   4.  AI 크롤러 보드
   ═════════════════════════════════════════════════════════════ */

function BotBoard({ bots }) {
  const groups = [
    {
      key: "search", title: "AI 검색 봇",
      desc: "ChatGPT Search·Perplexity 등 — 차단되면 AI 답변에 인용될 수 없습니다.",
    },
    {
      key: "train", title: "학습/수집 봇",
      desc: "모델 학습용 크롤러 — 정책에 따라 의도적으로 막을 수도 있습니다.",
    },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {groups.map((g) => {
        const list = bots.filter((b) => b.kind === g.key);
        const blocked = list.filter((b) => !b.robotsAllowed).length;
        return (
          <div key={g.key} className="glass-card" style={{ borderRadius: R.xxl, padding: 22 }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
              <div style={{ color: T.ink, fontSize: 15, fontWeight: 600 }}>{g.title}</div>
              <span style={{
                background: blocked === 0 ? T.tealLight : T.coralLight,
                color: blocked === 0 ? T.mossDark : T.coralDark,
                fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: R.full,
              }}>
                {blocked === 0 ? "전체 접근 가능" : `${blocked}개 차단`}
              </span>
            </div>
            <p style={{ color: T.slate, fontSize: 12.5, lineHeight: 1.6, marginBottom: 14 }}>{g.desc}</p>
            <div className="flex flex-col" style={{ gap: 1 }}>
              <div className="grid items-center" style={{
                gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr) auto auto", gap: 10,
                padding: "6px 10px", color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
              }}>
                <span>봇</span><span>제공사</span><span className="text-right">robots</span><span className="text-right">라이브 페치</span>
              </div>
              {list.map((b) => (
                <div key={b.ua} className="grid items-center" style={{
                  gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr) auto auto", gap: 10,
                  padding: "9px 10px", borderRadius: R.md, background: "rgba(255,255,255,0.5)",
                }}>
                  <span className="truncate" style={{ color: T.ink, fontSize: 13, fontWeight: 500 }} title={b.robotsRule}>
                    {b.ua}
                  </span>
                  <span style={{ color: T.slate, fontSize: 12 }}>{b.vendor}</span>
                  <span className="text-right" style={{
                    color: b.robotsAllowed ? "#116A44" : T.coralDark, fontSize: 12, fontWeight: 600,
                  }}>
                    {b.robotsAllowed ? "허용" : "차단"}
                  </span>
                  <span className="text-right" style={{
                    color: !b.live?.ran ? T.stone : b.live.ok ? "#116A44" : T.coralDark,
                    fontSize: 12, fontWeight: 600, minWidth: 64,
                  }}>
                    {!b.live?.ran ? "미실행" : b.live.ok ? `OK ${b.live.status}` : `차단 ${b.live.status || ""}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   5.  wellbian AI 총평 카드
   ═════════════════════════════════════════════════════════════ */

function InsightCard({ state, insight }) {
  return (
    <div className={`glass-card nl-shine ${state === "loading" ? "nl-shine-active" : ""}`}
      style={{ borderRadius: R.xxxl, padding: "26px 28px" }}>
      <div className="flex items-center gap-2.5 mb-4">
        <Logo size={26} />
        <span style={{ color: T.ink, fontSize: 14, fontWeight: 600 }}>wellbian AI 총평</span>
        {state === "loading" && (
          <span className="inline-flex items-center gap-1.5" style={{ color: T.slate, fontSize: 12.5 }}>
            <LiveDot color={T.brandTeal} /> 진단 결과를 읽고 있습니다…
          </span>
        )}
      </div>

      {state === "loading" && (
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          {[92, 100, 64].map((w, i) => (
            <div key={i} className="animate-pulse" style={{
              width: `${w}%`, height: 13, borderRadius: R.sm, background: "rgba(5,0,56,0.07)",
            }} />
          ))}
        </div>
      )}

      {state === "error" && (
        <p style={{ color: T.slate, fontSize: 13.5, lineHeight: 1.7 }}>
          AI 총평을 불러오지 못했습니다 — 아래 결정론 진단 결과는 그대로 유효합니다.
        </p>
      )}

      {state === "done" && insight && (
        <div>
          {insight.headline && (
            <div style={{ color: T.inkDeep, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>
              “{insight.headline}”
            </div>
          )}
          {insight.summary && (
            <p style={{ color: T.charcoal, fontSize: 14, lineHeight: 1.75 }}>{insight.summary}</p>
          )}
          {insight.priorities?.length > 0 && (
            <ol className="mt-4 flex flex-col gap-2">
              {insight.priorities.map((pr, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 inline-flex items-center justify-center" style={{
                    width: 20, height: 20, borderRadius: R.full, background: T.tealLight,
                    color: T.mossDark, fontSize: 11, fontWeight: 600, marginTop: 1,
                  }}>{i + 1}</span>
                  <span style={{ color: T.ink, fontSize: 13.5, lineHeight: 1.65 }}>{pr}</span>
                </li>
              ))}
            </ol>
          )}
          {insight.outlook && (
            <p className="mt-4" style={{
              color: T.mossDark, fontSize: 13, lineHeight: 1.7, background: "rgba(78,179,168,0.12)",
              padding: "10px 14px", borderRadius: R.lg,
            }}>
              {insight.outlook}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   6.  데모 리포트 (엔진을 클라이언트에서 그대로 실행 — 네트워크 0)
   ═════════════════════════════════════════════════════════════ */

const DEMO_HTML = `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><title>한빛테크</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="한빛테크는 산업용 센서와 데이터 솔루션을 공급하는 전문기업입니다. 제조·물류 현장의 자동화와 예지보전을 지원합니다.">
<meta property="og:title" content="한빛테크">
<link rel="icon" href="/favicon.ico">
<script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebSite", "name": “한빛테크" }</script>
</head><body>
<h2>산업용 센서 전문기업 한빛테크</h2>
<p>한빛테크는 다양한 산업 현장에 센서 기반 데이터 솔루션을 공급하고 있으며 제조 물류 유통 등 여러 분야의 고객사와 함께 현장의 문제를 해결하기 위해 오랜 시간 축적한 기술 역량과 경험을 바탕으로 신뢰할 수 있는 제품과 서비스를 지속적으로 제공하는 것을 목표로 하고 있습니다.</p>
<h3>주요 제품</h3>
<p>온도 센서, 습도 센서, 진동 센서 라인업 24종을 보유하고 있습니다. 2011년 설립 이후 340개 고객사에 공급했습니다.</p>
<h3>적용 산업</h3>
<p>제조 설비 예지보전, 콜드체인 물류 모니터링, 스마트팜 환경 제어 분야에서 활용되고 있으며 도입 현장의 설비 비가동 시간은 평균 18% 감소한 것으로 집계되었습니다.</p>
<img src="/p1.jpg" alt="온도 센서 제품"><img src="/p2.jpg"><img src="/p3.jpg"><img src="/p4.jpg" alt="진동 센서 제품 사진"><img src="/p5.jpg">
<footer><a href="/about">회사 소개</a> · <a href="/contact">문의</a>
<p>© 한빛테크 · 대표이사 홍길동 · 사업자등록번호 000-00-00000 · 2026.05.02 업데이트</p></footer>
</body></html>`;

function buildDemoResult() {
  const parsed = analyzeHtml(DEMO_HTML);
  const bots = AI_BOTS.map((b) => ({
    ...b,
    robotsAllowed: b.ua !== "CCBot",
    robotsRule: b.ua === "CCBot" ? "Disallow: /" : "Allow: / (for *)",
    live: ["OAI-SearchBot", "GPTBot", "ClaudeBot", "PerplexityBot"].includes(b.ua)
      ? { ran: true, ok: true, status: 200 }
      : { ran: false, ok: null, status: null },
  }));
  const report = runScorecard({
    url: "https://demo.hanbit-tech.example/",
    finalUrl: "https://demo.hanbit-tech.example/",
    host: "demo.hanbit-tech.example",
    path: "/",
    scheme: "https",
    status: 200,
    redirects: 1,
    responseMs: 1840,
    tlsValid: true,
    tlsError: null,
    mixedContentCount: 0,
    xRobotsTag: null,
    parsed,
    robots: { found: true, parsed: { groups: [{ agents: ["*"], rules: [{ type: "allow", path: "/" }] }], sitemaps: [] }, sitemaps: [] },
    llmsTxtFound: false,
    sitemapXml: { checked: true, ok: true, status: 200 },
    bots,
  });
  return {
    ok: true,
    demo: true,
    target: {
      input: "demo.hanbit-tech.example", finalUrl: "https://demo.hanbit-tech.example/",
      host: "demo.hanbit-tech.example", status: 200, redirects: 1, responseMs: 1840,
      scheme: "https", tlsValid: true,
    },
    bots,
    report,
    scannedAt: new Date().toISOString(),
  };
}

const DEMO_INSIGHT = {
  headline: "읽을 수는 있지만 인용할 이유가 없는 사이트",
  summary:
    "크롤 접근성과 보안 연결, 봇 개방성은 안정적입니다. 하지만 AI가 이 사이트를 답변에 인용하려면 근거가 필요한데 — 깨진 JSON-LD와 빈약한 엔티티 신호, H1 없는 문서 구조가 인용 경로를 막고 있습니다.",
  priorities: [
    "깨진 JSON-LD의 굽은 따옴표부터 고치세요 — 문법 오류 하나로 구조화 데이터 전체가 무시되고 있습니다.",
    "Organization 스키마에 sameAs로 공식 채널을 연결하고, 페이지 주제를 담은 H1을 추가하세요.",
    "핵심 섹션을 질문형 헤딩으로 늘리고, 첫 문장에 수치가 담긴 직접 답변과 1차 출처 링크를 두세요.",
  ],
  outlook:
    "위 세 가지만 반영해도 답변엔진이 발췌할 수 있는 구조가 갖춰집니다. 이후 통계·1차 출처를 보강하면 생성형 엔진의 출처 카드에 오를 확률이 실질적으로 올라갑니다.",
};

/* ═════════════════════════════════════════════════════════════
   7.  벤치마크 위치 추정 (베타 기준선 — 정규분포 근사)
   ═════════════════════════════════════════════════════════════ */

function percentileEstimate(score, mean = 64, sd = 12) {
  const z = (score - mean) / sd;
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  const cdf = 0.5 * (1 + (z >= 0 ? erf : -erf));
  return Math.min(99, Math.max(1, Math.round((1 - cdf) * 100)));
}

/* ═════════════════════════════════════════════════════════════
   8.  NAV · FOOTER
   ═════════════════════════════════════════════════════════════ */

function NavLite() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 print-hide"
      style={{
        background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.98)",
        boxShadow: scrolled ? "0 1px 0 rgba(5,0,56,0.06)" : "0 1px 0 rgba(229,225,214,0.5)",
        backdropFilter: "blur(14px) saturate(180%)",
        WebkitBackdropFilter: "blur(14px) saturate(180%)",
      }}>
      <div className="max-w-[1280px] mx-auto px-6 h-[80px] flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Logo size={36} />
          <div className="leading-none min-w-0">
            <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Weather Plan AI <span style={{ color: T.brandTeal }}>·</span> AI 성적표
            </div>
            <div className="hidden sm:block" style={{ color: T.slate, fontSize: 11, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
              powered by wellbian AI
            </div>
          </div>
        </a>
        <div className="hidden md:flex items-center gap-7">
          {[
            { href: "#method", label: "진단 기준" },
            { href: "#pro", label: "정밀 진단" },
            { href: "/", label: "Weather Plan AI" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="transition hover:opacity-70"
              style={{ color: T.ink, fontSize: 14, fontWeight: 500 }}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <a href="mailto:weatherplan@kweather.co.kr?subject=AI%20성적표%20전문%20리포트%20문의"
            className="hidden md:inline-block px-3 py-2 mr-1 hover:opacity-70 transition"
            style={{ color: T.ink, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            전문 리포트 문의
          </a>
          <BtnPrimary compact href="/onboarding">
            <span className="hidden sm:inline">무료로 시작 →</span>
            <span className="sm:hidden">시작 →</span>
          </BtnPrimary>
        </div>
      </div>
    </nav>
  );
}

function FooterLite() {
  return (
    <footer className="print-hide" style={{ background: T.footerBg, color: T.onDarkMuted }}>
      <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 48, paddingBottom: 40 }}>
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo size={30} />
              <div className="leading-none">
                <div style={{ color: T.onDark, fontSize: 14, fontWeight: 600 }}>Weather Plan AI</div>
                <div style={{ color: T.onDarkMuted, fontSize: 11, marginTop: 3, letterSpacing: "0.04em", fontWeight: 500 }}>
                  powered by wellbian AI
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, maxWidth: 300 }}>
              국내 최초·최대 날씨 기반 광고 AI.<br />AI 검색 시대의 노출과 전환을 함께 설계합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {[
              { label: "홈", href: "/" },
              { label: "AI 스튜디오", href: "/studio" },
              { label: "이용약관", href: "/legal#terms" },
              { label: "개인정보처리방침", href: "/legal#privacy" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="transition hover:opacity-100"
                style={{ color: T.onDarkMuted, fontSize: 13 }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }}>
          © 2026 Weather Plan AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ═════════════════════════════════════════════════════════════
   9.  메인 페이지
   ═════════════════════════════════════════════════════════════ */

const SCAN_STAGES = [
  "사이트 연결 · 리다이렉트 확인",
  "robots.txt · AI 봇 13종 접근성 검사",
  "구조 · 스키마 · 인용 신호 분석",
  "결정론 체크 26개 채점 · 리포트 생성",
];

const HISTORY_KEY = "wpai-scorecard-history";

export default function AiScorecard() {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");       // idle | running | done | error
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [insightState, setInsightState] = useState("idle"); // idle | loading | done | error
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [areaTab, setAreaTab] = useState("all");
  const [showPassed, setShowPassed] = useState(false);
  const resultRef = useRef(null);
  const inputRef = useRef(null);
  const scanTimerRef = useRef(null);

  /* URL 프리필 (?url=) + 최근 진단 이력 */
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const u = sp.get("url");
      if (u) setInput(u);
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(h)) setHistory(h.slice(0, 5));
    } catch {}
  }, []);

  useEffect(() => () => clearInterval(scanTimerRef.current), []);

  const pushHistory = useCallback((entry) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.host !== entry.host)].slice(0, 5);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const fetchInsight = useCallback(async (data) => {
    setInsightState("loading");
    try {
      const topIssues = data.report.issues.slice(0, 8).map((id) => {
        const c = data.report.checks.find((x) => x.id === id);
        return { label: c.label, status: c.status, severity: c.severity, summary: c.summary };
      });
      const resp = await fetch("/api/scorecard-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: data.target.host,
          overall: data.report.overall,
          grade: data.report.grade,
          areas: data.report.areas,
          issues: topIssues,
        }),
      });
      if (!resp.ok) throw new Error("insight fail");
      const j = await resp.json();
      setInsight(j.insight);
      setInsightState("done");
    } catch {
      setInsightState("error");
    }
  }, []);

  const runScan = useCallback(async (urlArg) => {
    const url = (urlArg ?? input).trim();
    if (!url || stage === "running") return;
    setInput(url);
    setStage("running");
    setScanStep(0);
    setResult(null);
    setInsight(null);
    setInsightState("idle");
    setAreaTab("all");
    setShowPassed(false);

    /* 스캔 단계 연출 — 실제 응답이 오면 즉시 마감 */
    let step = 0;
    scanTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, SCAN_STAGES.length - 1);
      setScanStep(step);
    }, 2600);

    try {
      const resp = await fetch("/api/scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      clearInterval(scanTimerRef.current);
      if (!resp.ok || !data.ok) {
        setErrorMsg(data.error || "진단에 실패했습니다 — 잠시 후 다시 시도해 주세요.");
        setStage("error");
        return;
      }
      setResult(data);
      setStage("done");
      pushHistory({
        host: data.target.host, score: data.report.overall,
        grade: data.report.grade, ts: Date.now(),
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      fetchInsight(data);
    } catch {
      clearInterval(scanTimerRef.current);
      setErrorMsg("네트워크 오류가 발생했습니다 — 잠시 후 다시 시도해 주세요.");
      setStage("error");
    }
  }, [input, stage, pushHistory, fetchInsight]);

  const runDemo = useCallback(() => {
    if (stage === "running") return;
    try {
      const demo = buildDemoResult();
      setResult(demo);
      setInsight(DEMO_INSIGHT);
      setInsightState("done");
      setStage("done");
      setAreaTab("all");
      setShowPassed(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch {}
  }, [stage]);

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setInsight(null);
    setInsightState("idle");
    setErrorMsg("");
    setTimeout(() => inputRef.current?.focus(), 60);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const shareResult = useCallback(async () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}/ai-scorecard?url=${encodeURIComponent(result.target.host)}`;
    const text = `[AI 성적표] ${result.target.host} — 종합 ${result.report.overall}점 (${result.report.grade}등급) · SEO ${result.report.areas.seo.score} · AEO ${result.report.areas.aeo.score} · GEO ${result.report.areas.geo.score}\n${shareUrl}`;
    try { await navigator.clipboard.writeText(text); } catch {}
  }, [result]);

  const report = result?.report;
  const checksById = useMemo(() => {
    const m = {};
    (report?.checks || []).forEach((c) => { m[c.id] = c; });
    return m;
  }, [report]);
  const issueChecks = (report?.issues || []).map((id) => checksById[id]).filter(Boolean);
  const failCount = issueChecks.filter((c) => c.status === "fail").length;
  const manualChecks = (report?.checks || []).filter((c) => c.status === "manual");
  const visibleChecks = (report?.checks || []).filter((c) =>
    (areaTab === "all" || c.area === areaTab) &&
    (showPassed || (c.status !== "pass" && c.status !== "na"))
  );
  const percentile = report ? percentileEstimate(report.overall) : null;

  return (
    <div style={{ background: T.surface, minHeight: "100vh" }}>
      <Head>
        <title>AI 성적표 — 사이트 AI 검색 준비도 무료 진단 | Weather Plan AI</title>
        <meta name="description"
          content="ChatGPT·Claude·Perplexity가 답을 고르는 시대 — SEO·AEO·GEO 결정론 체크 26개를 60초 안에 무료 진단하고, 복붙 가능한 수정안과 wellbian AI 총평까지 받아보세요." />
        <link rel="canonical" href="https://weatherplan-ai.vercel.app/ai-scorecard" />
        <meta property="og:title" content="AI 성적표 — 우리 사이트, AI 검색에서 몇 점일까?" />
        <meta property="og:description" content="SEO·AEO·GEO 통합 무료 진단 — 60초 안에 점수와 복붙 수정안까지." />
        <meta property="og:image" content="https://weatherplan-ai.vercel.app/og-image.png" />
        <meta property="og:url" content="https://weatherplan-ai.vercel.app/ai-scorecard" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "AI 성적표 — Weather Plan AI",
            url: "https://weatherplan-ai.vercel.app/ai-scorecard",
            applicationCategory: "BusinessApplication",
            description: "웹사이트의 AI 검색 준비도(SEO·AEO·GEO)를 무료로 진단하는 도구",
            offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
            publisher: {
              "@type": "Organization",
              name: "Weather Plan AI",
              url: "https://weatherplan-ai.vercel.app",
            },
          }),
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "AI 성적표는 무엇을 진단하나요?",
                acceptedAnswer: { "@type": "Answer", text: "검색엔진(SEO)·답변엔진(AEO)·생성형엔진(GEO) 3개 영역의 결정론 체크 26개로 사이트의 AI 검색 준비도를 진단합니다. 결정론 체크만 점수에 반영해 같은 사이트면 항상 같은 점수가 나옵니다." },
              },
              {
                "@type": "Question",
                name: "진단은 얼마나 걸리고 비용이 드나요?",
                acceptedAnswer: { "@type": "Answer", text: "약 60초 안에 완료되며 무료입니다. 이슈별 복붙 가능한 수정 코드와 wellbian AI 총평이 함께 제공됩니다." },
              },
              {
                "@type": "Question",
                name: "AEO와 GEO는 무엇인가요?",
                acceptedAnswer: { "@type": "Answer", text: "AEO(Answer Engine Optimization)는 AI가 발췌해 답변으로 쓰기 좋은 구조를 만드는 것, GEO(Generative Engine Optimization)는 생성형 AI가 출처로 인용할 근거(통계·스키마·크롤러 개방성)를 갖추는 것입니다." },
              },
            ],
          }),
        }} />
      </Head>

      <NavLite />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden print-hide" style={{ background: T.canvas }}>
        <div className="hero-aurora" />
        <div className="orb orb-teal orb-float" style={{ width: 480, height: 480, top: "-5%", right: "-12%" }} />
        <div className="orb orb-lavender orb-float-slow" style={{ width: 380, height: 380, bottom: "-15%", left: "-8%" }} />

        <div className="max-w-[1280px] mx-auto px-6 over-orb" style={{ paddingTop: 72, paddingBottom: 80 }}>
          <div className="text-center mx-auto" style={{ maxWidth: 760 }}>
            <Tag_ tint="teal">SEO · AEO · GEO 통합 진단 · 무료</Tag_>
            <h1 style={{
              color: T.inkDeep, fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 600,
              letterSpacing: "-0.02em", lineHeight: 1.22, marginTop: 20,
            }}>
              우리 사이트, AI 검색에서<br />
              <span className="marker-underline">몇 점</span>일까요?
            </h1>
            <p style={{ color: T.slate, fontSize: 16, lineHeight: 1.7, marginTop: 18, fontWeight: 400 }}>
              ChatGPT·Claude·Perplexity가 답을 고르는 시대 —<br className="hidden sm:block" />
              크롤 접근성부터 인용 신호까지 <strong style={{ color: T.ink, fontWeight: 600 }}>결정론 체크 26개</strong>를 60초 안에.
              복붙 가능한 수정안까지 드립니다.
            </p>

            {/* URL 입력 */}
            <div className={`glass-card nl-shine ${stage === "running" ? "nl-shine-active" : ""} mx-auto mt-9`}
              style={{ borderRadius: R.xxl, padding: 10, maxWidth: 620 }}>
              <form className="flex flex-col sm:flex-row sm:items-center gap-2" onSubmit={(e) => { e.preventDefault(); runScan(); }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="진단할 사이트 주소 — 예: kweather.co.kr"
                  inputMode="url"
                  autoComplete="url"
                  spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent outline-none"
                  style={{ color: T.ink, fontSize: 15, fontWeight: 500, padding: "10px 12px", border: "none" }}
                  aria-label="진단할 사이트 주소"
                />
                <BtnPrimary onClick={() => runScan()} disabled={stage === "running"}>
                  {stage === "running" ? "진단 중…" : "무료 진단 →"}
                </BtnPrimary>
              </form>
            </div>

            {/* 데모 + 최근 이력 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              <button onClick={runDemo} className="transition hover:opacity-75"
                style={{
                  background: "rgba(5,0,56,0.05)", color: T.charcoal, fontSize: 12.5, fontWeight: 500,
                  padding: "6px 14px", borderRadius: R.full, border: `1px solid ${T.hairline}`,
                }}>
                예시 리포트 미리 보기
              </button>
              {history.map((h) => (
                <button key={h.host} onClick={() => runScan(h.host)} className="transition hover:opacity-75"
                  style={{
                    background: "rgba(255,255,255,0.7)", color: T.slate, fontSize: 12.5, fontWeight: 500,
                    padding: "6px 14px", borderRadius: R.full, border: `1px solid ${T.hairlineSoft}`,
                  }}>
                  {h.host} · <span style={{ color: GRADE_META[h.grade]?.color, fontWeight: 600 }}>{h.score}점</span>
                </button>
              ))}
            </div>

            <p style={{ color: T.stone, fontSize: 12, marginTop: 16 }}>
              결정론 전용 점수 · 같은 사이트는 언제나 같은 점수 · 로그인 없이 무료
            </p>
          </div>

          {/* 진단 중 상태 */}
          {stage === "running" && (
            <div className="glass-card mx-auto mt-10" style={{ borderRadius: R.xxl, padding: 24, maxWidth: 560 }}>
              <div className="flex flex-col gap-3">
                {SCAN_STAGES.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    {i < scanStep ? (
                      <span className="inline-flex items-center justify-center flex-shrink-0" style={{
                        width: 18, height: 18, borderRadius: R.full, background: T.tealLight,
                        color: T.mossDark, fontSize: 10, fontWeight: 600,
                      }}>✓</span>
                    ) : i === scanStep ? (
                      <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: 18 }}>
                        <LiveDot color={T.brandTeal} />
                      </span>
                    ) : (
                      <span className="flex-shrink-0" style={{
                        width: 18, height: 18, borderRadius: R.full, border: `1.5px solid ${T.hairline}`,
                      }} />
                    )}
                    <span style={{
                      color: i <= scanStep ? T.ink : T.stone, fontSize: 13.5,
                      fontWeight: i === scanStep ? 600 : 500,
                    }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 오류 상태 */}
          {stage === "error" && (
            <div className="glass-card mx-auto mt-10" style={{
              borderRadius: R.xxl, padding: 24, maxWidth: 560, borderColor: "rgba(255,104,80,0.4)",
            }}>
              <div style={{ color: T.coralDark, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                진단하지 못했습니다
              </div>
              <p style={{ color: T.slate, fontSize: 13.5, lineHeight: 1.65 }}>{errorMsg}</p>
              <div className="mt-4">
                <BtnSecondary compact onClick={() => { setStage("idle"); setTimeout(() => inputRef.current?.focus(), 60); }}>
                  다시 시도
                </BtnSecondary>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 결과 ─── */}
      {stage === "done" && report && (
        <div ref={resultRef} style={{ scrollMarginTop: 88 }}>
          {/* 점수 히어로 */}
          <section style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 8 }}>
              {result.demo && (
                <div className="mb-6 text-center">
                  <Tag_ tint="amber">예시 리포트 — 가상의 데모 사이트 데이터입니다</Tag_>
                </div>
              )}

              <Reveal className="glass-card" style={{ borderRadius: R.feature, padding: "36px 32px" }}>
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  <ScoreDonut score={report.overall} grade={report.grade} />

                  <div className="flex-1 min-w-0 text-center lg:text-left">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
                      <span style={{ color: T.ink, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
                        {result.target.host}
                      </span>
                      {[
                        `HTTP ${result.target.status}`,
                        `${(result.target.responseMs / 1000).toFixed(2)}s`,
                        result.target.scheme.toUpperCase(),
                        result.target.redirects > 0 ? `리다이렉트 ${result.target.redirects}회` : "리다이렉트 없음",
                      ].map((chip) => (
                        <span key={chip} style={{
                          background: "rgba(5,0,56,0.05)", color: T.slate, fontSize: 11.5, fontWeight: 500,
                          padding: "3px 9px", borderRadius: R.full,
                        }}>{chip}</span>
                      ))}
                    </div>

                    <div style={{ color: T.inkDeep, fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                      {GRADE_META[report.grade]?.label} —{" "}
                      <span style={{ color: GRADE_META[report.grade]?.color }}>종합 {report.overall}점</span>
                    </div>
                    <p style={{ color: T.slate, fontSize: 14, lineHeight: 1.7, marginTop: 10, maxWidth: 560 }}>
                      개선 항목 <strong style={{ color: T.coralDark, fontWeight: 600 }}>{issueChecks.length}건</strong>
                      {failCount > 0 && <> · 실패 <strong style={{ color: T.coralDark, fontWeight: 600 }}>{failCount}건</strong></>}
                      {" "}· 정밀 진단 대상 {manualChecks.length}건 —{" "}
                      베타 기준선 분포 대비{" "}
                      <strong style={{ color: T.ink, fontWeight: 600 }}>
                        {percentile <= 50 ? `상위 ${percentile}%` : `하위 ${100 - percentile}%`}
                      </strong>{" "}
                      수준으로 추정됩니다. 아래 우선순위 수정안을 순서대로 적용하세요.
                    </p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-6 print-hide">
                      <BtnSecondary compact onClick={() => window.print()}>리포트 인쇄 · PDF 저장</BtnSecondary>
                      <BtnSecondary compact onClick={shareResult}>결과 링크 복사</BtnSecondary>
                      <BtnSecondary compact onClick={reset}>새 진단</BtnSecondary>
                      <BtnPrimary compact href="mailto:weatherplan@kweather.co.kr?subject=AI%20성적표%20전문%20리포트%20문의">
                        전문가 상담 →
                      </BtnPrimary>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* wellbian AI 총평 + 영역 점수 */}
          <section style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 28, paddingBottom: 8 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <Reveal className="lg:col-span-3">
                  <InsightCard
                    state={insightState === "idle" ? "loading" : insightState}
                    insight={insight}
                  />
                </Reveal>

                <Reveal delay={80} className="lg:col-span-2 flex flex-col gap-4">
                  {["seo", "aeo", "geo"].map((key) => {
                    const area = report.areas[key];
                    const g = GRADE_META[area.grade] || GRADE_META.C;
                    return (
                      <div key={key} className="glass-card flex items-center gap-4"
                        style={{ borderRadius: R.xxl, padding: "16px 20px" }}>
                        <GradeBadge grade={area.grade} size={42} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span style={{ color: T.ink, fontSize: 13.5, fontWeight: 600 }}>
                              {AREA_META[key].label}
                            </span>
                            <span style={{ color: g.color, fontSize: 16, fontWeight: 600 }}>
                              {area.score}<span style={{ color: T.steel, fontSize: 12, fontWeight: 500 }}> /100</span>
                            </span>
                          </div>
                          <div className="mt-1.5 mb-1.5">
                            <ScoreBar value={area.score} color={g.color} height={6} />
                          </div>
                          <div style={{ color: T.steel, fontSize: 11.5 }}>
                            통과 {area.counts.pass} · 주의 {area.counts.warn} · 실패 {area.counts.fail}
                            {area.criticalFail && <span style={{ color: T.coralDark, fontWeight: 600 }}> · 치명 결함 상한 40점</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ color: T.stone, fontSize: 11.5, lineHeight: 1.6, padding: "0 4px" }}>
                    종합 = SEO 35% · AEO 35% · GEO 30% 가중 평균. LLM 심사·인용 측정 항목은 점수에서
                    제외되며 FAIL로 위장하지 않습니다.
                  </p>
                </Reveal>
              </div>
            </div>
          </section>

          {/* 레이더 + 크롤러 보드 */}
          <section style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 28, paddingBottom: 8 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <Reveal className="lg:col-span-2 glass-card flex flex-col items-center"
                  style={{ borderRadius: R.xxl, padding: 24 }}>
                  <div className="self-start mb-2" style={{ color: T.ink, fontSize: 15, fontWeight: 600 }}>
                    역량 프로필
                  </div>
                  <p className="self-start" style={{ color: T.slate, fontSize: 12.5, lineHeight: 1.6, marginBottom: 10 }}>
                    결정론 체크 26개를 6개 역량축으로 재구성한 프로필입니다.
                  </p>
                  <RadarChart data={report.radar} />
                </Reveal>

                <Reveal delay={80} className="lg:col-span-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div style={{ color: T.ink, fontSize: 15, fontWeight: 600 }}>AI 크롤러 접근성 보드</div>
                    <span style={{ color: T.steel, fontSize: 12 }}>
                      robots.txt(RFC 9309 최장 일치) + 봇 UA 라이브 페치 검증
                    </span>
                  </div>
                  <BotBoard bots={result.bots} />
                  {(result.target.status < 200 || result.target.status >= 300) && (
                    <p style={{ color: T.steel, fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
                      * 사이트가 일반 요청에도 HTTP {result.target.status}을 반환해 라이브 페치 판정이
                      제한적입니다 — robots.txt 판정을 기준으로 보세요.
                    </p>
                  )}
                </Reveal>
              </div>
            </div>
          </section>

          {/* 우선순위 이슈 */}
          <section style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 48, paddingBottom: 8 }}>
              <Reveal className="mb-5">
                <h2 style={{ color: T.inkDeep, fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>
                  우선순위 이슈
                </h2>
                <p style={{ color: T.slate, fontSize: 14, marginTop: 6 }}>
                  심각도 순 {issueChecks.length}건 · 실패 {failCount}건 — 모든 이슈에 복붙 가능한 수정안이 붙어 있습니다.
                </p>
              </Reveal>
              <div className="flex flex-col gap-2.5">
                {issueChecks.map((c, i) => (
                  <Reveal key={c.id} delay={Math.min(i * 40, 240)}>
                    <CheckItem check={c} rank={i + 1} defaultOpen={i === 0} />
                  </Reveal>
                ))}
                {issueChecks.length === 0 && (
                  <div className="glass-card text-center" style={{ borderRadius: R.xxl, padding: 40 }}>
                    <div style={{ fontSize: 32 }}>🎉</div>
                    <p style={{ color: T.ink, fontSize: 15, fontWeight: 600, marginTop: 8 }}>
                      결정론 체크에서 발견된 이슈가 없습니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 전체 체크 상세 */}
          <section style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 48, paddingBottom: 8 }}>
              <Reveal className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h2 style={{ color: T.inkDeep, fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }}>
                    영역별 상세 진단
                  </h2>
                  <p style={{ color: T.slate, fontSize: 14, marginTop: 6 }}>
                    체크별 판정 · 근거 · 통과 조건을 영역별로 확인하세요.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap print-hide">
                  {["all", "seo", "aeo", "geo"].map((k) => (
                    <button key={k} onClick={() => setAreaTab(k)} className="transition"
                      style={{
                        background: areaTab === k ? T.inkDeep : "rgba(255,255,255,0.7)",
                        color: areaTab === k ? T.onDark : T.charcoal,
                        fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: R.full,
                        border: `1px solid ${areaTab === k ? T.inkDeep : T.hairline}`,
                      }}>
                      {k === "all" ? "전체" : AREA_META[k].short}
                    </button>
                  ))}
                  <button onClick={() => setShowPassed((v) => !v)} className="transition"
                    style={{
                      background: showPassed ? T.tealLight : "rgba(255,255,255,0.7)",
                      color: showPassed ? T.mossDark : T.slate,
                      fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: R.full,
                      border: `1px solid ${showPassed ? T.brandTeal : T.hairline}`,
                    }}>
                    통과 항목 {showPassed ? "숨기기" : "보기"}
                  </button>
                </div>
              </Reveal>

              {areaTab !== "all" && (
                <p style={{ color: T.steel, fontSize: 13, marginBottom: 14 }}>
                  {AREA_META[areaTab].label} — {AREA_META[areaTab].desc} · 종합 반영 가중치 {AREA_META[areaTab].weight}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                {visibleChecks.map((c) => <CheckItem key={c.id} check={c} />)}
                {visibleChecks.length === 0 && (
                  <p style={{ color: T.steel, fontSize: 13.5, padding: "18px 4px" }}>
                    이 필터에 해당하는 항목이 없습니다 — "통과 항목 보기"를 켜보세요.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 정밀 진단 lane */}
          <section id="pro" style={{ background: T.surface }}>
            <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 48, paddingBottom: 16 }}>
              <Reveal className="glass-card" style={{ borderRadius: R.xxxl, padding: "28px 30px" }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 style={{ color: T.inkDeep, fontSize: 18, fontWeight: 600 }}>
                        정밀 진단에서 평가되는 항목 {manualChecks.length}개
                      </h3>
                      <Tag_ tint="lavender">곧 제공 예정</Tag_>
                    </div>
                    <p style={{ color: T.slate, fontSize: 13.5, lineHeight: 1.65, marginTop: 8, maxWidth: 640 }}>
                      LLM 심사와 실제 AI 인용 측정이 필요한 항목은 무료 진단에서 "평가 불가"로 남겨 둡니다.
                      결정론 점수를 흐리지 않도록 FAIL로 위장하지 않으며, 정밀 진단에서는 고정
                      루브릭·신뢰구간과 함께 채점됩니다.
                    </p>
                  </div>
                  <BtnPrimary compact href="mailto:weatherplan@kweather.co.kr?subject=AI%20성적표%20정밀%20진단%20문의">
                    정밀 진단 문의 →
                  </BtnPrimary>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {manualChecks.map((c) => (
                    <div key={c.id} className="flex items-start gap-3" style={{
                      background: "rgba(255,255,255,0.55)", borderRadius: R.lg, padding: "12px 14px",
                    }}>
                      <StatusChip status="manual" compact />
                      <div className="min-w-0">
                        <div style={{ color: T.ink, fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                        <div style={{ color: T.slate, fontSize: 12, lineHeight: 1.55, marginTop: 3 }}>{c.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        </div>
      )}

      {/* ─── 진단 기준 (상시 노출) ─── */}
      <section id="method" style={{ background: T.surfaceSoft, borderTop: `1px solid ${T.hairlineSoft}` }}>
        <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <Reveal className="text-center mx-auto" style={{ maxWidth: 640, marginBottom: 48 }}>
            <Tag_ tint="teal">진단 기준</Tag_>
            <h2 style={{ color: T.inkDeep, fontSize: "clamp(24px, 3.4vw, 34px)", fontWeight: 600, letterSpacing: "-0.015em", marginTop: 16 }}>
              점수는 어떻게 만들어지나요?
            </h2>
            <p style={{ color: T.slate, fontSize: 15, lineHeight: 1.7, marginTop: 12 }}>
              가중치·통과 조건을 공개하는 재현 가능한 결정론 채점 — 같은 사이트는 언제나 같은 점수입니다.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(AREA_META).map(([key, m], i) => (
              <Reveal key={key} delay={i * 80} className="glass-card glass-card-hover"
                style={{ borderRadius: R.xxxl, padding: 26 }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{
                    color: T.mossDark, background: T.tealLight, fontSize: 12, fontWeight: 600,
                    padding: "3px 10px", borderRadius: R.full, letterSpacing: "0.04em",
                  }}>{m.short}</span>
                  <span style={{ color: T.steel, fontSize: 12, fontWeight: 600 }}>가중치 {m.weight}</span>
                </div>
                <div style={{ color: T.ink, fontSize: 17, fontWeight: 600 }}>{m.label}</div>
                <p style={{ color: T.slate, fontSize: 13.5, lineHeight: 1.7, marginTop: 8 }}>{m.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="glass-card mt-5" style={{ borderRadius: R.xxl, padding: "22px 26px" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>등급 기준</div>
                <div className="flex flex-wrap gap-2">
                  {[["A", "85점 이상"], ["B", "75~84"], ["C", "65~74"], ["D", "50~64"], ["F", "50 미만"]].map(([g, range]) => (
                    <span key={g} className="inline-flex items-center gap-1.5" style={{
                      background: GRADE_META[g].soft, color: GRADE_META[g].color,
                      fontSize: 12.5, fontWeight: 600, padding: "4px 12px", borderRadius: R.full,
                    }}>
                      {g} <span style={{ fontWeight: 500 }}>{range}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ color: T.slate, fontSize: 12.5, lineHeight: 1.7 }}>
                통과 100% · 주의 50% · 실패 0%를 가중 합산합니다. 치명적 체크(크롤 차단·noindex·도달 실패 등)가
                실패하면 해당 영역은 40점 상한이 적용됩니다. "상위 %"는 초기 파일럿 진단 분포 기반의
                <strong style={{ color: T.charcoal, fontWeight: 600 }}> 베타 기준선 추정치</strong>입니다.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 크로스셀 CTA ─── */}
      <section className="relative overflow-hidden print-hide" style={{ background: T.footerBg }}>
        <div className="max-w-[1280px] mx-auto px-6 text-center" style={{ paddingTop: 88, paddingBottom: 88 }}>
          <Reveal>
            <div style={{ color: T.brandTeal, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 14 }}>
              NEXT STEP
            </div>
            <h2 style={{
              color: T.onDark, fontSize: "clamp(24px, 3.6vw, 38px)", fontWeight: 600,
              letterSpacing: "-0.015em", lineHeight: 1.3,
            }}>
              AI가 우리 사이트를 인용하게 만들었다면,<br />이제 <span style={{ color: T.brandTeal }}>팔리는 타이밍</span>을 잡을 차례
            </h2>
            <p style={{ color: T.onDarkMuted, fontSize: 15, lineHeight: 1.7, marginTop: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              Weather Plan AI는 날씨 데이터로 "언제 광고해야 팔리는지"를 알려주는
              B2B 의사결정 AI입니다. AI 성적표로 노출 기반을 다졌다면, 날씨 타이밍으로 전환을 만드세요.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
              <a href="/onboarding" className="btn-shine inline-flex items-center gap-1.5 transition hover:opacity-95 active:translate-y-px"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #F0EDE3 100%)",
                  color: T.primary, fontSize: 14, fontWeight: 500,
                  padding: "14px 28px", borderRadius: R.full, textDecoration: "none",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.18), 0 6px 22px rgba(0,0,0,0.28)",
                }}>
                Weather Plan AI 무료로 시작 →
              </a>
              <a href="mailto:weatherplan@kweather.co.kr?subject=AI%20성적표%20전문%20리포트%20문의"
                className="inline-flex items-center gap-1.5 transition hover:opacity-80"
                style={{
                  color: T.onDark, fontSize: 14, fontWeight: 500, padding: "14px 24px",
                  borderRadius: R.full, border: "1px solid rgba(255,255,255,0.28)", textDecoration: "none",
                }}>
                전문 리포트 상담
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <FooterLite />
    </div>
  );
}
