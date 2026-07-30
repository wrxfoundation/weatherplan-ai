import Head from "next/head";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PendingTag } from "../../components/ui";
import { useAppState } from "../../lib/state";

// 리포트 탭 — 케어 리포트 (디자인 콘솔). 컨시어지가 공유로 설정한 리포트만 표시.
// 증빙 보고서 PDF는 reference/증빙 리포트 문서와 연동 예정 (데모).

export default function ReportsPage() {
  const { state, dispatch } = useAppState();
  const [pdfRequested, setPdfRequested] = useState(false);
  const shared = state.reports.filter((r) => r.shared);

  return (
    <>
      <Head>
        <title>케어 리포트 — K-CARE</title>
      </Head>
      <FamilyLayout title="케어 리포트">
        {/* 안내 + 증빙 PDF (디자인 콘솔) */}
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
        </Card>

        {/* 월간 관찰 리포트 — 공유분 */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <SectionLabel>방문 관찰 리포트</SectionLabel>
            <span className="text-[11px] text-muted">공유분 {shared.length}건</span>
          </div>
          {shared.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">아직 공유된 리포트가 없습니다.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {shared.map((r) => (
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
      </FamilyLayout>
    </>
  );
}
