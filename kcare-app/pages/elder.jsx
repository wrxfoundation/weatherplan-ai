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
  VITALS,
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
//
// 2026-08-24 참고 시안 반영: 분류별 세로 목록 대신 아이콘 타일 12개(3열)를 펼치고,
// 누르면 상세 시트가 열린다. 타일 12개 = SERVICE_MENU 12개 그대로 — 시안에만 있는
// 서비스를 새로 만들지 않았다. 시안의 장보기·말벗·산책은 생활 대행(no6)의 범위라
// 그 타일의 작은 글씨로 보여준다. 아이콘은 우리 라인 아이콘 체계(3D 아님)를 쓴다.
const ASK_TILES = [
  { no: 1, label: "병원 예약", icon: "calendar" },
  { no: 2, label: "병원 동행", sub: "2인 1조", icon: "users" },
  { no: 3, label: "병원 동행", sub: "1인", icon: "user" },
  { no: 4, label: "요양병원", sub: "안심케어", icon: "hospital" },
  { no: 5, label: "안심방문", sub: "추가 방문", icon: "home" },
  { no: 6, label: "생활 대행", sub: "장보기 · 말벗", icon: "bag" },
  { no: 7, label: "청소", icon: "sparkle" },
  { no: 8, label: "집수리", icon: "wrench" },
  { no: 9, label: "복지 혜택", icon: "doc" },
  { no: 10, label: "요양보호사", icon: "hand" },
  { no: 11, label: "방문 간호", icon: "plus" },
  { no: 12, label: "응급 대응", icon: "alert" },
];

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

// 접기/펴기·더 보기 공용 버튼 스타일 — 처음에는 2px 회색 테두리 상자였는데
// "테두리가 짜쳐 보인다"는 피드백(2026-08-24)로 채움형 알약로 바꿨다.
// 테두리 대신 옅은 남색 채움이 눌리는 자리임을 말하고, 셰브론만 골드로 짚는다.
// 52px 높이·19px 글자는 어르신 규격 그대로다.
const QUIET_BTN =
  "btn-press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-[19px] font-bold text-navy";
const QUIET_BG = { background: "rgba(10,31,60,.06)" };

