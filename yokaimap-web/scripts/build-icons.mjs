#!/usr/bin/env node
/**
 * 사이트 아이콘 세트 — 파비콘·앱 아이콘을 브랜드 인장 하나에서 만든다.
 *
 *   npm i --no-save sharp
 *   node scripts/build-icons.mjs
 *
 * 전에는 favicon.svg 한 장이 <text font-family="serif">怪</text>였다. 브라우저 탭의 怪가
 * OS 서체로 그려져 헤더 인장과 얼굴이 달랐고, 색(#d94f36)과 어두운 테두리도 헤더 인장
 * (--seal #b23b26, 테두리 없음)과 어긋나 있었다. 애플 터치 아이콘·매니페스트 아이콘은
 * 아예 없어서 홈 화면에 추가하면 페이지 스크린샷이 아이콘이 됐다.
 *
 * 이제 전부 src/ui/sealGlyphs.js의 같은 윤곽선에서 나온다. 인장 글자를 바꾸면
 * build-seal-glyphs.mjs → 이 스크립트 순서로 다시 돌린다.
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEAL_GLYPHS, BRAND_GLYPH } from '../src/ui/sealGlyphs.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUB = join(ROOT, 'public')
let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('❌ sharp가 없습니다 — npm i --no-save sharp')
  process.exit(1)
}

// 헤더 .brand-seal과 같은 값. 색은 밝은 테마의 --seal이다(탭은 테마를 모른다).
const SEAL = '#b23b26'
const INK = '#ffffff'
const PAPER = '#f4efe3' // index.html theme-color와 같은 한지색
const d = SEAL_GLYPHS[BRAND_GLYPH]
if (!d) throw new Error('브랜드 인장 윤곽선이 없다 — build-seal-glyphs.mjs를 먼저 돌린다')

/**
 * size: 캔버스 · em: 글자 크기(px) · radius: 모서리(0이면 꽉 찬 정사각) · bg: 바깥 배경
 * 헤더 인장은 30px 상자에 17px 글자(0.57)다. 16px 탭에서 읽히도록 파비콘은 0.62로 조금 키운다.
 */
function svg({ size, em, radius = 0, full = false }) {
  const off = (size - em) / 2
  const s = em / 1000
  const plate = full
    ? `<rect width="${size}" height="${size}" fill="${SEAL}"/>`
    : `<rect width="${size}" height="${size}" rx="${radius}" fill="${SEAL}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${plate}<path transform="translate(${off} ${off}) scale(${s})" fill="${INK}" d="${d}"/></svg>`
}

// 1) SVG 파비콘 — 64 캔버스, 헤더 인장과 같은 모서리 비율(30px에 4px ≈ 64에 8.5)
const favSvg = svg({ size: 64, em: 40, radius: 9 })
writeFileSync(join(PUB, 'favicon.svg'), favSvg + '\n')

const png = (o, w = o.size) => sharp(Buffer.from(svg(o))).resize(w, w).png({ compressionLevel: 9 }).toBuffer()

// 2) favicon.ico — SVG를 못 쓰는 곳(구형 브라우저·일부 크롤러)은 /favicon.ico를 직접 찾는다.
//    ICO는 PNG를 그대로 품을 수 있으므로 16·32·48을 넣는다.
const icoSizes = [16, 32, 48]
const pngs = await Promise.all(icoSizes.map((w) => png({ size: 64, em: 40, radius: 9 }, w)))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(pngs.length, 4)
let offset = 6 + 16 * pngs.length
const dir = pngs.map((buf, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(icoSizes[i], 0)
  e.writeUInt8(icoSizes[i], 1)
  e.writeUInt8(0, 2)
  e.writeUInt8(0, 3)
  e.writeUInt16LE(1, 4)
  e.writeUInt16LE(32, 6)
  e.writeUInt32LE(buf.length, 8)
  e.writeUInt32LE(offset, 12)
  offset += buf.length
  return e
})
writeFileSync(join(PUB, 'favicon.ico'), Buffer.concat([header, ...dir, ...pngs]))

// 3) 애플 터치 아이콘 — iOS가 모서리를 직접 깎으므로 꽉 찬 정사각으로 준다
writeFileSync(join(PUB, 'apple-touch-icon.png'), await png({ size: 180, em: 100, full: true }))

// 4) 매니페스트 아이콘 — any는 둥근 인장 그대로, maskable은 안전 영역(지름 80% 원) 안에 글자를 둔다
writeFileSync(join(PUB, 'icon-192.png'), await png({ size: 192, em: 120, radius: 27 }))
writeFileSync(join(PUB, 'icon-512.png'), await png({ size: 512, em: 320, radius: 72 }))
writeFileSync(join(PUB, 'icon-maskable-512.png'), await png({ size: 512, em: 256, full: true }))

const manifest = {
  name: '한국요괴지도',
  short_name: '요괴지도',
  description: '출처와 검증등급을 붙인 한국 요괴·신격·설화·노래 전승지 지도',
  lang: 'ko',
  start_url: '/',
  // 아이콘을 주려는 것이지 앱 동작을 바꾸려는 것이 아니다 — 브라우저 UI를 그대로 둔다
  display: 'browser',
  theme_color: PAPER,
  background_color: PAPER,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}
writeFileSync(join(PUB, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n')

const kb = (f) => Math.round(readFileSync(join(PUB, f)).length / 102.4) / 10
console.log(
  `✅ 아이콘 — favicon.svg ${kb('favicon.svg')}KB · favicon.ico ${kb('favicon.ico')}KB(16·32·48) · apple-touch-icon ${kb('apple-touch-icon.png')}KB · icon-192/512/maskable · manifest`,
)
