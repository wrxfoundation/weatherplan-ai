import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, Badge, PendingTag, Collapse } from "../../components/ui";
import Icon from "../../components/icons";
import { AI_ASSISTANT_QA, CARE_TEAM, ELDER, EVENT_GROUPS, EVENT_KINDS, FEED_TONE, NEIGHBORHOOD_FEED, OUTING, VITALS, WEEKLY } from "../../lib/mock";
import { trackOf, subjectLabel, honorific } from "../../lib/tracks";
import VoiceNote from "../../components/VoiceNote";
import MapDialog, { distanceM, prettyDistance } from "../../components/MapDialog";
import { CONCIERGE_POS, ELDER_HOMES } from "../../lib/console";

import { useAppState } from "../../lib/state";

// 가족 앱 홈 — 핸드오프 02 family 명세 + REQ-02(다음 일정 홈 노출)
// 정보 비대칭 규칙: 경과시간·SLA 비노출, 가족 행동은 '확인했습니다' 1개.
//
// 트랙별로 화면이 달라진다 (lib/tracks.js). 상단 요약 카드의 문구가 바뀌고,
// 트랙에 없는 블록은 아예 그리지 않는다 — 워치를 안 드리는 트랙에서 "실시간
// 건강 요약"이 보이면 그건 거짓말이다. 온보딩 전(데모 직행)에는 기본 트랙을 쓴다.
export default function FamilyHome() {
  const { state, dispatch } = useAppState();
  const [demoOpen, setDemoOpen] = useState(false);
  // '지금 어디쯤' 지도 (2026-08-31 요청) — 오늘 오시는 주 동행이 어디까지 왔는지.
  // 좌표는 lib/console.js 한 곳에서 온다 (관제 지도와 같은 값).
  const [liveMap, setLiveMap] = useState(false);
  const liveTeam = CARE_TEAM.members[0];
  const livePos = CONCIERGE_POS[liveTeam?.name];
  const liveHome = ELDER_HOMES[ELDER.name];
  const liveGap = livePos && liveHome ? distanceM(livePos, liveHome) : null;
  const ob = state.onboarding;
  const track = trackOf(ob?.track);
  const has = (b) => track.home.blocks.includes(b);
  const subj = subjectLabel(track, ob); // 화면에서 이용자를 부르는 말 — 트랙마다 다르다
  const honor = honorific(ob); // 고객 호칭 — 전부 "~~님" 으로 통일 (2026-08-12 시트)
  const anomaly = state.demo.anomaly;

  const upcoming = [...state.events]
    .sort((a, b) => a.at - b.at)
    .filter((e) => e.at > Date.now())
    .slice(0, 3);
  const [askAi, setAskAi] = useState(null); // AI 케어 어시스턴트 — 선택한 질문
  const [vitalsOpen, setVitalsOpen] = useState(false); // 오늘 어머니는 카드 안 건강요약 펼침

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
            <div className="mt-1 text-[19px] font-bold">{subj}이(가) 도움을 요청했습니다</div>
            <div className="mt-0.5 text-[13px] opacity-90">
              박지현 · 서다인 2인 급파 중 (1.2km) · 관제센터 확인
            </div>
            <button
              onClick={() => dispatch({ type: "demo", payload: { sos: false } })}
              className="btn-press mt-3 w-full rounded-[10px] bg-white py-3 text-[16px] font-bold text-danger"
            >
              확인했습니다
            </button>
            {/* 긴급 화면에서도 목소리를 남긴다 — 도착 전에 닿는 것이 이 버튼의 이유 */}
            <div className="mt-2 border-t border-white/25 pt-2.5">
              <VoiceNote
                to={honor}
                tone="dark"
                compact
                onSend={(secs) => {
                  dispatch({ type: "addVoice", payload: { from: "보호자", to: honor, secs, context: "긴급" } });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "음성", text: `보호자 긴급 안부 음성 ${secs}초 — 컨시어지 단말로 전달`, color: "#FF8A80" },
                  });
                }}
              />
              <p className="mt-1.5 text-[11px] leading-[1.6] text-white/70">
                도착 전까지 급파 중인 컨시어지 단말로도 함께 재생됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 컨시어지 체크인 → 보호자 라이브 — 역할 간 실시간 연동 */}
        {state.visit.checkedIn && !state.demo.sos && (
          <Card className="flex items-center gap-3 p-4">
            <span className="h-[10px] w-[10px] shrink-0 animate-livePing rounded-full bg-green" />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-navy">
                지금 박지현 컨시어지가 {subj} 곁에 함께 있습니다
              </div>
              <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">
                13:50 출발 · GPS · 시간 기록 중 — 종료 후 2시간 안에 리포트가 도착합니다
              </div>
            </div>
          </Card>
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
              낙상 의심 패턴입니다. 이후 심박 108bpm(평소 72), 오전 복약 미기록. {honor}은
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

        {/* 상단 요약 — 트랙에 따라 제목·문구·지표가 바뀐다 */}
        <div className="rounded-card bg-navy p-[18px] text-white">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>
              <span className="text-white/60">
                {track.id === "elder" && ob?.rel === "배우자"
                  ? "오늘 배우자는"
                  : track.home.title}
              </span>
            </SectionLabel>
            <Badge fg="#0A1F3C" bg="#4ADE80">
              {track.home.badge}
            </Badge>
          </div>
          <div className="mt-2 text-[19px] font-bold leading-[1.55]">{track.home.line}</div>
          {has("weekly") && (
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
          )}
          <p className="mt-3.5 text-[12px] leading-[1.7] text-white/55">{track.home.foot}</p>
          <p className="mt-1.5 text-[11px] text-white/40">
            AI가 기록을 요약하고 사람이 검수합니다 (8.4)
          </p>
          {/* 지금 어떤 서비스로 쓰고 있는지 — 트랙이 바뀌면 화면이 바뀌므로 명시한다 */}
          <div className="mt-3.5 flex items-center gap-2 border-t border-white/10 pt-3">
            <span className="text-gold-soft">
              <Icon name={track.icon} size={16} />
            </span>
            <span className="text-[12px] font-bold text-white/70">{track.short}</span>
            <span className="text-[11px] text-white/35">· {track.who}</span>
          </div>

          {/* 실시간 건강 요약 — 별도 카드였으나 여기로 병합했다 (2026-08-28 시트 홈 5번:
              "실시간 건강요약을 오늘 어머니와 병합하고 하단에 위치하여 클릭하면 펼쳐지게").
              같은 사람의 오늘을 말하는 두 카드가 떨어져 있을 이유가 없다. */}
          {has("vitals") && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                onClick={() => setVitalsOpen((v) => !v)}
                aria-expanded={vitalsOpen}
                className="btn-press flex w-full items-center gap-2 text-left"
              >
                <span className="text-[14px] font-bold text-white">실시간 건강 요약</span>
                <span className="text-[11px] text-white/45">{VITALS.length}지표</span>
                <span
                  aria-hidden
                  className="ml-auto text-white/55 transition-transform duration-200"
                  style={{ transform: vitalsOpen ? "rotate(180deg)" : "none" }}
                >
                  <Icon name="chev" size={18} strokeWidth={2} />
                </span>
              </button>
              {vitalsOpen && (
                <>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {VITALS.map((v) => (
                      <div key={v.name} className="rounded-xl border border-white/10 bg-white/[.05] p-3">
                        <div className="text-[11px] text-white/55">{v.name}</div>
                        <div className="mt-0.5 font-num text-[21px] font-bold leading-none">
                          {v.value} <span className="text-[11px] font-bold text-white/50">{v.unit}</span>
                        </div>
                        <div
                          className="mt-1 text-[11px] font-bold"
                          style={{ color: { ok: "#8FE3C0", caution: "#E8C88A", danger: "#FF9B8F", neutral: "rgba(255,255,255,.6)" }[v.level] }}
                        >
                          {v.status}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[11px] leading-[1.6] text-white/45">
                      웨어러블 실연동 대기 — 연동 후 실측값으로 대체 (F2-6)
                    </span>
                    <Link href="/family/watch" className="tap shrink-0 text-[12px] font-bold text-gold-soft underline underline-offset-2">
                      워치 상세 →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 담당 컨시어지 — 신원·관계 연속성 + AI 예약 (디자인 콘솔) */}
        <div className="card-navy rounded-card bg-navy p-[18px] text-white">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold tracking-[.14em] text-gold-soft">
              담당 컨시어지
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
          {/* 제휴병원 예약 및 상담 — AI 예약 버튼과 패스트트랙 문구는 2026-08-12 요청으로 삭제.
              그 옆에 '지금 어디쯤' 추가 (2026-08-31 요청) — 오늘 오시는 컨시어지가
              어디까지 왔는지 지도로 본다. 보호자가 가장 자주 묻는 것이 이것이다. */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/family/hospitals"
              className="btn-press block rounded-xl border border-white/25 bg-white/[.06] py-3 text-center text-[15px] font-bold text-white/85"
            >
              제휴병원 예약
            </Link>
            <button
              onClick={() => setLiveMap(true)}
              className="btn-press flex items-center justify-center gap-1.5 rounded-xl border py-3 text-center text-[15px] font-bold"
              style={{ borderColor: "rgba(74,222,128,.45)", background: "rgba(74,222,128,.12)", color: "#8FEBB4" }}
            >
              <span aria-hidden className="h-[8px] w-[8px] animate-livePing rounded-full" style={{ background: "#4ADE80" }} />
              지금 어디쯤
            </button>
          </div>
        </div>


        {/* 동행 후 만족도(NpsCard)는 마이 탭으로 옮겼다 (2026-08-28 시트 홈 2번 —
            "동행리뷰는 마이 탭으로 이동해서 동행리포트 아래에 위치"). 리포트를 보고
            나서 쓰는 것이 자연스럽고, 홈은 오늘 상태를 보는 자리다. */}

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

        {/* 일정 캘린더 — 담당 컨시어지 바로 아래 (2026-08-28 시트 홈 4번).
            7종 구성: 병원동행 · 일상동행 · 해주세요 · 안심방문 · 배송 · 개인일정 ·
            가족이벤트. 어르신과 같은 캘린더를 본다 (컨시어지는 별개 캘린더). */}
        {upcoming.length > 0 && (
          <Card className="p-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[17px] font-black text-navy">일정 캘린더</div>
              <Link
                href="/family/calendar"
                className="btn-press rounded-lg border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
              >
                일정 변경
              </Link>
            </div>
            {/* 7종 범례 — 무슨 일정이 이 캘린더에 들어오는지 (시트 홈 4번) */}
            <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
              {EVENT_GROUPS.map((g) => (
                <span key={g.id} className="flex items-center gap-1.5">
                  <span aria-hidden className="h-[7px] w-[7px] rounded-full" style={{ background: g.color }} />
                  <span className="text-[11px] font-bold text-muted">{g.label}</span>
                </span>
              ))}
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
                        {e.note || `${(EVENT_KINDS[e.kind]?.label || "일정")} · ${e.source}`}
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
        {has("outing") && (
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
        )}

        {/* 우리 동네 소식 — 동·구 단위 재난·안전·정책·바우처 (디자인 콘솔 복원).
            홈에서 가장 긴 블록(627px)이라 접어 둔다. 지금 당장 할 일이 아니라
            "있으면 챙기는" 정보다 — 제목줄의 건수만 봐도 새 소식이 있는지 안다. */}
        {has("feed") && (
          <Card className="p-0">
            <Collapse title="우리 동네 소식" count={`${NEIGHBORHOOD_FEED.length}건`} note={`대치동 · ${ELDER.district}`}>
              <NeighborhoodFeed
                onApply={(item) =>
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "정책", text: `${item.title} — 신청 대행 요청 접수`, color: "#F0D9A8" },
                  })
                }
              />
            </Collapse>
          </Card>
        )}

        {/* AI 케어 어시스턴트 — 답변은 항상 근거 동반 · 의료 판단 아님 */}
        {has("assistant") && (
          <Card className="p-0">
            <Collapse
              title="AI 케어 어시스턴트"
              count={`${AI_ASSISTANT_QA.length}가지 질문`}
              note="수집된 기록에서만 답합니다 · 의료 판단이 아닙니다"
            >
            <div className="flex flex-wrap gap-1.5">
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
              이상 징후는 사람이 확인 후 알립니다 (8.4)
            </p>
          </Collapse>
          </Card>
        )}

        {/* 가족 공동 관리는 마이 탭 '가족 구성원'과 합쳤다 (2026-08-28 시트 홈 6번).
            같은 사람 목록이 두 화면에 있었다 — 관리는 마이에서 한 번만 한다. */}

        {/* 안부 음성 남기기 — 첫 화면 아랫부분 (2026-08-12 시트 홈 1번) */}
        <Card className="p-[18px]">
          <div className="text-[17px] font-black text-navy">안부 음성 남기기</div>
          <VoiceNote
            to={honor}
            onSend={(secs) => {
              dispatch({ type: "addVoice", payload: { from: "보호자", to: honor, secs, context: "안부" } });
              dispatch({
                type: "pushEvent",
                payload: { kind: "음성", text: `보호자 안부 음성 ${secs}초 — 어르신 화면 가족 탭으로 전달`, color: "#8FE3C0" },
              });
            }}
          />
          {state.voices.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-navy/[.08] pt-3">
              {state.voices.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center gap-2 text-[12px]">
                  <span className="font-num font-bold text-navy">
                    {new Date(v.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <span className="flex-1 text-muted">
                    {v.from} → {v.to} · {v.secs}초{v.context === "긴급" ? " · 긴급" : ""}
                  </span>
                  <span className="font-bold text-green">전달됨</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 시연 컨트롤 — 데모 전용 */}
        <div className="pt-1 text-center">
          <button
            onClick={() => setDemoOpen((v) => !v)}
            className="tap text-[12px] font-bold text-muted/50 underline underline-offset-2"
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

        {/* 오늘 오시는 컨시어지 위치 — '지금 어디쯤' 버튼이 연다 (2026-08-31 요청) */}
        <MapDialog
          open={liveMap}
          onClose={() => setLiveMap(false)}
          title={`${liveTeam?.name} 선생님, 지금 어디쯤`}
          sub={`${CARE_TEAM.dateLabel} · ${livePos?.state === "이동중" ? "댁으로 오는 중입니다" : livePos?.state}`}
          points={
            livePos && liveHome
              ? [
                  { ...livePos, label: `${liveTeam?.name} 선생님`, color: "#1E7A5A", pulse: true },
                  { ...liveHome, label: `${honor} 댁`, color: "#B08D57" },
                ]
              : []
          }
          foot={
            liveGap != null
              ? `두 지점 사이 직선거리 ${prettyDistance(liveGap)}. 실제 도착 시각은 길·신호에 따라 달라집니다. 위치는 방문 당일에만, 동행이 끝나면 표시가 멈춥니다.`
              : "위치를 받아오는 중입니다."
          }
        />
      </FamilyLayout>
    </>
  );
}

/// NpsCard(동행 후 만족도)는 마이 탭으로 옮겼다 (2026-08-28 시트 홈 2번).

function NeighborhoodFeed({ onApply }) {
  const [applied, setApplied] = useState({});
  // 제목줄·카드는 바깥 Collapse 가 그린다 — 여기서는 내용만 그린다
  return (
    <div>
      {/* "자동 업데이트인가요?" (2026-08-12 대표 질문) — 지금 상태를 그대로 적는다.
          자동 수집 연동은 아직 붙지 않았다. 되는 것처럼 쓰면 나중에 신뢰를 잃는다. */}
      <div className="flex items-center gap-1.5">
        <PendingTag>자동 수집 연동 대기</PendingTag>
        <span className="text-[11px] leading-[1.6] text-muted">
          현재는 관제가 확인한 공고만 게시합니다
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {NEIGHBORHOOD_FEED.map((n) => (
          <div key={n.id} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ color: FEED_TONE[n.tone].fg, background: FEED_TONE[n.tone].bg }}
              >
                {n.kind}
              </span>
              <span className="text-[14px] font-bold leading-[1.4] text-navy">{n.title}</span>
              <span className="ml-auto shrink-0 font-num text-[11px] text-muted">{n.at}</span>
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-muted">{n.body}</p>
            {n.action && (
              <button
                onClick={() => {
                  if (applied[n.id]) return;
                  setApplied((v) => ({ ...v, [n.id]: true }));
                  onApply(n);
                }}
                disabled={!!applied[n.id]}
                className={`btn-press mt-2 rounded-xl border px-3.5 py-2 text-[13px] font-bold ${
                  applied[n.id] ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                }`}
              >
                {applied[n.id] ? "요청됨 — 컨시어지가 서류까지 대행합니다" : n.action}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
        행정안전부 재난문자 · 구청 복지 공고 기준 — 해당하는 것만 골라 알려드립니다.
        자동 수집이 붙으면 게시까지 걸리는 시간이 사라집니다.
      </p>
    </div>
  );
}
