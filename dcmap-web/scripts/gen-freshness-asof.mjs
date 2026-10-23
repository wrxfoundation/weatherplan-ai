#!/usr/bin/env node
/**
 * data/freshness_asof.json 재생성 — 원본 데이터에서 기준일만 뽑아 메인 번들용 작은 JSON으로.
 * (원리: src/data/freshnessSources.js 머리말)
 *
 *   node scripts/gen-freshness-asof.mjs          # 다시 쓰기(바뀐 게 없으면 파일 그대로)
 *   node scripts/gen-freshness-asof.mjs --check  # 어긋나면 exit 1 (CI)
 *
 * prebuild에서도 돈다. 이 단계가 실패해도(오래된 Node 등) 빌드를 막지 않고 커밋된 JSON을 쓴다 — 그 경우 CI가 잡는다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../data/freshness_asof.json')
const check = process.argv.includes('--check')

try {
  const { deriveAsOf } = await import('../src/data/freshnessSources.js')
  const next = JSON.stringify(deriveAsOf(), null, 2) + '\n'
  let prev = ''
  try {
    prev = readFileSync(OUT, 'utf8')
  } catch {}
  if (prev === next) {
    console.log('freshness_asof.json 최신')
  } else if (check) {
    console.error('freshness_asof.json이 원본과 다릅니다 — node scripts/gen-freshness-asof.mjs 실행 후 커밋하세요')
    process.exit(1)
  } else {
    writeFileSync(OUT, next)
    console.log('freshness_asof.json 갱신')
  }
} catch (e) {
  if (check) throw e
  console.warn(`::warning::freshness_asof.json 재생성 건너뜀 (${e.message}) — 커밋된 파일 사용`)
}
