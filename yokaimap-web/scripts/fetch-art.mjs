#!/usr/bin/env node
/**
 * 생성된 도상을 리포로 내려받는다 — data/art/jobs.json의 url → target.
 *
 *   node scripts/fetch-art.mjs           # 없는 것만 받는다
 *   node scripts/fetch-art.mjs --force   # 이미 있어도 다시 받는다
 *
 * 생성은 힉스필드 MCP로 하고 결과 URL만 jobs.json에 적어 둔다. 다운로드를 떼어 둔 이유는
 * 생성 환경과 반입 환경이 다르기 때문이다 — 생성 세션의 egress 정책이 CDN 호스트를 막는다.
 * GitHub 러너는 열린 네트워크라 거기서 돌린다(.github/workflows/yokai-art.yml).
 *
 * 원본은 2k PNG(1792×2304)라 장당 2~4MB다. 121장을 그대로 커밋하면 리포가 300MB 넘게
 * 불어난다. 받는 즉시 표시 크기로 줄이고 WebP로 바꿔서 장당 100KB 아래로 떨어뜨린다.
 * 원본이 필요하면 jobs.json의 url로 다시 받을 수 있으므로 리포에 둘 이유가 없다.
 *
 * 파일이 없으면 사이트는 조용히 인장 폴백으로 돌아가므로, 받기 전이라도 화면은 깨지지 않는다.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'data/art/jobs.json'), 'utf8'))
const force = process.argv.includes('--force')

// 표시 크기 기준 — 도판은 상세 페이지에서 400px 안팎, 히어로는 전폭. 각각 2배수까지만.
const WIDTH = { plate: 900, hero: 1600 }
const QUALITY = 82
const TIMEOUT_MS = 30_000

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error(
    '❌ sharp가 없습니다. 원본 2k PNG를 그대로 커밋하면 리포가 300MB 넘게 불어나므로 변환 없이는 받지 않습니다.\n' +
      '   npm i --no-save sharp   후 다시 실행하세요.',
  )
  process.exit(1)
}

let ok = 0
let skipped = 0
let bytes = 0
const failed = []

for (const item of manifest.items) {
  const target = join(ROOT, item.target)
  if (!force && existsSync(target)) {
    skipped++
    continue
  }
  try {
    // 타임아웃이 없으면 한 URL이 응답을 안 줄 때 전체가 매달린다. CI에서 다운로드 단계가
    // 끝나지 않는 사고가 실제로 났다. 죽은 URL 하나 때문에 나머지 120장을 못 받으면 안 된다.
    const r = await fetch(item.url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    // 생성 URL은 만료된다. 404/403이면 프롬프트가 아니라 URL이 죽은 것이므로 재생성이 답이다.
    if (!r.ok) throw new Error(`HTTP ${r.status}${r.status === 403 || r.status === 404 ? ' (URL 만료 의심 — 재생성 필요)' : ''}`)
    const buf = Buffer.from(await r.arrayBuffer())
    const out = await sharp(buf)
      .resize({ width: WIDTH[item.kind] ?? WIDTH.plate, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, out)
    bytes += out.length
    console.log(`  ${item.target}  ${Math.round(buf.length / 1024)}KB → ${Math.round(out.length / 1024)}KB`)
    ok++
  } catch (e) {
    failed.push(`${item.id}: ${e.message}`)
  }
}

console.log(`\n받음 ${ok} (${Math.round(bytes / 1024 / 1024)}MB) · 건너뜀 ${skipped} · 실패 ${failed.length}`)
for (const f of failed) console.error(`  ❌ ${f}`)
if (failed.length) {
  console.error(
    '\n실패가 전부 네트워크 차단이라면 CDN에 접근 가능한 환경에서 다시 실행하세요.' +
      '\n403/404가 섞여 있으면 생성 URL이 만료된 것이니, 힉스필드에서 재생성 후 jobs.json을 갱신해야 합니다.',
  )
  process.exit(1)
}
