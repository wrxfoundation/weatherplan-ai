#!/usr/bin/env node
/**
 * 같은 자리를 1:1로 나란히 — 붙인 경계·색 테·잔무늬를 볼 때 쓴다(축소판으로는 안 보인다).
 *
 *   node scripts/art-finish/compare.mjs out.jpg x y w h before.png after.png [more.png …]
 */
import sharp from 'sharp'
import { cli } from './lib.mjs'

const USAGE = 'usage: node scripts/art-finish/compare.mjs out.jpg x y w h a.png b.png …'
const args = cli({}, USAGE)
if (args._.length < 6) { console.error(USAGE); process.exit(2) }
const [out, x, y, w, h, ...files] = args._
const r = { left: +x, top: +y, width: +w, height: +h }
const bufs = await Promise.all(files.map((f) => sharp(f).removeAlpha().extract(r).toBuffer()))
await sharp({ create: { width: (r.width + 8) * files.length - 8, height: r.height, channels: 3, background: '#fff' } })
  .composite(bufs.map((b, i) => ({ input: b, left: i * (r.width + 8), top: 0 }))).jpeg({ quality: 90 }).toFile(out)
console.log('ok', out)
