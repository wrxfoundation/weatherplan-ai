import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, PendingTag } from "../../components/ui";
import Icon from "../../components/icons";
import {
  ACCESS_LOG,
  AI_REPORT,
  CARE_TEAM,
  CONSENTS,
  ELDER,
  GUARDIANS,
  INVITE,
  NPS_REASONS,
  PRIORITY_PRESETS,
  VIDEO_RETENTION_DAYS,
  VISIT_VIDEOS,
  WEATHER_FACTORS,
} from "../../lib/mock";
import { VIDEO_POLICY, VIDEO_SEGMENTS } from "../../lib/console";
import { PAYMENT_MODES, PRICING, fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";
import { honorific } from "../../lib/tracks";

// 마이 — 2026-09-04 시트 보호자 마이 1·2번 (첨부 영상 시안대로 재구성).
//   머리: "OO님, 안녕하세요" + 오른쪽 위 '관리' → 내 정보 수정
//   타일 3: 동행 리포트 발급 · 안심방문 리포트 발급 · 결제 관리
//   안심방문 바디캠 영상 (리포트와 평가 사이 · 30일 보관 후 자동 삭제)
//   동행 후 만족도(평가) → 우선 확인 날씨 → 가족 구성원 → 멤버십 → 데이터 · 동의
// 옛 '케어 리포트' 글 카드(증빙 보고서 요청 · 방문 관찰 리포트 목록)는 타일로 접었다 —
// 영상 시안에 없다. 우선 날씨는 자동 추론이 아니라 사람이 설정한다 — 설정 주체·시각을 기록한다.

export default function MyPage() {
  const { state, dispatch } = useAppState();
  const ob = state.onboarding;
  const [settingOpen, setSettingOpen] = useState(false);
  const [consentRenewed, setConsentRenewed] = useState(false); // 동의 갱신 원탭
  const [invited, setInvited] = useState(false);
  const [editOpen, setEditOpen] = useState(false); // 내 정보 수정
  const [payOpen, setPayOpen] = useState(false); // 결제 관리
  const [escortOpen, setEscortOpen] = useState(false); // 동행 리포트
  const [video, setVideo] = useState(null); // 바디캠 영상 재생 창
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const honor = honorific(ob); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)
  // 화면 주인 — 주 보호자(김민수). 온보딩에서 관계만 받고 이름은 받지 않으므로 페르소나를 쓴다.
  const me = GUARDIANS.find((g) => g.isPrimary) || GUARDIANS[0];
  const videoConsent = ob ? !!ob.videoConsent : true; // 온보딩 전 데모는 동의로 본다 (컨시어지 화면과 같은 기본값)

  return (
    <>
      <Head>
        <title>마이 — K-CARE</title>
      </Head>
      <FamilyLayout
        title={`${me.name}님, 안녕하세요`}
        action={
          <button
            onClick={() => setEditOpen(true)}
            className="btn-press shrink-0 rounded-full border border-navy/25 bg-white/70 px-4 py-2 text-[13px] font-bold text-navy"
          >
            관리
          </button>
        }
      >
        {/* 타일 3 — 영상 시안. 아이콘 위, 글자 아래, 세로줄로 나눈다 */}
        <Card className="p-2">
          <div className="grid grid-cols-3 divide-x divide-navy/[.08]">
            <button onClick={() => setEscortOpen(true)} className="btn-press flex flex-col items-center gap-2 px-1 py-3.5">
              <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-navy/[.06] text-navy">
                <Icon name="doc" size={22} />
              </span>
              <span className="text-[12px] font-bold leading-[1.3] text-navy">동행 리포트 발급</span>
            </button>
            <Link href="/report/visit?from=family" className="btn-press flex flex-col items-center gap-2 px-1 py-3.5">
              <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-navy/[.06] text-navy">
                <Icon name="list" size={22} />
              </span>
              <span className="text-[12px] font-bold leading-[1.3] text-navy">안심방문 리포트 발급</span>
            </Link>
            <button onClick={() => setPayOpen(true)} className="btn-press flex flex-col items-center gap-2 px-1 py-3.5">
              <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-navy/[.06] text-navy">
                <Icon name="card" size={22} />
              </span>
              <span className="text-[12px] font-bold leading-[1.3] text-navy">결제 관리</span>
            </button>
          </div>
        </Card>

        {/* 안심방문 바디캠 영상 — 리포트와 평가 사이 (시트 마이 2번) */}
        <BodycamCard consent={videoConsent} onOpen={setVideo} />

        {/* 동행 후 만족도 — 리포트 바로 아래 (2026-08-28 시트 홈 2번) */}
        <NpsCard
          onEvent={(text, color) => dispatch({ type: "pushEvent", payload: { kind: "CS", text, color } })}
          onDetractor={(score, reason) =>
            dispatch({ type: "opsPatch", patch: { npsDetractor: { score, reason } } })
          }
          onReview={(score, text) => dispatch({ type: "addReview", payload: { by: me.name, score, text } })}
          reviews={state.reviews}
        />

        {/* 우선 확인 날씨 — REQ-01 (사람이 설정 · 주체 기록) */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <SectionLabel>우선 확인 날씨</SectionLabel>
            <Badge fg="#8A5D12" bg="rgba(176,141,87,.16)">
              {state.priority.source}
            </Badge>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {state.priority.factors.map((f) => (
              <span key={f} className="rounded-full bg-navy px-3 py-1.5 text-[13px] font-bold text-white">
                {f}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] leading-[1.7] text-muted">
            여기서 고른 요소가 {honor} 화면 &lsquo;지금 우리 동네&rsquo;에 먼저 보입니다. 병력에
            맞춰 보호자·컨시어지·본인이 직접 설정하며, 건강정보로 자동 추천하지 않습니다.
          </p>
          {isPrimary ? (
            <GhostButton className="mt-3" onClick={() => setSettingOpen(true)}>
              우선 요소 설정
            </GhostButton>
          ) : (
            <p className="mt-3 rounded-xl bg-navy/[.05] px-3 py-2.5 text-[12px] font-bold text-muted/70">
              설정 변경은 주 보호자만 할 수 있습니다
            </p>
          )}
        </Card>

        {/* 가족 구성원 · 초대 — 주 보호자가 초대 링크 발급, 부 보호자는 조회만 */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <SectionLabel>가족 구성원</SectionLabel>
            <span className="text-[12px] text-muted">{GUARDIANS.length} / 5명</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {GUARDIANS.map((g) => (
              <div key={g.name} className="flex items-center gap-2.5 text-[15px]">
                <span className="flex-1 font-bold text-ink">{g.name}</span>
                <span className="text-[12px] text-muted">{g.relation.split(" · ")[0]}</span>
                <Badge
                  fg={g.isPrimary ? "#7A5C28" : "#5C5A54"}
                  bg={g.isPrimary ? "rgba(176,141,87,.16)" : "rgba(92,90,84,.1)"}
                >
                  {g.isPrimary ? "주 보호자" : "부 보호자"}
                </Badge>
              </div>
            ))}
          </div>
          {isPrimary ? (
            <>
              <button
                onClick={() => {
                  if (invited) return;
                  setInvited(true);
                  dispatch({
                    type: "pushEvent",
                    payload: { kind: "초대", text: "부 보호자 초대 링크 발급 (7일 · 1회용)", color: "#8FA9CC" },
                  });
                }}
                className={`btn-press mt-3.5 w-full rounded-xl border py-3 text-[15px] font-bold ${
                  invited ? "border-green/30 bg-green/10 text-green" : "border-navy bg-navy text-white"
                }`}
              >
                {invited ? `✓ 초대 링크 생성됨 — ${INVITE.link}` : "부 보호자 초대 링크 만들기"}
              </button>
              <p className="mt-2 text-[11px] leading-[1.6] text-muted">
                {INVITE.rule}. 참여자는 이름·관계·연락처만 입력하고 결제수단은 필요 없습니다.
                구성원 제거는 주 보호자만 가능합니다.
              </p>
            </>
          ) : (
            <p className="mt-3.5 rounded-xl bg-navy/[.05] px-3 py-2.5 text-[12px] leading-[1.6] text-muted">
              초대·구성원 관리는 주 보호자만 할 수 있습니다. 상태·리포트·일정은 모든 보호자에게
              동일하게 공유됩니다.
            </p>
          )}
        </Card>

        {/* 멤버십 요약 */}
        <Card className="p-[18px]">
          <SectionLabel>멤버십</SectionLabel>
          <div className="mt-3 space-y-2 text-[15px]">
            <Row k="서비스 지역" v={ob ? `${ob.district} · ${ob.tier === 2 ? "2급지" : "1급지"}` : `${ELDER.district} · 1급지 (데모)`} />
            <Row k="월 구독료" v={ob?.tier === 2 ? "별도 산정" : fmtWon(PRICING.subscription.monthly)} />
            <Row k="결제권한" v={payLabel(ob, honor)} />
            <Row k="방문기록 영상 동의" v={ob?.videoConsent ? "동의함" : ob ? "미동의 (가입 시 선택)" : "동의함 (데모)"} />
          </div>
        </Card>

        {/* 데이터 · 동의 — 신뢰 센터: 누가 언제 우리 가족 데이터를 봤는지 전부 공개 (해자) */}
        <Card className="p-[18px]">
          <SectionLabel>데이터 · 동의</SectionLabel>
          <p className="mt-2 text-[13px] leading-[1.7] text-muted">
            어머니의 데이터는 가족의 것입니다. 어떤 동의가 있고, 누가 언제 열람했는지 전부 여기서
            확인할 수 있습니다.
          </p>
          <div className="mt-3 space-y-2">
            {CONSENTS.map((c) => (
              <div key={c.k} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-ink">{c.k}</span>
                {c.expiring && !consentRenewed ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full border border-amber/30 bg-[#FFF7E8] px-2 py-0.5 text-[11px] font-bold text-amber">
                      동의 · {c.expiring} 만료
                    </span>
                    <button
                      onClick={() => {
                        setConsentRenewed(true);
                        dispatch({
                          type: "pushEvent",
                          payload: { kind: "설정", text: "위치 정보 동의 갱신 완료 (1년 연장)", color: "#8FA9CC" },
                        });
                      }}
                      className="btn-press rounded-full bg-navy px-2.5 py-0.5 text-[11px] font-bold text-white"
                    >
                      갱신
                    </button>
                  </span>
                ) : (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      c.on ? "bg-green/10 text-green" : "bg-navy/[.06] text-muted"
                    }`}
                  >
                    {c.expiring && consentRenewed
                      ? "갱신 완료 · 2027.08"
                      : `${c.state}${c.until !== "—" ? ` · ${c.until}` : ""}`}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-navy/[.08] pt-3">
            <div className="text-[12px] font-bold text-navy">최근 접근 기록</div>
            <div className="mt-2 space-y-2">
              {ACCESS_LOG.map((l, i) => (
                <div key={i} className="text-[12px] leading-[1.6]">
                  <span className="font-num font-semibold text-muted">{l.at}</span>{" "}
                  <span className="font-bold text-ink">{l.who}</span>
                  <span className="text-muted">
                    {" "}
                    — {l.what} · {l.why}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
            동의는 언제든 바꿀 수 있습니다 · 만료 30일 전 자동 안내 · 철회해도 기본 케어는 유지 · 탈퇴 시
            24시간 내 삭제
          </p>
        </Card>

        {settingOpen && (
          <PrioritySheet
            honor={honor}
            current={state.priority}
            rel={ob?.rel}
            onClose={() => setSettingOpen(false)}
            onSave={(factors) => {
              dispatch({
                type: "setPriority",
                payload: { factors, source: `보호자 설정${ob?.rel ? ` · ${ob.rel}` : ""}` },
              });
              dispatch({
                type: "pushEvent",
                payload: { kind: "설정", text: `우선 날씨 요소 변경 · ${factors.join(" · ")}`, color: "#8FA9CC" },
              });
              setSettingOpen(false);
            }}
          />
        )}
        {editOpen && (
          <EditProfileSheet
            me={me}
            guardian={state.guardian || {}}
            onClose={() => setEditOpen(false)}
            onSave={(patch) => {
              dispatch({ type: "guardianPatch", patch });
              dispatch({ type: "pushEvent", payload: { kind: "설정", text: `보호자 ${me.name} 내 정보 수정 (이메일·성별)`, color: "#8FA9CC" } });
              setEditOpen(false);
            }}
          />
        )}
        {payOpen && (
          <PaySheet
            ob={ob}
            honor={honor}
            isPrimary={isPrimary}
            onClose={() => setPayOpen(false)}
            onSave={(patch) => {
              dispatch({ type: "onboardingPatch", patch });
              dispatch({
                type: "pushEvent",
                payload: { kind: "설정", text: `결제권한 변경 — ${PAYMENT_MODES.find((m) => m.key === patch.paymentMode)?.label}${patch.paymentMode === "limit" ? ` · ${fmtWon(patch.limitAmount)}` : ""}`, color: "#8FA9CC" },
              });
              setPayOpen(false);
            }}
          />
        )}
        {escortOpen && <EscortReportSheet onClose={() => setEscortOpen(false)} />}
        {video && <VideoSheet video={video} onClose={() => setVideo(null)} />}
      </FamilyLayout>
    </>
  );
}

function payLabel(ob, honor) {
  if (!ob || ob.paymentMode === "limit") return `${fmtWon(ob?.limitAmount ?? PRICING.paymentLimitDefault)} 이하 ${honor} 직접 결제`;
  return { both: "양쪽 모두 결제", guardianOnly: "보호자만 결제", elderOnly: `${honor}만 결제` }[ob.paymentMode];
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-muted">{k}</span>
      <span className="text-right font-bold text-ink">{v}</span>
    </div>
  );
}

// 바텀시트 껍데기 — 이 화면의 시트 넷이 같은 모양이다
function Sheet({ label, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        {children}
      </div>
    </div>
  );
}

// ── 안심방문 바디캠 영상 (시트 마이 2번) ──
// 30일이 지난 것은 목록에서 빠진다 — 관리자가 보관을 지정한 건만 남는다.
function BodycamCard({ consent, onOpen }) {
  const list = VISIT_VIDEOS.map((v) => ({ ...v, left: VIDEO_RETENTION_DAYS - v.daysAgo })).filter((v) => v.left > 0 || v.hold);
  const dateOf = (daysAgo) =>
    new Date(Date.now() - daysAgo * 86400000).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return (
    <Card className="p-[18px]">
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-black text-navy">안심방문 바디캠 영상</div>
        <Badge fg="#5C5A54" bg="rgba(92,90,84,.1)">{VIDEO_RETENTION_DAYS}일 보관</Badge>
      </div>
      {!consent ? (
        <p className="mt-2.5 rounded-xl bg-navy/[.05] px-3.5 py-3 text-[13px] leading-[1.7] text-muted">
          가입 때 방문기록 영상 촬영에 동의하지 않으셨습니다. 동의는 데이터 · 동의에서 언제든 바꿀 수
          있고, 바꾼 뒤 방문부터 영상이 남습니다.
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {list.map((v) => (
              <button
                key={v.id}
                onClick={() => onOpen(v)}
                className="btn-press flex w-full items-center gap-3 rounded-xl border border-navy/[.08] bg-white/70 p-3 text-left"
              >
                <span
                  aria-hidden
                  className="flex h-[46px] w-[66px] shrink-0 items-center justify-center rounded-[8px] text-white"
                  style={{ background: "linear-gradient(135deg,#1C2E4A,#0A1F3C)" }}
                >
                  <Icon name="play" size={20} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-navy">{v.title}</span>
                  <span className="block text-[12px] text-muted">
                    {dateOf(v.daysAgo)} · {v.by} · {v.len}
                  </span>
                </span>
                {v.hold ? (
                  <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">보관 연장</Badge>
                ) : (
                  <Badge fg={v.left <= 3 ? "#8A5D12" : "#5C5A54"} bg={v.left <= 3 ? "rgba(138,93,18,.12)" : "rgba(92,90,84,.1)"}>
                    D-{v.left} 삭제
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
            {VIDEO_RETENTION_DAYS}일 보관 후 자동 삭제됩니다. 분쟁이 생기면 관리자가 보관 기간을 따로 정합니다. 촬영하지
            않는 곳 — {VIDEO_POLICY.banned.join(" · ")}.
          </p>
        </>
      )}
    </Card>
  );
}

// 영상 재생 창 — 실제 영상은 서버 연동 뒤에 붙는다. 구간(챕터)과 보관 상태만 보여 준다.
function VideoSheet({ video, onClose }) {
  const [seg, setSeg] = useState(0);
  return (
    <Sheet label={`${video.title} 영상`} onClose={onClose}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[19px] font-black text-navy">{video.title}</div>
        {video.hold ? (
          <Badge fg="#8A5D12" bg="rgba(138,93,18,.12)">보관 {video.hold.until}</Badge>
        ) : (
          <Badge fg="#5C5A54" bg="rgba(92,90,84,.1)">D-{video.left} 자동 삭제</Badge>
        )}
      </div>
      <div className="mt-1 text-[12px] text-muted">{video.by} · {video.len}</div>
      <div
        className="mt-3 flex aspect-video w-full flex-col items-center justify-center rounded-xl text-white"
        style={{ background: "linear-gradient(135deg,#1C2E4A,#0A1F3C)" }}
      >
        <Icon name="play" size={40} strokeWidth={1.8} />
        <div className="mt-2 text-[13px] font-bold">{VIDEO_SEGMENTS[seg]}</div>
        <div className="mt-1"><PendingTag>영상 서버 연동 대기 · 데모</PendingTag></div>
      </div>
      <div className="mt-3">
        <SectionLabel>구간</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {VIDEO_SEGMENTS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSeg(i)}
              aria-pressed={seg === i}
              className={`btn-press rounded-lg border px-2.5 py-2 text-left text-[12px] font-bold ${
                seg === i ? "border-navy bg-navy text-white" : "border-navy/15 text-muted"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>
      {video.hold && (
        <p className="mt-3 rounded-xl border border-amber/30 bg-[#FFF7E8] px-3 py-2.5 text-[12px] leading-[1.6] text-[#5A4A22]">
          보관 연장 — {video.hold.why}. 지정한 날짜가 지나면 삭제됩니다.
        </p>
      )}
      <p className="mt-3 text-[11px] leading-[1.7] text-muted">
        열람은 접근 기록에 남습니다. {VIDEO_POLICY.retention}
      </p>
      <GhostButton className="mt-4" onClick={onClose}>
        닫기
      </GhostButton>
    </Sheet>
  );
}

// ── 동행 리포트 발급 — 타일 1 ──
// 동행 완료 리포트는 AI 초안 → 컨시어지 확정 → 2인 서명 뒤에만 나간다 (lib/mock.js AI_REPORT).
function EscortReportSheet({ onClose }) {
  const [issued, setIssued] = useState(false);
  return (
    <Sheet label="동행 리포트" onClose={onClose}>
      <div className="text-[19px] font-black text-navy">동행 리포트</div>
      <div className="mt-1 text-[12px] text-muted">{CARE_TEAM.dateLabel} · 서울아산 순환기내과 · {CARE_TEAM.members.map((m) => m.name).join(" · ")}</div>
      <p className="mt-3 rounded-xl bg-navy/[.04] px-3.5 py-3 text-[14px] leading-[1.75] text-ink">{AI_REPORT.draft}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {CARE_TEAM.members.map((m) => (
          <span key={m.name} className="rounded-full bg-green/10 px-2.5 py-1 text-[11px] font-bold text-green">
            ✓ {m.name} 서명
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">{AI_REPORT.hitl}</p>
      <button
        onClick={() => setIssued(true)}
        disabled={issued}
        className={`btn-press mt-4 w-full rounded-xl border py-3.5 text-[16px] font-bold ${
          issued ? "border-green/30 bg-green/10 text-green" : "border-navy bg-navy text-white"
        }`}
      >
        {issued ? "✓ 발급 요청됨 — PDF 생성 연동 대기" : "PDF로 발급"}
      </button>
      <Link
        href="/report/care"
        className="btn-press mt-2 block w-full rounded-xl border border-navy/20 py-3 text-center text-[14px] font-bold text-navy"
      >
        월간 케어 리포트 보기 (A4)
      </Link>
      <GhostButton className="mt-2" onClick={onClose}>
        닫기
      </GhostButton>
    </Sheet>
  );
}

// ── 결제 관리 — 타일 3 ──
// 결제권한은 가입 때 정하고 뒤에 보호자가 바꾼다 (온보딩 문구). 결제수단 등록은 PG 연동 전.
function PaySheet({ ob, honor, isPrimary, onClose, onSave }) {
  const [mode, setMode] = useState(ob?.paymentMode || "limit");
  const [limit, setLimit] = useState(ob?.limitAmount ?? PRICING.paymentLimitDefault);
  const nextBill = ob?.joinedAt
    ? new Date(new Date(ob.joinedAt).setMonth(new Date(ob.joinedAt).getMonth() + 1)).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
    : "가입일 기준 매월";
  return (
    <Sheet label="결제 관리" onClose={onClose}>
      <div className="text-[19px] font-black text-navy">결제 관리</div>
      <div className="mt-3 space-y-2 text-[14px]">
        <Row k="월 구독료" v={ob?.tier === 2 ? "별도 산정" : fmtWon(PRICING.subscription.monthly)} />
        <Row k="다음 결제" v={nextBill} />
        <Row k="결제수단" v={<PendingTag>등록 연동 대기</PendingTag>} />
        <Row k="지금 결제권한" v={payLabel(ob, honor)} />
      </div>
      <div className="mt-4">
        <SectionLabel>결제권한 변경</SectionLabel>
        <div className="mt-2 space-y-2">
          {PAYMENT_MODES.map((m) => {
            const on = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                disabled={!isPrimary}
                className={`btn-press w-full rounded-xl border p-3 text-left disabled:opacity-60 ${on ? "border-gold bg-gold/10" : "border-navy/15"}`}
              >
                <div className="text-[14px] font-bold text-navy">{m.label}</div>
                <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{m.desc}</div>
                {m.key === "limit" && on && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[12px] text-muted">한도</span>
                    {[30000, 50000, 100000].map((v) => (
                      <button
                        key={v}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLimit(v);
                        }}
                        className={`btn-press rounded-lg border px-2.5 py-1.5 font-num text-[12px] font-bold ${
                          limit === v ? "border-gold bg-gold/10 text-navy" : "border-navy/15 text-muted"
                        }`}
                      >
                        {fmtWon(v)}
                      </button>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {!isPrimary && (
          <p className="mt-2 rounded-xl bg-navy/[.05] px-3 py-2.5 text-[12px] font-bold text-muted/70">결제권한 변경은 주 보호자만 할 수 있습니다</p>
        )}
      </div>
      <div className="mt-5 flex gap-2">
        <GhostButton onClick={onClose} className="flex-1">
          닫기
        </GhostButton>
        <PrimaryButton className="flex-[2]" disabled={!isPrimary} onClick={() => onSave({ paymentMode: mode, limitAmount: limit })}>
          변경 내용 저장
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

// ── 내 정보 수정 — '관리' 버튼 (영상 시안) ──
// 이름·생년월일·휴대전화는 본인 확인이 걸린 값이라 고객센터 경유 — 여기서는 읽기만.
// 생년월일은 가입 때 받지 않아 아직 없다 — 없는 값을 지어 넣지 않는다.
function EditProfileSheet({ me, guardian, onClose, onSave }) {
  const [email, setEmail] = useState(guardian.email || "");
  const [sex, setSex] = useState(guardian.sex || "");
  const ro = "mt-2 w-full rounded-xl border border-navy/10 bg-navy/[.04] px-3.5 py-3 text-[15px] text-muted";
  return (
    <Sheet label="내 정보 수정" onClose={onClose}>
      <div className="flex items-center gap-2">
        <button onClick={onClose} aria-label="뒤로" className="btn-press flex h-[32px] w-[32px] items-center justify-center rounded-lg text-navy">
          <span aria-hidden className="rotate-90 inline-block"><Icon name="chev" size={18} strokeWidth={2} /></span>
        </button>
        <div className="text-[19px] font-black text-navy">내 정보 수정</div>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <SectionLabel>이름</SectionLabel>
          <div className={ro}>{me.name}</div>
        </div>
        <div>
          <SectionLabel>생년월일</SectionLabel>
          <div className={ro}>가입 상담에서 등록 — 아직 없음</div>
        </div>
        <div>
          <SectionLabel>휴대전화 번호</SectionLabel>
          <div className={`${ro} font-num`}>010-****-1234</div>
        </div>
        <p className="rounded-xl bg-navy/[.05] px-3.5 py-3 text-[12px] leading-[1.7] text-muted">
          <b className="text-navy">이름, 생년월일, 휴대전화 번호 수정</b>이 필요하시면 K-CARE 고객센터로 문의해 주세요.
        </p>
        <div>
          <label htmlFor="g-email" className="text-[12px] font-bold tracking-[.14em] text-muted/90">
            이메일 <span className="font-medium tracking-normal text-muted/60">선택</span>
          </label>
          <input
            id="g-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="리포트 사본을 받을 주소"
            className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-gold"
          />
        </div>
        <div>
          <label htmlFor="g-sex" className="text-[12px] font-bold tracking-[.14em] text-muted/90">
            성별 <span className="font-medium tracking-normal text-muted/60">선택</span>
          </label>
          <select
            id="g-sex"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mt-2 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-gold"
          >
            <option value="">선택 안 함</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>
      </div>
      <PrimaryButton className="mt-6" onClick={() => onSave({ email: email.trim(), sex })}>
        변경 내용 저장
      </PrimaryButton>
    </Sheet>
  );
}

// 우선 날씨 설정 시트 — 병력 프리셋 또는 직접 선택
function PrioritySheet({ current, onClose, onSave, honor }) {
  const [factors, setFactors] = useState(current.factors);

  const toggle = (f) =>
    setFactors((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">우선 확인 날씨 설정</div>
        <p className="mt-1 text-[12px] leading-[1.7] text-muted">
          {honor} 병력에 맞는 날씨 요소를 먼저 보여줍니다. 설정 주체와 시각이 기록됩니다.
        </p>

        <div className="mt-4">
          <SectionLabel>병력 프리셋</SectionLabel>
          <div className="mt-2 space-y-2">
            {PRIORITY_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setFactors(p.factors)}
                className={`btn-press w-full rounded-xl border p-3 text-left ${
                  JSON.stringify(factors) === JSON.stringify(p.factors)
                    ? "border-gold bg-gold/10"
                    : "border-navy/15"
                }`}
              >
                <div className="text-[15px] font-bold text-navy">{p.label}</div>
                <div className="mt-0.5 text-[12px] text-muted">{p.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <SectionLabel>직접 선택</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WEATHER_FACTORS.map((f) => (
              <button
                key={f}
                onClick={() => toggle(f)}
                className={`btn-press rounded-full border px-3 py-1.5 text-[13px] font-bold ${
                  factors.includes(f)
                    ? "border-gold bg-gold/10 text-navy"
                    : "border-navy/15 text-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <GhostButton onClick={onClose} className="flex-1">
            닫기
          </GhostButton>
          <PrimaryButton
            className="flex-[2]"
            disabled={factors.length === 0}
            onClick={() => onSave(factors)}
          >
            저장
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// 동행 후 만족도 — NPS 루프: 0–10 선택 → 비추천(≤6)은 사유 + 24h 회복 안내
function NpsCard({ onEvent, onDetractor, onReview, reviews = [] }) {
  const [score, setScore] = useState(null);
  const [reason, setReason] = useState(null);
  const [done, setDone] = useState(false);
  const [memo, setMemo] = useState("");
  const [memoSent, setMemoSent] = useState(false);
  // 색은 NPS 3구간 그대로 — 비추천 빨강은 여기서만 쓴다 (상거래 숫자가 아니라 경고 신호)
  const scoreColor = score == null ? "#5C5A54" : score <= 6 ? "#C0392B" : score <= 8 ? "#B08D57" : "#1E7A5A";

  // 동행 점수 아래 코멘트·후기 메모란 (2026-08-12 시트 홈 5번).
  // 점수만으로는 무엇을 고쳐야 하는지 알 수 없다 — 문장이 남아야 컨시어지에게 전달된다.
  const memoBox = (
    <div className="mt-3.5 border-t border-navy/[.08] pt-3.5">
      <SectionLabel>코멘트 · 후기</SectionLabel>
      {memoSent ? (
        <p className="mt-2 rounded-xl bg-green/10 px-3.5 py-3 text-[14px] font-bold text-green">
          후기를 남겼습니다 — 담당 컨시어지와 관제에 함께 전달됩니다
        </p>
      ) : (
        <>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            aria-label="코멘트 · 후기"
            placeholder="예: 어머니가 박지현 선생님 오시는 날을 기다리십니다. 다음엔 무릎 이야기도 여쭤봐 주세요."
            className="mt-2 w-full resize-none rounded-xl border border-navy/15 px-3.5 py-3 text-[15px] leading-[1.7] outline-none focus:border-gold"
          />
          <button
            onClick={() => {
              setMemoSent(true);
              onReview?.(score, memo.trim());
              onEvent(`보호자 후기 등록 — ${memo.trim().slice(0, 24)}…`, "#C9A46B");
            }}
            disabled={!memo.trim()}
            className="btn-press mt-2 w-full rounded-xl border border-navy/20 py-3 text-[15px] font-bold text-navy disabled:opacity-40"
          >
            후기 남기기
          </button>
        </>
      )}
      {reviews.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-navy/[.07] pt-3">
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id}>
              <div className="text-[12px] font-bold text-muted">
                {r.by} · {new Date(r.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                {r.score != null && ` · ${r.score}점`}
              </div>
              <p className="mt-0.5 text-[14px] leading-[1.7] text-ink">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (done)
    return (
      <Card className="p-4">
        <div className="text-[15px] font-bold text-navy">
          {score <= 6
            ? "접수했습니다 — 24시간 안에 담당 매니저가 연락드립니다"
            : "감사합니다 — 다음 동행도 잘 준비하겠습니다"}
        </div>
        <p className="mt-1 text-[12px] leading-[1.6] text-muted">
          {score <= 6
            ? "낮은 점수는 회복이 먼저입니다 — 조치 결과를 다시 알려드립니다."
            : score >= 9
            ? "주변에 비슷한 고민을 하는 가족이 있다면 마이 탭의 초대 링크로 소개해 주세요."
            : "의견은 서비스 개선에 반영됩니다."}
        </p>
        {memoBox}
      </Card>
    );

  return (
    <Card className="p-[18px]">
      <SectionLabel>오늘 동행은 어떠셨나요?</SectionLabel>
      <p className="mt-1.5 text-[12px] leading-[1.6] text-muted">
        13:50 서울아산 동행이 끝났습니다. 남겨 주신 점수가 케어 품질 평가 기준이 됩니다.
      </p>
      {/* 점수 — 슬라이더 (2026-08-21 시안). step=1 로 정수에만 멈춘다.
          NPS 는 정수 0~10 이라야 추천(9·10) / 중립(7·8) / 비추천(0~6) 분류가 성립하고,
          아래 score <= 6 분기도 그 위에 서 있다. 8.5 를 허용하면 이 경계가 무너진다.
          숫자를 크게 띄우는 것은 손을 떼기 전에 무엇이 선택됐는지 보이게 하려는 것이다. */}
      <div className="mt-3">
        <div className="text-center">
          {/* 고르기 전에도 손잡이가 가리키는 숫자를 보여 준다 — 빈 칸이나 대시를 두면
              막대를 움직이기 전까지 무엇이 선택될지 알 수 없다. 색으로 구분한다:
              고르기 전 회색, 고른 뒤 NPS 구간색. */}
          <span className="font-num text-[38px] font-black leading-none" style={{ color: scoreColor }}>
            {score ?? 8}
          </span>
          <span className="ml-1 text-[17px] font-bold text-muted">/ 10</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={score ?? 8}
          onChange={(e) => setScore(Number(e.target.value))}
          aria-label="오늘 동행 점수 (0점에서 10점)"
          aria-valuetext={score == null ? "선택 전" : `${score}점`}
          className="nps-range mt-2.5 w-full"
          style={{ "--nps": scoreColor, "--nps-pct": `${((score ?? 8) / 10) * 100}%` }}
        />
        <div className="mt-1 flex justify-between font-num text-[12px] font-bold text-muted">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
        {score == null && (
          <p className="mt-1.5 text-center text-[12px] text-muted">막대를 움직이면 점수가 정해집니다</p>
        )}
      </div>
      {score != null && score <= 6 && (
        <div className="mt-3 border-t border-navy/[.08] pt-3">
          <div className="text-[13px] font-bold text-navy">무엇이 가장 아쉬우셨나요?</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NPS_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold"
                style={
                  reason === r
                    ? { background: "#0A1F3C", color: "#FFFFFF", borderColor: "#0A1F3C" }
                    : { background: "rgba(255,255,255,.7)", color: "#5C5A54", borderColor: "rgba(10,31,60,.14)" }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      {score != null && (
        <button
          onClick={() => {
            setDone(true);
            if (score <= 6) onDetractor?.(score, reason);
            onEvent(
              score <= 6
                ? `만족도 ${score}점 접수 — 회복 플로우 시작 (${reason || "사유 미선택"} · 24h 내 연락)`
                : `만족도 ${score}점 접수 — 감사 인사 발송`,
              score <= 6 ? "#FF8A80" : "#8FE3C0"
            );
          }}
          disabled={score <= 6 && !reason}
          className="btn-press btn-dark mt-3 w-full rounded-xl bg-navy py-3 text-[15px] font-bold text-white disabled:opacity-50"
        >
          점수 제출
        </button>
      )}
      {memoBox}
    </Card>
  );
}
