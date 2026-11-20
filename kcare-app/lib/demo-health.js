// 데모 가구(김순자)의 지난 30일 — 워치(수면 · 걸음)와 복약 기록 (2026-10-15 디자인 시안의 보호자 '수면 · 활동 · 복약' 화면).
// 연동 전 예시 값이다. 화면은 '예시'라고 밝힌다 — 테스트 가구 · 관제 센터 공간에서는 쓰지 않는다 (워치가 없다).
//
// 숫자가 화면마다 갈리지 않게: 마지막 7일은 lib/mock.js FIT_WEEK(어르신 건강 · 보호자 홈과 같은 값) 그대로이고,
// 그 앞 23일만 여기서 더한다. 오늘 복약은 상태(state.elder.medSlots — 어르신이 누른 것)에서 읽는다.
import { FIT_WEEK, WEEKLY } from "./mock";
import { MED_STREAK } from "./meds";

// 하루 걸음 목표 — 화면들이 이미 쓰던 '목표의 62%'(lib/mock.js VITALS · FIT3_METRICS, 3,140걸음)의 기준값.
// 퍼센트는 버림으로 센다 (3,140 / 5,000 = 62.8 → 62%) — 다른 화면과 같은 숫자를 말하도록.
export const STEP_GOAL = 5000;
export const stepGoalPct = (steps) => Math.floor((steps / STEP_GOAL) * 100);
// 지난주 하루 평균 걸음 — 보호자 홈 '활동' 칸의 '▼ 8% 지난주보다'와 같은 출처 (WEEKLY '지난주 3,410')
export const LAST_WEEK_STEPS = Number(String(WEEKLY.find((w) => w.name === "활동")?.last || "").replace(/\D/g, "")) || 0;

const DAY = ["일", "월", "화", "수", "목", "금", "토"];

// 30일 중 앞 23일 (최근 7일은 FIT_WEEK)
const SLEEP_23 = [7.0, 6.8, 7.1, 6.9, 6.6, 7.2, 7.0, 6.7, 6.9, 7.1, 6.8, 7.0, 6.6, 7.0, 6.9, 7.2, 6.8, 6.7, 7.0, 6.9, 6.7, 6.6, 6.4];
const STEPS_23 = [3610, 3390, 3700, 4030, 3260, 3290, 4250, 3880, 3320, 3660, 3940, 3270, 3840, 3470, 3240, 3310, 3750, 3730, 3280, 3500, 3310, 3600, 3900];
// 복약 — 하루 [아침, 점심, 저녁] 1 먹음 · 0 놓침 (앞 23일). 최근 6일은 MED_STREAK.week 에서 온다.
// 지난 7일(어제까지) 19/21 · 그 전 7일 17/21 — 방문 리포트 주간 요약(WEEKLY '복약 19/21 · 지난주 17/21')과 같은 수
const MED_23 = [
  [1, 1, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 0], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 0, 1],
  [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 1, 1],
];

const dayOf = (now, ago) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ago);
  return d;
};
const mdOf = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

// 지난 30일 (오늘 포함) — { date, md, dow, label, sleep, steps }
export function fitMonth(now = new Date()) {
  return Array.from({ length: 30 }, (_, i) => {
    const ago = 29 - i;
    const d = dayOf(now, ago);
    const w = ago < 7 ? FIT_WEEK.find((x) => x.ago === ago) : null;
    return {
      date: d,
      md: mdOf(d),
      dow: d.getDay(),
      label: ago === 0 ? "오늘" : DAY[d.getDay()],
      sleep: w ? w.sleep : SLEEP_23[i],
      steps: w ? w.steps : STEPS_23[i],
    };
  });
}

// 평소 수면 — 최근 7일을 뺀 앞 23일 평균 (지난주 변화를 '평소'와 견준다)
export const USUAL_SLEEP = Math.round((SLEEP_23.reduce((s, v) => s + v, 0) / SLEEP_23.length) * 10) / 10;

// 어젯밤 (FIT_WEEK 오늘 값 · 깊은 잠 1.1h 는 FIT3_METRICS '깊은잠 1.1h' 와 같다)
// 잠의 흐름 — [종류, 분] 순서대로. deep 깊은 잠 · light 얕은 잠 · rem 렘 · wake 깸
export const LAST_NIGHT = {
  hours: FIT_WEEK[FIT_WEEK.length - 1].sleep,
  asleep: "0:10",
  wake: "6:40",
  flow: [
    ["light", 40], ["deep", 30], ["light", 30], ["wake", 6], ["rem", 24], ["light", 46], ["wake", 6],
    ["deep", 36], ["light", 50], ["wake", 6], ["rem", 48], ["light", 68],
  ],
  // 합계 — 깊은 잠 1.1 · 렘 1.2 · 얕은 잠 3.9 = 6.2시간, 깸 3번
  sums: { deep: 1.1, light: 3.9, rem: 1.2 },
  wakes: 3,
};

// 지난 30일 복약 — { date, md, dow, label, slots: [1|0|-1 …] } (-1 = 오늘 아직 안 드신 것)
// plan 은 healthOf(state).meds — 시간대 수가 3개가 아니면 예시 기록을 그 수에 맞춘다.
export function medMonth(plan, taken = {}, now = new Date()) {
  const n = Math.max(1, plan.length);
  const fit = (row) => Array.from({ length: n }, (_, k) => (k < row.length ? row[k] : 1));
  const week = MED_STREAK.week; // 최근 6일 — 하루 단위 다 드심 / 놓침
  return Array.from({ length: 30 }, (_, i) => {
    const ago = 29 - i;
    const d = dayOf(now, ago);
    let slots;
    if (ago === 0) slots = plan.map((s) => (taken[s.slot] ? 1 : -1));
    else if (ago <= week.length) slots = week[week.length - ago].done ? fit([1, 1, 1]) : fit([1, 0, 0]);
    else slots = fit(MED_23[i] || [1, 1, 1]);
    return { date: d, md: mdOf(d), dow: d.getDay(), label: ago === 0 ? "오늘" : DAY[d.getDay()], slots };
  });
}

// 예시 연속 기록(MED_STREAK.week · 어제까지 6일)에 실제 요일을 붙인다 — 전에는 '월~토'로 박혀 있어서
// 어르신 '지난 7일'과 보호자 '복약 미션'이 서로 다른 요일에 '놓침'을 찍을 수 있었다. medMonth 와 같은 순서다.
export function medStreakWeek(now = new Date()) {
  const n = MED_STREAK.week.length;
  return MED_STREAK.week.map((w, i) => ({ ...w, label: DAY[dayOf(now, n - i).getDay()] }));
}

// 지난 7일 = 어제까지 7일 (오늘은 아직 끝나지 않았다) · 그 전 7일
export const pastWeek = (days) => days.slice(-8, -1);
export const weekBefore = (days) => days.slice(-15, -8);

// 기간 합계 — 먹은 수 / 정해진 수 (오늘 아직 안 된 것은 정해진 수에서 뺀다)
export function medTally(days) {
  let taken = 0;
  let total = 0;
  days.forEach((d) =>
    d.slots.forEach((v) => {
      if (v === -1) return;
      total += 1;
      if (v === 1) taken += 1;
    })
  );
  return { taken, total, pct: total ? Math.round((taken / total) * 100) : 0 };
}
