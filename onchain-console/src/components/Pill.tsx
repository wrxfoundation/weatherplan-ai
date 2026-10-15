import { ReactNode } from 'react'

const tones = {
  navy: 'bg-navy-soft text-navy-deep',
  demo: 'bg-amber-soft text-amber',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  mute: 'bg-line-soft text-mute',
  high: 'bg-bad-soft text-bad',
  mid: 'bg-warn-soft text-warn',
} as const

export type PillTone = keyof typeof tones

export function Pill({ tone = 'mute', children, className = '' }: {
  tone?: PillTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-tiny font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function StatusDot({ tone, label }: { tone: 'ok' | 'warn' | 'mute' | 'bad'; label: string }) {
  const dot = { ok: 'bg-ok', warn: 'bg-warn', mute: 'bg-mute/50', bad: 'bg-bad' }[tone]
  const text = { ok: 'text-body', warn: 'text-warn', mute: 'text-mute', bad: 'text-bad' }[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 text-label ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
