import { useState } from 'react'
import { Icon } from './Icon'

/** 산식 툴팁 — "숫자의 출처를 물으면 화면이 답한다" (PRD §0.8) */
export function FormulaTip({ formula }: { formula: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="text-mute/70 hover:text-navy transition-colors" aria-label="산식 보기"
        onClick={() => setOpen(v => !v)}>
        <Icon name="info" size={13} />
      </button>
      {open && (
        <span className="absolute right-0 top-5 z-30 w-64 rounded-lg border border-line bg-ink px-3 py-2.5 shadow-pop">
          <span className="block text-tiny font-semibold text-white/60 mb-1">산식</span>
          <span className="block font-mono text-[11px] leading-relaxed text-white num whitespace-pre-wrap">{formula}</span>
        </span>
      )}
    </span>
  )
}
