// 시드 고정 결정적 PRNG — 새로고침에도 동일 수치 (PRD §3)
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 시작·끝 값을 향해 수렴하는 잡음 낀 시계열 */
export function series(seed: number, n: number, from: number, to: number, noise: number): number[] {
  const rnd = mulberry32(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1)
    const base = from + (to - from) * t
    out.push(base + (rnd() - 0.5) * 2 * noise)
  }
  return out
}
