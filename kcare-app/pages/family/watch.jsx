import Head from "next/head";
import FamilyLayout from "../../components/FamilyLayout";
import { Clay, Line } from "../../components/clay";
import { Card, TONE } from "../../components/ds";
import { FIT3_INFO, FIT3_METRICS } from "../../lib/mock";
import { useAuth } from "../../lib/auth";
import { useAppState } from "../../lib/state";
import { subjectLabel, trackOf } from "../../lib/tracks";

// 워치 모니터링 상세 — 갤럭시 Fit3 8개 항목 (회의 초안 표 구현). 2026-10-15 시안 틀(뒤로 + 제목 · 색 카드)로 옮겼다.
// 정직 표기 원칙: "실시간"이 아니라 준실시간(5분 동기화) · 낙상 SOS 경로 명시.
// 상태 색 — 양호 초록 · 살펴볼 것 금색 · 그 밖 회색. 빨강은 쓰지 않는다 (위험 신호 전용)
const LEVEL = {
  ok: { fg: TONE.green.fg, bg: TONE.green.bg },
  caution: { fg: TONE.gold.fg, bg: TONE.gold.bg },
  neutral: { fg: "#3A3F50", bg: "#F3F1EC" },
};
const ICON = { heart: "heartPulse", activity: "steps", moon: "moon", drop: "heartPulse", wave: "sunNow", alert: "shieldGreen", pin: "houseSearch", watch: "shieldBlue" };

export default function WatchPage() {
  const { state } = useAppState();
  const subj = subjectLabel(trackOf(state.onboarding?.track), state.onboarding);
  // 테스트 가구에는 워치가 없다 — 예시 수치를 '착용 중 · 마지막 수신'으로 보여 주면 실제 기록처럼 읽힌다 (2026-10-02 UX 점검)
  const live = !!useAuth().user?.household;
  return (
    <>
      <Head>
        <title>워치 모니터링 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family" backLabel="홈으로 돌아가기" sub={`${subj} · ${FIT3_INFO.device}`} title="워치">
        {live ? (
          <Card tone="blue" shadow={false} pad={20} className="ds-r flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <Clay name="shieldBlue" size={40} />
              <span className="text-[19px] font-black">워치 연결 안 함 · 베타</span>
            </div>
            <p className="text-[15px] leading-[1.7]" style={{ color: "#3A3F50" }}>
              테스트 가구는 워치 · 센서 없이 휴대폰 앱으로만 테스트합니다. 수면 · 걸음 · 심박 같은 건강 수치는 받지 않습니다.
            </p>
            <p className="text-[14px] leading-[1.7]" style={{ color: "#5E6270" }}>
              대신 어르신 앱의 복약 체크 · SOS · 안부 음성은 실제로 이어집니다 — 홈 화면에서 보입니다.
            </p>
          </Card>
        ) : (
          <>
            {/* 연동 상태 — 어떤 경로로 오는 데이터인지 숨기지 않는다 */}
            <div className="ds-hero ds-r text-white" style={{ "--d": "40ms", background: "#1B2340" }}>
              <div className="flex items-center gap-2.5">
                <Line name="watch" size={22} />
                <span className="text-[17px] font-extrabold">{FIT3_INFO.device} · {subj} 손목</span>
              </div>
              <span className="self-start rounded-full px-3 py-1 text-[13px] font-extrabold" style={{ background: "rgba(143,227,192,.18)", color: "#8FE3C0" }}>
                착용 중 · 배터리 {FIT3_INFO.battery}
              </span>
              <div className="flex flex-col gap-1 border-t border-white/10 pt-2.5 text-[13px] leading-[1.6] text-white/75">
                <div>연동 경로 — {FIT3_INFO.path}</div>
                <div>
                  갱신 — {FIT3_INFO.cycle} · 마지막 수신 <b className="text-white">{FIT3_INFO.lastSync}</b>
                </div>
              </div>
            </div>

            {/* 8개 항목 — 값 · 상태 · 이 신호로 무엇을 하는지 */}
            <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: "#FFFFFF", boxShadow: "0 5px 0 #E6E2DA" }}>
              <div className="flex items-center justify-between">
                <h2 className="ds-lab m-0 text-[17px]">건강 신호 8종</h2>
                <span className="text-[13px] font-bold" style={{ color: "#5E6270" }}>
                  {FIT3_INFO.lastSync} 동기화 · 예시
                </span>
              </div>
              <div>
                {FIT3_METRICS.map((m) => (
                  <div key={m.name} className="ds-row items-start">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px]" style={{ background: LEVEL[m.level].bg }}>
                      <Clay name={ICON[m.icon] || "heartPulse"} size={30} />
                    </span>
                    <span className="ds-k">
                      <b className="flex flex-wrap items-center gap-1.5">
                        {m.name}
                        {m.partner && (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: "#F3F1EC", color: "#5E6270" }}>
                            파트너 SDK 협의
                          </span>
                        )}
                      </b>
                      <small>{m.status}</small>
                      <small style={{ color: "#3A3F50" }}>→ {m.action}</small>
                    </span>
                    <span className="flex-none text-right">
                      <span className="ds-num text-[19px] font-black" style={{ color: LEVEL[m.level].fg }}>
                        {m.value}
                      </span>
                      {m.unit && (
                        <span className="ml-0.5 text-[12px] font-bold" style={{ color: "#5E6270" }}>
                          {m.unit}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 낙상 SOS 경로 — 오해 없게 명시 (REQ-04와 동일 사상) */}
            <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: "#F3F1EC" }}>
              <h2 className="ds-lab m-0">낙상 · 긴급 신호 경로</h2>
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {[
                  ["워치가 낙상을 감지하면", "연결된 스마트폰이 보호자에게 즉시 알립니다"],
                  ["보호자 무응답 시", "K-CARE 컴패니언이 관제에 확인 요청을 올립니다"],
                  ["관제 확인 후", "확인 콜 → 급파 → 필요 시 119 연계 (접수 + 연계까지 보증)"],
                ].map(([t, d], i) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-[1px] inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-black text-white" style={{ background: "#1B2340" }}>
                      {i + 1}
                    </span>
                    <span>
                      <b className="block text-[16px] font-extrabold">{t}</b>
                      <span className="block text-[14px] leading-[1.6]" style={{ color: "#5E6270" }}>
                        {d}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="border-t pt-2.5 text-[13px] leading-[1.7]" style={{ borderColor: "rgba(27,35,64,.08)", color: "#5E6270" }}>
                단독 충격은 알리지 않고 충격 + 무움직임 복합 신호만 알립니다 (오탐 관리) · 워치 6시간 무수집 시에도 가족에게 알립니다
              </p>
            </div>
          </>
        )}
      </FamilyLayout>
    </>
  );
}
