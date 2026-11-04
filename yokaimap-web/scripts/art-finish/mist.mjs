#!/usr/bin/env node
/**
 * 금빛 안개 + 푸른 안개, 물 위 햇빛 반짝임을 얹는다(그림은 다시 그리지 않는다).
 *
 *   node scripts/art-finish/mist.mjs in.png out.png --bands scripts/art-finish/mist-bands/hanyang.json
 *     [--mask-src pre.png] [--gold 0.6] [--blue 0.6] [--glints 0.85] [--seed 7] [--preview p.jpg]
 *
 *   --bands     안개 띠·해·반짝임 구역 설정(JSON). 띠는 그림마다 다르다 — 예시 파일을 복사해 맞춘다
 *   --mask-src  '무엇이 앞에 있나'·'어디가 물인가'를 이 판으로 판단한다(색감 섞기 전 판). 안 주면 in.png
 *   --gold      금빛 안개 세기(기본 0.6) · --blue 푸른 안개 세기(기본 0.6) · --glints 반짝임 세기(기본 0.85)
 *   --preview   띠 자리를 칠한 축소판 — 새 그림에 띠를 잡을 때 본다(금빛=노랑, 쪽빛=하늘, 가까운 덩어리=자주)
 *
 * 금빛은 해 쪽(햇빛 받은 실오라기), 푸른빛은 그늘·먼 곳(넓은 베일). 한 띠 안에서 금빛 → 쪽빛으로 넘어가기도 한다.
 *  - 띠: 중심선이 x를 따라 출렁이고, 흐름 방향으로 늘인 잡음으로 쪼개 실오라기처럼, 군데군데 끊긴다.
 *  - 뒤로 흐름: hide "near" = 짙은 덩어리(가까운 봉우리·해태·소나무) 뒤로 지나가고 옅은 먼 산은 덮는다.
 *               hide "pix" = 종이가 아닌 화소 위에서만 옅어진다.
 *  - 섞는 법(OKLab): 금빛을 곱하면 그림이 탁해진다. 어두운 곳은 안개 밝기로 들어 올리고 색만 금빛·쪽빛 쪽으로.
 *  - 빛살·해 원반은 그리지 않는다(욱일 도상 금지 — ART_TEMPLATE.md §5).
 */
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { cli, need, rgb2lab, lab2lin, toByte, smooth, toBuf, dilate, fillEnclosed } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/mist.mjs in.png out.png --bands bands.json [--mask-src pre.png] [--gold 0.6] [--blue 0.6] [--glints 0.85] [--seed 7] [--preview p.jpg]'
const args = cli({
  bands: { type: 'string' }, 'mask-src': { type: 'string' }, gold: { type: 'string' }, blue: { type: 'string' },
  glints: { type: 'string' }, seed: { type: 'string' }, preview: { type: 'string' },
}, USAGE)
need(args, 2, USAGE)
if (!args.bands) { console.error(USAGE); process.exit(2) }
const [inp, outp] = args._
const AG = +(args.gold ?? 0.6), AB = +(args.blue ?? 0.6), GL = +(args.glints ?? 0.85), SEED = +(args.seed ?? 7)
const cfg = JSON.parse(readFileSync(args.bands, 'utf8'))
const CG0 = cfg.goldChroma ?? 0.12, CB0 = cfg.blueChroma ?? 0.05
const NR = cfg.near?.radius ?? 9, NF = cfg.near?.maxHole ?? 1500

const { data, info } = await sharp(inp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, N = W * H
if (cfg.size && (cfg.size[0] !== W || cfg.size[1] !== H)) console.warn(`⚠️  띠 설정은 ${cfg.size.join('×')} 판 기준인데 그림은 ${W}×${H}다 — 띠가 엉뚱한 데 걸린다`)
const MS = args['mask-src'] ? await sharp(args['mask-src']).removeAlpha().raw().toBuffer() : data

// ---- 잡음(씨앗 고정 — 같은 설정이면 늘 같은 안개) ----
const rng = ((a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
})(SEED * 9973 + 1)
const P = new Uint8Array(512)
{
  const p = [...Array(256).keys()]
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]] }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + (b - a) * t
const grad = (h, x, y) => { const u = (h & 1) ? x : -x, v = (h & 2) ? y : -y; return (h & 4) ? u + v * 0.5 : u * 0.5 + v }
const noise = (x, y) => {
  const X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y, xi = X & 255, yi = Y & 255, u = fade(xf), v = fade(yf)
  const aa = P[P[xi] + yi], ab = P[P[xi] + yi + 1], ba = P[P[xi + 1] + yi], bb = P[P[xi + 1] + yi + 1]
  return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u), lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v)
}
const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); n += a; a *= 0.5; f *= 2.03 } return s / n }

