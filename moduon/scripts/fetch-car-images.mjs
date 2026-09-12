// ─── 제휴사(에이씨렌트카) 차량 이미지 자체 호스팅 다운로드 ────────────────
// prebuild 에서 자동 실행. 조건부 요청(ETag / Last-Modified)으로 **바뀐 것만** 받는다.
//   node scripts/fetch-car-images.mjs           # 변경분만 (기본)
//   node scripts/fetch-car-images.mjs --force   # 검증자 무시하고 전부 다시
//
// 왜 핫링크가 아니라 다운로드인가:
//  · 핫링크는 제휴사 서버 대역폭으로 우리 트래픽을 감당하게 한다
//  · 그쪽이 경로를 바꾸거나 잠깐 죽으면 우리 상품 목록이 통째로 빈다
//  · Referer 차단·CORS 로 조용히 깨지는 사고가 잦다
// 받아서 우리 도메인에서 서빙하면 이 셋 다 사라진다.
//
// 갱신 규약: .manifest.json 에 경로·ETag·Last-Modified 를 남겨 다음 실행 때 되돌려준다.
// 서버가 304 를 주면 내려받지 않는다 — 제휴사 대역폭을 아끼고 실행도 빨라진다.
// 실패해도 경고만 남기고 계속한다(그 차종만 SVG 실루엣, 빌드는 통과).
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PARTNER_IMAGES, MANUAL_IMAGES, PARTNER_BASE, baseId, GALLERY_N } from '../src/lib/cars.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'public', 'assets', 'cars')
const manifestPath = join(dir, '.manifest.json')
const force = process.argv.includes('--force')
const entries = Object.entries({ ...PARTNER_IMAGES, ...MANUAL_IMAGES })

if (entries.length === 0) {
  console.log('[cars] 제휴사 이미지 매핑이 비어 있습니다 — 차량 카드는 SVG 실루엣으로 표시됩니다.')
  console.log('[cars] node scripts/map-car-images.mjs <목록페이지URL 또는 저장한 HTML> 로 매핑을 자동 생성하세요.')
  process.exit(0)
}

mkdirSync(dir, { recursive: true })
let manifest = {}
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { /* 첫 실행 */ }

let fresh = 0, same = 0, added = 0, fail = 0, missing = 0
const next = {}

// 한 차량당 받는 파일: 목록 썸네일(_list) · 상세 큰 이미지(_main) · 갤러리(_detail_1..N)
const variantsOf = (id) => [
  { key: id, suffix: '_list', required: true },
  { key: `${id}-main`, suffix: '_main', required: true },
  ...Array.from({ length: GALLERY_N }, (_, i) => ({ key: `${id}-g${i + 1}`, suffix: `_detail_${i + 1}`, required: false })),
]

async function grab({ key, suffix, required }, base) {
  const dest = join(dir, `${key}.jpg`)
  const prev = manifest[key]
  const onDisk = existsSync(dest)
  const reusable = !force && onDisk && prev && prev.base === base
  const headers = { 'User-Agent': 'moduon-asset-fetch' }
  if (reusable && prev.etag) headers['If-None-Match'] = prev.etag
  if (reusable && prev.lastModified) headers['If-Modified-Since'] = prev.lastModified

  try {
    const res = await fetch(`${PARTNER_BASE}/${base}${suffix}`, { headers })
    if (res.status === 304) { same++; next[key] = prev; return }
    // 갤러리 장수는 차량마다 다르다 — 없는 장은 정상이며 조용히 넘어간다
    if (res.status === 404 && !required) { missing++; return }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1024) { if (!required) { missing++; return } throw new Error(`too small (${buf.length}B)`) }
    const unchanged = onDisk && statSync(dest).size === buf.length && Buffer.compare(readFileSync(dest), buf) === 0
    if (!unchanged) writeFileSync(dest, buf)
    if (!onDisk) added++
    else if (unchanged) same++
    else fresh++
    next[key] = { base, etag: res.headers.get('etag') ?? null, lastModified: res.headers.get('last-modified') ?? null, size: buf.length, fetchedAt: new Date().toISOString() }
  } catch (e) {
    if (!required) { missing++; return }
    fail++
    if (prev && onDisk) { next[key] = prev; console.warn(`[cars] ${key} 갱신 실패 (${e.message}) — 이전 이미지를 유지합니다`) }
    else console.warn(`[cars] ${key} 다운로드 실패 (${e.message}) — SVG 실루엣으로 표시됩니다`)
  }
}

await Promise.all(entries.flatMap(([id, path]) => {
  const base = baseId(path)
  return variantsOf(id).map((v) => grab(v, base))
}))

try { writeFileSync(manifestPath, JSON.stringify(next, null, 2) + '\n') } catch { /* 무시 */ }
const changed = added + fresh
console.log(`[cars] 차량 이미지 — 신규 ${added} · 갱신 ${fresh} · 변경없음 ${same} · 없는 갤러리 ${missing} · 실패 ${fail}`)
if (changed > 0) console.log(`[cars] ${changed}건이 바뀌었습니다 — 배포하면 사이트에 반영됩니다.`)