// 요약 + 접기 카드 (2026-08-24 실무진 참고 시안 — "접기 펴고 요약 형태로 심플하게").
// 제목 옆 배지와 summary 는 접힌 채로도 항상 보인다 — 자세히 보기는 세부를 위한 것이지
// 무슨 내용인지 알기 위한 것이 아니다. 세부는 열 때만 DOM에 붙는다(스크린리더가
// 접힌 내용을 계속 읽지 않도록).
//
// 우리 디자인 토큰(ElderCard·CardHead·19px 본문·btn-press)은 그대로 쓰고, 시안의
// 상호작용 패턴(제목+한 줄 요약 → 탭하면 세부)만 가져왔다.
function ElderExpand({ show, order, style, title, right, rightColor, icon, iconColor, summary, open, onToggle, children }) {
  return (
    <ElderCard show={show} order={order} style={style}>
      <CardHead title={title} right={right} rightColor={rightColor} icon={icon} iconColor={iconColor} />
      {summary && <p className="mt-2 text-[20px] leading-[1.6] text-ink">{summary}</p>}
      <button onClick={onToggle} aria-expanded={open} className={`${QUIET_BTN} mt-3`} style={QUIET_BG}>
        {open ? "접기" : "자세히 보기"}
        <span
          aria-hidden
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none", color: "#B08D57" }}
        >
          <Icon name="chev" size={22} strokeWidth={2} />
        </span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </ElderCard>
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

// icon — 카드 제목마다 다른 모양을 붙여 스캔 속도를 올린다 (2026-08-24
// "아직도 복잡해 보인다" 검수). 뜻을 읽어서 구분하는 대신 모양으로 먼저
// 구분하게 한다 — 접기 요약을 넣은 것과 같은 목적, 다른 수단이다.
// 없으면 예전처럼 텍스트만 나온다 (하위 호환 — 모든 CardHead 를 바꿀 필요는 없다).
function CardHead({ title, titleColor = "#0A1F3C", right, rightColor = "#5C5A54", icon, iconColor = "#B08D57" }) {
  // 제목과 보조 라벨이 한 줄에 안 들어가면 보조 라벨을 아래로 내린다.
  // 붙여 두면 좁은 화면에서 제목이 "부탁하시면 저희가 / 합니다"처럼 어색하게 끊긴다.
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <div className="flex min-w-0 items-center gap-2">
        {icon && (
          <span aria-hidden className="shrink-0" style={{ color: iconColor }}>
            <Icon name={icon} size={22} strokeWidth={1.9} />
          </span>
        )}
        <span className="min-w-0 text-[19px] font-bold" style={{ color: titleColor }}>
          {title}
        </span>
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
  const [storeGroup, setStoreGroup] = useState(0); // 소분류 — 분류를 바꾸면 첫 칸으로 돌아간다
  // askOpen(해주세요 아코디언)은 타일 그리드 + 시트로 바뀌면서 없앴다 (2026-08-24)
  const [vitalsOpen, setVitalsOpen] = useState(false); // 건강 탭 — 몸 상태 세부
  const [calOpen, setCalOpen] = useState(false); // 오늘 탭 — 이번 달 달력
  const [visitorOpen, setVisitorOpen] = useState(false); // 오늘 찾아뵙는 분 세부
  const [outingOpen, setOutingOpen] = useState(false); // 병원 가는 길 세부
  const [askDoctorOpen, setAskDoctorOpen] = useState(false); // 오늘 여쭤볼 것 세부
  const [supOpen, setSupOpen] = useState(false); // 드시는 건강식품 세부
  // 지금 집 안 — 경고가 있는 날은 펼친 채로 시작한다 (중요한 건 접지 않는다)
  const [indoorOpen, setIndoorOpen] = useState(() => INDOOR.hot.level !== "ok");
  const [calSel, setCalSel] = useState(new Date().getDate()); // 고른 날짜 (이번 달 기준)
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

  // 이번 달 달력 — 공유 일정(state.events)을 날짜별로 센다 (시트 어르신 오늘 1번).
  // 지난 일정도 달력에는 남긴다. "그날 뭐였더라"를 확인하는 것이 달력의 쓸모다.
  // now 는 위에서 인사말 날짜에 쓰려고 이미 만들어 둔 것을 그대로 쓴다.
  const monthLabel = `${now.getMonth() + 1}월`;
  const monthEvents = state.events.filter((e) => {
    const d = new Date(e.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthCells = (() => {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= last; d++) {
      cells.push({
        day: d,
        today: d === now.getDate(),
        count: monthEvents.filter((e) => new Date(e.at).getDate() === d).length,
      });
    }
    return cells;
  })();
  const selDayEvents = monthEvents
    .filter((e) => new Date(e.at).getDate() === calSel)
    .sort((a, b) => a.at - b.at);

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
  const nextVisit = upcoming.find((e) => e.kind === "visit"); // 방문 아닌 날 안내용

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
        <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col break-keep bg-elder px-4 min-[380px]:px-[22px]">
          {/* ── 카드 스택 (유일한 스크롤 영역) ──
              헤더(날짜·인사)도 고정을 풀었다 (2026-08-24 피드백 — "이거 자체도
              고정 풀어버리고"). 이제 화면에 붙박이는 오른쪽 위 플로팅 버튼과
              하단 탭바뿐이고, 나머지는 전부 카드와 함께 스크롤되어 올라간다. */}
          <main
            ref={scrollRef}
            className="elder-scroll -mx-2 flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-2 pb-6"
          >
            {/* 인사 블록 — 스크롤 첫 요소 (모든 탭 공통, order -10).
                데모 홈 링크는 오른쪽 위가 플로팅 버튼 자리가 되면서 K-CARE 옆으로
                옮겼다 — 버튼 아래 깔리면 시연 때 못 누른다. 날짜 위 여백(mt-8)은
                오른쪽 위 버튼과 날짜 글줄이 겹치지 않기 위한 것 — 탭 전환 시
                스크롤이 맨 위로 돌아오므로(setTab) 인사도 늘 다시 보인다. */}
            <div className="shrink-0" style={{ order: -10 }}>
              {/* gap-2.5·구분점 없음 — 375px 화면에서 오른쪽 위 버튼(왼쪽 끝 x≈153)과
                  겹치지 않으려면 이 줄이 140px 안에 끝나야 한다 (실측). */}
              <div className="flex items-center gap-2.5 pt-5">
                <span className="font-num text-[12px] font-bold tracking-[.16em] text-gold">
                  K-CARE
                </span>
                <Link href="/" className="tap text-[13px] font-bold text-muted/50">
                  데모 홈
                </Link>
              </div>
              <div className="mt-8 text-[19px] font-medium text-muted">{dateLong}</div>
              {/* 호칭은 "~~님"으로 통일 — '어르신' 표기 삭제 (2026-08-12 시트 전체 요청 1번) */}
              <h1 className="text-[27px] font-black leading-[1.3] text-navy">{name} 님, 안녕하세요</h1>
            </div>
            {/* order 0 · 오늘 찾아뵙는 분 — 방문 사기 방어. 유일한 2px 테두리.
                방문일에만 이름·사진을 보여준다 (2026-08-24 검수에서 발견한 오류를 고쳤다).
                전에는 방문이 없는 날에도 "두 분이 함께 옵니다"가 그대로 떠서, 오늘
                방문이 없다는 것을 이 카드 안에서만 봐서는 알 수 없었다 — 안전 확인
                카드가 틀린 안내를 하고 있었다.
                접어도 요지(누가 오는지 · 아무도 안 오는지)는 요약 줄에 그대로 남는다
                — 자세히 보기는 사진·전화를 위한 것이지, 사실을 감추는 자리가 아니다
                (2026-08-24 실무진 참고 시안). */}
            <ElderExpand
              show={tab === "today"}
              order={0}
              style={{ ...LIGHT_CARD, border: "2px solid #B08D57" }}
              title="오늘 찾아뵙는 분"
              icon="users"
              summary={
                visitToday
                  ? `${ELDER_VISITORS.map((v) => v.displayName).join(" · ")}이 옵니다`
                  : `오늘은 없습니다${nextVisit ? ` · 다음 방문 ${spokenDay(nextVisit.at)}` : ""}`
              }
              open={visitorOpen}
              onToggle={() => setVisitorOpen((v) => !v)}
            >
              {visitToday ? (
                <>
                  <p className="text-[20px] leading-[1.6] text-ink">
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
                  <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                    두 분 다 K-CARE 이름표를 걸고 옵니다. 이름이 다르면 문을 열지 마시고 바탕화면의
                    빨간 SOS를 누르세요.
                  </p>
                </>
              ) : (
                <p className="text-[19px] leading-[1.6] text-muted">
                  오늘 K-CARE라며 찾아오시는 분이 있다면 문을 열지 마시고 바탕화면의 빨간 SOS를
                  누르세요. 급한 일이 있으시면 위의 즉시 방문 요청을 눌러 주세요.
                </p>
              )}
            </ElderExpand>

            {/* order 2 · 오늘 나는 — 보호자 홈의 "오늘 어머니는"과 같은 내용을
                1인칭으로. 어제 숫자를 나란히 둔다 (시트 '오늘' 2번).
                안부 전화 카드는 같은 시트 대표 피드백으로 삭제. */}
            <ElderCard show={tab === "today"} order={2}>
              <CardHead title="오늘 나는" right="어제와 비교" icon="activity" />
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
              {/* 오늘에서 누르면 건강 탭의 몸 상태가 펼쳐진 채로 열린다 (2026-08-21 시안).
                  같은 숫자를 두 탭에 늘어놓지 않고, 더 보고 싶을 때만 넘어가게 한다. */}
              <button
                onClick={() => {
                  setVitalsOpen(true);
                  setTab("health");
                }}
                className={`${QUIET_BTN} mt-3`}
                style={QUIET_BG}
              >
                건강에서 더 보기
                <span aria-hidden className="-rotate-90" style={{ color: "#B08D57" }}>
                  <Icon name="chev" size={22} strokeWidth={2} />
                </span>
              </button>
            </ElderCard>

            {/* order 7 · 바탕화면 SOS 바로가기 안내 — 화면 안 SOS 버튼을 뺐으니
                어디를 눌러야 하는지는 반드시 말해 줘야 한다 (시트 전체 요청 3번) */}
            <ElderCard show={tab === "today"} order={7}>
              <CardHead title="급할 때 누르는 곳" right="바탕화면" icon="alert" />
              <p className="mt-2 text-[20px] leading-[1.6] text-ink">
                휴대폰 바탕화면에 있는
                <br />
                빨간 <b>SOS</b> 그림을 누르시면
                <br />
                바로 도움을 부릅니다.
              </p>
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">
                첫 안심방문 때 선생님이 바탕화면에 만들어 드립니다. 실수로 눌러도 5초 안에
                취소됩니다.
              </p>
            </ElderCard>

            {/* 즉시방문 요청 뒤 — 관제 확인 전화 대기 (2026-08-21 시트 어르신 전체 2번).
                요청하면 바로 배차가 아니라 관제가 먼저 전화로 상황을 여쭙는다.
                기다리는 동안 화면이 아무 말도 하지 않으면 다시 누르게 된다. */}
            {visitAsked && (
              <ElderCard
                show={tab === "today"}
                order={0.5}
                style={{
                  background: "#0A1F3C",
                  backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.22), 0 24px 48px -30px rgba(10,31,60,.85)",
                }}
                className="text-white"
              >
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="h-[11px] w-[11px] animate-livePing rounded-full bg-gold-soft" />
                  <span className="text-[19px] font-bold text-gold">관제에서 전화를 드립니다</span>
                </div>
                <p className="mt-2 text-[22px] font-bold leading-[1.45]">
                  전화를 받으시면
                  <br />
                  무엇이 필요하신지 여쭙습니다
                </p>
                <p className="mt-2 text-[19px] leading-[1.6] text-white/[.86]">
                  통화를 마치면 선생님이 출발합니다. 급하시면 바탕화면의 빨간 SOS를 누르세요.
                </p>
              </ElderCard>
            )}

            {/* order 0 · 이번 달 — 가족·컨시어지와 함께 보는 일정 (2026-08-21 시트 어르신 오늘 1번).
                접힌 채로도 오늘 날짜와 일정 있는 날 수가 보인다. 펼치면 달력이 나오고,
                날짜를 누르면 그 날 일정이 아래에 뜬다. 같은 일정을 보호자 캘린더와
                공유한다 (REQ-02) — 여기서 새 일정을 만들지는 않는다. 간단등록은
                '다가오는 일정' 카드에 이미 있고, 두 자리에 두면 어디서 넣었는지 헷갈린다. */}
            <ElderCard show={tab === "today"} order={0} style={LIGHT_CARD}>
              <CardHead title="이번 달" right={`${monthLabel} · 일정 ${monthEvents.length}건`} icon="calendar" />
              <button
                onClick={() => setCalOpen((v) => !v)}
                aria-expanded={calOpen}
                className={`${QUIET_BTN} mt-2.5`}
                style={QUIET_BG}
              >
                {calOpen ? "달력 접기" : "달력 보기"}
                <span
                  aria-hidden
                  className="transition-transform duration-200"
                  style={{ transform: calOpen ? "rotate(180deg)" : "none", color: "#B08D57" }}
                >
                  <Icon name="chev" size={22} strokeWidth={2} />
                </span>
              </button>
              {calOpen && (
                <>
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                    {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                      <div key={d} className="py-1 text-[17px] font-bold text-muted">
                        {d}
                      </div>
                    ))}
                    {monthCells.map((c, i) =>
                      c === null ? (
                        <div key={`b${i}`} />
                      ) : (
                        <button
                          key={c.day}
                          onClick={() => setCalSel(c.day)}
                          aria-pressed={calSel === c.day}
                          aria-label={`${c.day}일${c.count ? ` · 일정 ${c.count}건` : ""}`}
                          className="btn-press flex min-h-[46px] flex-col items-center justify-center rounded-xl font-num text-[19px] font-bold"
                          style={
                            calSel === c.day
                              ? { background: "#0A1F3C", color: "#FFFFFF" }
                              : { color: c.today ? "#B08D57" : "#40413F" }
                          }
                        >
                          {c.day}
                          <span
                            aria-hidden
                            className="mt-0.5 h-[6px] w-[6px] rounded-full"
                            style={{
                              background: c.count
                                ? calSel === c.day
                                  ? "#C9A46B"
                                  : "#B08D57"
                                : "transparent",
                            }}
                          />
                        </button>
                      )
                    )}
                  </div>
                  <div className="mt-3 border-t border-navy/[.08] pt-3">
                    {selDayEvents.length === 0 ? (
                      <p className="text-[19px] leading-[1.6] text-muted">
                        {calSel}일에는 잡힌 일정이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selDayEvents.map((e) => (
                          <div key={e.id} style={SUB_CARD}>
                            <div className="text-[20px] font-bold text-navy">{spokenTime(e.at)}</div>
                            <div className="mt-0.5 text-[19px] leading-[1.45] text-ink">{e.title}</div>
                            {e.note && (
                              <div className="mt-0.5 text-[18px] leading-[1.45] text-muted">{e.note}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-2.5 text-[18px] leading-[1.55] text-muted">
                      가족과 선생님이 같은 달력을 봅니다.
                    </p>
                  </div>
                </>
              )}
            </ElderCard>

            {/* order 1 · 오늘 일정 — 유일한 네이비 다크 카드.
                전에는 "다음 일정"(여기)과 "다가오는 일정"(그 다음 목록 + 등록)이
                탭 안에서 네 장 떨어진 채 따로 있었다. 같은 주제가 두 곳에 있으면
                "일정이 왜 두 군데 있지"가 된다. 그 다음 일정과 등록 버튼을 여기로
                옮겨 한 장으로 합쳤다 (2026-08-24 검수 — "아직 복잡하다"). */}
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
                <div className="flex items-center gap-2 text-[19px] font-bold text-gold">
                  <Icon name="clock" size={20} strokeWidth={1.9} />
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

                {/* 그 다음 일정 — 조회 + 간단등록 (REQ-02 어르신 권한: 조회·알림확인·간단등록) */}
                {upcoming.length > 1 && (
                  <div className="mt-4 border-t border-white/15 pt-3.5">
                    <div className="text-[17px] font-bold text-white/70">그 다음</div>
                    {upcoming.slice(1, 3).map((e) => (
                      <div key={e.id} className="border-t border-white/10 py-3 first:border-t-0 first:pt-2">
                        <div className="text-[19px] font-bold">
                          {spokenDay(e.at)} {spokenTime(e.at)}
                        </div>
                        <div className="mt-[3px] text-[18px] text-white/70">
                          {e.title} · {EVENT_KINDS[e.kind].label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setEventSheet(true)}
                  className="btn-press mt-3 flex min-h-[52px] w-full items-center justify-center rounded-full text-[19px] font-bold text-white"
                  style={{ background: "rgba(255,255,255,.13)" }}
                >
                  일정 하나 남기기
                </button>
              </ElderCard>
            )}
            {/* next 가 없을 때(잡힌 일정 0건)의 등록 자리 — 위 네이비 카드가 next 를
                전제로 하므로, 없을 때도 "일정 하나 남기기"가 사라지지 않게 둔다.
                지금 시드 데이터로는 일어나지 않지만 없앨 이유는 아니다. */}
            {!next && (
              <ElderCard show={tab === "today"} order={1}>
                <CardHead title="다가오는 일정" />
                <p className="text-[19px] leading-[1.6] text-muted">잡힌 일정이 없습니다.</p>
                <ElderBtn className="mt-2" onClick={() => setEventSheet(true)}>
                  일정 하나 남기기
                </ElderBtn>
              </ElderCard>
            )}

            {/* order 2 · 오늘 약 — 첫 안심방문에서 등록한 계획을 직접 체크한다.
                진행바는 '전체 횟수 중 복용 횟수' (시트 '건강' 1번). */}
            {/* order 0 · 오늘 몸 상태 — 건강 탭 최상단 실시간 요약 (2026-08-21 시트 건강 1번).
                요약 세 줄은 접지 않는다. 접힌 채로도 걸음·잠·맥박이 보여야 하고, 세부만
                펼친다 — 매일 보는 숫자를 두 번 눌러야 나오면 접은 것이 손해다. */}
            <ElderCard show={tab === "health"} order={0}>
              <CardHead title="오늘 몸 상태" right="갤럭시 핏" icon="activity" />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[20px] leading-[1.5] text-ink">
                {TODAY_ME.rows.map((r) => {
                  // 이름과 단위가 같으면(걸음/걸음) 단위를 뺀다 — "걸음 3,140걸음"이 된다
                  const unit = r.unit === "번 드심" ? "번" : r.unit === r.name ? "" : r.unit;
                  return (
                    <span key={r.name}>
                      {r.name} <b className="font-num text-navy">{r.today}</b>
                      {unit && <span className="text-muted">{unit}</span>}
                    </span>
                  );
                })}
                <span>
                  맥박 <b className="font-num text-navy">{VITALS[0].value}</b>
                  <span className="text-muted">{VITALS[0].unit}</span>
                </span>
              </div>
              <button
                onClick={() => setVitalsOpen((v) => !v)}
                aria-expanded={vitalsOpen}
                className={`${QUIET_BTN} mt-3`}
                style={QUIET_BG}
              >
                {vitalsOpen ? "접기" : "자세히 보기"}
                <span
                  aria-hidden
                  className="transition-transform duration-200"
                  style={{ transform: vitalsOpen ? "rotate(180deg)" : "none", color: "#B08D57" }}
                >
                  <Icon name="chev" size={22} strokeWidth={2} />
                </span>
              </button>
              {vitalsOpen && (
                <div className="mt-2.5">
                  {VITALS.map((v) => (
                    <div
                      key={v.name}
                      className="flex items-baseline gap-3 border-t border-navy/[.07] py-3.5 first:border-t-0"
                    >
                      <span className="w-[104px] shrink-0 text-[19px] font-bold text-navy">{v.name}</span>
                      <span className="flex-1">
                        <span className="font-num text-[24px] font-bold text-navy">{v.value}</span>
                        <span className="ml-1 text-[19px] text-muted">{v.unit}</span>
                      </span>
                      <span className="text-right text-[18px] leading-[1.4] text-muted">{v.status}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[19px] leading-[1.6] text-muted">{TODAY_ME.foot}</p>
            </ElderCard>

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
              <CardHead title="오늘 약" right={`${med.total}번 중 ${med.done}번 드셨습니다`} icon="pill" />
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
            <ElderExpand
              show={tab === "health"}
              order={3}
              title="드시는 건강식품"
              icon="drop"
              right={supAlerts.length ? `${supAlerts.length}가지 챙기실 것` : "넉넉합니다"}
              rightColor={supAlerts.length ? "#8A5D12" : "#5C5A54"}
              open={supOpen}
              onToggle={() => setSupOpen((v) => !v)}
            >
              <div className="space-y-2.5">
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
            </ElderExpand>

            {/* order 4 · 지금 집 안 — 상태를 보여주고, 무엇을 하면 좋은지 한 문장으로 권한다.
                "에어컨 켜고 가족에게 알리기" 버튼은 삭제 (시트 '건강' 대표 피드백).
                기기를 대신 켜 주지 못하면서 켜 준 것처럼 보이는 버튼이었다.
                경고가 있는 날은 펼친 채로 시작한다 — 온열질환 경고를 접어 두면
                안 된다. 경고가 없는 날은 접혀 시작하되 온도는 요약 줄에 남는다. */}
            <ElderExpand
              show={tab === "health"}
              order={4}
              title="지금 집 안"
              icon="home"
              right="실내 · 거실 센서"
              summary={`${indoor.tempLabel} · ${indoor.sub}`}
              open={indoorOpen}
              onToggle={() => setIndoorOpen((v) => !v)}
            >
              <div className="flex items-end gap-3">
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
            </ElderExpand>

            {/* order 4 · 오늘 여쭤볼 것 — 인지 부담 면제. 출처 3종 투명 표기 */}
            <ElderExpand
              show={tab === "today"}
              order={4}
              title="오늘 여쭤볼 것"
              icon="chat"
              summary={`${ASK_DOCTOR.length}가지 · 잊으셔도 됩니다, 선생님이 대신 여쭤봅니다`}
              open={askDoctorOpen}
              onToggle={() => setAskDoctorOpen((v) => !v)}
            >
              <div>
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
            </ElderExpand>

            {/* order 4 · 병원 가는 길 — F8 2구간. 점수를 문장으로 번역하는 유일한 화면.
                요약 줄에 오늘의 조언을 그대로 둔다 — 준비물·주의사항은 접혀 있어도
                놓치면 안 되는 내용이라, 열어야만 보이게 하지 않는다. */}
            <ElderExpand
              show={tab === "today"}
              order={3}
              title="병원 가는 길"
              icon="pin"
              summary={OUTING.adviceElder}
              open={outingOpen}
              onToggle={() => setOutingOpen((v) => !v)}
            >
              <div className="space-y-2.5">
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
              {/* "오늘은 이렇게 하세요" 문구는 위 요약 줄에 이미 있다(접혀도 보인다) —
                  펼친 화면에서 같은 문장을 두 번 두지 않는다. */}
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
            </ElderExpand>

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
              {/* #5C7799 는 흰 카드 위에서 4.49:1 — WCAG AA 4.5:1 에 0.01 모자랐다.
                  같은 파란 계열이면서 이미 다른 화면에서 쓰는 #3B5C8A 로 바꿨다. */}
              <CardHead title="지금 우리 동네" right={`실외 · ${ELDER.dong}`} rightColor="#3B5C8A" icon="sun" iconColor="#3B5C8A" />
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
            {/* order 0 · 헤딩 + 결제권한 한 줄 + 말로 부탁하기 배너 (2026-08-24 참고 시안).
                결제 한도 설명은 카드 하나를 통째로 쓰던 것을 헤딩 밑 한 줄로 줄였다. */}
            <div className="shrink-0" style={{ order: 0, display: tab === "ask" ? undefined : "none" }}>
              <h2 className="text-[24px] font-black leading-[1.3] text-navy">무엇을 해드릴까요?</h2>
              <p className="mt-1.5 text-[18px] leading-[1.55] text-muted">{payRule.headline}</p>
              {/* 말로 부탁하기 — 목록에 없어도 말로 남기면 선생님이 듣고 정리한다 */}
              <button
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
                className="btn-elder btn-press mt-3 flex w-full items-center justify-center gap-3 rounded-[20px] p-6 text-[22px] font-bold"
                style={
                  askSpoken
                    ? { background: "rgba(255,255,255,.85)", color: "#1E7A5A" }
                    : {
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0) 55%), #0A1F3C",
                        color: "#FFFFFF",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.28), 0 18px 34px -22px rgba(10,31,60,.8)",
                      }
                }
              >
                <span aria-hidden style={{ color: askSpoken ? "#1E7A5A" : "#C9A46B" }}>
                  <Icon name="mic" size={28} strokeWidth={2} />
                </span>
                {askSpoken ? "말씀하신 내용을 전달했습니다" : "말로 부탁하기"}
              </button>
            </div>

            {/* order 1 · 아이콘 타일 12개 (3열) — 누르면 상세 시트가 열린다.
                시작 예정(no7~11) 타일도 열리게 둔다 — 눌러 봐야 언제 시작하는지
                알 수 있고, 눌린 횟수가 수요 파악이 된다. 타일에는 "곧 시작"만 표시. */}
            <div
              className="grid shrink-0 grid-cols-3 gap-2.5"
              style={{ order: 1, display: tab === "ask" ? undefined : "none" }}
            >
              {ASK_TILES.map((t) => {
                const item = SERVICE_MENU.find((s) => s.no === t.no);
                if (!item) return null;
                return (
                  <button
                    key={t.no}
                    onClick={() => {
                      setAskSent(null);
                      setAskSel(item);
                    }}
                    className="btn-press flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-3.5 text-center"
                    style={LIGHT_CARD}
                  >
                    <span aria-hidden style={{ color: "#B08D57" }}>
                      <Icon name={t.icon} size={30} strokeWidth={1.7} />
                    </span>
                    <span className="mt-0.5 text-[17px] font-bold leading-[1.25] text-navy">{t.label}</span>
                    {t.sub && (
                      <span className="text-[15px] font-medium leading-[1.3] text-muted">{t.sub}</span>
                    )}
                    {!item.active && <span className="text-[15px] font-bold text-amber">곧 시작</span>}
                  </button>
                );
              })}
            </div>

            {/* order 7 · 해주세요 PLUS — 집수리·공사·렌탈은 바깥 업체를 연결한다.
                책임 경계를 어르신 화면에도 그대로 쓴다 (공사 책임은 그 업체에 있다). */}
            <ElderCard show={tab === "ask"} order={7} style={LIGHT_CARD}>
              <CardHead title="집 고칠 일" right="바깥 업체 연결" icon="box" />
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

            {/* 확인·보내기는 시트(ElderAskSheet)로 옮겼다 (2026-08-24 참고 시안 —
                타일을 "누르면 보여지게"). 보낸 결과는 아래 '부탁해 둔 것'에 쌓인다. */}

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
                      onClick={() => {
                        setStoreCat(c.id);
                        setStoreGroup(0);
                      }}
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
              {/* 소분류 — 보호자 스토어와 같은 구조로 맞췄다 (2026-08-21 시트 어르신 스토어 1번).
                  전에는 분류를 고르면 그 안의 모든 그룹이 한 줄로 쭉 나열돼 목록이 길었다.
                  칩만 가져오고 크기는 어르신 규격(19px · 높이 52px)을 지킨다. */}
              {/* 한 줄 가로 스크롤 — 줄바꿈으로 두면 칩 다섯 개가 네 줄을 먹어서
                  첫 화면에 상품이 하나도 안 보인다 (보호자 스토어와 같은 방식).
                  오른쪽 끝을 흐리게 덮어 "더 있다"를 알린다. */}
              {storeCatalog.groups.length > 1 && (
                <div className="relative mt-3 -mx-1">
                  <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                    {storeCatalog.groups.map((g, gi) => {
                      const on = storeGroup === gi;
                      return (
                        <button
                          key={g.name}
                          onClick={() => setStoreGroup(gi)}
                          aria-pressed={on}
                          className="btn-press min-h-[52px] shrink-0 whitespace-nowrap rounded-2xl border-2 px-4 text-[19px] font-bold"
                          style={
                            on
                              ? { borderColor: "#0A1F3C", background: "#0A1F3C", color: "#FFFFFF" }
                              : { borderColor: "rgba(10,31,60,.15)", color: "#40413F" }
                          }
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-0 w-10"
                    style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.95))" }}
                  />
                </div>
              )}
            </ElderCard>

            {[storeCatalog.groups[storeGroup] || storeCatalog.groups[0]].filter(Boolean).map((g) => (
              <ElderCard key={`${storeCatalog.id}-${g.name}`} show={tab === "store"} order={1}>
                <CardHead title={g.name} right={`${g.items.length}가지`} />
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

          {/* 즉시방문요청 플로팅 버튼 — 탭·스크롤과 무관하게 항상 같은 자리(오른쪽 위).
              하단은 탭바와 붙어 눌림 실수가 나기 쉬워 위로 올렸다 (2026-08-24 피드백). */}
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
                  detail:
                    "지금 와 주셨으면 합니다 (어르신 화면 즉시방문요청) — 관제가 먼저 전화로 확인합니다",
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
                payload: { kind: "방문", text: `${ELDER.name}(${ELDER.age}) 즉시 방문 요청 · 관제 확인 전화 발신`, color: "#B08D57" },
              });
            }}
          />
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

        {/* 해주세요 상세 시트 — 타일을 누르면 열린다 (2026-08-24 참고 시안).
            보내기 로직은 예전 '이렇게 부탁할까요' 카드에서 그대로 옮겨 왔다 —
            결제권한(REQ-07)에 따라 본인 결제 / 보호자 승인으로 갈리는 부분 포함. */}
        {askSel && (
          <ElderAskSheet
            item={askSel}
            plan={askPlan}
            sent={askSent}
            approver={payRule.approver}
            onClose={() => {
              setAskSel(null);
              setAskSent(null);
            }}
            onAsk={() => {
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

// 해주세요 상세 시트 — 타일을 누르면 열린다 (2026-08-24 참고 시안 "누르면 보여지게").
// 예전 AskItem 아코디언(접힌 줄에 가격 유지)을 대체한다 — 타일 그리드에서는 가격이
// 타일에 못 실리므로, 시트 첫 줄에 가격을 크게 둔다 (무엇이 얼마인지가 첫 정보).
// 보내면 시트 안에서 바로 "보냈습니다"로 바뀐다 — 화면 이동 없이 결과를 확인한다.
function ElderAskSheet({ item, plan, sent, approver, onAsk, onClose }) {
  const off = !item.active;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,23,45,.6)]" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-elder p-6 pb-8 break-keep"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <>
            <CardHead title="보냈습니다" right={sent.mode === "approval" ? "승인 기다리는 중" : "접수됨"} />
            <p className="mt-2 text-[22px] font-bold leading-[1.5] text-navy">{sent.name}</p>
            <p className="mt-3 rounded-2xl bg-green/10 p-4 text-[19px] font-bold leading-[1.5] text-green">
              {sent.mode === "approval"
                ? `${approver} 님에게 확인을 부탁드렸습니다. 승인되면 바로 시작합니다.`
                : sent.mode === "free"
                ? "선생님에게 전달했습니다. 곧 연락드립니다."
                : "접수했습니다. 선생님이 곧 시작합니다."}
            </p>
            <ElderBtn onClick={onClose} variant="done" className="mt-4">
              닫기
            </ElderBtn>
          </>
        ) : (
          <>
            <p className="text-[22px] font-black leading-[1.35] text-navy">{item.name}</p>
            <p className="mt-1.5 text-[19px] font-bold leading-[1.5] text-[#7A5C28]">
              {off ? "곧 시작합니다" : item.priceLabel}
            </p>
            <p className="mt-2.5 text-[19px] leading-[1.6] text-ink">{item.scope}</p>
            {item.point && <p className="mt-1.5 text-[18px] leading-[1.55] text-muted">{item.point}</p>}
            {item.note && <p className="mt-1.5 text-[18px] leading-[1.55] text-muted">{item.note}</p>}
            {off ? (
              <>
                <p className="mt-3 rounded-2xl p-4 text-[19px] font-bold leading-[1.5]"
                   style={{ background: "rgba(138,93,18,.1)", color: "#8A5D12" }}>
                  준비하고 있습니다. 시작하면 알려드립니다.
                </p>
                <ElderBtn onClick={onClose} variant="done" className="mt-4">
                  알겠습니다
                </ElderBtn>
              </>
            ) : (
              <>
                <p className="mt-3 rounded-2xl p-4 text-[19px] font-bold leading-[1.5]"
                   style={plan.approval
                     ? { background: "rgba(138,93,18,.1)", color: "#8A5D12" }
                     : { background: "rgba(30,122,90,.1)", color: "#1E7A5A" }}>
                  {plan.notice}
                </p>
                <ElderBtn onClick={onAsk} variant={plan.approval ? "primary" : "success"} className="mt-4">
                  <span className="block leading-[1.35]">{plan.cta}</span>
                  <span className="block text-[19px] leading-[1.35] text-white/85">
                    {item.amount === 0 ? "비용 없음" : item.amount == null ? "요금 확인 후 안내" : fmtWon(item.amount)}
                  </span>
                </ElderBtn>
                <ElderBtn onClick={onClose} variant="done" className="mt-2">
                  닫기
                </ElderBtn>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 즉시 방문 요청 — 화면 안 SOS 버튼을 대신한다 (2026-08-12 시트 전체 요청 4번).
// SOS 는 "지금 위험하다"이고 이것은 "지금 와 주셨으면 한다"다. 둘을 색으로 가른다 —
// 빨강은 SOS 전용이므로 이 버튼은 네이비다.
//
// 헤더 옆 고정칸 → 오른쪽 아래 플로팅 → 오른쪽 위 플로팅 (2026-08-24 피드백 두 번 —
// "인사말 옆에 고정으로 박힐 필요가 없음", "하단 말고 위에"). 어느 탭에서 스크롤
// 중이든 같은 자리라서 급할 때 찾아 헤매지 않는다. 카드 위에 뜨는 물건이라 요청
// 완료 상태도 반투명이 아니라 흰 바탕(불투명)이어야 아래 글자가 비쳐 보이지 않는다.
// 완료 라벨은 "요청됨" 한 단어 — 위 자리에서는 길면 데모 홈 링크를 덮는다.
// 전화 대기 설명은 오늘 탭의 '관제에서 전화를 드립니다' 카드가 한다.
function VisitNowButton({ done, onAsk }) {
  return (
    <button
      onClick={() => !done && onAsk()}
      aria-label={done ? "즉시 방문을 요청했습니다" : "지금 와 주세요 — 즉시 방문 요청"}
      className="btn-press absolute right-4 top-3 z-40 flex min-h-[60px] select-none items-center gap-2.5 whitespace-nowrap rounded-full py-3 pl-4 pr-5 text-[20px] font-black tracking-[-.01em]"
      style={
        done
          ? {
              background: "#FFFFFF",
              color: "#1E7A5A",
              border: "2px solid rgba(30,122,90,.4)",
              boxShadow: "0 14px 26px -14px rgba(10,31,60,.45)",
            }
          : {
              background:
                "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.03) 55%), #0A1F3C",
              color: "#FFFFFF",
              // 흰 헤어라인 — 네이비 카드(다음 일정) 위를 지날 때 경계가 필요하다
              border: "1px solid rgba(255,255,255,.35)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.4), inset 0 -3px 0 rgba(0,0,0,.25), 0 18px 32px -14px rgba(10,31,60,.65)",
            }
      }
    >
      <span aria-hidden style={{ color: done ? "#1E7A5A" : "#C9A46B" }}>
        <Icon name={done ? "clock" : "door"} size={26} strokeWidth={2} />
      </span>
      {done ? "요청됨" : "지금 와 주세요"}
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
