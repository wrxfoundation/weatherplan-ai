import { useEffect, useRef, useState } from 'react'

// kinetics(스프링 모션) 톤 흡수 — 목표값으로 부드럽게 수렴하는 count-up.
// 지속시간 기반이지만 easeOutCubic으로 임계감쇠 스프링의 '오버슈트 없는 안착' 느낌을 근사.
// 접근성: prefers-reduced-motion이면 애니메이션 없이 즉시 표시.
const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function SpringNumber({ value, format = (n) => String(Math.round(n)), className, duration = 500 }) {
  const [disp, setDisp] = useState(value)
  const cur = useRef(value)
  const raf = useRef(0)

  useEffect(() => {
    const v = Number(value)
    if (!Number.isFinite(v)) return
    if (reduced() || typeof performance === 'undefined') {
      cur.current = v
      setDisp(v)
      return
    }
    const from = cur.current
    const to = v
    if (from === to) return
    const start = performance.now()
    const ease = (t) => 1 - Math.pow(1 - t, 3)
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const x = from + (to - from) * ease(t)
      cur.current = x
      setDisp(x)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <span className={className}>{format(disp)}</span>
}
