import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { PendingTag } from "../components/ui";
import {
  AI_ASSIGN,
  DISASTER_FEED,
  DISPATCH_KPIS,
  DISPATCH_SLA,
  MAP_MARKERS,
  RISK_WATCH,
  TODAY_ROUTE,
} from "../lib/mock";
import { useAppState } from "../lib/state";

// 배치관리자(관제) — 핸드오프 02 §4 + REQ-04(긴급 대응 범위).
// 밀도 높은 정보가 정당한 유일한 화면. 전폭형 · 다크.
// 서비스 경계: 기본 상품 보증 범위는 "접수 + 119 연계"까지. 급파는 주간·가용 시.
// AI 배차는 항상 사람 승인 — 자동 실행 경로 없음. 근거(why) 없는 배정안은 렌더 금지.

const LEVEL_BADGE = {
  높음: { fg: "#FF8A80", bg: "rgba(192,57,43,.18)" },
  중간: { fg: "#F0D9A8", bg: "rgba(138,93,18,.22)" },
};

function SectionTitle({ children, right }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-bold text-white">{children}</h2>
      {right}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-dark p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] ${className}`}
    >
      {children}
    </section>
  );
}

function LiveClock() {
  const [ts, setTs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const d = new Date(ts);
  const date = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const time = d.toTimeString().slice(0, 8);
  return (
    <div className="flex items-center gap-2 text-[13px] text-white/60">
      <span>{date}</span>
      <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
      <span className="font-num text-[15px] font-bold text-white">{time}</span>
      <span>KST</span>
      <span className="ml-1 h-[6px] w-[6px] animate-livePing rounded-full bg-green" />
      <span className="text-[11px] font-bold text-green">LIVE</span>
    </div>
  );
}

// SOS 경과 시각 — 관제만 본다. 가족 화면에는 절대 노출 금지 (사건 A 정보 비대칭)
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
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function DispatchConsole() {
  const { state, dispatch } = useAppState();
  const { sos } = state.demo;
  const { sosDispatched, sos119, fall, assign } = state.ops;
  const elapsed = useElapsed(sos);

  return (
    <>
      <Head>
        <title>배치 관제 센터 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav px-4 pb-12 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1100px] space-y-4">
          {/* ── 헤더 ── */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold tracking-[.16em] text-white/50">
                  역할 04 / 배치 관제 센터
                </span>
                <a href="/" className="text-[11px] font-bold text-white/35 underline-offset-2 hover:underline">
                  데모 홈
                </a>
              </div>
              <h1 className="mt-1 text-[26px] font-bold text-white">강남지점 실시간 관제</h1>
              <div className="mt-1.5">
                <LiveClock />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DISPATCH_KPIS.map((k) => (
                <div
                  key={k.label}
                  className="min-w-[104px] rounded-xl border border-white/10 bg-dark px-4 py-[11px]"
                >
                  <div className="text-[10px] font-bold text-white/50">{k.label}</div>
                  <div className="font-num text-[20px] font-bold text-white">{k.value}</div>
                </div>
              ))}
            </div>
          </header>

          {/* ── SOS 긴급 배너 (어르신 앱 SOS와 연동) ── */}
          {sos && (
            <section className="animate-sosPulse rounded-2xl bg-danger p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-[.14em] opacity-85">
                    긴급 · SOS 수신
                  </div>
                  <div className="mt-1 text-[17px] font-bold">
                    김순자 (78) · 강남구 대치동 — 최근접 컨시어지 박지현 (1.2km)
                  </div>
                  <div className="mt-1 font-num text-[13px] font-bold opacity-90">
                    경과 {elapsed} · 목표 응답 60초 이내 · {sos119 ? "119 연계 완료" : "119 연계 대기"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => dispatch({ type: "opsPatch", patch: { sosDispatched: true } })}
                    disabled={sosDispatched}
                    className="btn-press rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-danger disabled:opacity-80"
                  >
                    {sosDispatched ? "급파 중 · 박지현 · 서다인" : "급파 지시 (주간 · 가용)"}
                  </button>
                  <button
                    onClick={() => dispatch({ type: "opsPatch", patch: { sos119: true } })}
                    disabled={sos119}
                    className="btn-press rounded-xl border border-white/60 px-4 py-3 text-[13px] font-bold disabled:opacity-70"
                  >
                    {sos119 ? "119 연계 기록됨" : "119 연계"}
                  </button>
                  <button
                    onClick={() => dispatch({ type: "ackSos" })}
                    className="btn-press rounded-xl border border-white/40 px-4 py-3 text-[13px] font-bold"
                  >
                    해제
                  </button>
                </div>
              </div>
              {/* REQ-04 서비스 경계 — 관제 내부 고지 */}
              <div className="mt-3 border-t border-white/25 pt-2 text-[11px] opacity-80">
                기본 상품 보증 범위: 긴급신호 접수 + 119 연계까지 · 현장 도착 SLA 아님 · 이 가구는
                야간 출동(외주) 옵션 미가입
              </div>
            </section>
          )}

          {/* ── 낙상 복합 배너 — 3조건 충족만 알림. 단독 충격은 로그만 ── */}
          {fall === "open" ? (
            <section className="rounded-2xl bg-danger p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
                    낙상 복합 3조건 충족
                  </span>
                  <div className="mt-2 text-[15px] font-bold">
                    이영호 (81) · 갤럭시 워치6 — 충격 3.4G 후 30초 무응답 · 자동 통화 실패
                  </div>
                  <div className="mt-1 text-[11px] opacity-80">
                    단독 충격 감지는 알림 미발송 · 관제 로그만 (오탐률 38.9%)
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: "opsPatch", patch: { fall: "handled" } })}
                  className="btn-press rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-danger"
                >
                  긴급 출동 지시 + 119 연계
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-green/30 bg-[rgba(30,122,90,.12)] p-4 text-[13px] font-bold text-green">
              낙상 대응 완료 — 이영호 (81) 출동 지시 · 119 연계 기록됨. 처리 이력은 감사 로그에
              보존됩니다.
            </section>
          )}

          {/* ── AI 자율 배차 — 항상 사람 승인. 자동 실행 경로 없음 ── */}
          {assign === "pending" ? (
            <Panel className="!bg-navy">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy">
                  AI 자율 배차 · L4
                </span>
                <span className="text-[12px] font-bold text-white/75">
                  승인 없이는 실행되지 않습니다 · 8.5 자율성 등급
                </span>
              </div>
              <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {AI_ASSIGN.filter((a) => a.why).map((a) => (
                  <div key={a.customer} className="rounded-xl border border-white/12 bg-white/[.04] p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-bold text-white">{a.customer}</span>
                      <span className="font-num text-[12px] font-bold text-white/60">{a.time}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-white/70">{a.task}</div>
                    <div className="mt-2 text-[13px] font-bold text-gold-soft">→ {a.to}</div>
                    <div className="mt-1 font-num text-[11px] font-bold text-green">적합 {a.fit}%</div>
                    <div className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-[1.6] text-white/55">
                      {a.why}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => dispatch({ type: "opsPatch", patch: { assign: "done" } })}
                  className="btn-press rounded-xl bg-gold px-5 py-3 text-[13px] font-bold text-navy"
                >
                  {AI_ASSIGN.length}건 일괄 승인
                </button>
                <button className="btn-press rounded-xl border border-white/25 px-5 py-3 text-[13px] font-bold text-white/80">
                  개별 검토
                </button>
              </div>
            </Panel>
          ) : (
            <section className="rounded-2xl border border-green/30 bg-[rgba(30,122,90,.12)] p-4">
              <div className="text-[13px] font-bold text-green">
                {AI_ASSIGN.length}건 배차 확정 — 담당 컨시어지에게 전달됐습니다.
              </div>
              <div className="mt-1 text-[11px] text-white/50">승인 이력은 감사 로그에 기록됩니다.</div>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── 배차 현황 ── */}
            <Panel>
              <SectionTitle>배차 현황</SectionTitle>
              <div className="mt-3 space-y-3">
                {TODAY_ROUTE.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <span className="w-[74px] shrink-0 font-num text-[12px] font-bold text-white/80">
                      {r.time}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-white">{r.customer}</div>
                      <div className="truncate text-[11px] text-white/55">{r.purpose}</div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={
                        r.approved
                          ? { color: "#4ADE80", background: "rgba(30,122,90,.2)" }
                          : { color: "#F0D9A8", background: "rgba(138,93,18,.22)" }
                      }
                    >
                      {r.approved ? "확정 · 2인 1조" : "승인 대기"}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ── SLA ── */}
            <Panel>
              <SectionTitle>SLA</SectionTitle>
              <div className="mt-3 space-y-3">
                {DISPATCH_SLA.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="font-bold text-white">{s.name}</span>
                      <span className="font-num text-white/70">
                        {s.current} <span className="text-white/40">/ 목표 {s.target}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-green" style={{ width: `${s.pct}%` }} />
                    </div>
                    <div className="mt-1 text-[10px] text-white/45">{s.note}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ── 위험 관찰 목록 ── */}
            <Panel>
              <SectionTitle>위험 관찰 목록</SectionTitle>
              <div className="mt-3 space-y-3">
                {RISK_WATCH.map((w) => (
                  <div key={w.who} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-white">{w.who}</span>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ color: LEVEL_BADGE[w.level].fg, background: LEVEL_BADGE[w.level].bg }}
                      >
                        위험도 {w.level}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-white/55">{w.why}</div>
                    <div className="mt-1 text-[12px] font-bold text-gold-soft">→ {w.action}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ── 재난 피드 — 원시 경보가 아니라 "이미 한 조치"로 해석 ── */}
            <Panel>
              <SectionTitle>강남구 브리핑</SectionTitle>
              <div className="mt-3 space-y-3">
                {DISASTER_FEED.map((f) => (
                  <div key={f.raw} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <div className="text-[10px] font-bold tracking-[.06em] text-white/40">{f.raw}</div>
                    <div className="mt-1 text-[13px] leading-[1.6] text-white">{f.done}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-white/8 pt-2 text-[10px] leading-[1.7] text-white/40">
                기상청 특보 API 연동 대기 — 현재 케이웨더 특보값 + 재난문자 대체 경로로 수신.
              </p>
            </Panel>
          </div>

          {/* ── 지도 (Leaflet 연동 대기 — 마커 정보만 목록으로) ── */}
          <Panel>
            <SectionTitle
              right={<PendingTag>Leaflet 지도 연동 대기</PendingTag>}
            >
              관제 지도 — 컨시어지 · 병원
            </SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-bold tracking-[.14em] text-white/45">컨시어지 페어</div>
                <div className="mt-2 space-y-2">
                  {MAP_MARKERS.concierges.map((c) => (
                    <div key={c.name} className="rounded-xl border border-white/10 bg-white/[.04] p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-bold text-white">{c.name}</span>
                        <span className="text-[10px] font-bold text-green">{c.status}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/55">{c.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[.14em] text-white/45">제휴 병원</div>
                <div className="mt-2 space-y-2">
                  {MAP_MARKERS.hospitals.map((h) => (
                    <div key={h.name} className="rounded-xl border border-white/10 bg-white/[.04] p-3">
                      <div className="text-[13px] font-bold text-white">{h.name}</div>
                      <div className="mt-1 text-[11px] text-white/55">{h.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
