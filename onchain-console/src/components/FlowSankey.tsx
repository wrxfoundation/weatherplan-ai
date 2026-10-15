import { useId } from 'react'

export type SankeyNode = {
  label: string
  value: string
  sub?: string
  subTone?: 'ok' | 'bad' | 'mute'
  weight: number
  color?: string
}

const subColor = { ok: '#2FA870', bad: '#E0574F', mute: '#8593AB' }

type Band = { top: number; h: number }

/** 컬럼 스택 — 전체 최대 총량 대비 비율로 높이를 정규화하고 세로 중앙 정렬 */
function stack(nodes: SankeyNode[], padY: number, usable: number, gap: number, colTotal: number, maxTotal: number): Band[] {
  const scale = colTotal / maxTotal
  const stackH = usable * scale
  const inner = Math.max(stackH - gap * (nodes.length - 1), nodes.length * 3)
  let cursor = padY + (usable - stackH) / 2
  return nodes.map(n => {
    const h = Math.max((Math.max(n.weight, 0) / (colTotal || 1)) * inner, 3)
    const band = { top: cursor, h }
    cursor += h + gap
    return band
  })
}

/** 라벨 중심 y 좌표가 서로 minGap 이상 벌어지도록 밀어냄 */
function spreadLabels(centers: number[], minGap: number, lo: number, hi: number): number[] {
  const out = [...centers]
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + minGap)
  if (out.length && out[out.length - 1] > hi) {
    out[out.length - 1] = hi
    for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - minGap)
  }
  if (out.length && out[0] < lo) out[0] = lo
  return out
}

function ribbon(x1: number, b1: Band, x2: number, b2: Band) {
  const mx = (x1 + x2) / 2
  return [
    `M ${x1} ${b1.top}`,
    `C ${mx} ${b1.top}, ${mx} ${b2.top}, ${x2} ${b2.top}`,
    `L ${x2} ${b2.top + b2.h}`,
    `C ${mx} ${b2.top + b2.h}, ${mx} ${b1.top + b1.h}, ${x1} ${b1.top + b1.h}`,
    'Z',
  ].join(' ')
}

