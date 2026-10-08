#!/usr/bin/env node
/**
 * 인장 글자를 SVG 윤곽선으로 뽑는다 — src/ui/sealGlyphs.js를 만든다.
 *
 *   npm i --no-save opentype.js @fontsource/noto-serif-kr
 *   node scripts/build-seal-glyphs.mjs
 *
 * 인장(분류 14종 + 브랜드 怪)은 지금까지 글자로 그렸다. 그런데 --font-serif의
 * 'Nanum Myeongjo'는 어디서도 로드되지 않아서, 맥에서는 Apple SD Gothic Neo(고딕),
 * 윈도에서는 바탕, 안드로이드에서는 Noto Serif로 — 같은 인장이 OS마다 다른 얼굴로 떴다.
 * 웹폰트를 붙여도 해결되지 않는다. 구글·fontsource판 나눔명조에는 인장 15자 중 9자
 * (怪 宅 獸 疫 濟 堂 器 婚 街)가 아예 없어서, 한 줄에 서체가 섞인다.
 *
 * 그래서 인장을 글자가 아니라 아이콘으로 만든다. 15자를 모두 가진 Noto Serif KR Bold에서
 * 윤곽선을 한 번 뽑아 경로로 굳힌다. 어느 OS에서든 같은 모양이고, 폰트를 받지 않는다.
 *
 * 폰트 패키지는 이 스크립트에서만 쓴다. 결과물(sealGlyphs.js)을 커밋하므로 사이트 빌드는
 * 폰트에 의존하지 않는다. 의존성을 다른 곳에 깔아 뒀다면 GLYPH_DEPS로 그 디렉터리를 준다.
 *
 * 라이선스: Noto Serif KR — SIL Open Font License 1.1. 렌더링한 윤곽선을 문서에 넣는 것은
 * 허용 범위이고, 폰트 파일 자체를 재배포하지 않는다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const req = createRequire(process.env.GLYPH_DEPS ? join(process.env.GLYPH_DEPS, 'noop.js') : import.meta.url)
const opentype = req('opentype.js')
const FONT_DIR = dirname(req.resolve('@fontsource/noto-serif-kr/700.css'))

// 인장 글자는 분류 데이터가 정한다. 여기에 손으로 적지 않는다 — 분류가 늘면 같이 늘어야 한다.
const cats = JSON.parse(readFileSync(join(ROOT, 'data/categories.json'), 'utf8'))
const list = Array.isArray(cats) ? cats : cats.categories
const BRAND = '怪'
const chars = [BRAND, ...list.map((c) => c.glyph).filter(Boolean)]

// fontsource는 글자 범위별로 폰트를 쪼개 둔다(unicode-range). 글자마다 담긴 조각을 찾는다.
const css = readFileSync(join(FONT_DIR, '700.css'), 'utf8')
const slices = []
for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
  const file = block.match(/url\(\.\/files\/([^)]+?\.woff)\)/)?.[1]
  const ur = block.match(/unicode-range:\s*([^;]+);/)?.[1]
  if (!file || !ur) continue
  const ranges = ur.split(',').map((p) => {
    const [a, b] = p.trim().replace(/^U\+/i, '').split('-')
    return [parseInt(a, 16), parseInt(b ?? a, 16)]
  })
  slices.push({ file, ranges })
}
const sliceOf = (ch) => slices.find((s) => s.ranges.some(([a, b]) => a <= ch.codePointAt(0) && ch.codePointAt(0) <= b))

// CJK 글자는 1000단위 정사각 em 안에 설계된다. 기준선을 880에 두면(Noto CJK의 표의문자
// em 상단 880 · 하단 -120) 글자가 정사각 상자 안에 원래 설계대로 앉는다 — 텍스트로 찍을
// 때와 같은 위치·크기다. 그래서 .seal의 font-size를 그대로 1em으로 쓸 수 있다.
const UPM = 1000
const BASELINE = 880
const cache = new Map()
const out = {}
for (const ch of chars) {
  const s = sliceOf(ch)
  if (!s) throw new Error(`Noto Serif KR Bold에 없는 글자: ${ch}`)
  if (!cache.has(s.file)) {
    const buf = readFileSync(join(FONT_DIR, 'files', s.file))
    cache.set(s.file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
  }
  const font = cache.get(s.file)
  const glyph = font.charToGlyph(ch)
  if (!glyph || glyph.index === 0) throw new Error(`글리프 없음: ${ch} (${s.file})`)
  out[ch] = compact(glyph.getPath(0, BASELINE, UPM).commands)
}

/**
 * opentype의 toPathData는 절대좌표에 '같은 점으로 가는 L'까지 그대로 내보낸다(곡선 앞마다 하나씩).
 * 인장은 거의 모든 페이지의 메인 번들에 실리므로, 상대좌표로 바꾸고 길이 0인 선분을 버린다.
 * 정수로 반올림하는데, 88px(xl)에서도 한 단위가 0.09px라 차이가 보이지 않는다.
 * 반올림 오차가 쌓이지 않도록 상대값은 '반올림한 절대좌표'끼리의 차이로 계산한다.
 */
