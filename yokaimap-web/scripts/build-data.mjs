/**
 * 시드 → 배포 데이터 빌드.
 *   data/yokai/*.json  (진실 원천, 카테고리별 분할)
 *     → public/data/yokai.json      앱이 읽는 병합본(기본값 주입 + 정렬)
 *     → public/data/yokai.min.json  오픈데이터셋 배포본(CC BY 4.0)
 *
 * 검증을 통과하지 못하면 빌드가 실패한다 — 출처 없는 레코드가 배포되는 경로를 원천 차단.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, runValidation } from './validate.mjs'

const DATA_VERSION = '0.1.0'
const LICENSE = 'CC BY 4.0'
const ART_DEFAULT = { status: 'pending', direction: 'minhwa-v1', file: null, license: 'CC BY 4.0 (AI 생성 · 원본 도상 없음)' }

const { entries, errors, warnings, stats } = runValidation()
for (const w of warnings) console.warn(`⚠️  ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`)
  console.error(`\n빌드 중단 — 검증 오류 ${errors.length}건`)
  process.exit(1)
}

const categories = JSON.parse(readFileSync(join(ROOT, 'data/categories.json'), 'utf8'))
const regions = JSON.parse(readFileSync(join(ROOT, 'data/regions.json'), 'utf8'))

const normalized = entries
  .map(({ _file, ...e }) => ({
    ...e,
    aliases: e.aliases ?? [],
    names: e.names ?? {},
    traits: e.traits ?? [],
    habitat: e.habitat ?? [],
    omens: { time: [], weather: [], season: [], ...(e.omens ?? {}) },
    sites: e.sites ?? [],
    related: e.related ?? [],
    sensitivity: e.sensitivity ?? null,
    art: { ...ART_DEFAULT, ...(e.art ?? {}) },
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

const byCategory = Object.fromEntries(
  categories.categories.map((c) => [c.id, normalized.filter((e) => e.category === c.id).length]),
)
const bySido = Object.fromEntries(
  regions.sido.map((s) => [s.name, normalized.filter((e) => e.sites.some((x) => x.sido === s.name)).length]),
)
const byVerification = normalized.reduce((acc, e) => ({ ...acc, [e.verification]: (acc[e.verification] ?? 0) + 1 }), {})
const siteCount = normalized.reduce((n, e) => n + e.sites.length, 0)

const bundle = {
  version: DATA_VERSION,
  generated_at: new Date().toISOString().slice(0, 10),
  license: LICENSE,
  attribution: '한국요괴지도 (Korean Yokai Map)',
  count: normalized.length,
  site_count: siteCount,
  stats: { byCategory, bySido, byVerification },
  categories: categories.categories,
  rarity: categories.rarity,
  verification: categories.verification,
  regions: regions.sido,
  entries: normalized,
}

mkdirSync(join(ROOT, 'public/data'), { recursive: true })
writeFileSync(join(ROOT, 'public/data/yokai.json'), JSON.stringify(bundle, null, 1))
writeFileSync(join(ROOT, 'public/data/yokai.min.json'), JSON.stringify(bundle))

console.log(`✅ 빌드 완료 — ${normalized.length}체 / 전승지 ${siteCount}곳 / 시도 커버리지 ${stats.sidoCovered}/17`)
console.log(`   카테고리: ${Object.entries(byCategory).map(([k, v]) => `${k}:${v}`).join(' ')}`)
console.log(`   검증등급: ${Object.entries(byVerification).map(([k, v]) => `${k}:${v}`).join(' ')}`)
