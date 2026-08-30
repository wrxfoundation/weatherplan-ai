export function Toggle({ on, disabled = false }: { on: boolean; disabled?: boolean }) {
  return (
    <span aria-checked={on} role="switch"
      className={`relative inline-block h-[18px] w-8 shrink-0 rounded-full transition-colors ${
        on ? 'bg-navy' : 'bg-line'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all ${
        on ? 'left-[16px]' : 'left-[2px]'}`} />
    </span>
  )
}

export function Avatar({ name, size = 28, color = '#3E6FE0' }: { name: string; size?: number; color?: string }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {name.slice(0, 1)}
    </span>
  )
}
