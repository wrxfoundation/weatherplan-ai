// 경량 자체 SVG 차트 (PRD §2 — 외부 차트 라이브러리 금지)
import { useId } from 'react'

function scale(data: number[], w: number, h: number, pad = 2) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / range) * (h - pad * 2),
  ] as const)
}

function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`
  }
  return d
}

export function Sparkline({ data, color = '#3E6FE0', w = 84, h = 28 }: {
  data: number[]; color?: string; w?: number; h?: number
}) {
  const pts = scale(data, w, h, 2)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.2} fill={color} />
    </svg>
  )
}

export function LineChart({ data, height = 160, color = '#3E6FE0', yTicks, xLabels, dashedY, unit = '' }: {
  data: number[]
  height?: number
  color?: string
  yTicks?: number[]
  xLabels?: string[]
  dashedY?: number
  unit?: string
}) {
  const w = 560
  const padL = yTicks ? 36 : 6
  const padB = xLabels ? 20 : 4
  const padT = 8
  const min = yTicks ? Math.min(...yTicks) : Math.min(...data)
  const max = yTicks ? Math.max(...yTicks) : Math.max(...data)
  const range = max - min || 1
  const iw = w - padL - 8
  const ih = height - padT - padB
  const pts = data.map((v, i) => [
    padL + (i / (data.length - 1)) * iw,
    padT + ih - ((v - min) / range) * ih,
  ] as const)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" aria-hidden>
      {yTicks?.map(t => {
        const y = padT + ih - ((t - min) / range) * ih
        return (
          <g key={t}>
            <line x1={padL} x2={w - 8} y1={y} y2={y} stroke="#EFF2F8" strokeWidth={1} />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill="#8593AB" className="num">{t}{unit}</text>
          </g>
        )
      })}
      {dashedY !== undefined && (
        <line x1={padL} x2={w - 8} y1={padT + ih - ((dashedY - min) / range) * ih} y2={padT + ih - ((dashedY - min) / range) * ih}
          stroke="#3E6FE0" strokeWidth={1} strokeDasharray="4 4" opacity={0.45} />
      )}
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {xLabels?.map((l, i) => (
        <text key={i} x={padL + (i / (xLabels.length - 1)) * iw} y={height - 4} textAnchor="middle" fontSize={10} fill="#8593AB" className="num">{l}</text>
      ))}
    </svg>
  )
}

export function AreaChart({ data, height = 150, color = '#3E6FE0', yTicks, xLabels, yFmt }: {
  data: number[]
  height?: number
  color?: string
  yTicks?: number[]
  xLabels?: string[]
  yFmt?: (v: number) => string
}) {
  const gid = useId()
  const w = 560
  const padL = yTicks ? 36 : 6
  const padB = xLabels ? 20 : 4
  const padT = 8
  const min = yTicks ? Math.min(...yTicks) : Math.min(...data)
  const max = yTicks ? Math.max(...yTicks) : Math.max(...data)
  const range = max - min || 1
  const iw = w - padL - 8
  const ih = height - padT - padB
  const pts = data.map((v, i) => [
    padL + (i / (data.length - 1)) * iw,
    padT + ih - ((v - min) / range) * ih,
  ] as const)
  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1][0]} ${padT + ih} L ${pts[0][0]} ${padT + ih} Z`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {yTicks?.map(t => {
        const y = padT + ih - ((t - min) / range) * ih
        return (
          <g key={t}>
            <line x1={padL} x2={w - 8} y1={y} y2={y} stroke="#EFF2F8" strokeWidth={1} />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill="#8593AB" className="num">{yFmt ? yFmt(t) : t}</text>
          </g>
        )
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {xLabels?.map((l, i) => (
        <text key={i} x={padL + (i / (xLabels.length - 1)) * iw} y={height - 4} textAnchor="middle" fontSize={10} fill="#8593AB" className="num">{l}</text>
      ))}
    </svg>
  )
}

export function MultiLineChart({ seriesList, height = 170, yTicks, xLabels, yFmt, w = 860 }: {
  seriesList: { data: number[]; color: string; dashed?: boolean }[]
  height?: number
  yTicks: number[]
  xLabels: string[]
  yFmt?: (v: number) => string
  w?: number
}) {
  const padL = 40
  const padB = 20
  const padT = 8
  const min = Math.min(...yTicks)
  const max = Math.max(...yTicks)
  const range = max - min || 1
  const iw = w - padL - 8
  const ih = height - padT - padB
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" aria-hidden>
      {yTicks.map(t => {
        const y = padT + ih - ((t - min) / range) * ih
        return (
          <g key={t}>
            <line x1={padL} x2={w - 8} y1={y} y2={y} stroke="#EFF2F8" strokeWidth={1} />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill="#8593AB" className="num">{yFmt ? yFmt(t) : t}</text>
          </g>
        )
      })}
      {seriesList.map((s, si) => {
        const pts = s.data.map((v, i) => [
          padL + (i / (s.data.length - 1)) * iw,
          padT + ih - ((Math.max(min, Math.min(max, v)) - min) / range) * ih,
        ] as const)
        return <path key={si} d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth={1.7}
          strokeLinecap="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
      })}
      {xLabels.map((l, i) => (
        <text key={i} x={padL + (i / (xLabels.length - 1)) * iw} y={height - 4} textAnchor="middle" fontSize={10} fill="#8593AB" className="num">{l}</text>
      ))}
    </svg>
  )
}

