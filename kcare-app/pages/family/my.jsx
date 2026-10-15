import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Btn, Sheet, SheetTitle, TONE, WhiteBtn } from "../../components/ds";
import { AI_REPORT, CARE_TEAM, CONSENTS, NPS_REASONS, OUTING, VIDEO_RETENTION_DAYS, VISIT_VIDEOS } from "../../lib/mock";
import { VISIT_REPORT } from "../../lib/visit-report";
import { fmtCard } from "../../lib/payments";
import { useAuth } from "../../lib/auth";
import { useAppState } from "../../lib/state";
import { subjectLabel, trackOf } from "../../lib/tracks";
import { healthOf, medDrugs } from "../../lib/meds";
import { visitReportOf } from "../../lib/live-household";
import { familyOf, meOf, monthlyLabel, shortName } from "../../lib/membership";

// 마이 — 2026-10-15 디자인 시안: 머리('마이' + 오른쪽 위 '내 정보') → 지난 동행 평가 → 여섯 칸
// (동행 리포트 · 방문 리포트 · 건강 · 방문 영상 · 가족 · 정보 동의) → 멤버십 막대.
// 전에 이 화면 한 장에 있던 것은 칸을 누르면 여는 세부 화면으로 옮겼다 (기능은 그대로):
//   건강 정보 · 우선 확인 날씨 → /family/health · 바디캠 영상 → /family/videos · 가족 구성원 · 초대 → /family/members
//   데이터 · 동의 · 접근 기록 → /family/consent · 멤버십 · 결제 관리 · 로그인 계정 → /family/membership
//   안심방문 리포트 → /family/report (A4 문서 /report/visit 로 이어진다)
// 테스트 가구 · 센터 공간은 예시 값을 쓰지 않는다 — 각 칸의 작은 글씨가 실제 기록이 없으면 그렇다고 말한다.

