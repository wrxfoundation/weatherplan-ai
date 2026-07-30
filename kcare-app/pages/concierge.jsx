import Head from "next/head";
import { useMemo, useState } from "react";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge } from "../components/ui";
import {
  AI_REPORT,
  CARE_SUGGESTIONS,
  CONCIERGE_SHOP_ITEMS,
  DIAGNOSIS_WORDS,
  EARNINGS,
  KIT_DOCS,
  OBSERVATION_ITEMS,
  OUTING,
  PAIR_TODAY,
  TODAY_ROUTE,
  VIDEO_MODES,
  VIDEO_POLICY,
  VIDEO_SEGMENTS,
} from "../lib/mock";
import { CONCIERGE_PRESETS } from "../lib/requests";
import { fmtWon } from "../lib/config";
import { useAppState } from "../lib/state";

// 컨시어지 앱 — REQ-09(동선·주소 게이팅) · REQ-10(케어박스) · REQ-11(관찰 리포트)
// · REQ-12(감사 타임라인·영상) + 디자인 콘솔 정합 (오늘·리포트·제안·정산 4탭).
// 절대 규칙(원칙 유지): 평가·보상에 판매액 없음 (업셀링 인센티브 → 케어 품질 인센티브로 대체)
// · 의료 측정값 입력 없음 · 소견/진단 기재 금지 · 1인 진입 금지(2인 체크인) · 제안은 근거 동반.

const TABS = [
  { key: "today", label: "오늘", icon: "⌂" },
  { key: "report", label: "리포트", icon: "▤" },
  { key: "suggest", label: "제안", icon: "◇" },
  { key: "pay", label: "정산", icon: "₩" },
];

