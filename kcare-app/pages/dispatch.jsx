import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import {
  AI_ASSIGN,
  BRIEFINGS,
  DISPATCH_KPIS,
  FATIGUE,
  JOBS,
  MAP_DISTRICTS,
  MAP_HOSPITALS,
  RISK_WATCH,
  ROUTE_CHAIN,
  SCORE_FACTORS,
  SLA_ROWS,
  STAFF,
  STAFF_STATUS,
  UNMATCHED,
  WEEK_FORECAST,
  mapPeople,
} from "../lib/mock";
import { useAppState } from "../lib/state";

// 배치관리자(관제) — 핸드오프 09 상세 명세 + REQ-04(긴급 대응 범위, 회의 확정 우선).
// 데스크톱 전용 · 정보 밀도가 정당한 유일한 화면 (10~13px 활자가 정답 — 09 §0).
// 핵심 원칙: ① AI는 제안, 사람이 승인 (L4) ② 짝 없으면 확정 불가 (1인 배차 없음)
// ③ 피로도 상한은 시스템이 강제. JOBS 단일 원본에서 그리드·페어보드·KPI가 파생된다.

const NAVY = "#0A1F3C";

const KIND_STYLE = {
  active: { bg: "#0A1F3C", fg: "#FFFFFF" },
  planned: { bg: "#E4E9F1", fg: "#0A1F3C" },
  done: { bg: "#EFEDE6", fg: "#5C5A54" },
  sos: { bg: "#C0392B", fg: "#FFFFFF" },
};

