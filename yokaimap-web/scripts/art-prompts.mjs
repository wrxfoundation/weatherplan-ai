#!/usr/bin/env node
/**
 * 도상 프롬프트 생성기 — 시드 데이터 + 아트디렉션(data/art/direction.json)에서 프롬프트를 만든다.
 *
 * 프롬프트를 사람이 매번 손으로 쓰면 600장째에 화풍이 반드시 흔들린다.
 * 스타일 블록은 파일에 고정하고 개체별 서술만 데이터에서 끌어오는 것이 v1의 핵심 규칙이다.
 *
 *   node scripts/art-prompts.mjs                 # 전체 목록(id \t prompt)
 *   node scripts/art-prompts.mjs kr-dokkaebi …   # 지정 개체만
 *   node scripts/art-prompts.mjs --json          # JSON 배열로
 *   node scripts/art-prompts.mjs --pending       # art.status가 final이 아닌 것만
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = JSON.parse(readFileSync(join(ROOT, 'data/art/direction.json'), 'utf8'))
const bundle = JSON.parse(readFileSync(join(ROOT, 'public/data/yokai.json'), 'utf8'))

/**
 * 개체 1체 → 이미지 프롬프트(영문).
 * 주어는 반드시 art_hint(영문 시각 서술)다 — traits/habitat는 한국어라 이미지 모델이 해석하지 못한다.
 * art_hint가 없으면 null을 돌려주고 생성 대상에서 제외한다(엉뚱한 도상을 만드는 것보다 낫다).
 */
export function promptFor(entry) {
  if (!entry.art_hint) return null
  const name = entry.names?.en || entry.names?.roman || null
  const subject = [name, entry.art_hint].filter(Boolean).join(' — ')

  return [
    `Korean folklore being — ${subject}`,
    dir.style,
    dir.category_modifiers[entry.category] ?? '',
    dir.composition.plate,
    dir.constraints,
  ]
    .filter(Boolean)
    .join('. ')
}

export function requestFor(entry, aspect = '4:5') {
  const prompt = promptFor(entry)
  if (!prompt) return null
  return {
    model: dir.model.id,
    prompt,
    aspect_ratio: aspect,
    resolution: dir.model.resolution,
    model_type: dir.model.model_type,
    colors: dir.palette,
    background_color: dir.background_color,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const pending = args.includes('--pending')
  const ids = args.filter((a) => !a.startsWith('--'))

  let list = bundle.entries
  if (ids.length) list = list.filter((e) => ids.includes(e.id))
  if (pending) list = list.filter((e) => e.art?.status !== 'final')

  const ready = list.filter((e) => e.art_hint)
  const missing = list.length - ready.length

  if (json) {
    console.log(JSON.stringify(ready.map((e) => ({ id: e.id, ...requestFor(e) })), null, 2))
  } else {
    for (const e of ready) console.log(`${e.id}\t${promptFor(e)}`)
    if (missing) console.error(`\n⚠️  art_hint 없는 ${missing}체는 제외했습니다(영문 시각 서술을 먼저 써야 합니다).`)
  }
}
