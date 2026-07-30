import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, PendingTag } from "../../components/ui";
import { ACCESS_LOG, CONSENTS, ELDER, GUARDIANS, INVITE, OPTION_SERVICES, PRIORITY_PRESETS, WEATHER_FACTORS } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";

// 마이 — 멤버십 · 우선 날씨 설정(REQ-01) · 옵션 서비스(회의 9) · 케어 리포트 · 병원 찾기
// 우선 날씨는 자동 추론이 아니라 사람이 설정한다 — 설정 주체·시각을 기록한다.

export default function MyPage() {
  const { state, dispatch } = useAppState();
  const ob = state.onboarding;
  const [settingOpen, setSettingOpen] = useState(false);
  const [consentRenewed, setConsentRenewed] = useState(false); // 동의 갱신 원탭
  const [applied, setApplied] = useState({}); // 옵션 신청 상태 (데모)
  const [pdfRequested, setPdfRequested] = useState(false);
  const [invited, setInvited] = useState(false);
  const isPrimary = (state.demo.guardianRole || "primary") === "primary";

  const sharedReports = state.reports.filter((r) => r.shared);

  const applyOption = (o) => {
    if (!isPrimary || o.locked || applied[o.key]) return; // 결제 수반 — 주 보호자 전용
    setApplied((a) => ({ ...a, [o.key]: true }));
    dispatch({
      type: "addRequest",
      payload: {
        id: `rq-${Date.now()}`,
        dir: "fromGuardian",
        type: `옵션 신청 · ${o.name}`,
        detail: `${o.desc} — 접수 후 결제요청이 전달됩니다. (${o.price})`,
        amount: null,
        preferredDate: null,
        urgency: "normal",
        assignee: "박지현",
        photos: [],
        status: "requested",
        history: [{ at: Date.now(), status: "requested", note: "옵션 판매 접수" }],
        proof: null,
      },
    });
    dispatch({
      type: "pushEvent",
      payload: { kind: "옵션", text: `${o.name} 신청 접수 · 결제요청 예정`, color: "#B08D57" },
    });
  };

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
            동행이 완료되면 컨시어지가 검수한 리포트가 도착합니다. 월간 리포트는 방문 관찰과
            워치 데이터를 함께 정리해 매월 첫 주에 전달됩니다.
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
            컨시어지가 공유로 설정한 리포트만 표시됩니다. 판단·진단이 아니라 관찰 사실과 직접
            발언만 기록됩니다 (의료법 17조).
          </p>
        </Card>

        {/* MOU 병원 찾기 */}
        <Link href="/family/hospitals" className="block">
          <Card className="btn-press flex items-center justify-between p-4">
            <div>
              <div className="text-[16px] font-bold text-navy">제휴 병원 찾기</div>
              <div className="mt-0.5 text-[12px] text-muted">
                진료 과목별 MOU 병원 · 패스트트랙 · 동행 예약 요청
              </div>
            </div>
            <span className="text-[20px] text-muted/50">›</span>
          </Card>
        </Link>

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
            어르신 화면의 &lsquo;지금 우리 동네&rsquo;에서 설정한 요소가 먼저 보입니다. 병력에
            맞춰 보호자·컨시어지·어르신이 직접 설정합니다 — 건강정보로 자동 추천하지 않습니다.
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

        {/* 옵션 서비스 — 접수 → 결제요청 (보험은 GA 등록 전 잠금) */}
        <Card className="p-[18px]">
          <SectionLabel>옵션 서비스</SectionLabel>
          <div className="mt-3 space-y-3">
            {OPTION_SERVICES.map((o) => (
              <div key={o.key} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-bold ${o.locked ? "text-muted/60" : "text-navy"}`}>
                    {o.name}
                  </span>
                  <span className="ml-auto font-num text-[12px] font-bold text-muted">{o.price}</span>
                </div>
                <div className="mt-0.5 text-[12px] leading-[1.6] text-muted">{o.desc}</div>
                {o.locked ? (
                  <div className="mt-2 rounded-lg bg-navy/[.05] px-3 py-2 text-[11px] font-bold text-muted/70">
                    🔒 {o.lockNote}
                  </div>
                ) : (
                  <button
                    onClick={() => applyOption(o)}
                    disabled={!isPrimary || !!applied[o.key]}
                    className={`btn-press mt-2 rounded-lg border px-3.5 py-2 text-[13px] font-bold ${
                      applied[o.key]
                        ? "border-green/30 bg-green/10 text-green"
                        : isPrimary
                        ? "border-navy/20 text-navy"
                        : "border-navy/10 text-muted/50"
                    }`}
                  >
                    {applied[o.key]
                      ? "접수됨 · 해주세요에서 확인"
                      : isPrimary
                      ? "신청 (접수 → 결제요청)"
                      : "주 보호자만 신청할 수 있습니다"}
                  </button>
                )}
              </div>
            ))}
          </div>
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
                {INVITE.rule}. 참여자는 이름·관계·연락처만 입력하면 됩니다 — 결제수단은 필요
                없습니다. 구성원 제거는 주 보호자만 할 수 있습니다.
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
                  ? `${fmtWon(ob?.limitAmount ?? 50000)} 이하 어르신 직접 결제`
                  : { both: "양쪽 모두 결제", guardianOnly: "보호자만 결제", elderOnly: "어르신만 결제" }[ob.paymentMode]
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
function PrioritySheet({ current, onClose, onSave }) {
  const [factors, setFactors] = useState(current.factors);

  const toggle = (f) =>
    setFactors((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(8,23,45,.45)]">
      <div className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
        <div className="mx-auto mb-4 h-[4px] w-[38px] rounded-full bg-navy/15" />
        <div className="text-[19px] font-black text-navy">우선 확인 날씨 설정</div>
        <p className="mt-1 text-[12px] leading-[1.7] text-muted">
          어르신 병력에 맞는 날씨 요소를 먼저 보여줍니다. 설정 주체와 시각이 기록됩니다.
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
