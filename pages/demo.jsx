/* ============================================================
 * 시니어케어매니저 · /demo
 *
 * "챗봇 → 콘솔" 연결 시연 (30초 임팩트 데모).
 *  좌: 보호자용 AI 예약 챗봇 (실서비스 /api/care-chat · Claude tool use)
 *  우: 돌봄업체 관리자 콘솔 (배차 그리드 · GMV · 매니저 · 실시간 접수)
 *
 * 챗봇이 예약을 확정(create_booking)하면 그 예약이 우측 배차 그리드에
 * 즉시 꽂히고 GMV·예약수가 실시간으로 오릅니다.
 *
 * 안정성: API 키가 없거나 네트워크가 끊겨도 동일한 이벤트를 내는
 * 데모 스크립트로 자동 폴백 → 시연은 언제나 완주됩니다.
 * ============================================================ */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { executeCareTool, SEED_CONSOLE, SEED_MANAGERS } from "../lib/careTools";

/* ─── 디자인 토큰 ─── */
const C = {
  bg: "#F1EDE4", panel: "#FFFFFF", cream: "#FBF9F4",
  ink: "#111C19", sub: "#5C6B66", faint: "#8A968F", line: "rgba(17,28,25,0.10)",
  teal: "#0FA697", tealDk: "#0B7A6F", moss: "#123F37",
  blue: "#3E63FF", amber: "#D98A2B", green: "#2FA95F", red: "#E5533C",
  meBubble: "#123F37", botBubble: "#FFFFFF",
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
  confirmed:  { label: "예약확정", fg: C.tealDk, bg: "rgba(15,166,151,0.12)", dot: C.teal },
  pending:    { label: "배차대기", fg: "#9A6512", bg: "rgba(217,138,43,0.14)", dot: C.amber },
  dispatched: { label: "배차완료", fg: "#2C43B8", bg: "rgba(62,99,255,0.12)", dot: C.blue },
  in_service: { label: "수행중",   fg: "#1E7A44", bg: "rgba(47,169,95,0.14)", dot: C.green },
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

/* ─── 챗봇: 견적 카드 ─── */
function QuoteCard({ q }) {
  return (
    <div style={{ marginTop: 8, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", background: C.cream }}>
      <div style={{ padding: "10px 14px", background: "rgba(15,166,151,0.10)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: C.tealDk, fontSize: 13 }}>💰 투명 견적</span>
        <span style={{ fontSize: 12, color: C.sub }}>{q.service_label}</span>
      </div>
      <div style={{ padding: "12px 14px", fontSize: 13, color: C.ink }}>
        <Row k={q.breakdown} v={won(q.base)} />
        {q.surcharge_lines.map((s, i) => <Row key={i} k={s.label} v={`+${won(s.amount)}`} muted />)}
        <div style={{ height: 1, background: C.line, margin: "8px 0" }} />
        <Row k={<b>총 예상 금액</b>} v={<b style={{ color: C.tealDk, fontSize: 16 }}>{won(q.total)}</b>} />
        <div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>· {q.note}</div>
      </div>
    </div>
  );
}
const Row = ({ k, v, muted }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: muted ? C.sub : C.ink }}>
    <span>{k}</span><span>{v}</span>
  </div>
);

/* ─── 챗봇: 매니저 슬롯 카드 ─── */
function SlotsCard({ slots }) {
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {slots.map((s, i) => (
        <div key={s.manager_id} style={{ border: `1px solid ${i === 0 ? "rgba(15,166,151,0.5)" : C.line}`, borderRadius: 14, padding: "10px 12px", background: i === 0 ? "rgba(15,166,151,0.06)" : C.panel, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.moss, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{s.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <b style={{ fontSize: 14 }}>{s.name} 매니저</b>
              {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: C.teal, borderRadius: 6, padding: "2px 6px" }}>추천</span>}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>⭐ {s.rating} ({s.reviews}) · {s.specialty}</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{s.cert.join("·")} · {s.distance_km}km{s.nearby ? " · 근거리" : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 챗봇: 예약 확정 카드 ─── */
function BookingCard({ b }) {
  return (
    <div style={{ marginTop: 8, border: `1.5px solid ${C.teal}`, borderRadius: 14, overflow: "hidden", background: C.panel, boxShadow: "0 8px 24px rgba(15,166,151,0.18)" }}>
      <div style={{ padding: "10px 14px", background: C.moss, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>✅ 예약 접수 완료</span>
        <span style={{ fontSize: 12, opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{b.id}</span>
      </div>
      <div style={{ padding: "12px 14px", fontSize: 13 }}>
        <Row k="대상 · 병원" v={`${b.recipient} · ${b.hospital}`} />
        <Row k="일시" v={`${b.date} ${b.time} · ${b.hours}시간`} />
        <Row k="서비스" v={b.service_label} />
        <Row k="담당 매니저" v={`${b.manager_name} (⭐${b.manager_rating})`} />
        <div style={{ height: 1, background: C.line, margin: "8px 0" }} />
        <Row k={<b>결제 금액</b>} v={<b style={{ color: C.tealDk, fontSize: 16 }}>{won(b.price)}</b>} />
        <a href="#" onClick={(e) => e.preventDefault()} style={{ display: "block", textAlign: "center", marginTop: 10, background: C.teal, color: "#fff", fontWeight: 700, borderRadius: 10, padding: "10px 0", fontSize: 13 }}>
          토스로 선결제하기 (에스크로 보관)
        </a>
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
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
        <b style={{ fontSize: 13, color: C.ink }}>오늘의 배차 현황</b>
        <span style={{ fontSize: 11, color: C.faint }}>매니저 {SEED_MANAGERS.length}명 · 08–18시</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560 }}>
          {/* 시간 헤더 */}
          <div style={{ display: "flex", paddingLeft: 74, borderBottom: `1px solid ${C.line}` }}>
            {hours.slice(0, -1).map((h) => (
              <div key={h} style={{ flex: 1, fontSize: 10, color: C.faint, padding: "4px 0", textAlign: "left", paddingLeft: 2 }}>{h}시</div>
            ))}
          </div>
          {/* 매니저 행 */}
          {SEED_MANAGERS.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.line}`, height: 46 }}>
              <div style={{ width: 74, flexShrink: 0, padding: "6px 8px", borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{m.name}</span>
                <span style={{ fontSize: 10, color: C.faint }}>⭐{m.rating}</span>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                {/* 시간 격자 */}
                {hours.slice(1, -1).map((h) => (
                  <div key={h} style={{ position: "absolute", left: `${((h - GRID_START) / GRID_SPAN) * 100}%`, top: 0, bottom: 0, width: 1, background: C.line }} />
                ))}
                {(byMgr[m.id] || []).map((b) => {
                  const left = ((b.start - GRID_START) / GRID_SPAN) * 100;
                  const width = (b.hours / GRID_SPAN) * 100;
                  const st = STATUS[b.status] || STATUS.confirmed;
                  const isNew = b.id === highlightId;
                  return (
                    <div key={b.id} title={`${b.recipient} · ${b.hospital}`} className={isNew ? "bk-pulse" : ""}
                      style={{
                        position: "absolute", left: `${left}%`, width: `calc(${width}% - 4px)`, top: 5, bottom: 5,
                        background: st.bg, border: `1px solid ${isNew ? C.teal : st.dot}`, borderLeft: `3px solid ${st.dot}`,
                        borderRadius: 7, padding: "3px 6px", overflow: "hidden", fontSize: 10.5, lineHeight: 1.15,
                        boxShadow: isNew ? "0 0 0 3px rgba(15,166,151,0.25)" : "none", zIndex: isNew ? 3 : 1,
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
    <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 4, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || C.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {typeof value === "number" ? <CountUp value={value} suffix={suffix} /> : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ============================================================
 * 데모 스크립트 (API 폴백) — 실 API 실패 시 동일 이벤트로 완주
 * ============================================================ */
function mockReply(userTurn) {
  if (userTurn <= 1) {
    return { content: "네, 어머니 병원동행 도와드릴게요. 두 가지만 여쭤볼게요 😊\n혼자 걸으실 수 있나요, 아니면 **휠체어**가 필요하실까요? 그리고 **진료 시작 시간**이 언제쯤인가요?", events: [] };
  }
  if (userTurn === 2) {
    const q = executeCareTool("estimate_quote", { service_type: "hospital", hours: 3 });
    const s = executeCareTool("check_slots", { date: "다음주 화요일", hospital: "서울대병원", service_type: "hospital" });
    const top = s.available[0];
    return {
      content: `오래 서 계시기 힘드시면 곁에서 부축·대기해 드리는 **외래 동행**으로 잡을게요. 이동·대기 포함 **3시간** 기준 견적입니다.\n서울대병원 근처 배정 가능한 매니저예요. 평점 ${top.rating} **${top.name} 매니저**(${top.specialty})를 추천드려요. 이분으로 예약할까요?`,
      events: [q._event, s._event],
    };
  }
  if (userTurn === 3) {
    const s = executeCareTool("check_slots", { date: "다음주 화요일", hospital: "서울대병원", service_type: "hospital" });
    const b = executeCareTool("create_booking", {
      recipient_name: "어머니", hospital: "서울대병원", date: "다음주 화요일", time: "오전 9시",
      hours: 3, service_type: "hospital", manager_id: s.available[0].manager_id,
    });
    return {
      content: `확정되었습니다! 아래 내용으로 접수했어요.\n**${b.booking.manager_name} 매니저**가 배정됐고, 결제 링크로 선결제(에스크로)하면 확정됩니다. 출발·도착·완료 시 **알림톡**으로 안내드려요.`,
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

const GREETING = { id: "g0", role: "assistant", content: "안녕하세요, 시니어케어매니저 **돌봄이 AI**예요. 어떤 병원동행이나 돌봄이 필요하신가요? 편하게 말씀해 주세요 🙂", events: [] };

/* ============================================================
 * 메인
 * ============================================================ */
export default function DemoPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("live");   // 'live' | 'demo'
  const [autoOn, setAutoOn] = useState(false);
  const [ticker, setTicker] = useState([]);
  const [kpi, setKpi] = useState(SEED_CONSOLE.kpi);
  const [today, setToday] = useState(SEED_CONSOLE.today);
  const [highlightId, setHighlightId] = useState(null);

  const scrollRef = useRef(null);
  const userTurnRef = useRef(0);
  const messagesRef = useRef([GREETING]);   // 최신 대화 (autoplay 클로저 stale 방지)
  const modeRef = useRef("live");

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const pushTicker = useCallback((label, tone) => {
    const stamp = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
    setTicker((t) => [{ id: `${stamp}-${label}`, stamp, label, tone }, ...t].slice(0, 6));
  }, []);

  const applyEvents = useCallback((events = []) => {
    events.forEach((ev) => {
      if (ev.type === "quote") pushTicker(`견적 산출 · ${won(ev.total)}`, "teal");
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

    // 히스토리(텍스트만) 구성 — ref로 최신 상태 사용, 선두 assistant(인사) 제거
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
          if (data.content || (data.events && data.events.length)) reply = { content: data.content || "", events: data.events || [] };
        }
        if (!reply) { setMode("demo"); }
      } catch (_) { setMode("demo"); }
    }
    if (!reply) reply = mockReply(turn);   // 폴백(또는 데모 모드)

    // 자연스러운 응답 지연
    await new Promise((r) => setTimeout(r, 480));
    setMessages((m) => [...m, { id: `a${turn}`, role: "assistant", content: reply.content, events: reply.events || [] }]);
    applyEvents(reply.events);
    setSending(false);
    return reply;
  }, [applyEvents]);   // messages·mode 는 ref로 읽어 runTurn 을 안정적으로 유지

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
      // 타이핑 흉내
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
    setTicker([]);
    setKpi(SEED_CONSOLE.kpi);
    setToday(SEED_CONSOLE.today);
    setHighlightId(null);
    if (!silent) setMode("live");
  }

  const managerLoad = useMemo(() => {
    const map = {};
    today.forEach((b) => (map[b.managerId] = (map[b.managerId] || 0) + 1));
    return map;
  }, [today]);

  return (
    <>
      <Head>
        <title>시니어케어매니저 · AI 예약 데모</title>
        <meta name="robots" content="noindex" />
        <style>{`
          @keyframes bkpulse { 0%{box-shadow:0 0 0 0 rgba(15,166,151,0.55)} 70%{box-shadow:0 0 0 10px rgba(15,166,151,0)} 100%{box-shadow:0 0 0 0 rgba(15,166,151,0)} }
          .bk-pulse{ animation: bkpulse 1.4s ease-out 2 }
          @keyframes fadein { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
          .fadein{ animation: fadein .35s ease both }
          @keyframes dots { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
          .typing span{ animation: dots 1.2s infinite } .typing span:nth-child(2){animation-delay:.2s} .typing span:nth-child(3){animation-delay:.4s}
          @media (prefers-reduced-motion: reduce){ .bk-pulse,.fadein,.typing span{animation:none !important} }
        `}</style>
      </Head>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.ink, fontFamily: '"Pretendard Variable",Pretendard,-apple-system,system-ui,"Noto Sans KR",sans-serif' }}>
        {/* 헤더 */}
        <header style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 18px", background: C.moss, color: "#fff", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: C.teal, display: "grid", placeItems: "center", fontSize: 16 }}>🩺</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>시니어케어매니저</div>
              <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap" }}>AI 예약 → 배차 콘솔 실시간 연결 시연</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: mode === "live" ? "rgba(47,169,95,0.25)" : "rgba(217,138,43,0.28)", border: `1px solid ${mode === "live" ? "rgba(47,169,95,0.6)" : "rgba(217,138,43,0.6)"}` }}>
              {mode === "live" ? "● AI 연결됨" : "● 데모 스크립트"}
            </span>
            <button onClick={autoplay} disabled={autoOn} style={{ fontSize: 13, fontWeight: 700, color: C.moss, background: autoOn ? "rgba(255,255,255,0.55)" : "#fff", border: "none", borderRadius: 10, padding: "8px 14px" }}>
              {autoOn ? "시연 중…" : "▶ 30초 자동 시연"}
            </button>
            <button onClick={() => reset(false)} disabled={autoOn} style={{ fontSize: 13, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "8px 12px" }}>초기화</button>
          </div>
        </header>

        {/* 본문 2분할 */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 0, flexWrap: "wrap" }}>
          {/* ── 좌: 챗봇 ── */}
          <section style={{ flex: "1 1 380px", minWidth: 320, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.line}`, background: C.cream, minHeight: 0 }}>
            <div style={{ flexShrink: 0, padding: "10px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 8, background: C.panel }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.moss, color: "#fff", display: "grid", placeItems: "center" }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>돌봄이 AI · 카카오 상담톡</div>
                <div style={{ fontSize: 11, color: C.green }}>● 24시간 실시간 응대</div>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m) => (
                <div key={m.id} className="fadein" style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "88%", padding: "10px 13px", borderRadius: 15,
                    background: m.role === "user" ? C.meBubble : C.botBubble,
                    color: m.role === "user" ? "#fff" : C.ink,
                    border: m.role === "user" ? "none" : `1px solid ${C.line}`,
                    borderBottomRightRadius: m.role === "user" ? 5 : 15,
                    borderBottomLeftRadius: m.role === "user" ? 15 : 5,
                    fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  }}>
                    <Rich text={m.content} />
                  </div>
                  {/* 이벤트 카드 */}
                  {m.events?.map((ev, i) => (
                    <div key={i} style={{ width: "88%", maxWidth: "88%" }}>
                      {ev.type === "quote" && <QuoteCard q={ev} />}
                      {ev.type === "slots" && <SlotsCard slots={ev.available} />}
                      {ev.type === "booking" && <BookingCard b={ev.booking} />}
                    </div>
                  ))}
                </div>
              ))}
              {sending && (
                <div className="fadein" style={{ alignSelf: "flex-start", padding: "10px 14px", background: C.botBubble, border: `1px solid ${C.line}`, borderRadius: 15, borderBottomLeftRadius: 5 }}>
                  <span className="typing" style={{ fontSize: 18, letterSpacing: 2, color: C.faint }}><span>·</span><span>·</span><span>·</span></span>
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0, padding: "10px 12px", borderTop: `1px solid ${C.line}`, background: C.panel, display: "flex", gap: 8 }}>
              <input
                value={input} disabled={autoOn}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend(); }}
                placeholder={autoOn ? "자동 시연 진행 중…" : "예: 아버지 다음주 항암 동행 예약하고 싶어요"}
                style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, outline: "none", background: autoOn ? "#F3F1EC" : "#fff", color: C.ink }}
              />
              <button onClick={onSend} disabled={sending || autoOn || !input.trim()} style={{ background: (!input.trim() || sending || autoOn) ? "rgba(15,166,151,0.4)" : C.teal, color: "#fff", border: "none", borderRadius: 12, padding: "0 18px", fontWeight: 700, fontSize: 14 }}>전송</button>
            </div>
          </section>

          {/* ── 우: 콘솔 ── */}
          <section style={{ flex: "1.15 1 460px", minWidth: 340, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flexShrink: 0, padding: "10px 16px", borderBottom: `1px solid ${C.line}`, background: C.panel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 14 }}>돌봄업체 관리자 콘솔</b>
                <span style={{ fontSize: 11, color: C.faint }}>새벽케어 강남지점</span>
              </div>
              <span style={{ fontSize: 11, color: C.green }}>● 실시간 동기화</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* KPI */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Kpi label="오늘 GMV" value={manwon(kpi.gmv)} suffix="만원" accent={C.tealDk} sub="▲ 실시간" />
                <Kpi label="예약 건수" value={kpi.bookings} suffix="건" />
                <Kpi label="매니저 가동률" value={kpi.utilization} suffix="%" />
                <Kpi label="노쇼율" value={`${kpi.noShow}%`} accent={C.green} />
              </div>

              {/* 실시간 접수 티커 */}
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.sub }}>실시간 접수</div>
                <div style={{ padding: "6px 14px", minHeight: 44 }}>
                  {ticker.length === 0 && <div style={{ fontSize: 12, color: C.faint, padding: "8px 0" }}>챗봇에서 예약이 들어오면 여기에 실시간으로 표시됩니다.</div>}
                  {ticker.map((t) => (
                    <div key={t.id} className="fadein" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12.5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.tone === "green" ? C.green : t.tone === "blue" ? C.blue : C.teal, flexShrink: 0 }} />
                      <span style={{ color: C.faint, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{t.stamp}</span>
                      <span style={{ color: C.ink, fontWeight: t.tone === "green" ? 700 : 400 }}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 배차 그리드 */}
              <DispatchGrid today={today} highlightId={highlightId} />

              {/* 매니저 현황 */}
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.sub }}>케어매니저 현황</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {SEED_MANAGERS.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "50%", boxSizing: "border-box" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.moss, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.name[0]}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name} <span style={{ color: C.faint, fontWeight: 400 }}>⭐{m.rating}</span></div>
                        <div style={{ fontSize: 10.5, color: C.faint }}>오늘 {managerLoad[m.id] || 0}건 · {m.areas[0]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
