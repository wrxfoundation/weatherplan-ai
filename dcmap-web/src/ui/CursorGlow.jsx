import { useEffect, useRef } from 'react'

/* 커서 팔로우 브라이트 — 마우스 주변을 은은하게 밝히는 라디얼(섹션 accent 자동 추종).
 * 성능 원칙: 요소 1개·transform만 변경(rAF 스로틀)·합성 레이어 고정. 연속 애니메이션 없음.
 * 터치 기기(hover 불가)·모션 축소 설정에선 렌더하지 않는다. */
const R = 170 // 글로우 반경(px) — 피드백으로 절반 축소(340→170)

export default function CursorGlow() {
  const ref = useRef(null)
  const raf = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined
    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      cancelAnimationFrame(raf.current)
      const x = e.clientX
      const y = e.clientY
      raf.current = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.style.transform = `translate3d(${x - R}px, ${y - R}px, 0)`
        el.style.opacity = '1'
      })
    }
    const onLeave = () => {
      if (ref.current) ref.current.style.opacity = '0'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />
}
