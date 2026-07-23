/* ============================================================
 * 시니어케어매니저 · /demo
 *
 * "챗봇 → 콘솔" 연결 시연 (30초 임팩트 데모).
 *  좌: 보호자용 AI 예약 챗봇 (실서비스 /api/care-chat · Claude tool use)
 *  우: 돌봄업체 관리자 콘솔 (배차 그리드 · GMV · 매니저 · 실시간 접수)
 *
 * 디자인: Liquid Glass · Ambient Gradient Orbs · Glass Buttons ·
 *         Pulse Dot · SVG 라인 아이콘 · Pretendard. (HAI 헤리티지 흡수)
 *
 * 안정성: API 키가 없거나 네트워크가 끊겨도 동일한 이벤트를 내는
 * 데모 스크립트로 자동 폴백 → 시연은 언제나 완주됩니다.
 * ============================================================ */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { executeCareTool, SEED_CONSOLE, SEED_MANAGERS } from "../lib/careTools";

/* ─── SVG 라인 아이콘 세트 ─── */
const ICON_PATHS = {
  heart: "M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7 .7-2z",
  message: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z",
  receipt: "M5 3.5v17l2-1.2 2 1.2 2-1.2 2 1.2 2-1.2 2 1.2v-17l-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2zM8.5 8.5h7M8.5 12h7M8.5 15.5h4",
  star: "M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9L12 2.5z",
  check: "M22 11v1a10 10 0 1 1-5.9-9.1M22 4L12 14l-3-3",
  calendar: "M8 2.5v4M16 2.5v4M3.5 9.5h17M5 4.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  activity: "M22 12h-4l-3 8L9 4l-3 8H2",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  play: "M6 3.5l14 8.5-14 8.5v-17z",
  refresh: "M21 3v6h-6M3 21v-6h6M20.5 9a8.5 8.5 0 0 0-14.1-3.2L3 9M3.5 15a8.5 8.5 0 0 0 14.1 3.2L21 15",
  clock: "M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM12 6.5V12l3.5 2",
  pin: "M20 10.5c0 6-8 11.5-8 11.5s-8-5.5-8-11.5a8 8 0 0 1 16 0zM12 13a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z",
  shield: "M12 22s7.5-3.8 7.5-9.5V5.2L12 2.5 4.5 5.2v7.3C4.5 18.2 12 22 12 22z",
  wallet: "M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7h15M21 12h-4a2 2 0 0 0 0 4h4v-4z",
  cross: "M12 6.5v11M6.5 12h11",
  sun: "M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM12 1.7v2.1M12 20.2v2.1M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M1.7 12h2.1M20.2 12h2.1M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5",
  cloud: "M6.5 19a4 4 0 0 1-.8-7.92 6 6 0 0 1 11.6-1.6A4.5 4.5 0 0 1 17.5 19h-11z",
  droplet: "M12 2.7c3 3.6 6 6.9 6 10.3a6 6 0 1 1-12 0c0-3.4 3-6.7 6-10.3z",
  wind: "M3 12h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3",
  thermometer: "M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z",
};
function Icon({ name, size = 20, sw = 1.7, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {ICON_PATHS[name].split("M").filter(Boolean).map((d, i) => <path key={i} d={"M" + d} />)}
    </svg>
  );
}
function Star({ size = 13, color = "#C0863A" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={{ display: "inline-block", verticalAlign: "-1px" }}>
      <path d={ICON_PATHS.star} />
    </svg>
  );
}
function Dot({ color, live }) {
  return <span className={live ? "pulse-dot" : ""} style={{ width: live ? 8 : 7, height: live ? 8 : 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />;
}

/* ─── 디자인 토큰 ─── */
const C = {
  cream: "#F4EEE2", cream2: "#EFE7D7",
  ink: "#16211C", ink2: "#39473F", sub: "#68766D", faint: "#9AA69D",
  line: "rgba(22,33,28,0.10)", lineSoft: "rgba(22,33,28,0.055)",
  teal: "#1F8A7A", tealDk: "#14675A", green: "#2E9E63", blue: "#3E63FF", amber: "#BC8236", red: "#E5533C",
  evergreen: "#14241D",
};

const GRID_START = 8, GRID_END = 18, GRID_SPAN = GRID_END - GRID_START;

/* ─── 포맷 헬퍼 ─── */
const won = (n) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const manwon = (n) => Math.round(n / 10000);
const hourLabel = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;

function parseHour(t = "") {
  if (typeof t === "number") return t;
  const hm = String(t).match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
  let h = hm ? parseInt(hm[1], 10) : 9;
  const min = hm && hm[2] ? parseInt(hm[2], 10) : 0;
  if (/오후|저녁|밤|pm/i.test(t) && h < 12) h += 12;
  if (/오전|아침|am/i.test(t) && h === 12) h = 0;
  return Math.min(Math.max(h + (min >= 30 ? 0.5 : 0), GRID_START), GRID_END - 1);
}

const STATUS = {
  confirmed:  { label: "예약확정", fg: C.tealDk, tint: "rgba(31,138,122,0.14)", dot: C.teal },
  pending:    { label: "배차대기", fg: "#8A6216", tint: "rgba(188,130,54,0.16)", dot: C.amber },
  dispatched: { label: "배차완료", fg: "#2C43B8", tint: "rgba(62,99,255,0.13)", dot: C.blue },
  in_service: { label: "수행중",   fg: "#1E7A44", tint: "rgba(46,158,99,0.15)", dot: C.green },
};

/* ─── **볼드** 지원 초경량 렌더러 ─── */
function Rich({ text }) {
  return (
    <>
      {String(text).split("\n").map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((seg, si) =>
            seg.startsWith("**") && seg.endsWith("**")
              ? <strong key={si} style={{ fontWeight: 700 }}>{seg.slice(2, -2)}</strong>
              : <span key={si}>{seg}</span>
          )}
        </span>
      ))}
    </>
  );
}

/* ─── 카운트업 애니메이션 숫자 ─── */
function CountUp({ value, suffix = "" }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    if (from === to) return;
    const dur = 900, t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{disp.toLocaleString("ko-KR")}{suffix}</>;
}

/* ─── 앰비언트 그라디언트 오브 ─── */
function Orbs() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      <div className="orb orb1" style={{ background: "radial-gradient(circle, rgba(31,138,122,0.42), transparent 66%)" }} />
      <div className="orb orb2" style={{ background: "radial-gradient(circle, rgba(188,130,54,0.34), transparent 66%)" }} />
      <div className="orb orb3" style={{ background: "radial-gradient(circle, rgba(62,99,255,0.24), transparent 66%)" }} />
      <div className="orb orb4" style={{ background: "radial-gradient(circle, rgba(46,158,99,0.28), transparent 66%)" }} />
    </div>
  );
}

