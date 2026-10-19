import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { StatusChip } from "../../components/GuardianCharts";
import { Line } from "../../components/clay";
import { Card, Star, Tog, TONE } from "../../components/ds";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { honorific, subjectLabel, trackOf } from "../../lib/tracks";
import { MED_REGISTRY, MED_STREAK, healthOf, medTakenToday } from "../../lib/meds";
import { medMonth, medTally, pastWeek } from "../../lib/demo-health";

// 보호자 홈 '복약' 칸 → 복약 미션 (2026-10-15 디자인 시안) — 지난 7일 · 오늘 미션 · 7일 표 / 30일 달력.
// 오늘 칸은 어르신이 앱에서 '다 먹었어요'를 누른 것(state.elder.medSlots) 그대로다.
// 지난 기록은 데모 예시(lib/demo-health.js) — 테스트 가구 · 관제 센터 공간에는 지난 기록이 없어 오늘만 보인다.
// 시안의 '기다리는 중' 주황 동그라미는 금색으로 바꿨다 — 빨강 계열은 SOS · 낙상 전용.
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MON_FIRST = ["월", "화", "수", "목", "금", "토", "일"];
const SLOT_COLOR = { 1: TONE.purple.title, 0: "#B8A391", [-1]: "#E3DEEC" };