function compact(cmds) {
  const r = Math.round
  let cx = 0, cy = 0, sx = 0, sy = 0
  const out = []
  const num = (n) => (out.length && n >= 0 && !/[a-zA-Z]$/.test(out[out.length - 1]) ? ' ' : '') + n
  const push = (cmd, ...ns) => { out.push(cmd); ns.forEach((n, i) => out.push((i === 0 || n < 0 ? '' : ' ') + n)) }
  for (const c of cmds) {
    if (c.type === 'M') {
      const x = r(c.x), y = r(c.y)
      push('m', x - cx, y - cy); cx = sx = x; cy = sy = y
    } else if (c.type === 'L') {
      const x = r(c.x), y = r(c.y)
      if (x === cx && y === cy) continue
      push('l', x - cx, y - cy); cx = x; cy = y
    } else if (c.type === 'Q') {
      const x1 = r(c.x1), y1 = r(c.y1), x = r(c.x), y = r(c.y)
      push('q', x1 - cx, y1 - cy, x - cx, y - cy); cx = x; cy = y
    } else if (c.type === 'C') {
      const x1 = r(c.x1), y1 = r(c.y1), x2 = r(c.x2), y2 = r(c.y2), x = r(c.x), y = r(c.y)
      push('c', x1 - cx, y1 - cy, x2 - cx, y2 - cy, x - cx, y - cy); cx = x; cy = y
    } else if (c.type === 'Z') {
      out.push('z'); cx = sx; cy = sy
    }
  }
  return out.join('')
}

const bytes = Object.values(out).reduce((n, d) => n + d.length, 0)
const body =
  `// 생성 파일 — scripts/build-seal-glyphs.mjs가 만든다. 손으로 고치지 않는다.\n` +
  `// 인장 글자 ${chars.length}자의 윤곽선. 출처: Noto Serif KR Bold (SIL Open Font License 1.1).\n` +
  `// 1000단위 정사각 em, 기준선 ${BASELINE}. 글자로 그릴 때와 같은 자리·같은 크기다.\n` +
  `export const SEAL_VIEWBOX = '0 0 ${UPM} ${UPM}'\n` +
  `export const BRAND_GLYPH = ${JSON.stringify(BRAND)}\n` +
  `export const SEAL_GLYPHS = {\n` +
  Object.entries(out).map(([ch, d]) => `  ${JSON.stringify(ch)}: ${JSON.stringify(d)},`).join('\n') +
  `\n}\n`
writeFileSync(join(ROOT, 'src/ui/sealGlyphs.js'), body)
console.log(`✅ 인장 ${chars.length}자 → src/ui/sealGlyphs.js (${Math.round(bytes / 1024)}KB 경로) · ${chars.join(' ')}`)
