import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { AI_ASSISTANT_QA, CARE_TEAM, ELDER, EVENT_KINDS, FEED_TONE, NEIGHBORHOOD_FEED, OUTING, VITALS, WEEKLY, elderWho } from "../../lib/mock";
import { trackOf, subjectLabel, honorific, josa } from "../../lib/tracks";
import VoiceNote from "../../components/VoiceNote";
import MapDialog, { distanceM, prettyDistance } from "../../components/MapDialog";
import { CONCIERGE_POS, ELDER_HOMES } from "../../lib/console";
import { eventsFor, useAppState } from "../../lib/state";
import { playErrorText, usePrefetchClips, useVoicePlayer } from "../../lib/voice-client";
import { useAuth } from "../../lib/auth";
import { scopedKey } from "../../lib/scope";
import { useLastActivity } from "../../lib/last-activity";
import { healthOf } from "../../lib/meds";
import { LIVE_CONCIERGE, LIVE_TAG, STAGE_LABEL, visitReportOf } from "../../lib/live-household";
import { centerNow } from "../../lib/people-store";
import { approverOf } from "../../lib/requests";
import { fmtWon } from "../../lib/config";
import { HelpCallCard } from "../../components/HelpCall";
import { avatarText, meAs } from "../../lib/people";
import { USUAL_SLEEP, fitMonth, medMonth, medTally, pastWeek, weekBefore } from "../../lib/demo-health";
import { Clay, Line } from "../../components/clay";
import { Btn, Card, Face, Pill, R, TONE, WhiteBtn, eventTone } from "../../components/ds";