export function BarLineChart({ bars, line, xLabels, yTicks, height = 200, yFmt }: {
  bars: { data: number[]; color: string }[]
  line: { data: number[]; color: string }
  xLabels: string[]
  yTicks: number[]
  height?: number
  yFmt?: (v: number) => string
}) {
  const w = 620
  const padL = 40
  const padB = 20
  const padT = 8
  const min = Math.min(...yTicks)
  const max = Math.max(...yTicks)
  const range = max - min || 1
  const iw = w - padL - 10
  const ih = height - padT - padB
  const n = xLabels.length
  const slot = iw / n
  const barW = Math.min(14, slot / (bars.length + 1.6))
  const groupW = barW * bars.length + 2
  const linePts = line.data.map((v, i) => [
    padL + slot * i + slot / 2,
    padT + ih - ((v - min) / range) * ih,
  ] as const)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" aria-hidden>
      {yTicks.map(t => {
        const y = padT + ih - ((t - min) / range) * ih
        return (
          <g key={t}>
            <line x1={padL} x2={w - 10} y1={y} y2={y} stroke="#EFF2F8" strokeWidth={1} />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill="#8593AB" className="num">{yFmt ? yFmt(t) : t}</text>
          </g>
        )
      })}
      {bars.map((b, bi) =>
        b.data.map((v, i) => {
          const h = ((v - min) / range) * ih
          const x = padL + slot * i + slot / 2 - groupW / 2 + bi * (barW + 2)
          return <rect key={`${bi}-${i}`} x={x} y={padT + ih - h} width={barW} height={h} rx={2.5} fill={b.color} />
        }),
      )}
      <path d={smoothPath(linePts)} fill="none" stroke={line.color} strokeWidth={1.7} strokeDasharray="5 4" strokeLinecap="round" />
      {xLabels.map((l, i) => (
        <text key={i} x={padL + slot * i + slot / 2} y={height - 4} textAnchor="middle" fontSize={10} fill="#8593AB" className="num">{l}</text>
      ))}
    </svg>
  )
}

export function Donut({ segments, size = 150, thickness = 26, centerTop, centerBottom }: {
  segments: { value: number; color: string }[]
  size?: number
  thickness?: number
  centerTop?: string
  centerBottom?: string
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const r = (size - thickness) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {segments.map((s, i) => {
        const frac = s.value / total
        const len = frac * circ
        const offset = -acc * circ + circ / 4
        acc += frac
        if (len < 0.75) return null
        const dash = `${Math.max(len - 2, 0.5)} ${circ - Math.max(len - 2, 0.5)}`
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="butt" />
        )
      })}
      {centerTop && <text x={c} y={centerBottom ? c - 4 : c + 1} textAnchor="middle" fontSize={12} fill="#8593AB">{centerTop}</text>}
      {centerBottom && <text x={c} y={c + 15} textAnchor="middle" fontSize={19} fontWeight={700} fill="#111C33" className="num">{centerBottom}</text>}
    </svg>
  )
}
