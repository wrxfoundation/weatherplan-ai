import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, PendingTag } from "../../components/ui";
import { ACCESS_LOG, CONSENTS, ELDER, GUARDIANS, INVITE, NPS_REASONS, PRIORITY_PRESETS, WEATHER_FACTORS } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";
import { honorific } from "../../lib/tracks";

// 마이 — 멤버십 · 우선 날씨 설정(REQ-01) · 케어 리포트
// 옵션 서비스와 협력병원 찾기는 2026-08-12 요청으로 뺐다 (홈에서 진입).
// 우선 날씨는 자동 추론이 아니라 사람이 설정한다 — 설정 주체·시각을 기록한다.

export default function MyPage() {
  const { state, dispatch } = useAppState();
  const ob = state.onboarding;
  const [settingOpen, setSettingOpen] = useState(false);
  const [consentRenewed, setConsentRenewed] = useState(false); // 동의 갱신 원탭
  const [pdfRequested, setPdfRequested] = useState(false);
  const [invited, setInvited] = useState(false);
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";
  const honor = honorific(ob); // 고객 호칭 — 전부 "~~님" (2026-08-12 시트)

  const sharedReports = state.reports.filter((r) => r.shared);

  return (
    <>
      <Head>
        <title>마이 — K-CARE</title>
      </Head>
      <FamilyLayout title="마이">
        {/* 케어 리포트 — 마이에 통합 (GNB 리포트 탭 제거) */}
        <Card className="p-[18px]">
          <div className="text-[17px] font-black text-navy">케어 리포트</div>
          <p className="mt-1.5 text-[13px] leading-[1.7] text-muted">
            동행이 끝나면 컨시어지가 검수한 리포트가 옵니다. 월간 리포트는 방문 관찰과 워치
            데이터를 함께 정리해 매월 첫 주에 전달됩니다.
          </p>
          <button
            onClick={() => {
              if (pdfRequested) return;
              setPdfRequested(true);
              dispatch({
                type: "pushEvent",
                payload: { kind: "리포트", text: "보호자 증빙 보고서 PDF 요청", color: "#8FA9CC" },
              });
            }}
            className={`btn-press mt-3 w-full rounded-xl border py-3 text-[15px] font-bold ${
              pdfRequested ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
            }`}
          >
            {pdfRequested ? "✓ 요청됨 — 생성되면 알림으로 전달" : "증빙 보고서 요청"}
          </button>
          {pdfRequested && (
            <div className="mt-2 text-center">
              <PendingTag>PDF 생성 연동 대기</PendingTag>
              <Link
                href="/report/care"
                className="btn-press mt-2 block w-full rounded-xl border border-navy/20 py-3 text-center text-[14px] font-bold text-navy"
              >
                월간 케어 리포트 보기 · PDF 저장 (A4)
              </Link>
            </div>
          )}
          {/* 안심방문 리포트 — 컨시어지가 다녀간 결과를 보호자가 폰에서 바로 본다
              (2026-08-28 요청 "방문리포트는 모바일에서도 보기 쉬워야 함").
              증빙 요청과 무관하게 항상 열려 있어야 하는 동선이라 밖에 둔다. */}
          <Link
            href="/report/visit?from=family"
            className="btn-press mt-3 flex items-center justify-between rounded-xl px-4 py-3.5 text-white"
            style={{ background: "#0A1F3C" }}
          >
            <span>
              <span className="block text-[15px] font-bold">안심방문 리포트 보기</span>
              <span className="mt-0.5 block text-[12px] text-white/65">
                9월 9일 · 3회차 · 20항목 · 담당 박지현
              </span>
            </span>
            <span aria-hidden className="text-[18px] text-white/70">›</span>
          </Link>

          <div className="mt-4 flex items-center justify-between border-t border-navy/[.08] pt-3">
            <SectionLabel>방문 관찰 리포트</SectionLabel>
            <span className="text-[12px] text-muted">공유분 {sharedReports.length}건</span>
          </div>
          {sharedReports.length === 0 ? (
            <p className="mt-3 text-[15px] text-muted">아직 공유된 리포트가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {sharedReports.map((r) => (
                <div key={r.id} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-bold text-navy">{r.by} 선생님</span>
                    <span className="font-num text-[11px] text-muted">
                      {new Date(r.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      {" · 특이 "}
                      {r.flagged}건
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.7] text-ink">{r.note}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-navy/[.07] pt-2.5 text-[11px] leading-[1.6] text-muted">
            공유로 설정한 리포트만 표시됩니다. 판단·진단이 아니라 관찰 사실과 직접 발언만
            기록됩니다 (의료법 17조).
          </p>
        </Card>

        {/* 동행 후 만족도 — 홈에서 옮겨 왔다 (2026-08-28 시트 홈 2번:
            "동행리뷰는 마이 탭으로 이동해서 동행리포트 아래에 위치하게 하고,
            동행리포트 및 방문리포트 생성 시 같이 리뷰를 작성할 수 있게").
            리포트를 보고 나서 쓰는 자리라 리포트 바로 아래다. */}
        <NpsCard
          onEvent={(text, color) => dispatch({ type: "pushEvent", payload: { kind: "CS", text, color } })}
          onDetractor={(score, reason) =>
            dispatch({ type: "opsPatch", patch: { npsDetractor: { score, reason } } })
          }
          onReview={(score, text) => dispatch({ type: "addReview", payload: { by: "김민수", score, text } })}
          reviews={state.reviews}
        />

        {/* 제휴 병원 찾기 · 옵션 서비스는 2026-08-12 요청으로 삭제 (홈에서 진입) */}

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
            <Row k="월 구독료" v={ob?.tier === 2 ? "별도 산정" : fmtWon(57000)} />
            <Row
              k="결제권한"
              v={
                !ob || ob.paymentMode === "limit"
                  ? `${fmtWon(ob?.limitAmount ?? 50000)} 이하 ${honor} 직접 결제`
                  : { both: "양쪽 모두 결제", guardianOnly: "보호자만 결제", elderOnly: `${honor}만 결제` }[ob.paymentMode]
              }
            />
            <Row k="방문기록 영상 동의" v={ob?.videoConsent ? "동의함" : "미동의 (가입 시 선택)"} />
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
          제출
        </button>
      )}
      {memoBox}
    </Card>
  );
}

// 우리 동네 소식 — 대치동 · 강남구. 재난/안전은 정보, 바우처는 신청 대행까지 (해주세요 연계)
