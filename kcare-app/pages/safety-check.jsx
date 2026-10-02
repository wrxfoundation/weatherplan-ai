import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Card, SectionLabel, PrimaryButton, Badge } from "../components/ui";
import { SAFETY_SECTIONS, gradeOf, scoreSafety } from "../lib/safety";
import { SAFETY_GOODS } from "../lib/store";
import { fmtWon } from "../lib/config";
import { useAppState } from "../lib/state";

// 시니어 홈 안전진단 — 컨시어지 첫 방문 도구 (실무자 피드백 2026-08-09).
// 30항목 100점. 완료하면 점수·등급이 첫 방문 리포트에 실리고, '아니오' 항목에
// 맞는 생활안전용품이 보호자 스토어 장바구니에 자동으로 담긴다 (state.demo.safetyCart).
//
// 원칙: 등급은 '집'의 등급이지 어르신의 점수가 아니다. 사람을 점수화하지 않는
// 21항목 원칙과 충돌하지 않는 이유가 이것이다 — 여기서 재는 것은 공간이다.

export default function SafetyCheckPage() {
  const { dispatch } = useAppState();
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(null); // { earned, fixes }

  const { earned, answered, fixes } = scoreSafety(answers);
  const total = SAFETY_SECTIONS.reduce((s, x) => s + x.max, 0); // 100
  const allAnswered = answered === 30;
  const grade = gradeOf(earned);

  const finish = () => {
    if (!allAnswered || done) return;
    const goods = SAFETY_GOODS.filter((g) => fixes.includes(g.id));
    setDone({ earned, goods });
    // 스토어 자동 담기 + 관제 이벤트 — 보호자 스토어가 safetyCart 를 읽는다
    dispatch({ type: "demo", payload: { safetyCart: goods.map((g) => g.id) } });
    dispatch({
      type: "pushEvent",
      payload: {
        kind: "안전진단",
        text: `첫 방문 홈 안전진단 ${earned}점 (${grade.grade}등급) — 안전용품 ${goods.length}종 장바구니 담김`,
        color: "#F0D9A8",
      },
    });
  };

  return (
    <>
      <Head>
        <title>홈 안전진단 — K-CARE</title>
      </Head>
      <div className="min-h-screen bg-nav">
        <div className="mx-auto min-h-screen w-full max-w-[430px] bg-paper px-4 pb-16 pt-5">
          <main>
            <div className="flex items-center justify-between">
              <h1 className="text-[24px] font-black leading-[1.4] text-navy">
                시니어 홈 안전진단
              </h1>
              <Link
                href="/concierge"
                className="tap text-[13px] font-bold text-muted underline underline-offset-2"
              >
                컨시어지 홈
              </Link>
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.7] text-muted">
              첫 방문에서 집안 전체를 30항목 · 100점으로 봅니다. 결과는 첫 방문 리포트에
              실리고, 부족한 곳의 안전용품이 스토어 장바구니에 자동으로 담깁니다.
            </p>

            {/* 진행 현황 — 고정 요약 */}
            <Card className="sticky top-3 z-10 mt-4 flex items-center gap-3 p-3.5 shadow-[0_10px_26px_-16px_rgba(10,31,60,.45)]">
              <div className="flex-1">
                <div className="text-[11px] font-bold text-muted">
                  응답 {answered} / 30
                </div>
                <div className="mt-1 h-[5px] overflow-hidden rounded-full bg-navy/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(answered / 30) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="font-num text-[22px] font-bold text-navy">{earned}</span>
                <span className="text-[12px] text-muted"> / {total}점</span>
              </div>
            </Card>

            {SAFETY_SECTIONS.map((sec) => (
              <Card key={sec.id} className="mt-3 p-4">
                <div className="flex items-center justify-between">
                  <SectionLabel>{sec.name}</SectionLabel>
                  <span className="font-num text-[12px] font-bold text-muted">{sec.max}점</span>
                </div>
                <div className="mt-2.5 space-y-2.5">
                  {sec.items.map((it) => {
                    const a = answers[it.no];
                    return (
                      <div key={it.no} className="flex items-center gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold leading-[1.5] text-ink">
                            <span className="font-num text-muted">{it.no}. </span>
                            {it.q}
                          </div>
                          <div className="font-num text-[11px] text-muted/80">{it.pts}점</div>
                        </div>
                        {[
                          [true, "예"],
                          [false, "아니오"],
                        ].map(([v, label]) => {
                          const on = a === v;
                          return (
                            <button
                              key={label}
                              disabled={!!done}
                              onClick={() => setAnswers((s) => ({ ...s, [it.no]: v }))}
                              className={`btn-press w-[56px] shrink-0 rounded-lg border py-2.5 text-[13px] font-bold ${
                                on
                                  ? v
                                    ? "border-green/50 bg-green/10 text-green"
                                    : "border-danger/40 bg-danger/[.07] text-danger"
                                  : "border-navy/15 text-muted"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}

            {/* 완료 — 등급 + 자동 담기 결과 */}
            {done ? (
              <Card className="mt-4 overflow-hidden">
                <div className="bg-navy p-5 text-white">
                  <SectionLabel>
                    <span className="text-gold-soft">진단 결과 — 이 집의 등급</span>
                  </SectionLabel>
                  <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="font-num text-[40px] font-bold leading-none">{done.earned}</span>
                    <span className="text-[13px] opacity-70">/ 100점</span>
                    <Badge fg={grade.fg} bg="rgba(255,255,255,.92)">
                      {grade.grade}등급 · {grade.label}
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-[12.5px] leading-[1.7] opacity-75">
                    점수는 집의 상태입니다 — 어르신의 점수가 아닙니다. 결과는 첫 방문
                    리포트에 실려 보호자께 전달됩니다.
                  </p>
                </div>
                <div className="p-5">
                  {done.goods.length > 0 ? (
                    <>
                      <SectionLabel>스토어 장바구니에 자동으로 담았습니다</SectionLabel>
                      <div className="mt-2.5 space-y-2">
                        {done.goods.map((g) => (
                          <div key={g.id} className="flex items-start gap-2.5">
                            <span className="mt-[3px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                              ✓
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] font-bold text-ink">{g.name}</div>
                              <div className="text-[12px] text-muted">{g.effect}</div>
                            </div>
                            <span className="shrink-0 font-num text-[13.5px] font-bold text-navy">
                              {fmtWon(g.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 border-t border-navy/[.08] pt-2.5 text-[12px] leading-[1.7] text-muted">
                        결제는 보호자가 스토어에서 확인 후 진행합니다 — 자동으로 결제되지
                        않습니다. 빼는 것도 보호자 자유입니다.
                      </p>
                      <Link
                        href="/family/store"
                        className="btn-press mt-3 block rounded-xl bg-navy py-3 text-center text-[15px] font-bold text-white"
                      >
                        보호자 스토어에서 확인 (데모)
                      </Link>
                    </>
                  ) : (
                    <p className="text-[14.5px] leading-[1.75] text-green">
                      모든 항목이 &lsquo;예&rsquo;입니다. 담을 안전용품이 없습니다 — 이 상태
                      그대로 리포트에 기록합니다.
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="mt-4">
                <PrimaryButton disabled={!allAnswered} onClick={finish}>
                  {allAnswered
                    ? "진단 완료 — 리포트 반영 · 장바구니 담기"
                    : `30항목 중 ${answered}개 응답됨 — 전부 확인해 주세요`}
                </PrimaryButton>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
