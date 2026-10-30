import ModeLink from "../components/ModeLink";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, SectionLabel, Badge } from "../components/ui";
import Icon from "../components/icons";
import VisitFlow from "../components/VisitFlow";
import {
  AI_REPORT,
  ELDER,
  OUTING,
  elderWho,
} from "../lib/mock";
import { extraPayees } from "../lib/membership";
import WelfareList from "../components/WelfareList";
import { matchWelfare, profileFor, welfareCounts } from "../lib/welfare";
import {
  AI_BRIEFING,
  CARE_SUGGESTIONS,
  EARNINGS,
  ELDER_PREFS,
  GROWTH_QUESTS,
  KIT_DOCS,
  RECOVERY_STEPS,
  THANKS_FEED,
  TODAY_DETAIL,
  VOICE_TYPES,
  WELFARE_ITEMS,
  PAIR_TODAY,
  TODAY_ROUTE,
  VIDEO_MODES,
  MY_CLIENTS,
  VIDEO_POLICY,
  VIDEO_SEGMENTS,
  CALL_CHECKS,
  CONCIERGE_CAL,
  CONCIERGE_JOB_KINDS,
  CONCIERGE_URGENT,
  OPS_MESSAGE_PRESETS,
} from "../lib/console";
import Mailbox from "../components/Mailbox";
import { useMailbox } from "../lib/mailbox";
import {
  NowCard,
  TodayHeader,
  TodaySchedule,
  UrgentBanner,
  UrgentSheet,
  WrapUp,
  useToday,
} from "../components/ConciergeToday";
import { checkupFor, headlineFor, isMeet, visitText } from "../lib/checkup";
import { requiredFor } from "../lib/ops-mgmt";
import { MEET_DEMO, RESULT_TONE, VISIT_GRADES, meetPeriod } from "../lib/visit-report";
import { STORE_CATALOG } from "../lib/store";
import { SERVICE_MENU, crewOf, daysUntil, isVisitCall, kstYmd } from "../lib/requests";
import { INITIAL_EVENTS } from "../lib/seed";
import { CONCIERGES } from "../lib/ops-admin";
import ConciergeRequests, { ExtraPaidNotice, NewRequestAlert, newRequestsFor } from "../components/ConciergeRequests";
import { svcTitle } from "../lib/booking";
import { HelpCallCard, HelpCallPopup } from "../components/HelpCall";
import { LIVE_TAG, visitReportOf } from "../lib/live-household";
import { conciergeChoices, elderNameOf, inCenter, meAs, people } from "../lib/people";
import { eventOwner } from "../lib/event-rights";
import { fmtWon } from "../lib/config";
import { josa } from "../lib/tracks";
import { eventsFor, useAppState, visitLock } from "../lib/state";
import { useToast } from "../components/ds";
import { HomeTextCards, MeetForm, ModePicker, ReportPreview, SendRow } from "../components/ConciergeReport";
import { ApptCard, AsksCard, BriefingCard, ClientHead, ClientList, HealthCard, PrefCard, SharedScheduleCard, clientSub } from "../components/ClientDetail";
import { askLines, asksOf, isOpenAsk } from "../lib/elder-asks";
import { partnerHospitals } from "../lib/hospitals";
import { ReqNowCard } from "../components/ReqNowCard";
import { videoConsentOf } from "../lib/consent";
import { useAuth } from "../lib/auth";
import { healthOf, supplementSlotNote } from "../lib/meds";
import { HealthEditor } from "../components/HealthInfo";
import Splash from "../components/Splash";
import { LIVE_ELDER, liveCustomer, telHref } from "../lib/ops-health";
import { ringAlarm } from "../lib/alarm";
import RoleGate from "../components/RoleGate";

// 컨시어지 앱 — REQ-09(동선·주소 게이팅) · REQ-11(관찰 리포트). REQ-10(케어박스)은 2026-10-02 운영 결정으로 뺐다.
// · REQ-12(감사 타임라인·영상) + 디자인 콘솔 정합 (오늘·리포트·제안·정산 4탭).
// 절대 규칙(원칙 유지): 평가·보상에 판매액 없음 (업셀링 인센티브 → 케어 품질 인센티브로 대체)
// · 의료 측정값 입력 없음 · 소견/진단 기재 금지 · 1인 진입 금지(2인 체크인) · 제안은 근거 동반.

// 탭은 컨시어지의 하루 순서다 — 출근해서 오늘 볼 것 → 방문 전 고객 파악 →
// 현장에서 누르는 것 → 끝나고 쓰는 리포트 → 발견한 것 제안.
// 3개였을 때는 오늘 3.8화면 · 리포트 3.7화면이 몰려 있었고 GNB 는 휑했다.
// 방문과 리포트를 한 탭으로 합쳤다 (2026-08-21 시트 컨시어지 전체 1번).
// 한 번의 방문에서 수행과 리포트 작성이 이어지는데 탭이 갈려 있으면 오가야 했다.
// 2026-09-22 강도완 요청: 마음사서함을 고객과 방문·리포트 사이에 새로 만든다.
// 담당 고객과 하루의 안부를 음성으로 주고받는 자리 — 어르신 화면 마음사서함의 짝이다.
const TABS = [
  { key: "today", label: "오늘", icon: "home" },
  { key: "client", label: "고객", icon: "user" },
  { key: "mailbox", label: "마음사서함", icon: "chat" },
  { key: "visit", label: "방문 · 리포트", icon: "door" },
  { key: "suggest", label: "제안", icon: "diamond" },
  // 정산 탭은 숨겼다 (2026-08-12 실무진 "내용 숨기기") — 수익 정보가 시연 화면에
  // 노출되면 곤란하다는 판단. 코드는 남겨 두고 메뉴에서만 뺀다.
  // { key: "pay", label: "정산", icon: "coin" },
];

// 일정 달력 — 취소된 건은 회색으로 그날 칸에 남는다 (빨강은 위험 신호 전용 · 2026-10-28 요청 7)
const CANCELLED_JOB = { label: "취소됨", color: "#8A877F" };
// 데모 씨앗 일정 — 예시 달력(CONCIERGE_CAL)이 같은 건(오늘 동행 · 사흘 뒤 방문)을 이미 그린다
const SEED_EVENT_IDS = new Set(INITIAL_EVENTS.map((e) => e.id));

