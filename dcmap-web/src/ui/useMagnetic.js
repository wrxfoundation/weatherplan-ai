import { useEffect } from 'react'

// kinetics 'Magnetic Button' 흡수 — 포인터가 가까우면 요소가 끌려오고, 벗어나면 스프링으로 복귀.
// 터치·모션축소 환경에서는 비활성(성능·접근성).
export function useMagnetic(ref, pull = 0.28) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined' || !window.matchMedia) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${x * pull}px, ${y * pull}px)`
    }
    const leave = () => {
      el.style.transform = ''
    }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
      el.style.transform = ''
    }
  }, [ref, pull])
}
