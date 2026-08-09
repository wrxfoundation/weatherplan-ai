import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AI_CALL,
  ASK_DOCTOR,
  DELIVERY,
  ELDER,
  ELDER_NOW,
  ELDER_VISITORS,
  EVENT_KINDS,
  FAMILY_SEEN,
  INDOOR,
  MED_DOSES,
  OUTING,
  VOICE_MSG,
  VOICE_TO,
  ASK_SERVICES,
} from "../lib/mock";
import { PRICING, fmtWon } from "../lib/config";
import { ELDER_STORE_PICKS } from "../lib/store";
import { needsGuardianApproval, useAppState } from "../lib/state";
import Icon from "../components/icons";
import Splash from "../components/Splash";

// 사용자(어르신) 홈 — 핸드오프 06 elder 상세 명세 + REQ-01(우선 날씨) + REQ-06(SOS 오작동 방지)
// 구조: 헤더(날짜·인사)·푸터(SOS·전화·탭) 고정, 카드 스택만 스크롤 (06 §1).
// 카드는 언마운트 없이 display 전환 + CSS order 정렬 (06 §2).
// 접근성(타협 불가): 본문 19px 하한(예외 18px 3곳), 버튼 패딩 24~30px, 탭 60px, 색+텍스트 병행.
// 1회성 잠금(med·cooled·askAdded)에 undo 없음 — 의도된 설계, "버그"로 고치지 말 것 (06 §5).

const LEVEL_COLOR = {
  ok: "#1E7A5A",
  caution: "#8A5D12",
  danger: "#C0392B",
  neutral: "#40413F",
};

// 밝은 카드 기본형 · 내부 서브카드 (06 §3 공통 스타일)
const LIGHT_CARD = {
  background: "linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.74))",
  border: "1px solid rgba(255,255,255,.92)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(10,31,60,.08), 0 20px 40px -30px rgba(10,31,60,.5)",
};
const SUB_CARD = {
  borderRadius: 14,
  padding: "14px 15px",
  background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
};

// 해주세요 — 그룹 순서 (ASK_SERVICES의 g 값)
const ASK_GROUPS = ["약 · 병원", "장보기", "집안일", "바깥일", "말동무"];

const TABS = [
  { key: "today", label: "오늘", glyph: "home" },
  { key: "health", label: "건강", glyph: "heart" },
  { key: "ask", label: "해주세요", glyph: "hand" },
  { key: "family", label: "가족", glyph: "users" },
];

// "김순자" → "순자" — 성 포함 호칭 금지 (06 §1 헤더 카피)
function givenName(full) {
  return full && full.length >= 3 ? full.slice(1) : full || "";
}

// 24시간제 금지 — "오후 2시 30분" 구어 표기 (06 §7)
function spokenTime(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const mer = h < 12 ? "오전" : "오후";
  const h12 = h % 12 || 12;
  return m === 0 ? `${mer} ${h12}시` : `${mer} ${h12}시 ${m}분`;
}

function spokenDay(ts) {
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function isToday(ts) {
  const a = new Date(ts);
  const b = new Date();
  return a.toDateString() === b.toDateString();
}

// 카드 래퍼 — display 전환(언마운트 없음) + order 정렬 (06 §2)
function ElderCard({ show, order, style, className = "", children }) {
  return (
    <section
      className={`shrink-0 rounded-[20px] p-5 ${className}`}
      style={{ order, display: show ? undefined : "none", ...(style || LIGHT_CARD) }}
    >
      {children}
    </section>
  );
}

// 표준 어르신 액션 버튼 — 톤앤매너 통일: p-7(28px) · 22px/700 · rounded-2xl · btn-elder 그림자.
// 색은 의미 3종만 쓴다: primary(네이비 · 기본 행동) / success(초록 · 복약·주문) /
// cool(청색 · 냉방 전용 — 빨강은 SOS 전용). 완료 후엔 전부 done(흰 바탕·회색 글자)으로 감쇠.
const ELDER_BTN = {
  primary: { background: "#0A1F3C", color: "#FFFFFF" },
  success: { background: "#1E7A5A", color: "#FFFFFF" },
  cool: { background: "#2F5D8A", color: "#FFFFFF" },
  done: { background: "rgba(255,255,255,.85)", color: "#5C5A54" },
};
function ElderBtn({ variant = "primary", lines, className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={`btn-elder w-full rounded-2xl p-7 text-[22px] font-bold ${className}`}
      style={ELDER_BTN[variant]}
    >
      {lines
        ? lines.map((l) => (
            <span key={l} className="block leading-[1.35]">
              {l}
            </span>
          ))
        : children}
    </button>
  );
}

function CardHead({ title, titleColor = "#0A1F3C", right, rightColor = "#5C5A54" }) {
  // 제목과 보조 라벨이 한 줄에 안 들어가면 보조 라벨을 아래로 내린다.
  // 붙여 두면 좁은 화면에서 제목이 "부탁하시면 저희가 / 합니다"처럼 어색하게 끊긴다.
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <div className="min-w-0 text-[19px] font-bold" style={{ color: titleColor }}>
        {title}
      </div>
      {right && (
        <div className="text-[19px] font-medium leading-[1.4]" style={{ color: rightColor }}>
          {right}
        </div>
      )}
    </div>
  );
}