// ---- 무엇이 앞에 있나 ----
const L = new Float32Array(N), obj = new Float32Array(N)
const S = 2, w = Math.ceil(W / S), h = Math.ceil(H / S), n2 = w * h // 띠는 반 해상도에서 계산한다
const strong = new Uint8Array(n2)
for (let p = 0; p < N; p++) {
  const r = MS[p * 3], g = MS[p * 3 + 1], b = MS[p * 3 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  L[p] = (0.3 * r + 0.59 * g + 0.11 * b) / 255
  obj[p] = Math.max(smooth(0.86, 0.66, L[p]), smooth(30, 70, mx - mn)) // 종이가 아닌 정도
  if (L[p] < 0.55 || mx - mn > 60) { const x = p % W, y = (p / W) | 0; strong[((y / S) | 0) * w + ((x / S) | 0)] = 1 }
}
const objB = await sharp(toBuf(obj), { raw: { width: W, height: H, channels: 1 } }).blur(2.2).extractChannel(0).raw().toBuffer()
// 가까운 덩어리: 짙은 먹·진한 색을 닫고(팽창 → 갇힌 빈 곳 메움 → 수축) 반 해상도에서 키운다
let near = fillEnclosed(dilate(strong, w, h, NR), w, h, NF)
{ const e = dilate(Uint8Array.from(near, (v) => 1 - v), w, h, NR); near = Uint8Array.from(e, (v) => 1 - v) }
const nearU = await sharp(toBuf(near), { raw: { width: w, height: h, channels: 1 } }).resize(W, H, { kernel: 'cubic' }).blur(4).extractChannel(0).raw().toBuffer()

// ---- 띠 ----  tone: 0 금빛 · 1 쪽빛 · [x0, x1] 그 구간에서 금빛 → 쪽빛 · { path, depth } 햇빛 길만 금빛
const path = cfg.path ?? { x: W / 2, y: H, slope: 0 }
const pathX = (y) => path.x + (y - path.y) * path.slope
const toneAt = (tone, x, y) => {
  if (typeof tone === 'number') return tone
  if (Array.isArray(tone)) return smooth(tone[0], tone[1], x)
  return 1 - tone.depth * Math.exp(-(((x - pathX(y)) / tone.path) ** 2))
}
const lay = () => ({ M: new Float32Array(n2), SP: new Float32Array(n2), SN: new Float32Array(n2), R: new Float32Array(n2) })
const Gd = lay(), Bl = lay()
cfg.bands.forEach((B, bi) => {
  const o1 = bi * 37.1 + SEED * 3.3, o2 = bi * 11.7 + 5.5, fil = B.fil ?? 0.68
  const cAt = (x) => B.y0 + B.A[0] * Math.sin(2 * Math.PI * x / B.lam[0] + B.ph[0]) + B.A[1] * Math.sin(2 * Math.PI * x / B.lam[1] + B.ph[1]) + B.slope * (x - W / 2)
  for (let yy = 0; yy < h; yy++) {
    const y = yy * S
    for (let xx = 0; xx < w; xx++) {
      const x = xx * S, c = cAt(x)
      if (Math.abs(y - c) > B.t0 * 4.5) continue
      const t = B.t0 * (0.65 + 0.7 * (0.5 + 0.5 * fbm(x / 420 + o1, o2, 3))) // 두께가 x를 따라 출렁
      const warp = 0.9 * B.t0 * fbm(x / 260 + o2, y / 140 + o1, 3)
      const v = (y + warp - c), d = v / t
      if (Math.abs(d) > 3.2) continue
      const prof = Math.exp(-d * d * 1.5)
      const n = fbm(x / B.sx + o1 * 0.7, v / B.sy + o2, 4) // 흐름 방향으로 늘인 실오라기
      const q = smooth(B.gap - 0.18, B.gap + 0.18, 0.5 + 0.5 * fbm(x / 520 + o2 * 1.3, o1 * 0.37, 3)) // 군데군데 끊김
      let dens = B.wgt * prof * ((1 - fil) + fil * smooth(-0.25, 0.55, n)) * (0.25 + 0.75 * q)
      if (B.edges) dens *= Math.max(smooth(B.edges[0], B.edges[1], x), smooth(W - B.edges[0], W - B.edges[1], x))
      if (B.xr) dens *= smooth(B.xr[0] - B.xf, B.xr[0] + B.xf, x) * (1 - smooth(B.xr[1] - B.xf, B.xr[1] + B.xf, x))
      if (dens <= 0.001) continue
      const tn = toneAt(B.tone, x, y), p = yy * w + xx
      for (const [Ly, f] of [[Gd, 1 - tn], [Bl, tn]]) {
        if (f <= 0.001) continue
        const dd = dens * f
        Ly.M[p] = 1 - (1 - Ly.M[p]) * (1 - dd)
        if (B.hide === 'near') Ly.SN[p] = Math.max(Ly.SN[p], B.behind * dd); else Ly.SP[p] = Math.max(Ly.SP[p], B.behind * dd)
      }
    }
  }
})
const up = async (A) => sharp(toBuf(A), { raw: { width: w, height: h, channels: 1 } }).resize(W, H, { kernel: 'cubic' }).blur(1.2).extractChannel(0).raw().toBuffer()
for (const Ly of [Gd, Bl]) {
  const Mb = await sharp(toBuf(Ly.M), { raw: { width: w, height: h, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer()
  for (let p = 0; p < n2; p++) Ly.R[p] = Math.max(0, Ly.M[p] - Mb[p] / 255) * 2.2 // 수채 번짐처럼 가장자리를 조금 진하게
  Ly.MU = await up(Ly.M); Ly.SPU = await up(Ly.SP); Ly.SNU = await up(Ly.SN); Ly.RU = await up(Ly.R)
}

// ---- 섞기(OKLab) — 쪽빛 겹을 먼저, 금빛 겹을 위에 ----
const sun = cfg.sun ?? { x: 0, y: 0, near: 300, far: 2000 }
const out = Buffer.from(data)
const GH = 80 * Math.PI / 180, BH = 245 * Math.PI / 180, LMG = 0.94, LMB = 0.88 // 금빛·쪽빛 색상각, 안개 밝기
const hideAt = (Ly, p, m) => Math.max(0.05, 1 - Math.min(0.9, Ly.SPU[p] / 255 / Math.max(0.05, m)) * (objB[p] / 255) - Math.min(0.95, Ly.SNU[p] / 255 / Math.max(0.05, m)) * (nearU[p] / 255))
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = y * W + x
  const mg = Gd.MU[p] / 255, mb = Bl.MU[p] / 255
  if (mg < 0.004 && mb < 0.004) continue
  const grain = 0.88 + 0.24 * (0.5 + 0.5 * noise(x / 3.1 + 91.7, y / 3.1 + 13.3)) // 한지 결처럼 잘게 얼룩
  const lit = smooth(sun.far, sun.near, Math.hypot(x - sun.x, y - sun.y)) // 해 쪽일수록 1
  let [Lc, A, B] = rgb2lab(data[p * 3], data[p * 3 + 1], data[p * 3 + 2])
  if (mb >= 0.004) {
    const a = Math.min(0.75, AB * mb * grain * hideAt(Bl, p, mb))
    if (a > 0.002) {
      const rim = Math.min(1, Bl.RU[p] / 255 * 2.5), C = CB0 + 0.03 * rim
      Lc = Lc + a * (LMB - Lc) * 0.75 - a * rim * 0.03
      A = A + a * (C * Math.cos(BH) - A); B = B + a * (C * Math.sin(BH) - B)
    }
  }
  if (mg >= 0.004) {
    const a = Math.min(0.85, AG * mg * grain * hideAt(Gd, p, mg))
    if (a > 0.002) {
      const rim = Math.min(1, Gd.RU[p] / 255 * 2.5), C = CG0 + 0.05 * rim + 0.02 * lit
      Lc = Lc + a * Math.max(0, LMG - Lc) * 0.85 + a * (0.012 + 0.02 * lit) - a * rim * 0.025
      A = A + a * (C * Math.cos(GH) - A); B = B + a * (C * Math.sin(GH) - B)
    }
  }
  const rgb = lab2lin(Math.min(1, Lc), A, B)
  for (let c = 0; c < 3; c++) out[p * 3 + c] = toByte(rgb[c])
}

// ---- 물 위 햇빛 반짝임: 잔물결의 밝은 곳에만, 햇빛 길을 따라 모이게, 짧은 가로 빛 ----
let ng = 0
if (GL > 0 && cfg.glints) {
  const G = cfg.glints
  const Lb = await sharp(Buffer.from(Uint8Array.from(L, (v) => Math.round(v * 255))), { raw: { width: W, height: H, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer()
  const isWater = (x, y) => {
    const p = y * W + x, r = MS[p * 3], g = MS[p * 3 + 1], b = MS[p * 3 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    if (mx - mn < 22) return false
    let hh; const d = mx - mn
    if (mx === r) hh = 60 * (((g - b) / d) % 6); else if (mx === g) hh = 60 * ((b - r) / d + 2); else hh = 60 * ((r - g) / d + 4)
    if (hh < 0) hh += 360
    return hh > 160 && hh < 225 && L[p] > 0.32 && L[p] < 0.9
  }
  const sg = (y) => G.spread + (y - G.y0) * G.spreadSlope // 햇빛 길은 아래로 갈수록 넓다
  const glints = []
  let tries = 0
  while (glints.length < G.count * GL && tries < 200000) {
    tries++
    const inPath = rng() < 0.72, y = Math.floor(G.y0 + rng() * (G.y1 - G.y0))
    const x = inPath ? Math.round(pathX(y) + (rng() + rng() + rng() - 1.5) * sg(y)) : Math.floor(rng() * W)
    if (x < 4 || x >= W - 4 || !isWater(x, y)) continue
    const p = y * W + x, crest = L[p] * 255 - Lb[p]
    if (crest < (inPath ? 1.5 : 5)) continue
    const nearPath = 1 - Math.min(1, Math.abs(x - pathX(y)) / (sg(y) * 1.6))
    glints.push({ x, y, len: 3 + rng() * (inPath ? 13 : 7), ht: 0.9 + rng() * 1.3, I: (inPath ? 0.45 + 0.55 * nearPath : 0.35) * (0.55 + 0.45 * rng()) })
  }
  const gl = new Float32Array(N)
  for (const g of glints) {
    const rx = g.len, ry = g.ht
    for (let yy = Math.floor(g.y - ry * 3); yy <= g.y + ry * 3; yy++) for (let xx = Math.floor(g.x - rx * 1.6); xx <= g.x + rx * 1.6; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      const e = ((xx - g.x) / rx) ** 2 + ((yy - g.y) / ry) ** 2, v = g.I * Math.exp(-e * 1.6), q = yy * W + xx
      if (v > gl[q]) gl[q] = v
    }
  }
  for (const g of glints.filter((g) => g.I > 0.78).slice(0, 14)) { // 가장 밝은 몇 곳만 부드러운 빛무리(빛살 없음)
    const R = 9 + g.len * 0.6
    for (let yy = Math.floor(g.y - R); yy <= g.y + R; yy++) for (let xx = Math.floor(g.x - R * 1.8); xx <= g.x + R * 1.8; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      const e = ((xx - g.x) / (R * 1.8)) ** 2 + ((yy - g.y) / R) ** 2
      if (e > 1) continue
      const v = 0.22 * g.I * (1 - e) ** 2, q = yy * W + xx
      gl[q] = 1 - (1 - gl[q]) * (1 - v)
    }
  }
  const glC = [255, 247, 222]
  for (let p = 0; p < N; p++) {
    const a = Math.min(1, gl[p] * GL)
    if (a < 0.003) continue
    for (let c = 0; c < 3; c++) { const v = out[p * 3 + c]; out[p * 3 + c] = Math.round(255 - (255 - v) * (1 - a * glC[c] / 255)) }
  }
  ng = glints.length
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(outp)

if (args.preview) {
  const pv = Buffer.alloc(N * 3)
  for (let p = 0; p < N; p++) {
    const mg = Gd.MU[p] / 255, mb = Bl.MU[p] / 255, nr = nearU[p] / 255
    for (let c = 0; c < 3; c++) pv[p * 3 + c] = Math.min(255, Math.round(data[p * 3 + c] * 0.3 + 255 * [1, 0.8, 0.1][c] * mg * 0.9 + 255 * [0.1, 0.7, 1][c] * mb * 0.9 + [60, 0, 60][c] * nr * 0.35))
  }
  await sharp(pv, { raw: { width: W, height: H, channels: 3 } }).resize(700).jpeg({ quality: 85 }).toFile(args.preview)
}
console.log('bands', cfg.bands.length, 'glints', ng, '→', outp)
