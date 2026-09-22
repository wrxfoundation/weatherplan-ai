// 고객 실시간 건강정보 서랍 — 요청서 3절. 값마다 측정·수신 시각과 수신 상태를 붙이고,
// 최근 1시간·오늘·7일·30일 변화 그래프를 인라인 SVG 로 그린다 (외부 라이브러리 없음).
import { useState } from "react";
import { Avatar, Btn, Drawer, FeedPill, KV, Note, Pill, SevPill, Stamp, Tabs, TONE } from "../ui";
import { getCustomer, getHealth, getSeries, RANGES } from "../../../lib/ops-health";
import { fmtTime, useNow } from "../../../lib/ops-time";

const FIELDS = [
  ["hr", "현재 심박수"], ["restHr", "안정시 심박수"], ["spo2", "혈중산소"], ["stress", "스트레스 지수"],
  ["activity", "활동량"], ["steps", "걸음 수"], ["sleep", "수면정보"], ["fall", "낙상 감지"],
  ["sosBtn", "SOS 버튼 작동"], ["location", "현재·마지막 위치"], ["worn", "워치 착용 여부"], ["battery", "워치 배터리"],
  ["comm", "데이터 통신상태"],
];

// 그래프 기준선 — 표준값에 고객 개별 기준이 있으면 그것을 쓴다 (4절 "기본값과 개별값 분리")
function thresholdsFor(metric, personal = {}) {
  if (metric === "hr") return [
    { v: personal.hrWarn ?? 110, label: `주의 ${personal.hrWarn ?? 110}`, tone: "warn" },
    { v: personal.hrDanger ?? 130, label: `위험 ${personal.hrDanger ?? 130}${personal.hrDanger ? " (개별)" : ""}`, tone: "danger" },
  ];
  if (metric === "spo2") return [
    { v: personal.spo2Warn ?? 93, label: `주의 ${personal.spo2Warn ?? 93}%`, tone: "warn" },
    { v: personal.spo2Danger ?? 90, label: `위험 ${personal.spo2Danger ?? 90}%`, tone: "danger" },
  ];
  return [];
}

const METRICS = [["hr", "심박수", "bpm"], ["spo2", "혈중산소", "%"], ["steps", "걸음 수", "보"]];

