"use client";
/* 추이 그래프 — 일·주·월 탭 하나 (9/8 서우 — "그래프도 넣어서 일자별 주차별 월간별 채널별")

   막대 하나가 하루(한 주·한 달)이고, 그 안을 채널 색으로 쌓는다. 총량과 구성이 한 번에 보인다.
   탭을 바꿔도 데이터는 같다 — 서버가 세 묶음을 한꺼번에 내려 준다(lib/traffic.ts).

   SVG 를 직접 그린다. 차트 라이브러리는 이 프로젝트에 없는 의존성이고, 막대를 쌓는 데는
   필요 없다. 마우스를 올리면(모바일은 누르면) 그 막대의 채널 구성을 보여 준다.
   조각 사이 1.5px 틈, 맨 위 조각만 모서리를 둥글게 — 색이 비슷해도 경계가 읽힌다. */

import { useEffect, useRef, useState } from "react";
import { CHANNELS, niceMax, type Bucket, type Channel, type ChannelMeta } from "@/lib/traffic";

type Gran = "daily" | "weekly" | "monthly";
const GRAN: { key: Gran; label: string; unit: string }[] = [
  { key: "daily", label: "일별", unit: "하루" },
  { key: "weekly", label: "주별", unit: "한 주(월~일)" },
  { key: "monthly", label: "월별", unit: "한 달" },
];
const fmt = (x: number) => x.toLocaleString("ko-KR");

/* 폭은 컨테이너에 맞춘다 — viewBox 를 760 으로 고정하면 휴대폰에서 글자가 반으로 줄어 안 읽힌다.
   서버는 760 으로 그리고, 붙은 뒤 실제 폭으로 다시 그린다. 1 단위 = 1px 이라 글자 크기가 그대로다. */
const H = 250, L = 42, R = 10, T = 24, B = 26;

/* 위 두 모서리만 둥근 막대 */
const topRound = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
};

const Sw = ({ c }: { c: ChannelMeta }) => (
  <i className={`tf-sw${c.hatch ? " hatch" : ""}`} style={c.hatch ? undefined : { background: c.color }} />
);