/** 좌 → 중앙(우리 지갑) → 우 3단 자금 흐름 산키 (자체 SVG) */
export function FlowSankey({ left, right, center, height = 280, big = false }: {
  left: SankeyNode[]
  right: SankeyNode[]
  center: { title: string; items: { label: string; value: string }[] }
  height?: number
  big?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const W = 680
  const padY = 22
  const usable = height - padY * 2
  const LX = 208
  const CX1 = 288
  const CX2 = 404
  const RX = 472

  const leftTotal = left.reduce((a, n) => a + Math.max(n.weight, 0), 0) || 1
  const rightTotal = right.reduce((a, n) => a + Math.max(n.weight, 0), 0) || 1
  const maxTotal = Math.max(leftTotal, rightTotal)

  const lBands = stack(left, padY, usable, 8, leftTotal, maxTotal)
  const rBands = stack(right, padY, usable, 8, rightTotal, maxTotal)
  const lEdge = stack(left, padY, usable, 3, leftTotal, maxTotal)
  const rEdge = stack(right, padY, usable, 3, rightTotal, maxTotal)

  const labelGap = big ? 56 : 42
  const lLabelY = spreadLabels(lBands.map(b => b.top + b.h / 2), labelGap, padY + 8, height - padY - 8)
  const rLabelY = spreadLabels(rBands.map(b => b.top + b.h / 2), 42, padY + 8, height - padY - 8)

  const centerSingle = center.items.length === 1
  const itemsStartY = centerSingle ? height / 2 : padY + 40

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-in`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3E6FE0" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#3E6FE0" stopOpacity="0.13" />
        </linearGradient>
        <linearGradient id={`${uid}-out`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3E6FE0" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#2FA870" stopOpacity="0.30" />
        </linearGradient>
      </defs>

      {left.map((_, i) => (
        <path key={`li-${i}`} d={ribbon(LX + 8, lBands[i], CX1, lEdge[i])} fill={`url(#${uid}-in)`} />
      ))}
      {right.map((_, i) => (
        <path key={`ri-${i}`} d={ribbon(CX2, rEdge[i], RX, rBands[i])} fill={`url(#${uid}-out)`} />
      ))}

      {left.map((n, i) => {
        const yc = lLabelY[i]
        return (
          <g key={`ln-${i}`}>
            <rect x={LX} y={lBands[i].top} width={8} height={lBands[i].h} rx={3} fill={n.color ?? '#3E6FE0'} />
            {big ? (
              <>
                <text x={LX - 14} y={yc - 20} textAnchor="end" fontSize={12.5} fill="#8593AB">{n.label}</text>
                <text x={LX - 14} y={yc + 6} textAnchor="end" fontSize={24} fontWeight={700} fill="#111C33" className="num" letterSpacing="-0.02em">{n.value}</text>
                {n.sub && <text x={LX - 14} y={yc + 26} textAnchor="end" fontSize={12} fontWeight={600} fill={subColor[n.subTone ?? 'mute']} className="num">{n.sub}</text>}
              </>
            ) : (
              <>
                <text x={LX - 14} y={yc - 7} textAnchor="end" fontSize={11.5} fill="#3D4A63">{n.label}</text>
                <text x={LX - 14} y={yc + 8} textAnchor="end" fontSize={13} fontWeight={700} fill="#111C33" className="num">{n.value}</text>
                {n.sub && <text x={LX - 14} y={yc + 21} textAnchor="end" fontSize={10.5} fill={subColor[n.subTone ?? 'mute']} className="num">{n.sub}</text>}
              </>
            )}
          </g>
        )
      })}

      <rect x={CX1} y={padY - 10} width={CX2 - CX1} height={usable + 20} rx={10} fill="#FFFFFF" stroke="#E6EAF3" />
      {centerSingle ? (
        <>
          <text x={(CX1 + CX2) / 2} y={itemsStartY - 10} textAnchor="middle" fontSize={11.5} fill="#8593AB">{center.title}</text>
          <text x={(CX1 + CX2) / 2} y={itemsStartY + 12} textAnchor="middle" fontSize={15} fontWeight={700} fill="#111C33" className="num">{center.items[0].value}</text>
        </>
      ) : (
        <>
          <text x={(CX1 + CX2) / 2} y={padY + 12} textAnchor="middle" fontSize={11.5} fill="#8593AB">{center.title}</text>
          {center.items.map((it, i) => (
            <g key={`ci-${i}`}>
              <text x={(CX1 + CX2) / 2} y={itemsStartY + i * 54 + 8} textAnchor="middle" fontSize={11.5} fill="#3D4A63">{it.label}</text>
              <text x={(CX1 + CX2) / 2} y={itemsStartY + i * 54 + 27} textAnchor="middle" fontSize={15} fontWeight={700} fill="#111C33" className="num">{it.value}</text>
            </g>
          ))}
        </>
      )}

      {right.map((n, i) => {
        const yc = rLabelY[i]
        return (
          <g key={`rn-${i}`}>
            <rect x={RX} y={rBands[i].top} width={8} height={rBands[i].h} rx={3} fill={n.color ?? '#2FA870'} />
            <text x={RX + 16} y={yc - 7} textAnchor="start" fontSize={11.5} fill="#3D4A63">{n.label}</text>
            <text x={RX + 16} y={yc + 8} textAnchor="start" fontSize={13} fontWeight={700} fill="#111C33" className="num">{n.value}</text>
            {n.sub && <text x={RX + 16} y={yc + 21} textAnchor="start" fontSize={10.5} fontWeight={600} fill={subColor[n.subTone ?? 'mute']} className="num">{n.sub}</text>}
          </g>
        )
      })}
    </svg>
  )
}
