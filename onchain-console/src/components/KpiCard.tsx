import { ReactNode } from 'react'
import { Icon, IconName } from './Icon'
import { Sparkline } from './charts'
import { FormulaTip } from './FormulaTip'

const deltaTone = { ok: 'text-ok', bad: 'text-bad', navy: 'text-navy' } as const

export function KpiCard({ icon, label, formula, value, unit, sub, delta, deltaLabel = 'vs 어제', spark, sparkColor = '#3E6FE0', footer }: {
  icon: IconName | string
  label: ReactNode
  formula?: string
  value: ReactNode
  unit?: string
  sub?: ReactNode
  delta?: { text: string; tone: keyof typeof deltaTone }
  deltaLabel?: string
  spark?: number[]
  sparkColor?: string
  footer?: ReactNode
}) {
  return (
    <div className="rounded-card border border-line bg-panel p-4 shadow-card">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-navy-soft text-navy">
            <Icon name={icon} size={14} />
          </span>
          <span className="truncate whitespace-nowrap text-[12.5px] font-medium leading-tight text-body">{label}</span>
        </div>
        {formula && <FormulaTip formula={formula} />}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="num text-display text-ink">{value}</span>
        {unit && <span className="text-h3 text-mute">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-meta text-mute">{sub}</div>}
      {(delta || spark) && (
        <div className="mt-2 flex items-end justify-between gap-1.5">
          <span className="num whitespace-nowrap text-meta">
            {delta && <b className={`font-semibold ${deltaTone[delta.tone]}`}>{delta.text}</b>}
            {delta && deltaLabel && <span className="text-mute"> {deltaLabel}</span>}
          </span>
          {spark && <Sparkline data={spark} color={sparkColor} w={66} h={26} />}
        </div>
      )}
      {footer && <div className="mt-2.5">{footer}</div>}
    </div>
  )
}

export function ProgressBar({ ratio, className = '' }: { ratio: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-line-soft ${className}`}>
      <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  )
}
