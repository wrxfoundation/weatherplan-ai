import Icon from "./icons";
import { FIT3_INFO, FIT_WEEK, VITALS } from "../lib/mock";
import { MED_STREAK } from "../lib/meds";

// 어르신 건강 탭 '오늘 몸 상태' 자세히 보기 — 간단 리포트 (2026-09-04 시트 건강 1번
// "펼쳐지는 내용은 좋은데 시각적으로 간단 레포트 같은 효과가 있었으면").
// 첨부 시안(어머니 건강 신호)의 구성을 어르신 규격으로 옮겼다:
//   살펴볼 것 → 평소 범위 순서 · 지표마다 숫자 하나 + 그림 하나.
// 숫자는 lib/mock.js VITALS · FIT_WEEK 그대로 — 화면 두 곳이 다른 값을 말하면 안 된다.
// 그림만 보고 못 읽는 분을 위해 막대·게이지마다 aria-label 에 숫자를 그대로 쓴다.
// 빨강은 SOS 전용 — 관찰 항목은 앰버, 평소 범위는 초록이다.

const AMBER = "#8A5D12";
const GREEN = "#1E7A5A";
const NAVY = "#0A1F3C";

const TONE = {
  caution: { fg: AMBER, bg: "rgba(138,93,18,.12)" },
  ok: { fg: GREEN, bg: "rgba(30,122,90,.12)" },
  neutral: { fg: GREEN, bg: "rgba(30,122,90,.12)" },
};

function Pill({ tone, children }) {
  const t = TONE[tone] || TONE.neutral;
  return (
    <span className="rounded-full px-3 py-1 text-[16px] font-bold" style={{ color: t.fg, background: t.bg }}>
      {children}
    </span>
  );
}

function Panel({ title, tone, badge, children }) {
  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "#FFFFFF", boxShadow: "inset 0 0 0 1px rgba(10,31,60,.08)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[19px] font-bold text-navy">{title}</span>
        {badge && <Pill tone={tone}>{badge}</Pill>}
      </div>
      {children}
    </div>
  );
}

// 큰 숫자 + 단위
function Big({ value, unit, color = NAVY }) {
  return (
    <div className="mt-1.5 flex items-baseline gap-1">
      <span className="font-num text-[34px] font-bold leading-none" style={{ color }}>{value}</span>
      {unit && <span className="text-[18px] font-bold text-muted">{unit}</span>}
    </div>
  );
}

