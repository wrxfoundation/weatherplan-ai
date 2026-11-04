/**
 * 마감 도구(scripts/art-finish/*) 공용 — OKLab 변환, 색역 맞춤, 부드러운 계단, 마스크 팽창·구멍 메움, 인자.
 *
 * OKLab을 쓰는 이유: 밝기(L)와 색(a·b)이 갈라져 있어서 밝기는 두고 색만 옮기거나 채도만 올릴 수 있다.
 * RGB·HSV에서 같은 일을 하면 밝기가 같이 흔들려 먹선이 뜨거나 한지가 탁해진다.
 */
import { parseArgs } from 'node:util'

const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
const LIN = new Float64Array(256)
for (let i = 0; i < 256; i++) LIN[i] = toLin(i)

/** 선형 RGB(0~1) → sRGB(0~255, 반올림 전) */
export const toSrgb = (c) => { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return c * 255 }

/** 선형 RGB 한 채널 → 0~255 정수 */
export const toByte = (v) => Math.max(0, Math.min(255, Math.round(toSrgb(Math.max(0, Math.min(1, v))))))

/** sRGB 0~255 정수 → [L, a, b] */
export function rgb2lab(R, G, B) {
  const r = LIN[R], g = LIN[G], b = LIN[B]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

/** [L, a, b] → 선형 RGB 0~1 (색역 밖이면 0~1을 벗어난다) */
export function lab2lin(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
}

const outOfGamut = (rgb) => rgb.some((v) => v < -0.0005 || v > 1.0005)

/** at(f) = 변화를 f(0~1)만큼 준 선형 RGB. 색역을 넘으면 넘지 않는 데까지만 준다 — 색상은 두고 채도만 덜어진다 */
export function fitGamut(at) {
  const rgb = at(1)
  if (!outOfGamut(rgb)) return rgb
  let lo = 0, hi = 1
  for (let it = 0; it < 7; it++) { const m = (lo + hi) / 2; if (outOfGamut(at(m))) hi = m; else lo = m }
  return at(lo)
}

/** 부드러운 계단: x가 e0 → e1로 갈 때 0 → 1 (e0 > e1이면 거꾸로 1 → 0) */
export const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }

/** 0~1 실수 배열 → 1채널 8비트 버퍼 */
export const toBuf = (A) => Buffer.from(Uint8Array.from(A, (v) => Math.round(Math.max(0, Math.min(1, v)) * 255)))

/** 0/1 마스크를 r화소만큼 네모로 팽창(가로로 한 번, 세로로 한 번 훑는다) */
export function dilate(m, w, h, r) {
  const t = new Uint8Array(w * h), o = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    let last = -1e9
    for (let x = 0; x < w; x++) { if (m[y * w + x]) last = x; t[y * w + x] = x - last <= r ? 1 : 0 }
    last = 1e9
    for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) last = x; if (last - x <= r) t[y * w + x] = 1 }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9
    for (let y = 0; y < h; y++) { if (t[y * w + x]) last = y; o[y * w + x] = y - last <= r ? 1 : 0 }
    last = 1e9
    for (let y = h - 1; y >= 0; y--) { if (t[y * w + x]) last = y; if (last - y <= r) o[y * w + x] = 1 }
  }
  return o
}

/** 마스크에 갇힌(판 테두리에 닿지 않는) maxArea 미만의 빈 곳을 메운다. 제자리에서 고치고 그대로 돌려준다 */
export function fillEnclosed(m, w, h, maxArea) {
  const seen = new Uint8Array(w * h)
  for (let p0 = 0; p0 < w * h; p0++) {
    if (m[p0] || seen[p0]) continue
    const comp = [p0], st = [p0]
    seen[p0] = 1
    let edge = false
    while (st.length) {
      const c = st.pop(), x = c % w, y = (c / w) | 0
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + i, Y = y + j
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue
        const q = Y * w + X
        if (!m[q] && !seen[q]) { seen[q] = 1; st.push(q); comp.push(q) }
      }
    }
    if (!edge && comp.length < maxArea) for (const c of comp) m[c] = 1
  }
  return m
}

/** 위치 인자(_) + --이름 값. options는 node:util parseArgs 형식이고 값은 문자열로 온다 */
export function cli(options, usage) {
  try {
    const { values, positionals } = parseArgs({ options, allowPositionals: true })
    return { ...values, _: positionals }
  } catch (err) {
    console.error(`${err.message}\n\n${usage}`)
    process.exit(2)
  }
}

/** 위치 인자가 모자라면 사용법을 찍고 끝낸다 */
export function need(args, n, usage) {
  if (args._.length < n) { console.error(usage); process.exit(2) }
}
