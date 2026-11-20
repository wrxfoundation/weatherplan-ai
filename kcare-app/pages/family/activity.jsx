import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { MonthBars, NoWatch, StatusChip, WeekBars } from "../../components/GuardianCharts";
import { Card, Tog, TONE } from "../../components/ds";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { subjectLabel, trackOf } from "../../lib/tracks";
import { FIT3_INFO, VITALS } from "../../lib/mock";
import { VISIT_REPORT } from "../../lib/visit-report";
import { LAST_WEEK_STEPS, STEP_GOAL, fitMonth, stepGoalPct } from "../../lib/demo-health";

// 보호자 홈 '활동' 칸 → 활동 (2026-10-15 디자인 시안) — 오늘 걸음 · 최근 7일 / 30일 · 몸 신호 · 컨시어지가 본 것.
// 데모는 워치 예시 값(최근 7일 = 어르신 건강 화면과 같은 FIT_WEEK), 테스트 가구는 워치가 없다고 말한다.
// '컨시어지가 본 것'은 안심방문 리포트의 '걸음 · 균형' 메모 — 데모는 예시 리포트(9월), 테스트 가구는 관제가 보낸 리포트에 적힌 것만.
const k = (n) => `${(n / 1000).toFixed(1)}k`;
const vital = (name) => VITALS.find((v) => v.name === name);

