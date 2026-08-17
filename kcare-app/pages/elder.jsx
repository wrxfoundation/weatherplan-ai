import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AMBIENT_TIPS,
  ASK_DOCTOR,
  ELDER,
  ELDER_NOW,
  ELDER_VISITORS,
  EVENT_KINDS,
  FAMILY_SEEN,
  INDOOR,
  OUTING,
  TODAY_ME,
  VOICE_MSG,
  VOICE_TO,
} from "../lib/mock";
import { PRICING, fmtWon } from "../lib/config";
import { STORE_CATALOG } from "../lib/store";
import { SERVICE_MENU, SERVICE_PLUS } from "../lib/requests";
import { MED_PLAN, MED_REGISTRY, SUPPLEMENTS, daysLeft, medProgress, needsReorder } from "../lib/meds";
import { needsGuardianApproval, useAppState } from "../lib/state";
import Icon from "../components/icons";
import Splash from "../components/Splash";

// 사용자(어르신) 홈 — 핸드오프 06 elder 상세 명세 + REQ-01(우선 날씨) + REQ-06(SOS 오작동 방지)
// 구조: 헤더(날짜·인사)·푸터(SOS·전화·탭) 고정, 카드 스택만 스크롤 (06 §1).
// 카드는 언마운트 없이 display 전환 + CSS order 정렬 (06 §2).
// 접근성(타협 불가): 본문 19px 하한(예외 18px 3곳), 버튼 패딩 24~30px, 탭 60px, 색+텍스트 병행.
// 1회성 잠금(복약 체크·재구매·askAdded)에 undo 없음 — 의도된 설계, "버그"로 고치지 말 것 (06 §5).

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

// 해주세요 — 보호자 화면과 같은 메뉴를 쓴다 (2026-08-12 어르신화면 시트 해주세요 1번:
// "기존 내용 전체 삭제하고 보호자 해주세요내용과 동일하게 넣어주세요").
// 어르신 화면은 활자만 크고, 목록·단가·순서는 lib/requests.js 한 곳에서 온다.
const ASK_CATS = ["의료 지원", "생활 지원", "주거 관리", "행정 지원", "돌봄 지원", "응급 관리"];

