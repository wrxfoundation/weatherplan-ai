"use client";

/* 내 공기 (8/30 회의 — "모니터링 화면을 에어사인 수준으로 크게")

   기기를 등록한 사람이 마이페이지에서 제일 먼저 보는 자리다. 주문 상태는 한 번
   확인하면 끝이지만 이 화면은 매일 열게 된다. 그래서 맨 위에 두고 크게 그린다.

   형태를 정하는 데 한 번 걸렸다. 회의에서 "3요소를 한 화면에"라고 했지만 CO₂(ppm)
   와 미세먼지(㎍/㎥)와 온도(°C)를 한 그래프에 겹치면 세로축이 셋이 된다. 축이 둘만
   돼도 두 선의 교차점이 아무 뜻이 없는 그림이 되므로, 지금 값은 타일 셋으로 한눈에
   보여 주고 시간 흐름은 요소를 갈아 끼우는 큰 그래프 하나로 본다.

   등급은 색으로만 말하지 않는다. 색약이거나 흑백으로 인쇄하면 색은 사라지고 숫자만
   남기 때문에, 좋음·보통·나쁨을 늘 글자로 함께 띄운다. 색은 검증기를 돌려 고른
   값이다(흰 바탕 대비 5.4~5.9). */

import { useState } from "react";
import { MOCK_AIR, co2Grade, pmGrade, GRADE_LABEL, type AirGrade, type AirPoint } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

type Key = "co2" | "pm25" | "temp" | "hum";

type Metric = {
  key: Key; ko: string; en: string; unit: string;
  grade?: (v: number) => AirGrade;
  /* 좋음↑ · 보통↑ 경계 — 그래프에 옅은 기준선으로 깔아 준다. 숫자만 있으면
     1140ppm 이 높은 값인지 아닌지 알 수 없다. */
  bands?: [number, number];
  dom: [number, number]; step: number; dp?: number;
};

const METRICS: Metric[] = [
  { key: "co2",  ko: "이산화탄소", en: "CO₂",         unit: "ppm",  grade: co2Grade, bands: [800, 1200], dom: [400, 1600], step: 300 },
  { key: "pm25", ko: "초미세먼지", en: "Fine dust",   unit: "㎍/㎥", grade: pmGrade,  bands: [15, 35],    dom: [0, 40],     step: 10 },
  { key: "temp", ko: "온도",       en: "Temperature", unit: "°C",                                        dom: [20, 28],    step: 2, dp: 1 },
  { key: "hum",  ko: "습도",       en: "Humidity",    unit: "%",                                         dom: [30, 60],    step: 10 },
];

/* 그래프 판 — viewBox 로 그리고 선 굵기만 화면 픽셀로 고정한다(non-scaling-stroke).
   그러지 않으면 넓은 화면에서 선이 굵어지고 휴대폰에서 실처럼 얇아진다.

   판을 두 벌 둔다. 하나뿐이면 가로세로 비가 고정되어 휴대폰에서 높이가 100px 로
   눌린다 — "에어사인 수준으로 크게" 가 화면이 좁아지는 순간 무너진다. 좁은 화면은
   더 세로로 긴 판을 쓰고, 보이는 쪽만 CSS 로 고른다. */
type Board = { W: number; H: number; PL: number; PR: number; PT: number; PB: number };
const DESK: Board = { W: 760, H: 240, PL: 46, PR: 58, PT: 16, PB: 28 };
const MOB:  Board = { W: 420, H: 300, PL: 40, PR: 46, PT: 14, PB: 26 };

const iw = (b: Board) => b.W - b.PL - b.PR;
const ih = (b: Board) => b.H - b.PT - b.PB;
const gx = (b: Board, i: number) => b.PL + (iw(b) * i) / (MOCK_AIR.length - 1);
const gy = (b: Board, v: number, [lo, hi]: [number, number]) => b.PT + ih(b) * (1 - (v - lo) / (hi - lo));

const fmtV = (v: number, dp = 0) => v.toFixed(dp);

function Tile({ label, value, unit, grade, en }: {
  label: string; value: string; unit: string; grade?: AirGrade; en: boolean;
}) {
  return (
    <div className="air-tile">
      <span className="air-tile-k">{label}</span>
      <span className="air-tile-v">
        {value}<i>{unit}</i>
      </span>
      {grade ? (
        <span className={`air-badge ${grade}`}>
          <span className="air-dot" />
          {GRADE_LABEL[grade][en ? "en" : "ko"]}
        </span>
      ) : (
        <span className="air-badge-none">{en ? "Reference only" : "참고 값"}</span>
      )}
    </div>
  );
}

