import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, Avatar } from "../components/ui";
import Icon from "../components/icons";
import VisitFlow from "../components/VisitFlow";
import {
  AI_REPORT,
  OUTING,
} from "../lib/mock";
import {
  AI_BRIEFING,
  AI_VOICE_DRAFT,
  CARE_SUGGESTIONS,
  CONCIERGE_SHOP_ITEMS,
  DIAGNOSIS_WORDS,
  EARNINGS,
  ELDER_PREFS,
  GROWTH_QUESTS,
  KIT_DOCS,
  RECOVERY_STEPS,
  THANKS_FEED,
  TODAY_DETAIL,
  VOICE_TYPES,
  WELFARE_ITEMS,
  OBSERVATION_ITEMS,
  PAIR_TODAY,
  TODAY_ROUTE,
  VIDEO_MODES,
  MY_CLIENTS,
  VIDEO_POLICY,
  VIDEO_SEGMENTS,
} from "../lib/console";;
import { checkupFor, REPORT_HEADLINE } from "../lib/checkup";
import { fmtWon } from "../lib/config";
import { useAppState } from "../lib/state";
import Splash from "../components/Splash";

// 컨시어지 앱 — REQ-09(동선·주소 게이팅) · REQ-10(케어박스) · REQ-11(관찰 리포트)
// · REQ-12(감사 타임라인·영상) + 디자인 콘솔 정합 (오늘·리포트·제안·정산 4탭).
// 절대 규칙(원칙 유지): 평가·보상에 판매액 없음 (업셀링 인센티브 → 케어 품질 인센티브로 대체)
// · 의료 측정값 입력 없음 · 소견/진단 기재 금지 · 1인 진입 금지(2인 체크인) · 제안은 근거 동반.

const TABS = [
  { key: "today", label: "오늘", icon: "home" },
  { key: "report", label: "리포트", icon: "doc" },
  { key: "suggest", label: "제안", icon: "diamond" },
  // 정산 탭은 숨겼다 (2026-08-12 실무진 "내용 숨기기") — 수익 정보가 시연 화면에
  // 노출되면 곤란하다는 판단. 코드는 남겨 두고 메뉴에서만 뺀다.
  // { key: "pay", label: "정산", icon: "coin" },
];

