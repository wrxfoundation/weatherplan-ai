#!/usr/bin/env node
/**
 * 무지 바탕(종이·안개·하늘) 위의 작은 티를 지운다 — 낙관, 붙이고 남은 성벽 조각 같은 것.
 *
 *   node scripts/art-finish/fill.mjs in.png out.png --hole x:y:w:h --texture x:y
 *
 *   --hole     지울 네모
 *   --texture  같은 크기의 깨끗한 바탕이 있는 곳(왼쪽 위). 거기서 종이 결만 빌려 온다
 *
 * 둘레 색으로 매끈하게 메운 뒤(조화 보간 — 둘레에서 안쪽으로 번지는 평균) 깨끗한 곳의 고주파(종이 결)만
 * 얹는다. 결을 안 얹으면 매끈한 얼룩이 되고, 통째로 복사하면 둘레와 밝기가 안 맞는다.
 * 결 빌려 올 곳은 밝기 차이가 작은(무늬 없는) 곳이어야 한다 — 무늬가 있으면 그 선이 그대로 옮겨 온다.
 */
import sharp from 'sharp'
import { cli, need } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/fill.mjs in.png out.png --hole x:y:w:h --texture x:y'
const args = cli({ hole: { type: 'string' }, texture: { type: 'string' } }, USAGE)
need(args, 2, USAGE)
if (!args.hole || !args.texture) { console.error(USAGE); process.exit(2) }
const [ip, op] = args._
const [X, Y, w, h] = args.hole.split(':').map(Number)
const [TX, TY] = args.texture.split(':').map(Number)

const { data, info } = await sharp(ip).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
if (X < 0 || Y < 0 || X + w > W || Y + h > H || TX < 0 || TY < 0 || TX + w > W || TY + h > H) { console.error('--hole·--texture가 판 밖으로 나간다'); process.exit(1) }
if (TX < X + w && X < TX + w && TY < Y + h && Y < TY + h) { console.error('--texture가 --hole과 겹친다 — 깨끗한 다른 곳을 고른다'); process.exit(1) }

const out = Buffer.from(data)
const blurT = await sharp(ip).removeAlpha().extract({ left: TX, top: TY, width: w, height: h }).blur(2).raw().toBuffer()
const rawT = await sharp(ip).removeAlpha().extract({ left: TX, top: TY, width: w, height: h }).raw().toBuffer()

for (let c = 0; c < 3; c++) {
  const F = new Float32Array((w + 2) * (h + 2)), at = (i, j) => (j + 1) * (w + 2) + (i + 1)
  const get = (x, y) => data[(Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 3 + c]
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) F[at(i, j)] = (i < 0 || j < 0 || i >= w || j >= h) ? get(X + i, Y + j) : get(X + i, Y - 1)
  // 판 가장자리에 붙은 구멍은 판 밖 대신 자기 값을 쓴다(밖을 당겨 오면 구멍 색이 다시 번진다)
  for (let it = 0; it < 1500; it++) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const self = F[at(i, j)]
    const l = X + i - 1 < 0 ? self : F[at(i - 1, j)]
    const r = X + i + 1 >= W ? self : F[at(i + 1, j)]
    const u = Y + j - 1 < 0 ? self : F[at(i, j - 1)]
    const d = Y + j + 1 >= H ? self : F[at(i, j + 1)]
    F[at(i, j)] = 0.25 * (l + r + u + d)
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const t = rawT[(j * w + i) * 3 + c] - blurT[(j * w + i) * 3 + c]
    out[((Y + j) * W + X + i) * 3 + c] = Math.max(0, Math.min(255, Math.round(F[at(i, j)] + t)))
  }
}
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(op)
console.log('wrote', op)
