import { useEffect, useState } from 'react'

// dcmap SpringNumber 포인트 흡수 — 문자열 속 첫 숫자를 카운트업(ease-out).
// 통화 기호·단위·콤마·소수점 포맷은 원문 그대로 유지, reduced-motion 존중.
export function SpringNumber({ text, duration = 750 }: { text: string; duration?: number }) {
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text)
      return
    }
    const m = text.match(/\d[\d,]*\.?\d*/)
    if (!m) { setDisplay(text); return }
    const numStr = m[0]
    const target = parseFloat(numStr.replace(/,/g, ''))
    if (!isFinite(target)) { setDisplay(text); return }
    const decimals = (numStr.split('.')[1] ?? '').length
    const hasComma = numStr.includes(',')
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = target * eased
      const s = hasComma || v >= 1000
        ? v.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : v.toFixed(decimals)
      setDisplay(text.replace(numStr, s))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisplay(text)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, duration])

  return <>{display}</>
}