export default function ConciergePage() {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState("today");
  const [kitOpen, setKitOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shopSel, setShopSel] = useState({});
  const [shopSent, setShopSent] = useState(false);
  const [apptDone, setApptDone] = useState(false);
  const [pairCalled, setPairCalled] = useState(false);
  const [pairSigned, setPairSigned] = useState(false); // 서다인 서명 (데모)
  const [aiSent, setAiSent] = useState(false);
  const [pdfIssued, setPdfIssued] = useState(false);
  const [suggested, setSuggested] = useState({});
  const [earlyPay, setEarlyPay] = useState(false);
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
      <div className="min-h-screen bg-nav">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper">
          <header className="sticky top-0 z-20 border-b border-navy/10 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-num text-[10px] font-bold tracking-[.18em] text-gold">
                  CONCIERGE
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[19px] font-black text-navy">박지현 · 주 동행</span>
                  <span className="chip-gold rounded-full px-2 py-[3px] font-num text-[9px] font-bold">
                    {EARNINGS.grade}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href="/" className="text-[11px] font-bold text-muted/50">
                  데모 홈
                </a>
                <button
                  onClick={() => dispatch({ type: "demo", payload: { offline: !state.demo.offline } })}
                  className="btn-press rounded-lg border border-navy/20 px-2.5 py-1.5 text-[11px] font-bold text-muted"
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
                {state.demo.offline && (
                  <div className="rounded-[14px] border border-amber/30 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-3.5">
                    <div className="text-[12px] font-bold text-amber">
                      오프라인 — 기록은 기기에 저장 중입니다
                    </div>
                    <p className="mt-1 text-[11px] leading-[1.6] text-[#5A4A22]">
                      오늘 일정·체크리스트는 미리 받아 두었습니다. 연결이 돌아오면 대기 중인 기록{" "}
                      {v.audit.length}건이 자동 전송됩니다.
                    </p>
                  </div>
                )}

                {/* 오늘 동행 — 디자인 콘솔 (시간범위 · 케어 메타 · 짝 · 컨디션 · 출근 체크인) */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="font-num text-[16px] font-bold text-navy">{a1.timeRange}</span>
                    <Badge fg="#FFFFFF" bg="#0A1F3C">
                      {v.checkedIn ? "수행중" : "예정"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[18px] font-black text-navy">
                    {a1.customer} · {a1.hospital}
                  </div>
                  <div className="mt-1 text-[12px] leading-[1.7] text-muted">
                    {a1.meta1}
                    <br />
                    {a1.meta2}
                  </div>

                  {/* 오늘의 짝 — 2인 1조 실행 UI */}
                  <div className="card-navy mt-3.5 rounded-[14px] bg-navy p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-[.1em] text-gold-soft">
                        오늘의 짝
                      </span>
                      <span className="chip-gold rounded-full px-2.5 py-1 text-[10px] font-bold">
                        {v.checkedIn && pairCalled
                          ? "2인 체크인 완료"
                          : pairCalled
                          ? "짝 이동 중"
                          : "짝 체크인 대기"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className="flex h-[48px] w-[48px] shrink-0 items-center justify-center whitespace-nowrap rounded-full text-[13px] font-bold"
                        style={{ background: PAIR_TODAY.avBg, color: PAIR_TODAY.avFg }}
                      >
                        {PAIR_TODAY.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold">
                          {PAIR_TODAY.name} · {PAIR_TODAY.role}
                        </div>
                        <div className="mt-0.5 font-num text-[11px] text-white/65">
                          {PAIR_TODAY.eta}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (pairCalled) return;
                          setPairCalled(true);
                          push("동행", "부 동행 서다인 호출 · 위치 공유 요청", "#8FA9CC");
                        }}
                        className={`btn-press btn-dark shrink-0 rounded-xl px-4 py-3 text-[13px] font-bold text-white ${
                          pairCalled ? "bg-muted" : "bg-green"
                        }`}
                      >
                        {pairCalled ? "호출됨" : "짝 호출"}
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-white/12 pt-3">
                      {PAIR_TODAY.duties.map((d) => (
                        <div key={d.who} className="flex gap-2.5 text-[12px]">
                          <span className="w-[52px] shrink-0 font-bold text-gold-soft">{d.who}</span>
                          <span className="flex-1 leading-[1.6] text-white/85">{d.what}</span>
                        </div>
                      ))}
                    </div>
                    {/* 1인 진입 금지 — 원칙의 실행 카피 */}
                    <p className="mt-3 border-t border-white/12 pt-2.5 text-[11px] leading-[1.7] text-white/60">
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
                      <span className="text-[12px] font-bold text-[#5C7799]">
                        외출 컨디션 · 2구간
                      </span>
                      <span className="font-num text-[10px] text-muted">{OUTING.asOf}</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {OUTING.legs.map((l) => (
                        <div key={l.tag} className="flex items-center gap-2 text-[12px]">
                          <span className="w-[30px] shrink-0 font-bold text-gold">{l.tag}</span>
                          <span className="shrink-0 font-bold text-ink">{l.place}</span>
                          <span className="flex-1 truncate text-right text-[11px] text-muted">
                            {l.compact}
                          </span>
                          <span className="font-num text-[14px] font-bold text-navy">{l.score}</span>
                          <span
                            className="w-[28px] text-right text-[11px] font-bold"
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
                      <span key={k} className="chip-gold rounded-full px-2.5 py-1 text-[11px] font-bold">
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
                    className={`btn-press btn-dark mt-4 w-full rounded-xl py-3.5 text-[15px] font-bold text-white ${
                      v.checkedIn ? "bg-green" : "bg-navy"
                    }`}
                  >
                    {v.checkedIn ? "✓ 출근 체크인 완료" : "GPS 출근 체크인"}
                  </button>
                </Card>

                {/* 다음 일정 — 주소 게이팅 유지 (REQ-09) */}
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-num text-[14px] font-bold text-navy">{a2.time}</span>
                    <span className="text-[13px] font-bold text-ink">{a2.customer}</span>
                    <span className="ml-auto">
                      <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">
                        배정 대기
                      </Badge>
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-muted">{a2.purpose}</div>
                  <div className="mt-2 border-t border-navy/10 pt-2 text-[12px]">
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
                          <div key={i} className="flex items-center gap-2 text-[12px]">
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
                      <p className="mt-2.5 text-[10px] leading-[1.6] text-muted">
                        GPS·시간·체크리스트·사진·리포트가 하나의 방문 기록으로 묶여 보관됩니다.
                        {state.demo.offline && " (오프라인 — 연결 복구 시 전송)"}
                      </p>
                    </div>
                  )}
                </Card>

                {/* 영상 3모드 — REQ-12 */}
                <SectionLabel>영상</SectionLabel>
                <Card className="p-4">
                  <div className="space-y-2.5">
                    {VIDEO_MODES.map((m) => (
                      <div key={m.key} className="rounded-xl border border-navy/10 p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-navy">{m.name}</span>
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
                        <p className="mt-1 text-[10px] leading-[1.6] text-muted">{m.rule}</p>
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
                                className="btn-press rounded-full border border-navy/15 px-3 py-1.5 text-[11px] font-bold text-muted"
                              >
                                ⏺ {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {m.key === "tele" && (
                          <p className="mt-1.5 text-[11px] font-bold text-muted/70">
                            고객·보호자 요청 대기 중 — 요청 없이는 연결하지 않습니다
                          </p>
                        )}
                        {m.key === "sos" && state.demo.sos && (
                          <button
                            onClick={() =>
                              dispatch({
                                type: "audit",
                                event: { kind: "video", label: "긴급 영상 — 관제센터 일시 공유 시작" },
                              })
                            }
                            className="btn-press mt-1.5 rounded-lg bg-danger px-3 py-2 text-[11px] font-bold text-white"
                          >
                            관제센터 영상 공유
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 border-t border-navy/10 pt-2.5 text-[10px] leading-[1.7] text-muted">
                    촬영 불가: {VIDEO_POLICY.banned.join(" · ")} (내부 규정) · 보관: {VIDEO_POLICY.retention}
                  </p>
                </Card>

                {/* 다음 진료 예약 — 공유 캘린더 즉시 반영 (REQ-02) */}
                <SectionLabel>다음 진료 예약</SectionLabel>
                <Card className="p-4">
                  <p className="text-[12px] leading-[1.7] text-muted">
                    병원에서 다음 예약을 잡으면 여기서 등록합니다. 보호자·어르신 캘린더에 즉시
                    공유됩니다.
                  </p>
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
                          title: "정형외과 재진 · 분당서울대병원",
                          at: at.getTime(),
                          source: "컨시어지 등록",
                          note: "병원 접수처에서 예약 확정 · 자동 공유됨",
                        },
                      });
                      dispatch({
                        type: "audit",
                        event: { kind: "check", label: "다음 진료 예약 등록 · 캘린더 공유" },
                      });
                      push("예약", "다음 진료 예약 등록 · 보호자·어르신 캘린더 공유", "#8FA9CC");
                    }}
                    disabled={apptDone}
                    className={`btn-press mt-3 w-full rounded-xl border py-3 text-[13px] font-bold ${
                      apptDone ? "border-green/30 bg-green/10 text-green" : "border-navy bg-navy text-white"
                    }`}
                  >
                    {apptDone ? "✓ 등록됨 · 3주 뒤 오전 9시 30분" : "다음 예약 등록 (병원 확정분)"}
                  </button>
                </Card>
              </>
            )}

            {/* ════ 리포트 탭 ════ */}
            {tab === "report" && (
              <>
                {/* 동행 완료 리포트 — AI 초안 + 2인 서명 (디자인 콘솔) */}
                <Card className="p-[18px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-black text-navy">동행 완료 리포트</span>
                    <span className="chip-gold rounded-full px-2.5 py-1 text-[10px] font-bold">
                      AI 초안 · 음성 기록 기반
                    </span>
                  </div>
                  <div
                    className="mt-3 rounded-xl p-3.5 text-[13px] leading-[1.75] text-ink"
                    style={{
                      background: "linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)",
                    }}
                  >
                    {AI_REPORT.draft}
                  </div>
                  <p className="mt-2 text-[11px] leading-[1.65] text-muted">{AI_REPORT.hitl}</p>

                  {/* 2인 확인 서명 — 각자의 기록이 각자의 증언 */}
                  <div className="mt-3.5 rounded-xl border border-navy/10 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-navy">2인 확인 서명</span>
                      <span className="font-num text-[11px] font-bold text-muted">
                        {pairSigned ? "2 / 2 서명" : "1 / 2 서명"}
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-green text-[11px] font-bold text-white">
                          ✓
                        </span>
                        <span className="flex-1 text-[13px] font-bold text-ink">박지현 · 주 동행</span>
                        <span className="font-num text-[11px] text-muted">15:52</span>
                      </div>
                      <button
                        onClick={() => !pairSigned && setPairSigned(true)}
                        className="flex w-full items-center gap-2.5 text-left"
                      >
                        <span
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border text-[11px] font-bold ${
                            pairSigned ? "border-green bg-green text-white" : "border-navy/25 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span className="flex-1 text-[13px] font-bold text-ink">서다인 · 부 동행</span>
                        <span className="font-num text-[11px] text-muted">
                          {pairSigned ? "15:58 (데모)" : "대기 — 눌러서 서명 시연"}
                        </span>
                      </button>
                    </div>
                    <p className="mt-2.5 border-t border-navy/[.08] pt-2 text-[10px] leading-[1.7] text-muted">
                      {AI_REPORT.signRule}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (pdfIssued) return;
                      setPdfIssued(true);
                      push("리포트", "증빙 보고서 PDF 발행 (데모)", "#8FA9CC");
                    }}
                    className={`btn-press mt-3 w-full rounded-xl border py-3 text-[13px] font-bold ${
                      pdfIssued ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
                    }`}
                  >
                    {pdfIssued ? "✓ 증빙 보고서 발행됨 (데모)" : "증빙 보고서 발행 · PDF"}
                  </button>
                  <button
                    onClick={() => {
                      if (!pairSigned || aiSent) return;
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
                    disabled={!pairSigned || aiSent}
                    className={`btn-press btn-dark mt-2 w-full rounded-xl py-3.5 text-[14px] font-bold text-white ${
                      aiSent ? "bg-muted" : "bg-green"
                    } disabled:opacity-50`}
                  >
                    {aiSent
                      ? "✓ 가족에게 전달됨"
                      : pairSigned
                      ? "검수 확정 후 가족에게 전달"
                      : "검수 확정 후 가족에게 전달 (2인 서명 필요)"}
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
                            <span className="text-[12px] font-bold text-navy">{r.by}</span>
                            <span className="font-num text-[10px] text-muted">
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
                          <p className="mt-1 text-[12px] leading-[1.65] text-ink">
                            {mine ? r.note : r.shared ? r.note : "비공개 리포트 — 작성자만 열람"}
                          </p>
                          {mine && r.secretNote && (
                            <p className="mt-1 rounded-lg bg-navy/[.05] px-2.5 py-1.5 text-[11px] text-muted">
                              🔒 내부 메모: {r.secretNote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 border-t border-navy/10 pt-2.5 text-[10px] leading-[1.6] text-muted">
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
                      <span className="text-[14px] font-bold text-navy">{sg.item}</span>
                      <span className="font-num text-[12px] text-muted">예상 {fmtWon(sg.est)}</span>
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-amber">{sg.trigger}</div>
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
                      className={`btn-press mt-2.5 w-full rounded-xl border py-2.5 text-[12px] font-bold ${
                        suggested[sg.item]
                          ? "border-green/30 bg-green/10 text-green"
                          : "border-navy/20 text-navy"
                      }`}
                    >
                      {suggested[sg.item] ? "제안 전송됨" : "보호자에게 제안 보내기"}
                    </button>
                  </Card>
                ))}
                <p className="px-1 text-[10px] leading-[1.7] text-muted">
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
                            className={`inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                              on ? "border-gold bg-gold text-white" : "border-navy/25 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="flex-1 text-[13px] font-bold text-ink">{i.name}</span>
                          <span className="font-num text-[12px] text-muted">예상 {fmtWon(i.est)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const items = CONCIERGE_SHOP_ITEMS.filter((i) => shopSel[i.id]);
                    const est = items.reduce((s, i) => s + i.est, 0);
                    if (shopSent) {
                      return (
                        <p className="mt-3 rounded-xl border border-green/25 bg-green/5 p-3 text-[12px] font-bold text-green">
                          보호자 승인 요청 전송됨 — 승인되면 구매 후 완료사진을 올립니다.
                        </p>
                      );
                    }
                    if (items.length === 0) {
                      return (
                        <p className="mt-3 text-[11px] text-muted">
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
                        className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[13px] font-bold text-white"
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
                          <span className="flex-1 text-[12px] font-bold text-ink">{r.type}</span>
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
                            className="btn-press rounded-lg border border-green/40 px-3 py-1.5 text-[11px] font-bold text-green"
                          >
                            완료사진 + 종결
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 해주세요 발신 */}
                <SectionLabel>보호자에게 요청</SectionLabel>
                <Card className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {CONCIERGE_PRESETS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          dispatch({
                            type: "addRequest",
                            payload: {
                              id: `rq-${Date.now()}`,
                              dir: "fromConcierge",
                              type: p,
                              detail: "현장 확인 후 등록된 요청입니다. 세부 내용은 방문 기록을 참조해 주세요.",
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
                          dispatch({
                            type: "audit",
                            event: { kind: "request", label: `보호자 요청 등록 · ${p}` },
                          });
                        }}
                        className="btn-press rounded-full border border-navy/15 px-3 py-1.5 text-[12px] font-bold text-muted"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-[1.6] text-muted">
                    등록한 요청은 보호자 &lsquo;해주세요&rsquo; 화면에 상태와 함께 표시됩니다. 성과
                    지표에 판매액은 기록되지 않습니다.
                  </p>
                </Card>
              </>
            )}

            {/* ════ 정산 탭 — MY EARNINGS (원칙 준수 버전) ════ */}
            {tab === "pay" && (
              <>
                <div className="px-1">
                  <div className="font-num text-[10px] font-bold tracking-[.18em] text-gold">
                    MY EARNINGS · {EARNINGS.week}
                  </div>
                </div>

                {/* 주간 확정 수익 — 네이비 카드 */}
                <div className="card-navy rounded-card bg-navy p-[18px] text-white">
                  <div className="text-[11px] font-bold tracking-[.1em] text-gold-soft">
                    이번 주 확정 수익
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-num text-[34px] font-bold leading-none">
                      {EARNINGS.total}
                    </span>
                    <span className="text-[13px] text-white/70">원</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-white/60">{EARNINGS.delta}</div>
                  <div className="mt-4 space-y-2.5 border-t border-white/12 pt-3.5">
                    {EARNINGS.breakdown.map((b) => (
                      <div key={b.name} className="flex items-baseline gap-2 text-[13px]">
                        <span className="font-bold">{b.name}</span>
                        <span className="text-[10px] text-white/50">{b.meta}</span>
                        <span
                          className={`ml-auto font-num text-[14px] font-bold ${b.gold ? "text-gold-soft" : ""}`}
                        >
                          {b.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] leading-[1.7] text-white/50">
                    {EARNINGS.designNote}
                    <br />
                    {EARNINGS.principleNote}
                  </p>
                  <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-white/12 pt-3">
                    {EARNINGS.stats.map(([k, val]) => (
                      <div key={k}>
                        <div className="text-[10px] text-white/50">{k}</div>
                        <div className={`font-num text-[18px] font-bold ${k === "평점" ? "text-gold-soft" : ""}`}>
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 건별 정산 내역 */}
                <Card className="p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-black text-navy">건별 정산 내역</span>
                    <span className="font-num text-[11px] text-muted">{EARNINGS.items.length}건</span>
                  </div>
                  <div className="mt-2 space-y-3">
                    {EARNINGS.items.map((it) => (
                      <div key={it.who} className="flex items-center gap-2.5 border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-bold text-ink">{it.who}</div>
                          <div className="mt-0.5 text-[11px] text-muted">{it.meta}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-num text-[15px] font-bold text-navy">{it.net}</div>
                          <div className="font-num text-[10px] text-muted/70">{it.gross}</div>
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
                  <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[10px] leading-[1.6] text-muted">
                    {EARNINGS.feeNote}
                  </p>
                </Card>

                {/* 등급 인센티브 */}
                <Card className="p-[18px]">
                  <div className="text-[15px] font-black text-navy">등급 인센티브</div>
                  <div className="mt-2.5 flex items-baseline justify-between text-[12px]">
                    <span>
                      <span className="font-num font-bold text-navy">{EARNINGS.tier.now}</span>{" "}
                      <span className="text-muted">{EARNINGS.tier.perk}</span>
                    </span>
                    <span className="font-num text-[11px] text-muted">{EARNINGS.tier.toNext}</span>
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
                  <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">{EARNINGS.tier.nextPerk}</p>
                </Card>

                {/* 수락 현황 — "놓친 수익" 프레임 대신 취소 권한 보장 (원칙 유지) */}
                <div className="rounded-card border border-amber/30 bg-gradient-to-b from-[#FFF7E8] to-[#FBEFD8] p-4">
                  <div className="text-[13px] font-bold text-amber">이번 주 수락 현황</div>
                  <p className="mt-1 text-[12px] leading-[1.75] text-[#5A4A22]">
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
                  className={`btn-press btn-dark w-full rounded-xl py-3.5 text-[14px] font-bold text-white ${
                    earlyPay ? "bg-green" : "bg-navy"
                  }`}
                >
                  {earlyPay ? "✓ 조기 지급 신청됨 · 한도 내 승인 대기" : "조기 지급 신청 (수수료 1%)"}
                </button>
                <p className="px-1 text-center text-[10px] text-muted">{EARNINGS.earlyPayNote}</p>
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
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                      active ? "text-navy" : "text-muted"
                    }`}
                  >
                    <span className="text-[16px] leading-none">{t.icon}</span>
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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press min-h-[64px] rounded-xl border p-2 text-[12px] font-bold leading-[1.4] ${
        done
          ? "border-green/30 bg-green/10 text-green"
          : disabled
          ? "border-navy/10 text-muted/40"
          : "border-navy bg-navy text-white"
      }`}
    >
      {done ? "✓ " : ""}
      {label}
    </button>
  );
}

// 케어박스 점검 시트 — REQ-10
// 의약품(isMedicine)은 수량 확인만. 보충은 보호자 승인 → 구매대행.
function KitSheet({ items, onboarding, onClose, onDone }) {
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
        <div className="text-[17px] font-black text-navy">안심케어박스 점검</div>
        <p className="mt-1 text-[11px] leading-[1.6] text-muted">
          품목별 잔여량·유효기간·개봉 여부를 기록합니다. 의약품은{" "}
          <b>수량 확인과 구매대행만</b> — 복약 보조는 직무 범위가 아닙니다.
        </p>

        <button
          onClick={() => setPhotoTaken(true)}
          className={`btn-press mt-4 w-full rounded-xl border py-3 text-[13px] font-bold ${
            photoTaken ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
          }`}
        >
          {photoTaken ? "✓ 기존 키트 전체사진 촬영됨 (데모)" : "기존 키트 전체사진 촬영"}
        </button>

        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.name} className="rounded-xl border border-navy/10 p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[13px] font-bold text-ink">
                  {r.name}
                  {r.isMedicine && (
                    <span className="ml-1.5 rounded bg-amber/10 px-1.5 py-[1px] text-[9px] font-bold text-amber">
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
              <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
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
          <div className="mt-4 rounded-xl border border-amber/30 bg-[#FFF7E8] p-3.5 text-[12px] leading-[1.7] text-[#5A4A22]">
            보충 필요 {refill.length}건: {refill.join(", ")}
            <br />
            예상 금액 <b className="font-num">{fmtWon(estAmount)}</b> — 보호자 승인 요청과 함께
            전송됩니다.
          </div>
        )}

        {/* 새 키트 전달사진 — 교체 완료 증빙 */}
        <button
          onClick={() => setNewKitPhoto(true)}
          className={`btn-press mt-3 w-full rounded-xl border py-3 text-[13px] font-bold ${
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
        <div className="text-[17px] font-black text-navy">가정환경 · 정서 관찰 리포트</div>
        <p className="mt-1 text-[11px] leading-[1.7] text-muted">
          관찰한 사실과 들은 말만 적어주세요. 판단·진단은 기록하지 않습니다.
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
                className={`btn-press rounded-xl border px-2.5 py-2.5 text-left text-[12px] font-bold leading-[1.4] ${
                  on ? "border-amber bg-amber/10 text-amber" : "border-navy/12 text-muted"
                }`}
              >
                {it}
                <span className="mt-0.5 block text-[10px] font-medium">
                  {on ? "특이 관찰" : "양호"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <SectionLabel>관찰 내용 · 직접 발언 인용</SectionLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder='예: 거실에 신문이 쌓여 있음. "요즘 입맛이 없다"고 두 번 말씀하심.'
            className={`mt-2 w-full resize-none rounded-xl border px-3.5 py-3 text-[14px] leading-[1.7] outline-none ${
              banned.length ? "border-danger" : "border-navy/15 focus:border-gold"
            }`}
          />
          {banned.length > 0 && (
            <p className="mt-1.5 rounded-lg bg-danger/8 px-3 py-2 text-[11px] font-bold leading-[1.6] text-danger">
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
            className="mt-2 w-full rounded-xl border border-navy/15 px-3.5 py-3 text-[13px] outline-none focus:border-gold"
          />
        </div>

        <button
          onClick={() => setShared((s) => !s)}
          className={`btn-press mt-4 flex w-full items-center gap-2 rounded-xl border p-3 text-left ${
            shared ? "border-green/40 bg-green/5" : "border-navy/15"
          }`}
        >
          <span
            className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
              shared ? "border-green bg-green text-white" : "border-navy/25 text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="text-[12px] font-bold text-ink">보호자에게 공유</span>
          <span className="ml-auto text-[10px] text-muted">
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