const TABS = [
  { key: "today", label: "오늘", glyph: "home" },
  { key: "health", label: "건강", glyph: "heart" },
  { key: "ask", label: "해주세요", glyph: "hand" },
  { key: "store", label: "스토어", glyph: "bag" },
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
  const [storeCat, setStoreCat] = useState("pharmacy"); // 스토어 탭 분류
  const [voiceTo, setVoiceTo] = useState(null); // 음성 메시지 수신자 (null이면 미선택)
  const [voiceSent, setVoiceSent] = useState([]); // 보낸 목소리 목록 (최근 순)
  const [askSel, setAskSel] = useState(null); // '해주세요' 선택 항목
  const [askSent, setAskSent] = useState(null); // { name, mode, amount }
  const callTimer = useRef(null);

  // 새로고침을 견뎌야 하는 것들은 전부 state.elder 에 있다 (lib/state.js 주석 참고).
  // 로컬 useState 로 두면 시연 중 새로고침 한 번에 복약 체크가 사라지고,
  // 이미 보낸 요청을 다시 보낼 수 있게 된다.
  const { voicePlayed, askAdded, medSlots, reordered, visitAsked, askSpoken } = state.elder;

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
    // 아래 목록(lib/requests.js SERVICE_MENU)과 같은 것을 말한다.
    // 예시를 목록과 다르게 쓰면 없는 서비스를 기대하시게 된다.
    sub: "병원 예약 · 병원 동행 · 안심방문 · 생활 대행을 부탁하시면 선생님이 대신 해드립니다.",
  };
  // 선택 항목의 결제 분기 — 무료(멤버십 포함) / 본인 결제 / 보호자 승인.
  // 보호자 메뉴(SERVICE_MENU)는 amount 가 null 인 것도 있다 — 요금 확정 전이라
  // 금액을 지어내지 않고 "요금은 확인 후 알려드립니다"로 간다.
  const askPlan = (() => {
    if (!askSel) return { mode: null, approval: false, notice: "", cta: "" };
    if (askSel.amount === 0) {
      return { mode: "free", approval: false, notice: "멤버십에 포함된 것이라 따로 내실 돈이 없습니다.", cta: "부탁하기" };
    }
    if (askSel.amount == null) {
      return { mode: "quote", approval: false, notice: "요금이 아직 정해지지 않은 것이라, 선생님이 확인해서 먼저 알려드립니다.", cta: "부탁하기" };
    }
    const approval = needsGuardianApproval(state.onboarding, askSel.amount);
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

  // 오늘 약 — 첫 안심방문에서 등록한 복약 계획(lib/meds.js)을 어르신이 직접 체크한다.
  // 진행바는 '몇 번 중 몇 번'을 그대로 센다 (시트: 전체 횟수에서 복용 횟수).
  const med = medProgress(medSlots);
  // 건기식 — 용량이 부족하거나 유통기한이 다가온 것만 위로 올린다
  const supplements = SUPPLEMENTS.map((s) => ({ ...s, alert: needsReorder(s) }));
  const supAlerts = supplements.filter((s) => s.alert);

  const indoor = INDOOR.hot;

  // 스토어 탭 — 보호자 스토어와 같은 카탈로그. 가격 없는 항목은 담기지 않는다.
  const storeCatalog = STORE_CATALOG.find((c) => c.id === storeCat) || STORE_CATALOG[0];
  const storeItems = STORE_CATALOG.flatMap((c) => c.groups.flatMap((g) => g.items)).filter(
    (i) => storeSel[i.id] && i.price
  );
  const storeTotal = storeItems.reduce((s, i) => s + i.price + (i.ship || 0), 0);
  const storeApproval = needsGuardianApproval(state.onboarding, storeTotal);

  // 오늘이 방문일인가 — 오늘 오시는 분에게만 전화를 열어 준다 (시트 '오늘' 1번)
  const visitToday = upcoming.some((e) => e.kind === "visit" && isToday(e.at));

  useEffect(() => () => clearTimeout(callTimer.current), []);

  // 바탕화면 SOS 바로가기 — /elder?sos=1 로 열리면 5초 취소 유예 화면이 바로 뜬다.
  // (public/manifest.webmanifest 의 shortcuts 가 이 주소를 가리킨다)
  // 안드로이드 크롬은 아이콘을 길게 눌러 나오는 바로가기, iOS 사파리는 이 주소 자체를
  // 홈 화면에 추가하면 같은 동작이 된다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("sos") === "1") setSosPhase("confirm");
  }, []);

  const callTeacher = () => {
    if (calling) return;
    setCalling(true);
    callTimer.current = setTimeout(() => setCalling(false), 2600);
  };

  return (
    <>
      <Head>
        <title>K-CARE</title>
      </Head>
      <Splash service="elder" />
      <div className="min-h-screen bg-nav">
        {/* break-keep: 한국어 어절 단위 줄바꿈 — 카피 개행(<br/>)과 병용 (06 §6) */}
        <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col break-keep bg-elder px-4 min-[380px]:px-[22px]">
          {/* ── 고정 헤더: 날짜 · 인사 ── */}
          <header className="shrink-0 pt-5">
            <div className="flex items-center justify-between">
              <span className="font-num text-[12px] font-bold tracking-[.16em] text-gold">
                K-CARE
              </span>
              <Link href="/" className="tap text-[13px] font-bold text-muted/50">
                데모 홈
              </Link>
            </div>
            {/* 인사말 옆에 버튼을 둔다 — 아래로 쌓으면 375x667 화면에서 헤더가 286px(43%)를
                먹고 카드에 40% 밖에 안 남는다. 어르신 폰이 최신이 아닐 수 있으니 작은 화면
                기준으로 맞춘다. 화면 안 SOS 버튼은 뺐고(시트 전체 요청 3·4번) 이 자리를
                즉시방문요청이 대신한다 — 둘을 같이 두면 급할 때 무엇을 누를지 고르게 된다. */}
            <div className="mt-2 flex items-center gap-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[19px] font-medium text-muted">{dateLong}</div>
                {/* 호칭은 "~~님"으로 통일 — '어르신' 표기 삭제 (2026-08-12 시트 전체 요청 1번) */}
                <h1 className="text-[27px] font-black leading-[1.3] text-navy">
                  {name} 님,
                  <br />
                  안녕하세요
                </h1>
              </div>
              <VisitNowButton
                done={visitAsked}
                onAsk={() => {
                  dispatch({ type: "elderPatch", patch: { visitAsked: true } });
                  dispatch({
                    type: "addRequest",
                    payload: {
                      id: `rq-${Date.now()}`,
                      dir: "fromElder",
                      type: "즉시 방문 요청",
                      detail: "지금 와 주셨으면 합니다 (어르신 화면 즉시방문요청)",
                      amount: null,
                      preferredDate: null,
                      urgency: "urgent",
                      assignee: "박지현",
                      photos: [],
                      status: "requested",
                      history: [{ at: Date.now(), status: "requested", note: "어르신 즉시방문요청" }],
                      proof: null,
                    },
                  });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "방문", text: `${ELDER.name}(${ELDER.age}) 즉시 방문 요청 · 관제 배정 대기`, color: "#B08D57" },
                  });
                }}
              />
            </div>
            {/* 버튼 글자만으로 부족한 설명은 한 줄로 — 요청 후에는 상태를 말해 준다 */}
            <p className="mt-2 text-[19px] leading-[1.5] text-muted">
              {visitAsked
                ? "요청을 보냈습니다. 선생님이 곧 출발합니다."
                : "지금 와 주셨으면 할 때 누르세요."}
            </p>
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
              {/* 오늘 오시는 분에게만 전화 — 시트 '오늘' 1번.
                  방문일이 아닌 날에 전화 버튼이 열려 있으면 아무 때나 걸게 된다.
                  푸터의 '선생님께 전화'는 같은 시트 요청으로 삭제했고, 이것만 남는다. */}
              {visitToday ? (
                <ElderBtn
                  onClick={callTeacher}
                  variant={calling ? "done" : "primary"}
                  className="mt-4"
                  lines={
                    calling
                      ? ["박지현 선생님께", "연결 중입니다"]
                      : ["오늘 오시는", "박지현 선생님께 전화"]
                  }
                />
              ) : (
                <p className="mt-4 rounded-2xl px-4 py-3.5 text-[19px] leading-[1.6] text-muted" style={SUB_CARD}>
                  전화는 오시는 날에만 열립니다. 급하시면 위의 즉시 방문 요청을 눌러 주세요.
                </p>
              )}
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                두 분 다 목에 K-CARE 이름표를 걸고 옵니다. 이름이 다르면 문을 열지 마시고 바탕화면의
                빨간 SOS 바로가기를 누르세요.
              </p>
            </ElderCard>

            {/* order 2 · 오늘 나는 — 보호자 홈의 "오늘 어머니는"과 같은 내용을
                1인칭으로. 어제 숫자를 나란히 둔다 (시트 '오늘' 2번).
                안부 전화 카드는 같은 시트 대표 피드백으로 삭제. */}
            <ElderCard show={tab === "today"} order={2}>
              <CardHead title="오늘 나는" right="어제와 비교" />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">{TODAY_ME.line}</p>
              <div className="mt-1">
                {TODAY_ME.rows.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-baseline gap-3 border-t border-navy/[.07] py-[14px] first:border-t-0"
                  >
                    <span className="w-[62px] shrink-0 text-[19px] font-bold text-navy">{r.name}</span>
                    <span className="flex-1">
                      <span className="font-num text-[24px] font-bold text-navy">{r.today}</span>
                      <span className="ml-1 text-[19px] text-muted">{r.unit}</span>
                    </span>
                    <span className="text-[19px] text-muted">
                      어제 <span className="font-num font-bold">{r.yesterday}</span>
                    </span>
                    <span
                      aria-hidden
                      className="w-[18px] shrink-0 text-center text-[19px] font-bold"
                      style={{ color: r.dir === "up" ? "#1E7A5A" : "#5C5A54" }}
                    >
                      {r.dir === "up" ? "▲" : "▼"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">{TODAY_ME.foot}</p>
            </ElderCard>

            {/* order 7 · 바탕화면 SOS 바로가기 안내 — 화면 안 SOS 버튼을 뺐으니
                어디를 눌러야 하는지는 반드시 말해 줘야 한다 (시트 전체 요청 3번) */}
            <ElderCard show={tab === "today"} order={7}>
              <CardHead title="급할 때 누르는 곳" right="바탕화면" />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                휴대폰 바탕화면에 있는
                <br />
                빨간 <b>SOS</b> 그림을 누르시면
                <br />
                바로 도움을 부릅니다.
              </p>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                첫 안심방문 때 선생님이 바탕화면에 만들어 드립니다. 실수로 눌러도 5초 안에 취소할 수
                있습니다.
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

            {/* order 2 · 오늘 약 — 첫 안심방문에서 등록한 계획을 직접 체크한다.
                진행바는 '전체 횟수 중 복용 횟수' (시트 '건강' 1번). */}
            <ElderCard
              show={tab === "health"}
              order={2}
              style={{
                background:
                  med.done === med.total
                    ? LIGHT_CARD.background
                    : "linear-gradient(180deg,#FFF7E8,#FBEFD8)",
                border: med.done === med.total ? LIGHT_CARD.border : "1px solid rgba(138,93,18,.3)",
                boxShadow: LIGHT_CARD.boxShadow,
              }}
            >
              <CardHead title="오늘 약" right={`${med.total}번 중 ${med.done}번 드셨습니다`} />
              {/* 진행바 — 숫자만으로는 얼마나 남았는지 한눈에 안 들어온다 */}
              <div
                className="mt-3 h-[18px] w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={med.done}
                aria-valuemin={0}
                aria-valuemax={med.total}
                aria-label={`오늘 복약 ${med.total}번 중 ${med.done}번 완료`}
                style={{ background: "rgba(10,31,60,.09)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${med.pct}%`, background: med.pct === 100 ? "#1E7A5A" : "#B08D57" }}
                />
              </div>
              <div className="mt-2">
                {MED_PLAN.map((d) => {
                  const on = !!medSlots[d.slot];
                  return (
                    <div
                      key={d.slot}
                      className="flex items-center gap-3 border-t border-navy/[.07] py-[14px] first:border-t-0"
                    >
                      <span className="w-[62px] shrink-0 text-[19px] font-bold text-navy">{d.slot}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[19px] leading-[1.4] text-ink">
                          {d.items.map((i) => i.name).join(" · ")}
                        </span>
                        <span className="block font-num text-[17px] text-muted">{d.time}</span>
                      </span>
                      <button
                        onClick={() => {
                          if (on) return; // 체크는 되돌리지 않는다 (06 §5)
                          dispatch({ type: "elderMark", key: "medSlots", id: d.slot });
                          dispatch({
                            type: "pushEvent",
                            payload: {
                              kind: "복약",
                              text: `${ELDER.name} ${d.slot} 복약 완료 · 가족 앱 준수율 갱신`,
                              color: "#4ADE80",
                            },
                          });
                        }}
                        aria-label={`${d.slot} 약 먹었어요`}
                        aria-pressed={on}
                        className="btn-press shrink-0 rounded-2xl px-4 py-3 text-[18px] font-bold"
                        style={
                          on
                            ? { background: "rgba(30,122,90,.12)", color: "#1E7A5A" }
                            : { background: "#1E7A5A", color: "#FFFFFF" }
                        }
                      >
                        {on ? "먹었어요 ✓" : "먹었어요"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                {MED_REGISTRY.registeredAt}에 {MED_REGISTRY.registeredBy}이 약봉투를 보고 등록했습니다.
              </p>
            </ElderCard>

            {/* order 3 · 건강기능식품 — 남은 양과 유통기한. 떨어질 때쯤 알려 드린다
                (시트 '건강' 1번 뒷부분: 종류·유통기간 관리 + 재구매 알림) */}
            <ElderCard show={tab === "health"} order={3}>
              <CardHead
                title="드시는 건강식품"
                right={supAlerts.length ? `${supAlerts.length}가지 챙기실 것` : "넉넉합니다"}
                rightColor={supAlerts.length ? "#8A5D12" : "#5C5A54"}
              />
              <div className="mt-2 space-y-2.5">
                {supplements.map((s) => {
                  const left = daysLeft(s);
                  const pct = Math.round((s.remain / Math.max(1, s.total)) * 100);
                  const done = !!reordered[s.id];
                  return (
                    <div key={s.id} style={SUB_CARD}>
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <span className="text-[20px] font-bold text-navy">{s.name}</span>
                        {s.alert && (
                          <span className="text-[18px] font-bold text-amber">{s.alert}</span>
                        )}
                      </div>
                      <div className="mt-1 text-[19px] text-muted">
                        {s.remain}
                        {s.unit} 남음 · <b className="text-ink">{left}일치</b> · 유통기한 {s.expiry}
                      </div>
                      <div
                        className="mt-2 h-[12px] w-full overflow-hidden rounded-full"
                        style={{ background: "rgba(10,31,60,.09)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: s.alert ? "#B08D57" : "#1E7A5A" }}
                        />
                      </div>
                      {s.alert && (
                        <button
                          onClick={() => {
                            if (done) return;
                            dispatch({ type: "elderMark", key: "reordered", id: s.id });
                            dispatch({
                              type: "addRequest",
                              payload: {
                                id: `rq-${Date.now()}`,
                                dir: "fromElder",
                                type: "건강식품 재구매",
                                detail: `${s.name} — ${s.alert} (${left}일치 남음 · 유통기한 ${s.expiry})`,
                                amount: null,
                                preferredDate: null,
                                urgency: "normal",
                                assignee: "박지현",
                                photos: [],
                                status: "requested",
                                history: [{ at: Date.now(), status: "requested", note: "재구매 알림에서 요청" }],
                                proof: null,
                              },
                            });
                            dispatch({
                              type: "pushEvent",
                              payload: { kind: "구매", text: `${ELDER.name} 건강식품 재구매 요청 — ${s.name}`, color: "#B08D57" },
                            });
                          }}
                          disabled={done}
                          className="btn-press mt-3 w-full rounded-2xl py-4 text-[20px] font-bold"
                          style={
                            done
                              ? { background: "rgba(30,122,90,.12)", color: "#1E7A5A" }
                              : { background: "#0A1F3C", color: "#FFFFFF" }
                          }
                        >
                          {done ? "부탁드렸습니다" : "다시 사다 주세요"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ElderCard>

            {/* order 4 · 지금 집 안 — 상태를 보여주고, 무엇을 하면 좋은지 한 문장으로 권한다.
                "에어컨 켜고 가족에게 알리기" 버튼은 삭제 (시트 '건강' 대표 피드백).
                기기를 대신 켜 주지 못하면서 켜 준 것처럼 보이는 버튼이었다. */}
            <ElderCard show={tab === "health"} order={4}>
              <CardHead title="지금 집 안" right="실내 · 거실 센서" />
              <div className="mt-2 flex items-end gap-3">
                <span
                  className="font-num text-[44px] font-bold leading-none"
                  style={{ color: LEVEL_COLOR[indoor.level] }}
                >
                  {indoor.tempLabel}
                </span>
                <span className="pb-1 text-[19px] text-muted">{indoor.sub}</span>
              </div>
              <div
                className="mt-4 rounded-[14px] px-[17px] py-4"
                style={{
                  background: "rgba(192,57,43,.07)",
                  border: "1px solid rgba(192,57,43,.25)",
                }}
              >
                <div className="text-[19px] font-bold" style={{ color: LEVEL_COLOR[indoor.level] }}>
                  {indoor.alertTitle}
                </div>
                <p className="mt-1 text-[19px] leading-[1.6] text-ink">{indoor.alertBody}</p>
              </div>
              {/* 안심환경 메시지 — 시트 '건강' 2번. 때마다 한 문장씩 알려 드린다 */}
              <div className="mt-3 space-y-2">
                {AMBIENT_TIPS.map((t) => (
                  <div key={t.id} style={SUB_CARD}>
                    <div className="flex flex-wrap items-baseline gap-x-2.5">
                      <span className="text-[20px] font-bold" style={{ color: LEVEL_COLOR[t.tone] }}>
                        {t.title}
                      </span>
                      <span className="text-[18px] text-muted">{t.when}</span>
                    </div>
                    <p className="mt-1 text-[19px] leading-[1.6] text-ink">{t.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                이 메시지는 알림으로도 갑니다. 창문·에어컨은 직접 여닫으셔야 합니다.
              </p>
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

            {/* order 0.5 · 선생님께 말로 요청하기 — 시트 '해주세요' 대표 피드백.
                목록에서 못 찾으시면 말로 남기면 된다. 전화 버튼을 대신하는 자리다. */}
            <ElderCard show={tab === "ask"} order={1} style={LIGHT_CARD}>
              <CardHead title="말로 부탁하기" right="목록에 없어도 됩니다" />
              <ElderBtn
                onClick={() => {
                  if (askSpoken) return;
                  dispatch({ type: "elderPatch", patch: { askSpoken: true } });
                  dispatch({
                    type: "addRequest",
                    payload: {
                      id: `rq-${Date.now()}`,
                      dir: "fromElder",
                      type: "말로 남기신 부탁",
                      detail: "어르신이 음성으로 남긴 요청 — 컨시어지가 듣고 정리합니다",
                      amount: null,
                      preferredDate: null,
                      urgency: "normal",
                      assignee: "박지현",
                      photos: [],
                      status: "requested",
                      history: [{ at: Date.now(), status: "requested", note: "음성 요청" }],
                      proof: null,
                    },
                  });
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "부탁", text: `${ELDER.name} 음성 요청 접수 — 컨시어지 확인 대기`, color: "#B08D57" },
                  });
                }}
                variant={askSpoken ? "done" : "primary"}
                className="mt-3"
              >
                {askSpoken ? "말씀하신 내용을 전달했습니다" : "선생님께 말로 요청하기"}
              </ElderBtn>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                말씀만 남기시면 선생님이 듣고 정리해서 알려드립니다.
              </p>
            </ElderCard>

            {/* order 1~ · 무엇을 부탁할지 고르기 — 보호자 화면과 같은 메뉴·같은 단가.
                시작 예정인 서비스(no7~11)는 눌리지 않게 두고 "곧 시작합니다"만 표시한다. */}
            {ASK_CATS.map((cat, ci) => {
              const rows = SERVICE_MENU.filter((s) => s.cat === cat);
              if (rows.length === 0) return null;
              return (
                <ElderCard key={cat} show={tab === "ask"} order={2 + ci} style={LIGHT_CARD}>
                  <CardHead title={cat} right={ci === 0 ? "하나만 골라 주세요" : ""} />
                  <div className="mt-2 space-y-2">
                    {rows.map((a) => {
                      const on = askSel?.no === a.no;
                      return (
                        <button
                          key={a.no}
                          disabled={!a.active}
                          onClick={() => {
                            setAskSent(null);
                            setAskSel(on ? null : a);
                          }}
                          className="btn-press flex w-full items-start gap-3 text-left disabled:opacity-60"
                          style={{
                            ...SUB_CARD,
                            outline: on ? "3px solid #B08D57" : "none",
                            border: a.active ? undefined : "1px dashed rgba(10,31,60,.22)",
                          }}
                        >
                          <span
                            className="mt-[2px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold"
                            style={{
                              background: on ? "#1E7A5A" : "rgba(10,31,60,.08)",
                              color: on ? "#fff" : "transparent",
                            }}
                          >
                            ✓
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[19px] font-bold leading-[1.35] text-ink">{a.name}</span>
                            <span className="mt-0.5 block text-[18px] font-bold text-navy">
                              {a.active ? a.priceLabel : "곧 시작합니다"}
                            </span>
                            <span className="mt-0.5 block text-[17px] leading-[1.4] text-muted">{a.scope}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ElderCard>
              );
            })}

            {/* order 7 · 해주세요 PLUS — 집수리·공사·렌탈은 바깥 업체를 연결한다.
                책임 경계를 어르신 화면에도 그대로 쓴다 (공사 책임은 그 업체에 있다). */}
            <ElderCard show={tab === "ask"} order={7} style={LIGHT_CARD}>
              <CardHead title="집 고칠 일" right="바깥 업체 연결" />
              <div className="mt-2 space-y-2">
                {SERVICE_PLUS.map((p) => (
                  <div key={p.key} style={SUB_CARD}>
                    <div className="text-[20px] font-bold text-navy">{p.name}</div>
                    <div className="mt-0.5 text-[18px] font-bold text-[#7A5C28]">{p.priceLabel}</div>
                    <p className="mt-1 text-[18px] leading-[1.5] text-muted">{p.scope}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                알아보고 진행 상황을 알려드립니다. 공사 자체의 책임은 그 업체에 있습니다.
              </p>
            </ElderCard>

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
                  <CardHead
                    title="이렇게 부탁할까요"
                    right={askSel.amount === 0 ? "비용 없음" : askSel.amount == null ? "요금 확인 후 안내" : fmtWon(askSel.amount)}
                  />
                  <p className="mt-2 text-[22px] font-bold leading-[1.5] text-navy">{askSel.name}</p>
                  <p className="mt-1 text-[19px] leading-[1.6] text-muted">{askSel.scope}</p>
                  <p className="mt-3 rounded-2xl p-4 text-[19px] font-bold leading-[1.5]"
                     style={askPlan.approval
                       ? { background: "rgba(138,93,18,.1)", color: "#8A5D12" }
                       : { background: "rgba(30,122,90,.1)", color: "#1E7A5A" }}>
                    {askPlan.notice}
                  </p>
                  <ElderBtn
                    onClick={() => {
                      const amount = askSel.amount;
                      setAskSent({ name: askSel.name, mode: askPlan.mode, amount });
                      dispatch({
                        type: "addRequest",
                        payload: {
                          id: `rq-${Date.now()}`,
                          dir: "fromElder",
                          type: askPlan.approval ? "부탁 · 승인 필요" : "부탁",
                          detail: `${askSel.name} (${askSel.scope})`,
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
                              : {
                                  at: Date.now(),
                                  status: "inProgress",
                                  note:
                                    amount === 0
                                      ? "멤버십 포함"
                                      : amount == null
                                      ? "요금 확인 후 안내"
                                      : `어르신 직접 결제 ${fmtWon(amount)} (한도 내 · 데모)`,
                                },
                          ],
                          proof: null,
                        },
                      });
                      dispatch({
                        type: "pushEvent",
                        payload: {
                          kind: "부탁",
                          text: askPlan.approval
                            ? `${ELDER.name} 해주세요 — ${askSel.name} · 보호자 승인 요청 (${fmtWon(amount)})`
                            : `${ELDER.name} 해주세요 — ${askSel.name} · ${
                                amount === 0 ? "멤버십 포함" : amount == null ? "요금 확인 후 안내" : `직접 결제 ${fmtWon(amount)}`
                              }`,
                          color: "#B08D57",
                        },
                      });
                    }}
                    variant={askPlan.approval ? "primary" : "success"}
                  >
                    <span className="block leading-[1.35]">{askPlan.cta}</span>
                    <span className="block text-[19px] leading-[1.35] text-white/85">
                      {askSel.amount === 0 ? "비용 없음" : askSel.amount == null ? "요금 확인 후 안내" : fmtWon(askSel.amount)}
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

            {/* ══ 스토어 탭 — 2026-08-12 어르신화면 시트 전체 요청 5번 "스토어 탭 추가" ══
                보호자 스토어와 같은 카탈로그(lib/store.js)를 쓰되, 활자를 키우고
                한 화면에 한 분류만 보여준다. 담으면 결제권한(REQ-07)대로 갈린다. */}
            <ElderCard show={tab === "store"} order={0} style={LIGHT_CARD}>
              <CardHead title="무엇을 사드릴까요" right="담으면 배송으로 옵니다" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STORE_CATALOG.map((c) => {
                  const on = storeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setStoreCat(c.id)}
                      aria-pressed={on}
                      className="btn-press flex items-center gap-2.5 rounded-2xl border-2 px-3 py-4 text-left"
                      style={
                        on
                          ? { borderColor: "#0A1F3C", background: "#0A1F3C", color: "#FFFFFF" }
                          : { borderColor: "rgba(10,31,60,.15)", color: "#40413F" }
                      }
                    >
                      <Icon name={c.icon} size={26} strokeWidth={1.8} />
                      <span className="text-[19px] font-bold leading-[1.25]">{c.name}</span>
                    </button>
                  );
                })}
              </div>
              {storeCatalog.note && (
                <p className="mt-3 rounded-2xl px-4 py-3.5 text-[19px] leading-[1.6] text-muted" style={SUB_CARD}>
                  {storeCatalog.note}
                </p>
              )}
            </ElderCard>

            {storeCatalog.groups.map((g, gi) => (
              <ElderCard key={`${storeCatalog.id}-${g.name}`} show={tab === "store"} order={1 + gi}>
                <CardHead title={g.name} />
                <div className="mt-2 space-y-2">
                  {g.items.map((i) => {
                    const on = !!storeSel[i.id];
                    const off = !i.price; // 가격 확정 전 — 담기지 않는다
                    return (
                      <button
                        key={i.id}
                        disabled={off}
                        onClick={() => {
                          setStoreSent(null);
                          setStoreSel((s) => ({ ...s, [i.id]: !s[i.id] }));
                        }}
                        className="btn-press flex w-full items-center gap-3 text-left disabled:opacity-60"
                        style={{
                          ...SUB_CARD,
                          outline: on ? "3px solid #B08D57" : "none",
                          border: off ? "1px dashed rgba(10,31,60,.22)" : undefined,
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
                        <span className="min-w-0 flex-1">
                          <span className="block text-[19px] font-bold leading-[1.35] text-ink">{i.name}</span>
                          {i.note && (
                            <span className="mt-0.5 block text-[17px] leading-[1.4] text-muted">{i.note}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          {i.price ? (
                            <span className="font-num text-[20px] font-bold text-navy">{fmtWon(i.price)}</span>
                          ) : (
                            <span className="text-[17px] font-bold text-muted">{i.pending}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ElderCard>
            ))}

            {/* 담은 것 확인 · 주문 — 결제권한대로 문구가 갈린다 */}
            <ElderCard show={tab === "store"} order={9} style={LIGHT_CARD}>
              {storeSent ? (
                <>
                  <CardHead title="보냈습니다" right={storeSent === "approval" ? "승인 기다리는 중" : "주문됨"} />
                  <p className="mt-2 rounded-2xl bg-green/10 p-4 text-[19px] font-bold leading-[1.5] text-green">
                    {storeSent === "approval"
                      ? "가족에게 전달했습니다. 승인되면 배송으로 옵니다."
                      : "주문했습니다. 다음 배송 때 함께 옵니다."}
                  </p>
                  <ElderBtn onClick={() => setStoreSent(null)} variant="done" className="mt-4">
                    더 담기
                  </ElderBtn>
                </>
              ) : storeItems.length === 0 ? (
                <>
                  <CardHead title="담으시면 여기에 보입니다" />
                  <p className="mt-2 text-[20px] leading-[1.6] text-muted">
                    위에서 필요한 것을 눌러 주세요.
                  </p>
                </>
              ) : (
                <>
                  <CardHead title="담으신 것" right={`${storeItems.length}가지`} />
                  <div className="mt-2">
                    {storeItems.map((i) => (
                      <div
                        key={i.id}
                        className="flex items-baseline gap-3 border-t border-navy/[.07] py-3 first:border-t-0"
                      >
                        <span className="min-w-0 flex-1 text-[19px] text-ink">{i.name}</span>
                        <span className="font-num text-[19px] font-bold text-navy">{fmtWon(i.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between border-t-2 border-navy/[.12] pt-3">
                    <span className="text-[20px] font-bold text-navy">모두</span>
                    <span className="font-num text-[26px] font-bold text-navy">{fmtWon(storeTotal)}</span>
                  </div>
                  <ElderBtn
                    onClick={() => {
                      const mode = storeApproval ? "approval" : "ordered";
                      setStoreSent(mode);
                      setStoreSel({});
                      dispatch({ type: "demo", payload: { cart: true } });
                      dispatch({
                        type: "addRequest",
                        payload: {
                          id: `rq-${Date.now()}`,
                          dir: "fromElder",
                          type: storeApproval ? "물건 승인 부탁해요" : "물건을 담았어요",
                          detail: `스토어에서 담으신 물품: ${storeItems.map((i) => i.name).join(", ")}`,
                          amount: storeTotal,
                          preferredDate: null,
                          urgency: "normal",
                          assignee: "박지현",
                          photos: [],
                          status: storeApproval ? "awaitingPayment" : "inProgress",
                          history: [
                            { at: Date.now(), status: "requested", note: "어르신 스토어" },
                            { at: Date.now(), status: "confirmed", note: "" },
                            storeApproval
                              ? { at: Date.now(), status: "awaitingPayment", note: `한도 초과 · ${fmtWon(storeTotal)}` }
                              : { at: Date.now(), status: "inProgress", note: `어르신 직접 결제 ${fmtWon(storeTotal)} (한도 내 · 데모)` },
                          ],
                          proof: null,
                        },
                      });
                      if (!storeApproval) {
                        dispatch({
                          type: "addOrder",
                          payload: {
                            by: `${ELDER.name} 님`,
                            channel: "어르신 스토어",
                            items: storeItems.map((i) => ({ id: i.id, name: i.name, qty: 1, price: i.price })),
                            ship: storeItems.reduce((s, i) => s + (i.ship || 0), 0),
                            status: "preparing",
                            receipt: null,
                            note: "",
                          },
                        });
                      }
                      dispatch({
                        type: "pushEvent",
                        payload: {
                          kind: "장바구니",
                          text: storeApproval
                            ? `${ELDER.name} 스토어 ${storeItems.length}건 · 보호자 승인 요청 (${fmtWon(storeTotal)})`
                            : `${ELDER.name} 직접 주문 ${storeItems.length}건 · ${fmtWon(storeTotal)} (한도 내)`,
                          color: "#B08D57",
                        },
                      });
                    }}
                    variant={storeApproval ? "primary" : "success"}
                    className="mt-4"
                  >
                    <span className="block leading-[1.35]">
                      {storeApproval ? "가족에게 부탁하기" : "바로 주문하기"}
                    </span>
                    <span className="block text-[19px] leading-[1.35] text-white/85">
                      {storeItems.length}가지 · {fmtWon(storeTotal)}
                    </span>
                  </ElderBtn>
                </>
              )}
            </ElderCard>

            {/* order 5 · 목소리 보내기 — 이름을 누르면 바로 녹음이 시작된다.
                '꾹 누르고 말하기' 버튼은 삭제 (시트 '가족' 1번). 누르고 있는 동안만
                녹음되는 방식은 손 떨림이 있으면 중간에 끊긴다 — 눌렀다 떼는 방식으로 바꿨다. */}
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
                보낼 사람 이름을 누르면
                <br />
                바로 말씀하실 수 있습니다.
              </p>
              <VoiceRecorder
                to={voiceTo}
                onPick={setVoiceTo}
                sent={voiceSent}
                onSend={(sec, target) => {
                  setVoiceSent((v) => [{ to: target.name, sec }, ...v]);
                  dispatch({
                    type: "addVoice",
                    payload: { from: `${ELDER.name} 님`, to: target.name, secs: sec, context: "안부" },
                  });
                  dispatch({
                    type: "pushEvent",
                    payload: {
                      kind: "메시지",
                      text: `${ELDER.name}(${ELDER.age}) → ${target.name} 목소리 메시지 ${sec}초 전송`,
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

            {/* 필요한 물건 · 토요일 배송 카드는 삭제 (2026-08-12 어르신화면 시트 가족 2번).
                물건은 새로 만든 스토어 탭에서 본다 — 가족 탭에 상거래를 섞지 않는다. */}

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

          {/* ── 고정 푸터: 탭 (스크롤 밖 — 06 원칙 5) ──
              '선생님께 전화'는 전체 탭에서 삭제 (2026-08-12 시트 전체 요청 2번).
              전화는 오늘 오시는 분에게만, '오늘 찾아뵙는 분' 카드 안에서 연다. */}
          <footer className="shrink-0 pb-3 pt-4">
            {/* 하단 탭 5개 — 아이콘+라벨 병행 (아이콘 전용 금지) */}
            <nav className="flex border-t border-navy/[.12] pt-2">
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

        {/* SOS — 화면 안 버튼은 없앴고(시트 전체 요청 3번), 바탕화면 바로가기로만 들어온다.
            /elder?sos=1 로 열리면 5초 취소 유예 화면이 바로 뜬다. */}
        <SosButton
          phase={sosPhase}
          setPhase={setSosPhase}
          onDispatch={() => {
            dispatch({ type: "demo", payload: { sos: true } });
            dispatch({
              type: "pushEvent",
              payload: {
                kind: "SOS",
                text: `${ELDER.name}(${ELDER.age}) SOS 발신 · 가족·관제 동시 점등`,
                color: "#FF8A80",
              },
            });
          }}
        />
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

// 목소리 보내기 — 이름을 누르면 그 자리에서 녹음이 시작되고, 다시 누르면 보낸다.
// 2026-08-12 어르신화면 시트 가족 1번: "꾹 누르고 말하기 버튼 삭제하고 가족 이름을
// 바로 눌러서 메시지를 보낼 수 있게". 누르고 있는 동안만 녹음되는 방식은 손 떨림이
// 있으면 중간에 끊긴다 — 눌렀다 떼는 토글로 바꿨다.
// 빨강은 SOS 전용이므로 녹음 중 색은 금색 계열을 쓴다 (06 §4.2).
function VoiceRecorder({ to, onPick, onSend, sent }) {
  const [sec, setSec] = useState(0);
  const [tooShort, setTooShort] = useState(false);
  const timer = useRef(null);

  const start = (v) => {
    setTooShort(false);
    setSec(0);
    onPick(v);
    clearInterval(timer.current);
    timer.current = setInterval(() => setSec((n) => Math.min(60, n + 1)), 1000);
  };
  const finish = (v) => {
    clearInterval(timer.current);
    onPick(null);
    if (sec < 1) {
      setTooShort(true); // 스치듯 눌린 것은 보내지 않는다
      setSec(0);
      return;
    }
    onSend(sec, v);
    setSec(0);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <>
      <div className="mt-3 space-y-2.5">
        {VOICE_TO.map((v) => {
          const on = to?.id === v.id;
          return (
            <button
              key={v.id}
              onClick={() => (on ? finish(v) : start(v))}
              aria-label={on ? `${v.name}에게 보내기` : `${v.name}에게 목소리 남기기`}
              className="btn-press flex w-full items-center gap-3.5 rounded-[14px] p-4 text-left"
              style={
                on
                  ? {
                      borderRadius: 14,
                      padding: "16px 15px",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,.04) 55%), rgba(176,141,87,.92)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 12px 24px -10px rgba(176,141,87,.6)",
                    }
                  : { ...SUB_CARD, padding: "16px 15px" }
              }
            >
              <span
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[16px] font-bold"
                style={on ? { background: "rgba(255,255,255,.9)", color: "#7A5C28" } : { background: v.avBg, color: v.avFg }}
              >
                {v.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[21px] font-bold leading-[1.3]"
                  style={{ color: on ? "#FFFFFF" : "#0A1F3C" }}
                >
                  {v.name}
                </span>
                <span
                  className="block text-[18px] leading-[1.35]"
                  style={{ color: on ? "rgba(255,255,255,.88)" : "#5C5A54" }}
                >
                  {on ? `말씀하세요  ${sec}초 · 다시 누르면 보냅니다` : v.sub}
                </span>
              </span>
              <span className="shrink-0" style={{ color: on ? "#FFFFFF" : "#0A1F3C" }}>
                <Icon name="mic" size={28} strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>

      {/* 녹음 중 파형 — 소리가 들어가고 있다는 것을 눈으로 확인 */}
      {to && (
        <span className="mt-3 flex items-end justify-center gap-[3px]" aria-hidden>
          {[10, 20, 14, 26, 16, 30, 12, 22, 18, 28, 13, 24].map((h, i) => (
            <span
              key={i}
              className="w-[5px] rounded-full bg-gold/80"
              style={{ height: h, animation: `sosPulse 1s ease-in-out ${i * 0.08}s infinite` }}
            />
          ))}
        </span>
      )}

      {tooShort && (
        <p className="mt-3 text-[19px] font-bold leading-[1.5] text-amber">
          너무 짧습니다. 조금 더 길게 말씀해 주세요.
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

// 즉시 방문 요청 — 화면 안 SOS 버튼을 대신하는 원형 버튼 (2026-08-12 시트 전체 요청 4번).
// SOS 는 "지금 위험하다"이고 이것은 "지금 와 주셨으면 한다"다. 둘을 색으로 가른다 —
// 빨강은 SOS 전용이므로 이 버튼은 네이비다.
function VisitNowButton({ done, onAsk }) {
  return (
    <button
      onClick={() => !done && onAsk()}
      aria-label={done ? "즉시 방문을 요청했습니다" : "지금 와 주세요 — 즉시 방문 요청"}
      className="btn-press flex h-[104px] w-[104px] shrink-0 select-none flex-col items-center justify-center gap-0.5 rounded-full text-center"
      style={
        done
          ? {
              background: "rgba(30,122,90,.12)",
              color: "#1E7A5A",
              border: "2px solid rgba(30,122,90,.35)",
            }
          : {
              background:
                "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.03) 55%), #0A1F3C",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,.35)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.4), inset 0 -4px 0 rgba(0,0,0,.28), 0 14px 26px -12px rgba(10,31,60,.6)",
            }
      }
    >
      <span aria-hidden style={{ color: done ? "#1E7A5A" : "#C9A46B" }}>
        <Icon name={done ? "clock" : "door"} size={26} strokeWidth={2} />
      </span>
      <span className="text-[19px] font-black leading-[1.2]">
        {done ? (
          "요청됨"
        ) : (
          <>
            지금
            <br />
            와 주세요
          </>
        )}
      </span>
    </button>
  );
}

// SOS — REQ-06 확정: 5초 취소 카운트다운 → 자동 접수.
//
// 2026-08-12 시트로 화면 안 트리거 버튼은 없앴다. 이제 진입점은 바탕화면 바로가기
// (/elder?sos=1) 하나뿐이라, 이 컴포넌트는 취소 유예 화면과 접수 화면만 그린다.
// 화면 안에 SOS 와 즉시방문요청이 나란히 있으면 급할 때 무엇을 눌러야 할지 고르게 된다.
function SosButton({ phase, setPhase, onDispatch }) {
  const [count, setCount] = useState(5);
  const countTimer = useRef(null);

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
