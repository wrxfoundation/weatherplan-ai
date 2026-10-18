import ModeLink from "../components/ModeLink";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import {
  ELDER,
  ELDER_NOW,
  ELDER_VISITORS,
  EVENT_KINDS,
  OUTING,
  TODAY_ME,
  TEACHER,
  TEACHER_DEMO_FILE,
  TEACHER_INBOX,
  VITALS,
  VOICE_MSG,
  VOICE_TO,
  seedAt,
  rollingTopics,
  elderWho,
} from "../lib/mock";
import { PRICING, fmtWon } from "../lib/config";
import { STORE_CATALOG } from "../lib/store";
import ProductSheet, { GOODS_LOOK } from "../components/ProductSheet";
import { CLOSED, SERVICE_MENU, SERVICE_PLUS, approverOf, canEditRequest, cancelRule, fmtScheduled, isStoreOrder, isVisitCall, preferredYmd } from "../lib/requests";
import { assigneeNow, avatarText, elderNameOf, givenName, inCenter, voiceTargetsCenter } from "../lib/people";
import { MED_STREAK, SUPPLEMENTS, daysLeft, healthOf, medProgress, needsReorder, slotHour } from "../lib/meds";
import { medStreakWeek } from "../lib/demo-health";
import { VERDICT, matchWelfare, profileFor, welfareCounts } from "../lib/welfare";
import { elderSpentToday, eventsFor, needsGuardianApproval, useAppState, useSync } from "../lib/state";
import { clipUrlNow, clock, playErrorText, saveClip, sendErrorText, RECORD_ERRORS, usePrefetchClips, useRecorder, useVoicePlayer } from "../lib/voice-client";
import ElderRecord from "../components/ElderRecord";
import InviteLink from "../components/InviteLink";
import ElderDateTime, { atOf, spokenDateTime, ymdOf } from "../components/ElderDateTime";
import { eventRights } from "../lib/event-rights";
import Splash from "../components/Splash";
import ElderHealthReport from "../components/ElderHealthReport";
import RoleGate from "../components/RoleGate";
import { useAuth } from "../lib/auth";
import { Art, Clay, ClayDefs, Line } from "../components/clay";
import { BackHead, Btn, Card, DBlock, Face, Pill, R, Screen, Sheet, SheetTitle, Star, TONE, Wave, WhiteBtn, eventTone, soft, solid, useToast } from "../components/ds";

// 사용자(어르신) 홈 — 핸드오프 06 elder 상세 명세 + REQ-01(우선 날씨) + REQ-06(SOS 오작동 방지)
// 2026-10-15 디자인 시안(클레이 3D)으로 다시 그렸다 — 화면 구성은 시안 그대로, 기능은 그대로 둔다:
//   홈(인사 · 도와줘요 · 선생님 소식 · 네 칸) · 오늘(지금 할 일 · 그다음 · 소리로 듣기 · 일정 남기기 · 이번 달 · 날씨)
//   건강(어제와 비교 · 약 미션 · 기분 · 네 칸) · 해주세요(말로 부탁 · 타일 · 집 고칠 일 · 부탁해 둔 것)
//   스토어(상품 칸 · 담은 물건) · 마음사서함(선생님 · 말풍선 · 말하기 · 다음에 오는 날) · 가족(자녀 칸 · 대화 · 세대공감)
// 시안과 다르게 둔 것 — 빨강은 위험 신호 전용이라 새 소식 점 · 배지 · 녹음 중은 금색. 하위 화면에도 오른쪽 위 '도와줘요'를
// 작게 남겼다 (2026-07-29 회의 'SOS 는 오른쪽 위' · 어느 화면에서든 한 번에 부를 수 있게).
// 화면은 언마운트 없이 display 전환 (06 §2) — 녹음 · 펼침 상태가 탭을 오가도 남는다.
// 접근성(타협 불가): 본문 15px 하한 · 버튼 높이 52px 이상 · 아이콘만 있는 버튼 금지(글자 병행) · 색+글자 병행.
// 1회성 잠금(복약 체크·재구매)에 undo 없음 — 의도된 설계, "버그"로 고치지 말 것 (06 §5).
// '오늘 여쭤볼 것'과 '말로 부탁하기'는 1회성이 아니다 (2026-10-14 현장 요청: 실제 녹음 · 다시 말하기 · 해결 · 지우기).

// 해주세요 — 보호자 화면과 같은 메뉴를 쓴다 (2026-08-12 어르신화면 시트 해주세요 1번).
// 어르신 화면은 활자만 크고, 목록·단가·순서는 lib/requests.js 한 곳에서 온다.
// 2026-09-11 시트 어르신 해주세요 1~3번: 집수리 · 요양보호사 · 방문 간호 · 약국 심부름 · 자녀 동행 타일을 뺐고,
// '생활 대행'은 '함께 해요'로, 컨시어지 2명과 근교 나들이를 가는 '함께가요'(no15)를 넣었다.
// 2026-10-15 시안: 2열 가로 타일 + 클레이 그림 · 분류 색 (병원은 초록 · 생활은 파랑 · 준비 중은 회색).
const ASK_TILES = [
  { no: 1, label: "병원 예약", sub: "날짜 잡기", clay: "hospitalBook", tone: "green" },
  { no: 2, label: "병원 동행", sub: "선생님 두 분", clay: "escort2", tone: "green" },
  { no: 3, label: "병원 동행", sub: "선생님 한 분", clay: "escort1", tone: "green" },
  { no: 4, label: "요양병원", sub: "안심케어", clay: "careHospital", tone: "green" },
  { no: 5, label: "안심방문", sub: "추가 방문", clay: "safeVisit", tone: "blue" },
  { no: 6, label: "함께 해요", sub: "장보기 · 말벗", clay: "together", tone: "blue" },
  { no: 15, label: "함께가요", sub: "근교 나들이", clay: "outing", tone: "blue" },
  { no: 7, label: "청소", clay: "broom", tone: "gray" },
  { no: 9, label: "복지 혜택", clay: "welfare", tone: "beige" },
  // 응급 — 위험 신호라 빨강 계열을 쓴다 (빨강을 쓰는 몇 안 되는 자리)
  { no: 12, label: "응급 대응", sub: "병원에 함께 있어요", clay: "siren", tone: "danger" },
];

// 집 고칠 일 타일 (2026-10-14 현장 요청 5번) — 위 해주세요 타일과 같은 모양. 내용은 lib/requests.js SERVICE_PLUS 그대로.
// 날짜 · 시간은 사람이 가는 핸디맨만 고른다 — 공사맨(견적 대행) · 렌탈은 알아본 뒤 선생님이 연락드린다.
const PLUS_TILES = [
  { key: "handyman", label: "핸디맨", sub: "간단 수리", clay: "wrench", tone: "beige" },
  { key: "builder", label: "공사맨", sub: "견적", clay: "cloche", tone: "beige" },
  { key: "rental", label: "가전 렌탈", sub: "정수기 · 청정기", clay: "purifier", tone: "blue" },
];
const plusItem = (p) => ({
  no: `plus-${p.key}`,
  name: p.name,
  priceLabel: p.priceLabel,
  amount: p.amount,
  scope: p.scope,
  point: "알아보고 진행 상황을 알려드립니다. 공사의 책임은 그 업체에 있습니다.",
  note: p.note,
  active: true,
  plus: true,
  askWhen: p.key === "handyman",
});

// GNB — 2026-09-04 시트 어르신 전체 7·8번: 하단은 마음사서함 · 홈 · 가족 셋뿐이다.
// 오늘/건강/해주세요/스토어 진입은 홈의 사분면 타일이 맡는다. 2026-10-15 시안: 따로 떠 있는 큰 칸 셋.
const TABS = [
  { key: "teacher", label: "마음사서함" },
  { key: "home", label: "홈" },
  { key: "family", label: "가족" },
];

// 선생님 메시지함 보관 기간 — 24시간이 지나면 목록에서 사라진다 (2026-08-28 요청).
const MSG_TTL_MS = 24 * 60 * 60 * 1000;

// 홈 사분면 — 2026-10-15 시안: 분류 색 바탕 + 큰 입체 그림(96) + 큰 이름. 색이 먼저 갈리고 그림이 거든다.
const HOME_TILES = [
  { key: "today", label: "오늘", sub: "일정과 방문", art: "tileToday", tone: "blue" },
  { key: "health", label: "건강", sub: "약과 몸 상태", art: "tileHealth", tone: "green" },
  { key: "ask", label: "해주세요", sub: "부탁드릴 일", art: "tileAsk", tone: "purple" },
  // 스토어는 생활안전용품만 판다 (2026-10-02 운영 결정) — 시안의 '약과 생활용품'은 쓰지 않는다
  { key: "store", label: "스토어", sub: "생활안전용품", art: "tileStore", tone: "beige" },
];

// 세대공감 카드 색 — 다섯 장이 한 장씩 다른 색 (시안)
const GEN_TONES = ["blue", "purple", "green", "beige", "gold"];
// 가족 칸 색 — 첫째 파랑 · 둘째 분홍 · 셋째 초록 · 모두 베이지 (시안)
const PINK = { bg: "#F6E3EC", sh: "#E8CBD8", fg: "#8A3A62", title: "#8A3A62", sub: "#8A3A62", solid: "#B5527F", solidSh: "#8A3A62", solidFg: "#FFFFFF" };
const famTone = (v, i) => (v.id === "all" ? TONE.beige : [TONE.blue, PINK, TONE.green, TONE.purple][i % 4]);

// 24시간제 금지 — "오후 2시 30분" 구어 표기 (06 §7)
// 띠배너용 짧은 날짜 — 오늘/내일/모레는 그 말로, 그 뒤는 날짜로.
function shortDay(ts, now) {
  const d = new Date(ts);
  const a0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((a0 - b0) / 86400000);
  if (days <= 0) return "오늘";
  if (days === 1) return "내일";
  if (days === 2) return "모레";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// "08:00" → "8시", "12:30" → "12시 30분", "19:00" → "7시" — 어르신 화면은 숫자보다 말로 읽는다.
// 앞에 '아침 · 점심 · 저녁'이 붙으므로 오전 · 오후 없이 12시간제로 (전에는 '저녁 19시'로 나왔다)
function spokenClock(hhmm) {
  const [h0, m] = hhmm.split(":").map(Number);
  const h = h0 > 12 ? h0 - 12 : h0;
  return m === 0 ? `${h}시` : `${h}시 ${m}분`;
}

// 같은 시간대의 처방약과 영양제를 한 줄로 합친다 (참고 시안: "아산병원약 · 비타민 · 유산균").
// 처방약은 성분명이 아니라 어르신용 이름(elderLabel · "아산병원약")으로 부른다 (2026-09-04 시트 오늘 3번).
function medDoseNames(slot, medPlan) {
  const plan = medPlan.find((d) => d.slot === slot);
  const rx = plan?.elderLabel ? [plan.elderLabel] : (plan?.items || []).map((i) => stripIngredient(i.name));
  // 건강식품은 예시 목록이다 — 관제 센터 공간에는 붙이지 않는다 (2026-10-06 누수 점검)
  const sup = (inCenter() ? [] : SUPPLEMENTS).filter((x) => x.slot === slot).map((x) => x.name.split(" ")[0]);
  return [...rx, ...sup].join(" · ");
}

// "혈압약 (아모잘탄)" → "혈압약" — 괄호 안 성분명은 어르신 화면에서 뺀다 (건강 2번)
const stripIngredient = (name) => name.replace(/\s*\([^)]*\)\s*$/, "");
// 일정 제목 — 앱 이름 · 괄호를 뗀다 (360px 에서 괄호가 줄바꿈됐다 · QA 실측)
const cleanTitle = (t) => String(t || "").replace(/\s*\([^)]*\)\s*$/, "").replace(/^K-CARE\s+/, "");
// 복약 시간대 그림 — 아침 해 · 낮 해와 구름 · 저녁 달 (시안 timeIcon)
const timeArt = (hhmm) => (slotHour(hhmm) < 11 ? "timeMorning" : slotHour(hhmm) < 17 ? "timeNoon" : "timeNight");

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
function isYesterday(ts) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return new Date(ts).toDateString() === y.toDateString();
}

// 한국 날짜 표식 — 가구 상태를 여러 폰이 같이 쓰므로 폰 시간대와 무관하게 (2026-09-30 점검)
const kstDate = (t = Date.now()) => new Date(t + 9 * 3600000).toISOString().slice(0, 10);

// 오늘 기분 (2026-10-15 시안) — 고른 것은 가구 기록(state.elder.moods)에 날짜별로 남는다.
// '안 좋아요'면 관제에 알릴지 묻는다 — 알리면 관제 '지금 처리할 일'에 올라가고 확인한 사람 · 시각이 남는다.
const MOODS = [
  { k: "good", label: "좋아요", tone: "green", mouth: "M16 30q8 7 16 0" },
  { k: "soso", label: "보통이에요", tone: "beige", mouth: "M16 31h16" },
  // 안 좋은 기분은 위험 신호가 아니다 — 시안의 빨강 대신 금색
  { k: "bad", label: "안 좋아요", tone: "gold", mouth: "M16 33q8-7 16 0" },
];