/* 공용: 아이콘 칩 */
function Chip({ name, bg, fg, size = 18, box = 34, sw }) {
  return (
    <div style={{ width: box, height: box, borderRadius: box * 0.32, background: bg, color: fg, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <Icon name={name} size={size} sw={sw} />
    </div>
  );
}

/* ─── 챗봇: 견적 카드 ─── */
function QuoteCard({ q }) {
  return (
    <div className="glass-card" style={{ marginTop: 8, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.lineSoft}` }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, color: C.tealDk, fontSize: 13 }}>
          <Icon name="receipt" size={15} color={C.teal} /> 투명 견적
        </span>
        <span style={{ fontSize: 12, color: C.sub }}>{q.service_label}</span>
      </div>
      <div style={{ padding: "12px 14px", fontSize: 13, color: C.ink }}>
        <Row k={q.breakdown} v={won(q.base)} />
        {q.surcharge_lines.map((s, i) => <Row key={i} k={s.label} v={`+${won(s.amount)}`} muted />)}
        <div style={{ height: 1, background: C.line, margin: "8px 0" }} />
        <Row k={<b>총 예상 금액</b>} v={<b style={{ color: C.tealDk, fontSize: 16 }}>{won(q.total)}</b>} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.faint, marginTop: 7 }}>
          <Icon name="shield" size={12} color={C.faint} /> {q.note}
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v, muted }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: muted ? C.sub : C.ink }}>
    <span>{k}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v}</span>
  </div>
);

/* ─── 챗봇: 매니저 슬롯 카드 ─── */
function SlotsCard({ slots }) {
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {slots.map((s, i) => (
        <div key={s.manager_id} className="glass-card" style={{ borderRadius: 16, padding: "10px 12px", display: "flex", gap: 11, alignItems: "center", border: i === 0 ? `1.5px solid rgba(31,138,122,0.5)` : undefined }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(160deg,${C.teal},${C.tealDk})`, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}>{s.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <b style={{ fontSize: 14 }}>{s.name} 매니저</b>
              {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: C.teal, borderRadius: 6, padding: "2px 7px" }}>추천</span>}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <Star /> {s.rating} <span style={{ color: C.faint }}>({s.reviews})</span> · {s.specialty}
            </div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="pin" size={11} color={C.faint} /> {s.distance_km}km{s.nearby ? " · 근거리" : ""} · {s.cert.join("·")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 챗봇: 예약 확정 카드 ─── */
function BookingCard({ b }) {
  return (
    <div style={{ marginTop: 8, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1.5px solid ${C.teal}`, boxShadow: "0 14px 36px -12px rgba(31,138,122,0.5), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
      <div style={{ padding: "11px 14px", background: `linear-gradient(180deg,${C.tealDk},#0f5147)`, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
          <Icon name="check" size={16} /> 예약 접수 완료
        </span>
        <span style={{ fontSize: 12, opacity: 0.9, fontVariantNumeric: "tabular-nums" }}>{b.id}</span>
      </div>
      <div style={{ padding: "12px 14px", fontSize: 13 }}>
        <Row k="대상 · 병원" v={`${b.recipient} · ${b.hospital}`} />
        <Row k="일시" v={`${b.date} ${b.time} · ${b.hours}시간`} />
        <Row k="서비스" v={b.service_label} />
        <Row k="담당 매니저" v={<span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>{b.manager_name} <Star /> {b.manager_rating}</span>} />
        <div style={{ height: 1, background: C.line, margin: "8px 0" }} />
        <Row k={<b>결제 금액</b>} v={<b style={{ color: C.tealDk, fontSize: 16 }}>{won(b.price)}</b>} />
        {b.outing && (
          <div style={{ marginTop: 9, padding: "7px 10px", background: "rgba(188,130,54,0.09)", border: "1px solid rgba(188,130,54,0.22)", borderRadius: 10, display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: C.ink2 }}>
            <Icon name="sun" size={14} color={C.amber} />
            <span>그날 동행 컨디션 <b style={{ color: scoreStyle(b.outing.score ?? 60).fg }}>{typeof b.outing.score === "number" ? `${b.outing.score}점 · ${b.outing.verdict}` : b.outing.grade}</b> · <b>{b.outing.items.join("·")}</b> 준비해 동행합니다</span>
          </div>
        )}
        {b.checklist?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, marginBottom: 5 }}>보호자 준비 체크리스트</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {b.checklist.map((it, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.ink2, background: "rgba(22,33,28,0.045)", border: `1px solid ${C.lineSoft}`, borderRadius: 8, padding: "3px 8px" }}>
                  <Icon name="check" size={10} color={C.teal} /> {it}
                </span>
              ))}
            </div>
          </div>
        )}
        <button className="btn-primary" style={{ width: "100%", marginTop: 11, borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Icon name="wallet" size={16} /> 토스로 선결제 (에스크로 보관)
        </button>
        <div style={{ marginTop: 8, fontSize: 10, color: C.faint, textAlign: "center" }}>
          본 서비스는 의료행위가 아닌 동행·생활지원 서비스입니다
        </div>
      </div>
    </div>
  );
}

/* ─── 외출 컨디션 등급 색상 ─── */
const WX_GRADE = {
  "좋음": { fg: C.green, bg: "rgba(46,158,99,0.14)" },
  "보통": { fg: C.tealDk, bg: "rgba(31,138,122,0.13)" },
  "주의": { fg: "#8A6216", bg: "rgba(188,130,54,0.16)" },
  "나쁨": { fg: "#B23A28", bg: "rgba(229,83,60,0.14)" },
};
const skyIcon = (sky = "") => /비|소나기/.test(sky) ? "droplet" : /눈/.test(sky) ? "cloud" : /구름|흐림/.test(sky) ? "cloud" : "sun";

function WxMetric({ icon, label, value, tone }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: C.faint }}>
        <Icon name={icon} size={12} color={C.faint} /> {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: tone || C.ink, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}
function ItemChips({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {items.map((it, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.tealDk, background: "rgba(31,138,122,0.10)", border: "1px solid rgba(31,138,122,0.24)", borderRadius: 8, padding: "3px 8px" }}>{it}</span>
      ))}
    </div>
  );
}

/* ─── 챗봇: 외출 컨디션 카드 (케이웨더 · wellbian NN점 판정 계승) ─── */
function WeatherCard({ w }) {
  const hasScore = typeof w.score === "number";
  const s = hasScore ? scoreStyle(w.score) : (WX_GRADE[w.grade] || WX_GRADE["보통"]);
  return (
    <div className="glass-card" style={{ marginTop: 8, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.lineSoft}` }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: C.ink }}>
          <Icon name={skyIcon(w.sky)} size={15} color={C.amber} /> 동행 컨디션
          <span style={{ fontSize: 11, fontWeight: 400, color: C.faint }}>· {w.date}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.fg, background: s.bg, borderRadius: 7, padding: "2px 8px", fontVariantNumeric: "tabular-nums" }}>
            {hasScore ? `${w.score}점 · ${w.verdict || w.grade}` : w.grade}
          </span>
          <span style={{ fontSize: 10.5, color: C.faint }}>케이웨더</span>
        </span>
      </div>
      <div style={{ padding: "11px 14px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <WxMetric icon="thermometer" label="기온" value={`${w.temp}℃ ${w.sky}`} />
          <WxMetric icon="wind" label="미세먼지" value={w.pm_grade} tone={/나쁨/.test(w.pm_grade) ? "#B23A28" : C.ink} />
          <WxMetric icon="sun" label="자외선" value={w.uv_grade} tone={/높음|위험/.test(w.uv_grade) ? "#8A6216" : C.ink} />
          <WxMetric icon="droplet" label="강수확률" value={`${w.pop}%`} />
        </div>
        {/* 감점 사유 칩 — wellbian deductions[] 투명 공개 */}
        {w.deductions?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {w.deductions.map((d, i) => (
              <span key={i} style={{ fontSize: 10.5, fontWeight: 600, color: s.fg, background: s.bg, border: `1px solid ${s.fg}33`, borderRadius: 7, padding: "2px 7px", fontVariantNumeric: "tabular-nums" }}>
                {d.reason} −{d.points}
              </span>
            ))}
          </div>
        )}
        {w.hard_stop && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#B23A28", background: "rgba(229,83,60,0.10)", border: "1px solid rgba(229,83,60,0.3)", borderRadius: 9, padding: "6px 9px", marginBottom: 8 }}>
            <Icon name="shield" size={13} color="#B23A28" /> 안전 기준 초과 — 일정 변경 권장
          </div>
        )}
        <ItemChips items={w.items} />
        {w.comment && (
          <div style={{ marginTop: 8, fontSize: 12, color: C.ink2, background: "rgba(22,33,28,0.045)", border: `1px solid ${C.lineSoft}`, borderRadius: 9, padding: "7px 10px" }}>
            💡 {w.comment}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 날씨지수 톤/게이지 계산 ─── */
const pmTone = (g = "") => /나쁨/.test(g) ? "#B23A28" : /보통/.test(g) ? C.tealDk : C.green;
const uvTone = (g = "") => /위험/.test(g) ? "#B23A28" : /높음/.test(g) ? "#8A6216" : /보통/.test(g) ? C.tealDk : C.green;
const gradeTone = (g) => (WX_GRADE[g] || WX_GRADE["보통"]).fg;
const clamp = (v) => Math.max(4, Math.min(100, v));

/* wellbian RecommendCard scoreStyle — 85/70/55/40 5단 판정 팔레트 */
function scoreStyle(score) {
  if (score >= 85) return { fg: C.green, bg: "rgba(46,158,99,0.14)" };
  if (score >= 70) return { fg: C.tealDk, bg: "rgba(31,138,122,0.13)" };
  if (score >= 55) return { fg: "#8A6216", bg: "rgba(188,130,54,0.16)" };
  if (score >= 40) return { fg: "#B4551F", bg: "rgba(217,110,43,0.15)" };
  return { fg: "#B23A28", bg: "rgba(229,83,60,0.14)" };
}

function wxIndices(o) {
  // 외출지수는 wellbian 100점 감점제 엔진의 실제 score (등급→가짜점수 매핑 아님)
  const outScore = o.score ?? ({ "좋음": 88, "보통": 70, "주의": 46, "나쁨": 24 }[o.grade] ?? 60);
  const pmBar = { "좋음": 22, "보통": 50, "나쁨": 80, "매우나쁨": 96 }[o.pm_grade] ?? 50;
  const uvBar = { "낮음": 18, "보통": 42, "높음": 66, "매우높음": 86, "위험": 98 }[o.uv_grade] ?? 40;
  return [
    { key: "외출지수", val: `${outScore}점`, tone: scoreStyle(outScore).fg, bar: outScore },
    { key: "미세먼지", val: o.pm_grade, tone: pmTone(o.pm_grade), bar: pmBar },
    { key: "자외선", val: o.uv_grade, tone: uvTone(o.uv_grade), bar: uvBar },
    { key: "체감기온", val: `${o.temp}℃`, tone: o.temp >= 31 ? "#8A6216" : o.temp <= 4 ? C.blue : C.ink, bar: clamp(((o.temp + 8) / 48) * 100) },
  ];
}

/* ─── wellbian TypingText 이식 — 22ms/글자, 탭 스킵, typed 플래그로 재타이핑 방지 ─── */
function TypingText({ text, onComplete, done }) {
  const [i, setI] = useState(done ? text.length : 0);
  const doneRef = useRef(done);
  useEffect(() => {
    if (doneRef.current) return;
    const iv = setInterval(() => {
      setI((cur) => {
        if (cur >= text.length) {
          clearInterval(iv);
          if (!doneRef.current) { doneRef.current = true; onComplete && onComplete(); }
          return cur;
        }
        return cur + 2; // 2글자/tick — 한국어 체감 속도
      });
    }, 22);
    return () => clearInterval(iv);
  }, [text]); // eslint-disable-line
  const finished = done || i >= text.length;
  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setI(text.length);
    onComplete && onComplete();
  };
  return (
    <span onClick={skip} style={{ cursor: finished ? "inherit" : "pointer" }}>
      <Rich text={finished ? text : text.slice(0, i)} />
      {!finished && <span style={{ display: "inline-block", width: 3, height: 13, background: "currentColor", opacity: 0.5, marginLeft: 2, animation: "dots 1.2s infinite" }} />}
    </span>
  );
}
function MiniMeter({ m }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: C.faint, marginBottom: 2, whiteSpace: "nowrap" }}>{m.key}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: m.tone, whiteSpace: "nowrap", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{m.val}</div>
      <div style={{ height: 4, borderRadius: 3, background: "rgba(22,33,28,0.09)", overflow: "hidden" }}>
        <div style={{ width: `${m.bar}%`, height: "100%", background: m.tone, borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ─── 챗봇 상단: 컨디션·날씨지수 미니 대시보드 ─── */
function WxDashboard({ o }) {
  const g = WX_GRADE[o.grade] || WX_GRADE["보통"];
  return (
    <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.5)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: C.ink2 }}>
          <Icon name={skyIcon(o.sky)} size={13} color={C.amber} /> 케이웨더 대시보드 <span style={{ fontWeight: 400, color: C.faint }}>· {o.location} · {o.date || "오늘"}</span>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: typeof o.score === "number" ? scoreStyle(o.score).fg : g.fg, background: typeof o.score === "number" ? scoreStyle(o.score).bg : g.bg, borderRadius: 7, padding: "2px 8px", fontVariantNumeric: "tabular-nums" }}>
          {typeof o.score === "number" ? `${o.score}점 · ${o.verdict || o.grade}` : `외출 ${o.grade}`}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {wxIndices(o).map((m, i) => <MiniMeter key={i} m={m} />)}
      </div>
    </div>
  );
}

/* ─── 콘솔: 주간 일자별 외출 컨디션 캘린더 ─── */
function WeekOuting({ week }) {
  return (
    <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 7 }}>
        <Icon name="calendar" size={14} color={C.teal} /> 주간 외출 컨디션 <span style={{ fontWeight: 400, color: C.faint }}>· 케이웨더</span>
      </div>
      <div style={{ display: "flex", padding: "10px 8px", gap: 6, overflowX: "auto" }}>
        {week.map((d) => {
          const g = WX_GRADE[d.grade] || WX_GRADE["보통"];
          const wknd = d.label === "토" || d.label === "일";
          return (
            <div key={d.date} title={`${d.sky} ${d.temp}℃ · 미세먼지 ${d.pm_grade} · 자외선 ${d.uv_grade}`}
              style={{ flex: 1, minWidth: 58, borderRadius: 12, padding: "8px 6px 7px", textAlign: "center", background: d.today ? "rgba(31,138,122,0.10)" : "rgba(255,255,255,0.5)", border: `1px solid ${d.today ? "rgba(31,138,122,0.42)" : C.lineSoft}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: wknd ? (d.label === "일" ? C.red : C.blue) : C.ink2 }}>
                {d.label}{d.today && <span style={{ fontSize: 8.5, color: C.teal }}> 오늘</span>}
              </div>
              <div style={{ fontSize: 9.5, color: C.faint, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{d.date}</div>
              <div style={{ display: "grid", placeItems: "center", margin: "1px 0 2px" }}><Icon name={skyIcon(d.sky)} size={17} color={/비|눈/.test(d.sky) ? C.blue : C.amber} /></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{d.temp}°</div>
              <div style={{ marginTop: 5, fontSize: 9.5, fontWeight: 700, color: g.fg, background: g.bg, borderRadius: 6, padding: "2px 0" }}>{d.grade}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 콘솔: 배차 그리드 (매니저 × 시간) ─── */
function DispatchGrid({ today, highlightId }) {
  const hours = Array.from({ length: GRID_SPAN + 1 }, (_, i) => GRID_START + i);
  const byMgr = useMemo(() => {
    const map = {};
    SEED_MANAGERS.forEach((m) => (map[m.id] = []));
    today.forEach((b) => { (map[b.managerId] = map[b.managerId] || []).push(b); });
    return map;
  }, [today]);

  return (
    <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 15px", borderBottom: `1px solid ${C.line}` }}>
        <b style={{ fontSize: 13, color: C.ink, display: "flex", alignItems: "center", gap: 7 }}><Icon name="calendar" size={15} color={C.teal} /> 오늘의 배차 현황</b>
        <span style={{ fontSize: 11, color: C.faint }}>매니저 {SEED_MANAGERS.length}명 · 08–18시</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560 }}>
          <div style={{ display: "flex", paddingLeft: 78, borderBottom: `1px solid ${C.lineSoft}` }}>
            {hours.slice(0, -1).map((h) => (
              <div key={h} style={{ flex: 1, fontSize: 10, color: C.faint, padding: "5px 0 4px 3px", fontVariantNumeric: "tabular-nums" }}>{h}시</div>
            ))}
          </div>
          {SEED_MANAGERS.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.lineSoft}`, height: 48 }}>
              <div style={{ width: 78, flexShrink: 0, padding: "6px 9px", borderRight: `1px solid ${C.lineSoft}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{m.name}</span>
                <span style={{ fontSize: 10, color: C.faint, display: "flex", alignItems: "center", gap: 2 }}><Star size={10} />{m.rating}</span>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                {hours.slice(1, -1).map((h) => (
                  <div key={h} style={{ position: "absolute", left: `${((h - GRID_START) / GRID_SPAN) * 100}%`, top: 0, bottom: 0, width: 1, background: C.lineSoft }} />
                ))}
                {(byMgr[m.id] || []).map((b) => {
                  const left = ((b.start - GRID_START) / GRID_SPAN) * 100;
                  const width = (b.hours / GRID_SPAN) * 100;
                  const st = STATUS[b.status] || STATUS.confirmed;
                  const isNew = b.id === highlightId;
                  return (
                    <div key={b.id} title={`${b.recipient} · ${b.hospital}`} className={isNew ? "bk-pulse" : ""}
                      style={{
                        position: "absolute", left: `${left}%`, width: `calc(${width}% - 5px)`, top: 6, bottom: 6,
                        background: st.tint, border: `1px solid ${isNew ? C.teal : st.dot}`, borderLeft: `3px solid ${st.dot}`,
                        borderRadius: 8, padding: "3px 7px", overflow: "hidden", fontSize: 10.5, lineHeight: 1.18,
                        backdropFilter: "blur(4px)", boxShadow: isNew ? "0 0 0 3px rgba(31,138,122,0.25)" : "none", zIndex: isNew ? 3 : 1,
                      }}>
                      <div style={{ fontWeight: 700, color: st.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.hospital}</div>
                      <div style={{ color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.service}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 콘솔: KPI 타일 ─── */
function Kpi({ label, value, suffix, sub, accent }) {
  return (
    <div className="glass-panel" style={{ flex: 1, borderRadius: 15, padding: "13px 15px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 5, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 800, color: accent || C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {typeof value === "number" ? <CountUp value={value} suffix={suffix} /> : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.green, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}><Icon name="activity" size={11} color={C.green} /> {sub}</div>}
    </div>
  );
}

/* ============================================================
 * 데모 스크립트 (API 폴백) — 실 API 실패 시 동일 이벤트로 완주
 * ============================================================ */
function mockReply(userTurn) {
  if (userTurn <= 1) {
    return { content: "네, 어머니 병원동행 도와드릴게요. 두 가지만 여쭤볼게요.\n혼자 걸으실 수 있나요, 아니면 **휠체어**가 필요하실까요? 그리고 **진료 시작 시간**이 언제쯤인가요?", events: [] };
  }
  if (userTurn === 2) {
    const q = executeCareTool("estimate_quote", { service_type: "hospital", hours: 3 });
    const wx = executeCareTool("outing_condition", { date: "다음주 화요일", location: "서울" });
    const s = executeCareTool("check_slots", { date: "다음주 화요일", hospital: "서울대병원", service_type: "hospital" });
    const top = s.available[0];
    return {
      content: `오래 서 계시기 힘드시면 곁에서 부축·대기해 드리는 **외래 동행**으로 잡을게요. 이동·대기 포함 **3시간** 기준 견적입니다.\n그날 동행 컨디션은 **${wx.score}점 · ${wx.verdict}**이에요. 다만 **미세먼지 ${wx.pm_grade}** 예보라 **${wx.items[0]}** 챙겨 동행할게요. 평점 ${top.rating} **${top.name} 매니저**(${top.specialty})를 추천드려요. 이분으로 예약할까요?`,
      events: [q._event, wx._event, s._event],
    };
  }
  if (userTurn === 3) {
    const s = executeCareTool("check_slots", { date: "다음주 화요일", hospital: "서울대병원", service_type: "hospital" });
    const b = executeCareTool("create_booking", {
      recipient_name: "어머니", hospital: "서울대병원", date: "다음주 화요일", time: "오전 9시",
      hours: 3, service_type: "hospital", manager_id: s.available[0].manager_id,
    });
    return {
      content: `확정되었습니다. 아래 내용으로 접수했어요.\n**${b.booking.manager_name} 매니저**가 배정됐고, 결제 링크로 선결제(에스크로)하면 확정됩니다. 출발·도착·완료 시 **알림톡**으로 안내드려요.`,
      events: [b._event],
    };
  }
  return { content: "더 도와드릴 것이 있을까요? 정기 투석·항암 동행은 반복 예약으로 할인도 가능합니다.", events: [] };
}

const AUTOPLAY = [
  "어머니가 다음주 화요일 서울대병원 외래 진료가 있어요. 동행 예약할 수 있을까요?",
  "혼자 걷긴 하시는데 오래 서 계시는 걸 힘들어하세요. 오전 9시 진료예요.",
  "네, 그분으로 예약할게요.",
];

const GREETING = { id: "g0", role: "assistant", content: "안녕하세요, 시니어케어매니저 **돌봄이 AI**예요. 어떤 병원동행이나 돌봄이 필요하신가요? 편하게 말씀해 주세요.", events: [] };

/* 주간 예보 중 나쁜 조건만 운영 알림으로 — wellbian daily-condition 게이팅 (좋은 날씨는 null) */
const WEEK_TICKER_SEED = (() => {
  const idx = SEED_CONSOLE.week.findIndex((d) => d.today);
  const alerts = [];
  SEED_CONSOLE.week.forEach((d, i) => {
    if (i <= idx) return; // 지난 날짜·오늘 제외, 다가올 리스크만
    if (/비|눈/.test(d.sky)) alerts.push({ id: `wk-${d.date}`, stamp: "예보", label: `${d.label} ${d.date} 비 예보 — 우천 취소 리스크 · 보호자 사전 알림톡 권장`, tone: "amber" });
    else if (/매우높음|위험/.test(d.uv_grade)) alerts.push({ id: `wk-${d.date}`, stamp: "예보", label: `${d.label} ${d.date} 자외선 ${d.uv_grade} — 오전 슬롯 우선 배치 권장`, tone: "amber" });
    else if (/나쁨/.test(d.pm_grade)) alerts.push({ id: `wk-${d.date}`, stamp: "예보", label: `${d.label} ${d.date} 미세먼지 ${d.pm_grade} — KF94 지참 안내`, tone: "amber" });
  });
  return alerts.slice(0, 3);
})();

const SENDING_STAGES = ["문의 파악 중…", "견적 계산 중…", "매니저 일정 확인 중…", "케이웨더 조회 중…"];

/* ============================================================
 * 메인
 * ============================================================ */
export default function DemoPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("live");   // 'live' | 'demo'
  const [autoOn, setAutoOn] = useState(false);
  const [ticker, setTicker] = useState(WEEK_TICKER_SEED);
  const [kpi, setKpi] = useState(SEED_CONSOLE.kpi);
  const [today, setToday] = useState(SEED_CONSOLE.today);
  const [highlightId, setHighlightId] = useState(null);
  const [latestOuting, setLatestOuting] = useState(null); // 챗봇이 조회한 최신 컨디션 → 대시보드 동기화
  const [stageIdx, setStageIdx] = useState(0);            // tool 단계 로딩 라벨
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [debugOn, setDebugOn] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);         // ?debug=1 아키텍처 패널용

  const scrollRef = useRef(null);
  const userTurnRef = useRef(0);
  const messagesRef = useRef([GREETING]);
  const modeRef = useRef("live");

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // 타이핑 진행 중엔 주기적으로 바닥 고정 (텍스트가 자라며 뷰 밖으로 나가는 것 방지)
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.typed) return;
    const iv = setInterval(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 250);
    return () => clearInterval(iv);
  }, [messages]);

  // tool 단계 로딩 라벨 시퀀스 (1.2s 간격, events 도착 시 종료)
  useEffect(() => {
    if (!sending) { setStageIdx(0); return; }
    const iv = setInterval(() => setStageIdx((i) => Math.min(i + 1, SENDING_STAGES.length - 1)), 1200);
    return () => clearInterval(iv);
  }, [sending]);

  // ?debug=1 또는 localStorage cm_debug — wellbian 디버그 모드 3중 진입 축소판
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("debug") === "1" || localStorage.getItem("cm_debug") === "1") setDebugOn(true);
    } catch (_) {}
  }, []);

  const markTyped = useCallback((id) => {
    setMessages((ms) => ms.map((x) => (x.id === id ? { ...x, typed: true } : x)));
  }, []);

  const pushTicker = useCallback((label, tone) => {
    const stamp = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
    setTicker((t) => [{ id: `${stamp}-${label}`, stamp, label, tone }, ...t].slice(0, 6));
  }, []);

  const applyEvents = useCallback((events = []) => {
    events.forEach((ev) => {
      if (ev.type === "quote") pushTicker(`견적 산출 · ${won(ev.total)}`, "teal");
      else if (ev.type === "weather") {
        setLatestOuting(ev); // 챗봇 대시보드 게이지 실시간 동기화
        pushTicker(`동행 컨디션 ${typeof ev.score === "number" ? `${ev.score}점 · ${ev.verdict}` : ev.grade} · ${ev.summary}`, "amber");
      }
      else if (ev.type === "slots") pushTicker(`매니저 ${ev.available.length}명 매칭`, "blue");
      else if (ev.type === "booking") {
        const b = ev.booking;
        const row = {
          id: b.id, start: parseHour(b.time), hours: b.hours, recipient: b.recipient,
          hospital: b.hospital, managerId: b.manager_id, manager: b.manager_name,
          service: b.service_label, price: b.price, status: "confirmed",
        };
        setToday((prev) => (prev.some((x) => x.id === row.id) ? prev : [row, ...prev]));
        setKpi((k) => ({ ...k, gmv: k.gmv + b.price, bookings: k.bookings + 1 }));
        setHighlightId(b.id);
        pushTicker(`신규 예약 ${b.id} 접수 · ${won(b.price)}`, "green");
        setTimeout(() => setHighlightId((cur) => (cur === b.id ? null : cur)), 4200);
      }
    });
  }, [pushTicker]);

  const runTurn = useCallback(async (text) => {
    const clean = text.trim();
    if (!clean) return;
    userTurnRef.current += 1;
    const turn = userTurnRef.current;
    setMessages((m) => [...m, { id: `u${turn}`, role: "user", content: clean, events: [] }]);
    setSending(true);

    const history = messagesRef.current
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }))
      .concat({ role: "user", content: clean });
    while (history.length && history[0].role === "assistant") history.shift();

    let reply = null;
    if (modeRef.current === "live") {
      try {
        const res = await fetch("/api/care-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content || (data.events && data.events.length)) {
            reply = { content: data.content || "", events: data.events || [] };
            setLastMeta({
              mode: "live", model_used: data.model_used, complexity: data.complexity,
              rounds: data.rounds, rules_injected: data.rules_injected,
              usage: data.usage, elapsed_ms: data.elapsed_ms, events: (data.events || []).length,
            });
          }
        }
        if (!reply) setMode("demo");
      } catch (_) { setMode("demo"); }
    }
    if (!reply) {
      reply = mockReply(turn);
      setLastMeta({ mode: "demo(폴백)", model_used: "—", rounds: 0, usage: null, elapsed_ms: 0, events: (reply.events || []).length });
    }

    await new Promise((r) => setTimeout(r, 480));
    setMessages((m) => [...m, { id: `a${turn}`, role: "assistant", content: reply.content, events: reply.events || [] }]);
    applyEvents(reply.events);
    setSending(false);
    return reply;
  }, [applyEvents]);

  const onSend = useCallback(async () => {
    if (sending || autoOn) return;
    const text = input;
    setInput("");
    await runTurn(text);
  }, [input, sending, autoOn, runTurn]);

  const autoplay = useCallback(async () => {
    if (autoOn) return;
    reset(true);
    setAutoOn(true);
    await new Promise((r) => setTimeout(r, 500));
    for (const line of AUTOPLAY) {
      for (let i = 1; i <= line.length; i += 2) { setInput(line.slice(0, i)); await new Promise((r) => setTimeout(r, 16)); }
      setInput(line);
      await new Promise((r) => setTimeout(r, 350));
      setInput("");
      await runTurn(line);
      await new Promise((r) => setTimeout(r, 900));
    }
    setAutoOn(false);
  }, [autoOn, runTurn]); // eslint-disable-line

  function reset(silent) {
    userTurnRef.current = 0;
    messagesRef.current = [GREETING];
    if (!silent) modeRef.current = "live";
    setMessages([GREETING]);
    setInput("");
    setTicker(WEEK_TICKER_SEED);
    setKpi(SEED_CONSOLE.kpi);
    setToday(SEED_CONSOLE.today);
    setHighlightId(null);
    setLatestOuting(null);
    setBriefingOpen(false);
    if (!silent) setMode("live");
  }

  // 오늘 배차 브리핑 — 예약별 동행 컨디션·준비물 (전부 룰 엔진, LLM 0회)
  const briefing = useMemo(() =>
    today.map((b) => ({ b, o: executeCareTool("outing_condition", { date: "오늘", location: b.hospital }) })),
  [today]);

  const managerLoad = useMemo(() => {
    const map = {};
    today.forEach((b) => (map[b.managerId] = (map[b.managerId] || 0) + 1));
    return map;
  }, [today]);

  const liveMode = mode === "live";

  return (
    <>
      <Head>
        <title>시니어케어매니저 · AI 예약 데모</title>
        <meta name="theme-color" content="#F4EEE2" />
        <meta name="robots" content="noindex" />
        <style>{`
          .orb{ position:absolute; border-radius:50%; filter:blur(64px); opacity:.55; will-change:transform }
          .orb1{ width:520px; height:520px; top:-140px; left:-120px; animation:drift1 22s ease-in-out infinite }
          .orb2{ width:460px; height:460px; top:-80px; right:-100px; animation:drift2 26s ease-in-out infinite }
          .orb3{ width:440px; height:440px; bottom:-160px; left:32%; animation:drift3 24s ease-in-out infinite }
          .orb4{ width:380px; height:380px; bottom:-120px; right:8%; animation:drift1 20s ease-in-out infinite }
          @keyframes drift1{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(46px,34px)} }
          @keyframes drift2{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,40px)} }
          @keyframes drift3{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-38px)} }

          .glass-panel{
            background:linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.62));
            backdrop-filter:blur(18px) saturate(150%); -webkit-backdrop-filter:blur(18px) saturate(150%);
            border:1px solid rgba(255,255,255,0.7);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 30px -14px rgba(20,36,29,0.30);
          }
          .glass-card{
            background:linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.74));
            backdrop-filter:blur(14px) saturate(140%); -webkit-backdrop-filter:blur(14px) saturate(140%);
            border:1px solid rgba(255,255,255,0.72);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 22px -14px rgba(20,36,29,0.28);
          }
          .btn-primary{
            background:linear-gradient(180deg,#27392f,#15241d); color:#fff; border:1px solid rgba(255,255,255,0.14);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 20px -8px rgba(18,30,23,0.6), 0 1px 2px rgba(0,0,0,0.2);
            transition:transform .12s ease, box-shadow .12s ease;
          }
          .btn-primary:hover:not(:disabled){ transform:translateY(-1px); box-shadow:inset 0 1px 0 rgba(255,255,255,0.24), 0 12px 26px -8px rgba(18,30,23,0.7) }
          .btn-primary:disabled{ opacity:.55 }
          .btn-glass{
            background:rgba(255,255,255,0.55); color:#16211C; border:1px solid rgba(255,255,255,0.7);
            backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px -6px rgba(20,36,29,0.3);
            transition:transform .12s ease;
          }
          .btn-glass:hover:not(:disabled){ transform:translateY(-1px) }
          .btn-ghost{ background:rgba(255,255,255,0.14); color:#fff; border:1px solid rgba(255,255,255,0.28); backdrop-filter:blur(6px) }

          .pulse-dot{ box-shadow:0 0 0 0 rgba(239,68,68,0.5); animation:pulsedot 2.4s ease-in-out infinite }
          @keyframes pulsedot{ 0%,100%{opacity:1; box-shadow:0 0 9px 1px rgba(239,68,68,0.65)} 50%{opacity:.4; box-shadow:0 0 2px 0 rgba(239,68,68,0.15)} }

          @keyframes bkpulse{ 0%{box-shadow:0 0 0 0 rgba(31,138,122,0.55)} 70%{box-shadow:0 0 0 11px rgba(31,138,122,0)} 100%{box-shadow:0 0 0 0 rgba(31,138,122,0)} }
          .bk-pulse{ animation:bkpulse 1.5s ease-out 2 }
          @keyframes fadein{ from{opacity:0; transform:translateY(7px)} to{opacity:1; transform:none} }
          .fadein{ animation:fadein .38s ease both }
          @keyframes dots{ 0%,80%,100%{opacity:.2} 40%{opacity:1} }
          .typing span{ animation:dots 1.2s infinite } .typing span:nth-child(2){animation-delay:.2s} .typing span:nth-child(3){animation-delay:.4s}
          @media (prefers-reduced-motion: reduce){ .orb,.bk-pulse,.fadein,.typing span,.pulse-dot{animation:none !important} }
        `}</style>
      </Head>

      <div style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(160deg,${C.cream},${C.cream2})`, color: C.ink, overflow: "hidden", fontFamily: '"Pretendard Variable",Pretendard,-apple-system,system-ui,"Noto Sans KR",sans-serif' }}>
        <Orbs />

        {/* 헤더 */}
        <header style={{ position: "relative", zIndex: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 18px", background: `linear-gradient(180deg,#1a2c24,#12201a)`, color: "#fff", flexWrap: "wrap", boxShadow: "0 6px 24px -12px rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: `linear-gradient(160deg,${C.teal},${C.tealDk})`, display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px -4px rgba(31,138,122,0.6)" }}>
              <Icon name="heart" size={18} color="#fff" sw={1.9} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                시니어케어매니저 <Dot color="#EF4444" live />
              </div>
              <div style={{ fontSize: 11, opacity: 0.72, whiteSpace: "nowrap" }}>AI 예약 → 배차 콘솔 실시간 연결 시연</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, padding: "6px 11px", borderRadius: 999, background: liveMode ? "rgba(46,158,99,0.2)" : "rgba(188,130,54,0.24)", border: `1px solid ${liveMode ? "rgba(46,158,99,0.55)" : "rgba(188,130,54,0.55)"}` }}>
              <Dot color={liveMode ? "#43d17f" : "#e0a44a"} /> {liveMode ? "AI 연결됨" : "데모 스크립트"}
            </span>
            <button className="btn-glass" onClick={autoplay} disabled={autoOn} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, borderRadius: 11, padding: "8px 14px" }}>
              <Icon name="play" size={15} color={C.tealDk} /> {autoOn ? "시연 중…" : "30초 자동 시연"}
            </button>
            <button className="btn-ghost" onClick={() => reset(false)} disabled={autoOn} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, borderRadius: 11, padding: "8px 12px" }}>
              <Icon name="refresh" size={14} /> 초기화
            </button>
          </div>
        </header>

        {/* 본문 2분할 */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, minHeight: 0, display: "flex", gap: 14, padding: 14, flexWrap: "wrap" }}>
          {/* ── 좌: 챗봇 ── */}
          <section className="glass-panel" style={{ flex: "1 1 380px", minWidth: 320, display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", minHeight: 0 }}>
            <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(160deg,${C.evergreen},#1f342b)`, color: "#fff", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                <Icon name="sparkle" size={18} color="#8fe3d4" sw={1.4} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>돌봄이 AI</div>
                <div style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 5 }}><Dot color={C.green} live /> 카카오 상담톡 · 24시간 실시간 응대</div>
              </div>
              <Icon name="message" size={18} color={C.faint} />
            </div>

            {/* 컨디션·날씨지수 미니 대시보드 — 챗봇이 컨디션 조회하면 그 날짜 기준으로 실시간 전환 */}
            <WxDashboard o={latestOuting || SEED_CONSOLE.outing} />

            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m) => (
                <div key={m.id} className="fadein" style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "88%", padding: "10px 13px", borderRadius: 16, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
                    background: m.role === "user" ? `linear-gradient(180deg,#27392f,#16241d)` : "rgba(255,255,255,0.92)",
                    color: m.role === "user" ? "#fff" : C.ink,
                    border: m.role === "user" ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${C.line}`,
                    boxShadow: m.role === "user" ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px -10px rgba(18,30,23,0.6)" : "0 6px 16px -12px rgba(20,36,29,0.4)",
                    borderBottomRightRadius: m.role === "user" ? 5 : 16,
                    borderBottomLeftRadius: m.role === "user" ? 16 : 5,
                  }}>
                    {m.role === "assistant"
                      ? <TypingText text={m.content} done={!!m.typed} onComplete={() => markTyped(m.id)} />
                      : <Rich text={m.content} />}
                  </div>
                  {/* 인라인 카드는 타이핑 완료 후 노출 — '말한 뒤 카드가 뜨는' 연출 */}
                  {(m.role !== "assistant" || m.typed) && m.events?.map((ev, i) => (
                    <div key={i} className="fadein" style={{ width: "88%", maxWidth: "88%" }}>
                      {ev.type === "quote" && <QuoteCard q={ev} />}
                      {ev.type === "weather" && <WeatherCard w={ev} />}
                      {ev.type === "slots" && <SlotsCard slots={ev.available} />}
                      {ev.type === "booking" && <BookingCard b={ev.booking} />}
                    </div>
                  ))}
                </div>
              ))}
              {sending && (
                <div className="fadein" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", background: "rgba(255,255,255,0.92)", border: `1px solid ${C.line}`, borderRadius: 16, borderBottomLeftRadius: 5 }}>
                  <span className="typing" style={{ fontSize: 18, letterSpacing: 2, color: C.faint }}><span>·</span><span>·</span><span>·</span></span>
                  <span style={{ fontSize: 11.5, color: C.sub }}>{SENDING_STAGES[stageIdx]}</span>
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0, padding: "11px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
              <input
                value={input} disabled={autoOn}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend(); }}
                placeholder={autoOn ? "자동 시연 진행 중…" : "예: 아버지 다음주 항암 동행 예약하고 싶어요"}
                style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 13, padding: "12px 14px", fontSize: 13.5, outline: "none", background: autoOn ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.95)", color: C.ink }}
              />
              <button className="btn-primary" onClick={onSend} disabled={sending || autoOn || !input.trim()} style={{ borderRadius: 13, padding: "0 16px", display: "grid", placeItems: "center" }} aria-label="전송">
                <Icon name="send" size={18} />
              </button>
            </div>
            <div style={{ flexShrink: 0, padding: "0 14px 9px", fontSize: 10, color: C.faint, textAlign: "center" }}>
              예약·동행·요금 상담만 답변해요 · 의료 상담은 제공하지 않아요
            </div>
          </section>

          {/* ── 우: 콘솔 ── */}
          <section className="glass-panel" style={{ flex: "1.15 1 460px", minWidth: 340, display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", minHeight: 0 }}>
            <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Chip name="calendar" bg="rgba(31,138,122,0.14)" fg={C.tealDk} box={30} size={16} />
                <div>
                  <b style={{ fontSize: 14 }}>돌봄업체 관리자 콘솔</b>
                  <div style={{ fontSize: 11, color: C.faint }}>새벽케어 강남지점</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <button className="btn-glass" onClick={() => setBriefingOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, borderRadius: 9, padding: "6px 10px", color: C.ink }}>
                  <Icon name="clock" size={13} color={C.tealDk} /> 오늘 배차 브리핑
                </button>
                <span style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 5 }}><Dot color={C.green} live /> 실시간 동기화</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
              {/* KPI */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Kpi label="오늘 GMV" value={manwon(kpi.gmv)} suffix="만원" accent={C.tealDk} sub="실시간" />
                <Kpi label="예약 건수" value={kpi.bookings} suffix="건" />
                <Kpi label="매니저 가동률" value={kpi.utilization} suffix="%" />
                <Kpi label="노쇼율" value={`${kpi.noShow}%`} accent={C.green} />
              </div>

              {/* 오늘 외출 컨디션 (케이웨더) */}
              {(() => {
                const o = SEED_CONSOLE.outing;
                const g = WX_GRADE[o.grade] || WX_GRADE["보통"];
                return (
                  <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 7 }}>
                        <Icon name={skyIcon(o.sky)} size={14} color={C.amber} /> 오늘 외출 컨디션
                        <span style={{ fontWeight: 400, color: C.faint }}>· {o.location} · 케이웨더</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: g.fg, background: g.bg, borderRadius: 7, padding: "3px 9px" }}>{o.grade}</span>
                    </div>
                    <div style={{ padding: "11px 15px" }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <WxMetric icon="thermometer" label="기온" value={`${o.temp}℃ ${o.sky}`} />
                        <WxMetric icon="wind" label="미세먼지" value={o.pm_grade} />
                        <WxMetric icon="sun" label="자외선" value={o.uv_grade} tone="#8A6216" />
                        <WxMetric icon="droplet" label="습도" value={`${o.humidity}%`} />
                      </div>
                      <ItemChips items={o.items} />
                    </div>
                  </div>
                );
              })()}

              {/* 오늘 배차 브리핑 — 예약별 동행 컨디션·준비물 (룰 엔진, LLM 0회) */}
              {briefingOpen && (
                <div className="glass-panel fadein" style={{ borderRadius: 18, overflow: "hidden", border: `1.5px solid rgba(31,138,122,0.4)` }}>
                  <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 7 }}>
                      <Icon name="clock" size={14} color={C.teal} /> 오늘 배차 브리핑 <span style={{ fontWeight: 400, color: C.faint }}>· 예약 {briefing.length}건 · 케이웨더 기준</span>
                    </span>
                    <button onClick={() => setBriefingOpen(false)} style={{ background: "none", border: "none", color: C.faint, fontSize: 15, lineHeight: 1 }} aria-label="닫기">×</button>
                  </div>
                  <div style={{ padding: "6px 15px 10px" }}>
                    {briefing.map(({ b, o }) => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 12 }}>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: C.faint, flexShrink: 0, width: 38 }}>{hourLabel(b.start)}</span>
                        <span style={{ fontWeight: 600, color: C.ink, flexShrink: 0 }}>{b.hospital}</span>
                        <span style={{ color: C.sub, flexShrink: 0 }}>{b.recipient}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: scoreStyle(o.score).fg, background: scoreStyle(o.score).bg, borderRadius: 6, padding: "1px 7px", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{o.score}점 {o.verdict}</span>
                        <span style={{ color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{o.items.slice(0, 2).join("·")}</span>
                        <span style={{ color: C.sub, flexShrink: 0 }}>{b.manager} 매니저</span>
                      </div>
                    ))}
                    <button className="btn-primary" onClick={() => { pushTicker(`브리핑 알림톡 ${briefing.length}건 발송 완료 (매니저 전원)`, "green"); setBriefingOpen(false); }}
                      style={{ width: "100%", marginTop: 10, borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon name="send" size={14} /> 매니저 알림톡 일괄 발송
                    </button>
                  </div>
                </div>
              )}

              {/* 주간 일자별 외출 컨디션 캘린더 */}
              <WeekOuting week={SEED_CONSOLE.week} />

              {/* 실시간 접수 티커 */}
              <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon name="activity" size={14} color={C.teal} /> 실시간 접수
                </div>
                <div style={{ padding: "6px 15px", minHeight: 44 }}>
                  {ticker.length === 0 && <div style={{ fontSize: 12, color: C.faint, padding: "9px 0" }}>챗봇에서 예약이 들어오면 여기에 실시간으로 표시됩니다.</div>}
                  {ticker.map((t) => (
                    <div key={t.id} className="fadein" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12.5 }}>
                      <Dot color={t.tone === "green" ? C.green : t.tone === "blue" ? C.blue : t.tone === "amber" ? C.amber : C.teal} />
                      <span style={{ color: C.faint, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{t.stamp}</span>
                      <span style={{ color: C.ink, fontWeight: t.tone === "green" ? 700 : 400 }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 배차 그리드 */}
              <DispatchGrid today={today} highlightId={highlightId} />

              {/* 매니저 현황 */}
              <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: "9px 15px", borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.ink2, display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon name="users" size={14} color={C.teal} /> 케어매니저 현황
                </div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {SEED_MANAGERS.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 15px", width: "50%", boxSizing: "border-box" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(160deg,${C.teal},${C.tealDk})`, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}>{m.name[0]}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>{m.name} <Star size={11} /> <span style={{ color: C.faint, fontWeight: 400 }}>{m.rating}</span></div>
                        <div style={{ fontSize: 10.5, color: C.faint }}>오늘 {managerLoad[m.id] || 0}건 · {m.areas[0]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ?debug=1 — 아키텍처 상태 패널 (wellbian 디버그 모드 계승) */}
              {debugOn && (
                <div className="glass-panel" style={{ borderRadius: 14, padding: "10px 14px", fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: C.ink2, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="activity" size={12} color={C.teal} /> DEBUG · 엔진 상태
                  </div>
                  {lastMeta ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", color: C.sub }}>
                      <span>mode: <b>{lastMeta.mode}</b></span>
                      <span>model: <b>{lastMeta.model_used}</b>{lastMeta.complexity ? ` (${lastMeta.complexity})` : ""}</span>
                      <span>tool rounds: <b>{lastMeta.rounds}</b></span>
                      <span>rules: <b>{lastMeta.rules_injected ?? 0}</b></span>
                      <span>events: <b>{lastMeta.events}</b></span>
                      <span>elapsed: <b>{lastMeta.elapsed_ms}ms</b></span>
                      {lastMeta.usage && (
                        <span>tokens in/out: <b>{lastMeta.usage.input_tokens}/{lastMeta.usage.output_tokens}</b>
                          {lastMeta.usage.cache_read_input_tokens > 0
                            ? <b style={{ color: C.green }}> · 캐시 적중 {lastMeta.usage.cache_read_input_tokens}</b>
                            : <b style={{ color: C.amber }}> · 캐시 미적중</b>}
                        </span>
                      )}
                    </div>
                  ) : <span style={{ color: C.faint }}>아직 요청 없음 — 메시지를 보내면 라우팅·캐시·토큰이 표시됩니다</span>}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
