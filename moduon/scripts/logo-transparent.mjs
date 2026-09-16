// ─── 브랜드 로고 흰 배경 자동 투명화 (prebuild) ─────────────────────
// public/assets/brand/logo-moduon-src.png(.jpg) 가 있으면 흰 배경을
// 언멀티플라이 방식으로 투명 처리해 logo-moduon.png 로 저장한다.
// 원리: 흰 바탕 합성 c = fg·a + 255·(1−a) 를 역산 — a = 1 − min(r,g,b)/255,
// fg = (c − 255·(1−a)) / a. 그라디언트·안티앨리어싱 가장자리가 헤일로 없이 살아난다.
// 소스가 없으면 조용히 통과(빌드 비차단). 소스 파일은 커밋하지 않아도 된다.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'public', 'assets', 'brand')
mkdirSync(dir, { recursive: true })

const srcPng = join(dir, 'logo-moduon-src.png')
const srcJpg = join(dir, 'logo-moduon-src.jpg')
const out = join(dir, 'logo-moduon.png')

let width, height, data
if (existsSync(srcPng)) {
  const p = PNG.sync.read(readFileSync(srcPng))
  ;({ width, height, data } = p)
} else if (existsSync(srcJpg)) {
  const j = jpeg.decode(readFileSync(srcJpg), { useTArray: true })
  ;({ width, height, data } = j)
} else {
  console.log('[logo] 소스 없음(public/assets/brand/logo-moduon-src.png|jpg) — 건너뜀')
  process.exit(0)
}

const outPng = new PNG({ width, height })
for (let i = 0; i < width * height * 4; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const a = 1 - Math.min(r, g, b) / 255
  // JPEG 계열 원본은 흰 바탕에 (250,245,255) 같은 노이즈가 깔려 있다 — 언멀티플라이하면 알파 0.04 의 보라 점이 된다.
  // 세 채널이 전부 밝으면 노이즈로 보고 투명 처리. 로고 색은 채도가 높아 안티앨리어싱 가장자리는 이 문턱에 걸리지 않는다.
  if (a <= 0.004 || (r > 232 && g > 232 && b > 232)) { // 사실상 흰색 → 완전 투명
    outPng.data[i] = outPng.data[i + 1] = outPng.data[i + 2] = outPng.data[i + 3] = 0
    continue
  }
  const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)))
  outPng.data[i] = un(r)
  outPng.data[i + 1] = un(g)
  outPng.data[i + 2] = un(b)
  outPng.data[i + 3] = Math.round(a * 255)
}
// ── 여백 트림 + 마크(상단 'M') 정사각 크롭 ──
// 원본은 흰 여백이 넓어 헤더에서 글자가 작아진다. 알파 경계로 트림하고, 마크와 워드마크 사이의
// 빈 띠(가운데 1/3 안에서 가장 넓은 완전 투명 행 구간)를 찾아 그 위쪽을 정사각(패비콘·소형 마크)으로 따로 저장한다.
const A = (x, y) => outPng.data[(y * width + x) * 4 + 3]
const rowHas = (y, x0 = 0, x1 = width) => { for (let x = x0; x < x1; x++) if (A(x, y) > 8) return true; return false }
const colHas = (x, y0 = 0, y1 = height) => { for (let y = y0; y < y1; y++) if (A(x, y) > 8) return true; return false }
const bounds = (x0, y0, x1, y1) => {
  let t = y0, b = y1 - 1, l = x0, r = x1 - 1
  while (t < b && !rowHas(t, x0, x1)) t++
  while (b > t && !rowHas(b, x0, x1)) b--
  while (l < r && !colHas(l, t, b + 1)) l++
  while (r > l && !colHas(r, t, b + 1)) r--
  return { l, t, r, b }
}
const crop = (l, t, r, b, pad = 0, square = false) => {
  let w = r - l + 1, h = b - t + 1
  let cw = w + pad * 2, ch = h + pad * 2
  if (square) cw = ch = Math.max(cw, ch)
  const png = new PNG({ width: cw, height: ch })
  const ox = Math.floor((cw - w) / 2), oy = Math.floor((ch - h) / 2)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((t + y) * width + (l + x)) * 4, di = ((oy + y) * cw + (ox + x)) * 4
    for (let k = 0; k < 4; k++) png.data[di + k] = outPng.data[si + k]
  }
  return png
}
const full = bounds(0, 0, width, height)
const trimmed = crop(full.l, full.t, full.r, full.b, Math.round(width * 0.01))
writeFileSync(out, PNG.sync.write(trimmed))
console.log(`[logo] 투명화+트림 완료 → public/assets/brand/logo-moduon.png (${trimmed.width}x${trimmed.height})`)

// 마크 크롭 — 가운데 1/3 에서 가장 긴 빈 행 구간을 마크/워드마크 경계로 본다
let best = { y: -1, len: 0 }, run = 0
for (let y = full.t; y <= full.b; y++) {
  if (!rowHas(y, full.l, full.r + 1)) { run++; if (run > best.len && y > full.t + (full.b - full.t) * 0.25 && y < full.t + (full.b - full.t) * 0.85) best = { y: y - run + 1, len: run } }
  else run = 0
}
if (best.len >= 3) {
  const m = bounds(full.l, full.t, full.r + 1, best.y)
  const mark = crop(m.l, m.t, m.r, m.b, Math.round((m.r - m.l) * 0.06), true)
  writeFileSync(join(dir, 'logo-mark.png'), PNG.sync.write(mark))
  console.log(`[logo] 마크 크롭 → public/assets/brand/logo-mark.png (${mark.width}x${mark.height}, 경계 y=${best.y}~${best.y + best.len - 1})`)
} else {
  console.log('[logo] 마크/워드마크 경계를 찾지 못해 마크 크롭은 건너뜀')
}
