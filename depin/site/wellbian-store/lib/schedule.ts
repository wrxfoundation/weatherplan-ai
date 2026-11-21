/* 제네시스 런치 일정 — 정본 (8/29 서우 확정)

   화면 어디에서도 날짜를 다시 적지 않는다. D-day 배지, 카운트다운, 일정표, 상태 분기가
   전부 여기 하나를 본다. 이전에는 Landing.tsx 에 dPre = dDaysTo(2026,9,5) 와
   dSaleBadge = "D-17" 이 따로 박혀 있어 서로 다른 날을 가리켰고, 배지는 시간이 지나도
   변하지 않았다.

   시각이 중요하다. 다섯 마일스톤이 전부 정오·18시로 지정돼 있어서, 날짜 단위로만 세면
   당일 오전에 "D-0"과 "12:00에 시작합니다"가 반나절 동안 같이 떠 있게 된다.
   그래서 ISO 문자열에 +09:00 을 박아 절대 시각으로 다룬다 — 보는 사람이 어느 시간대에
   있든 같은 순간을 가리킨다.

   일반 구매창(9/15 18:00)은 "예정"이다. 예매 물량이 먼저 소진되면 그보다 일찍 열린다
   (8/29 서우 확정). 그래서 이 값은 카운트다운의 기준으로만 쓰고, 문구에서는 반드시
   "예정 · 예매 물량 소진 시 조기 오픈"을 함께 말한다. */

export type LaunchPhase =
  | "before_reserve"   // 사전예매 오픈 전 — 지금
  | "reserve_open"     // 사전예매 접수 중
  | "reserve_closed"   // 접수 마감 ~ 우선 구매창 대기
  | "priority_window"  // 우선 구매창 (사전예매자)
  | "general_window"   // 일반 구매창
  | "closed";          // 판매 종료

export type MilestoneKey = "reserveOpen" | "reserveClose" | "priorityOpen" | "generalOpen" | "saleEnd";

/* KST 고정. 뒤 단계가 앞 단계보다 늦다는 전제로 phaseAt() 이 순서대로 훑는다. */
export const MILESTONES: { key: MilestoneKey; at: string; phaseAfter: LaunchPhase }[] = [
  { key: "reserveOpen",  at: "2026-09-07T12:00:00+09:00", phaseAfter: "reserve_open" },
  { key: "reserveClose", at: "2026-09-14T12:00:00+09:00", phaseAfter: "reserve_closed" },
  { key: "priorityOpen", at: "2026-09-15T12:00:00+09:00", phaseAfter: "priority_window" },
  { key: "generalOpen",  at: "2026-09-15T18:00:00+09:00", phaseAfter: "general_window" },
  { key: "saleEnd",      at: "2026-09-16T12:00:00+09:00", phaseAfter: "closed" },
];

export const at = (key: MilestoneKey) => {
  const m = MILESTONES.find((x) => x.key === key);
  return new Date(m ? m.at : MILESTONES[0].at).getTime();
};

/* 우선 구매창 개시부터 판매 종료까지 = 총 24시간. 원문의 "24H ONLY" 가 가리키는 구간이다. */
export const SALE_WINDOW_HOURS = Math.round((at("saleEnd") - at("priorityOpen")) / 3600000);

export const phaseAt = (now: number): LaunchPhase => {
  let p: LaunchPhase = "before_reserve";
  for (const m of MILESTONES) {
    if (now >= new Date(m.at).getTime()) p = m.phaseAfter;
    else break;
  }
  return p;
};

/* 다음 마일스톤. 판매가 끝났으면 null — 카운트다운을 걸 대상이 없다. */
export const nextMilestone = (now: number) =>
  MILESTONES.find((m) => new Date(m.at).getTime() > now) ?? null;

/* D-n 배지. 남은 시간을 KST 달력 날짜 차이로 센다 — 오늘 안이면 D-0.
   "12:00에 시작"과 어긋나지 않게, 시각까지 지난 뒤에는 다음 마일스톤을 가리킨다. */
export const dDayTo = (targetIso: string, now: number) => {
  const kstDay = (t: number) => Math.floor((t + 9 * 3600000) / 86400000);
  return Math.max(0, kstDay(new Date(targetIso).getTime()) - kstDay(now));
};

export const remain = (targetIso: string, now: number) => {
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    ms,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
};

/* 내부 시연용 상태 강제. ?phase=priority_window 처럼 붙이면 그 단계 화면을 볼 수 있다.
   값이 없거나 모르는 값이면 실제 시각으로 계산한다. */
const PHASES: LaunchPhase[] = [
  "before_reserve", "reserve_open", "reserve_closed", "priority_window", "general_window", "closed",
];
export const phaseFromParam = (param: string | null, now: number): LaunchPhase =>
  (param && (PHASES as string[]).includes(param) ? (param as LaunchPhase) : phaseAt(now));

/* 구매창이 열려 있는가 — 우선창·일반창 둘 다 구매 가능 단계다.
   다만 우선창에서는 사전예매자만 살 수 있으므로 화면이 그 구분을 반드시 말해야 한다. */
export const isBuyable = (p: LaunchPhase) => p === "priority_window" || p === "general_window";
export const isReserving = (p: LaunchPhase) => p === "reserve_open";
