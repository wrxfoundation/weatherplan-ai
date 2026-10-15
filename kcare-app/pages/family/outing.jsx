import Head from "next/head";
import FamilyLayout from "../../components/FamilyLayout";
import { StatusChip } from "../../components/GuardianCharts";
import { TONE } from "../../components/ds";
import { eventsFor, useAppState } from "../../lib/state";
import { useAuth } from "../../lib/auth";
import { subjectLabel, trackOf } from "../../lib/tracks";
import { ELDER_NOW, FIT3_INFO, OUTING, VITALS } from "../../lib/mock";
import { LAST_NIGHT, USUAL_SLEEP } from "../../lib/demo-health";

// 보호자 홈 '외출 컨디션' 칸 → 외출 컨디션 (2026-10-15 디자인 시안) — 점수 게이지 · 점수에 들어간 것 · 나가기 좋은 시간 · 챙길 것.
// 점수는 서버가 한 번 계산한 값(lib/mock.js OUTING — 가는 길 두 곳 중 낮은 점수)을 그대로 쓴다. 화면이 다시 계산하지 않는다.
// 날씨는 연동 전 예시다 — 화면 아래에 '예시'를 밝힌다. 잠 · 걸음 줄은 워치 값이라 테스트 가구에서는 뺀다.
// 주의 색은 갈색 — 빨강은 SOS · 낙상 전용이다.
const BROWN = { bg: "#F0EAE4", fg: "#6E5A4A", solid: "#9C8371", deep: "#5A4636" };
const HOUR_COLOR = { good: TONE.green.solid, fair: "#D9CBBE", caution: BROWN.solid };
const HOUR_LABEL = { good: "좋음", fair: "보통", caution: "주의" };
const GRADE_KIND = { 좋음: "ok", 보통: "watch", 주의: "caution" };

// 반원 게이지 — 0점 왼쪽 끝, 100점 오른쪽 끝
function Gauge({ score }) {
  const t = Math.PI * (1 - Math.max(0, Math.min(100, score)) / 100);
  const x = (100 + 80 * Math.cos(t)).toFixed(1);
  const y = (100 - 80 * Math.sin(t)).toFixed(1);
  return (
    <svg role="img" aria-label={`외출 컨디션 ${score}점 (100점 만점)`} width="200" height="112" viewBox="0 0 200 112">
      <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
      <path className="ds-arc" d={`M20 100A80 80 0 0 1 ${x} ${y}`} fill="none" stroke={BROWN.solid} strokeWidth="18" strokeLinecap="round" pathLength="100" />
      <text x="100" y="92" textAnchor="middle" fontSize="40" fontWeight="900" fill={BROWN.deep}>
        {score}
      </text>
      <text x="100" y="110" textAnchor="middle" fontSize="13" fontWeight="800" fill={BROWN.fg}>
        / 100
      </text>
    </svg>
  );
}

