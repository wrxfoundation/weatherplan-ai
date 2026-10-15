import { FIT3_INFO, FIT_WEEK, VITALS } from "../lib/mock";
import { MED_STREAK } from "../lib/meds";
import { Pill, SheetTitle, TONE } from "./ds";

// 어르신 건강 '어제와 비교' → 지난 기록 자세히 보기 (2026-09-04 시트 건강 1번 "간단 레포트 같은 효과").
// 2026-10-15 시안 — 시트 한 장: 살펴볼 것(잠 · 스트레스 · 약 챙겨 드신 비율) → 평소와 같아요(맥박 · 혈중 산소 · 걸음).
// 한 줄에 숫자 하나 + 평소 값 + 짧은 판정. 그림을 읽지 못하셔도 숫자와 말로 안다.
// 숫자는 lib/mock.js VITALS · FIT_WEEK 그대로 — 화면 두 곳이 다른 값을 말하면 안 된다.
// 빨강은 SOS 전용 — 살펴볼 것은 금색, 평소 범위는 초록이다 (시안의 산호색 배지는 쓰지 않는다).

function Row({ name, value, unit, sub, tag, watch }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5" style={{ boxShadow: "0 3px 0 #E6E2DA" }}>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-extrabold" style={{ color: "#4A4F5E" }}>
          {name}
        </span>
        <span className="ds-num block text-[24px] font-black">
          {value}
          {unit && <span className="text-[14px]"> {unit}</span>}
        </span>
        <span className="block text-[14px]" style={{ color: "#5E6270" }}>
          {sub}
        </span>
      </span>
      <Pill bg={watch ? TONE.gold.bg : TONE.green.bg} fg={watch ? TONE.gold.fg : "#2A4D33"}>
        {tag}
      </Pill>
    </div>
  );
}

export default function ElderHealthReport() {
  const by = (n) => VITALS.find((v) => v.name === n);
  const sleep = by("수면");
  const stress = by("스트레스");
  const meds = by("복약 준수율");
  const hr = by("심박수");
  const spo2 = by("혈중 산소");
  const steps = by("걸음 수");
  // 걸음 목표 — VITALS "목표의 62%" 와 3,140 걸음에서 역산하면 5,000 이다
  const GOAL = 5000;
  const todaySteps = FIT_WEEK[FIT_WEEK.length - 1].steps;
  const week = FIT_WEEK.slice(0, -1);
  const sleepAvg = (week.reduce((s, d) => s + d.sleep, 0) / week.length).toFixed(1);
  const missed = MED_STREAK.week.filter((d) => !d.done).length;

  return (
    <>
      <SheetTitle sub={`워치 · 오늘 ${FIT3_INFO.lastSync}에 맞췄어요`} title="살펴볼 것 3가지" />
      <Row name="잠" value={sleep.value} unit="시간" sub={`지난 6일 평균 ${sleepAvg}시간`} tag="평소보다 짧아요" watch />
      <Row name="스트레스" value={stress.value} sub="평소 평균 44" tag="조금 높아요" watch />
      <Row name="약 챙겨 드신 비율" value={meds.value} unit="%" sub={`지난 7일 · ${missed}번 놓침`} tag={`${missed}번 놓침`} watch />
      <div className="mt-1 text-[16px] font-extrabold" style={{ color: TONE.green.fg }}>
        평소와 같아요
      </div>
      <Row name="맥박" value={hr.value} unit="bpm" sub="보통 60~100" tag="정상" />
      <Row name="혈중 산소" value={spo2.value} unit="%" sub="보통 95~100" tag="정상" />
      <Row name="걸음" value={steps.value} unit="걸음" sub={`목표 ${GOAL.toLocaleString()}걸음의 ${Math.round((todaySteps / GOAL) * 100)}%`} tag={`목표까지 ${(GOAL - todaySteps).toLocaleString()}`} />
      <p className="text-[15px]" style={{ color: "#5E6270" }}>
        워치가 잰 그대로입니다 · {FIT3_INFO.cycle}
      </p>
    </>
  );
}