function ConciergePage() {
  const { state, dispatch } = useAppState();
  const authUser = useAuth().user;
  const live = !!authUser?.household; // 테스트 계정 — 가구 기록에 실제로 남는다
  const [tab, setTab] = useState("today");
  // 탭을 바꾸면 맨 위부터 — 전에는 앞 탭의 스크롤 위치에 머물러 새 탭의 중간이 보였다 (2026-10-19 점검 C-14).
  // 이 화면은 본문이 아니라 문서 전체가 스크롤된다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);
  const [healthEdit, setHealthEdit] = useState(false); // 고객 탭 건강 정보 수정
  const [calOpen, setCalOpen] = useState(false); // 오늘 탭 일정 달력
  const [calShift, setCalShift] = useState(0); // 일정 달력에서 보는 달 — 이번 달에서 몇 달 (10월 말에 잡은 11월 일정을 넘겨서 본다)
  const [calDay, setCalDay] = useState(null); // 달력에서 고른 날 — 시트로 뜬다
  const [calJob, setCalJob] = useState(null); // 시트에서 펼친 건 (고객 이름 → 디테일)
  const [callDone, setCallDone] = useState({}); // 확인전화 체크 (id-단계)
  const [opsMsgOpen, setOpsMsgOpen] = useState(false); // 관제에 알리기 시트
  // 동행 리포트 — 컨시어지가 직접 쓰는 칸 (시트 레포트 1·2번)
  // 저장하면 가구 기록(state.escort)에 남고, 그 뒤로는 저장한 값을 보여 준다 — 새로고침해도 남고 보호자 마이 '동행 리포트'로 간다 (2026-10-02).
  // 전에는 저장 버튼이 없는 동작(visitPatch)을 보내서 아무 데도 남지 않았다.
  const escort = state.escort || {};
  const escortSaved = !!escort.savedAt;
  const [escortDraft, setEscortNote] = useState("");
  const [escortPhotoDraft, setEscortPhotos] = useState([]);
  const [escortRecDraft, setEscortRecorded] = useState(false);
  // 저장한 동행 기록도 리포트를 내기 전(관제 반려로 돌아온 때 포함)에는 '고치기'로 다시 연다 — 보낸 뒤에는 증명이라 잠근다 (2026-10-18)
  const [escortEditing, setEscortEditing] = useState(false);
  const escortShowSaved = escortSaved && !escortEditing;
  const escortNote = escortShowSaved ? escort.note || "" : escortDraft;
  const escortPhotos = escortShowSaved ? Array.from({ length: escort.photos || 0 }, (_, i) => `동행사진_${i + 1}.jpg`) : escortPhotoDraft;
  const escortRecorded = escortShowSaved ? !!escort.recorded : escortRecDraft;
  const startEscortEdit = () => {
    setEscortNote(escort.note || "");
    setEscortPhotos(Array.from({ length: escort.photos || 0 }, (_, i) => `동행사진_${i + 1}.jpg`));
    setEscortRecorded(!!escort.recorded);
    setEscortEditing(true);
  };
  const [shopSel, setShopSel] = useState({});
  const [shopCat, setShopCat] = useState("safety"); // 제안 탭 스토어 분류 — 생활안전용품 하나 (lib/store.js)
  // 수락을 기다리는 내 제안 — 같은 서비스를 두 번 보내지 않게. 화면 기억이 아니라 요청에서 읽는다
  // (새로고침하면 또 보낼 수 있었고, 철회해도 다시 보낼 수 없었다 · 2026-10-18)
  const pendingProposals = new Set((state.requests || []).filter((r) => r.dir === "fromConcierge" && ["requested", "awaitingPayment"].includes(r.status)).map((r) => r.type));
  const [shopSent, setShopSent] = useState(false);
  const [apptDone, setApptDone] = useState(false);
  const [apptEscort, setApptEscort] = useState(true); // 다음 진료에 컨시어지 동행 여부
  // 다음 진료 디테일 (2026-08-21 시트 전체 3번) — 병원에서 들은 그대로 적는다
  const [apptDept, setApptDept] = useState("정형외과 재진");
  const [apptHosp, setApptHosp] = useState("분당서울대병원");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("09:30");
  const [apptMemo, setApptMemo] = useState("");
  const [reqText, setReqText] = useState(""); // 컨시어지 요청 본문
  // 제안 받을 사람 · 제안 일정 — 승인 대상은 컨시어지가 정한다 (2026-10-05). 내 일정에 맞춰 날짜를 제안한다.
  // 센터 공간에서 컨시어지가 여럿이면 로그인한 사람 이름으로 남긴다 (2026-10-06 점검)
  const ME = meAs(authUser, "concierge");
  const [propTo, setPropTo] = useState("guardian");
  const [propDate, setPropDate] = useState(() => kstYmd(Date.now() + 3 * 86400000));
  const [propTime, setPropTime] = useState("14:00");
  // 2인 1조 서비스 제안의 짝 — 수락되면 바로 확정되므로 보낼 때 정한다 (2026-10-19 점검 C-06 · 단독 배차 0)
  const [propPartner, setPropPartner] = useState("");
  const propMates = conciergeChoices(CONCIERGES).filter((n) => n && n !== ME);
  const propLabel = propTo === "elder" ? "어르신" : "보호자";
  const withProposal = (p) => {
    const at = Date.now();
    return {
      ...p,
      dir: "fromConcierge",
      assignee: ME,
      approver: propTo,
      scheduledDate: propDate || null,
      scheduledTime: propDate ? propTime : "",
      status: "requested",
      history: [{ at, status: "requested", note: `${p.history?.[0]?.note || "컨시어지 제안"} · ${propLabel} 수락 대기${propDate ? ` · 제안 일정 ${propDate} ${propTime}` : ""}` }],
    };
  };
  const [reqSent, setReqSent] = useState(false);
  const [pairCalled, setPairCalled] = useState(false);
  // 관제 급파 수락 — 가구 기록(ops.sosAcceptedAt)에 남겨 관제 SOS 대응과 컨시어지 관리가 같은 시각을 본다 (2026-10-02)
  const sosAck = !!state.ops.sosAcceptedAt;
  // 관제가 급파를 지시한 사람이 나인가 — 컨시어지가 둘 이상인 센터에서 지시받지 않은 사람도 '급파 수락'이 떠
  // 먼저 누른 사람이 남의 출동을 수락하던 것을 막는다 (2026-10-26 점검). 받는 사람이 비어 있는 예전 기록은 모두에게
  const sosForMe = !state.ops.sosDispatchedTo || state.ops.sosDispatchedTo === ME;
  // 관제에 알리기 — 가구 기록(opsMessages)에 남겨 관제가 확인 · 답할 수 있게 (2026-10-02). 알림판에도 한 줄.
  const [opsMsgText, setOpsMsgText] = useState("");
  const opsMsgs = (state.opsMessages || []).filter((m) => m.role === "concierge");
  const hm = (t) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const sendOpsMsg = (text) => {
    if (!text) return;
    dispatch({ type: "addOpsMessage", payload: { from: `컨시어지 ${ME}`, role: "concierge", text } });
    push("관제 연락", `컨시어지 ${ME} — ${text}`, "#8FA9CC");
    setOpsMsgText("");
  };
  // 어르신 SOS — 시각 · 어르신 번호(테스트 가구는 가입 상담에서 받은 번호) · 알림음 (2026-10-02)
  const sosTime = state.demo.sos && state.demo.sosAt
    ? new Date(state.demo.sosAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;
  const elderTel = telHref(liveCustomer(LIVE_ELDER, state.onboarding, state.health).phone);
  const rangFor = useRef("");
  useEffect(() => {
    if (!state.demo.sos) return;
    const key = `${state.demo.sosAt || "on"}:${state.ops.sosDispatched && sosForMe ? "dispatched" : "new"}`;
    if (rangFor.current === key) return;
    rangFor.current = key;
    ringAlarm();
  }, [state.demo.sos, state.demo.sosAt, state.ops.sosDispatched, sosForMe]);
  const [voiceMood, setVoiceMood] = useState(null); // 현장의 소리 — 마음 체크인
  const [voiceType, setVoiceType] = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [voiceAnon, setVoiceAnon] = useState(true);
  const [voiceSent, setVoiceSent] = useState(false);
  const [eapBooked, setEapBooked] = useState(false); // 심리상담 예약 — 감사 로그에 남기지 않는다
  const [detailDone, setDetailDone] = useState(false); // 오늘의 한 끗 완료
  // 리포트를 냈는지 — 가구 기록(visit.reportSent)에서 본다. 화면 안에서만 기억하면 새로고침 뒤 같은 리포트를 또 보낸다.
  const aiSent = !!state.visit.reportSent;
  // 리포트 잠금 (2026-10-18) — 제출하면 점검표를 고칠 수 없다. 관제 반려로 돌아오면 다시 열리고, 보호자에게 발송되면 영구 잠금 (증명)
  const lock = visitLock(state.visit);
  const returned = !lock && state.visit.returned ? state.visit.returned : null;
  const [nextAsk, setNextAsk] = useState(false); // '다음 방문 기록 시작' 한 번 더 묻기
  const [pdfIssued, setPdfIssued] = useState(false);
  const [suggested, setSuggested] = useState({});
  const [earlyPay, setEarlyPay] = useState(false);
  // 거주 형태 토글 — 기본값은 가입 때 저장한 값 (DB: care_location_type · 실무자 피드백)
  // 현장에서 바꾸면 가구 기록(visit.loc)에 남겨 관제 방문관리 · 보호자 리포트가 같은 21항목을 본다 (2026-10-02 코드 점검)
  const careLoc = state.visit.loc || state.onboarding?.careLocation || "home";
  const setCareLoc = (k) => {
    if (k !== careLoc) dispatch({ type: "visitLoc", loc: k });
  };
  // 21항목 점검 · 항목 메모 · 총평 · 사진 수는 가구 기록(state.visit)에 둔다 — 관제 방문관리가 같은 값을 보고,
  // 새로고침해도 남는다 (2026-10-02). 메모는 쓰는 동안은 이 화면에만 두고, 칸을 벗어날 때 한 번 보낸다.
  const checkDone = state.visit.checks || {}; // 21항목 체크 — {"몸-혈압": {at}}
  // 필수 점검 — 관제 방문관리와 같은 기준 (lib/ops-mgmt requiredFor). 빠지면 관제가 검수 승인을 못 한다
  const doneNamesHere = new Set(Object.keys(checkDone).map((k) => k.slice(k.indexOf("-") + 1)));
  const requiredNames = new Set(requiredFor(state.visit.loc || state.onboarding?.careLocation || "home"));
  const missingRequired = [...requiredNames].filter((k) => !doneNamesHere.has(k));
  // 제출 조건 — 필수 점검을 다 채우고, 보호자에게 갈 글(총평 · 동행 기록)이 있어야 한다. 전에는 0/21 · 총평 없이도 제출돼
  // 관제는 승인할 수 없고 반려만 오갔다 (2026-10-19 점검 C-01). 데모는 예시 초안이 총평이 된다
  const hasSummary = !!(escort.savedAt ? escort.note : live ? state.visit.memo : "예시 초안")?.trim?.();
  // 동행만 한 날 — 방문 점검을 하나도 하지 않고 동행 기록만 저장했으면 동행 기록만 제출한다. 관제가 '동행 리포트 발송'으로
  // 따로 보낸다(방문 리포트 검수 승인은 잠긴 채). 점검을 시작한 방문은 필수를 다 채워야 한다
  // 미팅 리포트(2026-10-24 설계서 v3 §3-4)는 점검표 · 필수가 없어 '동행만 한 날'로 읽지 않는다
  const meetMode = isMeet(careLoc);
  const escortOnly = !meetMode && doneNamesHere.size === 0 && escortSaved && !!escort.note?.trim();
  // 미팅 리포트 — 테스트 가구는 총평이 있어야 낸다 (보호자 리포트 맨 위 글 · 위 C-01과 같은 기준). 데모는 목업처럼 바로 낼 수 있다
  const meetReady = !live || !!state.visit.memo?.trim();
  const canSubmitReport = meetMode ? meetReady : escortOnly || (missingRequired.length === 0 && hasSummary);
  const [openItem, setOpenItem] = useState(null); // 항목별 내용 입력 열림
  const [itemDraft, setItemDraft] = useState({}); // 쓰는 중인 항목 메모
  const itemNote = { ...(state.visit.notes || {}), ...itemDraft };
  const saveItemNote = (key) => {
    if (!(key in itemDraft)) return;
    if ((itemDraft[key] || "") !== ((state.visit.notes || {})[key] || "")) dispatch({ type: "visitNote", key, text: itemDraft[key] });
    setItemDraft(({ [key]: _, ...rest }) => rest);
  };
  const [summaryDraft, setSummaryDraft] = useState(null); // 쓰는 중인 총평
  const summaryNote = summaryDraft ?? state.visit.memo ?? "";
  const saveSummary = () => {
    if (summaryDraft == null) return;
    if (summaryDraft !== (state.visit.memo || "")) dispatch({ type: "visitNote", text: summaryDraft });
    setSummaryDraft(null);
  };
  // 쓰다 만 메모 · 총평 — 칸을 벗어나지 않고 탭을 바꾸거나 앱을 내려도 남게 (2026-10-02 코드 점검).
  // 폰에서는 탭 전환 · 화면 끄기에 blur 가 오지 않아 쓰던 글이 사라졌다.
  const draftsRef = useRef(null);
  draftsRef.current = { itemDraft, summaryDraft, notes: state.visit.notes || {}, memo: state.visit.memo || "" };
  const flushDrafts = useCallback(() => {
    const d = draftsRef.current;
    if (!d) return;
    Object.keys(d.itemDraft).forEach((k) => {
      if ((d.itemDraft[k] || "") !== (d.notes[k] || "")) dispatch({ type: "visitNote", key: k, text: d.itemDraft[k] });
    });
    if (d.summaryDraft != null && d.summaryDraft !== d.memo) dispatch({ type: "visitNote", text: d.summaryDraft });
    if (Object.keys(d.itemDraft).length) setItemDraft({});
    if (d.summaryDraft != null) setSummaryDraft(null);
  }, [dispatch]);
  useEffect(() => {
    // 저장 계층이 화면을 내릴 때 모아 둔 것을 먼저 보낸 뒤에 넣는다 — 이 기기에 적혀 다음 저장 때 간다
    const onHide = () => {
      if (document.visibilityState === "hidden") setTimeout(flushDrafts, 0);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flushDrafts]);
  useEffect(() => {
    flushDrafts();
  }, [tab, flushDrafts]);
  const photos = Array.from({ length: state.visit.photos || 0 }, (_, i) => `현장사진_${i + 1}.jpg`); // 현장 사진 (데모 — 장수만)
  const [preview, setPreview] = useState(false); // 발행 전 미리보기 시트 — 보호자 리포트 · 어르신 앱 · 관제 (설계서 v3 §3-5)
  const v = state.visit;
  const [toastEl, toast] = useToast();
  // 관제가 보호자에게 보내는 순간 이 화면을 보고 있었으면 알린다 — 제출 줄이 '가족에게 발송됨'으로 바뀌며 한 번 반짝인다 (설계서 v3 §3-6)
  const sentNow = v.ops?.sentAt || null;
  const sentSeen = useRef(sentNow);
  const [sentGlow, setSentGlow] = useState(false);
  useEffect(() => {
    if (sentNow && !sentSeen.current) {
      toast("관제 검수 완료 · 보호자 앱에 발송");
      setSentGlow(true);
    }
    sentSeen.current = sentNow;
  }, [sentNow, toast]);
  // 데모 기본 동의 — 가입 상담(joinedAt)을 마친 가구만 그 답을 쓴다 (결제권한만 먼저 저장한 반쪽 onboarding 은 가입이 아니다)
  // 보호자가 정보 동의에서 철회하면 바로 '미동의 · 촬영 불가' (lib/consent.js — 철회 · 가입 상담 값 · 기본 순)
  const videoConsent = videoConsentOf(state);

  const purchasing = state.requests.filter(
    (r) => r.dir === "fromConcierge" && r.status === "inProgress"
  );
  // 복지혜택 제안 — 담당 가구(김순자)에 맞는 것 (앱 전체 3번). 판정은 관제·보호자와 같은 값.
  const [welfareSent, setWelfareSent] = useState({});
  const welfareMatches = matchWelfare(profileFor(ELDER.name, state.welfare?.answers));
  const welfareN = welfareCounts(welfareMatches);

  const fmtT = (t) =>
    new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

  const push = (kind, text, color) =>
    dispatch({ type: "pushEvent", payload: { kind, text, color } });

  // 컨시어지가 등록한 진료 예약 — 어제 이후 것만. 고치기 · 지우기 (규칙 lib/event-rights.js)
  const myAppts = (state.events || [])
    .filter((e) => eventOwner(e) === "concierge" && e.at > Date.now() - 86400000)
    .sort((a, b) => a.at - b.at);
  // 내가 등록했는데 다른 사람(보호자 등)이 지운 진료 예약 — 말없이 사라지면 그날 병원에 가게 된다 (2026-10-26 점검)
  const othersRemoved = (state.eventsRemoved || []).filter((e) => eventOwner(e) === "concierge" && e.removed?.by && e.removed.by !== ME && e.at > Date.now() - 86400000);
  const saveAppt = (e, patch) => {
    dispatch({ type: "updateEvent", id: e.id, patch, by: ME, role: "concierge", title: patch.title || e.title });
    push("예약", `진료 예약 수정 — ${patch.title || e.title} · 보호자·어르신 캘린더 반영`, "#8FA9CC");
  };
  const removeAppt = (e) => {
    dispatch({ type: "removeEvent", id: e.id, mode: "delete", by: ME, title: e.title });
    push("예약", `진료 예약 삭제 — ${e.title}`, "#8FA9CC");
  };

  // 제안 탭에서 담은 것을 값으로 잇는다 — 카탈로그 전체를 평평하게 편다
  const SHOP_ALL = STORE_CATALOG.flatMap((c) => c.groups.flatMap((g) => g.items));

  const a1 = TODAY_ROUTE[0];
  const a2 = TODAY_ROUTE[1];

  // 컨시어지 일정 달력 — 어르신·보호자 공유 캘린더와 별개다 (2026-08-28 전체 요청 3번).
  // 내가 나가는 업무 4종(병원동행·일상동행·해주세요·안심방문)만, 고객 이름으로 뜬다.
  // 고객·보호자가 함께 쓰는 캘린더(배송·개인일정·가족이벤트 포함)는 고객 탭에서
  // 고객 이름을 눌러 상세로 본다.
  const cNow = new Date();
  // 내가 승인 · 수락받아 확정된 해주세요도 달력에 (2026-10-05) — 데모 달력과 같은 모양으로
  const center = inCenter(); // 관제 센터 공간 — 예시 일정 · 예시 고객 없이 (2026-10-06 누수 점검)
  // 담당 고객 — 센터 공간은 그 센터 어르신 한 분 (예시 고객 12명 · 예시 케어 프로필 링크 없이)
  const myClients = center
    ? [{ name: LIVE_ELDER, age: null, where: people().district, loc: "자택", note: "앱에 남은 기록만", proposed: 0, accepted: 0, referredBy: null }]
    : MY_CLIENTS;
  // 내가 주 담당이거나 짝(2인 1조)인 것 모두 — 짝으로 가는 일도 내 일정이다 (2026-10-19 점검)
  const mineReq = (r) => r.scheduledDate && (r.assignee === ME || r.partner === ME);
  const reqJob = (r) => ({
    id: `rq-cal-${r.id}`,
    off: daysUntil(r.scheduledDate),
    kind: "request",
    client: live ? LIVE_ELDER : ELDER.name,
    age: center ? null : ELDER.age,
    time: r.scheduledTime || "시간 미정",
    where: r.hospital || "",
    detail: `해주세요 — ${svcTitle(r.type)}`,
    crew: r.partner ? `${r.assignee} · ${r.partner} (2인)` : `${r.assignee || ME} 1인`,
    memo: r.detail || "",
  });
  const reqJobs = (state.requests || []).filter((r) => mineReq(r) && ["confirmed", "inProgress", "cancelRequested"].includes(r.status)).map(reqJob);
  // 공유 일정 중 내가 나가는 일 (2026-10-28 요청 7) — 어르신 · 보호자 달력과 같은 기록(state.events)에서 읽는다.
  // 등록 · 변경(관제가 다시 보는 중이면 원래 확정 값 + '변경 확인 중') · 취소가 세 달력에 같이 반영된다.
  // 안심방문과 동행이 걸린 일정만 — 가족 · 배송 일정은 고객 상세의 공유 일정에서 본다. 해주세요에 묶인 일정은 위 해주세요 줄이 맡는다.
  // 데모는 예시 달력(CONCIERGE_CAL)이 씨앗 일정(오늘 동행 · 사흘 뒤 방문)을 이미 그리고 있어 씨앗은 겹치지 않게 뺀다
  const seedEv = (e) => !live && SEED_EVENT_IDS.has(e.id);
  const workKind = (e) => !e.reqId && (e.kind === "visit" || !!e.escort);
  const isWork = (e) => workKind(e) && !seedEv(e);
  const evJob = (e, extra) => ({
    id: `ev-cal-${e.id}${extra?.cancelled ? `-x${extra.cancelled.at || ""}` : ""}`,
    off: daysUntil(kstYmd(e.at)),
    kind: e.kind === "visit" ? "visit" : ["hospital", "nextAppt", "checkup"].includes(e.kind) ? "escort" : "daily",
    client: live ? LIVE_ELDER : ELDER.name,
    age: center ? null : ELDER.age,
    time: hm(e.at),
    where: "",
    detail: e.title,
    // 누가 가는지는 관제 배차가 정한다 — 정해지기 전에 지어 쓰지 않는다. 등록 때 저절로 붙은 '동행 필요' 글은 메모에 싣지 않는다
    // (전에는 그 글이 배차 칸에 들어가 '배차 동행 필요'로 읽혔다 · 2026-10-30 현장 확인)
    crew: "관제가 배정 후 안내",
    memo: [/^동행 (불)?필요$/.test(e.note || "") ? null : e.note, e.source ? `공유 일정 · ${e.source}` : "공유 일정"].filter(Boolean).join(" · "),
    ...extra,
  });
  const evJobs = eventsFor(state.events, "concierge")
    .filter(isWork)
    .map((e) => evJob(e, e.changePending ? { changing: true } : null));
  // 취소된 것도 그날 칸에 '취소'로 남긴다 — 말없이 사라지면 그날 나가게 된다. 확정됐던 일정의 취소 · 내가 맡았던 해주세요의 취소
  const recent = (t) => Number(t) > Date.now() - 30 * 86400000;
  const cancelJobs = [
    ...(state.eventsRemoved || [])
      .filter((e) => e.removed?.mode === "cancel" && recent(e.removed.at) && isWork(e))
      .map((e) => evJob(e, { cancelled: { by: e.removed.by, reason: e.removed.reason, at: e.removed.at } })),
    ...(state.requests || [])
      .filter((r) => mineReq(r) && r.status === "cancelled")
      .map((r) => {
        const h = [...(r.history || [])].reverse().find((x) => x.status === "cancelled") || {};
        return recent(h.at) ? { ...reqJob(r), id: `rq-cal-${r.id}-x`, cancelled: { by: h.by, reason: h.note, at: h.at } } : null;
      })
      .filter(Boolean),
  ];
  // 보는 달은 ‹ › 로 넘긴다 (2026-10-30 현장 확인 — 이번 달만 보여서 월말에 잡은 다음 달 일정이 컨시어지 달력에만 없었다)
  const calBase = new Date(cNow.getFullYear(), cNow.getMonth() + calShift, 1);
  const calMonthLabel = `${calBase.getFullYear()}년 ${calBase.getMonth() + 1}월`;
  // 나갈 일이 먼저, 취소된 것은 뒤에 (칸에는 첫 건만 보인다)
  const calJobsAll = [...(center ? [] : CONCIERGE_CAL), ...reqJobs, ...evJobs, ...cancelJobs];
  const offOf = (y, m, d) => Math.round((new Date(y, m, d) - new Date(cNow.getFullYear(), cNow.getMonth(), cNow.getDate())) / 86400000);
  const calCells = (() => {
    const y = calBase.getFullYear();
    const m = calBase.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    const cells = Array.from({ length: calBase.getDay() }, () => null);
    for (let d = 1; d <= last; d++) {
      // 오늘에서 며칠 떨어진 날인지(off)로 맞춘다 — 달력과 '오늘의 일정'이 같은 기준(이 폰의 오늘)을 쓰게
      const off = offOf(y, m, d);
      cells.push({ day: d, today: off === 0, jobs: calJobsAll.filter((j) => j.off === off) });
    }
    return cells;
  })();
  // 이번 달을 보는데 다음 달 이후에 나갈 일이 있으면 달력 아래에 알린다 — 넘겨 볼 줄 모르고 '없다'고 여기지 않게
  const calLater = calShift === 0 ? calJobsAll.filter((j) => !j.cancelled && j.off > offOf(cNow.getFullYear(), cNow.getMonth() + 1, 0)).length : 0;
  const moveCal = (n) => {
    setCalShift((s) => s + n);
    setCalDay(null);
  };
  const calDayJobs = calDay == null ? [] : calCells.find((c) => c && c.day === calDay)?.jobs || [];

  // ── 오늘 앞단 (2026-09-22 시안 1) ──
  // 오늘 일정은 달력과 같은 출처(CONCIERGE_CAL)를 쓴다 — 두 곳이 다른 말을 하지 않게.
  const todayJobs = center ? [] : CONCIERGE_CAL.filter((j) => j.off === 0 && j.start);
  const today = useToday(todayJobs, cNow);
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [urgentSteps, setUrgentSteps] = useState({});
  const urgentDone = CONCIERGE_URGENT.steps.every((s) => urgentSteps[s.k]);
  // 진행 중인 건에 붙는 주의 칩 — 케어 프로필에서 온다 (방문 전 30초와 같은 값)
  const nowJob = today.focus
    ? {
        ...today.focus,
        chips: [
          ["주의", "청력 저하", "#8A5D12"],
          ["장비", today.focus.kind === "escort" ? "휠체어 · 차량" : "욕실 센서 점검", "#3B5C8A"],
          ["환경", "반려견 1마리", "#7A4C8A"],
        ],
      }
    : null;
  // 오늘 › 지금 카드 — 내가 맡은 해주세요가 진행 중이거나 오늘 끝났거나 오늘 예정이면 그 건이 '지금'이다 (2026-10-24 설계서 v3 §1-2).
  // 끝난(체크아웃) 뒤 이 카드에서 추가 이용 금액을 보낸다. 없으면 전처럼 오늘의 중심 업무(예시 일정)
  const todayYmd = kstYmd(Date.now());
  const doneAt = (r) => [...(r.history || [])].reverse().find((h) => h.status === "done")?.at || 0;
  const myReqs = (state.requests || []).filter((r) => (r.assignee === ME || r.partner === ME) && !isVisitCall(r));
  const nowReq =
    myReqs.find((r) => r.status === "inProgress") ||
    myReqs.find((r) => r.status === "done" && kstYmd(doneAt(r)) === todayYmd) ||
    myReqs
      .filter((r) => ["confirmed", "cancelRequested"].includes(r.status) && r.scheduledDate === todayYmd)
      .sort((a, b) => String(a.scheduledTime || "").localeCompare(String(b.scheduledTime || "")))[0] ||
    null;
  // 지금 카드의 주의 칩 — 데모만 (케어 프로필 예시 값). 테스트 가구 · 센터는 적힌 것이 없어 칩을 만들지 않는다
  const nowReqChips =
    nowReq && !live && !center
      ? [
          ["주의", "청력 저하", "#8A5D12"],
          ...(/병원/.test(svcTitle(nowReq.type)) ? [["장비", "휠체어 · 차량", "#3B5C8A"]] : []),
          ["환경", "반려견 1마리", "#7A4C8A"],
        ]
      : [];
  // 21항목 점검 진행률 — 방문 탭 체크와 같은 상태를 본다
  const checkList = checkupFor(careLoc);
  const checkTotal = checkList.reduce((n, g) => n + g.items.length, 0);
  const checkCount = Object.values(checkDone).filter(Boolean).length;
  // 마무리 필요 — 오늘 끝난 건 중 리포트가 아직 안 나간 것
  // 이 앱의 방문 리포트는 이 가구 어르신 한 분 것이다 — 다른 (예시) 고객의 일정이 끝났다고 '작성하기'가 김순자 님 리포트를 열지 않게 (2026-10-19 점검 C-08)
  const myElder = live || center ? LIVE_ELDER : ELDER.name;
  // 추가 이용 금액 받는 분 — 어르신 · 이 가구 보호자 중 앱으로 결제할 수 있는 분 (구두로 동의한 분을 컨시어지가 고른다 · 2026-10-22).
  // 받는 분 화면은 같은 이름으로 자기 청구를 찾는다 (lib/membership.js extraPayees · lib/people.js meAs)
  const payees = extraPayees(myElder);
  const wrapUp = today.rows.find((r) => r.state === "done" && r.client === myElder && !v.reportSent)?.client || null;
  // 고객 탭 — 목록에서 누른 고객 (null 이면 목록 · 2026-10-24 설계서 v3 §2). 상세 기록이 있는 분은 이 가구 어르신 한 분이고,
  // 나머지 예시 고객은 누르면 그렇다고만 알린다 (목업도 김순자 고객만 열린다)
  const [clientOpen, setClientOpen] = useState(null);
  const openClient = (c) => {
    if (c.name !== myElder) return toast(`예시 고객 — ${myElder} 고객만 열려요`);
    setHealthEdit(false);
    setClientOpen(c);
    window.scrollTo(0, 0);
  };
  // 다음 진료 예약 — 관제가 승인한 진료 일정 (병원동행 · 다음 진료 예정일 · 건강검진). 컨시어지는 확정된 일정만 본다 —
  // 어르신 달력 기준으로 고르면 관제 확인 전 · 반려된 어르신 일정이 예약처럼 보였다 (2026-10-26 점검)
  const clientAppts = eventsFor(state.events, "concierge")
    .filter((e) => ["hospital", "nextAppt", "checkup"].includes(e.kind) && e.at > Date.now())
    .sort((a, b) => a.at - b.at)
    .slice(0, 3);
  // 공유 일정 — 어르신 · 보호자 달력과 같은 기록, 오늘부터 (2026-10-30 현장 확인 · 요청 7). 일정 달력이 '고객 탭에서 보라'고 하던 그 칸.
  // 취소는 어르신 달력과 같은 기준(2주 · 5건) — 확정됐던 것이라 컨시어지도 보던 일정이다
  const dayStartKst = Date.parse(`${kstYmd(Date.now())}T00:00:00+09:00`);
  const sharedEvents = eventsFor(state.events, "concierge")
    .filter((e) => e.at >= dayStartKst)
    .sort((a, b) => a.at - b.at);
  const sharedCancelled = (state.eventsRemoved || []).filter((x) => x.removed?.mode === "cancel" && x.removed.at > Date.now() - 14 * 86400000).slice(0, 5);
  // 미팅 리포트 · 발행 전 미리보기 — 지금 가구 기록 그대로 (설계서 v3 §3-4 · 3-5).
  // 센서 · 워치 예시 값은 데모 화면에서만 — 테스트 가구 · 센터는 기기 기록이 아직 연결되지 않았다 (값을 지어 넣지 않는다)
  const demoSensors = !live && !center ? MEET_DEMO : null;
  const gpsAt = (v.audit || []).find((e) => e.kind === "gps")?.at || Number(state.visitPlan?.gpsAt) || null;
  const meetSpan = meetPeriod(gpsAt, (state.reports || [])[0]?.at);
  const reportView = preview ? visitReportOf(state, { demo: !!demoSensors }) : null;
  const nextVisitAt = preview
    ? eventsFor(state.events, "elder")
        .filter((e) => e.kind === "visit" && e.at > Date.now())
        .sort((a, b) => a.at - b.at)[0]?.at || null
    : null;
  const reportKind = meetMode ? "미팅 리포트" : "안심방문 리포트";
  const sendStage = v.ops?.sentAt ? "sent" : aiSent ? "submitted" : "open";
  const submitReport = () => {
    if (aiSent || !canSubmitReport) return;
    // 테스트 가구에서는 컨시어지가 실제로 적은 것(동행 기록 → 총평)만 싣는다 — 예시 초안을 실제 기록처럼 보내지 않는다.
    // 미팅 리포트는 총평이 그 리포트의 글이다
    const note = meetMode ? v.memo || "" : escortSaved ? escort.note : live ? v.memo || "" : AI_REPORT.draft;
    dispatch({
      type: "addReport",
      // asks — 미팅 리포트 '부탁하신 것' 줄마다 부탁 1건 (자택 · 요양병원은 빈 목록 — '어르신께 남길 말'은 부탁이 아니다 · 2026-10-28 요청 1)
      payload: { id: `rp-${Date.now()}`, by: ME, kind: reportKind, flagged: 0, note, secretNote: visitText(v, "inner"), shared: true, closesVisit: true, asks: meetMode ? askLines(visitText(v, "asked")) : [] },
    });
    // 가족에게 가는 것은 관제가 검수하고 '보호자 리포트 발송'을 누를 때다 — 동행 기록도 그때 같이 간다.
    // 전에는 이 버튼을 누르자마자 '가족에게 전달됨'이라고 했지만 실제로는 관제 검수 대기였다 (2026-10-02 QA)
    push("리포트", `${ME} · ${elderNameOf(state.onboarding)} ${reportKind}${escortSaved ? " · 동행 기록" : ""} 제출 — 관제 검수 대기`, "#8FA9CC");
    toast("제출했어요 · 관제 검수를 기다려요");
  };

  // ── 마음사서함 (2026-09-22 명세) ──
  // 어르신이 앱에서 보낸 목소리(→ 컨시어지)를 받은 음성메시지에 붙인다
  const elderVoices = useMemo(
    () => (state.voices || []).filter((x) => x.to === "컨시어지").map((x) => ({ ...x, client: String(x.from || "").replace(/ 님$/, "") })),
    [state.voices]
  );
  const conciergeVoices = useMemo(
    () => (state.voices || []).filter((x) => x.from === "컨시어지").map((x) => ({ ...x, client: String(x.to || "").replace(/ 님$/, "") })),
    [state.voices]
  );
  const mb = useMailbox(elderVoices, conciergeVoices, live ? LIVE_ELDER : null);
  // 확인전화 — 아직 안 한 것 (시트 오늘 3번)
  const callsLeft = CALL_CHECKS.reduce(
    (n, c) => n + c.steps.filter((s) => !(callDone[`${c.id}-${s.k}`] ?? s.done)).length,
    0
  );

  // 관제 급파 → 컨시어지 긴급 배너 — 역할 간 실시간 연동 (SOS + 급파 지시 시) · 모든 탭 맨 위.
  // 수락 전에는 머리(스크롤해도 붙어 있는 곳)에, 수락한 뒤에는 본문 맨 위에 둔다 — 아래 카드를 보다가 SOS 를 놓치지 않게 (2026-10-19 점검 C-10)
  const sosDispatchBanner =
    state.demo.sos && state.ops.sosDispatched && sosForMe ? (
      <div role="alert" className={`animate-sosPulse rounded-2xl bg-danger p-4 text-white ${sosAck ? "" : "mt-3"}`}>
        <div className="text-[12px] font-bold tracking-[.14em] opacity-85">긴급 급파 · 관제 지시</div>
        <div className="mt-1 text-[18px] font-bold leading-[1.4]">
          {LIVE_ELDER}님 SOS — {center ? "관제가 출동을 지시했습니다" : "최근접 동행자로 지정되었습니다"}
        </div>
        <div className="mt-0.5 text-[13px] opacity-90">
          {/* 센터 공간은 거리 · 도착 예정을 계산하지 않는다 — 예시 값을 보이지 않는다 */}
          {/* 테스트 가구도 센터 공간처럼 — 예시 거리 · 짝(서다인) · 도착 예정을 실제 급파에 붙이지 않는다 (2026-10-19 점검 L-10) */}
          {center || live ? `${LIVE_ELDER} 님 댁으로 · 거리 · 도착 예정은 베타에서 계산하지 않습니다` : "대치동 자택 1.2km · 도착 예정 6분 (예시)"}
        </div>
        <button
          onClick={() => {
            if (sosAck) return;
            dispatch({ type: "sosAccept", by: ME, sosAt: state.demo.sosAt || null });
            push("대응", `${ME} 급파 수락 — 이동 시작${center || live ? "" : " (도착 예정 6분 · 예시)"}`, "#FF8A80");
          }}
          disabled={sosAck}
          className="btn-press mt-3 w-full rounded-[10px] bg-white py-3 text-[16px] font-bold text-danger disabled:opacity-80"
        >
          {sosAck ? "✓ 수락됨 — 이동 중 (관제 공유)" : "급파 수락 · 이동 시작"}
        </button>
      </div>
    ) : null;

  return (
    <>
      <Head>
        <title>컨시어지 — K-CARE</title>
      </Head>
      <Splash service="concierge" />
      {toastEl}
      <div className="min-h-screen bg-nav">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            {/* 이름·등급과 시연 버튼을 한 줄에 욱여넣으니 390px 에서 둘 다 두 줄로
                접혔다. 이름은 한 줄로 붙들고(줄바꿈 금지), 시연 컨트롤은 아래 줄로 뺀다. */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-num text-[11px] font-bold tracking-[.18em] text-gold">
                  CONCIERGE
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {/* 이 화면의 h1 — 없으면 문서에 제목 계층이 아예 없다 */}
                  <h1 className="whitespace-nowrap text-[21px] font-black text-navy">{ME} · 주 동행</h1>
                  {/* 등급은 예시 정산 값 — 관제 센터 공간의 새 컨시어지에게는 붙이지 않는다 */}
                  {!center && (
                    <span className="chip-gold shrink-0 rounded-full px-2 py-[3px] font-num text-[10px] font-bold">
                      {EARNINGS.grade}
                    </span>
                  )}
                </div>
              </div>
              {/* 관제에 말 걸기 — 어르신의 즉시방문요청과 같은 자리·같은 성격이다
                  (2026-08-21 시트 컨시어지 오늘 2번). 현장에서 관제를 부르는 버튼. */}
              <button
                onClick={() => setOpsMsgOpen(true)}
                className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-2.5 py-1.5 text-[12px] font-bold text-navy"
              >
                관제에 알리기
              </button>
              <ModeLink compact className="tap shrink-0 whitespace-nowrap text-[12px] font-bold" />
            </div>
            <button
              onClick={() => dispatch({ type: "demo", payload: { offline: !state.demo.offline } })}
              className="btn-press mt-2 w-full rounded-lg border border-navy/20 py-1.5 text-[12px] font-bold text-muted"
            >
              {state.demo.offline ? "온라인 전환" : "오프라인 시연"}
            </button>
            {/* ── 어르신 SOS — 어느 탭에 있든 맨 위에 (2026-10-02 현장 요청: "어르신 SOS 가 컨시어지에 알람 안 뜸").
                급파 지시 전에는 '관제 확인 중' + 어르신께 바로 전화, 급파 지시가 오면 수락 버튼.
                머리 안에 둔다 — 머리는 스크롤해도 붙어 있다. 본문 안에서는 아래로 내리면 사라졌다 (2026-10-19 점검 C-10) ── */}
            {state.demo.sos && (!state.ops.sosDispatched || !sosForMe) && (
              <div role="alert" className="animate-sosPulse mt-3 rounded-2xl bg-danger p-4 text-white">
                <div className="text-[12px] font-bold tracking-[.14em] opacity-85">긴급 · 어르신 SOS</div>
                <div className="mt-1 text-[18px] font-bold leading-[1.4]">{LIVE_ELDER}님이 SOS를 눌렀습니다</div>
                <div className="mt-0.5 text-[13px] opacity-90">
                  {sosTime ? `${sosTime} · ` : ""}
                  {state.ops.sosDispatched
                    ? `관제센터가 ${state.ops.sosDispatchedTo} 컨시어지를 급파했습니다.`
                    : "관제센터가 확인 중입니다. 급파 지시가 오면 여기서 수락합니다."}
                </div>
                <div className="mt-3 flex gap-2">
                  {elderTel ? (
                    <a href={elderTel} className="btn-press flex-1 rounded-[10px] bg-white py-3 text-center text-[16px] font-bold text-danger">
                      어르신께 전화
                    </a>
                  ) : null}
                  <button
                    onClick={() => setOpsMsgOpen(true)}
                    className="btn-press flex-1 rounded-[10px] border border-white/70 py-3 text-[15px] font-bold"
                  >
                    관제에 알리기
                  </button>
                </div>
              </div>
            )}
            {!sosAck && sosDispatchBanner}
          </header>

          <main className="flex-1 space-y-3.5 overflow-y-auto px-4 pb-28 pt-4">
            {sosAck && sosDispatchBanner}
            {/* 추가 이용 금액이 결제되면(받는 분 결제 · 기한 지나 등록 카드) 어느 탭에서든 알린다 (2026-10-22) */}
            <ExtraPaidNotice charges={state.extraCharges} />
            {/* ════ 오늘 — 출근해서 제일 먼저 보는 것 ════ */}
            {tab === "today" && (
              <>
                {/* ── 앞단 재구성 (2026-09-22 시안 1) ──
                    출근해서 보는 순서: 인사 → 오늘 업무 요약 → 긴급확인 → 현재 진행 중 →
                    오늘의 일정 → 마무리 필요. 기존 카드(짝·컨디션·확인전화·부탁)는 그 아래로. */}
                {/* 테스트 가구 — 무엇이 실제로 남고 무엇이 예시인지 맨 위에서 말한다 (2026-10-02 UX 점검) */}
                {live && (
                  <div role="note" className="rounded-xl border border-gold/40 bg-gold/[.08] px-3.5 py-3 text-[13px] leading-[1.65] text-ink">
                    <b className="text-navy">{LIVE_TAG} — 실제 고객은 {LIVE_ELDER} 님뿐입니다.</b> 체크인 · 방문 점검 · 리포트 · 동행 기록 ·
                    관제에 알리기 · {LIVE_ELDER} 님 마음사서함 · SOS 수락은 실제로 저장되어 다른 폰에 뜹니다.
                    {center ? "" : " 다른 고객 · 긴급확인 · 오늘의 짝 · 외출 컨디션은 예시입니다."}
                  </div>
                )}
                <TodayHeader
                  name={ME}
                  now={cNow}
                  today={today}
                  urgentCount={center || urgentDone ? 0 : 1}
                  reportDue={wrapUp ? `${wrapUp} 고객` : null}
                />

                {/* 관제가 리포트를 반려했다 — 방문 카드 안에만 있던 사유를 오늘 탭 맨 위에서 알린다 (2026-10-19 점검 C-09) */}
                {state.visit.returned && !state.visit.reportSent && (
                  <div role="status" className="rounded-2xl border border-amber/40 bg-[#FFF7E8] p-4">
                    <div className="text-[12px] font-bold tracking-[.08em] text-amber">관제 반려 — 고쳐서 다시 제출</div>
                    <p className="mt-1 text-[14px] leading-[1.6] text-[#5A4A22]">
                      {state.visit.returned.by} · 사유: {state.visit.returned.reason}
                    </p>
                    <button onClick={() => setTab("visit")} className="btn-press mt-2 rounded-xl border border-amber/40 bg-white/70 px-3 py-2.5 text-[13px] font-bold text-amber">
                      고치러 가기 ›
                    </button>
                  </div>
                )}

                {!center && <UrgentBanner u={CONCIERGE_URGENT} done={urgentDone} onOpen={() => setUrgentOpen(true)} />}

                {nowReq ? (
                  <ReqNowCard
                    r={nowReq}
                    me={ME}
                    customer={myElder}
                    charges={state.extraCharges || []}
                    payees={payees}
                    chips={nowReqChips}
                    onOps={() => setOpsMsgOpen(true)}
                    onGo={() => setTab("visit")}
                    dispatch={dispatch}
                    push={push}
                    toast={toast}
                  />
                ) : nowJob ? (
                  <NowCard
                    job={nowJob}
                    checkDone={checkCount}
                    checkTotal={checkTotal}
                    onOps={() => setOpsMsgOpen(true)}
                    onGo={() => setTab("visit")}
                  />
                ) : (
                  <Card className="p-4">
                    <div className="text-[15px] font-black text-navy">지금 진행 중인 업무가 없습니다</div>
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">
                      다음 일정은 아래 목록에서 확인하세요. 이동 준비는 출발 90분 전부터 표시됩니다.
                    </p>
                  </Card>
                )}

                <TodaySchedule rows={today.rows} activeId={today.focus?.id} onOpen={(id) => { setCalShift(0); setCalDay(cNow.getDate()); setCalJob(id); }} />

                <WrapUp client={wrapUp} onWrite={() => setTab("visit")} />

                {/* 일정 달력 — 2026-08-21 시트 컨시어지 오늘 1번.
                    접었다 펴고, 날짜를 누르면 그 날 일정이 시트로 뜬다. */}
                <Card className="p-4">
                  <button
                    onClick={() => setCalOpen((v) => !v)}
                    aria-expanded={calOpen}
                    className="btn-press flex w-full items-center gap-2 text-left"
                  >
                    <span className="text-[15px] font-black text-navy">일정 달력</span>
                    <span className="font-num text-[12px] text-muted">{calMonthLabel}</span>
                    <span
                      aria-hidden
                      className="ml-auto text-muted transition-transform duration-200"
                      style={{ transform: calOpen ? "rotate(180deg)" : "none" }}
                    >
                      <Icon name="chev" size={18} strokeWidth={2} />
                    </span>
                  </button>
                  {calOpen && (
                    <div className="mt-2 flex items-center justify-between">
                      <button type="button" onClick={() => moveCal(-1)} aria-label="이전 달" className="btn-press flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-[#D9D6CF] bg-white text-[20px] leading-none text-navy">
                        ‹
                      </button>
                      <span className="flex flex-col items-center">
                        <span className="font-num text-[14px] font-bold text-navy" aria-live="polite">
                          {calMonthLabel}
                        </span>
                        {calShift !== 0 && (
                          <button type="button" onClick={() => moveCal(-calShift)} className="btn-press min-h-[32px] px-2 text-[12px] font-bold text-gold underline underline-offset-2">
                            이번 달로
                          </button>
                        )}
                      </span>
                      <button type="button" onClick={() => moveCal(1)} aria-label="다음 달" className="btn-press flex h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-[#D9D6CF] bg-white text-[20px] leading-none text-navy">
                        ›
                      </button>
                    </div>
                  )}
                  {calOpen && (
                    <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                      {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                        <div key={d} className="py-1 text-[11px] font-bold text-muted">
                          {d}
                        </div>
                      ))}
                      {calCells.map((c, i) =>
                        c === null ? (
                          <div key={`b${i}`} />
                        ) : (
                          <button
                            key={c.day}
                            onClick={() => setCalDay(c.day)}
                            aria-label={`${c.day}일${c.jobs.some((j) => !j.cancelled) ? ` · 일정 ${c.jobs.filter((j) => !j.cancelled).length}건` : ""}${c.jobs.some((j) => j.cancelled) ? ` · 취소 ${c.jobs.filter((j) => j.cancelled).length}건` : ""}`}
                            className="btn-press flex min-h-[46px] flex-col items-center justify-start gap-[2px] rounded-lg px-[2px] py-1"
                            style={{ background: c.jobs.length ? "rgba(176,141,87,.07)" : "transparent" }}
                          >
                            <span className="font-num text-[13px] font-bold" style={{ color: c.today ? "#B08D57" : "#40413F" }}>
                              {c.day}
                            </span>
                            {/* 고객 이름 — 시트 요청 "고객 이름이 날짜별로 나오고".
                                두 건 이상이면 첫 건 + 나머지 수 (칸이 좁다). 취소된 건은 회색 · 가운데 줄 */}
                            {c.jobs.slice(0, 1).map((j) => (
                              <span
                                key={j.id}
                                className={`w-full truncate rounded-[3px] px-[2px] text-[9px] font-bold leading-[1.3] text-white ${j.cancelled ? "line-through" : ""}`}
                                style={{ background: j.cancelled ? CANCELLED_JOB.color : CONCIERGE_JOB_KINDS[j.kind].color }}
                              >
                                {j.client}
                              </span>
                            ))}
                            {c.jobs.length > 1 && (
                              <span className="text-[9px] font-bold text-muted">+{c.jobs.length - 1}</span>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  )}
                  {calOpen && calLater > 0 && (
                    <button type="button" onClick={() => moveCal(1)} className="btn-press mt-2 min-h-[40px] w-full rounded-[10px] bg-[#FBF6EC] px-3 text-left text-[12.5px] font-bold text-[#6A4C16]">
                      다음 달 이후 나갈 일 {calLater}건 · 다음 달 보기 ›
                    </button>
                  )}
                </Card>

                {/* 방문 업무흐름 — 관제와 같은 건을 본다 (2026-08-13 미팅 8단계) */}
                <VisitFlow role="concierge" />

                {/* 도와줘요(즉시 방문 요청) — 관제가 확인 전화 · 출동 지시를 하고, 그 단계가 여기 그대로 뜬다 (2026-10-05) */}
                <HelpCallCard role="concierge" me={ME} />

                {/* 해주세요 — 보호자 · 어르신 부탁은 내 일정을 보고 승인 · 거절, 확정 건 진행 · 완료, 보낸 제안 (2026-10-05).
                    전에는 어르신 부탁만 보였고, 관제 확인 전에 '확인함'을 누를 수 있었다. */}
                <div id="concierge-requests" className="scroll-mt-4">
                  <ConciergeRequests requests={state.requests} payments={state.payments} extraCharges={state.extraCharges} payees={payees} customer={myElder} me={ME} dispatch={dispatch} push={push} nowId={nowReq?.id || null} />
                </div>


                {state.demo.offline && (
                  <div className="rounded-[14px] border border-amber/30 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-3.5">
                    <div className="text-[13px] font-bold text-amber">
                      오프라인 — 기록은 기기에 저장 중입니다
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.6] text-[#5A4A22]">
                      오늘 일정·체크리스트는 미리 받아 두었습니다. 연결이 돌아오면 대기 중인 기록{" "}
                      {v.audit.length}건이 자동 전송됩니다.
                    </p>
                  </div>
                )}


                {/* 동행 준비 — 짝 · 컨디션 · 준비물 · 출근 체크인.
                    고객·시간은 위 '오늘의 중심 업무' 카드가 이미 말하므로 여기서는 반복하지 않는다
                    (2026-09-22 재구성 전에는 같은 동행이 두 카드에 두 번 떴다). */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-black text-navy">{center ? "방문 체크인" : "동행 준비"}</span>
                    {/* 두 사람 모두 체크인해야 수행중 — 나만 체크인했으면 '짝 체크인 대기' (2026-10-02 QA 13번) */}
                    <Badge fg="#FFFFFF" bg="#0A1F3C">
                      {center ? (v.checkedIn ? "체크인 완료" : "체크인 전") : v.checkedIn && pairCalled ? "수행중" : v.checkedIn ? "짝 체크인 대기" : "예정"}
                    </Badge>
                  </div>
                  {/* 짝 · 외출 컨디션 · 준비물은 예시 일정의 것 — 관제 센터 공간에는 보이지 않는다 (2026-10-06 누수 점검) */}
                  {center ? (
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-muted">{LIVE_ELDER} 님 댁에 도착하면 체크인하세요 — GPS 기록이 관제 방문관리에 남습니다.</p>
                  ) : (
                  <>
                  <div className="mt-1 text-[12.5px] leading-[1.6] text-muted">
                    {a1.customer} · {a1.hospital} · {a1.timeRange}
                    <br />
                    {a1.meta2}
                  </div>

                  {/* 오늘의 짝 — 2인 지정 방문의 실행 UI */}
                  <div
                    className="card-navy border-grad-dark mt-3.5 rounded-[14px] bg-navy p-4 text-white"
                    style={{
                      backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,0))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.14), 0 18px 36px -24px rgba(10,31,60,.8)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold tracking-[.1em] text-gold-soft">
                        오늘의 짝
                      </span>
                      <span className="chip-gold rounded-full px-2.5 py-1 text-[11px] font-bold">
                        {v.checkedIn && pairCalled
                          ? "2인 체크인 완료"
                          : pairCalled
                          ? "짝 이동 중"
                          : "짝 체크인 대기"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className="flex h-[48px] w-[48px] shrink-0 items-center justify-center whitespace-nowrap rounded-full text-[15px] font-bold"
                        style={{ background: PAIR_TODAY.avBg, color: PAIR_TODAY.avFg }}
                      >
                        {PAIR_TODAY.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[16px] font-bold">
                          {PAIR_TODAY.name} · {PAIR_TODAY.role}
                        </div>
                        <div className="mt-0.5 font-num text-[12px] text-white/65">
                          {PAIR_TODAY.eta}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (pairCalled) return;
                          setPairCalled(true);
                          push("동행", "부 동행 서다인 호출 · 위치 공유 요청", "#8FA9CC");
                        }}
                        className={`btn-press btn-dark shrink-0 rounded-xl px-4 py-3 text-[15px] font-bold text-white ${
                          pairCalled ? "bg-muted" : "bg-green"
                        }`}
                      >
                        {pairCalled ? "호출됨" : "짝 호출"}
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-white/[.06] pt-3">
                      {PAIR_TODAY.duties.map((d) => (
                        <div key={d.who} className="flex gap-2.5 text-[13px]">
                          <span className="w-[52px] shrink-0 font-bold text-gold-soft">{d.who}</span>
                          <span className="flex-1 leading-[1.6] text-white/85">{d.what}</span>
                        </div>
                      ))}
                    </div>
                    {/* 1인 진입 금지 — 원칙의 실행 카피 */}
                    <p className="mt-3 border-t border-white/[.06] pt-2.5 text-[12px] leading-[1.7] text-white/60">
                      {PAIR_TODAY.rule}
                    </p>
                  </div>

                  {/* 외출 컨디션 2구간 — 컨시어지용 압축 표현 (같은 계산, 다른 표현) */}
                  <div
                    className="mt-3 rounded-[14px] border p-3.5"
                    style={{
                      background: "linear-gradient(180deg, #FAFCFF, #F2F7FD)",
                      borderColor: "rgba(147,178,214,.24)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#5C7799]">
                        외출 컨디션 · 2구간
                      </span>
                      <span className="font-num text-[11px] text-muted">{OUTING.asOf}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {OUTING.legs.map((l) => (
                        <div key={l.tag} className="flex items-center gap-2 text-[13px]">
                          <span className="w-[30px] shrink-0 font-bold text-gold">{l.tag}</span>
                          <span className="shrink-0 font-bold text-ink">{l.place}</span>
                          <span className="flex-1 truncate text-right text-[12px] text-muted">
                            {l.compact}
                          </span>
                          <span className="font-num text-[16px] font-bold text-navy">{l.score}</span>
                          <span
                            className="w-[28px] text-right text-[12px] font-bold"
                            style={{ color: l.level === "danger" ? "#C0392B" : "#8A5D12" }}
                          >
                            {l.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 준비물 — 날씨 자동 반영 + 동행 문서 */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[...OUTING.kit, ...KIT_DOCS].map((k) => (
                      <span key={k} className="chip-gold rounded-full px-2.5 py-1 text-[12px] font-bold">
                        {k}
                      </span>
                    ))}
                  </div>

                  </>
                  )}
                  {/* GPS 출근 체크인 — 감사 타임라인 시작 */}
                  <button
                    onClick={() => {
                      if (v.checkedIn) return;
                      dispatch({
                        type: "audit",
                        patch: { checkedIn: true },
                        event: { kind: "gps", label: "출근 체크인 · GPS 좌표 기록" },
                      });
                      // '수행중'은 두 사람 모두 체크인해야 시작이다 — 혼자 체크인한 것을 수행중이라고 적지 않는다 (2026-10-02 QA)
                      push("체크인", live ? `${ME} 출근 체크인 · ${elderWho()} 댁 (GPS 기록)` : "박지현 출근 체크인 · 김순자(78) — 짝(서다인) 체크인 대기", "#4ADE80");
                    }}
                    disabled={v.checkedIn}
                    className={`btn-press btn-dark mt-4 w-full rounded-xl py-3.5 text-[17px] font-bold text-white ${
                      v.checkedIn ? "bg-green" : "bg-navy"
                    }`}
                  >
                    {v.checkedIn ? "✓ 출근 체크인 완료" : "GPS 출근 체크인"}
                  </button>
                </Card>


                {!center && (
                <>
                {/* 내일 일정 — 오늘 업무 뒤에 확인 · 주소 게이팅 유지 (REQ-09) */}
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-num text-[16px] font-bold text-navy">{a2.time}</span>
                    <span className="text-[15px] font-bold text-ink">{a2.customer}</span>
                    <span className="ml-auto">
                      <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">
                        배정 대기
                      </Badge>
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-muted">{a2.purpose}</div>
                  <div className="mt-2 border-t border-navy/10 pt-2 text-[13px]">
                    <span className="font-bold text-gold">고객 </span>
                    <span className="text-muted">
                      {a2.dong} — <span className="text-amber">담당 확정 후 상세 주소 표시</span>
                    </span>
                    {a2.hospital && (
                      <>
                        <br />
                        <span className="font-bold text-gold">병원 </span>
                        <span className="text-ink">{a2.hospital}</span>
                      </>
                    )}
                  </div>
                </Card>
                </>
                )}

                {!center && (
                <>
                {/* 방문 전 확인전화 — 7일·3일·1일 전 (2026-08-21 시트 컨시어지 오늘 3번).
                    체크하면 관제로 넘어간다. 노쇼의 절반은 "그날인 줄 몰랐다"라서,
                    안 한 것이 남아 있으면 관제가 먼저 알아야 한다. */}
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-navy">방문 전 확인전화</span>
                    <span className="ml-auto font-num text-[12px] font-bold text-amber">
                      남은 {callsLeft}건
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {CALL_CHECKS.map((c) => (
                      <div key={c.id} className="rounded-xl border border-navy/[.07] bg-white/60 p-3">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-[14px] font-bold text-navy">{c.customer}</span>
                          <span className="font-num text-[12px] font-bold text-gold">{c.visitAt}</span>
                        </div>
                        <div className="mt-0.5 text-[12px] text-muted">{c.purpose}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.steps.map((s) => {
                            const on = callDone[`${c.id}-${s.k}`] ?? s.done;
                            return (
                              <button
                                key={s.k}
                                onClick={() => {
                                  if (on) return;
                                  setCallDone((m) => ({ ...m, [`${c.id}-${s.k}`]: true }));
                                  push("확인전화", `${c.customer} ${s.label} 확인전화 완료 — 관제 전달`, "#8FE3C0");
                                }}
                                disabled={on}
                                className="btn-press min-h-[34px] rounded-[10px] border px-2.5 text-[12px] font-bold disabled:opacity-100"
                                style={
                                  on
                                    ? { background: "rgba(30,122,90,.1)", color: "#1E7A5A", borderColor: "rgba(30,122,90,.3)" }
                                    : { color: "#8A5D12", borderColor: "rgba(138,93,18,.35)" }
                                }
                              >
                                {on ? `✓ ${s.label}` : `${s.label} · ${s.due}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    체크하면 관제 화면에 바로 반영됩니다. 통화가 안 되면 체크하지 마세요 — 안 된
                    것도 관제가 알아야 할 정보입니다.
                  </p>
                </Card>
                </>
                )}

                {!center && (
                <>
                {/* 오늘의 한 끗 — 선제 케어 한 가지 (세계 최고 컨시어지: anticipation) */}
                <Card className="border border-gold/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="chip-gold rounded-full px-2 py-[3px] text-[10px] font-bold">AI</span>
                    <span className="text-[16px] font-black text-navy">오늘의 한 끗</span>
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.7] text-ink">{TODAY_DETAIL.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-muted">근거 — {TODAY_DETAIL.src}</span>
                    <button
                      onClick={() => {
                        if (detailDone) return;
                        setDetailDone(true);
                        push("어르신", "오늘의 한 끗 완료 — 생신 축하 인사 · 가족 메시지 전달", "#F0D9A8");
                      }}
                      disabled={detailDone}
                      className={`btn-press btn-dark ml-auto shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white ${
                        detailDone ? "bg-green" : "bg-navy"
                      }`}
                    >
                      {detailDone ? "✓ 전달 완료" : "전달했어요"}
                    </button>
                  </div>
                </Card>
                </>
                )}

              </>
            )}

            {/* ════ 고객 — 방문 전 30초, 이 분이 누구신지 ════ */}
            {/* ════ 고객 — 이름 목록 → 누르면 상세 (2026-10-24 컨시어지 화면설계서 v3 §2 · 목업 방식 확정) ════
                첫 화면은 이름 · 나이 · 동네 · 방문 횟수 · 거주 칩만. 줄을 누르면 상세로 바뀌고 맨 위 '‹'로 목록에 돌아온다.
                상세: 선호 카드(내부) · AI 동행 브리핑(내부) · 건강 정보(어르신 · 보호자) · 다음 진료 예약(어르신 · 보호자) */}
            {tab === "client" && (
              <>
                {!clientOpen ? (
                  <ClientList clients={myClients} onOpen={openClient} counts={{ [myElder]: asksOf(state).filter(isOpenAsk).length }} />
                ) : (
                  <>
                    <ClientHead
                      c={clientOpen}
                      onBack={() => setClientOpen(null)}
                      extra={
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-[54px] text-[12px] leading-[1.5]">
                          <span className="text-muted">{clientSub(clientOpen)}</span>
                          {/* 제안 수락 · 소개 관계 — 2026-08-21 시트 고객 1·2번. 수락률이 낮으면 제안이 안 맞는다는 신호다 (실적 아님 · 원칙 1) */}
                          {clientOpen.proposed > 0 && (
                            <span className={clientOpen.accepted / clientOpen.proposed >= 0.5 ? "text-green" : "text-amber"}>
                              제안 {clientOpen.proposed}건 중 {clientOpen.accepted}건 수락
                            </span>
                          )}
                          {clientOpen.referredBy && <span className="text-gold">{clientOpen.referredBy} 소개</span>}
                          {!center && (
                            <Link href="/care-profile" className="ml-auto inline-flex min-h-[36px] items-center font-bold text-navy underline underline-offset-2">
                              케어 프로필 ›
                            </Link>
                          )}
                        </div>
                      }
                    />
                    {/* 어르신 부탁 — 미팅 리포트 '부탁하신 것' (2026-10-28 요청 1). 이 가구의 어르신 상세에만 (예시 고객에는 부탁 기록이 없다) */}
                    {clientOpen.name === myElder && (
                      <AsksCard
                        asks={asksOf(state)}
                        onResolve={(a, memo) => {
                          dispatch({ type: "closeAsk", id: a.id, to: "resolved", by: ME, role: "concierge", memo });
                          push("어르신", `${clientOpen.name} 님 부탁 해결 — ${a.text}${memo ? ` · ${memo}` : ""}`, "#8FA9CC");
                          toast("해결로 저장했어요 · 어르신 홈에서도 빠져요");
                        }}
                      />
                    )}
                    <PrefCard
                      prefs={center ? [] : ELDER_PREFS}
                      notes={state.prefNotes || []}
                      onAdd={(text) => {
                        dispatch({ type: "prefNote", text, by: ME });
                        push("어르신", `선호 카드 기록 — ${text}`, "#F0D9A8");
                        toast("선호 카드에 남겼어요");
                      }}
                    />
                    {/* AI 동행 브리핑 — 선호 카드와 같이 '방문 전 30초' (2026-08-12 대표 피드백).
                        관제 센터 공간에는 아직 케어 프로필 · 관찰 기록이 없어 브리핑을 만들지 않는다 (2026-10-06 누수 점검).
                        영양제 복용 시간대는 자료에 없어 가정값이다 — 미확정에 올려 첫 안심방문 때 약봉투로 확인한다 (lib/meds.js) */}
                    <BriefingCard
                      confirmed={AI_BRIEFING.confirmed}
                      unconfirmed={[...AI_BRIEFING.unconfirmed, supplementSlotNote(healthOf(state).supplements)].filter(Boolean)}
                      empty={center ? "AI 동행 브리핑은 방문 리포트 · 관찰 기록이 쌓이면 만들어집니다." : null}
                    />
                    {/* 건강 정보 — 복용약 · 질환 · 알레르기 (2026-10-02 QA "복용약 등록·수정 버튼 없음").
                        첫 안심방문 때 약봉투를 보고 여기서 고친다. 어르신 복약 미션 · 보호자 마이 · 관제 · SOS 신고 정보가 같은 값을 쓴다. */}
                    <HealthCard
                      health={healthOf(state)}
                      editing={healthEdit}
                      onEdit={() => setHealthEdit(true)}
                      editor={
                        <HealthEditor
                          health={healthOf(state)}
                          onCancel={() => setHealthEdit(false)}
                          onSave={(payload) => {
                            const by = live ? `${authUser?.name || ME} (컨시어지)` : "박지현 (컨시어지)";
                            dispatch({ type: "setHealth", payload, by, role: "concierge" });
                            push("건강", `건강 정보 수정 — 복용 ${payload.meds.length}번 · 건강식품 ${payload.supplements.length}가지 · 질환 ${payload.conditions.length}가지 · ${by}`, "#8FA9CC");
                            setHealthEdit(false);
                          }}
                        />
                      }
                    />
                    <ApptCard appts={clientAppts} />
                    {/* '나갈 일' 표시는 일정 달력과 같은 기준(안심방문 · 동행) — 데모 씨앗 일정도 여기서는 같은 기준으로 단다 */}
                    <SharedScheduleCard events={sharedEvents} cancelled={sharedCancelled} isWork={workKind} />
                  {/* 첫 방문이면 — 홈 안전진단 (자택 전용 · 30항목 100점) */}
                  {careLoc === "home" && (
                    <Link href="/safety-check" className="block">
                      <Card className="btn-press border-gold/40 p-4" style={{ background: "linear-gradient(180deg,#FBF6EC,#F6EFDE)" }}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-gold/15 text-gold">
                            <Icon name="shield" size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-bold text-navy">첫 방문 홈 안전진단 — 30항목 · 100점</div>
                            <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">
                              첫 방문 리포트에 실리고, 부족한 곳의 안전용품이 스토어 장바구니에
                              자동으로 담깁니다
                            </div>
                          </div>
                          <span className="text-[18px] text-muted">›</span>
                        </div>
                      </Card>
                    </Link>
                  )}
                  </>
                )}
              </>
            )}

            {/* ════ 마음사서함 — 담당 고객과 오늘의 안부를 음성으로 (2026-09-22 명세) ════ */}
            {tab === "mailbox" && (
              <Mailbox
                mb={mb}
                telOf={(name) => (name === LIVE_ELDER && elderTel ? elderTel : null)}
                onEvent={push}
                onToOps={(name, memo) => sendOpsMsg(`마음사서함 — ${name} 고객 음성 확인 요청${memo ? ` · 청취 메모: ${memo}` : ""}`)}
                onMemoSync={(reqId, text) => {
                  dispatch({ type: "requestSummary", id: reqId, text, by: ME });
                  push("해주세요", `${ME} 말로 부탁 정리 — ${text || "(지움)"}`, "#8FA9CC");
                }}
                onSent={(name, payload) => {
                  // 정상 발송이 확인된 것만 고객 화면으로 간다 — 어르신 마음사서함 말풍선이 된다.
                  // 테스트 가구에는 김순자 님만 실제 고객이다 — 예시 고객에게 보낸 것은 가구 기록에 남기지 않는다 (2026-10-02 코드 점검)
                  if (live && name !== LIVE_ELDER) return;
                  dispatch({
                    type: "addVoice",
                    payload: {
                      from: "컨시어지",
                      to: name,
                      secs: payload.secs,
                      context: payload.category,
                      title: payload.title,
                      shareGuardian: payload.shareGuardian,
                      clip: payload.clip,
                    },
                  });
                }}
              />
            )}

            {/* ════ 방문 — 현장에서 누르는 것들 ════ */}
            {tab === "visit" && (
              <>
                {/* 방문 수행 — 체크인 후 진행 (감사 타임라인) */}
                <SectionLabel>방문 수행</SectionLabel>
                <Card className="p-4">
                  {/* 관찰 리포트 버튼은 뺐다 (2026-08-21 시트 컨시어지 전체 2번).
                      리포트 작성은 아래 '리포트' 구역 한 곳에서만 한다 — 같은 일을
                      두 자리에서 시작할 수 있으면 어디까지 썼는지 알 수 없다.
                      케어박스 점검 버튼도 뺐다 — 케어박스는 제공하지 않는다 (2026-10-02 운영 결정). */}
                  {v.audit.length === 0 && (
                    <p className="text-[13px] leading-[1.7] text-muted">
                      체크인하면 GPS · 시간 · 점검 · 사진 · 리포트가 여기 하나의 방문 기록으로 묶입니다.
                    </p>
                  )}
                  {v.audit.length > 0 && (
                    <div>
                      <SectionLabel>방문 기록 (자동 연결)</SectionLabel>
                      <div className="mt-2 space-y-1.5">
                        {v.audit.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-[13px]">
                            <span className="font-num font-bold text-navy">{fmtT(e.at)}</span>
                            <span
                              className="h-[7px] w-[7px] rounded-full"
                              style={{
                                background:
                                  { gps: "#1E7A5A", photo: "#B08D57", check: "#3B5C8A", report: "#0A1F3C", request: "#8A5D12", video: "#7A4C8A" }[e.kind] || "#5C5A54",
                              }}
                            />
                            <span className="flex-1 text-ink">{e.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">
                        GPS·시간·체크리스트·사진·리포트가 하나의 방문 기록으로 묶여 보관됩니다.
                        {state.demo.offline && " (오프라인 — 연결 복구 시 전송)"}
                      </p>
                    </div>
                  )}
                </Card>


                {/* 영상 2모드 — REQ-12 (원격상담 모드는 2026-08-12 요청으로 삭제) */}
                <SectionLabel>영상</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-2.5">
                    {VIDEO_MODES.map((m) => (
                      <div key={m.key} className="rounded-xl border border-navy/10 p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold text-navy">{m.name}</span>
                          {m.key === "visit" && (
                            <Badge
                              fg={videoConsent ? "#1E7A5A" : "#8A5D12"}
                              bg={videoConsent ? "rgba(30,122,90,.12)" : "rgba(138,93,18,.12)"}
                            >
                              {videoConsent ? "동의 가구" : "미동의 · 촬영 불가"}
                            </Badge>
                          )}
                          {m.key === "sos" && !state.demo.sos && (
                            <Badge fg="#5C5A54" bg="rgba(92,90,84,.1)">
                              대기
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-[1.6] text-muted">{m.rule}</p>
                        {m.key === "visit" && videoConsent && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {VIDEO_SEGMENTS.map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  dispatch({
                                    type: "audit",
                                    event: { kind: "video", label: `영상 세그먼트 촬영 · ${s}` },
                                  })
                                }
                                className="btn-press rounded-full border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
                              >
                                ⏺ {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {m.key === "sos" && state.demo.sos && (
                          <button
                            onClick={() =>
                              dispatch({
                                type: "audit",
                                event: { kind: "video", label: "긴급 영상 — 관제센터 일시 공유 시작" },
                              })
                            }
                            className="btn-press mt-1.5 rounded-lg bg-danger px-3 py-2 text-[12px] font-bold text-white"
                          >
                            관제센터 영상 공유
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/10 pt-2.5 text-[11px] leading-[1.7] text-muted">
                    촬영 불가: {VIDEO_POLICY.banned.join(" · ")} (내부 규정) · 보관: {VIDEO_POLICY.retention}
                  </p>
                </Card>


                {/* 다음 진료 예약 — 공유 캘린더 즉시 반영 (REQ-02) */}
                <SectionLabel>다음 진료 예약</SectionLabel>
                <Card className="p-4">
                  <p className="text-[13px] leading-[1.7] text-muted">
                    병원에서 다음 예약을 잡으면 여기서 등록합니다. 보호자·어르신 캘린더에 즉시
                    공유됩니다.
                  </p>
                  {/* 디테일 입력 (2026-08-21 시트 전체 3번) — 전에는 하드코딩된 일정만
                      등록됐다. 진료과·병원은 병원에서 들은 그대로, 메모는 자유. */}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <input
                      value={apptDept}
                      onChange={(e) => setApptDept(e.target.value)}
                      disabled={apptDone}
                      placeholder="진료과 (예: 정형외과)"
                      className="rounded-lg border border-navy/15 px-3 py-2.5 text-[13px] outline-none focus:border-gold"
                    />
                    {/* 병원 — 관제 병원 관리의 제휴 병원 · 가족이 등록한 다니시던 병원을 고를 수 있고, 다른 병원은 그대로 적는다 (2026-10-28 요청 2) */}
                    <input
                      value={apptHosp}
                      onChange={(e) => setApptHosp(e.target.value)}
                      disabled={apptDone}
                      list="appt-hosp-list"
                      aria-label="병원"
                      placeholder="병원 (예: 분당서울대)"
                      className="rounded-lg border border-navy/15 px-3 py-2.5 text-[13px] outline-none focus:border-gold"
                    />
                    <datalist id="appt-hosp-list">
                      {[...new Set([...partnerHospitals(state).map((h) => h.name), ...(state.myHospitals || []).map((h) => h.name)].filter(Boolean))].map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                    <input
                      type="date"
                      value={apptDate}
                      min={kstYmd(Date.now())}
                      onChange={(e) => setApptDate(e.target.value)}
                      disabled={apptDone}
                      aria-label="진료 날짜"
                      className="rounded-lg border border-navy/15 px-3 py-2.5 font-num text-[13px] outline-none focus:border-gold"
                    />
                    <input
                      type="time"
                      value={apptTime}
                      onChange={(e) => setApptTime(e.target.value)}
                      disabled={apptDone}
                      aria-label="진료 시각"
                      className="rounded-lg border border-navy/15 px-3 py-2.5 font-num text-[13px] outline-none focus:border-gold"
                    />
                  </div>
                  <input
                    value={apptMemo}
                    onChange={(e) => setApptMemo(e.target.value)}
                    disabled={apptDone}
                    placeholder="메모 (예: 공복 방문 · X-ray 예정)"
                    className="mt-1.5 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-[13px] outline-none focus:border-gold"
                  />
                  {/* 동행 여부 구분 — 컨시어지 동행이면 배차가 걸리고, 아니면 일정만 (실무진 2026-08-12) */}
                  <div className="mt-2.5 flex gap-1.5">
                    {[
                      [true, "컨시어지 동행"],
                      [false, "동행 없음 · 일정만"],
                    ].map(([v, label]) => (
                      <button
                        key={label}
                        disabled={apptDone}
                        onClick={() => setApptEscort(v)}
                        className={`btn-press flex-1 rounded-lg border py-2 text-[12.5px] font-bold ${
                          apptEscort === v ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {!apptDone && (!apptDate || apptDate < kstYmd(Date.now())) && (
                    <p className="mt-2 text-[11.5px] font-bold text-amber">{apptDate ? "지난 날짜는 등록할 수 없어요 — 병원에서 잡은 날짜를 골라 주세요" : "진료 날짜를 골라야 등록됩니다"}</p>
                  )}
                  <button
                    onClick={() => {
                      // 날짜 없이 '3주 뒤'로 지어 넣지 않는다 · 지난 날짜는 받지 않는다 · 시각은 한국 시간으로 (2026-10-19 점검 C-16 · F-21)
                      if (apptDone || !apptDate || apptDate < kstYmd(Date.now())) return;
                      setApptDone(true);
                      const at = new Date(`${apptDate}T${/^\d{2}:\d{2}$/.test(apptTime) ? apptTime : "09:30"}:00+09:00`);
                      dispatch({
                        type: "addEvent",
                        payload: {
                          id: `ev-${Date.now()}`,
                          kind: "nextAppt",
                          title: `${apptDept || "진료"} · ${apptHosp || "병원"}${apptEscort ? " (컨시어지 동행)" : ""}`,
                          at: at.getTime(),
                          source: "컨시어지 등록",
                          by: "concierge", // 수정 · 삭제 권한 (lib/event-rights.js)
                          byName: ME,
                          escort: apptEscort,
                          note: [
                            apptEscort
                              ? "병원 접수처에서 예약 확정 · 동행 배차 요청됨"
                              : "병원 접수처에서 예약 확정 · 일정 공유만 (동행 없음)",
                            apptMemo.trim(),
                          ]
                            .filter(Boolean)
                            .join(" · "),
                        },
                      });
                      dispatch({
                        type: "audit",
                        event: { kind: "check", label: "다음 진료 예약 등록 · 캘린더 공유" },
                      });
                      // '동행 배차 요청됨'을 실제로 — 관제 지금 처리할 일에 올린다 (전에는 글로만 적혔다 · C-16)
                      if (apptEscort) {
                        dispatch({
                          type: "addOpsMessage",
                          payload: { from: `컨시어지 ${ME}`, role: "concierge", kind: "dispatch", text: `다음 진료 동행 배차 요청 — ${apptDept || "진료"} · ${apptHosp || "병원"} · ${apptDate} ${apptTime || "09:30"}` },
                        });
                      }
                      push("예약", `다음 진료 예약 등록 · 보호자·어르신 캘린더 공유${apptEscort ? " · 관제에 동행 배차 요청" : ""}`, "#8FA9CC");
                    }}
                    disabled={apptDone || !apptDate || apptDate < kstYmd(Date.now())}
                    className={`btn-press mt-3 w-full rounded-xl border py-3 text-[15px] font-bold disabled:opacity-60 ${
                      apptDone ? "border-green/30 bg-green/10 text-green" : "border-navy bg-navy text-white"
                    }`}
                  >
                    {apptDone ? "✓ 등록됨 — 캘린더 공유" : "다음 예약 등록 (병원 확정분)"}
                  </button>
                  {apptDone && (
                    <button
                      onClick={() => (setApptDone(false), setApptDate(""), setApptMemo(""))}
                      className="btn-press mt-2 min-h-[40px] w-full rounded-lg border border-navy/15 text-[13px] font-bold text-muted"
                    >
                      다른 예약 하나 더 등록
                    </button>
                  )}
                  {/* 내가 등록한 진료 예약 — 병원 예약이 바뀌면 여기서 고치거나 지운다 (2026-10-18 · 전에는 등록만 되고 보이지도 않았다) */}
                  {(myAppts.length > 0 || othersRemoved.length > 0) && (
                    <div className="mt-3 border-t border-navy/[.08] pt-3">
                      <div className="text-[12px] font-bold text-muted">등록한 진료 예약 — 바뀌면 고치거나 지웁니다</div>
                      <ul className="mt-2 space-y-2">
                        {myAppts.map((e) => (
                          <ConciergeApptRow key={e.id} e={e} me={ME} onSave={(patch) => saveAppt(e, patch)} onRemove={() => removeAppt(e)} />
                        ))}
                        {othersRemoved.map((e) => (
                          <li key={`rm-${e.id}`} className="rounded-xl border border-dashed border-navy/20 px-3 py-2.5 text-[12.5px] text-muted">
                            <b className="text-navy">{josa(e.removed.by, "이", "가")} 지움</b> · {e.title} ·{" "}
                            <span className="font-num">{new Date(e.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                            {e.removed.reason ? ` · ${e.removed.reason}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>


                {/* 서비스 리커버리 — 실수는 숨기지 않고 회복한다 */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">서비스 리커버리</span>
                    <span className="text-[11px] font-bold text-muted">실수 · 불만이 있었을 때</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {RECOVERY_STEPS.map(([k, val]) => (
                      <div key={k} className="flex gap-2.5 text-[13px]">
                        <span className="w-[64px] shrink-0 font-bold text-gold">{k}</span>
                        <span className="flex-1 leading-[1.6] text-ink">{val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    리커버리는 감점이 아닙니다 — 보고를 미루는 것만 감점입니다. 무리한 진행 대신 취소
                    권한을 쓰세요.
                  </p>
                </Card>
              </>
            )}

            {/* ════ 리포트 — 방문 탭 안으로 들어왔다 (2026-08-21 시트 전체 1번) ════ */}
            {tab === "visit" && (
              <>
                {/* 방문 리포트 작성 — 방식 3가지 (2026-10-24 컨시어지 화면설계서 v3 §3-2). 자택 · 요양병원은 같은 21가지 점검 양식,
                    미팅(집 근처 카페)은 대화 · 생활 반응 · 몸 신호 양식. 처음 값은 가입 때 저장한 거주 형태, 고르면 가구 기록에 남아
                    관제 방문관리 · 보호자 리포트가 같은 방식을 본다 (실무자 피드백 2026-08-09 · 이원화 개발 명세) */}
                <Card className="p-[18px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[17px] font-black text-navy">방문 리포트 작성</span>
                    <span className="text-[13px] font-bold text-muted">{elderNameOf(state.onboarding)} 고객</span>
                  </div>
                  <ModePicker value={careLoc} onChange={setCareLoc} disabled={!!lock} />

                  {/* 잠금 · 반려 안내 — 제출한 리포트는 증명 기록이라 고치지 않는다 (2026-10-18) */}
                  {lock === "submitted" && (
                    <p role="status" className="mt-3 rounded-xl bg-navy/[.06] px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.6] text-navy">
                      제출한 리포트입니다 — 관제 검수 중에는 고칠 수 없습니다. 고칠 것이 있으면 &lsquo;관제에 알리기&rsquo;로 반려를 요청하세요.
                    </p>
                  )}
                  {lock === "sent" && (
                    <div role="status" className="mt-3 rounded-xl bg-green/10 px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.6] text-green">
                      보호자에게 발송된 리포트입니다 — 증명 기록이라 고칠 수 없습니다.
                      {!nextAsk ? (
                        <button onClick={() => setNextAsk(true)} className="btn-press mt-2 block min-h-[40px] w-full rounded-lg border border-green/40 bg-white text-[13px] font-bold text-navy">
                          다음 방문 기록 시작
                        </button>
                      ) : (
                        <span className="mt-2 block rounded-lg bg-white p-2.5 text-navy">
                          이번 기록은 그대로 보관되고(보호자도 계속 봅니다) 빈 점검표가 열립니다. 시작할까요?
                          <span className="mt-2 flex gap-1.5">
                            <button onClick={() => setNextAsk(false)} className="btn-press min-h-[40px] flex-1 rounded-lg border border-navy/15 text-[13px] font-bold text-muted">
                              그대로 두기
                            </button>
                            <button
                              onClick={() => {
                                dispatch({ type: "startNextVisit", by: ME });
                                push("방문", "다음 방문 기록 시작 — 지난 리포트는 보관", "#8FA9CC");
                                setNextAsk(false);
                              }}
                              className="btn-press min-h-[40px] flex-1 rounded-lg bg-navy text-[13px] font-bold text-white"
                            >
                              시작
                            </button>
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  {returned && (
                    <p role="alert" className="mt-3 rounded-xl bg-gold/15 px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.6] text-[#8A5D12]">
                      관제가 리포트를 되돌려 보냈습니다 — 사유: {returned.reason}. 고친 뒤 아래에서 다시 제출하세요.
                    </p>
                  )}

                  {!meetMode && (
                  <>
                  {/* 리포트 상단 카피 미리보기 — 보호자 앱 · 알림톡에 나가는 문장 (가입상담 시트 지정 문구 · lib/checkup.js) */}
                  <div className="mt-3 rounded-xl bg-navy p-3.5 text-[14.5px] font-bold leading-[1.6] text-white">
                    {headlineFor(careLoc, elderNameOf(state.onboarding))}
                    <span className="mt-1 block text-[11px] font-normal text-white/55">
                      리포트 상단 문장 — 체크가 끝나면 사진 · 15초 영상 메시지와 함께 나갑니다
                    </span>
                  </div>

                  {/* 21가지 점검 n / 21 — 몸 · 마음 · 집 각 7개 (설계서 v3 §3-3 · 요양병원도 같은 양식) */}
                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <span className="text-[16px] font-black text-navy">21가지 점검</span>
                    <span className="font-num text-[16px] font-black text-navy">
                      {checkCount} / {checkTotal}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-navy/[.08]" aria-hidden="true">
                    <div className="h-full rounded-full bg-green transition-[width]" style={{ width: `${checkTotal ? Math.round((checkCount / checkTotal) * 100) : 0}%` }} />
                  </div>
                  <div className="mt-3 space-y-3">
                    {checkupFor(careLoc).map((ax) => {
                      const done = ax.items.filter((i) => checkDone[`${ax.axis}-${i.k}`]).length;
                      return (
                        <div key={ax.axis} className="rounded-xl border border-navy/10 p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[14.5px] font-bold text-navy">
                              <Icon name={ax.icon} size={15} /> {ax.axis} 7가지
                            </span>
                            <span className="font-num text-[12px] font-bold text-muted">
                              {done} / 7
                            </span>
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {ax.items.map((i) => {
                              const key = `${ax.axis}-${i.k}`;
                              const on = !!checkDone[key];
                              const open = openItem === key;
                              const grade = (state.visit.grades || {})[key] || "";
                              return (
                                <div key={key}>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => dispatch({ type: "visitCheck", key, done: !on })}
                                      disabled={!!lock}
                                      title={requiredNames.has(i.k) ? "필수 점검 — 빠지면 리포트를 제출할 수 없습니다" : undefined}
                                      className={`btn-press btn-inline btn-chip shrink-0 rounded-full border px-2.5 py-1.5 text-[12px] font-bold ${
                                        on ? "border-green/40 bg-green/10 text-green" : "border-navy/15 text-muted"
                                      }`}
                                    >
                                      {on ? "✓ " : ""}
                                      {i.k}
                                      {/* 필수 — 빠지면 제출할 수 없다 (관제 검수와 같은 기준 · 2026-10-19 점검 C-01) */}
                                      {/* 이름은 항목 그대로 두고(읽기 · 찾기), '필수'는 보이는 표시 + 설명(title)으로 */}
                                      {requiredNames.has(i.k) && (
                                        <span aria-hidden="true" className="ml-1 text-[10.5px] font-black text-[#8A5D12]">
                                          필수
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setOpenItem(open ? null : key)}
                                      aria-expanded={open}
                                      className={`btn-press btn-inline btn-chip flex-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-left text-[11.5px] ${
                                        itemNote[key] ? "text-ink" : "text-muted/70"
                                      }`}
                                    >
                                      {grade && (
                                        <span
                                          className="mr-1.5 rounded-full px-1.5 py-[1px] text-[10.5px] font-bold"
                                          style={{ background: RESULT_TONE[grade]?.bg, color: RESULT_TONE[grade]?.fg }}
                                        >
                                          {grade}
                                        </span>
                                      )}
                                      {itemNote[key] || (grade ? "" : requiredNames.has(i.k) ? "필수 · 내용 적기" : "내용 적기")}
                                    </button>
                                  </div>
                                  {/* 상태 — 컨시어지가 고른 것만 리포트에 간다 (2026-10-02). 고르지 않아도 된다 */}
                                  {open && (
                                    <div className="animate-tickIn mt-1.5 flex flex-wrap items-center gap-1.5" role="group" aria-label={`${i.k} 상태`}>
                                      <span className="text-[11px] font-bold text-muted">상태 (선택)</span>
                                      {VISIT_GRADES.map((g) => (
                                        <button
                                          key={g}
                                          type="button"
                                          aria-pressed={grade === g}
                                          disabled={!!lock}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => dispatch({ type: "visitGrade", key, grade: grade === g ? "" : g })}
                                          className="btn-press btn-inline btn-chip rounded-full border px-3 py-1.5 text-[12px] font-bold"
                                          style={
                                            grade === g
                                              ? { background: RESULT_TONE[g].bg, color: RESULT_TONE[g].fg, borderColor: RESULT_TONE[g].dot }
                                              : { borderColor: "rgba(10,31,60,.15)", color: "#5C5A54" }
                                          }
                                        >
                                          {g}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {open && (
                                    <textarea
                                      autoFocus
                                      rows={2}
                                      value={itemNote[key] || ""}
                                      onChange={(e) => setItemDraft((s) => ({ ...s, [key]: e.target.value }))}
                                      onBlur={() => saveItemNote(key)}
                                      readOnly={!!lock}
                                      placeholder={`${i.k} — ${i.w}`}
                                      className="animate-tickIn mt-1.5 w-full resize-none rounded-lg border border-gold/50 px-2.5 py-2 text-[13px] leading-[1.6] outline-none"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-[11px] leading-[1.6] text-muted/80">{ax.note}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* 총평 메모 + 사진 — 항목별 기록 아래에 전체를 본 소감 (실무진 2026-08-12) */}
                  <div className="mt-3.5 rounded-xl border border-navy/12 p-3.5">
                    <SectionLabel>총평 — 전체적으로 본 것</SectionLabel>
                    <textarea
                      rows={3}
                      value={summaryNote}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      onBlur={saveSummary}
                      readOnly={!!lock}
                      aria-label="총평"
                      placeholder="항목으로 나눠 적기 어려운 것, 지난달과 달라진 인상, 보호자께 꼭 전할 말을 적습니다."
                      className="mt-2 w-full resize-none rounded-lg border border-navy/15 px-3 py-2.5 text-[13.5px] leading-[1.7] outline-none focus:border-gold"
                    />
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] font-bold text-muted">사진</span>
                      {photos.map((ph) => (
                        <span key={ph} className="rounded-lg bg-green/10 px-2.5 py-1.5 text-[11.5px] font-bold text-green">
                          ✓ {ph}
                        </span>
                      ))}
                      {!lock && (
                        <button
                          onClick={() => dispatch({ type: "visitPhoto" })}
                          className="btn-press btn-inline btn-chip rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-navy"
                        >
                          + 사진 첨부 (데모)
                        </button>
                      )}
                      {!lock && photos.length > 0 && (
                        <button
                          onClick={() => dispatch({ type: "visitPhoto", remove: true })}
                          className="btn-press btn-inline btn-chip rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-muted"
                        >
                          − 마지막 사진 빼기
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 제출하면 관제가 검수한 뒤 보호자에게 간다 — '자동 발행'이 아니다 (2026-10-24 설계서 v3 §3-6) */}
                  <p className="mt-2.5 text-[12px] leading-[1.65] text-muted">
                    필수 5개를 채우고 총평을 적으면 제출할 수 있어요 — 관제가 검수한 뒤 사진과 함께 보호자에게 갑니다.
                    점수가 아니라 지난달과 달라진 것을 적습니다.
                  </p>
                  </>
                  )}
                  {/* 보호자께 부탁드려요 · 어르신께 남길 말 · 내부 메모 (자택 · 요양병원) / 미팅 양식 (설계서 v3 §3-3 · 3-4) */}
                  <div className="mt-3.5 flex flex-col gap-3">
                    {meetMode ? (
                      <MeetForm visit={v} dispatch={dispatch} lock={lock} sensors={demoSensors} period={meetSpan} />
                    ) : (
                      <HomeTextCards visit={v} dispatch={dispatch} lock={lock} />
                    )}
                  </div>
                </Card>

                {/* 동행 완료 리포트 — AI 초안 + 발행 전 미리보기 (2인 서명은 2026-08-12 삭제) */}
                <Card className="p-[18px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[17px] font-black text-navy">동행 완료 리포트</span>
                    <Link
                      href="/report/visit"
                      className="btn-press rounded-[10px] border border-navy/20 px-3 py-1.5 text-[12px] font-bold text-navy"
                    >
                      A4 인쇄본
                    </Link>
                    <span className="chip-gold rounded-full px-2.5 py-1 text-[11px] font-bold">
                      {live ? "AI 초안 예시 · 음성 기록 연동 전" : "AI 초안 · 음성 기록 기반"}
                    </span>
                  </div>
                  <div
                    className="mt-3 rounded-xl p-3.5 text-[15px] leading-[1.75] text-ink"
                    style={{
                      background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
                    }}
                  >
                    {AI_REPORT.draft}
                  </div>
                  <p className="mt-2 text-[12px] leading-[1.65] text-muted">{AI_REPORT.hitl}</p>

                  {/* 동행 리포트 작성란 (2026-08-21 시트 컨시어지 레포트 1·2번).
                      전에는 AI 초안만 있고 컨시어지가 직접 쓸 칸이 없었다. 초안은
                      출발점이고, 현장에서 본 것은 사람이 적어야 한다.
                      녹화 여부는 나중에 분쟁이 났을 때 "영상이 있느냐"를 먼저 보기
                      때문에 리포트에 같이 남긴다 (REQ-12 방문기록 모드). */}
                  <div className="mt-3.5 rounded-xl border border-navy/12 p-3.5">
                    {/* 안심방문 리포트를 낸 뒤에는 동행 기록도 잠긴다 — 같이 낸 기록이 관제 검수 없이 바뀌어 보호자에게 가지 않게 (2026-10-19 점검 C-02) */}
                    {lock && !escort.sentAt && (
                      <p role="status" className="mb-2 rounded-lg bg-amber/10 px-3 py-2 text-[12px] font-bold leading-[1.6] text-amber">
                        {lock === "sent"
                          ? "이번 방문 리포트는 보호자에게 보냈습니다 — 다음 동행 기록은 '다음 방문 시작' 뒤에 적습니다."
                          : "방문 리포트를 제출해 관제가 검수 중입니다 — 동행 기록은 지금 고칠 수 없습니다 (반려되어 돌아오면 고칩니다)."}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <SectionLabel>동행 기록 — 직접 작성</SectionLabel>
                      {/* 테스트 가구에서는 예시 초안을 불러오지 않는다 — 그대로 보내면 지어낸 동행이 보호자에게 실제 기록으로 간다 */}
                      {!live && !escortShowSaved && (
                        <button
                          onClick={() => setEscortNote(AI_REPORT.draft)}
                          className="btn-press btn-inline btn-chip ml-auto rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-navy"
                        >
                          AI 초안 불러오기
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={escortNote}
                      readOnly={escortShowSaved || !!lock}
                      aria-label="동행 기록"
                      onChange={(e) => setEscortNote(e.target.value)}
                      placeholder="접수·진료·수납에서 있었던 일, 의료진이 하신 말씀 그대로, 다음 진료까지 챙길 것을 적습니다. 판단·진단은 적지 않습니다."
                      className="mt-2 w-full resize-none rounded-lg border border-navy/15 px-3 py-2.5 text-[13.5px] leading-[1.7] outline-none focus:border-gold"
                    />
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] font-bold text-muted">사진</span>
                      {escortPhotos.map((ph) => (
                        <span
                          key={ph}
                          className="rounded-lg bg-green/10 px-2.5 py-1.5 text-[11.5px] font-bold text-green"
                        >
                          ✓ {ph}
                        </span>
                      ))}
                      <button
                        onClick={() => setEscortPhotos((v) => [...v, `동행사진_${v.length + 1}.jpg`])}
                        disabled={escortShowSaved}
                        className="btn-press btn-inline btn-chip rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-navy"
                      >
                        + 사진 첨부 (데모)
                      </button>
                      {!escortShowSaved && escortPhotos.length > 0 && (
                        <button
                          onClick={() => setEscortPhotos((v) => v.slice(0, -1))}
                          className="btn-press btn-inline btn-chip rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-muted"
                        >
                          − 마지막 사진 빼기
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setEscortRecorded((v) => !v)}
                      disabled={escortShowSaved}
                      aria-pressed={escortRecorded}
                      className={`btn-press mt-2.5 flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-bold ${
                        escortRecorded ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] text-[12px]"
                        style={{
                          background: escortRecorded ? "#1E7A5A" : "rgba(10,31,60,.08)",
                          color: escortRecorded ? "#fff" : "transparent",
                        }}
                      >
                        ✓
                      </span>
                      {escortRecorded ? "영상 녹화함 — 방문기록에 연결됨" : "이번 동행에서 영상을 녹화했습니까?"}
                    </button>
                    <p className="mt-2 text-[11px] leading-[1.6] text-muted">
                      녹화하지 않았다면 체크하지 마세요. 없는 영상을 있다고 표시하면 분쟁 때 더
                      불리해집니다.
                    </p>
                    <button
                      onClick={() => {
                        if (!escortNote.trim() || escortShowSaved || lock) return;
                        dispatch({
                          type: "escortSave",
                          payload: { note: escortNote.trim(), photos: escortPhotos.length, recorded: escortRecorded, by: ME },
                        });
                        push(
                          "리포트",
                          `${escortEditing ? "동행 기록 수정" : "동행 기록 저장"} — 사진 ${escortPhotos.length}장${escortRecorded ? " · 영상 있음" : ""}`,
                          "#8FA9CC"
                        );
                        setEscortEditing(false);
                      }}
                      disabled={!escortNote.trim() || escortShowSaved || !!lock}
                      className={`btn-press mt-2.5 w-full rounded-xl border py-3 text-[15px] font-bold disabled:opacity-40 ${
                        escortShowSaved ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                      }`}
                    >
                      {escortShowSaved ? (escort.sentAt ? "✓ 동행 기록 — 보호자에게 전달됨" : "✓ 동행 기록 저장됨") : escortEditing ? "고친 동행 기록 저장" : "동행 기록 저장"}
                    </button>
                    {/* 고치기 — 리포트를 내기 전까지 (냈으면 관제 반려로 돌아왔을 때). 보호자에게 간 뒤에는 증명 기록이라 잠근다 */}
                    {escortShowSaved && !escort.sentAt && !aiSent && (
                      <button onClick={startEscortEdit} className="btn-press mt-2 min-h-[40px] w-full rounded-lg border border-navy/15 text-[13px] font-bold text-navy">
                        동행 기록 고치기
                      </button>
                    )}
                    {escortEditing && (
                      <button onClick={() => setEscortEditing(false)} className="btn-press mt-2 min-h-[40px] w-full rounded-lg border border-navy/15 text-[13px] font-bold text-muted">
                        그만두기 (저장한 기록 그대로)
                      </button>
                    )}
                  </div>

                  {/* 2인 확인 서명은 삭제했다 (2026-08-12 대표 피드백).
                      배차가 위험도 기반으로 바뀌어 1인 방문이 생겼고, 1인 방문에는
                      애초에 두 번째 서명이 존재하지 않는다. 대신 발행 전 미리보기로
                      본인이 직접 확인하고 고치는 절차를 둔다 — 미리보기는 아래 제출 줄의 '미리보기' 시트
                      (보호자 리포트 · 어르신 앱 · 관제 · 2026-10-24 설계서 v3 §3-5) */}
                  <p className="mt-3.5 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">{AI_REPORT.signRule}</p>

                  <button
                    onClick={() => {
                      if (pdfIssued) return;
                      setPdfIssued(true);
                      push("리포트", "증빙 보고서 PDF 발행 (데모)", "#8FA9CC");
                    }}
                    className={`btn-press mt-3 w-full rounded-xl border py-3 text-[15px] font-bold ${
                      pdfIssued ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                    }`}
                  >
                    {pdfIssued ? "✓ 증빙 보고서 발행됨 (데모)" : "증빙 보고서 발행 · PDF"}
                  </button>
                </Card>

                {/* 제출 줄 — [미리보기] [리포트 제출] (설계서 v3 §3-3 7번 · 3-6). 방문 리포트와 저장한 동행 기록을 같이 낸다 —
                    가족에게 가는 것은 관제가 검수하고 '보호자 리포트 발송'을 누를 때다 (2026-10-02 QA). 제출 → 관제 검수 중 → 가족에게 발송됨 */}
                <div className="flex flex-col gap-1.5">
                  <SendRow
                    stage={sendStage}
                    canSubmit={canSubmitReport}
                    onSubmit={submitReport}
                    onPreview={() => setPreview(true)}
                    glow={sentGlow}
                    label={
                      escortOnly
                        ? "동행 기록 제출"
                        : missingRequired.length > 0
                          ? `필수 ${missingRequired.length}개 남음`
                          : (meetMode ? !meetReady : !hasSummary)
                            ? "총평을 적어 주세요"
                            : v.returned
                              ? "다시 제출"
                              : "리포트 제출"
                    }
                  />
                  {!aiSent && missingRequired.length > 0 && (
                    <p className="text-[12px] leading-[1.6] text-[#8A5D12]">
                      {escortOnly
                        ? "방문 점검 없이 동행만 한 날 — 동행 기록만 제출되고, 관제가 동행 리포트를 따로 보냅니다. 방문 점검을 시작하면 필수 점검을 모두 채워야 제출됩니다."
                        : `필수 점검 ${missingRequired.length}개가 남았습니다 (${missingRequired.join(" · ")}) — 관제 검수와 같은 기준이라 채워야 제출됩니다.`}
                    </p>
                  )}
                  {!aiSent && missingRequired.length === 0 && (meetMode ? !meetReady : !hasSummary) && (
                    <p className="text-[12px] leading-[1.6] text-[#8A5D12]">
                      {meetMode
                        ? "보호자에게 갈 총평이 비어 있습니다 — 위 종합 칸에 이번 주를 한두 줄 적어 주세요."
                        : "보호자에게 갈 총평(또는 동행 기록)이 비어 있습니다 — 위 총평 칸에 오늘 본 것을 한두 줄 적어 주세요."}
                    </p>
                  )}
                  {sendStage !== "open" && (
                    <p className="text-[12px] leading-[1.6] text-muted">
                      {sendStage === "sent" ? "보호자 앱 · 어르신 홈에 갔습니다 — 보낸 리포트는 증명 기록이라 고치지 않습니다." : "관제가 검수하면 보호자 앱으로 갑니다 — 검수 중에는 고칠 수 없어요."}
                    </p>
                  )}
                </div>

                {/* 리포트 누적 — 본인 전체 · 타인 공유분만 */}
                <SectionLabel>리포트 기록</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-3">
                    {state.reports.map((r) => {
                      const mine = r.by === ME;
                      return (
                        <div key={r.id} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-navy">{r.by}</span>
                            <span className="font-num text-[11px] text-muted">
                              {new Date(r.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                              {" · 특이 "}
                              {r.flagged}건
                            </span>
                            <span className="ml-auto flex gap-1">
                              <Badge fg={r.shared ? "#1E7A5A" : "#5C5A54"} bg={r.shared ? "rgba(30,122,90,.12)" : "rgba(92,90,84,.1)"}>
                                {r.shared ? "보호자 공유" : "내부 전용"}
                              </Badge>
                              {!mine && (
                                <Badge fg="#8A5D12" bg="rgba(138,93,18,.1)">
                                  공유분만
                                </Badge>
                              )}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] leading-[1.65] text-ink">
                            {mine || r.shared ? r.note || r.kind || "" : "비공개 리포트 — 작성자만 열람"}
                          </p>
                          {mine && r.secretNote && (
                            <p className="mt-1 rounded-lg bg-navy/[.05] px-2.5 py-1.5 text-[12px] text-muted">
                              🔒 내부 메모: {r.secretNote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 border-t border-navy/10 pt-2.5 text-[11px] leading-[1.6] text-muted">
                    본인이 만든 리포트는 전체가, 다른 컨시어지 리포트는 공유된 부분만 보입니다.
                  </p>
                </Card>
              </>
            )}

            {/* ════ 제안 탭 ════ */}
            {tab === "suggest" && (
              <>
                {/* 제안 받을 사람 · 제안 일정 — 아래 모든 제안에 같이 붙는다 (2026-10-05 "승인대상자는 컨시어지가 정한다") */}
                <Card className="p-4">
                  <div className="text-[15px] font-black text-navy">제안 보내기 설정</div>
                  <p className="mt-0.5 text-[11.5px] leading-[1.6] text-muted">누가 수락할지, 언제 해 드릴지 정하고 아래에서 제안하세요. 수락되면 확정됩니다 (금액이 있으면 수락한 분이 결제한 뒤 — 어르신은 가족에게 결제를 부탁할 수도 있어요).</p>
                  <div className="mt-2.5 flex gap-1.5" role="radiogroup" aria-label="수락할 분">
                    {[["guardian", "보호자"], ["elder", "어르신"]].map(([k, l]) => (
                      <button
                        key={k}
                        role="radio"
                        aria-checked={propTo === k}
                        onClick={() => setPropTo(k)}
                        className={`btn-press flex-1 rounded-xl border py-2.5 text-[13px] font-bold ${propTo === k ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"}`}
                      >
                        {l}이 수락
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block text-[11px] font-bold text-muted">
                      제안 날짜
                      <input type="date" value={propDate} min={kstYmd(Date.now())} onChange={(e) => setPropDate(e.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold" />
                    </label>
                    <label className="block text-[11px] font-bold text-muted">
                      시간
                      <input type="time" value={propTime} onChange={(e) => setPropTime(e.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold" />
                    </label>
                  </div>
                  {propTo === "elder" && (
                    <p className="mt-2 text-[11.5px] leading-[1.6] text-muted">어르신이 수락하면 결제 대기로 넘어가고, 어르신이 직접 결제하시거나 '가족에게 결제 부탁'을 누르시면 가족이 결제합니다.</p>
                  )}
                  <label className="mt-2 block text-[11px] font-bold text-muted">
                    2인 1조 서비스의 짝 (든든 병원동행 · 함께가요)
                    <select
                      value={propPartner}
                      onChange={(e) => setPropPartner(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-2.5 py-2 text-[14px] text-ink outline-none focus:border-gold"
                    >
                      <option value="">{propMates.length ? "짝을 고르세요 — 2인 서비스 제안에만 붙습니다" : "함께 갈 컨시어지가 없습니다"}</option>
                      {propMates.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </Card>

                {/* 케어 제안 — 제안은 반드시 근거(trigger)를 동반 (도메인 규칙 1.1) */}
                <SectionLabel>케어 제안</SectionLabel>
                {/* 예시 제안은 예시 관찰 기록(욕실 위험물 2회 …)을 근거로 단다 — 관제 센터 공간의 새 어르신에게는 근거가 없다 (2026-10-06 누수 점검) */}
                {center && (
                  <Card className="p-4">
                    <p className="text-[13px] leading-[1.7] text-muted">
                      아직 근거가 될 관찰 기록이 없습니다 — 안심방문 리포트에 관찰이 쌓이면 근거를 달아 제안할 수 있습니다. 아래 서비스 · 복지혜택 제안은 지금도 보낼 수 있습니다.
                    </p>
                  </Card>
                )}
                {(center ? [] : CARE_SUGGESTIONS).map((sg) => (
                  <Card key={sg.item} className="p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[16px] font-bold text-navy">{sg.item}</span>
                      <span className="font-num text-[13px] text-muted">예상 {fmtWon(sg.est)}</span>
                    </div>
                    <div className="mt-1 text-[12px] font-bold text-amber">{sg.trigger}</div>
                    <button
                      onClick={() => {
                        if (suggested[sg.item]) return;
                        setSuggested((x) => ({ ...x, [sg.item]: true }));
                        dispatch({
                          type: "addRequest",
                          payload: withProposal({
                            id: `rq-${Date.now()}`,
                            type: `케어 제안 · ${sg.item}`,
                            detail: `${sg.trigger}. 필요하시면 결제 후 다음 방문 때 가져다 드립니다 (배송비 무료).`,
                            amount: sg.est,
                            preferredDate: null,
                            urgency: "normal",
                            assignee: ME,
                            photos: [],
                            status: "requested",
                            history: [{ at: Date.now(), status: "requested", note: "관찰 근거 기반 제안" }],
                            proof: null,
                          }),
                        });
                        push("제안", `케어 제안 전송 · ${sg.item} (근거 동반) — ${propLabel} 수락 대기`, "#B08D57");
                      }}
                      disabled={!!suggested[sg.item]}
                      className={`btn-press mt-2.5 w-full rounded-xl border py-2.5 text-[13px] font-bold ${
                        suggested[sg.item]
                          ? "border-green/30 bg-green/10 text-green"
                          : "border-navy/20 text-navy"
                      }`}
                    >
                      {suggested[sg.item] ? "제안 전송됨" : `${propLabel}에게 제안 보내기`}
                    </button>
                  </Card>
                ))}
                <p className="px-1 text-[11px] leading-[1.7] text-muted">
                  근거 없는 제안은 보낼 수 없습니다. 제안·판매 실적은 평가와 보상에 반영되지
                  않습니다 (원칙 1).
                </p>

                {/* 복지혜택 제안 — 나라·지자체 지원 (2026-09-04 시트 앱 전체 3번).
                    관제가 자동 매칭한 것을 현장에서 확인해 보호자에게 제안한다. 판매가
                    아니라 공공지원 우선 연결이라 실적과 무관하다 (04_정책분류 우선연결 원칙). */}
                <SectionLabel>복지혜택 제안 — {ELDER.name} 님 댁</SectionLabel>
                <Card className="p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {/* 47 이 어디서 왔는지 같이 적는다 — 판정 79건 중 '낮음'을 뺀 것 (2026-10-02 QA "47 vs 79") */}
                    <span className="text-[14px] font-bold text-navy">제안할 것 {welfareN.high + welfareN.check}건</span>
                    <span className="font-num text-[12px] text-muted">
                      판정 {welfareN.high + welfareN.check + welfareN.low}건 중 높음 {welfareN.high} + 추가확인 {welfareN.check} (낮음 {welfareN.low}건 제외)
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.6] text-muted">
                    소득·수급·주거는 보호자가 답해야 확정됩니다 — 방문 때 여쭤보고 보호자 앱에서 답하시게 안내하세요.
                    공공지원을 먼저 잇고, 없을 때 해주세요 PLUS · 민간 순서입니다.
                  </p>
                  <div className="mt-3">
                    <WelfareList
                      matches={welfareMatches}
                      statuses={state.welfare?.status}
                      hideLow
                      pageSize={4}
                      onSend={(m) => {
                        setWelfareSent((s) => ({ ...s, [m.policy.id]: true }));
                        dispatch({
                          type: "addRequest",
                          payload: withProposal({
                            id: `rq-${Date.now()}`,
                            type: `복지혜택 제안 · ${m.policy.name}`,
                            detail: `${m.policy.summary} — ${m.policy.value}. ${m.verdict} · 확인할 것: ${m.checks}. 신청: ${m.policy.apply}`,
                            amount: 0,
                            preferredDate: null,
                            urgency: "normal",
                            assignee: ME,
                            photos: [],
                            status: "requested",
                            history: [{ at: Date.now(), status: "requested", note: "컨시어지 현장 제안 · 공공지원 우선" }],
                            proof: null,
                          }),
                        });
                        dispatch({ type: "welfareStatus", id: m.policy.id, status: "자격확인", by: "컨시어지" });
                        push("복지", `복지혜택 제안 — ${m.policy.name} (${m.verdict})`, "#F0D9A8");
                      }}
                      sendLabel={`${propLabel}에게 제안`}
                      sent={welfareSent}
                    />
                  </div>
                </Card>

                {/* 안전용품 제안 — 보호자·어르신 스토어와 같은 카탈로그(lib/store.js)를 그대로 쓴다.
                    스토어는 생활안전용품만 판다 (2026-10-02 운영 결정). 분류가 하나면 고르는 줄을 감춘다. */}
                <SectionLabel>안전용품 제안 — 스토어 전 품목</SectionLabel>
                <Card className="p-4">
                  {STORE_CATALOG.length > 1 && (
                  <div className="relative -mx-1">
                    <div className="flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                      {STORE_CATALOG.map((c) => {
                        const on = shopCat === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setShopCat(c.id)}
                            aria-pressed={on}
                            className={`btn-press min-h-[34px] shrink-0 whitespace-nowrap rounded-[10px] border px-3 text-[12px] font-bold ${
                              on ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-0 w-8"
                      style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.95))" }}
                    />
                  </div>
                  )}
                  <div className={`${STORE_CATALOG.length > 1 ? "mt-3" : ""} space-y-3`}>
                    {(STORE_CATALOG.find((c) => c.id === shopCat) || STORE_CATALOG[0]).groups.map((g) => (
                      <div key={g.name}>
                        <div className="text-[12px] font-bold text-muted">{g.name}</div>
                        <div className="mt-1.5 space-y-1.5">
                          {g.items.map((i) => {
                            const on = !!shopSel[i.id];
                            const off = !i.price;
                            return (
                              <button
                                key={i.id}
                                disabled={off || shopSent}
                                onClick={() => setShopSel((s) => ({ ...s, [i.id]: !s[i.id] }))}
                                className={`btn-press flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left disabled:opacity-55 ${
                                  on ? "border-gold bg-gold/10" : "border-navy/12"
                                }`}
                              >
                                <span
                                  className={`inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded border text-[11px] font-bold ${
                                    on ? "border-gold bg-gold text-navy" : "border-navy/25 text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="min-w-0 flex-1 text-[13px] font-bold text-ink">{i.name}</span>
                                <span className="shrink-0 font-num text-[12px] font-bold text-navy">
                                  {i.price ? fmtWon(i.price) : i.pending}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const items = SHOP_ALL.filter((i) => shopSel[i.id]);
                    const est = items.reduce((s, i) => s + (i.price || 0), 0);
                    if (shopSent) {
                      return (
                        <div className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3">
                          <p className="text-[13px] font-bold text-green">
                            {propLabel}에게 제안을 보냈습니다 — 수락 · 결제되면 확정되고, 오늘 탭 &lsquo;확정된 것&rsquo;에서 진행합니다. 수락 전에는
                            오늘 탭 &lsquo;보낸 제안&rsquo;에서 고치거나 철회할 수 있습니다.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShopSel({});
                              setShopSent(false);
                            }}
                            className="btn-press mt-2 rounded-lg border border-navy/15 bg-white px-3 py-2 text-[12.5px] font-bold text-navy"
                          >
                            다른 물품 새로 담기
                          </button>
                        </div>
                      );
                    }
                    if (items.length === 0) {
                      return (
                        <p className="mt-3 text-[12px] text-muted">
                          물품을 담으면 예상금액과 함께 {propLabel}에게 제안이 갑니다.
                        </p>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          setShopSent(true);
                          dispatch({
                            type: "addRequest",
                            payload: withProposal({
                              id: `rq-${Date.now()}`,
                              type: "안전용품 제안",
                              detail: `안전용품: ${items.map((i) => i.name).join(", ")} — 결제가 끝나면 다음 방문 때 가져다 드립니다 (배송비 무료).`,
                              amount: est,
                              preferredDate: null,
                              urgency: "normal",
                              assignee: ME,
                              photos: [],
                              history: [{ at: Date.now(), status: "requested", note: `안전용품 제안 · 예상 금액 ${fmtWon(est)}` }],
                              proof: null,
                            }),
                          });
                          dispatch({
                            type: "audit",
                            event: { kind: "request", label: `안전용품 결제 승인 요청 · ${items.length}개 품목` },
                          });
                          push("구매", `안전용품 ${items.length}건 제안 · ${fmtWon(est)} — ${propLabel} 수락 대기`, "#B08D57");
                        }}
                        className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white"
                      >
                        {propLabel}에게 제안 · 예상 {fmtWon(est)}
                      </button>
                    );
                  })()}
                  {purchasing.length > 0 && (
                    <div className="mt-3 border-t border-navy/10 pt-3">
                      <SectionLabel>구매 진행중 — 완료사진</SectionLabel>
                      {purchasing.map((r) => (
                        <div key={r.id} className="mt-2 flex items-center gap-2">
                          <span className="flex-1 text-[13px] font-bold text-ink">{svcTitle(r.type)}</span>
                          <button
                            onClick={() => {
                              dispatch({
                                type: "transitionRequest",
                                id: r.id,
                                to: "done",
                                note: "구매 완료 · 완료사진 첨부 (데모)",
                              });
                              dispatch({
                                type: "audit",
                                event: { kind: "photo", label: "구매대행 완료사진 업로드" },
                              });
                            }}
                            className="btn-press rounded-lg border border-green/40 px-3 py-1.5 text-[12px] font-bold text-green"
                          >
                            완료사진 + 종결
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 해주세요 제안 — 전 품목 (2026-08-21 시트 컨시어지 제안 1번).
                    현장에서 필요한 서비스를 보호자에게 그대로 제안한다. 단가는
                    해주세요 카탈로그(lib/requests.js)가 유일한 출처다. */}
                <SectionLabel>해주세요 제안 — 전 품목</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-1.5">
                    {SERVICE_MENU.map((m) => {
                      const on = pendingProposals.has(m.name);
                      const two = crewOf({ type: m.name }) === 2;
                      const noMate = two && !propPartner;
                      return (
                        <button
                          key={m.no}
                          disabled={!m.active || on || noMate}
                          onClick={() => {
                            if (on || noMate) return;
                            dispatch({
                              type: "addRequest",
                              payload: withProposal({
                                id: `rq-${Date.now()}`,
                                type: m.name,
                                detail: `컨시어지 제안 — ${m.scope}`,
                                amount: m.amount ?? null,
                                // 이용 시간이 있는 서비스는 기본 시간으로 제안한다 — 금액이 기본 금액과 맞게 (2026-10-22 · lib/booking.js)
                                ...(m.dur ? { durationMin: m.dur.min } : {}),
                                preferredDate: null,
                                urgency: "normal",
                                assignee: ME,
                                ...(two ? { partner: propPartner } : {}),
                                photos: [],
                                status: "requested",
                                history: [
                                  { at: Date.now(), status: "requested", note: "컨시어지 현장 제안" },
                                ],
                                proof: null,
                              }),
                            });
                            push("제안", `${m.name} 제안 — ${propLabel} 수락 대기`, "#B08D57");
                          }}
                          className={`btn-press flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left disabled:opacity-60 ${
                            on ? "border-green/30 bg-green/5" : "border-navy/12"
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-bold text-ink">{m.title || m.name}</span>
                            <span className="mt-0.5 block text-[11.5px] leading-[1.5] text-muted">
                              {m.active ? m.priceLabel : "곧 시작합니다"}
                              {m.active && two ? (propPartner ? ` · 짝 ${propPartner}` : " · 위에서 짝을 먼저 고르세요") : ""}
                            </span>
                          </span>
                          <span className="shrink-0 text-[11.5px] font-bold text-green">
                            {on ? "제안됨 · 수락 대기" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    제안은 위에서 고른 분({propLabel})이 수락해야 진행됩니다. 수락 전에는 오늘 탭 &lsquo;해주세요 › 보낸 제안&rsquo;에서 고치거나 철회할 수
                    있습니다. 판매 실적은 평가에 넣지 않습니다 (원칙 1).
                  </p>
                </Card>

                {/* 컨시어지 요청 — 해주세요와 스토어를 하나로 묶어 보호자 홈에
                    "컨시어지 요청"으로 뜬다 (2026-08-12 실무진). 프리셋 칩(요청 예시)은
                    같은 요청으로 삭제했다 — 현장에서 직접 쓰는 편이 정확하다.
                    시트 제안 2번 "제안 하단에 컨시어지 요청은 꼭 남겨주세요" — 그대로 둔다. */}
                <SectionLabel>컨시어지 요청 — 보호자 홈에 표시</SectionLabel>
                <Card className="p-4">
                  <textarea
                    rows={3}
                    value={reqText}
                    aria-label="컨시어지 요청 내용"
                    onChange={(e) => {
                      setReqText(e.target.value);
                      setReqSent(false);
                    }}
                    placeholder="현장에서 확인한 내용을 그대로 적습니다. 물품이 필요하면 품목과 수량까지 함께 적어 주세요."
                    className="w-full resize-none rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] leading-[1.65] outline-none focus:border-gold"
                  />
                  <button
                    disabled={!reqText.trim()}
                    onClick={() => {
                      dispatch({
                        type: "addRequest",
                        payload: withProposal({
                          id: `rq-${Date.now()}`,
                          type: "컨시어지 요청",
                          detail: reqText.trim(),
                          amount: null,
                          preferredDate: null,
                          urgency: "normal",
                          assignee: ME,
                          photos: [],
                          status: "requested",
                          history: [{ at: Date.now(), status: "requested", note: "컨시어지 현장 등록" }],
                          proof: null,
                        }),
                      });
                      dispatch({ type: "audit", event: { kind: "request", label: "컨시어지 요청 등록" } });
                      // 보낸 글은 비운다 — 같은 요청이 두 번 가지 않게. 고치기 · 철회는 오늘 탭 '보낸 제안'에서
                      setReqText("");
                      setReqSent(true);
                    }}
                    className="btn-press mt-2.5 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white disabled:opacity-40"
                  >
                    {`${propLabel}에게 요청 보내기`}
                  </button>
                  {reqSent && (
                    <p role="status" className="mt-2 rounded-xl border border-green/25 bg-green/5 p-2.5 text-[12.5px] font-bold text-green">
                      ✓ {propLabel}에게 전달했습니다 — 수락 전에는 오늘 탭 &lsquo;해주세요 › 보낸 제안&rsquo;에서 고치거나 철회할 수 있습니다.
                    </p>
                  )}
                  <p className="mt-3 text-[11px] leading-[1.6] text-muted">
                    등록한 요청은 보호자 홈에 &lsquo;컨시어지 요청&rsquo;으로 뜨고, 상태가 함께
                    표시됩니다. 성과 지표에 판매액은 기록되지 않습니다.
                  </p>
                </Card>
              </>
            )}


            {/* ════ 정산 탭 — MY EARNINGS (원칙 준수 버전) ════ */}
            {false && tab === "pay" && (
              <>
                <div className="px-1">
                  <div className="font-num text-[11px] font-bold tracking-[.18em] text-gold">
                    MY EARNINGS · {EARNINGS.week}
                  </div>
                </div>

                {/* 주간 확정 수익 — 네이비 카드 */}
                <div
                  className="card-navy border-grad-dark rounded-card bg-navy p-[18px] text-white"
                  style={{
                    backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0))",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,.16), inset 0 0 0 1px rgba(255,255,255,.05), 0 18px 36px -24px rgba(10,31,60,.8)",
                  }}
                >
                  <div className="text-[12px] font-bold tracking-[.1em] text-gold-soft">
                    이번 주 확정 수익
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-num text-[38px] font-bold leading-none">
                      {EARNINGS.total}
                    </span>
                    <span className="text-[15px] text-white/70">원</span>
                  </div>
                  <div className="mt-1.5 text-[12px] text-white/60">{EARNINGS.delta}</div>
                  <div className="mt-4 space-y-2.5 border-t border-white/[.06] pt-3.5">
                    {EARNINGS.breakdown.map((b) => (
                      <div key={b.name} className="flex items-baseline gap-2 text-[15px]">
                        <span className="font-bold">{b.name}</span>
                        <span className="text-[11px] text-white/50">{b.meta}</span>
                        <span
                          className={`ml-auto font-num text-[16px] font-bold ${b.gold ? "text-gold-soft" : ""}`}
                        >
                          {b.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-[1.7] text-white/50">
                    {EARNINGS.designNote}
                    <br />
                    {EARNINGS.principleNote}
                  </p>
                  <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-white/[.06] pt-3">
                    {EARNINGS.stats.map(([k, val]) => (
                      <div key={k}>
                        <div className="text-[11px] text-white/50">{k}</div>
                        <div className={`font-num text-[20px] font-bold ${k === "평점" ? "text-gold-soft" : ""}`}>
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 시니어 승급 로드맵 — 성장 과제 (평가는 케어 품질·자격만) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">시니어 승급 로드맵</span>
                    <Badge fg="#7A5C28" bg="rgba(176,141,87,.15)">
                      다음 등급: 시니어 · 수당 +15%
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {GROWTH_QUESTS.map((g) => (
                      <div key={g.k}>
                        <div className="flex items-baseline justify-between text-[13px]">
                          <span className="font-bold text-navy">{g.k}</span>
                          <span className="font-num text-[12px] font-bold" style={{ color: g.color === "#C9CFD8" ? "#5C5A54" : g.color }}>
                            {g.state}
                          </span>
                        </div>
                        <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-navy/[.08]">
                          <div className="h-full rounded-full" style={{ width: `${g.w}%`, background: g.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    승급 기준은 케어 품질 · 자격뿐입니다 — 판매 실적은 반영되지 않습니다 (원칙 1).
                  </p>
                </Card>

                {/* 가족의 감사 한마디 — 인정(Recognition)은 정산만큼 중요하다 */}
                <Card className="border border-gold/30 p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">가족의 감사 한마디</span>
                    <Badge fg="#7A5C28" bg="rgba(176,141,87,.15)">
                      이번 주 {THANKS_FEED.length}건
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {THANKS_FEED.map((t) => (
                      <div key={t.from} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                        <p className="text-[14px] leading-[1.7] text-ink">"{t.text}"</p>
                        <div className="mt-1 text-[11px] text-muted">
                          {t.from} · {t.at}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    감사 메시지는 평점과 별개로 그대로 전달됩니다 — 케어하는 사람을 케어하는 것부터.
                  </p>
                </Card>

                {/* 현장의 소리 — 불편·제안 접수. 목소리는 평가에 반영되지 않는다 (심리적 안전) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">현장의 소리</span>
                    <span className="text-[11px] font-bold text-muted">48시간 내 답변 약속</span>
                  </div>
                  {voiceSent ? (
                    <div className="mt-3 rounded-xl bg-green/10 px-4 py-3">
                      <div className="text-[14px] font-bold text-green">접수했습니다 — 고맙습니다</div>
                      <p className="mt-1 text-[12px] leading-[1.6] text-muted">
                        48시간 안에 답변드리고, 반영되면 무엇이 바뀌었는지 알려드립니다.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-3">
                        <div className="text-[12px] font-bold text-muted">오늘 마음은 어떠세요?</div>
                        <div className="mt-2 flex gap-1.5">
                          {["좋아요", "보통이에요", "지쳐요"].map((m) => (
                            <button
                              key={m}
                              onClick={() => setVoiceMood(m)}
                              className="btn-press flex-1 rounded-xl border py-2.5 text-[13px] font-bold"
                              style={
                                voiceMood === m
                                  ? m === "지쳐요"
                                    ? { background: "rgba(138,93,18,.12)", color: "#8A5D12", borderColor: "rgba(138,93,18,.3)" }
                                    : { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
                                  : { background: "rgba(255,255,255,.7)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                              }
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        {voiceMood === "지쳐요" && (
                          <p className="mt-2 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3 py-2 text-[12px] leading-[1.6] text-[#5A4A22]">
                            지친 날은 말해주셔서 고맙습니다 — 매니저가 배차 조정 여부를 먼저 살펴봅니다.
                          </p>
                        )}
                      </div>
                      <div className="mt-3.5">
                        <div className="text-[12px] font-bold text-muted">하고 싶은 이야기</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {VOICE_TYPES.map((t) => (
                            <button
                              key={t}
                              onClick={() => setVoiceType(t)}
                              className="btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold"
                              style={
                                voiceType === t
                                  ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
                                  : { background: "rgba(255,255,255,.7)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                              }
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={voiceText}
                          onChange={(e) => setVoiceText(e.target.value)}
                          rows={3}
                          placeholder="불편했던 점, 바꾸면 좋을 점, 어르신 관련 제안 — 무엇이든 편하게요."
                          className="mt-2 w-full rounded-xl border border-navy/15 bg-white/80 px-3.5 py-3 text-[14px] leading-[1.6] text-ink outline-none placeholder:text-muted/60 focus:border-gold"
                        />
                        <button
                          onClick={() => setVoiceAnon((v) => !v)}
                          className="mt-1 flex items-center gap-2 text-[13px] font-bold text-navy"
                        >
                          <span
                            className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-md border text-[11px] ${
                              voiceAnon ? "border-navy bg-navy text-white" : "border-navy/25 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          익명으로 보내기
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (!voiceText.trim() || !voiceType) return;
                          setVoiceSent(true);
                          push(
                            "메시지",
                            `현장의 소리 접수 — ${voiceType} (${voiceAnon ? "익명" : ME})${
                              voiceMood === "지쳐요" ? " · 마음 체크인: 지침 — 배차 조정 검토" : ""
                            }`,
                            "#8FA9CC"
                          );
                        }}
                        disabled={!voiceText.trim() || !voiceType}
                        className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
                      >
                        보내기
                      </button>
                      <p className="mt-2.5 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                        목소리는 평가·평점에 반영되지 않습니다 — 개선에만 사용됩니다. 익명 제출은 관리자도
                        작성자를 볼 수 없습니다.
                      </p>
                    </>
                  )}
                </Card>

                {/* 파트너 복지 — 케어하는 사람을 케어한다. 상담은 비밀 보장 (로그 미기록) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">파트너 복지</span>
                    <Badge fg="#7A5C28" bg="rgba(176,141,87,.15)">
                      전 컨시어지 공통
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {WELFARE_ITEMS.map((w) => (
                      <div key={w.k} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-center gap-2.5">
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-bold text-navy">{w.k}</span>
                            <span className="mt-0.5 block text-[12px] leading-[1.6] text-muted">{w.desc}</span>
                          </span>
                          {w.eap && (
                            <button
                              onClick={() => setEapBooked(true)}
                              disabled={eapBooked}
                              className={`btn-press shrink-0 rounded-xl border px-3.5 py-2 text-[13px] font-bold ${
                                eapBooked
                                  ? "border-green/30 bg-green/10 text-green"
                                  : "border-navy/20 text-navy"
                              }`}
                            >
                              {eapBooked ? "예약됨 · 문자 안내" : w.action}
                            </button>
                          )}
                        </div>
                        {w.eap && eapBooked && (
                          <p className="mt-2 rounded-xl bg-green/10 px-3 py-2 text-[12px] leading-[1.6] text-green">
                            외부 상담기관에서 직접 연락드립니다. 이 예약은 회사 기록 · 감사 로그 어디에도
                            남지 않습니다.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                    상담 내용은 회사에 공유되지 않습니다 (이용 건수만 익명 집계) · 복지는 평가 · 등급과
                    무관하게 전원 동일 적용됩니다.
                  </p>
                </Card>

                {/* 건별 정산 내역 */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">건별 정산 내역</span>
                    <span className="font-num text-[12px] text-muted">{EARNINGS.items.length}건</span>
                  </div>
                  <div className="mt-2 space-y-3">
                    {EARNINGS.items.map((it) => (
                      <div key={it.who} className="flex items-center gap-2.5 border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-bold text-ink">{it.who}</div>
                          <div className="mt-0.5 text-[12px] text-muted">{it.meta}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-num text-[17px] font-bold text-navy">{it.net}</div>
                          <div className="font-num text-[11px] text-muted/70">{it.gross}</div>
                        </div>
                        <Badge
                          fg={it.state === "확정" ? "#1E7A5A" : "#8A5D12"}
                          bg={it.state === "확정" ? "rgba(30,122,90,.12)" : "rgba(138,93,18,.12)"}
                        >
                          {it.state}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.6] text-muted">
                    {EARNINGS.feeNote}
                  </p>
                </Card>

                {/* 등급 인센티브 */}
                <Card className="p-[18px]">
                  <div className="text-[17px] font-black text-navy">등급 인센티브</div>
                  <div className="mt-2.5 flex items-baseline justify-between text-[13px]">
                    <span>
                      <span className="font-num font-bold text-navy">{EARNINGS.tier.now}</span>{" "}
                      <span className="text-muted">{EARNINGS.tier.perk}</span>
                    </span>
                    <span className="font-num text-[12px] text-muted">{EARNINGS.tier.toNext}</span>
                  </div>
                  <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-navy/[.08]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${EARNINGS.tier.pct}%`,
                        background: "linear-gradient(90deg, #C9A46B, #B08D57)",
                      }}
                    />
                  </div>
                  <p className="mt-2.5 text-[12px] leading-[1.7] text-muted">{EARNINGS.tier.nextPerk}</p>
                </Card>

                {/* 수락 현황 — "놓친 수익" 프레임 대신 취소 권한 보장 (원칙 유지) */}
                <div className="rounded-card border border-amber/30 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-4">
                  <div className="text-[15px] font-bold text-amber">이번 주 수락 현황</div>
                  <p className="mt-1 text-[13px] leading-[1.75] text-[#5A4A22]">
                    {EARNINGS.declinedNote}
                  </p>
                </div>

                {/* 조기 지급 — 한도 규칙 명시 */}
                <button
                  onClick={() => {
                    if (earlyPay) return;
                    setEarlyPay(true);
                    push("정산", `${ME} 조기 지급 신청 · 한도 내 승인 대기`, "#8FA9CC");
                  }}
                  disabled={earlyPay}
                  className={`btn-press btn-dark w-full rounded-xl py-3.5 text-[16px] font-bold text-white ${
                    earlyPay ? "bg-green" : "bg-navy"
                  }`}
                >
                  {earlyPay ? "✓ 조기 지급 신청됨 · 한도 내 승인 대기" : "조기 지급 신청 (수수료 1%)"}
                </button>
                <p className="px-1 text-center text-[11px] text-muted">{EARNINGS.earlyPayNote}</p>
              </>
            )}
          </main>

          {/* 하단 탭 — 컨시어지 하루 순서 5개.
              grid-cols-4 로 고정돼 있어서 탭이 5개가 되자 마지막 하나가 다음 줄로
              접혔다. 개수에 맞춰 나눈다. */}
          <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-navy/10 bg-white/95 backdrop-blur">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
              {TABS.map((t) => {
                const active = tab === t.key;
                // 마음사서함에 답장 필요가 남아 있으면 숫자를 띄운다 (명세 2절 · 미처리 우선).
                // 오늘 탭에는 승인할 해주세요 수 (2026-10-14 — 새 부탁이 온 것을 탭에서도 알 수 있게)
                // 방문 · 리포트 탭에는 관제 반려 표시 (C-09)
                const badge = t.key === "mailbox" ? mb.counts.needReply : t.key === "today" ? newRequestsFor(state.requests).length : t.key === "visit" ? (state.visit.returned && !state.visit.reportSent ? 1 : 0) : 0;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11.5px] font-bold ${
                      active ? "text-navy" : "text-muted"
                    }`}
                  >
                    <span className="relative">
                      <Icon name={t.icon} size={19} />
                      {badge > 0 && (
                        <span
                          aria-hidden
                          className="absolute -right-[9px] -top-[5px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-[4px] font-num text-[10px] font-bold text-white"
                          style={{ background: "#8A5D12" }}
                        >
                          {badge}
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">{t.label}</span>
                    {badge > 0 && <span className="sr-only">{t.key === "today" ? `승인할 해주세요 ${badge}건` : `답장 필요 ${badge}건`}</span>}
                    {active && <span className="mt-0.5 h-[3px] w-5 rounded-full bg-gold" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 새 해주세요 — 어느 탭에 있든 창으로 알린다 (2026-10-14 현장 '기본 로직' 5번) */}
          <NewRequestAlert
            requests={state.requests}
            onOpen={() => {
              setTab("today");
              setTimeout(() => document.getElementById("concierge-requests")?.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
            }}
          />

          {/* 달력에서 고른 날 — 고객 이름을 누르면 그 건의 디테일 (2026-08-28 전체 요청 3번).
              여기 뜨는 것은 내가 나가는 업무 4종뿐이다. */}
          {calDay != null && (
            <Sheet title={`${calMonthLabel} ${calDay}일`} onClose={() => setCalDay(null)}>
              {calDayJobs.length === 0 ? (
                <p className="text-[14px] leading-[1.7] text-muted">이 날에는 나갈 일정이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {calDayJobs.map((j) => {
                    const k = j.cancelled ? CANCELLED_JOB : CONCIERGE_JOB_KINDS[j.kind];
                    const open = calJob === j.id;
                    return (
                      <div key={j.id} className="rounded-xl border border-navy/[.07] bg-white/60">
                        <button
                          onClick={() => setCalJob(open ? null : j.id)}
                          aria-expanded={open}
                          className="btn-press flex w-full items-center gap-2.5 p-3 text-left"
                        >
                          <span
                            className="shrink-0 rounded-full px-2 py-[3px] text-[11px] font-bold text-white"
                            style={{ background: k.color }}
                          >
                            {k.label}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-bold text-navy">
                              {j.client}{j.age ? <span className="text-[12px] font-medium text-muted"> ({j.age})</span> : null}
                            </span>
                            <span className="block font-num text-[12px] text-muted">{[j.time, j.where].filter(Boolean).join(" · ")}</span>
                          </span>
                          <span
                            aria-hidden
                            className="shrink-0 text-muted transition-transform duration-200"
                            style={{ transform: open ? "rotate(180deg)" : "none" }}
                          >
                            <Icon name="chev" size={18} strokeWidth={2} />
                          </span>
                        </button>
                        {open && (
                          <div className="border-t border-navy/[.07] px-3 py-2.5 text-[13px] leading-[1.7] text-ink">
                            <div className={j.cancelled ? "line-through decoration-navy/30" : ""}>{j.detail}</div>
                            {j.cancelled && (
                              <div className="mt-1 font-bold text-navy">
                                취소됨 — {j.cancelled.by || "취소"}
                                {j.cancelled.at ? ` · ${new Date(j.cancelled.at).getMonth() + 1}/${new Date(j.cancelled.at).getDate()} ${hm(j.cancelled.at)}` : ""}
                                {j.cancelled.reason ? ` · ${j.cancelled.reason}` : ""} · 나가지 않습니다
                              </div>
                            )}
                            {j.changing && <div className="mt-1 font-bold text-gold">변경 확인 중 — 관제가 바뀐 내용을 확인하고 있어요. 지금 보이는 것이 확정된 원래 일정입니다.</div>}
                            {!j.cancelled && <div className="mt-1 text-[12px] text-muted">배차 {j.crew}</div>}
                            {j.memo && <div className="mt-1 text-[12px] text-muted">메모 · {j.memo}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
                내가 나가는 일정만 보입니다 — 병원동행 · 일상동행 · 해주세요 · 안심방문.
                고객과 보호자가 함께 쓰는 캘린더(배송 · 개인일정 · 가족이벤트 · 동행 없는 일정 포함)는
                고객 탭에서 이름을 눌러 &lsquo;공유 일정&rsquo;에서 보십시오.
              </p>
            </Sheet>
          )}

          {/* 긴급확인 — 관제가 넘긴 확인 요청 (2026-09-22 시안 1) */}
          {urgentOpen && (
            <UrgentSheet
              u={CONCIERGE_URGENT}
              steps={urgentSteps}
              onClose={() => setUrgentOpen(false)}
              onStep={(k) => {
                if (urgentSteps[k]) return;
                setUrgentSteps((s) => ({ ...s, [k]: true }));
                const step = CONCIERGE_URGENT.steps.find((x) => x.k === k);
                push("대응", `${CONCIERGE_URGENT.client} 긴급확인 · ${step.label} 완료 — 관제 전달`, "#FF8A80");
              }}
            />
          )}

          {/* 발행 전 미리보기 — 보호자 리포트(A4) · 어르신 앱 · 관제 (2026-10-24 설계서 v3 §3-5). 내부 메모는 관제 탭에만 */}
          {preview && reportView && (
            <Sheet title={`발행 전 미리보기 · ${reportKind}`} onClose={() => setPreview(false)}>
              <ReportPreview
                r={reportView}
                period={meetSpan}
                headline={headlineFor(careLoc, elderNameOf(state.onboarding))}
                stage={sendStage}
                returned={!!returned}
                checkinAt={gpsAt}
                crew={state.visitPlan?.crew?.length || 0}
                inner={visitText(v, "inner")}
                nextVisitAt={nextVisitAt}
              />
            </Sheet>
          )}

          {/* 관제에 알리기 (2026-08-21 시트 오늘 2번) */}
          {opsMsgOpen && (
            <Sheet title="관제에 알리기" onClose={() => setOpsMsgOpen(false)}>
              <p className="text-[13px] leading-[1.7] text-muted">
                현장에서 관제에 바로 전합니다. 급한 것은 전화가 빠릅니다 — 이 창은 기록이 남는
                연락입니다.
              </p>
              <div className="mt-3 space-y-2">
                {OPS_MESSAGE_PRESETS.map((m) => (
                  <button
                    key={m}
                    onClick={() => sendOpsMsg(m)}
                    className="btn-press w-full rounded-xl border border-navy/15 px-3.5 py-3 text-left text-[14px] font-bold text-navy"
                  >
                    {m}
                  </button>
                ))}
              </div>
              {/* 직접 쓰기 — 버튼에 없는 말 (2026-10-02) */}
              <div className="mt-3 flex gap-2">
                <input
                  aria-label="관제에 보낼 말 직접 쓰기"
                  value={opsMsgText}
                  onChange={(e) => setOpsMsgText(e.target.value)}
                  placeholder="직접 쓰기"
                  className="min-w-0 flex-1 rounded-xl border border-navy/15 px-3.5 py-3 text-[14px] outline-none focus:border-gold"
                />
                <button
                  onClick={() => sendOpsMsg(opsMsgText.trim())}
                  disabled={!opsMsgText.trim()}
                  className="btn-press btn-dark shrink-0 rounded-xl bg-navy px-4 text-[14px] font-bold text-white disabled:opacity-40"
                >
                  보내기
                </button>
              </div>
              {/* 보낸 것 — 관제가 확인하면 시각과 답이 여기 붙는다 */}
              {opsMsgs.length > 0 && (
                <div className="mt-4 border-t border-navy/10 pt-3">
                  <div className="text-[12px] font-bold text-muted">보낸 연락</div>
                  <ul className="mt-1.5 space-y-1.5">
                    {opsMsgs.slice(0, 5).map((m) => (
                      <li key={m.id} className="rounded-lg bg-navy/[.04] px-3 py-2 text-[13px]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 text-ink">{m.text}</span>
                          <span className={`shrink-0 text-[11.5px] font-bold ${m.ackAt ? "text-green" : "text-amber"}`}>
                            {m.ackAt ? `관제 확인 ${hm(m.ackAt)}` : "확인 전"}
                          </span>
                        </div>
                        {m.reply && <div className="mt-1 text-[12.5px] font-bold text-navy">관제 답 — {m.reply}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Sheet>
          )}
        </div>
      </div>
      {/* 도와줘요 — 어느 탭에서든 팝업 (2026-10-05). '카드로 가기'는 오늘 탭의 진행 카드로 (2026-10-19 점검 C-11) */}
      <HelpCallPopup
        role="concierge"
        onGo={() => {
          setTab("today");
          setTimeout(() => document.getElementById("help-call-concierge")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
        }}
      />
    </>
  );
}

// 등록한 진료 예약 한 줄 — 고치기(내용 · 날짜 · 시각) · 지우기(한 번 더 묻는다). 병원 예약이 바뀐 것을 그대로 옮긴다
function ConciergeApptRow({ e, me, onSave, onRemove }) {
  const [mode, setMode] = useState("view"); // view · edit · confirm
  const d0 = new Date(e.at);
  const pad = (n) => String(n).padStart(2, "0");
  const fromEvent = () => ({ title: e.title, date: `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`, time: `${pad(d0.getHours())}:${pad(d0.getMinutes())}` });
  const [f, setF] = useState(fromEvent);
  // 지난 진료 예약은 기록 — 고치거나 지우지 않는다 (lib/event-rights.js 와 같은 기준)
  const past = e.at < Date.now();
  const at = new Date(`${f.date}T${f.time || "09:30"}`).getTime();
  const ok = f.title.trim() && Number.isFinite(at);
  const cls = "rounded-lg border border-navy/15 px-3 py-2.5 text-[13px] outline-none focus:border-gold";
  return (
    <li className="rounded-xl border border-navy/[.08] bg-white/70 px-3 py-2.5">
      {mode === "edit" ? (
        <div className="space-y-1.5">
          <input value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} aria-label="예약 내용" className={`${cls} w-full`} />
          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" value={f.date} onChange={(x) => setF({ ...f, date: x.target.value })} aria-label="진료 날짜" className={`${cls} font-num`} />
            <input type="time" value={f.time} onChange={(x) => setF({ ...f, time: x.target.value })} aria-label="진료 시각" className={`${cls} font-num`} />
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setMode("view")} className="btn-press min-h-[40px] flex-1 rounded-lg border border-navy/15 text-[13px] font-bold text-muted">
              그만두기
            </button>
            <button
              disabled={!ok}
              onClick={() => (onSave({ title: f.title.trim(), at }), setMode("view"))}
              className="btn-press min-h-[40px] flex-[2] rounded-lg bg-navy text-[13px] font-bold text-white disabled:opacity-40"
            >
              고친 내용 저장
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-navy">{e.title}</div>
              <div className="font-num text-[12px] text-muted">
                {d0.toLocaleString("ko-KR", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                {/* 다른 사람(보호자 등)이 바꾼 것은 누가 바꿨는지 — 전에는 '수정됨'만 보여 보호자가 옮긴 것을 몰랐다 (2026-10-26 점검) */}
                {e.editedAt ? (e.editedBy && e.editedBy !== me ? ` · ${josa(e.editedBy, "이", "가")} 바꿈` : " · 수정됨") : ""}
              </div>
            </div>
            {mode === "view" && past && <span className="shrink-0 text-[11.5px] text-muted">지난 예약 · 기록</span>}
            {mode === "view" && !past && (
              <div className="flex shrink-0 gap-1.5">
                {/* 열 때마다 지금 값으로 — 그사이 보호자가 고친 것을 옛 값으로 덮지 않게 */}
                <button onClick={() => (setF(fromEvent()), setMode("edit"))} aria-label={`${e.title} 수정`} className="btn-press min-h-[40px] rounded-lg border border-navy/15 px-3 text-[12.5px] font-bold text-navy">
                  수정
                </button>
                <button onClick={() => setMode("confirm")} aria-label={`${e.title} 삭제`} className="btn-press min-h-[40px] rounded-lg border border-navy/15 px-3 text-[12.5px] font-bold text-muted">
                  삭제
                </button>
              </div>
            )}
          </div>
          {mode === "confirm" && (
            <div className="mt-2 rounded-lg bg-navy/[.04] p-2.5">
              <div className="text-[13px] font-bold text-navy">이 예약을 캘린더에서 지울까요?</div>
              <div className="text-[12px] text-muted">보호자 · 어르신 캘린더에서도 빠집니다.</div>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => setMode("view")} className="btn-press min-h-[40px] flex-1 rounded-lg border border-navy/15 text-[13px] font-bold text-muted">
                  그대로 두기
                </button>
                <button onClick={onRemove} className="btn-press min-h-[40px] flex-1 rounded-lg bg-navy text-[13px] font-bold text-white">
                  지우기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}

// 공통 바텀시트 — 이 화면의 시트들이 같은 껍데기를 쓰도록 뽑아 두었다.
// 닫기 버튼은 제목 줄 오른쪽에 둔다 (시트가 길어지면 아래 버튼까지 못 내려간다).
function Sheet({ title, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-[19px] font-black text-navy">{title}</div>
          <button
            onClick={onClose}
            className="btn-press shrink-0 rounded-[10px] border border-navy/20 px-3 py-1.5 text-[13px] font-bold text-muted"
          >
            닫기
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

// 관찰 리포트 시트 — REQ-11. 관찰 사실과 발언 인용만. 진단·소견 금지.
// 관찰 리포트 시트(REQ-11 12항목)는 삭제했다 (2026-08-21 시트 컨시어지 전체 2번).
// 방문·리포트 탭을 합치면서 리포트를 쓰는 자리가 두 곳이 됐는데, 12항목은
// 21항목 리포트의 마음 축(말수·표정·외출·식욕·수면)과 집 축(정리·냄새·낙상
// 위험물·조명·냉난방)이 이미 덮는다. 두 벌을 두면 어디에 적었는지 알 수 없다.
// 되살리려면 git 이력에서 ReportSheet 를 꺼내 리포트 구역에 붙이면 된다.

// 테스트 계정은 자기 역할 화면만 — 다른 역할이면 안내를 띄운다 (components/RoleGate.jsx)
export default function ConciergePageGated() {
  return (
    <RoleGate role="concierge" title="컨시어지">
      <ConciergePage />
    </RoleGate>
  );
}