const STATE_PILL = {
  완료: { fg: "#5C5A54", bg: "linear-gradient(180deg,#FBFAF7,#F5F3EE)" },
  진행중: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  확정: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  "순환 경고": { fg: "#8A5D12", bg: "rgba(138,93,18,.1)" },
  "짝 없음": { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
};

const FORECAST_TONE = {
  ok: { bg: "linear-gradient(180deg,#F1FAF6,#E6F4EE)", border: "rgba(30,122,90,.24)", fg: "#1E7A5A" },
  warn: { bg: "linear-gradient(180deg,#FFF7E8,#FBEFD8)", border: "rgba(138,93,18,.26)", fg: "#8A5D12" },
  bad: { bg: "linear-gradient(180deg,#FFF1EE,#FBE3DE)", border: "rgba(192,57,43,.28)", fg: "#C0392B" },
};

const RISK_LEVEL = {
  높음: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  중간: { fg: "#8A5D12", bg: "rgba(138,93,18,.1)" },
};

function hourToHM(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function Panel({ children, className = "", style }) {
  return (
    <section
      className={`card-glass rounded-[14px] p-[18px] ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

function PanelHead({ title, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[13px] font-bold text-navy">{title}</h2>
      {right && <div className="text-[11px] text-muted">{right}</div>}
    </div>
  );
}

// SOS 경과 — 관제만 본다. 가족 화면 노출 금지 (사건 A 정보 비대칭)
function useElapsed(active) {
  const startRef = useRef(null);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) {
      startRef.current = null;
      setSec(0);
      return undefined;
    }
    if (!startRef.current) startRef.current = Date.now();
    const t = setInterval(() => setSec(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active]);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

// 관제 맵 — Leaflet · CARTO 다크 타일 · 실측 좌표 (09 §4)
function ControlMap({ sos }) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      if (cancelled || !nodeRef.current) return;
      const map = L.map(nodeRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false, // 페이지 스크롤 중 줌 방지 — 관제사가 위치를 잃는다
      });
      mapRef.current = map;
      // 타일: 표준 OpenStreetMap (요청 반영 · 우선). 09 §4 원안은 CARTO 다크 —
      // 라이브러리·타일을 바꿔도 좌표는 그대로 쓴다.
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: "abc",
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const pts = [];
      const add = (lat, lng, label, color, radius) => {
        pts.push([lat, lng]);
        L.circleMarker([lat, lng], {
          radius,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.5,
        })
          .addTo(map)
          .bindPopup(label, { className: "kcare-popup" });
      };
      // 라이트 타일 위 가독을 위해 흰색 계열 마커는 네이비 톤으로
      MAP_DISTRICTS.forEach((d) => add(d.lat, d.lng, d.name, "rgba(10,31,60,.35)", 4));
      MAP_HOSPITALS.forEach((h) => add(h.lat, h.lng, `${h.name} · 제휴 병원`, "#B08D57", 7));
      mapPeople(sos).forEach((p) => add(p.lat, p.lng, p.label, p.color, 7));
      map.fitBounds(L.latLngBounds(pts), { padding: [26, 26] });
    });

    const onResize = () => mapRef.current && mapRef.current.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (mapRef.current) {
        mapRef.current.remove(); // cleanup 필수 (09 §4)
        mapRef.current = null;
      }
    };
  }, [sos]);

  return (
    <div className="relative">
      <div ref={nodeRef} className="h-[300px] overflow-hidden rounded-[10px] bg-[#E6EBF2]" />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] rounded-md bg-black/45 px-2 py-1 text-[9px] font-bold tracking-[.08em] text-white/80">
        SEOUL · OpenStreetMap 실측 좌표
      </div>
    </div>
  );
}

export default function DispatchConsole() {
  const { state, dispatch } = useAppState();
  const { sos } = state.demo;
  const { sosDispatched, sos119, assign, unmatchFixed } = state.ops;
  const checkedIn = state.visit.checkedIn;
  const elapsed = useElapsed(sos);
  const [tab, setTab] = useState("live");
  const [range, setRange] = useState("7");
  const [briefed, setBriefed] = useState(false);

  // 초 단위 시계 (09 §1) — SOS 경과가 초 단위라 화면이 1초 틱으로 갱신
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const push = (kind, text, color) =>
    dispatch({ type: "pushEvent", payload: { kind, text, color } });

  // ⚙ JOBS 단일 원본 → 상태 반영 파생 (09 §6 · §10)
  const jobs = JOBS.map((j) => {
    if (j.id === "j2") {
      return { ...j, kind: sosDispatched ? "sos" : checkedIn ? "active" : "planned" };
    }
    if (j.id === "j4" && unmatchFixed) {
      return { ...j, sup: "서다인", kind: "planned", state: "확정", note: "서다인 재배치 · 18:10 건 재편성 완료" };
    }
    return j;
  });

  // 배차 그리드 행 — 바가 있는 인력만
  const rows = STAFF.map((st) => {
    const bars = jobs
      .filter((j) => j.lead === st.name || j.sup === st.name)
      .map((j) => {
        const isLead = j.lead === st.name;
        const tok = j.job.split("·")[0].trim();
        const sub = isLead
          ? j.sup
            ? `주 · ${tok} (짝 ${j.sup})`
            : `주 · ${tok} — 부 동행 미배정`
          : `부 · 이동·접수 (주 ${j.lead})`;
        return {
          id: `${j.id}-${isLead ? "L" : "S"}`,
          left: ((j.s - 8) / 12) * 100,
          width: ((j.e - j.s) / 12) * 100,
          label: j.client,
          sub: `${hourToHM(j.s)}–${hourToHM(j.e)} · ${sub}`,
          ...KIND_STYLE[j.kind],
        };
      });
    return { ...st, bars };
  }).filter((r) => r.bars.length);

  // 현재 시각선 (08:00–20:00 구간)
  const nowPct = ((now.getHours() + now.getMinutes() / 60 - 8) / 12) * 100;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 페어 KPI — JOBS에서 계산 (09 §8.1)
  const paired = jobs.filter((j) => j.sup).length;
  const rotationWarns = jobs.filter((j) => j.state === "순환 경고").length;
  const pairKpis = [
    {
      k: "오늘 페어 편성",
      v: `${paired} / ${jobs.length}`,
      note: unmatchFixed ? "미편성 해소 · 서다인 재배치" : "1건 미편성 (16:20 투석)",
      color: unmatchFixed ? "#1E7A5A" : "#8A5D12",
    },
    { k: "순환 경고", v: String(rotationWarns), note: "동일 페어 3회 연속 · 다음 배정 순환", color: "#8A5D12" },
    { k: "평균 편성 소요", v: "38초", note: "AI 제안 → 승인", color: "#1E7A5A" },
    // 불변량 — 이 값이 0이 아니게 되는 코드 경로를 만들지 않는다 (예외 승인 절차 없음)
    { k: "단독 배차", v: "0", note: "예외 승인 절차 없음", color: "#1E7A5A" },
  ];

  const kpis = [
    ...DISPATCH_KPIS,
    { k: "SOS", v: sos ? "1" : "0", color: sos ? "#C0392B" : "#5C5A54" },
  ];

  const forecast = range === "3" ? WEEK_FORECAST.slice(0, 3) : WEEK_FORECAST;

  return (
    <>
      <Head>
        <title>배치 관제 센터 — K-CARE</title>
      </Head>
      <div className="console-bg min-h-screen px-4 pb-10 pt-7 text-ink sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          {/* ── 헤더: 제목 + 시계 + KPI ── */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold tracking-[.16em] text-muted">
                  역할 04 / 배치 관제 센터
                </span>
                <a href="/" className="text-[11px] font-bold text-muted/60 underline-offset-2 hover:underline">
                  데모 홈
                </a>
              </div>
              <h1 className="mt-0.5 text-[26px] font-bold tracking-[-.01em] text-navy">강남지점 실시간 관제</h1>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                <span>
                  {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </span>
                <span className="h-[3px] w-[3px] rounded-full bg-navy/30" />
                <span className="font-num text-[15px] font-bold text-navy">{now.toTimeString().slice(0, 8)}</span>
                <span className="text-[11px] font-semibold">KST</span>
                <span className="ml-1 h-[6px] w-[6px] animate-livePing rounded-full bg-green" />
                <span className="text-[11px] font-bold text-green">LIVE</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {kpis.map((k) => (
                <div key={k.k} className="card-glass min-w-[104px] rounded-xl px-4 py-[11px]">
                  <div className="text-[10px] font-bold text-muted">{k.k}</div>
                  <div className="font-num text-[20px] font-bold" style={{ color: k.color }}>
                    {k.v}
                  </div>
                </div>
              ))}
            </div>
          </header>

          {/* ── SOS 배너 (09 §2 + REQ-04 경계) ── */}
          {sos && (
            <section className="mt-[18px] flex flex-wrap items-center gap-[18px] rounded-[14px] bg-danger px-5 py-4 text-white animate-sosPulse">
              <span className="rounded-lg bg-white/[.18] px-2.5 py-1.5 text-[11px] font-bold tracking-[.14em]">
                SOS
              </span>
              <div className="min-w-[240px] flex-1">
                <div className="text-[15px] font-bold">
                  김순자 (78) · 강남구 대치동 — 최근접 컨시어지 박지현 (1.2km)
                </div>
                <div className="mt-0.5 font-num text-[12px] opacity-[.88]">
                  경과 {elapsed} · 목표 응답 60초 이내 · {sos119 ? "119 연계 완료" : "119 연계 대기"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 급파 지시가 해제보다 시각적으로 강하다 — 실수 방지 (09 §2) */}
                <button
                  onClick={() => {
                    if (sosDispatched) return;
                    dispatch({ type: "opsPatch", patch: { sosDispatched: true } });
                    push("대응", "박지현 급파 지시 · 119 연계 대기", "#FF8A80");
                  }}
                  disabled={sosDispatched}
                  className="btn-press btn-on-red rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-danger disabled:opacity-80"
                >
                  {sosDispatched ? "급파 중 · 박지현" : "급파 지시 (주간 · 가용)"}
                </button>
                <button
                  onClick={() => {
                    if (sos119) return;
                    dispatch({ type: "opsPatch", patch: { sos119: true } });
                    push("대응", "119 연계 기록 · 기본 보증 범위 내 조치", "#FF8A80");
                  }}
                  disabled={sos119}
                  className="btn-press rounded-xl border border-white/70 px-4 py-2.5 text-[13px] font-bold disabled:opacity-70"
                >
                  {sos119 ? "119 연계 기록됨" : "119 연계"}
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: "ackSos" });
                    push("대응", "SOS 확인 처리 — 알림 상태 해제", "#8FA9CC");
                  }}
                  className="btn-press rounded-xl border border-white/40 px-4 py-2.5 text-[13px] font-medium"
                >
                  해제
                </button>
              </div>
              {/* REQ-04 — 서비스 경계 고지 (회의 확정) */}
              <div className="w-full border-t border-white/25 pt-2 text-[11px] opacity-80">
                기본 상품 보증 범위: 긴급신호 접수 + 119 연계까지 · 현장 도착 SLA 아님 · 이 가구는 야간
                출동(외주) 옵션 미가입
              </div>
            </section>
          )}

          {/* ── AI 자율 배차 (09 §3) — L4: 승인 없이는 실행되지 않는다 ── */}
          {assign === "pending" ? (
            <section
              className="card-navy mt-[18px] rounded-[14px] px-5 py-[18px] text-white"
              style={{
                background: NAVY,
                backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,0))",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-gold px-2 py-1 text-[10px] font-bold tracking-[.14em] text-navy">
                    AI 자율 배차 · L4
                  </span>
                  <span className="text-[14px] font-bold">신규 요청 3건의 배정안이 준비되었습니다</span>
                </div>
                <span className="text-[11px] text-white/60">승인 없이는 실행되지 않습니다 · 8.5 자율성 등급</span>
              </div>
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {/* why(근거) 없는 배정안은 렌더 금지 — 블랙박스 금지 (규제 요건) */}
                {AI_ASSIGN.filter((a) => a.why).map((a) => (
                  <div key={a.client} className="rounded-xl border border-white/12 bg-white/[.05] p-3.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] font-bold">{a.client}</span>
                      <span className="font-num text-[10px] text-white/60">{a.time}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/70">{a.job}</div>
                    <div className="mt-1.5 text-[12px] font-bold text-gold-soft">→ {a.staff}</div>
                    <div className="mt-0.5 font-num text-[11px] font-bold text-[#8FE3C0]">적합 {a.score}%</div>
                    <div className="mt-2 border-t border-white/10 pt-1.5 text-[10px] leading-[1.55] text-white/55">
                      {a.why}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    dispatch({ type: "opsPatch", patch: { assign: "done" } });
                    push("배차", "AI 배정안 3건 일괄 승인 · 평균 적합도 94%", "#B08D57");
                  }}
                  className="btn-press btn-dark rounded-xl bg-gold px-4 py-2.5 text-[13px] font-bold text-navy"
                >
                  3건 일괄 승인
                </button>
                {/* 개별 검토는 일괄 승인과 대등한 선택지 — 없으면 실질 L5 */}
                <button
                  onClick={() => push("배차", "AI 배정안 개별 검토 모드 진입", "#8FA9CC")}
                  className="btn-press rounded-xl border border-white/25 bg-white/[.06] px-4 py-2.5 text-[13px] font-medium text-white/85"
                >
                  개별 검토
                </button>
              </div>
            </section>
          ) : (
            <section
              className="mt-[18px] flex flex-wrap items-center justify-between gap-2 rounded-[14px] border px-5 py-3.5"
              style={{ borderColor: "rgba(30,122,90,.28)", background: "linear-gradient(180deg, #F1FAF6, #E6F4EE)" }}
            >
              <div>
                <span className="text-[11px] font-bold text-green">배정 승인 완료</span>
                <div className="mt-0.5 text-[13px] text-[#2B4A3E]">
                  3건이 각 컨시어지 앱으로 전송되었습니다 · 평균 적합도 94% · 수동 개입 0건
                </div>
              </div>
              <span className="text-[11px] text-[#4A6B5E]">승인 이력은 감사 로그에 기록됩니다</span>
            </section>
          )}

          {/* ── 관제 맵 (09 §4) ── */}
          <section className="card-navy mt-[18px] rounded-[14px] p-[18px]" style={{ background: NAVY }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold text-white">관제 맵</h2>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-white/70">
                {[
                  ["#4ADE80", "이동·수행중"],
                  ["#8FA9CC", "대기"],
                  ["#FF6B5B", "SOS"],
                  ["#B08D57", "제휴 병원"],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className="h-[7px] w-[7px] rounded-full" style={{ background: c }} />
                    {l}
                  </span>
                ))}
                <span className="font-medium text-white/45">OpenStreetMap 기반 실측 좌표</span>
              </div>
            </div>
            <ControlMap sos={sos} />
          </section>

          {/* ── 탭 3개 — 아웃라인 버튼형, 언마운트 전환 (09 §5) ── */}
          <div className="mt-[18px] flex flex-wrap gap-2">
            {[
              ["live", "실시간 운영"],
              ["pair", "페어 편성 · 예외"],
              ["plan", "계획 · 인력"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="btn-press rounded-[10px] border px-[18px] py-2.5 text-[12px] font-bold"
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

          {/* ════ live 탭 — 배차 그리드 + 실시간 접수 티커 ════ */}
          {tab === "live" && (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
              <Panel className="min-w-0">
                <PanelHead title="배차 그리드" right={<span className="font-num text-[11px]">08:00 — 20:00 KST</span>} />
                {/* 시간축 */}
                <div className="mt-3 flex pl-[108px]">
                  {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((h) => (
                    <span key={h} className="flex-1 font-num text-[10px] font-semibold text-muted">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="mt-1 space-y-1">
                  {rows.map((r) => (
                    <div key={r.name} className="flex border-t border-navy/[.06] py-1 first:border-t-0">
                      <div className="w-[108px] shrink-0 pr-2 pt-2">
                        <div className="text-[12px] font-bold text-navy">{r.name}</div>
                        <div className="text-[10px] text-muted">{r.meta}</div>
                      </div>
                      <div className="relative min-h-[56px] flex-1">
                        {nowPct > 0 && nowPct < 100 && (
                          <span
                            className="absolute inset-y-0 z-[1] w-[2px]"
                            style={{
                              left: `${nowPct}%`,
                              background: "rgba(192,57,43,.55)",
                              boxShadow: "0 0 0 1px rgba(255,255,255,.5)",
                            }}
                          />
                        )}
                        {r.bars.map((b) => (
                          <div
                            key={b.id}
                            className="absolute bottom-[9px] top-[9px] overflow-hidden rounded-lg px-2 py-1"
                            style={{ left: `${b.left}%`, width: `${b.width}%`, background: b.bg, color: b.fg }}
                          >
                            <div className="truncate whitespace-nowrap text-[11px] font-bold">{b.label}</div>
                            <div className="truncate whitespace-nowrap text-[10px] opacity-85">{b.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* 범례 + 현재 시각 */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-navy/[.08] pt-2.5 text-[10px] font-bold text-muted">
                  {[
                    ["수행중", KIND_STYLE.active.bg],
                    ["예정", KIND_STYLE.planned.bg],
                    ["완료", KIND_STYLE.done.bg],
                    ["SOS 급파", KIND_STYLE.sos.bg],
                  ].map(([l, c]) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className="h-[8px] w-[14px] rounded-[3px] border border-navy/10" style={{ background: c }} />
                      {l}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <span className="h-[10px] w-[2px]" style={{ background: "rgba(192,57,43,.55)" }} />
                    현재 시각 {hhmm}
                  </span>
                </div>
              </Panel>

              <Panel className="min-w-0">
                <PanelHead title="실시간 접수 티커" right="전 화면 액션 → 감사 로그 실시간 뷰" />
                <div className="mt-3 max-h-[230px] space-y-[9px] overflow-y-auto pr-1">
                  {state.ticker.map((e) => (
                    <div key={e.id} className="flex animate-tickIn items-start gap-2">
                      <span className="w-[34px] shrink-0 pt-0.5 font-num text-[10px] font-semibold text-muted">
                        {new Date(e.at).toTimeString().slice(0, 5)}
                      </span>
                      <span
                        className="shrink-0 rounded-[20px] px-2 py-0.5 text-[10px] font-bold text-navy"
                        style={{ background: `${e.color}33` }}
                      >
                        {e.kind}
                      </span>
                      <span className="flex-1 text-[12px] leading-[1.5] text-ink">{e.text}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {/* ════ pair 탭 — 페어 편성 · 예외 ════ */}
          {tab === "pair" && (
            <div className="mt-4 space-y-4">
              {/* 페어 KPI (09 §8.1) */}
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))" }}>
                {pairKpis.map((k) => (
                  <Panel key={k.k} className="!p-4">
                    <div className="text-[11px] font-bold text-muted">{k.k}</div>
                    <div className="mt-1 font-num text-[24px] font-bold" style={{ color: k.color }}>
                      {k.v}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">{k.note}</div>
                  </Panel>
                ))}
              </div>

              {/* 페어 편성 보드 (09 §8.2) */}
              <Panel>
                <PanelHead title="오늘 페어 편성 보드" right="주 동행 + 부 동행 · 짝이 비면 배차 확정 불가" />
                <div className="mt-3 overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="flex gap-2 border-b border-navy/10 pb-2 text-[10px] font-bold tracking-[.06em] text-muted">
                      <span style={{ flex: ".5" }}>시각</span>
                      <span style={{ flex: "1.5" }}>고객 · 업무</span>
                      <span style={{ flex: ".8" }}>주 동행</span>
                      <span style={{ flex: ".8" }}>부 동행</span>
                      <span style={{ flex: "1.6" }}>편성 근거 · 규칙 체크</span>
                      <span style={{ flex: ".7" }}>상태</span>
                    </div>
                    {jobs.map((j) => (
                      <div key={j.id} className="flex items-center gap-2 border-b border-navy/[.06] py-2.5 text-[11px]">
                        <span className="font-num font-bold text-navy" style={{ flex: ".5" }}>
                          {j.t}
                        </span>
                        <span style={{ flex: "1.5" }}>
                          <span className="font-bold text-navy">{j.client}</span>
                          <span className="block text-[10px] text-muted">{j.job}</span>
                        </span>
                        <span className="font-bold text-ink" style={{ flex: ".8" }}>
                          {j.lead}
                        </span>
                        <span className="font-bold" style={{ flex: ".8", color: j.sup ? "#40413F" : "#C0392B" }}>
                          {j.sup || "—"}
                        </span>
                        <span className="text-[10px] leading-[1.5] text-muted" style={{ flex: "1.6" }}>
                          {j.note}
                        </span>
                        <span style={{ flex: ".7" }}>
                          <span
                            className="inline-block rounded-full px-2 py-1 text-[10px] font-bold"
                            style={{ color: STATE_PILL[j.state].fg, background: STATE_PILL[j.state].bg }}
                          >
                            {j.state}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))" }}>
                {/* 짝 미매칭 (09 §8.3) — 1인 배차 금지의 실행 UI */}
                <section
                  className="rounded-[14px] border p-[18px]"
                  style={{
                    background: "linear-gradient(180deg, #FDF2F0, #F9E8E5)",
                    borderColor: "rgba(192,57,43,.24)",
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold tracking-[.14em] text-[#8A1C1C]">
                      짝 미매칭 · 예약 확정 보류
                    </span>
                    <span className="font-num text-[11px] font-bold text-[#8A1C1C]">{UNMATCHED.time}</span>
                  </div>
                  <div className="mt-2 text-[15px] font-bold text-[#7A241C]">{UNMATCHED.client}</div>
                  <div className="mt-1 text-[11px] leading-[1.6] text-[#7A241C]">{UNMATCHED.reason}</div>
                  <div className="mt-3 space-y-2">
                    {/* feasible:false(3안)도 숨기지 않고 불가 이유와 함께 표시 */}
                    {UNMATCHED.options.map((o) => (
                      <div key={o.label} className="rounded-xl border border-navy/10 bg-white/70 px-3 py-2.5">
                        <div className="text-[12px] font-bold text-navy">{o.label}</div>
                        <div className="mt-0.5 text-[11px] font-bold opacity-85" style={{ color: o.fg }}>
                          {o.cost}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (unmatchFixed) return; // 1회성
                      dispatch({ type: "opsPatch", patch: { unmatchFixed: true } });
                      push("배차", "한복자 님 투석 동행 페어 편성 완료 · 서다인 재배치", "#8FA9CC");
                    }}
                    className="btn-press btn-dark mt-3 w-full rounded-xl px-4 py-3 text-[12px] font-bold text-white"
                    style={{ background: unmatchFixed ? "#5C5A54" : NAVY }}
                  >
                    {unmatchFixed ? "서다인 재배치 승인 · 18:10 건 재편성 완료" : "송파 권역 서다인 재배치 승인"}
                  </button>
                  <p className="mt-2.5 text-[10px] leading-[1.6] text-[#7A241C]">
                    짝을 못 찾았다고 1인 배차로 내리지 않습니다. 재배치 · 시니어 투입 · 일정 조정
                    중에서만 고릅니다.
                  </p>
                </section>

                {/* SLA 관제 (09 §8.4) — 네이비 · 글래스 바 */}
                <section className="card-navy rounded-[14px] p-[18px]" style={{ background: NAVY }}>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-[13px] font-bold text-white">SLA 관제</h2>
                    <span className="text-[11px] text-white/50">목표 대비 오늘</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {SLA_ROWS.map((s) => (
                      <div key={s.k}>
                        <div className="flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="font-medium text-white">{s.k}</span>
                          <span className="shrink-0">
                            <span className="text-[10px] text-white/45">목표 {s.target} · </span>
                            <span className="font-num font-bold" style={{ color: s.color === "#C0392B" ? "#FF8A80" : s.color === "#8A5D12" ? "#F0D9A8" : "#8FE3C0" }}>
                              {s.now}
                            </span>
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-[6px] overflow-hidden rounded-full"
                          style={{
                            background: "rgba(255,255,255,.07)",
                            backdropFilter: "blur(6px)",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.14)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.w}%`,
                              background: s.color,
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(0,0,0,.16), inset 0 0 0 .5px rgba(255,255,255,.2)",
                              maskImage: "linear-gradient(to right, rgba(0,0,0,.7), rgba(0,0,0,1))",
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] text-white/45">{s.note}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 동선 체인 (09 §8.5) */}
                <Panel>
                  <PanelHead title="동선 체인 · 이동 여유" right="연속 배차 사이 실제 이동 시간" />
                  <div className="mt-3 space-y-4">
                    {ROUTE_CHAIN.map((r) => (
                      <div key={r.staff}>
                        <div className="text-[12px] font-bold text-navy">{r.staff}</div>
                        <div className="mt-2 flex flex-wrap items-start">
                          {r.legs.map((leg, i) => (
                            <span key={leg} className="flex items-start">
                              {i > 0 && <span className="mx-1 mt-[4px] h-[2px] w-[18px] bg-navy/[.16]" />}
                              <span className="flex flex-col items-start">
                                <span className="h-[9px] w-[9px] rounded-full bg-[#3B5C8A]" />
                                <span className="mt-1 whitespace-nowrap text-[10px] text-ink">{leg}</span>
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-1.5 text-[11px] font-bold" style={{ color: r.color }}>
                          {r.gap}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.6] text-muted">
                    이동 여유가 실제 소요보다 짧으면 다음 건이 자동으로 지연 위험으로 표시되고, 픽업
                    정시율 SLA에 선반영됩니다.
                  </p>
                </Panel>

                {/* 피로도 (09 §8.6) — 표시가 아니라 게이트 */}
                <Panel>
                  <PanelHead title="근무 시간 · 피로도 상한" right="일 10시간 · 주 52시간 상한" />
                  <div className="mt-3 space-y-3">
                    {FATIGUE.map((f) => (
                      <div key={f.name} className="flex items-center gap-3">
                        <div className="w-[104px] shrink-0">
                          <div className="text-[12px] font-bold text-navy">{f.name}</div>
                          <div className="text-[10px] text-muted">{f.jobs}</div>
                        </div>
                        <div className="flex-1">
                          <div className="h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
                            <div className="h-full rounded-full" style={{ width: `${f.w}%`, background: f.color }} />
                          </div>
                        </div>
                        <span className="w-[40px] shrink-0 font-num text-[12px] font-bold text-navy">{f.hours}</span>
                        <span className="w-[54px] shrink-0 text-right text-[10px] font-bold" style={{ color: f.color }}>
                          {f.state}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.7] text-muted">
                    이수민은 상한 임박으로 오늘 배차 후보에서 자동 제외됐고 7/29 투석 건 AI 제안에서도
                    빠졌습니다 — 피곤한 동행자가 어르신을 부축하는 것이 가장 흔한 사고 원인입니다.
                  </p>
                </Panel>

                {/* 리스크 워치 (09 §8.7) — 환경 × 이력 교차 */}
                <Panel>
                  <PanelHead title="오늘 리스크 워치" right="환경 × 건강 이력 교차" />
                  <div className="mt-3 space-y-3">
                    {RISK_WATCH.map((w) => (
                      <div key={w.name} className="flex items-start gap-2.5 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <span
                          className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ color: RISK_LEVEL[w.level].fg, background: RISK_LEVEL[w.level].bg }}
                        >
                          {w.level}
                        </span>
                        <div>
                          <div className="text-[12px] font-bold text-navy">{w.name}</div>
                          <div className="text-[10px] text-muted">{w.why}</div>
                          <div className="mt-0.5 text-[11px] font-semibold text-navy">→ {w.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ════ plan 탭 — 계획 · 인력 ════ */}
          {tab === "plan" && (
            <div className="mt-4 space-y-4">
              {/* 컨디션 예보 캘린더 (09 §9.1) */}
              <Panel>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[13px] font-bold text-navy">
                      {range === "3" ? "3일 컨디션 예보 캘린더" : "주간 컨디션 예보 캘린더"}
                    </h2>
                    <div className="flex gap-1">
                      {["3", "7"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className="rounded-lg px-[11px] py-[5px] text-[10px] font-bold"
                          style={
                            range === r
                              ? { background: NAVY, color: "#fff" }
                              : { background: "rgba(10,31,60,.06)", color: "#5C5A54" }
                          }
                        >
                          {r}일
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted">F5-6 · 케이웨더</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {forecast.map((d) => (
                    <div
                      key={d.day}
                      className="min-w-[96px] flex-1 rounded-xl border px-3 py-2.5"
                      style={{ background: FORECAST_TONE[d.tone].bg, borderColor: FORECAST_TONE[d.tone].border }}
                    >
                      <div className="text-[10px] font-bold text-muted">{d.day}</div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="font-num text-[18px] font-bold text-navy">{d.score}</span>
                        <span className="text-[10px] font-bold" style={{ color: FORECAST_TONE[d.tone].fg }}>
                          {d.grade}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted">{d.note}</div>
                      <div className="font-num text-[10px] text-muted">{d.jobs}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[10px] leading-[1.6] text-muted">
                  31일(금) 폭염 특보 예보 — 배차 6건 중 3건에 일정 조정 권고를 선제 발송할 수 있습니다
                  (F8-4)
                </p>
              </Panel>

              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                {/* 감점 내역 (09 §9.2) — 룰 엔진 L0 */}
                <Panel>
                  <PanelHead title="감점 내역 · 김순자 (78) 도착 구간" right="100점 감점식 · 룰 엔진(L0) · 커버리지 100%" />
                  <div className="mt-3 space-y-2">
                    {SCORE_FACTORS.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 text-[11px]">
                        <span className="w-[72px] shrink-0 font-bold text-navy">{f.name}</span>
                        <span className="w-[48px] shrink-0 font-num text-[10px] text-muted">가중 {f.weight}</span>
                        <span className="flex-1 text-muted">{f.basis}</span>
                        <span className="w-[42px] shrink-0 text-right font-num text-[12px] font-bold" style={{ color: f.color }}>
                          {f.delta}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between border-t border-navy/[.18] pt-2">
                      <span className="text-[11px] font-bold text-navy">최종 점수</span>
                      <span className="font-num text-[14px] font-bold text-danger">52 · 주의</span>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[10px] leading-[1.7] text-muted">
                    측정값이 없는 지표는 0점으로 세지 않고 계산에서 제외한 뒤 커버리지로 표기합니다 —
                    결측을 감점으로 위장하지 않습니다
                  </p>
                </Panel>

                {/* 오늘 배차 브리핑 (09 §9.3) */}
                <Panel>
                  <PanelHead title="오늘 배차 브리핑 · 외출 컨디션" right="출발지·도착지 2구간 · 케이웨더" />
                  <div className="mt-3 space-y-3">
                    {BRIEFINGS.map((b) => (
                      <div key={b.name} className="flex gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                        <span className="w-[40px] shrink-0 font-num text-[18px] font-bold" style={{ color: b.color }}>
                          {b.score}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-navy">
                            {b.name}{" "}
                            <span className="text-[10px] font-bold" style={{ color: b.color }}>
                              {b.grade}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted">{b.detail}</div>
                          <div className="text-[10px] text-muted">{b.legs}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 일정 조정 권고는 자동 실행되지 않는다 — 관제사 판단 (자동 취소 금지) */}
                  <button
                    onClick={() => {
                      if (briefed) return;
                      setBriefed(true);
                      push("브리핑", "외출 컨디션 브리핑 3건 발송 · 가족·컨시어지 앱", "#8FA9CC");
                    }}
                    className="btn-press mt-3 w-full rounded-xl border px-4 py-2.5 text-[12px] font-bold"
                    style={
                      briefed
                        ? { borderColor: "rgba(10,31,60,.14)", color: "#5C5A54" }
                        : { borderColor: NAVY, color: NAVY }
                    }
                  >
                    {briefed ? "브리핑 3건 발송 완료" : "브리핑 일괄 발송 (3건)"}
                  </button>
                </Panel>

                {/* 컨시어지 현황 (09 §9.4) — 평점만. 매출 컬럼 금지 */}
                <Panel>
                  <PanelHead title="컨시어지 현황" right="평점 출처: 가족 만족도" />
                  <div className="mt-3 space-y-2.5">
                    {STAFF_STATUS.map((s) => (
                      <div key={s.name} className="flex items-center gap-2.5 text-[11px]">
                        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: s.color }} />
                        <span className="flex-1 text-[12px] font-medium text-navy">{s.name}</span>
                        <span className="w-[84px] shrink-0 text-muted">{s.area}</span>
                        <span className="w-[32px] shrink-0 font-num text-[12px] font-bold text-navy">{s.jobs}</span>
                        <span className="w-[34px] shrink-0 text-right font-num text-[11px] text-[#7A5C28]">
                          {s.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