const md = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export default function MyPage() {
  const { state, dispatch } = useAppState();
  const auth = useAuth();
  const ob = state.onboarding;
  const live = !!auth.user?.household;
  const [editOpen, setEditOpen] = useState(false); // 내 정보 수정
  const [escortOpen, setEscortOpen] = useState(false); // 동행 리포트
  const [reviewOpen, setReviewOpen] = useState(false); // 후기 쓰기
  const [score, setScore] = useState(null); // 지난 동행 점수 — 후기와 같이 남긴다
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const subj = subjectLabel(trackOf(ob?.track), ob);
  const me = meOf(auth.user);
  const family = familyOf(me);
  const health = healthOf(state);
  const drugs = medDrugs(health.meds);
  const videoConsent = ob?.joinedAt ? !!ob.videoConsent : true; // 가입 상담 전에는 동의로 본다 (컨시어지 화면과 같은 기본값)
  const videos = VISIT_VIDEOS.filter((v) => VIDEO_RETENTION_DAYS - v.daysAgo > 0 || v.hold);
  const renewNeeded = state.guardian?.consentRenewedAt ? 0 : CONSENTS.filter((c) => c.expiring).length;
  const visit = live ? visitReportOf(state) : null;
  const [, vm, vd] = VISIT_REPORT.head.visitedAt.split(".").map(Number);

  // 동행 평가 — 테스트 가구는 컨시어지가 동행 리포트를 보낸 뒤에만 묻는다 (없던 동행을 '끝났습니다'라고 하지 않는다 · 2026-10-02 UX 점검)
  const rateWhen = live
    ? state.escort?.sentAt
      ? `${new Date(state.escort.sentAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} 동행 리포트를 받으셨어요`
      : null
    : `${OUTING.legs[1]?.place || "병원"} 동행`;

  const tiles = [
    {
      key: "escort",
      label: "동행 리포트",
      sub: live ? (state.escort?.sentAt ? `${md(state.escort.sentAt)} 받음` : "아직 받은 리포트 없음") : OUTING.legs[1]?.place,
      clay: "reportDoc",
      tone: TONE.green,
      onClick: () => setEscortOpen(true),
    },
    {
      key: "visit",
      label: "방문 리포트",
      sub: live ? (visit.sent && visit.visitedTs ? `${md(visit.visitedTs)} 방문` : "아직 오지 않았어요") : `${vm}월 ${vd}일 방문`,
      clay: "houseCheck",
      tone: TONE.beige,
      href: "/family/report",
    },
    {
      key: "health",
      label: `${subj} 건강`,
      sub: `질환 ${health.conditions.length} · 약 ${drugs.length}`,
      clay: "heartPulse",
      // 건강은 위험 신호가 아니다 — 시안의 산호색 대신 분홍 (빨강은 SOS · 낙상 전용)
      tone: { bg: "#F6E3EC", title: "#8A3A62", sub: "#7A4A62" },
      href: "/family/health",
    },
    {
      key: "videos",
      label: "방문 영상",
      sub: live ? "베타는 영상을 받지 않아요" : !videoConsent ? "촬영 동의 전" : `${videos.length}개 보관 중`,
      clay: "videoCam",
      tone: TONE.purple,
      href: "/family/videos",
    },
    {
      key: "members",
      label: "가족",
      sub: `${family.length}명${isPrimary ? " · 초대하기" : ""}`,
      faces: family.slice(0, 3).map((g) => shortName(g.name)),
      tone: TONE.green,
      href: "/family/members",
    },
    {
      key: "consent",
      label: "정보 동의",
      sub: "누가 봤는지 보기",
      clay: "shieldBlue",
      tone: TONE.blue,
      badge: renewNeeded ? `갱신 ${renewNeeded}` : null,
      href: "/family/consent",
    },
  ];

  return (
    <>
      <Head>
        <title>마이 — K-CARE</title>
      </Head>
      <FamilyLayout
        sub={`${me.name} 님`}
        title="마이"
        action={
          <button type="button" onClick={() => setEditOpen(true)} className="ds-press ds-btn3d flex h-[46px] flex-none items-center rounded-[16px] bg-white px-3.5 text-[15px]" style={{ boxShadow: "0 4px 0 #E3DED3" }}>
            내 정보
          </button>
        }
      >
        {rateWhen && (
          <RateCard
            when={rateWhen}
            score={score}
            setScore={setScore}
            onWriteReview={() => setReviewOpen(true)}
            onEvent={(text, color) => dispatch({ type: "pushEvent", payload: { kind: "CS", text, color } })}
            onDetractor={(s, reason) => dispatch({ type: "opsPatch", patch: { npsDetractor: { score: s, reason } } })}
          />
        )}

        {/* 여섯 칸 — 누르면 세부 화면 (동행 리포트만 시트) */}
        <div className="ds-g2 ds-r" style={{ "--d": "80ms", gap: 12 }}>
          {tiles.map((t) => {
            const inner = (
              <>
                {t.badge && (
                  <span className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[13px] font-extrabold text-white" style={{ background: TONE.gold.fg }}>
                    {t.badge}
                  </span>
                )}
                {t.faces ? (
                  <span className="flex" aria-hidden="true">
                    {t.faces.map((f, i) => (
                      <span
                        key={f + i}
                        className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[12px] font-extrabold"
                        style={{
                          marginLeft: i ? -8 : 0,
                          background: i === 0 ? "#1B2340" : i === 1 ? "#ECE8F4" : "#FFFFFF",
                          color: i === 0 ? "#FFFFFF" : "#1B2340",
                          boxShadow: "0 0 0 2px #E4EEE5",
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </span>
                ) : (
                  <Clay name={t.clay} size={44} className="ds-ico" />
                )}
                <span>
                  <span className="block text-[19px] font-extrabold leading-[1.3]" style={{ color: t.tone.title }}>
                    {t.label}
                  </span>
                  <span className="block text-[14px] leading-[1.35]" style={{ color: t.tone.sub }}>
                    {t.sub}
                  </span>
                </span>
              </>
            );
            const cls = "ds-tap relative flex min-h-[150px] flex-col justify-between rounded-[26px] p-4 text-left";
            return t.href ? (
              <Link key={t.key} href={t.href} className={cls} style={{ background: t.tone.bg }}>
                {inner}
              </Link>
            ) : (
              <button key={t.key} type="button" onClick={t.onClick} className={cls} style={{ background: t.tone.bg }}>
                {inner}
              </button>
            );
          })}
        </div>

        {/* 멤버십 막대 — 결제수단이 없으면 등록을 먼저 권한다 (시안의 산호색 글씨는 금색으로) */}
        <Link
          href="/family/membership"
          className="ds-press ds-btn3d ds-r flex min-h-[78px] items-center gap-3.5 rounded-[24px] px-[18px] text-left"
          style={{ "--d": "120ms", background: TONE.beige.bg, boxShadow: `0 5px 0 ${TONE.beige.sh}` }}
        >
          <Clay name="card" size={42} className="flex-none" />
          <span className="min-w-0 flex-1">
            <span className="block text-[18px]" style={{ color: TONE.beige.fg }}>
              멤버십 · 월 {monthlyLabel(ob)}
            </span>
            <span className="block text-[14px] font-bold" style={{ color: state.billing ? TONE.green.title : TONE.gold.fg }}>
              {state.billing ? `${fmtCard(state.billing)} · 매월 자동결제` : "결제수단을 등록해 주세요"}
            </span>
          </span>
          <Line name="chevR" size={22} style={{ color: TONE.beige.fg }} />
        </Link>

        {editOpen && (
          <EditProfileSheet
            me={me}
            live={live}
            guardian={state.guardian || {}}
            onClose={() => setEditOpen(false)}
            onSave={(patch) => {
              dispatch({ type: "guardianPatch", patch });
              dispatch({ type: "pushEvent", payload: { kind: "설정", text: `보호자 ${me.name} 내 정보 수정 (이메일·성별)`, color: "#8FA9CC" } });
              setEditOpen(false);
            }}
          />
        )}
        {escortOpen && <EscortReportSheet live={live} escort={state.escort} onClose={() => setEscortOpen(false)} />}
        {reviewOpen && (
          <ReviewSheet
            reviews={state.reviews || []}
            onClose={() => setReviewOpen(false)}
            onSend={(text) => {
              dispatch({ type: "addReview", payload: { by: me.name, score, text } });
              dispatch({ type: "pushEvent", payload: { kind: "CS", text: `보호자 후기 등록 — ${text.slice(0, 24)}…`, color: "#C9A46B" } });
            }}
          />
        )}
      </FamilyLayout>
    </>
  );
}

// 지난 동행 평가 — NPS 루프: 0–10 → 비추천(≤6)은 사유 + 24h 회복 안내.
// 점수는 정수만 (step=1) — 추천(9·10) / 중립(7·8) / 비추천(0~6) 분류가 정수 위에 서 있다.
// 손잡이는 처음에 8을 가리키지만 막대를 움직이기 전에는 고른 점수가 아니다 (회색 숫자 · '점수 남기기' 잠김).
function RateCard({ when, score, setScore, onEvent, onDetractor, onWriteReview }) {
  const [reason, setReason] = useState(null);
  const [done, setDone] = useState(false);
  const shown = score ?? 8;
  if (done)
    return (
      <div className="ds-r ds-swap flex items-center gap-3.5 rounded-[26px] p-[18px]" style={{ "--d": "40ms", background: TONE.purple.bg }}>
        <span className="ds-pop flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.title }}>
          <Line name="check" size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[19px] font-extrabold" style={{ color: TONE.purple.fg }}>
            {score}점, 고맙습니다
          </div>
          <div className="text-[14px] leading-[1.5]" style={{ color: TONE.purple.sub }}>
            {score <= 6
              ? "24시간 안에 담당 매니저가 연락드립니다 — 조치 결과를 다시 알려 드려요"
              : score >= 9
                ? "주변에 비슷한 고민을 하는 가족이 있다면 소개해 주세요"
                : "의견은 서비스 개선에 반영됩니다"}
          </div>
          {/* 점수를 남긴 뒤에도 후기는 쓸 수 있다 (전 화면의 '코멘트 · 후기'가 늘 있었다) */}
          <button type="button" onClick={onWriteReview} className="mt-0.5 min-h-[36px] text-[14px] font-extrabold underline underline-offset-2" style={{ color: TONE.purple.fg }}>
            후기 쓰기
          </button>
        </div>
        <WhiteBtn h={44} r={14} sh={TONE.purple.sh} color={TONE.purple.fg} className="flex-none px-3.5 text-[14px]" onClick={() => setDone(false)}>
          고치기
        </WhiteBtn>
      </div>
    );
  return (
    <div className="ds-r flex flex-col gap-3 rounded-[26px] p-[18px]" style={{ "--d": "40ms", background: TONE.purple.bg }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="m-0 text-[19px] font-extrabold" style={{ color: TONE.purple.fg }}>
            지난 동행 어떠셨나요?
          </h2>
          <div className="text-[14px]" style={{ color: TONE.purple.sub }}>
            {when}
          </div>
        </div>
        <div className="flex-none" aria-hidden="true">
          <span className="ds-num text-[40px] font-black leading-none" style={{ color: score == null ? "#9B93AE" : TONE.purple.fg }}>
            {shown}
          </span>
          <span className="text-[15px] font-bold" style={{ color: TONE.purple.sub }}>
            /10
          </span>
        </div>
      </div>
      <label htmlFor="nps-score" className="sr-only">
        지난 동행 점수 (0점에서 10점)
      </label>
      <input
        id="nps-score"
        type="range"
        min={0}
        max={10}
        step={1}
        value={shown}
        onChange={(e) => setScore(Number(e.target.value))}
        aria-valuetext={score == null ? "선택 전" : `${score}점`}
        className="ds-range"
      />
      {score == null && (
        <p className="-mt-1 text-center text-[13px]" style={{ color: TONE.purple.sub }}>
          막대를 움직이면 점수가 정해집니다
        </p>
      )}
      {score != null && score <= 6 && (
        <div role="group" aria-label="가장 아쉬웠던 것" className="flex flex-col gap-2">
          <div className="text-[15px] font-extrabold" style={{ color: TONE.purple.fg }}>
            무엇이 가장 아쉬우셨나요?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NPS_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
                className="ds-press min-h-[40px] rounded-full px-3.5 text-[14px] font-extrabold"
                style={reason === r ? { background: "#1B2340", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#3A3F50" }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-[2fr_1fr] gap-2.5">
        <Btn
          tone="purple"
          h={52}
          className="text-[17px] disabled:opacity-50"
          disabled={score == null || (score <= 6 && !reason)}
          onClick={() => {
            setDone(true);
            if (score <= 6) onDetractor?.(score, reason);
            onEvent(
              score <= 6 ? `만족도 ${score}점 접수 — 회복 플로우 시작 (${reason || "사유 미선택"} · 24h 내 연락)` : `만족도 ${score}점 접수 — 감사 인사 발송`,
              score <= 6 ? "#FF8A80" : "#8FE3C0"
            );
          }}
        >
          점수 남기기
        </Btn>
        <WhiteBtn h={52} sh={TONE.purple.sh} color={TONE.purple.fg} className="text-[16px]" onClick={onWriteReview}>
          후기 쓰기
        </WhiteBtn>
      </div>
    </div>
  );
}

// 후기 — 점수만으로는 무엇을 고쳐야 하는지 알 수 없다. 문장이 남아야 컨시어지에게 전달된다 (2026-08-12 시트 홈 5번)
function ReviewSheet({ reviews, onClose, onSend }) {
  const [memo, setMemo] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Sheet onClose={onClose} label="후기 쓰기">
      <SheetTitle sub="지난 동행" title="후기 쓰기" />
      {sent ? (
        <p role="status" className="rounded-[16px] px-3.5 py-3 text-[15px] font-bold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
          후기를 남겼습니다 — 담당 컨시어지와 관제에 함께 전달됩니다
        </p>
      ) : (
        <>
          <label htmlFor="review-memo" className="text-[15px] font-extrabold">
            코멘트 · 후기
          </label>
          <textarea
            id="review-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
            placeholder="예: 어머니가 선생님 오시는 날을 기다리십니다. 다음엔 무릎 이야기도 여쭤봐 주세요."
            className="w-full resize-none rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 py-3 text-[16px] leading-[1.6] outline-none focus:border-[#1B2340]"
          />
          <Btn
            tone="purple"
            h={54}
            className="text-[16px] disabled:opacity-50"
            disabled={!memo.trim()}
            onClick={() => {
              setSent(true);
              onSend(memo.trim());
            }}
          >
            후기 남기기
          </Btn>
        </>
      )}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[18px] bg-white p-3.5">
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id}>
              <div className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
                {r.by} · {new Date(r.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                {r.score != null && ` · ${r.score}점`}
              </div>
              <p className="text-[15px] leading-[1.6]">{r.text}</p>
            </div>
          ))}
        </div>
      )}
      <WhiteBtn className="text-[16px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

// ── 동행 리포트 — 칸 1 ──
// 동행 완료 리포트는 컨시어지가 적고 검수 확정한 뒤에만 나간다 (2인 서명은 2026-08-12 삭제).
// 테스트 계정이면 컨시어지가 실제로 적은 동행 기록(state.escort)을 보여 준다 (2026-10-02).
function EscortReportSheet({ onClose, live = false, escort = null }) {
  const [issued, setIssued] = useState(false);
  if (live) {
    const e = escort || {};
    const day = (t) => new Date(t).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
    const hm = (t) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    return (
      <Sheet label="동행 리포트" onClose={onClose}>
        <SheetTitle sub="병원 동행" title="동행 리포트" />
        {e.sentAt ? (
          <>
            <div className="text-[14px]" style={{ color: "#5E6270" }}>
              {day(e.savedAt || e.sentAt)} 병원 동행 · 담당 컨시어지 {e.by || "—"} · 전달 {hm(e.sentAt)}
            </div>
            <p className="line-clamp-6 whitespace-pre-wrap rounded-[18px] bg-white px-3.5 py-3 text-[15px] leading-[1.7]">{e.note}</p>
            <div className="text-[13px]" style={{ color: "#5E6270" }}>
              현장 사진 {e.photos || 0}장 · 영상 {e.recorded ? "녹화함" : "녹화하지 않음"}
            </div>
            <Link href="/report/escort?from=family" className="ds-press ds-btn3d flex min-h-[54px] items-center justify-center rounded-[18px] text-[16px] text-white" style={{ background: "#1B2340", boxShadow: "0 4px 0 #0E1428" }}>
              리포트 전체 보기 · PDF 저장
            </Link>
          </>
        ) : (
          <p className="rounded-[18px] bg-white px-3.5 py-3 text-[15px] leading-[1.7]">
            아직 받은 동행 리포트가 없습니다. 병원 동행을 마치면 컨시어지가 적은 기록을 확인한 뒤 여기로 보내 드립니다.
            {e.savedAt ? " (컨시어지가 기록을 저장했습니다 — 관제 검수 뒤 전달)" : ""}
          </p>
        )}
        <WhiteBtn className="text-[16px]" onClick={onClose}>
          닫기
        </WhiteBtn>
      </Sheet>
    );
  }
  return (
    <Sheet label="동행 리포트" onClose={onClose}>
      <SheetTitle sub={`${CARE_TEAM.dateLabel} · 서울아산 순환기내과`} title="동행 리포트" />
      <div className="text-[14px]" style={{ color: "#5E6270" }}>
        {CARE_TEAM.members.map((m) => m.name).join(" · ")} 컨시어지
      </div>
      <p className="rounded-[18px] bg-white px-3.5 py-3 text-[15px] leading-[1.7]">{AI_REPORT.draft}</p>
      <span className="self-start rounded-full px-3 py-1 text-[13px] font-extrabold" style={{ background: TONE.green.bg, color: TONE.green.fg }}>
        컨시어지 검수 확정
      </span>
      {AI_REPORT.hitl && (
        <p className="text-[13px] leading-[1.6]" style={{ color: "#5E6270" }}>
          {AI_REPORT.hitl}
        </p>
      )}
      <Btn tone={issued ? "green" : "navy"} h={54} className="text-[16px]" disabled={issued} onClick={() => setIssued(true)}>
        {issued && <Line name="check" size={20} />}
        {issued ? "발급 요청됨 — PDF 생성 연동 대기" : "PDF로 발급"}
      </Btn>
      <Link href="/report/care" className="ds-press flex min-h-[48px] items-center justify-center rounded-[16px] bg-white text-[15px] font-extrabold" style={{ boxShadow: "0 3px 0 #E3DED3" }}>
        월간 케어 리포트 보기 (A4)
      </Link>
      <WhiteBtn className="text-[16px]" onClick={onClose}>
        닫기
      </WhiteBtn>
    </Sheet>
  );
}

// ── 내 정보 수정 — 오른쪽 위 '내 정보' ──
// 이름·생년월일·휴대전화는 본인 확인이 걸린 값이라 고객센터 경유 — 여기서는 읽기만.
// 생년월일은 가입 때 받지 않아 아직 없다 — 없는 값을 지어 넣지 않는다.
function EditProfileSheet({ me, live, guardian, onClose, onSave }) {
  const [email, setEmail] = useState(guardian.email || "");
  const [sex, setSex] = useState(guardian.sex || "");
  const ro = "rounded-[16px] px-3.5 py-3 text-[16px]";
  const field = "min-h-[52px] w-full rounded-[16px] border-2 border-[#E3DED3] bg-white px-3.5 text-[16px] outline-none focus:border-[#1B2340]";
  return (
    <Sheet label="내 정보 수정" onClose={onClose}>
      <SheetTitle sub="마이" title="내 정보" />
      {[
        ["이름", me.name],
        ["생년월일", "가입 상담에서 등록 — 아직 없음"],
        ["휴대전화 번호", live ? "가입 때 등록한 번호 (화면에 보이지 않게 가림)" : "010-****-1234"],
      ].map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1.5">
          <div className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
            {k}
          </div>
          <div className={ro} style={{ background: "#EEEDEA", color: "#5E5A52" }}>
            {v}
          </div>
        </div>
      ))}
      <p className="rounded-[16px] px-3.5 py-3 text-[14px] leading-[1.6]" style={{ background: "#F3F1EC", color: "#5E6270" }}>
        <b style={{ color: "#1B2340" }}>이름, 생년월일, 휴대전화 번호 수정</b>이 필요하시면 K-CARE 고객센터로 문의해 주세요.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="g-email" className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
          이메일 <span className="font-medium" style={{ color: "#5E6270" }}>선택</span>
        </label>
        <input id="g-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="리포트 사본을 받을 주소" className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="g-sex" className="text-[14px] font-extrabold" style={{ color: "#3A3F50" }}>
          성별 <span className="font-medium" style={{ color: "#5E6270" }}>선택</span>
        </label>
        <select id="g-sex" value={sex} onChange={(e) => setSex(e.target.value)} className={field}>
          <option value="">선택 안 함</option>
          <option value="남성">남성</option>
          <option value="여성">여성</option>
        </select>
      </div>
      <div className="flex gap-2">
        <WhiteBtn className="flex-1 text-[16px]" onClick={onClose}>
          닫기
        </WhiteBtn>
        <Btn tone="navy" h={56} className="flex-[2] text-[16px]" onClick={() => onSave({ email: email.trim(), sex })}>
          변경 내용 저장
        </Btn>
      </div>
    </Sheet>
  );
}
