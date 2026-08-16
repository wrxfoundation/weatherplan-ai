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

  // 한국성 앵커 — 이게 빠지면 모델이 동아시아 평균값(왜색·중국풍)으로 떨어진다.
  // 기본값은 분류 단위라 뭉툭하다. 각시도깨비(여성)에 갓·바지가 붙고 도깨비불(불꽃뿐)에
  // 사람이 끼어드는 사고가 실제로 났으므로, 개체가 art_anchors를 선언했으면 그쪽이 이긴다.
  const keys = entry.art_anchors ?? dir.category_anchors?.[entry.category] ?? []
  const anchors = keys
    .map((k) => dir.korean_anchors[k])
    .filter(Boolean)
    .join('. ')

  // 배제 문구는 스타일 바로 뒤에 둔다 — 프롬프트가 잘리더라도 왜색·중국색 배제가 먼저 살아남게.
  return [
    `Korean folklore being — ${subject}`,
    anchors,
    dir.style,
    dir.exclude_japanese.prompt,
    dir.exclude_chinese.prompt,
    dir.category_modifiers[entry.category] ?? '',
    dir.composition.plate,
    dir.constraints_general,
  ]
    .filter(Boolean)
    .join('. ')
}

/** 히어로 등 풍경 컷 프롬프트 — 개체가 아니라 장면이다. */
export function scenePrompt(sceneText) {
  return [
    `Korean folklore night landscape — ${sceneText}`,
    dir.korean_anchors.landscape,
    dir.korean_anchors.architecture,
    dir.style,
    dir.exclude_japanese.prompt,
    dir.exclude_chinese.prompt,
    dir.composition.scene,
    dir.constraints_general,
  ].join('. ')
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