function TrendChart({ data, lines, unit, xStart, xEnd }) {
  const W = 320;
  const H = 130;
  const L = 38;
  const R = 10;
  const T = 12;
  const B = 24;
  const all = [...data, ...lines.map((l) => l.v)];
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (max - min < 6) {
    min -= 3;
    max += 3;
  }
  const pad = (max - min) * 0.12;
  min -= pad;
  max += pad;
  const x = (i) => L + (i / Math.max(1, data.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const points = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = data[data.length - 1];
  const dMin = Math.min(...data);
  const dMax = Math.max(...data);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`변화 그래프 · 최저 ${dMin}${unit} 최고 ${dMax}${unit} 현재 ${last}${unit}`}>
      <line x1={L} x2={W - R} y1={y(dMin)} y2={y(dMin)} stroke="rgba(10,31,60,.08)" />
      <line x1={L} x2={W - R} y1={y(dMax)} y2={y(dMax)} stroke="rgba(10,31,60,.08)" />
      {lines.map((l) => (
        <g key={l.label}>
          <line x1={L} x2={W - R} y1={y(l.v)} y2={y(l.v)} stroke={TONE[l.tone].bar} strokeDasharray="4 3" strokeWidth="1" />
          <text x={W - R} y={y(l.v) - 3} fontSize="8" textAnchor="end" fill={TONE[l.tone].fg} fontWeight="700">{l.label}</text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke="#0A1F3C" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(last)} r="3" fill="#B08D57" />
      <text x={L - 4} y={y(dMax) + 3} fontSize="8" textAnchor="end" fill="#5C5A54" className="font-num">{dMax}</text>
      <text x={L - 4} y={y(dMin) + 3} fontSize="8" textAnchor="end" fill="#5C5A54" className="font-num">{dMin}</text>
      <text x={L} y={H - 8} fontSize="8" fill="#5C5A54">{xStart}</text>
      <text x={W - R} y={H - 8} fontSize="8" textAnchor="end" fill="#5C5A54">{xEnd}</text>
    </svg>
  );
}

const X_LABELS = { "1h": ["60분 전", "지금"], today: ["00시", "지금"], "7d": ["7일 전", "오늘"], "30d": ["30일 전", "오늘"] };

export default function HealthDrawer({ name, row, open, onClose, onStartSos }) {
  const [range, setRange] = useState("1h");
  const [metric, setMetric] = useState("hr");
  const now = useNow(1000);
  if (!open || !name) return null;
  const c = getCustomer(name);
  const h = getHealth(name);
  const series = getSeries(name, range);
  const [, mLabel, unit] = METRICS.find((m) => m[0] === metric) || METRICS[0];
  const stampOf = (f) => (now ? fmtTime(now - (f?.agoSec ?? 0) * 1000) : "—");
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={620}
      title={`${c.name} · 실시간 건강정보`}
      sub={`${c.age ? `${c.age}세 · ` : ""}${c.district} · 담당 컨시어지 ${c.concierge.main} · ${c.ltc}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] text-muted">
            마지막 데이터 수신 <Stamp at={stampOf(h.lastRx)} /> <FeedPill feed={h.lastRx.feed} />
          </span>
          <div className="flex gap-2">
            <Btn ghost tone="muted" onClick={onClose}>닫기</Btn>
            {onStartSos && <Btn tone="danger" onClick={() => onStartSos(name)}>SOS 대응 시작</Btn>}
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={c.name} size={44} tone={row?.sev === "sev1" || row?.sev === "danger" ? "danger" : "navy"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-navy">{c.name}</span>
            {c.age && <span className="text-[13px] text-muted">{c.age}세</span>}
            {row ? <SevPill sev={row.sev} /> : <Pill tone="ok">정상</Pill>}
            {c.personal && <Pill tone="gold">개별 기준 적용</Pill>}
          </div>
          <div className="mt-0.5 text-[12px] text-muted">
            {row ? `${row.signal} · ${row.value} (기준 ${row.threshold})` : "현재 이상징후 없음"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => {
          const f = h[k];
          const toneFg = f.tone ? TONE[f.tone].fg : "#0A1F3C";
          return (
            <div key={k} className="card-glass rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted">{label}</span>
                <FeedPill feed={f.feed} />
              </div>
              <div className="mt-1 text-[14px] font-bold leading-[1.4]" style={{ color: toneFg }}>
                {f.v}
                {f.unit && <span className="ml-1 text-[11px] font-semibold text-muted">{f.unit}</span>}
              </div>
              <div className="mt-0.5"><Stamp at={stampOf(f)} prefix="측정" /></div>
            </div>
          );
        })}
      </div>

      <section className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-[14px] font-bold text-navy">변화 그래프</h4>
          <div role="group" aria-label="그래프 항목" className="flex gap-1">
            {METRICS.map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={metric === k}
                onClick={() => setMetric(k)}
                className="btn-press btn-inline rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={metric === k ? { background: TONE.navy.fg, color: "#fff" } : { background: TONE.navy.bg, color: TONE.navy.fg }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <Tabs className="mt-2" value={range} onChange={setRange} tabs={RANGES.map(([k, label]) => [k, label])} />
        <div className="card-glass mt-3 rounded-xl p-3">
          <div className="flex items-baseline justify-between text-[12px] text-muted">
            <span>{mLabel} · {RANGES.find((r) => r[0] === range)?.[3]} 간격</span>
            <span className="font-num">현재 {series[metric][series[metric].length - 1]}{unit}</span>
          </div>
          <TrendChart data={series[metric]} lines={thresholdsFor(metric, c.personal)} unit={unit} xStart={X_LABELS[range][0]} xEnd={X_LABELS[range][1]} />
        </div>
      </section>

      <section className="mt-5">
        <h4 className="text-[14px] font-bold text-navy">고객 기본정보</h4>
        <div className="mt-1">
          <KV k="자택 주소" v={c.address} />
          <KV k="주요 질환" v={c.conditions.join(" · ")} />
          <KV k="복용약" v={c.meds.join(" · ")} />
          <KV k="알레르기" v={c.allergies.join(" · ")} />
          <KV k="보호자" v={c.guardians.length ? c.guardians.map((g) => `${g.name}(${g.rel}·${g.role})`).join(" · ") : "등록 확인 필요"} />
          <KV k="담당 컨시어지" v={`주 ${c.concierge.main} · 부 ${c.concierge.sub}`} />
          <KV k="사전동의" v={`${c.consent.entry} · ${c.consent.measure}`} />
        </div>
      </section>

      <div className="mt-4">
        <Note>건강·센서 데이터는 참고자료이며 의료진의 진단을 대신하지 않습니다.</Note>
      </div>
    </Drawer>
  );
}
