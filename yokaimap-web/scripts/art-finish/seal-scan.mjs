#!/usr/bin/env node
/**
 * 낙관(붉은 도장) 후보를 찾는다 — 생성 모델이 '낙관 금지'를 넣어도 귀퉁이·바위·하늘에 찍는다.
 *
 *   node scripts/art-finish/seal-scan.mjs a.png b.png …
 *   node scripts/art-finish/seal-scan.mjs a.png --sheet seals.jpg     후보를 잘라 한 장으로
 *
 * 주홍 인주 화소를 3px 팽창해 묶은 덩어리 중 정사각형에 가깝고(가로세로 비 0.6~1.6) 25~130px이며,
 * 상자 안 붉은 비율이 0.2~0.85이고 붉지 않은 곳이 대부분 밝은(종이·글자 바탕) 것만 고른다.
 * 학 정수리·태극·감·단청 기둥도 걸리므로 판정은 눈으로 한다. 낙관이면 fill.mjs로 지운다.
 */
import sharp from 'sharp'
import { cli } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/seal-scan.mjs img.png … [--sheet out.jpg]'
const args = cli({ sheet: { type: 'string' } }, USAGE)
if (!args._.length) { console.error(USAGE); process.exit(2) }

const tiles = []
for (const f of args._) {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, N = W * H
  const red = new Uint8Array(N)
  for (let p = 0; p < N; p++) { const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2]; if (r > 140 && r - g > 70 && r - b > 60) red[p] = 1 }
  const d = new Uint8Array(N)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!red[y * W + x]) continue
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H) d[Y * W + X] = 1 }
  }
  const seen = new Uint8Array(N), found = []
  for (let p0 = 0; p0 < N; p0++) {
    if (!d[p0] || seen[p0]) continue
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    const st = [p0]
    seen[p0] = 1
    while (st.length) {
      const c = st.pop(), x = c % W, y = (c / W) | 0
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + i, Y = y + j
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue
        const q = Y * W + X
        if (d[q] && !seen[q]) { seen[q] = 1; st.push(q) }
      }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, ar = bw / bh
    if (bw < 25 || bh < 25 || bw > 130 || bh > 130 || ar < 0.6 || ar > 1.6) continue
    let nr = 0, nl = 0, nn = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = y * W + x
      if (red[p]) nr++
      else { nn++; if (0.3 * data[p * 3] + 0.59 * data[p * 3 + 1] + 0.11 * data[p * 3 + 2] > 170) nl++ }
    }
    const fill = nr / (bw * bh), lt = nl / Math.max(1, nn)
    if (fill < 0.2 || fill > 0.85 || lt < 0.55) continue
    found.push({ x0, y0, x1, y1, fill: +fill.toFixed(2), lt: +lt.toFixed(2) })
    const tx = Math.max(0, x0 - 30), ty = Math.max(0, y0 - 30)
    tiles.push({ f, left: tx, top: ty, width: Math.min(W - tx, bw + 60), height: Math.min(H - ty, bh + 60) })
  }
  console.log(f, JSON.stringify(found))
}
if (args.sheet && tiles.length) {
  const bs = []
  for (const { f, ...r } of tiles) bs.push(await sharp(f).extract(r).resize(200, 200, { fit: 'contain', background: '#fff' }).toBuffer())
  await sharp({ create: { width: 210 * bs.length, height: 200, channels: 3, background: '#ddd' } })
    .composite(bs.map((b, i) => ({ input: b, left: i * 210, top: 0 }))).jpeg({ quality: 85 }).toFile(args.sheet)
  console.log('sheet', tiles.length, '→', args.sheet)
}