function MoodFace({ mouth, color }) {
  return (
    <svg aria-hidden="true" focusable="false" width="48" height="48" viewBox="0 0 48 48" className="ds-clay ds-ico">
      <circle cx="24" cy="24" r="20" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      <circle cx="17" cy="20" r="2.6" fill={color} />
      <circle cx="31" cy="20" r="2.6" fill={color} />
      <path d={mouth} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 도와줘요 — 홈은 큰 칸(시안), 하위 화면은 머리 오른쪽 작은 칸 (어느 화면에서든 한 번에)
function HelpButton({ onClick, label, small = false }) {
  if (small)
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="ds-press flex h-[56px] w-[72px] flex-none flex-col items-center justify-center gap-[2px] rounded-[18px]"
        style={{ background: TONE.help.bg, boxShadow: `0 4px 0 ${TONE.help.sh}` }}
      >
        <Art name="helpBubble" width={26} height={22} />
        <span className="text-[15px] font-extrabold leading-none" style={{ color: TONE.help.fg }}>
          도와줘요
        </span>
      </button>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ds-press flex h-[96px] w-[94px] flex-none flex-col items-center justify-center gap-1 rounded-[28px]"
      style={{ background: TONE.help.bg, boxShadow: `0 5px 0 ${TONE.help.sh}` }}
    >
      <Art name="helpBubble" width={56} height={46} />
      <span className="text-[17px] font-extrabold" style={{ color: TONE.help.fg }}>
        도와줘요
      </span>
    </button>
  );
}

function ElderHome() {
  const { state, dispatch } = useAppState();
  const authUser = useAuth().user;
  const liveHH = !!authUser?.household; // 테스트 가구 — 워치가 없다
  const [tab, setTabRaw] = useState("home"); // elderTab — 기본 '홈' (사분면 허브)
  const [toastEl, toast] = useToast();
  // 화면은 언마운트하지 않지만, 탭 전환 시 스크롤은 맨 위로 — 화면 머리가 잘려 보이지 않게
  const setTab = (k) => {
    setTabRaw(k);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    // 오늘 탭을 열면 "새 일정" 점이 꺼진다 — 그때까지의 일정 수를 기억한다 (시트 전체 9번)
    if (k === "today") dispatch({ type: "elderPatch", patch: { todaySeen: eventsFor(state.events, "elder").length } });
  };
  const goHome = () => setTab("home");
  const [helpPhase, setHelpPhase] = useState(null); // 도와줘요 창 — asking(취소 가능) | sent | already
  const helpTimer = useRef(null);
  const [famSel, setFamSel] = useState(0); // 가족 탭 — 고른 자녀 칸 (시안: 한 사람씩)
  const [welfareOpen, setWelfareOpen] = useState(false); // 해주세요 — 복지혜택 시트 (앱 전체 3번)
  const [sosPhase, setSosPhase] = useState("idle"); // idle | confirm | sent
  const [calling, setCalling] = useState(false);
  const [eventSheet, setEventSheet] = useState(false); // 간단등록 (REQ-02 권한표)
  const [speaking, setSpeaking] = useState(false); // 일정 음성 안내 (접근성)
  const [monthOpen, setMonthOpen] = useState(false); // 오늘 — 이번 달 일정 시트
  const [infoSheet, setInfoSheet] = useState(null); // 건강 네 칸 · 지난 기록 — meds | supp | ask | weather | watch
  const [pillDone, setPillDone] = useState(null); // 방금 '다 먹었어요'를 누른 시간대 — 칭찬 화면
  const [storeSel, setStoreSel] = useState({});
  const [storeSent, setStoreSent] = useState(null); // 'approval' | 'ordered'
  const [storeDetail, setStoreDetail] = useState(null); // 상품 상세 시트 — 담기 전 설명을 먼저 본다 (2026-09-22)
  const [calSel, setCalSel] = useState(null); // 이번 달 시트에서 고른 날 (null = 이번 달 전체)
  const [evEdit, setEvEdit] = useState(null); // 바꾸는 일정 — 본인이 남긴 것만 (lib/event-rights.js)
  const [evConfirm, setEvConfirm] = useState(null); // 지우기 · 취소하기 한 번 더 묻는 일정 id
  const [askSel, setAskSel] = useState(null); // '해주세요' 선택 항목
  const [askSent, setAskSent] = useState(null); // { name, mode, amount }
  const callTimer = useRef(null);

  // 새로고침을 견뎌야 하는 것들은 전부 state.elder 에 있다 (lib/state.js 주석 참고).
  const { voicePlayed, medSlots, reordered } = state.elder;
  // 목소리 — 테스트 계정은 서버에 올리고, 데모는 이 기기에만 (lib/voice-client.js)
  const serverVoice = useSync().mode === "server";
  const player = useVoicePlayer();
  // 녹음 창 — { kind: teacher | ask | askDoctor | askDoctorEdit, id? } (2026-10-14 실제 녹음)
  const [recFor, setRecFor] = useState(null);
  const visitOpen = (state.requests || []).find(
    (r) => r.dir === "fromElder" && r.type === "즉시 방문 요청" && !["done", "cancelled", "rejected"].includes(r.status)
  ) || null;
  const msgPlayed = state.elder.msgPlayed || {};
  const todaySeen = state.elder.todaySeen || 0;
  // 홈 '오늘' 타일의 점 — 마지막으로 오늘 탭을 본 뒤 일정이 늘었으면 켜진다 (시트 전체 9번)
  const newSchedule = eventsFor(state.events, "elder").length > todaySeen; // 어르신에게 보이는 일정만 센다

  // ── 해주세요: 결제권한(REQ-07)을 어르신 말로 옮긴다 ──
  // 결제 모드는 온보딩에서 정해진 값을 그대로 따른다. 여기서 바꾸지 않는다.
  const payMode = state.onboarding?.paymentMode || "limit";
  const payLimit = state.onboarding?.limitAmount ?? PRICING.paymentLimitDefault;
  // 승인하는 가족 — 가입 상담을 거친 가구는 보호자 이름을 받지 않으므로 '보호자'로 부른다 (예시 '민수'로 지어내지 않는다)
  const approver = state.onboarding?.rel || inCenter() ? "보호자" : "민수";
  const payRule = {
    approver,
    headline: {
      limit: `${fmtWon(payLimit)}까지는 바로 해드리고, 그보다 크면 ${approver} 님이 확인해 줍니다.`,
      both: "어르신도 가족도 바로 결제할 수 있습니다.",
      guardianOnly: `${approver} 님이 확인해 주면 바로 시작합니다.`,
      elderOnly: "어르신이 직접 결제하십니다.",
    }[payMode],
  };
  // 선택 항목의 결제 분기 — 무료(멤버십 포함) / 본인 결제 / 보호자 승인.
  // 보호자 메뉴(SERVICE_MENU)는 amount 가 null 인 것도 있다 — 요금 확정 전이라 금액을 지어내지 않는다.
  const spentToday = elderSpentToday(state); // 하루 누적 한도 (2026-10-02 결정)
  const askPlan = (() => {
    if (!askSel) return { mode: null, approval: false, notice: "", cta: "" };
    if (askSel.amount === 0) {
      return { mode: "free", approval: false, notice: "멤버십에 포함된 것이라 따로 내실 돈이 없습니다. 선생님이 일정을 보고 정해 드립니다.", cta: "부탁하기" };
    }
    if (askSel.amount == null) {
      return { mode: "quote", approval: false, notice: "요금이 아직 정해지지 않은 것이라, 선생님이 일정과 요금을 정해 먼저 알려드립니다.", cta: "부탁하기" };
    }
    const approval = needsGuardianApproval(state.onboarding, askSel.amount, spentToday);
    return approval
      ? { mode: "approval", approval: true, notice: `${approver} 님이 먼저 결제해 주시면 선생님이 일정을 정해 드립니다.`, cta: "가족에게 부탁하기" }
      : { mode: "self", approval: false, notice: `오늘 쓰신 돈과 합쳐 ${fmtWon(payLimit)} 안이라 직접 내십니다. 선생님이 일정을 보고 정해 드립니다.`, cta: "바로 부탁하기" };
  })();
  // 내 부탁 + 내가 수락한 선생님 제안 (수락한 뒤에도 보이고 취소할 수 있게)
  const myRequests = (state.requests || []).filter((r) => r.dir === "fromElder" || (approverOf(r) === "elder" && r.status !== "requested"));
  const myOpen = myRequests.filter((r) => !CLOSED.includes(r.status));
  // 선생님(컨시어지)이 어르신에게 수락을 물은 제안 (2026-10-05 — 승인 대상은 컨시어지가 정한다)
  const proposalsForMe = (state.requests || []).filter((r) => r.status === "requested" && approverOf(r) === "elder");
  const [elderConfirm, setElderConfirm] = useState(null); // { id, kind: "cancel" | "decline" }

  // 관제 센터 공간에 어르신이 둘 이상 가입했으면 — 인사는 로그인한 본인 이름으로, 기록은 먼저 가입한 어르신 기준이라고 알린다
  // (2026-10-08 현장 테스트: 두 번째로 가입한 어르신에게 첫 어르신 이름으로 인사했다)
  const mainElder = elderNameOf(state.onboarding);
  const otherElder = inCenter() && authUser?.role === "elder" && authUser?.name && authUser.name !== mainElder ? authUser.name : null;
  const name = givenName(otherElder || mainElder);
  const now = new Date();
  // 시안 — "10월 13일 화요일" (해는 쓰지 않는다)
  const dateMd = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  // REQ-02 공유 캘린더에서 다음 일정 바인딩
  // 관제 승인 전 · 반려된 남의 일정은 빼고, 본인이 남긴 승인 대기 건은 '관제 확인 중'으로 보인다 (eventsFor)
  const myEvents = eventsFor(state.events, "elder");
  const upcoming = [...myEvents].sort((a, b) => a.at - b.at).filter((e) => e.at > Date.now());
  const next = upcoming[0];

  // 이번 달 달력 — 공유 일정(state.events)을 날짜별로 센다 (시트 어르신 오늘 1번).
  // 지난 일정도 달력에는 남긴다. "그날 뭐였더라"를 확인하는 것이 달력의 쓸모다.
  const monthEvents = myEvents
    .filter((e) => {
      const d = new Date(e.at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .sort((a, b) => a.at - b.at);
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
  const monthList = calSel ? monthEvents.filter((e) => new Date(e.at).getDate() === calSel) : monthEvents;
  // 다음 달 이후로 남기신 일정 — 이번 달 시트에서도 바꾸고 지울 수 있게 (일정 남기기는 두 달 앞까지 된다)
  const laterMine = myEvents
    .filter((e) => eventRights(e, "elder").edit || eventRights(e, "elder").remove)
    .filter((e) => {
      const d = new Date(e.at);
      return d.getFullYear() * 12 + d.getMonth() > now.getFullYear() * 12 + now.getMonth();
    })
    .sort((a, b) => a.at - b.at);
  // 일정 지우기 · 취소하기 — 확정된 것은 '취소'(관제에 알림 · 기록 남김), 그 밖은 지운다
  const removeMyEvent = (e) => {
    const r = eventRights(e, "elder");
    if (!r.remove) return;
    const cancel = r.remove === "cancel";
    dispatch({ type: "removeEvent", id: e.id, mode: r.remove, by: "어르신", title: e.title });
    dispatch({
      type: "pushEvent",
      payload: cancel
        ? { kind: "일정", text: `어르신 일정 취소 — ${cleanTitle(e.title)} · 동행 · 차량 정리 필요`, color: "#F0D9A8" }
        : { kind: "일정", text: `${e.approval === "pending" ? "어르신 일정요청 철회" : "어르신 일정 삭제"} — ${cleanTitle(e.title)}`, color: "#8FA9CC" },
    });
    setEvConfirm(null);
    toast(cancel ? "취소했어요 · 관제에 알렸어요" : "지웠어요");
  };
  const saveMyEvent = (e, at) => {
    const moved = e.approval === "approved" && at !== e.at; // 확정된 일정의 시간을 바꾸면 관제 재승인 (리듀서가 승인 대기로 돌린다)
    dispatch({ type: "updateEvent", id: e.id, patch: { at }, by: "어르신", title: e.title });
    if (moved) dispatch({ type: "pushEvent", payload: { kind: "일정", text: `어르신 일정 변경 — ${cleanTitle(e.title)} · 관제 재승인 대기`, color: "#B08D57" } });
    setEvEdit(null);
    toast(moved ? "바꿨어요 · 관제가 다시 확인해요" : "바꿨어요");
  };

  // 오늘 약 — 첫 안심방문에서 등록한 복약 계획(lib/meds.js)을 어르신이 직접 체크한다.
  // 복약 계획 — 가구 상태의 건강 정보(관제 · 컨시어지가 고친 값)를 그대로 쓴다 (lib/meds.js healthOf)
  const medPlan = healthOf(state).meds;
  const medPlanKey = medPlan.map((d) => `${d.slot}@${d.time}`).join("|"); // 알람 시각이 바뀌면 다시 본다
  const med = medProgress(medSlots, medPlan);
  // 등록된 약이 없으면(편집기에서 모두 뺀 경우) '다 드셨습니다'도 연속 하루도 아니다 (2026-10-02 코드 리뷰)
  const medAllDone = med.total > 0 && med.done === med.total;
  // 연속 기록 · 이번 주 동그라미는 예시 기록에서 온다 — 관제 센터 공간 · 테스트 가구에는 지난 기록이 없다 (2026-10-06 누수 점검)
  // 요일은 날짜에서 — 보호자 '복약 미션'과 같은 요일에 '놓침'이 찍힌다 (lib/demo-health.js)
  const streak = inCenter() || liveHH ? { days: 0, week: [] } : { ...MED_STREAK, week: medStreakWeek() };
  const medStreak = streak.days + (medAllDone ? 1 : 0);
  // 아직 안 드신 것 중 첫 번째 = 지금 드실 약. 그 다음 것은 한 줄로만 예고한다.
  const medPending = medPlan.filter((d) => !medSlots[d.slot]);
  const medNext = medPending[0] || null;
  const medAfter = medPending[1] || null;
  const [medPop, setMedPop] = useState(null); // 알람 팝업이 띄운 시간대 (null이면 닫힘)

  // 지금 할 일 (2026-10-15 시안 '오늘') — 오늘 남은 약과 오늘 일정을 시간 순서로 줄 세운다.
  // 약은 드실 때까지 남고, 일정은 시작 뒤 한 시간이 지나면 빠진다.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const tasks = [
    ...medPending.map((d) => ({ kind: "med", key: `m-${d.slot}`, slot: d.slot, time: d.time, at: todayStart + slotHour(d.time) * 3600000 })),
    ...myEvents.filter((e) => isToday(e.at) && e.at > Date.now() - 3600000).map((e) => ({ kind: "event", key: e.id, ev: e, at: e.at })),
  ].sort((a, b) => a.at - b.at);
  const laterEvents = upcoming.filter((e) => !isToday(e.at));
  const nowTask = tasks[0] || (laterEvents[0] ? { kind: "later", key: laterEvents[0].id, ev: laterEvents[0], at: laterEvents[0].at } : null);
  const thenTask = tasks.length
    ? tasks[1] || (laterEvents[0] ? { kind: "later", key: laterEvents[0].id, ev: laterEvents[0], at: laterEvents[0].at } : null)
    : laterEvents[1]
      ? { kind: "later", key: laterEvents[1].id, ev: laterEvents[1], at: laterEvents[1].at }
      : null;
  // 관제 승인 전 · 반려된 일정은 그렇다고 말한다 — '그다음' 한 줄도 확정된 일정처럼 보이면 안 된다
  // (2026-10-02 QA '관제 승인 전에는 확정이 아니다' · 이번 달 목록과 같은 말)
  // 확정 일정을 바꿨는데 관제가 반려해 원래대로 돌아간 것도 — '지금 할 일' 카드가 아닐 때에도 알 수 있게 (2026-10-18)
  const approvalWord = (ev) =>
    ev?.approval === "pending"
      ? "관제 확인 중"
      : ev?.approval === "rejected"
        ? "관제에서 다시 연락드립니다"
        : ev?.approval === "approved" && ev.changeRejected
          ? "바꾼 날짜 · 시간은 어려워 원래대로입니다"
          : "";
  const taskLabel = (t) =>
    t.kind === "med"
      ? `${t.slot} ${spokenClock(t.time)} · ${medDoseNames(t.slot, medPlan)}`
      : `${t.kind === "later" ? `${shortDay(t.at, now)} ` : ""}${spokenTime(t.at)} · ${cleanTitle(t.ev.title)}`;

  // 오늘 여쭤볼 것 — 가구 기록(state.askDoctor). 데모만 예시 질문으로 시작하고,
  // 테스트 가구 · 관제 센터 공간은 빈 목록이다 (lib/state.js freshState). 해결한 것은 아래로 접어 둔다.
  const askAll = state.askDoctor || [];
  const askList = askAll.filter((q) => q.status !== "resolved");
  const askDone = askAll.filter((q) => q.status === "resolved");
  const [askDoneOpen, setAskDoneOpen] = useState(false);
  const [askConfirm, setAskConfirm] = useState(null); // 지우기 확인 중인 질문 id
  const supplements = (inCenter() ? [] : SUPPLEMENTS).map((s) => ({ ...s, alert: needsReorder(s) }));
  const supAlerts = supplements.filter((s) => s.alert);
  // 세대공감 — 옆으로 밀어 보는 5장 (2026-08-28 요청 "하루 1개 말고 롤링 5개").
  const genTopics = rollingTopics(5, now);

  // 오늘 기분 — 날짜별 기록 (최근 7일만 남긴다)
  const moods = state.elder.moods && typeof state.elder.moods === "object" ? state.elder.moods : {};
  const todayK = kstDate();
  const moodToday = moods[todayK] || null;
  const moodYesterday = moods[kstDate(Date.now() - 86400000)] || null;
  const pickMood = (k) => {
    const keep = Object.keys(moods).filter((d) => d !== todayK).sort().slice(-6);
    const nextMoods = Object.fromEntries(keep.map((d) => [d, moods[d]]));
    nextMoods[todayK] = { v: k, at: Date.now(), told: moodToday?.v === k ? !!moodToday.told : false };
    dispatch({ type: "elderPatch", patch: { moods: nextMoods } });
  };
  const tellMood = () => {
    if (moodToday?.told) return;
    dispatch({ type: "addOpsMessage", payload: { from: `어르신 ${ELDER.name}`, role: "elder", text: "오늘 기분이 안 좋다고 알려 주셨습니다 — 안부 확인 부탁드립니다" } });
    dispatch({ type: "pushEvent", payload: { kind: "어르신", text: `${elderWho()} 오늘 기분 '안 좋아요' — 관제에 알림`, color: "#B08D57" } });
    dispatch({ type: "elderPatch", patch: { moods: { ...moods, [todayK]: { ...moodToday, told: true } } } });
    toast("관제센터에 알렸어요");
  };

  // 스토어 탭 — 보호자 스토어와 같은 카탈로그. 가격 없는 항목은 담기지 않는다.
  // 상품 사진도 보호자 스토어와 같은 것(콘솔 업로드 state.productImages)을 쓴다.
  const storeImages = state.productImages || {};
  const storeCatalog = STORE_CATALOG[0];
  const storeAll = STORE_CATALOG.flatMap((c) => c.groups.flatMap((g) => g.items));
  const storeItems = storeAll.filter((i) => storeSel[i.id] && i.price);
  const storeTotal = storeItems.reduce((s, i) => s + i.price + (i.ship || 0), 0);
  const storeApproval = needsGuardianApproval(state.onboarding, storeTotal, spentToday);
  // 선생님 제안 — 첫 방문 안전진단에서 '아니오'가 나와 담아 둔 용품 (lib/safety.js · 보호자 스토어와 같은 목록)
  const safetyPick = new Set(state.demo?.safetyCart || []);

  // 오늘이 방문일인가 — 오늘 오시는 분에게만 전화를 열어 준다 (시트 '오늘' 1번)
  const visitToday = upcoming.some((e) => e.kind === "visit" && isToday(e.at));
  // 오늘 오시는 분 — 데모는 예시 두 분, 테스트 가구 · 센터는 담당 선생님 (예시 이름을 지어 넣지 않는다)
  const visitors = inCenter() || liveHH ? [{ initials: avatarText(TEACHER.name), displayName: `${TEACHER.name} 선생님` }] : ELDER_VISITORS;
  // 다음에 오는 날 — 마음사서함 아래 (시안)
  const nextVisit = upcoming.find((e) => e.kind === "visit") || null;

  useEffect(
    () => () => {
      clearTimeout(callTimer.current);
      clearTimeout(helpTimer.current);
    },
    []
  );

  // 바탕화면 SOS 바로가기 — /elder?sos=1 로 열리면 5초 취소 유예 화면이 바로 뜬다.
  // (public/manifest.webmanifest 의 shortcuts 가 이 주소를 가리킨다)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("sos") === "1") setSosPhase("confirm");
  }, []);

  const callTeacher = () => {
    if (calling) return;
    setCalling(true);
    callTimer.current = setTimeout(() => setCalling(false), 2600);
  };

  // 시간대 인사 (2026-08-28 시안) — 하루 중 언제 여시든 그 시간의 말로 맞는다.
  const greetHour = now.getHours();
  const greetLine =
    greetHour < 5 ? "편안한 밤이에요"
    : greetHour < 12 ? "좋은 아침이에요" // 오전 11시대에 '좋은 오후예요'가 나오던 것 (2026-10-02 QA)
    : greetHour < 17 ? "좋은 오후예요"
    : greetHour < 22 ? "좋은 저녁이에요"
    : "편안한 밤이에요";

  // 소리로 듣기 — 브라우저 내장 TTS. 지금 할 일과 그다음을 말하듯이 읽는다.
  const speakToday = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast("이 기기에서는 소리가 나오지 않아요");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const say = (t) =>
      t.kind === "med"
        ? `${t.slot} ${spokenClock(t.time)}, ${medDoseNames(t.slot, medPlan)} 드실 시간입니다.`
        : `${t.kind === "later" ? spokenDay(t.at) : "오늘"} ${spokenTime(t.at)}, ${cleanTitle(t.ev.title)}. ${t.ev.note || ""}`;
    const text = nowTask ? `지금 할 일은 ${say(nowTask)} ${thenTask ? `그다음은 ${say(thenTask)}` : ""}` : "오늘은 잡힌 일정이 없습니다.";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  // 보낸 목소리는 가구 기록(voices: 어르신 → 컨시어지)에 둔다 — 컨시어지 마음사서함과 관제 커뮤니케이션이
  // 같은 것을 본다 (2026-10-02). 2026-10-14부터 실제로 녹음해 보낸다 (components/ElderRecord.jsx).
  const sendTeacherVoice = (clip) => {
    dispatch({ type: "addVoice", payload: { from: `${ELDER.name} 님`, to: "컨시어지", secs: clip.secs, context: "마음사서함", title: "선생님께 보낸 목소리", clip } });
    dispatch({
      type: "pushEvent",
      payload: { kind: "음성", text: `${ELDER.name} 음성 메시지 ${clip.secs}초 → 컨시어지 ${TEACHER.name}`, color: "#8FA9CC" },
    });
  };
  // 말로 부탁하기 — 녹음이 담당 컨시어지 마음사서함으로 가고(음성), 같은 것이 해주세요 요청이 된다.
  // 컨시어지가 듣고 한 줄로 정리하면 '부탁해 둔 것'에 그 글이 보인다 (2026-10-14 현장 요청 1 · 4번)
  const sendSpokenAsk = (clip) => {
    const id = `rq-${Date.now()}`;
    dispatch({
      type: "addRequest",
      payload: {
        id,
        dir: "fromElder",
        type: "말로 남기신 부탁",
        detail: `어르신이 음성으로 남긴 부탁 (${clip.secs}초) — 담당 컨시어지가 듣고 정리합니다`,
        amount: null,
        preferredDate: null,
        urgency: "normal",
        assignee: assigneeNow() || "",
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: `음성 요청 ${clip.secs}초` }],
        proof: null,
        voice: { clip },
        summary: null,
      },
    });
    dispatch({ type: "addVoice", payload: { from: `${ELDER.name} 님`, to: "컨시어지", secs: clip.secs, context: "말로 부탁", title: "말로 남기신 부탁", clip, reqId: id } });
    dispatch({
      type: "pushEvent",
      payload: { kind: "부탁", text: `${ELDER.name} 말로 부탁 ${clip.secs}초 접수 — 담당 컨시어지 확인 대기`, color: "#B08D57" },
    });
  };
  // 오늘 여쭤볼 것 — 말로 남긴 질문은 목록에 들어가고, 진료에 동행할 컨시어지 마음사서함에도 같은 목소리가 간다
  const sendAskDoctor = (clip, editId) => {
    if (editId) dispatch({ type: "askDoctorEdit", id: editId, clip });
    else dispatch({ type: "askDoctorAdd", payload: { clip } });
    dispatch({
      type: "addVoice",
      payload: { from: `${ELDER.name} 님`, to: "컨시어지", secs: clip.secs, context: "여쭤볼 것", title: editId ? "진료 때 여쭤볼 것 — 다시 말씀하심" : "진료 때 여쭤볼 것", clip },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "어르신", text: `진료 질문 ${editId ? "다시 말씀하심" : "1건 추가"} (${clip.secs}초) · 컨시어지 전달`, color: "#B08D57" },
    });
  };
  // 목소리 듣기 — 녹음이 있으면 그것을, 데모 씨앗은 예시 소리를, 녹음 기능 전 기록은 들은 표시만
  const playClip = (key, { clip, seed }, onPlayed) => {
    if (clip) player.play(key, { clip }, { onStart: onPlayed });
    else if (seed && !liveHH) player.play(key, { src: TEACHER_DEMO_FILE }, { onStart: onPlayed });
    else onPlayed?.();
  };

  // 메시지함 목록 — 씨앗(TEACHER_INBOX)과 이번에 보낸 것을 합치고 24시간이 지난
  // 것은 걸러 낸다. 오래된 것이 위, 최신이 아래 — 카톡처럼 (2026-09-04 시트 마음사서함 2번).
  const nowMs = now.getTime();
  const teacherMsgs = [
    ...(state.voices || [])
      .filter((v) => v.from === `${ELDER.name} 님` && v.to === "컨시어지")
      .map((v) => ({ id: v.id, dir: "out", at: v.at, durationSec: v.secs, text: v.title || "선생님께 보낸 목소리", clip: v.clip || null })),
    // 테스트 가구는 예시 선생님 메시지 없이 — 컨시어지가 실제로 보낸 것만 (2026-10-02 QA)
    ...(liveHH ? [] : TEACHER_INBOX.map((m) => ({ ...m, at: seedAt(m.minsAgo, nowMs), seed: true }))),
    // 컨시어지 앱 마음사서함에서 보낸 것 — 제목은 컨시어지가 보낼 때 적은 한 줄 (STT 아님)
    ...(state.voices || [])
      .filter((v) => v.from === "컨시어지" && v.to === ELDER.name)
      .map((v) => ({ id: v.id, dir: "in", at: v.at, durationSec: v.secs, text: v.title || "선생님이 보낸 목소리", clip: v.clip || null })),
  ]
    .filter((m) => nowMs - m.at < MSG_TTL_MS)
    .sort((a, b) => a.at - b.at);
  // 안 들은 받은 메시지 — 홈 배너와 GNB 숫자가 이걸 본다 (시트 전체 5번)
  const unreadMsgs = teacherMsgs.filter((m) => m.dir === "in" && !msgPlayed[m.id]);
  const markPlayed = (id) => dispatch({ type: "elderMark", key: "msgPlayed", id });
  // 들을 목소리를 미리 받아 둔다 — 누르는 순간 바로 재생해야 아이폰(사파리)이 막지 않는다 (lib/voice-client.js)
  usePrefetchClips([
    ...teacherMsgs.filter((m) => m.dir === "in").map((m) => m.clip),
    ...(state.voices || []).filter((v) => v.from === "보호자").map((v) => v.clip),
    ...(state.askDoctor || []).map((q) => q.clip),
  ]);

  // 복용 시간이 지나면 알람 팝업이 저절로 뜬다 (2026-09-04 시트 전체 2번). 하루에 때마다 한 번만 —
  // 닫았는데 1분마다 다시 뜨면 알람이 아니라 괴롭힘이다. 앱을 오후에 처음 열면 지난 때 중 첫 것 하나만 띄운다.
  // 다른 창(녹음·도와줘요·부탁 시트)이 떠 있으면 그 창을 닫을 때까지 기다린다.
  const medPopShown = state.elder.medPopShown || { date: "", slots: {} };
  const otherModal =
    !!medPop || !!pillDone || !!recFor || !!helpPhase || !!askSel || eventSheet || welfareOpen || !!storeDetail || monthOpen || !!infoSheet || sosPhase !== "idle";
  useEffect(() => {
    const check = () => {
      if (otherModal) return;
      const d = new Date();
      const today = kstDate(d.getTime());
      const shown = medPopShown.date === today ? medPopShown.slots || {} : {};
      const h = d.getHours() + d.getMinutes() / 60;
      const passed = medPlan.filter((s) => h >= slotHour(s.time));
      const due = passed.find((s) => !medSlots[s.slot] && !shown[s.slot]);
      if (!due) return;
      setMedPop(due.slot);
      const slots = { ...shown };
      passed.forEach((s) => {
        slots[s.slot] = true;
      });
      dispatch({ type: "elderPatch", patch: { medPopShown: { date: today, slots } } });
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherModal, medSlots, medPopShown.date, medPopShown.slots, medPlanKey]);

  // 다 먹었어요 — 체크는 되돌리지 않는다 (06 §5). 칭찬 화면(별)을 띄운다 (시안)
  const takeMed = (slot) => {
    dispatch({ type: "elderMark", key: "medSlots", id: slot });
    dispatch({
      type: "pushEvent",
      payload: { kind: "복약", text: `${ELDER.name} ${slot} 복약 완료 · 가족 앱 준수율 갱신`, color: "#4ADE80" },
    });
    setMedPop(null);
    setPillDone(slot);
  };

  // 가족 탭 스레드 — 고른 사람과 주고받은 목소리가 시간순으로 보인다 (2026-09-04 시트 가족 2번).
  // 보낸 것은 state.voices(새로고침을 견딘다), 받은 것은 보호자 앱에서 남긴 안부 음성(from "보호자" → 주 보호자에게 붙인다)과
  // 씨앗 한 통(VOICE_MSG). '가족 모두'에게 보낸 것은 각 사람 스레드에도 보인다.
  const elderVoices = state.voices || [];
  const threadFor = (v) => {
    const out = elderVoices
      .filter((x) => x.from === `${ELDER.name} 님` && (x.to === v.name || (v.id !== "all" && x.to === "가족 모두")))
      .map((x) => ({ id: x.id, dir: "out", at: x.at, text: x.to === "가족 모두" ? "가족 모두에게" : "내가 보낸 목소리", sec: x.secs, clip: x.clip || null }));
    const incoming = [];
    if (v.id === "v1") {
      const t8 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 10).getTime();
      // 테스트 가구에서는 예시 '아들 목소리'를 넣지 않는다 — 보호자가 실제로 보낸 것만 (2026-10-02 QA)
      if (!liveHH)
        incoming.push({
          id: "seed-minsu",
          dir: "in",
          at: Math.min(t8, nowMs),
          text: voicePlayed ? `"${VOICE_MSG.transcript}"` : null,
          sec: VOICE_MSG.durationSec,
          played: voicePlayed,
          seed: true,
        });
      elderVoices
        .filter((x) => x.from === "보호자")
        .forEach((x) =>
          incoming.push({ id: x.id, dir: "in", at: x.at, text: x.context === "긴급" ? "급한 안부" : null, sec: x.secs, played: !!msgPlayed[x.id], clip: x.clip || null })
        );
    }
    return [...out, ...incoming].sort((a, b) => a.at - b.at);
  };
  // 가족 목소리 듣기 — 들으면 '새 목소리' 표시가 꺼진다 (보낸 것도 다시 들을 수 있다)
  const playFamily = (m) => {
    if (m.seed) {
      playClip(`fam-${m.id}`, { seed: true }, () => {
        if (voicePlayed) return;
        dispatch({ type: "elderPatch", patch: { voicePlayed: true } });
        dispatch({ type: "pushEvent", payload: { kind: "음성", text: "어르신이 아들 음성 메시지 청취 완료", color: "#8FA9CC" } });
      });
      return;
    }
    playClip(`fam-${m.id}`, { clip: m.clip }, () => m.dir === "in" && !m.played && markPlayed(m.id));
  };

  // 즉시 방문 요청 — '도와줘요'가 부른다. 요청이 곧 방문은 아니다 — 관제가 먼저 전화로 확인하고 배차한다 (시트 어르신 전체 2번).
  // via "응급 대응" — 해주세요 '응급 대응'의 '관제와 통화하기' (2026-10-14 현장 요청 7번). 같은 길로 관제 · 컨시어지 ·
  // 보호자에게 동시에 뜨고, 관제가 먼저 전화한다. 진행 중인 도와줘요가 있으면 새로 만들지 않는다.
  const askVisit = (via = null) => {
    if (visitOpen) return;
    const emergency = via === "응급 대응";
    dispatch({ type: "elderPatch", patch: { visitAsked: true } });
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromElder",
        type: "즉시 방문 요청",
        detail: emergency
          ? "응급 상황 대응 — 관제와 통화하고 싶습니다 (어르신 해주세요 '응급 대응') — 관제가 먼저 전화로 확인합니다"
          : "지금 와 주셨으면 합니다 (어르신 화면 즉시방문요청) — 관제가 먼저 전화로 확인합니다",
        amount: null,
        preferredDate: null,
        urgency: "urgent",
        assignee: "", // 관제가 확인 전화 뒤 정한다
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: emergency ? "어르신 응급 대응 · 관제 통화 요청" : "어르신 즉시방문요청" }],
        proof: null,
        ...(emergency ? { via } : {}),
      },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "방문", text: emergency ? `${elderWho()} 응급 상황 대응 — 관제 통화 요청` : `${elderWho()} 즉시 방문 요청 · 관제 확인 전화 발신`, color: "#B08D57" },
    });
  };
  // 도와줘요 (2026-10-15 시안) — 누르면 '도움을 요청하고 있어요'가 뜨고, 잘못 누르셨으면 그 사이에 취소한다.
  // 잠깐 뒤 요청이 가고 '관제센터에서 전화드릴게요'로 바뀐다. 진행 중인 요청이 있으면 다시 보내지 않고 상태만 알린다.
  // 도와줘요의 지금 상태는 깃발이 아니라 요청 자체에서 읽는다 (2026-10-02 QA).
  const askHelp = () => {
    if (visitOpen) {
      setHelpPhase("already");
      return;
    }
    setHelpPhase("asking");
    clearTimeout(helpTimer.current);
    helpTimer.current = setTimeout(() => {
      askVisit();
      setHelpPhase("sent");
    }, 2600);
  };
  const cancelHelp = () => {
    clearTimeout(helpTimer.current);
    setHelpPhase(null);
  };
  const helpLabel = !visitOpen
    ? "도와줘요 — 즉시 방문 요청"
    : visitOpen.status === "requested"
      ? "도와줘요 — 요청을 보냈습니다 · 관제 전화 대기"
      : visitOpen.status === "inProgress"
        ? `도와줘요 — ${visitOpen.assignee || "선생님"} 선생님이 가고 있습니다`
        : "도와줘요 — 관제가 확인했습니다";
  const helpStatus = !visitOpen
    ? null
    : visitOpen.status === "requested"
      ? "관제센터에서 전화드려요"
      : visitOpen.status === "inProgress"
        ? `${visitOpen.assignee || "선생님"} 선생님이 가고 있어요`
        : "관제가 확인했어요";
  const helpMini = <HelpButton small onClick={askHelp} label={helpLabel} />;

  // 복지혜택 — 이 댁에 맞는 것 (앱 전체 3번). 보호자가 답한 것(state.welfare.answers)이 얹힌다.
  const welfareMatches = matchWelfare(profileFor(elderNameOf(state.onboarding), state.welfare?.answers));
  const welfareN = welfareCounts(welfareMatches);
  // 열려 있는 부탁이 있을 때만 '부탁했어요' — 취소 · 거절 · 끝난 뒤에는 다시 부탁할 수 있다 (2026-10-18)
  const welfareAsked = (state.requests || []).some((r) => r.dir === "fromElder" && r.type === "복지혜택 안내 부탁" && !CLOSED.includes(r.status));

  // 해주세요 타일 누름 — 복지 혜택은 혜택 목록, 나머지는 상세 시트
  const openAsk = (item) => {
    if (item.welfare) {
      setWelfareOpen(true);
      return;
    }
    setAskSent(null);
    setAskSel(item);
  };

  // 부탁해 둔 것 한 줄의 상태 — 어르신 말 + 색 (선생님 · 관제가 단계를 넘기면 여기 글이 바뀐다)
  const reqLook = (r) => {
    const when = fmtScheduled(r);
    if (isVisitCall(r) && !CLOSED.includes(r.status)) return { text: r.status === "inProgress" ? `${r.assignee || "선생님"} 선생님이 가고 있습니다` : "관제센터에서 확인 전화를 드립니다", tone: "help", icon: "phone" };
    if (r.status === "awaitingPayment") return { text: `${payRule.approver} 님 결제 기다리는 중`, tone: "gold", icon: "clock" };
    if (r.status === "requested") return { text: r.voice && !r.summary?.text ? "선생님이 듣고 정리하고 있습니다" : "선생님이 일정을 보고 정해 드립니다", tone: "gold", icon: "clock" };
    if (r.status === "confirmed") return { text: when ? `${when}에 해 드립니다` : "선생님이 하기로 했습니다", tone: "green", icon: "check" };
    if (r.status === "cancelRequested") return { text: "취소를 관제에서 확인하고 있습니다", tone: "gold", icon: "clock" };
    if (r.status === "needsAdmin") return { text: "관제에서 확인하고 있습니다", tone: "gold", icon: "clock" };
    if (r.status === "done") return { text: "끝났습니다", tone: "gray", icon: "check" };
    if (r.status === "rejected") return { text: "이번에는 어렵다고 합니다", tone: "gray", icon: "clock" };
    if (r.status === "cancelled")
      return { text: isStoreOrder(r) && r.history?.[r.history.length - 1]?.by === "보호자" ? "가족이 이번에는 사지 않기로 했습니다" : "취소되었습니다", tone: "gray", icon: "clock" };
    return { text: "선생님이 진행 중입니다", tone: "green", icon: "check" };
  };
  // 부탁한 날짜 바꾸기 (2026-10-18) — 선생님이 정하기 전까지만. 글의 '희망: …'도 같이 바꾼다
  const [reqDateEdit, setReqDateEdit] = useState(null);
  const saveReqDate = (r, ymd, hm) => {
    const whenText = spokenDateTime(ymd, hm);
    const detail = /희망: [^·]*/.test(r.detail || "")
      ? String(r.detail).replace(/희망: [^·]*/, `희망: ${whenText} `).replace(/\s+·/g, " ·").trim()
      : String(r.detail || "").replace("일정은 선생님이 연락드려 정함", `희망: ${whenText}`);
    dispatch({ type: "editRequest", id: r.id, patch: { preferredDate: ymd, preferredTime: hm, preferredWhen: whenText, detail }, by: "어르신", title: r.type });
    dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `${ELDER.name} 해주세요 날짜 바꿈 — ${r.type} · 희망 ${whenText}`, color: "#B08D57" } });
    setReqDateEdit(null);
    toast("날짜를 바꿨어요 · 선생님이 보고 정해 드려요");
  };

  const famTargets = inCenter() ? voiceTargetsCenter() : VOICE_TO;

  return (
    <>
      <Head>
        <title>K-CARE</title>
        {/* 휴대폰 주소창 · 상태 표시줄 색을 밝은 바탕에 맞춘다 (다른 화면은 기본 남색) */}
        <meta name="theme-color" content="#F8F7F4" />
      </Head>
      <Splash service="elder" />
      <ClayDefs />

      {/* ── 목소리 녹음 창 (2026-08-30 요청 · 2026-10-14 실제 녹음 · 2026-10-15 시안 색) ──
          화면 전체로 띄운다 — 어르신 화면에서 '지금 말할 차례'는 화면 전체로 말해야 알아채신다.
          서버가 받았다고 답해야 '보냈습니다'. */}
      {recFor && (
        <ElderRecord
          key={`${recFor.kind}-${recFor.id || ""}`}
          server={serverVoice}
          label={
            recFor.kind === "ask" ? "말로 부탁하기" : recFor.kind === "teacher" ? "선생님께 말하기" : recFor.kind === "askDoctorEdit" ? "여쭤볼 것 다시 말하기" : "여쭤볼 것 말로 남기기"
          }
          to={
            recFor.kind === "ask"
              ? `부탁하실 일을 말씀하세요 · ${TEACHER.name} 선생님에게 갑니다`
              : recFor.kind === "teacher"
                ? `${TEACHER.name} 선생님에게 전송됩니다`
                : "진료 때 여쭤볼 것을 말씀하세요"
          }
          sentTitle={recFor.kind === "ask" ? "전달했습니다" : recFor.kind.startsWith("askDoctor") ? "담았습니다" : "보냈습니다"}
          sentBody={
            recFor.kind === "ask"
              ? `${TEACHER.name} 선생님이 듣고 정리해 드립니다. '부탁해 둔 것'에서 확인하실 수 있습니다.`
              : recFor.kind === "teacher"
                ? `${TEACHER.name} 선생님이 들으시면 답을 주십니다.`
                : "진료 때 선생님이 대신 여쭤봅니다. 목록에서 다시 들으실 수 있습니다."
          }
          onSend={(clip) => {
            if (recFor.kind === "ask") sendSpokenAsk(clip);
            else if (recFor.kind === "teacher") sendTeacherVoice(clip);
            else sendAskDoctor(clip, recFor.kind === "askDoctorEdit" ? recFor.id : null);
          }}
          onClose={() => setRecFor(null)}
        />
      )}

      {/* ── 약 알람 (2026-10-15 시안) — 시간대 그림 · 큰 글씨 · '다 먹었어요!' 하나.
          '조금 있다가 먹을게요'는 닫기만 한다 — 체크는 되돌리지 않는 원칙(06 §5)이라 미룬 것을 기록하지 않는다. */}
      {medPop && (() => {
        const slot = medPlan.find((d) => d.slot === medPop);
        return (
          <div className="ds-overlay ds-app" style={{ background: "#FBF5E6" }} role="dialog" aria-modal="true" aria-label={`${medPop} 약 알림`}>
            <span className="rounded-full px-4 py-1.5 text-[16px] font-extrabold text-white" style={{ background: "#1B2340" }}>
              지금 할 일이에요
            </span>
            <span className="ds-pop flex h-[132px] w-[132px] items-center justify-center rounded-full bg-white" style={{ boxShadow: "0 0 0 12px #F6EAC8" }}>
              <Clay name={timeArt(slot?.time || "08:00")} size={84} />
            </span>
            <div className="mt-2 text-[22px] font-extrabold" style={{ color: "#86621F" }}>
              {medPop} {slot ? spokenClock(slot.time) : ""}
            </div>
            <div className="text-[32px] font-black leading-[1.3]">
              {medDoseNames(medPop, medPlan)}
              <br />
              드실 시간이에요
            </div>
            <div className="mt-auto flex w-full max-w-[400px] flex-col gap-2 pt-6">
              <Btn tone="green" h={78} r={24} px={5} className="w-full text-[24px]" onClick={() => takeMed(medPop)}>
                다 먹었어요!
              </Btn>
              <button type="button" onClick={() => setMedPop(null)} className="min-h-[56px] w-full text-[18px] font-extrabold" style={{ color: "#5E5A52" }}>
                조금 있다가 먹을게요
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── 잘하셨어요 (2026-10-15 시안) — 별을 모은다. 가족 앱 복약 기록에도 바로 보인다 ── */}
      {pillDone && (
        <div className="ds-overlay ds-app" style={{ background: "#1B2340" }} role="dialog" aria-modal="true" aria-label="잘하셨어요">
          <div className="mt-5 flex gap-2.5">
            {medPlan.map((d) => (
              <span key={d.slot} className={d.slot === pillDone ? "ds-starpop inline-flex" : "inline-flex"}>
                <Star on={!!medSlots[d.slot] || d.slot === pillDone} size={medPlan.length > 3 ? 52 : 64} />
              </span>
            ))}
          </div>
          <div className="mt-4 text-[34px] font-black text-white">잘하셨어요!</div>
          <div className="text-[19px] leading-[1.6]" style={{ color: "#C9CFDB" }}>
            {medAllDone ? (
              <>
                오늘 별 {med.total}개를 다 모았어요
                {medStreak > 1 && (
                  <>
                    <br />
                    {medStreak}일 연속 성공이에요
                  </>
                )}
              </>
            ) : (
              <>
                별 하나를 모았어요
                <br />
                가족에게도 알려 드렸어요
              </>
            )}
          </div>
          <Btn tone="gold" h={70} r={22} className="mt-auto w-full max-w-[400px] text-[22px]" onClick={() => setPillDone(null)}>
            확인
          </Btn>
        </div>
      )}

      {/* ── 도와줘요 (2026-10-15 시안) — 요청 중(취소 가능) → 관제센터에서 전화드릴게요 ── */}
      {helpPhase && (
        <div
          className="ds-overlay ds-app"
          style={{ background: helpPhase === "asking" ? "#FDF0E6" : "#E4EEE5" }}
          role="dialog"
          aria-modal="true"
          aria-label="도와줘요"
        >
          {helpPhase === "asking" ? (
            <>
              <span className="relative mb-6 mt-10 block h-[124px] w-[124px]" aria-hidden="true">
                <span className="ds-ring absolute inset-0 rounded-full" style={{ background: "#E2703A" }} />
                <span className="ds-ring ds-ring2 absolute inset-0 rounded-full" style={{ background: "#E2703A" }} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: "#E2703A" }}>
                  <svg aria-hidden="true" width="66" height="54" viewBox="0 0 56 46">
                    <path d="M28 3C14.7 3 4 11.3 4 21.5c0 6 3.7 11.3 9.5 14.7L11 44l10.5-5.6c2.1.4 4.2.6 6.5.6 13.3 0 24-8.3 24-18.5S41.3 3 28 3z" fill="#FFFFFF" />
                    <circle cx="18" cy="21.5" r="3.4" fill="#E2703A" />
                    <circle cx="28" cy="21.5" r="3.4" fill="#E2703A" />
                    <circle cx="38" cy="21.5" r="3.4" fill="#E2703A" />
                  </svg>
                </span>
              </span>
              <p className="text-[30px] font-black leading-[1.35]" style={{ color: "#8A3712" }} aria-live="polite">
                도움을
                <br />
                요청하고 있어요
              </p>
              <p className="text-[19px] font-medium" style={{ color: "#8A4A2A" }}>
                잠시만 기다려 주세요
              </p>
              <WhiteBtn h={70} r={22} sh="#EFD2BE" color="#8A3712" className="mt-auto w-full max-w-[400px] text-[22px]" onClick={cancelHelp}>
                취소하기
              </WhiteBtn>
            </>
          ) : (
            <>
              <span className="ds-pop mb-6 mt-10 flex h-[124px] w-[124px] items-center justify-center rounded-full" style={{ background: "#3B6B47", color: "#FFFFFF" }}>
                <Line name="check" size={64} />
              </span>
              <p className="text-[30px] font-black leading-[1.35]" style={{ color: "#2A4D33" }} aria-live="polite">
                관제센터에서
                <br />
                전화드릴게요
              </p>
              <p className="text-[19px] font-medium leading-[1.5]" style={{ color: "#3B5A44" }}>
                {helpPhase === "already" ? (
                  <>
                    이미 알려 두었어요
                    {helpStatus ? ` · ${helpStatus}` : ""}
                    <br />
                  </>
                ) : null}
                전화를 받으실 수 있게
                <br />
                곁에 두세요
              </p>
              <Btn tone="navy" h={70} r={22} className="mt-auto w-full max-w-[400px] text-[22px]" onClick={() => setHelpPhase(null)}>
                확인
              </Btn>
            </>
          )}
        </div>
      )}

      <div className="ds-app min-h-dvh">
        <main className="relative mx-auto w-full max-w-[430px]">
          {/* ══ 홈 — 인사 · 도와줘요 · 선생님 소식 · 네 칸 (2026-10-15 시안) ══ */}
          <Screen show={tab === "home"} label="어르신 메인" style={{ minHeight: "100dvh" }}>
            {/* 브랜드 · 계정 — 폰 여러 대로 테스트할 때 지금 어느 계정인지 (2026-09-30). 글자 하한 15px */}
            <div className="-mb-2 flex items-center justify-between">
              <span className="text-[15px] font-extrabold tracking-[.16em]" style={{ color: "#B79B52" }}>
                K-CARE
              </span>
              <ModeLink className="tap text-[15px] font-bold" />
            </div>
            <R className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-bold" style={{ color: "#8F7F63" }}>
                  {dateMd}
                </div>
                <div className="mt-1.5 text-[16px] font-medium" style={{ color: "#6F7482" }}>
                  오늘도 편안한 하루 되세요
                </div>
                {/* 호칭은 "~~님"으로 통일 — '어르신' 표기 삭제 (2026-08-12 시트 전체 요청 1번) */}
                <h1 className="mt-5 text-[32px] font-extrabold leading-[1.38] tracking-[-.5px]">
                  {name} 님,
                  <br />
                  {greetLine}
                </h1>
              </div>
              <HelpButton onClick={askHelp} label={helpLabel} />
            </R>
            {otherElder && (
              <p role="note" className="rounded-[18px] px-4 py-3 text-[16px] leading-[1.6]" style={{ background: "#FBF1DA", color: "#5E4A1E" }}>
                이 센터의 기록(약 · 일정 · 부탁 · 마음사서함)은 <b>{mainElder} 님</b> 기준으로 함께 씁니다.
                따로 해 보시려면 다른 관제 센터의 가입 코드로 가입해 주세요.
              </p>
            )}
            {/* 도와줘요 진행 상태 — 관제가 확인 전화를 마치면 '확인됨', 출동하면 '가고 있어요' (요청에서 읽는다) */}
            {helpStatus && (
              <R
                d={40}
                as="button"
                type="button"
                onClick={() => setHelpPhase("already")}
                className="ds-press ds-btn3d flex h-[44px] items-center gap-2 self-start rounded-full px-4 text-[15px]"
                style={{ background: TONE.help.bg, boxShadow: `0 3px 0 ${TONE.help.sh}`, color: TONE.help.fg }}
              >
                <span className="ds-recdot" style={{ width: 10, height: 10, background: "#E2703A" }} />
                요청됨 · {helpStatus}
              </R>
            )}
            {/* 선생님 소식 — 안 들은 목소리가 있을 때 (시트 전체 5번). 없으면 그 자리에 다음 일정 한 줄 */}
            {unreadMsgs.length > 0 ? (
              <R
                d={80}
                as="button"
                type="button"
                onClick={() => setTab("teacher")}
                aria-label={`${TEACHER.name} 선생님이 마음을 보냈어요 — 안 들은 목소리 ${unreadMsgs.length}개`}
                className="ds-press flex h-[52px] max-w-full items-center gap-2 self-start rounded-full pl-[6px] pr-[14px] text-left"
                style={{ background: TONE.green.bg, boxShadow: `0 3px 0 ${TONE.green.sh}` }}
              >
                <Face text={avatarText(TEACHER.name)} size={40} fg="#2A4D33" fontSize={12} />
                <span className="truncate text-[16px] font-extrabold" style={{ color: "#2A4D33" }}>
                  선생님이 마음을 보냈어요
                </span>
                <span className="ds-dot ds-ping" />
                <Line name="chevR" size={20} style={{ color: "#2A4D33" }} />
              </R>
            ) : (
              next && (
                <R
                  d={80}
                  as="button"
                  type="button"
                  onClick={() => setTab("today")}
                  className="ds-press flex min-h-[52px] max-w-full items-center gap-2 self-start rounded-full px-4 text-left"
                  style={{ background: TONE.blue.bg, boxShadow: `0 3px 0 ${TONE.blue.sh}`, color: TONE.blue.fg }}
                >
                  <Line name="clock" size={20} />
                  <span className="min-w-0 truncate text-[16px] font-extrabold">
                    {shortDay(next.at, now)} {spokenTime(next.at)} {cleanTitle(next.title)}
                    {next.approval === "pending" && " · 확인 중"}
                    {next.approval === "rejected" && " · 다시 연락드림"}
                    {next.approval === "approved" && next.changeRejected && " · 원래대로"}
                  </span>
                  <Line name="chevR" size={20} />
                </R>
              )
            )}
            {/* 네 칸 — 남는 세로 공간을 모두 가져간다 (2026-08-28 "위아래로 꽉") */}
            <div className="ds-g2 mt-1.5 flex-1" style={{ minHeight: 380, gridAutoRows: "1fr" }}>
              {HOME_TILES.map((t, i) => (
                <R
                  key={t.key}
                  d={120 + i * 60}
                  as="button"
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-label={t.key === "today" && newSchedule ? "오늘 — 새 일정이 있습니다" : undefined}
                  className="ds-tap relative flex flex-col items-start justify-end rounded-[30px] p-[18px] text-left"
                  style={{ background: TONE[t.tone].bg }}
                >
                  {/* 새 일정 점 — 시안은 빨강, 우리는 금색 (빨강은 SOS 전용). 오늘 탭을 열면 꺼진다 */}
                  {t.key === "today" && newSchedule && (
                    <span aria-hidden="true" className="ds-ping absolute right-4 top-4 h-4 w-4 rounded-full" style={{ background: "#C9A064", border: "4px solid #F6EAC8" }} />
                  )}
                  <Art name={t.art} size={96} className="ds-ico -ml-1" />
                  <span className="mt-2 text-[30px] font-extrabold leading-[1.2]" style={{ color: TONE[t.tone].title }}>
                    {t.label}
                  </span>
                  <span className="text-[17px] font-medium leading-[1.3]" style={{ color: "#6F7482" }}>
                    {t.sub}
                  </span>
                </R>
              ))}
            </div>
          </Screen>

          {/* ══ 오늘 — 지금 할 일 · 그다음 · 소리로 듣기 · 일정 남기기 · 이번 달 · 날씨 ══ */}
          <Screen show={tab === "today"} label="어르신 오늘">
            <BackHead onBack={goHome} sub={dateMd} title="오늘" color={TONE.blue.title} h1 right={helpMini} />
            <R d={60} className="text-[17px] font-extrabold" style={{ color: "#5E6270" }}>
              지금 할 일
            </R>
            <R d={80}>
              {nowTask?.kind === "med" ? (
                <button
                  type="button"
                  onClick={() => setMedPop(nowTask.slot)}
                  className="ds-press ds-tap flex w-full items-center gap-4 rounded-[30px] px-5 py-[22px] text-left"
                  style={soft("purple")}
                >
                  <span className="ds-ico flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full bg-white">
                    <Clay name={timeArt(nowTask.time)} size={58} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[18px] font-extrabold" style={{ color: TONE.purple.title }}>
                      {nowTask.slot} {spokenClock(nowTask.time)}
                    </span>
                    <span className="block text-[26px] font-black leading-[1.3]" style={{ color: TONE.purple.fg }}>
                      약 드실
                      <br />
                      시간이에요
                    </span>
                    <span className="block text-[16px] font-semibold" style={{ color: TONE.purple.sub }}>
                      {medDoseNames(nowTask.slot, medPlan)}
                    </span>
                  </span>
                </button>
              ) : nowTask ? (
                (() => {
                  const ev = nowTask.ev;
                  const tn = TONE[eventTone(ev.kind)];
                  const d = new Date(ev.at);
                  const h = d.getHours();
                  const isVisitToday = ev.kind === "visit" && isToday(ev.at);
                  return (
                    <div className="flex flex-col gap-3.5 rounded-[28px] p-5" style={{ background: tn.bg, color: "#1B2340" }}>
                      {nowTask.kind === "later" && (
                        <span className="text-[16px] font-extrabold" style={{ color: tn.fg }}>
                          오늘 할 일은 다 하셨어요 · 다음 일정
                        </span>
                      )}
                      <div className="flex items-center gap-3.5">
                        {nowTask.kind === "later" ? (
                          <DBlock top={["일", "월", "화", "수", "목", "금", "토"][d.getDay()]} day={d.getDate()} size={80} topFg={tn.fg} />
                        ) : (
                          <span className="flex h-[80px] w-[80px] flex-none flex-col items-center justify-center rounded-[22px] bg-white">
                            <span className="text-[15px] font-extrabold" style={{ color: tn.fg }}>
                              {h < 12 ? "오전" : "오후"}
                            </span>
                            <span className="ds-num text-[25px] font-black">
                              {h % 12 || 12}:{String(d.getMinutes()).padStart(2, "0")}
                            </span>
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="text-[25px] font-black leading-[1.3]">{cleanTitle(ev.title)}</div>
                          <div className="text-[17px] leading-[1.45]" style={{ color: tn.sub }}>
                            {nowTask.kind === "later" ? `${spokenDay(ev.at)} ${spokenTime(ev.at)}` : EVENT_KINDS[ev.kind]?.label || "일정"}
                          </div>
                        </div>
                      </div>
                      {ev.approval === "pending" && <p className="text-[17px] font-bold leading-[1.5]" style={{ color: tn.fg }}>관제에서 확인하고 있습니다. 정해지면 선생님이 알려드립니다.</p>}
                      {ev.approval === "rejected" && <p className="text-[17px] font-bold leading-[1.5]" style={{ color: tn.fg }}>이대로는 어렵습니다. 관제에서 다시 연락드립니다.</p>}
                      {ev.changeRejected && ev.approval === "approved" && (
                        <p className="text-[17px] font-bold leading-[1.5]" style={{ color: tn.fg }}>바꾼 날짜 · 시간은 어렵다고 해서 원래대로입니다. 관제에서 연락드립니다.</p>
                      )}
                      {ev.note && <p className="text-[17px] leading-[1.5]" style={{ color: tn.sub }}>{ev.note}</p>}
                      {/* 오늘 찾아뵙는 분 — 방문일에만. 문 열기 전 얼굴 확인은 방문 사기 방어라 남긴다 */}
                      {isVisitToday && (
                        <>
                          <div className="flex items-center gap-2.5 rounded-[18px] bg-white px-3.5 py-3">
                            <span className="flex">
                              {visitors.map((v, i) => (
                                <Face key={v.displayName} text={v.initials} size={44} bg={i ? TONE.blue.bg : TONE.green.bg} fg={i ? TONE.blue.fg : "#2A4D33"} fontSize={13} style={i ? { marginLeft: -10, border: "2px solid #FFFFFF" } : { border: "2px solid #FFFFFF" }} />
                              ))}
                            </span>
                            <span className="text-[17px] font-bold leading-[1.4]">
                              {visitors.map((v) => v.displayName).join(" · ")}
                              <br />
                              댁으로 와요
                            </span>
                          </div>
                          <p className="text-[16px] font-bold leading-[1.5]" style={{ color: tn.fg }}>
                            K-CARE 이름표를 걸고 옵니다. 이름이 다르면 문을 열지 마세요.
                          </p>
                          {/* 오늘 오시는 분에게만 전화 — 방문일이 아닌 날에 열려 있으면 아무 때나 걸게 된다 (시트 '오늘' 1번) */}
                          <Btn tone="green" h={64} r={20} className="w-full text-[20px]" onClick={callTeacher}>
                            <Line name="phone" size={22} />
                            {calling ? `${TEACHER.name} 선생님께 연결 중입니다` : `${TEACHER.name} 선생님께 전화`}
                          </Btn>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-[28px] px-5 py-6 text-center" style={{ background: TONE.green.bg }}>
                  <div className="text-[24px] font-black" style={{ color: "#2A4D33" }}>
                    {med.total > 0 || myEvents.length ? "오늘 할 일을 다 하셨어요" : "오늘은 잡힌 일정이 없어요"}
                  </div>
                  <div className="mt-1.5 text-[17px]" style={{ color: "#3B5A44" }}>
                    {med.total > 0 || myEvents.length ? "편히 쉬세요" : "아래 '일정 남기기'로 남기실 수 있어요"}
                  </div>
                </div>
              )}
            </R>
            {thenTask && (
              <R d={130} className="flex items-center gap-2.5 rounded-[22px] px-[18px] py-3.5" style={{ border: "2.5px dashed #D6CDE6", color: "#3A3F50" }}>
                <span className="flex-none text-[16px] font-extrabold" style={{ color: TONE.purple.title }}>
                  그다음
                </span>
                <span className="min-w-0 flex-1 text-right text-[17px] font-extrabold">
                  {taskLabel(thenTask)}
                  {/* 기다리는 상태는 금색 (빨강은 위험 신호 전용) — 일정 이름과 섞이지 않게 아래 줄로 */}
                  {approvalWord(thenTask.ev) && (
                    <span className="block text-[15px] font-bold" style={{ color: TONE.gold.fg }}>
                      {approvalWord(thenTask.ev)}
                    </span>
                  )}
                </span>
              </R>
            )}
            <R d={150} className="ds-g2" style={{ gap: 10 }}>
              <Btn tone="blue" fill={false} h={64} r={20} px={4} className="text-[18px]" onClick={speakToday} aria-pressed={speaking}>
                <Line name="speaker" size={22} />
                {speaking ? "그만 듣기" : "소리로 듣기"}
              </Btn>
              {/* 일정 남기기 — 한 곳 (2026-10-14 현장 요청 2 · 8번). 누르면 달력에서 날짜 · 시간을 고르는 창 */}
              <Btn tone="beige" fill={false} h={64} r={20} px={4} className="text-[18px]" style={{ color: "#5E4A1E" }} onClick={() => setEventSheet(true)}>
                <Line name="plus" size={22} />
                일정 남기기
              </Btn>
            </R>
            <R
              d={170}
              as="button"
              type="button"
              onClick={() => {
                setCalSel(null);
                setMonthOpen(true);
              }}
              className="ds-press ds-tap ds-btn3d flex min-h-[72px] items-center gap-3 rounded-[24px] px-[18px] text-left"
              style={soft("blue")}
            >
              <Clay name="calendarBlue" size={40} className="ds-ico" />
              <span className="flex-1 text-[19px]" style={{ color: TONE.blue.fg }}>
                이번 달 일정 · 달력{monthEvents.length ? ` (${monthEvents.length}건)` : ""}
              </span>
              <Line name="chevR" size={22} style={{ color: TONE.blue.fg }} />
            </R>
            {/* 날씨 — 아직 예시 값 (실제 날씨처럼 보이지 않게 '예시'를 붙인다 · 2026-10-02 QA) */}
            <R d={180} className="flex flex-col gap-3 rounded-[26px] p-[18px]" style={{ background: TONE.beige.bg }}>
              <div className="flex items-center gap-3">
                <Clay name="cloudSun" size={48} />
                <div>
                  <div className="text-[20px] font-extrabold" style={{ color: "#5E4A1E" }}>
                    밖이 많이 더워요
                  </div>
                  <div className="text-[16px]" style={{ color: TONE.beige.sub }}>
                    {ELDER_NOW.tempLabel} · {ELDER_NOW.factors[0].label} {ELDER_NOW.factors[0].value}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {OUTING.kit.map((k) => (
                  <span key={k} className="ds-chip">
                    {k}
                  </span>
                ))}
              </div>
              <div className="ds-src text-right">날씨 · 케이웨더 · 예시</div>
            </R>
          </Screen>

          {/* ══ 건강 — 어제와 비교 · 약 미션 · 기분 · 네 칸 ══ */}
          <Screen show={tab === "health"} label="어르신 건강">
            <BackHead onBack={goHome} title="건강" color={TONE.green.title} h1 right={helpMini} />
            <R d={40} className="flex flex-col gap-3 rounded-[26px] p-[18px]" style={{ background: TONE.blue.bg }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-extrabold" style={{ color: TONE.blue.title }}>
                  어제와 비교
                </span>
                {!liveHH && (
                  <Pill fg={TONE.blue.title} className="text-[14px]">
                    ♥ 맥박 {VITALS[0].value}
                  </Pill>
                )}
              </div>
              {/* 테스트 가구 — 워치가 없어 걸음 · 잠은 지어낸 숫자가 된다. 그렇다고 말한다 (2026-10-02 UX 점검) */}
              {liveHH ? (
                <>
                  <div className="text-[19px] font-extrabold leading-[1.45]">워치를 연결하지 않아 걸음 · 잠 · 맥박이 나오지 않습니다.</div>
                  <div className="rounded-[20px] bg-white px-4 py-3 text-[17px] font-bold">
                    오늘 약 {med.done} / {med.total}번 드셨어요
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[21px] font-black leading-[1.4]">{TODAY_ME.line}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { ...TODAY_ME.rows[0] },
                      { ...TODAY_ME.rows[1] },
                      // 약은 오늘 실제로 누른 것 — 어제는 예시 기록(연속 성공)에서
                      { name: "약", today: String(med.done), dir: streak.days > 0 && med.done < med.total ? "down" : streak.days > 0 ? "same" : "down" },
                    ].map((r) => (
                      <div key={r.name} className="rounded-[20px] bg-white px-2 py-3 text-center">
                        <div className="text-[15px] font-extrabold" style={{ color: TONE.blue.sub }}>
                          {r.name}
                        </div>
                        <div className="ds-num text-[24px] font-black">{r.today}</div>
                        <span
                          className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[13px] font-extrabold"
                          style={r.dir === "up" ? { background: TONE.green.bg, color: TONE.green.title } : r.dir === "same" ? { background: "#F3F1EC", color: "#5E6270" } : { background: TONE.gold.bg, color: TONE.gold.fg }}
                        >
                          {r.dir === "up" ? "어제보다 ↑" : r.dir === "same" ? "어제만큼" : "어제보다 ↓"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <WhiteBtn h={54} sh={TONE.blue.sh} color={TONE.blue.fg} className="text-[17px]" onClick={() => setInfoSheet("watch")}>
                    지난 기록 자세히 보기
                  </WhiteBtn>
                </>
              )}
            </R>

            {/* 오늘의 약 미션 — 별 띠 · 지금 드실 약 · 다음 약 · 지난 7일 (2026-09-04 시트 오늘 3번 · 2026-10-15 시안) */}
            <R d={60} className="flex flex-col gap-3">
              <h2 className="m-0 text-[23px] font-black">오늘의 약 미션</h2>
              {med.total > 0 && (
                <div className="flex items-center gap-3.5 rounded-[24px] px-[18px] py-4" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
                  <span className="flex flex-none gap-1" aria-label={`오늘 ${med.done} / ${med.total}번`}>
                    {medPlan.map((d) => (
                      <Star key={d.slot} on={!!medSlots[d.slot]} size={medPlan.length > 3 ? 26 : 32} />
                    ))}
                  </span>
                  <span className="text-[19px] font-black leading-[1.3]">
                    {medAllDone ? `오늘 미션 성공!${medStreak > 1 ? ` ${medStreak}일 연속` : ""}` : medStreak > 0 ? `${medStreak}일 연속 성공 중!` : "오늘부터 별을 모아요"}
                  </span>
                </div>
              )}
              {medNext ? (
                <button type="button" onClick={() => setMedPop(medNext.slot)} className="ds-press ds-tap flex w-full items-center gap-3.5 rounded-[28px] px-[18px] py-5 text-left" style={soft("purple")}>
                  <span className="ds-ico flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-white">
                    <Clay name={timeArt(medNext.time)} size={50} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[24px] font-black" style={{ color: TONE.purple.fg }}>
                      {medNext.slot} {spokenClock(medNext.time)} 약
                    </span>
                    <span className="block text-[16px] font-semibold leading-[1.4]" style={{ color: TONE.purple.sub }}>
                      {medDoseNames(medNext.slot, medPlan)}
                    </span>
                  </span>
                  <span aria-hidden="true" className="flex h-[50px] w-[50px] flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.solid }}>
                    <Line name="play" size={22} />
                  </span>
                </button>
              ) : med.total === 0 ? (
                <div className="rounded-[26px] px-5 py-5 text-center text-[19px] font-extrabold leading-[1.45]" style={{ background: "#F3F1EC", color: "#5E5A52" }}>
                  아직 등록된 약이 없습니다.
                  <br />
                  선생님이 방문 때 등록해 드립니다.
                </div>
              ) : (
                <div className="rounded-[26px] p-[22px] text-center" style={{ background: TONE.green.bg }}>
                  <div className="text-[23px] font-black" style={{ color: "#2A4D33" }}>
                    오늘 약을 다 드셨어요
                  </div>
                  <div className="mt-1 text-[16px]" style={{ color: "#3B5A44" }}>
                    참 잘하셨어요
                  </div>
                </div>
              )}
              {medAfter && (
                <div className="flex items-center gap-2.5 rounded-[22px] px-[18px] py-3.5" style={{ border: "2.5px dashed #D6CDE6" }}>
                  <span className="flex-none text-[16px] font-extrabold" style={{ color: TONE.purple.title }}>
                    다음 약
                  </span>
                  <span className="min-w-0 flex-1 text-right text-[17px] font-extrabold" style={{ color: "#3A3F50" }}>
                    {medAfter.slot} {spokenClock(medAfter.time)} · {medDoseNames(medAfter.slot, medPlan)}
                  </span>
                </div>
              )}
              {/* 지난 7일 — 못 드신 날은 회색 '놓침' (시안은 빨강 · 빨강은 SOS 전용) */}
              {streak.week.length > 0 && (
                <div className="rounded-[26px] px-3.5 py-[18px]" style={{ background: TONE.green.bg }}>
                  {streak.days > 0 && (
                    <div className="text-center text-[17px] font-extrabold" style={{ color: TONE.green.fg }}>
                      어제도 다 챙겨 드셨어요
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                    {[...streak.week, { label: "오늘", done: medAllDone, today: true }].map((d) => (
                      <div key={d.label} className="flex flex-col items-center gap-1.5">
                        <span className="text-[14px] font-extrabold" style={{ color: d.today ? "#1B2340" : "#5E6270" }}>
                          {d.label}
                        </span>
                        <span
                          aria-label={`${d.label} ${d.done ? "다 드심" : d.today ? `${med.done}/${med.total}` : "놓침"}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-black"
                          style={d.done ? { background: "#FFFFFF", color: "#3B6B47" } : d.today ? { border: "2px solid #C9A064", background: "#FBF1DA", color: "#86621F" } : { background: "#EEEDEA", color: "#5E5A52" }}
                        >
                          {d.done ? <Line name="check" size={18} /> : d.today ? `${med.done}/${med.total}` : "놓침"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </R>

            {/* 오늘 기분 (2026-10-15 시안) — '안 좋아요'면 관제에 알릴지 묻는다 */}
            <R d={110} className="flex flex-col gap-3 rounded-[26px] px-3.5 py-[18px]" style={{ background: TONE.gold.bg }}>
              <h2 className="m-0 pl-1 text-[21px] font-black" style={{ color: "#5E4A1E" }}>
                오늘 기분은 어떠세요?
              </h2>
              <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="오늘 기분">
                {MOODS.map((f) => {
                  const on = moodToday?.v === f.k;
                  const c = TONE[f.tone].title;
                  return (
                    <button
                      key={f.k}
                      type="button"
                      onClick={() => pickMood(f.k)}
                      aria-pressed={on}
                      className="ds-tap flex flex-col items-center gap-1.5 rounded-[22px] bg-white px-1 py-3"
                      style={{ border: `3px solid ${on ? c : "transparent"}` }}
                    >
                      <MoodFace mouth={f.mouth} color={c} />
                      <span className="text-[16px] font-extrabold" style={{ color: c }}>
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {moodToday?.v === "bad" ? (
                <div className="ds-swap flex items-center gap-2.5 rounded-[18px] px-3.5 py-3" style={{ background: "#FFFFFF" }}>
                  <span className="flex-1 text-[17px] font-bold" style={{ color: "#5E4A1E" }}>
                    {moodToday.told ? "관제센터에 알렸어요" : "관제센터에 알려 드릴까요?"}
                  </span>
                  {moodToday.told ? (
                    <Line name="check" size={26} style={{ color: "#3B6B47" }} />
                  ) : (
                    <Btn tone="gold" h={52} r={14} px={3} className="px-4 text-[16px]" onClick={tellMood}>
                      알리기
                    </Btn>
                  )}
                </div>
              ) : moodToday && moodYesterday ? (
                <div className="ds-swap text-[16px]" style={{ color: "#5E6270" }}>
                  어제는 <b style={{ color: TONE.green.fg }}>{MOODS.find((m) => m.k === moodYesterday.v)?.label}</b>를 고르셨어요
                </div>
              ) : null}
            </R>

            {/* 네 칸 — 드시는 약 · 건강식품 · 병원에 여쭤볼 것 · 우리 동네 (누르면 아래에서 시트) */}
            <R d={160} className="ds-g2">
              {[
                { k: "meds", label: "드시는 약", sub: medPlan.length ? `하루 ${medPlan.length}번` : "등록 전", clay: "pill", tone: "purple" },
                { k: "supp", label: "건강식품", sub: supplements.length ? `${supplements.length}가지 챙기기` : "등록 전", clay: "jar", tone: "beige", badge: supAlerts.length ? `살 것 ${supAlerts.length}` : null },
                { k: "ask", label: "병원에 여쭤볼 것", sub: `${askList.length}가지${askDone.length ? ` · 해결 ${askDone.length}` : ""}`, clay: "question", tone: "green" },
                { k: "weather", label: "우리 동네", sub: `${ELDER_NOW.tempLabel} · ${ELDER_NOW.factors[0].label} ${ELDER_NOW.factors[0].value}`, clay: "sunNow", tone: "blue" },
              ].map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setInfoSheet(t.k)}
                  className="ds-tap relative flex min-h-[132px] flex-col justify-between rounded-[26px] p-3.5 text-left"
                  style={{ background: TONE[t.tone].bg }}
                >
                  <Clay name={t.clay} size={44} className="ds-ico" />
                  <span>
                    <b className="block text-[18px] font-extrabold leading-[1.3]" style={{ color: TONE[t.tone].fg }}>
                      {t.label}
                    </b>
                    <small className="block text-[15px]" style={{ color: TONE[t.tone].sub }}>
                      {t.sub}
                    </small>
                  </span>
                  {/* 배지는 이름 뒤에 둔다 — 화면 읽기가 '건강식품'부터 읽게 (자리는 오른쪽 위) */}
                  {t.badge && (
                    <span className="absolute right-3 top-3 rounded-full px-[9px] py-[3px] text-[13px] font-extrabold text-white" style={{ background: TONE.gold.badge }}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </R>
          </Screen>

          {/* ══ 해주세요 — 말로 부탁 · 타일 · 집 고칠 일 · 부탁해 둔 것 ══ */}
          <Screen show={tab === "ask"} label="어르신 해주세요">
            <BackHead onBack={goHome} sub="해주세요" title="무엇을 도와드릴까요?" size={26} h1 right={helpMini} />
            {/* 말로 부탁하기 — 목록에 없어도 말로 남기면 선생님이 듣고 정리한다 (2026-10-14 현장 요청 4번: 실제 녹음) */}
            <R
              d={60}
              as="button"
              type="button"
              onClick={() => setRecFor({ kind: "ask" })}
              className="ds-press flex min-h-[96px] w-full items-center gap-4 rounded-[28px] px-5 text-left"
              style={soft("purple")}
            >
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.solid }}>
                <Line name="mic" size={28} />
              </span>
              <span className="text-[26px] font-extrabold" style={{ color: TONE.purple.title }}>
                말로 부탁하기
              </span>
            </R>
            <R d={80} className="-mt-1 px-1 text-[16px] leading-[1.5]" style={{ color: "#5E6270" }}>
              {payRule.headline}
            </R>

            {/* 선생님이 제안한 것 — 어르신이 수락 · 거절 (2026-10-05: 승인 대상은 선생님이 정한다) */}
            {proposalsForMe.length > 0 && (
              <R d={100} className="flex flex-col gap-2.5 rounded-[26px] p-[18px]" style={{ background: TONE.gold.bg }}>
                <div className="flex items-center justify-between">
                  <h2 className="m-0 text-[20px] font-black" style={{ color: "#5E4A1E" }}>
                    선생님이 제안했어요
                  </h2>
                  <span className="text-[15px] font-extrabold" style={{ color: TONE.gold.fg }}>
                    {proposalsForMe.length}건
                  </span>
                </div>
                {proposalsForMe.map((r) => {
                  const asking = elderConfirm?.id === r.id && elderConfirm.kind === "decline";
                  return (
                    <Card key={r.id} r={20} pad={16} style={{ boxShadow: "0 3px 0 #EAD9AC" }}>
                      <div className="text-[19px] font-extrabold leading-[1.35]">{r.type}</div>
                      {r.detail && <p className="mt-1 text-[16px] leading-[1.5]" style={{ color: "#3A3F50" }}>{r.detail}</p>}
                      <p className="mt-1.5 text-[17px] font-extrabold leading-[1.45]" style={{ color: TONE.gold.fg }}>
                        {fmtScheduled(r) ? `${fmtScheduled(r)} · ` : ""}
                        {r.amount > 0 ? fmtWon(r.amount) : r.amount === 0 ? "돈 안 드는 것" : "요금은 선생님이 알려드려요"}
                      </p>
                      {asking ? (
                        <div className="mt-3">
                          <p className="text-[17px] font-extrabold leading-[1.5]">안 하시겠어요?</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <WhiteBtn h={56} className="text-[18px]" onClick={() => setElderConfirm(null)}>
                              아니요
                            </WhiteBtn>
                            <Btn
                              tone="navy"
                              h={56}
                              className="text-[18px]"
                              onClick={() => {
                                dispatch({ type: "respondProposal", id: r.id, accept: false, role: "elder" });
                                dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `${ELDER.name} 선생님 제안 거절 — ${r.type}`, color: "#8FA9CC" } });
                                setElderConfirm(null);
                              }}
                            >
                              안 할게요
                            </Btn>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <WhiteBtn h={56} className="text-[18px]" style={{ boxShadow: "0 4px 0 #E3DED3", background: "#F3F1EC" }} onClick={() => setElderConfirm({ id: r.id, kind: "decline" })}>
                            괜찮아요
                          </WhiteBtn>
                          <Btn
                            tone="green"
                            h={56}
                            className="text-[18px]"
                            onClick={() => {
                              dispatch({ type: "respondProposal", id: r.id, accept: true, role: "elder" });
                              dispatch({ type: "pushEvent", payload: { kind: "해주세요", text: `${ELDER.name} 선생님 제안 수락 — ${r.type}`, color: "#8FE3C0" } });
                            }}
                          >
                            해 주세요
                          </Btn>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </R>
            )}

            {/* 타일 10개 (2열) — 누르면 상세 시트. 시작 예정(청소)도 열린다 — 눌린 횟수가 수요 파악이 된다 */}
            <R d={120} className="ds-g2" style={{ gap: 10 }}>
              {ASK_TILES.map((t) => {
                const item = SERVICE_MENU.find((s) => s.no === t.no);
                if (!item) return null;
                const tn = TONE[t.tone];
                return (
                  <button key={t.no} type="button" onClick={() => openAsk(item)} className="ds-tap ds-stile" style={{ background: tn.bg }}>
                    <Clay name={t.clay} size={44} className="ds-ico flex-none" />
                    <span className="min-w-0">
                      <b style={{ color: tn.fg }}>{t.label}</b>
                      {item.welfare ? (
                        <small className="font-extrabold" style={{ color: TONE.green.title }}>
                          {welfareN.high > 0 ? `${welfareN.high}가지 가능` : `${welfareN.check}가지 확인`}
                        </small>
                      ) : !item.active ? (
                        <small className="mt-0.5 inline-block rounded-full bg-white px-2 py-[1px] text-[14px] font-extrabold" style={{ color: TONE.beige.sub }}>
                          곧 시작
                        </small>
                      ) : (
                        t.sub && <small style={{ color: tn.sub }}>{t.sub}</small>
                      )}
                    </span>
                  </button>
                );
              })}
            </R>

            {/* 집 고칠 일 — 바깥 업체 연결 (2026-10-14 현장 요청 5번: 타일 + 같은 팝업). 책임 경계를 그대로 쓴다 */}
            <R d={160} className="flex flex-col gap-2.5">
              <h2 className="ds-sect text-[19px]" style={{ color: TONE.beige.fg }}>
                <i style={{ background: "#C9A064" }} />집 고칠 일
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {PLUS_TILES.map((t) => {
                  const p = SERVICE_PLUS.find((x) => x.key === t.key);
                  if (!p) return null;
                  const tn = TONE[t.tone];
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setAskSent(null);
                        setAskSel(plusItem(p));
                      }}
                      className="ds-tap ds-stile flex-col justify-center text-center"
                      style={{ background: tn.bg, padding: "14px 6px", gap: 6 }}
                    >
                      <Clay name={t.clay} size={44} className="ds-ico" />
                      <span>
                        <b style={{ color: tn.fg }}>{t.label}</b>
                        <small style={{ color: tn.sub }}>{t.sub}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="px-1 text-[15px] leading-[1.55]" style={{ color: "#5E6270" }}>
                알아보고 진행 상황을 알려드립니다. 공사의 책임은 그 업체에 있습니다.
              </p>
            </R>

            {/* 부탁해 둔 것 — 상태를 어르신 말로 (2026-10-05) */}
            <R d={200} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-[20px] font-black">부탁해 둔 것</h2>
                <span className="text-[15px] font-extrabold" style={{ color: "#5E6270" }}>
                  진행 중 {myOpen.length}건
                </span>
              </div>
              {myRequests.length === 0 ? (
                <div className="rounded-[24px] p-[18px] text-center text-[17px] font-bold" style={{ background: TONE.gray.bg, color: TONE.gray.fg }}>
                  아직 부탁하신 것이 없어요
                </div>
              ) : (
                // 진행 중인 것은 모두 (6건에서 잘려 취소할 길이 없던 것) + 끝난 것은 최근 3건만
                [...myOpen, ...myRequests.filter((r) => CLOSED.includes(r.status)).slice(0, 3)].map((r) => {
                  const look = reqLook(r);
                  const tn = TONE[look.tone];
                  const rule = cancelRule(r);
                  // 물건 승인 부탁은 가족이 결제하기 전까지만 거둘 수 있다 (결제 뒤에는 주문 — 관제 · 고객센터)
                  const storeAsk = isStoreOrder(r) && r.status === "awaitingPayment";
                  const canCancel = !isVisitCall(r) && (!isStoreOrder(r) || storeAsk) && !CLOSED.includes(r.status) && ["free", "ops"].includes(rule.mode);
                  const canRedate = r.dir === "fromElder" && !r.voice && canEditRequest(r) && !!preferredYmd(r);
                  const asking = elderConfirm?.id === r.id && elderConfirm.kind === "cancel";
                  const vkey = `rq-${r.id}`;
                  return (
                    <div key={r.id} className="flex flex-col gap-2 rounded-[24px] p-4" style={{ background: tn.bg }}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white" style={{ color: tn.fg }}>
                          <Line name={look.icon} size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-[18px] font-extrabold leading-[1.35]" style={{ color: tn.title }}>
                            {r.via === "응급 대응" ? "응급 상황 대응 — 관제와 통화" : r.type}
                          </b>
                          <span className="text-[16px] font-bold" style={{ color: tn.fg }}>
                            {look.text}
                          </span>
                        </span>
                      </div>
                      {/* 말로 남기신 부탁 — 선생님이 듣고 적은 한 줄 (받아쓰기 아님 · 2026-10-14 현장 요청 1번) */}
                      {r.voice && (
                        <div className="rounded-[18px] bg-white px-3.5 py-3">
                          <p className="text-[17px] leading-[1.5]">{r.summary?.text ? `“${r.summary.text}”` : "선생님이 듣고 글로 정리해 드립니다."}</p>
                          {r.summary?.text && (
                            <p className="mt-0.5 text-[15px]" style={{ color: "#5E6270" }}>
                              {r.summary.by ? `${r.summary.by} 선생님이 정리했습니다` : "선생님이 정리했습니다"}
                            </p>
                          )}
                          {r.voice.clip && (
                            <button
                              type="button"
                              onClick={() => playClip(vkey, { clip: r.voice.clip })}
                              aria-pressed={player.playing === vkey}
                              className="mt-1.5 flex min-h-[48px] w-full items-center gap-2 text-left text-[17px] font-extrabold"
                              style={{ color: TONE.green.title }}
                            >
                              <Line name={player.playing === vkey ? "pause" : "speaker"} size={20} />
                              {player.playing === vkey ? "멈추기" : `내 목소리 다시 듣기 · ${clock(r.voice.clip.secs || 0)}`}
                            </button>
                          )}
                          {player.failed?.key === vkey && (
                            <p role="alert" className="mt-1 text-[16px] font-bold" style={{ color: TONE.gold.fg }}>
                              {playErrorText(player.failed.code)}
                            </p>
                          )}
                        </div>
                      )}
                      {canCancel &&
                        (asking ? (
                          <div className="rounded-[18px] bg-white p-3">
                            <p className="text-[16px] leading-[1.5]">
                              {storeAsk
                                ? "가족에게 한 부탁을 거둡니다. 아직 결제 전이라 바로 취소됩니다."
                                : rule.mode === "ops"
                                  ? "날짜가 가까워 관제에서 확인한 뒤 취소됩니다."
                                  : "지금 취소하면 바로 취소됩니다."}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <WhiteBtn h={54} className="text-[17px]" style={{ background: "#F3F1EC" }} onClick={() => setElderConfirm(null)}>
                                아니요
                              </WhiteBtn>
                              <Btn
                                tone="navy"
                                h={54}
                                className="text-[17px]"
                                onClick={() => {
                                  dispatch({ type: "cancelRequest", id: r.id, by: "어르신", ...(storeAsk ? { reason: "어르신이 물건 승인 부탁을 거둠" } : {}) });
                                  dispatch({
                                    type: "pushEvent",
                                    payload: { kind: "해주세요", text: `${ELDER.name} ${storeAsk ? "물건 승인 부탁 거둠" : rule.mode === "ops" ? "취소 요청 (관제 승인 필요)" : "취소"} — ${r.type}`, color: "#B08D57" },
                                  });
                                  setElderConfirm(null);
                                }}
                              >
                                취소할게요
                              </Btn>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-x-4">
                            {canRedate && (
                              <button
                                type="button"
                                onClick={() => setReqDateEdit(r)}
                                aria-label={`${r.type} 날짜 바꾸기`}
                                className="min-h-[48px] px-1 text-[16px] font-bold underline underline-offset-4"
                                style={{ color: TONE.purple.fg }}
                              >
                                날짜 바꾸기
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setElderConfirm({ id: r.id, kind: "cancel" })}
                              aria-label={`${r.type} ${rule.mode === "ops" ? "취소 부탁하기" : "취소하기"}`}
                              className="min-h-[48px] px-1 text-[16px] font-bold underline underline-offset-4"
                              style={{ color: "#5E6270" }}
                            >
                              {rule.mode === "ops" ? "취소 부탁하기" : "취소하기"}
                            </button>
                          </div>
                        ))}
                    </div>
                  );
                })
              )}
            </R>
          </Screen>

          {/* ══ 스토어 — 상품 칸(2열) · 담은 물건 ══
              보호자 스토어와 같은 카탈로그(lib/store.js). 상세(상품 정보 고시)를 본 뒤에만 담는다 (2026-09-22 상담실장 확인) —
              칸의 '담기'도 먼저 상세 시트를 연다. 담으면 결제권한(REQ-07)대로 갈린다. */}
          <Screen show={tab === "store"} label="어르신 스토어">
            <BackHead onBack={goHome} sub="배송비 없이 가져다 드려요" title="스토어" color={TONE.beige.title} h1 right={helpMini} />
            <R d={80} className="ds-g2" style={{ gap: 10 }}>
              {storeAll.map((i) => {
                const on = !!storeSel[i.id];
                const look = GOODS_LOOK[i.id] || { tone: "stone", clay: null };
                const tn = TONE[look.tone];
                const img = storeImages[i.id];
                const off = !i.price;
                return (
                  <div key={i.id} className="relative flex flex-col gap-2.5 rounded-[26px] p-3" style={{ background: tn.bg }}>
                    {safetyPick.has(i.id) && (
                      <span className="absolute left-2.5 top-2.5 z-[1] rounded-full px-[9px] py-[3px] text-[13px] font-extrabold text-white" style={{ background: TONE.gold.badge }}>
                        선생님 제안
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setStoreSent(null);
                        setStoreDetail(i);
                      }}
                      aria-label={`${i.name} 자세히 보기`}
                      className="ds-tap flex flex-1 flex-col items-center gap-1.5 text-center"
                    >
                      <span className="ds-ico mt-2 flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full bg-white">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : look.clay ? (
                          <Clay name={look.clay} size={58} />
                        ) : (
                          <span className="text-[15px] font-bold" style={{ color: "#5E6270" }}>
                            사진 준비 중
                          </span>
                        )}
                      </span>
                      <b className="text-[17px] font-extrabold leading-[1.3]" style={{ color: tn.fg }}>
                        {i.name}
                      </b>
                      <span className="ds-num text-[19px] font-black">{i.price ? fmtWon(i.price) : i.pending || "가격 확정 전"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={off}
                      onClick={() => {
                        setStoreSent(null);
                        setStoreDetail(i);
                      }}
                      aria-label={on ? `${i.name} — 담았어요 · 빼려면 누르세요` : `${i.name} 담기 — 상품 정보를 먼저 봅니다`}
                      className="ds-press ds-btn3d min-h-[52px] rounded-[16px] text-[17px] disabled:opacity-50"
                      style={on ? solid("green", 4) : { background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)", color: tn.fg }}
                    >
                      {on ? "담았어요 ✓" : "담기"}
                    </button>
                  </div>
                );
              })}
            </R>
            {/* 담은 물건 · 주문 — 결제권한대로 문구가 갈린다 */}
            {storeSent ? (
              <R className="ds-swap flex flex-col gap-3 rounded-[26px] p-[18px] text-center" style={{ background: TONE.green.bg }}>
                <span className="ds-pop mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
                  <Line name="check" size={40} />
                </span>
                <div className="text-[22px] font-black" style={{ color: "#2A4D33" }}>
                  {storeSent === "approval" ? "가족에게 전달했어요" : "주문했어요"}
                </div>
                <div className="text-[17px]" style={{ color: "#3B5A44" }}>
                  {storeSent === "approval" ? "승인되면 배송으로 옵니다." : "다음 배송 때 함께 옵니다."}
                </div>
                <WhiteBtn h={56} className="text-[18px]" onClick={() => setStoreSent(null)}>
                  더 담기
                </WhiteBtn>
              </R>
            ) : storeItems.length > 0 ? (
              <R className="ds-swap flex flex-col gap-3 rounded-[26px] p-[18px]" style={{ background: TONE.gold.bg, color: "#5E4A1E" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[18px] font-extrabold">담은 물건 {storeItems.length}개</span>
                  <span className="ds-num text-[22px] font-black">{fmtWon(storeTotal)}</span>
                </div>
                <div className="text-[15px]" style={{ color: TONE.gold.sub }}>
                  {storeItems.map((i) => i.name).join(" · ")}
                </div>
                <Btn
                  tone="gold"
                  h={62}
                  r={20}
                  className="text-[20px]"
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
                        payBy: storeApproval ? null : "elder", // 하루 누적 한도에 들어간다
                        preferredDate: null,
                        urgency: "normal",
                        assignee: assigneeNow() || "",
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
                >
                  {storeApproval ? `${payRule.approver}에게 부탁하기` : "주문하기"}
                </Btn>
              </R>
            ) : null}
          </Screen>

          {/* ══ 마음사서함 — 선생님 · 말풍선 · 말하기 · 다음에 오는 날 ══
              담당 컨시어지와 주고받은 목소리만 모아 둔다. 글자를 못 읽으셔도 목소리로 오가게 — 타이핑 입력은 두지 않는다.
              받은 것 왼쪽 초록 · 보낸 것 오른쪽 보라, '24시간 보관'은 첫 날짜 옆에 (시안). */}
          <Screen show={tab === "teacher"} label="어르신 마음사서함">
            <R className="flex items-center justify-between gap-3">
              <h1 className="m-0 text-[30px] font-extrabold">마음사서함</h1>
              {helpMini}
            </R>
            <R d={40} className="flex items-center gap-3.5 rounded-[24px] px-4 py-3.5" style={{ background: TONE.green.bg }}>
              <Face text={avatarText(TEACHER.name)} size={64} fg="#2A4D33" ring="#3B6B47" fontSize={19} style={{ fontWeight: 900 }} />
              <div className="min-w-0 flex-1">
                <div className="text-[21px] font-black">{TEACHER.name} 선생님</div>
                <div className="text-[15px]" style={{ color: "#3B5A44" }}>
                  {TEACHER.role}
                </div>
              </div>
              {/* 전화는 오늘 오시는 날에만 (시트 '오늘' 1번) — 아무 때나 거는 자리가 아니다 */}
              {visitToday && (
                <Btn tone="green" h={56} r={18} px={4} className="w-[56px] flex-none" aria-label={`${TEACHER.name} 선생님께 전화하기`} onClick={callTeacher}>
                  <Line name="phone" size={24} />
                </Btn>
              )}
            </R>
            {calling && (
              <p className="-mt-2 text-center text-[16px] font-bold" style={{ color: TONE.green.fg }} role="status">
                {TEACHER.name} 선생님께 연결 중입니다
              </p>
            )}
            <R d={90} className="flex flex-col gap-3">
              {teacherMsgs.length === 0 ? (
                <p className="rounded-[22px] px-4 py-4 text-center text-[17px] font-bold leading-[1.55]" style={{ background: TONE.gray.bg, color: TONE.gray.fg }}>
                  아직 주고받은 목소리가 없어요.
                  <br />
                  아래에서 첫 인사를 보내 보세요.
                </p>
              ) : (
                teacherMsgs.map((m, i) => {
                  const mine = m.dir === "out";
                  const heard = !!msgPlayed[m.id];
                  const fresh = !mine && !heard;
                  const pkey = `t-${m.id}`;
                  const on = player.playing === pkey;
                  const err = player.failed?.key === pkey ? player.failed.code : null;
                  // 녹음 기능 전에 남은 기록 · 데모 씨앗이 아닌 테스트 기록에는 소리가 없다 — 들은 표시만 한다
                  const silent = !m.clip && !(m.seed && !liveHH);
                  const dayOf = (x) => (isToday(x.at) ? "오늘" : isYesterday(x.at) ? `어제 · ${new Date(x.at).getMonth() + 1}월 ${new Date(x.at).getDate()}일` : spokenDay(x.at));
                  const newDay = i === 0 || dayOf(teacherMsgs[i - 1]) !== dayOf(m);
                  const tn = mine ? TONE.purple : TONE.green;
                  return (
                    <div key={m.id} className="flex flex-col gap-3">
                      {newDay && (
                        <span className="self-center rounded-full px-3 py-1 text-[14px] font-extrabold" style={{ background: "#EEEDEA", color: "#5E5A52" }}>
                          {dayOf(m)}
                          {i === 0 ? " · 24시간 보관" : ""}
                        </span>
                      )}
                      <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                        {!mine && (
                          <span className="flex max-w-[86%] items-center gap-1.5 text-[17px] font-extrabold leading-[1.4]">
                            {fresh && <span className="ds-dot" aria-hidden="true" style={{ width: 9, height: 9 }} />}
                            {m.text}
                          </span>
                        )}
                        {/* 말풍선 = 듣기 버튼. 듣는 중에 다시 누르면 멈춘다 */}
                        <button
                          type="button"
                          onClick={() => playClip(pkey, { clip: m.clip, seed: m.seed }, () => !mine && markPlayed(m.id))}
                          aria-pressed={on}
                          aria-label={`${mine ? "내가 보낸 목소리" : m.text}${fresh ? " · 새 목소리" : ""} · ${on ? "멈추기" : heard || mine ? "다시 듣기" : "듣기"}`}
                          className="ds-press flex h-[62px] w-[80%] items-center gap-2.5 px-3.5"
                          style={{
                            background: tn.bg,
                            boxShadow: `0 4px 0 ${tn.sh}`,
                            borderRadius: mine ? "22px 22px 6px 22px" : "22px 22px 22px 6px",
                          }}
                        >
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-white" style={{ background: tn.solid }}>
                            <Line name={on ? "pause" : player.busy === pkey ? "clock" : "play"} size={on ? 16 : 18} />
                          </span>
                          <Wave color={tn.solid} on={on} />
                          <span className="ds-num flex-none text-[16px] font-extrabold" style={{ color: tn.solid }}>
                            {clock(m.durationSec || 0)}
                          </span>
                        </button>
                        {mine ? (
                          <span className="text-[14px] font-bold" style={{ color: "#6B6658" }}>
                            {spokenTime(m.at)}
                            {silent ? " · 소리 없는 예전 기록" : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="text-[14px] font-bold" style={{ color: "#6B6658" }}>
                              {spokenTime(m.at)}
                              {player.busy === pkey ? " · 받는 중" : silent ? " · 소리 없는 예전 기록" : ""}
                            </span>
                            {/* 내려받기는 받은 메시지에만. 파일명은 ASCII (한글 download 속성은 크롬이 버린다 · 실측) */}
                            {(m.clip || (m.seed && !liveHH)) && (
                              <a
                                href={m.clip ? (m.clip.id.startsWith("vc_") ? `/api/voice?id=${encodeURIComponent(m.clip.id)}&download=1` : clipUrlNow(m.clip) || "#") : TEACHER_DEMO_FILE}
                                download={m.clip ? `kcare-voice-${m.id}` : `kcare-voice-${m.id}-demo.wav`}
                                className="inline-flex min-h-[34px] items-center rounded-full bg-white px-3 text-[14px] font-extrabold"
                                style={{ color: TONE.green.title, boxShadow: `0 2px 0 ${TONE.green.sh}` }}
                              >
                                내려받기
                              </a>
                            )}
                          </span>
                        )}
                        {err && (
                          <p role="alert" className="max-w-[86%] text-[16px] font-bold leading-[1.45]" style={{ color: TONE.gold.fg }}>
                            {playErrorText(err)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </R>
            {/* 보내기 — 시트 마음사서함 1번의 한 줄은 그대로 */}
            <R d={140} className="flex flex-col gap-2">
              <p className="text-center text-[16px] font-bold" style={{ color: "#5E6270" }}>
                선생님과 하루의 일상을 나눠보아요
              </p>
              <button
                type="button"
                onClick={() => setRecFor({ kind: "teacher" })}
                className="ds-press ds-tap ds-btn3d flex min-h-[96px] w-full items-center gap-4 rounded-[30px] px-5 text-left"
                style={soft("purple")}
              >
                <span className="ds-ico flex h-16 w-16 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.solid }}>
                  <Line name="mic" size={30} />
                </span>
                <span className="text-[23px]">선생님께 말하기</span>
              </button>
            </R>
            {nextVisit && (
              <R d={190} className="flex items-center gap-3.5 rounded-[26px] p-[18px]" style={{ background: TONE.beige.bg }}>
                <DBlock top={["일", "월", "화", "수", "목", "금", "토"][new Date(nextVisit.at).getDay()]} day={new Date(nextVisit.at).getDate()} size={64} topFg={TONE.beige.fg} />
                <div>
                  <div className="text-[16px] font-extrabold" style={{ color: TONE.beige.fg }}>
                    다음에 오는 날
                  </div>
                  <div className="text-[21px] font-black">
                    {new Date(nextVisit.at).getMonth() + 1}월 {new Date(nextVisit.at).getDate()}일 {spokenTime(nextVisit.at)}
                  </div>
                </div>
              </R>
            )}
          </Screen>

          {/* ══ 가족 — 자녀 칸 · 고른 사람과의 대화 · 목소리 남기기 · 세대공감 · 자녀 초대 ══ */}
          <Screen show={tab === "family"} label="어르신 가족">
            <R className="flex items-center justify-between gap-3">
              <h1 className="m-0 text-[30px] font-extrabold">가족</h1>
              {helpMini}
            </R>
            <FamilyVoices
              targets={famTargets}
              sel={Math.min(famSel, famTargets.length - 1)}
              onSelect={setFamSel}
              threadFor={threadFor}
              onPlay={playFamily}
              server={serverVoice}
              player={player}
              onSend={(sec, target, clip) => {
                dispatch({
                  type: "addVoice",
                  payload: { from: `${ELDER.name} 님`, to: target.name, secs: sec, context: "안부", clip },
                });
                dispatch({
                  type: "pushEvent",
                  payload: { kind: "음성", text: `${elderWho()} → ${target.name} 목소리 메시지 ${sec}초 전송`, color: "#8FA9CC" },
                });
                toast(`${target.name}에게 보냈어요`);
              }}
            />
            {/* 세대공감 — 옆으로 밀어 보는 5장. "무슨 말을 하지"가 목소리 메시지의 가장 큰 장벽이라 오늘 할 말을 드린다 */}
            <R d={170} className="flex flex-col gap-2.5">
              <h2 className="m-0 text-[20px] font-black">세대공감</h2>
              <div className="-mx-[18px] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 [scrollbar-width:none]">
                {genTopics.map((t, i) => {
                  const tn = TONE[GEN_TONES[i % GEN_TONES.length]];
                  return (
                    <div key={`${t.title}-${i}`} className="flex w-[80%] flex-none snap-start flex-col gap-2 rounded-[24px] p-[18px]" style={{ background: tn.bg }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-extrabold" style={{ color: tn.fg }}>
                          {t.kind}
                        </span>
                        <span className="text-[14px] font-extrabold" style={{ color: "#5E6270" }}>
                          {i + 1} / {genTopics.length}
                        </span>
                      </div>
                      <div className="text-[21px] font-black leading-[1.35]">{t.title}</div>
                      <div className="text-[16px] leading-[1.5]" style={{ color: "#3A3F50" }}>
                        {t.body}
                      </div>
                      <div className="rounded-[14px] bg-white px-3 py-2.5 text-[15px] font-extrabold leading-[1.45]" style={{ color: tn.fg }}>
                        {t.prompt}
                      </div>
                    </div>
                  );
                })}
              </div>
            </R>
            {/* 자녀 초대하기 (2026-10-14 현장 '연동 확인' 4번) — 가입 코드로 회원 가입한 아이디에서만 보인다 */}
            {authUser?.provider === "member" && (
              <R d={200}>
                <Card>
                  <h2 className="m-0 text-[20px] font-black">자녀 초대하기</h2>
                  <div className="mt-2">
                    <InviteLink variant="elder" fromName={name} />
                  </div>
                </Card>
              </R>
            )}
          </Screen>
        </main>

        {/* ── 하단 메뉴 — 따로 떠 있는 큰 칸 셋 (2026-10-15 시안). 지금 탭만 남색.
            안 들은 메시지는 금색 숫자 (점은 무엇인지 알기 어렵다는 피드백 · 2026-09-10) ── */}
        <nav className="ds-nav ds-nav-s" aria-label="어르신 메뉴">
          {TABS.map((t) => {
            const active = tab === t.key;
            const n = t.key === "teacher" ? unreadMsgs.length : 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                aria-label={n ? `${t.label} — 안 들은 메시지 ${n}개` : undefined}
              >
                {n > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-[14%] top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[13px] font-black leading-none text-white"
                    style={{ background: TONE.gold.badge, boxShadow: "0 0 0 2px #FFFFFF" }}
                  >
                    {n}
                  </span>
                )}
                {t.key === "teacher" ? <Line name="chat" size={24} /> : t.key === "home" ? <Line name="homeFill" size={24} /> : <Art name="family" width={30} height={24} />}
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
      {toastEl}

      {/* ── 시트들 ── */}
      {/* 이번 달 일정 (오늘 탭) — 날짜를 누르면 그날 것만, 다시 누르면 전체 */}
      <Sheet open={monthOpen} onClose={() => setMonthOpen(false)} label="이번 달 일정">
        <SheetTitle sub={`${now.getMonth() + 1}월`} title="이번 달 일정" />
        <div className="ds-cal text-center" role="group" aria-label={`${now.getMonth() + 1}월 달력`}>
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <span key={w} aria-hidden="true" style={{ height: 28, fontSize: 14, color: "#5E6270" }}>
              {w}
            </span>
          ))}
          {monthCells.map((c, i) =>
            c === null ? (
              <span key={`b${i}`} aria-hidden="true" />
            ) : (
              <button
                key={c.day}
                type="button"
                onClick={() => setCalSel((s) => (s === c.day ? null : c.day))}
                aria-pressed={calSel === c.day}
                aria-label={`${c.day}일${c.today ? " 오늘" : ""}${c.count ? ` · 일정 ${c.count}건` : ""}`}
                style={calSel === c.day ? { background: "#1B2340", color: "#FFFFFF" } : c.today ? { background: TONE.beige.bg, borderColor: "#C9A064" } : undefined}
              >
                <span>{c.day}</span>
                <i style={{ background: c.count ? (calSel === c.day ? "#FFFFFF" : "#B79B52") : "transparent" }} />
              </button>
            )
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {calSel && (
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-extrabold">
                {now.getMonth() + 1}월 {calSel}일
              </span>
              <button type="button" onClick={() => setCalSel(null)} className="min-h-[44px] px-2 text-[16px] font-extrabold underline underline-offset-4" style={{ color: "#5E6270" }}>
                이번 달 전체 보기
              </button>
            </div>
          )}
          {monthList.length === 0 ? (
            <p className="rounded-[20px] px-4 py-4 text-center text-[17px] font-bold" style={{ background: TONE.gray.bg, color: TONE.gray.fg }}>
              {calSel ? `${calSel}일에는 잡힌 일정이 없습니다.` : "이번 달에 잡힌 일정이 없습니다."}
            </p>
          ) : (
            monthList.map((e) => (
              <MyEventRow key={e.id} e={e} today={isToday(e.at)} approvalWord={approvalWord} confirming={evConfirm === e.id} onEdit={() => (setMonthOpen(false), setEvEdit(e))} onAskRemove={() => setEvConfirm(e.id)} onCancelRemove={() => setEvConfirm(null)} onRemove={() => removeMyEvent(e)} />
            ))
          )}
          {!calSel && laterMine.length > 0 && (
            <>
              <div className="pt-1 text-[17px] font-extrabold">다음 달 이후 남기신 일정</div>
              {laterMine.map((e) => (
                <MyEventRow key={e.id} e={e} month approvalWord={approvalWord} confirming={evConfirm === e.id} onEdit={() => (setMonthOpen(false), setEvEdit(e))} onAskRemove={() => setEvConfirm(e.id)} onCancelRemove={() => setEvConfirm(null)} onRemove={() => removeMyEvent(e)} />
              ))}
            </>
          )}
        </div>
        <WhiteBtn className="text-[18px]" onClick={() => setMonthOpen(false)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 지난 기록 (건강 '어제와 비교') — 살펴볼 것 · 평소 범위 (components/ElderHealthReport.jsx) */}
      <Sheet open={infoSheet === "watch"} onClose={() => setInfoSheet(null)} label="지난 기록">
        <ElderHealthReport />
        <WhiteBtn className="text-[18px]" onClick={() => setInfoSheet(null)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 드시는 약 — 첫 안심방문 때 등록한 정보. 체크(미션)는 위에서, 여기는 무엇을 언제 드시는지만.
          2026-09-04 시트 오늘 2번 · 건강 2번 — 등록 경위 문장과 성분명을 뺐다 */}
      <Sheet open={infoSheet === "meds"} onClose={() => setInfoSheet(null)} label="드시는 약">
        <SheetTitle sub="드시는 약" title={medPlan.length ? `하루 ${medPlan.length}번` : "등록 전"} />
        {medPlan.length === 0 ? (
          <p className="text-[18px] leading-[1.6]" style={{ color: "#5E6270" }}>
            아직 등록된 약이 없습니다. 선생님이 방문 때 등록해 드립니다.
          </p>
        ) : (
          medPlan.map((d) => (
            <Card key={d.slot} r={20} pad={14} className="flex items-center gap-3.5" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
              <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full" style={{ background: TONE.gold.bg }}>
                <Clay name={timeArt(d.time)} size={34} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[17px] font-extrabold" style={{ color: TONE.beige.fg }}>
                  {d.slot} {spokenClock(d.time)}
                </b>
                <span className="block text-[17px] font-extrabold">{d.elderLabel}</span>
                <span className="text-[15px]" style={{ color: "#5E6270" }}>
                  {d.items.map((i) => stripIngredient(i.name)).join(" · ")}
                </span>
              </span>
            </Card>
          ))
        )}
        <WhiteBtn className="text-[18px]" onClick={() => setInfoSheet(null)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 건강식품 — 남은 양과 유통기한. 떨어질 때쯤 알려 드린다 (시트 '건강' 1번 뒷부분) */}
      <Sheet open={infoSheet === "supp"} onClose={() => setInfoSheet(null)} label="드시는 건강식품">
        <SheetTitle sub="드시는 건강식품" title={!supplements.length ? "등록 전" : supAlerts.length ? `${supAlerts.length}가지 챙기실 것` : "넉넉합니다"} />
        {supplements.length === 0 && (
          <p className="text-[18px]" style={{ color: "#5E6270" }}>
            등록된 건강식품이 없습니다.
          </p>
        )}
        {supplements.map((s) => {
          const left = daysLeft(s);
          // 재구매 부탁 — 그 요청이 취소 · 거절되면 다시 부탁할 수 있게 요청 상태로 읽는다 (요청이 없는 옛 표시는 그대로)
          const ask = (state.requests || []).find((r) => r.type === "건강식품 재구매" && String(r.detail || "").startsWith(`${s.name} —`));
          const done = ask ? !["cancelled", "rejected"].includes(ask.status) : !!reordered[s.id];
          return (
            <Card key={s.id} r={20} pad={14} className="flex flex-col gap-2.5" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
              <div className="flex items-start gap-2.5">
                <span className="min-w-0 flex-1">
                  <b className="block text-[18px] font-extrabold">{s.name}</b>
                  <span className="text-[15px]" style={{ color: "#5E6270" }}>
                    {s.remain}
                    {s.unit} 남음 · {left}일치 · 유통기한 {s.expiry}
                  </span>
                </span>
                {s.alert && (
                  <Pill bg={TONE.gold.bg} fg={TONE.gold.fg}>
                    {s.alert}
                  </Pill>
                )}
              </div>
              {s.alert &&
                (done ? (
                  <div className="rounded-[14px] py-3 text-center text-[16px] font-extrabold" style={{ background: TONE.green.bg, color: "#2A4D33" }}>
                    ✓ 부탁했어요
                  </div>
                ) : (
                  <Btn
                    tone="beige"
                    fill={false}
                    h={52}
                    r={16}
                    px={4}
                    className="text-[17px]"
                    style={{ color: "#5E4A1E" }}
                    onClick={() => {
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
                          assignee: assigneeNow() || "",
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
                  >
                    다시 사다 주세요
                  </Btn>
                ))}
            </Card>
          );
        })}
        <WhiteBtn className="text-[18px]" onClick={() => setInfoSheet(null)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 병원에 여쭤볼 것 — 2026-10-14 현장 요청 3번: 실제로 녹음하고, 다시 말하기(수정) · 해결 · 지우기.
          음성이 1차 입력 수단 — 키보드 입력 UI 금지. 출처 3종(어르신 · 가족 · 선생님)을 그대로 쓴다 */}
      <Sheet open={infoSheet === "ask"} onClose={() => setInfoSheet(null)} label="병원에 여쭤볼 것">
        <SheetTitle sub="병원에서" title={`여쭤볼 것 ${askList.length}가지`} />
        {askList.length === 0 && (
          <p className="text-[18px]" style={{ color: "#5E6270" }}>
            아직 남긴 것이 없습니다.
          </p>
        )}
        {askList.map((q, i) => (
          <AskDoctorRow
            key={q.id}
            q={q}
            n={i + 1}
            player={player}
            playClip={playClip}
            confirming={askConfirm === q.id}
            onAskRemove={() => setAskConfirm(q.id)}
            onCancelRemove={() => setAskConfirm(null)}
            onRemove={() => {
              dispatch({ type: "askDoctorRemove", id: q.id });
              setAskConfirm(null);
            }}
            onRedo={() => setRecFor({ kind: "askDoctorEdit", id: q.id })}
            onResolve={() => dispatch({ type: "askDoctorStatus", id: q.id, status: "resolved" })}
          />
        ))}
        <Btn tone="purple" h={66} r={22} px={5} className="text-[20px]" onClick={() => setRecFor({ kind: "askDoctor" })}>
          <Line name="mic" size={24} />
          말로 하나 더 남기기
        </Btn>
        {askDone.length > 0 && (
          <>
            <WhiteBtn className="text-[17px]" style={{ background: "#F3F1EC" }} aria-expanded={askDoneOpen} onClick={() => setAskDoneOpen((v) => !v)}>
              해결한 것 {askDone.length}가지 {askDoneOpen ? "접기" : "보기"}
            </WhiteBtn>
            {askDoneOpen &&
              askDone.map((q, i) => (
                <AskDoctorRow
                  key={q.id}
                  q={q}
                  n={i + 1}
                  done
                  player={player}
                  playClip={playClip}
                  confirming={askConfirm === q.id}
                  onAskRemove={() => setAskConfirm(q.id)}
                  onCancelRemove={() => setAskConfirm(null)}
                  onRemove={() => {
                    dispatch({ type: "askDoctorRemove", id: q.id });
                    setAskConfirm(null);
                  }}
                  onReopen={() => dispatch({ type: "askDoctorStatus", id: q.id, status: "open" })}
                />
              ))}
          </>
        )}
        <WhiteBtn className="text-[18px]" onClick={() => setInfoSheet(null)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 지금 우리 동네 — 실외. 아직 예시 날씨 (2026-10-02 QA). REQ-01 — 보호자가 고른 우선 항목이 앞으로 */}
      <Sheet open={infoSheet === "weather"} onClose={() => setInfoSheet(null)} label="지금 우리 동네">
        <SheetTitle sub={`${ELDER.dong || "우리 동네"} · 날씨 케이웨더 · 예시`} title="지금 우리 동네" />
        <div className="ds-g2" style={{ gap: 8 }}>
          {[
            { label: "지금", value: ELDER_NOW.tempLabel, level: "neutral" },
            { label: "체감", value: ELDER_NOW.feelsLabel.replace(/^체감\s*/, ""), level: "neutral" },
            ...[...ELDER_NOW.factors].sort((a, b) => (state.priority.factors.includes(b.label) ? 1 : 0) - (state.priority.factors.includes(a.label) ? 1 : 0)),
          ].map((f) => {
            const warn = f.level === "danger" || f.level === "caution";
            return (
              <div key={f.label} className="rounded-[18px] p-3.5" style={{ background: warn ? TONE.brown.bg : "#FFFFFF", boxShadow: "0 3px 0 #E6E2DA" }}>
                <div className="text-[14px] font-extrabold" style={{ color: "#5E6270" }}>
                  {f.label}
                  {state.priority.factors.includes(f.label) ? " · 먼저 볼 것" : ""}
                </div>
                <div className="text-[21px] font-black" style={{ color: warn ? TONE.brown.fg : "#1B2340" }}>
                  {f.value}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-[16px] px-3.5 py-3 text-[16px] font-bold leading-[1.55]" style={{ background: TONE.beige.bg, color: "#5E4A1E" }}>
          {OUTING.adviceElder}
        </div>
        <WhiteBtn className="text-[18px]" onClick={() => setInfoSheet(null)}>
          닫기
        </WhiteBtn>
      </Sheet>

      {/* 일정 바꾸기 — 본인이 남긴 일정의 날짜 · 시간만 (무슨 일인지는 지우고 다시 남긴다) */}
      {evEdit && <ElderEventSheet initial={evEdit} onClose={() => setEvEdit(null)} onCreate={(ev) => saveMyEvent(evEdit, ev.at)} />}

      {/* 부탁한 날짜 바꾸기 — 선생님이 정하기 전까지만. 그사이 선생님이 정하면 '이미 정해졌어요'로 */}
      {reqDateEdit && (
        <ElderReqDateSheet
          req={(state.requests || []).find((x) => x.id === reqDateEdit.id) || reqDateEdit}
          onClose={() => setReqDateEdit(null)}
          onSave={saveReqDate}
        />
      )}

      {/* 일정 남기기 — 큰 칸 · 달력. 자유 입력 없음 (저인지부하) */}
      {eventSheet && (
        <ElderEventSheet
          onClose={() => setEventSheet(false)}
          onCreate={(ev) => {
            dispatch({ type: "addEvent", payload: ev });
            dispatch({
              type: "pushEvent",
              payload:
                ev.approval === "pending"
                  ? { kind: "일정", text: `어르신 일정등록 요청 — ${ev.title}${ev.escort ? " · 동행 필요" : ""} · 관제 검토 대기`, color: "#B08D57" }
                  : { kind: "일정", text: `어르신 간단등록 · ${ev.title}`, color: "#8FA9CC" },
            });
            setEventSheet(false);
            toast(ev.approval === "pending" ? "남겼어요 · 관제가 확인하면 확정돼요" : "일정을 남겼어요 · 가족에게도 보여요");
          }}
        />
      )}

      {/* 상품 정보 — 담기 전에 먼저 본다 (2026-09-22 · 전자상거래법 상품 정보 표시) */}
      <ProductSheet
        elder
        item={storeDetail}
        image={storeDetail ? storeImages[storeDetail.id] : null}
        category={storeCatalog}
        selected={storeDetail ? !!storeSel[storeDetail.id] : false}
        onToggle={(it) => {
          const on = !storeSel[it.id];
          setStoreSel((s) => ({ ...s, [it.id]: on }));
          toast(on ? "장바구니에 담았어요" : "장바구니에서 뺐어요");
        }}
        onClose={() => setStoreDetail(null)}
      />
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
          hospitals={(state.myHospitals || []).map((h) => h.name).filter(Boolean)}
          onCallOps={() => {
            // 응급 대응 — 요청서 대신 '관제와 통화하기' 하나 (2026-10-14 현장 요청 7번). 도와줘요와 같은 길로 관제가 먼저 전화한다
            const already = !!visitOpen;
            askVisit("응급 대응");
            setAskSent({ name: askSel.name, mode: "callOps", already });
          }}
          onAsk={({ ymd, hm, hospital }) => {
            const amount = askSel.amount;
            // 달력에서 고른 날짜 · 시간 (2026-10-14 현장 요청 6번) — 담당 컨시어지 승인 화면에 그대로 기본값이 된다
            const whenText = ymd && hm ? spokenDateTime(ymd, hm) : null;
            setAskSent({ name: askSel.name, mode: askPlan.mode, amount, when: whenText });
            const now0 = Date.now();
            // 서비스 이름을 그대로 남긴다 — 전에는 '부탁' · '부탁 · 승인 필요'로 들어가 관제에서 '메뉴 외 요청'이 됐다 (2026-10-02 QA).
            // 담당 컨시어지가 자기 일정을 보고 승인한다 (2026-10-05). 한도를 넘는 것은 보호자가 먼저 결제한다.
            dispatch({
              type: "addRequest",
              payload: {
                id: `rq-${now0}`,
                dir: "fromElder",
                type: askSel.name,
                detail: [askSel.scope, whenText ? `희망: ${whenText}` : "일정은 선생님이 연락드려 정함", hospital ? `병원: ${hospital}` : null].filter(Boolean).join(" · "),
                amount,
                preferredDate: ymd || null,
                preferredTime: hm || null,
                preferredWhen: whenText || "선생님과 통화해서 정하기",
                hospital: hospital || null,
                payBy: askPlan.approval || !amount ? null : "elder",
                urgency: "normal",
                assignee: assigneeNow() || "",
                photos: [],
                status: askPlan.approval ? "awaitingPayment" : "requested",
                history: [
                  { at: now0, status: "requested", note: `어르신 해주세요 · 희망 ${whenText || "선생님과 정함"}${hospital ? ` · ${hospital}` : ""}` },
                  ...(askPlan.approval ? [{ at: now0, status: "awaitingPayment", note: `보호자 결제 대기 · ${fmtWon(amount)} (오늘 한도 초과)` }] : []),
                ],
                proof: null,
              },
            });
            dispatch({
              type: "pushEvent",
              payload: {
                kind: "부탁",
                text: askPlan.approval
                  ? `${ELDER.name} 해주세요 — ${askSel.name} · 보호자 결제 요청 (${fmtWon(amount)})`
                  : `${ELDER.name} 해주세요 — ${askSel.name} · ${amount === 0 ? "멤버십 포함" : amount == null ? "요금 확인 후 안내" : `직접 결제 ${fmtWon(amount)}`}`,
                color: "#B08D57",
              },
            });
          }}
        />
      )}

      {/* 복지혜택 시트 — 해주세요 '복지 혜택' 타일 (2026-09-04 시트 앱 전체 3번).
          어르신에게는 판정 등급·점수 대신 "받으실 수 있어요 / 확인이 필요해요" 두 말로. 신청은 선생님 · 가족이 한다. */}
      {welfareOpen && (
        <ElderWelfareSheet
          matches={welfareMatches}
          counts={welfareN}
          asked={welfareAsked}
          onClose={() => setWelfareOpen(false)}
          onAsk={() => {
            if (welfareAsked) return;
            dispatch({
              type: "addRequest",
              payload: {
                id: `rq-${Date.now()}`,
                dir: "fromElder",
                type: "복지혜택 안내 부탁",
                detail: `받을 수 있는 나라 혜택 확인 부탁 — 가능 ${welfareN.high}건 · 확인 필요 ${welfareN.check}건 (어르신 해주세요)`,
                amount: 0,
                preferredDate: null,
                urgency: "normal",
                assignee: assigneeNow() || "",
                photos: [],
                status: "requested",
                history: [{ at: Date.now(), status: "requested", note: "어르신 해주세요 · 복지 혜택" }],
                proof: null,
              },
            });
            dispatch({
              type: "pushEvent",
              payload: { kind: "복지", text: `${ELDER.name} 복지혜택 안내 부탁 — 자동 매칭 ${welfareN.high + welfareN.check}건`, color: "#B08D57" },
            });
          }}
        />
      )}

      {/* SOS — 화면 안 버튼은 없앴고(시트 전체 요청 3번), 바탕화면 바로가기로만 들어온다.
          /elder?sos=1 로 열리면 5초 취소 유예 화면이 바로 뜬다. */}
      <SosButton
        phase={sosPhase}
        setPhase={setSosPhase}
        dispatched={!!state.ops.sosDispatched}
        onDispatch={() => {
          // sosAt — 관제가 이 발신을 사건 저장소에 한 번만 잇기 위한 표식 (pages/dispatch.jsx)
          dispatch({ type: "demo", payload: { sos: true, sosAt: Date.now() } });
          dispatch({
            type: "pushEvent",
            payload: { kind: "SOS", text: `${elderWho()} SOS 발신 · 가족·관제 동시 점등`, color: "#FF8A80" },
          });
        }}
      />
    </>
  );
}

// 어르신 간단등록 — REQ-02 권한표 "간단등록". 종류는 큰 칸, 날짜 · 시간은 달력에서 고른다
// (2026-10-14 현장 요청 8번 — 오늘 · 내일 · 모레 버튼만 있어서 다음 주 일정을 넣을 수 없었다). 자유 입력은 없다 (저인지부하).
const ELDER_EVENT_KINDS = [
  { kind: "family", label: "가족이 와요" },
  { kind: "hospital", label: "병원 갈 일" },
  { kind: "request", label: "부탁할 일" },
];

// 고르기 칸 — 고른 것은 보라로 찬다 (시안 chipBtn)
function Pick({ on, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      {...rest}
      className={`ds-pick px-1 text-[17px] leading-[1.3] disabled:opacity-40 ${className}`}
      style={on ? { background: TONE.purple.solid, color: "#FFFFFF", boxShadow: `0 4px 0 ${TONE.purple.solidSh}` } : { background: "#FFFFFF", color: "#1B2340", boxShadow: "0 4px 0 #E3DED3" }}
    >
      {children}
    </button>
  );
}

// 본인이 남긴 일정 한 줄 (이번 달 시트) — 큰 버튼: 바꾸기 · 지우기(승인 전 · 가족 일정 · 반려) / 취소하기(확정된 것, 관제에 알림).
// 남이 정한 일정(가족 · 선생님 · 관제)은 보기만 한다. 규칙은 lib/event-rights.js
function MyEventRow({ e, today = false, month = false, approvalWord, confirming, onEdit, onAskRemove, onCancelRemove, onRemove }) {
  const d = new Date(e.at);
  const tn = TONE[eventTone(e.kind)];
  const r = eventRights(e, "elder");
  const cancel = r.remove === "cancel";
  const big = "ds-press ds-btn3d flex min-h-[54px] items-center justify-center rounded-[16px] px-2 text-[17px]";
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] p-3" style={{ background: tn.bg }}>
      <div className="flex items-center gap-3.5">
        <DBlock top={month ? `${d.getMonth() + 1}월` : ["일", "월", "화", "수", "목", "금", "토"][d.getDay()]} day={d.getDate()} topFg={tn.fg} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold leading-[1.35]">{cleanTitle(e.title)}</div>
          <div className="text-[15px]" style={{ color: "#4A4F5E" }}>
            {spokenTime(e.at)}
            {approvalWord(e) && ` · ${approvalWord(e)}`}
          </div>
        </div>
        {today && <Pill bg="#1B2340" fg="#FFFFFF">오늘</Pill>}
      </div>
      {confirming ? (
        <div className="rounded-[16px] bg-white p-3">
          <p className="text-[17px] font-extrabold">{cancel ? "이 일정을 취소할까요?" : "이 일정을 지울까요?"}</p>
          {cancel && (
            <p className="mt-0.5 text-[15px] leading-[1.5]" style={{ color: "#5E6270" }}>
              관제에 바로 알려 드려요.
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={onCancelRemove} className={big} style={{ background: "#F3F1EC", boxShadow: "0 4px 0 #E3DED3" }}>
              아니요
            </button>
            <button type="button" onClick={onRemove} className={big} style={solid("navy", 4)}>
              {cancel ? "취소할게요" : "지울게요"}
            </button>
          </div>
        </div>
      ) : (
        (r.edit || r.remove) && (
          <div className="grid grid-cols-2 gap-2">
            {r.edit && (
              <button type="button" onClick={onEdit} aria-label={`${cleanTitle(e.title)} 바꾸기`} className={big} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)" }}>
                바꾸기
              </button>
            )}
            {r.remove && (
              <button type="button" onClick={onAskRemove} aria-label={`${cleanTitle(e.title)} ${cancel ? "취소하기" : "지우기"}`} className={big} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)" }}>
                {cancel ? "취소하기" : "지우기"}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

function ElderEventSheet({ onClose, onCreate, initial = null }) {
  // 바꿀 때는 무슨 일인지는 그대로 두고 날짜 · 시간만 고른다 — 다른 일로 바꾸려면 지우고 다시 남긴다
  const [kind, setKind] = useState(() => (initial ? ELDER_EVENT_KINDS.find((o) => o.kind === initial.kind) || { kind: initial.kind, label: cleanTitle(initial.title) } : null));
  const [when, setWhen] = useState(() => {
    if (!initial) return { ymd: null, hm: null };
    const d = new Date(initial.at);
    return { ymd: ymdOf(d), hm: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
  });

  const ready = !!kind && !!when.ymd && !!when.hm;
  const changed = !initial || atOf(when.ymd, when.hm) !== initial.at;

  const save = () => {
    if (!ready || !changed) return;
    // 병원 · 부탁할 일은 K-CARE 가 움직여야 하는 일이라 관제 승인을 거친다 (보호자 일정등록과 같은 규칙).
    // 가족이 오는 일정만 바로 올라간다.
    const needsOps = kind.kind !== "family";
    onCreate({
      id: `ev-${Date.now()}`,
      kind: kind.kind,
      title: kind.label,
      at: atOf(when.ymd, when.hm),
      source: "어르신 등록",
      note: "",
      by: "elder", // 누가 남긴 일정인가 — 바꾸기 · 지우기 권한이 이것을 본다
      ...(needsOps ? { approval: "pending", escort: kind.kind === "hospital" } : {}),
    });
  };

  return (
    <Sheet onClose={onClose} label={initial ? "일정 바꾸기" : "일정 남기기"}>
      <SheetTitle sub="가족에게 함께 보여요" title={initial ? "일정 바꾸기" : "일정 남기기"} />
      <p className="-mt-1 text-[16px] leading-[1.5]" style={{ color: "#5E6270" }}>
        {initial
          ? initial.approval === "approved"
            ? "관제가 확정한 일정이라, 날짜 · 시간을 바꾸면 관제가 다시 확인해요."
            : "날짜 · 시간만 바꿀 수 있어요. 다른 일로 바꾸시려면 지우고 다시 남겨 주세요."
          : "병원 · 부탁할 일은 관제가 확인한 뒤 확정됩니다."}
      </p>
      {initial ? (
        <div className="text-[19px] font-extrabold">
          무슨 일: <span style={{ color: TONE.purple.fg }}>{kind?.label}</span>
        </div>
      ) : (
        <>
          <div className="text-[19px] font-extrabold">무슨 일인가요?</div>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="무슨 일인가요">
            {ELDER_EVENT_KINDS.map((o) => (
              <Pick key={o.kind} on={kind === o} onClick={() => setKind(o)}>
                {o.label}
              </Pick>
            ))}
          </div>
        </>
      )}
      <ElderDateTime ymd={when.ymd} hm={when.hm} onChange={setWhen} title="언제인가요?" />
      <Btn tone={ready && changed ? "navy" : "stone"} h={64} r={22} px={5} disabled={!ready || !changed} onClick={save} className="text-[20px]" style={ready && changed ? undefined : { background: "#D8D3C7", boxShadow: "0 5px 0 #C4BEB1", color: "#5E5A52" }}>
        {!ready ? (!kind ? "무슨 일인지 골라 주세요" : "날짜 · 시간을 골라 주세요") : !changed ? "바꿀 날짜 · 시간을 골라 주세요" : initial ? "바꾸기" : "남기기"}
      </Btn>
      <WhiteBtn className="text-[18px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

// 오늘 여쭤볼 것 한 줄 (2026-10-14 현장 요청 3번) — 번호 · 질문(적힌 글 또는 '말로 남기신 질문') · 누가 남겼나,
// 그 아래 큰 버튼: 듣기 · 다시 말하기(고치기) · 해결했어요 · 지우기. 지우기는 한 번 더 묻는다.
// 가족 · 선생님이 남긴 질문은 어르신이 지우지 않는다(해결만) — 해결한 뒤에는 지울 수 있다.
// 출처마다 색 — 어르신 보라 · 가족 파랑 · 선생님 초록 (시안)
const ASK_SOURCE_TONE = { elder: "purple", family: "blue", concierge: "green" };
function AskDoctorRow({ q, n, done = false, player, playClip, confirming, onAskRemove, onCancelRemove, onRemove, onRedo, onResolve, onReopen }) {
  const mine = q.source === "elder";
  const pkey = `ad-${q.id}`;
  const on = player.playing === pkey;
  const err = player.failed?.key === pkey ? player.failed.code : null;
  const tn = done ? TONE.gray : TONE[ASK_SOURCE_TONE[q.source] || "purple"];
  const small = "ds-press ds-btn3d flex min-h-[54px] items-center justify-center gap-1.5 rounded-[16px] px-2 text-[17px]";
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] p-3.5" style={{ background: tn.bg }}>
      <div className="flex gap-3">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-white text-[17px] font-black" style={{ color: tn.fg }}>
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[17px] font-extrabold leading-[1.45]" style={{ color: done ? "#5E5A52" : "#1B2340" }}>
            {q.text || `말로 남기신 질문${q.secs ? ` · ${clock(q.secs)}` : ""}`}
          </b>
          <span className="text-[15px] font-bold" style={{ color: tn.fg }}>
            {q.sourceLabel}
            {q.editedAt ? " · 다시 말씀하심" : ""}
            {done ? " · 해결했어요" : ""}
          </span>
        </div>
      </div>
      {err && (
        <p role="alert" className="text-[16px] font-bold leading-[1.45]" style={{ color: TONE.gold.fg }}>
          {playErrorText(err)}
        </p>
      )}
      {confirming ? (
        <div className="rounded-[16px] bg-white p-3">
          <p className="text-[17px] font-extrabold">이 질문을 지울까요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={onCancelRemove} className={small} style={{ background: "#F3F1EC", boxShadow: "0 4px 0 #E3DED3" }}>
              아니요
            </button>
            <button type="button" onClick={onRemove} className={small} style={solid("navy", 4)}>
              지울게요
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {q.clip && (
            <button type="button" onClick={() => playClip(pkey, { clip: q.clip })} aria-pressed={on} className={small} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)" }}>
              <Line name={on ? "pause" : "speaker"} size={20} />
              {on ? "멈추기" : player.busy === pkey ? "받는 중" : "듣기"}
            </button>
          )}
          {!done && mine && (
            <button type="button" onClick={onRedo} className={small} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)" }}>
              <Line name="mic" size={20} />
              다시 말하기
            </button>
          )}
          {!done && (
            <button type="button" onClick={onResolve} className={small} style={solid("green", 4)}>
              <Line name="check" size={20} />
              해결했어요
            </button>
          )}
          {done && (
            <button type="button" onClick={onReopen} className={small} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)" }}>
              다시 여쭤보기
            </button>
          )}
          {(mine || done) && (
            <button type="button" onClick={onAskRemove} className={small} style={{ background: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,.08)", color: "#5E6270" }}>
              지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// 그곳의 지금 — 새벽 · 아침 · 낮 · 저녁 · 밤 (어르신이 '지금 전화해도 되나'를 가늠하는 말)
function localPart(tz) {
  try {
    const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
    return h < 5 ? "새벽" : h < 11 ? "아침" : h < 17 ? "낮" : h < 21 ? "저녁" : "밤";
  } catch (_) {
    return null;
  }
}

// 가족 — 자녀 칸(2열)에서 한 사람을 고르면 그 사람과 주고받은 목소리가 아래에 보이고, 바로 목소리를 남긴다 (2026-10-15 시안).
// 받은 것은 그 사람 색 말풍선, 보낸 것은 보라 — 마음사서함과 같은 문법이다.
// 녹음은 눌렀다 떼는 토글이다 (2026-08-12 시트 가족 1번) — 꾹 누르기는 손 떨림에 끊긴다.
// 2026-10-14부터 실제로 녹음한다 — 누르면 마이크가 켜지고, 다시 누르면 서버에 올린 뒤에 보낸다 (lib/voice-client.js).
// 녹음 중 색은 금색 (시안은 빨강 — 빨강은 SOS 전용 · 06 §4.2).
function FamilyVoices({ targets, sel, onSelect, threadFor, onPlay, onSend, server = false, player }) {
  const [recId, setRecId] = useState(null); // 녹음 중인 사람 id
  const [sending, setSending] = useState(null); // 보내는 중인 사람 id
  const [problem, setProblem] = useState(null); // { id, text, retry? } — 못 보낸 이유
  const lastOut = useRef(null);
  const recIdRef = useRef(null);
  recIdRef.current = recId;
  // 1분이 차거나 마이크가 끊기면 그대로 보낸다 (다 말씀하신 것을 버리지 않는다)
  const recorder = useRecorder({ onMax: (p) => p.then((out) => out && deliver(recIdRef.current, out)) });

  const deliver = async (id, out) => {
    const v = targets.find((t) => t.id === id);
    setRecId(null);
    if (!v || !out) return;
    lastOut.current = { id, out };
    setSending(id);
    setProblem(null);
    try {
      const clip = await saveClip(out, { server });
      onSend(clip.secs, v, clip);
    } catch (e) {
      setProblem({ id, text: sendErrorText(e.code), retry: true });
    } finally {
      setSending(null);
    }
  };
  const start = async (v) => {
    setProblem(null);
    if (recId) recorder.cancel();
    setRecId(v.id);
    const ok = await recorder.start();
    if (!ok) setRecId(null);
  };
  const finish = async (v) => {
    const out = await recorder.stop();
    if (!out) {
      setRecId(null);
      return;
    }
    deliver(v.id, out);
  };
  // 녹음기가 오류로 끝났다(마이크 거부 · 너무 짧음) — 그 사람 칸에 이유를 띄운다
  useEffect(() => {
    if (recorder.phase === "error" && recorder.error) {
      setProblem({ id: recIdRef.current || problem?.id, text: RECORD_ERRORS[recorder.error] || RECORD_ERRORS.failed });
      setRecId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.phase, recorder.error]);

  const v = targets[sel] || targets[0];
  if (!v) return null;
  const tn = famTone(v, sel);
  const thread = threadFor(v);
  const on = recId === v.id && (recorder.phase === "rec" || recorder.phase === "asking");
  const busy = sending === v.id;
  const prob = problem?.id === v.id ? problem : null;
  const part = v.tz ? localPart(v.tz) : null;
  // "아들 민수" → 칸 위 글자는 관계("아들"), 얼굴 안은 이름 — 관계가 없는 이름(센터 회원)은 그대로
  const rel = (t) => (t.id === "all" ? "모두" : t.name.includes(" ") ? t.name.split(" ")[0] : t.name);

  return (
    <>
      <R d={50} className="grid grid-cols-2 gap-2.5" role="group" aria-label="누구에게">
        {targets.map((t, i) => {
          const c = famTone(t, i);
          const isOn = sel === i;
          const unread = threadFor(t).filter((m) => m.dir === "in" && !m.played).length;
          const p = t.tz ? localPart(t.tz) : null;
          const note = unread > 0 ? "새 목소리" : t.tz ? `${t.sub}${p ? ` · ${p}` : ""}` : t.id === "all" ? "모두에게" : t.sub;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={isOn}
              aria-label={`${t.name}${unread ? ` — 새 목소리 ${unread}개` : ""}`}
              className="ds-tap flex items-center gap-2.5 rounded-[24px] p-3 text-left"
              style={{ background: c.bg, border: `3px solid ${isOn ? c.title : "transparent"}` }}
            >
              <Face text={t.initials} size={52} fg={c.title} fontSize={16} className="ds-ico" />
              <span className="min-w-0">
                <b className="block truncate text-[18px] font-extrabold" style={{ color: c.title }}>
                  {rel(t)}
                </b>
                <span className="flex items-center gap-1 text-[14px] font-bold leading-[1.3]" style={{ color: unread ? TONE.gold.fg : "#5E6270" }}>
                  {unread > 0 && <span className="ds-dot" aria-hidden="true" style={{ width: 8, height: 8 }} />}
                  <span>{note}</span>
                </span>
              </span>
            </button>
          );
        })}
      </R>

      <R d={100} className="flex flex-col gap-2.5 rounded-[26px] p-4" style={{ background: "#F3F1EC" }}>
        {part && (
          <div className="text-[15px] font-extrabold" style={{ color: tn.title }}>
            {v.sub}는 지금 {part}이에요
          </div>
        )}
        {thread.length === 0 ? (
          <div className="p-3 text-center text-[16px] font-bold" style={{ color: "#5E5A52" }}>
            아직 주고받은 목소리가 없어요
          </div>
        ) : (
          thread.map((m) => {
            const mine = m.dir === "out";
            const pk = `fam-${m.id}`;
            const playing = player?.playing === pk;
            const c = mine ? TONE.purple : tn;
            const fresh = !mine && !m.played;
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                <span className="flex items-center gap-1 text-[14px] font-bold" style={{ color: "#5E6270" }}>
                  {fresh && <span className="ds-dot" aria-hidden="true" style={{ width: 8, height: 8 }} />}
                  {mine ? m.text : v.name} · {isToday(m.at) ? "" : `${spokenDay(m.at)} `}
                  {spokenTime(m.at)}
                </span>
                {/* 듣기 — 말풍선 자체가 듣기 버튼. 듣는 중에 다시 누르면 멈춘다. 보낸 것은 녹음이 있을 때만 */}
                <button
                  type="button"
                  onClick={() => onPlay(m)}
                  disabled={mine && !m.clip}
                  aria-pressed={playing}
                  aria-label={`${mine ? "내가 보낸 목소리" : `${v.name}의 목소리`}${fresh ? " · 새 목소리" : ""} · ${playing ? "멈추기" : m.played || mine ? "다시 듣기" : "듣기"}`}
                  className="ds-press flex h-[60px] w-[80%] items-center gap-2.5 px-3.5 disabled:cursor-default"
                  style={{ background: mine ? TONE.purple.bg : tn.bg, boxShadow: `0 3px 0 ${c.sh}`, borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px" }}
                >
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full text-white" style={{ background: c.solid }}>
                    <Line name={playing ? "pause" : player?.busy === pk ? "clock" : "play"} size={playing ? 15 : 17} />
                  </span>
                  <Wave heights={[10, 20, 14, 24, 16, 12, 22, 14]} color={c.solid} on={playing} h={28} />
                  <span className="ds-num flex-none text-[15px] font-extrabold" style={{ color: c.solid }}>
                    {clock(m.sec || 0)}
                  </span>
                </button>
                {m.text && !mine && <p className="max-w-[86%] text-[16px] leading-[1.5]">{m.text}</p>}
              </div>
            );
          })
        )}
        {player?.failed && thread.some((m) => `fam-${m.id}` === player.failed.key) && (
          <p role="alert" className="text-[16px] font-bold leading-[1.5]" style={{ color: TONE.gold.fg }}>
            {playErrorText(player.failed.code)}
          </p>
        )}
      </R>

      <R d={130} className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => (on ? finish(v) : start(v))}
          disabled={busy || (on && recorder.phase !== "rec")}
          aria-label={on ? `${v.name}에게 보내기` : `${v.name}에게 목소리 남기기`}
          className="ds-press ds-btn3d flex min-h-[84px] w-full items-center gap-3.5 rounded-[26px] px-[18px] text-left disabled:opacity-70"
          style={on ? { background: TONE.gold.bg, boxShadow: `0 5px 0 ${TONE.gold.sh}` } : soft("purple")}
        >
          {on && recorder.phase === "rec" ? (
            <>
              <span className="ds-recdot" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-[20px]" style={{ color: TONE.gold.fg }}>
                  녹음하고 있어요 <span className="ds-num">{clock(recorder.secs)}</span>
                </span>
                <span className="block text-[15px] font-medium" style={{ color: TONE.gold.sub }}>
                  한 번 더 누르면 보내요
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="ds-ico flex h-14 w-14 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.solid }}>
                <Line name="mic" size={26} />
              </span>
              <span className="text-[20px] leading-[1.35]" style={{ color: TONE.purple.fg }}>
                {busy ? (
                  "보내는 중입니다"
                ) : on ? (
                  "마이크를 켜고 있습니다"
                ) : (
                  <>
                    {v.name}에게
                    <br />
                    목소리 남기기
                  </>
                )}
              </span>
            </>
          )}
        </button>
        {on && recorder.phase === "rec" && (
          <button
            type="button"
            onClick={() => {
              recorder.cancel();
              setRecId(null);
            }}
            className="min-h-[48px] w-full text-[17px] font-bold underline underline-offset-4"
            style={{ color: "#5E6270" }}
          >
            그만두기
          </button>
        )}
        {prob && (
          <div>
            <p role="alert" className="text-[17px] font-bold leading-[1.5]" style={{ color: TONE.gold.fg }}>
              {prob.text}
            </p>
            {prob.retry && lastOut.current?.id === v.id && (
              <Btn tone="green" h={56} className="mt-2 w-full text-[19px]" onClick={() => deliver(v.id, lastOut.current.out)}>
                다시 보내기
              </Btn>
            )}
          </div>
        )}
      </R>
    </>
  );
}

// 복지혜택 시트 — 해주세요 '복지 혜택' 타일 (2026-09-04 시트 앱 전체 3번).
// 어르신에게는 등급·점수·정책 ID 대신 두 마디만: "받으실 수 있어요" · "확인이 필요해요".
// 목록은 여섯 개까지만 — 나머지는 선생님이 방문 때 설명한다. 신청은 어르신이 직접 하지 않는다.
function ElderWelfareSheet({ matches, counts, asked, onAsk, onClose }) {
  const high = matches.filter((m) => m.verdict === VERDICT.high);
  const check = matches.filter((m) => m.verdict === VERDICT.check);
  const show = [...high, ...check].slice(0, 6);
  return (
    <Sheet onClose={onClose} label="복지 혜택">
      <SheetTitle sub="나라에서 받으실 수 있는 것" title={counts.high > 0 ? `받으실 수 있는 것 ${counts.high}가지` : `확인이 필요한 것 ${counts.check}가지`} />
      {counts.high > 0 && counts.check > 0 && (
        <p className="-mt-1 text-[16px]" style={{ color: "#5E6270" }}>
          확인이 필요한 것 {counts.check}가지도 있어요
        </p>
      )}
      {show.map((m) => {
        const ok = m.verdict === VERDICT.high;
        return (
          <Card key={m.policy.id} r={18} pad={14} style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
            {/* 제목은 한 줄을 다 쓰고 배지는 그 아래 — 옆에 붙이면 360px 에서 제목이 세 줄로 꺾였다 (QA 실측) */}
            <b className="block text-[18px] font-extrabold leading-[1.35]">{m.policy.name}</b>
            <Pill bg={ok ? TONE.green.bg : TONE.gold.bg} fg={ok ? "#2A4D33" : TONE.gold.fg} className="mt-1.5">
              {ok ? "받으실 수 있어요" : "확인이 필요해요"}
            </Pill>
            <p className="mt-1 text-[16px] leading-[1.5]">{m.policy.summary}</p>
            <p className="mt-0.5 text-[15px] leading-[1.45]" style={{ color: "#5E6270" }}>
              {m.policy.value}
            </p>
          </Card>
        );
      })}
      <p className="text-[16px] leading-[1.5]" style={{ color: "#5E6270" }}>
        신청은 선생님과 가족이 도와드립니다. 무료 회원도 같습니다.
      </p>
      {asked ? (
        <div className="rounded-[18px] py-4 text-center text-[18px] font-extrabold" style={{ background: TONE.green.bg, color: "#2A4D33" }}>
          ✓ 선생님에게 부탁했습니다
        </div>
      ) : (
        <Btn tone="navy" h={66} r={22} px={5} className="text-[19px]" onClick={onAsk}>
          선생님이 알려 드려요 · 부탁하기
        </Btn>
      )}
      <WhiteBtn className="text-[18px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

// 해주세요 상세 시트 — 타일을 누르면 열린다. 무엇이 얼마인지가 첫 정보다.
// 보내면 시트 안에서 바로 "부탁했어요"로 바뀐다 — 화면 이동 없이 결과를 확인한다.
// 2026-10-14 현장 요청 6번: 날짜 · 시간은 달력에서 고른다 (components/ElderDateTime.jsx) — 담당 컨시어지 승인 화면의 기본값이 된다.
// 응급 상황 대응(no12)은 예약서가 아니다 — 1시간당 요금과 설명, '관제와 통화하기' 하나만 둔다 (같은 요청 7번).
const isHospitalItem = (item) => /병원|진료|검진/.test(`${item?.name || ""} ${item?.scope || ""}`);

// 부탁한 날짜 바꾸기 (2026-10-18) — 달력에서 다시 고른다. 바꾼 날짜는 담당 선생님 승인 화면의 기본값이 된다
function ElderReqDateSheet({ req, onClose, onSave }) {
  const [when, setWhen] = useState({ ymd: preferredYmd(req), hm: req.preferredTime || null });
  const open = canEditRequest(req);
  const changed = when.ymd !== preferredYmd(req) || when.hm !== (req.preferredTime || null);
  const ready = open && !!when.ymd && !!when.hm && changed;
  return (
    <Sheet onClose={onClose} label={`${req.type} 날짜 바꾸기`}>
      <SheetTitle sub="날짜 바꾸기" title={req.type} />
      {open ? (
        <>
          <p className="text-[17px] leading-[1.5]" style={{ color: "#5E6270" }}>
            지금 희망: <b style={{ color: "#1B2340" }}>{req.preferredWhen || preferredYmd(req)}</b>
          </p>
          <ElderDateTime ymd={when.ymd} hm={when.hm} onChange={setWhen} title="언제로 바꿀까요?" />
          <Btn
            tone="navy"
            h={62}
            r={20}
            disabled={!ready}
            className="text-[19px]"
            style={ready ? undefined : { background: "#D8D3C7", boxShadow: "0 4px 0 #C4BEB1", color: "#5E5A52" }}
            onClick={() => ready && onSave(req, when.ymd, when.hm)}
          >
            {ready ? "이 날짜로 바꾸기" : "바꿀 날짜 · 시간을 골라 주세요"}
          </Btn>
        </>
      ) : (
        <p className="rounded-[18px] p-4 text-[18px] font-extrabold leading-[1.5]" style={{ background: TONE.green.bg, color: "#2A4D33" }}>
          선생님이 이미 날짜를 정했어요. 바꾸시려면 취소하고 다시 부탁해 주세요.
        </p>
      )}
      <WhiteBtn className="text-[18px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

function ElderAskSheet({ item, plan, sent, approver, onAsk, onCallOps, onClose, hospitals = [] }) {
  const off = !item.active;
  const emergency = item.no === 12;
  // 날짜 · 시간 — 사람이 가는 서비스만 고른다 (공사맨 견적 · 가전 렌탈은 알아본 뒤 선생님이 연락)
  const askWhen = item.askWhen !== false;
  const [when, setWhen] = useState({ ymd: null, hm: null });
  const askHospital = isHospitalItem(item);
  const hospitalOpts = [...hospitals.slice(0, 3), "선생님과 통화해서 정하기"];
  const [hospital, setHospital] = useState(hospitalOpts[hospitalOpts.length - 1]);
  const ready = !askWhen || (!!when.ymd && !!when.hm);
  const price = item.amount === 0 ? "비용 없음" : item.amount == null ? "요금 확인 후 안내" : fmtWon(item.amount);
  return (
    <Sheet onClose={onClose} label={item.name}>
      {sent?.mode === "callOps" ? (
        <div className="ds-swap flex flex-col items-center gap-3 py-2 text-center">
          <span className="ds-pop flex h-[84px] w-[84px] items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
            <Line name="phone" size={40} />
          </span>
          <p className="text-[26px] font-black leading-[1.35]" style={{ color: "#2A4D33" }}>
            관제센터에서
            <br />
            전화드릴게요
          </p>
          <p className="text-[17px] leading-[1.5]" style={{ color: "#3B5A44" }}>
            {sent.already ? "이미 관제에 알려 두었습니다. " : ""}전화를 받으실 수 있게 곁에 두세요.
          </p>
          <Btn tone="navy" h={60} r={20} className="mt-1 w-full text-[19px]" onClick={onClose}>
            확인
          </Btn>
        </div>
      ) : sent ? (
        <div className="ds-swap flex flex-col items-center gap-3 py-2 text-center">
          <span className="ds-pop flex h-[84px] w-[84px] items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
            <Line name="check" size={44} />
          </span>
          <div className="text-[24px] font-black" style={{ color: "#2A4D33" }}>
            {sent.mode === "approval" ? `${approver} 님께 부탁했어요` : "부탁했어요"}
          </div>
          <div className="text-[19px] font-extrabold">{sent.name}</div>
          {sent.when && (
            <div className="text-[17px] font-bold" style={{ color: TONE.beige.fg }}>
              희망 {sent.when}
            </div>
          )}
          <div className="text-[17px] leading-[1.5]" style={{ color: "#3B5A44" }}>
            {sent.mode === "approval"
              ? `${approver} 님이 결제하면 선생님이 일정을 정해 드립니다.`
              : sent.when
                ? "선생님이 일정을 보고 확정해 드립니다."
                : "선생님이 알아보고 연락드립니다."}
          </div>
          <Btn tone="navy" h={60} r={20} className="mt-1 w-full text-[19px]" onClick={onClose}>
            확인
          </Btn>
        </div>
      ) : (
        <>
          <SheetTitle sub="해주세요" title={item.name} />
          {emergency && item.rates ? (
            <div className="rounded-[18px] px-4 py-3" style={{ background: TONE.danger.bg }}>
              {/* 한 줄에 한 요금 — 두 요금을 한 줄에 두면 좁은 폰에서 '야간 / 50,000원'으로 꺾였다 */}
              {item.rates.map((r) => (
                <div key={r.when} className="flex items-baseline justify-between gap-3 py-[3px]">
                  <span className="text-[17px]" style={{ color: TONE.danger.fg }}>
                    {r.when}
                  </span>
                  <span className="ds-num flex-none text-[18px] font-extrabold" style={{ color: TONE.danger.fg }}>
                    {fmtWon(r.amount)}
                  </span>
                </div>
              ))}
              <p className="mt-1.5 border-t pt-1.5 text-[16px] font-extrabold" style={{ color: TONE.danger.fg, borderColor: "rgba(154,52,36,.2)" }}>
                모두 1시간당 요금입니다
              </p>
            </div>
          ) : (
            <div className="text-[17px] font-bold leading-[1.5]" style={{ color: TONE.purple.fg }}>
              {off ? "곧 시작합니다" : item.priceLabel}
            </div>
          )}
          <p className="text-[17px] leading-[1.6]">{item.scope}</p>
          {item.point && (
            <p className="-mt-1.5 text-[16px] leading-[1.55]" style={{ color: "#5E6270" }}>
              {item.point}
            </p>
          )}
          {item.note && (
            <p className="-mt-1.5 text-[16px] leading-[1.55]" style={{ color: "#5E6270" }}>
              {item.note}
            </p>
          )}
          {off ? (
            <>
              <p className="rounded-[18px] p-4 text-[18px] font-extrabold leading-[1.5]" style={{ background: TONE.gold.bg, color: TONE.gold.fg }}>
                준비하고 있습니다. 시작하면 알려드립니다.
              </p>
              <Btn tone="navy" h={64} r={22} className="text-[20px]" onClick={onClose}>
                알겠어요
              </Btn>
            </>
          ) : emergency ? (
            <>
              {/* 응급 — 날짜 · 병원을 고르지 않는다. 관제가 먼저 전화해 상황을 듣고 응급동행자를 보낸다 */}
              <Btn tone="danger" h={66} r={22} px={5} className="text-[20px]" onClick={onCallOps}>
                <Line name="phone" size={24} />
                관제와 통화하기
              </Btn>
              <p className="-mt-1.5 text-center text-[16px] leading-[1.5]" style={{ color: "#5E6270" }}>
                누르면 관제센터에서 전화를 드립니다.
              </p>
              <WhiteBtn className="text-[18px]" onClick={onClose}>
                닫기
              </WhiteBtn>
            </>
          ) : (
            <>
              {askWhen && <ElderDateTime ymd={when.ymd} hm={when.hm} onChange={setWhen} title="언제가 좋으세요?" />}
              {askHospital && (
                <>
                  <div className="text-[19px] font-extrabold">어느 병원이세요?</div>
                  <div className="grid gap-2" role="group" aria-label="어느 병원이세요">
                    {hospitalOpts.map((o) => (
                      <Pick key={o} on={hospital === o} onClick={() => setHospital(o)} className="px-3">
                        {o}
                      </Pick>
                    ))}
                  </div>
                </>
              )}
              <p className="rounded-[18px] p-4 text-[17px] font-extrabold leading-[1.5]" style={plan.approval ? { background: TONE.gold.bg, color: TONE.gold.fg } : { background: TONE.green.bg, color: "#2A4D33" }}>
                {plan.notice}
              </p>
              <div className="flex items-center gap-2.5">
                <span className="ds-num flex-none text-[20px] font-black">{price}</span>
                <Btn
                  tone="navy"
                  h={62}
                  r={20}
                  disabled={!ready}
                  className="flex-1 text-[19px]"
                  style={ready ? undefined : { background: "#D8D3C7", boxShadow: "0 4px 0 #C4BEB1", color: "#5E5A52" }}
                  onClick={() => ready && onAsk({ ymd: askWhen ? when.ymd : null, hm: askWhen ? when.hm : null, hospital: askHospital && hospital !== hospitalOpts[hospitalOpts.length - 1] ? hospital : null })}
                >
                  {ready ? plan.cta : "날짜와 시간을 골라 주세요"}
                </Btn>
              </div>
              <WhiteBtn className="text-[18px]" onClick={onClose}>
                닫기
              </WhiteBtn>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

// SOS — REQ-06 확정: 5초 취소 카운트다운 → 자동 접수.
// 2026-08-12 시트로 화면 안 트리거 버튼은 없앴다. 이제 진입점은 바탕화면 바로가기(/elder?sos=1) 하나뿐이라,
// 이 컴포넌트는 취소 유예 화면과 접수 화면만 그린다. 빨강은 여기서 쓴다 — 위험 신호다.
function SosButton({ phase, setPhase, onDispatch, dispatched = false }) {
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

  if (phase === "confirm")
    return (
      <div className="ds-overlay ds-app" style={{ background: "#FBE5E0" }} role="dialog" aria-modal="true" aria-label="도움 요청 보내는 중">
        <div className="mt-8 text-[30px] font-black leading-[1.4]" style={{ color: "#6E2216" }}>
          도움 요청을
          <br />
          보내는 중입니다
        </div>
        <span className="relative my-4 block h-[124px] w-[124px]" aria-hidden="true">
          <span className="ds-ring absolute inset-0 rounded-full" style={{ background: "#C0392B" }} />
          <span className="absolute inset-0 flex items-center justify-center rounded-full text-[52px] font-black text-white" style={{ background: "#C0392B" }}>
            {count}
          </span>
        </span>
        <p className="text-[20px] leading-[1.6]" style={{ color: "#7A4A40" }}>
          잘못 눌렀다면 아래 버튼을
          <br />
          눌러 취소하세요
        </p>
        <WhiteBtn
          h={78}
          r={24}
          sh="#E8CFC8"
          color="#6E2216"
          className="mt-auto w-full max-w-[400px] text-[24px] font-black"
          onClick={() => {
            clearInterval(countTimer.current);
            setPhase("idle");
          }}
        >
          취소합니다
        </WhiteBtn>
      </div>
    );
  if (phase === "sent")
    return (
      <div className="ds-overlay ds-app" style={{ background: "#1B2340" }} role="dialog" aria-modal="true" aria-label="도움 요청 접수">
        <span className="ds-pop mt-10 flex h-[110px] w-[110px] items-center justify-center rounded-full text-white" style={{ background: "#3B6B47" }}>
          <Line name="check" size={56} />
        </span>
        {/* 관제가 급파를 지시하기 전에는 '오고 있다'고 하지 않는다 — 아직 아무도 출발하지 않았다 (2026-10-02 QA) */}
        <div className="mt-4 text-[30px] font-black leading-[1.45] text-white">
          {dispatched ? (
            <>
              선생님이
              <br />
              오고 있습니다
            </>
          ) : (
            <>
              관제센터가
              <br />
              확인하고 있습니다
            </>
          )}
        </div>
        <p className="text-[20px] leading-[1.65]" style={{ color: "#C9CFDB" }}>
          {dispatched ? "가족에게도 알렸습니다." : "곧 전화를 드립니다. 가족에게도 알렸습니다."}
          <br />
          편한 자세로 기다리세요.
        </p>
        <Btn tone="gold" h={70} r={22} className="mt-auto w-full max-w-[400px] text-[22px]" onClick={() => setPhase("idle")}>
          화면 닫기
        </Btn>
      </div>
    );
  return null;
}

// 테스트 계정은 자기 역할 화면만 — 다른 역할이면 안내를 띄운다 (components/RoleGate.jsx)
export default function ElderHomeGated() {
  return (
    <RoleGate role="elder" title="어르신">
      <ElderHome />
    </RoleGate>
  );
}