// 받은 음성 '받은 때' — 오늘 · 어제는 말로, 그 전은 날짜로 (시각만 쓰면 며칠 전 것도 오늘처럼 읽힌다)
const whenLabel = (at) => {
  const d = new Date(at);
  const hm = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(d)) / 86400000);
  if (diff <= 0) return `오늘 ${hm}`;
  if (diff === 1) return `어제 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
};

// 가족 앱 홈 — 핸드오프 02 family 명세 + REQ-02(다음 일정 홈 노출)
// 2026-10-15 디자인 시안: 머리(오늘 · 한 줄 요약) → 이상 징후 → 네 칸(수면 · 활동 · 복약 · 외출, 누르면 세부 화면)
// → 오늘 동행 → 결제 대기 → 목소리 보내기 → 다가오는 일정. 시안에 없던 것(받은 음성 · 동네 소식 · AI 어시스턴트 · 시연 컨트롤)은
// 아래쪽에 그대로 남겼다 — 받은 음성은 2026-10-05 요청("안부 음성 남기기 밑으로")대로 목소리 버튼 바로 밑.
// 정보 비대칭 규칙: 경과시간·SLA 비노출, 가족 행동은 '확인했습니다' 1개.
// 트랙별로 화면이 달라진다 (lib/tracks.js) — 워치를 안 드리는 트랙에서 건강 수치가 보이면 그건 거짓말이다.
export default function FamilyHome() {
  const { state, dispatch } = useAppState();
  const [demoOpen, setDemoOpen] = useState(false);
  const authUser = useAuth().user;
  const live = !!authUser?.household; // 테스트 계정 — 시연 컨트롤(SOS 켜기 · 이상 징후 재현)을 숨긴다
  // SOS '확인했습니다' — 이 기기에서만 배너를 접는다. SOS 해제는 관제만 한다 (ackSos).
  const sosKey = state.demo.sos ? String(state.demo.sosAt || "on") : "";
  const [sosAck, setSosAck] = useState("");
  useEffect(() => {
    try {
      setSosAck(window.localStorage.getItem(scopedKey("kcare-guardian-sos-ack-v1")) || "");
    } catch {
      /* 저장이 막힌 브라우저 — 이 화면에서만 기억 */
    }
  }, []);
  const ackSosHere = () => {
    setSosAck(sosKey);
    try {
      window.localStorage.setItem(scopedKey("kcare-guardian-sos-ack-v1"), sosKey);
    } catch {
      /* 위와 같음 */
    }
  };
  const sosStage = state.ops?.sosAcceptedAt
    ? `${LIVE_CONCIERGE} 컨시어지가 출동을 수락해 이동 중입니다 · 관제센터 대응 중`
    : state.ops?.sosDispatched
      ? `관제센터가 ${LIVE_CONCIERGE} 컨시어지를 급파했습니다 · 수락 대기`
      : "관제센터가 확인하고 있습니다 — 곧 연락드립니다";
  // '지금 어디쯤' 지도 (2026-08-31 요청) — 오늘 오시는 주 동행이 어디까지 왔는지. 좌표는 lib/console.js (관제 지도와 같은 값)
  const [liveMap, setLiveMap] = useState(false);
  const liveTeam = CARE_TEAM.members[0];
  const livePos = CONCIERGE_POS[liveTeam?.name];
  const liveHome = ELDER_HOMES[ELDER.name];
  const liveGap = livePos && liveHome ? distanceM(livePos, liveHome) : null;
  const ob = state.onboarding;
  const track = trackOf(ob?.track);
  // 테스트 가구에는 워치 · 센서 · 오늘 외출 일정이 없다 — 주간 수치 · 건강 요약 · 그 수치로 답하는 AI 는 지어낸 '오늘'이 된다.
  // 대신 어르신 앱이 실제로 남긴 기록을 보여 준다 (2026-10-02 UX 점검).
  const FAKE_IN_TEST = ["weekly", "vitals", "assistant"];
  const has = (b) => track.home.blocks.includes(b) && !(live && FAKE_IN_TEST.includes(b));
  const elderLast = useLastActivity("elder", live);
  const medDone = Object.keys(state.elder?.medSlots || {}).filter((k) => state.elder.medSlots[k]);
  // 복약 계획 — 관제 · 컨시어지가 고친 건강 정보 그대로 (어르신 앱과 같은 값, lib/meds.js healthOf)
  const medPlan = healthOf(state).meds;
  const morningMed = medPlan.find((d) => d.slot === "아침") || null;
  const voicesToElder = (state.voices || []).filter((v) => v.from === "보호자");
  const heard = voicesToElder.filter((v) => state.elder?.msgPlayed?.[v.id]).length;
  const unheardSent = voicesToElder.filter((v) => !state.elder?.msgPlayed?.[v.id]).sort((a, b) => b.at - a.at);
  const [unsendAsk, setUnsendAsk] = useState(null); // 보내기 취소를 묻는 음성 id
  // 어르신 → 주 보호자(아들 민수) · 가족 모두에게 온 목소리 — 최근 것부터
  const fromElder = (state.voices || [])
    // 관제 센터 공간은 그 센터 보호자 이름 앞으로 온 것 (lib/people.js voiceTargetsCenter)
    .filter((v) => v.from === `${ELDER.name} 님` && (v.to === (centerNow() ? meAs(authUser, "guardian") : "아들 민수") || v.to === "가족 모두"))
    .sort((a, b) => b.at - a.at);
  const unheardFromElder = fromElder.filter((v) => !state.guardian?.voiceHeard?.[v.id]).length;
  // 어르신 목소리 듣기 — 녹음이 있으면 실제 소리를 재생한다 (2026-10-14). 미리 받아 두어야 누르는 순간 재생된다 (아이폰)
  const player = useVoicePlayer();
  usePrefetchClips(fromElder.slice(0, 6).map((v) => v.clip));
  const [elderVoicesAll, setElderVoicesAll] = useState(false);
  const checkinAt = (state.visit.audit || []).find((e) => e.kind === "gps")?.at;
  const checkinHm = checkinAt ? new Date(checkinAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) : null;
  const visitStage = live ? `이번 방문 — ${STAGE_LABEL[visitReportOf(state).stage]}` : "";
  const subj = subjectLabel(track, ob); // 화면에서 이용자를 부르는 말 — 트랙마다 다르다
  const honor = honorific(ob); // 고객 호칭 — 전부 "~~님" 으로 통일 (2026-08-12 시트)
  const anomaly = state.demo.anomaly;

  // 반려된 일정은 홈에서 뺀다 (캘린더에는 사유 칩과 함께 남는다). 승인 대기 건은 '승인 대기'로 단다.
  const upcoming = eventsFor(state.events, "guardian")
    .filter((e) => e.approval !== "rejected")
    .sort((a, b) => a.at - b.at)
    .filter((e) => e.at > Date.now())
    .slice(0, 4);
  // 오늘 동행 카드 — 오늘 일정 중 첫 것 (없으면 다음 일정 목록만)
  const todayEv = upcoming.find((e) => new Date(e.at).toDateString() === new Date().toDateString()) || null;
  const laterEvents = upcoming.filter((e) => e !== todayEv).slice(0, 3);
  const [askAi, setAskAi] = useState(null); // AI 케어 어시스턴트 — 선택한 질문

  // AI 어시스턴트 — /api/ai (외부 표기는 'AI'). 키 미설정·오류 시 기록 기반 데모 답변으로 폴백해 시연이 끊기지 않는다.
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
  // 보호자가 할 일 — 결제 대기 + 승인 대상이 보호자인 컨시어지 제안 (2026-10-05)
  const pendingList = state.requests.filter((r) => r.status === "awaitingPayment" || (r.status === "requested" && approverOf(r) === "guardian"));
  const repScore = Math.min(...OUTING.legs.map((l) => l.score)); // 두 구간 중 낮은 값

  // 네 칸 — 데모는 워치 예시 값(lib/demo-health.js · lib/mock.js), 테스트 가구는 워치가 없다고 말한다
  const month = fitMonth();
  const today = month[month.length - 1];
  const lastWeekSteps = WEEKLY.find((w) => w.name === "활동");
  const meds30 = medMonth(medPlan, state.elder?.medSlots || {});
  const med7 = medTally(pastWeek(meds30)); // 어제까지 7일 — 복약 미션 화면 머리와 같은 수
  const medPrev7 = medTally(weekBefore(meds30));
  const medDiff = med7.taken - medPrev7.taken;
  const sleepDiff = Math.round((today.sleep - USUAL_SLEEP) * 10) / 10;
  const tiles = [
    {
      href: "/family/sleep",
      label: "수면",
      clay: "moon",
      tone: "blue",
      value: live ? "워치 없음" : `${today.sleep}시간`,
      note: live ? "워치를 연결하면 보여요" : `${sleepDiff < 0 ? "▼" : "▲"} ${Math.abs(sleepDiff)} 평소보다`,
      warn: !live && sleepDiff < 0,
    },
    {
      href: "/family/activity",
      label: "활동",
      clay: "steps",
      tone: "green",
      value: live ? "워치 없음" : `${today.steps.toLocaleString("ko-KR")}걸음`,
      note: live ? "워치를 연결하면 보여요" : `${lastWeekSteps?.delta?.startsWith("-") ? "▼" : "▲"} ${String(lastWeekSteps?.delta || "").replace(/^[-+]/, "")} 지난주보다`,
      warn: !live && lastWeekSteps?.delta?.startsWith("-"),
    },
    {
      href: "/family/meds",
      label: "복약",
      clay: "pillHeart",
      tone: "purple",
      value: medPlan.length ? (live ? `${medDone.length}/${medPlan.length}` : `${med7.taken}/${med7.total}`) : "등록 전",
      note: !medPlan.length ? "선생님이 방문 때 등록" : live ? "오늘 드신 것 · 어르신 앱 기록" : `${medDiff < 0 ? "▼" : "▲"} ${Math.abs(medDiff)} 지난주보다`,
      warn: !live && medDiff < 0,
    },
    {
      href: "/family/outing",
      label: "외출 컨디션",
      clay: "cloudSun",
      tone: "beige",
      value: `${repScore}점`,
      note: "주의 · 미세먼지 나쁨",
      src: "케이웨더 · 예시",
    },
  ];

  // 머리 한 줄 — 위험 신호가 있으면 그것부터
  const headline = state.demo.sos
    ? `${josa(subj, "이", "가")} 도움을\n요청했어요`
    : anomaly === "open"
      ? `${subj}께 확인이\n필요해요`
      : live
        ? `${josa(subj, "의", "의")} 오늘\n앱 기록이에요`
        : `${josa(subj, "은", "는")} 오늘\n평소와 같아요`;

  return (
    <>
      <Head>
        <title>가족 앱 — K-CARE</title>
      </Head>
      <FamilyLayout
        title={headline.split("\n").map((l, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {l}
          </span>
        ))}
      >
        {/* 도와줘요 진행 — 팝업을 닫아도 홈 맨 위에 남는다 (2026-10-05) */}
        <HelpCallCard role="guardian" />
        {/* SOS 배너 — 조건부, 최상단. 빨강은 여기 쓴다 (위험 신호) */}
        {state.demo.sos && sosAck === sosKey && (
          <div role="status" className="rounded-[22px] px-4 py-3 text-[14px] font-extrabold" style={{ background: TONE.danger.bg, color: TONE.danger.fg }}>
            SOS 대응 중 · {sosStage}
          </div>
        )}
        {state.demo.sos && sosAck !== sosKey && (
          <div className="animate-sosPulse rounded-[28px] p-[18px] text-white" style={{ background: "#C0392B" }}>
            <div className="text-[13px] font-extrabold tracking-[.1em] opacity-85">긴급 · SOS 수신</div>
            <div className="mt-1 text-[21px] font-black">{josa(subj, "이", "가")} 도움을 요청했습니다</div>
            <div className="mt-0.5 text-[14px] opacity-90">{sosStage}</div>
            <WhiteBtn h={56} r={18} sh="#8E2A1F" color="#C0392B" className="mt-3 w-full text-[17px]" onClick={ackSosHere}>
              확인했습니다
            </WhiteBtn>
            {/* 긴급 화면에서도 목소리를 남긴다 — 도착 전에 닿는 것이 이 버튼의 이유 */}
            <div className="mt-3 border-t border-white/25 pt-3">
              <VoiceNote
                to={honor}
                tone="dark"
                onSend={(secs, clip) => {
                  dispatch({ type: "addVoice", payload: { from: "보호자", to: honor, secs, context: "긴급", clip } });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "음성", text: `보호자 긴급 안부 음성 ${secs}초 — 컨시어지 단말로 전달`, color: "#FF8A80" },
                  });
                }}
              />
              <p className="mt-1.5 text-[12px] leading-[1.6] text-white/75">도착 전까지 급파 중인 컨시어지 단말로도 함께 재생됩니다.</p>
            </div>
          </div>
        )}

        {/* 관제가 보낸 안심방문 리포트 · 컨시어지가 보낸 동행 리포트 — 열어 보기 전까지 위쪽에 (2026-10-02 연동) */}
        {state.visit.ops?.sentAt && state.visit.ops?.viewed !== "열람 완료" && (
          <R d={40} as={Link} href="/report/visit?from=family" className="ds-press flex items-center gap-3.5 rounded-[24px] bg-white p-4" style={{ boxShadow: "0 5px 0 #E6E2DA" }}>
            <Clay name="houseCheck" size={44} />
            <span className="min-w-0 flex-1">
              <b className="block text-[17px] font-extrabold">안심방문 리포트가 도착했어요</b>
              <span className="text-[14px]" style={{ color: "#5E6270" }}>
                관제 검수를 마친 이번 방문 기록 · 눌러서 보기
              </span>
            </span>
            <Line name="chevR" size={22} />
          </R>
        )}
        {state.escort?.sentAt && !state.escort?.viewedAt && (
          <R d={40} as={Link} href="/report/escort?from=family" className="ds-press flex items-center gap-3.5 rounded-[24px] bg-white p-4" style={{ boxShadow: "0 5px 0 #E6E2DA" }}>
            <Clay name="reportDoc" size={44} />
            <span className="min-w-0 flex-1">
              <b className="block text-[17px] font-extrabold">동행 리포트가 도착했어요</b>
              <span className="text-[14px]" style={{ color: "#5E6270" }}>
                컨시어지가 적은 병원 동행 기록 · 눌러서 보기
              </span>
            </span>
            <Line name="chevR" size={22} />
          </R>
        )}

        {/* 컨시어지 체크인 → 보호자 라이브 — 역할 간 실시간 연동 (리포트가 오면 방문이 끝난 것) */}
        {state.visit.checkedIn && !state.demo.sos && !state.visit.ops?.sentAt && (
          <R d={40} className="flex items-center gap-3.5 rounded-[24px] p-4" style={{ background: TONE.green.bg }}>
            <span className="ds-car h-3 w-3 flex-none rounded-full" style={{ background: TONE.green.solid }} />
            <span className="min-w-0">
              <b className="block text-[17px] font-extrabold" style={{ color: "#2A4D33" }}>
                지금 {LIVE_CONCIERGE} 컨시어지가 {subj} 곁에 있어요
              </b>
              <span className="text-[14px] leading-[1.55]" style={{ color: "#3B5A44" }}>
                {/* 실제 체크인 시각 — 고정 '13:50 출발'은 체크인 시각과 어긋났다 (2026-10-02 QA) */}
                {checkinHm ? `${checkinHm} 체크인` : "체크인"} · 방문을 마치고 관제 검수가 끝나면 리포트가 도착합니다
              </span>
            </span>
          </R>
        )}

        {/* 이상 징후 — 낙상 의심 (위험 신호라 빨강). SOS 가 켜져 있으면 숨긴다 (2026-10-02 QA) */}
        {anomaly === "open" && !state.demo.sos && (
          <R d={60} className="flex flex-col gap-3.5 rounded-[28px] p-[18px]" style={{ background: TONE.danger.bg }}>
            <div className="flex items-center gap-3">
              <Clay name="sirenAlert" size={46} />
              <div>
                <div className="text-[14px] font-extrabold" style={{ color: TONE.danger.fg }}>
                  확인이 필요해요 · AI 감지
                </div>
                <div className="text-[22px] font-black" style={{ color: TONE.danger.title }}>
                  새벽 3:12 낙상 의심
                </div>
              </div>
            </div>
            <div className="rounded-[18px] bg-white px-3.5 py-1">
              {[
                ["03:12", "거실 급한 움직임 후 5초 정지"],
                ["03:14", "심박 108 (평소 72)"],
                // 복약은 어르신 앱 체크와 같은 값 — '다 먹었어요'를 누르면 여기서도 바뀐다 (2026-10-02 QA)
                morningMed && [morningMed.time, medDone.includes("아침") ? `아침 약(${morningMed.elderLabel}) 드심` : `아침 약(${morningMed.elderLabel}) 아직 안 드심`],
              ]
                .filter(Boolean)
                .map(([t, txt], i) => (
                  <div key={t} className="flex items-center gap-2.5 py-2.5 text-[15px]" style={i ? { borderTop: "1px solid #F3E2DD" } : undefined}>
                    <b className="ds-num w-[44px] flex-none" style={{ color: TONE.danger.fg }}>
                      {t}
                    </b>
                    <span>{txt}</span>
                  </div>
                ))}
            </div>
            <p className="text-[14px] leading-[1.6]" style={{ color: TONE.danger.sub }}>
              {honor}은 아직 SOS를 누르지 않았습니다. AI는 감지·제안만 하고 조치는 사람이 결정합니다.
            </p>
            <div className="ds-g2" style={{ gap: 10 }}>
              <Btn tone="danger" h={58} className="text-[17px]" onClick={() => dispatch({ type: "demo", payload: { anomaly: "sent" } })}>
                지금 확인 요청
              </Btn>
              <WhiteBtn h={58} sh={TONE.danger.sh} color={TONE.danger.title} className="text-[17px]" onClick={() => dispatch({ type: "demo", payload: { anomaly: "dismissed" } })}>
                괜찮습니다
              </WhiteBtn>
            </div>
          </R>
        )}
        {anomaly === "sent" && (
          <R d={60} className="ds-swap flex items-center gap-3.5 rounded-[28px] p-[18px]" style={{ background: TONE.green.bg }}>
            <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
              <Line name="check" size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[20px] font-extrabold" style={{ color: "#2A4D33" }}>
                확인을 요청했어요
              </div>
              <div className="text-[15px] leading-[1.55]" style={{ color: "#3B5A44" }}>
                관제센터가 안부 전화를 하고, 필요하면 담당 컨시어지가 방문합니다
              </div>
            </div>
          </R>
        )}
        {anomaly === "dismissed" && (
          <R d={60} className="ds-swap flex items-center gap-3 rounded-[22px] bg-white py-3 pl-[18px] pr-3" style={{ boxShadow: "0 4px 0 #E6E2DA" }}>
            <span className="flex-1 text-[16px] font-bold" style={{ color: "#3A3F50" }}>
              알림을 닫았어요
            </span>
            <Btn tone="stone" fill={false} h={46} r={14} px={3} className="px-[18px] text-[15px]" onClick={() => dispatch({ type: "demo", payload: { anomaly: "open" } })}>
              되돌리기
            </Btn>
          </R>
        )}

        {/* 정기 케어가 아닌 트랙(병원 동행 · 회복기 · 생활 대행) — 그 트랙의 오늘 한 줄이 이 화면의 요점이다 (lib/tracks.js) */}
        {track.id !== "elder" && (
          <R d={100}>
            <Card pad={18} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-extrabold" style={{ color: TONE.blue.title }}>
                  {track.home.title}
                </span>
                <Pill bg={TONE.green.bg} fg="#2A4D33">
                  {track.home.badge}
                </Pill>
              </div>
              <p className="text-[17px] font-bold leading-[1.6]">{track.home.line}</p>
            </Card>
          </R>
        )}

        {/* 네 칸 — 누르면 세부 화면 (시안). 트랙에 주간 수치가 없으면(병원 동행 등) 외출만 남는다 */}
        {(has("weekly") || live) && (
          <R d={120} className="ds-g2">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className="ds-tap flex min-h-[150px] flex-col justify-between rounded-[26px] p-4 text-left" style={{ background: TONE[t.tone].bg }}>
                <Clay name={t.clay} size={44} className="ds-ico" />
                <span>
                  <span className="block text-[16px] font-extrabold" style={{ color: TONE[t.tone].title }}>
                    {t.label}
                  </span>
                  <span className="ds-num block text-[26px] font-black leading-[1.2]">{t.value}</span>
                  <span className="block text-[14px] font-bold" style={{ color: t.warn ? "#9A5B1E" : t.tone === "beige" ? "#6E5A4A" : TONE.green.title }}>
                    {t.note}
                  </span>
                  {t.src && <span className="ds-src mt-0.5 block">{t.src}</span>}
                </span>
              </Link>
            ))}
          </R>
        )}
        {/* 테스트 가구 — 어르신 앱이 실제로 남긴 기록 (2026-10-02 UX 점검) */}
        {live && (
          <R d={150} className="flex flex-col gap-2.5 rounded-[26px] bg-white p-4" style={{ boxShadow: "0 5px 0 #E6E2DA" }}>
            <div className="text-[16px] font-extrabold">{honor}이 앱에 남기신 오늘 기록</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["복약 체크", medPlan.length ? `${medPlan.filter((d) => medDone.includes(d.slot)).length}/${medPlan.length}` : "약 등록 전"],
                [
                  "앱 마지막 사용",
                  elderLast.status === "ok" && elderLast.at
                    ? new Date(elderLast.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
                    : elderLast.status === "none"
                      ? "기록 없음"
                      : "—",
                ],
                ["안부 음성", voicesToElder.length ? `들으심 ${heard}/${voicesToElder.length}` : "보낸 것 없음"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[18px] px-2 py-3 text-center" style={{ background: "#F3F1EC" }}>
                  <div className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
                    {k}
                  </div>
                  <div className="ds-num mt-0.5 text-[17px] font-black leading-[1.3]">{v}</div>
                </div>
              ))}
            </div>
            {/* 아직 안 들으신 안부 음성 — 보내기 취소할 수 있다 (2026-10-18 · 들으신 것은 기록으로 남는다) */}
            {unheardSent.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="text-[14px] font-extrabold">아직 안 들으신 안부 음성 {unheardSent.length}개</div>
                {unheardSent.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex flex-col gap-1.5 rounded-[16px] px-3 py-2" style={{ background: "#F3F1EC" }}>
                    <div className="flex items-center gap-2">
                      <span className="ds-num min-w-0 flex-1 text-[14px]">
                        {new Date(v.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} · {Number(v.secs) || 0}초{v.context ? ` · ${v.context}` : ""}
                      </span>
                      {unsendAsk !== v.id && (
                        <button type="button" onClick={() => setUnsendAsk(v.id)} className="min-h-[40px] flex-none text-[14px] font-extrabold underline underline-offset-2" style={{ color: "#5E6270" }}>
                          보내기 취소
                        </button>
                      )}
                    </div>
                    {unsendAsk === v.id && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[14px] leading-[1.5]">이 음성을 거둘까요? {honor} 화면에서 빠집니다. 녹음 파일은 서버에 30일 보관 뒤 지워집니다.</p>
                        <div className="grid grid-cols-[1fr_2fr] gap-2">
                          <WhiteBtn h={44} className="text-[14px]" onClick={() => setUnsendAsk(null)}>
                            그대로 두기
                          </WhiteBtn>
                          <Btn
                            tone="navy"
                            h={44}
                            className="text-[14px]"
                            onClick={() => {
                              dispatch({ type: "unsendVoice", id: v.id, from: "보호자", to: v.to });
                              dispatch({ type: "pushEvent", payload: { kind: "음성", text: `보호자 안부 음성 보내기 취소 (${honor} 듣기 전)`, color: "#8FA9CC" } });
                              setUnsendAsk(null);
                            }}
                          >
                            보내기 취소
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
              워치 · 센서 없이 테스트 중이라 수면 · 걸음 같은 건강 수치는 받지 않습니다.
            </p>
          </R>
        )}

        {/* 오늘 동행 · 담당 컨시어지 — 시안의 '오늘 13:50 순환기내과 진료' 카드. 담당 선생님(신원 · 관계 연속성)을 같이 둔다 */}
        <R d={180}>
          <Card pad={16} className="flex flex-col gap-3.5">
            {todayEv ? (
              <div className="flex items-center gap-3.5">
                <span className="flex h-[62px] w-[62px] flex-none flex-col items-center justify-center rounded-[16px]" style={{ background: TONE[eventTone(todayEv.kind)].bg }}>
                  <span className="text-[13px] font-extrabold" style={{ color: TONE[eventTone(todayEv.kind)].fg }}>
                    오늘
                  </span>
                  <span className="ds-num text-[18px] font-black">{new Date(todayEv.at).toTimeString().slice(0, 5)}</span>
                </span>
                <div className="min-w-0">
                  <div className="text-[19px] font-extrabold leading-[1.3]">{todayEv.title}</div>
                  <div className="text-[15px]" style={{ color: "#5E6270" }}>
                    {todayEv.note || EVENT_KINDS[todayEv.kind]?.label || "일정"}
                    {todayEv.approval === "pending" ? " · 승인 대기" : ""}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[17px] font-extrabold">담당 컨시어지</div>
            )}
            {/* 테스트 가구 — 실제로 앱을 쓰는 컨시어지만. 경력 · 방문 횟수 같은 예시 이력은 쓰지 않는다 */}
            {(() => {
              const team = live
                ? [{ name: LIVE_CONCIERGE, initials: avatarText(LIVE_CONCIERGE), role: "주 담당", career: "안심방문 · 동행", relation: visitStage }]
                : CARE_TEAM.members;
              return (
                <div className="flex items-center gap-2.5">
                  <span className="flex flex-none">
                    {team.map((m, i) => (
                      <Face key={m.name} text={avatarText(m.name)} size={40} bg={i ? TONE.blue.bg : TONE.green.bg} fg={i ? TONE.blue.fg : "#2A4D33"} fontSize={13} style={{ border: "2px solid #FFFFFF", marginLeft: i ? -10 : 0 }} />
                    ))}
                  </span>
                  <span className="min-w-0 text-[15px] font-bold leading-[1.4]" style={{ color: "#3A3F50" }}>
                    {team.map((m) => m.name).join(" · ")} 선생님
                    <span className="block text-[13px] font-medium" style={{ color: "#5E6270" }}>
                      {live ? (centerNow() ? `${LIVE_TAG} 담당 · ${visitStage}` : `테스트 컨시어지 계정 · ${visitStage}`) : `${team[0].career} · ${team[0].relation}`}
                    </span>
                  </span>
                </div>
              );
            })()}
            {live ? (
              <p className="text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
                실시간 위치는 베타에서 받지 않습니다 — 컨시어지가 체크인하면 홈 위쪽에 방문 중 안내가 뜹니다.
              </p>
            ) : (
              <>
                {livePos?.state === "이동중" && (
                  <div className="flex flex-col gap-2">
                    <div className="text-[14px] font-extrabold" style={{ color: "#2A4D33" }}>
                      선생님이 댁으로 가는 중이에요
                    </div>
                    <div className="relative h-2 rounded-[4px]" style={{ background: TONE.green.bg }}>
                      <div className="ds-fill h-full rounded-[4px]" style={{ width: "60%", background: TONE.green.solid }} />
                      <span className="ds-car absolute -top-1.5 -ml-2.5 h-5 w-5 rounded-full border-4 bg-white" style={{ left: "60%", borderColor: TONE.green.solid }} />
                    </div>
                    <div className="flex justify-between text-[12px] font-bold" style={{ color: "#5E6270" }}>
                      <span>출발</span>
                      <span>댁</span>
                    </div>
                  </div>
                )}
                <Btn tone="green" fill={false} h={54} r={16} px={4} className="text-[16px]" style={{ color: "#2A4D33" }} onClick={() => setLiveMap(true)}>
                  위치 보기 — {liveTeam?.name} 선생님
                </Btn>
              </>
            )}
          </Card>
        </R>

        {/* 결제 대기 — 시안은 산호색, 우리는 금색 (빨강 계열은 위험 신호 전용) */}
        {pendingList.length > 0 && (
          <R
            d={220}
            as={Link}
            href="/family/requests"
            className="ds-press ds-tap flex min-h-[88px] items-center gap-3.5 rounded-[24px] px-[18px] py-3.5 text-left"
            style={{ background: TONE.gold.bg, boxShadow: `0 5px 0 ${TONE.gold.sh}` }}
          >
            <span className="ds-ico flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-white" style={{ color: TONE.gold.badge }}>
              <Line name="cardLine" size={28} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[19px] font-extrabold" style={{ color: "#5E4A1E" }}>
                결제 · 수락 대기 {pendingList.length}건
              </b>
              <span className="block truncate text-[15px] font-semibold" style={{ color: TONE.gold.sub }}>
                {pendingList[0].type}
                {pendingList[0].amount > 0 ? ` · ${fmtWon(pendingList[0].amount)}` : ""}
              </span>
            </span>
            <Line name="chevR" size={22} style={{ color: "#5E4A1E" }} />
          </R>
        )}

        {/* 목소리 보내기 — 보라 큰 버튼 (시안). 누르면 녹음, 한 번 더 누르면 보낸다 */}
        <R d={260}>
          <VoiceNote
            to={honor}
            title={`${subj}께 목소리 보내기`}
            sub={`받은 음성 ${fromElder.length}개${unheardFromElder ? ` · 새 음성 ${unheardFromElder}개` : ""}`}
            onSend={(secs, clip) => {
              dispatch({ type: "addVoice", payload: { from: "보호자", to: honor, secs, context: "안부", clip } });
              dispatch({
                type: "pushEvent",
                payload: { kind: "음성", text: `보호자 안부 음성 ${secs}초 — 어르신 화면 가족 탭으로 전달`, color: "#8FE3C0" },
              });
            }}
          />
        </R>

        {/* 어르신이 보낸 음성 — 목소리 보내기 바로 아래 (2026-10-05 요청: "어르신이 보낸 메세지 자체를 볼 수 있는 본문 테이블에서
            안부 음성 남기기 밑으로"). 받은 것이 없어도 자리는 남긴다. 주 보호자와 '가족 모두'에게 온 것 */}
        <R d={280}>
          <Card pad={16} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="m-0 text-[18px] font-extrabold">{honor}이 보낸 음성</h2>
              <span className="text-[13px] font-extrabold" style={{ color: unheardFromElder ? TONE.gold.fg : "#5E6270" }}>
                {unheardFromElder ? `새 음성 ${unheardFromElder}건` : fromElder.length ? `모두 ${fromElder.length}건` : ""}
              </span>
            </div>
            {fromElder.length === 0 ? (
              <p className="rounded-[16px] px-3.5 py-3 text-[14px] leading-[1.6]" style={{ background: "#F3F1EC", color: "#5E6270" }}>
                아직 받은 음성이 없습니다. {honor}이 어르신 앱 가족 탭에서 목소리를 보내시면 여기에 쌓입니다.
              </p>
            ) : (
              <table className="w-full text-left text-[14px]">
                <caption className="sr-only">{honor}이 보낸 음성 목록</caption>
                <thead>
                  <tr className="text-[12px]" style={{ color: "#5E6270" }}>
                    <th scope="col" className="py-1.5 font-bold">
                      받은 때
                    </th>
                    <th scope="col" className="py-1.5 font-bold">
                      내용
                    </th>
                    <th scope="col" className="py-1.5 text-right font-bold">
                      <span className="sr-only">듣기</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(elderVoicesAll ? fromElder : fromElder.slice(0, 5)).map((v) => {
                    const heardIt = !!state.guardian?.voiceHeard?.[v.id];
                    const pk = `g-${v.id}`;
                    return (
                      <tr key={v.id} style={{ borderTop: "1px solid #F0ECE4" }}>
                        <td className="ds-num whitespace-nowrap py-2.5 pr-2 align-middle font-extrabold">{whenLabel(v.at)}</td>
                        <td className="py-2.5 pr-2 align-middle">
                          목소리 {v.secs}초{v.to === "가족 모두" ? " · 가족 모두에게" : ""}
                          {!heardIt && (
                            <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
                              새
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => {
                              const markHeard = () => {
                                if (heardIt) return;
                                dispatch({ type: "guardianPatch", patch: { voiceHeard: { ...(state.guardian?.voiceHeard || {}), [v.id]: true } } });
                                dispatch({ type: "pushEvent", payload: { kind: "음성", text: `보호자가 ${honor} 목소리 ${v.secs}초 청취`, color: "#8FA9CC" } });
                              };
                              // 녹음이 있는 것은 소리를 내고, 녹음 기능 전 기록은 들은 표시만 한다
                              if (v.clip) player.play(pk, { clip: v.clip }, { onStart: markHeard });
                              else markHeard();
                            }}
                            aria-pressed={player.playing === pk}
                            aria-label={player.playing === pk ? `${whenLabel(v.at)} 목소리 멈추기` : heardIt ? `${whenLabel(v.at)} 목소리 다시 듣기` : `${whenLabel(v.at)} 목소리 ${v.secs}초 듣기`}
                            className="ds-press ds-btn3d min-h-[40px] whitespace-nowrap rounded-full px-3.5 text-[13px]"
                            style={heardIt ? { background: TONE.green.bg, color: "#2A4D33", boxShadow: `0 3px 0 ${TONE.green.sh}` } : { background: TONE.purple.solid, color: "#FFFFFF", boxShadow: `0 3px 0 ${TONE.purple.solidSh}` }}
                          >
                            {player.playing === pk ? "■ 멈추기" : player.busy === pk ? "받는 중" : heardIt ? (v.clip ? "▶ 다시 듣기" : "✓ 들었어요") : "▶ 듣기"}
                          </button>
                          {player.failed?.key === pk && (
                            <span role="alert" className="mt-1 block text-[12px] font-bold leading-[1.4]" style={{ color: TONE.gold.fg }}>
                              {playErrorText(player.failed.code)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {fromElder.length > 5 && (
              <WhiteBtn h={44} r={14} className="text-[14px]" style={{ background: "#F3F1EC" }} onClick={() => setElderVoicesAll((x) => !x)}>
                {elderVoicesAll ? "최근 5건만 보기" : `전체 ${fromElder.length}건 보기`}
              </WhiteBtn>
            )}
            {/* 보호자가 보낸 것 + 컨시어지가 '보호자 동시 공유'로 보낸 것 — 전달 기록 */}
            {state.voices.filter((v) => v.from === "보호자" || v.shareGuardian).length > 0 && (
              <div className="flex flex-col gap-1 pt-1" style={{ borderTop: "1px solid #F0ECE4" }}>
                {state.voices
                  .filter((v) => v.from === "보호자" || v.shareGuardian)
                  .slice(0, 3)
                  .map((v) => (
                    <div key={v.id} className="flex items-center gap-2 pt-1 text-[13px]">
                      <span className="ds-num font-extrabold">{new Date(v.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                      <span className="min-w-0 flex-1" style={{ color: "#5E6270" }}>
                        {v.from} → {v.to} · {v.secs}초{v.context === "긴급" ? " · 긴급" : ""}
                      </span>
                      <span className="font-extrabold" style={{ color: TONE.green.title }}>
                        전달됨
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <p className="text-[12px] leading-[1.5]" style={{ color: "#5E6270" }}>
              {live ? "녹음은 30일 동안 보관하고, 같은 가구(센터) 계정만 들을 수 있습니다. 녹음 기능 전에 남은 기록은 길이만 보입니다." : "데모 — 이 기기에서 방금 녹음한 것만 소리가 납니다 (새로고침하면 사라집니다)."}
            </p>
          </Card>
        </R>

        {/* 다가오는 일정 — 어르신과 같은 캘린더 (REQ-02). 승인 대기 건은 '승인 대기' */}
        <R d={300}>
          <Card pad={0} className="px-4 py-1.5">
            <div className="flex items-center justify-between pb-1.5 pt-3">
              <h2 className="m-0 text-[18px] font-extrabold">다가오는 일정</h2>
              <Link href="/family/calendar" className="flex min-h-[44px] items-center text-[14px] font-bold" style={{ color: "#5E6270" }}>
                전체 ›
              </Link>
            </div>
            {laterEvents.length === 0 ? (
              <p className="pb-3.5 text-[14px]" style={{ color: "#5E6270" }}>
                잡힌 일정이 없습니다. 예약 탭에서 등록할 수 있어요.
              </p>
            ) : (
              laterEvents.map((e, i) => {
                const d = new Date(e.at);
                const tn = TONE[eventTone(e.kind)];
                return (
                  <div key={e.id} className="flex items-center gap-3.5 py-3" style={i ? { borderTop: "1px solid #F0ECE4" } : undefined}>
                    <span className="flex h-[52px] w-[52px] flex-none flex-col items-center justify-center rounded-[14px]" style={{ background: tn.bg }}>
                      <span className="text-[11px] font-extrabold" style={{ color: tn.title }}>
                        {d.getMonth() + 1}월
                      </span>
                      <span className="ds-num text-[19px] font-black leading-none">{d.getDate()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[17px] font-extrabold">{e.title}</div>
                      <div className="truncate text-[14px]" style={{ color: "#5E6270" }}>
                        {d.toTimeString().slice(0, 5)} · {e.note || EVENT_KINDS[e.kind]?.label || "일정"}
                      </div>
                    </div>
                    {e.approval === "pending" && (
                      <Pill bg={TONE.gold.bg} fg={TONE.gold.fg}>
                        승인 대기
                      </Pill>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </R>

        {/* 우리 동네 소식 · AI 케어 어시스턴트 — 접어 둔다 (있으면 챙기는 정보) */}
        {has("feed") && (
          <details className="ds-acc ds-r" style={{ "--d": "320ms" }}>
            <summary>
              <span className="ic" style={{ background: TONE.beige.bg }}>
                <Line name="bell" size={20} style={{ color: TONE.beige.fg }} />
              </span>
              <span className="tt">
                우리 동네 소식 <span className="text-[14px] font-bold" style={{ color: "#5E6270" }}>{NEIGHBORHOOD_FEED.length}건 · 예시</span>
              </span>
              <span className="cv">
                <Line name="chevD" size={22} />
              </span>
            </summary>
            <div className="ds-accbody">
              <NeighborhoodFeed
                onApply={(item) =>
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "정책", text: `${item.title} — 신청 대행 요청 접수`, color: "#F0D9A8" },
                  })
                }
              />
            </div>
          </details>
        )}
        {has("assistant") && (
          <details className="ds-acc ds-r" style={{ "--d": "340ms" }}>
            <summary>
              <span className="ic" style={{ background: TONE.blue.bg }}>
                <Line name="chatLines" size={20} style={{ color: TONE.blue.fg }} />
              </span>
              <span className="tt">
                AI 케어 어시스턴트 <span className="text-[14px] font-bold" style={{ color: "#5E6270" }}>{AI_ASSISTANT_QA.length}가지 질문</span>
              </span>
              <span className="cv">
                <Line name="chevD" size={22} />
              </span>
            </summary>
            <div className="ds-accbody">
              <p className="text-[13px]" style={{ color: "#5E6270" }}>
                수집된 기록에서만 답합니다 · 의료 판단이 아닙니다
              </p>
              <div className="flex flex-wrap gap-2">
                {AI_ASSISTANT_QA.map((qa) => (
                  <button
                    key={qa.q}
                    type="button"
                    onClick={() => askAssistant(qa)}
                    aria-pressed={askAi?.q === qa.q}
                    className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-bold"
                    style={askAi?.q === qa.q ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#1B2340", boxShadow: "0 3px 0 #E3DED3" }}
                  >
                    {qa.q}
                  </button>
                ))}
              </div>
              {askAi && (
                <div className="ds-swap rounded-[18px] bg-white p-3.5">
                  {askAi.loading ? (
                    <p className="text-[15px]" style={{ color: "#5E6270" }}>
                      기록을 확인하고 있어요…
                    </p>
                  ) : (
                    <>
                      <p className="text-[15px] leading-[1.75]">{askAi.a}</p>
                      <p className="mt-2 pt-2 text-[12px] font-bold" style={{ borderTop: "1px solid #F0ECE4", color: "#5E6270" }}>
                        근거: {askAi.src}
                      </p>
                    </>
                  )}
                </div>
              )}
              <p className="text-[12px]" style={{ color: "#5E6270" }}>
                이상 징후는 사람이 확인 후 알립니다 (8.4)
              </p>
            </div>
          </details>
        )}

        {/* 시연 컨트롤 — 데모 전용. 테스트 가구에서는 숨긴다 (가짜 SOS · 이상 징후가 모든 폰에 퍼진다) */}
        {!live && (
          <div className="text-center">
            <button type="button" onClick={() => setDemoOpen((v) => !v)} className="tap text-[13px] font-bold underline underline-offset-2" style={{ color: "#8F8A7E" }}>
              시연 컨트롤 {demoOpen ? "닫기" : "열기"}
            </button>
            {demoOpen && (
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "demo", payload: state.demo.sos ? { sos: false } : { sos: true, sosAt: Date.now() } });
                    // 감사 로그(관제 티커)에도 남긴다 — 어르신 SOS 와 같은 줄 모양 (2026-10-02 QA)
                    dispatch({
                      type: "pushEvent",
                      payload: state.demo.sos
                        ? { kind: "SOS", text: "SOS 알림 끔 (시연 컨트롤)", color: "#8FA9CC" }
                        : { kind: "SOS", text: `${elderWho()} SOS 발신 (시연 컨트롤) · 가족·관제 동시 점등`, color: "#FF8A80" },
                    });
                  }}
                  className="min-h-[40px] rounded-[12px] bg-white px-3 text-[13px] font-bold"
                  style={{ boxShadow: "0 3px 0 #E3DED3", color: "#5E6270" }}
                >
                  SOS {state.demo.sos ? "해제" : "발생"}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "demo", payload: { anomaly: "open" } })}
                  className="min-h-[40px] rounded-[12px] bg-white px-3 text-[13px] font-bold"
                  style={{ boxShadow: "0 3px 0 #E3DED3", color: "#5E6270" }}
                >
                  이상 징후 재현
                </button>
              </div>
            )}
          </div>
        )}

        {/* 오늘 오시는 컨시어지 위치 — '위치 보기'가 연다 (2026-08-31 요청) */}
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

// 우리 동네 소식 — 동·구 단위 재난·안전·정책·바우처. 자동 수집 연동은 아직 붙지 않았다 — 그렇게 쓴다 (2026-08-12 대표 질문)
function NeighborhoodFeed({ onApply }) {
  const [applied, setApplied] = useState({});
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
        자동 수집 연동 대기 — 현재는 관제가 확인한 공고만 게시합니다
      </p>
      {NEIGHBORHOOD_FEED.map((n, i) => (
        <div key={n.id} className="pt-3" style={i ? { borderTop: "1px solid #E3DED3" } : { paddingTop: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ color: FEED_TONE[n.tone].fg, background: FEED_TONE[n.tone].bg }}>
              {n.kind}
            </span>
            <span className="text-[15px] font-extrabold leading-[1.4]">{n.title}</span>
            <span className="ml-auto text-[12px]" style={{ color: "#5E6270" }}>
              {n.at}
            </span>
          </div>
          <p className="mt-1 text-[14px] leading-[1.65]" style={{ color: "#5E6270" }}>
            {n.body}
          </p>
          {n.action && (
            <button
              type="button"
              onClick={() => {
                if (applied[n.id]) return;
                setApplied((v) => ({ ...v, [n.id]: true }));
                onApply(n);
              }}
              disabled={!!applied[n.id]}
              className="ds-press mt-2 min-h-[44px] rounded-[14px] px-3.5 text-[14px] font-bold"
              style={applied[n.id] ? { background: TONE.green.bg, color: "#2A4D33" } : { background: "#FFFFFF", color: "#1B2340", boxShadow: "0 3px 0 #E3DED3" }}
            >
              {applied[n.id] ? "요청됨 — 컨시어지가 서류까지 대행합니다" : n.action}
            </button>
          )}
        </div>
      ))}
      <p className="text-[12px] leading-[1.7]" style={{ color: "#5E6270" }}>
        행정안전부 재난문자 · 구청 복지 공고 기준 — 해당하는 것만 골라 알려드립니다.
      </p>
    </div>
  );
}
