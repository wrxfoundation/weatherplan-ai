import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PrimaryButton, GhostButton, Badge, PendingTag } from "../../components/ui";
import { ELDER, OPTION_SERVICES, PRIORITY_PRESETS, WEATHER_FACTORS } from "../../lib/mock";
import { fmtWon } from "../../lib/config";
import { useAppState } from "../../lib/state";

// 마이 — 멤버십 · 우선 날씨 설정(REQ-01) · 옵션 서비스(회의 9) · 케어 리포트 · 병원 찾기
// 우선 날씨는 자동 추론이 아니라 사람이 설정한다 — 설정 주체·시각을 기록한다.

export default function MyPage() {
  const { state, dispatch } = useAppState();
  const ob = state.onboarding;
  const [settingOpen, setSettingOpen] = useState(false);
  const [applied, setApplied] = useState({}); // 옵션 신청 상태 (데모)
  const [pdfRequested, setPdfRequested] = useState(false);

  const sharedReports = state.reports.filter((r) => r.shared);

  const applyOption = (o) => {
    if (o.locked || applied[o.key]) return;
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
          <div className="text-[15px] font-black text-navy">케어 리포트</div>
          <p className="mt-1.5 text-[12px] leading-[1.7] text-muted">
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
            className={`btn-press mt-3 w-full rounded-xl border py-3 text-[13px] font-bold ${
              pdfRequested ? "border-green/30 bg-green/10 text-green" : "border-navy/20 text-navy"
            }`}
          >
            {pdfRequested ? "✓ 요청됨 — 생성되면 알림으로 전달" : "증빙 보고서 열기 (PDF)"}
          </button>
          {pdfRequested && (
            <div className="mt-2 text-center">
              <PendingTag>PDF 생성 연동 대기</PendingTag>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-navy/[.08] pt-3">
            <SectionLabel>방문 관찰 리포트</SectionLabel>
            <span className="text-[11px] text-muted">공유분 {sharedReports.length}건</span>
          </div>
          {sharedReports.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">아직 공유된 리포트가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {sharedReports.map((r) => (
                <div key={r.id} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-bold text-navy">{r.by} 선생님</span>
                    <span className="font-num text-[10px] text-muted">
                      {new Date(r.at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                      {" · 특이 "}
                      {r.flagged}건
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.7] text-ink">{r.note}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-navy/[.07] pt-2.5 text-[10px] leading-[1.6] text-muted">
            컨시어지가 공유로 설정한 리포트만 표시됩니다. 판단·진단이 아니라 관찰 사실과 직접
            발언만 기록됩니다 (의료법 17조).
          </p>
        </Card>

        {/* MOU 병원 찾기 */}
        <Link href="/family/hospitals" className="block">
          <Card className="btn-press flex items-center justify-between p-4">
            <div>
              <div className="text-[14px] font-bold text-navy">제휴 병원 찾기</div>
              <div className="mt-0.5 text-[11px] text-muted">
                진료 과목별 MOU 병원 · 패스트트랙 · 동행 예약 요청
              </div>
            </div>
            <span className="text-[18px] text-muted/50">›</span>
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
              <span key={f} className="rounded-full bg-navy px-3 py-1.5 text-[12px] font-bold text-white">
                {f}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-[1.7] text-muted">
            어르신 화면의 &lsquo;지금 우리 동네&rsquo;에서 설정한 요소가 먼저 보입니다. 병력에
            맞춰 보호자·컨시어지·어르신이 직접 설정합니다 — 건강정보로 자동 추천하지 않습니다.
          </p>
          <GhostButton className="mt-3" onClick={() => setSettingOpen(true)}>
            우선 요소 설정
          </GhostButton>
        </Card>

        {/* 옵션 서비스 — 접수 → 결제요청 (보험은 GA 등록 전 잠금) */}
        <Card className="p-[18px]">
          <SectionLabel>옵션 서비스</SectionLabel>
          <div className="mt-3 space-y-3">
            {OPTION_SERVICES.map((o) => (
              <div key={o.key} className="border-t border-navy/[.07] pt-3 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-bold ${o.locked ? "text-muted/60" : "text-navy"}`}>
                    {o.name}
                  </span>
                  <span className="ml-auto font-num text-[11px] font-bold text-muted">{o.price}</span>
                </div>
                <div className="mt-0.5 text-[11px] leading-[1.6] text-muted">{o.desc}</div>
                {o.locked ? (
                  <div className="mt-2 rounded-lg bg-navy/[.05] px-3 py-2 text-[10px] font-bold text-muted/70">
                    🔒 {o.lockNote}
                  </div>
                ) : (
                  <button
                    onClick={() => applyOption(o)}
                    disabled={!!applied[o.key]}
                    className={`btn-press mt-2 rounded-lg border px-3.5 py-2 text-[12px] font-bold ${
                      applied[o.key]
                        ? "border-green/30 bg-green/10 text-green"
                        : "border-navy/20 text-navy"
                    }`}
                  >
                    {applied[o.key] ? "접수됨 · 해주세요에서 확인" : "신청 (접수 → 결제요청)"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 멤버십 요약 */}
        <Card className="p-[18px]">
          <SectionLabel>멤버십</SectionLabel>
          <div className="mt-3 space-y-2 text-[13px]">
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
        <div className="text-[17px] font-black text-navy">우선 확인 날씨 설정</div>
        <p className="mt-1 text-[11px] leading-[1.7] text-muted">
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
                <div className="text-[13px] font-bold text-navy">{p.label}</div>
                <div className="mt-0.5 text-[11px] text-muted">{p.hint}</div>
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
                className={`btn-press rounded-full border px-3 py-1.5 text-[12px] font-bold ${
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
