export function RangeInput({ label, value, valueText, min, max, step, onChange }: {
  label: string
  value: number
  valueText: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-label font-semibold text-ink">{label}</span>
        <b className="num text-label font-bold text-navy">{valueText}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="kw-range mt-2 w-full"
        style={{ background: `linear-gradient(to right, #3E6FE0 ${pct}%, #E4E9F2 ${pct}%)` }} />
    </label>
  )
}