export default function ElderHome() {
  const { state, dispatch } = useAppState();
  const [tab, setTabRaw] = useState("today"); // elderTab — 기본 'today'
  const scrollRef = useRef(null);
  // 카드는 언마운트하지 않지만, 탭 전환 시 스크롤은 맨 위로 — 카드 상단이 잘려 보이지 않게
  const setTab = (k) => {
    setTabRaw(k);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const [sosPhase, setSosPhase] = useState("idle"); // idle | confirm | sent
  const [calling, setCalling] = useState(false);
  const [voiceReplied, setVoiceReplied] = useState(false);
  const [eventSheet, setEventSheet] = useState(false); // 간단등록 (REQ-02 권한표)
  const [speaking, setSpeaking] = useState(false); // 일정 음성 안내 (접근성)

  // 소리로 듣기 — 브라우저 내장 TTS. 어르신 카피 규칙: 시스템 주어 없이, 말하듯이
  const speakNext = (ev) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = `${isToday(ev.at) ? "오늘" : spokenDay(ev.at)} ${spokenTime(ev.at)}, ${ev.title}. ${ev.note || ""}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  const [storeSel, setStoreSel] = useState({});
  const [storeSent, setStoreSent] = useState(null); // 'approval' | 'ordered'
  const [voiceTo, setVoiceTo] = useState(null); // 음성 메시지 수신자 (null이면 미선택)
  const [voiceSent, setVoiceSent] = useState([]); // 보낸 목소리 목록 (최근 순)
  const [askSel, setAskSel] = useState(null); // '해주세요' 선택 항목
  const [askSent, setAskSent] = useState(null); // { name, mode, amount }
  const callTimer = useRef(null);

  const { medTaken, cooled, voicePlayed, askAdded } = state.elder;
  const cart = state.demo.cart;

  // ── 해주세요: 결제권한(REQ-07)을 어르신 말로 옮긴다 ──
  // 결제 모드는 온보딩에서 정해진 값을 그대로 따른다. 여기서 바꾸지 않는다.
  const payMode = state.onboarding?.paymentMode || "limit";
  const payLimit = state.onboarding?.limitAmount ?? PRICING.paymentLimitDefault;
  const approver = (state.onboarding?.guardianName || "아들 민수").replace(/^아들 |^차녀 |^삼남 /, "");
  const payRule = {
    approver,
    headline: {
      limit: `${fmtWon(payLimit)}까지는 바로 해드리고, 그보다 크면 ${approver} 님이 확인해 줍니다.`,
      both: "어르신도 가족도 바로 결제할 수 있습니다.",
      guardianOnly: `${approver} 님이 확인해 주면 바로 시작합니다.`,
      elderOnly: "어르신이 직접 결제하십니다.",
    }[payMode],
    sub: "약 타다 주기 · 장보기 · 은행 동행 같은 것을 부탁하시면 선생님이 대신 해드립니다.",
  };
  // 선택 항목의 결제 분기 — 무료(멤버십 포함) / 본인 결제 / 보호자 승인
  const askPlan = (() => {
    if (!askSel) return { mode: null, approval: false, notice: "", cta: "" };
    if (askSel.est === 0) {
      return { mode: "free", approval: false, notice: "멤버십에 포함된 것이라 따로 내실 돈이 없습니다.", cta: "부탁하기" };
    }
    const approval = needsGuardianApproval(state.onboarding, askSel.est);
    return approval
      ? { mode: "approval", approval: true, notice: `${approver} 님에게 확인을 부탁드립니다. 승인되면 바로 시작합니다.`, cta: "가족에게 부탁하기" }
      : { mode: "self", approval: false, notice: `${fmtWon(payLimit)} 안이라 바로 진행됩니다.`, cta: "바로 부탁하기" };
  })();
  const myRequests = (state.requests || []).filter((r) => r.dir === "fromElder");

  const name = givenName(state.onboarding?.elderName || ELDER.name);
  const now = new Date();
  const dateLong = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // REQ-02 공유 캘린더에서 다음 일정 바인딩
  const upcoming = [...state.events].sort((a, b) => a.at - b.at).filter((e) => e.at > Date.now());
  const next = upcoming[0];

  // REQ-01 — 보호자가 설정한 우선 요소를 그리드 앞으로 (자동 추론 아님)
  const priority = state.priority;
  const nowFactors = [...ELDER_NOW.factors].sort(
    (a, b) =>
      (priority.factors.includes(b.label) ? 1 : 0) - (priority.factors.includes(a.label) ? 1 : 0)
  );

  // 오늘 약 — 저녁 1건만 상태 의존 (done: null → medTaken)
  const doses = MED_DOSES.map((d) => ({ ...d, done: d.done === null ? medTaken : d.done }));
  const doneCount = doses.filter((d) => d.done).length;
  const medProgress = `${doses.length}회 중 ${doneCount}회 완료`;

  const indoor = cooled ? INDOOR.cooled : INDOOR.hot;

  useEffect(() => () => clearTimeout(callTimer.current), []);

  const callTeacher = () => {
    if (calling) return;
    setCalling(true);
    callTimer.current = setTimeout(() => setCalling(false), 2600);
  };

  return (
    <>
      <Head>
        <title>어르신 홈 — K-CARE</title>
      </Head>
      <Splash service="elder" />
      <div className="min-h-screen bg-nav">
        {/* break-keep: 한국어 어절 단위 줄바꿈 — 카피 개행(<br/>)과 병용 (06 §6) */}
        <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col break-keep bg-elder px-4 min-[380px]:px-[22px]">
          {/* ── 고정 헤더: 날짜 · 인사 ── */}
          <header className="shrink-0 pt-6">
            <div className="flex items-center justify-between">
              <span className="font-num text-[12px] font-bold tracking-[.16em] text-gold">
                K-CARE
              </span>
              <Link href="/" className="tap text-[13px] font-bold text-muted/50">
                데모 홈
              </Link>
            </div>
            <div className="mt-2 text-[19px] font-medium text-muted">{dateLong}</div>
            <h1 className="text-[30px] font-black leading-[1.3] text-navy">
              {name} 어르신, 안녕하세요
            </h1>
            {/* SOS는 화면 최상단 고정 — 카드가 어디까지 내려가 있든 항상 처음 보이는 자리 (REQ-06) */}
            <div className="mt-3.5">
              <SosButton
                phase={sosPhase}
                setPhase={setSosPhase}
                onDispatch={() => {
                  dispatch({ type: "demo", payload: { sos: true } });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "SOS", text: "김순자(78) SOS 발신 · 가족·관제 동시 점등", color: "#FF8A80" },
                  });
                }}
              />
            </div>
          </header>

          {/* ── 카드 스택 (유일한 스크롤 영역) ── */}
          <main
            ref={scrollRef}
            className="elder-scroll -mx-2 mt-4 flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-2 pb-5"
          >
            {/* order 0 · 오늘 찾아뵙는 분 — 방문 사기 방어. 유일한 2px 테두리 */}
            <ElderCard
              show={tab === "today"}
              order={0}
              style={{ ...LIGHT_CARD, border: "2px solid #B08D57" }}
            >
              <div className="text-[19px] font-bold text-[#7A5C28]">오늘 찾아뵙는 분</div>
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                두 분이 함께 옵니다.
                <br />문 열기 전에 얼굴을 확인하세요.
              </p>
              <div className="mt-3 space-y-2.5">
                {ELDER_VISITORS.map((v) => (
                  <div key={v.displayName} className="flex items-center gap-4" style={SUB_CARD}>
                    <span
                      className="flex h-[56px] w-[56px] shrink-0 items-center justify-center whitespace-nowrap rounded-full text-[15px] font-bold"
                      style={{ background: v.avBg, color: v.avFg }}
                    >
                      {v.initials}
                    </span>
                    <div>
                      <div className="text-[22px] font-bold text-navy">{v.displayName}</div>
                      <div className="mt-[3px] text-[19px] text-muted">{v.relationLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* "노란 버튼" 카피 → 빨간 SOS로 수정 (06 §10-7 미해결 항목 해소) */}
              <p className="mt-4 text-[19px] leading-[1.6] text-muted">
                두 분 다 목에 K-CARE 이름표를 걸고 옵니다. 이름이 다르면 문을 열지 마시고 맨 위
                빨간 SOS 버튼을 누르세요.
              </p>
            </ElderCard>

            {/* order 1 · 오늘 일정 — 유일한 네이비 다크 카드 */}
            {next && (
              <ElderCard
                show={tab === "today"}
                order={1}
                style={{
                  background: "#0A1F3C",
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0))",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.22), inset 0 -1px 0 rgba(0,0,0,.3), 0 24px 48px -30px rgba(10,31,60,.85)",
                }}
                className="text-white"
              >
                <div className="text-[19px] font-bold text-gold">
                  {isToday(next.at) ? "오늘 일정" : "다음 일정"}
                </div>
                <div className="mt-1 text-[26px] font-bold leading-[1.4]">
                  {!isToday(next.at) && (
                    <>
                      {spokenDay(next.at)}
                      <br />
                    </>
                  )}
                  {spokenTime(next.at)}
                  <br />
                  {next.title}
                </div>
                {next.note && (
                  <p className="mt-2 text-[19px] leading-[1.6] text-white/[.86]">{next.note}</p>
                )}
                <button
                  onClick={() => speakNext(next)}
                  aria-label="오늘 일정을 소리로 들려드립니다"
                  className="btn-elder mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl py-[18px] text-[22px] font-bold text-white"
                  style={{
                    background: "#1B7F79",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.28), 0 10px 22px -14px rgba(27,127,121,.7)",
                  }}
                >
                  <Icon name="speaker" size={26} strokeWidth={2} />
                  {speaking ? "그만 듣기" : "소리로 듣기"}
                </button>
              </ElderCard>
            )}

            {/* order 1 · 다가오는 일정 — 조회 + 간단등록 (REQ-02 어르신 권한: 조회·알림확인·간단등록) */}
            <ElderCard show={tab === "today"} order={6}>
              <CardHead title="다가오는 일정" />
              <div className="mt-1">
                {upcoming.slice(1, 3).map((e) => (
                  <div key={e.id} className="border-t border-navy/[.07] py-[14px] first:border-t-0">
                    <div className="text-[20px] font-bold text-navy">
                      {spokenDay(e.at)} {spokenTime(e.at)}
                    </div>
                    <div className="mt-[3px] text-[19px] text-muted">
                      {e.title} · {EVENT_KINDS[e.kind].label}
                    </div>
                  </div>
                ))}
                {upcoming.length <= 1 && (
                  <p className="py-3 text-[19px] text-muted">더 잡힌 일정이 없습니다.</p>
                )}
              </div>
              <ElderBtn className="mt-2" onClick={() => setEventSheet(true)}>
                일정 하나 남기기
              </ElderBtn>
            </ElderCard>

            {/* order 2 · 안부 전화 — 앰비언트 AI. 어르신은 받기만 하면 된다.
                버튼 없음 · 시스템 주어(AI가~) 없음 (06 §7). 발언은 질문·리포트에 자동 반영 */}
            <ElderCard show={tab === "today"} order={2}>
              <CardHead title="안부 전화" right={AI_CALL.timeLabel} />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                {AI_CALL.body.split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <div className="mt-3" style={SUB_CARD}>
                <p className="text-[19px] leading-[1.6] text-ink">{AI_CALL.yesterday}</p>
              </div>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">{AI_CALL.autoNote}</p>
            </ElderCard>

            {/* order 2 · 오늘 약 — 카드 전체가 미완료 상태 표현. 미완료는 호박색 (원칙 4) */}
            <ElderCard
              show={tab === "health"}
              order={2}
              style={{
                background: medTaken
                  ? LIGHT_CARD.background
                  : "linear-gradient(180deg,#FFF7E8,#FBEFD8)",
                border: medTaken ? LIGHT_CARD.border : "1px solid rgba(138,93,18,.3)",
                boxShadow: LIGHT_CARD.boxShadow,
              }}
            >
              <CardHead title="오늘 약" right={medProgress} />
              <div className="mt-1">
                {doses.map((d) => (
                  <div
                    key={d.slotLabel}
                    className="flex items-center gap-3 border-t border-navy/[.07] py-[14px] first:border-t-0"
                  >
                    <span className="w-[62px] shrink-0 font-num text-[19px] font-bold text-navy">
                      {d.slotLabel}
                    </span>
                    <span className="flex-1 text-[19px] text-ink">{d.drugs}</span>
                    <span
                      className="text-[18px] font-bold"
                      style={{ color: d.done ? LEVEL_COLOR.ok : LEVEL_COLOR.caution }}
                    >
                      {d.done ? "완료" : "남음"}
                    </span>
                  </div>
                ))}
              </div>
              <ElderBtn
                onClick={() => {
                  if (medTaken) return; // 1회성 — undo 없음
                  dispatch({ type: "medTaken" });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "복약", text: "김순자 저녁 복약 완료 · 가족 앱 준수율 갱신", color: "#4ADE80" },
                  });
                }}
                disabled={medTaken}
                variant={medTaken ? "done" : "success"}
                className="mt-2"
              >
                {medTaken ? "오늘 약 모두 드셨습니다" : "저녁 약 먹었어요"}
              </ElderBtn>
            </ElderCard>

            {/* order 3 · 지금 집 안 — 위험을 직접 말하는 유일한 카드. 버튼은 청색(빨강은 SOS 전용) */}
            <ElderCard show={tab === "health"} order={3}>
              <CardHead title="지금 집 안" right="실내 · 거실 센서" />
              <div className="mt-2 flex items-end gap-3">
                <span
                  className="font-num text-[44px] font-bold leading-none"
                  style={{ color: cooled ? "#0A1F3C" : "#C0392B" }}
                >
                  {indoor.tempLabel}
                </span>
                <span className="pb-1 text-[19px] text-muted">{indoor.sub}</span>
              </div>
              <div
                className="mt-4 rounded-[14px] px-[17px] py-4"
                style={{
                  background: cooled ? "rgba(30,122,90,.08)" : "rgba(192,57,43,.07)",
                  border: cooled
                    ? "1px solid rgba(30,122,90,.26)"
                    : "1px solid rgba(192,57,43,.25)",
                }}
              >
                <div
                  className="text-[19px] font-bold"
                  style={{ color: LEVEL_COLOR[indoor.level] }}
                >
                  {indoor.alertTitle}
                </div>
                <p className="mt-1 text-[19px] leading-[1.6] text-ink">{indoor.alertBody}</p>
              </div>
              {/* 냉방 + 가족 알림을 한 버튼이 동시에 — 선택지를 늘리지 않는다 (2행 레이블) */}
              <ElderBtn
                onClick={() => {
                  if (cooled) return; // 1회성
                  dispatch({ type: "elderPatch", patch: { cooled: true } });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "환경", text: "김순자 자택 실내 31° → 냉방 가동 · 가족 알림", color: "#FF8A80" },
                  });
                }}
                disabled={cooled}
                variant={cooled ? "done" : "cool"}
                className="mt-4"
                lines={indoor.btnLines}
              />
            </ElderCard>

            {/* order 4 · 오늘 여쭤볼 것 — 인지 부담 면제. 출처 3종 투명 표기 */}
            <ElderCard show={tab === "today"} order={4}>
              <div className="text-[19px] font-bold text-navy">오늘 여쭤볼 것</div>
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                잊으셔도 됩니다.
                <br />
                선생님이 대신 여쭤봅니다.
              </p>
              <div className="mt-1">
                {ASK_DOCTOR.map((q) => (
                  <div
                    key={q.seq}
                    className="flex gap-3 border-t border-navy/[.07] py-[14px] first:border-t-0"
                  >
                    <span className="w-[22px] shrink-0 font-num text-[19px] font-bold text-gold">
                      {q.seq}
                    </span>
                    <div>
                      <div className="text-[20px] leading-[1.5] text-ink">{q.text}</div>
                      <div className="mt-[5px] text-[18px] text-muted">{q.sourceLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* 음성이 1차 입력 수단 — 키보드 입력 UI 금지 */}
              <ElderBtn
                onClick={() => {
                  if (askAdded) return; // 1회성
                  dispatch({ type: "elderPatch", patch: { askAdded: true } });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "어르신", text: "진료 질문 1건 추가 · 컨시어지 전달", color: "#B08D57" },
                  });
                }}
                disabled={askAdded}
                variant={askAdded ? "done" : "primary"}
                className="mt-2"
              >
                {askAdded ? "말씀하신 내용이 담겼습니다" : "말로 하나 더 남기기"}
              </ElderBtn>
            </ElderCard>

            {/* order 4 · 병원 가는 길 — F8 2구간. 점수를 문장으로 번역하는 유일한 화면 */}
            <ElderCard show={tab === "today"} order={3}>
              <div className="text-[19px] font-bold text-navy">병원 가는 길</div>
              <div className="mt-3 space-y-2.5">
                {OUTING.legs.map((l) => (
                  <div key={l.tag} style={SUB_CARD}>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[19px] font-bold tracking-[.04em] text-muted">
                        {l.tag}
                      </span>
                      <span className="flex-1 text-[19px] font-bold text-navy">{l.place}</span>
                      <span className="font-num text-[22px] font-bold text-navy">{l.score}</span>
                      <span
                        className="text-[19px] font-bold"
                        style={{ color: LEVEL_COLOR[l.level] }}
                      >
                        {l.grade}
                      </span>
                    </div>
                    <p className="mt-1 text-[19px] leading-[1.6] text-ink">{l.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-[14px] border border-[#EFE0BF] bg-[#FDF6E8] px-4 py-[15px]">
                <div className="text-[19px] font-bold text-[#7A6231]">오늘은 이렇게 하세요</div>
                <p className="mt-1 text-[20px] leading-[1.65] text-[#5A4A22]">
                  {OUTING.adviceElder}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {OUTING.kit.map((k) => (
                  <span
                    key={k}
                    className="rounded-[20px] px-3.5 py-[9px] text-[19px] font-bold text-navy"
                    style={{
                      border: "1px solid rgba(10,31,60,.14)",
                      background:
                        "linear-gradient(180deg,rgba(253,252,249,.98),rgba(249,247,242,.96))",
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[19px] text-muted">{OUTING.source}</div>
            </ElderCard>

            {/* order 5 · 지금 우리 동네 — 실외(청색조). 실내 카드와 색으로 구분 */}
            <ElderCard
              show={tab === "today"}
              order={5}
              style={{
                background: "linear-gradient(180deg, #FAFCFF, #F2F7FD)",
                border: "1px solid rgba(147,178,214,.24)",
                boxShadow: LIGHT_CARD.boxShadow,
              }}
            >
              <CardHead title="지금 우리 동네" right={`실외 · ${ELDER.dong}`} rightColor="#5C7799" />
              <div className="mt-2 flex items-end gap-3">
                <span className="font-num text-[44px] font-bold leading-none text-navy">
                  {ELDER_NOW.tempLabel}
                </span>
                <span className="pb-1 text-[19px] text-muted">{ELDER_NOW.feelsLabel}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {nowFactors.map((f) => (
                  <div key={f.label} style={{ ...SUB_CARD, padding: "12px 13px" }}>
                    <div className="text-[19px] text-muted">{f.label}</div>
                    <div
                      className="text-[21px] font-bold"
                      style={{ color: LEVEL_COLOR[f.level] }}
                    >
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
              {/* REQ-01 — 우선 표시는 보호자 설정 (자동 추론 아님) */}
              <div className="mt-3 text-[13px] text-muted/60">우선 항목 · {priority.source}</div>
            </ElderCard>

            {/* ══ 해주세요 탭 — 대행 · 구매 요청. 결제권한(REQ-07)에 따라 본인 결제 / 보호자 승인 ══ */}
            {/* order 0 · 지금 결제가 어떻게 되어 있는지 쉬운 말로 */}
            <ElderCard show={tab === "ask"} order={0} style={LIGHT_CARD}>
              <CardHead title="부탁하시면 저희가 합니다" right="대신 해드립니다" />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                {payRule.headline}
              </p>
              <p className="mt-2 text-[19px] leading-[1.6] text-muted">{payRule.sub}</p>
            </ElderCard>

            {/* order 1 · 무엇을 부탁할지 고르기 — 한 번에 하나만 (저인지부하) */}
            {ASK_GROUPS.map((g, gi) => (
              <ElderCard key={g} show={tab === "ask"} order={1 + gi} style={LIGHT_CARD}>
                <CardHead title={g} right={gi === 0 ? "하나만 골라 주세요" : ""} />
                <div className="mt-2 space-y-2">
                  {ASK_SERVICES.filter((a) => a.g === g).map((a) => {
                    const on = askSel?.id === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setAskSent(null);
                          setAskSel(on ? null : a);
                        }}
                        className="btn-press flex w-full items-start gap-3 text-left"
                        style={{ ...SUB_CARD, outline: on ? "3px solid #B08D57" : "none" }}
                      >
                        <span
                          className="mt-[2px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold"
                          style={{ background: on ? "#1E7A5A" : "rgba(10,31,60,.08)", color: on ? "#fff" : "transparent" }}
                        >
                          ✓
                        </span>
                        {/* 이름은 한 줄을 다 쓰고, 금액은 아래로 — 좁은 화면에서 이름이 어색하게 끊기지 않게 */}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[19px] font-bold leading-[1.35] text-ink">{a.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                            <span className="font-num text-[18px] font-bold text-navy">
                              {a.est === 0 ? "무료" : fmtWon(a.est)}
                            </span>
                            <span className="text-[17px] leading-[1.35] text-muted">{a.note}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ElderCard>
            ))}

            {/* order 8 · 확인 · 보내기 — 결제권한대로 문구와 결과가 갈린다 */}
            <ElderCard show={tab === "ask"} order={8} style={LIGHT_CARD}>
              {askSent ? (
                <>
                  <CardHead title="보냈습니다" right={askSent.mode === "approval" ? "승인 기다리는 중" : "접수됨"} />
                  <p className="mt-2 text-[20px] leading-[1.6] text-ink">{askSent.name}</p>
                  <p className="mt-3 rounded-2xl bg-green/10 p-4 text-[19px] font-bold leading-[1.5] text-green">
                    {askSent.mode === "approval"
                      ? `${payRule.approver} 님에게 확인을 부탁드렸습니다. 승인되면 바로 시작합니다.`
                      : askSent.mode === "free"
                      ? "선생님에게 전달했습니다. 곧 연락드립니다."
                      : "접수했습니다. 선생님이 곧 시작합니다."}
                  </p>
                  <ElderBtn onClick={() => { setAskSent(null); setAskSel(null); }} variant="done" className="mt-4">
                    다른 것도 부탁하기
                  </ElderBtn>
                </>
              ) : !askSel ? (
                <>
                  <CardHead title="고르시면 여기에 보입니다" right="" />
                  <p className="mt-2 text-[20px] leading-[1.6] text-muted">
                    위에서 부탁할 것을 하나 눌러 주세요.
                  </p>
                </>
              ) : (
                <>
                  <CardHead title="이렇게 부탁할까요" right={askSel.est === 0 ? "비용 없음" : fmtWon(askSel.est)} />
                  <p className="mt-2 text-[22px] font-bold leading-[1.5] text-navy">{askSel.name}</p>
                  <p className="mt-1 text-[19px] leading-[1.6] text-muted">{askSel.note}</p>
                  <p className="mt-3 rounded-2xl p-4 text-[19px] font-bold leading-[1.5]"
                     style={askPlan.approval
                       ? { background: "rgba(138,93,18,.1)", color: "#8A5D12" }
                       : { background: "rgba(30,122,90,.1)", color: "#1E7A5A" }}>
                    {askPlan.notice}
                  </p>
                  <ElderBtn
                    onClick={() => {
                      const amount = askSel.est;
                      setAskSent({ name: askSel.name, mode: askPlan.mode, amount });
                      dispatch({
                        type: "addRequest",
                        payload: {
                          id: `rq-${Date.now()}`,
                          dir: "fromElder",
                          type: askPlan.approval ? "부탁 · 승인 필요" : "부탁",
                          detail: `${askSel.name} (${askSel.note})`,
                          amount,
                          preferredDate: null,
                          urgency: "normal",
                          assignee: "박지현",
                          photos: [],
                          status: askPlan.approval ? "awaitingPayment" : "inProgress",
                          history: [
                            { at: Date.now(), status: "requested", note: "어르신 해주세요" },
                            { at: Date.now(), status: "confirmed", note: "" },
                            askPlan.approval
                              ? { at: Date.now(), status: "awaitingPayment", note: `보호자 승인 대기 · ${fmtWon(amount)}` }
                              : { at: Date.now(), status: "inProgress", note: amount === 0 ? "멤버십 포함" : `어르신 직접 결제 ${fmtWon(amount)} (한도 내 · 데모)` },
                          ],
                          proof: null,
                        },
                      });
                      dispatch({
                        type: "pushEvent",
                        payload: {
                          kind: "부탁",
                          text: askPlan.approval
                            ? `김순자 해주세요 — ${askSel.name} · 보호자 승인 요청 (${fmtWon(amount)})`
                            : `김순자 해주세요 — ${askSel.name} · ${amount === 0 ? "멤버십 포함" : `직접 결제 ${fmtWon(amount)}`}`,
                          color: "#B08D57",
                        },
                      });
                    }}
                    variant={askPlan.approval ? "primary" : "success"}
                  >
                    <span className="block leading-[1.35]">{askPlan.cta}</span>
                    <span className="block text-[19px] leading-[1.35] text-white/85">
                      {askSel.est === 0 ? "비용 없음" : fmtWon(askSel.est)}
                    </span>
                  </ElderBtn>
                </>
              )}
            </ElderCard>

            {/* order 9 · 진행 중인 부탁 */}
            <ElderCard show={tab === "ask"} order={9} style={LIGHT_CARD}>
              <CardHead title="부탁해 둔 것" right={`${myRequests.length}건`} />
              {myRequests.length === 0 ? (
                <p className="mt-2 text-[20px] leading-[1.6] text-muted">아직 부탁하신 것이 없습니다.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {myRequests.slice(0, 4).map((r) => (
                    <div key={r.id} style={SUB_CARD}>
                      <div className="text-[19px] font-bold leading-[1.35] text-navy">{r.detail}</div>
                      <div className="mt-1 text-[18px] font-bold" style={{ color: r.status === "awaitingPayment" ? "#8A5D12" : "#1E7A5A" }}>
                        {r.status === "awaitingPayment" ? `${payRule.approver} 님 승인 기다리는 중` : "선생님이 진행 중입니다"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ElderCard>

            {/* order 5 · 목소리 보내기 — 받는 사람 고르고 꾹 눌러 말하면 끝 */}
            <ElderCard
              show={tab === "family"}
              order={5}
              style={{
                background: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
                border: "1px solid rgba(176,141,87,.45)",
                boxShadow: LIGHT_CARD.boxShadow,
              }}
            >
              <CardHead title="목소리 보내기" right="글자 안 써도 됩니다" />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                받을 사람을 고르고
                <br />
                아래 버튼을 꾹 누른 채 말씀하세요.
              </p>
              <VoiceRecorder
                to={voiceTo}
                onPick={setVoiceTo}
                sent={voiceSent}
                onSend={(sec) => {
                  setVoiceSent((v) => [{ to: voiceTo.name, sec }, ...v]);
                  dispatch({
                    type: "pushEvent",
                    payload: {
                      kind: "메시지",
                      text: `김순자(78) → ${voiceTo.name} 목소리 메시지 ${sec}초 전송`,
                      color: "#8FA9CC",
                    },
                  });
                }}
              />
            </ElderCard>

            {/* order 6 · 아들 민수 (음성) — 텍스트 아닌 음성. 재생 버튼이 답장 버튼으로 변신 */}
            <ElderCard
              show={tab === "family"}
              order={6}
              style={
                voicePlayed
                  ? LIGHT_CARD
                  : {
                      background: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
                      border: "1px solid rgba(176,141,87,.45)",
                      boxShadow: LIGHT_CARD.boxShadow,
                    }
              }
            >
              <CardHead title={VOICE_MSG.fromLabel} right={voicePlayed ? "방금 들음" : "오늘 아침"} />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                {voicePlayed
                  ? `"${VOICE_MSG.transcript}"`
                  : "아들이 보낸 목소리 메시지가 있습니다"}
              </p>
              <ElderBtn
                onClick={() => {
                  if (!voicePlayed) {
                    dispatch({ type: "elderPatch", patch: { voicePlayed: true } });
                    dispatch({
                      type: "pushEvent",
                      payload: { kind: "메시지", text: "어르신이 아들 음성 메시지 청취 완료", color: "#8FA9CC" },
                    });
                  } else {
                    setVoiceReplied(true); // 재클릭 가능 — 듣기 → 답장
                    dispatch({
                      type: "pushEvent",
                      payload: { kind: "메시지", text: "김순자 → 아들 민수 음성 답장 전송", color: "#8FA9CC" },
                    });
                  }
                }}
                variant={voicePlayed ? "done" : "primary"}
                className="mt-4"
              >
                {voicePlayed ? "답장 보내기" : `메시지 듣기 (${VOICE_MSG.durationSec}초)`}
              </ElderBtn>
              {voiceReplied && (
                <p className="mt-3 text-[19px] font-bold text-green">
                  목소리 답장을 보냈습니다
                </p>
              )}
            </ElderCard>

            {/* order 7 · 필요한 물건 담기 — 부모가 담고 결제권한대로 분기 (회의 6 · REQ-07).
                직접 결제 상거래 화면이라 금액 표기는 예외적으로 허용 */}
            <ElderCard show={tab === "family"} order={8}>
              <CardHead title="필요한 물건" right="담아두면 배송으로 옵니다" />
              <div className="mt-2 space-y-2">
                {ELDER_STORE_PICKS.map((i) => {
                  const on = !!storeSel[i.id];
                  return (
                    <button
                      key={i.id}
                      onClick={() => {
                        setStoreSent(null);
                        setStoreSel((s) => ({ ...s, [i.id]: !s[i.id] }));
                      }}
                      className="btn-press flex w-full items-center gap-3 rounded-[14px] p-4 text-left"
                      style={{
                        ...SUB_CARD,
                        padding: "14px 15px",
                        outline: on ? "2px solid #B08D57" : "none",
                      }}
                    >
                      <span
                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold"
                        style={{
                          background: on ? "#1E7A5A" : "rgba(10,31,60,.08)",
                          color: on ? "#fff" : "transparent",
                        }}
                      >
                        ✓
                      </span>
                      <span className="flex-1 text-[19px] font-bold text-ink">{i.name}</span>
                      <span className="font-num text-[19px] font-bold text-navy">
                        {fmtWon(i.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const items = ELDER_STORE_PICKS.filter((i) => storeSel[i.id]);
                const total = items.reduce((s, i) => s + i.price, 0);
                const needApproval = needsGuardianApproval(state.onboarding, total);
                if (storeSent) {
                  return (
                    <p className="mt-4 rounded-2xl bg-green/10 p-4 text-[19px] font-bold leading-[1.5] text-green">
                      {storeSent === "approval"
                        ? "가족에게 전달했습니다. 승인되면 배송으로 옵니다."
                        : "주문했습니다. 다음 배송 때 함께 옵니다."}
                    </p>
                  );
                }
                if (items.length === 0) return null;
                return (
                  <ElderBtn
                    onClick={() => {
                      const mode = needApproval ? "approval" : "ordered";
                      setStoreSent(mode);
                      setStoreSel({});
                      dispatch({ type: "demo", payload: { cart: true } });
                      dispatch({
                        type: "addRequest",
                        payload: {
                          id: `rq-${Date.now()}`,
                          dir: "fromElder",
                          type: needApproval ? "물건 승인 부탁해요" : "물건을 담았어요",
                          detail: `어르신 담은 물품: ${items.map((i) => i.name).join(", ")}`,
                          amount: total,
                          preferredDate: null,
                          urgency: "normal",
                          assignee: "박지현",
                          photos: [],
                          status: needApproval ? "awaitingPayment" : "inProgress",
                          history: needApproval
                            ? [
                                { at: Date.now(), status: "requested", note: "어르신 장바구니" },
                                { at: Date.now(), status: "confirmed", note: "" },
                                { at: Date.now(), status: "awaitingPayment", note: `한도 초과 · ${fmtWon(total)}` },
                              ]
                            : [
                                { at: Date.now(), status: "requested", note: "어르신 장바구니" },
                                { at: Date.now(), status: "confirmed", note: "" },
                                { at: Date.now(), status: "inProgress", note: `어르신 직접 결제 ${fmtWon(total)} (한도 내 · 데모)` },
                              ],
                          proof: null,
                        },
                      });
                      dispatch({
                        type: "pushEvent",
                        payload: {
                          kind: "장바구니",
                          text: needApproval
                            ? `김순자 장바구니 ${items.length}건 · 보호자 승인 요청 (${fmtWon(total)})`
                            : `김순자 직접 주문 ${items.length}건 · ${fmtWon(total)} (한도 내)`,
                          color: "#B08D57",
                        },
                      });
                    }}
                    variant={needApproval ? "primary" : "success"}
                    className="mt-4"
                  >
                    <span className="block leading-[1.35]">
                      {needApproval ? "가족에게 부탁하기" : "바로 주문하기"}
                    </span>
                    <span className="block text-[19px] leading-[1.35] text-white/85">
                      {items.length}가지 · {fmtWon(total)}
                    </span>
                  </ElderBtn>
                );
              })()}
            </ElderCard>

            {/* order 7 · 토요일 배송 — 금액 없음. 품목·수량만 (정보 비대칭의 최소 예) */}
            <ElderCard show={tab === "family"} order={7}>
              <CardHead title={`${DELIVERY.dayLabel} 배송`} right={DELIVERY.timeLabel} />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                약과 필요한 물건이
                <br />
                집으로 옵니다
              </p>
              <p className="mt-2 text-[19px] leading-[1.6] text-muted">
                {cart ? DELIVERY.itemsWithCart : DELIVERY.itemsBase}
              </p>
            </ElderCard>

            {/* order 8 · 자녀들이 보고 있습니다 — 고립감 해소. 상대 시간만, 부정 표현 금지 */}
            <ElderCard
              show={tab === "family"}
              order={9}
              style={{
                background: "linear-gradient(180deg, #F1FAF6, #E6F4EE)",
                border: "1px solid rgba(30,122,90,.26)",
                boxShadow: LIGHT_CARD.boxShadow,
              }}
            >
              <div className="text-[19px] font-bold text-green">자녀들이 보고 있습니다</div>
              <div className="mt-1">
                {FAMILY_SEEN.map((f) => (
                  <button
                    key={f.displayName}
                    onClick={() => {
                      // 이 자녀에게 바로 목소리 보내기 — 위 카드로 올라가 수신자가 미리 선택된다
                      const hit = VOICE_TO.find((v) => v.name === f.displayName) || VOICE_TO[0];
                      setVoiceTo(hit);
                      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="btn-press flex w-full items-center gap-3.5 border-t border-green/[.16] py-[14px] text-left first:border-t-0"
                  >
                    <span
                      className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-[16px] font-bold"
                      style={{ background: f.avBg, color: f.avFg }}
                    >
                      {f.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[20px] font-bold text-navy">{f.displayName}</div>
                      <div className="text-[18px] text-[#2B4A3E]">{f.seenLabel}</div>
                    </div>
                    <span className="shrink-0 text-green" aria-hidden>
                      <Icon name="mic" size={24} strokeWidth={2} />
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[19px] leading-[1.6] text-[#2B4A3E]">
                멀리 있어도 매일 확인하고 있습니다.
              </p>
            </ElderCard>
          </main>

          {/* ── 고정 푸터: 전화 · 탭 (스크롤 밖 — 06 원칙 5). SOS는 최상단으로 분리 ── */}
          <footer className="shrink-0 pb-3 pt-4">
            {/* SOS(응급)는 위, 전화(문의)는 아래 — 화면 양 끝으로 갈라 오작동을 막는다 (06 §4.2) */}
            <button
              onClick={callTeacher}
              className="btn-press w-full rounded-2xl p-6 text-[22px] font-bold text-navy"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(240,238,232,.78))",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,.9)",
                boxShadow:
                  "inset 0 1px 0 #FFFFFF, inset 0 -3px 0 rgba(10,31,60,.13), inset 0 0 0 1px rgba(10,31,60,.14), 0 10px 20px -12px rgba(10,31,60,.45)",
              }}
            >
              {calling ? "박지현 선생님께 연결 중입니다" : "선생님께 전화"}
            </button>
            {/* 하단 탭 3개 — 아이콘+라벨 병행 (아이콘 전용 금지) */}
            <nav className="mt-3 flex border-t border-navy/[.12] pt-2">
              {TABS.map((t) => {
                const active = tab === t.key;
                const color = active ? "#0A1F3C" : "#5C5A54";
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1"
                  >
                    <span aria-hidden style={{ color }}>
                      <Icon name={t.glyph} size={24} strokeWidth={2} />
                    </span>
                    <span className="text-[16px] font-bold" style={{ color }}>
                      {t.label}
                    </span>
                    <span
                      className="h-[3px] w-[26px] rounded-full"
                      style={{ background: active ? "#0A1F3C" : "transparent" }}
                    />
                  </button>
                );
              })}
            </nav>
          </footer>
        </div>

        {/* 간단등록 시트 — 큰 활자 · 프리셋만. 자유 입력 없음 (저인지부하) */}
        {eventSheet && (
          <ElderEventSheet
            onClose={() => setEventSheet(false)}
            onCreate={(ev) => {
              dispatch({ type: "addEvent", payload: ev });
              dispatch({
                type: "pushEvent",
                payload: { kind: "일정", text: `어르신 간단등록 · ${ev.title}`, color: "#8FA9CC" },
              });
              setEventSheet(false);
            }}
          />
        )}
      </div>
    </>
  );
}

// 어르신 간단등록 — REQ-02 권한표 "간단등록". 종류·날짜·시간을 큰 버튼으로만 고른다.
const ELDER_EVENT_KINDS = [
  { kind: "family", label: "가족이 와요" },
  { kind: "hospital", label: "병원 갈 일" },
  { kind: "request", label: "부탁할 일" },
];
const ELDER_DAYS = [
  { add: 0, label: "오늘" },
  { add: 1, label: "내일" },
  { add: 2, label: "모레" },
];
const ELDER_TIMES = [
  { h: 9, label: "아침 9시" },
  { h: 12, label: "낮 12시" },
  { h: 15, label: "오후 3시" },
  { h: 18, label: "저녁 6시" },
];

function ElderEventSheet({ onClose, onCreate }) {
  const [kind, setKind] = useState(null);
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);

  const ready = kind && day !== null && time !== null;

  const save = () => {
    if (!ready) return;
    const d = new Date();
    d.setDate(d.getDate() + day.add);
    d.setHours(time.h, 0, 0, 0);
    onCreate({
      id: `ev-${Date.now()}`,
      kind: kind.kind,
      title: kind.label,
      at: d.getTime(),
      source: "어르신 등록",
      note: "",
    });
  };

  const Pick = ({ options, value, onPick, valueKey }) => (
    <div className="mt-2 grid grid-cols-3 gap-2">
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o[valueKey]}
            onClick={() => onPick(o)}
            className={`btn-press rounded-2xl border-2 px-2 py-4 text-[20px] font-bold leading-[1.3] ${
              on ? "border-navy bg-navy text-white" : "border-navy/15 text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,23,45,.6)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-elder p-6 pb-8 break-keep">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[26px] font-black text-navy">일정 남기기</div>
        <p className="mt-1 text-[19px] leading-[1.5] text-muted">
          가족과 선생님에게도 함께 보입니다.
        </p>

        <div className="mt-5 text-[19px] font-bold text-navy">무슨 일인가요?</div>
        <Pick options={ELDER_EVENT_KINDS} value={kind} onPick={setKind} valueKey="kind" />

        <div className="mt-5 text-[19px] font-bold text-navy">언제인가요?</div>
        <Pick options={ELDER_DAYS} value={day} onPick={setDay} valueKey="label" />

        <div className="mt-5 text-[19px] font-bold text-navy">몇 시쯤인가요?</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ELDER_TIMES.map((t) => {
            const on = time === t;
            return (
              <button
                key={t.h}
                onClick={() => setTime(t)}
                className={`btn-press rounded-2xl border-2 px-2 py-4 text-[20px] font-bold ${
                  on ? "border-navy bg-navy text-white" : "border-navy/15 text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="btn-press flex-1 rounded-2xl border-2 border-navy/20 p-5 text-[20px] font-bold text-muted"
          >
            닫기
          </button>
          <button
            onClick={save}
            disabled={!ready}
            className="btn-elder flex-[2] rounded-2xl bg-navy p-5 text-[21px] font-bold text-white disabled:opacity-40"
          >
            남기기
          </button>
        </div>
      </div>
    </div>
  );
}

// 목소리 보내기 — 어르신에게 타이핑은 장벽이다. 받는 사람 고르고 꾹 눌러 말하면 끝.
// 빨강은 SOS 전용이므로 녹음 중 색은 금색 계열을 쓴다 (06 §4.2).
function VoiceRecorder({ to, onPick, onSend, sent }) {
  const [rec, setRec] = useState(false);
  const [sec, setSec] = useState(0);
  const [tooShort, setTooShort] = useState(false);
  const timer = useRef(null);

  const start = () => {
    if (!to || rec) return;
    setTooShort(false);
    setSec(0);
    setRec(true);
    timer.current = setInterval(() => setSec((v) => Math.min(60, v + 1)), 1000);
  };
  const stop = () => {
    if (!rec) return;
    clearInterval(timer.current);
    setRec(false);
    if (sec < 1) {
      setTooShort(true); // 스치듯 눌린 것은 보내지 않는다
      return;
    }
    onSend(sec);
    setSec(0);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
        {VOICE_TO.map((v) => {
          const on = to?.id === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onPick(v)}
              className="btn-press flex items-center gap-3 rounded-[14px] p-3.5 text-left"
              style={{ ...SUB_CARD, padding: "12px 13px", outline: on ? "3px solid #B08D57" : "none" }}
            >
              <span
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                style={{ background: v.avBg, color: v.avFg }}
              >
                {v.initials}
              </span>
              <span className="min-w-0">
                <span className="block text-[18px] font-bold leading-[1.3] text-navy">{v.name}</span>
                <span className="block text-[15px] leading-[1.3] text-muted">{v.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        aria-label="꾹 누르고 말하기"
        disabled={!to}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onContextMenu={(e) => e.preventDefault()}
        className="btn-press mt-3.5 w-full select-none rounded-2xl px-5 py-[26px] disabled:opacity-45"
        style={{
          touchAction: "none",
          background: rec
            ? "linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,.04) 55%), rgba(176,141,87,.92)"
            : "linear-gradient(180deg, rgba(255,255,255,.94), rgba(240,238,232,.8))",
          color: rec ? "#FFFFFF" : "#0A1F3C",
          border: rec ? "1px solid rgba(255,255,255,.5)" : "1px solid rgba(255,255,255,.9)",
          boxShadow: rec
            ? "inset 0 1px 0 rgba(255,255,255,.45), 0 12px 24px -10px rgba(176,141,87,.6)"
            : "inset 0 1px 0 #FFFFFF, inset 0 -3px 0 rgba(10,31,60,.13), inset 0 0 0 1px rgba(10,31,60,.14)",
        }}
      >
        <span className="flex items-center justify-center gap-2.5">
          <Icon name="mic" size={30} strokeWidth={2} />
          <span className="text-[26px] font-black leading-none">
            {rec ? `말씀하세요  ${sec}초` : "꾹 누르고 말하기"}
          </span>
        </span>
        <span className="mt-2 block text-[17px] font-bold" style={{ color: rec ? "rgba(255,255,255,.85)" : "#5C5A54" }}>
          {!to ? "위에서 받을 사람을 먼저 고르세요" : rec ? "손을 떼면 바로 보냅니다" : `${to.name}에게 보냅니다`}
        </span>
        {/* 녹음 중 파형 — 소리가 들어가고 있다는 것을 눈으로 확인 */}
        {rec && (
          <span className="mt-3 flex items-end justify-center gap-[3px]" aria-hidden>
            {[10, 20, 14, 26, 16, 30, 12, 22, 18, 28, 13, 24].map((h, i) => (
              <span
                key={i}
                className="w-[5px] rounded-full bg-white/85"
                style={{ height: h, animation: `sosPulse 1s ease-in-out ${i * 0.08}s infinite` }}
              />
            ))}
          </span>
        )}
      </button>

      {tooShort && (
        <p className="mt-3 text-[19px] font-bold leading-[1.5] text-amber">
          너무 짧습니다. 조금 더 길게 눌러 주세요.
        </p>
      )}
      {sent.length > 0 && (
        <div className="mt-3 space-y-2">
          {sent.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-[14px]" style={{ ...SUB_CARD, padding: "12px 14px" }}>
              <span className="text-green">
                <Icon name="mic" size={22} strokeWidth={2} />
              </span>
              <span className="flex-1 text-[18px] font-bold text-navy">{m.to}에게 보냈습니다</span>
              <span className="font-num text-[17px] font-bold text-muted">{m.sec}초</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// SOS — REQ-06 확정: 2초 길게 누르기(진행 표시) → 5초 취소 카운트다운 → 자동 접수.
// 스타일: 붉은 배경·흰 텍스트 기본의 글라스모피즘 (블러 + 반투명 + 광택 하이라이트).
function SosButton({ phase, setPhase, onDispatch }) {
  const [hold, setHold] = useState(0); // 0~100 길게 누르기 진행
  const [count, setCount] = useState(5);
  const holdTimer = useRef(null);
  const countTimer = useRef(null);

  const HOLD_MS = 2000;

  const startHold = () => {
    if (phase !== "idle") return;
    const t0 = Date.now();
    holdTimer.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / HOLD_MS) * 100);
      setHold(p);
      if (p >= 100) {
        clearInterval(holdTimer.current);
        setHold(0);
        setPhase("confirm");
      }
    }, 50);
  };
  const endHold = () => {
    clearInterval(holdTimer.current);
    setHold(0);
  };

  // 5초 취소 유예 — 미취소 시 자동 접수
  useEffect(() => {
    if (phase !== "confirm") return undefined;
    setCount(5);
    countTimer.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(countTimer.current);
          onDispatch();
          setPhase("sent");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countTimer.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        aria-label="긴급 도움 요청"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onContextMenu={(e) => e.preventDefault()}
        className="btn-press animate-sosPulse relative w-full select-none overflow-hidden rounded-2xl px-5 py-[26px] text-white"
        style={{
          animationDuration: "2.4s", // prefers-reduced-motion 시 globals.css에서 정지
          touchAction: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.04) 55%), rgba(192,57,43,.86)",
          backdropFilter: "blur(14px) saturate(1.5)",
          WebkitBackdropFilter: "blur(14px) saturate(1.5)",
          border: "1px solid rgba(255,255,255,.42)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.45), inset 0 -4px 0 rgba(96,20,14,.35), 0 12px 24px -10px rgba(192,57,43,.55)",
        }}
      >
        {/* 길게 누르기 진행 표시 (REQ-06) */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-[#8E2417]/70"
          style={{ width: `${hold}%` }}
        />
        <span className="relative block text-[32px] font-black leading-none tracking-[.02em]">
          SOS 도움 요청
        </span>
        <span className="relative mt-2 block text-[17px] font-bold text-white/85">
          2초 꾹 누르시면 접수됩니다
        </span>
      </button>

      {/* 5초 취소 유예 화면 */}
      {phase === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,23,45,.92)] px-6">
          <div className="w-full max-w-[430px] text-center">
            <div className="text-[30px] font-black leading-[1.4] text-white">
              도움 요청을
              <br />
              보내는 중입니다
            </div>
            <div className="mx-auto mt-6 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-danger font-num text-[48px] font-bold text-white">
              {count}
            </div>
            <p className="mt-4 text-[21px] leading-[1.6] text-white/80">
              잘못 눌렀다면 아래 버튼을
              <br />
              눌러 취소하세요
            </p>
            <button
              onClick={() => {
                clearInterval(countTimer.current);
                setPhase("idle");
              }}
              className="btn-press mt-6 w-full rounded-2xl bg-white p-7 text-[24px] font-black text-navy"
            >
              취소합니다
            </button>
          </div>
        </div>
      )}

      {/* 접수 후 — 안심 화면. 어르신에게는 경과·SLA를 보여주지 않는다 */}
      {phase === "sent" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy px-6">
          <div className="w-full max-w-[430px] text-center">
            <div className="mx-auto flex h-[90px] w-[90px] items-center justify-center rounded-full bg-green text-[40px] text-white">
              ✓
            </div>
            <div className="mt-6 text-[30px] font-black leading-[1.45] text-white">
              선생님이
              <br />
              오고 있습니다
            </div>
            <p className="mt-4 text-[21px] leading-[1.65] text-white/80">
              가족에게도 알렸습니다.
              <br />
              편한 자세로 기다리세요.
            </p>
            <button
              onClick={() => setPhase("idle")}
              className="btn-press mt-8 w-full rounded-2xl border-2 border-white/40 p-7 text-[22px] font-bold text-white"
            >
              화면 닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
