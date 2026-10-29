#!/usr/bin/env node
/**
 * 도상 검수 결과를 data/art/jobs.json에 기록한다.
 *
 *   node scripts/review-art.mjs --list                     검수 대기 목록
 *   node scripts/review-art.mjs --pass kr-dokkaebi kr-gumiho
 *   node scripts/review-art.mjs --pass --category animal   분류 통째로 통과
 *   node scripts/review-art.mjs --pass --all               전부 통과
 *   node scripts/review-art.mjs --reject kr-mireuk --reason "지장보살 턱받이"
 *   node scripts/review-art.mjs --note "오너 검수 2026-08-16" --pass --all
 *
 * 120체를 손으로 편집하면 반드시 어긋난다. 통과 여부는 배포에 그대로 반영되므로
 * (build-data.mjs가 이 파일에서 art.status를 계산한다) 기록은 한 곳에서만 한다.
 *
 * reject는 지우지 않고 남긴다 — 무엇이 왜 걸렸는지가 다음 배치의 배제문이 된다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const P = join(ROOT, 'data/art/jobs.json')
const manifest = JSON.parse(readFileSync(P, 'utf8'))
const bundle = JSON.parse(readFileSync(join(ROOT, 'public/data/yokai.json'), 'utf8'))
const categoryOf = new Map(bundle.entries.map((e) => [e.id, e.category]))
const nameOf = new Map(bundle.entries.map((e) => [e.id, e.canonical]))

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const value = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? null : argv[i + 1]
}
const ids = argv.filter((a) => a.startsWith('kr-'))

const today = new Date().toISOString().slice(0, 10)
const by = value('--by') ?? '프로젝트 오너'
const note = value('--note')
const reason = value('--reason')

if (flag('--list') || argv.length === 0) {
  const pending = manifest.items.filter((i) => i.review?.result !== 'pass')
  const byCat = {}
  for (const i of pending) (byCat[categoryOf.get(i.id) ?? i.kind] ??= []).push(i.id)
  console.log(`검수 대기 ${pending.length} / 전체 ${manifest.items.length}\n`)
  for (const [cat, list] of Object.entries(byCat)) {
    console.log(`  ${cat} (${list.length})`)
    for (const id of list) {
      const it = manifest.items.find((x) => x.id === id)
      console.log(`    ${id.padEnd(24)} ${(nameOf.get(id) ?? '').padEnd(10)} ${it.url}`)
    }
  }
  console.log('\n통과 기록: node scripts/review-art.mjs --pass <id...> | --category <분류> | --all')
  process.exit(0)
}

const passing = flag('--pass')
const rejecting = flag('--reject')
if (passing === rejecting) {
  console.error('❌ --pass 또는 --reject 중 하나를 지정하세요.')
  process.exit(1)
}
if (rejecting && !reason) {
  console.error('❌ --reject에는 --reason이 필요합니다. 걸린 항목을 적어야 다음 배치에서 배제문이 됩니다.')
  process.exit(1)
}

let targets
if (flag('--all')) {
  targets = manifest.items.map((i) => i.id)
} else if (value('--category')) {
  const cat = value('--category')
  targets = manifest.items.filter((i) => categoryOf.get(i.id) === cat).map((i) => i.id)
  if (!targets.length) {
    console.error(`❌ 분류 "${cat}"에 해당하는 도상이 없습니다.`)
    process.exit(1)
  }
} else if (ids.length) {
  targets = ids
} else {
  console.error('❌ 대상을 지정하세요 — <id...> 또는 --category <분류> 또는 --all')
  process.exit(1)
}

const known = new Map(manifest.items.map((i) => [i.id, i]))
const unknown = targets.filter((id) => !known.has(id))
if (unknown.length) {
  console.error(`❌ 매니페스트에 없는 id: ${unknown.join(' ')}`)
  process.exit(1)
}

for (const id of targets) {
  known.get(id).review = {
    by,
    date: today,
    result: passing ? 'pass' : 'reject',
    ...(note ? { note } : {}),
    ...(reason ? { reason } : {}),
  }
}

writeFileSync(P, JSON.stringify(manifest, null, 2) + '\n')
const passed = manifest.items.filter((i) => i.review?.result === 'pass').length
console.log(
  `${passing ? '통과' : '반려'} ${targets.length}건 기록 · 누적 통과 ${passed}/${manifest.items.length}\n` +
    '   npm run data 로 반영하세요.',
)