/* 판 한 벌 — 데스크톱용과 휴대폰용에 같은 함수를 크기만 바꿔 쓴다 */
function Plot({ b, m, series, at, en, cls, onTrack, onLeave }: {
  b: Board; m: Metric; series: number[]; at: number | null; en: boolean; cls: string;
  onTrack: (clientX: number, w: number, el: HTMLElement) => void; onLeave: () => void;
}) {
  const line = series.map((v, i) => `${i ? "L" : "M"}${gx(b, i).toFixed(1)},${gy(b, v, m.dom).toFixed(1)}`).join("");
  /* 면적은 축이 0 에서 시작할 때만 쓴다 — 잘린 축 위의 면적은 넓이가 거짓말을 한다 */
  const area = `${line}L${gx(b, series.length - 1).toFixed(1)},${b.PT + ih(b)}L${b.PL},${b.PT + ih(b)}Z`;

  const ticks: number[] = [];
  for (let v = m.dom[0]; v <= m.dom[1]; v += m.step) ticks.push(v);
  const last = series.length - 1;

  return (
    <div className={`air-plot ${cls}`}
         onMouseMove={(e) => onTrack(e.clientX, b.W, e.currentTarget)}
         onMouseLeave={onLeave}
         onTouchStart={(e) => onTrack(e.touches[0].clientX, b.W, e.currentTarget)}
         onTouchMove={(e) => onTrack(e.touches[0].clientX, b.W, e.currentTarget)}
         onTouchEnd={onLeave}>
      <svg viewBox={`0 0 ${b.W} ${b.H}`} width="100%" role="img"
           aria-label={`${en ? m.en : m.ko} — ${en ? "last 24 hours" : "최근 24시간"}`}>
        {/* 가로 눈금 — 그래프보다 뒤로 물러나 있어야 한다 */}
        {ticks.map((v) => (
          <g key={v}>
            <line x1={b.PL} x2={b.W - b.PR} y1={gy(b, v, m.dom)} y2={gy(b, v, m.dom)}
                  stroke="var(--line-2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text x={b.PL - 9} y={gy(b, v, m.dom) + 4} textAnchor="end" className="air-ax">{v}</text>
          </g>
        ))}

        {/* 등급 경계 — 값이 좋은지 나쁜지를 그래프 안에서 알 수 있게. 라벨은 판 밖
            오른쪽에 세운다. 안쪽에 두면 마지막 값 점과 겹쳐 둘 다 못 읽는다. */}
        {m.bands?.map((v, n) => (
          v > m.dom[0] && v < m.dom[1] ? (
            <g key={v}>
              <line x1={b.PL} x2={b.W - b.PR} y1={gy(b, v, m.dom)} y2={gy(b, v, m.dom)}
                    strokeDasharray="3 4" strokeWidth="1" vectorEffect="non-scaling-stroke"
                    stroke={n === 0 ? "var(--air-fair)" : "var(--air-bad)"} opacity="0.5" />
              <text x={b.W - b.PR + 8} y={gy(b, v, m.dom) + 3.5} textAnchor="start" className="air-band"
                    fill={n === 0 ? "var(--air-fair)" : "var(--air-bad)"}>
                {GRADE_LABEL[n === 0 ? "fair" : "bad"][en ? "en" : "ko"]}
              </text>
            </g>
          ) : null
        ))}

        {m.dom[0] === 0 && <path d={area} fill="var(--w-main)" opacity="0.07" />}
        <path d={line} fill="none" stroke="var(--w-main)" strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* 시각 라벨 — 여섯 시간마다. 스물넷을 다 적으면 글자가 서로 겹친다 */}
        {[0, 6, 12, 18, 23].map((i) => (
          <text key={i} x={gx(b, i)} y={b.H - 8} className="air-ax"
                textAnchor={i === 0 ? "start" : i === 23 ? "end" : "middle"}>
            {i === 23 ? (en ? "now" : "지금") : `${i}${en ? ":00" : "시"}`}
          </text>
        ))}

        {/* 마지막 값은 늘 점으로 찍어 둔다 — "지금 어디인가" 가 이 그래프의 요점이다 */}
        <circle cx={gx(b, last)} cy={gy(b, series[last], m.dom)} r="4.5"
                fill="var(--w-main)" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />

        {at !== null && (
          <g>
            <line x1={gx(b, at)} x2={gx(b, at)} y1={b.PT} y2={b.PT + ih(b)}
                  stroke="var(--bd-card)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={gx(b, at)} cy={gy(b, series[at], m.dom)} r="5.5"
                    fill="var(--w-main)" stroke="#fff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>

      {at !== null && (
        /* 말풍선은 판 안에 머무르게 잡아 둔다 — 양 끝에서 잘려 나가면 정작 제일
           궁금한 지금 값이 안 보인다 */
        <div className="air-tip" style={{ left: `${Math.min(86, Math.max(14, (gx(b, at) / b.W) * 100))}%` }}>
          <b>{MOCK_AIR[at].h}{en ? ":00" : "시"}</b>
          <span>{fmtV(MOCK_AIR[at][m.key], m.dp ?? 0)} {m.unit}</span>
          {m.grade && (
            <span className={`air-badge ${m.grade(MOCK_AIR[at][m.key])}`}>
              <span className="air-dot" />{GRADE_LABEL[m.grade(MOCK_AIR[at][m.key])][en ? "en" : "ko"]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AirMonitor() {
  const { en } = useI18n();
  const [key, setKey] = useState<Key>("co2");
  const [at, setAt] = useState<number | null>(null);

  const m = METRICS.find((x) => x.key === key)!;
  const series = MOCK_AIR.map((p) => p[m.key]);
  const now = MOCK_AIR[MOCK_AIR.length - 1];

  /* 포인터 x 를 자료 번호로 옮긴다. viewBox 가 화면 폭에 맞춰 늘어나므로 실제로
     그려진 칸 너비를 재서 나눈다 — 상수로 두면 창 크기마다 한 칸씩 어긋난다. */
  const track = (clientX: number, w: number, el: HTMLElement) => {
    const b = w === DESK.W ? DESK : MOB;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const x = ((clientX - r.left) / r.width) * b.W;
    const i = Math.round(((x - b.PL) / iw(b)) * (MOCK_AIR.length - 1));
    setAt(Math.max(0, Math.min(MOCK_AIR.length - 1, i)));
  };

  const label = (p: Metric) => (en ? p.en : p.ko);

  return (
    <section className="air-card">
      <div className="air-head">
        <div className="air-head-t">
          <h3>{en ? "My air" : "내 공기"}</h3>
          <span className="air-head-s">
            {en ? "Genesis #0812 · living room · updated 3 min ago" : "제네시스 #0812 · 거실 · 3분 전 갱신"}
          </span>
        </div>
        <span className="air-live">
          <span className="air-live-dot" />
          {en ? "Measuring" : "측정 중"}
        </span>
      </div>

      {/* 지금 값 — 그래프를 보기 전에 답이 나와야 하는 세 가지 */}
      <div className="air-tiles">
        <Tile en={en} label={en ? "CO₂" : "이산화탄소"} value={fmtV(now.co2)} unit="ppm" grade={co2Grade(now.co2)} />
        <Tile en={en} label={en ? "Fine dust (PM2.5)" : "초미세먼지"} value={fmtV(now.pm25)} unit="㎍/㎥" grade={pmGrade(now.pm25)} />
        <Tile en={en} label={en ? "Temp · humidity" : "온도 · 습도"} value={`${fmtV(now.temp, 1)}°C · ${fmtV(now.hum)}%`} unit="" />
      </div>

      {/* 요소 갈아 끼우기 — 축이 하나뿐인 그래프를 네 번 보는 것과 같다 */}
      <div className="air-tabs" role="tablist" aria-label={en ? "Measure" : "요소"}>
        {METRICS.map((x) => (
          <button key={x.key} role="tab" aria-selected={x.key === key}
                  className={`air-tab${x.key === key ? " on" : ""}`}
                  onClick={() => { setKey(x.key); setAt(null); }}>
            {label(x)}
          </button>
        ))}
      </div>

      <Plot b={DESK} cls="desk-only" m={m} series={series} at={at} en={en} onTrack={track} onLeave={() => setAt(null)} />
      <Plot b={MOB}  cls="mob-only"  m={m} series={series} at={at} en={en} onTrack={track} onLeave={() => setAt(null)} />

      {/* 그래프를 못 읽는 경우를 위한 같은 자료 — 화면 낭독기·인쇄 */}
      <details className="air-table">
        <summary>{en ? "View as table" : "표로 보기"}</summary>
        <div className="air-table-in">
          <table>
            <thead>
              <tr>
                <th>{en ? "Hour" : "시각"}</th>
                {METRICS.map((x) => <th key={x.key}>{label(x)}<i> {x.unit}</i></th>)}
              </tr>
            </thead>
            <tbody>
              {MOCK_AIR.map((p: AirPoint) => (
                <tr key={p.h}>
                  <th scope="row">{p.h}{en ? ":00" : "시"}</th>
                  {METRICS.map((x) => <td key={x.key}>{fmtV(p[x.key], x.dp ?? 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="air-foot">
        {en
          ? "Sample values shown until your device is registered. Measurements are your own — wellbian stores only what the network verifies."
          : "기기 등록 전에는 예시 값이 보입니다. 측정값은 내 것이며, 네트워크가 검증하는 값만 기록됩니다."}
      </p>
    </section>
  );
}
