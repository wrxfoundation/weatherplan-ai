import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, Badge, PendingTag, Avatar } from "../../components/ui";
import { AI_ASSISTANT_QA, CARE_TEAM, ELDER, EVENT_KINDS, GUARDIANS, NPS_REASONS, OUTING, VITALS, WEEKLY } from "../../lib/mock";

import { useAppState } from "../../lib/state";

// 가족 앱 홈 — 핸드오프 02 family 명세 + REQ-02(다음 일정 홈 노출)
// 정보 비대칭 규칙: 경과시간·SLA 비노출, 가족 행동은 '확인했습니다' 1개.

const fmtDT = (t) =>
  new Date(t).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export default function FamilyHome() {
  const { state, dispatch } = useAppState();
  const [demoOpen, setDemoOpen] = useState(false);
  const ob = state.onboarding;
  const elderName = ob?.elderName || ELDER.name;
  const anomaly = state.demo.anomaly;

  const upcoming = [...state.events]
    .sort((a, b) => a.at - b.at)
    .filter((e) => e.at > Date.now())
    .slice(0, 3);
  const [aiBooked, setAiBooked] = useState(false);
  const [askAi, setAskAi] = useState(null); // AI 케어 어시스턴트 — 선택한 질문

  // AI 어시스턴트 — /api/ai (기본 모델: Claude Sonnet, 외부 표기는 'AI').
  // 키 미설정·오류 시 기록 기반 데모 답변으로 폴백해 시연이 끊기지 않는다.
  const askAssistant = async (qa) => {
    if (askAi?.q === qa.q) {
      setAskAi(null);
      return;
    }
    setAskAi({ ...qa, loading: true });
    try {
      const ctx = [
        `주간 요약: ${WEEKLY.map((w) => `${w.name} ${w.value} (${w.last})`).join(" · ")}`,
        `실시간: ${VITALS.map((vt) => `${vt.name} ${vt.value}${vt.unit} (${vt.status})`).join(" · ")}`,
        `다가오는 일정: ${upcoming.map((e) => e.title).join(" · ")}`,
        "안부 전화: '어지러움' 발언 2회 · '무릎이 조금 아프다' 1회 — 진료 질문 목록 반영됨",
      ].join("\n");
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qa.q, context: ctx }),
      });
      if (!r.ok) throw new Error("ai-unavailable");
      const d = await r.json();
      setAskAi({ q: qa.q, a: d.answer, src: "실시간 AI 응답 · 케어 기록 기반", loading: false });
    } catch (_) {
      setAskAi({ ...qa, loading: false }); // 데모 폴백 — 기록 기반 준비 답변
    }
  };
  const pendingApprovals = state.requests.filter((r) => r.status === "awaitingPayment").length;
  const repScore = Math.min(...OUTING.legs.map((l) => l.score)); // 두 구간 중 낮은 값

  return (
    <>
      <Head>
        <title>가족 앱 — K-CARE</title>
      </Head>
      <FamilyLayout>
        {/* SOS 배너 — 조건부, 최상단 */}
        {state.demo.sos && (
          <div className="animate-sosPulse rounded-2xl bg-danger p-4 text-white">
            <div className="text-[12px] font-bold tracking-[.14em] opacity-85">
              긴급 · SOS 수신
            </div>
            <div className="mt-1 text-[19px] font-bold">어머니가 도움을 요청했습니다</div>
            <div className="mt-0.5 text-[13px] opacity-90">
              박지현 · 서다인 2인 급파 중 (1.2km) · 관제센터 확인
            </div>
            <button
              onClick={() => dispatch({ type: "demo", payload: { sos: false } })}
              className="btn-press mt-3 w-full rounded-[10px] bg-white py-3 text-[16px] font-bold text-danger"
            >
              확인했습니다
            </button>
          </div>
        )}

        {/* AI 이상 징후 카드 — anomaly === 'open' */}
        {anomaly === "open" && (
          <div className="rounded-card border border-amber/35 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-[18px]">
            <div className="flex items-center gap-2">
              <span className="h-[7px] w-[7px] animate-livePing rounded-full bg-amber" />
              <span className="text-[12px] font-bold text-amber">
                AI 이상 징후 감지 · 사람 확인 필요
              </span>
            </div>
            <div className="mt-2 text-[17px] font-bold leading-[1.5] text-ink">
              새벽 3시 12분, 거실에서 5초간 급격한 움직임 후 정지
            </div>
            <p className="mt-1 text-[13px] leading-[1.7] text-[#5A4A22]">
              낙상 의심 패턴입니다. 이후 심박 108bpm(평소 72), 오전 복약 미기록. 어르신은
              아직 SOS를 누르지 않았습니다.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["03:12", "거실 급가속 후 5초 정지", "낙상 의심", "#C0392B"],
                ["03:14", "심박 108bpm · 평소 대비 +50%", "이상", "#8A5D12"],
                ["08:00", "아침 혈압약 복약 미기록", "미이행", "#8A5D12"],
              ].map(([t, txt, tag, color]) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="w-[40px] shrink-0 font-num text-[11px] font-bold text-amber">
                    {t}
                  </span>
                  <span className="flex-1 text-[13px] text-ink">{txt}</span>
                  <span className="text-[12px] font-bold" style={{ color }}>
                    {tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "sent" } })}
                className="btn-press flex-1 animate-escalateGlow rounded-[10px] bg-danger py-3 text-[15px] font-bold text-white"
              >
                지금 확인 요청
              </button>
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "dismissed" } })}
                className="btn-press flex-1 rounded-[10px] border border-amber/30 bg-white/60 py-3 text-[15px] font-bold text-amber"
              >
                괜찮습니다
              </button>
            </div>
            {/* 제품 약속 — 생략 불가 (repo-CLAUDE.md) */}
            <p className="mt-3 text-[11px] leading-[1.6] text-[#8A7A4E]">
              AI는 감지·제안만 하고 조치는 사람이 결정합니다 · 오탐 신고는 모델 재학습에
              반영됩니다 (8.4)
            </p>
          </div>
        )}

        {anomaly === "sent" && (
          <div className="rounded-card border border-green/30 bg-gradient-to-b from-[#F1FAF6] to-[#E6F4EE] p-[18px]">
            <div className="text-[15px] font-bold text-green">확인 요청을 전달했습니다</div>
            <p className="mt-1 text-[13px] leading-[1.7] text-muted">
              관제센터가 안부콜을 진행하고, 필요 시 담당 컨시어지가 방문합니다. 결과는 이
              화면과 알림으로 전달됩니다.
            </p>
          </div>
        )}

        {/* 오늘 어머니는 — 핵심 약속 카피 포함 */}
        <div className="rounded-card bg-navy p-[18px] text-white">
          <div className="flex items-center justify-between">
            <SectionLabel>
              <span className="text-white/60">오늘 {ob?.rel === "배우자" ? "배우자" : "어머니"}는</span>
            </SectionLabel>
            <Badge fg="#0A1F3C" bg="#4ADE80">
              평소와 같음
            </Badge>
          </div>
          <div className="mt-2 text-[19px] font-bold leading-[1.55]">
            어제 잘 주무셨고, 아침 약도 챙겨 드셨습니다. 오후에 동네 한 바퀴 산책도
            하셨어요.
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3.5">
            {WEEKLY.map((w) => (
              <div key={w.name}>
                <div className="text-[11px] text-white/55">{w.name}</div>
                <div className="font-num text-[18px] font-bold">
                  {w.value}{" "}
                  <span className="text-[11px] font-bold text-[#4ADE80]">{w.delta}</span>
                </div>
                <div className="text-[10px] text-white/40">{w.last}</div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-[12px] leading-[1.7] text-white/55">
            숫자를 읽고 판단하는 일은 저희가 합니다. 한 줄이 초록이면 연락하지 않으셔도
            됩니다.
          </p>
          <p className="mt-1.5 text-[11px] text-white/40">
            AI가 워치·방문 기록을 요약하고 사람이 검수합니다 (8.4)
          </p>
        </div>

        {/* 동행 후 만족도 — NPS 수집 루프. 비추천(≤6)은 즉시 회복 플로우 */}
        <NpsCard
          onEvent={(text, color) => dispatch({ type: "pushEvent", payload: { kind: "CS", text, color } })}
        />

        {/* 승인 대기 배지 — REQ-03/07 연결 */}
        {pendingApprovals > 0 && (
          <Link href="/family/requests" className="block">
            {/* 주홍색 강조 — 즉시 행동이 필요한 카드 (컨시어지 수행 버튼과 동일 액센트) */}
            <div
              className="btn-press btn-dark flex items-center justify-between rounded-card p-4 text-white"
              style={{ background: "#D9542B" }}
            >
              <div className="text-[16px] font-bold">
                결제 승인이 필요한 요청 {pendingApprovals}건
              </div>
              <span className="text-[20px] text-white/80">›</span>
            </div>
          </Link>
        )}

        {/* 다가오는 일정 — 리스트 3건 + 상태 배지 (디자인 콘솔 · REQ-02) */}
        {upcoming.length > 0 && (
          <Card className="p-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[17px] font-black text-navy">다가오는 일정</div>
              <Link
                href="/family/calendar"
                className="btn-press rounded-lg border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
              >
                일정 변경
              </Link>
            </div>
            <div className="mt-2.5 space-y-3">
              {upcoming.map((e) => {
                const [label, fg, bg] = e.source?.includes("AI")
                  ? ["확정", "#1E7A5A", "rgba(30,122,90,.12)"]
                  : e.kind === "medication"
                  ? ["대기", "#5C5A54", "rgba(92,90,84,.1)"]
                  : ["예정", "#3B5C8A", "rgba(59,92,138,.12)"];
                const sameDay = new Date(e.at).toDateString() === new Date().toDateString();
                const timeLabel = sameDay
                  ? new Date(e.at).toTimeString().slice(0, 5)
                  : new Date(e.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
                return (
                  <div key={e.id} className="flex items-start gap-3">
                    <span className="w-[44px] shrink-0 pt-[1px] font-num text-[15px] font-bold text-navy">
                      {timeLabel}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-ink">{e.title}</div>
                      <div className="mt-0.5 truncate text-[12px] text-muted">
                        {e.note || `${EVENT_KINDS[e.kind].label} · ${e.source}`}
                      </div>
                    </div>
                    <Badge fg={fg} bg={bg}>
                      {label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 오늘 외출 컨디션 — 두 구간 중 낮은 값 대표 (안전 측) · 디자인 콘솔 정합 */}
        <Card
          className="border-[rgba(147,178,214,.24)] p-[18px]"
          style={{ background: "linear-gradient(180deg, #FAFCFF, #F2F7FD)" }}
        >
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-black text-navy">오늘 외출 컨디션</div>
            <span className="font-num text-[12px] text-muted">{OUTING.asOf}</span>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="font-num text-[38px] font-bold leading-none text-danger">{repScore}</span>
            <span className="text-[12px] text-muted">/100</span>
            <span className="rounded-full bg-danger px-2.5 py-1 text-[12px] font-bold text-white">
              주의
            </span>
            <span className="ml-auto text-[12px] text-muted">두 구간 중 낮은 값</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {OUTING.legs.map((l) => (
              <div
                key={l.tag}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px]"
                style={{
                  background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
                }}
              >
                <span className="w-[34px] shrink-0 font-bold text-gold">{l.tag}</span>
                <span className="flex-1 font-bold text-ink">{l.place}</span>
                <span className="font-num text-[16px] font-bold text-navy">{l.score}</span>
                <span
                  className="w-[30px] text-right text-[12px] font-bold"
                  style={{ color: l.level === "danger" ? "#C0392B" : "#8A5D12" }}
                >
                  {l.grade}
                </span>
              </div>
            ))}
          </div>
          {/* 3열 요인 그리드 (디자인 콘솔) */}
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {OUTING.factors3.map((f) => (
              <div
                key={f.label}
                className="rounded-xl px-3 py-2.5"
                style={{
                  background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
                }}
              >
                <div className="text-[11px] text-muted">{f.label}</div>
                <div
                  className="mt-0.5 font-num text-[15px] font-bold"
                  style={{ color: { caution: "#8A5D12", danger: "#C0392B", neutral: "#0A1F3C" }[f.level] }}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
          {/* 문장형 안내 — 이미 한 조치를 말한다 */}
          <p className="mt-2.5 rounded-xl border border-[#EFE0BF] bg-[#FDF6E8] p-3 text-[13px] leading-[1.7] text-[#5A4A22]">
            {OUTING.adviceGuardian}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {OUTING.kit.map((k) => (
              <span key={k} className="chip-gold rounded-full px-2.5 py-1 text-[12px] font-bold">
                {k}
              </span>
            ))}
          </div>
        </Card>

        {/* 담당 컨시어지 · 2인 1조 — 신원·관계 연속성 + AI 예약 (디자인 콘솔) */}
        <div className="card-navy rounded-card bg-navy p-[18px] text-white">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-[.14em] text-gold-soft">
              담당 컨시어지 · 2인 1조
            </span>
            <span className="font-num text-[12px] text-white/60">{CARE_TEAM.dateLabel}</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {CARE_TEAM.members.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.05] p-3.5"
              >
                <span
                  className="flex h-[48px] w-[48px] shrink-0 items-center justify-center whitespace-nowrap rounded-full text-[15px] font-bold"
                  style={{ background: m.avBg, color: m.avFg }}
                >
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold">
                    {m.name}{" "}
                    <span className="text-[11px] font-bold text-gold-soft">{m.role}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-white/60">{m.career}</div>
                  <div className="mt-0.5 text-[12px] font-bold text-[#8FE3C0]">{m.relation}</div>
                </div>
                <button
                  aria-label={`${m.name}에게 전화`}
                  className="btn-press flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[.06] text-[17px]"
                >
                  ☏
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-[1.7] text-white/60">{CARE_TEAM.trust}</p>
          <button
            onClick={() => {
              if (aiBooked) return;
              setAiBooked(true);
              const at = new Date();
              at.setDate(at.getDate() + 24);
              at.setHours(10, 0, 0, 0);
              dispatch({
                type: "addEvent",
                payload: {
                  id: `ev-${Date.now()}`,
                  kind: "nextAppt",
                  title: "순환기내과 정기 외래 · 서울아산병원",
                  at: at.getTime(),
                  source: "AI 컨시어지 접수",
                  note: "AI 컨시어지 접수 완료 · 차량 동행",
                },
              });
              dispatch({
                type: "pushEvent",
                payload: { kind: "예약", text: "AI 컨시어지 예약 접수 · 순환기내과 정기 외래", color: "#B08D57" },
              });
            }}
            className={`btn-press btn-dark mt-3.5 w-full rounded-xl py-3.5 text-[16px] font-bold ${
              aiBooked ? "bg-green text-white" : "bg-gold text-navy"
            }`}
          >
            {aiBooked ? "✓ 예약 접수됨 · 다가오는 일정에서 확인" : "AI로 예약하기"}
          </button>
          {/* 제휴 병원 진입점 — 동행 예약 흐름과 같은 맥락 */}
          <Link
            href="/family/hospitals"
            className="btn-press mt-2 block w-full rounded-xl border border-white/25 bg-white/[.06] py-3 text-center text-[15px] font-bold text-white/85"
          >
            제휴 병원 찾기 · 과목별 MOU · 패스트트랙
          </Link>
        </div>

        {/* 실시간 건강 요약 — 5지표 · 지표별 상태 라벨 병행 (디자인 콘솔 · F2-6) */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-black text-navy">실시간 건강 요약</div>
            <span className="font-num text-[12px] text-muted">14:38 갱신</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {VITALS.map((v) => (
              <div
                key={v.name}
                className="rounded-xl p-3.5"
                style={{
                  background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
                }}
              >
                <div className="text-[12px] text-muted">{v.name}</div>
                <div className="mt-0.5 font-num text-[25px] font-bold leading-none text-navy">
                  {v.value} <span className="text-[12px] font-bold text-muted">{v.unit}</span>
                </div>
                <div
                  className="mt-1.5 text-[12px] font-bold"
                  style={{ color: { ok: "#1E7A5A", caution: "#8A5D12", danger: "#C0392B", neutral: "#5C5A54" }[v.level] }}
                >
                  {v.status}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
            웨어러블 실연동 대기 — 표기 지표는 연동 후 실측값으로 대체 (F2-6)
          </p>
        </Card>

        {/* AI 케어 어시스턴트 — 답변은 항상 근거 동반 · 의료 판단 아님 */}
        <Card className="p-[18px]">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-black text-navy">AI 케어 어시스턴트</span>
            <span className="chip-gold rounded-full px-2 py-[3px] text-[10px] font-bold">근거 동반 답변</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {AI_ASSISTANT_QA.map((qa) => (
              <button
                key={qa.q}
                onClick={() => askAssistant(qa)}
                className={`btn-press rounded-full border px-3 py-2 text-[13px] font-bold ${
                  askAi?.q === qa.q ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"
                }`}
              >
                {qa.q}
              </button>
            ))}
          </div>
          {askAi && (
            <div
              className="animate-tickIn mt-3 rounded-xl p-3.5"
              style={{
                background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
              }}
            >
              {askAi.loading ? (
                <p className="text-[15px] leading-[1.75] text-muted">기록을 확인하고 있어요…</p>
              ) : (
                <>
                  <p className="text-[15px] leading-[1.75] text-ink">{askAi.a}</p>
                  <p className="mt-2 border-t border-navy/[.08] pt-2 text-[11px] font-bold text-muted">
                    근거: {askAi.src}
                  </p>
                </>
              )}
            </div>
          )}
          <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">
            수집된 기록에서만 답합니다 · 의료 판단이 아니며, 이상 징후는 사람이 확인 후
            알립니다 (8.4)
          </p>
        </Card>

        {/* 형제 공동 관리 — 순위 없음, 사실만 */}
        <Card className="p-[18px]">
          <SectionLabel>가족 공동 관리</SectionLabel>
          <div className="mt-3 space-y-3">
            {GUARDIANS.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <Avatar name={g.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-ink">
                    {g.name}
                    {g.isPrimary && (
                      <span className="ml-1.5 text-[11px] font-bold text-gold">연락 담당</span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted">
                    {g.relation} · {g.residence}
                  </div>
                </div>
                <div className="font-num text-[13px] font-bold text-muted">분담 {g.share}</div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 border-t border-navy/10 pt-3 text-[12px] leading-[1.7] text-muted">
            연락 담당은 한 명으로 고정하고 결과는 세 분 모두에게 동시에 전달됩니다.
          </p>
        </Card>

        {/* 시연 컨트롤 — 데모 전용 */}
        <div className="pt-1 text-center">
          <button
            onClick={() => setDemoOpen((v) => !v)}
            className="text-[12px] font-bold text-muted/50 underline underline-offset-2"
          >
            시연 컨트롤 {demoOpen ? "닫기" : "열기"}
          </button>
          {demoOpen && (
            <div className="mt-2 flex justify-center gap-2">
              <button
                onClick={() => dispatch({ type: "demo", payload: { sos: !state.demo.sos } })}
                className="btn-press rounded-lg border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-muted"
              >
                SOS {state.demo.sos ? "해제" : "발생"}
              </button>
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "open" } })}
                className="btn-press rounded-lg border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-muted"
              >
                이상 징후 재현
              </button>
            </div>
          )}
        </div>
      </FamilyLayout>
    </>
  );
}

// 동행 후 만족도 — NPS 루프: 0–10 선택 → 비추천(≤6)은 사유 + 24h 회복 안내
function NpsCard({ onEvent }) {
  const [score, setScore] = useState(null);
  const [reason, setReason] = useState(null);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <Card className="p-4">
        <div className="text-[15px] font-bold text-navy">
          {score <= 6
            ? "접수했습니다 — 24시간 안에 담당 매니저가 연락드립니다"
            : "감사합니다 — 다음 동행도 잘 준비하겠습니다"}
        </div>
        <p className="mt-1 text-[12px] leading-[1.6] text-muted">
          {score <= 6
            ? "낮은 점수는 회복이 먼저입니다 — 조치 결과를 다시 알려드립니다."
            : score >= 9
            ? "주변에 비슷한 고민을 하는 가족이 있다면 마이 탭의 초대 링크로 소개해 주세요."
            : "의견은 서비스 개선에 반영됩니다."}
        </p>
      </Card>
    );

  return (
    <Card className="p-[18px]">
      <SectionLabel>오늘 동행은 어떠셨나요?</SectionLabel>
      <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">
        13:50 서울아산 동행이 끝났습니다. 가족의 점수가 케어 품질 평가와 개선의 기준이 됩니다.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => setScore(i)}
            className="btn-press h-[34px] w-[34px] rounded-[10px] border font-num text-[15px] font-bold"
            style={
              score === i
                ? {
                    background: i <= 6 ? "#C0392B" : i <= 8 ? "#B08D57" : "#1E7A5A",
                    color: "#FFFFFF",
                    borderColor: "transparent",
                  }
                : { background: "rgba(255,255,255,.7)", color: "#0A1F3C", borderColor: "rgba(10,31,60,.14)" }
            }
          >
            {i}
          </button>
        ))}
      </div>
      {score != null && score <= 6 && (
        <div className="mt-3 border-t border-navy/[.08] pt-3">
          <div className="text-[13px] font-bold text-navy">무엇이 가장 아쉬우셨나요?</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NPS_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold"
                style={
                  reason === r
                    ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
                    : { background: "rgba(255,255,255,.7)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {score != null && (
        <button
          onClick={() => {
            setDone(true);
            onEvent(
              score <= 6
                ? `만족도 ${score}점 접수 — 회복 플로우 시작 (${reason || "사유 미선택"} · 24h 내 연락)`
                : `만족도 ${score}점 접수 — 감사 인사 발송`,
              score <= 6 ? "#FF8A80" : "#8FE3C0"
            );
          }}
          disabled={score <= 6 && !reason}
          className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white disabled:opacity-50"
        >
          제출
        </button>
      )}
    </Card>
  );
}
