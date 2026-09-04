// ─── 제휴사(에이씨렌트카) 차량 이미지 자체 호스팅 다운로드 ────────────────
// prebuild 에서 자동 실행. 이미 있으면 건너뛰고, 실패해도 경고만 남기고 계속한다
// (매핑이 비어 있거나 네트워크가 막힌 환경에서도 빌드는 통과 — 화면은 SVG 폴백).
//
// 왜 핫링크가 아니라 다운로드인가:
//  · 핫링크는 제휴사 서버 대역폭으로 우리 트래픽을 감당하게 한다
//  · 그쪽이 경로를 바꾸거나 잠깐 죽으면 우리 상품 목록이 통째로 빈다
//  · Referer 차단·CORS 로 조용히 깨지는 사고가 잦다
// 받아서 우리 도메인에서 서빙하면 이 셋 다 사라진다.
//
// 실행: node scripts/fetch-car-images.mjs  (npm run build 시 자동)
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PARTNER_IMAGES, MANUAL_IMAGES, PARTNER_BASE } from '../src/lib/cars.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dir = join(root, 'public', 'assets', 'cars')
const entries = Object.entries({ ...PARTNER_IMAGES, ...MANUAL_IMAGES })

if (entries.length === 0) {
  console.log('[cars] 제휴사 이미지 매핑이 비어 있습니다 — 차량 카드는 SVG 실루엣으로 표시됩니다.')
  console.log('[cars] node scripts/map-car-images.mjs <목록페이지URL 또는 저장한 HTML> 로 매핑을 자동 생성하세요.')
  process.exit(0)
}

mkdirSync(dir, { recursive: true })
let ok = 0, skip = 0, fail = 0
await Promise.all(entries.map(async ([id, path]) => {
  const dest = join(dir, `${id}.jpg`)
  if (existsSync(dest)) { skip++; return }
  try {
    const res = await fetch(`${PARTNER_BASE}/${path}`, { headers: { 'User-Agent': 'moduon-asset-fetch' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1024) throw new Error(`too small (${buf.length}B) — 이미지가 아닐 수 있음`)
    writeFileSync(dest, buf)
    ok++
  } catch (e) {
    fail++
    console.warn(`[cars] ${id} 다운로드 실패 (${e.message}) — 이 차종은 SVG 실루엣으로 표시됩니다`)
  }
}))
console.log(`[cars] 차량 이미지 ${ok}건 신규 · ${skip}건 유지 · ${fail}건 실패`)
