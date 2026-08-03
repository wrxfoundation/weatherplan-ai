import Head from "next/head";
import { useState } from "react";
import { useAppState } from "../lib/state";
import {
  CP_KPIS,
  CP_LOOP,
  CP_ATTRS,
  CP_CALLS,
  CP_GUARD,
  CP_BRIEF,
  CP_TIMELINE,
  CP_TENURE,
  CP_GAPS,
  CP_FEATURES,
  CP_GLOSSARY,
  ELDER_TAGS,
  TAG_TONE,
} from "../lib/mock";

// 확장 / F7 진화형 케어 프로필 · F11-1 AI 안부콜.
// 원칙: 프로필은 특정 AI에 종속되지 않게 저장(모델이 바뀌어도 남는 자산) ·
// 대화·목소리에서 신호를 관측만 하고 진단하지 않는다 (9.4) ·
// 위기 신호 시 상담 창구 안내와 가족·관제 동시 전파만 수행.

const NAVY = "#0A1F3C";
const CONF_STYLE = {
  높음: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  보통: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  낮음: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};
const CALL_STYLE = {
  안정: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  관찰: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
};
const GAP_STYLE = {
  높음: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  중간: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  낮음: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};
const FEAT_STYLE = {
  구현: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  부분: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  "Phase 2": { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

function Panel({ children, className = "" }) {
  return <section className={`card-glass rounded-[14px] p-[18px] ${className}`}>{children}</section>;
}

function PanelHead({ title, right }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[15px] font-bold text-navy">{title}</h2>
      {right && <div className="text-[12px] text-muted">{right}</div>}
    </div>
  );
}

export default function CareProfile() {
  const { dispatch } = useAppState();
  const [briefSent, setBriefSent] = useState(false);
  const [crisisRun, setCrisisRun] = useState(false);

  const push = (kind, text, color) => dispatch({ type: "pushEvent", payload: { kind, text, color } });

  return (
    <>
      <Head>
        <title>케어 프로필 — K-CARE</title>
      </Head>
      {/* 랜드마크 — 이 화면은 헤더도 본문 안에 있어 래퍼 전체가 본문이다 */}
      <div role="main" className="console-bg min-h-screen px-4 pb-10 pt-7 text-ink sm:px-8">
        <div className="mx-auto max-w-[1240px] space-y-4">
          {/* 콘텐츠 제목 영역 — 페이지 배너가 아니다.
              <header> 로 두면 banner 랜드마크로 잡히는데, 이 파일은 role="main"
              (속성)이라 <main> 요소처럼 배너 매핑을 막아 주지 못한다. 그래서
              본문 안에 배너가 중첩된 것으로 보고된다 (axe: landmark-banner-is-top-level). */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-[.16em] text-muted">확장 / F7 진화형 케어 프로필 · F11-1 AI 안부콜</span>
              <a href="/" className="tap text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">데모 홈</a>
              <a href="/dispatch?menu=elder" className="text-[12px] font-bold text-muted/60 underline-offset-2 hover:underline">관제 · 어르신</a>
            </div>
            <h1 className="mt-0.5 text-[29px] font-bold tracking-[-.01em] text-navy">쓸수록 깊어지는 프로필</h1>
            <p className="mt-1.5 max-w-[84ch] text-[15px] leading-[1.75] text-muted">
              모델이 바뀌어도 남는 자산 — 프로필은 특정 AI에 종속되지 않게 저장합니다.
            </p>
          </div>

          {/* KPI */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {CP_KPIS.map((k) => (
              <Panel key={k.k} className="!p-4">
                <div className="text-[11px] font-bold text-muted">{k.k}</div>
                <div className="mt-1 font-num text-[25px] font-bold text-navy">{k.v}</div>
                <div className="mt-0.5 text-[11px] text-muted">{k.note}</div>
              </Panel>
            ))}
          </div>

          {/* 5단계 루프 */}
          <Panel>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {CP_LOOP.map(([n, k, text]) => (
                <div key={n} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-gold font-num text-[11px] font-bold text-navy">{n}</span>
                    <span className="text-[13px] font-bold text-navy">{k}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">{text}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            {/* 케어 프로필 테이블 */}
            <Panel className="min-w-0">
              <PanelHead title="김순자 (78) 케어 프로필" right="자동 병합 · 출처 표기" />
              {/* 기본 속성 칩 — 성별 · 장애 정도 · 보훈 · 장기요양 */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  [`${ELDER_TAGS.김순자.sex} · ${ELDER_TAGS.김순자.age}세`, TAG_TONE.sex],
                  [ELDER_TAGS.김순자.disability, TAG_TONE.disability],
                  [ELDER_TAGS.김순자.veteran, TAG_TONE.veteran],
                  [ELDER_TAGS.김순자.ltc, TAG_TONE.ltc],
                ]
                  .filter(([v]) => v)
                  .map(([v, tone]) => (
                    <span key={v} className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ color: tone.fg, background: tone.bg }}>
                      {v}
                    </span>
                  ))}
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-[12px]">
                  <thead>
                    <tr className="whitespace-nowrap border-b-2 border-navy/20 text-[11px] font-bold text-muted">
                      <th className="py-2 pr-3">속성</th>
                      <th className="py-2 pr-3">값</th>
                      <th className="py-2">수집 출처 · 신뢰도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CP_ATTRS.map((a) => (
                      <tr key={a.k} className="border-b border-navy/[.06] align-top">
                        <td className="whitespace-nowrap py-2 pr-3 font-bold text-navy">{a.k}</td>
                        <td className="py-2 pr-3 text-ink">{a.v}</td>
                        <td className="py-2">
                          <div className="text-[11px] leading-[1.5] text-muted">{a.src}</div>
                          <span className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: CONF_STYLE[a.conf].fg, background: CONF_STYLE[a.conf].bg }}>{a.conf}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                대화·리포트·웨어러블에서 자동 추출해 병합합니다 (F7-1) · 낮은 신뢰도 항목은 다음 상담에서 자연스럽게 재확인합니다.
              </p>
            </Panel>

            {/* AI 안부콜 */}
            <Panel className="min-w-0">
              <PanelHead title={<><span className="mr-2 rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">AI</span>AI 안부콜 <span className="ml-1 font-num text-[11px] font-medium text-muted">F11-1</span></>} right="주 3회 · 화·목·토 10:00" />
              <div className="mt-3 space-y-2">
                {CP_CALLS.map((c) => (
                  <div key={c.d} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-num text-[12px] font-bold text-navy">{c.d}</span>
                      <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: CALL_STYLE[c.state].fg, background: CALL_STYLE[c.state].bg }}>{c.state}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.6] text-ink">{c.text}</p>
                    <p className="mt-0.5 font-num text-[11px] text-muted">{c.meta}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                대화 뉘앙스·단어·목소리 톤에서 우울·불안·인지 이상 신호를 관측합니다 — 진단은 하지 않습니다.
              </p>

              {/* 위기 감지 가드레일 */}
              <div className={`mt-3 rounded-xl border px-4 py-3 ${crisisRun ? "border-danger/40 bg-danger/[.07]" : "border-navy/[.08] bg-white/60"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-navy">위기 감지 가드레일</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${crisisRun ? "bg-danger text-white" : "bg-navy/[.06] text-muted"}`}>
                    {crisisRun ? "작동" : "대기"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-[1.6] text-muted">
                  자해 우려·극단 표현 등 고위험 신호가 감지되면 아래 3단계가 동시에 작동합니다. {crisisRun ? "시연 실행 중입니다." : "지금은 관찰 단계입니다."}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {CP_GUARD.map((g, i) => (
                    <li key={g} className="flex items-start gap-2 text-[12px] leading-[1.55]">
                      <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-num text-[10px] font-bold" style={crisisRun ? { background: "#C0392B", color: "#fff" } : { background: "rgba(10,31,60,.08)", color: NAVY }}>{i + 1}</span>
                      <span className="text-ink">{g}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-bold text-muted">{crisisRun ? "작동" : "대기"}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => {
                    if (crisisRun) return;
                    setCrisisRun(true);
                    push("긴급", "위기 프로토콜 시연 — 109 안내 · 가족 배너 · 관제 티커 동시 점등", "#FF8D7E");
                  }}
                  disabled={crisisRun}
                  className="btn-press mt-2.5 rounded-[10px] border border-danger/40 px-3.5 py-2 text-[12px] font-bold text-danger disabled:opacity-50"
                >
                  {crisisRun ? "위기 프로토콜 실행됨 (시연)" : "위기 프로토콜 실행 (시연)"}
                </button>
                <p className="mt-2 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.6] text-muted">
                  위기 신호 시 상담 창구 안내와 가족·관제 동시 전파만 수행합니다 · 진단·처방·치료 방침 판단은 차단 (9.4)
                </p>
              </div>
            </Panel>

            {/* 동행 전 5분 브리프 */}
            <Panel className="min-w-0">
              <PanelHead title="동행 전 5분 브리프" right="2인 모두에게 발송" />
              <p className="mt-2 font-num text-[12px] font-bold text-navy">{CP_BRIEF.head}</p>
              <p className="mt-1.5 text-[12px] leading-[1.7] text-muted">{CP_BRIEF.why}</p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-danger/20 bg-danger/[.04] p-3">
                  <div className="text-[12px] font-bold text-danger">하지 마세요</div>
                  <div className="mt-2 space-y-2">
                    {CP_BRIEF.dont.map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[12px] font-bold text-navy">{k}</div>
                        <div className="text-[11px] leading-[1.6] text-muted">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-green/25 bg-green/[.05] p-3">
                  <div className="text-[12px] font-bold text-green">꼭 하세요</div>
                  <div className="mt-2 space-y-2">
                    {CP_BRIEF.do.map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[12px] font-bold text-navy">{k}</div>
                        <div className="text-[11px] leading-[1.6] text-muted">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 rounded-xl bg-navy/[.04] px-3.5 py-2.5">
                <div className="text-[11px] font-bold text-gold">지난 방문 이후 바뀐 것</div>
                <p className="mt-1 text-[12px] leading-[1.65] text-ink">{CP_BRIEF.delta}</p>
              </div>
              <button
                onClick={() => {
                  if (briefSent) return;
                  setBriefSent(true);
                  push("발송", "동행 전 5분 브리프 발송 — 김순자 (78) · 박지현 + 서다인 (2인 모두)", "#8FA9CC");
                }}
                disabled={briefSent}
                className="btn-press mt-3 w-full rounded-[10px] py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
                style={{ background: NAVY }}
              >
                {briefSent ? "브리프 발송됨 ✓ (감사 로그 기록)" : "박지현 · 서다인에게 브리프 발송"}
              </button>
            </Panel>

            {/* 변화 타임라인 */}
            <Panel className="min-w-0">
              <PanelHead title="프로필 변화 타임라인 · 12주" right="스냅샷이 아니라 변화가 신호입니다" />
              <div className="mt-3 space-y-2.5">
                {CP_TIMELINE.map((r) => (
                  <div key={r.d + r.k} className="flex gap-3 border-t border-navy/[.06] pt-2.5 first:border-t-0 first:pt-0">
                    <span className="w-[38px] shrink-0 font-num text-[12px] font-bold text-navy">{r.d}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-navy">{r.k}</div>
                      <div className="text-[12px] leading-[1.6] text-ink">{r.v}</div>
                      <div className="mt-0.5 text-[11px] text-muted">{r.src}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                보행 보조 필요 → 휠체어 필요로 3개월 만에 바뀌었습니다. 이런 방향성이 등급 재신청·복지용구 급여 시점을 정하는 근거가 됩니다.
              </p>
            </Panel>

            {/* 가입 개월별 진화 — 쓸수록 알아가는 것이 늘어난다 */}
            <Panel className="min-w-0">
              <PanelHead title="쓸수록 알아 갑니다" right="가입 개월에 따라 할 수 있는 일이 달라집니다" />
              <p className="mt-2 text-[12px] leading-[1.75] text-muted">
                프로필은 처음부터 완성되지 않습니다. 같은 서비스라도 1개월째와 14개월째에 할 수 있는 일이
                다릅니다 — 아래는 이 가구에서 실제로 늘어난 것입니다.
              </p>
              <div className="mt-3 space-y-2">
                {CP_TENURE.map((t) => {
                  const now = t.state === "now";
                  const next = t.state === "next";
                  return (
                    <div
                      key={t.m}
                      className="rounded-xl border px-3.5 py-3"
                      style={
                        now
                          ? { borderColor: "#B08D57", background: "rgba(176,141,87,.08)" }
                          : { borderColor: "rgba(10,31,60,.08)", background: "rgba(255,255,255,.6)", opacity: next ? 0.7 : 1 }
                      }
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-bold" style={{ color: now ? "#B08D57" : "#0A1F3C" }}>
                          {t.m}
                        </span>
                        <span className="ml-auto shrink-0 font-num text-[11px] font-bold text-muted">{t.attrs}</span>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {t.can.map((c) => (
                          <li key={c} className="flex gap-1.5 text-[12px] leading-[1.6] text-ink">
                            <span className="shrink-0 text-green">✓</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                      {t.cant && (
                        <p className="mt-1.5 border-t border-navy/[.06] pt-1.5 text-[11px] leading-[1.6] text-muted">
                          아직 못 하는 것 — {t.cant}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                이 가구의 기록은 이 가구에만 쓰입니다. 다른 가구로 넘어가는 것은 동의받은 집계 통계뿐이며,
                모델을 바꿔도 프로필은 그대로 남습니다 (원칙 9.4).
              </p>
            </Panel>

            {/* 결측 · 재확인 큐 */}
            <Panel className="min-w-0">
              <PanelHead title="결측 · 재확인 큐" right="물어보지 않고 대화에서 채웁니다" />
              <div className="mt-3 space-y-2">
                {CP_GAPS.map((g) => (
                  <div key={g.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: GAP_STYLE[g.level].fg, background: GAP_STYLE[g.level].bg }}>{g.level}</span>
                      <span className="text-[13px] font-bold text-navy">{g.k}</span>
                      <span className="ml-auto shrink-0 font-num text-[11px] font-bold text-amber">{g.when}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.6] text-muted">{g.why}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                설문지를 내밀지 않습니다. 안부콜·동행 대화에서 자연스럽게 확인하고, 확인되지 않은 항목은 ‘모름’으로 두지 ‘해당 없음’으로 바꾸지 않습니다.
              </p>
            </Panel>

            {/* F7 기능 상태 */}
            <Panel className="min-w-0">
              <PanelHead title="F7 기능 커버리지" right="구현 상태" />
              <div className="mt-3 space-y-2">
                {CP_FEATURES.map((f) => (
                  <div key={f.id} className="flex items-start gap-2.5 rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-2.5">
                    <span className="mt-0.5 shrink-0 font-num text-[11px] font-bold text-muted">{f.id}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-navy">{f.k}</div>
                      <div className="text-[11px] leading-[1.6] text-muted">{f.note}</div>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: FEAT_STYLE[f.state].fg, background: FEAT_STYLE[f.state].bg }}>{f.state}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* 쉬운 말 사전 */}
          <Panel>
            <PanelHead title="쉬운 말 사전" right="리포트·안내문에 이 용어가 나오면 자동으로 쉬운 말이 붙습니다" />
            <div className="mt-3 grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              {CP_GLOSSARY.map((g) => (
                <div key={g.k} className="rounded-xl border border-navy/[.06] bg-white/60 px-3.5 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-navy">{g.k}</span>
                    <span className="font-num text-[10px] text-muted">{g.en}</span>
                    <span className="ml-auto rounded-full bg-navy/[.06] px-2 py-0.5 text-[10px] font-bold text-navy">{g.cat}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-ink">{g.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
              공개 제도 설명만 담고 특정 진단·처방 해석은 넣지 않습니다 — 의료 판단은 AI도 사전도 하지 않습니다 (9.4).
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
