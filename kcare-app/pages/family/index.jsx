import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, Badge, PendingTag, Avatar } from "../../components/ui";
import { ELDER, GUARDIANS, WEEKLY, OUTING, EVENT_KINDS } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
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

  const upcoming = [...state.events].sort((a, b) => a.at - b.at).find((e) => e.at > Date.now());
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
            <div className="text-[11px] font-bold tracking-[.14em] opacity-85">
              긴급 · SOS 수신
            </div>
            <div className="mt-1 text-[17px] font-bold">어머니가 도움을 요청했습니다</div>
            <div className="mt-0.5 text-[12px] opacity-90">
              박지현 · 서다인 2인 급파 중 (1.2km) · 관제센터 확인
            </div>
            <button
              onClick={() => dispatch({ type: "demo", payload: { sos: false } })}
              className="btn-press mt-3 w-full rounded-[10px] bg-white py-3 text-[14px] font-bold text-danger"
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
              <span className="text-[11px] font-bold text-amber">
                AI 이상 징후 감지 · 사람 확인 필요
              </span>
            </div>
            <div className="mt-2 text-[15px] font-bold leading-[1.5] text-ink">
              새벽 3시 12분, 거실에서 5초간 급격한 움직임 후 정지
            </div>
            <p className="mt-1 text-[12px] leading-[1.7] text-[#5A4A22]">
              낙상 의심 패턴입니다. 어르신은 아직 SOS를 누르지 않았습니다.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["03:12", "거실 급가속 후 5초 정지", "낙상 의심", "#C0392B"],
                ["03:14", "심박 108bpm · 평소 대비 +50%", "이상", "#8A5D12"],
                ["08:00", "아침 혈압약 복약 미기록", "미이행", "#8A5D12"],
              ].map(([t, txt, tag, color]) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="w-[40px] shrink-0 font-num text-[10px] font-bold text-amber">
                    {t}
                  </span>
                  <span className="flex-1 text-[12px] text-ink">{txt}</span>
                  <span className="text-[11px] font-bold" style={{ color }}>
                    {tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "sent" } })}
                className="btn-press flex-1 animate-escalateGlow rounded-[10px] bg-danger py-3 text-[13px] font-bold text-white"
              >
                지금 확인 요청
              </button>
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "dismissed" } })}
                className="btn-press flex-1 rounded-[10px] border border-amber/30 bg-white/60 py-3 text-[13px] font-bold text-amber"
              >
                괜찮습니다
              </button>
            </div>
            {/* 제품 약속 — 생략 불가 (repo-CLAUDE.md) */}
            <p className="mt-3 text-[10px] leading-[1.6] text-[#8A7A4E]">
              AI는 감지·제안만 하고 조치는 사람이 결정합니다 · 오탐 신고는 모델 재학습에
              반영됩니다
            </p>
          </div>
        )}

        {anomaly === "sent" && (
          <div className="rounded-card border border-green/30 bg-gradient-to-b from-[#F1FAF6] to-[#E6F4EE] p-[18px]">
            <div className="text-[13px] font-bold text-green">확인 요청을 전달했습니다</div>
            <p className="mt-1 text-[12px] leading-[1.7] text-muted">
              관제센터가 안부콜을 진행하고, 필요 시 담당 컨시어지가 방문합니다. 결과는 이
              화면과 알림으로 전달됩니다.
            </p>
          </div>
        )}

        {/* 다음 일정 — REQ-02: 홈에는 한 줄만, 클릭 시 캘린더 */}
        {upcoming && (
          <Link href="/family/calendar" className="block">
            <Card className="btn-press flex items-center gap-3 p-4">
              <span
                className="h-[38px] w-[4px] shrink-0 rounded-full"
                style={{ background: EVENT_KINDS[upcoming.kind].color }}
              />
              <div className="min-w-0 flex-1">
                <SectionLabel>다음 일정</SectionLabel>
                <div className="mt-0.5 truncate text-[14px] font-bold text-navy">
                  {fmtDT(upcoming.at)} · {upcoming.title}
                </div>
              </div>
              <span className="text-[18px] text-muted/50">›</span>
            </Card>
          </Link>
        )}

        {/* 승인 대기 배지 — REQ-03/07 연결 */}
        {pendingApprovals > 0 && (
          <Link href="/family/requests" className="block">
            <Card className="btn-press flex items-center justify-between border-amber/30 p-4">
              <div className="text-[13px] font-bold text-amber">
                결제 승인이 필요한 요청 {pendingApprovals}건
              </div>
              <span className="text-[18px] text-amber/60">›</span>
            </Card>
          </Link>
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
          <div className="mt-2 text-[17px] font-bold leading-[1.55]">
            어제 잘 주무셨고, 아침 약도 챙겨 드셨습니다. 오후에 동네 한 바퀴 산책도
            하셨어요.
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3.5">
            {WEEKLY.map((w) => (
              <div key={w.name}>
                <div className="text-[10px] text-white/55">{w.name}</div>
                <div className="font-num text-[16px] font-bold">
                  {w.value}{" "}
                  <span className="text-[10px] font-bold text-[#4ADE80]">{w.delta}</span>
                </div>
                <div className="text-[9px] text-white/40">{w.last}</div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-[11px] leading-[1.7] text-white/55">
            숫자를 읽고 판단하는 일은 저희가 합니다. 한 줄이 초록이면 연락하지 않으셔도
            됩니다.
          </p>
        </div>

        {/* 실시간 건강 요약 — 실연동 대기 정직 표기 */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <SectionLabel>실시간 건강 요약</SectionLabel>
            <PendingTag>웨어러블 실연동 대기</PendingTag>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[
              ["심박", "72", "bpm"],
              ["걸음", "3,820", "보"],
              ["수면", "6.4", "시간"],
              ["혈압", "128/84", ""],
            ].map(([k, v, u]) => (
              <div key={k} className="rounded-xl bg-paper p-3">
                <div className="text-[11px] text-muted">{k}</div>
                <div className="font-num text-[22px] font-bold text-navy">
                  {v} <span className="text-[11px] font-bold text-muted">{u}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 오늘 외출 컨디션 — 두 구간 중 낮은 값 대표 (안전 측) */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <SectionLabel>오늘 외출 컨디션</SectionLabel>
            <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">
              주의
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-num text-[30px] font-bold text-navy">{repScore}</span>
            <span className="text-[11px] text-muted">/ 100 · 두 구간 중 낮은 값</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {OUTING.legs.map((l) => (
              <div key={l.tag} className="flex items-center gap-2 text-[12px]">
                <span className="w-[34px] shrink-0 font-bold text-gold">{l.tag}</span>
                <span className="flex-1 text-muted">{l.place}</span>
                <span className="font-num font-bold text-navy">{l.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-paper p-3 text-[12px] leading-[1.7] text-ink">
            {OUTING.advice}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {OUTING.kit.map((k) => (
              <span
                key={k}
                className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-amber"
              >
                {k}
              </span>
            ))}
          </div>
        </Card>

        {/* 형제 공동 관리 — 순위 없음, 사실만 */}
        <Card className="p-[18px]">
          <SectionLabel>가족 공동 관리</SectionLabel>
          <div className="mt-3 space-y-3">
            {GUARDIANS.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <Avatar name={g.name} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">
                    {g.name}
                    {g.isPrimary && (
                      <span className="ml-1.5 text-[10px] font-bold text-gold">연락 담당</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted">
                    {g.relation} · {g.residence}
                  </div>
                </div>
                <div className="font-num text-[12px] font-bold text-muted">분담 {g.share}</div>
              </div>
            ))}
          </div>
          <p className="mt-3.5 border-t border-navy/10 pt-3 text-[11px] leading-[1.7] text-muted">
            연락 담당은 한 명으로 고정하고 결과는 세 분 모두에게 동시에 전달됩니다.
          </p>
        </Card>

        {/* 멤버십 상태 — 온보딩 결과 반영 (REQ-05·07·15) */}
        <Card className="p-[18px]">
          <SectionLabel>멤버십</SectionLabel>
          <div className="mt-3 space-y-2 text-[13px]">
            <Row k="서비스 지역" v={ob ? `${ob.district} · ${ob.tier === 2 ? "2급지" : "1급지"}` : `${ELDER.district} · 1급지 (데모)`} />
            <Row k="월 구독료" v={ob?.tier === 2 ? "별도 산정 (상담 예정)" : fmtWon(57000)} />
            <Row
              k="결제권한"
              v={
                ob
                  ? ob.paymentMode === "limit"
                    ? `${fmtWon(ob.limitAmount)} 이하 어르신 직접 결제`
                    : { both: "양쪽 모두 결제", guardianOnly: "보호자만 결제", elderOnly: "어르신만 결제" }[ob.paymentMode]
                  : `${fmtWon(50000)} 이하 어르신 직접 결제 (데모)`
              }
            />
            <Row k="병원동행 잔여" v="연 4회 중 3회 남음" />
            <Row k="안심방문" v="이번 달 예정 · 캘린더 참조" />
          </div>
        </Card>

        {/* 시연 컨트롤 — 데모 전용 */}
        <div className="pt-1 text-center">
          <button
            onClick={() => setDemoOpen((v) => !v)}
            className="text-[11px] font-bold text-muted/50 underline underline-offset-2"
          >
            시연 컨트롤 {demoOpen ? "닫기" : "열기"}
          </button>
          {demoOpen && (
            <div className="mt-2 flex justify-center gap-2">
              <button
                onClick={() => dispatch({ type: "demo", payload: { sos: !state.demo.sos } })}
                className="btn-press rounded-lg border border-navy/20 px-3 py-1.5 text-[11px] font-bold text-muted"
              >
                SOS {state.demo.sos ? "해제" : "발생"}
              </button>
              <button
                onClick={() => dispatch({ type: "demo", payload: { anomaly: "open" } })}
                className="btn-press rounded-lg border border-navy/20 px-3 py-1.5 text-[11px] font-bold text-muted"
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

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="text-right font-bold text-ink">{v}</span>
    </div>
  );
}
