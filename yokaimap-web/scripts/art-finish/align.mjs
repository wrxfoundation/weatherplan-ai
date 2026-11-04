#!/usr/bin/env node
/**
 * 고쳐 그린 조각(생성본)을 원본 판에 맞춘다.
 *
 *   node scripts/art-finish/align.mjs orig.png gen.png out.png
 *   node scripts/art-finish/align.mjs orig.png gen.png out.png --skip "[[x0,y0,x1,y1], …]"
 *
 * 생성 모델은 출력 비율이 판과 조금 다르다(4:3 → 2400×1792 등). 판 크기로 늘리기만 하면 가장자리에서
 * 몇 화소씩 어긋나 붙인 자리에 두 겹 선이 생긴다. 그래서 판 크기로 늘린 뒤 80px 블록마다 윤곽 상관으로
 * 어긋남을 재고, dx = a + b·x · dy = c + d·y를 이상치를 빼 가며 맞춰 다시 표본한다.
 * --skip: 다시 그린 곳(원본과 상관이 없는 곳)을 빼고 잰다. 잔차가 1px을 넘으면 결과를 의심한다.
 */
import sharp from 'sharp'
import { cli, need } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/align.mjs orig.png gen.png out.png [--skip "[[x0,y0,x1,y1],…]"]'
const args = cli({ skip: { type: 'string' } }, USAGE)
need(args, 3, USAGE)
const [op, gp, outp] = args._
const skip = JSON.parse(args.skip ?? '[]')

const O = await sharp(op).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const w = O.info.width, h = O.info.height
const G = await sharp(gp).removeAlpha().resize(w, h, { fit: 'fill' }).raw().toBuffer()

const grad = (d) => {
  const g = new Float32Array(w * h)
  const L = (p) => 0.3 * d[p * 3] + 0.59 * d[p * 3 + 1] + 0.11 * d[p * 3 + 2]
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const p = y * w + x
    g[p] = Math.hypot(L(p + 1) - L(p - 1), L(p + w) - L(p - w))
  }
  return g
}
const ga = grad(O.data), gb = grad(G)

// 블록마다 ±10px 안에서 윤곽 상관이 가장 큰 어긋남을 찾고, 포물선으로 소수점까지 다듬는다
const B = 80, R = 10, pts = []
for (let y0 = R + 2; y0 + B + R + 2 < h; y0 += 60) for (let x0 = R + 2; x0 + B + R + 2 < w; x0 += 60) {
  if (skip.some(([a, b, c, d]) => x0 + B > a && x0 < c && y0 + B > b && y0 < d)) continue
  let ea = 0
  for (let y = y0; y < y0 + B; y++) for (let x = x0; x < x0 + B; x++) ea += ga[y * w + x] ** 2
  if (ea / (B * B) < 60) continue // 윤곽이 없는 블록(빈 종이)은 잴 수 없다
  const sc = (dx, dy) => {
    let s = 0, sb = 0
    for (let y = y0; y < y0 + B; y += 2) for (let x = x0; x < x0 + B; x += 2) { const v = gb[(y + dy) * w + x + dx]; s += ga[y * w + x] * v; sb += v * v }
    return s / Math.sqrt(sb + 1e-6)
  }
  let best = null
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const s = sc(dx, dy); if (!best || s > best.s) best = { dx, dy, s } }
  if (Math.abs(best.dx) === R || Math.abs(best.dy) === R) continue
  const sx0 = sc(best.dx - 1, best.dy), sx2 = sc(best.dx + 1, best.dy), sy0 = sc(best.dx, best.dy - 1), sy2 = sc(best.dx, best.dy + 1)
  const fx = best.dx + 0.5 * (sx0 - sx2) / (sx0 - 2 * best.s + sx2 || 1)
  const fy = best.dy + 0.5 * (sy0 - sy2) / (sy0 - 2 * best.s + sy2 || 1)
  pts.push({ x: x0 + B / 2, y: y0 + B / 2, dx: fx, dy: fy })
}
if (pts.length < 3) {
  console.error(`잴 수 있는 블록이 ${pts.length}개뿐이다 — --skip을 줄이거나, 조각이 작으면 둘레가 더 보이게 크게 잘라 다시 생성한다`)
  process.exit(1)
}

// 한 축씩 직선 맞춤 → 잔차 상위 30%를 1.5배 넘는 블록을 버리고 4번 되풀이
const fit = (key, coord) => {
  let use = pts.slice(), a = 0, b = 0
  for (let it = 0; it < 4; it++) {
    const n = use.length, mx = use.reduce((s, p) => s + p[coord], 0) / n, my = use.reduce((s, p) => s + p[key], 0) / n
    let sxx = 0, sxy = 0
    for (const p of use) { sxx += (p[coord] - mx) ** 2; sxy += (p[coord] - mx) * (p[key] - my) }
    b = sxx ? sxy / sxx : 0
    a = my - b * mx
    const res = use.map((p) => Math.abs(p[key] - (a + b * p[coord]))).sort((u, v) => u - v)
    const cut = Math.max(0.6, res[Math.floor(res.length * 0.7)] * 1.5)
    use = use.filter((p) => Math.abs(p[key] - (a + b * p[coord])) <= cut)
  }
  return { a, b, n: use.length }
}
const fx = fit('dx', 'x'), fy = fit('dy', 'y')
console.log('blocks', pts.length, 'dx =', fx.a.toFixed(2), '+', fx.b.toExponential(2), '*x (n', fx.n, ')  dy =', fy.a.toFixed(2), '+', fy.b.toExponential(2), '*y (n', fy.n, ')')

const out = Buffer.alloc(w * h * 3)
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const sx = Math.min(w - 1.001, Math.max(0, x + fx.a + fx.b * x)), sy = Math.min(h - 1.001, Math.max(0, y + fy.a + fy.b * y))
  const x0 = Math.floor(sx), y0 = Math.floor(sy), ax = sx - x0, ay = sy - y0
  for (let k = 0; k < 3; k++) {
    const v = (xx, yy) => G[(yy * w + xx) * 3 + k]
    out[(y * w + x) * 3 + k] = Math.round(v(x0, y0) * (1 - ax) * (1 - ay) + v(x0 + 1, y0) * ax * (1 - ay) + v(x0, y0 + 1) * (1 - ax) * ay + v(x0 + 1, y0 + 1) * ax * ay)
  }
}
await sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toFile(outp)

let e = 0, n = 0
for (const p of pts) { const r = Math.hypot(p.dx - (fx.a + fx.b * p.x), p.dy - (fy.a + fy.b * p.y)); if (r < 2) { e += r; n++ } }
console.log('mean residual (inliers)', (e / Math.max(1, n)).toFixed(2), 'px over', n)
