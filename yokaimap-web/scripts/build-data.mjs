/**
 * 시드 → 배포 데이터 빌드.
 *   data/yokai/*.json  (진실 원천, 카테고리별 분할)
 *     → public/data/yokai.json      앱이 읽는 병합본(기본값 주입 + 정렬)
 *     → public/data/yokai.min.json  오픈데이터셋 배포본(CC BY 4.0)
 *
 * 검증을 통과하지 못하면 빌드가 실패한다 — 출처 없는 레코드가 배포되는 경로를 원천 차단.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
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

/**
 * 도상 매니페스트 — 생성 기록의 유일한 원천.
 *
 * 이미지 파일은 생성 세션에서 리포로 못 들어온다(CDN 차단). 그래서 시드의 art.status를
 * 손으로 final로 올려 두면, 매니페스트에 없는 그림을 있다고 주장하는 레코드가 배포된다.
 * 상태는 시드가 아니라 매니페스트에서 계산한다. 검수를 통과한 것만 final이다.
 */
const jobs = JSON.parse(readFileSync(join(ROOT, 'data/art/jobs.json'), 'utf8'))
const artById = new Map(jobs.items.filter((i) => i.kind === 'plate').map((i) => [i.id, i]))

const missingArt = []

function artFor(entry) {
  const seed = entry.art ?? {}
  const job = artById.get(entry.id)
  if (!job) return { ...ART_DEFAULT, ...seed, status: 'pending', file: null }
  const passed = job.review?.result === 'pass'
  // 파일이 실제로 리포에 있어야 경로를 낸다. 도상 반입은 별도 단계(GitHub Actions)라
  // 검수를 통과했어도 아직 안 들어와 있을 수 있고, 그때 경로를 내면 깨진 이미지가 배포된다.
  const onDisk = existsSync(join(ROOT, job.target))
  if (passed && !onDisk) missingArt.push(entry.id)
  return {
    ...ART_DEFAULT,
    ...seed,
    direction: jobs.direction ?? seed.direction ?? ART_DEFAULT.direction,
    // 검수 전에는 generated — 앱은 file이 있는 것만 그리고 나머지는 인장으로 떨어진다.
    status: passed ? 'final' : 'generated',
    // 경로는 매니페스트의 target에서 그대로 끌어온다 — 여기서 확장자를 다시 조립하면
    // fetch-art가 쓰는 경로와 어긋나서, 있는 파일을 못 찾는 사고가 난다.
    file: passed && onDisk ? '/' + job.target.replace(/^public\//, '') : null,
    job_id: job.job_id,
  }
}

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
    art: artFor(e),
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

const artStat = normalized.reduce((a, e) => ({ ...a, [e.art.status]: (a[e.art.status] ?? 0) + 1 }), {})
console.log(
  `   도상: ${Object.entries(artStat).map(([k, v]) => `${k}:${v}`).join(' ')}` +
    ` · 파일 반입 ${normalized.filter((e) => e.art.file).length}/${normalized.length}`,
)
if (missingArt.length) {
  // 검수는 통과했는데 파일이 없다 = 반입이 안 끝났다. 배포는 인장 폴백으로 정상 동작하므로
  // 빌드를 세우지는 않지만, 조용히 넘어가면 "왜 그림이 안 나오지"로 시간을 버린다.
  console.warn(
    `⚠️  검수 통과했으나 파일이 없는 도상 ${missingArt.length}건 — 인장 폴백으로 표시됩니다.\n` +
      `   반입: Actions 탭 → yokai-art 실행 (또는 CDN 접근 가능한 곳에서 node scripts/fetch-art.mjs)\n` +
      `   ${missingArt.slice(0, 8).join(' ')}${missingArt.length > 8 ? ` 외 ${missingArt.length - 8}건` : ''}`,
  )
}