export default function MedsPage() {
  const { state } = useAppState();
  const live = !!useAuth().user?.household;
  const ob = state.onboarding;
  const subj = subjectLabel(trackOf(ob?.track), ob);
  const honor = honorific(ob);
  const health = healthOf(state);
  const plan = health.meds;
  const taken = medTakenToday(state.elder); // 오늘 날짜의 체크만 (어제 것은 남아 있어도 오늘이 아니다)
  const [per, setPer] = useState(7);

  const days = medMonth(plan, taken);
  const week = pastWeek(days);
  const t7 = medTally(week);
  const t30 = medTally(days);
  const todayDone = plan.filter((d) => taken[d.slot]).length;
  const allDone = plan.length > 0 && todayDone === plan.length;
  // 연속 — 어제까지(예시) + 오늘 다 드셨으면 하루 더. 어르신 화면 'n일 연속'과 같은 계산 (pages/elder.jsx)
  const streak = live ? (allDone ? 1 : 0) : MED_STREAK.days + (allDone ? 1 : 0);
  // 지난 7일 상태 — 놓친 번수가 두 번 이하면 양호, 그보다 많으면 관찰 (판정이 아니라 눈여겨볼지 표시)
  const missed7 = t7.total - t7.taken;
  const firstOpen = plan.findIndex((d) => !taken[d.slot]);
  const who = health.custom && health.by ? `${health.by} 등록` : live ? "첫 안심방문 등록값" : `${MED_REGISTRY.registeredBy} 등록`;

  // 30일 달력 — 월요일부터. 첫 날 앞은 빈칸으로 채워 요일 줄을 맞춘다
  const lead = (days[0].dow + 6) % 7;

  return (
    <>
      <Head>
        <title>복약 미션 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family" backLabel="홈으로 돌아가기" sub={`${subj} · 컨시어지 등록 일정`} title="복약 미션">
        {!plan.length ? (
          <Card tone="purple" shadow={false} pad={22} className="text-center text-[16px] font-bold leading-[1.6]" style={{ color: TONE.purple.fg }}>
            아직 등록된 약이 없어요. 첫 안심방문 때 컨시어지가 약봉투를 보고 등록합니다.
          </Card>
        ) : (
          <>
            <div className="ds-hero ds-r" style={{ "--d": "40ms", background: TONE.purple.bg }}>
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-extrabold" style={{ color: TONE.purple.title }}>
                  {live ? "오늘" : "지난 7일"}
                </span>
                {!live && <StatusChip kind={missed7 <= 2 ? "ok" : "watch"} />}
              </div>
              <div className="ds-big" style={{ color: "#3F2B6E" }}>
                {live ? todayDone : t7.taken}
                <small> / {live ? plan.length : t7.total}번</small>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="flex gap-[3px]" aria-hidden="true">
                    {Array.from({ length: Math.min(streak, 4) }, (_, i) => (
                      <Star key={i} size={24} />
                    ))}
                  </span>
                  <span className="text-[16px] font-extrabold" style={{ color: TONE.purple.fg }}>
                    {streak}일 연속 성공
                  </span>
                </div>
              )}
              {live ? (
                <p className="text-[14px] leading-[1.6]" style={{ color: TONE.purple.sub }}>
                  테스트 기간에는 지난 날 기록을 모으지 않아요. {honor}께서 오늘 누른 것만 보입니다.
                </p>
              ) : (
                <span className="ds-gchip self-start" style={{ color: TONE.purple.fg }}>
                  30일 {t30.taken} / {t30.total}번 · {t30.pct}%
                </span>
              )}
            </div>

            <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.purple.bg }}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="ds-lab m-0" style={{ color: TONE.purple.fg }}>
                  오늘 미션
                </h2>
                <span className="text-[13px] font-bold" style={{ color: "#5E5670" }}>
                  {who}
                </span>
              </div>
              <div>
                {plan.map((d, i) => {
                  const done = !!taken[d.slot];
                  const waiting = i === firstOpen;
                  return (
                    <div key={d.slot} className="ds-row">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white"
                        style={{ background: done ? TONE.green.solid : waiting ? TONE.gold.solid : "#C9C2D8" }}
                      >
                        {done ? <Line name="check" size={20} /> : <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                      </span>
                      <span className="ds-k">
                        <b>{d.slot} {spoken(d.time)}</b>
                        <small>{d.items.map((x) => x.name.replace(/\s*\([^)]*\)\s*$/, "")).join(" · ")}</small>
                      </span>
                      <span className="flex-none text-[14px] font-extrabold" style={{ color: done ? TONE.green.fg : waiting ? TONE.gold.fg : "#5E5670" }}>
                        {done ? "다 먹었어요" : waiting ? "기다리는 중" : "예정"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {!live && (
              <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: TONE.purple.bg }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="ds-lab m-0" style={{ color: TONE.purple.fg }}>
                    {per === 7 ? "지난 7일" : `30일 · ${days[0].md} – ${days[29].md}`}
                  </h2>
                  <Tog value={per} onChange={setPer} label="기간" options={[{ v: 7, label: "7일" }, { v: 30, label: "30일" }]} />
                </div>
                {per === 7 ? (
                  <div className="ds-dots" style={{ gridTemplateColumns: `44px repeat(${plan.length}, minmax(0, 1fr))` }}>
                    <span />
                    {plan.map((d) => (
                      <span key={d.slot} className="text-center text-[13px]" style={{ color: "#5E5670" }}>
                        {d.slot}
                      </span>
                    ))}
                    {week.map((w) => [
                      <span key={`${w.md}-l`}>
                        {DOW[w.dow]}
                        <span className="sr-only"> {w.md}</span>
                      </span>,
                      ...w.slots.map((v, k) => (
                        <span
                          key={`${w.md}-${k}`}
                          className="ds-dotcell"
                          style={{ background: v === 1 ? "#FFFFFF" : "#F0EAE4", color: v === 1 ? TONE.green.title : "#6E5A4A" }}
                        >
                          {v === 1 ? (
                            <>
                              <span aria-hidden="true">✓</span>
                              <span className="sr-only">{plan[k]?.slot} 먹음</span>
                            </>
                          ) : (
                            <>
                              <span className="sr-only">{plan[k]?.slot} </span>놓침
                            </>
                          )}
                        </span>
                      )),
                    ])}
                  </div>
                ) : (
                  <>
                    <div className="ds-mcal" aria-hidden="true">
                      {MON_FIRST.map((d) => (
                        <span key={d} className="text-center text-[12px] font-extrabold" style={{ color: "#5E5670" }}>
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="ds-mcal" role="list" aria-label="30일 복약 기록">
                      {Array.from({ length: lead }, (_, i) => (
                        <div key={`b${i}`} className="blank" aria-hidden="true" />
                      ))}
                      {days.map((d, i) => {
                        const isToday = i === days.length - 1;
                        const n = d.slots.filter((v) => v === 1).length;
                        return (
                          <div
                            key={d.md}
                            role="listitem"
                            aria-label={`${d.md}${isToday ? " 오늘" : ""} — ${n} / ${d.slots.length}번`}
                            style={isToday ? { outline: "2px solid #1B2340" } : undefined}
                          >
                            <small>{d.date.getDate()}</small>
                            <span className="m">
                              {d.slots.map((v, k) => (
                                <i key={k} style={{ background: SLOT_COLOR[v] }} />
                              ))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="ds-leg">
                      <span>
                        <i style={{ background: SLOT_COLOR[1] }} />
                        먹음
                      </span>
                      <span>
                        <i style={{ background: SLOT_COLOR[0] }} />
                        놓침
                      </span>
                      <span>
                        <i style={{ background: SLOT_COLOR[-1] }} />
                        오늘 남은 것
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <Link
          href="/family/requests?ask=med"
          className="ds-press ds-btn3d ds-btn ds-r flex items-center justify-center text-white"
          style={{ "--d": "160ms", background: TONE.purple.title, boxShadow: `0 4px 0 ${TONE.purple.fg}` }}
        >
          약이 바뀌었어요
        </Link>
        <div className="ds-src ds-r text-center" style={{ "--d": "170ms" }}>
          {live ? `${honor}께서 앱에서 ‘다 먹었어요’를 누른 기록이에요` : `${honor}께서 앱에서 ‘다 먹었어요’를 누른 기록이에요 · 지난 기록은 예시`}
        </div>
      </FamilyLayout>
    </>
  );
}

// "08:00" → "8시" · "12:30" → "12시 30분" · "19:00" → "7시" (아침 · 점심 · 저녁이 앞에 붙는다)
function spoken(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}시${m ? ` ${m}분` : ""}`;
}
