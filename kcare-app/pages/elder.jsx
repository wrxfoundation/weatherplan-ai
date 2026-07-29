import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { CONCIERGES, EVENT_KINDS, OUTING } from "../lib/mock";
import { useAppState } from "../lib/state";

// 사용자(어르신) 홈 — 핸드오프 02 elder 명세 + REQ-01(우선 날씨) + REQ-06(SOS)
// 접근성 규격(타협 불가): 본문 19px+, 제목 30px/900, 버튼 라벨 21px+, 버튼 패딩 28px,
// 색만으로 상태 전달 금지, 링크 대신 버튼.
// 정보 비대칭: 어르신을 평가하는 데이터(낙상 의심·이상 징후)는 이 화면에 없다.

export default function ElderHome() {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState("today");
  const [sosPhase, setSosPhase] = useState("idle"); // idle | confirm | sent

  const elderName = state.onboarding?.elderName || "김순자";
  const upcoming = [...state.events].sort((a, b) => a.at - b.at).filter((e) => e.at > Date.now());
  const next = upcoming[0];
  const priority = state.priority;

  // REQ-01 — 설정된 우선 요소를 최상단으로 정렬 (자동 추론 아님, 설정 출처 표기)
  const factors = [...OUTING.factors].sort(
    (a, b) =>
      (priority.factors.includes(b.name) ? 1 : 0) - (priority.factors.includes(a.name) ? 1 : 0)
  );

  return (
    <>
      <Head>
        <title>어르신 홈 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto min-h-screen w-full max-w-[430px] bg-elder pb-40">
          <header className="px-6 pb-2 pt-7">
            <div className="font-num text-[12px] font-bold tracking-[.16em] text-gold">
              K-CARE
            </div>
            <h1 className="mt-1 text-[30px] font-black leading-[1.3] text-navy">
              {elderName} 어르신,
              <br />
              좋은 오후예요
            </h1>
          </header>

          {/* 탭 — 히트 타겟 크게 */}
          <div className="flex gap-2 px-6 pt-3">
            {[
              ["today", "오늘"],
              ["health", "건강"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`btn-press min-h-[56px] flex-1 rounded-2xl border-2 text-[21px] font-bold ${
                  tab === k
                    ? "border-navy bg-navy text-white"
                    : "border-navy/20 bg-white text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <main className="space-y-4 px-5 pt-4">
            {tab === "today" && (
              <>
                {/* 오늘 찾아뵙는 분 — 사기·침입 방어 문구 삭제 불가 */}
                <section className="rounded-[20px] border-2 border-gold bg-white p-6">
                  <div className="text-[19px] font-bold text-amber">오늘 찾아뵙는 분</div>
                  <p className="mt-2 text-[19px] leading-[1.6] text-ink">
                    두 분이 함께 옵니다. 문 열기 전에 얼굴을 확인하세요.
                  </p>
                  <div className="mt-4 space-y-3">
                    {CONCIERGES.map((c) => (
                      <div key={c.name} className="flex items-center gap-4">
                        <span className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-navy text-[22px] font-bold text-white">
                          {c.name.slice(0, 1)}
                        </span>
                        <div>
                          <div className="text-[22px] font-bold text-navy">{c.name}</div>
                          <div className="text-[19px] text-muted">{c.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-2xl bg-[#FDF6E8] p-4 text-[19px] leading-[1.6] text-amber">
                    두 분 다 목에 K-CARE 이름표를 걸고 옵니다. 이름이 다르면 문을 열지
                    마시고 노란 버튼을 누르세요.
                  </p>
                </section>

                {/* 오늘 일정 — '선생님' 호칭 유지 */}
                {next && (
                  <section className="rounded-[20px] bg-navy p-6 text-white">
                    <div className="text-[19px] text-white/70">
                      {EVENT_KINDS[next.kind].label}
                    </div>
                    <div className="mt-1 font-num text-[26px] font-bold">
                      {new Date(next.at).toLocaleString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <p className="mt-2 text-[20px] font-bold leading-[1.55]">
                      {next.kind === "hospital" || next.kind === "visit"
                        ? `박지현 선생님이 모시러 옵니다`
                        : next.title}
                    </p>
                    <p className="mt-1 text-[19px] leading-[1.55] text-white/75">{next.title}</p>
                  </section>
                )}

                {/* 지금 우리 동네 — REQ-01 우선 요소 강조 */}
                <section className="rounded-[20px] bg-white p-6">
                  <div className="flex items-baseline justify-between">
                    <div className="text-[19px] font-bold text-muted">지금 우리 동네</div>
                    <div className="text-[13px] text-muted/70">우선 항목 · {priority.source}</div>
                  </div>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="font-num text-[44px] font-bold leading-none text-navy">
                      {factors[0].value}
                    </span>
                    <span className="pb-1 text-[21px] font-bold text-amber">
                      {factors[0].name} 먼저 보세요
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {factors.slice(1).map((f) => (
                      <div key={f.name} className="rounded-2xl bg-paper p-4">
                        <div className="text-[17px] text-muted">{f.name}</div>
                        <div className="font-num text-[24px] font-bold text-navy">{f.value}</div>
                      </div>
                    ))}
                    <div className="rounded-2xl bg-paper p-4">
                      <div className="text-[17px] text-muted">외출 점수</div>
                      <div className="font-num text-[24px] font-bold text-navy">
                        {Math.min(...OUTING.legs.map((l) => l.score))}점
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[19px] leading-[1.6] text-ink">{OUTING.advice}</p>
                </section>
              </>
            )}

            {tab === "health" && (
              <>
                {/* 오늘 약 — 복약 완료 1버튼 */}
                <section className="rounded-[20px] bg-white p-6">
                  <div className="text-[19px] font-bold text-muted">오늘 약</div>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="w-[62px] shrink-0 font-num text-[19px] font-bold text-navy">
                      08:00
                    </span>
                    <div className="flex-1 text-[21px] font-bold text-ink">아침 혈압약</div>
                    <span
                      className={`text-[19px] font-bold ${
                        state.elder.medTaken ? "text-green" : "text-amber"
                      }`}
                    >
                      {state.elder.medTaken ? "드셨어요" : "아직"}
                    </span>
                  </div>
                  {!state.elder.medTaken && (
                    <button
                      onClick={() => dispatch({ type: "medTaken" })}
                      className="btn-press mt-5 w-full rounded-2xl bg-green p-7 text-[22px] font-bold text-white"
                    >
                      약 먹었어요
                    </button>
                  )}
                  {state.elder.medTaken && (
                    <p className="mt-4 rounded-2xl bg-green/10 p-4 text-[19px] font-bold text-green">
                      잘하셨어요. 가족에게도 전달했습니다.
                    </p>
                  )}
                </section>

                {/* 지금 집 안 — 측정기 미설치: 정직 표기 */}
                <section className="rounded-[20px] bg-white p-6">
                  <div className="text-[19px] font-bold text-muted">지금 집 안</div>
                  <p className="mt-3 text-[19px] leading-[1.65] text-ink">
                    실내 온도 측정기는 첫 방문 때 선생님이 설치해 드립니다.
                  </p>
                  <span className="mt-3 inline-block rounded-xl border border-muted/30 px-3 py-2 text-[17px] font-bold text-muted">
                    설치 예정 · 연동 대기
                  </span>
                </section>

                {/* 자녀들이 보고 있습니다 — 감시가 아니라 관심 */}
                <section className="rounded-[20px] border border-green/25 bg-[#F1FAF6] p-6">
                  <div className="text-[19px] font-bold text-green">가족이 함께 봅니다</div>
                  <p className="mt-2 text-[19px] leading-[1.65] text-ink">
                    민수·지영·현우, 세 자녀가 멀리 있어도 매일 확인하고 있습니다.
                  </p>
                </section>
              </>
            )}
          </main>
        </div>

        {/* SOS — REQ-06: 하단 중앙 플로팅 · 항상 보임 · 2초 길게 누르기 */}
        <SosButton
          phase={sosPhase}
          setPhase={setSosPhase}
          onDispatch={() => dispatch({ type: "demo", payload: { sos: true } })}
        />
      </div>
    </>
  );
}

function SosButton({ phase, setPhase, onDispatch }) {
  const [hold, setHold] = useState(0); // 0~100 길게 누르기 진행
  const [count, setCount] = useState(5);
  const holdTimer = useRef(null);
  const countTimer = useRef(null);

  const HOLD_MS = 2000;

  const startHold = () => {
    if (phase !== "idle") return;
    const t0 = Date.now();
    holdTimer.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / HOLD_MS) * 100);
      setHold(p);
      if (p >= 100) {
        clearInterval(holdTimer.current);
        setHold(0);
        setPhase("confirm");
      }
    }, 50);
  };
  const endHold = () => {
    clearInterval(holdTimer.current);
    setHold(0);
  };

  // 5초 취소 유예 — 미취소 시 자동 접수
  useEffect(() => {
    if (phase !== "confirm") return undefined;
    setCount(5);
    countTimer.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(countTimer.current);
          onDispatch();
          setPhase("sent");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countTimer.current);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* 플로팅 버튼 — 항상 보이는 위치 */}
      {phase === "idle" && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <button
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            className="relative flex h-[96px] w-[96px] select-none flex-col items-center justify-center rounded-full bg-[#F2B705] text-navy shadow-[0_10px_28px_-8px_rgba(138,93,18,.55)]"
            style={{
              background:
                hold > 0
                  ? `conic-gradient(#C0392B ${hold * 3.6}deg, #F2B705 0deg)`
                  : undefined,
            }}
          >
            <span className="text-[24px] font-black leading-none">SOS</span>
            <span className="mt-1 text-[13px] font-bold leading-[1.2]">
              2초 꾹
              <br />
              누르세요
            </span>
          </button>
        </div>
      )}

      {/* 5초 취소 유예 화면 */}
      {phase === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,23,45,.92)] px-6">
          <div className="w-full max-w-[430px] text-center">
            <div className="text-[30px] font-black leading-[1.4] text-white">
              도움 요청을
              <br />
              보내는 중입니다
            </div>
            <div className="mx-auto mt-6 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-danger font-num text-[48px] font-bold text-white">
              {count}
            </div>
            <p className="mt-4 text-[21px] leading-[1.6] text-white/80">
              잘못 눌렀다면 아래 버튼을
              <br />
              눌러 취소하세요
            </p>
            <button
              onClick={() => {
                clearInterval(countTimer.current);
                setPhase("idle");
              }}
              className="btn-press mt-6 w-full rounded-2xl bg-white p-7 text-[24px] font-black text-navy"
            >
              취소합니다
            </button>
          </div>
        </div>
      )}

      {/* 접수 후 — 안심 화면. 어르신에게는 경과·SLA를 보여주지 않는다 */}
      {phase === "sent" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy px-6">
          <div className="w-full max-w-[430px] text-center">
            <div className="mx-auto flex h-[90px] w-[90px] items-center justify-center rounded-full bg-green text-[40px] text-white">
              ✓
            </div>
            <div className="mt-6 text-[30px] font-black leading-[1.45] text-white">
              선생님이
              <br />
              오고 있습니다
            </div>
            <p className="mt-4 text-[21px] leading-[1.65] text-white/80">
              가족에게도 알렸습니다.
              <br />
              편한 자세로 기다리세요.
            </p>
            <button
              onClick={() => setPhase("idle")}
              className="btn-press mt-8 w-full rounded-2xl border-2 border-white/40 p-7 text-[22px] font-bold text-white"
            >
              화면 닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