export default function ActivityPage() {
  const { state } = useAppState();
  const live = !!useAuth().user?.household;
  const subj = subjectLabel(trackOf(state.onboarding?.track), state.onboarding);
  const [per, setPer] = useState(7);
  const month = fitMonth();
  const week = month.slice(-7);
  const today = month[month.length - 1];
  const avg = (xs) => Math.round(xs.reduce((s, d) => s + d.steps, 0) / xs.length / 10) * 10;
  const weekAvg = avg(week);
  const pct = stepGoalPct(today.steps);
  // 걸음 칸 상태 — 데이터가 정한 수준(VITALS level)을 그대로 옮긴다. 화면이 따로 판정하지 않는다
  const stepLevel = vital("걸음 수")?.level;
  const heart = vital("심박수");
  const spo2 = vital("혈중 산소");
  const stress = vital("스트레스");
  const stressUsual = (stress?.status.match(/평균\s*(\d+)/) || [])[1];

  // 컨시어지가 본 것 — 테스트 가구는 관제가 보낸 리포트의 메모만 (없으면 언제 생기는지 말한다)
  const sentAt = state.visit?.ops?.sentAt;
  const liveNote = sentAt ? state.visit?.notes?.["몸-걸음 · 균형"] : "";
  const demoItem = VISIT_REPORT.axes.flatMap((a) => a.items).find((i) => i.k.replace(/\s/g, "") === "걸음·균형");
  const seen = live
    ? liveNote
      ? { when: new Date(sentAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }), text: liveNote }
      : null
    : demoItem
      ? { when: `${Number(VISIT_REPORT.head.visitedAt.split(".")[1])}월 ${Number(VISIT_REPORT.head.visitedAt.split(".")[2])}일 예시 리포트`, text: demoItem.note }
      : null;

  return (
    <>
      <Head>
        <title>활동 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family" backLabel="홈으로 돌아가기" sub={`${subj} · ${FIT3_INFO.device}`} title="활동">
        {live ? (
          <NoWatch what="걸음" tone="green" />
        ) : (
          <>
            <div className="ds-hero ds-r" style={{ "--d": "40ms", background: TONE.green.bg }}>
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-extrabold" style={{ color: TONE.green.title }}>
                  오늘 걸음
                </span>
                <StatusChip kind={stepLevel === "caution" ? "watch" : "ok"} />
              </div>
              <div className="ds-big" style={{ color: "#1F4A2C" }}>
                {today.steps.toLocaleString("ko-KR")}
                <small> 걸음</small>
              </div>
              <div
                className="h-3.5 overflow-hidden rounded-[7px] bg-white"
                role="progressbar"
                aria-label="하루 목표까지"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, pct)}
              >
                <i className="ds-fill block h-full rounded-[7px]" style={{ width: `${Math.min(100, pct)}%`, background: TONE.green.solid }} />
              </div>
              <div className="flex justify-between gap-2 text-[14px] font-extrabold" style={{ color: TONE.green.fg }}>
                <span>
                  목표 {STEP_GOAL.toLocaleString("ko-KR")}의 {pct}%
                </span>
                <span>지난주 평균 {LAST_WEEK_STEPS.toLocaleString("ko-KR")}</span>
              </div>
            </div>

            <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.green.bg }}>
              <div className="flex items-center justify-between gap-2">
                <span className="ds-lab" style={{ color: TONE.green.fg }}>
                  {per === 7 ? `최근 7일 · 평균 ${weekAvg.toLocaleString("ko-KR")}걸음` : `30일 · 평균 ${avg(month).toLocaleString("ko-KR")}걸음`}
                </span>
                <Tog value={per} onChange={setPer} label="기간" options={[{ v: 7, label: "7일" }, { v: 30, label: "30일" }]} />
              </div>
              {per === 7 ? (
                <WeekBars
                  label="최근 7일 걸음"
                  days={week.map((d) => ({ label: d.label, value: d.steps, text: k(d.steps) }))}
                  color={TONE.green.solid}
                  dark={(v) => v >= weekAvg}
                  max={4600}
                />
              ) : (
                <MonthBars
                  label="30일 걸음"
                  days={month}
                  value={(d) => d.steps}
                  lo={1000}
                  hi={4600}
                  color={TONE.green.solid}
                  dark={(v) => v >= LAST_WEEK_STEPS}
                  base={LAST_WEEK_STEPS}
                  baseLabel="지난주 평균"
                />
              )}
              <div className="ds-src">
                {per === 7
                  ? `${week[0].md} – ${week[6].md} · 진한 막대 평균 이상`
                  : `진한 막대 ${LAST_WEEK_STEPS.toLocaleString("ko-KR")}걸음 이상 · 오늘은 지금까지`}
              </div>
            </div>

            <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: TONE.green.bg }}>
              <span className="ds-lab" style={{ color: TONE.green.fg }}>
                몸 신호 · 오늘
              </span>
              <div className="ds-tile3">
                <div>
                  <span>심박</span>
                  <b>{heart?.value}</b>
                  <span>평소 범위</span>
                </div>
                <div>
                  <span>혈중 산소</span>
                  <b>
                    {spo2?.value}
                    <small className="text-[13px]">%</small>
                  </b>
                  <span>평소 범위</span>
                </div>
                <div>
                  <span>스트레스</span>
                  <b style={{ color: "#2F3F5C" }}>{stress?.value}</b>
                  <span style={{ color: "#2F3F5C" }}>{stressUsual ? `평소 ${stressUsual}` : stress?.status}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {seen ? (
          <div className="ds-gcard ds-r" style={{ "--d": "160ms", background: TONE.beige.bg }}>
            <span className="ds-lab" style={{ color: TONE.beige.fg }}>
              컨시어지가 본 것 · {seen.when}
            </span>
            <p className="text-[16px] font-bold leading-[1.6]" style={{ color: "#3A3F50" }}>
              {seen.text}
            </p>
            <Link
              href="/report/visit?from=family"
              className="flex min-h-[44px] items-center self-start text-[14px] font-extrabold underline underline-offset-2"
              style={{ color: TONE.beige.fg }}
            >
              안심방문 리포트 보기
            </Link>
          </div>
        ) : (
          <Card tone="stone" shadow={false} pad={14} className="ds-r text-[14px] leading-[1.6]" style={{ "--d": "160ms", color: "#5E6270" }}>
            안심방문 때 컨시어지가 &lsquo;걸음 · 균형&rsquo;을 보고 리포트에 적습니다. 관제가 리포트를 보내면 그 메모가 여기 보입니다.
          </Card>
        )}

        {!live && <div className="ds-src ds-r text-right">{FIT3_INFO.device} · 연동 전 예시 수치 · 생활 참고용</div>}
      </FamilyLayout>
    </>
  );
}
