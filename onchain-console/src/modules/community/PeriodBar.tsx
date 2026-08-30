import { periods, PeriodKey, periodOf, days } from '@/demo/generators/community'

/** 기간 필터 — 오늘 · 어제 · 3일 · 7일 · 14일 · 30일 (전 카드 공통 적용) */
export function PeriodBar({ value, onChange, right }: {
  value: PeriodKey
  onChange: (k: PeriodKey) => void
  right?: React.ReactNode
}) {
  const p = periodOf(value)
  const end = days.length - p.offset
  const from = days[Math.max(0, end - p.days)]
  const to = days[end - 1]
  const rangeText = p.days === 1 ? `2026-${to}` : `2026-${from} ~ 2026-${to}`

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-panel px-4 py-2.5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-meta font-semibold text-mute">기간</span>
        <div className="flex overflow-hidden rounded-lg border border-line">
          {periods.map(pd => (
            <button key={pd.key} type="button" onClick={() => onChange(pd.key)}
              className={`whitespace-nowrap px-3 py-1.5 text-meta font-semibold transition-colors ${
                value === pd.key ? 'bg-navy text-white' : 'text-mute hover:bg-line-soft hover:text-body'}`}>
              {pd.label}
            </button>
          ))}
        </div>
        <span className="num text-tiny font-normal text-mute">{rangeText}</span>
      </div>
      {right}
    </div>
  )
}

export function DeltaText({ pct, invert = false, hasPrev = true }: { pct: number | null; invert?: boolean; hasPrev?: boolean }) {
  if (!hasPrev) return <span className="text-meta text-mute" title="직전 동기간 데이터 없음">—</span>
  if (pct === null) return <span className="num text-meta font-semibold text-navy">신규</span>
  const up = pct >= 0
  const good = invert ? !up : up
  return (
    <span className={`num text-meta font-semibold ${Math.abs(pct) < 0.05 ? 'text-mute' : good ? 'text-ok' : 'text-bad'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}
