#!/usr/bin/env node
/**
 * 색감 섞기 — 다른 그림의 색과 빛만 옮겨 온다. 붓결·선·한지 결은 그대로 둔다.
 *
 *   node scripts/art-finish/colormix.mjs base.png recolour-aligned.png out.png \
 *     [--apply pre.png] [--k 0.75] [--kl 0.85] [--floor 0.95] [--rows "y:k,y:k,…"]
 *
 *   base.png              생성 모델에 보낸 판
 *   recolour-aligned.png  그 판을 참고 그림 색으로 '다시 칠한' 것을 align.mjs로 base에 맞춘 것
 *   --apply               색을 더할 바탕(기본 base). 안개 얹기 전 판을 주면 안개를 나중에 새 색 위에 다시 얹을 수 있다
 *   --k                   옮길 세기(기본 0.75 — v6. 진하게는 1.0)
 *   --kl                  밝기 변화에 거는 몫(기본 0.85. 진하게는 0.9)
 *   --floor               원래 채도가 높던 색(초가·단청·해태 금빛)은 이 비율 아래로 탁해지지 않는다(기본 0.95)
 *   --rows                가로띠별 세기 배율 "y:배율" — 사이는 부드럽게 잇는다. 따뜻한 주제가 몰린 띠는 0.45
 *   --diff-preview        옮긴 색 차이를 축소판으로 저장(확인용)
 *
 * 다시 칠한 판을 그대로 쓰면 모델이 붓결과 선까지 바꿔 놓는다. 그래서 두 판의 OKLab 차이만 구해서 더한다.
 *  - 믿을 곳만: 잔무늬(고주파 밝기)가 두 판에서 같은 곳만 차이를 믿고, 다시 그린 곳은 둘레 차이로 메운다.
 *  - 윤곽을 넘지 않게: 차이를 '원본 색이 크게 바뀌는 경계'에서 멈추는 필터(도메인 변환, Gastal·Oliveira 2011)로
 *    번지게 한다 — 하늘 파랑이 해태 금빛이나 메달 원판으로 새지 않는다.
 *  - 진한 색을 반대색으로 밀지 않는다 — 금빛 윤곽에 하늘 파랑이 묻으면 청록 테가 생긴다.
 */
import sharp from 'sharp'
import { cli, need, rgb2lab, lab2lin, toByte, fitGamut } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/colormix.mjs base.png recolour-aligned.png out.png [--apply pre.png] [--k 0.75] [--kl 0.85] [--floor 0.95] [--rows "y:k,…"] [--diff-preview d.jpg]'
const args = cli({
  apply: { type: 'string' }, k: { type: 'string' }, kl: { type: 'string' }, floor: { type: 'string' }, rows: { type: 'string' },
  'sigma-s': { type: 'string' }, 'sigma-r': { type: 'string' }, preblur: { type: 'string' }, 'diff-preview': { type: 'string' },
}, USAGE)
need(args, 3, USAGE)
const [op, gp, outp] = args._
const K = +(args.k ?? 0.75), KL = +(args.kl ?? 0.85), CFLOOR = +(args.floor ?? 0.95)
const SS = +(args['sigma-s'] ?? 36) // 번지는 거리(px)
const SR = +(args['sigma-r'] ?? 0.07) // 이만큼 색이 바뀌는 경계에서 멈춘다
const PB = +(args.preblur ?? 1.2)
const ROWS = (args.rows ?? '').split(',').filter(Boolean).map((t) => t.split(':').map(Number))
const rowGain = (y) => {
  if (!ROWS.length) return 1
  if (y <= ROWS[0][0]) return ROWS[0][1]
  for (let i = 1; i < ROWS.length; i++) if (y <= ROWS[i][0]) {
    const [y0, k0] = ROWS[i - 1], [y1, k1] = ROWS[i], t = (y - y0) / (y1 - y0)
    return k0 + (k1 - k0) * t * t * (3 - 2 * t)
  }
  return ROWS[ROWS.length - 1][1]
}

const O = await sharp(op).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = O.info.width, H = O.info.height, N = W * H
const G = await sharp(gp).removeAlpha().resize(W, H, { fit: 'fill' }).raw().toBuffer()
const Ob = await sharp(op).removeAlpha().blur(PB).raw().toBuffer()
const Gb = await sharp(gp).removeAlpha().resize(W, H, { fit: 'fill' }).blur(PB).raw().toBuffer()
const Og = await sharp(op).removeAlpha().blur(1.5).raw().toBuffer()
const lab = (buf) => {
  const L = new Float32Array(N), A = new Float32Array(N), B = new Float32Array(N)
  for (let p = 0; p < N; p++) { const [l, a, b] = rgb2lab(buf[p * 3], buf[p * 3 + 1], buf[p * 3 + 2]); L[p] = l; A[p] = a; B[p] = b }
  return [L, A, B]
}
const [Lo, Ao, Bo] = lab(O.data), [Lg] = lab(G), [Lob, Aob, Bob] = lab(Ob), [Lgb, Agb, Bgb] = lab(Gb), [Gl, Ga, Gc] = lab(Og)
let Lt = Lo, At = Ao, Bt = Bo
if (args.apply) {
  const P = await sharp(args.apply).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  if (P.info.width !== W || P.info.height !== H) { console.error(`--apply(${P.info.width}×${P.info.height})가 base(${W}×${H})와 크기가 다르다`); process.exit(1) }
  ;[Lt, At, Bt] = lab(P.data)
}

