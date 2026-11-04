#!/usr/bin/env node
/**
 * 고쳐 그린 조각에서 '바뀐 곳'만 원본 판에 앉힌다.
 *
 *   node scripts/art-finish/paste.mjs full.png x y orig-crop.png gen-aligned.png out.png --poly "[[x,y], …]"
 *
 *   full.png         붙일 판(전체 그림)
 *   x y              조각의 왼쪽 위가 판에서 놓이는 자리
 *   orig-crop.png    생성 모델에 보낸 원래 조각
 *   gen-aligned.png  고쳐 그린 조각을 align.mjs로 orig-crop에 맞춘 것(크기가 같아야 한다)
 *   --poly           조각 좌표로 그린 다각형. 이 밖은 한 화소도 바꾸지 않는다
 *
 * 생성 모델은 '그것만 고쳐'라고 해도 둘레를 조금씩 다시 그린다. 그래서 통째로 붙이지 않고
 * (생성본 − 원본) 차이가 큰 곳 ∩ 다각형만 가져온다: 차이 14 넘는 곳 → 6px 팽창 → 갇힌 빈 곳 메움 →
 * 가장자리 2.5px 흐림. 색이 조금 틀어져 나온 판은 다각형 안에서 안 바뀐 화소로 채널별 비(±6%)를 맞춘다.
 */
import sharp from 'sharp'
import { cli, need, dilate, fillEnclosed, toBuf } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/paste.mjs full.png x y orig-crop.png gen-aligned.png out.png --poly "[[x,y],…]"'
const args = cli({ poly: { type: 'string' } }, USAGE)
need(args, 6, USAGE)
if (!args.poly) { console.error(USAGE); process.exit(2) }
const [fp, cxS, cyS, op, gp, outp] = args._
const CX = Number(cxS), CY = Number(cyS)

const F = await sharp(fp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const FW = F.info.width, FH = F.info.height
const O = await sharp(op).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const w = O.info.width, h = O.info.height, N = w * h
const Gi = await sharp(gp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
if (Gi.info.width !== w || Gi.info.height !== h) {
  console.error(`gen-aligned(${Gi.info.width}×${Gi.info.height})가 orig-crop(${w}×${h})과 크기가 다르다 — 먼저 align.mjs로 맞춘다`)
  process.exit(1)
}
const G = Gi.data
const Ob = await sharp(op).removeAlpha().blur(2).raw().toBuffer()
const Gb = await sharp(gp).removeAlpha().blur(2).raw().toBuffer()

const poly = JSON.parse(args.poly)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="black"/><polygon points="${poly.map((p) => p.join(',')).join(' ')}" fill="white"/></svg>`
const R = await sharp(Buffer.from(svg)).blur(5).extractChannel(0).raw().toBuffer()

const core = new Uint8Array(N)
for (let p = 0; p < N; p++) {
  let d = 0
  for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(Gb[p * 3 + k] - Ob[p * 3 + k]))
  if (d > 14 && R[p] > 20) core[p] = 1
}
const M = fillEnclosed(dilate(core, w, h, 6), w, h, 3000)
const Mb = await sharp(toBuf(M), { raw: { width: w, height: h, channels: 1 } }).blur(2.5).extractChannel(0).raw().toBuffer()

const sum = [[0, 0], [0, 0], [0, 0]]
for (let p = 0; p < N; p++) {
  if (R[p] < 128 || core[p]) continue
  for (let k = 0; k < 3; k++) { sum[k][0] += O.data[p * 3 + k]; sum[k][1] += G[p * 3 + k] }
}
const gain = sum.map(([a, b]) => (b > 0 ? Math.min(1.06, Math.max(0.94, a / b)) : 1))
console.log('gain', gain.map((v) => v.toFixed(3)))

const out = Buffer.from(F.data)
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const p = y * w + x, a = (Mb[p] / 255) * (R[p] / 255)
  if (a <= 0.003 || CX + x >= FW || CY + y >= FH) continue
  const fo = ((CY + y) * FW + CX + x) * 3
  for (let k = 0; k < 3; k++) out[fo + k] = Math.max(0, Math.min(255, Math.round(F.data[fo + k] * (1 - a) + G[p * 3 + k] * gain[k] * a)))
}
await sharp(out, { raw: { width: FW, height: FH, channels: 3 } }).png({ compressionLevel: 9 }).toFile(outp)
console.log('wrote', outp)
