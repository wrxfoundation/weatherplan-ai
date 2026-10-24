import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import FamilyLayout from "../../components/FamilyLayout";
import { MonthBars, NoWatch, StatusChip, WeekBars } from "../../components/GuardianCharts";
import { Card, EvenGrid, Tog, TONE } from "../../components/ds";
import { useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { subjectLabel, trackOf } from "../../lib/tracks";
import { FIT3_INFO } from "../../lib/mock";
import { LAST_NIGHT, USUAL_SLEEP, fitMonth } from "../../lib/demo-health";

// 보호자 홈 '수면' 칸 → 수면 (2026-10-15 디자인 시안) — 어젯밤 · 잠의 흐름 · 지난 7일 / 30일.
// 데모는 워치 예시 값(lib/demo-health.js — 최근 7일은 어르신 건강 화면과 같은 FIT_WEEK), 테스트 가구는 워치가 없다고 말한다.
const FLOW_COLOR = { deep: "#3A4E96", light: "#C5CDE8", rem: "#7D95DA", wake: "#E8B54A" };

export default function SleepPage() {
  const { state } = useAppState();
  const live = !!useAuth().user?.household;
  const subj = subjectLabel(trackOf(state.onboarding?.track), state.onboarding);
  const [per, setPer] = useState(7);
  const month = fitMonth();
  const week = month.slice(-7);
  const avg = (xs) => Math.round((xs.reduce((s, d) => s + d.sleep, 0) / xs.length) * 10) / 10;
  const low = month.filter((d) => d.sleep < 6).length;
  const short = LAST_NIGHT.hours < USUAL_SLEEP - 0.5;
  return (
    <>
      <Head>
        <title>수면 — K-CARE</title>
      </Head>
      <FamilyLayout back="/family" backLabel="홈으로 돌아가기" sub={`${subj} · ${FIT3_INFO.device}`} title="수면">
        {live ? (
          <NoWatch what="수면" />
        ) : (
          <>
            <div className="ds-hero ds-r" style={{ "--d": "40ms", background: TONE.blue.bg }}>
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-extrabold" style={{ color: TONE.blue.title }}>
                  어젯밤
                </span>
                <StatusChip kind={short ? "watch" : "ok"} />
              </div>
              <div className="ds-big" style={{ color: "#26336B" }}>
                {LAST_NIGHT.hours}
                <small> 시간</small>
              </div>
              <EvenGrid labels={[`평소 ${USUAL_SLEEP}시간`, `${LAST_NIGHT.asleep} 잠듦`, `${LAST_NIGHT.wake} 일어남`]}>
                <span className="ds-gchip" style={{ color: TONE.blue.fg }}>
                  평소 {USUAL_SLEEP}시간
                </span>
                <span className="ds-gchip" style={{ color: TONE.blue.fg }}>
                  {LAST_NIGHT.asleep} 잠듦
                </span>
                <span className="ds-gchip" style={{ color: TONE.blue.fg }}>
                  {LAST_NIGHT.wake} 일어남
                </span>
              </EvenGrid>
            </div>

            <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: TONE.blue.bg }}>
              <div className="flex items-center justify-between">
                <span className="ds-lab" style={{ color: TONE.blue.fg }}>
                  잠의 흐름
                </span>
                {/* 깬 횟수는 위험 신호가 아니다 — 시안의 빨강 대신 갈색 */}
                <span className="text-[14px] font-extrabold" style={{ color: "#9A5B1E" }}>
                  밤에 {LAST_NIGHT.wakes}번 깸
                </span>
              </div>
              <div className="ds-seg" role="img" aria-label={`깊은 잠 ${LAST_NIGHT.sums.deep}시간 · 얕은 잠 ${LAST_NIGHT.sums.light}시간 · 렘 ${LAST_NIGHT.sums.rem}시간 · 밤에 ${LAST_NIGHT.wakes}번 깸`}>
                {LAST_NIGHT.flow.map(([k, m], i) => (
                  <i key={i} style={{ flex: m, background: FLOW_COLOR[k] }} />
                ))}
              </div>
              <div className="flex justify-between text-[12px] font-bold" style={{ color: "#5E6270" }}>
                <span>{LAST_NIGHT.asleep}</span>
                <span>2시</span>
                <span>4시</span>
                <span>{LAST_NIGHT.wake}</span>
              </div>
              <div className="ds-leg">
                <span>
                  <i style={{ background: FLOW_COLOR.deep }} />
                  깊은 잠 {LAST_NIGHT.sums.deep}
                </span>
                <span>
                  <i style={{ background: FLOW_COLOR.light }} />
                  얕은 잠 {LAST_NIGHT.sums.light}
                </span>
                <span>
                  <i style={{ background: FLOW_COLOR.rem }} />
                  렘 {LAST_NIGHT.sums.rem}
                </span>
                <span>
                  <i style={{ background: FLOW_COLOR.wake }} />깸
                </span>
              </div>
            </div>

            <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: TONE.blue.bg }}>
              <div className="flex items-center justify-between gap-2">
                <span className="ds-lab" style={{ color: TONE.blue.fg }}>
                  {per === 7 ? `최근 7일 · 평균 ${avg(week)}시간` : `30일 · 평균 ${avg(month)}시간`}
                </span>
                <Tog value={per} onChange={setPer} label="기간" options={[{ v: 7, label: "7일" }, { v: 30, label: "30일" }]} />
              </div>
              {per === 7 ? (
                <WeekBars label="최근 7일 수면" days={week.map((d) => ({ label: d.label, value: d.sleep, text: d.sleep.toFixed(1) }))} color={TONE.blue.title} dark={(v) => v < 6} max={8} />
              ) : (
                <MonthBars label="30일 수면" days={month} value={(d) => d.sleep} lo={3} hi={7.8} color={TONE.blue.title} dark={(v) => v < 6} base={USUAL_SLEEP} baseLabel={`평소 ${USUAL_SLEEP}`} />
              )}
              <div className="ds-src">
                {per === 7 ? `${week[0].md} – ${week[6].md} · 진한 막대 6시간 미만` : `6시간 미만 ${low}일 · 진한 막대`}
              </div>
            </div>

            <div className="ds-r flex items-center justify-between gap-2" style={{ "--d": "160ms" }}>
              <span className="ds-src">{FIT3_INFO.device} · 연동 전 예시 수치 · 생활 참고용</span>
              <Link href="/family/watch" className="flex min-h-[44px] items-center text-[14px] font-extrabold underline underline-offset-2" style={{ color: TONE.blue.fg }}>
                워치 지표 전체
              </Link>
            </div>
            <Card tone="stone" shadow={false} pad={14} className="ds-r text-[14px] leading-[1.6]" style={{ "--d": "180ms", color: "#5E6270" }}>
              숫자를 읽고 판단하는 일은 담당 컨시어지가 함께 합니다. 잠이 며칠째 짧으면 방문 때 여쭤보고 리포트에 적어 드려요.
            </Card>
          </>
        )}
      </FamilyLayout>
    </>
  );
}
