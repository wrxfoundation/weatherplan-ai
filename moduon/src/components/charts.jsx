// ─── 경량 차트 (외부 라이브러리 없이 — 핸드오프 스펙: 라인 2px, 도넛 18px, 그리드 #EFF2F7) ──

// 도넛: conic-gradient + 중앙 라벨
export function Donut({ data, size = 118, thickness = 18, centerTop, centerSub }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let acc = 0
  const stops = data.map((d) => {
    const from = (acc / total) * 360
    acc += d.value
    const to = (acc / total) * 360
    return `${d.color} ${from}deg ${to}deg`
  })
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${stops.join(',')})` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-white" style={{ margin: thickness }}>
        {centerTop && <div className="tnum text-[16px] font-extrabold leading-5 text-bink">{centerTop}</div>}
        {centerSub && <div className="text-[10px] font-medium text-bfaint">{centerSub}</div>}
      </div>
    </div>
  )
}

export function Legend({ data, total, className = '' }) {
  const sum = total ?? data.reduce((s, d) => s + d.value, 0)
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-[12px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="text-bbody">{d.label}</span>
          <span className="tnum ml-auto font-bold text-bink">{d.render ? d.render(d.value) : d.value.toLocaleString('ko-KR')}</span>
          {sum > 0 && d.pct !== false && <span className="tnum w-10 text-right text-bfaint">{Math.round((d.value / sum) * 100)}%</span>}
        </div>
      ))}
    </div>
  )
}

// 라인 차트 — 시리즈 배열 [{label,color,values[]}]
export function LineChart({ series, labels = [], height = 180, formatY = (v) => v.toLocaleString('ko-KR') }) {
  const W = 560, H = height, PADL = 8, PADB = 20, PADT = 10
  const all = series.flatMap((s) => s.values)
  const max = Math.max(...all, 1) * 1.15
  const iw = W - PADL * 2
  const ih = H - PADB - PADT
  const x = (i, n) => PADL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const y = (v) => PADT + ih - (v / max) * ih
  const grid = [0.25, 0.5, 0.75, 1]
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {grid.map((g) => (
          <line key={g} x1={PADL} x2={W - PADL} y1={y(max * g)} y2={y(max * g)} stroke="#EFF2F7" strokeWidth="1" />
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i, s.values.length)},${y(v)}`).join(' ')
          return (
            <g key={s.label}>
              {s.fill && (
                <polygon points={`${PADL},${y(0)} ${pts} ${x(s.values.length - 1, s.values.length)},${y(0)}`} fill={s.color} opacity="0.07" />
              )}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i, s.values.length)} cy={y(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2" />
              ))}
            </g>
          )
        })}
        {labels.map((l, i) => (
          <text key={l + i} x={x(i, labels.length)} y={H - 4} textAnchor="middle" fontSize="10" fill="#A9B1C0">{l}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[12px] text-bbody">
            <span className="h-[3px] w-4 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// 미니 스파크라인 56×24
export function Spark({ values, color = '#17B26A', width = 56, height = 24 }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / range) * (height - 6)}`).join(' ')
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// 수평 바 (지역 분양 맵 대체 + 비중 표시 겸용)
export function HBars({ data, format = (v) => v.toLocaleString('ko-KR') }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-[12px] font-semibold text-bbody">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brow">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? '#5377D6' }} />
          </div>
          <span className="tnum w-14 shrink-0 text-right text-[12px] font-bold text-bink">{format(d.value)}</span>
        </div>
      ))}
    </div>
  )
}
