#!/usr/bin/env node
/**
 * 검수용 컨택트 시트 — 도판을 격자로 붙여 한 장으로 만든다.
 *
 *   node scripts/contact-sheet.mjs                 분류별로 1장씩
 *   node scripts/contact-sheet.mjs --category animal
 *   node scripts/contact-sheet.mjs --pending       검수 대기분만
 *
 * 120장을 한 장씩 열어 보면 왜색 스캔이 오히려 어렵다. 같은 분류를 나란히 놓아야
 * "이 컷만 화풍이 튄다", "이것만 복식이 다르다"가 눈에 들어온다.
 * 출력은 public/이 아니라 리포 밖(검수용 임시물)이므로 배포에 섞이지 않는다.
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = process.env.SHEET_OUT || join(ROOT, '.review')
const manifest = JSON.parse(readFileSync(join(ROOT, 'data/art/jobs.json'), 'utf8'))
const bundle = JSON.parse(readFileSync(join(ROOT, 'public/data/yokai.json'), 'utf8'))
const byId = new Map(bundle.entries.map((e) => [e.id, e]))

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1] }
const onlyPending = argv.includes('--pending')
const onlyCat = val('--category')

const CELL = 300      // 셀 하나의 가로. 4:5라 세로는 375
const CELL_H = 375
const COLS = 5
const LABEL = 26      // 이름 띠

const plates = manifest.items.filter((i) => i.kind === 'plate')
const groups = {}
for (const it of plates) {
  if (onlyPending && it.review?.result === 'pass') continue
  const e = byId.get(it.id)
  const cat = e?.category ?? 'unknown'
  if (onlyCat && cat !== onlyCat) continue
  ;(groups[cat] ??= []).push(it)
}

mkdirSync(OUT, { recursive: true })
let made = 0
for (const [cat, items] of Object.entries(groups)) {
  const rows = Math.ceil(items.length / COLS)
  const W = COLS * CELL
  const H = rows * (CELL_H + LABEL)
  const layers = []
  for (const [i, it] of items.entries()) {
    const file = join(ROOT, it.target)
    if (!existsSync(file)) continue
    const x = (i % COLS) * CELL
    const y = Math.floor(i / COLS) * (CELL_H + LABEL)
    layers.push({ input: await sharp(file).resize(CELL, CELL_H, { fit: 'cover' }).toBuffer(), left: x, top: y })
    const name = byId.get(it.id)?.canonical ?? it.id
    // 이름을 SVG 텍스트로 얹는다 — 어느 컷이 문제인지 지목할 수 있어야 검수가 성립한다.
    const svg = `<svg width="${CELL}" height="${LABEL}"><rect width="${CELL}" height="${LABEL}" fill="#1f1b16"/><text x="6" y="18" font-family="sans-serif" font-size="14" fill="#f2ece0">${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`
    layers.push({ input: Buffer.from(svg), left: x, top: y + CELL_H })
  }
  if (!layers.length) continue
  const out = join(OUT, `sheet-${cat}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f2ece0' } })
    .composite(layers)
    .png()
    .toFile(out)
  console.log(`  ${out}  ${items.length}컷`)
  made++
}
console.log(`\n컨택트 시트 ${made}장 (${OUT})`)