export default function OutingPage() {
  const { state } = useAppState();
  const live = !!useAuth().user?.household;
  const subj = subjectLabel(trackOf(state.onboarding?.track), state.onboarding);
  const low = OUTING.legs.reduce((a, b) => (b.score < a.score ? b : a));
  const dust = (low.detail.match(/미세먼지\s+(\S+)/) || [])[1] || "";
  const uv = ELDER_NOW.factors.find((f) => f.label === "자외선")?.value || "";
  const steps = VITALS.find((v) => v.name === "걸음 수");
  const sleepShort = LAST_NIGHT.hours < USUAL_SLEEP - 0.5;

  // 점수에 들어간 것 — 날씨 셋은 예시 날씨에서, 잠 · 걸음은 워치(데모만)
  const priority = state.priority?.factors || [];
  const rows = [
    { k: "미세먼지", v: dust, minus: true },
    { k: "자외선", v: uv, minus: true },
    { k: "기온", v: `${ELDER_NOW.tempLabel} · ${ELDER_NOW.feelsLabel.split("·")[0].trim()}`, minus: true },
    ...(live
      ? []
      : [
          { k: "어젯밤 잠", v: `${LAST_NIGHT.hours}시간`, minus: sleepShort },
          { k: "오늘 걸음", v: steps?.level === "caution" ? "평소보다 적음" : "평소 범위", minus: steps?.level === "caution" },
        ]),
  ];

  // 오늘 병원 일정 — 시간 칸에 테두리로 표시한다 (일정이 없으면 표시 없음)
  const isToday = (at) => new Date(at).toDateString() === new Date().toDateString();
  const hosp = eventsFor(state.events, "guardian")
    .filter((e) => e.approval !== "rejected" && isToday(e.at) && ["hospital", "checkup", "nextAppt"].includes(e.kind))
    .sort((a, b) => a.at - b.at)[0];
  const hospHour = hosp ? new Date(hosp.at).getHours() : null;
  const hospHm = hosp ? new Date(hosp.at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";

  return (
    <>
      <Head>
        <title>외출 컨디션 — K-CARE</title>
      </Head>
      <FamilyLayout
        back="/family"
        backLabel="홈으로 돌아가기"
        sub={live ? "오늘 · 예시 날씨" : `오늘 · ${OUTING.legs[0].place.replace(/\s*자택$/, "")}`}
        title="외출 컨디션"
      >
        <div className="ds-hero ds-r items-center" style={{ "--d": "40ms", background: BROWN.bg }}>
          <div className="flex w-full items-center justify-between">
            <span className="text-[16px] font-extrabold" style={{ color: BROWN.fg }}>
              오늘 바깥
            </span>
            <StatusChip kind={GRADE_KIND[low.grade] || "watch"} label={low.grade} />
          </div>
          <Gauge score={low.score} />
          <div className="flex flex-wrap justify-center gap-2">
            <span className="ds-gchip" style={{ color: BROWN.fg }}>
              {ELDER_NOW.tempLabel}
            </span>
            {dust && (
              <span className="ds-gchip" style={{ color: BROWN.fg }}>
                미세먼지 {dust}
              </span>
            )}
            {uv && (
              <span className="ds-gchip" style={{ color: BROWN.fg }}>
                자외선 {uv}
              </span>
            )}
          </div>
          <p className="text-center text-[13px] font-bold leading-[1.6]" style={{ color: BROWN.fg }}>
            {OUTING.legs.map((l) => `${l.tag} ${l.place} ${l.score}`).join(" · ")} — 낮은 쪽 점수예요
          </p>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "80ms", background: "#F3F1EC", paddingTop: 12, paddingBottom: 8 }}>
          <h2 className="ds-lab m-0" style={{ color: BROWN.fg }}>
            점수에 들어간 것
          </h2>
          <div>
            {rows.map((r) => (
              <div key={r.k} className="ds-row">
                <span className="ds-k">
                  {/* 마이 › 건강에서 보호자가 고른 '먼저 볼 날씨'는 그렇다고 붙인다 (시안 '기온 (먼저 볼 날씨)') */}
                  <b>
                    {r.k}
                    {priority.includes(r.k) ? " (먼저 볼 날씨)" : ""}
                  </b>
                </span>
                <span className="flex-none text-[15px] font-extrabold" style={{ color: r.minus ? BROWN.fg : TONE.green.fg }}>
                  {r.v}
                </span>
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full text-[15px] font-black text-white"
                  style={{ background: r.minus ? BROWN.solid : TONE.green.solid }}
                >
                  <span aria-hidden="true">{r.minus ? "−" : "+"}</span>
                  <span className="sr-only">{r.minus ? "점수를 낮춤" : "점수를 올림"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "120ms", background: "#F3F1EC" }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="ds-lab m-0" style={{ color: BROWN.fg }}>
              나가기 좋은 시간
            </h2>
            {hosp && (
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold" style={{ color: "#1B2340" }}>
                <span aria-hidden="true" className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ border: "2.5px solid #1B2340" }} />
                {hospHm} 병원
              </span>
            )}
          </div>
          <ol className="m-0 grid list-none gap-1 p-0" style={{ gridTemplateColumns: `repeat(${OUTING.hours.length}, minmax(0, 1fr))` }} aria-label="시간대별 바깥 상태">
            {OUTING.hours.map(([h, lv]) => (
              <li key={h} className="flex flex-col items-center gap-1">
                <i
                  aria-hidden="true"
                  className="block h-[22px] w-full rounded-[6px]"
                  style={{ background: HOUR_COLOR[lv], ...(h === hospHour ? { outline: "3px solid #1B2340", outlineOffset: 1 } : {}) }}
                />
                <span className="text-[11px] font-extrabold" style={{ color: "#5E6270" }}>
                  {h}
                  <span className="sr-only">
                    시 {HOUR_LABEL[lv]}
                    {h === hospHour ? " · 병원 가는 시간" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="ds-leg">
            {Object.keys(HOUR_COLOR).map((lv) => (
              <span key={lv}>
                <i style={{ background: HOUR_COLOR[lv] }} />
                {HOUR_LABEL[lv]}
              </span>
            ))}
          </div>
        </div>

        <div className="ds-gcard ds-r" style={{ "--d": "160ms", background: TONE.blue.bg }}>
          <h2 className="ds-lab m-0" style={{ color: TONE.blue.fg }}>
            챙길 것 · {subj} 화면에도 보여요
          </h2>
          <div className="flex flex-wrap gap-2">
            {OUTING.kit.map((x) => (
              <span key={x} className="ds-gchip" style={{ color: TONE.blue.fg }}>
                {x}
              </span>
            ))}
          </div>
          <p className="text-[15px] font-bold leading-[1.6]" style={{ color: "#3A3F50" }}>
            {OUTING.advice}
          </p>
        </div>

        <div className="ds-src ds-r text-right" style={{ "--d": "180ms" }}>
          날씨 · 케이웨더 · 예시{live ? "" : ` · 몸 신호 · ${FIT3_INFO.device}`}
        </div>
      </FamilyLayout>
    </>
  );
}