// 믿음: 고주파 밝기가 두 판에서 같을수록 1
const hp = (L, Lb) => Float32Array.from(L, (v, i) => v - Lb[i])
const ho = hp(Lo, Lob), hg = hp(Lg, Lgb)
const Wt = new Float32Array(N)
for (let p = 0; p < N; p++) { const e = (ho[p] - hg[p]) / 0.045; Wt[p] = Math.exp(-e * e) }
const cl = (v, m) => Math.max(-m, Math.min(m, v))
const DL = new Float32Array(N), DA = new Float32Array(N), DB = new Float32Array(N)
for (let p = 0; p < N; p++) {
  DL[p] = cl(Lgb[p] - Lob[p], 0.4) * Wt[p]
  DA[p] = cl(Agb[p] - Aob[p], 0.16) * Wt[p]
  DB[p] = cl(Bgb[p] - Bob[p], 0.16) * Wt[p]
}
const WW = Float32Array.from(Wt)

// 도메인 변환 재귀 필터 — 안내 판은 원본(살짝 흐린) OKLab. 믿음(WW)도 같이 걸러 정규화한다
const dHx = new Float32Array(N), dVy = new Float32Array(N), rat = SS / SR
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = y * W + x
  if (x > 0) dHx[p] = 1 + rat * (Math.abs(Gl[p] - Gl[p - 1]) + 1.5 * Math.abs(Ga[p] - Ga[p - 1]) + 1.5 * Math.abs(Gc[p] - Gc[p - 1]))
  if (y > 0) dVy[p] = 1 + rat * (Math.abs(Gl[p] - Gl[p - W]) + 1.5 * Math.abs(Ga[p] - Ga[p - W]) + 1.5 * Math.abs(Gc[p] - Gc[p - W]))
}
const IT = 3
for (let i = 0; i < IT; i++) {
  const sH = SS * Math.sqrt(3) * 2 ** (IT - (i + 1)) / Math.sqrt(4 ** IT - 1), la = -Math.SQRT2 / sH
  const Vh = Float32Array.from(dHx, (d) => Math.exp(la * d)), Vv = Float32Array.from(dVy, (d) => Math.exp(la * d))
  for (const F of [DL, DA, DB, WW]) {
    for (let y = 0; y < H; y++) {
      const r = y * W
      for (let x = 1; x < W; x++) F[r + x] += Vh[r + x] * (F[r + x - 1] - F[r + x])
      for (let x = W - 2; x >= 0; x--) F[r + x] += Vh[r + x + 1] * (F[r + x + 1] - F[r + x])
    }
    for (let x = 0; x < W; x++) {
      for (let y = 1; y < H; y++) { const p = y * W + x; F[p] += Vv[p] * (F[p - W] - F[p]) }
      for (let y = H - 2; y >= 0; y--) { const p = y * W + x; F[p] += Vv[p + W] * (F[p + W] - F[p]) }
    }
  }
}

const out = Buffer.alloc(N * 3)
for (let p = 0; p < N; p++) {
  const w = Math.max(1e-4, WW[p]), dl = DL[p] / w, da = DA[p] / w, db = DB[p] / w
  const kk = K * rowGain((p / W) | 0)
  // 진한 색을 반대색 쪽으로 미는 몫은 줄인다
  const c0 = Math.hypot(At[p], Bt[p]), cd = Math.hypot(da, db)
  let sop = 1
  if (c0 > 0.02 && cd > 1e-4) {
    const cs = (At[p] * da + Bt[p] * db) / (c0 * cd)
    sop = 1 - (cs < 0 ? Math.min(1, Math.max(0, (-cs - 0.25) / 0.6)) : 0) * Math.min(1, Math.max(0, (c0 - 0.03) / 0.05))
  }
  let na = At[p] + kk * da * sop, nb = Bt[p] + kk * db * sop
  if (CFLOOR > 0) {
    const c1 = Math.hypot(na, nb)
    if (c0 > 0.06 && c1 < CFLOOR * c0) { const s = CFLOOR * c0 / Math.max(1e-6, c1); na *= s; nb *= s }
  }
  const rgb = fitGamut((f) => lab2lin(Math.max(0, Math.min(1, Lt[p] + f * kk * KL * dl)), At[p] + f * (na - At[p]), Bt[p] + f * (nb - Bt[p])))
  for (let c = 0; c < 3; c++) out[p * 3 + c] = toByte(rgb[c])
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(outp)

if (args['diff-preview']) {
  const v = Buffer.alloc(N * 3)
  for (let p = 0; p < N; p++) {
    const w = Math.max(1e-4, WW[p]), rgb = lab2lin(0.75 + DL[p] / w, DA[p] / w * 1.5, DB[p] / w * 1.5)
    for (let c = 0; c < 3; c++) v[p * 3 + c] = toByte(rgb[c])
  }
  await sharp(v, { raw: { width: W, height: H, channels: 3 } }).resize(600).jpeg({ quality: 85 }).toFile(args['diff-preview'])
}
console.log('k', K, 'rows', ROWS.length ? args.rows : '-', '→', outp)