export default function ConciergePage() {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState("today");
  const [kitOpen, setKitOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shopSel, setShopSel] = useState({});
  const [shopSent, setShopSent] = useState(false);
  const [apptDone, setApptDone] = useState(false);
  const [apptEscort, setApptEscort] = useState(true); // 다음 진료에 컨시어지 동행 여부
  const [reqText, setReqText] = useState(""); // 컨시어지 요청 본문
  const [reqSent, setReqSent] = useState(false);
  const [pairCalled, setPairCalled] = useState(false);
  const [sosAck, setSosAck] = useState(false); // 관제 급파 수락 원샷
  const [voiceMood, setVoiceMood] = useState(null); // 현장의 소리 — 마음 체크인
  const [voiceType, setVoiceType] = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [voiceAnon, setVoiceAnon] = useState(true);
  const [voiceSent, setVoiceSent] = useState(false);
  const [eapBooked, setEapBooked] = useState(false); // 심리상담 예약 — 감사 로그에 남기지 않는다
  const [prefAdded, setPrefAdded] = useState(false); // 선호 카드 — 오늘 기록 원샷
  const [detailDone, setDetailDone] = useState(false); // 오늘의 한 끗 완료
  const [aiSent, setAiSent] = useState(false);
  const [pdfIssued, setPdfIssued] = useState(false);
  const [suggested, setSuggested] = useState({});
  const [earlyPay, setEarlyPay] = useState(false);
  // 거주 형태 토글 — 기본값은 가입 때 저장한 값 (DB: care_location_type · 실무자 피드백)
  const [careLoc, setCareLoc] = useState(state.onboarding?.careLocation || "home");
  const [checkDone, setCheckDone] = useState({}); // 21항목 체크 — {"몸-혈압": true}
  const [openItem, setOpenItem] = useState(null); // 항목별 내용 입력 열림
  const [itemNote, setItemNote] = useState({}); // 항목별 기록
  const [summaryNote, setSummaryNote] = useState(""); // 총평 메모
  const [photos, setPhotos] = useState([]); // 현장 사진 (데모)
  const [preview, setPreview] = useState(false); // 증빙 보고서 발행 전 미리보기
  const v = state.visit;
  const videoConsent = state.onboarding ? !!state.onboarding.videoConsent : true; // 데모 기본 동의

  const purchasing = state.requests.filter(
    (r) => r.dir === "fromConcierge" && r.status === "inProgress"
  );

  const fmtT = (t) =>
    new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });

  const push = (kind, text, color) =>
    dispatch({ type: "pushEvent", payload: { kind, text, color } });

  const a1 = TODAY_ROUTE[0];
  const a2 = TODAY_ROUTE[1];

  return (
    <>
      <Head>
        <title>컨시어지 — K-CARE</title>
      </Head>
      <Splash service="concierge" />
      <div className="min-h-screen bg-nav">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-num text-[11px] font-bold tracking-[.18em] text-gold">
                  CONCIERGE
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {/* 이 화면의 h1 — 없으면 문서에 제목 계층이 아예 없다 */}
                  <h1 className="text-[21px] font-black text-navy">박지현 · 주 동행</h1>
                  <span className="chip-gold rounded-full px-2 py-[3px] font-num text-[10px] font-bold">
                    {EARNINGS.grade}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/" className="tap text-[12px] font-bold text-muted/50">
                  데모 홈
                </Link>
                <button
                  onClick={() => dispatch({ type: "demo", payload: { offline: !state.demo.offline } })}
                  className="btn-press rounded-lg border border-navy/20 px-2.5 py-1.5 text-[12px] font-bold text-muted"
                >
                  {state.demo.offline ? "온라인 전환" : "오프라인 시연"}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-3.5 overflow-y-auto px-4 pb-28 pt-4">
            {/* ════ 오늘 탭 ════ */}
            {tab === "today" && (
              <>
                {/* 방문 업무흐름 — 관제와 같은 건을 본다 (2026-08-13 미팅 8단계) */}
                <VisitFlow role="concierge" />

                {/* 관제 급파 → 컨시어지 긴급 배너 — 역할 간 실시간 연동 (SOS + 급파 지시 시) */}
                {state.demo.sos && state.ops.sosDispatched && (
                  <div className="animate-sosPulse rounded-2xl bg-danger p-4 text-white">
                    <div className="text-[12px] font-bold tracking-[.14em] opacity-85">긴급 급파 · 관제 지시</div>
                    <div className="mt-1 text-[18px] font-bold leading-[1.4]">
                      김순자님 SOS — 최근접 동행자로 지정되었습니다
                    </div>
                    <div className="mt-0.5 text-[13px] opacity-90">
                      대치동 자택 1.2km · 서다인(부)과 2인 급파 · 도착 예정 6분
                    </div>
                    <button
                      onClick={() => {
                        if (sosAck) return;
                        setSosAck(true);
                        push("대응", "박지현 급파 수락 — 이동 시작 (도착 예정 6분)", "#FF8A80");
                      }}
                      disabled={sosAck}
                      className="btn-press mt-3 w-full rounded-[10px] bg-white py-3 text-[16px] font-bold text-danger disabled:opacity-80"
                    >
                      {sosAck ? "✓ 수락됨 — 이동 중 (관제 공유)" : "급파 수락 · 이동 시작"}
                    </button>
                  </div>
                )}

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

                {/* 오늘 동행 — 디자인 콘솔 (시간범위 · 케어 메타 · 짝 · 컨디션 · 출근 체크인) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[18px] font-bold text-navy">{a1.timeRange}</span>
                    <Badge fg="#FFFFFF" bg="#0A1F3C">
                      {v.checkedIn ? "수행중" : "예정"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[20px] font-black text-navy">
                    {a1.customer} · {a1.hospital}
                  </div>
                  <div className="mt-1 text-[13px] leading-[1.7] text-muted">
                    {a1.meta1}
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

                  {/* GPS 출근 체크인 — 감사 타임라인 시작 */}
                  <button
                    onClick={() => {
                      if (v.checkedIn) return;
                      dispatch({
                        type: "audit",
                        patch: { checkedIn: true },
                        event: { kind: "gps", label: "출근 체크인 · GPS 좌표 기록" },
                      });
                      push("체크인", "박지현 · 김순자(78) 동행 수행중 전환", "#4ADE80");
                    }}
                    disabled={v.checkedIn}
                    className={`btn-press btn-dark mt-4 w-full rounded-xl py-3.5 text-[17px] font-bold text-white ${
                      v.checkedIn ? "bg-green" : "bg-navy"
                    }`}
                  >
                    {v.checkedIn ? "✓ 출근 체크인 완료" : "GPS 출근 체크인"}
                  </button>
                </Card>

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

                {/* 선호 카드 + AI 동행 브리핑 — 방문 전 30초 (2026-08-12 대표 피드백으로 합침) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[17px] font-black text-navy">김순자님 선호 카드</span>
                    <Badge fg="#7A5C28" bg="rgba(176,141,87,.15)">
                      방문 전 30초 확인
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {ELDER_PREFS.map(([k, val]) => (
                      <div key={k} className="flex gap-2.5 text-[13px]">
                        <span className="w-[56px] shrink-0 font-bold text-gold">{k}</span>
                        <span className="flex-1 leading-[1.6] text-ink">{val}</span>
                      </div>
                    ))}
                    {prefAdded && (
                      <div className="flex gap-2.5 text-[13px]">
                        <span className="w-[56px] shrink-0 font-bold text-gold">오늘 기록</span>
                        <span className="flex-1 leading-[1.6] text-ink">
                          병원 로비 소음에 피로감 — 대기는 조용한 쪽 좌석으로
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (prefAdded) return;
                      setPrefAdded(true);
                      push("어르신", "선호 카드 기록 추가 — 대기석 소음 민감", "#F0D9A8");
                    }}
                    disabled={prefAdded}
                    className="btn-press mt-3 w-full rounded-xl border border-navy/15 py-2.5 text-[13px] font-bold text-navy disabled:opacity-60"
                  >
                    {prefAdded ? "오늘 알게 된 선호 기록됨 ✓" : "+ 오늘 알게 된 선호 기록"}
                  </button>
                  <p className="mt-2 text-[11px] leading-[1.6] text-muted">
                    선호 카드는 담당 페어와 관제만 봅니다 · 다음 동행 브리핑에 자동 반영됩니다.
                  </p>
                  {/* AI 동행 브리핑 — 선호 카드와 합쳤다 (2026-08-12 대표 피드백).
                      둘 다 "방문 전에 30초 읽는 것"이라 화면을 나눌 이유가 없었다. */}
                  <div className="mt-4 border-t border-navy/[.08] pt-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-black text-navy">AI 동행 브리핑</span>
                    <span className="chip-gold rounded-full px-2 py-[3px] text-[10px] font-bold">
                      케어 프로필 기반
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {AI_BRIEFING.confirmed.map((b) => (
                      <div key={b} className="flex items-start gap-2 text-[13px] leading-[1.6] text-ink">
                        <span className="mt-[2px] inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-green/15 text-[10px] font-bold text-green">
                          ✓
                        </span>
                        {b}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 rounded-xl border border-amber/30 bg-[#FFF7E8] p-3">
                    <div className="text-[11px] font-bold tracking-[.08em] text-amber">
                      미확정 — 확인된 정보가 아닙니다
                    </div>
                    {AI_BRIEFING.unconfirmed.map((u) => (
                      <p key={u} className="mt-1 text-[13px] leading-[1.6] text-[#5A4A22]">
                        {u}
                      </p>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">
                    관찰·발언 기록에서 AI가 추렸습니다 — 진단·판단 없음. 새 관찰은 리포트로
                    쌓이고 다음 브리핑에 반영됩니다.
                  </p>
                  </div>
                </Card>

                {/* 방문 수행 — 체크인 후 진행 (감사 타임라인) */}
                <SectionLabel>방문 수행</SectionLabel>
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <StepBtn
                      done={v.kitDone}
                      disabled={!v.checkedIn}
                      label={v.kitDone ? "케어박스 완료" : "케어박스 점검"}
                      onClick={() => v.checkedIn && !v.kitDone && setKitOpen(true)}
                    />
                    <StepBtn
                      done={v.reportSent}
                      disabled={!v.checkedIn}
                      label={v.reportSent ? "관찰 리포트 발송됨" : "관찰 리포트"}
                      onClick={() => v.checkedIn && !v.reportSent && setReportOpen(true)}
                    />
                  </div>
                  {v.audit.length > 0 && (
                    <div className="mt-4 border-t border-navy/10 pt-3">
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
                  <button
                    onClick={() => {
                      if (apptDone) return;
                      setApptDone(true);
                      const at = new Date();
                      at.setDate(at.getDate() + 21);
                      at.setHours(9, 30, 0, 0);
                      dispatch({
                        type: "addEvent",
                        payload: {
                          id: `ev-${Date.now()}`,
                          kind: "nextAppt",
                          title: `정형외과 재진 · 분당서울대병원${apptEscort ? " (컨시어지 동행)" : ""}`,
                          at: at.getTime(),
                          source: "컨시어지 등록",
                          note: apptEscort
                            ? "병원 접수처에서 예약 확정 · 동행 배차 요청됨"
                            : "병원 접수처에서 예약 확정 · 일정 공유만 (동행 없음)",
                        },
                      });
                      dispatch({
                        type: "audit",
                        event: { kind: "check", label: "다음 진료 예약 등록 · 캘린더 공유" },
                      });
                      push("예약", "다음 진료 예약 등록 · 보호자·어르신 캘린더 공유", "#8FA9CC");
                    }}
                    disabled={apptDone}
                    className={`btn-press mt-3 w-full rounded-xl border py-3 text-[15px] font-bold ${
                      apptDone ? "border-green/30 bg-green/10 text-green" : "border-navy bg-navy text-white"
                    }`}
                  >
                    {apptDone ? "✓ 등록됨 · 3주 뒤 오전 9시 30분" : "다음 예약 등록 (병원 확정분)"}
                  </button>
                </Card>

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

            {/* ════ 리포트 탭 ════ */}
            {tab === "report" && (
              <>
                {/* 담당 고객 리스트 — 이름을 누르면 케어 프로필로 (실무진 2026-08-12) */}
                <Card className="p-4">
                  <SectionLabel>내가 담당하는 고객</SectionLabel>
                  <div className="mt-2.5 space-y-1.5">
                    {MY_CLIENTS.map((c) => (
                      <Link
                        key={c.name}
                        href="/care-profile"
                        className="btn-press flex items-center gap-3 rounded-xl border border-navy/[.08] bg-white/70 px-3 py-2.5"
                      >
                        <Avatar name={c.name} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-bold text-ink">
                            {c.name} <span className="font-num text-[12px] text-muted">({c.age})</span>
                          </span>
                          <span className="block text-[11.5px] text-muted">{c.where} · {c.note}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-navy/[.06] px-2 py-[3px] text-[10.5px] font-bold text-muted">
                          {c.loc}
                        </span>
                        <span className="shrink-0 text-[17px] text-muted">›</span>
                      </Link>
                    ))}
                  </div>
                </Card>

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

                {/* 방문 리포트 작성 — 거주 형태 토글이 체크리스트와 리포트 카피를
                    실시간으로 바꾼다 (실무자 피드백 2026-08-09 · 이원화 개발 명세) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[17px] font-black text-navy">방문 리포트 작성</span>
                    {/* 토글 — 어르신 프로필의 저장값이 기본, 현장에서 바꿀 수 있다 */}
                    <div className="flex rounded-full border border-navy/15 p-1" role="group" aria-label="거주 형태">
                      {[
                        ["home", "🏠 자택"],
                        ["hospital", "🏥 요양병원"],
                      ].map(([k, label]) => (
                        <button
                          key={k}
                          onClick={() => setCareLoc(k)}
                          aria-pressed={careLoc === k}
                          className={`btn-press btn-inline rounded-full px-3 py-1.5 text-[12.5px] font-bold ${
                            careLoc === k ? "bg-navy text-white" : "text-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 리포트 상단 카피 미리보기 — 보호자 앱 · 알림톡에 나가는 문장 */}
                  <div className="mt-3 rounded-xl bg-navy p-3.5 text-[14.5px] font-bold leading-[1.6] text-white">
                    {REPORT_HEADLINE[careLoc](state.onboarding?.elderName || "김순자")}
                    <span className="mt-1 block text-[11px] font-normal text-white/55">
                      리포트 상단 문장 — 체크가 끝나면 사진 · 15초 영상 메시지와 함께 나갑니다
                    </span>
                  </div>

                  {/* 21항목 — 토글에 따라 자택/요양병원 목록이 즉시 바뀐다 */}
                  <div className="mt-3.5 space-y-3">
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
                              return (
                                <div key={key}>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setCheckDone((s) => ({ ...s, [key]: !s[key] }))}
                                      className={`btn-press btn-inline shrink-0 rounded-full border px-2.5 py-1.5 text-[12px] font-bold ${
                                        on ? "border-green/40 bg-green/10 text-green" : "border-navy/15 text-muted"
                                      }`}
                                    >
                                      {on ? "✓ " : ""}
                                      {i.k}
                                    </button>
                                    <button
                                      onClick={() => setOpenItem(open ? null : key)}
                                      aria-expanded={open}
                                      className={`btn-press btn-inline flex-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-left text-[11.5px] ${
                                        itemNote[key] ? "text-ink" : "text-muted/70"
                                      }`}
                                    >
                                      {itemNote[key] || "내용 적기"}
                                    </button>
                                  </div>
                                  {open && (
                                    <textarea
                                      autoFocus
                                      rows={2}
                                      value={itemNote[key] || ""}
                                      onChange={(e) => setItemNote((s) => ({ ...s, [key]: e.target.value }))}
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
                      onChange={(e) => setSummaryNote(e.target.value)}
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
                      <button
                        onClick={() => setPhotos((v) => [...v, `현장사진_${v.length + 1}.jpg`])}
                        className="btn-press btn-inline rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11.5px] font-bold text-navy"
                      >
                        + 사진 첨부 (데모)
                      </button>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[12px] leading-[1.65] text-muted">
                    21항목을 모두 체크하면 사진과 함께 리포트가 자동 발행됩니다 — 점수가
                    아니라 지난달과 달라진 것을 적습니다.
                  </p>
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
                      AI 초안 · 음성 기록 기반
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

                  {/* 2인 확인 서명은 삭제했다 (2026-08-12 대표 피드백).
                      배차가 위험도 기반으로 바뀌어 1인 방문이 생겼고, 1인 방문에는
                      애초에 두 번째 서명이 존재하지 않는다. 대신 발행 전 미리보기로
                      본인이 직접 확인하고 고치는 절차를 둔다. */}
                  <div className="mt-3.5 rounded-xl border border-navy/10 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-navy">발행 전 미리보기</span>
                      <button
                        onClick={() => setPreview((v) => !v)}
                        aria-expanded={preview}
                        className="btn-press btn-inline rounded-lg border border-navy/20 px-2.5 py-1.5 text-[12px] font-bold text-navy"
                      >
                        {preview ? "닫기" : "보호자에게 갈 화면 보기"}
                      </button>
                    </div>
                    {preview && (
                      <div className="animate-tickIn mt-2.5 rounded-xl border border-gold/40 bg-paper p-3.5">
                        <div className="text-[13px] font-bold text-navy">
                          {REPORT_HEADLINE[careLoc](state.onboarding?.elderName || "김순자")}
                        </div>
                        <div className="mt-2 space-y-1">
                          {checkupFor(careLoc).flatMap((ax) =>
                            ax.items
                              .filter((i) => itemNote[`${ax.axis}-${i.k}`])
                              .map((i) => (
                                <div key={`${ax.axis}-${i.k}`} className="flex gap-2 text-[12px] leading-[1.6]">
                                  <span className="w-[74px] shrink-0 font-bold text-muted">{i.k}</span>
                                  <span className="min-w-0 flex-1 text-ink">{itemNote[`${ax.axis}-${i.k}`]}</span>
                                </div>
                              ))
                          )}
                          {Object.keys(itemNote).filter((k) => itemNote[k]).length === 0 && (
                            <div className="text-[12px] text-muted">아직 적은 항목이 없습니다.</div>
                          )}
                        </div>
                        {summaryNote && (
                          <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[12.5px] leading-[1.7] text-ink">
                            {summaryNote}
                          </p>
                        )}
                        {photos.length > 0 && (
                          <div className="mt-2 text-[11.5px] font-bold text-green">
                            사진 {photos.length}장 첨부됨
                          </div>
                        )}
                        <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.6] text-muted">
                          내용을 고치려면 위 21항목에서 해당 항목을 다시 눌러 수정하세요. 발행하면
                          보호자 앱과 알림톡으로 이 화면 그대로 나갑니다.
                        </p>
                      </div>
                    )}
                    <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[11px] leading-[1.7] text-muted">
                      {AI_REPORT.signRule}
                    </p>
                  </div>

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
                  <button
                    onClick={() => {
                      if (aiSent) return;
                      setAiSent(true);
                      dispatch({
                        type: "addReport",
                        payload: {
                          id: `rp-${Date.now()}`,
                          by: "박지현",
                          flagged: 0,
                          note: AI_REPORT.draft,
                          secretNote: "",
                          shared: true,
                        },
                      });
                      push("리포트", "동행 리포트 검수 확정 · 가족 앱 전달", "#8FA9CC");
                    }}
                    disabled={aiSent}
                    className={`btn-press btn-dark mt-2 w-full rounded-xl py-3.5 text-[16px] font-bold text-white ${
                      aiSent ? "bg-muted" : "bg-green"
                    } disabled:opacity-50`}
                  >
                    {aiSent ? "✓ 가족에게 전달됨" : "검수 확정 후 가족에게 전달"}
                  </button>
                </Card>

                {/* 리포트 누적 — 본인 전체 · 타인 공유분만 */}
                <SectionLabel>리포트 기록</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-3">
                    {state.reports.map((r) => {
                      const mine = r.by === "박지현";
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
                            {mine ? r.note : r.shared ? r.note : "비공개 리포트 — 작성자만 열람"}
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
                {/* 케어 제안 — 제안은 반드시 근거(trigger)를 동반 (도메인 규칙 1.1) */}
                <SectionLabel>케어 제안</SectionLabel>
                {CARE_SUGGESTIONS.map((sg) => (
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
                          payload: {
                            id: `rq-${Date.now()}`,
                            dir: "fromConcierge",
                            type: `케어 제안 · ${sg.item}`,
                            detail: `${sg.trigger}. 필요하시면 구매대행으로 진행합니다.`,
                            amount: sg.est,
                            preferredDate: null,
                            urgency: "normal",
                            assignee: "박지현",
                            photos: [],
                            status: "requested",
                            history: [{ at: Date.now(), status: "requested", note: "관찰 근거 기반 제안" }],
                            proof: null,
                          },
                        });
                        push("제안", `케어 제안 전송 · ${sg.item} (근거 동반)`, "#B08D57");
                      }}
                      disabled={!!suggested[sg.item]}
                      className={`btn-press mt-2.5 w-full rounded-xl border py-2.5 text-[13px] font-bold ${
                        suggested[sg.item]
                          ? "border-green/30 bg-green/10 text-green"
                          : "border-navy/20 text-navy"
                      }`}
                    >
                      {suggested[sg.item] ? "제안 전송됨" : "보호자에게 제안 보내기"}
                    </button>
                  </Card>
                ))}
                <p className="px-1 text-[11px] leading-[1.7] text-muted">
                  근거 없는 제안은 보낼 수 없습니다. 제안·판매 실적은 평가와 보상에 반영되지
                  않습니다 (원칙 1).
                </p>

                {/* 구매대행 쇼핑 */}
                <SectionLabel>구매대행 쇼핑</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-2">
                    {CONCIERGE_SHOP_ITEMS.map((i) => {
                      const on = !!shopSel[i.id];
                      return (
                        <button
                          key={i.id}
                          onClick={() => !shopSent && setShopSel((s) => ({ ...s, [i.id]: !s[i.id] }))}
                          className={`btn-press flex w-full items-center gap-2.5 rounded-xl border p-3 text-left ${
                            on ? "border-gold bg-gold/10" : "border-navy/12"
                          }`}
                        >
                          <span
                            className={`inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded border text-[11px] font-bold ${
                              on ? "border-gold bg-gold text-white" : "border-navy/25 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="flex-1 text-[15px] font-bold text-ink">{i.name}</span>
                          <span className="font-num text-[13px] text-muted">예상 {fmtWon(i.est)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const items = CONCIERGE_SHOP_ITEMS.filter((i) => shopSel[i.id]);
                    const est = items.reduce((s, i) => s + i.est, 0);
                    if (shopSent) {
                      return (
                        <p className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3 text-[13px] font-bold text-green">
                          보호자 승인 요청 전송됨 — 승인되면 구매 후 완료사진을 올립니다.
                        </p>
                      );
                    }
                    if (items.length === 0) {
                      return (
                        <p className="mt-3 text-[12px] text-muted">
                          물품을 담으면 예상금액과 함께 보호자 승인 요청이 전송됩니다.
                        </p>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          setShopSent(true);
                          dispatch({
                            type: "addRequest",
                            payload: {
                              id: `rq-${Date.now()}`,
                              dir: "fromConcierge",
                              type: "결제가 필요합니다",
                              detail: `구매대행: ${items.map((i) => i.name).join(", ")} — 약국·마트 구매 후 다음 방문 때 전달합니다.`,
                              amount: est,
                              preferredDate: null,
                              urgency: "normal",
                              assignee: "박지현",
                              photos: [],
                              status: "awaitingPayment",
                              history: [
                                { at: Date.now(), status: "requested", note: "구매대행 쇼핑 등록" },
                                { at: Date.now(), status: "confirmed", note: "" },
                                { at: Date.now(), status: "awaitingPayment", note: `예상 금액 ${fmtWon(est)}` },
                              ],
                              proof: null,
                            },
                          });
                          dispatch({
                            type: "audit",
                            event: { kind: "request", label: `구매대행 승인 요청 · ${items.length}개 품목` },
                          });
                          push("구매대행", `구매대행 ${items.length}건 승인 요청 · 예상 ${fmtWon(est)}`, "#B08D57");
                        }}
                        className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white"
                      >
                        보호자 승인 요청 · 예상 {fmtWon(est)}
                      </button>
                    );
                  })()}
                  {purchasing.length > 0 && (
                    <div className="mt-3 border-t border-navy/10 pt-3">
                      <SectionLabel>구매 진행중 — 완료사진</SectionLabel>
                      {purchasing.map((r) => (
                        <div key={r.id} className="mt-2 flex items-center gap-2">
                          <span className="flex-1 text-[13px] font-bold text-ink">{r.type}</span>
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

                {/* 컨시어지 요청 — 해주세요와 스토어를 하나로 묶어 보호자 홈에
                    "컨시어지 요청"으로 뜬다 (2026-08-12 실무진). 프리셋 칩(요청 예시)은
                    같은 요청으로 삭제했다 — 현장에서 직접 쓰는 편이 정확하다. */}
                <SectionLabel>컨시어지 요청 — 보호자 홈에 표시</SectionLabel>
                <Card className="p-4">
                  <textarea
                    rows={3}
                    value={reqText}
                    onChange={(e) => setReqText(e.target.value)}
                    placeholder="현장에서 확인한 내용을 그대로 적습니다. 물품이 필요하면 품목과 수량까지 함께 적어 주세요."
                    className="w-full resize-none rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] leading-[1.65] outline-none focus:border-gold"
                  />
                  <button
                    disabled={!reqText.trim() || reqSent}
                    onClick={() => {
                      dispatch({
                        type: "addRequest",
                        payload: {
                          id: `rq-${Date.now()}`,
                          dir: "fromConcierge",
                          type: "컨시어지 요청",
                          detail: reqText.trim(),
                          amount: null,
                          preferredDate: null,
                          urgency: "normal",
                          assignee: "박지현",
                          photos: [],
                          status: "requested",
                          history: [{ at: Date.now(), status: "requested", note: "컨시어지 현장 등록" }],
                          proof: null,
                        },
                      });
                      dispatch({ type: "audit", event: { kind: "request", label: "컨시어지 요청 등록" } });
                      setReqSent(true);
                    }}
                    className="btn-press mt-2.5 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white disabled:opacity-40"
                  >
                    {reqSent ? "✓ 보호자에게 전달됨" : "보호자에게 요청 보내기"}
                  </button>
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
                            `현장의 소리 접수 — ${voiceType} (${voiceAnon ? "익명" : "박지현"})${
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
                    push("정산", "박지현 조기 지급 신청 · 한도 내 승인 대기", "#8FA9CC");
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

          {/* 하단 탭 4개 — 오늘 · 리포트 · 제안 · 정산 (디자인 콘솔) */}
          <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-navy/10 bg-white/95 backdrop-blur">
            <div className="grid grid-cols-4">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[12px] font-bold ${
                      active ? "text-navy" : "text-muted"
                    }`}
                  >
                    <Icon name={t.icon} size={19} />
                    <span>{t.label}</span>
                    {active && <span className="mt-0.5 h-[3px] w-5 rounded-full bg-gold" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {kitOpen && (
            <KitSheet
              items={state.kit}
              onboarding={state.onboarding}
              onClose={() => setKitOpen(false)}
              onDone={({ items, refill, estAmount }) => {
                dispatch({ type: "kitUpdate", items });
                dispatch({
                  type: "audit",
                  patch: { kitDone: true },
                  event: { kind: "photo", label: "케어박스 점검 · 전체사진 촬영" },
                });
                if (refill.length > 0) {
                  dispatch({
                    type: "addRequest",
                    payload: {
                      id: `rq-${Date.now()}`,
                      dir: "fromConcierge",
                      type: "약이 부족합니다",
                      detail: `보충 필요: ${refill.join(", ")}. 고객 요청 시 약국 구매대행으로 진행합니다.`,
                      amount: estAmount,
                      preferredDate: null,
                      urgency: "normal",
                      assignee: "박지현",
                      photos: ["kit-check.jpg"],
                      status: "awaitingPayment",
                      history: [
                        { at: Date.now(), status: "requested", note: "케어박스 점검 중 확인" },
                        { at: Date.now(), status: "confirmed", note: "" },
                        { at: Date.now(), status: "awaitingPayment", note: `예상 금액 ${fmtWon(estAmount)}` },
                      ],
                      proof: null,
                    },
                  });
                  dispatch({
                    type: "audit",
                    event: { kind: "request", label: `보충 승인 요청 · ${refill.length}개 품목` },
                  });
                }
                setKitOpen(false);
              }}
            />
          )}

          {reportOpen && (
            <ReportSheet
              onClose={() => setReportOpen(false)}
              onSend={({ flagged, note, secretNote, shared }) => {
                dispatch({
                  type: "audit",
                  patch: { reportSent: true },
                  event: { kind: "report", label: `관찰 리포트 발송 · 특이 ${flagged}건` },
                });
                dispatch({
                  type: "addReport",
                  payload: {
                    id: `rp-${Date.now()}`,
                    by: "박지현",
                    flagged,
                    note: note || "특이 관찰 없음.",
                    secretNote,
                    shared,
                  },
                });
                push("리포트", `케어 리포트 발송 · 특이 ${flagged}건${shared ? " · 보호자 공유" : " · 내부 전용"}`, "#8FA9CC");
                setReportOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StepBtn({ done, disabled, label, onClick }) {
  // 활성 배경 주홍색 — 수행 단계 버튼 강조 (요청 반영)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press min-h-[64px] rounded-xl border p-2 text-[13px] font-bold leading-[1.4] ${
        done
          ? "border-green/30 bg-green/10 text-green"
          : disabled
          ? "border-navy/10 text-muted/40"
          : "btn-dark border-[#D9542B] bg-[#D9542B] text-white"
      }`}
    >
      {done ? "✓ " : ""}
      {label}
    </button>
  );
}

// 케어박스 점검 시트 — REQ-10
// 의약품(isMedicine)은 수량 확인만. 보충은 보호자 승인 → 구매대행.
function KitSheet({ items, _onboarding, onClose, onDone }) {
  const [rows, setRows] = useState(items);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [newKitPhoto, setNewKitPhoto] = useState(false); // 새 키트 전달사진 (회의 7.3)

  const refill = useMemo(() => rows.filter((r) => r.low).map((r) => r.name), [rows]);
  const estAmount = refill.length * 9000; // 데모용 추정 단가

  const setQty = (i, d) =>
    setRows((rs) =>
      rs.map((r, j) =>
        j === i ? { ...r, qty: Math.max(0, r.qty + d), low: r.qty + d <= 1 } : r
      )
    );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">안심케어박스 점검</div>
        <p className="mt-1 text-[12px] leading-[1.6] text-muted">
          품목별 잔여량·유효기간·개봉 여부를 기록합니다. 의약품은{" "}
          <b>수량 확인과 구매대행만</b> — 복약 보조는 직무 범위가 아닙니다.
        </p>

        <button
          onClick={() => setPhotoTaken(true)}
          className={`btn-press mt-4 w-full rounded-xl border py-3 text-[15px] font-bold ${
            photoTaken ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
          }`}
        >
          {photoTaken ? "✓ 기존 키트 전체사진 촬영됨 (데모)" : "기존 키트 전체사진 촬영"}
        </button>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.name} className="rounded-xl border border-navy/10 p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[15px] font-bold text-ink">
                  {r.name}
                  {r.isMedicine && (
                    <span className="ml-1.5 rounded bg-amber/10 px-1.5 py-[1px] text-[10px] font-bold text-amber">
                      수량 확인만
                    </span>
                  )}
                </span>
                {r.low && (
                  <Badge fg="#C0392B" bg="rgba(192,57,43,.1)">
                    보충 필요
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[13px] text-muted">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQty(i, -1)}
                    className="btn-press h-[30px] w-[30px] rounded-lg border border-navy/15 font-bold"
                  >
                    −
                  </button>
                  <span className="w-[52px] text-center font-num font-bold text-navy">
                    {r.qty}
                    {r.unit}
                  </span>
                  <button
                    onClick={() => setQty(i, 1)}
                    className="btn-press h-[30px] w-[30px] rounded-lg border border-navy/15 font-bold"
                  >
                    +
                  </button>
                </div>
                {r.expiry && <span>유효 {r.expiry}</span>}
                <span>{r.opened ? "개봉" : "미개봉"}</span>
              </div>
            </div>
          ))}
        </div>

        {refill.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] p-3.5 text-[13px] leading-[1.7] text-[#5A4A22]">
            보충 필요 {refill.length}건: {refill.join(", ")}
            <br />
            예상 금액 <b className="font-num">{fmtWon(estAmount)}</b> — 보호자 승인 요청과 함께
            전송됩니다.
          </div>
        )}

        {/* 새 키트 전달사진 — 교체 완료 증빙 */}
        <button
          onClick={() => setNewKitPhoto(true)}
          className={`btn-press mt-3 w-full rounded-xl border py-3 text-[15px] font-bold ${
            newKitPhoto ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
          }`}
        >
          {newKitPhoto ? "✓ 새 키트 전달사진 촬영됨 (데모)" : "새 키트 전달사진 촬영"}
        </button>

        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={!photoTaken || !newKitPhoto}
            onClick={() => onDone({ items: rows, refill, estAmount })}
          >
            점검 완료{refill.length > 0 ? " + 승인 요청 보내기" : ""}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// 관찰 리포트 시트 — REQ-11. 관찰 사실과 발언 인용만. 진단·소견 금지.
function ReportSheet({ onClose, onSend }) {
  const [flags, setFlags] = useState({});
  const [note, setNote] = useState("");
  const [secretNote, setSecretNote] = useState("");
  const [shared, setShared] = useState(true); // 보호자 열람 범위 설정 (회의 7)

  const banned = DIAGNOSIS_WORDS.filter((w) => note.includes(w));
  const flagged = Object.values(flags).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">가정환경 · 정서 관찰 리포트</div>
        <p className="mt-1 text-[12px] leading-[1.7] text-muted">
          관찰한 사실과 들은 말만 적어주세요. 판단·진단은 기록하지 않습니다. 음성으로
          불러주면 AI가 관찰 문장으로 정리하고, 진단 표현은 자동 차단됩니다.
          <br />
          좋은 예: &ldquo;지난 방문보다 대화량이 감소했고, &lsquo;아무것도 하기 싫다&rsquo;는
          말을 세 차례 함.&rdquo;
        </p>

        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {OBSERVATION_ITEMS.map((it) => {
            const on = !!flags[it];
            return (
              <button
                key={it}
                onClick={() => setFlags((f) => ({ ...f, [it]: !f[it] }))}
                className={`btn-press rounded-xl border px-2.5 py-2.5 text-left text-[13px] font-bold leading-[1.4] ${
                  on ? "border-amber bg-amber/10 text-amber" : "border-navy/12 text-muted"
                }`}
              >
                {it}
                <span className="mt-0.5 block text-[11px] font-medium">
                  {on ? "특이 관찰" : "양호"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <SectionLabel>관찰 내용 · 직접 발언 인용</SectionLabel>
            <button
              onClick={() => setNote((n) => (n.trim() ? n : AI_VOICE_DRAFT))}
              className="btn-press rounded-lg border border-navy/20 px-2.5 py-1.5 text-[12px] font-bold text-navy"
            >
              🎙 AI 음성 초안 (데모)
            </button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder='예: 거실에 신문이 쌓여 있음. "요즘 입맛이 없다"고 두 번 말씀하심.'
            className={`mt-2 w-full resize-none rounded-xl border px-3.5 py-3 text-[16px] leading-[1.7] outline-none ${
              banned.length ? "border-danger" : "border-navy/15 focus:border-gold"
            }`}
          />
          {banned.length > 0 && (
            <p className="mt-1.5 rounded-lg bg-danger/8 px-3 py-2 text-[12px] font-bold leading-[1.6] text-danger">
              &lsquo;{banned.join(", ")}&rsquo; — 진단 표현은 기록할 수 없습니다 (의료법
              제17조). 관찰한 사실과 직접 발언 인용으로 바꿔 주세요.
            </p>
          )}
        </div>

        <div className="mt-4">
          <SectionLabel>내부 메모 (비공개 · 선택)</SectionLabel>
          <input
            value={secretNote}
            onChange={(e) => setSecretNote(e.target.value)}
            placeholder="다음 방문 인계용 — 보호자에게 보이지 않습니다"
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] outline-none focus:border-gold"
          />
        </div>

        <button
          onClick={() => setShared((s) => !s)}
          className={`btn-press mt-4 flex w-full items-center gap-2 rounded-xl border p-3 text-left ${
            shared ? "border-green/40 bg-green/5" : "border-navy/15"
          }`}
        >
          <span
            className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[12px] font-bold ${
              shared ? "border-green bg-green text-white" : "border-navy/25 text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="text-[13px] font-bold text-ink">보호자에게 공유</span>
          <span className="ml-auto text-[11px] text-muted">
            {shared ? "가족 앱 케어 리포트에 표시" : "내부 전용 — 관리자·본인만"}
          </span>
        </button>

        <div className="mt-5 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={banned.length > 0 || (!note.trim() && flagged === 0)}
            onClick={() => onSend({ flagged, note: note.trim(), secretNote: secretNote.trim(), shared })}
          >
            리포트 발송 (특이 {flagged}건)
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
