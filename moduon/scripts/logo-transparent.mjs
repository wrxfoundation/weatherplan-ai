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
  if (a <= 0.004) { // 사실상 흰색 → 완전 투명
    outPng.data[i] = outPng.data[i + 1] = outPng.data[i + 2] = outPng.data[i + 3] = 0
    continue
  }
  const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)))
  outPng.data[i] = un(r)
  outPng.data[i + 1] = un(g)
  outPng.data[i + 2] = un(b)
  outPng.data[i + 3] = Math.round(a * 255)
}
writeFileSync(out, PNG.sync.write(outPng))
console.log(`[logo] 투명화 완료 → public/assets/brand/logo-moduon.png (${width}x${height})`)
