#!/usr/bin/env node
/**
 * 채도 '강' — 한지 그림의 색을 톡톡하게 올린다(그림은 다시 그리지 않는다).
 *
 *   node scripts/art-finish/vivid.mjs in.png out.png
 *   node scripts/art-finish/vivid.mjs in.png out.png --cool 2.8 --red 1.3 --warm 0.95 --turn 10
 *
 *   --cool   초록·청록·쪽빛을 올리는 세기(기본 2.8 — v6 '강')
 *   --red    주홍·분홍(기본 1.3)
 *   --warm   황토·금빛(기본 0.95 — 초가·해태처럼 이미 진한 색이 주황으로 뜨지 않게 가장 적게)
 *   --turn   초록을 청록 쪽으로 돌리는 각도(기본 10° — 석록·하엽 느낌)
 *
 * 그냥 채도를 올리면 한지와 먹까지 누렇게 뜬다. 그래서 한지 색(밝고 저채도인 화소의 중앙값)을 기준축으로
 * 빼고 '남는 색'만 올린다 — 종이와 먹 회색은 그대로다. 이미 진한 색은 덜 올리고(vibrance), 거의 회색인 화소는
 * 안 올린다(잡티 방지). 색을 넓은 면(2.5px 흐린 판)과 잔무늬로 나눠 넓은 면만 크게 올리고 잔무늬는 30%만 —
 * 잔무늬까지 올리면 솔숲에 초록 잡티가 자글자글하게 뜬다. 대비는 건드리지 않는다(강물이 오히려 옅어 보였다).
 */
import sharp from 'sharp'
import { cli, need, rgb2lab, lab2lin, toByte, fitGamut, smooth } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/vivid.mjs in.png out.png [--cool 2.8] [--red 1.3] [--warm 0.95] [--turn 10]'
const args = cli({ cool: { type: 'string' }, red: { type: 'string' }, warm: { type: 'string' }, turn: { type: 'string' } }, USAGE)
need(args, 2, USAGE)
const [inp, outp] = args._
const Kc = +(args.cool ?? 2.8), Kr = +(args.red ?? 1.3), Kw = +(args.warm ?? 0.95)
const ROT = +(args.turn ?? 10) * Math.PI / 180
const SG = 2.5 // 넓은 면을 가르는 흐림
const HF = 0.3 // 잔무늬에 주는 몫

const { data, info } = await sharp(inp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, N = W * H
const blr = await sharp(inp).removeAlpha().blur(SG).raw().toBuffer()

// 한지 색: 밝고(L>0.95) 거의 무채색인 화소의 a·b·L 중앙값
const A = [], B = [], LL = []
for (let p = 0; p < N; p += 7) {
  const [L, a, b] = rgb2lab(data[p * 3], data[p * 3 + 1], data[p * 3 + 2])
  if (L > 0.95 && Math.hypot(a, b) < 0.03) { A.push(a); B.push(b); LL.push(L) }
}
const med = (v) => { const s = [...v].sort((x, y) => x - y); return s[s.length >> 1] }
const ap = med(A), bp = med(B), lp = med(LL)
const tint = (L) => Math.max(0, Math.min(1, (L - 0.2) / (lp - 0.2))) // 밝을수록 한지 기운이 많다

// 색상 띠(부드러운 경계): 황토 45~110°, 초록~쪽빛 110~290°, 나머지 주홍·분홍
const band = (hd) => {
  const w = smooth(35, 55, hd) * (1 - smooth(100, 120, hd)), c = smooth(100, 120, hd) * (1 - smooth(280, 300, hd))
  return [w, c, Math.max(0, 1 - w - c)]
}
const rot = (x, y, t) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]

const out = Buffer.alloc(N * 3)
for (let p = 0; p < N; p++) {
  const o = p * 3
  const [L, a, b] = rgb2lab(data[o], data[o + 1], data[o + 2]), [Lb, ab, bb] = rgb2lab(blr[o], blr[o + 1], blr[o + 2])
  const k = tint(L), kb = tint(Lb)
  const la = ab - kb * ap, lb = bb - kb * bp // 넓은 면의 남는 색
  const ha = (a - k * ap) - la, hb = (b - k * bp) - lb // 잔무늬 색
  const C = Math.hypot(la, lb), hd = (Math.atan2(lb, la) * 180 / Math.PI + 360) % 360
  const [ww, wc, wr] = band(hd)
  const vib = 1 - Math.min(1, C / 0.22)
  const g = 1 + vib * (Kc * wc * smooth(0.006, 0.016, C) + Kr * wr * smooth(0.010, 0.030, C) + Kw * ww * smooth(0.020, 0.045, C))
  const gh = 1 + HF * (g - 1)
  const t = ROT ? ROT * smooth(105, 125, hd) * (1 - smooth(160, 180, hd)) * smooth(0.008, 0.02, C) : 0
  const [na, nb] = rot(la * g, lb * g, t), [qa, qb] = rot(ha * gh, hb * gh, t)
  const rgb = fitGamut((f) => lab2lin(L, k * ap + (la + (na - la) * f) + (ha + (qa - ha) * f), k * bp + (lb + (nb - lb) * f) + (hb + (qb - hb) * f)))
  for (let c = 0; c < 3; c++) out[o + c] = toByte(rgb[c])
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(outp)
console.log('paper a·b', ap.toFixed(4), bp.toFixed(4), '→', outp)