// 정상 범위 막대 — 눈금 위에 정상 구간을 초록으로 칠하고 오늘 값을 점으로 찍는다
function RangeBar({ min, max, okMin, okMax, value, label }) {
  const pct = (v) => `${Math.round(((v - min) / (max - min)) * 100)}%`;
  return (
    <div className="mt-3" role="img" aria-label={`${label} ${value} · 정상 ${okMin}~${okMax}`}>
      <div className="relative h-[10px] rounded-full" style={{ background: "rgba(10,31,60,.08)" }}>
        <div
          className="absolute top-0 h-full rounded-full"
          style={{ left: pct(okMin), width: `calc(${pct(okMax)} - ${pct(okMin)})`, background: "rgba(30,122,90,.35)" }}
        />
        <span
          aria-hidden
          className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white"
          style={{ left: pct(value), borderColor: GREEN }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-num text-[15px] font-bold text-muted">
        <span>{min}</span>
        <span style={{ color: GREEN }}>정상 {okMin}–{okMax}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// 반원 게이지 — 스트레스. 0~100 을 180도에 편다.
function Gauge({ value, label }) {
  const r = 46;
  const c = Math.PI * r; // 반원 둘레
  const on = (value / 100) * c;
  return (
    <div className="mt-2 flex items-center gap-4" role="img" aria-label={`${label} ${value}`}>
      <svg width="120" height="66" viewBox="0 0 120 66" aria-hidden>
        <path d="M14 60a46 46 0 0 1 92 0" fill="none" stroke="rgba(10,31,60,.1)" strokeWidth="11" strokeLinecap="round" />
        <path
          d="M14 60a46 46 0 0 1 92 0"
          fill="none"
          stroke={AMBER}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${on} ${c}`}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="30" fontWeight="700" fill={NAVY} fontFamily="Montserrat, Noto Sans KR, sans-serif">
          {value}
        </text>
      </svg>
    </div>
  );
}

// 도넛 — 걸음 목표 달성률
function Donut({ pct }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden>
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(10,31,60,.08)" strokeWidth="11" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={GREEN}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="48" textAnchor="middle" fontSize="19" fontWeight="700" fill={NAVY} fontFamily="Montserrat, Noto Sans KR, sans-serif">
        {pct}%
      </text>
    </svg>
  );
}

const DAY = ["일", "월", "화", "수", "목", "금", "토"];

export default function ElderHealthReport() {
  const by = (n) => VITALS.find((v) => v.name === n);
  const sleep = by("수면");
  const stress = by("스트레스");
  const meds = by("복약 준수율");
  const hr = by("심박수");
  const spo2 = by("혈중 산소");
  const steps = by("걸음 수");

  const watchOut = [sleep, stress, meds]; // 살펴볼 것 — VITALS 의 caution
  const usual = [hr, spo2, steps];

  // 걸음 목표 — VITALS "목표의 62%" 와 3,140 걸음에서 역산하면 5,000 이다
  const GOAL = 5000;
  const todaySteps = FIT_WEEK[FIT_WEEK.length - 1].steps;
  const stepPct = Math.round((todaySteps / GOAL) * 100);
  const hitDays = FIT_WEEK.filter((d) => d.steps >= GOAL).length;
  const last3 = FIT_WEEK.slice(-3);
  const maxSleep = Math.max(...last3.map((d) => d.sleep));
  const maxSteps = Math.max(GOAL, ...FIT_WEEK.map((d) => d.steps));
  const dayLabel = (ago) => (ago === 0 ? "오늘" : DAY[new Date(Date.now() - ago * 86400000).getDay()]);

  const medWeek = [...MED_STREAK.week.map((d) => ({ ...d, state: d.done ? "done" : "miss" })), { label: "오늘", state: "wait" }];

  return (
    <div className="mt-2.5 space-y-3">
      {/* 요약 — 시안의 남색 머리 카드 */}
      <div className="rounded-[16px] p-4 text-white" style={{ background: NAVY }}>
        <div className="text-[15px] font-bold text-gold-soft">워치 · 오늘 {FIT3_INFO.lastSync} 동기화</div>
        <div className="mt-1 text-[24px] font-black leading-[1.3]">오늘 살펴볼 것 {watchOut.length}가지</div>
        <p className="mt-1.5 text-[18px] leading-[1.5] text-white/[.85]">
          수면 감소 · 스트레스 상승 · 복약 미이행 2회. 나머지 {usual.length}개는 평소 범위입니다.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full px-3 py-1 text-[16px] font-bold" style={{ background: "rgba(255,255,255,.14)" }}>살펴볼 것 {watchOut.length}</span>
          <span className="rounded-full px-3 py-1 text-[16px] font-bold" style={{ background: "rgba(74,222,128,.22)", color: "#8FE3C0" }}>평소 범위 {usual.length}</span>
        </div>
      </div>

      <div className="text-[18px] font-bold" style={{ color: AMBER }}>살펴볼 것 {watchOut.length}</div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* 수면 — 최근 3일 막대 */}
        <Panel title="수면" tone="caution" badge="3일 하락">
          <Big value={sleep.value} unit="시간" />
          <div className="mt-3 flex items-end gap-1.5" role="img" aria-label={`최근 3일 수면 ${last3.map((d) => `${d.sleep}시간`).join(", ")}`}>
            {last3.map((d) => (
              <div key={d.ago} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-[6px]"
                  style={{ height: Math.max(12, Math.round((d.sleep / maxSleep) * 56)), background: d.ago === 0 ? AMBER : "rgba(10,31,60,.12)" }}
                />
                <span className={`font-num text-[15px] font-bold ${d.ago === 0 ? "text-navy" : "text-muted"}`}>{d.sleep}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 text-[15px] text-muted">최근 3일</div>
        </Panel>

        {/* 스트레스 — 반원 게이지 */}
        <Panel title="스트레스" tone="caution" badge="다소 높음">
          <Gauge value={Number(stress.value)} label="스트레스" />
          <div className="text-[15px] text-muted">평소 평균 44</div>
        </Panel>
      </div>

      {/* 복약 준수율 — 주간 스트립 */}
      <Panel title="복약 준수율" tone="caution" badge="미이행 2회">
        <div className="flex items-baseline gap-2">
          <Big value={meds.value} unit="%" />
          <span className="text-[16px] text-muted">지난 7일 · 오늘 저녁 대기</span>
        </div>
        <div className="mt-3 flex gap-1.5" role="img" aria-label={`이번 주 복약: ${medWeek.map((d) => `${d.label} ${d.state === "done" ? "복용" : d.state === "miss" ? "미이행" : "대기"}`).join(", ")}`}>
          {medWeek.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span
                aria-hidden
                className="h-[14px] w-full rounded-full"
                style={{
                  background: d.state === "done" ? GREEN : d.state === "miss" ? AMBER : "rgba(10,31,60,.1)",
                  border: d.state === "wait" ? "2px dashed rgba(10,31,60,.25)" : "none",
                }}
              />
              <span className={`text-[15px] font-bold ${d.state === "miss" ? "text-amber" : d.state === "wait" ? "text-navy" : "text-muted"}`}>{d.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[15px] font-bold">
          <span className="flex items-center gap-1.5 text-muted"><span aria-hidden className="h-[10px] w-[10px] rounded-full" style={{ background: GREEN }} />복용</span>
          <span className="flex items-center gap-1.5 text-muted"><span aria-hidden className="h-[10px] w-[10px] rounded-full" style={{ background: AMBER }} />미이행</span>
          <span className="flex items-center gap-1.5 text-muted"><span aria-hidden className="h-[10px] w-[10px] rounded-full" style={{ border: "2px dashed rgba(10,31,60,.3)" }} />대기</span>
        </div>
      </Panel>

      <div className="text-[18px] font-bold" style={{ color: GREEN }}>평소 범위 {usual.length}</div>

      <div className="grid grid-cols-2 gap-2.5">
        <Panel title="심박수" tone="ok" badge="정상">
          <Big value={hr.value} unit="bpm" color={GREEN} />
          <RangeBar min={40} max={120} okMin={60} okMax={100} value={Number(hr.value)} label="심박수" />
        </Panel>
        <Panel title="혈중 산소" tone="ok" badge="정상">
          <Big value={spo2.value} unit="%" color={GREEN} />
          <RangeBar min={88} max={100} okMin={95} okMax={100} value={Number(spo2.value)} label="혈중 산소" />
        </Panel>
      </div>

      {/* 걸음 — 도넛 + 7일 막대 */}
      <Panel title="걸음 수" tone="ok" badge={`목표의 ${stepPct}%`}>
        <div className="mt-1 flex items-center gap-4">
          <Donut pct={stepPct} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-num text-[30px] font-bold leading-none text-navy">{steps.value}</span>
              <span className="text-[18px] font-bold text-muted">걸음</span>
            </div>
            <div className="mt-1 text-[16px] text-muted">목표까지 {(GOAL - todaySteps).toLocaleString()}걸음</div>
          </div>
        </div>
        <div className="mt-4 text-[17px] font-bold text-navy">지난 7일 걸음 (천)</div>
        <div className="relative mt-2">
          {/* 목표선 */}
          <div
            aria-hidden
            className="absolute left-0 right-0 border-t-2 border-dashed"
            style={{ top: `${Math.round((1 - GOAL / maxSteps) * 72)}px`, borderColor: "rgba(10,31,60,.3)" }}
          >
            <span className="absolute right-0 -top-[20px] text-[15px] font-bold text-muted">목표 {GOAL / 1000}.0</span>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 72 }} role="img" aria-label={`지난 7일 걸음: ${FIT_WEEK.map((d) => d.steps.toLocaleString()).join(", ")}`}>
            {FIT_WEEK.map((d) => (
              <div key={d.ago} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-[6px]"
                  style={{ height: Math.max(8, Math.round((d.steps / maxSteps) * 72)), background: d.steps < 3000 ? AMBER : GREEN }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {FIT_WEEK.map((d) => (
            <div key={d.ago} className="flex flex-1 flex-col items-center">
              <span className={`text-[15px] font-bold ${d.ago === 0 ? "text-navy" : "text-muted"}`}>{dayLabel(d.ago)}</span>
              <span className={`font-num text-[15px] font-bold ${d.steps < 3000 ? "text-amber" : "text-muted"}`}>{Math.round(d.steps / 100) / 10}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[15px] text-muted">
          <span aria-hidden className="inline-block w-[22px] border-t-2 border-dashed" style={{ borderColor: "rgba(10,31,60,.3)" }} />
          목표 {GOAL.toLocaleString()}걸음 · 이번 주 달성 {hitDays}일
        </div>
      </Panel>

      <p className="flex items-center gap-1.5 text-[16px] text-muted">
        <Icon name="watch" size={16} strokeWidth={2} />
        워치가 잰 그대로입니다 · {FIT3_INFO.cycle}
      </p>
    </div>
  );
}