export default function Charts({ daily, weekly, monthly }: { daily: Bucket[]; weekly: Bucket[]; monthly: Bucket[] }) {
  const [gran, setGran] = useState<Gran>("daily");
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(760);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setW(Math.max(300, Math.round(el.clientWidth)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const g = GRAN.find((x) => x.key === gran) ?? GRAN[0];
  const data = gran === "daily" ? daily : gran === "weekly" ? weekly : monthly;
  const n = data.length;
  const total = data.reduce((a, b) => a + b.total, 0);
  const peak = Math.max(0, ...data.map((b) => b.total));
  const top = niceMax(peak);
  const innerW = W - L - R, innerH = H - T - B;
  const step = innerW / Math.max(n, 1);
  const barW = Math.max(3, Math.min(n <= 7 ? 64 : 48, step * 0.66));
  const y = (v: number) => T + innerH * (1 - v / top);
  /* 날짜 글자는 44px 에 하나꼴을 넘기지 않는다 — 좁은 화면에서 겹치지 않게 */
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 44))));
  const showTotals = step >= 22;
  const used = CHANNELS.filter((c) => data.some((b) => (b.by[c.key] ?? 0) > 0));
  const sumOf = (k: Channel) => data.reduce((a, b) => a + (b.by[k] ?? 0), 0);
  const hi = hover ?? -1;
  const cur = hi >= 0 ? data[hi] : undefined;

  return (
    <div className="tf-card">
      <div className="tf-tabs" role="tablist" aria-label="묶는 단위">
        {GRAN.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={gran === t.key}
            className={`chip${gran === t.key ? " on" : ""}`}
            onClick={() => { setGran(t.key); setHover(null); }}>
            {t.label}
          </button>
        ))}
        <span className="tf-tot">막대 하나 = {g.unit} · 세션 합계 <b className="mono">{fmt(total)}</b></span>
      </div>

      <div className="tf-chart" ref={box} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${g.label} 세션 추이 — 채널별 누적 막대, 합계 ${fmt(total)}`}>
          <defs>
            <pattern id="tf-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#ececf3" />
              <rect width="2" height="6" fill="#b5b5c9" />
            </pattern>
          </defs>

          {[0, 1, 2, 3, 4].map((i) => {
            const v = (top / 4) * i;
            const yy = y(v);
            return (
              <g key={i}>
                <line x1={L} x2={W - R} y1={yy} y2={yy} stroke={i === 0 ? "#d8d8e6" : "#f0f0f6"} strokeWidth={1} />
                <text x={L - 7} y={yy + 4} textAnchor="end" fontSize={10.5} fill="#9a9ab5"
                  fontFamily="Montserrat, sans-serif" fontWeight={600}>{fmt(v)}</text>
              </g>
            );
          })}

          {data.map((b, i) => {
            const x = L + i * step + (step - barW) / 2;
            let acc = 0;
            const segs: { c: ChannelMeta; y0: number; y1: number; isTop: boolean }[] = [];
            for (const c of CHANNELS) {
              const v = b.by[c.key] ?? 0;
              if (!v) continue;
              const y0 = y(acc), y1 = y(acc + v);
              acc += v;
              segs.push({ c, y0, y1, isTop: acc === b.total });
            }
            return (
              <g key={b.key} onMouseEnter={() => setHover(i)} onClick={() => setHover(hi === i ? null : i)}>
                <rect x={L + i * step} y={T} width={step} height={innerH} fill={hi === i ? "rgba(77,77,206,.06)" : "transparent"} />
                {segs.map((s) => {
                  const h = Math.max(0, s.y0 - s.y1 - 1.5);
                  const fill = s.c.hatch ? "url(#tf-hatch)" : s.c.color;
                  return s.isTop && h > 2
                    ? <path key={s.c.key} d={topRound(x, s.y1, barW, h, 4)} fill={fill} />
                    : <rect key={s.c.key} x={x} y={s.y1} width={barW} height={h} fill={fill} />;
                })}
                {showTotals && b.total > 0 && (
                  <text x={x + barW / 2} y={y(b.total) - 5} textAnchor="middle" fontSize={11} fill="#44445e"
                    fontFamily="Montserrat, sans-serif" fontWeight={700}>{fmt(b.total)}</text>
                )}
                {i % every === 0 && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={10.5} fill="#8a8aa3" fontWeight={600}>{b.label}</text>
                )}
              </g>
            );
          })}
        </svg>

        {cur && (
          /* 막대를 가리지 않게 옆에 띄운다 — 왼쪽 절반은 오른쪽으로, 오른쪽 절반은 왼쪽으로 */
          <div className="tf-tip" style={{
            left: `${((L + hi * step + step / 2) / W) * 100}%`,
            transform: hi < n / 2 ? `translateX(${Math.round(barW / 2 + 10)}px)` : `translateX(calc(-100% - ${Math.round(barW / 2 + 10)}px))`,
          }}>
            <b>{cur.long}</b> · 세션 {fmt(cur.total)}
            {cur.total > 0 && (
              <ul>
                {CHANNELS
                  .filter((c) => (cur.by[c.key] ?? 0) > 0)
                  .sort((a, b) => (cur.by[b.key] ?? 0) - (cur.by[a.key] ?? 0))
                  .map((c) => (
                    <li key={c.key}><Sw c={c} />{c.label}<span className="mono">{fmt(cur.by[c.key] ?? 0)}</span></li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="tf-legend" aria-label="채널 범례">
        {used.map((c) => (
          <span key={c.key}><Sw c={c} />{c.label} <b className="mono">{fmt(sumOf(c.key))}</b></span>
        ))}
        {used.length === 0 && <span style={{ color: "var(--dis)" }}>아직 들어온 세션이 없습니다</span>}
      </div>
    </div>
  );
}
