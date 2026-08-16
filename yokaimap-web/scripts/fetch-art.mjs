#!/usr/bin/env node
/**
 * 생성된 도상을 리포로 내려받는다 — data/art/jobs.json의 url → target.
 *
 *   node scripts/fetch-art.mjs           # 없는 것만 받는다
 *   node scripts/fetch-art.mjs --force   # 이미 있어도 다시 받는다
 *
 * 이미지 생성 자체는 힉스필드 MCP로 하고, 그 결과 URL을 jobs.json에 적어 둔다.
 * 다운로드를 별도 단계로 떼어 둔 이유: 생성 환경과 리포 반입 환경이 다를 수 있다
 * (예: 생성 세션의 egress 정책이 CDN 호스트를 막는 경우).
 *
 * 파일이 없으면 사이트는 조용히 인장 폴백으로 돌아가므로, 받기 전이라도 화면은 깨지지 않는다.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'data/art/jobs.json'), 'utf8'))
const force = process.argv.includes('--force')

let ok = 0
let skipped = 0
const failed = []

for (const item of manifest.items) {
  const target = join(ROOT, item.target)
  if (!force && existsSync(target)) {
    skipped++
    continue
  }
  try {
    const r = await fetch(item.url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const buf = Buffer.from(await r.arrayBuffer())
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, buf)
    console.log(`  ${item.target}  (${Math.round(buf.length / 1024)}KB)`)
    ok++
  } catch (e) {
    failed.push(`${item.id}: ${e.message}`)
  }
}

console.log(`\n받음 ${ok} · 건너뜀 ${skipped} · 실패 ${failed.length}`)
for (const f of failed) console.error(`  ❌ ${f}`)
if (failed.length) {
  console.error(
    '\n실패가 전부 네트워크 차단이라면 CDN에 접근 가능한 환경에서 다시 실행하세요.' +
      '\n생성 결과 URL은 만료될 수 있으니, 만료됐다면 힉스필드에서 재생성 후 jobs.json을 갱신해야 합니다.',
  )
  process.exit(1)
}
