import Head from "next/head";
import FamilyLayout from "../../components/FamilyLayout";
import { Card, SectionLabel, PendingTag } from "../../components/ui";
import Icon from "../../components/icons";
import { FIT3_INFO, FIT3_METRICS } from "../../lib/mock";

// 워치 모니터링 상세 — 갤럭시 Fit3 8개 항목 (회의 초안 표 구현).
// 정직 표기 원칙: "실시간"이 아니라 준실시간(5분 동기화) · 낙상 SOS 경로 명시.
const LEVEL = {
  ok: { fg: "#1E7A5A", bg: "rgba(30,122,90,.1)" },
  caution: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  neutral: { fg: "#0A1F3C", bg: "rgba(10,31,60,.06)" },
};

export default function WatchPage() {
  return (
    <>
      <Head>
        <title>워치 모니터링 — K-CARE</title>
      </Head>
      <FamilyLayout>
        {/* 연동 상태 — 어떤 경로로 오는 데이터인지 숨기지 않는다 */}
        <div
          className="card-navy border-grad-dark rounded-card bg-navy p-[18px] text-white"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,0))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.14), 0 18px 36px -24px rgba(10,31,60,.8)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Icon name="watch" size={22} strokeWidth={2} className="text-gold-soft" />
            <span className="text-[16px] font-bold">{FIT3_INFO.device} · 어머니 손목</span>
            <span className="ml-auto rounded-full bg-green/20 px-2.5 py-1 text-[11px] font-bold text-[#8FE3C0]">
              착용 중 · 배터리 {FIT3_INFO.battery}
            </span>
          </div>
          <div className="mt-2.5 space-y-1 border-t border-white/[.06] pt-2.5 text-[12px] text-white/65">
            <div>연동 경로 — {FIT3_INFO.path}</div>
            <div>
              갱신 — {FIT3_INFO.cycle} · 마지막 수신 <b className="font-num text-white">{FIT3_INFO.lastSync}</b>
            </div>
          </div>
        </div>

        {/* 8개 항목 — 값 · 상태 · 이 신호로 무엇을 하는지 */}
        <Card className="p-[18px]">
          <div className="flex items-center justify-between">
            <div className="text-[17px] font-black text-navy">건강 신호 8종</div>
            <span className="font-num text-[12px] text-muted">{FIT3_INFO.lastSync} 동기화</span>
          </div>
          <div className="mt-3 space-y-3.5">
            {FIT3_METRICS.map((m) => (
              <div key={m.name} className="border-t border-navy/[.07] pt-3.5 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
                    style={{ color: LEVEL[m.level].fg, background: LEVEL[m.level].bg }}
                  >
                    <Icon name={m.icon} size={18} strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-bold text-navy">{m.name}</span>
                  {m.partner && <PendingTag>파트너 SDK 협의</PendingTag>}
                  <span className="ml-auto text-right">
                    <span className="font-num text-[18px] font-bold" style={{ color: LEVEL[m.level].fg }}>
                      {m.value}
                    </span>
                    {m.unit && <span className="ml-0.5 text-[12px] text-muted">{m.unit}</span>}
                  </span>
                </div>
                <div className="mt-1 pl-[44px] text-[12px] text-muted">{m.status}</div>
                <div className="mt-0.5 pl-[44px] text-[12px] leading-[1.6] text-ink">→ {m.action}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 낙상 SOS 경로 — 오해 없게 명시 (REQ-04와 동일 사상) */}
        <Card className="p-[18px]">
          <SectionLabel>낙상 · 긴급 신호 경로</SectionLabel>
          <ol className="mt-3 space-y-2.5">
            {[
              ["워치가 낙상을 감지하면", "연결된 스마트폰이 보호자에게 즉시 알립니다"],
              ["보호자 무응답 시", "K-CARE 컴패니언이 관제에 확인 요청을 올립니다"],
              ["관제 확인 후", "확인 콜 → 급파 → 필요 시 119 연계 (접수 + 연계까지 보증)"],
            ].map(([t, d], i) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[1px] inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy font-num text-[12px] font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[14px] font-bold text-navy">{t}</div>
                  <div className="text-[12px] leading-[1.6] text-muted">{d}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[11px] leading-[1.7] text-muted">
            단독 충격은 알림하지 않습니다 — 충격 + 무움직임 복합 신호만 알립니다 (오탐 관리) ·
            워치 6시간 무수집 시에도 가족에게 알립니다
          </p>
        </Card>
      </FamilyLayout>
    </>
  );
}
